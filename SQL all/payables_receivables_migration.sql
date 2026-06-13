-- ==============================================================
-- ELDORIA: PAYABLES & RECEIVABLES TRACKING SCHEMA EXPANSION
-- ==============================================================

-- 1. Extend the transactions table with tracking structures
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS due_date DATE,
ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- 2. Update/Verify transactional taxonomies via check constraints
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS check_payment_status;
ALTER TABLE public.transactions ADD CONSTRAINT check_payment_status 
CHECK (payment_status IN ('Completed', 'Open', 'Paid', 'Overdue', 'Pending'));

ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS check_transaction_type;
ALTER TABLE public.transactions ADD CONSTRAINT check_transaction_type 
CHECK (transaction_type IN ('Income', 'Expense', 'Payable', 'Receivable'));

-- 3. Modify trigger to only update current gold balance for Income and Expense
CREATE OR REPLACE FUNCTION public.update_profile_on_transaction()
RETURNS TRIGGER AS $$
DECLARE
    earned_xp INTEGER;
    current_xp INTEGER;
    current_level INTEGER;
    max_xp NUMERIC;
BEGIN
    -- 4.1 Update gold balance only for cash flow transactions (Income & Expense)
    IF NEW.transaction_type = 'Income' THEN
        UPDATE public.profiles
        SET gold = gold + CAST(NEW.amount AS BIGINT)
        WHERE id = NEW.profile_id;
        
        -- Earned XP = amount * 2 for income
        earned_xp := CAST(NEW.amount AS INTEGER) * 2;
    ELSIF NEW.transaction_type = 'Expense' THEN
        UPDATE public.profiles
        SET gold = GREATEST(0, gold - CAST(NEW.amount AS BIGINT))
        WHERE id = NEW.profile_id;
        
        earned_xp := 0;
    ELSE
        -- Payables and Receivables are outstanding obligations (accrual documents)
        -- and do not immediately update profiles.gold or award XP.
        earned_xp := 0;
    END IF;

    -- 4.2 Update XP and Level
    IF earned_xp > 0 THEN
        -- Get current XP and level
        SELECT xp, level INTO current_xp, current_level 
        FROM public.profiles 
        WHERE id = NEW.profile_id;
        
        current_xp := current_xp + earned_xp;
        
        LOOP
            max_xp := 100 * POWER(1.5, current_level - 1);
            IF current_xp >= max_xp THEN
                current_xp := current_xp - CAST(max_xp AS INTEGER);
                current_level := current_level + 1;
            ELSE
                EXIT;
            END IF;
        END LOOP;
        
        UPDATE public.profiles
        SET xp = current_xp, level = current_level
        WHERE id = NEW.profile_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create a specialized Analytics View for the 5-Card Top KPI Metric calculations
CREATE OR REPLACE VIEW public.view_payables_receivables_kpis AS
WITH calculations AS (
    SELECT
        profile_id,
        -- All Payables: Total amount of payables registered
        COALESCE(SUM(amount) FILTER (WHERE transaction_type = 'Payable'), 0) AS all_payables,
        
        -- Open Payables: Total amount of payables registered and not yet paid
        COALESCE(SUM(amount) FILTER (WHERE transaction_type = 'Payable' AND payment_status IN ('Open', 'Overdue')), 0) AS open_payables,
        
        -- All Receivables: Total amount of receivables registered
        COALESCE(SUM(amount) FILTER (WHERE transaction_type = 'Receivable'), 0) AS all_receivables,
        
        -- Open Receivables: Total amount of receivables registered and not yet received
        COALESCE(SUM(amount) FILTER (WHERE transaction_type = 'Receivable' AND payment_status = 'Open'), 0) AS open_receivables,
        
        -- Overdue Payables Amount (helper for rate calculation)
        COALESCE(SUM(amount) FILTER (WHERE transaction_type = 'Payable' AND payment_status = 'Overdue'), 0) AS overdue_payables
    FROM public.transactions
    GROUP BY profile_id
)
SELECT 
    profile_id,
    all_payables,
    open_payables,
    all_receivables,
    open_receivables,
    CASE 
        WHEN open_payables = 0 THEN 0.0
        ELSE ROUND((overdue_payables::NUMERIC / open_payables::NUMERIC) * 100, 1)
    END AS overdue_rate
FROM calculations;

COMMENT ON VIEW public.view_payables_receivables_kpis IS 'Aggregated Payables & Receivables summary calculations.';
