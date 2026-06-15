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
  user: null,
  role: 'lord',

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
  templates: loadLocal('templates', [
    {
      name: 'Salary',
      icon: '🪙',
      data: {
        from: 'Consolidated',
        transaction_type: 'Income',
        transaction_subtype: 'Cash receipt',
        entity: 'Salary',
        transaction_category: 'Payroll',
        transaction_nature: 'cash',
        transaction_flow: 'inflow',
        payment_status: 'Completed',
        description: 'Monthly salary payment',
        amount: '500'
      }
    },
    {
      name: 'Pay Blacksmith',
      icon: '🔨',
      data: {
        from: 'Pedro',
        transaction_type: 'Expense',
        transaction_subtype: 'Cash payment',
        entity: 'Tools and Equipment',
        transaction_category: 'Markets',
        transaction_nature: 'cash',
        transaction_flow: 'outflow',
        payment_status: 'Completed',
        description: 'Purchase blacksmith tools & equipment',
        amount: '150'
      }
    },
    {
      name: 'Tavern Feast',
      icon: '🍻',
      data: {
        from: 'Pedro',
        transaction_type: 'Expense',
        transaction_subtype: 'Cash payment',
        entity: 'Restaurant',
        transaction_category: 'Entertainment',
        transaction_nature: 'cash',
        transaction_flow: 'outflow',
        payment_status: 'Completed',
        description: 'Feast and drinks with local guild members',
        amount: '50'
      }
    },
    {
      name: 'Borrow Gold',
      icon: '👑',
      data: {
        from: 'Consolidated',
        transaction_type: 'Debt',
        transaction_subtype: 'New Debt',
        entity: 'CGD',
        transaction_category: 'Banking',
        transaction_nature: 'accrual',
        transaction_flow: 'inflow',
        payment_status: 'Pending',
        description: 'Emergency gold borrow from the crown',
        amount: '1000'
      }
    },
    {
      name: 'Pay Landlord',
      icon: '🏰',
      data: {
        from: 'Pedro',
        transaction_type: 'Expense',
        transaction_subtype: 'Cash payment',
        entity: 'Rent',
        transaction_category: 'Housing',
        transaction_nature: 'cash',
        transaction_flow: 'outflow',
        payment_status: 'Completed',
        description: 'Monthly land rent payment to the estate',
        amount: '800'
      }
    },
    {
      name: 'Purchase Food',
      icon: '🌾',
      data: {
        from: 'Pedro',
        transaction_type: 'Expense',
        transaction_subtype: 'Cash payment',
        entity: 'Supermarket',
        transaction_category: 'Markets',
        transaction_nature: 'cash',
        transaction_flow: 'outflow',
        payment_status: 'Completed',
        description: 'Acquisition of wheat and food rations',
        amount: '120'
      }
    },
    {
      name: 'Pay Interest',
      icon: '📈',
      data: {
        from: 'Pedro',
        transaction_type: 'Debt',
        transaction_subtype: 'Interest',
        entity: 'CGD',
        transaction_category: 'Banking',
        transaction_nature: 'cash',
        transaction_flow: 'outflow',
        payment_status: 'Completed',
        description: 'Interest fee on outstanding gold loan',
        amount: '35'
      }
    }
  ]),

  // Actions to manage options
  addOption: (type, value, extraData) => {
    if (type === 'quickAction') {
      const updated = [...get().templates, { name: value, icon: extraData.icon || '⚡', data: extraData.data }];
      set({ templates: updated });
      saveLocal('templates', updated);
      return;
    }

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
    if (type === 'quickAction') {
      const updated = get().templates.filter(tpl => tpl.name !== value);
      set({ templates: updated });
      saveLocal('templates', updated);
      return;
    }

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
    const userId = get().user?.id || profileId;
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
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
    const userId = get().user?.id || profileId;
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
        supabase.from('transactions').select('*').eq('profile_id', userId).order('created_at', { ascending: false }).limit(100),
        supabase.from('view_dashboard_kpi_summary').select('*').eq('profile_id', userId).maybeSingle(),
        supabase.from('view_chart_flow_by_category').select('*').eq('profile_id', userId),
        supabase.from('view_chart_time_evolution').select('*').eq('profile_id', userId).order('dimension_date', { ascending: true }),
        supabase.from('view_chart_top_entities').select('*').eq('profile_id', userId).order('total_volume', { ascending: false }),
        supabase.from('view_payables_receivables_kpis').select('*').eq('profile_id', userId).maybeSingle(),
        supabase.from('view_liabilities_kpis').select('*').eq('profile_id', userId).maybeSingle()
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
    const userId = get().user?.id || profileId;
    const tempId = 'temp-' + Date.now();
    const tempTx = {
      id: tempId,
      profile_id: userId,
      transaction_type: transactionData.transaction_type,
      amount: Number(transactionData.amount),
      from: transactionData.from,
      value_date: transactionData.value_date || new Date().toISOString().split('T')[0],
      posting_date: transactionData.posting_date || new Date().toISOString().split('T')[0],
      payment_status: transactionData.payment_status || 'Completed',
      transaction_subtype: transactionData.transaction_subtype,
      entity: transactionData.entity,
      transaction_category: transactionData.transaction_category,
      transaction_nature: transactionData.transaction_nature,
      transaction_flow: transactionData.transaction_flow,
      description: transactionData.description,
      created_at: new Date().toISOString()
    };

    const prevTransactions = get().transactions;
    set({ transactions: [tempTx, ...prevTransactions], isLoading: true });

    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert([
          {
            profile_id: userId,
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

      if (data && data.length > 0) {
        set((state) => ({
          transactions: state.transactions.map((t) => (t.id === tempId ? data[0] : t))
        }));
      }

      // Fetch only the profile stats to get the new trigger-calculated Gold, XP, and Level
      const profileRes = await supabase
        .from('profiles')
        .select('gold, xp, level')
        .eq('id', userId)
        .single();
      
      if (profileRes.data) {
        set({
          gold: profileRes.data.gold ? Number(profileRes.data.gold) : get().gold,
          level: profileRes.data.level || get().level,
          xp: profileRes.data.xp || get().xp,
        });
      }

      get().fetchDashboardData(userId);

      return { success: true, data };
    } catch (err) {
      set({ transactions: prevTransactions });
      console.error('Error registering transaction:', err);
      return { success: false, error: err.message || err };
    } finally {
      set({ isLoading: false });
    }
  },

  // Insert multiple transactions to database in a single query, triggering updates, and synchronize state
  registerTransactions: async (profileId, transactionsList) => {
    const userId = get().user?.id || profileId;
    const tempIds = [];
    const tempTxs = transactionsList.map((tx, idx) => {
      const tempId = 'temp-batch-' + idx + '-' + Date.now();
      tempIds.push(tempId);
      return {
        id: tempId,
        profile_id: userId,
        transaction_type: tx.transaction_type,
        amount: Number(tx.amount),
        from: tx.from,
        value_date: tx.value_date || new Date().toISOString().split('T')[0],
        posting_date: tx.posting_date || new Date().toISOString().split('T')[0],
        payment_status: tx.payment_status || 'Completed',
        transaction_subtype: tx.transaction_subtype,
        entity: tx.entity,
        transaction_category: tx.transaction_category,
        transaction_nature: tx.transaction_nature,
        transaction_flow: tx.transaction_flow,
        description: tx.description,
        created_at: new Date().toISOString()
      };
    });

    const prevTransactions = get().transactions;
    set({ transactions: [...tempTxs, ...prevTransactions], isLoading: true });

    try {
      const formatted = transactionsList.map((tx) => ({
        profile_id: userId,
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

      if (data && data.length > 0) {
        set((state) => {
          const nextTxs = [...state.transactions];
          tempIds.forEach((tempId, index) => {
            const matchIdx = nextTxs.findIndex(t => t.id === tempId);
            if (matchIdx !== -1 && data[index]) {
              nextTxs[matchIdx] = data[index];
            }
          });
          return { transactions: nextTxs };
        });
      }

      // Fetch only the profile stats
      const profileRes = await supabase
        .from('profiles')
        .select('gold, xp, level')
        .eq('id', userId)
        .single();

      if (profileRes.data) {
        set({
          gold: profileRes.data.gold ? Number(profileRes.data.gold) : get().gold,
          level: profileRes.data.level || get().level,
          xp: profileRes.data.xp || get().xp,
        });
      }

      get().fetchDashboardData(userId);

      return { success: true, data };
    } catch (err) {
      set({ transactions: prevTransactions });
      console.error('Error batch registering transactions:', err);
      return { success: false, error: err.message || err };
    } finally {
      set({ isLoading: false });
    }
  },

  initAuth: () => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        set({ user: session.user, email: session.user.email });
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profileData) {
          set({
            gold: Number(profileData.gold) || 0,
            xp: profileData.xp || 0,
            level: profileData.level || 1,
            role: profileData.role || 'lord'
          });
        }
        get().fetchKingdomData(session.user.id);
        get().fetchDashboardData(session.user.id);
      } else {
        set({ user: null, role: 'lord', email: 'guest@medieval.stuff' });
        get().resetStore();
      }
    });
    return () => subscription.unsubscribe();
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
