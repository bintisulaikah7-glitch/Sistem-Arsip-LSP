import React, { useEffect } from 'react';
import { LayoutGrid, Table, X, Search, QrCode } from 'lucide-react';
import { StatusArsip, StatusBarang } from '../types.ts';

interface SearchAndFiltersProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenQrScanner?: () => void;
  selectedLemari: (number | string) | null;
  onSelectLemari: (lemari: any) => void;
  selectedRak?: string | null;
  onSelectRak?: (rak: string | null) => void;
  selectedStatusArsip: StatusArsip | 'Semua';
  onSelectStatusArsip: (status: StatusArsip | 'Semua') => void;
  selectedStatusBarang: StatusBarang | 'Semua';
  onSelectStatusBarang: (status: StatusBarang | 'Semua') => void;
  selectedTahun: string;
  onSelectTahun: (tahun: string) => void;
  availableYears: number[];
  availableLemari?: (number | string)[];
  availableRaks?: string[];
  viewMode: 'grid' | 'table';
  onToggleViewMode: (mode: 'grid' | 'table') => void;
  onResetFilters: () => void;
  isFiltered: boolean;
}

export const SearchAndFilters: React.FC<SearchAndFiltersProps> = ({
  searchQuery,
  onSearchChange,
  onOpenQrScanner,
  selectedLemari,
  onSelectLemari,
  selectedRak = null,
  onSelectRak,
  selectedStatusArsip,
  onSelectStatusArsip,
  selectedStatusBarang,
  onSelectStatusBarang,
  selectedTahun,
  onSelectTahun,
  availableYears,
  availableLemari = [1, 2, 3, 4],
  availableRaks = [],
  viewMode,
  onToggleViewMode,
  onResetFilters,
  isFiltered
}) => {
  const lemariList = React.useMemo(() => {
    return (availableLemari || []).filter((item) => {
      const str = item.toString().replace(/lemari[-_\s]*/i, '').trim();
      return str !== '0' && parseInt(str, 10) !== 0 && str !== '' && str.toLowerCase() !== 'kosong';
    });
  }, [availableLemari]);

  const rakList = React.useMemo(() => {
    return (availableRaks || []).filter((item) => {
      const str = item.toString().trim();
      return str !== '' && str !== '-' && str.toLowerCase() !== 'kosong';
    });
  }, [availableRaks]);

  const bukaScannerQR = () => {
    if (onOpenQrScanner) {
      onOpenQrScanner();
    }
  };

  const eksekusiPencarian = () => {
    const el = document.getElementById('content-area') || document.getElementById('search-results-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  useEffect(() => {
    (window as any).bukaScannerQR = bukaScannerQR;
    (window as any).eksekusiPencarian = eksekusiPencarian;
    return () => {
      delete (window as any).bukaScannerQR;
      delete (window as any).eksekusiPencarian;
    };
  }, [onOpenQrScanner]);

  return (
    <div className="space-y-3 mb-6">
      {/* 1. KOTAK PENCARIAN TERPADU: Satu baris kartu putih bersih */}
      <div className="bg-white border border-slate-200 rounded-2xl p-2 sm:p-2.5 shadow-sm flex items-center gap-2 sm:gap-2.5">
        {/* Bilah Pencarian Nama Pelatihan & Boks */}
        <div className="flex-1 flex items-center px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus-within:bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all min-w-0">
          <Search className="w-4 h-4 text-slate-400 shrink-0 mr-2" />
          <input
            type="text"
            id="inputPencarian"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                eksekusiPencarian();
              }
            }}
            className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none font-medium truncate"
            placeholder="Cari nama pelatihan, ID Boks Arsip, Lemari, Rak, Tahun..."
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="text-slate-400 hover:text-slate-600 p-1 text-sm cursor-pointer transition-colors ml-1 shrink-0"
              title="Hapus teks"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Tombol Scan QR */}
        <button
          type="button"
          className="inline-flex items-center justify-center gap-1.5 px-3 sm:px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-blue-700 bg-slate-50 hover:bg-blue-50 rounded-xl border border-slate-200 hover:border-blue-300 transition-colors shadow-2xs cursor-pointer whitespace-nowrap shrink-0"
          onClick={bukaScannerQR}
          title="Buka Pemindai QR Code"
        >
          <QrCode className="w-4 h-4 text-blue-600 shrink-0" />
          <span className="hidden xs:inline sm:inline">Scan QR</span>
          <span className="xs:hidden sm:hidden">QR</span>
        </button>

        {/* Tombol Cari */}
        <button
          type="button"
          className="inline-flex items-center justify-center gap-1.5 px-3.5 sm:px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-xl transition-all shadow-xs cursor-pointer whitespace-nowrap shrink-0"
          onClick={eksekusiPencarian}
          title="Eksekusi Pencarian"
        >
          <Search className="w-3.5 h-3.5 shrink-0" />
          <span>Cari</span>
        </button>
      </div>

      {/* 2. BARIS FILTER PENDUKUNG & TAMPILAN (BACKGROUND PUTIH, BORDER SLATE-200) */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3.5">
          <div className="flex items-center space-x-2.5">
            <span className="text-xs font-bold text-slate-800 tracking-wide">Filter Pencarian Data</span>
            {isFiltered && (
              <button
                onClick={onResetFilters}
                className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold px-2.5 py-0.5 rounded-md bg-rose-50 border border-rose-200 transition-colors shadow-2xs"
              >
                Reset Filter
              </button>
            )}
          </div>

          {/* Toggle View Mode (Grid vs Table) */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 self-end sm:self-auto">
            <button
              onClick={() => onToggleViewMode('grid')}
              className={`p-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'grid'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Tampilan Grid Kartu"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => onToggleViewMode('table')}
              className={`p-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Tampilan Tabel Berkas"
            >
              <Table className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dropdown Filters (Latar Putih, Border Slate-300, Fokus Biru) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 pt-3 border-t border-slate-100 text-xs">
          {/* 1. Dropdown Lokasi Lemari */}
          <div>
            <label className="block text-slate-600 font-semibold mb-1.5 flex items-center justify-between">
              <span>Lokasi Lemari</span>
              {selectedLemari && (
                <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                  Lemari {selectedLemari}
                </span>
              )}
            </label>
            <select
              value={selectedLemari !== null ? selectedLemari.toString() : 'Semua'}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'Semua') {
                  onSelectLemari(null);
                } else {
                  const numVal = parseInt(val, 10);
                  onSelectLemari(!isNaN(numVal) ? numVal : val);
                }
              }}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-xs cursor-pointer shadow-2xs transition-all"
            >
              <option value="Semua">Semua Lemari ({lemariList.length} Lemari)</option>
              {lemariList.map((num) => (
                <option key={num} value={num.toString()}>
                  Lemari {num}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Dropdown Sekat / Rak */}
          <div>
            <label className="block text-slate-600 font-semibold mb-1.5 flex items-center justify-between">
              <span>Sekat / Rak</span>
              {selectedRak && (
                <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                  {selectedRak}
                </span>
              )}
            </label>
            <select
              value={selectedRak || 'Semua'}
              onChange={(e) => {
                if (onSelectRak) {
                  const val = e.target.value;
                  onSelectRak(val === 'Semua' ? null : val);
                }
              }}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-xs cursor-pointer shadow-2xs transition-all"
            >
              <option value="Semua">Semua Rak ({rakList.length} Rak)</option>
              {rakList.map((rak) => (
                <option key={rak} value={rak}>
                  {rak.toString().startsWith('Rak') ? rak : `Rak ${rak}`}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Status Arsip Filter */}
          <div>
            <label className="block text-slate-600 font-semibold mb-1.5">Status Arsip</label>
            <select
              value={selectedStatusArsip}
              onChange={(e) => onSelectStatusArsip(e.target.value as StatusArsip | 'Semua')}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-xs cursor-pointer shadow-2xs transition-all"
            >
              <option value="Semua">Semua Status Arsip</option>
              <option value="Tersedia">Tersedia</option>
              <option value="Tidak Lengkap">Tidak Lengkap</option>
              <option value="Tidak Tersedia">Tidak Tersedia</option>
              <option value="Aktif">Aktif</option>
              <option value="Inaktif">Inaktif</option>
              <option value="Dimusnahkan">Dimusnahkan</option>
            </select>
          </div>

          {/* 4. Status Barang Filter */}
          <div>
            <label className="block text-slate-600 font-semibold mb-1.5">Status Fisik Boks</label>
            <select
              value={selectedStatusBarang}
              onChange={(e) => onSelectStatusBarang(e.target.value as StatusBarang | 'Semua')}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-xs cursor-pointer shadow-2xs transition-all"
            >
              <option value="Semua">Semua Status Fisik</option>
              <option value="Lengkap">Lengkap</option>
              <option value="Tidak Lengkap">Tidak Lengkap</option>
              <option value="Tidak Ada">Tidak Ada</option>
              <option value="Dipinjam">Dipinjam</option>
              <option value="Diperbaiki">Diperbaiki</option>
            </select>
          </div>

          {/* 5. Tahun Pelaksanaan */}
          <div>
            <label className="block text-slate-600 font-semibold mb-1.5">Tahun Pelaksanaan</label>
            <select
              value={selectedTahun}
              onChange={(e) => onSelectTahun(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-xs cursor-pointer shadow-2xs transition-all"
            >
              <option value="Semua">Semua Tahun</option>
              {availableYears.map((year) => (
                <option key={year} value={year.toString()}>
                  Tahun {year}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
