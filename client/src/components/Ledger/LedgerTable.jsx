import React, { useEffect } from 'react';
import { useKingdomStore } from "../../store/useKingdomStore";
import { toast } from 'react-hot-toast';

export default function LedgerTable({ onEditTransaction }) {
  const transactions = useKingdomStore((state) => state.transactions) || [];
  const isLedgerLoading = useKingdomStore((state) => state.isLedgerLoading);
  const fetchTransactions = useKingdomStore((state) => state.fetchTransactions);
  const deleteTransaction = useKingdomStore((state) => state.deleteTransaction);

  // --- ADD THIS BLOCK ---
  // Fetch transactions from Supabase whenever the table mounts
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);
  // ----------------------

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

  return (
    <section className="bg-stone-950 border-2 border-amber-900/50 rounded-lg p-5 shadow-2xl relative flex flex-col">

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-base font-serif text-amber-400 tracking-wider flex items-center gap-2">
          Ledger Transaction Log
        </h2>
        <button
          onClick={fetchTransactions}
          disabled={isLedgerLoading}
          className="px-4 py-1.5 bg-amber-950 hover:bg-amber-900 border border-amber-600/50 rounded text-amber-200 text-xs tracking-wider uppercase font-semibold transition disabled:opacity-50"
        >
          {isLedgerLoading ? 'Loading...' : 'Refresh Records'}
        </button>
      </div>

      <div className="bg-stone-900/50 rounded border border-amber-900/20 p-3 font-mono text-xs">
        {isLedgerLoading && transactions.length === 0 ? (
          <div className="h-full flex items-center justify-center text-amber-500 animate-pulse">
            Loading transactions...
          </div>
        ) : transactions && transactions.length > 0 ? (
          <div className="space-y-2">
            <div className="grid grid-cols-8 text-amber-500/80 border-b border-amber-900/30 pb-2 mb-2 font-bold uppercase tracking-wider text-[10px]">
              <div>Date</div>
              <div>Entity</div>
              <div>Category</div>
              <div>Target Account</div>
              <div>Type</div>
              <div className="text-right">Flow</div>
              <div className="text-right">Amount</div>
              <div className="text-center">Actions</div>
            </div>
            {transactions.map((t) => (
              <div key={t.id} className="grid grid-cols-8 border-b border-stone-800/30 py-1.5 hover:bg-stone-800/40 transition items-center">
                <div className="text-stone-300">{t.posting_date}</div>
                <div className="text-stone-400 truncate pr-2">{t.entity || '-'}</div>
                <div className="text-stone-400 truncate pr-2">{t.category || '-'}</div>
                <div className="text-amber-100/70">{t.target_account}</div>
                <div className="text-amber-600/90 font-serif">{t.type}</div>
                <div className={`text-right ${t.flow === 'inflow' ? 'text-emerald-500' : t.flow === 'outflow' ? 'text-rose-500' : 'text-stone-400'}`}>
                  {t.flow}
                </div>
                <div className="text-right text-amber-400 font-bold">{Number(t.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>

                {/* Action Buttons */}
                <div className="flex justify-center gap-2">
                  <button onClick={() => onEditTransaction(t)} className="text-[10px] bg-blue-900/50 hover:bg-blue-800 text-blue-200 px-2 py-0.5 rounded border border-blue-700/50 transition">
                    Edit
                  </button>
                  <button onClick={() => handleDeleteClick(t.id)} className="text-[10px] bg-red-900/50 hover:bg-red-800 text-red-200 px-2 py-0.5 rounded border border-red-700/50 transition">
                    Del
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-stone-500 text-center">
            <span>No entries logged. Use the form above to add an entry.</span>
          </div>
        )}
      </div>
    </section>
  );
}