import React, { useState, useEffect } from "react";
import { PlusCircle, List, Settings as SettingsIcon, Landmark } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import InsertTransaction from "./components/InsertTransaction";
import Ledger from "./components/Ledger";
import Settings from "./components/Settings";
import {
  ChartOfAccountItem,
  MatrixRow,
  Transaction,
  INITIAL_CHART_OF_ACCOUNTS,
  INITIAL_MATRIX,
  INITIAL_TRANSACTIONS,
} from "./types";

type MenuTab = "insert" | "ledger" | "settings";

export default function App() {
  const [activeTab, setActiveTab] = useState<MenuTab>("insert");

  // Global state
  const [chartOfAccounts, setChartOfAccounts] = useState<ChartOfAccountItem[]>([]);
  const [matrix, setMatrix] = useState<MatrixRow[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Lifted form states of InsertTransaction
  const [insertDate, setInsertDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [insertSourceCode, setInsertSourceCode] = useState("");
  const [insertTargetCode, setInsertTargetCode] = useState("");
  const [insertSelectedTypeI, setInsertSelectedTypeI] = useState("");
  const [insertSelectedTypeII, setInsertSelectedTypeII] = useState("");
  const [insertSelectedTypeIII, setInsertSelectedTypeIII] = useState("");
  const [insertSelectedEntity, setInsertSelectedEntity] = useState("");
  const [insertAmount, setInsertAmount] = useState("");
  const [insertDescription, setInsertDescription] = useState("");

  // Navigation / Redirection Context state
  const [cameFromInsert, setCameFromInsert] = useState(false);
  const [settingsSubTab, setSettingsSubTab] = useState<"accounts" | "matrix">("accounts");

  const handleNavigateToSettings = (subTab: "accounts" | "matrix") => {
    setSettingsSubTab(subTab);
    setCameFromInsert(true);
    setActiveTab("settings");
  };

  const handleGoBackToInsert = () => {
    setCameFromInsert(false);
    setActiveTab("insert");
  };

  // Load from local storage or set defaults on mount
  useEffect(() => {
    const cachedAccounts = localStorage.getItem("accounts_chart");
    const cachedMatrix = localStorage.getItem("accounts_matrix");
    const cachedTx = localStorage.getItem("accounts_transactions");

    if (cachedAccounts) {
      setChartOfAccounts(JSON.parse(cachedAccounts));
    } else {
      setChartOfAccounts(INITIAL_CHART_OF_ACCOUNTS);
      localStorage.setItem("accounts_chart", JSON.stringify(INITIAL_CHART_OF_ACCOUNTS));
    }

    if (cachedMatrix) {
      setMatrix(JSON.parse(cachedMatrix));
    } else {
      setMatrix(INITIAL_MATRIX);
      localStorage.setItem("accounts_matrix", JSON.stringify(INITIAL_MATRIX));
    }

    if (cachedTx) {
      setTransactions(JSON.parse(cachedTx));
    } else {
      setTransactions(INITIAL_TRANSACTIONS);
      localStorage.setItem("accounts_transactions", JSON.stringify(INITIAL_TRANSACTIONS));
    }
  }, []);

  // Save changes to local storage when state updates
  const saveAccounts = (newAccounts: ChartOfAccountItem[]) => {
    setChartOfAccounts(newAccounts);
    localStorage.setItem("accounts_chart", JSON.stringify(newAccounts));
  };

  const saveMatrix = (newMatrix: MatrixRow[]) => {
    setMatrix(newMatrix);
    localStorage.setItem("accounts_matrix", JSON.stringify(newMatrix));
  };

  const saveTransactions = (newTransactions: Transaction[]) => {
    setTransactions(newTransactions);
    localStorage.setItem("accounts_transactions", JSON.stringify(newTransactions));
  };

  // State Updates Callback Actions
  const handleAddTransaction = (newTx: Omit<Transaction, "id">) => {
    const txWithId: Transaction = {
      ...newTx,
      id: `tx-${Date.now()}`,
    };
    saveTransactions([txWithId, ...transactions]);
  };

  const handleDeleteTransaction = (id: string) => {
    saveTransactions(transactions.filter((t) => t.id !== id));
  };

  const handleAddMatrixRow = (row: MatrixRow) => {
    saveMatrix([...matrix, row]);
  };

  const handleRemoveMatrixRow = (index: number) => {
    const updated = [...matrix];
    updated.splice(index, 1);
    saveMatrix(updated);
  };

  const handleAddChartOfAccountItem = (item: ChartOfAccountItem) => {
    saveAccounts([...chartOfAccounts, item]);
  };

  const handleRemoveChartOfAccountItem = (code: number) => {
    saveAccounts(chartOfAccounts.filter((acc) => acc.account_code !== code));
  };

  const handleResetToDefaults = () => {
    saveAccounts(INITIAL_CHART_OF_ACCOUNTS);
    saveMatrix(INITIAL_MATRIX);
    saveTransactions(INITIAL_TRANSACTIONS);
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#0A0A0B] text-slate-200 font-sans selection:bg-emerald-500/20 selection:text-emerald-300">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-[#111113] border-b md:border-b-0 md:border-r border-slate-800 flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between md:block">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-[#0A0A0B] shadow-lg shadow-emerald-500/10 shrink-0">
              <Landmark className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <h1 className="font-bold text-base tracking-tight text-white">FINLEDGER</h1>
              <p className="text-[10px] text-slate-500 font-mono tracking-wider">ACUITY ENGINE</p>
            </div>
          </div>
          <div className="md:hidden">
            <span className="text-[10px] bg-slate-800 text-emerald-400 px-2 py-1 rounded font-mono">v2.4.10</span>
          </div>
        </div>

        {/* Sidebar Tabs */}
        <nav className="p-4 space-y-1.5 flex-1">
          <button
            onClick={() => setActiveTab("insert")}
            className={`w-full flex items-center gap-3 p-3 rounded-xl text-sm font-medium transition duration-200 cursor-pointer ${
              activeTab === "insert"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent"
            }`}
          >
            <PlusCircle className="w-5 h-5" />
            <span>Insert Transaction</span>
          </button>

          <button
            onClick={() => setActiveTab("ledger")}
            className={`w-full flex items-center gap-3 p-3 rounded-xl text-sm font-medium transition duration-200 cursor-pointer ${
              activeTab === "ledger"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent"
            }`}
          >
            <List className="w-5 h-5" />
            <span>Ledger Records</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("settings");
              setCameFromInsert(false);
            }}
            className={`w-full flex items-center gap-3 p-3 rounded-xl text-sm font-medium transition duration-200 cursor-pointer ${
              activeTab === "settings"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent"
            }`}
          >
            <SettingsIcon className="w-5 h-5" />
            <span>System Settings</span>
          </button>
        </nav>

        {/* User / Build status badge */}
        <div className="p-4 border-t border-slate-800 hidden md:block">
          <div className="bg-[#1A1A1C] border border-slate-800 rounded-xl p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 text-xs font-bold border border-emerald-500/20">
              ADM
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-300 truncate">Admin Portal</p>
              <p className="text-[10px] text-slate-500 font-mono">v2.4.10-stable</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Dynamic Header */}
        <header className="h-20 border-b border-slate-800 px-6 sm:px-8 flex items-center justify-between bg-[#111113]/50 backdrop-blur-md sticky top-0 z-30">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              {activeTab === "insert" && "Register Transaction"}
              {activeTab === "ledger" && "Financial Ledger"}
              {activeTab === "settings" && "Configuration Management"}
            </h2>
            <p className="text-xs text-slate-500 hidden sm:block">
              {activeTab === "insert" && "Add a new double-entry record to the ledger"}
              {activeTab === "ledger" && "Browse, audit, and inspect active records"}
              {activeTab === "settings" && "Configure accounts, entities, and matrix associations"}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Last Activity</p>
              <p className="text-xs font-mono text-emerald-400">
                {transactions.length > 0 ? transactions[0].date : "No records yet"}
              </p>
            </div>
            <div className="bg-slate-800/40 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-mono">
              Records: {transactions.length}
            </div>
          </div>
        </header>

        {/* Content Wrapper */}
        <div className="flex-1 p-6 sm:p-8 overflow-y-auto">
          <AnimatePresence mode="wait">
            {activeTab === "insert" && (
              <motion.div
                key="insert-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
              >
                <InsertTransaction
                  chartOfAccounts={chartOfAccounts}
                  matrix={matrix}
                  transactions={transactions}
                  onAddTransaction={handleAddTransaction}
                  onAddMatrixRow={handleAddMatrixRow}
                  onAddChartOfAccountItem={handleAddChartOfAccountItem}
                  formState={{
                    date: insertDate,
                    setDate: setInsertDate,
                    sourceCode: insertSourceCode,
                    setSourceCode: setInsertSourceCode,
                    targetCode: insertTargetCode,
                    setTargetCode: setInsertTargetCode,
                    selectedTypeI: insertSelectedTypeI,
                    setSelectedTypeI: setInsertSelectedTypeI,
                    selectedTypeII: insertSelectedTypeII,
                    setSelectedTypeII: setInsertSelectedTypeII,
                    selectedTypeIII: insertSelectedTypeIII,
                    setSelectedTypeIII: setInsertSelectedTypeIII,
                    selectedEntity: insertSelectedEntity,
                    setSelectedEntity: setInsertSelectedEntity,
                    amount: insertAmount,
                    setAmount: setInsertAmount,
                    description: insertDescription,
                    setDescription: setInsertDescription,
                  }}
                  onNavigateToSettings={handleNavigateToSettings}
                />
              </motion.div>
            )}

            {activeTab === "ledger" && (
              <motion.div
                key="ledger-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
              >
                <Ledger
                  transactions={transactions}
                  onDeleteTransaction={handleDeleteTransaction}
                />
              </motion.div>
            )}

            {activeTab === "settings" && (
              <motion.div
                key="settings-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
              >
                <Settings
                  chartOfAccounts={chartOfAccounts}
                  matrix={matrix}
                  onAddChartOfAccountItem={handleAddChartOfAccountItem}
                  onRemoveChartOfAccountItem={handleRemoveChartOfAccountItem}
                  onAddMatrixRow={handleAddMatrixRow}
                  onRemoveMatrixRow={handleRemoveMatrixRow}
                  onResetToDefaults={handleResetToDefaults}
                  cameFromInsert={cameFromInsert}
                  onGoBack={handleGoBackToInsert}
                  activeSubTab={settingsSubTab}
                  setActiveSubTab={setSettingsSubTab}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <footer className="py-6 px-8 border-t border-slate-800 bg-[#111113]/30 text-center sm:text-left text-[10px] text-slate-500 flex flex-col sm:flex-row justify-between gap-2">
          <span>&copy; 2026 AcuityLedger. Precision dual-entry accounting system.</span>
          <span>Status: <span className="text-emerald-400 font-semibold font-mono">SECURE LIVE</span></span>
        </footer>
      </main>
    </div>
  );
}
