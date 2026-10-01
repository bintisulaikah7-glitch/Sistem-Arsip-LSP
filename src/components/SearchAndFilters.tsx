import React, { useEffect } from 'react';
import { LayoutGrid, Table, X } from 'lucide-react';
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
      {/* KOTAK PENCARIAN TERPADU */}
      <div className="search-box-container">
        {/* Input Teks Pencarian */}
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
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
            placeholder="Cari nama pelatihan, ID Boks Arsip, Lemari, Rak, Tahun..."
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="text-slate-400 hover:text-white px-1 text-sm cursor-pointer"
              title="Hapus teks"
            >
              ✕
            </button>
          )}
        </div>

        {/* Aksi Tombol (Scan QR & Tombol Cari Utama) */}
        <div className="search-actions">
          <button type="button" className="btn-scan-qr" onClick={bukaScannerQR}>
            📷 Scan QR
          </button>
          <button type="button" className="btn-cari-utama" onClick={eksekusiPencarian}>
            Cari
          </button>
        </div>
      </div>

      {/* Baris Filter Pendukung & Tampilan */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-300">Filter Pencarian Cepat</span>
            {isFiltered && (
              <button
                onClick={onResetFilters}
                className="text-[11px] text-rose-400 hover:text-rose-300 font-medium px-2 py-0.5 rounded bg-rose-950/40 border border-rose-900/60 transition"
              >
                Reset Filter
              </button>
            )}
          </div>

          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 self-end sm:self-auto">
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

        {/* Filter Row - Dropdown Lemari & Rak Dinamis Otomatis dari Google Sheets */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 pt-3 border-t border-slate-800/80 text-xs">
          {/* 1. Dropdown Lokasi Lemari (Dinamis dari Google Sheets) */}
          <div>
            <label className="block text-slate-400 font-medium mb-1.5 flex items-center justify-between">
              <span>Lokasi Lemari</span>
              {selectedLemari && (
                <span className="text-[10px] text-emerald-400 font-semibold">Lemari {selectedLemari}</span>
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
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs cursor-pointer"
            >
              <option value="Semua">Semua Lemari ({lemariList.length} Lemari)</option>
              {lemariList.map((num) => (
                <option key={num} value={num.toString()}>
                  Lemari {num}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Dropdown Sekat / Rak (Dinamis dari Google Sheets) */}
          <div>
            <label className="block text-slate-400 font-medium mb-1.5 flex items-center justify-between">
              <span>Sekat / Rak</span>
              {selectedRak && (
                <span className="text-[10px] text-emerald-400 font-semibold">{selectedRak}</span>
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
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs cursor-pointer"
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

          {/* 4. Status Barang Filter */}
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

          {/* 5. Tahun Pelaksanaan */}
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
    </div>
  );
};
