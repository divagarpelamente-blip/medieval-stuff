import React, { useState } from 'react';
import { useDashboardStore } from '../../store/useDashboardStore';
import { WIDGET_REGISTRY } from './widgetRegistry';
import { DEFAULT_PRESET } from '../../config/dashboard.config';
import { Eye, EyeOff, Pencil, Check, Layers, Grid, SlidersHorizontal } from 'lucide-react';

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
  } = useDashboardStore();

  const [editingTabId, setEditingTabId] = useState(null);
  const [tempName, setTempName] = useState('');

  // Find active tab ID
  const activeTab = submenus.find((sub) => sub.isActive);
  const activeTabId = activeTab ? activeTab.id : 'tab_1';

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

  const handleDragStart = (event, widgetKey) => {
    event.dataTransfer.setData('text/plain', widgetKey);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside className="w-80 h-[calc(100dvh-4rem)] bg-stone-950 border-l border-amber-900/40 flex flex-col z-20 shrink-0 overflow-y-auto scrollbar-thin scrollbar-thumb-amber-950 scrollbar-track-stone-950">
      <div className="p-4 bg-stone-900/20 border-b border-amber-900/20 flex items-center gap-2">
        <SlidersHorizontal className="text-amber-500" size={16} />
        <h2 className="font-serif text-sm font-bold tracking-wider text-amber-500 uppercase">
          Workspace Sandbox
        </h2>
      </div>

      <div className="flex-1 p-4 flex flex-col gap-6">
        {/* SECTION A: SUBMENU MANAGER */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-1.5 text-stone-300 font-serif text-xs font-semibold tracking-wider uppercase border-b border-stone-800 pb-1">
            <Layers size={14} className="text-amber-600" />
            Active Ledgers
          </div>

          <div className="flex flex-col gap-2">
            {submenus.map((tab) => {
              const isEditingName = editingTabId === tab.id;
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
                      <button
                        onClick={() => toggleSubmenuVisibility(tab.id)}
                        className="text-stone-500 hover:text-amber-500 transition-colors"
                      >
                        {tab.isVisible ? <Eye size={13} /> : <EyeOff size={13} />}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* SECTION B: VIEWS GALLERY */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-1.5 text-stone-300 font-serif text-xs font-semibold tracking-wider uppercase border-b border-stone-800 pb-1">
            <Grid size={14} className="text-amber-600" />
            Grid Preset Blueprints
          </div>

          <div className="grid grid-cols-1 gap-2">
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
        </section>

        {/* SECTION C: WIDGET GALLERY */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-1.5 text-stone-300 font-serif text-xs font-semibold tracking-wider uppercase border-b border-stone-800 pb-1">
            <Grid size={14} className="text-amber-600" />
            Widget Manifest
          </div>
          <p className="text-[10px] text-stone-500 -mt-1 leading-relaxed">
            Drag these items onto the grid workspace canvas to place them.
          </p>

          <div className="flex flex-col gap-2.5">
            {Object.entries(WIDGET_REGISTRY).map(([key, widget]) => (
              <div
                key={key}
                draggable
                onDragStart={(e) => handleDragStart(e, key)}
                className="p-3 rounded bg-stone-900/60 border border-stone-800/80 hover:border-amber-900/50 hover:bg-stone-900/80 transition-all cursor-grab active:cursor-grabbing flex flex-col gap-1 shadow-md select-none group"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-serif text-xs font-bold text-amber-500 group-hover:text-amber-400">
                    {widget.name}
                  </h4>
                  <span className="text-[8px] bg-amber-950/40 border border-amber-900/30 text-amber-500 font-mono px-1 rounded">
                    W:{widget.layout.w} H:{widget.layout.h}
                  </span>
                </div>
                <p className="text-[10px] text-stone-400 leading-normal">
                  Reflects ledger records onto visual charts.
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </aside>
  );
}