import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Lock, Mail, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

const Auth = ({ onAuthSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState(null);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isRegistering) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('Check your email for the confirmation link!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onAuthSuccess();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-950 bg-medieval-pattern p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card w-full max-w-md p-8 rounded-3xl border-2 border-medieval-gold/30 relative overflow-hidden"
      >
        {/* Background Emblem */}
        <div className="absolute -top-10 -right-10 opacity-5 rotate-12">
          <ShieldCheck size={200} className="text-medieval-gold" />
        </div>

        <div className="text-center mb-8 relative z-10">
          <div className="w-16 h-16 bg-medieval-gold rounded-full mx-auto flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(217,119,6,0.3)]">
            <Lock className="text-stone-950" size={32} />
          </div>
          <h2 className="text-3xl font-bold font-medieval">Kingdom Access</h2>
          <p className="text-stone-400 mt-2">Enter your credentials to manage your realm.</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-6 relative z-10">
          <div>
            <label className="block text-sm font-bold text-stone-300 mb-2 uppercase tracking-widest">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" size={18} />
              <input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 rounded-xl py-3 pl-10 pr-4 focus:border-medieval-gold focus:ring-1 focus:ring-medieval-gold outline-none transition-all"
                placeholder="king@realm.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-stone-300 mb-2 uppercase tracking-widest">Secret Key</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" size={18} />
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 rounded-xl py-3 pl-10 pr-4 focus:border-medieval-gold focus:ring-1 focus:ring-medieval-gold outline-none transition-all"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg text-center font-semibold">
              {error}
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 medieval-button text-lg uppercase tracking-widest"
          >
            {loading ? 'Processing...' : isRegistering ? 'Forge Account' : 'Enter Kingdom'}
          </button>
        </form>

        <div className="mt-8 text-center relative z-10">
          <button 
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-stone-500 hover:text-medieval-gold text-sm transition-colors"
          >
            {isRegistering ? 'Already a citizen? Sign in' : 'New to the realm? Create an account'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
