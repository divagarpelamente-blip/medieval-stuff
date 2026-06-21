-- SQL Script to generate 500 mock transactions for the year 2026
-- Uses the 44 quick action templates to populate the database with balanced examples

DO $$
DECLARE
    v_profile_id UUID;
    v_rec_count INT := 500;
BEGIN
    -- 1. Grab the first available admin profile to attach the transactions to
    SELECT id INTO v_profile_id FROM public.profiles WHERE role = 'admin' LIMIT 1;
    
    IF v_profile_id IS NULL THEN
        v_profile_id := gen_random_uuid();
        INSERT INTO public.profiles (id, email, gold, level, xp, role)
        VALUES (v_profile_id, 'royal_admin@kingdom.gov', 100000, 10, 5000, 'admin');
    END IF;

    -- 2. Create a temporary table of our 44 Quick Action templates
    CREATE TEMP TABLE temp_mock_templates (
        id SERIAL PRIMARY KEY,
        name TEXT,
        transaction_type TEXT,
        transaction_subtype TEXT,
        transaction_category TEXT,
        entity TEXT,
        source_dest_bank TEXT,
        target_account TEXT,
        flow TEXT,
        payment_status TEXT,
        description TEXT,
        min_amount NUMERIC,
        max_amount NUMERIC
    );

    INSERT INTO temp_mock_templates 
        (name, transaction_type, transaction_subtype, transaction_category, entity, source_dest_bank, target_account, flow, payment_status, description, min_amount, max_amount) 
    VALUES
        ('Transfers', 'Assets', 'Internal Transfer', 'Banking', 'CGD', '111001', '131001', 'neutral', 'Completed', 'Internal transfer', 50, 500),
        ('Use Credit card', 'Liabilities', 'Credit Purchase', 'Banking', 'Universo', '221002', '641001', 'outflow', 'Completed', 'Credit card purchase', 10, 150),
        ('Pay Credit card', 'Liabilities', 'CC Payment', 'Banking', 'WizInk', '111001', '221004', 'outflow', 'Completed', 'Pay credit card bill', 50, 300),
        ('Amortize Loan', 'Liabilities', 'Loan Payment', 'Banking', 'CGD', '111001', '211001', 'outflow', 'Completed', 'Loan amortization', 100, 500),
        ('Burrow cash', 'Liabilities', 'Loan Received', 'Burrowed', 'Jota', '212001', '111001', 'inflow', 'Completed', 'Borrow cash', 200, 1000),
        ('Repay Personal Debt', 'Liabilities', 'Personal Debt', 'Burrowed', 'Mae', '111001', '212002', 'outflow', 'Completed', 'Repay personal debt', 50, 250),
        ('Rent', 'Expense', 'Rent Payment', 'Housing', 'Landlord', '111001', '611001', 'outflow', 'Completed', 'Rent payment', 600, 1200),
        ('Repairs', 'Expense', 'Home Maintenance', 'Housing', 'Repairs', '111001', '611002', 'outflow', 'Completed', 'Repairs', 20, 300),
        ('Decorations', 'Expense', 'Home Decor', 'Housing', 'Home Decor', '111001', '611003', 'outflow', 'Completed', 'Decorations', 15, 200),
        ('Utensils', 'Expense', 'Kitchen/Home', 'Housing', 'Kitchen/Home', '111001', '611004', 'outflow', 'Completed', 'Utensils', 10, 100),
        ('Electricity', 'Expense', 'Utility Bill', 'Housing', 'Energy', '111001', '621001', 'outflow', 'Completed', 'Electricity bill', 40, 150),
        ('Gas', 'Expense', 'Utility Bill', 'Housing', 'Gas', '111001', '621002', 'outflow', 'Completed', 'Gas bill', 20, 80),
        ('Water', 'Expense', 'Utility Bill', 'Housing', 'Water', '111001', '621003', 'outflow', 'Completed', 'Water bill', 15, 60),
        ('Communications', 'Expense', 'Internet/Phone', 'Housing', 'Internet', '111001', '621004', 'outflow', 'Completed', 'Communications bill', 30, 90),
        ('Gasoline', 'Expense', 'Fuel', 'Transport', 'Gasoline', '111001', '631001', 'outflow', 'Completed', 'Gasoline', 40, 100),
        ('Repairs/maintenance', 'Expense', 'Auto Repair', 'Transport', 'Vehicle repairs', '111001', '642001', 'outflow', 'Completed', 'Vehicle maintenance', 50, 400),
        ('Parking', 'Expense', 'Parking Fee', 'Transport', 'Parking', '111001', '631003', 'outflow', 'Completed', 'Parking fee', 2, 20),
        ('Tolls', 'Expense', 'Highway Toll', 'Transport', 'Tolls', '111001', '631002', 'outflow', 'Completed', 'Highway toll', 5, 50),
        ('Taxes (Transport)', 'Expense', 'Vehicle Tax', 'Transport', 'Vehicle Tax', '111001', '681002', 'outflow', 'Completed', 'Vehicle tax', 50, 200),
        ('Fines (Personal)', 'Expense', 'Traffic Fine', 'Transport', 'Traffic Fine', '111001', '681002', 'outflow', 'Completed', 'Traffic fine', 30, 120),
        ('Metro', 'Expense', 'Public Transit', 'Transport', 'Public Transit', '111001', '631003', 'outflow', 'Completed', 'Metro public transit', 1, 10),
        ('Bus', 'Expense', 'Public Transit', 'Transport', 'Bus', '111001', '631003', 'outflow', 'Completed', 'Bus public transit', 1, 5),
        ('Train', 'Expense', 'Public Transit', 'Transport', 'Public Transit', '111001', '631003', 'outflow', 'Completed', 'Train public transit', 5, 30),
        ('Fines (Public)', 'Expense', 'Transit Fine', 'Transport', 'Transit Fine', '111001', '681002', 'outflow', 'Completed', 'Transit fine', 10, 60),
        ('Food & Consumables', 'Expense', 'Groceries', 'Markets', 'Supermarket', '111001', '641001', 'outflow', 'Completed', 'Groceries', 20, 250),
        ('Tools & Materials', 'Expense', 'Hardware', 'Markets', 'Tools and Equipment', '111001', '642001', 'outflow', 'Completed', 'Hardware tools & materials', 10, 150),
        ('Clothing', 'Expense', 'Apparel', 'Markets', 'Clothing', '111001', '643001', 'outflow', 'Completed', 'Clothing', 20, 200),
        ('Restaurants', 'Expense', 'Dining Out', 'Entertainment', 'Restaurant', '111001', '661001', 'outflow', 'Completed', 'Dining out at restaurant', 15, 120),
        ('Cinema', 'Expense', 'Movies', 'Entertainment', 'Cinema', '111001', '662001', 'outflow', 'Completed', 'Cinema movies', 10, 40),
        ('Bars & Nightlife', 'Expense', 'Drinks/Clubs', 'Entertainment', 'Shows', '111001', '661001', 'outflow', 'Completed', 'Bars & nightlife drinks', 10, 80),
        ('Pharmacy', 'Expense', 'Medication', 'Health', 'Medicine', '111001', '651002', 'outflow', 'Completed', 'Pharmacy medication', 5, 100),
        ('Hospital', 'Expense', 'Emergency/Care', 'Health', 'Medical Appointments', '111001', '651004', 'outflow', 'Completed', 'Medical appointment/hospital', 20, 300),
        ('Exams', 'Expense', 'Medical Tests', 'Health', 'Medical Exams', '111001', '651005', 'outflow', 'Completed', 'Medical exams/tests', 30, 250),
        ('Haircuts/Grooming', 'Expense', 'Personal Care', 'Markets', 'Personal Care', '111001', '643001', 'outflow', 'Completed', 'Personal care grooming', 10, 50),
        ('Makeups', 'Expense', 'Cosmetics', 'Markets', 'Cosmetics', '111001', '641001', 'outflow', 'Completed', 'Cosmetics/makeups', 10, 80),
        ('Base Salary', 'Income', 'Salary', 'Payroll', 'Salary', '111001', '711001', 'inflow', 'Completed', 'Base salary income', 1500, 3000),
        ('Meal Allowance', 'Income', 'Benefits', 'Payroll', 'Salary', '111001', '711002', 'inflow', 'Completed', 'Meal allowance subsidies', 150, 250),
        ('Holiday & Xmas Bonus', 'Income', 'Bonus', 'Payroll', 'Bonus', '111001', '711003', 'inflow', 'Completed', 'Holiday & Christmas bonus', 1000, 3000),
        ('Consulting/Contracts', 'Income', 'Freelance', 'Payroll', 'Freelance', '111001', '712001', 'inflow', 'Completed', 'Consulting contract income', 500, 4000),
        ('Social Security', 'Expense', 'State Tax', 'Taxes', 'State Tax', '111001', '681002', 'outflow', 'Completed', 'Social security state tax', 150, 400),
        ('Finance', 'Expense', 'Gov Tax', 'Taxes', 'Gov Tax', '111001', '681002', 'outflow', 'Completed', 'Finance government tax', 50, 300),
        ('Other Taxes & State', 'Expense', 'Fees/Duties', 'Taxes', 'Fees/Duties', '111001', '681002', 'outflow', 'Completed', 'Other taxes and state duties', 10, 100),
        ('IRS Tax Refund', 'Income', 'Gov Refund', 'Taxes', 'Gov Refund', '111001', '731001', 'inflow', 'Completed', 'IRS tax refund', 200, 1000),
        ('Family Gifts', 'Income', 'Gift', 'Other Income', 'Gift', '111001', '731002', 'inflow', 'Completed', 'Family gifts', 50, 500),
        ('Cashbacks & Rewards', 'Income', 'Rewards', 'Other Income', 'Rewards', '111001', '731003', 'inflow', 'Completed', 'Cashbacks & rewards', 5, 50);

    -- 3. Populate 500 records distributed across the months of 2026
    FOR i IN 1..v_rec_count LOOP
        INSERT INTO public.transactions (
            id,
            profile_id,
            amount,
            origin,
            posting_date,
            value_date,
            payment_status,
            transaction_type,
            transaction_subtype,
            entity,
            target_account,
            source_dest_bank,
            flow,
            description,
            created_at
        )
        SELECT
            gen_random_uuid(),
            v_profile_id,
            -- Random amount between template bounds
            (random() * (t.max_amount - t.min_amount) + t.min_amount)::numeric(10, 2),
            -- Origin
            CASE 
                WHEN t.transaction_type = 'Income' THEN 'Employer / Client'
                ELSE 'Pedro'
            END,
            -- Posting date: randomly spread across year 2026
            v_date,
            v_date,
            t.payment_status,
            t.transaction_type,
            t.transaction_subtype,
            t.entity,
            t.target_account,
            t.source_dest_bank,
            t.flow,
            t.description,
            v_date::timestamp + (random() * 86400 * interval '1 second')
        FROM (
            -- Pick a random template row
            SELECT * FROM temp_mock_templates 
            ORDER BY random() 
            LIMIT 1
        ) t
        CROSS JOIN (
            -- Pick a random date in 2026
            SELECT ('2026-01-01'::date + (random() * 364)::integer) AS v_date
        ) d;
    END LOOP;

    -- Clean up temp table
    DROP TABLE temp_mock_templates;
END $$;
