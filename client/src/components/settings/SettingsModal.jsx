import React from 'react';
import { toast } from 'react-hot-toast';
import { STANDARD_MODAL_PROPS, Z_LAYERS } from '../../constants/UI_UX';
import InitialBalancesEditor from '../setup/InitialBalancesEditor';
import SubtypeCategoryEditor from '../setup/SubtypeCategoryEditor';
import COAEditor from '../setup/COAEditor';
import CategoryMatrixEditor from '../setup/CategoryMatrixEditor';
import FlatListEditor from '../setup/FlatListEditor';
import AllActionsEditor from '../setup/AllActionsEditor';
import ManageQuickActionsPanel from '../quick-actions/ManageQuickActionsPanel';

export default function SettingsModal({
  isOpen,
  onClose,
  t,
  selectedSettingType,
  setSelectedSettingType,
  newOptionVal,
  setNewOptionVal,
  newEntityCatVal,
  setNewEntityCatVal,
  accountMappings,
  subtypeToCategoryMap,
  subtypeTypes,
  syncSettings,
  subClassOptions,
  categoryOptions,
  entityOptions,
  entityMappings,
  getMatrixRows,
  handleSaveMatrix,
  settingsFileInputRef,
  importSettingsCSV,
  exportSettingsCSV,
  fromOptions,
  statusOptions,
  classOptions,
  templates,
  selectedQaNames,
  setSelectedQaNames,
  setSelectedQaTemplateName,
  setQaName,
  setQaIcon,
  setQaFrom,
  setQaClass,
  setQaSubClass,
  setQaEntity,
  setQaCategory,
  setQaTargetAccount,
  setQaSourceDestBank,
  setQaFlow,
  setQaStatus,
  setQaDescription,
  setQaAmount,
  setQaDueDate,
  setQaValueDate,
  setQaPostingDate,
  setIsEditingQa,
  handleDeleteQuickAction,
  qaFileInputRef,
  importQuickActionsCSV,
  handleExportAllActionsCSV,
  qaName,
  qaIcon,
  qaFrom,
  qaClass,
  qaSubClass,
  qaEntity,
  qaCategory,
  qaTargetAccount,
  qaSourceDestBank,
  qaFlow,
  qaStatus,
  qaDescription,
  qaAmount,
  qaDueDate,
  qaValueDate,
  qaPostingDate,
  addOption,
  editOption,
  deleteOption,
  handleSaveQuickAction,
  filterActionType,
  filterActionSubtype,
  filterActionCategory,
  filterActionEntity
}) {
  if (!isOpen) return null;

  const renderSettingsPanel = () => {
    if (selectedSettingType === 'initialBalances') {
      return (
        <InitialBalancesEditor
          t={t}
          accountMappings={accountMappings}
        />
      );
    }

    if (selectedSettingType === 'subcategories') {
      return (
        <SubtypeCategoryEditor
          t={t}
          subtypeToCategoryMap={subtypeToCategoryMap}
          subtypeTypes={subtypeTypes}
          syncSettings={syncSettings}
        />
      );
    }

    if (selectedSettingType === 'coa') {
      return (
        <COAEditor
          t={t}
          accountMappings={accountMappings}
          subtypeToCategoryMap={subtypeToCategoryMap}
          subtypeTypes={subtypeTypes}
          syncSettings={syncSettings}
        />
      );
    }

    if (selectedSettingType === 'class') {
      return (
        <CategoryMatrixEditor
          t={t}
          subClassOptions={subClassOptions}
          categoryOptions={categoryOptions}
          entityOptions={entityOptions}
          entityMappings={entityMappings}
          subtypeToCategoryMap={subtypeToCategoryMap}
          syncSettings={syncSettings}
          getMatrixRows={getMatrixRows}
          handleSaveMatrix={handleSaveMatrix}
          settingsFileInputRef={settingsFileInputRef}
          importSettingsCSV={importSettingsCSV}
          exportSettingsCSV={exportSettingsCSV}
        />
      );
    }

    if (selectedSettingType === 'from' || selectedSettingType === 'status') {
      const type = selectedSettingType;
      const title = type === 'from' ? 'Origin/From' : 'Status';
      const list = type === 'from' ? fromOptions : statusOptions;
      return (
        <FlatListEditor
          t={t}
          title={title}
          list={list}
          onAdd={(val) => addOption(type, val)}
          onEdit={(oldVal, newVal) => editOption(type, oldVal, newVal)}
          onDelete={(val) => {
            deleteOption(type, val);
            toast.success(t('success_deleted_option', { val }));
          }}
          settingsFileInputRef={settingsFileInputRef}
          importSettingsCSV={importSettingsCSV}
          exportSettingsCSV={exportSettingsCSV}
        />
      );
    }
    if (selectedSettingType === 'allActions') {
      return (
        <AllActionsEditor
          t={t}
          templates={templates}
          selectedQaNames={selectedQaNames}
          setSelectedQaNames={setSelectedQaNames}
          onEditQuickAction={(tpl) => {
            setSelectedQaTemplateName(tpl.name);
            setQaName(tpl.name);
            setQaIcon(tpl.icon || '⚡');
            setQaFrom(tpl.data.from || '');
            setQaClass(tpl.data.transaction_type || '');
            setQaSubClass(tpl.data.transaction_subtype || '');
            setQaEntity(tpl.data.entity || '');
            setQaCategory(tpl.data.transaction_category || '');
            setQaTargetAccount(tpl.data.target_account || '');
            setQaSourceDestBank(tpl.data.source_dest_bank || '');
            setQaFlow(tpl.data.flow || '');
            setQaStatus(tpl.data.payment_status || '');
            setQaDescription(tpl.data.description || '');
            setQaAmount(tpl.data.amount || '');
            setQaDueDate(tpl.data.due_date || '');
            setQaValueDate(tpl.data.value_date || '');
            setQaPostingDate(tpl.data.posting_date || '');
            setIsEditingQa(true);
            setSelectedSettingType('quickAction');
          }}
          handleDeleteQuickAction={handleDeleteQuickAction}
          qaFileInputRef={qaFileInputRef}
          importQuickActionsCSV={importQuickActionsCSV}
          handleExportAllActionsCSV={handleExportAllActionsCSV}
        />
      );
    }

    let title = '';
    let currentList = [];
    let showEntityCategorySelector = false;

    // Derive dynamic filter lists for All Actions
    const dynamicSubtypes = Array.from(new Set(
      templates
        .filter(tpl => !filterActionType || tpl.data?.transaction_type === filterActionType)
        .map(tpl => tpl.data?.transaction_subtype)
        .filter(Boolean)
    )).sort();

    const dynamicCategories = Array.from(new Set(
      templates
        .filter(tpl => {
          if (filterActionType && tpl.data?.transaction_type !== filterActionType) return false;
          if (filterActionSubtype && tpl.data?.transaction_subtype !== filterActionSubtype) return false;
          return true;
        })
        .map(tpl => tpl.data?.transaction_category)
        .filter(Boolean)
    )).sort();

    const dynamicEntities = Array.from(new Set(
      templates
        .filter(tpl => {
          if (filterActionType && tpl.data?.transaction_type !== filterActionType) return false;
          if (filterActionSubtype && tpl.data?.transaction_subtype !== filterActionSubtype) return false;
          if (filterActionCategory && tpl.data?.transaction_category !== filterActionCategory) return false;
          return true;
        })
        .map(tpl => tpl.data?.entity)
        .filter(Boolean)
    )).sort();

    switch (selectedSettingType) {
      case 'from':
        title = 'Origin/From';
        currentList = fromOptions;
        break;
      case 'status':
        title = 'Status';
        currentList = statusOptions;
        break;
      case 'class':
        title = 'Categories';
        currentList = classOptions;
        break;
      case 'quickAction':
        title = 'Quick Actions';
        currentList = templates;
        break;
      case 'allActions':
        title = 'All Actions';
        currentList = templates.filter(tpl => {
          if (filterActionType && tpl.data?.transaction_type !== filterActionType) return false;
          if (filterActionSubtype && tpl.data?.transaction_subtype !== filterActionSubtype) return false;
          if (filterActionCategory && tpl.data?.transaction_category !== filterActionCategory) return false;
          if (filterActionEntity && tpl.data?.entity !== filterActionEntity) return false;
          return true;
        });
        break;
      default:
        break;
    }

    const handleAddOptionSubmit = (e) => {
      e.preventDefault();
      if (selectedSettingType === 'quickAction') {
        if (!qaName.trim()) {
          toast.error(t.err_enter_value);
          return;
        }
        const nameVal = qaName.trim();
        if (templates.some(tpl => tpl.name.toLowerCase() === nameVal.toLowerCase())) {
          toast.error(t.err_value_exists);
          return;
        }

        const newTemplateData = {
          icon: qaIcon || '⚡',
          data: {
            from: qaFrom,
            transaction_type: qaClass,
            transaction_subtype: qaSubClass,
            entity: qaEntity,
            transaction_category: qaCategory,
            target_account: qaTargetAccount,
            source_dest_bank: qaSourceDestBank,
            flow: qaFlow,
            payment_status: qaStatus,
            description: qaDescription || `${qaName} action`,
            amount: qaAmount || '0',
            due_date: qaDueDate || null,
            value_date: qaValueDate || null,
            posting_date: qaPostingDate || null
          }
        };

        addOption('quickAction', nameVal, newTemplateData);
        setQaName('');
        setQaDescription('');
        setQaAmount('');
        setQaDueDate('');
        setQaValueDate('');
        setQaPostingDate('');
        setQaFrom('');
        setQaClass('');
        setQaStatus('');
        setQaSubClass('');
        setQaEntity('');
        setQaCategory('');
        setQaTargetAccount('');
        setQaSourceDestBank('');
        setQaFlow('');
        toast.success(t('success_added_option', { val: nameVal }));
        return;
      }

      if (!newOptionVal.trim()) {
        toast.error(t.err_enter_value);
        return;
      }
      const val = newOptionVal.trim();
      if (currentList.some(item => typeof item === 'string' && item.toLowerCase() === val.toLowerCase())) {
        toast.error(t.err_value_exists);
        return;
      }

      const extraData = selectedSettingType === 'entity' ? { entityCategory: newEntityCatVal } : undefined;
      addOption(selectedSettingType, val, extraData);
      setNewOptionVal('');
      toast.success(t('success_added_option', { val }));
    };

    const handleDeleteOption = (val) => {
      deleteOption(selectedSettingType, val);
      toast.success(t('success_deleted_option', { val }));
    };

    return (
      <div className="flex flex-col h-full overflow-hidden">
        {/* Title */}
        <div className="border-b border-[#8b4513]/20 pb-2 mb-4 flex justify-between items-center">
          <div>
            <h3 className="title-font text-sm font-black text-[#4b2c20] uppercase">{title}</h3>
            <p className="text-[9px] text-[#5d4037]/75 font-bold uppercase tracking-wider font-sans">{t.official_ledger_editor}</p>
          </div>
          {(selectedSettingType === 'quickAction' || selectedSettingType === 'allActions') && (
            <div className="flex items-center gap-2.5">
              {/* Buttons */}
              <div className="flex gap-1">
                {selectedQaNames.length > 0 ? (
                  <>
                    {selectedSettingType === 'quickAction' && (
                      <button
                        type="button"
                        onClick={handleSaveQuickAction}
                        className="w-[28px] h-[28px] bg-emerald-755 hover:bg-emerald-800 text-white rounded-lg hover:scale-[1.05] active:scale-95 transition-all shadow cursor-pointer flex items-center justify-center font-bold text-xs"
                        title={t('save', 'Save')}
                      >
                        💾
                      </button>
                    )}
                    {selectedSettingType === 'allActions' && selectedQaNames.length === 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const tpl = templates.find(t => t.name === selectedQaNames[0]);
                          if (tpl) {
                            setSelectedQaTemplateName(tpl.name);
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
                            setIsEditingQa(true);
                          }
                        }}
                        className="w-[28px] h-[28px] bg-blue-700 hover:bg-blue-800 text-white rounded-lg hover:scale-[1.05] active:scale-95 transition-all shadow cursor-pointer flex items-center justify-center font-bold text-xs"
                        title="Edit Quick Action"
                      >
                        ✏️
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleDeleteQuickAction}
                      className="w-[28px] h-[28px] bg-red-755 hover:bg-red-800 text-white rounded-lg hover:scale-[1.05] active:scale-95 transition-all shadow cursor-pointer flex items-center justify-center font-bold text-xs"
                      title={t('delete', 'Delete')}
                    >
                      🗑️
                    </button>
                  </>
                ) : null}
              </div>
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar-subtle">
          {selectedSettingType === 'quickAction' ? (
            <ManageQuickActionsPanel
              t={t}
              templates={templates}
              selectedQaNames={selectedQaNames}
              setSelectedQaNames={setSelectedQaNames}
              qaFileInputRef={qaFileInputRef}
              importQuickActionsCSV={importQuickActionsCSV}
              handleExportAllActionsCSV={handleExportAllActionsCSV}
              onSubmitAdd={handleAddOptionSubmit}
              qaName={qaName}
              setQaName={setQaName}
              qaIcon={qaIcon}
              setQaIcon={setQaIcon}
              qaFrom={qaFrom}
              setQaFrom={setQaFrom}
              qaClass={qaClass}
              setQaClass={setQaClass}
              qaSubClass={qaSubClass}
              setQaSubClass={setQaSubClass}
              qaEntity={qaEntity}
              setQaEntity={setQaEntity}
              qaCategory={qaCategory}
              setQaCategory={setQaCategory}
              qaTargetAccount={qaTargetAccount}
              setQaTargetAccount={setQaTargetAccount}
              qaSourceDestBank={qaSourceDestBank}
              setQaSourceDestBank={setQaSourceDestBank}
              qaFlow={qaFlow}
              setQaFlow={setQaFlow}
              qaStatus={qaStatus}
              setQaStatus={setQaStatus}
              qaDescription={qaDescription}
              setQaDescription={setQaDescription}
              qaAmount={qaAmount}
              setQaAmount={setQaAmount}
              qaDueDate={qaDueDate}
              setQaDueDate={setQaDueDate}
              qaValueDate={qaValueDate}
              setQaValueDate={setQaValueDate}
              qaPostingDate={qaPostingDate}
              setQaPostingDate={setQaPostingDate}
              classOptions={classOptions}
              subClassOptions={subClassOptions}
              statusOptions={statusOptions}
              fromOptions={fromOptions}
              categoryOptions={categoryOptions}
              entityOptions={entityOptions}
              entityMappings={entityMappings}
              accountMappings={accountMappings}
            />
          ) : (
            <div className="flex flex-col gap-4">
              {/* Fallback Option Editor Form */}
              <form onSubmit={handleAddOptionSubmit} className="flex gap-2 items-end bg-[#8b4513]/5 p-3 rounded-lg border border-[#8b4513]/10">
                <div className="flex-grow">
                  <label className="block text-[8px] font-black uppercase text-[#8b4513] mb-1 font-sans">{t('new_value', 'New Value')}</label>
                  <input
                    type="text"
                    value={newOptionVal}
                    onChange={(e) => setNewOptionVal(e.target.value)}
                    placeholder={t('enter_value', 'Enter value...')}
                    className="w-full bg-[#faf4e5]/90 border border-[#8b4513]/30 rounded-lg p-2 text-xs font-bold text-[#4b2c20] focus:outline-none focus:ring-1 focus:ring-[#8b4513]/50 font-serif shadow-inner"
                  />
                </div>
                {selectedSettingType === 'entity' && (
                  <div className="w-[180px]">
                    <label className="block text-[8px] font-black uppercase text-[#8b4513] mb-1 font-sans">{t('category', 'Category')}</label>
                    <select
                      value={newEntityCatVal}
                      onChange={(e) => setNewEntityCatVal(e.target.value)}
                      className="w-full bg-[#faf4e5]/90 border border-[#8b4513]/30 rounded-lg p-2 text-xs font-bold text-[#4b2c20] focus:outline-none font-serif shadow-inner"
                    >
                      <option value="">-</option>
                      {categoryOptions.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                )}
                <button
                  type="submit"
                  className="bg-[#8b4513] text-[#ffd700] hover:bg-[#a0522d] border border-[#d4af37]/40 rounded-lg px-4 h-[33px] text-xs font-black uppercase tracking-wider transition-all hover:scale-105 active:scale-95 shadow cursor-pointer font-serif flex items-center justify-center gap-1.5"
                >
                  <span>➕</span>
                  <span>{t('add', 'Add')}</span>
                </button>
              </form>

              {/* Items List */}
              <div className="bg-[#faf4e5]/80 border border-[#8b4513]/15 rounded-lg p-3 max-h-[300px] overflow-y-auto custom-scrollbar-subtle">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {currentList.map((item, idx) => {
                    const itemVal = typeof item === 'string' ? item : item.name;
                    return (
                      <div key={idx} className="flex justify-between items-center bg-[#8b4513]/5 border border-[#8b4513]/10 rounded-md p-1.5 pl-2.5">
                        <div className="min-w-0">
                          <span className="text-[11px] font-black text-[#4b2c20] truncate block">{itemVal}</span>
                          {selectedSettingType === 'entity' && entityMappings[itemVal] && (
                            <span className="text-[8px] font-bold text-[#8b4513]/70 uppercase font-sans tracking-wide block">
                              🏷️ {entityMappings[itemVal]}
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteOption(itemVal)}
                          className="text-[#8b0000] hover:text-red-755 hover:bg-red-50 p-1 rounded transition-colors cursor-pointer"
                          title={t('delete', 'Delete')}
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className={`absolute inset-0 flex ${STANDARD_MODAL_PROPS.align} justify-center p-4 bg-black/60 backdrop-blur-xs`}
      style={{ zIndex: Z_LAYERS.OVERLAY }}
    >
      <div className={`bg-[#f4e4bc] w-full ${STANDARD_MODAL_PROPS.size} rounded-xl border-[8px] border-[#5d4037] shadow-[0_0_50px_rgba(0,0,0,0.9)] relative flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300`}>
        
        {/* Parchment Texture */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-25 mix-blend-multiply"
          style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/paper-fibers.png')" }}
        />

        {/* Ornate Corners */}
        <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-[#8b4513]/30 rounded-tl-lg pointer-events-none" />
        <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-[#8b4513]/30 rounded-tr-lg pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-[#8b4513]/30 rounded-bl-lg pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-[#8b4513]/30 rounded-br-lg pointer-events-none" />

        {/* Close Button to return to quests */}
        <button 
          onClick={onClose}
          className="absolute -top-1 -right-1 w-12 h-12 bg-[#8b0000] rounded-full flex items-center justify-center border-4 border-[#5d0000] shadow-[0_4px_10px_rgba(0,0,0,0.5)] active:scale-90 transition-transform group"
          style={{ zIndex: Z_LAYERS.MODAL_CONTENT }}
          title={t.back_to_map}
        >
          <div className="absolute inset-0 rounded-full border-2 border-white/20 animate-pulse" />
          <span className="text-[#ffd700] text-lg font-black font-sans">✕</span>
        </button>

        {/* Header Ribbon */}
        <div className="relative h-16 flex items-center justify-center z-10 pt-2">
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[110%] h-10 bg-gradient-to-r from-[#8b4513] via-[#5d4037] to-[#8b4513] shadow-lg transform -rotate-1 skew-x-12 z-0 border-y-2 border-[#d4af37]" />
          <h2 className="title-font text-lg sm:text-xl text-[#ffd700] font-bold uppercase tracking-[0.2em] relative z-10 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
            {t.configuration_panel}
          </h2>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-hidden flex-grow relative z-10 text-[#2d1b0d] flex gap-4">
          
          {/* Left Navigation Menu (Wood buttons) */}
          <div className="w-[22%] min-w-[115px] max-w-[145px] border-r border-[#8b4513]/25 pr-2 flex flex-col gap-1.5 flex-shrink-0">
            <h4 className="text-[8.5px] font-black uppercase text-[#8b4513]/70 tracking-widest mb-1.5 pl-1 title-font">{t.kingdom_lists}</h4>
            <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto custom-scrollbar-subtle">
              {[
                { id: 'from', label: 'Origin/From', icon: '👤' },
                { id: 'status', label: 'Status', icon: '📊' },
                { id: 'class', label: 'Categories', icon: '📁' },
                { id: 'subcategories', label: 'Subtypes & Categories', icon: '🏷️' },
                { id: 'coa', label: 'Chart of Accounts', icon: '📖' },
                { id: 'initialBalances', label: 'Initial Balances', icon: '⚖️' },
                { id: 'quickAction', label: 'Quick Actions', icon: '⚡' },
                { id: 'allActions', label: 'All Actions', icon: '📋' }
              ].map((btn) => {
                const isSel = selectedSettingType === btn.id;
                return (
                  <button
                    key={btn.id}
                    type="button"
                    onClick={() => {
                      setSelectedSettingType(btn.id);
                      setNewOptionVal('');
                    }}
                    className={`text-left px-2 py-2 md:py-1.5 rounded-lg font-black text-[8.5px] leading-tight uppercase tracking-wider transition-all border cursor-pointer min-h-[36px] md:min-h-0 flex items-center ${
                      isSel
                        ? 'bg-[#8b4513]/20 border-[#8b4513] text-[#4b2c20] shadow-inner font-black scale-[1.02]'
                        : 'bg-[#faf4e5]/80 border-[#8b4513]/10 text-[#5d4037]/80 hover:bg-[#8b4513]/5 hover:text-[#4b2c20]'
                    }`}
                  >
                    <span className="mr-1 text-[10px] flex-shrink-0">{btn.icon}</span>
                    <span className="truncate">{btn.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Settings Detail Panel */}
          <div className="flex-1 flex flex-col overflow-hidden pl-1">
            {renderSettingsPanel()}
          </div>

        </div>

      </div>
    </div>
  );
}
