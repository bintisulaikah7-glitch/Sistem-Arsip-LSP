import React from 'react';
import { Archive, MapPin } from 'lucide-react';
import { BoksArsip } from '../types.ts';

interface CabinetGridViewProps {
  boxes: BoksArsip[];
  availableLemari: number[];
  onSelectCabinet: (lemari: number) => void;
  onOpenInputLokasi?: () => void;
}

export const CabinetGridView: React.FC<CabinetGridViewProps> = ({
  boxes,
  availableLemari,
  onSelectCabinet,
  onOpenInputLokasi
}) => {
  // Ensure we display cabinets 1, 2, 3, 4 even if some have 0 items, plus any other from data
  const lemariList = Array.from(
    new Set([...availableLemari, 1, 2, 3, 4])
  ).sort((a, b) => a - b);

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
                {lemariList.length} Lemari Tersedia
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Pilih lemari arsip untuk menjelajahi boks berkas dan dokumen pelatihan di dalamnya
            </p>
          </div>
        </div>

        {onOpenInputLokasi && (
          <button
            onClick={onOpenInputLokasi}
            className="self-start sm:self-auto inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 transition shadow-xs"
            title="Input Lokasi Berkas LSP & Generate QR Code"
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
            <span>+ Input Lokasi & QR</span>
          </button>
        )}
      </div>

      {/* Grid of Cabinet Cards */}
      <div className="grid-container">
        {lemariList.map((lemariNum) => {
          const cabinetBoxes = boxes.filter((b) => b.lokasi.lemari === lemariNum);
          const totalBoks = cabinetBoxes.length;
          const totalPeserta = cabinetBoxes.reduce((acc, curr) => acc + (curr.jumlah_peserta || 0), 0);
          const tersediaCount = cabinetBoxes.filter(
            (b) => b.status_arsip === 'Tersedia' || b.status_arsip === 'Aktif'
          ).length;
          const barangLengkapCount = cabinetBoxes.filter((b) => b.status_barang === 'Lengkap').length;
          const raks = Array.from(new Set(cabinetBoxes.map((b) => b.lokasi.rak).filter(Boolean))).sort();

          return (
            <div
              key={`lemari-${lemariNum}`}
              id={`cabinet-card-${lemariNum}`}
              onClick={() => onSelectCabinet(lemariNum)}
              className={`card-lemari lemari-${lemariNum}`}
            >
              {/* Header Kartu */}
              <div className="card-header">
                <div className="card-title-box">
                  <div className="card-icon">🗄️</div>
                  <div>
                    <h3 className="font-bold text-base text-white m-0">Lemari {lemariNum}</h3>
                    <p className="text-xs text-slate-400 m-0">Klik untuk membuka rak</p>
                  </div>
                </div>
                <span className="badge-boks">{totalBoks} Boks</span>
              </div>

              {/* List Detail Data */}
              <div className="card-info-list">
                <div className="info-item">
                  <span>Jumlah Peserta:</span>
                  <strong>{totalPeserta} Peserta</strong>
                </div>
                <div className="info-item">
                  <span>Status Arsip:</span>
                  <strong className="text-emerald-400">{tersediaCount}/{totalBoks} Tersedia</strong>
                </div>
                <div className="info-item">
                  <span>Kelengkapan:</span>
                  <strong>{barangLengkapCount} Lengkap</strong>
                </div>
                {raks.length > 0 && (
                  <div className="info-item">
                    <span>Rak Tersedia:</span>
                    <strong className="text-slate-300 font-mono text-xs">{raks.join(', ')}</strong>
                  </div>
                )}
              </div>

              {/* Footer Kartu */}
              <div className="card-footer">
                <span>Klik untuk membuka</span>
                <span className="btn-buka">Buka Lemari {lemariNum} &rarr;</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
