import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useKingdomStore } from '../../store/useKingdomStore';
import { generateCashFlowData } from '../../utils/chartAnalytics';

export default function HandDrawnCashFlowWidget({ transactions }) {
  const activeTx = transactions || useKingdomStore(s => s.transactions || []);
  const data = useMemo(() => generateCashFlowData(activeTx), [activeTx]);

  return (
    <div className="w-full h-full min-h-[380px] flex flex-col font-[cursive] text-[#2c2825]">
      {/* Hand-drawn Header */}
      <div className="mb-4 text-center border-b-2 border-[#2c2825] border-dashed pb-2 opacity-80" style={{ filter: 'url(#pencil)' }}>
        <h3 className="text-2xl font-bold tracking-widest uppercase">Income vs Expenses</h3>
        <p className="text-sm">~ A Charcoal Record of the Royal Vault ~</p>
      </div>

      <div className="flex-1 w-full min-h-[250px] relative">
        <ResponsiveContainer height="100%" width="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              {/* SVG Magic: Pencil / Charcoal Sketch Effect */}
              <filter id="pencil" x="-20%" y="-20%" width="140%" height="140%">
                <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="3" result="noise" />
                <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G" />
              </filter>
              {/* Charcoal fill shading */}
              <pattern id="hatch-income" patternUnits="userSpaceOnUse" width="4" height="4">
                <path d="M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2" stroke="#2c2825" strokeWidth="0.5" opacity="0.4" />
              </pattern>
              <pattern id="hatch-expense" patternUnits="userSpaceOnUse" width="4" height="4">
                <path d="M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2" stroke="#5a3a31" strokeWidth="1" opacity="0.5" />
              </pattern>
            </defs>

            {/* Uneven grid lines */}
            <CartesianGrid filter="url(#pencil)" opacity={0.2} stroke="#2c2825" strokeDasharray="5 10" vertical={false}/>

            <XAxis 
              dataKey="name" 
              tickLine={false} 
              axisLine={{ stroke: '#2c2825', strokeWidth: 2 }} 
              tick={{ fontSize: 12, fill: '#2c2825', fontFamily: 'cursive' }} 
              filter="url(#pencil)" 
            />
            <YAxis 
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} 
              axisLine={{ stroke: '#2c2825', strokeWidth: 2 }} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: '#2c2825', fontFamily: 'cursive' }} 
              filter="url(#pencil)" 
            />

            <Tooltip 
              contentStyle={{ backgroundColor: 'transparent', border: 'none', fontFamily: 'cursive', color: '#2c2825', fontWeight: 'bold', boxShadow: 'none' }} 
              cursor={{ stroke: '#2c2825', strokeWidth: 2, strokeDasharray: '2 2' }} 
            />

            {/* Income: Graphite */}
            <Area 
              type="monotone" 
              dataKey="income" 
              stroke="#2c2825" 
              strokeWidth={3} 
              fill="url(#hatch-income)" 
              filter="url(#pencil)" 
              activeDot={{ r: 6, fill: '#2c2825' }} 
            />
            
            {/* Expenses: Smudged Brown Coal */}
            <Area 
              type="monotone" 
              dataKey="expenses" 
              stroke="#5a3a31" 
              strokeWidth={3} 
              fill="url(#hatch-expense)" 
              filter="url(#pencil)" 
              activeDot={{ r: 6, fill: '#5a3a31' }} 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
