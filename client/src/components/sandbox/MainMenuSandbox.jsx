import React, { useState, useMemo } from 'react';
import bgImage from '../../assets/Medieval_Town_Backround.jfif';
import advisorImage from '../../assets/medieval_advisor.png';
import { useKingdomStore } from '../../store/useKingdomStore';
import { RoyalAdvisorWidget } from '../widgets/RoyalAdvisorWidget';

export default function MainMenuSandbox() {
  const store = useKingdomStore();
  const transactions = store?.transactions || [];
  const dashboardMetrics = store?.dashboardMetrics || {};
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);

  const totalGoldOwned = dashboardMetrics.total_assets || 0;

  const goldEarnedPerWeek = useMemo(() => {
    let totalInflow = 0;
    let minDate = null;
    let maxDate = null;
    transactions.forEach(t => {
      const amount = Number(t.amount) || 0;
      const isChecking = (t.target_account && t.target_account.startsWith('1101')) || 
                         (t.source_account && t.source_account.startsWith('1101'));
      if (isChecking && t.flow === 'inflow') {
        totalInflow += amount;
      }
      if (t.posting_date) {
        const date = new Date(t.posting_date);
        if (!minDate || date < minDate) minDate = date;
        if (!maxDate || date > maxDate) maxDate = date;
      }
    });
    if (!minDate || !maxDate) return 0;
    const diffTime = Math.abs(maxDate - minDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
    const weeks = diffDays / 7 || 1;
    return totalInflow / weeks;
  }, [transactions]);

  const totalGoldUsed = useMemo(() => {
    let sum = 0;
    transactions.forEach(t => {
      const amount = Number(t.amount) || 0;
      if (t.source_account && t.source_account.startsWith('1')) {
        if (t.flow === 'outflow' || t.flow === 'neutral') {
          sum += amount;
        }
      }
    });
    return sum;
  }, [transactions]);

  const totalIncome = useMemo(() => {
    let sum = 0;
    transactions.forEach(t => {
      const amount = Number(t.amount) || 0;
      if (t.type === 'Income' && t.flow === 'inflow') {
        sum += amount;
      }
    });
    return sum;
  }, [transactions]);

  const goldUsedPerWeek = useMemo(() => {
    let totalOutflow = 0;
    let minDate = null;
    let maxDate = null;
    transactions.forEach(t => {
      const amount = Number(t.amount) || 0;
      const isClass1Source = t.source_account && t.source_account.startsWith('1');
      if (isClass1Source && (t.flow === 'outflow' || t.flow === 'neutral')) {
        totalOutflow += amount;
      }
      if (t.posting_date) {
        const date = new Date(t.posting_date);
        if (!minDate || date < minDate) minDate = date;
        if (!maxDate || date > maxDate) maxDate = date;
      }
    });
    if (!minDate || !maxDate) return 0;
    const diffTime = Math.abs(maxDate - minDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
    const weeks = diffDays / 7 || 1;
    return totalOutflow / weeks;
  }, [transactions]);

  const formatValue = (val) => {
    const num = Number(val) || 0;
    return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="w-full h-dvh bg-stone-950 flex items-center justify-center overflow-hidden">
      <div 
        className="relative mx-auto text-stone-100 flex flex-col justify-between font-serif overflow-hidden w-full max-w-[1180px] h-[820px] max-h-[95dvh] border-y-4 border-x-[16px] rounded-3xl border-stone-900 shadow-[0_0_80px_rgba(0,0,0,0.8)]"
        style={{
          backgroundImage: `radial-gradient(ellipse at center, rgba(12, 10, 9, 0.4) 0%, rgba(9, 8, 8, 0.95) 100%), url(${bgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        {/* Top Left Avatar Section */}
        <div className="absolute top-6 left-6 z-50 flex flex-col items-start gap-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-stone-800 border-2 border-amber-600/60 shadow-[0_0_15px_rgba(217,119,6,0.3)] flex items-center justify-center overflow-hidden">
              <img 
                src="https://api.dicebear.com/7.x/adventurer/svg?seed=Proudmore&backgroundColor=transparent" 
                alt="Avatar" 
                className="w-full h-full object-cover scale-110" 
                draggable="false"
              />
            </div>
            <span className="font-black text-amber-50 tracking-widest uppercase text-sm drop-shadow-md">
              Proudmore
            </span>
          </div>
        </div>

        {/* Top Right Financial Dashboard - Total Income (Parchment/Iron Vault style) */}
        <div className="absolute top-6 right-[216px] z-50 w-44 bg-[#1e1b18] border-2 border-[#8b4513]/60 p-3 rounded-lg shadow-[inset_0_0_10px_rgba(0,0,0,0.8),0_4px_10px_rgba(0,0,0,0.5)] text-right font-serif animate-fade-in">
          <div className="text-[10px] uppercase tracking-wider text-amber-500/80 font-sans font-black">Total Income</div>
          <div className="text-xl font-bold text-amber-100 mt-1">{formatValue(totalIncome)}g</div>
          <div className="text-[10px] text-stone-400 font-sans mt-0.5 font-semibold">+{formatValue(goldEarnedPerWeek)}g / week</div>
        </div>

        {/* Top Right Financial Dashboard - Gold Used (Parchment/Iron Vault style) */}
        <div className="absolute top-6 right-6 z-50 w-44 bg-[#1e1b18] border-2 border-[#8b4513]/60 p-3 rounded-lg shadow-[inset_0_0_10px_rgba(0,0,0,0.8),0_4px_10px_rgba(0,0,0,0.5)] text-right font-serif">
          <div className="text-[10px] uppercase tracking-wider text-amber-500/80 font-sans font-black">Total Gold Used</div>
          <div className="text-xl font-bold text-amber-100 mt-1">{formatValue(totalGoldUsed)}g</div>
          <div className="text-[10px] text-stone-400 font-sans mt-0.5 font-semibold">-{formatValue(goldUsedPerWeek)}g / week</div>
        </div>

        {/* Right Side Advisor Button (placed below Gold Used panel, scaled down by 10% to w-[100px] h-[100px]) */}
        <div className="absolute top-[156px] right-6 z-50">
          <div className="relative group cursor-pointer" onClick={() => setIsWidgetOpen(true)}>
            
            {/* Outer Decorative Circle frame */}
            <div className="w-[100px] h-[100px] rounded-full border-4 border-amber-600/70 shadow-[0_0_20px_rgba(217,119,6,0.6)] bg-stone-900/90 flex items-center justify-center overflow-hidden transition-all duration-300 group-hover:scale-105 group-hover:border-amber-400 group-hover:shadow-[0_0_25px_rgba(217,119,6,0.9)]">
              {/* Advisor portrait */}
              <img 
                src={advisorImage} 
                alt="Royal Advisor" 
                className="w-full h-full object-cover scale-110 translate-y-1"
                draggable="false"
              />
            </div>

            {/* Custom overlay feather popping out */}
            <div className="absolute -top-4 -right-1 pointer-events-none transform -rotate-12 select-none">
              <span className="text-3xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] filter brightness-110">🪶</span>
            </div>
            
            {/* Mini Label */}
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-stone-950/90 border border-amber-500/50 px-2 py-0.5 rounded text-[8px] uppercase tracking-widest text-amber-100 font-bold whitespace-nowrap font-sans">
              Advisor
            </div>
          </div>
        </div>

        {/* Bottom Menu Dock */}
        <main className="flex-grow flex flex-col items-center justify-end px-4 pb-8 z-10 w-full min-h-0">
          <div className="flex items-center justify-center bg-stone-950/80 backdrop-blur-md border border-amber-900/50 rounded-full px-8 py-4 shadow-[0_0_30px_rgba(0,0,0,0.8)] gap-8 flex-wrap relative">
            
            {/* 1. Finance Advisor */}
            <button type="button" title="Finance Advisor" className="text-3xl grayscale hover:grayscale-0 hover:scale-125 transition-all duration-200 cursor-default focus:outline-none">📋</button>
            
            {/* 2. Placeholder01 */}
            <button type="button" title="Placeholder01" className="text-3xl grayscale hover:grayscale-0 hover:scale-125 transition-all duration-200 cursor-default focus:outline-none">🚧</button>
            
            {/* 3. Quests */}
            <button type="button" title="Quests" className="text-3xl grayscale hover:grayscale-0 hover:scale-125 transition-all duration-200 cursor-default focus:outline-none">⚔️</button>
            
            {/* 4. Treasury */}
            <button type="button" title="Treasury" className="text-3xl grayscale hover:grayscale-0 hover:scale-125 transition-all duration-200 cursor-default focus:outline-none">🏦</button>

            {/* 5. Achievements */}
            <button type="button" title="Achievements" className="text-3xl grayscale hover:grayscale-0 hover:scale-125 transition-all duration-200 cursor-default focus:outline-none">🏆</button>
            
            {/* 6. Settings */}
            <button type="button" title="Settings" className="text-3xl grayscale hover:grayscale-0 hover:scale-125 transition-all duration-200 cursor-default focus:outline-none">⚙️</button>
          </div>
        </main>
      </div>

      {isWidgetOpen && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center">
          <div className="relative w-full max-w-lg h-[600px] bg-stone-950 border-2 border-amber-900/60 rounded-2xl p-1 shadow-[0_0_60px_rgba(0,0,0,0.95)]">
            <button 
              onClick={() => setIsWidgetOpen(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-white z-50 text-xl font-bold bg-stone-900/80 w-8 h-8 rounded-full border border-amber-900/40 flex items-center justify-center hover:bg-amber-900/40 transition-colors cursor-pointer"
            >
              ✕
            </button>
            <RoyalAdvisorWidget />
          </div>
        </div>
      )}
    </div>
  );
}
