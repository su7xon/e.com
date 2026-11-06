import React from 'react';
import { MapPin, Loader2 } from 'lucide-react';

interface LocationPromptProps {
  gpsState: 'idle' | 'locating' | 'locked' | 'denied';
  hasFix: boolean;
  hasCart?: boolean;
  onAllow: () => void;
  onDismiss: () => void;
}

/**
 * First-screen location gate (Domino's style): centered dialog over a dimmed page.
 * Allow -> browser location prompt -> coords saved for outlet distance + order routing.
 * Ask Later -> menu loads with the default outlet; the header badge can still detect location.
 * NOTE: hasCart kept for compat — centered dialog needs no bottom offset, so no overlap.
 */
export const LocationPrompt: React.FC<LocationPromptProps> = ({
  gpsState,
  hasFix,
  onAllow,
  onDismiss,
}) => {
  if (hasFix || gpsState === 'locked') return null;

  const denied = gpsState === 'denied';
  const locating = gpsState === 'locating';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="loc-gate-title"
        className="w-full max-w-xs bg-white text-slate-800 rounded-md shadow-2xl p-5 text-center animate-in zoom-in-95 duration-200"
      >
        {locating ? (
          <Loader2 className="w-5 h-5 text-[#ED1C24] mx-auto animate-spin" />
        ) : (
          <MapPin className="w-5 h-5 text-[#ED1C24] mx-auto" />
        )}
        <h3 id="loc-gate-title" className="mt-3 text-sm leading-relaxed">
          {denied ? (
            <>Location is blocked. Allow it from the lock icon in the address bar, then retry.</>
          ) : locating ? (
            <>Finding your location…</>
          ) : (
            <>
              Allow <b>7 Cheese</b> to access this device&apos;s location?
            </>
          )}
        </h3>
        <p className="mt-1 text-[11px] text-slate-400">
          Used for your nearest outlet, delivery distance and order tracking.
        </p>

        <div className="mt-5 flex items-center justify-between">
          <button
            onClick={onDismiss}
            className="text-xs italic text-slate-600 underline underline-offset-4 cursor-pointer"
          >
            {denied ? 'Continue without' : 'Ask Later'}
          </button>
          <button
            onClick={onAllow}
            disabled={locating}
            className="bg-[#ED1C24] hover:bg-[#c91430] disabled:opacity-70 text-white text-sm font-bold px-6 py-2.5 rounded-md cursor-pointer"
          >
            {denied ? 'Retry' : locating ? 'Detecting…' : 'Allow'}
          </button>
        </div>
      </div>
    </div>
  );
};
