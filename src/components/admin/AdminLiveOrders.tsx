import React, { useState } from 'react';
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
  X
} from 'lucide-react';
import { AdminOrder } from './adminData';
import { playPosChime } from './audioAlert';

interface AdminLiveOrdersProps {
  orders: AdminOrder[];
  onUpdateOrderStatus: (orderId: string, newStatus: AdminOrder['status']) => void;
  onAddNewSampleOrder?: () => void;
}

export const AdminLiveOrders: React.FC<AdminLiveOrdersProps> = ({
  orders,
  onUpdateOrderStatus,
  onAddNewSampleOrder
}) => {
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'NEW' | 'KITCHEN' | 'DISPATCHED' | 'COMPLETED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKotOrder, setSelectedKotOrder] = useState<AdminOrder | null>(null);

  const filteredOrders = orders.filter((ord) => {
    if (activeFilter !== 'ALL' && ord.status !== activeFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        ord.orderNumber.toLowerCase().includes(q) ||
        ord.customerName.toLowerCase().includes(q) ||
        ord.customerPhone.includes(q)
      );
    }
    return true;
  });

  const countNew = orders.filter(o => o.status === 'NEW').length;
  const countKitchen = orders.filter(o => o.status === 'KITCHEN').length;
  const countDispatched = orders.filter(o => o.status === 'DISPATCHED').length;
  const countCompleted = orders.filter(o => o.status === 'COMPLETED').length;

  return (
    <div className="space-y-5">
      {/* Top Header & Quick Actions */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-black text-slate-900">
              Live Kitchen & Rider KOT Stream
            </h2>
            {countNew > 0 && (
              <span className="bg-[#ED1C24] text-white px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider animate-pulse">
                {countNew} NEW ORDERS
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage incoming live orders, send tickets to kitchen, track dispatch, and print KOTs
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => playPosChime(1500)}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-slate-200/60"
            title="Play Audio Chime"
          >
            <Volume2 className="w-3.5 h-3.5 text-amber-600" />
            <span>Test Sound Chime</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200/80 shadow-xs">
          {[
            { id: 'ALL', label: 'All Orders', count: orders.length },
            { id: 'NEW', label: 'New Tickets', count: countNew, badgeClass: 'bg-red-500 text-white' },
            { id: 'KITCHEN', label: 'In Kitchen', count: countKitchen, badgeClass: 'bg-amber-500 text-white' },
            { id: 'DISPATCHED', label: 'Dispatched / On Way', count: countDispatched, badgeClass: 'bg-blue-500 text-white' },
            { id: 'COMPLETED', label: 'Completed', count: countCompleted, badgeClass: 'bg-emerald-500 text-white' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as typeof activeFilter)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeFilter === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                tab.badgeClass || (activeFilter === tab.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600')
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search Box */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search order #, name or phone..."
            className="w-full bg-white border border-slate-200/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ED1C24] shadow-xs"
          />
        </div>
      </div>

      {/* Orders Grid */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
            <CheckCircle className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No Orders in this Status</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            All caught up! Any incoming customer orders placed on the storefront will appear here live.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredOrders.map((ord) => (
            <div
              key={ord.id}
              className={`bg-white rounded-2xl border p-4 shadow-xs transition-all flex flex-col justify-between ${
                ord.status === 'NEW' 
                  ? 'border-red-300 ring-2 ring-red-500/10' 
                  : ord.status === 'KITCHEN'
                  ? 'border-amber-300'
                  : 'border-slate-200/80'
              }`}
            >
              <div>
                {/* Card Top: Order Number, Type, and Time */}
                <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-sm text-slate-900">{ord.orderNumber}</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        ord.orderType === 'DELIVERY'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {ord.orderType === 'DELIVERY' ? <Bike className="w-3 h-3" /> : <UtensilsCrossed className="w-3 h-3" />}
                        <span>{ord.orderType === 'DELIVERY' ? 'Home Delivery' : (ord.tableNumber || 'Dine-In Table')}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                      <Clock className="w-3 h-3" />
                      <span>{ord.createdAt} ({ord.timeAgo})</span>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                    ord.status === 'NEW' ? 'bg-red-50 text-red-700 border border-red-200 animate-pulse' :
                    ord.status === 'KITCHEN' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                    ord.status === 'DISPATCHED' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                    'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}>
                    {ord.status}
                  </span>
                </div>

                {/* Customer Details */}
                <div className="py-2.5 text-xs text-slate-600 border-b border-slate-100 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{ord.customerName}</span>
                    <a href={`tel:${ord.customerPhone}`} className="flex items-center gap-1 text-slate-600 hover:text-slate-900">
                      <Phone className="w-3 h-3" />
                      <span>{ord.customerPhone}</span>
                    </a>
                  </div>
                  {ord.address && (
                    <div className="flex items-start gap-1.5 text-[11px] text-slate-500">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-1">{ord.address}</span>
                    </div>
                  )}
                </div>

                {/* Items List */}
                <div className="py-3 space-y-2 border-b border-slate-100">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Ordered Items ({ord.items.reduce((a, b) => a + b.quantity, 0)})
                  </div>
                  {ord.items.map((item, idx) => (
                    <div key={idx} className="flex items-start justify-between text-xs">
                      <div className="flex items-start gap-2">
                        <span className="w-4 h-4 rounded-xs border flex items-center justify-center shrink-0 mt-0.5 bg-slate-50 border-slate-300">
                          <span className={`w-1.5 h-1.5 rounded-full ${item.isVeg ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        </span>
                        <div>
                          <span className="font-bold text-slate-800">
                            {item.quantity}x {item.name}
                          </span>
                          {(item.size || item.crust) && (
                            <div className="text-[10px] text-slate-500">
                              {item.size} • {item.crust}
                            </div>
                          )}
                        </div>
                      </div>
                      <span className="font-bold text-slate-800 shrink-0">₹{item.price * item.quantity}</span>
                    </div>
                  ))}

                  {/* Cooking Instructions note */}
                  {ord.cookingNotes && (
                    <div className="mt-2 p-2 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-800 font-medium">
                      <span className="font-bold">Note: </span>
                      {ord.cookingNotes}
                    </div>
                  )}
                </div>

                {/* Amount & Payment Status */}
                <div className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Payment: </span>
                    <span className="font-bold text-slate-800">{ord.paymentMethod}</span>
                    <span className={`ml-1.5 px-1.5 py-0.2 rounded text-[9px] font-bold ${
                      ord.paymentStatus === 'PAID' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {ord.paymentStatus}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 mr-1">Total:</span>
                    <span className="text-sm font-black text-slate-900">₹{ord.total}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                <button
                  onClick={() => setSelectedKotOrder(ord)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer border border-slate-200/60"
                  title="Print KOT Receipt"
                >
                  <Printer className="w-4 h-4" />
                </button>

                {ord.status === 'NEW' && (
                  <>
                    <button
                      onClick={() => onUpdateOrderStatus(ord.id, 'KITCHEN')}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-[#ED1C24] hover:bg-[#c91430] text-white py-2 rounded-xl text-xs font-black transition-all cursor-pointer shadow-sm"
                    >
                      <ChefHat className="w-3.5 h-3.5" />
                      <span>Send to Kitchen</span>
                    </button>
                    <button
                      onClick={() => onUpdateOrderStatus(ord.id, 'CANCELLED')}
                      className="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                      title="Cancel Order"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                )}

                {ord.status === 'KITCHEN' && (
                  <button
                    onClick={() => onUpdateOrderStatus(ord.id, ord.orderType === 'DELIVERY' ? 'DISPATCHED' : 'COMPLETED')}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl text-xs font-black transition-all cursor-pointer shadow-sm"
                  >
                    {ord.orderType === 'DELIVERY' ? <Bike className="w-3.5 h-3.5" /> : <UtensilsCrossed className="w-3.5 h-3.5" />}
                    <span>{ord.orderType === 'DELIVERY' ? 'Dispatch Rider' : 'Table Served & Settle'}</span>
                  </button>
                )}

                {ord.status === 'DISPATCHED' && (
                  <button
                    onClick={() => onUpdateOrderStatus(ord.id, 'COMPLETED')}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-xl text-xs font-black transition-all cursor-pointer shadow-sm"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Mark Delivered & Settle</span>
                  </button>
                )}

                {ord.status === 'COMPLETED' && (
                  <div className="flex-1 flex items-center justify-center gap-1 text-emerald-600 text-xs font-bold py-1.5 bg-emerald-50 rounded-xl border border-emerald-200">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Order Settled</span>
                  </div>
                )}
              </div>
            </div>
          ))}
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
                <div className="text-[10px] text-slate-600">HALDWANI OUTLET (POS #1)</div>
                <div className="text-[10px] text-slate-600">KITCHEN ORDER TICKET (KOT)</div>
              </div>

              <div className="flex justify-between text-[11px] font-bold">
                <span>ORDER: {selectedKotOrder.orderNumber}</span>
                <span>{selectedKotOrder.orderType}</span>
              </div>
              <div className="text-[10px] text-slate-600">
                Time: {selectedKotOrder.createdAt} | Phone: {selectedKotOrder.customerPhone}
              </div>
              {selectedKotOrder.tableNumber && (
                <div className="text-xs font-black bg-amber-100 p-1 rounded text-center">
                  TABLE: {selectedKotOrder.tableNumber}
                </div>
              )}

              <div className="py-2 border-t border-b border-dashed border-slate-400 space-y-1.5">
                {selectedKotOrder.items.map((item, i) => (
                  <div key={i} className="flex justify-between">
                    <div>
                      <span className="font-bold">{item.quantity}x {item.name}</span>
                      {item.size && <div className="text-[9px] text-slate-500">[{item.size}]</div>}
                    </div>
                    <span>₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>

              {selectedKotOrder.cookingNotes && (
                <div className="text-[10px] font-sans italic bg-amber-50 p-1.5 border border-amber-200 rounded">
                  * Chef Note: {selectedKotOrder.cookingNotes}
                </div>
              )}

              <div className="space-y-0.5 text-right font-bold text-[11px]">
                <div className="flex justify-between text-[10px] text-slate-600">
                  <span>Subtotal:</span>
                  <span>₹{selectedKotOrder.subtotal}</span>
                </div>
                {selectedKotOrder.discount > 0 && (
                  <div className="flex justify-between text-[10px] text-emerald-600">
                    <span>Discount:</span>
                    <span>-₹{selectedKotOrder.discount}</span>
                  </div>
                )}
                <div className="flex justify-between text-[10px] text-slate-600">
                  <span>GST (5%):</span>
                  <span>₹{selectedKotOrder.tax}</span>
                </div>
                <div className="flex justify-between text-xs font-black border-t border-slate-400 pt-1">
                  <span>TOTAL:</span>
                  <span>₹{selectedKotOrder.total}</span>
                </div>
              </div>

              <div className="text-center text-[9px] text-slate-500 pt-2 border-t border-dashed border-slate-400">
                Thank you for choosing 7 Cheese Pizza!
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => {
                  window.print();
                  setSelectedKotOrder(null);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white py-2 rounded-xl text-xs font-bold cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Receipt</span>
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
      )}
    </div>
  );
};
