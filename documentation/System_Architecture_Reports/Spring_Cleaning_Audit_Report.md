# Spring Cleaning Audit Report: Eldoria Codebase

This report provides a read-only architectural scan and audit of the **Eldoria** codebase to prepare for Phase 1 of the codebase clean-up.

---

## 1. 📦 Dependency Audit

Cross-referencing `package.json` against all active imports in the `client/src` directory:

| Package | Status / Audit Findings | Classification |
|---|---|---|
| `@supabase/supabase-js` | **Safe**. Core client driver for Supabase integration. | Required |
| `zustand` | **Safe**. Core runtime store management (`useKingdomStore.js`). | Required |
| `i18next` | **Safe**. Core localization orchestration. | Required |
| `react-i18next` | **Safe**. React integration/provider hooks for locales. | Required |
| `i18next-browser-languagedetector` | **Safe**. Detects user-selected locale settings. | Required |
| `@tailwindcss/postcss` | **Safe**. Tailwind CSS v4 processor. | Required |
| `tailwindcss` | **Safe**. Tailwind v4 framework engine. | Required |
| `lucide-react` | **Safe**. Icons used in `Modal.jsx` and `BottomNav.jsx`. | Required |
| `react-hot-toast` | **Safe**. Toast popup feedback notifications. | Required |
| `react` & `react-dom` | **Safe**. Core React engine. | Required |

### Findings:
* **No Unused Dependencies**: All packages listed in `dependencies` are actively imported.
* **Underutilized DevDependencies**: Development packages like `eslint` and `@types/react` are ready for compile-time/development checks but not bundled in production.

---

## 2. ⚙️ Vite Configuration Check

Review of `vite.config.js`:

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    open: 'msedge'
  }
})
```

### Findings:
* **Relative Base Path Check**: `base: './'` is **successfully set**. This ensures relative URLs resolve correctly under sandbox instances (like DBAR) and subdirectory routers.
* **Redundant Configuration**: None. The config is extremely clean, lightweight, and lacks legacy aliases or dead plugin loads.

---

## 3. 🧹 Dead Code & Orphans (client/src)

### A. Orphaned / Unused Components
* **`client/src/components/RegisterTransactionBackup.jsx`**: **[FLAGGED FOR PRUNING]**. This is a backup file left behind during form refactoring. It is never imported anywhere in the project.

### B. "English-First" Localization Protection (i18n.js)
* **Status**: **Safe / Protected**. 
* **Details**: The commented-out secondary language imports (`ptBR`, `fr`, `es`, `de`) on lines 6-10 of `client/src/i18n.js` are protected under the system's "English-first" lockdown architecture. They must **not** be flagged as dead code or deleted, as they preserve the structure for future translations.

---

## 4. 🧩 Hooks & State Optimization Opportunities

We identified significant fragmentation in state synchronization hooks across multiple files.

### Fragmentation Findings:
In `App.jsx`, `useQuickActionForm.js`, and `useManualTransactionForm.js`, there are up to 12 separate `useEffect` blocks executing simple value check-and-resets.

*Example from `App.jsx`:*
```javascript
  useEffect(() => {
    if (txFrom !== '' && fromOptions && !fromOptions.includes(txFrom)) {
      setTxFrom(fromOptions[0] || '');
    }
  }, [fromOptions, txFrom]);

  useEffect(() => {
    if (txStatus !== '' && statusOptions && !statusOptions.includes(txStatus)) {
      setTxStatus(statusOptions[0] || '');
    }
  }, [statusOptions, txStatus]);
```

### Optimization Proposal:
Consolidate these fragmented hooks into a single unified synchronization `useEffect` inside each file. This reduces React's internal scheduler registration overhead and simplifies readability:

```javascript
  useEffect(() => {
    if (txFrom !== '' && fromOptions && !fromOptions.includes(txFrom)) setTxFrom(fromOptions[0] || '');
    if (txStatus !== '' && statusOptions && !statusOptions.includes(txStatus)) setTxStatus(statusOptions[0] || '');
    if (txClass !== '' && classOptions && !classOptions.includes(txClass)) setTxClass(classOptions[0] || '');
    if (txSubClass !== '' && subClassOptions && !subClassOptions.includes(txSubClass)) setTxSubClass(subClassOptions[0] || '');
    if (txEntity !== '' && entityOptions && !entityOptions.includes(txEntity)) setTxEntity(entityOptions[0] || '');
    if (txCategory !== '' && categoryOptions && !categoryOptions.includes(txCategory)) setTxCategory(categoryOptions[0] || '');
  }, [fromOptions, statusOptions, classOptions, subClassOptions, entityOptions, categoryOptions, txFrom, txStatus, txClass, txSubClass, txEntity, txCategory]);
```
