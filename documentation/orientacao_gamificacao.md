# Tracker de Alta Performance: Gamificação

Este documento serve como guia mestre para a criação de aplicações web focadas em alta performance e loops de engajamento.

## 🚀 Visão Geral
Não estamos construindo apenas funcionalidades, estamos construindo **Loops de Engajamento**. Para que o resultado seja de altíssima performance (técnica e de retenção), o projeto é dividido em três pilares fundamentais.

---

## 🧠 1. O Alicerce (Variáveis de Contexto)
Estas variáveis guiam todas as decisões de design, código e interações.

### 👥 Público-Alvo e Persona
*   **Quem vai usar?** Entender o perfil dita o tom da gamificação.
*   *Exemplo:* Estudantes de 18-24 anos com baixo tempo de atenção.

### 🎯 Ação Desejada (Core Action)
*   **Qual é a única coisa que o usuário precisa fazer repetidas vezes?** A gamificação deve orbitar isso.
*   *Exemplo:* Completar um flashcard, preencher um formulário.

### 🔄 Core Loop de Gamificação
1.  **Gatilho:** Notificação push "Sua ofensiva vai cair!"
2.  **Ação:** Entrar no app e fazer 1 lição.
3.  **Recompensa:** Ganhar entre 10 e 50 XP + Confete.
4.  **Investimento:** Desbloquear um novo nível.

### 🕸️ Octalysis (Motivadores Principais)
Utilize o framework Octalysis para equilibrar os motivadores:
*   Significado Épico
*   Realização
*   Empoderamento
*   Propriedade
*   Influência Social
*   Escassez
*   Imprevisibilidade
*   Fuga

> [!NOTE]
> **Restrições (Constraints):** Nunca ignore limitações de tempo, orçamento ou APIs. Elas definem o limite da sua criatividade técnica.

---

## 📊 2. A Execução (Colunas de Controle)
A execução técnica no Kanban deve garantir que a mecânica de jogo e a liberação de dopamina sejam integradas.

| Coluna / Objetivo | Descrição / Exemplos |
| :--- | :--- |
| **ID / Épico** | Identificador único (`[AUTH]`, `[CORE-LOOP]`, `[REWARD]`). |
| **Tarefa / Feature** | Ação clara e executável (ex: "Criar barra de progresso animada"). |
| **Mecânica Gamificada** | Elementos de jogo: Pontos, Badges, Leaderboard. |
| **Impacto no Engajamento** | Crítico (Core), Alto, Médio, Estético. |
| **Complexidade Técnica** | Esforço estimado (Story points: 1, 3, 5, 8). |
| **⚡ Feedback de Dopamina** | Retorno visual/sonoro (ex: "Animação de scale + Som de moeda"). |

### Distribuição Ideal de Impacto
*   **45%** Crítico (Core Loop)
*   **30%** Alto (Retenção)
*   **15%** Médio (UX)
*   **10%** Apenas Estético

---

## ⚠️ 3. Critérios de Avaliação (DoD - Definition of Done)
Para que uma tarefa seja movida para "Concluída", ela deve passar por este checklist rigoroso:

### A. Performance Técnica
- [ ] **Tempo de Resposta:** Feedback instantâneo na UI (< 100ms).
- [ ] **Carregamento:** First Contentful Paint (FCP) < 1.5s.
- [ ] **Responsividade:** Testado em Mobile, Tablet e Desktop.
- [ ] **Zero Bugs:** Sem erros no console no fluxo principal.
- [ ] **Tratamento de Erros:** Mensagem amigável offline.

### B. UX e Gamificação ("Juice")
- [ ] **Feedback Visual:** O usuário sabe exatamente o que aconteceu.
- [ ] **Onboarding:** Experimenta o "Core Loop" em menos de 60s.
- [ ] **Empty States:** Telas vazias convidam à ação.
- [ ] **Micro-interações:** Estados hover, active e disabled definidos.

### C. Negócio e Métricas
- [ ] **Analytics:** Ação principal emite evento (ex: `xp_ganho`).
- [ ] **Alinhamento:** Feature aproxima da meta de conversão/retenção.

---

> [!TIP]
> **Dica de Ouro:** Nenhuma tela de carregamento (Loading) deve ser chata. Use esse tempo para dar dicas, mostrar animações ou textos divertidos. A percepção de performance começa na psicologia!
