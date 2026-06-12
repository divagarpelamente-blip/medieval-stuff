-- ==========================================
-- ELDORIA ANALYTICS ZERO-CALCULATION VIEWS
-- ==========================================

-- 1. Dashboard KPI Summary View
-- Computes the core 2x2 double-entry accounting matrix metrics per profile.
CREATE OR REPLACE VIEW public.view_dashboard_kpi_summary AS
WITH profile_aggregates AS (
    SELECT 
        profile_id,
        -- Accrual Axes
        COALESCE(SUM(amount) FILTER (WHERE transaction_nature = 'accrual' AND transaction_flow = 'inflow'), 0) AS raw_income,
        COALESCE(SUM(amount) FILTER (WHERE transaction_nature = 'accrual' AND transaction_flow = 'outflow'), 0) AS raw_expenses,
        -- Cash Axes
        COALESCE(SUM(amount) FILTER (WHERE transaction_nature = 'cash' AND transaction_flow = 'inflow'), 0) AS raw_receipts,
        COALESCE(SUM(amount) FILTER (WHERE transaction_nature = 'cash' AND transaction_flow = 'outflow'), 0) AS raw_payments,
        -- Debt Axes
        COALESCE(SUM(amount) FILTER (WHERE transaction_category IN ('Banking', 'Other Banking', 'Burrowed') AND transaction_nature = 'accrual' AND transaction_flow = 'inflow'), 0) AS raw_debt_accrual,
        COALESCE(SUM(amount) FILTER (WHERE transaction_category IN ('Banking', 'Other Banking', 'Burrowed') AND transaction_nature = 'cash' AND transaction_flow = 'outflow'), 0) AS raw_debt_payment
    FROM public.transactions
    GROUP BY profile_id
)
SELECT 
    profile_id,
    
    -- Accrual Metrics
    raw_income AS total_income,
    raw_expenses AS total_expenses,
    COALESCE(
        ((raw_income - raw_expenses) / NULLIF(raw_income, 0)) * 100, 
        0
    ) AS savings_efficiency,

    -- Cash Metrics
    raw_receipts AS total_receipts,
    raw_payments AS total_payments,
    (raw_receipts - raw_payments) AS net_cash_balance,

    -- Debt Metrics
    (raw_debt_accrual - raw_debt_payment) AS total_debt

FROM profile_aggregates;

COMMENT ON VIEW public.view_dashboard_kpi_summary IS 'Zero-calculation KPI summary deriving the 2x2 double-entry matrix (Cash/Accrual x Inflow/Outflow) per profile.';


-- 2. Flow by Category View (For Diverging Bar Chart)
-- Aggregates inflows and outflows by category per profile per year
DROP VIEW IF EXISTS public.view_chart_flow_by_category CASCADE;
CREATE OR REPLACE VIEW public.view_chart_flow_by_category AS
SELECT 
    profile_id,
    transaction_category,
    transaction_nature,
    COALESCE(SUM(amount) FILTER (WHERE transaction_flow = 'inflow'), 0) AS total_inflow,
    COALESCE(SUM(amount) FILTER (WHERE transaction_flow = 'outflow'), 0) AS total_outflow
FROM public.transactions
GROUP BY profile_id, transaction_category, transaction_nature;

COMMENT ON VIEW public.view_chart_flow_by_category IS 'Category bar chart view grouping inflows and outflows by transaction nature.';


-- 3. Time Evolution Chart View
-- Temporal progression map providing daily absolute sums for the unified spline layout.
DROP VIEW IF EXISTS public.view_chart_time_evolution CASCADE;
CREATE OR REPLACE VIEW public.view_chart_time_evolution AS
SELECT 
    profile_id,
    DATE_TRUNC('day', date) AS dimension_date,
    COALESCE(SUM(amount) FILTER (WHERE transaction_nature = 'accrual' AND transaction_flow = 'inflow'), 0) AS accrual_inflow,
    COALESCE(SUM(amount) FILTER (WHERE transaction_nature = 'accrual' AND transaction_flow = 'outflow'), 0) AS accrual_outflow,
    COALESCE(SUM(amount) FILTER (WHERE transaction_nature = 'cash' AND transaction_flow = 'inflow'), 0) AS cash_inflow,
    COALESCE(SUM(amount) FILTER (WHERE transaction_nature = 'cash' AND transaction_flow = 'outflow'), 0) AS cash_outflow,
    COALESCE(SUM(amount) FILTER (WHERE transaction_category IN ('Banking', 'Other Banking', 'Burrowed') AND transaction_nature = 'accrual' AND transaction_flow = 'inflow'), 0) AS debt_accrual,
    COALESCE(SUM(amount) FILTER (WHERE transaction_category IN ('Banking', 'Other Banking', 'Burrowed') AND transaction_nature = 'cash' AND transaction_flow = 'outflow'), 0) AS debt_payment
FROM public.transactions
GROUP BY profile_id, DATE_TRUNC('day', date)
ORDER BY dimension_date ASC;

COMMENT ON VIEW public.view_chart_time_evolution IS 'Time-series view rendering daily absolute sums for accrual and cash axes.';


-- 4. Top Entities Donut Chart View
-- Calculates entity volume and its percentage share within the profile''s specific transaction nature.
CREATE OR REPLACE VIEW public.view_chart_top_entities AS
WITH entity_sums AS (
    SELECT 
        profile_id,
        entity,
        transaction_nature,
        COALESCE(SUM(amount), 0) AS total_volume
    FROM public.transactions
    GROUP BY profile_id, entity, transaction_nature
),
profile_nature_totals AS (
    SELECT 
        profile_id,
        transaction_nature,
        COALESCE(SUM(amount), 0) AS nature_total
    FROM public.transactions
    GROUP BY profile_id, transaction_nature
)
SELECT 
    es.profile_id,
    es.entity,
    es.transaction_nature,
    es.total_volume,
    COALESCE(
        (es.total_volume / NULLIF(pnt.nature_total, 0)) * 100, 
        0
    ) AS percentage_share
FROM entity_sums es
JOIN profile_nature_totals pnt 
  ON es.profile_id = pnt.profile_id 
  AND es.transaction_nature = pnt.transaction_nature;

COMMENT ON VIEW public.view_chart_top_entities IS 'Donut chart view calculating entity volume and internal percentage shares by nature layer.';


-- 5. Detailed Expenses View
-- A simple view to extract entity and category for all Expense transactions.
CREATE OR REPLACE VIEW public."Detailed Expenses" AS
SELECT
  entity,
  transaction_category AS "Transaction_Category",
  amount AS total_amount
FROM
  public.transactions t
WHERE
  transaction_type = 'Expense';

-- 6. Debt View
-- Detailed breakdown of accrued and paid debt by profile.
CREATE OR REPLACE VIEW public."Debt" AS
SELECT
  profile_id,
  COALESCE(
    sum(amount) filter (
      where
        (
          transaction_category = any (
            array[
              'Banking'::text,
              'Other Banking'::text,
              'Burrowed'::text
            ]
          )
        )
        and transaction_nature = 'accrual'::text
        and transaction_flow = 'inflow'::text
    ),
    0::numeric
  ) as debt_accrued,
  COALESCE(
    sum(amount) filter (
      where
        (
          transaction_category = any (
            array[
              'Banking'::text,
              'Other Banking'::text,
              'Burrowed'::text
            ]
          )
        )
        and transaction_nature = 'cash'::text
        and transaction_flow = 'outflow'::text
    ),
    0::numeric
  ) as debt_paid,
  COALESCE(
    sum(amount) filter (
      where
        (
          transaction_category = any (
            array[
              'Banking'::text,
              'Other Banking'::text,
              'Burrowed'::text
            ]
          )
        )
        and transaction_nature = 'accrual'::text
        and transaction_flow = 'inflow'::text
    ),
    0::numeric
  ) - COALESCE(
    sum(amount) filter (
      where
        (
          transaction_category = any (
            array[
              'Banking'::text,
              'Other Banking'::text,
              'Burrowed'::text
            ]
          )
        )
        and transaction_nature = 'cash'::text
        and transaction_flow = 'outflow'::text
    ),
    0::numeric
  ) as current_total_debt
FROM
  public.transactions t
GROUP BY
  profile_id;
