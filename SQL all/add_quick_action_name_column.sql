-- SQL Migration: Add quick_action_name column to transactions table
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS quick_action_name VARCHAR(255);
