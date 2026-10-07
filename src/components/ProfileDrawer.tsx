import React, { useEffect, useState } from 'react';
import { User, X, ChevronRight } from 'lucide-react';

export interface CustomerProfile {
  name: string;
  phone: string;
}

interface ProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  profile: CustomerProfile | null;
  onSaveProfile: (p: CustomerProfile) => void;
  hasActiveOrder: boolean;
  onOpenDeals: () => void;
  onTrackOrder: () => void;
  onOrderHistory: () => void;
  onManageAddresses: () => void;
  onOpenChat: () => void;
}

/** Left slide-in account menu (Domino's style), opened from the header profile icon. */
export const ProfileDrawer: React.FC<ProfileDrawerProps> = ({
  isOpen,
  onClose,
  profile,
  onSaveProfile,
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

  useEffect(() => {
    if (!isOpen) return;
    setEditing(false);
    setError('');
    setName(profile?.name ?? '');
    setPhone(profile?.phone ?? '');
  }, [isOpen, profile]);

  if (!isOpen) return null;

  const save = () => {
    const digits = phone.replace(/\D/g, '').replace(/^91/, '');
    if (!name.trim()) return setError('Enter your name');
    if (digits.length !== 10) return setError('Enter a 10-digit mobile number');
    onSaveProfile({ name: name.trim(), phone: digits });
    setEditing(false);
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

  return (
    <div className="fixed inset-0 z-[55] bg-black/50" onClick={onClose}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Account menu"
        className="h-full w-[85%] max-w-xs bg-white flex flex-col shadow-2xl animate-in slide-in-from-left duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Account header */}
        <div className="bg-[#f6ead6] px-4 py-5">
          {editing ? (
            <div className="space-y-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c9a46a]"
              />
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Mobile number"
                inputMode="tel"
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c9a46a]"
              />
              {error && <p className="text-[11px] font-bold text-red-600">{error}</p>}
              <div className="flex gap-2">
                <button
                  onClick={save}
                  className="flex-1 bg-[#ED1C24] hover:bg-[#c91430] text-white text-xs font-bold py-2 rounded-lg cursor-pointer"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="flex-1 bg-white border border-slate-200 text-xs font-bold py-2 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#f6ead6]0 text-white flex items-center justify-center shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-700 truncate">{profile?.name || 'Guest'}</p>
                <p className="text-sm font-bold text-slate-900 truncate">
                  {profile?.phone || 'Add your details'}
                </p>
              </div>
              <button
                onClick={() => setEditing(true)}
                className="text-xs font-bold text-[#8a5a2b] hover:underline cursor-pointer"
              >
                {profile ? 'Edit' : 'Add'}
              </button>
            </div>
          )}
        </div>

        {/* Menu */}
        <nav className="flex-1 overflow-y-auto">
          {items.map((it) => (
            <button
              key={it.label}
              onClick={it.onClick}
              disabled={it.disabled}
              className="w-full flex items-center justify-between px-4 py-3.5 text-left text-sm text-slate-800 hover:bg-slate-50 disabled:text-slate-400 disabled:hover:bg-transparent cursor-pointer disabled:cursor-default"
            >
              <span>{it.label}</span>
              {it.hint ? (
                <span className="text-[11px] text-slate-400">{it.hint}</span>
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-300" />
              )}
            </button>
          ))}
        </nav>

        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
          <button onClick={onClose} className="flex items-center gap-1 text-xs text-slate-500 cursor-pointer">
            <X className="w-3.5 h-3.5" /> Close
          </button>
        </div>
      </aside>
    </div>
  );
};
