import React from 'react';
import { X, LayoutDashboard } from 'lucide-react';
import AccountManager from './treasury/AccountManager';
import parchmentBg from '../assets/Parchment_menu_1.PNG';

const DashboardView = ({ onBack, userId, profile, onRefresh }) => {
  return (
    <div className="absolute inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
      {/* Parchment Container */}
      <div className="relative w-full max-w-6xl h-[94%] overflow-hidden rounded-3xl shadow-2xl flex flex-col items-center">
        {/* Background Image Asset */}
        <img src={parchmentBg} className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none" alt="Parchment" />
        {/* Dark Brown Overlay */}
        <div className="absolute inset-0 bg-[#3e2723]/10 pointer-events-none" />

        {/* Content Container */}
        <div className="relative z-10 w-full h-full p-8 flex flex-col overflow-hidden">
          <AccountManager 
            userId={userId} 
            profile={profile} 
            onRefresh={onRefresh} 
            onBack={onBack} 
          />
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
