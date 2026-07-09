/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useRef, useMemo } from 'react';
import { useDashboardEngine, formatNumberCompact } from './lib/useDashboardEngine';
import { supabase } from './lib/supabaseClient';
import HUD from './components/common/HUD';
import Login from './components/auth/Login';
import BottomNav from './components/common/BottomNav';
import IsometricMap from './components/common/IsometricMap';
import Modal from './components/common/Modal';
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
import RoyalTreasurerInsights from './components/treasury/RoyalTreasurerInsights';
import BaseDashboardTab from './components/dashboard/BaseDashboardTab';
import RoyalIncomeStatement from './components/treasury/RoyalIncomeStatement';
import TreasuryStatements from './components/treasury/TreasuryStatements';
import ConsolidatedFinancialStatement from './components/treasury/ConsolidatedFinancialStatement';
import { handleExportCSV, handleImportCSV, handleExportAllActionsCSV, handleImportQuickActionsCSV, handleExportSettingsCSV, handleImportSettingsCSV } from './utils/csvHelpers';
import { getAccountName } from './utils/accountMappings';
import QuickActionFormFields from './components/quick-actions/QuickActionFormFields';
import EditQuickActionModal from './components/quick-actions/EditQuickActionModal';
import ManageQuickActionsPanel from './components/quick-actions/ManageQuickActionsPanel';
import RegisterTransactionForm from './components/ledger/RegisterTransactionForm';
import FinancialStatementsModal from './components/treasury/FinancialStatementsModal';
import { useManualTransactionForm } from './hooks/useManualTransactionForm';
import { useQuickActionForm } from './hooks/useQuickActionForm';
import { useLedgerFilters } from './hooks/useLedgerFilters';
import CategoryMatrixEditor from './components/setup/CategoryMatrixEditor';
import COAEditor from './components/setup/COAEditor';
import SubtypeCategoryEditor from './components/setup/SubtypeCategoryEditor';
import GoldMineLedger from './components/ledger/GoldMineLedger';
import FlatListEditor from './components/setup/FlatListEditor';
import AllActionsEditor from './components/setup/AllActionsEditor';
import InitialBalancesEditor from './components/setup/InitialBalancesEditor';
import StatisticsWindow from './components/ledger/StatisticsWindow';
import QuestModal from './components/gamification/QuestModal';
import AchievementsModal from './components/gamification/AchievementsModal';
import QuickActionModal from './components/quick-actions/QuickActionModal';
import SettingsModal from './components/settings/SettingsModal';


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
  const staticEntityOptions = useKingdomStore((state) => state.entityOptions) || [];
  const staticCategoryOptions = useKingdomStore((state) => state.categoryOptions) || [];
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
  const fetchExpenseVariance = useKingdomStore((state) => state.fetchExpenseVariance);
  const expenseVarianceData = useKingdomStore((state) => state.expenseVarianceData);
  const fetchSavingsRate = useKingdomStore((state) => state.fetchSavingsRate);
  const savingsRateData = useKingdomStore((state) => state.savingsRateData);
  const fetchRunwayData = useKingdomStore((state) => state.fetchRunwayData);
  const runwayData = useKingdomStore((state) => state.runwayData);
  const fetchDtiData = useKingdomStore((state) => state.fetchDtiData);
  const dtiData = useKingdomStore((state) => state.dtiData);

  const coaSubtypesAndEntities = useMemo(() => {
    const subtypes = new Set();
    const entities = new Set();
    Object.entries(accountMappings || {}).forEach(([code, fullName]) => {
      let remaining = fullName;
      if (remaining.startsWith(code)) {
        remaining = remaining.substring(code.length).replace(/^\s*-\s*/, '');
      }
      const parts = remaining.split(/\s*-\s*/);
      if (parts[0]) subtypes.add(parts[0]);
      if (parts[1]) entities.add(parts.slice(1).join(' - '));
    });
    return { subtypes: Array.from(subtypes), entities: Array.from(entities) };
  }, [accountMappings]);

  const categoryOptions = useMemo(() => {
    const cats = new Set([
      ...staticCategoryOptions,
      ...coaSubtypesAndEntities.subtypes,
      ...Object.values(entityMappings || {}),
      ...transactions.map(tx => tx.transaction_category),
      ...transactions.map(tx => entityMappings[tx.entity])
    ]);
    return Array.from(cats).filter(Boolean).sort();
  }, [staticCategoryOptions, coaSubtypesAndEntities.subtypes, entityMappings, transactions]);

  const entityOptions = useMemo(() => {
    const ents = new Set([
      ...staticEntityOptions,
      ...coaSubtypesAndEntities.entities,
      ...Object.keys(entityMappings || {}),
      ...transactions.map(tx => tx.entity)
    ]);
    return Array.from(ents).filter(Boolean).sort();
  }, [staticEntityOptions, coaSubtypesAndEntities.entities, entityMappings, transactions]);

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
    filterAccountCode, setFilterAccountCode,
    filterAccountLabel, setFilterAccountLabel,
    filterBeforeOrInPeriod, setFilterBeforeOrInPeriod,
    filterBeforeOrInYear, setFilterBeforeOrInYear,
    filterBeforeOrInMonth, setFilterBeforeOrInMonth,
    filterBeforeOrInQuarter, setFilterBeforeOrInQuarter,
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
    allowedSubClasses,
    allowedCategories,
    allowedEntities,
    handleMainMenuChange,
    handleSubMenuChange,
    handleEntityChange,
    applyTemplate,
    startEdit,
    handleSubmit,
    resetFormState
  } = useManualTransactionForm(setIsNewTxModalOpen);

  const handleViewInLedger = (accountsList, nodeName) => {
    setActiveTab('transactions');
    setFilterAccountCode(accountsList.join(','));
    setFilterAccountLabel(nodeName || '');
    setFilterBeforeOrInPeriod(true);
    setFilterBeforeOrInYear(selectedYears.length > 0 ? String(selectedYears[0]) : String(new Date().getFullYear()));
    if (selectedMonths.length > 0) {
      setFilterBeforeOrInMonth(selectedMonths[0]);
      setFilterBeforeOrInQuarter('');
    } else if (selectedQuarters.length > 0) {
      setFilterBeforeOrInMonth('');
      setFilterBeforeOrInQuarter(selectedQuarters[0]);
    } else {
      setFilterBeforeOrInMonth('');
      setFilterBeforeOrInQuarter('');
    }
  };

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


  // Fetch expense variance, savings rate, and runway data from Supabase RPC whenever dashboard date filters change
  useEffect(() => {
    const userId = user?.id || GUEST_PROFILE_ID;
    fetchExpenseVariance(selectedYears, selectedQuarters, selectedMonths);
    fetchSavingsRate(selectedYears, selectedQuarters, selectedMonths);
    fetchRunwayData(selectedYears, selectedQuarters, selectedMonths);
  // --- ADD THIS LINE: ---
  fetchDtiData(selectedYears, selectedQuarters, selectedMonths);
 
}, [user?.id, selectedYears, selectedQuarters, selectedMonths, fetchExpenseVariance, fetchSavingsRate, fetchRunwayData, fetchDtiData]); // <-- Don't forget to add fetchDtiData to the dependency array

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
        // Let active modals handle Escape natively if present
        const overlays = document.querySelectorAll('.modal-overlay');
        if (overlays.length > 0) {
          return;
        }

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

    const isEntityInvalid = (ent) => {
      const val = (ent || '').trim().toLowerCase();
      return !val || val === 'none' || val === 'null' || val === 'undefined';
    };

    // 1. Scan Chart of Accounts (COA) for specific mappings first
    const coaMappingsList = [];
    Object.entries(accountMappings || {}).forEach(([code, fullName]) => {
      let remaining = fullName;
      if (remaining.startsWith(code)) {
        remaining = remaining.substring(code.length).replace(/^\s*-\s*/, '');
      }
      const parts = remaining.split(/\s*-\s*/);
      const category = parts[0] || '';
      const entity = parts.slice(1).join(' - ') || '';
      
      if (category && entity && !isEntityInvalid(entity)) {
        coaMappingsList.push({ category: category.trim(), entity: entity.trim() });
      }
    });

    coaMappingsList.forEach(({ category, entity }) => {
      let subtype = '';
      for (const [sub, cats] of Object.entries(subtypeToCategoryMap)) {
        if (cats && cats.includes(category)) {
          subtype = sub;
          break;
        }
      }
      
      const key = `${subtype}:::${category}:::${entity}`;
      // Prevent duplicates
      if (!rows.some(r => r.key === key)) {
        rows.push({
          key,
          subtype,
          category,
          entity
        });
      }
      
      coveredEntities.add(entity);
      coveredCategories.add(category);
      if (subtype) coveredSubtypes.add(subtype);
    });

    // 2. Loop over standard entityMappings
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
      const key = `${subtype}:::${category}:::${entity}`;
      if (!rows.some(r => r.key === key)) {
        rows.push({
          key,
          subtype,
          category,
          entity
        });
      }
      coveredEntities.add(entity);
      if (category) coveredCategories.add(category);
      if (subtype) coveredSubtypes.add(subtype);
    });

    // 3. Loop over categoryOptions for remaining uncovered category placeholders
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

    // 4. Loop over subclass options
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
    const defaultSubtypeMap = {
      "Banks": ["Bank account", "Savings account", "Investments account"],
      "Fixed Assets": ["Fixed Assets"],
      "Personal Debt": ["Loans & Burrow", "Credit Cards"],
      "Other Debts": ["Other Debts"],
      "Living & Household": ["Household", "Utilities"],
      "Personal Transports": ["Gasoline", "Tolls", "Parking", "Repairs"],
      "Public Transports": ["Public Transports"],
      "Other Transports": ["Other Transports"],
      "Markets & Consumables": ["Markets & Groceries", "Markets and Tools", "Markets and Clothing", "Other Market consumables"],
      "Health": ["Health"],
      "Entertainment": ["Entertainment"],
      "Education": ["Education"],
      "Insurances": ["Insurances"],
      "Insurances (income)": ["Insurances"],
      "Taxes & State": ["Taxes", "Interest"],
      "Taxes & State (income)": ["Taxes", "Interest"],
      "Financial Expenses": ["Interest paid", "Fines", "Loans & Burrow", "Credit Cards"],
      "Payroll": ["Salary", "Payroll Subsidies"],
      "Other Income": ["Other Incomes"],
      "Financial Income": ["Fines", "Loans & Burrow", "Credit Cards"]
    };
    const newSubtypeToCategoryMap = JSON.parse(JSON.stringify(defaultSubtypeMap));

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

  const exportCSV = () => handleExportCSV(filteredTransactions, t);
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
        <SettingsModal
          isOpen={activeTab === 'settings'}
          onClose={() => setActiveTab('quests')}
          t={t}
          selectedSettingType={selectedSettingType}
          setSelectedSettingType={setSelectedSettingType}
          newOptionVal={newOptionVal}
          setNewOptionVal={setNewOptionVal}
          newEntityCatVal={newEntityCatVal}
          setNewEntityCatVal={setNewEntityCatVal}
          accountMappings={accountMappings}
          subtypeToCategoryMap={subtypeToCategoryMap}
          subtypeTypes={subtypeTypes}
          syncSettings={syncSettings}
          subClassOptions={subClassOptions}
          categoryOptions={categoryOptions}
          entityOptions={entityOptions}
          entityMappings={entityMappings}
          getMatrixRows={getMatrixRows}
          handleSaveMatrix={handleSaveMatrix}
          settingsFileInputRef={settingsFileInputRef}
          importSettingsCSV={importSettingsCSV}
          exportSettingsCSV={exportSettingsCSV}
          fromOptions={fromOptions}
          statusOptions={statusOptions}
          classOptions={classOptions}
          templates={templates}
          selectedQaNames={selectedQaNames}
          setSelectedQaNames={setSelectedQaNames}
          setSelectedQaTemplateName={setSelectedQaTemplateName}
          setQaName={setQaName}
          setQaIcon={setQaIcon}
          setQaFrom={setQaFrom}
          setQaClass={setQaClass}
          setQaSubClass={setQaSubClass}
          setQaEntity={setQaEntity}
          setQaCategory={setQaCategory}
          setQaTargetAccount={setQaTargetAccount}
          setQaSourceDestBank={setQaSourceDestBank}
          setQaFlow={setQaFlow}
          setQaStatus={setQaStatus}
          setQaDescription={setQaDescription}
          setQaAmount={setQaAmount}
          setQaDueDate={setQaDueDate}
          setQaValueDate={setQaValueDate}
          setQaPostingDate={setQaPostingDate}
          setIsEditingQa={setIsEditingQa}
          handleDeleteQuickAction={handleDeleteQuickAction}
          qaFileInputRef={qaFileInputRef}
          importQuickActionsCSV={importQuickActionsCSV}
          handleExportAllActionsCSV={handleExportAllActionsCSV}
          qaName={qaName}
          qaIcon={qaIcon}
          qaFrom={qaFrom}
          qaClass={qaClass}
          qaSubClass={qaSubClass}
          qaEntity={qaEntity}
          qaCategory={qaCategory}
          qaTargetAccount={qaTargetAccount}
          qaSourceDestBank={qaSourceDestBank}
          qaFlow={qaFlow}
          qaStatus={qaStatus}
          qaDescription={qaDescription}
          qaAmount={qaAmount}
          qaDueDate={qaDueDate}
          qaValueDate={qaValueDate}
          qaPostingDate={qaPostingDate}
          addOption={addOption}
          editOption={editOption}
          deleteOption={deleteOption}
          handleSaveQuickAction={handleSaveQuickAction}
          filterActionType={filterActionType}
          filterActionSubtype={filterActionSubtype}
          filterActionCategory={filterActionCategory}
          filterActionEntity={filterActionEntity}
        />

        <QuickActionModal
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

        <QuestModal
          isOpen={isQuestsModalOpen}
          onClose={() => setIsQuestsModalOpen(false)}
          t={t}
        />

        <AchievementsModal
          isOpen={activeTab === 'achievements'}
          onClose={() => setActiveTab('quests')}
          t={t}
        />

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
                subClassOptions={allowedSubClasses}
                statusOptions={statusOptions}
                fromOptions={fromOptions}
                categoryOptions={allowedCategories}
                entityOptions={allowedEntities}
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-4xl mx-auto py-2">
                    {/* Expense Variance Card */}
                    <div className="bg-[#faf4e5] border border-[#8b4513]/25 rounded-lg p-4 shadow-sm flex flex-col justify-between relative overflow-hidden text-left">
                      {/* Decorative subtle shield/scroll icon */}
                      <div className="absolute right-3 top-3 text-[#8b4513]/10 text-5xl pointer-events-none font-serif">
                        🛡️
                      </div>
                      
                      <div>
                        <span className="block text-[9px] font-black uppercase text-[#5d4037]/70 tracking-wider font-sans mb-1">
                          {t('metrics.expense_variance', 'Expense Variance (PoP)')}
                        </span>
                        <div className="flex items-baseline gap-2 mt-1">
                          <span className="text-2xl font-mono font-black text-[#4b2c20]">
                            {Number(expenseVarianceData?.current_period_expenses || 0).toLocaleString()}g
                          </span>
                          <span className="text-[10px] text-[#5d4037]/60 font-serif italic">
                            {t('metrics.current_period', 'Current Period')}
                          </span>
                        </div>
                        
                        <div className="text-[10px] text-[#5d4037]/75 font-bold font-sans mt-3 space-y-1">
                          <div>
                            {t('metrics.previous_period', 'Previous Period')}:{' '}
                            <span className="font-mono text-[#4b2c20]">
                              {Number(expenseVarianceData?.previous_period_expenses || 0).toLocaleString()}g
                            </span>
                          </div>
                          <div>
                            {t('metrics.absolute_variance', 'Absolute Change')}:{' '}
                            <span className={`font-mono ${expenseVarianceData?.absolute_variance > 0 ? 'text-rose-700' : expenseVarianceData?.absolute_variance < 0 ? 'text-emerald-700' : 'text-stone-500'}`}>
                              {expenseVarianceData?.absolute_variance > 0 ? '+' : ''}
                              {Number(expenseVarianceData?.absolute_variance || 0).toLocaleString()}g
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-[#8b4513]/15 flex items-center justify-between">
                        <span className="text-[9px] font-black uppercase text-[#8b4513] tracking-widest font-sans">
                          {t('metrics.variance_percentage', 'Growth / Reduction')}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${
                          expenseVarianceData?.percentage_variance > 0 
                            ? 'bg-rose-50 text-rose-700 border-rose-200' 
                            : expenseVarianceData?.percentage_variance < 0
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-stone-50 text-stone-600 border-stone-200'
                        }`}>
                          {expenseVarianceData?.percentage_variance > 0 ? '▲' : expenseVarianceData?.percentage_variance < 0 ? '▼' : '•'}{' '}
                          {Math.abs(Number(expenseVarianceData?.percentage_variance || 0))}%
                        </span>
                      </div>
                    </div>

                    {/* Savings Rate Card */}
                    <div className="bg-[#faf4e5] border border-[#8b4513]/25 rounded-lg p-4 shadow-sm flex flex-col justify-between relative overflow-hidden text-left">
                      {/* Decorative subtle piggy bank or scroll icon */}
                      <div className="absolute right-3 top-3 text-[#8b4513]/10 text-5xl pointer-events-none font-serif">
                        💰
                      </div>
                      
                      <div>
                        <span className="block text-[9px] font-black uppercase text-[#5d4037]/70 tracking-wider font-sans mb-1">
                          {t('metrics.savings_rate', 'Savings Rate')}
                        </span>
                        <div className="flex items-baseline gap-2 mt-1">
                          <span className={`text-2xl font-mono font-black ${savingsRateData?.savings_rate_percentage >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                            {savingsRateData?.savings_rate_percentage > 0 ? '+' : ''}
                            {Number(savingsRateData?.savings_rate_percentage || 0).toFixed(2)}%
                          </span>
                        </div>
                        
                        <div className="text-[10px] text-[#5d4037]/75 font-bold font-sans mt-3 space-y-1">
                          <div>
                            {t('metrics.total_income', 'Total Income')}:{' '}
                            <span className="font-mono text-[#4b2c20]">
                              {Number(savingsRateData?.total_income || 0).toLocaleString()}g
                            </span>
                          </div>
                          <div>
                            {t('metrics.total_expenses', 'Total Expenses')}:{' '}
                            <span className="font-mono text-[#4b2c20]">
                              {Number(savingsRateData?.total_expenses || 0).toLocaleString()}g
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-[#8b4513]/15 flex items-center justify-between">
                        <span className="text-[9px] font-black uppercase text-[#8b4513] tracking-widest font-sans">
                          {t('metrics.savings_status', 'Treasury Health')}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${
                          savingsRateData?.savings_rate_percentage >= 20 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : savingsRateData?.savings_rate_percentage >= 0
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {savingsRateData?.savings_rate_percentage >= 20 
                            ? t('metrics.healthy', 'Healthy') 
                            : savingsRateData?.savings_rate_percentage >= 0 
                              ? t('metrics.caution', 'Caution') 
                              : t('metrics.deficit', 'Deficit')}
                        </span>
                      </div>
                    </div>

                    {/* Burn Rate & Runway Card */}
                    <div className="bg-[#faf4e5] border border-[#8b4513]/25 rounded-lg p-4 shadow-sm flex flex-col justify-between relative overflow-hidden text-left">
                      {/* Decorative subtle hour glass / fire icon */}
                      <div className="absolute right-3 top-3 text-[#8b4513]/10 text-5xl pointer-events-none font-serif">
                        ⏳
                      </div>
                      
                      <div>
                        <span className="block text-[9px] font-black uppercase text-[#5d4037]/70 tracking-wider font-sans mb-1">
                          {t('metrics.runway', 'Kingdom Runway')}
                        </span>
                        <div className="flex flex-col gap-1 mt-1">
                          <span className="text-xs font-serif font-black text-rose-700">
                            🔥 {Number(runwayData?.monthly_burn_rate || 0).toLocaleString()}g / mo
                          </span>
                          <span className={`text-2xl font-mono font-black ${runwayData?.runway_months >= 6 ? 'text-emerald-700' : runwayData?.runway_months >= 3 ? 'text-amber-700' : 'text-rose-700'}`}>
                            ⏳ {runwayData?.runway_months === 99.0 ? '> 99' : runwayData?.runway_months || 0} {t('metrics.months', 'Months')}
                          </span>
                        </div>
                        
                        <div className="text-[10px] text-[#5d4037]/75 font-bold font-sans mt-3 space-y-1">
                          <div>
                            {t('metrics.liquid_cash', 'Liquid Cash')}:{' '}
                            <span className="font-mono text-[#4b2c20]">
                              {Number(runwayData?.liquid_cash || 0).toLocaleString()}g
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-[#8b4513]/15 flex items-center justify-between">
                        <span className="text-[9px] font-black uppercase text-[#8b4513] tracking-widest font-sans">
                          {t('metrics.runway_status', 'Survival Outlook')}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${
                          runwayData?.runway_months >= 6 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : runwayData?.runway_months >= 3
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {runwayData?.runway_months >= 6 
                            ? t('metrics.secure', 'Secure') 
                            : runwayData?.runway_months >= 3 
                              ? t('metrics.caution', 'Caution') 
                              : t('metrics.critical', 'Critical')}
                        </span>
                      </div>
                    </div>

                    {/* DTI Ratio Card */}
                    <div className="bg-[#faf4e5] border border-[#8b4513]/25 rounded-lg p-4 shadow-sm flex flex-col justify-between relative overflow-hidden text-left">
                      {/* Decorative subtle scales icon */}
                      <div className="absolute right-3 top-3 text-[#8b4513]/10 text-5xl pointer-events-none font-serif">
                        ⚖️
                      </div>
                      
                      <div>
                        <span className="block text-[9px] font-black uppercase text-[#5d4037]/70 tracking-wider font-sans mb-1">
                          {t('metrics.dti_ratio', 'Debt-to-Income')}
                        </span>
                        <div className="flex items-baseline gap-2 mt-1">
                          <span className={`text-2xl font-mono font-black ${
                            dtiData?.dti_percentage <= 36 ? 'text-emerald-700' : 
                            dtiData?.dti_percentage <= 43 ? 'text-amber-600' : 'text-rose-700'
                          }`}>
                            {Number(dtiData?.dti_percentage || 0).toFixed(2)}%
                          </span>
                        </div>
                        
                        <div className="text-[10px] text-[#5d4037]/75 font-bold font-sans mt-3 space-y-1">
                          <div>
                            {t('metrics.amortization', 'Amortization')}:{' '}
                            <span className="font-mono text-[#4b2c20]">
                              {Number(dtiData?.total_amortization || 0).toLocaleString()}g
                            </span>
                          </div>
                          <div>
                            {t('metrics.total_income', 'Total Income')}:{' '}
                            <span className="font-mono text-[#4b2c20]">
                              {Number(dtiData?.total_income || 0).toLocaleString()}g
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 pt-3 border-t border-[#8b4513]/15 flex items-center justify-between">
                        <span className="text-[9px] font-black uppercase text-[#8b4513] tracking-widest font-sans">
                          {t('metrics.risk_level', 'Risk Level')}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${
                          dtiData?.dti_percentage <= 36 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : dtiData?.dti_percentage <= 43
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {dtiData?.dti_percentage <= 36 
                            ? t('metrics.healthy', 'Healthy') 
                            : dtiData?.dti_percentage <= 43 
                              ? t('metrics.caution', 'Caution') 
                              : t('metrics.danger', 'Danger')}
                        </span>
                      </div>
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
          onViewInLedger={handleViewInLedger}
        />

        <StatisticsWindow
          isOpen={activeTab === 'statistics'}
          onClose={() => {
            setActiveTab('quests');
          }}
          t={t}
          transactions={transactions}
          fromOptions={fromOptions}
          accountMappings={accountMappings}
          currentGold={gold}
          onEditTransaction={(tx) => {
            startEdit(tx);
            setIsNewTxModalOpen(true);
          }}
          onDeleteTransaction={(id) => {
            deleteTransactions([id]);
          }}
          onGoToLedger={() => {
            setActiveTab('transactions');
          }}
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
            filterAccountCode={filterAccountCode}
            setFilterAccountCode={setFilterAccountCode}
            filterAccountLabel={filterAccountLabel}
            setFilterAccountLabel={setFilterAccountLabel}
            filterBeforeOrInPeriod={filterBeforeOrInPeriod}
            setFilterBeforeOrInPeriod={setFilterBeforeOrInPeriod}
            filterBeforeOrInYear={filterBeforeOrInYear}
            filterBeforeOrInMonth={filterBeforeOrInMonth}
            filterBeforeOrInQuarter={filterBeforeOrInQuarter}
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

