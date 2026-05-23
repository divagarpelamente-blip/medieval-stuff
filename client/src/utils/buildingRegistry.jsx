import React from 'react';
import GoldAnalytics from '../components/GoldAnalytics';

/**
 * Registry of kingdom structures. Only Treasury (mine) has a full implementation.
 * Other buildings show a "Coming Soon" placeholder until their features are built.
 */

const ComingSoon = ({ title }) => (
  <div className="flex flex-col items-center justify-center py-12 space-y-4 text-center">
    <div className="w-20 h-20 rounded-2xl bg-[#4b2c20]/5 border-2 border-dashed border-[#4b2c20]/20 flex items-center justify-center text-4xl">
      🏰
    </div>
    <div>
      <h3 className="title-font text-[#4b2c20] text-lg font-black uppercase tracking-widest">{title}</h3>
      <p className="text-xs text-[#4b2c20]/50 italic mt-1">
        "The royal architects are still building this wing, Sire."
      </p>
      <span className="inline-block mt-3 px-3 py-1 bg-[#4b2c20]/10 text-[#4b2c20]/60 text-[10px] font-black uppercase tracking-widest rounded-full border border-dashed border-[#4b2c20]/20">
        Coming Soon
      </span>
    </div>
  </div>
);

export const buildingRegistry = {
  mine: {
    title: "Gold Mine",
    modalSize: "max-w-2xl",
    footer: null,
    renderContent: ({ userId }) => <GoldAnalytics userId={userId} />
  },
  bounties: {
    title: "Monsters & Bounties",
    modalSize: "max-w-xl",
    footer: null,
    renderContent: () => <ComingSoon title="Monsters & Bounties" />
  },
  tavern: {
    title: "The Rusty Tankard",
    modalSize: "max-w-xl",
    footer: null,
    renderContent: () => <ComingSoon title="The Rusty Tankard" />
  },
  townhouse: {
    title: "Village Housing",
    modalSize: "max-w-xl",
    footer: null,
    renderContent: () => <ComingSoon title="Village Housing" />
  },
  market: {
    title: "Central Market",
    modalSize: "max-w-xl",
    footer: null,
    renderContent: () => <ComingSoon title="Central Market" />
  },
  townhall: {
    title: "Town Hall",
    modalSize: "max-w-xl",
    footer: null,
    renderContent: () => <ComingSoon title="Town Hall" />
  }
};

export default buildingRegistry;
