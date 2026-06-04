import React from 'react';

const HitZone = ({ onClick, style, label, disabled = true }) => (
  <div 
    onClick={!disabled ? onClick : undefined}
    className={`absolute transition-all rounded-xl z-50 group border border-transparent ${
      disabled 
        ? 'cursor-not-allowed hover:bg-white/5 hover:border-white/10' 
        : 'cursor-pointer hover:bg-white/10 hover:border-white/20 hover:scale-[1.02] active:scale-95'
    }`}
    style={style}
  >
    {/* Tooltip */}
    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/90 text-[#ffd700] text-[10px] px-3 py-1 rounded-md opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-all border border-[#d4af37]/30 shadow-xl title-font uppercase tracking-widest z-[100]">
       {label} {disabled ? '(Under Construction)' : ''}
    </div>
  </div>
);

const IsometricMap = ({ onMineClick }) => {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* 1. Gold Mine (Active) */}
      <HitZone 
        label="Gold Mine"
        onClick={onMineClick}
        disabled={false}
        style={{ top: '22%', left: '8%', width: '18%', height: '22%' }}
      />

      {/* 2. Treasury (Disabled) */}
      <HitZone 
        label="Royal Treasury"
        disabled={true}
        style={{ top: '48%', left: '12%', width: '32%', height: '38%' }}
      />

      {/* 3. Market (Disabled) */}
      <HitZone 
        label="Central Market"
        disabled={true}
        style={{ top: '42%', left: '60%', width: '25%', height: '25%' }}
      />

      {/* 4. Town Hall (Disabled) */}
      <HitZone 
        label="Town Hall"
        disabled={true}
        style={{ top: '12%', left: '66%', width: '18%', height: '24%' }}
      />

      {/* 5. Housing (Disabled) */}
      <HitZone 
        label="Village Housing"
        disabled={true}
        style={{ top: '18%', left: '84%', width: '14%', height: '18%' }}
      />

      {/* 6. Bounties (Disabled) */}
      <HitZone 
        label="Tributes"
        disabled={true}
        style={{ top: '65%', left: '78%', width: '14%', height: '22%' }}
      />

      {/* 7. Tavern (Disabled) */}
      <HitZone 
        label="The Tavern"
        disabled={true}
        style={{ top: '35%', left: '46%', width: '15%', height: '18%' }}
      />
    </div>
  );
};

export default IsometricMap;
