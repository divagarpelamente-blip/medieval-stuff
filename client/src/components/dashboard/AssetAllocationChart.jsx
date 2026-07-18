import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import useKingdomStore from '../../store/useKingdomStore';
import { generateCategoryBreakdown } from '../../utils/chartAnalytics';

const COLORS = ['#fbbf24', '#d97706', '#b45309', '#78350f', '#10b981', '#059669'];

export default function AssetAllocationChart() {
  const { transactions } = useKingdomStore();
  
  // Extract category breakdown for assets (prefix '1')
  const data = generateCategoryBreakdown(transactions, '1');

  // Compute total valuation of assets to calculate percentages inside the formatter
  const totalAssetsValue = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="bg-stone-900/40 border border-amber-900/30 rounded-lg p-4 flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0">
        <h3 className="font-serif text-amber-400 text-sm tracking-wider uppercase">
          Asset Allocation
        </h3>
        <p className="text-[10px] text-stone-500 font-mono mt-0.5">
          Distribution across active wealth classes (1xxxxxxx accounts)
        </p>
      </div>

      {/* Chart Canvas */}
      <div className="flex-1 min-h-0 w-full mt-4 flex items-center justify-center">
        {data.length === 0 ? (
          <p className="text-xs font-mono text-stone-500 py-8 text-center">
            No asset records detected in the active scrolls.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                stroke="#1c1917"
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]} 
                  />
                ))}
              </Pie>
              
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
                formatter={(value) => {
                  const percentage = totalAssetsValue > 0 
                    ? ((value / totalAssetsValue) * 100).toFixed(1) 
                    : 0;
                  return [
                    `${Number(value).toLocaleString()} g (${percentage}%)`, 
                    'Allocation'
                  ];
                }}
              />

              <Legend
                verticalAlign="bottom"
                align="center"
                layout="horizontal"
                iconSize={8}
                iconType="circle"
                wrapperStyle={{
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  color: '#a8a29e',
                  paddingTop: '10px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}