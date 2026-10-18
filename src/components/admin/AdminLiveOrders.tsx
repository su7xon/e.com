import React, { useEffect, useState } from 'react';
import {
  Bike,
  UtensilsCrossed,
  Clock,
  ChefHat,
  CheckCircle,
  XCircle,
  Printer,
  Phone,
  MapPin,
  Receipt,
  Volume2,
  AlertCircle,
  Flame,
  Search,
  Check,
  X,
  Trash2,
  ShoppingBag
} from 'lucide-react';
import { AdminOrder, formatTimeAgo, orderTimeMs, ORDER_TYPE_META, tableLabel, itemBuildText } from './adminData';
import { playPosChime } from './audioAlert';
import { getOutletById } from './outlets';
import {
  STORE_HEADER,
  buildCustomerBillHtml,
  buildKotBillHtml,
  buildCombinedBillHtml,
  printThermal,
  orderToThermal,
  type ThermalBillData,
} from './ThermalBills';

interface AdminLiveOrdersProps {
  orders: AdminOrder[];
  onUpdateOrderStatus: (orderId: string, newStatus: AdminOrder['status']) => void;
  onDeleteOrder?: (orderId: string) => void;
  onAddNewSampleOrder?: () => void;
  /** Extra buttons for the header (e.g. Export to Excel). */
  headerActions?: React.ReactNode;
}

export const AdminLiveOrders: React.FC<AdminLiveOrdersProps> = ({
  orders,
  onUpdateOrderStatus,
  onDeleteOrder,
  headerActions,
}) => {
  const [activeFilter, setActiveFilter] = useState<'ALL' | AdminOrder['status']>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | AdminOrder['orderType']>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKotOrder, setSelectedKotOrder] = useState<AdminOrder | null>(null);

  // Ticks so "waiting N min" stays current.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const fmtWait = (m: number) =>
    m < 60 ? `${m} min` : m < 1440 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${Math.floor(m / 1440)} day${m >= 2880 ? 's' : ''}`;

  const STATUS_RANK: Record<AdminOrder['status'], number> = { NEW: 0, KITCHEN: 1, DISPATCHED: 2, COMPLETED: 3, CANCELLED: 4 };
  const typeScoped = orders.filter((o) => typeFilter === 'ALL' || o.orderType === typeFilter);

  const filteredOrders = typeScoped
    .filter((ord) => {
      if (activeFilter !== 'ALL' && ord.status !== activeFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          ord.orderNumber.toLowerCase().includes(q) ||
          (ord.customerName || '').toLowerCase().includes(q) ||
          (ord.customerPhone || '').includes(q) ||
          (ord.tableNumber || '').toLowerCase().includes(q)
        );
      }
      return true;
    })
    // Open orders first (oldest = most urgent on top); finished ones newest first.
    .sort((x, y) => {
      const r = STATUS_RANK[x.status] - STATUS_RANK[y.status];
      if (r !== 0) return r;
      const tx = orderTimeMs(x) ?? 0;
      const ty = orderTimeMs(y) ?? 0;
      return STATUS_RANK[x.status] <= 1 ? tx - ty : ty - tx;
    });

  const count = (s: AdminOrder['status']) => typeScoped.filter((o) => o.status === s).length;
  const countNew = orders.filter((o) => o.status === 'NEW').length;
  const typeCount = (t: AdminOrder['orderType']) => orders.filter((o) => o.orderType === t).length;

  const statusStyle: Record<AdminOrder['status'], string> = {
    NEW: 'bg-red-50 text-red-700 border-red-200',
    KITCHEN: 'bg-amber-50 text-amber-800 border-amber-200',
    DISPATCHED: 'bg-blue-50 text-blue-700 border-blue-200',
    COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    CANCELLED: 'bg-slate-100 text-slate-500 border-slate-300 line-through',
  };
  const statusLabel: Record<AdminOrder['status'], string> = {
    NEW: 'New',
    KITCHEN: 'In kitchen',
    DISPATCHED: 'Out for delivery',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-black text-slate-900">Live Orders</h2>
            {countNew > 0 && (
              <span className="bg-[#ED1C24] text-white px-2 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider animate-pulse">
                {countNew} new
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Send new orders to the kitchen, dispatch deliveries, settle tables and print bills.</p>
        </div>
        {headerActions && <div className="flex items-center gap-2">{headerActions}</div>}
      </div>

      {/* Type filter */}
      <div className="flex flex-wrap items-center gap-2">
        {([
          { id: 'ALL', label: 'All types', icon: null, n: orders.length },
          { id: 'DELIVERY', label: 'Delivery', icon: Bike, n: typeCount('DELIVERY') },
          { id: 'DINE_IN', label: 'Dine-in', icon: UtensilsCrossed, n: typeCount('DINE_IN') },
          { id: 'TAKEAWAY', label: 'Takeaway', icon: ShoppingBag, n: typeCount('TAKEAWAY') },
        ] as const).map((tp) => {
          const active = typeFilter === tp.id;
          const meta = tp.id === 'ALL' ? null : ORDER_TYPE_META[tp.id];
          const Icon = tp.icon;
          return (
            <button
              key={tp.id}
              onClick={() => setTypeFilter(tp.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                active ? (meta ? meta.chip + ' ring-2 ring-offset-1 ring-current' : 'bg-slate-900 text-white border-slate-900') : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {Icon && <Icon className="w-3.5 h-3.5" />}
              <span>{tp.label}</span>
              <span className="text-[11px] opacity-70">{tp.n}</span>
            </button>
          );
        })}
      </div>

      {/* Status tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200/80 shadow-xs overflow-x-auto [scrollbar-width:none]">
          {[
            { id: 'ALL', label: 'All', count: typeScoped.length },
            { id: 'NEW', label: 'New', count: count('NEW'), badgeClass: 'bg-red-500 text-white' },
            { id: 'KITCHEN', label: 'In kitchen', count: count('KITCHEN'), badgeClass: 'bg-amber-500 text-white' },
            { id: 'DISPATCHED', label: 'Out for delivery', count: count('DISPATCHED'), badgeClass: 'bg-blue-500 text-white' },
            { id: 'COMPLETED', label: 'Completed', count: count('COMPLETED'), badgeClass: 'bg-emerald-500 text-white' },
            { id: 'CANCELLED', label: 'Cancelled', count: count('CANCELLED'), badgeClass: 'bg-slate-400 text-white' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as typeof activeFilter)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeFilter === tab.id ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 rounded-full text-[11px] font-black ${
                tab.badgeClass || (activeFilter === tab.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600')
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="relative sm:min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search order no., name, phone or table…"
            className="w-full bg-white border border-slate-200/80 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ED1C24] shadow-xs"
          />
        </div>
      </div>

      {/* Orders Grid */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
            <CheckCircle className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No orders here</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            New orders from the website, table QR codes and the counter appear here as they come in.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredOrders.map((ord) => {
            const meta = ORDER_TYPE_META[ord.orderType];
            const placedMs = orderTimeMs(ord);
            const waitingMin = placedMs ? Math.max(0, Math.floor((now - placedMs) / 60_000)) : null;
            const isOpen = ord.status === 'NEW' || ord.status === 'KITCHEN';
            const TypeIcon = ord.orderType === 'DELIVERY' ? Bike : ord.orderType === 'DINE_IN' ? UtensilsCrossed : ShoppingBag;
            return (
              <div
                key={ord.id}
                className={`bg-white rounded-2xl border border-l-[6px] ${meta.edge} p-4 shadow-xs transition-all flex flex-col justify-between ${
                  ord.status === 'NEW' ? 'border-red-300 ring-2 ring-red-500/15' : 'border-slate-200/80'
                } ${ord.status === 'CANCELLED' ? 'opacity-70' : ''}`}
              >
                <div>
                  {/* Type headline — readable from across the counter */}
                  <div className={`flex items-center justify-between gap-2 ${meta.tone}`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <TypeIcon className="w-5 h-5 shrink-0" />
                      <span className="text-base font-black truncate">
                        {ord.orderType === 'DINE_IN'
                          ? `Dine-in · ${tableLabel(ord.tableNumber)}`
                          : ord.orderType === 'DELIVERY'
                          ? 'Home delivery'
                          : 'Takeaway'}
                      </span>
                    </div>
                    <span className={`shrink-0 px-2 py-0.5 rounded-md text-[11px] font-black uppercase tracking-wider border ${statusStyle[ord.status]} ${ord.status === 'NEW' ? 'animate-pulse' : ''}`}>
                      {statusLabel[ord.status]}
                    </span>
                  </div>

                  {/* Number, time, waiting */}
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 pb-3 border-b border-slate-100">
                    <button
                      onClick={() => setSelectedKotOrder(ord)}
                      className="font-mono font-black text-sm text-slate-900 hover:underline cursor-pointer"
                      title="Preview bill"
                    >
                      {ord.orderNumber}
                    </button>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {ord.createdAt}
                    </span>
                    {isOpen && waitingMin !== null && (
                      <span className={`font-bold ${waitingMin >= 20 ? 'text-red-600' : waitingMin >= 10 ? 'text-amber-600' : 'text-slate-600'}`}>
                        waiting {fmtWait(waitingMin)}
                      </span>
                    )}
                    {!isOpen && <span>{formatTimeAgo(ord.id, ord.timeAgo)}</span>}
                  </div>

                  {/* Customer + where it goes */}
                  <div className="py-2.5 text-xs text-slate-600 border-b border-slate-100 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-900 truncate">{ord.customerName || 'Walk-in customer'}</span>
                      {ord.customerPhone ? (
                        <a href={`tel:${ord.customerPhone}`} className="flex items-center gap-1 text-slate-700 hover:text-slate-900 font-semibold shrink-0">
                          <Phone className="w-3.5 h-3.5" />
                          <span>{ord.customerPhone}</span>
                        </a>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-semibold">No phone</span>
                      )}
                    </div>
                    {ord.orderType === 'DELIVERY' && ord.address && (
                      <div className="rounded-lg bg-blue-50/60 border border-blue-100 p-2 space-y-1">
                        <div className="flex items-start gap-1.5 text-slate-700">
                          <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{ord.address}</span>
                        </div>
                        {ord.landmark && <div className="pl-5 text-[11px] text-slate-500">Landmark: {ord.landmark}</div>}
                        {ord.mapsUrl && (
                          <a href={ord.mapsUrl} target="_blank" rel="noreferrer" className="pl-5 text-[11px] font-bold text-blue-700 hover:underline">
                            Open in Maps ↗
                          </a>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Items */}
                  <div className="py-3 space-y-2 border-b border-slate-100">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Items ({(ord.items || []).reduce((a, b2) => a + b2.quantity, 0)})
                    </div>
                    {(ord.items || []).map((item, idx) => (
                      <div key={idx} className="flex items-start justify-between text-xs">
                        <div className="flex items-start gap-2">
                          <span className="w-4 h-4 rounded-xs border flex items-center justify-center shrink-0 mt-0.5 bg-slate-50 border-slate-300">
                            <span className={`w-1.5 h-1.5 rounded-full ${item.isVeg ? 'bg-emerald-500' : 'bg-red-500'}`} />
                          </span>
                          <div>
                            <span className="font-bold text-slate-800">
                              {item.quantity}× {item.name}
                            </span>
                            {itemBuildText(item) && <div className="text-[11px] text-slate-500">{itemBuildText(item)}</div>}
                          </div>
                        </div>
                        <span className="font-bold text-slate-800 shrink-0">₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                    {ord.cookingNotes && (
                      <div className="mt-2 p-2 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-800 font-medium">
                        <span className="font-bold">Note: </span>
                        {ord.cookingNotes}
                      </div>
                    )}
                  </div>

                  {/* Amount & payment */}
                  <div className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-800">{ord.paymentMethod}</span>
                      <span className={`px-1.5 rounded text-[11px] font-bold ${
                        ord.paymentStatus === 'PAID' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {ord.paymentStatus === 'PAID' ? 'Paid' : 'Payment pending'}
                      </span>
                    </div>
                    <span className="text-base font-black text-slate-900">₹{ord.total}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                  <button
                    onClick={() => printThermal(buildCombinedBillHtml(orderToThermal(ord)))}
                    className="p-2 rounded-xl bg-slate-900 hover:bg-slate-700 text-white transition-colors cursor-pointer border border-slate-900"
                    title="Print bill + KOT"
                  >
                    <Printer className="w-4 h-4" />
                  </button>

                  {ord.status === 'NEW' && (
                    <>
                      <button
                        onClick={() => onUpdateOrderStatus(ord.id, 'KITCHEN')}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-[#ED1C24] hover:bg-[#c91430] text-white py-2 rounded-xl text-xs font-black transition-all cursor-pointer shadow-sm"
                      >
                        <ChefHat className="w-4 h-4" />
                        <span className="whitespace-nowrap">Send to kitchen</span>
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Cancel order ${ord.orderNumber}?`)) onUpdateOrderStatus(ord.id, 'CANCELLED');
                        }}
                        className="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 text-xs font-bold transition-colors cursor-pointer"
                        title="Cancel order"
                      >
                        Cancel
                      </button>
                    </>
                  )}

                  {ord.status === 'KITCHEN' && (
                    <button
                      onClick={() => onUpdateOrderStatus(ord.id, ord.orderType === 'DELIVERY' ? 'DISPATCHED' : 'COMPLETED')}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl text-xs font-black transition-all cursor-pointer shadow-sm"
                    >
                      <TypeIcon className="w-4 h-4" />
                      <span className="whitespace-nowrap">
                        {ord.orderType === 'DELIVERY' ? 'Hand to rider' : ord.orderType === 'DINE_IN' ? 'Served · Settle' : 'Handed over'}
                      </span>
                    </button>
                  )}

                  {ord.status === 'DISPATCHED' && (
                    <button
                      onClick={() => onUpdateOrderStatus(ord.id, 'COMPLETED')}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-xl text-xs font-black transition-all cursor-pointer shadow-sm"
                    >
                      <Check className="w-4 h-4" />
                      <span className="whitespace-nowrap">Delivered · Settle</span>
                    </button>
                  )}

                  {(ord.status === 'COMPLETED' || ord.status === 'CANCELLED') && (
                    <div className={`flex-1 flex items-center justify-center gap-1 text-xs font-bold py-2 rounded-xl border ${
                      ord.status === 'COMPLETED' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-slate-500 bg-slate-50 border-slate-200'
                    }`}>
                      {ord.status === 'COMPLETED' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      <span>{ord.status === 'COMPLETED' ? 'Settled' : 'Cancelled'}</span>
                    </div>
                  )}

                  {onDeleteOrder && (
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete order ${ord.orderNumber}? It will be removed from all devices.`)) onDeleteOrder(ord.id);
                      }}
                      className="p-2 rounded-xl text-slate-300 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      title="Delete order permanently"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* KOT Print Thermal Receipt Modal */}
      {selectedKotOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl relative border border-slate-200">
            {/* Close Button */}
            <button
              onClick={() => setSelectedKotOrder(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Thermal Receipt Paper Style */}
            <div className="bg-slate-50 border border-slate-300 p-4 rounded-xl font-mono text-xs text-slate-900 space-y-3">
              <div className="text-center pb-2 border-b border-dashed border-slate-400">
                <div className="font-black text-sm">7 CHEESE PIZZA</div>
                <div className="text-[11px] text-slate-600">{(selectedKotOrder.outletId && getOutletById(selectedKotOrder.outletId)?.area) || `${STORE_HEADER.addr1} ${STORE_HEADER.addr2}`}</div>
                <div className="text-[11px] text-slate-600">KITCHEN ORDER TICKET (KOT)</div>
              </div>

              <div className="flex justify-between text-[11px] font-bold">
                <span>ORDER: {selectedKotOrder.orderNumber}</span>
                <span>{selectedKotOrder.orderType}</span>
              </div>
              <div className="text-[11px] text-slate-600">
                Time: {selectedKotOrder.createdAt} | Phone: {selectedKotOrder.customerPhone || '—'}
              </div>
              {selectedKotOrder.address && (
                <div className="text-[11px] font-sans bg-blue-50 p-1.5 border border-blue-200 rounded">
                  <span className="font-bold">Deliver: </span>{selectedKotOrder.address}
                  {selectedKotOrder.landmark && <span className="font-bold"> | Landmark: {selectedKotOrder.landmark}</span>}
                </div>
              )}
              {selectedKotOrder.tableNumber && (
                <div className="text-xs font-black bg-amber-100 p-1 rounded text-center">
                  TABLE: {selectedKotOrder.tableNumber}
                </div>
              )}

              <div className="py-2 border-t border-b border-dashed border-slate-400 space-y-1.5">
                {(selectedKotOrder.items || []).map((item, i) => (
                  <div key={i} className="flex justify-between">
                    <div>
                      <span className="font-bold">{item.quantity}x {item.name}</span>
                      {item.size && <div className="text-[11px] text-slate-500">[{item.size}]</div>}
                    </div>
                    <span>₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>

              {selectedKotOrder.cookingNotes && (
                <div className="text-[11px] font-sans italic bg-amber-50 p-1.5 border border-amber-200 rounded">
                  * Chef Note: {selectedKotOrder.cookingNotes}
                </div>
              )}

              <div className="space-y-0.5 text-right font-bold text-[11px]">
                <div className="flex justify-between text-[11px] text-slate-600">
                  <span>Subtotal:</span>
                  <span>₹{selectedKotOrder.subtotal}</span>
                </div>
                {selectedKotOrder.discount > 0 && (
                  <div className="flex justify-between text-[11px] text-emerald-600">
                    <span>Discount{selectedKotOrder.discountLabel ? ` (${selectedKotOrder.discountLabel})` : ''}:</span>
                    <span>-₹{selectedKotOrder.discount}</span>
                  </div>
                )}
                <div className="flex justify-between text-[11px] text-slate-600">
                  <span>Taxes &amp; charges:</span>
                  <span>₹{selectedKotOrder.tax}</span>
                </div>
                <div className="flex justify-between text-xs font-black border-t border-slate-400 pt-1">
                  <span>TOTAL:</span>
                  <span>₹{selectedKotOrder.total}</span>
                </div>
              </div>

              <div className="text-center text-[11px] text-slate-500 pt-2 border-t border-dashed border-slate-400">
                Thank you for choosing 7 Cheese Pizza!
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2">
              <button
                onClick={() => {
                  if (selectedKotOrder) printThermal(buildCombinedBillHtml(orderToThermal(selectedKotOrder)));
                  setSelectedKotOrder(null);
                }}
                className="w-full flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl text-xs font-black cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Both — Sales + KOT</span>
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (selectedKotOrder) printThermal(buildCustomerBillHtml(orderToThermal(selectedKotOrder)));
                    setSelectedKotOrder(null);
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white py-2 rounded-xl text-xs font-bold cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Sales Only</span>
                </button>
                <button
                  onClick={() => {
                    if (selectedKotOrder) printThermal(buildKotBillHtml(orderToThermal(selectedKotOrder)));
                    setSelectedKotOrder(null);
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 py-2 rounded-xl text-xs font-bold cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>KOT Only</span>
                </button>
                <button
                  onClick={() => setSelectedKotOrder(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
