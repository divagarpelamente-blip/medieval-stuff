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
INSERT INTO public.transactions (profile_id, class, amount, "from", date, status, sub_class, entity, category, description)
VALUES
    ('00000000-0000-0000-0000-000000000000', 'Income',  1000, 'Pedro', '2026-05-15', 'Completed', 'Cash receipt', 'Salary', 'Payroll', 'Ordenado de Maio'),
    ('00000000-0000-0000-0000-000000000000', 'Income',  500,  'Consolidated',    '2026-05-20', 'Completed', 'Cash receipt', 'Bonus', 'Payroll', 'Bónus de performance'),
    ('00000000-0000-0000-0000-000000000000', 'Expense', 200,  'Reni',    '2026-05-22', 'Completed', 'Cash payment', 'Hypermarket', 'Markets', 'Compras para o mês');
