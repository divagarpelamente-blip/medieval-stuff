
const HUD = ({ profile, diamonds = 1000 }) => {
  const level = profile?.level || 1;
  const xp = profile?.xp || 0;
  const maxXp = 100 * Math.pow(1.5, level - 1);
  const xpPerc = (xp / maxXp) * 100;

  return (
    <div className="absolute top-0 left-0 right-0 h-20 sm:h-24 z-50 bg-gradient-to-b from-black/80 to-transparent p-3 sm:px-8 flex items-center justify-between">
      <div className="flex items-center gap-2 sm:gap-4">
        <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-white bg-stone-800 shadow-lg overflow-visible">
          {/* Using placeholder for avatar */}
          <img 
            src="https://api.dicebear.com/7.x/pixel-art/svg?seed=EldoriaHero" 
            alt="Hero Avatar" 
            className="rounded-full w-full h-full"
          />
          <div className="absolute -bottom-1 -right-1 bg-[#ff4444] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-white">
            {level}
          </div>
        </div>
        
        <div>
          <div className="title-font text-xs text-white leading-none mb-1">
            {profile?.email?.split('@')[0] || 'Lord/Lady'}
          </div>
          <div className="flex items-center gap-1">
            <div className="w-20 h-1.5 bg-gray-950 rounded-full border border-gray-800 overflow-hidden">
              <div 
                className="h-full bg-[#32CD32] transition-all duration-500" 
                style={{ width: `${xpPerc}%` }}
              />
            </div>
            <span className="text-[8px] text-gray-400 font-bold">{Math.floor(xp)}/{Math.floor(maxXp)}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="resource-pill gold">
          <span className="text-xs">💰</span>
          <span className="text-xs font-bold text-yellow-400">
            {profile?.gold?.toLocaleString() || '0'}
          </span>
        </div>
        <div className="resource-pill diamond">
          <span className="text-xs">💎</span>
          <span className="text-xs font-bold text-cyan-400">
            {diamonds.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default HUD;
