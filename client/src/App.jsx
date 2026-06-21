/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useRef, useMemo } from 'react';
import { useDashboardEngine } from './lib/useDashboardEngine';
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
import { accountMappings, getAccountName } from './utils/accountMappings';
import QuickActionFormFields from './components/QuickActionFormFields';
import EditQuickActionModal from './components/EditQuickActionModal';
import ManageQuickActionsPanel from './components/ManageQuickActionsPanel';
import RegisterTransactionForm from './components/RegisterTransactionForm';
import FinancialStatementsModal from './components/FinancialStatementsModal';


const GUEST_PROFILE_ID = '00000000-0000-0000-0000-000000000000';



function App() {
  const [activeTab, setActiveTab] = useState('quests');
  const [isMineModalOpen, setIsMineModalOpen] = useState(false);
  const [isNewTxModalOpen, setIsNewTxModalOpen] = useState(false);
  const fileInputRef = useRef(null);
  const qaFileInputRef = useRef(null);
  const settingsFileInputRef = useRef(null);

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
  const [isQuestsModalOpen, setIsQuestsModalOpen] = useState(false);
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
  const [selectedQaNames, setSelectedQaNames] = useState([]);
  const [selectedQaTemplateName, setSelectedQaTemplateName] = useState('');

  // New Quick Action Form States
  const [qaName, setQaName] = useState('');
  const [qaIcon, setQaIcon] = useState('⚡');
  const [qaAmount, setQaAmount] = useState('');
  const [qaFrom, setQaFrom] = useState('');
  const [qaClass, setQaClass] = useState('');
  const [qaStatus, setQaStatus] = useState('');
  const [qaSubClass, setQaSubClass] = useState('');
  const [qaEntity, setQaEntity] = useState('');
  const [qaCategory, setQaCategory] = useState('');
  const [qaTargetAccount, setQaTargetAccount] = useState('');
  const [qaSourceDestBank, setQaSourceDestBank] = useState('');
  const [qaFlow, setQaFlow] = useState('');
  const [qaDescription, setQaDescription] = useState('');
  const [qaDueDate, setQaDueDate] = useState('');
  const [qaValueDate, setQaValueDate] = useState('');
  const [qaPostingDate, setQaPostingDate] = useState('');
  const [isEditingQa, setIsEditingQa] = useState(false);

  // Matrix categories states
  const [selectedMatrixKeys, setSelectedMatrixKeys] = useState([]);
  const [isMatrixEditingAll, setIsMatrixEditingAll] = useState(false);
  const [matrixEditingRowKey, setMatrixEditingRowKey] = useState(null);
  const [matrixEditData, setMatrixEditData] = useState({});
  const [isAddMatrixModalOpen, setIsAddMatrixModalOpen] = useState(false);
  const [newMatrixSubtype, setNewMatrixSubtype] = useState('');
  const [newMatrixCategory, setNewMatrixCategory] = useState('');
  const [newMatrixEntity, setNewMatrixEntity] = useState('');
  const [customSubtypeInput, setCustomSubtypeInput] = useState('');
  const [customCategoryInput, setCustomCategoryInput] = useState('');

  // Sort states
  const [categoriesSortField, setCategoriesSortField] = useState(null);
  const [categoriesSortDirection, setCategoriesSortDirection] = useState('asc');
  const [actionsSortField, setActionsSortField] = useState(null);
  const [actionsSortDirection, setActionsSortDirection] = useState('asc');

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
  const editOption = useKingdomStore((state) => state.editOption);
  const deleteOption = useKingdomStore((state) => state.deleteOption);
  const subtypeToCategoryMap = useKingdomStore((state) => state.subtypeToCategoryMap || {});
  const syncSettings = useKingdomStore((state) => state.syncSettings);

  // Form states
  const cascadingConfig = {
    'House & Utilities': {
      'Rent - Oeiras': { transaction_type: 'Expense', transaction_subtype: 'Living & Household', transaction_category: 'Living & Household', target_account: '611001', flow: 'outflow', payment_status: 'Pending' },
      'Electricity Expense (ENDESA)': { transaction_type: 'Expense', transaction_subtype: 'Utilities', transaction_category: 'Utilities', target_account: '612001', flow: 'outflow', payment_status: 'Pending' },
      'Gas Expense (DIGAL)': { transaction_type: 'Expense', transaction_subtype: 'Utilities', transaction_category: 'Utilities', target_account: '612002', flow: 'outflow', payment_status: 'Pending' },
      'Water Expense (SIMAS)': { transaction_type: 'Expense', transaction_subtype: 'Utilities', transaction_category: 'Utilities', target_account: '612003', flow: 'outflow', payment_status: 'Pending' },
      'Communications Expense (NOS)': { transaction_type: 'Expense', transaction_subtype: 'Utilities', transaction_category: 'Utilities', target_account: '612004', flow: 'outflow', payment_status: 'Pending' },
      'Household Utensils - Repairs': { transaction_type: 'Expense', transaction_subtype: 'Living & Household', transaction_category: 'Living & Household', target_account: '611004', flow: 'outflow', payment_status: 'Completed' }
    },
    'Transports': {
      'Vehicle Fuel - Car Gasoline': { transaction_type: 'Expense', transaction_subtype: 'Personal & Public Transports', transaction_category: 'Personal & Public Transports', target_account: '613001', flow: 'outflow', payment_status: 'Completed' },
      'Tolls Expense': { transaction_type: 'Expense', transaction_subtype: 'Personal & Public Transports', transaction_category: 'Personal & Public Transports', target_account: '613006', flow: 'outflow', payment_status: 'Completed' },
      'Parking Expense': { transaction_type: 'Expense', transaction_subtype: 'Personal & Public Transports', transaction_category: 'Personal & Public Transports', target_account: '613005', flow: 'outflow', payment_status: 'Completed' }
    },
    'Banking & Liabilities': {
      'Credit Card Debt Universo': { transaction_type: 'Liabilities', transaction_subtype: 'Credit Card Liabilities (Dívidas dos Cartões)', transaction_category: 'Credit Card Liabilities (Dívidas dos Cartões)', target_account: '213002', flow: 'outflow', payment_status: 'Completed' },
      'Loans CGD': { transaction_type: 'Liabilities', transaction_subtype: 'Personal Loans / Financiamentos', transaction_category: 'Personal Loans / Financiamentos', target_account: '211001', flow: 'outflow', payment_status: 'Completed' },
      'Savings Account CGD': { transaction_type: 'Assets', transaction_subtype: 'Savings Accounts', transaction_category: 'Savings Accounts', target_account: '121002', flow: 'neutral', payment_status: 'Completed' }
    },
    'Personal & Lifestyle': {
      'Entertainment - Restaurants': { transaction_type: 'Expense', transaction_subtype: 'Entertainment', transaction_category: 'Entertainment', target_account: '616001', flow: 'outflow', payment_status: 'Completed' },
      'Entertainment - Cinema': { transaction_type: 'Expense', transaction_subtype: 'Entertainment', transaction_category: 'Entertainment', target_account: '616003', flow: 'outflow', payment_status: 'Completed' },
      'Supermarket - Personal Care': { transaction_type: 'Expense', transaction_subtype: 'Food & Consumables', transaction_category: 'Food & Consumables', target_account: '617004', flow: 'outflow', payment_status: 'Completed' },
      'Clothing Expense': { transaction_type: 'Expense', transaction_subtype: 'Tools, Materials & Clothing', transaction_category: 'Tools, Materials & Clothing', target_account: '618003', flow: 'outflow', payment_status: 'Completed' }
    },
    'Income & Revenue': {
      'Salary - Base Salary': { transaction_type: 'Income', transaction_subtype: 'Payroll & Active Income', transaction_category: 'Payroll & Active Income', target_account: '711001', flow: 'inflow', payment_status: 'Pending' },
      'Salary - Bonus': { transaction_type: 'Income', transaction_subtype: 'Payroll & Active Income', transaction_category: 'Payroll & Active Income', target_account: '711002', flow: 'inflow', payment_status: 'Completed' }
    }
  };

  const [mainMenu, setMainMenu] = useState('House & Utilities');
  const [subMenuAction, setSubMenuAction] = useState('Rent - Oeiras');

  const handleMainMenuChange = (val) => {
    setMainMenu(val);
    const subActions = Object.keys(cascadingConfig[val] || {});
    if (subActions.length > 0) {
      handleSubMenuChange(val, subActions[0]);
    }
  };

  const handleSubMenuChange = (main, sub) => {
    setSubMenuAction(sub);
    const payload = cascadingConfig[main]?.[sub];
    if (payload) {
      setTxClass(payload.transaction_type);
      setTxSubClass(payload.transaction_subtype);
      setTxCategory(payload.transaction_category);
      setTxTargetAccount(payload.target_account);
      setTxFlow(payload.flow);
      setTxStatus(payload.payment_status);
      setTxEntity(sub);
    }
  };

  const [txClass, setTxClass] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [txFrom, setTxFrom] = useState('');
  const [txValueDate, setTxValueDate] = useState(new Date().toISOString().split('T')[0]);
  const [txPostingDate, setTxPostingDate] = useState(new Date().toISOString().split('T')[0]);
  const [txDueDate, setTxDueDate] = useState('');
  const [txStatus, setTxStatus] = useState('');
  const [txSubClass, setTxSubClass] = useState('');
  const [txEntity, setTxEntity] = useState('');
  const [txCategory, setTxCategory] = useState('');
  const [txSubCategory] = useState('');
  const [txDescription, setTxDescription] = useState('');
  const [txTargetAccount, setTxTargetAccount] = useState('');
  const [txSourceDestBank, setTxSourceDestBank] = useState('');
  const [txFlow, setTxFlow] = useState('');
  const [editingTxId, setEditingTxId] = useState(null);
  const entityToTargetAccount = {
    "Salary": "711001",
    "Bonus": "711003",
    "Rent": "611001",
    "Repairs": "611002",
    "Decorations": "611003",
    "Utensils": "611004",
    "Electricity": "621001",
    "Gas": "621002",
    "Water": "621003",
    "Communications": "621004",
    "Gasoline": "631001",
    "Supermarket": "641001",
    "Tools and Equipment": "642001",
    "Clothing": "643001",
    "Restaurant": "661",
    "Cinema": "662",
    "Streaming": "663",
    "CGD": "111001",
    "Universo": "221002",
    "ActiveBank": "111003",
    "WizInk": "121004",
    "Inter(Brasil)": "111004",
    "Cofidis": "211006",
    "Jota": "212001",
    "Mae": "212002",
    "Savings Account": "131001",

    // New Mappings
    "Reni (Burrow)": "212003",
    "Pedro (Burrow)": "212004",
    "Social Security Debt": "231001",
    "Finances Debt": "231002",
    "NOS Debt": "231003",
    "PhD": "671001",
    "Trainings": "671002",
    "Psychology": "651006",
    "Psychiatry": "651007",
    "Dentist": "651008",
    "Pharmacy": "651009",
    "Second Rent (e.g., Portela)": "611005",
    "Secondary Communications (NOS)": "621005",
    "Public Transport (Metro/Train)": "632001",
    "Personal Care & Cosmetics": "644001",
    "Shoes": "645001",
    "Nightlife & Disco": "664001",
    "Gaming": "665001",
    "Vacation Subsidy": "711004",
    "Christmas Subsidy": "711005",
    "Teaching Classes": "712002"
  };
  // Auto-fill Entity Category when Entity changes
  const handleEntityChange = (entityVal) => {
    setTxEntity(entityVal);
    const mapped = entityMappings[entityVal];
    if (mapped) {
      setTxCategory(mapped);
    }
    const defaultTarget = entityToTargetAccount[entityVal];
    if (defaultTarget) {
      setTxTargetAccount(defaultTarget);
    }
  };


  // Bind Zustand states
  const email = useKingdomStore((state) => state.email);
  const gold = useKingdomStore((state) => state.gold);
  const level = useKingdomStore((state) => state.level);
  const xp = useKingdomStore((state) => state.xp);
  const gems = useKingdomStore((state) => state.gems);
  const user = useKingdomStore((state) => state.user);
  const role = useKingdomStore((state) => state.role);
  const transactions = useKingdomStore((state) => state.transactions);
  const isLoading = useKingdomStore((state) => state.isLoading);
  
  // Actions
  const fetchKingdomData = useKingdomStore((state) => state.fetchKingdomData);
  const fetchDashboardData = useKingdomStore((state) => state.fetchDashboardData);
  const registerTransaction = useKingdomStore((state) => state.registerTransaction);
  const registerTransactions = useKingdomStore((state) => state.registerTransactions);
  const deleteTransactions = useKingdomStore((state) => state.deleteTransactions);
  const initAuth = useKingdomStore((state) => state.initAuth);

  // Default to current year (or transaction year), and current quarter/month on load
  useEffect(() => {
    if (!hasInitializedYears) {
      const currentYear = new Date().getFullYear();
      const txYears = Array.from(new Set(transactions.map((tx) => tx.year).filter(Boolean))).map(String);
      const yearsToSelect = txYears.length > 0 ? [txYears.sort((a, b) => b - a)[0]] : [String(currentYear)];
      
      setSelectedYears(yearsToSelect);
      
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

  // Default origin from to Pedro for divagarpelamente@gmail.com and reset filter initialization state on email change
  useEffect(() => {
    setHasInitializedYears(false);
    if (email === 'divagarpelamente@gmail.com') {
      setTxFrom('Pedro');
      setQaFrom('Pedro');
    }
  }, [email]);

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
  const rawTemplates = useKingdomStore((state) => state.templates);
  const templates = useMemo(() => {
    if (email === 'divagarpelamente@gmail.com') {
      return rawTemplates.map(tpl => ({
        ...tpl,
        data: {
          ...tpl.data,
          from: 'Pedro'
        }
      }));
    }
    return rawTemplates;
  }, [rawTemplates, email]);

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

  const applyTemplate = (tpl) => {
    setTxClass(tpl.data.transaction_type);
    setTxAmount(tpl.data.amount);
    setTxFrom(email === 'divagarpelamente@gmail.com' ? 'Pedro' : tpl.data.from);
    setTxStatus(tpl.data.payment_status);
    setTxSubClass(tpl.data.transaction_subtype);
    setTxEntity(tpl.data.entity);
    setTxCategory(tpl.data.transaction_category);
    setTxDescription(tpl.data.description);
    setTxTargetAccount(tpl.data.target_account || '611001');
    setTxSourceDestBank(tpl.data.source_dest_bank || '111001');
    setTxFlow(tpl.data.flow || 'outflow');
    setTxValueDate(new Date().toISOString().split('T')[0]);
    setTxPostingDate(new Date().toISOString().split('T')[0]);

    // Try to auto-match template details to cascading config
    let matched = false;
    for (const [main, subActions] of Object.entries(cascadingConfig)) {
      for (const [sub, payload] of Object.entries(subActions)) {
        if (payload.target_account === tpl.data.target_account || sub.toLowerCase() === tpl.name.toLowerCase() || tpl.name.toLowerCase().includes(sub.toLowerCase())) {
          setMainMenu(main);
          setSubMenuAction(sub);
          matched = true;
          break;
        }
      }
      if (matched) break;
    }

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

  useEffect(() => {
    if (qaCategory !== '' && categoryOptions && !categoryOptions.includes(qaCategory)) {
      setQaCategory(categoryOptions[0] || '');
    }
  }, [categoryOptions, qaCategory]);

  const handleQaEntityChange = (entityVal) => {
    setQaEntity(entityVal);
    const mapped = entityMappings[entityVal];
    if (mapped) {
      setQaCategory(mapped);
    }
  };

  const handleSaveQuickAction = () => {
    const nameVal = qaName.trim();
    if (!nameVal) {
      toast.error(t.err_enter_value);
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
    const oldName = selectedQaNames[0];
    editOption('quickAction', oldName, nameVal, newTemplateData);
    toast.success(`Template "${nameVal}" updated successfully!`);
    setSelectedQaNames([]);
    setSelectedQaTemplateName('');
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
    setIsEditingQa(false);
  };

  const handleDeleteQuickAction = () => {
    selectedQaNames.forEach(name => {
      deleteOption('quickAction', name);
    });
    toast.success(`Deleted template(s)`);
    setSelectedQaNames([]);
    setSelectedQaTemplateName('');
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
  };

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
    
    setIsMatrixEditingAll(false);
    setMatrixEditingRowKey(null);
    setMatrixEditData({});
    toast.success("Categories matrix updated successfully!");
  };

  const handleDeleteMatrixSelections = () => {
    const selectedKeys = new Set(selectedMatrixKeys);
    const updatedRows = getMatrixRows().filter(row => !selectedKeys.has(row.key));
    handleSaveMatrix(updatedRows);
    setSelectedMatrixKeys([]);
  };

  const renderCategoriesMatrixTable = () => {
    let rows = getMatrixRows();
    if (categoriesSortField) {
      rows = [...rows].sort((a, b) => {
        const valA = (a[categoriesSortField] || '').toLowerCase();
        const valB = (b[categoriesSortField] || '').toLowerCase();
        if (valA < valB) return categoriesSortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return categoriesSortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }
    const isEditingAny = isMatrixEditingAll || matrixEditingRowKey !== null;

    return (
      <div className="flex flex-col h-full overflow-hidden">
        {selectedMatrixKeys.length > 0 && (
          <div className="flex items-center justify-between bg-[#8b4513]/10 border border-[#8b4513]/20 rounded-lg p-2 mb-2 animate-in fade-in slide-in-from-top-1 duration-150">
            <span className="text-[9px] font-black uppercase text-[#4b2c20] tracking-wider pl-1">
              Selected: <span className="font-bold text-amber-900">{selectedMatrixKeys.length}</span>
            </span>
          </div>
        )}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-left border-collapse text-[10px] font-sans">
            <thead>
              <tr className="bg-[#8b4513]/10 border-b border-[#8b4513]/20 text-[#4b2c20] font-black uppercase tracking-wider title-font">
                <th className="py-2 px-2 w-8 text-center">
                  <input
                    type="checkbox"
                    checked={selectedMatrixKeys.length === rows.length && rows.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedMatrixKeys(rows.map(r => r.key));
                      } else {
                        setSelectedMatrixKeys([]);
                      }
                    }}
                    className="cursor-pointer rounded border-[#8b4513]/30 text-[#8b4513] focus:ring-[#8b4513]"
                  />
                </th>
                <th
                  className="py-2 px-2 cursor-pointer hover:bg-[#8b4513]/20 select-none"
                  onClick={() => {
                    if (categoriesSortField === 'subtype') {
                      setCategoriesSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                    } else {
                      setCategoriesSortField('subtype');
                      setCategoriesSortDirection('asc');
                    }
                  }}
                >
                  Subtype {categoriesSortField === 'subtype' ? (categoriesSortDirection === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th
                  className="py-2 px-2 cursor-pointer hover:bg-[#8b4513]/20 select-none"
                  onClick={() => {
                    if (categoriesSortField === 'category') {
                      setCategoriesSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                    } else {
                      setCategoriesSortField('category');
                      setCategoriesSortDirection('asc');
                    }
                  }}
                >
                  Category {categoriesSortField === 'category' ? (categoriesSortDirection === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th
                  className="py-2 px-2 cursor-pointer hover:bg-[#8b4513]/20 select-none"
                  onClick={() => {
                    if (categoriesSortField === 'entity') {
                      setCategoriesSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                    } else {
                      setCategoriesSortField('entity');
                      setCategoriesSortDirection('asc');
                    }
                  }}
                >
                  Entity {categoriesSortField === 'entity' ? (categoriesSortDirection === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th className="py-2 px-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#8b4513]/10 text-stone-700 font-bold">
              {rows.map((row) => {
                const isChecked = selectedMatrixKeys.includes(row.key);
                const isInlineEditing = matrixEditingRowKey === row.key;
                const isEditingRow = isMatrixEditingAll || isInlineEditing;

                const displaySubtype = isEditingRow ? (matrixEditData[row.key]?.subtype ?? row.subtype) : row.subtype;
                const displayCategory = isEditingRow ? (matrixEditData[row.key]?.category ?? row.category) : row.category;
                const displayEntity = isEditingRow ? (matrixEditData[row.key]?.entity ?? row.entity) : row.entity;

                const handleFieldChange = (field, val) => {
                  setMatrixEditData(prev => ({
                    ...prev,
                    [row.key]: {
                      ...(prev[row.key] || { subtype: row.subtype, category: row.category, entity: row.entity }),
                      [field]: val
                    }
                  }));
                };

                return (
                  <tr key={row.key} className={`hover:bg-[#8b4513]/5 transition-colors ${isChecked ? 'bg-[#8b4513]/10' : ''}`}>
                    <td className="py-2 px-2 text-center">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedMatrixKeys(prev => [...prev, row.key]);
                          } else {
                            setSelectedMatrixKeys(prev => prev.filter(k => k !== row.key));
                          }
                        }}
                        className="cursor-pointer rounded border-[#8b4513]/30 text-[#8b4513] focus:ring-[#8b4513]"
                      />
                    </td>
                    <td className="py-2 px-2">
                      {isEditingRow ? (
                        <input
                          type="text"
                          value={displaySubtype}
                          onChange={(e) => handleFieldChange('subtype', e.target.value)}
                          className="bg-white border border-[#8b4513]/30 rounded px-1.5 py-0.5 w-full text-[10px] font-bold text-[#4b2c20]"
                        />
                      ) : (
                        row.subtype || <span className="text-[#5d4037]/40 italic font-medium">None</span>
                      )}
                    </td>
                    <td className="py-2 px-2">
                      {isEditingRow ? (
                        <input
                          type="text"
                          value={displayCategory}
                          onChange={(e) => handleFieldChange('category', e.target.value)}
                          className="bg-white border border-[#8b4513]/30 rounded px-1.5 py-0.5 w-full text-[10px] font-bold text-[#4b2c20]"
                        />
                      ) : (
                        row.category || <span className="text-[#5d4037]/40 italic font-medium">None</span>
                      )}
                    </td>
                    <td className="py-2 px-2">
                      {isEditingRow ? (
                        <input
                          type="text"
                          value={displayEntity}
                          onChange={(e) => handleFieldChange('entity', e.target.value)}
                          className="bg-white border border-[#8b4513]/30 rounded px-1.5 py-0.5 w-full text-[10px] font-bold text-[#4b2c20]"
                        />
                      ) : (
                        row.entity || <span className="text-[#5d4037]/40 italic font-medium">None</span>
                      )}
                    </td>
                    <td className="py-2 px-2 text-right">
                      {isInlineEditing ? (
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              const updatedRows = rows.map(r => r.key === row.key ? {
                                subtype: matrixEditData[row.key]?.subtype ?? row.subtype,
                                category: matrixEditData[row.key]?.category ?? row.category,
                                entity: matrixEditData[row.key]?.entity ?? row.entity
                              } : r);
                              handleSaveMatrix(updatedRows);
                            }}
                            className="bg-[#8b4513] hover:bg-[#8b4513]/90 text-white rounded px-1.5 py-0.5 text-[9px] font-bold shadow cursor-pointer"
                          >
                            💾 Save
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setMatrixEditingRowKey(null);
                              setMatrixEditData(prev => {
                                const copy = { ...prev };
                                delete copy[row.key];
                                return copy;
                              });
                            }}
                            className="bg-stone-500 hover:bg-stone-600 text-white rounded px-1.5 py-0.5 text-[9px] font-bold shadow cursor-pointer"
                          >
                            ❌ Cancel
                          </button>
                        </div>
                      ) : !isMatrixEditingAll ? (
                        <button
                          type="button"
                          onClick={() => {
                            setMatrixEditingRowKey(row.key);
                            setMatrixEditData({
                              [row.key]: { subtype: row.subtype, category: row.category, entity: row.entity }
                            });
                          }}
                          className="text-blue-700 hover:text-blue-900 border border-transparent hover:border-blue-200 hover:bg-blue-50 px-1.5 py-0.5 rounded transition-all text-[9px] font-black cursor-pointer"
                        >
                          ✏️ Edit
                        </button>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderSettingsPanel = () => {
    let title = '';
    let currentList = [];
    let showEntityCategorySelector = false;

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
          {(selectedSettingType === 'quickAction' || selectedSettingType === 'allActions' || selectedSettingType === 'class') && (
            <div className="flex items-center gap-2.5">
              {/* Buttons */}
              <div className="flex gap-1">
                {selectedSettingType === 'class' && (
                  <>
                    {selectedMatrixKeys.length > 0 && (
                      <button
                        type="button"
                        onClick={handleDeleteMatrixSelections}
                        className="px-2.5 h-[28px] bg-red-755 hover:bg-red-800 text-white rounded-lg hover:scale-[1.05] active:scale-95 transition-all shadow cursor-pointer flex items-center justify-center font-black text-[9px] uppercase tracking-wider gap-1"
                        title="Delete Selected"
                      >
                        🗑️ Delete ({selectedMatrixKeys.length})
                      </button>
                    )}
                    {isMatrixEditingAll ? (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            const updatedRows = getMatrixRows().map(row => ({
                              subtype: matrixEditData[row.key]?.subtype ?? row.subtype,
                              category: matrixEditData[row.key]?.category ?? row.category,
                              entity: matrixEditData[row.key]?.entity ?? row.entity
                            }));
                            handleSaveMatrix(updatedRows);
                          }}
                          className="px-2.5 h-[28px] bg-emerald-755 hover:bg-emerald-800 text-white rounded-lg hover:scale-[1.05] active:scale-95 transition-all shadow cursor-pointer flex items-center justify-center font-black text-[9px] uppercase tracking-wider gap-1"
                          title="Save Changes"
                        >
                          💾 Save All
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsMatrixEditingAll(false);
                            setMatrixEditData({});
                          }}
                          className="px-2.5 h-[28px] bg-stone-500 hover:bg-stone-600 text-white rounded-lg hover:scale-[1.05] active:scale-95 transition-all shadow cursor-pointer flex items-center justify-center font-black text-[9px] uppercase tracking-wider gap-1"
                          title="Cancel Edit"
                        >
                          ❌ Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            const initialEditData = {};
                            getMatrixRows().forEach(row => {
                              initialEditData[row.key] = { subtype: row.subtype, category: row.category, entity: row.entity };
                            });
                            setMatrixEditData(initialEditData);
                            setIsMatrixEditingAll(true);
                          }}
                          className="px-2.5 h-[28px] bg-amber-700 hover:bg-amber-800 text-white rounded-lg hover:scale-[1.05] active:scale-95 transition-all shadow cursor-pointer flex items-center justify-center font-black text-[9px] uppercase tracking-wider gap-1"
                          title="Edit All Rows"
                        >
                          ✏️ Edit All
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setNewMatrixSubtype('');
                            setNewMatrixCategory('');
                            setNewMatrixEntity('');
                            setCustomSubtypeInput('');
                            setCustomCategoryInput('');
                            setIsAddMatrixModalOpen(true);
                          }}
                          className="px-2.5 h-[28px] bg-[#8b4513] hover:bg-[#8b4513]/90 text-white rounded-lg hover:scale-[1.05] active:scale-95 transition-all shadow cursor-pointer flex items-center justify-center font-black text-[9px] uppercase tracking-wider gap-1"
                          title="Add New Row"
                        >
                          ➕ New
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => settingsFileInputRef.current.click()}
                      className="px-2.5 h-[28px] bg-[#faf4e5]/90 border border-[#8b4513]/25 text-[#4b2c20] font-black text-[9px] uppercase tracking-wider rounded-lg shadow-sm hover:bg-[#8b4513]/10 active:scale-95 transition-all flex items-center gap-1 cursor-pointer ml-1"
                      title="Import Settings CSV"
                    >
                      <span>📥</span> Import
                    </button>
                    <input
                      type="file"
                      ref={settingsFileInputRef}
                      onChange={importSettingsCSV}
                      accept=".csv"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={exportSettingsCSV}
                      className="px-2.5 h-[28px] bg-[#faf4e5]/90 border border-[#8b4513]/25 text-[#4b2c20] font-black text-[9px] uppercase tracking-wider rounded-lg shadow-sm hover:bg-[#8b4513]/10 active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                      title="Export Settings CSV"
                    >
                      <span>📤</span> Export
                    </button>
                  </>
                )}
                {selectedSettingType !== 'class' && selectedQaNames.length > 0 ? (
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
                          setSelectedQaNames([tpl.name]);
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

            {/* List of items */}
            <div className="flex-1 overflow-y-auto border border-[#8b4513]/20 rounded-xl bg-[#faf4e5]/20 custom-scrollbar">
              {selectedSettingType === 'class' ? (
                renderCategoriesMatrixTable()
              ) : currentList.length > 0 ? (
                selectedSettingType === 'allActions' ? (
              <div className="flex flex-col h-full overflow-hidden">
                {selectedQaNames.length > 0 && (
                  <div className="flex items-center justify-between bg-[#8b4513]/10 border border-[#8b4513]/20 rounded-lg p-2 mb-2 animate-in fade-in slide-in-from-top-1 duration-150">
                    <span className="text-[9px] font-black uppercase text-[#4b2c20] tracking-wider pl-1">
                      Selected: <span className="font-bold text-amber-900">{selectedQaNames.length}</span>
                    </span>
                  </div>
                )}
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
                        } else if (actionsSortField === 'flow') {
                          valA = (a.data.flow || '').toLowerCase();
                          valB = (b.data.flow || '').toLowerCase();
                        }
 
                        if (valA < valB) return actionsSortDirection === 'asc' ? -1 : 1;
                        if (valA > valB) return actionsSortDirection === 'asc' ? 1 : -1;
                        return 0;
                      });
                    }
 
                    return (
                      <table className="w-full text-left border-collapse text-[10px] font-sans">
                        <thead>
                          <tr className="bg-[#8b4513]/10 border-b border-[#8b4513]/20 text-[#4b2c20] font-black uppercase tracking-wider title-font">
                            <th className="py-2 px-2 w-8 text-center">
                              <input
                                type="checkbox"
                                checked={selectedQaNames.length === currentList.length && currentList.length > 0}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedQaNames(currentList.map(tpl => tpl.name));
                                  } else {
                                    setSelectedQaNames([]);
                                  }
                                }}
                                className="cursor-pointer rounded border-[#8b4513]/30 text-[#8b4513] focus:ring-[#8b4513]"
                              />
                            </th>
                            <th
                              className="py-2 px-2 cursor-pointer hover:bg-[#8b4513]/20 select-none"
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
                              className="py-2 px-2 cursor-pointer hover:bg-[#8b4513]/20 select-none"
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
                              className="py-2 px-2 cursor-pointer hover:bg-[#8b4513]/20 select-none"
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
                            <th
                              className="py-2 px-2 cursor-pointer hover:bg-[#8b4513]/20 select-none"
                              onClick={() => {
                                if (actionsSortField === 'flow') {
                                  setActionsSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                                } else {
                                  setActionsSortField('flow');
                                  setActionsSortDirection('asc');
                                }
                              }}
                            >
                              Flow {actionsSortField === 'flow' ? (actionsSortDirection === 'asc' ? '▲' : '▼') : ''}
                            </th>
                            <th className="py-2 px-2 text-right">Edit</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#8b4513]/10 text-stone-700 font-bold">
                          {sortedList.map((tpl) => {
                            const isChecked = selectedQaNames.includes(tpl.name);
                            return (
                              <tr key={tpl.name} className={`hover:bg-[#8b4513]/5 transition-colors ${isChecked ? 'bg-[#8b4513]/10' : ''}`}>
                                <td className="py-2 px-2 text-center">
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
                                <td className="py-2 px-2 font-bold text-[#4b2c20]">
                                  {t(`tpl_${tpl.name.toLowerCase().replace(/\s+/g, '_')}`, tpl.name)}
                                </td>
                                <td className="py-2 px-2 text-stone-500 font-medium">
                                  {tpl.data.transaction_type} • {tpl.data.transaction_subtype}
                                </td>
                                <td className="py-2 px-2 text-stone-500 font-medium">{tpl.data.entity}</td>
                                <td className="py-2 px-2 text-stone-500 font-medium">{tpl.data.flow}</td>
                                <td className="py-2 px-2 text-right">
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
                                    className="text-blue-700 hover:text-blue-900 font-bold px-2 py-0.5 rounded border border-transparent hover:border-blue-200 hover:bg-blue-50 transition-all cursor-pointer"
                                    title="Edit Quick Action"
                                  >
                                    ✏️
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    );
                  })()}
                </div>
              </div>
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
      </>
    )}
  </div>
    );
  };

  const resetFormState = () => {
    setTxClass('');
    setTxAmount('');
    setTxFrom('');
    setTxValueDate(new Date().toISOString().split('T')[0]);
    setTxPostingDate(new Date().toISOString().split('T')[0]);
    setTxStatus('');
    setTxSubClass('');
    setTxEntity('');
    setTxCategory('');
    setTxDescription('');
    setTxTargetAccount('');
    setTxSourceDestBank('');
    setTxFlow('');
    setEditingTxId(null);
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
          payment_status: tx.payment_status,
          transaction_type: tx.transaction_type,
          target_account: tx.target_account,
          source_dest_bank: tx.source_dest_bank,
          flow: tx.flow,
          transaction_category: tx.transaction_category,
          transaction_subtype: tx.transaction_subtype,
          entity: tx.entity,
          origin: tx.from,
          amount: Number(tx.amount),
          description: tx.description,
          value_date: valueDate,
          posting_date: postingDate,
          due_date: tx.due_date || null,
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
      const activeProfileId = user?.id || GUEST_PROFILE_ID;
      await fetchKingdomData(activeProfileId);
      await fetchDashboardData(activeProfileId);
    } catch (err) {
      console.error('Error saving edits:', err);
      toast.error(`${t('err_save_failed') || 'Save failed'}: ${err.message || err}`, { id: toastId });
    }
  };

  const handleDeleteSelectedTransactions = async () => {
    if (selectedTxIds.length === 0) return;

    const confirmMessage = t('confirm_delete_transactions', 'Are you sure you want to delete the selected transactions?') || 'Are you sure you want to delete the selected transactions?';
    if (!window.confirm(confirmMessage)) return;

    const toastId = toast.loading(t('deleting_ledger') || 'Deleting ledger entries...');
    try {
      const activeProfileId = user?.id || GUEST_PROFILE_ID;
      const res = await deleteTransactions(activeProfileId, selectedTxIds);
      if (res && res.success) {
        toast.success(t('success_deleted_transactions') || 'Selected transactions deleted successfully!', { id: toastId });
        setSelectedTxIds([]);
        // Sync both store state and profile stats
        await fetchKingdomData(activeProfileId);
        await fetchDashboardData(activeProfileId);
      } else {
        throw new Error(res?.error || 'Unknown error');
      }
    } catch (err) {
      console.error('Error deleting transactions:', err);
      toast.error(`${t('err_delete_failed') || 'Delete failed'}: ${err.message || err}`, { id: toastId });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!txClass) {
        toast.error("Erro de Validação: Escolha um Tipo.");
        return;
      }
      if (!txSubClass) {
        toast.error("Erro de Validação: Escolha um Subtipo.");
        return;
      }
      if (!txFlow) {
        toast.error("Erro de Validação: Escolha um Fluxo.");
        return;
      }
      if (!txStatus) {
        toast.error("Erro de Validação: Escolha um Status.");
        return;
      }
      if (!txFrom) {
        toast.error(t.err_invalid_from || "Escolha uma Origem/De.");
        return;
      }
      if (!txCategory) {
        toast.error("Erro de Validação: Escolha uma Categoria.");
        return;
      }
      if (!txEntity) {
        toast.error("Erro de Validação: Escolha uma Entidade.");
        return;
      }
      if (!txAmount || isNaN(txAmount) || Number(txAmount) <= 0) {
        toast.error(t.err_invalid_amount);
        return;
      }

      // Account code validations (3-6 digits)
      const accountCodeRegex = /^\d{3,6}$/;
      const safeTarget = txTargetAccount || '';
      const safeSource = txSourceDestBank || '';

      if (!accountCodeRegex.test(safeTarget)) {
        toast.error(`Erro de Validação: Código da Conta de Destino (Target Account) deve ter entre 3 e 6 dígitos.`);
        return;
      }
      if (!accountCodeRegex.test(safeSource)) {
        toast.error(`Erro de Validação: Código da Conta de Origem (Source account) deve ter entre 3 e 6 dígitos.`);
        return;
      }

      const amountNum = Number(txAmount);

      if (editingTxId) {
        const { error } = await supabase
          .from('transactions')
          .upsert([{
            id: editingTxId,
            profile_id: user?.id || GUEST_PROFILE_ID,
            payment_status: txStatus,
            transaction_type: txClass,
            target_account: safeTarget,
            source_dest_bank: safeSource,
            flow: txFlow,
            transaction_subtype: txSubClass,
            entity: txEntity,
            origin: txFrom,
            amount: amountNum,
            description: txDescription || '',
            value_date: txValueDate,
            posting_date: txPostingDate,
            due_date: txDueDate || null,
            month: new Date(txPostingDate).toLocaleString('default', { month: 'long' }),
            year: new Date(txPostingDate).getFullYear(),
            quarter: 'Q' + (Math.floor(new Date(txPostingDate).getMonth() / 3) + 1)
          }]);

        if (error) throw error;
        toast.success("Transaction updated successfully!");
        setIsNewTxModalOpen(false);
        setEditingTxId(null);
        setTxAmount('');
        setTxDescription('');
        setTxFrom('');
        setTxSubClass('');
        setTxEntity('');
        setTxCategory('');
        setTxTargetAccount('');
        setTxSourceDestBank('');
        setTxFlow('');
        setTxValueDate(new Date().toISOString().split('T')[0]);
        setTxPostingDate(new Date().toISOString().split('T')[0]);
        setTxStatus('');
        setTxClass('');
        
        const activeProfileId = user?.id || GUEST_PROFILE_ID;
        await fetchKingdomData(activeProfileId);
        await fetchDashboardData(activeProfileId);
        return;
      }

      const res = await registerTransaction(user?.id || GUEST_PROFILE_ID, {
        transaction_type: txClass,
        amount: amountNum,
        from: txFrom,
        value_date: txValueDate,
        posting_date: txPostingDate,
        payment_status: txStatus,
        transaction_subtype: txSubClass,
        entity: txEntity,
        transaction_category: txCategory,
        target_account: safeTarget,
        source_dest_bank: safeSource,
        flow: txFlow,
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
        setTxFrom('');
        setTxSubClass('');
        setTxEntity('');
        setTxCategory('');
        setTxTargetAccount('');
        setTxSourceDestBank('');
        setTxFlow('');
        setTxValueDate(new Date().toISOString().split('T')[0]);
        setTxPostingDate(new Date().toISOString().split('T')[0]);
        setTxStatus('');
        setTxClass('');
      } else {
        toast.error(t('err_transaction_failed', { error: res.error }));
      }
    } catch (err) {
      console.error('Error in handleSubmit:', err);
      toast.error(`Error saving transaction: ${err.message || err}`);
    }
  };

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
        <Modal
          isOpen={isAddMatrixModalOpen}
          onClose={() => setIsAddMatrixModalOpen(false)}
          title="Add New Category/Entity Mapping"
          {...STANDARD_MODAL_PROPS}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const subtype = newMatrixSubtype === 'NEW_SUBTYPE' ? customSubtypeInput.trim() : newMatrixSubtype;
              const category = newMatrixCategory === 'NEW_CATEGORY' ? customCategoryInput.trim() : newMatrixCategory;
              const entity = newMatrixEntity.trim();

              if (!subtype && !category && !entity) {
                toast.error("At least one field must be filled!");
                return;
              }

              const currentRows = getMatrixRows();
              const isDuplicate = currentRows.some(row => 
                (row.subtype || '').toLowerCase() === (subtype || '').toLowerCase() &&
                (row.category || '').toLowerCase() === (category || '').toLowerCase() &&
                (row.entity || '').toLowerCase() === (entity || '').toLowerCase()
              );
              
              if (isDuplicate) {
                toast.error("This mapping already exists!");
                return;
              }

              const newRow = {
                subtype,
                category,
                entity
              };
              handleSaveMatrix([...currentRows, newRow]);
              setIsAddMatrixModalOpen(false);
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">
                Subtype
              </label>
              <select
                value={newMatrixSubtype}
                onChange={(e) => setNewMatrixSubtype(e.target.value)}
                className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/25 rounded-lg h-[38px] px-2 text-xs font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50"
              >
                <option value="">-- Select Subtype --</option>
                {subClassOptions.map((sub) => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
                <option value="NEW_SUBTYPE">+ Add New Subtype...</option>
              </select>
              {newMatrixSubtype === 'NEW_SUBTYPE' && (
                <input
                  type="text"
                  placeholder="Enter New Subtype"
                  value={customSubtypeInput}
                  onChange={(e) => setCustomSubtypeInput(e.target.value)}
                  required
                  className="w-full mt-2 bg-[#faf4e5]/85 border border-[#8b4513]/25 rounded-lg h-[34px] px-3 text-xs font-bold text-[#4b2c20] focus:outline-none"
                />
              )}
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">
                Category
              </label>
              <select
                value={newMatrixCategory}
                onChange={(e) => setNewMatrixCategory(e.target.value)}
                className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/25 rounded-lg h-[38px] px-2 text-xs font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50"
              >
                <option value="">-- Select Category --</option>
                {categoryOptions.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
                <option value="NEW_CATEGORY">+ Add New Category...</option>
              </select>
              {newMatrixCategory === 'NEW_CATEGORY' && (
                <input
                  type="text"
                  placeholder="Enter New Category"
                  value={customCategoryInput}
                  onChange={(e) => setCustomCategoryInput(e.target.value)}
                  required
                  className="w-full mt-2 bg-[#faf4e5]/85 border border-[#8b4513]/25 rounded-lg h-[34px] px-3 text-xs font-bold text-[#4b2c20] focus:outline-none"
                />
              )}
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">
                Entity
              </label>
              <input
                type="text"
                placeholder="Enter Entity Name (Optional)"
                value={newMatrixEntity}
                onChange={(e) => setNewMatrixEntity(e.target.value)}
                className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/25 rounded-lg h-[38px] px-3 text-xs font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-[#8b4513] text-white font-black text-[10px] uppercase tracking-wider rounded-xl hover:scale-[1.01] active:scale-99 transition-all shadow border border-[#d4af37]/25 cursor-pointer"
            >
              Add Mapping
            </button>
          </form>
        </Modal>
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
          {...STANDARD_MODAL_PROPS}
        >
          <div className="space-y-6 h-full overflow-y-auto custom-scrollbar-subtle pr-1">
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
                    placeholder="e.g. 111001"
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
                      <>
                        <button
                          type="button"
                          onClick={handleStartEditing}
                          className="px-3 py-1.5 bg-[#8b4513] hover:bg-[#8b4513]/90 text-[#ffd700] font-black text-[9px] uppercase tracking-wider rounded-lg shadow-sm hover:scale-[1.02] active:scale-98 transition-all flex items-center justify-center gap-1 cursor-pointer"
                        >
                          ✏️ {t('edit') || 'Edit'}
                        </button>
                        <button
                          type="button"
                          onClick={handleDeleteSelectedTransactions}
                          className="px-3 py-1.5 bg-[#8b0000] hover:bg-[#8b0000]/90 text-[#ffd700] font-black text-[9px] uppercase tracking-wider rounded-lg shadow-sm hover:scale-[1.02] active:scale-98 transition-all flex items-center justify-center gap-1 cursor-pointer"
                        >
                          🗑️ {t('delete') || 'Delete'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Responsive Table with horizontal scroll */}
              <div className="max-h-[170px] overflow-y-auto border border-[#8b4513]/25 rounded-xl bg-[#faf4e5]/40 custom-scrollbar">
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
                          <th className="py-2.5 px-3 whitespace-nowrap">Target Account / Source Bank</th>
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
                                  {/* target_account & source_dest_bank */}
                                  <td className="py-1 px-1 whitespace-nowrap flex flex-col gap-1">
                                    <select
                                      value={editingTxs[tx.id]?.target_account || ''}
                                      onChange={(e) => handleFieldChange(tx.id, 'target_account', e.target.value)}
                                      className="bg-[#faf4e5]/90 border border-[#8b4513]/30 rounded text-[9px] font-bold text-[#4b2c20] w-24 px-1 py-0.5 focus:outline-none font-sans"
                                    >
                                      {Object.entries(accountMappings).map(([code, name]) => (
                                        <option key={code} value={code}>{name}</option>
                                      ))}
                                    </select>
                                    <select
                                      value={editingTxs[tx.id]?.source_dest_bank || ''}
                                      onChange={(e) => handleFieldChange(tx.id, 'source_dest_bank', e.target.value)}
                                      className="bg-[#faf4e5]/90 border border-[#8b4513]/30 rounded text-[9px] font-bold text-[#4b2c20] w-24 px-1 py-0.5 focus:outline-none font-sans"
                                    >
                                      {Object.entries(accountMappings).map(([code, name]) => (
                                        <option key={code} value={code}>{name}</option>
                                      ))}
                                    </select>
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
                                      tx.flow === 'inflow' 
                                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-250' 
                                        : tx.flow === 'outflow'
                                          ? 'bg-rose-100 text-rose-800 border border-rose-250'
                                          : 'bg-stone-100 text-stone-800 border border-stone-250'
                                    }`}>
                                      {tx.transaction_type}
                                    </span>
                                  </td>
                                  <td className="py-2 px-3 whitespace-nowrap text-stone-600">{tx.transaction_subtype || '-'}</td>
                                  <td className="py-2 px-3 whitespace-nowrap text-stone-600">{tx.entity || '-'}</td>
                                  <td className={`py-2 px-3 whitespace-nowrap text-right font-mono font-black ${
                                    tx.flow === 'inflow' ? 'text-emerald-700' : (tx.flow === 'outflow' ? 'text-rose-700' : 'text-stone-600')
                                  }`}>
                                    {formatNumberCompact(tx.flow === 'inflow' ? Number(tx.amount) : (tx.flow === 'outflow' ? -Number(tx.amount) : Number(tx.amount)))}
                                  </td>
                                  <td className="py-2 px-3 whitespace-nowrap text-stone-500 max-w-[150px] truncate" title={tx.description || ''}>{tx.description || '-'}</td>
                                  <td className="py-2 px-3 whitespace-nowrap text-stone-650 font-bold text-[9.5px]" title={`${tx.target_account}${tx.source_dest_bank ? ` / ${tx.source_dest_bank}` : ''}`}>
                                    {getAccountName(tx.target_account)}
                                    {tx.source_dest_bank ? ` / ${getAccountName(tx.source_dest_bank)}` : ''}
                                  </td>
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
                                <div className={`font-mono font-black text-xs ${tx.flow === 'inflow' ? 'text-emerald-700' : (tx.flow === 'outflow' ? 'text-rose-700' : 'text-stone-600')}`}>
                                  {formatNumberCompact(tx.flow === 'inflow' ? Number(tx.amount) : (tx.flow === 'outflow' ? -Number(tx.amount) : Number(tx.amount)))}
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
          {...STANDARD_MODAL_PROPS}
        >
          <div className="w-full h-full overflow-y-auto custom-scrollbar-subtle pr-1">
            {/* Main Form Area */}
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="flex items-center justify-end gap-3 border-b border-[#8b4513]/20 pb-2.5 mb-2.5">
                {/* Save Button Symbol */}
                <div className="flex flex-col items-center">
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

                {/* Quick Actions Dropdown */}
                <div className="flex flex-col items-center">
                  <label className="block text-[8px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-0.5 text-center font-sans">
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
                    className="bg-[#faf4e5]/90 border border-[#8b4513]/25 rounded-md h-[28px] px-2 text-[10px] font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50 font-sans cursor-pointer"
                  >
                    <option value="" disabled hidden>-- Select --</option>
                    <option value="">-- Choose --</option>
                    {templates.map((tpl, idx) => (
                      <option key={idx} value={tpl.name}>
                        {tpl.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* All Actions Dropdown (Placeholder) */}
                <div className="flex flex-col items-center">
                  <label className="block text-[8px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-0.5 text-center font-sans">
                    All Actions
                  </label>
                  <select
                    disabled
                    value=""
                    className="bg-[#faf4e5]/50 border border-[#8b4513]/20 rounded-md h-[28px] px-2 text-[10px] font-bold text-[#4b2c20]/60 cursor-not-allowed focus:outline-none font-sans"
                  >
                    <option value="" disabled hidden>-- Select --</option>
                    <option value="">-- All Actions --</option>
                  </select>
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

        {/* Transactions View (Financial Ledger) */}
        {activeTab === 'transactions' && (
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
                          <>
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
                            <button
                              type="button"
                              onClick={handleDeleteSelectedTransactions}
                              className="px-3 py-1.5 bg-[#8b0000] border-2 border-[#ffd700]/30 text-[#ffd700] font-black text-[9px] uppercase tracking-wider rounded-lg shadow-sm hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer animate-in fade-in zoom-in duration-150"
                            >
                              <span>🗑️</span> {t('delete') || 'Delete'}
                            </button>
                          </>
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
                <div className="max-h-[170px] overflow-y-auto border border-[#8b4513]/25 rounded-xl bg-[#faf4e5]/40 custom-scrollbar shadow-inner">
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
                            <th className="py-2.5 px-3 whitespace-nowrap">{t('ledger.headers.date')}</th>
                            <th className="py-2.5 px-3 whitespace-nowrap">{t('ledger.headers.from')}</th>
                            <th className="py-2.5 px-3 whitespace-nowrap">{t('ledger.headers.status')}</th>
                            <th className="py-2.5 px-3 whitespace-nowrap">{t('ledger.headers.type')}</th>
                            <th className="py-2.5 px-3 whitespace-nowrap">{t('ledger.headers.category')}</th>
                            <th className="py-2.5 px-3 whitespace-nowrap">{t('ledger.headers.subcategory')}</th>
                            <th className="py-2.5 px-3 whitespace-nowrap">{t('ledger.headers.entity')}</th>
                            <th className="py-2.5 px-3 whitespace-nowrap">Nature/Flow</th>
                            <th className="py-2.5 px-3 whitespace-nowrap text-right">{t('ledger.headers.amount')}</th>
                            <th className="py-2.5 px-3 whitespace-nowrap text-right">{t('edit') || 'Edit'}</th>
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
                                      type="date"
                                      value={editingTxs[tx.id]?.posting_date || ''}
                                      onChange={e => handleFieldChange(tx.id, 'posting_date', e.target.value)}
                                      className="w-24 bg-[#faf4e5]/90 border border-[#8b4513]/30 rounded text-[9px] font-bold text-[#4b2c20] focus:outline-none px-1 py-0.5 font-sans"
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
                                    <select
                                      value={editingTxs[tx.id]?.transaction_category || ''}
                                      onChange={e => handleFieldChange(tx.id, 'transaction_category', e.target.value)}
                                      className="w-full bg-[#faf4e5]/90 border border-[#8b4513]/30 rounded text-[9px] font-bold text-[#4b2c20] focus:outline-none px-1 py-0.5 font-sans"
                                    >
                                      <option value="">-</option>
                                      {categoryOptions.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                      ))}
                                    </select>
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
                                    <input
                                      type="number"
                                      value={editingTxs[tx.id]?.amount || 0}
                                      onChange={e => handleFieldChange(tx.id, 'amount', e.target.value)}
                                      className="w-20 bg-[#faf4e5]/90 border border-[#8b4513]/30 rounded text-[9px] font-bold text-[#4b2c20] focus:outline-none px-1 py-0.5 font-mono text-right"
                                    />
                                  </td>
                                  <td className="py-2 px-3 whitespace-nowrap text-right"></td>
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
                                <td className="py-2 px-3 whitespace-nowrap text-stone-600">{tx.posting_date || tx.value_date || '-'}</td>
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
                                    tx.flow === 'inflow' 
                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                                      : tx.flow === 'outflow'
                                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                        : 'bg-stone-100 text-stone-800 border border-stone-200'
                                  }`}>
                                    {tx.transaction_type}
                                  </span>
                                </td>
                                <td className="py-2 px-3 whitespace-nowrap text-stone-600">{entityMappings[tx.entity] || tx.transaction_category || '-'}</td>
                                <td className="py-2 px-3 whitespace-nowrap text-stone-600">{tx.transaction_subtype || '-'}</td>
                                <td className="py-2 px-3 whitespace-nowrap text-stone-600">{tx.entity || '-'}</td>
                                <td className="py-2 px-3 whitespace-nowrap">
                                  <span className="text-[9px] font-mono text-stone-500 font-bold bg-[#8b4513]/10 px-1.5 py-0.5 rounded uppercase mr-1" title="Target Account">{tx.target_account || '-'}</span>
                                  <span className="text-[9px] font-mono text-stone-500 font-bold bg-[#8b4513]/10 px-1.5 py-0.5 rounded uppercase" title="Source/Dest Bank">{tx.source_dest_bank || '-'}</span>
                                </td>
                                <td className={`py-2 px-3 whitespace-nowrap text-right font-mono font-black ${
                                  tx.flow === 'inflow' ? 'text-emerald-700' : (tx.flow === 'outflow' ? 'text-rose-700' : 'text-stone-600')
                                }`}>
                                  {tx.flow === 'inflow' ? '+' : (tx.flow === 'outflow' ? '-' : '')}{Number(tx.amount).toLocaleString()}g
                                </td>
                                <td className="py-2 px-3 whitespace-nowrap text-right">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setTxClass(tx.transaction_type || '');
                                      setTxAmount(tx.amount || '');
                                      setTxFrom(tx.from || '');
                                      setTxValueDate(tx.value_date || new Date().toISOString().split('T')[0]);
                                      setTxPostingDate(tx.posting_date || new Date().toISOString().split('T')[0]);
                                      setTxStatus(tx.payment_status || '');
                                      setTxSubClass(tx.transaction_subtype || '');
                                      setTxEntity(tx.entity || '');
                                      setTxCategory(tx.transaction_category || '');
                                      setTxDescription(tx.description || '');
                                      setTxTargetAccount(tx.target_account || '');
                                      setTxSourceDestBank(tx.source_dest_bank || '');
                                      setTxFlow(tx.flow || '');
                                      setEditingTxId(tx.id);
                                      setIsNewTxModalOpen(true);
                                    }}
                                    className="text-[#b8860b] hover:text-[#d4af37] font-black px-2 py-0.5 rounded border border-[#8b4513]/25 hover:bg-[#8b4513]/10 transition-all cursor-pointer"
                                    title="Edit Transaction"
                                  >
                                    ✏️
                                  </button>
                                </td>
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
                                      <span className="uppercase text-[8px] bg-amber-100 text-amber-800 px-1 rounded border border-amber-200">{entityMappings[tx.entity] || tx.transaction_category || '-'}</span>
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
                      {t('no_transactions_registered', 'No transactions registered in this list.')}
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

