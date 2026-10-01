import React from 'react';
import { Archive, MapPin } from 'lucide-react';
import { BoksArsip } from '../types.ts';

interface CabinetGridViewProps {
  boxes: BoksArsip[];
  availableLemari: (number | string)[];
  onSelectCabinet: (lemari: number | string) => void;
  onOpenInputLokasi?: () => void;
}

const COLOR_PALETTES = [
  { badge: '#10b981', btn: '#10b981', cls: 'lemari-1' },
  { badge: '#10b981', btn: '#10b981', cls: 'lemari-2' },
  { badge: '#3b82f6', btn: '#3b82f6', cls: 'lemari-3' },
  { badge: '#a855f7', btn: '#a855f7', cls: 'lemari-4' },
  { badge: '#f59e0b', btn: '#f59e0b', cls: 'lemari-1' },
  { badge: '#06b6d4', btn: '#06b6d4', cls: 'lemari-3' },
  { badge: '#ec4899', btn: '#ec4899', cls: 'lemari-4' },
];

export const CabinetGridView: React.FC<CabinetGridViewProps> = ({
  boxes,
  availableLemari,
  onSelectCabinet,
  onOpenInputLokasi
}) => {
  // 1. Sembunyikan Lemari yang jumlah Boks Arsipnya bernilai 0 atau invalid (seperti Lemari 0).
  // 2. Tampilkan HANYA Lemari yang memiliki data Boks Arsip terdaftar di dalamnya (minimal 1 boks arsip).
  // 3. Batasi tampilan maksimum hanya untuk 4 Lemari teratas yang aktif dan berisi data.
  const activeCabinetList = React.useMemo(() => {
    const lemariMap = new Map<string, BoksArsip[]>();

    (boxes || []).forEach((b) => {
      if (!b || !b.lokasi?.lemari) return;

      const raw = b.lokasi.lemari.toString().replace(/lemari[-_\s]*/i, '').trim();

      // Saring keluar jika kosong, bernilai 0, invalid, atau undefined
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

    // Ambil HANYA Lemari yang memiliki minimal 1 data boks arsip (jumlah > 0)
    const validEntries = Array.from(lemariMap.entries()).filter(
      ([_, boxList]) => boxList && boxList.length > 0
    );

    // Urutkan lemari teratas (angka 1, 2, 3... lalu huruf A, B, C...)
    validEntries.sort(([keyA], [keyB]) => {
      const numA = parseInt(keyA, 10);
      const numB = parseInt(keyB, 10);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return keyA.localeCompare(keyB, undefined, { numeric: true, sensitivity: 'base' });
    });

    // Batasi maksimum hanya 4 Lemari teratas yang aktif dan berisi data
    return validEntries.slice(0, 4);
  }, [boxes]);

  return (
    <div className="space-y-4 mb-8">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-xs">
            <Archive className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-wide flex items-center gap-2">
              <span>TAMPILAN LEMARI ARSIP FISIK</span>
              <span className="text-xs font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                {activeCabinetList.length} Lemari Aktif
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Pilih lemari arsip untuk menjelajahi boks arsip dan dokumen pelatihan di dalamnya
            </p>
          </div>
        </div>

        {onOpenInputLokasi && (
          <button
            onClick={onOpenInputLokasi}
            className="self-start sm:self-auto inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 transition shadow-xs"
            title="Input Lokasi Berkas LSP &amp; Generate QR Code"
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
            <span>+ Input Lokasi &amp; QR</span>
          </button>
        )}
      </div>

      {/* Grid of Dynamic Cabinet Cards (Hanya menampilkan Lemari dengan minimal 1 Boks Arsip) */}
      <div className="grid-container">
        {activeCabinetList.length > 0 ? (
          activeCabinetList.map(([lemariKey, cabinetBoxes], index) => {
            const lemariNum = parseInt(lemariKey, 10);
            const palette = COLOR_PALETTES[index % COLOR_PALETTES.length];

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
                className={`card-lemari ${palette.cls}`}
                onClick={() => onSelectCabinet(selectValue)}
              >
                <div className="card-header">
                  <div className="card-title-box">
                    <div className="card-icon">📁</div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '17px' }}>Lemari {lemariKey}</h4>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>Gedung Arsip LSP</span>
                    </div>
                  </div>
                  <span className="badge-boks" style={{ color: palette.badge }}>
                    {cabinetBoxes.length} Boks Arsip
                  </span>
                </div>

                <div className="card-info-list">
                  <div className="info-item">
                    <span>👥 Jumlah Peserta</span>
                    <strong>{totalPeserta > 0 ? `${totalPeserta} Peserta` : '0 Peserta'}</strong>
                  </div>
                  <div className="info-item">
                    <span>📂 Status Arsip</span>
                    <strong style={{ color: '#10b981' }}>{tersediaCount}/{cabinetBoxes.length} Tersedia</strong>
                  </div>
                  <div className="info-item">
                    <span>📋 Kelengkapan</span>
                    <strong>{lengkapCount} Lengkap</strong>
                  </div>
                  <div className="info-item">
                    <span>🗄️ Rak Tersedia</span>
                    <strong className="truncate max-w-[170px]" title={rakText}>{rakText}</strong>
                  </div>
                  <div className="info-item">
                    <span>📅 Tahun</span>
                    <strong>{tahunText}</strong>
                  </div>
                </div>

                <div className="card-footer">
                  <span style={{ color: '#64748b' }}>Klik untuk membuka</span>
                  <span className="btn-buka" style={{ color: palette.btn }}>
                    Buka Lemari {lemariKey} &rarr;
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-2 bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500 shadow-xs">
            <Archive className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800">
              Belum Ada Lemari dengan Boks Arsip Aktif
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Silakan tambahkan data boks arsip baru ke dalam lemari melalui tombol &quot;+ Tambah Boks Arsip&quot;.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
