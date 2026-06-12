-- Script to generate 300 diverse mock transactions for the Treasury Dashboard
-- This ensures all chart types (Area, Donut, Flow, Entities) have rich data spanning the last 3 years.

DO $$
DECLARE
    v_profile_id UUID;
BEGIN
    -- 1. Grab the first available profile to attach the transactions to
    SELECT id INTO v_profile_id FROM public.profiles LIMIT 1;
    
    IF v_profile_id IS NULL THEN
        -- If no profile exists, create a dummy one just for the mock data
        v_profile_id := gen_random_uuid();
        INSERT INTO public.profiles (id, email, gold, level, xp)
        VALUES (v_profile_id, 'royal_treasurer@kingdom.com', 100000, 10, 5000);
    END IF;

    -- 2. (Optional) Clear existing transactions for a clean slate
    -- Uncomment the line below if you want to wipe old data before inserting
    -- DELETE FROM public.transactions WHERE profile_id = v_profile_id;

    -- 3. Insert 300 randomized records
    INSERT INTO public.transactions (
        id,
        profile_id, 
        amount, 
        transaction_type, 
        transaction_subtype, 
        transaction_category, 
        transaction_nature, 
        transaction_flow, 
        entity, 
        date, 
        created_at
    )
    SELECT
        gen_random_uuid(),
        v_profile_id,
        
        -- Amount between 10.00 and 8010.00
        (random() * 8000 + 10)::numeric(10, 2) AS amount,
        
        -- Randomize Income / Expense
        CASE (random() * 1)::int 
            WHEN 0 THEN 'Income' 
            ELSE 'Expense' 
        END AS transaction_type,
        
        -- Static Subtype
        'General' AS transaction_subtype,
        
        -- Randomize Categories (including Banking/Burrowed for Debt Metrics)
        CASE (random() * 7)::int
            WHEN 0 THEN 'Consulting'
            WHEN 1 THEN 'SaaS Tools'
            WHEN 2 THEN 'Marketing'
            WHEN 3 THEN 'Hardware'
            WHEN 4 THEN 'Banking'
            WHEN 5 THEN 'Burrowed'
            WHEN 6 THEN 'Tavern Upkeep'
            ELSE 'Castle Repairs'
        END AS transaction_category,
        
        -- Randomize Nature (Cash vs Accrual)
        CASE (random() * 1)::int 
            WHEN 0 THEN 'cash' 
            ELSE 'accrual' 
        END AS transaction_nature,
        
        -- Randomize Flow (Inflow vs Outflow)
        CASE (random() * 1)::int 
            WHEN 0 THEN 'inflow' 
            ELSE 'outflow' 
        END AS transaction_flow,
        
        -- Randomize Entities
        CASE (random() * 6)::int
            WHEN 0 THEN 'Crown Treasury'
            WHEN 1 THEN 'Merchant Guild'
            WHEN 2 THEN 'Iron Bank'
            WHEN 3 THEN 'Local Tavern'
            WHEN 4 THEN 'Blacksmith Forge'
            WHEN 5 THEN 'Royal Armory'
            ELSE 'Foreign Emissary'
        END AS entity,
        
        -- Generate random dates within the last 3 years (1095 days)
        CURRENT_DATE - (random() * 1095)::integer AS date,
        
        -- Timestamps
        now() - (random() * 1095 * interval '1 day') AS created_at
    FROM generate_series(1, 300);

END $$;
