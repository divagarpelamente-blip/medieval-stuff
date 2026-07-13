import React from 'react';
import Modal from '../common/Modal';
import QuickActionFormFields from './QuickActionFormFields';

export default function EditQuickActionModal({
  isOpen,
  onClose,
  onSave,
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
  classOptions = [],
  subClassOptions = [],
  statusOptions = [],
  fromOptions = [],
  categoryOptions = [],
  entityOptions = []
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Quick Action" size="max-w-4xl">
      <div className="bg-[#faf4e5] border-2 border-[#8b4513]/30 rounded-xl p-4 shadow-inner max-h-[80vh] overflow-y-auto custom-scrollbar-subtle">
        <QuickActionFormFields
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
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[#8b4513]/20">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider text-stone-600 bg-stone-200 hover:bg-stone-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="px-6 py-2 rounded-lg text-xs font-black uppercase tracking-wider text-[#ffd700] bg-[#8b4513] hover:bg-[#a0522d] border border-[#d4af37]/40 shadow transition-transform active:scale-95"
          >
            Save Changes
          </button>
        </div>
      </div>
    </Modal>
  );
}