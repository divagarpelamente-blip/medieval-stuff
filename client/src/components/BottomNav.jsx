import { Compass, Trophy, BookOpen, LayoutDashboard, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const BottomNav = ({ activeTab = 'quests', onTabChange }) => {
  const { t } = useTranslation();

  const items = [
    { id: 'quests', label: t('quests'), icon: Compass },
    { id: 'achievements', label: t('achievements'), icon: Trophy },
    { id: 'transactions', label: t('transactions'), icon: BookOpen },
    { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { id: 'settings', label: t('settings'), icon: Settings },
  ];

  return (
    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-[60%] max-w-[480px] bg-stone-900/60 backdrop-blur-md border border-white/10 rounded-xl p-1 flex justify-around items-center z-[60] shadow-2xl">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        const isSupported = item.id === 'quests' || item.id === 'settings' || item.id === 'transactions' || item.id === 'dashboard';

        return (
          <button 
            key={item.id}
            onClick={isSupported ? () => onTabChange(item.id) : undefined}
            disabled={!isSupported}
            className={`w-11 h-11 sm:w-13 sm:h-13 flex flex-col items-center justify-center rounded-lg border transition-all select-none ${
              !isSupported
                ? 'border-transparent text-gray-400/50 opacity-40 cursor-not-allowed'
                : isActive 
                  ? 'bg-white/10 border-white/20 text-[#ffd700] shadow-inner opacity-90 cursor-pointer hover:scale-105 active:scale-95' 
                  : 'border-transparent text-gray-400/80 opacity-70 hover:opacity-100 hover:text-white cursor-pointer hover:scale-105 active:scale-95'
            }`}
            title={isSupported ? item.label : `${item.label} (Under Construction)`}
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
