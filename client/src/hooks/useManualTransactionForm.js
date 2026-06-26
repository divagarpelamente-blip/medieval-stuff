/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabaseClient';
import { useKingdomStore } from '../store/useKingdomStore';
import { useTranslation } from 'react-i18next';

const GUEST_PROFILE_ID = '00000000-0000-0000-0000-000000000000';

export function useManualTransactionForm(setIsNewTxModalOpen) {
  const { t: originalT } = useTranslation();
  const t = new Proxy(originalT, {
    get(target, prop) {
      if (prop in target) return target[prop];
      if (typeof prop === 'string') return target(prop);
      return undefined;
    }
  });

  // Bind Zustand states & actions
  const user = useKingdomStore((state) => state.user);
  const email = useKingdomStore((state) => state.email);
  const fromOptions = useKingdomStore((state) => state.fromOptions);
  const statusOptions = useKingdomStore((state) => state.statusOptions);
  const classOptions = useKingdomStore((state) => state.classOptions);
  const subClassOptions = useKingdomStore((state) => state.subClassOptions);
  const entityOptions = useKingdomStore((state) => state.entityOptions);
  const categoryOptions = useKingdomStore((state) => state.categoryOptions);
  const entityMappings = useKingdomStore((state) => state.entityMappings);
  
  const registerTransaction = useKingdomStore((state) => state.registerTransaction);
  const fetchKingdomData = useKingdomStore((state) => state.fetchKingdomData);
  const fetchDashboardData = useKingdomStore((state) => state.fetchDashboardData);

  // Form States
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

  // Cascading Configuration (exactly as defined in App.jsx)
  const cascadingConfig = {
    'House & Utilities': {
      'Oeiras': { transaction_type: 'Expense', transaction_subtype: 'Living & Household', transaction_category: 'Household', target_account: '60101001', flow: 'outflow', payment_status: 'Pending' },
      'DIGAL': { transaction_type: 'Expense', transaction_subtype: 'Living & Household', transaction_category: 'Utilities', target_account: '60102001', flow: 'outflow', payment_status: 'Pending' },
      'SIMAS': { transaction_type: 'Expense', transaction_subtype: 'Living & Household', transaction_category: 'Utilities', target_account: '60102002', flow: 'outflow', payment_status: 'Pending' },
      'NOS': { transaction_type: 'Expense', transaction_subtype: 'Living & Household', transaction_category: 'Utilities', target_account: '60102003', flow: 'outflow', payment_status: 'Pending' },
      'Other Utilities': { transaction_type: 'Expense', transaction_subtype: 'Living & Household', transaction_category: 'Utilities', target_account: '60102004', flow: 'outflow', payment_status: 'Pending' },
      'Oeiras Utensils': { transaction_type: 'Expense', transaction_subtype: 'Living & Household', transaction_category: 'Household', target_account: '60101002', flow: 'outflow', payment_status: 'Completed' }
    },
    'Transports': {
      'Car': { transaction_type: 'Expense', transaction_subtype: 'Personal Transports', transaction_category: 'Gasoline', target_account: '60201002', flow: 'outflow', payment_status: 'Completed' },
      'Via Verde': { transaction_type: 'Expense', transaction_subtype: 'Personal Transports', transaction_category: 'Tolls', target_account: '60202001', flow: 'outflow', payment_status: 'Completed' },
      'Parking': { transaction_type: 'Expense', transaction_subtype: 'Personal Transports', transaction_category: 'Parking', target_account: '60203001', flow: 'outflow', payment_status: 'Completed' }
    },
    'Banking & Liabilities': {
      'Universo': { transaction_type: 'Liabilities', transaction_subtype: 'Personal Debt', transaction_category: 'Credit Cards', target_account: '20103002', flow: 'outflow', payment_status: 'Completed' },
      'CGD': { transaction_type: 'Liabilities', transaction_subtype: 'Personal Debt', transaction_category: 'Loans & Burrow', target_account: '20101001', flow: 'outflow', payment_status: 'Completed' },
      'Active Bank': { transaction_type: 'Assets', transaction_subtype: 'Banks', transaction_category: 'Savings account', target_account: '10102002', flow: 'neutral', payment_status: 'Completed' }
    },
    'Personal & Lifestyle': {
      'Restaurant dinner': { transaction_type: 'Expense', transaction_subtype: 'Entertainment', transaction_category: 'Entertainment', target_account: '60701001', flow: 'outflow', payment_status: 'Completed' },
      'Cinema': { transaction_type: 'Expense', transaction_subtype: 'Entertainment', transaction_category: 'Entertainment', target_account: '60701002', flow: 'outflow', payment_status: 'Completed' },
      'Personal Hygiene': { transaction_type: 'Expense', transaction_subtype: 'Markets & Consumables', transaction_category: 'Markets & Groceries', target_account: '60501007', flow: 'outflow', payment_status: 'Completed' },
      'Clothing': { transaction_type: 'Expense', transaction_subtype: 'Markets & Consumables', transaction_category: 'Markets and Clothing', target_account: '60503001', flow: 'outflow', payment_status: 'Completed' }
    },
    'Income & Revenue': {
      'Base Salary': { transaction_type: 'Income', transaction_subtype: 'Payroll', transaction_category: 'Salary', target_account: '70101001', flow: 'inflow', payment_status: 'Pending' },
      'Bonus (Scorecard)': { transaction_type: 'Income', transaction_subtype: 'Payroll', transaction_category: 'Salary', target_account: '70101004', flow: 'inflow', payment_status: 'Completed' }
    }
  };

  const [mainMenu, setMainMenu] = useState('House & Utilities');
  const [subMenuAction, setSubMenuAction] = useState('Oeiras');

  const entityToTargetAccount = {
    // Assets (1xxxxxxx)
    "CGD": "10101001",
    "Universo": "10101002",
    "Active Bank": "10101003",
    "Inter Bank": "10101004",
    "Wizink": "10103004",

    // Liabilities (2xxxxxxx)
    "Other Loans": "20101007",
    "Jota": "20102001",
    "Mae": "20102002",
    "Reni": "20102003",
    "Pedro": "20102004",
    "Other Burrow": "20102005",
    "Social Security": "20201001",
    "Finances": "20201002",
    "NOS": "20201003",

    // Expenses (6xxxxxxx)
    "Oeiras": "60101001",
    "Oeiras Utensils": "60101002",
    "Oeiras Decoration": "60101003",
    "Other Household": "60101004",
    "Portela": "60101005",
    "DIGAL": "60102001",
    "SIMAS": "60102002",
    "Other Utilities": "60102004",
    "Motorcycle": "60201001",
    "Car": "60201002",
    "Via Verde": "60202001",
    "Parking": "60203001",
    "Public Transport (Metro/Train/Bus)": "60301001",
    "Uber / Chauffeur": "60401001",
    "Taxis": "60401002",
    "Food": "60501001",
    "Pet Food": "60501002",
    "Food (work lunch)": "60501003",
    "Soda Drinks": "60501004",
    "Alcoholic Drinks": "60501005",
    "Cleaning Products": "60501006",
    "Personal Hygiene": "60501007",
    "Cosmetics": "60501008",
    "Tools": "60502001",
    "Clothing": "60503001",
    "Shoes": "60503002",
    "Other Market consumables": "60504001",
    "Public Hospital": "60601001",
    "Private Hospital": "60601002",
    "Medical Sessions & Exams": "60601003",
    "Active Psicologia Coimbra": "60601004",
    "Psicologist 2": "60601005",
    "Marco (Jota Mateus)": "60601006",
    "Marco Consultas (private)": "60601007",
    "Dentist Beatriz": "60601008",
    "Dentist 2": "60601009",
    "Farmacia Oeiras": "60601010",
    "Farmacia Portela": "60601011",
    "Restaurant dinner": "60701001",
    "Cinema": "60701002",
    "Streaming": "60701003",
    "Nightlife & Disco": "60701004",
    "Gaming": "60701005",
    "PhD": "60801001",
    "Trainings": "60801002",
    "Health Insurance": "60901001",
    "Life insurance": "60901004",
    "Mobility (IUC)": "61001001",
    "IRS": "61001005",
    "Interest": "61101001",
    "Fines": "61102001",
    "Cofidis": "61103003",

    // Income (7xxxxxxx)
    "Base Salary": "70101001",
    "Consulting / Contract Services": "70101002",
    "Teaching Classes": "70101003",
    "Bonus (Scorecard)": "70101004",
    "Vacation Subsidy": "70102001",
    "Christmas Subsidy": "70102002",
    "Family Gifts": "70201001",
    "Cashbacks & Rewards": "70201002",
    "Mobility": "70401002",
    "Justice": "70401005"
  };

  // Sync selectors defaults when store changes
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

  // Set default Pedro if email is divagarpelamente@gmail.com
  useEffect(() => {
    if (email === 'divagarpelamente@gmail.com') {
      setTxFrom('Pedro');
    }
  }, [email]);

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

  const handleEntityChange = (entityVal) => {
    setTxEntity(entityVal);
    const mapped = entityMappings[entityVal];
    if (mapped) {
      setTxCategory(mapped);
    }
    
    // Resolve dynamic target account conflicts based on selected transaction metadata
    let defaultTarget = entityToTargetAccount[entityVal];
    
    if (entityVal === 'CGD') {
      if (txClass === 'Assets') {
        if (txCategory === 'Savings account') defaultTarget = '10102001';
        else if (txCategory === 'Investments account') defaultTarget = '10103001';
        else defaultTarget = '10101001';
      } else if (txClass === 'Liabilities') {
        if (txCategory === 'Credit Cards') defaultTarget = '20103001';
        else defaultTarget = '20101001';
      } else if (txClass === 'Expense') {
        if (txCategory === 'Credit Cards') defaultTarget = '61104001';
        else defaultTarget = '61103001';
      } else if (txClass === 'Income') {
        if (txCategory === 'Credit Cards') defaultTarget = '70504001';
        else defaultTarget = '70503001';
      }
    } else if (entityVal === 'Universo') {
      if (txClass === 'Assets') {
        if (txCategory === 'Investments account') defaultTarget = '10103002';
        else defaultTarget = '10101002';
      } else if (txClass === 'Liabilities') {
        if (txCategory === 'Credit Cards') defaultTarget = '20103002';
        else defaultTarget = '20101002';
      } else if (txClass === 'Expense') {
        if (txCategory === 'Credit Cards') defaultTarget = '61104002';
        else defaultTarget = '61103002';
      } else if (txClass === 'Income') {
        if (txCategory === 'Credit Cards') defaultTarget = '70504002';
        else defaultTarget = '70503002';
      }
    } else if (entityVal === 'Active Bank') {
      if (txClass === 'Assets') {
        if (txCategory === 'Savings account') defaultTarget = '10102002';
        else if (txCategory === 'Investments account') defaultTarget = '10103003';
        else defaultTarget = '10101003';
      } else if (txClass === 'Liabilities') {
        if (txCategory === 'Credit Cards') defaultTarget = '20103003';
        else defaultTarget = '20101003';
      } else if (txClass === 'Expense') {
        defaultTarget = '61104003';
      } else if (txClass === 'Income') {
        defaultTarget = '70504003';
      }
    } else if (entityVal === 'Inter Bank') {
      if (txClass === 'Assets') {
        if (txCategory === 'Savings account') defaultTarget = '10102003';
        else if (txCategory === 'Investments account') defaultTarget = '10103005';
        else defaultTarget = '10101004';
      } else if (txClass === 'Liabilities') {
        if (txCategory === 'Credit Cards') defaultTarget = '20103004';
        else defaultTarget = '20101004';
      } else if (txClass === 'Expense') {
        defaultTarget = '61104004';
      } else if (txClass === 'Income') {
        defaultTarget = '70504004';
      }
    } else if (entityVal === 'Wizink') {
      if (txClass === 'Assets') {
        defaultTarget = '10103004';
      } else if (txClass === 'Liabilities') {
        if (txCategory === 'Credit Cards') defaultTarget = '20103005';
        else defaultTarget = '20101005';
      }
    } else if (entityVal === 'Cofidis') {
      if (txClass === 'Liabilities') defaultTarget = '20101006';
      else if (txClass === 'Expense') defaultTarget = '61103003';
      else if (txClass === 'Income') defaultTarget = '70503003';
    } else if (entityVal === 'Jota') {
      if (txClass === 'Liabilities') defaultTarget = '20102001';
      else if (txClass === 'Expense') defaultTarget = '61103004';
      else if (txClass === 'Income') defaultTarget = '70503004';
    } else if (entityVal === 'Mae') {
      if (txClass === 'Liabilities') defaultTarget = '20102002';
      else if (txClass === 'Expense') defaultTarget = '61103005';
      else if (txClass === 'Income') defaultTarget = '70503005';
    } else if (entityVal === 'Social Security') {
      if (txClass === 'Liabilities') defaultTarget = '20201001';
      else if (txClass === 'Expense') defaultTarget = '61001003';
      else if (txClass === 'Income') defaultTarget = '70401004';
    } else if (entityVal === 'Finances') {
      if (txClass === 'Liabilities') defaultTarget = '20201002';
      else if (txClass === 'Expense') defaultTarget = '61001002';
      else if (txClass === 'Income') defaultTarget = '70401003';
    } else if (entityVal === 'NOS') {
      if (txClass === 'Liabilities') defaultTarget = '20201003';
      else if (txClass === 'Expense') defaultTarget = '60102003';
    } else if (entityVal === 'Justice') {
      if (txClass === 'Expense') defaultTarget = '61001004';
      else if (txClass === 'Income') defaultTarget = '70401005';
    } else if (entityVal === 'IRS') {
      if (txClass === 'Expense') defaultTarget = '61001005';
      else if (txClass === 'Income') defaultTarget = '70401001';
    } else if (entityVal === 'Car') {
      if (txClass === 'Expense') {
        if (txCategory === 'Repairs') defaultTarget = '60204002';
        else if (txCategory === 'Insurances') defaultTarget = '60901002';
        else defaultTarget = '60201002';
      } else if (txClass === 'Income') {
        defaultTarget = '70301002';
      }
    } else if (entityVal === 'Motorcycle') {
      if (txClass === 'Expense') {
        if (txCategory === 'Repairs') defaultTarget = '60204001';
        else if (txCategory === 'Insurances') defaultTarget = '60901003';
        else defaultTarget = '60201001';
      } else if (txClass === 'Income') {
        defaultTarget = '70301003';
      }
    } else if (entityVal === 'Health Insurance') {
      if (txClass === 'Expense') defaultTarget = '60901001';
      else if (txClass === 'Income') defaultTarget = '70301001';
    } else if (entityVal === 'Life insurance') {
      if (txClass === 'Expense') defaultTarget = '60901004';
      else if (txClass === 'Income') defaultTarget = '70301004';
    } else if (entityVal === 'Interest') {
      if (txClass === 'Expense') defaultTarget = '61101001';
      else if (txClass === 'Income') defaultTarget = '70501001';
    } else if (entityVal === 'Fines') {
      if (txClass === 'Expense') defaultTarget = '61102001';
      else if (txClass === 'Income') defaultTarget = '70502001';
    }
    
    if (defaultTarget) {
      setTxTargetAccount(defaultTarget);
    }
  };

  const resetFormState = () => {
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
    setTxDueDate('');
  };

  const applyTemplate = (tpl) => {
    setTxClass(tpl.data.transaction_type);
    setTxAmount(tpl.data.amount);
    setTxFrom(email === 'divagarpelamente@gmail.com' ? 'Pedro' : tpl.data.from);
    setTxStatus(tpl.data.payment_status);
    setTxSubClass(tpl.data.transaction_subtype);
    setTxEntity(tpl.data.entity);
    setTxCategory(tpl.data.transaction_category);
    setTxDescription(tpl.data.description);
    setTxTargetAccount(tpl.data.target_account || '60101001');
    setTxSourceDestBank(tpl.data.source_dest_bank || '10101001');
    setTxFlow(tpl.data.flow || 'outflow');
    setTxValueDate(new Date().toISOString().split('T')[0]);
    setTxPostingDate(new Date().toISOString().split('T')[0]);

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

  const startEdit = (tx) => {
    setTxClass(tx.transaction_type || '');
    setTxAmount(tx.amount || '');
    setTxFrom(tx.from || '');
    setTxValueDate(tx.value_date || new Date().toISOString().split('T')[0]);
    setTxPostingDate(tx.posting_date || new Date().toISOString().split('T')[0]);
    setTxDueDate(tx.due_date || '');
    setTxStatus(tx.payment_status || '');
    setTxSubClass(tx.transaction_subtype || '');
    setTxEntity(tx.entity || '');
    setTxCategory(tx.transaction_category || entityMappings[tx.entity] || '');
    setTxDescription(tx.description || '');
    setTxTargetAccount(tx.target_account || '');
    setTxSourceDestBank(tx.source_dest_bank || '');
    setTxFlow(tx.flow || '');
    setEditingTxId(tx.id);
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

      const accountCodeRegex = /^\d{8}$/;
      const safeTarget = txTargetAccount || '';
      const safeSource = txSourceDestBank || '';

      if (!accountCodeRegex.test(safeTarget)) {
        toast.error(`Erro de Validação: Código da Conta de Destino (Target Account) deve ter 8 dígitos.`);
        return;
      }
      if (!accountCodeRegex.test(safeSource)) {
        toast.error(`Erro de Validação: Código da Conta de Origem (Source account) deve ter 8 dígitos.`);
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
        if (setIsNewTxModalOpen) setIsNewTxModalOpen(false);
        setEditingTxId(null);
        resetFormState();
        
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
        due_date: txDueDate || null,
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
        resetFormState();
      } else {
        toast.error(`${t('err_save_failed') || 'Save failed'}: ${res.error}`);
      }
    } catch (err) {
      console.error(err);
      toast.error(`${t('err_save_failed') || 'Save failed'}: ${err.message || err}`);
    }
  };

  return {
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
  };
}
