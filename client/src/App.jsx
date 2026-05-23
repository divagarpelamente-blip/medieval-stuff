import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import Auth from './components/Auth';
import HUD from './components/HUD';
import BottomNav from './components/BottomNav';
import IsometricMap from './components/IsometricMap';
import Modal from './components/Modal';
import TreasuryView from './components/TreasuryView';
import SettingsView from './components/SettingsView';
import DashboardView from './components/DashboardView';
import TransactionsView from './components/treasury/TransactionsView';
import { Toaster, toast } from 'react-hot-toast';
import { buildingRegistry } from './utils/buildingRegistry';
import bgMap from './assets/Medieval_Town_Backround.png';

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
  const [activeTab, setActiveTab] = useState('quests'); // Default to quests (which shows the map)
  const [selectedBuilding, setSelectedBuilding] = useState(null);

  useEffect(() => {
    const initSession = async () => {
      try {
        const { data: { session: activeSession } } = await supabase.auth.getSession();
        if (activeSession) {
          setSession(activeSession);
          await fetchUserData(activeSession.user.id);
        } else {
          const lastEmail = localStorage.getItem('medieval_last_logged_in_email');
          if (lastEmail && lastEmail !== GUEST_SESSION.user.email) {
            const DEFAULT_PASSWORD = 'medieval_kingdom_bypass';
            const { data, error } = await supabase.auth.signInWithPassword({ 
              email: lastEmail, 
              password: DEFAULT_PASSWORD 
            });
            if (!error && data?.session) {
              setSession(data.session);
              await fetchUserData(data.session.user.id);
            } else {
              setSession(GUEST_SESSION);
              await fetchUserData(GUEST_SESSION.user.id);
            }
          } else {
            setSession(GUEST_SESSION);
            await fetchUserData(GUEST_SESSION.user.id);
          }
        }
      } catch (err) {
        console.error('Init session error:', err);
        setSession(GUEST_SESSION);
        await fetchUserData(GUEST_SESSION.user.id);
      } finally {
        setLoading(false);
      }
    };

    initSession();

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

      // Sync settings from DB to localStorage
      if (profileData && profileData.settings) {
        const dbSettings = profileData.settings;
        if (dbSettings.responsible_users) {
          localStorage.setItem('medieval_responsible_users', JSON.stringify(dbSettings.responsible_users));
        }
        if (dbSettings.transaction_types) {
          localStorage.setItem('medieval_transaction_types', JSON.stringify(dbSettings.transaction_types));
        }
        if (dbSettings.flow_types) {
          localStorage.setItem('medieval_flow_types', JSON.stringify(dbSettings.flow_types));
        }
        if (dbSettings.quest_types) {
          localStorage.setItem('medieval_quest_types', JSON.stringify(dbSettings.quest_types));
        }
        if (dbSettings.entity_quest_types) {
          localStorage.setItem('medieval_entity_quest_types', JSON.stringify(dbSettings.entity_quest_types));
        }
      }

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
      toast.error('Failed to collect gold: ' + err.message);
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
      toast.error('Upgrade failed: ' + err.message);
    }
  };

  const handleBuildingClick = (buildingType) => {
    if (buildingType === 'treasury') {
      setActiveTab('treasury');
    } else {
      setSelectedBuilding(buildingType);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleSwitchUser = async (email) => {
    try {
      const DEFAULT_PASSWORD = 'medieval_kingdom_bypass';
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ 
        email, 
        password: DEFAULT_PASSWORD 
      });

      if (signInError) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ 
          email, 
          password: DEFAULT_PASSWORD 
        });
        
        if (signUpError) throw signUpError;
        
        if (signUpData?.session) {
          setSession(signUpData.session);
          fetchUserData(signUpData.session.user.id);
          toast.success(`Switched to new user: ${email}`);
        } else {
          toast.success(`User summoned successfully!`);
        }
      } else {
        setSession(data.session);
        fetchUserData(data.session.user.id);
        toast.success(`Switched to user: ${email}`);
      }
    } catch (err) {
      console.error('Error switching user:', err);
      toast.error('Failed to switch user: ' + err.message);
    }
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

  // Check if active tab is a placeholder view that shows an announcement banner over the map
  const showComingSoonOverlay = ['quests', 'achievements'].includes(activeTab);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center overflow-hidden">
      <Toaster 
        position="top-center" 
        toastOptions={{
          style: {
            background: '#f4e4bc',
            color: '#4b2c20',
            borderColor: '#8b4513',
            borderWidth: '2px'
          },
          success: {
            iconTheme: { primary: '#059669', secondary: '#f4e4bc' },
          },
          error: {
            iconTheme: { primary: '#dc2626', secondary: '#f4e4bc' },
          },
        }}
      />
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

        {/* Placeholder Info Overlay (Banner for non-active buttons) */}
        {showComingSoonOverlay && activeTab !== 'quests' && (
          <div className="absolute top-24 left-1/2 -translate-x-1/2 z-40 bg-stone-900/90 backdrop-blur-md border-2 border-[#d4af37]/40 px-6 py-3 rounded-2xl text-center shadow-xl animate-in fade-in slide-in-from-top-4 duration-300">
            <h4 className="title-font text-[#ffd700] text-sm uppercase tracking-widest font-black">
              {activeTab === 'achievements' ? 'Achievements Tab' : 'Transactions Ledger'}
            </h4>
            <p className="text-[10px] text-gray-400 italic mt-0.5">"The royal architects are building this wing, Sire." (Coming Soon)</p>
          </div>
        )}

        {/* Navegação Inferior */}
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Modais de Edifícios */}
        {selectedBuilding && buildingRegistry[selectedBuilding] && (
          <Modal 
            isOpen={!!selectedBuilding} 
            onClose={() => setSelectedBuilding(null)}
            title={buildingRegistry[selectedBuilding].title}
            size={buildingRegistry[selectedBuilding].modalSize}
            footer={buildingRegistry[selectedBuilding].footer}
          >
            {buildingRegistry[selectedBuilding].renderContent({
              userId: profile?.id,
              profile,
              building: buildings.find(b => b.type === selectedBuilding),
              onUpgrade: handleUpgradeBuilding,
              onCollect: handleCollectGold,
              onAction: (actionType, details) => {
                console.log(`Action initiated from building ${selectedBuilding}:`, actionType, details);
              }
            })}
          </Modal>
        )}

        {/* Settings Full-Screen View Overlay */}
        {activeTab === 'settings' && (
          <SettingsView 
            onBack={() => setActiveTab('quests')}
            userId={profile?.id}
            userEmail={session?.user?.email}
            onSwitchUser={handleSwitchUser}
          />
        )}

        {/* Dashboard Full-Screen View Overlay */}
        {activeTab === 'dashboard' && (
          <DashboardView 
            onBack={() => setActiveTab('quests')}
            userId={profile?.id}
            profile={profile}
            onRefresh={() => fetchUserData(session.user.id)}
          />
        )}

        {/* Treasury Full-Screen View Overlay */}
        {activeTab === 'treasury' && (
          <TreasuryView 
            onBack={() => setActiveTab('quests')}
            treasuryData={treasuryBuilding}
            profile={profile}
            onRefresh={() => fetchUserData(session.user.id)}
            initialLedgerMode="menu"
            initialShowLedger={false}
          />
        )}

        {/* Transactions Full-Screen View Overlay */}
        {activeTab === 'transactions' && (
          <TransactionsView 
            onBack={() => setActiveTab('quests')}
            userId={profile?.id}
            profile={profile}
            onRefresh={() => fetchUserData(session.user.id)}
          />
        )}

      </div>
    </div>
  );
}

export default App;
