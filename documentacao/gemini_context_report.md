# Gemini Context Report: Eldoria (Medieval Stuff)

Este relatório compila todo o estado atual, a estrutura de ficheiros, os esquemas de base de dados e os ficheiros de código-fonte críticos da aplicação **Eldoria (Medieval Stuff)** para servir de contexto direto e contínuo para o Gemini.

---

## 1. Visão Geral do Projeto
*   **Nome da Aplicação**: Eldoria (Medieval Stuff)
*   **Tecnologias**: React (Vite) + Tailwind CSS + Zustand + Supabase (PostgreSQL) + Lucide React.
*   **Objetivo**: Um simulador medieval e gestor de recursos gamificado (*Clean Slate*). O utilizador gere o seu reino (recolhendo ouro, acumulando XP, subindo de nível e melhorando edifícios).
*   **Estado Atual**: O código antigo do Ledger financeiro foi inteiramente removido. A aplicação foi convertida num esqueleto visual limpo. A **Mina de Ouro** foi ativada como a primeira ala funcional (Core Loop: ticking passivo, coleta de ouro para a reserva global, consumo de ouro em melhorias e ganho de XP com subida automática de nível de Lorde). As outras alas (Tesouraria, Taberna, etc.) e o menu inferior mantêm-se em estado estático de mockup ("Under Construction").

---

## 2. Árvore de Ficheiros do Projeto
```text
Medieval Stuff/
├── .gitignore
├── package.json
├── package-lock.json
├── db_reset_migration.sql (Moved to SQL all)
├── client/
│   ├── package.json
│   ├── vite.config.js
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── index.css
│   │   ├── App.css
│   │   ├── assets/
│   │   │   └── Medieval_Town_Backround.png (Background panorâmico)
│   │   ├── lib/
│   │   │   └── supabaseClient.js (Ligação Supabase)
│   │   ├── components/
│   │   │   ├── HUD.jsx (Painel superior com recursos)
│   │   │   ├── IsometricMap.jsx (Zonas interativas HitZones)
│   │   │   ├── BottomNav.jsx (Barra inferior de atalhos)
│   │   │   └── Modal.jsx (Modal medieval decorado)
│   │   └── store/
│   │       └── useKingdomStore.js (Estado global Zustand)
├── SQL all/
│   ├── db_reset_migration.sql (Script de reset base Supabase)
│   ├── setup.sql (Script de setup inicial da DB)
│   └── mockup_test_data.sql (Dados de teste de convidado)
└── documentacao/
    ├── DOCUMENTATION.md (Manual geral)
    ├── orientacao_gamificacao.md (Diretrizes de game loops)
    ├── perfil_especialista.md (Pilares do design)
    ├── roteiro_teste_manual.md (Script para testar o Core Loop)
    ├── proximos_passos.md (Roadmap de futuras alas)
    └── gemini_context_report.md (Este relatório)
```

---

## 3. Estrutura Base de Dados (Supabase / PostgreSQL)
Mapeada no script de limpeza e reinstalação:

```sql
-- 1. Tabela: profiles (Estatísticas do Lorde)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY,
    email TEXT,
    gold BIGINT DEFAULT 1000,
    level INTEGER DEFAULT 1,
    xp INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela: buildings (Infraestrutura do Reino)
CREATE TABLE public.buildings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    level INTEGER DEFAULT 1,
    stored_resources DOUBLE PRECISION DEFAULT 0,
    last_collection TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS ativado para ambas as tabelas com políticas de propriedade individual (auth.uid() = id/profile_id).
```

---

## 4. Código-Fonte Crítico do Projeto

### A. Estado Global: `client/src/store/useKingdomStore.js`
Gere a reatividade e a lógica matemática de ouro, gemas, ticks passivos, coletas e upgrades:

```javascript
import { create } from 'zustand';

export const useKingdomStore = create((set) => ({
  gold: 1000,
  gems: 100,
  xp: 0,
  level: 1,
  email: 'lord.eldoria@kingdom.gov',
  
  // Gold Mine states
  mineLevel: 1,
  mineResources: 0,

  // Actions
  addGold: (amount) => set((state) => ({ gold: state.gold + Math.max(0, amount) })),
  
  spendGold: (amount) => {
    let success = false;
    set((state) => {
      if (state.gold >= amount) {
        success = true;
        return { gold: state.gold - amount };
      }
      return {};
    });
    return success;
  },

  addGems: (amount) => set((state) => ({ gems: state.gems + Math.max(0, amount) })),

  spendGems: (amount) => {
    let success = false;
    set((state) => {
      if (state.gems >= amount) {
        success = true;
        return { gems: state.gems - amount };
      }
      return {};
    });
    return success;
  },

  addXp: (amount) => set((state) => {
    let newXp = state.xp + Math.max(0, amount);
    let newLevel = state.level;
    
    while (true) {
      const maxXp = 100 * Math.pow(1.5, newLevel - 1);
      if (newXp >= maxXp) {
        newXp -= maxXp;
        newLevel += 1;
      } else {
        break;
      }
    }
    
    return { xp: newXp, level: newLevel };
  }),

  // Gold Mine actions
  tickMine: () => set((state) => {
    const rate = (12 * state.mineLevel) / 60; // gold per second
    return { mineResources: state.mineResources + rate };
  }),

  collectResources: () => {
    let success = false;
    let collectedAmount = 0;
    set((state) => {
      const collected = Math.floor(state.mineResources);
      if (collected > 0) {
        success = true;
        collectedAmount = collected;
        // Award XP on collection (2 XP per Gold)
        const earnedXp = collected * 2;
        let newXp = state.xp + earnedXp;
        let newLevel = state.level;
        while (true) {
          const maxXp = 100 * Math.pow(1.5, newLevel - 1);
          if (newXp >= maxXp) {
            newXp -= maxXp;
            newLevel += 1;
          } else {
            break;
          }
        }

        return {
          gold: state.gold + collected,
          mineResources: state.mineResources - collected,
          xp: newXp,
          level: newLevel
        };
      }
      return {};
    });
    return { success, amount: collectedAmount };
  },

  upgradeMine: () => {
    let success = false;
    let costAmount = 0;
    set((state) => {
      const cost = Math.floor(100 * Math.pow(state.mineLevel, 1.8));
      if (state.gold >= cost) {
        success = true;
        costAmount = cost;
        // Award substantial XP on upgrade (20% of cost)
        const earnedXp = Math.floor(cost * 0.2);
        let newXp = state.xp + earnedXp;
        let newLevel = state.level;
        while (true) {
          const maxXp = 100 * Math.pow(1.5, newLevel - 1);
          if (newXp >= maxXp) {
            newXp -= maxXp;
            newLevel += 1;
          } else {
            break;
          }
        }

        return {
          gold: state.gold - cost,
          mineLevel: state.mineLevel + 1,
          xp: newXp,
          level: newLevel
        };
      }
      return {};
    });
    return { success, cost: costAmount };
  },

  resetStore: () => set({
    gold: 1000,
    gems: 100,
    xp: 0,
    level: 1,
    email: 'lord.eldoria@kingdom.gov',
    mineLevel: 1,
    mineResources: 0
  })
}));

export default useKingdomStore;
```

### B. Core Component: `client/src/App.jsx`
Subscreve o Zustand, dispara o ticker de passividade e renderiza o HUD superior, o mapa isométrico e o modal da Mina de Ouro:

```javascript
import React, { useState, useEffect } from 'react';
import HUD from './components/HUD';
import BottomNav from './components/BottomNav';
import IsometricMap from './components/IsometricMap';
import Modal from './components/Modal';
import bgMap from './assets/Medieval_Town_Backround.png';
import { useKingdomStore } from './store/useKingdomStore';
import { Toaster, toast } from 'react-hot-toast';

function App() {
  const [activeTab] = useState('quests'); // Default to quests (which shows the map)
  const [isMineModalOpen, setIsMineModalOpen] = useState(false);

  // Bind Zustand states
  const email = useKingdomStore((state) => state.email);
  const gold = useKingdomStore((state) => state.gold);
  const level = useKingdomStore((state) => state.level);
  const xp = useKingdomStore((state) => state.xp);
  const gems = useKingdomStore((state) => state.gems);
  
  const mineLevel = useKingdomStore((state) => state.mineLevel);
  const mineResources = useKingdomStore((state) => state.mineResources);
  
  // Actions
  const tickMine = useKingdomStore((state) => state.tickMine);
  const collectResources = useKingdomStore((state) => state.collectResources);
  const upgradeMine = useKingdomStore((state) => state.upgradeMine);

  const profile = { email, gold, level, xp };

  // Setup passive resource generation ticking
  useEffect(() => {
    const interval = setInterval(() => {
      tickMine();
    }, 1000);
    return () => clearInterval(interval);
  }, [tickMine]);

  const handleMineClick = () => {
    setIsMineModalOpen(true);
  };

  const upgradeCost = Math.floor(100 * Math.pow(mineLevel, 1.8));
  const productionRate = 12 * mineLevel;

  return (
    <div className="min-h-screen bg-black flex items-center justify-center overflow-hidden">
      <Toaster 
        position="top-center" 
        toastOptions={{
          style: {
            background: '#f4e4bc',
            color: '#4b2c20',
            borderColor: '#8b4513',
            borderWidth: '2px'
          },
          success: {
            iconTheme: { primary: '#059669', secondary: '#f4e4bc' },
          },
          error: {
            iconTheme: { primary: '#dc2626', secondary: '#f4e4bc' },
          },
        }}
      />
      <div className="game-viewport">
        {/* HUD Superior */}
        <HUD profile={profile} diamonds={gems} />

        {/* Mapa Isométrico */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {/* Background Map */}
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${bgMap})` }}
          />
          
          <IsometricMap onMineClick={handleMineClick} />
        </div>

        {/* Navegação Inferior (Estática) */}
        <BottomNav activeTab={activeTab} onTabChange={() => {}} />

        {/* Modal da Mina de Ouro */}
        <Modal
          isOpen={isMineModalOpen}
          onClose={() => setIsMineModalOpen(false)}
          title="Mina de Ouro"
          footer={
            <div className="flex gap-4 w-full">
              <button 
                onClick={() => {
                  const res = collectResources();
                  if (res.success) {
                    toast.success(`Collected ${res.amount} Gold from the mine!`);
                  } else {
                    toast.error('No gold to collect yet.');
                  }
                }}
                disabled={Math.floor(mineResources) <= 0}
                className="flex-1 py-3 bg-[#8b4513] text-white font-black text-xs uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md border-2 border-[#d4af37]/30"
              >
                Coletar Ouro
              </button>
              <button 
                onClick={() => {
                  const res = upgradeMine();
                  if (res.success) {
                    toast.success(`Mine upgraded to Level ${mineLevel + 1}! Spent ${res.cost} Gold.`);
                  } else {
                    toast.error(`Need ${upgradeCost} Gold to upgrade.`);
                  }
                }}
                disabled={gold < upgradeCost}
                className="flex-1 py-3 bg-[#4b2c20] text-white font-black text-xs uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md border-2 border-[#d4af37]/30"
              >
                Melhorar: {upgradeCost}g
              </button>
            </div>
          }
        >
          <div className="space-y-6 text-center">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-[#8b4513]/10 rounded-full flex items-center justify-center border-4 border-[#8b4513]/20 text-4xl animate-bounce">
                ⛏️
              </div>
            </div>
            <div>
              <p className="text-xs uppercase font-black tracking-widest text-[#5d4037]/70">Gold Mine Status</p>
              <h3 className="title-font text-2xl font-black text-[#4b2c20] uppercase mt-1">Level {mineLevel}</h3>
            </div>
            <div className="bg-[#faf4e5]/60 border border-[#8b4513]/10 rounded-xl p-4 text-left space-y-2">
              <div className="flex justify-between text-xs font-bold text-[#4b2c20]">
                <span>Production Rate:</span>
                <span className="font-mono text-[#059669]">{productionRate} Gold / min</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-[#4b2c20]">
                <span>Passive Income:</span>
                <span className="font-mono">{((12 * mineLevel) / 60).toFixed(2)} Gold / sec</span>
              </div>
              <div className="flex justify-between text-xs font-black text-[#4b2c20] border-t border-[#8b4513]/10 pt-2">
                <span>Uncollected Resources:</span>
                <span className="font-mono text-[#b8860b]">
                  {Math.floor(mineResources)}g <span className="text-[10px] text-gray-500 font-normal">({mineResources.toFixed(2)}g total)</span>
                </span>
              </div>
            </div>
            <p className="text-[10px] italic text-[#5d4037]/50 font-serif">
              "The pickaxes never rest. Your vault's wealth grows with every strike."
            </p>
          </div>
        </Modal>
      </div>
    </div>
  );
}

export default App;
```

### C. Map component: `client/src/components/IsometricMap.jsx`
Determina a reatividade visual sobre o mapa panorâmico e ativa exclusivamente a Mina de Ouro:

```javascript
import React from 'react';

const HitZone = ({ onClick, style, label, disabled = true }) => (
  <div 
    onClick={!disabled ? onClick : undefined}
    className={`absolute transition-all rounded-xl z-50 group border border-transparent ${
      disabled 
        ? 'cursor-not-allowed hover:bg-white/5 hover:border-white/10' 
        : 'cursor-pointer hover:bg-white/10 hover:border-white/20 hover:scale-[1.02] active:scale-95'
    }`}
    style={style}
  >
    {/* Tooltip */}
    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/90 text-[#ffd700] text-[10px] px-3 py-1 rounded-md opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-all border border-[#d4af37]/30 shadow-xl title-font uppercase tracking-widest z-[100]">
       {label} {disabled ? '(Under Construction)' : ''}
    </div>
  </div>
);

const IsometricMap = ({ onMineClick }) => {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* 1. Gold Mine (Active) */}
      <HitZone 
        label="Gold Mine"
        onClick={onMineClick}
        disabled={false}
        style={{ top: '22%', left: '8%', width: '18%', height: '22%' }}
      />

      {/* 2. Treasury (Disabled) */}
      <HitZone 
        label="Royal Treasury"
        disabled={true}
        style={{ top: '48%', left: '12%', width: '32%', height: '38%' }}
      />

      {/* 3. Market (Disabled) */}
      <HitZone 
        label="Central Market"
        disabled={true}
        style={{ top: '42%', left: '60%', width: '25%', height: '25%' }}
      />

      {/* 4. Town Hall (Disabled) */}
      <HitZone 
        label="Town Hall"
        disabled={true}
        style={{ top: '12%', left: '66%', width: '18%', height: '24%' }}
      />

      {/* 5. Housing (Disabled) */}
      <HitZone 
        label="Village Housing"
        disabled={true}
        style={{ top: '18%', left: '84%', width: '14%', height: '18%' }}
      />

      {/* 6. Bounties (Disabled) */}
      <HitZone 
        label="Tributes"
        disabled={true}
        style={{ top: '65%', left: '78%', width: '14%', height: '22%' }}
      />

      {/* 7. Tavern (Disabled) */}
      <HitZone 
        label="The Tavern"
        disabled={true}
        style={{ top: '35%', left: '46%', width: '15%', height: '18%' }}
      />
    </div>
  );
};

export default IsometricMap;
```
