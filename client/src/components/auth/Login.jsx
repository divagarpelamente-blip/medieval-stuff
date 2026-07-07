import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);

  // Custom session cleanup if "Remember Me" is disabled
  useEffect(() => {
    const handleUnload = () => {
      if (!rememberMe) {
        // Clear Supabase session keys from localStorage if user didn't want to stay online
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
            localStorage.removeItem(key);
          }
        });
      }
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [rememberMe]);

  // Clean up any remaining loading toasts when the component unmounts
  useEffect(() => {
    return () => {
      toast.dismiss();
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Thy credentials must not be empty, traveler!');
      return;
    }

    setLoading(true);
    const toastId = toast.loading(
      isSignUp ? 'Forging thy profile in the kingdom registries...' : 'Verifying thy credentials at the gates...'
    );

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        toast.success('Sign up successful! Welcome to the realm of Eldoria, my Lord!', { id: toastId });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success('Access granted! Welcome back, my Lord!', { id: toastId });
      }
    } catch (err) {
      console.error(err);
      toast.error(`The gates remain closed: ${err.message || err}`, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handleRecover = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Specify thy email, scribe!');
      return;
    }
    setLoading(true);
    const toastId = toast.loading('Sending recovery messenger bird...');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });
      if (error) throw error;
      toast.success('Recovery scroll sent! Check thy inbox.', { id: toastId });
      setIsRecovering(false);
    } catch (err) {
      console.error(err);
      toast.error(`Messenger bird lost: ${err.message || err}`, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0a0a0a] p-4 relative overflow-hidden">
      {/* Background Medieval Theme */}
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{ 
          backgroundImage: "url('https://www.transparenttextures.com/patterns/paper-fibers.png')",
          backgroundSize: 'cover'
        }}
      />

      {/* Ornate Frame Card */}
      <div className="relative bg-[#f4e4bc] w-full max-w-md p-8 sm:p-10 rounded-2xl border-[8px] border-[#5d4037] shadow-[0_0_50px_rgba(0,0,0,0.8)] z-10 overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Parchment Paper Fibers Texture overlay */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-25 mix-blend-multiply"
          style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/paper-fibers.png')" }}
        />

        {/* Ornate Corner Accents */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#8b4513]/30 rounded-tl-lg pointer-events-none" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#8b4513]/30 rounded-tr-lg pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#8b4513]/30 rounded-bl-lg pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#8b4513]/30 rounded-br-lg pointer-events-none" />

        {/* Header Title */}
        <div className="relative text-center mb-6">
          <div className="text-4xl mb-3 animate-bounce">
            {isRecovering ? '🕊️' : '🏰'}
          </div>
          <h1 className="title-font text-2xl sm:text-3xl font-black text-[#4b2c20] tracking-widest uppercase">
            Eldoria
          </h1>
          <p className="text-[10px] font-serif italic text-[#8b4513]/70 uppercase tracking-wider mt-1.5 font-bold">
            {isRecovering 
              ? 'Summon Password Recovery Bird' 
              : isSignUp 
                ? 'Enroll in the Royal Treasury' 
                : 'Gates of the Royal Treasury'
            }
          </p>
          <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-[#8b4513]/40 to-transparent mx-auto mt-3" />
        </div>

        {isRecovering ? (
          /* Password Recovery Form */
          <form onSubmit={handleRecover} className="space-y-5 relative z-10">
            <div>
              <label className="block text-[9px] font-black uppercase text-[#5d4037] mb-1.5 tracking-wider font-sans">
                Thy Registered Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="scroll@kingdom.com"
                disabled={loading}
                className="w-full bg-[#faf4e5]/90 border-2 border-[#8b4513]/30 focus:border-[#8b4513] rounded-xl text-xs font-bold text-[#4b2c20] px-4 py-3 placeholder-[#8b4513]/40 focus:outline-none transition-colors shadow-inner"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 bg-[#8b4513] border-2 border-[#d4af37]/30 text-[#ffd700] hover:text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-[0_4px_10px_rgba(0,0,0,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer select-none flex items-center justify-center gap-2"
            >
              <span>Send Recovery Scroll</span>
              <span>🕊️</span>
            </button>

            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => setIsRecovering(false)}
                className="text-[10px] font-serif italic text-[#8b4513] hover:text-[#4b2c20] underline transition-colors cursor-pointer"
              >
                Return to Gates
              </button>
            </div>
          </form>
        ) : (
          /* Sign In / Sign Up Form */
          <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
            <div>
              <label className="block text-[9px] font-black uppercase text-[#5d4037] mb-1.5 tracking-wider font-sans">
                Email / Royal Registry Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="scroll@kingdom.com"
                disabled={loading}
                className="w-full bg-[#faf4e5]/90 border-2 border-[#8b4513]/30 focus:border-[#8b4513] rounded-xl text-xs font-bold text-[#4b2c20] px-4 py-3 placeholder-[#8b4513]/40 focus:outline-none transition-colors shadow-inner"
                required
              />
            </div>

            <div>
              <label className="block text-[9px] font-black uppercase text-[#5d4037] mb-1.5 tracking-wider font-sans">
                Password / Royal Seal
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
                className="w-full bg-[#faf4e5]/90 border-2 border-[#8b4513]/30 focus:border-[#8b4513] rounded-xl text-xs font-bold text-[#4b2c20] px-4 py-3 placeholder-[#8b4513]/40 focus:outline-none transition-colors shadow-inner"
                required
              />
            </div>

            {/* Keep Online (Remember me) Checkbox */}
            <div className="flex items-center gap-2 py-1 pl-1">
              <input
                type="checkbox"
                id="remember_me"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-2 border-[#8b4513]/30 accent-[#8b4513] cursor-pointer"
              />
              <label 
                htmlFor="remember_me" 
                className="text-[9px] font-black uppercase text-[#5d4037]/80 tracking-wide cursor-pointer font-sans select-none"
              >
                Keep user online (Persist Scroll)
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 bg-[#8b4513] border-2 border-[#d4af37]/30 text-[#ffd700] hover:text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-[0_4px_10px_rgba(0,0,0,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer select-none flex items-center justify-center gap-2"
            >
              <span>{isSignUp ? 'Register Peerage' : 'Enter Keep'}</span>
              <span>🗝️</span>
            </button>

            {/* Recovery Option */}
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => setIsRecovering(true)}
                className="text-[9.5px] font-serif font-bold italic text-[#8b4513] hover:text-[#4b2c20] transition-colors cursor-pointer"
              >
                Lost thy key? Recover password
              </button>
            </div>
          </form>
        )}

        {/* Toggle Sign In / Sign Up Mode */}
        {!isRecovering && (
          <div className="relative text-center mt-5 border-t border-[#8b4513]/10 pt-4 z-10">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              disabled={loading}
              className="text-[10px] font-serif italic text-[#8b4513] hover:text-[#4b2c20] underline transition-colors cursor-pointer"
            >
              {isSignUp 
                ? 'Already listed in the peerage logs? Sign in' 
                : 'New to these lands? Request royal peerage'
              }
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
