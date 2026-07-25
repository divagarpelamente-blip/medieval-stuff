import React, { useMemo } from 'react';
import { useKingdomStore } from '../../store/useKingdomStore';

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
    
    if (sortedExpMonths.length >= 2) {
      const currentMonth = sortedExpMonths[sortedExpMonths.length - 1];
      const priorMonth = sortedExpMonths[sortedExpMonths.length - 2];
      
      const currentExp = expByMonth[currentMonth] || 0;
      const priorExp = expByMonth[priorMonth] || 0;
      
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
      monthlyWealthVariance, expenseVariancePop
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
export const SavingsRateWidget = withRatioData('savingsRate', 'Savings Rate', 'Percentage of income retained', 'Net / Income', { isPercentage: true });
export const BurnRateWidget = withRatioData('burnRate', 'Burn Rate', 'Percentage of income consumed', 'Expenses / Income', { isPercentage: true });
export const DtiRatioWidget = withRatioData('dtiRatio', 'DTI Ratio', 'Debt payments vs gross income', 'Debt / Income', { isPercentage: true });
export const DebtRatioWidget = withRatioData('debtRatio', 'Debt Ratio', 'Total Liabilities vs Total Assets', 'Liabilities / Assets', { isPercentage: true });

// Exports: Variances (Deltas)
export const WealthVarianceWidget = withRatioData('monthlyWealthVariance', 'Wealth Variance (MoM)', 'Delta shift in Net Worth', 'Current - Prior', { isDelta: true });
export const ExpenseVarianceWidget = withRatioData('expenseVariancePop', 'Expense Variance (PoP)', 'Shift in spending vs prior period', 'Relative Delta', { isPercentage: true, isDelta: true });