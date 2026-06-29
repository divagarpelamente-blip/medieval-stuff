/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import Modal from './Modal';
import { STANDARD_MODAL_PROPS } from '../constants/UI_UX';
import { useKingdomStore } from '../store/useKingdomStore';

export default function CategoryMatrixEditor({
  t,
  subClassOptions,
  categoryOptions,
  entityOptions,
  entityMappings,
  subtypeToCategoryMap,
  syncSettings,
  getMatrixRows,
  handleSaveMatrix,
  settingsFileInputRef,
  importSettingsCSV,
  exportSettingsCSV
}) {
  const subtypeTypes = useKingdomStore(state => state.subtypeTypes) || {};
  const classOptions = useKingdomStore(state => state.classOptions) || [];
  const accountMappings = useKingdomStore(state => state.accountMappings) || {};

  const [selectedMatrixKeys, setSelectedMatrixKeys] = useState([]);
  const [isAddMatrixModalOpen, setIsAddMatrixModalOpen] = useState(false);
  const [newMatrixSubtype, setNewMatrixSubtype] = useState('');
  const [newMatrixCategory, setNewMatrixCategory] = useState('');
  const [newMatrixEntity, setNewMatrixEntity] = useState('');
  const [customSubtypeInput, setCustomSubtypeInput] = useState('');
  const [customCategoryInput, setCustomCategoryInput] = useState('');

  // Edit Modal States
  const [isEditMatrixModalOpen, setIsEditMatrixModalOpen] = useState(false);
  const [editMatrixRowKey, setEditMatrixRowKey] = useState(null);
  const [editMatrixSubtype, setEditMatrixSubtype] = useState('');
  const [editMatrixCategory, setEditMatrixCategory] = useState('');
  const [editMatrixEntity, setEditMatrixEntity] = useState('');
  const [editCustomSubtypeInput, setEditCustomSubtypeInput] = useState('');
  const [editCustomCategoryInput, setEditCustomCategoryInput] = useState('');

  // Sort states
  const [categoriesSortField, setCategoriesSortField] = useState(null);
  const [categoriesSortDirection, setCategoriesSortDirection] = useState('asc');

  // Warning filter state
  const [showIncompleteActiveOnly, setShowIncompleteActiveOnly] = useState(false);

  // Filter states
  const [filterMatrixType, setFilterMatrixType] = useState('');
  const [filterMatrixSubtype, setFilterMatrixSubtype] = useState('');
  const [filterMatrixCategory, setFilterMatrixCategory] = useState('');
  const [filterMatrixEntity, setFilterMatrixEntity] = useState('');

  // Pagination states
  const [matrixCurrentPage, setMatrixCurrentPage] = useState(1);
  const [manualMatrixPageInput, setManualMatrixPageInput] = useState('1');

  const handleDeleteMatrixSelections = () => {
    const selectedKeys = new Set(selectedMatrixKeys);
    const updatedRows = getMatrixRows().filter(row => !selectedKeys.has(row.key));
    handleSaveMatrix(updatedRows);
    setSelectedMatrixKeys([]);
  };

  const handleAutoReconcile = () => {
    const currentRows = getMatrixRows();
    let reconciledCount = 0;
    
    // Parse the entire COA to easily map entities to derived subtypes/categories
    const coaMatches = {};
    Object.entries(accountMappings).forEach(([code, fullName]) => {
      let remaining = fullName;
      if (remaining.startsWith(code)) {
        remaining = remaining.substring(code.length).replace(/^\s*-\s*/, '');
      }
      const parts = remaining.split(/\s*-\s*/);
      const category = parts[0] || '';
      const entity = parts.slice(1).join(' - ') || '';
      
      if (entity && category) {
        // Derive subtype by searching subtypeToCategoryMap
        let subtype = '';
        for (const [sub, cats] of Object.entries(subtypeToCategoryMap || {})) {
          if (cats && cats.includes(category)) {
            subtype = sub;
            break;
          }
        }
        
        if (subtype) {
          const key = entity.trim().toLowerCase();
          if (!coaMatches[key]) {
            coaMatches[key] = [];
          }
          coaMatches[key].push({ subtype, category });
        }
      }
    });

    const updatedRows = currentRows.map(row => {
      const isRowIncomplete = !row.subtype || !row.category;
      if (isRowIncomplete && row.entity) {
        const key = row.entity.trim().toLowerCase();
        const matches = coaMatches[key] || [];
        
        if (matches.length > 0) {
          // Reconcile using the matching derived Subtype and Category
          const { subtype, category } = matches[0];
          reconciledCount++;
          return { ...row, subtype, category };
        }
      }
      return row;
    });

    if (reconciledCount > 0) {
      handleSaveMatrix(updatedRows);
      toast.success(`Successfully reconciled ${reconciledCount} row(s) automatically!`);
    } else {
      toast.error("No incomplete rows could be automatically reconciled from COA.");
    }
  };

  const allRows = getMatrixRows();

  // Filter logic
  const filteredRows = useMemo(() => {
    return allRows.filter((row) => {
      if (showIncompleteActiveOnly) {
        const isIncomplete = !row.subtype || !row.category || !row.entity;
        if (!isIncomplete) return false;
      }
      const types = subtypeTypes[row.subtype] || [];
      if (filterMatrixType && !types.includes(filterMatrixType)) return false;
      if (filterMatrixSubtype && row.subtype !== filterMatrixSubtype) return false;
      if (filterMatrixCategory && row.category !== filterMatrixCategory) return false;
      if (filterMatrixEntity && row.entity !== filterMatrixEntity) return false;
      return true;
    });
  }, [allRows, filterMatrixType, filterMatrixSubtype, filterMatrixCategory, filterMatrixEntity, subtypeTypes, showIncompleteActiveOnly]);

  // Dynamic filter options
  const dynamicSubtypes = useMemo(() => {
    return Array.from(new Set(
      allRows
        .filter(row => {
          const types = subtypeTypes[row.subtype] || [];
          return !filterMatrixType || types.includes(filterMatrixType);
        })
        .map(row => row.subtype)
        .filter(Boolean)
    )).sort();
  }, [allRows, filterMatrixType, subtypeTypes]);

  const dynamicCategories = useMemo(() => {
    return Array.from(new Set(
      allRows
        .filter(row => {
          const types = subtypeTypes[row.subtype] || [];
          if (filterMatrixType && !types.includes(filterMatrixType)) return false;
          if (filterMatrixSubtype && row.subtype !== filterMatrixSubtype) return false;
          return true;
        })
        .map(row => row.category)
        .filter(Boolean)
    )).sort();
  }, [allRows, filterMatrixType, filterMatrixSubtype, subtypeTypes]);

  const dynamicEntities = useMemo(() => {
    return Array.from(new Set(
      allRows
        .filter(row => {
          const types = subtypeTypes[row.subtype] || [];
          if (filterMatrixType && !types.includes(filterMatrixType)) return false;
          if (filterMatrixSubtype && row.subtype !== filterMatrixSubtype) return false;
          if (filterMatrixCategory && row.category !== filterMatrixCategory) return false;
          return true;
        })
        .map(row => row.entity)
        .filter(Boolean)
    )).sort();
  }, [allRows, filterMatrixType, filterMatrixSubtype, filterMatrixCategory, subtypeTypes]);

  // Sort logic
  const sortedRows = useMemo(() => {
    let list = [...filteredRows];
    if (categoriesSortField) {
      list.sort((a, b) => {
        const valA = (a[categoriesSortField] || '').toLowerCase();
        const valB = (b[categoriesSortField] || '').toLowerCase();
        if (valA < valB) return categoriesSortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return categoriesSortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return list;
  }, [filteredRows, categoriesSortField, categoriesSortDirection]);

  // Pagination logic
  const itemsPerPage = 10;
  const totalPages = Math.ceil(sortedRows.length / itemsPerPage) || 1;
  const safeCurrentPage = Math.min(Math.max(matrixCurrentPage, 1), totalPages);
  const paginatedRows = useMemo(() => {
    return sortedRows.slice((safeCurrentPage - 1) * itemsPerPage, safeCurrentPage * itemsPerPage);
  }, [sortedRows, safeCurrentPage]);


  const incompleteEntities = useMemo(() => {
    return new Set(
      allRows
        .filter(r => !r.subtype || !r.category || !r.entity)
        .map(r => r.entity)
        .filter(Boolean)
    );
  }, [allRows]);

  const matchedCOAAccounts = useMemo(() => {
    if (!showIncompleteActiveOnly) return [];
    
    const list = [];
    Object.entries(accountMappings).forEach(([code, fullName]) => {
      let remaining = fullName;
      if (remaining.startsWith(code)) {
        remaining = remaining.substring(code.length).replace(/^\s*-\s*/, '');
      }
      const parts = remaining.split(/\s*-\s*/);
      const category = parts[0] || '';
      const entity = parts.slice(1).join(' - ') || '';
      
      if (entity && incompleteEntities.has(entity)) {
        // Derive Type from code
        const firstDigit = code.charAt(0);
        let type = 'Unknown';
        if (firstDigit === '1') type = 'Assets';
        else if (firstDigit === '2') type = 'Liabilities';
        else if (firstDigit === '6') type = 'Expense';
        else if (firstDigit === '7') type = 'Income';
        
        // Derive Subtype by searching subtypeToCategoryMap
        let subtype = '';
        for (const [sub, cats] of Object.entries(subtypeToCategoryMap || {})) {
          if (cats && cats.includes(category)) {
            subtype = sub;
            break;
          }
        }
        
        list.push({
          code,
          fullName,
          category,
          entity,
          type,
          subtype
        });
      }
    });
    
    // Sort by entity name
    list.sort((a, b) => a.entity.localeCompare(b.entity));
    return list;
  }, [accountMappings, incompleteEntities, showIncompleteActiveOnly, subtypeToCategoryMap]);

  const modalMatchedCOA = useMemo(() => {
    if (!editMatrixEntity) return [];
    const list = [];
    const targetEntity = editMatrixEntity.trim().toLowerCase();
    
    Object.entries(accountMappings).forEach(([code, fullName]) => {
      let remaining = fullName;
      if (remaining.startsWith(code)) {
        remaining = remaining.substring(code.length).replace(/^\s*-\s*/, '');
      }
      const parts = remaining.split(/\s*-\s*/);
      const category = parts[0] || '';
      const entity = parts.slice(1).join(' - ') || '';
      
      if (entity.trim().toLowerCase() === targetEntity) {
        // Derive Type from code
        const firstDigit = code.charAt(0);
        let type = 'Unknown';
        if (firstDigit === '1') type = 'Assets';
        else if (firstDigit === '2') type = 'Liabilities';
        else if (firstDigit === '6') type = 'Expense';
        else if (firstDigit === '7') type = 'Income';
        
        // Derive Subtype by searching subtypeToCategoryMap
        let subtype = '';
        for (const [sub, cats] of Object.entries(subtypeToCategoryMap || {})) {
          if (cats && cats.includes(category)) {
            subtype = sub;
            break;
          }
        }
        
        list.push({
          code,
          fullName,
          category,
          entity,
          type,
          subtype
        });
      }
    });
    return list;
  }, [accountMappings, editMatrixEntity, subtypeToCategoryMap]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Action Buttons Header */}
      <div className="border-b border-[#8b4513]/20 pb-2 mb-4 flex justify-between items-center flex-shrink-0">
        <div>
          <h3 className="title-font text-sm font-black text-[#4b2c20] uppercase">Categories Matrix</h3>
          <p className="text-[9px] text-[#5d4037]/75 font-bold uppercase tracking-wider font-sans">{t.official_ledger_editor}</p>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="flex gap-1">
            {selectedMatrixKeys.length > 0 && (
              <button
                type="button"
                onClick={handleDeleteMatrixSelections}
                className="px-2.5 h-[28px] bg-red-755 hover:bg-red-850 text-white rounded-lg hover:scale-[1.05] active:scale-95 transition-all shadow cursor-pointer flex items-center justify-center font-black text-[9px] uppercase tracking-wider gap-1"
                title="Delete Selected"
              >
                🗑️ Delete ({selectedMatrixKeys.length})
              </button>
            )}
            <button
              type="button"
              onClick={handleAutoReconcile}
              className="px-2.5 h-[28px] bg-amber-600 hover:bg-amber-700 text-white rounded-lg hover:scale-[1.05] active:scale-95 transition-all shadow cursor-pointer flex items-center justify-center font-black text-[9px] uppercase tracking-wider gap-1 mr-1"
              title="Automatically Reconcile Incomplete Rows from COA"
            >
              ⚡ Reconcile
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
          </div>
        </div>
      </div>

      {/* Dynamic Filtering Row */}
      <div className="grid grid-cols-12 gap-3 mb-4 p-3 bg-[#faf4e5]/40 border border-[#8b4513]/15 rounded-xl flex-shrink-0 items-end">
        <div className="col-span-6 sm:col-span-3">
          <label className="block text-[9px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">
            Type
          </label>
          <select
            value={filterMatrixType}
            onChange={(e) => {
              setFilterMatrixType(e.target.value);
              setMatrixCurrentPage(1);
              setFilterMatrixSubtype('');
              setFilterMatrixCategory('');
              setFilterMatrixEntity('');
            }}
            className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg h-[28px] px-2 text-[10px] font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50 cursor-pointer"
          >
            <option value="">All Types</option>
            {classOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        <div className="col-span-6 sm:col-span-3">
          <label className="block text-[9px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">
            Subtype
          </label>
          <select
            value={filterMatrixSubtype}
            onChange={(e) => {
              setFilterMatrixSubtype(e.target.value);
              setMatrixCurrentPage(1);
              setFilterMatrixCategory('');
              setFilterMatrixEntity('');
            }}
            className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg h-[28px] px-2 text-[10px] font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50 cursor-pointer"
          >
            <option value="">All Subtypes</option>
            {dynamicSubtypes.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        <div className="col-span-6 sm:col-span-3">
          <label className="block text-[9px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">
            Category
          </label>
          <select
            value={filterMatrixCategory}
            onChange={(e) => {
              setFilterMatrixCategory(e.target.value);
              setMatrixCurrentPage(1);
              setFilterMatrixEntity('');
            }}
            className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg h-[28px] px-2 text-[10px] font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50 cursor-pointer"
          >
            <option value="">All Categories</option>
            {dynamicCategories.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        <div className="col-span-6 sm:col-span-2">
          <label className="block text-[9px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">
            Entity
          </label>
          <select
            value={filterMatrixEntity}
            onChange={(e) => {
              setFilterMatrixEntity(e.target.value);
              setMatrixCurrentPage(1);
            }}
            className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg h-[28px] px-2 text-[10px] font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50 cursor-pointer"
          >
            <option value="">All Entities</option>
            {dynamicEntities.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        <div className="col-span-12 sm:col-span-1 flex gap-1 h-[28px] items-center justify-start mb-[1px]">
          <button
            type="button"
            onClick={() => {
              setFilterMatrixType('');
              setFilterMatrixSubtype('');
              setFilterMatrixCategory('');
              setFilterMatrixEntity('');
              setMatrixCurrentPage(1);
              setShowIncompleteActiveOnly(false);
              toast.success("Filters cleared!");
            }}
            className="w-7 h-[26px] bg-[#faf4e5]/90 border border-[#8b4513]/25 hover:bg-[#8b4513]/10 text-stone-700 text-xs flex items-center justify-center rounded-lg cursor-pointer transition-all shadow-sm"
            title="Clear All Filters"
          >
            🧹
          </button>
          <button
            type="button"
            onClick={() => {
              setShowIncompleteActiveOnly(!showIncompleteActiveOnly);
              setMatrixCurrentPage(1);
            }}
            className={`w-7 h-[26px] border text-xs flex items-center justify-center rounded-lg cursor-pointer transition-all shadow-sm ${
              showIncompleteActiveOnly
                ? 'bg-[#8b4513] text-[#ffd700] border-[#d4af37]/40'
                : 'bg-[#faf4e5]/90 border-[#8b4513]/25 hover:bg-[#8b4513]/10 text-stone-700'
            }`}
            title="Show Incomplete Rows & Uncategorized COA"
          >
            ⚠️
          </button>
        </div>
      </div>

      {/* Selected KPI Label */}
      {selectedMatrixKeys.length > 0 && (
        <div className="flex items-center justify-between bg-[#8b4513]/10 border border-[#8b4513]/20 rounded-lg p-2 mb-2 animate-in fade-in slide-in-from-top-1 duration-150 flex-shrink-0">
          <span className="text-[9px] font-black uppercase text-[#4b2c20] tracking-wider pl-1">
            Selected: <span className="font-bold text-amber-900">{selectedMatrixKeys.length}</span>
          </span>
        </div>
      )}

      {/* Matrix Table */}
      <div className="flex-1 overflow-y-auto border border-[#8b4513]/20 rounded-xl bg-[#faf4e5]/20 custom-scrollbar">
        <table className="w-full text-left border-collapse text-[10px] font-sans">
          <thead className="sticky top-0 bg-[#faf4e5] z-10 border-b border-[#8b4513]/25 shadow-sm">
            <tr className="text-[#4b2c20] font-black uppercase tracking-wider title-font">
              <th className="py-2 px-2 w-8 text-center">
                <input
                  type="checkbox"
                  checked={paginatedRows.length > 0 && paginatedRows.every(r => selectedMatrixKeys.includes(r.key))}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedMatrixKeys(prev => Array.from(new Set([...prev, ...paginatedRows.map(r => r.key)])));
                    } else {
                      setSelectedMatrixKeys(prev => prev.filter(k => !paginatedRows.some(r => r.key === k)));
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
              <th className="py-2 px-2 text-right">Edit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#8b4513]/10 text-stone-700 font-bold">
            {paginatedRows.map((row) => {
              const isChecked = selectedMatrixKeys.includes(row.key);
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
                    {row.subtype || <span className="text-[#5d4037]/40 italic font-medium">None</span>}
                  </td>
                  <td className="py-2 px-2">
                    {row.category || <span className="text-[#5d4037]/40 italic font-medium">None</span>}
                  </td>
                  <td className="py-2 px-2">
                    {row.entity || <span className="text-[#5d4037]/40 italic font-medium">None</span>}
                  </td>
                  <td className="py-2 px-2 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setEditMatrixRowKey(row.key);
                        setEditMatrixSubtype(row.subtype || '');
                        setEditMatrixCategory(row.category || '');
                        setEditMatrixEntity(row.entity || '');
                        setEditCustomSubtypeInput('');
                        setEditCustomCategoryInput('');
                        setIsEditMatrixModalOpen(true);
                      }}
                      className="text-blue-700 hover:text-blue-900 border border-transparent hover:border-blue-200 hover:bg-blue-50 px-1.5 py-0.5 rounded transition-all text-[10px] font-bold cursor-pointer"
                      title="Edit Mapping"
                    >
                      ✏️
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="sticky bottom-0 bg-[#faf4e5] z-10 border-t border-[#8b4513]/25 shadow-sm">
            <tr>
              <td colSpan={5} className="py-1.5 px-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-[#4b2c20] text-[9.5px] font-black uppercase font-sans">
                  <div>
                    Page {safeCurrentPage} of {totalPages} ({sortedRows.length} total)
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={safeCurrentPage === 1}
                      onClick={() => setMatrixCurrentPage(safeCurrentPage - 1)}
                      className="px-2 py-0.5 bg-[#8b4513] text-white rounded disabled:opacity-40 hover:scale-105 active:scale-95 transition-all cursor-pointer font-bold text-[9px] uppercase tracking-wider"
                    >
                      ◀ Prev
                    </button>
                    <button
                      type="button"
                      disabled={safeCurrentPage === totalPages}
                      onClick={() => setMatrixCurrentPage(safeCurrentPage + 1)}
                      className="px-2 py-0.5 bg-[#8b4513] text-white rounded disabled:opacity-40 hover:scale-105 active:scale-95 transition-all cursor-pointer font-bold text-[9px] uppercase tracking-wider"
                    >
                      Next ▶
                    </button>
                    <div className="flex items-center gap-1 ml-2">
                      <span>Go to:</span>
                      <input
                        type="number"
                        min={1}
                        max={totalPages}
                        value={manualMatrixPageInput}
                        onChange={(e) => {
                          setManualMatrixPageInput(e.target.value);
                          const p = parseInt(e.target.value, 10);
                          if (p >= 1 && p <= totalPages) {
                            setMatrixCurrentPage(p);
                          }
                        }}
                        className="w-10 px-1 py-0.5 bg-white border border-[#8b4513]/30 rounded text-center text-[10px] font-bold text-[#4b2c20] focus:outline-none focus:ring-1 focus:ring-[#8b4513]"
                      />
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>


      {/* Add Row Modal */}
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
              entity,
              key: `k_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            };
            handleSaveMatrix([...currentRows, newRow]);
            setIsAddMatrixModalOpen(false);
          }}
          className="space-y-4 font-sans"
        >
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">
              Subtype
            </label>
            <select
              value={newMatrixSubtype}
              onChange={(e) => {
                setNewMatrixSubtype(e.target.value);
                setNewMatrixCategory('');
              }}
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
              {(newMatrixSubtype && subtypeToCategoryMap[newMatrixSubtype]
                ? (subtypeToCategoryMap[newMatrixSubtype] || [])
                : categoryOptions
              ).map((cat) => (
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

      {/* Edit Row Modal */}
      <Modal
        isOpen={isEditMatrixModalOpen}
        onClose={() => setIsEditMatrixModalOpen(false)}
        title="Edit Category/Entity Mapping"
        {...STANDARD_MODAL_PROPS}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const subtype = editMatrixSubtype === 'NEW_SUBTYPE' ? editCustomSubtypeInput.trim() : editMatrixSubtype;
            const category = editMatrixCategory === 'NEW_CATEGORY' ? editCustomCategoryInput.trim() : editMatrixCategory;
            const entity = editMatrixEntity.trim();

            if (!subtype && !category && !entity) {
              toast.error("At least one field must be filled!");
              return;
            }

            const updatedRows = getMatrixRows().map(row => {
              if (row.key === editMatrixRowKey) {
                return { ...row, subtype, category, entity };
              }
              return row;
            });

            handleSaveMatrix(updatedRows);
            setIsEditMatrixModalOpen(false);
            toast.success("Mapping updated successfully!");
          }}
          className="space-y-4 font-sans"
        >
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">
              Subtype
            </label>
            <select
              value={editMatrixSubtype}
              onChange={(e) => {
                setEditMatrixSubtype(e.target.value);
                setEditMatrixCategory('');
              }}
              className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/25 rounded-lg h-[38px] px-2 text-xs font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50"
            >
              <option value="">-- Select Subtype --</option>
              {subClassOptions.map((sub) => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
              <option value="NEW_SUBTYPE">+ Add New Subtype...</option>
            </select>
            {editMatrixSubtype === 'NEW_SUBTYPE' && (
              <input
                type="text"
                placeholder="Enter New Subtype"
                value={editCustomSubtypeInput}
                onChange={(e) => setEditCustomSubtypeInput(e.target.value)}
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
              value={editMatrixCategory}
              onChange={(e) => setEditMatrixCategory(e.target.value)}
              className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/25 rounded-lg h-[38px] px-2 text-xs font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50"
            >
              <option value="">-- Select Category --</option>
              {(editMatrixSubtype && subtypeToCategoryMap[editMatrixSubtype]
                ? (subtypeToCategoryMap[editMatrixSubtype] || [])
                : categoryOptions
              ).map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
              <option value="NEW_CATEGORY">+ Add New Category...</option>
            </select>
            {editMatrixCategory === 'NEW_CATEGORY' && (
              <input
                type="text"
                placeholder="Enter New Category"
                value={editCustomCategoryInput}
                onChange={(e) => setEditCustomCategoryInput(e.target.value)}
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
              value={editMatrixEntity}
              onChange={(e) => setEditMatrixEntity(e.target.value)}
              className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/25 rounded-lg h-[38px] px-3 text-xs font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50"
            />
          </div>

          {editMatrixEntity && (
            <div className="flex flex-col border border-[#8b4513]/20 rounded-xl bg-[#faf4e5]/20 overflow-hidden mt-2">
              <div className="bg-[#8b4513]/10 border-b border-[#8b4513]/20 p-2 flex items-center justify-between">
                <span className="text-[9px] font-black uppercase text-[#4b2c20] tracking-wider">
                  Related COA Accounts ({modalMatchedCOA.length})
                </span>
              </div>
              <div className="max-h-[160px] overflow-y-auto custom-scrollbar">
                <table className="w-full text-left border-collapse text-[10px] font-sans">
                  <thead className="sticky top-0 bg-[#faf4e5] z-10 border-b border-[#8b4513]/25 shadow-sm">
                    <tr className="text-[#4b2c20] font-black uppercase tracking-wider title-font">
                      <th className="py-1.5 px-2">Type</th>
                      <th className="py-1.5 px-2">Subtype</th>
                      <th className="py-1.5 px-2">Category</th>
                      <th className="py-1.5 px-2">Entity</th>
                      <th className="py-1.5 px-2">Account Name</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#8b4513]/10 text-stone-700 font-bold">
                    {modalMatchedCOA.length > 0 ? (
                      modalMatchedCOA.map((account, idx) => (
                        <tr key={idx} className="hover:bg-[#8b4513]/5 transition-colors">
                          <td className="py-1 px-2">{account.type}</td>
                          <td className="py-1 px-2">{account.subtype || <span className="text-stone-400 italic">None</span>}</td>
                          <td className="py-1 px-2">{account.category || <span className="text-stone-400 italic">None</span>}</td>
                          <td className="py-1 px-2 text-[#8b4513]">{account.entity}</td>
                          <td className="py-1 px-2 font-medium text-stone-600">{account.fullName}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-4 text-center text-stone-400 italic">
                          No matching accounts found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2.5 bg-[#8b4513] text-white font-black text-[10px] uppercase tracking-wider rounded-xl hover:scale-[1.01] active:scale-99 transition-all shadow border border-[#d4af37]/25 cursor-pointer"
          >
            Save Changes
          </button>
        </form>
      </Modal>
    </div>
  );
}
