import React from 'react';
import { BoksArsip } from '../types.ts';
import { Boxes, CheckCircle2, Clock, Trash2, Users, ShieldCheck, Sparkles } from 'lucide-react';
import { calculateDeduplicatedStats } from '../utils/csvParser.ts';

interface StatsBarProps {
  boxes: BoksArsip[];
  activeLemariFilter: number | string | null;
  onSelectLemari: (lemari: number | string | null) => void;
}

export const StatsBar: React.FC<StatsBarProps> = ({
  boxes,
  activeLemariFilter,
  onSelectLemari
}) => {
  const safeBoxes = Array.isArray(boxes) ? boxes : [];
  const totalBoks = safeBoxes.length;

  // Hitung status dengan memotong spasi (trim) dan mengabaikan huruf kapital (toLowerCase)
  let tersediaCount = 0;
  let tidakLengkapCount = 0;
  let tidakTersediaCount = 0;

  safeBoxes.forEach((b) => {
    if (!b) return;

    const statusArsip = String(
      b.status_arsip || b['Status Arsip'] || ''
    ).toLowerCase().trim();

    const statusBarang = String(
      b.status_barang || b['Status Barang'] || ''
    ).toLowerCase().trim();

    const lemariRaw = String(
      b.lokasi?.lemari ?? b['Kode Lemari'] ?? b.kode_lemari ?? ''
    ).toLowerCase().trim();
    const idBoxLower = String(b.id_box || '').toLowerCase();
    const isBerkasKeluar =
      !lemariRaw ||
      lemariRaw === '0' ||
      lemariRaw === 'kosong' ||
      lemariRaw === 'keluar' ||
      lemariRaw === '-' ||
      idBoxLower.includes('kosong') ||
      statusArsip === 'tidak tersedia' ||
      statusArsip === 'dimusnahkan' ||
      statusArsip === 'kosong' ||
      statusArsip === 'keluar';

    // 1. Cek Apakah Arsip Berada di Luar / Berkas Keluar / Tidak Tersedia
    if (isBerkasKeluar) {
      tidakTersediaCount++;
    }
    // 2. Cek Apakah Fisik Tidak Lengkap / Kurang
    else if (
      statusBarang === 'tidak lengkap' ||
      statusBarang === 'kurang' ||
      statusArsip === 'tidak lengkap' ||
      statusArsip === 'inaktif'
    ) {
      tidakLengkapCount++;
    }
    // 3. Sisanya Masuk Ke Arsip Tersedia / Aktif
    else {
      tersediaCount++;
    }
  });

  // Hitung total peserta & BK dengan DEDUPLIKASI nama pelatihan dasar (mencegah double count boks pecahan)
  const { totalPeserta, totalBK, totalPelatihanUnik } = calculateDeduplicatedStats(safeBoxes);

  // Hitung persentase aman dari pembagian nol (div by zero)
  const persenK = totalPeserta > 0 
    ? Math.round(((totalPeserta - totalBK) / totalPeserta) * 100) 
    : 100;
  const persenBK = totalPeserta > 0 
    ? Math.round((totalBK / totalPeserta) * 100) 
    : 0;

  return (
    <div className="mb-6 space-y-3">
      {/* 1. KARTU UTAMA PESERTA ASESMEN & BK */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* KARTU PESERTA ASESMEN */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs hover:border-blue-200 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Peserta Asesmen
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                Deduplikasi dari {totalPelatihanUnik} Pelatihan Dasar (Tanpa Double Count)
              </p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight tabular-nums" id="stat-peserta-total">
              {totalPeserta.toLocaleString('id-ID')}
            </span>
            <span id="badge-peserta-k" className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              {persenK}% Kompeten (K)
            </span>
          </div>
        </div>

        {/* KARTU PESERTA BK */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs hover:border-violet-200 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Peserta Belum Kompeten (BK)
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                Total Akumulasi Peserta BK Resmi
              </p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 border border-violet-100 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight tabular-nums" id="stat-peserta-bk">
              {totalBK.toLocaleString('id-ID')}
            </span>
            <span id="badge-peserta-bk" className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-200">
              {persenBK}% BK
            </span>
          </div>
        </div>
      </div>

      {/* 2. RINGKASAN STATUS FISIK BOKS ARSIP */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total Boks Arsip */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600">Total Boks Arsip</span>
            <div className="w-7 h-7 rounded-md bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
              <Boxes className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight tabular-nums">
              {totalBoks}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">100% Terdata</span>
          </div>
        </div>

        {/* Arsip Tersedia / Aktif */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs hover:border-emerald-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600">Arsip Tersedia</span>
            <div className="w-7 h-7 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-bold text-emerald-600 tracking-tight tabular-nums">
              {tersediaCount}
            </span>
            <span className="text-[11px] text-emerald-700 font-medium bg-emerald-50 px-1.5 py-0.5 rounded">
              Siap Akses
            </span>
          </div>
        </div>

        {/* Arsip Tidak Lengkap / Inaktif */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs hover:border-amber-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600">Tidak Lengkap</span>
            <div className="w-7 h-7 rounded-md bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-bold text-amber-600 tracking-tight tabular-nums">
              {tidakLengkapCount}
            </span>
            <span className="text-[11px] text-amber-700 font-medium bg-amber-50 px-1.5 py-0.5 rounded">
              Cek Fisik
            </span>
          </div>
        </div>

        {/* Berada di Luar / Berkas Keluar */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs hover:border-rose-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600 truncate" title="Berada di Luar / Berkas Keluar">
              Berkas Keluar
            </span>
            <div className="w-7 h-7 rounded-md bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center shrink-0">
              <Trash2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-bold text-rose-600 tracking-tight tabular-nums">
              {tidakTersediaCount}
            </span>
            <span className="text-[11px] text-rose-700 font-bold bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
              Di Luar
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
