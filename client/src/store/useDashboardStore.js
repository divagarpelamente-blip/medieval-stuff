import { create } from 'zustand';
import { MAX_WIDGETS_PER_TAB, DEFAULT_PRESET } from '../config/dashboard.config';
import { useKingdomStore } from './useKingdomStore';

const INITIAL_SUBMENUS = [
  { id: 'tab_1', name: 'Royal Treasury', isVisible: true, isActive: true },
  { id: 'tab_2', name: 'Campaign Ledger', isVisible: false, isActive: false },
  { id: 'tab_3', name: 'Citadel Reserves', isVisible: false, isActive: false },
  { id: 'tab_4', name: 'Merchant Guild', isVisible: false, isActive: false },
  { id: 'tab_5', name: 'Vassal Tributes', isVisible: false, isActive: false },
  { id: 'tab_6', name: 'War Fund', isVisible: false, isActive: false },
];

export const useDashboardStore = create((set, get) => ({
  // ==========================================
  // CORE STATE
  // ==========================================
  isEditingLayout: false,
  isLoading: false,
  isSaving: false,
  submenus: INITIAL_SUBMENUS,
  
  savedLayout: {
    tab_1: [...DEFAULT_PRESET],
    tab_2: [],
    tab_3: [],
    tab_4: [],
    tab_5: [],
    tab_6: [],
  },
  
  draftLayout: {
    tab_1: [...DEFAULT_PRESET],
    tab_2: [],
    tab_3: [],
    tab_4: [],
    tab_5: [],
    tab_6: [],
  },

  // ==========================================
  // DATABASE PERSISTENCE & HYDRATION
  // ==========================================

  /**
   * Syncs custom layout configuration files down from the active Supabase ledger profile.
   * Gracefully loads fallback maps if remote storage records are unreachable.
   */
  hydrateLayouts: async () => {
    set({ isLoading: true });
    try {
      const kingdomStore = useKingdomStore.getState();
      const supabase = kingdomStore?.supabase;
      const profile = kingdomStore?.profile;

      let loadedPayload = null;

      // 1. Attempt connection fetch from Supabase Profiles Table
      if (supabase && profile?.id) {
        const { data, error } = await supabase
          .from('profiles')
          .select('dashboard_layouts')
          .eq('id', profile.id)
          .single();
        
        if (!error && data?.dashboard_layouts) {
          loadedPayload = data.dashboard_layouts;
        }
      }

      // 2. Client fallback cache lookup if database payload is empty
      if (!loadedPayload) {
        const localCache = localStorage.getItem('eldoria_dashboard_layouts');
        if (localCache) {
          try {
            loadedPayload = JSON.parse(localCache);
          } catch (e) {
            console.warn("Corrupted client database caches skipped during layout mapping:", e);
          }
        }
      }

      // 3. Setup structural boundaries over restored objects
      if (loadedPayload) {
        const { savedLayout, submenus } = loadedPayload;
        
        const finalSaved = {
          tab_1: savedLayout?.tab_1 || [...DEFAULT_PRESET],
          tab_2: savedLayout?.tab_2 || [],
          tab_3: savedLayout?.tab_3 || [],
          tab_4: savedLayout?.tab_4 || [],
          tab_5: savedLayout?.tab_5 || [],
          tab_6: savedLayout?.tab_6 || [],
        };

        set({
          savedLayout: finalSaved,
          draftLayout: JSON.parse(JSON.stringify(finalSaved)),
          submenus: submenus || INITIAL_SUBMENUS,
        });
      }
    } catch (err) {
      console.error("Hydration process encountered an error, falling back to local layout configuration:", err);
    } finally {
      set({ isLoading: false });
    }
  },

  /**
   * Overrides local state with the sandbox draft layout and commits updates to Supabase.
   */
  saveDraftToProduction: async () => {
    set({ isSaving: true });
    const state = get();
    const committedDraft = JSON.parse(JSON.stringify(state.draftLayout));
    const committedSubmenus = JSON.parse(JSON.stringify(state.submenus));

    const payload = {
      savedLayout: committedDraft,
      submenus: committedSubmenus,
    };

    // Fast-path client updates
    try {
      localStorage.setItem('eldoria_dashboard_layouts', JSON.stringify(payload));
    } catch (e) {
      console.warn("Client layout sync rejected by device constraints:", e);
    }

    // Remote persistence write back
    try {
      const kingdomStore = useKingdomStore.getState();
      const supabase = kingdomStore?.supabase;
      const profile = kingdomStore?.profile;

      if (supabase && profile?.id) {
        const { error } = await supabase
          .from('profiles')
          .update({ dashboard_layouts: payload })
          .eq('id', profile.id);

        if (error) throw error;
      }
    } catch (err) {
      console.error("Supabase failed to archive remote changes, offline backup preserved:", err);
    } finally {
      set({
        savedLayout: committedDraft,
        isEditingLayout: false,
        isSaving: false,
      });
    }
  },

  // ==========================================
  // EDIT STATE STANCE SHIFT ACTIONS
  // ==========================================
  
  toggleEditMode: (active) => {
    set((state) => {
      if (active) {
        const deepClonedSaved = JSON.parse(JSON.stringify(state.savedLayout));
        return {
          isEditingLayout: true,
          draftLayout: deepClonedSaved
        };
      } else {
        return {
          isEditingLayout: false,
          draftLayout: JSON.parse(JSON.stringify(state.savedLayout))
        };
      }
    });
  },

  updateDraftLayout: (tabId, nextLayout) => {
    if (!Array.isArray(nextLayout)) return false;

    if (nextLayout.length > MAX_WIDGETS_PER_TAB) {
      console.warn(`Grid action denied: Exceeds absolute cap of ${MAX_WIDGETS_PER_TAB} active widgets.`);
      return false;
    }

    set((state) => ({
      draftLayout: {
        ...state.draftLayout,
        [tabId]: nextLayout
      }
    }));
    return true;
  },

  // ==========================================
  // SUBMENU UTILITIES
  // ==========================================

  setActiveSubmenu: (tabId) => {
    set((state) => ({
      submenus: state.submenus.map((sub) => ({
        ...sub,
        isActive: sub.id === tabId
      }))
    }));
  },

  toggleSubmenuVisibility: (tabId) => {
    set((state) => {
      const updatedSubmenus = state.submenus.map((sub) => {
        if (sub.id === tabId) {
          return { ...sub, isVisible: !sub.isVisible };
        }
        return sub;
      });

      const wasInvisible = state.submenus.find((s) => s.id === tabId)?.isVisible === false;
      const nextDraft = { ...state.draftLayout };

      if (wasInvisible && (!nextDraft[tabId] || nextDraft[tabId].length === 0)) {
        nextDraft[tabId] = [...DEFAULT_PRESET];
      }

      return {
        submenus: updatedSubmenus,
        draftLayout: nextDraft
      };
    });
  },

  updateSubmenuName: (tabId, newName) => {
    if (!newName || typeof newName !== 'string') return;
    
    set((state) => ({
      submenus: state.submenus.map((sub) => {
        if (sub.id === tabId) {
          return { ...sub, name: newName.trim() };
        }
        return sub;
      })
    }));
  },

  // ==========================================
  // WIDGET PLACEMENT ENGINE
  // ==========================================

  deployWidget: (tabId, widgetId, widgetDef) => {
    const state = get();
    const currentLayout = state.draftLayout[tabId] || [];

    if (currentLayout.length >= MAX_WIDGETS_PER_TAB) {
      alert(`The vault space is full! Max Limit of ${MAX_WIDGETS_PER_TAB} active structures reached.`);
      return false;
    }

    const uniqueInstanceId = `${widgetId}-${Date.now()}`;
    const w = widgetDef.layout.w;
    const h = widgetDef.layout.h;
    const cols = 12;

    let foundX = 0;
    let foundY = 0;
    let placed = false;

    for (let y = 0; y < 200; y++) {
      for (let x = 0; x <= cols - w; x++) {
        let overlap = false;
        for (const item of currentLayout) {
          const overlapX = x < item.x + item.w && x + w > item.x;
          const overlapY = y < item.y + item.h && y + h > item.y;
          if (overlapX && overlapY) {
            overlap = true;
            break;
          }
        }
        if (!overlap) {
          foundX = x;
          foundY = y;
          placed = true;
          break;
        }
      }
      if (placed) break;
    }

    const newLayoutItem = {
      i: uniqueInstanceId,
      x: foundX,
      y: foundY,
      w,
      h,
      minW: widgetDef.layout.minW,
      maxW: widgetDef.layout.maxW,
      minH: widgetDef.layout.minH,
      maxH: widgetDef.layout.maxH,
    };

    const updatedLayout = [...currentLayout, newLayoutItem];
    return state.updateDraftLayout(tabId, updatedLayout);
  }
}));

export default useDashboardStore;