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
  Bike
} from 'lucide-react';
import { MenuItem, Coupon, CategoryItem } from '../../types';
import { AdminOrder } from './adminData';
import { Outlet } from './outlets';
import { OutletQr } from './OutletQr';
import { BannerSlide } from '../HeroBanner';
import { AdminDashboard } from './AdminDashboard';
import { AdminLiveOrders } from './AdminLiveOrders';
import { AdminDelivery } from './AdminDelivery';
import { RushdaBilling } from './RushdaBilling';
import { AdminMenuManager } from './AdminMenuManager';
import { AdminOffersManager } from './AdminOffersManager';
import { AdminCouponManager } from './AdminCouponManager';
import { AdminReports } from './AdminReports';
import { AdminStoreImages } from './AdminStoreImages';
import { playPosChime, playNewOrderAlert, unlockAudio } from './audioAlert';

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
  categories,
  onUpdateCategoryImage
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'live-orders' | 'delivery' | 'rushda' | 'menu' | 'offers' | 'coupons' | 'images' | 'qr'>('dashboard');
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isAlertSoundOn, setIsAlertSoundOn] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notifPerm, setNotifPerm] = useState<string>(
    () => (typeof Notification !== 'undefined' ? Notification.permission : 'unsupported')
  );
  const knownOrderIds = useRef<Set<string> | null>(null);
  // Counter billing se isi device pe banaya order — uspe khud bep-bep mat bajao.
  // Kitchen ke dusre device pe alarm normal bajega, sirf banane wali screen mute rahegi.
  const selfCreatedIds = useRef<Set<string>>(new Set());
  const titleFlashTimer = useRef<number | null>(null);
  const baseTitle = useRef(document.title);
  const soundOnRef = useRef(isAlertSoundOn);
  soundOnRef.current = isAlertSoundOn;

  // Strict per-outlet: har outlet ko SIRF apne order dikhenge.
  // Legacy orders (bina outletId) dono me dikhenge taaki purana data kho na jaye.
  const visibleOrders = orders.filter((o) => !o.outletId || o.outletId === outlet.id);

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
            ? `Cannot reach Firestore — showing this device only. Reason: ${syncError || 'unknown'}. Tap to retry. Firestore Rules + internet check karo.`
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
                ? `Sync fail (${netInfo}) — tap to retry`
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
    // Repeat alarm 3x (12s) so kitchen hears even if tab background.
    if (soundOnRef.current) {
      playNewOrderAlert(4000);
      window.setTimeout(() => { if (soundOnRef.current) playNewOrderAlert(4000); }, 4500);
      window.setTimeout(() => { if (soundOnRef.current) playNewOrderAlert(4000); }, 9000);
    }
    flashTitle(`🔔 NEW ORDER ${latest.orderNumber} — ₹${latest.total}`);
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

  const handleTestAlert = () => {
    if (isAlertSoundOn) {
      playPosChime(3000);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    onRetrySync();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col md:flex-row antialiased font-sans">
      {/* Mobile Header Bar */}
      <div className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow-xs">
        <button
          onClick={() => setIsMobileSidebarOpen(true)}
          className="p-1.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200"
        >
          <MenuIcon className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#ED1C24] flex items-center justify-center text-white font-black text-xs shadow-xs">
            7
          </div>
          <span className="font-black text-sm text-slate-900 tracking-tight">7 Cheese Admin POS • {outlet.shortName}</span>
        </div>

        <button
          onClick={onBackToStore}
          className="flex items-center gap-1 text-xs font-bold text-[#ED1C24] bg-red-50 border border-red-200 px-2.5 py-1 rounded-xl"
        >
          <Store className="w-3.5 h-3.5" />
          <span>Store</span>
        </button>
      </div>

      {/* Mobile drawer backdrop */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[1px] md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-300 shadow-xl md:shadow-none md:static md:translate-x-0 ${
        isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div>
          {/* Brand Header */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#ED1C24] to-red-500 flex items-center justify-center text-white font-black text-base shadow-md shadow-red-500/20">
                7
              </div>
              <div>
                <div className="font-black text-sm text-slate-900 tracking-tight leading-none">
                  7 CHEESE PIZZA
                </div>
                <div className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase mt-1 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {outlet.shortName} POS
                </div>
                <div className="text-[10px] text-slate-400 font-medium mt-0.5 line-clamp-1">{outlet.area}</div>
              </div>
            </div>

            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="md:hidden text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="p-3 space-y-1">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'live-orders', label: 'Live Orders & KOT', icon: ShoppingBag, badge: activeOrdersCount > 0 ? activeOrdersCount : undefined, badgeColor: 'bg-red-500 text-white' },
              { id: 'delivery', label: 'Delivery (Rider)', icon: Bike, badge: activeDeliveryCount > 0 ? activeDeliveryCount : undefined, badgeColor: 'bg-blue-600 text-white' },
              { id: 'rushda', label: 'Counter Billing', icon: Receipt, badge: undefined, badgeColor: 'bg-slate-100 text-slate-600' },
              { id: 'menu', label: 'Menu Catalog', icon: UtensilsCrossed, badge: menuItems.length, badgeColor: 'bg-slate-100 text-slate-600' },
              { id: 'offers', label: 'Combos & Offers', icon: Sparkles, badge: menuItems.filter((m) => m.category === 'combos').length, badgeColor: 'bg-amber-50 text-amber-700' },
              { id: 'coupons', label: 'Promo Codes', icon: Tag, badge: coupons.length, badgeColor: 'bg-emerald-50 text-emerald-700' },
              { id: 'images', label: 'Store Images', icon: ImageIcon, badge: slides.length + categories.length, badgeColor: 'bg-violet-50 text-violet-700' },
              { id: 'qr', label: 'Outlet QR Code', icon: QrCode, badge: undefined, badgeColor: 'bg-slate-100 text-slate-600' },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as typeof activeTab);
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}

            <button
              onClick={() => {
                setIsShiftModalOpen(true);
                setIsMobileSidebarOpen(false);
              }}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-amber-500" />
                <span>Shift Z-Report</span>
              </div>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                DAILY
              </span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer: Back to Store */}
        <div className="p-4 border-t border-slate-100 space-y-3">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
            <div className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Store Live & Open</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">30 Mins Express Guarantee active</div>
          </div>

          <button
            id="btn-admin-back-store"
            onClick={onBackToStore}
            className="w-full flex items-center justify-center gap-2 bg-[#ED1C24] hover:bg-[#c91430] active:scale-95 text-white py-2.5 rounded-xl text-xs font-black shadow-md shadow-red-500/20 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Customer Store</span>
          </button>

          <button
            id="btn-admin-logout"
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 bg-white hover:bg-slate-100 text-slate-600 py-2 rounded-xl text-xs font-bold border border-slate-200 transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout ({outlet.shortName})</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Mobile quick tools (desktop header is md+ only) */}
        <div className="md:hidden px-4 pt-3 flex items-center gap-2 sticky top-[57px] z-30 bg-slate-50/95 backdrop-blur pb-2">
          <button
            onClick={() => setIsAlertSoundOn(!isAlertSoundOn)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-colors cursor-pointer ${
              isAlertSoundOn
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-white text-slate-500 border-slate-200'
            }`}
          >
            {isAlertSoundOn ? <Volume2 className="w-3.5 h-3.5 text-emerald-600" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
            <span>Alert {isAlertSoundOn ? 'ON' : 'OFF'}</span>
          </button>
          <button
            onClick={handleTestAlert}
            className="flex items-center gap-1.5 bg-amber-50 text-amber-800 border border-amber-300 px-3 py-1.5 rounded-xl text-[11px] font-bold cursor-pointer"
          >
            <Bell className="w-3.5 h-3.5 text-amber-600" />
            <span>Test Sound</span>
          </button>
          {notifPerm !== 'granted' && notifPerm !== 'unsupported' && (
            <button
              onClick={() => void handleEnableAlerts()}
              className="flex items-center gap-1.5 bg-blue-50 text-blue-800 border border-blue-300 px-3 py-1.5 rounded-xl text-[11px] font-bold cursor-pointer animate-pulse"
            >
              <Bell className="w-3.5 h-3.5 text-blue-600" />
              <span>Enable Alerts</span>
            </button>
          )}
          <button
            onClick={handleRefresh}
            className="p-2 rounded-xl bg-white text-slate-700 border border-slate-200 cursor-pointer"
            title="Refresh Live Data"
            aria-label="Refresh live data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          <SyncBadge compact />
          {activeOrdersCount > 0 && (
            <span className="ml-auto bg-[#ED1C24] text-white px-2.5 py-1 rounded-full text-[10px] font-black animate-pulse shrink-0">
              {activeOrdersCount} LIVE
            </span>
          )}
        </div>

        {/* Top Executive Header Bar (Desktop & Tablet) */}
        <header className="hidden md:flex bg-white border-b border-slate-200 px-6 py-3.5 items-center justify-between sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span>Sales & KOT Register</span>
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-black uppercase">
                LIVE POS
              </span>
            </div>
            <span className="text-slate-300">|</span>
            <div className="text-xs text-slate-500 font-medium">
              {outlet.name} - {outlet.area}
            </div>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-2">
            {/* Alert Toggle */}
            <button
              onClick={() => setIsAlertSoundOn(!isAlertSoundOn)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                isAlertSoundOn
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-slate-100 text-slate-500 border-slate-200'
              }`}
            >
              {isAlertSoundOn ? <Volume2 className="w-3.5 h-3.5 text-emerald-600" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
              <span>Alert: {isAlertSoundOn ? 'ON' : 'OFF'}</span>
            </button>

            {/* Test 3s Alert Button */}
            <button
              id="btn-test-alert"
              onClick={handleTestAlert}
              className="flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              <Bell className="w-3.5 h-3.5 text-amber-600" />
              <span>Test 3s Alert</span>
            </button>

            {/* Enable browser notifications + background audio */}
            {notifPerm !== 'granted' && notifPerm !== 'unsupported' && (
              <button
                id="btn-enable-alerts"
                onClick={() => void handleEnableAlerts()}
                className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-300 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer animate-pulse"
                title="Allow sound + popup alerts when this tab is in background"
              >
                <Bell className="w-3.5 h-3.5 text-blue-600" />
                <span>Enable Alerts</span>
              </button>
            )}

            {/* Refresh */}
            <button
              onClick={handleRefresh}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              title="Refresh Live Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>

            <SyncBadge />

            <span className="text-slate-200 mx-1">|</span>

            {/* Back to Store / Log Out */}
            <button
              onClick={onBackToStore}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
            >
              <Store className="w-3.5 h-3.5 text-amber-400" />
              <span>Back to Store</span>
            </button>

            {/* Outlet Logout */}
            <button
              onClick={onLogout}
              title={`Logout from ${outlet.shortName}`}
              className="flex items-center gap-1.5 bg-white hover:bg-red-50 text-slate-500 hover:text-[#ED1C24] px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-slate-200"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{outlet.shortName}</span>
            </button>
          </div>
        </header>

        {/* Dynamic Page Views */}
        <div className="p-3 max-w-7xl w-full mx-auto">
          {/* Sirf {outlet.shortName} ke orders — dusre outlet ka order yahan kabhi nahi dikhega. */}
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-2" />
              <span>{outlet.shortName} orders ({visibleOrders.length})</span>
            </div>
          </div>

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
            />
          )}

          {activeTab === 'delivery' && (
            <AdminDelivery
              orders={visibleOrders}
              onUpdateOrderStatus={onUpdateOrderStatus}
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
      />
    </div>
  );
};
