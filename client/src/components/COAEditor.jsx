import { useState, useRef } from 'react';
import { toast } from 'react-hot-toast';
import Modal from './Modal';
import { STANDARD_MODAL_PROPS } from '../constants/UI_UX';
import { parseCSV } from '../utils/csvHelpers';

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
  const [editingName, setEditingName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Add Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');

  // Wizard States
  const [selectedType, setSelectedType] = useState('1');
  const [selectedSubtype, setSelectedSubtype] = useState('');
  const [customSubtype, setCustomSubtype] = useState('');
  const [selectedEntity, setSelectedEntity] = useState('');
  const [customEntity, setCustomEntity] = useState('');
  const [manualMode, setManualMode] = useState(false);

  // Sort States
  const [sortField, setSortField] = useState('code');
  const [sortDirection, setSortDirection] = useState('asc');

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
    const q = searchQuery.toLowerCase();
    return row.code.includes(q) || 
           row.name.toLowerCase().includes(q) || 
           row.type.toLowerCase().includes(q) || 
           row.subtype.toLowerCase().includes(q) || 
           row.category.toLowerCase().includes(q) || 
           row.accountName.toLowerCase().includes(q);
  });

  // Sorting
  const sortedRows = [...filteredRows].sort((a, b) => {
    const valA = a[sortField] || '';
    const valB = b[sortField] || '';
    if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
    if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

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
  const subtypesList = Array.from(subtypesByType[selectedType] || []).sort();
  const entitiesList = Array.from(entities).sort();

  // Determine Subtype prefix & name
  let subtypeName = '';
  let prefix = '';
  if (selectedSubtype === 'custom') {
    subtypeName = customSubtype.trim();
    prefix = getNextUnusedPrefix(selectedType);
  } else {
    subtypeName = selectedSubtype;
    prefix = subtypePrefixes[selectedSubtype] || `${selectedType}0101`;
  }

  // Determine Entity name
  const entityName = selectedEntity === 'custom' ? customEntity.trim() : selectedEntity;

  // Generate sequence and final code/name
  let generatedSeq = '001';
  if (selectedSubtype !== 'custom' && selectedSubtype) {
    generatedSeq = getNextSequence(prefix);
  }
  const generatedCode = `${prefix}${generatedSeq}`;
  const generatedName = subtypeName && entityName 
    ? `${generatedCode} - ${subtypeName} - ${entityName}` 
    : '';

  const handleOpenAddModal = () => {
    const initialType = '1';
    setSelectedType(initialType);
    const availableSubtypes = Array.from(subtypesByType[initialType] || []).sort();
    const firstSubtype = availableSubtypes[0] || 'custom';
    setSelectedSubtype(firstSubtype);
    setSelectedEntity(Array.from(entities).sort()[0] || 'custom');
    setCustomSubtype('');
    setCustomEntity('');
    setManualMode(false);
    setNewCode('');
    setNewName('');
    setIsAddModalOpen(true);
  };

  const handleTypeChange = (type) => {
    setSelectedType(type);
    const availableSubtypes = Array.from(subtypesByType[type] || []).sort();
    const firstSubtype = availableSubtypes[0] || 'custom';
    setSelectedSubtype(firstSubtype);
  };

  const handleAddAccount = (e) => {
    e.preventDefault();
    let cleanCode = '';
    let cleanName = '';

    if (manualMode) {
      cleanCode = newCode.trim();
      cleanName = newName.trim();
    } else {
      cleanCode = generatedCode;
      cleanName = generatedName;
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

    const updated = {
      ...accountMappings,
      [cleanCode]: cleanName
    };

    syncSettings({ accountMappings: updated });
    toast.success('Conta adicionada com sucesso!');
    setIsAddModalOpen(false);
  };

  const handleStartEdit = (row) => {
    setEditingCode(row.code);
    setEditingName(row.accountName);
  };

  const handleSaveEdit = (code) => {
    const cleanEntity = editingName.trim();
    if (!cleanEntity) {
      toast.error('O nome da conta não pode ser vazio.');
      return;
    }

    const row = allRows.find(r => r.code === code);
    const newFullName = `${code} - ${row.category} - ${cleanEntity}`;

    const updated = {
      ...accountMappings,
      [code]: newFullName
    };

    syncSettings({ accountMappings: updated });
    toast.success('Conta atualizada com sucesso!');
    setEditingCode(null);
    setEditingName('');
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
    if (!confirm(`Remover as ${selectedCodes.length} contas selecionadas?`)) {
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

  // Export COA to CSV
  const handleExportCSV = () => {
    const csvContent = [
      ['Code', 'Account Name'].join(','),
      ...sortedRows.map(row => {
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
            {selectedCodes.length > 0 && (
              <button
                type="button"
                onClick={handleDeleteSelections}
                className="px-2.5 h-[28px] bg-red-755 hover:bg-red-800 text-white rounded-lg hover:scale-[1.05] active:scale-95 transition-all shadow cursor-pointer flex items-center justify-center font-black text-[9px] uppercase tracking-wider gap-1"
              >
                🗑️ Delete ({selectedCodes.length})
              </button>
            )}
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

      {/* Main table container */}
      <div className="flex-1 overflow-y-auto border border-[#8b4513]/20 rounded-xl bg-[#faf4e5]/20 custom-scrollbar">
        <table className="w-full text-left border-collapse text-[10px] font-sans">
          <thead>
            <tr className="bg-[#8b4513]/10 border-b border-[#8b4513]/20 text-[#4b2c20] font-black uppercase tracking-wider title-font select-none">
              <th className="py-2 px-2 w-8 text-center">
                <input
                  type="checkbox"
                  checked={selectedCodes.length === sortedRows.length && sortedRows.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedCodes(sortedRows.map(r => r.code));
                    } else {
                      setSelectedCodes([]);
                    }
                  }}
                  className="cursor-pointer rounded border-[#8b4513]/30 text-[#8b4513] focus:ring-[#8b4513]"
                />
              </th>
              <th className="py-2 px-2 cursor-pointer w-20 hover:bg-[#8b4513]/5" onClick={() => handleSort('code')}>
                Code {sortField === 'code' && (sortDirection === 'asc' ? '▲' : '▼')}
              </th>
              <th className="py-2 px-2 cursor-pointer w-20 hover:bg-[#8b4513]/5" onClick={() => handleSort('type')}>
                Type {sortField === 'type' && (sortDirection === 'asc' ? '▲' : '▼')}
              </th>
              <th className="py-2 px-2 cursor-pointer w-28 hover:bg-[#8b4513]/5" onClick={() => handleSort('subtype')}>
                Subtype {sortField === 'subtype' && (sortDirection === 'asc' ? '▲' : '▼')}
              </th>
              <th className="py-2 px-2 cursor-pointer w-28 hover:bg-[#8b4513]/5" onClick={() => handleSort('category')}>
                Category {sortField === 'category' && (sortDirection === 'asc' ? '▲' : '▼')}
              </th>
              <th className="py-2 px-2 cursor-pointer hover:bg-[#8b4513]/5" onClick={() => handleSort('accountName')}>
                Account Name {sortField === 'accountName' && (sortDirection === 'asc' ? '▲' : '▼')}
              </th>
              <th className="py-2 px-2 w-20 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#8b4513]/10 text-stone-700 font-bold">
            {sortedRows.map((row) => {
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
                    {isEditing ? (
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="bg-white border border-[#8b4513]/30 rounded px-1.5 py-0.5 w-full text-[10px] font-bold text-[#4b2c20]"
                      />
                    ) : (
                      row.accountName
                    )}
                  </td>
                  <td className="py-2 px-2 text-center">
                    <div className="flex justify-center items-center gap-1.5">
                      {isEditing ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(row.code)}
                            className="text-emerald-700 hover:text-emerald-900 font-black cursor-pointer hover:scale-110 active:scale-95 transition-all text-xs"
                            title="Save"
                          >
                            💾
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingCode(null)}
                            className="text-stone-500 hover:text-stone-700 font-black cursor-pointer hover:scale-110 active:scale-95 transition-all text-xs"
                            title="Cancel"
                          >
                            ❌
                          </button>
                        </>
                      ) : (
                        <>
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
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
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
                {/* 1. Account Type Selection */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase tracking-wider text-[#5d4037]/80">Account Type</label>
                  <select
                    value={selectedType}
                    onChange={(e) => handleTypeChange(e.target.value)}
                    className="w-full p-2 bg-white border border-[#8b4513]/30 rounded-lg text-xs text-[#4b2c20] font-bold focus:outline-none focus:ring-1 focus:ring-[#8b4513]"
                  >
                    <option value="1">Asset (1xxxxxxx)</option>
                    <option value="2">Liability (2xxxxxxx)</option>
                    <option value="6">Expense (6xxxxxxx)</option>
                    <option value="7">Income (7xxxxxxx)</option>
                  </select>
                </div>

                {/* 2. Subtype Group Selection */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase tracking-wider text-[#5d4037]/80">Subtype Group</label>
                  <select
                    value={selectedSubtype}
                    onChange={(e) => setSelectedSubtype(e.target.value)}
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
                      placeholder="e.g. Health Insurance, Bank accounts, Food"
                      value={customSubtype}
                      onChange={(e) => setCustomSubtype(e.target.value)}
                      className="p-2 bg-white border border-[#8b4513]/30 rounded-lg text-xs text-[#4b2c20]"
                      required
                    />
                  </div>
                )}

                {/* 3. Entity / Category Selection */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase tracking-wider text-[#5d4037]/80">Entity / Category Details</label>
                  <select
                    value={selectedEntity}
                    onChange={(e) => setSelectedEntity(e.target.value)}
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
                      placeholder="e.g. Millennium BCP, Mae, Oeiras Utensils"
                      value={customEntity}
                      onChange={(e) => setCustomEntity(e.target.value)}
                      className="p-2 bg-white border border-[#8b4513]/30 rounded-lg text-xs text-[#4b2c20]"
                      required
                    />
                  </div>
                )}

                {/* 4. Generated Preview Callout */}
                <div className="p-3 bg-[#8b4513]/5 border border-[#8b4513]/25 rounded-lg flex flex-col gap-1.5 mt-1">
                  <div className="text-[10px] uppercase tracking-wider text-[#8b4513]/70 font-black">Generated Account Details</div>
                  
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-[#5d4037]/80">Code Prefix:</span>
                    <span className="font-mono text-[#8b4513] font-black bg-[#8b4513]/10 px-1 rounded">{prefix}</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-[#5d4037]/80">Sequence Suffix:</span>
                    <span className="font-mono text-[#8b4513] font-black bg-[#8b4513]/10 px-1 rounded">{generatedSeq}</span>
                  </div>

                  <div className="border-t border-[#8b4513]/10 my-1"></div>

                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] uppercase tracking-wider text-[#5d4037]/65">Final Account Name</span>
                    <span className="font-mono text-[11.5px] text-[#4b2c20] font-black select-all break-all bg-white border border-[#8b4513]/15 p-1.5 rounded">
                      {generatedName || "(Please fill subtype and entity details)"}
                    </span>
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
    </div>
  );
}
