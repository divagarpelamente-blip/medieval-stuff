/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useRef } from 'react';
import { useDashboardEngine } from './lib/useDashboardEngine';
import { supabase } from './lib/supabaseClient';
import HUD from './components/HUD';
import BottomNav from './components/BottomNav';
import IsometricMap from './components/IsometricMap';
import Modal from './components/Modal';
import bgMap from './assets/Medieval_Town_Backround.png';
import { useKingdomStore } from './store/useKingdomStore';
import { Toaster, toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import FlowByCategoryChart from './components/charts/FlowByCategoryChart';
import TimeEvolutionChart from './components/charts/TimeEvolutionChart';
import TopEntitiesChart from './components/charts/TopEntitiesChart';
import ExpensesDonutChart from './components/charts/ExpensesDonutChart';
import ExpensesDetailedChart from './components/charts/ExpensesDetailedChart';
import DebtEvolutionChart from './components/charts/DebtEvolutionChart';
import LiabilitiesEvolutionChart from './components/charts/LiabilitiesEvolutionChart';
import DebtByEntityChart from './components/charts/DebtByEntityChart';
import DebtCompositionChart from './components/charts/DebtCompositionChart';
import RoyalTreasurerInsights from './components/RoyalTreasurerInsights';
import BaseDashboardTab from './components/BaseDashboardTab';
import PayablesReceivablesSplineChart from './components/charts/PayablesReceivablesSplineChart';
import OpenPayablesByCategoryChart from './components/charts/OpenPayablesByCategoryChart';
import OpenPayablesByEntityChart from './components/charts/OpenPayablesByEntityChart';
import OpenPayablesByMonthChart from './components/charts/OpenPayablesByMonthChart';
import PaymentMethodsChart from './components/charts/PaymentMethodsChart';
import RoyalIncomeStatement from './components/RoyalIncomeStatement';
import TreasuryStatements from './components/TreasuryStatements';
import ConsolidatedFinancialStatement from './components/ConsolidatedFinancialStatement';
import { handleExportCSV, handleImportCSV } from './utils/csvHelpers';

const GUEST_PROFILE_ID = '00000000-0000-0000-0000-000000000000';

function App() {
  const [activeTab, setActiveTab] = useState('quests');
  const [isMineModalOpen, setIsMineModalOpen] = useState(false);
  const [isNewTxModalOpen, setIsNewTxModalOpen] = useState(false);
  const fileInputRef = useRef(null);

  // Selection & inline editing state for Ledger Transactions
  const [selectedTxIds, setSelectedTxIds] = useState([]);
  const [editingTxs, setEditingTxs] = useState({});
  const [isEditing, setIsEditing] = useState(false);

  // Transactions Page Filters state
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(true);
  const [filterYear, setFilterYear] = useState('All');
  const [filterMonth, setFilterMonth] = useState('All');
  const [filterQuarter, setFilterQuarter] = useState('All');
  const [filterFrom, setFilterFrom] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterClass, setFilterClass] = useState('All');
  const [filterSubClass, setFilterSubClass] = useState('All');
  const [filterEntity, setFilterEntity] = useState('All');

  // Dashboard Page Sub-Tabs and Granularity state
  const [dashSubTab, setDashSubTab] = useState('overview'); // overview, income_expense, payables_receivables
  const [isTreasuryMenuOpen, setIsTreasuryMenuOpen] = useState(false);
  const [dashGranularity] = useState('month'); // month, quarter, year

  // Unified Sidebar Filter state
  const [selectedYears, setSelectedYears] = useState([]);
  const [hasInitializedYears, setHasInitializedYears] = useState(false);
  const [selectedQuarters, setSelectedQuarters] = useState([]);
  const [selectedMonths, setSelectedMonths] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile sidebar toggle

  // Settings manage states
  const [selectedSettingType, setSelectedSettingType] = useState('from');
  const [newOptionVal, setNewOptionVal] = useState('');
  const [newEntityCatVal, setNewEntityCatVal] = useState('Payroll');

  // New Quick Action Form States
  const [qaName, setQaName] = useState('');
  const [qaIcon, setQaIcon] = useState('⚡');
  const [qaAmount, setQaAmount] = useState('');
  const [qaFrom, setQaFrom] = useState('Pedro');
  const [qaClass, setQaClass] = useState('Income');
  const [qaStatus, setQaStatus] = useState('Pending');
  const [qaSubClass, setQaSubClass] = useState('Cash receipt');
  const [qaEntity, setQaEntity] = useState('Salary');
  const [qaCategory, setQaCategory] = useState('Payroll');
  const [qaNature, setQaNature] = useState('cash');
  const [qaFlow, setQaFlow] = useState('inflow');
  const [qaDescription, setQaDescription] = useState('');

  // Bind Zustand options
  const fromOptions = useKingdomStore((state) => state.fromOptions);
  const statusOptions = useKingdomStore((state) => state.statusOptions);
  const classOptions = useKingdomStore((state) => state.classOptions);
  const subClassOptions = useKingdomStore((state) => state.subClassOptions);
  const entityOptions = useKingdomStore((state) => state.entityOptions);
  const categoryOptions = useKingdomStore((state) => state.categoryOptions);
  const entityMappings = useKingdomStore((state) => state.entityMappings);
  const monthOptions = useKingdomStore((state) => state.monthOptions);

  const addOption = useKingdomStore((state) => state.addOption);
  const deleteOption = useKingdomStore((state) => state.deleteOption);

  // Form states
  const [txClass, setTxClass] = useState('Income');
  const [txAmount, setTxAmount] = useState('');
  const [txFrom, setTxFrom] = useState('Pedro');
  const [txValueDate, setTxValueDate] = useState(new Date().toISOString().split('T')[0]);
  const [txPostingDate, setTxPostingDate] = useState(new Date().toISOString().split('T')[0]);
  const [txStatus, setTxStatus] = useState('Pending');
  const [txSubClass, setTxSubClass] = useState('Cash receipt');
  const [txEntity, setTxEntity] = useState('Salary');
  const [txCategory, setTxCategory] = useState('Payroll');
  const [txSubCategory] = useState('');
  const [txDescription, setTxDescription] = useState('');
  const [txNature, setTxNature] = useState('cash');
  const [txFlow, setTxFlow] = useState('outflow');

  // Auto-fill Entity Category when Entity changes
  const handleEntityChange = (entityVal) => {
    setTxEntity(entityVal);
    const mapped = entityMappings[entityVal];
    if (mapped) {
      setTxCategory(mapped);
    }
  };


  // Bind Zustand states
  const email = useKingdomStore((state) => state.email);
  const gold = useKingdomStore((state) => state.gold);
  const level = useKingdomStore((state) => state.level);
  const xp = useKingdomStore((state) => state.xp);
  const gems = useKingdomStore((state) => state.gems);
  const transactions = useKingdomStore((state) => state.transactions);
  const isLoading = useKingdomStore((state) => state.isLoading);
  
  // Actions
  const fetchKingdomData = useKingdomStore((state) => state.fetchKingdomData);
  const fetchDashboardData = useKingdomStore((state) => state.fetchDashboardData);
  const registerTransaction = useKingdomStore((state) => state.registerTransaction);
  const registerTransactions = useKingdomStore((state) => state.registerTransactions);

  // Default to last 1 year, and current quarter/month on load
  useEffect(() => {
    if (transactions.length > 0 && !hasInitializedYears) {
      const allYears = Array.from(new Set(transactions.map((tx) => tx.year).filter(Boolean))).sort((a, b) => b - a);
      setSelectedYears(allYears.slice(0, 1).map(String));
      
      const currentMonthIndex = new Date().getMonth();
      const currentQuarterIndex = Math.floor(currentMonthIndex / 3) + 1;
      
      const quartersToSelect = [];
      for (let i = 1; i <= currentQuarterIndex; i++) {
        quartersToSelect.push(`Q${i}`);
      }
      setSelectedQuarters(quartersToSelect);
      
      const allMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      setSelectedMonths(allMonths.slice(0, currentMonthIndex + 1));
      
      setHasInitializedYears(true);
    }
  }, [transactions, hasInitializedYears]);

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

  // Quick Actions templates
  const templates = useKingdomStore((state) => state.templates);

  const applyTemplate = (tpl) => {
    setTxClass(tpl.data.transaction_type);
    setTxAmount(tpl.data.amount);
    setTxFrom(tpl.data.from);
    setTxStatus(tpl.data.payment_status);
    setTxSubClass(tpl.data.transaction_subtype);
    setTxEntity(tpl.data.entity);
    setTxCategory(tpl.data.transaction_category);
    setTxDescription(tpl.data.description);
    setTxNature(tpl.data.transaction_nature);
    setTxFlow(tpl.data.transaction_flow);
    setTxValueDate(new Date().toISOString().split('T')[0]);
    setTxPostingDate(new Date().toISOString().split('T')[0]);
    const translatedName = t(`tpl_${tpl.name.toLowerCase().replace(/\s+/g, '_')}`, tpl.name);
    toast.success(`${translatedName} template applied!`);
  };

  // Get unique years for the Year filter selector
  const uniqueYears = Array.from(
    new Set(transactions.map((tx) => tx.year).filter(Boolean))
  ).sort((a, b) => b - a);

  // Compute filtered transactions (ordered from recent to oldest by date)
  const filteredTransactions = transactions.filter((tx) => {
    if (filterYear !== 'All' && String(tx.year) !== filterYear) return false;
    if (filterMonth !== 'All' && tx.month !== filterMonth) return false;
    if (filterQuarter !== 'All' && tx.quarter !== filterQuarter) return false;
    if (filterFrom !== 'All' && tx.from !== filterFrom) return false;
    if (filterStatus !== 'All' && tx.payment_status !== filterStatus) return false;
    if (filterClass !== 'All' && tx.transaction_type !== filterClass) return false;
    if (filterSubClass !== 'All' && tx.transaction_subtype !== filterSubClass) return false;
    if (filterEntity !== 'All' && tx.entity !== filterEntity) return false;
    return true;
  }).sort((a, b) => {
    const dateA = new Date(a.posting_date || a.value_date || a.created_at);
    const dateB = new Date(b.posting_date || b.value_date || b.created_at);
    return dateB - dateA;
  });

  // Cascading Filtering Engine
  const isFallbackState = selectedYears.length === 0 || (selectedYears.length > 0 && selectedQuarters.length === 0 && selectedMonths.length === 0);
  
  const quarterToMonths = {
    'Q1': ['January', 'February', 'March'],
    'Q2': ['April', 'May', 'June'],
    'Q3': ['July', 'August', 'September'],
    'Q4': ['October', 'November', 'December']
  };

  const dashboardFilteredTransactions = transactions.filter((tx) => {
    if (isFallbackState) return false;
    if (!selectedYears.includes(String(tx.year))) return false;

    if (selectedQuarters.length > 0 && selectedMonths.length === 0) {
      const allowedMonths = selectedQuarters.flatMap(q => quarterToMonths[q]);
      return allowedMonths.includes(tx.month);
    }

    if (selectedMonths.length > 0 && selectedQuarters.length === 0) {
      return selectedMonths.includes(tx.month);
    }

    if (selectedQuarters.length > 0 && selectedMonths.length > 0) {
      const allowedFromQuarters = selectedQuarters.flatMap(q => quarterToMonths[q]);
      const unionMonths = Array.from(new Set([...allowedFromQuarters, ...selectedMonths]));
      return unionMonths.includes(tx.month);
    }

    return false;
  }).sort((a, b) => new Date(a.posting_date || a.value_date || a.created_at) - new Date(b.posting_date || b.value_date || b.created_at));

  const engineData = useDashboardEngine(dashboardFilteredTransactions);


  // Calculate Dashboard Stats (dependent on filters)
  const dashInflow = dashboardFilteredTransactions.filter(tx => tx.transaction_nature === 'accrual' && tx.transaction_flow === 'inflow').reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
  const dashOutflow = dashboardFilteredTransactions.filter(tx => tx.transaction_nature === 'accrual' && tx.transaction_flow === 'outflow').reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
  
  const subclassInflow = dashboardFilteredTransactions.filter(tx => tx.transaction_nature === 'cash' && tx.transaction_flow === 'inflow').reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
  const subclassOutflow = dashboardFilteredTransactions.filter(tx => tx.transaction_nature === 'cash' && tx.transaction_flow === 'outflow').reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
  
  const dashNetBalance = subclassInflow - subclassOutflow;
  
  const debtAccrual = dashboardFilteredTransactions.filter(tx => ['Banking', 'Other Banking', 'Burrowed'].includes(tx.transaction_category) && tx.transaction_nature === 'accrual' && tx.transaction_flow === 'inflow').reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
  const debtPayment = dashboardFilteredTransactions.filter(tx => ['Banking', 'Other Banking', 'Burrowed'].includes(tx.transaction_category) && tx.transaction_nature === 'cash' && tx.transaction_flow === 'outflow').reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
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
      if ((tx.transaction_nature === 'accrual' && tx.transaction_flow === 'inflow')) existing.income += Number(tx.amount);
      if ((tx.transaction_nature === 'accrual' && tx.transaction_flow === 'outflow')) existing.expense += Number(tx.amount);
    } else {
      acc.push({
        label: tx.month,
        income: (tx.transaction_nature === 'accrual' && tx.transaction_flow === 'inflow') ? Number(tx.amount) : 0,
        expense: (tx.transaction_nature === 'accrual' && tx.transaction_flow === 'outflow') ? Number(tx.amount) : 0,
      });
    }
    return acc;
  }, []);

  const dashCategoryData = uniqueCategories.map((cat) => {
    const catTxs = dashboardFilteredTransactions.filter((tx) => tx.transaction_category === cat);
    const income = catTxs.filter((tx) => (tx.transaction_nature === 'accrual' && tx.transaction_flow === 'inflow')).reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
    const expense = catTxs.filter((tx) => (tx.transaction_nature === 'accrual' && tx.transaction_flow === 'outflow')).reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
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

    const classIncome = matchedTxs.filter((tx) => (tx.transaction_nature === 'accrual' && tx.transaction_flow === 'inflow')).reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
    const classExpense = matchedTxs.filter((tx) => (tx.transaction_nature === 'accrual' && tx.transaction_flow === 'outflow')).reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
    const subReceipt = matchedTxs.filter((tx) => (tx.transaction_nature === 'cash' && tx.transaction_flow === 'inflow')).reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
    const subPayment = matchedTxs.filter((tx) => (tx.transaction_nature === 'cash' && tx.transaction_flow === 'outflow')).reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
    
    return { label, classIncome, classExpense, subReceipt, subPayment, total: classIncome + classExpense + subReceipt + subPayment };
  }).filter((t) => t.total > 0);

  const maxDashTimeVal = Math.max(...dashTimeData.map(t => Math.max(t.income, t.expense)), 1);

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
      .filter(tx => tx.from === fromName && (tx.transaction_nature === 'accrual' && tx.transaction_flow === 'inflow'))
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
      .filter(tx => tx.transaction_category === catName && (tx.transaction_nature === 'accrual' && tx.transaction_flow === 'outflow'))
      .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
    return { name: catName, amount };
  }).filter(c => c.amount > 0).sort((a, b) => b.amount - a.amount);
  const maxEntityCatExp = Math.max(...entityCatExpenses.map(c => c.amount), 1);

  // Payables & Receivables variables
  const pendingIncomeList = transactions.filter(tx => (tx.transaction_nature === 'accrual' && tx.transaction_flow === 'inflow') && tx.payment_status === 'Pending');
  const pendingExpenseList = transactions.filter(tx => (tx.transaction_nature === 'accrual' && tx.transaction_flow === 'outflow') && (tx.payment_status === 'Pending' || tx.payment_status === 'Overdue'));

  const totalReceivables = pendingIncomeList.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
  const totalPayables = pendingExpenseList.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

  const totalPendingExpensesCount = pendingExpenseList.length;
  const totalOverdueExpensesCount = pendingExpenseList.filter(tx => tx.payment_status === 'Overdue').length;
  const overdueRate = totalPendingExpensesCount > 0 ? (totalOverdueExpensesCount / totalPendingExpensesCount) * 100 : 0;


  // Fetch initial profile state and dashboard/transactions data on mount
  useEffect(() => {
    fetchKingdomData(GUEST_PROFILE_ID);
    fetchDashboardData(GUEST_PROFILE_ID);
  }, [fetchKingdomData, fetchDashboardData]);

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
    if (fromOptions && !fromOptions.includes(txFrom)) {
      setTxFrom(fromOptions[0] || '');
    }
  }, [fromOptions, txFrom]);

  useEffect(() => {
    if (statusOptions && !statusOptions.includes(txStatus)) {
      setTxStatus(statusOptions[0] || '');
    }
  }, [statusOptions, txStatus]);

  useEffect(() => {
    if (classOptions && !classOptions.includes(txClass)) {
      setTxClass(classOptions[0] || '');
    }
  }, [classOptions, txClass]);

  useEffect(() => {
    if (subClassOptions && !subClassOptions.includes(txSubClass)) {
      setTxSubClass(subClassOptions[0] || '');
    }
  }, [subClassOptions, txSubClass]);

  useEffect(() => {
    if (entityOptions && !entityOptions.includes(txEntity)) {
      const firstEntity = entityOptions[0] || '';
      setTxEntity(firstEntity);
      setTxCategory(entityMappings[firstEntity] || categoryOptions[0] || '');
    }
  }, [entityOptions, entityMappings, txEntity, categoryOptions]);

  useEffect(() => {
    if (categoryOptions && !categoryOptions.includes(txCategory)) {
      setTxCategory(categoryOptions[0] || '');
    }
  }, [categoryOptions, txCategory]);

  useEffect(() => {
    if (fromOptions && !fromOptions.includes(qaFrom)) {
      setQaFrom(fromOptions[0] || '');
    }
  }, [fromOptions, qaFrom]);

  useEffect(() => {
    if (statusOptions && !statusOptions.includes(qaStatus)) {
      setQaStatus(statusOptions[0] || '');
    }
  }, [statusOptions, qaStatus]);

  useEffect(() => {
    if (classOptions && !classOptions.includes(qaClass)) {
      setQaClass(classOptions[0] || '');
    }
  }, [classOptions, qaClass]);

  useEffect(() => {
    if (subClassOptions && !subClassOptions.includes(qaSubClass)) {
      setQaSubClass(subClassOptions[0] || '');
    }
  }, [subClassOptions, qaSubClass]);

  useEffect(() => {
    if (entityOptions && !entityOptions.includes(qaEntity)) {
      const firstEntity = entityOptions[0] || '';
      setQaEntity(firstEntity);
      setQaCategory(entityMappings[firstEntity] || categoryOptions[0] || '');
    }
  }, [entityOptions, entityMappings, qaEntity, categoryOptions]);

  const handleQaEntityChange = (entityVal) => {
    setQaEntity(entityVal);
    const mapped = entityMappings[entityVal];
    if (mapped) {
      setQaCategory(mapped);
    }
  };

  const renderSettingsPanel = () => {
    let title = '';
    let currentList = [];
    let showEntityCategorySelector = false;

    switch (selectedSettingType) {
      case 'from':
        title = t.manage_from;
        currentList = fromOptions;
        break;
      case 'status':
        title = t.manage_status;
        currentList = statusOptions;
        break;
      case 'class':
        title = t.manage_category;
        currentList = classOptions;
        break;
      case 'subClass':
        title = t.manage_subcategory;
        currentList = subClassOptions;
        break;
      case 'entity':
        title = t.manage_entity;
        currentList = entityOptions;
        showEntityCategorySelector = true;
        break;
      case 'category':
        title = t.manage_entityCategory;
        currentList = categoryOptions;
        break;
      case 'month':
        title = t.manage_month;
        currentList = monthOptions;
        break;
      case 'quickAction':
        title = t.manage_quick_actions || 'Manage Quick Actions';
        currentList = templates;
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
            transaction_nature: qaNature,
            transaction_flow: qaFlow,
            payment_status: qaStatus,
            description: qaDescription || `${qaName} action`,
            amount: qaAmount || '0'
          }
        };

        addOption('quickAction', nameVal, newTemplateData);
        setQaName('');
        setQaDescription('');
        setQaAmount('');
        toast.success(t('success_added_option', { val: nameVal }));
        return;
      }

      if (!newOptionVal.trim()) {
        toast.error(t.err_enter_value);
        return;
      }
      const val = newOptionVal.trim();
      if (currentList.includes(val)) {
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
        <div className="border-b border-[#8b4513]/20 pb-2 mb-4">
          <h3 className="title-font text-sm font-black text-[#4b2c20] uppercase">{title}</h3>
          <p className="text-[9px] text-[#5d4037]/75 font-bold uppercase tracking-wider font-sans">{t.official_ledger_editor}</p>
        </div>

        {/* Add option form */}
        {selectedSettingType === 'quickAction' ? (
          <form onSubmit={handleAddOptionSubmit} className="bg-[#faf4e5]/40 border border-[#8b4513]/15 rounded-xl p-3.5 mb-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-3 items-end">
              <div>
                <label className="block text-[9px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">Name</label>
                <input
                  type="text"
                  value={qaName}
                  onChange={(e) => setQaName(e.target.value)}
                  placeholder="e.g. Purchase Wood"
                  required
                  className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg h-11 md:h-[34px] px-3 text-xs font-bold text-[#4b2c20] placeholder-[#5d4037]/45 focus:outline-none focus:border-[#8b4513]/50"
                />
              </div>
              <div>
                <label className="block text-[9px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">Icon</label>
                <input
                  type="text"
                  value={qaIcon}
                  onChange={(e) => setQaIcon(e.target.value)}
                  placeholder="e.g. 🪵"
                  required
                  className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg h-11 md:h-[34px] px-3 text-xs font-bold text-[#4b2c20] placeholder-[#5d4037]/45 focus:outline-none focus:border-[#8b4513]/50"
                />
              </div>
              <div>
                <label className="block text-[9px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">Amount (Gold)</label>
                <input
                  type="number"
                  value={qaAmount}
                  onChange={(e) => setQaAmount(e.target.value)}
                  placeholder="e.g. 100"
                  required
                  className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg h-11 md:h-[34px] px-3 text-xs font-bold text-[#4b2c20] placeholder-[#5d4037]/45 focus:outline-none focus:border-[#8b4513]/50 font-mono"
                />
              </div>
              <div>
                <label className="block text-[9px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">Origin (From)</label>
                <select
                  value={qaFrom}
                  onChange={(e) => setQaFrom(e.target.value)}
                  className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg h-11 md:h-[34px] px-2 text-xs font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50"
                >
                  {fromOptions.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[9px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">Type (Class)</label>
                <select
                  value={qaClass}
                  onChange={(e) => setQaClass(e.target.value)}
                  className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg h-11 md:h-[34px] px-2 text-xs font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50"
                >
                  {classOptions.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[9px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">Subtype</label>
                <select
                  value={qaSubClass}
                  onChange={(e) => setQaSubClass(e.target.value)}
                  className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg h-11 md:h-[34px] px-2 text-xs font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50"
                >
                  {subClassOptions.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[9px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">Entity</label>
                <select
                  value={qaEntity}
                  onChange={(e) => handleQaEntityChange(e.target.value)}
                  className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg h-11 md:h-[34px] px-2 text-xs font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50 font-sans"
                >
                  {entityOptions.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[9px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">Category</label>
                <input
                  type="text"
                  value={qaCategory}
                  readOnly
                  className="w-full bg-[#faf4e5]/50 border border-[#8b4513]/10 rounded-lg h-11 md:h-[34px] px-3 text-xs font-bold text-[#4b2c20]/60 focus:outline-none cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-[9px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">Nature</label>
                <select
                  value={qaNature}
                  onChange={(e) => setQaNature(e.target.value)}
                  className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg h-11 md:h-[34px] px-2 text-xs font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50"
                >
                  <option value="cash">Cash</option>
                  <option value="accrual">Accrual</option>
                </select>
              </div>
              <div>
                <label className="block text-[9px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">Flow</label>
                <select
                  value={qaFlow}
                  onChange={(e) => setQaFlow(e.target.value)}
                  className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg h-11 md:h-[34px] px-2 text-xs font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50"
                >
                  <option value="inflow">Inflow</option>
                  <option value="outflow">Outflow</option>
                </select>
              </div>
              <div>
                <label className="block text-[9px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">Status</label>
                <select
                  value={qaStatus}
                  onChange={(e) => setQaStatus(e.target.value)}
                  className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg h-11 md:h-[34px] px-2 text-xs font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50"
                >
                  {statusOptions.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[9px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">Description</label>
                <input
                  type="text"
                  value={qaDescription}
                  onChange={(e) => setQaDescription(e.target.value)}
                  placeholder="e.g. Custom action"
                  className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg h-11 md:h-[34px] px-3 text-xs font-bold text-[#4b2c20] placeholder-[#5d4037]/45 focus:outline-none focus:border-[#8b4513]/50"
                />
              </div>
            </div>
            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="px-4 py-3 md:py-2 min-h-[44px] md:min-h-0 bg-[#8b4513] text-white font-black text-[10px] uppercase tracking-wider rounded-lg hover:scale-[1.02] active:scale-98 transition-all shadow border border-[#d4af37]/20 cursor-pointer flex items-center justify-center h-11 md:h-[34px]"
              >
                ➕ {t.add}
              </button>
            </div>
          </form>
        ) : (
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
                  className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg h-11 md:h-[34px] px-3 text-xs font-bold text-[#4b2c20] placeholder-[#5d4037]/45 focus:outline-none focus:border-[#8b4513]/50"
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
                    className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg h-11 md:h-[34px] px-2 text-xs font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50"
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
                  className="px-4 py-3 md:py-2 min-h-[44px] md:min-h-0 bg-[#8b4513] text-white font-black text-[10px] uppercase tracking-wider rounded-lg hover:scale-[1.02] active:scale-98 transition-all shadow border border-[#d4af37]/20 cursor-pointer flex items-center justify-center"
                >
                  ➕ {t.add}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* List of items */}
        <div className="flex-1 overflow-y-auto border border-[#8b4513]/20 rounded-xl bg-[#faf4e5]/20 custom-scrollbar">
          {currentList.length > 0 ? (
            selectedSettingType === 'quickAction' ? (
              <table className="w-full text-left border-collapse text-[10px] font-sans">
                <thead>
                  <tr className="bg-[#8b4513]/10 border-b border-[#8b4513]/20 text-[#4b2c20] font-black uppercase tracking-wider title-font">
                    <th className="py-2 px-3">Action</th>
                    <th className="py-2 px-3">Type/Subtype</th>
                    <th className="py-2 px-3">Entity</th>
                    <th className="py-2 px-3">Amount</th>
                    <th className="py-2 px-3 text-right">{t.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#8b4513]/10 text-stone-700 font-bold">
                  {currentList.map((tpl) => (
                    <tr key={tpl.name} className="hover:bg-[#8b4513]/5 transition-colors">
                      <td className="py-2 px-3 font-bold text-[#4b2c20]">
                        <span className="mr-1.5">{tpl.icon}</span>
                        {t(`tpl_${tpl.name.toLowerCase().replace(/\s+/g, '_')}`, tpl.name)}
                      </td>
                      <td className="py-2 px-3 text-stone-500 font-medium">
                        {tpl.data.transaction_type} • {tpl.data.transaction_subtype}
                      </td>
                      <td className="py-2 px-3 text-stone-500 font-medium">{tpl.data.entity}</td>
                      <td className="py-2 px-3 font-mono text-[#4b2c20]">{tpl.data.amount} G</td>
                      <td className="py-2 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteOption(tpl.name)}
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
            ) : (
              <table className="w-full text-left border-collapse text-[10px] font-sans">
                <thead>
                  <tr className="bg-[#8b4513]/10 border-b border-[#8b4513]/20 text-[#4b2c20] font-black uppercase tracking-wider title-font">
                    <th className="py-2 px-3">{t.value}</th>
                    {selectedSettingType === 'entity' && <th className="py-2 px-3">{t.default_category}</th>}
                    <th className="py-2 px-3 text-right">{t.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#8b4513]/10 text-stone-700 font-bold">
                  {currentList.map((val) => (
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
            )
          ) : (
            <p className="text-center py-8 text-xs text-[#5d4037]/60 italic font-serif">
              {t.no_options_registered}
            </p>
          )}
        </div>
      </div>
    );
  };

  const resetFormState = () => {
    setTxClass('income');
    setTxAmount('');
    setTxFrom(fromOptions[0] || 'Pedro');
    setTxValueDate(new Date().toISOString().split('T')[0]);
    setTxPostingDate(new Date().toISOString().split('T')[0]);
    setTxStatus(statusOptions[0] || 'Pending');
    setTxClass(classOptions[0] || 'Income');
    setTxSubClass(subClassOptions[0] || 'Cash receipt');
    setTxEntity(entityOptions[0] || 'Salary');
    setTxCategory(entityMappings[entityOptions[0]] || 'Payroll');
    setTxDescription('');
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
    if (tabId === 'dashboard') {
      setIsTreasuryMenuOpen(true);
    } else {
      setActiveTab(tabId);
    }
  };

  const exportCSV = () => handleExportCSV(transactions, t);
  const importCSV = (e) => handleImportCSV(e, { t, fromOptions, registerTransactions, GUEST_PROFILE_ID });

  const handleToggleSelectAll = () => {
    if (selectedTxIds.length === transactions.length) {
      setSelectedTxIds([]);
      if (isEditing) {
        setIsEditing(false);
        setEditingTxs({});
      }
    } else {
      setSelectedTxIds(transactions.map((tx) => tx.id));
    }
  };

  const handleToggleSelect = (txId) => {
    setSelectedTxIds((prev) => {
      const isSelected = prev.includes(txId);
      const nextSelected = isSelected
        ? prev.filter((id) => id !== txId)
        : [...prev, txId];
      
      if (isEditing) {
        setEditingTxs((prevEdit) => {
          const nextEdit = { ...prevEdit };
          if (isSelected) {
            delete nextEdit[txId];
          } else {
            const tx = transactions.find((t) => t.id === txId);
            if (tx) {
              nextEdit[txId] = { ...tx };
            }
          }
          return nextEdit;
        });
      }
      return nextSelected;
    });
  };

  const handleStartEditing = () => {
    if (selectedTxIds.length === 0) return;
    const initial = {};
    selectedTxIds.forEach((id) => {
      const tx = transactions.find((t) => t.id === id);
      if (tx) {
        initial[id] = { ...tx };
      }
    });
    setEditingTxs(initial);
    setIsEditing(true);
  };

  const handleCancelEditing = () => {
    setIsEditing(false);
    setSelectedTxIds([]);
    setEditingTxs({});
  };

  const handleFieldChange = (txId, field, value) => {
    setEditingTxs(prev => {
      const updatedTx = { ...prev[txId], [field]: value };
      if (field === 'entity' && entityMappings[value]) {
        updatedTx.transaction_category = entityMappings[value];
      }
      return {
        ...prev,
        [txId]: updatedTx
      };
    });
  };

  const handleSaveEdits = async () => {
    const toastId = toast.loading(t('saving_ledger') || 'Saving ledger changes...');
    try {
      const upsertRows = Object.values(editingTxs).map(tx => {
        const postingDate = tx.posting_date || new Date().toISOString().split('T')[0];
        const valueDate = tx.value_date || postingDate;
        const dateObj = new Date(postingDate);
        const year = dateObj.getFullYear();
        const month = tx.month || dateObj.toLocaleString('default', { month: 'long' });
        const quarter = 'Q' + (Math.floor(dateObj.getMonth() / 3) + 1);

        return {
          id: tx.id,
          profile_id: tx.profile_id,
          from: tx.from,
          payment_status: tx.payment_status,
          transaction_type: tx.transaction_type,
          transaction_nature: tx.transaction_nature,
          transaction_flow: tx.transaction_flow,
          transaction_subtype: tx.transaction_subtype,
          entity: tx.entity,
          amount: Number(tx.amount),
          description: tx.description,
          transaction_category: entityMappings[tx.entity] || tx.transaction_category || 'Other Banking',
          value_date: valueDate,
          posting_date: postingDate,
          month,
          year,
          quarter
        };
      });

      const { error } = await supabase
        .from('transactions')
        .upsert(upsertRows);

      if (error) throw error;

      toast.success(t('success_saved_changes') || 'Changes saved successfully!', { id: toastId });
      setIsEditing(false);
      setSelectedTxIds([]);
      setEditingTxs({});

      // Sync both store state and profile stats
      await fetchKingdomData(GUEST_PROFILE_ID);
      await fetchDashboardData(GUEST_PROFILE_ID);
    } catch (err) {
      console.error('Error saving edits:', err);
      toast.error(`${t('err_save_failed') || 'Save failed'}: ${err.message || err}`, { id: toastId });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!txAmount || isNaN(txAmount) || Number(txAmount) <= 0) {
      toast.error(t.err_invalid_amount);
      return;
    }
    if (!txFrom) {
      toast.error(t.err_invalid_from);
      return;
    }

    const amountNum = Number(txAmount);

    const res = await registerTransaction(GUEST_PROFILE_ID, {
      transaction_type: txClass,
      amount: amountNum,
      from: txFrom,
      value_date: txValueDate,
      posting_date: txPostingDate,
      payment_status: txStatus,
      transaction_subtype: txSubClass,
      entity: txEntity,
      transaction_category: txCategory,
      transaction_nature: txNature,
      transaction_flow: txFlow,
      subCategory: txSubCategory,
      description: txDescription || `${txClass} log`
    });

    if (res.success) {
      toast.success(
        txClass === 'Income'
          ? t('success_added_gold', { amount: amountNum })
          : t('success_spent_gold', { amount: amountNum })
      );
      setTxAmount('');
      setTxDescription('');
      setTxFrom(fromOptions[0] || 'Pedro');
      setTxSubClass(subClassOptions[0] || 'Cash receipt');
      setTxEntity(entityOptions[0] || 'Salary');
      setTxCategory(entityMappings[entityOptions[0]] || 'Payroll');
      setTxValueDate(new Date().toISOString().split('T')[0]);
      setTxPostingDate(new Date().toISOString().split('T')[0]);
      setTxStatus(statusOptions[0] || 'Pending');
      setTxClass(classOptions[0] || 'Income');
      setIsMineModalOpen(false);
      setIsNewTxModalOpen(false);
    } else {
      toast.error(t('err_transaction_failed', { error: res.error }));
    }
  };

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
      <div className="game-viewport">
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
            className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          >
            <div className="bg-[#f4e4bc] w-full max-w-4xl max-h-[80%] rounded-xl border-[8px] border-[#5d4037] shadow-[0_0_50px_rgba(0,0,0,0.9)] relative flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
              
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
                className="absolute -top-1 -right-1 w-12 h-12 bg-[#8b0000] rounded-full flex items-center justify-center border-4 border-[#5d0000] z-[110] shadow-[0_4px_10px_rgba(0,0,0,0.5)] active:scale-90 transition-transform group"
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
                <div className="w-1/3 min-w-[150px] border-r border-[#8b4513]/25 pr-3 flex flex-col gap-1.5 overflow-y-auto custom-scrollbar-subtle">
                  <h4 className="text-[10px] font-black uppercase text-[#8b4513]/70 tracking-widest mb-1.5 pl-1 title-font">{t.kingdom_lists}</h4>
                  {[
                    { id: 'from', label: t.manage_from, icon: '👤' },
                    { id: 'status', label: t.manage_status, icon: '📊' },
                    { id: 'class', label: t.manage_category, icon: '📁' },
                    { id: 'subClass', label: t.manage_subcategory, icon: '📂' },
                    { id: 'entity', label: t.manage_entity, icon: '🏢' },
                    { id: 'category', label: t.manage_entityCategory, icon: '🏷️' },
                    { id: 'month', label: t.manage_month, icon: '📅' },
                    { id: 'quickAction', label: t.manage_quick_actions || 'Manage Quick Actions', icon: '⚡' }
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
                        className={`text-left px-3 py-3 md:py-2 rounded-lg font-black text-[10px] uppercase tracking-wider transition-all border cursor-pointer min-h-[44px] md:min-h-0 flex items-center ${
                          isSel
                            ? 'bg-[#8b4513]/20 border-[#8b4513] text-[#4b2c20] shadow-inner font-black scale-[1.02]'
                            : 'bg-[#faf4e5]/80 border-[#8b4513]/10 text-[#5d4037]/80 hover:bg-[#8b4513]/5 hover:text-[#4b2c20]'
                        }`}
                      >
                        <span className="mr-1.5">{btn.icon}</span>
                        {btn.label}
                      </button>
                    );
                  })}
                </div>

                {/* Right Settings Detail Panel */}
                <div className="flex-1 flex flex-col overflow-hidden pl-1">
                  {renderSettingsPanel()}
                </div>

              </div>

            </div>
          </div>
        )}

        {/* Navegação Inferior (Estática) */}
        <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />

        {/* Modal do Menu da Tesouraria Real */}
        <Modal
          isOpen={isTreasuryMenuOpen}
          onClose={() => setIsTreasuryMenuOpen(false)}
          title={t('treasury_menu_title', 'Royal Treasury Menu')}
          size="max-w-lg"
        >
          <div className="flex flex-col gap-3.5 max-w-md mx-auto w-full">
            {/* Register Transaction (Top) */}
            <button
              type="button"
              onClick={() => {
                handleNewTxClick();
                setIsTreasuryMenuOpen(false);
              }}
              className="group relative flex items-center gap-3.5 p-3 rounded-xl border-2 border-[#8b4513]/30 bg-[#faf4e5]/80 hover:bg-[#8b4513] text-[#4b2c20] hover:text-[#ffd700] hover:border-[#ffd700]/50 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm text-left cursor-pointer"
            >
              <div className="w-10 h-10 rounded-lg bg-[#8b4513]/10 group-hover:bg-white/10 flex items-center justify-center text-xl border border-[#8b4513]/25 group-hover:border-white/20 flex-shrink-0">
                ➕
              </div>
              <div className="flex-grow min-w-0">
                <h3 className="font-serif font-black text-xs uppercase tracking-wide leading-tight">
                  {t('menu_register_transaction', 'Register Transaction')}
                </h3>
                <p className="text-[9px] opacity-80 font-serif italic mt-0.5 leading-tight">
                  {t('menu_register_transaction_desc', 'Record a new gold coin movement, income, expense, payable, receivable or debt.')}
                </p>
              </div>
            </button>

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
          </div>
        </Modal>

        {/* Modal da Mina de Ouro (Ledger de Transações - Widescreen Layout) */}
        <Modal
          isOpen={isMineModalOpen}
          onClose={() => setIsMineModalOpen(false)}
          title={t.ledger_transactions}
          size="max-w-6xl"
        >
          <div className="space-y-6">
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

              {/* Row 3: Nature & Flow */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 mt-2">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">
                    Nature
                  </label>
                  <select
                    value={txNature}
                    onChange={(e) => setTxNature(e.target.value)}
                    className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg h-11 md:h-[38px] px-2 text-xs font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50"
                  >
                    <option value="cash">Cash</option>
                    <option value="accrual">Accrual</option>
                  </select>
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

            {/* Transactions History Table Section */}
            <div className="border-t border-[#8b4513]/20 pt-4 space-y-3">
              <h4 className="title-font text-sm font-black text-[#4b2c20] uppercase flex justify-between items-center">
                <span>{t.ledger_transactions}</span>
                <span className="text-[9px] font-sans font-bold text-[#5d4037]/60 tracking-normal normal-case">
                  {t.treasury_books}
                </span>
              </h4>

              {/* Action Bar for Batch Editing */}
              {selectedTxIds.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-2 bg-[#faf4e5]/90 border border-[#8b4513]/30 rounded-xl p-3 shadow-md animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center gap-2 pl-2">
                    <span className="w-1.5 h-1.5 bg-[#8b4513] rounded-full animate-pulse" />
                    <span className="text-[9px] font-black uppercase text-[#4b2c20] tracking-wider">
                      {selectedTxIds.length} {selectedTxIds.length === 1 ? (t('item_selected') || 'item selected') : (t('items_selected') || 'items selected')}
                    </span>
                  </div>
                  <div className="flex gap-2 pr-2 py-1">
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          onClick={handleSaveEdits}
                          className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-[9px] uppercase tracking-wider rounded-lg shadow-sm hover:scale-[1.02] active:scale-98 transition-all flex items-center justify-center gap-1 cursor-pointer"
                        >
                          💾 {t('save') || 'Save'}
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelEditing}
                          className="px-3 py-1.5 bg-[#8b0000] hover:bg-[#8b0000]/90 text-[#ffd700] font-black text-[9px] uppercase tracking-wider rounded-lg shadow-sm hover:scale-[1.02] active:scale-98 transition-all flex items-center justify-center gap-1 cursor-pointer"
                        >
                          ❌ {t('cancel') || 'Cancel'}
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={handleStartEditing}
                        className="px-3 py-1.5 bg-[#8b4513] hover:bg-[#8b4513]/90 text-[#ffd700] font-black text-[9px] uppercase tracking-wider rounded-lg shadow-sm hover:scale-[1.02] active:scale-98 transition-all flex items-center justify-center gap-1 cursor-pointer"
                      >
                        ✏️ {t('edit') || 'Edit'}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Responsive Table with horizontal scroll */}
              <div className="max-h-64 overflow-y-auto border border-[#8b4513]/25 rounded-xl bg-[#faf4e5]/40 custom-scrollbar">
                {transactions && transactions.length > 0 ? (
                  <>
                    {/* Desktop table view */}
                    <table className="hidden md:table w-full text-left border-collapse text-[10px] font-sans">
                      <thead>
                        <tr className="bg-[#8b4513]/10 border-b border-[#8b4513]/20 text-[#4b2c20] font-black uppercase tracking-wider title-font">
                          <th className="py-2.5 px-3 w-8 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={handleToggleSelectAll}
                              className={`w-3.5 h-3.5 rounded border flex items-center justify-center cursor-pointer mx-auto transition-all focus:outline-none ${
                                selectedTxIds.length === transactions.length && transactions.length > 0
                                  ? 'bg-[#8b4513] border-[#8b4513]'
                                  : 'bg-[#faf4e5]/80 border-[#8b4513]/40 hover:bg-[#8b4513]/10'
                              }`}
                            >
                              {selectedTxIds.length === transactions.length && transactions.length > 0 && (
                                <div className="w-1.5 h-1.5 bg-[#ffd700] rounded-sm" />
                              )}
                            </button>
                          </th>
                          <th className="py-2.5 px-3 whitespace-nowrap">{t('ledger.headers.from')}</th>
                          <th className="py-2.5 px-3 whitespace-nowrap">{t('ledger.headers.status')}</th>
                          <th className="py-2.5 px-3 whitespace-nowrap">{t('ledger.headers.class')}</th>
                          <th className="py-2.5 px-3 whitespace-nowrap">{t('ledger.headers.sub_class')}</th>
                          <th className="py-2.5 px-3 whitespace-nowrap">{t('ledger.headers.entity')}</th>
                          <th className="py-2.5 px-3 whitespace-nowrap text-right">{t('ledger.headers.amount')}</th>
                          <th className="py-2.5 px-3 whitespace-nowrap">{t.description}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#8b4513]/10 text-stone-700 font-bold">
                        {transactions.map((tx) => {
                          const isSelected = selectedTxIds.includes(tx.id);
                          const isRowEditing = isEditing && isSelected;
                          return (
                            <tr 
                              key={tx.id} 
                              className={`hover:bg-[#8b4513]/5 transition-all ${
                                isEditing && !isSelected ? 'opacity-50' : ''
                              }`}
                            >
                              <td className="py-2 px-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleToggleSelect(tx.id)}
                                  className={`w-3.5 h-3.5 rounded border flex items-center justify-center cursor-pointer mx-auto transition-all focus:outline-none ${
                                    isSelected
                                      ? 'bg-[#8b4513] border-[#8b4513]'
                                      : 'bg-[#faf4e5]/80 border-[#8b4513]/40 hover:bg-[#8b4513]/10'
                                  }`}
                                >
                                  {isSelected && (
                                    <div className="w-1.5 h-1.5 bg-[#ffd700] rounded-sm" />
                                  )}
                                </button>
                              </td>
                              
                              {isRowEditing ? (
                                <>
                                  {/* from */}
                                  <td className="py-1 px-1 whitespace-nowrap">
                                    <select
                                      value={editingTxs[tx.id]?.from || ''}
                                      onChange={(e) => handleFieldChange(tx.id, 'from', e.target.value)}
                                      className="bg-[#faf4e5]/90 border border-[#8b4513]/30 rounded text-[9px] font-bold text-[#4b2c20] w-full px-1 py-0.5 focus:outline-none"
                                    >
                                      {fromOptions.map((opt) => (
                                        <option key={opt} value={opt}>{opt}</option>
                                      ))}
                                    </select>
                                  </td>
                                  {/* status */}
                                  <td className="py-1 px-1 whitespace-nowrap">
                                    <select
                                      value={editingTxs[tx.id]?.payment_status || ''}
                                      onChange={(e) => handleFieldChange(tx.id, 'payment_status', e.target.value)}
                                      className="bg-[#faf4e5]/90 border border-[#8b4513]/30 rounded text-[9px] font-bold text-[#4b2c20] w-full px-1 py-0.5 focus:outline-none"
                                    >
                                      {statusOptions.map((opt) => (
                                        <option key={opt} value={opt}>{opt}</option>
                                      ))}
                                    </select>
                                  </td>
                                  {/* class */}
                                  <td className="py-1 px-1 whitespace-nowrap">
                                    <select
                                      value={editingTxs[tx.id]?.transaction_type || ''}
                                      onChange={(e) => handleFieldChange(tx.id, 'transaction_type', e.target.value)}
                                      className="bg-[#faf4e5]/90 border border-[#8b4513]/30 rounded text-[9px] font-bold text-[#4b2c20] w-full px-1 py-0.5 focus:outline-none"
                                    >
                                      {classOptions.map((opt) => (
                                        <option key={opt} value={opt}>{opt}</option>
                                      ))}
                                    </select>
                                  </td>
                                  {/* subclass */}
                                  <td className="py-1 px-1 whitespace-nowrap">
                                    <select
                                      value={editingTxs[tx.id]?.transaction_subtype || ''}
                                      onChange={(e) => handleFieldChange(tx.id, 'transaction_subtype', e.target.value)}
                                      className="bg-[#faf4e5]/90 border border-[#8b4513]/30 rounded text-[9px] font-bold text-[#4b2c20] w-full px-1 py-0.5 focus:outline-none"
                                    >
                                      {subClassOptions.map((opt) => (
                                        <option key={opt} value={opt}>{opt}</option>
                                      ))}
                                    </select>
                                  </td>
                                  {/* entity */}
                                  <td className="py-1 px-1 whitespace-nowrap">
                                    <select
                                      value={editingTxs[tx.id]?.entity || ''}
                                      onChange={(e) => handleFieldChange(tx.id, 'entity', e.target.value)}
                                      className="bg-[#faf4e5]/90 border border-[#8b4513]/30 rounded text-[9px] font-bold text-[#4b2c20] w-full px-1 py-0.5 focus:outline-none font-sans"
                                    >
                                      {Object.entries(
                                        entityOptions.reduce((acc, opt) => {
                                          const cat = entityMappings[opt] || 'Uncategorized';
                                          if (!acc[cat]) acc[cat] = [];
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
                                  </td>
                                  {/* amount */}
                                  <td className="py-1 px-1 whitespace-nowrap">
                                    <input
                                      type="number"
                                      value={editingTxs[tx.id]?.amount || ''}
                                      onChange={(e) => handleFieldChange(tx.id, 'amount', e.target.value)}
                                      className="bg-[#faf4e5]/90 border border-[#8b4513]/30 rounded text-[9px] font-bold text-[#4b2c20] w-full px-1 py-0.5 focus:outline-none font-mono text-right"
                                    />
                                  </td>
                                  {/* description */}
                                  <td className="py-1 px-1 whitespace-nowrap">
                                    <input
                                      type="text"
                                      value={editingTxs[tx.id]?.description || ''}
                                      onChange={(e) => handleFieldChange(tx.id, 'description', e.target.value)}
                                      className="bg-[#faf4e5]/90 border border-[#8b4513]/30 rounded text-[9px] font-bold text-[#4b2c20] w-full px-1 py-0.5 focus:outline-none"
                                    />
                                  </td>
                                </>
                              ) : (
                                <>
                                  <td className="py-2 px-3 whitespace-nowrap font-bold text-[#4b2c20]">{tx.from || '-'}</td>
                                  <td className="py-2 px-3 whitespace-nowrap">
                                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                                      tx.payment_status === 'Completed' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                                      tx.payment_status === 'Paid on Time' ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' :
                                      tx.payment_status === 'Pending' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                                      tx.payment_status === 'Overdue' ? 'bg-red-100 text-red-800 border border-red-200' :
                                      'bg-stone-100 text-stone-800 border border-stone-200'
                                    }`}>
                                      {tx.payment_status || 'Completed'}
                                    </span>
                                  </td>
                                  <td className="py-2 px-3 whitespace-nowrap">
                                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                                      (tx.transaction_nature === 'accrual' && tx.transaction_flow === 'inflow') 
                                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-250' 
                                        : 'bg-rose-100 text-rose-800 border border-rose-250'
                                    }`}>
                                      {tx.transaction_type}
                                    </span>
                                  </td>
                                  <td className="py-2 px-3 whitespace-nowrap text-stone-600">{tx.transaction_subtype || '-'}</td>
                                  <td className="py-2 px-3 whitespace-nowrap text-stone-600">{tx.entity || '-'}</td>
                                  <td className={`py-2 px-3 whitespace-nowrap text-right font-mono font-black ${
                                    (tx.transaction_nature === 'accrual' && tx.transaction_flow === 'inflow') ? 'text-emerald-700' : 'text-rose-700'
                                  }`}>
                                    {formatNumberCompact((tx.transaction_nature === 'accrual' && tx.transaction_flow === 'inflow') ? Number(tx.amount) : -Number(tx.amount))}
                                  </td>
                                  <td className="py-2 px-3 whitespace-nowrap text-stone-500 max-w-[150px] truncate" title={tx.description || ''}>{tx.description || '-'}</td>
                                </>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>

                    {/* Mobile cards view */}
                    <div className="grid grid-cols-1 gap-2.5 p-3 md:hidden">
                      {transactions.map((tx) => {
                        const isSelected = selectedTxIds.includes(tx.id);
                        const isCardEditing = isEditing && isSelected;
                        return (
                          <div 
                            key={tx.id} 
                            className={`bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-xl p-3 shadow-sm flex flex-col gap-2 relative overflow-hidden transition-all ${
                              isEditing && !isSelected ? 'opacity-50' : ''
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleToggleSelect(tx.id)}
                                  className={`w-3.5 h-3.5 rounded border flex items-center justify-center cursor-pointer transition-all focus:outline-none ${
                                    isSelected
                                      ? 'bg-[#8b4513] border-[#8b4513]'
                                      : 'bg-[#faf4e5]/80 border-[#8b4513]/40 hover:bg-[#8b4513]/10'
                                  }`}
                                >
                                  {isSelected && (
                                    <div className="w-1.5 h-1.5 bg-[#ffd700] rounded-sm" />
                                  )}
                                </button>
                                <span className="text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider bg-[#8b4513]/10 text-[#4b2c20]">
                                  {tx.entity || tx.transaction_type}
                                </span>
                              </div>
                              <div className="text-right">
                                <div className={`font-mono font-black text-xs ${(tx.transaction_nature === 'accrual' && tx.transaction_flow === 'inflow') ? 'text-emerald-700' : 'text-rose-700'}`}>
                                  {formatNumberCompact((tx.transaction_nature === 'accrual' && tx.transaction_flow === 'inflow') ? Number(tx.amount) : -Number(tx.amount))}
                                </div>
                                <span className={`inline-block text-[8px] font-black px-1.5 py-0.5 rounded mt-1 ${
                                  tx.payment_status === 'Completed' 
                                    ? 'bg-green-100 text-green-800 border border-green-200' 
                                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                                }`}>
                                  {tx.payment_status || 'Completed'}
                                </span>
                              </div>
                            </div>
                            
                            {isCardEditing ? (
                              <div className="grid grid-cols-2 gap-2 mt-1 border-t border-[#8b4513]/10 pt-2">
                                <div>
                                  <label className="block text-[8px] font-black uppercase text-[#5d4037]/80 mb-0.5">From</label>
                                  <select
                                    value={editingTxs[tx.id]?.from || ''}
                                    onChange={(e) => handleFieldChange(tx.id, 'from', e.target.value)}
                                    className="w-full bg-[#faf4e5]/90 border border-[#8b4513]/30 rounded text-[9px] font-bold text-[#4b2c20] px-1 py-0.5 focus:outline-none"
                                  >
                                    {fromOptions.map((opt) => (
                                      <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-[8px] font-black uppercase text-[#5d4037]/80 mb-0.5">Status</label>
                                  <select
                                    value={editingTxs[tx.id]?.payment_status || ''}
                                    onChange={(e) => handleFieldChange(tx.id, 'payment_status', e.target.value)}
                                    className="w-full bg-[#faf4e5]/90 border border-[#8b4513]/30 rounded text-[9px] font-bold text-[#4b2c20] px-1 py-0.5 focus:outline-none"
                                  >
                                    {statusOptions.map((opt) => (
                                      <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-[8px] font-black uppercase text-[#5d4037]/80 mb-0.5">Class</label>
                                  <select
                                    value={editingTxs[tx.id]?.transaction_type || ''}
                                    onChange={(e) => handleFieldChange(tx.id, 'transaction_type', e.target.value)}
                                    className="w-full bg-[#faf4e5]/90 border border-[#8b4513]/30 rounded text-[9px] font-bold text-[#4b2c20] px-1 py-0.5 focus:outline-none"
                                  >
                                    {classOptions.map((opt) => (
                                      <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-[8px] font-black uppercase text-[#5d4037]/80 mb-0.5">Subclass</label>
                                  <select
                                    value={editingTxs[tx.id]?.transaction_subtype || ''}
                                    onChange={(e) => handleFieldChange(tx.id, 'transaction_subtype', e.target.value)}
                                    className="w-full bg-[#faf4e5]/90 border border-[#8b4513]/30 rounded text-[9px] font-bold text-[#4b2c20] px-1 py-0.5 focus:outline-none"
                                  >
                                    {subClassOptions.map((opt) => (
                                      <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-[8px] font-black uppercase text-[#5d4037]/80 mb-0.5">Entity</label>
                                  <select
                                    value={editingTxs[tx.id]?.entity || ''}
                                    onChange={(e) => handleFieldChange(tx.id, 'entity', e.target.value)}
                                    className="w-full bg-[#faf4e5]/90 border border-[#8b4513]/30 rounded text-[9px] font-bold text-[#4b2c20] px-1 py-0.5 focus:outline-none font-sans"
                                  >
                                    {Object.entries(
                                      entityOptions.reduce((acc, opt) => {
                                        const cat = entityMappings[opt] || 'Uncategorized';
                                        if (!acc[cat]) acc[cat] = [];
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
                                <div>
                                  <label className="block text-[8px] font-black uppercase text-[#5d4037]/80 mb-0.5">Amount</label>
                                  <input
                                    type="number"
                                    value={editingTxs[tx.id]?.amount || ''}
                                    onChange={(e) => handleFieldChange(tx.id, 'amount', e.target.value)}
                                    className="w-full bg-[#faf4e5]/90 border border-[#8b4513]/30 rounded text-[9px] font-bold text-[#4b2c20] px-1 py-0.5 focus:outline-none font-mono"
                                  />
                                </div>
                                <div className="col-span-2">
                                  <label className="block text-[8px] font-black uppercase text-[#5d4037]/80 mb-0.5">Description</label>
                                  <input
                                    type="text"
                                    value={editingTxs[tx.id]?.description || ''}
                                    onChange={(e) => handleFieldChange(tx.id, 'description', e.target.value)}
                                    className="w-full bg-[#faf4e5]/90 border border-[#8b4513]/30 rounded text-[9px] font-bold text-[#4b2c20] px-1 py-0.5 focus:outline-none"
                                  />
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="text-[10px] font-bold text-[#5d4037]/80 mt-1">
                                  {tx.from} • {tx.transaction_subtype || '-'}
                                </div>
                                <div className="border-t border-[#8b4513]/10 pt-2 flex justify-between text-[8.5px] text-stone-500 font-bold">
                                  <span>📅 V: {tx.value_date} | P: {tx.posting_date} ({tx.month} {tx.year})</span>
                                  <span className="uppercase text-[8px] bg-[#8b4513]/10 text-[#4b2c20] px-1 rounded">{tx.transaction_category || '-'}</span>
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <p className="text-center py-8 text-xs text-[#5d4037]/60 italic font-serif">
                    {t.no_options_registered}
                  </p>
                )}
              </div>
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
          size="max-w-4xl"
        >
          <div className="flex flex-col md:flex-row gap-6">
            {/* Quick Actions Sidebar (Left) */}
            <div className="w-full md:w-40 bg-[#faf4e5]/60 border border-[#8b4513]/20 rounded-xl p-3 flex flex-col gap-2.5 flex-shrink-0 shadow-sm">
              <h4 className="text-[9.5px] font-black uppercase tracking-widest text-[#4b2c20] border-b border-[#8b4513]/15 pb-2 mb-1 flex items-center gap-1.5 font-sans">
                ⚡ {t('quick_actions', 'Quick Actions')}
              </h4>
              <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto custom-scrollbar-subtle pr-1">
                {templates.map((tpl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => applyTemplate(tpl)}
                    className="w-full text-left p-2 py-1.5 rounded-lg border border-[#8b4513]/25 bg-[#faf4e5]/90 hover:bg-[#8b4513] text-[#4b2c20] hover:text-[#ffd700] transition-all text-[8.5px] font-bold uppercase tracking-wider font-sans cursor-pointer flex items-center gap-1.5 shadow-sm"
                  >
                    <span className="text-xs">{tpl.icon}</span>
                    <span className="truncate">{t(`tpl_${tpl.name.toLowerCase().replace(/\s+/g, '_')}`, tpl.name)}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Main Form Area (Right) */}
            <div className="flex-grow space-y-6">
            <div className="flex items-center gap-4 border-b border-[#8b4513]/20 pb-4">
              <div className="w-12 h-12 bg-[#8b4513]/10 rounded-full flex items-center justify-center border-2 border-[#8b4513]/20 text-2xl">
                ➕
              </div>
              <div>
                <h3 className="title-font text-lg font-black text-[#4b2c20] uppercase">{t.register_movement}</h3>
                <p className="text-[10px] text-[#5d4037]/75 font-bold uppercase tracking-wider">{t.gold_mine_commerce}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Row 1 */}
              <div className="grid grid-cols-12 gap-4">
                {/* From */}
                <div className="col-span-12 sm:col-span-6 md:col-span-3">
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
                <div className="col-span-12 sm:col-span-6 md:col-span-3">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">
                    {t.value_date}
                  </label>
                  <input
                    type="date"
                    value={txValueDate}
                    onChange={(e) => setTxValueDate(e.target.value)}
                    required
                    className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg h-11 md:h-[38px] px-2 text-xs font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50"
                  />
                </div>

                {/* Posting Date */}
                <div className="col-span-12 sm:col-span-6 md:col-span-3">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">
                    {t.posting_date}
                  </label>
                  <input
                    type="date"
                    value={txPostingDate}
                    onChange={(e) => setTxPostingDate(e.target.value)}
                    required
                    className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg h-11 md:h-[38px] px-2 text-xs font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50"
                  />
                </div>

                {/* Amount */}
                <div className="col-span-12 sm:col-span-6 md:col-span-3">
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
                    className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg h-11 md:h-[38px] px-2.5 text-xs font-bold text-[#4b2c20] placeholder-[#5d4037]/45 focus:outline-none focus:border-[#8b4513]/50"
                  />
                </div>
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-12 gap-4">
                {/* Status */}
                <div className="col-span-12 sm:col-span-6 md:col-span-3">
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

                {/* Class */}
                <div className="col-span-12 sm:col-span-6 md:col-span-3">
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

                {/* Subclass */}
                <div className="col-span-12 sm:col-span-6 md:col-span-3">
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
                <div className="col-span-12 sm:col-span-6 md:col-span-3">
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
                        if (!acc[cat]) acc[cat] = [];
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
              </div>

              {/* Row 3 */}
              <div className="grid grid-cols-12 gap-4">
                {/* Nature */}
                <div className="col-span-12 sm:col-span-6 md:col-span-3">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">
                    Nature
                  </label>
                  <select
                    value={txNature}
                    onChange={(e) => setTxNature(e.target.value)}
                    className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg h-11 md:h-[38px] px-2 text-xs font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50"
                  >
                    <option value="cash">Cash</option>
                    <option value="accrual">Accrual</option>
                  </select>
                </div>

                {/* Flow */}
                <div className="col-span-12 sm:col-span-6 md:col-span-3">
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
                  </select>
                </div>

                {/* Description / Notes */}
                <div className="col-span-12 md:col-span-6">
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

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-[#8b4513] text-white font-black text-xs uppercase tracking-widest rounded-xl hover:scale-[1.01] active:scale-99 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md border-2 border-[#d4af37]/30 cursor-pointer"
              >
                {isLoading ? `${t.register_movement}...` : t.save_transaction}
              </button>
            </form>
            </div>
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
            className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          >
            <div className="bg-[#f4e4bc] w-full max-w-6xl h-[88%] rounded-xl border-[8px] border-[#5d4037] shadow-[0_0_50px_rgba(0,0,0,0.9)] relative flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
              
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
                className="absolute -top-1 -right-1 w-12 h-12 bg-[#8b0000] rounded-full flex items-center justify-center border-4 border-[#5d0000] z-[110] shadow-[0_4px_10px_rgba(0,0,0,0.5)] active:scale-90 transition-transform group"
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
                  { id: 'liabilities', label: t.subtab_liabilities, icon: '🏦' },
                  { id: 'ratios', label: t.subtab_ratios, icon: '⚖️' }
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
                {/* SUBTAB: OVERVIEW */}
                {dashSubTab === 'overview' && (
                  (() => {
                    const financialPositionInsight = dashNetBalance >= 0 
                      ? t('advice_financial_position_positive', { inflow: formatNumberCompact(dashInflow) }) 
                      : t('advice_financial_position_negative', { balance: formatNumberCompact(dashNetBalance) });

                    const maxCategory = dashCategoryData.length > 0 ? dashCategoryData.reduce((prev, current) => (prev.amount > current.amount) ? prev : current) : null;
                    const expensesReportInsight = maxCategory 
                      ? t('advice_expenses_report', { category: maxCategory.name, amount: formatNumberCompact(-maxCategory.amount) }) 
                      : t('advice_empty', '"No transactions registered in the official ledger of the crown, my Lord. The realm awaits financial activity."');

                    const expenseTransactions = dashboardFilteredTransactions.filter(tx => tx.transaction_nature === 'accrual' && tx.transaction_flow === 'outflow');
                    const entityTotals = expenseTransactions.reduce((acc, tx) => {
                      acc[tx.entity_name] = (acc[tx.entity_name] || 0) + Number(tx.amount);
                      return acc;
                    }, {});
                    const maxEntity = Object.keys(entityTotals).reduce((a, b) => entityTotals[a] > entityTotals[b] ? a : b, null);
                    const expensesDetailedInsight = maxEntity 
                      ? t('advice_expenses_detailed', { entity: maxEntity, amount: formatNumberCompact(-entityTotals[maxEntity]) }) 
                      : t('advice_empty', '"No transactions registered in the official ledger of the crown, my Lord. The realm awaits financial activity."');

                    const debtEvolutionInsight = dashDebt > 0 
                      ? t('advice_debt_positive', { debt: formatNumberCompact(-dashDebt) }) 
                      : t('advice_debt_free', '"My Liege, the realm is free of debt! A golden age of financial independence is upon us."');

                    return (
                      <div className="flex flex-col gap-8">
                        {/* Row 1: Financial Position */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          <div className="h-[280px]">
                            <TimeEvolutionChart timePoints={dashTimeData} t={t} />
                          </div>
                          <div className="h-[280px]">
                            <RoyalTreasurerInsights adviceText={financialPositionInsight} t={t} />
                          </div>
                        </div>

                        {/* Row 2: Expenses Donut */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          <div className="h-[280px]">
                            <ExpensesDonutChart dashCategoryData={dashCategoryData} t={t} />
                          </div>
                          <div className="h-[280px]">
                            <RoyalTreasurerInsights adviceText={expensesReportInsight} t={t} />
                          </div>
                        </div>

                        {/* Row 3: Expenses Detailed */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          <div className="h-[280px]">
                            <ExpensesDetailedChart transactions={dashboardFilteredTransactions} t={t} />
                          </div>
                          <div className="h-[280px]">
                            <RoyalTreasurerInsights adviceText={expensesDetailedInsight} t={t} />
                          </div>
                        </div>

                        {/* Row 4: Debt Evolution */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          <div className="h-[280px]">
                            <DebtEvolutionChart timePoints={engineData.timeData} t={t} />
                          </div>
                          <div className="h-[280px]">
                            <RoyalTreasurerInsights adviceText={debtEvolutionInsight} t={t} />
                          </div>
                        </div>
                      </div>
                    );
                  })()
                )}

                {/* SUBTAB: INCOME & EXPENSES */}
                {dashSubTab === 'income_expense' && (
                  <div className="space-y-6">

                    {/* Side-by-side evolution */}
                    <div className="bg-[#faf4e5]/60 border border-[#8b4513]/25 rounded-xl p-4 shadow-sm flex flex-col h-[280px]">
                      <h4 className="title-font text-[11px] font-black text-[#4b2c20] uppercase tracking-wider border-b border-[#8b4513]/10 pb-1.5 flex justify-between flex-shrink-0">
                        <span>{t.flow_comparison} ({dashGranularity === 'month' ? t.gran_month : dashGranularity === 'quarter' ? t.gran_quarter : t.gran_year})</span>
                        <span className="text-[8px] font-sans font-medium text-stone-500 normal-case">{t.revenue_vs_expense}</span>
                      </h4>
                      <div className="space-y-4 overflow-y-auto pr-1 custom-scrollbar-subtle flex-grow mt-3">
                        {dashTimeData.length > 0 ? (
                          dashTimeData.map((tItem) => {
                            const incWidth = (tItem.income / maxDashTimeVal) * 100;
                            const expWidth = (tItem.expense / maxDashTimeVal) * 100;
                            const net = tItem.income - tItem.expense;
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
                                      <span>{formatNumberCompact(tItem.income)}</span>
                                    </div>
                                    <div className="w-full bg-[#faf4e5]/80 h-2 rounded-full overflow-hidden border border-[#8b4513]/10">
                                      <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${incWidth}%` }} />
                                    </div>
                                  </div>
                                  {/* Expense bar */}
                                  <div className="space-y-0.5">
                                    <div className="flex justify-between text-[8px] text-rose-800 font-bold font-mono">
                                      <span>{t.expense}</span>
                                      <span>{formatNumberCompact(-tItem.expense)}</span>
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
                    <div className="bg-[#faf4e5]/60 border border-[#8b4513]/25 rounded-xl p-4 shadow-sm flex flex-col h-[280px]">
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
                    {/* Royal Income Statement Ledger (P&L) */}
                    <RoyalIncomeStatement incomeStatement={engineData.incomeStatement} t={t} formatNumberCompact={formatNumberCompact} />
                  </div>
                )}


                {/* SUBTAB: PAYABLES & RECEIVABLES */}
                {dashSubTab === 'payables_receivables' && (
                  (() => {
                    const prKpi = engineData.payablesReceivablesKpis;
                    
                    const evolutionDiff = (prKpi?.all_receivables || 0) - (prKpi?.all_payables || 0);
                    const evolutionAdvice = evolutionDiff >= 0
                      ? t('advice_pr_evolution_positive', { diff: formatNumberCompact(evolutionDiff) })
                      : t('advice_pr_evolution_negative', { diff: formatNumberCompact(Math.abs(evolutionDiff)) });

                    const opCatData = engineData.openPayablesByCategory;
                    const maxCatPayable = opCatData.length > 0 ? opCatData[0] : null;
                    const categoryAdvice = maxCatPayable
                      ? t('advice_pr_category_positive', { category: maxCatPayable.name, amount: formatNumberCompact(maxCatPayable.amount) })
                      : t('advice_pr_category_none');

                    const opEntData = engineData.openPayablesByEntity;
                    const maxEntPayable = opEntData.length > 0 ? opEntData[0] : null;
                    const entityAdvice = maxEntPayable
                      ? t('advice_pr_entity_positive', { entity: maxEntPayable.name, amount: formatNumberCompact(maxEntPayable.amount) })
                      : t('advice_pr_entity_none');

                    const opMonthData = engineData.openPayablesByMonth;
                    const totalOpMonths = opMonthData.reduce((sum, item) => sum + item.amount, 0);
                    const monthAdvice = totalOpMonths > 0
                      ? t('advice_pr_month_positive')
                      : t('advice_pr_month_none');

                    const pmData = engineData.paymentMethodsDistribution;
                    const maxPM = pmData.length > 0 ? pmData[0] : null;
                    const paymentMethodAdvice = maxPM
                      ? t('advice_pr_payment_method_positive', { method: maxPM.name, amount: formatNumberCompact(maxPM.amount) })
                      : t('advice_pr_payment_method_none');

                    return (
                      <div className="flex flex-col gap-8">
                        {/* Spline Evolution Chart */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          <div className="h-[280px]">
                            <PayablesReceivablesSplineChart prTimePoints={engineData.prTimePoints} t={t} />
                          </div>
                          <div className="h-[280px]">
                            <RoyalTreasurerInsights adviceText={evolutionAdvice} t={t} />
                          </div>
                        </div>

                        {/* Open Payables by Category Chart */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          <div className="h-[280px]">
                            <OpenPayablesByCategoryChart openPayablesByCategory={engineData.openPayablesByCategory} t={t} formatNumberCompact={formatNumberCompact} />
                          </div>
                          <div className="h-[280px]">
                            <RoyalTreasurerInsights adviceText={categoryAdvice} t={t} />
                          </div>
                        </div>

                        {/* Open Payables by Entity Chart */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          <div className="h-[280px]">
                            <OpenPayablesByEntityChart openPayablesByEntity={engineData.openPayablesByEntity} t={t} formatNumberCompact={formatNumberCompact} />
                          </div>
                          <div className="h-[280px]">
                            <RoyalTreasurerInsights adviceText={entityAdvice} t={t} />
                          </div>
                        </div>

                        {/* Open Payables by Month Chart */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          <div className="h-[280px]">
                            <OpenPayablesByMonthChart openPayablesByMonth={engineData.openPayablesByMonth} t={t} />
                          </div>
                          <div className="h-[280px]">
                            <RoyalTreasurerInsights adviceText={monthAdvice} t={t} />
                          </div>
                        </div>

                        {/* Payment Methods Chart */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          <div className="h-[280px]">
                            <PaymentMethodsChart paymentMethodsDistribution={engineData.paymentMethodsDistribution} t={t} />
                          </div>
                          <div className="h-[280px]">
                            <RoyalTreasurerInsights adviceText={paymentMethodAdvice} t={t} />
                          </div>
                        </div>
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
                      <div className="flex flex-col gap-8">
                        {/* Spline Evolution Chart */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          <div className="h-[280px]">
                            <LiabilitiesEvolutionChart liabilitiesTimePoints={engineData.liabilitiesTimePoints} t={t} />
                          </div>
                          <div className="h-[280px]">
                            <RoyalTreasurerInsights adviceText={evolutionAdvice} t={t} />
                          </div>
                        </div>

                        {/* Debt by Entity Chart */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          <div className="h-[280px]">
                            <DebtByEntityChart debtByEntity={engineData.debtByEntity} t={t} formatNumberCompact={formatNumberCompact} />
                          </div>
                          <div className="h-[280px]">
                            <RoyalTreasurerInsights adviceText={entityAdvice} t={t} />
                          </div>
                        </div>

                        {/* Debt Composition Chart */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          <div className="h-[280px]">
                            <DebtCompositionChart debtByType={engineData.debtByType} t={t} />
                          </div>
                          <div className="h-[280px]">
                            <RoyalTreasurerInsights adviceText={debtTypeAdvice} t={t} />
                          </div>
                        </div>
                      </div>
                    );
                  })()
                )}

                {/* SUBTAB: RATIOS */}
                {dashSubTab === 'ratios' && (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-60">
                    <div className="text-6xl">⚖️</div>
                    <div className="space-y-1">
                      <h3 className="title-font text-xl font-black text-[#4b2c20] uppercase tracking-widest">Financial Ratios</h3>
                      <p className="text-xs font-serif italic text-[#5d4037]">Under construction by order of the Royal Treasurer.</p>
                    </div>
                  </div>
                )}
              </BaseDashboardTab>
            </div>
          </div>
        )}

        {/* Isolated Financial Statements View */}
        {activeTab === 'financial_statement' && (
          <div 
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setActiveTab('quests');
                setIsTreasuryMenuOpen(true);
              }
            }}
            className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          >
            <div className="bg-[#f4e4bc] w-full max-w-6xl h-[88%] rounded-xl border-[8px] border-[#5d4037] shadow-[0_0_50px_rgba(0,0,0,0.9)] relative flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
              
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
                className="absolute -top-1 -right-1 w-12 h-12 bg-[#8b0000] rounded-full flex items-center justify-center border-4 border-[#5d0000] z-[110] shadow-[0_4px_10px_rgba(0,0,0,0.5)] active:scale-90 transition-transform group"
                title={t.back_to_map}
              >
                <div className="absolute inset-0 rounded-full border-2 border-white/20 animate-pulse" />
                <span className="text-[#ffd700] text-lg font-black font-sans">✕</span>
              </button>

              {/* Header Ribbon */}
              <div className="relative h-16 flex items-center justify-center z-10 pt-2">
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[110%] h-10 bg-gradient-to-r from-[#8b4513] via-[#5d4037] to-[#8b4513] shadow-lg transform -rotate-1 skew-x-12 z-0 border-y-2 border-[#d4af37]" />
                <h2 className="title-font text-lg sm:text-xl text-[#ffd700] font-bold uppercase tracking-[0.2em] relative z-10 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                  {t.subtab_financial_statement || 'Financial Statements'}
                </h2>
              </div>

              <BaseDashboardTab
                t={t}
                dashSubTab="financial_statement"
                setDashSubTab={() => {}}
                subTabs={[]}
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
                kpis={[]}
              >
                <ConsolidatedFinancialStatement
                  incomeStatement={engineData.incomeStatement}
                  cashFlowStatement={engineData.cashFlowStatement}
                  balanceSheet={engineData.balanceSheet}
                  t={t}
                  formatNumberCompact={formatNumberCompact}
                />
              </BaseDashboardTab>
            </div>
          </div>
        )}

        {/* Transactions View (Financial Ledger) */}
        {activeTab === 'transactions' && (
          <div 
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setActiveTab('quests');
                setIsTreasuryMenuOpen(true);
              }
            }}
            className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          >
            <div className="bg-[#f4e4bc] w-full max-w-5xl max-h-[82%] rounded-xl border-[8px] border-[#5d4037] shadow-[0_0_50px_rgba(0,0,0,0.9)] relative flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
              
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
                className="absolute -top-1 -right-1 w-12 h-12 bg-[#8b0000] rounded-full flex items-center justify-center border-4 border-[#5d0000] z-[110] shadow-[0_4px_10px_rgba(0,0,0,0.5)] active:scale-90 transition-transform group"
                title={t.back_to_map}
              >
                <div className="absolute inset-0 rounded-full border-2 border-white/20 animate-pulse" />
                <span className="text-[#ffd700] text-lg font-black font-sans">✕</span>
              </button>

              {/* Header Ribbon */}
              <div className="relative h-16 flex items-center justify-center z-10 pt-2">
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[110%] h-10 bg-gradient-to-r from-[#8b4513] via-[#5d4037] to-[#8b4513] shadow-lg transform -rotate-1 skew-x-12 z-0 border-y-2 border-[#d4af37]" />
                <h2 className="title-font text-lg sm:text-xl text-[#ffd700] font-bold uppercase tracking-[0.2em] relative z-10 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                  {t.ledger_transactions}
                </h2>
              </div>

              {/* Scrollable Parchment Body */}
              <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar flex-grow relative z-10 text-[#2d1b0d] space-y-4">
                
                {/* Title and Action Buttons */}
                <div className="flex justify-between items-center">
                  <h4 className="title-font text-sm font-black text-[#4b2c20] uppercase">
                    {t.ledger_transactions}
                  </h4>
                  <div className="flex gap-2 flex-wrap items-center">
                    {selectedTxIds.length > 0 && (
                      <>
                        {!isEditing ? (
                          <button
                            type="button"
                            onClick={() => {
                              setIsEditing(true);
                              const initialEdits = {};
                              selectedTxIds.forEach(id => {
                                const tx = transactions.find(t => t.id === id);
                                if (tx) {
                                  initialEdits[id] = { ...tx };
                                }
                              });
                              setEditingTxs(initialEdits);
                            }}
                            className="px-3 py-1.5 bg-[#b8860b] border-2 border-[#d4af37]/30 text-white font-black text-[9px] uppercase tracking-wider rounded-lg shadow-sm hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer animate-in fade-in zoom-in duration-150"
                          >
                            <span>✏️</span> {t('edit') || 'Edit'}
                          </button>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={handleSaveEdits}
                              className="px-3 py-1.5 bg-emerald-700 border-2 border-emerald-500/30 text-white font-black text-[9px] uppercase tracking-wider rounded-lg shadow-sm hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer animate-in fade-in zoom-in duration-150"
                            >
                              <span>💾</span> {t('save') || 'Save'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setIsEditing(false);
                                setEditingTxs({});
                              }}
                              className="px-3 py-1.5 bg-rose-700 border-2 border-rose-500/30 text-white font-black text-[9px] uppercase tracking-wider rounded-lg shadow-sm hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer animate-in fade-in zoom-in duration-150"
                            >
                              <span>✕</span> {t('cancel') || 'Cancel'}
                            </button>
                          </>
                        )}
                      </>
                    )}
                    <button
                      type="button"
                      onClick={exportCSV}
                      className="px-3 py-1.5 bg-[#faf4e5]/90 border-2 border-[#8b4513]/30 text-[#4b2c20] font-black text-[9px] uppercase tracking-wider rounded-lg shadow-sm hover:bg-[#8b4513]/10 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                      title={t.export_csv}
                    >
                      <span>📤</span> {t.export_csv}
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current.click()}
                      className="px-3 py-1.5 bg-[#faf4e5]/90 border-2 border-[#8b4513]/30 text-[#4b2c20] font-black text-[9px] uppercase tracking-wider rounded-lg shadow-sm hover:bg-[#8b4513]/10 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                      title={t.import_csv}
                    >
                      <span>📥</span> {t.import_csv}
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={importCSV}
                      accept=".csv"
                      className="hidden"
                    />

                    <button
                      type="button"
                      onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
                      className="px-3 py-1.5 bg-[#faf4e5]/90 border-2 border-[#8b4513]/30 text-[#4b2c20] font-black text-[9px] uppercase tracking-wider rounded-lg shadow-sm hover:bg-[#8b4513]/10 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>🔍</span> {isFiltersExpanded ? t.hide_filters : t.show_filters}
                    </button>
                  </div>
                </div>

                {/* Collapsible Filter Panel */}
                {isFiltersExpanded && (
                  <div className="bg-[#faf4e5]/50 border border-[#8b4513]/20 rounded-xl p-4 animate-in slide-in-from-top-2 duration-200">
                    <div className="flex justify-between items-center border-b border-[#8b4513]/15 pb-2 mb-3">
                      <span className="text-[9px] font-black uppercase text-[#5d4037]/80 tracking-wider">{t.active_filters}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setFilterYear('All');
                          setFilterMonth('All');
                          setFilterQuarter('All');
                          setFilterFrom('All');
                          setFilterStatus('All');
                          setFilterClass('All');
                          setFilterSubClass('All');
                          setFilterEntity('All');
                          toast.success(t.filters_cleared);
                        }}
                        className="text-[9px] font-black text-rose-800 hover:text-rose-955 uppercase transition-colors cursor-pointer"
                      >
                        {t.clear_all}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
                      {/* Year */}
                      <div>
                        <label className="block text-[8px] font-black uppercase text-[#5d4037]/75 mb-0.5 font-sans">{t.year_label}</label>
                        <select
                          value={filterYear}
                          onChange={(e) => setFilterYear(e.target.value)}
                          className="w-full bg-[#faf4e5] border border-[#8b4513]/25 rounded px-1.5 py-1 text-[10px] font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]"
                        >
                          <option value="All">{t.all_years}</option>
                          {uniqueYears.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                      </div>

                      {/* Month */}
                      <div>
                        <label className="block text-[8px] font-black uppercase text-[#5d4037]/75 mb-0.5 font-sans">{t.month_label}</label>
                        <select
                          value={filterMonth}
                          onChange={(e) => setFilterMonth(e.target.value)}
                          className="w-full bg-[#faf4e5] border border-[#8b4513]/25 rounded px-1.5 py-1 text-[10px] font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]"
                        >
                          <option value="All">{t.all_months}</option>
                          {monthOptions.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                      </div>

                      {/* Quarter */}
                      <div>
                        <label className="block text-[8px] font-black uppercase text-[#5d4037]/75 mb-0.5 font-sans">{t.quarter_label}</label>
                        <select
                          value={filterQuarter}
                          onChange={(e) => setFilterQuarter(e.target.value)}
                          className="w-full bg-[#faf4e5] border border-[#8b4513]/25 rounded px-1.5 py-1 text-[10px] font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]"
                        >
                          <option value="All">{t.all_quarters}</option>
                          <option value="Q1">Q1</option>
                          <option value="Q2">Q2</option>
                          <option value="Q3">Q3</option>
                          <option value="Q4">Q4</option>
                        </select>
                      </div>

                      {/* From */}
                      <div>
                        <label className="block text-[8px] font-black uppercase text-[#5d4037]/75 mb-0.5 font-sans">{t.origin_from}</label>
                        <select
                          value={filterFrom}
                          onChange={(e) => setFilterFrom(e.target.value)}
                          className="w-full bg-[#faf4e5] border border-[#8b4513]/25 rounded px-1.5 py-1 text-[10px] font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]"
                        >
                          <option value="All">{t.all_from}</option>
                          {fromOptions.map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                      </div>

                      {/* Status */}
                      <div>
                        <label className="block text-[8px] font-black uppercase text-[#5d4037]/75 mb-0.5 font-sans">{t.status}</label>
                        <select
                          value={filterStatus}
                          onChange={(e) => setFilterStatus(e.target.value)}
                          className="w-full bg-[#faf4e5] border border-[#8b4513]/25 rounded px-1.5 py-1 text-[10px] font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]"
                        >
                          <option value="All">{t.all_types || 'All Statuses'}</option>
                          {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>

                      {/* Class */}
                      <div>
                        <label className="block text-[8px] font-black uppercase text-[#5d4037]/75 mb-0.5 font-sans">{t.class}</label>
                        <select
                          value={filterClass}
                          onChange={(e) => setFilterClass(e.target.value)}
                          className="w-full bg-[#faf4e5] border border-[#8b4513]/25 rounded px-1.5 py-1 text-[10px] font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]"
                        >
                          <option value="All">{t.all_types || 'All Classes'}</option>
                          {classOptions.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>

                      {/* Sub Class */}
                      <div>
                        <label className="block text-[8px] font-black uppercase text-[#5d4037]/75 mb-0.5 font-sans">{t.sub_class}</label>
                        <select
                          value={filterSubClass}
                          onChange={(e) => setFilterSubClass(e.target.value)}
                          className="w-full bg-[#faf4e5] border border-[#8b4513]/25 rounded px-1.5 py-1 text-[10px] font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]"
                        >
                          <option value="All">{t.all_types || 'All Sub Classes'}</option>
                          {subClassOptions.map(sc => <option key={sc} value={sc}>{sc}</option>)}
                        </select>
                      </div>

                      {/* Entity */}
                      <div>
                        <label className="block text-[8px] font-black uppercase text-[#5d4037]/75 mb-0.5 font-sans">{t.entity}</label>
                        <select
                          value={filterEntity}
                          onChange={(e) => setFilterEntity(e.target.value)}
                          className="w-full bg-[#faf4e5] border border-[#8b4513]/25 rounded px-1.5 py-1 text-[10px] font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]"
                        >
                          <option value="All">{t.all_types || 'All Entities'}</option>
                          {entityOptions.map(e => <option key={e} value={e}>{e}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Ledger Data Table */}
                <div className="max-h-[380px] overflow-y-auto border border-[#8b4513]/25 rounded-xl bg-[#faf4e5]/40 custom-scrollbar shadow-inner">
                  {filteredTransactions.length > 0 ? (
                    <>
                      {/* Desktop Table View */}
                      <table className="hidden md:table w-full text-left border-collapse text-[10px] font-sans">
                        <thead>
                          <tr className="bg-[#8b4513] border-b border-[#8b4513]/20 text-[#ffd700] font-black uppercase tracking-wider title-font sticky top-0 z-20">
                            <th className="py-2.5 px-3 w-8">
                              <input
                                type="checkbox"
                                checked={filteredTransactions.length > 0 && selectedTxIds.length === filteredTransactions.length}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedTxIds(filteredTransactions.map(t => t.id));
                                  } else {
                                    setSelectedTxIds([]);
                                  }
                                }}
                                className="w-3.5 h-3.5 rounded border border-[#8b4513]/30 accent-[#ffd700] cursor-pointer"
                              />
                            </th>
                            <th className="py-2.5 px-3 whitespace-nowrap">{t('ledger.headers.from')}</th>
                            <th className="py-2.5 px-3 whitespace-nowrap">{t('ledger.headers.status')}</th>
                            <th className="py-2.5 px-3 whitespace-nowrap">{t('ledger.headers.class')}</th>
                            <th className="py-2.5 px-3 whitespace-nowrap">Nature/Flow</th>
                            <th className="py-2.5 px-3 whitespace-nowrap">{t('ledger.headers.sub_class')}</th>
                            <th className="py-2.5 px-3 whitespace-nowrap">{t('ledger.headers.entity')}</th>
                            <th className="py-2.5 px-3 whitespace-nowrap text-right">{t('ledger.headers.amount')}</th>
                            <th className="py-2.5 px-3 whitespace-nowrap">{t.description}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#8b4513]/10 text-stone-700 font-bold">
                          {filteredTransactions.map((tx) => {
                            const isTxEditing = isEditing && selectedTxIds.includes(tx.id);
                            if (isTxEditing) {
                              return (
                                <tr key={tx.id} className="hover:bg-[#8b4513]/5 transition-colors bg-[#faf4e5]/80">
                                  <td className="py-2 px-3 whitespace-nowrap w-8">
                                    <input
                                      type="checkbox"
                                      checked={selectedTxIds.includes(tx.id)}
                                      onChange={() => {
                                        setSelectedTxIds(prev => 
                                          prev.includes(tx.id) 
                                            ? prev.filter(id => id !== tx.id) 
                                            : [...prev, tx.id]
                                        );
                                      }}
                                      className="w-3.5 h-3.5 rounded border border-[#8b4513]/30 accent-[#8b4513] cursor-pointer"
                                    />
                                  </td>
                                  <td className="py-2 px-3 whitespace-nowrap">
                                    <input
                                      type="text"
                                      value={editingTxs[tx.id]?.from || ''}
                                      onChange={e => handleFieldChange(tx.id, 'from', e.target.value)}
                                      className="w-full bg-[#faf4e5]/90 border border-[#8b4513]/30 rounded text-[9px] font-bold text-[#4b2c20] focus:outline-none px-1 py-0.5 font-sans"
                                    />
                                  </td>
                                  <td className="py-2 px-3 whitespace-nowrap">
                                    <select
                                      value={editingTxs[tx.id]?.payment_status || 'Completed'}
                                      onChange={e => handleFieldChange(tx.id, 'payment_status', e.target.value)}
                                      className="w-full bg-[#faf4e5]/90 border border-[#8b4513]/30 rounded text-[9px] font-bold text-[#4b2c20] focus:outline-none px-1 py-0.5 font-sans"
                                    >
                                      {['Completed', 'Pending', 'Overdue', 'Paid on Time', 'Paid Late', 'Open', 'Paid'].map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                      ))}
                                    </select>
                                  </td>
                                  <td className="py-2 px-3 whitespace-nowrap">
                                    <select
                                      value={editingTxs[tx.id]?.transaction_type || 'Income'}
                                      onChange={e => handleFieldChange(tx.id, 'transaction_type', e.target.value)}
                                      className="w-full bg-[#faf4e5]/90 border border-[#8b4513]/30 rounded text-[9px] font-bold text-[#4b2c20] focus:outline-none px-1 py-0.5 font-sans"
                                    >
                                      {classOptions.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                      ))}
                                    </select>
                                  </td>
                                  <td className="py-2 px-3 whitespace-nowrap">
                                    <div className="flex flex-col gap-1">
                                      <select
                                        value={editingTxs[tx.id]?.transaction_nature || 'cash'}
                                        onChange={e => handleFieldChange(tx.id, 'transaction_nature', e.target.value)}
                                        className="bg-[#faf4e5]/90 border border-[#8b4513]/30 rounded text-[8px] font-bold text-[#4b2c20] focus:outline-none px-1 py-0.5 font-sans"
                                      >
                                        <option value="cash">cash</option>
                                        <option value="accrual">accrual</option>
                                      </select>
                                      <select
                                        value={editingTxs[tx.id]?.transaction_flow || 'inflow'}
                                        onChange={e => handleFieldChange(tx.id, 'transaction_flow', e.target.value)}
                                        className="bg-[#faf4e5]/90 border border-[#8b4513]/30 rounded text-[8px] font-bold text-[#4b2c20] focus:outline-none px-1 py-0.5 font-sans"
                                      >
                                        <option value="inflow">inflow</option>
                                        <option value="outflow">outflow</option>
                                      </select>
                                    </div>
                                  </td>
                                  <td className="py-2 px-3 whitespace-nowrap">
                                    <select
                                      value={editingTxs[tx.id]?.transaction_subtype || ''}
                                      onChange={e => handleFieldChange(tx.id, 'transaction_subtype', e.target.value)}
                                      className="w-full bg-[#faf4e5]/90 border border-[#8b4513]/30 rounded text-[9px] font-bold text-[#4b2c20] focus:outline-none px-1 py-0.5 font-sans"
                                    >
                                      <option value="">-</option>
                                      {subClassOptions.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                      ))}
                                    </select>
                                  </td>
                                  <td className="py-2 px-3 whitespace-nowrap">
                                    <select
                                      value={editingTxs[tx.id]?.entity || ''}
                                      onChange={e => handleFieldChange(tx.id, 'entity', e.target.value)}
                                      className="w-full bg-[#faf4e5]/90 border border-[#8b4513]/30 rounded text-[9px] font-bold text-[#4b2c20] focus:outline-none px-1 py-0.5 font-sans"
                                    >
                                      <option value="">-</option>
                                      {entityOptions.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                      ))}
                                    </select>
                                  </td>
                                  <td className="py-2 px-3 whitespace-nowrap">
                                    <input
                                      type="number"
                                      value={editingTxs[tx.id]?.amount || 0}
                                      onChange={e => handleFieldChange(tx.id, 'amount', e.target.value)}
                                      className="w-20 bg-[#faf4e5]/90 border border-[#8b4513]/30 rounded text-[9px] font-bold text-[#4b2c20] focus:outline-none px-1 py-0.5 font-mono text-right"
                                    />
                                  </td>
                                  <td className="py-2 px-3 whitespace-nowrap font-sans font-bold text-stone-500">
                                    <input
                                      type="text"
                                      value={editingTxs[tx.id]?.description || ''}
                                      onChange={e => handleFieldChange(tx.id, 'description', e.target.value)}
                                      className="w-24 bg-[#faf4e5]/90 border border-[#8b4513]/30 rounded text-[9px] font-bold text-[#4b2c20] focus:outline-none px-1 py-0.5 font-sans"
                                    />
                                  </td>
                                </tr>
                              );
                            }

                            return (
                              <tr key={tx.id} className="hover:bg-[#8b4513]/5 transition-colors">
                                <td className="py-2 px-3 whitespace-nowrap w-8">
                                  <input
                                    type="checkbox"
                                    checked={selectedTxIds.includes(tx.id)}
                                    onChange={() => {
                                      setSelectedTxIds(prev => 
                                        prev.includes(tx.id) 
                                          ? prev.filter(id => id !== tx.id) 
                                          : [...prev, tx.id]
                                      );
                                    }}
                                    disabled={isEditing && !selectedTxIds.includes(tx.id)}
                                    className="w-3.5 h-3.5 rounded border border-[#8b4513]/30 accent-[#8b4513] cursor-pointer"
                                  />
                                </td>
                                <td className="py-2 px-3 whitespace-nowrap font-bold text-[#4b2c20]">{tx.from || '-'}</td>
                                <td className="py-2 px-3 whitespace-nowrap">
                                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                                    tx.payment_status === 'Completed' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                                    tx.payment_status === 'Paid on Time' ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' :
                                    tx.payment_status === 'Pending' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                                    tx.payment_status === 'Overdue' ? 'bg-red-100 text-red-800 border border-red-200' :
                                    'bg-stone-100 text-stone-800 border border-stone-200'
                                  }`}>
                                    {tx.payment_status || 'Completed'}
                                  </span>
                                </td>
                                <td className="py-2 px-3 whitespace-nowrap">
                                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                                    (tx.transaction_nature === 'accrual' && tx.transaction_flow === 'inflow') 
                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                                      : 'bg-rose-100 text-rose-800 border border-rose-200'
                                  }`}>
                                    {tx.transaction_type}
                                  </span>
                                </td>
                                <td className="py-2 px-3 whitespace-nowrap">
                                  <span className="text-[9px] font-mono text-stone-500 font-bold bg-[#8b4513]/10 px-1.5 py-0.5 rounded uppercase mr-1">{tx.transaction_nature || '-'}</span>
                                  <span className="text-[9px] font-mono text-stone-500 font-bold bg-[#8b4513]/10 px-1.5 py-0.5 rounded uppercase">{tx.transaction_flow || '-'}</span>
                                </td>
                                <td className="py-2 px-3 whitespace-nowrap text-stone-600">{tx.transaction_subtype || '-'}</td>
                                <td className="py-2 px-3 whitespace-nowrap text-stone-600">{tx.entity || '-'}</td>
                                <td className={`py-2 px-3 whitespace-nowrap text-right font-mono font-black ${
                                  (tx.transaction_nature === 'accrual' && tx.transaction_flow === 'inflow') ? 'text-emerald-700' : 'text-rose-700'
                                }`}>
                                  {(tx.transaction_nature === 'accrual' && tx.transaction_flow === 'inflow') ? '+' : '-'}{Number(tx.amount).toLocaleString()}g
                                </td>
                                <td className="py-2 px-3 whitespace-nowrap text-stone-500 max-w-[150px] truncate" title={tx.description || ''}>{tx.description || '-'}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>

                      {/* Mobile Cards View */}
                      <div className="grid grid-cols-1 gap-2.5 p-3 md:hidden">
                        {filteredTransactions.map((tx) => {
                          const isTxEditing = isEditing && selectedTxIds.includes(tx.id);
                          return (
                            <div 
                              key={tx.id} 
                              className="bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-xl p-3 shadow-sm flex flex-col gap-2 relative overflow-hidden"
                            >
                              <div className="flex gap-2 items-center border-b border-[#8b4513]/10 pb-1.5">
                                <input
                                  type="checkbox"
                                  checked={selectedTxIds.includes(tx.id)}
                                  onChange={() => {
                                    setSelectedTxIds(prev => 
                                      prev.includes(tx.id) 
                                        ? prev.filter(id => id !== tx.id) 
                                        : [...prev, tx.id]
                                    );
                                  }}
                                  disabled={isEditing && !selectedTxIds.includes(tx.id)}
                                  className="w-3.5 h-3.5 rounded border border-[#8b4513]/30 accent-[#8b4513] cursor-pointer flex-shrink-0"
                                />
                                <span className="text-[9px] font-black uppercase tracking-wider text-[#4b2c20]">
                                  {isTxEditing ? 'Editing Transaction' : (tx.entity || tx.transaction_type)}
                                </span>
                              </div>
                              
                              {isTxEditing ? (
                                <div className="grid grid-cols-2 gap-2 text-[9px] font-sans font-bold">
                                  <div>
                                    <label className="block text-[8px] text-stone-500 uppercase">From</label>
                                    <input
                                      type="text"
                                      value={editingTxs[tx.id]?.from || ''}
                                      onChange={e => handleFieldChange(tx.id, 'from', e.target.value)}
                                      className="w-full bg-[#faf4e5]/90 border border-[#8b4513]/30 rounded text-[9px] font-bold text-[#4b2c20] px-1 py-0.5 focus:outline-none"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[8px] text-stone-500 uppercase">Status</label>
                                    <select
                                      value={editingTxs[tx.id]?.payment_status || 'Completed'}
                                      onChange={e => handleFieldChange(tx.id, 'payment_status', e.target.value)}
                                      className="w-full bg-[#faf4e5]/90 border border-[#8b4513]/30 rounded text-[9px] font-bold text-[#4b2c20] px-1 py-0.5 focus:outline-none"
                                    >
                                      {['Completed', 'Pending', 'Overdue', 'Paid on Time', 'Paid Late', 'Open', 'Paid'].map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                      ))}
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-[8px] text-stone-500 uppercase">Class (Type)</label>
                                    <select
                                      value={editingTxs[tx.id]?.transaction_type || 'Income'}
                                      onChange={e => handleFieldChange(tx.id, 'transaction_type', e.target.value)}
                                      className="w-full bg-[#faf4e5]/90 border border-[#8b4513]/30 rounded text-[9px] font-bold text-[#4b2c20] px-1 py-0.5 focus:outline-none"
                                    >
                                      {classOptions.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                      ))}
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-[8px] text-stone-500 uppercase">Sub Class</label>
                                    <select
                                      value={editingTxs[tx.id]?.transaction_subtype || ''}
                                      onChange={e => handleFieldChange(tx.id, 'transaction_subtype', e.target.value)}
                                      className="w-full bg-[#faf4e5]/90 border border-[#8b4513]/30 rounded text-[9px] font-bold text-[#4b2c20] px-1 py-0.5 focus:outline-none"
                                    >
                                      <option value="">-</option>
                                      {subClassOptions.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                      ))}
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-[8px] text-stone-500 uppercase">Nature</label>
                                    <select
                                      value={editingTxs[tx.id]?.transaction_nature || 'cash'}
                                      onChange={e => handleFieldChange(tx.id, 'transaction_nature', e.target.value)}
                                      className="w-full bg-[#faf4e5]/90 border border-[#8b4513]/30 rounded text-[9px] font-bold text-[#4b2c20] px-1 py-0.5 focus:outline-none"
                                    >
                                      <option value="cash">cash</option>
                                      <option value="accrual">accrual</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-[8px] text-stone-500 uppercase">Flow</label>
                                    <select
                                      value={editingTxs[tx.id]?.transaction_flow || 'inflow'}
                                      onChange={e => handleFieldChange(tx.id, 'transaction_flow', e.target.value)}
                                      className="w-full bg-[#faf4e5]/90 border border-[#8b4513]/30 rounded text-[9px] font-bold text-[#4b2c20] px-1 py-0.5 focus:outline-none"
                                    >
                                      <option value="inflow">inflow</option>
                                      <option value="outflow">outflow</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-[8px] text-stone-500 uppercase">Entity</label>
                                    <select
                                      value={editingTxs[tx.id]?.entity || ''}
                                      onChange={e => handleFieldChange(tx.id, 'entity', e.target.value)}
                                      className="w-full bg-[#faf4e5]/90 border border-[#8b4513]/30 rounded text-[9px] font-bold text-[#4b2c20] px-1 py-0.5 focus:outline-none"
                                    >
                                      <option value="">-</option>
                                      {entityOptions.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                      ))}
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-[8px] text-stone-500 uppercase">Amount</label>
                                    <input
                                      type="number"
                                      value={editingTxs[tx.id]?.amount || 0}
                                      onChange={e => handleFieldChange(tx.id, 'amount', e.target.value)}
                                      className="w-full bg-[#faf4e5]/90 border border-[#8b4513]/30 rounded text-[9px] font-bold text-[#4b2c20] px-1 py-0.5 focus:outline-none"
                                    />
                                  </div>
                                  <div className="col-span-2">
                                    <label className="block text-[8px] text-stone-500 uppercase">Description</label>
                                    <input
                                      type="text"
                                      value={editingTxs[tx.id]?.description || ''}
                                      onChange={e => handleFieldChange(tx.id, 'description', e.target.value)}
                                      className="w-full bg-[#faf4e5]/90 border border-[#8b4513]/30 rounded text-[9px] font-bold text-[#4b2c20] px-1 py-0.5 focus:outline-none"
                                    />
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <span className="text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider bg-[#8b4513]/10 text-[#4b2c20]">
                                        {tx.entity || tx.transaction_type}
                                      </span>
                                      <div className="text-[10px] font-bold text-[#5d4037]/80 mt-1">
                                        {tx.from} • {tx.transaction_subtype || '-'}
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className={`font-mono font-black text-xs ${(tx.transaction_nature === 'accrual' && tx.transaction_flow === 'inflow') ? 'text-emerald-700' : 'text-rose-700'}`}>
                                        {(tx.transaction_nature === 'accrual' && tx.transaction_flow === 'inflow') ? '+' : '-'}{Number(tx.amount).toLocaleString()}g
                                      </div>
                                      <span className={`inline-block text-[8px] font-black px-1.5 py-0.5 rounded mt-1 ${
                                        tx.payment_status === 'Completed' 
                                          ? 'bg-green-100 text-green-800 border border-green-200' 
                                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                                      }`}>
                                        {tx.payment_status || 'Completed'}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="border-t border-[#8b4513]/10 pt-2 flex justify-between items-center text-[8.5px] text-stone-500 font-bold">
                                    <span>📅 V: {tx.value_date} | P: {tx.posting_date} ({tx.month} {tx.year})</span>
                                    <div className="flex gap-1 flex-wrap justify-end">
                                      <span className="uppercase text-[8px] bg-[#8b4513]/10 text-stone-600 px-1 rounded">{tx.transaction_nature || '-'}</span>
                                      <span className="uppercase text-[8px] bg-[#8b4513]/10 text-stone-600 px-1 rounded">{tx.transaction_flow || '-'}</span>
                                      <span className="uppercase text-[8px] bg-amber-100 text-amber-800 px-1 rounded border border-amber-200">{tx.transaction_category || '-'}</span>
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <p className="text-center py-12 text-xs text-[#5d4037]/60 italic font-serif">
                      {t.no_options_registered}
                    </p>
                  )}
                </div>

              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

