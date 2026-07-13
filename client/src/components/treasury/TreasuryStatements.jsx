import React, { useMemo } from 'react';
import { useKingdomStore } from '../../store/useKingdomStore';

export default function TreasuryStatements({ 
  selectedYears = [], 
  selectedQuarters = [], 
  selectedMonths = [],
  isFallbackState = false 
}) {
  const allTxs = useKingdomStore(state => state.transactions) || [];
  const accountBalances = useKingdomStore(state => state.accountBalances) || [];
  const flatMatrix = useKingdomStore(state => state.flatMatrix) || [];

  // Helper to check if transaction falls in selected periods
  const filterTxExact = (tx) => {
    if (isFallbackState) return false;
    if (!selectedYears.includes(String(tx.year))) return false;

    const quarterToMonths = {
      'Q1': ['January', 'February', 'March'],
      'Q2': ['April', 'May', 'June'],
      'Q3': ['July', 'August', 'September'],
      'Q4': ['October', 'November', 'December']
    };

    if (selectedQuarters.length > 0 && selectedMonths.length === 0) {
      const allowedMonths = selectedQuarters.flatMap(q => quarterToMonths[q]);
      return allowedMonths.includes(tx.month);
    }

    if (selectedMonths.length > 0 && selectedQuarters.length === 0) {
      return selectedMonths.includes(tx.month);
    }

    if (selectedQuarters.length > 0 && selectedMonths.length > 0) {
      const allowedFromQuarters = selectedQuarters.flatMap(q => quarterToMonths[q]);
      const unionMonths = Array.from(new Set([...allowedFromQuarters, ...selectedMonths]));
      return unionMonths.includes(tx.month);
    }

    return false;
  };

  const statements = useMemo(() => {
    const txsInPeriod = allTxs.filter(filterTxExact);
    
    // Profit & Loss Aggregation
    const plRevenues = {};
    const plExpenses = {};
    let totalRevenue = 0;
    let totalExpense = 0;

    txsInPeriod.forEach(tx => {
      if (['Completed', 'Paid', 'Paid on Time', 'Paid Late'].includes(tx.payment_status)) {
        if (tx.transaction_type === 'Income' || tx.transaction_type === 'Expense') {
          // Fallback to flatMatrix lookup if transaction_category is somehow missing
          let cat = tx.transaction_category;
          if (!cat) {
             const code = tx.target_account || tx.source_dest_bank;
             const found = code ? flatMatrix.find(row => row.code === code) : null;
             cat = found?.category || 'Other';
          }

          const amt = Number(tx.amount) || 0;
          if (tx.transaction_type === 'Income') {
            plRevenues[cat] = (plRevenues[cat] || 0) + amt;
            totalRevenue += amt;
          } else {
            plExpenses[cat] = (plExpenses[cat] || 0) + amt;
            totalExpense += amt;
          }
        }
      }
    });

    const formatArray = (dict) => Object.entries(dict)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);

    return {
      revenue: formatArray(plRevenues),
      expense: formatArray(plExpenses),
      totalRevenue,
      totalExpense,
      netIncome: totalRevenue - totalExpense
    };
  }, [allTxs, selectedYears, selectedQuarters, selectedMonths, isFallbackState, flatMatrix]);

  const formatMoney = (val) => Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + 'g';

  if (isFallbackState) {
    return (
      <div className="flex items-center justify-center p-8 bg-stone-50 rounded-xl border border-stone-200">
        <p className="text-stone-500 font-serif italic text-sm">Please select a time period to view the statements.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm">
      <div className="mb-6 pb-4 border-b-2 border-stone-800">
        <h2 className="text-2xl font-serif font-black text-stone-900 uppercase tracking-widest text-center">Profit & Loss Statement</h2>
        <p className="text-center text-stone-500 text-xs font-bold uppercase tracking-wider mt-1">
          {selectedYears.join(', ')} | {selectedQuarters.join(', ')} | {selectedMonths.join(', ')}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Revenues */}
        <div>
          <h3 className="text-sm font-black text-emerald-800 uppercase tracking-wider border-b border-emerald-200 pb-2 mb-3">Revenues (Inflows)</h3>
          <div className="space-y-2">
            {statements.revenue.map(item => (
              <div key={item.name} className="flex justify-between text-sm">
                <span className="text-stone-700">{item.name}</span>
                <span className="font-mono text-emerald-700">{formatMoney(item.amount)}</span>
              </div>
            ))}
            {statements.revenue.length === 0 && <p className="text-xs text-stone-400 italic">No revenues recorded.</p>}
          </div>
          <div className="mt-4 pt-3 border-t-2 border-emerald-800 flex justify-between font-black text-emerald-900">
             <span>Total Revenue</span>
             <span className="font-mono">{formatMoney(statements.totalRevenue)}</span>
          </div>
        </div>

        {/* Expenses */}
        <div>
          <h3 className="text-sm font-black text-rose-800 uppercase tracking-wider border-b border-rose-200 pb-2 mb-3">Expenses (Outflows)</h3>
          <div className="space-y-2">
            {statements.expense.map(item => (
              <div key={item.name} className="flex justify-between text-sm">
                <span className="text-stone-700">{item.name}</span>
                <span className="font-mono text-rose-700">{formatMoney(item.amount)}</span>
              </div>
            ))}
            {statements.expense.length === 0 && <p className="text-xs text-stone-400 italic">No expenses recorded.</p>}
          </div>
          <div className="mt-4 pt-3 border-t-2 border-rose-800 flex justify-between font-black text-rose-900">
             <span>Total Expenses</span>
             <span className="font-mono">{formatMoney(statements.totalExpense)}</span>
          </div>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t-4 border-stone-800">
        <div className="flex justify-between items-center bg-stone-100 p-4 rounded-lg">
          <span className="text-lg font-black text-stone-800 uppercase tracking-widest">Net Income</span>
          <span className={`text-2xl font-mono font-black ${statements.netIncome >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
            {statements.netIncome >= 0 ? '+' : ''}{formatMoney(statements.netIncome)}
          </span>
        </div>
      </div>
    </div>
  );
}