-- SQL Mockup: Populate Supabase for Manual Testing
-- target user: Guest account ('00000000-0000-0000-0000-000000000000')

-- 1. Insert or update the guest profile
INSERT INTO public.profiles (id, email, gold, level, xp, updated_at)
VALUES (
    '00000000-0000-0000-0000-000000000000', 
    'guest@medieval.stuff', 
    5000, -- Gold reserve
    3,    -- Level
    120,  -- XP
    NOW()
)
ON CONFLICT (id) DO UPDATE 
SET 
    gold = EXCLUDED.gold, 
    level = EXCLUDED.level, 
    xp = EXCLUDED.xp, 
    updated_at = NOW();

-- 2. Clear old buildings for this profile to prevent duplication
DELETE FROM public.buildings WHERE profile_id = '00000000-0000-0000-0000-000000000000';

-- 3. Insert default buildings for the guest profile
INSERT INTO public.buildings (profile_id, type, level, stored_resources, last_collection, created_at)
VALUES 
    ('00000000-0000-0000-0000-000000000000', 'mine',      2, 45.5,  NOW() - INTERVAL '1 hour', NOW()),
    ('00000000-0000-0000-0000-000000000000', 'treasury',  1, 0.0,   NOW(),                     NOW()),
    ('00000000-0000-0000-0000-000000000000', 'market',    1, 0.0,   NOW(),                     NOW()),
    ('00000000-0000-0000-0000-000000000000', 'townhall',  1, 0.0,   NOW(),                     NOW()),
    ('00000000-0000-0000-0000-000000000000', 'townhouse', 1, 0.0,   NOW(),                     NOW()),
    ('00000000-0000-0000-0000-000000000000', 'tavern',    1, 0.0,   NOW(),                     NOW()),
    ('00000000-0000-0000-0000-000000000000', 'bounties',  1, 0.0,   NOW(),                     NOW());

-- 4. Clear old transactions for this profile to prevent duplication
DELETE FROM public.transactions WHERE profile_id = '00000000-0000-0000-0000-000000000000';

-- 5. Insert mock transactions matching the new schema
INSERT INTO public.transactions (profile_id, type, amount, "from", date, status, category, subcategory, entity, entity_category, description)
VALUES
    ('00000000-0000-0000-0000-000000000000', 'income',  1000, 'Market Stall A', '2026-05-15', 'Completed', 'Central Market', 'Ore Sales', 'Blacksmith Guild', 'Guild', 'Venda de ferro refinado'),
    ('00000000-0000-0000-0000-000000000000', 'income',  500,  'Mine Cart 3',    '2026-05-20', 'Completed', 'Gold Mine',       'Gold Extraction', 'Mine Foreman', 'Internal', 'Extração de pepitas da veia sul'),
    ('00000000-0000-0000-0000-000000000000', 'expense', 200,  'Tavern Keep',    '2026-05-22', 'Completed', 'The Tavern',      'Supplies',        'Tavern Owner', 'Merchant', 'Compra de rações e cerveja para mineiros');
