import React from 'react';

/**
 * Universal Modal Component
 * 
 * Implements a reusable, atmospheric medieval stone-board frame design.
 * Accepts header parameters, handles modal dismiss triggers, and provides
 * a scroll-constrained body element for dynamic child views.
 * 
 * @param {string} icon - Emoji or symbol icon representing the active view
 * @param {string} title - Header title text
 * @param {string} subtitle - Secondary description text
 * @param {function} onClose - Frame closure handler callback
 * @param {React.ReactNode} children - Embedded modal content
 * @param {string} maxWidth - Tailwind max-width class (defaults to max-w-4xl)
 */
export default function Modal({ icon, title, subtitle, onClose, children, maxWidth = "max-w-4xl" }) {
  return (
    <div className={`w-full ${maxWidth} animate-fade-in transition-all duration-300 ease-in-out`}>
      
      {/* Stone Board Frame Wrapper */}
      <div className="bg-stone-950 border-2 border-amber-900/50 rounded-lg shadow-[0_0_60px_rgba(0,0,0,0.9)] overflow-hidden backdrop-blur-md">
        
        {/* Dynamic Medieval Header */}
        <div className="bg-stone-900/80 border-b border-amber-900/30 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {icon && <span className="text-2xl">{icon}</span>}
            <div>
              <h2 className="text-lg font-bold text-amber-400 uppercase tracking-widest">
                {title}
              </h2>
              {subtitle && (
                <p className="text-[10px] text-stone-400 uppercase tracking-wider font-sans">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Circular Red Close Button */}
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-red-900/80 hover:bg-red-800 border-2 border-red-950 flex items-center justify-center text-yellow-400 font-bold transition-colors leading-none focus:outline-none"
          >
            ✕
          </button>
        </div>

        {/* Dynamic Modal Content Area - Increased max height for larger nested views */}
        <div className="p-6 overflow-y-auto max-h-[85vh] scrollbar-thin scrollbar-thumb-amber-900 scrollbar-track-stone-950">
          {children}
        </div>

      </div>

    </div>
  );
}