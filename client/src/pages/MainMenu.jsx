import React, { useState, useEffect } from 'react';
import { useKingdomStore } from '../store/useKingdomStore';
import Dashboard from '../pages/Dashboard';
import Modal from '../components/ui/Modal';
import TreasuryController from '../components/features/Ledger/TreasuryController';
import SettingsController from '../components/features/settings/SettingsController';
import bgImage from '../assets/Medieval_Town_Backround.jfif';

/**
 * MainMenu Component (V2.0 Core Shell)
 * 
 * Simulated Device Wrapper (Landscape Only).
 * Forces the UI into iPad (Tablet) or iPhone (Phone) horizontal aspect ratios.
 */
export default function MainMenu() {
  const store = useKingdomStore();
  const fetchFlatMatrix = store?.fetchFlatMatrix;

  const [activeModal, setActiveModal] = useState(null);
  const [viewMode, setViewMode] = useState('tablet'); // Initialize default to Tablet

  useEffect(() => {
    if (fetchFlatMatrix) {
      fetchFlatMatrix();
    }
  }, [fetchFlatMatrix]);

  useEffect(() => {
    const handleCloseDashboard = () => {
      setActiveModal(null);
    };

    window.addEventListener('close-dashboard', handleCloseDashboard);
    return () => {
      window.removeEventListener('close-dashboard', handleCloseDashboard);
    };
  }, []);

  const modalMetadata = {
    quests: { icon: '⚔️', title: 'Quests', subtitle: 'Sovereign objectives and campaigns' },
    achievements: { icon: '🏆', title: 'Achievements', subtitle: 'Unveiled royal milestones' },
    treasury: { icon: '🏦', title: 'Treasury', subtitle: 'Double-entry asset balance and registry' },
    dashboard: { icon: '🏰', title: 'Dashboard', subtitle: 'Command province dashboard' },
    settings: { icon: '⚙️', title: 'Settings', subtitle: 'Citadel identity configurations' }
  };

  const currentMeta = activeModal ? modalMetadata[activeModal] : null;

  // Resolves the CSS boundaries for the simulated device screen (Horizontal/Landscape)
  const getViewClasses = () => {
    switch (viewMode) {
      case 'phone': 
        // iPhone Landscape standard bounds
        return 'w-full max-w-[844px] h-[390px] max-h-[95dvh] border-y-4 border-x-[16px] rounded-[2.5rem] border-stone-900 shadow-[0_0_80px_rgba(0,0,0,0.8)]';
      case 'tablet': 
      default: 
        // iPad Landscape standard bounds
        return 'w-full max-w-[1180px] h-[820px] max-h-[95dvh] border-y-4 border-x-[16px] rounded-3xl border-stone-900 shadow-[0_0_80px_rgba(0,0,0,0.8)]';
    }
  };

  return (
    // Outer Monitor Void
    <div className="w-full h-dvh bg-stone-950 flex items-center justify-center overflow-hidden">
      
      {/* Simulated Device Screen (Using @container for future widget queries) */}
      <div 
        className={`relative mx-auto text-stone-100 flex flex-col justify-between font-serif overflow-hidden transition-all duration-500 ease-in-out @container ${getViewClasses()}`}
        style={{
          backgroundImage: `radial-gradient(ellipse at center, rgba(12, 10, 9, 0.4) 0%, rgba(9, 8, 8, 0.95) 100%), url(${bgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        
        {/* Avatar & View Toggle HUD - Hidden when a module is open */}
        {activeModal === null && (
          <div className="absolute top-6 left-6 z-50 flex flex-col items-start gap-4">
            {/* Avatar Profile Row */}
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-stone-800 border-2 border-amber-600/60 shadow-[0_0_15px_rgba(217,119,6,0.3)] flex items-center justify-center overflow-hidden">
                <img 
                  src="https://api.dicebear.com/7.x/adventurer/svg?seed=Proudmore&backgroundColor=transparent" 
                  alt="Avatar" 
                  className="w-full h-full object-cover scale-110" 
                />
              </div>
              <span className="font-black text-amber-50 tracking-widest uppercase text-sm drop-shadow-md">
                Proudmore
              </span>
            </div>
            
            {/* Viewport Simulation Controls */}
            <div className="flex bg-stone-900/80 p-1 rounded-lg border border-amber-900/40 backdrop-blur-sm shadow-lg">
              {['tablet', 'phone'].map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider rounded transition-colors ${
                    viewMode === mode 
                      ? 'bg-amber-700/80 text-amber-100 font-bold shadow-inner' 
                      : 'text-stone-400 hover:text-amber-200 hover:bg-stone-800/80'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        )}

        <main className="flex-grow flex flex-col items-center justify-end px-4 pb-16 z-10 w-full min-h-0">
          {activeModal === null ? (
            <div className="flex items-center justify-center bg-stone-950/80 backdrop-blur-md border border-amber-900/50 rounded-full px-8 py-4 shadow-[0_0_30px_rgba(0,0,0,0.8)] gap-8 animate-fade-in flex-wrap">
              <button onClick={() => setActiveModal('quests')} title="Quests" className="text-3xl grayscale hover:grayscale-0 hover:scale-125 transition-all duration-200 cursor-pointer focus:outline-none">⚔️</button>
              <button onClick={() => setActiveModal('achievements')} title="Achievements" className="text-3xl grayscale hover:grayscale-0 hover:scale-125 transition-all duration-200 cursor-pointer focus:outline-none">🏆</button>
              <button onClick={() => setActiveModal('treasury')} title="Treasury" className="text-3xl grayscale hover:grayscale-0 hover:scale-125 transition-all duration-200 cursor-pointer focus:outline-none">🏦</button>
              <button onClick={() => setActiveModal('dashboard')} title="Dashboard" className="text-3xl grayscale hover:grayscale-0 hover:scale-125 transition-all duration-200 cursor-pointer focus:outline-none">🏰</button>
              <button onClick={() => setActiveModal('settings')} title="Settings" className="text-3xl grayscale hover:grayscale-0 hover:scale-125 transition-all duration-200 cursor-pointer focus:outline-none">⚙️</button>
            </div>
          ) : activeModal === 'treasury' ? (
            <TreasuryController onClose={() => setActiveModal(null)} />
          ) : activeModal === 'dashboard' ? (
            /* Dashboard Clickable Backdrop Wrapper */
            <div 
              className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => window.dispatchEvent(new CustomEvent('trigger-dashboard-exit'))}
            >
              <div 
                className="absolute top-4 bottom-4 left-2 right-2 md:top-6 md:bottom-6 md:left-6 md:right-6 bg-stone-950 rounded-2xl overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.95)] border border-amber-900/60"
                onClick={(e) => e.stopPropagation()} /* Prevents clicks inside the dashboard from closing it */
              >
                <Dashboard />
              </div>
            </div>
          ) : activeModal === 'settings' ? (
            <SettingsController onClose={() => setActiveModal(null)} />
          ) : (
            <Modal icon={currentMeta?.icon} title={currentMeta?.title} subtitle={currentMeta?.subtitle} onClose={() => setActiveModal(null)}>
              <div className="flex flex-col items-center justify-center p-12 text-center opacity-50">
                <span className="text-4xl mb-4">🚧</span>
                <p className="text-stone-400 font-sans tracking-widest uppercase">This area will be defined later</p>
              </div>
            </Modal>
          )}
        </main>

      </div>
    </div>
  );
}