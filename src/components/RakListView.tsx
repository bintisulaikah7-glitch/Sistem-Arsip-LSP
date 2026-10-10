import React from 'react';
import { ArrowLeft, Layers, QrCode, Database, ArrowRight, Folder, Archive } from 'lucide-react';
import { BoksArsip } from '../types.ts';
import { STANDARD_RAKS, standardizeRakName, MAX_BOXES_PER_RAK, MAX_BOXES_PER_LEMARI } from '../utils/csvParser.ts';

interface RakListViewProps {
  lemariNama: string | number;
  boxes: BoksArsip[];
  onSelectRak: (rak: string) => void;
  onBackToLemari: () => void;
  onViewAllSekat?: () => void;
  onOpenInputLokasi?: (lemari: string, rak?: string) => void;
  onViewJsonLemari?: () => void;
}

export const RakListView: React.FC<RakListViewProps> = ({
  lemariNama,
  boxes,
  onSelectRak,
  onBackToLemari,
  onViewAllSekat,
  onOpenInputLokasi,
  onViewJsonLemari
}) => {
  // Normalize Lemari string
  const lemariDisplay =
    typeof lemariNama === 'number' || (lemariNama !== undefined && lemariNama !== null && !lemariNama.toString().toLowerCase().startsWith('lemari'))
      ? `Lemari ${lemariNama ?? 1}`
      : String(lemariNama ?? '1');

  // 1. Ambil data HANYA dari Lemari yang diklik
  const matchesLemari = (item: any) => {
    if (!item) return false;
    const l1 = item.lokasi?.lemari;
    const l2 = item.Kode_Lemari || item['Kode Lemari'] || item['Lemari'];

    const lemariStr = String(lemariNama ?? '');
    
    // Check direct equality
    if (l1 !== undefined && l1 !== null && String(l1) === lemariStr) return true;
    if (l2 !== undefined && l2 !== null && String(l2) === lemariStr) return true;

    // Check stripped normalized number/id
    const targetStr = lemariStr.replace(/lemari[-_\s]*/i, '').trim();
    if (l1 !== undefined && l1 !== null && String(l1).replace(/lemari[-_\s]*/i, '').trim() === targetStr) return true;
    if (l2 !== undefined && l2 !== null && String(l2).replace(/lemari[-_\s]*/i, '').trim() === targetStr) return true;

    return false;
  };

  const dataLemariIni = boxes.filter(matchesLemari);

  // 2. Daftar Rak terstandarisasi Rak A, Rak B, Rak C, Rak D (Maks 11 Boks per Rak)
  const standardSet = new Set<string>(STANDARD_RAKS);
  dataLemariIni.forEach(item => {
    const rawR = (item.lokasi?.rak || (item as any).Nomor_Rak || (item as any)['Nomor_Rak'] || (item as any)['Nomor Rak'] || (item as any).Rak || '').toString().trim();
    if (rawR && rawR !== '-' && rawR.toLowerCase() !== 'kosong') {
      standardSet.add(standardizeRakName(rawR));
    }
  });
  const daftarRakUnik = Array.from(standardSet).sort();

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Info Lemari & Actions */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBackToLemari}
            className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-800 text-slate-700 text-xs font-semibold border border-slate-300 transition shadow-2xs"
            title="Kembali ke Daftar Lemari"
          >
            <ArrowLeft className="w-4 h-4 text-blue-600" />
            <span>&larr; Kembali ke Daftar Lemari</span>
          </button>
          <div className="h-6 w-px bg-slate-200 hidden sm:block" />
          <div>
            <div className="flex items-center space-x-2">
              <Archive className="w-4 h-4 text-blue-600" />
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                {lemariDisplay}
              </h2>
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                dataLemariIni.length >= MAX_BOXES_PER_LEMARI
                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                  : 'text-blue-700 bg-blue-50 border-blue-200'
              }`}>
                {dataLemariIni.length}/{MAX_BOXES_PER_LEMARI} Boks Arsip
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Pilih rak untuk membuka daftar pelatihan dan dokumen berkas di dalamnya
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          {onViewAllSekat && (
            <button
              onClick={onViewAllSekat}
              className="inline-flex items-center space-x-1.5 text-xs text-slate-700 hover:text-blue-700 px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 transition shadow-2xs font-semibold"
              title="Tampilkan semua sekat rak sekaligus"
            >
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>Lihat Semua Sekat</span>
            </button>
          )}

          {onOpenInputLokasi && (
            <button
              onClick={() => onOpenInputLokasi(`Lemari-${lemariNama}`)}
              className="inline-flex items-center space-x-1.5 text-xs text-blue-700 hover:text-blue-800 px-2.5 py-1.5 rounded-lg bg-blue-50 border border-blue-200 transition shadow-2xs font-semibold"
              title={`Generate QR Lokasi untuk ${lemariDisplay}`}
            >
              <QrCode className="w-3.5 h-3.5 text-blue-600" />
              <span>QR {lemariDisplay}</span>
            </button>
          )}

          {onViewJsonLemari && (
            <button
              onClick={onViewJsonLemari}
              className="inline-flex items-center space-x-1.5 text-xs text-indigo-700 hover:text-indigo-800 px-2.5 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 font-mono transition shadow-2xs font-semibold"
            >
              <Database className="w-3.5 h-3.5 text-indigo-600" />
              <span>JSON Lemari</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. Jika tidak ada rak terdeteksi dari data */}
      {daftarRakUnik.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center shadow-xs">
          <p style={{ color: '#64748b' }} className="text-sm font-medium">
            Belum ada data rak di {lemariDisplay}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {daftarRakUnik.map((rak, idx) => {
            // Hitung jumlah boks aktual di rak tersebut
            const boksDiRakIni = dataLemariIni.filter(item => {
              const anyItem = item as any;
              const r = (item.lokasi?.rak || anyItem.Nomor_Rak || anyItem['Nomor_Rak'] || anyItem['Nomor Rak'] || anyItem.Rak || '').toString().trim();
              return standardizeRakName(r) === rak;
            });
            const jumlahBoks = boksDiRakIni.length;
            const rakTitle = rak.includes('Rak') ? rak : 'Rak ' + rak;
            const isPenuh = jumlahBoks >= MAX_BOXES_PER_RAK;

            return (
              <div
                key={`rak-card-${rak}-${idx}`}
                onClick={() => onSelectRak(rak)}
                className={`group bg-white p-5 rounded-xl border shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col items-center text-center justify-between ${
                  isPenuh ? 'border-amber-300 ring-1 ring-amber-200' : 'border-slate-200 hover:border-blue-400'
                }`}
              >
                <div className="flex justify-center mb-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-2xs border transition-colors ${
                    isPenuh
                      ? 'bg-amber-50 text-amber-600 border-amber-200 group-hover:bg-amber-100'
                      : 'bg-blue-50 text-blue-600 border-blue-200 group-hover:bg-blue-600 group-hover:text-white'
                  }`}>
                    <Folder className="w-6 h-6" />
                  </div>
                </div>
                <h3 className="font-bold text-base text-slate-900 group-hover:text-blue-700 transition-colors mb-1">
                  {rakTitle}
                </h3>
                <p className="text-xs font-semibold text-slate-600 mb-3">
                  <span className="tabular-nums font-bold text-slate-900">{jumlahBoks}</span>/{MAX_BOXES_PER_RAK} Boks Arsip
                  {isPenuh && <span className="ml-1 text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">(Penuh)</span>}
                </p>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 group-hover:text-blue-700 group-hover:translate-x-0.5 transition-all mt-auto pt-2 border-t border-slate-100 w-full justify-center">
                  <span>Buka Berkas Rak</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Tombol Navigasi Bawah */}
      <div className="pt-2">
        <button
          onClick={onBackToLemari}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-300 text-xs font-semibold transition shadow-xs"
        >
          <ArrowLeft className="w-4 h-4 text-blue-600" />
          <span>← Kembali ke Daftar Lemari</span>
        </button>
      </div>
    </div>
  );
};
