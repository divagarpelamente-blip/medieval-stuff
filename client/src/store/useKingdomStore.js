import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'react-hot-toast';

// Helper function to normalize transaction type to match the strict database check constraint
const normalizeType = (type) => {
  if (!type) return type;
  const lower = type.trim().toLowerCase();
  if (lower === 'expenses' || lower === 'expense') {
    return 'Expenses';
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
  isAnalyticsLoading: false,
  
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

  // State for the aggregated views (Phase 1 Database Optimization)
  analytics: {
    monthly: [],
    category: [],
    entity: [],
    cumulative: [],
    daily: [],
    balances: [] // NOVA ADIÇÃO: Armazena os saldos reais das contas
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
        
        await get().fetchTransactions();
        await get().fetchAnalytics(); 
      } else {
        set({ user: null, email: 'guest@medieval.stuff' });
        get().resetStore();
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      loadSessionUser(session);
    });

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
    
    const preferredOrder = ['Assets', 'Liabilities', 'Income', 'Expenses', 'Receivable', 'Payable'];
    return uniqueTypes.sort((a, b) => {
      const idxA = preferredOrder.indexOf(a);
      const idxB = preferredOrder.indexOf(b);
      return (idxA > -1 ? idxA : 99) - (idxB > -1 ? idxB : 99);
    });
  },

  // ==========================================
  // 4. BACKEND METRICS & ANALYTICS RPC
  // ==========================================
  fetchDashboardMetrics: async () => {
    const userId = get().user?.id || null;

    if (!userId || userId === '00000000-0000-0000-0000-000000000000') {
      console.warn("Hydration paused: Waiting for secure auth handshake.");
      return; 
    }

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

  fetchAnalytics: async () => {
    const userId = get().user?.id;
    if (!userId) return;

    set({ isAnalyticsLoading: true });
    try {
      const [
        { data: monthly },
        { data: category },
        { data: entity },
        { data: cumulative },
        { data: daily },
        { data: balances } // NOVA ADIÇÃO: Fetch dos saldos
      ] = await Promise.all([
        supabase.from('vw_monthly_analytics').select('*').order('month_date', { ascending: true }),
        supabase.from('vw_category_balances').select('*'),
        supabase.from('vw_entity_exposure').select('*'),
        supabase.from('vw_cumulative_trends').select('*').order('month_date', { ascending: true }),
        supabase.from('vw_daily_analytics').select('*').order('day_date', { ascending: true }),
        supabase.from('vw_account_balances').select('*') // O novo endpoint da base de dados
      ]);

      set({
        analytics: {
          monthly: monthly || [],
          category: category || [],
          entity: entity || [],
          cumulative: cumulative || [],
          daily: daily || [],
          balances: balances || []
        }
      });
    } catch (err) {
      console.error('Failed to fetch optimized analytics views:', err);
    } finally {
      set({ isAnalyticsLoading: false });
    }
  },

  // ==========================================
  // 5. TRANSACTIONS PIPELINE WITH OPTIMISTIC UI
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

    const tempId = `temp-${Date.now()}`;
    const optimisticTx = { ...formattedPayload, id: tempId };
    
    set((state) => ({
      transactions: [optimisticTx, ...state.transactions]
    }));

    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert([formattedPayload])
        .select();

      if (error) throw error;

      toast.success('Transaction logged successfully.');

      if (data && data[0]) {
        set((state) => ({
          transactions: state.transactions.map(t => t.id === tempId ? data[0] : t)
        }));
      }

      get().fetchDashboardMetrics();
      get().fetchAnalytics();
      
      return { success: true, data };
    } catch (err) {
      console.error('Failed to add transaction:', err);
      
      set((state) => ({
        transactions: state.transactions.filter(t => t.id !== tempId)
      }));
      
      toast.error(`Ledger Error: ${err.message || err}`);
      return { success: false, error: err };
    }
  },

  updateTransaction: async (id, payload) => {
    set({ isLedgerLoading: true });
    try {
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

      get().fetchDashboardMetrics();
      get().fetchAnalytics();

      return { success: true, data };
    } catch (err) {
      console.error('Error updating transaction:', err);
      throw err; 
    } finally {
      set({ isLedgerLoading: false });
    }
  },

  deleteTransaction: async (id) => {
    const previousTransactions = get().transactions;
    set((state) => ({
      transactions: state.transactions.filter((t) => t.id !== id)
    }));

    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      get().fetchDashboardMetrics();
      get().fetchAnalytics();

      return { success: true };
    } catch (err) {
      console.error('Error deleting transaction:', err);
      set({ transactions: previousTransactions });
      toast.error('Failed to delete transaction.');
      throw err;
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
    isAnalyticsLoading: false,
    accountBalances: [],
    dashboardMetrics: {
      total_assets: 0,
      total_liabilities: 0,
      net_worth: 0,
      net_vault_cash: 0
    },
    analytics: {
      monthly: [],
      category: [],
      entity: [],
      cumulative: [],
      daily: [],
      balances: []
    }
  })
}));

export default useKingdomStore;