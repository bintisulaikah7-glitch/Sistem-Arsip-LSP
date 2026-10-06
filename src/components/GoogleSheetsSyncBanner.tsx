import React, { useState } from 'react';
import {
  FileSpreadsheet,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  UploadCloud,
  FileText
} from 'lucide-react';

export interface SyncState {
  status: 'syncing' | 'connected' | 'warning' | 'idle';
  lastSyncedAt: Date | null;
  message: string;
  sourceUrl: string;
  totalParsed: number;
}

interface GoogleSheetsSyncBannerProps {
  syncState: SyncState;
  onManualSync: () => void;
  onUpdateSheetUrl?: (url: string) => void;
  onImportCsvText?: (csvText: string) => void;
  onOpenAppsScriptConfig?: () => void;
  nextPollCountdown: number;
}

export const GoogleSheetsSyncBanner: React.FC<GoogleSheetsSyncBannerProps> = ({
  syncState,
  onManualSync,
  onUpdateSheetUrl,
  onImportCsvText,
  onOpenAppsScriptConfig,
  nextPollCountdown
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [customUrl, setCustomUrl] = useState(syncState.sourceUrl);
  const [rawCsvInput, setRawCsvInput] = useState('');

  const isConnected = syncState.status === 'connected';
  const isSyncing = syncState.status === 'syncing';
  const isWarning = syncState.status === 'warning';

  const handleApplyUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (customUrl.trim() && onUpdateSheetUrl) {
      onUpdateSheetUrl(customUrl.trim());
    }
  };

  const handleApplyRawCsv = (e: React.FormEvent) => {
    e.preventDefault();
    if (rawCsvInput.trim() && onImportCsvText) {
      onImportCsvText(rawCsvInput.trim());
      setRawCsvInput('');
    }
  };

  return (
    <div className="mb-6 rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden text-xs">
      {/* Top Banner Row */}
      <div className="px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100">
        <div className="flex items-start sm:items-center space-x-3">
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
              isConnected
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                : isWarning
                ? 'bg-amber-50 text-amber-600 border border-amber-200'
                : 'bg-blue-50 text-blue-600 border border-blue-200'
            }`}
          >
            <FileSpreadsheet className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center flex-wrap gap-2">
              <span className="font-bold text-slate-900 text-sm">
                Google Sheets Live Sync
              </span>

              {isConnected && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                  Tersinkron ({syncState.totalParsed} Boks Arsip)
                </span>
              )}

              {isWarning && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                  <AlertTriangle className="w-3 h-3 mr-1 text-amber-600" />
                  Periksa Izin Akses Publik Spreadsheet
                </span>
              )}

              {isSyncing && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  <RefreshCw className="w-3 h-3 mr-1 text-blue-600 animate-spin" />
                  Mengambil Data...
                </span>
              )}

              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium text-slate-500 bg-slate-100 border border-slate-200">
                Auto-Refresh: {nextPollCountdown}s
              </span>
            </div>

            <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
              {syncState.message ||
                'Sinkronisasi berkas boks arsip secara otomatis dari spreadsheet Google Sheets.'}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center space-x-2 shrink-0 self-end md:self-auto">
          {onOpenAppsScriptConfig && (
            <button
              onClick={onOpenAppsScriptConfig}
              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 transition text-[11px] font-semibold shadow-2xs"
              title="Pengaturan Google Apps Script Web App"
            >
              <span>⚡ API Apps Script</span>
            </button>
          )}

          <a
            href={
              syncState.sourceUrl.includes('/export?format=csv')
                ? syncState.sourceUrl.replace('/export?format=csv', '/edit')
                : syncState.sourceUrl
            }
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 transition text-[11px] font-medium shadow-2xs"
            title="Buka Google Sheets di Tab Baru"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Buka Sheets</span>
          </a>

          <button
            id="btn-manual-sync-sheets"
            onClick={onManualSync}
            disabled={isSyncing}
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold shadow-xs transition text-[11px]"
            title="Tarik data terbaru dari Google Sheets sekarang"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}</span>
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-slate-500 hover:text-slate-700 transition shadow-2xs"
            title={isExpanded ? 'Tutup Pengaturan Sinkronisasi' : 'Buka Pengaturan Sinkronisasi'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Details / Troubleshooting */}
      {isExpanded && (
        <div className="p-4 bg-slate-50/70 border-t border-slate-100 space-y-4">
          {/* Status Note */}
          <div className="flex items-start space-x-2.5 text-slate-700 text-xs bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-slate-900">
                Panduan Memastikan Google Sheets Terhubung:
              </p>
              <ol className="list-decimal list-inside text-slate-600 space-y-0.5 text-xs">
                <li>Buka dokumen Google Sheets Anda.</li>
                <li>
                  Klik tombol <strong>Bagikan (Share)</strong> di pojok kanan atas.
                </li>
                <li>
                  Ubah <em>Akses Umum</em> menjadi{' '}
                  <span className="text-blue-700 font-semibold">
                    &quot;Siapa saja yang memiliki link&quot; (Anyone with the link)
                  </span>{' '}
                  dengan peran <em>Pelihat (Viewer)</em>.
                </li>
                <li>
                  Aplikasi memuat ulang data otomatis tiap <strong>15 detik</strong>.
                </li>
              </ol>
            </div>
          </div>

          {/* Form to change URL */}
          <form onSubmit={handleApplyUrl} className="space-y-2">
            <label className="block text-slate-700 font-semibold">
              URL Sumber CSV Google Sheets:
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/.../export?format=csv"
                className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-mono shadow-2xs"
              />
              <button
                type="submit"
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg transition font-semibold text-xs shadow-2xs"
              >
                Terapkan URL
              </button>
            </div>
          </form>

          {/* Direct CSV Paste */}
          <form onSubmit={handleApplyRawCsv} className="space-y-2 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <label className="block text-slate-700 font-semibold flex items-center space-x-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>Atau Tempel / Unggah Raw CSV Manual:</span>
              </label>
              <span className="text-[10px] text-slate-500 font-mono">
                Kolom: ID_Boks, Nama Pelatihan, Tahun Pelaksanaan, ...
              </span>
            </div>
            <textarea
              rows={3}
              value={rawCsvInput}
              onChange={(e) => setRawCsvInput(e.target.value)}
              placeholder='ID_Boks,Nama Pelatihan,Tahun Pelaksanaan,Jumlah Peserta,Jumlah Peserta BK,Kode Lemari,Nomor Rak,Nomor Baris,Status Arsip,Status Barang,Link Google Drive&#10;BOX-L1-R1-001,"Pelatihan Digital Marketing",2024,25,2,1,R1,B1,Aktif,Lengkap,https://drive.google.com'
              className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-mono shadow-2xs"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!rawCsvInput.trim()}
                className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition font-semibold text-xs shadow-xs"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Proses & Muat Data CSV</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
