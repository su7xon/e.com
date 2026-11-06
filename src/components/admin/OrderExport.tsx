import React, { useMemo, useState } from 'react';
import { Download, FileSpreadsheet, X, Loader2 } from 'lucide-react';
import { AdminOrder, ORDER_TYPE_META, localDateIso, orderTimeMs, tableLabel } from './adminData';

// Official SheetJS build, loaded only when someone exports (keeps it out of the main bundle).
const SHEETJS_URL = 'https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs';

type Preset = 'today' | 'yesterday' | 'week' | 'month' | 'lastMonth' | 'custom';

const PRESETS: { id: Preset; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: 'week', label: 'This week' },
  { id: 'month', label: 'This month' },
  { id: 'lastMonth', label: 'Last month' },
  { id: 'custom', label: 'Custom dates' },
];

/** [from, to] as local YYYY-MM-DD, inclusive. */
function presetRange(p: Preset, from: string, to: string): [string, string] {
  const d = new Date();
  const iso = localDateIso;
  switch (p) {
    case 'today':
      return [iso(d), iso(d)];
    case 'yesterday': {
      const y = new Date(d);
      y.setDate(d.getDate() - 1);
      return [iso(y), iso(y)];
    }
    case 'week': {
      const s = new Date(d);
      s.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // Monday
      return [iso(s), iso(d)];
    }
    case 'month':
      return [iso(new Date(d.getFullYear(), d.getMonth(), 1)), iso(d)];
    case 'lastMonth':
      return [iso(new Date(d.getFullYear(), d.getMonth() - 1, 1)), iso(new Date(d.getFullYear(), d.getMonth(), 0))];
    default:
      return [from || iso(d), to || iso(d)];
  }
}

const STATUS_TEXT: Record<AdminOrder['status'], string> = {
  NEW: 'New',
  KITCHEN: 'In kitchen',
  DISPATCHED: 'Out for delivery',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

const fmtDate = (ms: number) => new Date(ms).toLocaleDateString('en-GB'); // 14/10/2026
const fmtTime = (ms: number) => new Date(ms).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

/** Rows for the workbook — exported for testing. */
export function buildExportSheets(orders: AdminOrder[], periodLabel: string) {
  const sorted = [...orders].sort((a, b) => (orderTimeMs(a) ?? 0) - (orderTimeMs(b) ?? 0));
  const orderRows = sorted.map((o) => {
    const ms = orderTimeMs(o) ?? 0;
    return {
      'Order No.': o.orderNumber,
      Date: fmtDate(ms),
      Time: o.createdAt || fmtTime(ms),
      Type: ORDER_TYPE_META[o.orderType]?.short ?? o.orderType,
      'Table / Address': o.orderType === 'DINE_IN' ? tableLabel(o.tableNumber) : o.address || '',
      Customer: o.customerName || '',
      Phone: o.customerPhone || o.partyPhone || '',
      Items: (o.items || []).map((i) => `${i.quantity}x ${i.name}${i.size ? ` (${i.size})` : ''}`).join(', '),
      Subtotal: o.subtotal ?? 0,
      'Delivery Fee': o.deliveryFee ?? 0,
      Tax: o.tax ?? 0,
      Discount: o.discount ?? 0,
      Total: o.total ?? 0,
      Payment: o.paymentMethod,
      'Payment Status': o.paymentStatus === 'PAID' ? 'Paid' : 'Pending',
      'Order Status': STATUS_TEXT[o.status] ?? o.status,
    };
  });
  const itemRows = sorted.flatMap((o) => {
    const ms = orderTimeMs(o) ?? 0;
    return (o.items || []).map((i) => ({
      'Order No.': o.orderNumber,
      Date: fmtDate(ms),
      Type: ORDER_TYPE_META[o.orderType]?.short ?? o.orderType,
      Item: i.name,
      'Veg/Non-veg': i.isVeg ? 'Veg' : 'Non-veg',
      Size: i.size || '',
      Crust: i.crust || '',
      Sauce: i.sauce || '',
      Toppings: (i.toppings || []).join(', '),
      'Extra cheese': i.extraCheese ? 'Yes' : '',
      Qty: i.quantity,
      'Unit Price': i.price,
      'Line Total': i.price * i.quantity,
      'Order Status': STATUS_TEXT[o.status] ?? o.status,
    }));
  });

  const live = sorted.filter((o) => o.status !== 'CANCELLED');
  const sum = (list: AdminOrder[]) => list.reduce((s, o) => s + (o.total || 0), 0);
  const summary: (string | number)[][] = [
    ['7 Cheese Pizza — Orders report'],
    ['Period', periodLabel],
    ['Generated', new Date().toLocaleString('en-IN')],
    [],
    ['', 'Orders', 'Sales (₹)'],
    ['All (excluding cancelled)', live.length, sum(live)],
    ...(['DELIVERY', 'DINE_IN', 'TAKEAWAY'] as const).map((t) => {
      const l = live.filter((o) => o.orderType === t);
      return [ORDER_TYPE_META[t].short, l.length, sum(l)];
    }),
    [],
    ['Payment', 'Orders', 'Amount (₹)'],
    ...(['UPI', 'CARD', 'CASH'] as const).map((p) => {
      const l = live.filter((o) => o.paymentMethod === p);
      return [p, l.length, sum(l)];
    }),
    [],
    ['Cancelled orders', sorted.length - live.length, sum(sorted.filter((o) => o.status === 'CANCELLED'))],
  ];
  return { orderRows, itemRows, summary };
}

interface OrderExportProps {
  orders: AdminOrder[];
}

/** "Export Excel" button + window: pick a period and type, download a .xlsx. */
export const OrderExport: React.FC<OrderExportProps> = ({ orders }) => {
  const [open, setOpen] = useState(false);
  const [preset, setPreset] = useState<Preset>('today');
  const [from, setFrom] = useState(localDateIso());
  const [to, setTo] = useState(localDateIso());
  const [type, setType] = useState<'ALL' | AdminOrder['orderType']>('ALL');
  const [includeCancelled, setIncludeCancelled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const [rangeFrom, rangeTo] = presetRange(preset, from, to);

  const { matching, undated } = useMemo(() => {
    let undatedCount = 0;
    const list = orders.filter((o) => {
      const ms = orderTimeMs(o);
      if (ms === null) {
        undatedCount++;
        return false;
      }
      const day = o.billDateIso || localDateIso(new Date(ms));
      if (day < rangeFrom || day > rangeTo) return false;
      if (type !== 'ALL' && o.orderType !== type) return false;
      if (!includeCancelled && o.status === 'CANCELLED') return false;
      return true;
    });
    return { matching: list, undated: undatedCount };
  }, [orders, rangeFrom, rangeTo, type, includeCancelled]);

  const total = matching.filter((o) => o.status !== 'CANCELLED').reduce((s, o) => s + (o.total || 0), 0);
  const periodLabel = rangeFrom === rangeTo ? rangeFrom : `${rangeFrom} to ${rangeTo}`;

  const download = async () => {
    setBusy(true);
    setError('');
    try {
      const XLSX = await import(/* @vite-ignore */ SHEETJS_URL);
      const { orderRows, itemRows, summary } = buildExportSheets(matching, periodLabel);
      const wb = XLSX.utils.book_new();
      const wsOrders = XLSX.utils.json_to_sheet(orderRows);
      wsOrders['!cols'] = [12, 11, 9, 10, 34, 18, 13, 48, 9, 11, 7, 9, 9, 9, 13, 12].map((wch) => ({ wch }));
      XLSX.utils.book_append_sheet(wb, wsOrders, 'Orders');
      const wsItems = XLSX.utils.json_to_sheet(itemRows);
      wsItems['!cols'] = [12, 11, 10, 30, 11, 9, 16, 5, 10, 10, 12].map((wch) => ({ wch }));
      XLSX.utils.book_append_sheet(wb, wsItems, 'Items');
      const wsSummary = XLSX.utils.aoa_to_sheet(summary);
      wsSummary['!cols'] = [{ wch: 28 }, { wch: 22 }, { wch: 14 }];
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');
      XLSX.writeFile(wb, `7cheese-orders-${rangeFrom}${rangeFrom === rangeTo ? '' : `_to_${rangeTo}`}.xlsx`);
      setOpen(false);
    } catch {
      setError('Could not create the Excel file. Check your internet connection and try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        id="btn-export-excel"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-xl text-xs font-black transition-colors cursor-pointer shadow-xs"
      >
        <FileSpreadsheet className="w-4 h-4" />
        <span>Export Excel</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[70] bg-black/50 flex items-end sm:items-center justify-center" onClick={() => setOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Export orders to Excel"
            className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" /> Export orders
              </h3>
              <button onClick={() => setOpen(false)} aria-label="Close" className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="mt-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">Period</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPreset(p.id)}
                  className={`py-2 rounded-xl text-xs font-bold border cursor-pointer ${
                    preset === p.id ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            {preset === 'custom' && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <label className="text-[11px] font-bold text-slate-500">
                  From
                  <input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} className="mt-1 w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-900" />
                </label>
                <label className="text-[11px] font-bold text-slate-500">
                  To
                  <input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} className="mt-1 w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-900" />
                </label>
              </div>
            )}

            <p className="mt-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">Order type</p>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {(['ALL', 'DELIVERY', 'DINE_IN', 'TAKEAWAY'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`py-2 rounded-xl text-xs font-bold border cursor-pointer ${
                    type === t ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {t === 'ALL' ? 'All' : ORDER_TYPE_META[t].short}
                </button>
              ))}
            </div>

            <label className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer">
              <input type="checkbox" checked={includeCancelled} onChange={(e) => setIncludeCancelled(e.target.checked)} />
              Include cancelled orders
            </label>

            <div className="mt-4 rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs text-slate-700">
              <b>{matching.length}</b> orders · ₹{total} · {periodLabel}
              {undated > 0 && <div className="mt-1 text-[11px] text-slate-500">{undated} older order(s) have no saved date and aren’t included.</div>}
            </div>
            {error && <p className="mt-2 text-xs font-bold text-red-600">{error}</p>}

            <button
              id="btn-export-download"
              onClick={download}
              disabled={busy || matching.length === 0}
              className="mt-4 w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white py-3 rounded-xl text-sm font-black cursor-pointer disabled:cursor-not-allowed"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {matching.length === 0 ? 'No orders in this period' : 'Download .xlsx'}
            </button>
            <p className="mt-2 text-[11px] text-slate-400 text-center">Sheets: Orders · Items · Summary</p>
          </div>
        </div>
      )}
    </>
  );
};
