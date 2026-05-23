-- 1. Fix the Check Constraint Error
-- This drops the strict check that is causing the 'Payment Cash' error.
ALTER TABLE treasury_records DROP CONSTRAINT IF EXISTS treasury_records_transaction_type_check;

-- Optional: Update any legacy records to the new naming convention
UPDATE treasury_records SET transaction_type = 'Receipt Cash' WHERE transaction_type = 'Income';
UPDATE treasury_records SET transaction_type = 'Payment Cash' WHERE transaction_type = 'Expense';

-- 2. Create the Atomic Strike Function (RPC)
CREATE OR REPLACE FUNCTION strike_monster(
  p_account_id UUID,
  p_profile_id UUID,
  p_payment NUMERIC,
  p_account_name TEXT,
  p_month TEXT,
  p_year TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Deduct Health
  UPDATE treasury_accounts
  SET 
    balance = GREATEST(0, balance - p_payment),
    last_regen_at = NOW(),
    updated_at = NOW()
  WHERE id = p_account_id;

  -- Add Record
  INSERT INTO treasury_records (
    profile_id, account_id, from_source, month, year, entity, 
    expense_amount, description, transaction_type, status, paid_with
  ) VALUES (
    p_profile_id, p_account_id, 'Treasury Direct Strike', p_month, p_year, p_account_name,
    p_payment, 'Direct amortization strike against ' || p_account_name, 'Payment Cash', 'Paid', 'Debit'
  );

  -- Deduct Gold
  UPDATE profiles
  SET gold = GREATEST(0, gold - p_payment)
  WHERE id = p_profile_id;
END;
$$;

-- 3. Create the Monster Card Stats View
CREATE OR REPLACE VIEW monster_card_stats AS
SELECT 
  a.id AS id,
  a.profile_id,
  a.name AS name,
  a.type,
  a.initial_debt AS total_health,
  a.overdraft_limit AS start_shield,
  COALESCE(SUM(r.expense_amount) FILTER (WHERE r.status = 'Paid'), 0) AS damage_done,
  COALESCE(SUM(r.interests + r.late_fee_interests + r.penalties + r.tax), 0) AS health_regen,
  COALESCE(SUM(r.losses), 0) AS losses,
  COALESCE(SUM(r.payment_receipt_cash), 0) AS critical_hits,
  
  (a.initial_debt 
   + COALESCE(SUM(r.interests + r.late_fee_interests + r.penalties + r.tax), 0) 
   - COALESCE(SUM(r.expense_amount) FILTER (WHERE r.status = 'Paid'), 0)
   - COALESCE(SUM(r.payment_receipt_cash), 0)) AS health_left,
   
  GREATEST(0, a.overdraft_limit - COALESCE(SUM(r.losses), 0)) AS shield_left

FROM treasury_accounts a
LEFT JOIN treasury_records r ON a.id = r.account_id
GROUP BY a.id;
