import React, { useEffect } from "react";
import { Toaster } from 'react-hot-toast';
import { useKingdomStore } from './store/useKingdomStore';

// Production Controllers (No Sandboxes)
import TreasuryController from "./components/Modals/TreasuryController";

function App() {
  const initAuth = useKingdomStore((state) => state.initAuth);

  // Boot up the Supabase Authentication pipeline on load
  useEffect(() => {
    const unsubscribe = initAuth();
    return () => {
      if (unsubscribe) unsubscribe();
    }
  }, [initAuth]);

  return (
    <>
      {/* Global Toast Notification Provider */}
      <Toaster 
        position="top-center" 
        toastOptions={{
          style: {
            background: '#1c1917', // stone-900
            color: '#fcd34d',      // amber-300
            border: '1px solid #78350f', // amber-900
            fontFamily: 'serif',
          },
        }} 
      />
    </>
  );
}

export default App;