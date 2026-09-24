import React from 'react';
import { ChevronRight, Home, RefreshCw } from 'lucide-react';

interface BreadcrumbNavProps {
  selectedCabinet: number | string | null;
  selectedRak: string | null;
  searchQuery?: string;
  onGoToLemari: () => void;
  onGoToRak?: (lemari: number | string) => void;
  onClearSearch?: () => void;
}

export const BreadcrumbNav: React.FC<BreadcrumbNavProps> = ({
  selectedCabinet,
  selectedRak,
  searchQuery,
  onGoToLemari,
  onGoToRak,
  onClearSearch
}) => {
  const lemariDisplay = selectedCabinet !== null && selectedCabinet !== undefined
    ? typeof selectedCabinet === 'number' || !selectedCabinet.toString().toLowerCase().startsWith('lemari')
      ? `Lemari ${selectedCabinet}`
      : selectedCabinet.toString()
    : null;

  return (
    <div
      id="breadcrumb"
      className="flex items-center flex-wrap gap-2 text-xs sm:text-sm font-bold text-emerald-400 mb-4 bg-slate-900/90 border border-slate-800 px-4 py-2.5 rounded-xl shadow-sm"
      style={{ color: '#10b981' }}
    >
      {/* Search Mode Breadcrumb */}
      {searchQuery && searchQuery.trim() ? (
        <>
          <button
            onClick={() => {
              if (onClearSearch) onClearSearch();
              onGoToLemari();
            }}
            className="hover:underline flex items-center gap-1.5 text-slate-300 hover:text-emerald-400 transition"
          >
            <span>📌</span>
            <span>Daftar Lemari</span>
          </button>
          <ChevronRight className="w-4 h-4 text-slate-500" />
          <span className="text-emerald-300 flex items-center gap-1">
            <span>🔍 Pencarian:</span>
            <span className="text-white">&quot;{searchQuery}&quot;</span>
          </span>
          <button
            onClick={onClearSearch}
            className="ml-auto text-[11px] text-rose-400 hover:text-rose-300 font-normal hover:underline"
          >
            Hapus Pencarian
          </button>
        </>
      ) : selectedCabinet === null ? (
        /* 1. TAMPILAN AWAL: DAFTAR LEMARI */
        <div className="flex items-center gap-1.5 text-emerald-400">
          <span>📌</span>
          <span>Daftar Lemari</span>
        </div>
      ) : selectedRak === null ? (
        /* 2. TAMPILAN KEDUA: DAFTAR RAK 1 - 4 */
        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={onGoToLemari}
            className="cursor-pointer hover:underline flex items-center gap-1 text-slate-300 hover:text-emerald-400 transition"
            title="Kembali ke Daftar Lemari"
          >
            <span>🗄️</span>
            <span>{lemariDisplay}</span>
          </button>
          <ChevronRight className="w-4 h-4 text-slate-500" />
          <span className="text-emerald-300">Pilih Rak</span>
        </div>
      ) : (
        /* 3. TAMPILAN KETIGA: DAFTAR PELATIHAN DI DALAM RAK */
        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={onGoToLemari}
            className="cursor-pointer hover:underline flex items-center gap-1 text-slate-300 hover:text-emerald-400 transition"
            title="Kembali ke Daftar Lemari"
          >
            <span>🗄️</span>
            <span>{lemariDisplay}</span>
          </button>
          <ChevronRight className="w-4 h-4 text-slate-500" />
          <button
            onClick={() => onGoToRak && onGoToRak(selectedCabinet)}
            className="cursor-pointer hover:underline flex items-center gap-1 text-slate-300 hover:text-emerald-400 transition"
            title={`Kembali ke Daftar Rak di ${lemariDisplay}`}
          >
            <span>📁</span>
            <span>{selectedRak}</span>
          </button>
          <ChevronRight className="w-4 h-4 text-slate-500" />
          <span className="text-emerald-300">Daftar Pelatihan</span>
        </div>
      )}
    </div>
  );
};
