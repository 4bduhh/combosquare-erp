import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Sparkles, Mail, Lock, ArrowRight } from 'lucide-react';
import logoUrl from '/Combo_Square_Logo.png';

export function AuthPage() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const fn = mode === 'login' ? signIn : signUp;
    const { error } = await fn(email, password);
    if (error) setError(error);
    setLoading(false);
  };

  const inputCls =
    'w-full px-4 py-2.5 pl-10 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 outline-none transition-all focus:border-[#D9C8FF] focus:bg-white/15 focus:ring-2 focus:ring-[#D9C8FF]/30';

  return (
    <div className="min-h-screen bg-violet-dusk flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-[#7653B8]/20 blur-3xl animate-float" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-[#D9C8FF]/10 blur-3xl animate-float" style={{ animationDelay: '2s' }} />

      <div className="relative w-full max-w-md animate-fade-in-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src={logoUrl} alt="Combo Square" className="w-20 h-20 mx-auto mb-4 rounded-2xl object-contain animate-glow" />
          <h1 className="text-3xl font-extrabold text-white tracking-tight">COMBO SQUARE</h1>
          <p className="text-[#D9C8FF] text-sm mt-1">Creative & Tech Agency Management</p>
        </div>

        {/* Card */}
        <div className="rounded-3xl p-8 shadow-2xl bg-white/5 backdrop-blur-xl border border-white/10">
          <div className="flex gap-2 p-1 rounded-xl bg-white/5 mb-6">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                mode === 'login' ? 'bg-[#7653B8] text-white' : 'text-white/60 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                mode === 'signup' ? 'bg-[#7653B8] text-white' : 'text-white/60 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={inputCls}
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className={inputCls}
              />
            </div>

            {error && (
              <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5 animate-fade-in">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-5 py-2.5 rounded-xl font-semibold transition-all btn-glow flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed bg-[#7653B8] text-white hover:shadow-lg"
            >
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <p className="text-center text-xs text-white/40 mt-6">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              className="text-[#D9C8FF] font-semibold hover:underline"
            >
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>

        <p className="text-center text-xs text-white/30 mt-6 flex items-center justify-center gap-1.5">
          <Sparkles size={12} /> Your data is securely stored and private to you
        </p>
      </div>
    </div>
  );
}
