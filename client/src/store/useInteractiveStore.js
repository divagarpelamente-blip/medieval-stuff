// client/src/store/useInteractiveStore.js

import { create } from 'zustand';

export const useInteractiveStore = create((set) => ({
  filters: {
    startDate: null,
    endDate: null,
    monthFilter: null,
    granularity: 'Monthly',
    statusFilter: null,
    arrearFilter: null,
    categoryFilter: null,
    entityFilter: null,
  },
  
  setFilter: (key, value) => set((state) => {
    const newFilters = { ...state.filters, [key]: value };
    
    if (key === 'monthFilter' && value) {
      newFilters.startDate = null;
      newFilters.endDate = null;
    }
    if ((key === 'startDate' || key === 'endDate') && value) {
      newFilters.monthFilter = null;
    }
    
    return { filters: newFilters };
  }),

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