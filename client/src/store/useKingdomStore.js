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
  accountBalances: [],
  isLoading: false,
  language: loadLocal('language', 'en'),
  user: null,
  role: 'lord',

  syncSettings: async (updates) => {
    set(updates);
    Object.entries(updates).forEach(([key, val]) => {
      saveLocal(key, val);
    });
    const userId = get().user?.id;
    if (userId) {
      const settings = {
        templates: get().templates,
        fromOptions: get().fromOptions,
        entityOptions: get().entityOptions,
        categoryOptions: get().categoryOptions,
        entityMappings: get().entityMappings,
        language: get().language,
        ...updates
      };
      try {
        await supabase
          .from('profiles')
          .update({ settings })
          .eq('id', userId);
      } catch (err) {
        console.error('Failed to sync settings with DB:', err);
      }
    }
  },

  // Dropdown manage lists
  fromOptions: loadLocal('fromOptions', ['Pedro', 'Reni', 'Consolidated']),
  statusOptions: ['Pending', 'Completed'],
  classOptions: ['Income', 'Expense', 'Asset', 'Debt'],
  subClassOptions: ['Cash receipt', 'Cash payment', 'New Debt', 'Amortization', 'Interest', 'Transfers', 'Transfer'],
  entityOptions: loadLocal('entityOptions', [
    'Salary', 'Bonus', 'Shows', 'Cinema', 'Restaurant', 'Trips', 'Streaming',
    'Rent', 'Landlord', 'Energy', 'IMI', 'Repairs', 'Water', 'Gas', 'Internet',
    'Health Insurance', 'Medicine', 'Health Fees', 'Medical Appointments', 'Medical Exams',
    'Supermarket', 'Tools and Equipment', 'Clothing', 'Gasoline', 'Transport Insurance', 
    'Uber/Glovo/Taxi', 'Vehicle repairs', 'Tolls', 'Parking', 'Bus', 'CGD', 'Universo', 
    'ActiveBank', 'WizInk', 'Inter(Brasil)', 'Cofidis', 'Jota', 'Mae', 'Savings Account'
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
    "Jota": "Burrowed", "Mae": "Burrowed",
    "Savings Account": "Banking"
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
        transaction_subtype: 'Base Salary',
        entity: 'Salary',
        transaction_category: 'Payroll',
        target_account: '711001',
        source_dest_bank: '111001',
        flow: 'inflow',
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
        transaction_subtype: 'Tools & Materials',
        entity: 'Tools and Equipment',
        transaction_category: 'Markets',
        target_account: '642001',
        source_dest_bank: '111001',
        flow: 'outflow',
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
        transaction_subtype: 'Bars & Nightlife',
        entity: 'Restaurant',
        transaction_category: 'Entertainment',
        target_account: '663',
        source_dest_bank: '111001',
        flow: 'outflow',
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
        transaction_type: 'Asset',
        transaction_subtype: 'Borrow cash',
        entity: 'CGD',
        transaction_category: 'Banking',
        target_account: '111001',
        source_dest_bank: '212002',
        flow: 'inflow',
        payment_status: 'Completed',
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
        transaction_subtype: 'Rent',
        entity: 'Rent',
        transaction_category: 'Housing',
        target_account: '611001',
        source_dest_bank: '111001',
        flow: 'outflow',
        payment_status: 'Pending',
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
        transaction_subtype: 'Food',
        entity: 'Supermarket',
        transaction_category: 'Markets',
        target_account: '641001',
        source_dest_bank: '111001',
        flow: 'outflow',
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
        transaction_type: 'Expense',
        transaction_subtype: 'Interests',
        entity: 'CGD',
        transaction_category: 'Banking',
        target_account: '681001',
        source_dest_bank: '111001',
        flow: 'outflow',
        payment_status: 'Completed',
        description: 'Interest fee on outstanding gold loan',
        amount: '35'
      }
    },
    {
      name: 'Transfers',
      icon: '💸',
      data: {
        from: 'Consolidated',
        transaction_type: 'Asset',
        transaction_subtype: 'Transfers',
        entity: 'Savings Account',
        transaction_category: 'Banking',
        target_account: '131001',
        source_dest_bank: '111001',
        flow: 'neutral',
        payment_status: 'Completed',
        description: 'Shift gold value between asset vaults',
        amount: '200'
      }
    }
  ]),

  // Actions to manage options
  addOption: (type, value, extraData) => {
    if (type === 'quickAction') {
      const updated = [...get().templates, { name: value, icon: extraData.icon || '⚡', data: extraData.data }];
      get().syncSettings({ templates: updated });
      return;
    }

    const key = `${type}Options`;
    const currentList = get()[key];
    if (!currentList) return;
    if (currentList.includes(value)) return;

    const updated = [...currentList, value];
    const updates = { [key]: updated };
    
    // If adding an entity, we also add its category mapping
    if (type === 'entity' && extraData?.category) {
      updates.entityMappings = { ...get().entityMappings, [value]: extraData.category };
    }

    get().syncSettings(updates);
  },

  editOption: (type, oldValue, newValue, extraData) => {
    if (type === 'quickAction') {
      const updated = get().templates.map(tpl => {
        if (tpl.name === oldValue) {
          return { name: newValue, icon: extraData.icon || '⚡', data: extraData.data };
        }
        return tpl;
      });
      get().syncSettings({ templates: updated });
      return;
    }
  },

  deleteOption: (type, value) => {
    if (type === 'quickAction') {
      const updated = get().templates.filter(tpl => tpl.name !== value);
      get().syncSettings({ templates: updated });
      return;
    }

    const key = `${type}Options`;
    const currentList = get()[key];
    if (!currentList) return;

    const updated = currentList.filter(v => v !== value);
    const updates = { [key]: updated };
    
    if (type === 'entity') {
      const updatedMappings = { ...get().entityMappings };
      delete updatedMappings[value];
      updates.entityMappings = updatedMappings;
    }

    get().syncSettings(updates);
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

        if (data.settings) {
          const s = data.settings;
          set({
            templates: s.templates || get().templates,
            fromOptions: s.fromOptions || get().fromOptions,
            entityOptions: s.entityOptions || get().entityOptions,
            categoryOptions: s.categoryOptions || get().categoryOptions,
            entityMappings: s.entityMappings || get().entityMappings,
            language: s.language || get().language
          });
          if (s.language) {
            i18n.changeLanguage(s.language);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch kingdom data:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  // Fetch raw transactions and account balances for the Dashboard Engine
  fetchDashboardData: async (profileId) => {
    const userId = get().user?.id || profileId;
    set({ isLoading: true });
    try {
      const [transactionsRes, balancesRes] = await Promise.all([
        supabase.from('transactions').select('*').eq('profile_id', userId).order('created_at', { ascending: false }).limit(200),
        supabase.from('account_balances').select('*').eq('profile_id', userId)
      ]);

      if (transactionsRes.error) console.error('Error fetching transactions:', transactionsRes.error);
      if (balancesRes.error) console.error('Error fetching account balances:', balancesRes.error);

      const txs = (transactionsRes.data || []).map((tx) => ({
        ...tx,
        from: tx.origin || tx.from
      }));
      
      // Calculate live gold from transaction history to verify synchronization
      const isCompleted = (status) => ['Completed', 'Paid', 'Paid on Time', 'Paid Late'].includes(status);
      const netCash = txs
        .filter(t => isCompleted(t.payment_status))
        .reduce((sum, t) => {
          const amt = Number(t.amount) || 0;
          if (t.transaction_type === 'Income') return sum + amt;
          if (t.transaction_type === 'Expense') return sum - amt;
          if (t.transaction_type === 'Savings' || t.transaction_type === 'Debt') {
            if (t.flow === 'inflow') return sum + amt;
            if (t.flow === 'outflow') return sum - amt;
          }
          return sum;
        }, 0);
      
      const startingGold = userId === '00000000-0000-0000-0000-000000000000' ? 5000 : 1000;
      const calculatedGold = Math.max(0, startingGold + netCash);

      // If calculatedGold is different from state gold, sync it to state and database
      if (calculatedGold !== get().gold) {
        set({ gold: calculatedGold });
        supabase
          .from('profiles')
          .update({ gold: calculatedGold })
          .eq('id', userId)
          .then();
      }

      set({ 
        transactions: txs,
        accountBalances: balancesRes.data || []
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
      due_date: transactionData.due_date || null,
      payment_status: transactionData.payment_status || 'Completed',
      transaction_subtype: transactionData.transaction_subtype,
      entity: transactionData.entity,
      transaction_category: transactionData.transaction_category,
      target_account: transactionData.target_account,
      source_dest_bank: transactionData.source_dest_bank,
      flow: transactionData.flow,
      description: transactionData.description,
      created_at: new Date().toISOString()
    };

    // Calculate Gold, XP, and Level locally as a fail-safe
    let newGold = get().gold;
    let earnedXp = 0;
    const isCompleted = (status) => ['Completed', 'Paid', 'Paid on Time', 'Paid Late'].includes(status);
    const isCompletedStatus = isCompleted(transactionData.payment_status || 'Completed');

    if (isCompletedStatus) {
      const amt = Number(transactionData.amount) || 0;
      if (transactionData.transaction_type === 'Income') {
        newGold += amt;
        earnedXp = amt * 2;
      } else if (transactionData.transaction_type === 'Expense') {
        newGold = Math.max(0, newGold - amt);
      } else if (transactionData.transaction_type === 'Savings') {
        if (transactionData.flow === 'inflow') newGold += amt;
        else if (transactionData.flow === 'outflow') newGold = Math.max(0, newGold - amt);
      } else if (transactionData.transaction_type === 'Debt') {
        if (transactionData.flow === 'inflow') newGold += amt;
        else if (transactionData.flow === 'outflow') newGold = Math.max(0, newGold - amt);
      }
    }

    let newXp = get().xp + earnedXp;
    let newLevel = get().level;
    while (true) {
      const maxXp = 100 * Math.pow(1.5, newLevel - 1);
      if (newXp >= maxXp) {
        newXp -= Math.floor(maxXp);
        newLevel += 1;
      } else {
        break;
      }
    }

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
            value_date: transactionData.value_date || null,
            posting_date: transactionData.posting_date || null,
            due_date: transactionData.due_date || null,
            payment_status: transactionData.payment_status || 'Completed',
            transaction_subtype: transactionData.transaction_subtype,
            entity: transactionData.entity,
            origin: transactionData.from,
            target_account: transactionData.target_account,
            source_dest_bank: transactionData.source_dest_bank,
            flow: transactionData.flow,
            description: transactionData.description
          }
        ])
        .select();

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        const savedTx = { ...data[0], from: data[0].origin || data[0].from };
        set((state) => ({
          transactions: state.transactions.map((t) => (t.id === tempId ? savedTx : t))
        }));
      }

      // Update profiles directly in database to ensure sync even if trigger is missing
      await supabase
        .from('profiles')
        .update({
          gold: newGold,
          xp: newXp,
          level: newLevel
        })
        .eq('id', userId);

      set({
        gold: newGold,
        xp: newXp,
        level: newLevel
      });

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
        due_date: tx.due_date || null,
        payment_status: tx.payment_status || 'Completed',
        transaction_subtype: tx.transaction_subtype,
        entity: tx.entity,
        transaction_category: tx.transaction_category,
        target_account: tx.target_account,
        source_dest_bank: tx.source_dest_bank,
        flow: tx.flow,
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
        value_date: tx.value_date || null,
        posting_date: tx.posting_date || null,
        due_date: tx.due_date || null,
        payment_status: tx.payment_status || 'Completed',
        transaction_subtype: tx.transaction_subtype,
        entity: tx.entity,
        origin: tx.from,
        target_account: tx.target_account,
        source_dest_bank: tx.source_dest_bank,
        flow: tx.flow,
        description: tx.description
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
              nextTxs[matchIdx] = { ...data[index], from: data[index].origin || data[index].from };
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

  deleteTransactions: async (profileId, transactionIds) => {
    const userId = get().user?.id || profileId;
    set({ isLoading: true });
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .in('id', transactionIds);

      if (error) throw error;

      // Sync state
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
      return { success: true };
    } catch (err) {
      console.error('Error deleting transactions:', err);
      return { success: false, error: err.message || err };
    } finally {
      set({ isLoading: false });
    }
  },

  initAuth: () => {
    // Helper function to load profile and data for a session
    const loadSessionUser = async (session) => {
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

          if (profileData.settings) {
            const s = profileData.settings;
            set({
              templates: s.templates || get().templates,
              fromOptions: s.fromOptions || get().fromOptions,
              entityOptions: s.entityOptions || get().entityOptions,
              categoryOptions: s.categoryOptions || get().categoryOptions,
              entityMappings: s.entityMappings || get().entityMappings,
              language: s.language || get().language
            });
            if (s.language) {
              i18n.changeLanguage(s.language);
            }
          }
        }
        get().fetchKingdomData(session.user.id);
        get().fetchDashboardData(session.user.id);
      } else {
        set({ user: null, role: 'lord', email: 'guest@medieval.stuff' });
        get().resetStore();
        // Fetch guest profile data and dashboard data from Supabase
        get().fetchKingdomData('00000000-0000-0000-0000-000000000000');
        get().fetchDashboardData('00000000-0000-0000-0000-000000000000');
      }
    };

    // Load initial session immediately
    supabase.auth.getSession().then(({ data: { session } }) => {
      loadSessionUser(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      loadSessionUser(session);
    });
    return () => subscription.unsubscribe();
  },

  setLanguage: (lang) => {
    get().syncSettings({ language: lang });
    i18n.changeLanguage(lang);
  },

  resetStore: () => set({
    gold: 1000,
    gems: 100,
    xp: 0,
    level: 1,
    email: 'lord.eldoria@kingdom.gov',
    transactions: [],
    accountBalances: [],
    isLoading: false,
    language: 'en'
  })
}));

export default useKingdomStore;
