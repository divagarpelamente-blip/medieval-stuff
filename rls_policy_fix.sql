-- Disable Row Level Security on treasury_entities to allow guest/local users to create entities
ALTER TABLE public.treasury_entities DISABLE ROW LEVEL SECURITY;

-- Add description column to treasury_entities if it doesn't already exist
ALTER TABLE public.treasury_entities ADD COLUMN IF NOT EXISTS description TEXT;
