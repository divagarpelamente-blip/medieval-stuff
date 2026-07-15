import React, { useState, useEffect } from 'react';
import { useKingdomStore } from '../../store/useKingdomStore';
import Modal from '../Modals/Modal';
import TreasuryController from '../Modals/TreasuryController';
import SettingsController from '../Modals/SettingsController';
import bgImage from '../../assets/Medieval_Town_Backround.jfif';

/**
 * MainMenuSandbox Component (V2.0 Core Shell)
 * 
 * Acting as the primary cinematic landing and routing shell of Eldoria V2.0.
 * Restricts viewport bounds to a strict, non-collapsible "Modern Dashboard" wrapper.
 * Spans the background image across the outer dynamic height void to prevent distortion,
 * and hosts the modular controllers inside the centered inner canvas.
 */
export default function MainMenuSandbox() {
  // --- Zustand Store Connections ---
  const store = useKingdomStore();
  const fetchChartOfAccounts = store?.fetchChartOfAccounts;

  // --- Sandbox Component UI States ---
  const [activeModal, setActiveModal] = useState(null); // 'quests' | 'achievements' | 'treasury' | 'dashboard' | 'settings' | null

  // Bootstrap Chart of Accounts Flat Matrix upon interface mount
  useEffect(() => {
    if (fetchChartOfAccounts) {
      fetchChartOfAccounts();
    }
  }, [fetchChartOfAccounts]);

  // Unified metadata dictionary for modal header configuration
  const modalMetadata = {
    quests: { icon: '⚔️', title: 'Quests', subtitle: 'Sovereign objectives and campaigns' },
    achievements: { icon: '🏆', title: 'Achievements', subtitle: 'Unveiled royal milestones' },
    treasury: { icon: '🏦', title: 'Treasury', subtitle: 'Double-entry asset balance and registry' },
    dashboard: { icon: '🏰', title: 'Dashboard', subtitle: 'Command province dashboard' },
    settings: { icon: '⚙️', title: 'Settings', subtitle: 'Citadel identity configurations' }
  };

  // Resolve current active metadata dynamically
  const currentMeta = activeModal ? modalMetadata[activeModal] : null;

  return (
    /* ==========================================
        1. THE OUTER VOID (Strict Full Screen bg-black)
        ========================================== */
    <div 
      className="w-full h-dvh flex justify-center overflow-hidden bg-black"
      style={{ 
        backgroundImage: `radial-gradient(ellipse at center, rgba(12, 10, 9, 0.4) 0%, rgba(9, 8, 8, 0.95) 100%), url(${bgImage})`, 
        backgroundSize: 'cover', 
        backgroundPosition: 'center' 
      }}
    >
      
      {/* ==========================================
          2. THE INNER CANVAS (Centered Transparent Core)
          ========================================== */}
      <div className="relative w-full max-w-7xl h-full mx-auto text-stone-100 flex flex-col justify-between font-serif overflow-x-hidden overflow-y-auto">

        {/* ==========================================
            3. MAIN ROUTING VIEWPORT (Center-Bottom Anchoring)
            ========================================== */}
        <main className="flex-grow flex flex-col items-center justify-end px-4 pb-16 z-10">
          {activeModal === null ? (
            /* ==========================================
                SLEEK FLOATING DOCK MENU (Active === null)
               ========================================== */
            <div className="flex items-center justify-center bg-stone-950/80 backdrop-blur-md border border-amber-900/50 rounded-full px-8 py-4 shadow-[0_0_30px_rgba(0,0,0,0.8)] gap-8 animate-fade-in">
              
              {/* 1. Quests Button */}
              <button 
                onClick={() => setActiveModal('quests')}
                title="Quests"
                className="text-3xl grayscale hover:grayscale-0 hover:scale-125 transition-all duration-200 cursor-pointer focus:outline-none"
              >
                ⚔️
              </button>

              {/* 2. Achievements Button */}
              <button 
                onClick={() => setActiveModal('achievements')}
                title="Achievements"
                className="text-3xl grayscale hover:grayscale-0 hover:scale-125 transition-all duration-200 cursor-pointer focus:outline-none"
              >
                🏆
              </button>

              {/* 3. Treasury Button */}
              <button 
                onClick={() => setActiveModal('treasury')}
                title="Treasury"
                className="text-3xl grayscale hover:grayscale-0 hover:scale-125 transition-all duration-200 cursor-pointer focus:outline-none"
              >
                🏦
              </button>

              {/* 4. Dashboard Button */}
              <button 
                onClick={() => setActiveModal('dashboard')}
                title="Dashboard"
                className="text-3xl grayscale hover:grayscale-0 hover:scale-125 transition-all duration-200 cursor-pointer focus:outline-none"
              >
                🏰
              </button>

              {/* 5. Settings Button */}
              <button 
                onClick={() => setActiveModal('settings')}
                title="Settings"
                className="text-3xl grayscale hover:grayscale-0 hover:scale-125 transition-all duration-200 cursor-pointer focus:outline-none"
              >
                ⚙️
              </button>

            </div>
          ) : activeModal === 'treasury' ? (
            /* ==========================================
                ROYAL TREASURY MODULE CONTROLLER
               ========================================== */
            <TreasuryController onClose={() => setActiveModal(null)} />
          ) : activeModal === 'settings' ? (
            /* ==========================================
                CITADEL CONFIGURATIONS CONTROLLER
               ========================================== */
            <SettingsController onClose={() => setActiveModal(null)} />
          ) : (
            /* ==========================================
                MODULAR FALLBACK OVERLAY (Quests, Achievements, Dashboard)
               ========================================== */
            <Modal
              icon={currentMeta?.icon}
              title={currentMeta?.title}
              subtitle={currentMeta?.subtitle}
              onClose={() => setActiveModal(null)}
            >
              {/* Standard Placeholder Body */}
              <div className="flex flex-col items-center justify-center p-12 text-center opacity-50">
                <span className="text-4xl mb-4">🚧</span>
                <p className="text-stone-400 font-sans tracking-widest uppercase">
                  This area will be defined later
                </p>
              </div>
            </Modal>
          )}
        </main>

      </div>
    </div>
  );
}