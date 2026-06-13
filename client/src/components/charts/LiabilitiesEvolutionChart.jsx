import React, { useState } from 'react';

export default function LiabilitiesEvolutionChart({ liabilitiesTimePoints = [], t }) {
  const [tooltip, setTooltip] = useState(null);
  const [activeLines, setActiveLines] = useState({
    totalDebt: true,
    toBePaid: true,
    newDebt: true,
    amortization: true
  });

  const toggleLine = (line) => {
    setActiveLines(prev => ({ ...prev, [line]: !prev[line] }));
  };

  const renderChart = () => {
    if (liabilitiesTimePoints.length === 0) {
      return (
        <div className="h-full flex items-center justify-center w-full">
          <p className="text-center text-[10px] text-[#5d4037]/60 italic font-serif">
            {t('no_records_active_period', 'No commercial records in the active period.')}
          </p>
        </div>
      );
    }

    const chartWidth = 400;
    const chartHeight = 180;
    const paddingLeft = 45;
    const paddingRight = 15;
    const paddingTop = 15;
    const paddingBottom = 20;
    const plotWidth = chartWidth - paddingLeft - paddingRight;
    const plotHeight = chartHeight - paddingTop - paddingBottom;

    const maxVal = Math.max(...liabilitiesTimePoints.map(p => 
      Math.max(
        activeLines.totalDebt ? p.totalDebt : 0,
        activeLines.toBePaid ? p.toBePaid : 0,
        activeLines.newDebt ? p.newDebt : 0,
        activeLines.amortization ? p.amortization : 0
      )
    ), 1);
    
    const scale = (plotHeight - 10) / maxVal;

    const mappedPoints = liabilitiesTimePoints.map((p, idx) => {
      const x = liabilitiesTimePoints.length === 1 
        ? paddingLeft + plotWidth / 2 
        : paddingLeft + (idx / (liabilitiesTimePoints.length - 1)) * plotWidth;
      
      return {
        label: p.label,
        totalDebt: p.totalDebt,
        toBePaid: p.toBePaid,
        newDebt: p.newDebt,
        amortization: p.amortization,
        x,
        yTotalDebt: (paddingTop + plotHeight) - p.totalDebt * scale,
        yToBePaid: (paddingTop + plotHeight) - p.toBePaid * scale,
        yNewDebt: (paddingTop + plotHeight) - p.newDebt * scale,
        yAmortization: (paddingTop + plotHeight) - p.amortization * scale,
        yBase: paddingTop + plotHeight
      };
    });

    const getBezierPath = (pts, key, fill = false) => {
      if (pts.length === 0) return '';
      if (pts.length === 1) {
        if (fill) return `M ${pts[0].x} ${pts[0].yBase} L ${pts[0].x} ${pts[0][key]} L ${pts[0].x} ${pts[0].yBase} Z`;
        return `M ${pts[0].x} ${pts[0][key]}`;
      }
      let d = `M ${pts[0].x} ${pts[0][key]}`;
      for (let i = 0; i < pts.length - 1; i++) {
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const cpX1 = p1.x + (p2.x - p1.x) / 2;
        const cpY1 = p1[key];
        const cpX2 = p2.x - (p2.x - p1.x) / 2;
        const cpY2 = p2[key];
        d += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p2.x} ${p2[key]}`;
      }
      if (fill) {
        d += ` L ${pts[pts.length - 1].x} ${pts[pts.length - 1].yBase}`;
        d += ` L ${pts[0].x} ${pts[0].yBase} Z`;
      }
      return d;
    };

    const handleMouseMove = (e, p) => {
      const rect = e.currentTarget.closest('.diverging-chart-container').getBoundingClientRect();
      setTooltip({
        label: p.label,
        totalDebt: p.totalDebt,
        toBePaid: p.toBePaid,
        newDebt: p.newDebt,
        amortization: p.amortization,
        x: e.clientX - rect.left + 15,
        y: e.clientY - rect.top + 15
      });
    };

    return (
      <div className="w-full h-full flex flex-col justify-between select-none relative diverging-chart-container">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="totalDebtGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4b2c20" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#4b2c20" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="toBePaidGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#b45309" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#b45309" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="newDebtGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#be185d" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#be185d" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="amortizationGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#047857" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#047857" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Background Grid */}
          <line x1={paddingLeft} y1={paddingTop} x2={chartWidth - paddingRight} y2={paddingTop} stroke="#8b4513" strokeWidth="0.5" opacity="0.1" strokeDasharray="2 2" />
          <line x1={paddingLeft} y1={paddingTop + plotHeight/2} x2={chartWidth - paddingRight} y2={paddingTop + plotHeight/2} stroke="#8b4513" strokeWidth="0.5" opacity="0.1" strokeDasharray="2 2" />
          <line x1={paddingLeft} y1={paddingTop + plotHeight} x2={chartWidth - paddingRight} y2={paddingTop + plotHeight} stroke="#8b4513" strokeWidth="1" opacity="0.2" />

          {/* Y Axis Labels */}
          <text x={paddingLeft - 5} y={paddingTop + 4} fontSize="8" fill="#5d4037" textAnchor="end" opacity="0.6" className="font-bold font-mono">
            {maxVal.toLocaleString()}
          </text>
          <text x={paddingLeft - 5} y={paddingTop + plotHeight/2 + 3} fontSize="8" fill="#5d4037" textAnchor="end" opacity="0.6" className="font-bold font-mono">
            {Math.round(maxVal/2).toLocaleString()}
          </text>
          <text x={paddingLeft - 5} y={paddingTop + plotHeight} fontSize="8" fill="#5d4037" textAnchor="end" opacity="0.6" className="font-bold font-mono">
            0
          </text>

          {/* Area Fills */}
          {activeLines.totalDebt && <path d={getBezierPath(mappedPoints, 'yTotalDebt', true)} fill="url(#totalDebtGradient)" className="transition-all duration-300" />}
          {activeLines.toBePaid && <path d={getBezierPath(mappedPoints, 'yToBePaid', true)} fill="url(#toBePaidGradient)" className="transition-all duration-300" />}
          {activeLines.newDebt && <path d={getBezierPath(mappedPoints, 'yNewDebt', true)} fill="url(#newDebtGradient)" className="transition-all duration-300" />}
          {activeLines.amortization && <path d={getBezierPath(mappedPoints, 'yAmortization', true)} fill="url(#amortizationGradient)" className="transition-all duration-300" />}

          {/* Paths */}
          {activeLines.totalDebt && <path d={getBezierPath(mappedPoints, 'yTotalDebt')} fill="none" stroke="#4b2c20" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-sm transition-all duration-300" />}
          {activeLines.toBePaid && <path d={getBezierPath(mappedPoints, 'yToBePaid')} fill="none" stroke="#b45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-sm transition-all duration-300" />}
          {activeLines.newDebt && <path d={getBezierPath(mappedPoints, 'yNewDebt')} fill="none" stroke="#be185d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-sm transition-all duration-300" />}
          {activeLines.amortization && <path d={getBezierPath(mappedPoints, 'yAmortization')} fill="none" stroke="#047857" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-sm transition-all duration-300" />}

          {/* Interaction Points */}
          {mappedPoints.map((p, idx) => (
            <g 
              key={idx} 
              onMouseEnter={(e) => handleMouseMove(e, p)}
              onMouseMove={(e) => handleMouseMove(e, p)}
              onMouseLeave={() => setTooltip(null)}
              className="cursor-crosshair"
            >
              <rect x={p.x - 10} y={paddingTop} width="20" height={plotHeight} fill="transparent" />
              
              {(liabilitiesTimePoints.length <= 6 || idx % 2 === 0) && (
                <text x={p.x} y={paddingTop + plotHeight + 12} fontSize="8" fill="#5d4037" textAnchor="middle" opacity="0.8" className="font-bold">
                  {p.label}
                </text>
              )}
            </g>
          ))}
        </svg>

        {tooltip && (
          <div 
            className="absolute pointer-events-none z-50 bg-[#faf4e5] border border-[#8b4513]/30 rounded-lg p-2 shadow-lg w-max"
            style={{ left: Math.min(tooltip.x, chartWidth - 140), top: Math.max(0, tooltip.y - 80) }}
          >
            <div className="text-[10px] font-black uppercase text-[#8b4513] border-b border-[#8b4513]/20 pb-1 mb-1 font-serif">
              {tooltip.label}
            </div>
            <div className="space-y-1 font-mono">
              {activeLines.totalDebt && (
                <div className="text-[9px] font-bold text-[#4b2c20] flex justify-between gap-3">
                  <span>Total Debt</span> <span>{tooltip.totalDebt.toLocaleString()}g</span>
                </div>
              )}
              {activeLines.toBePaid && (
                <div className="text-[9px] font-bold text-amber-800 flex justify-between gap-3">
                  <span>To Be Paid</span> <span>{tooltip.toBePaid.toLocaleString()}g</span>
                </div>
              )}
              {activeLines.newDebt && (
                <div className="text-[9px] font-bold text-pink-800 flex justify-between gap-3">
                  <span>New Debt</span> <span>{tooltip.newDebt.toLocaleString()}g</span>
                </div>
              )}
              {activeLines.amortization && (
                <div className="text-[9px] font-bold text-emerald-800 flex justify-between gap-3">
                  <span>Amortization</span> <span>{tooltip.amortization.toLocaleString()}g</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-[#faf4e5]/60 border border-[#8b4513]/25 rounded-xl p-4 shadow-sm flex flex-col h-full">
      <div className="flex justify-center items-center border-b border-[#8b4513]/20 pb-1.5 mb-3 flex-shrink-0 text-center">
        <h3 className="title-font text-[11px] font-black text-[#4b2c20] uppercase tracking-wider">
          {t('chart_liabilities_evolution', 'Liabilities Evolution')}
        </h3>
      </div>
      
      <div className="flex flex-wrap gap-x-3 gap-y-1 mb-3 justify-center">
        <label className="flex items-center gap-1 cursor-pointer">
          <input type="checkbox" checked={activeLines.totalDebt} onChange={() => toggleLine('totalDebt')} className="accent-[#4b2c20] w-3 h-3" />
          <span className="text-[8px] sm:text-[9px] font-black text-[#4b2c20] uppercase">Total Debt</span>
        </label>
        <label className="flex items-center gap-1 cursor-pointer">
          <input type="checkbox" checked={activeLines.toBePaid} onChange={() => toggleLine('toBePaid')} className="accent-amber-700 w-3 h-3" />
          <span className="text-[8px] sm:text-[9px] font-black text-amber-800 uppercase">To Be Paid</span>
        </label>
        <label className="flex items-center gap-1 cursor-pointer">
          <input type="checkbox" checked={activeLines.newDebt} onChange={() => toggleLine('newDebt')} className="accent-pink-700 w-3 h-3" />
          <span className="text-[8px] sm:text-[9px] font-black text-pink-800 uppercase">New Debt</span>
        </label>
        <label className="flex items-center gap-1 cursor-pointer">
          <input type="checkbox" checked={activeLines.amortization} onChange={() => toggleLine('amortization')} className="accent-emerald-700 w-3 h-3" />
          <span className="text-[8px] sm:text-[9px] font-black text-emerald-800 uppercase">Amortization</span>
        </label>
      </div>

      <div className="flex-grow flex items-center justify-center min-h-[180px]">
        {renderChart()}
      </div>
    </div>
  );
}
