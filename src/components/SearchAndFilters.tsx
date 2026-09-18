import React from 'react';
import { Search, X, Filter, LayoutGrid, Table } from 'lucide-react';
import { StatusArsip, StatusBarang } from '../types.ts';

interface SearchAndFiltersProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedLemari: number | null;
  onSelectLemari: (lemari: number | null) => void;
  selectedStatusArsip: StatusArsip | 'Semua';
  onSelectStatusArsip: (status: StatusArsip | 'Semua') => void;
  selectedStatusBarang: StatusBarang | 'Semua';
  onSelectStatusBarang: (status: StatusBarang | 'Semua') => void;
  selectedTahun: string;
  onSelectTahun: (tahun: string) => void;
  availableYears: number[];
  availableLemari?: number[];
  viewMode: 'grid' | 'table';
  onToggleViewMode: (mode: 'grid' | 'table') => void;
  onResetFilters: () => void;
  isFiltered: boolean;
}

export const SearchAndFilters: React.FC<SearchAndFiltersProps> = ({
  searchQuery,
  onSearchChange,
  selectedLemari,
  onSelectLemari,
  selectedStatusArsip,
  onSelectStatusArsip,
  selectedStatusBarang,
  onSelectStatusBarang,
  selectedTahun,
  onSelectTahun,
  availableYears,
  availableLemari = [1, 2, 3, 4],
  viewMode,
  onToggleViewMode,
  onResetFilters,
  isFiltered
}) => {
  const lemariList = availableLemari.length > 0 ? availableLemari : [1, 2, 3, 4];
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6 shadow-sm">
      {/* Top Search Input & View Toggle */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between mb-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            id="input-search-archive"
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari nama pelatihan, ID Box (misal: BOX01, Pembatik), lemari, rak, baris, tahun..."
            className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
              title="Hapus pencarian"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* View Switcher & Clear Filter */}
        <div className="flex items-center space-x-2 self-end sm:self-auto">
          {isFiltered && (
            <button
              onClick={onResetFilters}
              className="text-xs text-rose-400 hover:text-rose-300 font-medium px-2.5 py-1.5 rounded bg-rose-950/40 border border-rose-900/60 transition"
            >
              Reset Filter
            </button>
          )}
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => onToggleViewMode('grid')}
              className={`p-1.5 rounded text-xs transition ${
                viewMode === 'grid'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Tampilan Grid Kartu"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => onToggleViewMode('table')}
              className={`p-1.5 rounded text-xs transition ${
                viewMode === 'table'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Tampilan Tabel Berkas"
            >
              <Table className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-800/80 text-xs">
        {/* Lemari Selector */}
        <div>
          <label className="block text-slate-400 font-medium mb-1.5 flex items-center justify-between">
            <span>Lokasi Lemari</span>
            {selectedLemari && (
              <span className="text-[10px] text-emerald-400 font-semibold">Lemari {selectedLemari}</span>
            )}
          </label>
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => onSelectLemari(null)}
              className={`py-1.5 px-2.5 text-center rounded border transition text-[11px] font-medium ${
                selectedLemari === null
                  ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              Semua
            </button>
            {lemariList.map((num) => (
              <button
                key={num}
                onClick={() => onSelectLemari(num)}
                className={`py-1.5 px-2.5 text-center rounded border transition text-[11px] font-medium ${
                  selectedLemari === num
                    ? 'bg-emerald-600 border-emerald-500 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {num === 0 ? 'Antrian' : `L-${num}`}
              </button>
            ))}
          </div>
        </div>

        {/* Status Arsip Filter */}
        <div>
          <label className="block text-slate-400 font-medium mb-1.5">Status Arsip</label>
          <select
            value={selectedStatusArsip}
            onChange={(e) => onSelectStatusArsip(e.target.value as StatusArsip | 'Semua')}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
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

        {/* Status Barang Filter */}
        <div>
          <label className="block text-slate-400 font-medium mb-1.5">Status Fisik Boks</label>
          <select
            value={selectedStatusBarang}
            onChange={(e) => onSelectStatusBarang(e.target.value as StatusBarang | 'Semua')}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
          >
            <option value="Semua">Semua Status Fisik</option>
            <option value="Lengkap">Lengkap</option>
            <option value="Tidak Lengkap">Tidak Lengkap</option>
            <option value="Tidak Ada">Tidak Ada</option>
            <option value="Dipinjam">Dipinjam</option>
            <option value="Diperbaiki">Diperbaiki</option>
          </select>
        </div>

        {/* Tahun Pelaksanaan */}
        <div>
          <label className="block text-slate-400 font-medium mb-1.5">Tahun Pelaksanaan</label>
          <select
            value={selectedTahun}
            onChange={(e) => onSelectTahun(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
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
  );
};
