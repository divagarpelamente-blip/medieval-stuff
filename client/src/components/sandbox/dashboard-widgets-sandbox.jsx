import React, { useState } from 'react';
import { SANDBOX_WIDGETS } from "./sandboxRegistry";
import { MOCK_TRANSACTIONS } from "./sandboxMockData";

export default function DashboardWidgetsSandbox() {
  const [activeWidgetKey, setActiveWidgetKey] = useState(Object.keys(SANDBOX_WIDGETS)[0] || '');
  const [viewportSize, setViewportSize] = useState('full');

  const activeWidget = SANDBOX_WIDGETS[activeWidgetKey];

  const viewports = {
    full: { label: 'Full Width', cssClass: 'w-full' },
    tablet: { label: 'Tablet (768px)', cssClass: 'w-[768px]' },
    mobile: { label: 'Mobile (375px)', cssClass: 'w-[375px]' },
  };

  const ActiveComponent = activeWidget ? activeWidget.component : null;

  return (
    <div className="h-screen flex bg-stone-950 text-stone-200 font-sans overflow-hidden">
      {/* Sidebar Selector */}
      <aside className="w-80 border-r border-amber-900/30 bg-stone-900/90 flex flex-col select-none">
        <div className="p-6 border-b border-amber-900/30 bg-stone-950/40">
          <span className="text-[10px] tracking-[0.2em] font-mono text-amber-500/80 uppercase font-semibold block mb-1">
            Eldoria Archival Systems
          </span>
          <h1 className="text-xl font-serif font-bold text-stone-100 tracking-wide">
            Widget Sandbox
          </h1>
          <p className="text-xs text-stone-400 mt-1">
            Isolate and test staging layouts before execution in high-priority contexts.
          </p>
        </div>

        {/* List of Registered Widgets */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          <span className="px-2 text-[10px] font-mono uppercase text-stone-500 tracking-wider block mb-2">
            Staged Components ({Object.keys(SANDBOX_WIDGETS).length})
          </span>
          {Object.entries(SANDBOX_WIDGETS).map(([key, widget]) => {
            const isActive = activeWidgetKey === key;
            return (
              <button
                key={key}
                onClick={() => setActiveWidgetKey(key)}
                className={`w-full text-left p-3 rounded-lg border transition-all duration-150 ${
                  isActive
                    ? 'bg-amber-950/30 border-amber-500/50 text-amber-200 shadow-md shadow-amber-950/25'
                    : 'bg-stone-950/40 border-stone-800/60 text-stone-400 hover:text-stone-200 hover:bg-stone-900 hover:border-amber-900/30'
                }`}
              >
                <div className="font-serif text-sm font-semibold tracking-wide flex items-center justify-between">
                  <span>{widget.name}</span>
                  {isActive && (
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
                  )}
                </div>
                <p className="text-[11px] text-stone-500 mt-1 leading-normal">
                  {widget.description}
                </p>
              </button>
            );
          })}
        </nav>

        {/* Ledger Metadata Stats */}
        <div className="p-4 bg-stone-950/60 border-t border-amber-900/20 text-[10px] font-mono text-stone-500 space-y-1">
          <div>Dev Mode Status: Active</div>
          <div>Injected Records: {MOCK_TRANSACTIONS.length} Ledger Events</div>
          <div>Borders: Outer Bounds Displayed</div>
        </div>
      </aside>

      {/* Main Canvas Area */}
      <main className="flex-1 flex flex-col bg-stone-950 overflow-hidden relative">
        {/* Canvas Toolbar */}
        <header className="h-14 border-b border-amber-900/20 px-6 flex items-center justify-between bg-stone-900/40 backdrop-blur-sm z-10">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-mono text-stone-400">Viewport Scale:</span>
            <div className="flex bg-stone-950 p-1 rounded-md border border-stone-800/80">
              {Object.entries(viewports).map(([key, size]) => (
                <button
                  key={key}
                  onClick={() => setViewportSize(key)}
                  className={`px-3 py-1 text-xs font-mono rounded transition-colors ${
                    viewportSize === key
                      ? 'bg-amber-900/30 text-amber-300 font-semibold'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  {size.label}
                </button>
              ))}
            </div>
          </div>

          <div className="text-[11px] font-mono text-amber-500/80 bg-amber-950/30 px-3 py-1 border border-amber-900/40 rounded">
            Target Component: <span className="font-bold underline">{activeWidgetKey}</span>
          </div>
        </header>

        {/* Simulated Grid Workspace */}
        <div className="flex-1 overflow-auto p-8 flex items-center justify-center bg-[radial-gradient(#1c1917_1px,transparent_1px)] [background-size:16px_16px]">
          <div className={`${viewports[viewportSize].cssClass} transition-all duration-300 ease-in-out`}>
            {/* Visual Containment Box */}
            <div className="relative border-2 border-dashed border-amber-500/30 rounded-xl bg-stone-950/80 p-12 shadow-2xl backdrop-blur-md">
              {/* Outer boundary guides */}
              <div className="absolute -top-3 left-6 px-2 py-0.5 bg-stone-950 border border-amber-500/30 text-[10px] font-mono text-amber-400 rounded uppercase tracking-wider">
                Boundary Guide
              </div>
              <div className="absolute -bottom-3 right-6 px-2 py-0.5 bg-stone-950 border border-amber-500/30 text-[10px] font-mono text-amber-400 rounded uppercase tracking-wider">
                {viewportSize === 'full' ? 'Unbounded Flow' : viewports[viewportSize].label}
              </div>

              {/* Strict, Explicitly Dimensioned Wrapper preventing Recharts height(0) collapse */}
              <div className="w-full h-[450px] flex flex-col items-stretch justify-stretch">
                {ActiveComponent ? (
                  <ActiveComponent transactions={MOCK_TRANSACTIONS} />
                ) : (
                  <div className="text-stone-500 font-mono text-xs italic text-center flex-1 flex items-center justify-center">
                    Select a staged widget in the sidebar to inspect layout parameters.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}