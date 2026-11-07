export interface LocationFix {
  lat: number;
  lng: number;
  /** How far off the fix may be, in metres. */
  accuracy: number;
}

// How long a customer gets to answer the browser's location popup.
const ANSWER_WAIT_MS = 60_000;

const permissionState = async (): Promise<PermissionState | 'unknown'> => {
  try {
    return (await navigator.permissions.query({ name: 'geolocation' })).state;
  } catch {
    return 'unknown';
  }
};

const read = (options: PositionOptions, waitMs: number) =>
  new Promise<LocationFix>((resolve, reject) => {
    // Some iPhone web apps never answer at all, so the wait has its own limit.
    const giveUp = window.setTimeout(() => reject(new Error('No location answer')), waitMs);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        window.clearTimeout(giveUp);
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
      },
      (err) => {
        window.clearTimeout(giveUp);
        reject(err);
      },
      options,
    );
  });

/**
 * Where this phone is right now. Never reuses an old reading.
 * The browser shows its own permission popup only if it has no answer yet.
 * GPS often times out indoors, so a network reading is the second try.
 * Resolves to null when location is refused or can't be found.
 */
export async function getFreshLocation(): Promise<LocationFix | null> {
  if (!('geolocation' in navigator)) return null;
  const permission = await permissionState();
  if (permission === 'denied') return null;
  // The browser's own timeout only starts after the popup is answered, so ours must allow for it.
  const extraWait = permission === 'granted' ? 2_000 : ANSWER_WAIT_MS;
  try {
    return await read({ enableHighAccuracy: true, timeout: 10_000, maximumAge: 0 }, 10_000 + extraWait);
  } catch (err) {
    if ((err as GeolocationPositionError)?.code === 1) return null;
  }
  try {
    return await read({ enableHighAccuracy: false, timeout: 8_000, maximumAge: 0 }, 8_000 + extraWait);
  } catch {
    return null;
  }
}

/** Calls back when the customer allows location later on, however long they took. Returns a stop function. */
export async function onLocationAllowed(callback: () => void): Promise<() => void> {
  try {
    const status = await navigator.permissions.query({ name: 'geolocation' });
    const onChange = () => {
      if (status.state === 'granted') callback();
    };
    status.addEventListener('change', onChange);
    return () => status.removeEventListener('change', onChange);
  } catch {
    return () => {};
  }
}
