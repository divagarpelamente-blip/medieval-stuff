CREATE OR REPLACE FUNCTION public.get_financial_health_report(p_profile_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_liquid_cash numeric := 0;
    v_monthly_income numeric := 0;
    v_monthly_expenses numeric := 0;
    v_savings_rate numeric := 0;
    v_dti_ratio numeric := 0;
    v_runway_months numeric := 0;
    
    v_flag_runway jsonb;
    v_flag_dti jsonb;
    v_flag_savings jsonb;
    
    v_forecast jsonb;
    v_variances jsonb;
    
    v_result jsonb;
BEGIN
    -- Security Check
    IF auth.uid() != p_profile_id THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    -- 1. KPI Summary
    -- Liquid Cash
    SELECT COALESCE(SUM(total_balance), 0) INTO v_liquid_cash
    FROM vw_account_balances
    WHERE profile_id = p_profile_id AND (target_account LIKE '1101%' OR target_account LIKE '1102%' OR target_account LIKE '1103%');

    -- Monthly Analytics
    SELECT 
        COALESCE(total_income, 0), 
        COALESCE(total_expenses, 0),
        COALESCE(total_debt_payments, 0)
    INTO v_monthly_income, v_monthly_expenses, v_dti_ratio
    FROM vw_monthly_analytics
    WHERE profile_id = p_profile_id
    ORDER BY month_date DESC LIMIT 1;
    
    -- We'll reuse the v_dti_ratio variable to hold raw debt payments, then calculate percentage
    IF v_monthly_income > 0 THEN
        v_savings_rate := ((v_monthly_income - v_monthly_expenses) / v_monthly_income) * 100;
        v_dti_ratio := (v_dti_ratio / v_monthly_income) * 100;
    ELSE
        v_savings_rate := 0;
        v_dti_ratio := 0;
    END IF;

    IF v_monthly_expenses > 0 THEN
        v_runway_months := v_liquid_cash / v_monthly_expenses;
    ELSE
        v_runway_months := 999;
    END IF;

    -- 2. Deterministic Flags
    -- Runway
    IF v_runway_months < 3.0 THEN
        v_flag_runway := jsonb_build_object('flag', 'FLAG_CRITICAL_RUNWAY', 'status', 'RED', 'message', 'Critical runway detected. Less than 3 months of survival.');
    ELSIF v_runway_months < 6.0 THEN
        v_flag_runway := jsonb_build_object('flag', 'FLAG_CRITICAL_RUNWAY', 'status', 'YELLOW', 'message', 'Caution runway detected. Between 3 and 6 months of survival.');
    ELSE
        v_flag_runway := jsonb_build_object('flag', 'FLAG_CRITICAL_RUNWAY', 'status', 'GREEN', 'message', 'Secure runway detected.');
    END IF;

    -- DTI
    IF v_dti_ratio > 40.0 THEN
        v_flag_dti := jsonb_build_object('flag', 'FLAG_HIGH_DTI', 'status', 'RED', 'message', 'Critical Debt-to-Income ratio > 40%.');
    ELSIF v_dti_ratio > 30.0 THEN
        v_flag_dti := jsonb_build_object('flag', 'FLAG_HIGH_DTI', 'status', 'YELLOW', 'message', 'Caution Debt-to-Income ratio between 30% and 40%.');
    ELSE
        v_flag_dti := jsonb_build_object('flag', 'FLAG_HIGH_DTI', 'status', 'GREEN', 'message', 'Secure Debt-to-Income ratio.');
    END IF;

    -- Savings Rate
    IF v_savings_rate <= 0 THEN
        v_flag_savings := jsonb_build_object('flag', 'FLAG_SAVINGS_RATE', 'status', 'RED', 'message', 'Deficit! Savings rate is 0% or negative.');
    ELSIF v_savings_rate < 10.0 THEN
        v_flag_savings := jsonb_build_object('flag', 'FLAG_SAVINGS_RATE', 'status', 'YELLOW', 'message', 'Caution savings rate below 10%.');
    ELSE
        v_flag_savings := jsonb_build_object('flag', 'FLAG_SAVINGS_RATE', 'status', 'GREEN', 'message', 'Healthy savings rate >= 10%.');
    END IF;

    -- 3. Cash Flow Forecast
    SELECT jsonb_build_object(
        'current_liquid_cash', current_liquid_cash,
        'cash_in_30d', cash_in_30d,
        'cash_in_60d', cash_in_60d,
        'cash_in_90d', cash_in_90d
    ) INTO v_forecast
    FROM vw_cash_flow_forecast_90d
    WHERE profile_id = p_profile_id;
    
    IF v_forecast IS NULL THEN
        v_forecast := '{}'::jsonb;
    END IF;

    -- 4. Budget Variances
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'category', b.coa_category,
            'monthly_limit', b.monthly_limit,
            'actual_spent', COALESCE(c.total_volume, 0),
            'variance_percentage', CASE WHEN b.monthly_limit > 0 THEN (COALESCE(c.total_volume, 0) / b.monthly_limit) * 100 ELSE 0 END,
            'is_over', COALESCE(c.total_volume, 0) > b.monthly_limit
        )
    ), '[]'::jsonb) INTO v_variances
    FROM budgets b
    LEFT JOIN vw_category_balances c ON c.category = b.coa_category AND c.profile_id = b.profile_id AND c.type = 'Expenses'
    WHERE b.profile_id = p_profile_id;

    -- Build Final JSON
    v_result := jsonb_build_object(
        'packet_metadata', jsonb_build_object(
            'generated_at', CURRENT_TIMESTAMP,
            'profile_id', p_profile_id,
            'version', 'Eldoria V3.0'
        ),
        'kpi_summary', jsonb_build_object(
            'liquid_cash', v_liquid_cash,
            'monthly_income', v_monthly_income,
            'monthly_expenses', v_monthly_expenses,
            'savings_rate', v_savings_rate,
            'dti_ratio', v_dti_ratio,
            'survival_runway_months', v_runway_months
        ),
        'deterministic_flags', jsonb_build_array(v_flag_runway, v_flag_dti, v_flag_savings),
        'cash_flow_forecast_90d', v_forecast,
        'budget_variances', v_variances
    );

    RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_financial_health_report(uuid) TO authenticated;
