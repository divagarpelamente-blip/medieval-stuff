import React, { useEffect, useState, useMemo } from 'react';
import { useKingdomStore } from "../../../store/useKingdomStore";
import { toast } from 'react-hot-toast';
import { ArrowUpDown, RefreshCw } from 'lucide-react';

export default function LedgerTable({ onEditTransaction }) {
  const transactions = useKingdomStore((state) => state.transactions) || [];
  const isLedgerLoading = useKingdomStore((state) => state.isLedgerLoading);
  const fetchTransactions = useKingdomStore((state) => state.fetchTransactions);
  const deleteTransaction = useKingdomStore((state) => state.deleteTransaction);
  const user = useKingdomStore((state) => state.user);

  // Fetch initial batch
  useEffect(() => {
    if (user?.id) fetchTransactions(1000, 0);
  }, [fetchTransactions, user?.id]);

  // --- FILTERING STATE ---
  const [filters, setFilters] = useState({
    year: '', month: '', type: '', category: '', flow: '', entity: '', minAmount: '', maxAmount: ''
  });

  // --- SORTING STATE ---
  const [sortConfig, setSortConfig] = useState({ key: 'posting_date', direction: 'desc' });

  // Generate unique dropdown options natively from the dataset
  const uniqueYears = [...new Set(transactions.map(t => t.posting_date?.substring(0,4)).filter(Boolean))].sort().reverse();
  const uniqueTypes = [...new Set(transactions.map(t => t.type).filter(Boolean))].sort();
  const uniqueCategories = [...new Set(transactions.map(t => t.category).filter(Boolean))].sort();
  const uniqueEntities = [...new Set(transactions.map(t => t.entity).filter(Boolean))].sort();
  const months = Array.from({length: 12}, (_, i) => (i + 1).toString().padStart(2, '0'));

  // --- PROCESS DATA (Filter + Sort) ---
  const processedTransactions = useMemo(() => {
    let filtered = transactions.filter(t => {
      if (filters.year && !t.posting_date?.startsWith(filters.year)) return false;
      if (filters.month && t.posting_date?.split('-')[1] !== filters.month) return false;
      if (filters.type && t.type !== filters.type) return false;
      if (filters.category && t.category !== filters.category) return false;
      if (filters.flow && t.flow !== filters.flow) return false;
      if (filters.entity && t.entity !== filters.entity) return false;
      if (filters.minAmount && Number(t.amount) < Number(filters.minAmount)) return false;
      if (filters.maxAmount && Number(t.amount) > Number(filters.maxAmount)) return false;
      return true;
    });

    filtered.sort((a, b) => {
      let valA = a[sortConfig.key] || '';
      let valB = b[sortConfig.key] || '';
      
      // Ensure numeric sorting for amounts
      if (sortConfig.key === 'amount') {
        valA = Number(valA) || 0;
        valB = Number(valB) || 0;
      }

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [transactions, filters, sortConfig]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleDeleteClick = async (id) => {
    if (window.confirm("Are you sure you want to permanently delete this transaction?")) {
      try {
        await deleteTransaction(id);
        toast.success("Transaction deleted");
      } catch (error) {
        toast.error("Failed to delete transaction");
      }
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // Sortable Header Component
  const TableHeader = ({ label, sortKey, align = "text-left" }) => (
    <th 
      className={`py-2 px-2 text-[10px] uppercase tracking-wider text-amber-500/80 font-bold font-serif cursor-pointer hover:text-amber-200 transition-colors whitespace-nowrap`}
      onClick={() => handleSort(sortKey)}
      title={`Sort by ${label}`}
    >
      <div className={`flex items-center gap-1 ${align === 'text-right' ? 'justify-end' : align === 'text-center' ? 'justify-center' : 'justify-start'}`}>
        {label} <ArrowUpDown size={10} className={`opacity-50 ${sortConfig.key === sortKey ? 'opacity-100 text-amber-400' : ''}`} />
      </div>
    </th>
  );

  return (
    <section className="bg-stone-950 border-2 border-amber-900/50 rounded-lg p-5 shadow-2xl flex flex-col h-full min-h-0">
      
      {/* FILTER BAR (Replaces Title) */}
      <div className="flex flex-wrap items-center gap-2 mb-4 bg-stone-900/50 p-2.5 rounded border border-amber-900/30 shrink-0">
        <select name="year" value={filters.year} onChange={handleFilterChange} className="bg-stone-950 border border-stone-800 text-stone-300 text-[11px] p-1.5 rounded outline-none focus:border-amber-500 transition cursor-pointer">
          <option value="">Year</option>
          {uniqueYears.map(y => <option key={y} value={y}>{y}</option>)}
        </select>

        <select name="month" value={filters.month} onChange={handleFilterChange} className="bg-stone-950 border border-stone-800 text-stone-300 text-[11px] p-1.5 rounded outline-none focus:border-amber-500 transition cursor-pointer">
          <option value="">Month</option>
          {months.map(m => <option key={m} value={m}>{m}</option>)}
        </select>

        <select name="type" value={filters.type} onChange={handleFilterChange} className="bg-stone-950 border border-stone-800 text-stone-300 text-[11px] p-1.5 rounded outline-none focus:border-amber-500 transition cursor-pointer max-w-[120px]">
          <option value="">Type</option>
          {uniqueTypes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        <select name="category" value={filters.category} onChange={handleFilterChange} className="bg-stone-950 border border-stone-800 text-stone-300 text-[11px] p-1.5 rounded outline-none focus:border-amber-500 transition cursor-pointer max-w-[140px]">
          <option value="">Category</option>
          {uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <select name="flow" value={filters.flow} onChange={handleFilterChange} className="bg-stone-950 border border-stone-800 text-stone-300 text-[11px] p-1.5 rounded outline-none focus:border-amber-500 transition cursor-pointer">
          <option value="">Flow</option>
          <option value="inflow">Inflow</option>
          <option value="outflow">Outflow</option>
          <option value="neutral">Neutral</option>
        </select>

        <select name="entity" value={filters.entity} onChange={handleFilterChange} className="bg-stone-950 border border-stone-800 text-stone-300 text-[11px] p-1.5 rounded outline-none focus:border-amber-500 transition cursor-pointer max-w-[140px]">
          <option value="">Entity</option>
          {uniqueEntities.map(e => <option key={e} value={e}>{e}</option>)}
        </select>

        <div className="flex items-center gap-1 ml-auto">
          <input type="number" name="minAmount" value={filters.minAmount} onChange={handleFilterChange} placeholder="Min 🪙" className="bg-stone-950 border border-stone-800 text-stone-300 text-[11px] p-1.5 rounded outline-none focus:border-amber-500 transition w-20 font-mono" />
          <span className="text-stone-600">-</span>
          <input type="number" name="maxAmount" value={filters.maxAmount} onChange={handleFilterChange} placeholder="Max 🪙" className="bg-stone-950 border border-stone-800 text-stone-300 text-[11px] p-1.5 rounded outline-none focus:border-amber-500 transition w-20 font-mono" />
          
          <button
            onClick={() => fetchTransactions(1000, 0)}
            disabled={isLedgerLoading}
            title="Refresh Records"
            className="ml-2 p-1.5 bg-amber-950/60 hover:bg-amber-900 border border-amber-700/50 rounded text-amber-400 transition disabled:opacity-50 shadow"
          >
            <RefreshCw size={14} className={isLedgerLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* TABLE CONTAINER (Smart Scrollbar invisible until hover/scroll) */}
      <div className="flex-1 overflow-y-auto bg-stone-900/50 rounded border border-amber-900/20 scrollbar-thin scrollbar-thumb-transparent hover:scrollbar-thumb-amber-900/50 scrollbar-track-transparent transition-colors duration-300">
        
        {isLedgerLoading && transactions.length === 0 ? (
          <div className="h-full flex items-center justify-center text-amber-500 animate-pulse font-mono text-xs">
            Summoning ledger archives...
          </div>
        ) : processedTransactions.length > 0 ? (
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-stone-900/95 z-10 border-b border-amber-900/40 backdrop-blur-sm">
              <tr>
                <TableHeader label="Date" sortKey="posting_date" />
                <TableHeader label="Entity" sortKey="entity" />
                <TableHeader label="Category" sortKey="category" />
                <TableHeader label="Account" sortKey="target_account" />
                <TableHeader label="Type" sortKey="type" />
                <TableHeader label="Flow" sortKey="flow" align="text-right" />
                <TableHeader label="Amount" sortKey="amount" align="text-right" />
                <th className="py-2 px-2 text-center text-[10px] uppercase tracking-wider text-amber-500/80 font-bold font-serif w-20">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/30 font-sans">
              {processedTransactions.map((t) => (
                <tr key={t.id} className="hover:bg-stone-800/40 transition-colors group">
                  <td className="py-2.5 px-2 text-stone-300 font-mono text-[11px] whitespace-nowrap">{t.posting_date}</td>
                  <td className="py-2.5 px-2 text-stone-300 truncate max-w-[120px]" title={t.entity}>{t.entity || '-'}</td>
                  <td className="py-2.5 px-2 text-stone-400 truncate max-w-[120px]" title={t.category}>{t.category || '-'}</td>
                  <td className="py-2.5 px-2 text-amber-100/70 font-mono text-[11px] truncate max-w-[100px]">{t.target_account}</td>
                  <td className="py-2.5 px-2 text-amber-600/90 font-serif truncate max-w-[100px]">{t.type}</td>
                  <td className={`py-2.5 px-2 text-right capitalize font-semibold text-[11px] ${t.flow === 'inflow' ? 'text-emerald-500' : t.flow === 'outflow' ? 'text-rose-500' : 'text-stone-400'}`}>
                    {t.flow}
                  </td>
                  <td className="py-2.5 px-2 text-right text-amber-400 font-bold font-mono whitespace-nowrap">
                    {Number(t.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    <div className="flex justify-center gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => onEditTransaction(t)} 
                        title="Edit"
                        className="p-1 bg-blue-950/60 hover:bg-blue-900 border border-blue-800/50 rounded text-blue-300 transition"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                      </button>
                      <button 
                        onClick={() => handleDeleteClick(t.id)} 
                        title="Delete"
                        className="p-1 bg-rose-950/60 hover:bg-rose-900 border border-rose-800/50 rounded text-rose-400 transition"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-stone-500 text-center font-mono text-xs">
            <span>No records match the current ledger filters.</span>
          </div>
        )}
      </div>
      
      {/* Load More Row */}
      {processedTransactions.length > 0 && processedTransactions.length === transactions.length && (
        <div className="flex justify-center mt-4 shrink-0">
          <button
            onClick={() => fetchTransactions(1000, transactions.length)}
            disabled={isLedgerLoading}
            className="px-6 py-2 bg-stone-900 hover:bg-stone-800 border border-stone-700/50 rounded text-stone-400 text-[10px] tracking-widest uppercase font-bold transition disabled:opacity-50 shadow"
          >
            {isLedgerLoading ? 'Summoning...' : 'Fetch Older Records'}
          </button>
        </div>
      )}
    </section>
  );
}