import { Compass, Trophy, BookOpen, LayoutDashboard, Settings, BarChart3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Z_LAYERS } from '../../constants/UI_UX';

const BottomNav = ({ activeTab = 'quests', onTabChange }) => {
  const { t } = useTranslation();

  const items = [
    { id: 'quests', label: t('quests'), icon: Compass },
    { id: 'achievements', label: t('achievements'), icon: Trophy },
    { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { id: 'statistics', label: t('menu_statistics', 'Statistics'), icon: BarChart3 },
    { id: 'settings', label: t('settings'), icon: Settings },
  ];

  return (
    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-[48%] max-w-[384px] bg-stone-900/60 backdrop-blur-md border border-white/10 rounded-xl p-0.5 flex justify-around items-center shadow-2xl" style={{ zIndex: Z_LAYERS.BOTTOM_NAV }}>
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id || (item.id === 'dashboard' && (activeTab === 'financial_statement' || activeTab === 'transactions'));
        const isSupported = item.id === 'quests' || item.id === 'settings' || item.id === 'dashboard' || item.id === 'statistics';

        return (
          <button 
            key={item.id}
            onClick={isSupported ? () => onTabChange(item.id) : undefined}
            disabled={!isSupported}
            className={`w-9 h-9 sm:w-[41px] sm:h-[41px] flex flex-col items-center justify-center rounded-lg border transition-all select-none ${
              !isSupported
                ? 'border-transparent text-gray-400/50 opacity-40 cursor-not-allowed'
                : isActive 
                  ? 'bg-white/10 border-white/20 text-[#ffd700] shadow-inner opacity-90 cursor-pointer hover:scale-105 active:scale-95' 
                  : 'border-transparent text-gray-400/80 opacity-70 hover:opacity-100 hover:text-white cursor-pointer hover:scale-105 active:scale-95'
            }`}
            title={isSupported ? item.label : `${item.label} (Under Construction)`}
          >
            <Icon size={11} className="sm:w-3.5 sm:h-3.5 mb-0.5" />
            <span className="text-[6.5px] sm:text-[7.5px] font-black uppercase tracking-wider">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default BottomNav;
