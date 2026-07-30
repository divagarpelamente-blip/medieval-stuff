// client/src/components/sandbox/dashboard-visual-sandbox.jsx

import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Sliders, FilterX, X, Lock } from 'lucide-react';
import './visual-sandbox.css';

// --- MOCK DATA FROM IMAGE ---
const MOCK_VOLUME_DATA = [
    { name: 'Payroll', value: 35000 },
    { name: 'Medical', value: 25000 },
    { name: 'Direct Taxes', value: 5000 },
    { name: 'Refunds', value: 4000 },
    { name: 'Savings & Wallets', value: 3800 },
    { name: 'Invest Accounts', value: 3500 },
    { name: 'Checking Accounts', value: 3000 },
    { name: 'Freelance & Services', value: 2500 },
    { name: 'Maintenance', value: 2000 },
    { name: 'Cash', value: 1500 },
];

const MOCK_LEDGER = [
    { id: 1, posting_date: '2026-07-24', value_date: '2026-07-24', entity: 'Dentista', category: 'Medical', amount: '12,500.00' },
    { id: 2, posting_date: '2026-07-22', value_date: '2026-07-22', entity: '<b>hello</b>', category: 'Short-Term Goals', amount: '145.67' },
    { id: 3, posting_date: '2026-07-21', value_date: '2026-07-21', entity: 'Dinheiro (Fisico)', category: 'Cash', amount: '328.75' },
    { id: 4, posting_date: '2026-07-20', value_date: '2026-07-20', entity: 'WiZink Poupança', category: 'Savings & Wallets', amount: '96.75' },
    { id: 5, posting_date: '2026-07-19', value_date: '2026-07-19', entity: 'Inter Bank Poupança', category: 'Savings & Wallets', amount: '80.26' },
    { id: 6, posting_date: '2026-07-18', value_date: '2026-07-18', entity: 'ActivoBank Poupança', category: 'Savings & Wallets', amount: '414.55' },
    { id: 7, posting_date: '2026-07-17', value_date: '2026-07-17', entity: 'Universo Poupança', category: 'Savings & Wallets', amount: '185.09' },
    { id: 8, posting_date: '2026-07-17', value_date: '2026-07-17', entity: 'CGD Poupança', category: 'Savings & Wallets', amount: '54.40' },
    { id: 9, posting_date: '2026-07-16', value_date: '2026-07-16', entity: 'WiZink', category: 'Checking Accounts', amount: '241.91' },
    { id: 10, posting_date: '2026-07-15', value_date: '2026-07-15', entity: 'Inter Bank', category: 'Checking Accounts', amount: '149.68' },
];

export default function DashboardVisualSandbox() {
    const [viewMode, setViewMode] = useState('category');

    return (
        // Dark backdrop simulating the full screen behind the dashboard modal
        <div className="min-h-screen bg-[#12100e] flex items-center justify-center p-4 md:p-8 font-sans">
            
            {/* Main Dashboard Window */}
            <div className="w-full max-w-[1400px] h-[90vh] bg-transparent flex flex-col overflow-hidden">
                
                {/* 1. HEADER (Exact Replica) */}
                <header className="w-full h-16 shrink-0 bg-[#faf4e5]/90 border-b border-[#8b4513]/25 px-6 flex items-center justify-between z-30 shadow-sm select-none">
                    <div className="flex items-center gap-6 overflow-hidden flex-grow mr-4">
                        {/* Logo / Title */}
                        <div className="flex items-center gap-2 shrink-0">
                            <div className="w-2.5 h-2.5 rounded-full bg-[#ffd700] shadow-[0_0_8px_rgba(255,215,0,0.6)]" />
                            <span className="font-serif text-sm font-bold tracking-widest text-[#4b2c20] uppercase">
                                Citadel Command
                            </span>
                        </div>

                        <div className="h-6 w-px bg-[#8b4513]/20 shrink-0" />

                        {/* Controls */}
                        <button className="p-1.5 rounded border border-[#8b4513]/20 bg-[#faf4e5] text-[#5d4037] shrink-0">
                            <Sliders size={20} />
                        </button>
                        <button className="p-1.5 rounded border border-[#8b4513]/20 bg-[#faf4e5] text-[#5d4037] shrink-0">
                            <FilterX size={20} />
                        </button>

                        {/* 8 Tabs Grid */}
                        <nav className="grid grid-cols-4 gap-1.5 w-full max-w-[640px] shrink-0 py-0.5 items-center">
                            {/* Row 1 */}
                            <button className="insights-scroll-tab">INSIGHTS</button>
                            <button className="px-3 py-1 rounded font-serif text-[9px] font-bold tracking-wider uppercase border bg-[#f4e4bc] border-[#5d4037]/60 text-[#4b2c20] shadow-[0_0_8px_rgba(93,64,55,0.15)]">AP/AR COMMAND</button>
                            <button className="px-3 py-1 rounded font-serif text-[9px] font-bold tracking-wider uppercase border border-transparent text-[#5d4037]">ROYAL TREASURY</button>
                            <div className="opacity-50 border border-transparent px-3 py-1 text-[9px] font-serif tracking-wider uppercase text-[#8b4513]/70 font-bold flex items-center justify-center gap-0.5"><Lock size={10}/> CAMPAIGN LEDGER</div>
                            {/* Row 2 */}
                            <div className="opacity-50 border border-transparent px-3 py-1 text-[9px] font-serif tracking-wider uppercase text-[#8b4513]/70 font-bold flex items-center justify-center gap-0.5"><Lock size={10}/> CITADEL RESERVES</div>
                            <div className="opacity-50 border border-transparent px-3 py-1 text-[9px] font-serif tracking-wider uppercase text-[#8b4513]/70 font-bold flex items-center justify-center gap-0.5"><Lock size={10}/> MERCHANT GUILD</div>
                            <div className="opacity-50 border border-transparent px-3 py-1 text-[9px] font-serif tracking-wider uppercase text-[#8b4513]/70 font-bold flex items-center justify-center gap-0.5"><Lock size={10}/> VASSAL TRIBUTES</div>
                            <div className="opacity-50 border border-transparent px-3 py-1 text-[9px] font-serif tracking-wider uppercase text-[#8b4513]/70 font-bold flex items-center justify-center gap-0.5"><Lock size={10}/> WAR FUND</div>
                        </nav>
                    </div>

                    {/* Close Button */}
                    <button className="w-8 h-8 rounded-full bg-[#be123c] border border-[#7f1d1d] text-[#ffd700] flex items-center justify-center shadow-md shrink-0 ml-1.5">
                        <X size={15} className="stroke-[3]" />
                    </button>
                </header>

                {/* 2. CANVAS AREA */}
                <div 
                    className="flex-1 p-6 relative overflow-y-scroll overflow-x-hidden flex flex-col scrollbar-thin scrollbar-thumb-[#8b4513]/60 scrollbar-track-[#e8dcb8]"
                    style={{
                        backgroundImage: `
                            radial-gradient(circle at 50% 50%, transparent 30%, rgba(139, 69, 19, 0.15) 80%, rgba(75, 44, 32, 0.4) 100%),
                            linear-gradient(to right, rgba(75, 44, 32, 0.15) 0%, transparent 4%, transparent 96%, rgba(75, 44, 32, 0.15) 100%)
                        `,
                        boxShadow: 'inset 0 0 60px rgba(75, 44, 32, 0.4), inset 0 0 15px rgba(0,0,0,0.3)'
                    }}
                >
                    <div className="max-w-[1200px] w-full mx-auto grid grid-cols-12 gap-4 auto-rows-min">
                        
                        {/* ROW 1 */}
                        {/* Granularity */}
                        <div className="col-span-4 h-[90px] bg-[#faf4e5] border border-[#8b4513]/30 rounded-xl shadow-sm p-4 flex flex-col justify-center">
                            <div className="flex flex-wrap gap-2">
                                {['WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY', 'ALL TIME'].map(opt => (
                                    <div key={opt} className={`flex-1 text-center px-2 py-1.5 rounded text-[9px] font-semibold uppercase tracking-wider border min-w-[60px] ${opt === 'MONTHLY' ? 'bg-amber-900 text-amber-100 border-amber-950 shadow-inner' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                                        {opt}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Dates */}
                        <div className="col-span-4 h-[90px] bg-[#faf4e5] border border-[#8b4513]/30 rounded-xl shadow-sm p-4 flex items-center justify-center">
                            <div className="flex gap-4 w-full">
                                <div className="flex-[0.8] flex flex-col gap-1 border-r border-gray-200 pr-4">
                                    <div className="w-full border border-gray-300 rounded p-1.5 text-xs text-gray-400 font-mono text-center">--/----</div>
                                </div>
                                <div className="flex-1 flex flex-col gap-1">
                                    <div className="w-full border border-gray-300 rounded p-1.5 text-xs text-gray-400 font-mono text-center">dd/mm/yyyy</div>
                                </div>
                                <div className="flex-1 flex flex-col gap-1">
                                    <div className="w-full border border-gray-300 rounded p-1.5 text-xs text-gray-400 font-mono text-center">dd/mm/yyyy</div>
                                </div>
                            </div>
                        </div>

                        {/* Status */}
                        <div className="col-span-4 h-[90px] bg-[#faf4e5] border border-[#8b4513]/30 rounded-xl shadow-sm p-4 flex flex-row gap-2 justify-center">
                            <div className="flex-1 flex flex-col items-center justify-center p-2 rounded-lg border border-gray-200 bg-gray-50">
                                <span className="font-serif font-bold text-gray-700 text-[10px] uppercase mb-1">PENDING</span>
                                <span className="font-mono font-bold text-gray-900 text-xs">4,452.01</span>
                            </div>
                            <div className="flex-1 flex flex-col items-center justify-center p-2 rounded-lg border border-gray-200 bg-gray-50">
                                <span className="font-serif font-bold text-gray-700 text-[10px] uppercase mb-1">COMPLETED</span>
                                <span className="font-mono font-bold text-gray-900 text-xs">37,705.98</span>
                            </div>
                        </div>

                        {/* ROW 2 - Arrears */}
                        <div className="col-span-12 h-[80px] bg-[#faf4e5] border border-[#8b4513]/30 rounded-xl shadow-sm p-3 flex flex-row items-stretch gap-2">
                            <div className="flex-1 flex flex-col items-center justify-center p-2 rounded border border-blue-200 bg-blue-50 text-blue-800">
                                <span className="text-[9px] font-bold uppercase tracking-wider opacity-70 mb-0.5">NOT YET DUE</span>
                                <span className="font-mono font-bold text-xs">0.00</span>
                            </div>
                            <div className="flex-1 flex flex-col items-center justify-center p-2 rounded border border-amber-200 bg-amber-50 text-amber-800">
                                <span className="text-[9px] font-bold uppercase tracking-wider opacity-70 mb-0.5">DUE (&lt; 7 DAYS)</span>
                                <span className="font-mono font-bold text-xs">0.00</span>
                            </div>
                            <div className="flex-1 flex flex-col items-center justify-center p-2 rounded border border-orange-300 bg-orange-100 text-orange-900">
                                <span className="text-[9px] font-bold uppercase tracking-wider opacity-70 mb-0.5">PAY TODAY</span>
                                <span className="font-mono font-bold text-xs">0.00</span>
                            </div>
                            <div className="flex-1 flex flex-col items-center justify-center p-2 rounded border border-red-200 bg-red-50 text-red-800">
                                <span className="text-[9px] font-bold uppercase tracking-wider opacity-70 mb-0.5">OVERDUE</span>
                                <span className="font-mono font-bold text-xs">4,452.01</span>
                            </div>
                            <div className="flex-1 flex flex-col items-center justify-center p-2 rounded border border-emerald-200 bg-emerald-50 text-emerald-800">
                                <span className="text-[9px] font-bold uppercase tracking-wider opacity-70 mb-0.5">PAID ON TIME</span>
                                <span className="font-mono font-bold text-xs">25,205.98</span>
                            </div>
                            <div className="flex-1 flex flex-col items-center justify-center p-2 rounded border border-purple-200 bg-purple-50 text-purple-800">
                                <span className="text-[9px] font-bold uppercase tracking-wider opacity-70 mb-0.5">PAID OVERDUE</span>
                                <span className="font-mono font-bold text-xs">0.00</span>
                            </div>
                        </div>

                        {/* ROW 3 - Main Charts */}
                        {/* Top 10 Volume (Merged) */}
                        <div className="col-span-5 h-[450px] bg-[#faf4e5] border border-[#8b4513]/30 rounded-xl shadow-sm p-5 flex flex-col">
                            <div className="flex items-center justify-between mb-4 shrink-0">
                                <h3 className="text-sm font-sans font-semibold tracking-wide text-gray-500 uppercase">TOP 10 VOLUME</h3>
                                <div className="flex bg-gray-100 p-0.5 rounded-md border border-gray-200">
                                    <button 
                                        onClick={() => setViewMode('category')}
                                        className={`px-2 py-1 text-[9px] font-bold uppercase rounded ${viewMode === 'category' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
                                    >
                                        CATEGORY
                                    </button>
                                    <button 
                                        onClick={() => setViewMode('entity')}
                                        className={`px-2 py-1 text-[9px] font-bold uppercase rounded ${viewMode === 'entity' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
                                    >
                                        ENTITY
                                    </button>
                                </div>
                            </div>
                            <div className="flex-1 w-full relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={MOCK_VOLUME_DATA} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                                        <XAxis type="number" hide />
                                        <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6b7280' }} width={110} />
                                        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={12} fill="#9ca3af" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Ledger */}
                        <div className="col-span-7 h-[450px] bg-[#faf4e5] border border-[#8b4513]/30 rounded-xl shadow-sm p-5 flex flex-col">
                            <div className="flex items-center justify-between mb-4 shrink-0">
                                <h3 className="text-sm font-sans font-semibold tracking-wide text-gray-500 uppercase">FILTERED LEDGER</h3>
                                <span className="text-[10px] font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-500 border border-gray-200">101 Rows</span>
                            </div>
                            <div className="flex-1 overflow-auto pr-2">
                                <table className="w-full text-left border-collapse whitespace-nowrap">
                                    <thead className="sticky top-0 bg-[#faf4e5] z-10">
                                        <tr>
                                            <th className="pb-3 border-b border-[#8b4513]/20 text-[9px] font-bold text-gray-400 uppercase tracking-wider">POST DATE</th>
                                            <th className="pb-3 border-b border-[#8b4513]/20 text-[9px] font-bold text-gray-400 uppercase tracking-wider">DUE DATE</th>
                                            <th className="pb-3 border-b border-[#8b4513]/20 text-[9px] font-bold text-gray-400 uppercase tracking-wider">ENTITY</th>
                                            <th className="pb-3 border-b border-[#8b4513]/20 text-[9px] font-bold text-gray-400 uppercase tracking-wider">CATEGORY</th>
                                            <th className="pb-3 border-b border-[#8b4513]/20 text-[9px] font-bold text-gray-400 uppercase tracking-wider text-right">AMOUNT</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-xs divide-y divide-[#8b4513]/10 font-mono">
                                        {MOCK_LEDGER.map((row) => (
                                            <tr key={row.id}>
                                                <td className="py-3 text-gray-500">{row.posting_date}</td>
                                                <td className="py-3 text-gray-500">{row.value_date}</td>
                                                <td className="py-3 text-gray-700 font-sans font-medium">{row.entity}</td>
                                                <td className="py-3 text-gray-700 font-sans font-medium">{row.category}</td>
                                                <td className="py-3 text-right font-bold text-gray-900">{row.amount}</td>
                                            </tr>
                                        ))}
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