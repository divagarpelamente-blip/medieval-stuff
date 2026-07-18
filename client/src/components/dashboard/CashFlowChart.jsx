import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import useKingdomStore from '../../store/useKingdomStore';
import { generateCashFlowData } from '../../utils/chartAnalytics';

export default function CashFlowChart() {
  const { transactions } = useKingdomStore();
  const data = generateCashFlowData(transactions);

  // Calculate historical averages for HUD metric badges
  const avgIncome = data.length 
    ? data.reduce((sum, item) => sum + item.income, 0) / data.length 
    : 0;
  const avgExpense = data.length 
    ? data.reduce((sum, item) => sum + item.expenses, 0) / data.length 
    : 0;

  return (
    <div className="bg-stone-900/40 border border-amber-900/30 rounded-lg p-4 flex flex-col h-full">
      {/* Header Container */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0">
        <div>
          <h3 className="font-serif text-amber-400 text-sm tracking-wider uppercase">
            Cash Flow Analytics
          </h3>
          <p className="text-[10px] text-stone-500 font-mono mt-0.5">
            Chronological Inflow vs Outflow Ledger Summary
          </p>
        </div>

        {/* Quick Analytics Badges */}
        <div className="flex items-center gap-2 font-mono text-[10px]">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-950/40 border border-emerald-900/30 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Avg Inflow: {Math.round(avgIncome).toLocaleString()}g
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-rose-950/40 border border-rose-900/30 text-rose-400">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Avg Outflow: {Math.round(avgExpense).toLocaleString()}g
          </div>
        </div>
      </div>

      {/* Recharts Container */}
      <div className="flex-1 min-h-0 w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#451a03" 
              opacity={0.4} 
              vertical={false} 
            />

            <XAxis
              dataKey="name"
              stroke="#a8a29e"
              fontSize={10}
              fontFamily="monospace"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />

            <YAxis
              stroke="#a8a29e"
              fontSize={10}
              fontFamily="monospace"
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => `${val}g`}
              tickMargin={8}
            />

            <Tooltip
              contentStyle={{
                backgroundColor: '#0c0a09',
                borderColor: '#78350f',
                borderRadius: '0.375rem',
                fontFamily: 'monospace',
                fontSize: '11px',
                color: '#a8a29e'
              }}
              itemStyle={{ padding: '2px 0' }}
              formatter={(value, name) => [
                `${Number(value).toLocaleString()} g`,
                name === 'income' ? 'Income' : 'Expenses'
              ]}
            />

            <Legend 
              wrapperStyle={{ 
                fontSize: '10px', 
                fontFamily: 'monospace', 
                paddingTop: '10px' 
              }} 
              iconSize={8}
            />

            <Bar
              dataKey="income"
              fill="#10b981"
              name="Income"
              radius={[4, 4, 0, 0]}
            />

            <Bar
              dataKey="expenses"
              fill="#f43f5e"
              name="Expenses"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}