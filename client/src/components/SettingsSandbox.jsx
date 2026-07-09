import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Layers,
  Sliders,
  CheckCircle,
  AlertCircle,
  FileText,
  Zap,
  Code,
  DollarSign,
  ArrowRight,
  TrendingUp,
  Cpu,
  Bookmark,
  Search,
  Plus,
  Trash2,
  Edit2,
  Copy,
  RefreshCw,
  X,
  Globe,
  Database,
  Scale,
  Check,
  ChevronDown,
  Info,
  ArrowDown,
  ArrowUp,
  Calendar,
  Save
} from "lucide-react";

// ============================================================================
// HELPER COMBOBOX COMPONENT (Outside main component to prevent focus loss)
// Styled to match the Feudal Parchment & Wood Palette of SettingsModal
// ============================================================================
const Combobox = ({
  id,
  label,
  value,
  onChange,
  options,
  setOptions,
  activeDropdownId,
  setActiveDropdownId,
  showNotice,
  placeholder = "Select or type custom..."
}) => {
  const isNewValue = value.trim() !== "" && !options.some(opt => opt.toLowerCase() === value.trim().toLowerCase());

  const handleActionClick = () => {
    if (isNewValue) {
      setOptions([...options, value.trim()]);
      showNotice(`Injected new parameter option: "${value.trim()}"`);
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
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${activeDropdownId === id ? "rotate-180" : ""}`} />
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
                <div className="p-3 text-center text-[10px] text-slate-500 uppercase tracking-widest font-sans">No options registered</div>
              )}
            </div>
          )}
        </div>

        {/* Dynamic Action Button: Snaps between "+New" (inactive) and "Save" (new value typed) */}
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
// MAIN SETTINGS SANDBOX MODAL (RE-THEMED TO FEUDAL/PARCHMENT AESTHETIC)
// ============================================================================
export default function SettingsSandbox({
  isOpen = true,
  onClose = () => {}
}) {
  // --- ACTIVE COMBOBOX DROPDOWN MANAGEMENT STATE ---
  const [activeDropdownId, setActiveDropdownId] = useState(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = () => setActiveDropdownId(null);
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  // --- NAVIGATION STATE ---
  const [activePrimaryTab, setActivePrimaryTab] = useState("coa");
  const [activeSecondaryTab, setActiveSecondaryTab] = useState("from");

  // --- GLOBAL LAYOUT CONTROLS (SMART SCROLL) ---
  const scrollContainerRef = useRef(null);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  // Monitor Scroll Position to swap direction and visibility of Floating Scroll Button
  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const { scrollTop, scrollHeight, clientHeight } = el;
    
    if (scrollHeight > clientHeight + 40) {
      setShowScrollBtn(true);
    } else {
      setShowScrollBtn(false);
    }

    const isNearBottom = scrollHeight - scrollTop - clientHeight < 40;
    setIsAtBottom(isNearBottom);
  };

  const handleScrollAction = () => {
    const el = scrollContainerRef.current;
    if (!el) return;

    if (isAtBottom) {
      el.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      handleScroll();
    }, 100);
    return () => clearTimeout(timer);
  }, [activePrimaryTab, activeSecondaryTab]);

  // --- COMBOBOX MASTER LISTS ---
  const [lvlITypes, setLvlITypes] = useState(["Asset", "Liability", "Equity", "Revenue", "Expense"]);
  const [lvlIISubtypes, setLvlIISubtypes] = useState(["Liquidity Reserves", "Short-term Receivables", "Vendor Liabilities", "SaaS Licensing"]);
  const [lvlIIICategories, setLvlIIICategories] = useState(["Cash & Equivalents", "Accounts Receivable", "Vendor Invoicing", "Operational Overheads"]);
  const [entityOptions, setEntityOptions] = useState(["Stripe Processing Terminal", "AWS Compute West", "Apex Clearing Pipe"]);
  const [originOptions, setOriginOptions] = useState(["HQ Operations", "Stripe Pipeline", "AWS Stack Engine", "SaaS Webhook API"]);
  const [statusOptionsList, setStatusOptionsList] = useState(["ST-ACT (Active / Settled)", "ST-PEN (Pending Compliance)", "ST-REV (Under Review)"]);

  // --- COMBOBOX STATE BINDINGS ---
  const [coaType, setCoaType] = useState("Asset");
  const [coaSubtype, setCoaSubtype] = useState("Liquidity Reserves");
  const [coaCategory, setCoaCategory] = useState("Cash & Equivalents");
  const [coaEntity, setCoaEntity] = useState("Stripe Processing Terminal");

  const [matrixType, setMatrixType] = useState("");
  const [matrixSubtype, setMatrixSubtype] = useState("");
  const [matrixCategory, setMatrixCategory] = useState("");
  const [matrixEntity, setMatrixEntity] = useState("");

  const [moreOrigin, setMoreOrigin] = useState("HQ Operations");
  const [moreStatus, setMoreStatus] = useState("ST-ACT (Active / Settled)");

  // --- REGISTRY TABLES DATA ---
  const [coaData, setCoaData] = useState([
    { code: "1010", name: "Bank Balance (Ops Vault)", type: "Asset", subtype: "Liquidity Reserves", category: "Cash & Equivalents" },
    { code: "1200", name: "Accounts Receivable Node", type: "Asset", subtype: "Short-term Receivables", category: "Receivables" },
    { code: "2010", name: "Accounts Payable Ledger", type: "Liability", subtype: "Vendor Invoice Pay", category: "Payables" },
    { code: "3010", name: "Paid-In Stakeholder Capital", type: "Equity", subtype: "Share Issuance", category: "Equity" }
  ]);

  const [matrixData, setMatrixData] = useState([
    { id: "MX-001", type: "Asset", subtype: "Liquidity Reserves", category: "Cash & Equivalents", entity: "Stripe Pipeline", status: "Verified" },
    { id: "MX-002", type: "Asset", subtype: "Short-term Receivables", category: "Receivables", entity: "Enterprise Sales", status: "Verified" },
    { id: "MX-003", type: "Liability", subtype: "Vendor Invoice Pay", category: "Payables", entity: "AWS Portal", status: "Active" }
  ]);

  const [originItems, setOriginItems] = useState([
    { name: "SaaS Billing Terminal", type: "Direct API Integration", status: "Active" },
    { name: "SVB Corporate Checking", type: "Bank Feed SFTP", status: "Active" },
    { name: "Manual CSV Upload Hub", type: "File Import", status: "Legacy" }
  ]);

  const [statusItems, setStatusItems] = useState([
    { name: "ST-ACT (Active / Settled)", plImpact: true, cashflowImpact: true },
    { name: "ST-PEN (Pending Compliance)", plImpact: false, cashflowImpact: false },
    { name: "ST-REV (Under Review)", plImpact: true, cashflowImpact: false }
  ]);

  // --- QUICK ACTIONS REGISTRY ---
  const [quickActionsRegistry, setQuickActionsRegistry] = useState([
    {
      name: "Sweep Operating Capital",
      flow: "Inflow",
      status: "ST-ACT",
      amount: 25000,
      type: "Asset",
      subtype: "Liquidity Reserves",
      targetAccount: "1010",
      entity: "Stripe Corporate Integration"
    },
    {
      name: "Settle Tech Stack Billing",
      flow: "Outflow",
      status: "ST-ACT",
      amount: 8400,
      type: "Expense",
      subtype: "SaaS Licensing",
      targetAccount: "5020",
      entity: "AWS Compute Cluster"
    }
  ]);

  // Quick Action Form State
  const [qaName, setQaName] = useState("");
  const [qaValueDate, setQaValueDate] = useState("");
  const [qaPostingDate, setQaPostingDate] = useState("");
  const [qaFlow, setQaFlow] = useState("Inflow");
  const [qaStatus, setQaStatus] = useState("ST-ACT (Active / Settled)");
  const [qaOrigin, setQaOrigin] = useState("HQ Operations");
  const [qaAmount, setQaAmount] = useState(0); 
  const [qaType, setQaType] = useState("Asset");
  const [qaDescription, setQaDescription] = useState("");
  const [qaSubtype, setQaSubtype] = useState("Liquidity Reserves");
  const [qaSourceAccount, setQaSourceAccount] = useState("1010 - Operating Capital");
  const [qaCategory, setQaCategory] = useState("Cash & Equivalents");
  const [qaTargetAccount, setQaTargetAccount] = useState("1020 - Receivables Pool");
  const [qaEntity, setQaEntity] = useState("");

  // UI Interactive States
  const [coaCode, setCoaCode] = useState("1020");
  const [coaName, setCoaName] = useState("");
  const [isCodeAvailable, setIsCodeAvailable] = useState(true);
  const [plImpact, setPlImpact] = useState(false);
  const [cashflowImpact, setCashflowImpact] = useState(false);

  // Global Notification State
  const [notification, setNotification] = useState("");
  const showNotice = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(""), 3000);
  };

  // Handlers
  const handleRegisterAccount = () => {
    if (!coaName || !coaCode) {
      showNotice("Please fill in Account Code and Name");
      return;
    }
    setCoaData([...coaData, {
      code: coaCode,
      name: coaName,
      type: coaType || "Asset",
      subtype: coaSubtype || "Liquidity Reserves",
      category: coaCategory || "Cash & Equivalents"
    }]);
    showNotice(`Registered COA Node [${coaCode}] successfully.`);
    setCoaName("");
    setCoaCode((prev) => String(Number(prev) + 10));
  };

  const handleSaveQuickAction = (e) => {
    e.preventDefault();
    if (!qaName.trim()) {
      showNotice("Please enter a valid Quick Action name.");
      return;
    }
    const newAction = {
      name: qaName,
      flow: qaFlow,
      status: qaStatus.split(" ")[0],
      amount: Number(qaAmount) || 0,
      type: qaType,
      subtype: qaSubtype,
      targetAccount: qaTargetAccount,
      entity: qaEntity || "Universal Node"
    };

    setQuickActionsRegistry([newAction, ...quickActionsRegistry]);
    showNotice(`Committed Quick Action Blueprint: ${qaName}`);
    
    // Reset Form Fields (Defaults strictly to 0)
    setQaName("");
    setQaValueDate("");
    setQaPostingDate("");
    setQaAmount(0);
    setQaDescription("");
    setQaEntity("");
  };

  const handleResetQaForm = () => {
    setQaName("");
    setQaValueDate("");
    setQaPostingDate("");
    setQaAmount(0);
    setQaDescription("");
    setQaEntity("");
    showNotice("Quick Action form blueprint parameters cleared.");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto z-[9999]">
      
      {/* Toast Alert Banner (Medieval Alert colors) */}

        {notification && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[10000] flex items-center gap-2.5 px-4 py-3 bg-[#faf4e5] border-2 border-[#8b4513] text-[#4b2c20] font-sans font-black text-xs rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
            <Zap className="w-4 h-4 text-[#8b4513] animate-pulse" />
            <span>{notification}</span>
          </div>
        )}


      {/* FIXED SIZE FEUDAL/PARCHMENT WINDOW DESIGN (h-[820px] constant size with ornate detailing) */}
      <div className="relative w-full max-w-6xl h-[820px] bg-[#f4e4bc] border-[8px] border-[#5d4037] shadow-[0_0_50px_rgba(0,0,0,0.9)] rounded-xl flex flex-col overflow-hidden">
        
        {/* Parchment Texture Overlay */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-25 mix-blend-multiply z-0"
          style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/paper-fibers.png')" }}
        />

        {/* Ornate Corner Accents */}
        <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-[#8b4513]/30 rounded-tl-lg pointer-events-none z-10" />
        <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-[#8b4513]/30 rounded-tr-lg pointer-events-none z-10" />
        <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-[#8b4513]/30 rounded-bl-lg pointer-events-none z-10" />
        <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-[#8b4513]/30 rounded-br-lg pointer-events-none z-10" />

        {/* TOP BRANDING BAR WITH GOLD INLAY AND RED CLOSE BUTTON */}
        <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-[#8b4513]/20 bg-[#5d4037]/10 shrink-0 z-10 relative">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#8b4513]/10 border border-[#8b4513]/30 rounded-xl text-[#8b4513] shadow">
              <Cpu className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h1 className="text-sm font-black text-[#4b2c20] tracking-wider uppercase font-sans">
                Acuity Compliance Matrix
              </h1>
              <p className="text-[9px] text-[#5d4037]/75 font-sans font-bold tracking-widest uppercase">
                DOUBLE-ENTRY COMPLIANCE HUB
              </p>
            </div>
          </div>
          
          {/* Burgundy/Red fantasy close button */}
          <button
            onClick={onClose}
            className="absolute -top-1 -right-1 w-12 h-12 bg-[#8b0000] rounded-full flex items-center justify-center border-4 border-[#5d0000] shadow-[0_4px_10px_rgba(0,0,0,0.5)] active:scale-90 transition-transform group cursor-pointer"
            title="Exit Matrix"
          >
            <div className="absolute inset-0 rounded-full border-2 border-white/20 animate-pulse" />
            <span className="text-[#ffd700] text-lg font-black font-sans">✕</span>
          </button>
        </div>

        {/* FEUDAL TOP HORIZONTAL TABS */}
        <div className="px-6 py-3.5 bg-[#faf4e5]/80 border-b border-[#8b4513]/25 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 z-10 relative">
          <div className="flex flex-wrap gap-2">
            {[
              { id: "coa", label: "Chart of Accounts", icon: Database },
              { id: "matrix", label: "Matrix & Entities", icon: Layers },
              { id: "more", label: "More", icon: Sliders },
              { id: "quick_actions", label: "Quick Actions", icon: Zap }
            ].map((tab) => {
              const isSel = activePrimaryTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActivePrimaryTab(tab.id)}
                  className={`relative px-4 py-2.5 rounded-lg border text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center gap-2.5 ${
                    isSel
                      ? "bg-[#8b4513]/20 border-[#8b4513] text-[#4b2c20] shadow-inner font-black scale-[1.02]"
                      : "bg-[#faf4e5]/80 border-[#8b4513]/10 text-[#5d4037]/80 hover:bg-[#8b4513]/5 hover:text-[#4b2c20]"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isSel ? "text-[#8b4513]" : "text-[#5d4037]/60"}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Inline Feudal Query Bar */}
          <div className="relative max-w-xs w-full self-end md:self-auto">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-[#8b4513]/70">
              <Search className="w-3.5 h-3.5" />
            </span>
            <input
              type="text"
              placeholder="Query parameters..."
              className="w-full bg-[#faf4e5]/90 border border-[#8b4513]/30 rounded-xl py-2 pl-9 pr-4 text-[11px] text-[#4b2c20] placeholder-[#5d4037]/50 focus:outline-none focus:ring-1 focus:ring-[#8b4513]/50 font-serif shadow-inner"
            />
          </div>
        </div>

        {/* MORE SUB-PILLS (UNDER 'MORE' TAB ONLY) */}

          {activePrimaryTab === "more" && (
            <div className="px-6 py-2.5 bg-[#faf4e5]/40 border-b border-[#8b4513]/20 shrink-0 z-10 relative">
              <div className="flex flex-wrap gap-2">
                {[
                  { id: "from", label: "Origin / From Nodes", icon: Globe },
                  { id: "status", label: "Ledger Status Rules", icon: Sliders },
                  { id: "balances", label: "Initial Balance Alignment", icon: Scale }
                ].map((sec) => {
                  const isSel = activeSecondaryTab === sec.id;
                  const Icon = sec.icon;
                  return (
                    <button
                      key={sec.id}
                      type="button"
                      onClick={() => setActiveSecondaryTab(sec.id)}
                      className={`px-3.5 py-2 rounded-lg border text-[10px] font-black uppercase tracking-wider transition-all duration-150 cursor-pointer flex items-center gap-2 ${
                        isSel
                          ? "bg-[#8b4513]/15 border-[#8b4513]/40 text-[#4b2c20]"
                          : "bg-transparent border-transparent text-[#5d4037]/75 hover:text-[#4b2c20]"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span>{sec.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}


        {/* INNER SCROLLABLE WINDOW (No redundant headers) */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-[#8b4513]/45 scrollbar-track-transparent relative z-10"
        >
          <div className="space-y-6">
            
            {/* ================= TAB 1: CHART OF ACCOUNTS ================= */}
            {activePrimaryTab === "coa" && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  
                  {/* Left Column Forms (Using Combobox) */}
                  <div className="bg-[#faf4e5]/80 border border-[#8b4513]/15 rounded-2xl p-6 space-y-5 relative shadow-sm">
                    <p className="text-xs text-[#5d4037] font-serif leading-relaxed flex items-center gap-2 mb-2">
                      <Info className="w-4 h-4 text-[#8b4513] shrink-0" />
                      Classification Hierarchy: Selections below actively filter other lists symmetrically.
                    </p>

                    <div className="space-y-4 font-serif">
                      <Combobox
                        id="coa-type"
                        label="Lvl I: Type"
                        value={coaType}
                        onChange={setCoaType}
                        options={lvlITypes}
                        setOptions={setLvlITypes}
                        activeDropdownId={activeDropdownId}
                        setActiveDropdownId={setActiveDropdownId}
                        showNotice={showNotice}
                      />

                      <Combobox
                        id="coa-subtype"
                        label="Lvl II: Subtype"
                        value={coaSubtype}
                        onChange={setCoaSubtype}
                        options={lvlIISubtypes}
                        setOptions={setLvlIISubtypes}
                        activeDropdownId={activeDropdownId}
                        setActiveDropdownId={setActiveDropdownId}
                        showNotice={showNotice}
                      />

                      <Combobox
                        id="coa-category"
                        label="Lvl III: Category"
                        value={coaCategory}
                        onChange={setCoaCategory}
                        options={lvlIIICategories}
                        setOptions={setLvlIIICategories}
                        activeDropdownId={activeDropdownId}
                        setActiveDropdownId={setActiveDropdownId}
                        showNotice={showNotice}
                      />

                      {/* Account Code / Name */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] uppercase tracking-widest text-[#8b4513] font-black mb-1.5 font-sans">Account Code</label>
                          <div className="relative font-mono">
                            <input
                              type="text"
                              value={coaCode}
                              onChange={(e) => setCoaCode(e.target.value)}
                              className="w-full bg-[#faf4e5]/90 border border-[#8b4513]/30 rounded-xl p-3 text-xs text-[#4b2c20] placeholder-[#5d4037]/50 focus:outline-none focus:ring-1 focus:ring-[#8b4513]/50 font-bold shadow-inner"
                            />
                            {isCodeAvailable && (
                              <div className="absolute right-3 top-3 flex items-center gap-1 text-[8px] font-black text-[#8b4513] bg-[#8b4513]/10 px-1.5 py-0.5 rounded border border-[#8b4513]/20 uppercase tracking-widest">
                                <Check className="w-3.5 h-3.5" /> Approved
                              </div>
                            )}
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase tracking-widest text-[#8b4513] font-black mb-1.5 font-sans">Account Name</label>
                          <input
                            type="text"
                            placeholder="Operational Vault"
                            value={coaName}
                            onChange={(e) => setCoaName(e.target.value)}
                            className="w-full bg-[#faf4e5]/90 border border-[#8b4513]/30 rounded-xl p-3 text-xs text-[#4b2c20] placeholder-[#5d4037]/50 focus:outline-none focus:ring-1 focus:ring-[#8b4513]/50 font-serif font-bold shadow-inner"
                          />
                        </div>
                      </div>

                      <div className="pt-2 font-serif">
                        <button
                          type="button"
                          onClick={handleRegisterAccount}
                          className="w-full h-11 bg-[#8b4513] text-[#ffd700] hover:bg-[#a0522d] border border-[#d4af37]/40 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-150 cursor-pointer shadow flex items-center justify-center gap-2"
                        >
                          <Database className="w-4 h-4" />
                          <span>Register Account</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right Column Form with Combobox */}
                  <div className="bg-[#faf4e5]/80 border border-[#8b4513]/15 rounded-2xl p-6 flex flex-col justify-between relative shadow-sm">
                    <div className="space-y-6">
                      <p className="text-xs text-[#5d4037] font-serif leading-relaxed">
                        Interlink root ledger designations to specific operational nodes or integration partners.
                      </p>

                      <Combobox
                        id="coa-entity"
                        label="Entity Association"
                        value={coaEntity}
                        onChange={setCoaEntity}
                        options={entityOptions}
                        setOptions={setEntityOptions}
                        activeDropdownId={activeDropdownId}
                        setActiveDropdownId={setActiveDropdownId}
                        showNotice={showNotice}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => showNotice("Associated target entity registered.")}
                      className="w-full h-11 bg-[#faf4e5] hover:bg-[#8b4513]/5 border border-[#8b4513]/30 text-[#4b2c20] rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 mt-6 lg:mt-0 font-serif"
                    >
                      <Layers className="w-4 h-4 text-[#8b4513]" />
                      <span>Register Entity</span>
                    </button>
                  </div>
                </div>

                {/* COA Manifest Table */}
                <div className="bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-2xl overflow-hidden shadow-sm">
                  <div className="px-5 py-4 border-b border-[#8b4513]/15 bg-[#8b4513]/5 flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-widest text-[#8b4513] font-black font-sans">Active Chart of Accounts Registers</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse font-serif">
                      <thead>
                        <tr className="bg-[#8b4513]/10 border-b border-[#8b4513]/20 text-[9px] uppercase tracking-widest text-[#5d4037] font-black">
                          <th className="p-4">Account Code</th>
                          <th className="p-4">Identity Name</th>
                          <th className="p-4">Type</th>
                          <th className="p-4">Subtype</th>
                          <th className="p-4">Category</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#8b4513]/10 text-xs font-bold text-[#4b2c20]">
                        {coaData.map((row) => (
                          <tr key={row.code} className="hover:bg-[#8b4513]/5 transition-colors">
                            <td className="p-4 font-mono text-[#8b4513] font-bold text-sm">{row.code}</td>
                            <td className="p-4 text-[#4b2c20] font-black">{row.name}</td>
                            <td className="p-4 text-[#5d4037] uppercase tracking-wider text-[10px] font-sans">{row.type}</td>
                            <td className="p-4 text-[#5d4037]">{row.subtype}</td>
                            <td className="p-4 text-[#5d4037]">{row.category}</td>
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-2.5">
                                <button onClick={() => showNotice(`Editing ${row.name}`)} className="p-1 text-[#5d4037] hover:text-[#4b2c20] hover:bg-[#8b4513]/10 rounded transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                                <button onClick={() => showNotice(`Duplicated ${row.name}`)} className="p-1 text-[#5d4037] hover:text-[#4b2c20] hover:bg-[#8b4513]/10 rounded transition-colors"><Copy className="w-3.5 h-3.5" /></button>
                                <button onClick={() => { setCoaData(coaData.filter(c => c.code !== row.code)); showNotice(`Deleted ${row.name}`); }} className="p-1 text-[#8b0000] hover:bg-red-50 rounded transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ================= TAB 2: MATRIX & ENTITIES ================= */}
            {activePrimaryTab === "matrix" && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  
                  {/* Left Column Forms with Custom Combobox Fields */}
                  <div className="bg-[#faf4e5]/80 border border-[#8b4513]/15 rounded-2xl p-6 space-y-6 shadow-sm">
                    <p className="text-xs text-[#5d4037] font-serif leading-relaxed">
                      Configure cross-cutting relationships between account types, subclass categories, and operational entities below.
                    </p>

                    <div className="space-y-4 font-serif">
                      <Combobox
                        id="mat-type"
                        label="Type"
                        value={matrixType}
                        onChange={setMatrixType}
                        options={lvlITypes}
                        setOptions={setLvlITypes}
                        activeDropdownId={activeDropdownId}
                        setActiveDropdownId={setActiveDropdownId}
                        showNotice={showNotice}
                      />

                      <Combobox
                        id="mat-subtype"
                        label="Subtype"
                        value={matrixSubtype}
                        onChange={setMatrixSubtype}
                        options={lvlIISubtypes}
                        setOptions={setLvlIISubtypes}
                        activeDropdownId={activeDropdownId}
                        setActiveDropdownId={setActiveDropdownId}
                        showNotice={showNotice}
                      />

                      <Combobox
                        id="mat-category"
                        label="Category"
                        value={matrixCategory}
                        onChange={setMatrixCategory}
                        options={lvlIIICategories}
                        setOptions={setLvlIIICategories}
                        activeDropdownId={activeDropdownId}
                        setActiveDropdownId={setActiveDropdownId}
                        showNotice={showNotice}
                      />

                      <Combobox
                        id="mat-entity"
                        label="Entity Association"
                        value={matrixEntity}
                        onChange={setMatrixEntity}
                        options={entityOptions}
                        setOptions={setEntityOptions}
                        activeDropdownId={activeDropdownId}
                        setActiveDropdownId={setActiveDropdownId}
                        showNotice={showNotice}
                      />

                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            const newMatrixItem = {
                              id: `MX-00${matrixData.length + 1}`,
                              type: matrixType || "Asset",
                              subtype: matrixSubtype || "Liquidity Reserves",
                              category: matrixCategory || "Cash & Equivalents",
                              entity: matrixEntity || "Universal Terminal",
                              status: "Verified"
                            };
                            setMatrixData([...matrixData, newMatrixItem]);
                            showNotice("Injected route mapping node successfully.");
                          }}
                          className="w-full h-11 bg-[#8b4513] text-[#ffd700] hover:bg-[#a0522d] border border-[#d4af37]/40 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md flex items-center justify-center gap-2 font-serif"
                        >
                          <Layers className="w-4 h-4" />
                          <span>Register Entity</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Empty Placeholder */}
                  <div className="hidden lg:block border-2 border-dashed border-[#8b4513]/25 bg-[#faf4e5]/30 rounded-2xl p-6 relative min-h-[400px]">
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center opacity-30">
                      <Database className="w-12 h-12 text-[#8b4513] mb-2" />
                      <span className="text-[10px] font-mono font-bold tracking-widest text-[#5d4037] uppercase">Reservation Segment Empty</span>
                    </div>
                  </div>
                </div>

                {/* Association Matrix Table */}
                <div className="bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-2xl overflow-hidden shadow-sm">
                  <div className="px-5 py-4 border-b border-[#8b4513]/15 bg-[#8b4513]/5 flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-widest text-[#8b4513] font-black font-sans">Valid Association Matrix Mapping Nodes</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse font-serif">
                      <thead>
                        <tr className="bg-[#8b4513]/10 border-b border-[#8b4513]/20 text-[9px] uppercase tracking-widest text-[#5d4037] font-black">
                          <th className="p-4">Matrix Key</th>
                          <th className="p-4">Type</th>
                          <th className="p-4">Subtype</th>
                          <th className="p-4">Category Path</th>
                          <th className="p-4">Segment Host Entity</th>
                          <th className="p-4 text-center">Status Alignment</th>
                          <th className="p-4 text-right">Deprecate</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#8b4513]/10 text-xs font-bold text-[#4b2c20]">
                        {matrixData.map((row) => (
                          <tr key={row.id} className="hover:bg-[#8b4513]/5 transition-colors">
                            <td className="p-4 font-mono text-[#8b4513] font-bold text-xs">{row.id}</td>
                            <td className="p-4 text-[#5d4037] uppercase tracking-widest text-[9px] font-sans">{row.type}</td>
                            <td className="p-4 text-[#5d4037]">{row.subtype}</td>
                            <td className="p-4 text-[#4b2c20] font-black">{row.category}</td>
                            <td className="p-4 text-[#5d4037]">{row.entity}</td>
                            <td className="p-4 text-center">
                              <span className="text-[9px] font-sans font-black px-2 py-0.5 rounded-full border border-[#8b4513]/20 bg-[#faf4e5] text-[#8b4513] uppercase">{row.status}</span>
                            </td>
                            <td className="p-4 text-right">
                              <button onClick={() => { setMatrixData(matrixData.filter(m => m.id !== row.id)); showNotice(`Deleted ${row.id}`); }} className="p-1.5 text-[#8b0000] hover:bg-red-50 rounded-lg cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ================= TAB 3: MORE WORKSPACE ================= */}
            {activePrimaryTab === "more" && (
              <div className="space-y-8">
                {/* Option 3A: Origin / From with Custom Combobox */}
                {activeSecondaryTab === "from" && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 font-serif">
                    <div className="lg:col-span-5 bg-[#faf4e5]/80 border border-[#8b4513]/15 rounded-2xl p-6 space-y-6 h-fit shadow-sm">
                      <p className="text-xs text-[#5d4037] leading-relaxed">Establish primary input nodes where system pipeline records originate.</p>

                      <div className="space-y-4">
                        <Combobox
                          id="more-from"
                          label="Origin / From"
                          value={moreOrigin}
                          onChange={setMoreOrigin}
                          options={originOptions}
                          setOptions={setOriginOptions}
                          activeDropdownId={activeDropdownId}
                          setActiveDropdownId={setActiveDropdownId}
                          showNotice={showNotice}
                        />

                        <button
                          type="button"
                          onClick={() => { setOriginItems([...originItems, { name: moreOrigin || "Custom Host Node", type: "Combobox Dynamic Feed", status: "Active" }]); showNotice("Origin registered."); }}
                          className="w-full h-11 bg-[#8b4513] text-[#ffd700] hover:bg-[#a0522d] border border-[#d4af37]/40 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Globe className="w-4 h-4" />
                          <span>Register Origin/From</span>
                        </button>
                      </div>
                    </div>

                    <div className="lg:col-span-7 bg-[#faf4e5]/80 border border-[#8b4513]/25 rounded-2xl overflow-hidden shadow-sm">
                      <div className="px-5 py-4 border-b border-[#8b4513]/15 bg-[#8b4513]/5"><span className="text-[10px] uppercase tracking-widest text-[#8b4513] font-black font-sans">Configured Input pipelines</span></div>
                      <div className="divide-y divide-[#8b4513]/10 text-xs font-bold text-[#4b2c20]">
                        {originItems.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between p-4 hover:bg-[#8b4513]/5">
                            <div className="flex items-center gap-3">
                              <Globe className="w-4 h-4 text-[#8b4513]" />
                              <div>
                                <p className="text-xs font-black text-[#4b2c20]">{item.name}</p>
                                <p className="text-[10px] text-[#5d4037]/70 uppercase font-sans tracking-wider mt-0.5">{item.type}</p>
                              </div>
                            </div>
                            <span className="text-[9px] font-sans font-black px-2 py-0.5 rounded-full border border-[#8b4513]/20 bg-[#faf4e5] text-[#8b4513] uppercase">{item.status}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Option 3B: Status Rules with Custom Combobox */}
                {activeSecondaryTab === "status" && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 font-serif">
                    <div className="lg:col-span-5 bg-[#faf4e5]/80 border border-[#8b4513]/15 rounded-2xl p-6 space-y-6 h-fit shadow-sm">
                      <p className="text-xs text-[#5d4037] leading-relaxed">Control processing impacts on P&L and statement flows.</p>

                      <div className="space-y-4">
                        <Combobox
                          id="more-status"
                          label="Status Target"
                          value={moreStatus}
                          onChange={setMoreStatus}
                          options={statusOptionsList}
                          setOptions={setStatusOptionsList}
                          activeDropdownId={activeDropdownId}
                          setActiveDropdownId={setActiveDropdownId}
                          showNotice={showNotice}
                        />

                        <div className="space-y-3 pt-2">
                          <label className="flex items-center gap-3 cursor-pointer group">
                            <input type="checkbox" checked={plImpact} onChange={(e) => setPlImpact(e.target.checked)} className="w-4 h-4 bg-[#faf4e5] border border-[#8b4513]/30 text-[#8b4513] cursor-pointer accent-[#8b4513]" />
                            <div className="flex flex-col">
                              <span className="text-xs font-black text-[#4b2c20] group-hover:text-[#8b4513] transition-colors">Profit and Loss impact</span>
                              <span className="text-[9px] text-[#5d4037]/75 font-sans leading-normal">Flags immediate revenue or operational expense recognition.</span>
                            </div>
                          </label>

                          <label className="flex items-center gap-3 cursor-pointer group">
                            <input type="checkbox" checked={cashflowImpact} onChange={(e) => setCashflowImpact(e.target.checked)} className="w-4 h-4 bg-[#faf4e5] border border-[#8b4513]/30 text-[#8b4513] cursor-pointer accent-[#8b4513]" />
                            <div className="flex flex-col">
                              <span className="text-xs font-black text-[#4b2c20] group-hover:text-[#8b4513] transition-colors">Cashflow Impact</span>
                              <span className="text-[9px] text-[#5d4037]/75 font-sans leading-normal">Links ledger state to direct banking reserves calculation.</span>
                            </div>
                          </label>
                        </div>

                        <button
                          type="button"
                          onClick={() => { setStatusItems([...statusItems, { name: moreStatus || "ST-CUSTOM", plImpact, cashflowImpact }]); showNotice("Status Registered."); }}
                          className="w-full h-11 bg-[#8b4513] text-[#ffd700] hover:bg-[#a0522d] border border-[#d4af37]/40 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Sliders className="w-4 h-4" />
                          <span>Register Status</span>
                        </button>
                      </div>
                    </div>

                    <div className="lg:col-span-7 bg-[#faf4e5]/80 border border-[#8b4513]/25 rounded-2xl overflow-hidden shadow-sm">
                      <div className="px-5 py-4 border-b border-[#8b4513]/15 bg-[#8b4513]/5"><span className="text-[10px] uppercase tracking-widest text-[#8b4513] font-black font-sans">Enforced status rules</span></div>
                      <div className="divide-y divide-[#8b4513]/10 text-xs font-bold text-[#4b2c20]">
                        {statusItems.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between p-4 hover:bg-[#8b4513]/5">
                            <div className="flex items-center gap-3">
                              <Sliders className="w-4 h-4 text-[#8b4513]" />
                              <div>
                                <p className="text-xs font-black text-[#4b2c20]">{item.name}</p>
                                <div className="flex items-center gap-2 mt-1 text-[9px] font-sans text-[#5d4037]/75 font-bold uppercase tracking-widest">
                                  <span className={item.plImpact ? "text-emerald-700" : "text-[#5d4037]/40"}>P&L Impact</span>
                                  <span>•</span>
                                  <span className={item.cashflowImpact ? "text-cyan-700" : "text-[#5d4037]/40"}>Cashflow Impact</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Option 3C: Balance Alignment (Initial Allocations strictly initialized to 0) */}
                {activeSecondaryTab === "balances" && (
                  <div className="space-y-6 font-serif">
                    <div className="border border-[#8b4513]/30 bg-[#faf4e5] p-5 rounded-2xl flex items-center justify-between">
                      <div className="space-y-1">
                        <h4 className="text-xs font-black uppercase tracking-wider text-[#8b4513]">Ledger Balance Alignment</h4>
                        <p className="text-[11px] text-[#5d4037] leading-relaxed font-serif">Total configured debits must equal credits identically.</p>
                      </div>
                      <div className="flex gap-3 text-xs font-mono font-bold text-[#8b4513]">$0.00 / $0.00</div>
                    </div>

                    <div className="bg-[#faf4e5]/80 border border-[#8b4513]/15 rounded-2xl p-5 space-y-3 shadow-sm">
                      {coaData.map((acc) => (
                        <div key={acc.code} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center p-3 bg-[#faf4e5]/60 border border-[#8b4513]/15 rounded-xl hover:border-[#8b4513]/40 transition-all">
                          <span className="sm:col-span-2 font-mono text-xs text-[#8b4513] font-bold">{acc.code}</span>
                          <span className="sm:col-span-5 text-xs text-[#4b2c20] font-black">{acc.name}</span>
                          <span className="sm:col-span-2 text-[10px] text-[#5d4037] uppercase tracking-wider font-sans">{acc.type}</span>
                          <div className="sm:col-span-3">
                            <input
                              type="number"
                              defaultValue={0} 
                              className="w-full bg-[#faf4e5] border border-[#8b4513]/30 rounded p-1.5 text-right font-mono text-xs text-[#4b2c20] focus:outline-none focus:ring-1 focus:ring-[#8b4513]"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ================= TAB 4: NEW QUICK ACTIONS (REBUILT GRID & ALIGNMENT) ================= */}
            {activePrimaryTab === "quick_actions" && (
              <div className="space-y-8 font-serif animate-in fade-in duration-200">
                
                {/* Clean Slate Form Container */}
                <div className="bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-2xl p-6 space-y-6 shadow-sm">
                  <p className="text-xs text-[#5d4037]">Configure unified operational posting parameters across system ledgers.</p>

                  <form onSubmit={handleSaveQuickAction} className="space-y-6">
                    
                    {/* Grid Math: Exact grid-cols-4 Tailwind implementation */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      
                      {/* ROW 1: Quick Action name (col-span-2), Value date (col-span-1), Posting date (col-span-1) */}
                      <div className="md:col-span-2">
                        <label className="block text-[10px] uppercase tracking-widest text-[#8b4513] font-black mb-1.5 font-sans">Quick Action Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Sweep Stripe Settlements"
                          value={qaName}
                          onChange={(e) => setQaName(e.target.value)}
                          className="w-full bg-[#faf4e5]/90 border border-[#8b4513]/30 rounded-xl p-3 text-xs text-[#4b2c20] placeholder-[#5d4037]/50 focus:outline-none focus:ring-1 focus:ring-[#8b4513] font-bold shadow-inner"
                        />
                      </div>
                      <div className="md:col-span-1 font-sans">
                        <label className="block text-[10px] uppercase tracking-widest text-[#8b4513] font-black mb-1.5">Value Date</label>
                        <input
                          type="date"
                          value={qaValueDate}
                          onChange={(e) => setQaValueDate(e.target.value)}
                          className="w-full bg-[#faf4e5]/90 border border-[#8b4513]/30 rounded-xl p-3 text-xs text-[#4b2c20] focus:outline-none focus:ring-1 focus:ring-[#8b4513] font-mono shadow-inner"
                        />
                      </div>
                      <div className="md:col-span-1 font-sans">
                        <label className="block text-[10px] uppercase tracking-widest text-[#8b4513] font-black mb-1.5">Posting Date</label>
                        <input
                          type="date"
                          value={qaPostingDate}
                          onChange={(e) => setQaPostingDate(e.target.value)}
                          className="w-full bg-[#faf4e5]/90 border border-[#8b4513]/30 rounded-xl p-3 text-xs text-[#4b2c20] focus:outline-none focus:ring-1 focus:ring-[#8b4513] font-mono shadow-inner"
                        />
                      </div>

                      {/* ROW 2: Flow (col-span-1), Status (col-span-1), Origin/From (col-span-1), Amount (col-span-1) */}
                      <div className="md:col-span-1">
                        <label className="block text-[10px] uppercase tracking-widest text-[#8b4513] font-black mb-1.5 font-sans">Flow</label>
                        <div className="relative">
                          <select
                            value={qaFlow}
                            onChange={(e) => setQaFlow(e.target.value)}
                            className="w-full bg-[#faf4e5]/90 border border-[#8b4513]/30 rounded-xl p-3 text-xs text-[#4b2c20] focus:outline-none appearance-none font-black font-serif shadow-inner"
                          >
                            <option value="Inflow">Inflow</option>
                            <option value="Outflow">Outflow</option>
                          </select>
                          <ChevronDown className="absolute right-3.5 top-3.5 w-4 h-4 text-[#8b4513]/80 pointer-events-none" />
                        </div>
                      </div>

                      <div className="md:col-span-1">
                        <Combobox
                          id="qa-status"
                          label="Status"
                          value={qaStatus}
                          onChange={setQaStatus}
                          options={statusOptionsList}
                          setOptions={setStatusOptionsList}
                          activeDropdownId={activeDropdownId}
                          setActiveDropdownId={setActiveDropdownId}
                          showNotice={showNotice}
                        />
                      </div>

                      <div className="md:col-span-1">
                        <Combobox
                          id="qa-origin"
                          label="Origin/From"
                          value={qaOrigin}
                          onChange={setQaOrigin}
                          options={originOptions}
                          setOptions={setOriginOptions}
                          activeDropdownId={activeDropdownId}
                          setActiveDropdownId={setActiveDropdownId}
                          showNotice={showNotice}
                        />
                      </div>

                      <div className="md:col-span-1 font-sans">
                        <label className="block text-[10px] uppercase tracking-widest text-[#8b4513] font-black mb-1.5">Amount ($)</label>
                        <input
                          type="number"
                          value={qaAmount}
                          onChange={(e) => setQaAmount(e.target.value)}
                          className="w-full bg-[#faf4e5]/90 border border-[#8b4513]/30 rounded-xl p-3 text-xs text-[#4b2c20] focus:outline-none focus:ring-1 focus:ring-[#8b4513] font-mono font-bold shadow-inner"
                        />
                      </div>

                      {/* ROW 3: Type (col-span-2), Description (col-span-2) */}
                      <div className="md:col-span-2">
                        <Combobox
                          id="qa-type"
                          label="Type"
                          value={qaType}
                          onChange={setQaType}
                          options={lvlITypes}
                          setOptions={setLvlITypes}
                          activeDropdownId={activeDropdownId}
                          setActiveDropdownId={setActiveDropdownId}
                          showNotice={showNotice}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[10px] uppercase tracking-widest text-[#8b4513] font-black mb-1.5 font-sans">Description Memo</label>
                        <input
                          type="text"
                          placeholder="Add core descriptor metadata..."
                          value={qaDescription}
                          onChange={(e) => setQaDescription(e.target.value)}
                          className="w-full bg-[#faf4e5]/90 border border-[#8b4513]/30 rounded-xl p-3 text-xs text-[#4b2c20] placeholder-[#5d4037]/50 focus:outline-none focus:ring-1 focus:ring-[#8b4513] shadow-inner"
                        />
                      </div>

                      {/* ROW 4: Subtype (col-span-2), Source account (col-span-2) */}
                      <div className="md:col-span-2">
                        <Combobox
                          id="qa-subtype"
                          label="Subtype"
                          value={qaSubtype}
                          onChange={setQaSubtype}
                          options={lvlIISubtypes}
                          setOptions={setLvlIISubtypes}
                          activeDropdownId={activeDropdownId}
                          setActiveDropdownId={setActiveDropdownId}
                          showNotice={showNotice}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[10px] uppercase tracking-widest text-[#8b4513] font-black mb-1.5 font-sans">Source Account</label>
                        <input
                          type="text"
                          value={qaSourceAccount}
                          onChange={(e) => setQaSourceAccount(e.target.value)}
                          className="w-full bg-[#faf4e5]/90 border border-[#8b4513]/30 rounded-xl p-3 text-xs text-[#4b2c20] focus:outline-none focus:ring-1 focus:ring-[#8b4513] font-bold shadow-inner"
                        />
                      </div>

                      {/* ROW 5: Category (col-span-2), Target account (col-span-2) */}
                      <div className="md:col-span-2">
                        <Combobox
                          id="qa-category"
                          label="Category"
                          value={qaCategory}
                          onChange={setQaCategory}
                          options={lvlIIICategories}
                          setOptions={setLvlIIICategories}
                          activeDropdownId={activeDropdownId}
                          setActiveDropdownId={setActiveDropdownId}
                          showNotice={showNotice}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[10px] uppercase tracking-widest text-[#8b4513] font-black mb-1.5 font-sans">Target Account</label>
                        <div className="relative">
                          <select
                            value={qaTargetAccount}
                            onChange={(e) => setQaTargetAccount(e.target.value)}
                            className="w-full bg-[#faf4e5]/90 border border-[#8b4513]/30 rounded-xl p-3 text-xs text-[#4b2c20] focus:outline-none focus:ring-1 focus:ring-[#8b4513] appearance-none font-bold shadow-inner"
                          >
                            {coaData.map(c => (
                              <option key={c.code} value={`${c.code} - ${c.name}`}>{c.code} - {c.name}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-3.5 top-3.5 w-4 h-4 text-[#8b4513]/80 pointer-events-none" />
                        </div>
                      </div>

                      {/* ROW 6: Entity (col-span-2), Save & Cancel Configuration Buttons Aligned Right */}
                      <div className="md:col-span-2">
                        <Combobox
                          id="qa-entity"
                          label="Entity Association"
                          value={qaEntity}
                          onChange={setQaEntity}
                          options={entityOptions}
                          setOptions={setEntityOptions}
                          activeDropdownId={activeDropdownId}
                          setActiveDropdownId={setActiveDropdownId}
                          showNotice={showNotice}
                        />
                      </div>

                      {/* BUTTON ALIGNMENT: Strictly place "Save Blueprint" to the Left of "Cancel" as required */}
                      <div className="md:col-span-2 flex items-end justify-end gap-3 pt-4 font-sans">
                        <button
                          type="submit"
                          className="h-[46px] px-6 bg-[#8b4513] text-[#ffd700] hover:bg-[#a0522d] border border-[#d4af37]/45 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-lg flex items-center justify-center gap-2 hover:scale-105 active:scale-95"
                        >
                          <Save className="w-4 h-4" />
                          <span>Save Blueprint</span>
                        </button>
                        
                        <button
                          type="button"
                          onClick={handleResetQaForm}
                          className="h-[46px] px-6 bg-[#faf4e5] hover:bg-[#8b4513]/5 border border-[#8b4513]/30 text-[#4b2c20] font-black rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>

                    </div>
                  </form>
                </div>

                {/* Quick Actions Registry Data Table */}
                <div className="bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-2xl overflow-hidden shadow-sm">
                  <div className="px-5 py-4 border-b border-[#8b4513]/15 bg-[#8b4513]/5 flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-widest text-[#8b4513] font-black font-sans">Quick Actions Registry</span>
                    <span className="text-[9px] font-mono text-[#8b4513] font-bold">Total Routes: {quickActionsRegistry.length}</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse font-serif">
                      <thead>
                        <tr className="bg-[#8b4513]/10 border-b border-[#8b4513]/20 text-[9px] uppercase tracking-widest text-[#5d4037] font-black">
                          <th className="p-4">Action Target Name</th>
                          <th className="p-4">Flow</th>
                          <th className="p-4">Status</th>
                          <th className="p-4 text-right">Amount ($)</th>
                          <th className="p-4">COA Path ID</th>
                          <th className="p-4">Entity Mapped Node</th>
                          <th className="p-4 text-right">Deprecate</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#8b4513]/10 text-xs font-bold text-[#4b2c20]">
                        {quickActionsRegistry.map((item, idx) => (
                          <tr key={idx} className="hover:bg-[#8b4513]/5 transition-colors">
                            <td className="p-4 text-[#4b2c20] font-black">{item.name}</td>
                            <td className="p-4 font-sans">
                              <span className={`text-[9px] font-black px-2 py-0.5 rounded border ${
                                item.flow === "Inflow" ? "text-emerald-700 border-emerald-500/20 bg-emerald-50" : "text-[#8b0000] border-[#8b0000]/20 bg-red-50"
                              }`}>
                                {item.flow}
                              </span>
                            </td>
                            <td className="p-4 font-sans">
                              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#faf4e5] text-[#5d4037] border border-[#8b4513]/20">{item.status}</span>
                            </td>
                            <td className="p-4 text-right font-mono text-[#8b4513] font-semibold">${parseFloat(item.amount).toLocaleString()}</td>
                            <td className="p-4 font-mono text-[#5d4037]">[{item.targetAccount.split(" ")[0]}]</td>
                            <td className="p-4 text-[#5d4037]">{item.entity}</td>
                            <td className="p-4 text-right">
                              <button
                                onClick={() => {
                                  setQuickActionsRegistry(quickActionsRegistry.filter((_, i) => i !== idx));
                                  showNotice(`Deprecating blueprint action: ${item.name}`);
                                }}
                                className="p-1.5 text-[#8b0000] hover:bg-red-50 rounded-lg cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

          </div>
        </div>

        {/* FLOATING SMART SCROLL INDICATOR BUTTON (RE-THEMED TO PARCHMENT WOOD) */}
        {showScrollBtn && (
          <button
            onClick={handleScrollAction}
            className="absolute bottom-20 right-8 z-[100] p-3 bg-[#faf4e5] hover:bg-[#8b4513] hover:text-[#ffd700] text-[#5d4037] border border-[#8b4513]/30 rounded-full shadow-lg backdrop-blur transition-all duration-250 cursor-pointer active:scale-90"
            title={isAtBottom ? "Smooth Scroll to Top" : "Smooth Scroll to Bottom"}
          >
            {isAtBottom ? <ArrowUp className="w-4.5 h-4.5" /> : <ArrowDown className="w-4.5 h-4.5" />}
          </button>
        )}

        {/* SYSTEM BOTTOM ACTION BAR (WOOD BAR AND PARCHMENT ACTIONS) */}
        <div className="p-4 bg-[#5d4037]/10 border-t border-[#8b4513]/20 flex justify-end gap-3 shrink-0 z-10 font-sans">
          <button
            onClick={onClose}
            className="px-5 h-10 bg-[#faf4e5] hover:bg-[#8b4513]/5 border border-[#8b4513]/30 text-[#4b2c20] font-black rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              showNotice("Ledger compliance parameters committed safely.");
              onClose();
            }}
            className="px-5 h-10 bg-[#8b4513] text-[#ffd700] hover:bg-[#a0522d] border border-[#d4af37]/45 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md hover:scale-105 active:scale-95"
          >
            <Check className="w-4 h-4" />
            <span>Commit Matrix Configuration</span>
          </button>
        </div>

      </div>
    </div>
  );
}