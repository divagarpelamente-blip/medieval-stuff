import React from 'react';
import QuickActionFormFields from './QuickActionFormFields';

export default function ManageQuickActionsPanel({
  t,
  templates,
  selectedQaNames,
  setSelectedQaNames,
  setSelectedQaTemplateName,
  qaName, setQaName,
  qaIcon, setQaIcon,
  qaAmount, setQaAmount,
  qaFrom, setQaFrom,
  qaClass, setQaClass,
  qaStatus, setQaStatus,
  qaSubClass, setQaSubClass,
  qaEntity, setQaEntity,
  qaCategory, setQaCategory,
  qaTargetAccount, setQaTargetAccount,
  qaSourceDestBank, setQaSourceDestBank,
  qaFlow, setQaFlow,
  qaDescription, setQaDescription,
  qaDueDate, setQaDueDate,
  qaValueDate, setQaValueDate,
  qaPostingDate, setQaPostingDate,
  setIsEditingQa,
  handleDeleteQuickAction,
  qaFileInputRef,
  importQuickActionsCSV,
  handleExportAllActionsCSV,
  handleAddQuickAction,
  fromOptions = [],
  statusOptions = []
}) {
  return (
    <div className="space-y-4">
      {/* Current Templates List */}
      <div className="bg-stone-50 border border-stone-200 rounded-lg p-3">
        <h3 className="text-xs font-black text-stone-800 uppercase tracking-wider mb-2">Existing Actions</h3>
        {templates.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {templates.map(tpl => (
              <label key={tpl.name} className="flex items-center gap-2 p-2 bg-white border border-stone-200 rounded-md cursor-pointer hover:bg-stone-50">
                <input 
                  type="checkbox" 
                  checked={selectedQaNames.includes(tpl.name)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedQaNames([...selectedQaNames, tpl.name]);
                    } else {
                      setSelectedQaNames(selectedQaNames.filter(n => n !== tpl.name));
                    }
                  }}
                  className="accent-[#8b4513]"
                />
                <span className="text-xs font-bold text-stone-700 truncate">{tpl.icon} {tpl.name}</span>
              </label>
            ))}
          </div>
        ) : (
          <p className="text-xs text-stone-500 italic">No quick actions configured.</p>
        )}

        <div className="flex gap-2 mt-3 pt-3 border-t border-stone-200">
           <button 
             onClick={() => {
               if(selectedQaNames.length === 1) {
                 const tpl = templates.find(t => t.name === selectedQaNames[0]);
                 if(tpl) {
                    setQaName(tpl.name);
                    setQaIcon(tpl.icon || '⚡');
                    setQaFrom(tpl.data.from);
                    setQaClass(tpl.data.transaction_type);
                    setQaSubClass(tpl.data.transaction_subtype);
                    setQaEntity(tpl.data.entity);
                    setQaCategory(tpl.data.transaction_category);
                    setQaTargetAccount(tpl.data.target_account);
                    setQaSourceDestBank(tpl.data.source_dest_bank);
                    setQaFlow(tpl.data.flow);
                    setQaStatus(tpl.data.payment_status);
                    setQaDescription(tpl.data.description);
                    setQaAmount(tpl.data.amount);
                    setQaDueDate(tpl.data.due_date);
                    setQaValueDate(tpl.data.value_date);
                    setQaPostingDate(tpl.data.posting_date);
                    setSelectedQaTemplateName(tpl.name);
                    setIsEditingQa(true);
                 }
               }
             }}
             disabled={selectedQaNames.length !== 1}
             className="px-3 py-1.5 bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-300 rounded text-[10px] font-black uppercase tracking-wider disabled:opacity-50"
           >
             Edit Selected
           </button>
           <button 
             onClick={handleDeleteQuickAction}
             disabled={selectedQaNames.length === 0}
             className="px-3 py-1.5 bg-rose-100 text-rose-800 hover:bg-rose-200 border border-rose-300 rounded text-[10px] font-black uppercase tracking-wider disabled:opacity-50"
           >
             Delete Selected
           </button>
        </div>
      </div>

      {/* Add New Template Form */}
      <div className="bg-white border border-[#8b4513]/20 rounded-lg p-4 shadow-sm">
        <h3 className="text-xs font-black text-[#8b4513] uppercase tracking-wider mb-3">Create New Quick Action</h3>
        <form onSubmit={handleAddQuickAction} className="space-y-4">
           <QuickActionFormFields
              t={t}
              qaName={qaName} setQaName={setQaName}
              qaIcon={qaIcon} setQaIcon={setQaIcon}
              qaClass={qaClass} setQaClass={setQaClass}
              qaSubClass={qaSubClass} setQaSubClass={setQaSubClass}
              qaFlow={qaFlow} setQaFlow={setQaFlow}
              qaStatus={qaStatus} setQaStatus={setQaStatus}
              qaFrom={qaFrom} setQaFrom={setQaFrom}
              qaCategory={qaCategory} setQaCategory={setQaCategory}
              qaEntity={qaEntity} setQaEntity={setQaEntity}
              qaAmount={qaAmount} setQaAmount={setQaAmount}
              qaValueDate={qaValueDate} setQaValueDate={setQaValueDate}
              qaDueDate={qaDueDate} setQaDueDate={setQaDueDate}
              qaPostingDate={qaPostingDate} setQaPostingDate={setQaPostingDate}
              qaDescription={qaDescription} setQaDescription={setQaDescription}
              qaSourceDestBank={qaSourceDestBank} setQaSourceDestBank={setQaSourceDestBank}
              qaTargetAccount={qaTargetAccount} setQaTargetAccount={setQaTargetAccount}
              statusOptions={statusOptions}
              fromOptions={fromOptions}
           />
           <div className="flex justify-end pt-2">
             <button type="submit" className="px-6 py-2 bg-emerald-700 text-white hover:bg-emerald-600 border border-emerald-800 rounded-lg text-xs font-black uppercase tracking-widest shadow">
               + Save New Action
             </button>
           </div>
        </form>
      </div>

      {/* Import/Export */}
      <div className="flex gap-2">
         <button onClick={() => handleExportAllActionsCSV(templates)} className="flex-1 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-[10px] font-black uppercase tracking-wider border border-stone-300 rounded">
            Export Actions CSV
         </button>
         <input type="file" accept=".csv" ref={qaFileInputRef} onChange={importQuickActionsCSV} className="hidden" />
         <button onClick={() => qaFileInputRef.current?.click()} className="flex-1 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-[10px] font-black uppercase tracking-wider border border-stone-300 rounded">
            Import Actions CSV
         </button>
      </div>
    </div>
  );
}