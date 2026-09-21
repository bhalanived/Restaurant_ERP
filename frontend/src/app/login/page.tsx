'use client';

import { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { useRouter } from 'next/navigation';
import { Lock, Mail, ShieldAlert, Sparkles, ChefHat, UserCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth, theme, setTheme } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Set default theme from store
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const handleLogin = async (e?: React.FormEvent, customCredentials?: { e: string; p: string }) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);

    const loginEmail = customCredentials ? customCredentials.e : email;
    const loginPassword = customCredentials ? customCredentials.p : password;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

    try {
      const res = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      if (!res.ok) {
        throw new Error('Invalid email or password');
      }

      const data = await res.json();
      setAuth(data.user, data.access_token);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to connect to backend server');
    } finally {
      setLoading(false);
    }
  };

  const fillAndLogin = (roleEmail: string) => {
    handleLogin(undefined, { e: roleEmail, p: 'password123' });
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-slate-950">
      {/* Background glowing decorations */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-violet-600/20 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 rounded-full bg-indigo-600/20 blur-3xl" />

      {/* Main card */}
      <div className="w-full max-w-5xl grid md:grid-cols-12 gap-0 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-2xl overflow-hidden z-10">
        
        {/* Left branding panel */}
        <div className="hidden md:flex md:col-span-5 flex-col justify-between p-8 bg-gradient-to-br from-indigo-950 via-slate-900 to-violet-950 text-white relative login-hero-panel">
          <div className="absolute top-0 left-0 right-0 bottom-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.25),rgba(255,255,255,0))]" />
          
          <div className="flex items-center gap-2 z-10">
            <ChefHat className="h-8 w-8 text-indigo-400" />
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Surya Dhosa
            </span>
          </div>

          <div className="my-auto space-y-6 z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-violet-500/10 text-violet-300 border border-violet-500/20">
              <Sparkles className="h-3 w-3" /> Production-Ready ERP
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight leading-tight">
              Manage your food business like a pro.
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              Integrate order takers, POS terminals, recipe calculations, store stock counts, and staff complaint desks in one real-time dashboard.
            </p>
          </div>

          <div className="text-xs text-slate-400 z-10 border-t border-slate-800/60 pt-4">
            Powered by Next.js & NestJS Microservices
          </div>
        </div>

        {/* Right login form panel */}
        <div className="md:col-span-7 p-8 md:p-12 flex flex-col justify-center bg-slate-900/40 relative">
          {/* Theme switcher */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="absolute top-4 right-4 text-xs font-medium text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700 bg-slate-900 rounded-lg px-3 py-1.5 transition"
          >
            Toggle theme
          </button>

          <div className="max-w-md w-full mx-auto space-y-8">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white">
                Account Sign In
              </h2>
              <p className="text-slate-400 text-sm mt-1">
                Enter your credentials or select a quick-login profile below
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2.5 p-3.5 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 text-xs font-medium animate-pulse">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="name@restaurant.com"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Password
                  </label>
                  <a href="/forgot-password" className="text-[11px] font-medium text-indigo-400 hover:text-indigo-300 transition">
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg font-medium text-sm text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-slate-900 px-3 text-slate-400 font-semibold tracking-wide">
                  Quick Demo Accounts
                </span>
              </div>
            </div>

            {/* Quick Demo Logins Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => fillAndLogin('admin@restaurant.com')}
                className="flex items-center justify-between p-2 rounded-lg border border-slate-800 bg-slate-950 text-slate-300 hover:text-white hover:border-slate-700 transition"
              >
                <span>Super Admin</span>
                <UserCheck className="h-3.5 w-3.5 text-violet-400" />
              </button>
              <button
                onClick={() => fillAndLogin('owner@restaurant.com')}
                className="flex items-center justify-between p-2 rounded-lg border border-slate-800 bg-slate-950 text-slate-300 hover:text-white hover:border-slate-700 transition"
              >
                <span>Owner</span>
                <UserCheck className="h-3.5 w-3.5 text-indigo-400" />
              </button>
              <button
                onClick={() => fillAndLogin('cashier@restaurant.com')}
                className="flex items-center justify-between p-2 rounded-lg border border-slate-800 bg-slate-950 text-slate-300 hover:text-white hover:border-slate-700 transition"
              >
                <span>Cashier POS</span>
                <UserCheck className="h-3.5 w-3.5 text-emerald-400" />
              </button>
              <button
                onClick={() => fillAndLogin('waiter@restaurant.com')}
                className="flex items-center justify-between p-2 rounded-lg border border-slate-800 bg-slate-950 text-slate-300 hover:text-white hover:border-slate-700 transition"
              >
                <span>Waiter Panel</span>
                <UserCheck className="h-3.5 w-3.5 text-amber-400" />
              </button>
              <button
                onClick={() => fillAndLogin('kitchen@restaurant.com')}
                className="flex items-center justify-between p-2 rounded-lg border border-slate-800 bg-slate-950 text-slate-300 hover:text-white hover:border-slate-700 transition"
              >
                <span>Kitchen Screen</span>
                <UserCheck className="h-3.5 w-3.5 text-rose-400" />
              </button>
              <button
                onClick={() => fillAndLogin('inventory@restaurant.com')}
                className="flex items-center justify-between p-2 rounded-lg border border-slate-800 bg-slate-950 text-slate-300 hover:text-white hover:border-slate-700 transition"
              >
                <span>Inventory</span>
                <UserCheck className="h-3.5 w-3.5 text-sky-400" />
              </button>
            </div>

            <p className="text-center text-xs text-slate-400">
              Don&apos;t have an account?{' '}
              <a href="/register" className="text-indigo-400 hover:text-indigo-300 font-semibold transition">
                Sign up
              </a>
            </p>
          </div>
        </div>

      </div>

      <a
        href="/"
        className="absolute top-4 left-4 z-10 text-xs font-medium text-slate-400 hover:text-white transition"
      >
        ← Back to home
      </a>
    </div>
  );
}
