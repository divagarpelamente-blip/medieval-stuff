import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { useKingdomStore } from '../../store/useKingdomStore';

export default function RegisterTransactionForm({
  t,
  onClose,
  prefilledTemplate = null
}) {
  const email = useKingdomStore(state => state.email);
  const getTypes = useKingdomStore(state => state.getTypes);
  const getSubtypesByType = useKingdomStore(state => state.getSubtypesByType);
  const getCategoriesBySubtype = useKingdomStore(state => state.getCategoriesBySubtype);
  const getEntitiesByCategory = useKingdomStore(state => state.getEntitiesByCategory);
  const getAccountCode = useKingdomStore(state => state.getAccountCode);
  const registerTransactions = useKingdomStore(state => state.registerTransactions);
  const accountBalances = useKingdomStore(state => state.accountBalances) || [];
  const flatMatrix = useKingdomStore(state => state.flatMatrix) || [];
  const isLoading = useKingdomStore(state => state.isLoading);

  // Core Dropdown Options
  const types = getTypes() || ['Assets', 'Liabilities', 'Income', 'Expense'];
  const fromOptions = ['Pedro', 'Reni', 'Kingdom Treasury'];
  const statusOptions = ['Pending', 'Completed', 'Cancelled'];

  // Current Form State
  const [formData, setFormData] = useState({
    txClass: '',
    txSubClass: '',
    txCategory: '',
    txEntity: '',
    txFrom: email === 'divagarpelamente@gmail.com' ? 'Pedro' : '',
    txAmount: '',
    txDate: new Date().toISOString().split('T')[0],
    txStatus: 'Completed',
    txDescription: '',
    txFlow: 'outflow',
    txTargetAccount: '',
    txSourceAccount: '11010001' // Default checking
  });

  // Staging Session (The Cart)
  const [stagedTransactions, setStagedTransactions] = useState([]);
  
  // Track Live Balances for the Session
  const liveBalances = useMemo(() => {
    const balances = {};
    flatMatrix.forEach(row => {
      if (row.code && (row.code.startsWith('1') || row.code.startsWith('2'))) {
        balances[row.code] = 0;
      }
    });
    accountBalances.forEach(b => {
      if (b.account_code && b.account_code in balances) {
        balances[b.account_code] = Number(b.balance) || 0;
      }
    });
    return balances;
  }, [accountBalances, flatMatrix]);

  // Derived Options based on current selection
  const allowedSubtypes = useMemo(() => formData.txClass ? getSubtypesByType(formData.txClass) : [], [formData.txClass, getSubtypesByType]);
  const allowedCategories = useMemo(() => formData.txSubClass ? getCategoriesBySubtype(formData.txSubClass) : [], [formData.txSubClass, getCategoriesBySubtype]);
  const allowedEntities = useMemo(() => formData.txCategory ? getEntitiesByCategory(formData.txCategory) : [], [formData.txCategory, getEntitiesByCategory]);

  // Handle Prefill (from Edit or Template)
  useEffect(() => {
    if (prefilledTemplate) {
      setFormData({
        txClass: prefilledTemplate.transaction_type || '',
        txSubClass: prefilledTemplate.transaction_subtype || '',
        txCategory: prefilledTemplate.transaction_category || '',
        txEntity: prefilledTemplate.entity || '',
        txFrom: prefilledTemplate.from || (email === 'divagarpelamente@gmail.com' ? 'Pedro' : ''),
        txAmount: prefilledTemplate.amount || '',
        txDate: prefilledTemplate.posting_date || new Date().toISOString().split('T')[0],
        txStatus: prefilledTemplate.payment_status || 'Completed',
        txDescription: prefilledTemplate.description || '',
        txFlow: prefilledTemplate.flow || 'outflow',
        txTargetAccount: prefilledTemplate.target_account || '',
        txSourceAccount: prefilledTemplate.source_dest_bank || '11010001'
      });
    }
  }, [prefilledTemplate, email]);

  // Cascading Handlers
  const handleChange = (field, value) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value };
      
      // Handle Cascades
      if (field === 'txClass') {
        next.txSubClass = ''; next.txCategory = ''; next.txEntity = ''; next.txTargetAccount = '';
      } else if (field === 'txSubClass') {
        next.txCategory = ''; next.txEntity = ''; next.txTargetAccount = '';
      } else if (field === 'txCategory') {
        next.txEntity = ''; next.txTargetAccount = '';
      } else if (field === 'txEntity') {
        const code = getAccountCode(next.txClass, next.txSubClass, next.txCategory, value);
        next.txTargetAccount = code || '';
      }
      return next;
    });
  };

  // Stage a transaction to the cart
  const handleStageTransaction = (e) => {
    e.preventDefault();
    if (!formData.txClass || !formData.txSubClass || !formData.txCategory || !formData.txEntity || !formData.txAmount || !formData.txTargetAccount) {
      toast.error("Please complete all required fields and ensure a Target Account is resolved.");
      return;
    }

    const newTx = {
      ...formData,
      amountNum: Number(formData.txAmount),
      id: `staged-${Date.now()}`
    };

    setStagedTransactions(prev => [...prev, newTx]);
    
    // Clear form for next entry but keep common defaults
    setFormData(prev => ({
      ...prev,
      txAmount: '',
      txDescription: '',
      txEntity: '',
      txTargetAccount: ''
    }));
    toast.success("Transaction staged.");
  };

  // Remove from cart
  const handleRemoveStaged = (id) => {
    setStagedTransactions(prev => prev.filter(tx => tx.id !== id));
  };

  // Commit the Batch to Supabase
  const handleCommitBatch = async () => {
    if (stagedTransactions.length === 0) return;

    const payload = stagedTransactions.map(tx => ({
      transaction_type: tx.txClass,
      transaction_subtype: tx.txSubClass,
      transaction_category: tx.txCategory,
      entity: tx.txEntity,
      amount: tx.amountNum,
      from: tx.txFrom,
      posting_date: tx.txDate,
      value_date: tx.txDate,
      payment_status: tx.txStatus,
      description: tx.txDescription,
      target_account: tx.txTargetAccount,
      source_dest_bank: tx.txSourceAccount,
      flow: tx.txFlow,
      month: new Date(tx.txDate).toLocaleString('default', { month: 'long' }),
      year: new Date(tx.txDate).getFullYear(),
      quarter: 'Q' + (Math.floor(new Date(tx.txDate).getMonth() / 3) + 1)
    }));

    const res = await registerTransactions(null, payload);
    
    if (res?.success) {
      toast.success(`Successfully recorded ${payload.length} transactions!`);
      setStagedTransactions([]);
      if (onClose) onClose();
    } else {
      toast.error(`Failed to record batch: ${res?.error}`);
    }
  };

  // Calculate Cumulative Impacts
  const calculateImpacts = () => {
    const impacts = {};
    
    // Helper to log impact
    const addImpact = (code, amount, isIncrease) => {
      if (!code) return;
      if (!impacts[code]) {
        impacts[code] = {
          name: flatMatrix.find(r => r.code === code)?.account_name || code,
          startBalance: liveBalances[code] || 0,
          netImpact: 0
        };
      }
      impacts[code].netImpact += (isIncrease ? amount : -amount);
    };

    stagedTransactions.forEach(tx => {
      const amt = tx.amountNum;
      const src = tx.txSourceAccount;
      const tgt = tx.txTargetAccount;

      if (tx.txClass === 'Income') {
        addImpact(src, amt, true); // Source (Checking) increases
      } else if (tx.txClass === 'Expense') {
        addImpact(src, amt, false); // Source (Checking) decreases
      } else if (tx.txClass === 'Assets' || tx.txClass === 'Liabilities') {
         if (tx.txFlow === 'neutral') {
           addImpact(src, amt, false);
           addImpact(tgt, amt, true);
         } else if (tx.txFlow === 'inflow') {
           addImpact(src, amt, true);
           if(tx.txClass === 'Liabilities') addImpact(tgt, amt, true);
           else addImpact(tgt, amt, false);
         } else if (tx.txFlow === 'outflow') {
           addImpact(src, amt, false);
           if(tx.txClass === 'Liabilities') addImpact(tgt, amt, false);
           else addImpact(tgt, amt, true);
         }
      }
    });

    return Object.entries(impacts).map(([code, data]) => ({
      code,
      ...data,
      projected: data.startBalance + data.netImpact
    }));
  };

  const currentImpacts = calculateImpacts();

  return (
    <div className="flex flex-col gap-6 p-4 bg-[#faf4e5] border-2 border-[#8b4513]/30 rounded-xl max-h-[85vh] overflow-y-auto custom-scrollbar-subtle">
      
      {/* 1. The Entry Form */}
      <form onSubmit={handleStageTransaction} className="space-y-4">
        <h3 className="text-[#4b2c20] font-black uppercase text-sm border-b border-[#8b4513]/20 pb-2">Record Movement</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Omni-directional Dropdowns */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">Type</label>
            <select value={formData.txClass} onChange={(e) => handleChange('txClass', e.target.value)} required className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-md h-[38px] px-2 text-xs font-bold text-[#4b2c20]">
              <option value="" disabled>Select...</option>
              {types.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">Subtype</label>
            <select value={formData.txSubClass} onChange={(e) => handleChange('txSubClass', e.target.value)} required disabled={!formData.txClass} className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-md h-[38px] px-2 text-xs font-bold text-[#4b2c20] disabled:opacity-50">
              <option value="" disabled>Select...</option>
              {allowedSubtypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">Category</label>
            <select value={formData.txCategory} onChange={(e) => handleChange('txCategory', e.target.value)} required disabled={!formData.txSubClass} className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-md h-[38px] px-2 text-xs font-bold text-[#4b2c20] disabled:opacity-50">
              <option value="" disabled>Select...</option>
              {allowedCategories.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">Entity</label>
            <select value={formData.txEntity} onChange={(e) => handleChange('txEntity', e.target.value)} required disabled={!formData.txCategory} className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-md h-[38px] px-2 text-xs font-bold text-[#4b2c20] disabled:opacity-50">
              <option value="" disabled>Select...</option>
              {allowedEntities.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
           <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">Amount</label>
            <input type="number" step="0.01" min="0" value={formData.txAmount} onChange={(e) => handleChange('txAmount', e.target.value)} required className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-md h-[38px] px-2 text-xs font-bold text-[#4b2c20]"/>
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">Date</label>
            <input type="date" value={formData.txDate} onChange={(e) => handleChange('txDate', e.target.value)} required className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-md h-[38px] px-2 text-xs font-bold text-[#4b2c20]"/>
          </div>
          <div className="col-span-2">
            <label className="block text-[10px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">Description</label>
            <input type="text" value={formData.txDescription} onChange={(e) => handleChange('txDescription', e.target.value)} placeholder="Notes..." className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-md h-[38px] px-2 text-xs font-bold text-[#4b2c20]"/>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-2 bg-stone-100 p-3 rounded-lg border border-stone-200">
           <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-stone-600 mb-1">Target Account (Resolved)</label>
            <input type="text" readOnly value={formData.txTargetAccount} className="w-full bg-stone-200 border-none rounded-md h-[30px] px-2 text-xs font-mono font-bold text-stone-600 cursor-not-allowed"/>
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-stone-600 mb-1">Source Account</label>
            <input type="text" value={formData.txSourceAccount} onChange={(e) => handleChange('txSourceAccount', e.target.value)} className="w-full bg-white border border-stone-300 rounded-md h-[30px] px-2 text-xs font-mono font-bold text-stone-700"/>
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-stone-600 mb-1">Flow Direction</label>
            <select value={formData.txFlow} onChange={(e) => handleChange('txFlow', e.target.value)} className="w-full bg-white border border-stone-300 rounded-md h-[30px] px-2 text-xs font-bold text-stone-700">
              <option value="outflow">Outflow (-)</option>
              <option value="inflow">Inflow (+)</option>
              <option value="neutral">Neutral (0)</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-2">
           <button type="submit" className="px-6 py-2.5 bg-[#8b4513] text-[#ffd700] hover:bg-[#a0522d] border border-[#d4af37]/40 rounded-lg text-xs font-black uppercase tracking-widest shadow transition-all hover:scale-[1.02] active:scale-95">
             + Stage Transaction
           </button>
        </div>
      </form>

      {/* 2. Cumulative Staging Session (The Cart) */}
      {stagedTransactions.length > 0 && (
        <div className="mt-4 border-t-2 border-dashed border-[#8b4513]/20 pt-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex justify-between items-center mb-4">
             <h3 className="text-[#4b2c20] font-black uppercase text-sm flex items-center gap-2">
               🛒 Staged Batch <span className="bg-[#8b4513] text-[#faf4e5] px-2 py-0.5 rounded-full text-[10px]">{stagedTransactions.length}</span>
             </h3>
             <button onClick={handleCommitBatch} disabled={isLoading} className="px-6 py-2.5 bg-emerald-700 text-white hover:bg-emerald-600 border border-emerald-900 rounded-lg text-xs font-black uppercase tracking-widest shadow transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50">
               {isLoading ? 'Committing...' : 'Commit to Ledger'}
             </button>
          </div>

          <div className="space-y-4">
            {/* List of Staged Txs */}
            <div className="bg-white rounded-lg border border-stone-200 overflow-hidden">
               {stagedTransactions.map((tx, idx) => (
                 <div key={tx.id} className={`flex justify-between items-center p-3 text-xs ${idx !== stagedTransactions.length -1 ? 'border-b border-stone-100' : ''}`}>
                    <div>
                      <span className="font-bold text-stone-800">{tx.txEntity}</span>
                      <span className="text-stone-500 ml-2">({tx.txCategory})</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`font-mono font-bold ${tx.txClass === 'Income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {tx.txClass === 'Income' ? '+' : '-'}{tx.amountNum.toLocaleString()}g
                      </span>
                      <button onClick={() => handleRemoveStaged(tx.id)} className="text-stone-400 hover:text-rose-600">✕</button>
                    </div>
                 </div>
               ))}
            </div>

            {/* Impact Table */}
            <div className="bg-[#faf4e5]/50 rounded-lg p-3 border border-[#8b4513]/10">
               <h4 className="text-[10px] font-black uppercase tracking-wider text-[#5d4037]/70 mb-2">Projected Balance Impact</h4>
               <div className="w-full text-left text-[11px]">
                 <div className="grid grid-cols-4 font-bold text-stone-500 border-b border-stone-200 pb-1 mb-1">
                   <div className="col-span-1">Account</div>
                   <div className="text-right">Starting</div>
                   <div className="text-right">Net Impact</div>
                   <div className="text-right">Projected</div>
                 </div>
                 {currentImpacts.map(imp => (
                   <div key={imp.code} className="grid grid-cols-4 py-1 text-stone-700 font-mono">
                     <div className="col-span-1 truncate pr-2 font-sans font-medium" title={imp.name}>{imp.name}</div>
                     <div className="text-right">{imp.startBalance.toLocaleString()}</div>
                     <div className={`text-right font-bold ${imp.netImpact > 0 ? 'text-emerald-600' : imp.netImpact < 0 ? 'text-rose-600' : 'text-stone-400'}`}>
                       {imp.netImpact > 0 ? '+' : ''}{imp.netImpact.toLocaleString()}
                     </div>
                     <div className="text-right font-bold">{imp.projected.toLocaleString()}</div>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}