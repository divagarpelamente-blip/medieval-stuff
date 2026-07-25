import React from 'react';

export default function BottomNav({ activeTab, onTabChange }) {
  const tabs = [
    { id: 'ledger', icon: '📜', label: 'Ledger' },
    { id: 'treasury', icon: '⚖️', label: 'Treasury' },
    { id: 'quests', icon: '⚔️', label: 'Quests' },
    { id: 'settings', icon: '⚙️', label: 'Settings' }
  ];

  return (
    <div className="absolute bottom-0 left-0 w-full bg-[#1a0f0a] border-t-4 border-[#8b4513] p-4 z-50 flex justify-around shadow-[0_-10px_30px_rgba(0,0,0,0.8)]">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex flex-col items-center gap-1 transition-all ${
            activeTab === tab.id 
              ? 'scale-110 opacity-100 text-[#ffd700]' 
              : 'opacity-50 text-stone-400 hover:opacity-80'
          }`}
        >
          <span className="text-2xl drop-shadow-md">{tab.icon}</span>
          <span className="text-[10px] font-black uppercase tracking-wider">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
