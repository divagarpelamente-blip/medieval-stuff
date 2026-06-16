# transactions_schema.md: Eldoria Treasury Management System Blueprint

This document specifies the strict 4-tier matrix database architecture, the transaction templates (Quick Actions Catalog), and the financial statement mapping queries for **Eldoria**, a medieval-themed treasury management application.

---

## 1. Architecture Overview

To maintain transactional integrity and avoid complex multi-table joins, Eldoria uses a unified single-table database schema for accounting entries, utilizing a **strict 4-tier matrix schema** representing double-entry accounting principles:

1. **`transaction_type`**: Represents the broad account classification (`Income`, `Expense`, `Debt`, `Savings`, `Payable`, `Receivable`).
2. **`transaction_subtype`**: Defines the specific transaction event type (e.g., `Cash receipt`, `Cash payment`, `New Debt`, `Amortization`, `Interest`).
3. **`transaction_nature`**: Defines the accounting framework dimension (`cash` vs. `accrual`).
4. **`transaction_flow`**: Governs direction of capital flow (`inflow` vs. `outflow`).

### Core Financial Statements & Engine Integration

- **Profit & Loss (P&L)**: Measures the economic output of the realm. It relies exclusively on **Accrual** entries (`transaction_nature === 'accrual'`).
- **Balance Sheet**: Represents the net state of the kingdom's assets, liabilities, and lord's equity at a point in time. It aggregates all historical records to satisfy the accounting identity:
  $$\text{Assets (Vault Cash + Receivables)} = \text{Liabilities (Debt + Payables)} + \text{Lord's Equity}$$
- **Cash Flow Statement**: Tracks the movement of physical gold through the kingdom vaults. It relies exclusively on **Cash** entries (`transaction_nature === 'cash'`), categorized into Operating, Investing, and Financing activities.

---

## 2. Quick Actions Catalog

### Standard Actions

#### 1. Salary

- **Description:** Lord's primary tribute or stipend paid out of the treasury to the Royal Purse.
- **Database Payload(s):**

  | Leg | Type | Subtype | Category | Nature | Flow | Amount (Example) | Target Entity |
  | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
  | 1 | Income | Cash receipt | Payroll | cash | inflow | 500 G | Consolidated |

- **Financial Statement Flow:**
  - **Profit & Loss:** No change (accrued salary must go through a separate payroll accrual to hit the P&L; this is a pure cash receipt).
  - **Balance Sheet:** Assets (Vault Cash) increases by +500 G. Lord's Equity increases by +500 G.
  - **Cash Flow:** Operating Cash Flow (Inflow) increases by +500 G. Net Cash increases by +500 G.
- **Mermaid Flowchart:**

  ```mermaid
  graph LR
      Payer[Consolidated/Taxpayers] -->|500 G Gold| Vault[Kingdom Vault Cash]
      Vault -->|Binds to| Equity[Lord's Equity]
  ```

#### 2. Pay Blacksmith

- **Description:** Direct cash purchase of armaments, horseshoes, and smithing equipment from the town blacksmith.
- **Database Payload(s):**

  | Leg | Type | Subtype | Category | Nature | Flow | Amount (Example) | Target Entity |
  | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
  | 1 | Expense | Cash payment | Markets | cash | outflow | 150 G | Tools and Equipment |

- **Financial Statement Flow:**
  - **Profit & Loss:** No change (direct cash expense bypassing accruals does not hit Accrued Expenses).
  - **Balance Sheet:** Assets (Vault Cash) decreases by (150) G. Lord's Equity decreases by (150) G.
  - **Cash Flow:** Operating Cash Flow (Outflow) decreases by (150) G. Net Cash decreases by (150) G.
- **Mermaid Flowchart:**

  ```mermaid
  graph LR
      Vault[Kingdom Vault Cash] -->|150 G Gold| Blacksmith[Blacksmith / Tools & Equipment]
      Blacksmith -->|Binds to| Expense[Operating Expense Ledger]
  ```

#### 3. Tavern Feast

- **Description:** Entertainment expense for hosting dinners and drinking events with local guilds to maintain realm diplomacy.
- **Database Payload(s):**

  | Leg | Type | Subtype | Category | Nature | Flow | Amount (Example) | Target Entity |
  | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
  | 1 | Expense | Cash payment | Entertainment | cash | outflow | 50 G | Restaurant |

- **Financial Statement Flow:**
  - **Profit & Loss:** No change.
  - **Balance Sheet:** Assets (Vault Cash) decreases by (50) G. Lord's Equity decreases by (50) G.
  - **Cash Flow:** Operating Cash Flow (Outflow) decreases by (50) G. Net Cash decreases by (50) G.
- **Mermaid Flowchart:**

  ```mermaid
  graph LR
      Vault[Kingdom Vault Cash] -->|50 G Gold| Tavern[Tavern / Restaurant]
  ```

#### 4. Borrow Gold

- **Description:** Accessing a credit line from the Iron Bank, resulting in immediate cash and an accrual liability.
- **Database Payload(s):**

  | Leg | Type | Subtype | Category | Nature | Flow | Amount (Example) | Target Entity |
  | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
  | 1 | Debt | New Debt | Banking | accrual | inflow | 1000 G | CGD |
  | 2 | Debt | New Debt | Banking | cash | inflow | 1000 G | CGD |

- **Financial Statement Flow:**
  - **Profit & Loss:** No change (borrowing is a balance sheet event).
  - **Balance Sheet:** Assets (Vault Cash) increases by +1000 G. Liabilities (Debt) increases by +1000 G.
  - **Cash Flow:** Financing Cash Flow (Inflow) increases by +1000 G. Net Cash increases by +1000 G.
- **Mermaid Flowchart:**

  ```mermaid
  graph TD
      Bank[Iron Bank / CGD] -->|Leg 1: Accrual Debt| Liab[Liabilities Ledger]
      Bank -->|Leg 2: Cash Inflow 1000 G| Vault[Kingdom Vault Cash]
  ```

#### 5. Pay Landlord

- **Description:** Rental payment for land usage, fields, or keeping estate rights.
- **Database Payload(s):**

  | Leg | Type | Subtype | Category | Nature | Flow | Amount (Example) | Target Entity |
  | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
  | 1 | Expense | Cash payment | Housing | cash | outflow | 800 G | Rent |

- **Financial Statement Flow:**
  - **Profit & Loss:** No change.
  - **Balance Sheet:** Assets (Vault Cash) decreases by (800) G. Lord's Equity decreases by (800) G.
  - **Cash Flow:** Operating Cash Flow (Outflow) decreases by (800) G. Net Cash decreases by (800) G.
- **Mermaid Flowchart:**

  ```mermaid
  graph LR
      Vault[Kingdom Vault Cash] -->|800 G Gold| Landlord[Landlord / Rent]
  ```

#### 6. Purchase Food

- **Description:** Cash-basis acquisition of grain, flour, and provisions to sustain the castle.
- **Database Payload(s):**

  | Leg | Type | Subtype | Category | Nature | Flow | Amount (Example) | Target Entity |
  | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
  | 1 | Expense | Cash payment | Markets | cash | outflow | 120 G | Supermarket |

- **Financial Statement Flow:**
  - **Profit & Loss:** No change.
  - **Balance Sheet:** Assets (Vault Cash) decreases by (120) G. Lord's Equity decreases by (120) G.
  - **Cash Flow:** Operating Cash Flow (Outflow) decreases by (120) G. Net Cash decreases by (120) G.
- **Mermaid Flowchart:**

  ```mermaid
  graph LR
      Vault[Kingdom Vault Cash] -->|120 G Gold| Market[Market / Supermarket]
  ```

#### 7. Healer Potions

- **Description:** Acquisition of medicinal herbs, poultices, and potions to treat injured knights.
- **Database Payload(s):**

  | Leg | Type | Subtype | Category | Nature | Flow | Amount (Example) | Target Entity |
  | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
  | 1 | Expense | Cash payment | Health | cash | outflow | 45 G | Medicine |

- **Financial Statement Flow:**
  - **Profit & Loss:** No change.
  - **Balance Sheet:** Assets (Vault Cash) decreases by (45) G. Lord's Equity decreases by (45) G.
  - **Cash Flow:** Operating Cash Flow (Outflow) decreases by (45) G. Net Cash decreases by (45) G.
- **Mermaid Flowchart:**

  ```mermaid
  graph LR
      Vault[Kingdom Vault Cash] -->|45 G Gold| Healer[Apothecary / Medicine]
  ```

#### 8. Repay Moneylender

- **Description:** Principal debt amortization payment made to a lender to reduce outstanding credit balance.
- **Database Payload(s):**

  | Leg | Type | Subtype | Category | Nature | Flow | Amount (Example) | Target Entity |
  | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
  | 1 | Debt | Amortization | Banking | cash | outflow | 250 G | CGD |
  | 2 | Debt | Amortization | Banking | accrual | outflow | 250 G | CGD |

- **Financial Statement Flow:**
  - **Profit & Loss:** No change (principal repayment does not affect income or expenses).
  - **Balance Sheet:** Assets (Vault Cash) decreases by (250) G. Liabilities (Debt) decreases by (250) G.
  - **Cash Flow:** Financing Cash Flow (Outflow) decreases by (250) G. Net Cash decreases by (250) G.
- **Mermaid Flowchart:**

  ```mermaid
  graph TD
      Vault[Kingdom Vault Cash] -->|Leg 1: 250 G Gold| Lender[CGD / Moneylender]
      Liab[Liabilities Ledger] -->|Leg 2: Accrual Reduction| Lender
  ```

#### 9. Moneylender Interest

- **Description:** Interest fees paid on outstanding loans to the Iron Bank or local moneylenders.
- **Database Payload(s):**

  | Leg | Type | Subtype | Category | Nature | Flow | Amount (Example) | Target Entity |
  | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
  | 1 | Debt | Interest | Banking | cash | outflow | 35 G | CGD |
  | 2 | Debt | Interest | Banking | accrual | outflow | 35 G | CGD |

- **Financial Statement Flow:**
  - **Profit & Loss:** Total Expenses increases by +35 G (interest is an accrued expense). Net Accrued Income decreases by (35) G.
  - **Balance Sheet:** Assets (Vault Cash) decreases by (35) G. Lord's Equity decreases by (35) G.
  - **Cash Flow:** Operating Cash Flow (Outflow) decreases by (35) G. Net Cash decreases by (35) G.
- **Mermaid Flowchart:**

  ```mermaid
  graph TD
      Vault[Kingdom Vault Cash] -->|Leg 1: 35 G Gold| Lender[CGD / Moneylender]
      Expense[Accrued Expenses] -->|Leg 2: Accrual Expense| Lender
  ```

---

### Complex Multi-Leg Macros

#### 10. Split Settlement (Partial Invoice)

- **Description:** Settling a portion of an outstanding invoice (Payable) with physical gold, while the rest remains open.
- **Database Payload(s):**

  | Leg | Type | Subtype | Category | Nature | Flow | Amount (Example) | Target Entity |
  | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
  | 1 | Expense | Cash payment | Markets | cash | outflow | 300 G | Blacksmith |
  | 2 | Payable | Amortization | Markets | accrual | inflow | 300 G | Blacksmith |

- **Financial Statement Flow:**
  - **Profit & Loss:** No change (the expense was already accrued when the initial Payable invoice was registered).
  - **Balance Sheet:** Assets (Vault Cash) decreases by (300) G. Liabilities (Payables) decreases by (300) G.
  - **Cash Flow:** Operating Cash Flow (Outflow) decreases by (300) G. Net Cash decreases by (300) G.
- **Mermaid Flowchart:**

  ```mermaid
  graph TD
      Vault[Kingdom Vault Cash] -->|Leg 1: 300 G Cash Outflow| Smith[Blacksmith]
      Payable[Outstanding Payables] -->|Leg 2: 300 G Accrual reduction| Smith
  ```

#### 11. Financed Asset Acquisition

- **Description:** Acquiring a large asset (e.g. a War Carriage) financed partially by cash and partially by a loan from the Iron Bank.
- **Database Payload(s):**

  | Leg | Type | Subtype | Category | Nature | Flow | Amount (Example) | Target Entity |
  | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
  | 1 | Expense | Cash payment | Equipment | cash | outflow | 400 G | Carriage Guild |
  | 2 | Debt | New Debt | Banking | accrual | inflow | 600 G | CGD |
  | 3 | Debt | New Debt | Banking | cash | inflow | 600 G | CGD |
  | 4 | Expense | Asset Purchase | Equipment | accrual | outflow | 1000 G | Carriage Guild |

- **Financial Statement Flow:**
  - **Profit & Loss:** Total Expenses increases by +1000 G (accrued cost of the asset). Net Accrued Income decreases by (1000) G.
  - **Balance Sheet:** Assets (Vault Cash) net change is +200 G (+600 G loan inflow, (400) G cash payment). Liabilities (Debt) increases by +600 G. Lord's Equity decreases by (400) G.
  - **Cash Flow:** Operating Cash Flow (Outflow) decreases by (400) G. Financing Cash Flow (Inflow) increases by +600 G. Net Cash increases by +200 G.
- **Mermaid Flowchart:**

  ```mermaid
  graph TD
      Lender[Iron Bank / CGD] -->|Leg 2 & 3: 600 G Loan| Vault[Kingdom Vault Cash]
      Vault -->|Leg 1: 400 G Cash Out| Guild[Carriage Guild]
      Expense[Asset Ledger] -->|Leg 4: 1000 G Accrual cost| Guild
  ```

#### 12. Merchant Advance (Unearned Revenue)

- **Description:** Receipt of gold coins in advance from a merchant guild for future deliveries of wheat from the royal fields.
- **Database Payload(s):**

  | Leg | Type | Subtype | Category | Nature | Flow | Amount (Example) | Target Entity |
  | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
  | 1 | Income | Unearned Revenue | Deferred | cash | inflow | 600 G | Merchant Guild |
  | 2 | Payable | Unearned Revenue | Deferred | accrual | outflow | 600 G | Merchant Guild |

- **Financial Statement Flow:**
  - **Profit & Loss:** No change (income is not recognized on the P&L until the wheat is delivered).
  - **Balance Sheet:** Assets (Vault Cash) increases by +600 G. Liabilities (Unearned Revenue Payable) increases by +600 G.
  - **Cash Flow:** Operating Cash Flow (Inflow) increases by +600 G. Net Cash increases by +600 G.
- **Mermaid Flowchart:**

  ```mermaid
  graph TD
      Merch[Merchant Guild] -->|Leg 1: 600 G Cash| Vault[Kingdom Vault Cash]
      Merch -->|Leg 2: 600 G Accrued Obligation| Unearned[Deferred Revenue / Payables]
  ```

#### 13. Payroll with Withholdings

- **Description:** Execution of royal guard payroll, where gross salary is recognized but some gold is withheld for taxes and guild duties.
- **Database Payload(s):**

  | Leg | Type | Subtype | Category | Nature | Flow | Amount (Example) | Target Entity |
  | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
  | 1 | Expense | Cash payment | Payroll | cash | outflow | 800 G | Royal Guards |
  | 2 | Expense | Gross Payroll | Payroll | accrual | outflow | 1000 G | Royal Guards |
  | 3 | Payable | Withholding Tax | Taxes | accrual | outflow | 200 G | Guild Collectors |

- **Financial Statement Flow:**
  - **Profit & Loss:** Total Expenses increases by +1000 G (gross payroll cost is recognized). Net Accrued Income decreases by (1000) G.
  - **Balance Sheet:** Assets (Vault Cash) decreases by (800) G. Liabilities (Tax Payables) increases by +200 G. Lord's Equity decreases by (1000) G.
  - **Cash Flow:** Operating Cash Flow (Outflow) decreases by (800) G. Net Cash decreases by (800) G.
- **Mermaid Flowchart:**

  ```mermaid
  graph TD
      Expense[Gross Payroll Ledger] -->|Leg 2: 1000 G| Guard[Royal Guards]
      Vault[Kingdom Vault Cash] -->|Leg 1: 800 G Cash Out| Guard
      Tax[Tax Payables Ledger] -->|Leg 3: 200 G Withheld| Guild[Guild Collectors]
  ```

---

## 3. Financial Statement Hooks

To calculate the values displayed on the dashboard, the consolidated financial statement engine must run query aggregates based on the following strict query mapping configurations:

### Balance Sheet

- **Assets - Vault Cash (Physical Gold)**
  - *SQL Filter:* `transaction_nature = 'cash' AND transaction_flow = 'inflow'` (positive) and `transaction_nature = 'cash' AND transaction_flow = 'outflow'` (negative).
  - *Calculation:* $\sum(\text{Amount}_{\text{inflow}}) - \sum(\text{Amount}_{\text{outflow}})$
- **Assets - Receivables (Tributes Due)**
  - *SQL Filter:* `transaction_type = 'Receivable' AND transaction_nature = 'accrual' AND payment_status = 'Pending'`
- **Liabilities - Debt (Iron Bank Loans)**
  - *SQL Filter:* `transaction_type = 'Debt' AND transaction_nature = 'accrual'`
  - *Calculation:* $\sum(\text{Amount}_{\text{inflow}}) - \sum(\text{Amount}_{\text{outflow}})$
- **Liabilities - Payables (Bills Owed)**
  - *SQL Filter:* `transaction_type = 'Payable' AND transaction_nature = 'accrual' AND payment_status = 'Pending'`

### Profit & Loss (Accrual Basis)

- **Total Revenues (Tributes & Stipends)**
  - *SQL Filter:* `transaction_type = 'Income' AND transaction_nature = 'accrual' AND transaction_flow = 'inflow'`
- **Total Operating Expenses (Goods, Smithing, Rent)**
  - *SQL Filter:* `transaction_type = 'Expense' AND transaction_nature = 'accrual' AND transaction_flow = 'outflow'`
- **Total Debt Service (Interest Accrued)**
  - *SQL Filter:* `transaction_type = 'Debt' AND transaction_subtype = 'Interest' AND transaction_nature = 'accrual'`

### Cash Flow (Cash Basis)

- **Operating Cash Flow**
  - *SQL Filter:* `transaction_nature = 'cash' AND transaction_type IN ('Income', 'Expense')`
- **Financing Cash Flow**
  - *SQL Filter:* `transaction_nature = 'cash' AND transaction_type = 'Debt'`
- **Investing Cash Flow**
  - *SQL Filter:* `transaction_nature = 'cash' AND transaction_type = 'Savings'`
