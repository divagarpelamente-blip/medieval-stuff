import React from 'react';

export default function TablePagination({
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
  manualPageInput,
  onManualPageInputChange,
  colSpan
}) {
  return (
    <tfoot className="sticky bottom-0 bg-[#faf4e5] z-10 border-t border-[#8b4513]/25 shadow-sm">
      <tr>
        <td colSpan={colSpan} className="py-1.5 px-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-[#4b2c20] text-[9.5px] font-black uppercase font-sans">
            <div>
              Page {currentPage} of {totalPages} ({totalItems} total)
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => onPageChange(currentPage - 1)}
                className="px-2 py-0.5 bg-[#8b4513] text-white rounded disabled:opacity-40 hover:scale-105 active:scale-95 transition-all cursor-pointer font-bold text-[9px] uppercase tracking-wider"
              >
                ◀ Prev
              </button>
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => onPageChange(currentPage + 1)}
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
                  value={manualPageInput}
                  onChange={(e) => {
                    onManualPageInputChange(e.target.value);
                    const p = parseInt(e.target.value, 10);
                    if (p >= 1 && p <= totalPages) {
                      onPageChange(p);
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
  );
}
