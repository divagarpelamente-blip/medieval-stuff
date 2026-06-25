/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { useKingdomStore } from '../store/useKingdomStore';
import { useTranslation } from 'react-i18next';

export function useQuickActionForm() {
  const { t: originalT } = useTranslation();
  const t = new Proxy(originalT, {
    get(target, prop) {
      if (prop in target) return target[prop];
      if (typeof prop === 'string') return target(prop);
      return undefined;
    }
  });

  // Bind Zustand states & actions
  const email = useKingdomStore((state) => state.email);
  const fromOptions = useKingdomStore((state) => state.fromOptions);
  const statusOptions = useKingdomStore((state) => state.statusOptions);
  const classOptions = useKingdomStore((state) => state.classOptions);
  const subClassOptions = useKingdomStore((state) => state.subClassOptions);
  const entityOptions = useKingdomStore((state) => state.entityOptions);
  const categoryOptions = useKingdomStore((state) => state.categoryOptions);
  const entityMappings = useKingdomStore((state) => state.entityMappings);

  const addOption = useKingdomStore((state) => state.addOption);
  const editOption = useKingdomStore((state) => state.editOption);
  const deleteOption = useKingdomStore((state) => state.deleteOption);

  // Quick Action Form States
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

  const [selectedQaNames, setSelectedQaNames] = useState([]);
  const [selectedQaTemplateName, setSelectedQaTemplateName] = useState('');

  // Sync selectors defaults when store changes
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

  // Set default Pedro if email is divagarpelamente@gmail.com
  useEffect(() => {
    if (email === 'divagarpelamente@gmail.com') {
      setQaFrom('Pedro');
    }
  }, [email]);

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

  const handleQaEntityChange = (entityVal) => {
    setQaEntity(entityVal);
    const mapped = entityMappings[entityVal];
    if (mapped) {
      setQaCategory(mapped);
    }
  };

  const resetQaForm = () => {
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

  const handleSaveQuickAction = () => {
    const nameVal = qaName.trim();
    if (!nameVal) {
      toast.error(t.err_enter_value || "Escolha um nome.");
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
    resetQaForm();
  };

  const handleDeleteQuickAction = () => {
    selectedQaNames.forEach(name => {
      deleteOption('quickAction', name);
    });
    toast.success(`Deleted template(s)`);
    setSelectedQaNames([]);
    setSelectedQaTemplateName('');
    resetQaForm();
  };

  const handleAddQuickAction = (e) => {
    if (e) e.preventDefault();
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
    resetQaForm();
    toast.success(t('success_added_option', { val: nameVal }));
  };

  const loadTemplateIntoForm = (tplName) => {
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
      resetQaForm();
      setSelectedQaNames([]);
    }
  };

  return {
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
  };
}
