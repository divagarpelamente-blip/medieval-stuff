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
  kpiSummary: null,
  payablesReceivablesKpis: null,
  liabilitiesKpis: null,
  flowByCategory: [],
  timeEvolution: [],
  topEntities: [],
  isLoading: false,
  language: loadLocal('language', 'en'),

  // Dropdown manage lists
  fromOptions: loadLocal('fromOptions', ['Pedro', 'Reni', 'Consolidated']),
  statusOptions: ['Pending', 'Overdue', 'Paid on Time', 'Paid Late'],
  classOptions: ['Income', 'Expense', 'Savings', 'Debt'],
  subClassOptions: ['Cash receipt', 'Cash payment', 'Credit receipt', 'Credit payment', 'New Debt', 'Amortization', 'Interest'],
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

  // Fetch lightweight profile data (single-row polling mechanics)
  fetchKingdomData: async (profileId) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
      }

      if (data) {
        set({
          email: data.email || 'guest@medieval.stuff',
          gold: data.gold ? Number(data.gold) : 1000,
          level: data.level || 1,
          xp: data.xp || 0,
        });
      }
    } catch (err) {
      console.error('Failed to fetch kingdom data:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  // Native zero-calculation syncing mechanism for the Dashboard Engine
  fetchDashboardData: async (profileId) => {
    set({ isLoading: true });
    try {
      const [
        transactionsRes,
        kpiRes,
        flowRes,
        timeRes,
        topRes,
        prKpiRes,
        liabilitiesKpiRes
      ] = await Promise.all([
        supabase.from('transactions').select('*').eq('profile_id', profileId).order('created_at', { ascending: false }).limit(100),
        supabase.from('view_dashboard_kpi_summary').select('*').eq('profile_id', profileId).maybeSingle(),
        supabase.from('view_chart_flow_by_category').select('*').eq('profile_id', profileId),
        supabase.from('view_chart_time_evolution').select('*').eq('profile_id', profileId).order('dimension_date', { ascending: true }),
        supabase.from('view_chart_top_entities').select('*').eq('profile_id', profileId).order('total_volume', { ascending: false }),
        supabase.from('view_payables_receivables_kpis').select('*').eq('profile_id', profileId).maybeSingle(),
        supabase.from('view_liabilities_kpis').select('*').eq('profile_id', profileId).maybeSingle()
      ]);

      if (transactionsRes.error) console.error('Error fetching transactions:', transactionsRes.error);
      if (kpiRes.error) console.error('Error fetching KPI view:', kpiRes.error);
      if (prKpiRes.error) console.error('Error fetching payables/receivables KPIs view:', prKpiRes.error);
      if (liabilitiesKpiRes.error) console.error('Error fetching liabilities KPIs view:', liabilitiesKpiRes.error);

      set({ 
        transactions: transactionsRes.data || [],
        kpiSummary: kpiRes.data || null,
        flowByCategory: flowRes.data || [],
        timeEvolution: timeRes.data || [],
        topEntities: topRes.data || [],
        payablesReceivablesKpis: prKpiRes.data || null,
        liabilitiesKpis: liabilitiesKpiRes.data || null
      });
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
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
            transaction_type: transactionData.transaction_type,
            amount: Number(transactionData.amount),
            from: transactionData.from,
            value_date: transactionData.value_date || null,
            posting_date: transactionData.posting_date || null,
            payment_status: transactionData.payment_status || 'Completed',
            transaction_subtype: transactionData.transaction_subtype,
            entity: transactionData.entity,
            transaction_category: transactionData.transaction_category,
            transaction_nature: transactionData.transaction_nature,
            transaction_flow: transactionData.transaction_flow,
            description: transactionData.description,
            due_date: transactionData.due_date || null,
            payment_method: transactionData.payment_method || null
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

      get().fetchDashboardData(profileId);

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
        transaction_type: tx.transaction_type,
        amount: Number(tx.amount),
        from: tx.from,
        value_date: tx.value_date || null,
        posting_date: tx.posting_date || null,
        payment_status: tx.payment_status || 'Completed',
        transaction_subtype: tx.transaction_subtype,
        entity: tx.entity,
        transaction_category: tx.transaction_category,
        transaction_nature: tx.transaction_nature,
        transaction_flow: tx.transaction_flow,
        description: tx.description,
        due_date: tx.due_date || null,
        payment_method: tx.payment_method || null
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

      get().fetchDashboardData(profileId);

      return { success: true, data };
    } catch (err) {
      console.error('Error batch registering transactions:', err);
      return { success: false, error: err.message || err };
    } finally {
      set({ isLoading: false });
    }
  },

  borrowLoan: async (profileId, { amount, from, entity, description, date }) => {
    const common = {
      amount: Number(amount),
      from,
      entity,
      description: description || 'New Loan Borrowed',
      value_date: date || new Date().toISOString().split('T')[0],
      posting_date: date || new Date().toISOString().split('T')[0]
    };
    return get().registerTransactions(profileId, [
      {
        ...common,
        transaction_type: 'Debt',
        transaction_subtype: 'New Debt',
        transaction_nature: 'accrual',
        transaction_flow: 'inflow',
        payment_status: 'Open'
      },
      {
        ...common,
        transaction_type: 'Debt',
        transaction_subtype: 'New Debt',
        transaction_nature: 'cash',
        transaction_flow: 'inflow',
        payment_status: 'Completed'
      }
    ]);
  },

  settlePayable: async (profileId, payableTx, paymentMethod) => {
    set({ isLoading: true });
    try {
      const { error: updateErr } = await supabase
        .from('transactions')
        .update({ payment_status: 'Completed' })
        .eq('id', payableTx.id);

      if (updateErr) throw updateErr;

      const cashPayment = {
        profile_id: profileId,
        transaction_type: 'Expense',
        amount: Number(payableTx.amount),
        from: payableTx.from,
        value_date: new Date().toISOString().split('T')[0],
        posting_date: new Date().toISOString().split('T')[0],
        payment_status: 'Completed',
        transaction_subtype: 'Cash payment',
        entity: payableTx.entity,
        transaction_category: payableTx.transaction_category,
        transaction_nature: 'cash',
        transaction_flow: 'outflow',
        description: `Payment for invoice: ${payableTx.description || payableTx.id}`,
        payment_method: paymentMethod || 'Vault Cash'
      };

      const { data: cashData, error: cashErr } = await supabase
        .from('transactions')
        .insert([cashPayment])
        .select();

      if (cashErr) throw cashErr;

      set(state => {
        const nextTxs = state.transactions.map(tx => 
          tx.id === payableTx.id ? { ...tx, payment_status: 'Completed' } : tx
        );
        if (cashData && cashData.length > 0) {
          nextTxs.unshift(cashData[0]);
        }
        return { transactions: nextTxs };
      });

      await get().fetchKingdomData(profileId);
      await get().fetchDashboardData(profileId);

      return { success: true };
    } catch (err) {
      console.error('Error settling payable:', err);
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
