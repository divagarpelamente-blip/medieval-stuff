-- SQL Migration: Add transaction_category column to transactions table
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS transaction_category VARCHAR(255);
