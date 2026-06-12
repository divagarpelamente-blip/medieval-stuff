import React, { useState } from 'react';

export default function DebtEvolutionChart({ timePoints, t }) {
  const [tooltip, setTooltip] = useState(null);

  const renderChart = () => {
    if (timePoints.length === 0) {
      return (
        <div className="h-full flex items-center justify-center w-full">
          <p className="text-center text-[10px] text-[#5d4037]/60 italic font-serif">{t('no_records_active_period', 'No debt records')}</p>
        </div>
      );
    }

    const chartWidth = 400;
    const chartHeight = 180;
    const paddingLeft = 45;
    const paddingRight = 15;
    const paddingTop = 15;
    const paddingBottom = 25;
    const plotWidth = chartWidth - paddingLeft - paddingRight;
    const plotHeight = chartHeight - paddingTop - paddingBottom;
    const baselineY = paddingTop + plotHeight / 2;

    const maxVal = Math.max(...timePoints.map(p => Math.max(p.debtAccrual, p.debtPayment)), 1);
    const scale = (plotHeight / 2 - 10) / maxVal;

    const barWidth = Math.max((plotWidth / timePoints.length) - 2, 2);

    return (
      <div className="w-full h-full flex flex-col justify-between select-none relative diverging-chart-container">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full overflow-visible">
          {/* Background Grid */}
          <line x1={paddingLeft} y1={paddingTop} x2={chartWidth - paddingRight} y2={paddingTop} stroke="#8b4513" strokeWidth="0.5" opacity="0.1" strokeDasharray="2 2" />
          <line x1={paddingLeft} y1={baselineY} x2={chartWidth - paddingRight} y2={baselineY} stroke="#8b4513" strokeWidth="1" opacity="0.3" />
          <line x1={paddingLeft} y1={paddingTop + plotHeight} x2={chartWidth - paddingRight} y2={paddingTop + plotHeight} stroke="#8b4513" strokeWidth="0.5" opacity="0.1" strokeDasharray="2 2" />

          {/* Y Axis Labels */}
          <text x={paddingLeft - 5} y={paddingTop + 4} fontSize="8" fill="#5d4037" textAnchor="end" opacity="0.6" className="font-bold">
            +{maxVal.toLocaleString()}
          </text>
          <text x={paddingLeft - 5} y={baselineY + 3} fontSize="8" fill="#5d4037" textAnchor="end" opacity="0.6" className="font-bold">
            0
          </text>
          <text x={paddingLeft - 5} y={paddingTop + plotHeight + 3} fontSize="8" fill="#5d4037" textAnchor="end" opacity="0.6" className="font-bold">
            -{maxVal.toLocaleString()}
          </text>

          {timePoints.map((p, idx) => {
            const x = paddingLeft + (idx + 0.5) * (plotWidth / timePoints.length) - barWidth / 2;
            const accrualHeight = p.debtAccrual * scale;
            const paymentHeight = p.debtPayment * scale;

            return (
              <g 
                key={idx}
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.closest('.diverging-chart-container').getBoundingClientRect();
                  setTooltip({
                    label: p.label,
                    accrual: p.debtAccrual,
                    payment: p.debtPayment,
                    x: e.clientX - rect.left + 15,
                    y: e.clientY - rect.top + 15
                  });
                }}
                onMouseLeave={() => setTooltip(null)}
                className="cursor-crosshair"
              >
                {p.debtAccrual > 0 && (
                  <rect 
                    x={x} 
                    y={baselineY - accrualHeight} 
                    width={barWidth} 
                    height={accrualHeight} 
                    fill="#f43f5e" 
                    rx={1}
                    className="hover:opacity-80 transition-opacity"
                  />
                )}
                {p.debtPayment > 0 && (
                  <rect 
                    x={x} 
                    y={baselineY} 
                    width={barWidth} 
                    height={paymentHeight} 
                    fill="#10b981" 
                    rx={1}
                    className="hover:opacity-80 transition-opacity"
                  />
                )}
                
                {/* X Axis Labels */}
                {(timePoints.length <= 6 || idx % 2 === 0) && (
                  <text x={x + barWidth/2} y={paddingTop + plotHeight + 12} fontSize="8" fill="#5d4037" textAnchor="middle" opacity="0.8" className="font-bold">
                    {p.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {tooltip && (
          <div 
            className="absolute pointer-events-none z-50 bg-[#faf4e5] border border-[#8b4513]/30 rounded-lg p-2 shadow-lg w-max"
            style={{ left: Math.min(tooltip.x, chartWidth - 100), top: Math.max(0, tooltip.y - 60) }}
          >
            <div className="text-[10px] font-black uppercase text-[#8b4513] border-b border-[#8b4513]/20 pb-1 mb-1">
              {tooltip.label}
            </div>
            <div className="space-y-0.5">
              <div className="text-[9px] font-bold text-rose-800 flex justify-between gap-3"><span>Debt Accrued</span> <span>+{tooltip.accrual.toLocaleString()}g</span></div>
              <div className="text-[9px] font-bold text-emerald-800 flex justify-between gap-3"><span>Debt Paid</span> <span>-{tooltip.payment.toLocaleString()}g</span></div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-[#faf4e5]/60 border border-[#8b4513]/25 rounded-xl p-4 shadow-sm flex flex-col h-full">
      <div className="flex justify-between items-center border-b border-[#8b4513]/20 pb-1.5 mb-3 flex-shrink-0">
        <h3 className="title-font text-[11px] font-black text-[#4b2c20] uppercase tracking-wider">{t('debt_evolution', 'Debt Evolution')}</h3>
      </div>
      <div className="flex-grow flex items-center justify-center min-h-[180px]">
        {renderChart()}
      </div>
    </div>
  );
}
