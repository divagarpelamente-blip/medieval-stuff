import React, { useMemo } from 'react';
import { useKingdomStore } from '../../store/useKingdomStore';
import { ArrowUp, ArrowDown, Shield } from 'lucide-react';

const formatValue = (val, isPercentage = false, suffix = '', isDelta = false) => {
  const num = Number(val) || 0;
  const formattedNum = Math.abs(num).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  
  let baseStr = num < 0 ? `(${formattedNum})` : formattedNum;
  if (isDelta && num > 0) baseStr = `+${baseStr}`;
  
  let finalStr = baseStr;
  if (isPercentage) finalStr += '%';
  if (suffix) finalStr += ` ${suffix}`;
  return finalStr;
};

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
    
    // DTI Ratio defaults to 0 unless explicit debt payments are tracked
    const dtiRatio = 0; 

    return {
      avgMonthlyExpense, avgDailyExpense, survivalMonths,
      savingsRate, burnRate, dtiRatio, debtRatio,
      monthlyWealthVariance, expenseVariancePop,
      currentExp, priorExp,
      totalIncome, totalExpenses
    };
  }, [categoryView, monthlyView, cumulativeView, metrics]);
};

// HOC to inject data
const withRatioData = (kpiKey, title, subtitle, tag, options = {}) => {
  return function WidgetComponent() {
    const ratios = useAllRatios();
    const rawValue = ratios[kpiKey] || 0;
    const valueStr = formatValue(rawValue, options.isPercentage, options.suffix, options.isDelta);

    return <RatioCard subtitle={subtitle} tag={tag} title={title} valueStr={valueStr}/>;
  };
};

// Exports: Averages & Horizons
export const AvgMonthlyExpenseWidget = withRatioData('avgMonthlyExpense', 'Avg Monthly Expense', 'Moving average of outflows', 'Temporal Mean');
export const AvgDailyExpenseWidget = withRatioData('avgDailyExpense', 'Avg Daily Expense', 'Daily cash burn velocity', 'Temporal Mean');
export const SurvivalMonthsWidget = withRatioData('survivalMonths', 'Runway', 'Months of survivability', 'Liquidity / Burn', { suffix: 'Mos' });

// Exports: Percentages & Ratios
export const BurnRateWidget = withRatioData('burnRate', 'Burn Rate', 'Percentage of income consumed', 'Expenses / Income', { isPercentage: true });
export const DtiRatioWidget = withRatioData('dtiRatio', 'DTI Ratio', 'Debt payments vs gross income', 'Debt / Income', { isPercentage: true });
export const DebtRatioWidget = withRatioData('debtRatio', 'Debt Ratio', 'Total Liabilities vs Total Assets', 'Liabilities / Assets', { isPercentage: true });

// Exports: Variances (Deltas)
export const WealthVarianceWidget = withRatioData('monthlyWealthVariance', 'Wealth Variance (MoM)', 'Delta shift in Net Worth', 'Current - Prior', { isDelta: true });

export const ExpenseVarianceWidget = () => {
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
            {formatValue(currentExp)}g
          </span>
          <span className="text-[10px] xs:text-xs sm:text-sm text-gray-600 italic">Current Period</span>
        </div>
        
        {/* Space between current period and previous period */}
        <div className="flex flex-col gap-0.5 xs:gap-1 mt-2 xs:mt-3">
          <div className="text-[10px] xs:text-xs sm:text-sm md:text-base text-gray-600">
            Previous Period: <span className="font-semibold text-gray-800">{formatValue(priorExp)}g</span>
          </div>
          <div className="text-[10px] xs:text-xs sm:text-sm md:text-base text-gray-600">
            Absolute Change:{' '}
            <span className={`font-semibold ${textColorClass}`}>
              {formatValue(currentExp - priorExp, false, 'g', true)}
            </span>
          </div>
        </div>
      </div>

      {/* Footer Divider & Relative Data */}
      <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between z-10">
        <span className="text-[9px] xs:text-[10px] sm:text-xs md:text-sm font-sans font-semibold text-gray-600 uppercase tracking-wider">
          Growth / Reduction
        </span>
        
        <div className={`flex items-center gap-1 px-2 py-0.5 xs:px-2.5 xs:py-1 rounded-lg border ${colorClass} transition-all duration-300`}>
          <Icon className="w-3.5 h-3.5 xs:w-4 h-4 stroke-[3]" />
          <span className="text-xs xs:text-sm font-bold font-mono tracking-tight">
            {formatValue(expenseVariancePop, true, '', true)}
          </span>
        </div>
      </div>
    </div>
  );
};

export const SavingsRateWidget = () => {
  const { savingsRate, totalIncome, totalExpenses } = useAllRatios();
  
  const netSavings = totalIncome - totalExpenses;
  const isPositive = netSavings > 0;
  const isNegative = netSavings < 0;
  
  const colorClass = isPositive 
    ? 'text-emerald-600 bg-emerald-50 border-emerald-200' 
    : isNegative 
      ? 'text-rose-600 bg-rose-50 border-rose-200' 
      : 'text-gray-500 bg-gray-50 border-gray-200';
  
  const textColorClass = isPositive 
    ? 'text-emerald-600' 
    : isNegative 
      ? 'text-rose-600' 
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
            Savings Rate
          </h3>
        </div>
      </div>

      {/* Main Content Area (Savings Rate %) */}
      <div className="mt-2 xs:mt-3 flex flex-col justify-center z-10 flex-1">
        <div className="flex items-baseline flex-wrap gap-x-2 gap-y-0.5">
          <span className="text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-sans font-bold text-gray-900 leading-tight">
            {formatValue(savingsRate, true)}
          </span>
          <span className="text-[10px] xs:text-xs sm:text-sm text-gray-600 italic">Current Period</span>
        </div>
        
        {/* Space between current period and absolute data */}
        <div className="flex flex-col gap-0.5 xs:gap-1 mt-2 xs:mt-3">
          <div className="text-[10px] xs:text-xs sm:text-sm md:text-base text-gray-600">
            Total Income: <span className="font-semibold text-gray-800">{formatValue(totalIncome)}g</span>
          </div>
          <div className="text-[10px] xs:text-xs sm:text-sm md:text-base text-gray-600">
            Total Expenses: <span className="font-semibold text-gray-800">{formatValue(totalExpenses)}g</span>
          </div>
        </div>
      </div>

      {/* Footer Divider & Relative Data */}
      <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between z-10">
        <span className="text-[9px] xs:text-[10px] sm:text-xs md:text-sm font-sans font-semibold text-gray-600 uppercase tracking-wider">
          Net Savings
        </span>
        
        <div className={`flex items-center gap-1 px-2 py-0.5 xs:px-2.5 xs:py-1 rounded-lg border ${colorClass} transition-all duration-300`}>
          <Icon className="w-3.5 h-3.5 xs:w-4 h-4 stroke-[3]" />
          <span className="text-xs xs:text-sm font-bold font-mono tracking-tight">
            {formatValue(netSavings, false, 'g', true)}
          </span>
        </div>
      </div>
    </div>
  );
};