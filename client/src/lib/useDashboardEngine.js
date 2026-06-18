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
 * Pure adapter layer mapping Zero-Calculation PostgreSQL View payloads
 * directly into the legacy UI structure without ANY client-side math arrays.
 */
export function useDashboardEngine(filteredTransactions = []) {
  const kpiSummary = useKingdomStore(state => state.kpiSummary);
  const dbPayablesReceivablesKpis = useKingdomStore(state => state.payablesReceivablesKpis);
  const flowByCategory = useKingdomStore(state => state.flowByCategory);
  const timeEvolution = useKingdomStore(state => state.timeEvolution);
  const topEntities = useKingdomStore(state => state.topEntities);
  const allTxs = useKingdomStore(state => state.transactions);

  return useMemo(() => {
    // 1. Dual-Row KPI Summary Metrics
    const total_income = kpiSummary?.total_income || 0;
    const total_expenses = kpiSummary?.total_expenses || 0;
    const total_receipts = kpiSummary?.total_receipts || 0;
    const total_payments = kpiSummary?.total_payments || 0;
    const net_cash_balance = kpiSummary?.net_cash_balance || 0;
    const total_debt = kpiSummary?.total_debt || 0;
    const savings_efficiency = kpiSummary?.savings_efficiency || 0;

    // 1.5 Payables & Receivables reactive metrics
    const payables = filteredTransactions.filter(tx => tx.transaction_type === 'Payable');
    const receivables = filteredTransactions.filter(tx => tx.transaction_type === 'Receivable');
    
    const all_payables = payables.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
    const open_payables = payables.filter(tx => ['Open', 'Overdue'].includes(tx.payment_status)).reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
    const all_receivables = receivables.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
    const open_receivables = receivables.filter(tx => tx.payment_status === 'Open').reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
    const overdue_payables = payables.filter(tx => tx.payment_status === 'Overdue').reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
    const overdue_rate = open_payables === 0 ? 0.0 : Number(((overdue_payables / open_payables) * 100).toFixed(1));

    const payablesReceivablesKpis = {
      all_payables,
      open_payables,
      all_receivables,
      open_receivables,
      overdue_rate
    };

    // 2. Pivot Category Arrays
    const catMap = {};
    flowByCategory.forEach(row => {
      const name = row.transaction_category || 'Unknown';
      if (!catMap[name]) catMap[name] = { name, income: 0, expense: 0, receipt: 0, payment: 0 };
      
      if (row.transaction_nature === 'accrual') {
        catMap[name].income += Number(row.total_inflow) || 0;
        catMap[name].expense += Number(row.total_outflow) || 0;
      } else if (row.transaction_nature === 'cash') {
        catMap[name].receipt += Number(row.total_inflow) || 0;
        catMap[name].payment += Number(row.total_outflow) || 0;
      }
    });
    
    const categoryData = Object.values(catMap).map(vals => ({
      ...vals,
      totalClass: vals.income + vals.expense,
      totalSubclass: vals.receipt + vals.payment
    }));

    // 3. Pivot Entity Arrays
    const entMap = {};
    topEntities.forEach(row => {
      const name = row.entity || 'Unknown';
      if (!entMap[name]) entMap[name] = { name, income: 0, expense: 0, receipt: 0, payment: 0 };
      
      if (row.transaction_nature === 'accrual') {
        entMap[name].income = Number(row.total_volume) || 0;
      } else if (row.transaction_nature === 'cash') {
        entMap[name].receipt = Number(row.total_volume) || 0;
      }
    });
    
    const entityData = Object.values(entMap).map(vals => ({
      ...vals,
      totalClass: vals.income + vals.expense,
      totalSubclass: vals.receipt + vals.payment
    })).sort((a, b) => b.totalClass - a.totalClass);

    // 4. Map Time Evolution Arrays
    const timeData = timeEvolution.map(row => {
      const d = new Date(row.dimension_date);
      return {
        label: `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })} ${d.getFullYear()}`,
        classIncome: Number(row.accrual_inflow) || 0,
        classExpense: Number(row.accrual_outflow) || 0,
        subReceipt: Number(row.cash_inflow) || 0,
        subPayment: Number(row.cash_outflow) || 0,
        debtAccrual: Number(row.debt_accrual) || 0,
        debtPayment: Number(row.debt_payment) || 0
      };
    });

    // 5. Payables & Receivables Spline Chart datasets
    const prTimeLabels = Array.from(new Set(filteredTransactions.map(tx => `${tx.year} ${tx.month}`)));
    const prTimePoints = prTimeLabels.map(label => {
      const [yearStr, monthStr] = label.split(' ');
      const matchedTxs = filteredTransactions.filter(tx => String(tx.year) === yearStr && tx.month === monthStr);
      const payablesVol = matchedTxs.filter(tx => tx.transaction_type === 'Payable').reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
      const receivablesVol = matchedTxs.filter(tx => tx.transaction_type === 'Receivable').reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
      return { label, payables: payablesVol, receivables: receivablesVol };
    }).filter(t => t.payables > 0 || t.receivables > 0);

    // 6. Open Payables by Category dataset
    const openPayablesList = filteredTransactions.filter(tx => tx.transaction_type === 'Payable' && ['Open', 'Overdue'].includes(tx.payment_status));
    const opCategories = Array.from(new Set(openPayablesList.map(tx => tx.transaction_category).filter(Boolean)));
    const openPayablesByCategory = opCategories.map(cat => {
      const amount = openPayablesList.filter(tx => tx.transaction_category === cat).reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
      return { name: cat, amount };
    }).sort((a, b) => b.amount - a.amount);

    // 7. Open Payables by Entity dataset
    const opEntities = Array.from(new Set(openPayablesList.map(tx => tx.entity).filter(Boolean)));
    const openPayablesByEntity = opEntities.map(ent => {
      const amount = openPayablesList.filter(tx => tx.entity === ent).reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
      return { name: ent, amount };
    }).sort((a, b) => b.amount - a.amount);

    // 8. Open Payables by Month dataset
    const opMonths = Array.from(new Set(openPayablesList.map(tx => tx.month).filter(Boolean)));
    const openPayablesByMonth = opMonths.map(m => {
      const amount = openPayablesList.filter(tx => tx.month === m).reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
      return { name: m, amount };
    });

    // 9. Payment Methods Distribution dataset
    const completedTxs = filteredTransactions.filter(tx => ['Completed', 'Paid'].includes(tx.payment_status) && tx.payment_method);
    const methods = Array.from(new Set(completedTxs.map(tx => tx.payment_method).filter(Boolean)));
    const paymentMethodsDistribution = methods.map(method => {
      const amount = completedTxs.filter(tx => tx.payment_method === method).reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
      return { name: method, amount };
    }).sort((a, b) => b.amount - a.amount);

    // 10. Liabilities calculations (differentiating principal pay-downs from interest)
    const monthIndexes = {
      'January': 0, 'February': 1, 'March': 2, 'April': 3, 'May': 4, 'June': 5,
      'July': 6, 'August': 7, 'September': 8, 'October': 9, 'November': 10, 'December': 11
    };

    const legacyDebt = allTxs.filter(tx => ['Banking', 'Other Banking', 'Burrowed'].includes(tx.transaction_category) && tx.transaction_nature === 'accrual' && tx.transaction_flow === 'inflow').reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0) - allTxs.filter(tx => ['Banking', 'Other Banking', 'Burrowed'].includes(tx.transaction_category) && tx.transaction_nature === 'cash' && tx.transaction_flow === 'outflow').reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
    const newDebtVal = allTxs.filter(tx => tx.transaction_subtype === 'New Debt').reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
    const liabilities_total_debt = newDebtVal > 0 ? (newDebtVal - allTxs.filter(tx => tx.transaction_subtype === 'Amortization' && tx.payment_status === 'Completed').reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0)) : legacyDebt;

    const liabilities_to_be_paid = filteredTransactions.filter(tx => tx.transaction_subtype === 'Amortization' && ['Open', 'Pending', 'Overdue'].includes(tx.payment_status)).reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
    const liabilities_new_liabilities = filteredTransactions.filter(tx => tx.transaction_subtype === 'New Debt').reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
    const liabilities_amortizations = filteredTransactions.filter(tx => tx.transaction_subtype === 'Amortization' && tx.payment_status === 'Completed').reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

    const liabilitiesKpis = {
      total_debt: liabilities_total_debt,
      to_be_paid: liabilities_to_be_paid,
      new_liabilities: liabilities_new_liabilities,
      amortizations: liabilities_amortizations
    };

    // Spline chart temporal data
    const liabilitiesTimeLabels = Array.from(new Set(filteredTransactions.map(tx => `${tx.year} ${tx.month}`)));
    const sortedLiabilitiesTimeLabels = liabilitiesTimeLabels.sort((a, b) => {
      const [yA, mA] = a.split(' ');
      const [yB, mB] = b.split(' ');
      if (yA !== yB) return Number(yA) - Number(yB);
      return monthIndexes[mA] - monthIndexes[mB];
    });

    const liabilitiesTimePoints = sortedLiabilitiesTimeLabels.map(label => {
      const [yearStr, monthStr] = label.split(' ');
      const yearNum = Number(yearStr);
      const monthTxs = filteredTransactions.filter(tx => tx.year === yearNum && tx.month === monthStr);
      
      const newDebt = monthTxs.filter(tx => tx.transaction_subtype === 'New Debt').reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
      const amortization = monthTxs.filter(tx => tx.transaction_subtype === 'Amortization' && tx.payment_status === 'Completed').reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
      const toBePaid = monthTxs.filter(tx => tx.transaction_subtype === 'Amortization' && ['Open', 'Pending', 'Overdue'].includes(tx.payment_status)).reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
      
      // Cumulative debt historically up to this month
      const histNewDebt = allTxs.filter(tx => {
        if (tx.year < yearNum) return tx.transaction_subtype === 'New Debt';
        if (tx.year === yearNum) {
          return tx.transaction_subtype === 'New Debt' && monthIndexes[tx.month] <= monthIndexes[monthStr];
        }
        return false;
      }).reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
      
      const histAmortization = allTxs.filter(tx => {
        if (tx.year < yearNum) return tx.transaction_subtype === 'Amortization' && tx.payment_status === 'Completed';
        if (tx.year === yearNum) {
          return tx.transaction_subtype === 'Amortization' && tx.payment_status === 'Completed' && monthIndexes[tx.month] <= monthIndexes[monthStr];
        }
        return false;
      }).reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

      let totalDebt = histNewDebt - histAmortization;
      if (histNewDebt === 0) {
        const legAccrual = allTxs.filter(tx => {
          if (!['Banking', 'Other Banking', 'Burrowed'].includes(tx.transaction_category)) return false;
          if (tx.year < yearNum) return tx.transaction_nature === 'accrual' && tx.transaction_flow === 'inflow';
          if (tx.year === yearNum) {
            return tx.transaction_nature === 'accrual' && tx.transaction_flow === 'inflow' && monthIndexes[tx.month] <= monthIndexes[monthStr];
          }
          return false;
        }).reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
        
        const legPayment = allTxs.filter(tx => {
          if (!['Banking', 'Other Banking', 'Burrowed'].includes(tx.transaction_category)) return false;
          if (tx.year < yearNum) return tx.transaction_nature === 'cash' && tx.transaction_flow === 'outflow';
          if (tx.year === yearNum) {
            return tx.transaction_nature === 'cash' && tx.transaction_flow === 'outflow' && monthIndexes[tx.month] <= monthIndexes[monthStr];
          }
          return false;
        }).reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
        
        totalDebt = legAccrual - legPayment;
      }

      return {
        label: `${monthStr.substring(0, 3)} ${yearStr}`,
        totalDebt,
        toBePaid,
        newDebt,
        amortization
      };
    });

    // Debt by Entity
    const debtEntities = Array.from(new Set(allTxs.map(tx => tx.entity).filter(Boolean)));
    const debtByEntity = debtEntities.map(ent => {
      const entNewDebt = allTxs.filter(tx => tx.entity === ent && tx.transaction_subtype === 'New Debt').reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
      const entAmortization = allTxs.filter(tx => tx.entity === ent && tx.transaction_subtype === 'Amortization' && tx.payment_status === 'Completed').reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
      
      let amount = entNewDebt - entAmortization;
      
      if (entNewDebt === 0) {
        const legAcc = allTxs.filter(tx => tx.entity === ent && ['Banking', 'Other Banking', 'Burrowed'].includes(tx.transaction_category) && tx.transaction_nature === 'accrual' && tx.transaction_flow === 'inflow').reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
        const legPay = allTxs.filter(tx => tx.entity === ent && ['Banking', 'Other Banking', 'Burrowed'].includes(tx.transaction_category) && tx.transaction_nature === 'cash' && tx.transaction_flow === 'outflow').reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
        amount = legAcc - legPay;
      }
      
      return { name: ent, amount };
    }).filter(item => item.amount > 0).sort((a, b) => b.amount - a.amount);

    // Debt by Type (Category)
    const debtCategories = Array.from(new Set(allTxs.map(tx => tx.transaction_category).filter(Boolean)));
    const debtByType = debtCategories.map(cat => {
      const catNewDebt = allTxs.filter(tx => tx.transaction_category === cat && tx.transaction_subtype === 'New Debt').reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
      const catAmortization = allTxs.filter(tx => tx.transaction_category === cat && tx.transaction_subtype === 'Amortization' && tx.payment_status === 'Completed').reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
      
      let amount = catNewDebt - catAmortization;
      
      if (catNewDebt === 0 && ['Banking', 'Other Banking', 'Burrowed'].includes(cat)) {
        const legAcc = allTxs.filter(tx => tx.transaction_category === cat && tx.transaction_nature === 'accrual' && tx.transaction_flow === 'inflow').reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
        const legPay = allTxs.filter(tx => tx.transaction_category === cat && tx.transaction_nature === 'cash' && tx.transaction_flow === 'outflow').reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
        amount = legAcc - legPay;
      }
      
      return { name: cat, amount };
    }).filter(item => item.amount > 0).sort((a, b) => b.amount - a.amount);

    // ==============================================================
    // FINANCIAL STATEMENT ENGINE (P&L, CASH FLOW, BALANCE SHEET)
    // ==============================================================

    const incomeStatement = {
      revenues: {},
      expenses: {},
      totalRevenue: 0,
      totalExpense: 0,
      netAccruedIncome: 0,
      formattedNet: '0 / g'
    };

    const cashFlowStatement = {
      operating: {},
      investing: {},
      financing: {},
      netOperating: 0,
      netInvesting: 0,
      netFinancing: 0,
      netCashFlow: 0,
      formattedNet: '0 / g'
    };

    // Balance Sheet Cutoff Calculation
    const cutoffTime = filteredTransactions.length > 0
      ? Math.max(...filteredTransactions.map(tx => new Date(tx.posting_date || tx.created_at).getTime()))
      : new Date().getTime();

    // Accounts for Balance Sheet (Cumulative historically up to cutoff date)
    const balances = {
      '111001': 1000 // Initial profile gold default starts in CGD Bank
    };

    const filteredTxIds = new Set(filteredTransactions.map(tx => tx.id));

    allTxs.forEach((tx) => {
      const txAmount = Number(tx.amount) || 0;
      const txTime = new Date(tx.posting_date || tx.created_at).getTime();

      // 1. Cumulative Balance Sheet Account Accumulation (Completed transactions only)
      if (txTime <= cutoffTime && tx.payment_status === 'Completed') {
        const target = tx.target_account;
        const source = tx.source_dest_bank;

        if (tx.flow === 'neutral') {
          if (source) balances[source] = (balances[source] || 0) - txAmount;
          if (target) balances[target] = (balances[target] || 0) + txAmount;
        } else if (tx.transaction_type === 'Expense') {
          if (source) balances[source] = (balances[source] || 0) - txAmount;
        } else if (tx.transaction_type === 'Income') {
          if (source) balances[source] = (balances[source] || 0) + txAmount;
        } else if (tx.transaction_type === 'Asset' && tx.flow === 'inflow') {
          // e.g. Borrow Cash
          if (target) balances[target] = (balances[target] || 0) + txAmount;
          if (source) balances[source] = (balances[source] || 0) + txAmount;
        } else if (tx.transaction_type === 'Debt' && tx.flow === 'outflow') {
          // e.g. Pay Credit Card, Amortize Loan, Repay Personal Debt
          if (source) balances[source] = (balances[source] || 0) - txAmount;
          if (target) balances[target] = (balances[target] || 0) - txAmount;
        }
      }

      // 2. Periodic P&L and Cash Flow Statement Reduction
      if (filteredTxIds.has(tx.id)) {
        if (tx.transaction_type === 'Income' || tx.transaction_type === 'Expense') {
          const category = tx.transaction_category || 'Other';
          if (tx.transaction_type === 'Income') {
            incomeStatement.revenues[category] = (incomeStatement.revenues[category] || 0) + txAmount;
            incomeStatement.totalRevenue += txAmount;
          } else if (tx.transaction_type === 'Expense') {
            incomeStatement.expenses[category] = (incomeStatement.expenses[category] || 0) + txAmount;
            incomeStatement.totalExpense += txAmount;
          }
        }

        if (tx.payment_status === 'Completed') {
          const subtype = tx.transaction_subtype || tx.transaction_type || 'Other';
          let segment = 'operating';
          if (tx.transaction_type === 'Asset' && tx.flow !== 'neutral') {
            segment = 'investing';
          } else if (tx.transaction_type === 'Debt' || tx.transaction_type === 'Asset') {
            segment = 'financing';
          }

          if (tx.flow !== 'neutral') {
            const flowVal = tx.flow === 'inflow' ? txAmount : -txAmount;
            cashFlowStatement[segment][subtype] = (cashFlowStatement[segment][subtype] || 0) + flowVal;

            if (segment === 'operating') cashFlowStatement.netOperating += flowVal;
            if (segment === 'investing') cashFlowStatement.netInvesting += flowVal;
            if (segment === 'financing') cashFlowStatement.netFinancing += flowVal;
            cashFlowStatement.netCashFlow += flowVal;
          }
        }
      }
    });

    incomeStatement.netAccruedIncome = incomeStatement.totalRevenue - incomeStatement.totalExpense;
    incomeStatement.formattedNet = formatNumberCompact(incomeStatement.netAccruedIncome);

    const mapToFormattedArray = (dict) => {
      return Object.entries(dict).map(([name, amount]) => ({
        name,
        amount,
        formatted: formatNumberCompact(amount)
      })).sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
    };

    const formattedRevenues = mapToFormattedArray(incomeStatement.revenues);
    const formattedExpenses = mapToFormattedArray(incomeStatement.expenses);

    const formattedOperating = mapToFormattedArray(cashFlowStatement.operating);
    const formattedInvesting = mapToFormattedArray(cashFlowStatement.investing);
    const formattedFinancing = mapToFormattedArray(cashFlowStatement.financing);

    // Sum up Assets (starts with 1) and Liabilities (starts with 2)
    let totalAssets = 0;
    let totalLiabilities = 0;
    let netVaultCash = 0;

    Object.entries(balances).forEach(([code, balance]) => {
      if (code.startsWith('1')) {
        totalAssets += balance;
        if (code.startsWith('11') || code.startsWith('13')) {
          netVaultCash += balance;
        }
      } else if (code.startsWith('2')) {
        totalLiabilities += balance;
      }
    });

    const accumulatedWealth = totalAssets - totalLiabilities;

    const balanceSheet = {
      assets: {
        vaultCash: netVaultCash,
        outstandingReceivables: totalAssets - netVaultCash,
        totalAssets,
        formattedTotal: formatNumberCompact(totalAssets),
        formattedVaultCash: formatNumberCompact(netVaultCash),
        formattedReceivables: formatNumberCompact(totalAssets - netVaultCash)
      },
      liabilities: {
        outstandingDebt: totalLiabilities,
        outstandingPayables: 0,
        totalLiabilities,
        formattedTotal: formatNumberCompact(totalLiabilities),
        formattedDebt: formatNumberCompact(totalLiabilities),
        formattedPayables: formatNumberCompact(0)
      },
      equity: {
        accumulatedWealth,
        formattedTotal: formatNumberCompact(accumulatedWealth)
      }
    };

    return {
      total_income,
      total_expenses,
      total_receipts,
      total_payments,
      net_cash_balance,
      total_debt,
      savings_efficiency,
      payablesReceivablesKpis,
      categoryData,
      entityData,
      timeData,
      prTimePoints,
      openPayablesByCategory,
      openPayablesByEntity,
      openPayablesByMonth,
      paymentMethodsDistribution,
      liabilitiesKpis,
      liabilitiesTimePoints,
      debtByEntity,
      debtByType,
      incomeStatement: {
        revenues: formattedRevenues,
        expenses: formattedExpenses,
        totalRevenue: incomeStatement.totalRevenue,
        totalExpense: incomeStatement.totalExpense,
        netAccruedIncome: incomeStatement.netAccruedIncome,
        formattedNet: incomeStatement.formattedNet
      },
      cashFlowStatement: {
        operating: formattedOperating,
        investing: formattedInvesting,
        financing: formattedFinancing,
        netOperating: cashFlowStatement.netOperating,
        netInvesting: cashFlowStatement.netInvesting,
        netFinancing: cashFlowStatement.netFinancing,
        netCashFlow: cashFlowStatement.netCashFlow,
        formattedNet: formatNumberCompact(cashFlowStatement.netCashFlow),
        formattedOperating: formatNumberCompact(cashFlowStatement.netOperating),
        formattedInvesting: formatNumberCompact(cashFlowStatement.netInvesting),
        formattedFinancing: formatNumberCompact(cashFlowStatement.netFinancing)
      },
      balanceSheet
    };
  }, [kpiSummary, dbPayablesReceivablesKpis, flowByCategory, timeEvolution, topEntities, filteredTransactions, allTxs]);
}

