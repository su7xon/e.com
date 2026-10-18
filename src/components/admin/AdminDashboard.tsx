import React, { useMemo, useState } from 'react';
import { Bike, UtensilsCrossed, ShoppingBag, FileText } from 'lucide-react';
import {
  AdminOrder,
  ORDER_TYPE_META,
  SalesPeriod,
  formatTimeAgo,
  orderTimeMs,
  ordersInRange,
  periodRange,
  summarizeOrders,
  tableLabel,
} from './adminData';
import { OrderExport } from './OrderExport';

interface AdminDashboardProps {
  orders: AdminOrder[];
  onNavigateTab: (tab: 'dashboard' | 'live-orders' | 'menu' | 'coupons' | 'reports') => void;
  onOpenShiftModal: () => void;
}

const PERIODS: { id: SalesPeriod; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: 'week', label: 'Last 7 days' },
  { id: 'month', label: 'This month' },
  { id: 'all', label: 'All time' },
];

const STATUS_CHIP: Record<AdminOrder['status'], string> = {
  NEW: 'bg-red-50 text-red-700',
  KITCHEN: 'bg-amber-50 text-amber-800',
  DISPATCHED: 'bg-blue-50 text-blue-700',
  COMPLETED: 'bg-emerald-50 text-emerald-700',
  CANCELLED: 'bg-slate-100 text-slate-500',
};
const STATUS_TEXT: Record<AdminOrder['status'], string> = {
  NEW: 'New',
  KITCHEN: 'In kitchen',
  DISPATCHED: 'Out for delivery',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ orders, onNavigateTab, onOpenShiftModal }) => {
  const [period, setPeriod] = useState<SalesPeriod>('today');
  const inPeriod = useMemo(() => ordersInRange(orders, periodRange(period)), [orders, period]);
  const s = useMemo(() => summarizeOrders(inPeriod), [inPeriod]);
  const periodLabel = PERIODS.find((p) => p.id === period)?.label ?? '';
  const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;

  const typeCards = [
    { t: 'DELIVERY' as const, icon: Bike },
    { t: 'DINE_IN' as const, icon: UtensilsCrossed },
    { t: 'TAKEAWAY' as const, icon: ShoppingBag },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-slate-900">Sales overview</h2>
          <p className="text-xs text-slate-500">{periodLabel} · {s.count} orders · updates live</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl overflow-x-auto [scrollbar-width:none]">
            {PERIODS.map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                  period === p.id ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <OrderExport orders={orders} />
          <button
            onClick={onOpenShiftModal}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-700 text-white px-3 py-2 rounded-xl text-xs font-black cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            Day close report
          </button>
        </div>
      </div>

      {/* Headline numbers */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total sales', value: inr(s.gross), sub: `${s.count} orders` },
          { label: 'Average bill', value: inr(s.avg), sub: 'per order' },
          { label: 'Running now', value: String(s.running), sub: 'new, in kitchen or on the way' },
          { label: 'Tax collected', value: inr(s.gst), sub: s.gst ? 'on bills' : 'no GST on bills right now' },
        ].map((c) => (
          <div key={c.label} className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
            <div className="text-xs font-semibold text-slate-500">{c.label}</div>
            <div className="text-2xl font-black text-slate-900 leading-tight mt-0.5">{c.value}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">{c.sub}</div>
          </div>
        ))}
      </div>

      {/* By order type */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {typeCards.map(({ t, icon: Icon }) => {
          const m = ORDER_TYPE_META[t];
          const b = s.byType[t];
          return (
            <div key={t} className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
              <div className={`flex items-center gap-2 text-sm font-black ${m.tone}`}>
                <Icon className="w-4 h-4" />
                {m.label}
              </div>
              <div className="text-xl font-black text-slate-900 mt-1">{inr(b.total)}</div>
              <div className="mt-1 flex gap-3 text-[11px] text-slate-500">
                <span>
                  <b className="text-slate-800">{b.count}</b> orders
                </span>
                <span>
                  avg <b className="text-slate-800">{inr(b.count ? Math.round(b.total / b.count) : 0)}</b>
                </span>
                <span>
                  <b className="text-slate-800">{b.running}</b> running
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Payments */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
        <h3 className="text-sm font-black text-slate-900">Payments</h3>
        <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {[
            { label: 'UPI', v: s.byPay.UPI, c: 'text-emerald-700' },
            { label: 'Card', v: s.byPay.CARD, c: 'text-emerald-700' },
            { label: 'Cash', v: s.byPay.CASH, c: 'text-amber-700' },
            { label: 'Pending / credit', v: s.byPay.PENDING, c: 'text-red-600' },
          ].map((p) => (
            <div key={p.label} className="rounded-xl bg-slate-50 border border-slate-200 p-3">
              <div className="font-semibold text-slate-500">{p.label}</div>
              <div className={`text-base font-black ${p.c}`}>{inr(p.v)}</div>
            </div>
          ))}
        </div>
        {s.cancelled.length > 0 && (
          <p className="mt-2 text-[11px] text-slate-500">
            {s.cancelled.length} cancelled order(s) worth {inr(s.cancelledTotal)} are not counted in sales.
          </p>
        )}
      </div>

      {/* Recent orders */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-black text-slate-900">Recent orders</h3>
          <button
            onClick={() => onNavigateTab('live-orders')}
            className="text-xs font-bold text-[#ED1C24] hover:underline cursor-pointer"
          >
            Open Live Orders →
          </button>
        </div>
        {inPeriod.length === 0 ? (
          <p className="py-6 text-center text-xs text-slate-400">No orders in this period.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {[...inPeriod]
              .sort((a, b) => (orderTimeMs(b) ?? 0) - (orderTimeMs(a) ?? 0))
              .slice(0, 8)
              .map((o) => {
                const m = ORDER_TYPE_META[o.orderType];
                return (
                  <div key={o.id} className="py-2 flex items-center gap-3 text-xs">
                    <span className="font-mono font-black text-slate-900 w-24 shrink-0 truncate">{o.orderNumber}</span>
                    <span className={`shrink-0 px-2 py-0.5 rounded-md border text-[11px] font-bold ${m.chip}`}>
                      {o.orderType === 'DINE_IN' ? tableLabel(o.tableNumber) : m.short}
                    </span>
                    <span className="flex-1 min-w-0 truncate text-slate-600">
                      {o.customerName || 'Walk-in'}
                      <span className="hidden md:inline text-slate-400"> · {(o.items || []).map((i) => `${i.quantity}× ${i.name}`).join(', ')}</span>
                    </span>
                    <span className={`shrink-0 px-2 py-0.5 rounded-md text-[11px] font-bold ${STATUS_CHIP[o.status]}`}>{STATUS_TEXT[o.status]}</span>
                    <span className="shrink-0 font-black text-slate-900 w-14 text-right">{inr(o.total || 0)}</span>
                    <span className="shrink-0 text-slate-400 w-16 text-right hidden sm:inline">{formatTimeAgo(o.id, o.createdAt)}</span>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
};
