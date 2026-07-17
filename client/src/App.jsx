import React, { useState, useEffect } from 'react'; 
import { useKingdomStore } from './store/useKingdomStore'; 
import MainMenuSandbox from './components/sandbox/MainMenuSandbox'; 
import TreasuryController from './components/Modals/TreasuryController';

/**
 * App Entry Point (Eldoria V2.0 Routing Shell)
 * Cleans up legacy UI structures, side navigations, and global headers.
 * Triggers the core state subscription listeners (auth pipelines) from the
 * Zustand store, and presents as the primary full-screen component.
 */
export default function App() { 
  const initAuth = useKingdomStore((state) => state.initAuth);
  const [isTreasuryOpen, setIsTreasuryOpen] = useState(false);

  // Initialize Supabase Auth state synchronization on boot
  useEffect(() => { 
    if (initAuth) { 
      const unsubscribe = initAuth(); 
      return () => { 
        if (unsubscribe) unsubscribe(); 
      }; 
    } 
  }, [initAuth]);

  return ( 
    <React.Fragment> 
      {/* Renders the Main Menu when the treasury is closed */}
      {!isTreasuryOpen && ( 
        <MainMenuSandbox onOpenTreasury={() => setIsTreasuryOpen(true)} /> 
      )}

      {/* Renders the Treasury Modal over a black void when opened */}
      {isTreasuryOpen && (
        <div className="fixed inset-0 bg-black flex items-center justify-center p-8 z-50">
           <TreasuryController onClose={() => setIsTreasuryOpen(false)} />
        </div>
      )}
    </React.Fragment>
  ); 
}