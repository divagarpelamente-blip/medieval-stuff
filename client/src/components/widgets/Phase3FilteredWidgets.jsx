import React, { useMemo } from 'react';
import { useKingdomStore } from '../../store/useKingdomStore';

const formatValue = (val) => {
  const num = Number(val) || 0;
  const formattedNum = Math.abs(num).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return num < 0 ? `(${formattedNum})` : formattedNum;
};

const FilteredKpiCard = ({ title, subtitle, value, tag }) => (
  <div className="w-full h-full flex flex-col justify-between bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
    <div className="flex justify-between items-start">
      <div>
        <h3 className="text-sm font-sans font-semibold tracking-wide text-gray-500 uppercase">{title}</h3>
        <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
      </div>
    </div>
    <div className="mt-4">
      <span className="text-3xl font-sans font-bold text-gray-900">{value}</span>
    </div>
    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] font-mono text-gray-500">
      <span>{tag}</span>
      <span className="text-gray-700 font-semibold bg-gray-100 px-2 py-0.5 rounded border border-gray-200">Strict Filter</span>
    </div>
  </div>
);

export const CostOfDebtWidget = () => {
  const balances = useKingdomStore(s => s.analytics?.balances || []);
  
  const costOfDebt = useMemo(() => {
    // Procura o saldo total acumulado na conta específica de custo da dívida
    const targetAcc = balances.find(b => b.account === '69020003');
    return targetAcc ? targetAcc.balance : 0;
  }, [balances]);

  return <FilteredKpiCard subtitle="Interest expenses paid" tag="[69020003]" title="Cost of Debt" value={formatValue(costOfDebt)}/>;
};

export const YieldAssetsWidget = () => {
  const balances = useKingdomStore(s => s.analytics?.balances || []);
  
  const yieldAssets = useMemo(() => {
    // Soma os saldos de todas as contas de Ativo ('1') ignorando dinheiro estéril ('1101', '1103')
    return balances
      .filter(b => b.account && b.account.startsWith('1') && !b.account.startsWith('1101') && !b.account.startsWith('1103'))
      .reduce((sum, b) => sum + Number(b.balance), 0);
  }, [balances]);

  return <FilteredKpiCard subtitle="Yield-bearing vs sterile assets" tag="Class [1] - Cash" title="Income-Generating Assets" value={formatValue(yieldAssets)}/>;
};