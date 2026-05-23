-- 1. Update the Transaction Type Check Constraint
ALTER TABLE treasury_records DROP CONSTRAINT IF EXISTS treasury_records_transaction_type_check;

ALTER TABLE treasury_records ADD CONSTRAINT treasury_records_transaction_type_check 
CHECK (transaction_type IN ('Income Cash', 'Income Credit', 'Payment Cash', 'Payment Credit', 'Expense', 'Earning'));

-- 2. Update existing data to match new types (Mapping old to new)
UPDATE treasury_records SET transaction_type = 'Income Cash' WHERE transaction_type = 'Receipt Cash';
UPDATE treasury_records SET transaction_type = 'Income Credit' WHERE transaction_type = 'Receipt Credit';

-- 3. Refresh the Monster Card Stats View with Updated Logic
CREATE OR REPLACE VIEW monster_card_stats AS
SELECT 
  a.id AS id,
  a.profile_id,
  a.name AS name,
  a.type,
  a.initial_debt AS total_health,
  a.overdraft_limit AS start_shield,
  
  -- Damage Done: Any payment or expense directed at this account
  COALESCE(SUM(r.expense_amount) FILTER (
    WHERE r.status = 'Paid' AND r.transaction_type IN ('Payment Cash', 'Payment Credit', 'Expense')
  ), 0) AS damage_done,
  
  -- Health Regen: Interests, fees, and penalties
  COALESCE(SUM(r.interests + r.late_fee_interests + r.penalties + r.tax), 0) AS health_regen,
  
  -- Losses: Direct negative hits to the shield
  COALESCE(SUM(r.losses), 0) AS losses,
  
  -- Critical Hits: Incomes or earnings related to this account (e.g. cashbacks)
  COALESCE(SUM(r.payment_receipt_cash) FILTER (
    WHERE r.transaction_type IN ('Income Cash', 'Income Credit', 'Earning')
  ), 0) AS critical_hits,
  
  -- Health Left Calculation
  (a.initial_debt 
   + COALESCE(SUM(r.interests + r.late_fee_interests + r.penalties + r.tax), 0) 
   - COALESCE(SUM(r.expense_amount) FILTER (
     WHERE r.status = 'Paid' AND r.transaction_type IN ('Payment Cash', 'Payment Credit', 'Expense')
   ), 0)
   - COALESCE(SUM(r.payment_receipt_cash) FILTER (
     WHERE r.transaction_type IN ('Income Cash', 'Income Credit', 'Earning')
   ), 0)) AS health_left,
   
  -- Shield Left Calculation
  GREATEST(0, a.overdraft_limit - COALESCE(SUM(r.losses), 0)) AS shield_left

FROM treasury_accounts a
LEFT JOIN treasury_records r ON a.id = r.account_id
GROUP BY a.id;
