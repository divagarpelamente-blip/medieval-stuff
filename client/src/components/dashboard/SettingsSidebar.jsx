import React, { useState } from 'react';
import { useDashboardStore } from '../../store/useDashboardStore';
import { WIDGET_REGISTRY } from './widgetRegistry';
import { DEFAULT_PRESET } from '../../config/dashboard.config';
import { Eye, EyeOff, Pencil, Check, Layers, Grid, SlidersHorizontal, Plus } from 'lucide-react';

// Alternative presets for layout injection
const EXTRA_PRESETS = {
  standard_1: {
    name: 'Standard Preset',
    layout: DEFAULT_PRESET,
  },
  focused_flow: {
    name: 'Inflow Priority',
    layout: [
      { i: 'cash_flow_chart', x: 0, y: 0, w: 12, h: 5 },
      { i: 'asset_allocation_chart', x: 0, y: 5, w: 6, h: 4 },
    ],
  },
  max_analytics: {
    name: 'Unified Command',
    layout: [
      { i: 'cash_flow_chart', x: 0, y: 0, w: 6, h: 4 },
      { i: 'net_worth_chart', x: 6, y: 0, w: 6, h: 4 },
      { i: 'asset_allocation_chart', x: 0, y: 4, w: 12, h: 4 },
    ],
  },
};

export default function SettingsSidebar() {
  const {
    isEditingLayout,
    submenus,
    toggleSubmenuVisibility,
    updateSubmenuName,
    setActiveSubmenu,
    updateDraftLayout,
    deployWidget,
  } = useDashboardStore();

  const [editingTabId, setEditingTabId] = useState(null);
  const [tempName, setTempName] = useState('');
  
  // 1. Isolated Accordion Menu State
  const [activeSection, setActiveSection] = useState(null); // 'ledgers' | 'presets' | 'widgets' | null

  // 2. Category Filtering State
  const [widgetCategory, setWidgetCategory] = useState('All'); // 'All' | 'Analytics' | 'Treasury'

  // Find active tab ID
  const activeTab = submenus.find((sub) => sub.isActive);
  const activeTabId = activeTab ? activeTab.id : 'insights';

  // Return empty block on desktop if edit stance is off
  if (!isEditingLayout) return null;

  const handleStartRename = (tab) => {
    setEditingTabId(tab.id);
    setTempName(tab.name);
  };

  const handleSaveRename = (tabId) => {
    updateSubmenuName(tabId, tempName);
    setEditingTabId(null);
  };

  // Toggle Accordion Active State
  const handleToggleSection = (section) => {
    setActiveSection((prev) => (prev === section ? null : section));
  };

  // Filter widgets by defined metadata category maps
  const filteredWidgets = Object.entries(WIDGET_REGISTRY).filter(([key, widget]) => {
    if (widgetCategory === 'All') return true;
    if (widgetCategory === 'Analytics' && (key === 'cash_flow_chart' || key === 'net_worth_chart')) return true;
    if (widgetCategory === 'Treasury' && key === 'asset_allocation_chart') return true;
    return false;
  });

  return (
    <aside className="w-80 h-[calc(100dvh-4rem)] bg-stone-950 border-r border-amber-900/40 flex flex-col z-20 shrink-0 overflow-y-auto scrollbar-thin scrollbar-thumb-amber-950 scrollbar-track-stone-950">
      {/* Title Header Row */}
      <div className="p-4 bg-stone-900/20 border-b border-amber-900/20 flex items-center gap-2">
        <SlidersHorizontal className="text-amber-500" size={16} />
        <h2 className="font-serif text-sm font-bold tracking-wider text-amber-500 uppercase">
          Workspace Sandbox
        </h2>
      </div>

      <div className="flex-1 p-4 flex flex-col gap-4">
        {/* ==========================================
            SECTION A: SUBMENU MANAGER (Active Ledgers)
           ========================================== */}
        {(activeSection === null || activeSection === 'ledgers') && (
          <section className="flex flex-col gap-3">
            <button
              onClick={() => handleToggleSection('ledgers')}
              className="w-full flex items-center justify-between text-stone-300 font-serif text-xs font-semibold tracking-wider uppercase border-b border-stone-800 pb-2 hover:text-amber-500 transition-colors focus:outline-none"
            >
              <div className="flex items-center gap-1.5">
                <Layers size={14} className="text-amber-600" />
                <span>Active Ledgers</span>
              </div>
              <span className="text-[9px] text-stone-500 font-mono">
                {activeSection === 'ledgers' ? '[- COLLAPSE]' : '[+ EXPAND]'}
              </span>
            </button>

            {activeSection === 'ledgers' && (
              <div className="flex flex-col gap-2 mt-1">
                {submenus.map((tab) => {
                  const isEditingName = editingTabId === tab.id;
                  const isProtected = tab.id === 'insights' || tab.id === 'tab_1';

                  return (
                    <div
                      key={tab.id}
                      onClick={() => tab.isVisible && setActiveSubmenu(tab.id)}
                      className={`p-2.5 rounded border transition-all duration-150 cursor-pointer flex flex-col gap-1.5 ${
                        tab.isActive
                          ? 'bg-amber-950/20 border-amber-500/60 shadow-[0_0_8px_rgba(245,158,11,0.05)]'
                          : 'bg-stone-900/10 border-stone-800/80 hover:border-stone-700/60'
                      } ${!tab.isVisible ? 'opacity-50' : ''}`}
                    >
                      <div className="flex items-center justify-between w-full">
                        {/* Inline Renaming Input */}
                        {isEditingName ? (
                          <div className="flex items-center gap-1 flex-1 mr-2" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="text"
                              value={tempName}
                              onChange={(e) => setTempName(e.target.value)}
                              className="bg-stone-900 text-stone-100 font-serif text-xs px-2 py-1 rounded border border-amber-900/50 outline-none w-full"
                              maxLength={25}
                            />
                            <button
                              onClick={() => handleSaveRename(tab.id)}
                              className="p-1 text-emerald-400 hover:text-emerald-300"
                            >
                              <Check size={14} />
                            </button>
                          </div>
                        ) : (
                          <span className="font-serif text-xs font-bold text-stone-200">
                            {tab.name}
                          </span>
                        )}

                        {/* Functional Option Toggles */}
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          {tab.isVisible && !isEditingName && (
                            <button
                              onClick={() => handleStartRename(tab)}
                              className="text-stone-500 hover:text-amber-500 transition-colors"
                            >
                              <Pencil size={12} />
                            </button>
                          )}
                          
                          {/* Hide visibility controls entirely if the ledger tab is protected */}
                          {!isProtected && (
                            <button
                              onClick={() => toggleSubmenuVisibility(tab.id)}
                              className="text-stone-500 hover:text-amber-500 transition-colors"
                            >
                              {tab.isVisible ? <Eye size={13} /> : <EyeOff size={13} />}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ==========================================
            SECTION B: VIEWS GALLERY (Grid Preset Blueprints)
           ========================================== */}
        {(activeSection === null || activeSection === 'presets') && (
          <section className="flex flex-col gap-3">
            <button
              onClick={() => handleToggleSection('presets')}
              className="w-full flex items-center justify-between text-stone-300 font-serif text-xs font-semibold tracking-wider uppercase border-b border-stone-800 pb-2 hover:text-amber-500 transition-colors focus:outline-none"
            >
              <div className="flex items-center gap-1.5">
                <Grid size={14} className="text-amber-600" />
                <span>Grid Preset Blueprints</span>
              </div>
              <span className="text-[9px] text-stone-500 font-mono">
                {activeSection === 'presets' ? '[- COLLAPSE]' : '[+ EXPAND]'}
              </span>
            </button>

            {activeSection === 'presets' && (
              <div className="grid grid-cols-1 gap-2 mt-1">
                {Object.entries(EXTRA_PRESETS).map(([key, item]) => (
                  <button
                    key={key}
                    onClick={() => updateDraftLayout(activeTabId, item.layout)}
                    className="w-full text-left p-2.5 rounded bg-stone-900/40 border border-amber-900/20 text-stone-300 hover:border-amber-500/40 hover:bg-stone-900/70 transition-all font-mono text-[11px] font-semibold flex items-center justify-between"
                  >
                    <span>{item.name}</span>
                    <span className="text-[9px] uppercase tracking-wider text-amber-600 font-sans">
                      Deploy
                    </span>
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ==========================================
            SECTION C: WIDGET GALLERY (Widget Manifest)
           ========================================== */}
        {(activeSection === null || activeSection === 'widgets') && (
          <section className="flex flex-col gap-3">
            <button
              onClick={() => handleToggleSection('widgets')}
              className="w-full flex items-center justify-between text-stone-300 font-serif text-xs font-semibold tracking-wider uppercase border-b border-stone-800 pb-2 hover:text-amber-500 transition-colors focus:outline-none"
            >
              <div className="flex items-center gap-1.5">
                <Grid size={14} className="text-amber-600" />
                <span>Widget Manifest</span>
              </div>
              <span className="text-[9px] text-stone-500 font-mono">
                {activeSection === 'widgets' ? '[- COLLAPSE]' : '[+ EXPAND]'}
              </span>
            </button>

            {activeSection === 'widgets' && (
              <div className="flex flex-col gap-3 mt-1">
                {/* Category Filtering Selector Dropdown */}
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-stone-500 uppercase tracking-widest font-mono">
                    Filter Category
                  </label>
                  <select
                    value={widgetCategory}
                    onChange={(e) => setWidgetCategory(e.target.value)}
                    className="bg-stone-900 text-stone-200 border border-amber-900/30 rounded px-2 py-1.5 text-xs font-serif outline-none focus:border-amber-500/50 transition-colors"
                  >
                    <option value="All">All Widgets</option>
                    <option value="Analytics">Analytics Division</option>
                    <option value="Treasury">Citadel Treasury</option>
                  </select>
                </div>

                {/* Grid Lists of Filtered Widgets */}
                <div className="flex flex-col gap-2.5">
                  {filteredWidgets.map(([key, widget]) => (
                    <div
                      key={key}
                      className="w-full p-3 rounded bg-stone-900/60 border border-stone-800/80 hover:border-amber-500/30 transition-all flex items-center justify-between gap-4 group"
                    >
                      {/* Left Side details */}
                      <div className="flex-1 flex flex-col gap-1 select-none">
                        <h4 className="font-serif text-xs font-bold text-amber-500 group-hover:text-amber-400 transition-colors">
                          {widget.name}
                        </h4>
                        <p className="text-[10px] text-stone-400 leading-normal">
                          Reflects ledger records onto visual charts.
                        </p>
                        <span className="text-[9px] text-stone-500 font-mono mt-0.5">
                          Size Footprint: {widget.layout.w}x{widget.layout.h}
                        </span>
                      </div>

                      {/* Right Side visual preview box placeholder */}
                      <div
                        onClick={() => deployWidget(activeTabId, key, widget)}
                        className="relative w-20 h-16 shrink-0 bg-stone-950/80 border border-stone-850 rounded hover:border-amber-500/40 transition-all cursor-pointer overflow-hidden flex items-center justify-center group/preview"
                        title="Deploy Structure to Workspace"
                      >
                        <span className="text-[8px] font-mono text-stone-700 group-hover/preview:text-amber-900/30 transition-colors select-none tracking-widest uppercase">
                          ⚜️ {widget.layout.w}x{widget.layout.h}
                        </span>

                        {/* Absolutely Positioned deployment trigger Plus button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); // Avoid double deploy event bubble
                            deployWidget(activeTabId, key, widget);
                          }}
                          className="absolute top-1 right-1 p-0.5 rounded bg-stone-900 border border-amber-900/30 text-amber-500 hover:bg-amber-500 hover:text-stone-950 hover:border-transparent transition-all"
                          title="Deploy"
                        >
                          <Plus size={10} className="stroke-[3]" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {filteredWidgets.length === 0 && (
                    <p className="text-center text-[11px] text-stone-600 font-serif italic py-4">
                      No structures matching criteria
                    </p>
                  )}
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </aside>
  );
}