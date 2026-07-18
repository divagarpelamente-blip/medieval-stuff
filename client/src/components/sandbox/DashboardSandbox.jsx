import React, { useEffect } from 'react';
import useKingdomStore from '../../store/useKingdomStore';
import { 
  Coins, 
  TrendingUp, 
  TrendingDown, 
  LineChart 
} from 'lucide-react';

// Relative path imports for our new visual widgets
import NetWorthChart from '../dashboard/NetWorthChart';
import CashFlowChart from '../dashboard/CashFlowChart';
import AssetAllocationChart from '../dashboard/AssetAllocationChart';

export default function DashboardSandbox() {
  // =========================================================================
  // 1. STATE & STORE CONNECTIONS
  // =========================================================================
  const { 
    dashboardMetrics, 
    fetchDashboardMetrics,
    fetchTransactions
  } = useKingdomStore();

  // =========================================================================
  // 2. INITIALIZATION
  // =========================================================================
  useEffect(() => {
    // Fire parallel requests to sync metrics and ledger entries from Supabase
    fetchDashboardMetrics();
    fetchTransactions(100, 0); // Load initial batch of 100 historical transactions
  }, [fetchDashboardMetrics, fetchTransactions]);

  return (
    // Outer Void Layout Constraint (Strict Viewport Lock)
    <div className="w-full h-dvh bg-black flex justify-center items-center overflow-hidden">
      
      {/* Centered Inner Canvas Wrapper */}
      <div className="relative w-full max-w-7xl h-full mx-auto p-6 flex flex-col bg-stone-950 text-stone-100 overflow-hidden">
        
        {/* Decorative Scriptorium Header block */}
        <header className="shrink-0 flex justify-between items-center border-b border-amber-900/30 pb-3 mb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl" role="img" aria-label="castle">🏰</span>
            <div>
              <h2 className="text-sm font-bold text-amber-400 uppercase tracking-widest font-serif">
                Eldoria V2.1 Pure Analytics
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
        <section className="shrink-0 grid grid-cols-2 md:grid-cols-4 gap-4 bg-stone-900/50 border-2 border-amber-900/50 p-4 rounded-lg">
          
          {/* Total Assets Card */}
          <div className="flex items-center gap-3 bg-stone-950/60 border border-amber-900/20 p-3 rounded">
            <div className="p-2 bg-emerald-950/30 border border-emerald-900/40 rounded shrink-0">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-serif text-stone-400 text-xs uppercase tracking-wider truncate">Total Assets</span>
              <span className="font-mono text-amber-400 text-xl lg:text-2xl font-bold mt-0.5 truncate">
                {Number(dashboardMetrics?.total_assets || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}g
              </span>
            </div>
          </div>

          {/* Total Liabilities Card */}
          <div className="flex items-center gap-3 bg-stone-950/60 border border-amber-900/20 p-3 rounded">
            <div className="p-2 bg-rose-950/30 border border-rose-900/40 rounded shrink-0">
              <TrendingDown className="w-5 h-5 text-rose-500" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-serif text-stone-400 text-xs uppercase tracking-wider truncate">Total Liabilities</span>
              <span className="font-mono text-amber-400 text-xl lg:text-2xl font-bold mt-0.5 truncate">
                {Number(dashboardMetrics?.total_liabilities || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}g
              </span>
            </div>
          </div>

          {/* Net Worth Card */}
          <div className="flex items-center gap-3 bg-stone-950/60 border border-amber-900/20 p-3 rounded">
            <div className="p-2 bg-blue-950/30 border border-blue-900/40 rounded shrink-0">
              <LineChart className="w-5 h-5 text-blue-400" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-serif text-stone-400 text-xs uppercase tracking-wider truncate">Net Worth</span>
              <span className="font-mono text-amber-400 text-xl lg:text-2xl font-bold mt-0.5 truncate">
                {Number(dashboardMetrics?.net_worth || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}g
              </span>
            </div>
          </div>

          {/* Net Vault Cash Card */}
          <div className="flex items-center gap-3 bg-stone-950/60 border border-amber-900/20 p-3 rounded">
            <div className="p-2 bg-amber-950/30 border border-amber-900/40 rounded shrink-0">
              <Coins className="w-5 h-5 text-amber-500" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-serif text-stone-400 text-xs uppercase tracking-wider truncate">Net Vault Cash</span>
              <span className="font-mono text-amber-400 text-xl lg:text-2xl font-bold mt-0.5 truncate">
                {Number(dashboardMetrics?.net_vault_cash || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}g
              </span>
            </div>
          </div>

        </section>

        {/* =========================================================================
            THE ANALYTICS GRID
            ========================================================================= */}
        <section className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 grid-rows-2 gap-6 mt-6 overflow-hidden">
          
          {/* Main Net Worth Trend Chart (Top Row) */}
          <div className="col-span-1 lg:col-span-12 row-span-1 min-h-0">
            <NetWorthChart />
          </div>

          {/* Cash Flow Timeline Chart (Bottom Left) */}
          <div className="col-span-1 lg:col-span-6 row-span-1 min-h-0">
            <CashFlowChart />
          </div>

          {/* Asset Allocation Pie/Donut Chart (Bottom Right) */}
          <div className="col-span-1 lg:col-span-6 row-span-1 min-h-0">
            <AssetAllocationChart />
          </div>

        </section>

      </div>
    </div>
  );
}