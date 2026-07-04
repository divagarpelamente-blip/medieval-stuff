CREATE OR REPLACE FUNCTION public.calculate_dti_ratio(
  p_profile_id UUID,
  p_years INT[],
  p_quarters TEXT[],
  p_months TEXT[]
)
RETURNS TABLE (
  total_amortization NUMERIC,
  total_income NUMERIC,
  dti_percentage NUMERIC
) AS $$
DECLARE
  amort_total NUMERIC := 0.00;
  inc_total NUMERIC := 0.00;
  dti NUMERIC := 0.00;
BEGIN
  -- 1. Calculate Total Income (excluding neutral flows) for the selected period
  SELECT COALESCE(SUM(amount), 0)
  INTO inc_total
  FROM public.transactions
  WHERE profile_id = p_profile_id
    AND transaction_type = 'Income'
    AND (flow IS NULL OR flow <> 'neutral')
    AND (cardinality(p_years) = 0 OR year = ANY(p_years))
    AND (cardinality(p_quarters) = 0 OR quarter = ANY(p_quarters))
    AND (cardinality(p_months) = 0 OR month = ANY(p_months));

  -- 2. Calculate Total Amortization (liability outflows) for the selected period
  SELECT COALESCE(SUM(amount), 0)
  INTO amort_total
  FROM public.transactions
  WHERE profile_id = p_profile_id
    AND (flow = 'outflow')
    AND (transaction_type = 'Liabilities' OR source_dest_bank LIKE '2%' OR target_account LIKE '2%')
    AND (cardinality(p_years) = 0 OR year = ANY(p_years))
    AND (cardinality(p_quarters) = 0 OR quarter = ANY(p_quarters))
    AND (cardinality(p_months) = 0 OR month = ANY(p_months));

  -- 3. Calculate DTI percentage
  IF inc_total = 0 THEN
    IF amort_total > 0 THEN
      dti := 100.00;
    ELSE
      dti := 0.00;
    END IF;
  ELSE
    dti := ROUND((amort_total / inc_total) * 100.00, 2);
  END IF;

  total_amortization := amort_total;
  total_income := inc_total;
  dti_percentage := dti;

  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
