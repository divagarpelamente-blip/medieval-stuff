import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { useInteractiveStore } from '../store/useInteractiveStore';
import { useKingdomStore } from '../store/useKingdomStore';

export function useInteractiveData() {
  const user = useKingdomStore((state) => state.user);
  const filters = useInteractiveStore((state) => state.filters);

  return useQuery({
    // The queryKey acts as a dependency array. If ANY filter changes, React Query automatically refetches.
    queryKey: ['interactive_dashboard', user?.id, filters],
    queryFn: async () => {
      if (!user?.id) return null;

      // Calculate the user's exact local timezone date (YYYY-MM-DD) for accurate aging
      const clientToday = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase.rpc('get_interactive_dashboard', {
        p_profile_id: user.id,
        p_client_today: clientToday,
        p_start_date: filters.startDate,
        p_end_date: filters.endDate,
        p_status: filters.statusFilter,
        p_arrear: filters.arrearFilter,
        p_category: filters.categoryFilter
      });

      if (error) {
        console.error("Failed to fetch interactive dashboard data:", error);
        throw error;
      }
      
      return data;
    },
    // Only run the query if we have an authenticated user
    enabled: !!user?.id,
    // Cache the exact results for 5 minutes. Clicking a previously clicked filter combination is instant.
    staleTime: 1000 * 60 * 5, 
  });
}