/**
 * Eldoria V2.4 Double-Entry Charting & Analytics Utilities
 * Provides mathematically accurate ledger aggregations using double-entry logic.
 */

/**
 * Transforms an array of transactions into chronological monthly cash flow data.
 * Anchors directly to account prefix classes (7xxxxxxx for Income, 6xxxxxxx for Expenses).
 * 
 * @param {Array} transactions - Raw double-entry ledger transactions.
 * @returns {Array} Formatted data array: [{ name: 'Jan 2026', income: 1500, expenses: -800 }]
 */
export function generateCashFlowData(transactions) {
  if (!Array.isArray(transactions)) return [];
  const monthlyMap = {};

  transactions.forEach((transaction) => {
    const dateStr = transaction.posting_date || transaction.date;
    if (!dateStr || dateStr.length < 7) return;

    // Extract YYYY-MM key
    const monthKey = dateStr.slice(0, 7);
    if (!monthlyMap[monthKey]) {
      monthlyMap[monthKey] = { income: 0, expenses: 0 };
    }

    const amount = Number(transaction.amount) || 0;
    const source = transaction.source_account || '';
    const target = transaction.target_account || '';

    // 1. Income calculations (anchored directly to prefix '7')
    if (source.startsWith('7')) {
      monthlyMap[monthKey].income += amount; // Standard Income generation
    }
    if (target.startsWith('7')) {
      monthlyMap[monthKey].income -= amount; // Income reversal
    }

    // 2. Expense calculations (anchored directly to prefix '6' and plotted below the zero line)
    if (target.startsWith('6')) {
      monthlyMap[monthKey].expenses -= amount; // Standard Expense occurrence
    }
    if (source.startsWith('6')) {
      monthlyMap[monthKey].expenses += amount; // Expense refund
    }
  });

  // Sort chronologically by YYYY-MM keys before converting to human-readable month names
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
 * Transforms an array of transactions into a chronological net trend of overall Net Worth.
 * Accurately processes Assets (1xxxxxxx) and Liabilities (2xxxxxxx) to output net balances.
 * 
 * @param {Array} transactions - Raw double-entry ledger transactions.
 * @returns {Array} Formatted data array: [{ month: 'Jan 2026', net: 700 }]
 */
export function generateNetTrendData(transactions) {
  if (!Array.isArray(transactions)) return [];
  const monthlyMap = {};

  transactions.forEach((transaction) => {
    const dateStr = transaction.posting_date || transaction.date;
    if (!dateStr || dateStr.length < 7) return;

    const monthKey = dateStr.slice(0, 7);
    if (!monthlyMap[monthKey]) {
      monthlyMap[monthKey] = { net: 0 };
    }

    const amount = Number(transaction.amount) || 0;
    const source = transaction.source_account || '';
    const target = transaction.target_account || '';

    // Assets ('1')
    if (target.startsWith('1')) {
      monthlyMap[monthKey].net += amount;
    }
    if (source.startsWith('1')) {
      monthlyMap[monthKey].net -= amount;
    }

    // Liabilities ('2')
    if (target.startsWith('2')) {
      monthlyMap[monthKey].net -= amount; // Taking on debt decreases net worth
    }
    if (source.startsWith('2')) {
      monthlyMap[monthKey].net += amount; // Paying off debt increases net worth
    }
  });

  // Sort chronologically by YYYY-MM keys before converting to display labels
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
 * Groups and sums transactions of a specific class (e.g. Expenses '6', Assets '1') by category.
 * Enforces dual-condition calculation mapping rules while discarding net-zero internal transfers.
 * 
 * @param {Array} transactions - Raw double-entry ledger transactions.
 * @param {string} targetPrefix - The starting 8-digit COA prefix (e.g., '6' or '1').
 * @returns {Array} Formatted category data: [{ name: 'Utilities', value: 450 }] sorted descending.
 */
export function generateCategoryBreakdown(transactions, targetPrefix) {
  if (!Array.isArray(transactions) || !targetPrefix) return [];
  const categoryMap = {};

  transactions.forEach((transaction) => {
    const source = transaction.source_account || '';
    const target = transaction.target_account || '';

    const sourceMatch = source.startsWith(targetPrefix);
    const targetMatch = target.startsWith(targetPrefix);

    // Skip internal transfers (net-zero change for the targetPrefix class overall)
    if (sourceMatch && targetMatch) return;

    const category = transaction.category || 'Uncategorized';
    const amount = Number(transaction.amount) || 0;

    // Target match increases (+) the class balance
    if (targetMatch) {
      categoryMap[category] = (categoryMap[category] || 0) + amount;
    }
    // Source match decreases (-) the class balance
    if (sourceMatch) {
      categoryMap[category] = (categoryMap[category] || 0) - amount;
    }
  });

  // Map to format list, filter exact zeros, and sort descending
  return Object.entries(categoryMap)
    .map(([name, value]) => ({
      name,
      value: Number(value.toFixed(2))
    }))
    .filter((item) => item.value !== 0)
    .sort((a, b) => b.value - a.value);
}