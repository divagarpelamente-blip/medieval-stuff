/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useRef } from 'react';
import HUD from './components/HUD';
import BottomNav from './components/BottomNav';
import IsometricMap from './components/IsometricMap';
import Modal from './components/Modal';
import bgMap from './assets/Medieval_Town_Backround.png';
import { useKingdomStore } from './store/useKingdomStore';
import { Toaster, toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const GUEST_PROFILE_ID = '00000000-0000-0000-0000-000000000000';

function App() {
  const [activeTab, setActiveTab] = useState('quests');
  const [isMineModalOpen, setIsMineModalOpen] = useState(false);
  const [isNewTxModalOpen, setIsNewTxModalOpen] = useState(false);
  const fileInputRef = useRef(null);

  // Transactions Page Filters state
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(true);
  const [filterYear, setFilterYear] = useState('All');
  const [filterMonth, setFilterMonth] = useState('All');
  const [filterQuarter, setFilterQuarter] = useState('All');
  const [filterFrom, setFilterFrom] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [filterDate, setFilterDate] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');

  // Dashboard Page Sub-Tabs and Granularity state
  const [dashSubTab, setDashSubTab] = useState('overview'); // overview, income_expense, payables_receivables
  const [dashGranularity, setDashGranularity] = useState('quarter'); // month, quarter, year

  // Interactive Diverging Bar Chart local controls
  const [chartTimeHorizon, setChartTimeHorizon] = useState('all'); // all, moon, cycles
  const [chartGranularity, setChartGranularity] = useState('all'); // all, Income, Expense, Savings
  const [chartScaleMode, setChartScaleMode] = useState('absolute'); // absolute, percentage
  const [chartTooltip, setChartTooltip] = useState(null); // { name, type, amount, percentage, x, y }

  // Settings manage states
  const [selectedSettingType, setSelectedSettingType] = useState('from');
  const [newOptionVal, setNewOptionVal] = useState('');
  const [newEntityCatVal, setNewEntityCatVal] = useState('Payroll');

  // Bind Zustand options
  const fromOptions = useKingdomStore((state) => state.fromOptions);
  const statusOptions = useKingdomStore((state) => state.statusOptions);
  const categoryOptions = useKingdomStore((state) => state.categoryOptions);
  const subcategoryOptions = useKingdomStore((state) => state.subcategoryOptions);
  const entityOptions = useKingdomStore((state) => state.entityOptions);
  const entityCategoryOptions = useKingdomStore((state) => state.entityCategoryOptions);
  const entityMappings = useKingdomStore((state) => state.entityMappings);
  const monthOptions = useKingdomStore((state) => state.monthOptions);

  const addOption = useKingdomStore((state) => state.addOption);
  const deleteOption = useKingdomStore((state) => state.deleteOption);

  // Form states
  const [txType, setTxType] = useState('income');
  const [txCategory, setTxCategory] = useState('Income');
  const [txAmount, setTxAmount] = useState('');
  const [txFrom, setTxFrom] = useState('Pedro');
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);
  const [txStatus, setTxStatus] = useState('Pending');
  const [txSubcategory, setTxSubcategory] = useState('Cash receipt');
  const [txEntity, setTxEntity] = useState('Salary');
  const [txEntityCategory, setTxEntityCategory] = useState('Payroll');
  const [txDescription, setTxDescription] = useState('');

  // Auto-fill Entity Category when Entity changes
  const handleEntityChange = (entityVal) => {
    setTxEntity(entityVal);
    const mapped = entityMappings[entityVal];
    if (mapped) {
      setTxEntityCategory(mapped);
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
  const registerTransaction = useKingdomStore((state) => state.registerTransaction);
  const registerTransactions = useKingdomStore((state) => state.registerTransactions);

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
    if (filterType !== 'All' && tx.type !== filterType) return false;
    if (filterDate && tx.date !== filterDate) return false;
    if (filterCategory !== 'All' && tx.category !== filterCategory) return false;
    return true;
  }).sort((a, b) => {
    const dateA = new Date(a.date || a.created_at);
    const dateB = new Date(b.date || b.created_at);
    return dateB - dateA;
  });

  // Calculate Dashboard Stats (dependent on filters)
  const dashInflow = transactions
    .filter((tx) => tx.type === 'income')
    .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

  const dashOutflow = transactions
    .filter((tx) => tx.type === 'expense')
    .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

  const dashNetBalance = dashInflow - dashOutflow;

  const dashEfficiencyRatio = dashInflow > 0 ? (dashNetBalance / dashInflow) * 100 : 0;

  // Group by category (based on dashboard filtered transactions)
  const categoriesList = ['Income', 'Expense', 'Savings', 'Debt'];
  const dashCategoryData = categoriesList.map((cat) => {
    const catTxs = transactions.filter((tx) => tx.category === cat);
    const income = catTxs.filter((tx) => tx.type === 'income').reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
    const expense = catTxs.filter((tx) => tx.type === 'expense').reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
    return { category: cat, income, expense, total: income + expense };
  }).filter((c) => c.total > 0);

  const maxDashCategoryVal = Math.max(...dashCategoryData.map(c => Math.max(c.income, c.expense)), 1);

  // Group by category and subcategory for Diverging Bar Chart
  const chartFilteredTransactions = transactions.filter((tx) => {
    if (!tx.date) return chartTimeHorizon === 'all';
    const txDate = new Date(tx.date);
    const now = new Date();
    if (chartTimeHorizon === 'moon') {
      return txDate.getFullYear() === now.getFullYear() && txDate.getMonth() === now.getMonth();
    }
    if (chartTimeHorizon === 'cycles') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);
      return txDate >= thirtyDaysAgo && txDate <= now;
    }
    return true; // all
  });

  let chartGroupedData = [];
  if (chartGranularity === 'all') {
    // Group by category
    const categories = ['Income', 'Expense', 'Savings', 'Debt'];
    chartGroupedData = categories.map((cat) => {
      const catTxs = chartFilteredTransactions.filter((tx) => tx.category === cat);
      const income = catTxs.filter((tx) => tx.type === 'income').reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
      const expense = catTxs.filter((tx) => tx.type === 'expense').reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
      return { name: cat, income, expense, net: income - expense, total: income + expense };
    });
  } else {
    // Group by subcategory under specific category
    const catTxs = chartFilteredTransactions.filter((tx) => tx.category === chartGranularity);
    const subcategories = Array.from(new Set(catTxs.map(tx => tx.subcategory).filter(Boolean)));
    chartGroupedData = subcategories.map((subcat) => {
      const subcatTxs = catTxs.filter((tx) => tx.subcategory === subcat);
      const income = subcatTxs.filter((tx) => tx.type === 'income').reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
      const expense = subcatTxs.filter((tx) => tx.type === 'expense').reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
      return { name: subcat, income, expense, net: income - expense, total: income + expense };
    });
  }

  // Filter out items with 0 total volume
  chartGroupedData = chartGroupedData.filter((item) => item.total > 0);

  // Sort descending by absolute value from the center line: Math.max(income, expense)
  chartGroupedData.sort((a, b) => Math.max(b.income, b.expense) - Math.max(a.income, a.expense));

  // Totals for tooltips / segment percentages
  const totalInflowSegment = chartGroupedData.reduce((sum, item) => sum + item.income, 0) || 1;
  const totalOutflowSegment = chartGroupedData.reduce((sum, item) => sum + item.expense, 0) || 1;
  const totalChartVolume = chartGroupedData.reduce((sum, item) => sum + item.total, 0) || 1;

  // Max value of any bar in the current grouping (to compute width percentage relative to max bar length)
  const maxChartBarVal = Math.max(...chartGroupedData.map(item => Math.max(item.income, item.expense)), 1);

  const handleChartMouseMove = (e, item, type) => {
    const rect = e.currentTarget.closest('.diverging-chart-container').getBoundingClientRect();
    const x = e.clientX - rect.left + 15;
    const y = e.clientY - rect.top + 15;
    
    let percentage = 0;
    let amount = 0;
    if (type === 'income') {
      amount = item.income;
      percentage = (item.income / totalInflowSegment) * 100;
    } else {
      amount = item.expense;
      percentage = (item.expense / totalOutflowSegment) * 100;
    }

    setChartTooltip({
      name: item.name,
      type,
      amount,
      percentage,
      x,
      y
    });
  };

  // Group by selected granularity
  const uniqueYearsList = Array.from(new Set(transactions.map(tx => tx.year).filter(Boolean))).sort((a, b) => a - b);
  const timeLabels = 
    dashGranularity === 'month'
      ? ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
      : dashGranularity === 'quarter'
        ? ['Q1', 'Q2', 'Q3', 'Q4']
        : uniqueYearsList.map(String);

  const dashTimeData = timeLabels.map((label) => {
    const matchedTxs = transactions.filter((tx) => {
      if (dashGranularity === 'month') return tx.month === label;
      if (dashGranularity === 'quarter') return tx.quarter === label;
      if (dashGranularity === 'year') return String(tx.year) === label;
      return false;
    });

    const income = matchedTxs.filter((tx) => tx.type === 'income').reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
    const expense = matchedTxs.filter((tx) => tx.type === 'expense').reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
    return { label, income, expense, total: income + expense };
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
    const amount = transactions
      .filter(tx => tx.from === fromName && tx.type === 'income')
      .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
    return { name: fromName, amount };
  }).filter(f => f.amount > 0).sort((a, b) => b.amount - a.amount);
  const maxFromAmount = Math.max(...fromAllocation.map(f => f.amount), 1);

  // Suggested Extra 2 - Top Entities (Maiores Comércios)
  const uniqueEntities = Array.from(new Set(transactions.map(tx => tx.entity).filter(Boolean)));
  const entityVolumes = uniqueEntities.map(entName => {
    const inflow = transactions
      .filter(tx => tx.entity === entName && tx.type === 'income')
      .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
    const outflow = transactions
      .filter(tx => tx.entity === entName && tx.type === 'expense')
      .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
    return { name: entName, inflow, outflow, total: inflow + outflow };
  }).filter(e => e.total > 0).sort((a, b) => b.total - a.total).slice(0, 5);

  // Suggested Extra 3 - Entity Categories cost breakdown (Income & Expenses tab)
  const uniqueEntityCats = Array.from(new Set(transactions.map(tx => tx.entity_category).filter(Boolean)));
  const entityCatExpenses = uniqueEntityCats.map(catName => {
    const amount = transactions
      .filter(tx => tx.entity_category === catName && tx.type === 'expense')
      .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
    return { name: catName, amount };
  }).filter(c => c.amount > 0).sort((a, b) => b.amount - a.amount);
  const maxEntityCatExp = Math.max(...entityCatExpenses.map(c => c.amount), 1);

  // Payables & Receivables variables
  const pendingIncomeList = transactions.filter(tx => tx.type === 'income' && tx.status === 'Pending');
  const pendingExpenseList = transactions.filter(tx => tx.type === 'expense' && (tx.status === 'Pending' || tx.status === 'Overdue'));

  const totalReceivables = pendingIncomeList.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
  const totalPayables = pendingExpenseList.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

  const totalPendingExpensesCount = pendingExpenseList.length;
  const totalOverdueExpensesCount = pendingExpenseList.filter(tx => tx.status === 'Overdue').length;
  const overdueRate = totalPendingExpensesCount > 0 ? (totalOverdueExpensesCount / totalPendingExpensesCount) * 100 : 0;


  // Fetch initial profile state on mount
  useEffect(() => {
    fetchKingdomData(GUEST_PROFILE_ID);
  }, [fetchKingdomData]);

  // Global key listener to return to previous screen on Escape
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isNewTxModalOpen) {
          setIsNewTxModalOpen(false);
        } else if (isMineModalOpen) {
          setIsMineModalOpen(false);
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
    if (categoryOptions && !categoryOptions.includes(txCategory)) {
      setTxCategory(categoryOptions[0] || '');
    }
  }, [categoryOptions, txCategory]);

  useEffect(() => {
    if (subcategoryOptions && !subcategoryOptions.includes(txSubcategory)) {
      setTxSubcategory(subcategoryOptions[0] || '');
    }
  }, [subcategoryOptions, txSubcategory]);

  useEffect(() => {
    if (entityOptions && !entityOptions.includes(txEntity)) {
      const firstEntity = entityOptions[0] || '';
      setTxEntity(firstEntity);
      setTxEntityCategory(entityMappings[firstEntity] || entityCategoryOptions[0] || '');
    }
  }, [entityOptions, entityMappings, txEntity, entityCategoryOptions]);

  useEffect(() => {
    if (entityCategoryOptions && !entityCategoryOptions.includes(txEntityCategory)) {
      setTxEntityCategory(entityCategoryOptions[0] || '');
    }
  }, [entityCategoryOptions, txEntityCategory]);

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
      case 'category':
        title = t.manage_category;
        currentList = categoryOptions;
        break;
      case 'subcategory':
        title = t.manage_subcategory;
        currentList = subcategoryOptions;
        break;
      case 'entity':
        title = t.manage_entity;
        currentList = entityOptions;
        showEntityCategorySelector = true;
        break;
      case 'entityCategory':
        title = t.manage_entityCategory;
        currentList = entityCategoryOptions;
        break;
      case 'month':
        title = t.manage_month;
        currentList = monthOptions;
        break;
      default:
        break;
    }

    const handleAddOptionSubmit = (e) => {
      e.preventDefault();
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
                  {entityCategoryOptions.map((opt) => (
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

        {/* List of items */}
        <div className="flex-1 overflow-y-auto border border-[#8b4513]/20 rounded-xl bg-[#faf4e5]/20 custom-scrollbar">
          {currentList.length > 0 ? (
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
    setTxType('income');
    setTxAmount('');
    setTxFrom(fromOptions[0] || 'Pedro');
    setTxDate(new Date().toISOString().split('T')[0]);
    setTxStatus(statusOptions[0] || 'Pending');
    setTxCategory(categoryOptions[0] || 'Income');
    setTxSubcategory(subcategoryOptions[0] || 'Cash receipt');
    setTxEntity(entityOptions[0] || 'Salary');
    setTxEntityCategory(entityMappings[entityOptions[0]] || 'Payroll');
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
    setActiveTab('dashboard');
  };

  const handleExportCSV = () => {
    const headers = [
      'type',
      'amount',
      'from',
      'date',
      'status',
      'category',
      'subcategory',
      'entity',
      'entity_category',
      'description'
    ];

    let csvContent = headers.join(',') + '\n';

    if (transactions && transactions.length > 0) {
      transactions.forEach((tx) => {
        const row = headers.map((header) => {
          let val = tx[header];
          if (header === 'entity_category' && tx.entity_category !== undefined) {
            val = tx.entity_category;
          }
          if (val === null || val === undefined) {
            return '';
          }
          let stringVal = String(val);
          if (stringVal.includes(',') || stringVal.includes('"') || stringVal.includes('\n')) {
            stringVal = '"' + stringVal.replace(/"/g, '""') + '"';
          }
          return stringVal;
        });
        csvContent += row.join(',') + '\n';
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `tesouro_real_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(
      transactions && transactions.length > 0
        ? t.success_export
        : t.success_export_empty
    );
  };

  const parseCSV = (text) => {
    const lines = [];
    let row = [""];
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      const next = text[i + 1];

      if (c === '"') {
        if (inQuotes && next === '"') {
          row[row.length - 1] += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (c === ',' && !inQuotes) {
        row.push("");
      } else if ((c === '\r' || c === '\n') && !inQuotes) {
        if (c === '\r' && next === '\n') {
          i++;
        }
        lines.push(row);
        row = [""];
      } else {
        row[row.length - 1] += c;
      }
    }
    if (row.length > 1 || row[0] !== "") {
      lines.push(row);
    }
    return lines;
  };

  const handleImportCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target.result;
        const parsed = parseCSV(text);
        if (parsed.length === 0 || (parsed.length === 1 && parsed[0][0] === '')) {
          toast.success(t.success_import_zero);
          return;
        }

        const headers = parsed[0].map(h => h.trim().toLowerCase());
        const rows = parsed.slice(1);

        if (rows.length === 0 || (rows.length === 1 && rows[0].length === 1 && rows[0][0] === '')) {
          toast.success(t.success_import_zero);
          return;
        }

        const listToInsert = [];
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          if (row.length === 1 && row[0] === '') continue; // skip empty lines

          const tx = {};
          headers.forEach((header, idx) => {
            let val = row[idx] ? row[idx].trim() : '';
            // normalize header keys
            if (header === 'entity category' || header === 'entity_category') {
              tx.entityCategory = val;
            } else if (header === 'from (origem)' || header === 'from') {
              tx.from = val;
            } else if (header === 'tipo' || header === 'type') {
              tx.type = val.toLowerCase();
            } else if (header === 'ouro' || header === 'coins' || header === 'amount') {
              tx.amount = Number(val);
            } else {
              tx[header] = val;
            }
          });

          // Validation
          if (!tx.type || !['income', 'expense'].includes(tx.type)) {
            tx.type = 'expense'; // default fallback
          }
          if (!tx.amount || isNaN(tx.amount)) {
            tx.amount = 0; // default fallback
          }
          if (!tx.category) {
            tx.category = tx.type === 'income' ? 'Income' : 'Expense';
          }
          if (!tx.from) {
            tx.from = fromOptions[0] || 'Pedro';
          }

          listToInsert.push(tx);
        }

        if (listToInsert.length === 0) {
          toast.success(t.success_import_zero);
          return;
        }

        const res = await registerTransactions(GUEST_PROFILE_ID, listToInsert);
        if (res.success) {
          toast.success(t('success_import', { count: listToInsert.length }));
        } else {
          toast.error(t('err_import_db', { error: res.error }));
        }
      } catch (err) {
        console.error(err);
        toast.error(t.err_import);
      } finally {
        // Clear value to allow importing the same file again
        e.target.value = '';
      }
    };
    reader.readAsText(file);
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
      type: txType,
      amount: amountNum,
      from: txFrom,
      date: txDate,
      status: txStatus,
      category: txCategory,
      subcategory: txSubcategory,
      entity: txEntity,
      entityCategory: txEntityCategory,
      description: txDescription || `${txCategory} log`
    });

    if (res.success) {
      toast.success(
        txType === 'income'
          ? t('success_added_gold', { amount: amountNum })
          : t('success_spent_gold', { amount: amountNum })
      );
      setTxAmount('');
      setTxDescription('');
      setTxFrom(fromOptions[0] || 'Pedro');
      setTxSubcategory(subcategoryOptions[0] || 'Cash receipt');
      setTxEntity(entityOptions[0] || 'Salary');
      setTxEntityCategory(entityMappings[entityOptions[0]] || 'Payroll');
      setTxDate(new Date().toISOString().split('T')[0]);
      setTxStatus(statusOptions[0] || 'Pending');
      setTxCategory(categoryOptions[0] || 'Income');
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
                    { id: 'category', label: t.manage_category, icon: '📁' },
                    { id: 'subcategory', label: t.manage_subcategory, icon: '📂' },
                    { id: 'entity', label: t.manage_entity, icon: '🏢' },
                    { id: 'entityCategory', label: t.manage_entityCategory, icon: '🏷️' },
                    { id: 'month', label: t.manage_month, icon: '📅' }
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
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

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
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {/* Type Selection */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">
                    {t.type}
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 h-11 md:h-[38px]">
                    <button
                      type="button"
                      onClick={() => setTxType('income')}
                      className={`rounded-lg border font-black text-[10px] uppercase tracking-wider transition-all ${
                        txType === 'income'
                          ? 'bg-emerald-800/20 border-emerald-600 text-emerald-800 shadow-sm'
                          : 'bg-stone-100/50 border-stone-300 text-stone-600 hover:bg-stone-200/50'
                      }`}
                    >
                      🟢 {t.income}
                    </button>
                    <button
                      type="button"
                      onClick={() => setTxType('expense')}
                      className={`rounded-lg border font-black text-[10px] uppercase tracking-wider transition-all ${
                        txType === 'expense'
                          ? 'bg-rose-800/20 border-rose-600 text-rose-800 shadow-sm'
                          : 'bg-stone-100/50 border-stone-300 text-stone-600 hover:bg-stone-200/50'
                      }`}
                    >
                      🔴 {t.expense}
                    </button>
                  </div>
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

                {/* Date */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">
                    {t.date}
                  </label>
                  <input
                    type="date"
                    value={txDate}
                    onChange={(e) => setTxDate(e.target.value)}
                    required
                    className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg h-11 md:h-[38px] px-3 text-xs font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50"
                  />
                </div>
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
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

                {/* Category */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">
                    {t.category}
                  </label>
                  <select
                    value={txCategory}
                    onChange={(e) => setTxCategory(e.target.value)}
                    className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg h-11 md:h-[38px] px-2 text-xs font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50"
                  >
                    {categoryOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                {/* Subcategory */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">
                    {t.subcategory}
                  </label>
                  <select
                    value={txSubcategory}
                    onChange={(e) => setTxSubcategory(e.target.value)}
                    className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg h-11 md:h-[38px] px-2 text-xs font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50"
                  >
                    {subcategoryOptions.map((opt) => (
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
                    className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg h-11 md:h-[38px] px-2 text-xs font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50"
                  >
                    {entityOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 3 */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Entity Category */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">
                    {t.entity_category}
                  </label>
                  <select
                    value={txEntityCategory}
                    onChange={(e) => setTxEntityCategory(e.target.value)}
                    className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg h-11 md:h-[38px] px-2 text-xs font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50"
                  >
                    {entityCategoryOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                {/* Description / Notes */}
                <div className="sm:col-span-2">
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

              {/* Responsive Table with horizontal scroll */}
              <div className="max-h-64 overflow-y-auto border border-[#8b4513]/25 rounded-xl bg-[#faf4e5]/40 custom-scrollbar">
                {transactions && transactions.length > 0 ? (
                  <>
                    {/* Desktop table view */}
                    <table className="hidden md:table w-full text-left border-collapse text-[10px] font-sans">
                      <thead>
                        <tr className="bg-[#8b4513]/10 border-b border-[#8b4513]/20 text-[#4b2c20] font-black uppercase tracking-wider title-font">
                          <th className="py-2.5 px-3 whitespace-nowrap">{t('ledger.headers.from')}</th>
                          <th className="py-2.5 px-3 whitespace-nowrap">{t('ledger.headers.date')}</th>
                          <th className="py-2.5 px-3 whitespace-nowrap">{t('ledger.headers.month')}</th>
                          <th className="py-2.5 px-3 whitespace-nowrap">{t('ledger.headers.year')}</th>
                          <th className="py-2.5 px-3 whitespace-nowrap">{t('ledger.headers.quarter')}</th>
                          <th className="py-2.5 px-3 whitespace-nowrap">{t('ledger.headers.type')}</th>
                          <th className="py-2.5 px-3 whitespace-nowrap">{t('ledger.headers.status')}</th>
                          <th className="py-2.5 px-3 whitespace-nowrap">{t('ledger.headers.category')}</th>
                          <th className="py-2.5 px-3 whitespace-nowrap">{t('ledger.headers.subcategory')}</th>
                          <th className="py-2.5 px-3 whitespace-nowrap">{t('ledger.headers.entity')}</th>
                          <th className="py-2.5 px-3 whitespace-nowrap">{t('ledger.headers.entity_category')}</th>
                          <th className="py-2.5 px-3 whitespace-nowrap text-right">{t('ledger.headers.amount')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#8b4513]/10 text-stone-700 font-bold">
                        {transactions.map((tx) => (
                          <tr key={tx.id} className="hover:bg-[#8b4513]/5 transition-colors">
                            <td className="py-2 px-3 whitespace-nowrap font-bold text-[#4b2c20]">{tx.from || '-'}</td>
                            <td className="py-2 px-3 whitespace-nowrap font-mono">{tx.date || '-'}</td>
                            <td className="py-2 px-3 whitespace-nowrap font-serif italic text-stone-600">{tx.month || '-'}</td>
                            <td className="py-2 px-3 whitespace-nowrap font-mono">{tx.year || '-'}</td>
                            <td className="py-2 px-3 whitespace-nowrap font-mono">{tx.quarter || '-'}</td>
                            <td className="py-2 px-3 whitespace-nowrap">
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                                tx.type === 'income' 
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-250' 
                                  : 'bg-rose-100 text-rose-800 border border-rose-250'
                              }`}>
                                {tx.type}
                              </span>
                            </td>
                            <td className="py-2 px-3 whitespace-nowrap">
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-black ${
                                tx.status === 'Completed' 
                                  ? 'bg-green-100 text-green-800 border border-green-200' 
                                  : 'bg-amber-100 text-amber-800 border border-amber-200'
                              }`}>
                                {tx.status || 'Completed'}
                              </span>
                            </td>
                            <td className="py-2 px-3 whitespace-nowrap text-stone-600">{tx.category}</td>
                            <td className="py-2 px-3 whitespace-nowrap text-stone-600">{tx.subcategory || '-'}</td>
                            <td className="py-2 px-3 whitespace-nowrap text-stone-600">{tx.entity || '-'}</td>
                            <td className="py-2 px-3 whitespace-nowrap text-stone-500 font-medium">{tx.entity_category || '-'}</td>
                            <td className={`py-2 px-3 whitespace-nowrap text-right font-mono font-black ${
                              tx.type === 'income' ? 'text-emerald-700' : 'text-rose-700'
                            }`}>
                              {tx.type === 'income' ? '+' : '-'}{Number(tx.amount).toLocaleString()} 💰
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Mobile cards view */}
                    <div className="grid grid-cols-1 gap-2.5 p-3 md:hidden">
                      {transactions.map((tx) => (
                        <div 
                          key={tx.id} 
                          className="bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-xl p-3 shadow-sm flex flex-col gap-2 relative overflow-hidden"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider bg-[#8b4513]/10 text-[#4b2c20]">
                                {tx.entity || tx.category}
                              </span>
                              <div className="text-[10px] font-bold text-[#5d4037]/80 mt-1">
                                {tx.from} • {tx.subcategory || '-'}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={`font-mono font-black text-xs ${tx.type === 'income' ? 'text-emerald-700' : 'text-rose-700'}`}>
                                {tx.type === 'income' ? '+' : '-'}{Number(tx.amount).toLocaleString()}g
                              </div>
                              <span className={`inline-block text-[8px] font-black px-1.5 py-0.5 rounded mt-1 ${
                                tx.status === 'Completed' 
                                  ? 'bg-green-100 text-green-800 border border-green-200' 
                                  : 'bg-amber-100 text-amber-800 border border-amber-200'
                              }`}>
                                {tx.status || 'Completed'}
                              </span>
                            </div>
                          </div>
                          <div className="border-t border-[#8b4513]/10 pt-2 flex justify-between text-[8.5px] text-stone-500 font-bold">
                            <span>📅 {tx.date} ({tx.month} {tx.year})</span>
                            <span className="uppercase text-[8px] bg-[#8b4513]/10 text-[#4b2c20] px-1 rounded">{tx.entity_category || '-'}</span>
                          </div>
                        </div>
                      ))}
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
          onClose={() => setIsNewTxModalOpen(false)}
          title={t.register_movement}
          size="max-w-4xl"
        >
          <div className="space-y-6">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {/* Type Selection */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">
                    {t.type}
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 h-11 md:h-[38px]">
                    <button
                      type="button"
                      onClick={() => setTxType('income')}
                      className={`rounded-lg border font-black text-[10px] uppercase tracking-wider transition-all ${
                        txType === 'income'
                          ? 'bg-emerald-800/20 border-emerald-600 text-emerald-800 shadow-sm cursor-pointer'
                          : 'bg-stone-100/50 border-stone-300 text-stone-600 hover:bg-stone-200/50 cursor-pointer'
                      }`}
                    >
                      🟢 {t.income}
                    </button>
                    <button
                      type="button"
                      onClick={() => setTxType('expense')}
                      className={`rounded-lg border font-black text-[10px] uppercase tracking-wider transition-all ${
                        txType === 'expense'
                          ? 'bg-rose-800/20 border-rose-600 text-rose-800 shadow-sm cursor-pointer'
                          : 'bg-stone-100/50 border-stone-300 text-stone-600 hover:bg-stone-200/50 cursor-pointer'
                      }`}
                    >
                      🔴 {t.expense}
                    </button>
                  </div>
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

                {/* Date */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">
                    {t.date}
                  </label>
                  <input
                    type="date"
                    value={txDate}
                    onChange={(e) => setTxDate(e.target.value)}
                    required
                    className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg h-11 md:h-[38px] px-3 text-xs font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50"
                  />
                </div>
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
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

                {/* Category */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">
                    {t.category}
                  </label>
                  <select
                    value={txCategory}
                    onChange={(e) => setTxCategory(e.target.value)}
                    className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg h-11 md:h-[38px] px-2 text-xs font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50"
                  >
                    {categoryOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                {/* Subcategory */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">
                    {t.subcategory}
                  </label>
                  <select
                    value={txSubcategory}
                    onChange={(e) => setTxSubcategory(e.target.value)}
                    className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg h-11 md:h-[38px] px-2 text-xs font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50"
                  >
                    {subcategoryOptions.map((opt) => (
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
                    className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg h-11 md:h-[38px] px-2 text-xs font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50"
                  >
                    {entityOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 3 */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Entity Category */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">
                    {t.entity_category}
                  </label>
                  <select
                    value={txEntityCategory}
                    onChange={(e) => setTxEntityCategory(e.target.value)}
                    className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg h-11 md:h-[38px] px-2 text-xs font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50"
                  >
                    {entityCategoryOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                {/* Description / Notes */}
                <div className="sm:col-span-2">
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
        </Modal>

        {/* Dashboard View (Royal Treasury Summary) */}
        {activeTab === 'dashboard' && (
          <div 
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setActiveTab('quests');
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
                onClick={() => setActiveTab('quests')}
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

              {/* Row 2: Navigation (Left) & Time Filters (Right) */}
              <div className="px-4 py-2.5 border-b border-[#8b4513]/25 flex flex-col md:flex-row justify-between items-center gap-3 bg-[#faf4e5]/40 z-10">
                {/* Left Buttons: Analysis Sub-tabs */}
                <div className="flex flex-wrap gap-1.5 items-center justify-center">
                  {[
                    { id: 'overview', label: t.subtab_overview, icon: '📊' },
                    { id: 'income_expense', label: t.subtab_income_expense, icon: '💸' },
                    { id: 'payables_receivables', label: t.subtab_payables_receivables, icon: '📜' }
                  ].map((tab) => {
                    const isSel = dashSubTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setDashSubTab(tab.id)}
                        className={`px-3 py-3 md:py-1.5 rounded-lg border font-black text-[9px] uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95 min-h-[44px] md:min-h-0 ${
                          isSel
                            ? 'bg-[#8b4513] border-[#8b4513] text-[#ffd700] shadow-md'
                            : 'bg-[#faf4e5]/80 border-[#8b4513]/20 text-[#5d4037]/80 hover:bg-[#8b4513]/10 hover:text-[#4b2c20]'
                        }`}
                      >
                        <span>{tab.icon}</span>
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                {/* Right Buttons: Time Views */}
                <div className="flex gap-1.5 items-center">
                  {[
                    { id: 'month', label: t.gran_month, icon: '📅' },
                    { id: 'quarter', label: t.gran_quarter, icon: '⏳' },
                    { id: 'year', label: t.gran_year, icon: '👑' }
                  ].map((gran) => {
                    const isSel = dashGranularity === gran.id;
                    return (
                      <button
                        key={gran.id}
                        type="button"
                        onClick={() => setDashGranularity(gran.id)}
                        className={`px-3 py-3 md:py-1.5 rounded-lg border font-black text-[9px] uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95 min-h-[44px] md:min-h-0 ${
                          isSel
                            ? 'bg-[#8b4513] border-[#8b4513] text-[#ffd700] shadow-md'
                            : 'bg-[#faf4e5]/80 border-[#8b4513]/20 text-[#5d4037]/80 hover:bg-[#8b4513]/10 hover:text-[#4b2c20]'
                        }`}
                      >
                        <span>{gran.icon}</span>
                        {gran.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar flex-grow relative z-10 text-[#2d1b0d] space-y-6">
                
                {/* SUBTAB: OVERVIEW */}
                {dashSubTab === 'overview' && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    {/* 1. KPIs */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      <div className="bg-[#faf4e5]/60 border border-[#8b4513]/25 rounded-xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden">
                        <span className="text-[9px] font-black uppercase text-stone-500 tracking-wider font-sans font-bold">{t.total_income_inflow}</span>
                        <span className="title-font text-xl font-black text-emerald-700 mt-1 font-mono">
                          +{dashInflow.toLocaleString()}g
                        </span>
                        <div className="absolute right-3 bottom-3 text-2xl opacity-15">📈</div>
                      </div>

                      <div className="bg-[#faf4e5]/60 border border-[#8b4513]/25 rounded-xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden">
                        <span className="text-[9px] font-black uppercase text-stone-500 tracking-wider font-sans font-bold">{t.total_expenses_outflow}</span>
                        <span className="title-font text-xl font-black text-rose-700 mt-1 font-mono">
                          -{dashOutflow.toLocaleString()}g
                        </span>
                        <div className="absolute right-3 bottom-3 text-2xl opacity-15">📉</div>
                      </div>

                      <div className="bg-[#faf4e5]/60 border border-[#8b4513]/25 rounded-xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden">
                        <span className="text-[9px] font-black uppercase text-stone-500 tracking-wider font-sans font-bold">{t.net_balance}</span>
                        <span className={`title-font text-xl font-black mt-1 font-mono ${
                          dashNetBalance >= 0 ? 'text-[#b8860b]' : 'text-rose-700'
                        }`}>
                          {dashNetBalance >= 0 ? '+' : ''}{dashNetBalance.toLocaleString()}g
                        </span>
                        <div className="absolute right-3 bottom-3 text-2xl opacity-15">💰</div>
                      </div>

                      <div className="bg-[#faf4e5]/60 border border-[#8b4513]/25 rounded-xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden">
                        <span className="text-[9px] font-black uppercase text-stone-500 tracking-wider font-sans font-bold">{t.savings_efficiency}</span>
                        <span className={`title-font text-xl font-black mt-1 font-mono ${
                          dashEfficiencyRatio >= 0 ? 'text-emerald-700' : 'text-rose-700'
                        }`}>
                          {dashEfficiencyRatio.toFixed(1)}%
                        </span>
                        <div className="absolute right-3 bottom-3 text-2xl opacity-15">🛡️</div>
                      </div>
                    </div>

                    {/* Advice Banner */}
                    <div className="bg-[#f4e4bc] border-2 border-double border-[#8b4513]/40 rounded-xl p-4 shadow-inner relative">
                      <div className="relative flex gap-3 items-center">
                        <div className="text-3xl">🧙‍♂️</div>
                        <div className="space-y-0.5">
                          <h5 className="text-[9px] font-black uppercase text-[#8b4513]/85 tracking-widest font-sans">{t.treasurer_advice_banner}</h5>
                          <p className="text-xs italic text-[#4b2c20] font-serif leading-relaxed">
                            {dashTreasurerAdvice}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 2. Charts Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Category Breakdown (Diverging Bar Chart) */}
                      <div className="bg-[#faf4e5]/60 border border-[#8b4513]/25 rounded-xl p-4 shadow-sm flex flex-col h-[340px] diverging-chart-container relative select-none">
                        {/* Selector Controls Header */}
                        <div className="flex flex-col gap-2 border-b border-[#8b4513]/10 pb-2 flex-shrink-0">
                          <div className="flex justify-between items-center">
                            <h4 className="title-font text-[11px] font-black text-[#4b2c20] uppercase tracking-wider">
                              {t('dashboard.charts.flow_by_category')}
                            </h4>
                            <div className="flex items-center gap-1">
                              <span className="text-[8px] font-sans font-medium text-stone-500 uppercase">{t('dashboard.charts.scale_mode')}:</span>
                              <button
                                type="button"
                                onClick={() => setChartScaleMode(chartScaleMode === 'absolute' ? 'percentage' : 'absolute')}
                                className="px-2 py-0.5 rounded bg-[#8b4513]/10 border border-[#8b4513]/20 hover:bg-[#8b4513]/20 text-[8px] font-bold text-[#4b2c20] transition-all cursor-pointer"
                              >
                                {chartScaleMode === 'absolute' ? t('dashboard.charts.scale_absolute') : t('dashboard.charts.scale_percentage')}
                              </button>
                            </div>
                          </div>

                          <div className="flex justify-between items-center gap-2">
                            <div className="flex gap-1">
                              {[
                                { id: 'all', label: t('dashboard.charts.horizon_all') },
                                { id: 'moon', label: t('dashboard.charts.horizon_moon') },
                                { id: 'cycles', label: t('dashboard.charts.horizon_cycles') }
                              ].map((hor) => {
                                const isSel = chartTimeHorizon === hor.id;
                                return (
                                  <button
                                    key={hor.id}
                                    type="button"
                                    onClick={() => setChartTimeHorizon(hor.id)}
                                    className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                                      isSel
                                        ? 'bg-[#8b4513] text-[#ffd700]'
                                        : 'bg-[#faf4e5]/80 border border-[#8b4513]/15 text-[#5d4037]/70 hover:bg-[#8b4513]/10'
                                    }`}
                                  >
                                    {hor.label}
                                  </button>
                                );
                              })}
                            </div>

                            <div className="flex items-center gap-1">
                              <span className="text-[8px] font-sans font-medium text-stone-500 uppercase">{t('category_label')}:</span>
                              <select
                                value={chartGranularity}
                                onChange={(e) => setChartGranularity(e.target.value)}
                                className="bg-[#faf4e5] border border-[#8b4513]/30 rounded px-1.5 py-0.5 text-[8.5px] font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513] cursor-pointer"
                              >
                                <option value="all">{t('all_categories')}</option>
                                <option value="Income">🟢 {t('income')}</option>
                                <option value="Expense">🔴 {t('expense')}</option>
                                <option value="Savings">🛡️ {t('savings')}</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Chart Area */}
                        <div className="space-y-3.5 overflow-y-auto pr-1 custom-scrollbar-subtle flex-grow mt-3">
                          {chartGroupedData.length > 0 ? (
                            chartGroupedData.map((c) => {
                              const incWidth = (c.income / maxChartBarVal) * 100;
                              const expWidth = (c.expense / maxChartBarVal) * 100;
                              
                              const displayIncome = chartScaleMode === 'absolute'
                                ? `+${c.income.toLocaleString()}g`
                                : `+${((c.income / totalChartVolume) * 100).toFixed(1)}%`;

                              const displayExpense = chartScaleMode === 'absolute'
                                ? `-${c.expense.toLocaleString()}g`
                                : `-${((c.expense / totalChartVolume) * 100).toFixed(1)}%`;

                              return (
                                <div key={c.name} className="space-y-1">
                                  {/* Row Info */}
                                  <div className="flex justify-between font-bold text-[#4b2c20] text-[9.5px]">
                                    <span>{c.name}</span>
                                    <span className={`font-mono font-bold text-[9px] ${c.net >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                                      {t('balance')}: {c.net >= 0 ? '+' : ''}{c.net.toLocaleString()}g
                                    </span>
                                  </div>

                                  {/* Diverging Bar Row */}
                                  <div className="relative grid grid-cols-[1fr_2px_1fr] items-center h-5 bg-[#faf4e5]/40 rounded border border-[#8b4513]/10 overflow-hidden">
                                    {/* Left (Expense) */}
                                    <div 
                                      className="flex justify-end h-full items-center pr-0.5 cursor-crosshair"
                                      onMouseEnter={(e) => handleChartMouseMove(e, c, 'expense')}
                                      onMouseMove={(e) => handleChartMouseMove(e, c, 'expense')}
                                      onMouseLeave={() => setChartTooltip(null)}
                                    >
                                      {c.expense > 0 && (
                                        <div 
                                          className="h-[14px] bg-rose-700 rounded-l transition-all duration-500 ease-out origin-right flex items-center justify-end pr-1.5 text-[7.5px] font-bold text-white font-mono select-none"
                                          style={{ width: `${expWidth}%` }}
                                        >
                                          {displayExpense}
                                        </div>
                                      )}
                                    </div>

                                    {/* Zero Center baseline */}
                                    <div className="h-full w-[2px] bg-[#8b4513]/30 z-10" />

                                    {/* Right (Income) */}
                                    <div 
                                      className="flex justify-start h-full items-center pl-0.5 cursor-crosshair"
                                      onMouseEnter={(e) => handleChartMouseMove(e, c, 'income')}
                                      onMouseMove={(e) => handleChartMouseMove(e, c, 'income')}
                                      onMouseLeave={() => setChartTooltip(null)}
                                    >
                                      {c.income > 0 && (
                                        <div 
                                          className="h-[14px] bg-emerald-700 rounded-r transition-all duration-500 ease-out origin-left flex items-center justify-start pl-1.5 text-[7.5px] font-bold text-white font-mono select-none"
                                          style={{ width: `${incWidth}%` }}
                                        >
                                          {displayIncome}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <div className="h-full flex items-center justify-center">
                              <p className="text-center text-[10px] text-[#5d4037]/60 italic font-serif">{t('no_options_registered')}</p>
                            </div>
                          )}
                        </div>

                        {/* Localized Floating Precision Tooltip Card */}
                        {chartTooltip && (
                          <div 
                            className="absolute bg-[#f4e4bc] border-2 border-[#8b4513] text-[#4b2c20] text-[9.5px] p-2.5 rounded-lg shadow-2xl pointer-events-none z-[120] font-sans w-48 space-y-1 animate-in fade-in duration-100"
                            style={{ left: `${chartTooltip.x}px`, top: `${chartTooltip.y}px` }}
                          >
                            <div 
                              className="absolute inset-0 pointer-events-none opacity-20 mix-blend-multiply rounded-md"
                              style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/paper-fibers.png')" }}
                            />
                            <div className="relative font-black text-center border-b border-[#8b4513]/20 pb-1 uppercase tracking-wider title-font text-[#4b2c20]">
                              {chartTooltip.name}
                            </div>
                            <div className="relative flex justify-between gap-2">
                              <span className="text-stone-500 font-bold uppercase text-[8px]">{t('type_label')}:</span>
                              <span className={`font-black uppercase text-[8.5px] ${chartTooltip.type === 'income' ? 'text-emerald-700' : 'text-rose-700'}`}>
                                {chartTooltip.type === 'income' ? `🟢 ${t('income')}` : `🔴 ${t('expense')}`}
                              </span>
                            </div>
                            <div className="relative flex justify-between gap-2">
                              <span className="text-stone-500 font-bold uppercase text-[8px]">{t('value')}:</span>
                              <span className="font-mono font-black">{chartTooltip.amount.toLocaleString()}g</span>
                            </div>
                            <div className="relative flex justify-between gap-2">
                              <span className="text-stone-500 font-bold uppercase text-[8px]">{t('dashboard.charts.segment_percentage')}:</span>
                              <span className="font-mono font-black">{chartTooltip.percentage.toFixed(1)}%</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Dynamic Time Evolution */}
                      <div className="bg-[#faf4e5]/60 border border-[#8b4513]/25 rounded-xl p-4 shadow-sm flex flex-col h-[340px]">
                        <h4 className="title-font text-[11px] font-black text-[#4b2c20] uppercase tracking-wider border-b border-[#8b4513]/10 pb-1.5 flex justify-between flex-shrink-0">
                          <span>{t.time_evolution}</span>
                          <span className="text-[8px] font-sans font-medium text-stone-500 normal-case">{t('active_grouping', { gran: dashGranularity === 'month' ? t('gran_month') : dashGranularity === 'quarter' ? t('gran_quarter') : t('gran_year') })}</span>
                        </h4>
                        <div className="space-y-3 overflow-y-auto pr-1 custom-scrollbar-subtle flex-grow mt-3">
                          {dashTimeData.length > 0 ? (
                            dashTimeData.map((tItem) => {
                              const incWidth = (tItem.income / maxDashTimeVal) * 100;
                              const expWidth = (tItem.expense / maxDashTimeVal) * 100;
                              const net = tItem.income - tItem.expense;
                              return (
                                <div key={tItem.label} className="space-y-1 text-xs">
                                  <div className="flex justify-between font-bold text-[#4b2c20] text-[10px]">
                                    <span>{tItem.label}</span>
                                    <span className={`font-mono ${net >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                                      {t.balance}: {net >= 0 ? '+' : ''}{net.toLocaleString()}g
                                    </span>
                                  </div>
                                  <div className="space-y-1 bg-[#faf4e5]/60 border border-[#8b4513]/10 rounded p-1.5">
                                    {tItem.income > 0 && (
                                      <div className="flex items-center gap-2">
                                        <span className="w-8 text-[8px] text-emerald-800 font-bold uppercase">{t.income}</span>
                                        <div className="flex-1 bg-[#faf4e5]/80 h-1.5 rounded-full overflow-hidden border border-[#8b4513]/5">
                                          <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${incWidth}%` }} />
                                        </div>
                                        <span className="w-10 text-right text-[8px] font-mono font-bold text-stone-600">+{tItem.income.toLocaleString()}g</span>
                                      </div>
                                    )}
                                    {tItem.expense > 0 && (
                                      <div className="flex items-center gap-2">
                                        <span className="w-8 text-[8px] text-rose-800 font-bold uppercase">{t.expense}</span>
                                        <div className="flex-1 bg-[#faf4e5]/80 h-1.5 rounded-full overflow-hidden border border-[#8b4513]/5">
                                          <div className="h-full bg-rose-600 rounded-full" style={{ width: `${expWidth}%` }} />
                                        </div>
                                        <span className="w-10 text-right text-[8px] font-mono font-bold text-stone-600">-{tItem.expense.toLocaleString()}g</span>
                                      </div>
                                    )}
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
                    </div>

                    {/* Extra Overview Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* From Allocation */}
                      <div className="bg-[#faf4e5]/60 border border-[#8b4513]/25 rounded-xl p-4 shadow-sm flex flex-col h-[240px]">
                        <h4 className="title-font text-[11px] font-black text-[#4b2c20] uppercase tracking-wider border-b border-[#8b4513]/10 pb-1.5 flex justify-between flex-shrink-0">
                          <span>{t.gold_origin}</span>
                          <span className="text-[8px] font-sans font-medium text-stone-500 normal-case">{t.paying_sources}</span>
                        </h4>
                        <div className="space-y-3 overflow-y-auto pr-1 custom-scrollbar-subtle flex-grow mt-3">
                          {fromAllocation.length > 0 ? (
                            fromAllocation.map((item) => {
                              const pctWidth = (item.amount / maxFromAmount) * 100;
                              return (
                                <div key={item.name} className="space-y-1">
                                  <div className="flex justify-between font-bold text-[#4b2c20] text-[10px]">
                                    <span>👤 {item.name}</span>
                                    <span className="font-mono text-emerald-700">+{item.amount.toLocaleString()}g</span>
                                  </div>
                                  <div className="w-full bg-[#faf4e5]/80 h-2 rounded-full overflow-hidden border border-[#8b4513]/10">
                                    <div className="h-full bg-amber-500 rounded-full" style={{ width: `${pctWidth}%` }} />
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <div className="h-full flex items-center justify-center">
                              <p className="text-center text-[10px] text-[#5d4037]/60 italic font-serif">{t.no_income_registered}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Top Entities */}
                      <div className="bg-[#faf4e5]/60 border border-[#8b4513]/25 rounded-xl p-4 shadow-sm flex flex-col h-[240px]">
                        <h4 className="title-font text-[11px] font-black text-[#4b2c20] uppercase tracking-wider border-b border-[#8b4513]/10 pb-1.5 flex justify-between flex-shrink-0">
                          <span>{t.top_entities}</span>
                          <span className="text-[8px] font-sans font-medium text-stone-500 normal-case">{t.by_gold_volume}</span>
                        </h4>
                        <div className="overflow-y-auto pr-1 custom-scrollbar-subtle flex-grow mt-3">
                          {entityVolumes.length > 0 ? (
                            <table className="w-full text-left border-collapse text-[10px] font-sans">
                              <thead>
                                <tr className="border-b border-[#8b4513]/20 text-[#4b2c20] font-black uppercase tracking-wider">
                                  <th className="py-1">{t.entidade_header}</th>
                                  <th className="py-1 text-right">{t.income}</th>
                                  <th className="py-1 text-right">{t.expense}</th>
                                  <th className="py-1 text-right">{t.total_header}</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#8b4513]/10 text-stone-700 font-bold">
                                {entityVolumes.map((ent) => (
                                  <tr key={ent.name} className="hover:bg-[#8b4513]/5">
                                    <td className="py-1.5 font-bold text-[#4b2c20]">{ent.name}</td>
                                    <td className="py-1.5 text-right text-emerald-600 font-mono">+{ent.inflow.toLocaleString()}g</td>
                                    <td className="py-1.5 text-right text-rose-600 font-mono">-{ent.outflow.toLocaleString()}g</td>
                                    <td className="py-1.5 text-right font-mono font-black text-[#b8860b]">{ent.total.toLocaleString()}g</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <div className="h-full flex items-center justify-center">
                              <p className="text-center text-[10px] text-[#5d4037]/60 italic font-serif">{t.no_commercial_record}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* SUBTAB: INCOME & EXPENSES */}
                {dashSubTab === 'income_expense' && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    {/* KPI & Savings Rate Banner */}
                    <div className="bg-[#faf4e5]/60 border border-[#8b4513]/25 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 shadow-sm">
                      <div className="flex flex-col justify-between">
                        <span className="text-[9px] font-black uppercase text-stone-500 tracking-wider font-sans font-bold">{t.savings_rate_real}</span>
                        <span className={`title-font text-2xl font-black mt-1 font-mono ${
                          dashEfficiencyRatio >= 20 ? 'text-emerald-700' : dashEfficiencyRatio >= 0 ? 'text-[#b8860b]' : 'text-rose-700'
                        }`}>
                          {dashEfficiencyRatio.toFixed(1)}%
                        </span>
                      </div>
                      <div className="sm:col-span-2 text-xs italic text-[#5d4037] flex items-center border-l border-[#8b4513]/15 pl-4">
                        {dashEfficiencyRatio >= 30 ? (
                          <span>{t.advice_efficiency_good}</span>
                        ) : dashEfficiencyRatio >= 0 ? (
                          <span>{t.advice_efficiency_ok}</span>
                        ) : (
                          <span>{t.advice_efficiency_bad}</span>
                        )}
                      </div>
                    </div>

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
                                    {t.balance}: {net >= 0 ? '+' : ''}{net.toLocaleString()}g
                                  </span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {/* Income bar */}
                                  <div className="space-y-0.5">
                                    <div className="flex justify-between text-[8px] text-emerald-800 font-bold font-mono">
                                      <span>{t.income}</span>
                                      <span>+{tItem.income.toLocaleString()}g</span>
                                    </div>
                                    <div className="w-full bg-[#faf4e5]/80 h-2 rounded-full overflow-hidden border border-[#8b4513]/10">
                                      <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${incWidth}%` }} />
                                    </div>
                                  </div>
                                  {/* Expense bar */}
                                  <div className="space-y-0.5">
                                    <div className="flex justify-between text-[8px] text-rose-800 font-bold font-mono">
                                      <span>{t.expense}</span>
                                      <span>-{tItem.expense.toLocaleString()}g</span>
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
                                  <span className="font-mono text-rose-700">-{cat.amount.toLocaleString()}g</span>
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
                )}

                {/* SUBTAB: PAYABLES & RECEIVABLES */}
                {dashSubTab === 'payables_receivables' && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    {/* KPIs Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-[#faf4e5]/60 border border-[#8b4513]/25 rounded-xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden">
                        <span className="text-[9px] font-black uppercase text-stone-500 tracking-wider font-sans font-bold">{t.receivables}</span>
                        <span className="title-font text-xl font-black text-emerald-700 mt-1 font-mono">
                          +{totalReceivables.toLocaleString()}g
                        </span>
                        <div className="absolute right-3 bottom-3 text-2xl opacity-15">📜</div>
                      </div>

                      <div className="bg-[#faf4e5]/60 border border-[#8b4513]/25 rounded-xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden">
                        <span className="text-[9px] font-black uppercase text-stone-500 tracking-wider font-sans font-bold">{t.payables}</span>
                        <span className="title-font text-xl font-black text-rose-700 mt-1 font-mono">
                          -{totalPayables.toLocaleString()}g
                        </span>
                        <div className="absolute right-3 bottom-3 text-2xl opacity-15">💸</div>
                      </div>

                      <div className="bg-[#faf4e5]/60 border border-[#8b4513]/25 rounded-xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden">
                        <span className="text-[9px] font-black uppercase text-stone-500 tracking-wider font-sans font-bold">{t.overdue_rate}</span>
                        <span className={`title-font text-xl font-black mt-1 font-mono ${
                          overdueRate > 50 ? 'text-red-700' : overdueRate > 0 ? 'text-amber-600' : 'text-emerald-700'
                        }`}>
                          {overdueRate.toFixed(1)}%
                        </span>
                        <div className="absolute right-3 bottom-3 text-2xl opacity-15">⚠️</div>
                      </div>
                    </div>

                    {/* Dual pending lists */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Receivables List */}
                      <div className="bg-[#faf4e5]/60 border border-[#8b4513]/25 rounded-xl p-4 shadow-sm flex flex-col h-[320px]">
                        <h4 className="title-font text-[11px] font-black text-emerald-800 uppercase tracking-wider border-b border-emerald-600/10 pb-1.5 flex justify-between flex-shrink-0">
                          <span>{t.pending_revenues}</span>
                          <span className="text-[8px] font-sans font-medium text-stone-500 normal-case">{pendingIncomeList.length} {pendingIncomeList.length === 1 ? 'item' : 'items'}</span>
                        </h4>
                        <div className="overflow-y-auto pr-1 custom-scrollbar-subtle flex-grow mt-3">
                          {pendingIncomeList.length > 0 ? (
                            <div className="space-y-2">
                              {pendingIncomeList.map((tx) => (
                                <div key={tx.id} className="bg-[#faf4e5]/70 border border-[#8b4513]/10 rounded-lg p-2.5 flex justify-between items-center text-xs">
                                  <div className="space-y-0.5">
                                    <div className="font-bold text-[#4b2c20]">{tx.from} &rarr; {tx.entity}</div>
                                    <div className="text-[9px] text-stone-500 font-mono">{tx.date} • {tx.category}</div>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-mono font-black text-emerald-700">+{Number(tx.amount).toLocaleString()}g</div>
                                    <span className="text-[8px] px-1 bg-amber-100 border border-amber-200 rounded text-amber-800 font-bold">{tx.status}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="h-full flex items-center justify-center">
                              <p className="text-center text-[10px] text-[#5d4037]/60 italic font-serif">{t.no_pending_revenues}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Payables List */}
                      <div className="bg-[#faf4e5]/60 border border-[#8b4513]/25 rounded-xl p-4 shadow-sm flex flex-col h-[320px]">
                        <h4 className="title-font text-[11px] font-black text-rose-800 uppercase tracking-wider border-b border-rose-600/10 pb-1.5 flex justify-between flex-shrink-0">
                          <span>{t.pending_expenses}</span>
                          <span className="text-[8px] font-sans font-medium text-stone-500 normal-case">{pendingExpenseList.length} {pendingExpenseList.length === 1 ? 'item' : 'items'}</span>
                        </h4>
                        <div className="overflow-y-auto pr-1 custom-scrollbar-subtle flex-grow mt-3">
                          {pendingExpenseList.length > 0 ? (
                            <div className="space-y-2">
                              {pendingExpenseList.map((tx) => {
                                const isOverdue = tx.status === 'Overdue';
                                return (
                                  <div key={tx.id} className={`bg-[#faf4e5]/70 border rounded-lg p-2.5 flex justify-between items-center text-xs ${
                                    isOverdue ? 'border-red-300 bg-red-50/20' : 'border-[#8b4513]/10'
                                  }`}>
                                    <div className="space-y-0.5">
                                      <div className="font-bold text-[#4b2c20]">{tx.entity}</div>
                                      <div className="text-[9px] text-stone-500 font-mono">{tx.date} • {tx.category}</div>
                                    </div>
                                    <div className="text-right">
                                      <div className="font-mono font-black text-rose-700">-{Number(tx.amount).toLocaleString()}g</div>
                                      <span className={`text-[8px] px-1 rounded font-bold ${
                                        isOverdue 
                                          ? 'bg-red-100 border border-red-200 text-red-800 animate-pulse' 
                                          : 'bg-amber-100 border border-amber-200 text-amber-800'
                                      }`}>{tx.status}</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="h-full flex items-center justify-center">
                              <p className="text-center text-[10px] text-[#5d4037]/60 italic font-serif">{t.no_pending_expenses}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}


              </div>
            </div>
          </div>
        )}

        {/* Transactions View (Financial Ledger) */}
        {activeTab === 'transactions' && (
          <div 
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setActiveTab('quests');
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
                    <button
                      type="button"
                      onClick={handleExportCSV}
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
                      onChange={handleImportCSV}
                      accept=".csv"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={handleNewTxClick}
                      className="px-3 py-1.5 bg-[#8b4513] border-2 border-[#d4af37]/30 text-[#ffd700] font-black text-[9px] uppercase tracking-wider rounded-lg shadow-sm hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>➕</span> {t.register_movement}
                    </button>
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
                          setFilterType('All');
                          setFilterDate('');
                          setFilterCategory('All');
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

                      {/* Type */}
                      <div>
                        <label className="block text-[8px] font-black uppercase text-[#5d4037]/75 mb-0.5 font-sans">{t.type_label}</label>
                        <select
                          value={filterType}
                          onChange={(e) => setFilterType(e.target.value)}
                          className="w-full bg-[#faf4e5] border border-[#8b4513]/25 rounded px-1.5 py-1 text-[10px] font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]"
                        >
                          <option value="All">{t.all_types}</option>
                          <option value="income">{t.income}</option>
                          <option value="expense">{t.expense}</option>
                        </select>
                      </div>

                      {/* Date */}
                      <div>
                        <label className="block text-[8px] font-black uppercase text-[#5d4037]/75 mb-0.5 font-sans">{t.date_label}</label>
                        <input
                          type="date"
                          value={filterDate}
                          onChange={(e) => setFilterDate(e.target.value)}
                          className="w-full bg-[#faf4e5] border border-[#8b4513]/25 rounded px-1.5 py-0.5 text-[10px] font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513] h-[26px]"
                        />
                      </div>

                      {/* Category */}
                      <div>
                        <label className="block text-[8px] font-black uppercase text-[#5d4037]/75 mb-0.5 font-sans">{t.category_label}</label>
                        <select
                          value={filterCategory}
                          onChange={(e) => setFilterCategory(e.target.value)}
                          className="w-full bg-[#faf4e5] border border-[#8b4513]/25 rounded px-1.5 py-1 text-[10px] font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]"
                        >
                          <option value="All">{t.all_categories}</option>
                          {categoryOptions.map(c => <option key={c} value={c}>{c}</option>)}
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
                            <th className="py-2.5 px-3 whitespace-nowrap">{t('ledger.headers.from')}</th>
                            <th className="py-2.5 px-3 whitespace-nowrap">{t('ledger.headers.type')}</th>
                            <th className="py-2.5 px-3 whitespace-nowrap">{t('ledger.headers.date')}</th>
                            <th className="py-2.5 px-3 whitespace-nowrap">{t('ledger.headers.month')}</th>
                            <th className="py-2.5 px-3 whitespace-nowrap">{t('ledger.headers.year')}</th>
                            <th className="py-2.5 px-3 whitespace-nowrap">{t('ledger.headers.quarter')}</th>
                            <th className="py-2.5 px-3 whitespace-nowrap">{t('ledger.headers.category')}</th>
                            <th className="py-2.5 px-3 whitespace-nowrap text-right">{t('ledger.headers.amount')}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#8b4513]/10 text-stone-700 font-bold">
                          {filteredTransactions.map((tx) => (
                            <tr key={tx.id} className="hover:bg-[#8b4513]/5 transition-colors">
                              <td className="py-2 px-3 whitespace-nowrap font-bold text-[#4b2c20]">{tx.from || '-'}</td>
                              <td className="py-2 px-3 whitespace-nowrap">
                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                                  tx.type === 'income' 
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                                    : 'bg-rose-100 text-rose-800 border border-rose-200'
                                }`}>
                                  {tx.type}
                                </span>
                              </td>
                              <td className="py-2 px-3 whitespace-nowrap font-mono">{tx.date || '-'}</td>
                              <td className="py-2 px-3 whitespace-nowrap font-serif italic text-stone-600">{tx.month || '-'}</td>
                              <td className="py-2 px-3 whitespace-nowrap font-mono">{tx.year || '-'}</td>
                              <td className="py-2 px-3 whitespace-nowrap font-mono">{tx.quarter || '-'}</td>
                              <td className="py-2 px-3 whitespace-nowrap text-stone-600">{tx.category}</td>
                              <td className={`py-2 px-3 whitespace-nowrap text-right font-mono font-black ${
                                tx.type === 'income' ? 'text-emerald-700' : 'text-rose-700'
                              }`}>
                                {tx.type === 'income' ? '+' : '-'}{Number(tx.amount).toLocaleString()}g
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {/* Mobile Cards View */}
                      <div className="grid grid-cols-1 gap-2.5 p-3 md:hidden">
                        {filteredTransactions.map((tx) => (
                          <div 
                            key={tx.id} 
                            className="bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-xl p-3 shadow-sm flex flex-col gap-2 relative overflow-hidden"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider bg-[#8b4513]/10 text-[#4b2c20]">
                                  {tx.entity || tx.category}
                                </span>
                                <div className="text-[10px] font-bold text-[#5d4037]/80 mt-1">
                                  {tx.from} • {tx.subcategory || '-'}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className={`font-mono font-black text-xs ${tx.type === 'income' ? 'text-emerald-700' : 'text-rose-700'}`}>
                                  {tx.type === 'income' ? '+' : '-'}{Number(tx.amount).toLocaleString()}g
                                </div>
                                <span className={`inline-block text-[8px] font-black px-1.5 py-0.5 rounded mt-1 ${
                                  tx.status === 'Completed' 
                                    ? 'bg-green-100 text-green-800 border border-green-200' 
                                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                                }`}>
                                  {tx.status || 'Completed'}
                                </span>
                              </div>
                            </div>
                            <div className="border-t border-[#8b4513]/10 pt-2 flex justify-between text-[8.5px] text-stone-500 font-bold">
                              <span>📅 {tx.date} ({tx.month} {tx.year})</span>
                              <span className="uppercase text-[8px] bg-[#8b4513]/10 text-[#4b2c20] px-1 rounded">{tx.entity_category || '-'}</span>
                            </div>
                          </div>
                        ))}
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
