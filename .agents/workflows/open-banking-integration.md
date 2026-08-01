# Workflow: Open Banking Integration (GoCardless / PSD2)

Este workflow estabelece a arquitetura para sincronizar transações bancárias (ex: Caixa Geral de Depósitos) com o Eldoria V3.0, garantindo segurança e conformidade com o nosso Data Flow.

## Fase 1: Gestão de Segredos (Supabase Vault)
- A integração utiliza a API do **GoCardless Bank Account Data** (antiga Nordigen).
- Credenciais (`SECRET_ID` e `SECRET_KEY`) DEVEM ser armazenadas exclusivamente no Supabase Secrets (nunca expostas no cliente React).

## Fase 2: Fluxo de Consentimento (Edge Function 1: `create-bank-requisition`)
- O utilizador clica em "Ligar Conta" na interface (Settings).
- O front-end invoca esta Edge Function. A função autentica-se no GoCardless e gera um link de autorização (EUA - End User Agreement e Requisition).
- A Edge Function devolve o link, e o front-end redireciona o utilizador para o portal seguro da instituição bancária (CGD).

## Fase 3: Sincronização e Normalização (Edge Function 2: `sync-bank-transactions`)
- Após o consentimento, os dados podem ser extraídos periodicamente.
- A função deve fazer pull das transações "booked" (confirmadas) da API do GoCardless.
- **Regra de Ouro (Normalização):** Antes de inserir na tabela `transactions`, os dados do banco têm de ser mapeados para a nossa matriz! 
  * O campo `target_account` deve ser mapeado para o respetivo código de 8 dígitos na `dim_contas` (ex: `11010001` para Conta Ordem CGD).
  * O campo `amount` tem de ser convertido para valor absoluto e a propriedade `flow` categorizada como `'inflow'` ou `'outflow'`.
- A inserção deve usar a *Service Role Key* para garantir que as webhooks (como o `process-gamification`) são despoletadas corretamente para calcular XP e Ouro.

## Fase 4: Automação (Cron Job)
- Utilize a extensão `pg_cron` do Supabase para agendar uma invocação da função `sync-bank-transactions` uma vez por dia (ex: meia-noite).

## Passos de Auditoria do Agente:
- Ao escrever o código para esta integração, o agente NUNCA pode implementar a extração de dados bancários diretamente no front-end.
- O agente deve garantir que a Edge Function de sincronização tem lógica para ignorar transações duplicadas (ex: usando o `transaction_id` do banco mapeado para uma nova coluna `external_id` na nossa tabela).
