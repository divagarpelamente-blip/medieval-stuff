-- Migration: Add income_amount, income_expense, receipt_payment columns to treasury_records
-- AND remove rigid check constraints to allow user-defined settings/types
-- Run this in your Supabase SQL editor

ALTER TABLE treasury_records
  ADD COLUMN IF NOT EXISTS income_amount    NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS income_expense   NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS receipt_payment  NUMERIC DEFAULT 0;

-- Drop all restrictive check constraints to prevent future errors with custom settings
ALTER TABLE treasury_records DROP CONSTRAINT IF EXISTS treasury_records_transaction_type_check;
ALTER TABLE treasury_records DROP CONSTRAINT IF EXISTS treasury_records_paid_with_check;
ALTER TABLE treasury_records DROP CONSTRAINT IF EXISTS treasury_records_status_check;
ALTER TABLE treasury_records DROP CONSTRAINT IF EXISTS treasury_records_quest_type_check;

-- Back-fill existing rows:
UPDATE treasury_records
SET
  income_expense  = COALESCE(payment_receipt_cash, 0) - COALESCE(expense_amount, 0),
  receipt_payment = 0,
  income_amount   = COALESCE(income_amount, 0)
WHERE income_expense IS NULL OR income_expense = 0;
