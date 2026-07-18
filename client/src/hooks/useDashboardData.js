import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import {
  generateCashFlowData,
  generateNetTrendData,
  generateCategoryBreakdown
} from '../utils/chartAnalytics';

/**
 * Root query fetching raw transaction scrolls for the active profile session.
 * Cached globally under the ['ledger-transactions'] key.
 */
export function useRawTransactionsQuery() {
  return useQuery({
    queryKey: ['ledger-transactions'],
    queryFn: async () => {
      // Access auth session to isolate user space
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id || null;

      let query = supabase
        .from('transactions')
        .select('*')
        .order('posting_date', { ascending: false });

      if (userId) {
        query = query.eq('profile_id', userId);
      } else {
        query = query.is('profile_id', null); // Sandbox fallback
      }

      const { data, error } = await query;
      if (error) {
        console.error('Failed to query ledger logs for cached state:', error);
        throw error;
      }
      return data || [];
    },
    staleTime: 1000 * 60 * 5, // Data remains fresh for 5 minutes
    cacheTime: 1000 * 60 * 30, // Retained in cache for 30 minutes
    refetchOnWindowFocus: false
  });
}

/**
 * Derives cash flow metrics (Income/Expense over time) from raw transactions.
 */
export function useCashFlowQuery() {
  const { data: rawTransactions, ...rest } = useRawTransactionsQuery();

  return {
    ...rest,
    data: useQuery({
      queryKey: ['cash-flow-data'],
      queryFn: () => generateCashFlowData(rawTransactions || []),
      enabled: !!rawTransactions,
      initialData: [],
    }).data
  };
}

/**
 * Derives cumulative net trend position (Assets/Net Worth trend) over time.
 */
export function useNetTrendQuery() {
  const { data: rawTransactions, ...rest } = useRawTransactionsQuery();

  return {
    ...rest,
    data: useQuery({
      queryKey: ['net-trend-data'],
      queryFn: () => generateNetTrendData(rawTransactions || []),
      enabled: !!rawTransactions,
      initialData: [],
    }).data
  };
}

/**
 * Derives current asset distribution matching COA 8-digit rules (1xxxxxxx).
 */
export function useAssetAllocationQuery() {
  const { data: rawTransactions, ...rest } = useRawTransactionsQuery();

  return {
    ...rest,
    data: useQuery({
      queryKey: ['asset-allocation-data'],
      queryFn: () => generateCategoryBreakdown(rawTransactions || [], '1'),
      enabled: !!rawTransactions,
      initialData: [],
    }).data
  };
}

/**
 * Derives current expense distributions matching COA 8-digit rules (6xxxxxxx).
 */
export function useExpenseAllocationQuery() {
  const { data: rawTransactions, ...rest } = useRawTransactionsQuery();

  return {
    ...rest,
    data: useQuery({
      queryKey: ['expense-allocation-data'],
      queryFn: () => generateCategoryBreakdown(rawTransactions || [], '6'),
      enabled: !!rawTransactions,
      initialData: [],
    }).data
  };
}