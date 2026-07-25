import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useKingdomStore } from '../../store/useKingdomStore';
import { generateCashFlowData, generateNetTrendData, generateCumulativeCashFlowData } from '../../utils/chartAnalytics';

// 1. Importa a imagem do pergaminho
import parchmentBg from '../../assets/Parchement_01.jfif';

const formatValue = (val) => {
  const num = Number(val) || 0;
  const formattedNum = Math.abs(num).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return num < 0 ? `(${formattedNum})` : formattedNum;
};

// 2. Adiciona 'bgImage' às propriedades (props) do componente base
const TrendChartCard = ({ title, subtitle, data, dataKey, xAxisKey, color, isNegative, bgImage }) => (
  <div 
    // 3. Aplica as classes Tailwind dinamicamente consoante a existência da imagem
    className={`w-full h-full min-h-[300px] flex flex-col border border-gray-200 rounded-xl p-6 shadow-sm relative overflow-hidden ${
      bgImage ? 'bg-cover bg-center bg-no-repeat' : 'bg-white'
    }`}
    style={bgImage ? { backgroundImage: `url(${bgImage})` } : {}}
  >
    {/* Opcional: Um overlay leve para garantir que a grelha e o texto se leem bem por cima da textura */}
    {bgImage && <div className="absolute inset-0 bg-white/40 pointer-events-none" />}

    <div className="mb-4 relative z-10">
      <h3 className={`text-sm font-sans font-semibold tracking-wide uppercase ${bgImage ? 'text-stone-800' : 'text-gray-500'}`}>
        {title}
      </h3>
      <p className={`text-xs mt-1 ${bgImage ? 'text-stone-600 font-medium' : 'text-gray-400'}`}>
        {subtitle}
      </p>
    </div>
    
    <div className="flex-1 w-full min-h-0 overflow-hidden relative z-10">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id={`color-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={bgImage ? 0.4 : 0.2} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={bgImage ? "#a8a29e" : "#f3f4f6"} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey={xAxisKey} axisLine={false} tickLine={false} tickMargin={10} tick={{ fontSize: 11, fill: bgImage ? '#5c524b' : '#9ca3af', fontWeight: bgImage ? 600 : 400 }} />
          <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: bgImage ? '#5c524b' : '#9ca3af', fontWeight: bgImage ? 600 : 400 }} axisLine={false} tickLine={false} />
          <Tooltip
            formatter={(value) => [formatValue(isNegative ? Math.abs(value) : value), title]}
            contentStyle={{ backgroundColor: bgImage ? 'rgba(255, 255, 255, 0.85)' : '#ffffff', backdropFilter: 'blur(4px)', border: '1px solid #e5e7eb', borderRadius: '8px', color: '#111827', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
            labelStyle={{ fontWeight: 600, color: '#6b7280', marginBottom: '4px' }}
          />
          <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2.5} fill={`url(#color-${dataKey})`} fillOpacity={1} dot={{ r: 4, strokeWidth: 1 }} activeDot={{ r: 6 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </div>
);

export const IncomeTrendWidget = () => {
  const monthlyView = useKingdomStore((state) => state.analytics?.monthly || []);
  const data = useMemo(() => generateCashFlowData(monthlyView), [monthlyView]);
  return <TrendChartCard color="#10b981" data={data} dataKey="income" subtitle="Historical monthly revenue velocity" title="Income Trend" xAxisKey="name" />;
};

export const ExpenseTrendWidget = () => {
  const monthlyView = useKingdomStore((state) => state.analytics?.monthly || []);
  const data = useMemo(() => generateCashFlowData(monthlyView), [monthlyView]);
  return <TrendChartCard color="#f43f5e" data={data} dataKey="expenses" isNegative={true} subtitle="Historical monthly outflow patterns" title="Expense Trend" xAxisKey="name" />;
};

export const CumulativeCashFlowWidget = () => {
  const cumulativeView = useKingdomStore((state) => state.analytics?.cumulative || []);
  const data = useMemo(() => generateCumulativeCashFlowData(cumulativeView), [cumulativeView]);
  return <TrendChartCard color="#3b82f6" data={data} dataKey="cumulative" subtitle="Running net-flow balance trajectory" title="Cumulative Cash Flow" xAxisKey="name" />;
};

export const AssetGrowthTrendWidget = () => {
  const cumulativeView = useKingdomStore((state) => state.analytics?.cumulative || []);
  const data = useMemo(() => generateNetTrendData(cumulativeView), [cumulativeView]);
  // 4. Passa a imagem APENAS para este widget
  return <TrendChartCard bgImage={parchmentBg} color="#6366f1" data={data} dataKey="assets" subtitle="Historical growth of gross assets" title="Asset Growth Trend" xAxisKey="month" />;
};

export const DebtTrendWidget = () => {
  const cumulativeView = useKingdomStore((state) => state.analytics?.cumulative || []);
  const data = useMemo(() => generateNetTrendData(cumulativeView), [cumulativeView]);
  return <TrendChartCard color="#f97316" data={data} dataKey="liabilities" subtitle="Historical debt accumulation and reduction" title="Debt Trend" xAxisKey="month" />;
};

export const NetWorthTrendWidget = () => {
  const cumulativeView = useKingdomStore((state) => state.analytics?.cumulative || []);
  const data = useMemo(() => generateNetTrendData(cumulativeView), [cumulativeView]);
  return <TrendChartCard color="#111827" data={data} dataKey="net" subtitle="Global net wealth trajectory" title="Net Worth Trend" xAxisKey="month" />;
};