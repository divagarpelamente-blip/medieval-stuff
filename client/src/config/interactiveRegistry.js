import {
  InteractiveDateFilter,
  InteractiveGranularity,
  InteractiveStatus,
  InteractiveArrear,
  InteractiveCategory,
  InteractiveEntity, // NEW
  InteractiveLedger
} from '../components/widgets/InteractiveAPARWidgets';

export const INTERACTIVE_WIDGETS = {
  inter_date_picker: { 
    name: "Date Range Selector", 
    component: InteractiveDateFilter, 
    description: "Sets the global start and end date boundaries for interactive dashboards.", 
    category: "interactive", 
    layout: { w: 5, h: 2, minW: 4, maxW: 8, minH: 1, maxH: 3 } 
  },
  inter_granularity: { 
    name: "Granularity Selector", 
    component: InteractiveGranularity, 
    description: "Sets grouping scales (Weekly, Monthly, etc.) for interactive charts.", 
    category: "interactive", 
    layout: { w: 4, h: 2, minW: 3, maxW: 12, minH: 1, maxH: 3 } 
  },
  inter_status: { 
    name: "Payment Status Split", 
    component: InteractiveStatus, 
    description: "Filters transactions by Pending vs Completed status.", 
    category: "interactive", 
    layout: { w: 4, h: 2, minW: 3, maxW: 12, minH: 1, maxH: 4 } 
  },
  inter_arrear: { 
    name: "Aging & Arrears", 
    component: InteractiveArrear, 
    description: "Filters pending and paid invoices by detailed chronological urgency.", 
    category: "interactive", 
    layout: { w: 12, h: 1, minW: 6, maxW: 12, minH: 1, maxH: 4 } 
  },
  inter_category: { 
    name: "Interactive Category Flow", 
    component: InteractiveCategory, 
    description: "Clickable bar chart that filters the dashboard by specific category volumes.", 
    category: "interactive", 
    layout: { w: 4, h: 4, minW: 3, maxW: 8, minH: 3, maxH: 6 } 
  },
  inter_entity: { 
    name: "Interactive Entity Flow", 
    component: InteractiveEntity, 
    description: "Clickable bar chart that filters the dashboard by specific entity volumes.", 
    category: "interactive", 
    layout: { w: 4, h: 4, minW: 3, maxW: 8, minH: 3, maxH: 6 } 
  },
  inter_ledger: { 
    name: "Cross-Filtered Ledger", 
    component: InteractiveLedger, 
    description: "Master table that outputs exactly what the interactive filters dictate.", 
    category: "interactive", 
    layout: { w: 8, h: 4, minW: 4, maxW: 12, minH: 3, maxH: 8 } 
  }
};