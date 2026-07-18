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
  } = useDashboardStore();

  const activeTab = submenus.find((sub) => sub.isActive);
  const activeTabName = activeTab ? activeTab.name : 'Royal Treasury';

  return (
    <header className="w-full h-16 shrink-0 bg-stone-950 border-b border-amber-900/40 px-6 flex items-center justify-between z-30 shadow-lg select-none">
      {/* Title / Identity Reads */}
      <div className="flex items-center gap-3">
        <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
        <h1 className="font-serif text-lg font-bold tracking-wider text-amber-500 uppercase flex items-center gap-2">
          {isEditingLayout ? (
            <span className="flex items-center gap-2">
              <span className="text-stone-400 font-sans text-xs uppercase tracking-widest font-semibold mr-1">
                Reforging Layout:
              </span>
              {activeTabName}
            </span>
          ) : (
            activeTabName
          )}
        </h1>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center gap-3">
        {/* Loader Display */}
        {(isLoading || isSaving) && (
          <div className="flex items-center gap-2 text-stone-400 font-mono text-xs border border-stone-800/80 px-2 py-1.5 rounded bg-stone-900/20 mr-2">
            <Loader2 className="animate-spin text-amber-500" size={14} />
            <span>{isLoading ? 'Reading Scrolls...' : 'Sealing Ledger...'}</span>
          </div>
        )}

        {isEditingLayout ? (
          <>
            {/* Cancel Changes */}
            <button
              onClick={() => toggleEditMode(false)}
              disabled={isSaving || isLoading}
              className="flex items-center gap-1.5 px-4 py-2 rounded border border-rose-900/40 bg-rose-950/20 text-xs font-serif font-bold tracking-wide text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition-all duration-200 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            >
              <X size={14} />
              Dismiss Draft
            </button>

            {/* Commit Changes */}
            <button
              onClick={() => saveDraftToProduction()}
              disabled={isSaving || isLoading}
              className="flex items-center gap-1.5 px-4 py-2 rounded border border-emerald-900/50 bg-emerald-950/30 text-xs font-serif font-bold tracking-wide text-emerald-400 hover:bg-emerald-950/50 hover:shadow-[0_0_12px_rgba(16,185,129,0.3)] transition-all duration-200 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            >
              <Check size={14} />
              Seal Layout
            </button>
          </>
        ) : (
          /* Configure Layout */
          <button
            onClick={() => toggleEditMode(true)}
            disabled={isLoading || isSaving}
            className="flex items-center gap-1.5 px-4 py-2 rounded border border-amber-900/50 bg-stone-900/40 text-xs font-serif font-bold tracking-wide text-amber-400 hover:bg-stone-900/80 hover:text-amber-300 hover:shadow-[0_0_8px_rgba(245,158,11,0.2)] transition-all duration-200 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
          >
            <Sliders size={14} />
            Configure Workspace
          </button>
        )}
      </div>
    </header>
  );
}