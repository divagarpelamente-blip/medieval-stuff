import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'react-hot-toast';

export const useKingdomStore = create((set, get) => ({
  // ==========================================
  // 1. CORE STATE
  // ==========================================
  user: null,
  email: 'guest@medieval.stuff',
  role: 'lord',
  isLoading: false,
  
  // Gamification State
  gold: 0,
  gems: 100,
  xp: 0,
  level: 1,
  mineLevel: 1,
  lastCollectionTime: null,

  // Data State
  flatMatrix: [], // Single Source of Truth for V2.0
  transactions: [],
  accountBalances: [],

  // ==========================================
  // 2. AUTHENTICATION PIPELINE
  // ==========================================
  initAuth: () => {
    const loadSessionUser = async (session) => {
      if (session?.user) {
        set({ user: session.user, email: session.user.email });
        await get().fetchKingdomData(session.user.id);
        await get().fetchChartOfAccounts();
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
  // 3. FLAT MATRIX & OMNI-DIRECTIONAL HELPERS (V2.0)
  // ==========================================
  fetchChartOfAccounts: async () => {
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
      console.error('Failed to fetch Chart of Accounts (dim_contas):', err);
      toast.error('Failed to load taxonomy matrix.');
    } finally {
      set({ isLoading: false });
    }
  },

  getTypes: () => {
    const matrix = get().flatMatrix || [];
    const uniqueTypes = [...new Set(matrix.map(row => row.type).filter(Boolean))];
    const preferredOrder = ['Assets', 'Liabilities', 'Income', 'Expense'];
    return uniqueTypes.sort((a, b) => preferredOrder.indexOf(a) - preferredOrder.indexOf(b));
  },

  getSubtypesByType: (type) => {
    const matrix = get().flatMatrix || [];
    return [...new Set(
      matrix.filter(row => !type || row.type === type).map(row => row.subtype).filter(Boolean)
    )].sort();
  },

  getCategoriesBySubtype: (subtype) => {
    const matrix = get().flatMatrix || [];
    return [...new Set(
      matrix.filter(row => !subtype || row.subtype === subtype).map(row => row.category).filter(Boolean)
    )].sort();
  },

  getEntitiesByCategory: (category) => {
    const matrix = get().flatMatrix || [];
    return [...new Set(
      matrix.filter(row => !category || row.category === category).map(row => row.entity).filter(Boolean)
    )].sort();
  },

  getAccountCode: (type, subtype, category, entity) => {
    const matrix = get().flatMatrix || [];
    const match = matrix.find(row => 
      row.type === type &&
      row.subtype === subtype &&
      row.category === category &&
      row.entity === entity
    );
    return match ? match.code : '';
  },

  // ==========================================
  // 4. GAMIFICATION & PROFILES
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

      const { data: mineData } = await supabase
        .from('buildings')
        .select('*')
        .eq('profile_id', userId)
        .eq('building_type', 'gold_mine')
        .maybeSingle();

      if (mineData) {
        set({
          mineLevel: mineData.level,
          lastCollectionTime: mineData.last_collection
        });
      }
    } catch (err) {
      console.error('Failed to fetch kingdom profile:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  collectPassiveGold: async () => {
    const userId = get().user?.id;
    if (!userId) return 0;
    
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.rpc('collect_passive_gold', {
        p_profile_id: userId
      });
      if (error) throw error;

      const goldCollected = Number(data) || 0;
      if (goldCollected > 0) {
        toast.success(`Claimed ${goldCollected} Gold and gained ${goldCollected * 2} XP!`);
        await get().fetchKingdomData(userId);
      } else {
        toast.error("Not enough passive gold accumulated yet!");
      }
      return goldCollected;
    } catch (err) {
      console.error('Error claiming passive gold:', err);
      toast.error('Failed to claim passive gold.');
      return 0;
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
    accountBalances: []
  })
}));

export default useKingdomStore;