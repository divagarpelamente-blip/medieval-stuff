import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useKingdomStore } from '../../store/useKingdomStore';
import { generateCategoryBreakdown } from '../../utils/chartAnalytics';

const PIE_COLORS = ['#111827', '#374151', '#4b5563', '#6b7280', '#9ca3af', '#d1d5db'];

export default function AssetAllocationChart() {
  const categoryView = useKingdomStore((state) => state.analytics?.category || []);
  const monthlyView = useKingdomStore((state) => state.analytics?.monthly || []);
  
  // Sensor Espacial: Deteta se o utilizador redimensionou o widget para um tamanho muito pequeno
  const containerRef = useRef(null);
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        // Se a largura ou a altura do cartão caírem abaixo do limiar (aprox tamanho 2x2), ativa o modo compacto
        if (entry.contentRect.width < 300 || entry.contentRect.height < 250) {
          setIsCompact(true);
        } else {
          setIsCompact(false);
        }
      }
    });

    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const data = useMemo(() => {
    return generateCategoryBreakdown(categoryView, 'Assets').slice(0, 5);
  }, [categoryView]);

  const totalAssetValue = useMemo(() => {
    return data.reduce((sum, item) => sum + item.value, 0);
  }, [data]);

  const dataWithMeta = useMemo(() => {
    return data.map((item, index) => {
      const percentage = totalAssetValue > 0 ? ((item.value / totalAssetValue) * 100).toFixed(1) : 0;
      return { ...item, percentage, color: PIE_COLORS[index % PIE_COLORS.length] };
    });
  }, [data, totalAssetValue]);

  const healthScore = useMemo(() => {
    let income = 0;
    let expenses = 0;
    monthlyView.forEach((row) => {
      const amt = Number(row.total_amount) || 0;
      if (row.type === 'Income') income += amt;
      if (row.type === 'Expenses') expenses += Math.abs(amt);
    });

    if (income === 0 && expenses === 0) return 100;
    if (income === 0) return 0;
    const ratio = income / (income + expenses);
    return Math.round(ratio * 100);
  }, [monthlyView]);

  const getHealthDescriptor = (score) => {
    if (score >= 80) return { label: 'Flourishing', color: 'text-emerald-500' };
    if (score >= 50) return { label: 'Stable', color: 'text-amber-500' };
    return { label: 'Strained', color: 'text-rose-500' };
  };

  const healthMeta = getHealthDescriptor(healthScore);
  const formatGP = (val) => `${Number(val).toLocaleString()} GP`;

  return (
    <div 
      ref={containerRef}
      // min-h-[380px] substituido por min-h-0 e overflow-hidden para permitir encolhimento
      className={`w-full h-full min-h-0 flex flex-col bg-white border border-gray-200 rounded-xl shadow-sm justify-between overflow-hidden transition-all duration-200 ${isCompact ? 'p-3 gap-2' : 'p-6 gap-6'}`}
    >
      {/* Cabeçalho Condicional */}
      <div className="shrink-0">
        <h3 className={`font-sans font-semibold tracking-wide text-gray-500 uppercase truncate ${isCompact ? 'text-[10px] mb-0' : 'text-sm'}`}>
          Asset Allocation
        </h3>
        {!isCompact && (
          <p className="text-xs text-gray-400 mt-1 truncate">Distribution of wealth holdings</p>
        )}
      </div>

      {/* Lista de Ativos com Scroll Interno (se houver overlow) e Fontes Fluidas */}
      <div className={`flex flex-col flex-1 overflow-y-auto scrollbar-thin ${isCompact ? 'gap-1.5' : 'gap-4'}`}>
        {dataWithMeta.map((item) => (
          <div key={item.name} className={`flex items-center justify-between border-b border-gray-100 last:border-0 ${isCompact ? 'pb-1' : 'pb-2'}`}>
            <div className="flex items-center gap-2 overflow-hidden pr-2">
              <div className={`rounded-sm flex-shrink-0 ${isCompact ? 'w-2 h-2' : 'w-3 h-3'}`} style={{ backgroundColor: item.color }} />
              <p className={`font-serif font-semibold text-gray-800 truncate ${isCompact ? 'text-[10px]' : 'text-sm'}`}>
                {item.name}
              </p>
            </div>
            <div className="text-right font-mono flex-shrink-0 pl-2">
              <p className={`font-bold text-gray-900 ${isCompact ? 'text-[10px]' : 'text-sm'}`}>{formatGP(item.value)}</p>
              <p className={`font-semibold text-gray-500 ${isCompact ? 'text-[9px]' : 'text-xs'}`}>{item.percentage}%</p>
            </div>
          </div>
        ))}
        {dataWithMeta.length === 0 && (
          <p className={`text-center font-serif text-gray-400 ${isCompact ? 'text-[10px] py-2' : 'text-sm py-8'}`}>
            No reserves discovered.
          </p>
        )}
      </div>

      {/* Traço separador visível apenas no modo normal */}
      {!isCompact && <div className="w-full h-px bg-gray-100 shrink-0" />}

      {/* Painel de Saúde do Tesouro Responsivo */}
      <div className={`rounded bg-gray-50 border border-gray-200 flex items-center justify-between shrink-0 ${isCompact ? 'p-1.5' : 'p-3.5'}`}>
        <div className="overflow-hidden pr-2">
          <p className={`uppercase tracking-wider font-semibold text-gray-500 truncate ${isCompact ? 'text-[9px]' : 'text-[11px]'}`}>
            Treasury Health
          </p>
          {!isCompact && (
            <p className="text-xs text-gray-400 truncate">Ratio of earnings to expenses</p>
          )}
        </div>
        <div className="text-right flex-shrink-0 pl-2">
          <p className={`font-mono font-black tracking-tighter text-gray-800 ${isCompact ? 'text-sm' : 'text-xl'}`}>
            {healthScore}%
          </p>
          <span className={`font-serif font-bold uppercase block ${healthMeta.color} ${isCompact ? 'text-[8px]' : 'text-[10px]'}`}>
            {healthMeta.label}
          </span>
        </div>
      </div>
    </div>
  );
}