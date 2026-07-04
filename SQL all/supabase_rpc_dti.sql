CREATE OR REPLACE FUNCTION public.calculate_dti_ratio(
  p_profile_id UUID,
  p_years INT[],
  p_quarters TEXT[],
  p_months TEXT[]
)
RETURNS TABLE (
  total_income NUMERIC,
  total_amortization NUMERIC,
  dti_percentage NUMERIC
) AS $$
DECLARE
  v_income NUMERIC := 0.00;
  v_amortization NUMERIC := 0.00;
BEGIN
  -- 1. Calculate Total Income
  SELECT COALESCE(SUM(amount), 0)
  INTO v_income
  FROM public.transactions
  WHERE profile_id = p_profile_id
    AND transaction_type = 'Income'
    AND (flow IS NULL OR flow <> 'neutral')
    AND (cardinality(p_years) = 0 OR year = ANY(p_years))
    AND (cardinality(p_quarters) = 0 OR quarter = ANY(p_quarters))
    AND (cardinality(p_months) = 0 OR month = ANY(p_months));

  -- 2. Calculate Total Amortization (Outflows to Liability Accounts 2*)
  SELECT COALESCE(SUM(amount), 0)
  INTO v_amortization
  FROM public.transactions
  WHERE profile_id = p_profile_id
    AND flow = 'outflow'
    AND payment_status IN ('Completed', 'Paid', 'Paid on Time', 'Paid Late')
    AND (source_dest_bank LIKE '2%' OR target_account LIKE '2%')
    AND (cardinality(p_years) = 0 OR year = ANY(p_years))
    AND (cardinality(p_quarters) = 0 OR quarter = ANY(p_quarters))
    AND (cardinality(p_months) = 0 OR month = ANY(p_months));

  -- 3. Calculate DTI Percentage safely
  total_income := v_income;
  total_amortization := v_amortization;
  
  IF v_income = 0 THEN
    IF v_amortization > 0 THEN
      dti_percentage := 100.00;
    ELSE
      dti_percentage := 0.00;
    END IF;
  ELSE
    dti_percentage := ROUND((v_amortization / v_income) * 100.00, 2);
  END IF;

  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;