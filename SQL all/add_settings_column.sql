-- =============================================================================
-- ELDORIA: ADD SETTINGS COLUMN TO PROFILES TABLE
-- =============================================================================
-- Adds a JSONB column to the profiles table to persist user-specific configurations
-- (e.g. custom templates, lists, mappings, languages) across builds and environments.
-- Run this script in the Supabase SQL Editor.

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS settings JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.profiles.settings IS 'User-specific configurations including templates, options lists, mappings, and locales.';
