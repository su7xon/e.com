import React, { useState } from 'react';
import {
  Bike,
  Phone,
  MapPin,
  Navigation,
  MessageCircle,
  ExternalLink,
  Clock,
  Check,
  ChefHat,
  Search,
  CheckCircle,
} from 'lucide-react';
import { AdminOrder } from './adminData';

interface AdminDeliveryProps {
  orders: AdminOrder[];
  onUpdateOrderStatus: (orderId: string, newStatus: AdminOrder['status']) => void;
}

type DeliveryFilter = 'READY' | 'ONWAY' | 'DONE' | 'ALL';

export const AdminDelivery: React.FC<AdminDeliveryProps> = ({
  orders,
  onUpdateOrderStatus,
}) => {
  const [filter, setFilter] = useState<DeliveryFilter>('READY');
  const [searchQuery, setSearchQuery] = useState('');

  // Sirf HOME DELIVERY orders — dine-in / takeaway yahan nahi.
  const deliveries = orders.filter((o) => o.orderType === 'DELIVERY');

  const filtered = deliveries.filter((o) => {
    if (filter === 'READY' && !(o.status === 'NEW' || o.status === 'KITCHEN')) return false;
    if (filter === 'ONWAY' && o.status !== 'DISPATCHED') return false;
    if (filter === 'DONE' && o.status !== 'COMPLETED') return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const phone = (o.customerPhone || '').toLowerCase();
      return (
        o.orderNumber.toLowerCase().includes(q) ||
        (o.customerName || '').toLowerCase().includes(q) ||
        phone.includes(q) ||
        (o.address || '').toLowerCase().includes(q) ||
        (o.landmark || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const countReady = deliveries.filter((o) => o.status === 'NEW' || o.status === 'KITCHEN').length;
  const countOnWay = deliveries.filter((o) => o.status === 'DISPATCHED').length;
  const countDone = deliveries.filter((o) => o.status === 'COMPLETED').length;

  const mapsLink = (o: AdminOrder) =>
    o.mapsUrl ||
    (o.deliveryLat && o.deliveryLng
      ? `https://www.google.com/maps/search/?api=1&query=${o.deliveryLat},${o.deliveryLng}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(o.address || o.customerName || '')}`);

  const waDigits = (phone: string) => phone.replace(/\D/g, '').replace(/^91/, '');

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs">
        <div className="flex items-center gap-2">
          <Bike className="w-5 h-5 text-[#ED1C24]" />
          <h2 className="text-base sm:text-lg font-black text-slate-900">Delivery — Rider Queue</h2>
          {countOnWay > 0 && (
            <span className="bg-blue-600 text-white px-2 py-0.5 rounded-full text-[10px] font-black uppercase animate-pulse">
              {countOnWay} ON WAY
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          Delivery boy view: address, landmark, phone, Maps navigate — sab ek jagah.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200/80 shadow-xs">
          {[
            { id: 'READY', label: 'Ready to Dispatch', count: countReady },
            { id: 'ONWAY', label: 'On Way', count: countOnWay },
            { id: 'DONE', label: 'Delivered', count: countDone },
            { id: 'ALL', label: 'All Deliveries', count: deliveries.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as DeliveryFilter)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filter === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                filter === tab.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search order, name, phone, landmark..."
            className="w-full bg-white border border-slate-200/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ED1C24] shadow-xs"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
            <CheckCircle className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No deliveries here</h3>
          <p className="text-xs text-slate-500 mt-1">Filter badlo ya naye delivery orders ka wait karo.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((o) => (
            <div key={o.id} className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                  <div>
                    <span className="font-mono font-black text-sm text-slate-900">{o.orderNumber}</span>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                      <Clock className="w-3 h-3" />
                      <span>{o.createdAt} ({o.timeAgo})</span>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                    o.status === 'NEW' ? 'bg-red-50 text-red-700 border border-red-200 animate-pulse' :
                    o.status === 'KITCHEN' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                    o.status === 'DISPATCHED' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                    'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}>
                    {o.status}
                  </span>
                </div>

                <div className="py-3 border-b border-slate-100 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-900 text-sm">{o.customerName || 'Walk-in Customer'}</span>
                    {o.customerPhone ? (
                      <a
                        href={`tel:${o.customerPhone}`}
                        className="flex items-center gap-1.5 text-sm font-black text-white bg-emerald-600 px-3 py-2 rounded-xl hover:bg-emerald-700"
                      >
                        <Phone className="w-4 h-4" />
                        <span>Call</span>
                      </a>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-bold">No phone</span>
                    )}
                  </div>
                  {o.customerPhone && (
                    <div className="text-xs text-slate-500 font-mono">{o.customerPhone}</div>
                  )}
                  {o.address && (
                    <div className="flex items-start gap-1.5 text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                      <MapPin className="w-4 h-4 text-[#ED1C24] shrink-0 mt-0.5" />
                      <span>{o.address}</span>
                    </div>
                  )}
                  {o.landmark && (
                    <div className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-2.5 py-2">
                      Landmark: {o.landmark}
                    </div>
                  )}
                  {(o.deliveryLat && o.deliveryLng) && (
                    <span className="inline-block bg-blue-50 text-blue-700 border border-blue-200 text-[9px] font-black px-1.5 py-0.5 rounded uppercase">
                      GPS Pinned
                    </span>
                  )}
                </div>

                <div className="py-2.5 text-xs text-slate-600">
                  {o.items.reduce((a, b) => a + b.quantity, 0)} items • ₹{o.total} • {o.paymentMethod} ({o.paymentStatus})
                </div>

                <div className="grid grid-cols-2 gap-2 pb-1">
                  <a
                    href={mapsLink(o)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-700 text-white py-2.5 rounded-xl text-xs font-black transition-colors"
                  >
                    <Navigation className="w-4 h-4" />
                    <span>Navigate</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  {o.customerPhone ? (
                    <a
                      href={`https://wa.me/91${waDigits(o.customerPhone)}?text=${encodeURIComponent(`Namaste! 7 Cheese Pizza rider (${o.orderNumber}). Apni live location share karein taaki rider seedha pahunche.`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 py-2.5 rounded-xl text-xs font-black hover:bg-emerald-100 transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Live Location</span>
                    </a>
                  ) : (
                    <div className="flex items-center justify-center text-[11px] text-slate-400 font-bold border border-slate-200 rounded-xl">
                      No WhatsApp
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100">
                {(o.status === 'NEW' || o.status === 'KITCHEN') && (
                  <button
                    onClick={() => onUpdateOrderStatus(o.id, 'DISPATCHED')}
                    className="w-full flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer"
                  >
                    <Bike className="w-4 h-4" />
                    <span>Dispatch Rider</span>
                  </button>
                )}
                {o.status === 'DISPATCHED' && (
                  <button
                    onClick={() => onUpdateOrderStatus(o.id, 'COMPLETED')}
                    className="w-full flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Mark Delivered</span>
                  </button>
                )}
                {o.status === 'COMPLETED' && (
                  <div className="w-full flex items-center justify-center gap-1 text-emerald-600 text-xs font-bold py-2 bg-emerald-50 rounded-xl border border-emerald-200">
                    <CheckCircle className="w-4 h-4" />
                    <span>Delivered</span>
                  </div>
                )}
                {(o.status === 'NEW' || o.status === 'KITCHEN') && (
                  <button
                    onClick={() => onUpdateOrderStatus(o.id, 'KITCHEN')}
                    className="w-full mt-2 flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer"
                  >
                    <ChefHat className="w-3.5 h-3.5" />
                    <span>Send to Kitchen first</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
