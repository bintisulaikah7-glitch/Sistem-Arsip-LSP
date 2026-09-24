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
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBackToLemari}
            className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-800 text-slate-700 text-xs font-semibold border border-slate-300 transition shadow-xs"
            title="Kembali ke Daftar Lemari"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-600" />
            <span>&larr; Kembali ke Daftar Lemari</span>
          </button>
          <div className="h-6 w-px bg-slate-200 hidden sm:block" />
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-lg">🗄️</span>
              <h2 className="text-base font-bold text-slate-900 tracking-wide">
                {lemariDisplay}
              </h2>
              <span className="text-xs font-semibold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                {dataLemariIni.length} Boks Arsip
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Silakan pilih rak untuk membuka daftar pelatihan dan boks berkas di dalamnya
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          {onViewAllSekat && (
            <button
              onClick={onViewAllSekat}
              className="inline-flex items-center space-x-1.5 text-xs text-emerald-800 hover:text-emerald-900 px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-300 transition"
              title="Tampilkan semua sekat rak sekaligus"
            >
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
              <span>Lihat Semua Sekat</span>
            </button>
          )}

          {onOpenInputLokasi && (
            <button
              onClick={() => onOpenInputLokasi(`Lemari-${lemariNama}`)}
              className="inline-flex items-center space-x-1.5 text-xs text-teal-800 hover:text-teal-900 px-2.5 py-1.5 rounded-lg bg-teal-50 border border-teal-300 transition"
              title={`Generate QR Lokasi untuk ${lemariDisplay}`}
            >
              <QrCode className="w-3.5 h-3.5 text-teal-600" />
              <span>QR {lemariDisplay}</span>
            </button>
          )}

          {onViewJsonLemari && (
            <button
              onClick={onViewJsonLemari}
              className="inline-flex items-center space-x-1.5 text-xs text-indigo-800 hover:text-indigo-900 px-2.5 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 font-mono transition"
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
        /* 4. Looping HANYA rak yang benar-benar ada di spreadsheet */
        <div className="grid-container">
          {daftarRakUnik.map((rak, idx) => {
            // Hitung jumlah boks aktual di rak tersebut
            const boksDiRakIni = dataLemariIni.filter(item => {
              const anyItem = item as any;
              const r = (item.lokasi?.rak || anyItem.Nomor_Rak || anyItem['Nomor_Rak'] || anyItem['Nomor Rak'] || anyItem.Rak || '').toString().trim();
              return r === rak;
            });
            const jumlahBoks = boksDiRakIni.length;
            const rakTitle = rak.includes('Rak') ? rak : 'Rak ' + rak;

            return (
              <div
                key={`rak-card-${rak}-${idx}`}
                onClick={() => onSelectRak(rak)}
                className="card-folder"
              >
                <div className="icon">📁</div>
                <h3>{rakTitle}</h3>
                <p>{jumlahBoks} Pelatihan/Boks</p>
                <span>Klik untuk membuka &rarr;</span>
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
          <ArrowLeft className="w-4 h-4 text-emerald-600" />
          <span>← Kembali ke Daftar Lemari</span>
        </button>
      </div>
    </div>
  );
};
