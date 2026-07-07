import { useState, useRef, useEffect, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import Modal from '../common/Modal';
import { STANDARD_MODAL_PROPS } from '../../constants/UI_UX';
import { parseCSV } from '../../utils/csvHelpers';
import TableSortHeader from '../common/TableSortHeader';
import TablePagination from '../common/TablePagination';
import BulkActionBar from '../common/BulkActionBar';

export default function COAEditor({
  t,
  accountMappings,
  subtypeToCategoryMap = {},
  subtypeTypes = {},
  syncSettings
}) {
  const fileInputRef = useRef(null);
  const [selectedCodes, setSelectedCodes] = useState([]);
  const [editingCode, setEditingCode] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editSubtype, setEditSubtype] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editEntity, setEditEntity] = useState('');
  const [editCustomSubtype, setEditCustomSubtype] = useState('');
  const [editCustomCategory, setEditCustomCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Add Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');

  // Wizard States
  const [selectedType, setSelectedType] = useState('1');
  const [selectedSubtype, setSelectedSubtype] = useState('');
  const [customSubtype, setCustomSubtype] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [selectedEntity, setSelectedEntity] = useState('');
  const [customEntity, setCustomEntity] = useState('');
  const [manualMode, setManualMode] = useState(false);
  const [manualAccountCode, setManualAccountCode] = useState('');
  const [manualAccountName, setManualAccountName] = useState('');
  const [isCodeDirty, setIsCodeDirty] = useState(false);
  const [isNameDirty, setIsNameDirty] = useState(false);

  // Sort States
  const [sortField, setSortField] = useState('code');
  const [sortDirection, setSortDirection] = useState('asc');

  // Filters
  const [filterType, setFilterType] = useState('');
  const [filterSubtype, setFilterSubtype] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [manualPageInput, setManualPageInput] = useState('1');

  useEffect(() => {
    setManualPageInput(String(currentPage));
  }, [currentPage]);

  // 1. Parsing Helper
  const parseAccountName = (code, fullName) => {
    let remaining = fullName;
    if (remaining.startsWith(code)) {
      remaining = remaining.substring(code.length).replace(/^\s*-\s*/, '');
    }
    const parts = remaining.split(/\s*-\s*/);
    const subtype = parts[0] || 'Other';
    const entity = parts.slice(1).join(' - ') || 'Other';
    return { subtype, entity };
  };

  const getSubtypeType = (code) => {
    const firstDigit = code[0];
    if (firstDigit === '1') return 'Assets';
    if (firstDigit === '2') return 'Liabilities';
    if (firstDigit === '6') return 'Expense';
    if (firstDigit === '7') return 'Income';
    return 'Other';
  };

  const TYPE_SUBTYPES = {
    '1': [],
    '2': [],
    '6': [],
    '7': []
  };

  Object.keys(subtypeToCategoryMap).forEach(st => {
    const types = subtypeTypes[st] || [];
    if (types.length > 0) {
      types.forEach(t => {
        if (TYPE_SUBTYPES[t]) {
          TYPE_SUBTYPES[t].push(st);
        }
      });
    } else {
      const defaults = {
        'Banks': '1', 'Fixed Assets': '1',
        'Personal Debt': '2', 'Other Debts': '2',
        'Living & Household': '6', 'Personal Transports': '6', 'Public Transports': '6', 'Other Transports': '6',
        'Markets & Consumables': '6', 'Health': '6', 'Entertainment': '6', 'Education': '6',
        'Insurances': '6', 'Taxes & State': '6', 'Financial Expenses': '6',
        'Payroll': '7', 'Other Income': '7', 'Financial Income': '7'
      };
      const t = defaults[st] || '6';
      if (TYPE_SUBTYPES[t]) {
        TYPE_SUBTYPES[t].push(st);
      }
    }
  });

  const findSubtype = (code, category) => {
    const typeDigit = code[0];
    const allowed = TYPE_SUBTYPES[typeDigit] || [];
    for (const st of allowed) {
      const cats = subtypeToCategoryMap[st] || [];
      if (cats.includes(category)) {
        return st;
      }
    }
    return 'Other';
  };

  // Convert mapping object to array of rows with structured data
  const allRows = Object.entries(accountMappings).map(([code, name]) => {
    const parsed = parseAccountName(code, name);
    const type = getSubtypeType(code);
    const category = parsed.subtype;
    const subtype = findSubtype(code, category);
    const accountName = parsed.entity;

    return {
      code,
      name,
      type,
      subtype,
      category,
      accountName
    };
  });

  // Filtering
  const filteredRows = allRows.filter(row => {
    if (filterType && row.type !== filterType) return false;
    if (filterSubtype && row.subtype !== filterSubtype) return false;
    if (filterCategory && row.category !== filterCategory) return false;
    const q = searchQuery.toLowerCase();
    return row.code.includes(q) || 
           row.name.toLowerCase().includes(q) || 
           row.type.toLowerCase().includes(q) || 
           row.subtype.toLowerCase().includes(q) || 
           row.category.toLowerCase().includes(q) || 
           row.accountName.toLowerCase().includes(q);
  });

  const uniqueTypes = ['Assets', 'Liabilities', 'Expense', 'Income'];
  const uniqueSubtypes = Array.from(new Set(
    allRows
      .filter(r => !filterType || r.type === filterType)
      .map(r => r.subtype)
      .filter(Boolean)
  )).sort();

  const uniqueCategories = Array.from(new Set(
    allRows
      .filter(r => {
        if (filterType && r.type !== filterType) return false;
        if (filterSubtype && r.subtype !== filterSubtype) return false;
        return true;
      })
      .map(r => r.category)
      .filter(Boolean)
  )).sort();

  // Sorting
  const sortedRows = useMemo(() => {
    return [...filteredRows].sort((a, b) => {
      const valA = a[sortField] || '';
      const valB = b[sortField] || '';
      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredRows, sortField, sortDirection]);

  // Pagination logic
  const itemsPerPage = 10;
  const totalPages = Math.ceil(sortedRows.length / itemsPerPage) || 1;
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);
  const paginatedRows = useMemo(() => {
    return sortedRows.slice((safeCurrentPage - 1) * itemsPerPage, safeCurrentPage * itemsPerPage);
  }, [sortedRows, safeCurrentPage]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };



  // 2. Scan Mappings to build options
  const subtypesByType = {
    '1': new Set(),
    '2': new Set(),
    '6': new Set(),
    '7': new Set()
  };
  const entities = new Set();
  const subtypePrefixes = {};

  Object.entries(accountMappings).forEach(([code, name]) => {
    const typeDigit = code[0];
    const prefix5 = code.substring(0, 5);
    const parsed = parseAccountName(code, name);
    if (subtypesByType[typeDigit]) {
      subtypesByType[typeDigit].add(parsed.subtype);
    }
    subtypePrefixes[parsed.subtype] = prefix5;
    entities.add(parsed.entity);
  });

  // 3. Helper to get next unused prefix
  const getNextUnusedPrefix = (typeDigit) => {
    let major = 1;
    let minor = 1;
    while (true) {
      const prefix = `${typeDigit}${String(major).padStart(2, '0')}${String(minor).padStart(2, '0')}`;
      const exists = Object.keys(accountMappings).some(code => code.startsWith(prefix));
      if (!exists) {
        return prefix;
      }
      minor++;
      if (minor > 99) {
        minor = 1;
        major++;
      }
    }
  };

  // 4. Helper to get next sequence suffix
  const getNextSequence = (prefix) => {
    const matchingCodes = Object.keys(accountMappings)
      .filter(code => code.startsWith(prefix))
      .map(code => parseInt(code.substring(5), 10))
      .filter(num => !isNaN(num));
    const maxSeq = matchingCodes.length > 0 ? Math.max(...matchingCodes) : 0;
    return String(maxSeq + 1).padStart(3, '0');
  };

  // Derive lists for selection
  const subtypesList = Array.from(new Set(TYPE_SUBTYPES[selectedType] || [])).sort();
  const categoriesList = Array.from(new Set(subtypeToCategoryMap[selectedSubtype] || [])).sort();
  const entitiesList = Array.from(entities).sort();

  const editTypeDigit = editingCode ? editingCode[0] : '1';
  const editSubtypesList = Array.from(new Set(TYPE_SUBTYPES[editTypeDigit] || [])).sort();
  const editCategoriesList = Array.from(new Set(subtypeToCategoryMap[editSubtype] || [])).sort();

  const subtypeVal = selectedSubtype === 'custom' ? customSubtype.trim() : selectedSubtype;
  const categoryVal = selectedCategory === 'custom' ? customCategory.trim() : selectedCategory;
  const entityVal = selectedEntity === 'custom' ? customEntity.trim() : selectedEntity;

  // Prefix calculation
  const getDynamicPrefix = (typeDigit, subtype, category) => {
    let tss = '';
    const existingSubtypeMatch = Object.entries(accountMappings).find(([code, name]) => {
      if (code[0] !== typeDigit) return false;
      const parsed = parseAccountName(code, name);
      const cat = parsed.subtype;
      const sub = findSubtype(code, cat);
      return sub === subtype;
    });

    if (existingSubtypeMatch) {
      tss = existingSubtypeMatch[0].substring(0, 3);
    } else {
      let ss = 1;
      while (true) {
        const candidateTss = `${typeDigit}${String(ss).padStart(2, '0')}`;
        const exists = Object.keys(accountMappings).some(code => code.startsWith(candidateTss));
        if (!exists) {
          tss = candidateTss;
          break;
        }
        ss++;
      }
    }

    const existingCategoryMatch = Object.entries(accountMappings).find(([code, name]) => {
      if (!code.startsWith(tss)) return false;
      const parsed = parseAccountName(code, name);
      return parsed.subtype === category;
    });

    if (existingCategoryMatch) {
      return existingCategoryMatch[0].substring(0, 5);
    } else {
      let ccVal = 1;
      while (true) {
        const candidatePrefix = `${tss}${String(ccVal).padStart(2, '0')}`;
        const exists = Object.keys(accountMappings).some(code => code.startsWith(candidatePrefix));
        if (!exists) {
          return candidatePrefix;
        }
        ccVal++;
      }
    }
  };

  const prefix = (subtypeVal && categoryVal) ? getDynamicPrefix(selectedType, subtypeVal, categoryVal) : `${selectedType}0101`;
  const generatedSeq = getNextSequence(prefix);
  const generatedCode = `${prefix}${generatedSeq}`;
  const generatedName = categoryVal && entityVal 
    ? `${generatedCode} - ${categoryVal} - ${entityVal}` 
    : '';

  useEffect(() => {
    if (!isCodeDirty) {
      setManualAccountCode(generatedCode);
    }
  }, [generatedCode, isCodeDirty]);

  useEffect(() => {
    if (!isNameDirty) {
      setManualAccountName(generatedName);
    }
  }, [generatedName, isNameDirty]);

  const handleOpenAddModal = () => {
    let initialType = '1';
    if (filterType) {
      if (filterType === 'Assets') initialType = '1';
      else if (filterType === 'Liabilities') initialType = '2';
      else if (filterType === 'Expense') initialType = '6';
      else if (filterType === 'Income') initialType = '7';
    }
    setSelectedType(initialType);

    const availableSubtypes = Array.from(new Set(TYPE_SUBTYPES[initialType] || [])).sort();
    let firstSubtype = availableSubtypes[0] || 'custom';
    if (filterSubtype && availableSubtypes.includes(filterSubtype)) {
      firstSubtype = filterSubtype;
    }
    setSelectedSubtype(firstSubtype);

    const availableCategories = Array.from(new Set(subtypeToCategoryMap[firstSubtype] || [])).sort();
    let firstCategory = availableCategories[0] || 'custom';
    if (filterCategory && availableCategories.includes(filterCategory)) {
      firstCategory = filterCategory;
    }
    setSelectedCategory(firstCategory);

    setSelectedEntity(Array.from(entities).sort()[0] || 'custom');
    setCustomSubtype('');
    setCustomCategory('');
    setCustomEntity('');
    
    setIsCodeDirty(false);
    setIsNameDirty(false);
    setManualMode(false);
    setNewCode('');
    setNewName('');
    setIsAddModalOpen(true);
  };

  const handleTypeChange = (type) => {
    setSelectedType(type);
    const availableSubtypes = Array.from(new Set(TYPE_SUBTYPES[type] || [])).sort();
    const firstSubtype = availableSubtypes[0] || 'custom';
    setSelectedSubtype(firstSubtype);
    
    const availableCategories = Array.from(new Set(subtypeToCategoryMap[firstSubtype] || [])).sort();
    const firstCategory = availableCategories[0] || 'custom';
    setSelectedCategory(firstCategory);

    setIsCodeDirty(false);
    setIsNameDirty(false);
  };

  const handleSubtypeChange = (val) => {
    setSelectedSubtype(val);
    const availableCategories = Array.from(new Set(subtypeToCategoryMap[val] || [])).sort();
    const firstCategory = availableCategories[0] || 'custom';
    setSelectedCategory(firstCategory);
    setIsCodeDirty(false);
    setIsNameDirty(false);
  };

  const handleCategoryChange = (val) => {
    setSelectedCategory(val);
    setIsCodeDirty(false);
    setIsNameDirty(false);
  };

  const handleEntityChange = (val) => {
    setSelectedEntity(val);
    setIsCodeDirty(false);
    setIsNameDirty(false);
  };

  const handleAddAccount = (e) => {
    e.preventDefault();
    let cleanCode = '';
    let cleanName = '';

    if (manualMode) {
      cleanCode = newCode.trim();
      cleanName = newName.trim();
    } else {
      cleanCode = manualAccountCode.trim();
      cleanName = manualAccountName.trim();
    }

    if (!/^\d{8}$/.test(cleanCode)) {
      toast.error('O código da conta deve conter exatamente 8 dígitos.');
      return;
    }

    if (!cleanName) {
      toast.error('Por favor, informe o nome da conta.');
      return;
    }

    if (accountMappings[cleanCode]) {
      toast.error('Este código de conta já existe.');
      return;
    }

    let nextSubtypeToCategoryMap = { ...subtypeToCategoryMap };
    let nextSubClassOptions = Array.from(new Set(Object.keys(subtypeToCategoryMap)));
    let nextCategoryOptions = Array.from(new Set(Object.values(subtypeToCategoryMap).flat()));
    let nextEntityOptions = Array.from(entities);

    if (selectedSubtype === 'custom' && subtypeVal) {
      if (!nextSubClassOptions.includes(subtypeVal)) {
        nextSubClassOptions.push(subtypeVal);
      }
      if (!nextSubtypeToCategoryMap[subtypeVal]) {
        nextSubtypeToCategoryMap[subtypeVal] = [];
      }
    }

    if (selectedCategory === 'custom' && categoryVal) {
      if (!nextCategoryOptions.includes(categoryVal)) {
        nextCategoryOptions.push(categoryVal);
      }
      if (subtypeVal) {
        if (!nextSubtypeToCategoryMap[subtypeVal]) {
          nextSubtypeToCategoryMap[subtypeVal] = [];
        }
        if (!nextSubtypeToCategoryMap[subtypeVal].includes(categoryVal)) {
          nextSubtypeToCategoryMap[subtypeVal].push(categoryVal);
        }
      }
    }

    if (selectedEntity === 'custom' && entityVal) {
      if (!nextEntityOptions.includes(entityVal)) {
        nextEntityOptions.push(entityVal);
      }
    }

    const updated = {
      ...accountMappings,
      [cleanCode]: cleanName
    };

    syncSettings({
      accountMappings: updated,
      subtypeToCategoryMap: nextSubtypeToCategoryMap,
      subClassOptions: nextSubClassOptions,
      categoryOptions: nextCategoryOptions,
      entityOptions: nextEntityOptions
    });
    
    toast.success('Conta adicionada com sucesso!');
    setIsAddModalOpen(false);
  };

  const handleStartEdit = (row) => {
    setEditingCode(row.code);
    setEditSubtype(row.subtype || '');
    setEditCategory(row.category || '');
    setEditEntity(row.accountName || '');
    setEditCustomSubtype('');
    setEditCustomCategory('');
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    const finalSubtype = editSubtype === 'custom' ? editCustomSubtype.trim() : editSubtype;
    const finalCategory = editCategory === 'custom' ? editCustomCategory.trim() : editCategory;
    const finalEntity = editEntity.trim();

    if (!finalCategory || !finalEntity) {
      toast.error('A categoria e a entidade não podem estar vazias.');
      return;
    }

    const newFullName = `${editingCode} - ${finalCategory} - ${finalEntity}`;

    const updated = {
      ...accountMappings,
      [editingCode]: newFullName
    };

    let nextSubtypeToCategoryMap = { ...subtypeToCategoryMap };
    let nextSubClassOptions = Array.from(new Set(Object.keys(subtypeToCategoryMap)));
    let nextCategoryOptions = Array.from(new Set(Object.values(subtypeToCategoryMap).flat()));

    if (editSubtype === 'custom' && editCustomSubtype) {
      if (!nextSubClassOptions.includes(editCustomSubtype)) {
        nextSubClassOptions.push(editCustomSubtype);
      }
      if (!nextSubtypeToCategoryMap[editCustomSubtype]) {
        nextSubtypeToCategoryMap[editCustomSubtype] = [];
      }
    }
    const targetSubtype = editSubtype === 'custom' ? editCustomSubtype : editSubtype;
    if (editCategory === 'custom' && editCustomCategory && targetSubtype) {
      if (!nextCategoryOptions.includes(editCustomCategory)) {
        nextCategoryOptions.push(editCustomCategory);
      }
      if (!nextSubtypeToCategoryMap[targetSubtype].includes(editCustomCategory)) {
        nextSubtypeToCategoryMap[targetSubtype].push(editCustomCategory);
      }
    }

    syncSettings({
      accountMappings: updated,
      subtypeToCategoryMap: nextSubtypeToCategoryMap,
      subClassOptions: nextSubClassOptions,
      categoryOptions: nextCategoryOptions
    });

    toast.success('Conta atualizada com sucesso!');
    setIsEditModalOpen(false);
    setEditingCode(null);
  };

  const handleDeleteAccount = (code) => {
    if (!confirm('Deseja realmente remover esta conta do Plano de Contas?')) {
      return;
    }
    const updated = { ...accountMappings };
    delete updated[code];
    syncSettings({ accountMappings: updated });
    setSelectedCodes(prev => prev.filter(c => c !== code));
    toast.success('Conta removida com sucesso!');
  };

  const handleDeleteSelections = () => {
    if (!confirm('Remover as contas selecionadas?')) {
      return;
    }
    const updated = { ...accountMappings };
    selectedCodes.forEach(code => {
      delete updated[code];
    });
    syncSettings({ accountMappings: updated });
    setSelectedCodes([]);
    toast.success('Contas selecionadas removidas com sucesso!');
  };

  const handleDuplicateSelections = () => {
    const updated = { ...accountMappings };
    let count = 0;
    selectedCodes.forEach(code => {
      const name = accountMappings[code];
      if (!name) return;
      const prefix = code.substring(0, 5);
      const parsed = parseAccountName(code, name);
      // Generate next sequence for this prefix
      const matchingCodes = Object.keys(updated)
        .filter(c => c.startsWith(prefix))
        .map(c => parseInt(c.substring(5), 10))
        .filter(num => !isNaN(num));
      const maxSeq = matchingCodes.length > 0 ? Math.max(...matchingCodes) : 0;
      const nextSeq = String(maxSeq + 1).padStart(3, '0');
      const newCode = `${prefix}${nextSeq}`;
      const newName = `${newCode} - ${parsed.subtype} - ${parsed.entity} (Copy)`;
      updated[newCode] = newName;
      count++;
    });
    if (count > 0) {
      syncSettings({ accountMappings: updated });
      setSelectedCodes([]);
      toast.success(`${count} accounts duplicated successfully!`);
    }
  };

  // Export COA to CSV
  const handleExportCSV = () => {
    const csvContent = [
      ['Code', 'Account Name'].join(','),
      ...allRows.map(row => {
        // Escape quotes
        const safeName = row.name.replace(/"/g, '""');
        return `"${row.code}","${safeName}"`;
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `chart_of_accounts_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Plano de Contas exportado com sucesso!');
  };

  // Import COA from CSV
  const handleImportCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const parsed = parseCSV(text);
        if (parsed.length < 2) {
          toast.error('Arquivo CSV vazio ou inválido.');
          return;
        }

        const headers = parsed[0].map(h => h.trim().toLowerCase());
        const codeIdx = headers.findIndex(h => h.includes('code') || h.includes('codigo') || h.includes('código'));
        const nameIdx = headers.findIndex(h => h.includes('name') || h.includes('nome') || h.includes('account') || h.includes('conta'));

        if (codeIdx === -1 || nameIdx === -1) {
          toast.error('Cabeçalhos inválidos. Certifique-se de que o CSV possui as colunas "Code" e "Account Name".');
          return;
        }

        const updated = { ...accountMappings };
        let importedCount = 0;

        for (let i = 1; i < parsed.length; i++) {
          const row = parsed[i];
          if (row.length < 2) continue;

          const rawCode = row[codeIdx]?.trim();
          const rawName = row[nameIdx]?.trim();

          if (rawCode && /^\d{8}$/.test(rawCode) && rawName) {
            updated[rawCode] = rawName;
            importedCount++;
          }
        }

        if (importedCount === 0) {
          toast.error('Nenhuma conta válida de 8 dígitos encontrada no CSV.');
          return;
        }

        syncSettings({ accountMappings: updated });
        toast.success(`${importedCount} contas importadas/mescladas com sucesso!`);
      } catch (err) {
        console.error(err);
        toast.error('Erro ao processar o arquivo CSV.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header bar */}
      <div className="border-b border-[#8b4513]/20 pb-2 mb-4 flex justify-between items-center flex-shrink-0">
        <div>
          <h3 className="title-font text-sm font-black text-[#4b2c20] uppercase">Chart of Accounts</h3>
          <p className="text-[9px] text-[#5d4037]/75 font-bold uppercase tracking-wider font-sans">Official Ledger Accounts</p>
        </div>
        <div className="flex items-center gap-2.5">
          <input
            type="text"
            placeholder="Search code or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-2 py-1 bg-white border border-[#8b4513]/30 rounded-lg text-[10px] font-bold text-[#4b2c20] placeholder-[#5d4037]/50 focus:outline-none focus:ring-1 focus:ring-[#8b4513] w-[150px]"
          />
          <div className="flex gap-1">
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="px-2.5 h-[28px] bg-[#8b4513] hover:bg-[#8b4513]/90 text-white rounded-lg hover:scale-[1.05] active:scale-95 transition-all shadow cursor-pointer flex items-center justify-center font-black text-[9px] uppercase tracking-wider gap-1"
            >
              ➕ New Account
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current.click()}
              className="px-2.5 h-[28px] bg-[#faf4e5]/90 border border-[#8b4513]/25 text-[#4b2c20] font-black text-[9px] uppercase tracking-wider rounded-lg shadow-sm hover:bg-[#8b4513]/10 active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
            >
              📥 Import
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
              onClick={handleExportCSV}
              className="px-2.5 h-[28px] bg-[#faf4e5]/90 border border-[#8b4513]/25 text-[#4b2c20] font-black text-[9px] uppercase tracking-wider rounded-lg shadow-sm hover:bg-[#8b4513]/10 active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
            >
              📤 Export
            </button>
          </div>
        </div>
      </div>

      {/* Filters Container */}
      <div className="grid grid-cols-4 gap-3 mb-4 p-3 bg-[#faf4e5]/40 border border-[#8b4513]/15 rounded-xl flex-shrink-0">
        <div>
          <label className="block text-[9px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">
            Type
          </label>
          <select
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value);
              setFilterSubtype('');
              setFilterCategory('');
              setCurrentPage(1);
            }}
            className="w-full bg-white border border-[#8b4513]/20 rounded-lg h-[28px] px-2 text-[10px] font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50"
          >
            <option value="">All Types</option>
            {uniqueTypes.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[9px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">
            Subtype
          </label>
          <select
            value={filterSubtype}
            onChange={(e) => {
              setFilterSubtype(e.target.value);
              setFilterCategory('');
              setCurrentPage(1);
            }}
            className="w-full bg-white border border-[#8b4513]/20 rounded-lg h-[28px] px-2 text-[10px] font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50"
          >
            <option value="">All Subtypes</option>
            {uniqueSubtypes.map(st => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[9px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">
            Category
          </label>
          <select
            value={filterCategory}
            onChange={(e) => {
              setFilterCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-white border border-[#8b4513]/20 rounded-lg h-[28px] px-2 text-[10px] font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50"
          >
            <option value="">All Categories</option>
            {uniqueCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[9px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">
            Entity
          </label>
          <select
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-white border border-[#8b4513]/20 rounded-lg h-[28px] px-2 text-[10px] font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50"
          >
            <option value="">All Entities</option>
            {Array.from(new Set(allRows.map(r => r.accountName).filter(Boolean))).sort().map(ent => (
              <option key={ent} value={ent}>{ent}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedCodes.length}
        label="Selected Accounts"
        onDelete={handleDeleteSelections}
        deleteLabel="Delete Selected"
      />

      {/* Main table container */}
      <div className="flex-1 overflow-y-auto border border-[#8b4513]/20 rounded-xl bg-[#faf4e5]/20 custom-scrollbar">
        <table className="w-full text-left border-collapse text-[10px] font-sans">
          <thead>
            <tr className="bg-[#8b4513]/10 border-b border-[#8b4513]/20 text-[#4b2c20] font-black uppercase tracking-wider title-font select-none">
              <th className="py-2 px-2 w-8 text-center">
                <input
                  type="checkbox"
                  checked={paginatedRows.length > 0 && paginatedRows.every(r => selectedCodes.includes(r.code))}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedCodes(paginatedRows.map(r => r.code));
                    } else {
                      setSelectedCodes([]);
                    }
                  }}
                  className="cursor-pointer rounded border-[#8b4513]/30 text-[#8b4513] focus:ring-[#8b4513]"
                />
              </th>
              <TableSortHeader
                label="Code"
                field="code"
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={handleSort}
                className="py-2 px-2 w-20 text-left"
              />
              <TableSortHeader
                label="Type"
                field="type"
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={handleSort}
                className="py-2 px-2 w-20 text-left"
              />
              <TableSortHeader
                label="Subtype"
                field="subtype"
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={handleSort}
                className="py-2 px-2 w-28 text-left"
              />
              <TableSortHeader
                label="Category"
                field="category"
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={handleSort}
                className="py-2 px-2 w-28 text-left"
              />
              <TableSortHeader
                label="Account Name"
                field="accountName"
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={handleSort}
                className="py-2 px-2 text-left"
              />
              <th className="py-2 px-2 w-20 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#8b4513]/10 text-stone-700 font-bold">
            {paginatedRows.map((row) => {
              const isChecked = selectedCodes.includes(row.code);
              const isEditing = editingCode === row.code;

              return (
                <tr key={row.code} className={`hover:bg-[#8b4513]/5 transition-colors ${isChecked ? 'bg-[#8b4513]/10' : ''}`}>
                  <td className="py-2 px-2 text-center">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCodes(prev => [...prev, row.code]);
                        } else {
                          setSelectedCodes(prev => prev.filter(c => c !== row.code));
                        }
                      }}
                      className="cursor-pointer rounded border-[#8b4513]/30 text-[#8b4513] focus:ring-[#8b4513]"
                    />
                  </td>
                  <td className="py-2 px-2 font-mono text-[#8b4513] font-bold text-[10.5px]">
                    {row.code}
                  </td>
                  <td className="py-2 px-2 text-[10px]">
                    {row.type}
                  </td>
                  <td className="py-2 px-2 text-[10px] text-[#8b4513]">
                    {row.subtype}
                  </td>
                  <td className="py-2 px-2 text-[10px] text-stone-600">
                    {row.category}
                  </td>
                  <td className="py-2 px-2 text-[10px]">
                    {row.accountName}
                  </td>
                  <td className="py-2 px-2 text-center">
                    <div className="flex justify-center items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(row)}
                        className="text-amber-700 hover:text-amber-900 font-black cursor-pointer hover:scale-110 active:scale-95 transition-all text-xs"
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteAccount(row.code)}
                        className="text-red-700 hover:text-red-900 font-black cursor-pointer hover:scale-110 active:scale-95 transition-all text-xs"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <TablePagination
            currentPage={safeCurrentPage}
            totalPages={totalPages}
            totalItems={sortedRows.length}
            onPageChange={setCurrentPage}
            manualPageInput={manualPageInput}
            onManualPageInputChange={setManualPageInput}
            colSpan={7}
          />
        </table>
      </div>

      {/* Add New Account Modal */}
      {isAddModalOpen && (
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Create Account"
          widthClass={STANDARD_MODAL_PROPS.widthClass}
          heightClass={STANDARD_MODAL_PROPS.heightClass}
        >
          <form onSubmit={handleAddAccount} className="p-4 flex flex-col gap-3.5 text-xs font-bold text-[#4b2c20] max-h-[75vh] overflow-y-auto custom-scrollbar">
            
            {/* Manual Mode Toggle */}
            <div className="flex items-center gap-2 pb-2 border-b border-[#8b4513]/10">
              <input
                type="checkbox"
                id="manualMode"
                checked={manualMode}
                onChange={(e) => setManualMode(e.target.checked)}
                className="cursor-pointer rounded border-[#8b4513]/30 text-[#8b4513] focus:ring-[#8b4513]"
              />
              <label htmlFor="manualMode" className="cursor-pointer select-none text-[10px] uppercase tracking-wider text-[#8b4513]">
                Define code and name manually (Custom Prefix)
              </label>
            </div>

            {!manualMode ? (
              <>
                {/* 1. Account Type (shows type, no action needed) */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase tracking-wider text-[#5d4037]/80">Account Type</label>
                  <div className="w-full p-2 bg-[#8b4513]/5 border border-[#8b4513]/20 rounded-lg text-xs text-[#4b2c20]/80 font-bold select-none">
                    {selectedType === '1' ? 'Asset (1xxxxxxx)' :
                     selectedType === '2' ? 'Liability (2xxxxxxx)' :
                     selectedType === '6' ? 'Expense (6xxxxxxx)' :
                     selectedType === '7' ? 'Income (7xxxxxxx)' : 'Other'}
                  </div>
                </div>

                {/* 2. Subtype Selection */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase tracking-wider text-[#5d4037]/80">Subtype</label>
                  <select
                    value={selectedSubtype}
                    onChange={(e) => handleSubtypeChange(e.target.value)}
                    className="w-full p-2 bg-white border border-[#8b4513]/30 rounded-lg text-xs text-[#4b2c20] font-bold focus:outline-none focus:ring-1 focus:ring-[#8b4513]"
                  >
                    {subtypesList.map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                    <option value="custom">+ Create New Subtype...</option>
                  </select>
                </div>

                {/* Custom Subtype Input */}
                {selectedSubtype === 'custom' && (
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase tracking-wider text-[#5d4037]/80">New Subtype Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Banks, Personal Debt, Entertainment"
                      value={customSubtype}
                      onChange={(e) => {
                        setCustomSubtype(e.target.value);
                        setIsCodeDirty(false);
                        setIsNameDirty(false);
                      }}
                      className="p-2 bg-white border border-[#8b4513]/30 rounded-lg text-xs text-[#4b2c20]"
                      required
                    />
                  </div>
                )}

                {/* 3. Category Selection */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase tracking-wider text-[#5d4037]/80">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="w-full p-2 bg-white border border-[#8b4513]/30 rounded-lg text-xs text-[#4b2c20] font-bold focus:outline-none focus:ring-1 focus:ring-[#8b4513]"
                  >
                    {categoriesList.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                    <option value="custom">+ Create New Category...</option>
                  </select>
                </div>

                {/* Custom Category Input */}
                {selectedCategory === 'custom' && (
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase tracking-wider text-[#5d4037]/80">New Category Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Savings account, Household, Tolls"
                      value={customCategory}
                      onChange={(e) => {
                        setCustomCategory(e.target.value);
                        setIsCodeDirty(false);
                        setIsNameDirty(false);
                      }}
                      className="p-2 bg-white border border-[#8b4513]/30 rounded-lg text-xs text-[#4b2c20]"
                      required
                    />
                  </div>
                )}

                {/* 4. Entities Selection */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase tracking-wider text-[#5d4037]/80">Entities</label>
                  <select
                    value={selectedEntity}
                    onChange={(e) => handleEntityChange(e.target.value)}
                    className="w-full p-2 bg-white border border-[#8b4513]/30 rounded-lg text-xs text-[#4b2c20] font-bold focus:outline-none focus:ring-1 focus:ring-[#8b4513]"
                  >
                    {entitiesList.map(ent => (
                      <option key={ent} value={ent}>{ent}</option>
                    ))}
                    <option value="custom">+ Create New Entity...</option>
                  </select>
                </div>

                {/* Custom Entity Input */}
                {selectedEntity === 'custom' && (
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase tracking-wider text-[#5d4037]/80">New Entity Name</label>
                    <input
                      type="text"
                      placeholder="e.g. CGD Bank, Oeiras Rent, Streaming"
                      value={customEntity}
                      onChange={(e) => {
                        setCustomEntity(e.target.value);
                        setIsCodeDirty(false);
                        setIsNameDirty(false);
                      }}
                      className="p-2 bg-white border border-[#8b4513]/30 rounded-lg text-xs text-[#4b2c20]"
                      required
                    />
                  </div>
                )}

                {/* 5. Generated Preview Callout */}
                <div className="p-3 bg-[#8b4513]/5 border border-[#8b4513]/25 rounded-lg flex flex-col gap-2 mt-1">
                  <div className="text-[10px] uppercase tracking-wider text-[#8b4513]/70 font-black">Generated Account Details</div>
                  
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] uppercase tracking-wider text-[#5d4037]/80">Account Code (8 digits)</span>
                    <input
                      type="text"
                      value={manualAccountCode}
                      onChange={(e) => {
                        setManualAccountCode(e.target.value.replace(/\D/g, '').slice(0, 8));
                        setIsCodeDirty(true);
                      }}
                      className="w-full p-2 bg-white border border-[#8b4513]/20 rounded-lg text-xs font-mono text-[#4b2c20] font-bold focus:outline-none focus:ring-1 focus:ring-[#8b4513]"
                    />
                  </div>

                  <div className="flex flex-col gap-1 mt-1">
                    <span className="text-[9px] uppercase tracking-wider text-[#5d4037]/80">Final Account Name</span>
                    <input
                      type="text"
                      value={manualAccountName}
                      onChange={(e) => {
                        setManualAccountName(e.target.value);
                        setIsNameDirty(true);
                      }}
                      className="w-full p-2 bg-white border border-[#8b4513]/20 rounded-lg text-xs font-mono text-[#4b2c20] font-bold focus:outline-none focus:ring-1 focus:ring-[#8b4513]"
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Manual Inputs */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-[#5d4037]/80">Account Code (Exactly 8 digits)</label>
                  <input
                    type="text"
                    placeholder="e.g. 10102005"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                    className="p-2 bg-white border border-[#8b4513]/30 rounded-lg text-xs text-[#4b2c20]"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-[#5d4037]/80">Account Name</label>
                  <input
                    type="text"
                    placeholder="e.g. 10102005 - Savings account - CGD Premium"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="p-2 bg-white border border-[#8b4513]/30 rounded-lg text-xs text-[#4b2c20]"
                    required
                  />
                </div>
              </>
            )}

            <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-[#8b4513]/15">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-3.5 py-1.5 bg-stone-200 hover:bg-stone-300 rounded-lg text-[10px] uppercase tracking-wider cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-[#8b4513] text-white hover:bg-[#8b4513]/90 rounded-lg text-[10px] uppercase tracking-wider cursor-pointer"
              >
                Add Account
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Account Modal */}
      {isEditModalOpen && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Edit Account"
          widthClass={STANDARD_MODAL_PROPS.widthClass}
          heightClass={STANDARD_MODAL_PROPS.heightClass}
        >
          <form onSubmit={handleSaveEdit} className="p-4 flex flex-col gap-3.5 text-xs font-bold text-[#4b2c20] max-h-[75vh] overflow-y-auto custom-scrollbar">
            
            {/* Account Code (Read Only) */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase tracking-wider text-[#5d4037]/80">Account Code</label>
              <div className="w-full p-2 bg-[#8b4513]/5 border border-[#8b4513]/20 rounded-lg text-xs font-mono text-[#4b2c20]/80 font-bold select-none">
                {editingCode}
              </div>
            </div>

            {/* Subtype Selection */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase tracking-wider text-[#5d4037]/80">Subtype</label>
              <select
                value={editSubtype}
                onChange={(e) => {
                  setEditSubtype(e.target.value);
                  setEditCategory('');
                }}
                className="w-full p-2 bg-white border border-[#8b4513]/30 rounded-lg text-xs text-[#4b2c20] font-bold focus:outline-none focus:ring-1 focus:ring-[#8b4513]"
              >
                {editSubtypesList.map(st => (
                  <option key={st} value={st}>{st}</option>
                ))}
                <option value="custom">+ Create New Subtype...</option>
              </select>
            </div>

            {/* Custom Subtype Input */}
            {editSubtype === 'custom' && (
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase tracking-wider text-[#5d4037]/80">New Subtype Name</label>
                <input
                  type="text"
                  placeholder="e.g. Banks, Personal Debt, Entertainment"
                  value={editCustomSubtype}
                  onChange={(e) => setEditCustomSubtype(e.target.value)}
                  className="p-2 bg-white border border-[#8b4513]/30 rounded-lg text-xs text-[#4b2c20]"
                  required
                />
              </div>
            )}

            {/* Category Selection */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase tracking-wider text-[#5d4037]/80">Category</label>
              <select
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                className="w-full p-2 bg-white border border-[#8b4513]/30 rounded-lg text-xs text-[#4b2c20] font-bold focus:outline-none focus:ring-1 focus:ring-[#8b4513]"
              >
                {editCategoriesList.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
                <option value="custom">+ Create New Category...</option>
              </select>
            </div>

            {/* Custom Category Input */}
            {editCategory === 'custom' && (
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase tracking-wider text-[#5d4037]/80">New Category Name</label>
                <input
                  type="text"
                  placeholder="e.g. Savings account, Household, Tolls"
                  value={editCustomCategory}
                  onChange={(e) => setEditCustomCategory(e.target.value)}
                  className="p-2 bg-white border border-[#8b4513]/30 rounded-lg text-xs text-[#4b2c20]"
                  required
                />
              </div>
            )}

            {/* Entity Input */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase tracking-wider text-[#5d4037]/80">Entity</label>
              <input
                type="text"
                placeholder="e.g. CGD Bank, Oeiras Rent, Streaming"
                value={editEntity}
                onChange={(e) => setEditEntity(e.target.value)}
                className="p-2 bg-white border border-[#8b4513]/30 rounded-lg text-xs text-[#4b2c20] font-bold focus:outline-none"
                required
              />
            </div>

            <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-[#8b4513]/15">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-3.5 py-1.5 bg-stone-200 hover:bg-stone-300 rounded-lg text-[10px] uppercase tracking-wider cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-[#8b4513] text-white hover:bg-[#8b4513]/90 rounded-lg text-[10px] uppercase tracking-wider cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
