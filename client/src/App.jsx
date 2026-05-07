import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import Auth from './components/Auth';
import TreasuryCard from './components/TreasuryCard';
import { Layout, Wallet, User as UserIcon, LogOut, ShieldAlert } from 'lucide-react';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [buildings, setBuildings] = useState([]);

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchUserData(session.user.id);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchUserData(session.user.id);
      else {
        setProfile(null);
        setBuildings([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Visual timer for gold ticking
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
      // Fetch Profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Fetch Buildings
      const { data: buildingsData, error: buildingsError } = await supabase
        .from('buildings')
        .select('*')
        .eq('profile_id', userId);

      if (buildingsError) throw buildingsError;
      
      // Calculate real stored gold based on time elapsed
      const now = new Date();
      const updatedBuildings = buildingsData.map(b => {
        const lastCol = new Date(b.last_collection);
        const secondsElapsed = (now - lastCol) / 1000;
        const incomePerSecond = (12 * b.level) / 60; // 12 gold/min base
        return {
          ...b,
          stored_resources: secondsElapsed * incomePerSecond
        };
      });

      setBuildings(updatedBuildings);
    } catch (err) {
      console.error('Error fetching data:', err.message);
    }
  };

  const handleCollectGold = async (buildingId, amount) => {
    if (!profile || amount <= 0) return;

    try {
      // 1. Update Profile Gold
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ gold: profile.gold + Math.floor(amount) })
        .eq('id', session.user.id);

      if (profileError) throw profileError;

      // 2. Reset Building Storage
      const { error: buildingError } = await supabase
        .from('buildings')
        .update({ stored_resources: 0, last_collection: new Date().toISOString() })
        .eq('id', buildingId);

      if (buildingError) throw buildingError;

      // Refresh data
      fetchUserData(session.user.id);
    } catch (err) {
      alert('Failed to collect gold: ' + err.message);
    }
  };

  const handleUpgradeBuilding = async (building) => {
    const cost = Math.floor(100 * Math.pow(building.level, 1.8));
    
    if (profile.gold < cost) return;

    try {
      // 1. Deduct Gold
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ gold: profile.gold - cost })
        .eq('id', session.user.id);

      if (profileError) throw profileError;

      // 2. Increase Level
      const { error: buildingError } = await supabase
        .from('buildings')
        .update({ 
          level: building.level + 1,
          last_collection: new Date().toISOString() // Reset timer on upgrade for balance
        })
        .eq('id', building.id);

      if (buildingError) throw buildingError;

      fetchUserData(session.user.id);
    } catch (err) {
      alert('Upgrade failed: ' + err.message);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-medieval-gold border-t-transparent rounded-full animate-spin" />
        <p className="font-medieval text-medieval-gold tracking-widest uppercase text-sm">Loading Realm...</p>
      </div>
    );
  }

  if (!session) {
    return <Auth onAuthSuccess={() => {}} />;
  }

  return (
    <div className="min-h-screen text-stone-100 flex flex-col">
      {/* Top Header */}
      <header className="h-16 glass-card border-x-0 border-t-0 flex items-center px-8 justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-medieval-gold rounded-full flex items-center justify-center border-2 border-medieval-goldLight shadow-lg">
            <span className="text-stone-950 font-bold text-xl">M</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight">Medieval Stuff</h1>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 bg-stone-950/50 px-4 py-2 rounded-full border border-stone-800 shadow-inner">
            <Wallet className="text-medieval-gold" size={18} />
            <span className="font-mono font-bold text-medieval-goldLight text-lg">
              {profile?.gold.toLocaleString() || '0'}
            </span>
          </div>
          
          <div className="flex items-center gap-2 border-l border-stone-800 pl-6">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-stone-500 uppercase">Lord</p>
              <p className="text-sm font-semibold truncate max-w-[120px]">{session.user.email.split('@')[0]}</p>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-all text-stone-400 group"
              title="Leave Kingdom"
            >
              <LogOut size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow p-8 max-w-7xl mx-auto w-full">
        <div className="mb-12 flex justify-between items-end">
          <div>
            <h2 className="text-4xl font-bold mb-2">Your Kingdom</h2>
            <p className="text-stone-400 text-lg">Prosperity awaits your command, My Lord.</p>
          </div>
          <div className="flex gap-4">
             <div className="bg-stone-900 px-4 py-2 rounded-lg border border-stone-800">
                <p className="text-[10px] text-stone-500 uppercase font-black tracking-tighter">Kingdom Rank</p>
                <p className="text-medieval-gold font-medieval font-bold">Level {profile?.level || 1}</p>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {buildings.length > 0 ? (
            buildings.map((building) => (
              building.type === 'treasury' && (
                <TreasuryCard 
                  key={building.id}
                  gold={Math.floor(building.stored_resources)} 
                  incomeRate={12 * building.level} 
                  level={building.level}
                  onCollect={() => handleCollectGold(building.id, building.stored_resources)} 
                  onUpgrade={() => handleUpgradeBuilding(building)}
                  upgradeCost={Math.floor(100 * Math.pow(building.level, 1.8))}
                  currentBalance={profile.gold}
                />
              )
            ))
          ) : (
            <div className="col-span-full py-20 flex flex-col items-center justify-center glass-card rounded-3xl opacity-50">
               <ShieldAlert size={48} className="text-stone-600 mb-4" />
               <p className="font-medieval text-xl">No Buildings Found</p>
               <p className="text-stone-500 text-sm">Have you executed the SQL setup in Supabase?</p>
            </div>
          )}
          
          {/* Locked Buildings Placeholders */}
          <div className="glass-card p-6 rounded-2xl border-dashed border-stone-700 flex flex-col items-center justify-center opacity-40 grayscale group cursor-not-allowed">
            <div className="w-16 h-16 bg-stone-800 rounded-full flex items-center justify-center mb-4 border border-stone-700">
              <Layout className="text-stone-600" />
            </div>
            <p className="text-stone-500 font-bold font-medieval">Barracks</p>
            <p className="text-stone-600 text-xs">Reach Level 5 to Unlock</p>
          </div>
        </div>
      </main>

      <footer className="p-12 text-center text-stone-700 text-xs uppercase tracking-widest border-t border-stone-900 mt-20">
        <p>Medieval Stuff &bull; Built with Gold and Honor &copy; 2026</p>
      </footer>
    </div>
  );
}

export default App;
