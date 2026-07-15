import React, { useState } from 'react';
import Modal from '../Modals/Modal';

/**
 * ModalTabmenus Component
 * 
 * A reusable template for tabbed modal layouts. Imports and wraps its 
 * content in the universal <Modal> component, rendering a horizontal 
 * navigation menu to toggle sub-content areas seamlessly.
 * 
 * @param {string} icon - Header icon symbol
 * @param {string} title - Header title text
 * @param {string} subtitle - Header subtitle text
 * @param {function} onClose - Frame dismiss callback
 * @param {Array} tabs - Tab parameters structured as: { id, label, icon, content }
 */
export default function ModalTabmenus({ icon, title, subtitle, onClose, tabs }) {
  // Set default active tab to the first elements id
  const [activeTabId, setActiveTabId] = useState(tabs[0]?.id || '');

  // Find currently active tab payload
  const activeTab = tabs.find((t) => t.id === activeTabId);

  return (
    <Modal icon={icon} title={title} subtitle={subtitle} onClose={onClose}>
      
      {/* 1. Horizontal Tab Bar */}
      <div className="flex border-b border-amber-900/30 mb-6 overflow-x-auto custom-scrollbar-subtle">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 uppercase tracking-widest text-xs whitespace-nowrap transition-all outline-none focus:outline-none ${
                isActive
                  ? 'border-b-2 border-amber-500 text-amber-500 font-bold'
                  : 'border-b-2 border-transparent text-stone-400 hover:text-stone-200 hover:border-stone-600 font-medium'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 2. Active Content Area */}
      <div className="animate-fade-in">
        {activeTab?.content || null}
      </div>

    </Modal>
  );
}