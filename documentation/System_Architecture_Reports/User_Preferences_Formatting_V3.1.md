# User Preferences & Formatting Engine (Eldoria V3.1)

## 1. Database Schema Extension (User Settings)

To persist formatting preferences globally across sessions and devices, the user profile table in Supabase requires an extension. 

### DDL SQL Script

```sql
-- 1. Extend the existing profiles (or user_settings) table
ALTER TABLE public.profiles
ADD COLUMN date_format VARCHAR(12) DEFAULT 'YYYY-MM-DD',
ADD COLUMN number_format VARCHAR(2) DEFAULT 'EU',
ADD COLUMN currency_symbol VARCHAR(5) DEFAULT '€';

-- 2. Add Constraint Checks for Data Integrity
ALTER TABLE public.profiles
ADD CONSTRAINT chk_date_format 
CHECK (date_format IN ('YYYY-MM-DD', 'MM/DD/YYYY', 'DD/MM/YYYY'));

ALTER TABLE public.profiles
ADD CONSTRAINT chk_number_format 
CHECK (number_format IN ('US', 'EU'));

-- 3. Create or replace an RPC or rely on standard Supabase PostgREST for fast updates
CREATE OR REPLACE FUNCTION update_user_formatting_prefs(
    p_profile_id uuid,
    p_date_format varchar,
    p_number_format varchar,
    p_currency_symbol varchar
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.profiles
    SET date_format = p_date_format,
        number_format = p_number_format,
        currency_symbol = p_currency_symbol,
        updated_at = NOW()
    WHERE id = p_profile_id;
END;
$$;
```

---

## 2. Global State & React Formatting Context / Hooks

A centralized React context will wrap the application, allowing all deeply nested widgets to access formatting rules without prop-drilling.

### `FormattingContext.jsx`
```javascript
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext'; // Assuming auth context exists

const FormattingContext = createContext();

export const FormattingProvider = ({ children }) => {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState({
    dateFormat: 'YYYY-MM-DD',
    numberFormat: 'EU',
    currencySymbol: '€'
  });

  useEffect(() => {
    if (user) {
      // Fetch from Supabase on load
      const loadPrefs = async () => {
        const { data } = await supabase.from('profiles').select('date_format, number_format, currency_symbol').eq('id', user.id).single();
        if (data) {
          setPrefs({
            dateFormat: data.date_format,
            numberFormat: data.number_format,
            currencySymbol: data.currency_symbol
          });
        }
      };
      loadPrefs();
    }
  }, [user]);

  const updatePrefs = async (newPrefs) => {
    setPrefs(prev => ({ ...prev, ...newPrefs }));
    // Optimistic UI update, then sync to DB
    await supabase.rpc('update_user_formatting_prefs', {
        p_profile_id: user.id,
        p_date_format: newPrefs.dateFormat,
        p_number_format: newPrefs.numberFormat,
        p_currency_symbol: newPrefs.currencySymbol
    });
  };

  return (
    <FormattingContext.Provider value={{ prefs, updatePrefs }}>
      {children}
    </FormattingContext.Provider>
  );
};

export const useFormatting = () => useContext(FormattingContext);
```

### Pure JS Utility Formatters
```javascript
import dayjs from 'dayjs';

export const formatCurrency = (amount, prefs) => {
  const isEU = prefs.numberFormat === 'EU';
  const formatter = new Intl.NumberFormat(isEU ? 'pt-PT' : 'en-US', {
    style: 'currency',
    currency: isEU ? 'EUR' : 'USD', // Override logic based on prefs if needed
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  
  // Custom injection of currency symbol if overriding standard locales
  let formattedStr = formatter.format(amount);
  // (Optional logic to replace currency strings with custom prefs.currencySymbol)
  
  return formattedStr;
};

export const formatNumber = (value, prefs) => {
  const isEU = prefs.numberFormat === 'EU';
  return new Intl.NumberFormat(isEU ? 'pt-PT' : 'en-US').format(value);
};

export const formatDate = (dateString, prefs) => {
  if (!dateString) return '';
  return dayjs(dateString).format(prefs.dateFormat);
};
```

---

## 3. UI Settings Modal Specification

The `SettingsModal.jsx` will be a standard dialog acting as a visual interface for updating formatting settings.

**Technical Breakdown:**
1. **Local State for Live Preview**: The modal will manage its own `localPrefs` state, initialized from `useFormatting()`.
2. **Preview Pane**: A live preview section rendering static dummy data (e.g., `1234.56` and `2026-08-06`) through `formatCurrency` and `formatDate` using the `localPrefs`.
3. **Form Controls**: 
   - Radio buttons or Select dropdowns for `Date Format` (YYYY-MM-DD, MM/DD/YYYY, DD/MM/YYYY).
   - Radio buttons for `Number/Currency Standard` (US: `$1,250.50` vs EU: `1.250,50 €`).
4. **Persistence Trigger**: Upon clicking "Save", the modal invokes `updatePrefs(localPrefs)` from the Context, triggering the database RPC and instantly re-rendering all dependent UI widgets across the app.

---

## 4. AI "Royal Advisor" Dynamic Prompt Injection

Previously, the `RoyalAdvisorModal.jsx` system instruction hardcoded European formatting rules. It must be refactored to dynamically inject the user's active preferences.

**Refactoring `RoyalAdvisorModal.jsx`**:

```javascript
import { useFormatting } from '../context/FormattingContext';

// Inside component:
const { prefs } = useFormatting();

// Dynamic System Instruction String Generation
const formattingInstruction = prefs.numberFormat === 'EU'
  ? `NUMERIC FORMATTING: You MUST format all numbers, currencies, and percentages using the European standard (use a comma "," for decimals and a dot "." for thousands separators). Append the "${prefs.currencySymbol}" symbol. For example: 1.250,50 ${prefs.currencySymbol}.`
  : `NUMERIC FORMATTING: You MUST format all numbers, currencies, and percentages using the US standard (use a dot "." for decimals and a comma "," for thousands separators). Prepend the "${prefs.currencySymbol}" symbol. For example: ${prefs.currencySymbol}1,250.50.`;

const dateInstruction = `DATE FORMATTING: You MUST format all dates as ${prefs.dateFormat}.`;

const systemInstruction = `You are the Royal Advisor of Eldoria...
...[Standard Directives]...

${formattingInstruction}
${dateInstruction}

REAL-TIME FINANCIAL DATA (CONTEXT PACKET):
${JSON.stringify(contextJson, null, 2)}`;
```
This forces the AI to output localized numbers naturally matching the user's UI.

---

## 5. Refactored Phase 5 Component Interaction

To unify the application under the new Preference Engine, Phase 5 components and beyond must strictly adhere to the following rules:

* **Strict Prohibition of Hardcoded Utilities**: Developers must never use `amount.toLocaleString('pt-PT')` or `.toFixed(2)` directly inside JSX.
* **Widget Architecture**: Every widget in `Phase1KpiWidgets.jsx`, `Phase3RatioWidgets.jsx`, and `Phase4LedgerWidgets.jsx` must import `useFormatting` and pass `prefs` to the formatter functions.
* **Datatables & APAR**: The Interactive Ledger and APAR grids must map row data through `formatDate(row.date, prefs)` and `formatCurrency(row.amount, prefs)`.
* **AI Message Parser**: No regex replacements for currency/dates should be necessary on the client side when parsing the Royal Advisor's markdown, as the LLM will output the correct format directly via the prompt injection.
