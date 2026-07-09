-- Trigger to automatically synchronize public.profiles.gold whenever transactions are modified
CREATE OR REPLACE FUNCTION public.sync_profile_gold_on_transaction()
RETURNS TRIGGER AS $$
DECLARE
    target_profile_id UUID;
    total_net_cash NUMERIC := 0;
    starting_gold NUMERIC := 0;
    calculated_gold INT := 0;
BEGIN
    -- Determine target profile_id based on Operation
    IF TG_OP = 'DELETE' THEN
        target_profile_id := OLD.profile_id;
    ELSE
        target_profile_id := NEW.profile_id;
    END IF;

    IF target_profile_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- 1. Calculate starting gold from cash and bank accounts (10101xxx & 10102xxx)
    SELECT COALESCE(SUM(balance), 0)
    INTO starting_gold
    FROM public.account_balances
    WHERE profile_id = target_profile_id
      AND (account_code LIKE '10101%' OR account_code LIKE '10102%');

    -- 2. Calculate net cash changes from transaction history
    SELECT COALESCE(SUM(
        CASE 
            WHEN t.transaction_type = 'Income' THEN
                CASE WHEN COALESCE(t.source_dest_bank, '10101001') LIKE '10101%' OR COALESCE(t.source_dest_bank, '10101001') LIKE '10102%' THEN t.amount ELSE 0 END
            
            WHEN t.transaction_type = 'Expense' THEN
                CASE WHEN COALESCE(t.source_dest_bank, '10101001') LIKE '10101%' OR COALESCE(t.source_dest_bank, '10101001') LIKE '10102%' THEN -t.amount ELSE 0 END
            
            WHEN t.transaction_type IN ('Assets', 'Liabilities') THEN
                CASE 
                    WHEN t.flow = 'neutral' THEN
                        (CASE WHEN t.target_account LIKE '10101%' OR t.target_account LIKE '10102%' THEN t.amount ELSE 0 END) -
                        (CASE WHEN t.source_dest_bank LIKE '10101%' OR t.source_dest_bank LIKE '10102%' THEN t.amount ELSE 0 END)
                    WHEN t.flow = 'inflow' THEN
                        (CASE WHEN t.source_dest_bank LIKE '10101%' OR t.source_dest_bank LIKE '10102%' THEN t.amount ELSE 0 END) -
                        (CASE WHEN t.target_account LIKE '10101%' OR t.target_account LIKE '10102%' THEN t.amount ELSE 0 END)
                    WHEN t.flow = 'outflow' THEN
                        (CASE WHEN t.target_account LIKE '10101%' OR t.target_account LIKE '10102%' THEN t.amount ELSE 0 END) -
                        (CASE WHEN t.source_dest_bank LIKE '10101%' OR t.source_dest_bank LIKE '10102%' THEN t.amount ELSE 0 END)
                    ELSE 0
                END
            
            ELSE 0
        END
    ), 0)
    INTO total_net_cash
    FROM public.transactions t
    WHERE t.profile_id = target_profile_id
      AND t.payment_status IN ('Completed', 'Paid', 'Paid on Time', 'Paid Late');

    calculated_gold := FLOOR(starting_gold + total_net_cash);

    -- 3. Update the gold column in public.profiles
    UPDATE public.profiles
    SET gold = calculated_gold
    WHERE id = target_profile_id;

    -- 4. If transaction profile was modified, recalculate gold for the old profile too
    IF TG_OP = 'UPDATE' AND OLD.profile_id IS DISTINCT FROM NEW.profile_id THEN
        SELECT COALESCE(SUM(balance), 0) INTO starting_gold FROM public.account_balances WHERE profile_id = OLD.profile_id AND (account_code LIKE '10101%' OR account_code LIKE '10102%');
        SELECT COALESCE(SUM(
            CASE 
                WHEN t.transaction_type = 'Income' THEN
                    CASE WHEN COALESCE(t.source_dest_bank, '10101001') LIKE '10101%' OR COALESCE(t.source_dest_bank, '10101001') LIKE '10102%' THEN t.amount ELSE 0 END
                WHEN t.transaction_type = 'Expense' THEN
                    CASE WHEN COALESCE(t.source_dest_bank, '10101001') LIKE '10101%' OR COALESCE(t.source_dest_bank, '10101001') LIKE '10102%' THEN -t.amount ELSE 0 END
                WHEN t.transaction_type IN ('Assets', 'Liabilities') THEN
                    CASE 
                        WHEN t.flow = 'neutral' THEN
                            (CASE WHEN t.target_account LIKE '10101%' OR t.target_account LIKE '10102%' THEN t.amount ELSE 0 END) -
                            (CASE WHEN t.source_dest_bank LIKE '10101%' OR t.source_dest_bank LIKE '10102%' THEN t.amount ELSE 0 END)
                        WHEN t.flow = 'inflow' THEN
                            (CASE WHEN t.source_dest_bank LIKE '10101%' OR t.source_dest_bank LIKE '10102%' THEN t.amount ELSE 0 END) -
                            (CASE WHEN t.target_account LIKE '10101%' OR t.target_account LIKE '10102%' THEN t.amount ELSE 0 END)
                        WHEN t.flow = 'outflow' THEN
                            (CASE WHEN t.target_account LIKE '10101%' OR t.target_account LIKE '10102%' THEN t.amount ELSE 0 END) -
                            (CASE WHEN t.source_dest_bank LIKE '10101%' OR t.source_dest_bank LIKE '10102%' THEN t.amount ELSE 0 END)
                        ELSE 0
                    END
                ELSE 0
            END
        ), 0) INTO total_net_cash FROM public.transactions t WHERE t.profile_id = OLD.profile_id AND t.payment_status IN ('Completed', 'Paid', 'Paid on Time', 'Paid Late');
        UPDATE public.profiles SET gold = FLOOR(starting_gold + total_net_cash) WHERE id = OLD.profile_id;
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if already exists
DROP TRIGGER IF EXISTS trigger_sync_profile_gold ON public.transactions;

-- Attach trigger to public.transactions
CREATE TRIGGER trigger_sync_profile_gold
AFTER INSERT OR UPDATE OR DELETE ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.sync_profile_gold_on_transaction();
