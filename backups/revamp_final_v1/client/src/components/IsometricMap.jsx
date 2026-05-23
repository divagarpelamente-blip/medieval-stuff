import React from 'react';

const HitZone = ({ onClick, style, label }) => (
  <div 
    className="absolute cursor-pointer hover:bg-white/10 transition-colors rounded-xl z-50 group border border-transparent hover:border-white/20"
    onClick={onClick}
    style={style}
  >
    {/* Tooltip */}
    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/90 text-[#ffd700] text-[10px] px-3 py-1 rounded-md opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-all border border-[#d4af37]/30 shadow-xl title-font uppercase tracking-widest z-[100]">
       {label}
    </div>
  </div>
);

const IsometricMap = ({ onBuildingClick, buildings = [] }) => {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* 1. Gold Mine (Orange area) */}
      <HitZone 
        label="Gold Mine"
        onClick={() => onBuildingClick('mine')}
        style={{ top: '22%', left: '8%', width: '18%', height: '22%' }}
      />

      {/* 2. Treasury (Red area) */}
      <HitZone 
        label="Royal Treasury"
        onClick={() => onBuildingClick('treasury')}
        style={{ top: '48%', left: '12%', width: '32%', height: '38%' }}
      />

      {/* 3. Market (Green area) */}
      <HitZone 
        label="Central Market"
        onClick={() => onBuildingClick('market')}
        style={{ top: '42%', left: '60%', width: '25%', height: '25%' }}
      />

      {/* 4. Town Hall (Purple area) */}
      <HitZone 
        label="Town Hall"
        onClick={() => onBuildingClick('townhall')}
        style={{ top: '12%', left: '66%', width: '18%', height: '24%' }}
      />

      {/* 5. Housing (Magenta area) */}
      <HitZone 
        label="Village Housing"
        onClick={() => onBuildingClick('townhouse')}
        style={{ top: '18%', left: '84%', width: '14%', height: '18%' }}
      />

      {/* 6. Bounties (Dark Purple area) */}
      <HitZone 
        label="Bounties"
        onClick={() => onBuildingClick('bounties')}
        style={{ top: '65%', left: '78%', width: '14%', height: '22%' }}
      />

      {/* 7. Tavern (Blue area) */}
      <HitZone 
        label="The Tavern"
        onClick={() => onBuildingClick('tavern')}
        style={{ top: '35%', left: '46%', width: '15%', height: '18%' }}
      />

      {/* Secret Lake */}
      <HitZone 
        label="Enchanted Lake"
        onClick={() => onBuildingClick('lake')}
        style={{ top: '28%', left: '16%', width: '8%', height: '8%' }}
      />
    </div>
  );
};

export default IsometricMap;
