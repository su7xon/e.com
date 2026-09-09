import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  MapPin,
  Navigation,
  Search,
  X,
  Loader2,
  Home,
  Briefcase,
  Compass,
  AlertCircle,
  Building,
  CheckCircle2,
  Crosshair,
  ExternalLink,
} from 'lucide-react';
import { UserAddress } from '../types';

interface InteractiveMapPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAddress: (addr: UserAddress) => void;
  currentAddress?: UserAddress;
}

interface GeocodeResult {
  display_name: string;
  lat: string;
  lon: string;
}

export const InteractiveMapPicker: React.FC<InteractiveMapPickerProps> = ({
  isOpen,
  onClose,
  onSelectAddress,
  currentAddress,
}) => {
  const defaultLat = currentAddress?.lat || 29.2183;
  const defaultLng = currentAddress?.lng || 79.5130;

  const [coords, setCoords] = useState({ lat: defaultLat, lng: defaultLng });
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'locating' | 'locked' | 'denied' | 'fallback'>('idle');

  const [isLocating, setIsLocating] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const [label, setLabel] = useState<'Home' | 'Work' | 'Other'>('Home');
  const [houseNo, setHouseNo] = useState('');
  const [roadArea, setRoadArea] = useState(currentAddress?.address || '');
  const [city, setCity] = useState(currentAddress?.city || 'Haldwani');
  const [pincode, setPincode] = useState(currentAddress?.pincode || '263139');
  const [landmark, setLandmark] = useState(currentAddress?.landmark || '');

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodeResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const watchIdRef = useRef<number | null>(null);
  const geocodeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ---- Reverse geocode: BigDataCloud (free, no key, CORS ok) -> Nominatim fallback ----
  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    setIsGeocoding(true);
    try {
      const bdc = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
      );
      if (bdc.ok) {
        const d = await bdc.json();
        const street =
          [d.plusCode?.slice(0, 8), d.locality || d.city, d.principalSubdivision]
            .filter(Boolean)
            .join(', ') || '';
        if (d.city || d.locality || d.principalSubdivision) {
          setRoadArea(street || d.locality || 'Pinpointed Location');
          setCity(d.city || d.locality || 'Haldwani');
          setPincode(d.postcode || '263139');
          setIsGeocoding(false);
          return;
        }
      }
      throw new Error('bdc-empty');
    } catch {
      // fallback: Nominatim
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
          { headers: { 'Accept-Language': 'en' } }
        );
        if (!res.ok) throw new Error('nominatim-fail');
        const data = await res.json();
        if (data?.address) {
          const a = data.address;
          const street = [a.house_number, a.road, a.neighbourhood || a.suburb]
            .filter(Boolean)
            .join(', ');
          setRoadArea(street || data.display_name.split(',').slice(0, 2).join(', ') || 'Pinpointed Location');
          setCity(a.city || a.town || a.village || a.county || 'Haldwani');
          setPincode(a.postcode || '263139');
        } else if (data?.display_name) {
          const parts = data.display_name.split(', ');
          setRoadArea(parts.slice(0, 2).join(', '));
          if (parts.length > 2) setCity(parts[2]);
        }
      } catch {
        setRoadArea(`Near ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      } finally {
        setIsGeocoding(false);
      }
    }
  }, []);

  const scheduleReverseGeocode = useCallback(
    (lat: number, lng: number) => {
      if (geocodeTimer.current) clearTimeout(geocodeTimer.current);
      geocodeTimer.current = setTimeout(() => reverseGeocode(lat, lng), 600);
    },
    [reverseGeocode]
  );

  // ---- Exact GPS detection ----
  const handleDetectGPS = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      setGpsStatus('fallback');
      return;
    }
    setIsLocating(true);
    setGpsStatus('locating');
    setLocationError(null);

    // Stop any previous watch
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    // Use watchPosition briefly to get best-accuracy fix, then stop
    let bestAccuracy = Infinity;
    let gotFix = false;

    const onSuccess = (pos: GeolocationPosition) => {
      const { latitude, longitude, accuracy: acc } = pos.coords;
      if (acc < bestAccuracy) {
        bestAccuracy = acc;
        setCoords({ lat: latitude, lng: longitude });
        setAccuracy(Math.round(acc));
        gotFix = true;
        scheduleReverseGeocode(latitude, longitude);
      }
      // Good enough (<30m) -> stop early
      if (acc <= 30) stopWatch(true);
    };

    const onError = (err: GeolocationPositionError) => {
      // If we already got a fix, keep it
      if (gotFix) {
        stopWatch(true);
        return;
      }
      setIsLocating(false);
      setGpsStatus('denied');
      setLocationError(
        err.code === 1
          ? 'Location permission denied. Browser settings me location Allow karo, phir retry dabao.'
          : 'Exact location nahi mili. HTTPS + location ON karke retry karo, ya search se area chuno.'
      );
      stopWatch(false);
    };

    const stopWatch = (locked: boolean) => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setIsLocating(false);
      setGpsStatus(locked ? 'locked' : 'fallback');
    };

    watchIdRef.current = navigator.geolocation.watchPosition(onSuccess, onError, {
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 0,
    });

    // Safety stop after 12s
    setTimeout(() => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
        setIsLocating(false);
        setGpsStatus(gotFix ? 'locked' : 'fallback');
        if (!gotFix) {
          setLocationError('GPS fix slow hai. Khule aasmaan ke paas jao ya search use karo.');
        }
      }
    }, 12000);
  }, [scheduleReverseGeocode]);

  // Auto-detect exact location when modal opens
  useEffect(() => {
    if (!isOpen) return;
    // If saved lat/lng exists, reverse geocode it; else auto GPS
    if (currentAddress?.lat && currentAddress?.lng) {
      setCoords({ lat: currentAddress.lat, lng: currentAddress.lng });
      setGpsStatus('locked');
      reverseGeocode(currentAddress.lat, currentAddress.lng);
    } else {
      handleDetectGPS();
    }
    return () => {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (geocodeTimer.current) clearTimeout(geocodeTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // ---- Search ----
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchResults([]);
    setLocationError(null);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=4&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data: GeocodeResult[] = await res.json();
      if (data.length === 0) setLocationError('Kuch nahi mila. Area / landmark alag naam se try karo.');
      setSearchResults(data);
    } catch {
      setLocationError('Search fail ho gaya. Dobara try karo.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = (r: GeocodeResult) => {
    const lat = parseFloat(r.lat);
    const lng = parseFloat(r.lon);
    setCoords({ lat, lng });
    setAccuracy(null);
    setGpsStatus('fallback');
    reverseGeocode(lat, lng);
    setSearchResults([]);
    setSearchQuery('');
  };

  // Manual fine-tune (pin nudge ~10m)
  const nudge = (dLat: number, dLng: number) => {
    const next = { lat: coords.lat + dLat, lng: coords.lng + dLng };
    setCoords(next);
    setGpsStatus('fallback');
    scheduleReverseGeocode(next.lat, next.lng);
  };

  const handleConfirmLocation = (e: React.FormEvent) => {
    e.preventDefault();
    const fullStreet = houseNo.trim() ? `${houseNo.trim()}, ${roadArea}` : roadArea;
    const newAddress: UserAddress = {
      id: `addr-${Date.now()}`,
      label,
      address: fullStreet || `GPS ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`,
      city: city.trim() || 'Haldwani',
      pincode: pincode.trim() || '263139',
      landmark: landmark.trim() || undefined,
      distanceKm: 2.3,
      lat: coords.lat,
      lng: coords.lng,
    };
    onSelectAddress(newAddress);
    onClose();
  };

  if (!isOpen) return null;

  // No-JS-lib map preview: Google embed (no API key) pinned on exact coords
  const mapEmbedSrc = `https://maps.google.com/maps?q=${coords.lat},${coords.lng}&z=18&output=embed`;
  const gmapsLink = `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div
        id="modal-interactive-map"
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] h-[680px] border border-slate-200 animate-in zoom-in-95 duration-200 relative"
      >
        {/* Header */}
        <div className="bg-[#005580] text-white px-4 py-3 flex items-center justify-between shadow-md shrink-0 z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center">
              <Compass className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black tracking-tight leading-tight">
                Select Exact Delivery Location
              </h2>
              <span className="text-[11px] text-blue-200 font-medium">
                GPS se exact pin aayega • checkout me yahi address use hoga
              </span>
            </div>
          </div>
          <button
            id="btn-close-map-picker"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="p-3 bg-white/95 border-b border-slate-100 shrink-0 z-10">
          <form onSubmit={handleSearchSubmit} className="relative flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="input-map-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search area, landmark ya society..."
                className="w-full pl-9 pr-3 py-2 bg-slate-100 hover:bg-slate-50 focus:bg-white text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-[#005580] transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={isSearching || !searchQuery.trim()}
              className="bg-[#005580] hover:bg-[#003d5c] disabled:opacity-50 text-white text-xs font-black px-4 py-2 rounded-xl transition-colors shrink-0 cursor-pointer flex items-center gap-1.5"
            >
              {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Search</span>}
            </button>
          </form>

          {searchResults.length > 0 && (
            <div className="mt-2 bg-white rounded-xl shadow-xl border border-slate-200 divide-y divide-slate-100 max-h-48 overflow-y-auto">
              {searchResults.map((result, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectSearchResult(result)}
                  className="w-full text-left p-2.5 hover:bg-blue-50 transition-colors flex items-start gap-2 text-xs"
                >
                  <MapPin className="w-4 h-4 text-[#ED1C24] shrink-0 mt-0.5" />
                  <span className="text-slate-800 line-clamp-2 leading-snug">{result.display_name}</span>
                </button>
              ))}
            </div>
          )}

          {locationError && (
            <div className="mt-2 bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-1.5 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{locationError}</span>
            </div>
          )}
        </div>

        {/* Map viewport — exact GPS pin, no Leaflet */}
        <div className="relative flex-1 w-full bg-slate-100 min-h-[220px]">
          <iframe
            title="exact-location-map"
            src={mapEmbedSrc}
            className="w-full h-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer"
          />

          {/* GPS status pill */}
          <div className="absolute top-3 left-3 z-10">
            <div
              className={`text-[10px] font-black px-2.5 py-1.5 rounded-full shadow-lg backdrop-blur-xs flex items-center gap-1.5 border ${
                gpsStatus === 'locked'
                  ? 'bg-emerald-600 text-white border-emerald-500'
                  : gpsStatus === 'locating'
                    ? 'bg-amber-500 text-slate-950 border-amber-400'
                    : 'bg-slate-900/90 text-white border-white/20'
              }`}
            >
              {gpsStatus === 'locating' ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Exact GPS dhoondh rahe...</span>
                </>
              ) : gpsStatus === 'locked' ? (
                <>
                  <Crosshair className="w-3 h-3" />
                  <span>Exact location locked{accuracy !== null ? ` • ±${accuracy}m` : ''}</span>
                </>
              ) : (
                <>
                  <MapPin className="w-3 h-3" />
                  <span>
                    {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                  </span>
                </>
              )}
            </div>
            {isGeocoding && (
              <div className="mt-1.5 bg-slate-900/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1.5 w-fit">
                <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
                <span>Address pehchan rahe...</span>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
            <button
              id="btn-detect-gps"
              type="button"
              onClick={handleDetectGPS}
              disabled={isLocating}
              className="bg-white hover:bg-slate-50 active:scale-95 text-[#005580] p-2.5 rounded-2xl shadow-xl border border-slate-200/80 flex items-center gap-2 text-xs font-black transition-all cursor-pointer"
            >
              <Navigation className={`w-4 h-4 text-[#ED1C24] ${isLocating ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isLocating ? 'GPS lock...' : 'Use My Exact Location'}</span>
            </button>
            <a
              href={gmapsLink}
              target="_blank"
              rel="noreferrer"
              className="bg-white hover:bg-slate-50 text-slate-700 p-2 rounded-2xl shadow-xl border border-slate-200/80 flex items-center justify-center gap-1 text-[10px] font-bold"
            >
              <ExternalLink className="w-3 h-3" />
              <span className="hidden sm:inline">Verify in Google Maps</span>
            </a>
          </div>

          {/* Fine-tune pin (Leaflet drag ka replacement) */}
          <div className="absolute bottom-3 left-3 z-10 bg-white/95 backdrop-blur rounded-2xl shadow-xl border border-slate-200 p-2">
            <p className="text-[9px] font-black uppercase tracking-wider text-slate-500 px-1 pb-1">
              Pin fine-tune
            </p>
            <div className="grid grid-cols-3 gap-1 w-24">
              <span />
              <button type="button" onClick={() => nudge(0.0001, 0)} className="bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-black py-1 cursor-pointer">↑</button>
              <span />
              <button type="button" onClick={() => nudge(0, -0.0001)} className="bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-black py-1 cursor-pointer">←</button>
              <button type="button" onClick={() => nudge(0, 0.0001)} className="bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-black py-1 cursor-pointer">→</button>
              <span />
              <button type="button" onClick={() => nudge(-0.0001, 0)} className="bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-black py-1 cursor-pointer">↓</button>
              <span />
            </div>
          </div>
        </div>

        {/* Bottom confirm form */}
        <div className="p-3.5 sm:p-4 bg-white border-t border-slate-200 shrink-0 z-10 space-y-3">
          <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-blue-50/80 border border-blue-200/80">
            <MapPin className="w-4 h-4 text-[#005580] shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-900 block">
                Selected Landmark / Area
              </span>
              <p className="text-xs font-extrabold text-slate-900 truncate">{roadArea || 'Locating...'}</p>
              <p className="text-[11px] text-slate-600 font-medium">
                {city} - {pincode}
              </p>
            </div>
          </div>

          <form onSubmit={handleConfirmLocation} className="space-y-2.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-0.5">
                  House / Flat / Floor No. *
                </label>
                <input
                  id="input-map-house"
                  type="text"
                  required
                  value={houseNo}
                  onChange={(e) => setHouseNo(e.target.value)}
                  placeholder="e.g. Flat 302, Royal Residency"
                  className="w-full bg-slate-100 text-xs px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#005580]"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-0.5">
                  Nearby Landmark (Optional)
                </label>
                <input
                  id="input-map-landmark"
                  type="text"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder="e.g. Near Big Bazaar, Gate No 2"
                  className="w-full bg-slate-100 text-xs px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#005580]"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-1.5">
                {(['Home', 'Work', 'Other'] as const).map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setLabel(tag)}
                    className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
                      label === tag ? 'bg-[#005580] text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {tag === 'Home' ? <Home className="w-3 h-3" /> : tag === 'Work' ? <Briefcase className="w-3 h-3" /> : <Building className="w-3 h-3" />}
                    <span>{tag}</span>
                  </button>
                ))}
              </div>
              <button
                type="submit"
                id="btn-confirm-map-address"
                disabled={isGeocoding}
                className="bg-[#ED1C24] hover:bg-[#c91430] active:scale-95 text-white text-xs sm:text-sm font-black px-5 py-2.5 rounded-xl shadow-lg shadow-red-900/20 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                <span>Confirm & Deliver Here</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
