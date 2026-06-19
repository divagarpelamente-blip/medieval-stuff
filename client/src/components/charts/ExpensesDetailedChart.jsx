import React, { useState, useMemo, useEffect } from 'react';

export default function ExpensesDetailedChart({ transactions, t }) {
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Aggregate categories
  const categoriesData = useMemo(() => {
    if (!transactions) return [];
    
    const catMap = {};
    transactions.forEach(tx => {
      if (tx.transaction_type === 'Expense') {
        const cat = tx.transaction_category || 'Unknown';
        const amount = Number(tx.amount) || 0;
        if (!catMap[cat]) catMap[cat] = 0;
        catMap[cat] += amount;
      }
    });

    return Object.entries(catMap)
      .map(([name, expense]) => ({ name, expense }))
      .sort((a, b) => b.expense - a.expense);
  }, [transactions]);

  // Default selection to highest category
  useEffect(() => {
    if (categoriesData.length > 0 && (!selectedCategory || !categoriesData.find(c => c.name === selectedCategory))) {
      setSelectedCategory(categoriesData[0].name);
    }
  }, [categoriesData, selectedCategory]);

  // Aggregate entities for the selected category
  const entitiesData = useMemo(() => {
    if (!transactions || !selectedCategory) return [];

    const entityMap = {};
    transactions.forEach(tx => {
      if (tx.transaction_category === selectedCategory && tx.transaction_type === 'Expense') {
        const entity = tx.entity || 'Unknown';
        const amount = Number(tx.amount) || 0;
        if (!entityMap[entity]) entityMap[entity] = 0;
        entityMap[entity] += amount;
      }
    });

    return Object.entries(entityMap)
      .map(([name, expense]) => ({ name, expense }))
      .sort((a, b) => b.expense - a.expense)
      .slice(0, 15); // Top 15 entities to keep it clean
  }, [transactions, selectedCategory]);

  const maxExpense = entitiesData.length > 0 ? Math.max(...entitiesData.map(d => d.expense)) : 1;

  return (
    <div className="bg-[#faf4e5]/60 border border-[#8b4513]/25 rounded-xl p-2.5 shadow-sm flex flex-col h-full relative">
      <div className="flex justify-center items-center border-b border-[#8b4513]/10 pb-1 mb-2 flex-shrink-0 text-center">
        <h4 className="title-font text-[10px] font-black text-[#4b2c20] uppercase tracking-wider">
          {t('expenses_detailed', 'Expenses Detailed')} {selectedCategory ? `- ${selectedCategory}` : ''}
        </h4>
      </div>
 
      <div className="flex-1 flex gap-4 overflow-hidden">
        {/* Left: Entities Bar Chart */}
        <div className="flex-[2] overflow-y-auto custom-scrollbar-subtle pr-2 space-y-1.5">
          {entitiesData.length === 0 ? (
            <div className="text-center text-xs text-[#8b4513]/50 italic mt-4">No data</div>
          ) : (
            entitiesData.map((entity, idx) => {
              const widthPct = Math.max((entity.expense / maxExpense) * 100, 2);
              return (
                <div key={idx} className="relative">
                  <div className="flex justify-between items-end mb-0.5">
                    <span className="text-[9px] font-black text-stone-700 font-sans truncate pr-2 max-w-[70%]">
                      {entity.name}
                    </span>
                    <span className="text-[9px] font-mono font-bold text-rose-700">
                      {entity.expense.toLocaleString()}g
                    </span>
                  </div>
                  <div className="h-1 w-full bg-[#8b4513]/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-rose-800 to-rose-500 rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
 
        {/* Right: Categories Filter List */}
        <div className="flex-1 border-l border-[#8b4513]/10 pl-2 overflow-y-auto custom-scrollbar-subtle space-y-0.5">
          {categoriesData.map((cat, idx) => {
            const isActive = selectedCategory === cat.name;
            return (
              <button
                key={idx}
                onClick={() => setSelectedCategory(cat.name)}
                className={`w-full text-left px-1.5 py-1 rounded text-[9px] font-sans font-bold transition-all truncate border border-transparent ${
                  isActive 
                    ? 'bg-[#8b4513] text-[#ffd700] border-[#8b4513] shadow-inner' 
                    : 'text-[#4b2c20] hover:bg-[#8b4513]/10'
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
