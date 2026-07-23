import React, { useState } from 'react';
import { useDashboardStore } from '../../store/useDashboardStore';
import { TREASURY_WIDGETS } from './treasuryRegistry';
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
  const [widgetCategory, setWidgetCategory] = useState('All'); // 'All' | 'overview' | 'chart' | 'ledger'

  // Decouple registry state for DDD support
  const activeRegistry = TREASURY_WIDGETS;

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

  // Filter registry entries based on the metadata properties
  const filteredWidgets = Object.entries(activeRegistry).filter(([key, widget]) => {
    if (widgetCategory === 'All') return true;
    return widget.category === widgetCategory;
  });

  return (
    <aside className="w-80 h-[calc(100dvh-4rem)] bg-[#faf4e5] border-r border-[#8b4513]/25 flex flex-col z-20 shrink-0 overflow-y-auto scrollbar-thin scrollbar-thumb-[#8b4513]/50 scrollbar-track-[#faf4e5]">
      {/* Title Header Row */}
      <div className="p-4 bg-[#f4e4bc] border-b border-[#8b4513]/25 flex items-center gap-2">
        <SlidersHorizontal className="text-[#5d4037]" size={16} />
        <h2 className="font-serif text-sm font-bold tracking-wider text-[#4b2c20] uppercase">
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
              className="w-full flex items-center justify-between text-[#4b2c20] font-serif text-xs font-bold tracking-wider uppercase border-b border-[#8b4513]/25 pb-2 hover:text-[#8b4513] transition-colors focus:outline-none"
            >
              <div className="flex items-center gap-1.5">
                <Layers size={14} className="text-[#5d4037]" />
                <span>Active Ledgers</span>
              </div>
              <span className="text-[9px] text-[#5d4037] font-mono">
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
                          ? 'bg-[#f4e4bc] border-[#5d4037] shadow-sm'
                          : 'bg-[#faf4e5]/60 border-[#8b4513]/15 hover:border-[#8b4513]/30'
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
                              className="bg-[#faf4e5] text-[#4b2c20] font-serif text-xs px-2 py-1 rounded border border-[#8b4513]/40 outline-none w-full"
                              maxLength={25}
                            />
                            <button
                              onClick={() => handleSaveRename(tab.id)}
                              className="p-1 text-[#047857] hover:text-[#047857]/70"
                            >
                              <Check size={14} />
                            </button>
                          </div>
                        ) : (
                          <span className="font-serif text-xs font-bold text-[#4b2c20]">
                            {tab.name}
                          </span>
                        )}

                        {/* Functional Option Toggles */}
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          {tab.isVisible && !isEditingName && (
                            <button
                              onClick={() => handleStartRename(tab)}
                              className="text-[#5d4037] hover:text-[#8b4513] transition-colors"
                            >
                              <Pencil size={12} />
                            </button>
                          )}
                          
                          {/* Hide visibility controls entirely if the ledger tab is protected */}
                          {!isProtected && (
                            <button
                              onClick={() => toggleSubmenuVisibility(tab.id)}
                              className="text-[#5d4037] hover:text-[#8b4513] transition-colors"
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
              className="w-full flex items-center justify-between text-[#4b2c20] font-serif text-xs font-bold tracking-wider uppercase border-b border-[#8b4513]/25 pb-2 hover:text-[#8b4513] transition-colors focus:outline-none"
            >
              <div className="flex items-center gap-1.5">
                <Grid size={14} className="text-[#5d4037]" />
                <span>Grid Preset Blueprints</span>
              </div>
              <span className="text-[9px] text-[#5d4037] font-mono">
                {activeSection === 'presets' ? '[- COLLAPSE]' : '[+ EXPAND]'}
              </span>
            </button>

            {activeSection === 'presets' && (
              <div className="grid grid-cols-1 gap-2 mt-1">
                {Object.entries(EXTRA_PRESETS).map(([key, item]) => (
                  <button
                    key={key}
                    onClick={() => updateDraftLayout(activeTabId, item.layout)}
                    className="w-full text-left p-2.5 rounded bg-[#faf4e5]/60 border border-[#8b4513]/20 text-[#4b2c20] hover:border-[#5d4037] hover:bg-[#f4e4bc] transition-all font-serif text-xs font-bold flex items-center justify-between"
                  >
                    <span>{item.name}</span>
                    <span className="text-[9px] uppercase tracking-wider text-[#5d4037] font-sans">
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
              className="w-full flex items-center justify-between text-[#4b2c20] font-serif text-xs font-bold tracking-wider uppercase border-b border-[#8b4513]/25 pb-2 hover:text-[#8b4513] transition-colors focus:outline-none"
            >
              <div className="flex items-center gap-1.5">
                <Grid size={14} className="text-[#5d4037]" />
                <span>Widget Manifest</span>
              </div>
              <span className="text-[9px] text-[#5d4037] font-mono">
                {activeSection === 'widgets' ? '[- COLLAPSE]' : '[+ EXPAND]'}
              </span>
            </button>

            {activeSection === 'widgets' && (
              <div className="flex flex-col gap-3 mt-1">
                {/* Category Filtering Selector Dropdown */}
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-[#5d4037] uppercase tracking-widest font-mono">
                    Filter Division
                  </label>
                  <select
                    value={widgetCategory}
                    onChange={(e) => setWidgetCategory(e.target.value)}
                    className="bg-[#faf4e5] text-[#4b2c20] border border-[#8b4513]/30 rounded px-2 py-1.5 text-xs font-serif outline-none focus:border-[#5d4037] transition-colors"
                  >
                    <option value="All">All Assets</option>
                    <option value="overview">Overview Division</option>
                    <option value="chart">Analytical Curves</option>
                    <option value="ledger">Ledger Breakdowns</option>
                  </select>
                </div>

                {/* Grid Lists of Filtered Widgets */}
                <div className="flex flex-col gap-2.5">
                  {filteredWidgets.map(([key, widget]) => (
                    <div
                      key={key}
                      className="w-full p-3 rounded bg-[#faf4e5]/80 border border-[#8b4513]/20 hover:border-[#5d4037] transition-all flex items-center justify-between gap-4 group shadow-sm"
                    >
                      {/* Left Side details */}
                      <div className="flex-1 flex flex-col gap-1 select-none">
                        <h4 className="font-serif text-xs font-bold text-[#4b2c20] group-hover:text-[#8b4513] transition-colors">
                          {widget.name}
                        </h4>
                        <p className="text-[10px] text-[#5d4037] leading-normal font-serif italic">
                          Reflects ledger records onto visual charts.
                        </p>
                        <span className="text-[9px] text-[#455a64] font-mono mt-0.5">
                          Size Footprint: {widget.layout.w}x{widget.layout.h}
                        </span>
                      </div>

                      {/* Right Side visual preview box placeholder */}
                      <div
                        onClick={() => deployWidget(activeTabId, key, widget)}
                        className="relative w-20 h-16 shrink-0 bg-[#f4e4bc] border border-[#8b4513]/30 rounded hover:border-[#5d4037] transition-all cursor-pointer overflow-hidden flex items-center justify-center group/preview"
                        title="Deploy Structure to Workspace"
                      >
                        <span className="text-[8px] font-mono text-[#5d4037] group-hover/preview:text-[#4b2c20] transition-colors select-none tracking-widest uppercase">
                          ⚜️ {widget.layout.w}x{widget.layout.h}
                        </span>

                        {/* Absolutely Positioned deployment trigger Plus button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); 
                            deployWidget(activeTabId, key, widget);
                          }}
                          className="absolute top-1 right-1 p-0.5 rounded bg-[#faf4e5] border border-[#8b4513]/30 text-[#5d4037] hover:bg-[#5d4037] hover:text-[#f4e4bc] hover:border-transparent transition-all"
                          title="Deploy"
                        >
                          <Plus size={10} className="stroke-[3]" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {filteredWidgets.length === 0 && (
                    <p className="text-center text-[11px] text-[#5d4037] font-serif italic py-4">
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