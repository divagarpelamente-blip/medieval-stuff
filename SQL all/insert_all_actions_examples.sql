-- SQL Script: Dynamically insert one example transaction for EACH Quick Action
-- defined in the user's custom templates (profiles.settings->'templates').
-- This script parses the JSON configurations of all quick actions dynamically.

INSERT INTO public.transactions (
    profile_id,
    transaction_type,
    amount,
    value_date,
    posting_date,
    due_date,
    payment_status,
    transaction_subtype,
    transaction_category,
    entity,
    origin,
    target_account,
    source_dest_bank,
    flow,
    description,
    quick_action_name
)
SELECT 
    p.id AS profile_id,
    (tpl->'data'->>'transaction_type')::VARCHAR AS transaction_type,
    CASE 
        WHEN NULLIF(tpl->'data'->>'amount', '') IS NULL OR (tpl->'data'->>'amount')::NUMERIC = 0 
        THEN 10.00 * series.n
        ELSE (tpl->'data'->>'amount')::NUMERIC * series.n
    END AS amount,
    (COALESCE(NULLIF(tpl->'data'->>'value_date', ''), CURRENT_DATE::TEXT)::DATE - (series.n - 1) * INTERVAL '15 days')::DATE AS value_date,
    (COALESCE(NULLIF(tpl->'data'->>'posting_date', ''), CURRENT_DATE::TEXT)::DATE - (series.n - 1) * INTERVAL '15 days')::DATE AS posting_date,
    (NULLIF(tpl->'data'->>'due_date', '')::DATE - (series.n - 1) * INTERVAL '15 days')::DATE AS due_date,
    COALESCE(NULLIF(tpl->'data'->>'payment_status', ''), 'Completed')::VARCHAR AS payment_status,
    (tpl->'data'->>'transaction_subtype')::VARCHAR AS transaction_subtype,
    (tpl->'data'->>'transaction_category')::VARCHAR AS transaction_category,
    (tpl->'data'->>'entity')::VARCHAR AS entity,
    (tpl->'data'->>'from')::VARCHAR AS origin,
    (tpl->'data'->>'target_account')::VARCHAR AS target_account,
    (tpl->'data'->>'source_dest_bank')::VARCHAR AS source_dest_bank,
    (tpl->'data'->>'flow')::VARCHAR AS flow,
    (COALESCE(NULLIF(tpl->'data'->>'description', ''), tpl->>'name')::VARCHAR || ' (Ex ' || series.n || ')') AS description,
    (tpl->>'name')::VARCHAR AS quick_action_name
FROM 
    public.profiles p,
    jsonb_array_elements(p.settings->'templates') AS tpl
CROSS JOIN
    generate_series(1, 2) AS series(n)
WHERE 
    p.settings->'templates' IS NOT NULL;
