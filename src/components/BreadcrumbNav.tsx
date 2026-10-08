import React from 'react';
import { ChevronRight, Home, Folder, Archive, Search, X } from 'lucide-react';

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
    ? typeof selectedCabinet === 'number' || !String(selectedCabinet).toLowerCase().startsWith('lemari')
      ? `Lemari ${selectedCabinet}`
      : String(selectedCabinet)
    : null;

  return (
    <div
      id="breadcrumb"
      className="flex items-center flex-wrap gap-2 text-xs sm:text-sm font-semibold text-slate-700 mb-4 bg-white border border-slate-200 px-4 py-2.5 rounded-xl shadow-xs"
    >
      {/* Search Mode Breadcrumb */}
      {searchQuery && searchQuery.trim() ? (
        <>
          <button
            onClick={() => {
              if (onClearSearch) onClearSearch();
              onGoToLemari();
            }}
            className="hover:underline flex items-center gap-1.5 text-slate-600 hover:text-blue-600 transition"
          >
            <Archive className="w-3.5 h-3.5 text-blue-600" />
            <span>Daftar Lemari</span>
          </button>
          <ChevronRight className="w-4 h-4 text-slate-400" />
          <span className="text-blue-700 flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5" />
            <span>Pencarian:</span>
            <span className="text-slate-900 font-bold">&quot;{searchQuery}&quot;</span>
          </span>
          <button
            onClick={onClearSearch}
            className="ml-auto text-xs text-rose-600 hover:text-rose-700 font-medium hover:underline inline-flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            <span>Hapus Pencarian</span>
          </button>
        </>
      ) : selectedCabinet === null ? (
        /* 1. TAMPILAN AWAL: DAFTAR LEMARI */
        <div className="flex items-center gap-2 text-blue-700 font-bold">
          <Archive className="w-4 h-4 text-blue-600" />
          <span>Daftar Lemari Arsip</span>
        </div>
      ) : selectedRak === null ? (
        /* 2. TAMPILAN KEDUA: DAFTAR RAK */
        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={onGoToLemari}
            className="cursor-pointer hover:underline flex items-center gap-1.5 text-slate-600 hover:text-blue-700 transition"
            title="Kembali ke Daftar Lemari"
          >
            <Archive className="w-3.5 h-3.5 text-slate-400" />
            <span>{lemariDisplay}</span>
          </button>
          <ChevronRight className="w-4 h-4 text-slate-400" />
          <span className="text-blue-700 font-bold">Pilih Rak</span>
        </div>
      ) : (
        /* 3. TAMPILAN KETIGA: DAFTAR PELATIHAN DI DALAM RAK */
        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={onGoToLemari}
            className="cursor-pointer hover:underline flex items-center gap-1.5 text-slate-600 hover:text-blue-700 transition"
            title="Kembali ke Daftar Lemari"
          >
            <Archive className="w-3.5 h-3.5 text-slate-400" />
            <span>{lemariDisplay}</span>
          </button>
          <ChevronRight className="w-4 h-4 text-slate-400" />
          <button
            onClick={() => onGoToRak && onGoToRak(selectedCabinet)}
            className="cursor-pointer hover:underline flex items-center gap-1.5 text-slate-600 hover:text-blue-700 transition"
            title={`Kembali ke Daftar Rak di ${lemariDisplay}`}
          >
            <Folder className="w-3.5 h-3.5 text-slate-400" />
            <span>{selectedRak}</span>
          </button>
          <ChevronRight className="w-4 h-4 text-slate-400" />
          <span className="text-blue-700 font-bold">Daftar Pelatihan</span>
        </div>
      )}
    </div>
  );
};
