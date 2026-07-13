import React, { useState, useMemo } from 'react';
import { useKingdomStore } from '../store/useKingdomStore';
import { useManualTransactionForm } from '../hooks/useManualTransactionForm';
import { toast } from 'react-hot-toast';

const GUEST_PROFILE_ID = '00000000-0000-0000-0000-000000000000';

export default function TransactionSandbox() {
  const user = useKingdomStore((state) => state.user);
  const flatMatrix = useKingdomStore((state) => state.flatMatrix || []);
  const fromOptions = useKingdomStore((state) => state.fromOptions || []);
  const statusOptions = useKingdomStore((state) => state.statusOptions || []);
  const classOptions = useKingdomStore((state) => state.classOptions || []);
  const accountMappings = useKingdomStore((state) => state.accountMappings || {});
  const registerTransactions = useKingdomStore((state) => state.registerTransactions);

  // Staging session states
  const [stagedTransactions, setStagedTransactions] = useState([]);
  const [mockBalances, setMockBalances] = useState({});

  // Instantiate form hook with local form states
  const {
    txClass, setTxClass,
    txSubClass, setTxSubClass,
    txCategory, setTxCategory,
    txEntity, setTxEntity,
    txAmount, setTxAmount,
    txFrom, setTxFrom,
    txValueDate, setTxValueDate,
    txPostingDate, setTxPostingDate,
    txStatus, setTxStatus,
    txDescription, setTxDescription,
    txTargetAccount, setTxTargetAccount,
    txSourceDestBank, setTxSourceDestBank,
    txFlow, setTxFlow,
    allowedSubClasses,
    allowedCategories,
    allowedEntities,
    resetFormState
  } = useManualTransactionForm(null);

  // Ensures stable, non-jumping mock starting balances for the active staging session
  const ensureMockBalancesExist = (codesList) => {
    setMockBalances((prev) => {
      const next = { ...prev };
      let updated = false;
      codesList.forEach((code) => {
        if (code && !next[code]) {
          const randomVal = Math.floor(Math.random() * (5000 - 500 + 1)) + 500;
          next[code] = randomVal;
          updated = true;
        }
      });
      return updated ? next : prev;
    });
  };

  // Checks validation in real-time for the active input state
  const activeCombinationMatches = useMemo(() => {
    return flatMatrix.some(row => 
      row.type === txClass &&
      row.subtype === txSubClass &&
      row.category === txCategory &&
      row.entity === txEntity
    );
  }, [flatMatrix, txClass, txSubClass, txCategory, txEntity]);

  // Schema matching rows
  const dynamicMatchedSchemaRows = useMemo(() => {
    return flatMatrix.filter(row => {
      if (txClass && row.type !== txClass) return false;
      if (txSubClass && row.subtype !== txSubClass) return false;
      if (txCategory && row.category !== txCategory) return false;
      if (txEntity && row.entity !== txEntity) return false;
      return true;
    });
  }, [flatMatrix, txClass, txSubClass, txCategory, txEntity]);

  // Validation & append operation adding current selection to the session staging list
  const handleAddToBatch = (e) => {
    if (e) e.preventDefault();
    
    if (!txClass) return toast.error("Validation Error: Select Class.");
    if (!txSubClass) return toast.error("Validation Error: Select Subclass.");
    if (!txCategory) return toast.error("Validation Error: Select Category.");
    if (!txEntity) return toast.error("Validation Error: Select Entity.");
    if (!txFlow) return toast.error("Validation Error: Select Flow.");
    if (!txFrom) return toast.error("Validation Error: Select Source.");
    if (!txAmount || isNaN(txAmount) || Number(txAmount) <= 0) {
      return toast.error("Validation Error: Enter a valid Amount greater than zero.");
    }

    if (!activeCombinationMatches) {
      return toast.error("Validation Error: Selection combination does not match Flat Matrix.");
    }

    const accountCodeRegex = /^\d{8}$/;
    if (!accountCodeRegex.test(txTargetAccount)) {
      return toast.error("Validation Error: Target account must be exactly 8 digits.");
    }
    if (txSourceDestBank && !accountCodeRegex.test(txSourceDestBank)) {
      return toast.error("Validation Error: Source bank account must be exactly 8 digits.");
    }

    const newStagedTx = {
      id: 'staged-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      txClass,
      txSubClass,
      txCategory,
      txEntity,
      amount: Number(txAmount),
      from: txFrom,
      valueDate: txValueDate,
      postingDate: txPostingDate,
      status: txStatus,
      description: txDescription || `${txClass} - ${txEntity}`,
      targetAccount: txTargetAccount,
      sourceAccount: txSourceDestBank,
      flow: txFlow
    };

    // Ensure touched accounts are locked to stable starting mock balances
    ensureMockBalancesExist([txTargetAccount, txSourceDestBank]);

    setStagedTransactions((prev) => [...prev, newStagedTx]);
    resetFormState();
    toast.success("Transaction added to Ledger Batch!");
  };

  const handleRemoveFromStaged = (id) => {
    setStagedTransactions((prev) => prev.filter(t => t.id !== id));
    toast.success("Removed transaction from Staging Cart.");
  };

  // Calculates compound net changes across all accounts touched inside this batch
  const computedStagingImpacts = useMemo(() => {
    const impactsMap = {};

    stagedTransactions.forEach((tx) => {
      const amt = tx.amount;

      if (tx.txClass === 'Income') {
        if (tx.sourceAccount) {
          impactsMap[tx.sourceAccount] = (impactsMap[tx.sourceAccount] || 0) + amt;
        }
      } else if (tx.txClass === 'Expenses') {
        if (tx.sourceAccount) {
          impactsMap[tx.sourceAccount] = (impactsMap[tx.sourceAccount] || 0) - amt;
        }
      } else if (tx.txClass === 'Assets' || tx.txClass === 'Liabilities') {
        if (tx.flow === 'neutral') {
          if (tx.sourceAccount) impactsMap[tx.sourceAccount] = (impactsMap[tx.sourceAccount] || 0) - amt;
          if (tx.targetAccount) impactsMap[tx.targetAccount] = (impactsMap[tx.targetAccount] || 0) + amt;
        } else if (tx.flow === 'inflow') {
          if (tx.sourceAccount) impactsMap[tx.sourceAccount] = (impactsMap[tx.sourceAccount] || 0) + amt;
          if (tx.targetAccount) impactsMap[tx.targetAccount] = (impactsMap[tx.targetAccount] || 0) + amt;
        } else if (tx.flow === 'outflow') {
          if (tx.sourceAccount) impactsMap[tx.sourceAccount] = (impactsMap[tx.sourceAccount] || 0) - amt;
          if (tx.targetAccount) impactsMap[tx.targetAccount] = (impactsMap[tx.targetAccount] || 0) - amt;
        }
      }
    });

    return Object.entries(impactsMap).map(([code, change]) => {
      const starting = mockBalances[code] || 1000;
      return {
        code,
        label: accountMappings[code] ? `${code} - ${accountMappings[code]}` : `Account ${code}`,
        starting,
        change,
        ending: starting + change
      };
    });
  }, [stagedTransactions, mockBalances, accountMappings]);

  // Consolidates staging ledger to Supabase with a single dynamic batch upsert
  const handleCommitBatch = async () => {
    if (stagedTransactions.length === 0) return;

    const profileId = user?.id || GUEST_PROFILE_ID;
    const formatted = stagedTransactions.map(tx => ({
      transaction_type: tx.txClass,
      amount: tx.amount,
      from: tx.from,
      value_date: tx.valueDate,
      posting_date: tx.postingDate,
      payment_status: tx.status,
      transaction_subtype: tx.txSubClass,
      entity: tx.txEntity,
      transaction_category: tx.txCategory,
      target_account: tx.targetAccount,
      source_dest_bank: tx.sourceAccount,
      flow: tx.flow,
      description: tx.description
    }));

    try {
      const res = await registerTransactions(profileId, formatted);
      if (res.success) {
        toast.success(`Committed batch of ${stagedTransactions.length} transactions to ledger!`);
        setStagedTransactions([]);
      } else {
        toast.error(`Commit failed: ${res.error}`);
      }
    } catch (err) {
      console.error(err);
      toast.error(`Database error committing batch: ${err.message || err}`);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 bg-[#faf4e5] border-4 border-[#8b4513] rounded-2xl shadow-xl text-[#4b2c20] font-sans relative my-6 space-y-6">
      
      {/* Decorative corners */}
      <div className="absolute top-2 left-2 w-8 h-8 border-t-2 border-l-2 border-[#8b4513]/30 pointer-events-none" />
      <div className="absolute top-2 right-2 w-8 h-8 border-t-2 border-r-2 border-[#8b4513]/30 pointer-events-none" />
      <div className="absolute bottom-2 left-2 w-8 h-8 border-b-2 border-l-2 border-[#8b4513]/30 pointer-events-none" />
      <div className="absolute bottom-2 right-2 w-8 h-8 border-b-2 border-r-2 border-[#8b4513]/30 pointer-events-none" />

      {/* Header Banner */}
      <div className="border-b-2 border-[#8b4513]/20 pb-4 text-center sm:text-left">
        <h2 className="text-2xl font-serif font-black uppercase tracking-wider text-[#8b4513] flex items-center justify-center sm:justify-start gap-2">
          <span>🏛️</span> Cumulative Staging Session Sandbox
        </h2>
        <p className="text-xs italic text-[#5d4037]/85 mt-1">
          Downstream sandbox panel supporting ledger batching, validation pipelines, and compound account projection.
        </p>
      </div>

      {/* Primary Input Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Input Form Column */}
        <div className="lg:col-span-2 space-y-4">
          <form onSubmit={handleAddToBatch} className="space-y-4">
            
            <h3 className="text-xs font-black uppercase tracking-widest text-[#8b4513] border-b border-[#8b4513]/10 pb-1">
              Step 1: Form Selection Criteria
            </h3>

            {/* Criteria selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-[#5d4037] mb-1">
                  Class (Type)
                </label>
                <select
                  value={txClass}
                  onChange={(e) => setTxClass(e.target.value)}
                  className="w-full bg-white border-2 border-[#8b4513]/20 rounded-lg p-2.5 text-xs font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513] cursor-pointer"
                >
                  <option value="">-- Choose Class --</option>
                  {classOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-[#5d4037] mb-1">
                  Subclass (Subtype)
                </label>
                <select
                  value={txSubClass}
                  onChange={(e) => setTxSubClass(e.target.value)}
                  className="w-full bg-white border-2 border-[#8b4513]/20 rounded-lg p-2.5 text-xs font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513] cursor-pointer"
                >
                  <option value="">-- Choose Subclass --</option>
                  {allowedSubClasses.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-[#5d4037] mb-1">
                  Category (Group)
                </label>
                <select
                  value={txCategory}
                  onChange={(e) => setTxCategory(e.target.value)}
                  className="w-full bg-white border-2 border-[#8b4513]/20 rounded-lg p-2.5 text-xs font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513] cursor-pointer"
                >
                  <option value="">-- Choose Category --</option>
                  {allowedCategories.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-[#5d4037] mb-1">
                  Entity Name
                </label>
                <select
                  value={txEntity}
                  onChange={(e) => setTxEntity(e.target.value)}
                  className="w-full bg-white border-2 border-[#8b4513]/20 rounded-lg p-2.5 text-xs font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513] cursor-pointer"
                >
                  <option value="">-- Choose Entity --</option>
                  {allowedEntities.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>

            <h3 className="text-xs font-black uppercase tracking-widest text-[#8b4513] border-b border-[#8b4513]/10 pt-2 pb-1">
              Step 2: Dual Account Configuration (Dropdown Mapping Lists)
            </h3>

            {/* Selector-driven target & source mappings */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-[#5d4037] mb-1">
                  Target Account (CoA)
                </label>
                <select
                  value={txTargetAccount}
                  onChange={(e) => setTxTargetAccount(e.target.value)}
                  className="w-full bg-white border-2 border-[#8b4513]/20 rounded-lg p-2 text-xs font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513] font-mono cursor-pointer"
                >
                  <option value="">-- Select Target --</option>
                  {Object.entries(accountMappings).map(([code, name]) => (
                    <option key={code} value={code}>
                      {code} - {name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-[#5d4037] mb-1">
                  Source Bank Account (CoA)
                </label>
                <select
                  value={txSourceDestBank}
                  onChange={(e) => setTxSourceDestBank(e.target.value)}
                  className="w-full bg-white border-2 border-[#8b4513]/20 rounded-lg p-2 text-xs font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513] font-mono cursor-pointer"
                >
                  <option value="">-- Select Source --</option>
                  {Object.entries(accountMappings).map(([code, name]) => (
                    <option key={code} value={code}>
                      {code} - {name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-[#5d4037] mb-1">
                  Flow Structure
                </label>
                <select
                  value={txFlow}
                  onChange={(e) => setTxFlow(e.target.value)}
                  className="w-full bg-white border-2 border-[#8b4513]/20 rounded-lg p-2 text-xs font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513] cursor-pointer"
                >
                  <option value="">-- Select Flow --</option>
                  <option value="inflow">Inflow (Incoming)</option>
                  <option value="outflow">Outflow (Expense)</option>
                  <option value="neutral">Neutral (Transfer)</option>
                </select>
              </div>
            </div>

            <h3 className="text-xs font-black uppercase tracking-widest text-[#8b4513] border-b border-[#8b4513]/10 pt-2 pb-1">
              Step 3: Supplementary Values
            </h3>

            {/* Supplemental details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-[#5d4037] mb-1">
                  Owner/Origination (From)
                </label>
                <select
                  value={txFrom}
                  onChange={(e) => setTxFrom(e.target.value)}
                  className="w-full bg-white border-2 border-[#8b4513]/20 rounded-lg p-2 text-xs font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513] cursor-pointer"
                >
                  {fromOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-[#5d4037] mb-1">
                  Gold Coins (Value Amount)
                </label>
                <input
                  type="number"
                  value={txAmount}
                  onChange={(e) => setTxAmount(e.target.value)}
                  placeholder="e.g. 750"
                  className="w-full bg-white border-2 border-[#8b4513]/20 rounded-lg p-2 text-xs font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-[#5d4037] mb-1">
                  Settlement Status
                </label>
                <select
                  value={txStatus}
                  onChange={(e) => setTxStatus(e.target.value)}
                  className="w-full bg-white border-2 border-[#8b4513]/20 rounded-lg p-2 text-xs font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513] cursor-pointer"
                >
                  {statusOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-[#5d4037] mb-1">
                  Posting Date
                </label>
                <input
                  type="date"
                  value={txPostingDate}
                  onChange={(e) => setTxPostingDate(e.target.value)}
                  className="w-full bg-white border-2 border-[#8b4513]/20 rounded-lg p-2 text-xs font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-[#5d4037] mb-1">
                  Staging Notes (Description)
                </label>
                <input
                  type="text"
                  value={txDescription}
                  onChange={(e) => setTxDescription(e.target.value)}
                  placeholder="e.g. Kingdom vault allocations"
                  className="w-full bg-white border-2 border-[#8b4513]/20 rounded-lg p-2 text-xs font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-[#8b4513] text-[#f4e4bc] font-serif font-black text-sm uppercase tracking-widest rounded-xl hover:bg-[#5d4037] active:scale-98 transition-all shadow-md border-2 border-[#8b4513]"
            >
              ➕ Stage Transaction to Batch
            </button>
          </form>
        </div>

        {/* Right validation tracking block */}
        <div className="space-y-4">
          <div className="bg-[#faf4e5] border-2 border-[#8b4513]/30 rounded-xl p-4 shadow-inner">
            <h3 className="font-serif font-black text-xs text-[#8b4513] uppercase tracking-wider mb-3">
              🛡️ Live Validator Console
            </h3>
            
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-[#8b4513]/10">
                <span className="font-medium text-[#5d4037]">Schema Rows:</span>
                <span className="font-mono font-black">{flatMatrix.length} Rows</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-[#8b4513]/10">
                <span className="font-medium text-[#5d4037]">Active Class:</span>
                <span className="font-mono font-black">{txClass || <span className="text-[#8b4513]/40 italic">unset</span>}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-[#8b4513]/10">
                <span className="font-medium text-[#5d4037]">Active Subtype:</span>
                <span className="font-mono font-black truncate max-w-[120px]">{txSubClass || <span className="text-[#8b4513]/40 italic">unset</span>}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-[#8b4513]/10">
                <span className="font-medium text-[#5d4037]">Active Category:</span>
                <span className="font-mono font-black truncate max-w-[120px]">{txCategory || <span className="text-[#8b4513]/40 italic">unset</span>}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-[#8b4513]/10">
                <span className="font-medium text-[#5d4037]">Active Entity:</span>
                <span className="font-mono font-black truncate max-w-[120px]">{txEntity || <span className="text-[#8b4513]/40 italic">unset</span>}</span>
              </div>

              {/* Dynamic validation badge */}
              <div className="pt-2 text-center">
                {txClass && txSubClass && txCategory && txEntity ? (
                  activeCombinationMatches ? (
                    <div className="bg-emerald-50 text-emerald-800 border border-emerald-300 rounded px-2 py-2 font-bold uppercase tracking-wide text-[10px] shadow-sm">
                      ✓ Schema Combination Verified
                    </div>
                  ) : (
                    <div className="bg-rose-50 text-rose-800 border border-rose-300 rounded px-2 py-2 font-bold uppercase tracking-wide text-[10px] shadow-sm">
                      ✗ Combo Not Found in Schema
                    </div>
                  )
                ) : (
                  <div className="bg-amber-50 text-amber-800 border border-amber-300 rounded px-2 py-2 font-bold uppercase tracking-wide text-[10px]">
                    Waiting for selection...
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-[#faf4e5] border-2 border-[#8b4513]/20 rounded-xl p-3 text-[10px] space-y-1.5 leading-normal">
            <span className="font-black uppercase tracking-wider text-[#8b4513] block mb-0.5">Dual-Account Mapping Rules</span>
            <p>1. Changing Class, Subclass, or Category triggers immediate targeted resets to eliminate mismatch errors.</p>
            <p>2. Selection validation ensures staged rows follow established dim_contas schema constraints.</p>
            <p>3. Dropdowns map to target and source balances directly to verify double-entry impact.</p>
          </div>
        </div>
      </div>

      {/* OVERHAULED SECTION: Wide Staging Cart and compound impact matrices */}
      <div className="bg-[#faf4e5] border-2 border-[#8b4513]/30 rounded-xl p-5 shadow-inner space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b-2 border-[#8b4513]/15 pb-3">
          <div>
            <h3 className="font-serif font-black text-sm text-[#8b4513] uppercase tracking-wider flex items-center gap-2">
              🛒 Current Session Batch ({stagedTransactions.length} Staged)
            </h3>
            <p className="text-[10px] italic text-[#5d4037]/80 mt-0.5">
              Review individual items staged in this session before committing them to the permanent ledger.
            </p>
          </div>
          {stagedTransactions.length > 0 && (
            <button
              onClick={() => {
                setStagedTransactions([]);
                toast.success("Cleared entire session batch.");
              }}
              className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-800 border border-red-300 rounded text-[10px] font-bold uppercase tracking-wider transition-all"
            >
              Clear Batch
            </button>
          )}
        </div>

        {/* Staged Transactions item log list */}
        {stagedTransactions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {stagedTransactions.map((tx) => (
              <div key={tx.id} className="bg-white/65 p-3 rounded-xl border border-[#8b4513]/15 flex flex-col justify-between text-xs space-y-2 relative shadow-sm hover:shadow transition-shadow">
                <div>
                  <div className="flex justify-between items-start">
                    <span className="font-black text-[#8b4513] uppercase text-[10px] tracking-wider">
                      {tx.txClass} - {tx.txSubClass}
                    </span>
                    <button
                      onClick={() => handleRemoveFromStaged(tx.id)}
                      className="text-[#8b4513] hover:text-red-700 font-bold transition-colors text-[10px]"
                      title="Remove"
                    >
                      ✕
                    </button>
                  </div>
                  <span className="block text-[11px] font-medium mt-1 truncate">{tx.description}</span>
                  <div className="text-[10px] text-stone-500 font-mono mt-1 space-y-0.5">
                    {tx.sourceAccount && (
                      <p className="truncate">Src: {tx.sourceAccount} ({accountMappings[tx.sourceAccount] || 'Unknown'})</p>
                    )}
                    {tx.targetAccount && (
                      <p className="truncate">Tgt: {tx.targetAccount} ({accountMappings[tx.targetAccount] || 'Unknown'})</p>
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-[#8b4513]/5">
                  <span className="text-[10px] text-stone-400 font-mono">{tx.postingDate}</span>
                  <span className="font-mono font-black text-[#4b2c20] text-sm bg-[#faf4e5]/80 px-2 py-0.5 rounded border border-[#8b4513]/10">
                    🪙 {tx.amount.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center border-2 border-dashed border-[#8b4513]/15 rounded-xl bg-white/30">
            <p className="text-xs italic text-[#5d4037]/60">
              No transactions currently staged. Fill out the form above and click "+ Add to Batch" to begin staging.
            </p>
          </div>
        )}

        {/* Compound Net Balance Impact Table */}
        <div className="border-t-2 border-[#8b4513]/15 pt-4 space-y-3">
          <div>
            <h4 className="font-serif font-black text-xs text-[#8b4513] uppercase tracking-wider">
              ⚖️ Cumulative Projected Balances (Dynamic Double-Entry)
            </h4>
            <p className="text-[10px] text-[#5d4037]/80 italic mt-0.5">
              Net balance adjustments projected across all affected asset and liability accounts in this batch.
            </p>
          </div>

          <div className="w-full overflow-x-auto rounded-xl border border-[#8b4513]/20 bg-white/70">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#e8dcc4] text-[#4b2c20] font-bold text-[10px] uppercase border-b border-[#8b4513]/25">
                  <th className="p-3">Account Reference</th>
                  <th className="p-3 text-right">Starting Balance</th>
                  <th className="p-3 text-center">Net Staging Impact</th>
                  <th className="p-3 text-right">Projected Balance</th>
                </tr>
              </thead>
              <tbody className="font-mono text-[11px]">
                {computedStagingImpacts.length > 0 ? (
                  computedStagingImpacts.map((row) => {
                    const isPositive = row.change > 0;
                    const absChange = Math.abs(row.change);
                    return (
                      <tr key={row.code} className="border-b border-[#8b4513]/10 hover:bg-white/40 last:border-0">
                        <td className="p-3 font-sans font-bold text-[#4b2c20] truncate max-w-xs leading-tight">
                          {row.label}
                        </td>
                        <td className="p-3 text-right text-stone-500">
                          {row.starting.toLocaleString()}g
                        </td>
                        <td className="p-3 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black font-sans leading-none ${
                            row.change === 0 
                              ? 'bg-stone-100 text-stone-600'
                              : isPositive 
                                ? 'bg-emerald-50 text-emerald-700' 
                                : 'bg-rose-50 text-rose-700'
                          }`}>
                            {row.change === 0 ? '0' : isPositive ? `+${absChange}` : `-${absChange}`}g
                          </span>
                        </td>
                        <td className="p-3 text-right font-black text-[#4b2c20]">
                          <span className="mr-1 text-stone-400 font-normal">→</span>
                          {row.ending.toLocaleString()}g
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="4" className="p-6 text-center text-stone-400 italic font-sans text-xs">
                      Staging balance empty. Cumulative balance impacts will update once transactions are added.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Review & Commit section */}
        {stagedTransactions.length > 0 && (
          <div className="flex justify-end pt-2 border-t border-[#8b4513]/10">
            <button
              onClick={handleCommitBatch}
              className="px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-serif font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow border border-emerald-800 hover:scale-[1.01]"
            >
              🚀 Review & Commit Batch ({stagedTransactions.length} Transactions)
            </button>
          </div>
        )}
      </div>

      {/* Dynamic database matrix inspector */}
      <div className="border-t border-[#8b4513]/15 pt-4">
        <h3 className="font-serif font-black text-xs text-[#8b4513] uppercase tracking-wider mb-2 flex items-center gap-1.5">
          📊 Matching Database Schema Rows ({dynamicMatchedSchemaRows.length})
        </h3>
        <div className="w-full overflow-x-auto max-h-48 overflow-y-auto rounded-lg border border-[#8b4513]/20 bg-white/50 text-[10px]">
          <table className="w-full text-left border-collapse font-mono">
            <thead>
              <tr className="bg-[#e8dcc4] text-[#4b2c20] uppercase font-bold text-[9px] border-b border-[#8b4513]/20 sticky top-0">
                <th className="p-2">Code</th>
                <th className="p-2">Account Description</th>
                <th className="p-2">Type</th>
                <th className="p-2">Subclass</th>
                <th className="p-2">Category</th>
                <th className="p-2">Entity</th>
              </tr>
            </thead>
            <tbody>
              {dynamicMatchedSchemaRows.length > 0 ? (
                dynamicMatchedSchemaRows.map((row, index) => (
                  <tr key={index} className="border-b border-[#8b4513]/5 hover:bg-white/45">
                    <td className="p-2 font-bold text-[#8b4513]">{row.accountCode}</td>
                    <td className="p-2 truncate max-w-xs">{row.account_name}</td>
                    <td className="p-2">{row.type}</td>
                    <td className="p-2">{row.subtype}</td>
                    <td className="p-2">{row.category}</td>
                    <td className="p-2">{row.entity}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="p-4 text-center text-stone-400 italic">
                    No schema match found inside the database for current dropdown criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}