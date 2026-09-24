import React from 'react';
import { BoksArsip } from '../types.ts';
import { BoxCard } from './BoxCard.tsx';
import { Folder, Layers, QrCode, Sparkles, Plus, ExternalLink, Calendar, Users } from 'lucide-react';

interface RakGroupViewProps {
  boxes: BoksArsip[];
  lemariYangDipilih: number | string;
  onViewJson: (box: BoksArsip) => void;
  onEdit: (box: BoksArsip) => void;
  onDelete: (id_box: string) => void;
  onShowQr: (box: BoksArsip) => void;
  onViewDetail?: (box: BoksArsip) => void;
  onOpenInputLokasiWithRak?: (lemari: string, rak: string) => void;
}

export const RakGroupView: React.FC<RakGroupViewProps> = ({
  boxes,
  lemariYangDipilih,
  onViewJson,
  onEdit,
  onDelete,
  onShowQr,
  onViewDetail,
  onOpenInputLokasiWithRak
}) => {
  // Helper to normalize Lemari value
  const matchesLemari = (item: any, target: number | string) => {
    if (!item) return false;
    const l1 = item.lokasi?.lemari;
    const l2 = item.Kode_Lemari || item['Kode Lemari'] || item['Lemari'];

    const targetStr = target.toString().replace(/lemari[-_\s]*/i, '').trim();
    if (l1 !== undefined && l1 !== null && l1.toString() === targetStr) return true;
    if (l2 && l2.toString().replace(/lemari[-_\s]*/i, '').trim() === targetStr) return true;
    return false;
  };

  // 1. Filter data berdasarkan Lemari
  const dataLemari = boxes.filter(item => matchesLemari(item, lemariYangDipilih));

  // 2. Ambil daftar Rak unik yang ada di lemari tersebut
  const daftarRak = Array.from(
    new Set(
      dataLemari.map(item => {
        const r = item.lokasi?.rak || item.Nomor_Rak || item['Nomor_Rak'] || item['Nomor Rak'] || 'Tanpa Rak';
        return r ? r.toString().trim() : 'Tanpa Rak';
      })
    )
  ).sort((a, b) => {
    // Put "Tanpa Rak" at the end, sort others naturally
    if (a === 'Tanpa Rak') return 1;
    if (b === 'Tanpa Rak') return -1;
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
  });

  if (dataLemari.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
        <Folder className="w-8 h-8 text-slate-500 mx-auto mb-2" />
        <p className="text-sm font-semibold text-slate-300">
          Belum ada boks berkas di Lemari {lemariYangDipilih}
        </p>
        <p className="text-xs text-slate-500 mt-1">
          Gunakan tombol Tambah Boks atau Input Lokasi untuk menempatkan boks pada rak lemari ini.
        </p>
      </div>
    );
  }

  return (
    <div id="container-arsip" className="space-y-6">
      {/* Sekat / Pengelompokan Berdasarkan RAK */}
      {daftarRak.map((namaRak, index) => {
        // Ambil boks pelatihan yang HANYA ada di Rak ini
        const boksDiRakIni = dataLemari.filter(item => {
          const r = (item.lokasi?.rak || item.Nomor_Rak || item['Nomor_Rak'] || item['Nomor Rak'] || 'Tanpa Rak').toString().trim();
          return r === namaRak;
        });

        const totalPesertaRak = boksDiRakIni.reduce((acc, curr) => acc + (curr.jumlah_peserta || curr['Jumlah Peserta'] || 0), 0);

        return (
          <div
            key={`rak-${namaRak}-${index}`}
            className="rak-group rounded-xl border border-slate-700/80 bg-slate-900/95 p-5 shadow-lg relative overflow-hidden transition hover:border-emerald-700/60"
          >
            {/* Folder Tab / Sekat Rak Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-4 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-950/90 border border-emerald-700/70 flex items-center justify-center text-emerald-400 shadow-sm">
                  <Folder className="w-5 h-5 text-emerald-400 fill-emerald-950" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-emerald-400 flex items-center gap-2 tracking-tight">
                    <span>📁 Lemari {lemariYangDipilih} - {namaRak}</span>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 shadow-inner">
                      {boksDiRakIni.length} Boks
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5 flex items-center space-x-2">
                    <span>Sekat Rak Arsip Fisik</span>
                    <span>•</span>
                    <span>{totalPesertaRak} Total Peserta Terarsip</span>
                  </p>
                </div>
              </div>

              {/* Quick Action Button for this Shelf */}
              {onOpenInputLokasiWithRak && (
                <button
                  onClick={() => onOpenInputLokasiWithRak(`Lemari-${lemariYangDipilih}`, namaRak)}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-emerald-600/60 transition shadow-sm self-start sm:self-auto"
                  title={`Buat QR Code Lokasi untuk Lemari ${lemariYangDipilih} - ${namaRak}`}
                >
                  <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                  <span>+ Buat QR Lokasi Rak Ini</span>
                </button>
              )}
            </div>

            {/* Grid Boks di dalam Rak Ini */}
            <div className="grid-boks grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {boksDiRakIni.map((boks, boksIdx) => (
                <BoxCard
                  key={`${boks.id_box || boks.Kode_boks || boksIdx}-${boksIdx}`}
                  box={boks}
                  onViewJson={onViewJson}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onShowQr={onShowQr}
                  onViewDetail={onViewDetail}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
