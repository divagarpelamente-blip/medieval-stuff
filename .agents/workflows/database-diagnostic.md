# 🗄️ Workflow: Diagnóstico de Base de Dados (`database-diagnostic.md`)

Este workflow destina-se a auditar a integridade estrutural, restrições e segurança (RLS) da base de dados do Eldoria V3.0 no Supabase.

---

## 1. Auditoria do Chart of Accounts (COA) de 8 Dígitos
* **Objetivo**: Garantir que todas as contas registadas na tabela `dim_contas` estão em total conformidade com a codificação estrita de 8 dígitos.
* **Ações**:
  1. Execute uma query ou script para verificar se existem códigos com comprimento diferente de 8 caracteres:
     ```sql
     SELECT code, account_name FROM public.dim_contas WHERE length(code) != 8;
     ```
  2. Confirme que a restrição de verificação `chk_code_length` está ativa na tabela `dim_contas`.

---

## 2. Validação das Restrições de Integridade
* **Valores Negativos**: Garanta que a restrição `transactions_amount_check` está ativa na tabela `transactions` para impedir transações com valores negativos (`amount >= 0`).
* **Normalização de Tipos**: Verifique se os tipos de transação estão em conformidade com as restrições da base de dados (`Assets`, `Liabilities`, `Income`, `Expenses`). Execute testes inserindo variações para garantir que a trigger ou restrição impede tipos inválidos.

---

## 3. Verificação de Agregações no Servidor (Views e RPCs)
* **Prevenção de Loops no Cliente**: Audite os ficheiros do frontend para garantir que nenhum componente calcula somas acumuladas ou filtros analíticos usando loops em memória sobre a lista total de transações.
* **Consumo de Views**: Confirme se os widgets gráficos consomem os dados através da subscrição de views otimizadas:
  * `vw_monthly_analytics` (Cash Flow)
  * `vw_cumulative_trends` (Net Worth)
  * `vw_category_balances` (Asset Allocation)
* **Consumo de RPCs**: Garanta que os dados agregados do Dashboard utilizam a chamada à função RPC `get_dashboard_metrics` do Supabase.

---

## 4. Auditoria de Políticas de Segurança RLS (Row-Level Security)
* **Políticas Ativas**: Certifique-se de que a segurança RLS está ativada nas tabelas `transactions` e `profiles`.
* **Fuga de Dados**: Valide se a diretiva `USING (auth.uid() = profile_id)` está a filtrar corretamente todas as operações de `SELECT`, `INSERT`, `UPDATE` e `DELETE` para evitar que um utilizador aceda a transações de terceiros.
