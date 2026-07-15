import React, { useState } from 'react';
import ModalSubmenus from '../Modals/ModalSubmenus';
import Modal from '../Modals/Modal';

// 1. Import our new Ledger System
import LedgerModal from '../Modals/LedgerModal'; 

/**
 * TreasuryController Component
 * 
 * Acts as the contextual router for the Royal Treasury module. 
 * Manages transition transitions between the root submenu and the 
 * placeholder double-entry worksheets.
 * 
 * @param {function} onClose - Router termination callback returning to main hub
 */
export default function TreasuryController({ onClose }) {
  const [activeView, setActiveView] = useState('menu'); // 'menu' | 'ledger' | 'statements' | 'dashboard'

  // Map view types for header configurations
  const viewMetadata = {
    ledger: { title: 'General Ledger', icon: '📖' },
    statements: { title: 'Financial Statements', icon: '📜' },
    dashboard: { title: 'Treasury Dashboard', icon: '📊' }
  };

  // Define menu operations
  const menuItems = [
    { 
      id: 'ledger', 
      icon: '📖', 
      label: 'General Ledger', 
      onClick: (id) => setActiveView(id) 
    },
    { 
      id: 'statements', 
      icon: '📜', 
      label: 'Financial Statements', 
      onClick: (id) => setActiveView(id) 
    },
    { 
      id: 'dashboard', 
      icon: '📊', 
      label: 'Treasury Dashboard', 
      onClick: (id) => setActiveView(id) 
    }
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

  // --- STATE 2: THE GENERAL LEDGER (NEW) ---
  if (activeView === 'ledger') {
    return (
      <LedgerModal 
        // We pass a custom onClose that takes the user back to the Treasury Menu 
        // instead of closing the whole module.
        onClose={() => setActiveView('menu')} 
      />
    );
  }

  // --- STATE 3: PLACEHOLDER VIEWS ---
  // Active view metadata resolution for undeveloped sections
  const currentViewMeta = viewMetadata[activeView];

  return (
    <Modal 
      title={currentViewMeta?.title || 'Treasury Module'} 
      icon={currentViewMeta?.icon || '🏦'} 
      subtitle={`Royal Treasury - ${currentViewMeta?.title}`} 
      onClose={() => setActiveView('menu')}
    >
      <div className="flex flex-col items-center justify-center p-12 text-center opacity-50">
        <span className="text-4xl mb-4">🚧</span>
        <p className="text-stone-400 font-sans tracking-widest uppercase">
          This area will be defined later
        </p>
        <button 
          onClick={() => setActiveView('menu')} 
          className="mt-8 text-amber-500 hover:text-amber-400 uppercase tracking-widest font-bold text-sm focus:outline-none"
        >
          ⟵ Return to Menu
        </button>
      </div>
    </Modal>
  );
}