import React, { useEffect, useState } from 'react';
import { User, X, ChevronRight, LogOut, CheckCircle2, Phone, Mail, Edit3, AlertCircle } from 'lucide-react';
import { loginWithGoogle, logoutUser } from '../lib/firebase';

export interface CustomerProfile {
  name: string;
  phone: string;
  email?: string;
  photoURL?: string;
  uid?: string;
  isGoogle?: boolean;
}

interface ProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  profile: CustomerProfile | null;
  onSaveProfile: (p: CustomerProfile) => void;
  onLogout?: () => void;
  hasActiveOrder: boolean;
  onOpenDeals: () => void;
  onTrackOrder: () => void;
  onOrderHistory: () => void;
  onManageAddresses: () => void;
  onOpenChat: () => void;
}

// Google SVG icon
const GoogleIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={`${className} shrink-0`} viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.97 0 12c0 2.03.45 3.84 1.25 5.42l4.03-3.15z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
    />
  </svg>
);

/** Left slide-in account menu with Google Login and Domino's-style options. */
export const ProfileDrawer: React.FC<ProfileDrawerProps> = ({
  isOpen,
  onClose,
  profile,
  onSaveProfile,
  onLogout,
  hasActiveOrder,
  onOpenDeals,
  onTrackOrder,
  onOrderHistory,
  onManageAddresses,
  onOpenChat,
}) => {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authSuccessMsg, setAuthSuccessMsg] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setEditing(false);
    setError('');
    setAuthSuccessMsg('');
    setName(profile?.name ?? '');
    setPhone(profile?.phone ?? '');
  }, [isOpen, profile]);

  if (!isOpen) return null;

  const save = () => {
    const digits = phone.replace(/\D/g, '').replace(/^91/, '');
    if (!name.trim()) return setError('Enter your name');
    if (digits && digits.length !== 10) return setError('Enter a 10-digit mobile number');
    onSaveProfile({
      ...profile,
      name: name.trim(),
      phone: digits,
    });
    setEditing(false);
    setError('');
  };

  const handleGoogleLogin = async () => {
    setError('');
    setAuthSuccessMsg('');
    setIsSigningIn(true);
    try {
      const user = await loginWithGoogle();
      const updatedProfile: CustomerProfile = {
        name: user.displayName || profile?.name || 'Customer',
        phone: user.phoneNumber?.replace(/\D/g, '').replace(/^91/, '') || profile?.phone || '',
        email: user.email || '',
        photoURL: user.photoURL || '',
        uid: user.uid,
        isGoogle: true,
      };
      onSaveProfile(updatedProfile);
      setAuthSuccessMsg(`Logged in as ${user.displayName || 'Google User'}!`);
      setTimeout(() => setAuthSuccessMsg(''), 4000);
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string };
      if (e?.code === 'auth/popup-closed-by-user' || e?.code === 'auth/cancelled-popup-request') {
        // User closed the popup, no error needed
      } else if (e?.code === 'auth/unauthorized-domain') {
        setError('Authorized domain error. Please add this domain in Firebase Console.');
      } else if (e?.code === 'auth/operation-not-allowed') {
        setError('Google sign-in is not enabled in Firebase Console.');
      } else {
        setError(e?.message || 'Failed to sign in with Google. Please try again.');
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch {
      // ignore
    }
    if (onLogout) {
      onLogout();
    } else {
      onSaveProfile({ name: '', phone: '' });
    }
    setEditing(false);
    setAuthSuccessMsg('Logged out successfully');
    setTimeout(() => setAuthSuccessMsg(''), 3000);
  };

  // Each menu action closes the drawer first so the next screen is visible.
  const go = (fn: () => void) => () => {
    onClose();
    fn();
  };

  const items: { label: string; onClick: () => void; hint?: string; disabled?: boolean }[] = [
    { label: 'Deals & Offers', onClick: go(onOpenDeals) },
    {
      label: 'Track Current Order',
      onClick: go(onTrackOrder),
      disabled: !hasActiveOrder,
      hint: hasActiveOrder ? undefined : 'No active order',
    },
    { label: 'Order History', onClick: go(onOrderHistory) },
    { label: 'Saved Addresses', onClick: go(onManageAddresses) },
    { label: 'Need Help? Chat with Us!', onClick: go(onOpenChat) },
  ];

  const isGoogleUser = Boolean(profile?.isGoogle || profile?.email);

  return (
    <div className="fixed inset-0 z-[57] bg-black/50 backdrop-blur-xs transition-opacity" onClick={onClose}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Account menu"
        className="h-full w-[85%] max-w-xs bg-white flex flex-col shadow-2xl animate-in slide-in-from-left duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Account header card */}
        <div className="bg-[#fcf7ee] border-b border-[#ebd7be] px-4 pt-5 pb-4">
          {editing ? (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Edit Details</span>
                <button
                  onClick={() => setEditing(false)}
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Full Name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ED1C24]"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Mobile Number (for delivery calls)
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-xs font-semibold text-slate-500">+91</span>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="10-digit number"
                    inputMode="tel"
                    className="w-full bg-white border border-slate-300 rounded-lg pl-11 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ED1C24]"
                  />
                </div>
              </div>

              {profile?.email && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 flex items-center gap-2 text-xs text-slate-600">
                  <GoogleIcon className="w-3.5 h-3.5" />
                  <span className="truncate">{profile.email}</span>
                </div>
              )}

              {error && (
                <p className="text-[11px] font-semibold text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{error}</span>
                </p>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={save}
                  className="flex-1 bg-[#ED1C24] hover:bg-[#c91430] text-white text-xs font-bold py-2 rounded-lg cursor-pointer shadow-xs transition-colors"
                >
                  Save Details
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold px-3 py-2 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="relative shrink-0">
                  {profile?.photoURL ? (
                    <img
                      src={profile.photoURL}
                      alt={profile.name || 'User'}
                      className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-600 to-amber-700 text-white flex items-center justify-center font-bold text-lg shadow-md">
                      {profile?.name ? profile.name.charAt(0).toUpperCase() : <User className="w-6 h-6" />}
                    </div>
                  )}

                  {isGoogleUser && (
                    <div
                      className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full border border-slate-200 shadow-xs flex items-center justify-center"
                      title="Google Account"
                    >
                      <GoogleIcon className="w-3 h-3" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-extrabold text-slate-900 truncate">
                      {profile?.name || 'Guest Customer'}
                    </p>
                  </div>

                  {profile?.email ? (
                    <p className="text-[11px] text-slate-600 truncate flex items-center gap-1 mt-0.5">
                      <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{profile.email}</span>
                    </p>
                  ) : null}

                  {profile?.phone ? (
                    <p className="text-xs font-medium text-slate-700 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>+91 {profile.phone}</span>
                    </p>
                  ) : isGoogleUser ? (
                    <button
                      onClick={() => setEditing(true)}
                      className="text-[11px] font-bold text-[#ED1C24] hover:underline flex items-center gap-1 mt-0.5 cursor-pointer"
                    >
                      <Phone className="w-3 h-3" />
                      <span>+ Add mobile number</span>
                    </button>
                  ) : (
                    <p className="text-[11px] text-slate-500 mt-0.5">Not signed in</p>
                  )}
                </div>

                {/* Edit details button */}
                <button
                  id="btn-edit-profile"
                  onClick={() => setEditing(true)}
                  aria-label="Edit profile"
                  className="shrink-0 p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-amber-100/60 transition-colors cursor-pointer"
                  title={profile?.name ? 'Edit Profile' : 'Add Details'}
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>

              {/* Success / Error notification */}
              {authSuccessMsg && (
                <div className="mt-3 p-2 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-1.5 text-emerald-800 text-xs font-semibold animate-in fade-in">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="truncate">{authSuccessMsg}</span>
                </div>
              )}

              {error && (
                <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-xl flex items-center gap-1.5 text-red-700 text-xs font-medium animate-in fade-in">
                  <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Google Login / Account Banner */}
        {!isGoogleUser ? (
          <div className="p-3.5 bg-gradient-to-br from-amber-50/80 via-white to-red-50/50 border-b border-slate-100">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded-sm">
                Account
              </span>
              <span className="text-[11px] text-slate-600 font-medium">Quick 1-Tap Google Login</span>
            </div>
            <button
              id="btn-google-login"
              onClick={handleGoogleLogin}
              disabled={isSigningIn}
              className="w-full flex items-center justify-center gap-2.5 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-800 border border-slate-300 font-bold text-xs py-2.5 px-3 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-60 hover:border-slate-400"
            >
              {isSigningIn ? (
                <div className="w-4 h-4 border-2 border-slate-300 border-t-[#ED1C24] rounded-full animate-spin" />
              ) : (
                <GoogleIcon className="w-4 h-4" />
              )}
              <span>{isSigningIn ? 'Connecting to Google...' : 'Sign in with Google'}</span>
            </button>
            <p className="text-[10px] text-slate-400 text-center mt-1.5">
              Saves your orders, favorite pizzas & address
            </p>
          </div>
        ) : (
          <div className="px-4 py-2 bg-emerald-50/70 border-b border-emerald-100/80 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-800">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Google Account Connected</span>
            </div>
            <button
              onClick={handleLogout}
              className="text-[11px] font-bold text-red-600 hover:text-red-700 flex items-center gap-1 hover:underline cursor-pointer"
            >
              <LogOut className="w-3 h-3" />
              <span>Log out</span>
            </button>
          </div>
        )}

        {/* Menu Items */}
        <nav className="flex-1 overflow-y-auto divide-y divide-slate-100">
          <div className="py-1">
            {items.map((it) => (
              <button
                key={it.label}
                onClick={it.onClick}
                disabled={it.disabled}
                className="w-full flex items-center justify-between px-4 py-3 text-left text-sm text-slate-800 hover:bg-slate-50 disabled:text-slate-400 disabled:hover:bg-transparent cursor-pointer disabled:cursor-default transition-colors"
              >
                <span className="font-medium">{it.label}</span>
                {it.hint ? (
                  <span className="text-[11px] text-slate-400">{it.hint}</span>
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                )}
              </button>
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/60">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            <X className="w-4 h-4" /> Close
          </button>
          {isGoogleUser && (
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-700 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign out
            </button>
          )}
        </div>
      </aside>
    </div>
  );
};
