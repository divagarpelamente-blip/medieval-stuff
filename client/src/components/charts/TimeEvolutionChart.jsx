import React, { useState } from 'react';

export default function TimeEvolutionChart({ timePoints, t }) {
  const [evolutionTooltip, setEvolutionTooltip] = useState(null);
  
  // Interactive 4-line legend state
  const [activeLines, setActiveLines] = useState({
    classIncome: true,
    classExpense: true,
    subReceipt: false,
    subPayment: false
  });

  const toggleLine = (line) => {
    setActiveLines(prev => ({ ...prev, [line]: !prev[line] }));
  };

  const renderChart = () => {
    if (timePoints.length === 0) {
      return (
        <div className="h-full flex items-center justify-center w-full">
          <p className="text-center text-[10px] text-[#5d4037]/60 italic font-serif">{t('no_records_active_period')}</p>
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

    const maxVal = Math.max(...timePoints.map(p => 
      Math.max(
        activeLines.classIncome ? p.classIncome : 0,
        activeLines.classExpense ? p.classExpense : 0,
        activeLines.subReceipt ? p.subReceipt : 0,
        activeLines.subPayment ? p.subPayment : 0
      )
    ), 1);
    const scale = (plotHeight - 10) / maxVal;

    const mappedPoints = timePoints.map((p, idx) => {
      const x = timePoints.length === 1 
        ? paddingLeft + plotWidth / 2 
        : paddingLeft + (idx / (timePoints.length - 1)) * plotWidth;
      
      return {
        label: p.label,
        classIncome: p.classIncome,
        classExpense: p.classExpense,
        subReceipt: p.subReceipt,
        subPayment: p.subPayment,
        x,
        yClassIncome: (paddingTop + plotHeight) - p.classIncome * scale,
        yClassExpense: (paddingTop + plotHeight) - p.classExpense * scale,
        ySubReceipt: (paddingTop + plotHeight) - p.subReceipt * scale,
        ySubPayment: (paddingTop + plotHeight) - p.subPayment * scale,
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

    const handleChartMouseMove = (e, p) => {
      const rect = e.currentTarget.closest('.diverging-chart-container').getBoundingClientRect();
      const x = e.clientX - rect.left + 15;
      const y = e.clientY - rect.top + 15;
      
      setEvolutionTooltip({
        label: p.label,
        classIncome: p.classIncome,
        classExpense: p.classExpense,
        subReceipt: p.subReceipt,
        subPayment: p.subPayment,
        x,
        y
      });
    };

    return (
      <div className="w-full h-full flex flex-col justify-between select-none relative diverging-chart-container">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#059669" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e11d48" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#e11d48" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="receiptGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="paymentGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
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
          {activeLines.classIncome && <path d={getBezierPath(mappedPoints, 'yClassIncome', true)} fill="url(#incomeGradient)" className="transition-all duration-300" />}
          {activeLines.classExpense && <path d={getBezierPath(mappedPoints, 'yClassExpense', true)} fill="url(#expenseGradient)" className="transition-all duration-300" />}
          {activeLines.subReceipt && <path d={getBezierPath(mappedPoints, 'ySubReceipt', true)} fill="url(#receiptGradient)" className="transition-all duration-300" />}
          {activeLines.subPayment && <path d={getBezierPath(mappedPoints, 'ySubPayment', true)} fill="url(#paymentGradient)" className="transition-all duration-300" />}

          {/* Paths */}
          {activeLines.classIncome && <path d={getBezierPath(mappedPoints, 'yClassIncome')} fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-sm transition-all duration-300" />}
          {activeLines.classExpense && <path d={getBezierPath(mappedPoints, 'yClassExpense')} fill="none" stroke="#e11d48" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-sm transition-all duration-300" />}
          {activeLines.subReceipt && <path d={getBezierPath(mappedPoints, 'ySubReceipt')} fill="none" stroke="#10b981" strokeWidth="2" strokeDasharray="4 2" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-sm transition-all duration-300" />}
          {activeLines.subPayment && <path d={getBezierPath(mappedPoints, 'ySubPayment')} fill="none" stroke="#f43f5e" strokeWidth="2" strokeDasharray="4 2" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-sm transition-all duration-300" />}

          {/* Interaction Points */}
          {mappedPoints.map((p, idx) => (
            <g 
              key={idx} 
              onMouseEnter={(e) => handleChartMouseMove(e, p)}
              onMouseMove={(e) => handleChartMouseMove(e, p)}
              onMouseLeave={() => setEvolutionTooltip(null)}
              className="cursor-crosshair"
            >
              {/* Interaction Overlay Rect */}
              <rect x={p.x - 10} y={paddingTop} width="20" height={plotHeight} fill="transparent" />
              
              {/* X Axis Labels (every other point if many) */}
              {(timePoints.length <= 6 || idx % 2 === 0) && (
                <text x={p.x} y={paddingTop + plotHeight + 12} fontSize="8" fill="#5d4037" textAnchor="middle" opacity="0.8" className="font-bold">
                  {p.label}
                </text>
              )}
            </g>
          ))}
        </svg>

        {/* Tooltip */}
        {evolutionTooltip && (
          <div 
            className="absolute pointer-events-none z-50 bg-[#faf4e5] border border-[#8b4513]/30 rounded-lg p-2 shadow-lg w-max"
            style={{ left: Math.min(evolutionTooltip.x, chartWidth - 140), top: Math.max(0, evolutionTooltip.y - 80) }}
          >
            <div className="text-[10px] font-black uppercase text-[#8b4513] border-b border-[#8b4513]/20 pb-1 mb-1">
              {evolutionTooltip.label}
            </div>
            <div className="space-y-0.5">
              {activeLines.classIncome && <div className="text-[9px] font-bold text-emerald-800 flex justify-between gap-3"><span>Income</span> <span>+{evolutionTooltip.classIncome.toLocaleString()}g</span></div>}
              {activeLines.classExpense && <div className="text-[9px] font-bold text-rose-800 flex justify-between gap-3"><span>Expenses</span> <span>-{evolutionTooltip.classExpense.toLocaleString()}g</span></div>}
              {activeLines.subReceipt && <div className="text-[9px] font-bold text-emerald-600 flex justify-between gap-3"><span>Receipts</span> <span>+{evolutionTooltip.subReceipt.toLocaleString()}g</span></div>}
              {activeLines.subPayment && <div className="text-[9px] font-bold text-rose-600 flex justify-between gap-3"><span>Payments</span> <span>-{evolutionTooltip.subPayment.toLocaleString()}g</span></div>}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-[#faf4e5]/60 border border-[#8b4513]/25 rounded-xl p-2.5 shadow-sm flex flex-col h-full">
      <div className="flex justify-center items-center border-b border-[#8b4513]/20 pb-1 mb-2 text-center">
        <div>
          <h3 className="title-font text-xs font-black text-[#4b2c20] uppercase">Financial Position</h3>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2 mb-1.5 justify-center">
        <label className="flex items-center gap-1 cursor-pointer">
          <input type="checkbox" checked={activeLines.classIncome} onChange={() => toggleLine('classIncome')} className="accent-emerald-700 w-3 h-3" />
          <span className="text-[9px] font-black text-emerald-800 uppercase">Income</span>
        </label>
        <label className="flex items-center gap-1 cursor-pointer">
          <input type="checkbox" checked={activeLines.classExpense} onChange={() => toggleLine('classExpense')} className="accent-rose-700 w-3 h-3" />
          <span className="text-[9px] font-black text-rose-800 uppercase">Expenses</span>
        </label>
        <label className="flex items-center gap-1 cursor-pointer">
          <input type="checkbox" checked={activeLines.subReceipt} onChange={() => toggleLine('subReceipt')} className="accent-emerald-500 w-3 h-3" />
          <span className="text-[9px] font-black text-emerald-600 uppercase">Receipts</span>
        </label>
        <label className="flex items-center gap-1 cursor-pointer">
          <input type="checkbox" checked={activeLines.subPayment} onChange={() => toggleLine('subPayment')} className="accent-rose-500 w-3 h-3" />
          <span className="text-[9px] font-black text-rose-600 uppercase">Payments</span>
        </label>
      </div>

      <div className="flex-grow flex items-center justify-center min-h-[135px]">
        {renderChart()}
      </div>
    </div>
  );
}
