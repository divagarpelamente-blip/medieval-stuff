import React, { useMemo } from 'react';
import { useKingdomStore } from '../../store/useKingdomStore';
import { calculateRatioKPIs } from '../../utils/chartAnalytics';

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

// HOC to inject data
const withRatioData = (kpiKey, title, subtitle, tag, options = {}) => {
  return function WidgetComponent({ transactions }) {
    const storeTransactions = useKingdomStore((state) => state.transactions || []);
    const activeTransactions = transactions || storeTransactions;
    const kpis = useMemo(() => calculateRatioKPIs(activeTransactions), [activeTransactions]);
    
    const rawValue = kpis[kpiKey] || 0;
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
