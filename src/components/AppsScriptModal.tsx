import React, { useState } from 'react';
import { X, Copy, Check, ExternalLink, Zap, CheckCircle2, AlertCircle, Code, ShieldCheck, RefreshCw } from 'lucide-react';
import { getStoredAppsScriptUrl, setStoredAppsScriptUrl, APPS_SCRIPT_SAMPLE_CODE } from '../utils/appsScriptService.ts';

interface AppsScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessSave?: (url: string) => void;
}

export const AppsScriptModal: React.FC<AppsScriptModalProps> = ({
  isOpen,
  onClose,
  onSuccessSave
}) => {
  const [urlInput, setUrlInput] = useState(() => getStoredAppsScriptUrl());
  const [copiedCode, setCopiedCode] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showCode, setShowCode] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setStoredAppsScriptUrl(urlInput.trim());
    if (onSuccessSave) {
      onSuccessSave(urlInput.trim());
    }
    setTestResult({
      success: true,
      message: 'URL Google Apps Script Web App berhasil disimpan. Data boks arsip baru & perpindahan boks akan disinkronkan otomatis.'
    });
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_SAMPLE_CODE);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleTestConnection = async () => {
    if (!urlInput.trim()) {
      setTestResult({
        success: false,
        message: 'Masukkan URL Google Apps Script Web App terlebih dahulu.'
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      // Test via proxy to bypass browser CORS
      const res = await fetch('/api/apps-script/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webAppUrl: urlInput.trim(),
          action: 'ping',
          box: { id_box: 'PING-TEST' }
        })
      });

      if (res.ok) {
        setTestResult({
          success: true,
          message: 'Koneksi ke Google Apps Script Web App BERHASIL! Endpoint siap menerima penambahan & pergeseran boks arsip.'
        });
      } else {
        const data = await res.json().catch(() => ({}));
        setTestResult({
          success: false,
          message: data.message || `Gagal menghubungi URL Web App (${res.status}). Pastikan hak akses disetel ke 'Anyone'.`
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `Koneksi gagal: ${err.message || 'Cek kembali URL penerapan web app.'}`
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-950 px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm sm:text-base text-white tracking-wide">
                Integrasi Google Apps Script (Auto-Save Google Sheets)
              </h2>
              <p className="text-xs text-slate-400">
                Simpan permanen data boks arsip baru dan perpindahan rak tanpa edit spreadsheet manual
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto text-xs text-slate-300">
          {/* Quick Notice */}
          <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-xl p-3.5 flex items-start space-x-3 text-emerald-200">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-white">Sinkronisasi Real-Time Dua Arah</p>
              <p className="text-[11px] text-emerald-300/90 leading-relaxed">
                Setiap kali Anda menekan <strong>+ Tambah Boks Arsip</strong> atau menggeser boks dengan <strong>Drag &amp; Drop</strong>, sistem akan otomatis mengirim data ke spreadsheet Google Sheets melalui Web App ini.
              </p>
            </div>
          </div>

          {/* Form URL */}
          <form onSubmit={handleSave} className="space-y-3 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
            <label className="block font-semibold text-slate-200">
              URL Web App Google Apps Script:
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-emerald-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition shrink-0"
              >
                Simpan URL
              </button>
            </div>

            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition disabled:opacity-50"
              >
                {isTesting ? (
                  <RefreshCw className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                ) : (
                  <Zap className="w-3.5 h-3.5 text-emerald-400" />
                )}
                <span>{isTesting ? 'Menguji Koneksi...' : 'Uji Koneksi API'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowCode(!showCode)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-300 border border-indigo-800/80 text-xs font-medium transition"
              >
                <Code className="w-3.5 h-3.5" />
                <span>{showCode ? 'Sembunyikan Script' : 'Lihat / Salin Script Google Sheets'}</span>
              </button>
            </div>

            {testResult && (
              <div
                className={`p-3 rounded-lg border text-xs flex items-center space-x-2 mt-2 ${
                  testResult.success
                    ? 'bg-emerald-950/80 border-emerald-800 text-emerald-300'
                    : 'bg-rose-950/80 border-rose-800 text-rose-300'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}
          </form>

          {/* Script Viewer & Copy */}
          {showCode && (
            <div className="space-y-2 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-300">
                  Kode Google Apps Script (Ekstensi &gt; Apps Script):
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-medium border border-slate-700 transition"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Tersalin!' : 'Salin Semua Kode'}</span>
                </button>
              </div>

              <div className="relative bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-[11px] text-slate-300 max-h-56 overflow-y-auto">
                <pre>{APPS_SCRIPT_SAMPLE_CODE}</pre>
              </div>
            </div>
          )}

          {/* 3 Step Guide */}
          <div className="border border-slate-800 rounded-xl p-4 bg-slate-950/40 space-y-2">
            <h4 className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
              <span>📌 Cara Pasang Cepat (1 Menit):</span>
            </h4>
            <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-slate-400 leading-relaxed">
              <li>
                Buka file Google Sheets &rarr; klik menu <strong>Ekstensi &gt; Apps Script</strong>.
              </li>
              <li>
                Tempelkan script di atas, lalu klik <strong>Terapkan (Deploy) &gt; Penerapan Baru (New deployment)</strong>.
              </li>
              <li>
                Pilih jenis <strong>Aplikasi Web (Web App)</strong>, pilih akses <strong>Siapa Saja (Anyone)</strong>, lalu klik <strong>Terapkan</strong>.
              </li>
              <li>
                Salin tautan Web App yang berakhiran <code className="text-emerald-400">/exec</code> ke kolom di atas. Selesai!
              </li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
