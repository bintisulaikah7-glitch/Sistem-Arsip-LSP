import React, { useState } from 'react';
import { 
  Archive, 
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
  Info
} from 'lucide-react';
import { BoksArsip } from '../types.ts';

interface PortalBoxCardProps {
  box: BoksArsip;
  onToggleJson?: () => void;
  showJsonToggle?: boolean;
}

export const PortalBoxCard: React.FC<PortalBoxCardProps> = ({
  box,
  onToggleJson,
  showJsonToggle = true
}) => {
  const [copiedId, setCopiedId] = useState(false);

  const handleCopyId = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(box.id_box);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const kompetenCount = Math.max(0, (box.jumlah_peserta || 0) - (box.jumlah_peserta_bk || 0));

  // Status Arsip Styling
  const getStatusArsipBadge = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s.includes('tersedia') || s.includes('aktif')) {
      return 'bg-emerald-950/70 text-emerald-300 border-emerald-800';
    }
    if (s.includes('tidak') || s.includes('inaktif')) {
      return 'bg-amber-950/70 text-amber-300 border-amber-800';
    }
    return 'bg-rose-950/70 text-rose-300 border-rose-800';
  };

  // Status Barang Styling
  const getStatusBarangBadge = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s.includes('lengkap')) {
      return 'bg-blue-950/70 text-blue-300 border-blue-800';
    }
    if (s.includes('tidak') || s.includes('pinjam')) {
      return 'bg-purple-950/70 text-purple-300 border-purple-800';
    }
    return 'bg-slate-800 text-slate-300 border-slate-700';
  };

  // Lokasi string
  const lemariVal = box.lokasi?.lemari !== undefined && box.lokasi?.lemari !== null ? box.lokasi.lemari : '-';
  const rakVal = box.lokasi?.rak ? box.lokasi.rak : '-';
  const barisVal = box.lokasi?.baris ? box.lokasi.baris : '-';

  return (
    <div className="bg-slate-900 border border-slate-700/80 rounded-2xl overflow-hidden shadow-2xl">
      {/* 1. HEADER POPUP */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-5 py-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 p-0.5 shadow-md flex items-center justify-center flex-shrink-0">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-emerald-400">
              <FolderArchive className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h2 className="font-bold text-base md:text-lg text-white tracking-wide flex items-center gap-2">
              <span>PORTAL ARSIP LSP BDI</span>
            </h2>
            <p className="text-[11px] md:text-xs text-slate-400">
              Balai Diklat Industri Padang • Sistem Informasi Berkas Pelatihan
            </p>
          </div>
        </div>

        <button
          onClick={handleCopyId}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono transition"
          title="Salin ID Boks"
        >
          {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">{copiedId ? 'Tersalin' : 'Salin ID'}</span>
        </button>
      </div>

      <div className="p-5 md:p-6 space-y-4">
        {/* 2. SECTION 1 - DETAIL BOKS */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden">
          {/* Header Seksi dengan latar belakang abu-abu yang rapi */}
          <div className="px-4 py-2.5 bg-slate-800/90 border-b border-slate-700/80 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                DETAIL BOKS
              </h3>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">Informasi Dokumen</span>
          </div>

          <div className="p-4 space-y-3 text-sm">
            {/* Kode Boks */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2.5 border-b border-slate-800/80 gap-1">
              <span className="text-xs font-medium text-slate-400">Kode Boks:</span>
              <span className="font-mono font-bold text-sm md:text-base text-emerald-400 bg-emerald-950/40 px-2.5 py-1 rounded border border-emerald-800/60 w-fit">
                {box.id_box}
              </span>
            </div>

            {/* Nama Pelatihan */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between pb-2.5 border-b border-slate-800/80 gap-1">
              <span className="text-xs font-medium text-slate-400 sm:w-1/3 flex-shrink-0">
                Nama Pelatihan:
              </span>
              <span className="font-semibold text-slate-100 sm:text-right leading-snug">
                {box.nama_pelatihan}
              </span>
            </div>

            {/* Tahun Pelaksanaan */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2.5 border-b border-slate-800/80 gap-1">
              <span className="text-xs font-medium text-slate-400 flex items-center">
                <Calendar className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                Tahun Pelaksanaan:
              </span>
              <span className="font-semibold text-slate-200 bg-slate-900 px-2.5 py-0.5 rounded border border-slate-800 w-fit">
                {box.tahun_pelaksanaan}
              </span>
            </div>

            {/* Jumlah Peserta */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
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

        {/* 3. SECTION 2 - LOKASI FISIK & KETERANGAN */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden">
          {/* Header Seksi dengan latar belakang abu-abu yang rapi */}
          <div className="px-4 py-2.5 bg-slate-800/90 border-b border-slate-700/80 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-teal-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                LOKASI FISIK & KETERANGAN
              </h3>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">Gudang Arsip</span>
          </div>

          <div className="p-4 space-y-3 text-sm">
            {/* Lokasi Penyimpanan */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2.5 border-b border-slate-800/80 gap-1">
              <span className="text-xs font-medium text-slate-400">Lokasi Penyimpanan:</span>
              <span className="font-semibold text-teal-300 bg-teal-950/40 px-2.5 py-1 rounded border border-teal-800/50 w-fit">
                Lemari {lemariVal} - {rakVal} ({barisVal})
              </span>
            </div>

            {/* Status Arsip */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2.5 border-b border-slate-800/80 gap-1">
              <span className="text-xs font-medium text-slate-400">Status Arsip:</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border w-fit ${getStatusArsipBadge(box.status_arsip)}`}>
                <CheckCircle2 className="w-3 h-3 mr-1 flex-shrink-0" />
                {box.status_arsip}
              </span>
            </div>

            {/* Kelengkapan Barang */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <span className="text-xs font-medium text-slate-400">Kelengkapan Barang:</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border w-fit ${getStatusBarangBadge(box.status_barang)}`}>
                {box.status_barang}
              </span>
            </div>
          </div>
        </div>

        {/* 4. TOMBOL UTAMA (CALL TO ACTION) */}
        <div className="pt-1">
          <a
            id="btn-buka-dokumentasi-drive"
            href={box.link_dokumentasi || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative w-full flex flex-col items-center justify-center py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:via-teal-500 hover:to-emerald-500 text-white shadow-lg shadow-emerald-950/60 border border-emerald-500/30 transition-all duration-200 transform active:scale-[0.99] cursor-pointer"
          >
            <div className="flex items-center space-x-2.5">
              {/* Official Google Drive Colorful Icon */}
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
              Klik untuk melihat foto dan sampel hasil pelatihan
            </span>
          </a>
        </div>

        {/* 5. OPSIONAL: LIHAT FORMAT JSON */}
        {showJsonToggle && onToggleJson && (
          <div className="pt-2 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80">
            <span className="text-[11px] text-slate-500 font-mono">
              Format Raw API: Valid JSON
            </span>
            <button
              onClick={onToggleJson}
              className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-emerald-400 transition py-1 px-2 rounded hover:bg-slate-800"
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Lihat Format JSON</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
