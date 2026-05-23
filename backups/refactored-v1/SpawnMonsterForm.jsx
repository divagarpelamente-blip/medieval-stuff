import React, { useState, useEffect } from 'react';
import { Save, AlertCircle, Flame, Shield, Heart, Zap } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

const SpawnMonsterForm = ({ onSuccess, userId }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'Loan',
    balance: 0, 
    initial_debt: 0,
    overdraft_limit: 0,
    month: new Date().toLocaleString('default', { month: 'long' }),
    year: new Date().getFullYear().toString(),
    recurrence: 'Monthly',
    description: ''
  });

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
      const finalData = {
        name: formData.name,
        type: formData.type,
        initial_debt: Number(formData.initial_debt),
        overdraft_limit: Number(formData.overdraft_limit),
        profile_id: userId,
        balance: Number(formData.balance || formData.initial_debt)
      };

      const { error: insertError } = await supabase
        .from('treasury_accounts')
        .insert([finalData]);

      if (insertError) throw insertError;
      
      onSuccess();
    } catch (err) {
      console.error('Error spawning monster:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full bg-white/40 border-2 border-[#4b2c20]/20 rounded-lg px-3 py-2 text-[#4b2c20] font-bold focus:border-[#4b2c20]/40 outline-none transition-all text-sm placeholder:text-[#4b2c20]/30";
  const labelClass = "block text-xs font-black uppercase tracking-wider text-[#4b2c20] mb-1.5 ml-1";

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-6 overflow-y-auto max-h-[60vh] custom-scrollbar">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-700 p-3 rounded-lg flex items-center gap-2 text-sm">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Monster Identity */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#4b2c20] border-b border-[#4b2c20]/10 pb-1 mb-4 flex items-center gap-2">
            <Flame size={14} className="text-red-600" />
            Monster Identity
          </h3>
          <div>
            <label className={labelClass}>Monster Name (e.g. Iron Bank Dragon)</label>
            <input name="name" value={formData.name} onChange={handleChange} className={inputClass} placeholder="Name your liability..." required />
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelClass}>Monster Type</label>
              <select name="type" value={formData.type} onChange={handleChange} className={inputClass}>
                <option value="Debt">Debt</option>
                <option value="Loan">Loan</option>
                <option value="Checking">Checking</option>
                <option value="Savings">Savings</option>
                <option value="Credit Card">Credit Card</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Recurrence</label>
              <select name="recurrence" value={formData.recurrence} onChange={handleChange} className={inputClass}>
                <option value="Bi-weekly">Bi-weekly</option>
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
                <option value="Yearly">Yearly</option>
              </select>
            </div>
          </div>
        </div>

        {/* Vitality & Spawn Timing */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#4b2c20] border-b border-[#4b2c20]/10 pb-1 mb-4 flex items-center gap-2">
            <Zap size={14} className="text-yellow-600" />
            Vitality & Timing
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelClass}>Spawn Month</label>
              <select name="month" value={formData.month} onChange={handleChange} className={inputClass}>
                {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Spawn Year</label>
              <input name="year" value={formData.year} onChange={handleChange} className={inputClass} placeholder="2026" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelClass}>Max Health (Principal)</label>
              <input type="number" name="initial_debt" value={formData.initial_debt} onChange={handleChange} className={inputClass} required />
            </div>
            <div>
              <label className={labelClass}>Armor Shield (Shield)</label>
              <input type="number" name="overdraft_limit" value={formData.overdraft_limit} onChange={handleChange} className={inputClass} />
            </div>
          </div>
        </div>
      </div>

      <div className="w-full">
        <label className={labelClass}>Monster Lore / Notes</label>
        <textarea name="description" value={formData.description} onChange={handleChange} className={`${inputClass} h-20 resize-none`} placeholder="Describe the origin of this beast..." />
      </div>

      <div className="flex justify-center pt-4">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-3 px-12 py-4 bg-red-900 text-white rounded-2xl title-font font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all disabled:opacity-50 shadow-2xl shadow-red-900/20"
        >
          {loading ? 'Summoning...' : (
            <>
              <Zap size={18} />
              Summon New Monster
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default SpawnMonsterForm;
