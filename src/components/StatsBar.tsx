import React from 'react';
import { BoksArsip } from '../types.ts';
import { Boxes, CheckCircle2, Clock, Trash2, Users, ShieldAlert } from 'lucide-react';

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

  const totalPeserta = safeBoxes.reduce((acc, curr) => acc + (curr?.jumlah_peserta || 0), 0);
  const totalBK = safeBoxes.reduce((acc, curr) => acc + (curr?.jumlah_peserta_bk || 0), 0);
  const totalK = totalPeserta - totalBK;
  const kompetenRate = totalPeserta > 0 ? Math.round((totalK / totalPeserta) * 100) : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
      {/* Total Boks */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Total Boks</span>
          <Boxes className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-2xl font-bold text-white tracking-tight">{totalBoks}</span>
          <span className="text-[11px] text-slate-400">100% terdata</span>
        </div>
      </div>

      {/* Arsip Tersedia / Aktif */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Arsip Tersedia</span>
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-2xl font-bold text-emerald-400 tracking-tight">{tersediaCount}</span>
          <span className="text-[11px] text-slate-400">Siap diakses</span>
        </div>
      </div>

      {/* Arsip Tidak Lengkap / Inaktif */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Tidak Lengkap</span>
          <Clock className="w-4 h-4 text-amber-400" />
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-2xl font-bold text-amber-400 tracking-tight">{tidakLengkapCount}</span>
          <span className="text-[11px] text-slate-400">Perlu cek fisik</span>
        </div>
      </div>

      {/* Tidak Tersedia / Dimusnahkan */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Tidak Tersedia</span>
          <Trash2 className="w-4 h-4 text-rose-400" />
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-2xl font-bold text-rose-400 tracking-tight">{tidakTersediaCount}</span>
          <span className="text-[11px] text-slate-400">Kosong/Keluar</span>
        </div>
      </div>

      {/* Total Peserta & K */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Peserta Asesmen</span>
          <Users className="w-4 h-4 text-cyan-400" />
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-2xl font-bold text-white tracking-tight">{totalPeserta}</span>
          <span className="text-[11px] text-emerald-400 font-medium">{kompetenRate}% K</span>
        </div>
      </div>

      {/* Peserta BK */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Peserta BK</span>
          <ShieldAlert className="w-4 h-4 text-purple-400" />
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-2xl font-bold text-purple-400 tracking-tight">{totalBK}</span>
          <span className="text-[11px] text-slate-400">Belum Kompeten</span>
        </div>
      </div>
    </div>
  );
};
