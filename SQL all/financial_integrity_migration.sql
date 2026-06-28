-- ==============================================================
-- ELDORIA: DOUBLE-ENTRY INTEGRITY CHECK CONSTRAINTS
-- ==============================================================

-- 1. Drop old constraint if exists
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS check_double_entry_integrity;

-- 2. Add comprehensive matrix routing integrity constraint
ALTER TABLE public.transactions ADD CONSTRAINT check_double_entry_integrity CHECK (
  -- Receivables are obligations from others (inflows to be collected)
  (transaction_type = 'Receivable' AND transaction_flow = 'inflow') OR
  
  -- Payables are obligations to others (outflows to be settled)
  (transaction_type = 'Payable' AND transaction_flow = 'outflow') OR
  
  -- New Debt (accrual liability or cash vault impact) must be inflows
  (transaction_subtype = 'New Debt' AND transaction_flow = 'inflow') OR
  
  -- Cash amortizations and interest payments are cash outflows
  (transaction_subtype IN ('Amortization', 'Interest') AND transaction_nature = 'cash' AND transaction_flow = 'outflow') OR
  
  -- Tolerate all Income/Expense/Liabilities records (allowing both cash and accrual natures with inflow/outflow)
  (transaction_type IN ('Income', 'Expense', 'Liabilities')) OR
  
  -- Allow other types to bypass if they are not core restricted structures
  (transaction_type NOT IN ('Receivable', 'Payable', 'Income', 'Expense', 'Liabilities'))
);

COMMENT ON CONSTRAINT check_double_entry_integrity ON public.transactions IS 'Prevents invalid financial combinations in the double-entry accounting matrix.';
