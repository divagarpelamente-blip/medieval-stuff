import React, { useEffect, useState } from 'react';
import { Search, Filter, ArrowUpDown, ChevronLeft, ChevronRight, Edit3, Save, Trash2, CheckSquare, Square, X, FileSpreadsheet, Menu, ArrowRight, Plus, Copy } from 'lucide-react';

import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'react-hot-toast';
import Modal from '../Modal';
import { MONTHS, TRANSACTION_TYPES, QUEST_TYPES, PAYMENT_METHODS, RECORD_STATUSES, toDbQuestType, toUiQuestType } from '../../utils/constants';
import RecordForm from './RecordForm';
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
  const [flowTypes, setFlowTypes] = useState(['Inflow', 'Outflow', 'Investment', 'Savings']);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [isCopyModal, setIsCopyModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsRecord, setDetailsRecord] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    try {
      const savedFlows = localStorage.getItem('medieval_flow_types');
      if (savedFlows) setFlowTypes(JSON.parse(savedFlows));
    } catch (e) {
      console.error(e);
    }
  }, []);

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
      const mapped = (data || []).map(r => ({
        ...r,
        quest_type: toUiQuestType(r.quest_type)
      }));
      setRecords(mapped);
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

  const handleSave = async () => {
    const updates = Object.values(editedRecords);
    if (updates.length === 0) {
      setIsEditing(false);
      return;
    }

    setLoading(true);
    try {
      for (const record of updates) {
        let resolvedAccountId = record.account_id || null;
        if (resolvedAccountId && !resolvedAccountId.match(/^[0-9a-fA-F-]{36}$/)) {
          resolvedAccountId = await getOrCreateAccountByName(resolvedAccountId, userId);
        }

        const updatePayload = {
          ...record,
          account_id: resolvedAccountId,
          quest_type: toDbQuestType(record.quest_type)
        };

        let updateError;
        try {
          const { error } = await supabase
            .from('treasury_records')
            .update(updatePayload)
            .eq('id', record.id);
          updateError = error;
        } catch (err) {
          updateError = err;
        }

        if (updateError && (updateError.code === '42703' || String(updateError.message).includes('flow_type'))) {
          const { flow_type, ...fallbackPayload } = updatePayload;
          const { error: retryError } = await supabase
            .from('treasury_records')
            .update(fallbackPayload)
            .eq('id', record.id);
          if (retryError) throw retryError;
        } else if (updateError) {
          throw updateError;
        }
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

  // Expense/Income column = income_expense (stored net: income - expense)
  // Falls back to computing from raw columns if new column not yet populated
  const getExpenseIncomeSum = (record) => {
    if (record.income_expense != null) return Number(record.income_expense) || 0;
    // Fallback for old rows
    return (Number(record.income_amount) || 0) - (Number(record.expense_amount) || 0);
  };

  // Receipt/Payment column = receipt_payment (stored net: receipt - payment)
  const getReceiptPaymentSum = (record) => {
    if (record.receipt_payment != null) return Number(record.receipt_payment) || 0;
    // Fallback for old rows
    return Number(record.payment_receipt_cash) || 0;
  };


  // Filter Logic
  const filteredRecords = records.filter(record => {
    const term = searchTerm.toLowerCase();
    const expIncVal = getExpenseIncomeSum(record).toString();
    const recPayVal = getReceiptPaymentSum(record).toString();

    const matchesSearch = !searchTerm ||
      (record.from_source?.toLowerCase().includes(term)) ||
      (record.month?.toLowerCase().includes(term)) ||
      (record.year?.toString().toLowerCase().includes(term)) ||
      (record.entity?.toLowerCase().includes(term)) ||
      (expIncVal.includes(term)) ||
      (recPayVal.includes(term)) ||
      (record.description?.toLowerCase().includes(term));

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

  const handleImportCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data;
        if (!rows || rows.length === 0) {
          toast.error('The selected CSV file has no records.');
          return;
        }
        
        setLoading(true);
        try {
          let importCount = 0;
          for (const row of rows) {
            const getVal = (possibleHeaders) => {
              for (const h of possibleHeaders) {
                const key = Object.keys(row).find(k => k.trim().toLowerCase() === h.toLowerCase());
                if (key) return row[key];
              }
              return null;
            };

            const from_source = getVal(['From', 'from_source', 'Source']) || '';
            const month = getVal(['Month', 'month']) || new Date().toLocaleString('default', { month: 'long' });
            const year = getVal(['Year', 'year']) || new Date().getFullYear().toString();
            const entity = getVal(['Entity', 'entity']) || '';
            const limit_amount = Number(getVal(['Limit (Gold)', 'Limit', 'limit_amount'])) || 0;
            const expense_amount = Number(getVal(['Expense Outflow (Gold)', 'Expense', 'Expense/Income (sum)', 'expense_amount'])) || 0;
            const payment_receipt_cash = Number(getVal(['Receipt Inflow (Gold)', 'Cash', 'Receipt/Payment (sum)', 'payment_receipt_cash'])) || 0;
            const interests = Number(getVal(['Interests', 'interests'])) || 0;
            const late_fee_interests = Number(getVal(['Late Fee', 'late_fee_interests'])) || 0;
            const penalties = Number(getVal(['Penalties', 'penalties'])) || 0;
            const tax = Number(getVal(['Tax', 'tax'])) || 0;
            const losses = Number(getVal(['Losses (Shield Impact)', 'Losses', 'losses'])) || 0;
            const quest_type = toDbQuestType(getVal(['Quest Type', 'quest_type']) || 'Production');
            const paid_with = getVal(['Paid With', 'paid_with']) || 'Debit';
            const transaction_type = getVal(['Type', 'transaction_type', 'transaction_type']) || 'Income';
            const status = getVal(['Status', 'status']) || 'Paid';
            const description = getVal(['Description (Notes)', 'Description', 'description', 'Notes']) || '';
            
            // Map form fields to DB columns correctly
            const paymentReceiptCash = Number(formData.payment) || Number(formData.receipt) || 0;
            const expenseAmount = Number(formData.expense) || Number(formData.income) || 0;
            const resolvedAccountId = formData.account_id ? await getOrCreateAccountByName(formData.account_id, userId) : null;
            
            const recordToInsert = {
              from_source,
              month,
              year,
              entity,
              account_id: resolvedAccountId,
              limit_amount,
              expense_amount,
              payment_receipt_cash,
              interests,
              late_fee_interests,
              penalties,
              tax,
              losses,
              quest_type,
              paid_with,
              transaction_type,
              status,
              description,
              profile_id: userId
            };

            let insertError;
            try {
              const flow_type = getVal(['Flow Type', 'flow_type']) || 'Inflow';
              const { error } = await supabase
                .from('treasury_records')
                .insert([{ ...recordToInsert, flow_type }]);
              insertError = error;
            } catch (err) {
              insertError = err;
            }

            if (insertError && (insertError.code === '42703' || String(insertError.message).includes('flow_type'))) {
              const { error: retryError } = await supabase
                .from('treasury_records')
                .insert([recordToInsert]);
              if (retryError) throw retryError;
            } else if (insertError) {
              throw insertError;
            }
            importCount++;
          }
          toast.success(`Successfully imported ${importCount} records from CSV, Sire!`);
          await fetchRecords();
        } catch (err) {
          console.error('Error importing CSV:', err);
          toast.error('The scribes failed to import the CSV: ' + err.message);
        } finally {
          setLoading(false);
        }
      }
    });
  };

  return (
    <div className="space-y-4 py-2 text-[#2d1e1e]">
      {/* Controls Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between relative">
        {/* Left Actions: Search, Filter, Quick Edit */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Search */}
          <div className="relative min-w-[200px] flex-grow sm:flex-grow-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4b2c20]/40" size={16} />
            <input 
              type="text" 
              placeholder="Search records..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/40 border-2 border-[#4b2c20]/20 rounded-xl pl-9 pr-4 py-2 text-sm font-bold text-[#4b2c20] placeholder:text-[#4b2c20]/30 outline-none focus:border-[#4b2c20]/40 transition-all"
            />
          </div>

          {/* Filter */}
          <button 
            onClick={() => setFilterOpen(!filterOpen)}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border-2 transition-all active:scale-95 ${filterOpen ? 'bg-[#4b2c20] border-[#4b2c20] text-[#f4e4bc]' : 'bg-white/40 border-[#4b2c20]/20 text-[#4b2c20] hover:bg-white/60'}`}
          >
            <Filter size={14} /> Filter
          </button>

          {/* Quick Edit */}
          {isEditing ? (
            <div className="flex gap-2">
              <button 
                onClick={handleSave}
                className="flex items-center justify-center gap-2 px-5 py-2 bg-emerald-800 text-white text-xs font-black uppercase tracking-wider rounded-xl hover:scale-105 active:scale-95 transition-all shadow-md"
              >
                <Save size={14} /> Save Changes
              </button>
              <button 
                onClick={() => {
                  setIsEditing(false);
                  setEditedRecords({});
                }}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-white/40 border-2 border-[#2d1e1e]/20 text-[#2d1e1e] text-xs font-black uppercase tracking-wider rounded-xl hover:bg-white/60 active:scale-95 transition-all"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button 
              onClick={() => {
                if (selectedIds.size > 0) {
                  const selectedId = Array.from(selectedIds)[0];
                  const record = records.find(r => r.id === selectedId);
                  if (record) {
                    setEditingRecord(record);
                    setShowEditModal(true);
                  }
                } else {
                  setIsEditing(true);
                }
              }}
              className="flex items-center justify-center gap-2 px-5 py-2 bg-[#4b2c20] text-white text-xs font-black uppercase tracking-wider rounded-xl hover:scale-105 active:scale-95 transition-all shadow-md"
            >
              <Edit3 size={14} /> Quick Edit
            </button>
          )}

          {selectedIds.size > 0 && (
            <>
              <button 
                onClick={() => {
                  const selectedId = Array.from(selectedIds)[0];
                  const record = records.find(r => r.id === selectedId);
                  if (record) {
                    setIsCopyModal(true);
                    setEditingRecord(record);
                    setShowEditModal(true);
                  }
                }}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-amber-800 text-white text-xs font-black uppercase tracking-wider rounded-xl hover:scale-105 active:scale-95 transition-all shadow-md"
              >
                <Copy size={14} /> Copy
              </button>
              <button 
                onClick={handleBulkDeleteClick}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-red-800 text-white text-xs font-black uppercase tracking-wider rounded-xl hover:scale-105 active:scale-95 transition-all shadow-md"
              >
                <Trash2 size={14} /> Delete ({selectedIds.size})
              </button>
            </>
          )}
        </div>

        {/* Dropdown Menu for Export/Import */}
        <div className="relative self-end sm:self-center">
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center justify-center p-2.5 bg-white/40 border-2 border-[#4b2c20]/20 rounded-xl text-[#4b2c20] hover:bg-white/60 transition-all active:scale-95"
            title="Options"
          >
            <Menu size={16} />
          </button>

          {dropdownOpen && (
            <>
              {/* Click-outside overlay */}
              <div
                className="fixed inset-0 z-[80]"
                onClick={() => setDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-52 bg-[#f4e4bc] border-2 border-[#5d4037] rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.25)] z-[90] flex flex-col py-1">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    handleExportExcel();
                  }}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-left text-xs font-black uppercase tracking-wider text-[#4b2c20] hover:bg-[#5d4037]/15 border-b border-[#5d4037]/10 transition-all"
                >
                  <FileSpreadsheet size={14} className="text-emerald-800" /> Export to Excel
                </button>
                <label className="flex items-center gap-2 w-full px-4 py-2.5 text-left text-xs font-black uppercase tracking-wider text-[#4b2c20] hover:bg-[#5d4037]/15 cursor-pointer transition-all">
                  <Plus size={14} className="text-blue-800" /> Import from CSV
                  <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={(e) => {
                      setDropdownOpen(false);
                      handleImportCSV(e);
                    }}
                  />
                </label>
              </div>
            </>
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
              <th className="px-2 py-1.5 border-b-2 border-[#4b2c20]/20 text-left w-8">
                <button onClick={toggleSelectAll} className="text-[#4b2c20]/40 hover:text-[#4b2c20] transition-colors">
                  {selectedIds.size === filteredRecords.length && filteredRecords.length > 0 ? <CheckSquare size={14} /> : <Square size={14} />}
                </button>
              </th>
              <Th>From</Th>
              <Th>Month</Th>
              <Th>Year</Th>
              <Th>Entity</Th>
              <Th>Expense/Income</Th>
              <Th>Receipt/Payment</Th>
              <Th>Description</Th>
              <th className="px-2 py-1.5 border-b-2 border-[#4b2c20]/20 text-center w-8"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="9" className="py-20 text-center italic text-[#2d1e1e]/40">Consulting the archives...</td>
              </tr>
            ) : filteredRecords.length === 0 ? (
              <tr>
                <td colSpan="9" className="py-20 text-center italic text-[#2d1e1e]/40">No entries found for this query.</td>
              </tr>
            ) : (
              filteredRecords.map((record) => {
                const expenseIncome = getExpenseIncomeSum(record);
                const receiptPayment = getReceiptPaymentSum(record);

                return (
                  <tr key={record.id} className={`hover:bg-[#4b2c20]/5 transition-colors group ${selectedIds.has(record.id) ? 'bg-[#4b2c20]/10' : ''}`}>
                    <td className="px-2 py-1 border-b border-[#4b2c20]/5">
                       <button onClick={() => toggleSelectOne(record.id)} className="text-[#4b2c20]/40 group-hover:text-[#4b2c20]">
                         {selectedIds.has(record.id) ? <CheckSquare size={14} /> : <Square size={14} />}
                       </button>
                    </td>
                    <Td recordId={record.id} field="from_source" className="font-bold" isEditing={isEditing} editedRecords={editedRecords} records={records} handleFieldChange={handleFieldChange} transactionTypes={TRANSACTION_TYPES} accounts={accounts} entities={entities} questTypes={QUEST_TYPES} paymentMethods={PAYMENT_METHODS} recordStatuses={RECORD_STATUSES}>{record.from_source}</Td>
                    <Td recordId={record.id} field="month" isEditing={isEditing} editedRecords={editedRecords} records={records} handleFieldChange={handleFieldChange} transactionTypes={TRANSACTION_TYPES} accounts={accounts} entities={entities} questTypes={QUEST_TYPES} paymentMethods={PAYMENT_METHODS} recordStatuses={RECORD_STATUSES}>{record.month}</Td>
                    <Td recordId={record.id} field="year" isEditing={isEditing} editedRecords={editedRecords} records={records} handleFieldChange={handleFieldChange} transactionTypes={TRANSACTION_TYPES} accounts={accounts} entities={entities} questTypes={QUEST_TYPES} paymentMethods={PAYMENT_METHODS} recordStatuses={RECORD_STATUSES}>{record.year}</Td>
                    <Td recordId={record.id} field="entity" isEditing={isEditing} editedRecords={editedRecords} records={records} handleFieldChange={handleFieldChange} transactionTypes={TRANSACTION_TYPES} accounts={accounts} entities={entities} questTypes={QUEST_TYPES} paymentMethods={PAYMENT_METHODS} recordStatuses={RECORD_STATUSES}>{record.entity}</Td>
                    
                    {/* Expense/Income (sum) column */}
                    {isEditing ? (
                      <Td recordId={record.id} field="expense_amount" type="number" isEditing={isEditing} editedRecords={editedRecords} records={records} handleFieldChange={handleFieldChange} transactionTypes={TRANSACTION_TYPES} accounts={accounts} entities={entities} questTypes={QUEST_TYPES} paymentMethods={PAYMENT_METHODS} recordStatuses={RECORD_STATUSES}>
                        {record.expense_amount}
                      </Td>
                    ) : (
                      <td className="px-2 py-1 text-xs text-[#4b2c20] font-bold border-b border-[#4b2c20]/10">
                        {expenseIncome > 0 ? (
                          <span className="text-emerald-700 font-mono">+${expenseIncome}</span>
                        ) : expenseIncome < 0 ? (
                          <span className="text-red-700 font-mono">-${Math.abs(expenseIncome)}</span>
                        ) : (
                          <span className="text-[#4b2c20]/40">-</span>
                        )}
                      </td>
                    )}

                    {/* Receipt/Payment (sum) column */}
                    {isEditing ? (
                      <Td recordId={record.id} field="payment_receipt_cash" type="number" isEditing={isEditing} editedRecords={editedRecords} records={records} handleFieldChange={handleFieldChange} transactionTypes={TRANSACTION_TYPES} accounts={accounts} entities={entities} questTypes={QUEST_TYPES} paymentMethods={PAYMENT_METHODS} recordStatuses={RECORD_STATUSES}>
                        {record.payment_receipt_cash}
                      </Td>
                    ) : (
                      <td className="px-2 py-1 text-xs text-[#4b2c20] font-bold border-b border-[#4b2c20]/10">
                        {receiptPayment > 0 ? (
                          <span className="text-emerald-700 font-mono">+${receiptPayment}</span>
                        ) : receiptPayment < 0 ? (
                          <span className="text-red-700 font-mono">-${Math.abs(receiptPayment)}</span>
                        ) : (
                          <span className="text-[#4b2c20]/40">-</span>
                        )}
                      </td>
                    )}

                    <Td recordId={record.id} field="description" isEditing={isEditing} editedRecords={editedRecords} records={records} handleFieldChange={handleFieldChange} transactionTypes={TRANSACTION_TYPES} accounts={accounts} entities={entities} questTypes={QUEST_TYPES} paymentMethods={PAYMENT_METHODS} recordStatuses={RECORD_STATUSES}>
                      <div className="max-w-xs truncate" title={record.description}>{record.description || '-'}</div>
                    </Td>

                    {/* Arrow/Chevron detail button */}
                    <td className="px-2 py-1 border-b border-[#4b2c20]/5 text-center">
                      <button
                        onClick={() => {
                          setDetailsRecord(record);
                          setShowDetailsModal(true);
                        }}
                        className="p-1 hover:bg-[#4b2c20]/15 rounded-lg text-[#4b2c20] transition-colors"
                        title="View Details"
                      >
                        <ChevronRight size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })
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

      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Transaction Details"
        size="max-w-2xl"
      >
        {detailsRecord && (
          <div className="space-y-6 text-[#2d1e1e]">
            <div className="bg-white/40 border-2 border-[#4b2c20]/10 rounded-2xl p-4 grid grid-cols-2 gap-4">
              <div>
                <span className="block text-[10px] font-black uppercase tracking-wider text-[#4b2c20]/60 mb-0.5">Transaction Type</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-black uppercase tracking-tighter ${(detailsRecord.transaction_type?.toLowerCase() === 'income' || detailsRecord.transaction_type?.toLowerCase() === 'earning') ? 'bg-emerald-500/20 text-emerald-800' : 'bg-red-500/20 text-red-800'}`}>
                  {detailsRecord.transaction_type}
                </span>
              </div>
              <div>
                <span className="block text-[10px] font-black uppercase tracking-wider text-[#4b2c20]/60 mb-0.5">Status</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter ${detailsRecord.status === 'Paid' ? 'bg-blue-500/20 text-blue-800' : detailsRecord.status === 'Overdue' ? 'bg-red-550/20 text-red-800' : 'bg-amber-500/20 text-amber-800'}`}>
                  {detailsRecord.status}
                </span>
              </div>
              <div>
                <span className="block text-[10px] font-black uppercase tracking-wider text-[#4b2c20]/60 mb-0.5">From</span>
                <span className="text-sm font-bold text-[#4b2c20]">{detailsRecord.from_source || '-'}</span>
              </div>
              <div>
                <span className="block text-[10px] font-black uppercase tracking-wider text-[#4b2c20]/60 mb-0.5">Entity</span>
                <span className="text-sm font-bold text-[#4b2c20]">{detailsRecord.entity || '-'}</span>
              </div>
              <div>
                <span className="block text-[10px] font-black uppercase tracking-wider text-[#4b2c20]/60 mb-0.5">Month / Year</span>
                <span className="text-sm font-bold text-[#4b2c20]">{detailsRecord.month} {detailsRecord.year}</span>
              </div>
              <div>
                <span className="block text-[10px] font-black uppercase tracking-wider text-[#4b2c20]/60 mb-0.5">Quest / Flow Type</span>
                <span className="text-sm font-bold text-[#4b2c20]">{detailsRecord.quest_type} ({detailsRecord.flow_type || 'N/A'})</span>
              </div>
            </div>

            <div className="bg-white/40 border-2 border-[#4b2c20]/10 rounded-2xl p-4 space-y-4">
              <h4 className="title-font text-xs font-black uppercase tracking-wider text-[#4b2c20] border-b border-[#4b2c20]/10 pb-1">Gold Ledger Metrics</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <span className="block text-[10px] font-black uppercase tracking-wider text-[#4b2c20]/60 mb-0.5">Limit (Gold)</span>
                  <span className="font-mono text-sm font-bold">${detailsRecord.limit_amount || 0}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-black uppercase tracking-wider text-[#4b2c20]/60 mb-0.5">Expense/Income</span>
                  <span className="font-mono text-sm font-bold">${getExpenseIncomeSum(detailsRecord)}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-black uppercase tracking-wider text-[#4b2c20]/60 mb-0.5">Receipt/Payment</span>
                  <span className="font-mono text-sm font-bold">${getReceiptPaymentSum(detailsRecord)}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-black uppercase tracking-wider text-[#4b2c20]/60 mb-0.5">Interests</span>
                  <span className="font-mono text-sm font-bold">${detailsRecord.interests || 0}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-black uppercase tracking-wider text-[#4b2c20]/60 mb-0.5">Late Fee</span>
                  <span className="font-mono text-sm font-bold">${detailsRecord.late_fee_interests || 0}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-black uppercase tracking-wider text-[#4b2c20]/60 mb-0.5">Penalties</span>
                  <span className="font-mono text-sm font-bold">${detailsRecord.penalties || 0}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-black uppercase tracking-wider text-[#4b2c20]/60 mb-0.5">Tax</span>
                  <span className="font-mono text-sm font-bold text-red-650">${detailsRecord.tax || 0}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-black uppercase tracking-wider text-[#4b2c20]/60 mb-0.5">Losses (Shield)</span>
                  <span className="font-mono text-sm font-bold text-red-900">${detailsRecord.losses || 0}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-black uppercase tracking-wider text-[#4b2c20]/60 mb-0.5">Paid With</span>
                  <span className="text-sm font-bold text-[#4b2c20]">{detailsRecord.paid_with || '-'}</span>
                </div>
              </div>
            </div>

            <div className="bg-white/40 border-2 border-[#4b2c20]/10 rounded-2xl p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-[10px] font-black uppercase tracking-wider text-[#4b2c20]/60 mb-0.5">Account Link</span>
                  <span className="text-sm font-bold text-[#4b2c20]">
                    {accounts.find(a => a.id === detailsRecord.account_id)?.name || 'None'}
                  </span>
                </div>
              </div>
              <div>
                <span className="block text-[10px] font-black uppercase tracking-wider text-[#4b2c20]/60 mb-0.5">Description (Notes)</span>
                <p className="text-sm italic text-[#4b2c20] bg-white/20 p-3 border border-[#4b2c20]/10 rounded-xl whitespace-pre-wrap">
                  {detailsRecord.description || 'No additional scrolls or notes written for this transaction.'}
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setEditingRecord(detailsRecord);
                  setShowEditModal(true);
                }}
                className="flex-1 py-3 bg-[#4b2c20] text-white rounded-xl font-black uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Edit3 size={16} /> Edit Transaction
              </button>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="flex-1 py-3 bg-white/40 border-2 border-[#2d1e1e]/20 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-white/60 transition-all text-[#2d1e1e]"
              >
                Close Details
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingRecord(null);
          setIsCopyModal(false);
        }}
        title={isCopyModal ? "Duplicate Transaction" : "Quick Edit Transaction"}
        size="max-w-4xl"
      >
        {editingRecord && (
          <RecordForm
            userId={userId}
            editingRecord={editingRecord}
            isCopy={isCopyModal}
            onCancel={() => {
              setShowEditModal(false);
              setEditingRecord(null);
              setIsCopyModal(false);
            }}
            onSuccess={async () => {
              setShowEditModal(false);
              setEditingRecord(null);
              setIsCopyModal(false);
              toast.success(isCopyModal ? 'Transaction duplicated successfully!' : 'Royal ledger updated successfully!');
              await fetchRecords();
            }}
          />
        )}
      </Modal>
    </div>
  );
};

export default RecordsTable;
