import React from 'react';
import QuickActionFormFields from './QuickActionFormFields';

const ManageQuickActionsPanel = ({
  qaName,
  setQaName,
  qaIcon,
  setQaIcon,
  qaClass,
  setQaClass,
  qaSubClass,
  setQaSubClass,
  qaFlow,
  setQaFlow,
  qaStatus,
  setQaStatus,
  qaFrom,
  setQaFrom,
  qaCategory,
  setQaCategory,
  qaEntity,
  setQaEntity,
  qaAmount,
  setQaAmount,
  qaValueDate,
  setQaValueDate,
  qaDueDate,
  setQaDueDate,
  qaPostingDate,
  setQaPostingDate,
  qaDescription,
  setQaDescription,
  qaSourceDestBank,
  setQaSourceDestBank,
  qaTargetAccount,
  setQaTargetAccount,
  classOptions = [],
  subClassOptions = [],
  statusOptions = [],
  fromOptions = [],
  categoryOptions = [],
  entityOptions = [],
  entityMappings = {},
  accountMappings = {},
  templates = [],
  selectedQaTemplateName,
  setSelectedQaTemplateName,
  setSelectedQaNames,
  onSubmit
}) => {
  return (
    <>
      <div className="flex items-end gap-2.5">
        {/* Selector */}
        <div className="flex flex-col items-start gap-0.5">
          <label className="text-[9px] font-black uppercase tracking-wider text-[#5d4037]/80">
            Choose Quick Action:
          </label>
          <select
            value={selectedQaTemplateName || ''}
            onChange={(e) => {
              const tplName = e.target.value;
              setSelectedQaTemplateName(tplName);
              if (tplName) {
                const tpl = templates.find((t) => t.name === tplName);
                if (tpl) {
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
                  setQaDescription(tpl.data.description || '');
                  setQaAmount(tpl.data.amount || '');
                  setQaDueDate(tpl.data.due_date || '');
                  setQaValueDate(tpl.data.value_date || '');
                  setQaPostingDate(tpl.data.posting_date || '');
                  setSelectedQaNames([tpl.name]);
                }
              } else {
                setQaName('');
                setQaIcon('⚡');
                setQaFrom('');
                setQaClass('');
                setQaSubClass('');
                setQaEntity('');
                setQaCategory('');
                setQaTargetAccount('');
                setQaSourceDestBank('');
                setQaFlow('');
                setQaStatus('');
                setQaDescription('');
                setQaAmount('');
                setQaDueDate('');
                setQaValueDate('');
                setQaPostingDate('');
                setSelectedQaNames([]);
              }
            }}
            className="bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg h-[28px] px-2 text-[10px] font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50"
          >
            <option value="">-- Choose Quick Action --</option>
            {templates.map((tpl) => (
              <option key={tpl.name} value={tpl.name}>
                {tpl.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Add option form */}
      <form
        id="quick-action-form"
        onSubmit={onSubmit}
        className="bg-[#faf4e5]/40 border border-[#8b4513]/15 rounded-xl p-2.5 mb-2.5 space-y-2.5 overflow-y-auto max-h-[460px] custom-scrollbar-subtle"
      >
        <QuickActionFormFields
          qaName={qaName}
          setQaName={setQaName}
          qaIcon={qaIcon}
          setQaIcon={setQaIcon}
          qaClass={qaClass}
          setQaClass={setQaClass}
          qaSubClass={qaSubClass}
          setQaSubClass={setQaSubClass}
          qaFlow={qaFlow}
          setQaFlow={setQaFlow}
          qaStatus={qaStatus}
          setQaStatus={setQaStatus}
          qaFrom={qaFrom}
          setQaFrom={setQaFrom}
          qaCategory={qaCategory}
          setQaCategory={setQaCategory}
          qaEntity={qaEntity}
          setQaEntity={setQaEntity}
          qaAmount={qaAmount}
          setQaAmount={setQaAmount}
          qaValueDate={qaValueDate}
          setQaValueDate={setQaValueDate}
          qaDueDate={qaDueDate}
          setQaDueDate={setQaDueDate}
          qaPostingDate={qaPostingDate}
          setQaPostingDate={setQaPostingDate}
          qaDescription={qaDescription}
          setQaDescription={setQaDescription}
          qaSourceDestBank={qaSourceDestBank}
          setQaSourceDestBank={setQaSourceDestBank}
          qaTargetAccount={qaTargetAccount}
          setQaTargetAccount={setQaTargetAccount}
          classOptions={classOptions}
          subClassOptions={subClassOptions}
          statusOptions={statusOptions}
          fromOptions={fromOptions}
          categoryOptions={categoryOptions}
          entityOptions={entityOptions}
          entityMappings={entityMappings}
          accountMappings={accountMappings}
          isCompact={false}
        />
      </form>
    </>
  );
};

export default ManageQuickActionsPanel;
