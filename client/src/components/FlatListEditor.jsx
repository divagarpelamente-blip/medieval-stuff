/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import Modal from './Modal';
import { STANDARD_MODAL_PROPS } from '../constants/UI_UX';
import TableSortHeader from './shared/TableSortHeader';
import TablePagination from './shared/TablePagination';
import BulkActionBar from './shared/BulkActionBar';

export default function FlatListEditor({
  t,
  title,
  subtitle = 'OFFICIAL LEDGER EDITOR',
  list = [],
  onAdd,
  onEdit,
  onDelete,
  settingsFileInputRef,
  importSettingsCSV,
  exportSettingsCSV
}) {
  const [selectedItems, setSelectedItems] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newValue, setNewValue] = useState('');

  // Edit Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editOldValue, setEditOldValue] = useState('');
  const [editNewValue, setEditNewValue] = useState('');

  // Sort states
  const [sortDirection, setSortDirection] = useState('asc');

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [manualPageInput, setManualPageInput] = useState('1');

  const handleDeleteSelections = () => {
    selectedItems.forEach(item => {
      onDelete(item);
    });
    setSelectedItems([]);
    toast.success("Selected items deleted successfully!");
  };

  // Filter logic
  const filteredList = useMemo(() => {
    return list.filter(item => 
      item.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [list, searchQuery]);

  // Sort logic
  const sortedList = useMemo(() => {
    let sorted = [...filteredList];
    sorted.sort((a, b) => {
      return sortDirection === 'asc' ? a.localeCompare(b) : b.localeCompare(a);
    });
    return sorted;
  }, [filteredList, sortDirection]);

  // Pagination logic
  const itemsPerPage = 10;
  const totalPages = Math.ceil(sortedList.length / itemsPerPage) || 1;
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);
  const paginatedList = useMemo(() => {
    return sortedList.slice((safeCurrentPage - 1) * itemsPerPage, safeCurrentPage * itemsPerPage);
  }, [sortedList, safeCurrentPage]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Action Buttons Header */}
      <div className="border-b border-[#8b4513]/20 pb-2 mb-4 flex justify-between items-center flex-shrink-0">
        <div>
          <h3 className="title-font text-sm font-black text-[#4b2c20] uppercase">{title}</h3>
          <p className="text-[9px] text-[#5d4037]/75 font-bold uppercase tracking-wider font-sans">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="flex gap-1">

            <button
              type="button"
              onClick={() => {
                setNewValue('');
                setIsAddModalOpen(true);
              }}
              className="px-2.5 h-[28px] bg-[#8b4513] hover:bg-[#8b4513]/90 text-white rounded-lg hover:scale-[1.05] active:scale-95 transition-all shadow cursor-pointer flex items-center justify-center font-black text-[9px] uppercase tracking-wider gap-1"
              title={`Add New ${title}`}
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
      <div className="mb-4 p-3 bg-[#faf4e5]/40 border border-[#8b4513]/15 rounded-xl flex-shrink-0">
        <label className="block text-[9px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">
          Search / Filter
        </label>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          placeholder={`Search ${title}...`}
          className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg h-[28px] px-3 text-xs font-bold text-[#4b2c20] placeholder-[#5d4037]/45 focus:outline-none focus:border-[#8b4513]/50"
        />
      </div>

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedItems.length}
        label="Selected"
        onDelete={handleDeleteSelections}
        deleteLabel="Delete Selected"
      />

      {/* Table */}
      <div className="flex-1 overflow-y-auto border border-[#8b4513]/20 rounded-xl bg-[#faf4e5]/20 custom-scrollbar">
        <table className="w-full text-left border-collapse text-[10px] font-sans">
          <thead className="sticky top-0 bg-[#faf4e5] z-10 border-b border-[#8b4513]/25 shadow-sm">
            <tr className="text-[#4b2c20] font-black uppercase tracking-wider title-font">
              <th className="py-2 px-3 w-8 text-center">
                <input
                  type="checkbox"
                  checked={paginatedList.length > 0 && paginatedList.every(item => selectedItems.includes(item))}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedItems(prev => Array.from(new Set([...prev, ...paginatedList])));
                    } else {
                      setSelectedItems(prev => prev.filter(item => !paginatedList.includes(item)));
                    }
                  }}
                  className="cursor-pointer rounded border-[#8b4513]/30 text-[#8b4513] focus:ring-[#8b4513]"
                />
              </th>
              <TableSortHeader
                label="Value"
                field="value"
                sortField="value"
                sortDirection={sortDirection}
                onSort={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
                className="py-2 px-3 text-left"
              />
              <th className="py-2 px-3 text-right">Edit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#8b4513]/10 text-stone-700 font-bold">
            {paginatedList.map((item) => {
              const isChecked = selectedItems.includes(item);
              return (
                <tr key={item} className={`hover:bg-[#8b4513]/5 transition-colors ${isChecked ? 'bg-[#8b4513]/10' : ''}`}>
                  <td className="py-2 px-3 text-center">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedItems(prev => [...prev, item]);
                        } else {
                          setSelectedItems(prev => prev.filter(k => k !== item));
                        }
                      }}
                      className="cursor-pointer rounded border-[#8b4513]/30 text-[#8b4513] focus:ring-[#8b4513]"
                    />
                  </td>
                  <td className="py-2 px-3 font-bold text-[#4b2c20]">{item}</td>
                  <td className="py-2 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setEditOldValue(item);
                        setEditNewValue(item);
                        setIsEditModalOpen(true);
                      }}
                      className="text-blue-700 hover:text-blue-900 border border-transparent hover:border-blue-200 hover:bg-blue-50 px-1.5 py-0.5 rounded transition-all text-[10px] font-bold cursor-pointer"
                      title="Edit Item"
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
            colSpan={3}
          />
        </table>
      </div>

      {/* Add Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={`Add New ${title}`}
        {...STANDARD_MODAL_PROPS}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const val = newValue.trim();
            if (!val) {
              toast.error("Value cannot be empty!");
              return;
            }
            if (list.includes(val)) {
              toast.error("Value already exists!");
              return;
            }
            onAdd(val);
            setIsAddModalOpen(false);
            toast.success("Added successfully!");
          }}
          className="space-y-4 font-sans"
        >
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">
              {title} Value
            </label>
            <input
              type="text"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder={`Enter new ${title.toLowerCase()} value...`}
              required
              className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/25 rounded-lg h-[38px] px-3 text-xs font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2.5 bg-[#8b4513] text-white font-black text-[10px] uppercase tracking-wider rounded-xl hover:scale-[1.01] active:scale-99 transition-all shadow border border-[#d4af37]/25 cursor-pointer"
          >
            Add Entry
          </button>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit ${title}`}
        {...STANDARD_MODAL_PROPS}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const val = editNewValue.trim();
            if (!val) {
              toast.error("Value cannot be empty!");
              return;
            }
            if (val !== editOldValue && list.includes(val)) {
              toast.error("Value already exists!");
              return;
            }
            onEdit(editOldValue, val);
            setIsEditModalOpen(false);
            toast.success("Updated successfully!");
          }}
          className="space-y-4 font-sans"
        >
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">
              Current Value
            </label>
            <input
              type="text"
              disabled
              value={editOldValue}
              className="w-full bg-[#faf4e5]/40 border border-[#8b4513]/15 rounded-lg h-[38px] px-3 text-xs font-bold text-[#4b2c20]/60 focus:outline-none cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">
              New Value
            </label>
            <input
              type="text"
              value={editNewValue}
              onChange={(e) => setEditNewValue(e.target.value)}
              placeholder="Enter new value..."
              required
              className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/25 rounded-lg h-[38px] px-3 text-xs font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50"
            />
          </div>
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
