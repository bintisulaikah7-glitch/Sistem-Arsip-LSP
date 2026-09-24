import React from 'react';
import { 
  Archive, 
  Folder, 
  Users, 
  CheckCircle2, 
  Layers, 
  ArrowRight, 
  Package, 
  Calendar,
  Sparkles,
  MapPin
} from 'lucide-react';
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

  // Theme accents for each cabinet index
  const cabinetThemes: Record<number, {
    border: string;
    hoverBorder: string;
    bgIcon: string;
    textIcon: string;
    badge: string;
    accent: string;
  }> = {
    1: {
      border: 'border-emerald-800/50',
      hoverBorder: 'hover:border-emerald-500',
      bgIcon: 'bg-emerald-950/80 border-emerald-800/80',
      textIcon: 'text-emerald-400',
      badge: 'bg-emerald-950 text-emerald-300 border-emerald-800',
      accent: 'from-emerald-500/10 via-transparent to-transparent'
    },
    2: {
      border: 'border-teal-800/50',
      hoverBorder: 'hover:border-teal-500',
      bgIcon: 'bg-teal-950/80 border-teal-800/80',
      textIcon: 'text-teal-400',
      badge: 'bg-teal-950 text-teal-300 border-teal-800',
      accent: 'from-teal-500/10 via-transparent to-transparent'
    },
    3: {
      border: 'border-blue-800/50',
      hoverBorder: 'hover:border-blue-500',
      bgIcon: 'bg-blue-950/80 border-blue-800/80',
      textIcon: 'text-blue-400',
      badge: 'bg-blue-950 text-blue-300 border-blue-800',
      accent: 'from-blue-500/10 via-transparent to-transparent'
    },
    4: {
      border: 'border-purple-800/50',
      hoverBorder: 'hover:border-purple-500',
      bgIcon: 'bg-purple-950/80 border-purple-800/80',
      textIcon: 'text-purple-400',
      badge: 'bg-purple-950 text-purple-300 border-purple-800',
      accent: 'from-purple-500/10 via-transparent to-transparent'
    }
  };

  const defaultTheme = {
    border: 'border-slate-800',
    hoverBorder: 'hover:border-emerald-500',
    bgIcon: 'bg-slate-800 border-slate-700',
    textIcon: 'text-emerald-400',
    badge: 'bg-slate-800 text-slate-300 border-slate-700',
    accent: 'from-slate-800/20 via-transparent to-transparent'
  };

  return (
    <div className="space-y-4 mb-8">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-800/80">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400">
            <Archive className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wide flex items-center gap-2">
              <span>TAMPILAN LEMARI ARSIP FISIK</span>
              <span className="text-xs font-normal text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/60">
                {lemariList.length} Lemari Tersedia
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Pilih lemari arsip untuk menjelajahi boks berkas dan dokumen pelatihan di dalamnya
            </p>
          </div>
        </div>

        {onOpenInputLokasi && (
          <button
            onClick={onOpenInputLokasi}
            className="self-start sm:self-auto inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60 transition shadow-sm"
            title="Input Lokasi Berkas LSP & Generate QR Code"
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span>+ Input Lokasi & QR</span>
          </button>
        )}
      </div>

      {/* Grid of Cabinet Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {lemariList.map((lemariNum) => {
          const cabinetBoxes = boxes.filter((b) => b.lokasi.lemari === lemariNum);
          const totalBoks = cabinetBoxes.length;
          const totalPeserta = cabinetBoxes.reduce((acc, curr) => acc + (curr.jumlah_peserta || 0), 0);
          const totalBK = cabinetBoxes.reduce((acc, curr) => acc + (curr.jumlah_peserta_bk || 0), 0);
          const totalK = Math.max(0, totalPeserta - totalBK);
          const tersediaCount = cabinetBoxes.filter(
            (b) => b.status_arsip === 'Tersedia' || b.status_arsip === 'Aktif'
          ).length;
          const barangLengkapCount = cabinetBoxes.filter((b) => b.status_barang === 'Lengkap').length;
          
          const raks = Array.from(new Set(cabinetBoxes.map((b) => b.lokasi.rak).filter(Boolean))).sort();
          const years = Array.from(new Set(cabinetBoxes.map((b) => b.tahun_pelaksanaan).filter(Boolean))).sort();

          const theme = cabinetThemes[lemariNum] || defaultTheme;

          return (
            <div
              key={`lemari-${lemariNum}`}
              id={`cabinet-card-${lemariNum}`}
              onClick={() => onSelectCabinet(lemariNum)}
              className={`group relative bg-slate-900/90 border ${theme.border} ${theme.hoverBorder} rounded-2xl p-5 shadow-lg hover:shadow-xl hover:shadow-emerald-950/30 transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden`}
            >
              {/* Subtle top gradient glow */}
              <div className={`absolute inset-0 bg-gradient-to-b ${theme.accent} pointer-events-none opacity-40 group-hover:opacity-100 transition-opacity`} />

              <div>
                {/* Header Lemari */}
                <div className="flex items-start justify-between mb-3 relative z-10">
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 rounded-xl ${theme.bgIcon} border flex items-center justify-center ${theme.textIcon} shadow-sm group-hover:scale-105 transition-transform`}>
                      <Folder className="w-6 h-6 fill-current opacity-80" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base text-white group-hover:text-emerald-300 transition-colors">
                        Lemari {lemariNum}
                      </h3>
                      <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        Gudang Arsip LSP
                      </span>
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold font-mono border ${theme.badge}`}>
                    {totalBoks} Boks
                  </span>
                </div>

                {/* Statistics Details inside Cabinet */}
                <div className="space-y-2.5 py-3 border-y border-slate-800/80 text-xs relative z-10">
                  {/* Total Peserta */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-500" />
                      Jumlah Peserta:
                    </span>
                    <span className="font-semibold text-slate-200">
                      {totalPeserta} <span className="text-[11px] text-slate-400 font-normal">({totalK} K / {totalBK} BK)</span>
                    </span>
                  </div>

                  {/* Status Arsip */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      Status Arsip:
                    </span>
                    <span className="font-medium text-emerald-400">
                      {tersediaCount}/{totalBoks} Tersedia
                    </span>
                  </div>

                  {/* Kelengkapan Barang */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-blue-400" />
                      Kelengkapan:
                    </span>
                    <span className="font-medium text-slate-300">
                      {barangLengkapCount} Lengkap
                    </span>
                  </div>

                  {/* Rak / Posisi Fisik */}
                  {raks.length > 0 && (
                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <span className="text-slate-500">Rak Tersedia:</span>
                      <span className="text-slate-300 font-mono truncate max-w-[140px]" title={raks.join(', ')}>
                        {raks.join(', ')}
                      </span>
                    </div>
                  )}

                  {/* Tahun Pelaksanaan */}
                  {years.length > 0 && (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Tahun:
                      </span>
                      <span className="text-slate-400 font-mono">
                        {years.length === 1 ? years[0] : `${years[0]} - ${years[years.length - 1]}`}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-3.5 relative z-10 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-500 group-hover:text-slate-400 transition">
                  Klik untuk membuka
                </span>
                <div className="inline-flex items-center space-x-1 font-semibold text-emerald-400 group-hover:text-emerald-300 transition-transform group-hover:translate-x-1">
                  <span>Buka Lemari {lemariNum}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
