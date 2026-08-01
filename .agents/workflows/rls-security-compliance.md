# Workflow: Global RLS & View Security Compliance (`rls-security-compliance.md`)

Este workflow estabelece a auditoria estrita e a padronização de Row-Level Security (RLS) e permissões de acesso em todas as tabelas e views do esquema `public` no Supabase.

## Diretivas Principais:

### 1. Classificação de Tabelas e Ativação de RLS
Toda a tabela do esquema `public` MUST ter RLS ativado (`ALTER TABLE public.<tabela> ENABLE ROW LEVEL SECURITY;`).
Existem duas categorias principais de tabelas:

**A. Tabelas de Nível de Utilizador (User-Level Tables):**
- Tabelas que armazenam dados do utilizador e contêm a coluna `profile_id` (ou `id` no caso dos profiles).
- Ex: `public.transactions`, `public.profiles`, `public.budgets`.
- MUST aplicar políticas CRUD explícitas para a role `authenticated` baseadas em `auth.uid() = profile_id`.

**B. Tabelas Globais Partilhadas (Global Shared Tables):**
- Tabelas de lookup ou dimensão que são partilhadas (sem `profile_id`).
- Ex: `public.dim_contas`.
- MUST aplicar apenas uma política de SELECT genérica: `CREATE POLICY "Allow read access to all authenticated users" ON public.<tabela> FOR SELECT TO authenticated USING (true);`.

### 2. Matriz CRUD Padrão (User-Level Tables)
- Para tabelas de utilizador, devem existir as seguintes políticas:
  * **SELECT**: `CREATE POLICY "User select policy" ON public.<tabela> FOR SELECT TO authenticated USING (auth.uid() = profile_id);`
  * **INSERT**: `CREATE POLICY "User insert policy" ON public.<tabela> FOR INSERT TO authenticated WITH CHECK (auth.uid() = profile_id);`
  * **UPDATE**: `CREATE POLICY "User update policy" ON public.<tabela> FOR UPDATE TO authenticated USING (auth.uid() = profile_id) WITH CHECK (auth.uid() = profile_id);`
  * **DELETE**: `CREATE POLICY "User delete policy" ON public.<tabela> FOR DELETE TO authenticated USING (auth.uid() = profile_id);`

### 3. Segurança em Views PostgreSQL 15+ (`security_invoker`)
- NENHUMA View (`vw_*`) pode ser criada sem a opção `WITH (security_invoker = true)`.
- Esta flag garante que a View herda o contexto do utilizador que faz a consulta (`auth.uid()`) e aplica automaticamente as regras RLS das tabelas de origem, evitando fugas de dados ou bloqueios de permissões.

### 4. Concessão de Permissões (Grants)
- Conceder explicitamente permissões de schema e acesso às roles do Supabase:
  `GRANT USAGE ON SCHEMA public TO authenticated;`
  `GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;`
  `GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;`

### 5. Requisito de Unicidade para Operações UPSERT (.upsert())
- Sempre que uma tabela for projetada para receber mutações em lote ou idempotentes via cliente (.upsert()), o agente MUST garantir que a tabela possui uma restrição de unicidade (UNIQUE constraint) nas colunas de chave primária composta ou de conflito (ex: `profile_id, coa_category`).
- Exemplo de declaração obrigatória:
  `ALTER TABLE public.table_name ADD CONSTRAINT table_name_composite_key UNIQUE (profile_id, column_b);`
- Sem esta restrição na base de dados, o PostgreSQL rejeita a requisição com o código de erro `42P10` (Bad Request).

## Passos de Auditoria do Agente:
- Sempre que o agente criar ou alterar uma tabela ou view no Supabase, DEVE verificar se este workflow é cumprido.
- O agente NUNCA pode usar `SECURITY DEFINER` em funções ou views sem autorização explícita, pois isto ignora o RLS.
