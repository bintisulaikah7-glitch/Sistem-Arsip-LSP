import React from 'react';
import { BoksArsip } from '../types.ts';
import { 
  FileCode, 
  MapPin, 
  Users, 
  Calendar, 
  ExternalLink, 
  Edit3, 
  Trash2, 
  QrCode,
  Copy,
  Check
} from 'lucide-react';

interface BoxCardProps {
  box: BoksArsip;
  onViewJson: (box: BoksArsip) => void;
  onEdit: (box: BoksArsip) => void;
  onDelete: (id_box: string) => void;
  onShowQr: (box: BoksArsip) => void;
}

export const BoxCard: React.FC<BoxCardProps> = ({
  box,
  onViewJson,
  onEdit,
  onDelete,
  onShowQr
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopyId = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(box.id_box);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const pesertaK = Math.max(0, box.jumlah_peserta - box.jumlah_peserta_bk);

  // Status Arsip Styling
  const getStatusArsipBadge = (status: BoksArsip['status_arsip']) => {
    switch (status) {
      case 'Tersedia':
      case 'Aktif':
        return 'bg-emerald-950/70 text-emerald-300 border-emerald-800';
      case 'Tidak Lengkap':
      case 'Inaktif':
        return 'bg-amber-950/70 text-amber-300 border-amber-800';
      case 'Tidak Tersedia':
      case 'Dimusnahkan':
        return 'bg-rose-950/70 text-rose-300 border-rose-800';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  // Status Barang Styling
  const getStatusBarangBadge = (status: BoksArsip['status_barang']) => {
    switch (status) {
      case 'Lengkap':
        return 'bg-blue-950/70 text-blue-300 border-blue-800';
      case 'Tidak Lengkap':
      case 'Dipinjam':
        return 'bg-purple-950/70 text-purple-300 border-purple-800';
      case 'Tidak Ada':
      case 'Diperbaiki':
        return 'bg-orange-950/70 text-orange-300 border-orange-800';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const lokasiDisplay =
    box.lokasi.lemari > 0
      ? `L${box.lokasi.lemari} • ${box.lokasi.rak} • ${box.lokasi.baris}`
      : 'Antrian / Tanpa Lemari';

  return (
    <div className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-5 flex flex-col justify-between transition-all duration-200 shadow-sm hover:shadow-md">
      <div>
        {/* Top Badges: ID Box & Lokasi */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center space-x-1.5 bg-slate-950 border border-slate-800 rounded-md px-2.5 py-1">
            <span className="font-mono text-xs font-bold text-emerald-400">
              {box.id_box}
            </span>
            <button
              onClick={handleCopyId}
              className="text-slate-500 hover:text-slate-300 transition"
              title="Salin ID Box"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>

          {/* Lokasi Object: Lemari, Rak, Baris */}
          <div className="flex items-center space-x-1 text-xs text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/60 font-mono">
            <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
            <span className="truncate max-w-[170px]">{lokasiDisplay}</span>
          </div>
        </div>

        {/* Nama Pelatihan */}
        <h3 className="text-sm font-semibold text-slate-100 line-clamp-2 mb-3 leading-snug">
          {box.nama_pelatihan}
        </h3>

        {/* Status Badges */}
        <div className="flex flex-wrap items-center gap-1.5 mb-4 text-[11px]">
          <span className={`px-2 py-0.5 rounded-full border font-medium ${getStatusArsipBadge(box.status_arsip)}`}>
            Arsip: {box.status_arsip}
          </span>
          <span className={`px-2 py-0.5 rounded-full border font-medium ${getStatusBarangBadge(box.status_barang)}`}>
            Fisik: {box.status_barang}
          </span>
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full border border-slate-800 bg-slate-950 text-slate-400">
            <Calendar className="w-3 h-3 text-slate-400" />
            <span>{box.tahun_pelaksanaan}</span>
          </span>
        </div>

        {/* Peserta Breakdown */}
        <div className="bg-slate-950 rounded-lg p-2.5 border border-slate-800/80 mb-4 grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <span className="block text-[10px] text-slate-500">Total Peserta</span>
            <span className="font-semibold text-slate-200">{box.jumlah_peserta}</span>
          </div>
          <div>
            <span className="block text-[10px] text-emerald-400">Kompeten (K)</span>
            <span className="font-semibold text-emerald-400">{pesertaK}</span>
          </div>
          <div>
            <span className="block text-[10px] text-purple-400">Belum K (BK)</span>
            <span className="font-semibold text-purple-400">{box.jumlah_peserta_bk}</span>
          </div>
        </div>
      </div>

      {/* Footer / Actions */}
      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
        {/* Link Dokumentasi */}
        <a
          href={box.link_dokumentasi}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center space-x-1 text-slate-400 hover:text-emerald-400 transition truncate max-w-[130px]"
          title={box.link_dokumentasi}
        >
          <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">Dokumentasi</span>
        </a>

        {/* Action icons */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => onShowQr(box)}
            className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded transition"
            title="Tampilkan QR Code Boks"
          >
            <QrCode className="w-4 h-4" />
          </button>

          <button
            onClick={() => onViewJson(box)}
            className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded transition font-mono"
            title="Lihat Format JSON Resmi"
          >
            <FileCode className="w-4 h-4" />
          </button>

          <button
            onClick={() => onEdit(box)}
            className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded transition"
            title="Edit Data Boks"
          >
            <Edit3 className="w-4 h-4" />
          </button>

          <button
            onClick={() => onDelete(box.id_box)}
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition"
            title="Hapus Boks"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
