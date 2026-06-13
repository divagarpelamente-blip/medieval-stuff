import React from 'react';

export default function OpenPayablesByCategoryChart({ openPayablesByCategory = [], t, formatNumberCompact }) {
  const maxVal = openPayablesByCategory.length > 0 
    ? Math.max(...openPayablesByCategory.map(c => c.amount), 1) 
    : 1;

  return (
    <div className="bg-[#faf4e5]/60 border border-[#8b4513]/25 rounded-xl p-4 shadow-sm flex flex-col h-full">
      <div className="flex justify-center items-center border-b border-[#8b4513]/20 pb-1.5 mb-3 flex-shrink-0 text-center">
        <h3 className="title-font text-[11px] font-black text-[#4b2c20] uppercase tracking-wider">
          {t('chart_open_payables_by_category', 'Open Payables by Category')}
        </h3>
      </div>

      <div className="space-y-3 overflow-y-auto pr-1 custom-scrollbar-subtle flex-grow mt-2">
        {openPayablesByCategory.length > 0 ? (
          openPayablesByCategory.map((cat) => {
            const pctWidth = (cat.amount / maxVal) * 100;
            return (
              <div key={cat.name} className="space-y-1">
                <div className="flex justify-between font-bold text-[#4b2c20] text-[10px]">
                  <span>🏷️ {cat.name}</span>
                  <span className="font-mono text-rose-700">{formatNumberCompact(cat.amount)}</span>
                </div>
                <div className="w-full bg-[#faf4e5]/80 h-2 rounded-full overflow-hidden border border-[#8b4513]/10">
                  <div className="h-full bg-rose-500 rounded-full transition-all duration-500 ease-out" style={{ width: `${pctWidth}%` }} />
                </div>
              </div>
            );
          })
        ) : (
          <div className="h-full flex items-center justify-center">
            <p className="text-center text-[10px] text-[#5d4037]/60 italic font-serif">
              {t('no_expenses_registered', 'No expenses registered.')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
