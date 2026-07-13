import { useState, useEffect, useMemo } from 'react';
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
  const flatMatrix = useKingdomStore((state) => state.flatMatrix) || [];
  
  const getTypes = useKingdomStore((state) => state.getTypes);
  const getSubtypesByType = useKingdomStore((state) => state.getSubtypesByType);
  const getCategoriesBySubtype = useKingdomStore((state) => state.getCategoriesBySubtype);
  const getEntitiesByCategory = useKingdomStore((state) => state.getEntitiesByCategory);
  const getAccountCode = useKingdomStore((state) => state.getAccountCode);

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
  const [txQuickActionName, setTxQuickActionName] = useState(null);

  // Unified fallback arrays for non-cascading defaults
  const fromOptions = useMemo(() => ['Pedro', 'Reni', 'Kingdom Treasury'], []);
  const statusOptions = useMemo(() => ['Pending', 'Completed', 'Cancelled'], []);

  // Omni-directional choices resolved directly from Flat Matrix
  const classOptions = useMemo(() => {
    const types = getTypes ? getTypes() : [];
    return types.length > 0 ? types : ['Assets', 'Liabilities', 'Income', 'Expense'];
  }, [getTypes, flatMatrix]);

  // Handle Synchronous State Cascade Clears to eliminate React Race Conditions
  const handleSetTxClass = (val) => {
    setTxClass(val);
    setTxSubClass('');
    setTxCategory('');
    setTxEntity('');
    setTxTargetAccount('');
  };

  const handleSetTxSubClass = (val) => {
    setTxSubClass(val);
    setTxCategory('');
    setTxEntity('');
    setTxTargetAccount('');
  };

  const handleSetTxCategory = (val) => {
    setTxCategory(val);
    setTxEntity('');
    setTxTargetAccount('');
  };

  const handleEntityChange = (entityVal) => {
    setTxEntity(entityVal);
    if (txClass && txSubClass && txCategory && entityVal) {
      const code = getAccountCode(txClass, txSubClass, txCategory, entityVal);
      if (code) {
        setTxTargetAccount(code);
      } else {
        setTxTargetAccount('');
      }
    } else {
      setTxTargetAccount('');
    }
  };

  // Permitted options computed in real-time
  const allowedSubClasses = useMemo(() => {
    if (!txClass) {
      return [...new Set(flatMatrix.map(r => r.subtype))].filter(Boolean).sort();
    }
    return getSubtypesByType ? getSubtypesByType(txClass) : [];
  }, [flatMatrix, txClass, getSubtypesByType]);

  const allowedCategories = useMemo(() => {
    if (!txSubClass) {
      return [...new Set(flatMatrix.map(r => r.category))].filter(Boolean).sort();
    }
    return getCategoriesBySubtype ? getCategoriesBySubtype(txSubClass) : [];
  }, [flatMatrix, txSubClass, getCategoriesBySubtype]);

  const allowedEntities = useMemo(() => {
    if (!txCategory) {
      return [...new Set(flatMatrix.map(r => r.entity))].filter(Boolean).sort();
    }
    return getEntitiesByCategory ? getEntitiesByCategory(txCategory) : [];
  }, [flatMatrix, txCategory, getEntitiesByCategory]);

  // Cascading Navigation Templates (Aligned to 8-digit prefixes)
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
      'Universo': { transaction_type: 'Liabilities', transaction_subtype: 'Personal Debt', transaction_category: 'Credit Cards', target_account: '21010001', flow: 'outflow', payment_status: 'Completed' },
      'CGD': { transaction_type: 'Liabilities', transaction_subtype: 'Personal Debt', transaction_category: 'Loans & Burrow', target_account: '21020001', flow: 'outflow', payment_status: 'Completed' },
      'Active Bank': { transaction_type: 'Assets', transaction_subtype: 'Banks', transaction_category: 'Savings account', target_account: '11020001', flow: 'neutral', payment_status: 'Completed' }
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

  // Enforce automatic defaults based on authenticated user
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
      setTxEntity(sub);
      setTxFlow(payload.flow);
      setTxStatus(payload.payment_status);

      // Resolve the system's strict 8-digit target account from the flat matrix
      const resolvedCode = getAccountCode(
        payload.transaction_type,
        payload.transaction_subtype,
        payload.transaction_category,
        sub
      );
      setTxTargetAccount(resolvedCode || payload.target_account || '');
      setTxSourceDestBank('11010001'); // Safe 8-digit checking default
    }
  };

  const resetFormState = () => {
    setTxAmount('');
    setTxDescription('');
    setTxFrom(email === 'divagarpelamente@gmail.com' ? 'Pedro' : '');
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
    setTxQuickActionName(null);
  };

  const applyTemplate = (tpl) => {
    setTxClass(tpl.data.transaction_type || '');
    setTxAmount(tpl.data.amount || '');
    setTxFrom(email === 'divagarpelamente@gmail.com' ? 'Pedro' : (tpl.data.from || ''));
    setTxStatus(tpl.data.payment_status || '');
    setTxSubClass(tpl.data.transaction_subtype || '');
    setTxEntity(tpl.data.entity || '');
    setTxCategory(tpl.data.transaction_category || '');
    setTxDescription(tpl.data.description || '');
    setTxFlow(tpl.data.flow || 'outflow');
    setTxValueDate(new Date().toISOString().split('T')[0]);
    setTxPostingDate(new Date().toISOString().split('T')[0]);
    setTxQuickActionName(tpl.name);

    // Dynamic mapping configuration resolve
    const resolvedTarget = getAccountCode(
      tpl.data.transaction_type,
      tpl.data.transaction_subtype,
      tpl.data.transaction_category,
      tpl.data.entity
    );
    setTxTargetAccount(resolvedTarget || tpl.data.target_account || '');
    setTxSourceDestBank(tpl.data.source_dest_bank || '11010001');

    let matched = false;
    for (const [main, subActions] of Object.entries(cascadingConfig)) {
      for (const [sub] of Object.entries(subActions)) {
        if (sub.toLowerCase() === (tpl.data.entity || '').toLowerCase()) {
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
    setTxQuickActionName(tx.quick_action_name || null);
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
      if (!txEntity || txEntity.trim() === '') {
        toast.error("Erro de Validação: Escolha uma Entidade.");
        return;
      }

      // Check association against the flat matrix
      const isCombinationValid = flatMatrix.some(row => 
        (row.entity || '').trim() !== '' &&
        (row.subtype || '').trim() === (txSubClass || '').trim() &&
        (row.category || '').trim() === (txCategory || '').trim() &&
        (row.entity || '').trim() === (txEntity || '').trim()
      );

      if (!isCombinationValid) {
        toast.error("Erro de Validação: A combinação de Subtipo, Categoria e Entidade selecionada não é válida de acordo com a Matriz de Associação.");
        return;
      }

      if (!txAmount || isNaN(txAmount) || Number(txAmount) <= 0) {
        toast.error(t.err_invalid_amount);
        return;
      }

      const accountCodeRegex = /^\d{8}$/;
      const safeTarget = txTargetAccount || '';
      const safeSource = txSourceDestBank || '11010001';

      if (!accountCodeRegex.test(safeTarget)) {
        toast.error(`Erro de Validação: Código da Conta de Destino (Target Account) deve ter exatamente 8 dígitos.`);
        return;
      }
      if (!accountCodeRegex.test(safeSource)) {
        toast.error(`Erro de Validação: Código da Conta de Origem (Source account) deve ter exatamente 8 dígitos.`);
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
            quarter: 'Q' + (Math.floor(new Date(txPostingDate).getMonth() / 3) + 1),
            quick_action_name: txQuickActionName || null
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
        quick_action_name: txQuickActionName || null,
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
    txClass, setTxClass: handleSetTxClass,
    txAmount, setTxAmount,
    txFrom, setTxFrom,
    txValueDate, setTxValueDate,
    txPostingDate, setTxPostingDate,
    txDueDate, setTxDueDate,
    txStatus, setTxStatus,
    txSubClass, setTxSubClass: handleSetTxSubClass,
    txEntity, setTxEntity,
    txCategory, setTxCategory: handleSetTxCategory,
    txSubCategory,
    txDescription, setTxDescription,
    txTargetAccount, setTxTargetAccount,
    txSourceDestBank, setTxSourceDestBank,
    txFlow, setTxFlow,
    editingTxId, setEditingTxId,
    txQuickActionName, setTxQuickActionName,
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
  };
}