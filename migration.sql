-- 1. Drop old constraints so we can update data freely
ALTER TABLE treasury_records DROP CONSTRAINT IF EXISTS treasury_records_transaction_type_check;
ALTER TABLE treasury_records DROP CONSTRAINT IF EXISTS treasury_records_paid_with_check;
ALTER TABLE treasury_records DROP CONSTRAINT IF EXISTS treasury_records_status_check;
ALTER TABLE treasury_records DROP CONSTRAINT IF EXISTS treasury_records_quest_type_check;

-- 2. Update existing data to match the new allowed transaction types: 'Earning', 'Income', 'Expense', 'Payment'
UPDATE treasury_records 
SET transaction_type = 'Income' 
WHERE transaction_type IN ('Income Cash', 'Income Credit', 'Receipt Cash', 'Receipt Credit');

UPDATE treasury_records 
SET transaction_type = 'Payment' 
WHERE transaction_type IN ('Payment Cash', 'Payment Credit');

-- Set a fallback for any unmatched transaction types
UPDATE treasury_records 
SET transaction_type = 'Expense' 
WHERE transaction_type NOT IN ('Earning', 'Income', 'Expense', 'Payment') OR transaction_type IS NULL;

-- 3. Set a fallback for paid_with
UPDATE treasury_records 
SET paid_with = 'Debit' 
WHERE paid_with NOT IN ('Debit', 'Credit') OR paid_with IS NULL;

-- 4. Set a fallback for status
UPDATE treasury_records 
SET status = 'Paid' 
WHERE status NOT IN ('Paid', 'Unpaid', 'Overdue') OR status IS NULL;

-- 5. Rename column quests to quest_type (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='treasury_records' AND column_name='quests') THEN
    ALTER TABLE treasury_records RENAME COLUMN quests TO quest_type;
  END IF;
END $$;

-- 6. Set a fallback for quest_type
UPDATE treasury_records 
SET quest_type = 'Production' 
WHERE quest_type NOT IN ('Expedition', 'Bounty', 'Production') OR quest_type IS NULL;

-- 7. Apply the new strict constraints
ALTER TABLE treasury_records ADD CONSTRAINT treasury_records_transaction_type_check 
  CHECK (transaction_type IN ('Earning', 'Income', 'Expense', 'Payment'));

ALTER TABLE treasury_records ADD CONSTRAINT treasury_records_paid_with_check 
  CHECK (paid_with IN ('Debit', 'Credit'));

ALTER TABLE treasury_records ADD CONSTRAINT treasury_records_status_check 
  CHECK (status IN ('Paid', 'Unpaid', 'Overdue'));

ALTER TABLE treasury_records ADD CONSTRAINT treasury_records_quest_type_check 
  CHECK (quest_type IN ('Expedition', 'Bounty', 'Production'));

-- 8. Create the treasury_entities table
CREATE TABLE IF NOT EXISTS treasury_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id, name)
);

-- 9. Insert initial entities for profiles that exist
INSERT INTO treasury_entities (profile_id, name)
SELECT id, 'Renda' FROM profiles
ON CONFLICT DO NOTHING;

INSERT INTO treasury_entities (profile_id, name)
SELECT id, 'Salary' FROM profiles
ON CONFLICT DO NOTHING;

INSERT INTO treasury_entities (profile_id, name)
SELECT id, 'CGD' FROM profiles
ON CONFLICT DO NOTHING;

INSERT INTO treasury_entities (profile_id, name)
SELECT id, 'Universo' FROM profiles
ON CONFLICT DO NOTHING;

-- 10. Re-create the monster_card_stats view to align with the new types
DROP VIEW IF EXISTS monster_card_stats;

CREATE OR REPLACE VIEW monster_card_stats AS
WITH base_stats AS (
  SELECT 
    a.id,
    a.profile_id,
    a.name,
    a.type,
    a.initial_debt AS total_health,
    a.overdraft_limit AS start_shield,
    COALESCE(SUM(r.expense_amount) FILTER (WHERE r.status = 'Paid' AND r.transaction_type IN ('Payment', 'Expense')), 0) AS total_damage,
    COALESCE(SUM(r.interests + r.late_fee_interests + r.penalties + r.tax), 0) AS health_regen,
    COALESCE(SUM(r.losses), 0) AS total_losses,
    COALESCE(SUM(r.payment_receipt_cash) FILTER (WHERE r.transaction_type IN ('Income', 'Earning')), 0) AS total_critical_hits
  FROM treasury_accounts a
  LEFT JOIN treasury_records r ON a.id = r.account_id
  GROUP BY a.id
)
SELECT 
  id,
  profile_id,
  name,
  type,
  total_health,
  start_shield,
  total_damage AS damage_done,
  health_regen,
  total_losses AS losses,
  total_critical_hits AS critical_hits,
  -- Shield Left: start_shield - total_damage
  GREATEST(0, start_shield - total_damage) AS shield_left,
  -- Health Left: total_health + regen - overflow_damage
  (total_health + health_regen - GREATEST(0, total_damage - start_shield)) AS health_left
FROM base_stats;

-- 11. Enable RLS and add policies for treasury_entities to allow all actions for owners
ALTER TABLE treasury_entities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own entities" ON treasury_entities;
CREATE POLICY "Users can manage their own entities" 
  ON treasury_entities
  FOR ALL
  USING (auth.uid() = profile_id);
