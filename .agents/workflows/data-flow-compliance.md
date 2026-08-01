# Workflow: Data Flow & Aggregation Compliance

Este workflow garante que a arquitetura do Eldoria V3.0 se mantém escalável, proibindo agregações de dados pesadas no lado do cliente (React/Navegador).

## Regras de Ouro do Fluxo de Dados:
1. **Zero Client-Side Heavy Math:** O front-end (React/Zustand) NÃO PODE fazer `.reduce()`, `.map()` ou `.filter()` sobre a tabela bruta de `transactions` para calcular totais globais, rácios ou métricas de dashboard.
2. **Uso Obrigatório de Views:** Todos os gráficos e tabelas de analytics devem consumir dados pré-agregados das Views do PostgreSQL (ex: `vw_monthly_analytics`, `vw_cumulative_trends`, `vw_category_balances`). O cliente apenas formata estes dados para o `recharts` ou para a UI.
3. **Delegação para RPCs:** Operações complexas como gamificação, cálculos de experiência (XP), e busca de KPIs globais do dashboard (`get_dashboard_metrics`) DEVEM ser feitas via Supabase RPCs.
4. **Papel do Zustand:** O `useKingdomStore` e o `useInteractiveStore` servem EXCLUSIVAMENTE para fazer cache e distribuir os dados já calculados pelo servidor, e para gerir a Optimistic UI nas mutações.

## Passos de Auditoria do Agente:
- Se o código proposto iterar sobre arrays massivos, **rejeite a abordagem** e sugira a criação de uma View (`vw_`) ou a utilização de uma existente.
- Verifique se as propriedades que alimentam os widgets provêm do `state.analytics` ou `state.dashboardMetrics` e não do `state.transactions` bruto (exceto para as tabelas de listagem de transações recentes).
