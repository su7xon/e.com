import React, { useMemo, useState } from 'react';
import { Printer, X } from 'lucide-react';
import {
  AdminOrder,
  ORDER_TYPE_META,
  localDateIso,
  orderTimeMs,
  ordersInRange,
  summarizeOrders,
  tableLabel,
} from './adminData';
import { printThermal } from './ThermalBills';

interface AdminReportsProps {
  orders: AdminOrder[];
  isOpen: boolean;
  onClose: () => void;
  /** Shown in the report header, e.g. "7 Cheese Pizza — Kaladhungi Road, Haldwani". */
  outletName?: string;
}

const STATUS_TEXT: Record<AdminOrder['status'], string> = {
  NEW: 'New',
  KITCHEN: 'In kitchen',
  DISPATCHED: 'Out for delivery',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;

/** Day-close (Z) report for one calendar day. */
export const AdminReports: React.FC<AdminReportsProps> = ({ orders, isOpen, onClose, outletName = '7 Cheese Pizza' }) => {
  const [day, setDay] = useState(localDateIso());
  const dayOrders = useMemo(
    () => ordersInRange(orders, [day, day]).sort((a, b) => (orderTimeMs(a) ?? 0) - (orderTimeMs(b) ?? 0)),
    [orders, day],
  );
  const s = useMemo(() => summarizeOrders(dayOrders), [dayOrders]);

  if (!isOpen) return null;

  const dayLabel = new Date(`${day}T12:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const where = (o: AdminOrder) =>
    o.orderType === 'DINE_IN' ? tableLabel(o.tableNumber) : ORDER_TYPE_META[o.orderType].short;

  const printReport = () => {
    const row = (cells: (string | number)[], bold = false) =>
      `<tr>${cells.map((c, i) => `<td style="text-align:${i ? 'right' : 'left'};${bold ? 'font-weight:700' : ''}">${c}</td>`).join('')}</tr>`;
    const ledger = dayOrders
      .map(
        (o) =>
          `<tr style="${o.status === 'CANCELLED' ? 'color:#999;text-decoration:line-through' : ''}"><td>${o.createdAt || ''}</td><td>${o.orderNumber}</td><td>${where(o)}</td><td>${o.paymentMethod}</td><td style="text-align:right">${inr(o.total || 0)}</td></tr>`,
      )
      .join('');
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Day close ${day}</title>
<style>body{font-family:Arial,sans-serif;font-size:12px;margin:16px;color:#111}h1{font-size:16px;margin:0}table{width:100%;border-collapse:collapse;margin-top:8px}td{padding:3px 4px;border-bottom:1px solid #eee}h2{font-size:13px;margin:14px 0 0}</style>
<script>function doPrint(){window.focus();window.print();}</script></head><body>
<h1>Day close report — ${dayLabel}</h1><div>${outletName}</div>
<h2>Sales</h2><table>
${row(['Total sales (excl. cancelled)', inr(s.gross)], true)}
${row(['Orders', s.count])}
${row(['Delivery', `${s.byType.DELIVERY.count} · ${inr(s.byType.DELIVERY.total)}`])}
${row(['Dine-in', `${s.byType.DINE_IN.count} · ${inr(s.byType.DINE_IN.total)}`])}
${row(['Takeaway', `${s.byType.TAKEAWAY.count} · ${inr(s.byType.TAKEAWAY.total)}`])}
${row(['Tax collected', inr(s.gst)])}
</table>
<h2>Payments</h2><table>
${row(['UPI', inr(s.byPay.UPI)])}${row(['Card', inr(s.byPay.CARD)])}${row(['Cash in drawer', inr(s.byPay.CASH)], true)}${row(['Pending / credit', inr(s.byPay.PENDING)])}
${row(['Cancelled', `${s.cancelled.length} · ${inr(s.cancelledTotal)}`])}
</table>
<h2>Orders (${dayOrders.length})</h2><table>${ledger}</table>
</body></html>`;
    printThermal(html);
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl relative border border-slate-200 my-8">
        <button onClick={onClose} aria-label="Close" className="absolute right-5 top-5 text-slate-400 hover:text-slate-600 cursor-pointer">
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="pb-4 border-b border-slate-200 pr-8">
          <div className="flex items-center gap-2">
            <span className="bg-[#ED1C24] text-white px-2 py-0.5 rounded text-[11px] font-black uppercase">Day close</span>
            <h2 className="text-lg sm:text-xl font-black text-slate-900">Day close report</h2>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span>{outletName}</span>
            <span>·</span>
            <input
              type="date"
              value={day}
              max={localDateIso()}
              onChange={(e) => e.target.value && setDay(e.target.value)}
              className="border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-900"
              aria-label="Report date"
            />
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5">
          {[
            { label: 'Total sales', v: inr(s.gross), sub: `${s.count} orders`, c: 'text-slate-900' },
            { label: 'Delivery', v: inr(s.byType.DELIVERY.total), sub: `${s.byType.DELIVERY.count} orders`, c: 'text-blue-700' },
            { label: 'Dine-in', v: inr(s.byType.DINE_IN.total), sub: `${s.byType.DINE_IN.count} orders`, c: 'text-amber-700' },
            { label: 'Takeaway', v: inr(s.byType.TAKEAWAY.total), sub: `${s.byType.TAKEAWAY.count} orders`, c: 'text-violet-700' },
          ].map((c) => (
            <div key={c.label} className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200">
              <div className="text-[11px] font-bold text-slate-500 uppercase">{c.label}</div>
              <div className={`text-lg font-black mt-0.5 ${c.c}`}>{c.v}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">{c.sub}</div>
            </div>
          ))}
        </div>

        {/* Payments */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 mb-5">
          <div className="text-xs font-bold text-slate-700 mb-3">Payments</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {[
              { label: 'UPI', v: s.byPay.UPI, c: 'text-emerald-700' },
              { label: 'Card', v: s.byPay.CARD, c: 'text-emerald-700' },
              { label: 'Cash in drawer', v: s.byPay.CASH, c: 'text-amber-700' },
              { label: 'Pending / credit', v: s.byPay.PENDING, c: 'text-red-600' },
            ].map((p) => (
              <div key={p.label} className="bg-white p-3 rounded-xl border border-slate-200">
                <div className="font-semibold text-slate-500">{p.label}</div>
                <div className={`text-sm font-black ${p.c}`}>{inr(p.v)}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500">
            <span>Tax collected: <b className="text-slate-800">{inr(s.gst)}</b></span>
            {s.cancelled.length > 0 && (
              <span>
                Cancelled: <b className="text-slate-800">{s.cancelled.length}</b> ({inr(s.cancelledTotal)}, not counted)
              </span>
            )}
          </div>
        </div>

        {/* Ledger */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden mb-5">
          <div className="bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 border-b border-slate-200">
            Orders on {dayLabel} ({dayOrders.length})
          </div>
          <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 text-xs">
            {dayOrders.length === 0 ? (
              <p className="px-4 py-6 text-center text-slate-400">No orders on this day.</p>
            ) : (
              dayOrders.map((o) => (
                <div key={o.id} className={`px-4 py-2 flex items-center gap-3 ${o.status === 'CANCELLED' ? 'text-slate-400 line-through' : ''}`}>
                  <span className="w-16 shrink-0 text-slate-500">{o.createdAt}</span>
                  <span className="font-mono font-bold text-slate-800 w-24 shrink-0 truncate">{o.orderNumber}</span>
                  <span className={`shrink-0 px-1.5 rounded border text-[11px] font-bold ${ORDER_TYPE_META[o.orderType].chip}`}>{where(o)}</span>
                  <span className="flex-1 min-w-0 truncate text-slate-500">{STATUS_TEXT[o.status]}</span>
                  <span className="text-[11px] text-slate-500 shrink-0">{o.paymentMethod}</span>
                  <span className="font-black text-slate-900 shrink-0 w-14 text-right">{inr(o.total || 0)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={printReport}
            className="flex-1 flex items-center justify-center gap-2 bg-[#ED1C24] hover:bg-[#c91430] text-white py-3 rounded-xl text-xs font-black shadow-md transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print day close report</span>
          </button>
          <button onClick={onClose} className="px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
