# 🧪 Eldoria Sandbox Specification & Control Center

This document outlines the architecture, components, registry, and mock dataset configurations of the **Widget Sandbox Environment** in Eldoria.

---

## 1. Directory Structure

All sandbox files reside within the isolated development workspace:
*   [dashboard-widgets-sandbox.jsx](file:///c:/Users/silva/.gemini/antigravity/Medieval%20Stuff/client/src/components/sandbox/dashboard-widgets-sandbox.jsx): Staging workspace interface with viewport scale controls.
*   [sandboxRegistry.jsx](file:///c:/Users/silva/.gemini/antigravity/Medieval%20Stuff/client/src/components/sandbox/sandboxRegistry.jsx): Mount mapping registry associating widgets with metadata parameters.
*   [sandboxMockData.js](file:///c:/Users/silva/.gemini/antigravity/Medieval%20Stuff/client/src/components/sandbox/sandboxMockData.js): Deterministic Double-Entry generator supplying consistent mock ledgers.

---

## 2. Sandbox Components & Registry Details (`sandboxRegistry.jsx`)

The registry maps staged widgets to their categories and default layout dimensions.

### 2.1. System Staging Mockups
1.  **Default Test Card (`test_card`):** Base box structure confirming boundary layout and rendering integrity.
2.  **Aetheric Flux Regulator (`mana_regulator`):** Interactive widget tracking simulated core pressure capacities with venting and charging states.
3.  **Royal Decree Bulletin (`decree_widget`):** Text-based layout staging script scrolls.

### 2.2. Registered Chart Widgets (Double-Entry Injected)
*   **Income vs Expenses (`cash_flow_chart`):** Renders [CashFlowChart](file:///c:/Users/silva/.gemini/antigravity/Medieval%20Stuff/client/src/components/dashboard/CashFlowChart.jsx) graphing historical monthly revenue vs expense balances.
*   **Net Worth Trend (`net_worth_chart`):** Renders [NetWorthChart](file:///c:/Users/silva/.gemini/antigravity/Medieval%20Stuff/client/src/components/dashboard/NetWorthChart.jsx) tracking chronological asset growth curves.
*   **Asset Allocation (`asset_allocation_chart`):** Renders [AssetAllocationChart](file:///c:/Users/silva/.gemini/antigravity/Medieval%20Stuff/client/src/components/dashboard/AssetAllocationChart.jsx) breaking down holdings categories.

---

## 3. Dynamic Staging Canvas (`dashboard-widgets-sandbox.jsx`)

Provides an isolated environment for previewing and sizing widgets independently of the database state.

*   **Responsive Scaling:** Exposes buttons to simulate viewport boundaries on different client devices:
    *   `Full Width` (`w-full`)
    *   `Tablet` (`w-[768px]`)
    *   `Mobile` (`w-[375px]`)
*   **Preventing Height Collapse:** Wrapped inside a strict flexbox layout with an explicit container (`h-[450px]`) ensuring Recharts visualizations do not collapse during scale transformations.
*   **Ledger Injection:** Mounts registered components injecting `MOCK_TRANSACTIONS` as properties.

---

## 4. Deterministic Mock Ledger Generator (`sandboxMockData.js`)

Uses a Linear Congruential Generator (LCG) PRNG with seed `101` to supply exactly **100 chronological transaction entries** distributed evenly over 90 days.

### 4.1. Account Schema Layout
The mock database matches the strict Supabase schema definitions:
*   **Check Accounts (Asset class `1`):** `11010001` through `11010005`, `11020001` through `11020005` (Savings), `11030001` (Cash), sinking funds, and investments.
*   **Short & Long Term Debts (Liability class `2`):** `2101xxxx` (Credit Cards), `2102xxxx` (Personal Loans), `2103xxxx` (State Debts), and `2201xxxx` (Mortgage/Auto).
*   **Revenue Categories (Income class `7`):** `7101xxxx` (Payroll), `7102xxxx` (Freelance), and `7201xxxx`/`7202xxxx` (Refunds & Rewards).
*   **Disbursement Categories (Expense class `6`):** `6101xxxx` through `6903xxxx` housing rent, utilities, food, pet care, transport, insurance, taxes, and bank fees.

### 4.2. Transaction Entry Object Shape
```json
{
  "id": "123e4567-e89b-12d3-a456-000000000049", // Mock UUID sequence
  "profile_id": "8f1a4e10-9284-4861-b75a-35071165a254", // Static profile reference
  "created_at": "2026-07-20T12:00:00.000Z",
  "value_date": "2026-07-20",
  "posting_date": "2026-07-20",
  "payment_date": "2026-07-20",
  "year": 2026,
  "month": "July",
  "quarter": "Q3",
  "amount": 250.00,
  "source_account": "11010001",
  "target_account": "61010001",
  "type": "Expenses",
  "subtype": "Housing & Utilities",
  "entity": "Renda",
  "category": "Utilities",
  "flow": "outflow",
  "payment_status": "Completed",
  "origin": "sandbox",
  "description": "Mock ledger entry"
}
```
