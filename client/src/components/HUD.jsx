
import { useState, useEffect, useRef } from 'react';
import { useKingdomStore } from '../store/useKingdomStore';
import { supabase } from '../lib/supabaseClient';

const HUD = ({ profile, diamonds = 1000 }) => {
  const level = profile?.level || 1;
  const xp = profile?.xp || 0;
  const maxXp = 100 * Math.pow(1.5, level - 1);
  const xpPerc = (xp / maxXp) * 100;

  const activeLang = useKingdomStore((state) => state.language);
  const setLanguage = useKingdomStore((state) => state.setLanguage);

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const languages = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'pt-BR', label: 'Português (BR)', flag: '🇧🇷' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
    { code: 'de', label: 'Deutsch', flag: '🇩🇪' }
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="absolute top-0 left-0 right-0 h-auto md:h-24 z-[70] bg-gradient-to-b from-black/85 via-black/40 to-transparent p-2.5 md:p-3 md:px-8 flex flex-col md:flex-row items-center justify-between gap-2 md:gap-4">
      <div className="flex items-center gap-2 md:gap-4 md:w-auto w-full justify-between md:justify-start">
        <div className="flex items-center gap-2 md:gap-4">
          <div className="relative w-11 h-11 md:w-14 md:h-14 rounded-full border-2 border-white bg-stone-800 shadow-lg overflow-visible flex-shrink-0">
            {/* Using placeholder for avatar */}
            <img 
              src="https://api.dicebear.com/7.x/pixel-art/svg?seed=EldoriaHero" 
              alt="Hero Avatar" 
              className="rounded-full w-full h-full"
            />
            <div className="absolute -bottom-1 -right-1 bg-[#ff4444] text-white text-[9px] md:text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-white">
              {level}
            </div>
          </div>
          
          <div>
            <div className="title-font text-[10px] md:text-xs text-white leading-none mb-1 font-bold">
              {profile?.email?.split('@')[0] || 'Lord/Lady'}
            </div>
            <div className="flex items-center gap-1">
              <div className="w-16 md:w-24 h-1.5 bg-gray-950 rounded-full border border-gray-800 overflow-hidden">
                <div 
                  className="h-full bg-[#32CD32] transition-all duration-500" 
                  style={{ width: `${xpPerc}%` }}
                />
              </div>
              <span className="text-[7.5px] md:text-[8px] text-gray-400 font-bold">{Math.floor(xp)}/{Math.floor(maxXp)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between md:justify-end gap-2 md:gap-3 md:w-auto w-full">
        <div className="flex items-center gap-2">
          <div className="resource-pill gold py-1 px-3 md:py-1.5 md:px-4 gap-1.5 md:gap-2">
            <span className="text-xs">💰</span>
            <span className="text-xs font-bold text-yellow-400">
              {profile?.gold?.toLocaleString() || '0'}
            </span>
          </div>
          <div className="resource-pill diamond py-1 px-3 md:py-1.5 md:px-4 gap-1.5 md:gap-2">
            <span className="text-xs">💎</span>
            <span className="text-xs font-bold text-cyan-400">
              {diamonds.toLocaleString()}
            </span>
          </div>
        </div>
 
        {/* Language selector Globe dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button 
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="w-11 h-11 md:w-9 md:h-9 rounded-lg bg-stone-900/60 backdrop-blur-md hover:bg-stone-800/80 border border-white/25 hover:border-[#ffd700] flex items-center justify-center transition-all cursor-pointer shadow-lg hover:scale-105 active:scale-95"
            title="Language / Idioma / Langue"
          >
            <span className="text-base select-none">🌐</span>
          </button>
          
          {isOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-[#f4e4bc] border-4 border-[#5d4037] rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.8)] z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
              {/* Parchment Overlay */}
              <div 
                className="absolute inset-0 pointer-events-none opacity-20 mix-blend-multiply rounded-lg"
                style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/paper-fibers.png')" }}
              />
              <div className="relative p-1.5 space-y-1">
                {languages.map((lang) => {
                  const isSelected = activeLang === lang.code;
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => {
                        setLanguage(lang.code);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-3 md:py-1.5 rounded-lg text-left text-[10px] font-black font-sans uppercase tracking-wider transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-[#8b4513]/20 border border-[#8b4513] text-[#4b2c20] font-black' 
                          : 'border border-transparent text-[#5d4037]/80 hover:bg-[#8b4513]/5 hover:text-[#4b2c20]'
                      }`}
                    >
                      <span className="text-sm select-none">{lang.flag}</span>
                      <span>{lang.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Sign Out Button */}
        <button 
          type="button"
          onClick={async () => {
            console.log('[Eldoria Auth] Initiating fail-safe sign out...');
            try {
              // 1. Clear Supabase auth keys from localStorage immediately
              const keys = Object.keys(localStorage);
              keys.forEach(key => {
                if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
                  localStorage.removeItem(key);
                }
              });

              // 2. Update Zustand store state to transition UI to login gate
              const setStore = useKingdomStore.setState;
              setStore({ user: null, role: 'lord', email: 'guest@medieval.stuff' });
              useKingdomStore.getState().resetStore();

              // 3. Call Supabase signOut in fire-and-forget mode
              supabase.auth.signOut({ scope: 'local' }).catch(err => {
                console.warn('[Eldoria Auth] Supabase background signOut failed:', err);
              });

              toast.success('Farewell, my Lord! The gates are locked.');
            } catch (err) {
              console.error('[Eldoria Auth] Sign out exception:', err);
              toast.error(`Sign out failed: ${err.message || err}`);
            }
          }}
          className="w-11 h-11 md:w-9 md:h-9 rounded-lg bg-[#8b0000]/60 backdrop-blur-md hover:bg-[#8b0000]/90 border border-white/25 hover:border-[#ffd700] flex items-center justify-center transition-all cursor-pointer shadow-lg hover:scale-105 active:scale-95"
          title="Sign Out / Leave Keep"
        >
          <span className="text-base select-none">🚪</span>
        </button>
      </div>
    </div>
  );
};

export default HUD;

