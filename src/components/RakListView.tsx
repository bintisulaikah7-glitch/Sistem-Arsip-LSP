import React from 'react';
import { ArrowLeft, Layers, QrCode, Database, ArrowRight } from 'lucide-react';
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

  // 1. Ambil data HANYA dari Lemari yang diklik
  const matchesLemari = (item: any) => {
    if (!item) return false;
    const l1 = item.lokasi?.lemari;
    const l2 = item.Kode_Lemari || item['Kode Lemari'] || item['Lemari'];
    
    // Check direct equality
    if (l1 !== undefined && l1 !== null && l1.toString() === lemariNama.toString()) return true;
    if (l2 && l2.toString() === lemariNama.toString()) return true;

    // Check stripped normalized number/id
    const targetStr = lemariNama.toString().replace(/lemari[-_\s]*/i, '').trim();
    if (l1 !== undefined && l1 !== null && l1.toString().replace(/lemari[-_\s]*/i, '').trim() === targetStr) return true;
    if (l2 && l2.toString().replace(/lemari[-_\s]*/i, '').trim() === targetStr) return true;

    return false;
  };

  const dataLemariIni = boxes.filter(matchesLemari);

  // 2. Ambil daftar Rak UNIK yang benar-benar ADA di Spreadsheet (tanpa membuat angka 1-4 manual)
  // Catatan: Sesuaikan 'Nomor_Rak' jika nama header di sheet kamu sedikit berbeda
  const daftarRakUnik = Array.from(new Set(
    dataLemariIni
      .map(item => {
        const anyItem = item as any;
        return (item.lokasi?.rak || anyItem.Nomor_Rak || anyItem['Nomor_Rak'] || anyItem['Nomor Rak'] || anyItem.Rak || '').toString().trim();
      })
      .filter(rak => rak !== '') // Abaikan data rak yang kosong
  )).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

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

      {/* 3. Jika tidak ada rak terdeteksi dari data */}
      {daftarRakUnik.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-8 text-center">
          <p style={{ color: '#94a3b8' }} className="text-sm font-medium">
            Belum ada data rak di {lemariDisplay}
          </p>
        </div>
      ) : (
        /* 4. Looping HANYA rak yang benar-benar ada di spreadsheet */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {daftarRakUnik.map((rak, idx) => {
            // Hitung jumlah boks aktual di rak tersebut
            const boksDiRakIni = dataLemariIni.filter(item => {
              const anyItem = item as any;
              const r = (item.lokasi?.rak || anyItem.Nomor_Rak || anyItem['Nomor_Rak'] || anyItem['Nomor Rak'] || anyItem.Rak || '').toString().trim();
              return r === rak;
            });
            const jumlahBoks = boksDiRakIni.length;
            const totalPesertaRak = boksDiRakIni.reduce((acc, curr) => acc + (curr.jumlah_peserta || 0), 0);
            const rakTitle = rak.includes('Rak') ? rak : 'Rak ' + rak;

            return (
              <div
                key={`rak-card-${rak}-${idx}`}
                onClick={() => onSelectRak(rak)}
                className="card-folder group relative bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/80 rounded-xl p-5 cursor-pointer transition-all duration-200 shadow-md hover:shadow-emerald-950/20 hover:-translate-y-1 flex flex-col justify-between"
              >
                <div>
                  {/* Header Icon & Badge */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="icon w-12 h-12 rounded-xl bg-emerald-950/80 border border-emerald-800/80 group-hover:border-emerald-500 flex items-center justify-center text-2xl transition shadow-inner">
                      📁
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-950 text-slate-300 border border-slate-800 group-hover:border-emerald-700/60 group-hover:text-emerald-300 transition">
                      {jumlahBoks} Boks
                    </span>
                  </div>

                  {/* Rak Title */}
                  <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition tracking-wide flex items-center gap-1.5">
                    <span>{rakTitle}</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {jumlahBoks} Pelatihan/Boks
                    {totalPesertaRak > 0 && ` • ${totalPesertaRak} Peserta`}
                  </p>
                </div>

                {/* Action Hint */}
                <div className="pt-4 mt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-500 group-hover:text-emerald-400 transition">
                  <span>Klik untuk membuka &rarr;</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            );
          })}
        </div>
      )}

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
