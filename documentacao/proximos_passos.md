# Próximos Passos de Desenvolvimento: Eldoria

Este documento descreve o plano de desenvolvimento estratégico pós-refatorização para reconstruir e expandir as mecânicas da aplicação **Eldoria (Medieval Stuff)** a partir do nosso boilerplate *Clean Slate*.

---

## 🗺️ Visão Geral das Fases

O projeto está estruturado em 3 fases de evolução:

| Fase | Objetivo Principal | Componentes Envolvidos | Status |
| :--- | :--- | :--- | :--- |
| **Fase 1** | Clean Slate & Core Loop Básico | `App.jsx`, `useKingdomStore.js`, `IsometricMap.jsx` | **Concluído** |
| **Fase 2** | Persistência Supabase & Autenticação | Base de Dados Supabase, triggers, sessões | *Pendente (Próximo)* |
| **Fase 3** | Reativação das Alas do Reino (Expansão) | Mercado, Taberna, Conquistas, Expedições | *Pendente* |

---

## 🛠️ Detalhe dos Próximos Passos

### 1. Sincronização e Persistência Supabase (Fase 2)
Atualmente, o store `useKingdomStore` inicia com valores locais mockados e reinicia ao dar *F5* no browser.
*   **Mapeamento de Perfis**: Carregar dados da tabela `profiles` (ouro, nível, XP) na inicialização da sessão e atualizar o Supabase a cada coleta ou upgrade.
*   **Mapeamento de Edifícios**: Carregar o nível da mina a partir da tabela `buildings` no Supabase.
*   **Prevenção de Cheats (Cálculo Server-Side)**:
    *   Substituir o temporizador ativo de geração passiva no cliente por um cálculo baseado em data no Supabase.
    *   Ao iniciar, calcular o tempo decorrido:
        $$\text{Ouro Ganho} = \text{Data Atual (Servidor)} - \text{last\_collection (DB)} \times \text{Produção por Segundo}$$
    *   Este cálculo deve ser validado através de um trigger na base de dados ao executar a coleta, evitando adulteração do tempo local.

### 2. Reativação da Ala 2: Royal Treasury (Tesouraria Real)
*   **Objetivo**: Reactivar a HitZone da Tesouraria no mapa.
*   **Mecânica**:
    *   Exibir estatísticas detalhadas de evolução económica do reino.
    *   Permitir a gestão de cofres (guardar ouro para evitar perdas ou roubos).
    *   Adicionar um histórico visual simulado (Ledger Real simplificado) de grandes transações efetuadas (ex: Upgrades de edifícios, contratações).

### 3. Reativação da Ala 3: Central Market (Mercado Central)
*   **Objetivo**: Permitir a troca de recursos.
*   **Mecânica**:
    *   Criar uma interface de trocas (ex: trocar ouro por gemas a uma taxa dinâmica).
    *   Comprar boosters temporários (ex: poção de velocidade de mineração de 2x por 5 minutos) gastando gemas.

### 4. Reativação da Ala 4: The Tavern (A Taberna)
*   **Objetivo**: Contratação de NPCs e ajudantes.
*   **Mecânica**:
    *   Habilidade de contratar "Mineradores Anões" (melhoram a produção passiva de ouro).
    *   Habilidade de contratar "Mercenários Guardas" (defendem as minas de roubos ou invasões).
    *   Cada contratação deduz ouro periodicamente ou exige um custo inicial elevado.

### 5. Reativação da Ala 5: Tributes / Monsters & Bounties (Expedições)
*   **Objetivo**: Lutar contra monstros e caçar recompensas de XP e gemas.
*   **Mecânica**:
    *   Enviar mercenários em expedições que demoram tempo real (ex: 5 minutos).
    *   Probabilidade de sucesso calculada no Supabase. Retornam com baús de ouro, gemas ou relíquias raras.
