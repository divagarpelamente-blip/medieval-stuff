import React, { useState } from 'react';
import { useKingdomStore } from '../store/useKingdomStore';
import { accountMappings } from '../utils/accountMappings';

// 1. Parsing Helper
const parseAccountName = (code, fullName) => {
  let remaining = fullName;
  if (remaining.startsWith(code)) {
    remaining = remaining.substring(code.length).replace(/^\s*-\s*/, '');
  }
  const parts = remaining.split(/\s*-\s*/);
  const subtype = parts[0] || 'Other';
  const entity = parts.slice(1).join(' - ') || 'Other';
  return { subtype, entity };
};

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const isBeforeOrInMonth = (txYear, txMonth, targetYear, targetMonth) => {
  const ty = Number(targetYear);
  const my = Number(txYear);
  if (my < ty) return true;
  if (my > ty) return false;
  return monthNames.indexOf(txMonth) <= monthNames.indexOf(targetMonth);
};

const isBeforeOrInQuarter = (txYear, txQuarter, targetYear, targetQuarter) => {
  const ty = Number(targetYear);
  const my = Number(txYear);
  if (my < ty) return true;
  if (my > ty) return false;
  return txQuarter <= targetQuarter;
};

const isBeforeOrInYear = (txYear, targetYear) => {
  return Number(txYear) <= Number(targetYear);
};

export default function TreasuryStatements({ cashFlowStatement, balanceSheet, t, formatNumberCompact, show = 'all', selectedYears = [], selectedQuarters = [], selectedMonths = [] }) {
  const allTxs = useKingdomStore(state => state.transactions) || [];
  const userGold = useKingdomStore(state => state.gold) || 0;
  const subtypeToCategoryMap = useKingdomStore(state => state.subtypeToCategoryMap) || {};
  const subtypeTypes = useKingdomStore(state => state.subtypeTypes) || {};

  // 2. Inverted Subtype Map to look up Group from Subtype
  const subtypeToGroup = {};
  Object.entries(subtypeToCategoryMap).forEach(([group, subtypes]) => {
    subtypes.forEach(sub => {
      subtypeToGroup[sub] = group;
    });
  });

  // Comparison Mode State
  const [compareMode, setCompareMode] = useState('M'); // 'M', 'Q', 'Y'

  // Hide Zero Balances State
  const [hideZero, setHideZero] = useState(false);

  // Expanded nodes state
  const [expandedNodes, setExpandedNodes] = useState({
    '1': true,
    '2': true,
    '3': true
  });

  const isNodeExpanded = (code) => {
    return expandedNodes[code] !== false;
  };

  const toggleNode = (code) => {
    setExpandedNodes(prev => ({
      ...prev,
      [code]: isNodeExpanded(code) ? false : true
    }));
  };

  const expandToLevel = (targetLevel) => {
    const nextExpanded = {};
    const traverse = (nodeCode, level) => {
      nextExpanded[nodeCode] = level < targetLevel;
      const node = { ...assetNodes[nodeCode], ...liabilityNodes[nodeCode], ...allDebtNodes[nodeCode] };
      if (node && node.children) {
        node.children.forEach(child => traverse(child, level + 1));
      }
    };
    traverse('1', 1);
    traverse('2', 1);
    traverse('3', 1);
    setExpandedNodes(nextExpanded);
  };

  const TYPE_SUBTYPES = {
    '1': [],
    '2': [],
    '6': [],
    '7': []
  };

  Object.keys(subtypeToCategoryMap).forEach(st => {
    const types = subtypeTypes[st] || [];
    if (types.length > 0) {
      types.forEach(t => {
        if (TYPE_SUBTYPES[t]) {
          TYPE_SUBTYPES[t].push(st);
        }
      });
    } else {
      const defaults = {
        'Banks': '1', 'Fixed Assets': '1',
        'Personal Debt': '2', 'Other Debts': '2',
        'Living & Household': '6', 'Personal Transports': '6', 'Public Transports': '6', 'Other Transports': '6',
        'Markets & Consumables': '6', 'Health': '6', 'Entertainment': '6', 'Education': '6',
        'Insurances': '6', 'Taxes & State': '6', 'Financial Expenses': '6',
        'Payroll': '7', 'Other Income': '7', 'Financial Income': '7'
      };
      const t = defaults[st] || '6';
      if (TYPE_SUBTYPES[t]) {
        TYPE_SUBTYPES[t].push(st);
      }
    }
  });

  const findSubtype = (code, category) => {
    const typeDigit = code[0];
    const allowed = TYPE_SUBTYPES[typeDigit] || [];
    for (const st of allowed) {
      const cats = subtypeToCategoryMap[st] || [];
      if (cats.includes(category)) {
        return st;
      }
    }
    return 'Other';
  };

  const buildHierarchy = (flatList, rootCode) => {
    const nodes = {};
    const rootName = rootCode === '1' ? 'Assets' : 'Liabilities';
    
    // Initialize root node
    nodes[rootCode] = {
      code: rootCode,
      name: rootName,
      level: 1,
      balance: 0,
      children: []
    };

    // Process each leaf item
    if (flatList) {
      flatList.forEach(item => {
        const code = item.code;
        const balance = Number(item.balance) || 0;

        // Parse subtype from account name (this is the category)
        const parsed = parseAccountName(code, item.name);
        const category = parsed.subtype;
        const subtype = findSubtype(code, category);

        const subtypeCode = `${rootCode}_st_${subtype}`;
        const categoryCode = `${rootCode}_cat_${category}`;

        // Ensure Level 2 (Subtype) exists
        if (!nodes[subtypeCode]) {
          nodes[subtypeCode] = {
            code: subtypeCode,
            name: subtype,
            level: 2,
            balance: 0,
            children: []
          };
          nodes[rootCode].children.push(subtypeCode);
        }

        // Ensure Level 3 (Category) exists under this Subtype
        if (!nodes[categoryCode]) {
          nodes[categoryCode] = {
            code: categoryCode,
            name: category,
            level: 3,
            balance: 0,
            children: []
          };
          nodes[subtypeCode].children.push(categoryCode);
        }

        // Add Level 4 (Account Name) node under this Category
        nodes[code] = {
          code,
          name: item.name,
          level: 4,
          balance,
          children: []
        };
        nodes[categoryCode].children.push(code);
      });
    }

    // Compute balances bottom-up recursively
    const computeBalance = (nodeCode) => {
      const node = nodes[nodeCode];
      if (!node) return 0;
      if (node.children.length === 0) {
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
      
      // If hideZero is checked and node balance is 0, skip this node and its children
      if (hideZero && node.balance === 0) return;
      
      list.push(node);
      
      const isExpanded = isNodeExpanded(nodeCode);
      if (isExpanded && node.children.length > 0) {
        node.children.sort().forEach(childCode => {
          traverse(childCode);
        });
      }
    };
    traverse(rootCode);
    return list;
  };

  // Determine current active filter values based on today's calendar date (aligned with P&L)
  const today = new Date();
  const activeYear = String(today.getFullYear());
  const activeMonth = monthNames[today.getMonth()];
  const activeQuarter = 'Q' + (Math.floor(today.getMonth() / 3) + 1);

  // Calculate previous period details
  const getPreviousPeriod = (year, quarter, month, type) => {
    if (type === 'Y') {
      return { prevYear: String(Number(year) - 1), prevQuarter: quarter, prevMonth: month };
    }
    if (type === 'Q') {
      const qNum = Number(quarter.replace('Q', ''));
      if (qNum === 1) {
        return { prevYear: String(Number(year) - 1), prevQuarter: 'Q4', prevMonth: month };
      } else {
        return { prevYear: year, prevQuarter: 'Q' + (qNum - 1), prevMonth: month };
      }
    }
    const mIdx = monthNames.indexOf(month);
    if (mIdx === 0) {
      return { prevYear: String(Number(year) - 1), prevQuarter: quarter, prevMonth: 'December' };
    } else {
      return { prevYear: year, prevQuarter: quarter, prevMonth: monthNames[mIdx - 1] };
    }
  };

  const { prevYear, prevQuarter, prevMonth } = getPreviousPeriod(activeYear, activeQuarter, activeMonth, compareMode);

  // Column Headers Name mapping
  const getColHeaders = () => {
    if (compareMode === 'M') {
      return {
        col1: activeMonth.slice(0, 3) + ' ' + activeYear,
        col2: prevMonth.slice(0, 3) + ' ' + prevYear
      };
    }
    if (compareMode === 'Q') {
      return {
        col1: activeQuarter + ' ' + activeYear,
        col2: prevQuarter + ' ' + prevYear
      };
    }
    return {
      col1: activeYear,
      col2: prevYear
    };
  };
  const { col1: col1Header, col2: col2Header } = getColHeaders();

  // Balance Sheet snapshot calculation helper
  const isCompleted = (status) => ['Completed', 'Paid', 'Paid on Time', 'Paid Late'].includes(status);

  const getBalancesAtPoint = (targetYear, targetQuarter, targetMonth, type) => {
    const allCompletedInflows = allTxs
      .filter(tx => tx.transaction_type === 'Income' && isCompleted(tx.payment_status))
      .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
    const allCompletedOutflows = allTxs
      .filter(tx => tx.transaction_type === 'Expense' && isCompleted(tx.payment_status))
      .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
    const baselineCash = userGold - allCompletedInflows + allCompletedOutflows;

    const filterTx = (tx) => {
      if (!isCompleted(tx.payment_status)) return false;
      const txYear = tx.year || new Date(tx.posting_date).getFullYear();
      const txMonth = tx.month || new Date(tx.posting_date).toLocaleString('default', { month: 'long' });
      const txQuarter = tx.quarter || 'Q' + (Math.floor(new Date(tx.posting_date).getMonth() / 3) + 1);

      if (type === 'M') {
        return isBeforeOrInMonth(txYear, txMonth, targetYear, targetMonth);
      } else if (type === 'Q') {
        return isBeforeOrInQuarter(txYear, txQuarter, targetYear, targetQuarter);
      } else {
        return isBeforeOrInYear(txYear, targetYear);
      }
    };

    const txsUpToTarget = allTxs.filter(filterTx);

    const inflowsUpToTarget = txsUpToTarget
      .filter(tx => tx.transaction_type === 'Income')
      .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
    const outflowsUpToTarget = txsUpToTarget
      .filter(tx => tx.transaction_type === 'Expense')
      .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

    const cashAtTarget = baselineCash + inflowsUpToTarget - outflowsUpToTarget;

    const balances = {};
    Object.keys(accountMappings).forEach(code => {
      balances[code] = 0;
    });
    balances['111001'] = cashAtTarget;

    txsUpToTarget.forEach(tx => {
      const amt = Number(tx.amount) || 0;
      if (tx.transaction_type === 'Assets') {
        const src = tx.source_dest_bank;
        const tgt = tx.target_account;
        if (tx.flow === 'neutral') {
          if (src && src in balances) balances[src] -= amt;
          if (tgt && tgt in balances) balances[tgt] += amt;
        } else if (tx.flow === 'inflow') {
          if (tgt && tgt in balances) balances[tgt] += amt;
        } else if (tx.flow === 'outflow') {
          if (src && src in balances) balances[src] -= amt;
        }
      } else if (tx.transaction_type === 'Liabilities') {
        const src = tx.source_dest_bank;
        const tgt = tx.target_account;
        if (tx.flow === 'inflow') {
          if (tgt && tgt in balances) balances[tgt] += amt;
          if (src && src in balances) balances[src] += amt;
        } else if (tx.flow === 'outflow') {
          if (tgt && tgt in balances) balances[tgt] -= amt;
          if (src && src in balances) balances[src] -= amt;
        }
      }
    });

    return balances;
  };

  const currentBalances = getBalancesAtPoint(activeYear, activeQuarter, activeMonth, compareMode);
  const previousBalances = getBalancesAtPoint(prevYear, prevQuarter, prevMonth, compareMode);

  const sumNodeBalance = (nodeCode, balancesMap) => {
    if (nodeCode === '1') {
      let sum = 0;
      Object.entries(balancesMap).forEach(([code, val]) => {
        if (code.startsWith('1') && !otherCodes.has(code)) {
          sum += val;
        }
      });
      return sum;
    }

    if (nodeCode === '3') {
      let sum = 0;
      const getLeaves = (code) => {
        const node = allDebtNodes[code];
        if (!node) return;
        if (node.children.length === 0 && /^\d{8}$/.test(node.code)) {
          const actualCode = node.code.replace(/^3/, '1');
          sum += (balancesMap[actualCode] || 0);
        } else {
          node.children.forEach(getLeaves);
        }
      };
      getLeaves('3');
      return sum;
    }

    if (nodeCode.startsWith('3')) {
      let sum = 0;
      const getLeaves = (code) => {
        const node = allDebtNodes[code];
        if (!node) return;
        if (node.children.length === 0 && /^\d{8}$/.test(node.code)) {
          const actualCode = node.code.replace(/^3/, '1');
          sum += (balancesMap[actualCode] || 0);
        } else {
          node.children.forEach(getLeaves);
        }
      };
      getLeaves(nodeCode);
      return sum;
    }

    let sum = 0;
    Object.entries(balancesMap).forEach(([code, val]) => {
      if (code.startsWith(nodeCode)) {
        sum += val;
      }
    });
    return sum;
  };

  // Cash Flow Calculations
  const getCashFlowAtPeriod = (targetYear, targetQuarter, targetMonth, type) => {
    const filterTxExact = (tx) => {
      if (!isCompleted(tx.payment_status)) return false;
      const txYear = String(tx.year || new Date(tx.posting_date).getFullYear());
      const txMonth = tx.month || new Date(tx.posting_date).toLocaleString('default', { month: 'long' });
      const txQuarter = tx.quarter || 'Q' + (Math.floor(new Date(tx.posting_date).getMonth() / 3) + 1);

      if (type === 'M') {
        return txYear === String(targetYear) && txMonth === targetMonth;
      } else if (type === 'Q') {
        return txYear === String(targetYear) && txQuarter === targetQuarter;
      } else {
        return txYear === String(targetYear);
      }
    };

    const txsInPeriod = allTxs.filter(filterTxExact);
    const entityMappings = useKingdomStore.getState().entityMappings || {};
    
    const operatingFlows = {};
    const financingFlows = {};

    txsInPeriod.forEach(tx => {
      if (tx.transaction_type === 'Income' || tx.transaction_type === 'Expense') {
        const cat = entityMappings[tx.entity] || tx.transaction_category || 'Other';
        const amt = Number(tx.amount) || 0;
        if (tx.transaction_type === 'Income') {
          financingFlows[cat] = (financingFlows[cat] || 0) + amt;
        } else {
          operatingFlows[cat] = (operatingFlows[cat] || 0) - amt;
        }
      }
    });

    const sumOperating = Object.values(operatingFlows).reduce((sum, v) => sum + v, 0);
    const sumFinancing = Object.values(financingFlows).reduce((sum, v) => sum + v, 0);

    return {
      operating: operatingFlows,
      investing: {},
      financing: financingFlows,
      netOperating: sumOperating,
      netInvesting: 0,
      netFinancing: sumFinancing,
      netCashFlow: sumOperating + sumFinancing
    };
  };

  const currentCashFlow = getCashFlowAtPeriod(activeYear, activeQuarter, activeMonth, compareMode);
  const previousCashFlow = getCashFlowAtPeriod(prevYear, prevQuarter, prevMonth, compareMode);

  // Render unified statement rows containing both left-side normal value and right-side comparison columns
  const renderStatementRows = (nodes, rootCode) => {
    const list = getRenderList(nodes, rootCode);
    
    return list.map((node) => {
      const hasChildren = node.children.length > 0;
      const isExpanded = isNodeExpanded(node.code);
      const indentClass = 
        node.level === 1 ? 'pl-0 font-black text-[#4b2c20] text-[9.5px] uppercase' :
        node.level === 2 ? 'pl-3 font-bold text-[#8b4513] text-[9.5px]' :
        node.level === 3 ? 'pl-6 font-semibold text-[#5d4037] text-[9px]' :
        'pl-9 font-medium text-[#5d4037]/85 text-[8.5px] italic';

      const icon = node.level === 1 ? '👑' : node.level === 2 ? '📁' : node.level === 3 ? '📂' : '📄';

      const currentVal = sumNodeBalance(node.code, currentBalances);
      const previousVal = sumNodeBalance(node.code, previousBalances);
      const diff = currentVal - previousVal;

      return (
        <div 
          key={node.code} 
          className={`flex justify-between items-center py-1 border-b border-[#8b4513]/5 hover:bg-[#8b4513]/5 transition-colors duration-150 ${node.level === 1 ? 'bg-[#8b4513]/5 mt-2 rounded px-1' : ''}`}
        >
          {/* Left Side (53% Width) - Name and Sidebar Value */}
          <div className="w-[53%] flex justify-between items-center pr-2">
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
            <span className={`font-mono font-bold ${node.code.startsWith('1') ? 'text-emerald-700' : 'text-rose-700'} text-[9px]`}>
              {formatNumberCompact(node.balance)}
            </span>
          </div>

          {/* Right Side (47% Width) - Comparative Columns */}
          <div className="w-[47%] flex justify-end gap-3 font-mono text-[8.5px] text-right font-bold">
            <span className={`w-[75px] ${node.code.startsWith('1') ? 'text-emerald-700' : 'text-rose-700'}`}>{formatNumberCompact(currentVal)}</span>
            <span className="w-[75px] text-[#5d4037]/70">{formatNumberCompact(previousVal)}</span>
            <span className={`w-[80px] ${diff >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              {diff > 0 ? `+${formatNumberCompact(diff).replace('+', '')}` : formatNumberCompact(diff)}
            </span>
          </div>
        </div>
      );
    });
  };

  // Build Balance Sheet Hierarchy
  const { assets: bsAssets = {}, liabilities: bsLiabilities = {}, equity: bsEquity = {} } = balanceSheet || {};
  const assetNodes = buildHierarchy(bsAssets.list || [], '1');
  const liabilityNodes = buildHierarchy(bsLiabilities.list || [], '2');

  const allDebtNodes = {};
  allDebtNodes['3'] = {
    code: '3',
    name: 'All debt',
    level: 1,
    balance: 0,
    children: []
  };

  const otherCodes = new Set();
  const otherNodeKey = Object.keys(assetNodes).find(key => key.endsWith('_st_Other') || assetNodes[key]?.name === 'Other');
  if (otherNodeKey && assetNodes[otherNodeKey]) {
    const collectLeafCodes = (key) => {
      const node = assetNodes[key];
      if (!node) return;
      if (node.children.length === 0 && /^\d{8}$/.test(node.code)) {
        otherCodes.add(node.code);
      } else {
        node.children.forEach(collectLeafCodes);
      }
    };
    collectLeafCodes(otherNodeKey);

    // Copy subtree to allDebtNodes starting with '3' prefix
    const copySubtree = (oldKey, newParentKey) => {
      const node = assetNodes[oldKey];
      if (!node) return;
      
      const newKey = oldKey.replace(/^1_/, '3_').replace(/^10/, '30');
      const newChildren = [];
      
      allDebtNodes[newKey] = {
        ...node,
        code: newKey,
        children: newChildren
      };
      allDebtNodes[newParentKey].children.push(newKey);
      
      node.children.forEach(childKey => {
        copySubtree(childKey, newKey);
      });
    };
    
    copySubtree(otherNodeKey, '3');
    
    // Delete 'Other' from Assets
    if (assetNodes['1']) {
      assetNodes['1'].children = assetNodes['1'].children.filter(k => k !== otherNodeKey);
    }
    const keysToDelete = [];
    const collectKeys = (key) => {
      keysToDelete.push(key);
      if (assetNodes[key]?.children) {
        assetNodes[key].children.forEach(collectKeys);
      }
    };
    collectKeys(otherNodeKey);
    keysToDelete.forEach(k => {
      delete assetNodes[k];
    });
  }

  // Recalculate Assets root balance after deleting the Other subtree
  const recalcAssetBalance = (nodeCode) => {
    const node = assetNodes[nodeCode];
    if (!node) return 0;
    if (node.children.length === 0) {
      return node.balance;
    }
    let sum = 0;
    node.children.forEach(childCode => {
      sum += recalcAssetBalance(childCode);
    });
    node.balance = sum;
    return sum;
  };
  if (assetNodes['1']) {
    recalcAssetBalance('1');
  }

  // Compute balances bottom-up recursively for allDebtNodes
  const computeAllDebtBalance = (nodeCode) => {
    const node = allDebtNodes[nodeCode];
    if (!node) return 0;
    if (node.children.length === 0) {
      return node.balance;
    }
    let sum = 0;
    node.children.forEach(childCode => {
      sum += computeAllDebtBalance(childCode);
    });
    node.balance = sum;
    return sum;
  };
  computeAllDebtBalance('3');


  // Left Header Controls Render (Levels and Zero Hider)
  const renderLeftHeaderControls = (hasLevelSelect = true) => {
    return (
      <div className="flex items-center gap-2">
        {hasLevelSelect && (
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4].map(lvl => (
              <button
                key={lvl}
                type="button"
                onClick={() => expandToLevel(lvl)}
                className="w-5 h-5 rounded bg-[#8b4513]/10 text-[#8b4513] font-bold text-[9px] hover:bg-[#8b4513] hover:text-white transition-colors cursor-pointer"
              >
                {lvl}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setExpandedNodes({})}
              className="w-5 h-5 rounded bg-[#8b4513]/10 text-[#8b4513] font-bold text-[9px] hover:bg-[#8b4513] hover:text-white transition-colors cursor-pointer flex items-center justify-center"
              title="Collapse All"
            >
              Ø
            </button>
          </div>
        )}
        <label className="flex items-center gap-1 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={hideZero}
            onChange={(e) => setHideZero(e.target.checked)}
            className="rounded border-[#8b4513]/30 text-[#8b4513] focus:ring-[#8b4513] w-3 h-3 cursor-pointer"
          />
          <span className="text-[9px] text-[#5d4037]/80 font-bold uppercase tracking-wider">Hide Zero Balances</span>
        </label>
      </div>
    );
  };

  // Right Header Controls Render (Period Buttons)
  const renderRightHeaderControls = () => {
    return (
      <div className="flex justify-end items-center gap-1">
        {['M', 'Q', 'Y'].map(mode => {
          const isSelected = compareMode === mode;
          return (
            <button
              key={mode}
              onClick={() => setCompareMode(mode)}
              className={`w-7 h-7 rounded border font-black text-[9.5px] uppercase transition-all flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 ${
                isSelected
                  ? 'bg-[#8b4513] border-[#8b4513] text-[#ffd700] shadow-sm'
                  : 'bg-[#faf4e5]/80 border-[#8b4513]/20 text-[#5d4037]/80 hover:bg-[#8b4513]/10 hover:text-[#4b2c20]'
              }`}
            >
              {mode}
            </button>
          );
        })}
      </div>
    );
  };

  // Unified Columns Header Row
  const renderUnifiedHeader = () => {
    return (
      <div className="flex justify-between items-center py-1 font-bold text-[#8b4513] border-b border-[#8b4513]/15 text-[8.5px] uppercase tracking-wider mb-2">
        {/* Left Side Header (53%) */}
        <div className="w-[53%] flex justify-between pr-2">
          <span></span>
          <span></span>
        </div>
        {/* Right Side Header (47%) */}
        <div className="w-[47%] flex justify-end gap-3 text-right">
          <span className="w-[75px]">{col1Header}</span>
          <span className="w-[75px]">{col2Header}</span>
          <span className="w-[80px]">Difference</span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* 1. IMPERIAL BALANCE SHEET */}
      {(show === 'all' || show === 'balanceSheet') && (
        <div className="bg-[#faf4e5]/60 border border-[#8b4513]/25 rounded-xl p-4 shadow-sm flex flex-col space-y-3">
          <div className="flex justify-between items-center border-b border-[#8b4513]/10 pb-2 mb-1">
            {renderLeftHeaderControls(true)}
            {renderRightHeaderControls()}
          </div>

          {renderUnifiedHeader()}

          <div className="space-y-6">
            {/* Assets Section */}
            <div className="space-y-3">
              <div className="space-y-1 text-[9.5px]">
                {renderStatementRows(assetNodes, '1')}
              </div>
            </div>

            {/* Liabilities Section */}
            <div className="space-y-3">
              <div className="space-y-1 text-[9.5px]">
                {renderStatementRows(liabilityNodes, '2')}
              </div>
            </div>

            {/* All Debt Section */}
            <div className="space-y-3">
              <div className="space-y-1 text-[9.5px]">
                {renderStatementRows(allDebtNodes, '3')}
              </div>
            </div>

            {/* Equity Section Summary */}
            <div className="flex justify-between items-center bg-[#f4e4bc]/50 border border-[#8b4513]/15 rounded-lg p-2 mt-2">
              {/* Left Side (53% Width) - Name and Sidebar Value */}
              <div className="w-[53%] flex justify-between items-center pr-2">
                <div className="pl-0 font-black text-[#4b2c20] text-[9.5px] uppercase flex items-center gap-1.5">
                  <span>🛡️</span>
                  <span>{t('accumulated_wealth', 'Accumulated Wealth (Net Equity)')}</span>
                </div>
                <span className={`font-mono font-bold ${bsEquity.accumulatedWealth >= 0 ? 'text-emerald-700' : 'text-rose-700'} text-[9.5px]`}>
                  {formatNumberCompact(bsEquity.accumulatedWealth)}
                </span>
              </div>

              {/* Right Side (47% Width) - Comparative Columns */}
              <div className="w-[47%] flex justify-end gap-3 font-mono text-[8.5px] text-right font-bold">
                <span className={`w-[75px] ${sumNodeBalance('1', currentBalances) - sumNodeBalance('2', currentBalances) + sumNodeBalance('3', currentBalances) >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {formatNumberCompact(sumNodeBalance('1', currentBalances) - sumNodeBalance('2', currentBalances) + sumNodeBalance('3', currentBalances))}
                </span>
                <span className="w-[75px] text-[#5d4037]/70">
                  {formatNumberCompact(sumNodeBalance('1', previousBalances) - sumNodeBalance('2', previousBalances) + sumNodeBalance('3', previousBalances))}
                </span>
                <span className={`w-[80px] ${(sumNodeBalance('1', currentBalances) - sumNodeBalance('2', currentBalances) + sumNodeBalance('3', currentBalances)) - (sumNodeBalance('1', previousBalances) - sumNodeBalance('2', previousBalances) + sumNodeBalance('3', previousBalances)) >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {((sumNodeBalance('1', currentBalances) - sumNodeBalance('2', currentBalances) + sumNodeBalance('3', currentBalances)) - (sumNodeBalance('1', previousBalances) - sumNodeBalance('2', previousBalances) + sumNodeBalance('3', previousBalances))) > 0 ? '+' : ''}
                  {formatNumberCompact((sumNodeBalance('1', currentBalances) - sumNodeBalance('2', currentBalances) + sumNodeBalance('3', currentBalances)) - (sumNodeBalance('1', previousBalances) - sumNodeBalance('2', previousBalances) + sumNodeBalance('3', previousBalances)))}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. TREASURY CASH FLOW STATEMENT */}
      {(show === 'all' || show === 'cashFlow') && (
        <div className="bg-[#faf4e5]/60 border border-[#8b4513]/25 rounded-xl p-4 shadow-sm flex flex-col space-y-3">
          <div className="flex justify-between items-center border-b border-[#8b4513]/10 pb-2 mb-1">
            {renderLeftHeaderControls(false)}
            {renderRightHeaderControls()}
          </div>

          {renderUnifiedHeader()}

          <div className="space-y-4">
            
            {/* Operating Cash Flows */}
            <div className="bg-[#faf4e5]/40 border border-[#8b4513]/10 rounded-lg p-3">
              <h5 className="title-font text-[9px] font-black text-[#8b4513]/95 uppercase tracking-wider border-b border-[#8b4513]/5 pb-1">
                ⚙️ {t('operating_activities', 'Operating Activities')}
              </h5>
              <div className="space-y-1.5 text-[8.5px] mt-2">
                {cashFlowStatement?.operating && cashFlowStatement.operating.length > 0 ? (
                  cashFlowStatement.operating
                    .filter(item => !hideZero || item.amount !== 0)
                    .map((item, idx) => {
                      const cur = currentCashFlow.operating[item.name] || 0;
                      const prev = previousCashFlow.operating[item.name] || 0;
                      const diff = cur - prev;
                      return (
                        <div key={idx} className="flex justify-between items-center py-0.5 border-b border-[#8b4513]/5 hover:bg-[#8b4513]/5 transition-colors">
                          <div className="w-[53%] flex justify-between pr-2">
                            <span className="font-bold text-[#5d4037]">{item.name}</span>
                            <span className={`font-mono font-bold ${item.amount >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{formatNumberCompact(item.amount)}</span>
                          </div>
                          <div className="w-[47%] flex justify-end gap-3 font-mono text-[8.5px] text-right font-bold">
                            <span className="w-[75px] text-rose-700">{formatNumberCompact(cur)}</span>
                            <span className="w-[75px] text-[#5d4037]/70">{formatNumberCompact(prev)}</span>
                            <span className={`w-[80px] ${diff >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                              {diff > 0 ? `+${formatNumberCompact(diff).replace('+', '')}` : formatNumberCompact(diff)}
                            </span>
                          </div>
                        </div>
                      );
                    })
                ) : (
                  <div className="py-2 text-center text-[8px] text-[#5d4037]/50 italic font-serif">
                    {t('no_operating_flows', 'No operating cash flows.')}
                  </div>
                )}
                <div className="flex justify-between items-center text-[9px] font-bold text-[#4b2c20] pt-1.5 border-t border-[#8b4513]/10 mt-1">
                  <div className="w-[53%] flex justify-between pr-2">
                    <span>{t('net_operating', 'Net Operating')}</span>
                    <span className={`font-mono ${cashFlowStatement?.netOperating >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{formatNumberCompact(cashFlowStatement?.netOperating)}</span>
                  </div>
                  <div className="w-[47%] flex justify-end gap-3 font-mono text-[9px] text-right font-black">
                    <span className="w-[75px] text-rose-700">{formatNumberCompact(currentCashFlow.netOperating)}</span>
                    <span className="w-[75px] text-[#5d4037]/75">{formatNumberCompact(previousCashFlow.netOperating)}</span>
                    <span className={`w-[80px] ${currentCashFlow.netOperating - previousCashFlow.netOperating >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {formatNumberCompact(currentCashFlow.netOperating - previousCashFlow.netOperating)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Investing Cash Flows */}
            <div className="bg-[#faf4e5]/40 border border-[#8b4513]/10 rounded-lg p-3">
              <h5 className="title-font text-[9px] font-black text-[#8b4513]/95 uppercase tracking-wider border-b border-[#8b4513]/5 pb-1">
                🛡️ {t('investing_activities', 'Investing Activities')}
              </h5>
              <div className="space-y-1.5 text-[8.5px] mt-2">
                {cashFlowStatement?.investing && cashFlowStatement.investing.length > 0 ? (
                  cashFlowStatement.investing
                    .filter(item => !hideZero || item.amount !== 0)
                    .map((item, idx) => {
                      const cur = currentCashFlow.investing[item.name] || 0;
                      const prev = previousCashFlow.investing[item.name] || 0;
                      const diff = cur - prev;
                      return (
                        <div key={idx} className="flex justify-between items-center py-0.5 border-b border-[#8b4513]/5 hover:bg-[#8b4513]/5 transition-colors">
                          <div className="w-[53%] flex justify-between pr-2">
                            <span className="font-bold text-[#5d4037]">{item.name}</span>
                            <span className={`font-mono font-bold ${item.amount >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{formatNumberCompact(item.amount)}</span>
                          </div>
                          <div className="w-[47%] flex justify-end gap-3 font-mono text-[8.5px] text-right font-bold">
                            <span className="w-[75px] text-emerald-700">{formatNumberCompact(cur)}</span>
                            <span className="w-[75px] text-[#5d4037]/70">{formatNumberCompact(prev)}</span>
                            <span className={`w-[80px] ${diff >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                              {diff > 0 ? `+${formatNumberCompact(diff).replace('+', '')}` : formatNumberCompact(diff)}
                            </span>
                          </div>
                        </div>
                      );
                    })
                ) : (
                  <div className="py-2 text-center text-[8px] text-[#5d4037]/50 italic font-serif">
                    {t('no_investing_flows', 'No investing cash flows.')}
                  </div>
                )}
                <div className="flex justify-between items-center text-[9px] font-bold text-[#4b2c20] pt-1.5 border-t border-[#8b4513]/10 mt-1">
                  <div className="w-[53%] flex justify-between pr-2">
                    <span>{t('net_investing', 'Net Investing')}</span>
                    <span className={`font-mono ${cashFlowStatement?.netInvesting >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{formatNumberCompact(cashFlowStatement?.netInvesting)}</span>
                  </div>
                  <div className="w-[47%] flex justify-end gap-3 font-mono text-[9px] text-right font-black">
                    <span className="w-[75px] text-emerald-700">{formatNumberCompact(currentCashFlow.netInvesting)}</span>
                    <span className="w-[75px] text-[#5d4037]/75">{formatNumberCompact(previousCashFlow.netInvesting)}</span>
                    <span className={`w-[80px] ${currentCashFlow.netInvesting - previousCashFlow.netInvesting >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {formatNumberCompact(currentCashFlow.netInvesting - previousCashFlow.netInvesting)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Financing Cash Flows */}
            <div className="bg-[#faf4e5]/40 border border-[#8b4513]/10 rounded-lg p-3">
              <h5 className="title-font text-[9px] font-black text-[#8b4513]/95 uppercase tracking-wider border-b border-[#8b4513]/5 pb-1">
                🏦 {t('financing_activities', 'Financing Activities')}
              </h5>
              <div className="space-y-1.5 text-[8.5px] mt-2">
                {cashFlowStatement?.financing && cashFlowStatement.financing.length > 0 ? (
                  cashFlowStatement.financing
                    .filter(item => !hideZero || item.amount !== 0)
                    .map((item, idx) => {
                      const cur = currentCashFlow.financing[item.name] || 0;
                      const prev = previousCashFlow.financing[item.name] || 0;
                      const diff = cur - prev;
                      return (
                        <div key={idx} className="flex justify-between items-center py-0.5 border-b border-[#8b4513]/5 hover:bg-[#8b4513]/5 transition-colors">
                          <div className="w-[53%] flex justify-between pr-2">
                            <span className="font-bold text-[#5d4037]">{item.name}</span>
                            <span className={`font-mono font-bold ${item.amount >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{formatNumberCompact(item.amount)}</span>
                          </div>
                          <div className="w-[47%] flex justify-end gap-3 font-mono text-[8.5px] text-right font-bold">
                            <span className="w-[75px] text-emerald-700">{formatNumberCompact(cur)}</span>
                            <span className="w-[75px] text-[#5d4037]/70">{formatNumberCompact(prev)}</span>
                            <span className={`w-[80px] ${diff >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                              {diff > 0 ? `+${formatNumberCompact(diff).replace('+', '')}` : formatNumberCompact(diff)}
                            </span>
                          </div>
                        </div>
                      );
                    })
                ) : (
                  <div className="py-2 text-center text-[8px] text-[#5d4037]/50 italic font-serif">
                    {t('no_financing_flows', 'No financing cash flows.')}
                  </div>
                )}
                <div className="flex justify-between items-center text-[9px] font-bold text-[#4b2c20] pt-1.5 border-t border-[#8b4513]/10 mt-1">
                  <div className="w-[53%] flex justify-between pr-2">
                    <span>{t('net_financing', 'Net Financing')}</span>
                    <span className={`font-mono ${cashFlowStatement?.netFinancing >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{formatNumberCompact(cashFlowStatement?.netFinancing)}</span>
                  </div>
                  <div className="w-[47%] flex justify-end gap-3 font-mono text-[9px] text-right font-black">
                    <span className="w-[75px] text-emerald-700">{formatNumberCompact(currentCashFlow.netFinancing)}</span>
                    <span className="w-[75px] text-[#5d4037]/75">{formatNumberCompact(previousCashFlow.netFinancing)}</span>
                    <span className={`w-[80px] ${currentCashFlow.netFinancing - previousCashFlow.netFinancing >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {formatNumberCompact(currentCashFlow.netFinancing - previousCashFlow.netFinancing)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Net Cash Flow Footer */}
            <div className="flex justify-between items-center bg-[#f4e4bc]/50 border border-[#8b4513]/15 rounded-lg p-2.5 font-serif text-[10px] font-black uppercase text-[#4b2c20] tracking-wide mt-2">
              <div className="w-[53%] flex justify-between pr-2">
                <span>💰 {t('net_cash_flow', 'Net Cash Flow (Periodic Change)')}</span>
                <span className={`font-mono text-xs ${cashFlowStatement?.netCashFlow >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {formatNumberCompact(cashFlowStatement?.netCashFlow)}
                </span>
              </div>
              <div className="w-[47%] flex justify-end gap-3 font-mono text-[10px] text-right font-black">
                <span className="w-[75px]">{formatNumberCompact(currentCashFlow.netCashFlow)}</span>
                <span className="w-[75px] text-[#5d4037]/75">{formatNumberCompact(previousCashFlow.netCashFlow)}</span>
                <span className={`w-[80px] ${currentCashFlow.netCashFlow - previousCashFlow.netCashFlow >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {formatNumberCompact(currentCashFlow.netCashFlow - previousCashFlow.netCashFlow)}
                </span>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
