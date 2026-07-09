import React, { useState, useMemo } from "react";
import { Plus, Trash2, Tag, BookOpen, Layers, ShieldCheck, AlertCircle, RefreshCw, ArrowLeft } from "lucide-react";
import { ChartOfAccountItem, MatrixRow } from "../types";

interface SettingsProps {
  chartOfAccounts: ChartOfAccountItem[];
  matrix: MatrixRow[];
  onAddChartOfAccountItem: (item: ChartOfAccountItem) => void;
  onRemoveChartOfAccountItem: (code: number) => void;
  onAddMatrixRow: (row: MatrixRow) => void;
  onRemoveMatrixRow: (index: number) => void;
  onResetToDefaults: () => void;
  cameFromInsert?: boolean;
  onGoBack?: () => void;
  activeSubTab?: "accounts" | "matrix";
  setActiveSubTab?: (tab: "accounts" | "matrix") => void;
}

type SubTab = "accounts" | "matrix";

export default function Settings({
  chartOfAccounts,
  matrix,
  onAddChartOfAccountItem,
  onRemoveChartOfAccountItem,
  onAddMatrixRow,
  onRemoveMatrixRow,
  onResetToDefaults,
  cameFromInsert = false,
  onGoBack,
  activeSubTab: propActiveSubTab,
  setActiveSubTab: propSetActiveSubTab,
}: SettingsProps) {
  const [localActiveSubTab, setLocalActiveSubTab] = useState<SubTab>("accounts");
  const activeSubTab = propActiveSubTab !== undefined ? propActiveSubTab : localActiveSubTab;
  const setActiveSubTab = propSetActiveSubTab !== undefined ? propSetActiveSubTab : setLocalActiveSubTab;

  // Form states for adding Chart of Accounts
  const [newAccCode, setNewAccCode] = useState("");
  const [newAccI, setNewAccI] = useState("");
  const [newAccII, setNewAccII] = useState("");
  const [newAccIII, setNewAccIII] = useState("");

  // Form states for adding Matrix Row (Hierarchy Links)
  const [newMatI, setNewMatI] = useState("");
  const [newMatII, setNewMatII] = useState("");
  const [newMatIII, setNewMatIII] = useState("");
  const [newMatEntity, setNewMatEntity] = useState("");

  const [formError, setFormError] = useState("");

  // Unique lists from matrix for dropdown selections
  const uniqueTypeI = useMemo(() => {
    const set = new Set<string>();
    matrix.forEach((r) => { if (r.account_type_I) set.add(r.account_type_I); });
    return Array.from(set).sort();
  }, [matrix]);

  const uniqueTypeII = useMemo(() => {
    const set = new Set<string>();
    matrix.forEach((r) => { if (r.account_type_II) set.add(r.account_type_II); });
    return Array.from(set).sort();
  }, [matrix]);

  const uniqueTypeIII = useMemo(() => {
    const set = new Set<string>();
    matrix.forEach((r) => { if (r.account_type_III) set.add(r.account_type_III); });
    return Array.from(set).sort();
  }, [matrix]);

  const uniqueEntities = useMemo(() => {
    const set = new Set<string>();
    matrix.forEach((r) => { if (r.entity_name) set.add(r.entity_name); });
    return Array.from(set).sort();
  }, [matrix]);

  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    const code = parseInt(newAccCode, 10);
    if (isNaN(code) || code <= 0) {
      setFormError("Please enter a valid positive numeric account code.");
      return;
    }

    if (chartOfAccounts.some((acc) => acc.account_code === code)) {
      setFormError(`Account code ${code} is already in use.`);
      return;
    }

    if (!newAccI.trim() || !newAccII.trim() || !newAccIII.trim()) {
      setFormError("All classification levels (I, II, and III) are required.");
      return;
    }

    onAddChartOfAccountItem({
      account_code: code,
      account_type_I: newAccI.trim(),
      account_type_II: newAccII.trim(),
      account_type_III: newAccIII.trim(),
    });

    setNewAccCode("");
    setNewAccI("");
    setNewAccII("");
    setNewAccIII("");
  };

  const handleAddMatrixRow = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    const tI = newMatI.trim();
    const tII = newMatII.trim();
    const tIII = newMatIII.trim();
    const ent = newMatEntity.trim();

    if (!tI) {
      setFormError("Level I category name is required.");
      return;
    }

    // Check if this specific combination already exists
    const duplicate = matrix.some(
      (r) =>
        r.account_type_I === tI &&
        r.account_type_II === tII &&
        r.account_type_III === tIII &&
        r.entity_name === ent
    );

    if (duplicate) {
      setFormError("This hierarchical association path already exists in the matrix.");
      return;
    }

    onAddMatrixRow({
      account_type_I: tI,
      account_type_II: tII,
      account_type_III: tIII,
      entity_name: ent,
    });

    setNewMatI("");
    setNewMatII("");
    setNewMatIII("");
    setNewMatEntity("");
  };

  return (
    <div className="space-y-6">
      {cameFromInsert && onGoBack && (
        <button
          onClick={onGoBack}
          className="flex items-center gap-2 px-4 py-2 text-xs text-emerald-400 hover:text-emerald-300 font-bold bg-emerald-500/10 hover:bg-emerald-500/20 rounded-xl border border-emerald-500/20 transition cursor-pointer w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          Go Back to Register Transaction
        </button>
      )}

      {/* Settings Header with Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">System Settings & Mapping Configurations</h2>
          <p className="text-xs text-slate-500">Configure your global chart of accounts, business entities, and hierarchical mapping paths.</p>
        </div>

        <button
          onClick={() => {
            if (confirm("Are you sure you want to reset all accounts, entities and transactions to default seed data?")) {
              onResetToDefaults();
            }
          }}
          className="flex items-center gap-2 px-3 py-1.5 text-xs text-red-400 hover:text-red-300 font-bold bg-red-500/10 hover:bg-red-500/20 rounded-lg border border-red-500/20 transition self-stretch sm:self-auto text-center justify-center cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Reset All Data
        </button>
      </div>

      {/* Settings Sub-Tabs */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => { setActiveSubTab("accounts"); setFormError(""); }}
          className={`px-5 py-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition cursor-pointer ${
            activeSubTab === "accounts"
              ? "border-emerald-500 text-emerald-400"
              : "border-transparent text-slate-500 hover:text-slate-300"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Chart of Accounts Table
        </button>
        <button
          onClick={() => { setActiveSubTab("matrix"); setFormError(""); }}
          className={`px-5 py-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition cursor-pointer ${
            activeSubTab === "matrix"
              ? "border-emerald-500 text-emerald-400"
              : "border-transparent text-slate-500 hover:text-slate-300"
          }`}
        >
          <Layers className="w-4 h-4" />
          Consolidated Matrix & Entities
        </button>
      </div>

      {/* Form Error Message */}
      {formError && (
        <div className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {/* SUB-TAB PANELS */}
      {activeSubTab === "accounts" ? (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          {/* Add Account Form Card */}
          <div className="xl:col-span-4 bg-[#111113] p-6 rounded-2xl border border-slate-800 shadow-xl shadow-black/20 h-fit space-y-4">
            <h3 className="font-bold text-slate-300 text-sm flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-400" />
              Add Chart of Accounts Item
            </h3>

            <form onSubmit={handleAddAccount} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">Account Code</label>
                <input
                  type="number"
                  placeholder="e.g. 1020"
                  required
                  value={newAccCode}
                  onChange={(e) => setNewAccCode(e.target.value)}
                  className="w-full bg-[#1A1A1C] border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">Account Type I (Root)</label>
                <input
                  type="text"
                  placeholder="e.g. Assets"
                  list="suggest-I"
                  required
                  value={newAccI}
                  onChange={(e) => setNewAccI(e.target.value)}
                  className="w-full bg-[#1A1A1C] border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
                <datalist id="suggest-I">
                  {uniqueTypeI.map((item) => (
                    <option key={`sug-acc-I-${item}`} value={item} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">Account Type II (Subtype)</label>
                <input
                  type="text"
                  placeholder="e.g. Current Assets"
                  list="suggest-II"
                  required
                  value={newAccII}
                  onChange={(e) => setNewAccII(e.target.value)}
                  className="w-full bg-[#1A1A1C] border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
                <datalist id="suggest-II">
                  {uniqueTypeII.map((item) => (
                    <option key={`sug-acc-II-${item}`} value={item} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">Account Type III (Classification)</label>
                <input
                  type="text"
                  placeholder="e.g. Cash & Equivalents"
                  list="suggest-III"
                  required
                  value={newAccIII}
                  onChange={(e) => setNewAccIII(e.target.value)}
                  className="w-full bg-[#1A1A1C] border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
                <datalist id="suggest-III">
                  {uniqueTypeIII.map((item) => (
                    <option key={`sug-acc-III-${item}`} value={item} />
                  ))}
                </datalist>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-[#0A0A0B] rounded-lg text-sm font-bold shadow-md shadow-emerald-500/10 transition cursor-pointer"
              >
                Register Account Code
              </button>
            </form>
          </div>

          {/* Current Chart of Accounts Table */}
          <div className="xl:col-span-8 bg-[#111113] rounded-2xl border border-slate-800 shadow-xl shadow-black/20 overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-[#1A1A1C]">
              <h3 className="font-bold text-slate-300 text-sm">Active Chart of Accounts Registers</h3>
              <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full font-semibold">{chartOfAccounts.length} Total</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#1A1A1C] border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <th className="py-3 px-5">Account Code</th>
                    <th className="py-3 px-5">Type I</th>
                    <th className="py-3 px-5">Type II</th>
                    <th className="py-3 px-5">Type III</th>
                    <th className="py-3 px-5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-sm text-slate-300">
                  {chartOfAccounts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-500">
                        No accounts configured in settings yet.
                      </td>
                    </tr>
                  ) : (
                    chartOfAccounts.map((acc) => (
                      <tr key={`sett-acc-${acc.account_code}`} className="hover:bg-slate-800/10">
                        <td className="py-3 px-5 font-mono font-bold text-white">{acc.account_code}</td>
                        <td className="py-3 px-5">
                          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-xs font-semibold">
                            {acc.account_type_I}
                          </span>
                        </td>
                        <td className="py-3 px-5 text-xs text-slate-400">{acc.account_type_II}</td>
                        <td className="py-3 px-5 text-xs text-slate-200 font-semibold">{acc.account_type_III}</td>
                        <td className="py-3 px-5 text-center">
                          <button
                            onClick={() => onRemoveChartOfAccountItem(acc.account_code)}
                            className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition cursor-pointer"
                            title="Remove account register"
                          >
                            <Trash2 className="w-4 h-4 mx-auto" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          {/* Add Association/Matrix Form Card */}
          <div className="xl:col-span-4 bg-[#111113] p-6 rounded-2xl border border-slate-800 shadow-xl shadow-black/20 h-fit space-y-4">
            <h3 className="font-bold text-slate-300 text-sm flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-400" />
              Add Matrix Association
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Define a valid structural link down the classification levels to an Entity. This forms the backbone of dynamic filtering dropdowns.
            </p>

            <form onSubmit={handleAddMatrixRow} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">Account Type I (Root)</label>
                <input
                  type="text"
                  placeholder="e.g. Expenses"
                  required
                  list="sug-mat-I"
                  value={newMatI}
                  onChange={(e) => setNewMatI(e.target.value)}
                  className="w-full bg-[#1A1A1C] border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
                <datalist id="sug-mat-I">
                  {uniqueTypeI.map((item) => <option key={`mat-sug-I-${item}`} value={item} />)}
                </datalist>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">Account Type II (Subtype)</label>
                <input
                  type="text"
                  placeholder="e.g. Operating Expenses"
                  required
                  list="sug-mat-II"
                  value={newMatII}
                  onChange={(e) => setNewMatII(e.target.value)}
                  className="w-full bg-[#1A1A1C] border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
                <datalist id="sug-mat-II">
                  {uniqueTypeII.map((item) => <option key={`mat-sug-II-${item}`} value={item} />)}
                </datalist>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">Account Type III (Classification)</label>
                <input
                  type="text"
                  placeholder="e.g. Software Subscriptions"
                  required
                  list="sug-mat-III"
                  value={newMatIII}
                  onChange={(e) => setNewMatIII(e.target.value)}
                  className="w-full bg-[#1A1A1C] border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
                <datalist id="sug-mat-III">
                  {uniqueTypeIII.map((item) => <option key={`mat-sug-III-${item}`} value={item} />)}
                </datalist>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">Entity Name</label>
                <input
                  type="text"
                  placeholder="e.g. AWS Cloud Services"
                  required
                  list="sug-mat-ent"
                  value={newMatEntity}
                  onChange={(e) => setNewMatEntity(e.target.value)}
                  className="w-full bg-[#1A1A1C] border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
                <datalist id="sug-mat-ent">
                  {uniqueEntities.map((item) => <option key={`mat-sug-ent-${item}`} value={item} />)}
                </datalist>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-[#0A0A0B] rounded-lg text-sm font-bold shadow-md shadow-emerald-500/10 transition cursor-pointer"
              >
                Register Association Path
              </button>
            </form>
          </div>

          {/* Current Consolidated Matrix Path Configuration */}
          <div className="xl:col-span-8 bg-[#111113] rounded-2xl border border-slate-800 shadow-xl shadow-black/20 overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-[#1A1A1C]">
              <h3 className="font-bold text-slate-300 text-sm">Valid Association Matrix Mapping Nodes</h3>
              <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full font-semibold">{matrix.length} Matrix Paths</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#1A1A1C] border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <th className="py-3 px-5">Level I</th>
                    <th className="py-3 px-5">Level II</th>
                    <th className="py-3 px-5">Level III</th>
                    <th className="py-3 px-5">Registered Entity</th>
                    <th className="py-3 px-5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-sm text-slate-300">
                  {matrix.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-500">
                        No matrix associations mapped yet.
                      </td>
                    </tr>
                  ) : (
                    matrix.map((row, index) => (
                      <tr key={`sett-mat-${index}`} className="hover:bg-slate-800/10">
                        <td className="py-3 px-5">
                          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-xs font-semibold">
                            {row.account_type_I || "(Empty)"}
                          </span>
                        </td>
                        <td className="py-3 px-5 text-xs text-slate-400">{row.account_type_II || "(Empty)"}</td>
                        <td className="py-3 px-5 text-xs text-slate-200 font-semibold">{row.account_type_III || "(Empty)"}</td>
                        <td className="py-3 px-5">
                          {row.entity_name ? (
                            <span className="bg-slate-800 text-slate-300 border border-slate-700/60 px-2.5 py-0.5 rounded text-xs font-semibold">
                              {row.entity_name}
                            </span>
                          ) : (
                            <span className="text-slate-500 text-xs italic">(None)</span>
                          )}
                        </td>
                        <td className="py-3 px-5 text-center">
                          <button
                            onClick={() => onRemoveMatrixRow(index)}
                            className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition cursor-pointer"
                            title="Remove association link"
                          >
                            <Trash2 className="w-4 h-4 mx-auto" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
