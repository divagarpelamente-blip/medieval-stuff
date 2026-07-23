import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useKingdomStore } from '../../store/useKingdomStore';
import { generateCategoryBreakdown, generateDebtHorizonBreakdown } from '../../utils/chartAnalytics';

// Monochromatic Slate Palette
const PIE_COLORS = ['#111827', '#374151', '#4b5563', '#6b7280', '#9ca3af', '#d1d5db'];

const formatValue = (val) => {
  const num = Number(val) || 0;
  const formattedNum = Math.abs(num).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return num < 0 ? `(${formattedNum})` : formattedNum;
};

const PieChartCard = ({ title, subtitle, data, isDonut = false }) => (
  <div className="w-full h-full min-h-[300px] flex flex-col bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
    <div className="mb-2">
      <h3 className="text-sm font-sans font-semibold tracking-wide text-gray-500 uppercase">{title}</h3>
      <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
    </div>
    <div className="flex-1 w-full relative min-h-[200px]">
      {data.length > 0 ? (
        <ResponsiveContainer height="100%" width="100%">
          <PieChart>
            <Pie 
              cx="50%" 
              cy="50%" 
              data={data} 
              dataKey="value" 
              innerRadius={isDonut ? "55%" : "0%"} 
              outerRadius="80%" 
              paddingAngle={isDonut ? 2 : 0} 
              stroke={isDonut ? "none" : "#ffffff"} 
              strokeWidth={1.5}
            >
              {data.map((entry, index) => (
                <Cell fill={PIE_COLORS[index % PIE_COLORS.length]} key={`cell-${index}`}/>
              ))}
            </Pie>
            <Tooltip formatter={(value) => [formatValue(value), 'Value']}
              contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', color: '#111827', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', fontSize: '12px' }}
              itemStyle={{ fontWeight: 600 }}
            />
            <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#6b7280' }}/>
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-xs font-mono text-gray-400 italic">
          No data available for this breakdown.
        </div>
      )}
    </div>
  </div>
);

// Exports
export const IncomeCategoryWidget = ({ transactions }) => {
  const activeTx = transactions || useKingdomStore(s => s.transactions || []);
  const data = useMemo(() => generateCategoryBreakdown(activeTx, '7', 'category'), [activeTx]);
  return <PieChartCard data={data} isDonut={true} subtitle="Revenue distribution overview" title="Income by Category"/>;
};

export const IncomeTypeWidget = ({ transactions }) => {
  const activeTx = transactions || useKingdomStore(s => s.transactions || []);
  const data = useMemo(() => generateCategoryBreakdown(activeTx, '7', 'subtype'), [activeTx]);
  return <PieChartCard data={data} subtitle="Earned vs automated revenue" title="Active vs. Passive Income"/>;
};

export const ExpenseCategoryWidget = ({ transactions }) => {
  const activeTx = transactions || useKingdomStore(s => s.transactions || []);
  const data = useMemo(() => generateCategoryBreakdown(activeTx, '6', 'category'), [activeTx]);
  return <PieChartCard data={data} isDonut={true} subtitle="High-level spending distribution" title="Expenses by Category"/>;
};

export const ExpenseSubtypeWidget = ({ transactions }) => {
  const activeTx = transactions || useKingdomStore(s => s.transactions || []);
  const data = useMemo(() => generateCategoryBreakdown(activeTx, '6', 'subtype'), [activeTx]);
  return <PieChartCard data={data} isDonut={true} subtitle="Detailed operational breakdown" title="Expenses by Subtype"/>;
};

export const AssetAllocationWidget = ({ transactions }) => {
  const activeTx = transactions || useKingdomStore(s => s.transactions || []);
  const data = useMemo(() => generateCategoryBreakdown(activeTx, '1', 'subtype'), [activeTx]);
  return <PieChartCard data={data} subtitle="Wealth breakdown by class" title="Asset Allocation"/>;
};

export const LiabilitiesSubtypeWidget = ({ transactions }) => {
  const activeTx = transactions || useKingdomStore(s => s.transactions || []);
  const data = useMemo(() => generateCategoryBreakdown(activeTx, '2', 'subtype'), [activeTx]);
  return <PieChartCard data={data} isDonut={true} subtitle="Debt category distribution" title="Liabilities by Subtype"/>;
};

export const DebtHorizonWidget = ({ transactions }) => {
  const activeTx = transactions || useKingdomStore(s => s.transactions || []);
  const data = useMemo(() => generateDebtHorizonBreakdown(activeTx), [activeTx]);
  return <PieChartCard data={data} subtitle="Immediate vs macro obligations" title="Short vs. Long-Term Debt"/>;
};
