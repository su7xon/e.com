import React, { useState } from 'react';
import { Store, Lock, Eye, EyeOff, LogIn } from 'lucide-react';
import { OUTLETS, Outlet } from './outlets';

interface AdminLoginProps {
  onLogin: (outlet: Outlet) => void;
  onBackToStore: () => void;
  /** rider mode: delivery staff login screen (/delivery) */
  mode?: 'admin' | 'rider';
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin, onBackToStore, mode = 'admin' }) => {
  const [selectedId, setSelectedId] = useState(OUTLETS[0].id);
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const outlet = OUTLETS.find((o) => o.id === selectedId)!;
    if (password === outlet.password) {
      setError('');
      onLogin(outlet);
    } else {
      setError('Incorrect password. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-sm bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-6 text-center">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-[#ED1C24] to-red-500 flex items-center justify-center text-white font-black text-xl shadow-lg">
            7
          </div>
          <h1 className="text-white font-black text-lg mt-3">{mode === 'rider' ? 'Rider Login' : '7 Cheese Admin POS'}</h1>
          <p className="text-slate-400 text-xs mt-1">{mode === 'rider' ? 'Enter password to open delivery queue' : 'Enter password to open POS'}</p>
        </div>

        <form onSubmit={handleLogin} className="p-5 space-y-4">
          {/* Single outlet info (selector hataya — ab sirf 1 outlet) */}
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border-2 border-[#ED1C24] bg-red-50">
            <Store className="w-5 h-5 text-[#ED1C24]" />
            <div>
              <div className="text-xs font-bold text-slate-900">{OUTLETS[0].shortName}</div>
              <div className="text-[10px] font-medium text-slate-400">{OUTLETS[0].area}</div>
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Password</label>
            <div className="relative mt-2">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                placeholder="Outlet password"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-11 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-[#ED1C24] focus:ring-2 focus:ring-red-100"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {error && <p className="text-xs font-bold text-[#ED1C24] mt-2">{error}</p>}
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-[#ED1C24] hover:bg-[#c91430] active:scale-95 text-white py-3 rounded-2xl text-sm font-black shadow-md shadow-red-500/20 transition-all cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>{mode === 'rider' ? 'Open Delivery Queue' : 'Open POS Panel'}</span>
          </button>

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
