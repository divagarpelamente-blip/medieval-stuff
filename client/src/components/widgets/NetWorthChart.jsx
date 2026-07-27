import React, { useMemo, useState, useEffect, useRef } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useKingdomStore } from '../../store/useKingdomStore';
import { generateNetTrendData } from '../../utils/chartAnalytics';

export default function NetWorthChart() {
  const cumulativeView = useKingdomStore((state) => state.analytics?.cumulative || []);

  const data = useMemo(() => {
    return generateNetTrendData(cumulativeView);
  }, [cumulativeView]);

  const currentNet = useMemo(() => {
    if (!data || !data.length) return 0;
    return data[data.length - 1].net;
  }, [data]);

  const formatAbsoluteGP = (val) => {
    const num = Number(val);
    const formatted = Math.abs(num).toLocaleString();
    return num < 0 ? `${formatted} GP (Deficit)` : `${formatted} GP`;
  };

  // Spatial Sensor Logic
  const containerRef = useRef(null);
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        if (entry.contentRect.width < 350 || entry.contentRect.height < 280) {
          setIsCompact(true);
        } else {
          setIsCompact(false);
        }
      }
    });

    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div 
      ref={containerRef}
      className={`w-full h-full min-h-0 flex flex-col bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden transition-all duration-200 ${isCompact ? 'p-3 gap-2' : 'p-6 gap-6'}`}
    >
      <div className={`flex ${isCompact ? 'flex-row items-center' : 'flex-col sm:flex-row sm:items-center'} justify-between ${isCompact ? 'gap-2' : 'gap-4'} shrink-0`}>
        <div className="shrink-0 overflow-hidden pr-2">
          <h3 className={`font-sans font-semibold tracking-wide text-gray-500 uppercase truncate ${isCompact ? 'text-[10px] mb-0' : 'text-sm'}`}>
            Asset Growth Trend
          </h3>
          {!isCompact && (
            <p className="text-xs text-gray-400 mt-1 truncate">Tracks the total accumulated balance and financial position.</p>
          )}
        </div>
        
        <div className={`flex items-center ${isCompact ? 'gap-1.5' : 'gap-3'} shrink-0`}>
          <div className={`flex items-center gap-1.5 rounded bg-gray-100 border border-gray-200 font-semibold text-gray-700 font-mono ${isCompact ? 'px-1.5 py-0.5 text-[9px]' : 'px-3 py-1.5 text-xs'}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-gray-600 animate-pulse shrink-0" />
            {!isCompact && <span>Current Position:</span>}
            {formatAbsoluteGP(currentNet)}
          </div>
        </div>
      </div>

      <div className="flex-1 w-full min-h-0 overflow-hidden relative">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 12, right: 8, left: -15, bottom: 4 }}>
            <defs>
              <linearGradient id="netGradientLight" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#111827" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#111827" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid stroke="#f3f4f6" strokeDasharray="3 3" vertical={false} />

            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: 500 }} tickMargin={12} />
            <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: 500 }} tickMargin={8} />

            <Tooltip
              contentStyle={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', color: '#111827', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', padding: '10px 14px' }}
              formatter={(value) => [formatAbsoluteGP(value), 'Net Position']}
              labelStyle={{ fontWeight: 700, color: '#6b7280', marginBottom: '4px' }}
            />

            <Area type="monotone" dataKey="net" stroke="#111827" strokeWidth={2.5} fillOpacity={1} fill="url(#netGradientLight)" dot={{ fill: '#111827', r: 4, strokeWidth: 1, stroke: '#ffffff' }} activeDot={{ r: 6, fill: '#111827', strokeWidth: 0 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}