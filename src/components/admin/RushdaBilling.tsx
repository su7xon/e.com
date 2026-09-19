import React, { useMemo, useState } from 'react';
import {
  Receipt,
  UtensilsCrossed,
  Bike,
  BookUser,
  Tags,
  TableProperties,
  FileSpreadsheet,
  Printer,
  Download,
  Plus,
  Trash2,
  Pencil,
  X,
  Search,
} from 'lucide-react';
import type { MenuItem } from '../../types';
import type { AdminOrder } from './adminData';
import type { Outlet } from './outlets';
import {
  STORE_HEADER,
  buildCustomerBillHtml,
  buildKotBillHtml,
  printThermal,
  type ThermalBillData,
} from './ThermalBills';

type BillMode = 'SALE' | 'KOT' | 'HOME';
type ModuleKey = BillMode | 'ITEM' | 'PARTY' | 'OFFER' | 'REPORT';
type ReportView = 'detail' | 'summary' | 'category' | 'tax';

interface Party {
  id: string;
  name: string;
  phone: string;
  address: string;
  kind: 'TABLE' | 'CUSTOMER';
}

interface Offer {
  code: string;
  title: string;
  type: 'percentage' | 'flat';
  value: number;
  minOrder: number;
}

interface BillLine {
  key: string;
  menuId: string;
  name: string;
  category: string;
  size: string;
  unit: string;
  qty: number;
  rate: number;
  disPct: number;
  taxPct: number;
}

interface ArchivedBill {
  orderId: string;
  orderNumber: string;
  billDateIso: string;
  partyName: string;
  partyPhone: string;
  saleType: 'CASH' | 'CREDIT';
  orderType: AdminOrder['orderType'];
  lines: BillLine[];
  extraDisPct: number;
  status: AdminOrder['status'];
}

interface RushdaBillingProps {
  outlet: Outlet;
  orders: AdminOrder[];
  menuItems: MenuItem[];
  onCreateOrder: (order: AdminOrder) => void;
  onAddItem: (item: MenuItem) => void;
  onUpdateItem: (item: MenuItem) => void;
  onDeleteItem: (id: string) => void;
}

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as T;
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // quota full — run in memory
  }
}

const todayIso = () => new Date().toISOString().slice(0, 10);

function downloadCsv(filename: string, rows: (string | number)[][]) {
  const esc = (v: string | number) => {
    const s = String(v);
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  const csv = rows.map((r) => r.map(esc).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const DEFAULT_PARTIES: Party[] = [
  { id: 'p-walkin', name: 'TABAL NO', phone: '', address: 'Counter', kind: 'TABLE' },
  { id: 'p-t1', name: 'TABLE NO 1', phone: '', address: 'Dine-in', kind: 'TABLE' },
  { id: 'p-t2', name: 'TABLE NO 2', phone: '', address: 'Dine-in', kind: 'TABLE' },
  { id: 'p-cash', name: 'CASH SALE', phone: '', address: 'Takeaway', kind: 'CUSTOMER' },
];

const DEFAULT_OFFERS: Offer[] = [
  { code: 'EXTRA5', title: 'Extra 5% off', type: 'percentage', value: 5, minOrder: 199 },
  { code: 'FLAT50', title: 'Flat ₹50 off', type: 'flat', value: 50, minOrder: 499 },
];

export const RushdaBilling: React.FC<RushdaBillingProps> = ({
  outlet,
  orders,
  menuItems,
  onCreateOrder,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
}) => {
  const [module, setModule] = useState<ModuleKey>('SALE');
  const billMode: BillMode = module === 'SALE' || module === 'KOT' || module === 'HOME' ? module : 'SALE';

  // ---- masters (persisted) ----
  const [parties, setParties] = useState<Party[]>(() => load('seven_cheese_parties', DEFAULT_PARTIES));
  const [offers, setOffers] = useState<Offer[]>(() => load('seven_cheese_offers', DEFAULT_OFFERS));
  const [unitMap, setUnitMap] = useState<Record<string, string>>(() => load('seven_cheese_unit_map', {}));
  const [taxMap, setTaxMap] = useState<Record<string, number>>(() => load('seven_cheese_tax_map', {}));
  const [archive, setArchive] = useState<ArchivedBill[]>(() => load('seven_cheese_counter_bills', []));

  const persistParties = (next: Party[]) => { setParties(next); save('seven_cheese_parties', next); };
  const persistOffers = (next: Offer[]) => { setOffers(next); save('seven_cheese_offers', next); };

  // ---- billing state ----
  const [partyId, setPartyId] = useState(parties[0]?.id ?? 'p-walkin');
  const [saleType, setSaleType] = useState<'CASH' | 'CREDIT'>('CASH');
  const [tableNo, setTableNo] = useState('');
  const [phoneNo, setPhoneNo] = useState('');
  const [lines, setLines] = useState<BillLine[]>([]);
  const [extraDisPct, setExtraDisPct] = useState(0);
  const [extraFlat, setExtraFlat] = useState(0);
  const [discountFix, setDiscountFix] = useState(false);
  const [itemSearch, setItemSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [quickQty, setQuickQty] = useState(1);
  const [quickRate, setQuickRate] = useState<number | ''>('');
  const [quickItemId, setQuickItemId] = useState('');
  const [lastBillNo, setLastBillNo] = useState<string | null>(null);
  const [lastBill, setLastBill] = useState<ThermalBillData | null>(null);

  const fmtBillDate = (d: Date) => {
    const mon = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()];
    return `${String(d.getDate()).padStart(2, '0')}-${mon}-${String(d.getFullYear()).slice(2)}`;
  };

  const activeParty = parties.find((p) => p.id === partyId) ?? parties[0];

  const categories = useMemo(
    () => Array.from(new Set(menuItems.map((m) => m.category))).sort(),
    [menuItems]
  );

  const filteredMenu = useMemo(() => {
    const q = itemSearch.trim().toLowerCase();
    return menuItems.filter((m) => {
      if (catFilter !== 'all' && m.category !== catFilter) return false;
      if (!q) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q)
      );
    }).slice(0, 60);
  }, [menuItems, itemSearch, catFilter]);

  const addLine = (menu: MenuItem, qty = 1, rateOverride?: number) => {
    const rate = rateOverride ?? menu.price;
    const size = menu.defaultSize ?? 'NA';
    setLines((prev) => {
      const idx = prev.findIndex((l) => l.menuId === menu.id && l.rate === rate && l.size === size);
      if (idx > -1) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + qty };
        return next;
      }
      return [...prev, {
        key: `${menu.id}-${Date.now()}`,
        menuId: menu.id,
        name: menu.name,
        category: menu.category,
        size,
        unit: unitMap[menu.id] ?? 'NA',
        qty,
        rate,
        disPct: 0,
        taxPct: taxMap[menu.id] ?? 5,
      }];
    });
  };

  const totals = useMemo(() => {
    let gross = 0;
    let lineDis = 0;
    let tax = 0;
    lines.forEach((l) => {
      const amt = l.qty * l.rate;
      const dis = discountFix ? 0 : (amt * l.disPct) / 100;
      gross += amt;
      lineDis += dis;
      tax += ((amt - dis) * l.taxPct) / 100;
    });
    const extraPctAmt = (gross * extraDisPct) / 100;
    const net = Math.max(0, gross - lineDis - extraPctAmt - extraFlat + tax);
    return { gross, lineDis, tax, extraPctAmt, net };
  }, [lines, extraDisPct, extraFlat, discountFix]);

  const nextBillSerial = () => {
    const cur = load('seven_cheese_bill_serial', 705);
    const next = cur + 1;
    save('seven_cheese_bill_serial', next);
    return next;
  };

  const clearBill = () => {
    setLines([]);
    setExtraDisPct(0);
    setExtraFlat(0);
    setPhoneNo('');
    setTableNo('');
    setQuickItemId('');
    setQuickRate('');
    setQuickQty(1);
  };

  const handleSaveBill = (printKot: boolean) => {
    if (!lines.length) return;
    const serial = nextBillSerial();
    const orderNumber = `#7C-${serial}`;
    const iso = todayIso();
    const orderType: AdminOrder['orderType'] =
      billMode === 'HOME' ? 'DELIVERY' : billMode === 'KOT' ? 'DINE_IN' : 'TAKEAWAY';
    const discount = Math.round(totals.lineDis + totals.extraPctAmt + extraFlat);
    const order: AdminOrder = {
      id: `ord-${Date.now()}`,
      orderNumber,
      outletId: outlet.id,
      customerName: activeParty?.name ?? 'CASH SALE',
      customerPhone: phoneNo || activeParty?.phone || '',
      orderType,
      address: billMode === 'HOME' ? activeParty?.address : tableNo ? `Table ${tableNo}` : activeParty?.address,
      tableNumber: billMode === 'KOT' && tableNo ? `Table ${tableNo}` : undefined,
      items: lines.map((l) => ({
        name: l.name,
        quantity: l.qty,
        price: l.rate,
        isVeg: true,
        size: l.size,
      })),
      subtotal: Math.round(totals.gross),
      deliveryFee: 0,
      tax: Math.round(totals.tax),
      discount,
      total: Math.round(totals.net),
      paymentMethod: 'CASH',
      paymentStatus: saleType === 'CREDIT' ? 'PENDING' : 'PAID',
      status: printKot ? 'KITCHEN' : 'NEW',
      createdAt: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      timeAgo: 'Just now',
      billDateIso: iso,
      saleType,
      partyPhone: phoneNo || activeParty?.phone,
    };
    const archived: ArchivedBill = {
      orderId: order.id,
      orderNumber,
      billDateIso: iso,
      partyName: order.customerName,
      partyPhone: order.customerPhone,
      saleType,
      orderType,
      lines,
      extraDisPct,
      status: order.status,
    };
    const nextArchive = [archived, ...archive];
    setArchive(nextArchive);
    save('seven_cheese_counter_bills', nextArchive);
    onCreateOrder(order);
    setLastBillNo(orderNumber);
    // Thermal print data (same-to-same counter slips)
    const now = new Date();
    const taxable = Math.max(0, totals.gross - totals.lineDis - totals.extraPctAmt - extraFlat);
    const base = Math.round(taxable);
    const thermal: ThermalBillData = {
      serialNo: String(serial),
      dateStr: fmtBillDate(now),
      timeStr: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
      billTypeLabel: billMode === 'KOT' ? 'DINE IN' : billMode === 'HOME' ? 'HOME DELIVERY' : 'CARRY OUT',
      customerName: (activeParty?.name ?? 'CASH SALE').toUpperCase(),
      address: tableNo ? `Table ${tableNo}` : (activeParty?.address ?? ''),
      phone: phoneNo || activeParty?.phone || '',
      soldBy: STORE_HEADER.soldBy,
      lines: lines.map((l) => {
        const amt = l.qty * l.rate;
        const dis = discountFix ? 0 : (amt * l.disPct) / 100;
        const tax = ((amt - dis) * l.taxPct) / 100;
        return { name: l.name.toUpperCase(), size: l.size, qty: l.qty, rate: l.rate, disPct: discountFix ? 0 : l.disPct, amt: amt - dis + tax };
      }),
      totalQty: lines.reduce((s, l) => s + l.qty, 0),
      totalAmt: totals.gross - totals.lineDis + totals.tax,
      gstTotal: totals.tax,
      grandTotal: Math.round(totals.net),
      cgstBase: base,
      cgstAmt: base * 0.025,
      sgstBase: base,
      sgstAmt: base * 0.025,
    };
    setLastBill(thermal);
    clearBill();
    // Bill 1 (customer TAX INVOICE) on Save, Bill 2 (owner KOT) on Save+KOT
    printThermal(printKot ? buildKotBillHtml(thermal) : buildCustomerBillHtml(thermal));
  };

  // ---- item master form ----
  const [fCode, setFCode] = useState('');
  const [fCat, setFCat] = useState('veg-pizza');
  const [fName, setFName] = useState('');
  const [fSize, setFSize] = useState('REGULAR');
  const [fUnit, setFUnit] = useState('NA');
  const [fRate, setFRate] = useState<number | ''>('');
  const [fTax, setFTax] = useState<number | ''>(5);
  const [masterSearch, setMasterSearch] = useState('');

  const resetItemForm = () => {
    setFCode(''); setFCat('veg-pizza'); setFName('');
    setFSize('REGULAR'); setFUnit('NA'); setFRate(''); setFTax(5);
  };

  const handleSaveItem = () => {
    const code = fCode.trim().toLowerCase().replace(/\s+/g, '-');
    if (!code || !fName.trim() || fRate === '') return;
    const existing = menuItems.find((m) => m.id === code);
    const payload: MenuItem = {
      id: code,
      name: fName.trim(),
      category: fCat as MenuItem['category'],
      isVeg: true,
      price: Number(fRate),
      description: fName.trim(),
      image: existing?.image ?? '/images/seven_cheese_pizza_1788869697088.jpg',
      isCustomizable: existing?.isCustomizable ?? false,
    };
    if (existing) onUpdateItem(payload);
    else onAddItem(payload);
    const nu = { ...unitMap, [code]: fUnit };
    const nt = { ...taxMap, [code]: Number(fTax) || 0 };
    setUnitMap(nu); setTaxMap(nt);
    save('seven_cheese_unit_map', nu); save('seven_cheese_tax_map', nt);
    resetItemForm();
  };

  const masterRows = useMemo(() => {
    const q = masterSearch.trim().toLowerCase();
    if (!q) return menuItems;
    return menuItems.filter((m) =>
      m.id.toLowerCase().includes(q) || m.name.toLowerCase().includes(q) || m.category.toLowerCase().includes(q)
    );
  }, [menuItems, masterSearch]);

  // ---- party / offer forms ----
  const [pName, setPName] = useState('');
  const [pPhone, setPPhone] = useState('');
  const [pAddr, setPAddr] = useState('');
  const [oCode, setOCode] = useState('');
  const [oTitle, setOTitle] = useState('');
  const [oType, setOType] = useState<'percentage' | 'flat'>('percentage');
  const [oValue, setOValue] = useState<number | ''>('');
  const [oMin, setOMin] = useState<number | ''>('');

  // ---- sale report ----
  const [repFrom, setRepFrom] = useState(todayIso());
  const [repTo, setRepTo] = useState(todayIso());
  const [repSaleType, setRepSaleType] = useState('all');
  const [repCat, setRepCat] = useState('all');
  const [repItem, setRepItem] = useState('');
  const [repSize, setRepSize] = useState('all');
  const [repPhone, setRepPhone] = useState('');
  const [repCash, setRepCash] = useState(true);
  const [repCredit, setRepCredit] = useState(true);
  const [repCancel, setRepCancel] = useState(false);
  const [repView, setRepView] = useState<ReportView>('detail');
  const [repTaxMode, setRepTaxMode] = useState<'with' | 'without' | 'both'>('both');

  interface RepRow {
    date: string;
    sno: string;
    party: string;
    category: string;
    item: string;
    size: string;
    qty: number;
    rate: number;
    amount: number;
    disPct: number;
    taxPct: number;
    tax: number;
    net: number;
  }

  const reportRows: RepRow[] = useMemo(() => {
    const rows: RepRow[] = [];
    const inRange = (iso: string) => iso >= repFrom && iso <= repTo;
    // full-fidelity counter bills first
    archive.forEach((b) => {
      if (!inRange(b.billDateIso)) return;
      if (repSaleType !== 'all' && b.saleType !== repSaleType) return;
      if (!repCash && b.saleType === 'CASH') return;
      if (!repCredit && b.saleType === 'CREDIT') return;
      if (!repCancel && b.status === 'CANCELLED') return;
      if (repPhone && !b.partyPhone.includes(repPhone)) return;
      b.lines.forEach((l) => {
        if (repCat !== 'all' && l.category !== repCat) return;
        if (repSize !== 'all' && l.size !== repSize) return;
        if (repItem && !l.name.toLowerCase().includes(repItem.toLowerCase())) return;
        const amount = l.qty * l.rate;
        const dis = (amount * l.disPct) / 100;
        const tax = ((amount - dis) * l.taxPct) / 100;
        rows.push({
          date: b.billDateIso, sno: b.orderNumber, party: b.partyName,
          category: l.category, item: l.name, size: l.size,
          qty: l.qty, rate: l.rate, amount, disPct: l.disPct,
          taxPct: l.taxPct, tax, net: amount - dis + tax,
        });
      });
    });
    // online / legacy orders without archive entry (fallback, no double count)
    const archivedIds = new Set(archive.map((a) => a.orderId));
    orders.forEach((o) => {
      if (archivedIds.has(o.id)) return;
      const iso = o.billDateIso ?? todayIso();
      if (!inRange(iso)) return;
      const st = o.saleType ?? (o.paymentStatus === 'PENDING' ? 'CREDIT' : 'CASH');
      if (repSaleType !== 'all' && st !== repSaleType) return;
      if (!repCash && st === 'CASH') return;
      if (!repCredit && st === 'CREDIT') return;
      if (!repCancel && o.status === 'CANCELLED') return;
      if (repPhone && !(o.customerPhone || '').includes(repPhone)) return;
      o.items.forEach((it) => {
        const menu = menuItems.find((m) => m.name === it.name);
        const cat = menu?.category ?? '-';
        const size = it.size ?? 'NA';
        if (repCat !== 'all' && cat !== repCat) return;
        if (repSize !== 'all' && size !== repSize) return;
        if (repItem && !it.name.toLowerCase().includes(repItem.toLowerCase())) return;
        const amount = it.quantity * it.price;
        const tax = (amount * 5) / 100;
        rows.push({
          date: iso, sno: o.orderNumber, party: o.customerName,
          category: cat, item: it.name, size,
          qty: it.quantity, rate: it.price, amount,
          disPct: 0, taxPct: 5, tax, net: amount + tax,
        });
      });
    });
    return rows;
  }, [archive, orders, menuItems, repFrom, repTo, repSaleType, repCat, repItem, repSize, repPhone, repCash, repCredit, repCancel]);

  const summaryRows = useMemo(() => {
    if (repView === 'detail') return reportRows;
    const map = new Map<string, RepRow>();
    reportRows.forEach((r) => {
      const key = repView === 'summary' ? r.item : repView === 'category' ? r.category : 'TAX';
      const prev = map.get(key);
      if (!prev) {
        map.set(key, { ...r, item: repView === 'summary' ? r.item : key, party: '-', sno: '-' });
      } else {
        prev.qty += r.qty; prev.amount += r.amount; prev.tax += r.tax; prev.net += r.net;
      }
    });
    return Array.from(map.values());
  }, [reportRows, repView]);

  const repTotals = useMemo(() => {
    const amount = summaryRows.reduce((s, r) => s + r.amount, 0);
    const tax = summaryRows.reduce((s, r) => s + r.tax, 0);
    const net = summaryRows.reduce((s, r) => s + r.net, 0);
    return { amount, tax, net };
  }, [summaryRows]);

  const handleExcel = () => {
    const header = ['Date', 'S.No.', 'Party Name', 'CATEGORY', 'Item Name', 'Size', 'Qty.', 'Rate', 'Amount', 'Dis(%)', 'Tax(%)', 'Tax', 'Net Amt.'];
    const body = summaryRows.map((r) => [
      r.date, r.sno, r.party, r.category, r.item, r.size,
      r.qty, r.rate, r.amount.toFixed(1), r.disPct, r.taxPct, r.tax.toFixed(1),
      repTaxMode === 'without' ? r.amount.toFixed(1) : r.net.toFixed(1),
    ]);
    downloadCsv(`sale-report-${repFrom}-to-${repTo}.csv`, [header, ...body]);
  };

  const nav: { id: ModuleKey; label: string; icon: React.ReactNode }[] = [
    { id: 'SALE', label: 'SALE', icon: <Receipt className="w-4 h-4" /> },
    { id: 'KOT', label: 'KOT', icon: <UtensilsCrossed className="w-4 h-4" /> },
    { id: 'HOME', label: 'HOME DELIVERY', icon: <Bike className="w-4 h-4" /> },
    { id: 'ITEM', label: 'ITEM MASTER', icon: <TableProperties className="w-4 h-4" /> },
    { id: 'PARTY', label: 'PARTY MASTER', icon: <BookUser className="w-4 h-4" /> },
    { id: 'OFFER', label: 'OFFER MASTER', icon: <Tags className="w-4 h-4" /> },
    { id: 'REPORT', label: 'SALE REPORT', icon: <FileSpreadsheet className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-4">
      {/* header strip like Rushda top bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="text-lg font-black text-slate-900 tracking-tight">7 CHEESE PIZZA</div>
          <div className="text-[11px] text-slate-500 font-semibold">{outlet.area} • Session : 2026-2027 • {new Date().toLocaleString('en-IN')}</div>
        </div>
        {lastBillNo && (
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
            <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
              Last bill: {lastBillNo}
            </span>
            {lastBill && (
              <>
                <button
                  onClick={() => printThermal(buildCustomerBillHtml(lastBill))}
                  className="flex items-center gap-1 bg-slate-900 text-white px-3 py-1.5 rounded-xl cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" /> Customer Bill
                </button>
                <button
                  onClick={() => printThermal(buildKotBillHtml(lastBill))}
                  className="flex items-center gap-1 bg-white border border-slate-200 px-3 py-1.5 rounded-xl cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" /> KOT (Owner)
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* left nav */}
        <div className="lg:w-52 shrink-0 bg-white rounded-2xl border border-slate-200 p-2 space-y-1">
          {nav.map((n) => (
            <button
              key={n.id}
              onClick={() => setModule(n.id)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-black transition-colors cursor-pointer ${
                module === n.id ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {n.icon}
              <span>{n.label}</span>
            </button>
          ))}
        </div>

        <div className="flex-1 min-w-0">
          {(module === 'SALE' || module === 'KOT' || module === 'HOME') && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              {/* items */}
              <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 p-4">
                <div className="flex flex-col sm:flex-row gap-2 mb-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      value={itemSearch}
                      onChange={(e) => setItemSearch(e.target.value)}
                      placeholder="Search item / code…"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30"
                    />
                  </div>
                  <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold">
                    <option value="all">All categories</option>
                    {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-96 overflow-y-auto">
                  {filteredMenu.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => addLine(m, 1)}
                      className="text-left p-2.5 rounded-xl border border-slate-200 hover:border-red-300 hover:bg-red-50/50 transition-colors cursor-pointer"
                    >
                      <div className="text-xs font-black text-slate-900 truncate">{m.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{m.id} • {m.category}</div>
                      <div className="text-xs font-black text-red-600 mt-1">₹{m.price}</div>
                    </button>
                  ))}
                </div>

                {/* quick add like right panel */}
                <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                  <select value={quickItemId} onChange={(e) => {
                    const id = e.target.value;
                    setQuickItemId(id);
                    const m = menuItems.find((x) => x.id === id);
                    if (m) setQuickRate(m.price);
                  }} className="px-2 py-1.5 rounded-lg border border-slate-200 font-bold col-span-2">
                    <option value="">Quick item…</option>
                    {menuItems.slice(0, 200).map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                  <input type="number" min={1} value={quickQty} onChange={(e) => setQuickQty(Math.max(1, Number(e.target.value) || 1))} className="px-2 py-1.5 rounded-lg border border-slate-200" placeholder="Qty" />
                  <input type="number" value={quickRate} onChange={(e) => setQuickRate(e.target.value === '' ? '' : Number(e.target.value))} className="px-2 py-1.5 rounded-lg border border-slate-200" placeholder="Rate" />
                  <button
                    onClick={() => {
                      const m = menuItems.find((x) => x.id === quickItemId);
                      if (m) addLine(m, quickQty, quickRate === '' ? undefined : Number(quickRate));
                    }}
                    className="flex items-center justify-center gap-1 bg-slate-900 text-white rounded-lg font-black py-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add
                  </button>
                </div>
              </div>

              {/* bill panel */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col">
                <div className="text-xs font-black text-slate-900 mb-2">
                  {billMode === 'HOME' ? 'HOME DELIVERY BILL' : billMode === 'KOT' ? 'KOT / TABLE BILL' : 'COUNTER SALE BILL'}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                  <select value={partyId} onChange={(e) => setPartyId(e.target.value)} className="px-2 py-1.5 rounded-lg border border-slate-200 font-bold">
                    {parties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <select value={saleType} onChange={(e) => setSaleType(e.target.value as 'CASH' | 'CREDIT')} className="px-2 py-1.5 rounded-lg border border-slate-200 font-bold">
                    <option value="CASH">CASH</option>
                    <option value="CREDIT">CREDIT</option>
                  </select>
                  {billMode === 'KOT' && (
                    <input value={tableNo} onChange={(e) => setTableNo(e.target.value)} placeholder="Table no." className="px-2 py-1.5 rounded-lg border border-slate-200" />
                  )}
                  <input value={phoneNo} onChange={(e) => setPhoneNo(e.target.value)} placeholder="Phone no." className="px-2 py-1.5 rounded-lg border border-slate-200" />
                </div>

                <label className="flex items-center gap-2 text-[11px] font-bold text-slate-600 mb-2">
                  <input type="checkbox" checked={discountFix} onChange={(e) => setDiscountFix(e.target.checked)} />
                  Discount Fix (lock line discounts)
                </label>

                <div className="border border-slate-200 rounded-xl overflow-hidden mb-2">
                  <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 text-xs">
                    {lines.length === 0 && <div className="p-4 text-center text-slate-400">No items — tap items to add</div>}
                    {lines.map((l) => (
                      <div key={l.key} className="p-2 flex items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-slate-800 truncate">{l.name}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{l.size} • ₹{l.rate} • GST {l.taxPct}%</div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => setLines((p) => p.map((x) => x.key === l.key ? { ...x, qty: Math.max(1, x.qty - 1) } : x))} className="w-6 h-6 rounded-lg bg-slate-100 font-black cursor-pointer">−</button>
                          <span className="w-6 text-center font-black">{l.qty}</span>
                          <button onClick={() => setLines((p) => p.map((x) => x.key === l.key ? { ...x, qty: x.qty + 1 } : x))} className="w-6 h-6 rounded-lg bg-slate-100 font-black cursor-pointer">+</button>
                        </div>
                        <span className="font-mono font-black w-14 text-right">₹{l.qty * l.rate}</span>
                        <button onClick={() => setLines((p) => p.filter((x) => x.key !== l.key))} className="text-red-500 cursor-pointer"><X className="w-3.5 h-3.5" /></button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                  <input type="number" value={extraDisPct} onChange={(e) => setExtraDisPct(Number(e.target.value) || 0)} placeholder="Extra Dis %" className="px-2 py-1.5 rounded-lg border border-slate-200" />
                  <input type="number" value={extraFlat} onChange={(e) => setExtraFlat(Number(e.target.value) || 0)} placeholder="Extra flat ₹" className="px-2 py-1.5 rounded-lg border border-slate-200" />
                </div>
                <select
                  onChange={(e) => {
                    const o = offers.find((x) => x.code === e.target.value);
                    if (!o) return;
                    if (totals.gross < o.minOrder) return;
                    if (o.type === 'percentage') { setExtraDisPct(o.value); setExtraFlat(0); }
                    else { setExtraFlat(o.value); setExtraDisPct(0); }
                  }}
                  className="px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-bold mb-2"
                  defaultValue=""
                >
                  <option value="">Apply offer…</option>
                  {offers.map((o) => <option key={o.code} value={o.code}>{o.code} — {o.title}</option>)}
                </select>

                <div className="text-xs space-y-1 bg-slate-50 rounded-xl p-3 border border-slate-200 mb-3 font-mono">
                  <div className="flex justify-between"><span>Gross Amt.</span><span>₹{totals.gross.toFixed(1)}</span></div>
                  <div className="flex justify-between"><span>GST</span><span>₹{totals.tax.toFixed(1)}</span></div>
                  <div className="flex justify-between font-black text-base text-slate-900"><span>Net Amt.</span><span>₹{totals.net.toFixed(1)}</span></div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => handleSaveBill(false)} disabled={!lines.length} className="bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-xs font-black py-2.5 rounded-xl cursor-pointer">Save Bill</button>
                  <button onClick={() => handleSaveBill(true)} disabled={!lines.length} className="bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-black py-2.5 rounded-xl cursor-pointer">Save + KOT</button>
                  <button onClick={() => lastBill && printThermal(buildCustomerBillHtml(lastBill))} disabled={!lastBill} className="flex items-center justify-center gap-1 bg-white border border-slate-200 text-xs font-bold py-2 rounded-xl cursor-pointer disabled:opacity-40"><Printer className="w-3.5 h-3.5" /> Reprint Bill</button>
                  <button onClick={clearBill} className="bg-slate-100 text-xs font-bold py-2 rounded-xl cursor-pointer">Clear</button>
                </div>
              </div>
            </div>
          )}

          {module === 'ITEM' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-4">
              <div className="text-sm font-black mb-3">CREATE NEW ITEM (Item Master)</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-xs mb-3">
                <input value={fCode} onChange={(e) => setFCode(e.target.value)} placeholder="Item Code" className="px-2 py-1.5 rounded-lg border border-slate-200 font-mono" />
                <select value={fCat} onChange={(e) => setFCat(e.target.value)} className="px-2 py-1.5 rounded-lg border border-slate-200">
                  {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                  <option value="veg-pizza">veg-pizza</option>
                  <option value="combos">combos</option>
                  <option value="drinks">drinks</option>
                </select>
                <input value={fName} onChange={(e) => setFName(e.target.value)} placeholder="Item Name" className="px-2 py-1.5 rounded-lg border border-slate-200 col-span-2" />
                <input value={fSize} onChange={(e) => setFSize(e.target.value)} placeholder="Size" className="px-2 py-1.5 rounded-lg border border-slate-200" />
                <input value={fUnit} onChange={(e) => setFUnit(e.target.value)} placeholder="Unit" className="px-2 py-1.5 rounded-lg border border-slate-200" />
                <input type="number" value={fRate} onChange={(e) => setFRate(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Rate" className="px-2 py-1.5 rounded-lg border border-slate-200" />
                <input type="number" value={fTax} onChange={(e) => setFTax(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Tax %" className="px-2 py-1.5 rounded-lg border border-slate-200" />
              </div>
              <div className="flex gap-2 mb-4 text-xs font-bold">
                <button onClick={handleSaveItem} className="bg-slate-900 text-white px-4 py-2 rounded-xl cursor-pointer">Save</button>
                <button onClick={resetItemForm} className="bg-slate-100 px-4 py-2 rounded-xl cursor-pointer">Clear</button>
                <button onClick={() => window.print()} className="bg-white border border-slate-200 px-4 py-2 rounded-xl cursor-pointer">Print</button>
                <div className="relative ml-auto">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input value={masterSearch} onChange={(e) => setMasterSearch(e.target.value)} placeholder="Search…" className="pl-8 pr-3 py-2 rounded-xl border border-slate-200" />
                </div>
              </div>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 sticky top-0">
                      <tr className="text-left text-slate-500">
                        <th className="px-3 py-2">Item Code</th>
                        <th className="px-3 py-2">CATEGORY</th>
                        <th className="px-3 py-2">ITEM NAME</th>
                        <th className="px-3 py-2">SIZE</th>
                        <th className="px-3 py-2">UNIT</th>
                        <th className="px-3 py-2 text-right">RATE</th>
                        <th className="px-3 py-2 text-right">TAX</th>
                        <th className="px-3 py-2"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {masterRows.slice(0, 200).map((m) => (
                        <tr key={m.id}>
                          <td className="px-3 py-1.5 font-mono">{m.id}</td>
                          <td className="px-3 py-1.5">{m.category}</td>
                          <td className="px-3 py-1.5 font-bold">{m.name}</td>
                          <td className="px-3 py-1.5">{m.defaultSize ?? 'NA'}</td>
                          <td className="px-3 py-1.5">{unitMap[m.id] ?? 'NA'}</td>
                          <td className="px-3 py-1.5 text-right font-mono">₹{m.price}</td>
                          <td className="px-3 py-1.5 text-right font-mono">{taxMap[m.id] ?? 5}</td>
                          <td className="px-3 py-1.5">
                            <div className="flex gap-1 justify-end">
                              <button
                                onClick={() => {
                                  setFCode(m.id); setFCat(m.category); setFName(m.name);
                                  setFSize(m.defaultSize ?? 'NA'); setFUnit(unitMap[m.id] ?? 'NA');
                                  setFRate(m.price); setFTax(taxMap[m.id] ?? 5);
                                }}
                                className="p-1 rounded-lg bg-slate-100 cursor-pointer"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                              <button onClick={() => onDeleteItem(m.id)} className="p-1 rounded-lg bg-red-50 text-red-600 cursor-pointer">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {module === 'PARTY' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-4">
              <div className="text-sm font-black mb-3">PARTY MASTER</div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs mb-3">
                <input value={pName} onChange={(e) => setPName(e.target.value)} placeholder="Party name (e.g. MR AMIT)" className="px-2 py-1.5 rounded-lg border border-slate-200" />
                <input value={pPhone} onChange={(e) => setPPhone(e.target.value)} placeholder="Phone" className="px-2 py-1.5 rounded-lg border border-slate-200" />
                <input value={pAddr} onChange={(e) => setPAddr(e.target.value)} placeholder="Address" className="px-2 py-1.5 rounded-lg border border-slate-200" />
                <button
                  onClick={() => {
                    if (!pName.trim()) return;
                    persistParties([...parties, { id: `p-${Date.now()}`, name: pName.trim().toUpperCase(), phone: pPhone.trim(), address: pAddr.trim(), kind: 'CUSTOMER' }]);
                    setPName(''); setPPhone(''); setPAddr('');
                  }}
                  className="bg-slate-900 text-white rounded-xl font-black py-1.5 cursor-pointer"
                >
                  Add Party
                </button>
              </div>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl text-xs">
                {parties.map((p) => (
                  <div key={p.id} className="px-3 py-2 flex items-center justify-between">
                    <div>
                      <span className="font-black">{p.name}</span>
                      <span className="text-slate-500 ml-2">{p.phone} • {p.address}</span>
                    </div>
                    <button onClick={() => persistParties(parties.filter((x) => x.id !== p.id))} className="text-red-500 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {module === 'OFFER' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-4">
              <div className="text-sm font-black mb-3">OFFER MASTER (Add-on discounts)</div>
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs mb-3">
                <input value={oCode} onChange={(e) => setOCode(e.target.value)} placeholder="Code" className="px-2 py-1.5 rounded-lg border border-slate-200 font-mono" />
                <input value={oTitle} onChange={(e) => setOTitle(e.target.value)} placeholder="Title" className="px-2 py-1.5 rounded-lg border border-slate-200 col-span-2" />
                <select value={oType} onChange={(e) => setOType(e.target.value as 'percentage' | 'flat')} className="px-2 py-1.5 rounded-lg border border-slate-200">
                  <option value="percentage">% off</option>
                  <option value="flat">Flat ₹</option>
                </select>
                <input type="number" value={oValue} onChange={(e) => setOValue(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Value" className="px-2 py-1.5 rounded-lg border border-slate-200" />
                <button
                  onClick={() => {
                    if (!oCode.trim() || oValue === '') return;
                    persistOffers([...offers, { code: oCode.trim().toUpperCase(), title: oTitle.trim() || oCode, type: oType, value: Number(oValue), minOrder: Number(oMin) || 0 }]);
                    setOCode(''); setOTitle(''); setOValue(''); setOMin('');
                  }}
                  className="bg-slate-900 text-white rounded-xl font-black cursor-pointer"
                >
                  Add
                </button>
              </div>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl text-xs">
                {offers.map((o) => (
                  <div key={o.code} className="px-3 py-2 flex items-center justify-between">
                    <div><span className="font-mono font-black">{o.code}</span><span className="ml-2">{o.title} — {o.type === 'percentage' ? `${o.value}%` : `₹${o.value}`} (min ₹{o.minOrder})</span></div>
                    <button onClick={() => persistOffers(offers.filter((x) => x.code !== o.code))} className="text-red-500 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {module === 'REPORT' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-4">
              <div className="text-sm font-black mb-3">SALE REPORT — 7 CHEESE PIZZA</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-xs mb-3">
                <label className="flex flex-col gap-1">Date From<input type="date" value={repFrom} onChange={(e) => setRepFrom(e.target.value)} className="px-2 py-1.5 rounded-lg border border-slate-200" /></label>
                <label className="flex flex-col gap-1">Date To<input type="date" value={repTo} onChange={(e) => setRepTo(e.target.value)} className="px-2 py-1.5 rounded-lg border border-slate-200" /></label>
                <label className="flex flex-col gap-1">Sale Type
                  <select value={repSaleType} onChange={(e) => setRepSaleType(e.target.value)} className="px-2 py-1.5 rounded-lg border border-slate-200">
                    <option value="all">All</option><option value="CASH">CASH</option><option value="CREDIT">CREDIT</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1">Category
                  <select value={repCat} onChange={(e) => setRepCat(e.target.value)} className="px-2 py-1.5 rounded-lg border border-slate-200">
                    <option value="all">All</option>{categories.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </label>
                <label className="flex flex-col gap-1">Item<input value={repItem} onChange={(e) => setRepItem(e.target.value)} placeholder="Item name" className="px-2 py-1.5 rounded-lg border border-slate-200" /></label>
                <label className="flex flex-col gap-1">Size
                  <select value={repSize} onChange={(e) => setRepSize(e.target.value)} className="px-2 py-1.5 rounded-lg border border-slate-200">
                    <option value="all">All</option><option value="REGULAR">REGULAR</option><option value="MEDIUM">MEDIUM</option><option value="LARGE">LARGE</option><option value="NA">NA</option><option value="250ML">250ML</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1">Phone<input value={repPhone} onChange={(e) => setRepPhone(e.target.value)} placeholder="Phone" className="px-2 py-1.5 rounded-lg border border-slate-200" /></label>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs font-bold mb-3">
                <label className="flex items-center gap-1"><input type="checkbox" checked={repCash} onChange={(e) => setRepCash(e.target.checked)} /> CASH</label>
                <label className="flex items-center gap-1"><input type="checkbox" checked={repCredit} onChange={(e) => setRepCredit(e.target.checked)} /> CREDIT</label>
                <label className="flex items-center gap-1"><input type="checkbox" checked={repCancel} onChange={(e) => setRepCancel(e.target.checked)} /> Show cancelled</label>
                <div className="flex items-center gap-1 ml-auto">
                  {(['with', 'without', 'both'] as const).map((t) => (
                    <button key={t} onClick={() => setRepTaxMode(t)} className={`px-2.5 py-1 rounded-lg border cursor-pointer ${repTaxMode === t ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-200'}`}>
                      {t === 'with' ? 'With Tax' : t === 'without' ? 'Without Tax' : 'Both'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 text-xs font-bold mb-3">
                {(['detail', 'summary', 'category', 'tax'] as ReportView[]).map((v) => (
                  <button key={v} onClick={() => setRepView(v)} className={`px-3 py-1.5 rounded-xl border cursor-pointer capitalize ${repView === v ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-200'}`}>{v}</button>
                ))}
                <button onClick={() => window.print()} className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-slate-200 cursor-pointer"><Printer className="w-3.5 h-3.5" /> Print</button>
                <button onClick={handleExcel} className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 text-white cursor-pointer"><Download className="w-3.5 h-3.5" /> Excel</button>
              </div>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                  <table className="w-full text-[11px] whitespace-nowrap">
                    <thead className="bg-slate-50 sticky top-0">
                      <tr className="text-left text-slate-500">
                        <th className="px-2 py-1.5">Date</th><th className="px-2 py-1.5">S.No.</th>
                        <th className="px-2 py-1.5">Party Name</th><th className="px-2 py-1.5">CATEGORY</th>
                        <th className="px-2 py-1.5">Item Name</th><th className="px-2 py-1.5">Size</th>
                        <th className="px-2 py-1.5 text-right">Qty.</th><th className="px-2 py-1.5 text-right">Rate</th>
                        <th className="px-2 py-1.5 text-right">Amount</th><th className="px-2 py-1.5 text-right">Dis(%)</th>
                        <th className="px-2 py-1.5 text-right">Tax(%)</th><th className="px-2 py-1.5 text-right">Tax</th>
                        <th className="px-2 py-1.5 text-right">Net Amt.</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {summaryRows.map((r, i) => (
                        <tr key={`${r.sno}-${r.item}-${i}`}>
                          <td className="px-2 py-1">{r.date}</td><td className="px-2 py-1">{r.sno}</td>
                          <td className="px-2 py-1 font-sans font-bold">{r.party}</td><td className="px-2 py-1">{r.category}</td>
                          <td className="px-2 py-1 font-sans">{r.item}</td><td className="px-2 py-1">{r.size}</td>
                          <td className="px-2 py-1 text-right">{r.qty}</td><td className="px-2 py-1 text-right">{r.rate}</td>
                          <td className="px-2 py-1 text-right">{r.amount.toFixed(1)}</td><td className="px-2 py-1 text-right">{r.disPct}</td>
                          <td className="px-2 py-1 text-right">{r.taxPct}</td><td className="px-2 py-1 text-right">{r.tax.toFixed(1)}</td>
                          <td className="px-2 py-1 text-right font-black">{(repTaxMode === 'without' ? r.amount : r.net).toFixed(1)}</td>
                        </tr>
                      ))}
                      {summaryRows.length === 0 && (
                        <tr><td colSpan={13} className="px-3 py-6 text-center text-slate-400 font-sans">No sales in range</td></tr>
                      )}
                    </tbody>
                    <tfoot className="bg-slate-50 font-mono font-black">
                      <tr>
                        <td colSpan={8} className="px-2 py-1.5 text-right">TOTAL</td>
                        <td className="px-2 py-1.5 text-right">{repTotals.amount.toFixed(1)}</td>
                        <td colSpan={2}></td>
                        <td className="px-2 py-1.5 text-right">{repTotals.tax.toFixed(1)}</td>
                        <td className="px-2 py-1.5 text-right">{repTotals.net.toFixed(1)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
