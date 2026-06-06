import React, { useState } from 'react';

export default function TimeEvolutionChart({ timePoints, t }) {
  const [evolutionTooltip, setEvolutionTooltip] = useState(null);

  const renderChart = () => {
    if (timePoints.length === 0) {
      return (
        <div className="h-full flex items-center justify-center w-full">
          <p className="text-center text-[10px] text-[#5d4037]/60 italic font-serif">{t('no_records_active_period')}</p>
        </div>
      );
    }

    const chartWidth = 400;
    const chartHeight = 200;
    const paddingLeft = 45;
    const paddingRight = 15;
    const paddingTop = 15;
    const paddingBottom = 20;
    const plotWidth = chartWidth - paddingLeft - paddingRight;
    const plotHeight = chartHeight - paddingTop - paddingBottom;

    const maxVal = Math.max(...timePoints.map(p => Math.max(p.income, p.expense)), 1);
    const scale = (plotHeight - 10) / maxVal;

    const mappedPoints = timePoints.map((p, idx) => {
      const x = timePoints.length === 1 
        ? paddingLeft + plotWidth / 2 
        : paddingLeft + (idx / (timePoints.length - 1)) * plotWidth;
      
      const yIncome = (paddingTop + plotHeight) - p.income * scale;
      const yExpense = (paddingTop + plotHeight) - p.expense * scale;

      return {
        label: p.label,
        income: p.income,
        expense: p.expense,
        x,
        yIncome,
        yExpense
      };
    });

    const getBezierPath = (pts, key) => {
      if (pts.length === 0) return '';
      if (pts.length === 1) return `M ${pts[0].x} ${pts[0][key]}`;
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
      return d;
    };

    const getAreaPath = (pts, key) => {
      if (pts.length === 0) return '';
      const linePath = getBezierPath(pts, key);
      const firstX = pts[0].x;
      const lastX = pts[pts.length - 1].x;
      const bottomY = paddingTop + plotHeight;
      return `${linePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
    };

    const incomePath = getBezierPath(mappedPoints, 'yIncome');
    const incomeAreaPath = getAreaPath(mappedPoints, 'yIncome');

    const expensePath = getBezierPath(mappedPoints, 'yExpense');
    const expenseAreaPath = getAreaPath(mappedPoints, 'yExpense');

    const ticks = [
      (paddingTop + plotHeight) - maxVal * scale,
      (paddingTop + plotHeight) - (maxVal / 2) * scale,
      (paddingTop + plotHeight)
    ];
    const tickVals = [maxVal, maxVal / 2, 0];

    const handleMouseMove = (e, p) => {
      const rect = e.currentTarget.closest('.evolution-chart-container').getBoundingClientRect();
      const x = e.clientX - rect.left + 15;
      const y = e.clientY - rect.top + 15;
      setEvolutionTooltip({
        label: p.label,
        income: p.income,
        expense: p.expense,
        x,
        y
      });
    };

    return (
      <div className="w-full h-full flex flex-col justify-between select-none relative evolution-chart-container">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full">
          <defs>
            <linearGradient id="inc-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="exp-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {ticks.map((yVal, i) => (
            <g key={i}>
              <line 
                x1={paddingLeft} 
                y1={yVal} 
                x2={chartWidth - paddingRight} 
                y2={yVal} 
                stroke="#8b4513" 
                strokeOpacity={i === 2 ? '0.2' : '0.08'} 
                strokeWidth={i === 2 ? '1.5' : '1'} 
                strokeDasharray={i === 2 ? '' : '3 3'} 
              />
              <text 
                x={paddingLeft - 8} 
                y={yVal + 3} 
                textAnchor="end" 
                className="text-[8px] font-mono font-bold fill-[#5d4037]/75"
              >
                {Math.round(tickVals[i]).toLocaleString()}g
              </text>
            </g>
          ))}

          {mappedPoints.length > 0 && (
            <>
              <path d={incomeAreaPath} fill="url(#inc-grad)" />
              <path d={expenseAreaPath} fill="url(#exp-grad)" />
            </>
          )}

          {mappedPoints.length > 0 && (
            <>
              <path d={incomePath} fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
              <path d={expensePath} fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
            </>
          )}

          {mappedPoints.map((p, i) => (
            <g key={i}>
              <circle
                cx={p.x}
                cy={p.yIncome}
                r={4}
                fill="#f4e4bc"
                stroke="#10b981"
                strokeWidth={2}
                className="cursor-crosshair hover:r-6 hover:fill-[#10b981] transition-all"
                onMouseEnter={(e) => handleMouseMove(e, p)}
                onMouseMove={(e) => handleMouseMove(e, p)}
                onMouseLeave={() => setEvolutionTooltip(null)}
              />
              <circle
                cx={p.x}
                cy={p.yExpense}
                r={4}
                fill="#f4e4bc"
                stroke="#ef4444"
                strokeWidth={2}
                className="cursor-crosshair hover:r-6 hover:fill-[#ef4444] transition-all"
                onMouseEnter={(e) => handleMouseMove(e, p)}
                onMouseMove={(e) => handleMouseMove(e, p)}
                onMouseLeave={() => setEvolutionTooltip(null)}
              />
            </g>
          ))}

          {mappedPoints.map((p, i) => {
            const interval = Math.ceil(mappedPoints.length / 6);
            if (i % interval !== 0 && i !== mappedPoints.length - 1) return null;
            return (
              <text
                key={i}
                x={p.x}
                y={chartHeight - 4}
                textAnchor="middle"
                className="text-[8px] font-sans font-bold fill-[#5d4037]/75"
              >
                {p.label}
              </text>
            );
          })}
        </svg>

        {evolutionTooltip && (
          <div 
            className="absolute bg-[#f4e4bc] border-2 border-[#8b4513] text-[#4b2c20] text-[9px] p-2 rounded shadow-2xl pointer-events-none z-[120] font-sans w-36 space-y-1 animate-in fade-in duration-100"
            style={{ left: `${evolutionTooltip.x}px`, top: `${evolutionTooltip.y}px` }}
          >
            <div 
              className="absolute inset-0 pointer-events-none opacity-20 mix-blend-multiply rounded"
              style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/paper-fibers.png')" }}
            />
            <div className="relative font-black text-center border-b border-[#8b4513]/20 pb-0.5 uppercase tracking-wider text-[#4b2c20]">
              {evolutionTooltip.label}
            </div>
            <div className="relative flex justify-between">
              <span className="text-emerald-700 font-bold uppercase text-[7.5px]">{t('income', 'Income')}:</span>
              <span className="font-mono font-black">+{evolutionTooltip.income.toLocaleString()}g</span>
            </div>
            <div className="relative flex justify-between">
              <span className="text-rose-700 font-bold uppercase text-[7.5px]">{t('expense', 'Expense')}:</span>
              <span className="font-mono font-black">-{evolutionTooltip.expense.toLocaleString()}g</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-[#faf4e5]/60 border border-[#8b4513]/25 rounded-xl p-4 shadow-sm flex flex-col h-[340px]">
      <h4 className="title-font text-[11px] font-black text-[#4b2c20] uppercase tracking-wider border-b border-[#8b4513]/10 pb-1.5 flex justify-between flex-shrink-0">
        <span>{t('time_evolution', 'Time Evolution')}</span>
        <span className="text-[8px] font-sans font-medium text-stone-500 normal-case">{t('evolution_spline_label', 'Income vs Expenses Spline')}</span>
      </h4>
      <div className="flex-grow flex items-center justify-center mt-4 w-full">
        {renderChart()}
      </div>
    </div>
  );
}
