// client/src/components/widgets/InteractiveAPARWidgets.jsx

import React, { useState, useEffect, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useInteractiveStore } from '../../store/useInteractiveStore';
import { useInteractiveData } from '../../hooks/useInteractiveData';
import { Loader2, FilterX } from 'lucide-react';

const formatValue = (val) => {
    const num = Number(val) || 0;
    const formattedNum = Math.abs(num).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return num < 0 ? `(${formattedNum})` : formattedNum;
};

const LocalClearBtn = ({ onClear }) => (
    <button
        onClick={(e) => { e.stopPropagation(); onClear(); }}
        className="cancel-drag absolute top-2 right-2 p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors [&>*]:pointer-events-none z-20"
        title="Clear Widget Filter"
    >
        <FilterX size={14} />
    </button>
);

const useWidgetResize = (heightThreshold = 120) => {
    const [isCompact, setIsCompact] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        if (!ref.current) return;
        
        const checkSize = () => {
            if (ref.current) {
                setIsCompact(ref.current.offsetHeight < heightThreshold);
            }
        };
        
        checkSize();

        const observer = new ResizeObserver(() => checkSize());
        observer.observe(ref.current);
        return () => observer.disconnect();
    }, [heightThreshold]);

    return { ref, isCompact };
};

// ==========================================
// WIDGET 1: Date Range & Month Picker
// ==========================================
export const InteractiveDateFilter = () => {
    const { filters, setFilter } = useInteractiveStore();
    const { ref, isCompact } = useWidgetResize(110);

    const hasFilter = filters.startDate || filters.endDate || filters.monthFilter;

    return (
        <div ref={ref} className={`relative w-full h-full flex flex-col bg-white border border-gray-200 rounded-xl shadow-sm justify-center ${isCompact ? 'p-2' : 'p-4'}`}>
            {hasFilter && <LocalClearBtn onClear={() => { setFilter('startDate', null); setFilter('endDate', null); setFilter('monthFilter', null); }} />}

            {!isCompact && <h3 className="text-sm font-sans font-semibold tracking-wide text-gray-500 uppercase mb-4 shrink-0">Timeframe</h3>}
            <div className="flex gap-4 pr-6">
                <div className="flex-[0.8] flex flex-col gap-1 border-r border-gray-200 pr-4">
                    {!isCompact && <label className="text-[10px] uppercase font-bold text-gray-400">Select Month</label>}
                    <input
                        type="month"
                        value={filters.monthFilter || ''}
                        onChange={(e) => setFilter('monthFilter', e.target.value || null)}
                        className="cancel-drag w-full border border-gray-300 rounded p-1.5 text-xs text-gray-700 font-mono outline-none focus:border-amber-600"
                    />
                </div>
                <div className="flex-1 flex flex-col gap-1">
                    {!isCompact && <label className="text-[10px] uppercase font-bold text-gray-400">Start Date</label>}
                    <input
                        type="date"
                        value={filters.startDate || ''}
                        onChange={(e) => setFilter('startDate', e.target.value || null)}
                        className="cancel-drag w-full border border-gray-300 rounded p-1.5 text-xs text-gray-700 font-mono outline-none focus:border-amber-600"
                    />
                </div>
                <div className="flex-1 flex flex-col gap-1">
                    {!isCompact && <label className="text-[10px] uppercase font-bold text-gray-400">End Date</label>}
                    <input
                        type="date"
                        value={filters.endDate || ''}
                        onChange={(e) => setFilter('endDate', e.target.value || null)}
                        className="cancel-drag w-full border border-gray-300 rounded p-1.5 text-xs text-gray-700 font-mono outline-none focus:border-amber-600"
                    />
                </div>
            </div>
        </div>
    );
};

// ==========================================
// WIDGET 2: Granularity Selector
// ==========================================
export const InteractiveGranularity = () => {
    const { filters, setFilter } = useInteractiveStore();
    const { ref, isCompact } = useWidgetResize(110);
    const options = ['Weekly', 'Monthly', 'Quarterly', 'Yearly', 'All Time'];

    return (
        <div ref={ref} className={`relative w-full h-full flex flex-col bg-white border border-gray-200 rounded-xl shadow-sm justify-center overflow-hidden ${isCompact ? 'p-2' : 'p-4'}`}>
            {!isCompact && <h3 className="text-sm font-sans font-semibold tracking-wide text-gray-500 uppercase mb-4 shrink-0">Grouping</h3>}
            <div className="flex flex-wrap gap-2 overflow-y-auto custom-scrollbar-subtle pr-2">
                {options.map(opt => (
                    <button
                        key={opt}
                        onClick={(e) => { if (e && e.stopPropagation) e.stopPropagation(); setFilter('granularity', opt); }}
                        className={`cancel-drag [&>*]:pointer-events-none flex-1 px-2 py-1.5 rounded text-[10px] font-semibold uppercase tracking-wider transition-colors border whitespace-nowrap min-w-[70px] ${filters.granularity === opt
                                ? 'bg-amber-900 text-amber-100 border-amber-950 shadow-inner'
                                : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                            }`}
                    >
                        {opt}
                    </button>
                ))}
            </div>
        </div>
    );
};

// ==========================================
// WIDGET 3: Payment Status Summary
// ==========================================
export const InteractiveStatus = () => {
    const { data, isFetching } = useInteractiveData();
    const { filters, setFilter } = useInteractiveStore();
    const { ref, isCompact } = useWidgetResize(130);

    const statusData = data?.status_summary || [];

    return (
        <div ref={ref} className={`relative w-full h-full flex flex-col bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden ${isCompact ? 'p-2' : 'p-4'}`}>
            {isFetching && <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center pointer-events-none rounded-xl"><Loader2 className="animate-spin text-amber-500"/></div>}
            
            {filters.statusFilter && <LocalClearBtn onClear={() => setFilter('statusFilter', null)} />}

            {!isCompact && (
                <div className="flex items-center mb-4 shrink-0">
                    <h3 className="text-sm font-sans font-semibold tracking-wide text-gray-500 uppercase">Payment Status</h3>
                </div>
            )}

            <div className={`flex-1 flex ${isCompact ? 'flex-row' : 'flex-col'} gap-2 justify-center pr-6`}>
                {['Pending', 'Completed'].map(status => {
                    const sum = statusData.find(d => d.name === status)?.value || 0;
                    const isActive = filters.statusFilter === status;
                    return (
                        <button
                            key={status}
                            onClick={(e) => { if (e && e.stopPropagation) e.stopPropagation(); setFilter('statusFilter', isActive ? null : status); }}
                            className={`cancel-drag [&>*]:pointer-events-none flex-1 flex ${isCompact ? 'flex-col justify-center' : 'items-center justify-between'} p-2 rounded-lg border transition-all ${isActive ? 'border-amber-600 bg-amber-50 ring-1 ring-amber-600' : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100'
                                }`}
                        >
                            <span className={`font-serif font-bold text-gray-700 ${isCompact ? 'text-[10px] uppercase mb-1' : 'text-sm'}`}>{status}</span>
                            <span className={`font-mono font-bold text-gray-900 ${isCompact ? 'text-xs' : ''}`}>{formatValue(sum)}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

// ==========================================
// WIDGET 4: Arrear Breakdown
// ==========================================
export const InteractiveArrear = () => {
    const { data, isFetching } = useInteractiveData();
    const { filters, setFilter } = useInteractiveStore();
    const { ref, isCompact } = useWidgetResize(110);

    const arrearData = data?.arrear_summary || [];

    const arrearOrder = [
        { id: 'not yet due', label: 'Not Yet Due', color: 'border-blue-200 bg-blue-50 text-blue-800' },
        { id: 'due', label: 'Due (< 7 Days)', color: 'border-amber-200 bg-amber-50 text-amber-800' },
        { id: 'pay today', label: 'Pay Today', color: 'border-orange-300 bg-orange-100 text-orange-900' },
        { id: 'overdue', label: 'Overdue', color: 'border-red-200 bg-red-50 text-red-800' },
        { id: 'paid on time', label: 'Paid On Time', color: 'border-emerald-200 bg-emerald-50 text-emerald-800' },
        { id: 'paid overdue', label: 'Paid Overdue', color: 'border-purple-200 bg-purple-50 text-purple-800' }
    ];

    return (
        <div ref={ref} className={`relative w-full h-full flex flex-col bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden ${isCompact ? 'p-2' : 'p-4'}`}>
            {isFetching && <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center pointer-events-none rounded-xl"><Loader2 className="animate-spin text-amber-500"/></div>}
            
            {filters.arrearFilter && <LocalClearBtn onClear={() => setFilter('arrearFilter', null)} />}

            {!isCompact && (
                <div className="flex items-center mb-4 shrink-0">
                    <h3 className="text-sm font-sans font-semibold tracking-wide text-gray-500 uppercase">Aging & Arrears</h3>
                </div>
            )}

            <div className="flex-1 flex flex-row items-stretch gap-2 overflow-x-auto custom-scrollbar-subtle pb-1 pr-6">
                {arrearOrder.map(arr => {
                    const sum = arrearData.find(d => d.name === arr.id)?.value || 0;
                    const isActive = filters.arrearFilter === arr.id;
                    return (
                        <button
                            key={arr.id}
                            onClick={(e) => { if (e && e.stopPropagation) e.stopPropagation(); setFilter('arrearFilter', isActive ? null : arr.id); }}
                            className={`cancel-drag [&>*]:pointer-events-none flex-1 flex flex-col items-center justify-center p-2 rounded border transition-all whitespace-nowrap min-w-[90px] ${arr.color} ${isActive ? 'ring-2 ring-offset-1 ring-gray-400' : 'hover:brightness-95'
                                }`}
                        >
                            <span className="text-[9px] font-bold uppercase tracking-wider opacity-70 mb-0.5">{arr.label}</span>
                            <span className="font-mono font-bold text-xs">{formatValue(sum)}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

// ==========================================
// WIDGET 5: Category Breakdown
// ==========================================
export const InteractiveCategory = () => {
    const { data, isFetching } = useInteractiveData();
    const { filters, setFilter } = useInteractiveStore();

    const categoryData = data?.category_summary || [];

    return (
        <div className="relative w-full h-full flex flex-col bg-white border border-gray-200 rounded-xl p-4 shadow-sm overflow-hidden">
            {isFetching && <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center pointer-events-none rounded-xl"><Loader2 className="animate-spin text-amber-500"/></div>}
            
            {filters.categoryFilter && <LocalClearBtn onClear={() => setFilter('categoryFilter', null)} />}

            <div className="flex items-center mb-4 shrink-0">
                <h3 className="text-sm font-sans font-semibold tracking-wide text-gray-500 uppercase">Volume by Category</h3>
            </div>

            <div className="flex-1 w-full min-h-0 relative cancel-drag">
                {categoryData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={categoryData} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                            <CartesianGrid horizontal={true} stroke="#f3f4f6" strokeDasharray="3 3" vertical={false} />
                            <XAxis type="number" hide />
                            <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6b7280' }} width={90} />
                            <Tooltip
                                formatter={(value) => [formatValue(value), 'Amount']}
                                contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                                cursor={{ fill: '#f3f4f6' }}
                            />
                            <Bar
                                dataKey="value"
                                radius={[0, 4, 4, 0]}
                                barSize={20}
                                isAnimationActive={false}
                                onClick={(entry, index, e) => { if (e && e.stopPropagation) e.stopPropagation(); setFilter('categoryFilter', entry.name === filters.categoryFilter ? null : entry.name); }}
                            >
                                {categoryData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={filters.categoryFilter === entry.name ? '#d97706' : '#4b5563'}
                                        className="cursor-pointer hover:opacity-80 transition-opacity"
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-400 italic font-mono">No data matches filters.</div>
                )}
            </div>
        </div>
    );
};

// ==========================================
// WIDGET 7: NEW Entity Breakdown
// ==========================================
export const InteractiveEntity = () => {
    const { data, isFetching } = useInteractiveData();
    const { filters, setFilter } = useInteractiveStore();

    const entityData = data?.entity_summary || [];

    return (
        <div className="relative w-full h-full flex flex-col bg-white border border-gray-200 rounded-xl p-4 shadow-sm overflow-hidden">
            {isFetching && <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center pointer-events-none rounded-xl"><Loader2 className="animate-spin text-amber-500"/></div>}
            
            {filters.entityFilter && <LocalClearBtn onClear={() => setFilter('entityFilter', null)} />}

            <div className="flex items-center mb-4 shrink-0">
                <h3 className="text-sm font-sans font-semibold tracking-wide text-gray-500 uppercase">Volume by Entity</h3>
            </div>

            <div className="flex-1 w-full min-h-0 relative cancel-drag">
                {entityData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={entityData} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                            <CartesianGrid horizontal={true} stroke="#f3f4f6" strokeDasharray="3 3" vertical={false} />
                            <XAxis type="number" hide />
                            <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6b7280' }} width={90} />
                            <Tooltip
                                formatter={(value) => [formatValue(value), 'Amount']}
                                contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                                cursor={{ fill: '#f3f4f6' }}
                            />
                            <Bar
                                dataKey="value"
                                radius={[0, 4, 4, 0]}
                                barSize={20}
                                isAnimationActive={false}
                                onClick={(entry, index, e) => { if (e && e.stopPropagation) e.stopPropagation(); setFilter('entityFilter', entry.name === filters.entityFilter ? null : entry.name); }}
                            >
                                {entityData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={filters.entityFilter === entry.name ? '#047857' : '#9ca3af'}
                                        className="cursor-pointer hover:opacity-80 transition-opacity"
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-400 italic font-mono">No data matches filters.</div>
                )}
            </div>
        </div>
    );
};

// ==========================================
// WIDGET 6: Filtered Ledger Table
// ==========================================
export const InteractiveLedger = () => {
    const { data, isFetching } = useInteractiveData();
    const ledgerData = data?.ledger || [];

    return (
        <div className="w-full h-full flex flex-col bg-white border border-gray-200 rounded-xl p-4 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between mb-4 shrink-0">
                <h3 className="text-sm font-sans font-semibold tracking-wide text-gray-500 uppercase">Filtered Ledger</h3>
                <span className="text-[10px] font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-500">{ledgerData.length} Rows</span>
            </div>

            <div className="flex-1 overflow-auto pr-2 relative cancel-drag">
                {isFetching && <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center pointer-events-none rounded-xl"><Loader2 className="animate-spin text-amber-600" /></div>}
                
                <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead className="sticky top-0 bg-white z-0">
                        <tr>
                            <th className="pb-2 border-b border-gray-200 text-[10px] font-bold text-gray-400 uppercase">Post Date</th>
                            <th className="pb-2 border-b border-gray-200 text-[10px] font-bold text-gray-400 uppercase">Due Date</th>
                            <th className="pb-2 border-b border-gray-200 text-[10px] font-bold text-gray-400 uppercase">Entity</th>
                            <th className="pb-2 border-b border-gray-200 text-[10px] font-bold text-gray-400 uppercase">Category</th>
                            <th className="pb-2 border-b border-gray-200 text-[10px] font-bold text-gray-400 uppercase text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="text-xs divide-y divide-gray-100 font-mono">
                        {ledgerData.map((row, i) => (
                            <tr key={i} className="hover:bg-amber-50/50 transition-colors">
                                <td className="py-2.5 text-gray-500">{row.posting_date}</td>
                                <td className="py-2.5 text-gray-500">{row.value_date}</td>
                                <td className="py-2.5 text-gray-800 font-sans font-medium truncate max-w-[100px]">{row.entity || '-'}</td>
                                <td className="py-2.5 text-gray-800 font-sans font-medium truncate max-w-[100px]">{row.category}</td>
                                <td className="py-2.5 text-right font-bold text-gray-900">{formatValue(row.amount)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {!isFetching && ledgerData.length === 0 && (
                    <div className="mt-8 text-center text-xs text-gray-400 italic">No records found for current filters.</div>
                )}
            </div>
        </div>
    );
};

// ==========================================
// WIDGET 8: Interactive Merged Volume
// ==========================================
export const InteractiveMergedVolume = () => {
    const { data, isFetching } = useInteractiveData();
    const { filters, setFilter } = useInteractiveStore();
    const [viewMode, setViewMode] = useState('category');

    const rawData = viewMode === 'category' ? (data?.category_summary || []) : (data?.entity_summary || []);
    const displayData = rawData.slice(0, 10);

    const activeFilterValue = viewMode === 'category' ? filters.categoryFilter : filters.entityFilter;

    const handleClear = () => {
        if (viewMode === 'category') setFilter('categoryFilter', null);
        else setFilter('entityFilter', null);
    };

    const handleBarClick = (entry, index, e) => {
        if (e && e.stopPropagation) e.stopPropagation();
        if (viewMode === 'category') {
            setFilter('categoryFilter', entry.name === filters.categoryFilter ? null : entry.name);
        } else {
            setFilter('entityFilter', entry.name === filters.entityFilter ? null : entry.name);
        }
    };

    return (
        <div className="relative w-full h-full flex flex-col bg-white border border-gray-200 rounded-xl p-4 shadow-sm overflow-hidden">
            {isFetching && <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center pointer-events-none rounded-xl"><Loader2 className="animate-spin text-amber-500" /></div>}
            
            {activeFilterValue && <LocalClearBtn onClear={handleClear} />}

            <div className="flex items-center justify-between mb-4 shrink-0">
                <h3 className="text-sm font-sans font-semibold tracking-wide text-gray-500 uppercase">Top 10 Volume</h3>
                
                <div className="flex bg-gray-100 p-0.5 rounded-md">
                    <button 
                        onClick={(e) => { e.stopPropagation(); setViewMode('category'); }}
                        className={`cancel-drag [&>*]:pointer-events-none px-2 py-1 text-[10px] font-bold uppercase rounded transition-colors ${viewMode === 'category' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Category
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); setViewMode('entity'); }}
                        className={`cancel-drag [&>*]:pointer-events-none px-2 py-1 text-[10px] font-bold uppercase rounded transition-colors ${viewMode === 'entity' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Entity
                    </button>
                </div>
            </div>

            <div className="flex-1 w-full min-h-0 relative cancel-drag">
                {displayData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={displayData} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                            <CartesianGrid horizontal={true} stroke="#f3f4f6" strokeDasharray="3 3" vertical={false} />
                            <XAxis type="number" hide />
                            <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6b7280' }} width={90} />
                            <Tooltip
                                formatter={(value) => [formatValue(value), 'Amount']}
                                contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                                cursor={{ fill: '#f3f4f6' }}
                            />
                            <Bar
                                dataKey="value"
                                radius={[0, 4, 4, 0]}
                                barSize={20}
                                isAnimationActive={false}
                                onClick={handleBarClick}
                            >
                                {displayData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={activeFilterValue === entry.name ? '#0284c7' : '#9ca3af'}
                                        className="cursor-pointer hover:opacity-80 transition-opacity"
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-400 italic font-mono">No data matches filters.</div>
                )}
            </div>
        </div>
    );
};