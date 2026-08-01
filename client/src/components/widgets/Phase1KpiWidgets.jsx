import React, { useMemo } from 'react';
import { useKingdomStore } from '../../store/useKingdomStore';

// Utilitário simples para formatar os valores monetários com vírgulas e casas decimais
const formatVal = (val) => {
  const num = Number(val) || 0;
  const formatted = Math.abs(num).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return num < 0 ? `(${formatted})` : formatted;
};

// O Componente Base Visual para todos os cartões KPI (mantendo o design limpo que tinhas)
const KpiCard = ({ title, amount, subtitle, colorClass }) => (
  <div className="w-full h-full flex flex-col bg-white border border-gray-200 rounded-xl p-6 shadow-sm justify-center">
    <h3 className="text-sm font-sans font-semibold tracking-wide text-gray-500 uppercase mb-2">{title}</h3>
    <div className={`text-3xl font-bold ${colorClass} mb-1 truncate`}>
      {formatVal(amount)}
    </div>
    <p className="text-xs text-gray-400">{subtitle}</p>
  </div>
);

// ==========================================
// CENTRAL DE DADOS KPI (Otimizada)
// ==========================================
// Este hook consome as métricas que a base de dados já calculou
const useKpiData = () => {
  const dashboardMetrics = useKingdomStore(state => state.dashboardMetrics);
  const categoryView = useKingdomStore(state => state.analytics?.category || []);

  const derived = useMemo(() => {
    let totalIncome = 0;
    let totalExpenses = 0;
    let totalInvestments = 0;
    let completedIncome = 0;
    let completedExpenses = 0;

    // Em vez de iterar sobre 10.000 transações, iteramos apenas sobre o sumário das categorias (ex: ~15 linhas)
    categoryView.forEach(row => {
      const amt = Number(row.total_volume) || 0;
      const status = row.payment_status || 'Completed';

      if (row.type === 'Income') {
        totalIncome += amt;
        if (status === 'Completed') completedIncome += amt;
      }
      if (row.type === 'Expenses') {
        totalExpenses += amt;
        if (status === 'Completed') completedExpenses += amt;
      }

      // Heurística simples: se a categoria pertencer a Ativos e contiver a palavra "Invest", soma aos investimentos
      if (row.type === 'Assets' && row.category && row.category.toLowerCase().includes('invest')) {
        totalInvestments += amt;
      }
    });

    return {
      totalIncome,
      totalExpenses,
      netCashFlow: totalIncome - totalExpenses, // pending + complete
      netCash: completedIncome - completedExpenses, // complete only
      totalInvestments
    };
  }, [categoryView]);

  return {
    ...dashboardMetrics, // Traz total_assets, total_liabilities, net_worth, net_vault_cash
    ...derived           // Traz totalIncome, totalExpenses, netCashFlow, netCash, totalInvestments
  };
};

// ==========================================
// WIDGETS EXPORTADOS
// ==========================================

export const TotalIncomeWidget = () => {
  const { totalIncome } = useKpiData();
  return <KpiCard title="Total Income" amount={totalIncome} colorClass="text-emerald-500" subtitle="Gross revenue generated" />;
};

export const TotalExpensesWidget = () => {
  const { totalExpenses } = useKpiData();
  return <KpiCard title="Total Expenses" amount={totalExpenses} colorClass="text-rose-500" subtitle="Total operational outflows" />;
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
  const { net_vault_cash } = useKpiData();
  return <KpiCard title="Immediate Liquidity" amount={net_vault_cash} colorClass="text-blue-500" subtitle="Accessible cash and equivalents" />;
};

export const TotalInvestmentsWidget = () => {
  const { totalInvestments } = useKpiData();
  return <KpiCard title="Total Investments" amount={totalInvestments} colorClass="text-violet-500" subtitle="Capital allocated to markets" />;
};

export const TotalLiabilitiesWidget = () => {
  const { total_liabilities } = useKpiData();
  return <KpiCard title="Total Liabilities" amount={total_liabilities} colorClass="text-orange-500" subtitle="Gross outstanding debt" />;
};

export const NetWorthWidget = () => {
  const { net_worth } = useKpiData();
  const color = net_worth >= 0 ? "text-slate-800" : "text-rose-600";
  return <KpiCard title="Net Worth" amount={net_worth} colorClass={color} subtitle="Assets minus Liabilities" />;
};