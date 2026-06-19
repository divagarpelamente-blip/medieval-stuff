import React from 'react';

export default function BaseDashboardTab({
  t,
  dashSubTab,
  setDashSubTab,
  subTabs = [],
  isSidebarOpen,
  setIsSidebarOpen,
  selectedYears = [],
  setSelectedYears,
  uniqueYearsList = [],
  selectedQuarters = [],
  setSelectedQuarters,
  selectedMonths = [],
  setSelectedMonths,
  monthOptions = [],
  isFallbackState = false,
  kpis = [],
  children
}) {
  return (
    <div className="flex flex-col flex-grow overflow-hidden h-full">
      {/* Top Navigation Bar: Sub-tabs & Sidebar Toggle */}
      <div className={`px-4 ${subTabs.length > 0 ? 'py-2.5 flex' : 'py-1.5 md:hidden flex'} border-b border-[#8b4513]/25 flex-col md:flex-row justify-between items-center gap-3 bg-[#faf4e5]/40 z-10`}>
        <div className="flex flex-wrap gap-1.5 items-center justify-start md:justify-end w-full">
          {subTabs.map((tab) => {
            const isSel = dashSubTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setDashSubTab(tab.id)}
                className={`px-3 py-3 md:py-1.5 rounded-lg border font-black text-[9px] uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95 min-h-[44px] md:min-h-0 ${
                  isSel
                    ? 'bg-[#8b4513] border-[#8b4513] text-[#ffd700] shadow-md'
                    : 'bg-[#faf4e5]/80 border-[#8b4513]/20 text-[#5d4037]/80 hover:bg-[#8b4513]/10 hover:text-[#4b2c20]'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Mobile Filter Toggle Button */}
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="md:hidden px-3 py-3 rounded-lg border border-[#8b4513]/20 bg-[#faf4e5]/80 text-[#5d4037] font-black text-[9px] uppercase tracking-wider hover:bg-[#8b4513]/10"
          >
            {isSidebarOpen ? 'Close Filters' : 'Filters'}
          </button>
        </div>
      </div>

      {/* Main Layout Body: Filter Sidebar + Content Pane */}
      <div className="flex flex-grow overflow-hidden relative z-10 text-[#2d1b0d] h-full">
        
        {/* Left Sidebar Filter Panel */}
        <div className={`${isSidebarOpen ? 'block' : 'hidden'} md:block w-full md:w-36 lg:w-40 px-2 flex-shrink-0 bg-[#faf4e5]/90 border-r border-[#8b4513]/25 overflow-y-auto custom-scrollbar-subtle flex flex-col`}>
          <div className="p-4 space-y-6">
            
            {/* Years Filter */}
            <div className="space-y-2">
              <div className="flex justify-between items-center border-b border-[#8b4513]/10 pb-1">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-[#4b2c20]">Years</h4>
                <div className="flex flex-wrap gap-1 text-[8px] font-bold text-[#8b4513] uppercase">
                  <button onClick={() => setSelectedYears(uniqueYearsList.map(String))} className="hover:underline">All</button>
                  <button onClick={() => setSelectedYears([])} className="hover:underline">None</button>
                </div>
              </div>
              <div className="flex flex-col gap-1 max-h-12 overflow-y-auto custom-scrollbar-subtle pr-1">
                {uniqueYearsList.map(y => {
                  const yStr = String(y);
                  const isSel = selectedYears.includes(yStr);
                  return (
                    <label key={yStr} onClick={() => setSelectedYears(prev => prev.includes(yStr) ? prev.filter(x => x !== yStr) : [...prev, yStr])} className="flex flex-wrap items-center gap-1 cursor-pointer group">
                      <div className={`w-3 h-3 rounded border flex items-center justify-center transition-colors ${isSel ? 'bg-[#8b4513] border-[#8b4513]' : 'border-[#8b4513]/40 group-hover:border-[#8b4513]'}`}>
                        {isSel && <div className="w-1.5 h-1.5 bg-[#ffd700] rounded-sm" />}
                      </div>
                      <span className="text-[11px] font-bold text-[#5d4037] group-hover:text-[#4b2c20]">{yStr}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Quarters Filter */}
            <div className="space-y-2">
              <div className="flex justify-between items-center border-b border-[#8b4513]/10 pb-1">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-[#4b2c20]">Quarters</h4>
                <div className="flex gap-2 text-[8px] font-bold text-[#8b4513] uppercase">
                  <button onClick={() => setSelectedQuarters(['Q1', 'Q2', 'Q3', 'Q4'])} className="hover:underline">All</button>
                  <button onClick={() => setSelectedQuarters([])} className="hover:underline">None</button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {['Q1', 'Q2', 'Q3', 'Q4'].map(q => {
                  const isSel = selectedQuarters.includes(q);
                  return (
                    <button
                      key={q}
                      onClick={() => setSelectedQuarters(prev => prev.includes(q) ? prev.filter(x => x !== q) : [...prev, q])}
                      className={`py-1 rounded border text-[9px] font-bold transition-all ${isSel ? 'bg-[#8b4513] border-[#8b4513] text-[#ffd700]' : 'bg-transparent border-[#8b4513]/20 text-[#5d4037] hover:bg-[#8b4513]/10'}`}
                    >
                      {q}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Months Filter */}
            <div className="space-y-2">
              <div className="flex justify-between items-center border-b border-[#8b4513]/10 pb-1">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-[#4b2c20]">Months</h4>
                <div className="flex gap-2 text-[8px] font-bold text-[#8b4513] uppercase">
                  <button onClick={() => setSelectedMonths(monthOptions)} className="hover:underline">All</button>
                  <button onClick={() => setSelectedMonths([])} className="hover:underline">None</button>
                </div>
              </div>
              <div className="flex flex-col gap-1 max-h-[300px] overflow-y-auto custom-scrollbar-subtle pr-1">
                {monthOptions.map(m => {
                  const isSel = selectedMonths.includes(m);
                  return (
                    <label key={m} onClick={() => setSelectedMonths(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m])} className="flex items-center gap-2 cursor-pointer group">
                      <div className={`w-3 h-3 rounded border flex items-center justify-center transition-colors ${isSel ? 'bg-[#8b4513] border-[#8b4513]' : 'border-[#8b4513]/40 group-hover:border-[#8b4513]'}`}>
                        {isSel && <div className="w-1.5 h-1.5 bg-[#ffd700] rounded-sm" />}
                      </div>
                      <span className="text-[10px] font-bold text-[#5d4037] group-hover:text-[#4b2c20]">{m}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Content Pane */}
        <div className="flex-1 flex flex-col overflow-hidden h-full bg-[#f4e4bc]">
          {isFallbackState ? (
            /* Fallback Empty State */
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-60">
              <div className="text-6xl">📜</div>
              <div className="space-y-1">
                <h3 className="title-font text-xl font-black text-[#4b2c20] uppercase tracking-widest">
                  {t('select_time_period', 'Select a Time Period')}
                </h3>
                <p className="text-xs font-serif italic text-[#5d4037]">
                  {t('select_time_period_desc', 'Consult the archives by selecting at least one Year in the filter panel.')}
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Fixed Top 5-Card Summary KPI Row */}
              {kpis.length > 0 && (
                <div className="p-5 sm:p-6 pb-2 space-y-1 flex-shrink-0 z-20 bg-[#f4e4bc] border-b border-[#8b4513]/10">
                  <div className={`grid grid-cols-1 ${{
                    1: 'sm:grid-cols-1',
                    2: 'sm:grid-cols-2',
                    3: 'sm:grid-cols-3',
                    4: 'sm:grid-cols-4',
                    5: 'sm:grid-cols-5',
                    6: 'sm:grid-cols-6',
                  }[kpis.length] || 'sm:grid-cols-5'} gap-1 sm:gap-1.5`}>
                    {kpis.map((kpi, idx) => (
                      <div
                        key={idx}
                        className="bg-[#faf4e5]/60 border border-[#8b4513]/25 rounded-xl p-1.5 sm:p-2 flex flex-col justify-between items-center shadow-sm relative overflow-hidden text-center"
                      >
                        <span className="text-[9px] font-black uppercase text-stone-500 tracking-wider font-sans font-bold">
                          {kpi.label}
                        </span>
                        <span
                          className={`title-font text-sm sm:text-base lg:text-lg font-black mt-0.5 font-mono truncate w-full ${
                            kpi.colorClass || 'text-[#4b2c20]'
                          }`}
                        >
                          {kpi.value}
                        </span>
                        <div className="absolute right-1 bottom-1 text-lg opacity-15">
                          {kpi.icon}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Scrollable Children Content Area */}
              <div className={`flex-1 p-5 sm:p-6 overflow-y-auto custom-scrollbar space-y-8 ${subTabs.length > 0 ? 'mt-4' : 'mt-1'} h-full`}>
                {children}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
