import React, { useState } from 'react';

const LEVEL_NAMES = {
  // Level 1
  '1': 'Assets (Resources Owned)',
  '2': 'Liabilities (Obligations Owed)',
  // Level 2
  '11': 'Cash & Cash Equivalents',
  '12': 'Investments',
  '13': 'Savings Accounts',
  '21': 'Loans & Debts',
  '22': 'Credit Cards',
  // Level 3
  '111': 'Bank Vaults',
  '121': 'Investment Apps',
  '131': 'Savings Vaults',
  '211': 'Long-term Loans',
  '212': 'Personal Debts',
  '221': 'Credit Card Details'
};

export default function TreasuryStatements({ cashFlowStatement, balanceSheet, t, formatNumberCompact, show = 'all' }) {
  const {
    operating = [],
    investing = [],
    financing = [],
    netOperating = 0,
    netInvesting = 0,
    netFinancing = 0,
    netCashFlow = 0,
    formattedNet = '0 / g',
    formattedOperating = '0 / g',
    formattedInvesting = '0 / g',
    formattedFinancing = '0 / g'
  } = cashFlowStatement || {};

  const {
    assets = {},
    liabilities = {},
    equity = {}
  } = balanceSheet || {};

  // Expanded nodes state
  const [expandedNodes, setExpandedNodes] = useState({
    '1': true,
    '11': true,
    '12': true,
    '13': true,
    '111': true,
    '121': true,
    '131': true,
    '2': true,
    '21': true,
    '22': true,
    '211': true,
    '212': true,
    '221': true
  });

  const toggleNode = (code) => {
    setExpandedNodes(prev => ({
      ...prev,
      [code]: !prev[code]
    }));
  };

  const buildHierarchy = (flatList, rootCode) => {
    const nodes = {};
    
    // Initialize root node
    nodes[rootCode] = {
      code: rootCode,
      name: LEVEL_NAMES[rootCode] || (rootCode === '1' ? 'Assets' : 'Liabilities'),
      level: 1,
      balance: 0,
      children: []
    };

    // Process each leaf item (Level 4)
    if (flatList) {
      flatList.forEach(item => {
        const code = item.code;
        const balance = Number(item.balance) || 0;

        const lvl2Code = code.slice(0, 2);
        const lvl3Code = code.slice(0, 3);

        // Ensure Level 2 exists
        if (!nodes[lvl2Code]) {
          nodes[lvl2Code] = {
            code: lvl2Code,
            name: LEVEL_NAMES[lvl2Code] || `Level 2 (${lvl2Code})`,
            level: 2,
            balance: 0,
            children: []
          };
          nodes[rootCode].children.push(lvl2Code);
        }

        // Ensure Level 3 exists
        if (!nodes[lvl3Code]) {
          nodes[lvl3Code] = {
            code: lvl3Code,
            name: LEVEL_NAMES[lvl3Code] || `Level 3 (${lvl3Code})`,
            level: 3,
            balance: 0,
            children: []
          };
          nodes[lvl2Code].children.push(lvl3Code);
        }

        // Add Level 4 leaf
        nodes[code] = {
          code,
          name: item.name,
          level: 4,
          balance,
          children: []
        };
        nodes[lvl3Code].children.push(code);
      });
    }

    // Compute balances bottom-up recursively
    const computeBalance = (nodeCode) => {
      const node = nodes[nodeCode];
      if (!node) return 0;
      if (node.level === 4) {
        return node.balance;
      }
      let sum = 0;
      node.children.forEach(childCode => {
        sum += computeBalance(childCode);
      });
      node.balance = sum;
      return sum;
    };

    computeBalance(rootCode);
    return nodes;
  };

  const getRenderList = (nodes, rootCode) => {
    const list = [];
    const traverse = (nodeCode) => {
      const node = nodes[nodeCode];
      if (!node) return;
      
      list.push(node);
      
      const isExpanded = expandedNodes[nodeCode];
      if (isExpanded && node.children.length > 0) {
        node.children.sort().forEach(childCode => {
          traverse(childCode);
        });
      }
    };
    traverse(rootCode);
    return list;
  };

  const renderNodeRows = (nodes, rootCode) => {
    const list = getRenderList(nodes, rootCode);
    
    return list.map((node) => {
      const hasChildren = node.children.length > 0;
      const isExpanded = !!expandedNodes[node.code];
      const indentClass = 
        node.level === 1 ? 'pl-0 font-black text-[#4b2c20] text-[11px] uppercase' :
        node.level === 2 ? 'pl-3 font-bold text-[#8b4513] text-[10px]' :
        node.level === 3 ? 'pl-6 font-semibold text-[#5d4037] text-[9.5px]' :
        'pl-9 font-medium text-[#5d4037]/85 text-[9px] italic';

      const icon = node.level === 1 ? '👑' : node.level === 2 ? '📁' : node.level === 3 ? '📂' : '📄';

      return (
        <div 
          key={node.code} 
          className={`flex justify-between items-center py-1 border-b border-[#8b4513]/5 hover:bg-[#8b4513]/5 transition-colors duration-150 ${node.level === 1 ? 'bg-[#8b4513]/5 mt-2 rounded px-1' : ''}`}
        >
          <div className={`flex items-center gap-1.5 ${indentClass}`}>
            <span>{icon}</span>
            <span>{node.name}</span>
            {hasChildren && (
              <button
                type="button"
                onClick={() => toggleNode(node.code)}
                className="ml-1 text-[9px] leading-none text-[#8b4513] hover:text-[#ffd700] hover:bg-[#8b4513] p-0.5 rounded cursor-pointer font-sans transition-all duration-150"
              >
                {isExpanded ? '▼' : '▶'}
              </button>
            )}
          </div>
          <span className={`font-mono font-bold ${node.code.startsWith('1') ? 'text-emerald-700' : 'text-rose-700'} text-[10px]`}>
            {formatNumberCompact(node.balance)}
          </span>
        </div>
      );
    });
  };

  const assetNodes = buildHierarchy(assets.list || [], '1');
  const liabilityNodes = buildHierarchy(liabilities.list || [], '2');

  return (
    <div className="flex flex-col gap-6">
      
      {/* 1. IMPERIAL BALANCE SHEET */}
      {(show === 'all' || show === 'balanceSheet') && (
        <div className="bg-[#faf4e5]/60 border border-[#8b4513]/25 rounded-xl p-4 shadow-sm flex flex-col space-y-4">
          <h4 className="title-font text-[12px] font-black text-[#4b2c20] uppercase tracking-wider border-b border-[#8b4513]/10 pb-2 flex justify-center items-center text-center">
            <span>⚖️ {t('imperial_balance_sheet', 'Imperial Balance Sheet')}</span>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Assets Section */}
            <div className="space-y-3">
              <h5 className="title-font text-[10px] font-black text-[#8b4513]/90 uppercase tracking-widest border-b border-[#8b4513]/5 pb-1">
                {t('assets', 'Assets (Resources Owned)')}
              </h5>
              <div className="space-y-1.5 text-[10px]">
                {renderNodeRows(assetNodes, '1')}
                <div className="flex justify-between items-center pt-2 font-bold text-[#4b2c20] border-t border-[#8b4513]/10">
                  <span>{t('total_assets', 'Total Assets')}</span>
                  <span className="font-mono text-emerald-700">{assets.formattedTotal || '0 / g'}</span>
                </div>
              </div>
            </div>

            {/* Liabilities Section */}
            <div className="space-y-3">
              <h5 className="title-font text-[10px] font-black text-[#8b4513]/90 uppercase tracking-widest border-b border-[#8b4513]/5 pb-1">
                {t('liabilities', 'Liabilities (Obligations Owed)')}
              </h5>
              <div className="space-y-1.5 text-[10px]">
                {renderNodeRows(liabilityNodes, '2')}
                <div className="flex justify-between items-center pt-2 font-bold text-[#4b2c20] border-t border-[#8b4513]/10">
                  <span>{t('total_liabilities', 'Total Liabilities')}</span>
                  <span className="font-mono text-rose-700">{liabilities.formattedTotal || '0 / g'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Equity Section Summary */}
          <div className="bg-[#f4e4bc]/50 border border-[#8b4513]/15 rounded-lg p-2.5 flex justify-between items-center font-serif text-[11px] font-black uppercase text-[#4b2c20] tracking-wide mt-2">
            <span>🛡️ {t('accumulated_wealth', 'Accumulated Wealth (Net Equity)')}</span>
            <span className={`font-mono text-xs ${equity.accumulatedWealth >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              {equity.formattedTotal || '0 / g'}
            </span>
          </div>
        </div>
      )}

      {/* 2. TREASURY CASH FLOW STATEMENT */}
      {(show === 'all' || show === 'cashFlow') && (
        <div className="bg-[#faf4e5]/60 border border-[#8b4513]/25 rounded-xl p-4 shadow-sm flex flex-col space-y-4">
          <h4 className="title-font text-[12px] font-black text-[#4b2c20] uppercase tracking-wider border-b border-[#8b4513]/10 pb-2 flex justify-center items-center text-center">
            <span>💸 {t('treasury_cash_flow', 'Treasury Cash Flow Statement')}</span>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Operating Cash Flows */}
            <div className="bg-[#faf4e5]/40 border border-[#8b4513]/10 rounded-lg p-3 flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <h5 className="title-font text-[9px] font-black text-[#8b4513]/95 uppercase tracking-wider border-b border-[#8b4513]/5 pb-1">
                  ⚙️ {t('operating_activities', 'Operating Activities')}
                </h5>
                <div className="space-y-1.5 max-h-[120px] overflow-y-auto custom-scrollbar-subtle pr-1 text-[9px]">
                  {operating.length > 0 ? (
                    operating.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center py-0.5 border-b border-[#8b4513]/5">
                        <span className="font-bold text-[#5d4037]">{item.name}</span>
                        <span className={`font-mono font-bold ${item.amount >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{item.formatted}</span>
                      </div>
                    ))
                  ) : (
                    <div className="py-2 text-center text-[8px] text-[#5d4037]/50 italic font-serif">
                      {t('no_operating_flows', 'No operating cash flows.')}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-between items-center text-[9.5px] font-bold text-[#4b2c20] pt-1.5 border-t border-[#8b4513]/10">
                <span>{t('net_operating', 'Net Operating')}</span>
                <span className={`font-mono ${netOperating >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{formattedOperating}</span>
              </div>
            </div>

            {/* Investing Cash Flows */}
            <div className="bg-[#faf4e5]/40 border border-[#8b4513]/10 rounded-lg p-3 flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <h5 className="title-font text-[9px] font-black text-[#8b4513]/95 uppercase tracking-wider border-b border-[#8b4513]/5 pb-1">
                  🛡️ {t('investing_activities', 'Investing Activities')}
                </h5>
                <div className="space-y-1.5 max-h-[120px] overflow-y-auto custom-scrollbar-subtle pr-1 text-[9px]">
                  {investing.length > 0 ? (
                    investing.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center py-0.5 border-b border-[#8b4513]/5">
                        <span className="font-bold text-[#5d4037]">{item.name}</span>
                        <span className={`font-mono font-bold ${item.amount >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{item.formatted}</span>
                      </div>
                    ))
                  ) : (
                    <div className="py-2 text-center text-[8px] text-[#5d4037]/50 italic font-serif">
                      {t('no_investing_flows', 'No investing cash flows.')}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-between items-center text-[9.5px] font-bold text-[#4b2c20] pt-1.5 border-t border-[#8b4513]/10">
                <span>{t('net_investing', 'Net Investing')}</span>
                <span className={`font-mono ${netInvesting >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{formattedInvesting}</span>
              </div>
            </div>

            {/* Financing Cash Flows */}
            <div className="bg-[#faf4e5]/40 border border-[#8b4513]/10 rounded-lg p-3 flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <h5 className="title-font text-[9px] font-black text-[#8b4513]/95 uppercase tracking-wider border-b border-[#8b4513]/5 pb-1">
                  🏦 {t('financing_activities', 'Financing Activities')}
                </h5>
                <div className="space-y-1.5 max-h-[120px] overflow-y-auto custom-scrollbar-subtle pr-1 text-[9px]">
                  {financing.length > 0 ? (
                    financing.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center py-0.5 border-b border-[#8b4513]/5">
                        <span className="font-bold text-[#5d4037]">{item.name}</span>
                        <span className={`font-mono font-bold ${item.amount >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{item.formatted}</span>
                      </div>
                    ))
                  ) : (
                    <div className="py-2 text-center text-[8px] text-[#5d4037]/50 italic font-serif">
                      {t('no_financing_flows', 'No financing cash flows.')}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-between items-center text-[9.5px] font-bold text-[#4b2c20] pt-1.5 border-t border-[#8b4513]/10">
                <span>{t('net_financing', 'Net Financing')}</span>
                <span className={`font-mono ${netFinancing >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{formattedFinancing}</span>
              </div>
            </div>

          </div>

          {/* Net Cash Flow Footer */}
          <div className="bg-[#f4e4bc]/50 border border-[#8b4513]/15 rounded-lg p-2.5 flex justify-between items-center font-serif text-[11px] font-black uppercase text-[#4b2c20] tracking-wide mt-2">
            <span>💰 {t('net_cash_flow', 'Net Cash Flow (Periodic Change)')}</span>
            <span className={`font-mono text-xs ${netCashFlow >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              {formattedNet}
            </span>
          </div>
        </div>
      )}

    </div>
  );
}
