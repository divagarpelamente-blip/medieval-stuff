-- Migration: Remove Date, Add Value Date & Posting Date
-- 1. Add new columns
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS value_date DATE;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS posting_date DATE DEFAULT CURRENT_DATE;

-- 2. Populate existing records with legacy date column value
UPDATE public.transactions 
SET 
  value_date = COALESCE(date, CURRENT_DATE),
  posting_date = COALESCE(date, CURRENT_DATE);

-- 3. Drop dependent views first so we can drop the date column
DROP VIEW IF EXISTS public.view_chart_time_evolution CASCADE;
DROP VIEW IF EXISTS public.view_chart_flow_by_category CASCADE;

-- 4. Drop the legacy date column
ALTER TABLE public.transactions DROP COLUMN IF EXISTS date;

-- 5. Recreate BEFORE INSERT trigger to auto-calculate calendar attributes from posting_date
CREATE OR REPLACE FUNCTION public.pre_process_transaction()
RETURNS TRIGGER AS $$
BEGIN
    -- Set default posting_date if null
    IF NEW.posting_date IS NULL THEN
        NEW.posting_date := CURRENT_DATE;
    END IF;
    
    -- Set default value_date if null
    IF NEW.value_date IS NULL THEN
        NEW.value_date := NEW.posting_date;
    END IF;
    
    -- Extract calendar attributes based on posting_date
    NEW.year := EXTRACT(YEAR FROM NEW.posting_date);
    NEW.month := TRIM(to_char(NEW.posting_date, 'Month'));
    NEW.quarter := 'Q' || EXTRACT(QUARTER FROM NEW.posting_date);
    
    -- Default payment_status if null
    IF NEW.payment_status IS NULL OR NEW.payment_status = '' THEN
        NEW.payment_status := 'Completed';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Recreate the Time Evolution Chart view referencing posting_date
CREATE OR REPLACE VIEW public.view_chart_time_evolution AS
SELECT 
    profile_id,
    DATE_TRUNC('day', posting_date) AS dimension_date,
    COALESCE(SUM(amount) FILTER (WHERE transaction_nature = 'accrual' AND transaction_flow = 'inflow'), 0) AS accrual_inflow,
    COALESCE(SUM(amount) FILTER (WHERE transaction_nature = 'accrual' AND transaction_flow = 'outflow'), 0) AS accrual_outflow,
    COALESCE(SUM(amount) FILTER (WHERE transaction_nature = 'cash' AND transaction_flow = 'inflow'), 0) AS cash_inflow,
    COALESCE(SUM(amount) FILTER (WHERE transaction_nature = 'cash' AND transaction_flow = 'outflow'), 0) AS cash_outflow,
    COALESCE(SUM(amount) FILTER (WHERE transaction_category IN ('Banking', 'Other Banking', 'Burrowed') AND transaction_nature = 'accrual' AND transaction_flow = 'inflow'), 0) AS debt_accrual,
    COALESCE(SUM(amount) FILTER (WHERE transaction_category IN ('Banking', 'Other Banking', 'Burrowed') AND transaction_nature = 'cash' AND transaction_flow = 'outflow'), 0) AS debt_payment
FROM public.transactions
GROUP BY profile_id, DATE_TRUNC('day', posting_date)
ORDER BY dimension_date ASC;

COMMENT ON VIEW public.view_chart_time_evolution IS 'Time-series view rendering daily absolute sums based on posting_date.';

-- 7. Recreate Flow by Category View
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
