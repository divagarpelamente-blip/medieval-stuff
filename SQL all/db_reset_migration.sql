-- 1. Drop existing views and tables to start fresh
DROP VIEW IF EXISTS public.monster_card_stats;
DROP TABLE IF EXISTS public.treasury_records;
DROP TABLE IF EXISTS public.treasury_entities;
DROP TABLE IF EXISTS public.treasury_accounts;
DROP TABLE IF EXISTS public.buildings;
DROP TABLE IF EXISTS public.profiles;

-- 2. Create base profiles table (bare-minimum)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY,
    email TEXT,
    gold BIGINT DEFAULT 1000,
    level INTEGER DEFAULT 1,
    xp INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create base buildings table (bare-minimum)
CREATE TABLE public.buildings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    level INTEGER DEFAULT 1,
    stored_resources DOUBLE PRECISION DEFAULT 0,
    last_collection TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buildings ENABLE ROW LEVEL SECURITY;

-- 5. Row Level Security policies
DROP POLICY IF EXISTS "Users can manage own profile" ON public.profiles;
CREATE POLICY "Users can manage own profile" ON public.profiles
    FOR ALL 
    USING (auth.uid() = id OR id = '00000000-0000-0000-0000-000000000000')
    WITH CHECK (auth.uid() = id OR id = '00000000-0000-0000-0000-000000000000');

DROP POLICY IF EXISTS "Users can manage own buildings" ON public.buildings;
CREATE POLICY "Users can manage own buildings" ON public.buildings
    FOR ALL 
    USING (auth.uid() = profile_id OR profile_id = '00000000-0000-0000-0000-000000000000')
    WITH CHECK (auth.uid() = profile_id OR profile_id = '00000000-0000-0000-0000-000000000000');
