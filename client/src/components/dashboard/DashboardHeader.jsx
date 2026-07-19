import React from 'react';
import { useDashboardStore } from '../../store/useDashboardStore';
import { Sliders, Check, X, Loader2 } from 'lucide-react';

export default function DashboardHeader() {
  const {
    isEditingLayout,
    submenus,
    toggleEditMode,
    saveDraftToProduction,
    isLoading,
    isSaving,
    setActiveSubmenu
  } = useDashboardStore();

  return (
    <header className="w-full h-16 shrink-0 bg-stone-950 border-b border-amber-900/40 px-6 flex items-center justify-between z-30 shadow-lg select-none">
      {/* Left/Center Section: Title, Relocated Sliders Trigger, Submenus Tab Row */}
      <div className="flex items-center gap-6 overflow-hidden">
        {/* Global Title Reading Area */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
          <span className="font-serif text-sm font-bold tracking-widest text-stone-300 uppercase">
            Citadel Command
          </span>
        </div>

        {/* Separator Line */}
        <div className="h-6 w-px bg-stone-850/80 shrink-0" />

        {/* Pure Icon Configuration Symbol (strictly to the left of the tab navigation) */}
        <button
          onClick={() => toggleEditMode(!isEditingLayout)}
          disabled={isLoading || isSaving}
          title={isEditingLayout ? "Exit Configuration Mode" : "Configure Workspace Layout"}
          className={`p-1.5 rounded border transition-all duration-200 cursor-pointer focus:outline-none disabled:opacity-40 disabled:pointer-events-none shrink-0 ${
            isEditingLayout
              ? 'border-amber-500/50 bg-amber-950/20 text-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)] animate-pulse'
              : 'border-stone-850 bg-stone-900/40 text-stone-400 hover:text-stone-200 hover:border-stone-700/60'
          }`}
        >
          <Sliders size={20} className={isEditingLayout ? 'drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]' : ''} />
        </button>

        {/* Horizontal Navigation Menu Row */}
        <nav className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
          {submenus.map((tab) => {
            const isActive = tab.isActive;
            const isVisible = tab.isVisible;

            // Render a strict low-opacity disabled lock template if tab is toggled off
            if (!isVisible) {
              return (
                <div
                  key={tab.id}
                  title={`${tab.name} is sealed. Render active in the Sidebar configurations.`}
                  className="opacity-30 border border-transparent px-3 py-1.5 text-xs font-serif tracking-wider uppercase cursor-not-allowed text-stone-600 font-bold select-none shrink-0 flex items-center gap-1"
                >
                  <span className="text-[10px]">🔒</span>
                  <span>{tab.name}</span>
                </div>
              );
            }

            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubmenu(tab.id)}
                disabled={isLoading || isSaving}
                className={`px-3 py-1.5 rounded font-serif text-xs font-bold tracking-wider uppercase border transition-all duration-150 cursor-pointer disabled:pointer-events-none shrink-0 ${
                  isActive
                    ? 'bg-amber-950/30 border-amber-500/60 text-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.15)]'
                    : 'border-transparent text-stone-400 hover:text-stone-200 hover:bg-stone-900/30'
                }`}
              >
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Right-Hand Controls Action Container */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Persistent Loader Overlay */}
        {(isLoading || isSaving) && (
          <div className="flex items-center gap-2 text-stone-400 font-mono text-xs border border-stone-800/80 px-2 py-1.5 rounded bg-stone-900/20">
            <Loader2 className="animate-spin text-amber-500" size={14} />
            <span>{isLoading ? 'Hydrating...' : 'Archiving...'}</span>
          </div>
        )}

        {isEditingLayout && (
          <>
            {/* Cancel Changes */}
            <button
              onClick={() => toggleEditMode(false)}
              disabled={isSaving || isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-rose-900/40 bg-rose-950/20 text-xs font-serif font-bold tracking-wide text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition-all duration-200 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            >
              <X size={14} />
              Dismiss Draft
            </button>

            {/* Commit Changes */}
            <button
              onClick={() => saveDraftToProduction()}
              disabled={isSaving || isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-emerald-900/50 bg-emerald-950/30 text-xs font-serif font-bold tracking-wide text-emerald-400 hover:bg-emerald-950/50 hover:shadow-[0_0_12px_rgba(16,185,129,0.3)] transition-all duration-200 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            >
              <Check size={14} />
              Seal Layout
            </button>
          </>
        )}
      </div>
    </header>
  );
}