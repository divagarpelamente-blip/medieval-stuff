import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';
import i18n from '../i18n';

const loadLocal = (key, defaultVal) => {
  try {
    const saved = localStorage.getItem(`eldoria_${key}`);
    return saved ? JSON.parse(saved) : defaultVal;
  } catch {
    return defaultVal;
  }
};

const saveLocal = (key, val) => {
  try {
    localStorage.setItem(`eldoria_${key}`, JSON.stringify(val));
  } catch {
    // Ignore storage quota errors
  }
};

export const useKingdomStore = create((set, get) => ({
  gold: 1000,
  gems: 100,
  xp: 0,
  level: 1,
  email: 'lord.eldoria@kingdom.gov',
  transactions: [],
  isLoading: false,
  language: loadLocal('language', 'en'),

  // Dropdown manage lists
  fromOptions: loadLocal('fromOptions', ['Pedro', 'Reni', 'Consolidated']),
  statusOptions: loadLocal('statusOptions', ['Pending', 'Overdue', 'Paid on Time', 'Paid Late']),
  categoryOptions: loadLocal('categoryOptions', ['Income', 'Expense', 'Savings', 'Debt']),
  subcategoryOptions: loadLocal('subcategoryOptions', ['Cash receipt', 'Cash payment', 'Credit receipt', 'Credit payment']),
  entityOptions: loadLocal('entityOptions', [
    'Salary', 'Bonus', 'CGD', 'Universo', 'ActiveBank', 'WizInk', 
    'Inter(Brasil)', 'Cofidis', 'Jota', 'Mae', 'Rent', 'Endesa', 
    'Digal', 'Simas', 'NOS', 'Gasoline', 'Repairs', 'Fees', 'Via Verde'
  ]),
  entityCategoryOptions: loadLocal('entityCategoryOptions', ['Payroll', 'Bank (Credit Card)', 'Rent', 'Utilities', 'Transports']),
  entityMappings: loadLocal('entityMappings', {
    'Salary': 'Payroll',
    'Bonus': 'Payroll',
    'CGD': 'Bank (Credit Card)',
    'Universo': 'Bank (Credit Card)',
    'ActiveBank': 'Bank (Credit Card)',
    'WizInk': 'Bank (Credit Card)',
    'Inter(Brasil)': 'Bank (Credit Card)',
    'Cofidis': 'Bank (Credit Card)',
    'Jota': 'Bank (Credit Card)',
    'Mae': 'Bank (Credit Card)',
    'Rent': 'Rent',
    'Endesa': 'Utilities',
    'Digal': 'Utilities',
    'Simas': 'Utilities',
    'NOS': 'Utilities',
    'Gasoline': 'Transports',
    'Repairs': 'Transports',
    'Fees': 'Transports',
    'Via Verde': 'Transports'
  }),
  monthOptions: loadLocal('monthOptions', [
    'January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'
  ]),

  // Actions to manage options
  addOption: (type, value, extraData) => {
    const key = `${type}Options`;
    const currentList = get()[key];
    if (!currentList) return;
    if (currentList.includes(value)) return;

    const updated = [...currentList, value];
    set({ [key]: updated });
    saveLocal(key, updated);

    // If adding an entity, we also add its category mapping
    if (type === 'entity' && extraData?.entityCategory) {
      const updatedMappings = { ...get().entityMappings, [value]: extraData.entityCategory };
      set({ entityMappings: updatedMappings });
      saveLocal('entityMappings', updatedMappings);
    }
  },

  deleteOption: (type, value) => {
    const key = `${type}Options`;
    const currentList = get()[key];
    if (!currentList) return;

    const updated = currentList.filter(v => v !== value);
    set({ [key]: updated });
    saveLocal(key, updated);

    if (type === 'entity') {
      const updatedMappings = { ...get().entityMappings };
      delete updatedMappings[value];
      set({ entityMappings: updatedMappings });
      saveLocal('entityMappings', updatedMappings);
    }
  },

  // Fetch complete profile and historical state from Supabase
  fetchKingdomData: async (profileId) => {
    set({ isLoading: true });
    try {
      const [profileRes, transRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .eq('id', profileId)
          .single(),
        supabase
          .from('transactions')
          .select('*')
          .eq('profile_id', profileId)
          .order('created_at', { ascending: false })
      ]);

      if (profileRes.error) {
        console.error('Error fetching profile:', profileRes.error);
      }
      if (transRes.error) {
        console.error('Error fetching transactions:', transRes.error);
      }

      const profileData = profileRes.data;
      if (profileData) {
        set({
          email: profileData.email || 'guest@medieval.stuff',
          gold: profileData.gold ? Number(profileData.gold) : 1000,
          level: profileData.level || 1,
          xp: profileData.xp || 0,
        });
      }
      if (transRes.data) {
        set({ transactions: transRes.data });
      }
    } catch (err) {
      console.error('Failed to fetch kingdom data:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  // Insert transaction to database, triggering Postgres profile updates, and synchronize state
  registerTransaction: async (profileId, transactionData) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert([
          {
            profile_id: profileId,
            type: transactionData.type,
            amount: Number(transactionData.amount),
            from: transactionData.from,
            date: transactionData.date || null,
            status: transactionData.status || 'Completed',
            category: transactionData.category,
            subcategory: transactionData.subcategory,
            entity: transactionData.entity,
            entity_category: transactionData.entityCategory,
            description: transactionData.description
          }
        ])
        .select();

      if (error) {
        throw error;
      }

      // Refresh local store from DB to stay in sync with the trigger updates
      await get().fetchKingdomData(profileId);
      return { success: true, data };
    } catch (err) {
      console.error('Error registering transaction:', err);
      return { success: false, error: err.message || err };
    } finally {
      set({ isLoading: false });
    }
  },

  // Insert multiple transactions to database in a single query, triggering updates, and synchronize state
  registerTransactions: async (profileId, transactionsList) => {
    set({ isLoading: true });
    try {
      const formatted = transactionsList.map((tx) => ({
        profile_id: profileId,
        type: tx.type,
        amount: Number(tx.amount),
        from: tx.from,
        date: tx.date || null,
        status: tx.status || 'Completed',
        category: tx.category,
        subcategory: tx.subcategory,
        entity: tx.entity,
        entity_category: tx.entityCategory || tx.entity_category,
        description: tx.description
      }));

      const { data, error } = await supabase
        .from('transactions')
        .insert(formatted)
        .select();

      if (error) {
        throw error;
      }

      // Refresh local store from DB once
      await get().fetchKingdomData(profileId);
      return { success: true, data };
    } catch (err) {
      console.error('Error batch registering transactions:', err);
      return { success: false, error: err.message || err };
    } finally {
      set({ isLoading: false });
    }
  },

  setLanguage: (lang) => {
    set({ language: lang });
    saveLocal('language', lang);
    i18n.changeLanguage(lang);
  },

  resetStore: () => set({
    gold: 1000,
    gems: 100,
    xp: 0,
    level: 1,
    email: 'lord.eldoria@kingdom.gov',
    transactions: [],
    isLoading: false,
    language: 'en'
  })
}));

export default useKingdomStore;
