import React, { useEffect } from 'react';
import { useKingdomStore } from '../../store/useKingdomStore';
import { 
  Coins, 
  Shield, 
  Sparkles, 
  Activity, 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  TrendingDown, 
  LineChart 
} from 'lucide-react';

export default function DashboardSandbox() {
  // =========================================================================
  // 1. STATE & STORE CONNECTIONS
  // =========================================================================
  const { 
    dashboardMetrics, 
    fetchDashboardMetrics 
  } = useKingdomStore();

  // =========================================================================
  // 2. INITIALIZATION
  // =========================================================================
  useEffect(() => {
    fetchDashboardMetrics();
  }, [fetchDashboardMetrics]);

  return (
    // Outer Void Layout Constraint
    <div className="w-full h-dvh bg-black flex justify-center items-center overflow-hidden">
      
      {/* Centered Inner Canvas Wrapper */}
      <div className="relative w-full max-w-7xl h-full mx-auto p-6 flex flex-col bg-stone-950 text-stone-100 overflow-hidden">
        
        {/* Decorative Scriptorium Header block */}
        <header className="shrink-0 flex justify-between items-center border-b border-amber-900/30 pb-3 mb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl" role="img" aria-label="castle">🏰</span>
            <div>
              <h2 className="text-sm font-bold text-amber-400 uppercase tracking-widest font-serif">
                Eldoria V2.0 Pure Analytics
              </h2>
              <p className="text-[9px] text-stone-500 font-mono">
                REAL-TIME SERVER AGGREGATIONS
              </p>
            </div>
          </div>
          <div className="text-[10px] bg-stone-900 border border-amber-900/30 px-3 py-1 rounded text-stone-400 font-mono uppercase tracking-wider">
            Analytics Node Active
          </div>
        </header>

        {/* =========================================================================
            HUD METRICS BANNER
            ========================================================================= */}
        <section className="shrink-0 grid grid-cols-4 gap-4 bg-stone-900/50 border-2 border-amber-900/50 p-4 rounded-lg">
          
          {/* Total Assets Card */}
          <div className="flex items-center gap-3 bg-stone-950/60 border border-amber-900/20 p-3 rounded">
            <div className="p-2 bg-emerald-950/30 border border-emerald-900/40 rounded">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-stone-400 text-xs uppercase tracking-wider">Total Assets</span>
              <span className="font-mono text-amber-400 text-2xl font-semibold mt-0.5">
                {Number(dashboardMetrics?.total_assets || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}g
              </span>
            </div>
          </div>

          {/* Total Liabilities Card */}
          <div className="flex items-center gap-3 bg-stone-950/60 border border-amber-900/20 p-3 rounded">
            <div className="p-2 bg-rose-950/30 border border-rose-900/40 rounded">
              <TrendingDown className="w-5 h-5 text-rose-500" />
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-stone-400 text-xs uppercase tracking-wider">Total Liabilities</span>
              <span className="font-mono text-amber-400 text-2xl font-semibold mt-0.5">
                {Number(dashboardMetrics?.total_liabilities || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}g
              </span>
            </div>
          </div>

          {/* Net Worth Card */}
          <div className="flex items-center gap-3 bg-stone-950/60 border border-amber-900/20 p-3 rounded">
            <div className="p-2 bg-blue-950/30 border border-blue-900/40 rounded">
              <LineChart className="w-5 h-5 text-blue-400" />
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-stone-400 text-xs uppercase tracking-wider">Net Worth</span>
              <span className="font-mono text-amber-400 text-2xl font-semibold mt-0.5">
                {Number(dashboardMetrics?.net_worth || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}g
              </span>
            </div>
          </div>

          {/* Net Vault Cash Card */}
          <div className="flex items-center gap-3 bg-stone-950/60 border border-amber-900/20 p-3 rounded">
            <div className="p-2 bg-amber-950/30 border border-amber-900/40 rounded">
              <Coins className="w-5 h-5 text-amber-500" />
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-stone-400 text-xs uppercase tracking-wider">Net Vault Cash</span>
              <span className="font-mono text-amber-400 text-2xl font-semibold mt-0.5">
                {Number(dashboardMetrics?.net_vault_cash || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}g
              </span>
            </div>
          </div>

        </section>

        {/* =========================================================================
            THE ANALYTICS GRID
            ========================================================================= */}
        <section className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 grid-rows-2 gap-6 mt-6 overflow-hidden">
          
          {/* Main Chart Placeholder (Top Row) */}
          <div className="col-span-1 lg:col-span-12 row-span-1 bg-stone-900/40 border border-amber-900/30 rounded-lg p-4 flex flex-col items-center justify-center text-stone-500 gap-3">
            <Activity className="w-10 h-10 text-amber-900/60 animate-pulse" />
            <h4 className="font-serif text-stone-300 text-sm tracking-wider uppercase">
              Net Worth Timeline Chart Placeholder
            </h4>
            <p className="text-[10px] text-stone-500 font-mono text-center max-w-sm">
              Server-side trend logs for evaluating portfolio trajectory relative to double-entry debt parameters.
            </p>
          </div>

          {/* Secondary Chart Placeholder (Bottom Left) */}
          <div className="col-span-1 lg:col-span-6 row-span-1 bg-stone-900/40 border border-amber-900/30 rounded-lg p-4 flex flex-col items-center justify-center text-stone-500 gap-3">
            <BarChart3 className="w-8 h-8 text-amber-900/60" />
            <h4 className="font-serif text-stone-300 text-xs tracking-wider uppercase">
              Cash Flow (Income vs Expense) Placeholder
            </h4>
            <p className="text-[10px] text-stone-500 font-mono text-center max-w-xs">
              Inflows against outflows timeline analysis generated via system ledger processes.
            </p>
          </div>

          {/* Tertiary Chart Placeholder (Bottom Right) */}
          <div className="col-span-1 lg:col-span-6 row-span-1 bg-stone-900/40 border border-amber-900/30 rounded-lg p-4 flex flex-col items-center justify-center text-stone-500 gap-3">
            <PieChart className="w-8 h-8 text-amber-900/60" />
            <h4 className="font-serif text-stone-300 text-xs tracking-wider uppercase">
              Asset Allocation Placeholder
            </h4>
            <p className="text-[10px] text-stone-500 font-mono text-center max-w-xs">
              Portfolio split comparing internal checking accounts, sinking funds, and currency vaults.
            </p>
          </div>

        </section>

      </div>
    </div>
  );
}