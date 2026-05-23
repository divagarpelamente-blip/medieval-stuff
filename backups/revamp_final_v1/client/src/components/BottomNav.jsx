import React from 'react';
import { Trophy, Sword, Castle, Wallet, Globe } from 'lucide-react';

const BottomNav = ({ activeTab = 'base', onTabChange }) => {
  const items = [
    { id: 'achievements', label: 'Conquista', icon: Trophy, emoji: '🏆' },
    { id: 'arena', label: 'Heróis', icon: Sword, emoji: '⚔️' },
    { id: 'base', label: 'Base', icon: Castle, emoji: '🏰', center: true },
    { id: 'treasury', label: 'Tesouro', icon: Wallet, emoji: '💰' },
    { id: 'world', label: 'Mundo', icon: Globe, emoji: '🌍' },
  ];

  return (
    <div className="absolute bottom-0 left-0 right-0 h-20 sm:h-28 bg-gradient-to-t from-black/90 to-transparent flex justify-around items-center px-2 sm:px-12 z-[60]">
      {items.map((item) => (
        <div 
          key={item.id}
          onClick={() => onTabChange && onTabChange(item.id)}
          className={`flex flex-col items-center cursor-pointer transition-all ${
            activeTab === item.id ? 'text-[#ffd700]' : 'text-gray-400'
          } ${item.center ? 'relative' : ''}`}
        >
          {item.center ? (
            <>
              <div className="bg-gradient-to-br from-[#8b4513] to-[#5d4037] border-2 border-[#d4af37] rounded-xl w-14 h-14 sm:w-20 sm:h-20 -mt-10 sm:-mt-16 flex items-center justify-center shadow-[0_5px_15px_rgba(0,0,0,0.5)] active:scale-95 transition-transform">
                <span className="text-2xl sm:text-4xl">{item.emoji}</span>
              </div>
              <span className="text-[10px] sm:text-xs mt-1 font-bold uppercase">{item.label}</span>
            </>
          ) : (
            <>
              <span className="text-xl sm:text-3xl mb-0.5">{item.emoji}</span>
              <span className="text-[9px] sm:text-[11px] font-medium">{item.label}</span>
            </>
          )}
        </div>
      ))}
    </div>
  );
};

export default BottomNav;
