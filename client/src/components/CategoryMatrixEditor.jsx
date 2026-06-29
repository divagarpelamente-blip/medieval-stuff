/* eslint-disable react-hooks/set-state-in-effect */
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import Modal from './Modal';
import { STANDARD_MODAL_PROPS } from '../constants/UI_UX';

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

  const handleDeleteMatrixSelections = () => {
    const selectedKeys = new Set(selectedMatrixKeys);
    const updatedRows = getMatrixRows().filter(row => !selectedKeys.has(row.key));
    handleSaveMatrix(updatedRows);
    setSelectedMatrixKeys([]);
  };

  let rows = getMatrixRows();
  if (categoriesSortField) {
    rows = [...rows].sort((a, b) => {
      const valA = (a[categoriesSortField] || '').toLowerCase();
      const valB = (b[categoriesSortField] || '').toLowerCase();
      if (valA < valB) return categoriesSortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return categoriesSortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

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
                className="px-2.5 h-[28px] bg-red-755 hover:bg-red-800 text-white rounded-lg hover:scale-[1.05] active:scale-95 transition-all shadow cursor-pointer flex items-center justify-center font-black text-[9px] uppercase tracking-wider gap-1"
                title="Delete Selected"
              >
                🗑️ Delete ({selectedMatrixKeys.length})
              </button>
            )}
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
          <thead>
            <tr className="bg-[#8b4513]/10 border-b border-[#8b4513]/20 text-[#4b2c20] font-black uppercase tracking-wider title-font">
              <th className="py-2 px-2 w-8 text-center">
                <input
                  type="checkbox"
                  checked={selectedMatrixKeys.length === rows.length && rows.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedMatrixKeys(rows.map(r => r.key));
                    } else {
                      setSelectedMatrixKeys([]);
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
              <th className="py-2 px-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#8b4513]/10 text-stone-700 font-bold">
            {rows.map((row) => {
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
                      className="text-blue-700 hover:text-blue-900 border border-transparent hover:border-blue-200 hover:bg-blue-50 px-1.5 py-0.5 rounded transition-all text-[9px] font-black cursor-pointer"
                    >
                      ✏️ Edit
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
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
