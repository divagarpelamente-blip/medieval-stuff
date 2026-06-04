# Data Architecture Specification: Modular Dashboard Blueprint

Esta especificação define a infraestrutura de dados e a arquitetura de compilação dos 6 componentes visuais centrais para a geração do painel de controlo da aplicação **Eldoria (Medieval Stuff)**.

Os dados transacionais têm como origem a tabela `Base` (mapeada no banco de dados Supabase como a tabela `treasury_records`), servindo como ledger de auditoria.

---

:::VISUAL_BLOCK_START:::
### 📊 ELEMENT_ID: VISUAL_01
#### 1. VISUAL IDENTIFICATION & SEMANTIC PURPOSE
* **System Asset Name (PT/EN):** Receitas Mensais por Categoria / Monthly Revenues by Category Matrix
* **Target UI Component:** Stacked Column Chart (Coluna Empilhada)
* **Analytical Target:** Qual é a proporção entre a receita ativa (Salário) e as receitas acessórias (Outras Receitas) obtidas pelo reino no mês selecionado?

#### 2. DATA SCHEMA & LINEAGE MAPPING
* **Source Tables:** `Base` -> `income_amount`, `payment_receipt_cash`, `entity` (Categoria), `year`, `month`, `transaction_type`
* **Data Type Castings:** 
  * `year`: Categorical (TEXT)
  * `month`: Categorical (TEXT)
  * `entity`: Categorical (TEXT)
  * `income_amount`: Decimal (CURRENCY)
  * `transaction_type`: Categorical (TEXT)
* **Pipeline Roles:**
  * **Axis (Dimension):** `month`
  * **Legend (Slices):** `entity` (Filtro agrupado: 'Salary' vs 'Other')
  * **Values (Metrics):** `SUM(income_amount)`

#### 3. FILTERING & COMPILATION CONSTRAINTS
* **Aggregation Operator:** `SUM`
* **Pre-Aggregation Filters:** `transaction_type IN ('Income', 'Earning', 'Income Cash', 'Income Credit')` e `status = 'Paid'` para evitar o desvio por valores não realizados.

#### 4. IDE CODE GENERATION TARGETS
* **[EXCEL_FORMULA]:**
  * *Salário*: `=SUMIFS(Base!$G:$G, Base!$B:$B, $A$2, Base!$C:$C, $B3, Base!$D:$D, "Salary", Base!$E:$E, "Income")`
  * *Outras Receitas*: `=SUMIFS(Base!$G:$G, Base!$B:$B, $A$2, Base!$C:$C, $B3, Base!$D:$D, "<>Salary", Base!$E:$E, "Income")`
* **[SQL_VIEW]:**
  ```sql
  CREATE OR REPLACE VIEW view_monthly_revenues AS
  SELECT 
    year,
    month,
    CASE 
      WHEN entity IN ('Salary', 'Salário') THEN 'Salary'
      ELSE 'Other Revenues'
    END AS category,
    SUM(COALESCE(income_amount, payment_receipt_cash, 0)) AS total_revenue
  FROM public.treasury_records
  WHERE transaction_type IN ('Income', 'Earning', 'Income Cash', 'Income Credit')
    AND status = 'Paid'
  GROUP BY year, month, category;
  ```

#### 5. PIPELINE TRIPOINT RULES & ALERTS
* **Sort Execution:** Cronológico por mês (`month`).
* **UI/Business Exception Alert:** Alerta amarelo de aviso caso as receitas acessórias ("Other Revenues") superem a receita ativa ("Salary") em 100% no mês, sinalizando anomalia ou flutuação de receita não-recorrente.
:::VISUAL_BLOCK_END:::

---

:::VISUAL_BLOCK_START:::
### 📊 ELEMENT_ID: VISUAL_02
#### 1. VISUAL IDENTIFICATION & SEMANTIC PURPOSE
* **System Asset Name (PT/EN):** Visão Geral de Fluxo de Caixa / Monthly Cash Flow Overview
* **Target UI Component:** Dual Line Chart (Gráfico de Linha Dupla de Tendência)
* **Analytical Target:** A tendência temporal de entradas (Inflow) supera consistentemente as saídas (Outflow) ao longo do ano?

#### 2. DATA SCHEMA & LINEAGE MAPPING
* **Source Tables:** `Base` -> `income_amount`, `expense_amount`, `interests`, `late_fee_interests`, `penalties`, `tax`, `year`, `month`, `transaction_type`
* **Data Type Castings:**
  * `year`: Categorical (TEXT)
  * `month`: Categorical (TEXT)
  * `inflow`: Decimal (CURRENCY)
  * `outflow`: Decimal (CURRENCY)
* **Pipeline Roles:**
  * **Axis (Dimension):** `month`
  * **Legend (Slices):** Categoria de Fluxo (Inflow vs Outflow)
  * **Values (Metrics):** `SUM(inflow)` vs `SUM(outflow)`

#### 3. FILTERING & COMPILATION CONSTRAINTS
* **Aggregation Operator:** `SUM`
* **Pre-Aggregation Filters:** Filtro por ano corrente e exclusão de transações pendentes (`status = 'Paid'`).

#### 4. IDE CODE GENERATION TARGETS
* **[EXCEL_FORMULA]:**
  * *Inflow*: `=SUMIFS(Base!$G:$G, Base!$B:$B, $A$2, Base!$C:$C, $B3)` (Soma de entradas na coluna G)
  * *Outflow*: `=SUMIFS(Base!$H:$H, Base!$B:$B, $A$2, Base!$C:$C, $B3) + SUMIFS(Base!$K:$K, Base!$B:$B, $A$2, Base!$C:$C, $B3)` (Custos base na coluna H + Juros/taxas na coluna K)
* **[SQL_VIEW]:**
  ```sql
  CREATE OR REPLACE VIEW view_monthly_cash_flow AS
  SELECT 
    year,
    month,
    SUM(CASE WHEN transaction_type IN ('Income', 'Earning', 'Income Cash', 'Income Credit') THEN COALESCE(income_amount, payment_receipt_cash, 0) ELSE 0 END) AS total_inflow,
    SUM(CASE WHEN transaction_type IN ('Expense', 'Payment', 'Payment Cash', 'Payment Credit') THEN COALESCE(expense_amount, 0) + COALESCE(interests, 0) + COALESCE(late_fee_interests, 0) + COALESCE(penalties, 0) + COALESCE(tax, 0) ELSE 0 END) AS total_outflow
  FROM public.treasury_records
  WHERE status = 'Paid'
  GROUP BY year, month;
  ```

#### 5. PIPELINE TRIPOINT RULES & ALERTS
* **Sort Execution:** Cronológico por mês (`month`).
* **UI/Business Exception Alert:** Alerta Crítico (Vermelho) se `total_outflow > total_inflow`, indicando défice orçamental imediato no fluxo de caixa do mês.
:::VISUAL_BLOCK_END:::

---

:::VISUAL_BLOCK_START:::
### 📊 ELEMENT_ID: VISUAL_03
#### 1. VISUAL IDENTIFICATION & SEMANTIC PURPOSE
* **System Asset Name (PT/EN):** Saldo Líquido do Mês / Net Monthly Balance KPI
* **Target UI Component:** KPI Card (Cartão de Métrica Única de Destaque)
* **Analytical Target:** Qual é a margem de poupança líquida restante após deduzir todas as despesas e taxas do mês selecionado?

#### 2. DATA SCHEMA & LINEAGE MAPPING
* **Source Tables:** `Base` -> `income_amount`, `expense_amount`, `interests`, `late_fee_interests`, `penalties`, `tax`, `year`, `month`
* **Data Type Castings:**
  * `year`: Categorical (TEXT)
  * `month`: Categorical (TEXT)
  * `net_balance`: Decimal (CURRENCY)
* **Pipeline Roles:**
  * **Values (Metrics):** `SUM(inflow) - SUM(outflow)`

#### 3. FILTERING & COMPILATION CONSTRAINTS
* **Aggregation Operator:** `SUM` (Diferença)
* **Pre-Aggregation Filters:** Filtro dinâmico com base no ano `$A$2` e mês `$B3`.

#### 4. IDE CODE GENERATION TARGETS
* **[EXCEL_FORMULA]:**
  `=SUMIFS(Base!$G:$G, Base!$B:$B, $A$2, Base!$C:$C, $B3) - (SUMIFS(Base!$H:$H, Base!$B:$B, $A$2, Base!$C:$C, $B3) + SUMIFS(Base!$K:$K, Base!$B:$B, $A$2, Base!$C:$C, $B3))`
* **[SQL_VIEW]:**
  ```sql
  CREATE OR REPLACE VIEW view_net_monthly_balance AS
  SELECT 
    year,
    month,
    SUM(
      CASE WHEN transaction_type IN ('Income', 'Earning', 'Income Cash', 'Income Credit') THEN COALESCE(income_amount, payment_receipt_cash, 0) ELSE 0 END
      - 
      CASE WHEN transaction_type IN ('Expense', 'Payment', 'Payment Cash', 'Payment Credit') THEN COALESCE(expense_amount, 0) + COALESCE(interests, 0) + COALESCE(late_fee_interests, 0) + COALESCE(penalties, 0) + COALESCE(tax, 0) ELSE 0 END
    ) AS net_balance
  FROM public.treasury_records
  WHERE status = 'Paid'
  GROUP BY year, month;
  ```

#### 5. PIPELINE TRIPOINT RULES & ALERTS
* **Sort Execution:** N/A (KPI estático de valor único).
* **UI/Business Exception Alert:** Alterar estilo do cartão KPI para vermelho se `net_balance < 0`, ou amarelo (aviso) se a taxa de poupança for inferior a 10% da receita do mês.
:::VISUAL_BLOCK_END:::

---

:::VISUAL_BLOCK_START:::
### 📊 ELEMENT_ID: VISUAL_04
#### 1. VISUAL IDENTIFICATION & SEMANTIC PURPOSE
* **System Asset Name (PT/EN):** Despesas Estruturais / Major Structural Expenses
* **Target UI Component:** Horizontal Bar Chart (Gráfico de Barras Horizontais)
* **Analytical Target:** Como se distribuem os custos fixos estruturais essenciais (Moradia, Subsistência, Transporte, Saúde) do reino?

#### 2. DATA SCHEMA & LINEAGE MAPPING
* **Source Tables:** `Base` -> `expense_amount`, `entity` (Categoria), `year`, `month`
* **Data Type Castings:**
  * `year`: Categorical (TEXT)
  * `month`: Categorical (TEXT)
  * `entity` (category): Categorical (TEXT)
  * `expense_amount`: Decimal (CURRENCY)
* **Pipeline Roles:**
  * **Axis (Dimension):** `entity` (Filtrado apenas para Moradia, Subsistência, Transporte, Saúde)
  * **Values (Metrics):** `SUM(expense_amount)`

#### 3. FILTERING & COMPILATION CONSTRAINTS
* **Aggregation Operator:** `SUM`
* **Pre-Aggregation Filters:** `transaction_type IN ('Expense', 'Payment')` AND `entity IN ('Moradia', 'Subsistência', 'Transporte', 'Saúde')`.

#### 4. IDE CODE GENERATION TARGETS
* **[EXCEL_FORMULA]:**
  * *Moradia*: `=SUMIFS(Base!$H:$H, Base!$B:$B, $A$2, Base!$C:$C, $B3, Base!$D:$D, "Moradia")`
  * *Subsistência*: `=SUMIFS(Base!$H:$H, Base!$B:$B, $A$2, Base!$C:$C, $B3, Base!$D:$D, "Subsistência")`
  * *Transporte*: `=SUMIFS(Base!$H:$H, Base!$B:$B, $A$2, Base!$C:$C, $B3, Base!$D:$D, "Transporte")`
  * *Saúde*: `=SUMIFS(Base!$H:$H, Base!$B:$B, $A$2, Base!$C:$C, $B3, Base!$D:$D, "Saúde")`
* **[SQL_VIEW]:**
  ```sql
  CREATE OR REPLACE VIEW view_structural_expenses AS
  SELECT 
    year,
    month,
    entity AS category,
    SUM(COALESCE(expense_amount, 0)) AS total_spent
  FROM public.treasury_records
  WHERE transaction_type IN ('Expense', 'Payment', 'Payment Cash', 'Payment Credit')
    AND entity IN ('Moradia', 'Subsistência', 'Transporte', 'Saúde')
  GROUP BY year, month, category;
  ```

#### 5. PIPELINE TRIPOINT RULES & ALERTS
* **Sort Execution:** Ordenação decrescente por valor (`total_spent DESC`).
* **UI/Business Exception Alert:** Alerta Crítico se a soma destas despesas estruturais exceder 50% da receita mensal total (Inflow), sinalizando rigidez extrema do orçamento.
:::VISUAL_BLOCK_END:::

---

:::VISUAL_BLOCK_START:::
### 📊 ELEMENT_ID: VISUAL_05
#### 1. VISUAL IDENTIFICATION & SEMANTIC PURPOSE
* **System Asset Name (PT/EN):** Despesas de Lazer e Estilo de Vida / Lifestyle & Discretionary Expenses
* **Target UI Component:** Donut Chart (Gráfico de Rosca)
* **Analytical Target:** Qual é o impacto financeiro dos gastos discricionários (Streaming, Viagem, Restaurante, Cinema) no orçamento mensal?

#### 2. DATA SCHEMA & LINEAGE MAPPING
* **Source Tables:** `Base` -> `expense_amount`, `entity` (Categoria), `year`, `month`
* **Data Type Castings:**
  * `year`: Categorical (TEXT)
  * `month`: Categorical (TEXT)
  * `entity` (category): Categorical (TEXT)
  * `expense_amount`: Decimal (CURRENCY)
* **Pipeline Roles:**
  * **Legend (Slices):** `entity` (Filtrado apenas para Streaming, Viagem, Restaurante, Cinema)
  * **Values (Metrics):** `SUM(expense_amount)`

#### 3. FILTERING & COMPILATION CONSTRAINTS
* **Aggregation Operator:** `SUM`
* **Pre-Aggregation Filters:** `transaction_type IN ('Expense', 'Payment')` AND `entity IN ('Streaming', 'Viagem', 'Restaurante', 'Cinema')`.

#### 4. IDE CODE GENERATION TARGETS
* **[EXCEL_FORMULA]:**
  * *Streaming*: `=SUMIFS(Base!$H:$H, Base!$B:$B, $A$2, Base!$C:$C, $B3, Base!$D:$D, "Streaming")`
  * *Viagem*: `=SUMIFS(Base!$H:$H, Base!$B:$B, $A$2, Base!$C:$C, $B3, Base!$D:$D, "Viagem")`
  * *Restaurante*: `=SUMIFS(Base!$H:$H, Base!$B:$B, $A$2, Base!$C:$C, $B3, Base!$D:$D, "Restaurante")`
  * *Cinema*: `=SUMIFS(Base!$H:$H, Base!$B:$B, $A$2, Base!$C:$C, $B3, Base!$D:$D, "Cinema")`
* **[SQL_VIEW]:**
  ```sql
  CREATE OR REPLACE VIEW view_discretionary_expenses AS
  SELECT 
    year,
    month,
    entity AS category,
    SUM(COALESCE(expense_amount, 0)) AS total_spent
  FROM public.treasury_records
  WHERE transaction_type IN ('Expense', 'Payment', 'Payment Cash', 'Payment Credit')
    AND entity IN ('Streaming', 'Viagem', 'Restaurante', 'Cinema')
  GROUP BY year, month, category;
  ```

#### 5. PIPELINE TRIPOINT RULES & ALERTS
* **Sort Execution:** Ordenação decrescente por valor (`total_spent DESC`).
* **UI/Business Exception Alert:** Alerta Amarelo de aviso se a soma acumulada de despesas de lazer exceder 20% do orçamento de entradas totais (Inflow) do período.
:::VISUAL_BLOCK_END:::

---

:::VISUAL_BLOCK_START:::
### 📊 ELEMENT_ID: VISUAL_06
#### 1. VISUAL IDENTIFICATION & SEMANTIC PURPOSE
* **System Asset Name (PT/EN):** Proporção da Categoria Mês vs Ano / Category Share Month-Over-Year Validation
* **Target UI Component:** Heatmap Grid / Comparison Percentage Table
* **Analytical Target:** Qual é o peso percentual do consumo mensal de cada categoria em relação ao total anual acumulado para essa mesma categoria?

#### 2. DATA SCHEMA & LINEAGE MAPPING
* **Source Tables:** `Base` -> `expense_amount`, `entity` (Categoria), `year`, `month`
* **Data Type Castings:**
  * `year`: Categorical (TEXT)
  * `month`: Categorical (TEXT)
  * `entity` (category): Categorical (TEXT)
  * `share_percentage`: Decimal (PERCENTAGE)
* **Pipeline Roles:**
  * **Axis (Dimension):** `entity` (category)
  * **Values (Metrics):** Taxa Proporcional: `SUM(monthly_spent) / SUM(annual_spent)`

#### 3. FILTERING & COMPILATION CONSTRAINTS
* **Aggregation Operator:** Divisão Customizada de Agregações de Janelas
* **Pre-Aggregation Filters:** `transaction_type IN ('Expense', 'Payment')` e `status = 'Paid'`.

#### 4. IDE CODE GENERATION TARGETS
* **[EXCEL_FORMULA]:**
  `=SUMIFS(Base!$H:$H, Base!$B:$B, $A$2, Base!$C:$C, $B3, Base!$D:$D, "Moradia") / SUMIFS(Base!$H:$H, Base!$B:$B, $A$2, Base!$D:$D, "Moradia")`
* **[SQL_VIEW]:**
  ```sql
  CREATE OR REPLACE VIEW view_category_share_month_over_year AS
  WITH monthly_totals AS (
    SELECT 
      year,
      month,
      entity AS category,
      SUM(COALESCE(expense_amount, 0)) AS monthly_sum
    FROM public.treasury_records
    WHERE transaction_type IN ('Expense', 'Payment', 'Payment Cash', 'Payment Credit')
      AND status = 'Paid'
    GROUP BY year, month, entity
  ),
  annual_totals AS (
    SELECT 
      year,
      entity AS category,
      SUM(COALESCE(expense_amount, 0)) AS annual_sum
    FROM public.treasury_records
    WHERE transaction_type IN ('Expense', 'Payment', 'Payment Cash', 'Payment Credit')
      AND status = 'Paid'
    GROUP BY year, entity
  )
  SELECT 
    m.year,
    m.month,
    m.category,
    m.monthly_sum,
    a.annual_sum,
    CASE 
      WHEN a.annual_sum > 0 THEN (m.monthly_sum / a.annual_sum) * 100
      ELSE 0
    END AS share_percentage
  FROM monthly_totals m
  JOIN annual_totals a ON m.year = a.year AND m.category = a.category;
  ```

#### 5. PIPELINE TRIPOINT RULES & ALERTS
* **Sort Execution:** Alfabética por categoria.
* **UI/Business Exception Alert:** Alerta vermelho se um único mês concentrar mais de 15% do total anual de uma única categoria, assinalando desvios pontuais (ex: pagamentos de impostos anuais ou compras extraordinárias).
:::VISUAL_BLOCK_END:::
