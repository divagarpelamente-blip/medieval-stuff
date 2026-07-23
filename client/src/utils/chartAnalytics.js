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
 * @param {Array} transactions - Raw double-entry ledger transactions.
 * @returns {Array} Formatted data array: [{ month: 'Jan 2026', net: 700, assets: 1200, liabilities: 500 }]
 */
export function generateNetTrendData(transactions) {
  if (!Array.isArray(transactions)) return [];
  const monthlyMap = {};

  transactions.forEach((transaction) => {
    const dateStr = transaction.posting_date || transaction.date;
    if (!dateStr || dateStr.length < 7) return;

    const monthKey = dateStr.slice(0, 7);
    if (!monthlyMap[monthKey]) {
      monthlyMap[monthKey] = { net: 0, assets: 0, liabilities: 0 };
    }

    const amount = Number(transaction.amount) || 0;
    const source = transaction.source_account || '';
    const target = transaction.target_account || '';

    // Assets ('1')
    if (target.startsWith('1')) {
      monthlyMap[monthKey].assets += amount;
      monthlyMap[monthKey].net += amount;
    }
    if (source.startsWith('1')) {
      monthlyMap[monthKey].assets -= amount;
      monthlyMap[monthKey].net -= amount;
    }

    // Liabilities ('2')
    if (target.startsWith('2')) {
      monthlyMap[monthKey].liabilities += amount;
      monthlyMap[monthKey].net -= amount; // Taking on debt decreases net worth
    }
    if (source.startsWith('2')) {
      monthlyMap[monthKey].liabilities -= amount;
      monthlyMap[monthKey].net += amount; // Paying off debt increases net worth
    }
  });

  return Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([monthKey, data]) => {
      const [year, month] = monthKey.split('-');
      const displayDate = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
      return {
        month: displayDate.toLocaleString('en-US', { month: 'short', year: 'numeric' }),
        net: Number(data.net.toFixed(2)),
        assets: Number(data.assets.toFixed(2)),
        liabilities: Number(data.liabilities.toFixed(2))
      };
    });
}

/**
 * Calculates a running cumulative total of net cash flow over time.
 * @param {Array} transactions - Raw double-entry ledger transactions.
 * @returns {Array} Formatted data array: [{ name: 'Jan 2026', cumulative: 700 }]
 */
export function generateCumulativeCashFlowData(transactions) {
  const baseData = generateCashFlowData(transactions);
  let cumulative = 0;
  return baseData.map(d => {
    cumulative += (d.income + d.expenses); // expenses are already negative
    return {
      name: d.name,
      cumulative: Number(cumulative.toFixed(2))
    };
  });
}

/**
 * Groups and sums transactions of a specific class by a dynamic key (category or subtype).
 * Enforces dual-condition calculation mapping rules while discarding net-zero internal transfers.
 * 
 * @param {Array} transactions - Raw double-entry ledger transactions.
 * @param {string} targetPrefix - The starting 8-digit COA prefix (e.g., '6' or '1').
 * @param {string} groupBy - The transaction object key to group by (default: 'category').
 * @returns {Array} Formatted category data: [{ name: 'Utilities', value: 450 }] sorted descending.
 */
export function generateCategoryBreakdown(transactions, targetPrefix, groupBy = 'category') {
  if (!Array.isArray(transactions) || !targetPrefix) return [];
  const categoryMap = {};

  transactions.forEach((transaction) => {
    const source = transaction.source_account || '';
    const target = transaction.target_account || '';

    const sourceMatch = source.startsWith(targetPrefix);
    const targetMatch = target.startsWith(targetPrefix);

    if (sourceMatch && targetMatch) return;

    const groupKey = transaction[groupBy] || 'Uncategorized';
    const amount = Number(transaction.amount) || 0;

    if (targetMatch) categoryMap[groupKey] = (categoryMap[groupKey] || 0) + amount;
    if (sourceMatch) categoryMap[groupKey] = (categoryMap[groupKey] || 0) - amount;
  });

  return Object.entries(categoryMap)
    .map(([name, value]) => ({
      name,
      value: Number(value.toFixed(2))
    }))
    .filter((item) => item.value > 0) // Only show positive accumulations in pies
    .sort((a, b) => b.value - a.value);
}

/**
 * Calculates total gross income using double-entry logic for Class 7 accounts.
 * @param {Array} transactions - Raw double-entry ledger transactions.
 * @returns {Number} Total income amount.
 */
export function calculateTotalIncome(transactions) {
  if (!Array.isArray(transactions)) return 0;
  return transactions.reduce((sum, transaction) => {
    const amount = Number(transaction.amount) || 0;
    const source = transaction.source_account || '';
    const target = transaction.target_account || '';
    
    let incomeDelta = 0;
    // Source = 7 means income generated (+). Target = 7 means income reversal/refund (-).
    if (source.startsWith('7')) incomeDelta += amount;
    if (target.startsWith('7')) incomeDelta -= amount;
    
    return sum + incomeDelta;
  }, 0);
}

/**
 * Unified O(n) calculator for Phase 1 Base KPIs.
 * Processes the double-entry ledger once to return all top-level metrics.
 * @param {Array} transactions - Raw double-entry ledger transactions.
 * @returns {Object} Key-value pairs of all calculated KPIs.
 */
export function calculateLedgerKPIs(transactions) {
  if (!Array.isArray(transactions)) return {
    totalIncome: 0, totalExpenses: 0, netCashFlow: 0,
    totalAssets: 0, immediateLiquidity: 0, totalInvestments: 0,
    totalLiabilities: 0, netWorth: 0
  };

  let kpi = {
    totalIncome: 0, totalExpenses: 0,
    totalAssets: 0, immediateLiquidity: 0, totalInvestments: 0,
    totalLiabilities: 0
  };

  transactions.forEach(t => {
    const amount = Number(t.amount) || 0;
    const source = t.source_account || '';
    const target = t.target_account || '';

    // 1. Income (Prefix 7)
    if (source.startsWith('7')) kpi.totalIncome += amount;
    if (target.startsWith('7')) kpi.totalIncome -= amount;

    // 2. Expenses (Prefix 6)
    if (target.startsWith('6')) kpi.totalExpenses += amount;
    if (source.startsWith('6')) kpi.totalExpenses -= amount;

    // 3. Assets (Prefix 1)
    if (target.startsWith('1')) {
      kpi.totalAssets += amount;
      if (target.startsWith('1101') || target.startsWith('1102') || target.startsWith('1103')) kpi.immediateLiquidity += amount;
      if (target.startsWith('1301') || target.startsWith('1302')) kpi.totalInvestments += amount;
    }
    if (source.startsWith('1')) {
      kpi.totalAssets -= amount;
      if (source.startsWith('1101') || source.startsWith('1102') || source.startsWith('1103')) kpi.immediateLiquidity -= amount;
      if (source.startsWith('1301') || source.startsWith('1302')) kpi.totalInvestments -= amount;
    }

    // 4. Liabilities (Prefix 2) - Standard balance (taking debt increases balance)
    if (target.startsWith('2')) kpi.totalLiabilities += amount;
    if (source.startsWith('2')) kpi.totalLiabilities -= amount;
  });

  return {
    ...kpi,
    netCashFlow: kpi.totalIncome - kpi.totalExpenses,
    netWorth: kpi.totalAssets - kpi.totalLiabilities
  };
}

/**
 * Calculates the split between Short-Term (21xxxx) and Long-Term (22xxxx) Debt.
 * @param {Array} transactions - Raw double-entry ledger transactions.
 * @returns {Array} Formatted array for Pie Charts.
 */
export function generateDebtHorizonBreakdown(transactions) {
  if (!Array.isArray(transactions)) return [];
  let shortTerm = 0;
  let longTerm = 0;
  
  transactions.forEach(t => {
    const amount = Number(t.amount) || 0;
    const source = t.source_account || '';
    const target = t.target_account || '';
    
    if (target.startsWith('21')) shortTerm += amount;
    if (source.startsWith('21')) shortTerm -= amount;
    
    if (target.startsWith('22')) longTerm += amount;
    if (source.startsWith('22')) longTerm -= amount;
  });
  
  return [
    { name: 'Short-Term Debt', value: Number(shortTerm.toFixed(2)) },
    { name: 'Long-Term Debt', value: Number(longTerm.toFixed(2)) }
  ].filter(item => item.value > 0);
}

/**
 * Finds the single largest transactions for a given prefix (e.g., '6' for expenses).
 * @param {Array} transactions - Raw double-entry ledger transactions.
 * @param {string} prefix - Target account prefix filter.
 * @param {number} limit - Maximum rows to return.
 */
export function getLargestTransactions(transactions, prefix = '6', limit = 10) {
  if (!Array.isArray(transactions)) return [];
  return transactions
    .filter(t => (t.target_account || '').startsWith(prefix))
    .sort((a, b) => Number(b.amount) - Number(a.amount))
    .slice(0, limit);
}

/**
 * Calculates running balances for Asset accounts ('1') to find the top capitalized accounts.
 * @param {Array} transactions - Raw double-entry ledger transactions.
 * @param {number} limit - Maximum rows to return.
 */
export function getTopAccountsByBalance(transactions, limit = 5) {
  if (!Array.isArray(transactions)) return [];
  const balances = {};
  const entities = {};
  
  transactions.forEach(t => {
    const amount = Number(t.amount) || 0;
    const target = t.target_account || '';
    const source = t.source_account || '';
    
    if (target.startsWith('1')) {
      balances[target] = (balances[target] || 0) + amount;
      entities[target] = t.entity || target;
    }
    if (source.startsWith('1')) {
      balances[source] = (balances[source] || 0) - amount;
      entities[source] = t.entity || source;
    }
  });

  return Object.entries(balances)
    .map(([account, balance]) => ({ 
      account, 
      entity: entities[account],
      balance: Number(balance.toFixed(2)) 
    }))
    .filter(a => a.balance > 0)
    .sort((a, b) => b.balance - a.balance)
    .slice(0, limit);
}

/**
 * Unified calculator for Phase 3 Composite Ratios & Metrics.
 * Leverages base KPIs and time-series trends to generate complex financial ratios.
 * @param {Array} transactions - Raw double-entry ledger transactions.
 * @returns {Object} Key-value pairs of calculated ratios.
 */
export function calculateRatioKPIs(transactions) {
  if (!Array.isArray(transactions)) return {};

  const baseKpis = calculateLedgerKPIs(transactions);
  const uniqueMonths = new Set();
  let debtOutflows = 0;

  transactions.forEach(t => {
    if (t.posting_date) {
      uniqueMonths.add(t.posting_date.slice(0, 7));
    }
    const amount = Number(t.amount) || 0;
    const target = t.target_account || '';
    const source = t.source_account || '';
    
    // Debt outflows (paying off debt): source is asset ('1'), target is debt ('2')
    if (source.startsWith('1') && target.startsWith('2')) {
      debtOutflows += amount;
    }
  });

  const activeMonthsCount = uniqueMonths.size || 1;
  const avgMonthlyExpense = baseKpis.totalExpenses / activeMonthsCount;
  const avgDailyExpense = baseKpis.totalExpenses / (activeMonthsCount * 30.44);

  const savingsRate = baseKpis.totalIncome > 0 ? ((baseKpis.totalIncome - baseKpis.totalExpenses) / baseKpis.totalIncome) * 100 : 0;
  const burnRate = baseKpis.totalIncome > 0 ? (baseKpis.totalExpenses / baseKpis.totalIncome) * 100 : 0;
  const dtiRatio = baseKpis.totalIncome > 0 ? (debtOutflows / baseKpis.totalIncome) * 100 : 0;
  const debtRatio = baseKpis.totalAssets > 0 ? (baseKpis.totalLiabilities / baseKpis.totalAssets) * 100 : 0;
  const survivalMonths = avgMonthlyExpense > 0 ? baseKpis.immediateLiquidity / avgMonthlyExpense : 0;

  // Variances based on trends
  const cashFlowTrend = generateCashFlowData(transactions);
  let expenseVariancePop = 0;
  if (cashFlowTrend.length >= 2) {
    const currentExp = Math.abs(cashFlowTrend[cashFlowTrend.length - 1].expenses);
    const priorExp = Math.abs(cashFlowTrend[cashFlowTrend.length - 2].expenses);
    expenseVariancePop = priorExp > 0 ? ((currentExp - priorExp) / priorExp) * 100 : 0;
  }

  const netTrend = generateNetTrendData(transactions);
  let monthlyWealthVariance = 0;
  if (netTrend.length >= 2) {
    const currentNet = netTrend[netTrend.length - 1].net;
    const priorNet = netTrend[netTrend.length - 2].net;
    monthlyWealthVariance = currentNet - priorNet;
  }

  return {
    avgMonthlyExpense,
    avgDailyExpense,
    savingsRate,
    burnRate,
    dtiRatio,
    debtRatio,
    survivalMonths,
    monthlyWealthVariance,
    expenseVariancePop
  };
}

/**
 * Calculates Deep-Filtered KPIs (Phase 3B).
 * @param {Array} transactions - Raw double-entry ledger transactions.
 */
export function calculateFilteredKPIs(transactions) {
  if (!Array.isArray(transactions)) return { costOfDebt: 0, yieldAssets: 0 };
  let costOfDebt = 0;
  let yieldAssets = 0;

  transactions.forEach(t => {
    const amount = Number(t.amount) || 0;
    const target = t.target_account || '';
    const source = t.source_account || '';

    // Cost of Debt (69020003 - Credit Interest Paid)
    if (target === '69020003') costOfDebt += amount;
    if (source === '69020003') costOfDebt -= amount;

    // Yield Assets (Prefix 1, excluding 1101 Checking and 1103 Cash)
    const isYieldTarget = target.startsWith('1') && !target.startsWith('1101') && !target.startsWith('1103');
    const isYieldSource = source.startsWith('1') && !source.startsWith('1101') && !source.startsWith('1103');
    
    if (isYieldTarget) yieldAssets += amount;
    if (isYieldSource) yieldAssets -= amount;
  });

  return { costOfDebt, yieldAssets };
}

/**
 * Extracts latest general transactions and internal transfers (Phase 4A).
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