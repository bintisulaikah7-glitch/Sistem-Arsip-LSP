import React, { useState } from 'react';
import { X, Printer, QrCode, ArrowLeft, Copy, Check, ExternalLink, Link as LinkIcon, Globe } from 'lucide-react';
import { BoksArsip } from '../types.ts';
import { getBoxPublicUrl, getBoxQrImageUrl, PUBLIC_PORTAL_BASE_URL } from '../utils/url.ts';

interface QrCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  box: BoksArsip | null;
}

export const QrCardModal: React.FC<QrCardModalProps> = ({
  isOpen,
  onClose,
  box
}) => {
  const [copiedUrl, setCopiedUrl] = useState(false);

  if (!isOpen || !box) return null;

  const handlePrint = () => {
    window.print();
  };

  // Generate full URL pointing to public GitHub Pages domain + query parameter ?box=KODE_BOKS
  // Format: https://bintisulaikah7-glitch.github.io/Sistem-Arsip-LSP/?box=KODE_BOKS
  const fullScanUrl = getBoxPublicUrl(box.id_box);

  // Generate an SVG QR code visual that encodes the public GitHub Pages URL
  const qrSvgUrl = getBoxQrImageUrl(box.id_box, 240);

  const handleCopyUrl = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(fullScanUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in duration-200 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center space-x-2">
            <QrCode className="w-4 h-4 text-emerald-400" />
            <h2 className="font-semibold text-sm text-slate-100">
              Cetak / Dapatkan QR Code Boks
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition p-1.5 rounded-lg hover:bg-slate-800"
            title="Tutup (Kembali)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Card Area */}
        <div className="p-5 sm:p-6 bg-slate-950 flex flex-col items-center">
          <div className="relative w-full bg-white text-slate-900 rounded-xl p-5 border-2 border-dashed border-slate-300 shadow-md flex flex-col items-center text-center">
            {/* Back / Close button at top-left of the card */}
            <button
              onClick={onClose}
              className="absolute top-3 left-3 p-1.5 rounded-full bg-slate-100 hover:bg-emerald-100 text-slate-600 hover:text-emerald-700 transition shadow-sm border border-slate-200"
              title="Kembali ke Dashboard Utama"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            {/* Header LSP */}
            <div className="w-full border-b border-slate-200 pb-2 mb-3 pt-1">
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block">
                ARSIP RESMI BERKAS LSP
              </span>
              <h3 className="font-extrabold text-sm text-slate-900 leading-tight">
                LEMBAGA SERTIFIKASI PROFESI
              </h3>
            </div>

            {/* QR Code image */}
            <div className="p-2.5 bg-white border border-slate-200 rounded-xl mb-3 shadow-inner">
              <img
                src={qrSvgUrl}
                alt={`QR Code ${box.id_box}`}
                className="w-40 h-40 object-contain"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* ID Box */}
            <div className="font-mono text-base font-black text-emerald-700 tracking-wider mb-1.5">
              {box.id_box}
            </div>

            {/* Pelatihan */}
            <p className="text-xs font-semibold text-slate-800 line-clamp-2 mb-3">
              {box.nama_pelatihan}
            </p>

            {/* Lokasi Matrix */}
            <div className="w-full grid grid-cols-3 gap-1 bg-slate-100 p-2 rounded-lg text-center text-xs font-mono mb-2">
              <div>
                <span className="block text-[9px] text-slate-500 font-sans">LEMARI</span>
                <span className="font-bold text-slate-800">{box.lokasi.lemari}</span>
              </div>
              <div>
                <span className="block text-[9px] text-slate-500 font-sans">RAK</span>
                <span className="font-bold text-slate-800">{box.lokasi.rak}</span>
              </div>
              <div>
                <span className="block text-[9px] text-slate-500 font-sans">BARIS</span>
                <span className="font-bold text-slate-800">{box.lokasi.baris}</span>
              </div>
            </div>

            {/* Status & Tahun */}
            <div className="w-full flex items-center justify-between text-[10px] text-slate-500 pt-1.5 border-t border-slate-200">
              <span>Tahun: {box.tahun_pelaksanaan}</span>
              <span>Status: {box.status_arsip} ({box.status_barang})</span>
            </div>

            <p className="text-[9px] text-slate-400 mt-2 italic">
              Pindai QR ini untuk langsung membuka rincian berkas di portal web
            </p>
          </div>

          {/* Direct URL Display & Copy */}
          <div className="w-full mt-4 bg-slate-900 border border-slate-800 rounded-xl p-3">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
              <span className="flex items-center space-x-1.5 font-medium text-slate-300">
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                <span>Link Publik (GitHub Pages):</span>
              </span>
              <button
                onClick={handleCopyUrl}
                className="inline-flex items-center space-x-1 text-emerald-400 hover:text-emerald-300 transition font-medium"
              >
                {copiedUrl ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedUrl ? 'Tersalin' : 'Salin URL'}</span>
              </button>
            </div>
            <div className="p-2 bg-slate-950 rounded border border-slate-800 font-mono text-[11px] text-emerald-400/90 break-all select-all">
              {fullScanUrl}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-900 flex items-center justify-between">
          <a
            href={fullScanUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Uji Buka URL</span>
          </a>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition shadow"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Label QR</span>
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
