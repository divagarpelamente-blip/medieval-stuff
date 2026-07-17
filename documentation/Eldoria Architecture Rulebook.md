# **🏰 Eldoria Architecture Rulebook & Refactoring Guide**

**Version:** 2.1 (Backend Scalability & Layout Fixes) **Purpose:** This document is the absolute single source of truth for the Eldoria financial engine. All React components, Zustand stores, and database schemas MUST comply with the rules below.

## **1\. The Core Paradigm: The Flat Matrix**

We have completely migrated away from nested, uni-directional mapping dictionaries, local storage caches for dropdowns, and "Smart Auto-Reconciliation" scripts.

**DO NOT** use, recreate, or reference legacy variables like typeToSubtypeMap, subtypeToCategoryMap, or entityMappings.

Our single source of truth for all account filtering, form validation, and dropdown population is the **Flat Matrix**, representing the dim\_contas table in Supabase.

### **The Data Shape (dim\_contas)**

Every account is a flattened object. The schema is strict:

{  
  "code": "11010001",                 // String (Exactly 8 digits)  
  "account\_name": "Checking Accounts CGD", // String  
  "type": "Assets",                   // String (Assets, Liabilities, Income, Expenses)  
  "subtype": "Liquid Assets",         // String  
  "category": "Checking Accounts",    // String  
  "entity": "CGD"                     // String  
}

### **Omni-Directional Filtering**

UI Dropdowns must derive their options by filtering this flat array (flatMatrix in Zustand) based on the user's current selections.

* **Top-Down:** If Type \= "Assets", filter to row.type \=== "Assets", map unique Subtypes.  
* **Middle-Out:** If Entity \= "CGD", filter to row.entity \=== "CGD", map unique Types.

## **2\. The 8-Digit Chart of Accounts (COA) Structure**

We use a strict 8-digit account coding system. Legacy 5-digit codes (e.g., 10101, 10104) are obsolete and must be ignored or purged.

The COA is divided into four primary prefixes:

* **1xxxxxxx (Assets):** Everything the Kingdom owns.  
  * 1101xxxx: Checking Accounts  
  * 1102xxxx: Savings & Wallets (Vaults)  
  * 1103xxxx: Cash (Physical)  
  * 1201xxxx / 1301xxxx / 1401xxxx: Sinking Funds, Investments, Real Estate.  
* **2xxxxxxx (Liabilities):** Everything the Kingdom owes.  
  * 2101xxxx: Credit Cards  
  * 2102xxxx: Personal Loans  
  * 2103xxxx: State Debts  
  * 2201xxxx: Long-Term Loans  
* **6xxxxxxx (Expenses):** Outflows.  
* **7xxxxxxx (Income):** Inflows.

## **3\. Double-Entry Mechanics & Business Logic**

The frontend transaction forms must orchestrate data using the following mathematical and double-entry rules. **No hardcoded if statements for specific banks (e.g., if (entity \=== 'CGD')) are allowed.** The system dynamically resolves targets using the Flat Matrix.

### **Transaction Flow Matrix**

Every transaction requires a base target\_account (resolved from the Matrix). Transfers or Debt payments also require a source\_dest\_bank.

| Transaction Type | Flow Direction | Mathematical Impact on Balances |
| :---- | :---- | :---- |
| **Income** (7xxxxxxx) | Inflow | Target Asset Balance \+ Amount |
| **Expense** (6xxxxxxx) | Outflow | Source Asset Balance \- Amount |
| **Transfer (Internal)** | Neutral | Source Asset \- Amount AND Target Asset \+ Amount |
| **New Loan (Debt)** | Inflow | Target Liability \+ Amount AND Source Asset \+ Amount |
| **Debt Payment** | Outflow | Target Liability \- Amount AND Source Asset \- Amount |

### **Balance & Net Worth Calculations (Server-Side Aggregation)**
To ensure maximum scalability (10,000+ transactions), global financial metrics must **never** be calculated by iterating over local arrays in the browser. 
* **Backend RPCs:** All top-level HUD metrics are calculated directly on the PostgreSQL server via Supabase RPCs (e.g., `get_dashboard_metrics`).
* **The Math (Executed by DB):**
  * **Total Assets:** Σ(Balances of all 1xxxxxxx accounts)
  * **Total Liabilities:** Σ(Balances of all 2xxxxxxx accounts)
  * **Net Worth:** Total Assets - Total Liabilities
  * **Net Vault Cash (HUD Gold):** Σ(Balances of 1101xxxx, 1102xxxx, and 1103xxxx)
* **Optimistic Syncing:** When a transaction is added, updated, or deleted, the frontend must silently re-invoke the RPC (`fetchDashboardMetrics()`) to keep the UI perfectly synchronized with the server.

### **Transaction Mutations & State Synchronization**

* **Adding Transactions:** Executed via `addTransaction(payload)` in `useKingdomStore`. Inserts a new record and prepends it to the ledger state.
* **Editing Transactions:** Managed dynamically in the UI form using an `editingId` to toggle edit/update mode. Invokes `updateTransaction(id, payload)` to update the record in Supabase and sync the local store state.
* **Deleting Transactions:** Executed via `deleteTransaction(id)` in `useKingdomStore`. Safely removes the transaction record from both Supabase and the active ledger array.
* **Profile Balance Hook:** When any transaction is added, updated, or deleted, corresponding gold and XP updates are synchronized to the player profile.

### **Data Chunking & Ledger Queries**
* **Strict Pagination:** The frontend must never fetch the entire `transactions` table into memory. All ledger queries must implement chunking (Limit and Offset) via `fetchTransactions(limit, offset)`.
* **Server-Side Filtering:** Text searches and category filters must be passed to Supabase as query parameters (e.g., `.ilike()`) rather than filtering a massive array locally in React.


## 4. UI Constraints & The "Modern Dashboard" Layout

* **Aesthetics:** We use Tailwind CSS to create a premium, dark, medieval-fantasy aesthetic. Use deep browns, golds (`#ffd700`), dark stones, and high-contrast borders. **Never** remove existing Tailwind classes unless explicitly instructed; always fix the logic but preserve the paint.
* **The Single-File Mandate:** For rapid prototyping, all React components, layout, and logic requested must be output into a single, self-contained React file. DO NOT generate TypeScript (.ts or .tsx).
* **Strict Layout (The "Modern Dashboard"):** The web app screen size must NEVER stretch or collapse based on content. It must permanently obey these constraints:
* **Outer Void:** Exactly 100% width and dynamic viewport height (`w-full h-dvh bg-black flex justify-center overflow-hidden`).
  * **Inner Canvas:** Exactly 100% height of the void, up to a maximum of 1280px wide, perfectly centered (`relative w-full max-w-7xl h-full mx-auto ...`).
  * **Do not remove these wrappers** or modify their structural flex/height classes.

### **The Reusable Modal System**

To preserve the cinematic medieval atmosphere and maintain codebase cleanliness, we use a structured, layered Modal pattern:

* **Universal Frame (Modal.jsx):** Provides an atmospheric stone-board container (`bg-stone-950 border-2 border-amber-900/50`) complete with a medieval header, emoji icon support, tracking-widest uppercase title, subtitle, and a circular red close button. 
  * **Strict Flex Scrolling:** The outer wrapper must use `flex flex-col max-h-full`. The header must use `shrink-0`. The body area must use `min-h-0 overflow-y-auto scrollbar-thin` to guarantee perfect internal scrolling without squishing headers or breaking viewport bounds.
* **Horizontal Tabbed Navigation ([ModalTabmenus.jsx](file:///c:/Users/silva/.gemini/antigravity/Medieval%20Stuff/client/src/components/Modals/ModalTabmenus.jsx)):** Wraps the universal frame and renders a scrollable horizontal tab bar (`border-b border-amber-900/30`) to switch sub-panels dynamically (e.g., Profile vs. Preferences).
* **Vertical Action Lists ([ModalSubmenus.jsx](file:///c:/Users/silva/.gemini/antigravity/Medieval%20Stuff/client/src/components/Modals/ModalSubmenus.jsx)):** Wraps the universal frame and renders uniform, list-style navigation buttons with hover scales (`hover:border-amber-700/80 hover:bg-stone-800`) for menu-driven routing.
* **Modular View Controllers:** Files like [TreasuryController.jsx](file:///c:/Users/silva/.gemini/antigravity/Medieval%20Stuff/client/src/components/Modals/TreasuryController.jsx) and [SettingsController.jsx](file:///c:/Users/silva/.gemini/antigravity/Medieval%20Stuff/client/src/components/Modals/SettingsController.jsx) manage view state transitions independently, decoupling business flow from the layout rendering code.

### **Dashboards vs. Ledgers (Structural Purpose)**
* **The Treasury Dashboard (Analytics):** A read-only, visual command center. Uses CSS grids to display Server-Side HUD Metrics and Charting Widgets (Recharts/Chart.js). No raw transaction tables or data-entry forms belong here.
* **The General Ledger (Operations):** The operational workspace. Divided into an Archive Panel (paginated data tables, search filters) and a Terminal Form (double-entry logging, editing).

## 5. Component Refactoring Directives

When fixing legacy components, enforce these rules:

1. **Kill String-Parsing Hacks:** Remove any logic splitting strings by hyphens (name.split('-')). The Flat Matrix already separates Category and Entity.  
2. **Kill Cascading useEffect Race Conditions:** Do not use useEffect to clear child dropdowns when a parent changes. Clear child state variables explicitly inside the onChange event handler of the parent dropdown.  
3. **Kill LocalStorage Configurations:** Do not load or save taxonomy lists (classOptions, subClassOptions, etc.) to LocalStorage.  
4. **Preserve Custom UI:** Eldoria has a premium, medieval aesthetic. **DO NOT** alter Tailwind classes, layout grids, or color palettes unless explicitly instructed. Fix the plumbing, keep the paint.

## 6. The "Surgical Refactor" Prompt Template

*When using an AI assistant to fix a broken file, copy/paste this prompt along with the broken file and this Rulebook:*

**Act as a Principal React/Zustand Architect.** I need to fix a legacy component in my Eldoria application. It is currently broken because it is still using the old data structure.

**Attached Context:**

1. eldoria_master_rulebook.md (The architectural rules you MUST follow).  
2. \[BROKEN_FILE_NAME\].jsx (The legacy file to fix).  
3. useKingdomStore.js (How to fetch the flat matrix data).

**Your Task:** Refactor \[BROKEN_FILE_NAME\].jsx to strictly comply with the Rulebook.

* Strip out all old uni-directional mapping logic, hardcoded overrides, and string-parsing hacks.  
* Wire the component to consume the dim_contas flat array and 8-digit COA system.  
* **CRITICAL:** Do NOT change my Tailwind layout, custom colors, or CSS. Preserve the exact visual aesthetic.

Please output the complete, production-ready refactored code.