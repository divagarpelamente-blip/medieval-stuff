import React, { useMemo, useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useKingdomStore } from '../../store/useKingdomStore';
import { ArrowUp, ArrowDown, Shield, Pencil } from 'lucide-react';
import { BudgetModal } from '../features/settings/BudgetModal';
import { useFormatting, formatCurrency, formatNumber } from '../../context/FormattingContext';

// Generic Monochromatic Ratio Card
const RatioCard = ({ title, subtitle, valueStr, tag }) => (
  <div className="w-full h-full flex flex-col justify-between bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
    <div className="flex justify-between items-start">
      <div>
        <h3 className="text-sm font-sans font-semibold tracking-wide text-gray-500 uppercase">{title}</h3>
        <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
      </div>
    </div>
    <div className="mt-4">
      <span className="text-3xl font-sans font-bold text-gray-900">{valueStr}</span>
    </div>
    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] font-mono text-gray-500">
      <span>{tag}</span>
      <span className="text-gray-700 font-semibold bg-gray-100 px-2 py-0.5 rounded border border-gray-200">Algorithmic</span>
    </div>
  </div>
);

// Engine de cálculo centralizado para as rácios da Fase 3
const useAllRatios = () => {
  const categoryView = useKingdomStore(s => s.analytics?.category || []);
  const monthlyView = useKingdomStore(s => s.analytics?.monthly || []);
  const cumulativeView = useKingdomStore(s => s.analytics?.cumulative || []);
  const metrics = useKingdomStore(s => s.dashboardMetrics);

  return useMemo(() => {
    // 1. Aggregate Global Totals (Full History)
    let totalIncome = 0;
    let totalExpenses = 0;
    
    categoryView.forEach(row => {
      const amt = Number(row.total_volume) || 0;
      if (row.type === 'Income') totalIncome += amt;
      if (row.type === 'Expenses') totalExpenses += amt;
    });

    // 2. Period-over-Period (PoP) Expense Variance
    const expByMonth = {};
    monthlyView.forEach(row => {
      if (row.type === 'Expenses') {
        expByMonth[row.month_date] = Number(row.total_amount);
      }
    });
    
    const sortedExpMonths = Object.keys(expByMonth).sort();
    let expenseVariancePop = 0;
    let currentExp = 0;
    let priorExp = 0;
    
    if (sortedExpMonths.length >= 2) {
      const currentMonth = sortedExpMonths[sortedExpMonths.length - 1];
      const priorMonth = sortedExpMonths[sortedExpMonths.length - 2];
      
      currentExp = expByMonth[currentMonth] || 0;
      priorExp = expByMonth[priorMonth] || 0;
      
      expenseVariancePop = priorExp > 0 ? ((currentExp - priorExp) / priorExp) * 100 : 0;
    }

    // 3. Month-over-Month Wealth Variance
    const netByMonth = {};
    cumulativeView.forEach(row => {
      const date = row.month_date;
      const amt = Number(row.cumulative_amount) || 0;
      if (!netByMonth[date]) netByMonth[date] = 0;
      
      if (row.type === 'Assets') netByMonth[date] += amt;
      if (row.type === 'Liabilities') netByMonth[date] -= amt;
    });

    const sortedNetMonths = Object.keys(netByMonth).sort();
    let monthlyWealthVariance = 0;
    
    if (sortedNetMonths.length >= 2) {
      const currentMonth = sortedNetMonths[sortedNetMonths.length - 1];
      const priorMonth = sortedNetMonths[sortedNetMonths.length - 2];
      monthlyWealthVariance = (netByMonth[currentMonth] || 0) - (netByMonth[priorMonth] || 0);
    }

    // 4. Compute Final Ratios
    const activeMonthsCount = sortedExpMonths.length || 1;
    const avgMonthlyExpense = totalExpenses / activeMonthsCount;
    const avgDailyExpense = avgMonthlyExpense / 30.44;

    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;
    const burnRate = totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0;
    const debtRatio = metrics.total_assets > 0 ? (metrics.total_liabilities / metrics.total_assets) * 100 : 0;
    const survivalMonths = avgMonthlyExpense > 0 ? (metrics.net_vault_cash || 0) / avgMonthlyExpense : 0;
    
    // DTI Ratio calculation mapping real debt payment/amortization categories
    let amortization = 0;
    categoryView.forEach(row => {
      const amt = Number(row.total_volume) || 0;
      const catName = (row.category || '').toLowerCase();
      const isDebtCategory = catName.includes('debt') || catName.includes('loan') || catName.includes('amorti') || catName.includes('credit') || catName.includes('liabilit');
      
      // Amortization usually happens against Liabilities or specific Expense categories
      if ((row.type === 'Liabilities' || row.type === 'Expenses') && isDebtCategory) {
        amortization += amt;
      }
    });
    const dtiRatio = totalIncome > 0 ? (amortization / totalIncome) * 100 : 0;
    const netVaultCash = metrics.net_vault_cash || 0;

    return {
      avgMonthlyExpense, avgDailyExpense, survivalMonths,
      savingsRate, burnRate, dtiRatio, debtRatio,
      monthlyWealthVariance, expenseVariancePop,
      currentExp, priorExp,
      totalIncome, totalExpenses,
      netVaultCash, amortization
    };
  }, [categoryView, monthlyView, cumulativeView, metrics]);
};

// HOC to inject data
const withRatioData = (kpiKey, title, subtitle, tag, options = {}) => {
  return function WidgetComponent() {
    const ratios = useAllRatios();
    const { prefs } = useFormatting();
    const rawValue = ratios[kpiKey] || 0;
    
    let valueStr = '';
    if (options.isPercentage) {
      valueStr = formatNumber(rawValue, prefs) + '%';
      if (options.isDelta && rawValue > 0) valueStr = '+' + valueStr;
    } else if (options.isDelta) {
      valueStr = formatCurrency(rawValue, prefs);
      if (rawValue > 0) valueStr = '+' + valueStr;
    } else {
      valueStr = formatCurrency(rawValue, prefs);
    }

    return <RatioCard subtitle={subtitle} tag={tag} title={title} valueStr={valueStr}/>;
  };
};

// Exports: Averages & Horizons
export const AvgMonthlyExpenseWidget = withRatioData('avgMonthlyExpense', 'Avg Monthly Expense', 'Moving average of outflows', 'Temporal Mean');
export const AvgDailyExpenseWidget = withRatioData('avgDailyExpense', 'Avg Daily Expense', 'Daily cash burn velocity', 'Temporal Mean');

// Exports: Percentages & Ratios
export const BurnRateWidget = withRatioData('burnRate', 'Burn Rate', 'Percentage of income consumed', 'Expenses / Income', { isPercentage: true });
export const DebtRatioWidget = withRatioData('debtRatio', 'Debt Ratio', 'Total Liabilities vs Total Assets', 'Liabilities / Assets', { isPercentage: true });

// Exports: Variances (Deltas)
export const WealthVarianceWidget = withRatioData('monthlyWealthVariance', 'Wealth Variance (MoM)', 'Delta shift in Net Worth', 'Current - Prior', { isDelta: true });

export const ExpenseVarianceWidget = () => {
  const { prefs } = useFormatting();
  const { expenseVariancePop, currentExp, priorExp } = useAllRatios();
  
  const isPositive = expenseVariancePop > 0;
  const isNegative = expenseVariancePop < 0;
  
  const colorClass = isPositive 
    ? 'text-rose-600 bg-rose-50 border-rose-200' 
    : isNegative 
      ? 'text-emerald-600 bg-emerald-50 border-emerald-200' 
      : 'text-gray-500 bg-gray-50 border-gray-200';
  
  const textColorClass = isPositive 
    ? 'text-rose-600' 
    : isNegative 
      ? 'text-emerald-600' 
      : 'text-gray-500';

  const Icon = isPositive ? ArrowUp : ArrowDown;

  return (
    <div className="w-full h-full flex flex-col justify-between bg-white border border-gray-200 rounded-xl p-2.5 xs:p-4 sm:p-5 shadow-sm relative overflow-hidden">
      {/* Background Crest/Shield Watermark */}
      <div className="absolute right-4 top-4 text-gray-200/60 pointer-events-none">
        <Shield className="w-12 h-12 xs:w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 stroke-[1]" />
      </div>

      {/* Header */}
      <div className="flex justify-between items-start z-10">
        <div>
          <h3 className="text-[10px] xs:text-xs sm:text-sm font-sans font-semibold tracking-wider text-gray-600 uppercase">
            Expense Variance (PoP)
          </h3>
        </div>
      </div>

      {/* Main Content Area (Absolute Data) */}
      <div className="mt-2 xs:mt-3 flex flex-col justify-center z-10 flex-1">
        <div className="flex items-baseline flex-wrap gap-x-2 gap-y-0.5">
          <span className="text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-sans font-bold text-gray-900 leading-tight">
            {formatCurrency(currentExp, prefs)}
          </span>
          <span className="text-[10px] xs:text-xs sm:text-sm text-gray-600 italic">Current Period</span>
        </div>
        
        {/* Space between current period and previous period */}
        <div className="flex flex-col gap-0.5 xs:gap-1 mt-2 xs:mt-3">
          <div className="text-[10px] xs:text-xs sm:text-sm md:text-base text-gray-600">
            Previous Period: <span className="font-semibold text-gray-800">{formatCurrency(priorExp, prefs)}</span>
          </div>
          <div className="text-[10px] xs:text-xs sm:text-sm md:text-base text-gray-600">
            Absolute Change:{' '}
            <span className={`font-semibold ${textColorClass}`}>
              {formatCurrency(currentExp - priorExp, prefs)}
            </span>
          </div>
        </div>
      </div>

      {/* Footer Divider & Relative Data */}
      <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between z-10">
        <span className="text-[9px] xs:text-[10px] sm:text-xs md:text-sm font-sans font-semibold text-gray-600 uppercase tracking-wider">
          Growth / Reduction
        </span>
        
        <div className={`flex items-center gap-1 px-2 py-0.5 xs:px-2.5 xs:py-1 rounded-lg border ${colorClass} transition-[border-color,background-color,color] duration-300`}>
          <Icon className="w-3.5 h-3.5 xs:w-4 h-4 stroke-[3]" />
          <span className="text-xs xs:text-sm font-bold font-mono tracking-tight">
            {(expenseVariancePop > 0 ? "+" : "") + formatNumber(expenseVariancePop, prefs) + "%"}
          </span>
        </div>
      </div>
    </div>
  );
};

export const SavingsRateWidget = () => {
  const { prefs } = useFormatting();
  const { savingsRate, totalIncome, totalExpenses } = useAllRatios();
  
  let classification = 'Deficit';
  let colorClass = 'text-rose-600 bg-rose-50 border-rose-200';
  let Icon = ArrowDown;
  
  if (savingsRate > 10) {
    classification = 'Healthy';
    colorClass = 'text-emerald-600 bg-emerald-50 border-emerald-200';
    Icon = ArrowUp;
  } else if (savingsRate > 6) {
    classification = 'Good';
    colorClass = 'text-lime-600 bg-lime-50 border-lime-200';
    Icon = ArrowUp;
  } else if (savingsRate > 0) {
    classification = 'Caution';
    colorClass = 'text-amber-600 bg-amber-50 border-amber-200';
    Icon = ArrowDown;
  }

  return (
    <div className="w-full h-full flex flex-col justify-between bg-white border border-gray-200 rounded-xl p-2.5 xs:p-4 sm:p-5 shadow-sm relative overflow-hidden">
      {/* Background Crest/Shield Watermark */}
      <div className="absolute right-4 top-4 text-gray-200/60 pointer-events-none">
        <Shield className="w-12 h-12 xs:w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 stroke-[1]" />
      </div>

      {/* Header */}
      <div className="flex justify-between items-start z-10">
        <div>
          <h3 className="text-[10px] xs:text-xs sm:text-sm font-sans font-semibold tracking-wider text-gray-600 uppercase">
            Savings Rate
          </h3>
        </div>
      </div>

      {/* Main Content Area (Savings Rate %) */}
      <div className="mt-2 xs:mt-3 flex flex-col justify-center z-10 flex-1">
        <div className="flex items-baseline flex-wrap gap-x-2 gap-y-0.5">
          <span className="text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-sans font-bold text-gray-900 leading-tight">
            {formatNumber(savingsRate, prefs)}%
          </span>
          <span className="text-[10px] xs:text-xs sm:text-sm text-gray-600 italic">Current Period</span>
        </div>
        
        {/* Space between current period and absolute data */}
        <div className="flex flex-col gap-0.5 xs:gap-1 mt-2 xs:mt-3">
          <div className="text-[10px] xs:text-xs sm:text-sm md:text-base text-gray-600">
            Total Income: <span className="font-semibold text-gray-800">{formatCurrency(totalIncome, prefs)}</span>
          </div>
          <div className="text-[10px] xs:text-xs sm:text-sm md:text-base text-gray-600">
            Total Expenses: <span className="font-semibold text-gray-800">{formatCurrency(totalExpenses, prefs)}</span>
          </div>
        </div>
      </div>

      {/* Footer Divider & Relative Data */}
      <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between z-10">
        <span className="text-[9px] xs:text-[10px] sm:text-xs md:text-sm font-sans font-semibold text-gray-600 uppercase tracking-wider">
          Treasury Health
        </span>
        
        <div className={`flex items-center gap-1 px-2 py-0.5 xs:px-2.5 xs:py-1 rounded-lg border ${colorClass} transition-[border-color,background-color,color] duration-300`}>
          <Icon className="w-3.5 h-3.5 xs:w-4 h-4 stroke-[3]" />
          <span className="text-xs xs:text-sm font-bold font-mono tracking-tight uppercase">
            {classification}
          </span>
        </div>
      </div>
    </div>
  );
};

export const SurvivalMonthsWidget = () => {
  const { prefs } = useFormatting();
  const { survivalMonths, avgMonthlyExpense, netVaultCash } = useAllRatios();
  
  let runwayClass = 'Critical';
  let colorClass = 'text-rose-600 bg-rose-50 border-rose-200';
  let Icon = ArrowDown;
  
  if (survivalMonths > 3) {
    runwayClass = 'Secure';
    colorClass = 'text-emerald-600 bg-emerald-50 border-emerald-200';
    Icon = ArrowUp;
  } else if (survivalMonths > 1) {
    runwayClass = 'Caution';
    colorClass = 'text-amber-600 bg-amber-50 border-amber-200';
    Icon = ArrowDown;
  }

  const isSecure = survivalMonths > 3;
  const symbol = isSecure ? '🌲' : '🔥';
  const runwayStr = `${symbol}${formatNumber(survivalMonths, prefs)} Months`;

  return (
    <div className="w-full h-full flex flex-col justify-between bg-white border border-gray-200 rounded-xl p-2.5 xs:p-4 sm:p-5 shadow-sm relative overflow-hidden">
      {/* Background Crest/Shield Watermark */}
      <div className="absolute right-4 top-4 text-gray-200/60 pointer-events-none">
        <Shield className="w-12 h-12 xs:w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 stroke-[1]" />
      </div>

      {/* Header */}
      <div className="flex justify-between items-start z-10">
        <div>
          <h3 className="text-[10px] xs:text-xs sm:text-sm font-sans font-semibold tracking-wider text-gray-600 uppercase">
            Kingdom Runway
          </h3>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="mt-2 xs:mt-3 flex flex-col justify-center z-10 flex-1">
        <div className="flex items-baseline flex-wrap gap-x-2 gap-y-0.5">
          <span className="text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-sans font-bold text-gray-900 leading-tight">
            {runwayStr}
          </span>
        </div>
        
        {/* Space between current period and details */}
        <div className="flex flex-col gap-0.5 xs:gap-1 mt-2 xs:mt-3">
          <div className="text-[10px] xs:text-xs sm:text-sm md:text-base text-gray-600">
            Amount per Month: <span className="font-semibold text-gray-800">{formatCurrency(avgMonthlyExpense, prefs)}</span>
          </div>
          <div className="text-[10px] xs:text-xs sm:text-sm md:text-base text-gray-600">
            Liquid Cash: <span className="font-semibold text-gray-800">{formatCurrency(netVaultCash, prefs)}</span>
          </div>
        </div>
      </div>

      {/* Footer Divider & Relative Data */}
      <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between z-10">
        <span className="text-[9px] xs:text-[10px] sm:text-xs md:text-sm font-sans font-semibold text-gray-600 uppercase tracking-wider">
          Survival Outlook
        </span>
        
        <div className={`flex items-center gap-1 px-2 py-0.5 xs:px-2.5 xs:py-1 rounded-lg border ${colorClass} transition-[border-color,background-color,color] duration-300`}>
          <Icon className="w-3.5 h-3.5 xs:w-4 h-4 stroke-[3]" />
          <span className="text-xs xs:text-sm font-bold font-mono tracking-tight uppercase">
            {runwayClass}
          </span>
        </div>
      </div>
    </div>
  );
};

export const DtiRatioWidget = () => {
  const { prefs } = useFormatting();
  const { dtiRatio, amortization, totalIncome } = useAllRatios();
  
  let riskClass = 'Healthy';
  let colorClass = 'text-emerald-600 bg-emerald-50 border-emerald-200';
  let Icon = ArrowDown;
  
  if (dtiRatio > 43) {
    riskClass = 'Critical';
    colorClass = 'text-rose-600 bg-rose-50 border-rose-200';
    Icon = ArrowUp;
  } else if (dtiRatio >= 36) {
    riskClass = 'Caution';
    colorClass = 'text-amber-600 bg-amber-50 border-amber-200';
    Icon = ArrowUp;
  }

  return (
    <div className="w-full h-full flex flex-col justify-between bg-white border border-gray-200 rounded-xl p-2.5 xs:p-4 sm:p-5 shadow-sm relative overflow-hidden">
      {/* Background Crest/Shield Watermark */}
      <div className="absolute right-4 top-4 text-gray-200/60 pointer-events-none">
        <Shield className="w-12 h-12 xs:w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 stroke-[1]" />
      </div>

      {/* Header */}
      <div className="flex justify-between items-start z-10">
        <div>
          <h3 className="text-[10px] xs:text-xs sm:text-sm font-sans font-semibold tracking-wider text-gray-600 uppercase">
            Debt-To-Income (DTI)
          </h3>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="mt-2 xs:mt-3 flex flex-col justify-center z-10 flex-1">
        <div className="flex items-baseline flex-wrap gap-x-2 gap-y-0.5">
          <span className="text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-sans font-bold text-gray-900 leading-tight">
            {formatNumber(dtiRatio, prefs)}%
          </span>
        </div>
        
        {/* Space between current period and details */}
        <div className="flex flex-col gap-0.5 xs:gap-1 mt-2 xs:mt-3">
          <div className="text-[10px] xs:text-xs sm:text-sm md:text-base text-gray-600">
            Amortization: <span className="font-semibold text-gray-800">{formatCurrency(amortization, prefs)}</span>
          </div>
          <div className="text-[10px] xs:text-xs sm:text-sm md:text-base text-gray-600">
            Total Income (net): <span className="font-semibold text-gray-800">{formatCurrency(totalIncome, prefs)}</span>
          </div>
        </div>
      </div>

      {/* Footer Divider & Relative Data */}
      <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between z-10">
        <span className="text-[9px] xs:text-[10px] sm:text-xs md:text-sm font-sans font-semibold text-gray-600 uppercase tracking-wider">
          Risk Level
        </span>
        
        <div className={`flex items-center gap-1 px-2 py-0.5 xs:px-2.5 xs:py-1 rounded-lg border ${colorClass} transition-[border-color,background-color,color] duration-300`}>
          <Icon className="w-3.5 h-3.5 xs:w-4 h-4 stroke-[3]" />
          <span className="text-xs xs:text-sm font-bold font-mono tracking-tight uppercase">
            {riskClass}
          </span>
        </div>
      </div>
    </div>
  );
};

export const BudgetVsActualWidget = () => {
  const { prefs } = useFormatting();
  const categoryView = useKingdomStore(s => s.analytics?.category || []);
  const user = useKingdomStore(s => s.user);
  const [budgets, setBudgets] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (!user?.id) return;
    const fetchBudgets = async () => {
      const { data } = await supabase.from('budgets').select('*').eq('profile_id', user.id);
      if (data) setBudgets(data);
    };
    fetchBudgets();
  }, [user?.id, refreshTrigger]);

  const data = useMemo(() => {
    return budgets.map(b => {
      const cat = categoryView.find(c => c.category === b.coa_category && c.type === 'Expenses');
      const actual = cat ? Number(cat.total_volume) : 0;
      const budget = Number(b.monthly_limit) || 0;
      const pct = budget > 0 ? (actual / budget) * 100 : 0;
      const isOver = actual > budget;
      
      return {
        category: b.coa_category,
        actual,
        budget,
        pct: Math.min(pct, 100),
        isOver
      };
    }).sort((a, b) => b.pct - a.pct);
  }, [categoryView, budgets]);

  return (
    <>
      <div className="w-full h-full flex flex-col bg-white border border-gray-200 rounded-xl p-4 shadow-sm overflow-hidden">
        <div className="mb-3 shrink-0 flex items-start justify-between">
          <div>
            <h3 className="text-sm font-sans font-semibold tracking-wide text-gray-500 uppercase">Budget vs Actual</h3>
            <p className="text-xs text-gray-400 mt-1">All monitored categories vs defined limits</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="p-1.5 text-gray-400 hover:text-amber-700 hover:bg-amber-50 rounded-md transition-colors border border-transparent hover:border-amber-200"
            title="Edit Limits"
          >
            <Pencil className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-amber-900/50">
          {data.length > 0 ? (
            <div className="space-y-4">
              {data.map((item, idx) => (
                <div key={idx} className="flex flex-col gap-1">
                  <div className="flex justify-between text-xs font-semibold text-gray-700">
                    <span>{item.category}</span>
                    <span className={item.isOver ? 'text-rose-600' : 'text-emerald-600'}>
                      {formatCurrency(item.actual, prefs)} / {formatCurrency(item.budget, prefs)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${item.isOver ? 'bg-rose-500' : 'bg-emerald-500'}`}
                      style={{ width: `${item.pct}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-4">
              <Shield className="w-8 h-8 text-gray-300 mb-2 stroke-[1.5]" />
              <p className="text-xs text-gray-500 italic">No budget decrees established.</p>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="mt-2 text-xs font-semibold text-amber-700 hover:text-amber-800 transition-colors"
              >
                Click 'Edit Limits' to set target caps.
              </button>
            </div>
          )}
        </div>
      </div>

      <BudgetModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSaved={() => setRefreshTrigger(prev => prev + 1)}
      />
    </>
  );
};