import React, { useState, useEffect } from 'react';
import { Save, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { MONTHS, TRANSACTION_TYPES, PAYMENT_METHODS, RECORD_STATUSES, QUEST_TYPES } from '../../utils/constants';

const RecordForm = ({ onSuccess, userId }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [entities, setEntities] = useState([]);
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
      fetchAccounts();
      fetchEntities();
    }
  }, [userId]);

  const fetchAccounts = async () => {
    const { data } = await supabase.from('treasury_accounts').select('id, name').eq('profile_id', userId);
    setAccounts(data || []);
  };

  const fetchEntities = async () => {
    const { data } = await supabase.from('treasury_entities').select('name').eq('profile_id', userId).order('name', { ascending: true });
    setEntities(data || []);
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId) {
      setError('User identity not found. Please log in.');
      return;
    }
    setLoading(true);
    setError(null);

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
      const { data: profile } = await supabase.from('profiles').select('gold').eq('id', userId).single();
      const amount = formData.payment_receipt_cash || formData.expense_amount;
      const isIncome = formData.transaction_type.toLowerCase() === 'income' || formData.transaction_type.toLowerCase() === 'earning';
      const newGold = isIncome ? profile.gold + amount : profile.gold - amount;
      
      await supabase.from('profiles').update({ gold: Math.max(0, newGold) }).eq('id', userId);

      onSuccess();
    } catch (err) {
      console.error('Error adding record:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full bg-white/40 border-2 border-[#4b2c20]/20 rounded-xl px-4 py-2.5 text-[#4b2c20] font-bold focus:border-[#4b2c20]/40 outline-none transition-all text-sm placeholder:text-[#4b2c20]/30";
  const labelClass = "block text-xs font-black uppercase tracking-widest text-[#4b2c20] mb-2 ml-1";

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-8 overflow-y-auto max-h-[70vh] custom-scrollbar">
      {error && (
        <div className="bg-red-500/10 border-2 border-red-500/20 text-red-700 p-4 rounded-xl flex items-center gap-3 text-sm font-bold">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Source & Date Info */}
        <div className="space-y-6">
          <h3 className="text-xs font-black uppercase tracking-[0.3em] text-[#4b2c20]/40 border-b border-[#4b2c20]/10 pb-2 mb-4">Origin & Chronology</h3>
          
          <div>
            <label className={labelClass}>Source (e.g. Royal Merchant)</label>
            <input name="from_source" value={formData.from_source} onChange={handleChange} className={inputClass} placeholder="Where is this coming from?" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
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
              <input name="year" value={formData.year} onChange={handleChange} className={inputClass} placeholder="2026" />
            </div>
          </div>

          <div>
            <label className={labelClass}>Target Entity (Account)</label>
            <select name="entity" value={formData.entity} onChange={handleChange} className={inputClass} required>
              <option value="">Select Entity...</option>
              {entities.map(e => (
                <option key={e.name} value={e.name}>{e.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Financial Details */}
        <div className="space-y-6">
          <h3 className="text-xs font-black uppercase tracking-[0.3em] text-[#4b2c20]/40 border-b border-[#4b2c20]/10 pb-2 mb-4">Coinage Details</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Limit Amount</label>
              <input type="number" name="limit_amount" value={formData.limit_amount} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Expense Amount</label>
              <input type="number" name="expense_amount" value={formData.expense_amount} onChange={handleChange} className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Receipt / Cash</label>
              <input type="number" name="payment_receipt_cash" value={formData.payment_receipt_cash} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Interests</label>
              <input type="number" name="interests" value={formData.interests} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Late Fee</label>
              <input type="number" name="late_fee_interests" value={formData.late_fee_interests} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Penalties</label>
              <input type="number" name="penalties" value={formData.penalties} onChange={handleChange} className={inputClass} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-[#4b2c20]/10">
        <div>
          <label className={labelClass}>Transaction Type</label>
          <select name="transaction_type" value={formData.transaction_type} onChange={handleChange} className={inputClass}>
            {TRANSACTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Paid With</label>
          <select name="paid_with" value={formData.paid_with} onChange={handleChange} className={inputClass}>
            {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Status</label>
          <select name="status" value={formData.status} onChange={handleChange} className={inputClass}>
            {RECORD_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className={labelClass}>Account Link (Monster/Liabilities)</label>
          <select name="account_id" value={formData.account_id} onChange={handleChange} className={inputClass}>
            <option value="">None</option>
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id}>{acc.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Quest Type</label>
          <select name="quest_type" value={formData.quest_type} onChange={handleChange} className={inputClass}>
            {QUEST_TYPES.map(q => (
              <option key={q} value={q}>{q}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass}>Scribe's Notes (Description)</label>
        <textarea name="description" value={formData.description} onChange={handleChange} className={`${inputClass} h-24 resize-none`} placeholder="Detailed records of this transaction..." />
      </div>

      <div className="flex justify-center pt-6">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-3 px-16 py-4 bg-[#4b2c20] text-white rounded-2xl title-font font-black uppercase tracking-[0.3em] hover:scale-105 active:scale-95 transition-all disabled:opacity-50 shadow-2xl shadow-[#4b2c20]/20"
        >
          {loading ? 'Recording...' : (
            <>
              <Save size={20} />
              Commit to Ledger
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default RecordForm;
