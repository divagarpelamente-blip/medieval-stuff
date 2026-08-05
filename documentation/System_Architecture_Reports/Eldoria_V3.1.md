# Eldoria V3.1: Technical Implementation Specification

## 1. Executive Summary & Architectural Targets

**Eldoria V3.1** represents a critical architectural evolution of the core financial engine, transitioning the platform from a generalized ledger into a high-precision, localized fintech ecosystem. Operating under a strict double-entry accounting paradigm, this upgrade introduces complex multi-currency support, advanced categorization pipelines, and localized tax/regulatory optimizations specific to the Portuguese financial landscape.

### Core Upgrades:
- **Double-Entry Sanctity**: Enforcing strict debit/credit balance verification across all new ledger extensions.
- **Portuguese Localization**: 
  - **14-Month Salary Normalization**: Smoothing out holiday and Christmas allowances to calculate true annualized monthly run rates.
  - **Meal Card Isolation (`11040001`)**: Ring-fencing meal allowance balances from general liquid cash liquidity calculations.
  - **IRS PPR Tax Optimization**: Flagging and forecasting tax benefits derived from Retirement Savings Plans (PPR).
  - **State Debt Execution**: Elevating state tax debts (`2103`) to the highest repayment priority in the AI Advisor and debt payoff velocity models.
- **AI Advisor Guardrails**: Hardening the "Royal Advisor" with strict deterministic constraints, European formatting, and token-efficient responses.

---

## 2. Database Schema Enrichment & Extensions

The data layer requires extensions to support multi-currency ledgers and localized Portuguese asset/liability tracking.

### DDL Scripts for `dim_contas` and `transactions`

```sql
-- 1. Multi-Currency Ledger Support on Transactions
ALTER TABLE public.transactions
ADD COLUMN original_currency VARCHAR(3) DEFAULT 'EUR',
ADD COLUMN original_amount NUMERIC(15, 4),
ADD COLUMN exchange_rate NUMERIC(10, 6) DEFAULT 1.0,
ADD COLUMN base_currency_amount NUMERIC(15, 4),
ADD COLUMN realized_fx_gain_loss NUMERIC(15, 4) DEFAULT 0;

-- Ensure legacy rows are updated
UPDATE public.transactions 
SET original_amount = amount, 
    base_currency_amount = amount 
WHERE original_currency = 'EUR';

-- 2. Schema Rules & Constraint Enforcement
-- Flagging Meal Cards to exclude from primary Vault Cash
ALTER TABLE public.dim_contas
ADD COLUMN is_liquid BOOLEAN DEFAULT true,
ADD COLUMN priority_level INT DEFAULT 0;

-- Update constraints for localization
UPDATE public.dim_contas SET is_liquid = false WHERE conta_id = '11040001'; -- Meal Card
UPDATE public.dim_contas SET priority_level = 99 WHERE conta_id LIKE '2103%'; -- State Debt (High Priority)
```

---

## 3. Advanced Metrics Engine (Mathematical Specifications)

The backend analytics engine must compute the following metrics dynamically.

### 14-Month Normalized Savings Rate
Adjusts the savings rate to account for the Portuguese 14-month salary structure (Subsídio de Férias e de Natal).
* **Formula**: `Annualized Savings Rate = (Total Annual Savings + Holiday Allowance + Christmas Allowance) / (Base Monthly Salary * 14)`

### Debt Payoff Velocity
Measures the speed at which debt principal is being reduced.
* **Formula**: `Velocity = (Total Monthly Amortization) / (Total Outstanding Liabilities)`

### Passive Income Coverage Ratio
Measures how much of the fixed expenses are covered by passive asset yields.
* **Formula**: `PICR = (Monthly Passive Income) / (Monthly Fixed Expenses)`

### Fixed vs. Variable Cost Ratio
* **Formula**: `Cost Ratio = (Total Fixed Costs) / (Total Variable Costs)`

### Cash Flow Volatility Index
Standard deviation of the past 12 months' net cash flows divided by the mean.
* **Formula**: `Volatility Index = σ(Net Cash Flow_1..12) / μ(Net Cash Flow_1..12)`

### Monte Carlo 90-Day Treasury Survival Model
Calculates the Probability of Insolvency ($P_{insolvency}$) over the next 90 days.
* **Formula**: `P_{insolvency} = (Number of Simulation Paths where Liquid Cash < 0) / (Total Paths)`

---

## 4. Postgres RPC System Update (`get_financial_health_report`)

The core analytical RPC must be updated to implement the new Portuguese localization logic and multi-currency aggregates.

```plpgsql
CREATE OR REPLACE FUNCTION public.get_financial_health_report(p_profile_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_vault_cash numeric := 0;
    v_meal_card numeric := 0;
    v_monthly_income numeric := 0;
    v_monthly_expenses numeric := 0;
    v_savings_rate numeric := 0;
    v_dti_ratio numeric := 0;
    v_runway_months numeric := 0;
    
    v_flag_runway jsonb;
    v_flag_dti jsonb;
    v_flag_savings jsonb;
    v_forecast jsonb;
    v_result jsonb;
BEGIN
    -- Security Check
    IF auth.uid() != p_profile_id THEN RAISE EXCEPTION 'Access denied'; END IF;

    -- 1. Vault Cash (Isolating Meal Card 11040001)
    SELECT COALESCE(SUM(total_balance), 0) INTO v_vault_cash
    FROM vw_account_balances
    WHERE profile_id = p_profile_id AND target_account LIKE '110%' AND target_account != '11040001';

    SELECT COALESCE(SUM(total_balance), 0) INTO v_meal_card
    FROM vw_account_balances
    WHERE profile_id = p_profile_id AND target_account = '11040001';

    -- 2. Monthly Analytics & Normalized Income
    SELECT COALESCE(total_income, 0), COALESCE(total_expenses, 0), COALESCE(total_debt_payments, 0)
    INTO v_monthly_income, v_monthly_expenses, v_dti_ratio
    FROM vw_monthly_analytics
    WHERE profile_id = p_profile_id ORDER BY month_date DESC LIMIT 1;
    
    -- Metrics Calculations
    IF v_monthly_income > 0 THEN
        v_savings_rate := ((v_monthly_income - v_monthly_expenses) / v_monthly_income) * 100;
        v_dti_ratio := (v_dti_ratio / v_monthly_income) * 100;
    END IF;

    IF v_monthly_expenses > 0 THEN
        v_runway_months := v_vault_cash / v_monthly_expenses;
    ELSE
        v_runway_months := 999;
    END IF;

    -- 3. Deterministic Flags
    v_flag_runway := jsonb_build_object('flag', 'FLAG_CRITICAL_RUNWAY', 'status', CASE WHEN v_runway_months < 3 THEN 'RED' WHEN v_runway_months < 6 THEN 'YELLOW' ELSE 'GREEN' END);
    v_flag_dti := jsonb_build_object('flag', 'FLAG_HIGH_DTI', 'status', CASE WHEN v_dti_ratio > 40 THEN 'RED' WHEN v_dti_ratio > 30 THEN 'YELLOW' ELSE 'GREEN' END);
    v_flag_savings := jsonb_build_object('flag', 'FLAG_SAVINGS_RATE', 'status', CASE WHEN v_savings_rate <= 0 THEN 'RED' WHEN v_savings_rate < 10 THEN 'YELLOW' ELSE 'GREEN' END);

    -- 4. Forecast Fetch
    SELECT jsonb_build_object('current_liquid_cash', current_liquid_cash, 'cash_in_90d', cash_in_90d) INTO v_forecast
    FROM vw_cash_flow_forecast_90d WHERE profile_id = p_profile_id;

    -- Build Final JSON
    v_result := jsonb_build_object(
        'kpi_summary', jsonb_build_object('vault_cash', v_vault_cash, 'meal_card', v_meal_card, 'savings_rate', v_savings_rate, 'dti_ratio', v_dti_ratio, 'survival_runway_months', v_runway_months),
        'deterministic_flags', jsonb_build_array(v_flag_runway, v_flag_dti, v_flag_savings),
        'cash_flow_forecast', COALESCE(v_forecast, '{}'::jsonb)
    );

    RETURN v_result;
END;
$$;
```

---

## 5. Open Banking Enrichment & Categorization Pipeline

The ingestion pipeline transforms raw open-banking feeds into double-entry ledger transactions through a 4-stage process:

1. **Cleansing & Normalization**: Strips special characters, normalizes encoding, and identifies the `original_currency` via ISO-4217 headers.
2. **Merchant ID Extraction**: Uses Regex patterns to extract canonical merchant names from messy bank descriptions (e.g., `COMPRA CONTINENTE 123` -> `Continente`).
3. **Hybrid ML/Rule Categorization**: 
   - **Phase 1**: Checks explicit user-defined mapping rules.
   - **Phase 2**: Falls back to Naive Bayes text classification to map the transaction to a `dim_contas` node (e.g., `6201` for Groceries).
4. **Internal Transfer Auto-Detection**: Scans the ledger for matching opposing transactions within a 48-hour window (e.g., -500€ from Checking, +500€ to Savings). Automatically links them as a Vault Transfer, removing them from Expense/Income calculations.

---

## 6. New UI Widget Specifications & Component Map

New React components will be integrated into the Phase 3 (Advanced Analytics) dashboard.

- **Debt Payoff Velocity Widget**: A gauge chart component visualizing current amortization speed against target goals.
- **Passive Coverage Widget**: A layered area chart displaying fixed expenses (red line) underneath passive income streams (green area).
- **Cost Flexibility Widget**: A pie chart breaking down Fixed vs. Variable expenses to visualize budget rigidity.
- **Volatility Index Widget**: A sparkline chart mapping cash flow standard deviation, triggering warnings during high volatility.

**Phase-based Dashboard Rendering Logic**:
- **Turnaround Mode**: Prominently displays State Debt, Runway, and Cost Cutting widgets.
- **Stabilization Mode**: Highlights DTI, Savings Rate, and Budget Variances.
- **Wealth Accumulation Mode**: Maximizes Passive Coverage, ROI, and Volatility widgets.

---

## 7. AI "Royal Advisor" Prompt Engineering & Guardrail Specification

The system prompt for the `ai-proxy` Edge Function must be updated with the following strict constraints:

* **Portuguese Market Intelligence**: Acknowledge Subsidies (Férias/Natal), IRS PPR tax boundaries, and State Debt urgency.
* **Currency Formatting**: STRICT enforcement of European formatting ($1.250,50\ €$).
* **Token Budget Control**: Hardcap responses to 150-250 words to prevent excessive LLM costs.
* **Scenario Handlers**: 
  - If a user mentions "State Debt" (`AT` or `Segurança Social`), the AI must immediately halt accumulation advice and pivot strictly to high-priority debt resolution.
  - If the user proposes a mathematically impossible timeline based on the injected `contextJson`, the AI must gracefully reject the premise and offer a recalculated timeline.

---

## 8. Phased Implementation Roadmap & Step-By-Step Checklist

### Phase 1: Schema & Engine
- [ ] Execute Multi-Currency DDL migrations on `transactions`.
- [ ] Update `dim_contas` with `is_liquid` and `priority_level` flags.
- [ ] Migrate historical EUR data into `original_currency` columns.

### Phase 2: RPC & Metrics
- [ ] Update `get_financial_health_report` Postgres RPC with Meal Card and State Debt logic.
- [ ] Deploy Monte Carlo 90-Day Simulation endpoints.
- [ ] Implement mathematically normalized Savings Rate logic in the analytics views.

### Phase 3: UI Widgets
- [ ] Build `DebtPayoffVelocityWidget.jsx`.
- [ ] Build `PassiveCoverageWidget.jsx`.
- [ ] Refactor dashboard dynamic rendering logic based on financial phase.

### Phase 4: Enrichment Pipeline
- [ ] Deploy Edge Function for Merchant ID Regex stripping.
- [ ] Implement Internal Transfer Auto-Detection logic in the synchronization cron job.

### Phase 5: Royal Advisor Integration
- [ ] Update `RoyalAdvisorModal.jsx` system instruction with new token budgets and Portuguese context.
- [ ] Implement European numeric formatting interceptors.
- [ ] Test LLM fallback strategies (Gemini to Groq) handling strict formatting.
