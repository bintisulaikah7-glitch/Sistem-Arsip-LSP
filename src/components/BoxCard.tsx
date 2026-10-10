import React from 'react';
import { BoksArsip } from '../types.ts';
import { 
  FileCode, 
  MapPin, 
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
  onViewDetail?: (box: BoksArsip) => void;
}

export const BoxCard: React.FC<BoxCardProps> = ({
  box,
  onViewJson,
  onEdit,
  onDelete,
  onShowQr,
  onViewDetail
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopyId = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(box.id_box);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const pesertaK = Math.max(0, box.jumlah_peserta - box.jumlah_peserta_bk);

  // Status Arsip Styling (Clean Light Enterprise)
  const getStatusArsipBadge = (status: BoksArsip['status_arsip']) => {
    switch (status) {
      case 'Tersedia':
      case 'Aktif':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Tidak Lengkap':
      case 'Inaktif':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Tidak Tersedia':
      case 'Dimusnahkan':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  // Status Barang Styling (Clean Light Enterprise)
  const getStatusBarangBadge = (status: BoksArsip['status_barang']) => {
    switch (status) {
      case 'Lengkap':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Tidak Lengkap':
      case 'Dipinjam':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Tidak Ada':
      case 'Diperbaiki':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const rawLemari = String(box.lokasi?.lemari ?? '').toLowerCase().trim();
  const idBoxLower = String(box.id_box || '').toLowerCase();
  const isBerkasKeluar =
    rawLemari === 'kosong' ||
    box.lokasi?.lemari === 0 ||
    box.lokasi?.lemari === '0' ||
    rawLemari === 'keluar' ||
    idBoxLower.includes('kosong') ||
    String(box.status_arsip || '').toLowerCase().includes('keluar') ||
    String(box.status_arsip || '').toLowerCase() === 'tidak tersedia';

  const hasLemari =
    !isBerkasKeluar &&
    (typeof box.lokasi.lemari === 'number'
      ? box.lokasi.lemari > 0
      : Boolean(box.lokasi.lemari && box.lokasi.lemari !== '0'));

  const lokasiDisplay = isBerkasKeluar
    ? 'Berada di Luar'
    : hasLemari
    ? `L${box.lokasi.lemari} • ${box.lokasi.rak} • ${box.lokasi.baris}`
    : 'Antrian / Tanpa Lemari';

  return (
    <div className={`bg-white border rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 shadow-sm hover:shadow-md ${
      isBerkasKeluar ? 'border-rose-200 hover:border-rose-400' : 'border-slate-200 hover:border-blue-400'
    }`}>
      <div>
        {/* Top Badges: ID Box & Lokasi */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center space-x-1.5 bg-blue-50/80 border border-blue-200 rounded-md px-2.5 py-1">
            <span className="font-mono text-xs font-bold text-blue-700">
              {box.id_box}
            </span>
            <button
              onClick={handleCopyId}
              className="text-slate-400 hover:text-blue-600 transition"
              title="Salin ID Boks Arsip"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>

          {/* Lokasi Object: Lemari, Rak, Baris */}
          <div className={`flex items-center space-x-1.5 text-xs px-2.5 py-1 rounded-md border font-medium ${
            isBerkasKeluar
              ? 'text-rose-700 bg-rose-50 border-rose-200 font-semibold'
              : 'text-slate-700 bg-slate-50 border-slate-200'
          }`}>
            <MapPin className={`w-3 h-3 shrink-0 ${isBerkasKeluar ? 'text-rose-600' : 'text-blue-600'}`} />
            <span className="truncate max-w-[170px]">{lokasiDisplay}</span>
          </div>
        </div>

        {/* Nama Pelatihan */}
        <h3 
          onClick={() => onViewDetail && onViewDetail(box)}
          className={`text-sm font-bold text-slate-900 line-clamp-2 mb-3 leading-snug tracking-tight ${
            onViewDetail ? 'cursor-pointer hover:text-blue-600 transition-colors' : ''
          }`}
          title={onViewDetail ? 'Klik untuk melihat detail boks arsip' : box.nama_pelatihan}
        >
          {box.nama_pelatihan}
        </h3>

        {/* Status Badges */}
        <div className="flex flex-wrap items-center gap-1.5 mb-4 text-[11px]">
          {isBerkasKeluar ? (
            <span className="px-2.5 py-0.5 rounded-full border border-rose-200 bg-rose-50 text-rose-700 font-bold">
              Berada di Luar / Berkas Keluar
            </span>
          ) : (
            <span className={`px-2.5 py-0.5 rounded-full border font-semibold ${getStatusArsipBadge(box.status_arsip)}`}>
              Arsip: {box.status_arsip}
            </span>
          )}
          <span className={`px-2.5 py-0.5 rounded-full border font-semibold ${getStatusBarangBadge(box.status_barang)}`}>
            Fisik: {box.status_barang}
          </span>
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full border border-slate-200 bg-slate-50 text-slate-600 font-medium">
            <Calendar className="w-3 h-3 text-slate-500" />
            <span>{box.tahun_pelaksanaan}</span>
          </span>
          {(box.hasilUjiKompetensi || box.hasil_uji_kompetensi) && (box.hasilUjiKompetensi !== '-' && box.hasil_uji_kompetensi !== '-') && (
            <span
              className="inline-block px-2.5 py-0.5 rounded-full border border-cyan-200 bg-cyan-50 text-cyan-800 font-semibold truncate max-w-[170px]"
              title={`Hasil Uji Kompetensi: ${box.hasilUjiKompetensi || box.hasil_uji_kompetensi}`}
            >
              Hasil: {box.hasilUjiKompetensi || box.hasil_uji_kompetensi}
            </span>
          )}
        </div>

        {/* Peserta Breakdown */}
        <div className="bg-slate-50/80 rounded-lg p-2.5 border border-slate-200 mb-4 grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <span className="block text-[10px] text-slate-500 font-medium">Total Peserta</span>
            <span className="font-bold text-slate-900 tabular-nums">{box.jumlah_peserta}</span>
          </div>
          <div>
            <span className="block text-[10px] text-emerald-700 font-semibold">Kompeten (K)</span>
            <span className="font-bold text-emerald-700 tabular-nums">{pesertaK}</span>
          </div>
          <div>
            <span className="block text-[10px] text-purple-700 font-semibold">Belum K (BK)</span>
            <span className="font-bold text-purple-700 tabular-nums">{box.jumlah_peserta_bk}</span>
          </div>
        </div>
      </div>

      {/* Footer / Actions */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        {/* Link Dokumentasi */}
        <a
          href={box.link_dokumentasi}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center space-x-1 text-slate-500 hover:text-blue-600 transition truncate max-w-[130px] font-medium"
          title={box.link_dokumentasi}
        >
          <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">Dokumentasi</span>
        </a>

        {/* Action icons */}
        <div className="flex items-center space-x-1.5">
          {onViewDetail && (
            <button
              onClick={() => onViewDetail(box)}
              className="px-2.5 py-1 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-md text-[11px] font-semibold transition shadow-2xs"
              title="Buka Rincian Boks Arsip"
            >
              Detail
            </button>
          )}

          <button
            onClick={() => onShowQr(box)}
            className="inline-flex items-center space-x-1.5 px-2.5 py-1 text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md text-xs font-semibold transition shadow-2xs"
            title="Cetak / Dapatkan QR Code"
          >
            <QrCode className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">Cetak QR</span>
            <span className="sm:hidden">QR</span>
          </button>

          <button
            onClick={() => onViewJson(box)}
            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition font-mono"
            title="Lihat Format JSON Resmi"
          >
            <FileCode className="w-4 h-4" />
          </button>

          <button
            onClick={() => onEdit(box)}
            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition"
            title="Edit Boks Arsip"
          >
            <Edit3 className="w-4 h-4" />
          </button>

          <button
            onClick={() => onDelete(box.id_box)}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition"
            title="Hapus Boks Arsip"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
