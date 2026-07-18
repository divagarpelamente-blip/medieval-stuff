import { create } from 'zustand';
import { MAX_WIDGETS_PER_TAB, DEFAULT_PRESET } from '../config/dashboard.config';

// Primary submenu template array
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
  submenus: INITIAL_SUBMENUS,
  
  // Layout records structured as: { tab_id: [ GridItemObjects ] }
  savedLayout: {
    tab_1: [...DEFAULT_PRESET],
    tab_2: [],
    tab_3: [],
    tab_4: [],
    tab_5: [],
    tab_6: [],
  },
  
  // Clone record used as a local sandbox before committing changes
  draftLayout: {
    tab_1: [...DEFAULT_PRESET],
    tab_2: [],
    tab_3: [],
    tab_4: [],
    tab_5: [],
    tab_6: [],
  },

  // ==========================================
  // EDIT STATE STANCE SHIFT ACTIONS
  // ==========================================
  
  /**
   * Switches the active layout editor stance.
   * If transitioning into edit mode, saves an isolated copy of current state to the sandbox.
   */
  toggleEditMode: (active) => {
    set((state) => {
      if (active) {
        // Clone savedLayout into draftLayout
        const deepClonedSaved = JSON.parse(JSON.stringify(state.savedLayout));
        return {
          isEditingLayout: true,
          draftLayout: deepClonedSaved
        };
      } else {
        // Nullify draft layout tracking without saving changes
        return {
          isEditingLayout: false,
          draftLayout: JSON.parse(JSON.stringify(state.savedLayout))
        };
      }
    });
  },

  /**
   * Modifies components located inside the draft tab zone, validating limits.
   */
  updateDraftLayout: (tabId, nextLayout) => {
    if (!Array.isArray(nextLayout)) return false;

    // Enforce the strict MAX_WIDGETS_PER_TAB layout safety boundary
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

  /**
   * Swaps the active submenu space.
   */
  setActiveSubmenu: (tabId) => {
    set((state) => ({
      submenus: state.submenus.map((sub) => ({
        ...sub,
        isActive: sub.id === tabId
      }))
    }));
  },

  /**
   * Flips visibility toggle for submenus.
   * If a hidden tab becomes visible, loads baseline layout to its sandbox profile.
   */
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

      // Initialize empty dashboard tabs with the Standard 1 preset template
      if (wasInvisible && (!nextDraft[tabId] || nextDraft[tabId].length === 0)) {
        nextDraft[tabId] = [...DEFAULT_PRESET];
      }

      return {
        submenus: updatedSubmenus,
        draftLayout: nextDraft
      };
    });
  },

  /**
   * Overrides localized text tag of a submenu.
   */
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
  // STAGE SYNCHRONIZATION
  // ==========================================

  /**
   * Commits the draft sandbox to active production.
   */
  saveDraftToProduction: () => {
    set((state) => {
      const committedDraft = JSON.parse(JSON.stringify(state.draftLayout));
      return {
        savedLayout: committedDraft,
        isEditingLayout: false
      };
    });
  },

  /**
   * Appends a widget directly to the active tab workspace at the bottom.
   */
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
    const cols = 12; // Standard Eldoria grid columns

    let foundX = 0;
    let foundY = 0;
    let placed = false;

    // Find first empty grid gap (top-to-bottom, left-to-right)
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