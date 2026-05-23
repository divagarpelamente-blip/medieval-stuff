import React, { useState, useEffect } from 'react';
import { Save, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { MONTHS, TRANSACTION_TYPES, PAYMENT_METHODS, RECORD_STATUSES, QUEST_TYPES, toDbQuestType } from '../../utils/constants';

const RecordForm = ({ onSuccess, onCancel, userId, editingRecord }) => {
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
      fetchAccounts();
      fetchEntities();
    }
  }, [userId]);

  useEffect(() => {
    if (editingRecord) {
      let resolvedAccountName = '';
      if (editingRecord.account_id && accounts.length > 0) {
        const match = accounts.find(a => a.id === editingRecord.account_id);
        if (match) resolvedAccountName = match.name;
      } else if (editingRecord.account_id) {
        resolvedAccountName = editingRecord.account_id;
      }

      setFormData({
        from_source: editingRecord.from_source || '',
        month: editingRecord.month || new Date().toLocaleString('default', { month: 'long' }),
        year: editingRecord.year?.toString() || new Date().getFullYear().toString(),
        entity: editingRecord.entity || '',
        account_id: resolvedAccountName,
        limit_amount: editingRecord.limit_amount || 0,
        // Load each field from its dedicated column
        expense: editingRecord.expense_amount       || 0,
        income:  editingRecord.income_amount        || 0,
        receipt: editingRecord.payment_receipt_cash || 0,  // legacy col stores receipt
        payment: editingRecord.receipt_payment != null
          ? (editingRecord.payment_receipt_cash || 0) - (editingRecord.receipt_payment || 0)
          : 0,
        interests:         editingRecord.interests          || 0,
        late_fee_interests: editingRecord.late_fee_interests || 0,
        penalties:         editingRecord.penalties          || 0,
        tax:               editingRecord.tax                || 0,
        description:       editingRecord.description        || '',
        paid_with:         editingRecord.paid_with          || 'Debit',
        transaction_type:  editingRecord.transaction_type   || 'Income',
        status:            editingRecord.status             || 'Paid',
        losses:            editingRecord.losses             || 0,
        quest_type:        editingRecord.quest_type         || 'Production',
        flow_type:         editingRecord.flow_type          || 'Inflow'
      });
    }
  }, [editingRecord, accounts]);


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
      setError('User identity not found. Please log in.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      // Raw individual amounts — each maps to its own semantic column
      const expenseAmount  = Number(formData.expense)  || 0;
      const incomeAmount   = Number(formData.income)   || 0;
      const receiptAmount  = Number(formData.receipt)  || 0;
      const paymentAmount  = Number(formData.payment)  || 0;

      // Derived net columns shown in the table
      const incomeExpense  = incomeAmount  - expenseAmount;   // Expense/Income column
      const receiptPayment = receiptAmount - paymentAmount;   // Receipt/Payment column

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


      // Helper: strip new columns that may not exist in DB yet
      const stripNewCols = (payload) => {
        const { income_amount, income_expense, receipt_payment, ...rest } = payload;
        return rest;
      };

      // 1. Insert or Update Record
      if (editingRecord) {
        const fullPayload = { ...recordToInsert, flow_type: formData.flow_type || null };
        let updateError;
        try {
          const { error } = await supabase
            .from('treasury_records')
            .update(fullPayload)
            .eq('id', editingRecord.id);
          updateError = error;
        } catch (err) {
          updateError = err;
        }

        // Retry without flow_type if column missing
        if (updateError && (updateError.code === '42703' || String(updateError.message).includes('flow_type'))) {
          const { error: retryError } = await supabase
            .from('treasury_records')
            .update(recordToInsert)
            .eq('id', editingRecord.id);
          updateError = retryError;
        }

        // Retry without new columns if migration not run yet
        if (updateError && (updateError.code === '42703' || String(updateError.message).includes('income_amount') || String(updateError.message).includes('income_expense') || String(updateError.message).includes('receipt_payment'))) {
          const { error: retryError } = await supabase
            .from('treasury_records')
            .update(stripNewCols(recordToInsert))
            .eq('id', editingRecord.id);
          if (retryError) throw retryError;
          toast('Note: new columns not yet in DB. Please run add_treasury_columns.sql migration.', { icon: '⚠️', duration: 6000 });
        } else if (updateError) {
          throw updateError;
        }

        // 2. Adjust Profile Gold
        const oldAmount = Number(editingRecord.expense_amount || 0) + Number(editingRecord.income_amount || editingRecord.payment_receipt_cash || 0);
        const newAmount = expenseAmount + incomeAmount + receiptAmount;
        const { data: profile } = await supabase.from('profiles').select('gold').eq('id', userId).single();
        const adjustedGold = (profile?.gold || 0) - oldAmount + newAmount;
        await supabase.from('profiles').update({ gold: Math.max(0, adjustedGold) }).eq('id', userId);

      } else {
        // Insert new record
        const fullPayload = { ...recordToInsert, flow_type: formData.flow_type || null };
        let insertError;
        try {
          const { error } = await supabase
            .from('treasury_records')
            .insert([fullPayload]);
          insertError = error;
        } catch (err) {
          insertError = err;
        }

        // Retry without flow_type
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
          toast('Note: new columns not yet in DB. Please run add_treasury_columns.sql migration.', { icon: '⚠️', duration: 6000 });
        } else if (insertError) {
          throw insertError;
        }

        // 2. Update Profile Gold
        const { data: profile } = await supabase.from('profiles').select('gold').eq('id', userId).single();
        const netAmount = incomeAmount + receiptAmount - expenseAmount - paymentAmount;
        const newGold = (profile?.gold || 0) + netAmount;
        await supabase.from('profiles').update({ gold: Math.max(0, newGold) }).eq('id', userId);

      }

      onSuccess();
    } catch (err) {
      console.error('Error adding record:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full bg-white/40 border-2 border-[#4b2c20]/20 rounded-xl px-4 py-2.5 text-[#4b2c20] font-bold focus:border-[#4b2c20]/40 outline-none transition-all text-sm placeholder:text-[#4b2c20]/30";
  const labelClass = "block text-xs font-black uppercase tracking-widest text-[#4b2c20] mb-0.5 ml-1";

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-3.5 overflow-y-auto max-h-[70vh] custom-scrollbar">
      {error && (
        <div className="bg-red-500/10 border-2 border-red-500/20 text-red-700 p-4 rounded-xl flex items-center gap-3 text-sm font-bold">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

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
          className={`${inputClass} h-24 resize-none`} 
          placeholder="Detailed records of this transaction..." 
        />
      </div>

      <div className="flex gap-4 justify-center pt-6">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-4 bg-white/40 border-2 border-[#2d1e1e]/20 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-white/60 transition-all text-[#2d1e1e]"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className={`${onCancel ? 'flex-1' : 'px-16'} flex items-center justify-center gap-3 py-4 bg-[#4b2c20] text-white rounded-2xl title-font font-black uppercase tracking-[0.3em] hover:scale-105 active:scale-95 transition-all disabled:opacity-50 shadow-2xl shadow-[#4b2c20]/20`}
        >
          {loading ? 'Recording...' : (
            <>
              <Save size={20} />
              {editingRecord ? 'Save Changes' : 'Commit to Ledger'}
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default RecordForm;
