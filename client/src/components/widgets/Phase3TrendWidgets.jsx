import React, { useMemo, useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useKingdomStore } from '../../store/useKingdomStore';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const formatValue = (val) => {
  const num = Number(val) || 0;
  const formattedNum = Math.abs(num).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return num < 0 ? `(${formattedNum})` : formattedNum;
};

export const CashForecast90dWidget = () => {
  const user = useKingdomStore(s => s.user);
  const [forecast, setForecast] = useState(null);

  useEffect(() => {
    if (!user?.id) return;
    const fetchForecast = async () => {
      const { data, error } = await supabase
        .from('vw_cash_flow_forecast_90d')
        .select('*')
        .eq('profile_id', user.id)
        .maybeSingle();
        
      if (!error && data) {
        setForecast(data);
      }
    };
    fetchForecast();
  }, [user?.id]);

  const data = useMemo(() => {
    if (!forecast) return [];
    return [
      { name: 'Today', value: Number(forecast.current_liquid_cash) },
      { name: '+30d', value: Number(forecast.proj_30d) },
      { name: '+60d', value: Number(forecast.proj_60d) },
      { name: '+90d', value: Number(forecast.proj_90d) }
    ];
  }, [forecast]);

  return (
    <div className="w-full h-full min-h-[300px] flex flex-col bg-white border border-gray-200 rounded-xl p-6 shadow-sm overflow-hidden">
      <div className="mb-4 shrink-0">
        <h3 className="text-sm font-sans font-semibold tracking-wide text-gray-500 uppercase">90-Day Cash Forecast</h3>
        <p className="text-xs text-gray-400 mt-1">Projected liquid reserves based on pending flows</p>
      </div>
      <div className="flex-1 w-full min-h-0 relative">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} dy={10} />
              <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <Tooltip 
                formatter={(value) => [formatValue(value) + 'g', 'Projected Cash']}
                contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', color: '#111827', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                labelStyle={{ fontWeight: 600, color: '#6b7280', marginBottom: '4px' }}
              />
              <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-xs font-mono text-gray-400 italic">No projection data available.</div>
        )}
      </div>
    </div>
  );
};
