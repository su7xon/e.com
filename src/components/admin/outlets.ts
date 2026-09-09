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
    name: '7 Cheese Pizza — Outlet 1',
    shortName: 'Outlet 1',
    area: 'Kaladhungi Road, Haldwani',
    password: 'cheese123',
    lat: 29.2139,
    lng: 79.5279,
    radiusKm: 8,
    phone: '+91 98765 43210',
  },
  {
    id: 'outlet-2',
    name: '7 Cheese Pizza — Outlet 2',
    shortName: 'Outlet 2',
    area: 'Mukhani, Haldwani',
    password: 'cheese456',
    lat: 29.205,
    lng: 79.512,
    radiusKm: 8,
    phone: '+91 98765 43211',
  },
];

export function getOutletById(id: string): Outlet | undefined {
  return OUTLETS.find((o) => o.id === id);
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
