import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  UtensilsCrossed,
  Tag,
  FileText,
  ArrowLeft,
  Volume2,
  VolumeX,
  RefreshCw,
  Bell,
  LogOut,
  Menu as MenuIcon,
  Receipt,
  X,
  Sparkles,
  Store,
  CheckCircle,
  Settings,
  Image as ImageIcon,
  QrCode,
  Bike,
  Printer
} from 'lucide-react';
import { MenuItem, Coupon, CategoryItem } from '../../types';
import { AdminOrder, normalizeOrder } from './adminData';
import { Outlet } from './outlets';
import { OutletQr } from './OutletQr';
import { BannerSlide, SlideSchedule } from '../HeroBanner';
import { AdminDashboard } from './AdminDashboard';
import { AdminLiveOrders } from './AdminLiveOrders';
import { OrderExport } from './OrderExport';
import { NewOrderAlert } from './NewOrderAlert';
import { AdminDelivery } from './AdminDelivery';
import { RushdaBilling } from './RushdaBilling';
import { AdminMenuManager } from './AdminMenuManager';
import { AdminOffersManager } from './AdminOffersManager';
import { AdminCouponManager } from './AdminCouponManager';
import { AdminReports } from './AdminReports';
import { AdminStoreImages } from './AdminStoreImages';
import { playPosChime, playNewOrderAlert, unlockAudio } from './audioAlert';
import {
  buildCustomerBillHtml,
  buildKotBillHtml,
  buildCombinedBillHtml,
  printThermal,
  orderToThermal,
} from './ThermalBills';

interface AdminLayoutProps {
  outlet: Outlet;
  orders: AdminOrder[];
  syncStatus: 'connecting' | 'live' | 'error';
  syncError?: string;
  onRetrySync: () => void;
  menuItems: MenuItem[];
  coupons: Coupon[];
  onUpdateOrderStatus: (orderId: string, newStatus: AdminOrder['status']) => void;
  onDeleteOrder: (orderId: string) => void;
  onAddItem: (item: MenuItem) => void;
  onUpdateItem: (item: MenuItem) => void;
  onDeleteItem: (itemId: string) => void;
  onRestoreMenu: () => void;
  onCreateOrder: (order: AdminOrder) => void;
  onAddCoupon: (coupon: Coupon) => void;
  onDeleteCoupon: (code: string) => void;
  onBackToStore: () => void;
  onLogout: () => void;
  slides: BannerSlide[];
  onUpdateSlideImage: (id: string, image: string) => void;
  onUpdateSlideSchedule: (id: string, schedule: SlideSchedule) => void;
  categories: CategoryItem[];
  onUpdateCategoryImage: (id: string, image: string, field?: 'image' | 'bannerImage') => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  outlet,
  orders,
  syncStatus,
  syncError = '',
  onRetrySync,
  menuItems,
  coupons,
  onUpdateOrderStatus,
  onDeleteOrder,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onRestoreMenu,
  onCreateOrder,
  onAddCoupon,
  onDeleteCoupon,
  onBackToStore,
  onLogout,
  slides,
  onUpdateSlideImage,
  onUpdateSlideSchedule,
  categories,
  onUpdateCategoryImage
}) => {
  type AdminTab = 'dashboard' | 'live-orders' | 'delivery' | 'rushda' | 'menu' | 'offers' | 'coupons' | 'images' | 'qr';
  const ADMIN_TABS: AdminTab[] = ['dashboard', 'live-orders', 'delivery', 'rushda', 'menu', 'offers', 'coupons', 'images', 'qr'];
  // The open page is kept in the URL (#live-orders …) so a refresh stays on it.
  const [activeTab, setActiveTabState] = useState<AdminTab>(() => {
    const h = window.location.hash.replace('#', '') as AdminTab;
    return ADMIN_TABS.includes(h) ? h : 'dashboard';
  });
  const setActiveTab = (tab: AdminTab) => {
    setActiveTabState(tab);
    try {
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#${tab}`);
    } catch {
      // ignore
    }
  };
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isAlertSoundOn, setIsAlertSoundOn] = useState(true);
  const [isAutoPrintOn, setIsAutoPrintOn] = useState<boolean>(
    () => localStorage.getItem('seven_cheese_autoprint_enabled') !== 'false'
  );
  const [autoPrintType, setAutoPrintType] = useState<'COMBINED' | 'KOT' | 'INVOICE'>(
    () => (localStorage.getItem('seven_cheese_autoprint_type') as 'COMBINED' | 'KOT' | 'INVOICE') || 'COMBINED'
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notifPerm, setNotifPerm] = useState<string>(
    () => (typeof Notification !== 'undefined' ? Notification.permission : 'unsupported')
  );
  const knownOrderIds = useRef<Set<string> | null>(null);
  // New orders waiting for someone to accept them (popup + repeating alarm).
  const [alertQueue, setAlertQueue] = useState<string[]>([]);
  const [alarmMuted, setAlarmMuted] = useState(false);
  // Counter billing se isi device pe banaya order — uspe khud bep-bep mat bajao.
  // Kitchen ke dusre device pe alarm normal bajega, sirf banane wali screen mute rahegi.
  const selfCreatedIds = useRef<Set<string>>(new Set());
  const titleFlashTimer = useRef<number | null>(null);
  const baseTitle = useRef(document.title);
  const soundOnRef = useRef(isAlertSoundOn);
  soundOnRef.current = isAlertSoundOn;
  const autoPrintOnRef = useRef(isAutoPrintOn);
  autoPrintOnRef.current = isAutoPrintOn;
  const autoPrintTypeRef = useRef(autoPrintType);
  autoPrintTypeRef.current = autoPrintType;

  // Strict per-outlet: har outlet ko SIRF apne order dikhenge.
  // Legacy orders (bina outletId) dono me dikhenge taaki purana data kho na jaye.
  const visibleOrders = orders.filter((o) => !o.outletId || o.outletId === outlet.id).map(normalizeOrder);

  const activeOrdersCount = visibleOrders.filter(o => o.status === 'NEW' || o.status === 'KITCHEN').length;
  const activeDeliveryCount = visibleOrders.filter(o => o.orderType === 'DELIVERY' && (o.status === 'NEW' || o.status === 'KITCHEN' || o.status === 'DISPATCHED')).length;

  // Diagnose suffix (| net:http-404 ...) ko badge me saaf dikhao — aadha katke nahi.
  const netInfo = (() => {
    const i = syncError.indexOf('| net:');
    return i >= 0 ? syncError.slice(i + 6, i + 70).trim() : '';
  })();
  const shortErr = syncError.includes('| net:')
    ? syncError.slice(0, syncError.indexOf('| net:')).trim().slice(0, 40)
    : syncError.slice(0, 40);

  const SyncBadge: React.FC<{ compact?: boolean }> = ({ compact }) => (
    <button
      onClick={() => {
        if (syncStatus === 'error') onRetrySync();
      }}
      title={
        syncStatus === 'live'
          ? 'Connected to Firestore — orders arrive live from all devices'
          : syncStatus === 'error'
            ? `Cannot reach Firestore — showing this device only. Reason: ${syncError || 'unknown'}. Tap to retry. Check your Firestore Rules and internet connection.`
            : 'Connecting to live order sync…'
      }
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-black border shrink-0 cursor-pointer ${
        syncStatus === 'live'
          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
          : syncStatus === 'error'
            ? 'bg-red-50 text-red-700 border-red-200 animate-pulse'
            : 'bg-slate-100 text-slate-500 border-slate-200'
      }`}
    >
      <span
        className={`w-2 h-2 rounded-full ${
          syncStatus === 'live' ? 'bg-emerald-500 animate-pulse' : syncStatus === 'error' ? 'bg-red-500' : 'bg-slate-400'
        }`}
      />
      {!compact && (
        <span>
          {syncStatus === 'live'
            ? 'Live sync'
            : syncStatus === 'error'
              ? netInfo
                ? `Sync failed (${netInfo}). Tap to retry.`
                : `Sync error — tap to retry${shortErr ? `: ${shortErr}` : ''}`
              : 'Connecting…'}
        </span>
      )}
    </button>
  );

  const stopTitleFlash = () => {
    if (titleFlashTimer.current !== null) {
      window.clearInterval(titleFlashTimer.current);
      titleFlashTimer.current = null;
      document.title = baseTitle.current;
    }
  };

  const flashTitle = (text: string) => {
    stopTitleFlash();
    let on = false;
    titleFlashTimer.current = window.setInterval(() => {
      on = !on;
      document.title = on ? text : baseTitle.current;
    }, 1000);
  };

  const handleEnableAlerts = async () => {
    unlockAudio();
    playPosChime(800);
    try {
      if ('Notification' in window && Notification.permission === 'default') {
        const perm = await Notification.requestPermission();
        setNotifPerm(perm);
      }
    } catch {
      // ignore
    }
  };

  // Unlock audio on every interaction (autoplay policy needs gesture).
  useEffect(() => {
    const unlock = () => unlockAudio();
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    window.addEventListener('touchstart', unlock);
    const onFocus = () => stopTitleFlash();
    const onVis = () => {
      if (!document.hidden) stopTitleFlash();
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVis);
      stopTitleFlash();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Counter billing se bana order: isi screen ka alarm suppress karo, order aage pass karo.
  const handleCounterCreateOrder = (order: AdminOrder) => {
    selfCreatedIds.current.add(order.id);
    // memory leak guard
    if (selfCreatedIds.current.size > 100) {
      const first = selfCreatedIds.current.values().next().value;
      if (first) selfCreatedIds.current.delete(first);
    }
    onCreateOrder(order);
  };

  // Auto alarm on every genuinely NEW incoming order (sound ~4s + title + notification).
  // NOTE: Counter billing (RushdaBilling) se bana order isi device pe silent rahega —
  // online / dusre device se aaya order pe hi bep-bep bajega.
  useEffect(() => {
    if (knownOrderIds.current === null) {
      knownOrderIds.current = new Set(orders.map((o) => o.id));
      return;
    }
    const fresh = orders.filter(
      (o) => !knownOrderIds.current!.has(o.id) && (o.status === 'NEW' || o.status === 'KITCHEN')
    );
    knownOrderIds.current = new Set(orders.map((o) => o.id));
    if (!fresh.length) return;
    // Khud counter se banaye orders nikalo — unpe no sound, no flash, no popup.
    const external = fresh.filter((o) => {
      if (selfCreatedIds.current.has(o.id)) {
        selfCreatedIds.current.delete(o.id);
        return false;
      }
      return true;
    });
    if (!external.length) return;
    const latest = external[0];
    const itemCount = (latest.items || []).reduce((n, it) => n + (it.quantity || 1), 0);
    // This outlet's new orders go into the popup queue; the alarm repeats until they're accepted.
    const mine = external.filter((o) => o.status === 'NEW' && (!o.outletId || o.outletId === outlet.id)).map((o) => o.id);
    if (mine.length) {
      setAlertQueue((q) => [...q, ...mine.filter((id) => !q.includes(id))]);
      setAlarmMuted(false);
    }
    flashTitle(`🔔 NEW ORDER ${latest.orderNumber} — ₹${latest.total}`);

    // Auto-Print incoming orders immediately to Thermal Printer
    if (autoPrintOnRef.current) {
      external.forEach((ord) => {
        try {
          const tData = orderToThermal(ord);
          const billHtml =
            autoPrintTypeRef.current === 'KOT'
              ? buildKotBillHtml(tData)
              : autoPrintTypeRef.current === 'INVOICE'
                ? buildCustomerBillHtml(tData)
                : buildCombinedBillHtml(tData);
          printThermal(billHtml);
        } catch (err) {
          console.error('Auto-print error for order:', ord.orderNumber, err);
        }
      });
    }

    try {
      if ('Notification' in window && Notification.permission === 'granted' && document.hidden) {
        const n = new Notification('🔔 New Order Received', {
          body: `${latest.orderNumber} • ${itemCount} items • ₹${latest.total} • ${latest.orderType}`,
          icon: '/pwa-192x192.png',
          tag: latest.id,
        });
        n.onclick = () => {
          window.focus();
          n.close();
        };
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders]);

  // Popup shows the oldest waiting order that is still NEW (accepted elsewhere = drops out).
  const pendingAlerts = alertQueue
    .map((id) => visibleOrders.find((o) => o.id === id))
    .filter((o): o is AdminOrder => !!o && o.status === 'NEW');
  const currentAlert = pendingAlerts[0] ?? null;
  useEffect(() => {
    if (alertQueue.length && pendingAlerts.length !== alertQueue.length) {
      setAlertQueue(pendingAlerts.map((o) => o.id));
    }
    if (!pendingAlerts.length) stopTitleFlash();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingAlerts.length, alertQueue.length]);

  // Repeating siren while an order waits (every 6 s) unless muted or alerts are off.
  const alarmActive = pendingAlerts.length > 0 && !alarmMuted && isAlertSoundOn;
  useEffect(() => {
    if (!alarmActive) return;
    playNewOrderAlert(4000);
    const id = window.setInterval(() => playNewOrderAlert(4000), 6000);
    return () => window.clearInterval(id);
  }, [alarmActive]);

  const acceptAlert = (o: AdminOrder) => {
    onUpdateOrderStatus(o.id, 'KITCHEN');
    setAlertQueue((q) => q.filter((id) => id !== o.id));
  };
  const viewAlert = (o: AdminOrder) => {
    setAlertQueue((q) => q.filter((id) => id !== o.id));
    setActiveTab('live-orders');
  };

  // Test plays the real new-order siren, so staff know what to listen for.
  const handleTestAlert = () => {
    if (isAlertSoundOn) {
      playNewOrderAlert(3000);
    }
  };

  const handleTestPrint = () => {
    const sampleOrder: AdminOrder = visibleOrders[0] || {
      id: `ord-test-${Date.now()}`,
      orderNumber: '#7C-TEST',
      customerName: 'WALK-IN GUEST',
      customerPhone: '7900477999',
      orderType: 'DELIVERY',
      address: 'UNCHAPUL, HALDWANI',
      items: [
        { name: '7 CHEESE SPECIAL PIZZA', quantity: 1, price: 349, isVeg: true, size: 'Medium' }
      ],
      subtotal: 349,
      deliveryFee: 0,
      tax: 17.45,
      discount: 0,
      total: 366,
      paymentMethod: 'UPI',
      paymentStatus: 'PAID',
      status: 'NEW',
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timeAgo: 'Just now',
    };
    const tData = orderToThermal(sampleOrder);
    const html =
      autoPrintType === 'KOT'
        ? buildKotBillHtml(tData)
        : autoPrintType === 'INVOICE'
          ? buildCustomerBillHtml(tData)
          : buildCombinedBillHtml(tData);
    printThermal(html);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    onRetrySync();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const NAV: { id: AdminTab; label: string; icon: typeof LayoutDashboard; badge?: number; badgeColor?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'live-orders', label: 'Live Orders', icon: ShoppingBag, badge: activeOrdersCount || undefined, badgeColor: 'bg-red-500 text-white' },
    { id: 'delivery', label: 'Delivery (Rider)', icon: Bike, badge: activeDeliveryCount || undefined, badgeColor: 'bg-blue-600 text-white' },
    { id: 'rushda', label: 'Counter Billing', icon: Receipt },
    { id: 'menu', label: 'Menu Catalog', icon: UtensilsCrossed, badge: menuItems.length, badgeColor: 'bg-slate-100 text-slate-600' },
    { id: 'offers', label: 'Combos & Offers', icon: Sparkles, badge: menuItems.filter((m) => m.category === 'combos').length, badgeColor: 'bg-amber-50 text-amber-700' },
    { id: 'coupons', label: 'Promo Codes', icon: Tag, badge: coupons.length, badgeColor: 'bg-emerald-50 text-emerald-700' },
    { id: 'images', label: 'Store Images', icon: ImageIcon },
    { id: 'qr', label: 'Tables & QR Codes', icon: QrCode },
  ];
  const currentLabel = NAV.find((n) => n.id === activeTab)?.label ?? 'Dashboard';

  // Alert / printing / test controls live in one Settings panel instead of the header.
  const SettingsPanel = () => (
    <>
      <div className="fixed inset-0 z-[55]" onClick={() => setIsSettingsOpen(false)} aria-hidden="true" />
      <div
        role="dialog"
        aria-label="Alert and printer settings"
        className="fixed z-[56] right-3 top-14 md:top-16 w-[calc(100%-1.5rem)] max-w-sm bg-white rounded-2xl border border-slate-200 shadow-2xl p-4 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900">Alerts & printing</h3>
          <button onClick={() => setIsSettingsOpen(false)} aria-label="Close" className="text-slate-400 hover:text-slate-700 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <label className="flex items-center justify-between gap-3 text-sm font-semibold text-slate-700">
          <span className="flex items-center gap-2">
            {isAlertSoundOn ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            New-order alarm
          </span>
          <input type="checkbox" checked={isAlertSoundOn} onChange={() => setIsAlertSoundOn(!isAlertSoundOn)} className="w-5 h-5 accent-emerald-600" />
        </label>

        <div className="space-y-2">
          <label className="flex items-center justify-between gap-3 text-sm font-semibold text-slate-700">
            <span className="flex items-center gap-2">
              <Printer className="w-4 h-4 text-purple-600" />
              Auto-print new orders
            </span>
            <input
              id="btn-toggle-autoprint"
              type="checkbox"
              checked={isAutoPrintOn}
              onChange={() => {
                const next = !isAutoPrintOn;
                setIsAutoPrintOn(next);
                localStorage.setItem('seven_cheese_autoprint_enabled', String(next));
              }}
              className="w-5 h-5 accent-purple-600"
            />
          </label>
          <select
            id="select-autoprint-type"
            value={autoPrintType}
            onChange={(e) => {
              const val = e.target.value as 'COMBINED' | 'KOT' | 'INVOICE';
              setAutoPrintType(val);
              localStorage.setItem('seven_cheese_autoprint_type', val);
            }}
            className="w-full text-xs font-bold bg-white text-slate-700 border border-slate-200 rounded-lg px-2 py-2 cursor-pointer"
          >
            <option value="COMBINED">Print bill + KOT</option>
            <option value="KOT">Print KOT only</option>
            <option value="INVOICE">Print bill only</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            id="btn-test-alert"
            onClick={handleTestAlert}
            className="flex items-center justify-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 py-2 rounded-xl text-xs font-bold cursor-pointer"
          >
            <Bell className="w-4 h-4" /> Test alarm
          </button>
          <button
            onClick={handleTestPrint}
            className="flex items-center justify-center gap-1.5 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 py-2 rounded-xl text-xs font-bold cursor-pointer"
          >
            <Printer className="w-4 h-4" /> Test print
          </button>
        </div>

        {notifPerm !== 'granted' && notifPerm !== 'unsupported' && (
          <button
            id="btn-enable-alerts"
            onClick={() => void handleEnableAlerts()}
            className="w-full flex items-center justify-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-300 py-2 rounded-xl text-xs font-bold cursor-pointer"
            title="Allow sound + pop-up alerts when this tab is in the background"
          >
            <Bell className="w-4 h-4" /> Allow notifications
          </button>
        )}
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col md:flex-row antialiased font-sans">
      {/* Mobile header */}
      <div className="md:hidden bg-white border-b border-slate-200 px-3 py-2.5 flex items-center gap-2 sticky top-0 z-40 shadow-xs">
        <button
          onClick={() => setIsMobileSidebarOpen(true)}
          className="p-1.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 shrink-0"
          aria-label="Open menu"
        >
          <MenuIcon className="w-5 h-5" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="font-black text-sm text-slate-900 truncate">{currentLabel}</div>
          <div className="text-[11px] text-slate-500 truncate">{outlet.name}</div>
        </div>
        <SyncBadge compact />
        <button onClick={handleRefresh} className="p-2 rounded-xl bg-slate-100 text-slate-700 shrink-0" aria-label="Refresh live data">
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
        <button onClick={() => setIsSettingsOpen(true)} className="p-2 rounded-xl bg-slate-100 text-slate-700 shrink-0" aria-label="Alerts and printing settings">
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Mobile drawer backdrop */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[1px] md:hidden" onClick={() => setIsMobileSidebarOpen(false)} aria-hidden="true" />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-300 shadow-xl md:shadow-none md:sticky md:top-0 md:h-screen md:translate-x-0 ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="min-h-0 overflow-y-auto">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#ED1C24] to-red-500 flex items-center justify-center text-white font-black text-base shadow-md shadow-red-500/20 shrink-0">
                7
              </div>
              <div className="min-w-0">
                <div className="font-black text-sm text-slate-900 tracking-tight leading-none">7 CHEESE PIZZA</div>
                <div className="text-[11px] text-slate-500 font-medium mt-1 truncate">{outlet.area}</div>
              </div>
            </div>
            <button onClick={() => setIsMobileSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-slate-600" aria-label="Close menu">
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="p-3 space-y-1">
            {NAV.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                    isActive ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                    {item.label}
                  </span>
                  {item.badge !== undefined && (
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-black ${item.badgeColor}`}>{item.badge}</span>
                  )}
                </button>
              );
            })}
            <button
              onClick={() => {
                setIsShiftModalOpen(true);
                setIsMobileSidebarOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer"
            >
              <FileText className="w-4 h-4 text-amber-500" />
              Day close report
            </button>
          </nav>
        </div>

        <div className="p-4 border-t border-slate-100 space-y-2 shrink-0">
          <button
            id="btn-admin-back-store"
            onClick={onBackToStore}
            className="w-full flex items-center justify-center gap-2 bg-[#ED1C24] hover:bg-[#c91430] active:scale-95 text-white py-2.5 rounded-xl text-xs font-black shadow-md shadow-red-500/20 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to customer store
          </button>
          <button
            id="btn-admin-logout"
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 bg-white hover:bg-slate-100 text-slate-600 py-2 rounded-xl text-xs font-bold border border-slate-200 transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Log out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0 pb-20 md:pb-0">
        {/* Desktop header */}
        <header className="hidden md:flex bg-white border-b border-slate-200 px-6 py-3 items-center justify-between gap-4 sticky top-0 z-30 shadow-xs">
          <div className="min-w-0">
            <div className="font-black text-slate-900 text-base truncate">{currentLabel}</div>
            <div className="text-xs text-slate-500 truncate">
              {outlet.name} — {outlet.area}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {activeOrdersCount > 0 && (
              <button
                onClick={() => setActiveTab('live-orders')}
                className="bg-[#ED1C24] text-white px-3 py-1.5 rounded-xl text-xs font-black cursor-pointer"
              >
                {activeOrdersCount} open order{activeOrdersCount === 1 ? '' : 's'}
              </button>
            )}
            <SyncBadge />
            <button onClick={handleRefresh} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer" title="Refresh live data" aria-label="Refresh live data">
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border cursor-pointer ${
                isAlertSoundOn ? 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50' : 'bg-amber-50 text-amber-800 border-amber-300'
              }`}
            >
              <Settings className="w-4 h-4" />
              {isAlertSoundOn ? 'Settings' : 'Alarm off'}
            </button>
          </div>
        </header>

        {isSettingsOpen && <SettingsPanel />}

        {/* Phone bottom tabs */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-200 grid grid-cols-5">
          {([
            { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
            { id: 'live-orders', label: 'Orders', icon: ShoppingBag, badge: activeOrdersCount },
            { id: 'delivery', label: 'Delivery', icon: Bike, badge: activeDeliveryCount },
            { id: 'rushda', label: 'Billing', icon: Receipt },
          ] as const).map((b) => {
            const Icon = b.icon;
            const active = activeTab === b.id;
            return (
              <button
                key={b.id}
                onClick={() => setActiveTab(b.id)}
                className={`relative flex flex-col items-center gap-0.5 py-2 text-[11px] font-bold cursor-pointer ${active ? 'text-[#ED1C24]' : 'text-slate-500'}`}
              >
                <Icon className="w-5 h-5" />
                {b.label}
                {'badge' in b && b.badge ? (
                  <span className="absolute top-1 right-[22%] min-w-4 h-4 px-1 rounded-full bg-[#ED1C24] text-white text-[11px] font-black flex items-center justify-center">
                    {b.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="flex flex-col items-center gap-0.5 py-2 text-[11px] font-bold text-slate-500 cursor-pointer"
          >
            <MenuIcon className="w-5 h-5" />
            More
          </button>
        </nav>

        <div className="p-3 sm:p-4 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <AdminDashboard
              orders={visibleOrders}
              onNavigateTab={(t) => {
                if (t === 'reports') setIsShiftModalOpen(true);
                else setActiveTab(t);
              }}
              onOpenShiftModal={() => setIsShiftModalOpen(true)}
            />
          )}

          {activeTab === 'live-orders' && (
            <AdminLiveOrders
              orders={visibleOrders}
              onUpdateOrderStatus={onUpdateOrderStatus}
              onDeleteOrder={onDeleteOrder}
              headerActions={<OrderExport orders={visibleOrders} />}
            />
          )}

          {activeTab === 'delivery' && (
            <AdminDelivery
              orders={visibleOrders}
              onUpdateOrderStatus={onUpdateOrderStatus}
              onDeleteOrder={onDeleteOrder}
            />
          )}

          {activeTab === 'rushda' && (
            <RushdaBilling
              outlet={outlet}
              orders={visibleOrders}
              menuItems={menuItems}
              onCreateOrder={handleCounterCreateOrder}
              onAddItem={onAddItem}
              onUpdateItem={onUpdateItem}
              onDeleteItem={onDeleteItem}
            />
          )}

          {activeTab === 'menu' && (
            <AdminMenuManager
              menuItems={menuItems}
              onAddItem={onAddItem}
              onUpdateItem={onUpdateItem}
              onDeleteItem={onDeleteItem}
              onRestoreMenu={onRestoreMenu}
            />
          )}

          {activeTab === 'offers' && (
            <AdminOffersManager
              menuItems={menuItems}
              onAddItem={onAddItem}
              onUpdateItem={onUpdateItem}
              onDeleteItem={onDeleteItem}
            />
          )}

          {activeTab === 'coupons' && (
            <AdminCouponManager
              coupons={coupons}
              onAddCoupon={onAddCoupon}
              onDeleteCoupon={onDeleteCoupon}
            />
          )}

          {activeTab === 'images' && (
            <AdminStoreImages
              slides={slides}
              onUpdateSlideImage={onUpdateSlideImage}
              onUpdateSlideSchedule={onUpdateSlideSchedule}
              categories={categories}
              onUpdateCategoryImage={onUpdateCategoryImage}
            />
          )}

          {activeTab === 'qr' && (
            <OutletQr outlet={outlet} />
          )}
        </div>
      </main>

      {/* Shift Z-Report Modal */}
      <AdminReports
        orders={visibleOrders}
        isOpen={isShiftModalOpen}
        onClose={() => setIsShiftModalOpen(false)}
        outletName={`${outlet.name} — ${outlet.area}`}
      />
      <NewOrderAlert
        order={currentAlert}
        moreWaiting={Math.max(0, pendingAlerts.length - 1)}
        muted={alarmMuted || !isAlertSoundOn}
        onAccept={acceptAlert}
        onView={viewAlert}
        onToggleMute={() => setAlarmMuted((m) => !m)}
      />
    </div>
  );
};
