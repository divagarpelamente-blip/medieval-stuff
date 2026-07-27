import React, { useEffect } from 'react';

/**
 * Universal Modal Component
 */
export default function Modal({ icon, title, subtitle, onClose, children, maxWidth = "max-w-4xl" }) {
  
  // FIX: Listen for the Escape key being pressed
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    // FIX: Added absolute inset-0 and a darkened background to create a clickable backdrop
    <div 
      className="absolute inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose} // Triggers onClose when clicking the background
    >
      <div 
        className={`w-full ${maxWidth} transition-all duration-300 ease-in-out flex flex-col max-h-full`}
        onClick={(e) => e.stopPropagation()} // Prevents clicks INSIDE the modal from closing it
      >
        <div className="bg-stone-950 border-2 border-amber-900/50 rounded-lg shadow-[0_0_60px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-full w-full">
          
          <div className="shrink-0 bg-stone-900/80 border-b border-amber-900/30 px-6 py-4 flex items-center justify-between">
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

            <button 
              onClick={onClose} 
              className="w-8 h-8 rounded-full bg-red-900/80 hover:bg-red-800 border-2 border-red-950 flex items-center justify-center text-yellow-400 font-bold transition-colors leading-none focus:outline-none"
            >
              ✕
            </button>
          </div>

          <div className="p-6 overflow-y-auto min-h-0 scrollbar-thin scrollbar-thumb-amber-900 scrollbar-track-stone-950">
            {children}
          </div>

        </div>
      </div>
    </div>
  );
}