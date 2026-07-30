import React, { useEffect, useState } from 'react';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import DashboardCanvas from '../components/dashboard/DashboardCanvas';
import SettingsSidebar from '../components/dashboard/SettingsSidebar';
import { useDashboardStore } from '../store/useDashboardStore';
import { Loader2 } from 'lucide-react';

export default function Dashboard() {
  const { isEditingLayout, hydrateLayouts, saveDraftToProduction, toggleEditMode, isSaving } = useDashboardStore();
  const [exitConfirm, setExitConfirm] = useState({ isOpen: false, target: null });

  // Apenas hidrata a posição dos cartões na grelha.
  // (O carregamento dos dados das tabelas acontece no App.jsx em segurança)
  useEffect(() => {
    hydrateLayouts();
  }, [hydrateLayouts]);

  const handleConfirmYes = async () => {
    await saveDraftToProduction();
    setExitConfirm({ isOpen: false, target: null });
    toggleEditMode(false);
  };

  const handleConfirmNo = () => {
    setExitConfirm({ isOpen: false, target: null });
    toggleEditMode(false);
  };

  const handleConfirmCancel = () => {
    setExitConfirm({ isOpen: false, target: null });
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (exitConfirm.isOpen) {
          handleConfirmCancel();
        } else {
          if (isEditingLayout) {
            setExitConfirm({ isOpen: true, target: 'exit' });
          } else {
            window.dispatchEvent(new CustomEvent('close-dashboard'));
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isEditingLayout, exitConfirm.isOpen]);

  return (
    <div className="flex flex-col h-full w-full bg-stone-950 text-stone-200 overflow-hidden font-sans relative">
      {/* Top Header Row */}
      <DashboardHeader 
        onExitRequest={() => setExitConfirm({ isOpen: true, target: 'exit' })}
        onToggleEditRequest={() => setExitConfirm({ isOpen: true, target: 'toggle_edit' })}
        onDismissRequest={() => setExitConfirm({ isOpen: true, target: 'dismiss' })}
      />
      
      {/* Flexible Workspace Containment Box */}
      <div className="relative flex flex-1 overflow-hidden min-h-0">
        
        {/* Dynamic Slide Drawer Sidepanel */}
        <aside 
          className={`
            transition-all duration-300 ease-in-out
            absolute inset-y-0 left-0 lg:relative
            ${isEditingLayout 
              ? 'w-80 translate-x-0 border-r border-amber-900/30 shadow-2xl' 
              : 'w-0 -translate-x-full lg:translate-x-0 border-none shadow-none'
            }
            bg-stone-900 z-40 overflow-hidden shrink-0
          `}
        >
          <div className="w-80 h-full">
            <SettingsSidebar />
          </div>
        </aside>

        {/* Grid Canvas Workspace */}
        <main className="flex-1 overflow-y-auto p-4 bg-stone-900/50 flex flex-col min-h-0">
          <DashboardCanvas />
        </main>

      </div>

      {/* Center Screen Confirmation Overlay */}
      {exitConfirm.isOpen && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="w-72 bg-[#faf4e5] border border-[#8b4513]/40 rounded-xl p-5 shadow-2xl flex flex-col text-center font-serif">
            <p className="text-xs font-bold text-[#4b2c20] mb-5 leading-normal">
              Save changes done to your layout?
            </p>
            <div className="flex gap-2">
              <button 
                onClick={handleConfirmYes} 
                disabled={isSaving}
                className="flex-grow flex items-center justify-center gap-1 py-1.5 rounded bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs uppercase shadow hover:bg-emerald-800 transition-colors cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="animate-spin" size={10} />
                    Saving...
                  </>
                ) : (
                  "Yes"
                )}
              </button>
              <button 
                onClick={handleConfirmNo} 
                disabled={isSaving}
                className="flex-1 py-1.5 rounded bg-rose-700 disabled:opacity-50 text-white font-bold text-xs uppercase shadow hover:bg-rose-800 transition-colors cursor-pointer"
              >
                No
              </button>
              <button 
                onClick={handleConfirmCancel} 
                disabled={isSaving}
                className="flex-1 py-1.5 rounded bg-stone-200 disabled:opacity-50 text-stone-700 border border-stone-300 font-bold text-xs uppercase hover:bg-stone-300 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}