import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, BookOpen, Plus, X, Save, AlertCircle, LoaderCircle } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { MONTHS, TRANSACTION_TYPES, PAYMENT_METHODS, RECORD_STATUSES, QUEST_TYPES, toDbQuestType } from '../../utils/constants';
import RecordsTable from './RecordsTable';
import parchmentBg from '../../assets/Parchment_menu_1.PNG';
import { toast } from 'react-hot-toast';

const TransactionsView = ({ onBack, userId, profile, onRefresh }) => {
  const [activeTab, setActiveTab] = useState('new'); // 'new' or 'view'
  const [loading, setLoading] = useState(false);
  const [entities, setEntities] = useState([]);
  const [accounts, setAccounts] = useState([]);
  
  const parentRef = useRef(null);
  const contentRef = useRef(null);
  const scrollRef = useRef(null);

  const [formData, setFormData] = useState({
    from_source: '',
    month: new Date().toLocaleString('default', { month: 'long' }),
    year: new Date().getFullYear().toString(),
    entity: '',
    account_id: '',
    limit_amount: 0,
    income: 0,
    expense: 0,
    receipt: 0,
    payment: 0,
    interests: 0,
    late_fee_interests: 0,
    penalties: 0,
    tax: 0,
    description: '',
    paid_with: 'Debit',
    transaction_type: 'Income',
    status: 'Paid',
    losses: 0,
    quest_type: 'Production',
    flow_type: 'Inflow'
  });

  const [txTypes, setTxTypes] = useState(TRANSACTION_TYPES);
  const [qTypes, setQTypes] = useState(QUEST_TYPES);
  const [flowTypes, setFlowTypes] = useState(['Inflow', 'Outflow', 'Investment', 'Savings']);
  const [responsibleUsers, setResponsibleUsers] = useState(['King', 'Queen', 'Scribe', 'Merchant', 'Guard']);

  useEffect(() => {
    try {
      const savedTx = localStorage.getItem('medieval_transaction_types');
      if (savedTx) setTxTypes(JSON.parse(savedTx));
      const savedQuests = localStorage.getItem('medieval_quest_types');
      if (savedQuests) setQTypes(JSON.parse(savedQuests));
      const savedFlows = localStorage.getItem('medieval_flow_types');
      if (savedFlows) setFlowTypes(JSON.parse(savedFlows));
      const savedUsers = localStorage.getItem('medieval_responsible_users');
      if (savedUsers) setResponsibleUsers(JSON.parse(savedUsers));
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    if (userId) {
      fetchEntities();
      fetchAccounts();
    }
  }, [userId]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onBack();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onBack]);

  useEffect(() => {
    const resetScroll = () => {
      if (parentRef.current) parentRef.current.scrollTop = 0;
      if (contentRef.current) contentRef.current.scrollTop = 0;
      if (scrollRef.current) scrollRef.current.scrollTop = 0;
      window.scrollTo(0, 0);
    };

    // Reset immediately when tab changes or mounts
    resetScroll();

    // Reset after a tiny delay to ensure browser rendering is complete
    const timer = setTimeout(resetScroll, 50);

    const handleFocusIn = () => {
      setTimeout(resetScroll, 0);
    };

    window.addEventListener('focusin', handleFocusIn);
    window.addEventListener('resize', resetScroll);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('focusin', handleFocusIn);
      window.removeEventListener('resize', resetScroll);
    };
  }, [activeTab]);

  const handleParentScroll = (e) => {
    if (parentRef.current) {
      parentRef.current.scrollTop = 0;
    }
  };

  const handleContentScroll = (e) => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  };

  const fetchEntities = async () => {
    const { data } = await supabase
      .from('treasury_entities')
      .select('name')
      .eq('profile_id', userId)
      .order('name', { ascending: true });
    setEntities(data || []);
  };

  const fetchAccounts = async () => {
    const { data } = await supabase
      .from('treasury_accounts')
      .select('id, name')
      .eq('profile_id', userId);
    setAccounts(data || []);
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => {
      const next = {
        ...prev,
        [name]: type === 'number' ? parseFloat(value) || 0 : value
      };
      if (name === 'entity' && value) {
        try {
          const savedMappings = localStorage.getItem('medieval_entity_quest_types');
          if (savedMappings) {
            const mappings = JSON.parse(savedMappings);
            if (mappings[value]) {
              next.quest_type = mappings[value];
            }
          }
        } catch (err) {
          console.error(err);
        }
      }
      return next;
    });
  };

  const resetForm = () => {
    setFormData({
      from_source: '',
      month: new Date().toLocaleString('default', { month: 'long' }),
      year: new Date().getFullYear().toString(),
      entity: '',
      account_id: '',
      limit_amount: 0,
      income: 0,
      expense: 0,
      receipt: 0,
      payment: 0,
      interests: 0,
      late_fee_interests: 0,
      penalties: 0,
      tax: 0,
      description: '',
      paid_with: 'Debit',
      transaction_type: 'Income',
      status: 'Paid',
      losses: 0,
      quest_type: 'Production',
      flow_type: 'Inflow'
    });
  };

  const getOrCreateAccountByName = async (name, userId) => {
    if (!name) return null;
    const { data: existing } = await supabase
      .from('treasury_accounts')
      .select('id')
      .eq('profile_id', userId)
      .eq('name', name)
      .limit(1);
      
    if (existing && existing.length > 0) {
      return existing[0].id;
    }
    
    const { data: created, error } = await supabase
      .from('treasury_accounts')
      .insert([{
        name: name,
        type: 'Debt',
        initial_debt: 0,
        balance: 0,
        profile_id: userId
      }])
      .select('id')
      .single();
      
    if (error) {
      console.error('Error creating account:', error);
      return null;
    }
    return created.id;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId) {
      toast.error('User identity not found. Please log in.');
      return;
    }
    setLoading(true);

    try {
      // Raw individual amounts — each maps to its own semantic column
      const expenseAmount  = Number(formData.expense)  || 0;
      const incomeAmount   = Number(formData.income)   || 0;
      const receiptAmount  = Number(formData.receipt)  || 0;
      const paymentAmount  = Number(formData.payment)  || 0;

      // Derived net columns shown in the table
      const incomeExpense   = incomeAmount  - expenseAmount;   // Expense/Income column
      const receiptPayment  = receiptAmount - paymentAmount;   // Receipt/Payment column

      const resolvedAccountId = formData.account_id ? await getOrCreateAccountByName(formData.account_id, userId) : null;

      const recordToInsert = {
        from_source: formData.from_source,
        month: formData.month,
        year: formData.year,
        entity: formData.entity,
        account_id: resolvedAccountId,
        limit_amount: formData.limit_amount,
        expense_amount:       expenseAmount,
        income_amount:        incomeAmount,
        income_expense:       incomeExpense,
        payment_receipt_cash: receiptAmount,   // keep legacy col as receipt for compat
        receipt_payment:      receiptPayment,
        interests: formData.interests,
        late_fee_interests: formData.late_fee_interests,
        penalties: formData.penalties,
        tax: formData.tax,
        description: formData.description,
        paid_with: formData.paid_with,
        transaction_type: formData.transaction_type,
        status: formData.status,
        losses: formData.losses,
        quest_type: toDbQuestType(formData.quest_type),
        profile_id: userId
      };

      // Helper: strip new columns if migration not run yet
      const stripNewCols = (payload) => {
        const { income_amount, income_expense, receipt_payment, ...rest } = payload;
        return rest;
      };

      // Try inserting with flow_type
      let insertError;
      try {
        const { error } = await supabase
          .from('treasury_records')
          .insert([{ ...recordToInsert, flow_type: formData.flow_type || null }]);
        insertError = error;
      } catch (err) {
        insertError = err;
      }

      // Retry without flow_type if column missing
      if (insertError && (insertError.code === '42703' || String(insertError.message).includes('flow_type'))) {
        const { error: retryError } = await supabase
          .from('treasury_records')
          .insert([recordToInsert]);
        insertError = retryError;
        if (!retryError) toast('Note: flow_type not saved. Run add_flow_type.sql.', { icon: '⚠️', duration: 6000 });
      }

      // Retry without new columns if migration not run yet
      if (insertError && (insertError.code === '42703' || String(insertError.message).includes('income_amount') || String(insertError.message).includes('income_expense') || String(insertError.message).includes('receipt_payment'))) {
        const { error: retryError } = await supabase
          .from('treasury_records')
          .insert([stripNewCols(recordToInsert)]);
        if (retryError) throw retryError;
        toast('Note: new columns not yet in DB. Please run add_treasury_columns.sql.', { icon: '⚠️', duration: 6000 });
      } else if (insertError) {
        throw insertError;
      }

      toast.success('Record successfully added to the royal archives!');

      // 2. Update Profile Gold
      const { data: profileData } = await supabase
        .from('profiles')
        .select('gold')
        .eq('id', userId)
        .single();

      const netAmount = incomeAmount + receiptAmount - expenseAmount - paymentAmount;
      const newGold = (profileData?.gold || 0) + netAmount;

      await supabase
        .from('profiles')
        .update({ gold: Math.max(0, newGold) })
        .eq('id', userId);

      resetForm();
      if (onRefresh) onRefresh();
      setActiveTab('view');
    } catch (err) {
      console.error('Error adding record:', err);
      toast.error('Failed to commit record: ' + err.message);
    } finally {
      setLoading(false);
    }
  };


  const inputClass = "w-full bg-white/40 border-2 border-[#4b2c20]/20 rounded-xl px-4 py-2 text-[#4b2c20] font-bold focus:border-[#4b2c20]/45 outline-none transition-all text-xs placeholder:text-[#4b2c20]/30";
  const labelClass = "block text-[10px] font-black uppercase tracking-widest text-[#4b2c20] mb-0.5 ml-1";

  return (
    <div className="absolute inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
      {/* Parchment Background */}
      <div 
        ref={parentRef}
        onScroll={handleParentScroll}
        className="relative w-full max-w-5xl h-[90%] overflow-hidden rounded-xl shadow-2xl flex flex-col items-center"
      >
        <img src={parchmentBg} className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none" alt="Parchment" />
        <div className="absolute inset-0 bg-[#3e2723]/10 pointer-events-none" />

        <div 
          ref={contentRef}
          onScroll={handleContentScroll}
          className="relative z-10 w-full h-full max-h-full p-6 pt-10 flex flex-col overflow-hidden text-[#2d1e1e]"
        >
          
          {/* Header */}
          <div className="flex justify-between items-center border-b border-[#4b2c20]/10 pb-3">
            <button 
              onClick={onBack}
              className="flex items-center gap-2 title-font text-[#2d1e1e] font-black uppercase text-xs tracking-widest hover:scale-105 active:scale-95 transition-transform"
            >
              <ArrowLeft size={16} />
              Back to Map
            </button>
            
            {/* Tabs */}
            <div className="flex gap-1 bg-[#4b2c20]/10 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('new')}
                className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'new' ? 'bg-[#4b2c20] text-white shadow-md' : 'text-[#4b2c20] hover:bg-white/30'}`}
              >
                New Transaction
              </button>
              <button
                onClick={() => setActiveTab('view')}
                className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'view' ? 'bg-[#4b2c20] text-white shadow-md' : 'text-[#4b2c20] hover:bg-white/30'}`}
              >
                View Transactions
              </button>
            </div>

            <h2 className="title-font text-base sm:text-lg font-black uppercase tracking-widest text-[#4b2c20] flex items-center gap-2">
              <BookOpen size={18} />
              Royal Transactions
            </h2>
          </div>

          {/* Body Content */}
          <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto custom-scrollbar mt-4 pr-1">
            {activeTab === 'new' ? (
              <form onSubmit={handleSubmit} className="space-y-3">
                
                {/* Row 1: Transaction Type, Flow Type, Quest Type */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className={labelClass}>Transaction Type</label>
                    <select 
                      name="transaction_type" 
                      value={formData.transaction_type} 
                      onChange={handleChange} 
                      className={inputClass}
                    >
                      {txTypes.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Flow Type</label>
                    <select name="flow_type" value={formData.flow_type} onChange={handleChange} className={inputClass}>
                      {flowTypes.map(ft => (
                        <option key={ft} value={ft}>{ft}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Quest Type</label>
                    <select name="quest_type" value={formData.quest_type} onChange={handleChange} className={inputClass}>
                      {qTypes.map(q => (
                        <option key={q} value={q}>{q}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Row 2: Month; Year */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Month</label>
                    <select name="month" value={formData.month} onChange={handleChange} className={inputClass}>
                      {MONTHS.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Year</label>
                    <input 
                      type="text"
                      name="year" 
                      value={formData.year} 
                      onChange={handleChange} 
                      className={inputClass} 
                      placeholder="2026" 
                      required
                    />
                  </div>
                </div>

                {/* Row 3: From; Entity; Link to */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className={labelClass}>From</label>
                    <select 
                      name="from_source" 
                      value={formData.from_source} 
                      onChange={handleChange} 
                      className={inputClass} 
                      required 
                    >
                      <option value="">Select Person...</option>
                      {responsibleUsers.map(u => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Entity</label>
                    <select 
                      name="entity" 
                      value={formData.entity} 
                      onChange={handleChange} 
                      className={inputClass} 
                      required
                    >
                      <option value="">Select Entity...</option>
                      {entities.map(e => (
                        <option key={e.name} value={e.name}>{e.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Link to</label>
                    <select name="account_id" value={formData.account_id} onChange={handleChange} className={inputClass}>
                      <option value="">None</option>
                      {entities.map(e => (
                        <option key={e.name} value={e.name}>{e.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Row 4: Limit; Income; Expense */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className={labelClass}>Limit</label>
                    <input 
                      type="number" 
                      name="limit_amount" 
                      value={formData.limit_amount} 
                      onChange={handleChange} 
                      className={inputClass} 
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Income</label>
                    <input 
                      type="number" 
                      name="income" 
                      value={formData.income} 
                      onChange={handleChange} 
                      className={inputClass} 
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Expense</label>
                    <input 
                      type="number" 
                      name="expense" 
                      value={formData.expense} 
                      onChange={handleChange} 
                      className={inputClass} 
                    />
                  </div>
                </div>

                {/* Row 5: Receipt, Payment */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Receipt</label>
                    <input 
                      type="number" 
                      name="receipt" 
                      value={formData.receipt} 
                      onChange={handleChange} 
                      className={inputClass} 
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Payment</label>
                    <input 
                      type="number" 
                      name="payment" 
                      value={formData.payment} 
                      onChange={handleChange} 
                      className={inputClass} 
                    />
                  </div>
                </div>

                {/* Row 6: Interests; Late Fee; Penalties; Tax */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className={labelClass}>Interests</label>
                    <input 
                      type="number" 
                      name="interests" 
                      value={formData.interests} 
                      onChange={handleChange} 
                      className={inputClass} 
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Late Fee</label>
                    <input 
                      type="number" 
                      name="late_fee_interests" 
                      value={formData.late_fee_interests} 
                      onChange={handleChange} 
                      className={inputClass} 
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Penalties</label>
                    <input 
                      type="number" 
                      name="penalties" 
                      value={formData.penalties} 
                      onChange={handleChange} 
                      className={inputClass} 
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Tax</label>
                    <input 
                      type="number" 
                      name="tax" 
                      value={formData.tax} 
                      onChange={handleChange} 
                      className={inputClass} 
                    />
                  </div>
                </div>

                {/* Row 7: Other Notes */}
                <div>
                  <label className={labelClass}>Other Notes</label>
                  <textarea 
                    name="description" 
                    value={formData.description} 
                    onChange={handleChange} 
                    className={`${inputClass} h-18 resize-none`} 
                    placeholder="Enter chronicle records of this transaction..." 
                  />
                </div>

                {/* 7. Bottom Actions: Save and Cancel */}
                <div className="flex justify-end gap-3 pt-3 border-t border-[#4b2c20]/10">
                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      onBack();
                    }}
                    className="px-6 py-2.5 bg-white/40 border-2 border-[#4b2c20]/20 rounded-xl text-xs font-black uppercase tracking-wider text-[#4b2c20] hover:bg-white/60 active:scale-95 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-2.5 bg-[#4b2c20] text-white rounded-xl text-xs font-black uppercase tracking-wider hover:scale-[1.02] active:scale-95 transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <LoaderCircle size={14} className="animate-spin" /> Recording...
                      </>
                    ) : (
                      <>
                        <Save size={14} /> Commit to Ledger
                      </>
                    )}
                  </button>
                </div>

              </form>
            ) : (
              <RecordsTable userId={userId} />
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default TransactionsView;
