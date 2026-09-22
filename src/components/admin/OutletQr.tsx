import React, { useState } from 'react';
import { QrCode, RefreshCw, Copy, Download, Printer, Check } from 'lucide-react';
import type { Outlet } from './outlets';
import { getOutletQrToken, regenerateOutletQrToken, getOutletQrUrl } from './outlets';

interface OutletQrProps {
  outlet: Outlet;
}

export const OutletQr: React.FC<OutletQrProps> = ({ outlet }) => {
  const [token, setToken] = useState(() => getOutletQrToken(outlet.id));
  const [copied, setCopied] = useState(false);

  // Outlet change pe token reload
  React.useEffect(() => {
    setToken(getOutletQrToken(outlet.id));
  }, [outlet.id]);

  const url = getOutletQrUrl(outlet.id, token);
  const qrImg = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=${encodeURIComponent(url)}`;

  const handleRegenerate = () => {
    if (!window.confirm(`Naya QR generate karein ${outlet.shortName} ke liye? Purana printed QR kaam nahi karega — naya print karke lagana padega.`)) return;
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

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-1">
          <QrCode className="w-5 h-5 text-slate-900" />
          <h2 className="text-base sm:text-lg font-black text-slate-900">
            {outlet.shortName} — Table / Counter QR
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
              <div className="flex items-center gap-2">
                <code className="flex-1 text-[11px] font-mono bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 break-all">
                  {url}
                </code>
              </div>
              <div className="text-[11px] font-mono text-slate-400 mt-1">
                Token: {token}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 bg-slate-900 text-white px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Link'}</span>
              </button>
              <button
                onClick={handleDownload}
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
              • Table pe print karke chipkao — customer apne phone se scan karega.<br />
              • Re-generate dabane pe purana QR bekar — naya print lagana zaroori.<br />
              • QR se aaye order pe outlet lock rahega, admin me scope <b>{outlet.shortName} only</b> me dikhega.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
