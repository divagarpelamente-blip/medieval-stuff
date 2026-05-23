import React, { useEffect, useState } from 'react';
import { Search, Filter, ArrowUpDown, ChevronLeft, ChevronRight, Edit3, Save, Trash2, CheckSquare, Square, X, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'react-hot-toast';
import Modal from '../Modal';
import { MONTHS, TRANSACTION_TYPES, QUEST_TYPES, PAYMENT_METHODS, RECORD_STATUSES } from '../../utils/constants';

import { Th, Td } from './TableCells';

const RecordsTable = ({ userId }) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedRecords, setEditedRecords] = useState({});
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [filterOpen, setFilterOpen] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [entities, setEntities] = useState([]);
  const [filters, setFilters] = useState({
    type: 'All',
    status: 'All',
    month: 'All',
    year: 'All'
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchRecords();
      fetchAccounts();
      fetchEntities();
    }
  }, [userId]);

  const fetchAccounts = async () => {
    if (!userId) return;
    const { data } = await supabase.from('treasury_accounts').select('id, name').eq('profile_id', userId);
    setAccounts(data || []);
  };

  const fetchEntities = async () => {
    if (!userId) return;
    const { data } = await supabase.from('treasury_entities').select('name').eq('profile_id', userId).order('name', { ascending: true });
    setEntities(data || []);
  };

  const fetchRecords = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('treasury_records')
        .select('*')
        .eq('profile_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRecords(data || []);
    } catch (err) {
      console.error('Error fetching records:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (id, field, value) => {
    setEditedRecords(prev => ({
      ...prev,
      [id]: {
        ...(prev[id] || records.find(r => r.id === id)),
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    const updates = Object.values(editedRecords);
    if (updates.length === 0) {
      setIsEditing(false);
      return;
    }

    setLoading(true);
    try {
      for (const record of updates) {
        const { error } = await supabase
          .from('treasury_records')
          .update(record)
          .eq('id', record.id);
        
        if (error) throw error;
      }
      await fetchRecords();
      setEditedRecords({});
      setIsEditing(false);
      toast.success('Archive successfully updated, Sire.');
    } catch (err) {
      console.error('Error saving records:', err);
      toast.error('The scribes failed to update the ledger: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDeleteClick = () => {
    if (selectedIds.size === 0) {
      toast.error('No records selected for deletion.');
      return;
    }
    setShowDeleteConfirm(true);
  };

  const confirmBulkDelete = async () => {
    setShowDeleteConfirm(false);
    setLoading(true);
    try {
      const idsToDelete = Array.from(selectedIds);
      const { error } = await supabase
        .from('treasury_records')
        .delete()
        .in('id', idsToDelete);

      if (error) throw error;

      toast.success(`${selectedIds.size} records successfully banished from history.`);
      setSelectedIds(new Set());
      await fetchRecords();
    } catch (err) {
      console.error('Error deleting records:', err);
      toast.error('The executioner failed to remove the records: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredRecords.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredRecords.map(r => r.id)));
    }
  };

  const toggleSelectOne = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Filter Logic
  const filteredRecords = records.filter(record => {
    const matchesSearch = 
      (record.from_source?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (record.entity?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (record.description?.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = filters.type === 'All' || record.transaction_type === filters.type;
    const matchesStatus = filters.status === 'All' || record.status === filters.status;
    const matchesMonth = filters.month === 'All' || record.month === filters.month;
    const matchesYear = filters.year === 'All' || record.year === filters.year;

    return matchesSearch && matchesType && matchesStatus && matchesMonth && matchesYear;
  });

  const handleExportExcel = () => {
    if (filteredRecords.length === 0) {
      toast.error('No records found to export.');
      return;
    }

    try {
      const exportData = filteredRecords.map(record => ({
        'From': record.from_source || '',
        'Month': record.month || '',
        'Year': record.year || '',
        'Entity': record.entity || '',
        'Limit (Gold)': record.limit_amount || 0,
        'Expense Outflow (Gold)': record.expense_amount || 0,
        'Receipt Inflow (Gold)': record.payment_receipt_cash || 0,
        'Interests': record.interests || 0,
        'Late Fee': record.late_fee_interests || 0,
        'Penalties': record.penalties || 0,
        'Tax': record.tax || 0,
        'Losses (Shield Impact)': record.losses || 0,
        'Quest Type': record.quest_type || 'Production',
        'Paid With': record.paid_with || 'Debit',
        'Type': record.transaction_type || 'Income',
        'Account Link': record.treasury_accounts?.name || 'None',
        'Status': record.status || 'Paid',
        'Description (Notes)': record.description || ''
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Royal Ledger Records');
      
      XLSX.writeFile(workbook, `Royal_Ledger_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Royal records successfully exported to Excel!');
    } catch (err) {
      console.error('Error exporting to Excel:', err);
      toast.error('Failed to export to Excel: ' + err.message);
    }
  };

  return (
    <div className="space-y-4 py-2 text-[#2d1e1e]">
      {/* Controls Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4b2c20]/40" size={16} />
          <input 
            type="text" 
            placeholder="Search records..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/40 border-2 border-[#4b2c20]/20 rounded-xl pl-9 pr-4 py-2 text-sm font-bold text-[#4b2c20] placeholder:text-[#4b2c20]/30 outline-none focus:border-[#4b2c20]/40 transition-all"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 w-full sm:w-auto">
          <button 
            onClick={() => setFilterOpen(!filterOpen)}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border-2 transition-all active:scale-95 ${filterOpen ? 'bg-[#4b2c20] border-[#4b2c20] text-[#f4e4bc]' : 'bg-white/40 border-[#4b2c20]/20 text-[#4b2c20] hover:bg-white/60'}`}
          >
            <Filter size={14} /> Filter
          </button>

          <button 
            onClick={handleExportExcel}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider rounded-xl hover:scale-105 active:scale-95 transition-all shadow-md"
          >
            <FileSpreadsheet size={14} /> Export to Excel
          </button>

          {isEditing ? (
            <button 
              onClick={handleSave}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2 bg-emerald-800 text-white text-xs font-black uppercase tracking-wider rounded-xl hover:scale-105 active:scale-95 transition-all shadow-md"
            >
              <Save size={14} /> Save Changes
            </button>
          ) : (
            <button 
              onClick={() => setIsEditing(true)}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2 bg-[#4b2c20] text-white text-xs font-black uppercase tracking-wider rounded-xl hover:scale-105 active:scale-95 transition-all shadow-md"
            >
              <Edit3 size={14} /> Quick Edit
            </button>
          )}

          {selectedIds.size > 0 && (
            <button 
              onClick={handleBulkDeleteClick}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-red-800 text-white text-xs font-black uppercase tracking-wider rounded-xl hover:scale-105 active:scale-95 transition-all shadow-md"
            >
              <Trash2 size={14} /> Delete ({selectedIds.size})
            </button>
          )}
        </div>
      </div>

      {/* Filter Box */}
      {filterOpen && (
        <div className="bg-white/40 border-2 border-[#4b2c20]/10 rounded-2xl p-4 grid grid-cols-2 md:grid-cols-4 gap-4 animate-in slide-in-from-top duration-250">
          <div>
            <label className="block text-[9px] font-black uppercase tracking-widest text-[#4b2c20]/60 mb-1 ml-1">Type</label>
            <select 
              value={filters.type} 
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
              className="w-full bg-white/60 border-2 border-[#4b2c20]/20 rounded-xl px-3 py-1.5 text-xs font-bold text-[#4b2c20] outline-none"
            >
              <option value="All">All Types</option>
              {TRANSACTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[9px] font-black uppercase tracking-widest text-[#4b2c20]/60 mb-1 ml-1">Status</label>
            <select 
              value={filters.status} 
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full bg-white/60 border-2 border-[#4b2c20]/20 rounded-xl px-3 py-1.5 text-xs font-bold text-[#4b2c20] outline-none"
            >
              <option value="All">All Statuses</option>
              {RECORD_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[9px] font-black uppercase tracking-widest text-[#4b2c20]/60 mb-1 ml-1">Month</label>
            <select 
              value={filters.month} 
              onChange={(e) => setFilters(prev => ({ ...prev, month: e.target.value }))}
              className="w-full bg-white/60 border-2 border-[#4b2c20]/20 rounded-xl px-3 py-1.5 text-xs font-bold text-[#4b2c20] outline-none"
            >
              <option value="All">All Months</option>
              {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[9px] font-black uppercase tracking-widest text-[#4b2c20]/60 mb-1 ml-1">Year</label>
            <input 
              type="text" 
              placeholder="e.g. 2026"
              value={filters.year === 'All' ? '' : filters.year} 
              onChange={(e) => setFilters(prev => ({ ...prev, year: e.target.value || 'All' }))}
              className="w-full bg-white/60 border-2 border-[#4b2c20]/20 rounded-xl px-3 py-1.5 text-xs font-bold text-[#4b2c20] outline-none"
            />
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="overflow-x-auto border-2 border-[#4b2c20]/15 rounded-2xl bg-white/30 backdrop-blur-sm max-h-[50vh] custom-scrollbar">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-[#4b2c20]/5">
              <th className="px-4 py-3 border-b-2 border-[#4b2c20]/20 text-left w-10">
                <button onClick={toggleSelectAll} className="text-[#4b2c20]/40 hover:text-[#4b2c20] transition-colors">
                  {selectedIds.size === filteredRecords.length && filteredRecords.length > 0 ? <CheckSquare size={16} /> : <Square size={16} />}
                </button>
              </th>
              <Th>From</Th>
              <Th>Month</Th>
              <Th>Year</Th>
              <Th>Entity</Th>
              <Th>Limit</Th>
              <Th>Expense</Th>
              <Th>Cash</Th>
              <Th>Interest</Th>
              <Th>Late Fee</Th>
              <Th>Penalties</Th>
              <Th>Tax</Th>
              <Th>Losses</Th>
              <Th>Quest Type</Th>
              <Th>Paid With</Th>
              <Th>Type</Th>
              <Th>Account Link</Th>
              <Th>Status</Th>
              <Th>Description</Th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="19" className="py-20 text-center italic text-[#2d1e1e]/40">Consulting the archives...</td>
              </tr>
            ) : filteredRecords.length === 0 ? (
              <tr>
                <td colSpan="19" className="py-20 text-center italic text-[#2d1e1e]/40">No entries found for this query.</td>
              </tr>
            ) : (
              filteredRecords.map((record) => (
                <tr key={record.id} className={`hover:bg-[#4b2c20]/5 transition-colors group ${selectedIds.has(record.id) ? 'bg-[#4b2c20]/10' : ''}`}>
                  <td className="px-4 py-3 border-b border-[#4b2c20]/5">
                    <button onClick={() => toggleSelectOne(record.id)} className="text-[#4b2c20]/40 group-hover:text-[#4b2c20]">
                      {selectedIds.has(record.id) ? <CheckSquare size={16} /> : <Square size={16} />}
                    </button>
                  </td>
                  <Td recordId={record.id} field="from_source" className="font-bold" isEditing={isEditing} editedRecords={editedRecords} records={records} handleFieldChange={handleFieldChange} transactionTypes={TRANSACTION_TYPES} accounts={accounts} entities={entities} questTypes={QUEST_TYPES} paymentMethods={PAYMENT_METHODS} recordStatuses={RECORD_STATUSES}>{record.from_source}</Td>
                  <Td recordId={record.id} field="month" isEditing={isEditing} editedRecords={editedRecords} records={records} handleFieldChange={handleFieldChange} transactionTypes={TRANSACTION_TYPES} accounts={accounts} entities={entities} questTypes={QUEST_TYPES} paymentMethods={PAYMENT_METHODS} recordStatuses={RECORD_STATUSES}>{record.month}</Td>
                  <Td recordId={record.id} field="year" isEditing={isEditing} editedRecords={editedRecords} records={records} handleFieldChange={handleFieldChange} transactionTypes={TRANSACTION_TYPES} accounts={accounts} entities={entities} questTypes={QUEST_TYPES} paymentMethods={PAYMENT_METHODS} recordStatuses={RECORD_STATUSES}>{record.year}</Td>
                  <Td recordId={record.id} field="entity" isEditing={isEditing} editedRecords={editedRecords} records={records} handleFieldChange={handleFieldChange} transactionTypes={TRANSACTION_TYPES} accounts={accounts} entities={entities} questTypes={QUEST_TYPES} paymentMethods={PAYMENT_METHODS} recordStatuses={RECORD_STATUSES}>{record.entity}</Td>
                  <Td recordId={record.id} field="limit_amount" type="number" className="font-mono" isEditing={isEditing} editedRecords={editedRecords} records={records} handleFieldChange={handleFieldChange} transactionTypes={TRANSACTION_TYPES} accounts={accounts} entities={entities} questTypes={QUEST_TYPES} paymentMethods={PAYMENT_METHODS} recordStatuses={RECORD_STATUSES}>${record.limit_amount || 0}</Td>
                  <Td recordId={record.id} field="expense_amount" type="number" className="font-mono text-red-700" isEditing={isEditing} editedRecords={editedRecords} records={records} handleFieldChange={handleFieldChange} transactionTypes={TRANSACTION_TYPES} accounts={accounts} entities={entities} questTypes={QUEST_TYPES} paymentMethods={PAYMENT_METHODS} recordStatuses={RECORD_STATUSES}>-${record.expense_amount || 0}</Td>
                  <Td recordId={record.id} field="payment_receipt_cash" type="number" className="font-mono text-emerald-700" isEditing={isEditing} editedRecords={editedRecords} records={records} handleFieldChange={handleFieldChange} transactionTypes={TRANSACTION_TYPES} accounts={accounts} entities={entities} questTypes={QUEST_TYPES} paymentMethods={PAYMENT_METHODS} recordStatuses={RECORD_STATUSES}>${record.payment_receipt_cash || 0}</Td>
                  <Td recordId={record.id} field="interests" type="number" className="font-mono" isEditing={isEditing} editedRecords={editedRecords} records={records} handleFieldChange={handleFieldChange} transactionTypes={TRANSACTION_TYPES} accounts={accounts} entities={entities} questTypes={QUEST_TYPES} paymentMethods={PAYMENT_METHODS} recordStatuses={RECORD_STATUSES}>${record.interests || 0}</Td>
                  <Td recordId={record.id} field="late_fee_interests" type="number" className="font-mono" isEditing={isEditing} editedRecords={editedRecords} records={records} handleFieldChange={handleFieldChange} transactionTypes={TRANSACTION_TYPES} accounts={accounts} entities={entities} questTypes={QUEST_TYPES} paymentMethods={PAYMENT_METHODS} recordStatuses={RECORD_STATUSES}>${record.late_fee_interests || 0}</Td>
                  <Td recordId={record.id} field="penalties" type="number" className="font-mono" isEditing={isEditing} editedRecords={editedRecords} records={records} handleFieldChange={handleFieldChange} transactionTypes={TRANSACTION_TYPES} accounts={accounts} entities={entities} questTypes={QUEST_TYPES} paymentMethods={PAYMENT_METHODS} recordStatuses={RECORD_STATUSES}>${record.penalties || 0}</Td>
                  <Td recordId={record.id} field="tax" type="number" className="font-mono text-red-650" isEditing={isEditing} editedRecords={editedRecords} records={records} handleFieldChange={handleFieldChange} transactionTypes={TRANSACTION_TYPES} accounts={accounts} entities={entities} questTypes={QUEST_TYPES} paymentMethods={PAYMENT_METHODS} recordStatuses={RECORD_STATUSES}>${record.tax || 0}</Td>
                  <Td recordId={record.id} field="losses" type="number" className="font-mono text-red-900" isEditing={isEditing} editedRecords={editedRecords} records={records} handleFieldChange={handleFieldChange} transactionTypes={TRANSACTION_TYPES} accounts={accounts} entities={entities} questTypes={QUEST_TYPES} paymentMethods={PAYMENT_METHODS} recordStatuses={RECORD_STATUSES}>${record.losses || 0}</Td>
                  <Td recordId={record.id} field="quest_type" isEditing={isEditing} editedRecords={editedRecords} records={records} handleFieldChange={handleFieldChange} transactionTypes={TRANSACTION_TYPES} accounts={accounts} entities={entities} questTypes={QUEST_TYPES} paymentMethods={PAYMENT_METHODS} recordStatuses={RECORD_STATUSES}>{record.quest_type || '-'}</Td>
                  <Td recordId={record.id} field="paid_with" isEditing={isEditing} editedRecords={editedRecords} records={records} handleFieldChange={handleFieldChange} transactionTypes={TRANSACTION_TYPES} accounts={accounts} entities={entities} questTypes={QUEST_TYPES} paymentMethods={PAYMENT_METHODS} recordStatuses={RECORD_STATUSES}>{record.paid_with}</Td>
                  <Td recordId={record.id} field="transaction_type" isEditing={isEditing} editedRecords={editedRecords} records={records} handleFieldChange={handleFieldChange} transactionTypes={TRANSACTION_TYPES} accounts={accounts} entities={entities} questTypes={QUEST_TYPES} paymentMethods={PAYMENT_METHODS} recordStatuses={RECORD_STATUSES}>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${(record.transaction_type?.toLowerCase() === 'income' || record.transaction_type?.toLowerCase() === 'earning') ? 'bg-emerald-500/20 text-emerald-800' : 'bg-red-500/20 text-red-800'}`}>
                      {record.transaction_type}
                    </span>
                  </Td>
                  <Td recordId={record.id} field="account_id" isEditing={isEditing} editedRecords={editedRecords} records={records} handleFieldChange={handleFieldChange} transactionTypes={TRANSACTION_TYPES} accounts={accounts} entities={entities} questTypes={QUEST_TYPES} paymentMethods={PAYMENT_METHODS} recordStatuses={RECORD_STATUSES}>
                    <span className="text-[10px] font-bold text-[#4b2c20]/60 italic">
                      {accounts.find(a => a.id === record.account_id)?.name || '-'}
                    </span>
                  </Td>
                  <Td recordId={record.id} field="status" isEditing={isEditing} editedRecords={editedRecords} records={records} handleFieldChange={handleFieldChange} transactionTypes={TRANSACTION_TYPES} accounts={accounts} entities={entities} questTypes={QUEST_TYPES} paymentMethods={PAYMENT_METHODS} recordStatuses={RECORD_STATUSES}>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${record.status === 'Paid' ? 'bg-blue-500/20 text-blue-800' : record.status === 'Overdue' ? 'bg-red-550/20 text-red-800' : 'bg-amber-500/20 text-amber-800'}`}>
                      {record.status}
                    </span>
                  </Td>
                  <Td recordId={record.id} field="description" isEditing={isEditing} editedRecords={editedRecords} records={records} handleFieldChange={handleFieldChange} transactionTypes={TRANSACTION_TYPES} accounts={accounts} entities={entities} questTypes={QUEST_TYPES} paymentMethods={PAYMENT_METHODS} recordStatuses={RECORD_STATUSES}>
                    <div className="max-w-xs truncate" title={record.description}>{record.description || '-'}</div>
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Placeholder */}
      <div className="flex justify-between items-center mt-4 px-2">
        <span className="text-[10px] font-black text-[#4b2c20]/40 uppercase tracking-[0.2em]">
          Record Count: {filteredRecords.length}
        </span>
        <div className="flex gap-2">
          <button className="p-2 hover:bg-black/5 rounded-lg transition-all"><ChevronLeft size={16} /></button>
          <button className="p-2 hover:bg-black/5 rounded-lg transition-all"><ChevronRight size={16} /></button>
        </div>
      </div>

      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Banish Records"
        footer={
          <div className="flex gap-4 w-full">
            <button 
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1 py-3 bg-white/40 border-2 border-[#2d1e1e]/20 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white/60 transition-all text-[#2d1e1e]"
            >
              Cancel
            </button>
            <button 
              onClick={confirmBulkDelete}
              className="flex-1 py-3 bg-red-800 text-white rounded-xl font-black uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <Trash2 size={16} /> Banish {selectedIds.size} Records
            </button>
          </div>
        }
      >
        <div className="space-y-6 text-center">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-red-900/10 rounded-full flex items-center justify-center border-4 border-red-900/20">
              <Trash2 size={40} className="text-red-900" />
            </div>
          </div>
          <div>
            <h3 className="title-font text-xl font-black text-[#2d1e1e] uppercase tracking-widest">Are you certain, Sire?</h3>
            <p className="text-sm italic text-[#4b2c20]/60 mt-2 max-w-sm mx-auto">
              You are about to permanently strike {selectedIds.size} records from the kingdom's history. This action cannot be undone.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default RecordsTable;
