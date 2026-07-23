// Add these imports at the top of your file
import CashFlowChart from './CashFlowChart';
import NetWorthChart from './NetWorthChart';
import AssetAllocationChart from './AssetAllocationChart';

// ==========================================
// PHASE 1 IMPORTS
// ==========================================
import { 
  TotalIncomeWidget, TotalExpensesWidget, NetCashFlowWidget, 
  TotalAssetsWidget, ImmediateLiquidityWidget, TotalInvestmentsWidget, 
  TotalLiabilitiesWidget, NetWorthWidget 
} from '../widgets/Phase1KpiWidgets';

import { 
  IncomeTrendWidget, ExpenseTrendWidget, CumulativeCashFlowWidget, 
  AssetGrowthTrendWidget, DebtTrendWidget, NetWorthTrendWidget 
} from '../widgets/Phase1ChartWidgets';

// ==========================================
// PHASE 2 IMPORTS
// ==========================================
import { 
  IncomeCategoryWidget, IncomeTypeWidget, ExpenseCategoryWidget, 
  ExpenseSubtypeWidget, AssetAllocationWidget, LiabilitiesSubtypeWidget, DebtHorizonWidget 
} from '../widgets/Phase2PieWidgets';

import { 
  IncomeEntityWidget, EntityExposureWidget, DebtCreditorWidget,
  TopMerchantsWidget, LargestTransactionsWidget, TopAccountsWidget 
} from '../widgets/Phase2EntityWidgets';

// ==========================================
// PHASE 3 & 4 IMPORTS
// ==========================================
import { 
  AvgMonthlyExpenseWidget, AvgDailyExpenseWidget, SurvivalMonthsWidget,
  SavingsRateWidget, BurnRateWidget, DtiRatioWidget, DebtRatioWidget,
  WealthVarianceWidget, ExpenseVarianceWidget
} from '../widgets/Phase3RatioWidgets';

import { CostOfDebtWidget, YieldAssetsWidget } from '../widgets/Phase3FilteredWidgets';
import { RecentTransactionsWidget, InternalTransfersWidget } from '../widgets/Phase4LedgerWidgets';

// ==========================================
// PRODUCTION REGISTRY EXPORT
// ==========================================
export const TREASURY_WIDGETS = {
  // --- PHASE 1: KPI OVERVIEW ---
  kpi_total_income: { name: "Total Income", component: TotalIncomeWidget, description: "Absolute sum of all incoming revenue accounts.", category: "overview", layout: { w: 3, h: 2, minW: 2, maxW: 4, minH: 2, maxH: 3 } },
  kpi_total_expenses: { name: "Total Expenses", component: TotalExpensesWidget, description: "Absolute sum of all expense accounts.", category: "overview", layout: { w: 3, h: 2, minW: 2, maxW: 4, minH: 2, maxH: 3 } },
  kpi_net_cash_flow: { name: "Net Cash Flow", component: NetCashFlowWidget, description: "Total Inflows minus Total Outflows.", category: "overview", layout: { w: 3, h: 2, minW: 2, maxW: 4, minH: 2, maxH: 3 } },
  kpi_total_assets: { name: "Total Assets", component: TotalAssetsWidget, description: "Gross sum of all owned assets.", category: "overview", layout: { w: 3, h: 2, minW: 2, maxW: 4, minH: 2, maxH: 3 } },
  kpi_liquidity: { name: "Immediate Liquidity", component: ImmediateLiquidityWidget, description: "Sum of accessible checking, savings, and cash.", category: "overview", layout: { w: 3, h: 2, minW: 2, maxW: 4, minH: 2, maxH: 3 } },
  kpi_investments: { name: "Total Investments", component: TotalInvestmentsWidget, description: "Sum of market and retirement accounts.", category: "overview", layout: { w: 3, h: 2, minW: 2, maxW: 4, minH: 2, maxH: 3 } },
  kpi_total_liabilities: { name: "Total Liabilities", component: TotalLiabilitiesWidget, description: "Gross sum of all outstanding debt.", category: "overview", layout: { w: 3, h: 2, minW: 2, maxW: 4, minH: 2, maxH: 3 } },
  kpi_net_worth: { name: "Net Worth", component: NetWorthWidget, description: "True valuation (Assets minus Liabilities).", category: "overview", layout: { w: 3, h: 2, minW: 2, maxW: 4, minH: 2, maxH: 3 } },

  // --- PHASE 1: ANALYTICAL CURVES ---
  chart_income_trend: { name: "Income Trend", component: IncomeTrendWidget, description: "Time-series line tracking historical monthly income.", category: "chart", layout: { w: 4, h: 3, minW: 3, maxW: 6, minH: 2, maxH: 4 } },
  chart_expense_trend: { name: "Expense Trend", component: ExpenseTrendWidget, description: "Temporal trend line graphing monthly outflow patterns.", category: "chart", layout: { w: 4, h: 3, minW: 3, maxW: 6, minH: 2, maxH: 4 } },
  chart_cumulative_flow: { name: "Cumulative Cash Flow", component: CumulativeCashFlowWidget, description: "Area chart mapping net-flow balance trajectory.", category: "chart", layout: { w: 4, h: 3, minW: 3, maxW: 6, minH: 2, maxH: 4 } },
  chart_asset_growth: { name: "Asset Growth Trend", component: AssetGrowthTrendWidget, description: "Historical growth curve of gross assets.", category: "chart", layout: { w: 4, h: 3, minW: 3, maxW: 6, minH: 2, maxH: 4 } },
  chart_debt_trend: { name: "Debt Trend", component: DebtTrendWidget, description: "Trend line showing debt accumulation velocity.", category: "chart", layout: { w: 4, h: 3, minW: 3, maxW: 6, minH: 2, maxH: 4 } },
  chart_net_worth_trend: { name: "Net Worth Trend", component: NetWorthTrendWidget, description: "Area chart showing historical net worth curve.", category: "chart", layout: { w: 4, h: 3, minW: 3, maxW: 6, minH: 2, maxH: 4 } },

  // --- PHASE 2: DISTRIBUTION PIES ---
  pie_income_category: { name: "Income by Category", component: IncomeCategoryWidget, description: "Donut chart of revenue distribution.", category: "chart", layout: { w: 3, h: 3, minW: 2, maxW: 4, minH: 3, maxH: 5 } },
  pie_income_type: { name: "Active vs. Passive", component: IncomeTypeWidget, description: "Pie chart comparing earned vs automated income.", category: "chart", layout: { w: 3, h: 3, minW: 2, maxW: 4, minH: 3, maxH: 5 } },
  pie_expense_category: { name: "Expenses by Category", component: ExpenseCategoryWidget, description: "Donut chart of high-level spending.", category: "chart", layout: { w: 3, h: 3, minW: 2, maxW: 4, minH: 3, maxH: 5 } },
  pie_expense_subtype: { name: "Expenses by Subtype", component: ExpenseSubtypeWidget, description: "Donut chart of detailed operational spending.", category: "chart", layout: { w: 3, h: 3, minW: 2, maxW: 4, minH: 3, maxH: 5 } },
  pie_asset_allocation: { name: "Asset Allocation", component: AssetAllocationWidget, description: "Pie chart breaking down wealth by class.", category: "chart", layout: { w: 3, h: 3, minW: 2, maxW: 4, minH: 3, maxH: 5 } },
  pie_liability_subtype: { name: "Liabilities by Subtype", component: LiabilitiesSubtypeWidget, description: "Donut chart of debt distribution.", category: "chart", layout: { w: 3, h: 3, minW: 2, maxW: 4, minH: 3, maxH: 5 } },
  pie_debt_horizon: { name: "Short vs. Long-Term Debt", component: DebtHorizonWidget, description: "Pie chart comparing immediate vs macro debt.", category: "chart", layout: { w: 3, h: 3, minW: 2, maxW: 4, minH: 3, maxH: 5 } },

  // --- PHASE 2: ENTITIES & LEDGERS ---
  bar_income_entity: { name: "Income by Entity", component: IncomeEntityWidget, description: "Bar chart grouping income by payor.", category: "chart", layout: { w: 4, h: 3, minW: 3, maxW: 6, minH: 3, maxH: 5 } },
  table_top_merchants: { name: "Top 10 Merchants", component: TopMerchantsWidget, description: "Table of highest spending destinations.", category: "ledger", layout: { w: 4, h: 3, minW: 3, maxW: 6, minH: 3, maxH: 5 } },
  table_largest_tx: { name: "Largest Transactions", component: LargestTransactionsWidget, description: "Table of single highest expenses.", category: "ledger", layout: { w: 4, h: 3, minW: 3, maxW: 6, minH: 3, maxH: 5 } },
  bar_entity_exposure: { name: "Entity Exposure (Risk)", component: EntityExposureWidget, description: "Bar chart of capital concentration.", category: "chart", layout: { w: 4, h: 3, minW: 3, maxW: 6, minH: 3, maxH: 5 } },
  table_top_accounts: { name: "Top 5 Accounts", component: TopAccountsWidget, description: "Table ranking accounts by real-time balance.", category: "ledger", layout: { w: 4, h: 3, minW: 3, maxW: 6, minH: 3, maxH: 5 } },
  bar_debt_creditor: { name: "Debt by Creditor", component: DebtCreditorWidget, description: "Bar chart of debt owed to specific entities.", category: "chart", layout: { w: 4, h: 3, minW: 3, maxW: 6, minH: 3, maxH: 5 } },

  // --- PHASE 3: RATIOS & FILTERED ---
  ratio_avg_monthly_exp: { name: "Avg Monthly Expense", component: AvgMonthlyExpenseWidget, description: "Moving average of expenses.", category: "overview", layout: { w: 3, h: 2, minW: 2, maxW: 4, minH: 2, maxH: 3 } },
  ratio_avg_daily_exp: { name: "Avg Daily Expense", component: AvgDailyExpenseWidget, description: "Daily spending rate.", category: "overview", layout: { w: 3, h: 2, minW: 2, maxW: 4, minH: 2, maxH: 3 } },
  ratio_survival_runway: { name: "Survival Months (Runway)", component: SurvivalMonthsWidget, description: "Months of immediate survivability.", category: "overview", layout: { w: 3, h: 2, minW: 2, maxW: 4, minH: 2, maxH: 3 } },
  ratio_savings_rate: { name: "Savings Rate (%)", component: SavingsRateWidget, description: "Percentage of income retained.", category: "overview", layout: { w: 3, h: 2, minW: 2, maxW: 4, minH: 2, maxH: 3 } },
  ratio_burn_rate: { name: "Burn Rate", component: BurnRateWidget, description: "Percentage of income consumed.", category: "overview", layout: { w: 3, h: 2, minW: 2, maxW: 4, minH: 2, maxH: 3 } },
  ratio_dti: { name: "DTI (Debt-to-Income)", component: DtiRatioWidget, description: "Debt payments vs gross income.", category: "overview", layout: { w: 3, h: 2, minW: 2, maxW: 4, minH: 2, maxH: 3 } },
  ratio_debt_ratio: { name: "Debt Ratio", component: DebtRatioWidget, description: "Liabilities divided by Assets.", category: "overview", layout: { w: 3, h: 2, minW: 2, maxW: 4, minH: 2, maxH: 3 } },
  ratio_wealth_variance: { name: "Monthly Wealth Variance", component: WealthVarianceWidget, description: "Delta shift in Net Worth.", category: "overview", layout: { w: 3, h: 2, minW: 2, maxW: 4, minH: 2, maxH: 3 } },
  ratio_exp_variance: { name: "Expense Variance (PoP)", component: ExpenseVarianceWidget, description: "Percentage shift in spending.", category: "overview", layout: { w: 3, h: 2, minW: 2, maxW: 4, minH: 2, maxH: 3 } },
  kpi_cost_of_debt: { name: "Cost of Debt", component: CostOfDebtWidget, description: "Interest expenses paid across liabilities.", category: "overview", layout: { w: 3, h: 2, minW: 2, maxW: 4, minH: 2, maxH: 3 } },
  kpi_yield_assets: { name: "Yield Assets", component: YieldAssetsWidget, description: "Total value of yield-bearing vs sterile assets.", category: "overview", layout: { w: 3, h: 2, minW: 2, maxW: 4, minH: 2, maxH: 3 } },

  // --- PHASE 4: RECENT TRANSACTIONS & LEDGERS ---
  table_recent_tx: { name: "Last 10 Transactions", component: RecentTransactionsWidget, description: "Table of the latest ledger entries.", category: "ledger", layout: { w: 4, h: 3, minW: 3, maxW: 6, minH: 3, maxH: 5 } },
  table_internal_transfers: { name: "Internal Transfers", component: InternalTransfersWidget, description: "Table of internal vault movements.", category: "ledger", layout: { w: 4, h: 3, minW: 3, maxW: 6, minH: 3, maxH: 5 } },

  // --- NEW CHARTS MATCHING THE REGISTRY STRUCTURE ---
  cash_flow_chart: { 
    name: "Cash Flow Trend", 
    component: CashFlowChart, 
    description: "Visualizes income vs expenses over time.", 
    category: "charts", 
    layout: { w: 4, h: 3, minW: 3, maxW: 6, minH: 3, maxH: 5 } 
  },
  net_worth_chart: { 
    name: "Net Worth Trend", 
    component: NetWorthChart, 
    description: "Tracks cumulative asset value.", 
    category: "charts", 
    layout: { w: 4, h: 3, minW: 3, maxW: 6, minH: 3, maxH: 5 } 
  },
  asset_allocation_chart: { 
    name: "Asset Allocation", 
    component: AssetAllocationChart, 
    description: "Current distribution of assets.", 
    category: "charts", 
    layout: { w: 4, h: 3, minW: 3, maxW: 6, minH: 3, maxH: 5 } 
  }
};