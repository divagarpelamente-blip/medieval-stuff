import { useMemo } from 'react';
import { useKingdomStore } from '../store/useKingdomStore';

/**
 * useDashboardEngine
 * Pure adapter layer mapping Zero-Calculation PostgreSQL View payloads
 * directly into the legacy UI structure without ANY client-side math arrays.
 */
export function useDashboardEngine() {
  const kpiSummary = useKingdomStore(state => state.kpiSummary);
  const flowByCategory = useKingdomStore(state => state.flowByCategory);
  const timeEvolution = useKingdomStore(state => state.timeEvolution);
  const topEntities = useKingdomStore(state => state.topEntities);

  return useMemo(() => {
    // 1. Dual-Row KPI Summary Metrics
    const total_income = kpiSummary?.total_income || 0;
    const total_expenses = kpiSummary?.total_expenses || 0;
    const total_receipts = kpiSummary?.total_receipts || 0;
    const total_payments = kpiSummary?.total_payments || 0;
    const net_cash_balance = kpiSummary?.net_cash_balance || 0;
    const total_debt = kpiSummary?.total_debt || 0;
    const savings_efficiency = kpiSummary?.savings_efficiency || 0;

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

    return {
      total_income,
      total_expenses,
      total_receipts,
      total_payments,
      net_cash_balance,
      total_debt,
      savings_efficiency,
      categoryData,
      entityData,
      timeData
    };
  }, [kpiSummary, flowByCategory, timeEvolution, topEntities]);
}
