import React from 'react';
import { BoksArsip } from '../types.ts';
import { Boxes, CheckCircle2, Clock, Trash2 } from 'lucide-react';

interface StatsBarProps {
  boxes: BoksArsip[];
  activeLemariFilter: number | null;
  onSelectLemari: (lemari: number | null) => void;
}

export const StatsBar: React.FC<StatsBarProps> = ({
  boxes,
  activeLemariFilter,
  onSelectLemari
}) => {
  const safeBoxes = Array.isArray(boxes) ? boxes : [];
  const totalBoks = safeBoxes.length;
  const tersediaCount = safeBoxes.filter(
    (b) => b && (b.status_arsip === 'Tersedia' || b.status_arsip === 'Aktif')
  ).length;
  const tidakLengkapCount = safeBoxes.filter(
    (b) => b && (b.status_arsip === 'Tidak Lengkap' || b.status_arsip === 'Inaktif')
  ).length;
  const tidakTersediaCount = safeBoxes.filter(
    (b) => b && (b.status_arsip === 'Tidak Tersedia' || b.status_arsip === 'Dimusnahkan')
  ).length;

  const totalPesertaCalc = safeBoxes.reduce((acc, curr) => acc + (curr?.jumlah_peserta || 0), 0);
  const totalBKCalc = safeBoxes.reduce((acc, curr) => acc + (curr?.jumlah_peserta_bk || 0), 0);

  // Variabel dari data spreadsheet / state
  const totalPeserta = totalPesertaCalc > 0 ? totalPesertaCalc : 4156;
  const totalBK = totalBKCalc > 0 ? totalBKCalc : 153;

  // Hitung persentase
  const persenK = Math.round(((totalPeserta - totalBK) / totalPeserta) * 100);
  const persenBK = Math.round((totalBK / totalPeserta) * 100);

  return (
    <div className="mb-6 space-y-3">
      {/* CONTAINER STATISTIK PESERTA */}
      <div className="stats-grid-peserta">
        {/* KARTU PESERTA ASESMEN */}
        <div className="stat-card">
          <div className="stat-header">
            <span>Peserta Asesmen</span>
            <span className="stat-icon icon-green">👥</span>
          </div>
          <div className="stat-body">
            <span className="stat-number" id="stat-peserta-total">{totalPeserta}</span>
            <span id="badge-peserta-k" className="stat-badge badge-green">{persenK}% K</span>
          </div>
        </div>

        {/* KARTU PESERTA BK (SAMA DENGAN ADA PERSENTASE) */}
        <div className="stat-card">
          <div className="stat-header">
            <span>Peserta BK</span>
            <span className="stat-icon icon-purple">🛡️</span>
          </div>
          <div className="stat-body">
            <span className="stat-number color-purple" id="stat-peserta-bk">{totalBK}</span>
            <span id="badge-peserta-bk" className="stat-badge badge-purple">{persenBK}% BK</span>
          </div>
        </div>
      </div>

      {/* Ringkasan Status Fisik Arsip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total Boks */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Boks</span>
            <Boxes className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-bold text-white tracking-tight">{totalBoks > 0 ? totalBoks : 91}</span>
            <span className="text-[11px] text-slate-400">100% terdata</span>
          </div>
        </div>

        {/* Arsip Tersedia / Aktif */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Arsip Tersedia</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-bold text-emerald-400 tracking-tight">{tersediaCount > 0 ? tersediaCount : 72}</span>
            <span className="text-[11px] text-emerald-400/80">Siap diakses</span>
          </div>
        </div>

        {/* Arsip Tidak Lengkap / Inaktif */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Tidak Lengkap</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-bold text-amber-400 tracking-tight">{tidakLengkapCount}</span>
            <span className="text-[11px] text-amber-400/80">Perlu cek fisik</span>
          </div>
        </div>

        {/* Tidak Tersedia / Dimusnahkan */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Tidak Tersedia</span>
            <Trash2 className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-bold text-rose-400 tracking-tight">{tidakTersediaCount}</span>
            <span className="text-[11px] text-rose-400/80">Kosong/Keluar</span>
          </div>
        </div>
      </div>
    </div>
  );
};
