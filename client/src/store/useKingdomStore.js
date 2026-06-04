import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';

export const useKingdomStore = create((set, get) => ({
  gold: 1000,
  gems: 100,
  xp: 0,
  level: 1,
  email: 'lord.eldoria@kingdom.gov',
  transactions: [],
  isLoading: false,

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

  resetStore: () => set({
    gold: 1000,
    gems: 100,
    xp: 0,
    level: 1,
    email: 'lord.eldoria@kingdom.gov',
    transactions: [],
    isLoading: false
  })
}));

export default useKingdomStore;
