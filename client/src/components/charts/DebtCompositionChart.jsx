import React, { useState, useMemo } from 'react';

export default function DebtCompositionChart({ debtByType = [], t }) {
  const { data, totalDebt } = useMemo(() => {
    let total = 0;
    const mappedData = debtByType
      .map(row => {
        total += row.amount;
        return { name: row.name, amount: row.amount };
      })
      .sort((a, b) => b.amount - a.amount);

    return { data: mappedData, totalDebt: total };
  }, [debtByType]);

  const renderChart = () => {
    if (data.length === 0) {
      return (
        <div className="h-full flex items-center justify-center">
          <p className="text-center text-[10px] text-[#5d4037]/60 italic font-serif">
            {t('no_commercial_record', 'No commercial record.')}
          </p>
        </div>
      );
    }

    const R = 50;
    const Circumference = 2 * Math.PI * R;
    const colors = ['#8b4513', '#a21caf', '#b45309', '#be185d', '#b91c1c', '#7c2d12', '#451a03', '#9a3412'];

    let accumulatedPercent = 0;

    return (
      <div className="w-full h-full flex items-center justify-center relative">
        <div className="relative w-24 h-24 flex-shrink-0">
          <svg viewBox="0 0 120 120" className="w-full h-full transform -rotate-90 drop-shadow-md">
            <circle cx="60" cy="60" r={R} fill="transparent" stroke="#faf4e5" strokeWidth="16" />
            {data.map((cat, idx) => {
              const percent = (cat.amount / totalDebt) * 100;
              const strokeDashoffset = Circumference - (percent / 100) * Circumference;
              const strokeDasharray = `${Circumference} ${Circumference}`;
              const rotation = (accumulatedPercent / 100) * 360;
              accumulatedPercent += percent;
 
              return (
                <circle
                  key={cat.name}
                  cx="60"
                  cy="60"
                  r={R}
                  fill="transparent"
                  stroke={colors[idx % colors.length]}
                  strokeWidth="16"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  transform={`rotate(${rotation} 60 60)`}
                  className="transition-all duration-500 ease-out cursor-pointer hover:stroke-width-20"
                >
                  <title>{`${cat.name}: ${cat.amount.toLocaleString()}g (${percent.toFixed(1)}%)`}</title>
                </circle>
              );
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="font-sans font-bold text-[6px] text-stone-500 uppercase tracking-widest leading-tight">Total</span>
            <span className="font-mono font-black text-[10px] text-rose-800 leading-none mt-0.5">{totalDebt.toLocaleString()}g</span>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar-subtle pr-2 space-y-1.5 mt-4 ml-4 max-h-[90px]">
          {data.map((cat, idx) => (
            <div key={cat.name} className="flex items-center gap-2 text-[8.5px]">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: colors[idx % colors.length] }}></div>
              <span className="truncate flex-1 font-bold text-[#4b2c20]">{cat.name}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };
 
  return (
    <div className="bg-[#faf4e5]/60 border border-[#8b4513]/25 rounded-xl p-2.5 shadow-sm flex flex-col h-full relative">
      <div className="flex justify-center items-center border-b border-[#8b4513]/10 pb-1 flex-shrink-0 mb-2 text-center">
        <h4 className="title-font text-[10px] font-black text-[#4b2c20] uppercase tracking-wider">
          {t('chart_debt_composition', 'Debt Composition by Type')}
        </h4>
      </div>
      <div className="flex-grow flex items-center justify-center overflow-hidden">
        {renderChart()}
      </div>
    </div>
  );
}
