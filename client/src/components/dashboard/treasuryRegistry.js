import CashFlowChart from './CashFlowChart';
import NetWorthChart from './NetWorthChart';
import AssetAllocationChart from './AssetAllocationChart';

/**
 * Eldoria V2.1 Domain-Ready Widget Registry: Treasury Assets
 * Maps components with sensible min/max constraints, fallback dimensional bounds,
 * and DDD metadata for dynamic sidebar rendering.
 */
export const TREASURY_WIDGETS = {
  cash_flow_chart: {
    id: 'cash_flow_chart',
    name: 'Treasury Cash Flow Curve',
    component: CashFlowChart,
    domain: 'treasury',
    category: 'chart',
    layout: {
      w: 5,
      h: 3,
      minW: 3,
      maxW: 12,
      minH: 2,
      maxH: 6,
    },
  },
  net_worth_chart: {
    id: 'net_worth_chart',
    name: 'Net Treasury Reserves Trend',
    component: NetWorthChart,
    domain: 'treasury',
    category: 'overview',
    layout: {
      w: 5,
      h: 3,
      minW: 3,
      maxW: 12,
      minH: 2,
      maxH: 6,
    },
  },
  asset_allocation_chart: {
    id: 'asset_allocation_chart',
    name: 'Asset Allocation breakdown',
    component: AssetAllocationChart,
    domain: 'treasury',
    category: 'ledger',
    layout: {
      w: 3,
      h: 3,
      minW: 2,
      maxW: 6,
      minH: 2,
      maxH: 6,
    },
  },
};

export default TREASURY_WIDGETS;