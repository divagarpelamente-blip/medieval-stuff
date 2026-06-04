-- Setup Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    gold BIGINT DEFAULT 1000,
    level INTEGER DEFAULT 1,
    xp INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Setup Buildings Table
CREATE TABLE IF NOT EXISTS public.buildings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'treasury', etc.
    level INTEGER DEFAULT 1,
    stored_resources DOUBLE PRECISION DEFAULT 0,
    last_collection TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buildings ENABLE ROW LEVEL SECURITY;

-- Policies for Profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id OR id = '00000000-0000-0000-0000-000000000000');

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE 
    USING (auth.uid() = id OR id = '00000000-0000-0000-0000-000000000000')
    WITH CHECK (auth.uid() = id OR id = '00000000-0000-0000-0000-000000000000');

-- Policies for Buildings
DROP POLICY IF EXISTS "Users can view own buildings" ON public.buildings;
DROP POLICY IF EXISTS "Users can manage own buildings" ON public.buildings;
CREATE POLICY "Users can view own buildings" ON public.buildings
    FOR SELECT USING (auth.uid() = profile_id OR profile_id = '00000000-0000-0000-0000-000000000000');

CREATE POLICY "Users can manage own buildings" ON public.buildings
    FOR ALL 
    USING (auth.uid() = profile_id OR profile_id = '00000000-0000-0000-0000-000000000000')
    WITH CHECK (auth.uid() = profile_id OR profile_id = '00000000-0000-0000-0000-000000000000');

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  
  -- Initial Treasury for new users
  INSERT INTO public.buildings (profile_id, type)
  VALUES (new.id, 'treasury');
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
