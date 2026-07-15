import React, { useEffect, useState } from "react";
import { Toaster } from 'react-hot-toast';
import { useKingdomStore } from './store/useKingdomStore';

// Production Controllers (No Sandboxes)
import TreasuryController from "./components/Modals/TreasuryController";

function App() {
  const initAuth = useKingdomStore((state) => state.initAuth);
  
  // Central Command Hub Routing State
  const [activeModule, setActiveModule] = useState('hub'); 

  // Boot up the Supabase Authentication pipeline on load
  useEffect(() => {
    const unsubscribe = initAuth();
    return () => {
      if (unsubscribe) unsubscribe();
    }
  }, [initAuth]);

  return (
    <div className="w-full h-dvh bg-black flex flex-col justify-center items-center overflow-hidden font-sans text-stone-200">
      
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
      
      {/* --- MAIN COMMAND HUB ROUTING --- */}
      {      activeModule === 'treasury' ? (
        <TreasuryController onClose={() => setActiveModule('hub')} />
      ) : (
        <div className="text-center space-y-6 animate-fade-in">
          <h1 className="text-4xl font-serif text-amber-500 tracking-widest uppercase">Eldoria Command Hub</h1>
          <button 
            onClick={() => setActiveModule('treasury')}
            className="px-6 py-3 bg-stone-800 hover:bg-stone-700 text-amber-400 font-serif tracking-wide rounded border border-amber-900 transition shadow-lg cursor-pointer"
          >
            Enter Royal Treasury
          </button>
        </div>
      )}

    </div>
  );
}

export default App;