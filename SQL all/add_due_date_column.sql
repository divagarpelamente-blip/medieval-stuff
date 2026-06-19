-- SQL Migration: Add due_date column to public.transactions
ALTER TABLE public.transactions ADD COLUMN due_date DATE;

COMMENT ON COLUMN public.transactions.due_date IS 'The date by which the transaction payment is due, used for overdue and outstanding metrics.';
