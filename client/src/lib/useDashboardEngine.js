import { useMemo } from 'react';
import { useKingdomStore } from '../store/useKingdomStore';

const formatNumberCompact = (num) => {
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
 * Processa o array bruto de transações em memória para o Dashboard,
 * respeitando os 4 pilares e o modelo de previsão com P&L Firewall.
 */
export function useDashboardEngine(filteredTransactions = []) {
  const allTxs = useKingdomStore(state => state.transactions) || [];
  const accountBalances = useKingdomStore(state => state.accountBalances) || [];
  const userGold = useKingdomStore(state => state.gold) || 0;

  return useMemo(() => {
    const safeFilteredTxs = filteredTransactions || [];
    const safeAllTxs = allTxs || [];
    const safeBalances = accountBalances || [];
    const entityMappings = useKingdomStore.getState().entityMappings || {};
    
    // Status checker for completed cash flows
    const isCompleted = (status) => ['Completed', 'Paid', 'Paid on Time', 'Paid Late'].includes(status);

    // ==============================================================
    // 1. P&L FIREWALL: Filtrar apenas Income & Expense
    // ==============================================================
    const plTransactions = safeFilteredTxs.filter(
      tx => tx.transaction_type === 'Income' || tx.transaction_type === 'Expense'
    );

    // Totais de Receita (Income)
    const incomeTxs = plTransactions.filter(tx => tx.transaction_type === 'Income');
    const realizedIncome = incomeTxs
      .filter(tx => isCompleted(tx.payment_status))
      .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
    const forecastIncome = incomeTxs
      .filter(tx => tx.payment_status === 'Pending')
      .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

    // Totais de Despesa (Expense)
    const expenseTxs = plTransactions.filter(tx => tx.transaction_type === 'Expense');
    const realizedExpense = expenseTxs
      .filter(tx => isCompleted(tx.payment_status))
      .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
    const forecastExpense = expenseTxs
      .filter(tx => tx.payment_status === 'Pending')
      .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

    const netRealized = realizedIncome - realizedExpense;
    const netForecast = (realizedIncome + forecastIncome) - (realizedExpense + forecastExpense);

    // ==============================================================
    // 2. NET WORTH & BALANÇO DE VAULTS (Somente Completed)
    // ==============================================================
    let totalAssets = 0;
    let totalLiabilities = 0;
    let netVaultCash = userGold; // Saldo de caixa real do Lorde

    safeBalances.forEach(row => {
      const balance = Number(row.balance) || 0;
      const code = row.account_code || '';
      if (code.startsWith('1')) {
        totalAssets += balance;
        if (code === '111001') {
          netVaultCash = balance;
        }
      } else if (code.startsWith('2')) {
        totalLiabilities += balance;
      }
    });

    // Se a tabela account_balances estiver vazia, faz o fallback dinâmico
    if (safeBalances.length === 0) {
      netVaultCash = userGold;
      totalAssets = userGold;
      // Calcula dívidas acumuladas de transações do tipo Debt Completed
      const newDebt = safeAllTxs
        .filter(tx => tx.transaction_type === 'Debt' && tx.flow === 'inflow' && tx.payment_status === 'Completed')
        .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
      const amortizations = safeAllTxs
        .filter(tx => tx.transaction_type === 'Debt' && tx.flow === 'outflow' && tx.payment_status === 'Completed')
        .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
      totalLiabilities = Math.max(0, newDebt - amortizations);
      totalAssets += totalLiabilities; // Assets incluem o saldo mais as aplicações/recebíveis
    }

    const netWorth = totalAssets - totalLiabilities;

    // ==============================================================
    // 3. ESTRUTURAÇÃO DE DADOS PARA GRÁFICOS (Sem Asset/Debt no P&L)
    // ==============================================================
    
    // Distribuição por Categorias (Apenas P&L)
    const categoryMap = {};
    plTransactions.forEach(tx => {
      const cat = entityMappings[tx.entity] || tx.transaction_category || 'Other';
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

    // Distribuição por Entidades (Apenas P&L)
    const entityMap = {};
    plTransactions.forEach(tx => {
      const ent = tx.entity || 'Other';
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

    // Evolução Temporal (P&L + Debt)
    const timeMap = {};
    safeFilteredTxs.forEach(tx => {
      const dateKey = tx.posting_date || new Date(tx.created_at).toISOString().split('T')[0];
      if (!timeMap[dateKey]) {
        timeMap[dateKey] = { date: dateKey, classIncome: 0, classExpense: 0, debtAccrual: 0, debtPayment: 0 };
      }
      const amt = Number(tx.amount) || 0;
      if (tx.transaction_type === 'Income') {
        timeMap[dateKey].classIncome += amt;
      } else if (tx.transaction_type === 'Expense') {
        timeMap[dateKey].classExpense += amt;
      } else if (tx.transaction_type === 'Debt') {
        if (tx.flow === 'inflow') timeMap[dateKey].debtAccrual += amt;
        else timeMap[dateKey].debtPayment += amt;
      }
    });

    const timeData = Object.values(timeMap)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(pt => {
        const d = new Date(pt.date);
        return {
          label: `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`,
          ...pt
        };
      });

    // Dívidas por Entidade e Categoria (Apenas Debt Completed)
    const debtTxs = safeAllTxs.filter(tx => tx.transaction_type === 'Debt');
    
    const debtEntMap = {};
    debtTxs.forEach(tx => {
      const ent = tx.entity || 'Other';
      const amt = Number(tx.amount) || 0;
      if (tx.payment_status === 'Completed') {
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
      const cat = entityMappings[tx.entity] || tx.transaction_category || 'Other';
      const amt = Number(tx.amount) || 0;
      if (tx.payment_status === 'Completed') {
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
    // 4. MAPEAR PARA COMPATIBILIDADE DE RETORNO (Evitar Regressão no App.jsx)
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
      const cat = entityMappings[tx.entity] || tx.transaction_category || 'Other';
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

    // Cash Flow simplificado sob o novo modelo cash-basis
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

    const chartOfAccounts = {
      '111001': 'Assets Banks CGD',
      '111002': 'Assets Banks Universo',
      '111003': 'Assets Banks ActiveBank',
      '111004': 'Assets Banks Inter(Brasil)',
      '121001': 'Assets Investment app CGD',
      '121002': 'Assets Investment app Universo',
      '121003': 'Assets Investment app ActiveBank',
      '121004': 'Assets Investment app WizInk',
      '121005': 'Assets Investment app Inter(Brasil)',
      '131001': 'Assets Savings Accounts CGD',
      '131002': 'Assets Savings Accounts ActiveBank',
      '131003': 'Assets Savings Accounts Inter(Brasil)',
      '211001': 'Liabilities Loans CGD',
      '211002': 'Liabilities Loans Universo',
      '211003': 'Liabilities Loans ActiveBank',
      '211004': 'Liabilities Loans Inter(Brasil)',
      '211005': 'Liabilities Loans WizInk',
      '211006': 'Liabilities Loans Cofidis',
      '212001': 'Liabilities Personal Debts Jota Food',
      '212002': 'Liabilities Personal Debts Mum Support',
      '221001': 'Liabilities Credit Cards CGD',
      '221002': 'Liabilities Credit Cards Universo',
      '221003': 'Liabilities Credit Cards ActiveBank',
      '221004': 'Liabilities Credit Cards WizInk',
      '221005': 'Liabilities Credit Cards Inter(Brasil)'
    };

    const balancesByCode = {};
    Object.keys(chartOfAccounts).forEach(code => {
      balancesByCode[code] = 0;
    });

    safeBalances.forEach(row => {
      const code = row.account_code || '';
      if (code in balancesByCode) {
        balancesByCode[code] = Number(row.balance) || 0;
      }
    });

    if (safeBalances.length === 0) {
      balancesByCode['111001'] = userGold;
      const newDebt = safeAllTxs
        .filter(tx => tx.transaction_type === 'Debt' && tx.flow === 'inflow' && isCompleted(tx.payment_status))
        .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
      const amortizations = safeAllTxs
        .filter(tx => tx.transaction_type === 'Debt' && tx.flow === 'outflow' && isCompleted(tx.payment_status))
        .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
      const netDebt = Math.max(0, newDebt - amortizations);
      if (netDebt > 0) {
        balancesByCode['211006'] = netDebt;
      }
    }

    const assetsList = [];
    const liabilitiesList = [];

    Object.entries(balancesByCode).forEach(([code, balance]) => {
      const name = chartOfAccounts[code];
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

    // Métricas de compatibilidade de KPIs de Dívida
    const liabilitiesKpis = {
      total_debt: totalLiabilities,
      to_be_paid: safeFilteredTxs.filter(tx => tx.transaction_type === 'Debt' && tx.payment_status === 'Pending').reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0),
      new_liabilities: safeFilteredTxs.filter(tx => tx.transaction_type === 'Debt' && tx.flow === 'inflow').reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0),
      amortizations: safeFilteredTxs.filter(tx => tx.transaction_type === 'Debt' && tx.flow === 'outflow' && isCompleted(tx.payment_status)).reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0)
    };

    return {
      // Novas chaves limpas
      incomeStats: { realized: realizedIncome, forecast: forecastIncome },
      expenseStats: { realized: realizedExpense, forecast: forecastExpense },
      netWorth: { totalAssets, totalLiabilities, netWorth, netVaultCash },
      categoryData,
      entityData,
      timeData,
      debtByEntity,
      debtByType,

      // Chaves legadas mantidas para compatibilidade retroativa
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

      // Placeholders vazios para gráficos obsoletos evitarem erros
      prTimePoints: [],
      openPayablesByCategory: [],
      openPayablesByEntity: [],
      openPayablesByMonth: [],
      paymentMethodsDistribution: [],
      liabilitiesTimePoints: []
    };
  }, [allTxs, accountBalances, userGold, filteredTransactions]);
}
