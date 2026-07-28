import { create } from 'zustand';

export const useInteractiveStore = create((set) => ({
  filters: {
    startDate: null,
    endDate: null,
    monthFilter: null, // NEW
    granularity: 'Monthly',
    statusFilter: null,
    arrearFilter: null,
    categoryFilter: null,
    entityFilter: null, // NEW
  },
  
  // Updates a single filter and auto-clears conflicting date filters
  setFilter: (key, value) => set((state) => {
    const newFilters = { ...state.filters, [key]: value };
    
    // Auto-clear logic for dates vs month
    if (key === 'monthFilter' && value) {
      newFilters.startDate = null;
      newFilters.endDate = null;
    }
    if ((key === 'startDate' || key === 'endDate') && value) {
      newFilters.monthFilter = null;
    }
    
    return { filters: newFilters };
  }),

  // Clears cross-filters (Triggered by the new Global X button)
  clearFilters: () => set({
    filters: {
      startDate: null,
      endDate: null,
      monthFilter: null,
      granularity: 'Monthly',
      statusFilter: null,
      arrearFilter: null,
      categoryFilter: null,
      entityFilter: null,
    }
  }),
}));