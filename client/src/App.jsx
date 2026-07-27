import React, { useEffect } from 'react';
import { useKingdomStore } from './store/useKingdomStore';
import MainMenu from './pages/MainMenu';
import DashboardWidgetsSandbox from './components/sandbox/dashboard-widgets-sandbox'; // FIX: Added components/ to the path
import Login from './components/auth/Login';

export default function App() {
  const initAuth = useKingdomStore((state) => state.initAuth);
  const user = useKingdomStore((state) => state.user);
  
  // Gatilho principal: Acorda a Store e trata do Login + Fetch de Dados
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

  // Roteamento para a Sandbox
  const path = window.location.pathname;
  if (path === '/sandbox') {
    return <DashboardWidgetsSandbox />;
  }

  // Barreira de Segurança: Se não há utilizador logado, mostra o Login.
  // Isto impede o "profile_id=is.null" que vimos no erro da rede.
  if (!user) {
    return (
       <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center">
         <Login />
       </div>
    );
  }

  // Tudo seguro: O Utilizador existe. Carrega a UI.
  return (
    <div className="min-h-screen bg-stone-950 text-stone-200 antialiased selection:bg-amber-900 selection:text-amber-100">
      <MainMenu />
    </div>
  );
}