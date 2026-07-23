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
      <aside className="w-80 border-r border-[#8b4513]/25 bg-[#faf4e5] flex flex-col select-none">
        <div className="p-6 border-b border-[#8b4513]/25 bg-[#f4e4bc]">
          <span className="text-[10px] tracking-[0.2em] font-mono text-[#5d4037] uppercase font-bold block mb-1">
            Eldoria Archival Systems
          </span>
          <h1 className="text-xl font-serif font-bold text-[#4b2c20] tracking-wide">
            Widget Sandbox
          </h1>
          <p className="text-xs text-[#5d4037] mt-1 font-serif">
            Isolate and test staging layouts.
          </p>
        </div>

        {/* List of Registered Widgets */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          <span className="px-2 text-[10px] font-mono uppercase text-[#455a64] tracking-wider block mb-2">
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
                    ? 'bg-[#f4e4bc] border-[#5d4037] text-[#4b2c20] shadow-sm'
                    : 'bg-[#faf4e5]/60 border-[#8b4513]/15 text-[#5d4037] hover:bg-[#f4e4bc]/50 hover:border-[#8b4513]/30'
                }`}
              >
                <div className="font-serif text-sm font-bold tracking-wide flex items-center justify-between">
                  <span>{widget.name}</span>
                  {isActive && <span className="h-1.5 w-1.5 rounded-full bg-[#ffd700] shadow-[0_0_4px_rgba(255,215,0,0.8)]" />}
                </div>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Canvas Area */}
      <main className="flex-1 flex flex-col bg-[#f4e4bc] overflow-hidden relative">
        <header className="h-14 border-b border-[#8b4513]/25 px-6 flex items-center justify-between bg-[#faf4e5]/80 backdrop-blur-sm z-10">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-serif font-bold text-[#5d4037]">Viewport Scale:</span>
            <div className="flex bg-[#f4e4bc] p-1 rounded-md border border-[#8b4513]/25">
              {Object.entries(viewports).map(([key, size]) => (
                <button
                  key={key}
                  onClick={() => setViewportSize(key)}
                  className={`px-3 py-1 text-xs font-serif rounded transition-colors ${
                    viewportSize === key
                      ? 'bg-[#5d4037] text-[#f4e4bc] font-bold shadow-sm'
                      : 'text-[#4b2c20] hover:text-[#5d4037]'
                  }`}
                >
                  {size.label}
                </button>
              ))}
            </div>
          </div>
          <div className="text-[11px] font-mono font-bold text-[#4b2c20] bg-[#ffd700]/20 px-3 py-1 border border-[#ffd700]/50 rounded">
            Target: <span className="underline">{activeWidgetKey}</span>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8 flex items-start justify-center bg-[radial-gradient(#8b4513_1px,transparent_1px)] [background-size:24px_24px] opacity-90">
          <div className={`${viewports[viewportSize].cssClass} transition-all duration-300 ease-in-out flex justify-center`}>
            <div className="relative border-[3px] border-dashed border-[#8b4513]/40 rounded-xl bg-[#faf4e5]/40 p-6 shadow-xl inline-block max-w-full">
              <div 
                className="flex flex-col items-stretch justify-stretch overflow-auto resize border border-transparent hover:border-[#8b4513]/30 transition-colors"
                style={{ width: '400px', height: '350px', minWidth: '250px', minHeight: '200px', maxWidth: '100%' }}
              >
                {ActiveComponent ? <ActiveComponent transactions={MOCK_TRANSACTIONS}/> : null}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}