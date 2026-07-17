import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'react-hot-toast';

// Helper function to normalize transaction type to match the strict database check constraint
const normalizeType = (type) => {
  if (!type) return type;
  const lower = type.trim().toLowerCase();
  if (lower === 'expenses' || lower === 'expense') {
    return 'Expense';
  }
  return type;
};

export const useKingdomStore = create((set, get) => ({
  // ==========================================
  // 1. CORE STATE
  // ==========================================
  user: null,
  email: 'guest@medieval.stuff',
  role: 'lord',
  isLoading: false,
  isLedgerLoading: false,
  
  // Gamification State
  gold: 0,
  gems: 100,
  xp: 0,
  level: 1,
  mineLevel: 1,
  lastCollectionTime: null,

  // Data State
  flatMatrix: [], 
  transactions: [], 
  accountBalances: [],

  // Scalable Server-Side Dashboard Aggregations
  dashboardMetrics: {
    total_assets: 0,
    total_liabilities: 0,
    net_worth: 0,
    net_vault_cash: 0
  },

  // ==========================================
  // 2. AUTHENTICATION PIPELINE
  // ==========================================
  initAuth: () => {
    const loadSessionUser = async (session) => {
      if (session?.user) {
        set({ user: session.user, email: session.user.email });
        await get().fetchKingdomData(session.user.id);
        await get().fetchFlatMatrix();
        await get().fetchDashboardMetrics();
      } else {
        set({ user: null, email: 'guest@medieval.stuff' });
        get().resetStore();
      }
    };

    // Initial check
    supabase.auth.getSession().then(({ data: { session } }) => {
      loadSessionUser(session);
    });

    // Listen for changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      loadSessionUser(session);
    });

    return () => subscription.unsubscribe();
  },

  // ==========================================
  // 3. FLAT MATRIX & OMNI-DIRECTIONAL HELPERS
  // ==========================================
  fetchFlatMatrix: async () => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('dim_contas')
        .select('*')
        .order('code', { ascending: true });

      if (error) throw error;
      if (data) {
        set({ flatMatrix: data });
      }
    } catch (err) {
      console.error('Failed to fetch Flat Matrix (dim_contas):', err);
      toast.error('Failed to load chart of accounts matrix.');
    } finally {
      set({ isLoading: false });
    }
  },

  getTypes: () => {
    const matrix = get().flatMatrix || [];
    const uniqueTypes = [...new Set(matrix.map(row => {
      const norm = normalizeType(row.type);
      return norm;
    }).filter(Boolean))];
    
    const preferredOrder = ['Assets', 'Liabilities', 'Income', 'Expense', 'Receivable', 'Payable'];
    return uniqueTypes.sort((a, b) => {
      const idxA = preferredOrder.indexOf(a);
      const idxB = preferredOrder.indexOf(b);
      return (idxA > -1 ? idxA : 99) - (idxB > -1 ? idxB : 99);
    });
  },

  // ==========================================
  // 4. BACKEND METRICS AGGREGATION RPC
  // ==========================================
  fetchDashboardMetrics: async () => {
    const userId = get().user?.id || null;
    try {
      const { data, error } = await supabase
        .rpc('get_dashboard_metrics', { p_profile_id: userId });

      if (error) throw error;

      if (data && data[0]) {
        set({
          dashboardMetrics: {
            total_assets: Number(data[0].total_assets) || 0,
            total_liabilities: Number(data[0].total_liabilities) || 0,
            net_worth: Number(data[0].net_worth) || 0,
            net_vault_cash: Number(data[0].net_vault_cash) || 0
          }
        });
      }
    } catch (err) {
      console.error('Error invoking server-side metrics RPC:', err);
    }
  },

  // ==========================================
  // 5. TRANSACTIONS PIPELINE WITH PAGINATION
  // ==========================================
  fetchTransactions: async (limit = 50, offset = 0) => {
    set({ isLedgerLoading: true });
    try {
      const userId = get().user?.id;
      let query = supabase
        .from('transactions')
        .select('*')
        .order('posting_date', { ascending: false })
        .range(offset, offset + limit - 1);

      if (userId) {
        query = query.eq('profile_id', userId);
      } else {
        query = query.is('profile_id', null);
      }

      const { data, error } = await query;
      if (error) throw error;

      if (offset === 0) {
        set({ transactions: data || [] });
      } else {
        set((state) => ({
          transactions: [...state.transactions, ...(data || [])]
        }));
      }
    } catch (err) {
      console.error('Failed to query ledger transactions:', err);
      toast.error('Failed to sync transactional scrolls.');
    } finally {
      set({ isLedgerLoading: false });
    }
  },

  addTransaction: async (payload) => {
    set({ isLedgerLoading: true });
    try {
      const userId = get().user?.id;
      
      const formattedPayload = {
        profile_id: userId || null,
        value_date: payload.value_date,
        posting_date: payload.posting_date,
        payment_date: payload.payment_date || null,
        amount: Number(payload.amount),
        target_account: payload.target_account,
        source_account: payload.source_account || null,
        flow: payload.flow,
        payment_status: payload.payment_status || 'Completed',
        type: normalizeType(payload.type),
        subtype: payload.subtype || null,
        category: payload.category || null,
        entity: payload.entity || null,
        description: payload.description || '',
        origin: payload.origin || 'Web Client'
      };

      const { data, error } = await supabase
        .from('transactions')
        .insert([formattedPayload])
        .select();

      if (error) throw error;

      toast.success('Transaction logged successfully.');

      if (data && data[0]) {
        set((state) => ({
          transactions: [data[0], ...state.transactions]
        }));
      }

      // Sync state and server metrics on success
      await get().fetchDashboardMetrics();

      if (userId) {
        await get().fetchKingdomData(userId);
      }

      return { success: true, data };
    } catch (err) {
      console.error('Failed to add transaction:', err);
      toast.error(`Ledger Error: ${err.message || err}`);
      return { success: false, error: err };
    } finally {
      set({ isLedgerLoading: false });
    }
  },

  updateTransaction: async (id, payload) => {
    set({ isLedgerLoading: true });
    try {
      // Normalize type payload values to respect database constraints
      const normalizedPayload = { ...payload };
      if (payload.type) {
        normalizedPayload.type = normalizeType(payload.type);
      }

      const { data, error } = await supabase
        .from('transactions')
        .update(normalizedPayload)
        .eq('id', id)
        .select();

      if (error) throw error;
      
      if (data && data[0]) {
        set((state) => ({
          transactions: state.transactions.map((t) => (t.id === id ? data[0] : t))
        }));
      }

      // Sync state and server metrics on success
      await get().fetchDashboardMetrics();

      const userId = get().user?.id;
      if (userId) {
        await get().fetchKingdomData(userId);
      }

      return { success: true, data };
    } catch (err) {
      console.error('Error updating transaction:', err);
      throw err; 
    } finally {
      set({ isLedgerLoading: false });
    }
  },

  deleteTransaction: async (id) => {
    set({ isLedgerLoading: true });
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        transactions: state.transactions.filter((t) => t.id !== id)
      }));

      // Sync state and server metrics on success
      await get().fetchDashboardMetrics();

      const userId = get().user?.id;
      if (userId) {
        await get().fetchKingdomData(userId);
      }

      return { success: true };
    } catch (err) {
      console.error('Error deleting transaction:', err);
      throw err;
    } finally {
      set({ isLedgerLoading: false });
    }
  },

  // ==========================================
  // 6. GAMIFICATION & PROFILES
  // ==========================================
  fetchKingdomData: async (userId) => {
    set({ isLoading: true });
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) throw profileError;

      if (profile) {
        set({
          gold: Number(profile.gold) || 0,
          gems: Number(profile.gems) || 100,
          level: profile.level || 1,
          xp: profile.xp || 0,
          role: profile.role || 'lord'
        });
      }
    } catch (err) {
      console.error('Failed to fetch kingdom profile:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  resetStore: () => set({
    flatMatrix: [],
    gold: 0,
    gems: 100,
    xp: 0,
    level: 1,
    mineLevel: 1,
    lastCollectionTime: null,
    transactions: [],
    isLedgerLoading: false,
    accountBalances: [],
    dashboardMetrics: {
      total_assets: 0,
      total_liabilities: 0,
      net_worth: 0,
      net_vault_cash: 0
    }
  })
}));

export default useKingdomStore;