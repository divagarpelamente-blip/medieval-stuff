-- 1. Enable Row Level Security (RLS)
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- 2. Create Policy for SELECTing transactions (Users can only view their own transactions)
CREATE POLICY "Users can view their own transactions" 
ON public.transactions
FOR SELECT
TO authenticated
USING (auth.uid() = profile_id);

-- 3. Create Policy for INSERTing transactions (Users can only insert transactions for themselves)
CREATE POLICY "Users can insert their own transactions" 
ON public.transactions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = profile_id);

-- 4. Create Policy for UPDATEing transactions (Users can only update their own transactions)
CREATE POLICY "Users can update their own transactions" 
ON public.transactions
FOR UPDATE
TO authenticated
USING (auth.uid() = profile_id)
WITH CHECK (auth.uid() = profile_id);

-- 5. Create Policy for DELETEing transactions (Users can only delete their own transactions)
CREATE POLICY "Users can delete their own transactions" 
ON public.transactions
FOR DELETE
TO authenticated
USING (auth.uid() = profile_id);
