-- 1. Drop old constraint if exists
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS check_double_entry_integrity;

-- 2. Alter column types to support longer values (Liabilities is 11 chars)
ALTER TABLE public.transactions ALTER COLUMN transaction_type TYPE character varying(30);

-- 2. Migrate existing transaction_type values
UPDATE public.transactions SET transaction_type = 'Assets' WHERE transaction_type = 'Asset';
UPDATE public.transactions SET transaction_type = 'Liabilities' WHERE transaction_type = 'Debt';

-- 3. Migrate existing transaction_subtype values to new taxonomy
UPDATE public.transactions 
SET transaction_subtype = CASE
  WHEN transaction_subtype IN ('New Debt', 'Loan Received') THEN 'Other Debts'
  WHEN transaction_subtype IN ('Amortization', 'Interest', 'Credit Purchase', 'CC Payment', 'Loan Payment', 'Personal Debt') THEN 'Personal Debt'
  WHEN transaction_subtype IN ('Internal Transfer', 'Transfers', 'Transfer') THEN 'Banks'
  WHEN transaction_subtype IN ('Salary', 'Benefits', 'Bonus', 'Freelance') THEN 'Payroll'
  WHEN transaction_subtype IN ('State Tax', 'Gov Tax', 'Fees/Duties', 'Gov Refund', 'Vehicle Tax', 'Traffic Fine', 'Transit Fine') THEN 'Taxes & State'
  WHEN transaction_subtype IN ('Groceries', 'Supermarket') THEN 'Food & Consumables'
  WHEN transaction_subtype IN ('Hardware') THEN 'Tools & Materials'
  WHEN transaction_subtype IN ('Clothing', 'Apparel') THEN 'Clothing & Shoes'
  WHEN transaction_subtype IN ('Cosmetics', 'Personal Care') THEN 'Markets & Personal care'
  WHEN transaction_subtype IN ('Fuel', 'Auto Repair', 'Gasoline') THEN 'Personal Transports'
  WHEN transaction_subtype IN ('Parking Fee', 'Highway Toll', 'Public Transit', 'Tolls', 'Parking', 'Public Transports') THEN 'Public Transports'
  WHEN transaction_subtype IN ('Rent Payment', 'Home Maintenance', 'Home Decor', 'Kitchen/Home', 'Rent') THEN 'Living & Household'
  WHEN transaction_subtype IN ('Utility Bill', 'Internet/Phone', 'Electricity', 'Gas', 'Water', 'Communications', 'Repairs') THEN 'Utilities'
  WHEN transaction_subtype IN ('Dining Out', 'Movies', 'Drinks/Clubs', 'Restaurant', 'Cinema') THEN 'Entertainment'
  WHEN transaction_subtype IN ('Medication', 'Emergency/Care', 'Medical Tests') THEN 'Health'
  ELSE 'Banks'
END;


-- 5. Re-create double-entry integrity check constraint
ALTER TABLE public.transactions ADD CONSTRAINT check_double_entry_integrity CHECK (
  -- Receivables are obligations from others (inflows to be collected)
  (transaction_type = 'Receivable' AND flow = 'inflow') OR
  
  -- Payables are obligations to others (outflows to be settled)
  (transaction_type = 'Payable' AND flow = 'outflow') OR
  
  -- Tolerate Income/Expense records
  (transaction_type IN ('Income', 'Expense')) OR
  
  -- Allow other types to bypass if they are not core restricted structures
  (transaction_type NOT IN ('Receivable', 'Payable', 'Income', 'Expense', 'Liabilities'))
);
