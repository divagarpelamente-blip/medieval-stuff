-- 1. Create transactions table
DROP TABLE IF EXISTS public.transactions CASCADE;
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    "from" TEXT,
    date DATE DEFAULT CURRENT_DATE,
    month TEXT,
    year INTEGER,
    quarter TEXT,
    status TEXT DEFAULT 'Completed',
    class TEXT NOT NULL,
    sub_class TEXT,
    entity TEXT,
    category TEXT,
    sub_category TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable Row Level Security
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
DROP POLICY IF EXISTS "Users can manage own transactions" ON public.transactions;
CREATE POLICY "Users can manage own transactions" 
    ON public.transactions
    FOR ALL
    USING (auth.uid() = profile_id OR profile_id = '00000000-0000-0000-0000-000000000000')
    WITH CHECK (auth.uid() = profile_id OR profile_id = '00000000-0000-0000-0000-000000000000');

-- 3.5 Create BEFORE INSERT trigger to auto-calculate date parts
CREATE OR REPLACE FUNCTION public.pre_process_transaction()
RETURNS TRIGGER AS $$
BEGIN
    -- Set default date if null
    IF NEW.date IS NULL THEN
        NEW.date := CURRENT_DATE;
    END IF;
    
    -- Extract calendar attributes
    NEW.year := EXTRACT(YEAR FROM NEW.date);
    NEW.month := TRIM(to_char(NEW.date, 'Month'));
    NEW.quarter := 'Q' || EXTRACT(QUARTER FROM NEW.date);
    
    -- Default status if null
    IF NEW.status IS NULL OR NEW.status = '' THEN
        NEW.status := 'Completed';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_pre_transaction_inserted ON public.transactions;
CREATE TRIGGER tr_pre_transaction_inserted
BEFORE INSERT ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.pre_process_transaction();

-- 4. Create trigger function to update profile stats
CREATE OR REPLACE FUNCTION public.update_profile_on_transaction()
RETURNS TRIGGER AS $$
DECLARE
    earned_xp INTEGER;
    current_xp INTEGER;
    current_level INTEGER;
    max_xp NUMERIC;
BEGIN
    -- 4.1 Update gold balance
    IF NEW.class = 'Income' THEN
        UPDATE public.profiles
        SET gold = gold + CAST(NEW.amount AS BIGINT)
        WHERE id = NEW.profile_id;
        
        -- Earned XP = amount * 2 for income
        earned_xp := CAST(NEW.amount AS INTEGER) * 2;
    ELSE
        UPDATE public.profiles
        SET gold = GREATEST(0, gold - CAST(NEW.amount AS BIGINT))
        WHERE id = NEW.profile_id;
        
        earned_xp := 0;
    END IF;

    -- 4.2 Update XP and Level
    IF earned_xp > 0 THEN
        -- Get current XP and level
        SELECT xp, level INTO current_xp, current_level 
        FROM public.profiles 
        WHERE id = NEW.profile_id;
        
        current_xp := current_xp + earned_xp;
        
        LOOP
            max_xp := 100 * POWER(1.5, current_level - 1);
            IF current_xp >= max_xp THEN
                current_xp := current_xp - CAST(max_xp AS INTEGER);
                current_level := current_level + 1;
            ELSE
                EXIT;
            END IF;
        END LOOP;
        
        UPDATE public.profiles
        SET xp = current_xp, level = current_level
        WHERE id = NEW.profile_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Attach trigger
DROP TRIGGER IF EXISTS tr_on_transaction_inserted ON public.transactions;
CREATE TRIGGER tr_on_transaction_inserted
AFTER INSERT ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_profile_on_transaction();
