import React, { useState, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import Modal from '../common/Modal';
import { supabase } from '../../lib/supabaseClient';
import { useKingdomStore } from '../../store/useKingdomStore';
import StatisticCard from './StatisticCard';

const monthOptions = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function StatisticsWindow({
  isOpen,
  onClose,
  t = {},
  transactions = [],
  fromOptions = [],
  accountMappings = {},
  currentGold = 0,
  onEditTransaction = () => {},
  onDeleteTransaction = () => {},
  onGoToLedger = () => {}
}) {
  // Filter states: defaults are showing "all data"
  const [selectedYear, setSelectedYear] = useState('All');
  const [selectedMonth, setSelectedMonth] = useState('All');
  const [selectedFrom, setSelectedFrom] = useState('All');

  // Detail view states
  const [detailTitle, setDetailTitle] = useState('');
  const [detailList, setDetailList] = useState([]);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Inline editing states
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    from: '',
    year: '',
    month: '',
    entity: '',
    amount: '',
    payment_status: ''
  });

  // Derive unique years from transactions
  const uniqueYears = useMemo(() => {
    const years = new Set(transactions.map(tx => tx.year).filter(Boolean));
    const currentYear = new Date().getFullYear();
    years.add(currentYear);
    return Array.from(years).sort((a, b) => b - a);
  }, [transactions]);

  // Determine active calculation periods (falls back to current calendar month/year if 'All' is selected)
  const activeYear = useMemo(() => {
    return selectedYear === 'All' ? new Date().getFullYear() : selectedYear;
  }, [selectedYear]);

  const activeMonth = useMemo(() => {
    return selectedMonth === 'All' ? monthOptions[new Date().getMonth()] : selectedMonth;
  }, [selectedMonth]);

  // Helper to get previous month and year
  const getPrevMonthAndYear = (month, year) => {
    const idx = monthOptions.indexOf(month);
    if (idx === 0) {
      return { month: monthOptions[11], year: year - 1 };
    }
    return { month: monthOptions[idx - 1], year };
  };

  const prevPeriod = useMemo(() => getPrevMonthAndYear(activeMonth, activeYear), [activeMonth, activeYear]);
  const prevPrevPeriod = useMemo(() => getPrevMonthAndYear(prevPeriod.month, prevPeriod.year), [prevPeriod]);

  // Math engines for Cash / Debt / Expenses / Income
  const stats = useMemo(() => {
    // 1. Get all completed transactions in chronological order (oldest to newest)
    const sortedTxs = [...transactions]
      .filter(tx => tx.payment_status === 'Completed')
      .sort((a, b) => {
        const dateA = new Date(a.posting_date || a.value_date || a.created_at);
        const dateB = new Date(b.posting_date || b.value_date || b.created_at);
        return dateA - dateB;
      });

    // 2. Initialize account balances map
    const balances = {};
    Object.keys(accountMappings).forEach(code => {
      if (code.startsWith('1') || code.startsWith('2')) {
        balances[code] = 0;
      }
    });

    // 3. Set starting cash for primary account (10101001)
    const plInflow = transactions
      .filter(tx => {
        if (tx.payment_status !== 'Completed') return false;
        if (tx.transaction_type === 'Income') return true;
        if (tx.transaction_type === 'Assets' || tx.transaction_type === 'Liabilities') {
          return tx.flow === 'inflow' && (
            (tx.source_dest_bank && (tx.source_dest_bank.startsWith('10101') || tx.source_dest_bank.startsWith('10102'))) ||
            (tx.target_account && (tx.target_account.startsWith('10101') || tx.target_account.startsWith('10102')))
          );
        }
        return false;
      })
      .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

    const plOutflow = transactions
      .filter(tx => {
        if (tx.payment_status !== 'Completed') return false;
        if (tx.transaction_type === 'Expense') return true;
        if (tx.transaction_type === 'Assets' || tx.transaction_type === 'Liabilities') {
          return tx.flow === 'outflow' && (
            (tx.source_dest_bank && (tx.source_dest_bank.startsWith('10101') || tx.source_dest_bank.startsWith('10102'))) ||
            (tx.target_account && (tx.target_account.startsWith('10101') || tx.target_account.startsWith('10102')))
          );
        }
        return false;
      })
      .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

    const startingCash = currentGold - plInflow + plOutflow;
    balances['10101001'] = startingCash;

    // Helper to check if transaction date is on or before a given year and month
    const isBeforeOrOn = (tx, y, m) => {
      if (!tx.year || !tx.month) return true;
      const mIdx = monthOptions.indexOf(tx.month);
      const limitMIdx = monthOptions.indexOf(m);
      if (tx.year < y) return true;
      if (tx.year === y && mIdx <= limitMIdx) return true;
      return false;
    };

    // We want to capture balances at end of Prev Prev Month, Last Month and Current Month
    const balancesPrevPrev = { ...balances };
    const balancesPrev = { ...balances };
    const balancesCurr = { ...balances };

    // Run the ledger chronological updates
    sortedTxs.forEach(tx => {
      const amt = Number(tx.amount) || 0;
      
      const applyTx = (balMap) => {
        if (tx.transaction_type === 'Income') {
          const src = tx.source_dest_bank || '10101001';
          if (src in balMap) balMap[src] += amt;
        } else if (tx.transaction_type === 'Expense') {
          const src = tx.source_dest_bank || '10101001';
          if (src in balMap) balMap[src] -= amt;
        } else if (tx.transaction_type === 'Assets') {
          const src = tx.source_dest_bank;
          const tgt = tx.target_account;
          if (tx.flow === 'neutral') {
            if (src && src in balMap) balMap[src] -= amt;
            if (tgt && tgt in balMap) balMap[tgt] += amt;
          } else if (tx.flow === 'inflow') {
            if (tgt && tgt in balMap) balMap[tgt] += amt;
          } else if (tx.flow === 'outflow') {
            if (src && src in balMap) balMap[src] -= amt;
          }
        } else if (tx.transaction_type === 'Liabilities') {
          const src = tx.source_dest_bank;
          const tgt = tx.target_account;
          if (tx.flow === 'inflow') {
            if (tgt && tgt in balMap) balMap[tgt] += amt;
            if (src && src in balMap) balMap[src] += amt;
          } else if (tx.flow === 'outflow') {
            if (tgt && tgt in balMap) balMap[tgt] -= amt;
            if (src && src in balMap) balMap[src] -= amt;
          }
        }
      };

      // Apply to prev prev period balances if the tx date is on/before prev prev period
      if (isBeforeOrOn(tx, prevPrevPeriod.year, prevPrevPeriod.month)) {
        applyTx(balancesPrevPrev);
      }
      // Apply to prev period balances if the tx date is on/before prev period
      if (isBeforeOrOn(tx, prevPeriod.year, prevPeriod.month)) {
        applyTx(balancesPrev);
      }
      // Apply to current period balances if the tx date is on/before current period
      if (isBeforeOrOn(tx, activeYear, activeMonth)) {
        applyTx(balancesCurr);
      }
    });

    // Helper to aggregate balances by code prefix
    const sumCoA = (balMap, prefix) => {
      return Object.entries(balMap)
        .filter(([code]) => code.startsWith(prefix))
        .reduce((sum, [code, balance]) => sum + balance, 0);
    };

    // Helper to extract transactions contributing to CoA accounts in a specific period
    const getCoAPeriodTxs = (periodTxs, prefix) => {
      return periodTxs.filter(tx => {
        return (tx.target_account && tx.target_account.startsWith(prefix)) ||
               (tx.source_dest_bank && tx.source_dest_bank.startsWith(prefix));
      });
    };

    const getCoAMetrics = (prefix) => {
      const currAccum = sumCoA(balancesCurr, prefix);
      const prevAccum = sumCoA(balancesPrev, prefix);
      const prevPrevAccum = sumCoA(balancesPrevPrev, prefix);

      const curr = currAccum - prevAccum; // Monthly net change for current month
      const prev = prevAccum - prevPrevAccum; // Monthly net change for previous month
      const diff = curr - prev;
      const accum = currAccum; // Accumulated balance at the end of the current period

      // Filter sets
      const currTxs = transactions.filter(tx => filterTx(tx, activeYear, activeMonth, selectedFrom));
      const prevTxs = transactions.filter(tx => filterTx(tx, prevPeriod.year, prevPeriod.month, selectedFrom));
      const accumTxs = transactions.filter(tx => filterAccumulated(tx, activeYear, activeMonth, selectedFrom));

      return {
        curr,
        prev,
        diff,
        accum,
        currList: getCoAPeriodTxs(currTxs, prefix),
        prevList: getCoAPeriodTxs(prevTxs, prefix),
        accumList: getCoAPeriodTxs(accumTxs, prefix)
      };
    };

    // For Income / Expenses, we just sum up transaction amounts within the intervals
    const filterTx = (tx, y, m, fromFilter) => {
      if (tx.year !== y || tx.month !== m) return false;
      if (fromFilter !== 'All' && tx.from !== fromFilter) return false;
      return true;
    };

    const filterAccumulated = (tx, y, m, fromFilter) => {
      if (fromFilter !== 'All' && tx.from !== fromFilter) return false;
      
      const limitYear = selectedYear === 'All' ? new Date().getFullYear() : selectedYear;
      const limitMonth = selectedMonth === 'All' ? monthOptions[new Date().getMonth()] : selectedMonth;
      
      if (!tx.year || !tx.month) return false;
      const mIdx = monthOptions.indexOf(tx.month);
      const limitMIdx = monthOptions.indexOf(limitMonth);
      if (tx.year < limitYear) return true;
      if (tx.year === limitYear && mIdx <= limitMIdx) return true;
      return false;
    };

    const calcClassSum = (txs, type, statusCond) => {
      return txs.reduce((sum, tx) => {
        if (tx.transaction_type !== type) return sum;
        const isPending = tx.payment_status === 'Pending';
        if (statusCond === 'Pending' && !isPending) return sum;
        if (statusCond === 'Completed' && isPending) return sum;
        return sum + (Number(tx.amount) || 0);
      }, 0);
    };

    const getClassTxs = (txs, type, statusCond) => {
      return txs.filter(tx => {
        if (tx.transaction_type !== type) return false;
        const isPending = tx.payment_status === 'Pending';
        if (statusCond === 'Pending' && !isPending) return false;
        if (statusCond === 'Completed' && isPending) return false;
        return true;
      });
    };

    const getPLMetrics = (type, statusCond) => {
      const currTxs = transactions.filter(tx => filterTx(tx, activeYear, activeMonth, selectedFrom));
      const prevTxs = transactions.filter(tx => filterTx(tx, prevPeriod.year, prevPeriod.month, selectedFrom));
      const accumTxs = transactions.filter(tx => filterAccumulated(tx, activeYear, activeMonth, selectedFrom));

      const curr = calcClassSum(currTxs, type, statusCond);
      const prev = calcClassSum(prevTxs, type, statusCond);
      const accum = calcClassSum(accumTxs, type, statusCond);
      const diff = curr - prev;

      return {
        curr,
        prev,
        diff,
        accum,
        currList: getClassTxs(currTxs, type, statusCond),
        prevList: getClassTxs(prevTxs, type, statusCond),
        accumList: getClassTxs(accumTxs, type, statusCond)
      };
    };

    return {
      bankAccounts: getCoAMetrics('10101'),
      savingsAccounts: getCoAMetrics('10102'),
      creditCards: getCoAMetrics('20103'),
      loansBurrow: {
        curr: sumCoA(balancesCurr, '20101') + sumCoA(balancesCurr, '20102'),
        prev: sumCoA(balancesPrev, '20101') + sumCoA(balancesPrev, '20102'),
        diff: (sumCoA(balancesCurr, '20101') + sumCoA(balancesCurr, '20102')) - (sumCoA(balancesPrev, '20101') + sumCoA(balancesPrev, '20102')),
        accum: sumCoA(balancesCurr, '20101') + sumCoA(balancesCurr, '20102'),
        currList: [...getCoAPeriodTxs(transactions.filter(tx => filterTx(tx, activeYear, activeMonth, selectedFrom)), '20101'), ...getCoAPeriodTxs(transactions.filter(tx => filterTx(tx, activeYear, activeMonth, selectedFrom)), '20102')],
        prevList: [...getCoAPeriodTxs(transactions.filter(tx => filterTx(tx, prevPeriod.year, prevPeriod.month, selectedFrom)), '20101'), ...getCoAPeriodTxs(transactions.filter(tx => filterTx(tx, prevPeriod.year, prevPeriod.month, selectedFrom)), '20102')],
        accumList: [...getCoAPeriodTxs(transactions.filter(tx => filterAccumulated(tx, activeYear, activeMonth, selectedFrom)), '20101'), ...getCoAPeriodTxs(transactions.filter(tx => filterAccumulated(tx, activeYear, activeMonth, selectedFrom)), '20102')]
      },
      otherDebts: getCoAMetrics('202'),
      expensesPending: getPLMetrics('Expense', 'Pending'),
      expensesCompleted: getPLMetrics('Expense', 'Completed'),
      incomePending: getPLMetrics('Income', 'Pending'),
      incomeCompleted: getPLMetrics('Income', 'Completed')
    };
  }, [transactions, accountMappings, currentGold, activeYear, activeMonth, selectedYear, selectedMonth, selectedFrom, prevPeriod]);

  // Section subtotals
  const cashSubtotal = useMemo(() => {
    const curr = stats.bankAccounts.curr + stats.savingsAccounts.curr;
    const prev = stats.bankAccounts.prev + stats.savingsAccounts.prev;
    return {
      curr,
      prev,
      diff: curr - prev,
      accum: stats.bankAccounts.accum + stats.savingsAccounts.accum,
      currList: [...stats.bankAccounts.currList, ...stats.savingsAccounts.currList],
      prevList: [...stats.bankAccounts.prevList, ...stats.savingsAccounts.prevList],
      accumList: [...stats.bankAccounts.accumList, ...stats.savingsAccounts.accumList]
    };
  }, [stats]);

  const debtSubtotal = useMemo(() => {
    const curr = stats.creditCards.curr + stats.loansBurrow.curr + stats.otherDebts.curr;
    const prev = stats.creditCards.prev + stats.loansBurrow.prev + stats.otherDebts.prev;
    return {
      curr,
      prev,
      diff: curr - prev,
      accum: stats.creditCards.accum + stats.loansBurrow.accum + stats.otherDebts.accum,
      currList: [...stats.creditCards.currList, ...stats.loansBurrow.currList, ...stats.otherDebts.currList],
      prevList: [...stats.creditCards.prevList, ...stats.loansBurrow.prevList, ...stats.otherDebts.prevList],
      accumList: [...stats.creditCards.accumList, ...stats.loansBurrow.accumList, ...stats.otherDebts.accumList]
    };
  }, [stats]);

  const expensesSubtotal = useMemo(() => {
    const curr = stats.expensesPending.curr + stats.expensesCompleted.curr;
    const prev = stats.expensesPending.prev + stats.expensesCompleted.prev;
    return {
      curr,
      prev,
      diff: curr - prev,
      accum: stats.expensesPending.accum + stats.expensesCompleted.accum,
      currList: [...stats.expensesPending.currList, ...stats.expensesCompleted.currList],
      prevList: [...stats.expensesPending.prevList, ...stats.expensesCompleted.prevList],
      accumList: [...stats.expensesPending.accumList, ...stats.expensesCompleted.accumList]
    };
  }, [stats]);

  const incomeSubtotal = useMemo(() => {
    const curr = stats.incomePending.curr + stats.incomeCompleted.curr;
    const prev = stats.incomePending.prev + stats.incomeCompleted.prev;
    return {
      curr,
      prev,
      diff: curr - prev,
      accum: stats.incomePending.accum + stats.incomeCompleted.accum,
      currList: [...stats.incomePending.currList, ...stats.incomeCompleted.currList],
      prevList: [...stats.incomePending.prevList, ...stats.incomeCompleted.prevList],
      accumList: [...stats.incomePending.accumList, ...stats.incomeCompleted.accumList]
    };
  }, [stats]);

  // Helper to format currency (Numbers only, no "g")
  const formatVal = (val) => {
    const formatted = Math.abs(val).toLocaleString();
    return (val < 0 ? '-' : '') + formatted;
  };

  const handleOpenDetails = (title, list) => {
    setDetailTitle(title);
    setDetailList(list);
    setIsDetailOpen(true);
    setEditingId(null);
  };

  const handleStartEdit = (tx) => {
    setEditingId(tx.id);
    setEditForm({
      from: tx.from || '',
      year: tx.year || '',
      month: tx.month || '',
      entity: tx.entity || '',
      amount: tx.amount || '',
      payment_status: tx.payment_status || 'Completed'
    });
  };

  const handleSaveInline = (txId) => {
    // 1. Snapshot previous state for rollback fallback
    const prevTxs = useKingdomStore.getState().transactions;
    const prevGold = useKingdomStore.getState().gold;
    const prevDetailList = [...detailList];

    // Find the original transaction before editing
    const originalTx = prevTxs.find(t => t.id === txId) || {};

    // 2. Prepare new transaction data
    const updatedFields = {
      from: editForm.from,
      origin: editForm.from,
      year: Number(editForm.year) || new Date().getFullYear(),
      month: editForm.month,
      entity: editForm.entity,
      amount: Number(editForm.amount) || 0,
      payment_status: editForm.payment_status
    };

    // Calculate gold delta dynamically
    const getGoldEffect = (txObj) => {
      if (txObj.payment_status !== 'Completed') return 0;
      const amt = Number(txObj.amount) || 0;
      const type = originalTx.transaction_type;
      const flow = originalTx.flow;

      if (type === 'Income') return amt;
      if (type === 'Expense') return -amt;
      if (type === 'Liabilities') {
        if (flow === 'inflow') return amt;
        if (flow === 'outflow') return -amt;
      }
      return 0;
    };

    const originalEffect = getGoldEffect(originalTx);
    const newEffect = getGoldEffect(updatedFields);
    const goldDelta = newEffect - originalEffect;

    // 3. Optimistically update Zustand global store (transactions & gold balance)
    const nextTxs = prevTxs.map(t => t.id === txId ? { ...t, ...updatedFields } : t);
    useKingdomStore.setState({ 
      transactions: nextTxs,
      gold: prevGold + goldDelta
    });

    // 4. Optimistically update local details modal list
    setDetailList(prev =>
      prev.map(item => (item.id === txId ? { ...item, ...updatedFields } : item))
    );

    // Close editing inputs instantly
    setEditingId(null);

    // 5. Perform Supabase update asynchronously in background
    supabase
      .from('transactions')
      .update({
        origin: editForm.from,
        year: updatedFields.year,
        month: updatedFields.month,
        entity: updatedFields.entity,
        amount: updatedFields.amount,
        payment_status: updatedFields.payment_status
      })
      .eq('id', txId)
      .then(({ error }) => {
        if (error) {
          console.error(error);
          // Rollback on failure
          useKingdomStore.setState({ 
            transactions: prevTxs,
            gold: prevGold
          });
          setDetailList(prevDetailList);
          toast.error(t('save_error', 'Failed to update transaction in database'));
        } else {
          toast.success(t('save_success', 'Transaction updated successfully'));
          
          // Silently trigger background refetch to ensure alignment with database triggers
          const user = useKingdomStore.getState().user;
          const activeProfileId = user?.id || '00000000-0000-0000-0000-000000000000';
          useKingdomStore.getState().fetchKingdomData(activeProfileId);
        }
      })
      .catch(err => {
        console.error(err);
        useKingdomStore.setState({ 
          transactions: prevTxs,
          gold: prevGold
        });
        setDetailList(prevDetailList);
        toast.error(t('save_error', 'Failed to update transaction'));
      });
  };

  const handleClearFilters = () => {
    setSelectedYear('All');
    setSelectedMonth('All');
    setSelectedFrom('All');
    toast.success(t('filters_cleared', 'Filters Cleared'));
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={t('menu_statistics', 'Statistics')}
        size="max-w-4xl"
      >
        <div className="flex flex-col h-full overflow-hidden animate-fade-in">
          {/* Filters */}
          <div className="p-3 mb-4 rounded-xl border border-[#8b4513]/15 bg-[#faf4e5]/60 flex flex-wrap gap-4 items-end justify-between">
            <div className="flex flex-wrap gap-4 items-center">
              <div>
                <label className="block text-[8px] font-black uppercase text-[#5d4037]/75 mb-0.5 font-sans">
                  {t('year_label', 'Year')}
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value === 'All' ? 'All' : Number(e.target.value))}
                  className="bg-[#faf4e5] border border-[#8b4513]/25 rounded px-2 py-1 text-xs font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]"
                >
                  <option value="All">{t('all_years', 'All Years')}</option>
                  {uniqueYears.map(yr => (
                    <option key={yr} value={yr}>{yr}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[8px] font-black uppercase text-[#5d4037]/75 mb-0.5 font-sans">
                  {t('month_label', 'Month')}
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-[#faf4e5] border border-[#8b4513]/25 rounded px-2 py-1 text-xs font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]"
                >
                  <option value="All">{t('all_months', 'All Months')}</option>
                  {monthOptions.map(m => (
                    <option key={m} value={m}>{t(`month_${m.toLowerCase()}`, m)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[8px] font-black uppercase text-[#5d4037]/75 mb-0.5 font-sans">
                  {t('origin_from', 'Origin/From')}
                </label>
                <select
                  value={selectedFrom}
                  onChange={(e) => setSelectedFrom(e.target.value)}
                  className="bg-[#faf4e5] border border-[#8b4513]/25 rounded px-2 py-1 text-xs font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]"
                >
                  <option value="All">{t('all_from', 'All From')}</option>
                  {fromOptions.map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              {/* Go to General Ledger Button */}
              <button
                type="button"
                onClick={() => {
                  onGoToLedger();
                }}
                className="bg-[#8b4513] hover:bg-[#70360f] text-[#ffd700] px-2.5 py-1 text-[10px] font-black uppercase rounded border border-[#ffd700]/30 hover:border-[#ffd700]/50 transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                title={t('go_to_ledger', 'Go to General Ledger')}
              >
                📖 {t('go_to_ledger', 'General Ledger')}
              </button>

              {/* Clear Filters Button (Symbol) */}
              <button
                type="button"
                onClick={handleClearFilters}
                className="bg-[#8b4513] hover:bg-[#70360f] text-[#ffd700] px-2.5 py-1 text-[10px] font-black uppercase rounded border border-[#ffd700]/30 hover:border-[#ffd700]/50 transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                title={t('clear_all', 'Clear Filters')}
              >
                🧹 {t('clear_all', 'Clear')}
              </button>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {/* Cash Section */}
            <div className="md:col-span-2 lg:col-span-3 text-sm font-black uppercase text-[#8b4513] tracking-wide mb-2 mt-4 first:mt-0">
              {t('stat_group_cash', 'Cash')}
            </div>
            <StatisticCard 
              label={t('stat_bank_accounts', 'Bank accounts')} 
              metric={stats.bankAccounts} 
              activeMonth={activeMonth} 
              prevPeriod={prevPeriod} 
              t={t} 
              handleOpenDetails={handleOpenDetails} 
            />
            <StatisticCard 
              label={t('stat_saving_accounts', 'Saving accounts')} 
              metric={stats.savingsAccounts} 
              activeMonth={activeMonth} 
              prevPeriod={prevPeriod} 
              t={t} 
              handleOpenDetails={handleOpenDetails} 
            />

            {/* Debt Section */}
            <div className="md:col-span-2 lg:col-span-3 text-sm font-black uppercase text-[#8b4513] tracking-wide mb-2 mt-4">
              {t('stat_group_debt', 'Debt')}
            </div>
            <StatisticCard 
              label={t('stat_credit_cards', 'Credit cards')} 
              metric={stats.creditCards} 
              activeMonth={activeMonth} 
              prevPeriod={prevPeriod} 
              t={t} 
              handleOpenDetails={handleOpenDetails} 
            />
            <StatisticCard 
              label={t('stat_loans_burrow', 'Loans & Burrow')} 
              metric={stats.loansBurrow} 
              activeMonth={activeMonth} 
              prevPeriod={prevPeriod} 
              t={t} 
              handleOpenDetails={handleOpenDetails} 
            />
            <StatisticCard 
              label={t('stat_other_debts', 'Other Debts')} 
              metric={stats.otherDebts} 
              activeMonth={activeMonth} 
              prevPeriod={prevPeriod} 
              t={t} 
              handleOpenDetails={handleOpenDetails} 
            />

            {/* Expenses Section */}
            <div className="md:col-span-2 lg:col-span-3 text-sm font-black uppercase text-[#8b4513] tracking-wide mb-2 mt-4">
              {t('stat_group_expenses', 'Expenses')}
            </div>
            <StatisticCard 
              label={t('stat_expenses_unpaid', 'Expenses not paid')} 
              metric={stats.expensesPending} 
              activeMonth={activeMonth} 
              prevPeriod={prevPeriod} 
              t={t} 
              handleOpenDetails={handleOpenDetails} 
            />
            <StatisticCard 
              label={t('stat_expenses_paid', 'Expenses paid')} 
              metric={stats.expensesCompleted} 
              activeMonth={activeMonth} 
              prevPeriod={prevPeriod} 
              t={t} 
              handleOpenDetails={handleOpenDetails} 
            />

            {/* Income Section */}
            <div className="md:col-span-2 lg:col-span-3 text-sm font-black uppercase text-[#8b4513] tracking-wide mb-2 mt-4">
              {t('stat_group_income', 'Income')}
            </div>
            <StatisticCard 
              label={t('stat_income_unpaid', 'Income not received')} 
              metric={stats.incomePending} 
              activeMonth={activeMonth} 
              prevPeriod={prevPeriod} 
              t={t} 
              handleOpenDetails={handleOpenDetails} 
            />
            <StatisticCard 
              label={t('stat_income_paid', 'Income received')} 
              metric={stats.incomeCompleted} 
              activeMonth={activeMonth} 
              prevPeriod={prevPeriod} 
              t={t} 
              handleOpenDetails={handleOpenDetails} 
            />
          </div>
        </div>
      </Modal>

      {/* Nested drill-down detail modal */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={detailTitle}
        size="max-w-4xl"
      >
        <div className="flex flex-col h-full overflow-hidden">
          {detailList.length > 0 ? (
            <div className="overflow-x-auto border border-[#8b4513]/10 rounded-xl shadow-sm bg-white">
              <table className="w-full text-left border-collapse overflow-hidden">
                <thead>
                  <tr className="bg-[#8b4513]/5 text-[#4b2c20] border-b border-[#8b4513]/20">
                    <th className="py-2.5 px-4 text-[9px] font-black uppercase tracking-wider font-sans">{t('col_from', 'From')}</th>
                    <th className="py-2.5 px-4 text-[9px] font-black uppercase tracking-wider font-sans">{t('col_year', 'Year')}</th>
                    <th className="py-2.5 px-4 text-[9px] font-black uppercase tracking-wider font-sans">{t('col_month', 'Month')}</th>
                    <th className="py-2.5 px-4 text-[9px] font-black uppercase tracking-wider font-sans">{t('col_entity', 'Entity')}</th>
                    <th className="py-2.5 px-4 text-[9px] font-black uppercase tracking-wider font-sans text-right">{t('col_amount', 'Amount')}</th>
                    <th className="py-2.5 px-4 text-[9px] font-black uppercase tracking-wider font-sans text-center">{t('col_status', 'Status')}</th>
                    <th className="py-2.5 px-4 text-[9px] font-black uppercase tracking-wider font-sans text-center">{t('col_actions', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {detailList.map((tx) => {
                    const isEditingThis = editingId === tx.id;
                    return (
                      <tr key={tx.id} className="border-b border-[#8b4513]/10 hover:bg-[#8b4513]/5 transition-colors">
                        {/* From column */}
                        <td className="py-2 px-4 text-xs font-serif font-black text-[#4b2c20]">
                          {isEditingThis ? (
                            <input
                              type="text"
                              value={editForm.from}
                              onChange={(e) => setEditForm({ ...editForm, from: e.target.value })}
                              className="bg-[#faf4e5] border border-[#8b4513]/30 rounded px-1.5 py-0.5 text-xs text-[#4b2c20] focus:outline-none focus:border-[#8b4513] w-full"
                            />
                          ) : (
                            tx.from || '-'
                          )}
                        </td>

                        {/* Year column */}
                        <td className="py-2 px-4 text-xs font-mono text-stone-600">
                          {isEditingThis ? (
                            <input
                              type="number"
                              value={editForm.year}
                              onChange={(e) => setEditForm({ ...editForm, year: e.target.value })}
                              className="bg-[#faf4e5] border border-[#8b4513]/30 rounded px-1.5 py-0.5 text-xs text-[#4b2c20] focus:outline-none focus:border-[#8b4513] w-20"
                            />
                          ) : (
                            tx.year || '-'
                          )}
                        </td>

                        {/* Month column */}
                        <td className="py-2 px-4 text-xs font-serif text-stone-600">
                          {isEditingThis ? (
                            <select
                              value={editForm.month}
                              onChange={(e) => setEditForm({ ...editForm, month: e.target.value })}
                              className="bg-[#faf4e5] border border-[#8b4513]/30 rounded px-1.5 py-0.5 text-xs text-[#4b2c20] focus:outline-none focus:border-[#8b4513]"
                            >
                              {monthOptions.map(m => (
                                <option key={m} value={m}>{m}</option>
                              ))}
                            </select>
                          ) : (
                            tx.month || '-'
                          )}
                        </td>

                        {/* Entity column */}
                        <td className="py-2 px-4 text-xs font-serif text-[#4b2c20]">
                          {isEditingThis ? (
                            <input
                              type="text"
                              value={editForm.entity}
                              onChange={(e) => setEditForm({ ...editForm, entity: e.target.value })}
                              className="bg-[#faf4e5] border border-[#8b4513]/30 rounded px-1.5 py-0.5 text-xs text-[#4b2c20] focus:outline-none focus:border-[#8b4513] w-full"
                            />
                          ) : (
                            tx.entity || '-'
                          )}
                        </td>

                        {/* Amount column */}
                        <td className="py-2 px-4 text-xs font-mono font-black text-stone-700 text-right">
                          {isEditingThis ? (
                            <input
                              type="number"
                              value={editForm.amount}
                              onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                              className="bg-[#faf4e5] border border-[#8b4513]/30 rounded px-1.5 py-0.5 text-xs text-[#4b2c20] focus:outline-none focus:border-[#8b4513] w-24 text-right"
                            />
                          ) : (
                            Number(tx.amount).toLocaleString()
                          )}
                        </td>

                        {/* Status column */}
                        <td className="py-2 px-4 text-xs text-center">
                          {isEditingThis ? (
                            <select
                              value={editForm.payment_status}
                              onChange={(e) => setEditForm({ ...editForm, payment_status: e.target.value })}
                              className="bg-[#faf4e5] border border-[#8b4513]/30 rounded px-1.5 py-0.5 text-xs text-[#4b2c20] focus:outline-none focus:border-[#8b4513]"
                            >
                              <option value="Completed">Completed</option>
                              <option value="Pending">Pending</option>
                              <option value="Paid on Time">Paid on Time</option>
                              <option value="Overdue">Overdue</option>
                            </select>
                          ) : (
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                              tx.payment_status === 'Completed' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                              tx.payment_status === 'Paid on Time' ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' :
                              tx.payment_status === 'Pending' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                              tx.payment_status === 'Overdue' ? 'bg-red-100 text-red-800 border border-red-200' :
                              'bg-stone-100 text-stone-800 border border-stone-200'
                            }`}>
                              {tx.payment_status || 'Completed'}
                            </span>
                          )}
                        </td>

                        {/* Actions column */}
                        <td className="py-2 px-4 text-xs text-center">
                          {isEditingThis ? (
                            <div className="flex justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleSaveInline(tx.id)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-2 py-0.5 rounded transition-all cursor-pointer text-[10px]"
                                title="Save"
                              >
                                💾
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingId(null)}
                                className="bg-stone-500 hover:bg-stone-600 text-white font-black px-2 py-0.5 rounded transition-all cursor-pointer text-[10px]"
                                title="Cancel"
                              >
                                ❌
                              </button>
                            </div>
                          ) : (
                            <div className="flex justify-center">
                              <button
                                type="button"
                                onClick={() => handleStartEdit(tx)}
                                className="text-[#b8860b] hover:text-[#d4af37] font-black px-2 py-0.5 rounded border border-[#8b4513]/25 hover:bg-[#8b4513]/10 transition-all cursor-pointer text-[10px]"
                                title="Edit"
                              >
                                ✏️
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  if (window.confirm(t('confirm_delete', 'Are you sure you want to delete this transaction?'))) {
                                    await onDeleteTransaction(tx.id);
                                    setDetailList(prev => prev.filter(t => t.id !== tx.id));
                                    toast.success(t('success_delete', 'Transaction deleted successfully'));
                                  }
                                }}
                                className="text-rose-700 hover:text-rose-900 font-black px-2 py-0.5 rounded border border-rose-700/25 hover:bg-rose-50 transition-all cursor-pointer text-[10px] ml-2"
                                title="Delete"
                              >
                                🗑️
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-[#5d4037]/60 italic font-serif">
              {t('no_details_found', 'No transactions found making up this value.')}
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
