import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useKingdomStore } from '../../store/useKingdomStore';
import { generateCashFlowData } from '../../utils/chartAnalytics';

export default function CashFlowChart() {
  const monthlyView = useKingdomStore((state) => state.analytics?.monthly || []);

  const data = useMemo(() => {
    return generateCashFlowData(monthlyView);
  }, [monthlyView]);

  const stats = useMemo(() => {
    if (!data.length) return { avgIncome: 0, avgExpense: 0 };
    const totalIncome = data.reduce((sum, d) => sum + d.income, 0);
    const totalExpense = data.reduce((sum, d) => sum + d.expenses, 0);
    return {
      avgIncome: totalIncome / data.length,
      avgExpense: totalExpense / data.length,
    };
  }, [data]);

  const formatGP = (val) => `${Number(val).toLocaleString()} GP`;

  return (
    <div className="w-full h-full min-h-[380px] flex flex-col bg-white border border-gray-200 rounded-xl p-6 shadow-sm gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-sans font-semibold tracking-wide text-gray-500 uppercase">Income vs Expenses</h3>
          <p className="text-xs text-gray-400 mt-1">Historical evolution of all Income vs Expenses</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-600 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Avg Inflow: {Number(Math.abs(stats.avgIncome).toFixed(0)).toLocaleString()}
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-600 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Avg Outflow: {Number(Math.abs(stats.avgExpense).toFixed(0)).toLocaleString()}
          </div>
        </div>
      </div>

      <div className="flex-1 w-full min-h-0 overflow-hidden relative">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 5, left: -15, bottom: 0 }}>
            <defs>
              <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid stroke="#f3f4f6" strokeDasharray="3 3" vertical={false} />

            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: 500 }} axisLine={false} tickLine={false} tickMargin={12} />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: 500 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tickMargin={8} />

            <Tooltip
              contentStyle={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px', color: '#111827', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
              labelStyle={{ fontWeight: 600, color: '#6b7280', marginBottom: '4px' }}
              formatter={(value, name) => [formatGP(Math.abs(value)), name === 'income' ? 'Inflows' : 'Outflows']}
            />

            <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2.5} fill="url(#incomeGrad)" dot={{ fill: '#10b981', r: 4, strokeWidth: 1, stroke: '#ffffff' }} activeDot={{ r: 6, fill: '#10b981', strokeWidth: 0 }} />
            <Area type="monotone" dataKey="expenses" stroke="#f43f5e" strokeWidth={2.5} fill="url(#expenseGrad)" dot={{ fill: '#f43f5e', r: 4, strokeWidth: 1, stroke: '#ffffff' }} activeDot={{ r: 6, strokeWidth: 0 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}