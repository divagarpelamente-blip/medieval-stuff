-- Migration: Add income_amount, income_expense, receipt_payment columns to treasury_records
-- Run this in your Supabase SQL editor

ALTER TABLE treasury_records
  ADD COLUMN IF NOT EXISTS income_amount    NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS income_expense   NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS receipt_payment  NUMERIC DEFAULT 0;

-- Back-fill existing rows:
-- income_expense = payment_receipt_cash (was treated as income) - expense_amount
-- receipt_payment = 0 (no historical split data available)
UPDATE treasury_records
SET
  income_expense  = COALESCE(payment_receipt_cash, 0) - COALESCE(expense_amount, 0),
  receipt_payment = 0,
  income_amount   = 0
WHERE income_expense IS NULL OR income_expense = 0;
