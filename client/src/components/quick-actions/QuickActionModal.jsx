import React, { useState, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { useKingdomStore } from '../../store/useKingdomStore';
import { Z_LAYERS, STANDARD_MODAL_PROPS } from '../../constants/UI_UX';

export default function QuickActionModal({
  isOpen,
  onClose,
  t = (key, fallback) => fallback || key,
  user
}) {
  const templates = useKingdomStore(state => state.templates);
  const registerTransaction = useKingdomStore(state => state.registerTransaction);
  const addOption = useKingdomStore(state => state.addOption);
  const editOption = useKingdomStore(state => state.editOption);
  const deleteOption = useKingdomStore(state => state.deleteOption);
  const flatMatrix = useKingdomStore(state => state.flatMatrix);
  const getTypes = useKingdomStore(state => state.getTypes);
  const getSubtypesByType = useKingdomStore(state => state.getSubtypesByType);
  const getCategoriesBySubtype = useKingdomStore(state => state.getCategoriesBySubtype);
  const getEntitiesByCategory = useKingdomStore(state => state.getEntitiesByCategory);
  const fromOptions = useKingdomStore(state => state.fromOptions);
  const accountMappings = useKingdomStore(state => state.accountMappings);

  const [editMode, setEditMode] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // Form Fields
  const [tplName, setTplName] = useState('');
  const [tplIcon, setTplIcon] = useState('💸');
  const [tplFrom, setTplFrom] = useState('');
  const [tplType, setTplType] = useState('');
  const [tplSubtype, setTplSubtype] = useState('');
  const [tplCategory, setTplCategory] = useState('');
  const [tplEntity, setTplEntity] = useState('');
  const [tplTargetAccount, setTplTargetAccount] = useState('');
  const [tplSourceBank, setTplSourceBank] = useState('');
  const [tplFlow, setTplFlow] = useState('neutral');
  const [tplStatus, setTplStatus] = useState('Completed');
  const [tplAmount, setTplAmount] = useState('');
  const [tplDesc, setTplDesc] = useState('');

  const safeT = (key, fallback) => {
    if (typeof t === 'function') return t(key, fallback);
    return t?.[key] || fallback || key;
  };

  // Dynamic dropdowns strictly utilizing the flat matrix:
  const computedTypes = useMemo(() => getTypes(), [getTypes]);
  const computedSubtypes = useMemo(() => getSubtypesByType(tplType), [getSubtypesByType, tplType]);
  const computedCategories = useMemo(() => getCategoriesBySubtype(tplSubtype), [getCategoriesBySubtype, tplSubtype]);
  const computedEntities = useMemo(() => getEntitiesByCategory(tplCategory), [getEntitiesByCategory, tplCategory]);

  const computedAccounts = useMemo(() => {
    const merged = { ...accountMappings };
    flatMatrix.forEach(row => {
      if (row.code && row.code.length === 8 && !merged[row.code]) {
        merged[row.code] = row.account_name;
      }
    });
    return merged;
  }, [flatMatrix, accountMappings]);

  if (!isOpen) return null;

  const handleExecuteTemplate = async (tpl) => {
    const toastId = toast.loading(safeT('executing_action', 'Invoking quick guild action...'));
    try {
      const profileId = user?.id || '00000000-0000-0000-0000-000000000000';
      const result = await registerTransaction(profileId, {
        ...tpl.data,
        amount: Number(tpl.data.amount) || 10,
        quick_action_name: tpl.name,
        value_date: new Date().toISOString().split('T')[0],
        posting_date: new Date().toISOString().split('T')[0]
      });

      if (result && result.success) {
        toast.success(`${safeT('success_registered', 'Executed')}: ${tpl.name}!`, { id: toastId });
        onClose();
      } else {
        throw new Error(result?.error || 'Execution failed');
      }
    } catch (err) {
      console.error(err);
      toast.error(`${safeT('err_action_failed', 'Failed')}: ${err.message}`, { id: toastId });
    }
  };

  const handleTypeChange = (val) => {
    setTplType(val);
    setTplSubtype('');
    setTplCategory('');
    setTplEntity('');
  };

  const handleSubtypeChange = (val) => {
    setTplSubtype(val);
    setTplCategory('');
    setTplEntity('');
  };

  const handleCategoryChange = (val) => {
    setTplCategory(val);
    setTplEntity('');
  };

  const handleEntitySelect = (val) => {
    setTplEntity(val);
    if (val) {
      const matched = flatMatrix.find(row => row.entity === val);
      if (matched) {
        setTplType(matched.type);
        setTplSubtype(matched.subtype);
        setTplCategory(matched.category);
        if (matched.type === 'Income' || matched.type === 'Assets') {
          setTplTargetAccount(matched.code);
        } else {
          setTplSourceBank(matched.code);
        }
      }
    }
  };

  const openEdit = (tpl) => {
    setSelectedTemplate(tpl);
    setTplName(tpl.name);
    setTplIcon(tpl.icon || '⚡');
    setTplFrom(tpl.data.from || '');
    setTplType(tpl.data.transaction_type || '');
    setTplSubtype(tpl.data.transaction_subtype || '');
    setTplCategory(tpl.data.transaction_category || '');
    setTplEntity(tpl.data.entity || '');
    setTplTargetAccount(tpl.data.target_account || '');
    setTplSourceBank(tpl.data.source_dest_bank || '');
    setTplFlow(tpl.data.flow || 'neutral');
    setTplStatus(tpl.data.payment_status || 'Completed');
    setTplAmount(tpl.data.amount || '');
    setTplDesc(tpl.data.description || '');
    setEditMode(true);
  };

  const openAdd = () => {
    setSelectedTemplate(null);
    setTplName('');
    setTplIcon('💸');
    setTplFrom(fromOptions[0] || '');
    setTplType('');
    setTplSubtype('');
    setTplCategory('');
    setTplEntity('');
    setTplTargetAccount('');
    setTplSourceBank('');
    setTplFlow('neutral');
    setTplStatus('Completed');
    setTplAmount('');
    setTplDesc('');
    setEditMode(true);
  };

  const handleSaveTemplate = async () => {
    if (!tplName) {
      toast.error('Template Name is required.');
      return;
    }

    const tplData = {
      from: tplFrom,
      transaction_type: tplType,
      transaction_subtype: tplSubtype,
      transaction_category: tplCategory,
      entity: tplEntity,
      target_account: tplTargetAccount,
      source_dest_bank: tplSourceBank,
      flow: tplFlow,
      payment_status: tplStatus,
      amount: tplAmount ? Number(tplAmount) : null,
      description: tplDesc
    };

    if (selectedTemplate) {
      await editOption('quickAction', selectedTemplate.name, tplName, { icon: tplIcon, data: tplData });
      toast.success('Template updated successfully!');
    } else {
      await addOption('quickAction', tplName, { icon: tplIcon, data: tplData });
      toast.success('Template created successfully!');
    }

    setEditMode(false);
    setSelectedTemplate(null);
  };

  const handleDeleteTemplate = async (name) => {
    if (window.confirm(`Are you sure you want to banish the ${name} template?`)) {
      await deleteOption('quickAction', name);
      toast.success('Template banished successfully!');
      setEditMode(false);
      setSelectedTemplate(null);
    }
  };

  return (
    <div 
      className={`absolute inset-0 flex ${STANDARD_MODAL_PROPS.align} justify-center p-4 bg-black/60 backdrop-blur-xs`}
      style={{ zIndex: Z_LAYERS.OVERLAY }}
    >
      <div className="bg-[#f4e4bc] w-full max-w-xl rounded-xl border-[8px] border-[#5d4037] shadow-[0_0_50px_rgba(0,0,0,0.9)] relative flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
        
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

        {/* Close Button */}
        <button 
          type="button"
          onClick={onClose}
          className="absolute -top-1 -right-1 w-10 h-10 bg-[#8b0000] rounded-full flex items-center justify-center border-4 border-[#5d0000] shadow-[0_4px_10px_rgba(0,0,0,0.5)] active:scale-90 transition-transform z-50"
          title={safeT('close', 'Close')}
        >
          <span className="text-[#ffd700] text-sm font-black font-sans">✕</span>
        </button>

        {/* Ribbon Header */}
        <div className="relative h-14 flex items-center justify-center z-10 pt-1">
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[110%] h-8 bg-gradient-to-r from-[#8b4513] via-[#5d4037] to-[#8b4513] shadow-lg transform -rotate-1 skew-x-12 z-0 border-y-2 border-[#d4af37]" />
          <h2 className="title-font text-sm text-[#ffd700] font-bold uppercase tracking-[0.2em] relative z-10 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
            {editMode ? safeT('customize_guild_action', 'Guild Actions Architect') : safeT('guild_action_ledger', 'Guild Action Templates')}
          </h2>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto custom-scrollbar flex-grow relative z-10 text-[#2d1b0d] space-y-4">
          
          {!editMode ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black text-[#5d4037]/80 uppercase tracking-wider">
                  Select a template to invoke instantly
                </span>
                <button
                  type="button"
                  onClick={openAdd}
                  className="px-2.5 py-1 bg-[#8b4513] border border-[#d4af37]/30 text-[#ffd700] font-black text-[9px] uppercase tracking-wider rounded shadow-sm hover:scale-105 active:scale-95 transition-all"
                >
                  ➕ Create New
                </button>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {templates.map((tpl) => (
                  <div 
                    key={tpl.name}
                    className="flex justify-between items-center bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg p-2 hover:bg-[#faf4e5] transition-all group"
                  >
                    <button
                      type="button"
                      onClick={() => handleExecuteTemplate(tpl)}
                      className="flex items-center gap-3 text-left flex-grow"
                    >
                      <span className="text-xl bg-[#faf4e5] border border-[#8b4513]/30 p-1.5 rounded-md group-hover:scale-110 transition-transform">
                        {tpl.icon || '⚡'}
                      </span>
                      <div>
                        <div className="text-xs font-black text-[#4b2c20]">{tpl.name}</div>
                        <div className="text-[9px] text-[#5d4037]/75 font-mono">
                          {tpl.data.transaction_type} • {tpl.data.entity} {tpl.data.amount ? `(${tpl.data.amount}g)` : ''}
                        </div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => openEdit(tpl)}
                      className="text-[#b8860b] hover:text-[#d4af37] text-xs font-bold px-2 py-1 rounded border border-[#8b4513]/20 hover:bg-[#8b4513]/5"
                    >
                      ✏️ Edit
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // Edit Form strictly complying with the Version 2.0 dynamic cascading structure
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[8px] font-black uppercase text-[#5d4037]/75 mb-0.5">Template Name</label>
                  <input
                    type="text"
                    value={tplName}
                    onChange={(e) => setTplName(e.target.value)}
                    className="w-full bg-[#faf4e5] border border-[#8b4513]/25 rounded px-2 py-1 text-xs font-bold text-[#4b2c20] focus:outline-none"
                    placeholder="E.g., Rent Payment"
                  />
                </div>
                <div>
                  <label className="block text-[8px] font-black uppercase text-[#5d4037]/75 mb-0.5">Icon Emoji</label>
                  <input
                    type="text"
                    value={tplIcon}
                    onChange={(e) => setTplIcon(e.target.value)}
                    className="w-full bg-[#faf4e5] border border-[#8b4513]/25 rounded px-2 py-1 text-xs font-bold text-[#4b2c20] focus:outline-none text-center"
                    placeholder="💸"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[8px] font-black uppercase text-[#5d4037]/75 mb-0.5">From</label>
                  <select
                    value={tplFrom}
                    onChange={(e) => setTplFrom(e.target.value)}
                    className="w-full bg-[#faf4e5] border border-[#8b4513]/25 rounded px-2 py-1 text-xs font-bold text-[#4b2c20] focus:outline-none"
                  >
                    <option value="">-- Choose From --</option>
                    {fromOptions.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[8px] font-black uppercase text-[#5d4037]/75 mb-0.5">Status</label>
                  <select
                    value={tplStatus}
                    onChange={(e) => setTplStatus(e.target.value)}
                    className="w-full bg-[#faf4e5] border border-[#8b4513]/25 rounded px-2 py-1 text-xs font-bold text-[#4b2c20] focus:outline-none"
                  >
                    <option value="Completed">Completed</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[8px] font-black uppercase text-[#5d4037]/75 mb-0.5">Type</label>
                  <select
                    value={tplType}
                    onChange={(e) => handleTypeChange(e.target.value)}
                    className="w-full bg-[#faf4e5] border border-[#8b4513]/25 rounded px-2 py-1 text-xs font-bold text-[#4b2c20] focus:outline-none"
                  >
                    <option value="">-- Type --</option>
                    {computedTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[8px] font-black uppercase text-[#5d4037]/75 mb-0.5">Subtype</label>
                  <select
                    value={tplSubtype}
                    onChange={(e) => handleSubtypeChange(e.target.value)}
                    className="w-full bg-[#faf4e5] border border-[#8b4513]/25 rounded px-2 py-1 text-xs font-bold text-[#4b2c20] focus:outline-none"
                  >
                    <option value="">-- Subtype --</option>
                    {computedSubtypes.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[8px] font-black uppercase text-[#5d4037]/75 mb-0.5">Category</label>
                  <select
                    value={tplCategory}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="w-full bg-[#faf4e5] border border-[#8b4513]/25 rounded px-2 py-1 text-xs font-bold text-[#4b2c20] focus:outline-none"
                  >
                    <option value="">-- Category --</option>
                    {computedCategories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[8px] font-black uppercase text-[#5d4037]/75 mb-0.5">Entity</label>
                  <select
                    value={tplEntity}
                    onChange={(e) => handleEntitySelect(e.target.value)}
                    className="w-full bg-[#faf4e5] border border-[#8b4513]/25 rounded px-2 py-1 text-xs font-bold text-[#4b2c20] focus:outline-none font-sans"
                  >
                    <option value="">-- Entity --</option>
                    {computedEntities.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[8px] font-black uppercase text-[#5d4037]/75 mb-0.5">Default Amount</label>
                  <input
                    type="number"
                    value={tplAmount}
                    onChange={(e) => setTplAmount(e.target.value)}
                    className="w-full bg-[#faf4e5] border border-[#8b4513]/25 rounded px-2 py-1 text-xs font-bold text-[#4b2c20] focus:outline-none font-mono"
                    placeholder="100"
                  />
                </div>
                <div>
                  <label className="block text-[8px] font-black uppercase text-[#5d4037]/75 mb-0.5">Flow Direction</label>
                  <select
                    value={tplFlow}
                    onChange={(e) => setTplFlow(e.target.value)}
                    className="w-full bg-[#faf4e5] border border-[#8b4513]/25 rounded px-2 py-1 text-xs font-bold text-[#4b2c20] focus:outline-none"
                  >
                    <option value="inflow">Inflow</option>
                    <option value="outflow">Outflow</option>
                    <option value="neutral">Neutral</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[8px] font-black uppercase text-[#5d4037]/75 mb-0.5">Source Account</label>
                  <select
                    value={tplSourceBank}
                    onChange={(e) => setTplSourceBank(e.target.value)}
                    className="w-full bg-[#faf4e5] border border-[#8b4513]/25 rounded px-2 py-1 text-xs font-bold text-[#4b2c20] focus:outline-none font-sans"
                  >
                    <option value="">-- Source Bank --</option>
                    {Object.entries(computedAccounts).map(([code, name]) => (
                      <option key={code} value={code}>{code} - {name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[8px] font-black uppercase text-[#5d4037]/75 mb-0.5">Target Account</label>
                  <select
                    value={tplTargetAccount}
                    onChange={(e) => setTplTargetAccount(e.target.value)}
                    className="w-full bg-[#faf4e5] border border-[#8b4513]/25 rounded px-2 py-1 text-xs font-bold text-[#4b2c20] focus:outline-none font-sans"
                  >
                    <option value="">-- Target Account --</option>
                    {Object.entries(computedAccounts).map(([code, name]) => (
                      <option key={code} value={code}>{code} - {name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[8px] font-black uppercase text-[#5d4037]/75 mb-0.5">Description Template</label>
                <input
                  type="text"
                  value={tplDesc}
                  onChange={(e) => setTplDesc(e.target.value)}
                  className="w-full bg-[#faf4e5] border border-[#8b4513]/25 rounded px-2 py-1 text-xs font-bold text-[#4b2c20] focus:outline-none animate-none"
                  placeholder="E.g., Monthly house rent"
                />
              </div>

              <div className="flex justify-between items-center pt-2 gap-2">
                {selectedTemplate && (
                  <button
                    type="button"
                    onClick={() => handleDeleteTemplate(selectedTemplate.name)}
                    className="px-3 py-1.5 bg-[#8b0000] border border-[#5d0000] text-[#ffd700] text-xs font-bold uppercase rounded-md shadow"
                  >
                    🗑️ Banish Template
                  </button>
                )}
                <div className="flex gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setEditMode(false)}
                    className="px-3 py-1.5 bg-[#5d4037] text-[#ffd700] text-xs font-bold uppercase rounded-md shadow"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveTemplate}
                    className="px-3 py-1.5 bg-emerald-700 text-white text-xs font-bold uppercase rounded-md shadow"
                  >
                    Save Action
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}