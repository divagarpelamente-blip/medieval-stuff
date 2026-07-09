import React, { useState, useMemo } from "react";
import { Plus, X, RotateCcw, Check, Info } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ChartOfAccountItem, MatrixRow, Transaction } from "../types";

interface InsertTransactionProps {
  chartOfAccounts: ChartOfAccountItem[];
  matrix: MatrixRow[];
  transactions: Transaction[];
  onAddTransaction: (tx: Omit<Transaction, "id">) => void;
  onAddMatrixRow: (row: MatrixRow) => void;
  onAddChartOfAccountItem: (item: ChartOfAccountItem) => void;
  formState: {
    date: string;
    setDate: (v: string) => void;
    sourceCode: string;
    setSourceCode: (v: string) => void;
    targetCode: string;
    setTargetCode: (v: string) => void;
    selectedTypeI: string;
    setSelectedTypeI: (v: string) => void;
    selectedTypeII: string;
    setSelectedTypeII: (v: string) => void;
    selectedTypeIII: string;
    setSelectedTypeIII: (v: string) => void;
    selectedEntity: string;
    setSelectedEntity: (v: string) => void;
    amount: string;
    setAmount: (v: string) => void;
    description: string;
    setDescription: (v: string) => void;
  };
  onNavigateToSettings: (subTab: "accounts" | "matrix") => void;
}

export default function InsertTransaction({
  chartOfAccounts,
  matrix,
  transactions,
  onAddTransaction,
  onAddMatrixRow,
  onAddChartOfAccountItem,
  formState,
  onNavigateToSettings,
}: InsertTransactionProps) {
  const {
    date, setDate,
    sourceCode, setSourceCode,
    targetCode, setTargetCode,
    selectedTypeI, setSelectedTypeI,
    selectedTypeII, setSelectedTypeII,
    selectedTypeIII, setSelectedTypeIII,
    selectedEntity, setSelectedEntity,
    amount, setAmount,
    description, setDescription,
  } = formState;

  // Feedback notifications
  const [successMsg, setSuccessMsg] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");

  // Compute all unique available values from matrix
  const allUniqueTypeI = useMemo(() => {
    const set = new Set<string>();
    matrix.forEach(r => { if (r.account_type_I) set.add(r.account_type_I); });
    return Array.from(set).sort();
  }, [matrix]);

  const allUniqueTypeII = useMemo(() => {
    const set = new Set<string>();
    matrix.forEach(r => { if (r.account_type_II) set.add(r.account_type_II); });
    return Array.from(set).sort();
  }, [matrix]);

  const allUniqueTypeIII = useMemo(() => {
    const set = new Set<string>();
    matrix.forEach(r => { if (r.account_type_III) set.add(r.account_type_III); });
    return Array.from(set).sort();
  }, [matrix]);

  const allUniqueEntities = useMemo(() => {
    const set = new Set<string>();
    matrix.forEach(r => { if (r.entity_name) set.add(r.entity_name); });
    return Array.from(set).sort();
  }, [matrix]);

  // DYNAMIC FILTERING ENGINE FOR DROPDOWNS (CONSOLIDATED MATRIX)
  // Options are filtered to only show combinations that are compatible in the Matrix.
  // Symmetrical cascading filtering.

  const allowedTypeI = useMemo(() => {
    return allUniqueTypeI.filter(val => {
      return matrix.some(r => {
        const matchII = !selectedTypeII || r.account_type_II === selectedTypeII;
        const matchIII = !selectedTypeIII || r.account_type_III === selectedTypeIII;
        const matchEntity = !selectedEntity || r.entity_name === selectedEntity;
        return r.account_type_I === val && matchII && matchIII && matchEntity;
      });
    });
  }, [matrix, selectedTypeII, selectedTypeIII, selectedEntity, allUniqueTypeI]);

  const allowedTypeII = useMemo(() => {
    return allUniqueTypeII.filter(val => {
      return matrix.some(r => {
        const matchI = !selectedTypeI || r.account_type_I === selectedTypeI;
        const matchIII = !selectedTypeIII || r.account_type_III === selectedTypeIII;
        const matchEntity = !selectedEntity || r.entity_name === selectedEntity;
        return r.account_type_II === val && matchI && matchIII && matchEntity;
      });
    });
  }, [matrix, selectedTypeI, selectedTypeIII, selectedEntity, allUniqueTypeII]);

  const allowedTypeIII = useMemo(() => {
    return allUniqueTypeIII.filter(val => {
      return matrix.some(r => {
        const matchI = !selectedTypeI || r.account_type_I === selectedTypeI;
        const matchII = !selectedTypeII || r.account_type_II === selectedTypeII;
        const matchEntity = !selectedEntity || r.entity_name === selectedEntity;
        return r.account_type_III === val && matchI && matchII && matchEntity;
      });
    });
  }, [matrix, selectedTypeI, selectedTypeII, selectedEntity, allUniqueTypeIII]);

  const allowedEntities = useMemo(() => {
    return allUniqueEntities.filter(val => {
      return matrix.some(r => {
        const matchI = !selectedTypeI || r.account_type_I === selectedTypeI;
        const matchII = !selectedTypeII || r.account_type_II === selectedTypeII;
        const matchIII = !selectedTypeIII || r.account_type_III === selectedTypeIII;
        return r.entity_name === val && matchI && matchII && matchIII;
      });
    });
  }, [matrix, selectedTypeI, selectedTypeII, selectedTypeIII, allUniqueEntities]);

  // Accounts filtering
  // Show only accounts matching the selected Type I/II/III hierarchy if set
  const filteredAccounts = useMemo(() => {
    return chartOfAccounts.filter(acc => {
      const matchI = !selectedTypeI || acc.account_type_I === selectedTypeI;
      const matchII = !selectedTypeII || acc.account_type_II === selectedTypeII;
      const matchIII = !selectedTypeIII || acc.account_type_III === selectedTypeIII;
      return matchI && matchII && matchIII;
    });
  }, [chartOfAccounts, selectedTypeI, selectedTypeII, selectedTypeIII]);

  // Handle Account Selection and autofill hierarchy levels
  const handleAccountSelect = (codeStr: string, isSource: boolean) => {
    if (isSource) {
      setSourceCode(codeStr);
    } else {
      setTargetCode(codeStr);
    }

    if (!codeStr) return;

    // Autofill the categories if there is a matching account
    const acc = chartOfAccounts.find(a => a.account_code.toString() === codeStr);
    if (acc) {
      // Check if it's currently compatible with already selected elements.
      // If not, or if we want smooth autofill, we can set them:
      setSelectedTypeI(acc.account_type_I);
      setSelectedTypeII(acc.account_type_II);
      setSelectedTypeIII(acc.account_type_III);
    }
  };

  const handleResetFilters = () => {
    setSelectedTypeI("");
    setSelectedTypeII("");
    setSelectedTypeIII("");
    setSelectedEntity("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg("");
    setErrorMsg("");

    if (!date) {
      setErrorMsg("Please select a valid posting date.");
      return;
    }
    if (!sourceCode) {
      setErrorMsg("Please select a Source Account.");
      return;
    }
    if (!targetCode) {
      setErrorMsg("Please select a Target Account.");
      return;
    }
    if (sourceCode === targetCode) {
      setErrorMsg("Source and Target accounts cannot be the same.");
      return;
    }
    if (!selectedTypeI || !selectedTypeII || !selectedTypeIII || !selectedEntity) {
      setErrorMsg("Please select all classification levels (Type I, II, III and Entity).");
      return;
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMsg("Please enter a valid amount greater than zero.");
      return;
    }

    const parsedSourceCode = parseInt(sourceCode, 10);
    const parsedTargetCode = parseInt(targetCode, 10);

    // 1. Validate that source account code exists in Chart of Accounts
    const sourceAccountExists = chartOfAccounts.some(acc => acc.account_code === parsedSourceCode);
    if (!sourceAccountExists) {
      setErrorMsg(`Validation error: The selected Source Account code (${sourceCode}) does not exist in the Chart of Accounts.`);
      return;
    }

    // 2. Validate that target account code exists in Chart of Accounts
    const targetAccountExists = chartOfAccounts.some(acc => acc.account_code === parsedTargetCode);
    if (!targetAccountExists) {
      setErrorMsg(`Validation error: The selected Target Account code (${targetCode}) does not exist in the Chart of Accounts.`);
      return;
    }

    // 3. Validate that selected account types and entity adhere to the established hierarchical relationships (Consolidated Matrix)
    const isHierarchyValid = matrix.some(
      row =>
        row.account_type_I === selectedTypeI &&
        row.account_type_II === selectedTypeII &&
        row.account_type_III === selectedTypeIII &&
        row.entity_name === selectedEntity
    );
    if (!isHierarchyValid) {
      setErrorMsg(`Validation error: The selected combination of Account Types (${selectedTypeI} → ${selectedTypeII} → ${selectedTypeIII}) and Entity (${selectedEntity}) does not form a valid relationship in the established Consolidated Association Matrix.`);
      return;
    }

    onAddTransaction({
      date,
      source_account_code: parsedSourceCode,
      target_account_code: parsedTargetCode,
      account_type_I: selectedTypeI,
      account_type_II: selectedTypeII,
      account_type_III: selectedTypeIII,
      entity_name: selectedEntity,
      amount: parsedAmount,
      description: description.trim() || `Transaction recorded: ${selectedEntity}`,
    });

    setSuccessMsg("Transaction recorded successfully!");
    setAmount("");
    setDescription("");
    // We can reset classification filters or keep them for consecutive inputs
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  return (
    <div id="insert-transaction-view" className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Register New Financial Transaction</h2>
          <p className="text-xs text-slate-500">Record a standard accounting double-entry transaction using dynamic mapping.</p>
        </div>
        <button
          type="button"
          onClick={handleResetFilters}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/60 hover:bg-slate-700/80 text-slate-300 border border-slate-700/50 rounded-lg text-xs font-semibold transition cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
          Reset Category Filters
        </button>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left column: Transaction Meta */}
        <div className="lg:col-span-7 space-y-6 bg-[#111113] p-6 rounded-2xl border border-slate-800 shadow-xl shadow-black/20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">Posting Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full bg-[#1A1A1C] border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">Transaction Amount ($)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full bg-[#1A1A1C] border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold">Source Account (Debit)</label>
                <button
                  type="button"
                  onClick={() => onNavigateToSettings("accounts")}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Account
                </button>
              </div>
              <select
                required
                value={sourceCode}
                onChange={e => handleAccountSelect(e.target.value, true)}
                className="w-full bg-[#1A1A1C] border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 appearance-none cursor-pointer"
              >
                <option value="" className="bg-[#111113]">-- Select Source Account --</option>
                {filteredAccounts.map(acc => (
                  <option key={`src-${acc.account_code}`} value={acc.account_code} className="bg-[#111113]">
                    {acc.account_code} - {acc.account_type_III} ({acc.account_type_I})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold">Target Account (Credit)</label>
                <button
                  type="button"
                  onClick={() => onNavigateToSettings("accounts")}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Account
                </button>
              </div>
              <select
                required
                value={targetCode}
                onChange={e => handleAccountSelect(e.target.value, false)}
                className="w-full bg-[#1A1A1C] border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 appearance-none cursor-pointer"
              >
                <option value="" className="bg-[#111113]">-- Select Target Account --</option>
                {filteredAccounts.map(acc => (
                  <option key={`tgt-${acc.account_code}`} value={acc.account_code} className="bg-[#111113]">
                    {acc.account_code} - {acc.account_type_III} ({acc.account_type_I})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">Transaction Description</label>
            <textarea
              rows={3}
              placeholder="Provide clean transaction records context (e.g. Server hosting, payroll payout...)"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-[#1A1A1C] border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Feedback alerts */}
          <AnimatePresence>
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold rounded-xl flex items-center gap-2"
              >
                <X className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </motion.div>
            )}
            {successMsg && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-xl flex items-center gap-2"
              >
                <Check className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-[#0A0A0B] rounded-xl font-bold tracking-wide shadow-lg shadow-emerald-500/5 hover:shadow-emerald-500/15 transition cursor-pointer"
          >
            Record Transaction Entry
          </button>
        </div>

        {/* Right column: Dynamic Dropdown cascading filtering */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#111113] p-6 rounded-2xl border border-slate-800 shadow-xl shadow-black/20 space-y-5">
            <div>
              <h3 className="font-bold text-slate-300 text-sm flex items-center gap-2 mb-1.5">
                <Info className="w-4 h-4 text-emerald-400" />
                Classification Hierarchy
              </h3>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Selections below actively filter other lists symmetrically based on registered associations in your consolidated matrix.
              </p>
            </div>

            {/* Level I Dropdown */}
            <div className="flex items-center gap-4">
              <div className="w-1 bg-emerald-500 h-14 rounded-full shrink-0"></div>
              <div className="flex-1 space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Level I: Account Group</label>
                  <button
                    type="button"
                    onClick={() => onNavigateToSettings("matrix")}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-0.5 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> New
                  </button>
                </div>
                <select
                  value={selectedTypeI}
                  onChange={e => setSelectedTypeI(e.target.value)}
                  className="w-full bg-[#1A1A1C] border border-slate-800 rounded-lg p-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 appearance-none cursor-pointer"
                >
                  <option value="" className="bg-[#111113]">-- All Levels --</option>
                  {allowedTypeI.map(item => (
                    <option key={`drop-I-${item}`} value={item} className="bg-[#111113]">{item}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Level II Dropdown */}
            <div className="flex items-center gap-4">
              <div className="w-1 bg-emerald-500/60 h-14 rounded-full shrink-0"></div>
              <div className="flex-1 space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Level II: Classification</label>
                  <button
                    type="button"
                    onClick={() => onNavigateToSettings("matrix")}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-0.5 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> New
                  </button>
                </div>
                <select
                  value={selectedTypeII}
                  onChange={e => setSelectedTypeII(e.target.value)}
                  className="w-full bg-[#1A1A1C] border border-slate-800 rounded-lg p-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 appearance-none cursor-pointer"
                >
                  <option value="" className="bg-[#111113]">-- All Subtypes --</option>
                  {allowedTypeII.map(item => (
                    <option key={`drop-II-${item}`} value={item} className="bg-[#111113]">{item}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Level III Dropdown */}
            <div className="flex items-center gap-4">
              <div className="w-1 bg-emerald-500/30 h-14 rounded-full shrink-0"></div>
              <div className="flex-1 space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Level III: Detailed Account</label>
                  <button
                    type="button"
                    onClick={() => onNavigateToSettings("matrix")}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-0.5 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> New
                  </button>
                </div>
                <select
                  value={selectedTypeIII}
                  onChange={e => setSelectedTypeIII(e.target.value)}
                  className="w-full bg-[#1A1A1C] border border-slate-800 rounded-lg p-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 appearance-none cursor-pointer"
                >
                  <option value="" className="bg-[#111113]">-- All Classifications --</option>
                  {allowedTypeIII.map(item => (
                    <option key={`drop-III-${item}`} value={item} className="bg-[#111113]">{item}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Entity Dropdown */}
            <div className="flex items-center gap-4">
              <div className="w-1 bg-slate-700 h-14 rounded-full shrink-0"></div>
              <div className="flex-1 space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Entity Association</label>
                  <button
                    type="button"
                    onClick={() => onNavigateToSettings("matrix")}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-0.5 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> New
                  </button>
                </div>
                <select
                  value={selectedEntity}
                  onChange={e => setSelectedEntity(e.target.value)}
                  className="w-full bg-[#1A1A1C] border border-slate-800 rounded-lg p-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 appearance-none cursor-pointer"
                >
                  <option value="" className="bg-[#111113]">-- All Entities --</option>
                  {allowedEntities.map(item => (
                    <option key={`drop-ent-${item}`} value={item} className="bg-[#111113]">{item}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
