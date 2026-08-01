import React, { useState } from 'react';
import ModalSubmenus from '../../ui/ModalSubmenus';
import Modal from '../../ui/Modal';
import TransactionForm from './TransactionForm';
import LedgerTable from './LedgerTable';

/**
 * TreasuryController Component
 * 
 * Acts as the contextual router for the Royal Treasury module. 
 */
export default function TreasuryController({ initialView, onClose }) {
  const [activeView, setActiveView] = useState(initialView || 'menu');
  const [editingTransaction, setEditingTransaction] = useState(null); 
  const [activeTab, setActiveTab] = useState('ledger'); 

  const viewMetadata = {
    ledger: { title: 'General Ledger', icon: '📖' },
    statements: { title: 'Financial Statements', icon: '📜' },
    dashboard: { title: 'Treasury Dashboard', icon: '📊' }
  };

  const menuItems = [
    { id: 'ledger', icon: '📖', label: 'General Ledger', onClick: (id) => setActiveView(id) },
    { id: 'statements', icon: '📜', label: 'Financial Statements', onClick: (id) => setActiveView(id) },
    { id: 'dashboard', icon: '📊', label: 'Treasury Dashboard', onClick: (id) => setActiveView(id) }
  ];

  // --- STATE 1: THE MAIN MENU ---
  if (activeView === 'menu') {
    return (
      <ModalSubmenus
        title="Royal Treasury Menu"
        icon="🏦"
        subtitle="Select a treasury function"
        onClose={onClose}
        menuItems={menuItems}
      />
    );
  }

  // --- STATE 2: THE GENERAL LEDGER (Custom Frameless Window) ---
  if (activeView === 'ledger') {
    return (
      <div 
        className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 md:p-6" 
        onClick={() => {
          if (initialView) onClose();
          else setActiveView('menu');
          setEditingTransaction(null);
          setActiveTab('ledger');
        }}
      >
        <div 
          className="w-full h-full max-w-[1400px] bg-stone-950 rounded-2xl overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.95)] border-2 border-amber-900/80 flex flex-col font-serif" 
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Bar: Tabs & Close Button */}
          <div className="flex items-center justify-between p-4 border-b border-amber-900/50 bg-stone-900/90 shrink-0 shadow-lg">
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab('ledger')}
                className={`px-4 py-2 font-bold uppercase tracking-widest text-xs rounded transition border ${
                  activeTab === 'ledger'
                    ? 'bg-amber-600 text-stone-950 border-amber-400'
                    : 'bg-stone-900 text-stone-400 border-transparent hover:text-amber-500 hover:border-stone-700'
                }`}
              >
                General Ledger
              </button>
              <button
                onClick={() => setActiveTab('new_transaction')}
                className={`px-4 py-2 font-bold uppercase tracking-widest text-xs rounded transition border ${
                  activeTab === 'new_transaction'
                    ? 'bg-amber-600 text-stone-950 border-amber-400'
                    : 'bg-stone-900 text-stone-400 border-transparent hover:text-amber-500 hover:border-stone-700'
                }`}
              >
                New Transaction
              </button>
            </div>
            
            <button 
              onClick={() => {
                if (initialView) onClose();
                else setActiveView('menu');
                setEditingTransaction(null);
                setActiveTab('ledger');
              }}
              className="w-8 h-8 rounded-full bg-rose-950/40 border border-rose-900/60 flex items-center justify-center text-rose-400 hover:text-rose-300 hover:bg-rose-900/50 transition-colors focus:outline-none shadow"
              title="Close"
            >
              ✕
            </button>
          </div>

          {/* Dynamic Body Content */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-stone-950 p-4 md:p-6">
            {activeTab === 'ledger' && (
              <LedgerTable
                onEditTransaction={(txn) => {
                  setEditingTransaction(txn);
                  setActiveTab('new_transaction');
                }}
              />
            )}
            
            {activeTab === 'new_transaction' && (
              <TransactionForm
                editingTransaction={editingTransaction}
                onCancelEdit={() => {
                  setEditingTransaction(null);
                  setActiveTab('ledger');
                }}
                onSuccess={() => setActiveTab('ledger')}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- STATE 3: PLACEHOLDER VIEWS ---
  const currentViewMeta = viewMetadata[activeView];

  return (
    <Modal
      title={currentViewMeta?.title || 'Treasury Module'}
      icon={currentViewMeta?.icon || '🏦'}
      subtitle={`Royal Treasury - ${currentViewMeta?.title}`}
      onClose={() => {
        if (initialView) onClose();
        else setActiveView('menu');
      }}
    >
      <div className="flex flex-col items-center justify-center p-12 text-center opacity-50">
        <span className="text-4xl mb-4">🚧</span>
        <p className="text-stone-400 font-sans tracking-widest uppercase">
          This area will be defined later
        </p>
        <button
          onClick={() => {
            if (initialView) onClose();
            else setActiveView('menu');
          }}
          className="mt-8 text-amber-500 hover:text-amber-400 uppercase tracking-widest font-bold text-sm focus:outline-none"
        >
          ⟵ {initialView ? 'Return to Hub' : 'Return to Menu'}
        </button>
      </div>
    </Modal>
  );
}