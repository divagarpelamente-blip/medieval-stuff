import CashFlowChart from './CashFlowChart';
import NetWorthChart from './NetWorthChart';
import AssetAllocationChart from './AssetAllocationChart';

/**
 * Eldoria V2.1 Grid-Ready Widget Registry
 * Maps components with sensible min/max constraints and fallback dimensional bounds.
 */
export const WIDGET_REGISTRY = {
  cash_flow_chart: {
    id: 'cash_flow_chart',
    name: 'Treasury Cash Flow Curve',
    component: CashFlowChart,
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

export default WIDGET_REGISTRY;