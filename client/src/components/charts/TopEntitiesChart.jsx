import React from 'react';

export default function TopEntitiesChart({ entityVolumes, percentUsed, t }) {
  const renderChart = () => {
    if (entityVolumes.length === 0) {
      return (
        <div className="h-full flex items-center justify-center">
          <p className="text-center text-[10px] text-[#5d4037]/60 italic font-serif">{t('no_commercial_record')}</p>
        </div>
      );
    }

    const topEntitiesTotalVolume = entityVolumes.reduce((sum, ent) => sum + ent.total, 0);
    const R = 45;
    const Circumference = 2 * Math.PI * R;
    const colors = ['#8b4513', '#d4af37', '#cd7f32', '#568f63', '#a0522d'];

    let accumulatedPercent = 0;

    return (
      <div className="w-full h-full flex flex-col sm:flex-row items-center justify-center gap-6">
        <div className="relative w-28 h-28 flex-shrink-0">
          <svg viewBox="0 0 110 110" className="w-full h-full transform -rotate-90">
            <circle
              cx="55"
              cy="55"
              r={R}
              fill="transparent"
              stroke="#faf4e5"
              strokeWidth="10"
            />
            {entityVolumes.map((ent, idx) => {
              const percent = (ent.total / topEntitiesTotalVolume) * 100;
              const strokeDashoffset = Circumference - (percent / 100) * Circumference;
              const strokeDasharray = `${Circumference} ${Circumference}`;
              const rotation = (accumulatedPercent / 100) * 360;
              accumulatedPercent += percent;

              return (
                <circle
                  key={ent.name}
                  cx="55"
                  cy="55"
                  r={R}
                  fill="transparent"
                  stroke={colors[idx % colors.length]}
                  strokeWidth="10"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  transform={`rotate(${rotation} 55 55)`}
                  className="transition-all duration-500 ease-out"
                />
              );
            })}
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
            <span className="font-mono font-black text-[10px] text-[#4b2c20] leading-none mb-0.5">
              {percentUsed.toFixed(1)}%
            </span>
            <span className="font-sans font-bold text-[6px] text-stone-500 uppercase tracking-wider leading-tight">
              of Total
            </span>
            <span className="font-sans font-bold text-[6px] text-[#5d4037] uppercase tracking-wider leading-tight">
              Income Used
            </span>
          </div>
        </div>

        <div className="flex-1 w-full max-h-[110px] overflow-y-auto custom-scrollbar-subtle">
          <table className="w-full text-left border-collapse text-[8.5px] font-sans">
            <thead>
              <tr className="border-b border-[#8b4513]/10 text-[#4b2c20] font-black uppercase tracking-wider">
                <th className="py-1">{t('entidade_header', 'Entity')}</th>
                <th className="py-1 text-right">{t('total_header', 'Total')}</th>
                <th className="py-1 text-right">%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#8b4513]/5 text-stone-700 font-bold">
              {entityVolumes.map((ent, idx) => {
                const percent = (ent.total / topEntitiesTotalVolume) * 100;
                return (
                  <tr key={ent.name} className="hover:bg-[#8b4513]/5">
                    <td className="py-1 flex items-center gap-1 font-bold text-[#4b2c20] truncate max-w-[80px]">
                      <span className="w-1.5 h-1.5 rounded-full inline-block flex-shrink-0" style={{ backgroundColor: colors[idx % colors.length] }} />
                      {ent.name}
                    </td>
                    <td className="py-1 text-right font-mono font-black">{ent.total.toLocaleString()}g</td>
                    <td className="py-1 text-right font-mono text-[#5d4037]/60">{percent.toFixed(1)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-[#faf4e5]/60 border border-[#8b4513]/25 rounded-xl p-4 shadow-sm flex flex-col h-[240px]">
      <h4 className="title-font text-[11px] font-black text-[#4b2c20] uppercase tracking-wider border-b border-[#8b4513]/10 pb-1.5 flex justify-between flex-shrink-0">
        <span>{t('top_entities', 'Top Entities')}</span>
        <span className="text-[8px] font-sans font-medium text-stone-500 normal-case">{t('by_gold_volume', 'by volume')}</span>
      </h4>
      <div className="flex-grow flex items-center justify-center mt-3 overflow-hidden">
        {renderChart()}
      </div>
    </div>
  );
}
