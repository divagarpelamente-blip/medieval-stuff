# Workflow: Database Timeout Diagnostic & Fix (Eldoria V3.0)

Este workflow descreve o processo de análise e resolução rápida de lentidão ou timeouts (erros 500 / 400 / 57014) no Supabase, focando na arquitetura de agregações do lado do servidor do Eldoria.

## Passo 1: Inspeção de Logs e RPCs
- Aceda aos logs do Supabase e procure por códigos Postgres como *57014* (statement timeout).
- Identifique se o timeout ocorre nas queries às tabelas brutas (`transactions`, `dim_contas`) ou na execução de funções RPC pesadas (ex: `get_dashboard_metrics`, `get_interactive_dashboard`).

## Passo 2: Otimização de Queries e Estado (Zustand/TanStack)
- Verifique se a aplicação está a tentar agregar dados localmente no lado do cliente. Corrija isso forçando o consumo das Views pré-agregadas (`vw_monthly_analytics`, `vw_cumulative_trends`, `vw_category_balances`, `vw_entity_exposure`, `vw_daily_analytics`).
- Confirme se as queries ao Ledger bruto (`transactions`) estão a respeitar a paginação estrita (`limit`, `offset`) definida no `useKingdomStore`.
- Assegure que as chamadas repetitivas estão a tirar partido do cache do TanStack Query (com `staleTime` adequado), especially nos painéis interativos (`useInteractiveData`).

## Passo 3: Criação e Manutenção de Índices na BD
- Se o gargalo for de leitura, verifique a ausência de índices nas colunas mais consultadas e nos cruzamentos de Foreign Keys.
- Gere e execute comandos SQL para criar índices cruciais para o Eldoria, tais como:
  ```sql
  -- Índices para junções e filtros de RLS frequentes
  CREATE INDEX IF NOT EXISTS idx_transactions_profile_id ON transactions(profile_id);
  CREATE INDEX IF NOT EXISTS idx_transactions_target_account ON transactions(target_account);
  CREATE INDEX IF NOT EXISTS idx_transactions_posting_date ON transactions(posting_date DESC);
  CREATE INDEX IF NOT EXISTS idx_dim_contas_type ON dim_contas(type);
  ```
