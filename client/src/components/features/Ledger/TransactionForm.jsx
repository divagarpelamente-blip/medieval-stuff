import React, { useState, useEffect, useMemo } from 'react';
import { useKingdomStore } from "../../../store/useKingdomStore";
import { toast } from 'react-hot-toast';

const normalizeType = (type) => {
  if (!type) return '';
  const lower = type.trim().toLowerCase();
  if (lower === 'asset' || lower === 'assets') return 'Assets';
  if (lower === 'liability' || lower === 'liabilities') return 'Liabilities';
  if (lower === 'income') return 'Income';
  if (lower === 'expense' || lower === 'expenses') return 'Expenses';
  return type;
};

const getVarianceIcon = (type, flow) => {
  const normType = normalizeType(type);
  const isIncrease = flow === 'inflow';
  
  if (normType === 'Assets') {
    return isIncrease 
      ? { color: 'text-emerald-500', arrow: '↑' }
      : { color: 'text-rose-500', arrow: '↓' };
  } else {
    // Liabilities, Expenses, Income
    return isIncrease
      ? { color: 'text-rose-500', arrow: '↑' }
      : { color: 'text-emerald-500', arrow: '↓' };
  }
};

export default function TransactionForm({ editingTransaction, onCancelEdit, onSuccess }) {
  const flatMatrix = useKingdomStore((state) => state.flatMatrix) || [];
  const isLedgerLoading = useKingdomStore((state) => state.isLedgerLoading);
  const fetchFlatMatrix = useKingdomStore((state) => state.fetchFlatMatrix);
  const addTransaction = useKingdomStore((state) => state.addTransaction);
  const updateTransaction = useKingdomStore((state) => state.updateTransaction);

  const [stagedTransactions, setStagedTransactions] = useState([]);
  
  // Stage Log State
  const [isLogView, setIsLogView] = useState(false);
  const [logDrafts, setLogDrafts] = useState([]);
  const [editingDraftId, setEditingDraftId] = useState(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const [amount, setAmount] = useState('');
  const [flow, setFlow] = useState('outflow');
  const [paymentStatus, setPaymentStatus] = useState('Completed');
  const [sourceAccount, setSourceAccount] = useState('');

  const [valueDate, setValueDate] = useState(todayStr);
  const [postingDate, setPostingDate] = useState(todayStr);
  const [paymentDate, setPaymentDate] = useState('');

  const [entity, setEntity] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedSubtype, setSelectedSubtype] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedAccountCode, setSelectedAccountCode] = useState('');

  useEffect(() => {
    fetchFlatMatrix();
  }, [fetchFlatMatrix]);

  useEffect(() => {
    if (editingTransaction) {
      setEntity(editingTransaction.entity || '');
      setSelectedType(editingTransaction.type || '');
      setSelectedSubtype(editingTransaction.subtype || '');
      setSelectedCategory(editingTransaction.category || '');
      setSelectedAccountCode(editingTransaction.target_account || '');
      setAmount(editingTransaction.amount || '');
      setFlow(editingTransaction.flow || 'outflow');
      setSourceAccount(editingTransaction.source_account || '');
      setPaymentStatus(editingTransaction.payment_status || 'Completed');
      setValueDate(editingTransaction.value_date || todayStr);
      setPostingDate(editingTransaction.posting_date || todayStr);
      setPaymentDate(editingTransaction.payment_date || '');
    }
  }, [editingTransaction, todayStr]);

  // Clean dynamic mapping (ignores bad data)
  const uniqueEntities = [...new Set(flatMatrix.map((row) => row.entity).filter(Boolean))].sort();
  // Ensure we only use the 4 valid root types (handling singular/plural variations)
  const validTypes = ['Assets', 'Asset', 'Liabilities', 'Liability', 'Income', 'Expense', 'Expenses'];
  const uniqueTypes = [...new Set(flatMatrix.map((row) => row.type).filter(Boolean))]
    .filter(type => validTypes.includes(type))
    .sort();

  // Filter Subtypes
  const filteredSubtypes = selectedType
    ? [...new Set(
        flatMatrix
          .filter((row) => normalizeType(row.type) === normalizeType(selectedType))
          .map((row) => row.subtype)
          .filter(Boolean)
      )].sort()
    : [...new Set(flatMatrix.map((row) => row.subtype).filter(Boolean))].sort();

  // Filter Categories (must respect both Type and Subtype)
  const filteredCategories = useMemo(() => {
    return [...new Set(
      flatMatrix
        .filter((row) => {
          if (selectedType && normalizeType(row.type) !== normalizeType(selectedType)) return false;
          if (selectedSubtype && row.subtype !== selectedSubtype) return false;
          return true;
        })
        .map((row) => row.category)
        .filter(Boolean)
    )].sort();
  }, [flatMatrix, selectedType, selectedSubtype]);

  // Filter Target Accounts
  const filteredAccounts = flatMatrix.filter((row) => {
    if (selectedType && normalizeType(row.type) !== normalizeType(selectedType)) return false;
    if (selectedSubtype && row.subtype !== selectedSubtype) return false;
    if (selectedCategory && row.category !== selectedCategory) return false;
    return true;
  });

  const allAccounts = [...flatMatrix].sort((a, b) => a.code.localeCompare(b.code));

  const handleEntityChange = (e) => {
    const val = e.target.value;
    setEntity(val);

    if (val) {
      const match = flatMatrix.find((row) => row.entity === val);
      if (match) {
        setSelectedType(match.type || '');
        setSelectedSubtype(match.subtype || '');
        setSelectedCategory(match.category || '');
        setSelectedAccountCode(match.code || '');

        if (match.type === 'Income') setFlow('inflow');
        else if (match.type === 'Expense' || match.type === 'Expenses') setFlow('outflow');
      }
    }
  };

  const handleTypeChange = (e) => {
    const val = e.target.value;
    setSelectedType(val);
    setSelectedSubtype('');
    setSelectedCategory('');
    setSelectedAccountCode('');

    if (val === 'Income') setFlow('inflow');
    else if (val === 'Expense' || val === 'Expenses') setFlow('outflow');
  };

  const handleSubtypeChange = (e) => {
    setSelectedSubtype(e.target.value);
    setSelectedCategory('');
    setSelectedAccountCode('');
  };

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
    setSelectedAccountCode('');
  };

  const handleAccountCodeChange = (e) => {
    const code = e.target.value;
    setSelectedAccountCode(code);

    const match = flatMatrix.find((row) => row.code === code);
    if (match) {
      setSelectedType(match.type);
      setSelectedSubtype(match.subtype);
      setSelectedCategory(match.category);
      if (!entity) setEntity(match.entity || '');

      if (match.type === 'Income') setFlow('inflow');
      else if (match.type === 'Expense' || match.type === 'Expenses') setFlow('outflow');
    }
  };

  const resetForm = () => {
    setAmount('');
    setEntity('');
    setSelectedType('');
    setSelectedSubtype('');
    setSelectedCategory('');
    setSelectedAccountCode('');
    setSourceAccount('');
    setFlow('outflow');
    setPaymentStatus('Completed');
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (!selectedType) {
      toast.error('Constraint Violation: A valid Type is required.');
      return;
    }
    if (!selectedAccountCode) {
      toast.error('Select a valid Target Account code before submission.');
      return;
    }
    if (!amount || Number(amount) <= 0) {
      toast.error('Amount must be a positive value.');
      return;
    }

    const payload = {
      value_date: valueDate,
      posting_date: postingDate,
      payment_date: paymentDate || null,
      amount: amount,
      target_account: selectedAccountCode,
      source_account: sourceAccount || null,
      flow: flow,
      payment_status: paymentStatus,
      type: selectedType,
      subtype: selectedSubtype,
      category: selectedCategory,
      entity: entity || null,
      description: '', // Suppressed in new UI flow
      origin: 'Web Client'
    };

    const targetAccountName = flatMatrix.find(row => row.code === selectedAccountCode)?.account_name || selectedAccountCode;

    if (editingTransaction) {
      try {
        await updateTransaction(editingTransaction.id, payload);
        toast.success("Transaction Updated");
        resetForm();
        if (onCancelEdit) onCancelEdit();
        if (onSuccess) onSuccess();
      } catch (error) {
        toast.error("Failed to update transaction.");
      }
    } else if (editingDraftId) {
      const updatedDraft = {
        id: editingDraftId,
        payload,
        account_name: targetAccountName,
        type: selectedType,
        flow: flow,
        amount: Number(amount)
      };
      setLogDrafts(prev => prev.map(d => d.id === editingDraftId ? updatedDraft : d));
      resetForm();
      setEditingDraftId(null);
      toast.success("Draft Updated");
    } else {
      const stagedItem = {
        id: Date.now().toString() + Math.random().toString(),
        payload,
        account_name: targetAccountName,
        type: selectedType,
        flow: flow,
        amount: Number(amount)
      };
      setStagedTransactions(prev => [...prev, stagedItem]);
      if (isLogView) {
        setLogDrafts(prev => [...prev, stagedItem]);
      }
      resetForm();
    }
  };

  const handleCommitBatch = async () => {
    if (stagedTransactions.length === 0) return;

    try {
      for (const txn of stagedTransactions) {
        await addTransaction(txn.payload);
      }
      toast.success(`Successfully committed ${stagedTransactions.length} transactions.`);
      setStagedTransactions([]);
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error("Failed to commit one or more transactions.");
    }
  };

  const handleEditDraft = (draft) => {
    const p = draft.payload;
    setEntity(p.entity || '');
    setSelectedType(p.type || '');
    setSelectedSubtype(p.subtype || '');
    setSelectedCategory(p.category || '');
    setSelectedAccountCode(p.target_account || '');
    setSourceAccount(p.source_account || '');
    setAmount(p.amount || '');
    setFlow(p.flow || 'outflow');
    setPaymentStatus(p.payment_status || 'Completed');
    setValueDate(p.value_date || todayStr);
    setPostingDate(p.posting_date || todayStr);
    setPaymentDate(p.payment_date || '');
    setEditingDraftId(draft.id);
  };

  const handleDeleteDraft = (id) => {
    setLogDrafts(prev => prev.filter(d => d.id !== id));
    if (editingDraftId === id) {
      setEditingDraftId(null);
      resetForm();
    }
  };

  const getSourceName = (code) => {
    if (!code) return 'External';
    const match = flatMatrix.find(r => r.code === code);
    return match ? match.account_name : code;
  };

  const aggregatedVariances = useMemo(() => {
    const map = {};
    stagedTransactions.forEach(txn => {
      const processLeg = (code, name, type, flow, amount) => {
        if (!map[code]) map[code] = { account_name: name, type: type, net_impact: 0 };
        // Assuming 'inflow' is a positive numeric vector for this calculation
        map[code].net_impact += (flow === 'inflow') ? amount : -amount;
      };
      
      if (txn.payload.source_account) {
        const sMatch = flatMatrix.find(row => row.code === txn.payload.source_account);
        processLeg(
          txn.payload.source_account, 
          sMatch ? sMatch.account_name : txn.payload.source_account, 
          sMatch ? sMatch.type : 'Assets', 
          txn.payload.flow, 
          txn.amount
        );
      }
      
      const tFlow = txn.payload.flow === 'inflow' ? 'outflow' : txn.payload.flow === 'outflow' ? 'inflow' : 'neutral';
      processLeg(txn.payload.target_account, txn.account_name, txn.type, tFlow, txn.amount);
    });

    return Object.values(map)
      .filter(v => v.net_impact !== 0) // Hide accounts that perfectly net to 0
      .map(v => ({
        ...v,
        flow: v.net_impact > 0 ? 'inflow' : 'outflow',
        amount: Math.abs(v.net_impact)
      }));
  }, [stagedTransactions, flatMatrix]);

  return (
    <section className="bg-stone-950 border-2 border-amber-900/50 rounded-lg p-5 shadow-2xl relative overflow-hidden">
      
      <datalist id="entities-suggest">
        {uniqueEntities.map((ent) => (
          <option key={ent} value={ent} />
        ))}
      </datalist>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* LEFT PANEL - Form Input */}
        <div className="bg-stone-900/30 p-4 rounded-lg border border-stone-800/50">
          <form onSubmit={handleFormSubmit} className="space-y-4">
            
            {/* ROW 1: Type + Subtype */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-stone-400">Type</label>
                <select
                  value={selectedType}
                  onChange={handleTypeChange}
                  className="bg-stone-950 border border-stone-800 focus:border-amber-500 outline-none p-2 rounded text-xs text-stone-100 transition"
                >
                  <option value="">-- Select Type --</option>
                  {uniqueTypes.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-stone-400">Subtype</label>
                <select
                  value={selectedSubtype}
                  onChange={handleSubtypeChange}
                  className="bg-stone-950 border border-stone-800 focus:border-amber-500 outline-none p-2 rounded text-xs text-stone-100 transition"
                >
                  <option value="">-- Select Subtype --</option>
                  {filteredSubtypes.map((sub) => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* ROW 2: Category + Entity */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-stone-400">Category</label>
                <select
                  value={selectedCategory}
                  onChange={handleCategoryChange}
                  className="bg-stone-950 border border-stone-800 focus:border-amber-500 outline-none p-2 rounded text-xs text-stone-100 transition"
                >
                  <option value="">-- Select Category --</option>
                  {filteredCategories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                  Entity
                </label>
                <input
                  type="text"
                  list="entities-suggest"
                  value={entity}
                  onChange={handleEntityChange}
                  placeholder="Enter Entity..."
                  className="bg-stone-950 border border-stone-800 focus:border-amber-500 outline-none p-2 rounded text-xs text-stone-100 transition"
                />
              </div>
            </div>

            {/* ROW 3: Flow + Payment Status */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-stone-400">Flow</label>
                <select
                  value={flow}
                  onChange={(e) => setFlow(e.target.value)}
                  disabled={selectedType === 'Income' || selectedType === 'Expense' || selectedType === 'Expenses'}
                  className="bg-stone-950 border border-stone-800 focus:border-amber-500 outline-none p-2 rounded text-xs text-stone-100 transition disabled:opacity-60"
                >
                  <option value="outflow">Outflow</option>
                  <option value="inflow">Inflow</option>
                  <option value="neutral">Neutral</option>
                </select>
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-stone-400">Payment Status</label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  className="bg-stone-950 border border-stone-800 focus:border-amber-500 outline-none p-2 rounded text-xs text-stone-100 transition"
                >
                  <option value="Completed">Completed</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
            </div>

            {/* ROW 4: Value Date + Posting Date + Payment Date */}
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-stone-400">Value Date</label>
                <input
                  type="date"
                  required
                  value={valueDate}
                  onChange={(e) => setValueDate(e.target.value)}
                  className="bg-stone-950 border border-stone-800 focus:border-amber-500 outline-none p-2 rounded text-xs text-stone-100 transition font-mono"
                />
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-stone-400">Posting Date</label>
                <input
                  type="date"
                  required
                  value={postingDate}
                  onChange={(e) => setPostingDate(e.target.value)}
                  className="bg-stone-950 border border-stone-800 focus:border-amber-500 outline-none p-2 rounded text-xs text-stone-100 transition font-mono"
                />
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-stone-400">Payment Date</label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="bg-stone-950 border border-stone-800 focus:border-amber-500 outline-none p-2 rounded text-xs text-stone-100 transition font-mono"
                />
              </div>
            </div>

            {/* ROW 5: Source Account */}
            <div className="flex flex-col space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-stone-400">Source Account</label>
              <select
                value={sourceAccount}
                onChange={(e) => setSourceAccount(e.target.value)}
                className="bg-stone-950 border border-stone-800 focus:border-amber-500 outline-none p-2 rounded text-xs text-stone-100 font-mono transition w-full"
              >
                <option value="">-- Select Source Account --</option>
                {allAccounts.map((row) => (
                  <option key={row.code} value={row.code}>
                    {row.code} - {row.account_name}
                  </option>
                ))}
              </select>
            </div>

            {/* ROW 6: Target Account */}
            <div className="flex flex-col space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-stone-400">Target Account</label>
              <select
                value={selectedAccountCode}
                onChange={handleAccountCodeChange}
                className="bg-stone-950 border border-stone-800 focus:border-amber-500 outline-none p-2 rounded text-xs text-stone-100 font-mono transition w-full"
              >
                <option value="">-- Select Target Account --</option>
                {filteredAccounts.map((row) => (
                  <option key={row.code} value={row.code}>
                    {row.code} - {row.account_name}
                  </option>
                ))}
              </select>
            </div>

            {/* ROW 7: Amount + Action Buttons */}
            <div className="grid grid-cols-2 gap-3 items-end pt-2">
              <div className="flex flex-col space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-stone-400">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="bg-stone-950 border border-stone-800 focus:border-amber-500 outline-none p-2 rounded text-xs text-stone-100 font-mono transition"
                />
              </div>

              <div className="flex gap-2 w-full h-[34px]">
                <button
                  type="submit"
                  className="flex-1 bg-stone-800 hover:bg-stone-700 active:translate-y-px border border-stone-600/50 rounded text-stone-300 text-[10px] sm:text-xs tracking-widest uppercase font-bold transition px-2"
                >
                  {editingTransaction ? 'Update Transaction' : editingDraftId ? 'Save Staged' : 'Stage Transaction'}
                </button>
                
                {editingTransaction && (
                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      if (onCancelEdit) onCancelEdit();
                    }}
                    className="px-3 bg-stone-950 hover:bg-stone-900 active:translate-y-px border border-stone-800 rounded text-stone-400 text-[10px] sm:text-xs tracking-widest uppercase font-bold transition"
                  >
                    Cancel
                  </button>
                )}

                {editingDraftId && (
                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      setEditingDraftId(null);
                    }}
                    className="px-3 bg-stone-950 hover:bg-stone-900 active:translate-y-px border border-stone-800 rounded text-stone-400 text-[10px] sm:text-xs tracking-widest uppercase font-bold transition whitespace-nowrap"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </div>

          </form>
        </div>

        {/* RIGHT PANEL - Variance Summary / Stage Log */}
        <div className="bg-stone-900/30 p-4 rounded-lg border border-stone-800/50 flex flex-col h-full min-h-[500px]">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-500 mb-4 font-serif">
            {isLogView ? 'Stage Log (Drafts)' : 'Variance Summary'}
          </h3>
          
          <div className="flex-1 overflow-y-auto space-y-1 mb-4 scrollbar-thin scrollbar-thumb-stone-800 scrollbar-track-transparent pr-1">
            
            {!isLogView ? (
              aggregatedVariances.length === 0 ? (
                <div className="text-stone-500 text-[10px] italic text-center py-10">
                  No transactions staged.
                </div>
              ) : (
                aggregatedVariances.map((v, i) => {
                  const ui = getVarianceIcon(v.type, v.flow);
                  return (
                    <div key={i} className="flex justify-between items-center p-1.5 bg-stone-950 rounded border border-stone-800/50 shadow-sm mb-1">
                      <span className="text-[10px] text-stone-300 font-mono truncate mr-3" title={v.account_name}>
                        {v.account_name}
                      </span>
                      <div className={`flex items-center gap-1 text-[10px] font-bold font-mono whitespace-nowrap ${ui.color}`}>
                        <span>{ui.arrow}</span>
                        <span>{v.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  );
                })
              )
            ) : (
              logDrafts.length === 0 ? (
                <div className="text-stone-500 text-[10px] italic text-center py-10">
                  No drafts available.
                </div>
              ) : (
                logDrafts.map((draft) => (
                  <div key={draft.id} className="flex p-1.5 bg-stone-950 rounded border border-stone-800/50 shadow-sm gap-3 mb-1">
                    
                    <div className="flex flex-col gap-1 justify-center shrink-0">
                      <button 
                        onClick={() => handleDeleteDraft(draft.id)}
                        title="Delete Draft"
                        className="p-1 hover:bg-stone-800 rounded text-stone-500 hover:text-rose-400 transition"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18" /><path d="M6 6l12 12" /></svg>
                      </button>
                      <button 
                        onClick={() => handleEditDraft(draft)}
                        title="Edit Draft"
                        className={`p-1 hover:bg-stone-800 rounded transition ${editingDraftId === draft.id ? 'text-amber-400 bg-stone-800' : 'text-stone-500 hover:text-blue-400'}`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                      </button>
                    </div>

                    <div className="flex flex-col flex-1 truncate justify-center">
                      <span className="text-[10px] text-stone-400 uppercase tracking-wider font-bold mb-0.5">Source</span>
                      <span className="text-[10px] text-stone-300 truncate" title={getSourceName(draft.payload.source_account)}>
                        {getSourceName(draft.payload.source_account)}
                      </span>
                      <span className="text-[10px] text-amber-500 font-mono mt-0.5">
                        {draft.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="flex flex-col flex-1 truncate justify-center text-right">
                      <span className="text-[10px] text-stone-400 uppercase tracking-wider font-bold mb-0.5">Target</span>
                      <span className="text-[10px] text-stone-300 truncate" title={draft.account_name}>
                        {draft.account_name}
                      </span>
                      <span className="text-[10px] text-amber-500 font-mono mt-0.5">
                        {draft.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                  </div>
                ))
              )
            )}
            
          </div>
          
          <div className="shrink-0 pt-3 border-t border-stone-800/50 flex gap-2">
            {!isLogView ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setLogDrafts([...stagedTransactions]);
                    setIsLogView(true);
                  }}
                  className="flex-1 px-4 py-2.5 bg-stone-800 hover:bg-stone-700 active:translate-y-px border border-stone-600/50 rounded text-stone-300 text-xs tracking-widest uppercase font-bold transition"
                >
                  Stage Log
                </button>
                <button
                  type="button"
                  onClick={handleCommitBatch}
                  disabled={stagedTransactions.length === 0 || isLedgerLoading}
                  className="flex-1 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 active:translate-y-px border border-amber-400/50 rounded text-stone-950 text-xs tracking-widest uppercase font-bold transition disabled:opacity-50"
                >
                  {isLedgerLoading ? 'Committing...' : 'Commit Batch'}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setStagedTransactions([...logDrafts]);
                    setIsLogView(false);
                    setEditingDraftId(null);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2.5 bg-emerald-600/20 hover:bg-emerald-600/40 active:translate-y-px border border-emerald-500/50 rounded text-emerald-400 text-xs tracking-widest uppercase font-bold transition"
                >
                  Save Drafts
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsLogView(false);
                    setEditingDraftId(null);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2.5 bg-stone-800 hover:bg-stone-700 active:translate-y-px border border-stone-600/50 rounded text-stone-300 text-xs tracking-widest uppercase font-bold transition"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>

      </div>
    </section>
  );
}