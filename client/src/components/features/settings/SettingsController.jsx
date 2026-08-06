import React, { useState, useEffect } from 'react';
import ModalTabmenus from '../../ui/ModalTabmenus';
import { useFormatting, formatCurrency } from '../../../context/FormattingContext';

const PreferencesTab = () => {
  const { prefs, updatePrefs } = useFormatting();
  const [localPrefs, setLocalPrefs] = useState(prefs);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Helper to determine if the currency is gaming/fiat
  const handleCurrencyChange = (e) => {
    const value = e.target.value;
    const isGaming = ['🪙', '💎'].includes(value);
    setLocalPrefs({ 
      ...localPrefs, 
      currencySymbol: value, 
      currencyType: isGaming ? 'gaming' : 'fiat' 
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    await updatePrefs(localPrefs);
    setIsSaving(false);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="flex flex-col h-full w-full max-w-lg mx-auto text-slate-100 mt-4">
      <div className="space-y-6">
        {/* Controls */}
        <div className="space-y-4">
          <div className="flex flex-col space-y-1.5">
            <label className="text-sm font-semibold text-slate-300">Date Format</label>
            <select 
              value={localPrefs.dateFormat}
              onChange={(e) => setLocalPrefs({ ...localPrefs, dateFormat: e.target.value })}
              className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="YYYY-MM-DD">YYYY-MM-DD (2026-08-06)</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY (06/08/2026)</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY (08/06/2026)</option>
            </select>
          </div>

          <div className="flex flex-col space-y-1.5">
            <label className="text-sm font-semibold text-slate-300">Number Format</label>
            <select 
              value={localPrefs.numberFormat}
              onChange={(e) => setLocalPrefs({ ...localPrefs, numberFormat: e.target.value })}
              className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="EU">European (1.250,50)</option>
              <option value="US">American (1,250.50)</option>
            </select>
          </div>

          <div className="flex flex-col space-y-1.5">
            <label className="text-sm font-semibold text-slate-300">Negative Format</label>
            <select 
              value={localPrefs.negativeFormat}
              onChange={(e) => setLocalPrefs({ ...localPrefs, negativeFormat: e.target.value })}
              className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="minus">Minus Sign (-100)</option>
              <option value="parentheses">Parentheses (100)</option>
            </select>
          </div>

          <div className="flex flex-col space-y-1.5">
            <label className="text-sm font-semibold text-slate-300">Currency Symbol</label>
            <select 
              value={localPrefs.currencySymbol}
              onChange={handleCurrencyChange}
              className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <optgroup label="Fiat Currencies">
                <option value="€">Euro (€)</option>
                <option value="$">US Dollar ($)</option>
                <option value="£">British Pound (£)</option>
              </optgroup>
              <optgroup label="Gaming Currencies">
                <option value="🪙">Gold Coins (🪙)</option>
                <option value="💎">Gems (💎)</option>
              </optgroup>
            </select>
          </div>
        </div>

        {/* Live Preview Pane */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Live Preview</h4>
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-300">Example Vault Balance</span>
            <span className="text-xl font-bold text-emerald-400">
              {formatCurrency(1250.50, localPrefs)}
            </span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-800/50">
            <span className="text-slate-300">Example Overdraft</span>
            <span className="text-xl font-bold text-red-400">
              {formatCurrency(-250.50, localPrefs)}
            </span>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex justify-end pt-4">
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className={`px-4 py-2 text-white rounded-lg font-medium transition-colors ${
              isSaved 
                ? 'bg-emerald-600 hover:bg-emerald-500' 
                : 'bg-blue-600 hover:bg-blue-500'
            } ${isSaving ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isSaving ? 'Saving...' : isSaved ? 'Saved!' : 'Save Preferences'}
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * SettingsController Component
 * 
 * Local controller for the Kingdom Citadel Configurations.
 * Defines settings tab layout and routes dynamic rendering.
 * 
 * @param {function} onClose - Modal dismissal callback returning to main dock
 */
export default function SettingsController({ onClose }) {
  
  // Define layout structures for configuration parameters
  const tabs = [
    {
      id: 'profile',
      label: 'Profile',
      icon: '👤',
      content: (
        <div className="flex flex-col items-center justify-center p-12 text-center opacity-50 font-serif">
          <span className="text-4xl mb-4">🚧</span>
          <p className="text-stone-400 font-sans tracking-widest uppercase text-sm">
            Profile Settings Area
          </p>
        </div>
      )
    },
    {
      id: 'preferences',
      label: 'Preferences',
      icon: '🎨',
      content: <PreferencesTab />
    },
    {
      id: 'system',
      label: 'System',
      icon: '⚙️',
      content: (
        <div className="flex flex-col items-center justify-center p-12 text-center opacity-50 font-serif">
          <span className="text-4xl mb-4">🚧</span>
          <p className="text-stone-400 font-sans tracking-widest uppercase text-sm">
            System & Data Area
          </p>
        </div>
      )
    }
  ];

  return (
    <ModalTabmenus 
      title="Citadel Configurations" 
      icon="⚙️" 
      subtitle="Adjust kingdom parameters" 
      onClose={onClose} 
      tabs={tabs} 
    />
  );
}