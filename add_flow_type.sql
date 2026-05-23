-- Migration: Add flow_type column to treasury_records
ALTER TABLE treasury_records ADD COLUMN IF NOT EXISTS flow_type TEXT;
