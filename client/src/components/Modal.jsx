import React from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children, footer, size = 'max-w-xl' }) => {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 bg-black/90 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className={`bg-[#f4e4bc] w-full ${size} max-h-[85%] rounded-xl border-[8px] border-[#5d4037] shadow-[0_0_50px_rgba(0,0,0,0.9)] relative flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300`}>
        
        {/* Parchment Texture */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-25 mix-blend-multiply"
          style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/paper-fibers.png')" }}
        />

        {/* Ornate Corners */}
        <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-[#8b4513]/30 rounded-tl-lg pointer-events-none" />
        <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-[#8b4513]/30 rounded-tr-lg pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-[#8b4513]/30 rounded-bl-lg pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-[#8b4513]/30 rounded-br-lg pointer-events-none" />

        {/* Wax Seal Close Button */}
        <button 
          onClick={onClose}
          className="absolute -top-1 -right-1 w-12 h-12 bg-[#8b0000] rounded-full flex items-center justify-center border-4 border-[#5d0000] z-[110] shadow-[0_4px_10px_rgba(0,0,0,0.5)] active:scale-90 transition-transform group"
        >
          <div className="absolute inset-0 rounded-full border-2 border-white/20 animate-pulse" />
          <X size={24} className="text-[#ffd700] group-hover:rotate-90 transition-transform" />
        </button>

        {/* Header Ribbon */}
        <div className="relative h-20 flex items-center justify-center z-10 pt-4">
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[110%] h-12 bg-gradient-to-r from-[#8b4513] via-[#5d4037] to-[#8b4513] shadow-lg transform -rotate-1 skew-x-12 z-0 border-y-2 border-[#d4af37]" />
          <h2 className="title-font text-xl sm:text-2xl text-[#ffd700] font-bold uppercase tracking-[0.2em] relative z-10 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
            {title}
          </h2>
        </div>

        {/* Body */}
        <div className="p-6 sm:p-10 overflow-y-auto custom-scrollbar-subtle flex-grow relative z-10 text-[#2d1b0d]">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="p-6 bg-black/5 border-t-2 border-[#8b4513]/10 flex gap-4 justify-center relative z-10">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
