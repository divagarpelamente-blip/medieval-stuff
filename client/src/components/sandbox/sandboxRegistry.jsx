import React, { useState } from 'react';
import CashFlowChart from '../dashboard/CashFlowChart';
import NetWorthChart from '../dashboard/NetWorthChart';
import AssetAllocationChart from '../dashboard/AssetAllocationChart';
import { 
  TotalIncomeWidget, TotalExpensesWidget, NetCashFlowWidget, 
  TotalAssetsWidget, ImmediateLiquidityWidget, TotalInvestmentsWidget, 
  TotalLiabilitiesWidget, NetWorthWidget 
} from '../widgets/Phase1KpiWidgets';
import { 
  IncomeTrendWidget, ExpenseTrendWidget, CumulativeCashFlowWidget, 
  AssetGrowthTrendWidget, DebtTrendWidget, NetWorthTrendWidget 
} from '../widgets/Phase1ChartWidgets';
import { 
  IncomeCategoryWidget, IncomeTypeWidget, ExpenseCategoryWidget, 
  ExpenseSubtypeWidget, AssetAllocationWidget, LiabilitiesSubtypeWidget, DebtHorizonWidget 
} from '../widgets/Phase2PieWidgets';
import { 
  IncomeEntityWidget, EntityExposureWidget, DebtCreditorWidget,
  TopMerchantsWidget, LargestTransactionsWidget, TopAccountsWidget 
} from '../widgets/Phase2EntityWidgets';
import { 
  AvgMonthlyExpenseWidget, AvgDailyExpenseWidget, SurvivalMonthsWidget,
  SavingsRateWidget, BurnRateWidget, DtiRatioWidget, DebtRatioWidget,
  WealthVarianceWidget, ExpenseVarianceWidget
} from '../widgets/Phase3RatioWidgets';
import { CostOfDebtWidget, YieldAssetsWidget } from '../widgets/Phase3FilteredWidgets';
import { RecentTransactionsWidget, InternalTransfersWidget } from '../widgets/Phase4LedgerWidgets';

// 1. Core Proof-of-Concept Staging Widget
const TestCard = () => (
  <div className="flex items-center justify-center h-48 w-full bg-stone-900 border border-amber-900/40 rounded-lg p-6 shadow-xl">
    <div className="text-center">
      <p className="text-amber-500 font-serif text-lg font-semibold tracking-wider">
        Sandbox Widget Active
      </p>
      <p className="text-stone-400 text-xs mt-2 font-mono">
        ID: test_card | Rendering Verification Successful
      </p>
    </div>
  </div>
);

// 2. High-Fidelity Interactive Mana Regulator Widget
const ManaRegulator = () => {
  const [level, setLevel] = useState(74);
  return (
    <div className="bg-stone-900 border border-amber-900/40 rounded-lg p-5 shadow-2xl w-full max-w-sm">
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-serif text-amber-500 text-sm font-semibold uppercase tracking-wider">
          Aetheric Flux
        </h4>
        <span className="text-[10px] font-mono bg-amber-950/60 text-amber-300 border border-amber-800/50 px-2 py-0.5 rounded">
          STABLE
        </span>
      </div>
      <div className="relative pt-1">
        <div className="flex mb-2 items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold inline-block py-1 px-2 uppercase rounded-full text-amber-200 bg-amber-900/20">
              Mana Core Pressure
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs font-mono font-semibold text-amber-400">
              {level}%
            </span>
          </div>
        </div>
        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-stone-950 border border-stone-800">
          <div
            style={{ width: `${level}%` }}
            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-amber-600 transition-all duration-500"
          />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <button
          onClick={() => setLevel(Math.max(0, level - 10))}
          className="px-2.5 py-1 text-xs font-mono bg-stone-950 border border-amber-950 text-stone-400 hover:text-amber-200 hover:border-amber-700 rounded transition"
        >
          VENT
        </button>
        <button
          onClick={() => setLevel(Math.min(100, level + 10))}
          className="px-2.5 py-1 text-xs font-mono bg-amber-950/40 border border-amber-800/40 text-amber-200 hover:bg-amber-900/50 rounded transition"
        >
          CHARGE
        </button>
      </div>
    </div>
  );
};

// 3. High-Fidelity Runic Decree Staging Widget
const DecreeWidget = () => (
  <div className="bg-stone-900 border border-amber-900/40 rounded-lg p-5 shadow-2xl w-full max-w-md">
    <h4 className="font-serif text-amber-500 text-sm font-semibold uppercase tracking-wider mb-3 border-b border-amber-950 pb-2">
      Royal Decree
    </h4>
    <p className="text-stone-300 text-xs leading-relaxed italic font-serif">
      "Let it be known across Eldoria that the sandbox staging grounds are now fully operational. Ensure your interfaces scale elegantly across all viewport shapes."
    </p>
    <div className="mt-4 flex items-center justify-between text-[10px] text-stone-500 font-mono">
      <span>Signee: Grand Architect</span>
      <span>12th of Solis</span>
    </div>
  </div>
);

export const SANDBOX_WIDGETS = {
  kpi_cost_of_debt: { name: "Cost of Debt", component: CostOfDebtWidget, description: "Interest expenses paid across liabilities.", category: "overview", layout: { w: 3, h: 2, minW: 2, maxW: 4, minH: 2, maxH: 3 } },
  kpi_yield_assets: { name: "Yield Assets", component: YieldAssetsWidget, description: "Total value of yield-bearing vs sterile assets.", category: "overview", layout: { w: 3, h: 2, minW: 2, maxW: 4, minH: 2, maxH: 3 } },
  table_recent_tx: { name: "Last 10 Transactions", component: RecentTransactionsWidget, description: "Table of the latest ledger entries.", category: "ledger", layout: { w: 4, h: 3, minW: 3, maxW: 6, minH: 3, maxH: 5 } },
  table_internal_transfers: { name: "Internal Transfers", component: InternalTransfersWidget, description: "Table of internal vault movements.", category: "ledger", layout: { w: 4, h: 3, minW: 3, maxW: 6, minH: 3, maxH: 5 } },
  ratio_avg_monthly_exp: { name: "Avg Monthly Expense", component: AvgMonthlyExpenseWidget, description: "Moving average of expenses.", category: "overview", layout: { w: 3, h: 2, minW: 2, maxW: 4, minH: 2, maxH: 3 } },
  ratio_avg_daily_exp: { name: "Avg Daily Expense", component: AvgDailyExpenseWidget, description: "Daily spending rate.", category: "overview", layout: { w: 3, h: 2, minW: 2, maxW: 4, minH: 2, maxH: 3 } },
  ratio_survival_runway: { name: "Survival Months (Runway)", component: SurvivalMonthsWidget, description: "Months of immediate survivability.", category: "overview", layout: { w: 3, h: 2, minW: 2, maxW: 4, minH: 2, maxH: 3 } },
  ratio_savings_rate: { name: "Savings Rate (%)", component: SavingsRateWidget, description: "Percentage of income retained.", category: "overview", layout: { w: 3, h: 2, minW: 2, maxW: 4, minH: 2, maxH: 3 } },
  ratio_burn_rate: { name: "Burn Rate", component: BurnRateWidget, description: "Percentage of income consumed.", category: "overview", layout: { w: 3, h: 2, minW: 2, maxW: 4, minH: 2, maxH: 3 } },
  ratio_dti: { name: "DTI (Debt-to-Income)", component: DtiRatioWidget, description: "Debt payments vs gross income.", category: "overview", layout: { w: 3, h: 2, minW: 2, maxW: 4, minH: 2, maxH: 3 } },
  ratio_debt_ratio: { name: "Debt Ratio", component: DebtRatioWidget, description: "Liabilities divided by Assets.", category: "overview", layout: { w: 3, h: 2, minW: 2, maxW: 4, minH: 2, maxH: 3 } },
  ratio_wealth_variance: { name: "Monthly Wealth Variance", component: WealthVarianceWidget, description: "Delta shift in Net Worth.", category: "overview", layout: { w: 3, h: 2, minW: 2, maxW: 4, minH: 2, maxH: 3 } },
  ratio_exp_variance: { name: "Expense Variance (PoP)", component: ExpenseVarianceWidget, description: "Percentage shift in spending.", category: "overview", layout: { w: 3, h: 2, minW: 2, maxW: 4, minH: 2, maxH: 3 } },
  bar_income_entity: { name: "Income by Entity", component: IncomeEntityWidget, description: "Bar chart grouping income by payor.", category: "chart", layout: { w: 4, h: 3, minW: 3, maxW: 6, minH: 3, maxH: 5 } },
  table_top_merchants: { name: "Top 10 Merchants", component: TopMerchantsWidget, description: "Table of highest spending destinations.", category: "ledger", layout: { w: 4, h: 3, minW: 3, maxW: 6, minH: 3, maxH: 5 } },
  table_largest_tx: { name: "Largest Transactions", component: LargestTransactionsWidget, description: "Table of single highest expenses.", category: "ledger", layout: { w: 4, h: 3, minW: 3, maxW: 6, minH: 3, maxH: 5 } },
  bar_entity_exposure: { name: "Entity Exposure (Risk)", component: EntityExposureWidget, description: "Bar chart of capital concentration.", category: "chart", layout: { w: 4, h: 3, minW: 3, maxW: 6, minH: 3, maxH: 5 } },
  table_top_accounts: { name: "Top 5 Accounts", component: TopAccountsWidget, description: "Table ranking accounts by real-time balance.", category: "ledger", layout: { w: 4, h: 3, minW: 3, maxW: 6, minH: 3, maxH: 5 } },
  bar_debt_creditor: { name: "Debt by Creditor", component: DebtCreditorWidget, description: "Bar chart of debt owed to specific entities.", category: "chart", layout: { w: 4, h: 3, minW: 3, maxW: 6, minH: 3, maxH: 5 } },
  pie_income_category: { name: "Income by Category", component: IncomeCategoryWidget, description: "Donut chart of revenue distribution.", category: "chart", layout: { w: 3, h: 3, minW: 2, maxW: 4, minH: 3, maxH: 5 } },
  pie_income_type: { name: "Active vs. Passive", component: IncomeTypeWidget, description: "Pie chart comparing earned vs automated income.", category: "chart", layout: { w: 3, h: 3, minW: 2, maxW: 4, minH: 3, maxH: 5 } },
  pie_expense_category: { name: "Expenses by Category", component: ExpenseCategoryWidget, description: "Donut chart of high-level spending.", category: "chart", layout: { w: 3, h: 3, minW: 2, maxW: 4, minH: 3, maxH: 5 } },
  pie_expense_subtype: { name: "Expenses by Subtype", component: ExpenseSubtypeWidget, description: "Donut chart of detailed operational spending.", category: "chart", layout: { w: 3, h: 3, minW: 2, maxW: 4, minH: 3, maxH: 5 } },
  pie_asset_allocation: { name: "Asset Allocation", component: AssetAllocationWidget, description: "Pie chart breaking down wealth by class.", category: "chart", layout: { w: 3, h: 3, minW: 2, maxW: 4, minH: 3, maxH: 5 } },
  pie_liability_subtype: { name: "Liabilities by Subtype", component: LiabilitiesSubtypeWidget, description: "Donut chart of debt distribution.", category: "chart", layout: { w: 3, h: 3, minW: 2, maxW: 4, minH: 3, maxH: 5 } },
  pie_debt_horizon: { name: "Short vs. Long-Term Debt", component: DebtHorizonWidget, description: "Pie chart comparing immediate vs macro debt.", category: "chart", layout: { w: 3, h: 3, minW: 2, maxW: 4, minH: 3, maxH: 5 } },
  chart_income_trend: { name: "Income Trend", component: IncomeTrendWidget, description: "Time-series line tracking historical monthly income.", category: "chart", layout: { w: 4, h: 3, minW: 3, maxW: 6, minH: 2, maxH: 4 } },
  chart_expense_trend: { name: "Expense Trend", component: ExpenseTrendWidget, description: "Temporal trend line graphing monthly outflow patterns.", category: "chart", layout: { w: 4, h: 3, minW: 3, maxW: 6, minH: 2, maxH: 4 } },
  chart_cumulative_flow: { name: "Cumulative Cash Flow", component: CumulativeCashFlowWidget, description: "Area chart mapping net-flow balance trajectory.", category: "chart", layout: { w: 4, h: 3, minW: 3, maxW: 6, minH: 2, maxH: 4 } },
  chart_asset_growth: { name: "Asset Growth Trend", component: AssetGrowthTrendWidget, description: "Historical growth curve of gross assets.", category: "chart", layout: { w: 4, h: 3, minW: 3, maxW: 6, minH: 2, maxH: 4 } },
  chart_debt_trend: { name: "Debt Trend", component: DebtTrendWidget, description: "Trend line showing debt accumulation velocity.", category: "chart", layout: { w: 4, h: 3, minW: 3, maxW: 6, minH: 2, maxH: 4 } },
  chart_net_worth_trend: { name: "Net Worth Trend", component: NetWorthTrendWidget, description: "Area chart showing historical net worth curve.", category: "chart", layout: { w: 4, h: 3, minW: 3, maxW: 6, minH: 2, maxH: 4 } },
  test_card: {
    name: "Default Test Card",
    component: TestCard,
    description: "Confirms viewport and basic box configuration options.",
    category: "system",
    layout: { w: 4, h: 2, minW: 2, maxW: 6, minH: 1, maxH: 4 }
  },
  mana_regulator: {
    name: "Aetheric Flux Regulator",
    component: ManaRegulator,
    description: "An interactive tracker monitoring mana engine capacities.",
    category: "system",
    layout: { w: 3, h: 3, minW: 2, maxW: 4, minH: 2, maxH: 4 }
  },
  decree_widget: {
    name: "Royal Decree Bulletin",
    component: DecreeWidget,
    description: "Text-based layout containing historical scrolls.",
    category: "system",
    layout: { w: 4, h: 3, minW: 2, maxW: 6, minH: 2, maxH: 5 }
  },
  cash_flow_chart: {
    name: "Income vs Expenses",
    component: CashFlowChart,
    description: "Displays the historical evolution of all Income vs Expenses.",
    category: "chart",
    layout: { w: 5, h: 3, minW: 3, maxW: 12, minH: 2, maxH: 6 }
  },
  net_worth_chart: {
    name: "Net Worth Trend",
    component: NetWorthChart,
    description: "Displays accumulated sovereign reserves held in vaults.",
    category: "overview",
    layout: { w: 5, h: 3, minW: 3, maxW: 12, minH: 2, maxH: 6 }
  },
  asset_allocation_chart: {
    name: "Net Worth Trend",
    component: AssetAllocationChart,
    description: "Assets - Liabilities",
    category: "ledger",
    layout: { w: 3, h: 3, minW: 2, maxW: 6, minH: 2, maxH: 6 }
  },
  kpi_total_income: { name: "Total Income", component: TotalIncomeWidget, description: "Absolute sum of all incoming revenue accounts.", category: "overview", layout: { w: 3, h: 2, minW: 2, maxW: 4, minH: 2, maxH: 3 } },
  kpi_total_expenses: { name: "Total Expenses", component: TotalExpensesWidget, description: "Absolute sum of all expense accounts.", category: "overview", layout: { w: 3, h: 2, minW: 2, maxW: 4, minH: 2, maxH: 3 } },
  kpi_net_cash_flow: { name: "Net Cash Flow", component: NetCashFlowWidget, description: "Total Inflows minus Total Outflows.", category: "overview", layout: { w: 3, h: 2, minW: 2, maxW: 4, minH: 2, maxH: 3 } },
  kpi_total_assets: { name: "Total Assets", component: TotalAssetsWidget, description: "Gross sum of all owned assets.", category: "overview", layout: { w: 3, h: 2, minW: 2, maxW: 4, minH: 2, maxH: 3 } },
  kpi_liquidity: { name: "Immediate Liquidity", component: ImmediateLiquidityWidget, description: "Sum of accessible checking, savings, and cash.", category: "overview", layout: { w: 3, h: 2, minW: 2, maxW: 4, minH: 2, maxH: 3 } },
  kpi_investments: { name: "Total Investments", component: TotalInvestmentsWidget, description: "Sum of market and retirement accounts.", category: "overview", layout: { w: 3, h: 2, minW: 2, maxW: 4, minH: 2, maxH: 3 } },
  kpi_total_liabilities: { name: "Total Liabilities", component: TotalLiabilitiesWidget, description: "Gross sum of all outstanding debt.", category: "overview", layout: { w: 3, h: 2, minW: 2, maxW: 4, minH: 2, maxH: 3 } },
  kpi_net_worth: { name: "Net Worth", component: NetWorthWidget, description: "True valuation (Assets minus Liabilities).", category: "overview", layout: { w: 3, h: 2, minW: 2, maxW: 4, minH: 2, maxH: 3 } }
};