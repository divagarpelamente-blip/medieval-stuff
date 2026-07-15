import React, { useEffect } from 'react';
import { useKingdomStore } from './store/useKingdomStore';
import MainMenuSandbox from './components/sandbox/MainMenuSandbox';

/**
 * App Entry Point (Eldoria V2.0 Routing Shell)
 * 
 * Cleans up legacy UI structures, side navigations, and global headers.
 * Triggers the core state subscription listeners (auth pipelines) from the 
 * Zustand store, and presents <MainMenuSandbox /> as the primary full-screen component.
 */
export default function App() {
  const initAuth = useKingdomStore((state) => state.initAuth);

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
      <MainMenuSandbox />
    </React.Fragment>
  );
}