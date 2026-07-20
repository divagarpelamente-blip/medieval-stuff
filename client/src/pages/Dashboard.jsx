import React, { useEffect } from 'react';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import DashboardCanvas from '../components/dashboard/DashboardCanvas';
import SettingsSidebar from '../components/dashboard/SettingsSidebar';
import { useDashboardStore } from '../store/useDashboardStore';

export default function Dashboard() {
  const { isEditingLayout, hydrateLayouts } = useDashboardStore();

  // Initialize and hydrate configurations on mount
  useEffect(() => {
    hydrateLayouts();
  }, [hydrateLayouts]);

  return (
    <div className="flex flex-col h-screen w-full bg-stone-950 text-stone-200 overflow-hidden font-sans">
      {/* Top Header Row (Remains fully pinned and stable across sidepanel shifts) */}
      <DashboardHeader />
      
      {/* Flexible Workspace Containment Box */}
      <div className="relative flex flex-1 overflow-hidden min-h-0">
        
        {/* Dynamic Slide Drawer Sidepanel (Rendered first to mount on the left side) */}
        <aside 
          className={`
            transition-all duration-300 ease-in-out
            absolute inset-y-0 left-0 lg:relative
            ${isEditingLayout ? 'w-80 translate-x-0' : 'w-0 -translate-x-full lg:translate-x-0'}
            bg-stone-900 border-r border-amber-900/30 shadow-2xl z-40 overflow-hidden shrink-0
          `}
        >
          {/* Inner content wrapper with a fixed width to prevent layout collapsing */}
          <div className="w-80 h-full">
            <SettingsSidebar />
          </div>
        </aside>

        {/* Grid Canvas Workspace */}
        <main className="flex-1 overflow-y-auto p-4 bg-stone-900/50 flex flex-col min-h-0">
          <DashboardCanvas />
        </main>

      </div>
    </div>
  );
}