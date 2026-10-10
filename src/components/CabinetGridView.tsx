import React from 'react';
import { Archive, MapPin, Folder, Users, CheckCircle2, ClipboardCheck, Layers, Calendar, ArrowRight } from 'lucide-react';
import { BoksArsip } from '../types.ts';

interface CabinetGridViewProps {
  boxes: BoksArsip[];
  availableLemari: (number | string)[];
  onSelectCabinet: (lemari: number | string) => void;
  onOpenInputLokasi?: () => void;
}

export const CabinetGridView: React.FC<CabinetGridViewProps> = ({
  boxes,
  availableLemari,
  onSelectCabinet,
  onOpenInputLokasi
}) => {
  // Daftarkan seluruh lemari arsip secara dinamis (tanpa batasan jumlah lemari)
  const activeCabinetList = React.useMemo(() => {
    const lemariMap = new Map<string, BoksArsip[]>();

    // 1. Masukkan seluruh lemari dari availableLemari agar lemari baru yang ditambahkan langsung memiliki kartu di grid
    (availableLemari || []).forEach((item) => {
      const raw = String(item).replace(/lemari[-_\s]*/i, '').trim();
      if (
        raw &&
        raw !== '0' &&
        parseInt(raw, 10) !== 0 &&
        raw.toLowerCase() !== 'kosong' &&
        raw !== '-'
      ) {
        if (!lemariMap.has(raw)) {
          lemariMap.set(raw, []);
        }
      }
    });

    // 2. Masukkan seluruh boks arsip ke lemari masing-masing
    (boxes || []).forEach((b) => {
      if (!b || !b.lokasi?.lemari) return;

      const raw = String(b.lokasi.lemari).replace(/lemari[-_\s]*/i, '').trim();

      if (
        !raw ||
        raw === '0' ||
        parseInt(raw, 10) === 0 ||
        raw.toLowerCase() === 'kosong' ||
        raw.toLowerCase() === 'invalid' ||
        raw.toLowerCase() === 'undefined' ||
        raw.toLowerCase() === 'null' ||
        raw === '-'
      ) {
        return;
      }

      if (!lemariMap.has(raw)) {
        lemariMap.set(raw, []);
      }
      lemariMap.get(raw)!.push(b);
    });

    const validEntries = Array.from(lemariMap.entries());

    validEntries.sort(([keyA], [keyB]) => {
      const numA = parseInt(keyA, 10);
      const numB = parseInt(keyB, 10);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return keyA.localeCompare(keyB, undefined, { numeric: true, sensitivity: 'base' });
    });

    return validEntries;
  }, [boxes, availableLemari]);

  return (
    <div className="space-y-4 mb-8">
      {/* Section Header (Light Enterprise) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-2xs">
            <Archive className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Tampilan Lemari Arsip Fisik</span>
              <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                {activeCabinetList.length} Lemari Aktif
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Pilih lemari arsip untuk memeriksa boks arsip dan dokumen sertifikasi di dalamnya
            </p>
          </div>
        </div>

        {onOpenInputLokasi && (
          <button
            onClick={onOpenInputLokasi}
            className="self-start sm:self-auto inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 transition shadow-2xs"
            title="Input Lokasi Berkas LSP &amp; Generate QR Code"
          >
            <MapPin className="w-3.5 h-3.5 text-blue-600" />
            <span>+ Input Lokasi &amp; QR</span>
          </button>
        )}
      </div>

      {/* Grid of Dynamic Cabinet Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {activeCabinetList.length > 0 ? (
          activeCabinetList.map(([lemariKey, cabinetBoxes]) => {
            const lemariNum = parseInt(lemariKey, 10);

            const totalPeserta = cabinetBoxes.reduce((acc, curr) => acc + (curr.jumlah_peserta || 0), 0);
            const tersediaCount = cabinetBoxes.filter(
              (b) => b.status_arsip === 'Tersedia' || b.status_arsip === 'Aktif'
            ).length;
            const lengkapCount = cabinetBoxes.filter((b) => b.status_barang === 'Lengkap').length;

            const raks = Array.from(
              new Set(cabinetBoxes.map((b) => b.lokasi?.rak).filter(Boolean))
            ).sort();
            const rakText = raks.length > 0
              ? raks.map(r => r.toString().startsWith('Rak') ? r : `Rak ${r}`).join(', ')
              : 'Belum Ada Rak';

            const years = Array.from(new Set(cabinetBoxes.map((b) => b.tahun_pelaksanaan).filter(Boolean))).sort();
            const tahunText = years.length > 1
              ? `${years[0]} - ${years[years.length - 1]}`
              : years.length === 1
              ? `${years[0]}`
              : '-';

            const selectValue = !isNaN(lemariNum) ? lemariNum : lemariKey;

            return (
              <div
                key={`lemari-card-${lemariKey}`}
                className="group relative bg-white border border-slate-200 hover:border-blue-400 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between"
                onClick={() => onSelectCabinet(selectValue)}
              >
                {/* Header Kartu Lemari */}
                <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-200 shadow-2xs">
                      <Folder className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-blue-700 transition-colors leading-tight">
                        Lemari {lemariKey}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5 font-medium flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>Gedung Arsip LSP</span>
                      </p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border tabular-nums shrink-0 ${
                    cabinetBoxes.length >= 44
                      ? 'bg-amber-50 text-amber-800 border-amber-300 font-bold'
                      : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}>
                    {cabinetBoxes.length}/44 Boks {cabinetBoxes.length >= 44 ? '(Penuh)' : 'Arsip'}
                  </span>
                </div>

                {/* Daftar Informasi Boks & Berkas Lemari */}
                <div className="py-4 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between py-1 border-b border-slate-100 gap-2">
                    <span className="inline-flex items-center gap-2 text-slate-600 font-medium">
                      <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Jumlah Peserta</span>
                    </span>
                    <span className="text-slate-900 font-semibold tabular-nums">
                      {totalPeserta > 0 ? `${totalPeserta.toLocaleString('id-ID')} Peserta` : '0 Peserta'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-slate-100 gap-2">
                    <span className="inline-flex items-center gap-2 text-slate-600 font-medium">
                      <Archive className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Status Arsip</span>
                    </span>
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>{tersediaCount}/{cabinetBoxes.length} Tersedia</span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-slate-100 gap-2">
                    <span className="inline-flex items-center gap-2 text-slate-600 font-medium">
                      <ClipboardCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Kelengkapan Fisik</span>
                    </span>
                    <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {lengkapCount} Lengkap
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-slate-100 gap-2">
                    <span className="inline-flex items-center gap-2 text-slate-600 font-medium">
                      <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Daftar Rak</span>
                    </span>
                    <span className="font-semibold text-slate-800 truncate max-w-[170px]" title={rakText}>
                      {rakText}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1 gap-2">
                    <span className="inline-flex items-center gap-2 text-slate-600 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Tahun Pelaksanaan</span>
                    </span>
                    <span className="font-semibold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded text-[11px]">
                      {tahunText}
                    </span>
                  </div>
                </div>

                {/* Footer Kartu & Tombol Aksi */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-auto">
                  <span className="text-[11px] text-slate-400 font-medium">
                    Buka sekat rak lemari
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 group-hover:text-blue-700 group-hover:translate-x-0.5 transition-all">
                    <span>Buka Lemari {lemariKey}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-2 bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500 shadow-xs">
            <Archive className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-900">
              Belum Ada Lemari dengan Boks Arsip Aktif
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Silakan daftarkan boks arsip baru ke dalam lemari melalui tombol &quot;+ Tambah Boks Arsip&quot;.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
