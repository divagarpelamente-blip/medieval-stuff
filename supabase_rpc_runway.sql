CREATE OR REPLACE FUNCTION public.calculate_kingdom_runway(
  p_profile_id UUID,
  p_years INT[],
  p_quarters TEXT[],
  p_months TEXT[]
)
RETURNS TABLE (
  liquid_cash NUMERIC,
  monthly_burn_rate NUMERIC,
  runway_months NUMERIC
) AS $$
DECLARE
  start_cash NUMERIC := 0.00;
  tx_cash_in NUMERIC := 0.00;
  tx_cash_out NUMERIC := 0.00;
  tx_asset_src NUMERIC := 0.00;
  tx_asset_tgt NUMERIC := 0.00;
  computed_liquid NUMERIC := 0.00;
  
  exp_total NUMERIC := 0.00;
  num_months INT := 1;
  burn_rate NUMERIC := 0.00;
  runway NUMERIC := 0.00;
BEGIN
  -- 1. Calculate Total Liquid Cash from account balances + completed ledger activity
  SELECT COALESCE(SUM(balance), 0)
  INTO start_cash
  FROM public.account_balances
  WHERE profile_id = p_profile_id
    AND (account_code LIKE '10101%' OR account_code LIKE '10102%');

  -- Income
  SELECT COALESCE(SUM(amount), 0)
  INTO tx_cash_in
  FROM public.transactions
  WHERE profile_id = p_profile_id
    AND payment_status IN ('Completed', 'Paid', 'Paid on Time', 'Paid Late')
    AND transaction_type = 'Income'
    AND (source_dest_bank LIKE '10101%' OR source_dest_bank LIKE '10102%');

  -- Expense
  SELECT COALESCE(SUM(amount), 0)
  INTO tx_cash_out
  FROM public.transactions
  WHERE profile_id = p_profile_id
    AND payment_status IN ('Completed', 'Paid', 'Paid on Time', 'Paid Late')
    AND transaction_type = 'Expense'
    AND (source_dest_bank LIKE '10101%' OR source_dest_bank LIKE '10102%');

  -- Assets & Liabilities Src changes
  SELECT COALESCE(SUM(CASE WHEN flow = 'inflow' THEN amount ELSE -amount END), 0)
  INTO tx_asset_src
  FROM public.transactions
  WHERE profile_id = p_profile_id
    AND payment_status IN ('Completed', 'Paid', 'Paid on Time', 'Paid Late')
    AND transaction_type IN ('Assets', 'Liabilities')
    AND (source_dest_bank LIKE '10101%' OR source_dest_bank LIKE '10102%');

  -- Assets & Liabilities Tgt changes
  SELECT COALESCE(SUM(CASE WHEN flow = 'inflow' THEN -amount ELSE amount END), 0)
  INTO tx_asset_tgt
  FROM public.transactions
  WHERE profile_id = p_profile_id
    AND payment_status IN ('Completed', 'Paid', 'Paid on Time', 'Paid Late')
    AND transaction_type IN ('Assets', 'Liabilities')
    AND (target_account LIKE '10101%' OR target_account LIKE '10102%');

  computed_liquid := start_cash + tx_cash_in - tx_cash_out + tx_asset_src + tx_asset_tgt;

  -- 2. Calculate average monthly burn rate (expenses regardless of status)
  SELECT COALESCE(SUM(amount), 0)
  INTO exp_total
  FROM public.transactions
  WHERE profile_id = p_profile_id
    AND transaction_type = 'Expense'
    AND (flow IS NULL OR flow <> 'neutral')
    AND (cardinality(p_years) = 0 OR year = ANY(p_years))
    AND (cardinality(p_quarters) = 0 OR quarter = ANY(p_quarters))
    AND (cardinality(p_months) = 0 OR month = ANY(p_months));

  IF cardinality(p_months) > 0 THEN
    num_months := cardinality(p_months);
  ELSIF cardinality(p_quarters) > 0 THEN
    num_months := cardinality(p_quarters) * 3;
  ELSIF cardinality(p_years) > 0 THEN
    num_months := cardinality(p_years) * 12;
  ELSE
    num_months := 1;
  END IF;

  burn_rate := ROUND(exp_total / num_months, 2);

  -- 3. Calculate Runway months
  IF burn_rate = 0 THEN
    IF computed_liquid > 0 THEN
      runway := 99.0; -- Representing infinite runway / >99 months
    ELSE
      runway := 0.0;
    END IF;
  ELSE
    runway := ROUND(computed_liquid / burn_rate, 1);
  END IF;

  liquid_cash := computed_liquid;
  monthly_burn_rate := burn_rate;
  runway_months := runway;

  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
