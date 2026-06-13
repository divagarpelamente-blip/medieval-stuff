import React from 'react';

const RoyalTreasurerInsights = ({ adviceText, t }) => {
  return (
    <div className="p-4 flex flex-col justify-center h-full">
      <div className="flex gap-4 items-start">
        <div className="text-4xl leading-none pt-1">🧙‍♂️</div>
        <div>
          <h5 className="text-[10px] font-black uppercase text-[#8b4513]/85 tracking-widest font-sans leading-none mb-2">
            {t('treasurer_advice_banner', "Royal Treasurer's Counsel")}
          </h5>
          <p className="text-xs italic text-[#4b2c20] font-serif leading-relaxed m-0">
            {adviceText}
          </p>
        </div>
      </div>
    </div>
  );
};

export default RoyalTreasurerInsights;
