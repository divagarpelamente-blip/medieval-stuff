/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useRef } from 'react';
import HUD from './components/HUD';
import BottomNav from './components/BottomNav';
import IsometricMap from './components/IsometricMap';
import Modal from './components/Modal';
import bgMap from './assets/Medieval_Town_Backround.png';
import { useKingdomStore } from './store/useKingdomStore';
import { Toaster, toast } from 'react-hot-toast';

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
    dashTreasurerAdvice = '"Nenhum movimento registado nos livros oficiais da coroa, meu Lorde. O reino aguarda atividade financeira."';
  } else if (dashNetBalance > 0) {
    dashTreasurerAdvice = `"Os cofres do reino estão prósperos, meu Lorde! Registamos um saldo positivo de +${dashNetBalance.toLocaleString()}g moedas de ouro. A eficiência de poupança está em ${dashEfficiencyRatio.toFixed(1)}%."`;
  } else if (dashNetBalance < 0) {
    dashTreasurerAdvice = `"Alerta, meu Lorde! A Tesouraria Real está em défice comercial de ${dashNetBalance.toLocaleString()}g moedas. As nossas despesas superam os rendimentos. Devemos conter os gastos!"`;
  } else {
    dashTreasurerAdvice = '"O balanço da Tesouraria Real está perfeitamente equilibrado, meu Lorde."';
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
        title = 'Gerir Origens (From)';
        currentList = fromOptions;
        break;
      case 'status':
        title = 'Gerir Status (Estados)';
        currentList = statusOptions;
        break;
      case 'category':
        title = 'Gerir Categorias';
        currentList = categoryOptions;
        break;
      case 'subcategory':
        title = 'Gerir Subcategorias';
        currentList = subcategoryOptions;
        break;
      case 'entity':
        title = 'Gerir Entidades (Entities)';
        currentList = entityOptions;
        showEntityCategorySelector = true;
        break;
      case 'entityCategory':
        title = 'Gerir Categoria das Entidades';
        currentList = entityCategoryOptions;
        break;
      case 'month':
        title = 'Gerir Meses';
        currentList = monthOptions;
        break;
      default:
        break;
    }

    const handleAddOptionSubmit = (e) => {
      e.preventDefault();
      if (!newOptionVal.trim()) {
        toast.error('Por favor, digite um valor!');
        return;
      }
      const val = newOptionVal.trim();
      if (currentList.includes(val)) {
        toast.error('Este valor já existe na lista!');
        return;
      }

      const extraData = selectedSettingType === 'entity' ? { entityCategory: newEntityCatVal } : undefined;
      addOption(selectedSettingType, val, extraData);
      setNewOptionVal('');
      toast.success(`Adicionado "${val}" com sucesso!`);
    };

    const handleDeleteOption = (val) => {
      deleteOption(selectedSettingType, val);
      toast.success(`Removido "${val}" com sucesso!`);
    };

    return (
      <div className="flex flex-col h-full overflow-hidden">
        {/* Title */}
        <div className="border-b border-[#8b4513]/20 pb-2 mb-4">
          <h3 className="title-font text-sm font-black text-[#4b2c20] uppercase">{title}</h3>
          <p className="text-[9px] text-[#5d4037]/75 font-bold uppercase tracking-wider font-sans">Editor do Livro Oficial</p>
        </div>

        {/* Add option form */}
        <form onSubmit={handleAddOptionSubmit} className="bg-[#faf4e5]/40 border border-[#8b4513]/15 rounded-xl p-3.5 mb-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
            <div>
              <label className="block text-[9px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">
                Novo Valor
              </label>
              <input
                type="text"
                value={newOptionVal}
                onChange={(e) => setNewOptionVal(e.target.value)}
                placeholder="Ex: Novo Item"
                required
                className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg h-[34px] px-3 text-xs font-bold text-[#4b2c20] placeholder-[#5d4037]/45 focus:outline-none focus:border-[#8b4513]/50"
              />
            </div>

            {showEntityCategorySelector && (
              <div>
                <label className="block text-[9px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">
                  Categoria Padrão
                </label>
                <select
                  value={newEntityCatVal}
                  onChange={(e) => setNewEntityCatVal(e.target.value)}
                  className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg h-[34px] px-2 text-xs font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50"
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
                className="px-4 py-2 bg-[#8b4513] text-white font-black text-[10px] uppercase tracking-wider rounded-lg hover:scale-[1.02] active:scale-98 transition-all shadow border border-[#d4af37]/20 cursor-pointer"
              >
                ➕ Adicionar
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
                  <th className="py-2 px-3">Valor</th>
                  {selectedSettingType === 'entity' && <th className="py-2 px-3">Categoria Padrão</th>}
                  <th className="py-2 px-3 text-right">Ações</th>
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
                        title="Eliminar Opção"
                      >
                        ❌ Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-center py-8 text-xs text-[#5d4037]/60 italic font-serif">
              Nenhuma opção registada nesta lista.
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
        ? 'Ledger exportado com sucesso!'
        : 'Template CSV exportado (sem dados)!'
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
          toast.success('Importação concluída: 0 transações carregadas.');
          return;
        }

        const headers = parsed[0].map(h => h.trim().toLowerCase());
        const rows = parsed.slice(1);

        if (rows.length === 0 || (rows.length === 1 && rows[0].length === 1 && rows[0][0] === '')) {
          toast.success('Importação concluída: 0 transações carregadas.');
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
          toast.success('Importação concluída: 0 transações carregadas.');
          return;
        }

        const res = await registerTransactions(GUEST_PROFILE_ID, listToInsert);
        if (res.success) {
          toast.success(`Importado com sucesso ${listToInsert.length} transações!`);
        } else {
          toast.error(`Falha na importação: ${res.error}`);
        }
      } catch (err) {
        console.error(err);
        toast.error('Erro ao processar o arquivo CSV!');
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
      toast.error('Please enter a valid amount of Gold Coins!');
      return;
    }
    if (!txFrom) {
      toast.error('Please specify the "From" (origin/payer) field!');
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
          ? `Added ${amountNum} Gold! Level and XP updated.`
          : `Spent ${amountNum} Gold!`
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
      toast.error(`Transaction failed: ${res.error}`);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center overflow-hidden">
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
        <HUD profile={profile} diamonds={gems} />

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
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
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
                title="Voltar ao Mapa"
              >
                <div className="absolute inset-0 rounded-full border-2 border-white/20 animate-pulse" />
                <span className="text-[#ffd700] text-lg font-black font-sans">✕</span>
              </button>

              {/* Header Ribbon */}
              <div className="relative h-16 flex items-center justify-center z-10 pt-2">
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[110%] h-10 bg-gradient-to-r from-[#8b4513] via-[#5d4037] to-[#8b4513] shadow-lg transform -rotate-1 skew-x-12 z-0 border-y-2 border-[#d4af37]" />
                <h2 className="title-font text-lg sm:text-xl text-[#ffd700] font-bold uppercase tracking-[0.2em] relative z-10 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                  Painel de Configuração
                </h2>
              </div>

              {/* Body */}
              <div className="p-4 sm:p-6 overflow-hidden flex-grow relative z-10 text-[#2d1b0d] flex gap-4">
                
                {/* Left Navigation Menu (Wood buttons) */}
                <div className="w-1/3 min-w-[150px] border-r border-[#8b4513]/25 pr-3 flex flex-col gap-1.5 overflow-y-auto custom-scrollbar-subtle">
                  <h4 className="text-[10px] font-black uppercase text-[#8b4513]/70 tracking-widest mb-1.5 pl-1 title-font">Listas do Reino</h4>
                  {[
                    { id: 'from', label: 'From (Origem)', icon: '👤' },
                    { id: 'status', label: 'Status (Estado)', icon: '📊' },
                    { id: 'category', label: 'Category (Categoria)', icon: '📁' },
                    { id: 'subcategory', label: 'Subcategory (Subcat)', icon: '📂' },
                    { id: 'entity', label: 'Entity (Entidade)', icon: '🏢' },
                    { id: 'entityCategory', label: 'Entity Category', icon: '🏷️' },
                    { id: 'month', label: 'Month (Mês)', icon: '📅' }
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
                        className={`text-left px-3 py-2 rounded-lg font-black text-[10px] uppercase tracking-wider transition-all border cursor-pointer ${
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
          title="Livro de Transações"
          size="max-w-6xl"
        >
          <div className="space-y-6">
            {/* Form Title & Icon */}
            <div className="flex items-center gap-4 border-b border-[#8b4513]/20 pb-4">
              <div className="w-12 h-12 bg-[#8b4513]/10 rounded-full flex items-center justify-center border-2 border-[#8b4513]/20 text-2xl">
                📜
              </div>
              <div>
                <h3 className="title-font text-lg font-black text-[#4b2c20] uppercase">Registar Movimento</h3>
                <p className="text-[10px] text-[#5d4037]/75 font-bold uppercase tracking-wider">Mina de Ouro & Comércio</p>
              </div>
            </div>

            {/* Form in columns */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Row 1 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {/* Type Selection */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">
                    Tipo
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 h-[38px]">
                    <button
                      type="button"
                      onClick={() => setTxType('income')}
                      className={`rounded-lg border font-black text-[10px] uppercase tracking-wider transition-all ${
                        txType === 'income'
                          ? 'bg-emerald-800/20 border-emerald-600 text-emerald-800 shadow-sm'
                          : 'bg-stone-100/50 border-stone-300 text-stone-600 hover:bg-stone-200/50'
                      }`}
                    >
                      🟢 Receita
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
                      🔴 Despesa
                    </button>
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">
                    Ouro (Coins)
                  </label>
                  <input
                    type="number"
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value)}
                    placeholder="Ex: 500"
                    required
                    min="1"
                    className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg h-[38px] px-3 text-xs font-bold text-[#4b2c20] placeholder-[#5d4037]/45 focus:outline-none focus:border-[#8b4513]/50"
                  />
                </div>

                {/* From */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">
                    From (Origem)
                  </label>
                  <select
                    value={txFrom}
                    onChange={(e) => setTxFrom(e.target.value)}
                    className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg h-[38px] px-2 text-xs font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50"
                  >
                    {fromOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                {/* Date */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">
                    Data
                  </label>
                  <input
                    type="date"
                    value={txDate}
                    onChange={(e) => setTxDate(e.target.value)}
                    required
                    className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg h-[38px] px-3 text-xs font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50"
                  />
                </div>
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {/* Status */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">
                    Status
                  </label>
                  <select
                    value={txStatus}
                    onChange={(e) => setTxStatus(e.target.value)}
                    className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg h-[38px] px-2 text-xs font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50"
                  >
                    {statusOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">
                    Categoria
                  </label>
                  <select
                    value={txCategory}
                    onChange={(e) => setTxCategory(e.target.value)}
                    className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg h-[38px] px-2 text-xs font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50"
                  >
                    {categoryOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                {/* Subcategory */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">
                    Subcategoria
                  </label>
                  <select
                    value={txSubcategory}
                    onChange={(e) => setTxSubcategory(e.target.value)}
                    className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg h-[38px] px-2 text-xs font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50"
                  >
                    {subcategoryOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                {/* Entity */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">
                    Entity (Entidade)
                  </label>
                  <select
                    value={txEntity}
                    onChange={(e) => handleEntityChange(e.target.value)}
                    className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg h-[38px] px-2 text-xs font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50"
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
                    Entity Category
                  </label>
                  <select
                    value={txEntityCategory}
                    onChange={(e) => setTxEntityCategory(e.target.value)}
                    className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg h-[38px] px-2 text-xs font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50"
                  >
                    {entityCategoryOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                {/* Description / Notes */}
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">
                    Descrição (Notes)
                  </label>
                  <input
                    type="text"
                    value={txDescription}
                    onChange={(e) => setTxDescription(e.target.value)}
                    placeholder="Ex: Venda de excedente de minério"
                    className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg h-[38px] px-3 text-xs font-bold text-[#4b2c20] placeholder-[#5d4037]/45 focus:outline-none focus:border-[#8b4513]/50"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-[#8b4513] text-white font-black text-xs uppercase tracking-widest rounded-xl hover:scale-[1.01] active:scale-99 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md border-2 border-[#d4af37]/30"
              >
                {isLoading ? 'Registando Movimento...' : 'Registar no Livro'}
              </button>
            </form>

            {/* Transactions History Table Section */}
            <div className="border-t border-[#8b4513]/20 pt-4 space-y-3">
              <h4 className="title-font text-sm font-black text-[#4b2c20] uppercase flex justify-between items-center">
                <span>Histórico de Transações</span>
                <span className="text-[9px] font-sans font-bold text-[#5d4037]/60 tracking-normal normal-case">
                  Livro de Contas Consolidado
                </span>
              </h4>

              {/* Responsive Table with horizontal scroll */}
              <div className="max-h-64 overflow-y-auto overflow-x-auto border border-[#8b4513]/25 rounded-xl bg-[#faf4e5]/40 custom-scrollbar">
                {transactions && transactions.length > 0 ? (
                  <table className="w-full text-left border-collapse text-[10px] font-sans">
                    <thead>
                      <tr className="bg-[#8b4513]/10 border-b border-[#8b4513]/20 text-[#4b2c20] font-black uppercase tracking-wider title-font">
                        <th className="py-2.5 px-3 whitespace-nowrap">From</th>
                        <th className="py-2.5 px-3 whitespace-nowrap">Date</th>
                        <th className="py-2.5 px-3 whitespace-nowrap">Month</th>
                        <th className="py-2.5 px-3 whitespace-nowrap">Year</th>
                        <th className="py-2.5 px-3 whitespace-nowrap">Quarter</th>
                        <th className="py-2.5 px-3 whitespace-nowrap">Type</th>
                        <th className="py-2.5 px-3 whitespace-nowrap">Status</th>
                        <th className="py-2.5 px-3 whitespace-nowrap">Category</th>
                        <th className="py-2.5 px-3 whitespace-nowrap">Subcategory</th>
                        <th className="py-2.5 px-3 whitespace-nowrap">Entity</th>
                        <th className="py-2.5 px-3 whitespace-nowrap">Entity Category</th>
                        <th className="py-2.5 px-3 whitespace-nowrap text-right">Amount</th>
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
                ) : (
                  <p className="text-center py-8 text-xs text-[#5d4037]/60 italic font-serif">
                    Nenhum registo no livro de transações.
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
          title="Nova Transação Real"
          size="max-w-4xl"
        >
          <div className="space-y-6">
            <div className="flex items-center gap-4 border-b border-[#8b4513]/20 pb-4">
              <div className="w-12 h-12 bg-[#8b4513]/10 rounded-full flex items-center justify-center border-2 border-[#8b4513]/20 text-2xl">
                ➕
              </div>
              <div>
                <h3 className="title-font text-lg font-black text-[#4b2c20] uppercase">Adicionar ao Livro</h3>
                <p className="text-[10px] text-[#5d4037]/75 font-bold uppercase tracking-wider">Novo Registro de Ouro</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Row 1 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {/* Type Selection */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">
                    Tipo
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 h-[38px]">
                    <button
                      type="button"
                      onClick={() => setTxType('income')}
                      className={`rounded-lg border font-black text-[10px] uppercase tracking-wider transition-all ${
                        txType === 'income'
                          ? 'bg-emerald-800/20 border-emerald-600 text-emerald-800 shadow-sm cursor-pointer'
                          : 'bg-stone-100/50 border-stone-300 text-stone-600 hover:bg-stone-200/50 cursor-pointer'
                      }`}
                    >
                      🟢 Receita
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
                      🔴 Despesa
                    </button>
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">
                    Ouro (Coins)
                  </label>
                  <input
                    type="number"
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value)}
                    placeholder="Ex: 500"
                    required
                    min="1"
                    className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg h-[38px] px-3 text-xs font-bold text-[#4b2c20] placeholder-[#5d4037]/45 focus:outline-none focus:border-[#8b4513]/50"
                  />
                </div>

                {/* From */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">
                    From (Origem)
                  </label>
                  <select
                    value={txFrom}
                    onChange={(e) => setTxFrom(e.target.value)}
                    className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg h-[38px] px-2 text-xs font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50"
                  >
                    {fromOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                {/* Date */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">
                    Data
                  </label>
                  <input
                    type="date"
                    value={txDate}
                    onChange={(e) => setTxDate(e.target.value)}
                    required
                    className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg h-[38px] px-3 text-xs font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50"
                  />
                </div>
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {/* Status */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">
                    Status
                  </label>
                  <select
                    value={txStatus}
                    onChange={(e) => setTxStatus(e.target.value)}
                    className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg h-[38px] px-2 text-xs font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50"
                  >
                    {statusOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">
                    Categoria
                  </label>
                  <select
                    value={txCategory}
                    onChange={(e) => setTxCategory(e.target.value)}
                    className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg h-[38px] px-2 text-xs font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50"
                  >
                    {categoryOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                {/* Subcategory */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">
                    Subcategoria
                  </label>
                  <select
                    value={txSubcategory}
                    onChange={(e) => setTxSubcategory(e.target.value)}
                    className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg h-[38px] px-2 text-xs font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50"
                  >
                    {subcategoryOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                {/* Entity */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">
                    Entity (Entidade)
                  </label>
                  <select
                    value={txEntity}
                    onChange={(e) => handleEntityChange(e.target.value)}
                    className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg h-[38px] px-2 text-xs font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50"
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
                    Entity Category
                  </label>
                  <select
                    value={txEntityCategory}
                    onChange={(e) => setTxEntityCategory(e.target.value)}
                    className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg h-[38px] px-2 text-xs font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50"
                  >
                    {entityCategoryOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                {/* Description / Notes */}
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">
                    Descrição (Notes)
                  </label>
                  <input
                    type="text"
                    value={txDescription}
                    onChange={(e) => setTxDescription(e.target.value)}
                    placeholder="Ex: Venda de excedente de minério"
                    className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg h-[38px] px-3 text-xs font-bold text-[#4b2c20] placeholder-[#5d4037]/45 focus:outline-none focus:border-[#8b4513]/50"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-[#8b4513] text-white font-black text-xs uppercase tracking-widest rounded-xl hover:scale-[1.01] active:scale-99 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md border-2 border-[#d4af37]/30 cursor-pointer"
              >
                {isLoading ? 'Registando Movimento...' : 'Registar no Livro'}
              </button>
            </form>
          </div>
        </Modal>

        {/* Dashboard View (Royal Treasury Summary) */}
        {activeTab === 'dashboard' && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
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
                title="Voltar ao Mapa"
              >
                <div className="absolute inset-0 rounded-full border-2 border-white/20 animate-pulse" />
                <span className="text-[#ffd700] text-lg font-black font-sans">✕</span>
              </button>

              {/* Row 1: Header Ribbon (Centralized) */}
              <div className="relative h-16 flex items-center justify-center z-10 pt-2">
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[110%] h-10 bg-gradient-to-r from-[#8b4513] via-[#5d4037] to-[#8b4513] shadow-lg transform -rotate-1 skew-x-12 z-0 border-y-2 border-[#d4af37]" />
                <h2 className="title-font text-lg sm:text-xl text-[#ffd700] font-bold uppercase tracking-[0.2em] relative z-10 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                  Your Realm Treasury
                </h2>
              </div>

              {/* Row 2: Navigation (Left) & Time Filters (Right) */}
              <div className="px-4 py-2.5 border-b border-[#8b4513]/25 flex flex-col md:flex-row justify-between items-center gap-3 bg-[#faf4e5]/40 z-10">
                {/* Left Buttons: Analysis Sub-tabs */}
                <div className="flex flex-wrap gap-1.5 items-center justify-center">
                  {[
                    { id: 'overview', label: 'Overview', icon: '📊' },
                    { id: 'income_expense', label: 'Income & Expenses', icon: '💸' },
                    { id: 'payables_receivables', label: 'Payables & Receivables', icon: '📜' }
                  ].map((tab) => {
                    const isSel = dashSubTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setDashSubTab(tab.id)}
                        className={`px-3 py-1.5 rounded-lg border font-black text-[9px] uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95 ${
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
                    { id: 'month', label: 'Monthly view', icon: '📅' },
                    { id: 'quarter', label: 'Quarterly view', icon: '⏳' },
                    { id: 'year', label: 'Year view', icon: '👑' }
                  ].map((gran) => {
                    const isSel = dashGranularity === gran.id;
                    return (
                      <button
                        key={gran.id}
                        type="button"
                        onClick={() => setDashGranularity(gran.id)}
                        className={`px-3 py-1.5 rounded-lg border font-black text-[9px] uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95 ${
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
                        <span className="text-[9px] font-black uppercase text-stone-500 tracking-wider font-sans font-bold">Total de Receitas (Inflow)</span>
                        <span className="title-font text-xl font-black text-emerald-700 mt-1 font-mono">
                          +{dashInflow.toLocaleString()}g
                        </span>
                        <div className="absolute right-3 bottom-3 text-2xl opacity-15">📈</div>
                      </div>

                      <div className="bg-[#faf4e5]/60 border border-[#8b4513]/25 rounded-xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden">
                        <span className="text-[9px] font-black uppercase text-stone-500 tracking-wider font-sans font-bold">Total de Despesas (Outflow)</span>
                        <span className="title-font text-xl font-black text-rose-700 mt-1 font-mono">
                          -{dashOutflow.toLocaleString()}g
                        </span>
                        <div className="absolute right-3 bottom-3 text-2xl opacity-15">📉</div>
                      </div>

                      <div className="bg-[#faf4e5]/60 border border-[#8b4513]/25 rounded-xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden">
                        <span className="text-[9px] font-black uppercase text-stone-500 tracking-wider font-sans font-bold">Saldo Líquido</span>
                        <span className={`title-font text-xl font-black mt-1 font-mono ${
                          dashNetBalance >= 0 ? 'text-[#b8860b]' : 'text-rose-700'
                        }`}>
                          {dashNetBalance >= 0 ? '+' : ''}{dashNetBalance.toLocaleString()}g
                        </span>
                        <div className="absolute right-3 bottom-3 text-2xl opacity-15">💰</div>
                      </div>

                      <div className="bg-[#faf4e5]/60 border border-[#8b4513]/25 rounded-xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden">
                        <span className="text-[9px] font-black uppercase text-stone-500 tracking-wider font-sans font-bold">Eficiência de Poupança</span>
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
                          <h5 className="text-[9px] font-black uppercase text-[#8b4513]/85 tracking-widest font-sans">Conselho do Tesoureiro Real</h5>
                          <p className="text-xs italic text-[#4b2c20] font-serif leading-relaxed">
                            {dashTreasurerAdvice}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 2. Charts Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Category Breakdown */}
                      <div className="bg-[#faf4e5]/60 border border-[#8b4513]/25 rounded-xl p-4 shadow-sm flex flex-col h-[240px]">
                        <h4 className="title-font text-[11px] font-black text-[#4b2c20] uppercase tracking-wider border-b border-[#8b4513]/10 pb-1.5 flex justify-between flex-shrink-0">
                          <span>Fluxo por Categoria</span>
                          <span className="text-[8px] font-sans font-medium text-stone-500 normal-case">Consolidado Geral</span>
                        </h4>
                        <div className="space-y-3 overflow-y-auto pr-1 custom-scrollbar-subtle flex-grow mt-3">
                          {dashCategoryData.length > 0 ? (
                            dashCategoryData.map((c) => {
                              const incWidth = (c.income / maxDashCategoryVal) * 100;
                              const expWidth = (c.expense / maxDashCategoryVal) * 100;
                              return (
                                <div key={c.category} className="space-y-1 text-xs">
                                  <div className="flex justify-between font-bold text-[#4b2c20] text-[10px]">
                                    <span>{c.category}</span>
                                    <span className="font-mono text-stone-600">Volume: {c.total.toLocaleString()}g</span>
                                  </div>
                                  {c.income > 0 && (
                                    <div className="space-y-0.5">
                                      <div className="flex justify-between text-[8px] text-emerald-800 font-bold font-mono">
                                        <span>Receita</span>
                                        <span>+{c.income.toLocaleString()}g</span>
                                      </div>
                                      <div className="w-full bg-[#faf4e5]/80 h-2 rounded-full overflow-hidden border border-[#8b4513]/10">
                                        <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${incWidth}%` }} />
                                      </div>
                                    </div>
                                  )}
                                  {c.expense > 0 && (
                                    <div className="space-y-0.5">
                                      <div className="flex justify-between text-[8px] text-rose-800 font-bold font-mono">
                                        <span>Despesa</span>
                                        <span>-{c.expense.toLocaleString()}g</span>
                                      </div>
                                      <div className="w-full bg-[#faf4e5]/80 h-2 rounded-full overflow-hidden border border-[#8b4513]/10">
                                        <div className="h-full bg-rose-600 rounded-full" style={{ width: `${expWidth}%` }} />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          ) : (
                            <div className="h-full flex items-center justify-center">
                              <p className="text-center text-[10px] text-[#5d4037]/60 italic font-serif">Nenhuma atividade financeira.</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Dynamic Time Evolution */}
                      <div className="bg-[#faf4e5]/60 border border-[#8b4513]/25 rounded-xl p-4 shadow-sm flex flex-col h-[240px]">
                        <h4 className="title-font text-[11px] font-black text-[#4b2c20] uppercase tracking-wider border-b border-[#8b4513]/10 pb-1.5 flex justify-between flex-shrink-0">
                          <span>Evolução Temporal</span>
                          <span className="text-[8px] font-sans font-medium text-stone-500 normal-case">Agrupamento Ativo ({dashGranularity})</span>
                        </h4>
                        <div className="space-y-3 overflow-y-auto pr-1 custom-scrollbar-subtle flex-grow mt-3">
                          {dashTimeData.length > 0 ? (
                            dashTimeData.map((t) => {
                              const incWidth = (t.income / maxDashTimeVal) * 100;
                              const expWidth = (t.expense / maxDashTimeVal) * 100;
                              const net = t.income - t.expense;
                              return (
                                <div key={t.label} className="space-y-1 text-xs">
                                  <div className="flex justify-between font-bold text-[#4b2c20] text-[10px]">
                                    <span>{t.label}</span>
                                    <span className={`font-mono ${net >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                                      Balanço: {net >= 0 ? '+' : ''}{net.toLocaleString()}g
                                    </span>
                                  </div>
                                  <div className="space-y-1 bg-[#faf4e5]/60 border border-[#8b4513]/10 rounded p-1.5">
                                    {t.income > 0 && (
                                      <div className="flex items-center gap-2">
                                        <span className="w-8 text-[8px] text-emerald-800 font-bold uppercase">Receita</span>
                                        <div className="flex-1 bg-[#faf4e5]/80 h-1.5 rounded-full overflow-hidden border border-[#8b4513]/5">
                                          <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${incWidth}%` }} />
                                        </div>
                                        <span className="w-10 text-right text-[8px] font-mono font-bold text-stone-600">+{t.income.toLocaleString()}g</span>
                                      </div>
                                    )}
                                    {t.expense > 0 && (
                                      <div className="flex items-center gap-2">
                                        <span className="w-8 text-[8px] text-rose-800 font-bold uppercase">Despesa</span>
                                        <div className="flex-1 bg-[#faf4e5]/80 h-1.5 rounded-full overflow-hidden border border-[#8b4513]/5">
                                          <div className="h-full bg-rose-600 rounded-full" style={{ width: `${expWidth}%` }} />
                                        </div>
                                        <span className="w-10 text-right text-[8px] font-mono font-bold text-stone-600">-{t.expense.toLocaleString()}g</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <div className="h-full flex items-center justify-center">
                              <p className="text-center text-[10px] text-[#5d4037]/60 italic font-serif">Nenhuma atividade registada neste período.</p>
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
                          <span>Origem do Ouro (From Allocation)</span>
                          <span className="text-[8px] font-sans font-medium text-stone-500 normal-case">Fontes Pagadoras</span>
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
                              <p className="text-center text-[10px] text-[#5d4037]/60 italic font-serif">Nenhum rendimento registado.</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Top Entities */}
                      <div className="bg-[#faf4e5]/60 border border-[#8b4513]/25 rounded-xl p-4 shadow-sm flex flex-col h-[240px]">
                        <h4 className="title-font text-[11px] font-black text-[#4b2c20] uppercase tracking-wider border-b border-[#8b4513]/10 pb-1.5 flex justify-between flex-shrink-0">
                          <span>Maiores Comércios (Top Entities)</span>
                          <span className="text-[8px] font-sans font-medium text-stone-500 normal-case">Por Volume de Ouro</span>
                        </h4>
                        <div className="overflow-y-auto pr-1 custom-scrollbar-subtle flex-grow mt-3">
                          {entityVolumes.length > 0 ? (
                            <table className="w-full text-left border-collapse text-[10px] font-sans">
                              <thead>
                                <tr className="border-b border-[#8b4513]/20 text-[#4b2c20] font-black uppercase tracking-wider">
                                  <th className="py-1">Entidade</th>
                                  <th className="py-1 text-right">Inflow</th>
                                  <th className="py-1 text-right">Outflow</th>
                                  <th className="py-1 text-right">Total</th>
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
                              <p className="text-center text-[10px] text-[#5d4037]/60 italic font-serif">Sem registo comercial.</p>
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
                        <span className="text-[9px] font-black uppercase text-stone-500 tracking-wider font-sans font-bold">Taxa de Poupança Real</span>
                        <span className={`title-font text-2xl font-black mt-1 font-mono ${
                          dashEfficiencyRatio >= 20 ? 'text-emerald-700' : dashEfficiencyRatio >= 0 ? 'text-[#b8860b]' : 'text-rose-700'
                        }`}>
                          {dashEfficiencyRatio.toFixed(1)}%
                        </span>
                      </div>
                      <div className="sm:col-span-2 text-xs italic text-[#5d4037] flex items-center border-l border-[#8b4513]/15 pl-4">
                        {dashEfficiencyRatio >= 30 ? (
                          <span>"A vossa gestão é digna de lenda, meu Lorde! Guardais uma grande fatia do vosso ouro para futuras conquistas."</span>
                        ) : dashEfficiencyRatio >= 0 ? (
                          <span>"Mantendes as contas sob controlo, mas podíamos poupar mais ouro se reduzíssemos as despesas menores."</span>
                        ) : (
                          <span>"Perigo! O reino está a esgotar as suas reservas. Precisamos cortar despesas imediatamente!"</span>
                        )}
                      </div>
                    </div>

                    {/* Side-by-side evolution */}
                    <div className="bg-[#faf4e5]/60 border border-[#8b4513]/25 rounded-xl p-4 shadow-sm flex flex-col h-[280px]">
                      <h4 className="title-font text-[11px] font-black text-[#4b2c20] uppercase tracking-wider border-b border-[#8b4513]/10 pb-1.5 flex justify-between flex-shrink-0">
                        <span>Comparação de Fluxos ({dashGranularity})</span>
                        <span className="text-[8px] font-sans font-medium text-stone-500 normal-case">Receita vs Despesa</span>
                      </h4>
                      <div className="space-y-4 overflow-y-auto pr-1 custom-scrollbar-subtle flex-grow mt-3">
                        {dashTimeData.length > 0 ? (
                          dashTimeData.map((t) => {
                            const incWidth = (t.income / maxDashTimeVal) * 100;
                            const expWidth = (t.expense / maxDashTimeVal) * 100;
                            const net = t.income - t.expense;
                            return (
                              <div key={t.label} className="space-y-2 border-b border-[#8b4513]/5 pb-2">
                                <div className="flex justify-between font-bold text-[#4b2c20] text-[10px]">
                                  <span>{t.label}</span>
                                  <span className={`font-mono ${net >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                                    Balanço: {net >= 0 ? '+' : ''}{net.toLocaleString()}g
                                  </span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {/* Income bar */}
                                  <div className="space-y-0.5">
                                    <div className="flex justify-between text-[8px] text-emerald-800 font-bold font-mono">
                                      <span>Receita</span>
                                      <span>+{t.income.toLocaleString()}g</span>
                                    </div>
                                    <div className="w-full bg-[#faf4e5]/80 h-2 rounded-full overflow-hidden border border-[#8b4513]/10">
                                      <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${incWidth}%` }} />
                                    </div>
                                  </div>
                                  {/* Expense bar */}
                                  <div className="space-y-0.5">
                                    <div className="flex justify-between text-[8px] text-rose-800 font-bold font-mono">
                                      <span>Despesa</span>
                                      <span>-{t.expense.toLocaleString()}g</span>
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
                            <p className="text-center text-[10px] text-[#5d4037]/60 italic font-serif">Sem registos comerciais no período activo.</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Cost breakdown by Entity Category */}
                    <div className="bg-[#faf4e5]/60 border border-[#8b4513]/25 rounded-xl p-4 shadow-sm flex flex-col h-[280px]">
                      <h4 className="title-font text-[11px] font-black text-[#4b2c20] uppercase tracking-wider border-b border-[#8b4513]/10 pb-1.5 flex justify-between flex-shrink-0">
                        <span>Despesas por Categoria de Entidade</span>
                        <span className="text-[8px] font-sans font-medium text-stone-500 normal-case">Distribuição do Gasto</span>
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
                            <p className="text-center text-[10px] text-[#5d4037]/60 italic font-serif">Nenhuma despesa registada.</p>
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
                        <span className="text-[9px] font-black uppercase text-stone-500 tracking-wider font-sans font-bold">Moedas a Receber (Receivables)</span>
                        <span className="title-font text-xl font-black text-emerald-700 mt-1 font-mono">
                          +{totalReceivables.toLocaleString()}g
                        </span>
                        <div className="absolute right-3 bottom-3 text-2xl opacity-15">📜</div>
                      </div>

                      <div className="bg-[#faf4e5]/60 border border-[#8b4513]/25 rounded-xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden">
                        <span className="text-[9px] font-black uppercase text-stone-500 tracking-wider font-sans font-bold">Moedas a Pagar (Payables)</span>
                        <span className="title-font text-xl font-black text-rose-700 mt-1 font-mono">
                          -{totalPayables.toLocaleString()}g
                        </span>
                        <div className="absolute right-3 bottom-3 text-2xl opacity-15">💸</div>
                      </div>

                      <div className="bg-[#faf4e5]/60 border border-[#8b4513]/25 rounded-xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden">
                        <span className="text-[9px] font-black uppercase text-stone-500 tracking-wider font-sans font-bold">Taxa de Atraso (Overdue Rate)</span>
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
                          <span>Receitas Pendentes</span>
                          <span className="text-[8px] font-sans font-medium text-stone-500 normal-case">{pendingIncomeList.length} items</span>
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
                              <p className="text-center text-[10px] text-[#5d4037]/60 italic font-serif">Nenhuma receita pendente. Todos os pagamentos foram cobrados!</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Payables List */}
                      <div className="bg-[#faf4e5]/60 border border-[#8b4513]/25 rounded-xl p-4 shadow-sm flex flex-col h-[320px]">
                        <h4 className="title-font text-[11px] font-black text-rose-800 uppercase tracking-wider border-b border-rose-600/10 pb-1.5 flex justify-between flex-shrink-0">
                          <span>Despesas Pendentes / Atrasadas</span>
                          <span className="text-[8px] font-sans font-medium text-stone-500 normal-case">{pendingExpenseList.length} items</span>
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
                              <p className="text-center text-[10px] text-[#5d4037]/60 italic font-serif">Nenhuma despesa pendente. O reino está livre de dívidas correntes!</p>
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
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
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
                title="Voltar ao Mapa"
              >
                <div className="absolute inset-0 rounded-full border-2 border-white/20 animate-pulse" />
                <span className="text-[#ffd700] text-lg font-black font-sans">✕</span>
              </button>

              {/* Header Ribbon */}
              <div className="relative h-16 flex items-center justify-center z-10 pt-2">
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[110%] h-10 bg-gradient-to-r from-[#8b4513] via-[#5d4037] to-[#8b4513] shadow-lg transform -rotate-1 skew-x-12 z-0 border-y-2 border-[#d4af37]" />
                <h2 className="title-font text-lg sm:text-xl text-[#ffd700] font-bold uppercase tracking-[0.2em] relative z-10 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                  Financial Ledger
                </h2>
              </div>

              {/* Scrollable Parchment Body */}
              <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar flex-grow relative z-10 text-[#2d1b0d] space-y-4">
                
                {/* Title and Action Buttons */}
                <div className="flex justify-between items-center">
                  <h4 className="title-font text-sm font-black text-[#4b2c20] uppercase">
                    Livro Geral de Contas
                  </h4>
                  <div className="flex gap-2 flex-wrap items-center">
                    <button
                      type="button"
                      onClick={handleExportCSV}
                      className="px-3 py-1.5 bg-[#faf4e5]/90 border-2 border-[#8b4513]/30 text-[#4b2c20] font-black text-[9px] uppercase tracking-wider rounded-lg shadow-sm hover:bg-[#8b4513]/10 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                      title="Exportar todas as transações para CSV"
                    >
                      <span>📤</span> Exportar CSV
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current.click()}
                      className="px-3 py-1.5 bg-[#faf4e5]/90 border-2 border-[#8b4513]/30 text-[#4b2c20] font-black text-[9px] uppercase tracking-wider rounded-lg shadow-sm hover:bg-[#8b4513]/10 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                      title="Importar transações a partir de um arquivo CSV"
                    >
                      <span>📥</span> Importar CSV
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
                      <span>➕</span> Nova Transação
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
                      className="px-3 py-1.5 bg-[#faf4e5]/90 border-2 border-[#8b4513]/30 text-[#4b2c20] font-black text-[9px] uppercase tracking-wider rounded-lg shadow-sm hover:bg-[#8b4513]/10 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>🔍</span> {isFiltersExpanded ? 'Ocultar Filtros' : 'Mostrar Filtros'}
                    </button>
                  </div>
                </div>

                {/* Collapsible Filter Panel */}
                {isFiltersExpanded && (
                  <div className="bg-[#faf4e5]/50 border border-[#8b4513]/20 rounded-xl p-4 animate-in slide-in-from-top-2 duration-200">
                    <div className="flex justify-between items-center border-b border-[#8b4513]/15 pb-2 mb-3">
                      <span className="text-[9px] font-black uppercase text-[#5d4037]/80 tracking-wider">Filtros Ativos</span>
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
                          toast.success('Filtros limpos!');
                        }}
                        className="text-[9px] font-black text-rose-800 hover:text-rose-955 uppercase transition-colors cursor-pointer"
                      >
                        Limpar Todos
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
                      {/* Year */}
                      <div>
                        <label className="block text-[8px] font-black uppercase text-[#5d4037]/75 mb-0.5 font-sans">Ano (Year)</label>
                        <select
                          value={filterYear}
                          onChange={(e) => setFilterYear(e.target.value)}
                          className="w-full bg-[#faf4e5] border border-[#8b4513]/25 rounded px-1.5 py-1 text-[10px] font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]"
                        >
                          <option value="All">All Years</option>
                          {uniqueYears.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                      </div>

                      {/* Month */}
                      <div>
                        <label className="block text-[8px] font-black uppercase text-[#5d4037]/75 mb-0.5 font-sans">Mês (Month)</label>
                        <select
                          value={filterMonth}
                          onChange={(e) => setFilterMonth(e.target.value)}
                          className="w-full bg-[#faf4e5] border border-[#8b4513]/25 rounded px-1.5 py-1 text-[10px] font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]"
                        >
                          <option value="All">All Months</option>
                          {monthOptions.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                      </div>

                      {/* Quarter */}
                      <div>
                        <label className="block text-[8px] font-black uppercase text-[#5d4037]/75 mb-0.5 font-sans">Trimestre (Quarter)</label>
                        <select
                          value={filterQuarter}
                          onChange={(e) => setFilterQuarter(e.target.value)}
                          className="w-full bg-[#faf4e5] border border-[#8b4513]/25 rounded px-1.5 py-1 text-[10px] font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]"
                        >
                          <option value="All">All Quarters</option>
                          <option value="Q1">Q1</option>
                          <option value="Q2">Q2</option>
                          <option value="Q3">Q3</option>
                          <option value="Q4">Q4</option>
                        </select>
                      </div>

                      {/* From */}
                      <div>
                        <label className="block text-[8px] font-black uppercase text-[#5d4037]/75 mb-0.5 font-sans">From</label>
                        <select
                          value={filterFrom}
                          onChange={(e) => setFilterFrom(e.target.value)}
                          className="w-full bg-[#faf4e5] border border-[#8b4513]/25 rounded px-1.5 py-1 text-[10px] font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]"
                        >
                          <option value="All">All From</option>
                          {fromOptions.map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                      </div>

                      {/* Type */}
                      <div>
                        <label className="block text-[8px] font-black uppercase text-[#5d4037]/75 mb-0.5 font-sans">Tipo (Type)</label>
                        <select
                          value={filterType}
                          onChange={(e) => setFilterType(e.target.value)}
                          className="w-full bg-[#faf4e5] border border-[#8b4513]/25 rounded px-1.5 py-1 text-[10px] font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]"
                        >
                          <option value="All">All Types</option>
                          <option value="income">income (Receita)</option>
                          <option value="expense">expense (Despesa)</option>
                        </select>
                      </div>

                      {/* Date */}
                      <div>
                        <label className="block text-[8px] font-black uppercase text-[#5d4037]/75 mb-0.5 font-sans">Data (Date)</label>
                        <input
                          type="date"
                          value={filterDate}
                          onChange={(e) => setFilterDate(e.target.value)}
                          className="w-full bg-[#faf4e5] border border-[#8b4513]/25 rounded px-1.5 py-0.5 text-[10px] font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513] h-[26px]"
                        />
                      </div>

                      {/* Category */}
                      <div>
                        <label className="block text-[8px] font-black uppercase text-[#5d4037]/75 mb-0.5 font-sans">Categoria (Cat)</label>
                        <select
                          value={filterCategory}
                          onChange={(e) => setFilterCategory(e.target.value)}
                          className="w-full bg-[#faf4e5] border border-[#8b4513]/25 rounded px-1.5 py-1 text-[10px] font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]"
                        >
                          <option value="All">All Categories</option>
                          {categoryOptions.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Ledger Data Table */}
                <div className="max-h-[380px] overflow-y-auto overflow-x-auto border border-[#8b4513]/25 rounded-xl bg-[#faf4e5]/40 custom-scrollbar shadow-inner">
                  {filteredTransactions.length > 0 ? (
                    <table className="w-full text-left border-collapse text-[10px] font-sans">
                      <thead>
                        <tr className="bg-[#8b4513] border-b border-[#8b4513]/20 text-[#ffd700] font-black uppercase tracking-wider title-font sticky top-0 z-20">
                          <th className="py-2.5 px-3 whitespace-nowrap">From</th>
                          <th className="py-2.5 px-3 whitespace-nowrap">Type</th>
                          <th className="py-2.5 px-3 whitespace-nowrap">Date</th>
                          <th className="py-2.5 px-3 whitespace-nowrap">Month</th>
                          <th className="py-2.5 px-3 whitespace-nowrap">Year</th>
                          <th className="py-2.5 px-3 whitespace-nowrap">Quarter</th>
                          <th className="py-2.5 px-3 whitespace-nowrap">Category</th>
                          <th className="py-2.5 px-3 whitespace-nowrap text-right">Amount</th>
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
                  ) : (
                    <p className="text-center py-12 text-xs text-[#5d4037]/60 italic font-serif">
                      Nenhum registo de transação encontrado para os filtros ativos.
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
