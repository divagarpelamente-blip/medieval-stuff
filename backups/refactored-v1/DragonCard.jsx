import React from 'react';
import { Flame, Shield, Heart, Sword } from 'lucide-react';
import { StatBox } from './StatCard';

const FireBreath = () => (
  <div className="flex items-center gap-1 overflow-hidden h-6">
    <div className="w-4 h-4 text-orange-500 animate-pulse">
      <Flame size={16} fill="currentColor" />
    </div>
    <div className="flex gap-0.5">
      <div className="w-1 h-1 bg-orange-400 rounded-full animate-[fire_0.4s_infinite_alternate]" />
      <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-[fire_0.5s_infinite_alternate_0.1s]" />
      <div className="w-2 h-2 bg-red-600 rounded-full animate-[fire_0.6s_infinite_alternate_0.2s]" />
    </div>
  </div>
);

export const DragonCard = ({ account, onDetails, onStrike }) => {
  const healthPercent = Math.min(((account.health_left || 0) / (account.total_health || 1)) * 100, 100);
  const shieldPercent = account.start_shield > 0 ? ((account.shield_left || 0) / account.start_shield) * 100 : 0;

  return (
    <div className="relative bg-white/40 border-2 border-[#2d1e1e]/20 rounded-3xl p-6 overflow-hidden hover:border-[#2d1e1e]/45 transition-all group shadow-xl">
      {/* Background Dragon Motif */}
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
              <p className="text-xs text-[#4b2c20] font-black uppercase tracking-tighter flex items-center gap-1">
                <Shield size={12} /> {account.type}
              </p>
              <p className="text-[10px] text-[#4b2c20]/70 font-black uppercase tracking-widest mt-0.5">
                Lv. {Math.floor((account.total_health || 0) / 1000)} • Monster
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black text-[#2d1e1e] tracking-tighter">${Math.floor(account.health_left || 0).toLocaleString()}</p>
            <p className="text-[9px] text-[#2d1e1e]/40 font-black uppercase tracking-widest">Current Vitality</p>
          </div>
        </div>

        {/* Health Bar (The Debt) */}
        <div className="space-y-1 mb-6">
          <div className="flex justify-between items-end px-1">
            <span className="text-xs font-black uppercase text-[#2d1e1e] tracking-widest">Monster Vitality</span>
            <span className="text-xs font-black text-[#2d1e1e]">{Math.floor(healthPercent)}%</span>
          </div>
          <div className="h-4 w-full bg-black/10 rounded-full overflow-hidden p-0.5 border border-[#2d1e1e]/10">
            <div 
              className="h-full bg-gradient-to-r from-red-600 to-red-900 rounded-full transition-all duration-1000 relative shadow-[0_0_10px_rgba(220,38,38,0.5)]"
              style={{ width: `${healthPercent}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />
            </div>
          </div>
          {account.start_shield > 0 && (
            <div className="space-y-1 mt-1.5">
              <div className="flex justify-between text-[9px] font-black uppercase text-[#2d1e1e]/60 px-1">
                <span>Shield Left</span>
                <span>{Math.floor(shieldPercent)}%</span>
              </div>
              <div className="h-2 w-full bg-blue-500/10 rounded-full overflow-hidden p-0.5 border border-blue-500/20">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all duration-1000" 
                  style={{ width: `${shieldPercent}%` }} 
                />
              </div>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          <StatBox icon={<Heart size={12} />} label="Health Left" value={account.health_left} color="red" />
          <StatBox icon={<Sword size={12} />} label="Damage Done" value={account.damage_done} color="emerald" />
          <StatBox icon={<Shield size={12} />} label="Shield Left" value={account.shield_left} color="blue" />
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button 
            onClick={() => onDetails(account)}
            className="flex-1 py-3 bg-[#2d1e1e]/10 hover:bg-[#2d1e1e]/20 text-[#2d1e1e] rounded-xl text-xs font-black uppercase tracking-wider transition-all border border-[#2d1e1e]/20"
          >
            Summary
          </button>
          <button 
            onClick={() => onStrike(account)}
            className="flex-1 py-3 bg-red-800 hover:brightness-110 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all relative flex items-center justify-center gap-2 pr-10"
          >
            <Sword size={14} /> Strike Beast
            {account.shield_left > 0 && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <FireBreath />
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
