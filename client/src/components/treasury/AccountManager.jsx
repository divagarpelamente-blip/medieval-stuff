import React, { useState, useEffect } from 'react';
import { Wallet, TrendingUp, TrendingDown, Plus, CreditCard, Shield, Flame, Heart, Sword, Map, Target, AlertTriangle, ArrowLeft, X, Filter, Key } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'react-hot-toast';
import Modal from '../Modal';
import SpawnMonsterForm from './SpawnMonsterForm';
import { StatBox, SmallStatCard } from './StatCard';
import { DragonCard } from './DragonCard';
import { SavingsNeedle, CashFlowChart, PenaltiesDoughnut, WaterfallChart } from './TreasuryCharts';

const LoaderCircle = ({ className, size }) => (
  <svg 
    className={className} 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

const AccountManager = ({ userId, onRefresh, profile, onBack }) => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [strikeTarget, setStrikeTarget] = useState(null);
  const [detailAccount, setDetailAccount] = useState(null);
  const [viewingRecords, setViewingRecords] = useState(null);
  const [strikeAmount, setStrikeAmount] = useState('100');
  const [isStriking, setIsStriking] = useState(false);
  const [activeTabSection, setActiveTabSection] = useState('financial');
  const [showSpawnModal, setShowSpawnModal] = useState(false);

  // Financial aggregates
  const [financials, setFinancials] = useState({
    inflow: 0,
    outflow: 0,
    savingsRate: 0,
    interests: 0,
    lateFees: 0,
    penalties: 0,
    tax: 0,
    losses: 0,
    baseExpenses: 0,
    netSavings: 0,
    totalIncomeCash: 0,
    otherEarningsCredit: 0,
    totalExpenses: 0,
    totalPaymentsCash: 0,
    otherPaymentsCredit: 0,
    balance: 0
  });

  const [monthlyFlows, setMonthlyFlows] = useState([]);

  useEffect(() => {
    if (userId) {
      fetchAccounts();
      fetchDashboardData();
    }
  }, [userId]);

  const fetchDashboardData = async () => {
    try {
      const { data, error } = await supabase
        .from('treasury_records')
        .select('*')
        .eq('profile_id', userId);
      
      if (error) throw error;
      const allRecords = data || [];
      setRecords(allRecords);

      // Calculations
      const inflow = allRecords
        .filter(r => ['Income', 'Earning'].includes(r.transaction_type))
        .reduce((sum, r) => sum + (Number(r.payment_receipt_cash) || 0), 0);

      const interests = allRecords.reduce((sum, r) => sum + (Number(r.interests) || 0), 0);
      const lateFees = allRecords.reduce((sum, r) => sum + (Number(r.late_fee_interests) || 0), 0);
      const penalties = allRecords.reduce((sum, r) => sum + (Number(r.penalties) || 0), 0);
      const tax = allRecords.reduce((sum, r) => sum + (Number(r.tax) || 0), 0);
      const losses = allRecords.reduce((sum, r) => sum + (Number(r.losses) || 0), 0);
      const baseExpenses = allRecords
        .filter(r => ['Expense', 'Payment'].includes(r.transaction_type))
        .reduce((sum, r) => sum + (Number(r.expense_amount) || 0), 0);

      const totalFines = interests + lateFees + penalties + tax + losses;
      const outflow = baseExpenses + totalFines;
      const netSavings = inflow - outflow;
      const savingsRate = inflow > 0 ? Math.max(-100, Math.min(100, (netSavings / inflow) * 100)) : 0;

      // New specific card calculations
      const totalIncomeCash = allRecords
        .filter(r => ['Income', 'Earning'].includes(r.transaction_type) && r.paid_with === 'Debit')
        .reduce((sum, r) => sum + (Number(r.payment_receipt_cash) || 0), 0);

      const otherEarningsCredit = allRecords
        .filter(r => ['Income', 'Earning'].includes(r.transaction_type) && r.paid_with === 'Credit')
        .reduce((sum, r) => sum + (Number(r.payment_receipt_cash) || 0), 0);

      const totalExpenses = allRecords
        .filter(r => r.transaction_type === 'Expense')
        .reduce((sum, r) => sum + (Number(r.expense_amount) || 0), 0) + totalFines;

      const totalPaymentsCash = allRecords
        .filter(r => r.transaction_type === 'Payment' && r.paid_with === 'Debit')
        .reduce((sum, r) => sum + (Number(r.expense_amount) || 0), 0);

      const otherPaymentsCredit = allRecords
        .filter(r => r.transaction_type === 'Payment' && r.paid_with === 'Credit')
        .reduce((sum, r) => sum + (Number(r.expense_amount) || 0), 0);

      // Balance: Cash In (Debit) - Cash Out (Debit)
      const cashIn = totalIncomeCash;
      const cashOut = allRecords
        .filter(r => ['Expense', 'Payment'].includes(r.transaction_type) && r.paid_with === 'Debit')
        .reduce((sum, r) => sum + (Number(r.expense_amount) || 0), 0) +
        allRecords
          .filter(r => r.paid_with === 'Debit')
          .reduce((sum, r) => sum + (Number(r.interests) || 0) + (Number(r.late_fee_interests) || 0) + (Number(r.penalties) || 0) + (Number(r.tax) || 0) + (Number(r.losses) || 0), 0);
      const balance = cashIn - cashOut;

      setFinancials({
        inflow,
        outflow,
        savingsRate,
        interests,
        lateFees,
        penalties,
        tax,
        losses,
        baseExpenses,
        netSavings,
        totalIncomeCash,
        otherEarningsCredit,
        totalExpenses,
        totalPaymentsCash,
        otherPaymentsCredit,
        balance
      });

      // Group by Month (Chronological order, last 6 months)
      const monthMap = {};
      allRecords.forEach(r => {
        const key = `${r.year}-${r.month}`;
        if (!monthMap[key]) {
          monthMap[key] = { label: r.month, sortKey: key, inflow: 0, outflow: 0 };
        }
        if (['Income', 'Earning'].includes(r.transaction_type)) {
          monthMap[key].inflow += Number(r.payment_receipt_cash) || 0;
        } else {
          monthMap[key].outflow += (Number(r.expense_amount) || 0) + (Number(r.interests || 0) + Number(r.late_fee_interests || 0) + Number(r.penalties || 0) + Number(r.tax || 0) + Number(r.losses || 0));
        }
      });

      const sortedFlows = Object.values(monthMap)
        .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
        .slice(-6); // last 6 months

      setMonthlyFlows(sortedFlows);

    } catch (err) {
      console.error('Dashboard calculation error:', err);
    }
  };

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('monster_card_stats')
        .select('*')
        .eq('profile_id', userId);

      if (error) throw error;
      setAccounts(data || []);
    } catch (err) {
      console.error('Error fetching accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStrike = (account) => {
    setStrikeTarget(account);
    setStrikeAmount('100');
  };

  const confirmStrike = async () => {
    if (!strikeAmount || isNaN(strikeAmount)) return;
    const payment = parseFloat(strikeAmount);
    if (payment <= 0) return;

    setIsStriking(true);
    try {
      const { error } = await supabase.rpc('strike_monster', {
        p_account_id: strikeTarget.id,
        p_profile_id: userId,
        p_payment: payment,
        p_account_name: strikeTarget.name,
        p_month: new Date().toLocaleString('default', { month: 'long' }),
        p_year: new Date().getFullYear().toString()
      });
      
      if (error) throw error;

      toast.success(`${strikeTarget.name} has taken ${payment} damage!`);
      fetchAccounts();
      fetchDashboardData();
      if (onRefresh) onRefresh();
      setStrikeTarget(null);
    } catch (err) {
      console.error('Combat error:', err);
      toast.error('Failed to deal damage: ' + err.message);
    } finally {
      setIsStriking(false);
    }
  };

  const totalDebt = accounts.reduce((sum, acc) => sum + (acc.health_left || 0), 0);

  return (
    <div className="flex flex-col md:flex-row gap-8 w-full h-full text-[#2d1e1e] overflow-hidden">
      {/* LEFT COLUMN: Sidebar (width: ~28%) */}
      <div className="w-full md:w-[28%] flex flex-col justify-between py-2 border-r border-[#4b2c20]/10 pr-6 flex-shrink-0">
        <div className="space-y-3.5">
          {/* Back/Exit Button */}
          <button 
            onClick={onBack}
            className="flex items-center gap-2 title-font text-[#2d1e1e] font-black uppercase text-sm tracking-widest hover:scale-105 transition-transform"
          >
            <ArrowLeft size={20} />
            Back to Menu
          </button>

          {/* Global Vault stats (Gold & Monsters) */}
          <div className="grid grid-cols-2 gap-2 text-[#4b2c20] mb-1">
            <div className="bg-white/40 border border-[#4b2c20]/15 rounded-xl px-2.5 py-1.5 flex items-center gap-1.5 shadow-sm">
              <span className="text-base flex-shrink-0">💰</span>
              <div className="min-w-0">
                <p className="text-[7px] font-black uppercase tracking-widest opacity-60">Gold Wealth</p>
                <p className="text-[10px] font-black leading-none mt-0.5">${Math.floor(profile?.gold || 0).toLocaleString()}</p>
              </div>
            </div>
            <div className="bg-white/40 border border-[#4b2c20]/15 rounded-xl px-2.5 py-1.5 flex items-center gap-1.5 shadow-sm">
              <span className="text-base flex-shrink-0">👾</span>
              <div className="min-w-0">
                <p className="text-[7px] font-black uppercase tracking-widest opacity-60">Monsters</p>
                <p className="text-[10px] font-black leading-none mt-0.5">{accounts.length}</p>
              </div>
            </div>
          </div>

          {/* Smaller Ledger Stats Cards */}
          <div className="space-y-2">
            <SmallStatCard 
              label="Total Income (Cash)" 
              value={financials.totalIncomeCash} 
              icon={<TrendingUp size={14} className="text-emerald-700" />} 
              typeColor="emerald" 
            />
            <SmallStatCard 
              label="Other Earnings (Credit)" 
              value={financials.otherEarningsCredit} 
              icon={<CreditCard size={14} className="text-teal-700" />} 
              typeColor="teal" 
            />
            <SmallStatCard 
              label="Total Expenses" 
              value={financials.totalExpenses} 
              icon={<TrendingDown size={14} className="text-red-700" />} 
              typeColor="red" 
            />
            <SmallStatCard 
              label="Total Payments (Cash)" 
              value={financials.totalPaymentsCash} 
              icon={<Wallet size={14} className="text-rose-700" />} 
              typeColor="rose" 
            />
            <SmallStatCard 
              label="Other Payments (Credit)" 
              value={financials.otherPaymentsCredit} 
              icon={<CreditCard size={14} className="text-purple-700" />} 
              typeColor="purple" 
            />
            <SmallStatCard 
              label="Cash Balance" 
              value={financials.balance} 
              icon={<Shield size={14} className="text-amber-700" />} 
              typeColor="gold" 
            />
          </div>
        </div>

        {/* Bottom Link */}
        <div className="mt-auto pt-4 border-t border-[#4b2c20]/10">
          <span 
            className="text-[10px] font-black uppercase tracking-[0.2em] text-[#4b2c20]/70 hover:text-[#4b2c20] cursor-pointer transition-colors underline decoration-[#4b2c20]/30"
            onClick={() => toast.success('Your gold ledger remains secure, Sire.')}
          >
            Global Insights
          </span>
        </div>
      </div>

      {/* RIGHT COLUMN: Tabbed Card Panel (width: ~72%) */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative pt-10">
        {/* Tabs sticking out above the content card */}
        <div className="flex gap-1 absolute top-[8px] left-0 z-10">
          <button 
            onClick={() => setActiveTabSection('financial')}
            className={`px-6 py-2.5 rounded-t-2xl font-black uppercase text-[10px] tracking-widest border-t-2 border-x-2 border-[#4b2c20]/20 transition-all ${
              activeTabSection === 'financial' 
                ? 'bg-[#faf4e5] text-[#4b2c20] border-[#4b2c20]/25 z-10 font-black' 
                : 'bg-[#e2d4b9] text-[#4b2c20]/50 border-[#4b2c20]/15 hover:bg-[#e8dcbf]'
            }`}
          >
            Financial Health
          </button>
          <button 
            onClick={() => setActiveTabSection('monsters')}
            className={`px-6 py-2.5 rounded-t-2xl font-black uppercase text-[10px] tracking-widest border-t-2 border-x-2 border-[#4b2c20]/20 transition-all ${
              activeTabSection === 'monsters' 
                ? 'bg-[#faf4e5] text-[#4b2c20] border-[#4b2c20]/25 z-10 font-black' 
                : 'bg-[#e2d4b9] text-[#4b2c20]/50 border-[#4b2c20]/15 hover:bg-[#e8dcbf]'
            }`}
          >
            Monsters & Pledges
          </button>
        </div>

        {/* Tab Content Box */}
        <div className={`flex-1 bg-[#faf4e5]/90 border-2 border-[#4b2c20]/25 rounded-2xl p-5 flex flex-col overflow-hidden shadow-inner z-0 ${
          activeTabSection === 'financial' ? 'rounded-tl-none' : ''
        }`}>
          {activeTabSection === 'financial' ? (
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6">
              
              {/* TRUE SAVINGS RATE SECTION */}
              <div className="border-b border-[#4b2c20]/10 pb-5">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="title-font text-xs font-black uppercase tracking-widest text-[#4b2c20] flex items-center gap-1.5">
                    True Savings Rate
                  </h4>
                  {/* Filter Pills */}
                  <div className="flex items-center gap-1.5 text-[9px] font-black uppercase text-[#4b2c20]/75">
                    <Filter size={10} />
                    <span className="bg-[#4b2c20]/10 px-2 py-0.5 rounded">this month</span>
                    <span className="bg-[#4b2c20]/5 px-2 py-0.5 rounded text-[#4b2c20]/40">last quarter</span>
                  </div>
                </div>

                <div className="grid grid-cols-[140px_1fr_120px] items-center gap-6">
                  {/* Gauge */}
                  <div>
                    <SavingsNeedle rate={financials.savingsRate} />
                  </div>
                  {/* Stats Info */}
                  <div className="space-y-1">
                    <p className="text-[10px] text-stone-500 uppercase tracking-wider font-extrabold">Current Savings Rate:</p>
                    <h2 className="title-font text-3xl font-black text-[#2d1e1e]">{financials.savingsRate.toFixed(0)}%</h2>
                    <p className="text-[10px] text-stone-600 italic">
                      {financials.savingsRate > 50 ? 'A strong surplus this month.' : 
                       financials.savingsRate > 0 ? 'A surplus this month.' : 'Running a deficit!'}
                    </p>
                    <p className="text-[9px] font-bold text-emerald-800 flex items-center gap-0.5">
                      Compared to last month: ↗ +12%
                    </p>
                  </div>
                  {/* Shield & Key Graphic */}
                  <div className="flex justify-end">
                    <svg viewBox="0 0 100 100" className="w-20 h-20 text-stone-400/60">
                      <path d="M20 20 C20 20, 50 10, 50 10 C50 10, 80 20, 80 20 C80 50, 50 85, 50 85 C50 85, 20 50, 20 20 Z" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="65" cy="55" r="10" fill="none" stroke="currentColor" strokeWidth="2.5" />
                      <line x1="57" y1="63" x2="40" y2="80" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                      <line x1="45" y1="75" x2="49" y2="79" stroke="currentColor" strokeWidth="2.5" />
                      <line x1="41" y1="71" x2="45" y2="75" stroke="currentColor" strokeWidth="2.5" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* MONTHLY NET CASH FLOW TRENDS SECTION */}
              <div className="border-b border-[#4b2c20]/10 pb-5">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="title-font text-xs font-black uppercase tracking-widest text-[#4b2c20]">
                    Monthly Net Cash Flow Trends
                  </h4>
                  <div className="flex items-center gap-1.5 text-[9px] font-black uppercase text-[#4b2c20]/75">
                    <Filter size={10} />
                    <span className="bg-[#4b2c20]/10 px-2 py-0.5 rounded">this month</span>
                    <span className="bg-[#4b2c20]/5 px-2 py-0.5 rounded text-[#4b2c20]/40">last quarter</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[1fr_180px] gap-6 items-center">
                  <div>
                    <CashFlowChart monthlyFlows={monthlyFlows} />
                  </div>
                  {/* Legend list */}
                  <div className="space-y-1.5 border-l border-[#4b2c20]/10 pl-4">
                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-[#2d1e1e]/80">
                      <span className="w-2.5 h-2.5 bg-[#0d4a36] rounded-sm" />
                      <span>Salaries</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-[#2d1e1e]/80">
                      <span className="w-2.5 h-2.5 bg-[#20634a] rounded-sm" />
                      <span>Quest Rewards</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-[#2d1e1e]/80">
                      <span className="w-2.5 h-2.5 bg-[#387e63] rounded-sm" />
                      <span>Income</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-[#2d1e1e]/80">
                      <span className="w-2.5 h-2.5 bg-[#6e2222] rounded-sm" />
                      <span>Payments Cash</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-[#2d1e1e]/80">
                      <span className="w-2.5 h-2.5 bg-[#8b3232] rounded-sm" />
                      <span>Payments Credit</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-[#2d1e1e]/80">
                      <span className="w-2.5 h-2.5 bg-[#a64b4b] rounded-sm" />
                      <span>Taxes</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-[#2d1e1e]/80">
                      <span className="w-4 h-0.5 bg-[#4b2c20]" />
                      <span>Net Flow</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* BOTTOM CHARTS GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                
                {/* Penalties & Losses breakdown */}
                <div className="space-y-3">
                  <h4 className="title-font text-xs font-black uppercase tracking-widest text-[#4b2c20]">
                    Penalties & Losses Breakdown
                  </h4>
                  <div className="grid grid-cols-[110px_1fr] gap-4 items-center">
                    <div>
                      <PenaltiesDoughnut financials={financials} />
                    </div>
                    {/* Top Offenders list */}
                    <div className="space-y-1.5">
                      <p className="text-[9px] font-black uppercase tracking-widest text-[#4b2c20]/60">Top Offenders</p>
                      <ol className="text-[9px] space-y-1 text-stone-700 font-bold">
                        <li className="list-decimal list-inside">Dragon Loan <span className="text-[#8b0000]">$225 in Penalties</span></li>
                        <li className="list-decimal list-inside">Credit Card <span className="text-[#8b0000]">$120 in Fees</span></li>
                        <li className="list-decimal list-inside">Transport Tax <span className="text-[#8b0000]">$45</span></li>
                      </ol>
                    </div>
                  </div>
                </div>

                {/* Expense progression */}
                <div className="space-y-3">
                  <h4 className="title-font text-xs font-black uppercase tracking-widest text-[#4b2c20]">
                    Expense Type Progression
                  </h4>
                  <div>
                    <WaterfallChart financials={financials} />
                  </div>
                </div>

              </div>

            </div>
          ) : (
            /* MONSTERS & PLEDGES TAB */
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex justify-between items-center mb-4 border-b border-[#4b2c20]/10 pb-3 flex-shrink-0">
                <div>
                  <h3 className="title-font text-lg font-black uppercase tracking-widest text-[#4b2c20] flex items-center gap-2">
                    <Flame className="text-red-850" size={22} fill="currentColor" />
                    The Monsters Lair
                  </h3>
                  <p className="text-[10px] text-stone-600 italic">"Each beast represents a weight on the crown's soul."</p>
                </div>
                <button 
                  onClick={() => setShowSpawnModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-md"
                >
                  <Plus size={12} /> Spawn New Monster
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 grid grid-cols-1 lg:grid-cols-2 gap-4 auto-rows-max pb-4">
                {loading ? (
                  <div className="col-span-full text-center py-20 italic text-[#2d1e1e]/40 flex flex-col items-center justify-center gap-4">
                    <LoaderCircle className="animate-spin text-[#4b2c20]" size={36} />
                    <p>Auditing the monster's lair...</p>
                  </div>
                ) : accounts.length === 0 ? (
                  <div className="col-span-full border-4 border-dashed border-[#2d1e1e]/15 rounded-[40px] p-12 text-center space-y-6 my-4">
                    <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto text-emerald-700">
                      <Shield size={36} />
                    </div>
                    <div className="space-y-2">
                      <h4 className="title-font text-lg font-black text-[#2d1e1e] uppercase">Vaults are Secure</h4>
                      <p className="text-xs italic text-[#2d1e1e]/60 max-w-xs mx-auto">"No active beasts are currently raiding your vault. Keep vigilant!"</p>
                    </div>
                  </div>
                ) : (
                  accounts.map(acc => (
                    <DragonCard 
                      key={acc.id} 
                      account={acc} 
                      onDetails={setDetailAccount} 
                      onStrike={handleStrike}
                    />
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Monster Details Modal */}
      <Modal
        isOpen={!!detailAccount}
        onClose={() => setDetailAccount(null)}
        title="Monster Summary"
        footer={
          <button 
            onClick={() => {
              setViewingRecords(detailAccount);
              setDetailAccount(null);
            }}
            className="w-full py-4 bg-[#2d1e1e] text-white rounded-2xl font-black uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all border border-white/10 shadow-lg flex items-center justify-center gap-2"
          >
            <Map size={18} /> View Records
          </button>
        }
      >
        {detailAccount && (
          <div className="space-y-6 text-[#2d1e1e]">
            <div className="flex items-center gap-4 border-b border-[#4b2c20]/10 pb-4">
              <div className="w-16 h-16 bg-[#2d1e1e] text-[#d4af37] rounded-2xl flex items-center justify-center shadow-lg">
                <Flame size={36} />
              </div>
              <div>
                <h3 className="title-font text-2xl font-black uppercase tracking-widest">{detailAccount.name}</h3>
                <p className="text-xs text-[#4b2c20]/60 font-black uppercase tracking-widest">
                  Level {Math.floor((detailAccount.total_health || 0) / 1000)} Elite Monster
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <StatBox icon={<Heart size={12} />} label="Total Health" value={detailAccount.total_health} color="red" />
              <StatBox icon={<Heart size={12} />} label="Health Left" value={detailAccount.health_left} color="red" />
              <StatBox icon={<Sword size={12} />} label="Damage Done" value={detailAccount.damage_done} color="emerald" />
              <StatBox icon={<Shield size={12} />} label="Shield Left" value={detailAccount.shield_left} color="blue" />
              <StatBox icon={<Shield size={12} />} label="Start Shield" value={detailAccount.start_shield} color="blue" />
              <StatBox icon={<Target size={12} />} label="Critical Hits" value={detailAccount.critical_hits} color="amber" />
              <StatBox icon={<TrendingDown size={12} />} label="Losses" value={detailAccount.losses} color="amber" />
            </div>

            <div className="bg-black/5 rounded-2xl p-4 border border-[#4b2c20]/10">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#4b2c20]/60 mb-2 text-center">Historical Notes</p>
              <p className="text-xs italic text-[#4b2c20]/80 text-center leading-relaxed">
                "This beast has plagued the treasury since {detailAccount.month || 'the ancient times'} of {detailAccount.year || 'the old era'}. Only consistent strikes will bring it down."
              </p>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={!!viewingRecords}
        onClose={() => setViewingRecords(null)}
        title={`${viewingRecords?.name} - Combat History`}
        size="max-w-6xl"
      >
        <div className="max-h-[50vh] overflow-auto custom-scrollbar text-[#2d1e1e]">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-[#e8d5c0] z-20">
              <tr>
                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-[#4b2c20] border-b-2 border-[#4b2c20]/20">Date</th>
                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-[#4b2c20] border-b-2 border-[#4b2c20]/20">Type</th>
                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-[#4b2c20] border-b-2 border-[#4b2c20]/20">Amount</th>
                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-[#4b2c20] border-b-2 border-[#4b2c20]/20">Source</th>
                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-[#4b2c20] border-b-2 border-[#4b2c20]/20">Description</th>
              </tr>
            </thead>
            <tbody>
              {records.filter(r => r.account_id === viewingRecords?.id).map((record) => (
                <tr key={record.id} className="hover:bg-black/5 transition-colors">
                  <td className="px-4 py-3 text-xs font-bold text-[#4b2c20] border-b border-[#4b2c20]/10">{record.month} {record.year}</td>
                  <td className="px-4 py-3 text-xs font-bold text-[#4b2c20] border-b border-[#4b2c20]/10">{record.transaction_type}</td>
                  <td className={`px-4 py-3 text-xs font-black border-b border-[#4b2c20]/10 ${record.expense_amount > 0 ? 'text-red-700' : 'text-emerald-700'}`}>
                    ${(record.expense_amount || record.payment_receipt_cash || 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-xs font-bold text-[#4b2c20] border-b border-[#4b2c20]/10">{record.from_source}</td>
                  <td className="px-4 py-3 text-xs text-[#4b2c20]/60 border-b border-[#4b2c20]/10 italic">{record.description}</td>
                </tr>
              ))}
              {records.filter(r => r.account_id === viewingRecords?.id).length === 0 && (
                <tr>
                  <td colSpan="5" className="py-20 text-center italic text-[#2d1e1e]/40">No historical records found for this monster.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Modal>

      {/* Strike Monster Modal */}
      <Modal
        isOpen={!!strikeTarget}
        onClose={() => !isStriking && setStrikeTarget(null)}
        title="Strike Monster"
        footer={
          <button 
            onClick={confirmStrike}
            disabled={isStriking || !strikeAmount || parseFloat(strikeAmount) <= 0}
            className="w-full sm:w-auto px-8 py-3 bg-[#8b0000] text-[#ffd700] rounded-xl font-black uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-[#ffd700]/30 shadow-lg flex items-center justify-center gap-2"
          >
            {isStriking ? <LoaderCircle className="animate-spin" size={16} /> : <Sword size={16} />}
            {isStriking ? 'Striking...' : 'Unleash Attack'}
          </button>
        }
      >
        <div className="space-y-6 text-center text-[#2d1e1e]">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-[#8b0000]/10 rounded-full flex items-center justify-center border-4 border-[#8b0000]/20">
              <Sword size={40} className="text-[#8b0000]" />
            </div>
          </div>
          <div>
            <h3 className="title-font text-xl font-black uppercase tracking-widest">{strikeTarget?.name}</h3>
            <p className="text-sm italic text-[#4b2c20]/60 mt-2">"How much gold shall you spend to damage this beast?"</p>
          </div>
          <div>
            <input 
              type="number" 
              value={strikeAmount}
              onChange={(e) => setStrikeAmount(e.target.value)}
              className="w-full text-center text-3xl font-black text-[#8b0000] bg-white/40 border-2 border-[#8b0000]/20 rounded-2xl py-4 focus:border-[#8b0000]/40 outline-none transition-all"
              placeholder="0"
              autoFocus
            />
          </div>
        </div>
      </Modal>

      {/* Summon Monster Modal */}
      <Modal
        isOpen={showSpawnModal}
        onClose={() => setShowSpawnModal(false)}
        title="Summon New Monster"
      >
        <SpawnMonsterForm 
          userId={userId} 
          onSuccess={() => {
            setShowSpawnModal(false);
            fetchAccounts();
            fetchDashboardData();
            if (onRefresh) onRefresh();
          }} 
        />
      </Modal>
    </div>
  );
};

export default AccountManager;
