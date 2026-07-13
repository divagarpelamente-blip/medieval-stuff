import React, { useState, useMemo } from "react";
import { toast } from "react-hot-toast";
import { useKingdomStore } from "../../store/useKingdomStore";
import {
  Sparkles,
  Layers,
  Sliders,
  CheckCircle,
  AlertCircle,
  FileText,
  Zap,
  Bookmark,
  Search,
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  X,
  Globe,
  Database,
  ChevronDown,
  Info,
  Save,
  ArrowRight
} from "lucide-react";

// ============================================================================
// HELPER COMBOBOX COMPONENT
// Styled to match the Feudal Parchment & Wood Palette
// ============================================================================
const Combobox = ({
  id,
  label,
  value,
  onChange,
  options = [],
  onSaveNew,
  activeDropdownId,
  setActiveDropdownId,
  placeholder = "Select or type custom..."
}) => {
  const isNewValue =
    value &&
    value.trim() !== "" &&
    !options.some((opt) => opt.toLowerCase() === value.trim().toLowerCase());

  const handleActionClick = () => {
    if (isNewValue) {
      if (onSaveNew) {
        onSaveNew(value.trim());
      }
    } else {
      setActiveDropdownId(activeDropdownId === id ? null : id);
    }
  };

  return (
    <div className="relative space-y-1.5" onClick={(e) => e.stopPropagation()}>
      <label className="block text-[10px] uppercase tracking-widest text-[#8b4513] font-black">
        {label}
      </label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={value}
            placeholder={placeholder}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setActiveDropdownId(id)}
            className="w-full bg-[#faf4e5]/90 border border-[#8b4513]/30 hover:border-[#8b4513]/60 rounded-xl py-3 pl-3.5 pr-10 text-xs text-[#4b2c20] placeholder-[#5d4037]/40 focus:outline-none focus:ring-1 focus:ring-[#8b4513]/50 font-serif font-bold shadow-inner"
          />
          <button
            type="button"
            onClick={() => setActiveDropdownId(activeDropdownId === id ? null : id)}
            className="absolute right-3.5 top-3.5 text-[#8b4513]/70 hover:text-[#8b4513] transition-colors"
          >
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${
                activeDropdownId === id ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Dropdown Options Box */}
          {activeDropdownId === id && (
            <div className="absolute z-50 left-0 right-0 mt-1.5 max-h-48 overflow-y-auto bg-[#faf4e5] border border-[#8b4513]/40 rounded-xl shadow-xl scrollbar-thin">
              {options.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    onChange(opt);
                    setActiveDropdownId(null);
                  }}
                  className="w-full text-left px-4 py-2.5 text-xs text-[#5d4037] font-bold hover:bg-[#8b4513]/10 hover:text-[#4b2c20] transition-colors border-b border-[#8b4513]/10 last:border-0"
                >
                  {opt}
                </button>
              ))}
              {options.length === 0 && (
                <div className="p-3 text-center text-[10px] text-slate-500 uppercase tracking-widest font-sans">
                  No options registered
                </div>
              )}
            </div>
          )}
        </div>

        {/* Dynamic Action Button */}
        <button
          type="button"
          onClick={handleActionClick}
          className={`px-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-1.5 border min-w-[76px] cursor-pointer ${
            isNewValue
              ? "bg-[#8b4513] text-[#ffd700] hover:bg-[#a0522d] border-[#d4af37]/40 shadow hover:scale-105 active:scale-95"
              : "bg-[#faf4e5]/80 hover:bg-[#8b4513]/5 border-[#8b4513]/20 text-[#5d4037]/80 hover:text-[#4b2c20]"
          }`}
        >
          {isNewValue ? <Save className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5 text-[#8b4513]" />}
          <span>{isNewValue ? "Save" : "New"}</span>
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN SETTINGS MODAL COMPONENT
// Composed strictly under the Version 2.0 Flat Matrix & 8-Digit COA Paradigm
// ============================================================================
const SettingsModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  // Store connection using Version 2 Flat Matrix directives
  const {
    flatMatrix,
    fromOptions,
    templates,
    language,
    syncSettings,
    addOption,
    editOption,
    deleteOption,
    setLanguage,
    getTypes,
    getSubtypesByType,
    getCategoriesBySubtype,
    getEntitiesByCategory,
    getAccountCode,
    fetchChartOfAccounts
  } = useKingdomStore();

  // Navigation & Dropdown Management State
  const [activeTab, setActiveTab] = useState("general"); // 'general' | 'coa' | 'templates'
  const [activeDropdownId, setActiveDropdownId] = useState(null);

  // ----------------------------------------------------
  // TAB 1: GENERAL REALM SETTINGS STATE
  // ----------------------------------------------------
  const [newLordName, setNewLordName] = useState("");

  const handleAddLord = () => {
    const cleanName = newLordName.trim();
    if (!cleanName) return;
    if (fromOptions.includes(cleanName)) {
      toast.error("This Lord is already enlisted in the Council.");
      return;
    }
    const updated = [...fromOptions, cleanName];
    syncSettings({ fromOptions: updated });
    setNewLordName("");
    toast.success("Lord welcomed to the High Council.");
  };

  const handleRemoveLord = (lord) => {
    if (fromOptions.length <= 1) {
      toast.error("The High Council must retain at least one Lord.");
      return;
    }
    const updated = fromOptions.filter((opt) => opt !== lord);
    syncSettings({ fromOptions: updated });
    toast.success("Lord dismissed from the Privy council.");
  };

  // ----------------------------------------------------
  // TAB 2: LEDGER REGISTRY (CHART OF ACCOUNTS) STATE
  // ----------------------------------------------------
  const [coaSearch, setCoaSearch] = useState("");
  const [entityType, setEntityType] = useState("");
  const [entitySubtype, setEntitySubtype] = useState("");
  const [entityCategory, setEntityCategory] = useState("");
  const [entityValue, setEntityValue] = useState("");
  const [editingRowCode, setEditingRowCode] = useState(null);
  const [editEntityInput, setEditEntityInput] = useState("");

  // Filter COA flatMatrix on search string
  const filteredCOA = useMemo(() => {
    if (!coaSearch.trim()) return flatMatrix;
    const term = coaSearch.toLowerCase();
    return flatMatrix.filter((row) => {
      return (
        row.code.includes(term) ||
        row.account_name.toLowerCase().includes(term) ||
        row.type.toLowerCase().includes(term) ||
        row.subtype.toLowerCase().includes(term) ||
        row.category.toLowerCase().includes(term) ||
        row.entity.toLowerCase().includes(term)
      );
    });
  }, [flatMatrix, coaSearch]);

  const coaTypes = useMemo(() => getTypes(), [getTypes]);
  const coaSubtypes = useMemo(() => getSubtypesByType(entityType), [entityType, getSubtypesByType]);
  const coaCategories = useMemo(() => getCategoriesBySubtype(entitySubtype), [entitySubtype, getCategoriesBySubtype]);

  // Handle explicit category selections and clear descendants
  const handleTypeChange = (val) => {
    setEntityType(val);
    setEntitySubtype("");
    setEntityCategory("");
  };

  const handleSubtypeChange = (val) => {
    setEntitySubtype(val);
    setEntityCategory("");
  };

  const handleAddCOAEntity = async (e) => {
    e.preventDefault();
    if (!entityCategory) {
      toast.error("A parent Category must be active to enlist an entity.");
      return;
    }
    if (!entityValue.trim()) {
      toast.error("The Entity must bear a non-empty taxonomic name.");
      return;
    }

    try {
      await addOption("entity", entityValue.trim(), { category: entityCategory });
      setEntityValue("");
      toast.success("Ledger entry registered successfully.");
    } catch (error) {
      toast.error("An error occurred while creating the entity.");
    }
  };

  const handleStartEditing = (row) => {
    setEditingRowCode(row.code);
    setEditEntityInput(row.entity);
  };

  const handleSaveEntityEdit = async (oldValue) => {
    const cleanNewVal = editEntityInput.trim();
    if (!cleanNewVal) {
      toast.error("The entry name cannot be blank.");
      return;
    }
    try {
      await editOption("entity", oldValue, cleanNewVal);
      setEditingRowCode(null);
      toast.success("Ledger row updated successfully.");
    } catch (error) {
      toast.error("An error occurred during preservation.");
    }
  };

  const handleDeleteCOAEntity = async (entityName) => {
    if (window.confirm(`Dissolve ${entityName} from the kingdom accounts?`)) {
      try {
        await deleteOption("entity", entityName);
        toast.success("Ledger balance point decoupled.");
      } catch (error) {
        toast.error("Could not dissolve entry.");
      }
    }
  };

  // ----------------------------------------------------
  // TAB 3: SCRIBE TEMPLATES (QUICK ACTIONS) STATE
  // ----------------------------------------------------
  const [tplName, setTplName] = useState("");
  const [tplIcon, setTplIcon] = useState("💸");
  const [tplFrom, setTplFrom] = useState("Consolidated");
  const [tplType, setTplType] = useState("Expenses");
  const [tplSubtype, setTplSubtype] = useState("");
  const [tplCategory, setTplCategory] = useState("");
  const [tplEntity, setTplEntity] = useState("");
  const [tplFlow, setTplFlow] = useState("outflow");
  const [tplStatus, setTplStatus] = useState("Completed");
  const [tplDesc, setTplDesc] = useState("");

  // Filter lists for Template Creator
  const templateSubtypes = useMemo(() => getSubtypesByType(tplType), [tplType, getSubtypesByType]);
  const templateCategories = useMemo(() => getCategoriesBySubtype(tplSubtype), [tplSubtype, getCategoriesBySubtype]);
  const templateEntities = useMemo(() => getEntitiesByCategory(tplCategory), [tplCategory, getEntitiesByCategory]);

  const sourceBankOptions = useMemo(() => {
    return flatMatrix.filter(
      (row) =>
        row.code.startsWith("1101") ||
        row.code.startsWith("1102") ||
        row.code.startsWith("1103")
    );
  }, [flatMatrix]);

  const targetAccountOptions = useMemo(() => flatMatrix, [flatMatrix]);

  const [tplSourceBank, setTplSourceBank] = useState("11010001");
  const [tplTargetAccount, setTplTargetAccount] = useState("");

  const handleTplTypeChange = (val) => {
    setTplType(val);
    setTplSubtype("");
    setTplCategory("");
    setTplEntity("");
  };

  const handleTplSubtypeChange = (val) => {
    setTplSubtype(val);
    setTplCategory("");
    setTplEntity("");
  };

  const handleTplCategoryChange = (val) => {
    setTplCategory(val);
    setTplEntity("");
  };

  const handleAddTemplate = (e) => {
    e.preventDefault();
    if (!tplName.trim()) {
      toast.error("The scribe blueprint must bear a name.");
      return;
    }

    const resolvedTarget = tplTargetAccount || getAccountCode(tplType, tplSubtype, tplCategory, tplEntity);

    const payload = {
      name: tplName.trim(),
      icon: tplIcon,
      data: {
        from: tplFrom,
        transaction_type: tplType,
        transaction_subtype: tplSubtype,
        entity: tplEntity,
        transaction_category: tplCategory,
        target_account: resolvedTarget || "",
        source_dest_bank: tplSourceBank,
        flow: tplFlow,
        payment_status: tplStatus,
        description: tplDesc
      }
    };

    addOption("quickAction", payload.name, payload);
    setTplName("");
    setTplDesc("");
    toast.success("Scribe blueprint recorded in local archives.");
  };

  const handleDeleteTemplate = (name) => {
    deleteOption("quickAction", name);
    toast.success("Scribe blueprint expunged.");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      onClick={() => setActiveDropdownId(null)}
    >
      {/* Outer Ledger Sheet wrapper */}
      <div
        className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-[#faf4e5] border-4 border-[#8b4513] rounded-2xl shadow-2xl overflow-hidden font-serif"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ancient Wood Header */}
        <div className="bg-[#4b2c20] text-[#ffd700] px-6 py-4 flex items-center justify-between border-b-2 border-[#8b4513]/60">
          <div className="flex items-center gap-3">
            <Sliders className="w-5 h-5 text-[#ffd700]" />
            <h2 className="text-lg font-black uppercase tracking-widest">
              Royal Archive Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-[#ffd700]/70 hover:text-[#ffd700] p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection Row */}
        <div className="bg-[#8b4513]/10 border-b border-[#8b4513]/20 flex">
          {[
            { id: "general", label: "Council Lords & Scribes", icon: Globe },
            { id: "coa", label: "Chart of Accounts Ledger", icon: Database },
            { id: "templates", label: "Scribe Templates", icon: FileText }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setActiveDropdownId(null);
                }}
                className={`flex items-center gap-2 px-6 py-3 text-xs font-black uppercase tracking-wider border-r border-[#8b4513]/20 transition-all ${
                  activeTab === tab.id
                    ? "bg-[#faf4e5] text-[#8b4513] border-b-2 border-b-[#8b4513]"
                    : "text-[#8b4513]/60 hover:text-[#8b4513] hover:bg-[#8b4513]/5"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Modal Scrollable Contents */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
          {/* ================================================================= */}
          {/* TAB 1: GENERAL REALM SETTINGS */}
          {/* ================================================================= */}
          {activeTab === "general" && (
            <div className="space-y-6">
              {/* Language Settings */}
              <div className="bg-[#faf4e5] border border-[#8b4513]/30 rounded-xl p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-[#8b4513]/10">
                  <Globe className="w-4 h-4 text-[#8b4513]" />
                  <h3 className="text-sm font-black uppercase tracking-wider text-[#4b2c20]">
                    Realm Language
                  </h3>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setLanguage("en")}
                    className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider border transition-all ${
                      language === "en"
                        ? "bg-[#8b4513] text-[#ffd700] border-[#d4af37] shadow-md"
                        : "bg-white/80 text-[#8b4513]/60 border-[#8b4513]/20 hover:bg-[#8b4513]/5"
                    }`}
                  >
                    🇬🇧 English Tongue
                  </button>
                  <button
                    onClick={() => setLanguage("pt")}
                    className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider border transition-all ${
                      language === "pt"
                        ? "bg-[#8b4513] text-[#ffd700] border-[#d4af37] shadow-md"
                        : "bg-white/80 text-[#8b4513]/60 border-[#8b4513]/20 hover:bg-[#8b4513]/5"
                    }`}
                  >
                    🇵🇹 Língua Portuguesa
                  </button>
                </div>
              </div>

              {/* Lords of the Council Setting */}
              <div className="bg-[#faf4e5] border border-[#8b4513]/30 rounded-xl p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-[#8b4513]/10">
                  <Sparkles className="w-4 h-4 text-[#8b4513]" />
                  <h3 className="text-sm font-black uppercase tracking-wider text-[#4b2c20]">
                    Lords of the Council
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Current Active List */}
                  <div className="space-y-2">
                    <label className="block text-[10px] uppercase tracking-widest text-[#8b4513] font-black">
                      Enlisted Council Members
                    </label>
                    <div className="bg-white/60 border border-[#8b4513]/20 rounded-xl divide-y divide-[#8b4513]/10 overflow-hidden">
                      {fromOptions.map((lord) => (
                        <div
                          key={lord}
                          className="flex items-center justify-between px-4 py-2.5 text-xs font-bold text-[#4b2c20]"
                        >
                          <span>{lord}</span>
                          <button
                            onClick={() => handleRemoveLord(lord)}
                            className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                            title="Dismiss from Realm"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Add New Scribe Section */}
                  <div className="space-y-3 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <label className="block text-[10px] uppercase tracking-widest text-[#8b4513] font-black">
                        New Enlistment Name
                      </label>
                      <input
                        type="text"
                        value={newLordName}
                        onChange={(e) => setNewLordName(e.target.value)}
                        placeholder="e.g. Duchess Maria"
                        className="w-full bg-[#faf4e5]/90 border border-[#8b4513]/30 hover:border-[#8b4513]/60 rounded-xl py-3 px-4 text-xs text-[#4b2c20] placeholder-[#5d4037]/40 focus:outline-none focus:ring-1 focus:ring-[#8b4513]/50 font-serif font-bold shadow-inner"
                      />
                    </div>
                    <button
                      onClick={handleAddLord}
                      className="w-full bg-[#8b4513] text-[#ffd700] border border-[#d4af37]/30 hover:bg-[#a0522d] py-3 rounded-xl text-xs font-black uppercase tracking-wider shadow transition-all duration-200"
                    >
                      Enlist Council Lord
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 2: LEDGER REGISTRY (CHART OF ACCOUNTS) */}
          {/* ================================================================= */}
          {activeTab === "coa" && (
            <div className="space-y-6">
              {/* Add Custom Entry Form */}
              <div className="bg-[#faf4e5] border border-[#8b4513]/30 rounded-xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[#8b4513]/10">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#8b4513]" />
                    <h3 className="text-sm font-black uppercase tracking-wider text-[#4b2c20]">
                      Enlist New Entity
                    </h3>
                  </div>
                  <button
                    onClick={() => fetchChartOfAccounts()}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider bg-white border border-[#8b4513]/20 hover:border-[#8b4513]/50 rounded-lg text-[#8b4513]"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Synchronize
                  </button>
                </div>

                <form onSubmit={handleAddCOAEntity} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  {/* Select Type */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] uppercase tracking-widest text-[#8b4513] font-black">
                      Ledger Type
                    </label>
                    <select
                      value={entityType}
                      onChange={(e) => handleTypeChange(e.target.value)}
                      className="w-full bg-[#faf4e5] border border-[#8b4513]/30 rounded-xl px-3 py-2.5 text-xs font-bold text-[#4b2c20] focus:ring-1 focus:ring-[#8b4513]/50 focus:outline-none"
                    >
                      <option value="">-- Choose Type --</option>
                      {coaTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Select Subtype */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] uppercase tracking-widest text-[#8b4513] font-black">
                      Subtype
                    </label>
                    <select
                      value={entitySubtype}
                      disabled={!entityType}
                      onChange={(e) => handleSubtypeChange(e.target.value)}
                      className="w-full bg-[#faf4e5] border border-[#8b4513]/30 rounded-xl px-3 py-2.5 text-xs font-bold text-[#4b2c20] focus:ring-1 focus:ring-[#8b4513]/50 focus:outline-none disabled:opacity-50"
                    >
                      <option value="">-- Choose Subtype --</option>
                      {coaSubtypes.map((sub) => (
                        <option key={sub} value={sub}>
                          {sub}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Select Category */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] uppercase tracking-widest text-[#8b4513] font-black">
                      Category
                    </label>
                    <select
                      value={entityCategory}
                      disabled={!entitySubtype}
                      onChange={(e) => setEntityCategory(e.target.value)}
                      className="w-full bg-[#faf4e5] border border-[#8b4513]/30 rounded-xl px-3 py-2.5 text-xs font-bold text-[#4b2c20] focus:ring-1 focus:ring-[#8b4513]/50 focus:outline-none disabled:opacity-50"
                    >
                      <option value="">-- Choose Category --</option>
                      {coaCategories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Combobox style input for entity with direct store mapping */}
                  <div className="md:col-span-4 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="md:col-span-3">
                      <Combobox
                        id="coa_entity_setup"
                        label="Account Entity Name"
                        value={entityValue}
                        onChange={setEntityValue}
                        options={entityCategory ? getEntitiesByCategory(entityCategory) : []}
                        activeDropdownId={activeDropdownId}
                        setActiveDropdownId={setActiveDropdownId}
                        placeholder="Select or enter custom ledger entity name..."
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-[#8b4513] text-[#ffd700] hover:bg-[#a0522d] font-black text-xs uppercase tracking-widest border border-[#d4af37]/30 py-3 rounded-xl shadow-md cursor-pointer"
                    >
                      Enlist Entry
                    </button>
                  </div>
                </form>

                <div className="flex items-start gap-2 bg-[#8b4513]/5 p-3 rounded-xl border border-[#8b4513]/15">
                  <Info className="w-4 h-4 text-[#8b4513] shrink-0 mt-0.5" />
                  <p className="text-[11px] text-[#5d4037] leading-relaxed">
                    <strong>8-Digit COA Generator:</strong> Enlisting custom entities dynamically derives the corresponding nested COA code sequence matching the taxonomic parameters.
                  </p>
                </div>
              </div>

              {/* COA Ledger Explorer */}
              <div className="bg-[#faf4e5] border border-[#8b4513]/30 rounded-xl p-5 shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-2 border-b border-[#8b4513]/10">
                  <h3 className="text-sm font-black uppercase tracking-wider text-[#4b2c20]">
                    Chart of Accounts Directory
                  </h3>
                  <div className="relative w-full md:w-72">
                    <input
                      type="text"
                      value={coaSearch}
                      onChange={(e) => setCoaSearch(e.target.value)}
                      placeholder="Filter by Name, Category or Code..."
                      className="w-full bg-[#faf4e5]/90 border border-[#8b4513]/30 rounded-xl py-2 pl-9 pr-4 text-xs text-[#4b2c20] placeholder-[#5d4037]/50 focus:outline-none"
                    />
                    <Search className="w-3.5 h-3.5 text-[#5d4037]/50 absolute left-3 top-2.5" />
                  </div>
                </div>

                <div className="border border-[#8b4513]/20 rounded-xl overflow-hidden max-h-96 overflow-y-auto scrollbar-thin">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#4b2c20] text-[#ffd700] uppercase tracking-wider text-[10px] font-black">
                        <th className="py-3 px-4">Code</th>
                        <th className="py-3 px-4">Ledger Type</th>
                        <th className="py-3 px-4">Subclass</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Entity</th>
                        <th className="py-3 px-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#8b4513]/10">
                      {filteredCOA.map((row, idx) => (
                        <tr
                          key={row.code + idx}
                          className={`${
                            idx % 2 === 0 ? "bg-white/40" : "bg-transparent"
                          } hover:bg-[#8b4513]/5 transition-colors`}
                        >
                          <td className="py-3 px-4 font-mono font-bold text-[#8b4513]">
                            {row.code}
                          </td>
                          <td className="py-3 px-4 font-medium text-[#4b2c20]">
                            {row.type}
                          </td>
                          <td className="py-3 px-4 text-[#5d4037]">{row.subtype}</td>
                          <td className="py-3 px-4 text-[#5d4037]">{row.category}</td>
                          <td className="py-3 px-4 font-bold text-[#4b2c20]">
                            {editingRowCode === row.code ? (
                              <input
                                type="text"
                                value={editEntityInput}
                                onChange={(e) => setEditEntityInput(e.target.value)}
                                className="bg-[#faf4e5] border border-[#8b4513]/50 rounded px-2 py-0.5 text-xs text-[#4b2c20] font-bold focus:outline-none focus:ring-1 focus:ring-[#8b4513]"
                              />
                            ) : (
                              row.entity
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {editingRowCode === row.code ? (
                                <button
                                  onClick={() => handleSaveEntityEdit(row.entity)}
                                  className="p-1 text-green-700 hover:bg-green-100 rounded"
                                  title="Save Changes"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleStartEditing(row)}
                                  className="p-1 text-[#8b4513]/80 hover:text-[#8b4513] hover:bg-[#8b4513]/10 rounded"
                                  title="Rename Entity"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteCOAEntity(row.entity)}
                                className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                                title="Dissolve Account"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredCOA.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-500 uppercase tracking-widest font-sans">
                            No ledger structures located
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 3: SCRIBE TEMPLATES (QUICK ACTIONS) */}
          {/* ================================================================= */}
          {activeTab === "templates" && (
            <div className="space-y-6">
              {/* Add New Scribe Template */}
              <form onSubmit={handleAddTemplate} className="bg-[#faf4e5] border border-[#8b4513]/30 rounded-xl p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-[#8b4513]/10">
                  <Zap className="w-4 h-4 text-[#8b4513]" />
                  <h3 className="text-sm font-black uppercase tracking-wider text-[#4b2c20]">
                    Draft Scribe Blueprint
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Template Title */}
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="block text-[10px] uppercase tracking-widest text-[#8b4513] font-black">
                      Template Title
                    </label>
                    <input
                      type="text"
                      value={tplName}
                      onChange={(e) => setTplName(e.target.value)}
                      placeholder="e.g., Pay Rent"
                      className="w-full bg-[#faf4e5] border border-[#8b4513]/30 rounded-xl px-3 py-2 text-xs font-bold text-[#4b2c20] focus:ring-1 focus:ring-[#8b4513]/50 focus:outline-none"
                    />
                  </div>

                  {/* Template Icon */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] uppercase tracking-widest text-[#8b4513] font-black">
                      Icon Glyph
                    </label>
                    <select
                      value={tplIcon}
                      onChange={(e) => setTplIcon(e.target.value)}
                      className="w-full bg-[#faf4e5] border border-[#8b4513]/30 rounded-xl px-3 py-2 text-xs font-bold text-[#4b2c20] focus:ring-1 focus:ring-[#8b4513]/50 focus:outline-none"
                    >
                      <option value="💸">💸 Gold Flow</option>
                      <option value="💳">💳 Credit Tab</option>
                      <option value="🧾">🧾 Payment Due</option>
                      <option value="🛡️">🛡️ Royal Tax</option>
                      <option value="🏰">🏰 Keep Asset</option>
                      <option value="🪙">🪙 Vault Gold</option>
                    </select>
                  </div>

                  {/* Responsible Council Member */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] uppercase tracking-widest text-[#8b4513] font-black">
                      Council Authority
                    </label>
                    <select
                      value={tplFrom}
                      onChange={(e) => setTplFrom(e.target.value)}
                      className="w-full bg-[#faf4e5] border border-[#8b4513]/30 rounded-xl px-3 py-2 text-xs font-bold text-[#4b2c20] focus:ring-1 focus:ring-[#8b4513]/50 focus:outline-none"
                    >
                      {fromOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Type Taxonomy */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] uppercase tracking-widest text-[#8b4513] font-black">
                      Taxonomy Type
                    </label>
                    <select
                      value={tplType}
                      onChange={(e) => handleTplTypeChange(e.target.value)}
                      className="w-full bg-[#faf4e5] border border-[#8b4513]/30 rounded-xl px-3 py-2 text-xs font-bold text-[#4b2c20] focus:ring-1 focus:ring-[#8b4513]/50 focus:outline-none"
                    >
                      {coaTypes.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Subtype Taxonomy */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] uppercase tracking-widest text-[#8b4513] font-black">
                      Subclass
                    </label>
                    <select
                      value={tplSubtype}
                      onChange={(e) => handleTplSubtypeChange(e.target.value)}
                      className="w-full bg-[#faf4e5] border border-[#8b4513]/30 rounded-xl px-3 py-2 text-xs font-bold text-[#4b2c20] focus:ring-1 focus:ring-[#8b4513]/50 focus:outline-none"
                    >
                      <option value="">-- Select Subtype --</option>
                      {templateSubtypes.map((sub) => (
                        <option key={sub} value={sub}>
                          {sub}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Category Taxonomy */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] uppercase tracking-widest text-[#8b4513] font-black">
                      Category
                    </label>
                    <select
                      value={tplCategory}
                      disabled={!tplSubtype}
                      onChange={(e) => handleTplCategoryChange(e.target.value)}
                      className="w-full bg-[#faf4e5] border border-[#8b4513]/30 rounded-xl px-3 py-2 text-xs font-bold text-[#4b2c20] focus:ring-1 focus:ring-[#8b4513]/50 focus:outline-none disabled:opacity-50"
                    >
                      <option value="">-- Select Category --</option>
                      {templateCategories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Entity Taxonomy */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] uppercase tracking-widest text-[#8b4513] font-black">
                      Entity
                    </label>
                    <select
                      value={tplEntity}
                      disabled={!tplCategory}
                      onChange={(e) => setTplEntity(e.target.value)}
                      className="w-full bg-[#faf4e5] border border-[#8b4513]/30 rounded-xl px-3 py-2 text-xs font-bold text-[#4b2c20] focus:ring-1 focus:ring-[#8b4513]/50 focus:outline-none disabled:opacity-50"
                    >
                      <option value="">-- Select Entity --</option>
                      {templateEntities.map((ent) => (
                        <option key={ent} value={ent}>
                          {ent}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Flow Direction */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] uppercase tracking-widest text-[#8b4513] font-black">
                      Flow Direction
                    </label>
                    <select
                      value={tplFlow}
                      onChange={(e) => setTplFlow(e.target.value)}
                      className="w-full bg-[#faf4e5] border border-[#8b4513]/30 rounded-xl px-3 py-2 text-xs font-bold text-[#4b2c20] focus:ring-1 focus:ring-[#8b4513]/50 focus:outline-none"
                    >
                      <option value="outflow">Outflow (Expense)</option>
                      <option value="inflow">Inflow (Income)</option>
                      <option value="neutral">Neutral (Internal Transfer)</option>
                    </select>
                  </div>

                  {/* Default Vault Asset Account */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] uppercase tracking-widest text-[#8b4513] font-black">
                      Source / Bank Vault (8-digit)
                    </label>
                    <select
                      value={tplSourceBank}
                      onChange={(e) => setTplSourceBank(e.target.value)}
                      className="w-full bg-[#faf4e5] border border-[#8b4513]/30 rounded-xl px-3 py-2 text-xs font-bold text-[#4b2c20] focus:ring-1 focus:ring-[#8b4513]/50 focus:outline-none"
                    >
                      {sourceBankOptions.map((row) => (
                        <option key={row.code} value={row.code}>
                          {row.entity} ({row.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Target Account Code */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] uppercase tracking-widest text-[#8b4513] font-black">
                      Target Account Code (8-digit)
                    </label>
                    <select
                      value={tplTargetAccount}
                      onChange={(e) => setTplTargetAccount(e.target.value)}
                      className="w-full bg-[#faf4e5] border border-[#8b4513]/30 rounded-xl px-3 py-2 text-xs font-bold text-[#4b2c20] focus:ring-1 focus:ring-[#8b4513]/50 focus:outline-none"
                    >
                      <option value="">-- Auto Resolve from Taxonomy --</option>
                      {targetAccountOptions.map((row) => (
                        <option key={row.code} value={row.code}>
                          {row.account_name} ({row.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Payment Status */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] uppercase tracking-widest text-[#8b4513] font-black">
                      Payment Status
                    </label>
                    <select
                      value={tplStatus}
                      onChange={(e) => setTplStatus(e.target.value)}
                      className="w-full bg-[#faf4e5] border border-[#8b4513]/30 rounded-xl px-3 py-2 text-xs font-bold text-[#4b2c20] focus:ring-1 focus:ring-[#8b4513]/50 focus:outline-none"
                    >
                      <option value="Completed">Completed</option>
                      <option value="Pending">Pending</option>
                    </select>
                  </div>

                  {/* Ledger Note */}
                  <div className="md:col-span-3 space-y-1.5">
                    <label className="block text-[10px] uppercase tracking-widest text-[#8b4513] font-black">
                      Scribe Narrative / Description
                    </label>
                    <input
                      type="text"
                      value={tplDesc}
                      onChange={(e) => setTplDesc(e.target.value)}
                      placeholder="e.g. Monthly allocation for castle housing"
                      className="w-full bg-[#faf4e5] border border-[#8b4513]/30 rounded-xl px-3 py-2 text-xs font-bold text-[#4b2c20] focus:ring-1 focus:ring-[#8b4513]/50 focus:outline-none"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full bg-[#8b4513] text-[#ffd700] hover:bg-[#a0522d] border border-[#d4af37]/40 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider shadow hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
                    >
                      Lock Blueprint
                    </button>
                  </div>
                </div>
              </form>

              {/* Scribe Blueprints Directory */}
              <div className="bg-[#faf4e5] border border-[#8b4513]/30 rounded-xl p-5 shadow-sm space-y-4">
                <h3 className="text-sm font-black uppercase tracking-wider text-[#4b2c20] pb-2 border-b border-[#8b4513]/10">
                  Active Scribe Blueprints
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {templates.map((tpl) => (
                    <div
                      key={tpl.name}
                      className="bg-white/40 border border-[#8b4513]/20 rounded-xl p-4 flex items-start gap-4 hover:border-[#8b4513]/40 hover:bg-[#8b4513]/5 transition-all"
                    >
                      <div className="w-10 h-10 rounded-xl bg-[#8b4513]/10 border border-[#8b4513]/20 flex items-center justify-center text-xl shrink-0">
                        {tpl.icon || "📜"}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-black uppercase tracking-wider text-[#4b2c20]">
                            {tpl.name}
                          </h4>
                          <button
                            onClick={() => handleDeleteTemplate(tpl.name)}
                            className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                            title="Expunge Blueprint"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-[10px] text-[#5d4037]/70 font-sans italic">
                          {tpl.data.description || "No description registered."}
                        </p>
                        <div className="pt-2 flex flex-wrap gap-1.5 text-[9px] font-black uppercase tracking-widest">
                          <span className="bg-[#8b4513]/10 text-[#8b4513] px-2 py-0.5 rounded-md">
                            Flow: {tpl.data.flow}
                          </span>
                          <span className="bg-[#8b4513]/10 text-[#8b4513] px-2 py-0.5 rounded-md">
                            Type: {tpl.data.transaction_type}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {templates.length === 0 && (
                    <div className="md:col-span-2 py-8 text-center text-slate-500 uppercase tracking-widest font-sans">
                      No active blueprints registered.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;