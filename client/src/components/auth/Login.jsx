import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success("Welcome back to Eldoria!");
    } catch (error) {
      toast.error(error.message || "Failed to authenticate.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#faf4e5] border-4 border-[#8b4513] rounded-xl p-8 shadow-2xl max-w-sm w-full relative">
      {/* Decorative Header */}
      <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-[#8b4513] text-[#ffd700] px-6 py-2 rounded-t-lg border-2 border-[#d4af37] font-black uppercase tracking-widest text-lg shadow-lg whitespace-nowrap">
        Eldoria Vault
      </div>
      
      <form onSubmit={handleLogin} className="mt-6 flex flex-col gap-4">
        <div>
          <label className="block text-xs font-black text-stone-700 uppercase tracking-wider mb-1">Email / Scroll</label>
          <input 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-white border-2 border-[#8b4513]/30 rounded-lg px-4 py-2 text-stone-800 font-bold focus:outline-none focus:border-[#8b4513] transition-colors"
            placeholder="lord@eldoria.com"
          />
        </div>
        
        <div>
          <label className="block text-xs font-black text-stone-700 uppercase tracking-wider mb-1">Password / Sigil</label>
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full bg-white border-2 border-[#8b4513]/30 rounded-lg px-4 py-2 text-stone-800 font-bold focus:outline-none focus:border-[#8b4513] transition-colors"
            placeholder="••••••••"
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="mt-4 w-full bg-[#8b4513] text-[#ffd700] font-black uppercase tracking-widest py-3 rounded-lg border-2 border-[#d4af37]/50 hover:bg-[#a0522d] hover:scale-[1.02] active:scale-95 transition-all shadow-md disabled:opacity-50"
        >
          {loading ? 'Unsealing...' : 'Enter Vault'}
        </button>
      </form>
    </div>
  );
}
