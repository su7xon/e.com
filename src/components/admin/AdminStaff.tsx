import React, { useEffect, useMemo, useState } from 'react';
import { UserPlus, Users, Copy, Check, Loader2, KeyRound, RotateCcw, UserX } from 'lucide-react';
import {
  StaffProfile,
  StaffRole,
  ROLE_LABEL,
  watchStaffList,
  createStaffLogin,
  setStaffActive,
  authErrorMessage,
  isValidUsername,
  normalizeUsername,
} from '../../lib/auth';
import { creatableRoles } from './permissions';
import { useOutlets, getOutletById } from './outlets';

interface AdminStaffProps {
  me: StaffProfile;
  /** Owner's store filter ('all' = every store). Managers always see their own store. */
  scopeOutletId: string | 'all';
}

const ROLE_HINT: Record<StaffRole, string> = {
  owner: 'All stores, everything',
  manager: 'Runs one store: orders, billing, sold out, tables, reports, staff',
  staff: 'Counter / kitchen: orders, billing, KOT, sold out',
  rider: 'Delivery queue only',
};

function randomPassword(): string {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let s = '';
  for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

/** Owner: every login at every store. Manager: Staff and Riders of their own store. */
export const AdminStaff: React.FC<AdminStaffProps> = ({ me, scopeOutletId }) => {
  const outlets = useOutlets();
  const myScope = me.role === 'owner' ? 'all' : me.outletId || '';
  const [list, setList] = useState<StaffProfile[]>([]);
  const [loadError, setLoadError] = useState('');
  const roles = creatableRoles(me);

  const defaultStore = me.role === 'owner' ? (scopeOutletId !== 'all' ? scopeOutletId : outlets[0]?.id) : me.outletId;
  const [form, setForm] = useState({ name: '', username: '', password: randomPassword(), role: roles[0] as StaffRole, outletId: defaultStore || '' });
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');
  const [created, setCreated] = useState<{ name: string; username: string; password: string; store: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!myScope) return;
    return watchStaffList(myScope, setList, setLoadError);
  }, [myScope]);

  useEffect(() => {
    if (me.role === 'owner' && scopeOutletId !== 'all') setForm((f) => ({ ...f, outletId: scopeOutletId }));
  }, [scopeOutletId, me.role]);

  const shown = useMemo(
    () => list.filter((s) => s.uid !== me.uid && (scopeOutletId === 'all' || me.role !== 'owner' || s.outletId === scopeOutletId)),
    [list, scopeOutletId, me.uid, me.role],
  );

  const suggestUsername = (role: StaffRole, outletId: string) => {
    const base = outletId === 'outlet-1' ? 'haldwani' : outletId.split('-')[0];
    const taken = new Set(list.map((s) => s.username));
    let n = 1;
    let u = role === 'manager' ? `${base}.manager` : `${base}.${role}${n}`;
    while (taken.has(u)) u = `${base}.${role}${++n}`;
    return u;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    const username = normalizeUsername(form.username || suggestUsername(form.role, form.outletId));
    if (!form.name.trim()) return setFormError('Enter the person’s name (it prints as “Sold by” on bills).');
    if (!isValidUsername(username)) return setFormError('Username: 3–30 letters, numbers, dots or dashes (e.g. raipur.staff1).');
    setBusy(true);
    try {
      await createStaffLogin({ ...form, username }, me);
      setCreated({ name: form.name.trim(), username, password: form.password, store: getOutletById(form.outletId)?.shortName || form.outletId });
      setForm((f) => ({ ...f, name: '', username: '', password: randomPassword() }));
    } catch (err) {
      setFormError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (s: StaffProfile) => {
    const removing = s.active;
    if (removing && !window.confirm(`Remove ${s.name}'s login (${s.username})? They are signed out and can no longer open the panel.`)) return;
    try {
      await setStaffActive(s.uid, !removing);
    } catch (err) {
      window.alert(authErrorMessage(err));
    }
  };

  const canManage = (s: StaffProfile) => me.role === 'owner' || (s.outletId === me.outletId && (s.role === 'staff' || s.role === 'rider'));

  const copyCreated = async () => {
    if (!created) return;
    const text = `7 Cheese Pizza staff login\nStore: ${created.store}\nUsername: ${created.username}\nPassword: ${created.password}\nOpen: ${window.location.origin}/admin`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copy these login details:', text);
    }
  };

  const input = 'w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-[#ED1C24] focus:ring-2 focus:ring-red-100';

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-black text-slate-900 flex items-center gap-2"><Users className="w-5 h-5 text-[#ED1C24]" /> Staff logins</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          {me.role === 'owner'
            ? 'Everyone who can open the admin panel, at every store. Each person gets their own login.'
            : `Staff and riders at ${getOutletById(me.outletId || '')?.shortName || 'your store'}.`}
        </p>
      </div>

      {/* New login */}
      {roles.length > 0 && (
        <form onSubmit={handleCreate} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
          <div className="font-black text-sm text-slate-900 flex items-center gap-2"><UserPlus className="w-4 h-4" /> Add a login</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Name</span>
              <input id="staff-new-name" className={`${input} mt-1`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Shubham Thapa" />
            </label>
            <label className="block">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Role</span>
              <select id="staff-new-role" className={`${input} mt-1`} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as StaffRole })}>
                {roles.map((r) => (
                  <option key={r} value={r}>{ROLE_LABEL[r]} — {ROLE_HINT[r]}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Store</span>
              <select
                id="staff-new-store"
                className={`${input} mt-1`}
                value={form.outletId}
                disabled={me.role !== 'owner'}
                onChange={(e) => setForm({ ...form, outletId: e.target.value })}
              >
                {outlets.map((o) => (
                  <option key={o.id} value={o.id}>{o.shortName}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Username</span>
              <input
                id="staff-new-username"
                className={`${input} mt-1`}
                autoCapitalize="none"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder={suggestUsername(form.role, form.outletId)}
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Password</span>
              <div className="flex gap-2 mt-1">
                <input id="staff-new-password" className={input} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                <button type="button" onClick={() => setForm({ ...form, password: randomPassword() })} className="shrink-0 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold cursor-pointer" title="New random password">
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </label>
          </div>
          {formError && <p role="alert" className="text-xs font-bold text-[#ED1C24]">{formError}</p>}
          <button id="btn-staff-create" type="submit" disabled={busy} className="flex items-center gap-2 bg-[#ED1C24] hover:bg-[#c91430] disabled:opacity-60 text-white px-4 py-2.5 rounded-xl text-xs font-black cursor-pointer">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            Create login
          </button>
        </form>
      )}

      {created && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 text-sm">
          <div className="font-black text-emerald-900">Login created for {created.name}</div>
          <p className="text-xs text-emerald-800 mt-1">Give them these details. The password is shown only now.</p>
          <div className="mt-2 font-mono text-xs bg-white border border-emerald-200 rounded-xl p-3 space-y-0.5">
            <div>Store: {created.store}</div>
            <div>Username: <b>{created.username}</b></div>
            <div>Password: <b>{created.password}</b></div>
          </div>
          <div className="mt-2 flex gap-2">
            <button onClick={copyCreated} className="flex items-center gap-1.5 bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer">
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} {copied ? 'Copied' : 'Copy details'}
            </button>
            <button onClick={() => setCreated(null)} className="px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-800 hover:bg-emerald-100 cursor-pointer">Done</button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
        {loadError && <p className="p-4 text-xs font-bold text-red-600">{loadError}</p>}
        {!loadError && shown.length === 0 && <p className="p-6 text-center text-xs text-slate-500">No logins yet{scopeOutletId !== 'all' && me.role === 'owner' ? ' at this store' : ''}.</p>}
        {shown.map((s) => (
          <div key={s.uid} className={`flex items-center gap-3 px-4 py-3 ${s.active ? '' : 'opacity-60'}`}>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold text-slate-900 truncate">
                {s.name} <span className="font-mono text-xs text-slate-500">· {s.username}</span>
              </div>
              <div className="text-[11px] text-slate-500 truncate">
                {ROLE_LABEL[s.role]} · {getOutletById(s.outletId || '')?.shortName || 'All stores'}
                {!s.active && ' · removed'}
              </div>
            </div>
            {canManage(s) && s.role !== 'owner' && (
              <button
                onClick={() => toggleActive(s)}
                className={`shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-black cursor-pointer ${
                  s.active ? 'bg-red-50 text-red-700 hover:bg-red-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                {s.active ? <UserX className="w-3.5 h-3.5" /> : <RotateCcw className="w-3.5 h-3.5" />}
                {s.active ? 'Remove' : 'Restore'}
              </button>
            )}
          </div>
        ))}
      </div>

      <p className="text-[11px] text-slate-500 flex items-start gap-1.5">
        <KeyRound className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        Forgotten password: remove the login and create a new one with a new username (for example raipur.staff2).
      </p>
    </div>
  );
};
