import React, { useEffect, useState } from 'react';
import { MapPin, Navigation, X, Loader2, AlertCircle } from 'lucide-react';

interface LocationPromptProps {
  gpsState: 'idle' | 'locating' | 'locked' | 'denied';
  hasFix: boolean;
  onAllow: () => void;
  onDismiss: () => void;
}

/**
 * First-visit location permission card.
 * Shows once per session when there is no saved GPS fix.
 * Allow -> browser location prompt -> coords saved for outlet distance + order routing.
 */
export const LocationPrompt: React.FC<LocationPromptProps> = ({
  gpsState,
  hasFix,
  onAllow,
  onDismiss,
}) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (hasFix || gpsState === 'locked') {
      setShow(false);
      return;
    }
    const t = window.setTimeout(() => setShow(true), 1000);
    return () => window.clearTimeout(t);
  }, [hasFix, gpsState]);

  if (!show) return null;

  return (
    <div className="fixed inset-x-0 bottom-24 sm:bottom-6 z-40 px-3 sm:px-6 pointer-events-none">
      <div className="pointer-events-auto max-w-md mx-auto bg-slate-900 text-white rounded-3xl p-4 sm:p-5 shadow-2xl border border-white/10 animate-in slide-in-from-bottom duration-300">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#ED1C24] flex items-center justify-center shrink-0">
            {gpsState === 'locating' ? (
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            ) : (
              <MapPin className="w-5 h-5 text-white" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-black tracking-tight">
              {gpsState === 'denied' ? 'Location blocked' : 'Enable your location?'}
            </h3>
            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
              {gpsState === 'denied'
                ? 'Browser blocked location access. Tap the lock icon in the address bar, allow location, then retry.'
                : 'We use it for exact outlet distance, faster checkout and accurate delivery tracking.'}
            </p>
          </div>
          <button
            onClick={onDismiss}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center shrink-0 cursor-pointer"
            aria-label="Dismiss location prompt"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {gpsState === 'denied' ? (
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={onAllow}
              className="flex-1 flex items-center justify-center gap-1.5 bg-white text-slate-900 font-black px-4 py-2.5 rounded-xl text-xs cursor-pointer"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Retry Location</span>
            </button>
            <button
              onClick={onDismiss}
              className="flex-1 bg-white/10 hover:bg-white/20 font-bold px-4 py-2.5 rounded-xl text-xs cursor-pointer"
            >
              Enter Manually
            </button>
          </div>
        ) : (
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={onAllow}
              disabled={gpsState === 'locating'}
              className="flex-1 flex items-center justify-center gap-1.5 bg-[#ED1C24] hover:bg-[#c91430] disabled:opacity-70 text-white font-black px-4 py-2.5 rounded-xl text-xs cursor-pointer"
            >
              {gpsState === 'locating' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Navigation className="w-3.5 h-3.5" />
              )}
              <span>{gpsState === 'locating' ? 'Detecting…' : 'Use My Location'}</span>
            </button>
            <button
              onClick={onDismiss}
              className="bg-white/10 hover:bg-white/20 font-bold px-4 py-2.5 rounded-xl text-xs cursor-pointer"
            >
              Later
            </button>
          </div>
        )}

        {gpsState !== 'denied' && gpsState !== 'locating' && (
          <p className="mt-2 flex items-center gap-1 text-[10px] text-slate-400">
            <AlertCircle className="w-3 h-3 shrink-0" />
            <span>One tap — the browser asks once and remembers your choice.</span>
          </p>
        )}
      </div>
    </div>
  );
};
