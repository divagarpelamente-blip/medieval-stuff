import React, { useEffect, useState } from 'react';
import { Wallet, TrendingUp, TrendingDown, Plus, CreditCard, Shield, Flame, Heart, Sword } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

const AccountManager = ({ userId, onRefresh }) => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) fetchAccounts();
  }, [userId]);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      // 1. Fetch accounts
      const { data, error } = await supabase
        .from('treasury_accounts')
        .select('*')
        .eq('profile_id', userId);

      if (error) throw error;

      // 2. Calculate interest regeneration for each account
      const now = new Date();
      const updatedAccounts = data.map(acc => {
        const lastRegen = new Date(acc.last_regen_at);
        const secondsElapsed = (now - lastRegen) / 1000;
        
        // Simple regeneration logic: interest accrues over time
        // regen_rate is interest per month (30 days)
        const regenPerSecond = (acc.balance * (acc.regen_rate || 0)) / (30 * 24 * 60 * 60);
        const regeneration = secondsElapsed * regenPerSecond;
        
        return {
          ...acc,
          current_regen: regeneration,
          total_health: acc.balance + regeneration
        };
      });

      setAccounts(updatedAccounts);
    } catch (err) {
      console.error('Error fetching accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStrike = async (account) => {
    const amount = prompt(`How much damage (Gold) do you wish to deal to ${account.name}?`, "100");
    if (!amount || isNaN(amount)) return;
    
    const payment = parseFloat(amount);
    if (payment <= 0) return;

    try {
      // 1. Update Account Balance and last_regen_at (to reset interest timer)
      const { error: accError } = await supabase
        .from('treasury_accounts')
        .update({ 
          balance: Math.max(0, account.total_health - payment),
          last_regen_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', account.id);
      
      if (accError) throw accError;

      // 2. Create Record
      const { error: recError } = await supabase
        .from('treasury_records')
        .insert([{
          profile_id: userId,
          account_id: account.id,
          from_source: 'Treasury Direct Strike',
          month: new Date().toLocaleString('default', { month: 'long' }),
          entity: account.name,
          expense_amount: payment,
          description: `Direct amortization strike against ${account.name}`,
          transaction_type: 'Expense',
          status: 'Paid',
          paid_with: 'Gold'
        }]);

      if (recError) throw recError;

      // 3. Update Profile Gold
      const { data: profile } = await supabase.from('profiles').select('gold').eq('id', userId).single();
      await supabase.from('profiles').update({ gold: Math.max(0, profile.gold - payment) }).eq('id', userId);

      alert(`${account.name} has taken ${payment} damage!`);
      fetchAccounts();
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Combat error:', err);
      alert('Failed to deal damage: ' + err.message);
    }
  };

  const DragonCard = ({ account }) => {
    const healthPercent = Math.min((account.total_health / account.initial_debt) * 100, 100);
    const shieldPercent = account.overdraft_limit > 0 ? (account.overdraft_limit / account.initial_debt) * 100 : 0;

    return (
      <div className="relative bg-white/40 border-2 border-[#2d1e1e]/20 rounded-3xl p-6 overflow-hidden hover:border-[#2d1e1e]/40 transition-all group shadow-xl">
        {/* Background Dragon Motif (Lucide Icon background) */}
        <div className="absolute -right-8 -bottom-8 opacity-5 group-hover:opacity-10 transition-opacity">
          <Flame size={160} />
        </div>

        <div className="relative z-10 flex flex-col h-full">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-[#2d1e1e] text-[#d4af37] rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3 group-hover:rotate-0 transition-transform">
                <Flame size={32} />
              </div>
              <div>
                <h3 className="title-font text-[#2d1e1e] text-lg font-black uppercase tracking-widest">{account.name}</h3>
                <p className="text-[10px] text-[#2d1e1e]/60 font-black uppercase tracking-tighter flex items-center gap-1">
                  <Shield size={10} /> {account.type} • Lv. {Math.floor(account.initial_debt / 1000)} Great Wyrm
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-[#2d1e1e] tracking-tighter">${Math.floor(account.total_health)}</p>
              <p className="text-[9px] text-[#2d1e1e]/40 font-black uppercase tracking-widest">Current Vitality</p>
            </div>
          </div>

          {/* Health Bar (The Debt) */}
          <div className="space-y-1 mb-6">
            <div className="flex justify-between items-end px-1">
              <span className="text-[10px] font-black uppercase text-[#2d1e1e]/60 tracking-widest">Dragon Health (Principal)</span>
              <span className="text-xs font-black text-[#2d1e1e]">{Math.floor(healthPercent)}%</span>
            </div>
            <div className="h-4 w-full bg-black/10 rounded-full overflow-hidden p-0.5 border border-[#2d1e1e]/10">
              <div 
                className="h-full bg-gradient-to-r from-red-600 to-red-900 rounded-full transition-all duration-1000 relative shadow-[0_0_10px_rgba(220,38,38,0.5)]"
                style={{ width: `${healthPercent}%` }}
              >
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />
              </div>
            </div>
            {account.overdraft_limit > 0 && (
              <div className="h-1.5 w-full bg-blue-400/20 rounded-full overflow-hidden mt-1">
                <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${shieldPercent}%` }} />
              </div>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-black/5 rounded-xl p-3 border border-[#2d1e1e]/5">
              <div className="flex items-center gap-2 text-emerald-700 mb-1">
                <Sword size={12} />
                <span className="text-[9px] font-black uppercase tracking-widest">Total Slayed</span>
              </div>
              <p className="text-sm font-black text-[#2d1e1e]">${Math.floor(account.initial_debt - account.balance)}</p>
            </div>
            <div className="bg-black/5 rounded-xl p-3 border border-[#2d1e1e]/5">
              <div className="flex items-center gap-2 text-red-700 mb-1">
                <Heart size={12} />
                <span className="text-[9px] font-black uppercase tracking-widest">Regeneration</span>
              </div>
              <p className="text-sm font-black text-[#2d1e1e]">+${Math.floor(account.current_regen)}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-auto">
            <button 
              onClick={() => handleStrike(account)}
              className="flex-1 py-3 bg-[#2d1e1e] text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-lg border border-white/10"
            >
              <Sword size={14} />
              Strike Principal
            </button>
            <button className="px-4 py-3 bg-white/40 border-2 border-[#2d1e1e]/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/60 transition-all">
              Details
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 p-2">
      {/* Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#2d1e1e] text-white rounded-3xl p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-10">
            <TrendingDown size={100} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-2">Total Kingdom Debt</p>
          <p className="text-3xl font-black title-font">
            ${Math.floor(accounts.reduce((sum, acc) => sum + (acc.total_health || 0), 0))}
          </p>
        </div>
        
        <div className="bg-white/40 border-2 border-[#2d1e1e]/10 rounded-3xl p-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-red-600 text-white rounded-xl flex items-center justify-center shadow-lg">
            <Flame size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#2d1e1e]/60">Active Dragons</p>
            <p className="text-xl font-black text-[#2d1e1e]">{accounts.length}</p>
          </div>
        </div>

        <div className="bg-white/40 border-2 border-[#2d1e1e]/10 rounded-3xl p-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg">
            <Shield size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#2d1e1e]/60">Armor (Buffers)</p>
            <p className="text-xl font-black text-[#2d1e1e]">
              ${Math.floor(accounts.reduce((sum, acc) => sum + (acc.overdraft_limit || 0), 0))}
            </p>
          </div>
        </div>
      </div>

      {/* Dragons List */}
      <div className="space-y-6">
        <div className="flex justify-between items-center px-2">
          <div className="space-y-1">
            <h2 className="title-font text-[#2d1e1e] text-2xl font-black uppercase tracking-widest">Active Dragons</h2>
            <p className="text-[10px] italic text-[#2d1e1e]/60">"Each beast represents a weight on the crown's soul."</p>
          </div>
          <button className="px-6 py-3 bg-[#2d1e1e] text-[#d4af37] rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl flex items-center gap-2">
            <Plus size={16} />
            Spawn New Debt
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {loading ? (
            <div className="lg:col-span-2 text-center py-20 italic text-[#2d1e1e]/40 flex flex-col items-center gap-4">
              <LoaderCircle className="animate-spin" size={40} />
              <p>Auditing the dragon's lair...</p>
            </div>
          ) : accounts.length === 0 ? (
            <div className="lg:col-span-2 bg-white/30 border-4 border-dashed border-[#2d1e1e]/10 rounded-[40px] p-20 text-center space-y-6">
              <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto text-emerald-700">
                <Shield size={48} />
              </div>
              <div className="space-y-2">
                <h3 className="title-font text-2xl font-black text-[#2d1e1e] uppercase">Your Skies are Clear</h3>
                <p className="italic text-[#2d1e1e]/60 max-w-sm mx-auto">"The kingdom is currently free of major debts. Long live the King!"</p>
              </div>
            </div>
          ) : (
            accounts.map(acc => <DragonCard key={acc.id} account={acc} />)
          )}
        </div>
      </div>
    </div>
  );
};

// Helper component for loading
const LoaderCircle = ({ className, size }) => (
  <svg 
    className={className} 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

export default AccountManager;
