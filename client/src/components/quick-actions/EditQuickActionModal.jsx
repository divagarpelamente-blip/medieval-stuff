import React from 'react';
import Modal from './Modal';
import { STANDARD_MODAL_PROPS } from '../constants/UI_UX';
import QuickActionFormFields from './QuickActionFormFields';

const EditQuickActionModal = ({
  isOpen,
  onClose,
  onSave,
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
  accountMappings = {}
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Quick Action Settings"
      {...STANDARD_MODAL_PROPS}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave();
        }}
        className="space-y-1.5 p-1 pr-1 h-full overflow-y-auto custom-scrollbar-subtle"
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

        {/* Save Buttons */}
        <div className="flex justify-end gap-2 pt-3 border-t border-[#8b4513]/10">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 h-[32px] bg-[#faf4e5] border border-[#8b4513]/40 text-[#4b2c20] font-black text-[9px] uppercase tracking-wider rounded-lg hover:bg-[#8b4513]/10 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-3.5 h-[32px] bg-[#8b4513] text-white font-black text-[9px] uppercase tracking-wider rounded-lg hover:scale-[1.02] cursor-pointer"
          >
            Save Changes
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default EditQuickActionModal;
