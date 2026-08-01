-- 1. ACTIVATE ROW LEVEL SECURITY (RLS) ON ALL KNOWN TABLES
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dim_contas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

-- 2. DROP EXISTING ORPHAN POLICIES TO PREVENT CONFLICTS
DO $$ 
DECLARE
    t_name text;
    p_name text;
BEGIN
    FOR t_name, p_name IN 
        SELECT tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename IN ('transactions', 'profiles', 'dim_contas', 'budgets')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', p_name, t_name);
    END LOOP;
END $$;

-- 3. APPLY STANDARD CRUD MATRIX FOR USER-LEVEL TABLES (auth.uid() = profile_id)
-- For `transactions`
CREATE POLICY "User select policy" ON public.transactions FOR SELECT TO authenticated USING (auth.uid() = profile_id);
CREATE POLICY "User insert policy" ON public.transactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "User update policy" ON public.transactions FOR UPDATE TO authenticated USING (auth.uid() = profile_id) WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "User delete policy" ON public.transactions FOR DELETE TO authenticated USING (auth.uid() = profile_id);

-- For `profiles` (uses id instead of profile_id)
CREATE POLICY "User select policy" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "User insert policy" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "User update policy" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "User delete policy" ON public.profiles FOR DELETE TO authenticated USING (auth.uid() = id);

-- For `budgets`
CREATE POLICY "User select policy" ON public.budgets FOR SELECT TO authenticated USING (auth.uid() = profile_id);
CREATE POLICY "User insert policy" ON public.budgets FOR INSERT TO authenticated WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "User update policy" ON public.budgets FOR UPDATE TO authenticated USING (auth.uid() = profile_id) WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "User delete policy" ON public.budgets FOR DELETE TO authenticated USING (auth.uid() = profile_id);


-- 4. APPLY GLOBAL SHARED POLICY FOR LOOKUP TABLES
-- For `dim_contas`
CREATE POLICY "Allow read access to all authenticated users" ON public.dim_contas FOR SELECT TO authenticated USING (true);


-- 5. UPDATE VIEWS WITH SECURITY_INVOKER = TRUE
ALTER VIEW public.vw_monthly_analytics SET (security_invoker = true);
ALTER VIEW public.vw_category_balances SET (security_invoker = true);
ALTER VIEW public.vw_entity_exposure SET (security_invoker = true);
ALTER VIEW public.vw_account_balances SET (security_invoker = true);
ALTER VIEW public.vw_cash_flow_forecast_90d SET (security_invoker = true);


-- 6. GRANTS TO AUTHENTICATED ROLE
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
