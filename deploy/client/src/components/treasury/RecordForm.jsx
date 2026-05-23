import React, { useState, useEffect } from 'react';
import { Save, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

const RecordForm = ({ onSuccess, userId }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [formData, setFormData] = useState({
    from_source: '',
    month: new Date().toLocaleString('default', { month: 'long' }),
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
    paid_with: 'Gold',
    transaction_type: 'Income',
    status: 'Pending',
    losses: 0,
    quests: ''
  });

  useEffect(() => {
    if (userId) fetchAccounts();
  }, [userId]);

  const fetchAccounts = async () => {
    const { data } = await supabase.from('treasury_accounts').select('id, name').eq('profile_id', userId);
    setAccounts(data || []);
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

      if (insertError) throw insertError;

      // 2. Update Profile Gold
      const { data: profile } = await supabase.from('profiles').select('gold').eq('id', userId).single();
      const amount = formData.payment_receipt_cash || formData.expense_amount;
      const newGold = formData.transaction_type === 'Income' ? profile.gold + amount : profile.gold - amount;
      
      await supabase.from('profiles').update({ gold: Math.max(0, newGold) }).eq('id', userId);

      // 3. If linked to an account, update its balance
      if (formData.account_id && formData.transaction_type === 'Expense') {
        const { data: acc } = await supabase.from('treasury_accounts').select('balance').eq('id', formData.account_id).single();
        await supabase.from('treasury_accounts').update({ 
          balance: Math.max(0, acc.balance - formData.expense_amount),
          updated_at: new Date().toISOString()
        }).eq('id', formData.account_id);
      }
      
      onSuccess();
    } catch (err) {
      console.error('Error saving record:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full bg-black/5 border-2 border-[#4b2c20]/10 rounded-lg px-3 py-2 text-[#4b2c20] focus:border-[#4b2c20]/30 outline-none transition-all text-sm";
  const labelClass = "block text-[10px] font-black uppercase tracking-wider text-[#4b2c20]/70 mb-1 ml-1";

  return (
    <form onSubmit={handleSubmit} className="p-2 space-y-6">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-700 p-3 rounded-lg flex items-center gap-2 text-sm">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Basic Info */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#4b2c20] border-b border-[#4b2c20]/10 pb-1 mb-4">Origin & Entity</h3>
          <div>
            <label className={labelClass}>From / Source</label>
            <input name="from_source" value={formData.from_source} onChange={handleChange} className={inputClass} placeholder="e.g. Royal Taxes" required />
          </div>
          <div>
            <label className={labelClass}>Month</label>
            <select name="month" value={formData.month} onChange={handleChange} className={inputClass}>
              {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Entity / Person</label>
            <input name="entity" value={formData.entity} onChange={handleChange} className={inputClass} placeholder="e.g. Lord Byron" />
          </div>
        </div>

        {/* Financials */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#4b2c20] border-b border-[#4b2c20]/10 pb-1 mb-4">Financial Details</h3>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelClass}>Limit</label>
              <input type="number" name="limit_amount" value={formData.limit_amount} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Expense</label>
              <input type="number" name="expense_amount" value={formData.expense_amount} onChange={handleChange} className={inputClass} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelClass}>Cash Flow</label>
              <input type="number" name="payment_receipt_cash" value={formData.payment_receipt_cash} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Tax</label>
              <input type="number" name="tax" value={formData.tax} onChange={handleChange} className={inputClass} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
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

        {/* Meta & Status */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#4b2c20] border-b border-[#4b2c20]/10 pb-1 mb-4">Metadata & Status</h3>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelClass}>Type</label>
              <select name="transaction_type" value={formData.transaction_type} onChange={handleChange} className={inputClass}>
                <option value="Income">Income</option>
                <option value="Expense">Expense</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Status</label>
              <select name="status" value={formData.status} onChange={handleChange} className={inputClass}>
                <option value="Pending">Pending</option>
                <option value="Paid">Paid</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>
          </div>
          <div>
            <label className={labelClass}>Account Link (Dragon)</label>
            <select name="account_id" value={formData.account_id} onChange={handleChange} className={inputClass}>
              <option value="">None</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Quests / Notes</label>
            <input name="quests" value={formData.quests} onChange={handleChange} className={inputClass} placeholder="Related quest..." />
          </div>
        </div>
      </div>

      <div className="w-full">
        <label className={labelClass}>Description</label>
        <textarea name="description" value={formData.description} onChange={handleChange} className={`${inputClass} h-20 resize-none`} placeholder="Detailed transaction notes..." />
      </div>

      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-8 py-3 bg-[#4b2c20] text-white rounded-xl title-font font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
        >
          {loading ? 'Recording...' : (
            <>
              <Save size={18} />
              Save Record
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default RecordForm;
