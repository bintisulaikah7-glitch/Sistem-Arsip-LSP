import React from 'react';
import { Archive, Plus, QrCode, Terminal, Download, RefreshCw, MapPin } from 'lucide-react';

interface HeaderProps {
  onOpenAddModal: () => void;
  onOpenQrModal: () => void;
  onOpenInputLokasi: () => void;
  onOpenApiPlayground: () => void;
  onExportJson: () => void;
  onResetData: () => void;
  totalBoxes: number;
  isResetting: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAddModal,
  onOpenQrModal,
  onOpenInputLokasi,
  onOpenApiPlayground,
  onExportJson,
  onResetData,
  totalBoxes,
  isResetting
}) => {
  return (
    <header className="bg-white border-b border-slate-200 text-slate-800 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-sm">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                  Sistem Arsip Boks LSP
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1.5" />
                  API Engine Active
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Lembaga Sertifikasi Profesi • 9 Atribut Standar • {totalBoxes} Boks Terdaftar
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center flex-wrap gap-2">
            <button
              id="btn-scan-qr"
              onClick={onOpenQrModal}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition shadow-xs"
              title="Scan QR Code ID Box"
            >
              <QrCode className="w-3.5 h-3.5 text-emerald-600" />
              <span>Scan QR ID</span>
            </button>

            <button
              id="btn-input-lokasi"
              onClick={onOpenInputLokasi}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 transition shadow-xs"
              title="Input Lokasi Berkas LSP & Generate QR Code"
            >
              <MapPin className="w-3.5 h-3.5 text-teal-600" />
              <span>Input Lokasi & QR</span>
            </button>

            <button
              id="btn-api-playground"
              onClick={onOpenApiPlayground}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 transition shadow-xs"
              title="Buka API Engine & JSON Tester"
            >
              <Terminal className="w-3.5 h-3.5 text-indigo-600" />
              <span>API Engine</span>
            </button>

            <button
              id="btn-export-json"
              onClick={onExportJson}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition shadow-xs"
              title="Unduh dataset dalam format JSON"
            >
              <Download className="w-3.5 h-3.5 text-amber-600" />
              <span>Unduh JSON</span>
            </button>

            <button
              id="btn-reset-data"
              onClick={onResetData}
              disabled={isResetting}
              className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-300 transition disabled:opacity-50"
              title="Reset ke data awal"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
            </button>

            <button
              id="btn-add-box"
              onClick={onOpenAddModal}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-md bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Boks</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
