import React, { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { useKingdomStore } from '../../store/useKingdomStore';
import { generateCashFlowData } from '../../utils/chartAnalytics';

export default function CashFlowChart({ transactions }) {
  const storeTransactions = useKingdomStore((state) => state.transactions || []);
  const activeTransactions = transactions || storeTransactions;

  const data = useMemo(() => {
    return generateCashFlowData(activeTransactions);
  }, [activeTransactions]);

  // Calculate averages for treasury metrics
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
    <div className="w-full h-full min-h-[380px] rounded-xl border border-amber-900/40 bg-stone-950 p-6 flex flex-col gap-6 shadow-2xl">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-serif font-bold tracking-wide text-amber-500 uppercase">
            Treasury Cash Flow
          </h3>
          <p className="text-xs text-stone-400 mt-1">
            Chronological log of inflows vs outflows over the past cycles
          </p>
        </div>

        {/* Tactical Badges */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-emerald-950/40 border border-emerald-900/50 text-xs font-semibold text-emerald-400 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Avg Inflow: {formatGP(stats.avgIncome.toFixed(0))}
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-rose-950/40 border border-rose-900/50 text-xs font-semibold text-rose-400 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Avg Outflow: {formatGP(stats.avgExpense.toFixed(0))}
          </div>
        </div>
      </div>

      {/* Recharts Area Container */}
      <div className="flex-1 w-full min-h-[240px]">
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

            <CartesianGrid stroke="#292524" strokeDasharray="3 3" vertical={false} />

            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: '#a8a29e', fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
              tickMargin={12}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#a8a29e', fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              tickMargin={8}
            />

            <Tooltip
              contentStyle={{
                background: '#0c0a09',
                border: '1px solid rgba(146, 64, 14, 0.5)',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#f5f5f4',
                boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
              }}
              labelStyle={{ fontWeight: 700, color: '#f59e0b', marginBottom: '4px' }}
              formatter={(value, name) => [
                formatGP(value),
                name === 'income' ? 'Inflows' : 'Outflows',
              ]}
            />

            <Area
              type="monotone"
              dataKey="income"
              stroke="#10b981"
              strokeWidth={2.5}
              fill="url(#incomeGrad)"
              dot={{ fill: '#10b981', r: 4, strokeWidth: 1, stroke: '#0c0a09' }}
              activeDot={{ r: 6, fill: '#10b981', strokeWidth: 0 }}
            />
            <Area
              type="monotone"
              dataKey="expenses"
              stroke="#f43f5e"
              strokeWidth={2.5}
              fill="url(#expenseGrad)"
              dot={{ fill: '#f43f5e', r: 4, strokeWidth: 1, stroke: '#0c0a09' }}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}