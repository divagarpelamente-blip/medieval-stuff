CREATE OR REPLACE FUNCTION public.calculate_savings_rate(
  p_profile_id UUID,
  p_years INT[],
  p_quarters TEXT[],
  p_months TEXT[]
)
RETURNS TABLE (
  total_income NUMERIC,
  total_expenses NUMERIC,
  savings_rate_percentage NUMERIC
) AS $$
DECLARE
  inc_total NUMERIC := 0.00;
  exp_total NUMERIC := 0.00;
  rate NUMERIC := 0.00;
BEGIN
  -- 1. Sum all Income (ignoring neutral flows) for the selected period
  SELECT COALESCE(SUM(amount), 0)
  INTO inc_total
  FROM public.transactions
  WHERE profile_id = p_profile_id
    AND transaction_type = 'Income'
    AND (flow IS NULL OR flow <> 'neutral')
    AND (cardinality(p_years) = 0 OR year = ANY(p_years))
    AND (cardinality(p_quarters) = 0 OR quarter = ANY(p_quarters))
    AND (cardinality(p_months) = 0 OR month = ANY(p_months));

  -- 2. Sum all Expense (ignoring neutral flows) for the selected period
  SELECT COALESCE(SUM(amount), 0)
  INTO exp_total
  FROM public.transactions
  WHERE profile_id = p_profile_id
    AND transaction_type = 'Expense'
    AND (flow IS NULL OR flow <> 'neutral')
    AND (cardinality(p_years) = 0 OR year = ANY(p_years))
    AND (cardinality(p_quarters) = 0 OR quarter = ANY(p_quarters))
    AND (cardinality(p_months) = 0 OR month = ANY(p_months));

  -- 3. Calculate savings rate percentage
  IF inc_total = 0 THEN
    IF exp_total > 0 THEN
      rate := -100.00;
    ELSE
      rate := 0.00;
    END IF;
  ELSE
    rate := ROUND(((inc_total - exp_total) / inc_total) * 100.00, 2);
  END IF;

  total_income := inc_total;
  total_expenses := exp_total;
  savings_rate_percentage := rate;

  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
