-- SQL Mockup Data Generator
-- Generates ~200 randomized realistic financial transaction records for testing.
-- Date range: 01/01/2026 to 05/06/2026 (today)
-- User target: Guest profile '00000000-0000-0000-0000-000000000000'

DO $$
DECLARE
    i INT;
    v_class TEXT;
    v_sub_class TEXT;
    v_entity TEXT;
    v_category TEXT;
    v_from TEXT;
    v_status TEXT;
    v_sub_category TEXT := '';
    v_amount NUMERIC;
    v_date DATE;
    v_desc TEXT;
    
    -- Option arrays
    froms TEXT[] := ARRAY['Pedro', 'Reni', 'Consolidated'];
    statuses TEXT[] := ARRAY['Pending', 'Overdue', 'Paid on Time', 'Paid Late', 'Completed'];
    entities TEXT[] := ARRAY[
        'Salary', 'Bonus', 'Shows', 'Cinema', 'Restaurant', 'Trips', 'Streaming',
        'Rent', 'Maintenance', 'Pillows', 'Health Insurance', 'Pharmacy', 'Doctor',
        'Hypermarket', 'Market', 'Fish Market', 'Butcher', 'Baker', 'Fair',
        'Fuel', 'Transport Insurance', 'Tolls', 'Maintenance Car', 'Public Transport',
        'Account Cost', 'Card Annuity', 'Interest Paid', 'IRS', 'IUC', 'Fines',
        'Interests Received', 'State Support', 'Gifts',
        'Dad', 'Mom', 'Family', 'Friends'
    ];
BEGIN
    -- 1. Ensure the Guest user exists
    INSERT INTO public.profiles (id, email, gold, level, xp, updated_at)
    VALUES (
        '00000000-0000-0000-0000-000000000000', 
        'guest@medieval.stuff', 
        35000, -- Updated Gold balance to reflect mock history
        12,    -- Mapped Level
        320,   -- Mapped XP
        NOW()
    )
    ON CONFLICT (id) DO UPDATE 
    SET 
        gold = EXCLUDED.gold, 
        level = EXCLUDED.level, 
        xp = EXCLUDED.xp, 
        updated_at = NOW();

    -- 2. Clear old transactions for this profile to prevent duplication
    DELETE FROM public.transactions WHERE profile_id = '00000000-0000-0000-0000-000000000000';

    -- 3. Generate 200 random transactions matching the medieval state keys
    FOR i IN 1..200 LOOP
        -- Select random date between 2026-01-01 and 2026-06-05
        v_date := '2026-01-01'::DATE + (random() * ('2026-06-05'::DATE - '2026-01-01'::DATE))::INT;
        
        -- Select random entity
        v_entity := entities[1 + floor(random() * array_length(entities, 1))::INT];
        
        -- Map entity category, type, category, subcategory and amount realistically
        CASE
            WHEN v_entity IN ('Salary', 'Bonus') THEN 
                v_category := 'Payroll';
                v_class := 'Income';
                v_sub_class := 'Cash receipt';
                v_amount := 800 + floor(random() * 1800);
            WHEN v_entity IN ('Shows', 'Cinema', 'Restaurant', 'Trips', 'Streaming') THEN 
                v_category := 'Entertainment';
                v_class := 'Expense';
                v_sub_class := 'Cash payment';
                v_amount := 15 + floor(random() * 60);
            WHEN v_entity IN ('Rent', 'Maintenance', 'Pillows') THEN 
                v_category := 'Housing';
                v_class := 'Expense';
                v_sub_class := 'Cash payment';
                v_amount := 40 + floor(random() * 300);
            WHEN v_entity IN ('Health Insurance', 'Pharmacy', 'Doctor') THEN 
                v_category := 'Health';
                v_class := 'Expense';
                v_sub_class := 'Cash payment';
                v_amount := 20 + floor(random() * 150);
            WHEN v_entity IN ('Hypermarket', 'Market', 'Fish Market', 'Butcher', 'Baker', 'Fair') THEN 
                v_category := 'Markets';
                v_class := 'Expense';
                v_sub_class := 'Cash payment';
                v_amount := 30 + floor(random() * 120);
            WHEN v_entity IN ('Fuel', 'Transport Insurance', 'Tolls', 'Maintenance Car', 'Public Transport') THEN 
                v_category := 'Transport';
                v_class := 'Expense';
                v_sub_class := 'Cash payment';
                v_amount := 10 + floor(random() * 70);
            WHEN v_entity IN ('Account Cost', 'Card Annuity', 'Interest Paid', 'IRS', 'IUC', 'Fines') THEN 
                v_category := 'Banking';
                v_class := 'Expense';
                v_sub_class := 'Credit payment';
                v_amount := 40 + floor(random() * 300);
            WHEN v_entity IN ('Interests Received', 'State Support', 'Gifts') THEN 
                v_category := 'Other Banking';
                v_class := 'Income';
                v_sub_class := 'Cash receipt';
                v_amount := 60 + floor(random() * 200);
            WHEN v_entity IN ('Dad', 'Mom', 'Family', 'Friends') THEN 
                v_category := 'Burrowed';
                IF random() < 0.5 THEN
                    v_class := 'Expense';
                    v_sub_class := 'Cash payment';
                    v_amount := 20 + floor(random() * 150);
                ELSE
                    v_class := 'Income';
                    v_sub_class := 'Cash receipt';
                    v_amount := 20 + floor(random() * 150);
                END IF;
        END CASE;

        -- Select random origin/from
        v_from := froms[1 + floor(random() * array_length(froms, 1))::INT];
        
        -- Select random status
        IF v_class = 'Expense' AND random() < 0.15 THEN
            IF random() < 0.5 THEN
                v_status := 'Overdue';
            ELSE
                v_status := 'Pending';
            END IF;
        ELSIF v_class = 'Income' AND random() < 0.05 THEN
            v_status := 'Pending';
        ELSE
            IF random() < 0.7 THEN
                v_status := 'Completed';
            ELSE
                v_status := 'Paid on Time';
            END IF;
        END IF;

        -- Randomly distribute a few expenses to Savings or Debt categories for variety
        IF v_class = 'Expense' AND random() < 0.08 THEN
            v_class := 'Debt';
        ELSIF v_class = 'Expense' AND random() < 0.05 THEN
            v_class := 'Savings';
        END IF;

        v_desc := 'Mockup ' || v_entity || ' transaction';

        -- Insert transaction (database trigger auto-calculates month, year, quarter, and profile Gold/XP)
        INSERT INTO public.transactions (profile_id, class, amount, "from", date, status, sub_class, entity, category, sub_category, description)
        VALUES ('00000000-0000-0000-0000-000000000000', v_class, v_amount, v_from, v_date, v_status, v_sub_class, v_entity, v_category, v_sub_category, v_desc);
    END LOOP;
END $$;
