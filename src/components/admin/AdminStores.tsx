import React, { useState } from 'react';
import { Store, MapPin, Save, Loader2, ChevronDown, ChevronUp, Plus, AlertTriangle } from 'lucide-react';
import { Outlet, useOutlets, setLiveOutlet, isOutletOpen, formatHour, SEED_OUTLETS } from './outlets';
import { saveOutletToFirestore } from '../../lib/firebase';

/** Reads "lat, lng" or a Google Maps link (…/@30.31,78.09,17z or ?q=30.31,78.09). */
export function parsePin(text: string): { lat: number; lng: number } | null {
  const m =
    text.match(/@(-?\d+\.\d+),\s*(-?\d+\.\d+)/) ||
    text.match(/[?&](?:q|query|ll)=(-?\d+\.\d+),\s*(-?\d+\.\d+)/) ||
    text.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/) ||
    text.match(/^\s*(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)\s*$/);
  if (!m) return null;
  const lat = Number(m[1]);
  const lng = Number(m[2]);
  return Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? { lat, lng } : null;
}

const input =
  'w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-[#ED1C24] focus:ring-2 focus:ring-red-100';

const StoreEditor: React.FC<{ outlet: Outlet; onDone: () => void }> = ({ outlet, onDone }) => {
  const [o, setO] = useState<Outlet>(outlet);
  const [pinText, setPinText] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const set = <K extends keyof Outlet>(k: K, v: Outlet[K]) => setO((p) => ({ ...p, [k]: v }));
  const setBill = (patch: Partial<Outlet['bill']>) => setO((p) => ({ ...p, bill: { ...p.bill, ...patch } }));

  const applyPin = () => {
    const pin = parsePin(pinText);
    if (!pin) return setMsg('Could not read a location. Paste a Google Maps link or "30.3099, 78.0949".');
    setO((p) => ({ ...p, ...pin, pinConfirmed: true }));
    setPinText('');
    setMsg('');
  };

  const save = async () => {
    setBusy(true);
    setMsg('');
    try {
      setLiveOutlet(o);
      await saveOutletToFirestore(o);
      onDone();
    } catch {
      setMsg('Could not save. Check the internet and that you are signed in as the owner.');
    } finally {
      setBusy(false);
    }
  };

  const field = (label: string, el: React.ReactNode, wide = false) => (
    <label className={`block ${wide ? 'sm:col-span-2' : ''}`}>
      <span className="text-[11px] font-bold text-slate-500 uppercase">{label}</span>
      <div className="mt-1">{el}</div>
    </label>
  );

  return (
    <div className="px-4 pb-4 pt-1 space-y-4 border-t border-slate-100">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {field('Store name', <input className={input} value={o.shortName} onChange={(e) => set('shortName', e.target.value)} />)}
        {field('Phone (customers)', <input className={input} value={o.phone} onChange={(e) => set('phone', e.target.value)} />)}
        {field('Full address', <input className={input} value={o.address} onChange={(e) => set('address', e.target.value)} />, true)}
        {field('Opens at', <input type="time" className={input} value={o.opensAt} onChange={(e) => set('opensAt', e.target.value)} />)}
        {field('Closes at', <input type="time" className={input} value={o.closesAt} onChange={(e) => set('closesAt', e.target.value)} />)}
        {field('Delivery radius (km)', <input type="number" min={1} max={30} className={input} value={o.radiusKm} onChange={(e) => set('radiusKm', Number(e.target.value) || 1)} />)}
        {field(
          'GST on bills',
          <select className={input} value={o.gstRate} onChange={(e) => set('gstRate', Number(e.target.value))}>
            <option value={0}>No GST (0%)</option>
            <option value={0.05}>5% (2.5% CGST + 2.5% SGST)</option>
          </select>,
        )}
      </div>

      {/* Map pin */}
      <div className="rounded-xl border border-slate-200 p-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-black text-slate-800 flex items-center gap-1.5"><MapPin className="w-4 h-4 text-[#ED1C24]" /> Map pin</span>
          <a className="text-[11px] font-bold text-blue-700 hover:underline" href={`https://www.google.com/maps?q=${o.lat},${o.lng}`} target="_blank" rel="noreferrer">
            Open current pin ↗
          </a>
        </div>
        <p className="text-[11px] text-slate-500">
          {o.lat.toFixed(5)}, {o.lng.toFixed(5)} · {o.pinConfirmed ? 'confirmed' : 'not confirmed (town centre)'} — orders go to the nearest store, so the pin should be on the shop.
        </p>
        <div className="flex gap-2">
          <input className={input} value={pinText} onChange={(e) => setPinText(e.target.value)} placeholder="Paste Google Maps link of the shop, or 30.3099, 78.0949" />
          <button type="button" onClick={applyPin} className="shrink-0 px-3 rounded-xl bg-slate-900 text-white text-xs font-bold cursor-pointer">Use</button>
        </div>
      </div>

      {/* Bill header */}
      <div className="rounded-xl border border-slate-200 p-3 space-y-3">
        <span className="text-xs font-black text-slate-800">Bill header (as printed on this store's bills)</span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {field(
            'Heading',
            <select className={input} value={o.bill.title} onChange={(e) => setBill({ title: e.target.value })}>
              <option>TAX INVOICE</option>
              <option>BILL OF SUPPLY</option>
              <option>BILL</option>
            </select>,
          )}
          {field('Line under heading', <input className={input} value={o.bill.subtitle || ''} placeholder="e.g. (Under Composition)" onChange={(e) => setBill({ subtitle: e.target.value || undefined })} />)}
          {field(
            'Address lines (one per line)',
            <textarea rows={2} className={input} value={o.bill.lines.join('\n')} onChange={(e) => setBill({ lines: e.target.value.split('\n') })} />,
            true,
          )}
          {field('Phones on bill', <input className={input} value={o.bill.phones} onChange={(e) => setBill({ phones: e.target.value })} />)}
          {field('GSTIN', <input className={input} value={o.bill.gstin || ''} onChange={(e) => setBill({ gstin: e.target.value.toUpperCase() || undefined })} />)}
          {field('FSSAI No.', <input className={input} value={o.bill.fssai || ''} onChange={(e) => setBill({ fssai: e.target.value || undefined })} />)}
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm font-bold text-slate-800">
        <input type="checkbox" checked={o.active} onChange={(e) => set('active', e.target.checked)} className="w-4 h-4 accent-[#ED1C24]" />
        Store is taking orders
      </label>

      {msg && <p role="alert" className="text-xs font-bold text-[#ED1C24]">{msg}</p>}
      <div className="flex gap-2">
        <button onClick={save} disabled={busy} className="flex items-center gap-2 bg-[#ED1C24] hover:bg-[#c91430] disabled:opacity-60 text-white px-4 py-2 rounded-xl text-xs font-black cursor-pointer">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save store
        </button>
        <button onClick={onDone} className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer">Cancel</button>
      </div>
    </div>
  );
};

/** Owner: the stores, their details, map pins, hours, GST and bill headers. */
export const AdminStores: React.FC = () => {
  const outlets = useOutlets();
  const [openId, setOpenId] = useState<string | null>(null);
  const unconfirmed = outlets.filter((o) => !o.pinConfirmed).length;

  const addStore = () => {
    const name = window.prompt('New store name (e.g. "Rudrapur")');
    if (!name?.trim()) return;
    const id = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    if (!id || outlets.some((o) => o.id === id)) return window.alert('A store with that name already exists.');
    const base = SEED_OUTLETS[0];
    const o: Outlet = {
      ...base,
      id,
      shortName: name.trim(),
      area: name.trim(),
      address: '',
      phone: '',
      pinConfirmed: false,
      qrToken: undefined,
      tables: undefined,
      bill: { title: 'TAX INVOICE', lines: [name.trim()], phones: '' },
      gstRate: 0,
    };
    setLiveOutlet(o);
    setOpenId(id);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2"><Store className="w-5 h-5 text-[#ED1C24]" /> Stores</h2>
          <p className="text-xs text-slate-500 mt-0.5">Customer orders go to the nearest open store whose delivery radius covers them.</p>
        </div>
        <button onClick={addStore} className="shrink-0 flex items-center gap-1.5 bg-slate-900 text-white px-3 py-2 rounded-xl text-xs font-black cursor-pointer">
          <Plus className="w-4 h-4" /> Add store
        </button>
      </div>

      {unconfirmed > 0 && (
        <div className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-300 p-3 text-xs text-amber-900">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            <b>{unconfirmed} store{unconfirmed === 1 ? '' : 's'}</b> still have a town-centre map pin. Open each one, paste the Google Maps link of the shop, and save — otherwise some
            customers near the edge of town may be sent to the wrong store.
          </span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
        {outlets.map((o) => {
          const open = openId === o.id;
          const live = isOutletOpen(o);
          return (
            <div key={o.id} id={`store-${o.id}`}>
              <button onClick={() => setOpenId(open ? null : o.id)} className="w-full flex items-center gap-3 px-4 py-3 text-left cursor-pointer hover:bg-slate-50">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-black text-slate-900 truncate">{o.shortName}</div>
                  <div className="text-[11px] text-slate-500 truncate">
                    {formatHour(o.opensAt)}–{formatHour(o.closesAt)} · {o.radiusKm} km · {o.gstRate ? 'GST 5%' : 'No GST'}
                    {!o.pinConfirmed && ' · pin not confirmed'}
                  </div>
                </div>
                <span
                  className={`shrink-0 text-[10px] font-black px-2 py-0.5 rounded-full ${
                    !o.active ? 'bg-slate-200 text-slate-600' : live ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {!o.active ? 'Off' : live ? 'Open now' : 'Closed now'}
                </span>
                {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>
              {open && <StoreEditor outlet={o} onDone={() => setOpenId(null)} />}
            </div>
          );
        })}
      </div>
    </div>
  );
};
