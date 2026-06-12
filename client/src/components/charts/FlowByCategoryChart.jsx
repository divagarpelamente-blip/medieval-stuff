import React, { useState } from 'react';

export default function FlowByCategoryChart({ dashCategoryData, t }) {
  const [chartScaleMode, setChartScaleMode] = useState('absolute');

  const [chartTooltip, setChartTooltip] = useState(null);

  const handleChartMouseMove = (e, c, type) => {
    const rect = e.currentTarget.closest('.diverging-chart-container').getBoundingClientRect();
    const x = e.clientX - rect.left + 15;
    const y = e.clientY - rect.top + 15;
    const amount = type === 'income' ? c.income : c.expense;
    const total = dashCategoryData.reduce((acc, curr) => acc + curr.totalClass, 0);
    const percentage = total > 0 ? (amount / total) * 100 : 0;
    
    setChartTooltip({
      name: c.name,
      type,
      amount,
      percentage,
      x,
      y
    });
  };

  const renderChart = () => {
    if (dashCategoryData.length === 0) {
      return (
        <div className="h-full flex items-center justify-center w-full">
          <p className="text-center text-[10px] text-[#5d4037]/60 italic font-serif">{t('no_options_registered')}</p>
        </div>
      );
    }

    const chartWidth = 400;
    const chartHeight = 240;
    const paddingLeft = 55;
    const paddingRight = 15;
    const paddingTop = 20;
    const paddingBottom = 25;
    const plotWidth = chartWidth - paddingLeft - paddingRight;
    const plotHeight = 190;
    const baselineY = paddingTop + plotHeight / 2;

    let maxVal = Math.max(...dashCategoryData.map(c => Math.max(c.income, c.expense)), 1);
    
    // Scale Logic if percentage mode was supported properly (for now, default behavior)
    if (chartScaleMode === 'percentage') {
       // if we wanted to support it we could adapt here. We'll stick to original logic mostly
       maxVal = Math.max(...dashCategoryData.map(c => {
         const total = c.income + c.expense;
         return total > 0 ? Math.max((c.income/total)*100, (c.expense/total)*100) : 1;
       }), 1);
    }

    const scale = 80 / maxVal;

    const ticks = [
      { y: baselineY - 80, val: maxVal, prefix: '+' },
      { y: baselineY - 40, val: maxVal / 2, prefix: '+' },
      { y: baselineY, val: 0, prefix: '' },
      { y: baselineY + 40, val: maxVal / 2, prefix: '-' },
      { y: baselineY + 80, val: maxVal, prefix: '-' }
    ];

    return (
      <div className="w-full h-full flex flex-col justify-between select-none relative">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full">
          {ticks.map((tick, i) => (
            <g key={i}>
              <line 
                x1={paddingLeft} 
                y1={tick.y} 
                x2={chartWidth - paddingRight} 
                y2={tick.y} 
                stroke={i === 2 ? '#8b4513' : '#8b4513'} 
                strokeOpacity={i === 2 ? '0.3' : '0.1'}
                strokeWidth={i === 2 ? '1.5' : '1'} 
                strokeDasharray={i === 2 ? '' : '3 3'} 
              />
              <text 
                x={paddingLeft - 8} 
                y={tick.y + 3} 
                textAnchor="end" 
                className="text-[8px] font-mono font-bold fill-[#5d4037]/75"
              >
                {tick.prefix}{Math.round(tick.val).toLocaleString()}{chartScaleMode === 'percentage' ? '%' : 'g'}
              </text>
            </g>
          ))}

          {dashCategoryData.map((c, idx) => {
            const x = paddingLeft + (idx + 0.5) * (plotWidth / dashCategoryData.length);
            
            let incVal = c.income;
            let expVal = c.expense;
            if (chartScaleMode === 'percentage') {
                const total = c.income + c.expense;
                incVal = total > 0 ? (c.income/total)*100 : 0;
                expVal = total > 0 ? (c.expense/total)*100 : 0;
            }

            const incHeight = incVal * scale;
            const expHeight = expVal * scale;
            
            return (
              <g key={c.name}>
                {c.income > 0 && (
                  <rect
                    x={x - 13}
                    y={baselineY - incHeight}
                    width={10}
                    height={incHeight}
                    fill="#10b981"
                    rx={2}
                    className="transition-all duration-500 ease-out cursor-pointer hover:opacity-80"
                    onMouseEnter={(e) => handleChartMouseMove(e, c, 'income')}
                    onMouseMove={(e) => handleChartMouseMove(e, c, 'income')}
                    onMouseLeave={() => setChartTooltip(null)}
                  />
                )}
                {c.expense > 0 && (
                  <rect
                    x={x + 3}
                    y={baselineY}
                    width={10}
                    height={expHeight}
                    fill="#ef4444"
                    rx={2}
                    className="transition-all duration-500 ease-out cursor-pointer hover:opacity-80"
                    onMouseEnter={(e) => handleChartMouseMove(e, c, 'expense')}
                    onMouseMove={(e) => handleChartMouseMove(e, c, 'expense')}
                    onMouseLeave={() => setChartTooltip(null)}
                  />
                )}
                <text
                  x={x}
                  y={chartHeight - 8}
                  textAnchor="middle"
                  className="text-[9px] font-bold fill-[#4b2c20]"
                >
                  {c.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  return (
    <div className="bg-[#faf4e5]/60 border border-[#8b4513]/25 rounded-xl p-4 shadow-sm flex flex-col h-[340px] diverging-chart-container relative select-none">
      <div className="flex justify-between items-center border-b border-[#8b4513]/10 pb-2 flex-shrink-0">
        <h4 className="title-font text-[11px] font-black text-[#4b2c20] uppercase tracking-wider">
          {t('dashboard.charts.flow_by_category', 'Flow by Category')}
        </h4>
        <div className="flex items-center gap-1">
          <span className="text-[8px] font-sans font-medium text-stone-500 uppercase">{t('dashboard.charts.scale_mode', 'Mode')}:</span>
          <button
            type="button"
            onClick={() => setChartScaleMode(chartScaleMode === 'absolute' ? 'percentage' : 'absolute')}
            className="px-2 py-0.5 rounded bg-[#8b4513]/10 border border-[#8b4513]/20 hover:bg-[#8b4513]/20 text-[8px] font-bold text-[#4b2c20] transition-all cursor-pointer"
          >
            {chartScaleMode === 'absolute' ? t('dashboard.charts.scale_absolute', 'Absolute') : t('dashboard.charts.scale_percentage', 'Percentage')}
          </button>
        </div>
      </div>
      <div className="flex-grow flex items-center justify-center mt-4">
        {renderChart()}
      </div>

      {/* Localized Floating Precision Tooltip Card */}
      {chartTooltip && (
        <div 
          className="absolute bg-[#f4e4bc] border-2 border-[#8b4513] text-[#4b2c20] text-[9.5px] p-2.5 rounded-lg shadow-2xl pointer-events-none z-[120] font-sans w-48 space-y-1 animate-in fade-in duration-100"
          style={{ left: `${chartTooltip.x}px`, top: `${chartTooltip.y}px` }}
        >
          <div 
            className="absolute inset-0 pointer-events-none opacity-20 mix-blend-multiply rounded-md"
            style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/paper-fibers.png')" }}
          />
          <div className="relative font-black text-center border-b border-[#8b4513]/20 pb-1 uppercase tracking-wider title-font text-[#4b2c20]">
            {chartTooltip.name}
          </div>
          <div className="relative flex justify-between gap-2">
            <span className="text-stone-500 font-bold uppercase text-[8px]">{t('type_label', 'Type')}:</span>
            <span className={`font-black uppercase text-[8.5px] ${chartTooltip.type === 'income' ? 'text-emerald-700' : 'text-rose-700'}`}>
              {chartTooltip.type === 'income' ? `🟢 ${t('income')}` : `🔴 ${t('expense')}`}
            </span>
          </div>
          <div className="relative flex justify-between gap-2">
            <span className="text-stone-500 font-bold uppercase text-[8px]">{t('value', 'Gold')}:</span>
            <span className="font-mono font-black">{chartTooltip.amount.toLocaleString()}g</span>
          </div>
          <div className="relative flex justify-between gap-2">
            <span className="text-stone-500 font-bold uppercase text-[8px]">{t('dashboard.charts.segment_percentage', 'Percentage')}:</span>
            <span className="font-mono font-black">{chartTooltip.percentage.toFixed(1)}%</span>
          </div>
        </div>
      )}
    </div>
  );
}
