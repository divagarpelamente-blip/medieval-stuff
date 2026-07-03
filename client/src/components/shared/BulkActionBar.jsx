import React from 'react';

export default function BulkActionBar({
  selectedCount,
  label = "Selected",
  onDelete,
  deleteLabel = "Delete Selected",
  className = ""
}) {
  if (selectedCount === 0) return null;
  return (
    <div className={`flex items-center justify-between bg-[#8b4513]/10 border border-[#8b4513]/20 rounded-lg p-2 mb-2 animate-in fade-in slide-in-from-top-1 duration-150 flex-shrink-0 ${className}`}>
      <span className="text-[9px] font-black uppercase text-[#4b2c20] tracking-wider pl-1">
        {label}: <span className="font-bold text-amber-900">{selectedCount}</span>
      </span>
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="px-2 py-0.5 bg-red-700 hover:bg-red-800 text-white rounded text-[9px] font-bold uppercase tracking-wider cursor-pointer active:scale-95 hover:scale-[1.05] transition-all flex items-center gap-1"
        >
          🗑️ {deleteLabel}
        </button>
      )}
    </div>
  );
}
