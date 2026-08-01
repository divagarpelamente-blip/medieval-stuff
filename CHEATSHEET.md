# 📜 Eldoria V3.0 - Cheatsheet de Desenvolvimento

Este documento resume as regras, ciclos de vida de dados e mecanismos de controlo do projeto para uma consulta rápida.

---

## 1. Resumo das Regras Principais (.antigravityrules)
* **Arquitetura Servidor-Side**: Sem cálculos pesados no React. Todos os cálculos analíticos, balanço e gamificação vêm prontos das Views (`vw_*`) ou RPCs do Supabase.
* **Mutações Otimistas**: As transações são adicionadas/removidas localmente no Zustand instantaneamente (Optimistic UI) e sincronizadas com a base de dados em background.
* **Layout do Dashboard**: Utilização estrita de `react-grid-layout` com grelha de 12 colunas, evitando colapsos de altura.

---

## 2. Ciclo de Vida de Persistência do Layout
O posicionamento e visibilidade dos widgets do Dashboard seguem um fluxo de persistência em 3 camadas:
1. **Zustand State (Memória)**: Guarda o estado ativo enquanto a aplicação está a correr no browser.
2. **LocalStorage (Cache Local)**: Atualiza instantaneamente quando o utilizador arrasta ou redimensiona um widget, garantindo persistência imediata mesmo que a rede falhe.
3. **Supabase Profiles (Base de Dados)**: Sincroniza o layout em background no perfil do utilizador (`profiles.dashboard_layouts`) para que as preferências estejam disponíveis em qualquer dispositivo.

---

## 3. Mecanismo de Event Shielding
Para evitar interferências entre a edição do layout e a interatividade dos widgets no `react-grid-layout`:
* **Modo de Edição Ativo**: Aplica-se a classe `pointer-events-none` ao conteúdo interior dos widgets. Isto bloqueia cliques, inputs e scrolls acidentais enquanto o utilizador arrasta ou redimensiona o cartão na grelha.
* **Modo de Visualização Ativo**: Aplica-se o bloqueio de propagação de eventos de rato (ex: `e.stopPropagation()`) nas áreas interativas (botões, tabelas, inputs) para evitar que o `react-grid-layout` tente mover o widget ao clicar nos seus controlos internos.

---

## 4. Workflows Disponíveis
Os workflows detalhados estão na pasta `.agents/workflows/`:
1. [sandbox-creator.md](file:///c:/Users/silva/.gemini/antigravity/Medieval%20Stuff/.agents/workflows/sandbox-creator.md): Automatiza a criação e o teste isolado de componentes na Sandbox.
2. [workspace-cleanup.md](file:///c:/Users/silva/.gemini/antigravity/Medieval%20Stuff/.agents/workflows/workspace-cleanup.md): Guia para remover com segurança ficheiros temporários (`*.cjs`) e desfazer injeções de teste.
3. [widget-deployment.md](file:///c:/Users/silva/.gemini/antigravity/Medieval%20Stuff/.agents/workflows/widget-deployment.md): Processo para mover widgets validados da Sandbox para a grelha de produção.
4. [database-diagnostic.md](file:///c:/Users/silva/.gemini/antigravity/Medieval%20Stuff/.agents/workflows/database-diagnostic.md): Workflow para auditoria de saúde da base de dados, RLS e integridade de restrições.
5. [ui-compliance.md](file:///c:/Users/silva/.gemini/antigravity/Medieval%20Stuff/.agents/workflows/ui-compliance.md): Workflow para verificação de performance visual, CSS transform scale e Event Shielding.
6. [database-timeout-diagnostic.md](file:///c:/Users/silva/.gemini/antigravity/Medieval%20Stuff/.agents/workflows/database-timeout-diagnostic.md): Roteiro padrão para auditar e corrigir queries lentas e garantir a performance das Views e RPCs do Supabase.
7. [data-flow-compliance.md](file:///c:/Users/silva/.gemini/antigravity/Medieval%20Stuff/.agents/workflows/data-flow-compliance.md): Regra de ouro que obriga ao uso de RPCs e Views do Supabase para cálculos, mantendo o front-end leve.
8. [open-banking-integration.md](file:///c:/Users/silva/.gemini/antigravity/Medieval%20Stuff/.agents/workflows/open-banking-integration.md): Arquitetura base para ligar contas reais da CGD e outros bancos europeus ao Eldoria via Edge Functions e GoCardless.
9. [rls-security-compliance.md](file:///c:/Users/silva/.gemini/antigravity/Medieval%20Stuff/.agents/workflows/rls-security-compliance.md): Protocolo padrão para auditoria e aplicação global de RLS, `security_invoker` nas views, e restrições de unicidade obrigatórias para operações de UPSERT.

