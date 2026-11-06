import React, { useCallback, useEffect, useState } from 'react';
import { Download, RefreshCw, WifiOff, X } from 'lucide-react';
import { registerSW } from 'virtual:pwa-register';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const INSTALL_DISMISSED_KEY = 'seven_cheese_pwa_install_dismissed';
const APK_URL = '/7cheese-pizza.apk';



export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isDismissed, setIsDismissed] = useState(
    () => sessionStorage.getItem(INSTALL_DISMISSED_KEY) === '1',
  );

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setDeferredPrompt(null);
    return outcome === 'accepted';
  }, [deferredPrompt]);

  const dismiss = useCallback(() => {
    sessionStorage.setItem(INSTALL_DISMISSED_KEY, '1');
    setIsDismissed(true);
  }, []);

  return {
    canInstall: !!deferredPrompt && !isInstalled && !isDismissed,
    promptInstall,
    dismiss,
  };
}

export const PwaInstallBanner: React.FC<{ hasCart?: boolean }> = ({ hasCart = false }) => {
  const { canInstall, promptInstall, dismiss } = usePwaInstall();
  const [apkAvailable, setApkAvailable] = useState(false);
  const [dismissed, setDismissed] = useState(
    () => sessionStorage.getItem(INSTALL_DISMISSED_KEY) === '1',
  );

  const handleDismiss = () => {
    setDismissed(true);
    dismiss();
  };

  useEffect(() => {
    let cancelled = false;
    fetch(APK_URL, { method: 'HEAD' })
      .then((r) => {
        if (!cancelled && r.ok) setApkAvailable(true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Single Install button — seedha APK download (no alag APK button)
  if (dismissed || (!canInstall && !apkAvailable)) return null;
  return (
    <div className={`fixed left-3 right-3 sm:left-auto sm:right-6 sm:max-w-sm z-[55] animate-in slide-in-from-bottom-2 duration-200 ${hasCart ? 'bottom-[228px] sm:bottom-[210px]' : 'bottom-[152px] sm:bottom-[150px]'}`}>
      <div className="bg-slate-950 text-white rounded-2xl shadow-2xl border border-white/10 p-2.5 sm:p-4 flex items-center gap-2.5 sm:gap-3">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl overflow-hidden shrink-0 bg-[#111111]">
          <img src="/pwa-192x192.png" alt="7 Cheese Pizza" className="w-full h-full object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black leading-tight">Install 7 Cheese Pizza</p>
          <p className="hidden sm:block text-[11px] text-zinc-400 leading-tight mt-0.5">
            Faster ordering, works offline, home-screen access.
          </p>
        </div>
        <div className="flex flex-col gap-1.5 shrink-0">
          {canInstall ? (
            <button
              id="btn-pwa-install"
              onClick={() => void promptInstall()}
              className="flex items-center justify-center gap-1.5 bg-[#ED1C24] hover:bg-[#c91430] text-white text-xs font-black px-3.5 py-2 rounded-xl shadow-md transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install</span>
            </button>
          ) : (
            <a
              id="btn-pwa-install"
              href={APK_URL}
              download
              className="flex items-center justify-center gap-1.5 bg-[#ED1C24] hover:bg-[#c91430] text-white text-xs font-black px-3.5 py-2 rounded-xl shadow-md transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install</span>
            </a>
          )}
        </div>
        <button
          id="btn-pwa-install-dismiss"
          onClick={handleDismiss}
          className="text-zinc-500 hover:text-white transition-colors cursor-pointer shrink-0"
          aria-label="Dismiss install prompt"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export const PwaUpdatePrompt: React.FC = () => {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [updateSW] = useState(() =>
    registerSW({
      immediate: true,
      onNeedRefresh() {
        setNeedRefresh(true);
      },
    }),
  );

  if (!needRefresh) return null;
  return (
    <div className="fixed top-3 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-sm z-50">
      <div className="bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200 p-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
          <RefreshCw className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black leading-tight">New version available</p>
          <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
            Fresh menu & fixes are ready to load.
          </p>
        </div>
        <button
          id="btn-pwa-update"
          onClick={() => void updateSW(true)}
          className="bg-slate-950 hover:bg-slate-800 text-white text-xs font-black px-3.5 py-2 rounded-xl transition-colors cursor-pointer shrink-0"
        >
          Update
        </button>
        <button
          id="btn-pwa-update-dismiss"
          onClick={() => setNeedRefresh(false)}
          className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer shrink-0"
          aria-label="Dismiss update prompt"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export const PwaOfflineBadge: React.FC = () => {
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine,
  );

  useEffect(() => {
    const goOffline = () => setIsOnline(false);
    const goOnline = () => setIsOnline(true);
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, []);

  if (isOnline) return null;
  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-1.5 bg-amber-400 text-slate-950 text-xs font-black px-3.5 py-1.5 rounded-full shadow-lg border border-amber-500">
        <WifiOff className="w-3.5 h-3.5" />
        <span>Offline — browsing saved menu</span>
      </div>
    </div>
  );
};
