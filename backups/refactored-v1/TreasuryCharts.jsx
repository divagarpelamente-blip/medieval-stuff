import React from 'react';

export const SavingsNeedle = ({ rate }) => {
  // Map rate from -100% to 100% into angle -90deg to +90deg
  const angle = (rate / 100) * 90; 
  const radian = (angle * Math.PI) / 180;
  const needleX = 100 + 75 * Math.sin(radian);
  const needleY = 110 - 75 * Math.cos(radian);

  return (
    <svg className="w-full h-auto max-h-24 mx-auto" viewBox="0 0 200 130">
      <defs>
        <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#dc2626" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
      </defs>
      {/* Arc */}
      <path 
        d="M 20 110 A 80 80 0 0 1 180 110" 
        fill="none" 
        stroke="url(#gaugeGrad)" 
        strokeWidth="16" 
        strokeLinecap="round"
      />
      {/* Background base */}
      <path 
        d="M 20 110 A 80 80 0 0 1 180 110" 
        fill="none" 
        stroke="rgba(0,0,0,0.05)" 
        strokeWidth="16" 
        strokeLinecap="round"
      />
      {/* Ticks */}
      <line x1="100" y1="30" x2="100" y2="40" stroke="#4b2c20" strokeWidth="2" />
      <line x1="30" y1="110" x2="40" y2="110" stroke="#4b2c20" strokeWidth="2" />
      <line x1="170" y1="110" x2="160" y2="110" stroke="#4b2c20" strokeWidth="2" />

      {/* Needle */}
      <line 
        x1="100" y1="110" 
        x2={needleX} y2={needleY} 
        stroke="#4b2c20" 
        strokeWidth="4" 
        strokeLinecap="round" 
      />
      <circle cx="100" cy="110" r="10" fill="#4b2c20" />
      <circle cx="100" cy="110" r="4" fill="#ffd700" />
      {/* Value */}
      <text x="100" y="125" textAnchor="middle" className="font-black text-xs fill-[#4b2c20]">
        SAVINGS RATE: {rate.toFixed(1)}%
      </text>
    </svg>
  );
};

export const CashFlowChart = ({ monthlyFlows }) => {
  if (monthlyFlows.length === 0) {
    return <div className="h-36 flex items-center justify-center text-xs italic text-stone-500">No records found.</div>;
  }
  const maxVal = Math.max(...monthlyFlows.map(f => Math.max(f.inflow, f.outflow)), 1000);
  const height = 120;
  const width = 280;
  const padding = 20;

  return (
    <svg className="w-full h-40" viewBox={`0 0 ${width} ${height + 20}`}>
      {/* Zero line */}
      <line x1={padding} y1={height/2} x2={width - padding} y2={height/2} stroke="#4b2c20" strokeWidth="1" strokeDasharray="3,3" opacity="0.4" />
      
      {monthlyFlows.map((f, i) => {
        const colWidth = (width - padding*2) / monthlyFlows.length;
        const x = padding + i * colWidth + colWidth/2;
        
        // Inflow bar (above zero)
        const inflowH = (f.inflow / maxVal) * (height/2 - 10);
        // Outflow bar (below zero)
        const outflowH = (f.outflow / maxVal) * (height/2 - 10);
        
        const net = f.inflow - f.outflow;
        const netY = height/2 - (net / maxVal) * (height/2 - 10);

        return (
          <g key={f.label}>
            {/* Inflow bar */}
            <rect 
              x={x - 6} 
              y={height/2 - inflowH} 
              width="5" 
              height={inflowH} 
              fill="#10b981" 
              rx="2"
              opacity="0.85"
            />
            {/* Outflow bar */}
            <rect 
              x={x + 1} 
              y={height/2} 
              width="5" 
              height={outflowH} 
              fill="#dc2626" 
              rx="2"
              opacity="0.85"
            />
            {/* Net point */}
            <circle cx={x} cy={netY} r="3" fill="#374151" stroke="#fff" strokeWidth="1" />
            {/* Label */}
            <text x={x} y={height + 12} textAnchor="middle" className="text-[7px] font-black fill-[#4b2c20] tracking-tighter">
              {(f.label || '').substring(0, 3)}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

export const PenaltiesDoughnut = ({ financials }) => {
  const { interests, lateFees, penalties, tax, losses } = financials;
  const total = interests + lateFees + penalties + tax + losses;

  if (total === 0) {
    return (
      <div className="h-32 flex items-center justify-center text-xs italic text-stone-500">
        No damages (penalties, interest, etc.) recorded.
      </div>
    );
  }

  const categories = [
    { label: 'Interests', val: interests, color: '#f59e0b' },
    { label: 'Late Fees', val: lateFees, color: '#ef4444' },
    { label: 'Penalties', val: penalties, color: '#b91c1c' },
    { label: 'Taxes', val: tax, color: '#4b5563' },
    { label: 'Losses', val: losses, color: '#78350f' }
  ].filter(c => c.val > 0);

  let accumulatedAngle = 0;

  return (
    <div className="flex items-center gap-4">
      {/* Doughnut SVG */}
      <div className="relative w-28 h-28 flex-shrink-0">
        <svg className="w-full h-full" viewBox="0 0 100 100">
          {categories.map((c, i) => {
            const percentage = c.val / total;
            const angle = percentage * 360;
            const startAngle = accumulatedAngle;
            const endAngle = accumulatedAngle + angle;
            accumulatedAngle = endAngle;

            // Arc coordinates
            const x1 = 50 + 35 * Math.cos((startAngle - 90) * Math.PI / 180);
            const y1 = 50 + 35 * Math.sin((startAngle - 90) * Math.PI / 180);
            const x2 = 50 + 35 * Math.cos((endAngle - 90) * Math.PI / 180);
            const y2 = 50 + 35 * Math.sin((endAngle - 90) * Math.PI / 180);
            const largeArcFlag = angle > 180 ? 1 : 0;

            return (
              <path
                key={c.label}
                d={`M ${x1} ${y1} A 35 35 0 ${largeArcFlag} 1 ${x2} ${y2}`}
                fill="none"
                stroke={c.color}
                strokeWidth="12"
              />
            );
          })}
        </svg>
        {/* Cracked Coin Center */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <svg className="w-10 h-10 text-[#ffd700]" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M12 2 A10 10 0 0 0 10 12 L14 14 L11 18 L12 22" fill="none" stroke="#b91c1c" strokeWidth="2.5" />
          </svg>
        </div>
      </div>

      {/* Legend */}
      <div className="flex-1 space-y-1.5">
        {categories.map(c => (
          <div key={c.label} className="flex justify-between items-center text-[10px] font-bold">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
              <span>{c.label}</span>
            </div>
            <span className="font-mono text-[#2d1e1e]">${Math.floor(c.val).toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const WaterfallChart = ({ financials }) => {
  const { inflow, baseExpenses, interests, lateFees, penalties, tax, losses, netSavings } = financials;
  if (inflow === 0) return <div className="h-32 flex items-center justify-center text-xs italic text-stone-500">No inflow data.</div>;

  const steps = [
    { label: 'Inflow', amount: inflow, type: 'start' },
    { label: 'Base Exp', amount: -baseExpenses, type: 'cost' },
    { label: 'Interest', amount: -interests, type: 'cost' },
    { label: 'Late Fee', amount: -lateFees, type: 'cost' },
    { label: 'Penalty', amount: -penalties, type: 'cost' },
    { label: 'Tax/Loss', amount: -(tax + losses), type: 'cost' },
    { label: 'Savings', amount: netSavings, type: 'end' }
  ].filter(s => Math.abs(s.amount) > 0);

  const maxVal = inflow;
  const height = 120;
  const width = 280;
  let currentY = 0;

  return (
    <svg className="w-full h-36" viewBox={`0 0 ${width} ${height + 20}`}>
      {steps.map((s, i) => {
        const colWidth = width / steps.length;
        const x = i * colWidth + 5;
        const w = colWidth - 10;

        let y, h, fill;
        if (s.type === 'start') {
          y = 10;
          h = (s.amount / maxVal) * (height - 20);
          fill = '#10b981';
          currentY = y + h;
        } else if (s.type === 'end') {
          y = height - (s.amount / maxVal) * (height - 20);
          h = (s.amount / maxVal) * (height - 20);
          fill = s.amount > 0 ? '#10b981' : '#dc2626';
        } else {
          const costH = (Math.abs(s.amount) / maxVal) * (height - 20);
          y = currentY;
          h = costH;
          fill = '#ef4444';
          currentY = y + costH;
        }

        return (
          <g key={s.label}>
            <rect x={x} y={y} width={w} height={Math.max(2, h)} fill={fill} rx="2" opacity="0.9" />
            <text x={x + w/2} y={height + 12} textAnchor="middle" className="text-[6.5px] font-black fill-[#4b2c20]">
              {s.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
};
