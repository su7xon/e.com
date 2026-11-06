import type { AdminOrder } from './adminData';
import { tableLabel, itemBuildText } from './adminData';
import { getOutletById, type BillHeader } from './outlets';

// Thermal 80mm bills — same-to-same like Rushda counter printouts.
// Bill 1 (customer): TAX INVOICE. Bill 2 (owner): KOT.
// Printed in background direct iframe so layout stays exact on thermal printer.

export interface ThermalLine {
  name: string;
  size: string;
  qty: number;
  rate: number;
  disPct: number;
  amt: number; // line net incl. tax
  /** Sauce / toppings / cheese — printed on the KOT so the kitchen can make it. */
  build?: string;
}

export interface ThermalBillData {
  serialNo: string; // e.g. "745" (numeric part of #7C-745)
  dateStr: string; // e.g. "15-Sep-26"
  timeStr: string; // e.g. "12:03:32"
  billTypeLabel: string; // DINE IN | CARRY OUT | HOME DELIVERY
  customerName: string;
  address: string;
  phone: string;
  soldBy: string;
  lines: ThermalLine[];
  totalQty: number;
  totalAmt: number; // sum of line amts
  gstTotal: number;
  grandTotal: number; // rounded
  discount?: number;
  discountLabel?: string;
  cgstBase: number;
  cgstAmt: number;
  sgstBase: number;
  sgstAmt: number;
  /** The store's own bill header; falls back to Unchapul's. */
  header?: BillHeader;
  /** GST rate of the store (0.05 = 2.5% CGST + 2.5% SGST). */
  gstRate?: number;
}

export const STORE_HEADER = {
  name: '7 CHEESE PIZZA',
  addr1: 'UNCHAPUL, NEAR TVS SHOWROOM,',
  addr2: 'HALDWANI, UTTARAKHAND',
  phone: 'Phone : 7900477999, 7900577999',
  gstin: '', // GSTIN removed as requested
  soldBy: 'person 1',
};

/** Bill header for a store (its own address, phones, GSTIN, FSSAI, heading). */
export function billHeaderFor(outletId?: string): BillHeader {
  const o = outletId ? getOutletById(outletId) : undefined;
  return (
    o?.bill ?? {
      title: 'TAX INVOICE',
      lines: [STORE_HEADER.addr1, STORE_HEADER.addr2],
      phones: STORE_HEADER.phone.replace('Phone : ', ''),
    }
  );
}

const pct = (rate: number) => `${+(rate * 50).toFixed(2)} %`;

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Bold sans-serif (like the stores' old billing software): thermal heads print thin fonts grey,
// so every line is bold and slightly larger. One slip per print job, so the printer cuts after each.
function shell(title: string, body: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
<style>
  @page { margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { background: #fff; }
  body {
    font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif;
    font-size: 13px; font-weight: 700; line-height: 1.35; color: #000;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .bill { width: 72mm; margin: 0 auto; padding: 3mm 2mm 8mm; }
  .c { text-align: center; }
  .r { text-align: right; }
  .b { font-weight: 900; }
  .brand { font-family: 'Times New Roman', Times, serif; font-size: 23px; font-weight: 900; letter-spacing: 0.3px; margin: 1px 0 2px; }
  .lg { font-size: 17px; font-weight: 900; }
  .xl { font-size: 22px; font-weight: 900; }
  .row { display: flex; justify-content: space-between; gap: 6px; }
  .gap { height: 8px; }
  hr { border: none; border-top: 1.5px solid #000; margin: 4px 0; }
  hr.dash { border-top-style: dashed; }
  /* Item columns: size | qty | rate | dis | amt */
  .cols { display: grid; grid-template-columns: 1fr 24px 36px 40px 58px; column-gap: 2px; }
  .cols > span:not(:first-child) { text-align: right; }
  .item { margin-top: 3px; }
  /* KOT table: item | size | qty, boxed like the old KOT */
  .kot { border: 1.5px solid #000; margin-top: 4px; }
  .kot .tr { display: grid; grid-template-columns: 1fr 64px 34px; border-top: 1.5px solid #000; }
  .kot .tr:first-child { border-top: none; }
  .kot .tr > span { padding: 3px 4px; }
  .kot .tr > span:last-child { border-left: 1.5px solid #000; text-align: center; }
  .kot .name { font-size: 14px; font-weight: 900; }
  .kot .build { font-size: 12px; font-weight: 700; display: block; }
  @media print { .bill { width: 100%; } }
</style></head><body><div class="bill">${body}</div>
<script>
  window._hasPrinted = false;
  window.doPrint = function () {
    if (window._hasPrinted) return;
    window._hasPrinted = true;
    window.focus();
    window.print();
  };
  window.onload = window.doPrint;
</script>
</body></html>`;
}

export function buildCustomerBillHtml(d: ThermalBillData): string {
  return shell(`Invoice ${d.serialNo}`, buildCustomerBody(d));
}

export function buildKotBillHtml(d: ThermalBillData): string {
  return shell(`KOT ${d.serialNo}`, buildKotBody(d));
}

/** Bill, then KOT — two separate print jobs, so the printer cuts between them. */
export function buildCombinedBillHtml(d: ThermalBillData): string[] {
  return [buildCustomerBillHtml(d), buildKotBillHtml(d)];
}

function buildCustomerBody(d: ThermalBillData): string {
  const lineHtml = d.lines.map((l) => `
    <div class="item">${esc(l.name)}</div>
    <div class="cols"><span>${esc((l.size || 'NA').toUpperCase())}</span><span>${l.qty}</span><span>${l.rate}</span><span>${l.disPct} %</span><span>${l.amt.toFixed(2)}</span></div>`
  ).join('');
  const h = d.header ?? billHeaderFor();
  const half = pct(d.gstRate ?? 0.05);
  return `
    <div class="c">${esc(h.title)}</div>
    ${h.subtitle ? `<div class="c">${esc(h.subtitle)}</div>` : ''}
    <div class="c brand">${STORE_HEADER.name}</div>
    ${h.lines.map((l) => `<div class="c">${esc(l)}</div>`).join('')}
    <div class="c">Phone : ${esc(h.phones)}</div>
    ${h.gstin ? `<div class="c">GSTIN : ${esc(h.gstin)}</div>` : ''}
    ${h.fssai ? `<div class="c">FSSAI No. : ${esc(h.fssai)}</div>` : ''}
    <div class="gap"></div>
    <div class="c">Bill Type : ${esc(d.billTypeLabel)}</div>
    <div class="row"><span>Invoice No. : ${esc(d.serialNo)}</span><span>Date ${esc(d.dateStr)}</span></div>
    <div>Customer Name : &nbsp;${esc(d.customerName)}</div>
    <div class="row"><span>Address : ${esc(d.address)}</span><span>Phone : ${esc(d.phone)}</span></div>
    <div class="gap"></div>
    <div>Sold by :</div>
    <div>${esc(d.soldBy)}</div>
    <hr class="dash">
    <div class="cols"><span>Item Name</span><span>Qty.</span><span>Rate</span><span>Dis.</span><span>Amt.</span></div>
    <hr class="dash">
    ${lineHtml}
    <hr>
    <div class="cols"><span>Total &nbsp;&nbsp;&nbsp;:</span><span>${d.totalQty}</span><span></span><span></span><span>${d.totalAmt.toFixed(2)}</span></div>
    <div>GST : &nbsp;${d.gstTotal.toFixed(2)}</div>
    ${d.discount ? `<div>Discount${d.discountLabel ? ` (${esc(d.discountLabel)})` : ''} : -${d.discount.toFixed(2)}</div>` : ''}
    <div class="row lg"><span></span><span>Grand Total &nbsp;&nbsp;${d.grandTotal.toFixed(2)}</span></div>
    ${d.gstTotal > 0 ? `<div>CGST ${d.cgstBase} @ ${half} : ${d.cgstAmt.toFixed(2)}</div>
    <div>SGST ${d.sgstBase} @ ${half} : ${d.sgstAmt.toFixed(2)}</div>` : ''}
    <hr class="dash">
    <div class="c">User : ${esc(d.soldBy)}</div>
    <div class="c b">THANKS FOR YOUR KIND VISIT</div>
    <div class="c b">GOOD DAY</div>`;
}

function buildKotBody(d: ThermalBillData): string {
  const rows = d.lines.map((l) => {
    // Size has its own column; the rest of the build (crust, sauce, toppings) goes under the name.
    const extra = (l.build || '').split(' • ').filter((s) => s && s !== l.size).join(' • ');
    return `
      <div class="tr"><span><span class="name">${esc(l.name)}</span>${extra ? `<span class="build">${esc(extra)}</span>` : ''}</span><span>${esc((l.size || 'NA').toUpperCase())}</span><span class="name">${l.qty}</span></div>`;
  }).join('');
  return `
    <div class="c xl">KOT</div>
    <div>Customer Name : &nbsp;${esc(d.customerName)}</div>
    <div class="row"><span></span><span>Date : ${esc(d.dateStr)}</span></div>
    <div class="kot">
      <div class="tr"><span>Item Name</span><span></span><span>Qty.</span></div>
      ${rows}
    </div>
    <div class="gap"></div>
    <div class="c lg">Bill Type : ${esc(d.billTypeLabel)}</div>
    <div class="c lg">KOT No. : ${esc(d.serialNo)}</div>
    <div class="c lg">Time : ${esc(d.timeStr)}</div>`;
}

// Online/counter order -> thermal print data (sales TAX INVOICE + KOT, single job)
export function orderToThermal(o: AdminOrder, soldBy?: string): ThermalBillData {
  const serial = o.orderNumber.replace('#7C-', '').replace('#', '');
  const now = new Date();
  const dateStr = o.billDateIso
    ? o.billDateIso.split('-').reverse().join('-')
    : now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }).replace(/ /g, '-');
  // GST rate as charged on the order (tax / items), so old orders print as they were billed.
  const rate = o.tax > 0 && o.subtotal > 0 ? Math.round((o.tax / Math.max(1, o.subtotal - (o.discount || 0))) * 100) / 100 : 0;
  const lines = (o.items || []).map((it) => ({
    name: (it.name || '').toUpperCase(),
    size: it.size || '',
    build: itemBuildText(it),
    qty: it.quantity,
    rate: it.price,
    disPct: 0,
    amt: Math.round(it.quantity * it.price * (1 + rate) * 100) / 100,
  }));
  const taxable = Math.max(0, o.subtotal - (o.discount || 0));
  const base = Math.round(taxable);
  const halfTax = Math.round(((o.tax || 0) / 2) * 100) / 100;
  return {
    serialNo: serial,
    dateStr,
    timeStr: o.createdAt || now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
    billTypeLabel: o.orderType === 'DELIVERY' ? 'HOME DELIVERY' : o.orderType === 'DINE_IN' ? 'DINE IN' : 'CARRY OUT',
    customerName: (o.customerName || 'WALK-IN').toUpperCase(),
    address: o.tableNumber ? tableLabel(o.tableNumber) : (o.address || ''),
    phone: o.customerPhone || o.partyPhone || '',
    soldBy: (soldBy || o.soldBy || 'Online').toUpperCase(),
    lines,
    totalQty: lines.reduce((s, l) => s + l.qty, 0),
    totalAmt: o.subtotal + (o.tax || 0),
    gstTotal: o.tax || 0,
    grandTotal: o.total,
    discount: o.discount || 0,
    discountLabel: o.discountLabel,
    cgstBase: base,
    cgstAmt: halfTax,
    sgstBase: base,
    sgstAmt: halfTax,
    header: billHeaderFor(o.outletId || 'outlet-1'),
    gstRate: rate || 0.05,
  };
}

let printQueue: Promise<void> = Promise.resolve();

/** Print one slip in a hidden frame; resolves once it has gone to the printer (or after a safety timeout). */
function printOne(html: string): Promise<void> {
  return new Promise((resolve) => {
    let iframe: HTMLIFrameElement | null = null;
    try {
      iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '1px';
      iframe.style.height = '1px';
      iframe.style.opacity = '0.01';
      iframe.style.border = '0';
      iframe.style.pointerEvents = 'none';
      document.body.appendChild(iframe);
      const win = iframe.contentWindow as (Window & { doPrint?: () => void }) | null;
      if (!win) throw new Error('no frame window');
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        // Give the printer a moment to take the job, then the next slip prints.
        window.setTimeout(resolve, 700);
        window.setTimeout(() => iframe?.remove(), 60_000);
      };
      win.addEventListener('afterprint', finish);
      win.document.open();
      win.document.write(html);
      win.document.close();
      window.setTimeout(() => {
        try {
          win.doPrint?.();
        } catch {
          // ignore
        }
        // print() returns once the job is sent (silent printing) or the print window is closed.
        finish();
      }, 250);
    } catch (err) {
      console.warn('Thermal direct iframe print failed, falling back to popup', err);
      iframe?.remove();
      const w = window.open('', '_blank', 'width=340,height=640');
      if (w) {
        w.document.write(html);
        w.document.close();
      }
      window.setTimeout(resolve, 1500);
    }
  });
}

/**
 * Print one slip, or several (bill then KOT) as separate jobs in order — each one is its own
 * print job, so a thermal printer with an auto-cutter cuts after every slip.
 */
export function printThermal(html: string | string[]): Promise<void> {
  const slips = Array.isArray(html) ? html : [html];
  slips.forEach((s) => {
    printQueue = printQueue.then(() => printOne(s));
  });
  return printQueue;
}
