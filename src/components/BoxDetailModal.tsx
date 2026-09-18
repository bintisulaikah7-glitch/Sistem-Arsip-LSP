import React, { useState } from 'react';
import { 
  X, 
  ExternalLink, 
  Copy, 
  Check, 
  Calendar, 
  Users, 
  MapPin, 
  FileCode, 
  Layers, 
  CheckCircle2, 
  FolderArchive,
  QrCode,
  Share2
} from 'lucide-react';
import { BoksArsip } from '../types.ts';
import { getBoxPublicUrl } from '../utils/url.ts';

interface BoxDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  box: BoksArsip | null;
  onViewJson?: (box: BoksArsip) => void;
  onShowQr?: (box: BoksArsip) => void;
}

export const BoxDetailModal: React.FC<BoxDetailModalProps> = ({
  isOpen,
  onClose,
  box,
  onViewJson,
  onShowQr
}) => {
  const [copiedId, setCopiedId] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showRawJson, setShowRawJson] = useState(false);

  if (!isOpen || !box) return null;

  const handleCopyId = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(box.id_box);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const getFullScanUrl = () => {
    return getBoxPublicUrl(box.id_box);
  };

  const handleCopyScanUrl = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = getFullScanUrl();
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const kompetenCount = Math.max(0, (box.jumlah_peserta || 0) - (box.jumlah_peserta_bk || 0));

  // Status Arsip Styling
  const getStatusArsipBadge = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s.includes('tersedia') || s.includes('aktif')) {
      return 'bg-emerald-950/80 text-emerald-300 border-emerald-700/80';
    }
    if (s.includes('tidak') || s.includes('inaktif')) {
      return 'bg-amber-950/80 text-amber-300 border-amber-700/80';
    }
    return 'bg-rose-950/80 text-rose-300 border-rose-700/80';
  };

  // Status Barang Styling
  const getStatusBarangBadge = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s.includes('lengkap')) {
      return 'bg-blue-950/80 text-blue-300 border-blue-700/80';
    }
    if (s.includes('tidak') || s.includes('pinjam')) {
      return 'bg-purple-950/80 text-purple-300 border-purple-700/80';
    }
    return 'bg-slate-800 text-slate-300 border-slate-700';
  };

  const lemariVal = box.lokasi?.lemari !== undefined && box.lokasi?.lemari !== null ? box.lokasi.lemari : '-';
  const rakVal = box.lokasi?.rak ? box.lokasi.rak : '-';
  const barisVal = box.lokasi?.baris ? box.lokasi.baris : '-';

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-slate-900 border border-slate-700/90 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ========================================================
            1. HEADER: Logo / Judul "PORTAL ARSIP LSP" & Close Button (X)
            ======================================================== */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-5 py-4 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 p-0.5 shadow-md flex items-center justify-center flex-shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-emerald-400">
                <FolderArchive className="w-5 h-5" />
              </div>
            </div>
            <div>
              <h2 className="font-bold text-base sm:text-lg text-white tracking-wide flex items-center gap-2">
                <span>PORTAL ARSIP LSP</span>
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-400">
                Balai Diklat Industri Padang • Informasi Berkas Pelatihan
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={handleCopyScanUrl}
              className="p-2 text-slate-400 hover:text-emerald-400 rounded-lg hover:bg-slate-800 transition"
              title="Salin Link URL Scan Boks"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            </button>
            <button
              id="btn-close-box-detail"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              title="Tutup (Close)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
          {/* ========================================================
              2. CARD 1: DETAIL BOKS
              Menampilkan: Kode Boks (badge hijau), Nama Pelatihan,
              Tahun Pelaksanaan, Jumlah Peserta (Kompeten & BK)
              ======================================================== */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 overflow-hidden shadow-sm">
            {/* Header Seksi */}
            <div className="px-4 py-2.5 bg-slate-800/90 border-b border-slate-700/80 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  DETAIL BOKS
                </h3>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">Informasi Dokumen</span>
            </div>

            <div className="p-4 space-y-3.5 text-sm">
              {/* Kode Boks (Badge Hijau) */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800/80 gap-1.5">
                <span className="text-xs font-medium text-slate-400">Kode Boks:</span>
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-bold text-sm sm:text-base text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-lg border border-emerald-700/70 shadow-inner w-fit">
                    {box.id_box}
                  </span>
                  <button
                    onClick={handleCopyId}
                    className="p-1.5 text-slate-400 hover:text-emerald-300 rounded bg-slate-900 border border-slate-800 hover:border-slate-700 transition"
                    title="Salin Kode Boks"
                  >
                    {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Nama Pelatihan */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between pb-3 border-b border-slate-800/80 gap-1.5">
                <span className="text-xs font-medium text-slate-400 sm:w-1/3 flex-shrink-0">
                  Nama Pelatihan:
                </span>
                <span className="font-semibold text-slate-100 sm:text-right leading-snug">
                  {box.nama_pelatihan}
                </span>
              </div>

              {/* Tahun Pelaksanaan */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800/80 gap-1.5">
                <span className="text-xs font-medium text-slate-400 flex items-center">
                  <Calendar className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                  Tahun Pelaksanaan:
                </span>
                <span className="font-semibold text-slate-200 bg-slate-900 px-2.5 py-0.5 rounded border border-slate-800 w-fit">
                  {box.tahun_pelaksanaan}
                </span>
              </div>

              {/* Jumlah Peserta (Kompeten & BK) */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <span className="text-xs font-medium text-slate-400 flex items-center">
                  <Users className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                  Jumlah Peserta:
                </span>
                <div className="text-sm font-medium text-slate-200">
                  <span className="font-bold text-white">{box.jumlah_peserta} Peserta</span>{' '}
                  <span className="text-xs text-slate-400">
                    (Kompeten:{' '}
                    <span className="font-semibold text-emerald-400">{kompetenCount}</span>, BK:{' '}
                    <span className="font-semibold text-purple-400">{box.jumlah_peserta_bk}</span>)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================
              3. CARD 2: LOKASI FISIK & KETERANGAN
              Menampilkan: Lokasi Penyimpanan, Status Arsip (Tersedia),
              Kelengkapan Barang
              ======================================================== */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 overflow-hidden shadow-sm">
            {/* Header Seksi */}
            <div className="px-4 py-2.5 bg-slate-800/90 border-b border-slate-700/80 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-teal-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  LOKASI FISIK & KETERANGAN
                </h3>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">Gudang Arsip</span>
            </div>

            <div className="p-4 space-y-3.5 text-sm">
              {/* Lokasi Penyimpanan */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800/80 gap-1.5">
                <span className="text-xs font-medium text-slate-400">Lokasi Penyimpanan:</span>
                <span className="font-semibold text-teal-300 bg-teal-950/50 px-3 py-1 rounded-lg border border-teal-800/60 w-fit">
                  Lemari {lemariVal} - {rakVal} ({barisVal})
                </span>
              </div>

              {/* Status Arsip */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800/80 gap-1.5">
                <span className="text-xs font-medium text-slate-400">Status Arsip:</span>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border w-fit ${getStatusArsipBadge(box.status_arsip)}`}>
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
                  {box.status_arsip}
                </span>
              </div>

              {/* Kelengkapan Barang */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <span className="text-xs font-medium text-slate-400">Kelengkapan Barang:</span>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border w-fit ${getStatusBarangBadge(box.status_barang)}`}>
                  {box.status_barang}
                </span>
              </div>
            </div>
          </div>

          {/* ========================================================
              4. TOMBOL AKSI UTAMA (CALL TO ACTION)
              Tombol hijau mencolok "BUKA DOKUMENTASI DIGITAL (GOOGLE DRIVE)"
              langsung mengarah ke link Drive boks tersebut
              ======================================================== */}
          <div className="pt-1">
            <a
              id="btn-buka-dokumentasi-drive-modal"
              href={box.link_dokumentasi || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative w-full flex flex-col items-center justify-center py-4 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:via-teal-500 hover:to-emerald-500 text-white shadow-xl shadow-emerald-950/70 border border-emerald-400/40 transition-all duration-200 transform active:scale-[0.99] cursor-pointer"
            >
              <div className="flex items-center space-x-2.5">
                {/* Google Drive Colorful Icon */}
                <div className="w-6 h-6 flex items-center justify-center bg-white rounded p-0.5 shadow-sm flex-shrink-0">
                  <svg className="w-4 h-4" viewBox="0 0 87.3 78" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0c0 1.55.4 3.1 1.2 4.5l5.4 9.35z" fill="#0066DA"/>
                    <path d="M43.65 25 29.9 1.2c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44C.4 49.9 0 51.45 0 53h27.5L43.65 25z" fill="#00AC47"/>
                    <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.8l5.85 10.15 7.9 13.65z" fill="#EA4335"/>
                    <path d="M43.65 25 57.4 1.2c-1.35-.8-2.9-1.2-4.5-1.2H34.4c-1.6 0-3.15.4-4.5 1.2l13.75 23.8z" fill="#00832D"/>
                    <path d="M59.8 53H87.3c0-1.55-.4-3.1-1.2-4.5l-25.4-44c-.8-1.4-1.95-2.5-3.3-3.3L43.65 25 59.8 53z" fill="#FFBA00"/>
                    <path d="m27.5 53 16.15 28c1.35.8 2.9 1.2 4.5 1.2h21.4c1.6 0 3.15-.4 4.5-1.2L59.8 53H27.5z" fill="#2684FC"/>
                  </svg>
                </div>
                <span className="font-extrabold text-xs sm:text-sm tracking-wider uppercase text-white drop-shadow">
                  BUKA DOKUMENTASI DIGITAL (GOOGLE DRIVE)
                </span>
                <ExternalLink className="w-4 h-4 text-emerald-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
              <span className="text-[11px] text-emerald-100 font-medium mt-1 text-center">
                Klik untuk membuka foto berkas dan sampel hasil pelatihan
              </span>
            </a>
          </div>

          {/* Quick Action: Cetak / Dapatkan QR Code */}
          {onShowQr && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-center space-x-2 text-xs text-slate-300">
                <QrCode className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>QR Code Label Fisik Boks ini</span>
              </div>
              <button
                onClick={() => onShowQr(box)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-emerald-950 hover:border-emerald-700 hover:text-emerald-300 border border-slate-700 text-xs font-semibold text-slate-200 transition"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Cetak / Dapatkan QR Code</span>
              </button>
            </div>
          )}

          {/* Inline Raw JSON View toggle */}
          {showRawJson && (
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] text-emerald-400 overflow-x-auto">
              <pre>{JSON.stringify(box, null, 2)}</pre>
            </div>
          )}
        </div>

        {/* ========================================================
            5. FOOTER MODAL: Opsi "Lihat Format JSON" / "Raw API"
            ======================================================== */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs flex-shrink-0">
          <button
            onClick={() => {
              if (onViewJson) {
                onViewJson(box);
              } else {
                setShowRawJson((prev) => !prev);
              }
            }}
            className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-indigo-300 font-mono py-1.5 px-2.5 rounded-lg hover:bg-slate-800 border border-transparent hover:border-slate-700 transition"
          >
            <FileCode className="w-3.5 h-3.5 text-indigo-400" />
            <span>Lihat Format JSON / Raw API</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
