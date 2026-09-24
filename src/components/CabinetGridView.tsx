import React from 'react';
import { Archive, MapPin } from 'lucide-react';
import { BoksArsip } from '../types.ts';

interface CabinetGridViewProps {
  boxes: BoksArsip[];
  availableLemari: number[];
  onSelectCabinet: (lemari: number) => void;
  onOpenInputLokasi?: () => void;
}

interface LemariCardData {
  num: number;
  nama: string;
  badgeColor: string;
  btnBukaColor?: string;
  defaultBoks: string;
  defaultPeserta: string;
  defaultArsip: string;
  defaultLengkap: string;
  defaultRak: string;
  defaultTahun: string;
}

const LEMARI_CARDS: LemariCardData[] = [
  {
    num: 1,
    nama: 'Lemari 1',
    badgeColor: '#10b981',
    btnBukaColor: '#10b981',
    defaultBoks: '26 Boks',
    defaultPeserta: '965 (947 K / 18 BK)',
    defaultArsip: '16/20 Tersedia',
    defaultLengkap: '17 Lengkap',
    defaultRak: 'Rak A, Rak B, Rak C, Rak D',
    defaultTahun: '2023 - 2024'
  },
  {
    num: 2,
    nama: 'Lemari 2',
    badgeColor: '#10b981',
    btnBukaColor: '#10b981',
    defaultBoks: '20 Boks',
    defaultPeserta: '957 (907 K / 50 BK)',
    defaultArsip: '20/20 Tersedia',
    defaultLengkap: '15 Lengkap',
    defaultRak: 'Rak A, Rak B, Rak C, Rak D',
    defaultTahun: '2023 - 2024'
  },
  {
    num: 3,
    nama: 'Lemari 3',
    badgeColor: '#3b82f6',
    btnBukaColor: '#3b82f6',
    defaultBoks: '21 Boks',
    defaultPeserta: '1048 (1013 K / 35 BK)',
    defaultArsip: '19/21 Tersedia',
    defaultLengkap: '16 Lengkap',
    defaultRak: 'Rak A, Rak B, Rak C, Rak D',
    defaultTahun: '2024'
  },
  {
    num: 4,
    nama: 'Lemari 4',
    badgeColor: '#a855f7',
    btnBukaColor: '#a855f7',
    defaultBoks: '20 Boks',
    defaultPeserta: '742 (697 K / 45 BK)',
    defaultArsip: '17/18 Tersedia',
    defaultLengkap: '10 Lengkap',
    defaultRak: 'Rak A, Rak B, Rak C, Rak D',
    defaultTahun: '2024'
  }
];

export const CabinetGridView: React.FC<CabinetGridViewProps> = ({
  boxes,
  availableLemari,
  onSelectCabinet,
  onOpenInputLokasi
}) => {
  // Check for any extra cabinets from dynamic data beyond 1-4
  const extraLemari = availableLemari.filter(n => n > 4);

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
                {LEMARI_CARDS.length + extraLemari.length} Lemari Tersedia
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
        {LEMARI_CARDS.map((item) => {
          const cabinetBoxes = boxes.filter(
            (b) => b.lokasi.lemari === item.num || (b as any).Kode_Lemari === `Lemari ${item.num}`
          );

          // If real boxes are in state, calculate live metrics, otherwise fall back to exact template data
          const boksText = cabinetBoxes.length > 0 ? `${cabinetBoxes.length} Boks` : item.defaultBoks;

          let pesertaText = item.defaultPeserta;
          if (cabinetBoxes.length > 0) {
            const totalPeserta = cabinetBoxes.reduce((acc, curr) => acc + (curr.jumlah_peserta || 0), 0);
            pesertaText = `${totalPeserta} Peserta`;
          }

          let arsipText = item.defaultArsip;
          if (cabinetBoxes.length > 0) {
            const tersediaCount = cabinetBoxes.filter(
              (b) => b.status_arsip === 'Tersedia' || b.status_arsip === 'Aktif'
            ).length;
            arsipText = `${tersediaCount}/${cabinetBoxes.length} Tersedia`;
          }

          let lengkapText = item.defaultLengkap;
          if (cabinetBoxes.length > 0) {
            const lengkapCount = cabinetBoxes.filter((b) => b.status_barang === 'Lengkap').length;
            lengkapText = `${lengkapCount} Lengkap`;
          }

          let rakText = item.defaultRak;
          if (cabinetBoxes.length > 0) {
            const raks = Array.from(
              new Set(
                cabinetBoxes.map(
                  (b) => b.lokasi.rak || (b as any).Nomor_Rak || (b as any).Rak || ''
                ).filter(Boolean)
              )
            ).sort();
            if (raks.length > 0) {
              rakText = raks.map(r => r.toString().startsWith('Rak') ? r : `Rak ${r}`).join(', ');
            }
          }

          let tahunText = item.defaultTahun;
          if (cabinetBoxes.length > 0) {
            const years = Array.from(new Set(cabinetBoxes.map((b) => b.tahun_kegiatan).filter(Boolean))).sort();
            if (years.length === 1) {
              tahunText = `${years[0]}`;
            } else if (years.length > 1) {
              tahunText = `${years[0]} - ${years[years.length - 1]}`;
            }
          }

          return (
            <div
              key={`lemari-card-${item.num}`}
              className={`card-lemari lemari-${item.num}`}
              onClick={() => onSelectCabinet(item.num)}
            >
              <div className="card-header">
                <div className="card-title-box">
                  <div className="card-icon">📁</div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '17px' }}>{item.nama}</h4>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>Gedung Arsip LSP</span>
                  </div>
                </div>
                <span className="badge-boks" style={{ color: item.badgeColor }}>
                  {boksText}
                </span>
              </div>

              <div className="card-info-list">
                <div className="info-item">
                  <span>👥 Jumlah Peserta</span>
                  <strong>{pesertaText}</strong>
                </div>
                <div className="info-item">
                  <span>📂 Status Arsip</span>
                  <strong style={{ color: '#10b981' }}>{arsipText}</strong>
                </div>
                <div className="info-item">
                  <span>📋 Kelengkapan</span>
                  <strong>{lengkapText}</strong>
                </div>
                <div className="info-item">
                  <span>🗄️ Rak Tersedia</span>
                  <strong>{rakText}</strong>
                </div>
                <div className="info-item">
                  <span>📅 Tahun</span>
                  <strong>{tahunText}</strong>
                </div>
              </div>

              <div className="card-footer">
                <span style={{ color: '#64748b' }}>Klik untuk membuka</span>
                <span className="btn-buka" style={item.btnBukaColor ? { color: item.btnBukaColor } : undefined}>
                  Buka {item.nama} &rarr;
                </span>
              </div>
            </div>
          );
        })}

        {/* Extra Lemari if any exists beyond 4 */}
        {extraLemari.map((extraNum) => {
          const cabinetBoxes = boxes.filter((b) => b.lokasi.lemari === extraNum);
          const totalBoks = cabinetBoxes.length;
          const totalPeserta = cabinetBoxes.reduce((acc, curr) => acc + (curr.jumlah_peserta || 0), 0);
          const tersediaCount = cabinetBoxes.filter(
            (b) => b.status_arsip === 'Tersedia' || b.status_arsip === 'Aktif'
          ).length;
          const lengkapCount = cabinetBoxes.filter((b) => b.status_barang === 'Lengkap').length;
          const raks = Array.from(new Set(cabinetBoxes.map((b) => b.lokasi.rak).filter(Boolean))).sort();
          const rakText = raks.length > 0 ? raks.map(r => r.toString().startsWith('Rak') ? r : `Rak ${r}`).join(', ') : 'Belum diatur';

          return (
            <div
              key={`lemari-card-${extraNum}`}
              className="card-lemari lemari-4"
              onClick={() => onSelectCabinet(extraNum)}
            >
              <div className="card-header">
                <div className="card-title-box">
                  <div className="card-icon">📁</div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '17px' }}>Lemari {extraNum}</h4>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>Gedung Arsip LSP</span>
                  </div>
                </div>
                <span className="badge-boks" style={{ color: '#a855f7' }}>
                  {totalBoks} Boks
                </span>
              </div>

              <div className="card-info-list">
                <div className="info-item">
                  <span>👥 Jumlah Peserta</span>
                  <strong>{totalPeserta} Peserta</strong>
                </div>
                <div className="info-item">
                  <span>📂 Status Arsip</span>
                  <strong style={{ color: '#10b981' }}>{tersediaCount}/{totalBoks} Tersedia</strong>
                </div>
                <div className="info-item">
                  <span>📋 Kelengkapan</span>
                  <strong>{lengkapCount} Lengkap</strong>
                </div>
                <div className="info-item">
                  <span>🗄️ Rak Tersedia</span>
                  <strong>{rakText}</strong>
                </div>
                <div className="info-item">
                  <span>📅 Tahun</span>
                  <strong>2024</strong>
                </div>
              </div>

              <div className="card-footer">
                <span style={{ color: '#64748b' }}>Klik untuk membuka</span>
                <span className="btn-buka" style={{ color: '#a855f7' }}>
                  Buka Lemari {extraNum} &rarr;
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
