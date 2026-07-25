/**
 * Eldoria V3.0 Optimized Charting & Analytics Utilities
 * Formats pre-aggregated Supabase Views (Server-Side) for Recharts rendering.
 * Eliminates heavy client-side loops and calculations.
 */

/**
 * Transforms pre-aggregated monthly data into chronological cash flow for Recharts.
 * @param {Array} monthlyView - Data from vw_monthly_analytics
 */
export function generateCashFlowData(monthlyView) {
  if (!Array.isArray(monthlyView)) return [];
  const map = {};

  monthlyView.forEach(row => {
    // Parse the date safely
    const date = new Date(row.month_date);
    const name = date.toLocaleString('en-US', { month: 'short', year: 'numeric' });
    
    if (!map[name]) map[name] = { name, income: 0, expenses: 0 };
    
    const amount = Number(row.total_amount) || 0;
    
    // Map based on the normalized type
    if (row.type === 'Income') {
      map[name].income += amount;
    } else if (row.type === 'Expenses') {
      // Recharts standard: plot expenses below the zero line
      map[name].expenses -= Math.abs(amount);
    }
  });

  return Object.values(map);
}

/**
 * Transforms pre-aggregated cumulative data into a net worth trend line.
 * @param {Array} cumulativeView - Data from vw_cumulative_trends
 */
export function generateNetTrendData(cumulativeView) {
  if (!Array.isArray(cumulativeView)) return [];
  const map = {};

  cumulativeView.forEach(row => {
    const date = new Date(row.month_date);
    const month = date.toLocaleString('en-US', { month: 'short', year: 'numeric' });
    
    if (!map[month]) map[month] = { month, net: 0, assets: 0, liabilities: 0 };
    
    const amount = Number(row.cumulative_amount) || 0;

    if (row.type === 'Assets' || row.type === 'Asset') {
      map[month].assets += amount;
      map[month].net += amount;
    } else if (row.type === 'Liabilities' || row.type === 'Liability') {
      map[month].liabilities += amount;
      map[month].net -= amount; 
    }
  });

  return Object.values(map);
}

/**
 * Calculates a running cumulative total of net cash flow over time.
 * @param {Array} cumulativeView - Data from vw_cumulative_trends
 */
export function generateCumulativeCashFlowData(cumulativeView) {
  if (!Array.isArray(cumulativeView)) return [];
  const map = {};

  cumulativeView.forEach(row => {
    const date = new Date(row.month_date);
    const name = date.toLocaleString('en-US', { month: 'short', year: 'numeric' });
    
    if (!map[name]) map[name] = { name, cumulative: 0 };
    
    const amount = Number(row.cumulative_amount) || 0;

    if (row.type === 'Income') map[name].cumulative += amount;
    if (row.type === 'Expenses') map[name].cumulative -= amount;
  });

  return Object.values(map);
}

/**
 * Groups and formats the category view for Pie Charts.
 * @param {Array} categoryView - Data from vw_category_balances
 * @param {string} targetType - Ex: 'Expenses', 'Income', 'Assets'
 * @param {string} groupBy - The key to group by (default: 'category')
 */
export function generateCategoryBreakdown(categoryView, targetType, groupBy = 'category') {
  if (!Array.isArray(categoryView) || !targetType) return [];
  const map = {};

  categoryView.forEach(row => {
    if (row.type !== targetType) return;
    
    const groupKey = row[groupBy] || 'Uncategorized';
    const amount = Number(row.total_volume) || 0;

    map[groupKey] = (map[groupKey] || 0) + amount;
  });

  return Object.entries(map)
    .map(([name, value]) => ({
      name,
      value: Number(value.toFixed(2))
    }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value);
}

/**
 * Formats Entity Exposure for tables and bar charts.
 * @param {Array} entityView - Data from vw_entity_exposure
 * @param {string} targetType - Ex: 'Expenses'
 */
export function getEntityExposure(entityView, targetType, limit = 10) {
  if (!Array.isArray(entityView)) return [];
  
  return entityView
    .filter(row => row.type === targetType && row.entity)
    .map(row => ({
      name: row.entity,
      value: Number(row.total_volume),
      count: row.transaction_count
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

/**
 * Phase 3 Ratios - Now heavily simplified using daily views and dashboard metrics.
 */
export function calculateRatioKPIs(dailyView, metrics) {
  if (!Array.isArray(dailyView) || !metrics) return {};

  let totalDailyExpenses = 0;
  let activeDays = new Set();

  dailyView.forEach(row => {
    if (row.type === 'Expenses') {
      totalDailyExpenses += Number(row.total_amount);
      activeDays.add(row.day_date);
    }
  });

  const daysCount = activeDays.size || 1;
  const avgDailyExpense = totalDailyExpenses / daysCount;
  const avgMonthlyExpense = avgDailyExpense * 30.44;

  const survivalMonths = avgMonthlyExpense > 0 
    ? (metrics.net_vault_cash || 0) / avgMonthlyExpense 
    : 0;

  const debtRatio = metrics.total_assets > 0 
    ? (metrics.total_liabilities / metrics.total_assets) * 100 
    : 0;

  return {
    avgMonthlyExpense,
    avgDailyExpense,
    survivalMonths,
    debtRatio
  };
}

/**
 * Extracts latest general transactions and internal transfers (Phase 4A).
 * These still use the raw transaction array from the paginated ledger store.
 */
export function getRecentTransactions(transactions, limit = 10) {
  if (!Array.isArray(transactions)) return [];
  return [...transactions]
    .sort((a, b) => new Date(b.posting_date) - new Date(a.posting_date))
    .slice(0, limit);
}

export function getInternalTransfers(transactions, limit = 10) {
  if (!Array.isArray(transactions)) return [];
  return transactions
    .filter(t => t.flow === 'neutral' || (t.source_account && t.target_account && t.source_account[0] === t.target_account[0]))
    .sort((a, b) => new Date(b.posting_date) - new Date(a.posting_date))
    .slice(0, limit);
}