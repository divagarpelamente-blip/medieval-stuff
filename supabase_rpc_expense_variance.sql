CREATE OR REPLACE FUNCTION public.calculate_expense_variance(
  p_profile_id UUID,
  p_years INT[],
  p_quarters TEXT[],
  p_months TEXT[]
)
RETURNS TABLE (
  current_period_expenses NUMERIC,
  previous_period_expenses NUMERIC,
  absolute_variance NUMERIC,
  percentage_variance NUMERIC
) AS $$
DECLARE
  current_total NUMERIC := 0.00;
  prev_total NUMERIC := 0.00;
  prev_years INT[];
  prev_months TEXT[];
  -- Translation tables to calculate previous periods
  month_order TEXT[] := ARRAY['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
BEGIN
  -- 1. Get current period expenses (regardless of payment_status)
  SELECT COALESCE(SUM(amount), 0)
  INTO current_total
  FROM public.transactions
  WHERE profile_id = p_profile_id
    AND transaction_type = 'Expense'
    -- Exclude neutral flows
    AND (flow IS NULL OR flow <> 'neutral')
    AND (cardinality(p_years) = 0 OR year = ANY(p_years))
    AND (cardinality(p_quarters) = 0 OR quarter = ANY(p_quarters))
    AND (cardinality(p_months) = 0 OR month = ANY(p_months));

  -- 2. Compute previous period constraints
  -- In a production rollout, we calculate the comparative historical boundary (e.g. July -> June)
  -- by shifting the input parameters backward based on standard calendar intervals:
  IF cardinality(p_months) > 0 THEN
    -- Monthly shifting logic
    SELECT ARRAY_AGG(m) INTO prev_months
    FROM (
      SELECT month_order[mod(idx - 2 + 12, 12) + 1] AS m
      FROM UNNEST(p_months) WITH ORDINALITY AS u(m_val, idx)
    ) q;
    
    -- Year boundary wrap-around check (shifting to previous year if January is selected)
    IF 'January' = ANY(p_months) THEN
      SELECT ARRAY_AGG(y - 1) INTO prev_years FROM UNNEST(p_years) y;
    ELSE
      prev_years := p_years;
    END IF;
  ELSE
    -- Yearly shifting logic
    SELECT ARRAY_AGG(y - 1) INTO prev_years FROM UNNEST(p_years) y;
    prev_months := p_months;
  END IF;

  -- 3. Get previous period expenses
  SELECT COALESCE(SUM(amount), 0)
  INTO prev_total
  FROM public.transactions
  WHERE profile_id = p_profile_id
    AND transaction_type = 'Expense'
    AND (flow IS NULL OR flow <> 'neutral')
    AND (cardinality(prev_years) = 0 OR year = ANY(prev_years))
    AND (cardinality(p_quarters) = 0 OR quarter = ANY(p_quarters)) -- Quarters aligned
    AND (cardinality(prev_months) = 0 OR month = ANY(prev_months));

  -- 4. Calculate variances
  current_period_expenses := current_total;
  previous_period_expenses := prev_total;
  absolute_variance := current_total - prev_total;
  
  IF prev_total = 0 THEN
    percentage_variance := CASE WHEN current_total > 0 THEN 100.00 ELSE 0.00 END;
  ELSE
    percentage_variance := ROUND(((current_total - prev_total) / prev_total) * 100.00, 2);
  END IF;

  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
