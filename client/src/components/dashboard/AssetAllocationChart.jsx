import React, { useMemo } from 'react';
import { useKingdomStore } from '../../store/useKingdomStore';
import { generateCategoryBreakdown } from '../../utils/chartAnalytics';

const MEDIEVAL_COLORS = ['#d97706', '#b45309', '#059669', '#047857', '#1d4ed8', '#6b21a8'];

export default function AssetAllocationChart() {
  const categoryView = useKingdomStore((state) => state.analytics?.category || []);
  const monthlyView = useKingdomStore((state) => state.analytics?.monthly || []);

  const data = useMemo(() => {
    return generateCategoryBreakdown(categoryView, 'Assets').slice(0, 5);
  }, [categoryView]);

  const totalAssetValue = useMemo(() => {
    return data.reduce((sum, item) => sum + item.value, 0);
  }, [data]);

  const dataWithMeta = useMemo(() => {
    return data.map((item, index) => {
      const percentage = totalAssetValue > 0 ? ((item.value / totalAssetValue) * 100).toFixed(1) : 0;
      return { ...item, percentage, count: '-', color: MEDIEVAL_COLORS[index % MEDIEVAL_COLORS.length] };
    });
  }, [data, totalAssetValue]);

  const healthScore = useMemo(() => {
    let income = 0;
    let expenses = 0;
    monthlyView.forEach((row) => {
      const amt = Number(row.total_amount) || 0;
      if (row.type === 'Income') income += amt;
      if (row.type === 'Expenses') expenses += Math.abs(amt);
    });

    if (income === 0 && expenses === 0) return 100;
    if (income === 0) return 0;
    const ratio = income / (income + expenses);
    return Math.round(ratio * 100);
  }, [monthlyView]);

  const getHealthDescriptor = (score) => {
    if (score >= 80) return { label: 'Flourishing', color: 'text-emerald-500' };
    if (score >= 50) return { label: 'Stable', color: 'text-amber-500' };
    return { label: 'Strained', color: 'text-rose-500' };
  };

  const healthMeta = getHealthDescriptor(healthScore);
  const formatGP = (val) => `${Number(val).toLocaleString()} GP`;

  return (
    <div className="w-full h-full min-h-[380px] rounded-xl border border-amber-900/40 bg-stone-950 p-6 flex flex-col justify-between gap-6 shadow-2xl">
      <div>
        <h3 className="text-lg font-serif font-bold tracking-wide text-amber-500 uppercase">Asset Allocation Breakdown</h3>
        <p className="text-xs text-stone-400 mt-1">Distribution of wealth holdings across tactical categories</p>
      </div>
      <div className="flex flex-col gap-4 flex-1 justify-center">
        {dataWithMeta.map((item) => (
          <div key={item.name} className="flex items-center justify-between border-b border-stone-900/40 pb-2 last:border-0 last:pb-0">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-sm flex-shrink-0 border border-amber-950/50" style={{ backgroundColor: item.color }} />
              <div>
                <p className="text-sm font-serif font-semibold text-stone-100">{item.name}</p>
              </div>
            </div>
            <div className="text-right font-mono">
              <p className="text-sm font-bold text-stone-100">{formatGP(item.value)}</p>
              <p className="text-xs font-semibold text-amber-500">{item.percentage}%</p>
            </div>
          </div>
        ))}
        {dataWithMeta.length === 0 && (
          <p className="text-sm py-8 text-center font-serif text-stone-500">No active asset reserves discovered in current ledger cycles.</p>
        )}
      </div>
      <div className="w-full h-px bg-amber-900/20" />
      <div className="p-3.5 rounded bg-stone-900/30 border border-amber-950/50 flex items-center justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-wider font-semibold text-stone-400">Treasury Health Score</p>
          <p className="text-xs text-stone-500">Calculated via ratio of ledger earnings to expenses</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-mono font-black tracking-tighter text-amber-400">{healthScore}%</p>
          <span className={`text-[10px] font-serif font-bold uppercase ${healthMeta.color}`}>{healthMeta.label}</span>
        </div>
      </div>
    </div>
  );
}