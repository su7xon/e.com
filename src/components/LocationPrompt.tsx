import React from 'react';

interface LocationPromptProps {
  gpsState: 'idle' | 'locating' | 'locked' | 'denied';
  hasFix: boolean;
  hasCart?: boolean;
  onAllow: () => void;
  onDismiss: () => void;
  /** Type or pin an address instead of sharing location. */
  onEnterAddress: () => void;
  /** Specific error message (permission denied / timeout / https required, etc.) */
  locationError?: string | null;
}

/**
 * Minimal location hint — small non-intrusive bottom banner.
 * No modal overlay, no confusing mobile location arrow.
 * Allow -> browser location prompt -> coords saved for outlet distance + order routing.
 * Enter address -> address sheet. Dismiss -> browse freely; cart asks for location before checkout.
 */
export const LocationPrompt: React.FC<LocationPromptProps> = ({
  gpsState,
  hasFix,
  onAllow,
  onDismiss,
  onEnterAddress,
  locationError,
}) => {
  if (hasFix || gpsState === 'locked') return null;

  const denied = gpsState === 'denied';
  const locating = gpsState === 'locating';

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[60] flex items-center justify-center pointer-events-none">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="loc-hint-title"
        className="pointer-events-auto w-full max-w-sm bg-white border border-slate-200 rounded-xl shadow-lg p-4 text-center animate-in slide-in-from-bottom duration-200"
      >
        {locating ? (
          <p id="loc-hint-title" className="text-xs text-slate-600 font-medium mb-3">
            Detecting location…
          </p>
        ) : denied ? (
          <p id="loc-hint-title" className="text-xs text-red-600 font-medium mb-3">
            Location blocked — enter address manually below
          </p>
        ) : (
          <p id="loc-hint-title" className="text-xs text-slate-600 font-medium mb-3">
            Share location to find your nearest store
          </p>
        )}

        {locationError && (
          <p className="text-[10px] text-red-500 font-medium mb-3">{locationError}</p>
        )}

        <div className="flex gap-2">
          <button
            id="btn-loc-use-gps"
            onClick={onAllow}
            disabled={locating}
            className="flex-1 bg-[#ED1C24] hover:bg-[#c91430] disabled:opacity-60 text-white text-xs font-bold py-2 rounded-lg cursor-pointer disabled:cursor-not-allowed"
          >
            {denied ? 'Retry' : locating ? 'Detecting…' : 'Allow'}
          </button>
          <button
            id="btn-loc-enter-address"
            onClick={onEnterAddress}
            className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold py-2 rounded-lg cursor-pointer"
          >
            Enter address
          </button>
        </div>

        <button
          id="btn-loc-dismiss"
          onClick={onDismiss}
          className="mt-3 text-[10px] text-slate-400 underline underline-offset-2 cursor-pointer"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
};
