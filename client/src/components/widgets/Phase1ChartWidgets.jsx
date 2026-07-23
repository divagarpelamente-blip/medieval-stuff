import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useKingdomStore } from '../../store/useKingdomStore';
import { generateCashFlowData, generateNetTrendData, generateCumulativeCashFlowData } from '../../utils/chartAnalytics';

const formatValue = (val) => {
  const num = Number(val) || 0;
  const formattedNum = Math.abs(num).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return num < 0 ? `(${formattedNum})` : formattedNum;
};

const TrendChartCard = ({ title, subtitle, data, dataKey, xAxisKey, color, isNegative }) => (
  <div className="w-full h-full min-h-[300px] flex flex-col bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
    <div className="mb-4">
      <h3 className="text-sm font-sans font-semibold tracking-wide text-gray-500 uppercase">{title}</h3>
      <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
    </div>
    <div className="flex-1 w-full min-h-[200px]">
      <ResponsiveContainer height="100%" width="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id={`color-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.2} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#f3f4f6" strokeDasharray="3 3" vertical={false}/>
          <XAxis dataKey={xAxisKey} axisLine={false} tickLine={false} tickMargin={10} tick={{ fontSize: 11, fill: '#9ca3af' }} />
          <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
          <Tooltip 
            formatter={(value) => [formatValue(isNegative ? Math.abs(value) : value), title]}
            contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', color: '#111827', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
            labelStyle={{ fontWeight: 600, color: '#6b7280', marginBottom: '4px' }}
          />
          <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2.5} fill={`url(#color-${dataKey})`} fillOpacity={1} dot={{ r: 4, strokeWidth: 1 }} activeDot={{ r: 6 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </div>
);

export const IncomeTrendWidget = ({ transactions }) => {
  const activeTx = transactions || useKingdomStore((state) => state.transactions || []);
  const data = useMemo(() => generateCashFlowData(activeTx), [activeTx]);
  return <TrendChartCard color="#10b981" data={data} dataKey="income" subtitle="Historical monthly revenue velocity" title="Income Trend" xAxisKey="name"/>;
};

export const ExpenseTrendWidget = ({ transactions }) => {
  const activeTx = transactions || useKingdomStore((state) => state.transactions || []);
  const data = useMemo(() => generateCashFlowData(activeTx), [activeTx]);
  return <TrendChartCard color="#f43f5e" data={data} dataKey="expenses" isNegative={true} subtitle="Historical monthly outflow patterns" title="Expense Trend" xAxisKey="name"/>;
};

export const CumulativeCashFlowWidget = ({ transactions }) => {
  const activeTx = transactions || useKingdomStore((state) => state.transactions || []);
  const data = useMemo(() => generateCumulativeCashFlowData(activeTx), [activeTx]);
  return <TrendChartCard color="#3b82f6" data={data} dataKey="cumulative" subtitle="Running net-flow balance trajectory" title="Cumulative Cash Flow" xAxisKey="name"/>;
};

export const AssetGrowthTrendWidget = ({ transactions }) => {
  const activeTx = transactions || useKingdomStore((state) => state.transactions || []);
  const data = useMemo(() => generateNetTrendData(activeTx), [activeTx]);
  return <TrendChartCard color="#6366f1" data={data} dataKey="assets" subtitle="Historical growth of gross assets" title="Asset Growth Trend" xAxisKey="month"/>;
};

export const DebtTrendWidget = ({ transactions }) => {
  const activeTx = transactions || useKingdomStore((state) => state.transactions || []);
  const data = useMemo(() => generateNetTrendData(activeTx), [activeTx]);
  return <TrendChartCard color="#f97316" data={data} dataKey="liabilities" subtitle="Historical debt accumulation and reduction" title="Debt Trend" xAxisKey="month"/>;
};

export const NetWorthTrendWidget = ({ transactions }) => {
  const activeTx = transactions || useKingdomStore((state) => state.transactions || []);
  const data = useMemo(() => generateNetTrendData(activeTx), [activeTx]);
  return <TrendChartCard color="#111827" data={data} dataKey="net" subtitle="Global net wealth trajectory" title="Net Worth Trend" xAxisKey="month"/>;
};
