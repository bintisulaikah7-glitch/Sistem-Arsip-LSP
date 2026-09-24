import React from 'react';
import { Folder, ArrowLeft, Layers, QrCode, Database, ArrowRight, Package } from 'lucide-react';
import { BoksArsip } from '../types.ts';

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
  const lemariDisplay = typeof lemariNama === 'number' || !lemariNama.toString().toLowerCase().startsWith('lemari')
    ? `Lemari ${lemariNama}`
    : lemariNama.toString();

  // Helper matching
  const matchesLemari = (item: any) => {
    if (!item) return false;
    const l1 = item.lokasi?.lemari;
    const l2 = item.Kode_Lemari || item['Kode Lemari'] || item['Lemari'];
    const targetStr = lemariNama.toString().replace(/lemari[-_\s]*/i, '').trim();

    if (l1 !== undefined && l1 !== null && l1.toString() === targetStr) return true;
    if (l2 && l2.toString().replace(/lemari[-_\s]*/i, '').trim() === targetStr) return true;
    return false;
  };

  // Filter data khusus lemari yang diklik
  const dataLemariIni = boxes.filter(matchesLemari);

  // Ambil daftar Rak unik yang ada di lemari ini
  const rawRakList = dataLemariIni.map(item => {
    return (item.lokasi?.rak || item.Nomor_Rak || item['Nomor_Rak'] || item['Nomor Rak'] || 'Rak 1').toString().trim();
  });

  // Ensure default Rak 1 to Rak 4 are present if it's standard LSP cabinet, plus any custom ones from sheet
  const defaultRaks = ['Rak 1', 'Rak 2', 'Rak 3', 'Rak 4'];
  const allRaks = Array.from(new Set([...defaultRaks, ...rawRakList])).sort((a, b) => {
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Info Lemari & Actions */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBackToLemari}
            className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-emerald-950 hover:border-emerald-700 hover:text-emerald-300 text-slate-200 text-xs font-semibold border border-slate-700 transition shadow-sm"
            title="Kembali ke Daftar Lemari"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-400" />
            <span>&larr; Kembali ke Daftar Lemari</span>
          </button>
          <div className="h-6 w-px bg-slate-800 hidden sm:block" />
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-lg">🗄️</span>
              <h2 className="text-base font-bold text-white tracking-wide">
                {lemariDisplay}
              </h2>
              <span className="text-xs font-semibold text-emerald-300 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-800">
                {dataLemariIni.length} Boks Arsip
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Silakan pilih rak untuk membuka daftar pelatihan dan boks berkas di dalamnya
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          {onViewAllSekat && (
            <button
              onClick={onViewAllSekat}
              className="inline-flex items-center space-x-1.5 text-xs text-emerald-300 hover:text-emerald-200 px-2.5 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-800 transition"
              title="Tampilkan semua sekat rak sekaligus"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Lihat Semua Sekat</span>
            </button>
          )}

          {onOpenInputLokasi && (
            <button
              onClick={() => onOpenInputLokasi(`Lemari-${lemariNama}`)}
              className="inline-flex items-center space-x-1.5 text-xs text-teal-300 hover:text-teal-200 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-teal-900/60 transition"
              title={`Generate QR Lokasi untuk ${lemariDisplay}`}
            >
              <QrCode className="w-3.5 h-3.5 text-teal-400" />
              <span>QR {lemariDisplay}</span>
            </button>
          )}

          {onViewJsonLemari && (
            <button
              onClick={onViewJsonLemari}
              className="inline-flex items-center space-x-1.5 text-xs text-indigo-400 hover:text-indigo-300 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 font-mono transition"
            >
              <Database className="w-3.5 h-3.5" />
              <span>JSON Lemari</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid Kartu Rak (TAMPILAN KEDUA: DAFTAR RAK 1 - 4) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {allRaks.map((rakName, idx) => {
          // Hitung jumlah pelatihan di dalam rak ini
          const boksDiRakIni = dataLemariIni.filter(item => {
            const r = (item.lokasi?.rak || item.Nomor_Rak || item['Nomor_Rak'] || item['Nomor Rak'] || 'Rak 1').toString().trim();
            return r === rakName;
          });
          const jumlahPelatihan = boksDiRakIni.length;
          const totalPesertaRak = boksDiRakIni.reduce((acc, curr) => acc + (curr.jumlah_peserta || 0), 0);

          return (
            <div
              key={`rak-card-${rakName}-${idx}`}
              onClick={() => onSelectRak(rakName)}
              className="card-folder group relative bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/80 rounded-xl p-5 cursor-pointer transition-all duration-200 shadow-md hover:shadow-emerald-950/20 hover:-translate-y-1 flex flex-col justify-between"
            >
              <div>
                {/* Header Icon & Badge */}
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-950/80 border border-emerald-800/80 group-hover:border-emerald-500 flex items-center justify-center text-2xl transition shadow-inner">
                    📁
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-950 text-slate-300 border border-slate-800 group-hover:border-emerald-700/60 group-hover:text-emerald-300 transition">
                    {jumlahPelatihan} Boks
                  </span>
                </div>

                {/* Rak Title */}
                <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition tracking-wide flex items-center gap-1.5">
                  <span>{rakName}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {jumlahPelatihan} Pelatihan/Boks
                  {totalPesertaRak > 0 && ` • ${totalPesertaRak} Peserta`}
                </p>
              </div>

              {/* Action Hint */}
              <div className="pt-4 mt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-500 group-hover:text-emerald-400 transition">
                <span>Klik untuk membuka</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Tombol Navigasi Bawah */}
      <div className="pt-2">
        <button
          onClick={onBackToLemari}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 text-emerald-400" />
          <span>← Kembali ke Daftar Lemari</span>
        </button>
      </div>
    </div>
  );
};
