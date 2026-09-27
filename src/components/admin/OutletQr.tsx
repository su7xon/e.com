import React, { useState } from 'react';
import { QrCode, RefreshCw, Copy, Download, Printer, Check, Plus, Trash2, Armchair } from 'lucide-react';
import type { Outlet } from './outlets';
import {
  getOutletQrToken,
  regenerateOutletQrToken,
  getOutletQrUrl,
  getOutletTables,
  addOutletTable,
  deleteOutletTable,
  getTableQrUrl,
  type OutletTable,
} from './outlets';

interface OutletQrProps {
  outlet: Outlet;
}

function qrImgFor(url: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=${encodeURIComponent(url)}`;
}

const TableQrCard: React.FC<{ outlet: Outlet; table: OutletTable; onDelete: () => void }> = ({
  outlet,
  table,
  onDelete,
}) => {
  const [copied, setCopied] = useState(false);
  const url = getTableQrUrl(outlet.id, table.id);
  const qrImg = qrImgFor(url);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Link copy karo:', url);
    }
  };

  const handleDownload = async () => {
    try {
      const res = await fetch(qrImg);
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `qr-${table.name.replace(/\s+/g, '-').toLowerCase()}.png`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      window.open(qrImg, '_blank');
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row gap-4 items-start">
      <div className="bg-white border-2 border-slate-900 rounded-2xl p-3 shrink-0 mx-auto sm:mx-0">
        <img
          src={qrImg}
          alt={`${table.name} order QR`}
          className="w-44 h-44 object-contain"
          referrerPolicy="no-referrer"
          loading="lazy"
        />
        <div className="text-center text-[11px] font-black text-slate-900 mt-2">
          7 CHEESE PIZZA • {table.name.toUpperCase()}
        </div>
        <div className="text-center text-[10px] font-mono text-slate-500">
          Scan karke order karo
        </div>
      </div>

      <div className="flex-1 w-full space-y-2.5">
        <div className="flex items-center gap-2">
          <Armchair className="w-4 h-4 text-slate-700" />
          <span className="font-black text-slate-900 text-sm">{table.name}</span>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
            QR ACTIVE
          </span>
        </div>
        <code className="block text-[11px] font-mono bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 break-all">
          {url}
        </code>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => void handleCopy()}
            className="flex items-center gap-1.5 bg-slate-900 text-white px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
          <button
            onClick={() => void handleDownload()}
            className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>QR Download</span>
          </button>
          <button
            onClick={() => {
              if (window.confirm(`"${table.name}" delete karein? Iska printed QR bekar ho jayega.`)) onDelete();
            }}
            className="flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-red-50 text-slate-400 hover:text-red-600 px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        </div>
        <p className="text-[11px] text-slate-500">
          Is QR se scan karke order <b>{table.name}</b> ke naam pe aayega.
        </p>
      </div>
    </div>
  );
};

export const OutletQr: React.FC<OutletQrProps> = ({ outlet }) => {
  const [token, setToken] = useState(() => getOutletQrToken(outlet.id));
  const [copied, setCopied] = useState(false);
  const [tables, setTables] = useState<OutletTable[]>(() => getOutletTables(outlet.id));
  const [newTableName, setNewTableName] = useState('');

  // Outlet change pe token + tables reload
  React.useEffect(() => {
    setToken(getOutletQrToken(outlet.id));
    setTables(getOutletTables(outlet.id));
  }, [outlet.id]);

  const url = getOutletQrUrl(outlet.id, token);
  const qrImg = qrImgFor(url);

  const handleRegenerate = () => {
    if (!window.confirm(`Naya QR generate karein ${outlet.shortName} ke liye? Purane printed QR kaam nahi karenge — naye print karke lagane padenge.`)) return;
    setToken(regenerateOutletQrToken(outlet.id));
    setCopied(false);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Link copy karo:', url);
    }
  };

  const handleDownload = async () => {
    try {
      const res = await fetch(qrImg);
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `qr-${outlet.id}.png`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      window.open(qrImg, '_blank');
    }
  };

  const handleAddTable = () => {
    const name = newTableName.trim();
    if (!name) return;
    const exists = tables.some((t) => t.name.toLowerCase() === name.toLowerCase());
    if (exists) {
      window.alert(`"${name}" naam ki table pehle se hai.`);
      return;
    }
    addOutletTable(outlet.id, name);
    setTables(getOutletTables(outlet.id));
    setNewTableName('');
  };

  return (
    <div className="space-y-4">
      {/* Outlet-level QR (counter / takeaway) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-1">
          <QrCode className="w-5 h-5 text-slate-900" />
          <h2 className="text-base sm:text-lg font-black text-slate-900">
            {outlet.shortName} — Counter QR
          </h2>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Ye QR <b>{outlet.name}</b> ({outlet.area}) ka hai. Customer scan karke order karega to order
          <b> direct isi outlet</b> me aayega — GPS se outlet change nahi hoga.
        </p>

        <div className="flex flex-col sm:flex-row gap-5 items-start">
          <div className="bg-white border-2 border-slate-900 rounded-2xl p-3 shrink-0 mx-auto sm:mx-0">
            <img
              key={token}
              src={qrImg}
              alt={`${outlet.shortName} order QR`}
              className="w-56 h-56 object-contain"
              referrerPolicy="no-referrer"
            />
            <div className="text-center text-[11px] font-black text-slate-900 mt-2">
              7 CHEESE PIZZA • {outlet.shortName.toUpperCase()}
            </div>
            <div className="text-center text-[10px] font-mono text-slate-500">
              Scan karke order karo
            </div>
          </div>

          <div className="flex-1 w-full space-y-3">
            <div>
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                QR link (har outlet ka alag)
              </div>
              <code className="block text-[11px] font-mono bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 break-all">
                {url}
              </code>
              <div className="text-[11px] font-mono text-slate-400 mt-1">
                Token: {token}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => void handleCopy()}
                className="flex items-center gap-1.5 bg-slate-900 text-white px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Link'}</span>
              </button>
              <button
                onClick={() => void handleDownload()}
                className="flex items-center gap-1.5 bg-white border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download QR</span>
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 bg-white border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>
              <button
                onClick={handleRegenerate}
                className="flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Re-generate QR</span>
              </button>
            </div>

            <div className="text-[11px] text-slate-500 bg-slate-50 border border-slate-200 rounded-xl p-3">
              • Counter pe print karke chipkao — customer apne phone se scan karega.<br />
              • Re-generate dabane pe purane QR bekar — naye print lagane zaroori.<br />
              • QR se aaye order pe outlet lock rahega, admin me scope <b>{outlet.shortName} only</b> me dikhega.
            </div>
          </div>
        </div>
      </div>

      {/* Tables + per-table QR */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-1">
          <Armchair className="w-5 h-5 text-slate-900" />
          <h2 className="text-base sm:text-lg font-black text-slate-900">
            Tables — har table ka apna QR ({tables.length})
          </h2>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Har table pe uska QR chipkao. Customer jis table ka QR scan karega, order <b>ussi table ke naam</b> se
          admin me aayega. Nayi table add karte hi uska QR turant ban jata hai.
        </p>

        {/* Add table */}
        <div className="flex gap-2 mb-4">
          <input
            value={newTableName}
            onChange={(e) => setNewTableName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddTable();
            }}
            placeholder="Nayi table ka naam — e.g. Table T-03"
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-medium focus:outline-none focus:ring-2 focus:ring-slate-900/10"
          />
          <button
            onClick={handleAddTable}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Table</span>
          </button>
        </div>

        <div className="space-y-3">
          {tables.map((t) => (
            <TableQrCard
              key={t.id}
              outlet={outlet}
              table={t}
              onDelete={() => {
                deleteOutletTable(outlet.id, t.id);
                setTables(getOutletTables(outlet.id));
              }}
            />
          ))}
          {tables.length === 0 && (
            <div className="text-center text-xs text-slate-500 border border-dashed border-slate-300 rounded-2xl p-8">
              Koi table nahi. Upar naam likh ke Add Table dabao.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
