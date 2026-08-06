import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { useKingdomStore } from '../store/useKingdomStore';
import { useFormatting, formatCurrency } from '../context/FormattingContext';
import { fetchFinancialHealthPacket } from '../services/aiAdvisorService';
import {
    CheckCircle2,
    Calendar,
    AlertTriangle,
    AlertOctagon,
    Menu,
    Loader2
} from 'lucide-react';

const HexagonCard = ({ outerColor, innerColor, children }) => (
    <div
        className={`relative w-full max-w-[140px] h-32 md:h-36 ${outerColor} flex items-center justify-center shrink-0`}
        style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
    >
        <div
            className={`absolute inset-[2px] ${innerColor} flex flex-col items-center justify-center p-2 text-center`}
            style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
        >
            {children}
        </div>
    </div>
);

export default function FinancialAlerts({ onClose }) {
    const user = useKingdomStore((state) => state.user);
    const { prefs } = useFormatting();

    const clientToday = useMemo(() => new Date().toISOString().split('T')[0], []);

    const { data: rpcData, isFetching: isLedgerFetching } = useQuery({
        queryKey: ['advisor_alerts', user?.id, clientToday],
        queryFn: async () => {
            if (!user?.id) return null;
            const { data, error } = await supabase.rpc('get_interactive_dashboard', {
                p_profile_id: user.id,
                p_client_today: clientToday,
                p_start_date: null,
                p_end_date: null,
                p_month: null,
                p_status: 'Pending',
                p_arrear: null,
                p_category: null,
                p_entity: null
            });
            if (error) throw error;
            return data;
        },
        enabled: !!user?.id,
        staleTime: 1000 * 60 * 5
    });

    const { data: healthData } = useQuery({
        queryKey: ['financial_health', user?.id],
        queryFn: async () => {
            if (!user?.id) return null;
            return await fetchFinancialHealthPacket(user.id);
        },
        enabled: !!user?.id,
        staleTime: 1000 * 60 * 5
    });

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const processedData = useMemo(() => {
        const sums = { overdue: 0, payToday: 0, due: 0, notDue: 0 };
        
        if (rpcData?.arrear_summary) {
            rpcData.arrear_summary.forEach(item => {
                const val = Number(item.value) || 0;
                if (item.name === 'overdue') sums.overdue = val;
                else if (item.name === 'pay today') sums.payToday = val;
                else if (item.name === 'due') sums.due = val;
                else if (item.name === 'not yet due') sums.notDue = val;
            });
        }

        const today = new Date(clientToday);
        const classified = (rpcData?.ledger || []).map(txn => {
            let arrearStatus = 'not_due';
            let daysText = 'Not due';

            if (txn.value_date) {
                const dueDate = new Date(txn.value_date);
                const diffTime = dueDate.getTime() - today.getTime();
                const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays < 0) {
                    arrearStatus = 'overdue';
                    daysText = `Overdue by ${Math.abs(diffDays)} day(s)`;
                } else if (diffDays === 0) {
                    arrearStatus = 'pay_today';
                    daysText = 'Pay Today';
                } else if (diffDays > 0 && diffDays <= 7) {
                    arrearStatus = 'due';
                    daysText = `Due in ${diffDays} day(s)`;
                }
            }

            return {
                ...txn,
                arrearStatus,
                daysText,
                displayDate: txn.value_date
            };
        });

        return { transactions: classified, sums };
    }, [rpcData, clientToday]);

    const [sortConfigTop, setSortConfigTop] = useState({ key: 'displayDate', direction: 'asc' });
    const [sortConfigBottom, setSortConfigBottom] = useState({ key: 'displayDate', direction: 'asc' });

    const handleSort = (table, key, e) => {
        if (e) e.stopPropagation();
        if (table === 'top') {
            setSortConfigTop(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }));
        } else {
            setSortConfigBottom(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }));
        }
    };

    const sortTransactions = (txns, config) => {
        return [...txns].sort((a, b) => {
            const valA = a[config.key] || '';
            const valB = b[config.key] || '';
            if (valA < valB) return config.direction === 'asc' ? -1 : 1;
            if (valA > valB) return config.direction === 'asc' ? 1 : -1;
            return 0;
        });
    };

    const urgentTxns = sortTransactions(
        processedData.transactions.filter(t => t.arrearStatus === 'overdue' || t.arrearStatus === 'pay_today'),
        sortConfigTop
    );

    const upcomingTxns = sortTransactions(
        processedData.transactions.filter(t => t.arrearStatus === 'due' || t.arrearStatus === 'not_due'),
        sortConfigBottom
    );

    const getBadgeStyle = (status) => {
        switch (status) {
            case 'overdue': return 'bg-rose-900/20 text-rose-800 border-rose-800/30 font-extrabold';
            case 'pay_today': return 'bg-amber-900/20 text-amber-800 border-amber-800/30 font-extrabold';
            case 'due': return 'bg-amber-800/10 text-amber-750 border-amber-800/20 font-extrabold';
            case 'not_due': return 'bg-emerald-900/20 text-emerald-800 border-emerald-800/30 font-extrabold';
            default: return 'bg-stone-900/10 text-stone-700 border-stone-850/20 font-extrabold';
        }
    };

    const TableHeader = ({ sortKey, table, widthClass }) => (
        <th
            className={`py-2 align-middle text-left text-[#4b2c20]/75 cursor-pointer hover:text-[#4b2c20] transition-colors duration-200 ${widthClass}`}
            onClick={(e) => handleSort(table, sortKey, e)}
            title="Sort Column"
        >
            <div className="flex items-center">
                <Menu size={14} className="mr-1" />
            </div>
        </th>
    );

    // Filter relevant deterministic flags
    const criticalFlags = (healthData?.deterministic_flags || []).filter(flag => 
        ['RUNWAY', 'DTI', 'SAVINGS_RATE', 'STATE_DEBT'].includes(flag.metric) && flag.status !== 'GREEN'
    );

    return (
        <div 
            className="absolute inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-2 md:p-6" 
            onClick={(e) => { e.stopPropagation(); onClose(); }}
        >
            <div
                className="w-full h-full max-w-[1400px] bg-[#faf4e5] rounded-2xl overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.5)] border-4 border-[#8b4513] flex flex-col font-serif"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center gap-4 p-4 border-b-2 border-[#4b2c20]/30 bg-[#8b4513] shrink-0 shadow-md">
                    <div className="w-14 h-14 rounded-full bg-stone-900 border-2 border-[#d4af37] shadow-[0_0_15px_rgba(212,175,55,0.4)] flex items-center justify-center overflow-hidden shrink-0">
                        <img
                            src="https://api.dicebear.com/7.x/adventurer/svg?seed=Felix&backgroundColor=transparent"
                            alt="Advisor"
                            className="w-full h-full object-cover scale-110"
                        />
                    </div>
                    <h2 className="text-xl md:text-2xl font-black text-[#faf4e5] tracking-widest uppercase drop-shadow-md">
                        Financial Alerts
                    </h2>
                    <button
                        onClick={(e) => { e.stopPropagation(); onClose(); }}
                        className="ml-auto w-8 h-8 rounded-full bg-[#4b2c20]/45 border border-[#faf4e5]/30 flex items-center justify-center text-[#faf4e5] hover:text-white hover:bg-[#4b2c20]/60 transition-colors duration-200 focus:outline-none shadow-sm font-sans"
                        title="Close"
                    >
                        ✕
                    </button>
                </div>

                <div className="flex-1 flex flex-col p-4 md:p-6 gap-6 min-h-0 overflow-y-auto bg-gradient-to-b from-[#faf4e5] to-[#f4e4bc]/30">
                    
                    {/* DETERMINISTIC FLAGS ALERTS */}
                    {criticalFlags.length > 0 && (
                        <div className="flex flex-col gap-3 shrink-0">
                            {criticalFlags.map((flag, idx) => {
                                // Extract the number from the message to format it if needed, or simply render the message 
                                // (Since the backend generates the message string, we can render the message directly, 
                                // but ideally the backend provides the raw value. Assuming the message is just text, we render it.)
                                // If we must parse and format numbers inside the text, it's tricky, but we can display the raw value formatted if available.
                                const valFormatted = formatCurrency(flag.current_value || 0, prefs);
                                
                                return (
                                    <div key={idx} className={`p-4 rounded-xl border-2 flex gap-3 items-center shadow-sm ${flag.status === 'RED' ? 'bg-rose-100/80 border-rose-300 text-rose-900' : 'bg-orange-100/80 border-orange-300 text-orange-900'}`}>
                                        <AlertTriangle size={28} className={flag.status === 'RED' ? 'text-rose-600' : 'text-orange-600'} />
                                        <div className="flex-1">
                                            <h4 className="text-sm font-bold uppercase tracking-wider">{flag.metric.replace('_', ' ')} ALERT</h4>
                                            <p className="text-sm font-medium mt-1">{flag.message}</p>
                                        </div>
                                        {flag.current_value !== undefined && (
                                            <div className="shrink-0 text-right">
                                                <span className="text-xs font-semibold block uppercase tracking-wider opacity-70">Current</span>
                                                <span className="text-lg font-black font-mono">{valFormatted}</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Hexagons */}
                    <div className="flex items-center justify-around gap-2 shrink-0 flex-wrap">
                        <HexagonCard outerColor="bg-emerald-800" innerColor="bg-emerald-100">
                            <CheckCircle2 size={24} className="text-emerald-700 mb-1" />
                            <span className="text-[10px] uppercase tracking-wider text-emerald-800 font-bold">Not Due</span>
                            <span className="text-sm font-mono text-emerald-950 font-black mt-1">{formatCurrency(processedData.sums.notDue, prefs)}</span>
                        </HexagonCard>

                        <HexagonCard outerColor="bg-amber-700" innerColor="bg-amber-100">
                            <Calendar size={24} className="text-amber-700 mb-1" />
                            <span className="text-[10px] uppercase tracking-wider text-amber-800 font-bold">Due</span>
                            <span className="text-sm font-mono text-amber-950 font-black mt-1">{formatCurrency(processedData.sums.due, prefs)}</span>
                        </HexagonCard>

                        <HexagonCard outerColor="bg-orange-700" innerColor="bg-orange-100">
                            <AlertTriangle size={24} className="text-orange-700 animate-pulse mb-1" />
                            <span className="text-[10px] uppercase tracking-wider text-orange-800 font-bold">Pay Today</span>
                            <span className="text-sm font-mono text-orange-950 font-black mt-1">{formatCurrency(processedData.sums.payToday, prefs)}</span>
                        </HexagonCard>

                        <HexagonCard outerColor="bg-rose-800" innerColor="bg-rose-100">
                            <AlertOctagon size={24} className="text-rose-700 mb-1" />
                            <span className="text-[10px] uppercase tracking-wider text-rose-800 font-bold">Overdue</span>
                            <span className="text-sm font-mono text-rose-950 font-black mt-1">{formatCurrency(processedData.sums.overdue, prefs)}</span>
                        </HexagonCard>
                    </div>

                    {/* SIDE BY SIDE TABLES */}
                    <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[300px]">

                        {/* Left: Urgent Action Required */}
                        <div className="flex flex-col bg-white border-2 border-[#8b4513]/20 rounded-xl p-4 min-h-0 overflow-hidden shadow-md">
                            <h3 className="text-xs font-serif font-bold text-[#4b2c20] uppercase tracking-widest mb-3 shrink-0 flex items-center gap-2 border-b border-[#8b4513]/20 pb-2">
                                <AlertOctagon size={14} className="text-rose-700" /> Urgent Action Required
                            </h3>
                            <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-amber-800/30 scrollbar-track-transparent relative">
                                {isLedgerFetching && (
                                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-20 flex items-center justify-center pointer-events-none">
                                        <Loader2 className="animate-spin text-amber-800" />
                                    </div>
                                )}
                                <table className="w-full text-xs table-fixed">
                                    <colgroup>
                                        <col className="w-[42%]" />
                                        <col className="w-[20%]" />
                                        <col className="w-[25%]" />
                                        <col className="w-[13%]" />
                                    </colgroup>
                                    <thead className="sticky top-0 bg-[#f4e4bc] z-10 border-b border-[#8b4513]/20">
                                        <tr>
                                            <TableHeader sortKey="entity" table="top" widthClass="w-[42%]" />
                                            <TableHeader sortKey="displayDate" table="top" widthClass="w-[20%]" />
                                            <th className="py-2 text-left text-[10px] uppercase tracking-wider text-[#4b2c20]/80 font-bold w-[25%]">Amount</th>
                                            <th className="py-2 text-right text-[10px] uppercase tracking-wider text-[#4b2c20]/80 font-bold w-[13%] pr-1">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#8b4513]/10 font-sans">
                                        {urgentTxns.length === 0 ? (
                                            <tr><td colSpan="4" className="text-center py-6 text-stone-400 font-mono text-[11px]">No urgent transactions.</td></tr>
                                        ) : (
                                            urgentTxns.map((txn) => (
                                                <tr key={txn.id} className="hover:bg-[#f4e4bc]/30 transition-colors duration-150">
                                                    <td className="py-2.5 align-middle pr-3">
                                                        <div className="font-bold text-[#4b2c20] text-[11px] mb-1 truncate" title={txn.entity || 'Unknown Entity'}>
                                                            {txn.entity || 'Unknown Entity'}
                                                        </div>
                                                        <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-mono border truncate max-w-full ${getBadgeStyle(txn.arrearStatus)}`} title={txn.daysText}>
                                                            {txn.daysText}
                                                        </span>
                                                    </td>
                                                    <td className="py-2.5 align-middle pl-1 pr-1">
                                                        <div className="text-[9px] uppercase tracking-wider text-[#5d4037] font-semibold font-serif">Due</div>
                                                        <div className="text-stone-600 font-mono text-[11px] truncate">{txn.displayDate || '-'}</div>
                                                    </td>
                                                    <td className="py-2.5 align-middle text-rose-700 font-mono font-bold text-[11px] truncate">
                                                        {formatCurrency(txn.amount, prefs)}
                                                    </td>
                                                    <td className="py-2.5 align-middle text-right">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); console.log('Open Ledger for TX:', txn.id); }}
                                                            className="px-1.5 py-1 bg-[#8b4513] hover:bg-[#4b2c20] border border-[#8b4513]/30 rounded text-[#faf4e5] text-[9px] font-bold tracking-wider uppercase transition-colors duration-200 whitespace-nowrap shadow-sm cursor-pointer"
                                                        >
                                                            Ledger
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Right: Upcoming Queue */}
                        <div className="flex flex-col bg-white border-2 border-[#8b4513]/20 rounded-xl p-4 min-h-0 overflow-hidden shadow-md">
                            <h3 className="text-xs font-serif font-bold text-[#4b2c20] uppercase tracking-widest mb-3 shrink-0 flex items-center gap-2 border-b border-[#8b4513]/20 pb-2">
                                <Calendar size={14} className="text-emerald-700" /> Upcoming Queue
                            </h3>
                            <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-amber-800/30 scrollbar-track-transparent relative">
                                {isLedgerFetching && (
                                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-20 flex items-center justify-center pointer-events-none">
                                        <Loader2 className="animate-spin text-amber-800" />
                                    </div>
                                )}
                                <table className="w-full text-xs table-fixed">
                                    <colgroup>
                                        <col className="w-[42%]" />
                                        <col className="w-[20%]" />
                                        <col className="w-[25%]" />
                                        <col className="w-[13%]" />
                                    </colgroup>
                                    <thead className="sticky top-0 bg-[#f4e4bc] z-10 border-b border-[#8b4513]/20">
                                        <tr>
                                            <TableHeader sortKey="entity" table="bottom" widthClass="w-[42%]" />
                                            <TableHeader sortKey="displayDate" table="bottom" widthClass="w-[20%]" />
                                            <th className="py-2 text-left text-[10px] uppercase tracking-wider text-[#4b2c20]/80 font-bold w-[25%]">Amount</th>
                                            <th className="py-2 text-right text-[10px] uppercase tracking-wider text-[#4b2c20]/80 font-bold w-[13%] pr-1">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#8b4513]/10 font-sans">
                                        {upcomingTxns.length === 0 ? (
                                            <tr><td colSpan="4" className="text-center py-6 text-stone-400 font-mono text-[11px]">No upcoming transactions.</td></tr>
                                        ) : (
                                            upcomingTxns.map((txn) => (
                                                <tr key={txn.id} className="hover:bg-[#f4e4bc]/30 transition-colors duration-150">
                                                    <td className="py-2.5 align-middle pr-3">
                                                        <div className="font-bold text-[#4b2c20] text-[11px] mb-1 truncate" title={txn.entity || 'Unknown Entity'}>
                                                            {txn.entity || 'Unknown Entity'}
                                                        </div>
                                                        <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-mono border truncate max-w-full ${getBadgeStyle(txn.arrearStatus)}`} title={txn.daysText}>
                                                            {txn.daysText}
                                                        </span>
                                                    </td>
                                                    <td className="py-2.5 align-middle pl-1 pr-1">
                                                        <div className="text-[9px] uppercase tracking-wider text-[#5d4037] font-semibold font-serif">Due</div>
                                                        <div className="text-stone-600 font-mono text-[11px] truncate">{txn.displayDate || '-'}</div>
                                                    </td>
                                                    <td className="py-2.5 align-middle text-[#8b4513] font-mono font-bold text-[11px] truncate">
                                                        {formatCurrency(txn.amount, prefs)}
                                                    </td>
                                                    <td className="py-2.5 align-middle text-right">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); console.log('Open Ledger for TX:', txn.id); }}
                                                            className="px-1.5 py-1 bg-[#8b4513] hover:bg-[#4b2c20] border border-[#8b4513]/30 rounded text-[#faf4e5] text-[9px] font-bold tracking-wider uppercase transition-colors duration-200 whitespace-nowrap shadow-sm cursor-pointer"
                                                        >
                                                            Ledger
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}