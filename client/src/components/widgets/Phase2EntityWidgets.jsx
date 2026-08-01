import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useKingdomStore } from '../../store/useKingdomStore';
import { getEntityExposure } from '../../utils/chartAnalytics';

const formatValue = (val) => {
  const num = Number(val) || 0;
  const formattedNum = Math.abs(num).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return num < 0 ? `(${formattedNum})` : formattedNum;
};

// Removed getLargestTx to comply with data-flow rules

const BarChartCard = ({ title, subtitle, data }) => (
  <div className="w-full h-full min-h-[300px] flex flex-col bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
    <div className="mb-4">
      <h3 className="text-sm font-sans font-semibold tracking-wide text-gray-500 uppercase">{title}</h3>
      <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
    </div>
    <div className="flex-1 w-full min-h-0 overflow-hidden relative">
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
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

const TableCard = ({ title, subtitle, headers, children }) => (
  <div className="w-full h-full min-h-[300px] flex flex-col bg-white border border-gray-200 rounded-xl p-6 shadow-sm overflow-hidden">
    <div className="mb-4 shrink-0">
      <h3 className="text-sm font-sans font-semibold tracking-wide text-gray-500 uppercase">{title}</h3>
      <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
    </div>
    <div className="flex-1 overflow-auto pr-2 scrollbar-thin scrollbar-thumb-amber-900/50">
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

export const IncomeEntityWidget = () => {
  const entityView = useKingdomStore(s => s.analytics?.entity || []);
  const data = useMemo(() => getEntityExposure(entityView, 'Income', 10), [entityView]);
  return <BarChartCard data={data} subtitle="Top 10 revenue sources" title="Income by Entity"/>;
};

export const EntityExposureWidget = () => {
  const entityView = useKingdomStore(s => s.analytics?.entity || []);
  const data = useMemo(() => getEntityExposure(entityView, 'Assets', 10), [entityView]);
  return <BarChartCard data={data} subtitle="Asset concentration across institutions" title="Entity Exposure (Risk)"/>;
};

export const DebtCreditorWidget = () => {
  const entityView = useKingdomStore(s => s.analytics?.entity || []);
  const data = useMemo(() => getEntityExposure(entityView, 'Liabilities', 10), [entityView]);
  return <BarChartCard data={data} subtitle="Concentration of owed liabilities" title="Debt by Creditor"/>;
};

export const TopMerchantsWidget = () => {
  const entityView = useKingdomStore(s => s.analytics?.entity || []);
  const data = useMemo(() => getEntityExposure(entityView, 'Expenses', 10), [entityView]);
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

export const LargestTransactionsWidget = () => {
  const entityView = useKingdomStore(s => s.analytics?.entity || []);
  const data = useMemo(() => {
    return [...entityView].sort((a, b) => b.value - a.value).slice(0, 10);
  }, [entityView]);
  return (
    <TableCard headers={['Type', 'Entity', 'Amount']} subtitle="Largest capital flows by entity" title="Largest Entity Flows">
      {data.map((row, i) => (
        <tr key={i} className="hover:bg-gray-50 transition-colors">
          <td className="py-3 text-gray-500 text-xs">{row.type}</td>
          <td className="py-3 text-gray-900 font-medium">{row.entity}</td>
          <td className="py-3 text-gray-600 text-right font-mono">{formatValue(row.value)}</td>
        </tr>
      ))}
    </TableCard>
  );
};

export const TopAccountsWidget = () => {
  const balances = useKingdomStore(s => s.analytics?.balances || []);
  const flatMatrix = useKingdomStore(s => s.flatMatrix || []);

  const data = useMemo(() => {
    return balances
      .filter(b => b.account && b.account.startsWith('1') && b.balance > 0)
      .map(b => {
        const matrixInfo = flatMatrix.find(m => m.code === b.account) || {};
        return {
          account: b.account,
          entity: matrixInfo.entity || matrixInfo.account_name || b.account,
          balance: b.balance
        };
      })
      .sort((a, b) => b.balance - a.balance)
      .slice(0, 5);
  }, [balances, flatMatrix]);

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

export const BankBalancesWidget = () => {
  const balances = useKingdomStore(s => s.analytics?.balances || []);
  const flatMatrix = useKingdomStore(s => s.flatMatrix || []);

  const data = useMemo(() => {
    const checkingAccounts = flatMatrix.filter(m => m.category === 'Checking Accounts');
    
    return checkingAccounts.map(acc => {
      const balRow = balances.find(b => b.account === acc.code) || { balance: 0 };
      return {
        code: acc.code,
        name: acc.account_name || acc.code,
        entity: acc.entity || 'Institution',
        balance: Number(balRow.balance) || 0
      };
    }).sort((a, b) => b.balance - a.balance);
  }, [balances, flatMatrix]);

  return (
    <TableCard headers={['Code', 'Institution / Account', 'Balance']} subtitle="Real-time balances of checking accounts" title="Bank Balances">
      {data.map((row, i) => (
        <tr key={i} className="hover:bg-gray-50 transition-colors">
          <td className="py-3 text-gray-500 font-mono text-xs">{row.code}</td>
          <td className="py-3 text-gray-900 font-medium">
            <div>{row.entity}</div>
            <div className="text-xs text-gray-400 font-normal">{row.name}</div>
          </td>
          <td className="py-3 text-gray-900 font-bold text-right font-mono">{formatValue(row.balance)}</td>
        </tr>
      ))}
    </TableCard>
  );
};