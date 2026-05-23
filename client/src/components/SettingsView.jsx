import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, Settings, LoaderCircle, Users, Coins, TrendingUp, Compass, Edit3, Check, X } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'react-hot-toast';
import parchmentBg from '../assets/Parchment_menu_1.PNG';
import Modal from './Modal';

const SettingsView = ({ onBack, userId, userEmail, onSwitchUser }) => {
  const [entities, setEntities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const saveSettingsToDb = async (updatedFields = {}) => {
    if (!userId) return;
    try {
      const responsible_users = JSON.parse(localStorage.getItem('medieval_responsible_users')) || [];
      const transaction_types = JSON.parse(localStorage.getItem('medieval_transaction_types')) || [];
      const flow_types = JSON.parse(localStorage.getItem('medieval_flow_types')) || [];
      const quest_types = JSON.parse(localStorage.getItem('medieval_quest_types')) || [];
      const entity_quest_types = JSON.parse(localStorage.getItem('medieval_entity_quest_types')) || {};

      const fullSettings = {
        responsible_users,
        transaction_types,
        flow_types,
        quest_types,
        entity_quest_types,
        ...updatedFields
      };

      const { error } = await supabase
        .from('profiles')
        .update({ settings: fullSettings })
        .eq('id', userId);

      if (error) {
        if (error.code === '42703' || String(error.message).includes('settings')) {
          toast.error(
            "Settings saved locally, but database sync failed. Please execute the 'add_settings_to_profiles.sql' script in your Supabase SQL editor to enable persistent cloud sync.",
            { id: 'migration-warning', duration: 8000 }
          );
        } else {
          throw error;
        }
      }
    } catch (err) {
      console.error('Error syncing settings to database:', err);
    }
  };

  // Modal states
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [showEntitiesModal, setShowEntitiesModal] = useState(false);
  const [showTransactionTypesModal, setShowTransactionTypesModal] = useState(false);
  const [showFlowTypesModal, setShowFlowTypesModal] = useState(false);
  const [showQuestTypesModal, setShowQuestTypesModal] = useState(false);

  const [deletingEntityId, setDeletingEntityId] = useState(null);
  
  // Modal Form States
  const [newEntityName, setNewEntityName] = useState('');
  const [newEntityDesc, setNewEntityDesc] = useState('');
  const [selectedQuestTypeForEntity, setSelectedQuestTypeForEntity] = useState('Production');
  
  const [users, setUsers] = useState([]);
  const [newUserEmail, setNewUserEmail] = useState('');

  const [transactionTypes, setTransactionTypes] = useState([]);
  const [newTransactionType, setNewTransactionType] = useState('');

  const [flowTypes, setFlowTypes] = useState([]);
  const [newFlowType, setNewFlowType] = useState('');

  const [questTypes, setQuestTypes] = useState([]);
  const [newQuestType, setNewQuestType] = useState('');

  const [entityQuestTypes, setEntityQuestTypes] = useState({});

  const [realmEmail, setRealmEmail] = useState('');
  const [switchingRealm, setSwitchingRealm] = useState(false);

  const handleRealmSwitchSubmit = async (e) => {
    e.preventDefault();
    if (!realmEmail.trim()) return;
    setSwitchingRealm(true);
    try {
      await onSwitchUser(realmEmail.trim());
      setRealmEmail('');
    } catch (err) {
      console.error(err);
    } finally {
      setSwitchingRealm(false);
    }
  };

  // Inline Editing States
  const [editingUserId, setEditingUserId] = useState(null);
  const [editUserName, setEditUserName] = useState('');

  const [editingEntityId, setEditingEntityId] = useState(null);
  const [editEntityName, setEditEntityName] = useState('');
  const [editEntityQuestType, setEditEntityQuestType] = useState('');

  const [editingTxTypeId, setEditingTxTypeId] = useState(null);
  const [editTxTypeName, setEditTxTypeName] = useState('');

  const [editingFlowTypeId, setEditingFlowTypeId] = useState(null);
  const [editFlowTypeName, setEditFlowTypeName] = useState('');

  const [editingQuestTypeId, setEditingQuestTypeId] = useState(null);
  const [editQuestTypeName, setEditQuestTypeName] = useState('');

  useEffect(() => {
    if (userId) {
      fetchEntities();
    } else {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onBack();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onBack]);

  // Load responsible users/persons
  useEffect(() => {
    const saved = localStorage.getItem('medieval_responsible_users');
    if (saved) {
      setUsers(JSON.parse(saved));
    } else {
      const defaults = ['King', 'Queen', 'Scribe', 'Merchant', 'Guard'];
      setUsers(defaults);
      localStorage.setItem('medieval_responsible_users', JSON.stringify(defaults));
    }
  }, []);

  // Load custom types and mappings
  useEffect(() => {
    try {
      const savedTx = localStorage.getItem('medieval_transaction_types');
      if (savedTx) {
        setTransactionTypes(JSON.parse(savedTx));
      } else {
        const defaults = ['Earning', 'Income', 'Expense', 'Payment'];
        setTransactionTypes(defaults);
        localStorage.setItem('medieval_transaction_types', JSON.stringify(defaults));
      }

      const savedFlow = localStorage.getItem('medieval_flow_types');
      if (savedFlow) {
        setFlowTypes(JSON.parse(savedFlow));
      } else {
        const defaults = ['Inflow', 'Outflow', 'Investment', 'Savings'];
        setFlowTypes(defaults);
        localStorage.setItem('medieval_flow_types', JSON.stringify(defaults));
      }

      const savedQuest = localStorage.getItem('medieval_quest_types');
      let loadedQuests = [];
      if (savedQuest) {
        loadedQuests = JSON.parse(savedQuest);
      } else {
        loadedQuests = ['Monsters & Bounties', 'Tributes', 'Production'];
      }
      loadedQuests = loadedQuests.map(q => {
        if (q === 'Expedition') return 'Monsters & Bounties';
        if (q === 'Bounty') return 'Tributes';
        return q;
      });
      setQuestTypes(loadedQuests);
      localStorage.setItem('medieval_quest_types', JSON.stringify(loadedQuests));

      const savedMappings = localStorage.getItem('medieval_entity_quest_types');
      let loadedMappings = {};
      if (savedMappings) {
        loadedMappings = JSON.parse(savedMappings);
      } else {
        loadedMappings = {
          'Salary': 'Production',
          'Renda': 'Production',
          'CGD': 'Tributes',
          'Universo': 'Monsters & Bounties'
        };
      }
      Object.keys(loadedMappings).forEach(k => {
        if (loadedMappings[k] === 'Expedition') loadedMappings[k] = 'Monsters & Bounties';
        if (loadedMappings[k] === 'Bounty') loadedMappings[k] = 'Tributes';
      });
      setEntityQuestTypes(loadedMappings);
      localStorage.setItem('medieval_entity_quest_types', JSON.stringify(loadedMappings));
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchEntities = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('treasury_entities')
        .select('*')
        .eq('profile_id', userId)
        .order('name', { ascending: true });

      if (error) throw error;
      setEntities(data || []);
    } catch (err) {
      console.error('Error fetching entities:', err);
      toast.error('Failed to load entities: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEntity = async (e) => {
    e.preventDefault();
    if (!newEntityName.trim()) return;
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('treasury_entities')
        .insert([{ 
          profile_id: userId, 
          name: newEntityName.trim(),
          description: newEntityDesc.trim() || null
        }])
        .select();

      if (error) {
        if (error.code === '23505') {
          throw new Error('Entity with this name already exists!');
        }
        throw error;
      }

      // Save mapping
      const updatedMappings = {
        ...entityQuestTypes,
        [newEntityName.trim()]: selectedQuestTypeForEntity
      };
      setEntityQuestTypes(updatedMappings);
      localStorage.setItem('medieval_entity_quest_types', JSON.stringify(updatedMappings));
      saveSettingsToDb({ entity_quest_types: updatedMappings });

      toast.success(`Entity "${newEntityName.trim()}" added successfully!`);
      setNewEntityName('');
      setNewEntityDesc('');
      fetchEntities();
    } catch (err) {
      console.error('Error adding entity:', err);
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const executeDeleteEntity = async (id, name) => {
    try {
      const { error } = await supabase
        .from('treasury_entities')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Remove Quest Type mapping
      const updatedMappings = { ...entityQuestTypes };
      delete updatedMappings[name];
      setEntityQuestTypes(updatedMappings);
      localStorage.setItem('medieval_entity_quest_types', JSON.stringify(updatedMappings));
      saveSettingsToDb({ entity_quest_types: updatedMappings });

      toast.success(`Entity "${name}" removed.`);
      fetchEntities();
    } catch (err) {
      console.error('Error deleting entity:', err);
      toast.error('Failed to delete entity: ' + err.message);
    } finally {
      setDeletingEntityId(null);
    }
  };

  const handleAddUser = (e) => {
    e.preventDefault();
    const name = newUserEmail.trim();
    if (!name) return;

    if (users.includes(name)) {
      toast.error('Person already exists in registry!');
      return;
    }

    const updated = [...users, name];
    setUsers(updated);
    localStorage.setItem('medieval_responsible_users', JSON.stringify(updated));
    saveSettingsToDb({ responsible_users: updated });
    setNewUserEmail('');
    toast.success(`Person "${name}" added to registry.`);
  };

  const handleDeleteUser = (nameToDelete) => {
    const updated = users.filter(n => n !== nameToDelete);
    setUsers(updated);
    localStorage.setItem('medieval_responsible_users', JSON.stringify(updated));
    saveSettingsToDb({ responsible_users: updated });
    toast.success(`Person "${nameToDelete}" removed.`);
  };

  const handleEditUser = (oldName) => {
    const newName = editUserName.trim();
    if (!newName || newName === oldName) {
      setEditingUserId(null);
      return;
    }

    if (users.includes(newName)) {
      toast.error('Person already exists in registry!');
      return;
    }

    const updated = users.map(u => u === oldName ? newName : u);
    setUsers(updated);
    localStorage.setItem('medieval_responsible_users', JSON.stringify(updated));
    saveSettingsToDb({ responsible_users: updated });
    setEditingUserId(null);
    toast.success('Responsible person updated!');
  };

  const handleEditEntity = async (id, oldName) => {
    const newName = editEntityName.trim();
    if (!newName) return;

    try {
      const { error } = await supabase
        .from('treasury_entities')
        .update({ name: newName })
        .eq('id', id);

      if (error) throw error;

      // Update Quest Type mapping
      const updatedMappings = { ...entityQuestTypes };
      if (oldName !== newName) {
        delete updatedMappings[oldName];
      }
      updatedMappings[newName] = editEntityQuestType;
      setEntityQuestTypes(updatedMappings);
      localStorage.setItem('medieval_entity_quest_types', JSON.stringify(updatedMappings));
      saveSettingsToDb({ entity_quest_types: updatedMappings });

      toast.success('Entity updated!');
      setEditingEntityId(null);
      fetchEntities();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update entity: ' + err.message);
    }
  };

  const handleAddTransactionType = (e) => {
    e.preventDefault();
    const type = newTransactionType.trim();
    if (!type) return;

    if (transactionTypes.includes(type)) {
      toast.error('Transaction Type already exists!');
      return;
    }

    const updated = [...transactionTypes, type];
    setTransactionTypes(updated);
    localStorage.setItem('medieval_transaction_types', JSON.stringify(updated));
    saveSettingsToDb({ transaction_types: updated });
    setNewTransactionType('');
    toast.success(`Transaction Type "${type}" added!`);
  };

  const handleDeleteTransactionType = (typeToDelete) => {
    const updated = transactionTypes.filter(t => t !== typeToDelete);
    setTransactionTypes(updated);
    localStorage.setItem('medieval_transaction_types', JSON.stringify(updated));
    saveSettingsToDb({ transaction_types: updated });
    toast.success(`Transaction Type "${typeToDelete}" removed.`);
  };

  const handleEditTransactionType = (oldName) => {
    const newName = editTxTypeName.trim();
    if (!newName || newName === oldName) {
      setEditingTxTypeId(null);
      return;
    }

    if (transactionTypes.includes(newName)) {
      toast.error('Type already exists!');
      return;
    }

    const updated = transactionTypes.map(t => t === oldName ? newName : t);
    setTransactionTypes(updated);
    localStorage.setItem('medieval_transaction_types', JSON.stringify(updated));
    saveSettingsToDb({ transaction_types: updated });
    setEditingTxTypeId(null);
    toast.success('Transaction Type updated!');
  };

  const handleAddFlowType = (e) => {
    e.preventDefault();
    const type = newFlowType.trim();
    if (!type) return;

    if (flowTypes.includes(type)) {
      toast.error('Flow Type already exists!');
      return;
    }

    const updated = [...flowTypes, type];
    setFlowTypes(updated);
    localStorage.setItem('medieval_flow_types', JSON.stringify(updated));
    saveSettingsToDb({ flow_types: updated });
    setNewFlowType('');
    toast.success(`Flow Type "${type}" added!`);
  };

  const handleDeleteFlowType = (typeToDelete) => {
    const updated = flowTypes.filter(t => t !== typeToDelete);
    setFlowTypes(updated);
    localStorage.setItem('medieval_flow_types', JSON.stringify(updated));
    saveSettingsToDb({ flow_types: updated });
    toast.success(`Flow Type "${typeToDelete}" removed.`);
  };

  const handleEditFlowType = (oldName) => {
    const newName = editFlowTypeName.trim();
    if (!newName || newName === oldName) {
      setEditingFlowTypeId(null);
      return;
    }

    if (flowTypes.includes(newName)) {
      toast.error('Type already exists!');
      return;
    }

    const updated = flowTypes.map(t => t === oldName ? newName : t);
    setFlowTypes(updated);
    localStorage.setItem('medieval_flow_types', JSON.stringify(updated));
    saveSettingsToDb({ flow_types: updated });
    setEditingFlowTypeId(null);
    toast.success('Flow Type updated!');
  };

  const handleAddQuestType = (e) => {
    e.preventDefault();
    const type = newQuestType.trim();
    if (!type) return;

    if (questTypes.includes(type)) {
      toast.error('Quest Type already exists!');
      return;
    }

    const updated = [...questTypes, type];
    setQuestTypes(updated);
    localStorage.setItem('medieval_quest_types', JSON.stringify(updated));
    saveSettingsToDb({ quest_types: updated });
    setNewQuestType('');
    toast.success(`Quest Type "${type}" added!`);
  };

  const handleDeleteQuestType = (typeToDelete) => {
    const updated = questTypes.filter(t => t !== typeToDelete);
    setQuestTypes(updated);
    localStorage.setItem('medieval_quest_types', JSON.stringify(updated));
    saveSettingsToDb({ quest_types: updated });
    toast.success(`Quest Type "${typeToDelete}" removed.`);
  };

  const handleEditQuestType = (oldName) => {
    const newName = editQuestTypeName.trim();
    if (!newName || newName === oldName) {
      setEditingQuestTypeId(null);
      return;
    }

    if (questTypes.includes(newName)) {
      toast.error('Type already exists!');
      return;
    }

    const updated = questTypes.map(t => t === oldName ? newName : t);
    setQuestTypes(updated);
    localStorage.setItem('medieval_quest_types', JSON.stringify(updated));
    saveSettingsToDb({ quest_types: updated });
    setEditingQuestTypeId(null);
    toast.success('Quest Type updated!');
  };

  const buttonStyle = "w-full max-w-sm px-8 py-4 bg-[#4b2c20] text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2.5 hover:bg-[#3d2419]";

  return (
    <div className="absolute inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
      {/* Parchment Background */}
      <div className="relative w-full max-w-2xl h-[85%] overflow-hidden rounded-xl shadow-2xl flex flex-col items-center">
        <img src={parchmentBg} className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none" alt="Parchment" />
        <div className="absolute inset-0 bg-[#3e2723]/10 pointer-events-none" />

        {/* Content Container */}
        <div className="relative z-10 w-full h-full p-8 pt-12 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex justify-between items-center mb-6 border-b border-[#4b2c20]/10 pb-4">
            <button 
              onClick={onBack}
              className="flex items-center gap-2 title-font text-[#2d1e1e] font-black uppercase text-xs tracking-widest hover:scale-105 active:scale-95 transition-transform"
            >
              <ArrowLeft size={14} />
              Back to Map
            </button>
            <h2 className="title-font text-2xl font-black uppercase tracking-widest text-[#4b2c20] flex items-center gap-2">
              <Settings size={22} />
              Kingdom Settings
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6 text-[#2d1e1e]">
            {/* 5 Settings Buttons Stack */}
            <div className="flex flex-col items-center gap-4 py-4">
              <button onClick={() => setShowUsersModal(true)} className={buttonStyle}>
                <Users size={16} /> Manage Users
              </button>
              
              <button onClick={() => setShowEntitiesModal(true)} className={buttonStyle}>
                <Settings size={16} /> Manage Entities
              </button>
              
              <button onClick={() => setShowTransactionTypesModal(true)} className={buttonStyle}>
                <Coins size={16} /> Manage Transaction Type
              </button>
              
              <button onClick={() => setShowFlowTypesModal(true)} className={buttonStyle}>
                <TrendingUp size={16} /> Manage Flow Type
              </button>
              
              <button onClick={() => setShowQuestTypesModal(true)} className={buttonStyle}>
                <Compass size={16} /> Manage Quest Type
              </button>
            </div>

            {/* Realm Switcher / Cloud Sync Status */}
            <div className="border-t border-[#4b2c20]/15 pt-6 space-y-4">
              <h3 className="title-font text-sm font-black uppercase tracking-wider text-[#4b2c20]">Realm Switcher</h3>
              <div className="bg-white/20 border border-[#4b2c20]/10 rounded-2xl p-5 space-y-4 shadow-inner">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-[#4b2c20]/75 uppercase tracking-wider">Active Realm (Email):</span>
                  <span className="font-black text-[#4b2c20] bg-white/40 px-3 py-1 rounded-xl border border-[#4b2c20]/10 shadow-sm">{userEmail || 'guest@medieval.stuff'}</span>
                </div>
                
                <form onSubmit={handleRealmSwitchSubmit} className="flex gap-2">
                  <input
                    type="email"
                    placeholder="Enter email to switch realms..."
                    value={realmEmail}
                    onChange={(e) => setRealmEmail(e.target.value)}
                    required
                    className="flex-1 bg-white/40 border-2 border-[#4b2c20]/25 rounded-xl px-4 py-2.5 text-[#4b2c20] font-bold focus:border-[#4b2c20]/50 outline-none transition-all text-xs placeholder:text-[#4b2c20]/30"
                  />
                  <button
                    type="submit"
                    disabled={switchingRealm || !realmEmail.trim()}
                    className="px-5 py-2.5 bg-[#4b2c20] text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all shadow-md disabled:opacity-50"
                  >
                    {switchingRealm ? 'Summoning...' : 'Switch'}
                  </button>
                </form>
              </div>
            </div>

            {/* Additional Settings Placeholder */}
            <div className="border-t border-[#4b2c20]/10 pt-6 space-y-4 opacity-50">
              <h3 className="title-font text-sm font-black uppercase tracking-wider">Additional Controls</h3>
              <div className="bg-white/10 border border-[#4b2c20]/10 rounded-xl p-4 text-xs italic">
                Scribe's Log: Game adjustments, audio level toggles, and data export presets will be calibrated in subsequent iterations.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 1. Manage Users (Responsible Persons) Modal */}
      <Modal
        isOpen={showUsersModal}
        onClose={() => setShowUsersModal(false)}
        title="Manage Responsible Persons"
        size="max-w-4xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-[#2d1e1e]">
          <div className="space-y-4 border-b md:border-b-0 md:border-r border-[#4b2c20]/10 pb-6 md:pb-0 md:pr-8 flex flex-col justify-between">
            <div>
              <h4 className="title-font text-sm font-black uppercase tracking-wider text-[#4b2c20] border-b border-[#4b2c20]/10 pb-1 mb-4">Summon Person</h4>
              
              <form onSubmit={handleAddUser} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[#4b2c20] mb-1.5 ml-1">Person Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Scribe Jack, King..."
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    required
                    className="w-full bg-white/40 border-2 border-[#4b2c20]/20 rounded-xl px-4 py-2.5 text-[#4b2c20] font-bold focus:border-[#4b2c20]/45 outline-none transition-all text-sm placeholder:text-[#4b2c20]/30"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!newUserEmail.trim()}
                  className="w-full py-3 bg-[#4b2c20] text-white font-black text-xs uppercase tracking-widest rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Plus size={16} /> Summon Person
                </button>
              </form>
            </div>
          </div>

          <div className="flex flex-col max-h-[50vh] overflow-hidden">
            <h4 className="title-font text-sm font-black uppercase tracking-wider text-[#4b2c20] border-b border-[#4b2c20]/10 pb-1 mb-3">Current Persons</h4>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar-subtle pr-1 space-y-2">
              {users.map((name) => {
                const isEditing = editingUserId === name;
                return (
                  <div 
                    key={name}
                    className="bg-white/30 border border-[#4b2c20]/15 rounded-xl p-3 flex justify-between items-center hover:bg-white/50 transition-colors"
                  >
                    <div className="min-w-0 flex-1 mr-2">
                      {isEditing ? (
                        <div className="flex items-center gap-1.5 w-full">
                          <input
                            type="text"
                            value={editUserName}
                            onChange={(e) => setEditUserName(e.target.value)}
                            className="bg-white border border-[#4b2c20]/30 rounded px-2 py-1 text-xs text-[#4b2c20] font-bold w-full"
                          />
                          <button onClick={() => handleEditUser(name)} className="text-emerald-700 hover:bg-emerald-100 p-1.5 rounded"><Check size={14} /></button>
                          <button onClick={() => setEditingUserId(null)} className="text-stone-500 hover:bg-stone-100 p-1.5 rounded"><X size={14} /></button>
                        </div>
                      ) : (
                        <span className="font-bold text-sm text-[#4b2c20]">{name}</span>
                      )}
                    </div>
                    {!isEditing && (
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => {
                            setEditingUserId(name);
                            setEditUserName(name);
                          }}
                          className="text-stone-700 hover:text-stone-500 p-2 hover:bg-stone-500/10 rounded-lg transition-colors"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(name)}
                          className="text-red-800 hover:text-red-650 p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Modal>

      {/* 2. Manage Entities Modal */}
      <Modal
        isOpen={showEntitiesModal}
        onClose={() => setShowEntitiesModal(false)}
        title="Manage Entities"
        size="max-w-4xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-[#2d1e1e]">
          {/* LEFT COLUMN: Add Entity Form */}
          <div className="space-y-4 border-b md:border-b-0 md:border-r border-[#4b2c20]/10 pb-6 md:pb-0 md:pr-8 flex flex-col justify-between">
            <div>
              <h4 className="title-font text-sm font-black uppercase tracking-wider text-[#4b2c20] border-b border-[#4b2c20]/10 pb-1 mb-4">Summon Entity</h4>
              
              <form onSubmit={handleAddEntity} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[#4b2c20] mb-1.5 ml-1">Entity Name</label>
                  <input
                    type="text"
                    placeholder="e.g. CGD, Salary, Rent..."
                    value={newEntityName}
                    onChange={(e) => setNewEntityName(e.target.value)}
                    disabled={saving}
                    required
                    className="w-full bg-white/40 border-2 border-[#4b2c20]/20 rounded-xl px-4 py-2.5 text-[#4b2c20] font-bold focus:border-[#4b2c20]/45 outline-none transition-all text-sm placeholder:text-[#4b2c20]/30"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[#4b2c20] mb-1.5 ml-1">Quest Type Mapping</label>
                  <select
                    value={selectedQuestTypeForEntity}
                    onChange={(e) => setSelectedQuestTypeForEntity(e.target.value)}
                    className="w-full bg-white/50 border-2 border-[#4b2c20]/30 rounded-xl px-4 py-2.5 text-[#4b2c20] font-black text-sm focus:border-[#4b2c20]/60 outline-none transition-all"
                  >
                    {questTypes.map(q => (
                      <option key={q} value={q}>{q}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[#4b2c20] mb-1.5 ml-1">Description (Optional)</label>
                  <textarea
                    placeholder="Enter a brief purpose or note for this entity..."
                    value={newEntityDesc}
                    onChange={(e) => setNewEntityDesc(e.target.value)}
                    disabled={saving}
                    className="w-full bg-white/40 border-2 border-[#4b2c20]/20 rounded-xl px-4 py-2.5 text-[#4b2c20] font-bold focus:border-[#4b2c20]/45 outline-none transition-all text-sm h-20 resize-none placeholder:text-[#4b2c20]/30"
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving || !newEntityName.trim()}
                  className="w-full py-3 bg-[#4b2c20] text-white font-black text-xs uppercase tracking-widest rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : (
                    <>
                      <Plus size={16} /> Save Entity
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* RIGHT COLUMN: Existing Entities List */}
          <div className="flex flex-col max-h-[50vh] overflow-hidden">
            <h4 className="title-font text-sm font-black uppercase tracking-wider text-[#4b2c20] border-b border-[#4b2c20]/10 pb-1 mb-3">Current Entities</h4>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar-subtle pr-1 space-y-2">
              {loading ? (
                <div className="flex items-center justify-center py-10 gap-2">
                  <LoaderCircle className="animate-spin text-[#4b2c20]" size={20} />
                  <span className="text-xs font-bold italic">Gathering ledger entities...</span>
                </div>
              ) : entities.length === 0 ? (
                <p className="text-xs italic text-center py-6 text-stone-500">No entities found.</p>
              ) : (
                entities.map((ent) => {
                  const isEditing = editingEntityId === ent.id;
                  return (
                    <div 
                      key={ent.id}
                      className="bg-white/30 border border-[#4b2c20]/15 rounded-xl p-3 flex justify-between items-center hover:bg-white/50 transition-colors"
                    >
                      <div className="min-w-0 flex-1 mr-2">
                        {isEditing ? (
                          <div className="space-y-2 w-full">
                            <input
                              type="text"
                              value={editEntityName}
                              onChange={(e) => setEditEntityName(e.target.value)}
                              className="bg-white border border-[#4b2c20]/30 rounded px-2 py-1 text-xs text-[#4b2c20] font-bold w-full"
                            />
                            <select
                              value={editEntityQuestType}
                              onChange={(e) => setEditEntityQuestType(e.target.value)}
                              className="bg-white border border-[#4b2c20]/30 rounded px-2 py-1 text-xs text-[#4b2c20] font-bold w-full"
                            >
                              {questTypes.map(q => <option key={q} value={q}>{q}</option>)}
                            </select>
                            <div className="flex gap-1.5">
                              <button onClick={() => handleEditEntity(ent.id, ent.name)} className="text-emerald-700 hover:bg-emerald-100 p-1 rounded flex items-center gap-1 text-[10px] font-bold uppercase"><Check size={12} /> Save</button>
                              <button onClick={() => setEditingEntityId(null)} className="text-stone-500 hover:bg-stone-100 p-1 rounded flex items-center gap-1 text-[10px] font-bold uppercase"><X size={12} /> Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="font-bold text-sm truncate text-[#4b2c20] flex items-center gap-1.5 flex-wrap">
                              {ent.name}
                              <span className="px-1.5 py-0.5 bg-[#4b2c20]/10 text-[#4b2c20] border border-[#4b2c20]/25 rounded text-[8px] font-black uppercase tracking-wider">
                                {entityQuestTypes[ent.name] || 'Production'}
                              </span>
                            </p>
                            {ent.description && <p className="text-[10px] text-stone-500 italic mt-0.5 truncate">{ent.description}</p>}
                            <p className="text-[8px] font-black uppercase tracking-wider text-[#4b2c20]/50 mt-1">
                              Created: {new Date(ent.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                          </>
                        )}
                      </div>
                      {!isEditing && (
                        deletingEntityId === ent.id ? (
                          <div className="flex gap-1.5 flex-shrink-0 ml-2">
                            <button 
                              onClick={() => executeDeleteEntity(ent.id, ent.name)}
                              className="text-[9px] px-2 py-1 bg-red-800 text-white rounded-lg font-black uppercase tracking-wider hover:bg-red-700 active:scale-95 transition-all"
                            >
                              Confirm
                            </button>
                            <button 
                              onClick={() => setDeletingEntityId(null)}
                              className="text-[9px] px-2 py-1 bg-stone-300 text-stone-700 rounded-lg font-black uppercase tracking-wider hover:bg-stone-200 active:scale-95 transition-all"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <button
                              onClick={() => {
                                setEditingEntityId(ent.id);
                                setEditEntityName(ent.name);
                                setEditEntityQuestType(entityQuestTypes[ent.name] || 'Production');
                              }}
                              className="text-stone-700 hover:text-stone-500 p-2 hover:bg-stone-500/10 rounded-lg transition-colors"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              onClick={() => setDeletingEntityId(ent.id)}
                              className="text-red-800 hover:text-red-650 p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* 3. Manage Transaction Type Modal */}
      <Modal
        isOpen={showTransactionTypesModal}
        onClose={() => setShowTransactionTypesModal(false)}
        title="Manage Transaction Types"
        size="max-w-4xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-[#2d1e1e]">
          <div className="space-y-4 border-b md:border-b-0 md:border-r border-[#4b2c20]/10 pb-6 md:pb-0 md:pr-8 flex flex-col justify-between">
            <div>
              <h4 className="title-font text-sm font-black uppercase tracking-wider text-[#4b2c20] border-b border-[#4b2c20]/10 pb-1 mb-4">Summon Transaction Type</h4>
              
              <form onSubmit={handleAddTransactionType} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[#4b2c20] mb-1.5 ml-1">Type Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Dividend, Refund..."
                    value={newTransactionType}
                    onChange={(e) => setNewTransactionType(e.target.value)}
                    required
                    className="w-full bg-white/40 border-2 border-[#4b2c20]/20 rounded-xl px-4 py-2.5 text-[#4b2c20] font-bold focus:border-[#4b2c20]/45 outline-none transition-all text-sm placeholder:text-[#4b2c20]/30"
                  />
                </div>

                <div className="p-3 bg-[#4b2c20]/5 border border-[#4b2c20]/15 rounded-xl text-[10px] text-stone-600 leading-relaxed italic">
                  Note: Database constraints strictly restrict ledger records to default types ('Earning', 'Income', 'Expense', 'Payment'). Custom types are for local categorization.
                </div>

                <button
                  type="submit"
                  disabled={!newTransactionType.trim()}
                  className="w-full py-3 bg-[#4b2c20] text-white font-black text-xs uppercase tracking-widest rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Plus size={16} /> Save Transaction Type
                </button>
              </form>
            </div>
          </div>

          <div className="flex flex-col max-h-[50vh] overflow-hidden">
            <h4 className="title-font text-sm font-black uppercase tracking-wider text-[#4b2c20] border-b border-[#4b2c20]/10 pb-1 mb-3">Current Transaction Types</h4>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar-subtle pr-1 space-y-2">
              {transactionTypes.map((type) => {
                const isEditing = editingTxTypeId === type;
                return (
                  <div 
                    key={type}
                    className="bg-white/30 border border-[#4b2c20]/15 rounded-xl p-3 flex justify-between items-center hover:bg-white/50 transition-colors"
                  >
                    <div className="min-w-0 flex-1 mr-2">
                      {isEditing ? (
                        <div className="flex items-center gap-1.5 w-full">
                          <input
                            type="text"
                            value={editTxTypeName}
                            onChange={(e) => setEditTxTypeName(e.target.value)}
                            className="bg-white border border-[#4b2c20]/30 rounded px-2 py-1 text-xs text-[#4b2c20] font-bold w-full"
                          />
                          <button onClick={() => handleEditTransactionType(type)} className="text-emerald-700 hover:bg-emerald-100 p-1.5 rounded"><Check size={14} /></button>
                          <button onClick={() => setEditingTxTypeId(null)} className="text-stone-500 hover:bg-stone-100 p-1.5 rounded"><X size={14} /></button>
                        </div>
                      ) : (
                        <span className="font-bold text-sm text-[#4b2c20]">{type}</span>
                      )}
                    </div>
                    {!isEditing && (
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => {
                            setEditingTxTypeId(type);
                            setEditTxTypeName(type);
                          }}
                          className="text-stone-700 hover:text-stone-500 p-2 hover:bg-stone-500/10 rounded-lg transition-colors"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteTransactionType(type)}
                          className="text-red-800 hover:text-red-650 p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Modal>

      {/* 4. Manage Flow Type Modal */}
      <Modal
        isOpen={showFlowTypesModal}
        onClose={() => setShowFlowTypesModal(false)}
        title="Manage Flow Types"
        size="max-w-4xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-[#2d1e1e]">
          <div className="space-y-4 border-b md:border-b-0 md:border-r border-[#4b2c20]/10 pb-6 md:pb-0 md:pr-8 flex flex-col justify-between">
            <div>
              <h4 className="title-font text-sm font-black uppercase tracking-wider text-[#4b2c20] border-b border-[#4b2c20]/10 pb-1 mb-4">Summon Flow Type</h4>
              
              <form onSubmit={handleAddFlowType} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[#4b2c20] mb-1.5 ml-1">Flow Type Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Asset Flow, Debt Flow..."
                    value={newFlowType}
                    onChange={(e) => setNewFlowType(e.target.value)}
                    required
                    className="w-full bg-white/40 border-2 border-[#4b2c20]/20 rounded-xl px-4 py-2.5 text-[#4b2c20] font-bold focus:border-[#4b2c20]/45 outline-none transition-all text-sm placeholder:text-[#4b2c20]/30"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!newFlowType.trim()}
                  className="w-full py-3 bg-[#4b2c20] text-white font-black text-xs uppercase tracking-widest rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Plus size={16} /> Save Flow Type
                </button>
              </form>
            </div>
          </div>

          <div className="flex flex-col max-h-[50vh] overflow-hidden">
            <h4 className="title-font text-sm font-black uppercase tracking-wider text-[#4b2c20] border-b border-[#4b2c20]/10 pb-1 mb-3">Current Flow Types</h4>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar-subtle pr-1 space-y-2">
              {flowTypes.map((type) => {
                const isEditing = editingFlowTypeId === type;
                return (
                  <div 
                    key={type}
                    className="bg-white/30 border border-[#4b2c20]/15 rounded-xl p-3 flex justify-between items-center hover:bg-white/50 transition-colors"
                  >
                    <div className="min-w-0 flex-1 mr-2">
                      {isEditing ? (
                        <div className="flex items-center gap-1.5 w-full">
                          <input
                            type="text"
                            value={editFlowTypeName}
                            onChange={(e) => setEditFlowTypeName(e.target.value)}
                            className="bg-white border border-[#4b2c20]/30 rounded px-2 py-1 text-xs text-[#4b2c20] font-bold w-full"
                          />
                          <button onClick={() => handleEditFlowType(type)} className="text-emerald-700 hover:bg-emerald-100 p-1.5 rounded"><Check size={14} /></button>
                          <button onClick={() => setEditingFlowTypeId(null)} className="text-stone-500 hover:bg-stone-100 p-1.5 rounded"><X size={14} /></button>
                        </div>
                      ) : (
                        <span className="font-bold text-sm text-[#4b2c20]">{type}</span>
                      )}
                    </div>
                    {!isEditing && (
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => {
                            setEditingFlowTypeId(type);
                            setEditFlowTypeName(type);
                          }}
                          className="text-stone-700 hover:text-stone-500 p-2 hover:bg-stone-500/10 rounded-lg transition-colors"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteFlowType(type)}
                          className="text-red-800 hover:text-red-650 p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Modal>

      {/* 5. Manage Quest Type Modal */}
      <Modal
        isOpen={showQuestTypesModal}
        onClose={() => setShowQuestTypesModal(false)}
        title="Manage Quest Types"
        size="max-w-4xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-[#2d1e1e]">
          <div className="space-y-4 border-b md:border-b-0 md:border-r border-[#4b2c20]/10 pb-6 md:pb-0 md:pr-8 flex flex-col justify-between">
            <div>
              <h4 className="title-font text-sm font-black uppercase tracking-wider text-[#4b2c20] border-b border-[#4b2c20]/10 pb-1 mb-4">Summon Quest Type</h4>
              
              <form onSubmit={handleAddQuestType} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[#4b2c20] mb-1.5 ml-1">Quest Type Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Dungeon Raid, Farming..."
                    value={newQuestType}
                    onChange={(e) => setNewQuestType(e.target.value)}
                    required
                    className="w-full bg-white/40 border-2 border-[#4b2c20]/20 rounded-xl px-4 py-2.5 text-[#4b2c20] font-bold focus:border-[#4b2c20]/45 outline-none transition-all text-sm placeholder:text-[#4b2c20]/30"
                  />
                </div>

                <div className="p-3 bg-[#4b2c20]/5 border border-[#4b2c20]/15 rounded-xl text-[10px] text-stone-600 leading-relaxed italic">
                  Note: Database constraints strictly restrict records to default quest types ('Monsters & Bounties', 'Tributes', 'Production'). Custom types are mapped to database equivalents.
                </div>

                <button
                  type="submit"
                  disabled={!newQuestType.trim()}
                  className="w-full py-3 bg-[#4b2c20] text-white font-black text-xs uppercase tracking-widest rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Plus size={16} /> Save Quest Type
                </button>
              </form>
            </div>
          </div>

          <div className="flex flex-col max-h-[50vh] overflow-hidden">
            <h4 className="title-font text-sm font-black uppercase tracking-wider text-[#4b2c20] border-b border-[#4b2c20]/10 pb-1 mb-3">Current Quest Types</h4>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar-subtle pr-1 space-y-2">
              {questTypes.map((type) => {
                const isEditing = editingQuestTypeId === type;
                return (
                  <div 
                    key={type}
                    className="bg-white/30 border border-[#4b2c20]/15 rounded-xl p-3 flex justify-between items-center hover:bg-white/50 transition-colors"
                  >
                    <div className="min-w-0 flex-1 mr-2">
                      {isEditing ? (
                        <div className="flex items-center gap-1.5 w-full">
                          <input
                            type="text"
                            value={editQuestTypeName}
                            onChange={(e) => setEditQuestTypeName(e.target.value)}
                            className="bg-white border border-[#4b2c20]/30 rounded px-2 py-1 text-xs text-[#4b2c20] font-bold w-full"
                          />
                          <button onClick={() => handleEditQuestType(type)} className="text-emerald-700 hover:bg-emerald-100 p-1.5 rounded"><Check size={14} /></button>
                          <button onClick={() => setEditingQuestTypeId(null)} className="text-stone-500 hover:bg-stone-100 p-1.5 rounded"><X size={14} /></button>
                        </div>
                      ) : (
                        <span className="font-bold text-sm text-[#4b2c20]">{type}</span>
                      )}
                    </div>
                    {!isEditing && (
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => {
                            setEditingQuestTypeId(type);
                            setEditQuestTypeName(type);
                          }}
                          className="text-stone-700 hover:text-stone-500 p-2 hover:bg-stone-500/10 rounded-lg transition-colors"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteQuestType(type)}
                          className="text-red-800 hover:text-red-650 p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SettingsView;
