import { useMemo, useSyncExternalStore } from 'react';
import { patchOutletInFirestore } from '../../lib/firebase';

export interface OutletTable {
  id: string;
  outletId: string;
  name: string;
}

export interface Outlet {
  id: string;
  /** Brand name printed on bills. */
  name: string;
  /** Store name staff and customers see, e.g. "Raipur, Dehradun". */
  shortName: string;
  /** One-line locality for headers. */
  area: string;
  /** Full postal address (bill header, store details). */
  address: string;
  phone: string;
  lat: number;
  lng: number;
  /** Delivery radius around the store pin. */
  radiusKm: number;
  /** 24h "HH:MM". */
  opensAt: string;
  closesAt: string;
  /** false = store switched off by the owner (no orders routed to it). */
  active: boolean;
  /** false until the owner checks the map pin (seeded from the town, not the shop door). */
  pinConfirmed: boolean;
  /** Counter QR token; changing it retires printed QR codes. */
  qrToken?: string;
  tables?: OutletTable[];
  /** Bill header as this store prints it today. */
  bill: BillHeader;
  /** GST charged on items at this store: 0.05 (5% = 2.5% CGST + 2.5% SGST) or 0. */
  gstRate: number;
}

export interface BillHeader {
  /** "TAX INVOICE", "BILL OF SUPPLY", "BILL" */
  title: string;
  /** e.g. "(Under Composition)" */
  subtitle?: string;
  /** Address lines under the brand name. */
  lines: string[];
  /** "9927999447, 9927999448" */
  phones: string;
  gstin?: string;
  fssai?: string;
}

const store = (
  id: string,
  shortName: string,
  area: string,
  address: string,
  phone: string,
  lat: number,
  lng: number,
  bill: BillHeader,
  gstRate = 0,
  pinConfirmed = false,
): Outlet => ({
  id,
  name: '7 Cheese Pizza',
  shortName,
  area,
  address,
  phone,
  lat,
  lng,
  radiusKm: 8,
  opensAt: '10:00',
  closesAt: '22:00',
  active: true,
  pinConfirmed,
  bill,
  gstRate,
});

const TAX_INVOICE = 'TAX INVOICE';

/**
 * The 12 stores from 7cheesepizza.com/store-locator; bill headers and GST copied from each
 * store's own printed bill (Oct 2026). Unchapul keeps the id `outlet-1` so old orders and printed
 * QR codes keep working. Other pins are town-level until the owner confirms them.
 */
export const SEED_OUTLETS: Outlet[] = [
  // Real store pin: 29°13'49.0"N 79°29'18.4"E (Unchapul, Kaladhungi Road)
  store('outlet-1', 'Unchapul, Haldwani', 'Kaladhungi Road, Haldwani', 'Kaladhungi Rd, Shiv Puram Phase-I, Unchapul, Haldwani, Uttarakhand 263139', '+91 79004 77999', 29.23028, 79.488444,
    { title: TAX_INVOICE, lines: ['Unchapul, Near TVS Showroom,', 'Haldwani, Uttarakhand'], phones: '7900477999, 7900577999' }, 0, true),
  store('raipur-dehradun', 'Raipur, Dehradun', 'Raipur Main Chowk, Dehradun', 'Raipur Main Chowk, opp. Axis Bank, Raipur, Dehradun, Uttarakhand 248008', '+91 88590 06003', 30.30995, 78.09491,
    { title: TAX_INVOICE, lines: ['Raipur Main Chowk, Opposite Axis Bank,', 'Dehradun'], phones: '8859006004, 8859006003', gstin: '05FVRPS1331D2ZJ', fssai: '22622024000526' }, 0.05),
  store('bhaniawala', 'Bhaniawala, Rishikesh Rd', 'Jolly Grant, Rishikesh Road', 'Rishikesh Rd, near Durga Chowk, Jolly Grant, Dehradun, Uttarakhand 248140', '+91 80067 11333', 30.18638, 78.1485,
    { title: TAX_INVOICE, lines: ['Rishikesh Road, Near Durga Chok,', 'Jolly Grant, Dehradun-248140'], phones: '8006711333, 8006711444', gstin: '05FVRPS1331D4ZH', fssai: '22621028000426' }, 0.05),
  store('uttarkashi', 'Uttarkashi', 'Joshiyara, Uttarkashi', 'Ward no 8, near Punjab & Sind Bank, Joshiyara, Uttarkashi, Uttarakhand 249193', '+91 99279 99447', 30.73256, 78.42473,
    { title: TAX_INVOICE, lines: ['Joshiyara, Ward No. 8,', 'Near Punjab Sindh Bank, Uttarkashi'], phones: '9927999447, 9927999448' }),
  store('dineshpur', 'Dineshpur', 'Kalinagar Road, Dineshpur', 'Kalinagar Road, in front of Krishna Sweets, Main Chauraha, Dineshpur, Uttarakhand 263160', '+91 80067 00333', 29.04957, 79.32193,
    { title: TAX_INVOICE, lines: ['Kalinagar Road, In Front of Krishna Sweets,', 'Main Chouraha, Dineshpur-263160'], phones: '8006700333, 8006700444' }),
  store('kaladhungi', 'Kaladhungi, Nainital', 'Barhani Range, Kaladhungi', 'In front of Smart Store, Kaladhungi, Barhani Range, Uttarakhand 263140', '+91 72488 72588', 29.28463, 79.34726,
    { title: 'BILL', lines: ['In Front Of Smart Store,', 'Kaladhungi-263140'], phones: '7248872588' }),
  store('new-tehri-baurari', 'Baurari, New Tehri', 'Sai Chowk, Baurari', 'Near Axis Bank, Sai Chowk, Baurari, New Tehri, Uttarakhand 249001', '+91 70555 11181', 30.38216, 78.43988,
    { title: TAX_INVOICE, lines: ['Near Axis Bank, Sai Chowk, Baurari,', 'Tehri-249001'], phones: '7055511181, 7055511182', gstin: '05ESFPS6376L2ZY', fssai: '22622061000235' }, 0.05),
  store('chamba-tehri', 'Chamba, Tehri', 'Mussoorie Road, Chamba', 'Near HDFC Bank, Mussoorie Road, Chamba, Tehri Garhwal, Uttarakhand', '+91 70888 44498', 30.34561, 78.39432,
    { title: TAX_INVOICE, lines: ['Near HDFC Bank, Mussoorie Road, Chamba'], phones: '7088844497, 7088844498', gstin: '05HAGPS4828K1Z5', fssai: '22623061000097' }, 0.05),
  store('srinagar', 'Srinagar, Garhwal', 'Badrinath Highway, Srinagar', 'Badrinath Highway, opposite Prachi Hotel, near University Gate, Srinagar, Uttarakhand 246174', '+91 70555 00091', 30.22313, 78.78995,
    { title: 'BILL OF SUPPLY', subtitle: '(Under Composition)', lines: ['Badrinath Highway, Opposite Prachi Hotel,', 'Near University Gate, Srinagar'], phones: '7055500091, 7055500092', gstin: '05GWXPS5505P1ZE', fssai: '22624049000042' }),
  store('gadarpur', 'Gadarpur', 'Near Gurudwara, Gadarpur', 'Near Gurudwara, opp. Nanak Sweets, Gadarpur (U.S. Nagar), Uttarakhand', '+91 80067 00550', 29.04236, 79.24851,
    { title: TAX_INVOICE, lines: ['Near Gurudwara, Opp. Nanak Sweets,', 'Gadarpur (U.S. Nagar), Uttarakhand'], phones: '8006700550' }),
  store('gopeshwar', 'Gopeshwar', 'Near PG College, Gopeshwar', 'Opposite PG College, Ghursal, Gopeshwar, Uttarakhand 246401', '+91 91000 07378', 30.40878, 79.31855,
    { title: TAX_INVOICE, lines: ['NEAR PG COLLEGE, GOPESHWAR', 'UTTARAKHAND'], phones: '9100007378, 9100007379', gstin: '05AAEFZ5307M1ZW' }, 0.05),
  store('pauri', 'Pauri', 'Upper Market, Pauri', 'Kalyan Bhawan, Upper Market, near Ramleela Ground, Pauri, Uttarakhand 246001', '+91 86790 07157', 30.06523, 78.73157,
    { title: TAX_INVOICE, lines: ['Kalyan Bhawan, Upper Market,', 'Near Ramleela Ground, Pauri'], phones: '8679007157, 8679007158' }),
];

// ---------- Live store list (Firestore `outlets`, cached on the device) ----------

const CACHE_KEY = 'seven_cheese_outlets';

/** Fill fields an older / partial doc may be missing from the seed (or sensible defaults). */
function withDefaults(o: Partial<Outlet> & { id: string }): Outlet {
  const seed = SEED_OUTLETS.find((s) => s.id === o.id);
  const base =
    seed ??
    store(o.id, o.shortName || o.id, o.area || '', o.address || '', o.phone || '', o.lat ?? 0, o.lng ?? 0, {
      title: TAX_INVOICE,
      lines: [o.area || ''],
      phones: (o.phone || '').replace('+91 ', '').replace(/ /g, ''),
    });
  return { ...base, ...o } as Outlet;
}

function readCache(): Outlet[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Outlet[]) : null;
    return Array.isArray(parsed) && parsed.length ? parsed.map(withDefaults) : null;
  } catch {
    return null;
  }
}

/** Every store, live. Mutated in place so plain lookups (getOutletById…) always see the latest list. */
export const OUTLETS: Outlet[] = readCache() ?? SEED_OUTLETS.map((o) => ({ ...o }));

let version = 0;
const listeners = new Set<() => void>();

/** Replace the store list (from Firestore). An empty list keeps the seed. */
export function setLiveOutlets(list: Outlet[]): void {
  const next = list.length ? list.map(withDefaults) : SEED_OUTLETS.map((o) => ({ ...o }));
  next.sort((a, b) => SEED_OUTLETS.findIndex((s) => s.id === a.id) - SEED_OUTLETS.findIndex((s) => s.id === b.id));
  OUTLETS.splice(0, OUTLETS.length, ...next);
  version++;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(OUTLETS));
  } catch {
    // ignore
  }
  listeners.forEach((l) => l());
}

/** Update one store locally right away (Firestore echo follows). */
export function setLiveOutlet(outlet: Outlet): void {
  const i = OUTLETS.findIndex((o) => o.id === outlet.id);
  setLiveOutlets(i >= 0 ? OUTLETS.map((o) => (o.id === outlet.id ? outlet : o)) : [...OUTLETS, outlet]);
}

/** Re-renders when the store list changes (new array each change, so it works as an effect dependency). */
export function useOutlets(): Outlet[] {
  const v = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => version,
  );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => OUTLETS.slice(), [v]);
}

export function getOutletById(id: string): Outlet | undefined {
  return OUTLETS.find((o) => o.id === id);
}

export const activeOutlets = () => OUTLETS.filter((o) => o.active !== false);

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

/** Open right now (switched on and inside opening hours). */
export function isOutletOpen(outlet: Outlet, now: Date = new Date()): boolean {
  if (outlet.active === false) return false;
  const cur = now.getHours() * 60 + now.getMinutes();
  const open = toMinutes(outlet.opensAt || '00:00');
  const close = toMinutes(outlet.closesAt || '24:00');
  return close > open ? cur >= open && cur < close : cur >= open || cur < close;
}

/** "10 AM" / "10:30 PM" */
export function formatHour(hhmm: string): string {
  const mins = toMinutes(hhmm);
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  const h12 = h % 12 || 12;
  return `${h12}${m ? ':' + String(m).padStart(2, '0') : ''} ${h < 12 ? 'AM' : 'PM'}`;
}

// ---------- QR codes ----------

function randomQrToken(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

const qrKey = (outletId: string) => `seven_cheese_outlet_qr_${outletId}`;

/** Counter QR token: the store's (shared by every device), else this device's older one. */
export function getOutletQrToken(outletId: string): string {
  const shared = getOutletById(outletId)?.qrToken;
  if (shared) return shared;
  try {
    const saved = localStorage.getItem(qrKey(outletId));
    if (saved && saved.trim()) return saved;
  } catch {
    // ignore
  }
  const t = randomQrToken();
  try {
    localStorage.setItem(qrKey(outletId), t);
  } catch {
    // ignore
  }
  return t;
}

/** New counter QR for the store (old printed codes stop matching). Saved for every device. */
export async function regenerateOutletQrToken(outletId: string): Promise<string> {
  const t = randomQrToken();
  const o = getOutletById(outletId);
  if (o) setLiveOutlet({ ...o, qrToken: t });
  await patchOutletInFirestore(outletId, { qrToken: t });
  return t;
}

/** Customer scan URL — always the store root (/), never /admin, so scanning opens the menu, not the admin panel. */
export function getOutletQrUrl(outletId: string, token?: string): string {
  const t = token ?? getOutletQrToken(outletId);
  const base = typeof window !== 'undefined' ? window.location.origin + '/' : '/';
  return `${base}?outlet=${encodeURIComponent(outletId)}&qrt=${encodeURIComponent(t)}`;
}

/** URL (?outlet=outlet-1) se outlet lock padho. Galat id pe null. */
export function parseOutletQrParam(): string | null {
  try {
    const p = new URLSearchParams(window.location.search);
    const oid = p.get('outlet');
    if (oid && getOutletById(oid)) return oid;
    const stored = localStorage.getItem('seven_cheese_qr_outlet');
    if (stored && getOutletById(stored)) return stored;
    return null;
  } catch {
    return null;
  }
}

/** Haversine distance (km) between two geo points */
export function geoDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return 2 * R * Math.asin(Math.sqrt(a));
}

export interface NearestOutletResult {
  outlet: Outlet;
  distanceKm: number;
  inZone: boolean;
}

/** Nearest switched-on store from customer lat/lng. inZone:false when outside its delivery radius. */
export function findNearestOutlet(lat: number, lng: number): NearestOutletResult {
  const list = activeOutlets().length ? activeOutlets() : OUTLETS;
  let best = list[0];
  let bestDist = geoDistanceKm(lat, lng, best.lat, best.lng);
  for (const o of list.slice(1)) {
    const d = geoDistanceKm(lat, lng, o.lat, o.lng);
    if (d < bestDist) {
      best = o;
      bestDist = d;
    }
  }
  return { outlet: best, distanceKm: Math.round(bestDist * 10) / 10, inZone: bestDist <= best.radiusKm };
}

/**
 * The store that delivers to this point: the nearest open store whose delivery radius covers it,
 * else the nearest in-radius store (closed for now). inZone:false = no store delivers here.
 */
export function findDeliveryOutlet(lat: number, lng: number, now: Date = new Date()): NearestOutletResult {
  const covering = activeOutlets()
    .map((outlet) => ({ outlet, km: geoDistanceKm(lat, lng, outlet.lat, outlet.lng) }))
    .filter((s) => s.km <= s.outlet.radiusKm)
    .sort((a, b) => a.km - b.km);
  const best = covering.find((s) => isOutletOpen(s.outlet, now)) ?? covering[0];
  if (!best) return findNearestOutlet(lat, lng);
  return { outlet: best.outlet, distanceKm: Math.round(best.km * 10) / 10, inZone: true };
}

/** Assign an outlet to an order. Falls back to the first store when no GPS is available. */
export function resolveOutletForOrder(lat?: number, lng?: number): NearestOutletResult {
  if (typeof lat === 'number' && typeof lng === 'number') {
    return findNearestOutlet(lat, lng);
  }
  return { outlet: OUTLETS[0], distanceKm: 0, inZone: true };
}

/** QR lock clear karo (customer dusre outlet ka menu dekhna chahe to). */
export function clearOutletQrLock(): void {
  try {
    localStorage.removeItem('seven_cheese_qr_outlet');
    localStorage.removeItem('seven_cheese_qr_table');
  } catch {
    // ignore
  }
  try {
    const url = new URL(window.location.href);
    url.searchParams.delete('outlet');
    url.searchParams.delete('qrt');
    url.searchParams.delete('table');
    window.history.replaceState({}, '', url.toString());
  } catch {
    // ignore
  }
}

// ---------- Tables: har table ka apna QR, scan = ussi table ke naam pe order ----------

const legacyTablesKey = (outletId: string) => `seven_cheese_tables_${outletId}`;

function seedTables(outletId: string): OutletTable[] {
  return [
    { id: `${outletId}-t01`, outletId, name: 'Table T-01' },
    { id: `${outletId}-t02`, outletId, name: 'Table T-02' },
  ];
}

/** Store's tables: saved on the store (every device), else this device's older list, else T-01 / T-02. */
export function getOutletTables(outletId: string): OutletTable[] {
  const shared = getOutletById(outletId)?.tables;
  if (Array.isArray(shared)) return shared.filter((t) => t && t.id && t.name);
  try {
    const saved = localStorage.getItem(legacyTablesKey(outletId));
    if (saved) {
      const parsed = JSON.parse(saved) as OutletTable[];
      if (Array.isArray(parsed)) return parsed.filter((t) => t && t.id && t.name);
    }
  } catch {
    // ignore — seed below
  }
  return seedTables(outletId);
}

/** Save the store's tables for every device. Resolves false when the save was refused (offline / no permission). */
export async function saveOutletTables(outletId: string, tables: OutletTable[]): Promise<boolean> {
  const o = getOutletById(outletId);
  if (o) setLiveOutlet({ ...o, tables });
  try {
    await patchOutletInFirestore(outletId, { tables });
    return true;
  } catch {
    return false;
  }
}

/** Add a table. `saved: false` means it could not be saved for other devices — caller must tell the user. */
export async function addOutletTable(outletId: string, name: string): Promise<{ table: OutletTable; saved: boolean }> {
  const table: OutletTable = {
    id: `${outletId}-t${Date.now().toString(36)}`,
    outletId,
    name: name.trim(),
  };
  const saved = await saveOutletTables(outletId, [...getOutletTables(outletId), table]);
  return { table, saved };
}

/** Remove a table. Resolves false when the save failed. */
export function deleteOutletTable(outletId: string, tableId: string): Promise<boolean> {
  return saveOutletTables(
    outletId,
    getOutletTables(outletId).filter((t) => t.id !== tableId)
  );
}

export function getTableById(outletId: string, tableId: string): OutletTable | undefined {
  return getOutletTables(outletId).find((t) => t.id === tableId);
}

/** Table QR link — always the store root (/). Scanning opens the menu locked to this outlet + table, never the admin panel. */
export function getTableQrUrl(outletId: string, tableId: string, token?: string): string {
  const t = token ?? getOutletQrToken(outletId);
  const base = typeof window !== 'undefined' ? window.location.origin + '/' : '/';
  return `${base}?outlet=${encodeURIComponent(outletId)}&qrt=${encodeURIComponent(t)}&table=${encodeURIComponent(tableId)}`;
}

/**
 * Table lock — URL (?table=...) only, i.e. a fresh QR scan.
 * Never from stale localStorage, otherwise a normal visit days later
 * would still be stuck in dine-in mode with the address pill hidden.
 * Accepts the store's own table-id format even before the live table list has loaded.
 */
export function parseTableQrParam(outletId?: string): string | null {
  try {
    const p = new URLSearchParams(window.location.search);
    const tid = p.get('table');
    if (tid && outletId && (getTableById(outletId, tid) || tid.startsWith(`${outletId}-t`))) return tid;
    return null;
  } catch {
    return null;
  }
}
