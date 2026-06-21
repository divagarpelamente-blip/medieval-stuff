-- ====================================================================
-- ELDORIA: DADOS PARA INSERÇÃO MANUAL DIRETA NO SUPABASE SQL EDITOR
-- ====================================================================

-- Nota: Substitui 'TEU_PROFILE_ID_AQUI' pelo UUID do teu utilizador 
-- (que encontras na tabela public.profiles ou na autenticação do Supabase).

-- ====================================================================
-- TESTE 1: O Teste do P&L Firewall
-- Ação: Insere uma transferência de ativos (Asset) de 1000 G (CGD -> Poupança)
-- ====================================================================
INSERT INTO public.transactions (
    profile_id,
    amount,
    value_date,
    posting_date,
    payment_status,
    transaction_type,
    transaction_subtype,
    entity,
    transaction_category,
    target_account,      -- 131001 (Savings)
    source_dest_bank,    -- 111001 (CGD)
    flow,
    description
) VALUES (
    'TEU_PROFILE_ID_AQUI', -- <-- SUBSTITUI PELO TEU UUID DE PROFILE
    1000.00,
    CURRENT_DATE,
    CURRENT_DATE,
    'Completed',
    'Assets',
    'Transfers',
    'CGD',
    'Banking',
    '131001',
    '111001',
    'neutral',
    'Teste 1: Transferência de 1000 G do CGD para Poupança'
);


-- ====================================================================
-- TESTE 2: O Teste de Previsão (Pending vs Completed)
-- Ação: Insere uma despesa (Expense) de 500 G com status 'Pending'
-- ====================================================================
INSERT INTO public.transactions (
    profile_id,
    amount,
    value_date,
    posting_date,
    payment_status,
    transaction_type,
    transaction_subtype,
    entity,
    transaction_category,
    target_account,      -- 611001 (Rent)
    source_dest_bank,    -- 111001 (CGD)
    flow,
    description
) VALUES (
    'TEU_PROFILE_ID_AQUI', -- <-- SUBSTITUI PELO TEU UUID DE PROFILE
    500.00,
    CURRENT_DATE,
    CURRENT_DATE,
    'Pending',
    'Expense',
    'Rent',
    'Rent',
    'Housing',
    '611001',
    '111001',
    'outflow',
    'Teste 2: Renda Pendente de 500 G'
);


-- ====================================================================
-- TESTE 2 (CONFIRMAÇÃO): Alterar a Renda de 'Pending' para 'Completed'
-- Ação: Executa este update após validar que o status 'Pending' não alterou o saldo real
-- ====================================================================
-- UPDATE public.transactions 
-- SET payment_status = 'Completed' 
-- WHERE description = 'Teste 2: Renda Pendente de 500 G'
--   AND payment_status = 'Pending'
--   AND profile_id = 'TEU_PROFILE_ID_AQUI'; -- <-- SUBSTITUI PELO TEU UUID DE PROFILE
