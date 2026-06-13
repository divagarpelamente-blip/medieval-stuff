-- ==============================================================
-- ELDORIA: LIABILITIES & DEBT TRACKING SCHEMA EXPANSION
-- ==============================================================

-- 1. Extend the transaction_type and payment_status check constraints
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS check_transaction_type;
ALTER TABLE public.transactions ADD CONSTRAINT check_transaction_type 
CHECK (transaction_type IN ('Income', 'Expense', 'Payable', 'Receivable', 'Savings', 'Debt'));

ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS check_payment_status;
ALTER TABLE public.transactions ADD CONSTRAINT check_payment_status 
CHECK (payment_status IN ('Completed', 'Open', 'Paid', 'Overdue', 'Pending', 'Paid on Time', 'Paid Late'));


-- 2. Modify trigger to handle Savings and Debt transactions correctly (updating gold, no XP)
CREATE OR REPLACE FUNCTION public.update_profile_on_transaction()
RETURNS TRIGGER AS $$
DECLARE
    earned_xp INTEGER;
    current_xp INTEGER;
    current_level INTEGER;
    max_xp NUMERIC;
BEGIN
    -- 2.1 Update gold balance based on transaction type and flows
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
    ELSIF NEW.transaction_type = 'Savings' THEN
        -- Savings: outflow transfers gold out of active purse, inflow transfers it back
        IF NEW.transaction_flow = 'inflow' THEN
            UPDATE public.profiles
            SET gold = gold + CAST(NEW.amount AS BIGINT)
            WHERE id = NEW.profile_id;
        ELSE
            UPDATE public.profiles
            SET gold = GREATEST(0, gold - CAST(NEW.amount AS BIGINT))
            WHERE id = NEW.profile_id;
        END IF;
        
        earned_xp := 0;
    ELSIF NEW.transaction_type = 'Debt' THEN
        -- Debt: borrowing ('New Debt') adds cash, repayment ('Amortization' or 'Interest') subtracts cash
        IF NEW.transaction_subtype = 'New Debt' OR NEW.transaction_flow = 'inflow' THEN
            UPDATE public.profiles
            SET gold = gold + CAST(NEW.amount AS BIGINT)
            WHERE id = NEW.profile_id;
        ELSIF NEW.transaction_subtype IN ('Amortization', 'Interest') OR NEW.transaction_flow = 'outflow' THEN
            UPDATE public.profiles
            SET gold = GREATEST(0, gold - CAST(NEW.amount AS BIGINT))
            WHERE id = NEW.profile_id;
        END IF;
        
        earned_xp := 0;
    ELSE
        -- Payables and Receivables are outstanding obligations (accrual documents)
        -- and do not immediately update profiles.gold or award XP.
        earned_xp := 0;
    END IF;

    -- 2.2 Update XP and Level
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

-- 3. Create a specialized Analytics View for the Liabilities Top KPI Calculations
CREATE OR REPLACE VIEW public.view_liabilities_kpis AS
WITH calculations AS (
    SELECT
        profile_id,
        COALESCE(SUM(amount) FILTER (WHERE transaction_subtype = 'New Debt'), 0) AS total_new_debt,
        COALESCE(SUM(amount) FILTER (WHERE transaction_subtype = 'Amortization' AND payment_status = 'Completed'), 0) AS completed_amortization,
        COALESCE(SUM(amount) FILTER (WHERE transaction_subtype = 'Amortization' AND payment_status IN ('Open', 'Pending', 'Overdue')), 0) AS pending_amortization
    FROM public.transactions
    GROUP BY profile_id
)
SELECT 
    profile_id,
    (total_new_debt - completed_amortization) AS total_debt,
    pending_amortization AS to_be_paid,
    total_new_debt AS new_liabilities,
    completed_amortization AS amortizations
FROM calculations;

COMMENT ON VIEW public.view_liabilities_kpis IS 'Aggregated Liabilities summary calculations.';
