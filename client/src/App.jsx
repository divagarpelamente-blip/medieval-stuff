import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useKingdomStore } from './store/useKingdomStore';
import MainMenu from "./pages/MainMenu"; 
import DashboardWidgetsSandbox from "./components/sandbox/dashboard-widgets-sandbox";

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
      return () => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      };
    }
  }, [initAuth]);

  // Native Path Routing for Sandbox Environments
  const path = window.location.pathname;

  if (path === '/sandbox') {
    return (
      <QueryClientProvider client={queryClient}>
        <DashboardWidgetsSandbox />
      </QueryClientProvider>
    );
  }

  // Default Production Route
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-stone-950 text-stone-200 antialiased selection:bg-amber-900 selection:text-amber-100">
        <MainMenu />
      </div>
    </QueryClientProvider>
  );
}