export interface GeocodedAddress {
  address: string;
  city: string;
  pincode: string;
}

/**
 * Turn coordinates into a readable address.
 * Nominatim first (street / area names), BigDataCloud as fallback (locality only), then plain coordinates.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<GeocodedAddress> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      { headers: { 'Accept-Language': 'en' } },
    );
    if (res.ok) {
      const data = await res.json();
      if (data?.address) {
        const a = data.address;
        const street = [a.house_number, a.road, a.neighbourhood || a.suburb || a.residential].filter(Boolean).join(', ');
        if (street) {
          return {
            address: street,
            city: a.city || a.town || a.village || a.county || 'Haldwani',
            pincode: a.postcode || '263139',
          };
        }
      }
    }
  } catch {
    // fall through to BigDataCloud
  }
  try {
    const bdc = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
    );
    if (bdc.ok) {
      const d = await bdc.json();
      if (d.locality || d.city) {
        return {
          address: d.locality || d.city,
          city: d.city || d.locality || 'Haldwani',
          pincode: d.postcode || '263139',
        };
      }
    }
  } catch {
    // fall through
  }
  return { address: `Near ${lat.toFixed(5)}, ${lng.toFixed(5)}`, city: 'Haldwani', pincode: '263139' };
}
