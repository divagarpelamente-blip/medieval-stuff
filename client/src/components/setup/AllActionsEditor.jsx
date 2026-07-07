import React, { useState, useMemo, useEffect } from 'react';
import { useKingdomStore } from '../../store/useKingdomStore';
import TableSortHeader from '../common/TableSortHeader';
import TablePagination from '../common/TablePagination';
import BulkActionBar from '../common/BulkActionBar';

export default function AllActionsEditor({
  t,
  templates = [],
  selectedQaNames = [],
  setSelectedQaNames,
  onEditQuickAction,
  handleDeleteQuickAction,
  qaFileInputRef,
  importQuickActionsCSV,
  handleExportAllActionsCSV
}) {
  const classOptions = useKingdomStore((state) => state.classOptions) || [];

  // Sort states
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');

  // Filters
  const [filterType, setFilterType] = useState('');
  const [filterSubtype, setFilterSubtype] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterEntity, setFilterEntity] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [manualPageInput, setManualPageInput] = useState('1');

  useEffect(() => {
    setManualPageInput(String(currentPage));
  }, [currentPage]);

  // Handle Sort
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Dynamic filter lists
  const dynamicSubtypes = useMemo(() => {
    return Array.from(new Set(
      templates
        .filter(tpl => !filterType || tpl.data?.transaction_type === filterType)
        .map(tpl => tpl.data?.transaction_subtype)
        .filter(Boolean)
    )).sort();
  }, [templates, filterType]);

  const dynamicCategories = useMemo(() => {
    return Array.from(new Set(
      templates
        .filter(tpl => {
          if (filterType && tpl.data?.transaction_type !== filterType) return false;
          if (filterSubtype && tpl.data?.transaction_subtype !== filterSubtype) return false;
          return true;
        })
        .map(tpl => tpl.data?.transaction_category)
        .filter(Boolean)
    )).sort();
  }, [templates, filterType, filterSubtype]);

  const dynamicEntities = useMemo(() => {
    return Array.from(new Set(
      templates
        .filter(tpl => {
          if (filterType && tpl.data?.transaction_type !== filterType) return false;
          if (filterSubtype && tpl.data?.transaction_subtype !== filterSubtype) return false;
          if (filterCategory && tpl.data?.transaction_category !== filterCategory) return false;
          return true;
        })
        .map(tpl => tpl.data?.entity)
        .filter(Boolean)
    )).sort();
  }, [templates, filterType, filterSubtype, filterCategory]);

  // Filtered List
  const filteredList = useMemo(() => {
    return templates.filter(tpl => {
      if (filterType && tpl.data?.transaction_type !== filterType) return false;
      if (filterSubtype && tpl.data?.transaction_subtype !== filterSubtype) return false;
      if (filterCategory && tpl.data?.transaction_category !== filterCategory) return false;
      if (filterEntity && tpl.data?.entity !== filterEntity) return false;
      return true;
    });
  }, [templates, filterType, filterSubtype, filterCategory, filterEntity]);

  // Sorted List
  const sortedList = useMemo(() => {
    const sorted = [...filteredList];
    if (sortField) {
      sorted.sort((a, b) => {
        let valA = '';
        let valB = '';
        if (sortField === 'name') {
          valA = (a.name || '').toLowerCase();
          valB = (b.name || '').toLowerCase();
        } else if (sortField === 'type') {
          valA = `${a.data?.transaction_type || ''} • ${a.data?.transaction_subtype || ''}`.toLowerCase();
          valB = `${b.data?.transaction_type || ''} • ${b.data?.transaction_subtype || ''}`.toLowerCase();
        } else if (sortField === 'entity') {
          valA = (a.data?.entity || '').toLowerCase();
          valB = (b.data?.entity || '').toLowerCase();
        }

        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sorted;
  }, [filteredList, sortField, sortDirection]);

  // Pagination logic
  const itemsPerPage = 10;
  const totalPages = Math.ceil(sortedList.length / itemsPerPage) || 1;
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);
  const paginatedList = useMemo(() => {
    return sortedList.slice((safeCurrentPage - 1) * itemsPerPage, safeCurrentPage * itemsPerPage);
  }, [sortedList, safeCurrentPage]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header Buttons */}
      <div className="border-b border-[#8b4513]/20 pb-2 mb-4 flex justify-between items-center flex-shrink-0">
        <div>
          <h3 className="title-font text-sm font-black text-[#4b2c20] uppercase">Quick Action Templates</h3>
          <p className="text-[9px] text-[#5d4037]/75 font-bold uppercase tracking-wider font-sans">
            {t.official_ledger_editor}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
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
      </div>

      {/* Filter Dropdowns */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 p-3 bg-[#faf4e5]/40 border border-[#8b4513]/15 rounded-xl flex-shrink-0">
        <div>
          <label className="block text-[9px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">
            Type
          </label>
          <select
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value);
              setCurrentPage(1);
              setFilterSubtype('');
              setFilterCategory('');
              setFilterEntity('');
            }}
            className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg h-[28px] px-2 text-[10px] font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50"
          >
            <option value="">All Types</option>
            {classOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
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
              setCurrentPage(1);
              setFilterCategory('');
              setFilterEntity('');
            }}
            className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg h-[28px] px-2 text-[10px] font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50"
          >
            <option value="">All Subtypes</option>
            {dynamicSubtypes.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
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
              setFilterEntity('');
            }}
            className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg h-[28px] px-2 text-[10px] font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50"
          >
            <option value="">All Categories</option>
            {dynamicCategories.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[9px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">
            Entity
          </label>
          <select
            value={filterEntity}
            onChange={(e) => {
              setFilterEntity(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg h-[28px] px-2 text-[10px] font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50"
          >
            <option value="">All Entities</option>
            {dynamicEntities.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedQaNames.length}
        label="Selected Actions"
        onDelete={handleDeleteQuickAction}
        deleteLabel="Delete Templates"
      />

      {/* List / Table */}
      <div className="flex-1 overflow-y-auto border border-[#8b4513]/20 rounded-xl bg-[#faf4e5]/20 custom-scrollbar">
        {paginatedList.length > 0 ? (
          <table className="w-full text-left border-collapse text-[9.5px] font-sans">
            <thead className="sticky top-0 bg-[#faf4e5] z-10 border-b border-[#8b4513]/25 shadow-sm">
              <tr className="text-[#4b2c20] font-black uppercase tracking-wider title-font">
                <th className="py-1.5 px-2 w-8 text-center">
                  <input
                    type="checkbox"
                    checked={paginatedList.length > 0 && paginatedList.every(tpl => selectedQaNames.includes(tpl.name))}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedQaNames(prev => Array.from(new Set([...prev, ...paginatedList.map(tpl => tpl.name)])));
                      } else {
                        setSelectedQaNames(prev => prev.filter(name => !paginatedList.some(tpl => tpl.name === name)));
                      }
                    }}
                    className="cursor-pointer rounded border-[#8b4513]/30 text-[#8b4513] focus:ring-[#8b4513]"
                  />
                </th>
                <TableSortHeader
                  label="Action"
                  field="name"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
                <TableSortHeader
                  label="Type/Subtype"
                  field="type"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
                <TableSortHeader
                  label="Entity"
                  field="entity"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
                <th className="py-1.5 px-2 text-right">Edit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#8b4513]/10 text-stone-700 font-bold">
              {paginatedList.map((tpl) => {
                const isChecked = selectedQaNames.includes(tpl.name);
                return (
                  <tr key={tpl.name} className={`hover:bg-[#8b4513]/5 transition-colors ${isChecked ? 'bg-[#8b4513]/10' : ''}`}>
                    <td className="py-1 px-2 text-center">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedQaNames(prev => [...prev, tpl.name]);
                          } else {
                            setSelectedQaNames(prev => prev.filter(n => n !== tpl.name));
                          }
                        }}
                        className="cursor-pointer rounded border-[#8b4513]/30 text-[#8b4513] focus:ring-[#8b4513]"
                      />
                    </td>
                    <td className="py-1 px-2 font-bold text-[#4b2c20] text-[9.5px]">
                      {t(`tpl_${tpl.name.toLowerCase().replace(/\s+/g, '_')}`, tpl.name)}
                    </td>
                    <td className="py-1 px-2 text-stone-500 font-medium text-[9px]">
                      {tpl.data?.transaction_type} • {tpl.data?.transaction_subtype}
                    </td>
                    <td className="py-1 px-2 text-stone-500 font-medium text-[9px]">{tpl.data?.entity}</td>
                    <td className="py-1 px-2 text-right">
                      <button
                        type="button"
                        onClick={() => onEditQuickAction(tpl)}
                        className="text-blue-700 hover:text-blue-900 font-bold px-1.5 py-0.5 rounded border border-transparent hover:border-blue-200 hover:bg-blue-50 transition-all cursor-pointer text-[10px]"
                        title="Edit Quick Action"
                      >
                        ✏️
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <TablePagination
              currentPage={safeCurrentPage}
              totalPages={totalPages}
              totalItems={sortedList.length}
              onPageChange={setCurrentPage}
              manualPageInput={manualPageInput}
              onManualPageInputChange={setManualPageInput}
              colSpan={5}
            />
          </table>
        ) : (
          <div className="flex items-center justify-center p-8 text-[#5d4037]/50 text-xs font-bold uppercase">
            No templates found
          </div>
        )}
      </div>
    </div>
  );
}
