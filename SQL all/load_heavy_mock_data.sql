WITH mock_profile AS (
  -- 1. Try to create the Guest profile to align with frontend
  INSERT INTO public.profiles (id)
  VALUES ('00000000-0000-0000-0000-000000000000')
  ON CONFLICT DO NOTHING 
  RETURNING id    
),
constants AS (
  -- 2. Fall back to an existing profile ID if the mock profile insert is blocked
  SELECT COALESCE(
    (SELECT id FROM mock_profile), 
    (SELECT id FROM public.profiles LIMIT 1)
  ) AS profile_id
),
matrix AS (
  -- 3. Define the strict combinations that MUST exist
  SELECT * FROM (
    VALUES 
      ('cash', 'inflow', 'Revenue', 'Sales'),
      ('cash', 'outflow', 'Expense', 'Operational'),
      ('accrual', 'inflow', 'Revenue', 'Receivables'),
      ('accrual', 'outflow', 'Expense', 'Payables')
  ) AS t(nature, flow, t_type, t_subtype)
)
-- 4. Multiplies the 4 combinations by 65 iterations = 260 total records
INSERT INTO public.transactions (    
  profile_id, 
  amount, 
  "from", 
  date, 
  month, 
  year, 
  quarter, 
  payment_status, 
  transaction_type, 
  transaction_subtype, 
  entity, 
  transaction_category, 
  transaction_nature, 
  transaction_flow,
  description
)
SELECT 
  c.profile_id,
  ROUND((random() * 4900 + 100)::numeric, 2) AS amount, -- Random price between $100 and $5000
  (ARRAY['Acme Corp', 'Stark Industries', 'AWS', 'Google Cloud', 'WeWork', 'Client ABC', 'Vendor XYZ'])[floor(random() * 7) + 1] AS "from",
  
  gen_date AS date,
  to_char(gen_date, 'Month') AS month,
  extract(year from gen_date)::integer AS year,
  'Q' || extract(quarter from gen_date)::text AS quarter,
  
  CASE WHEN m.nature = 'accrual' AND random() < 0.5 THEN 'Pending' ELSE 'Completed' END AS payment_status,
  m.t_type AS transaction_type,
  m.t_subtype AS transaction_subtype,
  (ARRAY['Main Office', 'Global Corp', 'Subsidiary East'])[floor(random() * 3) + 1] AS entity,
  (ARRAY['Consulting', 'SaaS Tools', 'Office Rent', 'Marketing Hardware'])[floor(random() * 4) + 1] AS transaction_category,
  
  m.nature AS transaction_nature,
  m.flow AS transaction_flow,
  'Matrix verified mock data row (' || m.nature || ' / ' || m.flow || ')' AS description

FROM constants c
CROSS JOIN matrix m
CROSS JOIN (
  -- Generate 65 sequences per matrix pair, scattering dates randomly over 365 days
  SELECT CURRENT_DATE - (random() * 365)::integer AS gen_date
  FROM generate_series(1, 65)
) as series;
