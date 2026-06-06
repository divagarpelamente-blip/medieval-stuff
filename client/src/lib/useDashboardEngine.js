import { useMemo } from 'react';

/**
 * useDashboardEngine
 * Processes an array of raw transactions into pristine, pre-calculated 4-tier volumes.
 */
export function useDashboardEngine(transactions = []) {
  return useMemo(() => {
    const engine = {
      total_income: 0,
      total_expenses: 0,
      total_receipts: 0,
      total_payments: 0,
      categoryVolumes: {},
      entityVolumes: {},
      timeVolumes: {} // for the time series
    };

    transactions.forEach((tx) => {
      const amount = Number(tx.amount) || 0;
      
      const tType = tx.transaction_type || 'Unknown';
      const tSubtype = tx.transaction_subtype || 'Unknown';
      const tCategory = tx.transaction_category || 'Unknown';
      const tEntity = tx.entity || 'Unknown';
      const tMonth = tx.month || 'Unknown';
      const tYear = tx.year || 'Unknown';
      const tNature = tx.transaction_nature || 'accrual';
      const tFlow = tx.transaction_flow || 'outflow';
      const tTimeLabel = `${tYear} ${tMonth}`;

      // Core Accounting Matrix
      if (tNature === 'accrual' && tFlow === 'inflow') engine.total_income += amount;
      if (tNature === 'accrual' && tFlow === 'outflow') engine.total_expenses += amount;
      if (tNature === 'cash' && tFlow === 'inflow') engine.total_receipts += amount;
      if (tNature === 'cash' && tFlow === 'outflow') engine.total_payments += amount;

      // Aggregate Category Volumes
      if (!engine.categoryVolumes[tCategory]) engine.categoryVolumes[tCategory] = { income: 0, expense: 0, receipt: 0, payment: 0 };
      if (tNature === 'accrual' && tFlow === 'inflow') engine.categoryVolumes[tCategory].income += amount;
      if (tNature === 'accrual' && tFlow === 'outflow') engine.categoryVolumes[tCategory].expense += amount;
      if (tNature === 'cash' && tFlow === 'inflow') engine.categoryVolumes[tCategory].receipt += amount;
      if (tNature === 'cash' && tFlow === 'outflow') engine.categoryVolumes[tCategory].payment += amount;

      // Aggregate Entity Volumes
      if (!engine.entityVolumes[tEntity]) engine.entityVolumes[tEntity] = { income: 0, expense: 0, receipt: 0, payment: 0 };
      if (tNature === 'accrual' && tFlow === 'inflow') engine.entityVolumes[tEntity].income += amount;
      if (tNature === 'accrual' && tFlow === 'outflow') engine.entityVolumes[tEntity].expense += amount;
      if (tNature === 'cash' && tFlow === 'inflow') engine.entityVolumes[tEntity].receipt += amount;
      if (tNature === 'cash' && tFlow === 'outflow') engine.entityVolumes[tEntity].payment += amount;

      // Aggregate Time Volumes
      if (!engine.timeVolumes[tTimeLabel]) engine.timeVolumes[tTimeLabel] = { label: tTimeLabel, classIncome: 0, classExpense: 0, subReceipt: 0, subPayment: 0 };
      if (tNature === 'accrual' && tFlow === 'inflow') engine.timeVolumes[tTimeLabel].classIncome += amount;
      if (tNature === 'accrual' && tFlow === 'outflow') engine.timeVolumes[tTimeLabel].classExpense += amount;
      if (tNature === 'cash' && tFlow === 'inflow') engine.timeVolumes[tTimeLabel].subReceipt += amount;
      if (tNature === 'cash' && tFlow === 'outflow') engine.timeVolumes[tTimeLabel].subPayment += amount;
    });

    const net_cash_balance = engine.total_receipts - engine.total_payments;
    const savings_efficiency = engine.total_receipts > 0 ? (net_cash_balance / engine.total_receipts) * 100 : 0;

    const categoryData = Object.entries(engine.categoryVolumes).map(([name, vals]) => ({ 
      name, 
      ...vals, 
      totalClass: vals.income + vals.expense,
      totalSubclass: vals.receipt + vals.payment
    }));

    const entityData = Object.entries(engine.entityVolumes).map(([name, vals]) => ({ 
      name, 
      ...vals, 
      totalClass: vals.income + vals.expense,
      totalSubclass: vals.receipt + vals.payment
    })).sort((a, b) => b.totalClass - a.totalClass);

    const timeData = Object.values(engine.timeVolumes);

    return {
      total_income: engine.total_income,
      total_expenses: engine.total_expenses,
      total_receipts: engine.total_receipts,
      total_payments: engine.total_payments,
      net_cash_balance,
      savings_efficiency,
      categoryData,
      entityData,
      timeData
    };
  }, [transactions]);
}
