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

// Purge legacy local storage keys that no longer map to the new Engine structure
['classOptions', 'subClassOptions', 'statusOptions', 'monthOptions'].forEach(key => {
  try {
    localStorage.removeItem(`eldoria_${key}`);
  } catch {
    // Ignore
  }
});

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
  statusOptions: ['Pending', 'Overdue', 'Paid on Time', 'Paid Late'],
  classOptions: ['Income', 'Expense', 'Savings', 'Debt'],
  subClassOptions: ['Cash receipt', 'Cash payment', 'Credit receipt', 'Credit payment'],
  entityOptions: loadLocal('entityOptions', [
    'Salary', 'Bonus', 'Shows', 'Cinema', 'Restaurant', 'Trips', 'Streaming',
    'Rent', 'Landlord', 'Energy', 'IMI', 'Repairs', 'Water', 'Gas', 'Internet',
    'Health Insurance', 'Medicine', 'Health Fees', 'Medical Appointments', 'Medical Exams',
    'Supermarket', 'Tools and Equipment', 'Clothing', 'Gasoline', 'Transport Insurance', 
    'Uber/Glovo/Taxi', 'Vehicle repairs', 'Tolls', 'Parking', 'Bus', 'CGD', 'Universo', 
    'ActiveBank', 'WizInk', 'Inter(Brasil)', 'Cofidis', 'Jota', 'Mae'
  ]),
  categoryOptions: loadLocal('categoryOptions', [
    'Payroll', 'Entertainment', 'Housing', 'Health', 'Markets', 
    'Transport', 'Banking', 'Other Banking', 'Burrowed'
  ]),
  entityMappings: loadLocal('entityMappings', {
    "Salary": "Payroll", "Bonus": "Payroll",
    "Shows": "Entertainment", "Cinema": "Entertainment", "Restaurant": "Entertainment", "Trips": "Entertainment", "Streaming": "Entertainment",
    "Rent": "Housing", "Landlord": "Housing", "Energy": "Housing", "IMI": "Housing", "Repairs": "Housing", "Water": "Housing", "Gas": "Housing", "Internet": "Housing",
    "Health Insurance": "Health", "Medicine": "Health", "Health Fees": "Health", "Medical Appointments": "Health", "Medical Exams": "Health",
    "Supermarket": "Markets", "Tools and Equipment": "Markets", "Clothing": "Markets",
    "Gasoline": "Transport", "Transport Insurance": "Transport", "Uber/Glovo/Taxi": "Transport", "Vehicle repairs": "Transport", "Tolls": "Transport", "Parking": "Transport", "Bus": "Transport",
    "CGD": "Banking", "Universo": "Banking", "ActiveBank": "Banking", "WizInk": "Banking", "Inter(Brasil)": "Banking",
    "Cofidis": "Other Banking",
    "Jota": "Burrowed", "Mae": "Burrowed"
  }),
  monthOptions: [
    'January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'
  ],

  // Actions to manage options
  addOption: (type, value, extraData) => {
    const key = `${type}Options`;
    const currentList = get()[key];
    if (!currentList) return;
    if (currentList.includes(value)) return;

    const updated = [...currentList, value];
    set({ [key]: updated });
    
    // Only persist user-customizable options
    if (['fromOptions', 'entityOptions', 'categoryOptions'].includes(key)) {
      saveLocal(key, updated);
    }

    // If adding an entity, we also add its category mapping
    if (type === 'entity' && extraData?.category) {
      const updatedMappings = { ...get().entityMappings, [value]: extraData.category };
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
    
    if (['fromOptions', 'entityOptions', 'categoryOptions'].includes(key)) {
      saveLocal(key, updated);
    }

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
            class: transactionData.class,
            amount: Number(transactionData.amount),
            from: transactionData.from,
            date: transactionData.date || null,
            status: transactionData.status || 'Completed',
            sub_class: transactionData.subClass,
            entity: transactionData.entity,
            category: transactionData.category,
            sub_category: transactionData.subCategory || '',
            description: transactionData.description
          }
        ])
        .select();

      if (error) {
        throw error;
      }

      // Append locally to avoid fetching all historical transactions
      if (data && data.length > 0) {
        set((state) => ({ transactions: [data[0], ...state.transactions] }));
      }

      // Fetch only the profile stats to get the new trigger-calculated Gold, XP, and Level
      const profileRes = await supabase
        .from('profiles')
        .select('gold, xp, level')
        .eq('id', profileId)
        .single();
      
      if (profileRes.data) {
        set({
          gold: profileRes.data.gold ? Number(profileRes.data.gold) : get().gold,
          level: profileRes.data.level || get().level,
          xp: profileRes.data.xp || get().xp,
        });
      }

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
        class: tx.class,
        amount: Number(tx.amount),
        from: tx.from,
        date: tx.date || null,
        status: tx.status || 'Completed',
        sub_class: tx.subClass,
        entity: tx.entity,
        category: tx.category,
        sub_category: tx.subCategory || '',
        description: tx.description
      }));

      const { data, error } = await supabase
        .from('transactions')
        .insert(formatted)
        .select();

      if (error) {
        throw error;
      }

      // Append locally
      if (data && data.length > 0) {
        set((state) => ({ transactions: [...data, ...state.transactions] }));
      }

      // Fetch only the profile stats
      const profileRes = await supabase
        .from('profiles')
        .select('gold, xp, level')
        .eq('id', profileId)
        .single();

      if (profileRes.data) {
        set({
          gold: profileRes.data.gold ? Number(profileRes.data.gold) : get().gold,
          level: profileRes.data.level || get().level,
          xp: profileRes.data.xp || get().xp,
        });
      }

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
