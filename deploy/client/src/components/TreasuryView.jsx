import React, { useState } from 'react';
import { ArrowLeft, Book, Box, X } from 'lucide-react';
import treasuryInterior from '../assets/Treasury_Interior.png';
import parchmentBg from '../assets/Parchment_Menu_1.png';
import RecordForm from './treasury/RecordForm';
import RecordsTable from './treasury/RecordsTable';
import AccountManager from './treasury/AccountManager';
import ImportView from './treasury/ImportView';

const TreasuryView = ({ onBack, treasuryData, profile, onRefresh }) => {
  const [showLedger, setShowLedger] = useState(false);
  const [ledgerMode, setLedgerMode] = useState('menu'); // 'menu', 'new', 'view', 'manage', 'import'

  // Helper to refresh data across all views
  const handleRefresh = () => {
    if (onRefresh) onRefresh();
  };

  return (
    <div className="absolute inset-0 z-[100] bg-black animate-in fade-in duration-500 overflow-hidden">
      {/* Background Image */}
      <img 
        src={treasuryInterior} 
        className="w-full h-full object-cover select-none" 
        alt="Treasury Interior" 
      />

      {/* Navigation Overlay */}
      {!showLedger && (
        <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start pointer-events-none">
          <button 
            onClick={onBack}
            className="pointer-events-auto bg-black/60 backdrop-blur-md p-3 rounded-full text-white border border-white/10 hover:bg-black/80 transition-all active:scale-95 group"
          >
            <ArrowLeft className="group-hover:-translate-x-1 transition-transform" />
          </button>

          <div className="pointer-events-auto bg-black/60 backdrop-blur-md px-6 py-3 rounded-2xl border border-[#d4af37]/30 text-right">
             <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest mb-1">Treasury Reserves</p>
             <p className="text-2xl font-black text-[#ffd700] title-font">{Math.floor(profile.gold)} 💰</p>
          </div>
        </div>
      )}

      {/* HitZones */}
      
      {/* 1. The Ledger (Book on desk) */}
      <div 
        className="absolute top-[65%] left-[20%] w-[15%] h-[15%] cursor-pointer group z-10"
        onClick={() => {
          setLedgerMode('menu');
          setShowLedger(true);
        }}
      >
        <div className="absolute inset-0 bg-[#ffd700]/0 group-hover:bg-[#ffd700]/10 transition-colors rounded-lg border-2 border-transparent group-hover:border-[#ffd700]/40" />
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-black/90 text-[#ffd700] text-[10px] px-3 py-2 rounded border border-[#d4af37]/30 opacity-0 group-hover:opacity-100 transition-all title-font uppercase tracking-widest whitespace-nowrap shadow-2xl flex items-center gap-2">
          <Book size={14} />
          Royal Ledger
        </div>
      </div>

      {/* 2. The Shelves (Center) */}
      <div 
        className="absolute top-[25%] left-[40%] w-[20%] h-[35%] cursor-pointer group z-10"
        onClick={() => console.log('Shelves clicked')}
      >
        <div className="absolute inset-0 bg-[#ffd700]/0 group-hover:bg-[#ffd700]/10 transition-colors rounded-lg border-2 border-transparent group-hover:border-[#ffd700]/40" />
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-black/90 text-[#ffd700] text-[10px] px-3 py-2 rounded border border-[#d4af37]/30 opacity-0 group-hover:opacity-100 transition-all title-font uppercase tracking-widest whitespace-nowrap shadow-2xl flex items-center gap-2">
          <Box size={14} />
          Resource Vault
        </div>
      </div>

      {/* Ledger Overlay */}
      {showLedger && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-md z-[110] flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-300">
           {/* Parchment Container */}
           <div className={`relative w-full ${ledgerMode === 'menu' ? 'max-w-sm aspect-[4/5]' : 'max-w-4xl h-[80vh]'} overflow-hidden rounded-lg shadow-2xl flex flex-col items-center transition-all duration-500`}>
              {/* Actual Parchment Background Asset */}
              <img src={parchmentBg} className="absolute inset-0 w-full h-full object-fill" alt="Parchment" />
              {/* Dark Brown Overlay to reduce yellowness */}
              <div className="absolute inset-0 bg-[#3e2723]/10 pointer-events-none" />
              
              {/* Content Container */}
              <div className="relative z-10 w-full h-full p-10 pt-16 flex flex-col items-center overflow-hidden">
                {ledgerMode === 'menu' ? (
                  <>
                    <h2 
                      className="title-font text-3xl mb-1 tracking-tight font-black uppercase"
                      style={{ color: '#1a1a1a', textShadow: '1px 1px 0px rgba(255,255,255,0.5)' }}
                    >
                      Royal Ledger
                    </h2>
                    <div className="w-32 h-0.5 bg-[#4b2c20]/20 mb-6" />

                    <div className="w-full space-y-3 px-4">
                      <button 
                        onClick={() => setLedgerMode('new')}
                        className="w-full py-4 px-6 bg-black/5 hover:bg-black/10 border-2 border-[#4b2c20]/20 rounded-xl transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 group"
                      >
                        <span className="title-font text-[#4b2c20] text-base font-black uppercase tracking-widest">New Record</span>
                      </button>
                      
                      <button 
                        onClick={() => setLedgerMode('view')}
                        className="w-full py-4 px-6 bg-black/5 hover:bg-black/10 border-2 border-[#4b2c20]/20 rounded-xl transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 group"
                      >
                        <span className="title-font text-[#4b2c20] text-base font-black uppercase tracking-widest">View Records</span>
                      </button>

                      <button 
                        onClick={() => setLedgerMode('manage')}
                        className="w-full py-4 px-6 bg-black/5 hover:bg-black/10 border-2 border-[#4b2c20]/20 rounded-xl transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 group"
                      >
                        <span className="title-font text-[#4b2c20] text-base font-black uppercase tracking-widest">Manage Treasure</span>
                      </button>

                      <button 
                        onClick={() => setLedgerMode('import')}
                        className="w-full py-4 px-6 bg-black/5 hover:bg-black/10 border-2 border-[#4b2c20]/20 rounded-xl transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 group"
                      >
                        <span className="title-font text-[#4b2c20] text-base font-black uppercase tracking-widest">Import Archive</span>
                      </button>
                    </div>

                    <button 
                      onClick={() => setShowLedger(false)}
                      className="mt-6 flex items-center gap-2 title-font text-[#4b2c20] font-bold uppercase text-xs tracking-widest hover:scale-110 transition-transform bg-black/5 px-4 py-2 rounded-full border border-[#4b2c20]/10"
                    >
                      <X size={14} />
                      Close Ledger
                    </button>
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                      <button 
                        onClick={() => setLedgerMode('menu')}
                        className="flex items-center gap-2 title-font text-[#2d1e1e] font-bold uppercase text-xs tracking-widest hover:scale-110 transition-transform"
                      >
                        <ArrowLeft size={16} />
                        Back to Menu
                      </button>
                      <h2 
                        className="title-font text-2xl font-black uppercase tracking-widest"
                        style={{ color: '#4b2c20' }}
                      >
                        {ledgerMode === 'new' ? 'New Entry' : ledgerMode === 'view' ? 'Royal Records' : ledgerMode === 'manage' ? 'Manage Treasure' : 'Archive Import'}
                      </h2>
                      <div className="w-20" /> {/* Spacer */}
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                      {ledgerMode === 'new' && <RecordForm userId={profile?.id} onSuccess={() => { setLedgerMode('view'); handleRefresh(); }} onRefresh={handleRefresh} />}
                      {ledgerMode === 'view' && <RecordsTable />}
                      {ledgerMode === 'manage' && <AccountManager userId={profile?.id} onRefresh={handleRefresh} />}
                      {ledgerMode === 'import' && <ImportView userId={profile?.id} onComplete={() => { setLedgerMode('view'); handleRefresh(); }} />}
                    </div>
                  </div>
                )}
              </div>
           </div>
        </div>
      )}

      {/* Bottom Info Bar */}
      {!showLedger && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-full max-w-md px-6 pointer-events-none">
          <div className="bg-black/60 backdrop-blur-md p-6 rounded-3xl border border-white/10 text-center space-y-1">
             <h2 className="title-font text-[#ffd700] text-xl uppercase tracking-[0.2em]">Royal Treasury</h2>
             <p className="text-[10px] text-gray-400 italic">"Wealth is the foundation of your legacy, Sire."</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TreasuryView;
