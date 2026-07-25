import React from 'react';

export default function IsometricMap({ onMineClick, onTreasuryClick }) {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
      {/* We will build the interactive buildings (Mine, Treasury) here in Phase 2 */}
      <div className="bg-black/50 text-white/50 px-4 py-2 rounded-full font-mono text-sm tracking-widest uppercase border border-white/10">
        Map Canvas Ready
      </div>
    </div>
  );
}
