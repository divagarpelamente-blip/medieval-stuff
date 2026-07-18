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
import { generateNetTrendData } from '../../utils/chartAnalytics';

export default function NetWorthChart({ transactions }) {
  const storeTransactions = useKingdomStore((state) => state.transactions || []);
  const activeTransactions = transactions || storeTransactions;

  const data = useMemo(() => {
    return generateNetTrendData(activeTransactions);
  }, [activeTransactions]);

  const formatGP = (val) => `${Number(val).toLocaleString()} GP`;

  return (
    <div className="w-full h-full min-h-[380px] rounded-xl border border-amber-900/40 bg-stone-950 p-6 flex flex-col gap-6 shadow-2xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-serif font-bold tracking-wide text-amber-500 uppercase">
            Net Treasury Curve
          </h3>
          <p className="text-xs text-stone-400 mt-1">
            Chronological trend of total capital reserves
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded bg-amber-950/30 border border-amber-900/30">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400">
            Reserves Trend
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 w-full min-h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 12, right: 8, left: -15, bottom: 4 }}>
            <defs>
              <linearGradient id="netGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid stroke="#292524" strokeDasharray="3 3" vertical={false} />

            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#a8a29e', fontWeight: 500 }}
              tickMargin={12}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              tick={{ fontSize: 11, fill: '#a8a29e', fontWeight: 500 }}
              tickMargin={8}
            />

            <Tooltip
              contentStyle={{
                backgroundColor: '#0c0a09',
                borderRadius: '8px',
                border: '1px solid rgba(146, 64, 14, 0.5)',
                color: '#f5f5f4',
                boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
                padding: '10px 14px',
              }}
              formatter={(value) => [formatGP(value), 'Net Position']}
              labelStyle={{ fontWeight: 700, color: '#f59e0b', marginBottom: '4px' }}
            />

            <Area
              type="monotone"
              dataKey="net"
              stroke="#f59e0b"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#netGradient)"
              dot={{ fill: '#f59e0b', r: 4, strokeWidth: 1, stroke: '#0c0a09' }}
              activeDot={{ r: 6, fill: '#f59e0b', strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}