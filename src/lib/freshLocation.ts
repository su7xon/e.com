export interface LocationFix {
  lat: number;
  lng: number;
  /** How far off the fix may be, in metres. */
  accuracy: number;
}

const read = (options: PositionOptions) =>
  new Promise<LocationFix>((resolve, reject) => {
    // Some iPhone web apps never answer at all, so the wait has its own limit.
    const giveUp = window.setTimeout(() => reject(new Error('No location answer')), (options.timeout ?? 0) + 2_000);
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
  try {
    return await read({ enableHighAccuracy: true, timeout: 10_000, maximumAge: 0 });
  } catch (err) {
    if ((err as GeolocationPositionError)?.code === 1) return null;
  }
  try {
    return await read({ enableHighAccuracy: false, timeout: 8_000, maximumAge: 0 });
  } catch {
    return null;
  }
}
