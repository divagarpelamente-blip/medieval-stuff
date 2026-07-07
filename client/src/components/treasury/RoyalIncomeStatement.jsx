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

export default function RoyalIncomeStatement({ incomeStatement, t, formatNumberCompact, selectedYears = [], selectedQuarters = [], selectedMonths = [] }) {
  const allTxs = useKingdomStore(state => state.transactions) || [];
  const storeSubtypeToCategoryMap = useKingdomStore(state => state.subtypeToCategoryMap) || {};
  const defaultSubtypeToCategoryMap = {
    "Banks": ["Bank account", "Savings account", "Investments account"],
    "Fixed Assets": ["Fixed Assets"],
    "Personal Debt": ["Loans & Burrow", "Credit Cards"],
    "Other Debts": ["Other Debts"],
    "Living & Household": ["Household", "Utilities"],
    "Personal Transports": ["Gasoline", "Tolls", "Parking", "Repairs"],
    "Public Transports": ["Public Transports"],
    "Other Transports": ["Other Transports"],
    "Markets & Consumables": ["Markets & Groceries", "Markets and Tools", "Markets and Clothing", "Other Market consumables"],
    "Health": ["Health"],
    "Entertainment": ["Entertainment"],
    "Education": ["Education"],
    "Insurances": ["Insurances"],
    "Taxes & State": ["Taxes", "Interest"],
    "Financial Expenses": ["Interest paid", "Fines", "Loans & Burrow", "Credit Cards"],
    "Payroll": ["Salary", "Payroll Subsidies"],
    "Other Income": ["Other Incomes"],
    "Financial Income": ["Fines", "Loans & Burrow", "Credit Cards"]
  };
  const subtypeToCategoryMap = {};
  const allSubtypes = new Set([
    ...Object.keys(defaultSubtypeToCategoryMap),
    ...Object.keys(storeSubtypeToCategoryMap)
  ]);
  allSubtypes.forEach(sub => {
    subtypeToCategoryMap[sub] = Array.from(new Set([
      ...(storeSubtypeToCategoryMap[sub] || []),
      ...(defaultSubtypeToCategoryMap[sub] || [])
    ]));
  });

  const subtypeTypes = useKingdomStore(state => state.subtypeTypes) || {};

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

  // Comparison Mode State
  const [compareMode, setCompareMode] = useState('M'); // 'M', 'Q', 'Y'

  // Hide Zero Balances State
  const [hideZero, setHideZero] = useState(false);

  // Expanded nodes state
  const [expandedNodes, setExpandedNodes] = useState({
    '7': true,
    '6': true,
    '8': true
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
      const node = { ...revenueNodes[nodeCode], ...expenseNodes[nodeCode], ...debtManagementNodes[nodeCode] };
      if (node && node.children) {
        node.children.forEach(child => traverse(child, level + 1));
      }
    };
    traverse('8', 1);
    traverse('6', 1);
    traverse('7', 1);
    setExpandedNodes(nextExpanded);
  };

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
    const rootName = 
      rootCode === '7' ? 'Revenues' : 
      rootCode === '8' ? 'Debt Expenditure' : 
      'Expenses';

    // Initialize root node
    nodes[rootCode] = {
      code: rootCode,
      name: rootName,
      level: 1,
      balance: 0,
      children: []
    };

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

  // Determine current active filter values based on selected filters or today's calendar date
  const today = new Date();
  const activeYear = selectedYears.length > 0 ? String(selectedYears[0]) : String(today.getFullYear());
  const activeMonth = selectedMonths.length > 0 ? selectedMonths[0] : monthNames[today.getMonth()];
  const activeQuarter = selectedQuarters.length > 0 ? selectedQuarters[0] : 'Q' + (Math.floor(today.getMonth() / 3) + 1);

  // Period helpers (aligned with Balance Sheet)
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

  // Helper to filter completed transactions in a specific period
  const isCompleted = (status) => ['Completed', 'Paid', 'Paid on Time', 'Paid Late'].includes(status);

  const getPLBalances = (targetYear, targetQuarter, targetMonth, type, mode = 'exact') => {
    const filterTx = (tx) => {
      if (!isCompleted(tx.payment_status)) return false;
      if (tx.flow === 'neutral') return false;
      const txYear = String(tx.year || new Date(tx.posting_date).getFullYear());
      const txMonth = tx.month || new Date(tx.posting_date).toLocaleString('default', { month: 'long' });
      const txQuarter = tx.quarter || 'Q' + (Math.floor(new Date(tx.posting_date).getMonth() / 3) + 1);

      if (mode === 'exact') {
        if (type === 'M') {
          return txYear === String(targetYear) && txMonth === targetMonth;
        } else if (type === 'Q') {
          return txYear === String(targetYear) && txQuarter === targetQuarter;
        } else {
          return txYear === String(targetYear);
        }
      } else {
        if (type === 'M') {
          return isBeforeOrInMonth(txYear, txMonth, targetYear, targetMonth);
        } else if (type === 'Q') {
          return isBeforeOrInQuarter(txYear, txQuarter, targetYear, targetQuarter);
        } else {
          return isBeforeOrInYear(txYear, targetYear);
        }
      }
    };

    const txsInPeriod = allTxs.filter(filterTx);
    const balances = {};
    Object.keys(accountMappings).forEach(code => {
      if (code.startsWith('6') || code.startsWith('7')) {
        balances[code] = 0;
      }
    });

    txsInPeriod.forEach(tx => {
      const amt = Number(tx.amount) || 0;
      const code = tx.target_account;
      if (code && code in balances) {
        balances[code] += amt;
      }
    });

    return balances;
  };

  const getDebtManagementForPeriod = (targetYear, targetQuarter, targetMonth, type, mode = 'exact') => {
    const filterTx = (tx) => {
      if (!isCompleted(tx.payment_status)) return false;
      if (tx.flow === 'neutral') return false;
      const txYear = String(tx.year || new Date(tx.posting_date).getFullYear());
      const txMonth = tx.month || new Date(tx.posting_date).toLocaleString('default', { month: 'long' });
      const txQuarter = tx.quarter || 'Q' + (Math.floor(new Date(tx.posting_date).getMonth() / 3) + 1);

      if (mode === 'exact') {
        if (type === 'M') return txYear === String(targetYear) && txMonth === targetMonth;
        if (type === 'Q') return txYear === String(targetYear) && txQuarter === targetQuarter;
        return txYear === String(targetYear);
      } else {
        if (type === 'M') return isBeforeOrInMonth(txYear, txMonth, targetYear, targetMonth);
        if (type === 'Q') return isBeforeOrInQuarter(txYear, txQuarter, targetYear, targetQuarter);
        return isBeforeOrInYear(txYear, targetYear);
      }
    };

    const txs = allTxs.filter(filterTx);
    let newDebt = 0;
    let amortization = 0;

    txs.forEach(tx => {
      const src = tx.source_dest_bank || '';
      const tgt = tx.target_account || '';
      const isLiabAccount = src.startsWith('2') || tgt.startsWith('2');

      if (isLiabAccount) {
        const amt = Number(tx.amount) || 0;
        if (tx.flow === 'inflow') {
          newDebt += amt;
        } else if (tx.flow === 'outflow') {
          amortization += amt;
        }
      }
    });

    return { newDebt, amortization };
  };

  const currentDebt = getDebtManagementForPeriod(activeYear, activeQuarter, activeMonth, compareMode, 'exact');
  const previousDebt = getDebtManagementForPeriod(prevYear, prevQuarter, prevMonth, compareMode, 'exact');
  const accumulatedDebt = getDebtManagementForPeriod(activeYear, activeQuarter, activeMonth, compareMode, 'accumulated');

  const currentBalances = getPLBalances(activeYear, activeQuarter, activeMonth, compareMode, 'exact');
  const previousBalances = getPLBalances(prevYear, prevQuarter, prevMonth, compareMode, 'exact');
  const accumulatedBalances = getPLBalances(activeYear, activeQuarter, activeMonth, compareMode, 'accumulated');

  const sumNodeBalance = (nodeCode, balancesMap) => {
    let debtData = accumulatedDebt;
    if (balancesMap === currentBalances) debtData = currentDebt;
    if (balancesMap === previousBalances) debtData = previousDebt;

    if (nodeCode === '8') {
      return debtData.amortization - debtData.newDebt;
    }
    if (nodeCode === '8_new_debt') {
      return debtData.newDebt;
    }
    if (nodeCode === '8_amortization') {
      return debtData.amortization;
    }

    let sum = 0;
    Object.entries(balancesMap).forEach(([code, val]) => {
      if (code.startsWith(nodeCode)) {
        sum += val;
      }
    });
    return sum;
  };

  // Build tree nodes
  const flatRevenues = [];
  const flatExpenses = [];
  Object.entries(accumulatedBalances).forEach(([code, bal]) => {
    if (code.startsWith('7')) {
      flatRevenues.push({
        code,
        name: accountMappings[code] || `Account ${code}`,
        balance: bal
      });
    } else if (code.startsWith('6')) {
      flatExpenses.push({
        code,
        name: accountMappings[code] || `Account ${code}`,
        balance: bal
      });
    }
  });

  const revenueNodes = buildHierarchy(flatRevenues, '7');
  const expenseNodes = buildHierarchy(flatExpenses, '6');

  // Manually construct Debt Overview nodes
  const debtManagementNodes = {
    '8': {
      code: '8',
      name: 'Debt Overview',
      level: 1,
      balance: accumulatedDebt.amortization - accumulatedDebt.newDebt,
      children: ['8_new_debt', '8_amortization']
    },
    '8_new_debt': {
      code: '8_new_debt',
      name: 'New debt',
      level: 2,
      balance: accumulatedDebt.newDebt,
      children: []
    },
    '8_amortization': {
      code: '8_amortization',
      name: 'Amortization',
      level: 2,
      balance: accumulatedDebt.amortization,
      children: []
    }
  };

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
                className="w-6 h-6 rounded border border-[#8b4513]/25 bg-[#faf4e5]/80 hover:bg-[#8b4513]/10 text-[#8b4513] font-bold flex items-center justify-center cursor-pointer text-[10px]"
              >
                {lvl}*
              </button>
            ))}
          </div>
        )}
        {hasLevelSelect && <span className="h-4 w-px bg-[#8b4513]/20"></span>}
        <button
          type="button"
          onClick={() => setHideZero(!hideZero)}
          className={`w-6 h-6 rounded border font-bold flex items-center justify-center cursor-pointer text-[10px] ${hideZero
              ? 'bg-rose-700 border-rose-700 text-[#faf4e5] shadow-sm font-sans'
              : 'border-[#8b4513]/25 bg-[#faf4e5]/80 text-[#8b4513] hover:bg-[#8b4513]/10'
            }`}
          title="Hide Zero Balances"
        >
          Ø
        </button>
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
              className={`w-7 h-7 rounded border font-black text-[9.5px] uppercase tracking-wider transition-all flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 ${isSelected
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
      <div className="flex justify-between items-center py-1 font-bold text-[#8b4513] border-b border-[#8b4513]/15 text-[9px] uppercase tracking-wider mb-2">
        <div className="w-[38%] flex justify-between pr-4">
          <span>Name</span>
        </div>
        <div className="w-[62%] flex justify-end gap-4 text-right">
          <span className="w-[65px]">{col1Header}</span>
          <span className="w-[65px]">{col2Header}</span>
          <span className="w-[70px]">Difference</span>
          <span className="w-[75px]">Accumulated</span>
        </div>
      </div>
    );
  };

  // Render unified statement rows containing both left-side normal value and right-side comparison columns
  const renderStatementRows = (nodes, rootCode) => {
    const list = getRenderList(nodes, rootCode);

    const formatCustomValue = (code, val) => {
      const num = Number(val) || 0;
      const absFormatted = Math.abs(num).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).replace(/,/g, ' ');

      if (code === '8' || code === '8_new_debt' || code === '8_amortization') {
        if (num === 0) return '0.00';
        if (code === '8_new_debt') {
          return `(${absFormatted})`;
        } else if (code === '8_amortization') {
          return `+ ${absFormatted}`;
        } else {
          return num < 0 ? `(${absFormatted})` : `+ ${absFormatted}`;
        }
      }
      return formatNumberCompact(val);
    };

    const formatCustomDiff = (code, val) => {
      if (code === '8' || code === '8_new_debt' || code === '8_amortization') {
        const num = Number(val) || 0;
        const absFormatted = Math.abs(num).toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }).replace(/,/g, ' ');
        if (num === 0) return '0.00';
        return num < 0 ? `(${absFormatted})` : `+ ${absFormatted}`;
      }
      return val > 0 ? `+${formatNumberCompact(val).replace('+', '')}` : formatNumberCompact(val);
    };

    return list.map((node) => {
      const hasChildren = node.children.length > 0;
      const isExpanded = isNodeExpanded(node.code);
      const indentClass =
        node.level === 1 ? 'pl-0 font-black text-[#4b2c20] text-[10px] uppercase' :
          node.level === 2 ? 'pl-3 font-bold text-[#8b4513] text-[10px]' :
            node.level === 3 ? 'pl-6 font-semibold text-[#5d4037] text-[9.5px]' :
              'pl-9 font-medium text-[#5d4037]/85 text-[9px] italic';

      const icon = node.level === 1 ? '👑' : node.level === 2 ? '📁' : node.level === 3 ? '📂' : '📄';

      const currentVal = sumNodeBalance(node.code, currentBalances);
      const previousVal = sumNodeBalance(node.code, previousBalances);
      const diff = currentVal - previousVal;

      const isGreen = node.code.startsWith('7') || node.code === '8_amortization' || (node.code === '8' && sumNodeBalance('8', currentBalances) >= 0);

      return (
        <div
          key={node.code}
          className={`flex justify-between items-center py-1 border-b border-[#8b4513]/5 hover:bg-[#8b4513]/5 transition-colors duration-150 ${node.level === 1 ? 'bg-[#8b4513]/5 mt-2 rounded px-1' : ''}`}
        >
          {/* Left Side (38% Width) - Name only */}
          <div className="w-[38%] flex justify-between items-center pr-4">
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
          </div>

          {/* Right Side (62% Width) - Comparative Columns + Accumulated */}
          <div className="w-[62%] flex justify-end gap-4 font-mono text-[9.5px] text-right font-bold">
            <span className={`w-[65px] ${isGreen ? 'text-emerald-700' : 'text-rose-700'}`}>{formatCustomValue(node.code, currentVal)}</span>
            <span className="w-[65px] text-[#5d4037]/70">{formatCustomValue(node.code, previousVal)}</span>
            <span className={`w-[70px] ${diff >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              {formatCustomDiff(node.code, diff)}
            </span>
            <span className={`w-[75px] ${isGreen ? 'text-emerald-700' : 'text-rose-700'}`}>{formatCustomValue(node.code, node.balance)}</span>
          </div>
        </div>
      );
    });
  };

  const selNet = sumNodeBalance('7', accumulatedBalances) - sumNodeBalance('6', accumulatedBalances) + sumNodeBalance('8', accumulatedBalances);
  const curNet = sumNodeBalance('7', currentBalances) - sumNodeBalance('6', currentBalances) + sumNodeBalance('8', currentBalances);
  const prevNet = sumNodeBalance('7', previousBalances) - sumNodeBalance('6', previousBalances) + sumNodeBalance('8', previousBalances);
  const diffNet = curNet - prevNet;

  return (
    <div className="bg-[#faf4e5]/60 border border-[#8b4513]/25 rounded-xl p-4 shadow-sm flex flex-col space-y-3">
      {/* Title Controls Header */}
      <div className="flex justify-between items-center border-b border-[#8b4513]/10 pb-2 mb-1">
        {renderLeftHeaderControls(true)}
        {renderRightHeaderControls()}
      </div>

      {renderUnifiedHeader()}

      <div className="space-y-6">

        {/* Debt Overview Section */}
        <div className="space-y-3">
          <div className="space-y-1 text-[10px]">
            {renderStatementRows(debtManagementNodes, '8')}
          </div>
        </div>

        {/* Expenses Section */}
        <div className="space-y-3">
          <div className="space-y-1 text-[10px]">
            {renderStatementRows(expenseNodes, '6')}
          </div>
        </div>

        {/* Revenues Section */}
        <div className="space-y-3">
          <div className="space-y-1 text-[10px]">
            {renderStatementRows(revenueNodes, '7')}
          </div>
        </div>

        {/* Net Summary Footer */}
        <div className="flex justify-between items-center bg-[#f4e4bc]/50 border border-[#8b4513]/15 rounded-lg p-2 mt-2">
          {/* Left Side (38% Width) - Name only */}
          <div className="w-[38%] flex justify-between items-center pr-4">
            <div className="pl-0 font-black text-[#4b2c20] text-[10px] uppercase flex items-center gap-1.5">
              <span>🛡️</span>
              <span>{t('net_accrued_income', 'Net Accrued Income')}</span>
            </div>
          </div>

          {/* Right Side (62% Width) - Comparative Columns + Accumulated */}
          <div className="w-[62%] flex justify-end gap-4 font-mono text-[9.5px] text-right font-bold">
            <span className={`w-[65px] ${curNet >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{formatNumberCompact(curNet)}</span>
            <span className="w-[65px] text-[#5d4037]/70">{formatNumberCompact(prevNet)}</span>
            <span className={`w-[70px] ${diffNet >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              {diffNet > 0 ? `+${formatNumberCompact(diffNet).replace('+', '')}` : formatNumberCompact(diffNet)}
            </span>
            <span className={`w-[75px] ${selNet >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{formatNumberCompact(selNet)}</span>
          </div>
        </div>

      </div>
    </div>
  );
}
