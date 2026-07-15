import React from 'react';

export default function HUD({ profile, diamonds }) {
  return (
    <div className="absolute top-4 left-4 right-4 flex justify-between z-50 pointer-events-none">
      {/* Player Profile */}
      <div className="bg-[#1a0f0a]/90 border-2 border-[#8b4513] rounded-lg p-2 shadow-xl flex items-center gap-4 pointer-events-auto">
        <div className="w-10 h-10 bg-stone-800 rounded-full border-2 border-[#d4af37] flex items-center justify-center text-xs font-black text-[#d4af37]">
          Lv.{profile?.level || 1}
        </div>
        <div>
          <div className="text-[10px] font-black uppercase text-[#8b4513] tracking-widest">Kingdom</div>
          <div className="text-xs font-bold text-stone-300 truncate max-w-[120px]">
            {profile?.email?.split('@')[0] || 'Lord'}
          </div>
        </div>
      </div>

      {/* Resources */}
      <div className="flex gap-2 pointer-events-auto">
        <div className="bg-[#1a0f0a]/90 border-2 border-[#8b4513] rounded-lg px-4 py-2 flex items-center gap-2">
          <span className="text-lg">💎</span>
          <span className="font-mono font-black text-cyan-400">{diamonds || 0}</span>
        </div>
        <div className="bg-[#1a0f0a]/90 border-2 border-[#8b4513] rounded-lg px-4 py-2 flex items-center gap-2">
          <span className="text-lg">🪙</span>
          <span className="font-mono font-black text-[#ffd700]">{profile?.gold || 0}g</span>
        </div>
      </div>
    </div>
  );
}
