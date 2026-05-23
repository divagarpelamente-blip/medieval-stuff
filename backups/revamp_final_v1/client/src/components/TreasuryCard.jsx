import React, { useState } from 'react';
import { Coins, TrendingUp, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

const TreasuryCard = ({ gold, incomeRate, level, onCollect, onUpgrade, upgradeCost, currentBalance }) => {
  const [isCollecting, setIsCollecting] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);

  const handleCollect = () => {
    setIsCollecting(true);
    onCollect();
    setTimeout(() => setIsCollecting(false), 500);
  };

  const handleUpgrade = async () => {
    setIsUpgrading(true);
    await onUpgrade();
    setIsUpgrading(false);
  };

  const canAfford = currentBalance >= upgradeCost;

  return (
    <div className="glass-card p-6 rounded-2xl w-full max-w-sm relative overflow-hidden group">
      {/* Decorative Border */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-medieval-gold to-transparent" />
      
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold">Treasury</h3>
            <span className="bg-medieval-gold/20 text-medieval-gold text-[10px] px-2 py-0.5 rounded border border-medieval-gold/30 font-bold">LVL {level}</span>
          </div>
          <p className="text-stone-400 text-xs uppercase tracking-widest">Economic Hub</p>
        </div>
        <div className="p-3 bg-medieval-gold/10 rounded-xl border border-medieval-gold/20">
          <Coins className="text-medieval-gold w-6 h-6" />
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-stone-950/50 p-4 rounded-xl border border-stone-800">
          <div className="text-stone-500 text-xs mb-1 uppercase font-bold">Stored Gold</div>
          <div className="text-3xl font-bold text-medieval-goldLight flex items-baseline gap-2">
            {gold.toLocaleString()}
            <span className="text-sm font-normal text-stone-500 italic">coins</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-emerald-500 bg-emerald-500/5 px-3 py-1.5 rounded-lg border border-emerald-500/10">
            <TrendingUp size={16} />
            <span className="text-sm font-semibold">+{incomeRate}/min</span>
          </div>
          
          <button
            onClick={handleUpgrade}
            disabled={!canAfford || isUpgrading}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all text-sm font-bold ${
              canAfford 
                ? 'bg-stone-800 border-stone-700 text-medieval-goldLight hover:bg-stone-700' 
                : 'bg-stone-900/50 border-stone-800 text-stone-600 cursor-not-allowed'
            }`}
          >
            <TrendingUp size={14} className="rotate-45" />
            <span>Upgrade ({upgradeCost})</span>
          </button>
        </div>
      </div>

      <div className="mt-8">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleCollect}
          disabled={isCollecting || gold <= 0}
          className={`w-full py-4 flex items-center justify-center gap-2 ${
            gold > 0 ? 'medieval-button' : 'bg-stone-900 border-2 border-stone-800 text-stone-600 cursor-not-allowed rounded font-bold'
          }`}
        >
          {isCollecting ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1 }}
            >
              <Coins size={20} />
            </motion.div>
          ) : (
            <>
              <Shield size={18} />
              <span>{gold > 0 ? 'Collect Taxes' : 'No Taxes to Collect'}</span>
            </>
          )}
        </motion.button>
      </div>

      {/* Decorative Corner */}
      <div className="absolute -bottom-2 -right-2 opacity-5 group-hover:opacity-10 transition-opacity">
        <Coins size={80} />
      </div>
    </div>
  );
};

export default TreasuryCard;
