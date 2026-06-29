-- SQL Migration: Enable Row Level Security (RLS) on transactions and account_balances
-- and define security policies to be compliant with Supabase guidelines.

BEGIN;

-- 1. Enable RLS on the tables
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_balances ENABLE ROW LEVEL SECURITY;

-- 2. Define policies for public.transactions
DROP POLICY IF EXISTS "Lords can perform CRUD on own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Admins can perform CRUD on all transactions" ON public.transactions;

CREATE POLICY "Lords can perform CRUD on own transactions" ON public.transactions
    FOR ALL
    TO authenticated
    USING (auth.uid() = profile_id)
    WITH CHECK (auth.uid() = profile_id);

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

-- 3. Define policies for public.account_balances
DROP POLICY IF EXISTS "Lords can perform CRUD on own account balances" ON public.account_balances;
DROP POLICY IF EXISTS "Admins can perform CRUD on all account balances" ON public.account_balances;

CREATE POLICY "Lords can perform CRUD on own account balances" ON public.account_balances
    FOR ALL
    TO authenticated
    USING (auth.uid() = profile_id)
    WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Admins can perform CRUD on all account balances" ON public.account_balances
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

COMMIT;
