import React, { useMemo } from 'react';
import { useKingdomStore } from '../../store/useKingdomStore';
import { calculateLedgerKPIs } from '../../utils/chartAnalytics';

// Medieval KPI Card Template
const KpiCard = ({ title, subtitle, value, tag, icon }) => (
  <div className="w-full h-full flex flex-col justify-between bg-[#faf4e5] border border-[#8b4513]/25 rounded-xl p-6 shadow-md text-[#4b2c20]">
    <div className="flex justify-between items-start">
      <div>
        <h3 className="text-sm font-serif font-bold tracking-wide text-[#5d4037] uppercase border-b border-[#8b4513]/25 pb-1 inline-block">
          {title}
        </h3>
        <p className="text-xs text-[#455a64] mt-1 font-serif italic">{subtitle}</p>
      </div>
      <div className="flex items-center justify-center w-8 h-8 rounded border border-[#5d4037] bg-[#f4e4bc] text-[#5d4037] shadow-inner">
        {icon}
      </div>
    </div>
    <div className="mt-4">
      <span className="text-3xl font-serif font-bold text-[#4b2c20] drop-shadow-sm">{value}</span>
    </div>
    <div className="mt-4 pt-3 border-t border-[#8b4513]/15 flex items-center justify-between text-[11px] font-mono text-[#5d4037]">
      <span>{tag}</span>
      <span className="text-[#4b2c20] font-bold bg-[#ffd700]/30 px-2 py-0.5 rounded border border-[#ffd700]/50 shadow-sm">
        Verified
      </span>
    </div>
  </div>
);

// HOC to inject data and format
const withKpiData = (kpiKey, title, subtitle, tag, icon) => {
  return function WidgetComponent({ transactions }) {
    const storeTransactions = useKingdomStore((state) => state.transactions || []);
    const activeTransactions = transactions || storeTransactions;
    const kpis = useMemo(() => calculateLedgerKPIs(activeTransactions), [activeTransactions]);
    
    const rawValue = kpis[kpiKey] || 0;
    
    const formatValue = (val) => {
      const num = Number(val) || 0;
      const formattedNum = Math.abs(num).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
      return num < 0 ? `(${formattedNum})` : formattedNum;
    };

    return <KpiCard icon={icon} subtitle={subtitle} tag={tag} title={title} value={formatValue(rawValue)}/>;
  };
};

// Icons
const IconIncome = <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const IconExpense = <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>;
const IconFlow = <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>;
const IconAsset = <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>;
const IconLiquid = <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const IconInvest = <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>;
const IconDebt = <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>;
const IconNet = <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>;

// Export all 8 Widgets
export const TotalIncomeWidget = withKpiData('totalIncome', 'Total Income', 'Gross revenue', 'Class [7xxxxxxx]', IconIncome);
export const TotalExpensesWidget = withKpiData('totalExpenses', 'Total Expenses', 'Gross outflows', 'Class [6xxxxxxx]', IconExpense);
export const NetCashFlowWidget = withKpiData('netCashFlow', 'Net Cash Flow', 'Inflows minus Outflows', 'Derived Metric', IconFlow);
export const TotalAssetsWidget = withKpiData('totalAssets', 'Total Assets (Gross)', 'Total owned capital', 'Class [1xxxxxxx]', IconAsset);
export const ImmediateLiquidityWidget = withKpiData('immediateLiquidity', 'Immediate Liquidity', 'Accessible cash & savings', 'Class [1101/2/3]', IconLiquid);
export const TotalInvestmentsWidget = withKpiData('totalInvestments', 'Total Investments', 'Markets & Retirement', 'Class [1301/2]', IconInvest);
export const TotalLiabilitiesWidget = withKpiData('totalLiabilities', 'Total Liabilities', 'Total outstanding debt', 'Class [2xxxxxxx]', IconDebt);
export const NetWorthWidget = withKpiData('netWorth', 'Global Net Worth', 'Assets minus Liabilities', 'Derived Metric', IconNet);
