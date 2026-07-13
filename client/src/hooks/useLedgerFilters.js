/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react';
import { useKingdomStore } from '../store/useKingdomStore';

export function useLedgerFilters() {
  const transactions = useKingdomStore((state) => state.transactions);

  // Transactions Page Filters state
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(true);
  const [filterYear, setFilterYear] = useState('All');
  const [filterMonth, setFilterMonth] = useState('All');
  const [filterFrom, setFilterFrom] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterClass, setFilterClass] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterEntity, setFilterEntity] = useState('All');
  const [filterAccountCode, setFilterAccountCode] = useState('All');
  const [filterAccountLabel, setFilterAccountLabel] = useState('');
  const [filterBeforeOrInPeriod, setFilterBeforeOrInPeriod] = useState(false);
  const [filterBeforeOrInYear, setFilterBeforeOrInYear] = useState('');
  const [filterBeforeOrInMonth, setFilterBeforeOrInMonth] = useState('');
  const [filterBeforeOrInQuarter, setFilterBeforeOrInQuarter] = useState('');

  // Unified Sidebar Filter state
  const [selectedYears, setSelectedYears] = useState([]);
  const [hasInitializedYears, setHasInitializedYears] = useState(false);
  const [selectedQuarters, setSelectedQuarters] = useState([]);
  const [selectedMonths, setSelectedMonths] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile sidebar toggle

  // Automatically initialize years, quarters, and months filters on load
  useEffect(() => {
    if (!hasInitializedYears) {
      const currentYear = new Date().getFullYear();
      const txYears = Array.from(new Set(transactions.map((tx) => tx.year).filter(Boolean))).map(String);
      const yearsToSelect = txYears.length > 0 ? [txYears.sort((a, b) => b - a)[0]] : [String(currentYear)];
      
      setSelectedYears(yearsToSelect);
      
      const currentMonthIndex = new Date().getMonth();
      const currentQuarterIndex = Math.floor(currentMonthIndex / 3) + 1;
      
      const quartersToSelect = [];
      for (let i = 1; i <= currentQuarterIndex; i++) {
        quartersToSelect.push(`Q${i}`);
      }
      setSelectedQuarters(quartersToSelect);
      
      const allMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      setSelectedMonths(allMonths.slice(0, currentMonthIndex + 1));
      
      setHasInitializedYears(true);
    }
  }, [transactions, hasInitializedYears]);

  // Compute unique years for the ledger view filter selector
  const uniqueYears = Array.from(
    new Set(transactions.map((tx) => tx.year).filter(Boolean))
  ).sort((a, b) => b - a);

  // Period helper functions
  const isBeforeOrInMonth = (txYear, txMonth, targetYear, targetMonth) => {
    const ty = Number(targetYear);
    const my = Number(txYear);
    if (my < ty) return true;
    if (my > ty) return false;
    const allMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return allMonths.indexOf(txMonth) <= allMonths.indexOf(targetMonth);
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

  // Compute filtered transactions for ledger (ordered recent to oldest)
  const filteredTransactions = transactions.filter((tx) => {
    if (filterAccountCode !== 'All') {
      const allowedCodes = filterAccountCode.split(',');
      const src = tx.source_dest_bank || '';
      const tgt = tx.target_account || '';
      const matches = allowedCodes.some(code => src.startsWith(code) || tgt.startsWith(code));
      if (!matches) return false;
    }

    if (filterBeforeOrInPeriod) {
      const txYear = String(tx.year || new Date(tx.posting_date).getFullYear());
      const txMonth = tx.month || new Date(tx.posting_date).toLocaleString('default', { month: 'long' });
      const txQuarter = tx.quarter || 'Q' + (Math.floor(new Date(tx.posting_date).getMonth() / 3) + 1);

      if (filterBeforeOrInMonth) {
        if (!isBeforeOrInMonth(txYear, txMonth, filterBeforeOrInYear, filterBeforeOrInMonth)) return false;
      } else if (filterBeforeOrInQuarter) {
        if (!isBeforeOrInQuarter(txYear, txQuarter, filterBeforeOrInYear, filterBeforeOrInQuarter)) return false;
      } else {
        if (!isBeforeOrInYear(txYear, filterBeforeOrInYear)) return false;
      }
    } else {
      if (filterYear !== 'All' && String(tx.year) !== filterYear) return false;
      if (filterMonth !== 'All' && tx.month !== filterMonth) return false;
    }

    if (filterFrom !== 'All' && tx.from !== filterFrom) return false;
    if (filterStatus !== 'All' && tx.payment_status !== filterStatus) return false;
    if (filterClass !== 'All' && tx.transaction_type !== filterClass) return false;
    if (filterCategory !== 'All' && tx.transaction_category !== filterCategory) return false;
    if (filterEntity !== 'All' && tx.entity !== filterEntity) return false;
    return true;
  }).sort((a, b) => {
    const dateA = new Date(a.posting_date || a.value_date || a.created_at);
    const dateB = new Date(b.posting_date || b.value_date || b.created_at);
    return dateB - dateA;
  });

  // Cascading Filtering Engine for Dashboard
  const isFallbackState = selectedYears.length === 0 || (selectedYears.length > 0 && selectedQuarters.length === 0 && selectedMonths.length === 0);
  
  const quarterToMonths = {
    'Q1': ['January', 'February', 'March'],
    'Q2': ['April', 'May', 'June'],
    'Q3': ['July', 'August', 'September'],
    'Q4': ['October', 'November', 'December']
  };

  const dashboardFilteredTransactions = transactions.filter((tx) => {
    if (isFallbackState) return false;
    if (!selectedYears.includes(String(tx.year))) return false;

    if (selectedQuarters.length > 0 && selectedMonths.length === 0) {
      const allowedMonths = selectedQuarters.flatMap(q => quarterToMonths[q]);
      return allowedMonths.includes(tx.month);
    }

    if (selectedMonths.length > 0 && selectedQuarters.length === 0) {
      return selectedMonths.includes(tx.month);
    }

    if (selectedQuarters.length > 0 && selectedMonths.length > 0) {
      const allowedFromQuarters = selectedQuarters.flatMap(q => quarterToMonths[q]);
      const unionMonths = Array.from(new Set([...allowedFromQuarters, ...selectedMonths]));
      return unionMonths.includes(tx.month);
    }

    return false;
  }).sort((a, b) => new Date(a.posting_date || a.value_date || a.created_at) - new Date(b.posting_date || b.value_date || b.created_at));

  const resetFilters = () => {
    setFilterYear('All');
    setFilterMonth('All');
    setFilterFrom('All');
    setFilterStatus('All');
    setFilterClass('All');
    setFilterCategory('All');
    setFilterEntity('All');
    setFilterAccountCode('All');
    setFilterBeforeOrInPeriod(false);
    setFilterBeforeOrInYear('');
    setFilterBeforeOrInMonth('');
    setFilterBeforeOrInQuarter('');
  };

  return {
    isFiltersExpanded, setIsFiltersExpanded,
    filterYear, setFilterYear,
    filterMonth, setFilterMonth,
    filterFrom, setFilterFrom,
    filterStatus, setFilterStatus,
    filterClass, setFilterClass,
    filterCategory, setFilterCategory,
    filterEntity, setFilterEntity,
    filterAccountCode, setFilterAccountCode,
    filterAccountLabel, setFilterAccountLabel,
    filterBeforeOrInPeriod, setFilterBeforeOrInPeriod,
    filterBeforeOrInYear, setFilterBeforeOrInYear,
    filterBeforeOrInMonth, setFilterBeforeOrInMonth,
    filterBeforeOrInQuarter, setFilterBeforeOrInQuarter,
    selectedYears, setSelectedYears,
    hasInitializedYears, setHasInitializedYears,
    selectedQuarters, setSelectedQuarters,
    selectedMonths, setSelectedMonths,
    isSidebarOpen, setIsSidebarOpen,
    uniqueYears,
    filteredTransactions,
    dashboardFilteredTransactions,
    resetFilters,
    isFallbackState
  };
}