/**
 * Eldoria V2.1 Centralized Dashboard Configuration Invariants
 * Dictates layout limitations and initial dynamic templates for new cycles.
 */

// Maximum layout items permitted on any single grid workspace to prevent layout lag
export const MAX_WIDGETS_PER_TAB = 8;

// Baseline Preset ("Standard 1") injected on tab expansion
export const DEFAULT_PRESET = [
  { 
    i: 'cash_flow_chart', 
    x: 0, 
    y: 0, 
    w: 5, 
    h: 3, 
    minW: 3, 
    maxW: 12, 
    minH: 2, 
    maxH: 6 
  },
  { 
    i: 'net_worth_chart', 
    x: 5, 
    y: 0, 
    w: 5, 
    h: 3, 
    minW: 3, 
    maxW: 12, 
    minH: 2, 
    maxH: 6 
  },
  { 
    i: 'asset_allocation_chart', 
    x: 0, 
    y: 3, 
    w: 3, 
    h: 3, 
    minW: 2, 
    maxW: 6, 
    minH: 2, 
    maxH: 6 
  }
];

export const DASHBOARD_CONFIG = {
  MAX_WIDGETS_PER_TAB,
  DEFAULT_PRESET
};

export default DASHBOARD_CONFIG;