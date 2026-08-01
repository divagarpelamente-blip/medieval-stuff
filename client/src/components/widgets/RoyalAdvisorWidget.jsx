import React, { useState } from 'react';
import { useKingdomStore } from '../../store/useKingdomStore';
import { fetchFinancialHealthPacket, generateAdvice } from '../../services/aiAdvisorService';
import { ShieldAlert, ShieldCheck, Shield, Wand2 } from 'lucide-react';

const StatusShield = ({ status }) => {
  if (status === 'RED') return <ShieldAlert className="w-6 h-6 text-rose-600" />;
  if (status === 'YELLOW') return <ShieldAlert className="w-6 h-6 text-amber-500" />;
  return <ShieldCheck className="w-6 h-6 text-emerald-600" />;
};

export const RoyalAdvisorWidget = () => {
  const user = useKingdomStore(s => s.user);
  const [isConsulting, setIsConsulting] = useState(false);
  const [advice, setAdvice] = useState(null);
  const [packet, setPacket] = useState(null);
  const [error, setError] = useState(null);

  const handleConsult = async () => {
    if (!user?.id) return;
    setIsConsulting(true);
    setError(null);
    setAdvice(null);
    
    try {
      const dataPacket = await fetchFinancialHealthPacket(user.id);
      setPacket(dataPacket);
      
      const aiResponse = await generateAdvice(dataPacket);
      setAdvice(aiResponse);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsConsulting(false);
    }
  };

  const getOverallStatus = () => {
    if (!packet) return 'UNKNOWN';
    const flags = packet.deterministic_flags || [];
    if (flags.some(f => f.status === 'RED')) return 'RED';
    if (flags.some(f => f.status === 'YELLOW')) return 'YELLOW';
    return 'GREEN';
  };

  const overallStatus = getOverallStatus();
  
  return (
    <div className="w-full h-full flex flex-col bg-[#faf4e5] border-2 border-[#8b4513]/40 rounded-xl p-4 shadow-sm overflow-hidden font-serif">
      <div className="flex items-center gap-3 mb-4 shrink-0 border-b border-[#8b4513]/20 pb-3">
        <div className="w-12 h-12 bg-stone-800 rounded-full flex items-center justify-center border-2 border-[#8b4513] shadow-inner overflow-hidden">
          <Wand2 className="w-6 h-6 text-amber-500" />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-bold text-stone-900 leading-tight">Royal Advisor</h3>
          <p className="text-xs text-stone-500 italic">AI Financial Counsel</p>
        </div>
        {packet && (
          <div className="shrink-0 flex flex-col items-center justify-center" title="Overall Health">
            <StatusShield status={overallStatus} />
            <span className="text-[9px] font-bold mt-1 text-stone-600 uppercase tracking-wider">{overallStatus}</span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-amber-800/40 mb-4 flex flex-col gap-3">
        {!packet && !isConsulting && !error && (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
            <Shield className="w-10 h-10 text-stone-300 mb-3 stroke-[1]" />
            <p className="text-sm text-stone-600 italic">
              "My Lord, I await your command to analyze the Kingdom's ledgers."
            </p>
          </div>
        )}

        {isConsulting && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin"></div>
            <p className="text-xs font-semibold text-stone-600 animate-pulse">Reading the ancient scrolls...</p>
          </div>
        )}

        {error && (
          <div className="p-3 bg-rose-100/50 border border-rose-300 rounded-lg">
            <p className="text-xs text-rose-700 font-semibold">{error}</p>
          </div>
        )}

        {packet && !isConsulting && (
          <>
            {packet.deterministic_flags.filter(f => f.status !== 'GREEN').length > 0 && (
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold uppercase text-[#8b4513] tracking-wider border-b border-[#8b4513]/20 pb-1">Critical Alerts</h4>
                {packet.deterministic_flags.filter(f => f.status !== 'GREEN').map((flag, idx) => (
                  <div key={idx} className={`p-2 rounded border text-xs flex gap-2 items-start ${flag.status === 'RED' ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
                    <StatusShield status={flag.status} />
                    <p className="pt-1">{flag.message}</p>
                  </div>
                ))}
              </div>
            )}
            
            {advice && (
              <div className="mt-2 p-3 bg-white border border-[#8b4513]/20 rounded-lg shadow-inner">
                <p className="text-sm text-stone-800 leading-relaxed italic">"{advice}"</p>
              </div>
            )}
          </>
        )}
      </div>

      <div className="shrink-0 pt-2 border-t border-[#8b4513]/20">
        <button 
          onClick={handleConsult}
          disabled={isConsulting}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#8b4513] text-[#faf4e5] rounded font-bold text-sm hover:bg-[#6b350e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
        >
          <Wand2 className="w-4 h-4" />
          Consult Royal Advisor
        </button>
      </div>
    </div>
  );
};
