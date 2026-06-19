-- SQL Migration: Rename reserved keyword column "from" to "origin"
ALTER TABLE public.transactions RENAME COLUMN "from" TO origin;
