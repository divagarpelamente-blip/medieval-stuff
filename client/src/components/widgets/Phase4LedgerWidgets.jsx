import React, { useMemo } from 'react';
import { useKingdomStore } from '../../store/useKingdomStore';
import { getRecentTransactions, getInternalTransfers } from '../../utils/chartAnalytics';

const formatValue = (val) => {
  const num = Number(val) || 0;
  const formattedNum = Math.abs(num).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return num < 0 ? `(${formattedNum})` : formattedNum;
};

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

export const RecentTransactionsWidget = ({ transactions }) => {
  const activeTx = transactions || useKingdomStore(s => s.transactions || []);
  const data = useMemo(() => getRecentTransactions(activeTx, 10), [activeTx]);
  return (
    <TableCard headers={['Date', 'Entity / Category', 'Amount']} subtitle="Paginated table of latest entries" title="Last 10 Transactions">
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

export const InternalTransfersWidget = ({ transactions }) => {
  const activeTx = transactions || useKingdomStore(s => s.transactions || []);
  const data = useMemo(() => getInternalTransfers(activeTx, 10), [activeTx]);
  return (
    <TableCard headers={['Date', 'Target Entity', 'Amount']} subtitle="Vault movements between accounts" title="Internal Transfers">
      {data.map((row, i) => (
        <tr key={i} className="hover:bg-gray-50 transition-colors">
          <td className="py-3 text-gray-500 text-xs">{row.posting_date}</td>
          <td className="py-3 text-gray-900 font-medium">{row.entity || 'Self'}</td>
          <td className="py-3 text-gray-600 text-right font-mono">{formatValue(row.amount)}</td>
        </tr>
      ))}
    </TableCard>
  );
};
