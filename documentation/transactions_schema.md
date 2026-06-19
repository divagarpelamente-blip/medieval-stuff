# Transactions Schema Specification: Eldoria (Medieval Stuff)

This document provides a comprehensive technical specification of the database schema, core constraints, trigger actions, and financial statement calculation rules for the **Eldoria (Medieval Stuff)** personal finance application.

---

## 1. The 4-Pillar Financial Model

All financial activities within the realm are partitioned across four core transaction classes (`transaction_type`):
1. **`Income`**: Revenue, stipends, taxes, or windfalls entering the Royal Purse.
2. **`Expense`**: Operating costs, markets, blacksmith services, or entertainment outflows.
3. **`Asset`**: Cash vaults, savings accounts, or investment apps.
4. **`Debt`**: Bank loans, liabilities, or outstanding personal debts.

### Status & Cash-Basis Flow Control
The system separates realized cash flow from forecasting and planning through the transaction status:
* **`Completed`**: Cash-basis realized transaction. Immediate impact on balances.
* **`Pending`**: Budget forecast or outstanding invoice/obligation. Does not affect physical gold balances.
* **`flow`**: Captures directionality:
  * `inflow`: Capital entering the primary account/vault.
  * `outflow`: Capital exiting the primary account/vault.
  * `neutral`: Internal fund transfers between Asset accounts (no net change in overall wealth, excluded from P&L).

---

## 2. Database Schema (Supabase PostgreSQL)

### A. Table: `public.transactions`
This table represents the centralized transaction book.

| Column | Type | Check Constraints / Description |
| :--- | :--- | :--- |
| `id` | `UUID` | Primary Key, defaults to `gen_random_uuid()` |
| `profile_id` | `UUID` | Foreign Key references `profiles.id` |
| `amount` | `NUMERIC` | Must be greater than 0 |
| `from` | `TEXT` | Origin/Payer of the funds |
| `value_date` | `DATE` | Expected completion date |
| `posting_date` | `DATE` | Date of registration, defaults to `CURRENT_DATE` |
| `month` | `TEXT` | Extracted calendar month (e.g. `'June'`) |
| `year` | `INTEGER` | Extracted calendar year |
| `quarter` | `TEXT` | Extracted calendar quarter (e.g. `'Q2'`) |
| `payment_status` | `TEXT` | Check: `'Pending'`, `'Completed'` |
| `transaction_type` | `TEXT` | Check: `'Income'`, `'Expense'`, `'Asset'`, `'Debt'` |
| `transaction_subtype`| `TEXT` | Sub-classification (e.g. `'Base Salary'`, `'Cash payment'`) |
| `entity` | `TEXT` | Target merchant, creditor, or specific destination |
| `transaction_category`| `TEXT` | Higher level budget category |
| `target_account` | `TEXT` | Destination Chart of Accounts (CoA) code (e.g., `'111001'`) |
| `source_dest_bank` | `TEXT` | Origin Chart of Accounts (CoA) code (e.g., `'111001'`) |
| `flow` | `TEXT` | Check: `'inflow'`, `'outflow'`, `'neutral'` |
| `description` | `TEXT` | Optional text note describing the movement |
| `created_at` | `TIMESTAMPTZ` | Timestamp of row insertion |

### B. Table: `public.account_balances`
Maintains real-time aggregated balances for each Chart of Accounts (CoA) code.

* `profile_id` (`UUID`, PK, FK to `profiles.id`)
* `account_code` (`TEXT`, PK) - Code from the Chart of Accounts (Asset codes start with `1`, Liabilities start with `2`)
* `balance` (`NUMERIC`) - Current calculated balance of the account
* `updated_at` (`TIMESTAMPTZ`)

### C. Table: `public.profiles`
Represents the user account, gamification stats, role, and custom settings.

* `id` (`UUID`, PK) - Matches Supabase Auth User ID.
* `email` (`TEXT`) - User email account.
* `gold` (`BIGINT`) - Real-time calculated purse balance.
* `level` (`INTEGER`) - Lord's calculated level.
* `xp` (`INTEGER`) - Lord's accumulated experience.
* `role` (`TEXT`) - User role constraint (`'lord'` or `'admin'`).
* `settings` (`JSONB`) - User-specific customized options (templates, categories, entities, mappings, language).
* `updated_at` (`TIMESTAMPTZ`)

---

## 3. Database Triggers & Calculations

### A. Calendar Derivation (`BEFORE INSERT OR UPDATE`)
A trigger automatically parses the `posting_date` (or `CURRENT_DATE` if empty) to extract the calendar metrics:
* Extracts `year` using `EXTRACT(YEAR FROM posting_date)`.
* Extracts `month` as a text representation (e.g., `'June'`).
* Identifies `quarter` as `'Q1'`, `'Q2'`, `'Q3'`, or `'Q4'`.

### B. Real-Time Balance Synchronization (`AFTER INSERT OR UPDATE`)
When a transaction is successfully registered or edited:
1. **Pending Status Isolation:** If the transaction's `payment_status` is `'Pending'`, no updates are made to the real-time balances.
2. **Completed Status Updates:** If `payment_status` is `'Completed'`:
   * **Target Account:** Adds `amount` to the `account_balances` record for `target_account`.
   * **Source account:** Subtracts `amount` from the `account_balances` record for `source_dest_bank`.
   * **Purse Update:** Adjusts the overall profile purse (`profiles.gold`) accordingly:
     * Increases gold for realized `Income` (and awards 2 XP per Gold coin).
     * Decreases gold for realized `Expense` (clamped at `0`).

---

## 4. Financial Statement Calculations

The react context engine ([useDashboardEngine.js](file:///c:/Users/silva/.gemini/antigravity/Medieval%20Stuff/client/src/lib/useDashboardEngine.js)) reads raw transactions and accounts to build three primary statements:

### A. Profit & Loss (P&L)
* **Firewall Filter:** Excludes `Asset` and `Debt` types.
* **Neutral Transfer Filter:** Excludes transactions where `flow = 'neutral'` to prevent double-counting internal transfers.
* **Calculation:**
  * **Realized Income:** Sum of `Income` amounts where `payment_status = 'Completed'`.
  * **Realized Expense:** Sum of `Expense` amounts where `payment_status = 'Completed'`.
  * **Net Realized Income:** $\text{Realized Income} - \text{Realized Expense}$.
  * **Forecast/Outstanding:** Tracks `'Pending'` items separately.

### B. Cash Flow Statement
* **Scope:** Captures only completed cash-basis movements.
* **Operating Cash Flow:** Negative of realized expenses (cash outflows).
* **Financing Cash Flow:** Value of realized income (cash inflows).
* **Investing Cash Flow:** Inactive (always 0).

### C. Balance Sheet
* **Real-time Source:** Directly reads values from the `account_balances` table.
* **Assets:** Sum of account balances starting with code `'1'` (Vault cash, Banks, and Savings).
* **Liabilities:** Sum of account balances starting with code `'2'` (Loans, personal debt, and credit cards).
* **Equity (Net Wealth):** $\text{Total Assets} - \text{Total Liabilities}$.
* **Fallback Strategy:** If no balances are returned from the database (e.g. `account_balances` is empty), the engine computes balances dynamically from the transaction history:
  * Calculates the net cash flow of realized revenues and expenses (`Income` minus `Expense`).
  * Subtracts this net cash flow from `profiles.gold` to isolate the `Starting Cash` balance of `111001` (Vault cash / CGD Bank).
  * Evaluates all completed transactions chronologically to calculate the net impact on each account code (Assets increase on inflow, decrease on outflow; Liabilities increase on inflow, decrease on outflow; internal transfers debit the target and credit the source).
  * Computes total assets, total liabilities, and net worth dynamically from these calculated balances.
