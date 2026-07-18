import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import useKingdomStore from '../../store/useKingdomStore';
import { generateNetTrendData } from '../../utils/chartAnalytics';

export default function NetWorthChart() {
  const { transactions, dashboardMetrics } = useKingdomStore();
  const data = generateNetTrendData(transactions);
  const currentNetWorth = dashboardMetrics?.net_worth ?? 0;

  return (
    <div className="bg-stone-900/40 border border-amber-900/30 rounded-lg p-4 flex flex-col h-full">
      {/* Header Container */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0">
        <div>
          <h3 className="font-serif text-amber-400 text-sm tracking-wider uppercase">
            Net Worth Timeline
          </h3>
          <p className="text-[10px] text-stone-500 font-mono mt-0.5">
            Cumulative net trajectory across active periods
          </p>
        </div>

        {/* Server-Side Calculated Global Valuation Highlight */}
        <div className="font-mono text-[10px] px-2.5 py-1 rounded bg-amber-950/40 border border-amber-900/30 text-amber-400 self-start sm:self-auto">
          Net Valuation: <span className="font-bold text-amber-300">{currentNetWorth.toLocaleString()}g</span>
        </div>
      </div>

      {/* Recharts Container */}
      <div className="flex-1 min-h-0 w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#fbbf24" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#451a03" 
              opacity={0.4} 
              vertical={false} 
            />

            <XAxis
              dataKey="month"
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
              formatter={(value) => [
                `${Number(value).toLocaleString()} g`,
                'Net Valuation'
              ]}
            />

            <Area
              type="monotone"
              dataKey="net"
              stroke="#fbbf24"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorNet)"
              dot={{ fill: '#fbbf24', r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}