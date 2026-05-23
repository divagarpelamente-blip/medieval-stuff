import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, BookOpen, Plus, X, Save, AlertCircle, LoaderCircle } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { MONTHS, TRANSACTION_TYPES, PAYMENT_METHODS, RECORD_STATUSES, QUEST_TYPES } from '../../utils/constants';
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
    expense_amount: 0,
    payment_receipt_cash: 0,
    interests: 0,
    late_fee_interests: 0,
    penalties: 0,
    tax: 0,
    description: '',
    paid_with: 'Debit',
    transaction_type: 'Income',
    status: 'Paid',
    losses: 0,
    quest_type: 'Production'
  });

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
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const resetForm = () => {
    setFormData({
      from_source: '',
      month: new Date().toLocaleString('default', { month: 'long' }),
      year: new Date().getFullYear().toString(),
      entity: '',
      account_id: '',
      limit_amount: 0,
      expense_amount: 0,
      payment_receipt_cash: 0,
      interests: 0,
      late_fee_interests: 0,
      penalties: 0,
      tax: 0,
      description: '',
      paid_with: 'Debit',
      transaction_type: 'Income',
      status: 'Paid',
      losses: 0,
      quest_type: 'Production'
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId) {
      toast.error('User identity not found. Please log in.');
      return;
    }
    setLoading(true);

    try {
      // 1. Insert Record
      const { error: insertError } = await supabase
        .from('treasury_records')
        .insert([{ 
          ...formData, 
          profile_id: userId,
          account_id: formData.account_id || null 
        }]);

      if (insertError) {
        throw insertError;
      }

      // 2. Update Profile Gold
      const { data: profileData } = await supabase
        .from('profiles')
        .select('gold')
        .eq('id', userId)
        .single();
        
      const amount = formData.payment_receipt_cash || formData.expense_amount;
      const isIncome = formData.transaction_type.toLowerCase() === 'income' || formData.transaction_type.toLowerCase() === 'earning';
      const newGold = isIncome ? profileData.gold + amount : profileData.gold - amount;
      
      await supabase
        .from('profiles')
        .update({ gold: Math.max(0, newGold) })
        .eq('id', userId);

      toast.success('Record successfully added to the royal archives!');
      resetForm();
      if (onRefresh) onRefresh();
      setActiveTab('view'); // Switch to view tab
    } catch (err) {
      console.error('Error adding record:', err);
      toast.error('Failed to commit record: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full bg-white/40 border-2 border-[#4b2c20]/20 rounded-xl px-4 py-2 text-[#4b2c20] font-bold focus:border-[#4b2c20]/45 outline-none transition-all text-xs placeholder:text-[#4b2c20]/30";
  const labelClass = "block text-[10px] font-black uppercase tracking-widest text-[#4b2c20] mb-1.5 ml-1";

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
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* 1. Transaction Type and Sub Type (Entity) */}
                <div className="bg-white/20 border border-[#4b2c20]/15 rounded-2xl p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Transaction Type</label>
                      <select 
                        name="transaction_type" 
                        value={formData.transaction_type} 
                        onChange={handleChange} 
                        className="w-full bg-white/50 border-2 border-[#4b2c20]/30 rounded-xl px-4 py-2.5 text-[#4b2c20] font-black text-sm focus:border-[#4b2c20]/60 outline-none transition-all"
                      >
                        {TRANSACTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Sub Type (Entity)</label>
                      <select 
                        name="entity" 
                        value={formData.entity} 
                        onChange={handleChange} 
                        className="w-full bg-white/50 border-2 border-[#4b2c20]/30 rounded-xl px-4 py-2.5 text-[#4b2c20] font-black text-sm focus:border-[#4b2c20]/60 outline-none transition-all" 
                        required
                      >
                        <option value="">Select Entity...</option>
                        {entities.map(e => (
                          <option key={e.name} value={e.name}>{e.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* 2. Chronology & Origin */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className={labelClass}>Source (e.g. Royal Merchant)</label>
                    <input 
                      type="text"
                      name="from_source" 
                      value={formData.from_source} 
                      onChange={handleChange} 
                      className={inputClass} 
                      placeholder="e.g. Salary, Shop sale..." 
                      required 
                    />
                  </div>
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

                {/* 3. RPG Meta-Attributes */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className={labelClass}>Quest Type</label>
                    <select name="quest_type" value={formData.quest_type} onChange={handleChange} className={inputClass}>
                      {QUEST_TYPES.map(q => (
                        <option key={q} value={q}>{q}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Paid With</label>
                    <select name="paid_with" value={formData.paid_with} onChange={handleChange} className={inputClass}>
                      {PAYMENT_METHODS.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Status</label>
                    <select name="status" value={formData.status} onChange={handleChange} className={inputClass}>
                      {RECORD_STATUSES.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Account Link (Monster/Liability)</label>
                    <select name="account_id" value={formData.account_id} onChange={handleChange} className={inputClass}>
                      <option value="">None</option>
                      {accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 4. Monetary Coinage Fields */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-[#4b2c20]/10 pt-4">
                  <div>
                    <label className={labelClass}>Limit Amount (Gold)</label>
                    <input 
                      type="number" 
                      name="limit_amount" 
                      value={formData.limit_amount} 
                      onChange={handleChange} 
                      className={inputClass} 
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Expense Amount (Gold Outflow)</label>
                    <input 
                      type="number" 
                      name="expense_amount" 
                      value={formData.expense_amount} 
                      onChange={handleChange} 
                      className={inputClass} 
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Receipt Cash (Gold Inflow)</label>
                    <input 
                      type="number" 
                      name="payment_receipt_cash" 
                      value={formData.payment_receipt_cash} 
                      onChange={handleChange} 
                      className={inputClass} 
                    />
                  </div>
                </div>

                {/* 5. RPG Penalty/Fines Details */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
                  <div className="col-span-2 md:col-span-1">
                    <label className={labelClass}>Losses (Shield Impact)</label>
                    <input 
                      type="number" 
                      name="losses" 
                      value={formData.losses} 
                      onChange={handleChange} 
                      className={inputClass} 
                    />
                  </div>
                </div>

                {/* 6. Description Textarea */}
                <div>
                  <label className={labelClass}>Scribe's Notes (Description)</label>
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
