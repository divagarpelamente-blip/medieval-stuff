import React from 'react';
import { formatVal } from '../../utils/numberUtils';

const StatisticCard = ({ label, metric, activeMonth, prevPeriod, t, handleOpenDetails }) => {

  const diffColor = metric.diff > 0 ? 'text-emerald-700 font-bold' : metric.diff < 0 ? 'text-rose-700 font-bold' : 'text-stone-500';
  const diffPrefix = metric.diff > 0 ? '+' : '';

  return (
    <div className="bg-white rounded-lg shadow-sm border border-[#8b4513]/10 p-4 relative overflow-hidden group">
      <h4 className="text-[10px] font-black uppercase text-[#5d4037]/75 mb-2 tracking-wide truncate">
        {label}
      </h4>
      
      <div className="flex items-end justify-between mb-1">
        <p className="text-xl font-mono font-extrabold text-[#4b2c20] leading-none">
          {formatVal(metric.curr)}
        </p>
        <button 
          type="button" 
          onClick={() => handleOpenDetails(`${label} (${activeMonth})`, metric.currList)}
          className="text-xs text-stone-400 hover:text-[#8b4513] transition-all hover:scale-110 active:scale-95 cursor-pointer opacity-0 group-hover:opacity-100"
          title="View records"
        >
          📜
        </button>
      </div>

      <div className="flex items-center justify-between text-xs mb-3">
        <span className="text-stone-500">{t(`month_${prevPeriod.month.toLowerCase()}_short`, prevPeriod.month.substring(0, 3))}: {formatVal(metric.prev)}</span>
        <span className={`text-xs ${diffColor}`}>
          {diffPrefix}{formatVal(metric.diff)}
        </span>
      </div>

      <div className="flex items-center justify-between text-xs font-bold border-t border-[#8b4513]/5 pt-2">
        <span className="text-[#4b2c20] uppercase text-[9px]">{t('stat_accumulated', 'Accumulated')}</span>
        <div className="flex items-center gap-1">
          <span className="text-[#4b2c20] font-mono">{formatVal(metric.accum)}</span>
          <button 
            type="button" 
            onClick={() => handleOpenDetails(`${label} (Accumulated)`, metric.accumList)}
            className="text-[10px] text-stone-400 hover:text-[#8b4513] transition-all hover:scale-110 active:scale-95 cursor-pointer opacity-0 group-hover:opacity-100"
            title="View all accumulated records"
          >
            📜
          </button>
        </div>
      </div>
    </div>
  );
};

export default StatisticCard;