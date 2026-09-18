import React from 'react';
import { Archive, Plus, QrCode, Terminal, Download, RefreshCw } from 'lucide-react';

interface HeaderProps {
  onOpenAddModal: () => void;
  onOpenQrModal: () => void;
  onOpenApiPlayground: () => void;
  onExportJson: () => void;
  onResetData: () => void;
  totalBoxes: number;
  isResetting: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAddModal,
  onOpenQrModal,
  onOpenApiPlayground,
  onExportJson,
  onResetData,
  totalBoxes,
  isResetting
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold text-slate-100 tracking-tight">
                  Sistem Arsip Boks LSP
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1.5" />
                  API Engine Active
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Lembaga Sertifikasi Profesi • 9 Atribut Standar • {totalBoxes} Boks Terdaftar
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center flex-wrap gap-2">
            <button
              id="btn-scan-qr"
              onClick={onOpenQrModal}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              title="Scan QR Code ID Box"
            >
              <QrCode className="w-3.5 h-3.5 text-emerald-400" />
              <span>Scan QR ID</span>
            </button>

            <button
              id="btn-api-playground"
              onClick={onOpenApiPlayground}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-900/60 transition"
              title="Buka API Engine & JSON Tester"
            >
              <Terminal className="w-3.5 h-3.5 text-indigo-400" />
              <span>API Engine</span>
            </button>

            <button
              id="btn-export-json"
              onClick={onExportJson}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              title="Unduh dataset dalam format JSON"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Unduh JSON</span>
            </button>

            <button
              id="btn-reset-data"
              onClick={onResetData}
              disabled={isResetting}
              className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700 transition disabled:opacity-50"
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
