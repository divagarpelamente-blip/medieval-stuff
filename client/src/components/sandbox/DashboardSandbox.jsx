import React, { useEffect } from 'react';
import DashboardHeader from '../dashboard/DashboardHeader';
import DashboardCanvas from '../dashboard/DashboardCanvas';
import SettingsSidebar from '../dashboard/SettingsSidebar';
import { useDashboardStore } from '../../store/useDashboardStore';

export default function DashboardSandbox() {
  const { isEditingLayout, hydrateLayouts } = useDashboardStore();

  // Hydrate layout structures immediately on dashboard display mount
  useEffect(() => {
    hydrateLayouts();
  }, [hydrateLayouts]);

  return (
    <div className="flex flex-col h-screen w-full bg-stone-950 text-stone-200 overflow-hidden font-sans">
      {/* Top Navigation & Stance Controls */}
      <DashboardHeader />
      
      {/* Main Workspace Area */}
      <div className="relative flex flex-1 overflow-hidden min-h-0">
        
        {/* Dynamic Canvas Area */}
        <main className="flex-1 overflow-y-auto p-4 bg-stone-900/50 flex flex-col min-h-0">
          <DashboardCanvas />
        </main>
        
        {/* Configuration Sidebar Panel (Sliding Drawer) */}
        <aside 
          className={`
            transition-all duration-300 ease-in-out
            absolute inset-y-0 right-0 lg:relative
            ${isEditingLayout ? 'w-80 translate-x-0' : 'w-0 translate-x-full lg:translate-x-0'}
            bg-stone-900 border-l border-amber-900/30 shadow-2xl z-40 overflow-hidden shrink-0
          `}
        >
          {/* Fixed width inner wrapper */}
          <div className="w-80 h-full">
            <SettingsSidebar />
          </div>
        </aside>

      </div>
    </div>
  );
}