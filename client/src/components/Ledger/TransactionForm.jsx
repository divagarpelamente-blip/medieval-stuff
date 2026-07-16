import React, { useState, useEffect } from 'react';
import { useKingdomStore } from "../../store/useKingdomStore";
import { toast } from 'react-hot-toast';

export default function TransactionForm({ editingTransaction, onCancelEdit }) {
  const flatMatrix = useKingdomStore((state) => state.flatMatrix) || [];
  const isLedgerLoading = useKingdomStore((state) => state.isLedgerLoading);
  const fetchFlatMatrix = useKingdomStore((state) => state.fetchFlatMatrix);
  const addTransaction = useKingdomStore((state) => state.addTransaction);
  const updateTransaction = useKingdomStore((state) => state.updateTransaction);

  const todayStr = new Date().toISOString().split('T')[0];
  const [amount, setAmount] = useState('');
  const [flow, setFlow] = useState('outflow');
  const [sourceAccount, setSourceAccount] = useState('');
  const [description, setDescription] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('Completed');

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
      setDescription(editingTransaction.description || '');
    }
  }, [editingTransaction, todayStr]);

  // Clean dynamic mapping (ignores bad data)
  const uniqueEntities = [...new Set(flatMatrix.map((row) => row.entity).filter(Boolean))].sort();
  // Ensure we only use the 4 valid root types (handling singular/plural variations)
  const validTypes = ['Assets', 'Asset', 'Liabilities', 'Liability', 'Income', 'Expense', 'Expenses'];
  const uniqueTypes = [...new Set(flatMatrix.map((row) => row.type).filter(Boolean))]
    .filter(type => validTypes.includes(type))
    .sort();

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

  const assetSourceAccounts = flatMatrix.filter((row) => row.type === 'Assets');

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
    if (onCancelEdit) onCancelEdit();
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
      description: description,
      origin: 'Web Client'
    };

    try {
      if (editingTransaction) {
        await updateTransaction(editingTransaction.id, payload);
        toast.success("Transaction Updated");
      } else {
        await addTransaction(payload);
        toast.success("Transaction Added");
      }
      resetForm();
    } catch (error) {
      toast.error(editingTransaction ? "Failed to update transaction." : "Failed to commit transaction.");
    }
  };

  return (
    <section className="bg-stone-950 border-2 border-amber-900/50 rounded-lg p-5 shadow-2xl relative overflow-hidden">
      <h2 className="text-base font-serif text-amber-400 tracking-wider mb-4 flex items-center gap-2">
        {editingTransaction ? 'Edit Transaction' : 'New Transaction'}
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
              disabled={selectedType === 'Income' || selectedType === 'Expense' || selectedType === 'Expenses'}
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
              {isLedgerLoading ? (editingTransaction ? 'Updating...' : 'Adding...') : (editingTransaction ? 'Update Transaction' : 'Add Transaction')}
            </button>

            {editingTransaction && (
              <button
                type="button"
                onClick={resetForm}
                className="w-full md:w-auto px-4 py-2.5 bg-stone-800 hover:bg-stone-700 active:translate-y-px border border-stone-600/50 rounded text-stone-300 text-xs tracking-widest uppercase font-bold transition"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

      </form>
    </section>
  );
}