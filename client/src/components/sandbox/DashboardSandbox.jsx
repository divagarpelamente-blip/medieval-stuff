import React, { useState, useEffect, useMemo } from 'react';
import { useKingdomStore } from '../../store/useKingdomStore';
import { 
  Coins, 
  Shield, 
  Sparkles, 
  Trash2, 
  Edit3, 
  Plus, 
  X, 
  Search, 
  TrendingUp, 
  TrendingDown, 
  Layers, 
  ArrowRightLeft, 
  BookOpen, 
  User, 
  AlertCircle 
} from 'lucide-react';

export default function DashboardSandbox() {
  // =========================================================================
  // 1. ZUSTAND STORE HOOKS & SYNCHRONIZATION
  // =========================================================================
  const {
    flatMatrix,
    transactions,
    fetchFlatMatrix,
    fetchTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    gold,
    xp,
    level,
    gems,
    role,
    isLedgerLoading,
    isLoading
  } = useKingdomStore();

  useEffect(() => {
    fetchFlatMatrix();
    fetchTransactions();
  }, [fetchFlatMatrix, fetchTransactions]);

  // =========================================================================
  // 2. COMPONENT STATE MANAGEMENT
  // =========================================================================
  const [activeTab, setActiveTab] = useState('ledger'); // 'ledger' | 'balances' | 'matrix'
  const [editingTransaction, setEditingTransaction] = useState(null);
  
  // Transaction Form States
  const [targetAccount, setTargetAccount] = useState('');
  const [sourceAccount, setSourceAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [flow, setFlow] = useState('inflow');
  const [type, setType] = useState('Income');
  const [paymentStatus, setPaymentStatus] = useState('Completed');
  const [description, setDescription] = useState('');
  const [valueDate, setValueDate] = useState(new Date().toISOString().split('T')[0]);
  const [postingDate, setPostingDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Filtering & Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterAccount, setFilterAccount] = useState('all');

  // =========================================================================
  // 3. AUTO-POPULATION & FLOW LOCKING LOGIC
  // =========================================================================
  // Watch targetAccount changes to auto-update corresponding fields from Flat Matrix
  useEffect(() => {
    if (!targetAccount || flatMatrix.length === 0) return;
    
    const accountDetails = flatMatrix.find(acc => acc.code === targetAccount);
    if (accountDetails) {
      setType(accountDetails.type);
      
      // Strict rule: Lock flow based on type
      if (accountDetails.type === 'Income') {
        setFlow('inflow');
      } else if (accountDetails.type === 'Expense' || accountDetails.type === 'Expenses') {
        setFlow('outflow');
      } else if (accountDetails.type === 'Assets') {
        setFlow('inflow'); // logical default for asset accounts
      } else if (accountDetails.type === 'Liabilities') {
        setFlow('outflow'); // logical default for paying liabilities
      }
    }
  }, [targetAccount, flatMatrix]);

  // If we are editing, populate form with values
  const handleEditClick = (tx) => {
    setEditingTransaction(tx);
    setTargetAccount(tx.target_account || '');
    setSourceAccount(tx.source_account || '');
    setAmount(tx.amount.toString());
    setFlow(tx.flow || 'inflow');
    setType(tx.type || 'Income');
    setPaymentStatus(tx.payment_status || 'Completed');
    setDescription(tx.description || '');
    setValueDate(tx.value_date ? tx.value_date.split('T')[0] : new Date().toISOString().split('T')[0]);
    setPostingDate(tx.posting_date ? tx.posting_date.split('T')[0] : new Date().toISOString().split('T')[0]);
  };

  const handleClearForm = () => {
    setEditingTransaction(null);
    setTargetAccount('');
    setSourceAccount('');
    setAmount('');
    setFlow('inflow');
    setType('Income');
    setPaymentStatus('Completed');
    setDescription('');
    setValueDate(new Date().toISOString().split('T')[0]);
    setPostingDate(new Date().toISOString().split('T')[0]);
  };

  // =========================================================================
  // 4. METRICS & DOUBLE-ENTRY ARITHMETIC CORE (SINGLE-PASS REDUCER)
  // =========================================================================
  const computedBalances = useMemo(() => {
    const balances = {};
    
    // Seed all account codes from the flat Matrix with 0
    flatMatrix.forEach(acc => {
      balances[acc.code] = 0;
    });

    // Run chronologically sorted (or arbitrary order) single pass to evaluate balances
    const sortedTx = [...transactions].sort((a, b) => new Date(a.posting_date) - new Date(b.posting_date));
    
    sortedTx.forEach(tx => {
      const amt = Number(tx.amount) || 0;
      const target = tx.target_account;
      const source = tx.source_account;
      const txFlow = tx.flow;
      const txType = tx.type;

      if (target) {
        if (balances[target] === undefined) balances[target] = 0;
        
        if (txFlow === 'inflow') {
          balances[target] += amt;
        } else if (txFlow === 'outflow') {
          balances[target] -= amt;
        } else if (txFlow === 'neutral' && source) {
          // Transfer operation: subtract from source, add to target
          if (balances[source] === undefined) balances[source] = 0;
          balances[source] -= amt;
          balances[target] += amt;
        }

        // Special operational override checking for Debt Payments & Loans with Source Accounts
        if (txType === 'Liabilities' && txFlow === 'outflow' && source) {
          if (balances[source] === undefined) balances[source] = 0;
          balances[source] -= amt; 
        }
        if (txType === 'Liabilities' && txFlow === 'inflow' && source) {
          if (balances[source] === undefined) balances[source] = 0;
          balances[source] += amt;
        }
      }
    });

    return balances;
  }, [flatMatrix, transactions]);

  // Derived financial aggregates
  const financialTotals = useMemo(() => {
    let totalAssets = 0;
    let totalLiabilities = 0;
    let netVaultCash = 0;

    flatMatrix.forEach(acc => {
      const currentBalance = computedBalances[acc.code] || 0;
      
      // Prefix rules validation:
      if (acc.code.startsWith('1')) {
        totalAssets += currentBalance;
        // 1101xxxx (Checking), 1102xxxx (Savings/Vaults), 1103xxxx (Cash)
        if (acc.code.startsWith('1101') || acc.code.startsWith('1102') || acc.code.startsWith('1103')) {
          netVaultCash += currentBalance;
        }
      } else if (acc.code.startsWith('2')) {
        totalLiabilities += currentBalance;
      }
    });

    const netWorth = totalAssets - totalLiabilities;

    return {
      totalAssets,
      totalLiabilities,
      netVaultCash,
      netWorth
    };
  }, [flatMatrix, computedBalances]);

  // =========================================================================
  // 5. TRANSACTION MUTATION HANDLERS
  // =========================================================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!targetAccount) return;
    if (!amount || Number(amount) <= 0) return;

    const accountDetails = flatMatrix.find(acc => acc.code === targetAccount);
    const payload = {
      value_date: valueDate,
      posting_date: postingDate,
      payment_date: paymentStatus === 'Completed' ? postingDate : null,
      amount: Number(amount),
      target_account: targetAccount,
      source_account: sourceAccount || null,
      flow: flow,
      payment_status: paymentStatus,
      type: accountDetails ? accountDetails.type : type,
      subtype: accountDetails ? accountDetails.subtype : null,
      category: accountDetails ? accountDetails.category : null,
      entity: accountDetails ? accountDetails.entity : null,
      description: description,
      origin: 'Sandbox Workspace'
    };

    if (editingTransaction) {
      await updateTransaction(editingTransaction.id, payload);
    } else {
      await addTransaction(payload);
    }
    
    handleClearForm();
    fetchTransactions();
  };

  const handleDelete = async (id) => {
    if (confirm('Are you certain you wish to purge this transaction record from the ledger?')) {
      await deleteTransaction(id);
      fetchTransactions();
    }
  };

  // =========================================================================
  // 6. FILTER & SEARCH EVALUATION
  // =========================================================================
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const matchesSearch = 
        tx.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.target_account?.includes(searchQuery) ||
        tx.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.entity?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = filterType === 'all' || tx.type === filterType;
      const matchesAccount = filterAccount === 'all' || tx.target_account === filterAccount;

      return matchesSearch && matchesType && matchesAccount;
    });
  }, [transactions, searchQuery, filterType, filterAccount]);

  return (
    <div className="w-full h-dvh bg-black flex justify-center items-center overflow-hidden font-sans">
      <div className="relative w-full max-w-7xl h-full mx-auto p-4 flex flex-col bg-stone-950 text-stone-100 overflow-hidden">
        
        {/* ================= HEADER HUD ================= */}
        <header className="shrink-0 bg-stone-900 border-2 border-amber-900/50 rounded-lg p-3 mb-4 shadow-lg flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-950 border border-amber-500/30 rounded-md">
              <BookOpen className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-amber-400 font-serif tracking-widest uppercase">Eldoria V2.0</h1>
              <p className="text-[10px] text-stone-400 font-mono">CORE TREASURY LEDGER ENGINE</p>
            </div>
          </div>

          {/* Gamified Profile Indicators */}
          <div className="flex items-center gap-4 bg-stone-950/80 px-4 py-1.5 border border-amber-900/30 rounded-md">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-amber-500" />
              <div className="text-xs">
                <span className="text-stone-500 text-[10px] uppercase block leading-none">Ruler Status</span>
                <span className="text-stone-300 font-serif font-semibold">{role || 'Lord'}</span>
              </div>
            </div>

            <div className="h-6 w-px bg-amber-900/20" />

            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
              <div className="text-xs">
                <span className="text-stone-500 text-[10px] uppercase block leading-none">Level {level || 1}</span>
                <span className="text-stone-300 font-mono font-semibold">{xp || 0} XP</span>
              </div>
            </div>

            <div className="h-6 w-px bg-amber-900/20" />

            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-yellow-500" />
              <div className="text-xs">
                <span className="text-stone-500 text-[10px] uppercase block leading-none">Treasury Gold</span>
                <span className="text-yellow-400 font-mono font-semibold">{gold?.toLocaleString() || 0}g</span>
              </div>
            </div>
          </div>
        </header>

        {/* ================= REAL-TIME ANALYTICAL METRICS ================= */}
        <section className="shrink-0 grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="bg-stone-900/60 border border-amber-900/30 p-3 rounded-lg flex flex-col justify-between">
            <span className="text-[10px] text-stone-400 uppercase tracking-wider">Net Vault Cash (HUD Gold)</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-lg font-mono font-bold text-yellow-500">
                {financialTotals.netVaultCash.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-xs text-yellow-600">g</span>
            </div>
            <span className="text-[8px] text-stone-500 font-mono mt-1">Accounts 1101 / 1102 / 1103</span>
          </div>

          <div className="bg-stone-900/60 border border-amber-900/30 p-3 rounded-lg flex flex-col justify-between">
            <span className="text-[10px] text-stone-400 uppercase tracking-wider">Net Worth Balance</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className={`text-lg font-mono font-bold ${financialTotals.netWorth >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {financialTotals.netWorth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-xs text-stone-500">g</span>
            </div>
            <span className="text-[8px] text-stone-500 font-mono mt-1">Assets minus Liabilities</span>
          </div>

          <div className="bg-stone-900/60 border border-amber-900/30 p-3 rounded-lg flex flex-col justify-between">
            <span className="text-[10px] text-stone-400 uppercase tracking-wider">Sum of Kingdom Assets</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-lg font-mono font-bold text-stone-200">
                {financialTotals.totalAssets.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-xs text-stone-500">g</span>
            </div>
            <span className="text-[8px] text-stone-500 font-mono mt-1">All 1xxxxxxx Account codes</span>
          </div>

          <div className="bg-stone-900/60 border border-amber-900/30 p-3 rounded-lg flex flex-col justify-between">
            <span className="text-[10px] text-stone-400 uppercase tracking-wider">Total Active Liabilities</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-lg font-mono font-bold text-rose-400">
                {financialTotals.totalLiabilities.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-xs text-rose-500">g</span>
            </div>
            <span className="text-[8px] text-stone-500 font-mono mt-1">All 2xxxxxxx Account codes</span>
          </div>
        </section>

        {/* ================= WORKSPACE PANELS GRID ================= */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0">
          
          {/* LEFT: DOUBLE-ENTRY SCRIBE BOARD (FORM) */}
          <section className="lg:col-span-4 bg-stone-900/80 border border-amber-900/40 rounded-lg p-4 flex flex-col min-h-0 overflow-y-auto scrollbar-thin scrollbar-thumb-amber-900 scrollbar-track-stone-950">
            <div className="flex items-center justify-between border-b border-amber-900/30 pb-2 mb-4">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-bold text-amber-400 font-serif tracking-wider uppercase">
                  {editingTransaction ? 'Amend Transaction Scroll' : 'Scribe New Transaction'}
                </h3>
              </div>
              {editingTransaction && (
                <button 
                  onClick={handleClearForm}
                  className="p-1 hover:bg-stone-800 rounded text-stone-400 hover:text-rose-400 transition"
                  title="Abort edit state"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              
              {/* Account Dropdown Source Selection */}
              <div>
                <label className="block text-[10px] uppercase text-stone-400 tracking-wider mb-1">Target Account *</label>
                <select
                  required
                  value={targetAccount}
                  onChange={(e) => setTargetAccount(e.target.value)}
                  className="w-full bg-stone-950 border border-amber-900/40 rounded px-2.5 py-1.5 font-mono text-stone-200 focus:outline-none focus:border-amber-500 transition"
                >
                  <option value="" className="text-stone-500">-- Choose Chart of Accounts Row --</option>
                  {flatMatrix.map(acc => (
                    <option key={acc.code} value={acc.code} className="text-stone-200">
                      {acc.code} - {acc.account_name} [{acc.type}]
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount Display */}
              <div>
                <label className="block text-[10px] uppercase text-stone-400 tracking-wider mb-1">Amount (Gold Coins) *</label>
                <div className="relative">
                  <input
                    required
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-stone-950 border border-amber-900/40 rounded pl-8 pr-3 py-1.5 font-mono text-stone-200 focus:outline-none focus:border-amber-500 transition"
                  />
                  <Coins className="w-3.5 h-3.5 text-amber-500 absolute left-2.5 top-2.5" />
                </div>
              </div>

              {/* Dynamic Read-only Info derived from matrix */}
              {targetAccount && (
                <div className="bg-stone-950/90 border border-amber-900/20 p-2.5 rounded text-[11px] space-y-1 font-mono">
                  <div className="flex justify-between">
                    <span className="text-stone-500">Core Category:</span>
                    <span className="text-stone-300">{type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Taxonomy Class:</span>
                    <span className="text-stone-300">
                      {flatMatrix.find(a => a.code === targetAccount)?.subtype || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Executing Entity:</span>
                    <span className="text-stone-300">
                      {flatMatrix.find(a => a.code === targetAccount)?.entity || 'N/A'}
                    </span>
                  </div>
                </div>
              )}

              {/* Dual Column: Flow & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase text-stone-400 tracking-wider mb-1">Transaction Flow</label>
                  <select
                    value={flow}
                    onChange={(e) => setFlow(e.target.value)}
                    disabled={type === 'Income' || type === 'Expense' || type === 'Expenses'}
                    className="w-full bg-stone-950 border border-amber-900/40 rounded px-2 py-1.5 font-mono text-stone-200 focus:outline-none disabled:opacity-50 disabled:bg-stone-900"
                  >
                    <option value="inflow">Inflow</option>
                    <option value="outflow">Outflow</option>
                    <option value="neutral">Neutral (Transfer)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase text-stone-400 tracking-wider mb-1">Settlement Status</label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value)}
                    className="w-full bg-stone-950 border border-amber-900/40 rounded px-2 py-1.5 font-mono text-stone-200 focus:outline-none"
                  >
                    <option value="Completed">Completed</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
              </div>

              {/* Conditional Field: Source / Dest bank account for double entry transfers or liabilities tracking */}
              {(flow === 'neutral' || type === 'Liabilities') && (
                <div>
                  <label className="block text-[10px] uppercase text-stone-400 tracking-wider mb-1">
                    {flow === 'neutral' ? 'Transfer Source Account *' : 'Complementary Asset Account'}
                  </label>
                  <select
                    required={flow === 'neutral'}
                    value={sourceAccount}
                    onChange={(e) => setSourceAccount(e.target.value)}
                    className="w-full bg-stone-950 border border-amber-900/40 rounded px-2.5 py-1.5 font-mono text-stone-200 focus:outline-none focus:border-amber-500 transition"
                  >
                    <option value="">-- Choose Account Code --</option>
                    {flatMatrix
                      .filter(acc => acc.code !== targetAccount)
                      .map(acc => (
                        <option key={acc.code} value={acc.code}>
                          {acc.code} - {acc.account_name}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase text-stone-400 tracking-wider mb-1">Value Date</label>
                  <input
                    type="date"
                    value={valueDate}
                    onChange={(e) => setValueDate(e.target.value)}
                    className="w-full bg-stone-950 border border-amber-900/40 rounded px-2 py-1 text-stone-200 font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-stone-400 tracking-wider mb-1">Posting Date</label>
                  <input
                    type="date"
                    value={postingDate}
                    onChange={(e) => setPostingDate(e.target.value)}
                    className="w-full bg-stone-950 border border-amber-900/40 rounded px-2 py-1 text-stone-200 font-mono focus:outline-none"
                  />
                </div>
              </div>

              {/* Description Scroll */}
              <div>
                <label className="block text-[10px] uppercase text-stone-400 tracking-wider mb-1">Scroll Description</label>
                <textarea
                  rows="2"
                  placeholder="Record narrative details of this coin transfer..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-stone-950 border border-amber-900/40 rounded p-2 text-stone-200 focus:outline-none focus:border-amber-500 transition"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-amber-900 hover:bg-amber-800 border-2 border-amber-700/50 text-amber-100 uppercase tracking-widest font-serif font-bold py-2 rounded shadow-md hover:scale-[1.01] transition-all duration-200 flex items-center justify-center gap-2 mt-4"
              >
                {editingTransaction ? (
                  <>
                    <Edit3 className="w-4 h-4 text-yellow-400" />
                    <span>Commit Amendment</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 text-yellow-400" />
                    <span>Seal Ledger Record</span>
                  </>
                )}
              </button>
            </form>
          </section>

          {/* RIGHT: LEDGER TABLE & BALANCE ANALYTICS PANEL */}
          <section className="lg:col-span-8 bg-stone-900/50 border border-amber-900/40 rounded-lg flex flex-col min-h-0">
            
            {/* Horizontal Submenu Controllers */}
            <div className="shrink-0 bg-stone-900/80 border-b border-amber-900/30 px-4 py-2 flex items-center justify-between flex-wrap gap-2">
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('ledger')}
                  className={`px-3 py-1 text-[11px] font-bold font-serif uppercase tracking-wider border rounded transition ${
                    activeTab === 'ledger'
                      ? 'border-amber-500 bg-amber-950/40 text-amber-400'
                      : 'border-transparent text-stone-400 hover:text-stone-200'
                  }`}
                >
                  General Ledger
                </button>
                <button
                  onClick={() => setActiveTab('balances')}
                  className={`px-3 py-1 text-[11px] font-bold font-serif uppercase tracking-wider border rounded transition ${
                    activeTab === 'balances'
                      ? 'border-amber-500 bg-amber-950/40 text-amber-400'
                      : 'border-transparent text-stone-400 hover:text-stone-200'
                  }`}
                >
                  Vault Matrix
                </button>
              </div>

              <div className="text-[10px] font-mono text-amber-500/80 bg-stone-950/80 px-2 py-0.5 rounded border border-amber-950">
                Synced Rows: {transactions.length} | Matrix Accounts: {flatMatrix.length}
              </div>
            </div>

            {/* Sub-Panel: General Ledger Views */}
            {activeTab === 'ledger' && (
              <div className="flex-1 flex flex-col min-h-0">
                {/* Search / Filters Controls */}
                <div className="shrink-0 p-3 bg-stone-950/60 border-b border-amber-900/20 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="relative w-full sm:max-w-xs">
                    <input
                      type="text"
                      placeholder="Filter ledger scrolls..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-stone-900 border border-amber-900/30 rounded pl-8 pr-3 py-1 font-mono text-stone-300 focus:outline-none"
                    />
                    <Search className="w-3.5 h-3.5 text-stone-500 absolute left-2.5 top-2" />
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="bg-stone-900 border border-amber-900/30 rounded px-2 py-1 text-stone-300"
                    >
                      <option value="all">All Types</option>
                      <option value="Assets">Assets</option>
                      <option value="Liabilities">Liabilities</option>
                      <option value="Income">Income</option>
                      <option value="Expense">Expense</option>
                    </select>

                    <select
                      value={filterAccount}
                      onChange={(e) => setFilterAccount(e.target.value)}
                      className="bg-stone-900 border border-amber-900/30 rounded px-2 py-1 text-stone-300 max-w-[150px]"
                    >
                      <option value="all">All Accounts</option>
                      {flatMatrix.map(acc => (
                        <option key={acc.code} value={acc.code}>
                          {acc.code} - {acc.account_name}
                        </option>
                      ))}
                    </select>

                    {(searchQuery || filterType !== 'all' || filterAccount !== 'all') && (
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setFilterType('all');
                          setFilterAccount('all');
                        }}
                        className="p-1 bg-stone-850 hover:bg-stone-800 rounded text-stone-400"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>

                {/* Ledger Listing */}
                <div className="flex-1 overflow-y-auto min-h-0 scrollbar-thin scrollbar-thumb-amber-900 scrollbar-track-stone-950">
                  {isLedgerLoading ? (
                    <div className="p-8 text-center text-stone-500 font-serif">
                      Querying transactional database scrolls...
                    </div>
                  ) : filteredTransactions.length === 0 ? (
                    <div className="p-8 text-center text-stone-500 flex flex-col items-center gap-2">
                      <AlertCircle className="w-6 h-6 text-stone-600" />
                      <span className="font-serif">No transactions match current filters.</span>
                    </div>
                  ) : (
                    <div className="min-w-full inline-block align-middle">
                      <table className="min-w-full text-xs text-left">
                        <thead className="bg-stone-900/80 sticky top-0 border-b border-amber-900/20 text-stone-400 uppercase font-serif tracking-wider text-[10px]">
                          <tr>
                            <th className="px-4 py-2">Posting Date</th>
                            <th className="px-4 py-2">Target & Details</th>
                            <th className="px-4 py-2">Flow / Type</th>
                            <th className="px-4 py-2 text-right">Amount</th>
                            <th className="px-4 py-2 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-amber-900/10 font-mono">
                          {filteredTransactions.map((tx) => {
                            const isExpense = tx.flow === 'outflow' || tx.type === 'Expense';
                            const isNeutral = tx.flow === 'neutral';
                            
                            return (
                              <tr key={tx.id} className="hover:bg-stone-900/40 transition">
                                <td className="px-4 py-2 text-stone-400 whitespace-nowrap">
                                  {tx.posting_date ? tx.posting_date.split('T')[0] : 'N/A'}
                                </td>
                                <td className="px-4 py-2">
                                  <div className="text-stone-200 font-semibold">{tx.target_account}</div>
                                  <div className="text-[10px] text-stone-400 flex items-center gap-1">
                                    <span>{tx.entity}</span>
                                    {tx.category && <span className="text-stone-600">({tx.category})</span>}
                                  </div>
                                  {tx.description && (
                                    <div className="text-[10px] text-amber-500/80 max-w-xs truncate" title={tx.description}>
                                      {tx.description}
                                    </div>
                                  )}
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap">
                                  <div className="flex items-center gap-1.5">
                                    {isNeutral ? (
                                      <span className="text-stone-400 bg-stone-800 px-1.5 py-0.5 rounded text-[9px]">Neutral</span>
                                    ) : isExpense ? (
                                      <span className="text-rose-400 bg-rose-950/30 px-1.5 py-0.5 rounded text-[9px] flex items-center gap-0.5">
                                        <TrendingDown className="w-2.5 h-2.5" /> Out
                                      </span>
                                    ) : (
                                      <span className="text-emerald-400 bg-emerald-950/30 px-1.5 py-0.5 rounded text-[9px] flex items-center gap-0.5">
                                        <TrendingUp className="w-2.5 h-2.5" /> In
                                      </span>
                                    )}
                                    <span className="text-stone-500 text-[10px]">{tx.type}</span>
                                  </div>
                                  {tx.source_account && (
                                    <div className="text-[9px] text-stone-500 flex items-center gap-1 mt-0.5">
                                      <ArrowRightLeft className="w-2.5 h-2.5 text-amber-800" />
                                      <span>Source: {tx.source_account}</span>
                                    </div>
                                  )}
                                </td>
                                <td className={`px-4 py-2 text-right font-bold whitespace-nowrap ${isNeutral ? 'text-stone-400' : isExpense ? 'text-rose-400' : 'text-emerald-400'}`}>
                                  {isExpense ? '-' : isNeutral ? '±' : '+'}{Number(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}g
                                </td>
                                <td className="px-4 py-2 text-center">
                                  <div className="flex items-center justify-center gap-2">
                                    <button
                                      onClick={() => handleEditClick(tx)}
                                      className="p-1 hover:bg-stone-850 rounded text-amber-500 hover:text-amber-400 transition"
                                      title="Edit Record"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDelete(tx.id)}
                                      className="p-1 hover:bg-stone-850 rounded text-rose-500 hover:text-rose-400 transition"
                                      title="Delete Record"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Sub-Panel: Account Balances Map */}
            {activeTab === 'balances' && (
              <div className="flex-1 flex flex-col min-h-0 p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-amber-900 scrollbar-track-stone-950">
                <h4 className="text-xs font-serif text-amber-400 tracking-wider uppercase border-b border-amber-900/20 pb-1.5 mb-4">
                  Account Ledger Balance Ledger Matrix
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Assets Stack */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-serif text-amber-500 block uppercase tracking-wider">Kingdom Assets (1xxxxxxx)</span>
                    <div className="space-y-1.5">
                      {flatMatrix.filter(a => a.code.startsWith('1')).map(acc => {
                        const bal = computedBalances[acc.code] || 0;
                        return (
                          <div key={acc.code} className="bg-stone-950 border border-amber-900/10 p-2 rounded flex items-center justify-between font-mono text-xs">
                            <div>
                              <div className="text-stone-300 font-semibold">{acc.code}</div>
                              <div className="text-[10px] text-stone-500 truncate max-w-[200px]">{acc.account_name}</div>
                            </div>
                            <div className="text-right">
                              <span className={`font-bold ${bal >= 0 ? 'text-emerald-500' : 'text-rose-400'}`}>
                                {bal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}g
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Liabilities Stack */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-serif text-rose-400 block uppercase tracking-wider">Active Liabilities (2xxxxxxx)</span>
                    <div className="space-y-1.5">
                      {flatMatrix.filter(a => a.code.startsWith('2')).map(acc => {
                        const bal = computedBalances[acc.code] || 0;
                        return (
                          <div key={acc.code} className="bg-stone-950 border border-amber-900/10 p-2 rounded flex items-center justify-between font-mono text-xs">
                            <div>
                              <div className="text-stone-300 font-semibold">{acc.code}</div>
                              <div className="text-[10px] text-stone-500 truncate max-w-[200px]">{acc.account_name}</div>
                            </div>
                            <div className="text-right">
                              <span className="font-bold text-rose-400">
                                {bal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}g
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}