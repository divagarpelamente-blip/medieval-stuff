# Roteiro de Teste Manual: Livro de Transações (Ledger)

Este documento fornece um guia passo a passo para testar manualmente a nova mecânica de **Livro de Transações (Ledger)** de Eldoria (Medieval Stuff), abrangendo a integração com o Supabase e triggers SQL para cálculo de XP, Ouro e Nível.

---

## Passo 1: Preparação da Base de Dados

1. Aceda ao painel do seu projeto no **Supabase**.
2. Abra o **SQL Editor**.
3. Execute o script de reset de base de dados para garantir que a tabela `profiles` existe:
   👉 **[db_reset_migration.sql](file:///c:/Users/silva/.gemini/antigravity/Medieval%20Stuff/SQL%20all/db_reset_migration.sql)**
4. Execute o script para criar a nova tabela e triggers de transações:
   👉 **[add_transactions_table.sql](file:///c:/Users/silva/.gemini/antigravity/Medieval%20Stuff/SQL%20all/add_transactions_table.sql)**
5. Por fim, execute o script de dados fictícios para inicializar a conta Guest:
   👉 **[mockup_test_data.sql](file:///c:/Users/silva/.gemini/antigravity/Medieval%20Stuff/SQL%20all/mockup_test_data.sql)**
   *(O utilizador guest possuirá o UUID `'00000000-0000-0000-0000-000000000000'`).*

---

## Passo 2: Inicialização do Servidor Local

1. No seu terminal, aceda à pasta do frontend:
   ```powershell
   cd client
   ```
2. Inicie o servidor em modo de desenvolvimento:
   ```powershell
   npm run dev
   ```
3. Abra o link no browser (geralmente `http://localhost:5173`).

---

## Passo 3: Verificação Visual e HUD Inicial

1. O jogo deve carregar automaticamente o perfil fictício `guest@medieval.stuff`.
2. Confirme que o **HUD superior** exibe os seguintes dados carregados do Supabase:
   * **Ouro**: `5,000` 💰 (ou o valor atualizado na sua base de dados).
   * **Gemas**: `100` 💎.
   * **Nível de Lorde**: `3` (com base no XP do utilizador).
   * **XP**: `120` (barra verde de progresso).

---

## Passo 4: Submissão de Transação (Receita / Income)

1. Clique na **Mina de Ouro** (edifício ativo no mapa).
2. Verifique se o modal intitulado **Livro de Transações** se abre.
3. No painel **Registar Movimento**:
   * Certifique-se de que o botão **Receita (Income)** está selecionado (destacado a verde).
   * Introduza a quantidade (ex: `100`).
   * Selecione a categoria `Gold Mine`.
   * Insira a descrição (ex: "Produção diária de minério").
   * Clique em **Registar no Livro**.
4. **Resultados Esperados**:
   * Um toast de sucesso verde deve surgir.
   * O formulário deve ser limpo.
   * O ouro no HUD superior deve atualizar instantaneamente de `5,000` para `5,100` 💰.
   * A transação deve aparecer no feed **Histórico de Transações** na parte inferior do modal:
     * Exibindo: `[Gold Mine] Produção diária de minério`, a data/hora e o valor `+100` em verde.
   * Na tabela `profiles` do Supabase, o ouro deve passar para `5100` e o XP incrementado pelo trigger (`XP ganho = Ouro * 2`, ou seja, +200 XP). Se o XP acumular o suficiente, o Lorde subirá de nível!

---

## Passo 5: Submissão de Transação (Despesa / Expense)

1. Com o modal ainda aberto, no painel **Registar Movimento**:
   * Selecione o botão **Despesa (Expense)** (destacado a vermelho).
   * Introduza a quantidade (ex: `50`).
   * Selecione a categoria `The Tavern` ou `Central Market`.
   * Insira a descrição (ex: "Bebidas para a guarnição").
   * Clique em **Registar no Livro**.
2. **Resultados Esperados**:
   * O toast indicará o sucesso do débito.
   * O ouro no HUD superior deve atualizar instantaneamente de `5,100` para `5,050` 💰.
   * A transação deve aparecer no topo do histórico inferior:
     * Exibindo: `[The Tavern] Bebidas para a guarnição`, a data/hora e o valor `-50` em vermelho.
   * Na base de dados, a reserva de ouro da conta Guest é atualizada atómicamente para `5050` sem atribuição de XP (despesas não geram experiência).

---

## Passo 6: Validação da Progressão de Nível de Lorde (XP)

1. Registe uma receita de `200` moedas de ouro.
2. O trigger do banco de dados irá gerar `400` XP (`200 * 2`).
3. Com o XP anterior de `120`, o XP total acumulado ultrapassará o limite necessário de progressão do nível 3 para 4.
4. **Resultado Esperado**:
   * O nível do Lorde no círculo vermelho do avatar no HUD superior deve mudar dinamicamente para `4` (ou superior).
   * A barra de progresso verde de XP deve recalcular a percentagem e resetar, retendo apenas o excedente.
