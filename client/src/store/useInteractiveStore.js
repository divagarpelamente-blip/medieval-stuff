import { create } from 'zustand';

export const useInteractiveStore = create((set) => ({
  filters: {
    startDate: null,
    endDate: null,
    granularity: 'Monthly',
    statusFilter: null,
    arrearFilter: null,
    categoryFilter: null,
  },
  
  // Updates a single filter and leaves the rest intact
  setFilter: (key, value) => set((state) => ({
    filters: { ...state.filters, [key]: value }
  })),

  // Clears cross-filters (useful for a "Reset" button)
  clearFilters: () => set({
    filters: {
      startDate: null,
      endDate: null,
      granularity: 'Monthly',
      statusFilter: null,
      arrearFilter: null,
      categoryFilter: null,
    }
  }),
}));