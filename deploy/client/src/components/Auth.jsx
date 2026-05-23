import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Lock, Mail, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import bgMap from '../assets/bg_map.png';

const Auth = ({ onAuthSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);

  const DEFAULT_PASSWORD = 'medieval_kingdom_bypass';

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Direct Login Flow: Try to sign in with default password
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ 
        email, 
        password: DEFAULT_PASSWORD 
      });

      if (signInError) {
        // If sign in fails, try to sign up with the same default password
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ 
          email, 
          password: DEFAULT_PASSWORD 
        });
        
        if (signUpError) throw signUpError;
        
        // Return session if available (auto-confirm enabled)
        if (signUpData?.session) {
          onAuthSuccess(signUpData.session);
        } else {
          // If no session (email confirmation required), we still try to trigger success
          // or show a specific message. For dev, we assume auto-confirm.
          onAuthSuccess(null);
        }
      } else {
        onAuthSuccess(data.session);
      }
    } catch (err) {
      setError(err.message);
      console.error('Auth error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 sm:p-8 overflow-hidden">
      {/* iPad Container */}
      <div className="w-full max-w-[1024px] h-[90vh] max-h-[1366px] bg-stone-900 rounded-[3.5rem] border-[14px] border-stone-800 shadow-[0_50px_100px_-20px_rgba(0,0,0,1)] relative flex flex-col overflow-hidden">
        
        {/* Camera Notch Simulation */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-stone-800 rounded-b-2xl z-[60]" />
        
        {/* iPad Screen */}
        <div 
          className="flex-grow flex flex-col bg-cover bg-center bg-no-repeat relative items-center justify-center p-4"
          style={{ backgroundImage: `url(${bgMap})` }}
        >
          {/* Screen Overlay */}
          <div className="absolute inset-0 bg-stone-950/40 backdrop-blur-[1px]" />

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card w-full max-w-md p-8 rounded-3xl border-2 border-medieval-gold/30 relative overflow-hidden z-10"
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
              <p className="text-stone-400 mt-2">Enter your email to manage your realm.</p>
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
                {loading ? 'Processing...' : 'Enter Kingdom'}
              </button>
            </form>

            <div className="mt-8 text-center relative z-10">
              <p className="text-stone-500 text-xs uppercase tracking-widest">
                Direct access enabled for development
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
