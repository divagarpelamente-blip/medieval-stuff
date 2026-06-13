import React, { useState } from 'react';

export default function PayablesReceivablesSplineChart({ prTimePoints = [], t }) {
  const [tooltip, setTooltip] = useState(null);
  const [activeLines, setActiveLines] = useState({
    payables: true,
    receivables: true
  });

  const toggleLine = (line) => {
    setActiveLines(prev => ({ ...prev, [line]: !prev[line] }));
  };

  const renderChart = () => {
    if (prTimePoints.length === 0) {
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

    const maxVal = Math.max(...prTimePoints.map(p => 
      Math.max(
        activeLines.payables ? p.payables : 0,
        activeLines.receivables ? p.receivables : 0
      )
    ), 1);
    
    const scale = (plotHeight - 10) / maxVal;

    const mappedPoints = prTimePoints.map((p, idx) => {
      const x = prTimePoints.length === 1 
        ? paddingLeft + plotWidth / 2 
        : paddingLeft + (idx / (prTimePoints.length - 1)) * plotWidth;
      
      return {
        label: p.label,
        payables: p.payables,
        receivables: p.receivables,
        x,
        yPayables: (paddingTop + plotHeight) - p.payables * scale,
        yReceivables: (paddingTop + plotHeight) - p.receivables * scale,
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
        payables: p.payables,
        receivables: p.receivables,
        x: e.clientX - rect.left + 15,
        y: e.clientY - rect.top + 15
      });
    };

    return (
      <div className="w-full h-full flex flex-col justify-between select-none relative diverging-chart-container">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="payablesGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e11d48" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#e11d48" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="receivablesGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#059669" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Background Grid */}
          <line x1={paddingLeft} y1={paddingTop} x2={chartWidth - paddingRight} y2={paddingTop} stroke="#8b4513" strokeWidth="0.5" opacity="0.1" strokeDasharray="2 2" />
          <line x1={paddingLeft} y1={paddingTop + plotHeight/2} x2={chartWidth - paddingRight} y2={paddingTop + plotHeight/2} stroke="#8b4513" strokeWidth="0.5" opacity="0.1" strokeDasharray="2 2" />
          <line x1={paddingLeft} y1={paddingTop + plotHeight} x2={chartWidth - paddingRight} y2={paddingTop + plotHeight} stroke="#8b4513" strokeWidth="1" opacity="0.2" />

          {/* Y Axis Labels */}
          <text x={paddingLeft - 5} y={paddingTop + 4} fontSize="8" fill="#5d4037" textAnchor="end" opacity="0.6" className="font-bold">
            {maxVal.toLocaleString()}
          </text>
          <text x={paddingLeft - 5} y={paddingTop + plotHeight/2 + 3} fontSize="8" fill="#5d4037" textAnchor="end" opacity="0.6" className="font-bold">
            {(maxVal/2).toLocaleString()}
          </text>
          <text x={paddingLeft - 5} y={paddingTop + plotHeight} fontSize="8" fill="#5d4037" textAnchor="end" opacity="0.6" className="font-bold">
            0
          </text>

          {/* Area Fills */}
          {activeLines.payables && <path d={getBezierPath(mappedPoints, 'yPayables', true)} fill="url(#payablesGradient)" className="transition-all duration-300" />}
          {activeLines.receivables && <path d={getBezierPath(mappedPoints, 'yReceivables', true)} fill="url(#receivablesGradient)" className="transition-all duration-300" />}

          {/* Paths */}
          {activeLines.payables && <path d={getBezierPath(mappedPoints, 'yPayables')} fill="none" stroke="#e11d48" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-sm transition-all duration-300" />}
          {activeLines.receivables && <path d={getBezierPath(mappedPoints, 'yReceivables')} fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-sm transition-all duration-300" />}

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
              
              {(prTimePoints.length <= 6 || idx % 2 === 0) && (
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
            style={{ left: Math.min(tooltip.x, chartWidth - 140), top: Math.max(0, tooltip.y - 60) }}
          >
            <div className="text-[10px] font-black uppercase text-[#8b4513] border-b border-[#8b4513]/20 pb-1 mb-1">
              {tooltip.label}
            </div>
            <div className="space-y-0.5">
              {activeLines.payables && (
                <div className="text-[9px] font-bold text-rose-800 flex justify-between gap-3">
                  <span>Payables</span> <span>+{tooltip.payables.toLocaleString()}g</span>
                </div>
              )}
              {activeLines.receivables && (
                <div className="text-[9px] font-bold text-emerald-800 flex justify-between gap-3">
                  <span>Receivables</span> <span>+{tooltip.receivables.toLocaleString()}g</span>
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
          {t('chart_payables_vs_receivables', 'Payables & Receivables Evolution')}
        </h3>
      </div>
      
      <div className="flex gap-4 mb-3 justify-center">
        <label className="flex items-center gap-1 cursor-pointer">
          <input type="checkbox" checked={activeLines.payables} onChange={() => toggleLine('payables')} className="accent-rose-700 w-3 h-3" />
          <span className="text-[9px] font-black text-rose-800 uppercase">Payables</span>
        </label>
        <label className="flex items-center gap-1 cursor-pointer">
          <input type="checkbox" checked={activeLines.receivables} onChange={() => toggleLine('receivables')} className="accent-emerald-700 w-3 h-3" />
          <span className="text-[9px] font-black text-emerald-800 uppercase">Receivables</span>
        </label>
      </div>

      <div className="flex-grow flex items-center justify-center min-h-[180px]">
        {renderChart()}
      </div>
    </div>
  );
}
