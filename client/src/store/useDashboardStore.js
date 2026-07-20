import { create } from 'zustand';
import { MAX_WIDGETS_PER_TAB, DEFAULT_PRESET } from '../config/dashboard.config';
import { useKingdomStore } from './useKingdomStore';

const INITIAL_SUBMENUS = [
  { id: 'insights', name: 'Insights', isVisible: true, isActive: true },
  { id: 'tab_1', name: 'Royal Treasury', isVisible: true, isActive: false },
  { id: 'tab_2', name: 'Campaign Ledger', isVisible: false, isActive: false },
  { id: 'tab_3', name: 'Citadel Reserves', isVisible: false, isActive: false },
  { id: 'tab_4', name: 'Merchant Guild', isVisible: false, isActive: false },
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
    tab_1: JSON.parse(JSON.stringify(DEFAULT_PRESET)),
    tab_2: [],
    tab_3: [],
    tab_4: [],
    tab_5: [],
    tab_6: [],
  },
  
  draftLayout: {
    insights: JSON.parse(JSON.stringify(DEFAULT_PRESET)),
    tab_1: JSON.parse(JSON.stringify(DEFAULT_PRESET)),
    tab_2: [],
    tab_3: [],
    tab_4: [],
    tab_5: [],
    tab_6: [],
  },

  hydrateLayouts: async () => {
    set({ isLoading: true });
    try {
      const kingdomStore = useKingdomStore.getState();
      const supabase = kingdomStore?.supabase;
      const profile = kingdomStore?.profile;

      let loadedPayload = null;
      let databaseQuerySucceeded = false;

      // 1. Primary Sync from Supabase profiles schema
      if (supabase && profile?.id) {
        const { data, error } = await supabase
          .from('profiles')
          .select('dashboard_layouts')
          .eq('id', profile.id)
          .maybeSingle();
        
        if (!error) {
          databaseQuerySucceeded = true;
          if (data?.dashboard_layouts) {
            loadedPayload = data.dashboard_layouts;
          }
        }
      }

      // 2. Local Fallback Cache (only leveraged if database retrieval failed or profile id is unresolvable)
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

      // 3. Setup structural boundaries over restored or default objects
      if (loadedPayload) {
        const { savedLayout, submenus } = loadedPayload;
        
        const finalSaved = {
          insights: savedLayout?.insights || JSON.parse(JSON.stringify(DEFAULT_PRESET)),
          tab_1: savedLayout?.tab_1 || JSON.parse(JSON.stringify(DEFAULT_PRESET)),
          tab_2: savedLayout?.tab_2 || [],
          tab_3: savedLayout?.tab_3 || [],
          tab_4: savedLayout?.tab_4 || [],
          tab_5: savedLayout?.tab_5 || [],
          tab_6: savedLayout?.tab_6 || [],
        };

        // Enforce structural visibility integrity on primary default panels
        const mergedSubmenus = INITIAL_SUBMENUS.map((defaultTab) => {
          const cachedTab = Array.isArray(submenus) ? submenus.find((s) => s.id === defaultTab.id) : null;
          if (cachedTab) {
            const isProtected = defaultTab.id === 'insights' || defaultTab.id === 'tab_1';
            return {
              ...defaultTab,
              name: cachedTab.name || defaultTab.name,
              isVisible: isProtected ? true : (cachedTab.isVisible !== undefined ? cachedTab.isVisible : defaultTab.isVisible),
            };
          }
          return defaultTab;
        });

        // Safe Active Submenu evaluation
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
        // Safe Reset/Instantiation fallback block if store contains no layout configurations
        const defaultLayout = {
          insights: JSON.parse(JSON.stringify(DEFAULT_PRESET)),
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
        isEditingLayout: keepEditing ? state.isEditingLayout : false,
        isSaving: false,
        hasUnsavedChanges: false, // Reset track state on DB sync success
      });
    }
  },
  
  toggleEditMode: (active) => {
    set((state) => ({
      isEditingLayout: !!active,
      draftLayout: JSON.parse(JSON.stringify(state.savedLayout)),
      hasUnsavedChanges: false // Reset when starting a fresh edit session or discarding draft
    }));
  },

  updateDraftLayout: (tabId, nextLayout) => {
    // STANCE LOCKS REMOVED: Unconditionally allow coordinate adjustments in draft layouts
    if (!Array.isArray(nextLayout) || nextLayout.length > MAX_WIDGETS_PER_TAB) return false;
    
    set((state) => ({
      draftLayout: {
        ...state.draftLayout,
        [tabId]: nextLayout
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
    // STRICT TOGGLE PROTECTION: insights and tab_1 must remain visible
    if (tabId === 'insights' || tabId === 'tab_1') return;

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
    const currentLayout = state.draftLayout[tabId] || [];

    if (currentLayout.length >= MAX_WIDGETS_PER_TAB) {
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
    set({ hasUnsavedChanges: true });
    return state.updateDraftLayout(tabId, updatedLayout);
  }
}));

export default useDashboardStore;