# **🏰 Eldoria Architecture Rulebook & Refactoring Guide**

**Version:** 3.0 (Server-Side Database Views, Optimistic UI, and Edge Function Gamification)  
**Purpose:** This document is the absolute single source of truth for the Eldoria financial engine. All React components, Zustand stores, and database schemas MUST comply with the rules below.

---

## **1. The Core Paradigm: The Flat Matrix & Server-Side Views**

We have completely migrated away from heavy client-side aggregation loops over transaction arrays. All analytical metrics and charts consume pre-aggregated database views or server-side RPC metrics.

### **The Data Shape (dim_contas)**

Every account is a flattened object representing the `dim_contas` table in Supabase:

```json
{  
  "code": "11010001",                 // String (Exactly 8 digits)  
  "account_name": "Checking Accounts CGD", // String  
  "type": "Assets",                   // String (Assets, Liabilities, Income, Expenses)  
  "subtype": "Liquid Assets",         // String  
  "category": "Checking Accounts",    // String  
  "entity": "CGD"                     // String  
}
```

### **The Database Views (vw_*)**

To prevent frontend performance lag under heavy transaction loads, chart aggregations must consume the following optimized views:
* **`vw_monthly_analytics`**: Grouped monthly total sums of Inflows and Outflows.
* **`vw_cumulative_trends`**: Running historical totals of Assets, Liabilities, and Net Worth.
* **`vw_category_balances`**: Summed volumes of target categories for distribution analysis.
* **`vw_entity_exposure`**: Aggregated concentration volumes grouped by counterparty.
* **`vw_daily_analytics`**: Daily aggregated transaction patterns.

---

## **2. The 8-Digit Chart of Accounts (COA) Structure**

We use a strict 8-digit account coding system. Legacy codes are obsolete.

The COA is divided into four primary prefixes:

* **1xxxxxxx (Assets):** Everything the Kingdom owns.  
  * `1101xxxx`: Checking Accounts  
  * `1102xxxx`: Savings & Wallets (Vaults)  
  * `1103xxxx`: Cash (Physical)  
  * `1201xxxx` / `1301xxxx` / `1401xxxx`: Sinking Funds, Investments, Real Estate.  
* **2xxxxxxx (Liabilities):** Everything the Kingdom owes.  
  * `2101xxxx`: Credit Cards  
  * `2102xxxx`: Personal Loans  
  * `2103xxxx`: State Debts  
  * `2201xxxx`: Long-Term Loans  
* **6xxxxxxx (Expenses):** Outflows.  
* **7xxxxxxx (Income):** Inflows.

---

## **3. Double-Entry Mechanics & Business Logic**

The frontend transaction forms must orchestrate data using the following mathematical and double-entry rules:

### **Transaction Flow Matrix**

Every transaction requires a base `target_account` (resolved from the Matrix). Transfers or Debt payments also require a `source_dest_bank`.

| Transaction Type | Flow Direction | Mathematical Impact on Balances |
| :--- | :--- | :--- |
| **Income** (7xxxxxxx) | Inflow | Target Asset Balance + Amount |
| **Expense** (6xxxxxxx) | Outflow | Source Asset Balance - Amount |
| **Transfer (Internal)** | Neutral | Source Asset - Amount AND Target Asset + Amount |
| **New Loan (Debt)** | Inflow | Target Liability + Amount AND Source Asset + Amount |
| **Debt Payment** | Outflow | Target Liability - Amount AND Source Asset - Amount |

### **Balance & Net Worth Calculations (Server-Side Aggregation)**

Global financial metrics must **never** be calculated by iterating over local arrays in the browser.

* **Backend RPCs & Views**: All top-level HUD metrics are calculated directly on the PostgreSQL server via Supabase RPCs (e.g., `get_dashboard_metrics` or analytical views).
* **Optimistic Syncing**: When a transaction is added, updated, or deleted, the frontend must immediately trigger a non-blocking background fetch of the RPC and views (`fetchDashboardMetrics()` and `fetchAnalytics()`) to keep the UI perfectly synchronized.

### **Transaction Mutations & State Synchronization (Optimistic UI)**

To ensure a seamless user experience, write operations must implement Optimistic UI updates:

* **Adding Transactions**:
  1. Generate a temporary ID: `const tempId = 'temp-' + Date.now()`.
  2. Prepend the transaction locally in Zustand state instantly.
  3. Send request to Supabase.
  4. On response, swap out the temporary ID with the real database record ID.
* **Deleting Transactions**:
  1. Store a backup of current transactions.
  2. Remove the target transaction locally in Zustand state instantly.
  3. Send delete request to Supabase.
  4. Revert to the backup if the server request fails.

### **Ledger Data Constraints**

* **Strict Pagination**: All ledger queries must implement chunking via `fetchTransactions(limit, offset)`.
* **Server-Side Filtering**: Text searches and category filters must be passed to Supabase as query parameters rather than filtering a massive array locally in React.
* **Type Normalization**: Ensure transaction types are normalized before db transmission (e.g., mapping `'expenses'` to `'Expenses'` to satisfy postgres check constraints).

---

## **4. UI Constraints & The "Modern Dashboard" Layout**

* **Tailwind & CSS Preserves**: Eldoria uses a dark, medieval-fantasy aesthetic with golds, deep browns, and custom scrollbars. Do not alter Tailwind styles unless specifically requested.
* **Modern Dashboard Container bounds**:
  * **Outer Void**: Exactly 100% width and dynamic viewport height (`w-full h-dvh bg-black flex justify-center overflow-hidden`).
  * **Inner Canvas**: Exactly 100% height of the void, up to a maximum of 1280px wide, perfectly centered (`relative w-full max-w-7xl h-full mx-auto ...`).
* **Settings Sidebar**: Left-side accordion menu (`SettingsSidebar.jsx`) mounts first inside the flex containment container. Responsive drawer on mobile/compact screen scopes.

---

## **5. Server-Side Gamification & Edge Functions**

Gamification updates (Ouro, XP, Levels) are processed securely in the background:

* **Supabase Webhooks**: Configured to capture new insertions into the `transactions` table.
* **Edge Functions**: A Deno Edge Function (`process-gamification`) handles calculations server-side, verifying data, calculating modifiers, and securely updating profiles via the `increment_gamification_stats` RPC using an admin key.


