import React from 'react';
import { ArrowUpDown } from 'lucide-react';
import { MONTHS } from '../../utils/constants';

export const Th = ({ children, className = "", canSort = true }) => (
  <th className={`px-2 py-1.5 text-left text-[11px] font-black uppercase tracking-widest text-[#4b2c20] border-b-2 border-[#4b2c20]/20 ${className}`}>
    <div className="flex items-center gap-1">
      {children}
      {canSort && <ArrowUpDown size={11} className="opacity-40" />}
    </div>
  </th>
);

export const Td = ({ 
  children, 
  className = "", 
  recordId, 
  field, 
  type = "text", 
  isEditing, 
  editedRecords, 
  records, 
  handleFieldChange, 
  transactionTypes, 
  accounts, 
  entities = [], 
  questTypes = [],
  flowTypes = [],
  paymentMethods = [],
  recordStatuses = []
}) => {
  if (isEditing && field) {
    const value = editedRecords[recordId]?.[field] ?? records.find(r => r.id === recordId)[field];
    
    if (field === 'transaction_type') {
      return (
        <td className="px-2 py-1 border-b border-[#4b2c20]/10">
          <select 
            value={value} 
            onChange={(e) => handleFieldChange(recordId, field, e.target.value)}
            className="w-full bg-white/60 border-2 border-[#4b2c20]/20 rounded-lg px-2 py-1.5 text-xs font-bold text-[#4b2c20] focus:border-[#4b2c20]/40 outline-none transition-all"
          >
            {transactionTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </td>
      );
    }

    if (field === 'account_id') {
      const currentAccount = accounts.find(a => a.id === value);
      const selectValue = currentAccount ? currentAccount.name : '';
      return (
        <td className="px-2 py-1 border-b border-[#4b2c20]/10">
          <select 
            value={selectValue} 
            onChange={(e) => handleFieldChange(recordId, field, e.target.value)}
            className="w-full bg-white/60 border-2 border-[#4b2c20]/20 rounded-lg px-2 py-1.5 text-xs font-bold text-[#4b2c20] focus:border-[#4b2c20]/40 outline-none transition-all"
          >
            <option value="">None</option>
            {entities.map(e => <option key={e.name} value={e.name}>{e.name}</option>)}
          </select>
        </td>
      );
    }

    if (field === 'entity') {
      return (
        <td className="px-2 py-1 border-b border-[#4b2c20]/10">
          <select 
            value={value || ''} 
            onChange={(e) => handleFieldChange(recordId, field, e.target.value)}
            className="w-full bg-white/60 border-2 border-[#4b2c20]/20 rounded-lg px-2 py-1.5 text-xs font-bold text-[#4b2c20] focus:border-[#4b2c20]/40 outline-none transition-all"
          >
            <option value="">Select Entity...</option>
            {entities.map(e => <option key={e.name} value={e.name}>{e.name}</option>)}
          </select>
        </td>
      );
    }

    if (field === 'quest_type') {
      return (
        <td className="px-2 py-1 border-b border-[#4b2c20]/10">
          <select 
            value={value || 'Production'} 
            onChange={(e) => handleFieldChange(recordId, field, e.target.value)}
            className="w-full bg-white/60 border-2 border-[#4b2c20]/20 rounded-lg px-2 py-1.5 text-xs font-bold text-[#4b2c20] focus:border-[#4b2c20]/40 outline-none transition-all"
          >
            {questTypes.map(q => <option key={q} value={q}>{q}</option>)}
          </select>
        </td>
      );
    }

    if (field === 'flow_type') {
      return (
        <td className="px-2 py-1 border-b border-[#4b2c20]/10">
          <select 
            value={value || ''} 
            onChange={(e) => handleFieldChange(recordId, field, e.target.value)}
            className="w-full bg-white/60 border-2 border-[#4b2c20]/20 rounded-lg px-2 py-1.5 text-xs font-bold text-[#4b2c20] focus:border-[#4b2c20]/40 outline-none transition-all"
          >
            <option value="">None</option>
            {flowTypes.map(ft => <option key={ft} value={ft}>{ft}</option>)}
          </select>
        </td>
      );
    }

    if (field === 'paid_with') {
      return (
        <td className="px-2 py-1 border-b border-[#4b2c20]/10">
          <select 
            value={value || 'Debit'} 
            onChange={(e) => handleFieldChange(recordId, field, e.target.value)}
            className="w-full bg-white/60 border-2 border-[#4b2c20]/20 rounded-lg px-2 py-1.5 text-xs font-bold text-[#4b2c20] focus:border-[#4b2c20]/40 outline-none transition-all"
          >
            {paymentMethods.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </td>
      );
    }

    if (field === 'status') {
      return (
        <td className="px-2 py-1 border-b border-[#4b2c20]/10">
          <select 
            value={value || 'Paid'} 
            onChange={(e) => handleFieldChange(recordId, field, e.target.value)}
            className="w-full bg-white/60 border-2 border-[#4b2c20]/20 rounded-lg px-2 py-1.5 text-xs font-bold text-[#4b2c20] focus:border-[#4b2c20]/40 outline-none transition-all"
          >
            {recordStatuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </td>
      );
    }

    if (field === 'month') {
      return (
        <td className="px-2 py-1 border-b border-[#4b2c20]/10">
          <select 
            value={value} 
            onChange={(e) => handleFieldChange(recordId, field, e.target.value)}
            className="w-full bg-white/60 border-2 border-[#4b2c20]/20 rounded-lg px-2 py-1.5 text-xs font-bold text-[#4b2c20] focus:border-[#4b2c20]/40 outline-none transition-all"
          >
            {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </td>
      );
    }
    
    return (
      <td className="px-2 py-1 border-b border-[#4b2c20]/10">
        <input 
          type={type}
          value={value || ''}
          onChange={(e) => handleFieldChange(recordId, field, e.target.value)}
          className="w-full bg-white/60 border-2 border-[#4b2c20]/20 rounded-lg px-2 py-1.5 text-xs font-bold text-[#4b2c20] focus:border-[#4b2c20]/40 outline-none transition-all"
        />
      </td>
    );
  }
  return (
    <td className={`px-2 py-1 text-xs text-[#4b2c20] font-bold border-b border-[#4b2c20]/10 ${className}`}>
      {children}
    </td>
  );
};
