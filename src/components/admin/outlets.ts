export interface Outlet {
  id: string;
  name: string;
  shortName: string;
  area: string;
  /** NOTE: plain-text passwords in the frontend are for demo gating only. Use Firebase Auth for real security. */
  password: string;
  lat: number;
  lng: number;
  radiusKm: number;
  phone: string;
}

export const OUTLETS: Outlet[] = [
  {
    id: 'outlet-1',
    name: '7 Cheese Pizza',
    shortName: '7 Cheese Pizza',
    area: 'Kaladhungi Road, Haldwani',
    password: 'cheese123',
    // Real store pin: 29°13'49.0"N 79°29'18.4"E (Unchapul, Kaladhungi Road)
    lat: 29.23028,
    lng: 79.488444,
    radiusKm: 8,
    phone: '+91 98765 43210',
  },
];

export function getOutletById(id: string): Outlet | undefined {
  return OUTLETS.find((o) => o.id === id);
}

function randomQrToken(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

const qrKey = (outletId: string) => `seven_cheese_outlet_qr_${outletId}`;

/** Per-outlet QR token. Har outlet ka alag, localStorage me persist. */
export function getOutletQrToken(outletId: string): string {
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

/** Purana QR invalid karke naya generate karo. */
export function regenerateOutletQrToken(outletId: string): string {
  const t = randomQrToken();
  try {
    localStorage.setItem(qrKey(outletId), t);
  } catch {
    // ignore
  }
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

/** Nearest outlet from customer lat/lng. Returns nearest + inZone:false when outside every radius. */
export function findNearestOutlet(lat: number, lng: number): NearestOutletResult {
  let best = OUTLETS[0];
  let bestDist = geoDistanceKm(lat, lng, best.lat, best.lng);
  for (const o of OUTLETS.slice(1)) {
    const d = geoDistanceKm(lat, lng, o.lat, o.lng);
    if (d < bestDist) {
      best = o;
      bestDist = d;
    }
  }
  return { outlet: best, distanceKm: Math.round(bestDist * 10) / 10, inZone: bestDist <= best.radiusKm };
}

/** Assign an outlet to an order. Falls back to default Outlet 1 when no GPS is available. */
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

export interface OutletTable {
  id: string;
  outletId: string;
  name: string;
}

const tablesKey = (outletId: string) => `seven_cheese_tables_${outletId}`;

function seedTables(outletId: string): OutletTable[] {
  return [
    { id: `${outletId}-t01`, outletId, name: 'Table T-01' },
    { id: `${outletId}-t02`, outletId, name: 'Table T-02' },
  ];
}

/** Outlet ki tables. Pehli baar 2 default tables (T-01, T-02) ke saath. */
export function getOutletTables(outletId: string): OutletTable[] {
  try {
    const saved = localStorage.getItem(tablesKey(outletId));
    if (saved) {
      const parsed = JSON.parse(saved) as OutletTable[];
      if (Array.isArray(parsed)) return parsed.filter((t) => t && t.id && t.name);
    }
  } catch {
    // ignore — seed below
  }
  const seeded = seedTables(outletId);
  try {
    localStorage.setItem(tablesKey(outletId), JSON.stringify(seeded));
  } catch {
    // ignore
  }
  return seeded;
}

export function saveOutletTables(outletId: string, tables: OutletTable[]): void {
  try {
    localStorage.setItem(tablesKey(outletId), JSON.stringify(tables));
  } catch {
    // ignore
  }
}

export function addOutletTable(outletId: string, name: string): OutletTable {
  const table: OutletTable = {
    id: `${outletId}-t${Date.now().toString(36)}`,
    outletId,
    name: name.trim(),
  };
  saveOutletTables(outletId, [...getOutletTables(outletId), table]);
  return table;
}

export function deleteOutletTable(outletId: string, tableId: string): void {
  saveOutletTables(
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
 */
export function parseTableQrParam(outletId?: string): string | null {
  try {
    const p = new URLSearchParams(window.location.search);
    const tid = p.get('table');
    if (tid && outletId && getTableById(outletId, tid)) return tid;
    return null;
  } catch {
    return null;
  }
}
