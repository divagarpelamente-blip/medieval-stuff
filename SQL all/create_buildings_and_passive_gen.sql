-- SQL Migration: create_buildings_and_passive_gen.sql
-- Creates buildings table and secure server-side passive gold collection function

-- Ensure profiles table has gems column
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gems INTEGER DEFAULT 100;

-- Ensure buildings table exists
CREATE TABLE IF NOT EXISTS public.buildings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  building_type TEXT NOT NULL DEFAULT 'gold_mine',
  level INTEGER NOT NULL DEFAULT 1,
  last_collection TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Rename "type" column to "building_type" if it exists (from old schemas)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'buildings' AND column_name = 'type'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'buildings' AND column_name = 'building_type'
  ) THEN
    ALTER TABLE public.buildings RENAME COLUMN type TO building_type;
  END IF;
END $$;

-- Ensure all required columns exist in public.buildings
ALTER TABLE public.buildings ADD COLUMN IF NOT EXISTS building_type TEXT NOT NULL DEFAULT 'gold_mine';
ALTER TABLE public.buildings ADD COLUMN IF NOT EXISTS level INTEGER NOT NULL DEFAULT 1;
ALTER TABLE public.buildings ADD COLUMN IF NOT EXISTS last_collection TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.buildings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Ensure unique profile_building constraint exists
ALTER TABLE public.buildings DROP CONSTRAINT IF EXISTS unique_profile_building;
ALTER TABLE public.buildings ADD CONSTRAINT unique_profile_building UNIQUE (profile_id, building_type);

-- Enable RLS
ALTER TABLE public.buildings ENABLE ROW LEVEL SECURITY;

-- Create Policies
DROP POLICY IF EXISTS "Lords can view own buildings" ON public.buildings;
CREATE POLICY "Lords can view own buildings" 
ON public.buildings FOR SELECT 
TO authenticated 
USING (auth.uid() = profile_id);

DROP POLICY IF EXISTS "Lords can update own buildings" ON public.buildings;
CREATE POLICY "Lords can update own buildings" 
ON public.buildings FOR UPDATE 
TO authenticated 
USING (auth.uid() = profile_id)
WITH CHECK (auth.uid() = profile_id);

-- Create RPC function for secure collection
CREATE OR REPLACE FUNCTION public.collect_passive_gold(p_profile_id UUID)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_mine_level INT;
  v_last_collection TIMESTAMPTZ;
  v_elapsed_seconds FLOAT;
  v_gold_earned BIGINT;
  v_seconds_used INT;
  v_rate FLOAT;
BEGIN
  -- Get current mine stats
  SELECT level, last_collection
  INTO v_mine_level, v_last_collection
  FROM public.buildings
  WHERE profile_id = p_profile_id AND building_type = 'gold_mine';

  -- If no building entry exists, initialize one
  IF NOT FOUND THEN
    INSERT INTO public.buildings (profile_id, building_type, level, last_collection)
    VALUES (p_profile_id, 'gold_mine', 1, NOW() - INTERVAL '10 seconds')
    RETURNING level, last_collection INTO v_mine_level, v_last_collection;
  END IF;

  -- Calculate elapsed seconds
  v_elapsed_seconds := EXTRACT(EPOCH FROM (NOW() - v_last_collection));
  v_rate := v_mine_level * 0.1;
  v_gold_earned := FLOOR(v_elapsed_seconds * v_rate);

  IF v_gold_earned > 0 THEN
    -- Calculate precise seconds consumed to earn that integer gold
    v_seconds_used := FLOOR(v_gold_earned / v_rate);
    
    -- Update the last_collection time by adding only the consumed seconds
    UPDATE public.buildings
    SET last_collection = v_last_collection + (v_seconds_used * INTERVAL '1 second'),
        updated_at = NOW()
    WHERE profile_id = p_profile_id AND building_type = 'gold_mine';

    -- Update profiles gold and award 2 XP per collected gold
    UPDATE public.profiles
    SET gold = gold + v_gold_earned,
        xp = xp + (v_gold_earned * 2)
    WHERE id = p_profile_id;
  END IF;

  RETURN v_gold_earned;
END;
$$;
