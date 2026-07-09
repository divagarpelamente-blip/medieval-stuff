import React, { useState, useMemo } from "react";
import { Search, Filter, ArrowUpRight, Calendar, User, Tag, HelpCircle, ArrowRightLeft } from "lucide-react";
import { motion } from "motion/react";
import { Transaction } from "../types";

interface LedgerProps {
  transactions: Transaction[];
  onDeleteTransaction?: (id: string) => void;
}

export default function Ledger({ transactions, onDeleteTransaction }: LedgerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTypeI, setFilterTypeI] = useState("");
  const [filterEntity, setFilterEntity] = useState("");

  // Get unique entities and Type I values from transactions for filters
  const uniqueEntities = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach(t => { if (t.entity_name) set.add(t.entity_name); });
    return Array.from(set).sort();
  }, [transactions]);

  const uniqueTypeI = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach(t => { if (t.account_type_I) set.add(t.account_type_I); });
    return Array.from(set).sort();
  }, [transactions]);

  // Search & Filter Logic
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchSearch =
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.source_account_code.toString().includes(searchTerm) ||
        t.target_account_code.toString().includes(searchTerm) ||
        t.account_type_III.toLowerCase().includes(searchTerm.toLowerCase());

      const matchTypeI = !filterTypeI || t.account_type_I === filterTypeI;
      const matchEntity = !filterEntity || t.entity_name === filterEntity;

      return matchSearch && matchTypeI && matchEntity;
    });
  }, [transactions, searchTerm, filterTypeI, filterEntity]);

  // Statistics
  const stats = useMemo(() => {
    const count = filteredTransactions.length;
    const totalAmount = filteredTransactions.reduce((acc, t) => acc + t.amount, 0);
    return { count, totalAmount };
  }, [filteredTransactions]);

  return (
    <div id="ledger-view" className="space-y-6">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-[#111113] p-5 rounded-2xl border border-slate-800 shadow-xl shadow-black/10 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Transactions</span>
            <p className="text-2xl font-bold text-white mt-1">{stats.count}</p>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl">
            <ArrowRightLeft className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#111113] p-5 rounded-2xl border border-slate-800 shadow-xl shadow-black/10 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Ledger Volume</span>
            <p className="text-2xl font-bold text-white mt-1">
              ${stats.totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#111113] p-5 rounded-2xl border border-slate-800 shadow-xl shadow-black/10 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Unique Entities Active</span>
            <p className="text-2xl font-bold text-white mt-1">{uniqueEntities.length}</p>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl">
            <User className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#111113] p-4 rounded-2xl border border-slate-800 shadow-xl shadow-black/10 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by description, account, category..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-800 bg-[#1A1A1C] outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-slate-200 placeholder-slate-500 font-sans"
          />
        </div>

        <div className="flex flex-wrap w-full md:w-auto items-center gap-3">
          <div className="flex items-center gap-2 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5 text-emerald-400" />
            <span>Filter:</span>
          </div>

          <select
            value={filterTypeI}
            onChange={e => setFilterTypeI(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-800 bg-[#1A1A1C] text-slate-300 outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="" className="bg-[#111113]">All Account Types (I)</option>
            {uniqueTypeI.map(t => (
              <option key={`ledg-f-I-${t}`} value={t} className="bg-[#111113]">{t}</option>
            ))}
          </select>

          <select
            value={filterEntity}
            onChange={e => setFilterEntity(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-800 bg-[#1A1A1C] text-slate-300 outline-none focus:border-emerald-500 cursor-pointer max-w-xs"
          >
            <option value="" className="bg-[#111113]">All Entities</option>
            {uniqueEntities.map(ent => (
              <option key={`ledg-f-ent-${ent}`} value={ent} className="bg-[#111113]">{ent}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Transactions Ledger Table */}
      <div className="bg-[#111113] rounded-2xl border border-slate-800 shadow-xl shadow-black/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#1A1A1C] border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <th className="py-4 px-6">Posting Date</th>
                <th className="py-4 px-6">Double Entry Accounts</th>
                <th className="py-4 px-6">Classification Matrix</th>
                <th className="py-4 px-6">Entity</th>
                <th className="py-4 px-6">Description</th>
                <th className="py-4 px-6 text-right">Amount</th>
                {onDeleteTransaction && <th className="py-4 px-6 text-center">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-sm text-slate-300">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={onDeleteTransaction ? 7 : 6} className="py-12 text-center text-slate-500">
                    <HelpCircle className="w-10 h-10 mx-auto stroke-1 mb-2 text-slate-600" />
                    No financial transaction records found matching the search.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-800/20 transition duration-150">
                    {/* Date */}
                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-slate-300 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span className="font-mono text-xs">{tx.date}</span>
                      </div>
                    </td>

                    {/* Debit / Credit Codes */}
                    <td className="py-4 px-6">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-bold scale-90">Dr</span>
                          <span className="font-bold text-slate-200 font-mono">{tx.source_account_code}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono font-bold scale-90">Cr</span>
                          <span className="font-semibold text-slate-400 font-mono">{tx.target_account_code}</span>
                        </div>
                      </div>
                    </td>

                    {/* Hierarchy Classification */}
                    <td className="py-4 px-6">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-xs">
                          <Tag className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span className="font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md text-[11px]">
                            {tx.account_type_I}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 pl-5 truncate max-w-[200px]" title={`${tx.account_type_II} > ${tx.account_type_III}`}>
                          {tx.account_type_II} &rarr; {tx.account_type_III}
                        </div>
                      </div>
                    </td>

                    {/* Entity */}
                    <td className="py-4 px-6 whitespace-nowrap">
                      <span className="font-semibold text-slate-300 bg-slate-800 border border-slate-700/60 px-2.5 py-1 rounded-lg text-xs">
                        {tx.entity_name}
                      </span>
                    </td>

                    {/* Description */}
                    <td className="py-4 px-6 max-w-xs">
                      <p className="text-slate-400 truncate font-sans text-xs" title={tx.description}>
                        {tx.description}
                      </p>
                    </td>

                    {/* Amount */}
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <span className="font-mono font-bold text-emerald-400 text-sm">
                        ${tx.amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </td>

                    {/* Actions */}
                    {onDeleteTransaction && (
                      <td className="py-4 px-6 text-center whitespace-nowrap">
                        <button
                          onClick={() => onDeleteTransaction(tx.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10 px-2.5 py-1 rounded transition text-xs font-semibold cursor-pointer"
                          title="Delete transaction record"
                        >
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
