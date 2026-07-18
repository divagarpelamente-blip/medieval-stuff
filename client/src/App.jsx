import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useKingdomStore } from './store/useKingdomStore';
// POINT TO THE CINEMATIC MENU:
import MainMenuSandbox from "./components/sandbox/MainMenuSandbox"; 
import DashboardSandbox from "./components/sandbox/DashboardSandbox"; 



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
  const initialize = useKingdomStore((state) => state.initialize);

  useEffect(() => {
    if (initialize) {
      initialize();
    }
  }, [initialize]);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-stone-950 text-stone-200 antialiased selection:bg-amber-900 selection:text-amber-100">
        <DashboardSandbox />
      </div>
    </QueryClientProvider>
  );
}