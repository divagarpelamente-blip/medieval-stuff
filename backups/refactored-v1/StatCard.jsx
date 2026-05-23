import React from 'react';

export const StatBox = ({ icon, label, value, color }) => {
  const colorClasses = {
    red: "text-red-800 bg-red-500/10 border-red-500/20",
    emerald: "text-emerald-800 bg-emerald-500/10 border-emerald-500/20",
    blue: "text-blue-800 bg-blue-500/10 border-blue-500/20",
    amber: "text-amber-800 bg-amber-500/10 border-amber-500/20",
  };
  return (
    <div className={`rounded-xl p-2 border ${colorClasses[color]}`}>
      <div className="flex items-center gap-1 mb-1 opacity-80">
        {icon}
        <span className="text-[8px] font-black uppercase tracking-widest truncate">{label}</span>
      </div>
      <p className="text-sm font-black">${Math.floor(value || 0).toLocaleString()}</p>
    </div>
  );
};

export const SmallStatCard = ({ label, value, icon, typeColor }) => {
  const colors = {
    emerald: "border-emerald-800/20 bg-emerald-500/5 text-emerald-950 hover:bg-emerald-500/10",
    teal: "border-teal-800/20 bg-teal-500/5 text-teal-950 hover:bg-teal-500/10",
    red: "border-red-800/20 bg-red-500/5 text-red-950 hover:bg-red-500/10",
    rose: "border-rose-800/20 bg-rose-500/5 text-rose-950 hover:bg-rose-500/10",
    purple: "border-purple-800/20 bg-purple-500/5 text-purple-950 hover:bg-purple-500/10",
    gold: "border-amber-700/30 bg-amber-500/10 text-amber-950 hover:bg-amber-500/15 shadow-sm",
  };

  const isNegative = value < 0;

  return (
    <div className={`flex items-center gap-2.5 border rounded-xl p-2 transition-all hover:scale-[1.01] ${colors[typeColor] || 'border-[#4b2c20]/15 bg-white/30 text-[#4b2c20]'}`}>
      <div className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center bg-white/80 shadow-sm border border-black/5">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[8px] font-black uppercase tracking-wider opacity-75 truncate">{label}</p>
        <p className={`text-xs font-black tracking-tight leading-none mt-0.5 ${isNegative && typeColor === 'gold' ? 'text-red-800' : ''}`}>
          {isNegative ? '-' : ''}${Math.abs(Math.floor(value || 0)).toLocaleString()}
        </p>
      </div>
    </div>
  );
};
