-- ==============================================================
-- ELDORIA: DATABASE OPTIMIZATION & SECURITY INTEGRITY MIGRATION
-- ==============================================================
-- Applies performance-boosting indexes and configures read-only
-- access controls on the Chart of Accounts dimensions catalog.
-- ==============================================================

BEGIN;

-- ==============================================================
-- 1. Performance Indexing
-- ==============================================================

-- Index profile_id to optimize user-scoped query filtering
CREATE INDEX IF NOT EXISTS idx_transactions_profile_id 
    ON public.transactions (profile_id);

-- Index posting_date (descending) to optimize chronology-based spline aggregates
CREATE INDEX IF NOT EXISTS idx_transactions_posting_date_desc 
    ON public.transactions (posting_date DESC);

-- Composite index to speed up completed vs pending flow filters in the P&L Firewall
CREATE INDEX IF NOT EXISTS idx_transactions_type_status 
    ON public.transactions (transaction_type, payment_status);

-- Composite index on buildings to optimize the server-side passive generation collection RPC
CREATE INDEX IF NOT EXISTS idx_buildings_profile_type 
    ON public.buildings (profile_id, building_type);


-- ==============================================================
-- 2. RLS Security Integrity
-- ==============================================================

-- Ensure Row Level Security is active on the dimension accounts catalog
ALTER TABLE public.dim_contas ENABLE ROW LEVEL SECURITY;

-- Clean up any pre-existing view policy
DROP POLICY IF EXISTS "Lords can view accounts catalog" ON public.dim_contas;

-- Create read-only SELECT access policy for authenticated lords
CREATE POLICY "Lords can view accounts catalog" 
    ON public.dim_contas 
    FOR SELECT 
    TO authenticated 
    USING (true);

-- Note: Because RLS is enabled and only a SELECT policy is defined above,
-- PostgreSQL automatically denies all INSERT, UPDATE, and DELETE operations 
-- for authenticated lords (as they do not match any write policy rules).

COMMIT;
