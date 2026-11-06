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
      window.prompt('Copy this link:', url);
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
        <div className="text-center text-[11px] font-mono text-slate-500">
          Scan to order
        </div>
      </div>

      <div className="flex-1 w-full space-y-2.5">
        <div className="flex items-center gap-2">
          <Armchair className="w-4 h-4 text-slate-700" />
          <span className="font-black text-slate-900 text-sm">{table.name}</span>
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
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
              if (window.confirm(`Delete "${table.name}"? Its printed QR code will stop working.`)) onDelete();
            }}
            className="flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-red-50 text-slate-400 hover:text-red-600 px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        </div>
        <p className="text-[11px] text-slate-500">
          Orders placed by scanning this QR are tagged to <b>{table.name}</b>.
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
  const [storageWarning, setStorageWarning] = useState('');

  // Outlet change pe token + tables reload
  React.useEffect(() => {
    setToken(getOutletQrToken(outlet.id));
    setTables(getOutletTables(outlet.id));
  }, [outlet.id]);

  const url = getOutletQrUrl(outlet.id, token);
  const qrImg = qrImgFor(url);

  const handleRegenerate = () => {
    if (!window.confirm(`Generate a new QR code for ${outlet.shortName}? Old printed QR codes will stop working, so you will need to print and display new ones.`)) return;
    setToken(regenerateOutletQrToken(outlet.id));
    setCopied(false);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copy this link:', url);
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
    if (!name) {
      window.alert('Type a table name first, for example "Table T-03", then press Add Table.');
      return;
    }
    const exists = tables.some((t) => t.name.toLowerCase() === name.toLowerCase());
    if (exists) {
      window.alert(`A table named "${name}" already exists.`);
      return;
    }

    const { table, saved } = addOutletTable(outlet.id, name);
    setNewTableName('');

    if (saved) {
      setStorageWarning('');
      setTables(getOutletTables(outlet.id));
    } else {
      // Browser refused the write (storage full / private mode). Keep it visible this session
      // instead of silently doing nothing.
      setStorageWarning(
        `"${name}" could not be saved on this device — the browser blocked storage (full or private mode). ` +
          'Free some space (or open the panel in a normal window) and add the table again. It shows below until you close this page.'
      );
      setTables((prev) => [...prev, table]);
    }

    // New card sits at the bottom of the list — bring it into view so the click is visibly confirmed.
    window.setTimeout(() => {
      document.querySelector(`[data-table-id="${table.id}"]`)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, 80);
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
          This QR code belongs to <b>{outlet.name}</b> ({outlet.area}). Orders placed by scanning it go
          <b> directly to this outlet</b>; the customer's GPS location won't change the outlet.
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
            <div className="text-center text-[11px] font-mono text-slate-500">
              Scan to order
            </div>
          </div>

          <div className="flex-1 w-full space-y-3">
            <div>
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                QR link (unique to each outlet)
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
              • Print it and stick it on the counter; customers scan it with their phone.<br />
              • Re-generating makes old printed QR codes stop working; print new ones.<br />
              • Orders from this QR stay locked to this outlet and appear in admin under <b>{outlet.shortName} only</b>.
            </div>
          </div>
        </div>
      </div>

      {/* Tables + per-table QR */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-1">
          <Armchair className="w-5 h-5 text-slate-900" />
          <h2 className="text-base sm:text-lg font-black text-slate-900">
            Tables: one QR per table ({tables.length})
          </h2>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Stick each table's QR code on that table. When a customer scans it, the order arrives in admin{' '}
          <b>under that table's name</b>. A new table's QR code is created as soon as you add it.
        </p>

        {/* Add table */}
        <div className="flex gap-2 mb-4">
          <input
            value={newTableName}
            onChange={(e) => setNewTableName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddTable();
            }}
            placeholder="New table name, e.g. Table T-03"
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

        {storageWarning && (
          <div className="mb-4 text-[11px] font-semibold text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">
            {storageWarning}
          </div>
        )}

        <div className="space-y-3">
          {tables.map((t) => (
            <div key={t.id} data-table-id={t.id}>
              <TableQrCard
                outlet={outlet}
                table={t}
                onDelete={() => {
                  const removed = deleteOutletTable(outlet.id, t.id);
                  if (!removed) {
                    window.alert(
                      `"${t.name}" could not be deleted — this browser is blocking storage (full or private mode). ` +
                        'Free some space and try again.'
                    );
                  }
                  setTables(getOutletTables(outlet.id));
                }}
              />
            </div>
          ))}
          {tables.length === 0 && (
            <div className="text-center text-xs text-slate-500 border border-dashed border-slate-300 rounded-2xl p-8">
              No tables yet. Enter a name above and click Add Table.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
