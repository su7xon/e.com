import React from 'react';
import { MapPin, Loader2 } from 'lucide-react';

interface LocationPromptProps {
  gpsState: 'idle' | 'locating' | 'locked' | 'denied';
  hasFix: boolean;
  hasCart?: boolean;
  onAllow: () => void;
  onDismiss: () => void;
  /** Type or pin an address instead of sharing location. */
  onEnterAddress: () => void;
}

/**
 * First-screen location gate (Domino's style): centered dialog over a dimmed page.
 * Allow -> browser location prompt -> coords saved for outlet distance + order routing.
 * Enter address -> address sheet. Browse first -> menu loads; the cart asks for a location before checkout.
 * NOTE: hasCart kept for compat — centered dialog needs no bottom offset, so no overlap.
 */
export const LocationPrompt: React.FC<LocationPromptProps> = ({
  gpsState,
  hasFix,
  onAllow,
  onDismiss,
  onEnterAddress,
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
              Where should we deliver your <b>7 Cheese</b> order?
            </>
          )}
        </h3>
        <p className="mt-1 text-[11px] text-slate-400">
          We use it to find your nearest store and delivery distance.
        </p>

        <div className="mt-5 space-y-2">
          <button
            id="btn-loc-use-gps"
            onClick={onAllow}
            disabled={locating}
            className="w-full bg-[#ED1C24] hover:bg-[#c91430] disabled:opacity-70 text-white text-sm font-bold px-6 py-2.5 rounded-md cursor-pointer"
          >
            {denied ? 'Try again' : locating ? 'Detecting…' : 'Use my location'}
          </button>
          <button
            id="btn-loc-enter-address"
            onClick={onEnterAddress}
            className="w-full bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-sm font-bold px-6 py-2.5 rounded-md cursor-pointer"
          >
            Enter address
          </button>
          <button
            id="btn-loc-browse"
            onClick={onDismiss}
            className="text-xs text-slate-600 underline underline-offset-4 cursor-pointer"
          >
            Browse the menu first
          </button>
        </div>
      </div>
    </div>
  );
};
