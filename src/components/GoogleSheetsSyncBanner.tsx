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
  nextPollCountdown: number;
}

export const GoogleSheetsSyncBanner: React.FC<GoogleSheetsSyncBannerProps> = ({
  syncState,
  onManualSync,
  onUpdateSheetUrl,
  onImportCsvText,
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
    <div className="mb-6 rounded-xl border border-slate-800 bg-slate-900/90 shadow-sm overflow-hidden text-xs">
      {/* Top Banner Row */}
      <div className="px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800/80">
        <div className="flex items-start sm:items-center space-x-3">
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
              isConnected
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : isWarning
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
            }`}
          >
            <FileSpreadsheet className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center flex-wrap gap-2">
              <span className="font-semibold text-slate-100">
                Google Sheets Live Sync
              </span>

              {isConnected && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-950 text-emerald-300 border border-emerald-800">
                  <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-400" />
                  Tersinkron ({syncState.totalParsed} Boks)
                </span>
              )}

              {isWarning && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-950 text-amber-300 border border-amber-800">
                  <AlertTriangle className="w-3 h-3 mr-1 text-amber-400" />
                  Menunggu Akses Publik / 404
                </span>
              )}

              {isSyncing && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-cyan-950 text-cyan-300 border border-cyan-800">
                  <RefreshCw className="w-3 h-3 mr-1 text-cyan-400 animate-spin" />
                  Mengambil CSV...
                </span>
              )}

              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-400 bg-slate-950 border border-slate-800">
                Polling: tiap 15 detik ({nextPollCountdown}s)
              </span>
            </div>

            <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
              {syncState.message ||
                'Sinkronisasi berkas arsip secara otomatis dari spreadsheet Google Sheets format CSV.'}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center space-x-2 shrink-0 self-end md:self-auto">
          <a
            href={
              syncState.sourceUrl.includes('/export?format=csv')
                ? syncState.sourceUrl.replace('/export?format=csv', '/edit')
                : syncState.sourceUrl
            }
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 transition text-[11px]"
            title="Buka Google Sheets di Tab Baru"
          >
            <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Buka Sheets</span>
          </a>

          <button
            id="btn-manual-sync-sheets"
            onClick={onManualSync}
            disabled={isSyncing}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium shadow-sm transition text-[11px]"
            title="Tarik data terbaru dari Google Sheets sekarang"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}</span>
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition"
            title={isExpanded ? 'Tutup Pengaturan Sinkronisasi' : 'Buka Pengaturan Sinkronisasi'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Details / Troubleshooting */}
      {isExpanded && (
        <div className="p-4 bg-slate-950/60 border-t border-slate-800/60 space-y-4">
          {/* Status Note */}
          <div className="flex items-start space-x-2 text-slate-300 text-xs bg-slate-900/80 p-3 rounded-lg border border-slate-800">
            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-medium text-slate-200">
                Cara memastikan Google Sheets dapat dibaca otomatis oleh aplikasi:
              </p>
              <ol className="list-decimal list-inside text-slate-400 space-y-0.5">
                <li>Buka Google Sheets Anda.</li>
                <li>
                  Klik tombol <strong>Bagikan (Share)</strong> di pojok kanan atas.
                </li>
                <li>
                  Ubah <em>Akses Umum</em> menjadi{' '}
                  <span className="text-emerald-300 font-semibold">
                    "Siapa saja yang memiliki link" (Anyone with the link)
                  </span>{' '}
                  sebagai <em>Pelihat (Viewer)</em>.
                </li>
                <li>
                  Sistem melakukan polling otomatis setiap <strong>15 detik</strong>{' '}
                  dan akan langsung memuat data terbaru begitu izin aktif.
                </li>
              </ol>
            </div>
          </div>

          {/* Form to change URL */}
          <form onSubmit={handleApplyUrl} className="space-y-2">
            <label className="block text-slate-300 font-medium">
              URL Sumber CSV Google Sheets:
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/.../export?format=csv"
                className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
              />
              <button
                type="submit"
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition font-medium"
              >
                Terapkan URL
              </button>
            </div>
          </form>

          {/* Direct CSV Paste / Fallback for quick preview */}
          <form onSubmit={handleApplyRawCsv} className="space-y-2 pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between">
              <label className="block text-slate-300 font-medium flex items-center space-x-1.5">
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                <span>Atau Tempel / Unggah Raw CSV Langsung (Manual Override):</span>
              </label>
              <span className="text-[10px] text-slate-500 font-mono">
                Kolom: ID_Boks, Nama Pelatihan, Tahun Pelaksanaa, ...
              </span>
            </div>
            <textarea
              rows={3}
              value={rawCsvInput}
              onChange={(e) => setRawCsvInput(e.target.value)}
              placeholder='ID_Boks,Nama Pelatihan,Tahun Pelaksanaa,Jumlah Peserta,Jumlah Peserta BK,Kode Lemari,Nomor Rak,Nomor Baris,Status Arsip,Status Barang,Link Google Drive&#10;BOX-L1-R1-001,"Pelatihan Digital Marketing",2024,25,2,1,R1,B1,Aktif,Lengkap,https://drive.google.com'
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!rawCsvInput.trim()}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg transition font-medium text-xs shadow-sm"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Proses & Muat Data CSV Ini</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
