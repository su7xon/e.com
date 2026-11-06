import React, { useState } from 'react';
import { Lock, Eye, EyeOff, LogIn, User, Loader2 } from 'lucide-react';
import { staffSignIn, authErrorMessage } from '../../lib/auth';

interface AdminLoginProps {
  onBackToStore: () => void;
  /** rider mode: delivery staff login screen (/delivery) */
  mode?: 'admin' | 'rider';
  /** Shown when a login was refused (removed / no staff access). */
  notice?: string;
}

/** Staff login: each person signs in with their own username + password; the store comes from their profile. */
export const AdminLogin: React.FC<AdminLoginProps> = ({ onBackToStore, mode = 'admin', notice }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Enter your username and password.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await staffSignIn(username, password);
      // The app picks up the session and opens the right screen.
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const shown = error || notice || '';

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-sm bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-6 text-center">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-[#ED1C24] to-red-500 flex items-center justify-center text-white font-black text-xl shadow-lg">
            7
          </div>
          <h1 className="text-white font-black text-lg mt-3">{mode === 'rider' ? 'Rider Login' : '7 Cheese Staff Login'}</h1>
          <p className="text-slate-400 text-xs mt-1">Sign in with the username your owner or manager gave you</p>
        </div>

        <form onSubmit={handleLogin} className="p-5 space-y-4">
          <div>
            <label htmlFor="staff-username" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Username</label>
            <div className="relative mt-2">
              <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="staff-username"
                type="text"
                autoCapitalize="none"
                autoCorrect="off"
                autoComplete="username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError('');
                }}
                placeholder="e.g. raipur.manager"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-[#ED1C24] focus:ring-2 focus:ring-red-100"
              />
            </div>
          </div>

          <div>
            <label htmlFor="staff-password" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Password</label>
            <div className="relative mt-2">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="staff-password"
                type={showPw ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                placeholder="Password"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-11 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-[#ED1C24] focus:ring-2 focus:ring-red-100"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                aria-label={showPw ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {shown && <p role="alert" className="text-xs font-bold text-[#ED1C24]">{shown}</p>}

          <button
            type="submit"
            disabled={busy}
            className="w-full flex items-center justify-center gap-2 bg-[#ED1C24] hover:bg-[#c91430] active:scale-95 disabled:opacity-60 text-white py-3 rounded-2xl text-sm font-black shadow-md shadow-red-500/20 transition-all cursor-pointer"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
            <span>{busy ? 'Signing in…' : 'Sign in'}</span>
          </button>

          <p className="text-[11px] text-slate-400 text-center">Forgot your password? Ask your store manager or the owner to reset your login.</p>

          <button
            type="button"
            onClick={onBackToStore}
            className="w-full text-xs font-bold text-slate-500 hover:text-slate-800 py-1 cursor-pointer"
          >
            ← Back to Customer Store
          </button>
        </form>
      </div>
    </div>
  );
};
