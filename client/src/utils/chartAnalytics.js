/**
 * Eldoria V2.1 Charting & Analytics Utilities
 * Provides data transformation helpers for Recharts visualizations.
 */

/**
 * Transforms an array of transactions into chronological monthly cash flow data.
 * Merges inflows as income and outflows as expenses, ignoring neutral flows.
 * 
 * @param {Array} transactions - Raw ledger transactions from the store.
 * @returns {Array} Formatted data array for Bar charts: [{ name: 'Jan 2026', income: 1500, expenses: 800 }]
 */
export function generateCashFlowData(transactions) {
  if (!Array.isArray(transactions)) return [];
  const monthlyMap = {};

  transactions.forEach((transaction) => {
    if (!transaction.posting_date) return;
    
    // Extract YYYY-MM prefix for accurate sorting and grouping
    const monthKey = transaction.posting_date.slice(0, 7); 
    if (!monthlyMap[monthKey]) {
      monthlyMap[monthKey] = { income: 0, expenses: 0 };
    }

    const amount = Number(transaction.amount) || 0;
    if (transaction.flow === 'inflow') {
      monthlyMap[monthKey].income += amount;
    } else if (transaction.flow === 'outflow') {
      monthlyMap[monthKey].expenses += amount;
    }
  });

  // Sort chronologically by the YYYY-MM keys before converting to display names
  return Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([monthKey, data]) => {
      const [year, month] = monthKey.split('-');
      const displayDate = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
      const name = displayDate.toLocaleString('en-US', { month: 'short', year: 'numeric' });

      return {
        name,
        income: Number(data.income.toFixed(2)),
        expenses: Number(data.expenses.toFixed(2))
      };
    });
}

/**
 * Transforms an array of transactions into a cumulative net trend trendline.
 * Calculates net change per month (inflows minus outflows).
 * 
 * @param {Array} transactions - Raw ledger transactions from the store.
 * @returns {Array} Formatted data array for Line/Area charts: [{ month: 'Jan 2026', net: 700 }]
 */
export function generateNetTrendData(transactions) {
  if (!Array.isArray(transactions)) return [];
  const monthlyMap = {};

  transactions.forEach((transaction) => {
    if (!transaction.posting_date) return;

    const monthKey = transaction.posting_date.slice(0, 7);
    if (!monthlyMap[monthKey]) {
      monthlyMap[monthKey] = { net: 0 };
    }

    const amount = Number(transaction.amount) || 0;
    if (transaction.flow === 'inflow') {
      monthlyMap[monthKey].net += amount;
    } else if (transaction.flow === 'outflow') {
      monthlyMap[monthKey].net -= amount;
    }
  });

  // Sort chronologically by the YYYY-MM keys before converting to display names
  return Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([monthKey, data]) => {
      const [year, month] = monthKey.split('-');
      const displayDate = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
      const label = displayDate.toLocaleString('en-US', { month: 'short', year: 'numeric' });

      return {
        month: label,
        net: Number(data.net.toFixed(2))
      };
    });
}

/**
 * Groups and sums transactions of a specific type (e.g. Expenses, Assets) by category.
 * Filters transactions using target_account prefixes matching the 8-digit COA rules.
 * 
 * @param {Array} transactions - Raw ledger transactions from the store.
 * @param {string} targetPrefix - The starting digit prefix (e.g., '6' for Expenses, '1' for Assets).
 * @returns {Array} Formatted data array for Pie/Donut charts: [{ name: 'Taxes', value: 450 }] sorted descending.
 */
export function generateCategoryBreakdown(transactions, targetPrefix) {
  if (!Array.isArray(transactions) || !targetPrefix) return [];
  const categoryMap = {};

  transactions.forEach((transaction) => {
    const accountCode = transaction.target_account;
    
    // Check if target account code matches the specified 8-digit prefix class
    if (!accountCode || !accountCode.startsWith(targetPrefix)) return;

    const category = transaction.category || 'Uncategorized';
    const amount = Number(transaction.amount) || 0;

    categoryMap[category] = (categoryMap[category] || 0) + amount;
  });

  // Convert map to sorting-friendly array and sort descending
  return Object.entries(categoryMap)
    .map(([name, value]) => ({
      name,
      value: Number(value.toFixed(2))
    }))
    .sort((a, b) => b.value - a.value);
}