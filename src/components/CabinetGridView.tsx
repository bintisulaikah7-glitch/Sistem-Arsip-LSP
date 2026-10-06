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
  // Saring lemari yang memiliki data Boks Arsip minimal 1 boks
  const activeCabinetList = React.useMemo(() => {
    const lemariMap = new Map<string, BoksArsip[]>();

    (boxes || []).forEach((b) => {
      if (!b || !b.lokasi?.lemari) return;

      const raw = b.lokasi.lemari.toString().replace(/lemari[-_\s]*/i, '').trim();

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

    const validEntries = Array.from(lemariMap.entries()).filter(
      ([_, boxList]) => boxList && boxList.length > 0
    );

    validEntries.sort(([keyA], [keyB]) => {
      const numA = parseInt(keyA, 10);
      const numB = parseInt(keyB, 10);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return keyA.localeCompare(keyB, undefined, { numeric: true, sensitivity: 'base' });
    });

    return validEntries;
  }, [boxes]);

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
      <div className="grid-container">
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
              : 'Rak 1, Rak 2';

            const years = Array.from(new Set(cabinetBoxes.map((b) => b.tahun_pelaksanaan).filter(Boolean))).sort();
            const tahunText = years.length > 1
              ? `${years[0]} - ${years[years.length - 1]}`
              : years.length === 1
              ? `${years[0]}`
              : '2023 - 2024';

            const selectValue = !isNaN(lemariNum) ? lemariNum : lemariKey;

            return (
              <div
                key={`lemari-card-${lemariKey}`}
                className="card-lemari"
                onClick={() => onSelectCabinet(selectValue)}
              >
                <div className="card-header">
                  <div className="card-title-box">
                    <div className="card-icon">
                      <Folder className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="m-0 font-bold text-slate-900 text-[17px]">Lemari {lemariKey}</h4>
                      <span className="text-xs text-slate-500">Gedung Arsip LSP</span>
                    </div>
                  </div>
                  <span className="badge-boks">
                    {cabinetBoxes.length} Boks Arsip
                  </span>
                </div>

                <div className="card-info-list">
                  <div className="info-item">
                    <span className="inline-flex items-center gap-1.5 text-slate-600">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>Jumlah Peserta</span>
                    </span>
                    <strong className="text-slate-900 font-semibold">{totalPeserta > 0 ? `${totalPeserta.toLocaleString('id-ID')} Peserta` : '0 Peserta'}</strong>
                  </div>
                  <div className="info-item">
                    <span className="inline-flex items-center gap-1.5 text-slate-600">
                      <Archive className="w-3.5 h-3.5 text-slate-400" />
                      <span>Status Arsip</span>
                    </span>
                    <strong className="text-emerald-700 font-semibold">{tersediaCount}/{cabinetBoxes.length} Tersedia</strong>
                  </div>
                  <div className="info-item">
                    <span className="inline-flex items-center gap-1.5 text-slate-600">
                      <ClipboardCheck className="w-3.5 h-3.5 text-slate-400" />
                      <span>Kelengkapan</span>
                    </span>
                    <strong className="text-blue-700 font-semibold">{lengkapCount} Lengkap</strong>
                  </div>
                  <div className="info-item">
                    <span className="inline-flex items-center gap-1.5 text-slate-600">
                      <Layers className="w-3.5 h-3.5 text-slate-400" />
                      <span>Rak Tersedia</span>
                    </span>
                    <strong className="truncate max-w-[170px] text-slate-900" title={rakText}>{rakText}</strong>
                  </div>
                  <div className="info-item">
                    <span className="inline-flex items-center gap-1.5 text-slate-600">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Tahun</span>
                    </span>
                    <strong className="text-slate-900">{tahunText}</strong>
                  </div>
                </div>

                <div className="card-footer">
                  <span className="text-xs text-slate-500">Klik untuk membuka rak</span>
                  <span className="btn-buka inline-flex items-center gap-1">
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
