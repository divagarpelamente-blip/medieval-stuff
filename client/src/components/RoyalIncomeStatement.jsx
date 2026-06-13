import React from 'react';

export default function RoyalIncomeStatement({ incomeStatement, t, formatNumberCompact }) {
  const { revenues = [], expenses = [], totalRevenue = 0, totalExpense = 0, netAccruedIncome = 0, formattedNet = '0 / g' } = incomeStatement || {};

  return (
    <div className="bg-[#faf4e5]/60 border border-[#8b4513]/25 rounded-xl p-4 shadow-sm flex flex-col space-y-4">
      {/* Title */}
      <h4 className="title-font text-[12px] font-black text-[#4b2c20] uppercase tracking-wider border-b border-[#8b4513]/10 pb-2 flex justify-center items-center text-center">
        <span>📜 {t('royal_income_statement', 'Royal Income Statement (Profit & Loss)')}</span>
      </h4>

      {/* Grid containing Revenues and Expenses columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Revenues Column */}
        <div className="space-y-2">
          <h5 className="title-font text-[10px] font-black text-[#8b4513]/90 uppercase tracking-widest border-b border-[#8b4513]/5 pb-1">
            {t('revenues', 'Revenues (Accrued Inflows)')}
          </h5>
          <div className="space-y-1.5 max-h-[180px] overflow-y-auto custom-scrollbar-subtle pr-1">
            {revenues.length > 0 ? (
              revenues.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-[10px] py-1 border-b border-[#8b4513]/5">
                  <span className="font-bold text-[#5d4037]">🪙 {item.name}</span>
                  <span className="font-mono font-bold text-emerald-700">{item.formatted}</span>
                </div>
              ))
            ) : (
              <div className="py-4 text-center text-[9px] text-[#5d4037]/50 italic font-serif">
                {t('no_revenues', 'No accrued revenues registered.')}
              </div>
            )}
          </div>
          <div className="flex justify-between items-center text-[10px] font-bold text-[#4b2c20] pt-2 border-t border-[#8b4513]/10">
            <span>{t('total_revenues', 'Total Revenues')}</span>
            <span className="font-mono text-emerald-700">{formatNumberCompact(totalRevenue)}</span>
          </div>
        </div>

        {/* Expenses Column */}
        <div className="space-y-2">
          <h5 className="title-font text-[10px] font-black text-[#8b4513]/90 uppercase tracking-widest border-b border-[#8b4513]/5 pb-1">
            {t('expenses', 'Expenses (Accrued Outflows)')}
          </h5>
          <div className="space-y-1.5 max-h-[180px] overflow-y-auto custom-scrollbar-subtle pr-1">
            {expenses.length > 0 ? (
              expenses.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-[10px] py-1 border-b border-[#8b4513]/5">
                  <span className="font-bold text-[#5d4037]">🛡️ {item.name}</span>
                  <span className="font-mono font-bold text-rose-700">{item.formatted}</span>
                </div>
              ))
            ) : (
              <div className="py-4 text-center text-[9px] text-[#5d4037]/50 italic font-serif">
                {t('no_expenses', 'No accrued expenses registered.')}
              </div>
            )}
          </div>
          <div className="flex justify-between items-center text-[10px] font-bold text-[#4b2c20] pt-2 border-t border-[#8b4513]/10">
            <span>{t('total_expenses', 'Total Expenses')}</span>
            <span className="font-mono text-rose-700">{formatNumberCompact(-totalExpense)}</span>
          </div>
        </div>

      </div>

      {/* Net Summary Footer */}
      <div className="bg-[#f4e4bc]/50 border border-[#8b4513]/15 rounded-lg p-2.5 flex justify-between items-center font-serif text-[11px] font-black uppercase text-[#4b2c20] tracking-wide mt-2">
        <span>{t('net_accrued_income', 'Net Accrued Income')}</span>
        <span className={`font-mono text-xs ${netAccruedIncome >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
          {formattedNet}
        </span>
      </div>
    </div>
  );
}
