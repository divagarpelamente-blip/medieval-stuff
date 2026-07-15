import React, { useState, useEffect } from 'react';
import { useKingdomStore } from "../../store/useKingdomStore";
import { toast } from 'react-hot-toast';

export default function GeneralLedgerSandbox() {
  // Store subscriptions
  const flatMatrix = useKingdomStore((state) => state.flatMatrix) || [];
  const transactions = useKingdomStore((state) => state.transactions) || [];
  const isLedgerLoading = useKingdomStore((state) => state.isLedgerLoading);
  const fetchTransactions = useKingdomStore((state) => state.fetchTransactions);
  const fetchFlatMatrix = useKingdomStore((state) => state.fetchFlatMatrix);
  const addTransaction = useKingdomStore((state) => state.addTransaction);
  
  // Add store actions & state
  const updateTransaction = useKingdomStore((state) => state.updateTransaction);
  const deleteTransaction = useKingdomStore((state) => state.deleteTransaction);
  const [editingId, setEditingId] = useState(null); // Tracks if we are editing an existing row

  const user = useKingdomStore((state) => state.user);

  // Core Financial Detail Local State
  const todayStr = new Date().toISOString().split('T')[0];
  const [amount, setAmount] = useState('');
  const [flow, setFlow] = useState('outflow');
  const [sourceAccount, setSourceAccount] = useState('');
  const [description, setDescription] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('Completed');

  // Exact Database Date Alignment States
  const [valueDate, setValueDate] = useState(todayStr);
  const [postingDate, setPostingDate] = useState(todayStr);
  const [paymentDate, setPaymentDate] = useState('');

  // Cascading Matrix Fields Local State
  const [entity, setEntity] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedSubtype, setSelectedSubtype] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedAccountCode, setSelectedAccountCode] = useState('');

  // Dual Synchronous Fetch on Mount
  useEffect(() => {
    fetchFlatMatrix();
    fetchTransactions();
  }, []);

  // Unique Matrix Option Calculations
  const uniqueEntities = [...new Set(flatMatrix.map((row) => row.entity).filter(Boolean))].sort();
  const uniqueTypes = [...new Set(flatMatrix.map((row) => row.type).filter(Boolean))].sort();

  // Cascading Selection Options derived dynamically from Flat Matrix
  const filteredSubtypes = selectedType
    ? [...new Set(flatMatrix.filter((row) => row.type === selectedType).map((row) => row.subtype).filter(Boolean))].sort()
    : [...new Set(flatMatrix.map((row) => row.subtype).filter(Boolean))].sort();

  const filteredCategories = selectedSubtype
    ? [...new Set(flatMatrix.filter((row) => row.subtype === selectedSubtype).map((row) => row.category).filter(Boolean))].sort()
    : [...new Set(flatMatrix.map((row) => row.category).filter(Boolean))].sort();

  const filteredAccounts = flatMatrix.filter((row) => {
    if (selectedType && row.type !== selectedType) return false;
    if (selectedSubtype && row.subtype !== selectedSubtype) return false;
    if (selectedCategory && row.category !== selectedCategory) return false;
    return true;
  });

  // Source Accounts filter down dynamically to Assets to maintain double entry standard
  const assetSourceAccounts = flatMatrix.filter((row) => row.type === 'Assets');

  // Dynamic Event Handlers
  const handleEntityChange = (e) => {
    const val = e.target.value;
    setEntity(val);

    // Auto-fill logic
    if (val) {
      const match = flatMatrix.find((row) => row.entity === val);
      if (match) {
        setSelectedType(match.type || '');
        setSelectedSubtype(match.subtype || '');
        setSelectedCategory(match.category || '');
        setSelectedAccountCode(match.code || '');

        if (match.type === 'Income' || match.type === 'Receivable') {
          setFlow('inflow');
        } else if (match.type === 'Expense' || match.type === 'Payable') {
          setFlow('outflow');
        }
      }
    }
  };

  const handleTypeChange = (e) => {
    const val = e.target.value;
    setSelectedType(val);
    setSelectedSubtype('');
    setSelectedCategory('');
    setSelectedAccountCode('');

    if (val === 'Income' || val === 'Receivable') {
      setFlow('inflow');
    } else if (val === 'Expense' || val === 'Payable') {
      setFlow('outflow');
    }
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

      if (match.type === 'Income' || match.type === 'Receivable') {
        setFlow('inflow');
      } else if (match.type === 'Expense' || match.type === 'Payable') {
        setFlow('outflow');
      }
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (!selectedAccountCode) {
      toast.error('Select a valid Target Account code before submission.');
      return;
    }
    if (!amount || Number(amount) <= 0) {
      toast.error('Amount must be a positive value.');
      return;
    }

    if (selectedType === 'Receivable' && flow !== 'inflow') {
      toast.error("Constraint Violation: Receivables must have an 'inflow' direction.");
      return;
    }
    if (selectedType === 'Payable' && flow !== 'outflow') {
      toast.error("Constraint Violation: Payables must have an 'outflow' direction.");
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
      description: description,
      origin: 'Web Client Sandbox'
    };

    try {
      if (editingId) {
        await updateTransaction(editingId, payload);
        toast.success("Transaction Updated");
        setEditingId(null);
      } else {
        await addTransaction(payload);
        toast.success("Transaction Added");
      }
      
      // Clean inputs
      setAmount('');
      setSourceAccount('');
      setDescription('');
      setEntity('');
      setSelectedType('');
      setSelectedSubtype('');
      setSelectedCategory('');
      setSelectedAccountCode('');
      setPaymentDate('');
      setValueDate(todayStr);
      setPostingDate(todayStr);
      setFlow('outflow');
    } catch (error) {
       toast.error(editingId ? "Failed to update transaction." : "Failed to commit transaction.");
    }
  };

  const handleEditClick = (txn) => {
    setEditingId(txn.id);
    setEntity(txn.entity || '');
    setSelectedType(txn.type || '');
    setSelectedSubtype(txn.subtype || '');
    setSelectedCategory(txn.category || '');
    setSelectedAccountCode(txn.target_account || '');
    setAmount(txn.amount || '');
    setFlow(txn.flow || 'outflow');
    setSourceAccount(txn.source_account || '');
    setPaymentStatus(txn.payment_status || 'Completed');
    setValueDate(txn.value_date || todayStr);
    setPostingDate(txn.posting_date || todayStr);
    setPaymentDate(txn.payment_date || '');
    setDescription(txn.description || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const handleCancelEdit = () => {
    setEditingId(null);
    setAmount('');
    setSourceAccount('');
    setDescription('');
    setEntity('');
    setSelectedType('');
    setSelectedSubtype('');
    setSelectedCategory('');
    setSelectedAccountCode('');
    setPaymentDate('');
    setValueDate(todayStr);
    setPostingDate(todayStr);
    setFlow('outflow');
  };

  return (
    <div className="w-full h-dvh bg-black flex justify-center overflow-hidden font-sans select-none text-stone-200">
      <div className="relative w-full max-w-7xl h-full mx-auto p-6 flex flex-col justify-between bg-stone-900 border-x border-amber-900/30">
        
        <header className="flex justify-between items-center pb-4 border-b border-amber-900/40">
          <div>
            <span className="text-xs font-bold tracking-widest text-amber-500 uppercase">Eldoria V2.0 Ledger</span>
            <h1 className="text-2xl font-serif tracking-wide text-stone-100">General Ledger Sandbox</h1>
          </div>
          <div className="text-right">
            <span className="block text-xs text-stone-400">System Status</span>
            <span className="text-xs bg-stone-950 border border-amber-900/50 px-2 py-1 rounded text-amber-400 font-mono">
              {user ? `User: ${user.email}` : 'Guest Mode'}
            </span>
          </div>
        </header>

        <div className="flex-1 my-4 overflow-y-auto space-y-6 pr-2 scrollbar-thin scrollbar-thumb-amber-900 scrollbar-track-stone-950">
          
          <section className="bg-stone-950 border-2 border-amber-900/50 rounded-lg p-5 shadow-2xl relative overflow-hidden">
            <h2 className="text-base font-serif text-amber-400 tracking-wider mb-4 flex items-center gap-2">
              {editingId ? 'Edit Transaction' : 'New Transaction'}
            </h2>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              
              <div className="bg-stone-900/50 p-3 rounded border border-amber-900/20">
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
                  <datalist id="entities-suggest">
                    {uniqueEntities.map((ent) => (
                      <option key={ent} value={ent} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-stone-900/40 p-3 rounded border border-amber-900/10">
                
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
                  <label className="text-[11px] font-bold uppercase tracking-wider text-stone-400">Target Account</label>
                  <select
                    value={selectedAccountCode}
                    onChange={handleAccountCodeChange}
                    className="bg-stone-950 border border-stone-800 focus:border-amber-500 outline-none p-2 rounded text-xs text-stone-100 transition font-mono"
                  >
                    <option value="">-- Select Target Account --</option>
                    {filteredAccounts.map((row) => (
                      <option key={row.code} value={row.code}>
                        {row.code} - {row.account_name}
                      </option>
                    ))}
                  </select>
                </div>

              </div>

              {selectedAccountCode && (
                <div className="bg-amber-950/20 border border-amber-900/40 px-3 py-1.5 rounded text-[11px] text-amber-400/90 font-mono flex flex-wrap gap-x-4">
                  <span><strong>COA Node:</strong> {selectedAccountCode}</span>
                  <span className="text-amber-900">|</span>
                  <span><strong>Resolved Type:</strong> {selectedType}</span>
                  <span className="text-amber-900">|</span>
                  <span><strong>Subtype:</strong> {selectedSubtype}</span>
                  <span className="text-amber-900">|</span>
                  <span><strong>Category:</strong> {selectedCategory}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                
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

                <div className="flex flex-col space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-stone-400">Flow</label>
                  <select
                    value={flow}
                    onChange={(e) => setFlow(e.target.value)}
                    disabled={selectedType === 'Receivable' || selectedType === 'Payable' || selectedType === 'Income' || selectedType === 'Expense'}
                    className="bg-stone-950 border border-stone-800 focus:border-amber-500 outline-none p-2 rounded text-xs text-stone-100 transition disabled:opacity-60"
                  >
                    <option value="outflow">Outflow</option>
                    <option value="inflow">Inflow</option>
                    <option value="neutral">Neutral</option>
                  </select>
                </div>

                <div className="flex flex-col space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-stone-400">Source Account</label>
                  <select
                    value={sourceAccount}
                    onChange={(e) => setSourceAccount(e.target.value)}
                    className="bg-stone-950 border border-stone-800 focus:border-amber-500 outline-none p-2 rounded text-xs text-stone-100 font-mono transition"
                  >
                    <option value="">-- Select Source Account --</option>
                    {assetSourceAccounts.map((row) => (
                      <option key={row.code} value={row.code}>
                        {row.code} - {row.account_name}
                      </option>
                    ))}
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                
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

              <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 flex flex-col space-y-1 w-full">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-stone-400">Description</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter description..."
                    className="bg-stone-950 border border-stone-800 focus:border-amber-500 outline-none p-2.5 rounded text-xs text-stone-100 transition"
                  />
                </div>
                
                <div className="flex gap-2 w-full md:w-auto">
                  <button
                    type="submit"
                    disabled={isLedgerLoading}
                    className="w-full md:w-auto px-6 py-2.5 bg-amber-600 hover:bg-amber-500 active:translate-y-px border border-amber-400/50 rounded text-stone-950 text-xs tracking-widest uppercase font-bold transition disabled:opacity-50"
                  >
                    {isLedgerLoading ? (editingId ? 'Updating...' : 'Adding...') : (editingId ? 'Update Transaction' : 'Add Transaction')}
                  </button>
                  
                  {editingId && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="w-full md:w-auto px-4 py-2.5 bg-stone-800 hover:bg-stone-700 active:translate-y-px border border-stone-600/50 rounded text-stone-300 text-xs tracking-widest uppercase font-bold transition"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>

            </form>
          </section>

          <section className="bg-stone-950 border-2 border-amber-900/50 rounded-lg p-5 shadow-2xl relative overflow-hidden flex flex-col h-80">
            
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

            <div className="flex-1 bg-stone-900/50 rounded border border-amber-900/20 overflow-y-auto p-3 font-mono text-xs">
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
                        <button onClick={() => handleEditClick(t)} className="text-[10px] bg-blue-900/50 hover:bg-blue-800 text-blue-200 px-2 py-0.5 rounded border border-blue-700/50 transition">
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

        </div>
      </div>
    </div>
  );
}