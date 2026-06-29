/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useRef, useMemo } from 'react';
import { useDashboardEngine, formatNumberCompact } from './lib/useDashboardEngine';
import { supabase } from './lib/supabaseClient';
import HUD from './components/HUD';
import Login from './components/Login';
import BottomNav from './components/BottomNav';
import IsometricMap from './components/IsometricMap';
import Modal from './components/Modal';
import bgMap from './assets/Medieval_Town_Backround.png';
import { useKingdomStore } from './store/useKingdomStore';
import { Toaster, toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { STANDARD_MODAL_PROPS, Z_LAYERS, SAFE_AREAS } from './constants/UI_UX';
import FlowByCategoryChart from './components/charts/FlowByCategoryChart';
import TimeEvolutionChart from './components/charts/TimeEvolutionChart';
import TopEntitiesChart from './components/charts/TopEntitiesChart';
import ExpensesDonutChart from './components/charts/ExpensesDonutChart';
import ExpensesDetailedChart from './components/charts/ExpensesDetailedChart';
import DebtEvolutionChart from './components/charts/DebtEvolutionChart';
import DebtByEntityChart from './components/charts/DebtByEntityChart';
import DebtCompositionChart from './components/charts/DebtCompositionChart';
import RoyalTreasurerInsights from './components/RoyalTreasurerInsights';
import BaseDashboardTab from './components/BaseDashboardTab';
import RoyalIncomeStatement from './components/RoyalIncomeStatement';
import TreasuryStatements from './components/TreasuryStatements';
import ConsolidatedFinancialStatement from './components/ConsolidatedFinancialStatement';
import { handleExportCSV, handleImportCSV, handleExportAllActionsCSV, handleImportQuickActionsCSV, handleExportSettingsCSV, handleImportSettingsCSV } from './utils/csvHelpers';
import { getAccountName } from './utils/accountMappings';
import QuickActionFormFields from './components/QuickActionFormFields';
import EditQuickActionModal from './components/EditQuickActionModal';
import ManageQuickActionsPanel from './components/ManageQuickActionsPanel';
import RegisterTransactionForm from './components/RegisterTransactionForm';
import FinancialStatementsModal from './components/FinancialStatementsModal';
import { useManualTransactionForm } from './hooks/useManualTransactionForm';
import { useQuickActionForm } from './hooks/useQuickActionForm';
import { useLedgerFilters } from './hooks/useLedgerFilters';
import CategoryMatrixEditor from './components/CategoryMatrixEditor';
import COAEditor from './components/COAEditor';
import SubtypeCategoryEditor from './components/SubtypeCategoryEditor';
import GoldMineLedger from './components/GoldMineLedger';
import FlatListEditor from './components/FlatListEditor';



const GUEST_PROFILE_ID = '00000000-0000-0000-0000-000000000000';



function App() {
  const [activeTab, setActiveTab] = useState('quests');
  const [isMineModalOpen, setIsMineModalOpen] = useState(false);
  const [isNewTxModalOpen, setIsNewTxModalOpen] = useState(false);
  const fileInputRef = useRef(null);
  const qaFileInputRef = useRef(null);
  const settingsFileInputRef = useRef(null);

  // Dashboard Page Sub-Tabs and Granularity state
  const [dashSubTab, setDashSubTab] = useState('overview'); // overview, income_expense, payables_receivables
  const [isTreasuryMenuOpen, setIsTreasuryMenuOpen] = useState(false);
  const [isQuestsModalOpen, setIsQuestsModalOpen] = useState(false);
  const [dashGranularity] = useState('month'); // month, quarter, year

  // Settings manage states
  const [selectedSettingType, setSelectedSettingType] = useState('from');
  const [newOptionVal, setNewOptionVal] = useState('');
  const [newEntityCatVal, setNewEntityCatVal] = useState('Payroll');

  // Sort states
  const [actionsSortField, setActionsSortField] = useState(null);
  const [actionsSortDirection, setActionsSortDirection] = useState('asc');
  const [settingsSortDirection, setSettingsSortDirection] = useState('asc');

  // Filters for All Actions
  const [filterActionType, setFilterActionType] = useState('');
  const [filterActionSubtype, setFilterActionSubtype] = useState('');
  const [filterActionCategory, setFilterActionCategory] = useState('');
  const [filterActionEntity, setFilterActionEntity] = useState('');

  // Pagination for All Actions
  const [actionsCurrentPage, setActionsCurrentPage] = useState(1);
  const [manualPageInput, setManualPageInput] = useState('1');

  useEffect(() => {
    setManualPageInput(String(actionsCurrentPage));
  }, [actionsCurrentPage]);



  // Bind Zustand options & actions
  const fromOptions = useKingdomStore((state) => state.fromOptions);
  const statusOptions = useKingdomStore((state) => state.statusOptions);
  const classOptions = useKingdomStore((state) => state.classOptions);
  const subClassOptions = useKingdomStore((state) => state.subClassOptions);
  const entityOptions = useKingdomStore((state) => state.entityOptions);
  const categoryOptions = useKingdomStore((state) => state.categoryOptions);
  const entityMappings = useKingdomStore((state) => state.entityMappings);
  const monthOptions = useKingdomStore((state) => state.monthOptions);

  const addOption = useKingdomStore((state) => state.addOption);
  const editOption = useKingdomStore((state) => state.editOption);
  const deleteOption = useKingdomStore((state) => state.deleteOption);
  const subtypeToCategoryMap = useKingdomStore((state) => state.subtypeToCategoryMap || {});
  const subtypeTypes = useKingdomStore((state) => state.subtypeTypes || {});
  const syncSettings = useKingdomStore((state) => state.syncSettings);

  const email = useKingdomStore((state) => state.email);
  const gold = useKingdomStore((state) => state.gold);
  const level = useKingdomStore((state) => state.level);
  const xp = useKingdomStore((state) => state.xp);
  const gems = useKingdomStore((state) => state.gems);
  const mineLevel = useKingdomStore((state) => state.mineLevel);
  const lastCollectionTime = useKingdomStore((state) => state.lastCollectionTime);
  const collectPassiveGold = useKingdomStore((state) => state.collectPassiveGold);
  const upgradeMine = useKingdomStore((state) => state.upgradeMine);
  const user = useKingdomStore((state) => state.user);
  const role = useKingdomStore((state) => state.role);
  const transactions = useKingdomStore((state) => state.transactions);
  const isLoading = useKingdomStore((state) => state.isLoading);
  const rawTemplates = useKingdomStore((state) => state.templates);
  const accountMappings = useKingdomStore((state) => state.accountMappings);
  
  const fetchKingdomData = useKingdomStore((state) => state.fetchKingdomData);
  const fetchDashboardData = useKingdomStore((state) => state.fetchDashboardData);
  const registerTransaction = useKingdomStore((state) => state.registerTransaction);
  const registerTransactions = useKingdomStore((state) => state.registerTransactions);
  const deleteTransactions = useKingdomStore((state) => state.deleteTransactions);
  const initAuth = useKingdomStore((state) => state.initAuth);

  // Invoke extracted Custom Hooks
  const {
    isFiltersExpanded, setIsFiltersExpanded,
    filterYear, setFilterYear,
    filterMonth, setFilterMonth,
    filterFrom, setFilterFrom,
    filterStatus, setFilterStatus,
    filterClass, setFilterClass,
    filterCategory, setFilterCategory,
    filterEntity, setFilterEntity,
    selectedYears, setSelectedYears,
    hasInitializedYears, setHasInitializedYears,
    selectedQuarters, setSelectedQuarters,
    selectedMonths, setSelectedMonths,
    isSidebarOpen, setIsSidebarOpen,
    uniqueYears,
    filteredTransactions,
    dashboardFilteredTransactions,
    resetFilters,
    isFallbackState
  } = useLedgerFilters();

  const {
    txClass, setTxClass,
    txAmount, setTxAmount,
    txFrom, setTxFrom,
    txValueDate, setTxValueDate,
    txPostingDate, setTxPostingDate,
    txDueDate, setTxDueDate,
    txStatus, setTxStatus,
    txSubClass, setTxSubClass,
    txEntity, setTxEntity,
    txCategory, setTxCategory,
    txSubCategory,
    txDescription, setTxDescription,
    txTargetAccount, setTxTargetAccount,
    txSourceDestBank, setTxSourceDestBank,
    txFlow, setTxFlow,
    editingTxId, setEditingTxId,
    mainMenu, setMainMenu,
    subMenuAction, setSubMenuAction,
    cascadingConfig,
    handleMainMenuChange,
    handleSubMenuChange,
    handleEntityChange,
    applyTemplate,
    startEdit,
    handleSubmit,
    resetFormState
  } = useManualTransactionForm(setIsNewTxModalOpen);

  const {
    qaName, setQaName,
    qaIcon, setQaIcon,
    qaAmount, setQaAmount,
    qaFrom, setQaFrom,
    qaClass, setQaClass,
    qaStatus, setQaStatus,
    qaSubClass, setQaSubClass,
    qaEntity, setQaEntity,
    qaCategory, setQaCategory,
    qaTargetAccount, setQaTargetAccount,
    qaSourceDestBank, setQaSourceDestBank,
    qaFlow, setQaFlow,
    qaDescription, setQaDescription,
    qaDueDate, setQaDueDate,
    qaValueDate, setQaValueDate,
    qaPostingDate, setQaPostingDate,
    isEditingQa, setIsEditingQa,
    selectedQaNames, setSelectedQaNames,
    selectedQaTemplateName, setSelectedQaTemplateName,
    templates,
    handleQaEntityChange,
    resetQaForm,
    handleSaveQuickAction,
    handleDeleteQuickAction,
    handleAddQuickAction,
    loadTemplateIntoForm
  } = useQuickActionForm();

  // Quick Actions filtering states in the register transaction modal
  const [qaSubtypeFilter, setQaSubtypeFilter] = useState('All');
  const [qaCategoryFilter, setQaCategoryFilter] = useState('All');

  const handleQaSubtypeFilterChange = (subtype) => {
    setQaSubtypeFilter(subtype);
    if (subtype !== 'All') {
      const allowed = subtypeToCategoryMap[subtype] || [];
      if (qaCategoryFilter !== 'All' && !allowed.includes(qaCategoryFilter)) {
        setQaCategoryFilter('All');
      }
    }
  };

  const qaCategoryOptions = useMemo(() => {
    if (qaSubtypeFilter === 'All') {
      return categoryOptions;
    }
    return subtypeToCategoryMap[qaSubtypeFilter] || [];
  }, [categoryOptions, qaSubtypeFilter, subtypeToCategoryMap]);

  const filteredTemplates = useMemo(() => {
    return templates.filter(tpl => {
      if (qaSubtypeFilter !== 'All' && tpl.data.transaction_subtype !== qaSubtypeFilter) return false;
      if (qaCategoryFilter !== 'All' && tpl.data.transaction_category !== qaCategoryFilter) return false;
      return true;
    });
  }, [templates, qaSubtypeFilter, qaCategoryFilter]);

  // Reset filter initialization on email change
  useEffect(() => {
    setHasInitializedYears(false);
  }, [email, setHasInitializedYears]);

  // New game engine state variables and hooks
  const [uncollectedGold, setUncollectedGold] = useState(0);
  const [isTreasuryModalOpen, setIsTreasuryModalOpen] = useState(false);
  const [vaultTransferType, setVaultTransferType] = useState('deposit');
  const [vaultAmount, setVaultAmount] = useState('');
  const [vaultDescription, setVaultDescription] = useState('Royal Vault Deposit');

  useEffect(() => {
    setVaultDescription(vaultTransferType === 'deposit' ? 'Royal Vault Deposit' : 'Royal Vault Withdrawal');
  }, [vaultTransferType]);

  useEffect(() => {
    if (!isMineModalOpen || !lastCollectionTime) return;

    const updateCounter = () => {
      const elapsed = Math.max(0, (Date.now() - new Date(lastCollectionTime).getTime()) / 1000);
      const goldCollected = Math.floor(elapsed * (mineLevel * 0.1));
      setUncollectedGold(goldCollected);
    };

    updateCounter();
    const interval = setInterval(updateCounter, 1000);
    return () => clearInterval(interval);
  }, [isMineModalOpen, lastCollectionTime, mineLevel]);

  const handleVaultTransferSubmit = async (e) => {
    e.preventDefault();
    const amountVal = Number(vaultAmount);
    if (!amountVal || amountVal <= 0) return;

    const cashBalance = engineData.balanceSheet?.assets?.list?.find(a => a.code === '10101001')?.balance || 0;
    const vaultBalance = engineData.balanceSheet?.assets?.list?.find(a => a.code === '10101002')?.balance || 0;

    if (vaultTransferType === 'deposit' && cashBalance < amountVal) {
      toast.error(t('err_insufficient_gold_cash', 'Insufficient gold coins in primary cash purse (10101001)!'));
      return;
    }
    if (vaultTransferType === 'withdraw' && vaultBalance < amountVal) {
      toast.error(t('err_insufficient_gold_vault', 'Insufficient gold coins in the Royal Vault (10101002)!'));
      return;
    }

    const payload = {
      transaction_type: 'Assets',
      amount: amountVal,
      from: 'Consolidated',
      value_date: new Date().toISOString().split('T')[0],
      posting_date: new Date().toISOString().split('T')[0],
      payment_status: 'Completed',
      transaction_subtype: 'Banks',
      entity: 'CGD',
      transaction_category: 'Bank account',
      target_account: vaultTransferType === 'deposit' ? '10101002' : '10101001',
      source_dest_bank: vaultTransferType === 'deposit' ? '10101001' : '10101002',
      flow: 'neutral',
      description: vaultDescription
    };

    const res = await registerTransaction(user?.id, payload);
    if (res?.success) {
      toast.success(t('vault_transfer_success', 'Vault transfer registered successfully!'));
      setVaultAmount('');
      await fetchKingdomData(user?.id);
      await fetchDashboardData(user?.id);
    } else {
      toast.error(t('vault_transfer_error', 'Failed to register vault transfer.'));
    }
  };

  const profile = { email, gold, level, xp };

  const { t: originalT } = useTranslation();
  const t = new Proxy(originalT, {
    get(target, prop) {
      if (prop in target) {
        return target[prop];
      }
      if (typeof prop === 'string') {
        return target(prop);
      }
      return undefined;
    }
  });



  // Programmatic cleanup of corrupted import categories and templates data
  useEffect(() => {
    const corruptedSubtypes = ['⚡ Pay Utilities', 'Pay Utilities'];
    const corruptedCategories = ['Expenses • Utilities'];
    const obsoleteSubclasses = ['Salary (payroll)', 'Income • Payroll'];
    const obsoleteCategories = ['Income • Payroll', 'Salary (payroll)'];

    let needsSync = false;
    
    const uniqueSubClass = Array.from(new Set(subClassOptions));
    const uniqueCategory = Array.from(new Set(categoryOptions));
    const uniqueEntity = Array.from(new Set(entityOptions));

    const updatedSubClass = uniqueSubClass.filter(sub => !corruptedSubtypes.includes(sub) && !obsoleteSubclasses.includes(sub));
    const updatedCategory = uniqueCategory.filter(cat => !corruptedCategories.includes(cat) && !obsoleteCategories.includes(cat));
    const updatedEntity = uniqueEntity.filter(ent => ent !== 'Salary');

    if (
      updatedSubClass.length !== subClassOptions.length ||
      updatedCategory.length !== categoryOptions.length ||
      updatedEntity.length !== entityOptions.length
    ) {
      needsSync = true;
    }

    const updatedSubtypeMap = { ...subtypeToCategoryMap };
    corruptedSubtypes.forEach(sub => {
      if (updatedSubtypeMap[sub]) {
        delete updatedSubtypeMap[sub];
        needsSync = true;
      }
    });
    obsoleteSubclasses.forEach(sub => {
      if (updatedSubtypeMap[sub]) {
        delete updatedSubtypeMap[sub];
        needsSync = true;
      }
    });

    const updatedEntityMappings = { ...entityMappings };
    if (updatedEntityMappings['NOS'] === 'Expenses • Utilities') {
      updatedEntityMappings['NOS'] = 'Communications Expense (NOS)';
      needsSync = true;
    }
    if (updatedEntityMappings['ENDESA'] === 'Expenses • Utilities') {
      updatedEntityMappings['ENDESA'] = 'Electricity Expense (ENDESA)';
      needsSync = true;
    }
    if (updatedEntityMappings['Salary']) {
      delete updatedEntityMappings['Salary'];
      needsSync = true;
    }
    Object.entries(updatedEntityMappings).forEach(([ent, cat]) => {
      if (obsoleteCategories.includes(cat)) {
        updatedEntityMappings[ent] = 'Payroll & Active Income';
        needsSync = true;
      }
    });

    // Clean up templates
    const hasCorruptedTemplates = rawTemplates.some(tpl => {
      const nameLower = tpl.name.toLowerCase();
      return nameLower === 'pay utilities' || nameLower === '⚡ pay utilities';
    });
    let updatedTemplates = rawTemplates;
    if (hasCorruptedTemplates) {
      updatedTemplates = rawTemplates.filter(tpl => {
        const nameLower = tpl.name.toLowerCase();
        return nameLower !== 'pay utilities' && nameLower !== '⚡ pay utilities';
      });
      needsSync = true;
    }

    if (needsSync) {
      syncSettings({
        subClassOptions: updatedSubClass,
        categoryOptions: updatedCategory,
        entityOptions: updatedEntity,
        subtypeToCategoryMap: updatedSubtypeMap,
        entityMappings: updatedEntityMappings,
        templates: updatedTemplates
      });
    }
  }, [subClassOptions, categoryOptions, entityOptions, subtypeToCategoryMap, entityMappings, rawTemplates, syncSettings]);



  const engineData = useDashboardEngine(dashboardFilteredTransactions);


  // Calculate Dashboard Stats (dependent on filters)
  const dashInflow = dashboardFilteredTransactions.filter(tx => tx.transaction_type === 'Income').reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
  const dashOutflow = dashboardFilteredTransactions.filter(tx => tx.transaction_type === 'Expense').reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
  
  const subclassInflow = dashboardFilteredTransactions.filter(tx => tx.payment_status === 'Completed' && tx.flow === 'inflow').reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
  const subclassOutflow = dashboardFilteredTransactions.filter(tx => tx.payment_status === 'Completed' && tx.flow === 'outflow').reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
  
  const dashNetBalance = subclassInflow - subclassOutflow;
  
  const debtAccrual = dashboardFilteredTransactions.filter(tx => tx.transaction_type === 'Asset' && tx.flow === 'inflow').reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
  const debtPayment = dashboardFilteredTransactions.filter(tx => tx.transaction_type === 'Debt' && tx.flow === 'outflow').reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
  const dashDebt = debtAccrual - debtPayment;

  const dashEfficiencyRatio = dashInflow > 0 ? ((dashInflow - dashOutflow) / dashInflow) * 100 : 0;
  
  const subclassNet = subclassInflow - subclassOutflow;
  const subclassEfficiencyRatio = subclassInflow > 0 ? (subclassNet / subclassInflow) * 100 : 0;

  const formatNumberCompact = (num) => {
    if (!num) return '0 / g';
    const absNum = Math.abs(num);
    let formattedNum = absNum.toLocaleString(undefined, { maximumFractionDigits: 1 });
    if (absNum >= 1.0e12) formattedNum = (absNum / 1.0e12).toFixed(1) + "T";
    else if (absNum >= 1.0e9) formattedNum = (absNum / 1.0e9).toFixed(1) + "B";
    else if (absNum >= 1.0e6) formattedNum = (absNum / 1.0e6).toFixed(1) + "M";
    else if (absNum >= 1.0e3) formattedNum = (absNum / 1.0e3).toFixed(1) + "K";
    
    if (num > 0) return `+${formattedNum} / g`;
    return `(${formattedNum}) / g`;
  };

const uniqueCategories = Array.from(new Set(dashboardFilteredTransactions.map(tx => tx.transaction_category).filter(Boolean)));
  
  const timePoints = [...dashboardFilteredTransactions].reverse().reduce((acc, tx) => {
    const existing = acc.find(p => p.label === tx.month);
    if (existing) {
      if (tx.transaction_type === 'Income') existing.income += Number(tx.amount);
      if (tx.transaction_type === 'Expense') existing.expense += Number(tx.amount);
    } else {
      acc.push({
        label: tx.month,
        income: tx.transaction_type === 'Income' ? Number(tx.amount) : 0,
        expense: tx.transaction_type === 'Expense' ? Number(tx.amount) : 0,
      });
    }
    return acc;
  }, []);

  const dashCategoryData = uniqueCategories.map((cat) => {
    const catTxs = dashboardFilteredTransactions.filter((tx) => tx.transaction_category === cat);
    const income = catTxs.filter((tx) => tx.transaction_type === 'Income').reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
    const expense = catTxs.filter((tx) => tx.transaction_type === 'Expense').reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
    return { "Transaction Category": cat, income, expense, total: income + expense };
  }).filter((c) => c.total > 0);

  const maxDashCategoryVal = Math.max(...dashCategoryData.map(c => Math.max(c.income, c.expense)), 1);

  // Group by selected granularity
  const currentYear = new Date().getFullYear();
  const uniqueYearsList = [currentYear, currentYear - 1, currentYear - 2, currentYear - 3, currentYear - 4];
  const timeLabels = Array.from(new Set(dashboardFilteredTransactions.map(tx => `${tx.year} ${tx.month}`)));
  const dashTimeData = timeLabels.map((label) => {
    const [yearStr, monthStr] = label.split(' ');
    const matchedTxs = dashboardFilteredTransactions.filter(tx => String(tx.year) === yearStr && tx.month === monthStr);

    const classIncome = matchedTxs.filter((tx) => tx.transaction_type === 'Income').reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
    const classExpense = matchedTxs.filter((tx) => tx.transaction_type === 'Expense').reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
    const subReceipt = matchedTxs.filter((tx) => tx.payment_status === 'Completed' && tx.flow === 'inflow').reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
    const subPayment = matchedTxs.filter((tx) => tx.payment_status === 'Completed' && tx.flow === 'outflow').reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
    
    return { label, classIncome, classExpense, subReceipt, subPayment, total: classIncome + classExpense + subReceipt + subPayment };
  }).filter((t) => t.total > 0);

  const maxDashTimeVal = Math.max(...dashTimeData.map(t => Math.max(t.classIncome, t.classExpense)), 1);

  let dashTreasurerAdvice;
  if (transactions.length === 0) {
    dashTreasurerAdvice = t('advice_empty');
  } else if (dashNetBalance > 0) {
    dashTreasurerAdvice = t('advice_positive', {
      balance: dashNetBalance.toLocaleString(),
      ratio: dashEfficiencyRatio.toFixed(1)
    });
  } else if (dashNetBalance < 0) {
    dashTreasurerAdvice = t('advice_negative', {
      balance: Math.abs(dashNetBalance).toLocaleString()
    });
  } else {
    dashTreasurerAdvice = t('advice_neutral');
  }

  // Suggested Extra 1 - From Allocation (Fontes de Ouro)
  const uniqueFroms = Array.from(new Set(transactions.map(tx => tx.from).filter(Boolean)));
  const fromAllocation = uniqueFroms.map(fromName => {
    const amount = dashboardFilteredTransactions
      .filter(tx => tx.from === fromName && tx.transaction_type === 'Income')
      .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
    return { name: fromName, amount };
  }).filter(f => f.amount > 0).sort((a, b) => b.amount - a.amount);
  const maxFromAmount = Math.max(...fromAllocation.map(f => f.amount), 1);

  // Suggested Extra 2 - Top Entities (Maiores Comércios)
  const entityVolumes = engineData.entityData.slice(0, 5);
  const percentUsed = dashInflow > 0 ? ((entityVolumes.reduce((s, e) => s + e.totalClass, 0) / dashInflow) * 100) : 0;

  // Suggested Extra 3 - Entity Categories
  const uniqueEntityCats = Array.from(new Set(transactions.map(tx => tx.transaction_category).filter(Boolean)));
  const entityCatExpenses = uniqueEntityCats.map(catName => {
    const amount = transactions
      .filter(tx => tx.transaction_category === catName && tx.transaction_type === 'Expense')
      .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
    return { name: catName, amount };
  }).filter(c => c.amount > 0).sort((a, b) => b.amount - a.amount);
  const maxEntityCatExp = Math.max(...entityCatExpenses.map(c => c.amount), 1);

  // Payables & Receivables variables
  const pendingIncomeList = transactions.filter(tx => tx.transaction_type === 'Income' && tx.payment_status === 'Pending');
  const pendingExpenseList = transactions.filter(tx => tx.transaction_type === 'Expense' && tx.payment_status === 'Pending');

  const totalReceivables = pendingIncomeList.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
  const totalPayables = pendingExpenseList.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

  const totalPendingExpensesCount = pendingExpenseList.length;
  const totalOverdueExpensesCount = pendingExpenseList.filter(tx => tx.payment_status === 'Overdue').length;
  const overdueRate = totalPendingExpensesCount > 0 ? (totalOverdueExpensesCount / totalPendingExpensesCount) * 100 : 0;


  // Initialize auth state and listen for session transitions
  useEffect(() => {
    const unsubscribe = initAuth();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [initAuth]);

  // Global key listener to return to previous screen on Escape
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isNewTxModalOpen) {
          setIsNewTxModalOpen(false);
          setIsTreasuryMenuOpen(true);
        } else if (isMineModalOpen) {
          setIsMineModalOpen(false);
        } else if (activeTab === 'dashboard' || activeTab === 'transactions' || activeTab === 'financial_statement') {
          setActiveTab('quests');
          setIsTreasuryMenuOpen(true);
        } else if (activeTab !== 'quests') {
          setActiveTab('quests');
        }
      }
    };
    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [activeTab, isMineModalOpen, isNewTxModalOpen]);

  // Sincronizar estados locais do formulário quando as opções mudarem no store
  useEffect(() => {
    if (txFrom !== '' && fromOptions && !fromOptions.includes(txFrom)) {
      setTxFrom(fromOptions[0] || '');
    }
  }, [fromOptions, txFrom]);

  useEffect(() => {
    if (txStatus !== '' && statusOptions && !statusOptions.includes(txStatus)) {
      setTxStatus(statusOptions[0] || '');
    }
  }, [statusOptions, txStatus]);

  useEffect(() => {
    if (txClass !== '' && classOptions && !classOptions.includes(txClass)) {
      setTxClass(classOptions[0] || '');
    }
  }, [classOptions, txClass]);

  useEffect(() => {
    if (txSubClass !== '' && subClassOptions && !subClassOptions.includes(txSubClass)) {
      setTxSubClass(subClassOptions[0] || '');
    }
  }, [subClassOptions, txSubClass]);

  useEffect(() => {
    if (txEntity !== '' && entityOptions && !entityOptions.includes(txEntity)) {
      setTxEntity(entityOptions[0] || '');
    }
  }, [entityOptions, txEntity]);

  useEffect(() => {
    if (txCategory !== '' && categoryOptions && !categoryOptions.includes(txCategory)) {
      setTxCategory(categoryOptions[0] || '');
    }
  }, [categoryOptions, txCategory]);

  useEffect(() => {
    if (qaFrom !== '' && fromOptions && !fromOptions.includes(qaFrom)) {
      setQaFrom(fromOptions[0] || '');
    }
  }, [fromOptions, qaFrom]);

  useEffect(() => {
    if (qaStatus !== '' && statusOptions && !statusOptions.includes(qaStatus)) {
      setQaStatus(statusOptions[0] || '');
    }
  }, [statusOptions, qaStatus]);

  useEffect(() => {
    if (qaClass !== '' && classOptions && !classOptions.includes(qaClass)) {
      setQaClass(classOptions[0] || '');
    }
  }, [classOptions, qaClass]);

  useEffect(() => {
    if (qaSubClass !== '' && subClassOptions && !subClassOptions.includes(qaSubClass)) {
      setQaSubClass(subClassOptions[0] || '');
    }
  }, [subClassOptions, qaSubClass]);

  useEffect(() => {
    if (qaEntity !== '' && entityOptions && !entityOptions.includes(qaEntity)) {
      setQaEntity(entityOptions[0] || '');
    }
  }, [entityOptions, qaEntity]);





  const exportSettingsCSV = () => {
    handleExportSettingsCSV({
      fromOptions,
      statusOptions,
      templates
    }, getMatrixRows);
  };

  const importSettingsCSV = (e) => {
    handleImportSettingsCSV(e, { syncSettings });
  };

  const getMatrixRows = () => {
    const rows = [];
    const coveredEntities = new Set();
    const coveredCategories = new Set();
    const coveredSubtypes = new Set();

    entityOptions.forEach((entity) => {
      if (!entity || coveredEntities.has(entity)) return;
      const category = entityMappings[entity] || '';
      let subtype = '';
      for (const [sub, cats] of Object.entries(subtypeToCategoryMap)) {
        if (cats && cats.includes(category)) {
          subtype = sub;
          break;
        }
      }
      rows.push({
        key: `${subtype}:::${category}:::${entity}`,
        subtype,
        category,
        entity
      });
      coveredEntities.add(entity);
      if (category) coveredCategories.add(category);
      if (subtype) coveredSubtypes.add(subtype);
    });

    categoryOptions.forEach((category) => {
      if (!category || coveredCategories.has(category)) return;
      let subtype = '';
      for (const [sub, cats] of Object.entries(subtypeToCategoryMap)) {
        if (cats && cats.includes(category)) {
          subtype = sub;
          break;
        }
      }
      rows.push({
        key: `${subtype}:::${category}:::`,
        subtype,
        category,
        entity: ''
      });
      coveredCategories.add(category);
      if (subtype) coveredSubtypes.add(subtype);
    });

    subClassOptions.forEach((subtype) => {
      if (!subtype || coveredSubtypes.has(subtype)) return;
      rows.push({
        key: `${subtype}::::::`,
        subtype,
        category: '',
        entity: ''
      });
      coveredSubtypes.add(subtype);
    });

    return rows;
  };

  const handleSaveMatrix = (updatedRows) => {
    const newSubClassOptions = new Set();
    const newCategoryOptions = new Set();
    const newEntityOptions = new Set();
    const newEntityMappings = {};
    const newSubtypeToCategoryMap = {};

    const seen = new Set();
    const uniqueRows = [];
    updatedRows.forEach((row) => {
      const key = `${row.subtype || ''}:::${row.category || ''}:::${row.entity || ''}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueRows.push(row);
      }
    });

    uniqueRows.forEach((row) => {
      const sub = row.subtype ? row.subtype.trim() : '';
      const cat = row.category ? row.category.trim() : '';
      const ent = row.entity ? row.entity.trim() : '';

      if (sub) {
        newSubClassOptions.add(sub);
        if (!newSubtypeToCategoryMap[sub]) {
          newSubtypeToCategoryMap[sub] = [];
        }
      }

      if (cat) {
        newCategoryOptions.add(cat);
        if (sub) {
          if (!newSubtypeToCategoryMap[sub].includes(cat)) {
            newSubtypeToCategoryMap[sub].push(cat);
          }
        }
      }

      if (ent) {
        newEntityOptions.add(ent);
        if (cat) {
          newEntityMappings[ent] = cat;
        }
      }
    });

    const defaultSubclasses = ["Banks","Investments","Personal Debt","Other Debts","Living & Household","Utilities","Personal Transports","Public Transports","Health","Markets & Personal care","Payroll","Education","Entertainment","Food & Consumables","Tools & Materials","Clothing & Shoes","Insurances","Other Consumables","Taxes & State"];
    const deletedSubtypes = new Set();
    getMatrixRows().forEach(row => {
      if (!row.category && !row.entity && !uniqueRows.some(ur => ur.subtype === row.subtype)) {
        deletedSubtypes.add(row.subtype);
      }
    });

    subClassOptions.forEach(sub => {
      const isDefault = defaultSubclasses.includes(sub);
      const isDeleted = deletedSubtypes.has(sub);
      const hasRowsLeft = uniqueRows.some(row => row.subtype === sub);
      
      if (hasRowsLeft || (isDefault && !isDeleted)) {
        newSubClassOptions.add(sub);
        if (!newSubtypeToCategoryMap[sub]) {
          newSubtypeToCategoryMap[sub] = [];
        }
      }
    });

    syncSettings({
      subClassOptions: Array.from(newSubClassOptions),
      categoryOptions: Array.from(newCategoryOptions),
      entityOptions: Array.from(newEntityOptions),
      entityMappings: newEntityMappings,
      subtypeToCategoryMap: newSubtypeToCategoryMap
    });
    
    toast.success("Categories matrix updated successfully!");
  };

  const renderSettingsPanel = () => {
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
          onDelete={(val) => handleDeleteOption(val)}
          settingsFileInputRef={settingsFileInputRef}
          importSettingsCSV={importSettingsCSV}
          exportSettingsCSV={exportSettingsCSV}
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
                ) : (
                  selectedSettingType === 'quickAction' && (
                    <button
                      type="submit"
                      form="quick-action-form"
                      className="w-[28px] h-[28px] bg-[#8b4513] hover:bg-[#8b4513]/90 text-white rounded-lg hover:scale-[1.05] active:scale-95 transition-all shadow cursor-pointer flex items-center justify-center font-bold text-xs"
                      title={t('add', 'Add')}
                    >
                      ➕
                    </button>
                  )
                )}
                {selectedSettingType === 'allActions' && (
                  <div className="flex items-center gap-1.5 ml-1">
                    <button
                      type="button"
                      onClick={() => qaFileInputRef.current.click()}
                      className="px-2.5 h-[28px] bg-[#faf4e5]/90 border border-[#8b4513]/25 text-[#4b2c20] font-black text-[9px] uppercase tracking-wider rounded-lg shadow-sm hover:bg-[#8b4513]/10 active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                      title="Import All Actions CSV"
                    >
                      <span>📥</span> Import
                    </button>
                    <input
                      type="file"
                      ref={qaFileInputRef}
                      onChange={importQuickActionsCSV}
                      accept=".csv"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => handleExportAllActionsCSV(templates, t)}
                      className="px-2.5 h-[28px] bg-[#faf4e5]/90 border border-[#8b4513]/25 text-[#4b2c20] font-black text-[9px] uppercase tracking-wider rounded-lg shadow-sm hover:bg-[#8b4513]/10 active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                      title="Export All Actions to CSV"
                    >
                      <span>📤</span> Export
                    </button>
                  </div>
                )}
              </div>

              {selectedSettingType === 'quickAction' && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => qaFileInputRef.current.click()}
                    className="px-2 h-[28px] bg-[#faf4e5]/90 border border-[#8b4513]/25 text-[#4b2c20] font-black text-[9px] uppercase tracking-wider rounded-lg shadow-sm hover:bg-[#8b4513]/10 active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                    title={typeof t === 'function' ? t('import_csv', 'Import CSV') : (t.import_csv || "Import CSV")}
                  >
                    <span>📥</span> Import
                  </button>
                  <input
                    type="file"
                    ref={qaFileInputRef}
                    onChange={importQuickActionsCSV}
                    accept=".csv"
                    className="hidden"
                  />
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
              )}
            </div>
          )}
        </div>

        {selectedSettingType === 'quickAction' ? (
          <ManageQuickActionsPanel
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
            templates={templates}
            selectedQaTemplateName={selectedQaTemplateName}
            setSelectedQaTemplateName={setSelectedQaTemplateName}
            setSelectedQaNames={setSelectedQaNames}
            onSubmit={handleAddOptionSubmit}
          />
        ) : (
          <>
            {selectedSettingType !== 'allActions' && selectedSettingType !== 'class' && (
              <form onSubmit={handleAddOptionSubmit} className="bg-[#faf4e5]/40 border border-[#8b4513]/15 rounded-xl p-3.5 mb-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">
                      {t.new_value}
                    </label>
                    <input
                      type="text"
                      value={newOptionVal}
                      onChange={(e) => setNewOptionVal(e.target.value)}
                      placeholder={t('placeholder.item')}
                      required
                      className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg h-[34px] px-3 text-xs font-bold text-[#4b2c20] placeholder-[#5d4037]/45 focus:outline-none focus:border-[#8b4513]/50"
                    />
                  </div>

                  {showEntityCategorySelector && (
                    <div>
                      <label className="block text-[9px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">
                        {t.default_category}
                      </label>
                      <select
                        value={newEntityCatVal}
                        onChange={(e) => setNewEntityCatVal(e.target.value)}
                        className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg h-[34px] px-2 text-xs font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50"
                      >
                        {categoryOptions.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className={`${!showEntityCategorySelector ? 'sm:col-span-2' : ''} flex justify-end`}>
                    <button
                      type="submit"
                      className="px-3 h-[28px] bg-[#8b4513] text-white font-black text-[9px] uppercase tracking-wider rounded-lg hover:scale-[1.02] active:scale-98 transition-all shadow border border-[#d4af37]/20 cursor-pointer flex items-center justify-center"
                    >
                      ➕ {t.add}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Filter Dropdowns for All Actions */}
            {selectedSettingType === 'allActions' && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 p-3 bg-[#faf4e5]/40 border border-[#8b4513]/15 rounded-xl">
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">
                    Type
                  </label>
                  <select
                    value={filterActionType}
                    onChange={(e) => {
                      setFilterActionType(e.target.value);
                      setActionsCurrentPage(1);
                      setFilterActionSubtype('');
                      setFilterActionCategory('');
                      setFilterActionEntity('');
                    }}
                    className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg h-[28px] px-2 text-[10px] font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50"
                  >
                    <option value="">All Types</option>
                    {classOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">
                    Subtype
                  </label>
                  <select
                    value={filterActionSubtype}
                    onChange={(e) => {
                      setFilterActionSubtype(e.target.value);
                      setActionsCurrentPage(1);
                      setFilterActionCategory('');
                      setFilterActionEntity('');
                    }}
                    className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg h-[28px] px-2 text-[10px] font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50"
                  >
                    <option value="">All Subtypes</option>
                    {dynamicSubtypes.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">
                    Category
                  </label>
                  <select
                    value={filterActionCategory}
                    onChange={(e) => {
                      setFilterActionCategory(e.target.value);
                      setActionsCurrentPage(1);
                      setFilterActionEntity('');
                    }}
                    className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg h-[28px] px-2 text-[10px] font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50"
                  >
                    <option value="">All Categories</option>
                    {dynamicCategories.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">
                    Entity
                  </label>
                  <select
                    value={filterActionEntity}
                    onChange={(e) => {
                      setFilterActionEntity(e.target.value);
                      setActionsCurrentPage(1);
                    }}
                    className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg h-[28px] px-2 text-[10px] font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50"
                  >
                    <option value="">All Entities</option>
                    {dynamicEntities.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* List of items */}
            <div className="flex-1 overflow-y-auto border border-[#8b4513]/20 rounded-xl bg-[#faf4e5]/20 custom-scrollbar">
              {currentList.length > 0 ? (
                selectedSettingType === 'allActions' ? (
              <div className="flex flex-col h-full overflow-hidden">
                <div className="flex-1 overflow-y-auto">
                  {(() => {
                    let sortedList = [...currentList];
                    if (actionsSortField) {
                      sortedList.sort((a, b) => {
                        let valA = '';
                        let valB = '';
                        if (actionsSortField === 'name') {
                          valA = t(`tpl_${a.name.toLowerCase().replace(/\s+/g, '_')}`, a.name).toLowerCase();
                          valB = t(`tpl_${b.name.toLowerCase().replace(/\s+/g, '_')}`, b.name).toLowerCase();
                        } else if (actionsSortField === 'type') {
                          valA = `${a.data.transaction_type || ''} • ${a.data.transaction_subtype || ''}`.toLowerCase();
                          valB = `${b.data.transaction_type || ''} • ${b.data.transaction_subtype || ''}`.toLowerCase();
                        } else if (actionsSortField === 'entity') {
                          valA = (a.data.entity || '').toLowerCase();
                          valB = (b.data.entity || '').toLowerCase();
                        }
 
                        if (valA < valB) return actionsSortDirection === 'asc' ? -1 : 1;
                        if (valA > valB) return actionsSortDirection === 'asc' ? 1 : -1;
                        return 0;
                      });
                    }
 
                    const itemsPerPage = 10;
                    const totalPages = Math.ceil(sortedList.length / itemsPerPage) || 1;
                    const safeCurrentPage = Math.min(Math.max(actionsCurrentPage, 1), totalPages);
                    const paginatedList = sortedList.slice((safeCurrentPage - 1) * itemsPerPage, safeCurrentPage * itemsPerPage);

                    return (
                      <table className="w-full text-left border-collapse text-[9.5px] font-sans">
                        <thead className="sticky top-0 bg-[#faf4e5] z-10 border-b border-[#8b4513]/25 shadow-sm">
                          <tr className="text-[#4b2c20] font-black uppercase tracking-wider title-font">
                            <th className="py-1.5 px-2 w-8 text-center">
                              <input
                                type="checkbox"
                                checked={paginatedList.length > 0 && paginatedList.every(tpl => selectedQaNames.includes(tpl.name))}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedQaNames(prev => Array.from(new Set([...prev, ...paginatedList.map(tpl => tpl.name)])));
                                  } else {
                                    setSelectedQaNames(prev => prev.filter(name => !paginatedList.some(tpl => tpl.name === name)));
                                  }
                                }}
                                className="cursor-pointer rounded border-[#8b4513]/30 text-[#8b4513] focus:ring-[#8b4513]"
                              />
                            </th>
                            <th
                              className="py-1.5 px-2 cursor-pointer hover:bg-[#8b4513]/20 select-none"
                              onClick={() => {
                                if (actionsSortField === 'name') {
                                  setActionsSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                                } else {
                                  setActionsSortField('name');
                                  setActionsSortDirection('asc');
                                }
                              }}
                            >
                              Action {actionsSortField === 'name' ? (actionsSortDirection === 'asc' ? '▲' : '▼') : ''}
                            </th>
                            <th
                              className="py-1.5 px-2 cursor-pointer hover:bg-[#8b4513]/20 select-none"
                              onClick={() => {
                                if (actionsSortField === 'type') {
                                  setActionsSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                                } else {
                                  setActionsSortField('type');
                                  setActionsSortDirection('asc');
                                }
                              }}
                            >
                              Type/Subtype {actionsSortField === 'type' ? (actionsSortDirection === 'asc' ? '▲' : '▼') : ''}
                            </th>
                            <th
                              className="py-1.5 px-2 cursor-pointer hover:bg-[#8b4513]/20 select-none"
                              onClick={() => {
                                if (actionsSortField === 'entity') {
                                  setActionsSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                                } else {
                                  setActionsSortField('entity');
                                  setActionsSortDirection('asc');
                                }
                              }}
                            >
                              Entity {actionsSortField === 'entity' ? (actionsSortDirection === 'asc' ? '▲' : '▼') : ''}
                            </th>
                            <th className="py-1.5 px-2 text-right">Edit</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#8b4513]/10 text-stone-700 font-bold">
                          {paginatedList.map((tpl) => {
                            const isChecked = selectedQaNames.includes(tpl.name);
                            return (
                              <tr key={tpl.name} className={`hover:bg-[#8b4513]/5 transition-colors ${isChecked ? 'bg-[#8b4513]/10' : ''}`}>
                                <td className="py-1 px-2 text-center">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => {
                                      let updated;
                                      if (e.target.checked) {
                                        updated = [...selectedQaNames, tpl.name];
                                      } else {
                                        updated = selectedQaNames.filter(n => n !== tpl.name);
                                      }
                                      setSelectedQaNames(updated);
                                    }}
                                    className="cursor-pointer rounded border-[#8b4513]/30 text-[#8b4513] focus:ring-[#8b4513]"
                                  />
                                </td>
                                <td className="py-1 px-2 font-bold text-[#4b2c20] text-[9.5px]">
                                  {t(`tpl_${tpl.name.toLowerCase().replace(/\s+/g, '_')}`, tpl.name)}
                                </td>
                                <td className="py-1 px-2 text-stone-500 font-medium text-[9px]">
                                  {tpl.data.transaction_type} • {tpl.data.transaction_subtype}
                                </td>
                                <td className="py-1 px-2 text-stone-500 font-medium text-[9px]">{tpl.data.entity}</td>
                                <td className="py-1 px-2 text-right">
                                  <button
                                    type="button"
                                    onClick={() => {
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
                                    }}
                                    className="text-blue-700 hover:text-blue-900 font-bold px-1.5 py-0.5 rounded border border-transparent hover:border-blue-200 hover:bg-blue-50 transition-all cursor-pointer text-[10px]"
                                    title="Edit Quick Action"
                                  >
                                    ✏️
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot className="sticky bottom-0 bg-[#faf4e5] z-10 border-t border-[#8b4513]/25 shadow-sm">
                          <tr>
                            <td colSpan={5} className="py-1.5 px-3">
                              <div className="flex flex-wrap items-center justify-between gap-2 text-[#4b2c20] text-[9.5px] font-black uppercase font-sans">
                                <div>
                                  Page {safeCurrentPage} of {totalPages} ({sortedList.length} total)
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    disabled={safeCurrentPage === 1}
                                    onClick={() => setActionsCurrentPage(safeCurrentPage - 1)}
                                    className="px-2 py-0.5 bg-[#8b4513] text-white rounded disabled:opacity-40 hover:scale-105 active:scale-95 transition-all cursor-pointer font-bold text-[9px] uppercase tracking-wider"
                                  >
                                    ◀ Prev
                                  </button>
                                  <button
                                    type="button"
                                    disabled={safeCurrentPage === totalPages}
                                    onClick={() => setActionsCurrentPage(safeCurrentPage + 1)}
                                    className="px-2 py-0.5 bg-[#8b4513] text-white rounded disabled:opacity-40 hover:scale-105 active:scale-95 transition-all cursor-pointer font-bold text-[9px] uppercase tracking-wider"
                                  >
                                    Next ▶
                                  </button>
                                  <div className="flex items-center gap-1 ml-2">
                                    <span>Go to:</span>
                                    <input
                                      type="number"
                                      min={1}
                                      max={totalPages}
                                      value={manualPageInput}
                                      onChange={(e) => {
                                        setManualPageInput(e.target.value);
                                        const p = parseInt(e.target.value, 10);
                                        if (p >= 1 && p <= totalPages) {
                                          setActionsCurrentPage(p);
                                        }
                                      }}
                                      className="w-10 px-1 py-0.5 bg-white border border-[#8b4513]/30 rounded text-center text-[10px] font-bold text-[#4b2c20] focus:outline-none focus:ring-1 focus:ring-[#8b4513]"
                                    />
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    );
                  })()}
                </div>
              </div>
            ) : (
              (() => {
                const sortedCurrentList = [...currentList].sort((a, b) => {
                  return settingsSortDirection === 'asc' ? a.localeCompare(b) : b.localeCompare(a);
                });
                return (
                  <table className="w-full text-left border-collapse text-[10px] font-sans">
                    <thead>
                      <tr className="bg-[#8b4513]/10 border-b border-[#8b4513]/20 text-[#4b2c20] font-black uppercase tracking-wider title-font">
                        <th 
                          className="py-2 px-3 cursor-pointer hover:bg-[#8b4513]/20 select-none"
                          onClick={() => setSettingsSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
                        >
                          {t.value} {settingsSortDirection === 'asc' ? '▲' : '▼'}
                        </th>
                        {selectedSettingType === 'entity' && <th className="py-2 px-3">{t.default_category}</th>}
                        <th className="py-2 px-3 text-right">{t.actions}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#8b4513]/10 text-stone-700 font-bold">
                      {sortedCurrentList.map((val) => (
                        <tr key={val} className="hover:bg-[#8b4513]/5 transition-colors">
                          <td className="py-2 px-3 font-bold text-[#4b2c20]">{val}</td>
                          {selectedSettingType === 'entity' && (
                            <td className="py-2 px-3 text-stone-500 font-medium">{entityMappings[val] || '-'}</td>
                          )}
                          <td className="py-2 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleDeleteOption(val)}
                              className="text-red-700 hover:text-red-900 font-black px-2 py-0.5 rounded border border-transparent hover:border-red-200 hover:bg-red-50 transition-all cursor-pointer"
                              title={t.eliminate}
                            >
                              ❌ {t.eliminate}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                );
              })()
            )
          ) : (
            <p className="text-center py-8 text-xs text-[#5d4037]/60 italic font-serif">
              {t.no_options_registered}
            </p>
          )}
        </div>
      </>
    )}
  </div>
    );
  };



  const handleMineClick = () => {
    resetFormState();
    setIsMineModalOpen(true);
  };

  const handleNewTxClick = () => {
    resetFormState();
    setIsNewTxModalOpen(true);
  };

  const handleTreasuryClick = () => {
    setIsTreasuryMenuOpen(true);
  };

  const handleTabChange = (tabId) => {
    setIsTreasuryMenuOpen(false);
    setIsNewTxModalOpen(false);
    setIsMineModalOpen(false);
    setIsQuestsModalOpen(false);

    if (tabId === 'dashboard') {
      setActiveTab('quests');
      setIsTreasuryMenuOpen(true);
    } else if (tabId === 'quests') {
      setActiveTab('quests');
      setIsQuestsModalOpen(true);
    } else {
      setActiveTab(tabId);
    }
  };

  const exportCSV = () => handleExportCSV(transactions, t);
  const importCSV = (e) => handleImportCSV(e, { t, fromOptions, registerTransactions, GUEST_PROFILE_ID });
  const importQuickActionsCSV = (e) => handleImportQuickActionsCSV(e, { t, addOption, templates });





  if (!user) {
    return (
      <div className="w-screen h-screen overflow-hidden select-none bg-black flex items-center justify-center">
        <Toaster 
          position="top-center" 
          toastOptions={{
            style: {
              background: '#f4e4bc',
              color: '#4b2c20',
              borderColor: '#8b4513',
              borderWidth: '2px'
            },
            success: {
              iconTheme: { primary: '#059669', secondary: '#f4e4bc' },
            },
            error: {
              iconTheme: { primary: '#dc2626', secondary: '#f4e4bc' },
            },
          }}
        />
        <Login />
      </div>
    );
  }

  return (
    <div className="w-screen h-screen overflow-hidden select-none bg-black flex items-center justify-center">
      <Toaster 
        position="top-center" 
        toastOptions={{
          style: {
            background: '#f4e4bc',
            color: '#4b2c20',
            borderColor: '#8b4513',
            borderWidth: '2px'
          },
          success: {
            iconTheme: { primary: '#059669', secondary: '#f4e4bc' },
          },
          error: {
            iconTheme: { primary: '#dc2626', secondary: '#f4e4bc' },
          },
        }}
      />
      <div className={`game-viewport ${SAFE_AREAS.TOP_CLEARANCE}`}>
        {/* HUD Superior */}
        {activeTab === 'quests' && !isMineModalOpen && !isNewTxModalOpen && (
          <HUD profile={profile} diamonds={gems} />
        )}

        {/* Mapa Isométrico */}
        <div className={`absolute inset-0 flex flex-col items-center justify-center transition-all ${activeTab === 'settings' ? 'blur-sm pointer-events-none' : ''}`}>
          {/* Background Map */}
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${bgMap})` }}
          />
          
          <IsometricMap onMineClick={handleMineClick} onTreasuryClick={handleTreasuryClick} />
        </div>

        {/* Settings View */}
        {activeTab === 'settings' && (
          <div 
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setActiveTab('quests');
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
                onClick={() => setActiveTab('quests')}
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
        )}
        <EditQuickActionModal
          isOpen={isEditingQa}
          onClose={() => setIsEditingQa(false)}
          onSave={handleSaveQuickAction}
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
        />

        {/* Navegação Inferior (Estática) */}
        <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />

        {/* Modal das Quests (Vazio) */}
        <Modal
          isOpen={isQuestsModalOpen}
          onClose={() => setIsQuestsModalOpen(false)}
          title={t('quests_modal_title', 'Quests')}
          {...STANDARD_MODAL_PROPS}
        >
          <div className="text-center py-8 text-[#5d4037]/60 italic font-serif">
            {t('quests_empty_msg', 'No quests registered at this time.')}
          </div>
        </Modal>

        {/* Modal do Menu da Tesouraria Real */}
        <Modal
          isOpen={isTreasuryMenuOpen}
          onClose={() => setIsTreasuryMenuOpen(false)}
          title={t('treasury_menu_title', 'Royal Treasury Menu')}
          size="max-w-lg"
        >
          <div className="flex flex-col gap-3.5 max-w-md mx-auto w-full">
            {/* Treasury Dashboard (Middle - Merged Option) */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('dashboard');
                setDashSubTab('overview');
                setIsTreasuryMenuOpen(false);
              }}
              className="group relative flex items-center gap-3.5 p-3 rounded-xl border-2 border-[#8b4513]/30 bg-[#faf4e5]/80 hover:bg-[#8b4513] text-[#4b2c20] hover:text-[#ffd700] hover:border-[#ffd700]/50 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm text-left cursor-pointer"
            >
              <div className="w-10 h-10 rounded-lg bg-[#8b4513]/10 group-hover:bg-white/10 flex items-center justify-center text-xl border border-[#8b4513]/25 group-hover:border-white/20 flex-shrink-0">
                📊
              </div>
              <div className="flex-grow min-w-0">
                <h3 className="font-serif font-black text-xs uppercase tracking-wide leading-tight">
                  {t('menu_treasury_dashboard', 'Treasury Dashboard')}
                </h3>
                <p className="text-[9px] opacity-80 font-serif italic mt-0.5 leading-tight">
                  {t('menu_treasury_dashboard_desc', 'General view of cash balances, category distribution, commercial accounts, and liabilities.')}
                </p>
              </div>
            </button>

            {/* General Ledger (Bottom) */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('transactions');
                setIsTreasuryMenuOpen(false);
              }}
              className="group relative flex items-center gap-3.5 p-3 rounded-xl border-2 border-[#8b4513]/30 bg-[#faf4e5]/80 hover:bg-[#8b4513] text-[#4b2c20] hover:text-[#ffd700] hover:border-[#ffd700]/50 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm text-left cursor-pointer"
            >
              <div className="w-10 h-10 rounded-lg bg-[#8b4513]/10 group-hover:bg-white/10 flex items-center justify-center text-xl border border-[#8b4513]/25 group-hover:border-white/20 flex-shrink-0">
                📖
              </div>
              <div className="flex-grow min-w-0">
                <h3 className="font-serif font-black text-xs uppercase tracking-wide leading-tight">
                  {t('menu_general_ledger', 'General Ledger')}
                </h3>
                <p className="text-[9px] opacity-80 font-serif italic mt-0.5 leading-tight">
                  {t('menu_general_ledger_desc', 'Register gold coins movements, manage status, category, entity, and view entire book history.')}
                </p>
              </div>
            </button>

            {/* Financial Statements (After General Ledger) */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('financial_statement');
                setIsTreasuryMenuOpen(false);
              }}
              className="group relative flex items-center gap-3.5 p-3 rounded-xl border-2 border-[#8b4513]/30 bg-[#faf4e5]/80 hover:bg-[#8b4513] text-[#4b2c20] hover:text-[#ffd700] hover:border-[#ffd700]/50 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm text-left cursor-pointer"
            >
              <div className="w-10 h-10 rounded-lg bg-[#8b4513]/10 group-hover:bg-white/10 flex items-center justify-center text-xl border border-[#8b4513]/25 group-hover:border-white/20 flex-shrink-0">
                📜
              </div>
              <div className="flex-grow min-w-0">
                <div className="flex justify-between items-center gap-2 w-full">
                  <h3 className="font-serif font-black text-xs uppercase tracking-wide leading-tight">
                    {t('menu_financial_statements', 'Financial Statements')}
                  </h3>
                  <span className="text-[8px] font-black uppercase tracking-wider text-rose-700 bg-rose-100 group-hover:text-[#ffd700] group-hover:bg-rose-900 border border-rose-200 group-hover:border-rose-800 px-1.5 py-0.5 rounded font-sans scale-90 origin-right flex-shrink-0">
                    {t('menu_primary', 'Primary')}
                  </span>
                </div>
                <p className="text-[9px] opacity-80 font-serif italic mt-0.5 leading-tight">
                  {t('menu_financial_statements_desc', 'Consolidated financial reports including Balance Sheet, Profit & Loss, and Cash Flow.')}
                </p>
              </div>
            </button>

            {/* Vault Transfer (New) */}
            <button
              type="button"
              onClick={() => {
                setIsTreasuryModalOpen(true);
                setIsTreasuryMenuOpen(false);
              }}
              className="group relative flex items-center gap-3.5 p-3 rounded-xl border-2 border-[#8b4513]/30 bg-[#faf4e5]/80 hover:bg-[#8b4513] text-[#4b2c20] hover:text-[#ffd700] hover:border-[#ffd700]/50 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm text-left cursor-pointer"
            >
              <div className="w-10 h-10 rounded-lg bg-[#8b4513]/10 group-hover:bg-white/10 flex items-center justify-center text-xl border border-[#8b4513]/25 group-hover:border-white/20 flex-shrink-0">
                🔒
              </div>
              <div className="flex-grow min-w-0">
                <h3 className="font-serif font-black text-xs uppercase tracking-wide leading-tight">
                  {t('menu_vault_transfer', 'Royal Vault Transfer')}
                </h3>
                <p className="text-[9px] opacity-80 font-serif italic mt-0.5 leading-tight">
                  {t('menu_vault_transfer_desc', 'Deposit or withdraw gold coins into the Royal Treasury Vault (accounts 10101001 and 10101002).')}
                </p>
              </div>
            </button>
          </div>
        </Modal>

        {/* Modal da Mina de Ouro (Ledger de Transações - Widescreen Layout) */}
        <Modal
          isOpen={isMineModalOpen}
          onClose={() => setIsMineModalOpen(false)}
          title={t.ledger_transactions}
          {...STANDARD_MODAL_PROPS}
        >
          <div className="space-y-6 h-full overflow-y-auto custom-scrollbar-subtle pr-1">
            {/* Gold Mine Passive Generation controls */}
            <div className="bg-[#faf4e5] border-2 border-[#8b4513]/30 rounded-xl p-4 shadow-inner space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">⛏️</div>
                  <div>
                    <h4 className="font-serif font-black text-sm text-[#4b2c20] uppercase tracking-wider">
                      {t('gold_mine', 'Gold Mine')} (Lvl {mineLevel})
                    </h4>
                    <p className="text-[10px] text-[#5d4037]/80 font-bold uppercase tracking-wide">
                      {t('production_rate', 'Rate')}: {(mineLevel * 0.1).toFixed(2)} Gold/Sec
                    </p>
                  </div>
                </div>
                <div className="bg-[#8b4513]/5 border border-[#8b4513]/20 rounded-lg px-3 py-2 text-right w-full sm:w-auto">
                  <span className="block text-[8px] font-black uppercase tracking-wider text-[#5d4037]/60">
                    {t('uncollected_gold', 'Uncollected Gold')}
                  </span>
                  <span className="font-mono text-lg font-black text-[#8b4513] animate-pulse">
                    🪙 {uncollectedGold}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#8b4513]/10">
                <button
                  type="button"
                  onClick={async () => {
                    const claimed = await collectPassiveGold();
                    if (claimed > 0) {
                      await fetchKingdomData(user?.id);
                    }
                  }}
                  disabled={isLoading || uncollectedGold <= 0}
                  className="w-full py-2.5 bg-[#8b4513] hover:bg-[#a0522d] disabled:bg-[#8b4513]/40 text-white font-serif font-black text-xs uppercase tracking-widest rounded-lg border border-[#d4af37]/30 transition-all hover:scale-[1.01] active:scale-99 shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                >
                  📥 {t('collect_gold', 'Collect Gold')}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await upgradeMine();
                  }}
                  disabled={isLoading || gold < 100 * mineLevel || gems < 5 * mineLevel}
                  className="w-full py-2.5 bg-[#d4af37]/20 hover:bg-[#d4af37]/35 disabled:bg-gray-200/50 border border-[#8b4513]/30 text-[#4b2c20] font-serif font-black text-xs uppercase tracking-widest rounded-lg transition-all hover:scale-[1.01] active:scale-99 shadow-sm flex flex-col items-center justify-center cursor-pointer disabled:cursor-not-allowed"
                >
                  <span className="flex items-center gap-1 font-bold">
                    ⚡ {t('upgrade_mine', 'Upgrade Mine')}
                  </span>
                  <span className="text-[9px] font-bold text-[#5d4037]/90 font-sans mt-0.5 normal-case">
                    Cost: 🪙 {100 * mineLevel} | 💎 {5 * mineLevel}
                  </span>
                </button>
              </div>
            </div>

            {/* Form Title & Icon */}
            <div className="flex items-center gap-4 border-b border-[#8b4513]/20 pb-4">
              <div className="w-12 h-12 bg-[#8b4513]/10 rounded-full flex items-center justify-center border-2 border-[#8b4513]/20 text-2xl">
                📜
              </div>
              <div>
                <h3 className="title-font text-lg font-black text-[#4b2c20] uppercase">{t.register_movement}</h3>
                <p className="text-[10px] text-[#5d4037]/75 font-bold uppercase tracking-wider">{t.gold_mine_commerce}</p>
              </div>
            </div>

            {/* Form in columns */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Row 1 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                {/* From */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">
                    {t.origin_from}
                  </label>
                  <select
                    value={txFrom}
                    onChange={(e) => setTxFrom(e.target.value)}
                    className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg h-11 md:h-[38px] px-2 text-xs font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50"
                  >
                    {fromOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                {/* Value Date */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">
                    {t.value_date}
                  </label>
                  <input
                    type="date"
                    value={txValueDate}
                    onChange={(e) => setTxValueDate(e.target.value)}
                    required
                    className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg h-11 md:h-[38px] px-3 text-xs font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50"
                  />
                </div>

                {/* Posting Date */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">
                    {t.posting_date}
                  </label>
                  <input
                    type="date"
                    value={txPostingDate}
                    onChange={(e) => setTxPostingDate(e.target.value)}
                    required
                    className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg h-11 md:h-[38px] px-3 text-xs font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50"
                  />
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">
                    {t.amount_gold}
                  </label>
                  <input
                    type="number"
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value)}
                    placeholder={t('placeholder.amount')}
                    required
                    min="1"
                    className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg h-11 md:h-[38px] px-3 text-xs font-bold text-[#4b2c20] placeholder-[#5d4037]/45 focus:outline-none focus:border-[#8b4513]/50"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">
                    {t.status}
                  </label>
                  <select
                    value={txStatus}
                    onChange={(e) => setTxStatus(e.target.value)}
                    className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg h-11 md:h-[38px] px-2 text-xs font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50"
                  >
                    {statusOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                {/* Class */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">
                    {t.class}
                  </label>
                  <select
                    value={txClass}
                    onChange={(e) => setTxClass(e.target.value)}
                    className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg h-11 md:h-[38px] px-2 text-xs font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50"
                  >
                    {classOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                {/* Subcategory */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">
                    {t.sub_class}
                  </label>
                  <select
                    value={txSubClass}
                    onChange={(e) => setTxSubClass(e.target.value)}
                    className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg h-11 md:h-[38px] px-2 text-xs font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50"
                  >
                    {subClassOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                {/* Entity */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">
                    {t.entity}
                  </label>
                  <select
                    value={txEntity}
                    onChange={(e) => handleEntityChange(e.target.value)}
                    className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg h-11 md:h-[38px] px-2 text-xs font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50 font-sans"
                  >
                    {Object.entries(
                      entityOptions.reduce((acc, opt) => {
                        const cat = entityMappings[opt] || 'Uncategorized';
                        if (!acc[cat]) acc[acc.category || cat] = [];
                        acc[cat].push(opt);
                        return acc;
                      }, {})
                    ).map(([cat, opts]) => (
                      <optgroup key={cat} label={cat} className="font-bold text-[#8b4513]">
                        {opts.map((opt) => (
                          <option key={opt} value={opt} className="font-normal text-[#4b2c20]">{opt}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                {/* Description / Notes */}
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">
                    {t.description}
                  </label>
                  <input
                    type="text"
                    value={txDescription}
                    onChange={(e) => setTxDescription(e.target.value)}
                    placeholder={t('placeholder.notes')}
                    className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg h-11 md:h-[38px] px-3 text-xs font-bold text-[#4b2c20] placeholder-[#5d4037]/45 focus:outline-none focus:border-[#8b4513]/50"
                  />
                </div>
              </div>

              {/* Row 3: Account & Flow Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 mt-2">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">
                    Target Account (CoA)
                  </label>
                  <input
                    type="text"
                    value={txTargetAccount}
                    onChange={(e) => setTxTargetAccount(e.target.value)}
                    required
                    placeholder="e.g. 621001"
                    className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg h-11 md:h-[38px] px-3 text-xs font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">
                    Source/Dest Bank (CoA)
                  </label>
                  <input
                    type="text"
                    value={txSourceDestBank}
                    onChange={(e) => setTxSourceDestBank(e.target.value)}
                    placeholder="e.g. 10101001"
                    className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg h-11 md:h-[38px] px-3 text-xs font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">
                    Flow
                  </label>
                  <select
                    value={txFlow}
                    onChange={(e) => setTxFlow(e.target.value)}
                    className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg h-11 md:h-[38px] px-2 text-xs font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50"
                  >
                    <option value="inflow">Inflow</option>
                    <option value="outflow">Outflow</option>
                    <option value="neutral">Neutral</option>
                  </select>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-[#8b4513] text-white font-black text-xs uppercase tracking-widest rounded-xl hover:scale-[1.01] active:scale-99 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md border-2 border-[#d4af37]/30"
              >
                {isLoading ? `${t.register_movement}...` : t.save_transaction}
              </button>
            </form>
          </div>
        </Modal>

        {/* Modal da Tesouraria Real (Vault Transfer & Financial Summary) */}
        <Modal
          isOpen={isTreasuryModalOpen}
          onClose={() => {
            setIsTreasuryModalOpen(false);
            setIsTreasuryMenuOpen(true);
          }}
          title={t('royal_treasury', 'Royal Treasury')}
          {...STANDARD_MODAL_PROPS}
        >
          <div className="space-y-6 h-full overflow-y-auto custom-scrollbar-subtle pr-1">
            {/* Financial Summary */}
            <div className="bg-[#faf4e5] border-2 border-[#8b4513]/30 rounded-xl p-4 shadow-inner space-y-4">
              <h4 className="font-serif font-black text-sm text-[#4b2c20] uppercase tracking-wider border-b border-[#8b4513]/10 pb-2">
                🏛️ {t('treasury_summary', 'Treasury Summary')}
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5">
                  <span className="block text-[8px] font-black uppercase tracking-wider text-emerald-800">
                    {t('total_assets', 'Total Assets')}
                  </span>
                  <span className="font-mono text-sm font-black text-emerald-900">
                    {engineData.balanceSheet?.assets?.formattedTotal || '0 / g'}
                  </span>
                </div>
                <div className="bg-rose-50 border border-rose-200 rounded-lg p-2.5">
                  <span className="block text-[8px] font-black uppercase tracking-wider text-rose-800">
                    {t('total_liabilities', 'Total Liabilities')}
                  </span>
                  <span className="font-mono text-sm font-black text-rose-900">
                    {engineData.balanceSheet?.liabilities?.formattedTotal || '0 / g'}
                  </span>
                </div>
                <div className="bg-amber-50 border border-[#b8860b]/20 rounded-lg p-2.5 col-span-2 sm:col-span-1">
                  <span className="block text-[8px] font-black uppercase tracking-wider text-[#4b2c20]/80">
                    {t('net_worth', 'Net Worth')}
                  </span>
                  <span className="font-mono text-sm font-black text-[#8b4513]">
                    {engineData.balanceSheet?.equity?.formattedTotal || '0 / g'}
                  </span>
                </div>
              </div>

              {/* Vault Balances */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="bg-[#8b4513]/5 border border-[#8b4513]/15 rounded-lg px-3 py-2">
                  <span className="block text-[8px] font-black uppercase tracking-wider text-[#5d4037]/70">
                    Purse / Cash (10101001)
                  </span>
                  <span className="font-mono text-sm font-black text-[#4b2c20]">
                    🪙 {engineData.balanceSheet?.assets?.list?.find(a => a.code === '10101001')?.balance || 0}
                  </span>
                </div>
                <div className="bg-[#d4af37]/5 border border-[#d4af37]/25 rounded-lg px-3 py-2">
                  <span className="block text-[8px] font-black uppercase tracking-wider text-[#5d4037]/70">
                    Royal Vault (10101002)
                  </span>
                  <span className="font-mono text-sm font-black text-[#8b4513]">
                    👑 🪙 {engineData.balanceSheet?.assets?.list?.find(a => a.code === '10101002')?.balance || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Vault Transfer Form */}
            <div className="bg-[#faf4e5] border-2 border-[#8b4513]/30 rounded-xl p-4 shadow-inner space-y-4">
              <h4 className="font-serif font-black text-sm text-[#4b2c20] uppercase tracking-wider border-b border-[#8b4513]/10 pb-2">
                🛡️ {t('vault_transfer', 'Vault Transfer')}
              </h4>
              <form onSubmit={handleVaultTransferSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Direction */}
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">
                      {t('transfer_type', 'Transfer Type')}
                    </label>
                    <select
                      value={vaultTransferType}
                      onChange={(e) => setVaultTransferType(e.target.value)}
                      className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg h-[38px] px-2 text-xs font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50"
                    >
                      <option value="deposit">{t('vault_deposit', 'Deposit to Vault (10101001 → 10101002)')}</option>
                      <option value="withdraw">{t('vault_withdraw', 'Withdraw from Vault (10101002 → 10101001)')}</option>
                    </select>
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">
                      {t('amount_gold', 'Gold Amount')}
                    </label>
                    <input
                      type="number"
                      value={vaultAmount}
                      onChange={(e) => setVaultAmount(e.target.value)}
                      min="1"
                      required
                      placeholder="e.g. 500"
                      className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg h-[38px] px-3 text-xs font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">
                    {t('description', 'Description')}
                  </label>
                  <input
                    type="text"
                    value={vaultDescription}
                    onChange={(e) => setVaultDescription(e.target.value)}
                    required
                    className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg h-[38px] px-3 text-xs font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50"
                  />
                </div>

                {/* Action button */}
                <button
                  type="submit"
                  disabled={isLoading || !vaultAmount}
                  className="w-full py-3 bg-[#8b4513] hover:bg-[#a0522d] text-white font-serif font-black text-xs uppercase tracking-widest rounded-lg border border-[#d4af37]/30 transition-all hover:scale-[1.01] active:scale-99 shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  🔄 {t('transfer_coins', 'Execute Vault Transfer')}
                </button>
              </form>
            </div>
          </div>
        </Modal>

        {/* Modal para Nova Transação a partir do Histórico */}
        <Modal
          isOpen={isNewTxModalOpen}
          onClose={() => {
            setIsNewTxModalOpen(false);
            setIsTreasuryMenuOpen(true);
          }}
          title={t.register_movement}
          {...STANDARD_MODAL_PROPS}
        >
          <div className="w-full h-full overflow-y-auto custom-scrollbar-subtle pr-1">
            {/* Main Form Area */}
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="flex items-end gap-3 border-b border-[#8b4513]/20 pb-2.5 mb-2.5 w-full">
                {/* Save Button Symbol */}
                <div className="flex flex-col items-center flex-shrink-0">
                  <span className="block text-[8px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-0.5 text-center font-sans">
                    Save
                  </span>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="bg-[#8b4513] text-[#ffd700] hover:bg-[#a0522d] border border-[#d4af37]/40 rounded-md h-[28px] w-[36px] flex items-center justify-center transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow cursor-pointer"
                    title={t.save_transaction || "Save"}
                  >
                    <span className="text-[14px]">{isLoading ? '⏳' : '💾'}</span>
                  </button>
                </div>

                {/* Dropdowns Grid (width adjusted to window size, Quick Actions is double width) */}
                <div className="grid grid-cols-5 gap-3 flex-grow">
                  {/* QA Filter Subtype */}
                  <div className="flex flex-col col-span-1">
                    <label className="block text-[8px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-0.5 font-sans">
                      {t.subcategory || 'Subtype'}
                    </label>
                    <select
                      value={qaSubtypeFilter}
                      onChange={(e) => handleQaSubtypeFilterChange(e.target.value)}
                      className="w-full bg-[#faf4e5]/90 border border-[#8b4513]/25 rounded-md h-[28px] px-2 text-[10px] font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50 font-sans cursor-pointer"
                    >
                      <option value="All">All Subtypes</option>
                      {subClassOptions.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>

                  {/* QA Filter Category */}
                  <div className="flex flex-col col-span-1">
                    <label className="block text-[8px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-0.5 font-sans">
                      {t.category_label || 'Category'}
                    </label>
                    <select
                      value={qaCategoryFilter}
                      onChange={(e) => setQaCategoryFilter(e.target.value)}
                      className="w-full bg-[#faf4e5]/90 border border-[#8b4513]/25 rounded-md h-[28px] px-2 text-[10px] font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50 font-sans cursor-pointer"
                    >
                      <option value="All">All Categories</option>
                      {qaCategoryOptions.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>

                  {/* Quick Actions Dropdown (Double Width) */}
                  <div className="flex flex-col col-span-2">
                    <label className="block text-[8px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-0.5 font-sans">
                      Quick Actions
                    </label>
                    <select
                      onChange={(e) => {
                        const tplName = e.target.value;
                        if (tplName) {
                          const tpl = templates.find(t => t.name === tplName);
                          if (tpl) applyTemplate(tpl);
                        }
                      }}
                      value=""
                      className="w-full bg-[#faf4e5]/90 border border-[#8b4513]/25 rounded-md h-[28px] px-2 text-[10px] font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50 font-sans cursor-pointer"
                    >
                      <option value="" disabled hidden>-- Select --</option>
                      <option value="">-- Choose --</option>
                      {filteredTemplates.map((tpl, idx) => (
                        <option key={idx} value={tpl.name}>
                          {tpl.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* All Actions Dropdown */}
                  <div className="flex flex-col col-span-1">
                    <label className="block text-[8px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-0.5 font-sans">
                      All Actions
                    </label>
                    <select
                      disabled
                      value=""
                      className="w-full bg-[#faf4e5]/50 border border-[#8b4513]/20 rounded-md h-[28px] px-2 text-[10px] font-bold text-[#4b2c20]/60 cursor-not-allowed focus:outline-none font-sans"
                    >
                      <option value="" disabled hidden>-- Select --</option>
                      <option value="">-- All Actions --</option>
                    </select>
                  </div>
                </div>
              </div>

              <RegisterTransactionForm
                txClass={txClass}
                setTxClass={setTxClass}
                txSubClass={txSubClass}
                setTxSubClass={setTxSubClass}
                txFlow={txFlow}
                setTxFlow={setTxFlow}
                txStatus={txStatus}
                setTxStatus={setTxStatus}
                txFrom={txFrom}
                setTxFrom={setTxFrom}
                txCategory={txCategory}
                setTxCategory={setTxCategory}
                txEntity={txEntity}
                handleEntityChange={handleEntityChange}
                txAmount={txAmount}
                setTxAmount={setTxAmount}
                txValueDate={txValueDate}
                setTxValueDate={setTxValueDate}
                txDueDate={txDueDate}
                setTxDueDate={setTxDueDate}
                txPostingDate={txPostingDate}
                setTxPostingDate={setTxPostingDate}
                txDescription={txDescription}
                setTxDescription={setTxDescription}
                txSourceDestBank={txSourceDestBank}
                setTxSourceDestBank={setTxSourceDestBank}
                txTargetAccount={txTargetAccount}
                setTxTargetAccount={setTxTargetAccount}
                classOptions={classOptions}
                subClassOptions={subClassOptions}
                statusOptions={statusOptions}
                fromOptions={fromOptions}
                categoryOptions={categoryOptions}
                entityOptions={entityOptions}
                entityMappings={entityMappings}
                accountMappings={accountMappings}
                t={t}
              />
            </form>
          </div>
        </Modal>

        {/* Dashboard View (Royal Treasury Summary) */}
        {activeTab === 'dashboard' && (
          <div 
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setActiveTab('quests');
                setIsTreasuryMenuOpen(true);
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
                type="button"
                onClick={() => {
                  setActiveTab('quests');
                  setIsTreasuryMenuOpen(true);
                }}
                className="absolute -top-1 -right-1 w-12 h-12 bg-[#8b0000] rounded-full flex items-center justify-center border-4 border-[#5d0000] shadow-[0_4px_10px_rgba(0,0,0,0.5)] active:scale-90 transition-transform group"
                style={{ zIndex: Z_LAYERS.MODAL_CONTENT }}
                title={t.back_to_map}
              >
                <div className="absolute inset-0 rounded-full border-2 border-white/20 animate-pulse" />
                <span className="text-[#ffd700] text-lg font-black font-sans">✕</span>
              </button>

              {/* Row 1: Header Ribbon (Centralized) */}
              <div className="relative h-16 flex items-center justify-center z-10 pt-2">
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[110%] h-10 bg-gradient-to-r from-[#8b4513] via-[#5d4037] to-[#8b4513] shadow-lg transform -rotate-1 skew-x-12 z-0 border-y-2 border-[#d4af37]" />
                <h2 className="title-font text-lg sm:text-xl text-[#ffd700] font-bold uppercase tracking-[0.2em] relative z-10 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                  {t.financial_report}
                </h2>
              </div>

              <BaseDashboardTab
                t={t}
                dashSubTab={dashSubTab}
                setDashSubTab={setDashSubTab}
                subTabs={[
                  { id: 'overview', label: t.subtab_overview, icon: '📊' },
                  { id: 'income_expense', label: t.subtab_income_expense, icon: '💸' },
                  { id: 'payables_receivables', label: t.subtab_payables_receivables, icon: '📜' },
                  { id: 'liabilities', label: t.subtab_liabilities, icon: '🏦' }
                ]}
                isSidebarOpen={isSidebarOpen}
                setIsSidebarOpen={setIsSidebarOpen}
                selectedYears={selectedYears}
                setSelectedYears={setSelectedYears}
                uniqueYearsList={uniqueYearsList}
                selectedQuarters={selectedQuarters}
                setSelectedQuarters={setSelectedQuarters}
                selectedMonths={selectedMonths}
                setSelectedMonths={setSelectedMonths}
                monthOptions={monthOptions}
                isFallbackState={isFallbackState}
                kpis={
                  dashSubTab === 'income_expense' ? [
                    { label: 'Total income', value: formatNumberCompact(dashInflow), icon: '📈', colorClass: 'text-emerald-700' },
                    { label: 'Total expenses', value: formatNumberCompact(-dashOutflow), icon: '📉', colorClass: 'text-rose-700' },
                    { label: 'Net cash balance', value: formatNumberCompact(dashNetBalance), icon: '💰', colorClass: dashNetBalance >= 0 ? 'text-[#b8860b]' : 'text-rose-700' }
                  ] : dashSubTab === 'payables_receivables' ? [
                    { label: t.kpi_all_payables || 'All Payables', value: formatNumberCompact(engineData.payablesReceivablesKpis?.all_payables), icon: '💸', colorClass: 'text-rose-700' },
                    { label: t.kpi_open_payables || 'Open Payables', value: formatNumberCompact(engineData.payablesReceivablesKpis?.open_payables), icon: '⏳', colorClass: 'text-rose-800' },
                    { label: t.kpi_all_receivables || 'All Receivables', value: formatNumberCompact(engineData.payablesReceivablesKpis?.all_receivables), icon: '📈', colorClass: 'text-emerald-700' },
                    { label: t.kpi_open_receivables || 'Open Receivables', value: formatNumberCompact(engineData.payablesReceivablesKpis?.open_receivables), icon: '📜', colorClass: 'text-emerald-600' },
                    { label: t.kpi_overdue_rate || 'Overdue Rate', value: `${engineData.payablesReceivablesKpis?.overdue_rate || 0.0}%`, icon: '⚠️', colorClass: (engineData.payablesReceivablesKpis?.overdue_rate || 0) > 20 ? 'text-rose-700' : 'text-[#b8860b]' }
                  ] : dashSubTab === 'liabilities' ? [
                    { label: t.kpi_total_debt || 'Total Debt', value: formatNumberCompact(engineData.liabilitiesKpis?.total_debt), icon: '🏦', colorClass: 'text-rose-700' },
                    { label: t.kpi_to_be_paid || 'To Be Paid', value: formatNumberCompact(engineData.liabilitiesKpis?.to_be_paid), icon: '⏳', colorClass: 'text-amber-700' },
                    { label: t.kpi_new_liabilities || 'New Liabilities', value: formatNumberCompact(engineData.liabilitiesKpis?.new_liabilities), icon: '📈', colorClass: 'text-[#b8860b]' },
                    { label: t.kpi_amortizations || 'Amortizations', value: formatNumberCompact(engineData.liabilitiesKpis?.amortizations), icon: '🛡️', colorClass: 'text-emerald-700' }
                  ] : []
                }
              >
                {/* SUBTAB: OVERVIEW & RATIOS */}
                {dashSubTab === 'overview' && (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-60">
                    <div className="text-6xl">⚖️</div>
                    <div className="space-y-1">
                      <h3 className="title-font text-xl font-black text-[#4b2c20] uppercase tracking-widest">Financial Ratios</h3>
                      <p className="text-xs font-serif italic text-[#5d4037]">Under construction by order of the Royal Treasurer.</p>
                    </div>
                  </div>
                )}

                {/* SUBTAB: INCOME & EXPENSES */}
                {dashSubTab === 'income_expense' && (
                  (() => {
                    const financialPositionInsight = dashNetBalance >= 0 
                      ? t('advice_financial_position_positive', { inflow: formatNumberCompact(dashInflow) }) 
                      : t('advice_financial_position_negative', { balance: formatNumberCompact(dashNetBalance) });

                    const maxCategory = dashCategoryData.length > 0 ? dashCategoryData.reduce((prev, current) => (prev.expense > current.expense) ? prev : current) : null;
                    const expensesReportInsight = maxCategory 
                      ? t('advice_expenses_report', { category: maxCategory["Transaction Category"], amount: formatNumberCompact(maxCategory.expense) }) 
                      : t('advice_empty', '"No transactions registered in the official ledger of the crown, my Lord. The realm awaits financial activity."');

                    const expenseTransactions = dashboardFilteredTransactions.filter(tx => tx.transaction_type === 'Expense');
                    const entityTotals = expenseTransactions.reduce((acc, tx) => {
                      acc[tx.entity] = (acc[tx.entity] || 0) + Number(tx.amount);
                      return acc;
                    }, {});
                    const maxEntity = Object.keys(entityTotals).reduce((a, b) => entityTotals[a] > entityTotals[b] ? a : b, null);
                    const expensesDetailedInsight = maxEntity 
                      ? t('advice_expenses_detailed', { entity: maxEntity, amount: formatNumberCompact(entityTotals[maxEntity]) }) 
                      : t('advice_empty', '"No transactions registered in the official ledger of the crown, my Lord. The realm awaits financial activity."');

                    return (
                      <div className="flex flex-col gap-4">
                        {/* Row 1: Financial Position */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          <div className="h-[245px]">
                            <TimeEvolutionChart timePoints={dashTimeData} t={t} />
                          </div>
                          <div className="h-[245px]">
                            <RoyalTreasurerInsights adviceText={financialPositionInsight} t={t} />
                          </div>
                        </div>

                        {/* Row 2: Expenses Donut */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          <div className="h-[245px]">
                            <ExpensesDonutChart dashCategoryData={dashCategoryData} t={t} />
                          </div>
                          <div className="h-[245px]">
                            <RoyalTreasurerInsights adviceText={expensesReportInsight} t={t} />
                          </div>
                        </div>

                        {/* Row 3: Expenses Detailed */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          <div className="h-[245px]">
                            <ExpensesDetailedChart transactions={dashboardFilteredTransactions} t={t} />
                          </div>
                          <div className="h-[245px]">
                            <RoyalTreasurerInsights adviceText={expensesDetailedInsight} t={t} />
                          </div>
                        </div>

                        {/* Side-by-side evolution */}
                        <div className="bg-[#faf4e5]/60 border border-[#8b4513]/25 rounded-xl p-4 shadow-sm flex flex-col h-[245px]">
                          <h4 className="title-font text-[11px] font-black text-[#4b2c20] uppercase tracking-wider border-b border-[#8b4513]/10 pb-1.5 flex justify-between flex-shrink-0">
                            <span>{t.flow_comparison} ({dashGranularity === 'month' ? t.gran_month : dashGranularity === 'quarter' ? t.gran_quarter : t.gran_year})</span>
                            <span className="text-[8px] font-sans font-medium text-stone-500 normal-case">{t.revenue_vs_expense}</span>
                          </h4>
                          <div className="space-y-4 overflow-y-auto pr-1 custom-scrollbar-subtle flex-grow mt-3">
                            {dashTimeData.length > 0 ? (
                                dashTimeData.map((tItem) => {
                                  const incWidth = (tItem.classIncome / maxDashTimeVal) * 100;
                                  const expWidth = (tItem.classExpense / maxDashTimeVal) * 100;
                                  const net = tItem.classIncome - tItem.classExpense;
                                  return (
                                    <div key={tItem.label} className="space-y-2 border-b border-[#8b4513]/5 pb-2">
                                      <div className="flex justify-between font-bold text-[#4b2c20] text-[10px]">
                                        <span>{tItem.label}</span>
                                        <span className={`font-mono ${net >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                                          {t.balance}: {formatNumberCompact(net)}
                                        </span>
                                      </div>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {/* Income bar */}
                                        <div className="space-y-0.5">
                                          <div className="flex justify-between text-[8px] text-emerald-800 font-bold font-mono">
                                            <span>{t.income}</span>
                                            <span>{formatNumberCompact(tItem.classIncome)}</span>
                                          </div>
                                          <div className="w-full bg-[#faf4e5]/80 h-2 rounded-full overflow-hidden border border-[#8b4513]/10">
                                            <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${incWidth}%` }} />
                                          </div>
                                        </div>
                                        {/* Expense bar */}
                                        <div className="space-y-0.5">
                                          <div className="flex justify-between text-[8px] text-rose-800 font-bold font-mono">
                                            <span>{t.expense}</span>
                                            <span>{formatNumberCompact(-tItem.classExpense)}</span>
                                          </div>
                                          <div className="w-full bg-[#faf4e5]/80 h-2 rounded-full overflow-hidden border border-[#8b4513]/10">
                                            <div className="h-full bg-rose-600 rounded-full" style={{ width: `${expWidth}%` }} />
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })
                            ) : (
                               <div className="h-full flex items-center justify-center">
                                 <p className="text-center text-[10px] text-[#5d4037]/60 italic font-serif">{t.no_records_active_period}</p>
                               </div>
                            )}
                          </div>
                        </div>

                        {/* Cost breakdown by Entity Category */}
                        <div className="bg-[#faf4e5]/60 border border-[#8b4513]/25 rounded-xl p-4 shadow-sm flex flex-col h-[245px]">
                          <h4 className="title-font text-[11px] font-black text-[#4b2c20] uppercase tracking-wider border-b border-[#8b4513]/10 pb-1.5 flex justify-between flex-shrink-0">
                            <span>{t.expenses_by_entity_category}</span>
                            <span className="text-[8px] font-sans font-medium text-stone-500 normal-case">{t.spending_distribution}</span>
                          </h4>
                          <div className="space-y-3 overflow-y-auto pr-1 custom-scrollbar-subtle flex-grow mt-3">
                            {entityCatExpenses.length > 0 ? (
                               entityCatExpenses.map((cat) => {
                                 const pctWidth = (cat.amount / maxEntityCatExp) * 100;
                                 return (
                                   <div key={cat.name} className="space-y-1">
                                     <div className="flex justify-between font-bold text-[#4b2c20] text-[10px]">
                                       <span>🏷️ {cat.name}</span>
                                       <span className="font-mono text-rose-700">{formatNumberCompact(-cat.amount)}</span>
                                     </div>
                                     <div className="w-full bg-[#faf4e5]/80 h-2 rounded-full overflow-hidden border border-[#8b4513]/10">
                                       <div className="h-full bg-rose-500 rounded-full" style={{ width: `${pctWidth}%` }} />
                                     </div>
                                   </div>
                                 );
                               })
                            ) : (
                               <div className="h-full flex items-center justify-center">
                                 <p className="text-center text-[10px] text-[#5d4037]/60 italic font-serif">{t.no_expenses_registered}</p>
                               </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()
                )}

                {/* SUBTAB: PAYABLES & RECEIVABLES */}
                {dashSubTab === 'payables_receivables' && (
                  (() => {
                    return (
                      <div className="flex flex-col items-center justify-center p-8 text-center opacity-60">
                        <div className="text-4xl">📜</div>
                        <p className="text-xs font-serif italic mt-2">{t('payables_receivables_deprecated', 'Commercial accounts payable & receivable views have been retired in the Personal Finance model.')}</p>
                      </div>
                    );
                  })()
                )}

                {/* SUBTAB: LIABILITIES */}
                {dashSubTab === 'liabilities' && (
                  (() => {
                    const evolutionAdvice = t('advice_liabilities_evolution');
                    
                    const debtEnt = engineData.debtByEntity || [];
                    const maxDebtEnt = debtEnt.length > 0 ? debtEnt[0] : null;
                    const entityAdvice = maxDebtEnt
                      ? t('advice_debt_by_entity', { entity: maxDebtEnt.name, amount: formatNumberCompact(maxDebtEnt.amount) })
                      : t('advice_pr_entity_none');

                    const debtTypeAdvice = t('advice_debt_composition', { amount: formatNumberCompact(engineData.liabilitiesKpis?.total_debt || 0) });

                    return (
                      <div className="flex flex-col gap-4">
                        {/* Debt Evolution Chart */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          <div className="h-[245px]">
                            <DebtEvolutionChart timePoints={engineData.timeData} t={t} />
                          </div>
                          <div className="h-[245px]">
                            <RoyalTreasurerInsights adviceText={evolutionAdvice} t={t} />
                          </div>
                        </div>

                        {/* Debt by Entity Chart */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          <div className="h-[245px]">
                            <DebtByEntityChart debtByEntity={engineData.debtByEntity} t={t} formatNumberCompact={formatNumberCompact} />
                          </div>
                          <div className="h-[245px]">
                            <RoyalTreasurerInsights adviceText={entityAdvice} t={t} />
                          </div>
                        </div>

                        {/* Debt Composition Chart */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          <div className="h-[245px]">
                            <DebtCompositionChart debtByType={engineData.debtByType} t={t} />
                          </div>
                          <div className="h-[245px]">
                            <RoyalTreasurerInsights adviceText={debtTypeAdvice} t={t} />
                          </div>
                        </div>
                      </div>
                    );
                  })()
                )}
              </BaseDashboardTab>
            </div>
          </div>
        )}

        <FinancialStatementsModal
          isOpen={activeTab === 'financial_statement'}
          onClose={() => {
            setActiveTab('quests');
            setIsTreasuryMenuOpen(true);
          }}
          t={t}
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          selectedYears={selectedYears}
          setSelectedYears={setSelectedYears}
          uniqueYearsList={uniqueYearsList}
          selectedQuarters={selectedQuarters}
          setSelectedQuarters={setSelectedQuarters}
          selectedMonths={selectedMonths}
          setSelectedMonths={setSelectedMonths}
          monthOptions={monthOptions}
          isFallbackState={isFallbackState}
          incomeStatement={engineData.incomeStatement}
          cashFlowStatement={engineData.cashFlowStatement}
          balanceSheet={engineData.balanceSheet}
          formatNumberCompact={formatNumberCompact}
        />

        {activeTab === 'transactions' && (
          <GoldMineLedger
            t={t}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            setIsTreasuryMenuOpen={setIsTreasuryMenuOpen}
            transactions={transactions}
            deleteTransactions={deleteTransactions}
            user={user}
            fetchKingdomData={fetchKingdomData}
            fetchDashboardData={fetchDashboardData}
            entityMappings={entityMappings}
            fromOptions={fromOptions}
            statusOptions={statusOptions}
            classOptions={classOptions}
            subClassOptions={subClassOptions}
            entityOptions={entityOptions}
            categoryOptions={categoryOptions}
            monthOptions={monthOptions}
            filterYear={filterYear}
            setFilterYear={setFilterYear}
            filterMonth={filterMonth}
            setFilterMonth={setFilterMonth}
            filterFrom={filterFrom}
            setFilterFrom={setFilterFrom}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            filterClass={filterClass}
            setFilterClass={setFilterClass}
            filterCategory={filterCategory}
            setFilterCategory={setFilterCategory}
            filterEntity={filterEntity}
            setFilterEntity={setFilterEntity}
            isFiltersExpanded={isFiltersExpanded}
            setIsFiltersExpanded={setIsFiltersExpanded}
            uniqueYears={uniqueYears}
            filteredTransactions={filteredTransactions}
            onEditTransaction={(tx) => {
              startEdit(tx);
              setIsNewTxModalOpen(true);
            }}
            exportCSV={exportCSV}
            importCSV={importCSV}
            onNewTransaction={handleNewTxClick}
          />
        )}
      </div>
    </div>
  );
}

export default App;

