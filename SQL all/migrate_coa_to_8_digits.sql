-- SQL Migration: migrate_coa_to_8_digits.sql

-- 1. Create dim_contas table
CREATE TABLE IF NOT EXISTS public.dim_contas (
    code VARCHAR(8) PRIMARY KEY,
    account_name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    subtype VARCHAR(100) NOT NULL,
    category VARCHAR(100) NOT NULL,
    entity VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.dim_contas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lords can view accounts" ON public.dim_contas;
CREATE POLICY "Lords can view accounts" ON public.dim_contas FOR SELECT TO authenticated USING (true);

-- Ensure code constraint length
ALTER TABLE public.dim_contas DROP CONSTRAINT IF EXISTS chk_code_length;
ALTER TABLE public.dim_contas ADD CONSTRAINT chk_code_length CHECK (code ~ '^[0-9]{8}$');

-- 2. Populate dim_contas Catalog
INSERT INTO public.dim_contas (code, account_name, type, subtype, category, entity) VALUES
('10101001', 'Bank account - CGD Bank', 'Assets', 'Banks', 'Bank account', 'CGD Bank'),
('10101002', 'Bank account - Universo Bank', 'Assets', 'Banks', 'Bank account', 'Universo Bank'),
('10101003', 'Bank account - Active Bank', 'Assets', 'Banks', 'Bank account', 'Active Bank'),
('10101004', 'Bank account - Inter Bank', 'Assets', 'Banks', 'Bank account', 'Inter Bank'),
('10102001', 'Savings account - (Pedro) 0% rate Savings', 'Assets', 'Banks', 'Savings account', '(Pedro) 0% rate Savings'),
('10102002', 'Savings account - Active Bank Savings', 'Assets', 'Banks', 'Savings account', 'Active Bank Savings'),
('10102003', 'Savings account - Inter Bank Savings', 'Assets', 'Banks', 'Savings account', 'Inter Bank Savings'),
('10103001', 'Investments account - CGD Investment', 'Assets', 'Banks', 'Investments account', 'CGD Investment'),
('10103002', 'Investments account - Universo Investment', 'Assets', 'Banks', 'Investments account', 'Universo Investment'),
('10103003', 'Investments account - Active Bank Investment', 'Assets', 'Banks', 'Investments account', 'Active Bank Investment'),
('10103004', 'Investments account - Wizink Investment', 'Assets', 'Banks', 'Investments account', 'Wizink Investment'),
('10103005', 'Investments account - Inter Bank Investment', 'Assets', 'Banks', 'Investments account', 'Inter Bank Investment'),
('20101001', 'Loans - CGD Loans', 'Liabilities', 'Personal Debt', 'Loans', 'CGD Loans'),
('20101002', 'Loans - Universo Loans', 'Liabilities', 'Personal Debt', 'Loans', 'Universo Loans'),
('20101003', 'Loans - Active Bank Loans', 'Liabilities', 'Personal Debt', 'Loans', 'Active Bank Loans'),
('20101004', 'Loans - Inter Bank Loans', 'Liabilities', 'Personal Debt', 'Loans', 'Inter Bank Loans'),
('20101005', 'Loans - Wizink Loans', 'Liabilities', 'Personal Debt', 'Loans', 'Wizink Loans'),
('20101006', 'Loans - Cofidis Loans', 'Liabilities', 'Personal Debt', 'Loans', 'Cofidis Loans'),
('20101007', 'Loans - Other Loans', 'Liabilities', 'Personal Debt', 'Loans', 'Other Loans'),
('20102001', 'Borrow - Jota Burrow', 'Liabilities', 'Personal Debt', 'Borrow', 'Jota Burrow'),
('20102002', 'Borrow - Mae Burrow', 'Liabilities', 'Personal Debt', 'Borrow', 'Mae Burrow'),
('20102003', 'Borrow - Reni Burrow', 'Liabilities', 'Personal Debt', 'Borrow', 'Reni Burrow'),
('20102004', 'Borrow - Pedro Burrow', 'Liabilities', 'Personal Debt', 'Borrow', 'Pedro Burrow'),
('20102005', 'Borrow - Other Burrow', 'Liabilities', 'Personal Debt', 'Borrow', 'Other Burrow'),
('20103001', 'Credit Cards - CGD Credit Cards', 'Liabilities', 'Personal Debt', 'Credit Cards', 'CGD Credit Cards'),
('20103002', 'Credit Cards - Universo Credit Cards', 'Liabilities', 'Personal Debt', 'Credit Cards', 'Universo Credit Cards'),
('20103003', 'Credit Cards - Active Bank Credit Cards', 'Liabilities', 'Personal Debt', 'Credit Cards', 'Active Bank Credit Cards'),
('20103004', 'Credit Cards - Inter Bank Credit Cards', 'Liabilities', 'Personal Debt', 'Credit Cards', 'Inter Bank Credit Cards'),
('20103005', 'Credit Cards - Wizink Credit Cards', 'Liabilities', 'Personal Debt', 'Credit Cards', 'Wizink Credit Cards'),
('20201001', 'Other Debts - Social Security Debt', 'Liabilities', 'Other Debts', 'Other Debts', 'Social Security Debt'),
('20201002', 'Other Debts - Finances Debt', 'Liabilities', 'Other Debts', 'Other Debts', 'Finances Debt'),
('20201003', 'Other Debts - NOS Debt', 'Liabilities', 'Other Debts', 'Other Debts', 'NOS Debt'),
('60101001', 'Household - Oeiras Rent', 'Expenses', 'Living & Household', 'Household', 'Oeiras Rent'),
('60101002', 'Household - Oeiras Utensils', 'Expenses', 'Living & Household', 'Household', 'Oeiras Utensils'),
('60101003', 'Household - Oeiras Decoration', 'Expenses', 'Living & Household', 'Household', 'Oeiras Decoration'),
('60101004', 'Household - Other Household', 'Expenses', 'Living & Household', 'Household', 'Other Household'),
('60102001', 'Utilities - Electricity Expense', 'Expenses', 'Living & Household', 'Utilities', 'Electricity Expense'),
('60102002', 'Utilities - Gas Expense', 'Expenses', 'Living & Household', 'Utilities', 'Gas Expense'),
('60102003', 'Utilities - Water Expense', 'Expenses', 'Living & Household', 'Utilities', 'Water Expense'),
('60102004', 'Utilities - Communications Expense', 'Expenses', 'Living & Household', 'Utilities', 'Communications Expense'),
('60102005', 'Utilities - Other Utilities', 'Expenses', 'Living & Household', 'Utilities', 'Other Utilities'),
('60201001', 'Gasoline - Motorcycle Gas', 'Expenses', 'Personal Transports', 'Gasoline', 'Motorcycle Gas'),
('60201002', 'Gasoline - Car Gas', 'Expenses', 'Personal Transports', 'Gasoline', 'Car Gas'),
('60202001', 'Tolls - Via Verde', 'Expenses', 'Personal Transports', 'Tolls', 'Via Verde'),
('60203001', 'Parking - Parking Expense', 'Expenses', 'Personal Transports', 'Parking', 'Parking Expense'),
('60204001', 'Repairs - Motorcycle Repairs', 'Expenses', 'Personal Transports', 'Repairs', 'Motorcycle Repairs'),
('60204002', 'Repairs - Car Repairs', 'Expenses', 'Personal Transports', 'Repairs', 'Car Repairs'),
('60301001', 'Public Transports - Public Transport (Metro/Train/Bus)', 'Expenses', 'Public Transports', 'Public Transports', 'Public Transport (Metro/Train/Bus)'),
('60401001', 'Other Transports - Uber / Chauffeur', 'Expenses', 'Other Transports', 'Other Transports', 'Uber / Chauffeur'),
('60401002', 'Other Transports - Train', 'Expenses', 'Other Transports', 'Other Transports', 'Train'),
('60501001', 'Markets & Groceries - Food (Supermarket)', 'Expenses', 'Markets & Consumables', 'Markets & Groceries', 'Food (Supermarket)'),
('60501002', 'Markets & Groceries - Drinks (Supermarket)', 'Expenses', 'Markets & Consumables', 'Markets & Groceries', 'Drinks (Supermarket)'),
('60501003', 'Markets & Groceries - Alcoholic Drinks (Supermarket)', 'Expenses', 'Markets & Consumables', 'Markets & Groceries', 'Alcoholic Drinks (Supermarket)'),
('60501004', 'Markets & Groceries - Cleaning Products', 'Expenses', 'Markets & Consumables', 'Markets & Groceries', 'Cleaning Products'),
('60501005', 'Markets & Groceries - Personal Hygiene', 'Expenses', 'Markets & Consumables', 'Markets & Groceries', 'Personal Hygiene'),
('60501006', 'Markets & Groceries - Cosmetics', 'Expenses', 'Markets & Consumables', 'Markets & Groceries', 'Cosmetics'),
('60502001', 'Markets and Tools - Tools', 'Expenses', 'Markets & Consumables', 'Markets and Tools', 'Tools'),
('60503001', 'Markets and Clothing - Clothing', 'Expenses', 'Markets & Consumables', 'Markets and Clothing', 'Clothing'),
('60503002', 'Markets and Clothing - Shoes', 'Expenses', 'Markets & Consumables', 'Markets and Clothing', 'Shoes'),
('60504001', 'Other Market consumables - Other Market consumables', 'Expenses', 'Markets & Consumables', 'Other Market consumables', 'Other Market consumables'),
('60601001', 'Health expenses - Health Fees', 'Expenses', 'Health', 'Health expenses', 'Health Fees'),
('60601002', 'Health expenses - Medical Appointments', 'Expenses', 'Health', 'Health expenses', 'Medical Appointments'),
('60601003', 'Health expenses - Medical Exams', 'Expenses', 'Health', 'Health expenses', 'Medical Exams'),
('60601004', 'Health expenses - Psychology', 'Expenses', 'Health', 'Health expenses', 'Psychology'),
('60601005', 'Health expenses - Psychiatry', 'Expenses', 'Health', 'Health expenses', 'Psychiatry'),
('60601006', 'Health expenses - Dentist', 'Expenses', 'Health', 'Health expenses', 'Dentist'),
('60601007', 'Health expenses - Pharmacy', 'Expenses', 'Health', 'Health expenses', 'Pharmacy'),
('60701001', 'Entertainment expenses - Restaurant dinner', 'Expenses', 'Entertainment', 'Entertainment expenses', 'Restaurant dinner'),
('60701002', 'Entertainment expenses - Cinema Entertainment', 'Expenses', 'Entertainment', 'Entertainment expenses', 'Cinema Entertainment'),
('60701003', 'Entertainment expenses - Streaming Entertainment', 'Expenses', 'Entertainment', 'Entertainment expenses', 'Streaming Entertainment'),
('60701004', 'Entertainment expenses - Nightlife & Disco', 'Expenses', 'Entertainment', 'Entertainment expenses', 'Nightlife & Disco'),
('60701005', 'Entertainment expenses - Gaming', 'Expenses', 'Entertainment', 'Entertainment expenses', 'Gaming'),
('60801001', 'Education Expenses - PhD', 'Expenses', 'Education', 'Education Expenses', 'PhD'),
('60801002', 'Education Expenses - Trainings', 'Expenses', 'Education', 'Education Expenses', 'Trainings'),
('60901001', 'Insurance paid - Health (Insurance) pay', 'Expenses', 'Insurances', 'Insurance paid', 'Health (Insurance) pay'),
('60901002', 'Insurance paid - Car (Insurance) pay', 'Expenses', 'Insurances', 'Insurance paid', 'Car (Insurance) pay'),
('60901003', 'Insurance paid - Motorcycle (Insurance) pay', 'Expenses', 'Insurances', 'Insurance paid', 'Motorcycle (Insurance) pay'),
('60901004', 'Insurance paid - Life insurance pay', 'Expenses', 'Insurances', 'Insurance paid', 'Life insurance pay'),
('61001001', 'Taxes paid - Mobility (IUC)', 'Expenses', 'Taxes & State', 'Taxes paid', 'Mobility (IUC)'),
('61001002', 'Taxes paid - Finances', 'Expenses', 'Taxes & State', 'Taxes paid', 'Finances'),
('61001003', 'Taxes paid - Social Security', 'Expenses', 'Taxes & State', 'Taxes paid', 'Social Security'),
('61001004', 'Taxes paid - Justice', 'Expenses', 'Taxes & State', 'Taxes paid', 'Justice'),
('61001005', 'Taxes paid - IRS payment', 'Expenses', 'Taxes & State', 'Taxes paid', 'IRS payment'),
('61101001', 'Interest paid - Interest expense', 'Expenses', 'Financial Expenses', 'Interest paid', 'Interest expense'),
('61201001', 'Fines expenses - Fines expenses', 'Expenses', 'Financial Expenses', 'Fines expenses', 'Fines expenses'),
('70101001', 'Salary - Base Salary', 'Income', 'Payroll', 'Salary', 'Base Salary'),
('70101002', 'Salary - Consulting / Contract Services', 'Income', 'Payroll', 'Salary', 'Consulting / Contract Services'),
('70101003', 'Salary - Teaching Classes', 'Income', 'Payroll', 'Salary', 'Teaching Classes'),
('70101004', 'Salary - Bonus (Scorecard)', 'Income', 'Payroll', 'Salary', 'Bonus (Scorecard)'),
('70102001', 'Payroll Subsidies - Vacation Subsidy', 'Income', 'Payroll', 'Payroll Subsidies', 'Vacation Subsidy'),
('70102002', 'Payroll Subsidies - Christmas Subsidy', 'Income', 'Payroll', 'Payroll Subsidies', 'Christmas Subsidy'),
('70201001', 'Other Incomes - Family Gifts', 'Income', 'Financial Income', 'Other Incomes', 'Family Gifts'),
('70201002', 'Other Incomes - Cashbacks & Rewards', 'Income', 'Financial Income', 'Other Incomes', 'Cashbacks & Rewards'),
('70301001', 'Insurance received - Health (Insurance) refund', 'Income', 'Insurances', 'Insurance received', 'Health (Insurance) refund'),
('70301002', 'Insurance received - Car (Insurance) refund', 'Income', 'Insurances', 'Insurance received', 'Car (Insurance) refund'),
('70301003', 'Insurance received - Motorcycle (Insurance) refund', 'Income', 'Insurances', 'Insurance received', 'Motorcycle (Insurance) refund'),
('70301004', 'Insurance received - Life insurance refund', 'Income', 'Insurances', 'Insurance received', 'Life insurance refund'),
('70401001', 'Taxes received - IRS receipt', 'Income', 'Taxes & State', 'Taxes received', 'IRS receipt'),
('70401002', 'Taxes received - Mobility', 'Income', 'Taxes & State', 'Taxes received', 'Mobility'),
('70401003', 'Taxes received - Social Security', 'Income', 'Taxes & State', 'Taxes received', 'Social Security'),
('70401004', 'Taxes received - Finances', 'Income', 'Taxes & State', 'Taxes received', 'Finances'),
('70401005', 'Taxes received - Justice', 'Income', 'Taxes & State', 'Taxes received', 'Justice'),
('70401006', 'Taxes received - IRS refund', 'Income', 'Taxes & State', 'Taxes received', 'IRS refund'),
('70501001', 'Interest received - Interest received', 'Income', 'Financial Income', 'Interest received', 'Interest received'),
('70502001', 'Fines refunds - Fines refunds', 'Income', 'Financial Income', 'Fines refunds', 'Fines refunds')
ON CONFLICT (code) DO UPDATE 
SET account_name = EXCLUDED.account_name,
    type = EXCLUDED.type,
    subtype = EXCLUDED.subtype,
    category = EXCLUDED.category,
    entity = EXCLUDED.entity;

-- 3. Adjust schema column types in transactions and account_balances to VARCHAR(8)
ALTER TABLE public.transactions ALTER COLUMN target_account TYPE VARCHAR(8);
ALTER TABLE public.transactions ALTER COLUMN source_dest_bank TYPE VARCHAR(8);
ALTER TABLE public.account_balances ALTER COLUMN account_code TYPE VARCHAR(8);

-- 4. Create De-Para mapping and execute updates
CREATE OR REPLACE FUNCTION public.tmp_migrate_data_to_8_digits()
RETURNS VOID AS $$
BEGIN
    -- Update transactions.target_account
    UPDATE public.transactions SET target_account = '10101001' WHERE target_account = '111001';
    UPDATE public.transactions SET target_account = '10101002' WHERE target_account = '111002';
    UPDATE public.transactions SET target_account = '10101003' WHERE target_account = '111003';
    UPDATE public.transactions SET target_account = '10101004' WHERE target_account = '111004';
    UPDATE public.transactions SET target_account = '10102001' WHERE target_account = '131001';
    UPDATE public.transactions SET target_account = '10102002' WHERE target_account = '131002';
    UPDATE public.transactions SET target_account = '10102003' WHERE target_account = '131003';
    UPDATE public.transactions SET target_account = '10103001' WHERE target_account = '121001';
    UPDATE public.transactions SET target_account = '10103002' WHERE target_account = '121002';
    UPDATE public.transactions SET target_account = '10103003' WHERE target_account = '121003';
    UPDATE public.transactions SET target_account = '10103004' WHERE target_account = '121004';
    UPDATE public.transactions SET target_account = '10103005' WHERE target_account = '121005';
    UPDATE public.transactions SET target_account = '20101001' WHERE target_account = '211001';
    UPDATE public.transactions SET target_account = '20101002' WHERE target_account = '211002';
    UPDATE public.transactions SET target_account = '20101003' WHERE target_account = '211003';
    UPDATE public.transactions SET target_account = '20101004' WHERE target_account = '211004';
    UPDATE public.transactions SET target_account = '20101005' WHERE target_account = '211005';
    UPDATE public.transactions SET target_account = '20101006' WHERE target_account = '211006';
    UPDATE public.transactions SET target_account = '20102001' WHERE target_account = '212001';
    UPDATE public.transactions SET target_account = '20102002' WHERE target_account = '212002';
    UPDATE public.transactions SET target_account = '20102003' WHERE target_account = '212003';
    UPDATE public.transactions SET target_account = '20102004' WHERE target_account = '212004';
    UPDATE public.transactions SET target_account = '20103001' WHERE target_account = '221001';
    UPDATE public.transactions SET target_account = '20103002' WHERE target_account = '221002';
    UPDATE public.transactions SET target_account = '20103003' WHERE target_account = '221003';
    UPDATE public.transactions SET target_account = '20103004' WHERE target_account = '221004';
    UPDATE public.transactions SET target_account = '20103005' WHERE target_account = '221005';
    UPDATE public.transactions SET target_account = '20201001' WHERE target_account = '231001';
    UPDATE public.transactions SET target_account = '20201002' WHERE target_account = '231002';
    UPDATE public.transactions SET target_account = '20201003' WHERE target_account = '231003';
    UPDATE public.transactions SET target_account = '60101001' WHERE target_account = '611001';
    UPDATE public.transactions SET target_account = '60101002' WHERE target_account = '611002';
    UPDATE public.transactions SET target_account = '60101003' WHERE target_account = '611003';
    UPDATE public.transactions SET target_account = '60101004' WHERE target_account = '611004';
    UPDATE public.transactions SET target_account = '60102001' WHERE target_account = '621001';
    UPDATE public.transactions SET target_account = '60102002' WHERE target_account = '621002';
    UPDATE public.transactions SET target_account = '60102003' WHERE target_account = '621003';
    UPDATE public.transactions SET target_account = '60102004' WHERE target_account = '621004';
    UPDATE public.transactions SET target_account = '60102005' WHERE target_account = '621005';
    UPDATE public.transactions SET target_account = '60201001' WHERE target_account = '631001';
    UPDATE public.transactions SET target_account = '60202001' WHERE target_account = '631002';
    UPDATE public.transactions SET target_account = '60203001' WHERE target_account = '631003';
    UPDATE public.transactions SET target_account = '60301001' WHERE target_account = '632001';
    UPDATE public.transactions SET target_account = '60501001' WHERE target_account = '641001';
    UPDATE public.transactions SET target_account = '60502001' WHERE target_account = '642001';
    UPDATE public.transactions SET target_account = '60503001' WHERE target_account = '643001';
    UPDATE public.transactions SET target_account = '60501006' WHERE target_account = '644001';
    UPDATE public.transactions SET target_account = '60503002' WHERE target_account = '645001';
    UPDATE public.transactions SET target_account = '60901001' WHERE target_account = '651001';
    UPDATE public.transactions SET target_account = '60601007' WHERE target_account = '651002';
    UPDATE public.transactions SET target_account = '60601007' WHERE target_account = '651009';
    UPDATE public.transactions SET target_account = '60601001' WHERE target_account = '651003';
    UPDATE public.transactions SET target_account = '60601002' WHERE target_account = '651004';
    UPDATE public.transactions SET target_account = '60601003' WHERE target_account = '651005';
    UPDATE public.transactions SET target_account = '60601004' WHERE target_account = '651006';
    UPDATE public.transactions SET target_account = '60601005' WHERE target_account = '651007';
    UPDATE public.transactions SET target_account = '60601006' WHERE target_account = '651008';
    UPDATE public.transactions SET target_account = '60701001' WHERE target_account = '661001';
    UPDATE public.transactions SET target_account = '60701002' WHERE target_account = '662001';
    UPDATE public.transactions SET target_account = '60701003' WHERE target_account = '663001';
    UPDATE public.transactions SET target_account = '60701004' WHERE target_account = '664001';
    UPDATE public.transactions SET target_account = '60701005' WHERE target_account = '665001';
    UPDATE public.transactions SET target_account = '60801001' WHERE target_account = '671001';
    UPDATE public.transactions SET target_account = '60801002' WHERE target_account = '671002';
    UPDATE public.transactions SET target_account = '61001002' WHERE target_account = '681001';
    UPDATE public.transactions SET target_account = '61101001' WHERE target_account = '681002';
    UPDATE public.transactions SET target_account = '70101001' WHERE target_account = '711001';
    UPDATE public.transactions SET target_account = '70101004' WHERE target_account = '711002';
    UPDATE public.transactions SET target_account = '70101004' WHERE target_account = '711003';
    UPDATE public.transactions SET target_account = '70102001' WHERE target_account = '711004';
    UPDATE public.transactions SET target_account = '70102002' WHERE target_account = '711005';
    UPDATE public.transactions SET target_account = '70101002' WHERE target_account = '712001';
    UPDATE public.transactions SET target_account = '70101003' WHERE target_account = '712002';
    UPDATE public.transactions SET target_account = '70201002' WHERE target_account = '721001';
    UPDATE public.transactions SET target_account = '70501001' WHERE target_account = '721002';
    UPDATE public.transactions SET target_account = '70401006' WHERE target_account = '731001';
    UPDATE public.transactions SET target_account = '70201001' WHERE target_account = '731002';
    UPDATE public.transactions SET target_account = '70201002' WHERE target_account = '731003';

    -- Update transactions.source_dest_bank
    UPDATE public.transactions SET source_dest_bank = '10101001' WHERE source_dest_bank = '111001';
    UPDATE public.transactions SET source_dest_bank = '10101002' WHERE source_dest_bank = '111002';
    UPDATE public.transactions SET source_dest_bank = '10101003' WHERE source_dest_bank = '111003';
    UPDATE public.transactions SET source_dest_bank = '10101004' WHERE source_dest_bank = '111004';
    UPDATE public.transactions SET source_dest_bank = '10102001' WHERE source_dest_bank = '131001';
    UPDATE public.transactions SET source_dest_bank = '10102002' WHERE source_dest_bank = '131002';
    UPDATE public.transactions SET source_dest_bank = '10102003' WHERE source_dest_bank = '131003';
    UPDATE public.transactions SET source_dest_bank = '10103001' WHERE source_dest_bank = '121001';
    UPDATE public.transactions SET source_dest_bank = '10103002' WHERE source_dest_bank = '121002';
    UPDATE public.transactions SET source_dest_bank = '10103003' WHERE source_dest_bank = '121003';
    UPDATE public.transactions SET source_dest_bank = '10103004' WHERE source_dest_bank = '121004';
    UPDATE public.transactions SET source_dest_bank = '10103005' WHERE source_dest_bank = '121005';
    UPDATE public.transactions SET source_dest_bank = '20101001' WHERE source_dest_bank = '211001';
    UPDATE public.transactions SET source_dest_bank = '20101002' WHERE source_dest_bank = '211002';
    UPDATE public.transactions SET source_dest_bank = '20101003' WHERE source_dest_bank = '211003';
    UPDATE public.transactions SET source_dest_bank = '20101004' WHERE source_dest_bank = '211004';
    UPDATE public.transactions SET source_dest_bank = '20101005' WHERE source_dest_bank = '211005';
    UPDATE public.transactions SET source_dest_bank = '20101006' WHERE source_dest_bank = '211006';
    UPDATE public.transactions SET source_dest_bank = '20102001' WHERE source_dest_bank = '212001';
    UPDATE public.transactions SET source_dest_bank = '20102002' WHERE source_dest_bank = '212002';
    UPDATE public.transactions SET source_dest_bank = '20102003' WHERE source_dest_bank = '212003';
    UPDATE public.transactions SET source_dest_bank = '20102004' WHERE source_dest_bank = '212004';
    UPDATE public.transactions SET source_dest_bank = '20103001' WHERE source_dest_bank = '221001';
    UPDATE public.transactions SET source_dest_bank = '20103002' WHERE source_dest_bank = '221002';
    UPDATE public.transactions SET source_dest_bank = '20103003' WHERE source_dest_bank = '221003';
    UPDATE public.transactions SET source_dest_bank = '20103004' WHERE source_dest_bank = '221004';
    UPDATE public.transactions SET source_dest_bank = '20103005' WHERE source_dest_bank = '221005';
    UPDATE public.transactions SET source_dest_bank = '20201001' WHERE source_dest_bank = '231001';
    UPDATE public.transactions SET source_dest_bank = '20201002' WHERE source_dest_bank = '231002';
    UPDATE public.transactions SET source_dest_bank = '20201003' WHERE source_dest_bank = '231003';

    -- Update account_balances
    UPDATE public.account_balances SET account_code = '10101001' WHERE account_code = '111001';
    UPDATE public.account_balances SET account_code = '10101002' WHERE account_code = '111002';
    UPDATE public.account_balances SET account_code = '10101003' WHERE account_code = '111003';
    UPDATE public.account_balances SET account_code = '10101004' WHERE account_code = '111004';
    UPDATE public.account_balances SET account_code = '10102001' WHERE account_code = '131001';
    UPDATE public.account_balances SET account_code = '10102002' WHERE account_code = '131002';
    UPDATE public.account_balances SET account_code = '10102003' WHERE account_code = '131003';
    UPDATE public.account_balances SET account_code = '10103001' WHERE account_code = '121001';
    UPDATE public.account_balances SET account_code = '10103002' WHERE account_code = '121002';
    UPDATE public.account_balances SET account_code = '10103003' WHERE account_code = '121003';
    UPDATE public.account_balances SET account_code = '10103004' WHERE account_code = '121004';
    UPDATE public.account_balances SET account_code = '10103005' WHERE account_code = '121005';
    UPDATE public.account_balances SET account_code = '20101001' WHERE account_code = '211001';
    UPDATE public.account_balances SET account_code = '20101002' WHERE account_code = '211002';
    UPDATE public.account_balances SET account_code = '20101003' WHERE account_code = '211003';
    UPDATE public.account_balances SET account_code = '20101004' WHERE account_code = '211004';
    UPDATE public.account_balances SET account_code = '20101005' WHERE account_code = '211005';
    UPDATE public.account_balances SET account_code = '20101006' WHERE account_code = '211006';
    UPDATE public.account_balances SET account_code = '20102001' WHERE account_code = '212001';
    UPDATE public.account_balances SET account_code = '20102002' WHERE account_code = '212002';
    UPDATE public.account_balances SET account_code = '20102003' WHERE account_code = '212003';
    UPDATE public.account_balances SET account_code = '20102004' WHERE account_code = '212004';
    UPDATE public.account_balances SET account_code = '20103001' WHERE account_code = '221001';
    UPDATE public.account_balances SET account_code = '20103002' WHERE account_code = '221002';
    UPDATE public.account_balances SET account_code = '20103003' WHERE account_code = '221003';
    UPDATE public.account_balances SET account_code = '20103004' WHERE account_code = '221004';
    UPDATE public.account_balances SET account_code = '20103005' WHERE account_code = '221005';
    UPDATE public.account_balances SET account_code = '20201001' WHERE account_code = '231001';
    UPDATE public.account_balances SET account_code = '20201002' WHERE account_code = '231002';
    UPDATE public.account_balances SET account_code = '20201003' WHERE account_code = '231003';
END;
$$ LANGUAGE plpgsql;

SELECT public.tmp_migrate_data_to_8_digits();
DROP FUNCTION public.tmp_migrate_data_to_8_digits();
