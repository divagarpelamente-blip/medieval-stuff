/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useRef, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabaseClient';
import { Z_LAYERS, STANDARD_MODAL_PROPS } from '../constants/UI_UX';
import { useKingdomStore } from '../store/useKingdomStore';
import TableSortHeader from './shared/TableSortHeader';

const GUEST_PROFILE_ID = '00000000-0000-0000-0000-000000000000';

export default function GoldMineLedger({
  t,
  activeTab,
  setActiveTab,
  setIsTreasuryMenuOpen,
  transactions,
  deleteTransactions,
  user,
  fetchKingdomData,
  fetchDashboardData,
  entityMappings,
  fromOptions,
  statusOptions,
  classOptions,
  subClassOptions,
  entityOptions,
  categoryOptions,
  monthOptions,
  filterYear,
  setFilterYear,
  filterMonth,
  setFilterMonth,
  filterFrom,
  setFilterFrom,
  filterStatus,
  setFilterStatus,
  filterClass,
  setFilterClass,
  filterCategory,
  setFilterCategory,
  filterEntity,
  setFilterEntity,
  isFiltersExpanded,
  setIsFiltersExpanded,
  uniqueYears,
  filteredTransactions,
  onEditTransaction,
  exportCSV,
  importCSV,
  onNewTransaction
}) {
  const [selectedTxIds, setSelectedTxIds] = useState([]);
  const [editingTxs, setEditingTxs] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef(null);

  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedTransactions = useMemo(() => {
    return [...filteredTransactions].sort((a, b) => {
      let valA, valB;
      if (sortField === 'status') {
        valA = a.payment_status || '';
        valB = b.payment_status || '';
      } else if (sortField === 'date') {
        valA = a.posting_date || a.value_date || a.created_at || '';
        valB = b.posting_date || b.value_date || b.created_at || '';
      } else if (sortField === 'due_date') {
        valA = a.due_date || '';
        valB = b.due_date || '';
      } else if (sortField === 'from') {
        valA = a.from || a.origin || '';
        valB = b.from || b.origin || '';
      } else if (sortField === 'type') {
        valA = a.transaction_type || '';
        valB = b.transaction_type || '';
      } else if (sortField === 'category') {
        valA = entityMappings[a.entity] || a.transaction_category || '';
        valB = entityMappings[b.entity] || b.transaction_category || '';
      } else if (sortField === 'entity') {
        valA = a.entity || '';
        valB = b.entity || '';
      } else if (sortField === 'amount') {
        valA = Number(a.amount) || 0;
        valB = Number(b.amount) || 0;
      } else {
        return 0;
      }

      if (typeof valA === 'string') {
        return sortDirection === 'asc'
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      } else {
        return sortDirection === 'asc'
          ? valA - valB
          : valB - valA;
      }
    });
  }, [filteredTransactions, sortField, sortDirection, entityMappings]);

  const handleStartEditing = () => {
    if (selectedTxIds.length === 0) return;
    if (selectedTxIds.length === 1) {
      const tx = transactions.find((t) => t.id === selectedTxIds[0]);
      if (tx) {
        onEditTransaction(tx);
        setSelectedTxIds([]);
        return;
      }
    }
    const initial = {};
    selectedTxIds.forEach((id) => {
      const tx = transactions.find((t) => t.id === id);
      if (tx) {
        initial[id] = { ...tx };
      }
    });
    setEditingTxs(initial);
    setIsEditing(true);
  };

  const handleCancelEditing = () => {
    setIsEditing(false);
    setSelectedTxIds([]);
    setEditingTxs({});
  };

  const handleFieldChange = (txId, field, value) => {
    setEditingTxs(prev => {
      const updatedTx = { ...prev[txId], [field]: value };
      if (field === 'entity' && entityMappings[value]) {
        updatedTx.transaction_category = entityMappings[value];
      }
      return {
        ...prev,
        [txId]: updatedTx
      };
    });
  };

  const handleSaveEdits = async () => {
    const toastId = toast.loading(t('saving_ledger') || 'Saving ledger changes...');
    try {
      const upsertRows = Object.values(editingTxs).map(tx => {
        const postingDate = tx.posting_date || new Date().toISOString().split('T')[0];
        const valueDate = tx.value_date || postingDate;
        const dateObj = new Date(postingDate);
        const year = dateObj.getFullYear();
        const month = tx.month || dateObj.toLocaleString('default', { month: 'long' });
        const quarter = 'Q' + (Math.floor(dateObj.getMonth() / 3) + 1);

        return {
          id: tx.id,
          profile_id: tx.profile_id,
          payment_status: tx.payment_status,
          transaction_type: tx.transaction_type,
          target_account: tx.target_account,
          source_dest_bank: tx.source_dest_bank,
          flow: tx.flow,
          transaction_subtype: tx.transaction_subtype,
          entity: tx.entity,
          origin: tx.from,
          amount: Number(tx.amount),
          description: tx.description,
          value_date: valueDate,
          posting_date: postingDate,
          due_date: tx.due_date || null,
          month,
          year,
          quarter
        };
      });

      const { error } = await supabase
        .from('transactions')
        .upsert(upsertRows);

      if (error) throw error;

      toast.success(t('success_saved_changes') || 'Changes saved successfully!', { id: toastId });
      setIsEditing(false);
      setSelectedTxIds([]);
      setEditingTxs({});

      const activeProfileId = user?.id || GUEST_PROFILE_ID;
      await fetchKingdomData(activeProfileId);
      await fetchDashboardData(activeProfileId);
    } catch (err) {
      console.error('Error saving edits:', err);
      toast.error(`${t('err_save_failed') || 'Save failed'}: ${err.message || err}`, { id: toastId });
    }
  };

  const handleDeleteSelectedTransactions = async () => {
    if (selectedTxIds.length === 0) return;

    const confirmMessage = t('confirm_delete_transactions', 'Are you sure you want to delete the selected transactions?') || 'Are you sure you want to delete the selected transactions?';
    if (!window.confirm(confirmMessage)) return;

    const toastId = toast.loading(t('deleting_ledger') || 'Deleting ledger entries...');
    try {
      const activeProfileId = user?.id || GUEST_PROFILE_ID;
      const res = await deleteTransactions(activeProfileId, selectedTxIds);
      if (res && res.success) {
        toast.success(t('success_deleted_transactions') || 'Selected transactions deleted successfully!', { id: toastId });
        setSelectedTxIds([]);
        await fetchKingdomData(activeProfileId);
        await fetchDashboardData(activeProfileId);
      } else {
        throw new Error(res?.error || 'Unknown error');
      }
    } catch (err) {
      console.error('Error deleting transactions:', err);
      toast.error(`${t('err_delete_failed') || 'Delete failed'}: ${err.message || err}`, { id: toastId });
    }
  };

  const handleDuplicateSelectedTransactions = async () => {
    if (selectedTxIds.length === 0) return;

    const toastId = toast.loading(t('duplicating_ledger') || 'Duplicating ledger entries...');
    try {
      const activeProfileId = user?.id || GUEST_PROFILE_ID;
      const txsToDuplicate = selectedTxIds.map(id => {
        const tx = transactions.find(t => t.id === id);
        if (!tx) return null;
        
        return {
          transaction_type: tx.transaction_type,
          amount: Number(tx.amount),
          value_date: tx.value_date || null,
          posting_date: tx.posting_date || null,
          due_date: tx.due_date || null,
          payment_status: tx.payment_status || 'Completed',
          transaction_subtype: tx.transaction_subtype,
          entity: tx.entity,
          from: tx.from || tx.origin,
          target_account: tx.target_account,
          source_dest_bank: tx.source_dest_bank,
          flow: tx.flow,
          description: tx.description ? `${tx.description} (Copy)` : 'Copy'
        };
      }).filter(Boolean);

      if (txsToDuplicate.length === 0) {
        throw new Error('No valid transactions to duplicate.');
      }

      const registerTransactions = useKingdomStore.getState().registerTransactions;
      const res = await registerTransactions(activeProfileId, txsToDuplicate);

      if (res && res.success) {
        toast.success(t('success_duplicated_transactions') || 'Selected transactions duplicated successfully!', { id: toastId });
        setSelectedTxIds([]);
        await fetchKingdomData(activeProfileId);
        await fetchDashboardData(activeProfileId);
      } else {
        throw new Error(res?.error || 'Unknown error');
      }
    } catch (err) {
      console.error('Error duplicating transactions:', err);
      toast.error(`${t('err_duplicate_failed') || 'Duplicate failed'}: ${err.message || err}`, { id: toastId });
    }
  };

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setActiveTab('quests');
          setIsTreasuryMenuOpen(true);
        }
      }}
      className={`absolute inset-0 flex ${STANDARD_MODAL_PROPS.align} justify-center p-4 bg-black/60 backdrop-blur-xs`}
      style={{ zIndex: Z_LAYERS.OVERLAY }}
    >
      <div className={`bg-[#f4e4bc] w-full ${STANDARD_MODAL_PROPS.size} rounded-xl border-[8px] border-[#5d4037] shadow-[0_0_50px_rgba(0,0,0,0.9)] relative flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300`}>
        
        {/* Parchment Texture */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-25 mix-blend-multiply"
          style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/paper-fibers.png')" }}
        />

        {/* Ornate Corners */}
        <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-[#8b4513]/30 rounded-tl-lg pointer-events-none" />
        <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-[#8b4513]/30 rounded-tr-lg pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-[#8b4513]/30 rounded-bl-lg pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-[#8b4513]/30 rounded-br-lg pointer-events-none" />

        {/* Close Button to return to quests */}
        <button 
          type="button"
          onClick={() => {
            setActiveTab('quests');
            setIsTreasuryMenuOpen(true);
          }}
          className="absolute -top-1 -right-1 w-12 h-12 bg-[#8b0000] rounded-full flex items-center justify-center border-4 border-[#5d0000] shadow-[0_4px_10px_rgba(0,0,0,0.5)] active:scale-90 transition-transform group"
          style={{ zIndex: Z_LAYERS.MODAL_CONTENT }}
          title={t.back_to_map}
        >
          <div className="absolute inset-0 rounded-full border-2 border-white/20 animate-pulse" />
          <span className="text-[#ffd700] text-lg font-black font-sans">✕</span>
        </button>

        {/* Header Ribbon */}
        <div className="relative h-16 flex items-center justify-center z-10 pt-2">
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[110%] h-10 bg-gradient-to-r from-[#8b4513] via-[#5d4037] to-[#8b4513] shadow-lg transform -rotate-1 skew-x-12 z-0 border-y-2 border-[#d4af37]" />
          <h2 className="title-font text-lg sm:text-xl text-[#ffd700] font-bold uppercase tracking-[0.2em] relative z-10 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
            {t.ledger_transactions}
          </h2>
        </div>

        {/* Scrollable Parchment Body */}
        <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar flex-grow relative z-10 text-[#2d1b0d] space-y-4">
          
          {/* Title and Action Buttons */}
          <div className="flex justify-between items-center flex-wrap gap-2">
            <h4 className="title-font text-sm font-black text-[#4b2c20] uppercase">
              {t.ledger_transactions}
            </h4>
            <div className="flex gap-2 flex-wrap items-center">
              {selectedTxIds.length > 0 && (
                <>
                  {!isEditing ? (
                    <>
                      <button
                        type="button"
                        onClick={handleDuplicateSelectedTransactions}
                        className="px-3 py-1.5 bg-[#b8860b] border-2 border-[#d4af37]/30 text-white font-black text-[9px] uppercase tracking-wider rounded-lg shadow-sm hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer animate-in fade-in zoom-in duration-150"
                      >
                        <span>📋</span> {t('duplicate') || 'Duplicate'}
                      </button>
                      <button
                        type="button"
                        onClick={handleDeleteSelectedTransactions}
                        className="px-3 py-1.5 bg-[#8b0000] border-2 border-[#ffd700]/30 text-[#ffd700] font-black text-[9px] uppercase tracking-wider rounded-lg shadow-sm hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer animate-in fade-in zoom-in duration-150"
                      >
                        <span>🗑️</span> {t('delete') || 'Delete'}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={handleSaveEdits}
                        className="px-3 py-1.5 bg-emerald-700 border-2 border-emerald-500/30 text-white font-black text-[9px] uppercase tracking-wider rounded-lg shadow-sm hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer animate-in fade-in zoom-in duration-150"
                      >
                        <span>💾</span> {t('save') || 'Save'}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEditing}
                        className="px-3 py-1.5 bg-rose-700 border-2 border-rose-500/30 text-white font-black text-[9px] uppercase tracking-wider rounded-lg shadow-sm hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer animate-in fade-in zoom-in duration-150"
                      >
                        <span>✕</span> {t('cancel') || 'Cancel'}
                      </button>
                    </>
                  )}
                </>
              )}
              <button
                type="button"
                onClick={onNewTransaction}
                className="px-3 py-1.5 bg-[#8b4513] border-2 border-[#d4af37]/30 text-[#ffd700] font-black text-[9px] uppercase tracking-wider rounded-lg shadow-sm hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                title={t.register_movement}
              >
                <span>➕</span> {t.register_movement}
              </button>
              <button
                type="button"
                onClick={exportCSV}
                className="px-3 py-1.5 bg-[#faf4e5]/90 border-2 border-[#8b4513]/30 text-[#4b2c20] font-black text-[9px] uppercase tracking-wider rounded-lg shadow-sm hover:bg-[#8b4513]/10 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                title={t.export_csv}
              >
                <span>📤</span> {t.export_csv}
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current.click()}
                className="px-3 py-1.5 bg-[#faf4e5]/90 border-2 border-[#8b4513]/30 text-[#4b2c20] font-black text-[9px] uppercase tracking-wider rounded-lg shadow-sm hover:bg-[#8b4513]/10 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                title={t.import_csv}
              >
                <span>📥</span> {t.import_csv}
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={importCSV}
                accept=".csv"
                className="hidden"
              />

              <button
                type="button"
                onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
                className="px-3 py-1.5 bg-[#faf4e5]/90 border-2 border-[#8b4513]/30 text-[#4b2c20] font-black text-[9px] uppercase tracking-wider rounded-lg shadow-sm hover:bg-[#8b4513]/10 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>🔍</span> {isFiltersExpanded ? t.hide_filters : t.show_filters}
              </button>
            </div>
          </div>

          {/* Collapsible Filter Panel */}
          {isFiltersExpanded && (
            <div className="bg-[#faf4e5]/50 border border-[#8b4513]/20 rounded-xl p-4 animate-in slide-in-from-top-2 duration-200">
              <div className="flex justify-between items-center border-b border-[#8b4513]/15 pb-2 mb-3">
                <span className="text-[9px] font-black uppercase text-[#5d4037]/80 tracking-wider">{t.active_filters}</span>
                <button
                  type="button"
                  onClick={() => {
                    setFilterStatus('All');
                    setFilterYear('All');
                    setFilterMonth('All');
                    setFilterFrom('All');
                    setFilterClass('All');
                    setFilterCategory('All');
                    setFilterEntity('All');
                    toast.success(t.filters_cleared);
                  }}
                  className="text-[9px] font-black text-rose-800 hover:text-rose-955 uppercase transition-colors cursor-pointer"
                >
                  {t.clear_all}
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
                {/* Status */}
                <div>
                  <label className="block text-[8px] font-black uppercase text-[#5d4037]/75 mb-0.5 font-sans">{t.status}</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full bg-[#faf4e5] border border-[#8b4513]/25 rounded px-1.5 py-1 text-[10px] font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]"
                  >
                    <option value="All">{t.all_types || 'All Statuses'}</option>
                    {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                {/* Year */}
                <div>
                  <label className="block text-[8px] font-black uppercase text-[#5d4037]/75 mb-0.5 font-sans">{t.year_label}</label>
                  <select
                    value={filterYear}
                    onChange={(e) => setFilterYear(e.target.value)}
                    className="w-full bg-[#faf4e5] border border-[#8b4513]/25 rounded px-1.5 py-1 text-[10px] font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]"
                  >
                    <option value="All">{t.all_years}</option>
                    {uniqueYears.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>

                {/* Month */}
                <div>
                  <label className="block text-[8px] font-black uppercase text-[#5d4037]/75 mb-0.5 font-sans">{t.month_label}</label>
                  <select
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(e.target.value)}
                    className="w-full bg-[#faf4e5] border border-[#8b4513]/25 rounded px-1.5 py-1 text-[10px] font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]"
                  >
                    <option value="All">{t.all_months}</option>
                    {monthOptions.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>

                {/* From */}
                <div>
                  <label className="block text-[8px] font-black uppercase text-[#5d4037]/75 mb-0.5 font-sans">{t.origin_from}</label>
                  <select
                    value={filterFrom}
                    onChange={(e) => setFilterFrom(e.target.value)}
                    className="w-full bg-[#faf4e5] border border-[#8b4513]/25 rounded px-1.5 py-1 text-[10px] font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]"
                  >
                    <option value="All">{t.all_from}</option>
                    {fromOptions.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>

                {/* Type */}
                <div>
                  <label className="block text-[8px] font-black uppercase text-[#5d4037]/75 mb-0.5 font-sans">{t.type || 'Type'}</label>
                  <select
                    value={filterClass}
                    onChange={(e) => setFilterClass(e.target.value)}
                    className="w-full bg-[#faf4e5] border border-[#8b4513]/25 rounded px-1.5 py-1 text-[10px] font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]"
                  >
                    <option value="All">{t.all_types || 'All Types'}</option>
                    {classOptions.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-[8px] font-black uppercase text-[#5d4037]/75 mb-0.5 font-sans">{t.category_label || 'Category'}</label>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="w-full bg-[#faf4e5] border border-[#8b4513]/25 rounded px-1.5 py-1 text-[10px] font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]"
                  >
                    <option value="All">{t.all_categories || 'All Categories'}</option>
                    {categoryOptions.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* Entity */}
                <div>
                  <label className="block text-[8px] font-black uppercase text-[#5d4037]/75 mb-0.5 font-sans">{t.entity}</label>
                  <select
                    value={filterEntity}
                    onChange={(e) => setFilterEntity(e.target.value)}
                    className="w-full bg-[#faf4e5] border border-[#8b4513]/25 rounded px-1.5 py-1 text-[10px] font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]"
                  >
                    <option value="All">{t.all_types || 'All Entities'}</option>
                    {entityOptions.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Ledger Data Table */}
          <div className="max-h-[340px] overflow-y-auto border border-[#8b4513]/25 rounded-xl bg-[#faf4e5]/40 custom-scrollbar shadow-inner flex-grow">
            {filteredTransactions.length > 0 ? (
              <>
                {/* Desktop Table View */}
                <table className="hidden md:table w-full text-left border-collapse text-[10px] font-sans">
                  <thead>
                    <tr className="bg-[#8b4513] border-b border-[#8b4513]/20 text-[#ffd700] font-black uppercase tracking-wider title-font sticky top-0 z-20">
                      <th className="py-2.5 px-3 w-8">
                        <input
                          type="checkbox"
                          checked={filteredTransactions.length > 0 && selectedTxIds.length === filteredTransactions.length}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTxIds(filteredTransactions.map(t => t.id));
                            } else {
                              setSelectedTxIds([]);
                            }
                          }}
                          className="w-3.5 h-3.5 rounded border border-[#8b4513]/30 accent-[#ffd700] cursor-pointer"
                        />
                      </th>
                      <TableSortHeader
                        label={t('ledger.headers.status')}
                        field="status"
                        sortField={sortField}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                        className="py-2.5 px-3 whitespace-nowrap text-left hover:bg-[#70300d]"
                      />
                      <TableSortHeader
                        label={t('ledger.headers.date')}
                        field="date"
                        sortField={sortField}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                        className="py-2.5 px-3 whitespace-nowrap text-left hover:bg-[#70300d]"
                      />
                      <TableSortHeader
                        label={t('ledger.headers.due_date') || 'Due Date'}
                        field="due_date"
                        sortField={sortField}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                        className="py-2.5 px-3 whitespace-nowrap text-left hover:bg-[#70300d]"
                      />
                      <TableSortHeader
                        label={t('ledger.headers.from')}
                        field="from"
                        sortField={sortField}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                        className="py-2.5 px-3 whitespace-nowrap text-left hover:bg-[#70300d]"
                      />
                      <TableSortHeader
                        label={t('ledger.headers.type')}
                        field="type"
                        sortField={sortField}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                        className="py-2.5 px-3 whitespace-nowrap text-left hover:bg-[#70300d]"
                      />
                      <TableSortHeader
                        label={t('ledger.headers.category')}
                        field="category"
                        sortField={sortField}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                        className="py-2.5 px-3 whitespace-nowrap text-left hover:bg-[#70300d]"
                      />
                      <TableSortHeader
                        label={t('ledger.headers.entity')}
                        field="entity"
                        sortField={sortField}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                        className="py-2.5 px-3 whitespace-nowrap text-left hover:bg-[#70300d]"
                      />
                      <TableSortHeader
                        label={t('ledger.headers.amount')}
                        field="amount"
                        sortField={sortField}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                        className="py-2.5 px-3 whitespace-nowrap text-right hover:bg-[#70300d]"
                      />
                      <th className="py-2.5 px-3 whitespace-nowrap text-right">{t('edit') || 'Edit'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#8b4513]/10 text-stone-700 font-bold">
                    {sortedTransactions.map((tx) => {
                      const isTxEditing = isEditing && selectedTxIds.includes(tx.id);
                      if (isTxEditing) {
                        return (
                          <tr key={tx.id} className="hover:bg-[#8b4513]/5 transition-colors bg-[#faf4e5]/80">
                            <td className="py-2 px-3 whitespace-nowrap w-8">
                              <input
                                type="checkbox"
                                checked={selectedTxIds.includes(tx.id)}
                                onChange={() => {
                                  setSelectedTxIds(prev => 
                                    prev.includes(tx.id) 
                                      ? prev.filter(id => id !== tx.id) 
                                      : [...prev, tx.id]
                                  );
                                }}
                                className="w-3.5 h-3.5 rounded border border-[#8b4513]/30 accent-[#8b4513] cursor-pointer"
                              />
                            </td>
                            <td className="py-2 px-3 whitespace-nowrap">
                              <select
                                value={editingTxs[tx.id]?.payment_status || 'Completed'}
                                onChange={e => handleFieldChange(tx.id, 'payment_status', e.target.value)}
                                className="w-full bg-[#faf4e5]/90 border border-[#8b4513]/30 rounded text-[9px] font-bold text-[#4b2c20] focus:outline-none px-1 py-0.5 font-sans"
                              >
                                {['Completed', 'Pending', 'Overdue', 'Paid on Time', 'Paid Late', 'Open', 'Paid'].map(opt => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                            </td>
                            <td className="py-2 px-3 whitespace-nowrap">
                              <input
                                type="date"
                                value={editingTxs[tx.id]?.posting_date || ''}
                                onChange={e => handleFieldChange(tx.id, 'posting_date', e.target.value)}
                                className="w-24 bg-[#faf4e5]/90 border border-[#8b4513]/30 rounded text-[9px] font-bold text-[#4b2c20] focus:outline-none px-1 py-0.5 font-sans"
                              />
                            </td>
                            <td className="py-2 px-3 whitespace-nowrap">
                              <input
                                type="date"
                                value={editingTxs[tx.id]?.due_date || ''}
                                onChange={e => handleFieldChange(tx.id, 'due_date', e.target.value)}
                                className="w-24 bg-[#faf4e5]/90 border border-[#8b4513]/30 rounded text-[9px] font-bold text-[#4b2c20] focus:outline-none px-1 py-0.5 font-sans"
                              />
                            </td>
                            <td className="py-2 px-3 whitespace-nowrap">
                              <input
                                type="text"
                                value={editingTxs[tx.id]?.from || ''}
                                onChange={e => handleFieldChange(tx.id, 'from', e.target.value)}
                                className="w-full bg-[#faf4e5]/90 border border-[#8b4513]/30 rounded text-[9px] font-bold text-[#4b2c20] focus:outline-none px-1 py-0.5 font-sans"
                              />
                            </td>
                            <td className="py-2 px-3 whitespace-nowrap">
                              <select
                                value={editingTxs[tx.id]?.transaction_type || 'Income'}
                                onChange={e => handleFieldChange(tx.id, 'transaction_type', e.target.value)}
                                className="w-full bg-[#faf4e5]/90 border border-[#8b4513]/30 rounded text-[9px] font-bold text-[#4b2c20] focus:outline-none px-1 py-0.5 font-sans"
                              >
                                {classOptions.map(opt => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                            </td>
                            <td className="py-2 px-3 whitespace-nowrap">
                              <select
                                value={editingTxs[tx.id]?.transaction_category || ''}
                                onChange={e => handleFieldChange(tx.id, 'transaction_category', e.target.value)}
                                className="w-full bg-[#faf4e5]/90 border border-[#8b4513]/30 rounded text-[9px] font-bold text-[#4b2c20] focus:outline-none px-1 py-0.5 font-sans"
                              >
                                <option value="">-</option>
                                {categoryOptions.map(opt => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                            </td>
                            <td className="py-2 px-3 whitespace-nowrap">
                              <select
                                value={editingTxs[tx.id]?.entity || ''}
                                onChange={e => handleFieldChange(tx.id, 'entity', e.target.value)}
                                className="w-full bg-[#faf4e5]/90 border border-[#8b4513]/30 rounded text-[9px] font-bold text-[#4b2c20] focus:outline-none px-1 py-0.5 font-sans"
                              >
                                <option value="">-</option>
                                {entityOptions.map(opt => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                            </td>
                            <td className="py-2 px-3 whitespace-nowrap">
                              <input
                                type="number"
                                value={editingTxs[tx.id]?.amount || 0}
                                onChange={e => handleFieldChange(tx.id, 'amount', e.target.value)}
                                className="w-20 bg-[#faf4e5]/90 border border-[#8b4513]/30 rounded text-[9px] font-bold text-[#4b2c20] focus:outline-none px-1 py-0.5 font-mono text-right"
                              />
                            </td>
                            <td className="py-2 px-3 whitespace-nowrap text-right"></td>
                          </tr>
                        );
                      }

                      return (
                        <tr key={tx.id} className="hover:bg-[#8b4513]/5 transition-colors">
                          <td className="py-2 px-3 whitespace-nowrap w-8">
                            <input
                              type="checkbox"
                              checked={selectedTxIds.includes(tx.id)}
                              onChange={() => {
                                setSelectedTxIds(prev => 
                                  prev.includes(tx.id) 
                                    ? prev.filter(id => id !== tx.id) 
                                    : [...prev, tx.id]
                                );
                              }}
                              disabled={isEditing && !selectedTxIds.includes(tx.id)}
                              className="w-3.5 h-3.5 rounded border border-[#8b4513]/30 accent-[#8b4513] cursor-pointer"
                            />
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap">
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                              tx.payment_status === 'Completed' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                              tx.payment_status === 'Paid on Time' ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' :
                              tx.payment_status === 'Pending' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                              tx.payment_status === 'Overdue' ? 'bg-red-100 text-red-800 border border-red-200' :
                              'bg-stone-100 text-stone-800 border border-stone-200'
                            }`}>
                              {tx.payment_status || 'Completed'}
                            </span>
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap text-stone-600">{tx.posting_date || tx.value_date || '-'}</td>
                          <td className="py-2 px-3 whitespace-nowrap text-stone-600">{tx.due_date || '-'}</td>
                          <td className="py-2 px-3 whitespace-nowrap font-bold text-[#4b2c20]">{tx.from || '-'}</td>
                          <td className="py-2 px-3 whitespace-nowrap">
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                              tx.flow === 'inflow' 
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                                : tx.flow === 'outflow'
                                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                  : 'bg-stone-100 text-stone-800 border border-stone-200'
                            }`}>
                              {tx.transaction_type}
                            </span>
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap text-stone-600">{entityMappings[tx.entity] || tx.transaction_category || '-'}</td>
                          <td className="py-2 px-3 whitespace-nowrap text-stone-600">{tx.entity || '-'}</td>
                          <td className={`py-2 px-3 whitespace-nowrap text-right font-mono font-black ${
                            tx.flow === 'inflow' ? 'text-emerald-700' : (tx.flow === 'outflow' ? 'text-rose-700' : 'text-stone-600')
                          }`}>
                            {tx.flow === 'inflow' ? '+' : (tx.flow === 'outflow' ? '-' : '')}{Number(tx.amount).toLocaleString()}g
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap text-right">
                            <button
                              type="button"
                              onClick={() => onEditTransaction(tx)}
                              className="text-[#b8860b] hover:text-[#d4af37] font-black px-2 py-0.5 rounded border border-[#8b4513]/25 hover:bg-[#8b4513]/10 transition-all cursor-pointer"
                              title="Edit Transaction"
                            >
                              ✏️
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </>
            ) : (
              <p className="text-center py-12 text-xs text-[#5d4037]/60 italic font-serif">
                {t('no_transactions_registered', 'No transactions registered in this list.')}
              </p>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
