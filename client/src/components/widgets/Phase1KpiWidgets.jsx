import React, { useMemo } from 'react';
import { useKingdomStore } from '../../store/useKingdomStore';
import { useFormatting, formatCurrency } from '../../context/FormattingContext';

const EMPTY_ARRAY = [];
const EMPTY_OBJ = {};

// O Componente Base Visual para todos os cartões KPI
const KpiCard = ({ title, amount, subtitle, colorClass }) => {
  const { prefs } = useFormatting();
  return (
    <div className="w-full h-full flex flex-col bg-white border border-gray-200 rounded-xl p-6 shadow-sm justify-center">
      <h3 className="text-sm font-sans font-semibold tracking-wide text-gray-500 uppercase mb-2">{title}</h3>
      <div className={`text-3xl font-bold ${colorClass} mb-1 truncate`}>
        {formatCurrency(amount || 0, prefs)}
      </div>
      <p className="text-xs text-gray-400">{subtitle}</p>
    </div>
  );
};

// ==========================================
// CENTRAL DE DADOS KPI (Otimizada)
// ==========================================
// Este hook consome as métricas que a base de dados já calculou
const useKpiData = () => {
  const dashboardMetrics = useKingdomStore(state => state.dashboardMetrics) || EMPTY_OBJ;
  const categoryView = useKingdomStore(state => state.analytics?.category) || EMPTY_ARRAY;
  const balancesView = useKingdomStore(state => state.analytics?.balances) || EMPTY_ARRAY;
  
  // Stabilize kpiSummary selection
  const storeKpiSummary = useKingdomStore(state => state.kpi_summary);
  const kpiSummary = storeKpiSummary || dashboardMetrics.kpi_summary || EMPTY_OBJ;

  const derived = useMemo(() => {
    let totalIncome = 0;
    let totalExpenses = 0;
    let totalInvestments = 0;
    let computedNetCash = 0;

    categoryView.forEach(row => {
      const amt = Number(row.total_volume) || 0;
      
      if (row.type === 'Income') totalIncome += amt;
      if (row.type === 'Expenses') totalExpenses += amt;

      if (row.type === 'Assets' && row.category && row.category.toLowerCase().includes('invest')) {
        totalInvestments += amt;
      }
    });

    balancesView.forEach(row => {
      const code = row.account || '';
      const bal = Number(row.balance) || 0;
      const status = row.payment_status || 'Completed'; 
      
      if (status === 'Completed') {
        if (code.startsWith('1101') || code.startsWith('1103')) {
          computedNetCash += bal;
        }
      }
    });

    return {
      netCashFlow: totalIncome - totalExpenses, 
      netCash: computedNetCash,
      totalInvestments
    };
  }, [categoryView, balancesView]);

  return {
    ...dashboardMetrics, // Traz total_assets, total_liabilities, net_worth
    ...derived,           // Traz netCashFlow, netCash, totalInvestments
    
    // NEW RPC MAPPINGS:
    normalized_monthly_income: kpiSummary.normalized_monthly_income || 0,
    avg_monthly_expense: kpiSummary.avg_monthly_expense || 0,
    liquid_vault_cash: kpiSummary.liquid_vault_cash || dashboardMetrics?.net_vault_cash || 0,
    state_debt_total: kpiSummary.state_debt_total || 0,
    runway_months: kpiSummary.runway_months || 0
  };
};

// ==========================================
// WIDGETS EXPORTADOS
// ==========================================

export const TotalIncomeWidget = () => {
  const { normalized_monthly_income } = useKpiData();
  return <KpiCard title="Total Income" amount={normalized_monthly_income} colorClass="text-emerald-500" subtitle="Normalized monthly revenue" />;
};

export const TotalExpensesWidget = () => {
  const { avg_monthly_expense } = useKpiData();
  return <KpiCard title="Total Expenses" amount={avg_monthly_expense} colorClass="text-rose-500" subtitle="Average monthly outflows" />;
};

export const GrossCashflowWidget = () => {
  const { netCashFlow } = useKpiData();
  const color = netCashFlow >= 0 ? "text-emerald-600" : "text-rose-600";
  return <KpiCard title="Gross Cashflow" amount={netCashFlow} colorClass={color} subtitle="Inflows minus outflows (pending + complete)" />;
};

export const NetCashWidget = () => {
  const { netCash } = useKpiData();
  const color = netCash >= 0 ? "text-emerald-600" : "text-rose-600";
  return <KpiCard title="Net Cash" amount={netCash} colorClass={color} subtitle="Inflows minus outflows (completed only)" />;
};

export const TotalAssetsWidget = () => {
  const { total_assets } = useKpiData();
  return <KpiCard title="Total Assets" amount={total_assets} colorClass="text-indigo-600" subtitle="Gross owned assets" />;
};

export const ImmediateLiquidityWidget = () => {
  const { liquid_vault_cash } = useKpiData();
  return <KpiCard title="Immediate Liquidity" amount={liquid_vault_cash} colorClass="text-blue-500" subtitle="Accessible cash and equivalents" />;
};

export const TotalInvestmentsWidget = () => {
  const { totalInvestments } = useKpiData();
  return <KpiCard title="Total Investments" amount={totalInvestments} colorClass="text-violet-500" subtitle="Capital allocated to markets" />;
};

export const TotalLiabilitiesWidget = () => {
  const { total_liabilities } = useKpiData();
  return <KpiCard title="Total Liabilities" amount={total_liabilities} colorClass="text-orange-500" subtitle="Gross outstanding debt (Class 2)" />;
};

// NEW WIDGET AS REQUESTED
export const StateDebtArrearsWidget = () => {
  const { state_debt_total } = useKpiData();
  return <KpiCard title="State Debt Arrears" amount={state_debt_total} colorClass="text-red-600" subtitle="Owed to the State (Tax/IRS)" />;
};

export const NetWorthWidget = () => {
  const { net_worth } = useKpiData();
  const color = net_worth >= 0 ? "text-slate-800" : "text-rose-600";
  return <KpiCard title="Net Worth" amount={net_worth} colorClass={color} subtitle="Assets minus Liabilities" />;
};