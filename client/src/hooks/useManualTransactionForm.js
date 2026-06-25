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
      'Rent - Oeiras': { transaction_type: 'Expense', transaction_subtype: 'Living & Household', transaction_category: 'Living & Household', target_account: '60101001', flow: 'outflow', payment_status: 'Pending' },
      'Electricity Expense (ENDESA)': { transaction_type: 'Expense', transaction_subtype: 'Utilities', transaction_category: 'Utilities', target_account: '60102001', flow: 'outflow', payment_status: 'Pending' },
      'Gas Expense (DIGAL)': { transaction_type: 'Expense', transaction_subtype: 'Utilities', transaction_category: 'Utilities', target_account: '60102002', flow: 'outflow', payment_status: 'Pending' },
      'Water Expense (SIMAS)': { transaction_type: 'Expense', transaction_subtype: 'Utilities', transaction_category: 'Utilities', target_account: '60102003', flow: 'outflow', payment_status: 'Pending' },
      'Communications Expense (NOS)': { transaction_type: 'Expense', transaction_subtype: 'Utilities', transaction_category: 'Utilities', target_account: '60102004', flow: 'outflow', payment_status: 'Pending' },
      'Household Utensils - Repairs': { transaction_type: 'Expense', transaction_subtype: 'Living & Household', transaction_category: 'Living & Household', target_account: '60101002', flow: 'outflow', payment_status: 'Completed' }
    },
    'Transports': {
      'Vehicle Fuel - Car Gasoline': { transaction_type: 'Expense', transaction_subtype: 'Personal & Public Transports', transaction_category: 'Personal & Public Transports', target_account: '60201002', flow: 'outflow', payment_status: 'Completed' },
      'Tolls Expense': { transaction_type: 'Expense', transaction_subtype: 'Personal & Public Transports', transaction_category: 'Personal & Public Transports', target_account: '60202001', flow: 'outflow', payment_status: 'Completed' },
      'Parking Expense': { transaction_type: 'Expense', transaction_subtype: 'Personal & Public Transports', transaction_category: 'Personal & Public Transports', target_account: '60203001', flow: 'outflow', payment_status: 'Completed' }
    },
    'Banking & Liabilities': {
      'Credit Card Debt Universo': { transaction_type: 'Liabilities', transaction_subtype: 'Credit Card Liabilities (Dívidas dos Cartões)', transaction_category: 'Credit Card Liabilities (Dívidas dos Cartões)', target_account: '20103002', flow: 'outflow', payment_status: 'Completed' },
      'Loans CGD': { transaction_type: 'Liabilities', transaction_subtype: 'Personal Loans / Financiamentos', transaction_category: 'Personal Loans / Financiamentos', target_account: '20101001', flow: 'outflow', payment_status: 'Completed' },
      'Savings Account CGD': { transaction_type: 'Assets', transaction_subtype: 'Savings Accounts', transaction_category: 'Savings Accounts', target_account: '10102002', flow: 'neutral', payment_status: 'Completed' }
    },
    'Personal & Lifestyle': {
      'Entertainment - Restaurants': { transaction_type: 'Expense', transaction_subtype: 'Entertainment', transaction_category: 'Entertainment', target_account: '60701001', flow: 'outflow', payment_status: 'Completed' },
      'Entertainment - Cinema': { transaction_type: 'Expense', transaction_subtype: 'Entertainment', transaction_category: 'Entertainment', target_account: '60701002', flow: 'outflow', payment_status: 'Completed' },
      'Supermarket - Personal Care': { transaction_type: 'Expense', transaction_subtype: 'Food & Consumables', transaction_category: 'Food & Consumables', target_account: '60501006', flow: 'outflow', payment_status: 'Completed' },
      'Clothing Expense': { transaction_type: 'Expense', transaction_subtype: 'Tools, Materials & Clothing', transaction_category: 'Tools, Materials & Clothing', target_account: '60503001', flow: 'outflow', payment_status: 'Completed' }
    },
    'Income & Revenue': {
      'Salary - Base Salary': { transaction_type: 'Income', transaction_subtype: 'Payroll & Active Income', transaction_category: 'Payroll & Active Income', target_account: '70101001', flow: 'inflow', payment_status: 'Pending' },
      'Salary - Bonus': { transaction_type: 'Income', transaction_subtype: 'Payroll & Active Income', transaction_category: 'Payroll & Active Income', target_account: '70101004', flow: 'inflow', payment_status: 'Completed' }
    }
  };

  const [mainMenu, setMainMenu] = useState('House & Utilities');
  const [subMenuAction, setSubMenuAction] = useState('Rent - Oeiras');

  const entityToTargetAccount = {
    "Salary": "70101001",
    "Bonus": "70101004",
    "Rent": "60101001",
    "Repairs": "60204001",
    "Decorations": "60101003",
    "Utensils": "60101002",
    "Electricity": "60102001",
    "Gas": "60102002",
    "Water": "60102003",
    "Communications": "60102004",
    "Gasoline": "60201001",
    "Supermarket": "60501001",
    "Tools and Equipment": "60502001",
    "Clothing": "60503001",
    "Restaurant": "60701001",
    "Cinema": "60701002",
    "Streaming": "60701003",
    "CGD": "10101001",
    "Universo": "20103002",
    "ActiveBank": "10101003",
    "WizInk": "10103004",
    "Inter(Brasil)": "10101004",
    "Cofidis": "20101006",
    "Jota": "20102001",
    "Mae": "20102002",
    "Savings Account": "10102001",
    "Reni (Burrow)": "20102003",
    "Pedro (Burrow)": "20102004",
    "Social Security Debt": "20201001",
    "Finances Debt": "20201002",
    "NOS Debt": "20201003",
    "PhD": "60801001",
    "Trainings": "60801002",
    "Psychology": "60601004",
    "Psychiatry": "60601005",
    "Dentist": "60601006",
    "Pharmacy": "60601007",
    "Second Rent (e.g., Portela)": "60101001",
    "Secondary Communications (NOS)": "60102005",
    "Public Transport (Metro/Train)": "60301001",
    "Personal Care & Cosmetics": "60501006",
    "Shoes": "60503002",
    "Nightlife & Disco": "60701004",
    "Gaming": "60701005",
    "Vacation Subsidy": "70102001",
    "Christmas Subsidy": "70102002",
    "Teaching Classes": "70101003"
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
    const defaultTarget = entityToTargetAccount[entityVal];
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
    setTxCategory(tx.transaction_category || '');
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
