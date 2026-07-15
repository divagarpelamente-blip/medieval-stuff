import React, { useState, useEffect } from 'react';
import { useKingdomStore } from './store/useKingdomStore';
import MainMenuSandbox from './components/sandbox/MainMenuSandbox';

// IMPORTANT: Adjust this path to match exactly where your TreasuryController is saved
import TreasuryController from './components/Modals/TreasuryController'; 

/**
 * App Entry Point (Eldoria V2.0 Routing Shell)
 * 
 * Cleans up legacy UI structures, side navigations, and global headers.
 * Triggers the core state subscription listeners (auth pipelines) from the 
 * Zustand store, and presents <MainMenuSandbox /> as the primary full-screen component.
 */
export default function App() {
  const initAuth = useKingdomStore((state) => state.initAuth);
  
  // 1. Add state to track if the Treasury Module is open
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
      {/* 
        2. We render your MainMenuSandbox but pass it a new "prop" (function).
        This allows a button inside the Main Menu to tell App.jsx to open the Treasury.
      */}
      {!isTreasuryOpen && (
        <MainMenuSandbox onOpenTreasury={() => setIsTreasuryOpen(true)} />
      )}

      {/* 
        3. If the Treasury is open, render the Controller.
        The onClose prop safely returns the user to the Main Menu.
      */}
      {isTreasuryOpen && (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
           <TreasuryController onClose={() => setIsTreasuryOpen(false)} />
        </div>
      )}
    </React.Fragment>
  );
}