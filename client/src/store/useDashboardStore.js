// client/src/store/useDashboardStore.js

import { create } from 'zustand';
import { MAX_WIDGETS_PER_TAB, DEFAULT_PRESET } from '../config/dashboard.config';
import { useKingdomStore } from './useKingdomStore';
import { supabase } from '../lib/supabaseClient';

const DEFAULT_INTERACTIVE_PRESET = [
  { i: 'inter_granularity-1', x: 0, y: 0, w: 4, h: 1, minW: 3, maxW: 12, minH: 1, maxH: 3 },
  { i: 'inter_date_picker-1', x: 4, y: 0, w: 4, h: 1, minW: 4, maxW: 8, minH: 1, maxH: 3 },
  { i: 'inter_status-1', x: 8, y: 0, w: 4, h: 1, minW: 3, maxW: 12, minH: 1, maxH: 4 },
  { i: 'inter_arrear-1', x: 0, y: 1, w: 12, h: 1, minW: 6, maxW: 12, minH: 1, maxH: 4 },
  { i: 'inter_category-1', x: 0, y: 2, w: 4, h: 4, minW: 3, maxW: 8, minH: 3, maxH: 6 },
  { i: 'inter_entity-1', x: 4, y: 2, w: 4, h: 4, minW: 3, maxW: 8, minH: 3, maxH: 6 },
  { i: 'inter_ledger-1', x: 8, y: 2, w: 4, h: 4, minW: 4, maxW: 12, minH: 3, maxH: 8 }
];

const DEFAULT_FPA_PRESET = [
  { i: 'ratio_budget_actual-1', x: 0, y: 0, w: 6, h: 4, minW: 4, maxW: 12, minH: 3, maxH: 6 },
  { i: 'trend_cash_forecast-1', x: 6, y: 0, w: 6, h: 4, minW: 4, maxW: 12, minH: 3, maxH: 6 },
  { i: 'advisor_royal-1', x: 0, y: 4, w: 12, h: 4, minW: 4, maxW: 12, minH: 3, maxH: 8 }
];

const INITIAL_SUBMENUS = [
  { id: 'insights', name: 'Insights', isVisible: true, isActive: true },
  { id: 'apar_interactive', name: 'AP/AR Command', isVisible: true, isActive: false },
  { id: 'tab_1', name: 'Royal Treasury', isVisible: true, isActive: false },
  { id: 'tab_2', name: 'Campaign Ledger', isVisible: false, isActive: false },
  { id: 'tab_3', name: 'Citadel Reserves', isVisible: false, isActive: false },
  { id: 'tab_4', name: 'F P & A', isVisible: false, isActive: false },
  { id: 'tab_5', name: 'Vassal Tributes', isVisible: false, isActive: false },
  { id: 'tab_6', name: 'War Fund', isVisible: false, isActive: false },
];

export const useDashboardStore = create((set, get) => ({
  isEditingLayout: false,
  isLoading: false,
  isSaving: false,
  hasUnsavedChanges: false,
  submenus: INITIAL_SUBMENUS,
  
  savedLayout: {
    insights: JSON.parse(JSON.stringify(DEFAULT_PRESET)),
    apar_interactive: JSON.parse(JSON.stringify(DEFAULT_INTERACTIVE_PRESET)),
    tab_1: JSON.parse(JSON.stringify(DEFAULT_PRESET)),
    tab_2: [],
    tab_3: [],
    tab_4: JSON.parse(JSON.stringify(DEFAULT_FPA_PRESET)),
    tab_5: [],
    tab_6: [],
  },
  
  draftLayout: {
    insights: JSON.parse(JSON.stringify(DEFAULT_PRESET)),
    apar_interactive: JSON.parse(JSON.stringify(DEFAULT_INTERACTIVE_PRESET)),
    tab_1: JSON.parse(JSON.stringify(DEFAULT_PRESET)),
    tab_2: [],
    tab_3: [],
    tab_4: JSON.parse(JSON.stringify(DEFAULT_FPA_PRESET)),
    tab_5: [],
    tab_6: [],
  },

  hydrateLayouts: async () => {
    set({ isLoading: true });
    try {
      const kingdomStore = useKingdomStore.getState();
      const user = kingdomStore?.user;

      let loadedPayload = null;
      let databaseQuerySucceeded = false;

      if (user?.id) {
        const { data, error } = await supabase
          .from('profiles')
          .select('dashboard_layouts')
          .eq('id', user.id)
          .maybeSingle();
        
        if (!error) {
          databaseQuerySucceeded = true;
          if (data?.dashboard_layouts) {
            loadedPayload = data.dashboard_layouts;
          }
        }
      }

      if (!databaseQuerySucceeded && !loadedPayload) {
        const localCache = localStorage.getItem('eldoria_dashboard_layouts');
        if (localCache) {
          try {
            loadedPayload = JSON.parse(localCache);
          } catch (e) {
            console.warn("Corrupted client database caches skipped during layout mapping:", e);
          }
        }
      }

      if (loadedPayload) {
        const { savedLayout, submenus } = loadedPayload;
        
        const finalSaved = {
          insights: savedLayout?.insights ? JSON.parse(JSON.stringify(savedLayout.insights)) : JSON.parse(JSON.stringify(DEFAULT_PRESET)),
          apar_interactive: (savedLayout?.apar_interactive && !savedLayout.apar_interactive.some(item => item.i === 'inter_date_picker-1' && item.w < 4)) 
            ? JSON.parse(JSON.stringify(savedLayout.apar_interactive)) 
            : JSON.parse(JSON.stringify(DEFAULT_INTERACTIVE_PRESET)),
          tab_1: savedLayout?.tab_1 ? JSON.parse(JSON.stringify(savedLayout.tab_1)) : JSON.parse(JSON.stringify(DEFAULT_PRESET)),
          tab_2: savedLayout?.tab_2 ? JSON.parse(JSON.stringify(savedLayout.tab_2)) : [],
          tab_3: savedLayout?.tab_3 ? JSON.parse(JSON.stringify(savedLayout.tab_3)) : [],
          tab_4: savedLayout?.tab_4 ? JSON.parse(JSON.stringify(savedLayout.tab_4)) : [],
          tab_5: savedLayout?.tab_5 ? JSON.parse(JSON.stringify(savedLayout.tab_5)) : [],
          tab_6: savedLayout?.tab_6 ? JSON.parse(JSON.stringify(savedLayout.tab_6)) : [],
        };

        const mergedSubmenus = INITIAL_SUBMENUS.map((defaultTab) => {
          const cachedTab = Array.isArray(submenus) ? submenus.find((s) => s.id === defaultTab.id) : null;
          if (cachedTab) {
            const isProtected = defaultTab.id === 'insights' || defaultTab.id === 'tab_1' || defaultTab.id === 'apar_interactive';
            return {
              ...defaultTab,
              name: cachedTab.name || defaultTab.name,
              isVisible: isProtected ? true : (cachedTab.isVisible !== undefined ? cachedTab.isVisible : defaultTab.isVisible),
            };
          }
          return defaultTab;
        });

        const cachedActiveTab = Array.isArray(submenus) ? submenus.find((s) => s.isActive && s.isVisible) : null;
        let activeId = cachedActiveTab ? cachedActiveTab.id : 'insights';
        const isValidId = INITIAL_SUBMENUS.some(tab => tab.id === activeId);
        if (!isValidId) activeId = 'insights';

        const finalSubmenus = mergedSubmenus.map((tab) => ({
          ...tab,
          isActive: tab.id === activeId,
        }));

        set({
          savedLayout: finalSaved,
          draftLayout: JSON.parse(JSON.stringify(finalSaved)),
          submenus: finalSubmenus,
          hasUnsavedChanges: false,
        });
      } else {
        const defaultLayout = {
          insights: JSON.parse(JSON.stringify(DEFAULT_PRESET)),
          apar_interactive: JSON.parse(JSON.stringify(DEFAULT_INTERACTIVE_PRESET)),
          tab_1: JSON.parse(JSON.stringify(DEFAULT_PRESET)),
          tab_2: [], tab_3: [], tab_4: [], tab_5: [], tab_6: [],
        };
        set({
          savedLayout: defaultLayout,
          draftLayout: JSON.parse(JSON.stringify(defaultLayout)),
          submenus: INITIAL_SUBMENUS,
          hasUnsavedChanges: false,
        });
      }
    } catch (err) {
      console.error("Hydration process encountered an error, falling back to baseline defaults:", err);
    } finally {
      set({ isLoading: false });
    }
  },

  saveDraftToProduction: async (keepEditing = false) => {
    set({ isSaving: true });
    const state = get();
    const committedDraft = JSON.parse(JSON.stringify(state.draftLayout));
    const committedSubmenus = JSON.parse(JSON.stringify(state.submenus));

    const payload = {
      savedLayout: committedDraft,
      submenus: committedSubmenus,
    };

    try {
      localStorage.setItem('eldoria_dashboard_layouts', JSON.stringify(payload));
    } catch (e) {
      console.warn("Client layout sync rejected by local device constraints:", e);
    }

    try {
      const kingdomStore = useKingdomStore.getState();
      const user = kingdomStore?.user;

      if (user?.id) {
        const { error } = await supabase
          .from('profiles')
          .update({ dashboard_layouts: payload })
          .eq('id', user.id);

        if (error) throw error;
      }
    } catch (err) {
      console.error("Supabase failed to archive remote changes, offline backup preserved:", err);
    } finally {
      set({
        savedLayout: committedDraft,
        isEditingLayout: keepEditing ? state.isEditingLayout : false,
        isSaving: false,
        hasUnsavedChanges: false,
      });
    }
  },
  
  toggleEditMode: (active) => {
    set((state) => ({
      isEditingLayout: !!active,
      draftLayout: JSON.parse(JSON.stringify(state.savedLayout)),
      hasUnsavedChanges: false
    }));
  },

  updateDraftLayout: (tabId, nextLayout) => {
    if (!Array.isArray(nextLayout)) return false;
    
    set((state) => ({
      draftLayout: {
        ...state.draftLayout,
        [tabId]: JSON.parse(JSON.stringify(nextLayout))
      },
      hasUnsavedChanges: true
    }));
    return true;
  },

  setActiveSubmenu: (tabId) => {
    set((state) => ({
      submenus: state.submenus.map((sub) => ({
        ...sub,
        isActive: sub.id === tabId
      }))
    }));
  },

  toggleSubmenuVisibility: (tabId) => {
    if (tabId === 'insights' || tabId === 'tab_1' || tabId === 'apar_interactive') return;

    set((state) => {
      const updatedSubmenus = state.submenus.map((sub) => {
        if (sub.id === tabId) {
          return { ...sub, isVisible: !sub.isVisible };
        }
        return sub;
      });

      const wasInvisible = state.submenus.find((s) => s.id === tabId)?.isVisible === false;
      const nextDraft = JSON.parse(JSON.stringify(state.draftLayout));

      if (wasInvisible && (!nextDraft[tabId] || nextDraft[tabId].length === 0)) {
        nextDraft[tabId] = JSON.parse(JSON.stringify(DEFAULT_PRESET));
      }

      return {
        submenus: updatedSubmenus,
        draftLayout: nextDraft,
        hasUnsavedChanges: true
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
      }),
      hasUnsavedChanges: true
    }));
  },

  deployWidget: (tabId, widgetId, widgetDef) => {
    const state = get();
    const currentLayout = Array.isArray(state.draftLayout[tabId]) 
      ? JSON.parse(JSON.stringify(state.draftLayout[tabId])) 
      : [];

    if (currentLayout.length >= MAX_WIDGETS_PER_TAB) {
      console.warn("Max widgets per tab limit reached.");
      return false;
    }

    const uniqueInstanceId = `${widgetId}-${Date.now()}`;
    const w = widgetDef.layout?.w || 4;
    const h = widgetDef.layout?.h || 3;
    const cols = 12;

    let foundX = 0;
    let foundY = 0;
    let placed = false;

    for (let y = 0; y < 50; y++) {
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

    if (!placed) {
      foundX = 0;
      foundY = currentLayout.length * 3;
    }

    const newLayoutItem = {
      i: uniqueInstanceId,
      x: foundX,
      y: foundY,
      w,
      h,
      minW: widgetDef.layout?.minW || 2,
      maxW: widgetDef.layout?.maxW || 12,
      minH: widgetDef.layout?.minH || 2,
      maxH: widgetDef.layout?.maxH || 6,
    };

    const updatedLayout = [...currentLayout, newLayoutItem];
    
    set((prevState) => ({
      draftLayout: {
        ...prevState.draftLayout,
        [tabId]: updatedLayout
      },
      hasUnsavedChanges: true
    }));

    return true;
  }
}));

export default useDashboardStore;