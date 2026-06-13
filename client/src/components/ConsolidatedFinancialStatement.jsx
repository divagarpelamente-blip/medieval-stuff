import React, { useState } from 'react';
import TreasuryStatements from './TreasuryStatements';
import RoyalIncomeStatement from './RoyalIncomeStatement';

export default function ConsolidatedFinancialStatement({ incomeStatement, cashFlowStatement, balanceSheet, t, formatNumberCompact }) {
  const [activeTab, setActiveTab] = useState('balanceSheet'); // balanceSheet, pnl, cashFlow

  const tabs = [
    { id: 'balanceSheet', label: t('balance_sheet', 'Balance Sheet'), icon: '⚖️' },
    { id: 'pnl', label: t('pnl_statement', 'Profit & Loss'), icon: '💸' },
    { id: 'cashFlow', label: t('cash_flow_statement', 'Cash Flow'), icon: '💰' }
  ];

  return (
    <div className="flex flex-col space-y-5">
      {/* Tab Selector bar inside the statement page */}
      <div className="flex justify-center items-center">
        <div className="bg-[#faf4e5]/40 border border-[#8b4513]/25 p-1 rounded-xl flex gap-1.5 shadow-sm">
          {tabs.map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg border font-black text-[9px] uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95 ${
                  isSelected
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
      </div>

      {/* Render Statement View */}
      <div className="transition-all duration-300">
        {activeTab === 'balanceSheet' && (
          <TreasuryStatements
            show="balanceSheet"
            cashFlowStatement={cashFlowStatement}
            balanceSheet={balanceSheet}
            t={t}
            formatNumberCompact={formatNumberCompact}
          />
        )}
        {activeTab === 'pnl' && (
          <RoyalIncomeStatement
            incomeStatement={incomeStatement}
            t={t}
            formatNumberCompact={formatNumberCompact}
          />
        )}
        {activeTab === 'cashFlow' && (
          <TreasuryStatements
            show="cashFlow"
            cashFlowStatement={cashFlowStatement}
            balanceSheet={balanceSheet}
            t={t}
            formatNumberCompact={formatNumberCompact}
          />
        )}
      </div>
    </div>
  );
}
