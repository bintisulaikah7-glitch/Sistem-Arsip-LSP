import React from 'react';
import { BoksArsip } from '../types.ts';
import { BoxCard } from './BoxCard.tsx';
import { ArrowLeft, Folder, QrCode, Database, Plus, Sparkles } from 'lucide-react';

interface PelatihanRakViewProps {
  lemariNama: string | number;
  namaRak: string;
  boxes: BoksArsip[];
  onBackToRakList: () => void;
  onBackToLemari: () => void;
  onShowQr: (box: BoksArsip) => void;
  onViewJson: (box: BoksArsip) => void;
  onEdit: (box: BoksArsip) => void;
  onDelete: (id_box: string) => void;
  onViewDetail?: (box: BoksArsip) => void;
  onOpenInputLokasi?: (lemari: string, rak: string) => void;
}

export const PelatihanRakView: React.FC<PelatihanRakViewProps> = ({
  lemariNama,
  namaRak,
  boxes,
  onBackToRakList,
  onBackToLemari,
  onShowQr,
  onViewJson,
  onEdit,
  onDelete,
  onViewDetail,
  onOpenInputLokasi
}) => {
  const lemariDisplay = typeof lemariNama === 'number' || !lemariNama.toString().toLowerCase().startsWith('lemari')
    ? `Lemari ${lemariNama}`
    : lemariNama.toString();

  // Helper matching Lemari & Rak
  const matchesLemariAndRak = (item: any) => {
    if (!item) return false;
    const l1 = item.lokasi?.lemari;
    const l2 = item.Kode_Lemari || item['Kode Lemari'] || item['Lemari'];
    const targetLemariStr = lemariNama.toString().replace(/lemari[-_\s]*/i, '').trim();

    const lemariMatch = (l1 !== undefined && l1 !== null && l1.toString() === targetLemariStr) ||
      (l2 && l2.toString().replace(/lemari[-_\s]*/i, '').trim() === targetLemariStr);

    if (!lemariMatch) return false;

    const r = (item.lokasi?.rak || item.Nomor_Rak || item['Nomor_Rak'] || item['Nomor Rak'] || 'Rak 1').toString().trim().toLowerCase();
    const targetRak = namaRak.trim().toLowerCase();

    return r === targetRak || r.replace(/[-_\s]/g, '') === targetRak.replace(/[-_\s]/g, '');
  };

  // Filter boks yang HANYA ada di Lemari & Rak yang diklik
  const listPelatihan = boxes.filter(matchesLemariAndRak);
  const totalPeserta = listPelatihan.reduce((acc, curr) => acc + (curr.jumlah_peserta || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBackToRakList}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-emerald-950 hover:border-emerald-700 hover:text-emerald-300 text-slate-200 text-xs font-semibold border border-slate-700 transition shadow-sm"
            title={`Kembali ke Daftar Rak ${lemariDisplay}`}
          >
            <ArrowLeft className="w-4 h-4 text-emerald-400" />
            <span>&larr; Kembali ke {namaRak}</span>
          </button>
          <div className="h-6 w-px bg-slate-800 hidden sm:block" />
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-emerald-400 font-semibold">📁 {namaRak}</span>
              <span className="text-slate-500">•</span>
              <span className="text-xs text-slate-300 font-medium">{lemariDisplay}</span>
              <span className="text-xs font-semibold text-emerald-300 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-800">
                {listPelatihan.length} Boks Pelatihan
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Daftar pelatihan dan arsip berkas di dalam {namaRak}, {lemariDisplay} ({totalPeserta} Total Peserta)
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          {onOpenInputLokasi && (
            <button
              onClick={() => onOpenInputLokasi(`Lemari-${lemariNama}`, namaRak)}
              className="inline-flex items-center space-x-1.5 text-xs text-teal-300 hover:text-teal-200 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-teal-900/60 transition"
              title={`Generate QR Lokasi untuk ${lemariDisplay} - ${namaRak}`}
            >
              <QrCode className="w-3.5 h-3.5 text-teal-400" />
              <span>QR Lokasi Rak</span>
            </button>
          )}

          <button
            onClick={onBackToLemari}
            className="inline-flex items-center space-x-1 text-xs text-slate-400 hover:text-slate-200 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 transition"
          >
            <span>Daftar Lemari</span>
          </button>
        </div>
      </div>

      {/* Grid of Box Cards (TAMPILAN KETIGA: DAFTAR PELATIHAN DI DALAM RAK) */}
      {listPelatihan.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {listPelatihan.map((boks, idx) => (
            <BoxCard
              key={`${boks.id_box}-${idx}`}
              box={boks}
              onViewJson={onViewJson}
              onEdit={onEdit}
              onDelete={onDelete}
              onShowQr={onShowQr}
              onViewDetail={onViewDetail}
            />
          ))}
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
          <Folder className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-200">
            Belum Ada Boks Pelatihan di {namaRak} ({lemariDisplay})
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Gunakan tombol Tambah Boks atau Input Lokasi untuk menempatkan berkas pelatihan di lemari dan rak ini.
          </p>
          {onOpenInputLokasi && (
            <button
              onClick={() => onOpenInputLokasi(`Lemari-${lemariNama}`, namaRak)}
              className="mt-4 inline-flex items-center space-x-2 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Berkas ke {namaRak}</span>
            </button>
          )}
        </div>
      )}

      {/* Tombol Navigasi Bawah */}
      <div className="pt-2 flex items-center space-x-3">
        <button
          onClick={onBackToRakList}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 text-emerald-400" />
          <span>← Kembali ke {namaRak}</span>
        </button>

        <button
          onClick={onBackToLemari}
          className="inline-flex items-center space-x-2 px-3 py-2 rounded-lg bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800 text-xs font-medium transition"
        >
          <span>Daftar Lemari</span>
        </button>
      </div>
    </div>
  );
};
