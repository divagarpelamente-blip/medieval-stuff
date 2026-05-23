import React from 'react';
import { ArrowUpDown } from 'lucide-react';
import { MONTHS } from '../../utils/constants';

export const Th = ({ children, className = "", canSort = true }) => (
  <th className={`px-4 py-3 text-left text-xs font-black uppercase tracking-widest text-[#4b2c20] border-b-2 border-[#4b2c20]/20 ${className}`}>
    <div className="flex items-center gap-1">
      {children}
      {canSort && <ArrowUpDown size={12} className="opacity-40" />}
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
      return (
        <td className="px-2 py-1 border-b border-[#4b2c20]/10">
          <select 
            value={value || ''} 
            onChange={(e) => handleFieldChange(recordId, field, e.target.value)}
            className="w-full bg-white/60 border-2 border-[#4b2c20]/20 rounded-lg px-2 py-1.5 text-xs font-bold text-[#4b2c20] focus:border-[#4b2c20]/40 outline-none transition-all"
          >
            <option value="">None</option>
            {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
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
    <td className={`px-4 py-3 text-sm text-[#4b2c20] font-bold border-b border-[#4b2c20]/10 ${className}`}>
      {children}
    </td>
  );
};
