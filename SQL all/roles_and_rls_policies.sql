-- -----------------------------------------------------------------------------
-- ELDORIA TREASURY - USER ROLES & ROW LEVEL SECURITY (RLS) MIGRATION
-- -----------------------------------------------------------------------------
-- This script implements role-based access control (RBAC) and Row Level Security
-- on the public.profiles and public.transactions tables.
-- -----------------------------------------------------------------------------

-- =============================================================================
-- STEP 1: Schema Update (Profiles Role Column)
-- =============================================================================
-- Add 'role' column defaulting to 'lord', with a check constraint limiting 
-- roles to either 'lord' or 'admin'.
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'lord'
CONSTRAINT chk_profile_role CHECK (role IN ('lord', 'admin'));

COMMENT ON COLUMN public.profiles.role IS 'The access control role governing the user scope (lord or admin).';


-- =============================================================================
-- STEP 2: Role Assignment (Specific UUID Mapping)
-- =============================================================================
-- Update the Admin profile (divagarpelamente@gmail.com)
UPDATE public.profiles
SET role = 'admin'
WHERE id = 'd8bd5b93-4bd8-4077-863e-8a28f9ab3b6e';

-- Update the Lord profile (silva.pedro.romao@gmail.com)
UPDATE public.profiles
SET role = 'lord'
WHERE id = 'df4059ee-6fba-4e3f-9c3f-874ef2a2b071';


-- =============================================================================
-- STEP 3: Enable Row Level Security (RLS)
-- =============================================================================
-- Enable RLS on both tables so database transactions are subject to evaluation.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;


-- =============================================================================
-- STEP 4: Define Access Policies for 'profiles'
-- =============================================================================
-- Ensure clean setup by dropping pre-existing policies on profiles.
DROP POLICY IF EXISTS "Lords can view and edit own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Policy A: Lords can SELECT and UPDATE ONLY their own profile rows.
-- USING checks read rows, WITH CHECK validates inserts/updates.
CREATE POLICY "Lords can view and edit own profile" ON public.profiles
    FOR ALL
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Policy B: Admins can SELECT all profile rows for management.
CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );


-- =============================================================================
-- STEP 5: Define Access Policies for 'transactions'
-- =============================================================================
-- Ensure clean setup by dropping pre-existing policies on transactions.
DROP POLICY IF EXISTS "Lords can perform CRUD on own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Admins can perform CRUD on all transactions" ON public.transactions;

-- Policy A: Lords can perform all CRUD operations (ALL) on their own transactions.
CREATE POLICY "Lords can perform CRUD on own transactions" ON public.transactions
    FOR ALL
    TO authenticated
    USING (auth.uid() = profile_id)
    WITH CHECK (auth.uid() = profile_id);

-- Policy B: Admins have unrestricted access (ALL) to read/write all transactions.
-- RLS evaluates this subquery to confirm admin privileges.
CREATE POLICY "Admins can perform CRUD on all transactions" ON public.transactions
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );
