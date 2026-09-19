// Thermal 80mm bills — same-to-same like Rushda counter printouts.
// Bill 1 (customer): TAX INVOICE. Bill 2 (owner): KOT.
// Printed in isolated popup window so layout stays exact on thermal printer.

export interface ThermalLine {
  name: string;
  size: string;
  qty: number;
  rate: number;
  disPct: number;
  amt: number; // line net incl. tax
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
  cgstBase: number;
  cgstAmt: number;
  sgstBase: number;
  sgstAmt: number;
}

export const STORE_HEADER = {
  name: '7 CHEESE PIZZA',
  addr1: 'UNCHAPUL, NEAR TVS SHOWROOM,',
  addr2: 'HALDWANI, UTTARAKHAND',
  phone: 'Phone : 7900477999, 7900577999',
  gstin: 'GSTIN : 05FVRPS1331D4ZH',
  soldBy: 'person 1',
};

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function shell(title: string, body: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Courier New', Courier, monospace; font-size: 12px; color: #000; background: #fff; }
  .bill { width: 272px; margin: 0 auto; padding: 8px 6px; }
  .c { text-align: center; }
  .b { font-weight: bold; }
  .row { display: flex; justify-content: space-between; }
  hr { border: none; border-top: 1px dashed #000; margin: 6px 0; }
  .lg { font-size: 16px; }
  @media print { body { margin: 0; } .bill { width: 100%; } }
</style></head><body><div class="bill">${body}</div>
<script>window.onload = function () { window.focus(); window.print(); };</script>
</body></html>`;
}

export function buildCustomerBillHtml(d: ThermalBillData): string {
  const lineHtml = d.lines.map((l) => `
    <div>${esc(l.name)}</div>
    <div class="row"><span>${esc(l.size)}</span><span>${l.qty}</span><span>${l.rate}</span><span>${l.disPct} %</span><span>${l.amt.toFixed(2)}</span></div>`
  ).join('');
  const body = `
    <div class="c">TAX INVOICE</div>
    <div class="c b lg">${STORE_HEADER.name}</div>
    <div class="c">${STORE_HEADER.addr1}</div>
    <div class="c">${STORE_HEADER.addr2}</div>
    <div class="c">${STORE_HEADER.phone}</div>
    <div class="c">${STORE_HEADER.gstin}</div>
    <br>
    <div class="c">Bill Type : ${esc(d.billTypeLabel)}</div>
    <div class="row"><span>Invoice No. : ${esc(d.serialNo)}</span><span>Date ${esc(d.dateStr)}</span></div>
    <div>Customer Name : &nbsp; ${esc(d.customerName)}</div>
    <div class="row"><span>Address : ${esc(d.address)}</span><span>Phone : ${esc(d.phone)}</span></div>
    <br><br>
    <div>Sold by :</div>
    <div>${esc(d.soldBy)}</div>
    <hr>
    <div class="row"><span>Item Name</span><span>Qty. &nbsp; Rate &nbsp; Dis. &nbsp;&nbsp;&nbsp;&nbsp; Amt.</span></div>
    <hr>
    ${lineHtml}
    <div class="row"><span>Total &nbsp;&nbsp;&nbsp;&nbsp; :</span><span>${d.totalQty}</span><span>&nbsp;</span><span>&nbsp;</span><span>${d.totalAmt.toFixed(2)}</span></div>
    <div>GST : ${d.gstTotal.toFixed(2)}</div>
    <div class="row"><span>&nbsp;</span><span>Grand Total &nbsp;&nbsp;&nbsp;&nbsp; ${d.grandTotal.toFixed(2)}</span></div>
    <div>CGST ${d.cgstBase} @ 2.5 % : ${d.cgstAmt.toFixed(2)}</div>
    <div>SGST ${d.sgstBase} @ 2.5 % : ${d.sgstAmt.toFixed(2)}</div>
    <hr>
    <div class="c">User : ${esc(d.soldBy)}</div>
    <div class="c b">THANKS FOR YOUR KIND VISIT</div>
    <div class="c b">GOOD DAY</div>`;
  return shell(`Invoice ${d.serialNo}`, body);
}

export function buildKotBillHtml(d: ThermalBillData): string {
  const rows = d.lines.map((l) => `
    <div class="row" style="border-top:1px solid #000;"><span>${esc(l.name)}<br>${esc(l.size)}</span><span>${l.qty}</span></div>`
  ).join('');
  const body = `
    <div class="c b lg">KOT</div>
    <div>Customer Name : &nbsp; ${esc(d.customerName)}</div>
    <div class="row"><span>&nbsp;</span><span>Date : ${esc(d.dateStr)}</span></div>
    <div style="border:1px solid #000; border-bottom:none;">
      <div class="row" style="border-bottom:1px solid #000;"><span>Item Name</span><span>Qty.</span></div>
      ${rows}
    </div>
    <br>
    <div class="c">Bill Type : ${esc(d.billTypeLabel)}</div>
    <div class="c">KOT No. : ${esc(d.serialNo)}</div>
    <div class="c">Time : ${esc(d.timeStr)}</div>`;
  return shell(`KOT ${d.serialNo}`, body);
}

export function printThermal(html: string) {
  const w = window.open('', '_blank', 'width=340,height=640');
  if (!w) return;
  w.document.write(html);
  w.document.close();
}
