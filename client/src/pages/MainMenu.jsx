import React, { useState, useEffect, useRef } from 'react';
import { useKingdomStore } from '../store/useKingdomStore';
import Dashboard from '../pages/Dashboard';
import FinancialAlerts from '../pages/FinancialAlerts';
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
  const [viewMode, setViewMode] = useState('tablet'); 
  
  const [isTreasuryExpanded, setIsTreasuryExpanded] = useState(false);
  
  // Ref to detect clicks outside the treasury menu
  const treasuryRef = useRef(null);

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

  // Handle Escape key and Click Outside for the Treasury drop-up
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isTreasuryExpanded) {
        setIsTreasuryExpanded(false);
      }
    };

    const handleClickOutside = (e) => {
      if (treasuryRef.current && !treasuryRef.current.contains(e.target)) {
        setIsTreasuryExpanded(false);
      }
    };

    if (isTreasuryExpanded) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isTreasuryExpanded]);

  const modalMetadata = {
    finance_advisor: { icon: '📋', title: 'Finance Advisor', subtitle: 'Royal Financial Alerts' },
    placeholder01: { icon: '🚧', title: 'Placeholder01', subtitle: 'Under Construction' },
    quests: { icon: '⚔️', title: 'Quests', subtitle: 'Sovereign objectives and campaigns' },
    treasury_dashboard: { icon: '📈', title: 'Treasury Dashboard', subtitle: 'Financial KPIs and Visualizations' },
    general_ledger: { icon: '📜', title: 'General Ledger', subtitle: 'Double-entry asset balance and registry' },
    financial_statements: { icon: '📊', title: 'Financial Statements', subtitle: 'Income, Balance Sheet & Cash Flow' },
    achievements: { icon: '🏆', title: 'Achievements', subtitle: 'Unveiled royal milestones' },
    settings: { icon: '⚙️', title: 'Settings', subtitle: 'Citadel identity configurations' }
  };

  const currentMeta = activeModal ? modalMetadata[activeModal] : null;

  const getViewClasses = () => {
    switch (viewMode) {
      case 'phone': 
        return 'w-full max-w-[844px] h-[390px] max-h-[95dvh] border-y-4 border-x-[16px] rounded-[2.5rem] border-stone-900 shadow-[0_0_80px_rgba(0,0,0,0.8)]';
      case 'tablet': 
      default: 
        return 'w-full max-w-[1180px] h-[820px] max-h-[95dvh] border-y-4 border-x-[16px] rounded-3xl border-stone-900 shadow-[0_0_80px_rgba(0,0,0,0.8)]';
    }
  };

  const openSubMenu = (modalKey) => {
    setActiveModal(modalKey);
    setIsTreasuryExpanded(false);
  };

  return (
    <div className="w-full h-dvh bg-stone-950 flex items-center justify-center overflow-hidden">
      
      <div 
        className={`relative mx-auto text-stone-100 flex flex-col justify-between font-serif overflow-hidden transition-all duration-500 ease-in-out @container ${getViewClasses()}`}
        style={{
          backgroundImage: `radial-gradient(ellipse at center, rgba(12, 10, 9, 0.4) 0%, rgba(9, 8, 8, 0.95) 100%), url(${bgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        
        {activeModal === null && (
          <div className="absolute top-6 left-6 z-50 flex flex-col items-start gap-4">
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

        <main className="flex-grow flex flex-col items-center justify-end px-4 pb-8 z-10 w-full min-h-0">
          {activeModal === null ? (
            <div className="flex items-center justify-center bg-stone-950/80 backdrop-blur-md border border-amber-900/50 rounded-full px-8 py-4 shadow-[0_0_30px_rgba(0,0,0,0.8)] gap-8 animate-fade-in flex-wrap relative">
              
              {/* 1. Finance Advisor */}
              <button onClick={() => setActiveModal('finance_advisor')} title="Finance Advisor" className="text-3xl grayscale hover:grayscale-0 hover:scale-125 transition-all duration-200 cursor-pointer focus:outline-none">📋</button>
              
              {/* 2. Placeholder01 */}
              <button onClick={() => setActiveModal('placeholder01')} title="Placeholder01" className="text-3xl grayscale hover:grayscale-0 hover:scale-125 transition-all duration-200 cursor-pointer focus:outline-none">🚧</button>
              
              {/* 3. Quests */}
              <button onClick={() => setActiveModal('quests')} title="Quests" className="text-3xl grayscale hover:grayscale-0 hover:scale-125 transition-all duration-200 cursor-pointer focus:outline-none">⚔️</button>
              
              {/* 4. Treasury */}
              <div className="relative flex flex-col items-start" ref={treasuryRef}>
                {isTreasuryExpanded && (
                  <div className="absolute bottom-[calc(100%+1.5rem)] left-0 flex flex-col bg-stone-900/95 backdrop-blur-md border border-amber-700/50 rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.8)] overflow-hidden animate-fade-in z-50 min-w-max">
                    <button 
                      onClick={() => openSubMenu('general_ledger')} 
                      className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-amber-100 hover:text-white hover:bg-amber-800/50 border-b border-amber-900/30 transition-colors whitespace-nowrap"
                    >
                      📜 General Ledger
                    </button>
                    <button 
                      onClick={() => openSubMenu('financial_statements')} 
                      className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-amber-100 hover:text-white hover:bg-amber-800/50 border-b border-amber-900/30 transition-colors whitespace-nowrap"
                    >
                      📊 Financial Statements
                    </button>
                    <button 
                      onClick={() => openSubMenu('treasury_dashboard')} 
                      className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-amber-100 hover:text-white hover:bg-amber-800/50 transition-colors whitespace-nowrap"
                    >
                      📈 Treasury Dashboard
                    </button>
                  </div>
                )}
                <button 
                  onClick={() => setIsTreasuryExpanded(!isTreasuryExpanded)} 
                  title="Treasury" 
                  className={`text-3xl transition-all duration-200 cursor-pointer focus:outline-none ${
                    isTreasuryExpanded 
                      ? 'grayscale-0 scale-125 drop-shadow-[0_0_15px_rgba(251,191,36,0.7)]' 
                      : 'grayscale hover:grayscale-0 hover:scale-125'
                  }`}
                >
                  🏦
                </button>
              </div>

              {/* 5. Achievements */}
              <button onClick={() => setActiveModal('achievements')} title="Achievements" className="text-3xl grayscale hover:grayscale-0 hover:scale-125 transition-all duration-200 cursor-pointer focus:outline-none">🏆</button>
              
              {/* 6. Settings */}
              <button onClick={() => setActiveModal('settings')} title="Settings" className="text-3xl grayscale hover:grayscale-0 hover:scale-125 transition-all duration-200 cursor-pointer focus:outline-none">⚙️</button>
            </div>
          
          ) : activeModal === 'finance_advisor' ? (
            <FinancialAlerts onClose={() => setActiveModal(null)} />
          ) : activeModal === 'general_ledger' ? (
            <TreasuryController initialView="ledger" onClose={() => setActiveModal(null)} />
          ) : activeModal === 'financial_statements' ? (
            <TreasuryController initialView="statements" onClose={() => setActiveModal(null)} />
          ) : activeModal === 'treasury_dashboard' ? (
            <div 
              className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => window.dispatchEvent(new CustomEvent('trigger-dashboard-exit'))}
            >
              <div 
                className="absolute top-4 bottom-4 left-2 right-2 md:top-6 md:bottom-6 md:left-6 md:right-6 bg-stone-950 rounded-2xl overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.95)] border border-amber-900/60"
                onClick={(e) => e.stopPropagation()} 
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