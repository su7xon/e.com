import React from 'react';
import { Bike, UtensilsCrossed, ShoppingBag, ChefHat, VolumeX, Volume2, Eye } from 'lucide-react';
import { AdminOrder, ORDER_TYPE_META, tableLabel, itemBuildText } from './adminData';

interface NewOrderAlertProps {
  order: AdminOrder | null;
  /** How many more new orders are waiting behind this one. */
  moreWaiting: number;
  muted: boolean;
  onAccept: (order: AdminOrder) => void;
  onView: (order: AdminOrder) => void;
  onToggleMute: () => void;
}

/** Full-screen "New order" card shown on any admin tab until the order is accepted or viewed. */
export const NewOrderAlert: React.FC<NewOrderAlertProps> = ({ order, moreWaiting, muted, onAccept, onView, onToggleMute }) => {
  if (!order) return null;
  const meta = ORDER_TYPE_META[order.orderType];
  const Icon = order.orderType === 'DELIVERY' ? Bike : order.orderType === 'DINE_IN' ? UtensilsCrossed : ShoppingBag;
  const headline =
    order.orderType === 'DINE_IN' ? `Dine-in · ${tableLabel(order.tableNumber)}` : order.orderType === 'DELIVERY' ? 'Home delivery' : 'Takeaway';

  return (
    <div className="fixed inset-0 z-[80] bg-black/70 flex items-center justify-center p-3" role="alertdialog" aria-modal="true" aria-label="New order">
      <div className={`w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border-t-8 ${meta.edge.replace('border-l-', 'border-t-')}`}>
        <div className="px-5 pt-4 flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 bg-[#ED1C24] text-white text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-full animate-pulse">
            🔔 New order
          </span>
          <button
            onClick={onToggleMute}
            className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-900 cursor-pointer"
            aria-label={muted ? 'Unmute alarm' : 'Mute alarm'}
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            {muted ? 'Muted' : 'Mute'}
          </button>
        </div>

        <div className="px-5 pt-3">
          <div className={`flex items-center gap-2 ${meta.tone}`}>
            <Icon className="w-7 h-7" />
            <span className="text-2xl font-black uppercase tracking-tight">{headline}</span>
          </div>
          <div className="mt-1 flex items-center gap-3 text-sm text-slate-600">
            <span className="font-mono font-black text-slate-900">{order.orderNumber}</span>
            <span>{order.createdAt}</span>
            <span>{order.customerName || 'Walk-in'}</span>
          </div>
          {order.orderType === 'DELIVERY' && order.address && (
            <p className="mt-2 text-sm text-slate-700 line-clamp-2">📍 {order.address}</p>
          )}

          <div className="mt-3 rounded-2xl bg-slate-50 border border-slate-200 p-3 space-y-1 max-h-48 overflow-y-auto">
            {(order.items || []).map((it, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-slate-800">
                  <b>{it.quantity}×</b> {it.name}
                  {itemBuildText(it) && <span className="text-slate-500 text-xs"> · {itemBuildText(it)}</span>}
                </span>
                <span className="font-bold text-slate-900 shrink-0 pl-2">₹{it.price * it.quantity}</span>
              </div>
            ))}
            {order.cookingNotes && <p className="pt-1 text-xs text-amber-800">Note: {order.cookingNotes}</p>}
          </div>
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-slate-500">
              {order.paymentMethod} · {order.paymentStatus === 'PAID' ? 'Paid' : 'Payment pending'}
            </span>
            <span className="text-xl font-black text-slate-900">₹{order.total}</span>
          </div>
        </div>

        <div className="p-5 pt-4 flex gap-2">
          <button
            onClick={() => onAccept(order)}
            className="flex-1 flex items-center justify-center gap-2 bg-[#ED1C24] hover:bg-[#c91430] text-white py-3.5 rounded-2xl text-sm font-black cursor-pointer shadow-lg"
          >
            <ChefHat className="w-5 h-5" />
            Accept · Send to kitchen
          </button>
          <button
            onClick={() => onView(order)}
            className="px-4 flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-sm font-bold cursor-pointer"
          >
            <Eye className="w-4 h-4" />
            View
          </button>
        </div>
        {moreWaiting > 0 && (
          <div className="bg-red-50 text-red-700 text-xs font-bold text-center py-2">+{moreWaiting} more new order{moreWaiting > 1 ? 's' : ''} waiting</div>
        )}
      </div>
    </div>
  );
};
