import { useMemo } from 'react';
import { useKingdomStore } from '../store/useKingdomStore';

export const formatNumberCompact = (num) => {
  if (!num) return '0 / g';
  const absNum = Math.abs(num);
  let formattedNum = absNum.toLocaleString(undefined, { maximumFractionDigits: 1 });
  if (absNum >= 1.0e12) formattedNum = (absNum / 1.0e12).toFixed(1) + "T";
  else if (absNum >= 1.0e9) formattedNum = (absNum / 1.0e9).toFixed(1) + "B";
  else if (absNum >= 1.0e6) formattedNum = (absNum / 1.0e6).toFixed(1) + "M";
  else if (absNum >= 1.0e3) formattedNum = (absNum / 1.0e3).toFixed(1) + "K";

  if (num > 0) return `+${formattedNum} / g`;
  return `(${formattedNum}) / g`;
};

/**
 * useDashboardEngine
 * Processes transactions in-memory to drive the Dashboard KPI metrics,
 * utilizing the Flat Matrix configuration for dynamic metadata lookup.
 */
export function useDashboardEngine(filteredTransactions = []) {
  const allTxs = useKingdomStore(state => state.transactions) || [];
  const accountBalances = useKingdomStore(state => state.accountBalances) || [];
  const flatMatrix = useKingdomStore(state => state.flatMatrix) || [];

  return useMemo(() => {
    const safeFilteredTxs = filteredTransactions || [];
    const safeAllTxs = allTxs || [];
    const safeBalances = accountBalances || [];

    // Complete transaction verification status checker
    const isCompleted = (status) => ['Completed', 'Paid', 'Paid on Time', 'Paid Late'].includes(status);

    // Metadata resolver dynamically bound to the Flat Matrix
    const getAccountMeta = (tx) => {
      const code = tx.target_account || tx.source_dest_bank;
      const found = code ? flatMatrix.find(row => row.code === code) : null;
      return {
        category: tx.transaction_category || found?.category || 'Other',
        entity: tx.entity || found?.entity || 'Other',
        name: found?.account_name || 'Other Account'
      };
    };

    // ==============================================================
    // 1. P&L FIREWALL: Single-Pass Aggregation for Income & Expense
    // ==============================================================
    const plTransactions = [];
    const incomeTxs = [];
    const expenseTxs = [];
    let realizedIncome = 0;
    let forecastIncome = 0;
    let realizedExpense = 0;
    let forecastExpense = 0;

    for (const tx of safeFilteredTxs) {
      const type = tx.transaction_type;
      if (type === 'Income') {
        plTransactions.push(tx);
        incomeTxs.push(tx);
        const amt = Number(tx.amount) || 0;
        if (isCompleted(tx.payment_status)) {
          realizedIncome += amt;
        } else if (tx.payment_status === 'Pending') {
          forecastIncome += amt;
        }
      } else if (type === 'Expense') {
        plTransactions.push(tx);
        expenseTxs.push(tx);
        const amt = Number(tx.amount) || 0;
        if (isCompleted(tx.payment_status)) {
          realizedExpense += amt;
        } else if (tx.payment_status === 'Pending') {
          forecastExpense += amt;
        }
      }
    }

    const netRealized = realizedIncome - realizedExpense;

    // ==============================================================
    // 2. NET WORTH & BALANÇO DE VAULTS (8-Digit Prefix Taxonomy)
    // ==============================================================
    const balancesByCode = {};

    // Populate balances from the Flat Matrix schema dynamically
    flatMatrix.forEach(row => {
      if (row.code && (row.code.startsWith('1') || row.code.startsWith('2'))) {
        balancesByCode[row.code] = 0;
      }
    });

    // Seed database-configured balances
    safeBalances.forEach(b => {
      if (b.account_code && b.account_code in balancesByCode) {
        balancesByCode[b.account_code] = Number(b.balance) || 0;
      }
    });

    // Apply ledger history to balances based on dynamic Flow Rules
    safeAllTxs.forEach(tx => {
      if (!isCompleted(tx.payment_status)) return;
      const amt = Number(tx.amount) || 0;
      const type = tx.transaction_type;

      // Fallback to checking account 11010001 if source_dest_bank is missing
      const src = tx.source_dest_bank || '11010001';
      const tgt = tx.target_account;

      if (type === 'Income') {
        if (src in balancesByCode) {
          balancesByCode[src] += amt;
        }
      } else if (type === 'Expense') {
        if (src in balancesByCode) {
          balancesByCode[src] -= amt;
        }
      } else if (type === 'Transfer') {
        if (src in balancesByCode) balancesByCode[src] -= amt;
        if (tgt && tgt in balancesByCode) balancesByCode[tgt] += amt;
      } else if (type === 'Assets') {
        if (tx.flow === 'neutral') {
          if (src in balancesByCode) balancesByCode[src] -= amt;
          if (tgt && tgt in balancesByCode) balancesByCode[tgt] += amt;
        } else if (tx.flow === 'inflow') {
          if (src in balancesByCode) balancesByCode[src] += amt;
          if (tgt && tgt in balancesByCode) balancesByCode[tgt] -= amt;
        } else if (tx.flow === 'outflow') {
          if (src in balancesByCode) balancesByCode[src] -= amt;
          if (tgt && tgt in balancesByCode) balancesByCode[tgt] += amt;
        }
      } else if (type === 'Liabilities') {
        if (tx.flow === 'inflow') {
          // New Loan: Increases Liability balance and Assets balance
          if (tgt && tgt in balancesByCode) balancesByCode[tgt] += amt;
          if (src in balancesByCode) balancesByCode[src] += amt;
        } else if (tx.flow === 'outflow') {
          // Debt Payment: Decreases Liability balance and Assets balance
          if (tgt && tgt in balancesByCode) balancesByCode[tgt] -= amt;
          if (src in balancesByCode) balancesByCode[src] -= amt;
        }
      }
    });

    // Calculate structural metrics using the strict 8-digit rules
    let totalAssets = 0;
    let totalLiabilities = 0;
    let netVaultCash = 0;

    Object.entries(balancesByCode).forEach(([code, balance]) => {
      if (code.startsWith('1')) {
        totalAssets += balance;
        // HUD Gold / Net Vault Cash limits to Checking, Savings & Wallets, and Physical Cash
        if (code.startsWith('1101') || code.startsWith('1102') || code.startsWith('1103')) {
          netVaultCash += balance;
        }
      } else if (code.startsWith('2')) {
        totalLiabilities += balance;
      }
    });

    const netWorth = totalAssets - totalLiabilities;

    // ==============================================================
    // 3. DATA STRUCTURES FOR GRAPHING (No legacy maps)
    // ==============================================================

    // Category Distribution (P&L Context)
    const categoryMap = {};
    plTransactions.forEach(tx => {
      const { category: cat } = getAccountMeta(tx);
      if (!categoryMap[cat]) {
        categoryMap[cat] = { name: cat, income: 0, expense: 0, totalClass: 0 };
      }
      const amt = Number(tx.amount) || 0;
      if (tx.transaction_type === 'Income') {
        categoryMap[cat].income += amt;
      } else {
        categoryMap[cat].expense += amt;
      }
      categoryMap[cat].totalClass += amt;
    });
    const categoryData = Object.values(categoryMap).sort((a, b) => b.totalClass - a.totalClass);

    // Entity Distribution (P&L Context)
    const entityMap = {};
    plTransactions.forEach(tx => {
      const { entity: ent } = getAccountMeta(tx);
      if (!entityMap[ent]) {
        entityMap[ent] = { name: ent, income: 0, expense: 0, totalClass: 0 };
      }
      const amt = Number(tx.amount) || 0;
      if (tx.transaction_type === 'Income') {
        entityMap[ent].income += amt;
      } else {
        entityMap[ent].expense += amt;
      }
      entityMap[ent].totalClass += amt;
    });
    const entityData = Object.values(entityMap).sort((a, b) => b.totalClass - a.totalClass);

    // Temporal Line Metrics
    const timeMap = {};
    safeFilteredTxs.forEach(tx => {
      const dateKey = tx.posting_date || (tx.created_at ? tx.created_at.split('T')[0] : new Date().toISOString().split('T')[0]);
      if (!timeMap[dateKey]) {
        timeMap[dateKey] = { date: dateKey, classIncome: 0, classExpense: 0, debtAccrual: 0, debtPayment: 0 };
      }
      const amt = Number(tx.amount) || 0;
      if (tx.transaction_type === 'Income') {
        timeMap[dateKey].classIncome += amt;
      } else if (tx.transaction_type === 'Expense') {
        timeMap[dateKey].classExpense += amt;
      } else if (tx.transaction_type === 'Liabilities') {
        if (tx.flow === 'inflow') timeMap[dateKey].debtAccrual += amt;
        else timeMap[dateKey].debtPayment += amt;
      }
    });

    const timeData = Object.values(timeMap)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(pt => {
        const d = new Date(pt.date);
        const label = isNaN(d.getTime())
          ? pt.date
          : `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`;
        return {
          label,
          ...pt
        };
      });

    // Liabilities Analytics (Completed Debt Only)
    const debtTxs = safeAllTxs.filter(tx => tx.transaction_type === 'Liabilities');

    const debtEntMap = {};
    debtTxs.forEach(tx => {
      const { entity: ent } = getAccountMeta(tx);
      const amt = Number(tx.amount) || 0;
      if (isCompleted(tx.payment_status)) {
        if (tx.flow === 'inflow') {
          debtEntMap[ent] = (debtEntMap[ent] || 0) + amt;
        } else {
          debtEntMap[ent] = (debtEntMap[ent] || 0) - amt;
        }
      }
    });
    const debtByEntity = Object.entries(debtEntMap)
      .map(([name, amount]) => ({ name, amount: Math.max(0, amount) }))
      .filter(item => item.amount > 0)
      .sort((a, b) => b.amount - a.amount);

    const debtCatMap = {};
    debtTxs.forEach(tx => {
      const { category: cat } = getAccountMeta(tx);
      const amt = Number(tx.amount) || 0;
      if (isCompleted(tx.payment_status)) {
        if (tx.flow === 'inflow') {
          debtCatMap[cat] = (debtCatMap[cat] || 0) + amt;
        } else {
          debtCatMap[cat] = (debtCatMap[cat] || 0) - amt;
        }
      }
    });
    const debtByType = Object.entries(debtCatMap)
      .map(([name, amount]) => ({ name, amount: Math.max(0, amount) }))
      .filter(item => item.amount > 0)
      .sort((a, b) => b.amount - a.amount);

    // ==============================================================
    // 4. RETROACTIVE COMPATIBILITY MAPPINGS
    // ==============================================================
    const mapToFormattedArray = (dict) => {
      return Object.entries(dict).map(([name, amount]) => ({
        name,
        amount,
        formatted: formatNumberCompact(amount)
      })).sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
    };

    const plRevenues = {};
    const plExpenses = {};
    plTransactions.forEach(tx => {
      const { category: cat } = getAccountMeta(tx);
      const amt = Number(tx.amount) || 0;
      if (tx.transaction_type === 'Income') {
        plRevenues[cat] = (plRevenues[cat] || 0) + amt;
      } else {
        plExpenses[cat] = (plExpenses[cat] || 0) + amt;
      }
    });

    const incomeStatement = {
      revenues: mapToFormattedArray(plRevenues),
      expenses: mapToFormattedArray(plExpenses),
      totalRevenue: realizedIncome,
      totalExpense: realizedExpense,
      netAccruedIncome: netRealized,
      formattedNet: formatNumberCompact(netRealized)
    };

    const cashFlowStatement = {
      operating: mapToFormattedArray(plExpenses),
      investing: [],
      financing: [],
      netOperating: -realizedExpense,
      netInvesting: 0,
      netFinancing: realizedIncome,
      netCashFlow: netRealized,
      formattedNet: formatNumberCompact(netRealized),
      formattedOperating: formatNumberCompact(-realizedExpense),
      formattedInvesting: formatNumberCompact(0),
      formattedFinancing: formatNumberCompact(realizedIncome)
    };

    const assetsList = [];
    const liabilitiesList = [];

    Object.entries(balancesByCode).forEach(([code, balance]) => {
      const account = flatMatrix.find(row => row.code === code);
      const name = account ? account.account_name : `Account ${code}`;
      const formatted = formatNumberCompact(balance);

      if (code.startsWith('1')) {
        assetsList.push({ code, name, balance, formatted });
      } else if (code.startsWith('2')) {
        liabilitiesList.push({ code, name, balance, formatted });
      }
    });

    const balanceSheet = {
      assets: {
        vaultCash: netVaultCash,
        outstandingReceivables: Math.max(0, totalAssets - netVaultCash),
        totalAssets,
        list: assetsList,
        formattedTotal: formatNumberCompact(totalAssets),
        formattedVaultCash: formatNumberCompact(netVaultCash),
        formattedReceivables: formatNumberCompact(Math.max(0, totalAssets - netVaultCash))
      },
      liabilities: {
        outstandingDebt: totalLiabilities,
        outstandingPayables: 0,
        totalLiabilities,
        list: liabilitiesList,
        formattedTotal: formatNumberCompact(totalLiabilities),
        formattedDebt: formatNumberCompact(totalLiabilities),
        formattedPayables: formatNumberCompact(0)
      },
      equity: {
        accumulatedWealth: netWorth,
        formattedTotal: formatNumberCompact(netWorth)
      }
    };

    const liabilitiesKpis = {
      total_debt: totalLiabilities,
      to_be_paid: safeFilteredTxs.filter(tx => tx.transaction_type === 'Liabilities' && tx.payment_status === 'Pending').reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0),
      new_liabilities: safeFilteredTxs.filter(tx => tx.transaction_type === 'Liabilities' && tx.flow === 'inflow').reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0),
      amortizations: safeFilteredTxs.filter(tx => tx.transaction_type === 'Liabilities' && tx.flow === 'outflow' && isCompleted(tx.payment_status)).reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0)
    };

    return {
      // Functional metrics
      incomeStats: { realized: realizedIncome, forecast: forecastIncome },
      expenseStats: { realized: realizedExpense, forecast: forecastExpense },
      netWorth: { totalAssets, totalLiabilities, netWorth, netVaultCash },
      categoryData,
      entityData,
      timeData,
      debtByEntity,
      debtByType,

      // Legacy support mappings
      total_income: realizedIncome,
      total_expenses: realizedExpense,
      total_receipts: realizedIncome,
      total_payments: realizedExpense,
      net_cash_balance: netRealized,
      total_debt: totalLiabilities,
      savings_efficiency: realizedIncome > 0 ? Number(((realizedIncome - realizedExpense) / realizedIncome * 100).toFixed(1)) : 0,
      payablesReceivablesKpis: {
        all_payables: forecastExpense,
        open_payables: forecastExpense,
        all_receivables: forecastIncome,
        open_receivables: forecastIncome,
        overdue_rate: 0
      },
      liabilitiesKpis,
      incomeStatement,
      cashFlowStatement,
      balanceSheet,

      // Obsolete visual compatibility fallbacks
      prTimePoints: [],
      openPayablesByCategory: [],
      openPayablesByEntity: [],
      openPayablesByMonth: [],
      paymentMethodsDistribution: [],
      liabilitiesTimePoints: []
    };
  }, [allTxs, accountBalances, flatMatrix, filteredTransactions]);
}