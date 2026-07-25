import React, { useState, useEffect } from 'react';
import { useKingdomStore } from '../store/useKingdomStore';
import Dashboard from './Dashboard';
import Modal from '../components/Modals/Modal';
import TreasuryController from '../components/Modals/TreasuryController';
import SettingsController from '../components/Modals/SettingsController';
import bgImage from '../assets/Medieval_Town_Backround.jfif';

/**
 * MainMenu Component (V2.0 Core Shell)
 * 
 * Acting as the primary cinematic landing and routing shell of Eldoria V2.0.
 * Restricts viewport bounds to a strict, non-collapsible "Modern Dashboard" wrapper.
 * Spans the background image across the outer dynamic height void to prevent distortion,
 * and hosts the modular controllers inside the centered inner canvas.
 */
export default function MainMenu() {
  const store = useKingdomStore();
  const fetchChartOfAccounts = store?.fetchChartOfAccounts;

  const [activeModal, setActiveModal] = useState(null); 

  useEffect(() => {
    if (fetchChartOfAccounts) {
      fetchChartOfAccounts();
    }
  }, [fetchChartOfAccounts]);

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

  return (
    <div
      className="w-full h-dvh bg-black flex justify-center overflow-hidden"
      style={{
        backgroundImage: `radial-gradient(ellipse at center, rgba(12, 10, 9, 0.4) 0%, rgba(9, 8, 8, 0.95) 100%), url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div className="relative w-full max-w-7xl h-full mx-auto text-stone-100 flex flex-col justify-between font-serif overflow-hidden">
        <main className="flex-grow flex flex-col items-center justify-end px-4 pb-16 z-10 w-full min-h-0">
          {activeModal === null ? (
            <div className="flex items-center justify-center bg-stone-950/80 backdrop-blur-md border border-amber-900/50 rounded-full px-8 py-4 shadow-[0_0_30px_rgba(0,0,0,0.8)] gap-8 animate-fade-in">
              <button onClick={() => setActiveModal('quests')} title="Quests" className="text-3xl grayscale hover:grayscale-0 hover:scale-125 transition-all duration-200 cursor-pointer focus:outline-none">⚔️</button>
              <button onClick={() => setActiveModal('achievements')} title="Achievements" className="text-3xl grayscale hover:grayscale-0 hover:scale-125 transition-all duration-200 cursor-pointer focus:outline-none">🏆</button>
              <button onClick={() => setActiveModal('treasury')} title="Treasury" className="text-3xl grayscale hover:grayscale-0 hover:scale-125 transition-all duration-200 cursor-pointer focus:outline-none">🏦</button>
              <button onClick={() => setActiveModal('dashboard')} title="Dashboard" className="text-3xl grayscale hover:grayscale-0 hover:scale-125 transition-all duration-200 cursor-pointer focus:outline-none">🏰</button>
              <button onClick={() => setActiveModal('settings')} title="Settings" className="text-3xl grayscale hover:grayscale-0 hover:scale-125 transition-all duration-200 cursor-pointer focus:outline-none">⚙️</button>
            </div>
          ) : activeModal === 'treasury' ? (
            <TreasuryController onClose={() => setActiveModal(null)} />
          ) : activeModal === 'dashboard' ? (
            /* LAUNCH THE NEW V2.1 DASHBOARD ENGINE IN PRODUCTION MODE - FIXED MARGINS */
            <div className="absolute top-4 bottom-4 left-2 right-2 md:top-8 md:bottom-8 md:left-6 md:right-6 z-50 bg-stone-950 rounded-2xl overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.95)] border border-amber-900/60">
              <Dashboard />
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