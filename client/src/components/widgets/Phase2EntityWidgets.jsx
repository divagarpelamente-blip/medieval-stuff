import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useKingdomStore } from '../../store/useKingdomStore';
import { generateCategoryBreakdown, getLargestTransactions, getTopAccountsByBalance } from '../../utils/chartAnalytics';

const formatValue = (val) => {
  const num = Number(val) || 0;
  const formattedNum = Math.abs(num).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return num < 0 ? `(${formattedNum})` : formattedNum;
};

// Generic Monochromatic Bar Chart Card
const BarChartCard = ({ title, subtitle, data }) => (
  <div className="w-full h-full min-h-[300px] flex flex-col bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
    <div className="mb-4">
      <h3 className="text-sm font-sans font-semibold tracking-wide text-gray-500 uppercase">{title}</h3>
      <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
    </div>
    <div className="flex-1 w-full min-h-[200px]">
      {data.length > 0 ? (
        <ResponsiveContainer height="100%" width="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 40, left: 15, bottom: 5 }}>
            <CartesianGrid horizontal={true} stroke="#f3f4f6" strokeDasharray="3 3" vertical={false}/>
            <XAxis type="number" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
            <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} />
            <Tooltip 
              formatter={(value) => [formatValue(value), 'Amount']}
              contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', color: '#111827', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
              labelStyle={{ fontWeight: 600, color: '#6b7280', marginBottom: '4px' }}
              cursor={{ fill: '#f3f4f6' }}
            />
            <Bar dataKey="value" fill="#374151" barSize={24} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-full flex items-center justify-center text-xs font-mono text-gray-400 italic">No entity data available.</div>
      )}
    </div>
  </div>
);

// Generic Monochromatic Table Card
const TableCard = ({ title, subtitle, headers, children }) => (
  <div className="w-full h-full min-h-[300px] flex flex-col bg-white border border-gray-200 rounded-xl p-6 shadow-sm overflow-hidden">
    <div className="mb-4 shrink-0">
      <h3 className="text-sm font-sans font-semibold tracking-wide text-gray-500 uppercase">{title}</h3>
      <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
    </div>
    <div className="flex-1 overflow-auto pr-2">
      <table className="w-full text-left border-collapse whitespace-nowrap">
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i} className={`pb-3 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider ${i === headers.length - 1 ? 'text-right' : ''}`}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="text-sm divide-y divide-gray-100">
          {children}
        </tbody>
      </table>
    </div>
  </div>
);

// Exports: Bar Charts
export const IncomeEntityWidget = ({ transactions }) => {
  const activeTx = transactions || useKingdomStore(s => s.transactions || []);
  const data = useMemo(() => generateCategoryBreakdown(activeTx, '7', 'entity').slice(0, 10), [activeTx]);
  return <BarChartCard data={data} subtitle="Top 10 revenue sources" title="Income by Entity"/>;
};

export const EntityExposureWidget = ({ transactions }) => {
  const activeTx = transactions || useKingdomStore(s => s.transactions || []);
  const data = useMemo(() => generateCategoryBreakdown(activeTx, '1', 'entity').slice(0, 10), [activeTx]);
  return <BarChartCard data={data} subtitle="Asset concentration across institutions" title="Entity Exposure (Risk)"/>;
};

export const DebtCreditorWidget = ({ transactions }) => {
  const activeTx = transactions || useKingdomStore(s => s.transactions || []);
  const data = useMemo(() => generateCategoryBreakdown(activeTx, '2', 'entity').slice(0, 10), [activeTx]);
  return <BarChartCard data={data} subtitle="Concentration of owed liabilities" title="Debt by Creditor"/>;
};

// Exports: Tables
export const TopMerchantsWidget = ({ transactions }) => {
  const activeTx = transactions || useKingdomStore(s => s.transactions || []);
  const data = useMemo(() => generateCategoryBreakdown(activeTx, '6', 'entity').slice(0, 10), [activeTx]);
  return (
    <TableCard headers={['Merchant', 'Total Spent']} subtitle="Highest cumulative spending destinations" title="Top 10 Merchants">
      {data.map((row, i) => (
        <tr key={i} className="hover:bg-gray-50 transition-colors">
          <td className="py-3 text-gray-900 font-medium">{row.name}</td>
          <td className="py-3 text-gray-600 text-right font-mono">{formatValue(row.value)}</td>
        </tr>
      ))}
    </TableCard>
  );
};

export const LargestTransactionsWidget = ({ transactions }) => {
  const activeTx = transactions || useKingdomStore(s => s.transactions || []);
  const data = useMemo(() => getLargestTransactions(activeTx, '6', 10), [activeTx]);
  return (
    <TableCard headers={['Date', 'Entity', 'Amount']} subtitle="Single highest-impact expenses" title="Largest Transactions">
      {data.map((row, i) => (
        <tr key={i} className="hover:bg-gray-50 transition-colors">
          <td className="py-3 text-gray-500 text-xs">{row.posting_date}</td>
          <td className="py-3 text-gray-900 font-medium">{row.entity || row.category}</td>
          <td className="py-3 text-gray-600 text-right font-mono">{formatValue(row.amount)}</td>
        </tr>
      ))}
    </TableCard>
  );
};

export const TopAccountsWidget = ({ transactions }) => {
  const activeTx = transactions || useKingdomStore(s => s.transactions || []);
  const data = useMemo(() => getTopAccountsByBalance(activeTx, 5), [activeTx]);
  return (
    <TableCard headers={['Code', 'Institution', 'Current Balance']} subtitle="Largest capital reserves by balance" title="Top 5 Accounts">
      {data.map((row, i) => (
        <tr key={i} className="hover:bg-gray-50 transition-colors">
          <td className="py-3 text-gray-500 font-mono text-xs">{row.account}</td>
          <td className="py-3 text-gray-900 font-medium">{row.entity}</td>
          <td className="py-3 text-gray-900 font-bold text-right font-mono">{formatValue(row.balance)}</td>
        </tr>
      ))}
    </TableCard>
  );
};
