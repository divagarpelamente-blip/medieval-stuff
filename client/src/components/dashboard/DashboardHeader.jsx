import React from 'react';
import { useDashboardStore } from '../../store/useDashboardStore';
import { Sliders, Check, X, Loader2 } from 'lucide-react';

export default function DashboardHeader() {
  const {
    isEditingLayout,
    hasUnsavedChanges,
    submenus,
    toggleEditMode,
    saveDraftToProduction,
    isLoading,
    isSaving,
    setActiveSubmenu
  } = useDashboardStore();

  // Inject a blank spacer cell at index 3 to force a clean 3-top, 4-bottom wrap sequence
  const gridItems = React.useMemo(() => {
    const items = [...submenus];
    if (items.length >= 3) {
      items.splice(3, 0, { id: 'grid-alignment-spacer', isSpacer: true });
    }
    return items;
  }, [submenus]);

  // Intercept configuration mode toggling (Sliders Trigger)
  const handleToggleEditMode = async () => {
    if (isEditingLayout && hasUnsavedChanges) {
      const confirmSave = window.confirm(
        "You have unsaved layout changes. Save them before closing options?\n\nPress OK to Save, or Cancel to Discard."
      );
      if (confirmSave) {
        await saveDraftToProduction();
      }
    }
    toggleEditMode(!isEditingLayout);
  };

  // Intercept manual draft discarding
  const handleDismissDraft = async () => {
    if (isEditingLayout && hasUnsavedChanges) {
      const confirmSave = window.confirm(
        "You have unsaved layout changes. Save them before closing options?\n\nPress OK to Save, or Cancel to Discard."
      );
      if (confirmSave) {
        await saveDraftToProduction();
      }
    }
    toggleEditMode(false);
  };

  // Intercept circular exit controller clicks - Unconditionally prompt on exit
  const handleExitDashboard = async () => {
    const confirmSave = window.confirm(
      "Do you want to save your current layout before exiting?\n\nPress OK to Save and Exit, or Cancel to discard changes and exit."
    );
    if (confirmSave) {
      await saveDraftToProduction();
    } else {
      toggleEditMode(false);
    }
    window.dispatchEvent(new CustomEvent('close-dashboard'));
  };

  return (
    <header className="w-full h-16 shrink-0 bg-[#faf4e5]/90 backdrop-blur-sm border-b border-[#8b4513]/25 px-6 flex items-center justify-between z-30 shadow-sm select-none">
      {/* Left/Center Section: Title, Sliders Trigger, Submenus Tab Row Grid */}
      <div className="flex items-center gap-6 overflow-hidden flex-grow mr-4">
        {/* Global Title Reading Area */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-2.5 h-2.5 rounded-full bg-[#ffd700] animate-pulse shadow-[0_0_8px_rgba(255,215,0,0.6)]" />
          <span className="font-serif text-sm font-bold tracking-widest text-[#4b2c20] uppercase">
            Citadel Command
          </span>
        </div>

        {/* Separator Line */}
        <div className="h-6 w-px bg-[#8b4513]/20 shrink-0" />

        {/* Configuration symbol to the left of the tab navigation */}
        <button
          onClick={handleToggleEditMode}
          disabled={isLoading || isSaving}
          title={isEditingLayout ? "Exit Configuration Mode" : "Configure Workspace Layout"}
          className={`p-1.5 rounded border transition-all duration-200 cursor-pointer focus:outline-none disabled:opacity-40 disabled:pointer-events-none shrink-0 ${
            isEditingLayout
              ? 'border-[#8b4513]/50 bg-[#f4e4bc] text-[#8b4513] shadow-[0_0_8px_rgba(139,69,19,0.4)] animate-pulse'
              : 'border-[#8b4513]/20 bg-[#faf4e5] text-[#5d4037] hover:text-[#4b2c20] hover:border-[#8b4513]/40'
          }`}
        >
          <Sliders size={20} className={isEditingLayout ? 'drop-shadow-[0_0_8px_rgba(139,69,19,0.5)]' : ''} />
        </button>

        {/* Resilient fixed-width navigation container protecting buttons from wrapping or clipping */}
        <nav className="grid grid-cols-4 gap-2 w-[640px] shrink-0 py-0.5">
          {gridItems.map((tab) => {
            // Render an empty grid spacer to naturally separate top row and bottom row
            if (tab.isSpacer) {
              return <div key={tab.id} className="col-span-1" />;
            }

            const isActive = tab.isActive;
            const isVisible = tab.isVisible;

            if (!isVisible) {
              return (
                <div
                  key={tab.id}
                  title={`${tab.name} is sealed. Render active in the Sidebar configurations.`}
                  className="opacity-50 border border-transparent px-3 py-1 text-[9px] font-serif tracking-wider uppercase cursor-not-allowed text-[#8b4513]/70 font-bold select-none shrink-0 flex items-center justify-center gap-0.5 whitespace-nowrap overflow-hidden text-ellipsis"
                >
                  <span>🔒</span>
                  <span className="whitespace-nowrap overflow-hidden text-ellipsis">{tab.name}</span>
                </div>
              );
            }

            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubmenu(tab.id)}
                disabled={isLoading || isSaving}
                className={`px-3 py-1 rounded font-serif text-[9px] font-bold tracking-wider uppercase border transition-all duration-150 cursor-pointer disabled:pointer-events-none shrink-0 text-center flex items-center justify-center whitespace-nowrap overflow-hidden text-ellipsis ${
                  isActive
                    ? 'bg-[#f4e4bc] border-[#5d4037]/60 text-[#4b2c20] shadow-[0_0_8px_rgba(93,64,55,0.15)]'
                    : 'border-transparent text-[#5d4037] hover:text-[#4b2c20] hover:bg-[#f4e4bc]/50'
                }`}
              >
                <span className="whitespace-nowrap overflow-hidden text-ellipsis">{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Right-Hand Controls Action Container */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Persistent Loader Overlay */}
        {(isLoading || isSaving) && (
          <div className="flex items-center gap-2 text-[#5d4037] font-mono text-xs border border-[#8b4513]/20 px-2 py-1.5 rounded bg-[#f4e4bc]">
            <Loader2 className="animate-spin text-[#8b4513]" size={14} />
            <span>{isLoading ? 'Hydrating...' : 'Archiving...'}</span>
          </div>
        )}

        {isEditingLayout && (
          <>
            {/* Cancel Changes */}
            <button
              onClick={handleDismissDraft}
              disabled={isSaving || isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#be123c]/40 bg-[#be123c]/10 text-xs font-serif font-bold tracking-wide text-[#be123c] hover:bg-[#be123c]/20 hover:text-[#9f1239] transition-all duration-200 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            >
              <X size={14} />
              Dismiss Draft
            </button>

            {/* Commit Changes */}
            <button
              onClick={() => saveDraftToProduction()}
              disabled={isSaving || isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#047857]/40 bg-[#047857]/10 text-xs font-serif font-bold tracking-wide text-[#047857] hover:bg-[#047857]/20 hover:text-[#065f46] hover:shadow-[0_0_12px_rgba(4,120,87,0.2)] transition-all duration-200 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            >
              <Check size={14} />
              Seal Layout
            </button>
          </>
        )}

        {/* Circular Exit Control Button: Red background with centered yellow 'X' */}
        <button
          onClick={handleExitDashboard}
          title="Exit Command Dashboard"
          className="w-8 h-8 rounded-full bg-[#be123c] hover:bg-[#9f1239] border border-[#7f1d1d] text-[#ffd700] hover:text-[#fde047] flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-md cursor-pointer shrink-0 ml-1.5"
        >
          <X size={15} className="stroke-[3]" />
        </button>
      </div>
    </header>
  );
}