# **🏰 Eldoria Architecture Rulebook & Refactoring Guide**

**Version:** 2.0 (The Flat Matrix & 8-Digit COA Era) **Purpose:** This document is the absolute single source of truth for the Eldoria financial engine. All React components, Zustand stores, and database schemas MUST comply with the rules below.

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

### **Balance & Net Worth Calculations (Single-Pass)**

* **Total Assets:** Σ(Balances of all 1xxxxxxx accounts)  
* **Total Liabilities:** Σ(Balances of all 2xxxxxxx accounts)  
* **Net Worth:** Total Assets \- Total Liabilities  
* **Net Vault Cash (HUD Gold):** Σ(Balances of 1101xxxx, 1102xxxx, and 1103xxxx)

## **4\. Component Refactoring Directives**

When fixing legacy components, enforce these rules:

1. **Kill String-Parsing Hacks:** Remove any logic splitting strings by hyphens (name.split('-')). The Flat Matrix already separates Category and Entity.  
2. **Kill Cascading useEffect Race Conditions:** Do not use useEffect to clear child dropdowns when a parent changes. Clear child state variables explicitly inside the onChange event handler of the parent dropdown.  
3. **Kill LocalStorage Configurations:** Do not load or save taxonomy lists (classOptions, subClassOptions, etc.) to LocalStorage.  
4. **Preserve Custom UI:** Eldoria has a premium, medieval aesthetic. **DO NOT** alter Tailwind classes, layout grids, or color palettes unless explicitly instructed. Fix the plumbing, keep the paint.

## **5\. The "Surgical Refactor" Prompt Template**

*When using an AI assistant to fix a broken file, copy/paste this prompt along with the broken file and this Rulebook:*

**Act as a Principal React/Zustand Architect.** I need to fix a legacy component in my Eldoria application. It is currently broken because it is still using the old data structure.

**Attached Context:**

1. eldoria\_master\_rulebook.md (The architectural rules you MUST follow).  
2. \[BROKEN\_FILE\_NAME\].jsx (The legacy file to fix).  
3. useKingdomStore.js (How to fetch the flat matrix data).

**Your Task:** Refactor \[BROKEN\_FILE\_NAME\].jsx to strictly comply with the Rulebook.

* Strip out all old uni-directional mapping logic, hardcoded overrides, and string-parsing hacks.  
* Wire the component to consume the dim\_contas flat array and 8-digit COA system.  
* **CRITICAL:** Do NOT change my Tailwind layout, custom colors, or CSS. Preserve the exact visual aesthetic.

Please output the complete, production-ready refactored code.