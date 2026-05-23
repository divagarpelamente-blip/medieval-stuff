import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import Auth from './components/Auth';
import HUD from './components/HUD';
import BottomNav from './components/BottomNav';
import IsometricMap from './components/IsometricMap';
import Modal from './components/Modal';
import TreasuryView from './components/TreasuryView';
import { Wallet, ShieldAlert, Layout } from 'lucide-react';
import bgMap from './assets/Medieval_Town_Backround.png';
import treasuryInterior from './assets/Treasury_Interior.png';

const GUEST_SESSION = {
  user: {
    id: '00000000-0000-0000-0000-000000000000',
    email: 'guest@medieval.stuff'
  }
};

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [buildings, setBuildings] = useState([]);
  const [activeTab, setActiveTab] = useState('base');
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [currentView, setCurrentView] = useState('map'); // 'map' or 'treasury'

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session: activeSession } }) => {
      if (activeSession) {
        setSession(activeSession);
        fetchUserData(activeSession.user.id);
      } else {
        setSession(GUEST_SESSION);
        fetchUserData(GUEST_SESSION.user.id);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (newSession) {
        setSession(newSession);
        fetchUserData(newSession.user.id);
      } else {
        setSession(GUEST_SESSION);
        fetchUserData(GUEST_SESSION.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!buildings.length) return;
    const interval = setInterval(() => {
      setBuildings(prev => prev.map(b => ({
        ...b,
        stored_resources: b.stored_resources + (12 * b.level) / 60
      })));
    }, 1000);
    return () => clearInterval(interval);
  }, [buildings.length]);

  const fetchUserData = async (userId) => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles').select('*').eq('id', userId).single();
      if (profileError) throw profileError;
      setProfile(profileData);

      const { data: buildingsData, error: buildingsError } = await supabase
        .from('buildings').select('*').eq('profile_id', userId);
      if (buildingsError) throw buildingsError;
      
      const now = new Date();
      const updatedBuildings = buildingsData.map(b => {
        const lastCol = new Date(b.last_collection);
        const secondsElapsed = (now - lastCol) / 1000;
        const incomePerSecond = (12 * b.level) / 60;
        return { ...b, stored_resources: secondsElapsed * incomePerSecond };
      });
      setBuildings(updatedBuildings);
    } catch (err) {
      console.error('Error fetching data:', err.message);
    }
  };

  const handleCollectGold = async (buildingId, amount) => {
    if (!profile || amount <= 0) return;
    try {
      await supabase.from('profiles').update({ gold: profile.gold + Math.floor(amount) }).eq('id', session.user.id);
      await supabase.from('buildings').update({ stored_resources: 0, last_collection: new Date().toISOString() }).eq('id', buildingId);
      fetchUserData(session.user.id);
    } catch (err) {
      alert('Failed to collect gold: ' + err.message);
    }
  };

  const handleUpgradeBuilding = async (building) => {
    const cost = Math.floor(100 * Math.pow(building.level, 1.8));
    if (profile.gold < cost) return;
    try {
      await supabase.from('profiles').update({ gold: profile.gold - cost }).eq('id', session.user.id);
      await supabase.from('buildings').update({ level: building.level + 1, last_collection: new Date().toISOString() }).eq('id', building.id);
      fetchUserData(session.user.id);
    } catch (err) {
      alert('Upgrade failed: ' + err.message);
    }
  };

  const handleBuildingClick = (buildingType) => {
    if (buildingType === 'treasury') {
      setCurrentView('treasury');
    } else {
      setSelectedBuilding(buildingType);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-[#ffd700] border-t-transparent rounded-full animate-spin" />
        <p className="title-font text-[#ffd700] tracking-widest uppercase text-sm">Carregando Eldoria...</p>
      </div>
    );
  }

  if (!session) return <Auth onAuthSuccess={(s) => { setSession(s); if (s) fetchUserData(s.user.id); }} />;

  const treasuryBuilding = buildings.find(b => b.type === 'treasury');

  return (
    <div className="min-h-screen bg-black flex items-center justify-center overflow-hidden">
      <div className="game-viewport">
        {/* Loading Screen Overlay (simulated for internal state changes) */}
        {!profile && (
          <div className="absolute inset-0 bg-black z-[1000] flex flex-col justify-center items-center">
            <div className="w-12 h-12 border-5 border-white border-b-[#ffd700] rounded-full animate-spin" />
            <p className="title-font mt-4 text-[#ffd700]">Loading Kingdom...</p>
          </div>
        )}

        {/* HUD Superior */}
        <HUD profile={profile} />

        {/* Mapa Isométrico */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {/* Background Map - Now using the high-quality generated landscape */}
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${bgMap})` }}
          />
          
          <IsometricMap 
            onBuildingClick={handleBuildingClick}
            buildings={buildings}
          />
        </div>

        {/* Quest Tracker */}
        <div className="absolute bottom-24 left-4 right-4 quest-tracker z-40 pointer-events-none">
          <p className="text-[10px] uppercase font-black mb-0.5">Active Mission</p>
          <p className="text-white text-xs font-medium">Extract resources in the Gold Mine and upgrade your Treasury to Level { (treasuryBuilding?.level || 0) + 1 }</p>
        </div>

        {/* Navegação Inferior */}
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Modais de Edifícios */}
        <Modal 
          isOpen={!!selectedBuilding} 
          onClose={() => setSelectedBuilding(null)}
          title={
            selectedBuilding === 'treasury' ? 'Royal Treasury' :
            selectedBuilding === 'townhouse' ? 'Village Housing' :
            selectedBuilding === 'market' ? 'Central Market' :
            selectedBuilding === 'mine' ? 'Gold Mine' :
            selectedBuilding === 'townhall' ? 'Town Hall' :
            selectedBuilding === 'bounties' ? 'Bounty Board' :
            selectedBuilding === 'tavern' ? 'The Rusty Tankard' :
            selectedBuilding === 'lake' ? 'The Enchanted Lake' : 'Building'
          }
          footer={
            selectedBuilding === 'treasury' ? null : 
            selectedBuilding === 'bounties' ? (
              <button className="px-8 py-4 rounded-xl bg-gradient-to-b from-[#32CD32] to-[#228B22] text-white font-black text-sm uppercase tracking-wider shadow-[0_6px_0_#1a3c1a] active:translate-y-1 active:shadow-[0_2px_0_#1a3c1a] border-2 border-white/10">
                Start Mission
              </button>
            ) : null
          }
        >
          {selectedBuilding === 'bounties' ? (
            <div className="space-y-6 text-center py-4">
               <div className="flex justify-center">
                  <div className="w-24 h-24 bg-red-900/10 rounded-full flex items-center justify-center border-4 border-red-900/20">
                    <ShieldAlert size={48} className="text-red-900" />
                  </div>
               </div>
               <div className="space-y-2">
                  <h3 className="title-font text-red-900 text-lg uppercase tracking-widest">Wanted: Dead or Alive</h3>
                  <p className="text-xs text-stone-600 italic px-4">
                    "There are dangerous beasts and bandits roaming the outskirts of Eldoria. Claim these bounties to earn fame and fortune."
                  </p>
               </div>
               <div className="grid grid-cols-1 gap-4 pt-4">
                  <button className="w-full py-4 rounded-xl bg-gradient-to-r from-red-800 to-red-950 text-white font-black text-sm uppercase tracking-wider shadow-lg hover:brightness-110 transition-all border border-white/20">
                    View Contracts
                  </button>
               </div>
            </div>
          ) : selectedBuilding === 'tavern' ? (
            <div className="space-y-6 text-center py-4">
               <div className="flex justify-center">
                  <div className="w-24 h-24 bg-amber-700/10 rounded-full flex items-center justify-center border-4 border-amber-700/20">
                    <Wallet size={48} className="text-amber-700" />
                  </div>
               </div>
               <div className="space-y-2">
                  <h3 className="title-font text-amber-700 text-lg uppercase tracking-widest">A Warm Welcome</h3>
                  <p className="text-xs text-stone-600 italic px-4">
                    "Rest your weary bones, traveler. Here, the ale is cold, the stew is hot, and the rumors are always flowing."
                  </p>
               </div>
               <div className="grid grid-cols-1 gap-4 pt-4">
                  <button className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-800 text-white font-black text-sm uppercase tracking-wider shadow-lg hover:brightness-110 transition-all border border-white/20">
                    Hire Mercenaries
                  </button>
               </div>
            </div>
          ) : selectedBuilding === 'lake' ? (
            <div className="space-y-6 text-center py-4">
               <div className="flex justify-center">
                  <div className="w-24 h-24 bg-blue-500/10 rounded-full flex items-center justify-center border-4 border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                    <ShieldAlert size={48} className="text-blue-500" />
                  </div>
               </div>
               
               <div className="space-y-2">
                  <h3 className="title-font text-blue-700 text-lg uppercase tracking-widest">Secret Whispers</h3>
                  <p className="text-xs text-stone-600 italic px-4">
                    "The spirits of the forest gather here at dusk. They speak of hidden treasures and ancient mysteries buried beneath the roots of the world."
                  </p>
               </div>

               <div className="grid grid-cols-1 gap-4 pt-4">
                  <button className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-black text-sm uppercase tracking-wider shadow-lg hover:brightness-110 transition-all border border-white/20">
                    Commune with Spirits
                  </button>
               </div>
            </div>
          ) : (
            <div className="text-center py-12 flex flex-col items-center">
              <div className="w-20 h-20 bg-black/5 rounded-full flex items-center justify-center mb-6 border-4 border-dashed border-[#8b4513]/20 opacity-40">
                <Layout size={32} className="text-[#8b4513]" />
              </div>
              <p className="title-font text-[#8b4513] opacity-60 mb-2 uppercase tracking-widest text-sm">Construction Pending</p>
              <p className="text-xs italic text-stone-500 max-w-[200px] leading-relaxed">
                The royal architects are working on the plans for this building...
              </p>
            </div>
          )}
        </Modal>

        {/* Treasury Full-Screen View */}
        {currentView === 'treasury' && (
          <TreasuryView 
            onBack={() => setCurrentView('map')}
            treasuryData={treasuryBuilding}
            profile={profile}
            onRefresh={() => fetchUserData(session.user.id)}
          />
        )}

      </div>
    </div>
  );
}

export default App;
