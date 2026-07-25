import React from 'react';

/**
 * Universal Modal Component
 */
export default function Modal({ icon, title, subtitle, onClose, children, maxWidth = "max-w-4xl" }) {
  return (
    // Added: flex flex-col max-h-full
    <div className={`w-full ${maxWidth} animate-fade-in transition-all duration-300 ease-in-out flex flex-col max-h-full`}>
      
      {/* Added: flex flex-col max-h-full w-full */}
      <div className="bg-stone-950 border-2 border-amber-900/50 rounded-lg shadow-[0_0_60px_rgba(0,0,0,0.9)] overflow-hidden backdrop-blur-md flex flex-col max-h-full w-full">
        
        {/* Added: shrink-0 (prevents the header from getting squished when scrolling happens) */}
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

        {/* Added: min-h-0 overflow-y-auto (tells the body to handle the scrollbar) */}
        <div className="p-6 overflow-y-auto min-h-0 scrollbar-thin scrollbar-thumb-amber-900 scrollbar-track-stone-950">
          {children}
        </div>

      </div>
    </div>
  );
}