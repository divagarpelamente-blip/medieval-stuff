import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { useInteractiveStore } from '../store/useInteractiveStore';
import { useKingdomStore } from '../store/useKingdomStore';

export function useInteractiveData() {
  const user = useKingdomStore((state) => state.user);
  const filters = useInteractiveStore((state) => state.filters);

  return useQuery({
    queryKey: ['interactive_dashboard', user?.id, filters],
    queryFn: async () => {
      if (!user?.id) return null;

      const clientToday = new Date().toISOString().split('T')[0];

      // Strict || null enforcement prevents empty strings ("") from crashing the SQL RPC
      const { data, error } = await supabase.rpc('get_interactive_dashboard', {
        p_profile_id: user.id,
        p_client_today: clientToday,
        p_start_date: filters.startDate || null,
        p_end_date: filters.endDate || null,
        p_month: filters.monthFilter || null,
        p_status: filters.statusFilter || null,
        p_arrear: filters.arrearFilter || null,
        p_category: filters.categoryFilter || null,
        p_entity: filters.entityFilter || null
      });

      if (error) {
        console.error("Failed to fetch interactive dashboard data:", error);
        throw error;
      }
      
      return data;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, 
  });
}