import React, { useState } from 'react';
import CashFlowChart from '../dashboard/CashFlowChart';
import NetWorthChart from '../dashboard/NetWorthChart';
import AssetAllocationChart from '../dashboard/AssetAllocationChart';

// 1. Core Proof-of-Concept Staging Widget
const TestCard = () => (
  <div className="flex items-center justify-center h-48 w-full bg-stone-900 border border-amber-900/40 rounded-lg p-6 shadow-xl">
    <div className="text-center">
      <p className="text-amber-500 font-serif text-lg font-semibold tracking-wider">
        Sandbox Widget Active
      </p>
      <p className="text-stone-400 text-xs mt-2 font-mono">
        ID: test_card | Rendering Verification Successful
      </p>
    </div>
  </div>
);

// 2. High-Fidelity Interactive Mana Regulator Widget
const ManaRegulator = () => {
  const [level, setLevel] = useState(74);
  return (
    <div className="bg-stone-900 border border-amber-900/40 rounded-lg p-5 shadow-2xl w-full max-w-sm">
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-serif text-amber-500 text-sm font-semibold uppercase tracking-wider">
          Aetheric Flux
        </h4>
        <span className="text-[10px] font-mono bg-amber-950/60 text-amber-300 border border-amber-800/50 px-2 py-0.5 rounded">
          STABLE
        </span>
      </div>
      <div className="relative pt-1">
        <div className="flex mb-2 items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold inline-block py-1 px-2 uppercase rounded-full text-amber-200 bg-amber-900/20">
              Mana Core Pressure
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs font-mono font-semibold text-amber-400">
              {level}%
            </span>
          </div>
        </div>
        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-stone-950 border border-stone-800">
          <div
            style={{ width: `${level}%` }}
            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-amber-600 transition-all duration-500"
          />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <button
          onClick={() => setLevel(Math.max(0, level - 10))}
          className="px-2.5 py-1 text-xs font-mono bg-stone-950 border border-amber-950 text-stone-400 hover:text-amber-200 hover:border-amber-700 rounded transition"
        >
          VENT
        </button>
        <button
          onClick={() => setLevel(Math.min(100, level + 10))}
          className="px-2.5 py-1 text-xs font-mono bg-amber-950/40 border border-amber-800/40 text-amber-200 hover:bg-amber-900/50 rounded transition"
        >
          CHARGE
        </button>
      </div>
    </div>
  );
};

// 3. High-Fidelity Runic Decree Staging Widget
const DecreeWidget = () => (
  <div className="bg-stone-900 border border-amber-900/40 rounded-lg p-5 shadow-2xl w-full max-w-md">
    <h4 className="font-serif text-amber-500 text-sm font-semibold uppercase tracking-wider mb-3 border-b border-amber-950 pb-2">
      Royal Decree
    </h4>
    <p className="text-stone-300 text-xs leading-relaxed italic font-serif">
      "Let it be known across Eldoria that the sandbox staging grounds are now fully operational. Ensure your interfaces scale elegantly across all viewport shapes."
    </p>
    <div className="mt-4 flex items-center justify-between text-[10px] text-stone-500 font-mono">
      <span>Signee: Grand Architect</span>
      <span>12th of Solis</span>
    </div>
  </div>
);

export const SANDBOX_WIDGETS = {
  test_card: {
    name: "Default Test Card",
    component: TestCard,
    description: "Confirms viewport and basic box configuration options.",
    category: "system",
    layout: { w: 4, h: 2, minW: 2, maxW: 6, minH: 1, maxH: 4 }
  },
  mana_regulator: {
    name: "Aetheric Flux Regulator",
    component: ManaRegulator,
    description: "An interactive tracker monitoring mana engine capacities.",
    category: "system",
    layout: { w: 3, h: 3, minW: 2, maxW: 4, minH: 2, maxH: 4 }
  },
  decree_widget: {
    name: "Royal Decree Bulletin",
    component: DecreeWidget,
    description: "Text-based layout containing historical scrolls.",
    category: "system",
    layout: { w: 4, h: 3, minW: 2, maxW: 6, minH: 2, maxH: 5 }
  },
  cash_flow_chart: {
    name: "Income vs Expenses",
    component: CashFlowChart,
    description: "Displays the historical evolution of all Income vs Expenses.",
    category: "chart",
    layout: { w: 5, h: 3, minW: 3, maxW: 12, minH: 2, maxH: 6 }
  },
  net_worth_chart: {
    name: "Net Worth Trend",
    component: NetWorthChart,
    description: "Displays accumulated sovereign reserves held in vaults.",
    category: "overview",
    layout: { w: 5, h: 3, minW: 3, maxW: 12, minH: 2, maxH: 6 }
  },
  asset_allocation_chart: {
    name: "Net Worth Trend",
    component: AssetAllocationChart,
    description: "Assets - Liabilities",
    category: "ledger",
    layout: { w: 3, h: 3, minW: 2, maxW: 6, minH: 2, maxH: 6 }
  }
};