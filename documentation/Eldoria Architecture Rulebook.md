# **🏰 Eldoria Architecture Rulebook & Refactoring Guide**

**Version:** 2.2 (Domain-Driven Design, Left-Side Sidebar, and Cache Safeguards)  
**Purpose:** This document is the absolute single source of truth for the Eldoria financial engine. All React components, Zustand stores, and database schemas MUST comply with the rules below.

---

## **1. The Core Paradigm: The Flat Matrix**

We have completely migrated away from nested, uni-directional mapping dictionaries, local storage caches for dropdowns, and "Smart Auto-Reconciliation" scripts.

**DO NOT** use, recreate, or reference legacy variables like `typeToSubtypeMap`, `subtypeToCategoryMap`, or `entityMappings`.

Our single source of truth for all account filtering, form validation, and dropdown population is the **Flat Matrix**, representing the `dim_contas` table in Supabase.

### **The Data Shape (dim_contas)**

Every account is a flattened object. The schema is strict:

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

### **Omni-Directional Filtering**

UI Dropdowns must derive their options by filtering this flat array (`flatMatrix` in Zustand) based on the user's current selections.

* **Top-Down:** If Type = "Assets", filter to `row.type === "Assets"`, map unique Subtypes.  
* **Middle-Out:** If Entity = "CGD", filter to `row.entity === "CGD"`, map unique Types.

---

## **2. The 8-Digit Chart of Accounts (COA) Structure**

We use a strict 8-digit account coding system. Legacy 5-digit codes (e.g., 10101, 10104) are obsolete and must be ignored or purged.

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

The frontend transaction forms must orchestrate data using the following mathematical and double-entry rules. **No hardcoded if statements for specific banks (e.g., if (entity === 'CGD')) are allowed.** The system dynamically resolves targets using the Flat Matrix.

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

### **Ledger Data Constraints**

* **Strict Pagination:** The frontend must never fetch the entire `transactions` table into memory. All ledger queries must implement chunking (Limit and Offset) via `fetchTransactions(limit, offset)`.
* **Server-Side Filtering:** Text searches and category filters must be passed to Supabase as query parameters (e.g., `.ilike()`) rather than filtering a massive array locally in React.

### **Intelligent Hydration & Cache Merging**

* **Default Structure Protection:** During layout hydration (`hydrateLayouts`), the store must safeguard hardcoded tabs from stale client/database cache overrides.
* **Merge Strategy:** The system must map the `INITIAL_SUBMENUS` defaults first, overlaying user modifications (custom name, visibility toggles) from database profiles (`dashboard_layouts` payload) only when matching IDs are present. Missing or newly introduced default tabs must remain active and fully visible.
* **Active Tab Resolution:** If the active tab state becomes corrupted or maps to an invisible/legacy tab, the system must cleanly default active focus to `'insights'`.

---

## **4. UI Constraints & The "Modern Dashboard" Layout**

* **Aesthetics:** We use Tailwind CSS to create a premium, dark, medieval-fantasy aesthetic. Use deep browns, golds (`#ffd700`), dark stones, and high-contrast borders. **Never** remove existing Tailwind classes unless explicitly instructed; always fix the logic but preserve the paint.
* **The Single-File Mandate:** For rapid prototyping, all React components, layout, and logic requested must be output into a single, self-contained React file. DO NOT generate TypeScript (.ts or .tsx).
* **Strict Layout (The "Modern Dashboard"):** The web app screen size must NEVER stretch or collapse based on content. It must permanently obey these constraints:
  * **Outer Void:** Exactly 100% width and dynamic viewport height (`w-full h-dvh bg-black flex justify-center overflow-hidden`).
  * **Inner Canvas:** Exactly 100% height of the void, up to a maximum of 1280px wide, perfectly centered (`relative w-full max-w-7xl h-full mx-auto ...`).
  * **Do not remove these wrappers** or modify their structural flex/height classes.

### **The Left-Side Sandbox Panel**

The sandbox sidebar control center mounts on the left side of the dashboard layout to preserve ergonomic workflows.

* **DOM Mounting Order:** The `<aside>` panel representing the `SettingsSidebar` must be rendered *first* within the flexible containment container.
* **Responsive Layout:**
  * **Mobile/Compact:** Rendered as an absolute drawer overlaying the screen on the left (`absolute inset-y-0 left-0 z-40`). When hidden, it translates off-screen via `-translate-x-full`.
  * **Desktop:** Rendered as a relative, fluid layout block (`lg:relative lg:translate-x-0`).
* **Border Aesthetics:** Use a right-hand border (`border-r border-amber-900/40`) to separate the control center panel from the main grid canvas.

### **The Accordion Control Panel**

To manage workspace options cleanly without layout bloat, the control panel uses a uniform **Accordion** model.

* **Section Segregation:** Options are divided into distinct headers: Active Ledgers, Grid Preset Blueprints, and Widget Manifest.
* **State Control:** Controlled via `activeSection` (`'ledgers' | 'presets' | 'widgets' | null`), showing `[+ EXPAND]` or `[- COLLAPSE]` toggles. Selecting one section automatically collapses other panels to reduce scrolling.

### **Protected Tabs visibility rules**

Core system tabs are protected to safeguard essential layouts.

* **Protection Map:** The `insights` and `tab_1` (Royal Treasury) ledger submenus are marked protected (`isProtected = true`).
* **Rule Constraints:** Visibility toggle buttons (`Eye`/`EyeOff`) and deletion options must be completely hidden for protected tabs to prevent users from rendering critical workspaces unreachable.

### **Domain-Driven Design (DDD) Widget Registry**

Widgets are decoupled into domains (e.g. `treasuryRegistry.js` exposing `TREASURY_WIDGETS`) rather than global generic files.

* **Metadata Properties:** Each widget registry entry must define a domain and structural category:

  ```javascript
  cash_flow_chart: {
    id: 'cash_flow_chart',
    name: 'Treasury Cash Flow Curve',
    component: CashFlowChart,
    domain: 'treasury',
    category: 'chart', // 'overview' | 'chart' | 'ledger'
    layout: { w: 5, h: 3, minW: 3, maxW: 12, minH: 2, maxH: 6 }
  }
  ```

* **Sidebar Category Filters:** Sidebar widget menus must expose category/division filters (e.g., Overview, Analytical Curves, Ledger Breakdowns) matching these metadata records.
* **Deployment Visuals:** Widgets display in lists showing metadata footprint details (e.g. `5x3`) and a visual action preview trigger on the right side containing a quick deploy Plus (`+`) button.

---

## **5. Component Refactoring Directives**

When fixing legacy components, enforce these rules:

1. **Kill String-Parsing Hacks:** Remove any logic splitting strings by hyphens (`name.split('-')`). The Flat Matrix already separates Category and Entity.  
2. **Kill Cascading useEffect Race Conditions:** Do not use `useEffect` to clear child dropdowns when a parent changes. Clear child state variables explicitly inside the `onChange` event handler of the parent dropdown.  
3. **Kill LocalStorage Configurations:** Do not load or save taxonomy lists (`classOptions`, `subClassOptions`, etc.) to LocalStorage.  
4. **Preserve Custom UI:** Eldoria has a premium, medieval aesthetic. **DO NOT** alter Tailwind classes, layout grids, or color palettes unless explicitly instructed. Fix the plumbing, keep the paint.

---

## **6. The "Surgical Refactor" Prompt Template**

*When using an AI assistant to fix a broken file, copy/paste this prompt along with the broken file and this Rulebook:*

> **Act as a Principal React/Zustand Architect.** I need to fix a legacy component in my Eldoria application. It is currently broken because it is still using the old data structure.
>
> **Attached Context:**
>
> 1. `Eldoria Architecture Rulebook.md` (The architectural rules you MUST follow).  
> 2. `[BROKEN_FILE_NAME].jsx` (The legacy file to fix).  
> 3. `useKingdomStore.js` (How to fetch the flat matrix data).
>
> **Your Task:** Refactor `[BROKEN_FILE_NAME].jsx` to strictly comply with the Rulebook.
>
> * Strip out all old uni-directional mapping logic, hardcoded overrides, and string-parsing hacks.  
> * Wire the component to consume the `dim_contas` flat array and 8-digit COA system.  
> * **CRITICAL:** Do NOT change my Tailwind layout, custom colors, or CSS. Preserve the exact visual aesthetic.
>
> Please output the complete, production-ready refactored code.

---

## **7. Primary Workspace Files & Functionality**

The following table documents primary files in the workspace along with their functional descriptions within the Eldoria ecosystem:

### **Root & Configuration Files**

| File Name | Description |
| :--- | :--- |
| [package.json](file:///c:/Users/silva/.gemini/antigravity/Medieval%20Stuff/client/package.json) | Manages application metadata, scripts (like `npm run dev`), and dependencies. |
| [vite.config.js](file:///c:/Users/silva/.gemini/antigravity/Medieval%20Stuff/client/vite.config.js) | Configures Vite dev server parameters, build settings, and plugins. |
| [tailwind.config.js](file:///c:/Users/silva/.gemini/antigravity/Medieval%20Stuff/client/tailwind.config.js) | Custom theme configuration, extensions, and color definitions. |
| [SANDBOX_GUIDE.md](file:///c:/Users/silva/.gemini/antigravity/Medieval%20Stuff/SANDBOX_GUIDE.md) | Guide outlining instructions for navigating and running sandbox environments. |

### **Store & Application Entry**

| File Name | Description |
| :--- | :--- |
| [App.jsx](file:///c:/Users/silva/.gemini/antigravity/Medieval%20Stuff/client/src/App.jsx) | Root React component managing routing and screen toggling (Login, Main Menu, Isometric Map, Dashboard Sandbox). |
| [main.jsx](file:///c:/Users/silva/.gemini/antigravity/Medieval%20Stuff/client/src/main.jsx) | Entry point that renders the `App` component into the DOM. |
| [index.css](file:///c:/Users/silva/.gemini/antigravity/Medieval%20Stuff/client/src/index.css) | Global styling file integrating Tailwind CSS directives and custom scrollbars. |
| [useDashboardStore.js](file:///c:/Users/silva/.gemini/antigravity/Medieval%20Stuff/client/src/store/useDashboardStore.js) | Zustand store managing dashboard grids, editing/saving layouts, active submenus, and Supabase synchronization. |
| [useKingdomStore.js](file:///c:/Users/silva/.gemini/antigravity/Medieval%20Stuff/client/src/store/useKingdomStore.js) | Zustand store holding general kingdom states (user profile details, Supabase client reference, active tabs). |

### **Sandbox Containers**

| File Name | Description |
| :--- | :--- |
| [DashboardSandbox.jsx](file:///c:/Users/silva/.gemini/antigravity/Medieval%20Stuff/client/src/components/sandbox/DashboardSandbox.jsx) | Sandbox workspace wrapper that binds the Dashboard Canvas, Settings Sidebar, and Header. |
| [MainMenuSandbox.jsx](file:///c:/Users/silva/.gemini/antigravity/Medieval%20Stuff/client/src/components/sandbox/MainMenuSandbox.jsx) | Main menu interface directing users to medieval modules (Ledger, Treasury, Map, Settings, Dashboard). |

### **Dashboard Components**

| File Name | Description |
| :--- | :--- |
| [DashboardCanvas.jsx](file:///c:/Users/silva/.gemini/antigravity/Medieval%20Stuff/client/src/components/dashboard/DashboardCanvas.jsx) | Workspace grid rendering deployed charts with resize and drag-and-drop actions. |
| [SettingsSidebar.jsx](file:///c:/Users/silva/.gemini/antigravity/Medieval%20Stuff/client/src/components/dashboard/SettingsSidebar.jsx) | Customization sidebar managing visible ledgers, preset grids, and widget deployments. |
| [DashboardHeader.jsx](file:///c:/Users/silva/.gemini/antigravity/Medieval%20Stuff/client/src/components/dashboard/DashboardHeader.jsx) | Top bar containing Edit, Save/Cancel, and Exit options for the sandbox. |
| [treasuryRegistry.js](file:///c:/Users/silva/.gemini/antigravity/Medieval%20Stuff/client/src/components/dashboard/treasuryRegistry.js) | Maps chart widget identifiers to React components, layout boundaries, and DDD domains. |
| [CashFlowChart.jsx](file:///c:/Users/silva/.gemini/antigravity/Medieval%20Stuff/client/src/components/dashboard/CashFlowChart.jsx) | Line graph widget displaying the influx and outflow curves of treasury gold. |
| [NetWorthChart.jsx](file:///c:/Users/silva/.gemini/antigravity/Medieval%20Stuff/client/src/components/dashboard/NetWorthChart.jsx) | Bar/area trend widget mapping overall treasury reserves and historical net balance. |
| [AssetAllocationChart.jsx](file:///c:/Users/silva/.gemini/antigravity/Medieval%20Stuff/client/src/components/dashboard/AssetAllocationChart.jsx) | Pie/donut breakdown charting gold allocation across accounts. |

### **Medieval Map & Modals**

| File Name | Description |
| :--- | :--- |
| [IsometricMap.jsx](file:///c:/Users/silva/.gemini/antigravity/Medieval%20Stuff/client/src/components/common/IsometricMap.jsx) | Interactive game screen mapping town zones (Huts, Townhall, Guild, Tavern, Treasury) to modal views. |
| [HUD.jsx](file:///c:/Users/silva/.gemini/antigravity/Medieval%20Stuff/client/src/components/common/HUD.jsx) | Top Heads-Up Display showing user stats (coins, profile title) during gameplay. |
| [BottomNav.jsx](file:///c:/Users/silva/.gemini/antigravity/Medieval%20Stuff/client/src/components/common/BottomNav.jsx) | Bottom hotbar for quickly jumping to modals on the map. |
| [Modal.jsx](file:///c:/Users/silva/.gemini/antigravity/Medieval%20Stuff/client/src/components/Modals/Modal.jsx) | Parchment container overlay template for all dialog views. |
| [LedgerModal.jsx](file:///c:/Users/silva/.gemini/antigravity/Medieval%20Stuff/client/src/components/Modals/LedgerModal.jsx) | Ledger module overlay for checking transaction tables. |
| [TreasuryController.jsx](file:///c:/Users/silva/.gemini/antigravity/Medieval%20Stuff/client/src/components/Modals/TreasuryController.jsx) | Vault statistics overlay detailing holdings, assets, and vaults. |
| [SettingsController.jsx](file:///c:/Users/silva/.gemini/antigravity/Medieval%20Stuff/client/src/components/Modals/SettingsController.jsx) | Settings menu overlay mapping profiles, database controls, and options. |

### **Hooks, Utilities, & Localization**

| File Name | Description |
| :--- | :--- |
| [dashboard.config.js](file:///c:/Users/silva/.gemini/antigravity/Medieval%20Stuff/client/src/config/dashboard.config.js) | Houses dashboard constants (e.g., maximum widgets per tab, initial layout coordinates). |
| [useDashboardData.js](file:///c:/Users/silva/.gemini/antigravity/Medieval%20Stuff/client/src/hooks/useDashboardData.js) | Custom React hook parsing raw Supabase ledger tables into formatted statistics. |
| [supabaseClient.js](file:///c:/Users/silva/.gemini/antigravity/Medieval%20Stuff/client/src/lib/supabaseClient.js) | Initializes Supabase connection using active environment keys. |
| [chartAnalytics.js](file:///c:/Users/silva/.gemini/antigravity/Medieval%20Stuff/client/src/utils/chartAnalytics.js) | Mathematical logic for aggregating historical cash trends and allocation metrics. |
| [locales/](file:///c:/Users/silva/.gemini/antigravity/Medieval%20Stuff/client/src/utils/locales/) | Directory containing internationalization translation maps (`en`, `de`, `es`, `fr`, `pt-BR`). |
