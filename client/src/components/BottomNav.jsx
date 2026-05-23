import React from 'react';
import { Compass, Trophy, BookOpen, LayoutDashboard, Settings } from 'lucide-react';

const BottomNav = ({ activeTab = 'base', onTabChange }) => {
  const items = [
    { id: 'quests', label: 'Quests', icon: Compass },
    { id: 'achievements', label: 'Achievements', icon: Trophy },
    { id: 'transactions', label: 'Transactions', icon: BookOpen },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-[60%] max-w-[480px] bg-stone-900/60 backdrop-blur-md border border-white/10 rounded-xl p-1 flex justify-around items-center z-[60] shadow-2xl">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button 
            key={item.id}
            onClick={() => onTabChange && onTabChange(item.id)}
            className={`w-11 h-11 sm:w-13 sm:h-13 flex flex-col items-center justify-center rounded-lg border transition-all cursor-pointer select-none ${
              isActive 
                ? 'bg-white/10 border-white/20 text-[#ffd700] shadow-inner' 
                : 'border-transparent text-gray-400 hover:bg-white/5 hover:border-white/5'
            }`}
          >
            <Icon size={14} className="sm:w-4.5 sm:h-4.5 mb-0.5" />
            <span className="text-[7.5px] sm:text-[8.5px] font-black uppercase tracking-wider">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default BottomNav;
