import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useKingdomStore } from './store/useKingdomStore';
import MainMenu from "./pages/MainMenu"; 

// Instantiate the TanStack Query Client outside the component to prevent cache resets
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

export default function App() {
  const initAuth = useKingdomStore((state) => state.initAuth);

  useEffect(() => {
    if (initAuth) {
      const unsubscribe = initAuth();
      // Clean up subscription listener on unmount
      return () => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      };
    }
  }, [initAuth]);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-stone-950 text-stone-200 antialiased selection:bg-amber-900 selection:text-amber-100">
        <MainMenu />
      </div>
    </QueryClientProvider>
  );
}