import React from 'react';
import Modal from '../Modals/Modal';

/**
 * ModalSubmenus Component
 * 
 * A reusable template for modal menu layouts. Imports and wraps its 
 * content in the universal <Modal> component, rendering a list of 
 * styled navigation buttons.
 * 
 * @param {string} icon - Header icon symbol
 * @param {string} title - Header title text
 * @param {string} subtitle - Header subtitle text
 * @param {function} onClose - Frame dismiss callback
 * @param {Array} menuItems - Objects structured as: { id, icon, label, onClick }
 */
export default function ModalSubmenus({ icon, title, subtitle, onClose, menuItems }) {
  return (
    <Modal icon={icon} title={title} subtitle={subtitle} onClose={onClose}>
      <div className="flex flex-col gap-4">
        {menuItems.map((item) => (
          <button 
            key={item.id}
            onClick={() => item.onClick(item.id)} 
            className="w-full flex items-center gap-4 p-4 bg-stone-900/50 border-2 border-stone-800/80 rounded-lg hover:border-amber-700/80 hover:bg-stone-800 transition-all text-left group"
          >
            <span className="text-3xl group-hover:scale-110 transition-transform">
              {item.icon}
            </span>
            <span className="font-bold text-stone-200 tracking-widest uppercase">
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </Modal>
  );
}