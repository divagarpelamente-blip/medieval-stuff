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
  onSubmit
}) => {
  return (
    <form
      id="quick-action-form"
      onSubmit={onSubmit}
      className="bg-[#faf4e5]/40 border border-[#8b4513]/15 rounded-xl p-3 space-y-3 flex-grow overflow-hidden"
    >
      <QuickActionFormFields
        qaName={qaName}
        setQaName={setQaName}
        qaIcon={qaIcon}
        setQaIcon={setQaIcon}
        qaType={qaClass}
        setQaType={setQaClass}
        qaSubType={qaSubClass}
        setQaSubType={setQaSubClass}
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
        subTypeOptions={subClassOptions}
        statusOptions={statusOptions}
        fromOptions={fromOptions}
        categoryOptions={categoryOptions}
        entityOptions={entityOptions}
        entityMappings={entityMappings}
        accountMappings={accountMappings}
        isCompact={true}
      />
    </form>
  );
};

export default ManageQuickActionsPanel;
