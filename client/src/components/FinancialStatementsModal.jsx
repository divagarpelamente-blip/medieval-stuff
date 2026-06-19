import React from 'react';
import BaseDashboardTab from './BaseDashboardTab';
import ConsolidatedFinancialStatement from './ConsolidatedFinancialStatement';
import { STANDARD_MODAL_PROPS, Z_LAYERS } from '../constants/UI_UX';

const FinancialStatementsModal = ({
  isOpen,
  onClose,
  t,
  isSidebarOpen,
  setIsSidebarOpen,
  selectedYears,
  setSelectedYears,
  uniqueYearsList,
  selectedQuarters,
  setSelectedQuarters,
  selectedMonths,
  setSelectedMonths,
  monthOptions,
  isFallbackState,
  incomeStatement,
  cashFlowStatement,
  balanceSheet,
  formatNumberCompact
}) => {
  if (!isOpen) return null;

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className={`absolute inset-0 flex ${STANDARD_MODAL_PROPS.align} justify-center p-4 bg-black/60 backdrop-blur-xs`}
      style={{ zIndex: Z_LAYERS.OVERLAY }}
    >
      <div className={`bg-[#f4e4bc] w-full ${STANDARD_MODAL_PROPS.size} rounded-xl border-[8px] border-[#5d4037] shadow-[0_0_50px_rgba(0,0,0,0.9)] relative flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300`}>
        
        {/* Parchment Texture */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-25 mix-blend-multiply"
          style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/paper-fibers.png')" }}
        />

        {/* Ornate Corners */}
        <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-[#8b4513]/30 rounded-tl-lg pointer-events-none" />
        <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-[#8b4513]/30 rounded-tr-lg pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-[#8b4513]/30 rounded-bl-lg pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-[#8b4513]/30 rounded-br-lg pointer-events-none" />

        {/* Close Button to return to quests */}
        <button 
          type="button"
          onClick={onClose}
          className="absolute -top-1 -right-1 w-12 h-12 bg-[#8b0000] rounded-full flex items-center justify-center border-4 border-[#5d0000] shadow-[0_4px_10px_rgba(0,0,0,0.5)] active:scale-90 transition-transform group"
          style={{ zIndex: Z_LAYERS.MODAL_CONTENT }}
          title={t.back_to_map}
        >
          <div className="absolute inset-0 rounded-full border-2 border-white/20 animate-pulse" />
          <span className="text-[#ffd700] text-lg font-black font-sans">✕</span>
        </button>

        {/* Header Ribbon */}
        <div className="relative h-16 flex items-center justify-center z-10 pt-2">
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[110%] h-10 bg-gradient-to-r from-[#8b4513] via-[#5d4037] to-[#8b4513] shadow-lg transform -rotate-1 skew-x-12 z-0 border-y-2 border-[#d4af37]" />
          <h2 className="title-font text-lg sm:text-xl text-[#ffd700] font-bold uppercase tracking-[0.2em] relative z-10 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
            {t.subtab_financial_statement || 'Financial Statements'}
          </h2>
        </div>

        <BaseDashboardTab
          t={t}
          dashSubTab="financial_statement"
          setDashSubTab={() => {}}
          subTabs={[]}
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          selectedYears={selectedYears}
          setSelectedYears={setSelectedYears}
          uniqueYearsList={uniqueYearsList}
          selectedQuarters={selectedQuarters}
          setSelectedQuarters={setSelectedQuarters}
          selectedMonths={selectedMonths}
          setSelectedMonths={setSelectedMonths}
          monthOptions={monthOptions}
          isFallbackState={isFallbackState}
          kpis={[]}
        >
          <ConsolidatedFinancialStatement
            incomeStatement={incomeStatement}
            cashFlowStatement={cashFlowStatement}
            balanceSheet={balanceSheet}
            t={t}
            formatNumberCompact={formatNumberCompact}
            selectedYears={selectedYears}
            selectedQuarters={selectedQuarters}
            selectedMonths={selectedMonths}
          />
        </BaseDashboardTab>
      </div>
    </div>
  );
};

export default FinancialStatementsModal;
