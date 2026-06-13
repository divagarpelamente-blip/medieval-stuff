import React, { useMemo } from 'react';

export default function PaymentMethodsChart({ paymentMethodsDistribution = [], t }) {
  const { data, totalAmount } = useMemo(() => {
    let total = 0;
    const mappedData = paymentMethodsDistribution
      .filter(row => row.amount > 0)
      .map(row => {
        total += row.amount;
        return { name: row.name, amount: row.amount };
      })
      .sort((a, b) => b.amount - a.amount);

    return { data: mappedData, totalAmount: total };
  }, [paymentMethodsDistribution]);

  const renderChart = () => {
    if (data.length === 0) {
      return (
        <div className="h-full flex items-center justify-center">
          <p className="text-center text-[10px] text-[#5d4037]/60 italic font-serif">
            {t('no_commercial_record', 'No commercial record.')}
          </p>
        </div>
      );
    }

    const R = 38;
    const Circumference = 2 * Math.PI * R;
    const colors = ['#059669', '#d4af37', '#8b4513', '#4682b4', '#c71585', '#2e8b57', '#808000', '#cd7f32'];

    let accumulatedPercent = 0;

    return (
      <div className="w-full h-full flex items-center justify-center relative">
        <div className="relative w-28 h-28 flex-shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90 drop-shadow-md">
            <circle cx="50" cy="50" r={R} fill="transparent" stroke="#faf4e5" strokeWidth="12" />
            {data.map((item, idx) => {
              const percent = (item.amount / totalAmount) * 100;
              const strokeDashoffset = Circumference - (percent / 100) * Circumference;
              const strokeDasharray = `${Circumference} ${Circumference}`;
              const rotation = (accumulatedPercent / 100) * 360;
              accumulatedPercent += percent;

              return (
                <circle
                  key={item.name}
                  cx="50"
                  cy="50"
                  r={R}
                  fill="transparent"
                  stroke={colors[idx % colors.length]}
                  strokeWidth="12"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  transform={`rotate(${rotation} 50 50)`}
                  className="transition-all duration-500 ease-out cursor-pointer hover:stroke-width-14"
                >
                  <title>{`${item.name}: ${item.amount.toLocaleString()}g (${percent.toFixed(1)}%)`}</title>
                </circle>
              );
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="font-sans font-bold text-[6px] text-stone-500 uppercase tracking-widest leading-tight">Total</span>
            <span className="font-mono font-black text-[9px] text-[#4b2c20] leading-none mt-0.5">{totalAmount.toLocaleString()}g</span>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar-subtle pr-1 space-y-1.5 mt-2 ml-4 max-h-[100px]">
          {data.map((item, idx) => (
            <div key={item.name} className="flex items-center gap-1.5 text-[8px]">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: colors[idx % colors.length] }}></div>
              <span className="truncate flex-1 font-bold text-[#4b2c20]">{item.name}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-[#faf4e5]/60 border border-[#8b4513]/25 rounded-xl p-4 shadow-sm flex flex-col h-full relative">
      <div className="flex justify-center items-center border-b border-[#8b4513]/10 pb-1.5 flex-shrink-0 mb-3 text-center">
        <h4 className="title-font text-[11px] font-black text-[#4b2c20] uppercase tracking-wider">
          {t('chart_payment_methods', 'Payment Methods Distribution')}
        </h4>
      </div>
      <div className="flex-grow flex items-center justify-center overflow-hidden">
        {renderChart()}
      </div>
    </div>
  );
}
