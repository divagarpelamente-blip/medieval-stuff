import { useState } from 'react';
import { toast } from 'react-hot-toast';
import Modal from './Modal';
import { STANDARD_MODAL_PROPS } from '../constants/UI_UX';

const TYPE_NAMES = {
  '1': 'Assets',
  '2': 'Liabilities',
  '6': 'Expense',
  '7': 'Income'
};

const TYPE_COLORS = {
  '1': 'text-emerald-700 bg-emerald-50 border-emerald-250',
  '2': 'text-rose-700 bg-rose-50 border-rose-250',
  '6': 'text-amber-700 bg-amber-50 border-amber-250',
  '7': 'text-blue-700 bg-blue-50 border-blue-250'
};

export default function SubtypeCategoryEditor({
  t,
  subtypeToCategoryMap,
  subtypeTypes = {},
  syncSettings
}) {
  const [selectedSubtype, setSelectedSubtype] = useState(Object.keys(subtypeToCategoryMap)[0] || '');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newSubtypeType, setNewSubtypeType] = useState('1');
  const [newSubtypeName, setNewSubtypeName] = useState('');
  
  // State for adding a category to the selected subtype
  const [newCategoryName, setNewCategoryName] = useState('');

  // Dynamic Type-to-Subtype mappings constructed from subtypeTypes and current map keys
  const typeSubtypes = {
    '1': [],
    '2': [],
    '6': [],
    '7': []
  };

  Object.keys(subtypeToCategoryMap).forEach(st => {
    const types = subtypeTypes[st] || [];
    if (types.length > 0) {
      types.forEach(t => {
        if (typeSubtypes[t]) {
          typeSubtypes[t].push(st);
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
      if (typeSubtypes[t]) {
        typeSubtypes[t].push(st);
      }
    }
  });

  // Find type of a subtype
  const getSubtypeType = (subtypeName) => {
    const types = subtypeTypes[subtypeName];
    if (Array.isArray(types) && types.length > 0) {
      return types[0];
    }
    for (const [type, subtypes] of Object.entries(typeSubtypes)) {
      if (subtypes.includes(subtypeName)) return type;
    }
    return '6'; // Default fallback
  };

  const handleAddSubtype = (e) => {
    e.preventDefault();
    const cleanSubtype = newSubtypeName.trim();
    if (!cleanSubtype) return;

    if (subtypeToCategoryMap[cleanSubtype]) {
      toast.error('This Subtype already exists.');
      return;
    }

    // Add subtype to the store map
    const updatedMap = {
      ...subtypeToCategoryMap,
      [cleanSubtype]: []
    };

    // Update subtypeTypes mapping in store
    const currentTypes = subtypeTypes[cleanSubtype] || [];
    const updatedTypes = {
      ...subtypeTypes,
      [cleanSubtype]: currentTypes.includes(newSubtypeType) ? currentTypes : [...currentTypes, newSubtypeType]
    };

    syncSettings({ 
      subtypeToCategoryMap: updatedMap,
      subtypeTypes: updatedTypes 
    });
    setSelectedSubtype(cleanSubtype);
    setIsAddModalOpen(false);
    setNewSubtypeName('');
    toast.success('Subtype added successfully!');
  };

  const handleDeleteSubtype = (subtype) => {
    if (!confirm(`Are you sure you want to delete the subtype "${subtype}" and all of its category mappings?`)) {
      return;
    }
    const updatedMap = { ...subtypeToCategoryMap };
    delete updatedMap[subtype];

    const updatedTypes = { ...subtypeTypes };
    delete updatedTypes[subtype];

    syncSettings({ 
      subtypeToCategoryMap: updatedMap,
      subtypeTypes: updatedTypes 
    });
    
    // Select another subtype
    const remainingKeys = Object.keys(updatedMap);
    setSelectedSubtype(remainingKeys[0] || '');
    toast.success('Subtype removed successfully!');
  };

  const handleAddCategory = (e) => {
    e.preventDefault();
    const cleanCat = newCategoryName.trim();
    if (!cleanCat || !selectedSubtype) return;

    const currentCats = subtypeToCategoryMap[selectedSubtype] || [];
    if (currentCats.includes(cleanCat)) {
      toast.error('This category is already mapped to this subtype.');
      return;
    }

    const updatedMap = {
      ...subtypeToCategoryMap,
      [selectedSubtype]: [...currentCats, cleanCat]
    };

    syncSettings({ subtypeToCategoryMap: updatedMap });
    setNewCategoryName('');
    toast.success('Category added successfully!');
  };

  const handleRemoveCategory = (catToRemove) => {
    if (!selectedSubtype) return;
    const currentCats = subtypeToCategoryMap[selectedSubtype] || [];
    const updatedCats = currentCats.filter(c => c !== catToRemove);

    const updatedMap = {
      ...subtypeToCategoryMap,
      [selectedSubtype]: updatedCats
    };

    syncSettings({ subtypeToCategoryMap: updatedMap });
    toast.success('Category mapping removed.');
  };

  // Group subtypes by Type for listing
  const subtypesByType = { '1': [], '2': [], '6': [], '7': [] };
  Object.keys(subtypeToCategoryMap).forEach(st => {
    const t = getSubtypeType(st);
    subtypesByType[t].push(st);
  });

  return (
    <div className="flex gap-4 h-full overflow-hidden text-xs text-[#4b2c20] font-bold">
      
      {/* Subtypes Side List */}
      <div className="w-[35%] flex flex-col border-r border-[#8b4513]/25 pr-2 overflow-y-auto custom-scrollbar-subtle">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-[10px] font-black uppercase text-[#8b4513]/70 tracking-widest title-font">Subtypes</h4>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-2 py-1 bg-[#8b4513] text-white rounded text-[9px] uppercase tracking-wider cursor-pointer shadow hover:bg-[#8b4513]/90"
          >
            ➕ Add
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {Object.entries(subtypesByType).map(([typeDigit, list]) => {
            if (list.length === 0) return null;
            return (
              <div key={typeDigit} className="flex flex-col gap-1">
                <div className={`text-[8.5px] px-1.5 py-0.5 rounded border ${TYPE_COLORS[typeDigit]} font-black uppercase tracking-wider text-center`}>
                  {TYPE_NAMES[typeDigit]}
                </div>
                {list.sort().map((st) => {
                  const isSel = selectedSubtype === st;
                  return (
                    <div
                      key={st}
                      onClick={() => setSelectedSubtype(st)}
                      className={`flex justify-between items-center px-2 py-1.5 rounded-lg border text-[9.5px] cursor-pointer transition-all ${
                        isSel
                          ? 'bg-[#8b4513]/20 border-[#8b4513] text-[#4b2c20] shadow-inner'
                          : 'bg-[#faf4e5]/80 border-[#8b4513]/10 text-[#5d4037]/80 hover:bg-[#8b4513]/5'
                      }`}
                    >
                      <span className="truncate">{st}</span>
                      {isSel && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSubtype(st);
                          }}
                          className="text-red-755 hover:text-red-900 ml-1 font-sans text-[10px]"
                          title="Delete Subtype"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Subtype Categories Details */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedSubtype ? (
          <div className="flex flex-col h-full overflow-hidden">
            <div className="border-b border-[#8b4513]/20 pb-2 mb-3">
              <h3 className="text-sm font-black text-[#4b2c20] uppercase">{selectedSubtype}</h3>
              <p className="text-[9px] text-[#5d4037]/75 font-bold uppercase tracking-wider font-sans">
                Mapped Categories under {TYPE_NAMES[getSubtypeType(selectedSubtype)]}
              </p>
            </div>

            {/* Form to add a category */}
            <form onSubmit={handleAddCategory} className="flex gap-2 mb-3">
              <input
                type="text"
                placeholder="Enter Category name (e.g. Bank account)..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="flex-1 px-2.5 py-1.5 bg-white border border-[#8b4513]/30 rounded-lg text-[10.5px] font-bold text-[#4b2c20] placeholder-[#5d4037]/50 focus:outline-none focus:ring-1 focus:ring-[#8b4513]"
                required
              />
              <button
                type="submit"
                className="px-3 py-1 bg-[#8b4513] text-white hover:bg-[#8b4513]/90 rounded-lg text-[9px] font-black uppercase tracking-wider shadow cursor-pointer"
              >
                ➕ Add Category
              </button>
            </form>

            {/* Categories List */}
            <div className="flex-1 overflow-y-auto border border-[#8b4513]/20 rounded-xl bg-[#faf4e5]/20 p-3 custom-scrollbar">
              {subtypeToCategoryMap[selectedSubtype]?.length > 0 ? (
                <div className="flex flex-col gap-1.5">
                  {subtypeToCategoryMap[selectedSubtype].map(cat => (
                    <div
                      key={cat}
                      className="flex justify-between items-center bg-white border border-[#8b4513]/15 px-3 py-2 rounded-lg"
                    >
                      <span className="text-[10.5px] text-[#4b2c20] font-bold">{cat}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCategory(cat)}
                        className="text-red-755 hover:text-red-900 text-[10px] cursor-pointer"
                        title="Remove Category Mapping"
                      >
                        ❌ Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-stone-500 italic text-[10px]">
                  No Categories mapped to this subtype yet. Add one above!
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-stone-500 italic text-[10px]">
            Please select or create a Subtype to manage its categories.
          </div>
        )}
      </div>

      {/* Add Subtype Modal */}
      {isAddModalOpen && (
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Add New Subtype"
          widthClass={STANDARD_MODAL_PROPS.widthClass}
          heightClass={STANDARD_MODAL_PROPS.heightClass}
        >
          <form onSubmit={handleAddSubtype} className="p-4 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase tracking-wider text-[#5d4037]/80">Accounting Type</label>
              <select
                value={newSubtypeType}
                onChange={(e) => setNewSubtypeType(e.target.value)}
                className="w-full p-2 bg-white border border-[#8b4513]/30 rounded-lg text-xs text-[#4b2c20] font-bold focus:outline-none focus:ring-1 focus:ring-[#8b4513]"
              >
                <option value="1">Assets</option>
                <option value="2">Liabilities</option>
                <option value="6">Expense</option>
                <option value="7">Income</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase tracking-wider text-[#5d4037]/80">Subtype Name</label>
              <input
                type="text"
                placeholder="e.g. Banks, Personal Debt, Utilities"
                value={newSubtypeName}
                onChange={(e) => setNewSubtypeName(e.target.value)}
                className="p-2 bg-white border border-[#8b4513]/30 rounded-lg text-xs text-[#4b2c20]"
                required
              />
            </div>
            <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-[#8b4513]/10">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 bg-stone-200 hover:bg-stone-300 rounded-lg text-[9px] uppercase tracking-wider cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#8b4513] text-white hover:bg-[#8b4513]/90 rounded-lg text-[9px] uppercase tracking-wider cursor-pointer"
              >
                Create Subtype
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
