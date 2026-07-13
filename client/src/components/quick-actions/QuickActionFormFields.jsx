import React, { useMemo } from 'react';
import { useKingdomStore } from '../../store/useKingdomStore';

export default function QuickActionFormFields({
  t,
  qaName, setQaName,
  qaIcon, setQaIcon,
  qaClass, setQaClass,
  qaSubClass, setQaSubClass,
  qaFlow, setQaFlow,
  qaStatus, setQaStatus,
  qaFrom, setQaFrom,
  qaCategory, setQaCategory,
  qaEntity, setQaEntity,
  qaAmount, setQaAmount,
  qaValueDate, setQaValueDate,
  qaDueDate, setQaDueDate,
  qaPostingDate, setQaPostingDate,
  qaDescription, setQaDescription,
  qaSourceDestBank, setQaSourceDestBank,
  qaTargetAccount, setQaTargetAccount,
  statusOptions = [],
  fromOptions = []
}) {
  
  // Pull live Matrix Helpers from Store
  const getTypes = useKingdomStore(state => state.getTypes);
  const getSubtypesByType = useKingdomStore(state => state.getSubtypesByType);
  const getCategoriesBySubtype = useKingdomStore(state => state.getCategoriesBySubtype);
  const getEntitiesByCategory = useKingdomStore(state => state.getEntitiesByCategory);
  const getAccountCode = useKingdomStore(state => state.getAccountCode);

  const types = getTypes() || ['Assets', 'Liabilities', 'Income', 'Expense'];
  const allowedSubtypes = useMemo(() => qaClass ? getSubtypesByType(qaClass) : [], [qaClass, getSubtypesByType]);
  const allowedCategories = useMemo(() => qaSubClass ? getCategoriesBySubtype(qaSubClass) : [], [qaSubClass, getCategoriesBySubtype]);
  const allowedEntities = useMemo(() => qaCategory ? getEntitiesByCategory(qaCategory) : [], [qaCategory, getEntitiesByCategory]);

  const handleChange = (field, value) => {
    if (field === 'qaClass') {
      setQaClass(value); setQaSubClass(''); setQaCategory(''); setQaEntity(''); setQaTargetAccount('');
    } else if (field === 'qaSubClass') {
      setQaSubClass(value); setQaCategory(''); setQaEntity(''); setQaTargetAccount('');
    } else if (field === 'qaCategory') {
      setQaCategory(value); setQaEntity(''); setQaTargetAccount('');
    } else if (field === 'qaEntity') {
      setQaEntity(value);
      const code = getAccountCode(qaClass, qaSubClass, qaCategory, value);
      setQaTargetAccount(code || '');
    }
  };

  return (
    <div className="space-y-4">
      {/* Name and Icon */}
      <div className="grid grid-cols-4 gap-4">
        <div className="col-span-3">
          <label className="block text-[10px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">Template Name</label>
          <input type="text" value={qaName} onChange={(e) => setQaName(e.target.value)} required placeholder="e.g. Pay Rent" className="w-full bg-white border border-stone-300 rounded-md h-[38px] px-3 text-xs font-bold text-[#4b2c20]" />
        </div>
        <div className="col-span-1">
          <label className="block text-[10px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">Icon</label>
          <input type="text" value={qaIcon} onChange={(e) => setQaIcon(e.target.value)} maxLength={2} placeholder="⚡" className="w-full bg-white border border-stone-300 rounded-md h-[38px] px-3 text-center text-lg" />
        </div>
      </div>

      {/* Flat Matrix Omni-directional Dropdowns */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">Type</label>
          <select value={qaClass} onChange={(e) => handleChange('qaClass', e.target.value)} className="w-full bg-white border border-stone-300 rounded-md h-[38px] px-2 text-xs font-bold text-[#4b2c20]">
            <option value="" disabled>Select Type...</option>
            {types.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">Subtype</label>
          <select value={qaSubClass} onChange={(e) => handleChange('qaSubClass', e.target.value)} disabled={!qaClass} className="w-full bg-white border border-stone-300 rounded-md h-[38px] px-2 text-xs font-bold text-[#4b2c20] disabled:opacity-50">
            <option value="" disabled>Select Subtype...</option>
            {allowedSubtypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">Category</label>
          <select value={qaCategory} onChange={(e) => handleChange('qaCategory', e.target.value)} disabled={!qaSubClass} className="w-full bg-white border border-stone-300 rounded-md h-[38px] px-2 text-xs font-bold text-[#4b2c20] disabled:opacity-50">
            <option value="" disabled>Select Category...</option>
            {allowedCategories.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">Entity</label>
          <select value={qaEntity} onChange={(e) => handleChange('qaEntity', e.target.value)} disabled={!qaCategory} className="w-full bg-white border border-stone-300 rounded-md h-[38px] px-2 text-xs font-bold text-[#4b2c20] disabled:opacity-50">
            <option value="" disabled>Select Entity...</option>
            {allowedEntities.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 bg-stone-100 p-3 rounded-lg">
         <div className="col-span-2">
            <label className="block text-[10px] font-black uppercase tracking-wider text-stone-600 mb-1">Target Account (Resolved via Matrix)</label>
            <input type="text" readOnly value={qaTargetAccount} className="w-full bg-stone-200 border-none rounded-md h-[30px] px-2 text-xs font-mono font-bold text-stone-600 cursor-not-allowed"/>
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">Source Account</label>
            <input type="text" value={qaSourceDestBank} onChange={(e) => setQaSourceDestBank(e.target.value)} className="w-full bg-white border border-stone-300 rounded-md h-[30px] px-2 text-xs font-mono font-bold text-stone-700"/>
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">Flow Direction</label>
            <select value={qaFlow} onChange={(e) => setQaFlow(e.target.value)} className="w-full bg-white border border-stone-300 rounded-md h-[30px] px-2 text-xs font-bold text-stone-700">
              <option value="outflow">Outflow</option>
              <option value="inflow">Inflow</option>
              <option value="neutral">Neutral</option>
            </select>
          </div>
      </div>

      {/* Legacy overrides and optional fields */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">Amount (Override)</label>
          <input type="number" step="0.01" value={qaAmount} onChange={(e) => setQaAmount(e.target.value)} placeholder="0.00" className="w-full bg-white border border-stone-300 rounded-md h-[38px] px-3 text-xs font-bold text-[#4b2c20]" />
        </div>
        <div>
          <label className="block text-[10px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">Status</label>
          <select value={qaStatus} onChange={(e) => setQaStatus(e.target.value)} className="w-full bg-white border border-stone-300 rounded-md h-[38px] px-2 text-xs font-bold text-[#4b2c20]">
            <option value="" disabled>Select...</option>
            {statusOptions.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>
      
      <div>
        <label className="block text-[10px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">Description Template</label>
        <input type="text" value={qaDescription} onChange={(e) => setQaDescription(e.target.value)} placeholder="Template notes..." className="w-full bg-white border border-stone-300 rounded-md h-[38px] px-3 text-xs font-bold text-[#4b2c20]" />
      </div>

    </div>
  );
}