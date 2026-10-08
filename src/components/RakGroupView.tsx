import React from 'react';
import { BoksArsip } from '../types.ts';
import { BoxCard } from './BoxCard.tsx';
import { Folder, Layers, QrCode, Sparkles, Plus, ExternalLink, Calendar, Users } from 'lucide-react';

interface RakGroupViewProps {
  boxes: BoksArsip[];
  lemariYangDipilih?: number | string | null;
  onViewJson: (box: BoksArsip) => void;
  onEdit?: (box: BoksArsip) => void;
  onDelete?: (id_box: string) => void;
  onShowQr?: (box: BoksArsip) => void;
  onViewDetail?: (box: BoksArsip) => void;
  onOpenInputLokasiWithRak?: (lemari: string, rak: string) => void;
  onSelectBox?: (box: BoksArsip) => void;
  onMoveBox?: (id_box: string, targetLemari: number | string, targetRak: string) => void;
  onEditBox?: (box: BoksArsip) => void;
  onDeleteBox?: (id_box: string) => void;
  onOpenQrModal?: (box: BoksArsip) => void;
}

export const RakGroupView: React.FC<RakGroupViewProps> = ({
  boxes,
  lemariYangDipilih,
  onViewJson,
  onEdit,
  onDelete,
  onShowQr,
  onViewDetail,
  onOpenInputLokasiWithRak,
  onSelectBox,
  onEditBox,
  onDeleteBox,
  onOpenQrModal
}) => {
  const effectiveEdit = onEdit || onEditBox || (() => {});
  const effectiveDelete = onDelete || onDeleteBox || (() => {});
  const effectiveShowQr = onShowQr || onOpenQrModal || (() => {});
  const effectiveDetail = onViewDetail || onSelectBox || (() => {});

  // Helper to normalize Lemari value safely
  const matchesLemari = (item: any, target?: number | string | null) => {
    if (!item) return false;
    if (target === undefined || target === null || target === '' || target === 'Semua') {
      return true;
    }
    const l1 = item.lokasi?.lemari;
    const l2 = item.Kode_Lemari || item['Kode Lemari'] || item['Lemari'];

    const targetStr = String(target ?? '').replace(/lemari[-_\s]*/i, '').trim();
    if (l1 !== undefined && l1 !== null && String(l1).replace(/lemari[-_\s]*/i, '').trim() === targetStr) return true;
    if (l2 !== undefined && l2 !== null && String(l2).replace(/lemari[-_\s]*/i, '').trim() === targetStr) return true;
    return false;
  };

  // 1. Filter data berdasarkan Lemari
  const dataLemari = boxes.filter(item => matchesLemari(item, lemariYangDipilih));

  // 2. Ambil daftar Rak unik yang ada di lemari tersebut
  const daftarRak = Array.from(
    new Set(
      dataLemari.map(item => {
        if (!item) return 'Tanpa Rak';
        const r = item.lokasi?.rak || item.Nomor_Rak || item['Nomor_Rak'] || item['Nomor Rak'] || 'Tanpa Rak';
        return r ? String(r).trim() : 'Tanpa Rak';
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
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500 shadow-xs">
        <Folder className="w-8 h-8 text-slate-400 mx-auto mb-2" />
        <p className="text-sm font-bold text-slate-900">
          Belum ada boks arsip di Lemari {lemariYangDipilih}
        </p>
        <p className="text-xs text-slate-500 mt-1">
          Gunakan tombol Tambah Boks Arsip atau Input Lokasi untuk menempatkan boks pada rak lemari ini.
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
          if (!item) return false;
          const r = String(item.lokasi?.rak || item.Nomor_Rak || item['Nomor_Rak'] || item['Nomor Rak'] || 'Tanpa Rak').trim();
          return r === namaRak;
        });

        const totalPesertaRak = boksDiRakIni.reduce((acc, curr) => acc + (curr.jumlah_peserta || curr['Jumlah Peserta'] || 0), 0);

        return (
          <div
            key={`rak-${namaRak}-${index}`}
            className="rak-group rounded-xl border border-slate-200 bg-white p-5 shadow-xs relative overflow-hidden transition hover:border-blue-300"
          >
            {/* Folder Tab / Sekat Rak Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-2xs">
                  <Folder className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 tracking-tight">
                    <span>{lemariYangDipilih ? `Lemari ${lemariYangDipilih} - ` : ''}{namaRak}</span>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      {boksDiRakIni.length} Boks Arsip
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5 flex items-center space-x-2">
                    <span>Sekat Rak Arsip Fisik</span>
                    <span>•</span>
                    <span>{totalPesertaRak.toLocaleString('id-ID')} Total Peserta Terarsip</span>
                  </p>
                </div>
              </div>

              {/* Quick Action Button for this Shelf */}
              {onOpenInputLokasiWithRak && (
                <button
                  onClick={() => onOpenInputLokasiWithRak(`Lemari-${lemariYangDipilih}`, namaRak)}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 hover:border-blue-400 transition shadow-2xs self-start sm:self-auto"
                  title={`Buat QR Code Lokasi untuk Lemari ${lemariYangDipilih} - ${namaRak}`}
                >
                  <QrCode className="w-3.5 h-3.5 text-blue-600" />
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
                  onEdit={effectiveEdit}
                  onDelete={effectiveDelete}
                  onShowQr={effectiveShowQr}
                  onViewDetail={effectiveDetail}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
