import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useKingdomStore } from '../../store/useKingdomStore';
import { generateCategoryBreakdown } from '../../utils/chartAnalytics';

const PIE_COLORS = ['#111827', '#374151', '#4b5563', '#6b7280', '#9ca3af', '#d1d5db'];

const formatValue = (val) => {
  const num = Number(val) || 0;
  const formattedNum = Math.abs(num).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return num < 0 ? `(${formattedNum})` : formattedNum;
};

// Removed calculateDebtHorizon to comply with data-flow rules

const PieChartCard = ({ title, subtitle, data, isDonut = false }) => (
  <div className="w-full h-full min-h-[300px] flex flex-col bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
    <div className="mb-2">
      <h3 className="text-sm font-sans font-semibold tracking-wide text-gray-500 uppercase">{title}</h3>
      <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
    </div>
    <div className="flex-1 w-full min-h-0 overflow-hidden relative">
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
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

export const IncomeCategoryWidget = () => {
  const categoryView = useKingdomStore(s => s.analytics?.category || []);
  const data = useMemo(() => generateCategoryBreakdown(categoryView, 'Income', 'category'), [categoryView]);
  return <PieChartCard data={data} isDonut={true} subtitle="Revenue distribution overview" title="Income by Category"/>;
};

export const IncomeTypeWidget = () => {
  const categoryView = useKingdomStore(s => s.analytics?.category || []);
  const data = useMemo(() => generateCategoryBreakdown(categoryView, 'Income', 'subtype'), [categoryView]);
  return <PieChartCard data={data} subtitle="Earned vs automated revenue" title="Active vs. Passive Income"/>;
};

export const ExpenseCategoryWidget = () => {
  const categoryView = useKingdomStore(s => s.analytics?.category || []);
  const data = useMemo(() => generateCategoryBreakdown(categoryView, 'Expenses', 'category'), [categoryView]);
  return <PieChartCard data={data} isDonut={true} subtitle="High-level spending distribution" title="Expenses by Category"/>;
};

export const ExpenseSubtypeWidget = () => {
  const categoryView = useKingdomStore(s => s.analytics?.category || []);
  const data = useMemo(() => generateCategoryBreakdown(categoryView, 'Expenses', 'subtype'), [categoryView]);
  return <PieChartCard data={data} isDonut={true} subtitle="Detailed operational breakdown" title="Expenses by Subtype"/>;
};

export const AssetAllocationWidget = () => {
  const categoryView = useKingdomStore(s => s.analytics?.category || []);
  const data = useMemo(() => generateCategoryBreakdown(categoryView, 'Assets', 'subtype'), [categoryView]);
  return <PieChartCard data={data} subtitle="Wealth breakdown by class" title="Asset Allocation"/>;
};

export const LiabilitiesSubtypeWidget = () => {
  const categoryView = useKingdomStore(s => s.analytics?.category || []);
  const data = useMemo(() => generateCategoryBreakdown(categoryView, 'Liabilities', 'subtype'), [categoryView]);
  return <PieChartCard data={data} isDonut={true} subtitle="Debt category distribution" title="Liabilities by Subtype"/>;
};

export const DebtHorizonWidget = () => {
  const categoryView = useKingdomStore(s => s.analytics?.category || []);
  const data = useMemo(() => generateCategoryBreakdown(categoryView, 'Liabilities', 'subtype'), [categoryView]);
  return <PieChartCard data={data} subtitle="Immediate vs macro obligations" title="Short vs. Long-Term Debt"/>;
};