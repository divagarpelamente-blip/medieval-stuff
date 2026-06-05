-- SQL Mockup Data Generator
-- Generates ~200 randomized realistic financial transaction records for testing.
-- Date range: 01/01/2026 to 05/06/2026 (today)
-- User target: Guest profile '00000000-0000-0000-0000-000000000000'

DO $$
DECLARE
    i INT;
    v_type TEXT;
    v_category TEXT;
    v_entity TEXT;
    v_entity_category TEXT;
    v_from TEXT;
    v_status TEXT;
    v_subcategory TEXT;
    v_amount NUMERIC;
    v_date DATE;
    v_desc TEXT;
    
    -- Option arrays
    froms TEXT[] := ARRAY['Pedro', 'Reni', 'Consolidated'];
    statuses TEXT[] := ARRAY['Pending', 'Overdue', 'Paid on Time', 'Paid Late', 'Completed'];
    entities TEXT[] := ARRAY[
        'Salary', 'Bonus', 'CGD', 'Universo', 'ActiveBank', 'WizInk', 
        'Inter(Brasil)', 'Cofidis', 'Jota', 'Mae', 'Rent', 'Endesa', 
        'Digal', 'Simas', 'NOS', 'Gasoline', 'Repairs', 'Fees', 'Via Verde'
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
        CASE v_entity
            WHEN 'Salary', 'Bonus' THEN 
                v_entity_category := 'Payroll';
                v_type := 'income';
                v_category := 'Income';
                v_subcategory := 'Cash receipt';
                v_amount := 800 + floor(random() * 1800); -- Higher amounts for salaries/bonuses
            WHEN 'CGD', 'Universo', 'ActiveBank', 'WizInk', 'Inter(Brasil)', 'Cofidis', 'Jota', 'Mae' THEN 
                v_entity_category := 'Bank (Credit Card)';
                IF random() < 0.85 THEN
                    v_type := 'expense';
                    v_category := 'Expense';
                    v_subcategory := 'Credit payment';
                    v_amount := 30 + floor(random() * 450);
                ELSE
                    v_type := 'income';
                    v_category := 'Income';
                    v_subcategory := 'Credit receipt';
                    v_amount := 10 + floor(random() * 150);
                END IF;
            WHEN 'Rent' THEN 
                v_entity_category := 'Rent';
                v_type := 'expense';
                v_category := 'Expense';
                v_subcategory := 'Cash payment';
                v_amount := 350 + floor(random() * 250);
            WHEN 'Endesa', 'Digal', 'Simas', 'NOS' THEN 
                v_entity_category := 'Utilities';
                v_type := 'expense';
                v_category := 'Expense';
                v_subcategory := 'Cash payment';
                v_amount := 20 + floor(random() * 110);
            ELSE -- 'Gasoline', 'Repairs', 'Fees', 'Via Verde'
                v_entity_category := 'Transports';
                v_type := 'expense';
                v_category := 'Expense';
                v_subcategory := 'Cash payment';
                v_amount := 10 + floor(random() * 120);
        END CASE;

        -- Select random origin/from
        v_from := froms[1 + floor(random() * array_length(froms, 1))::INT];
        
        -- Select random status
        IF v_type = 'expense' AND random() < 0.15 THEN
            IF random() < 0.5 THEN
                v_status := 'Overdue';
            ELSE
                v_status := 'Pending';
            END IF;
        ELSIF v_type = 'income' AND random() < 0.05 THEN
            v_status := 'Pending';
        ELSE
            IF random() < 0.7 THEN
                v_status := 'Completed';
            ELSE
                v_status := 'Paid on Time';
            END IF;
        END IF;

        -- Randomly distribute a few expenses to Savings or Debt categories for variety
        IF v_category = 'Expense' AND random() < 0.08 THEN
            v_category := 'Debt';
        ELSIF v_category = 'Expense' AND random() < 0.05 THEN
            v_category := 'Savings';
        END IF;

        v_desc := 'Mockup ' || v_entity || ' transaction';

        -- Insert transaction (database trigger auto-calculates month, year, quarter, and profile Gold/XP)
        INSERT INTO public.transactions (profile_id, type, amount, "from", date, status, category, subcategory, entity, entity_category, description)
        VALUES ('00000000-0000-0000-0000-000000000000', v_type, v_amount, v_from, v_date, v_status, v_category, v_subcategory, v_entity, v_entity_category, v_desc);
    END LOOP;
END $$;
