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
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden flex flex-col my-auto max-h-[92vh] text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-white px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-2xs">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-900 tracking-tight">
                Integrasi Google Apps Script (Auto-Save Google Sheets)
              </h2>
              <p className="text-xs text-slate-500">
                Simpan permanen data boks arsip baru dan perpindahan rak tanpa edit spreadsheet manual
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto text-xs text-slate-700">
          {/* Quick Notice */}
          <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 flex items-start space-x-3 text-blue-900">
            <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-slate-900">Sinkronisasi Real-Time Dua Arah</p>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Setiap kali Anda menekan <strong>+ Tambah Boks Arsip</strong> atau menggeser boks dengan <strong>Drag &amp; Drop</strong>, sistem akan otomatis mengirim data ke spreadsheet Google Sheets melalui Web App ini.
              </p>
            </div>
          </div>

          {/* Form URL */}
          <form onSubmit={handleSave} className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <label className="block font-semibold text-slate-800">
              URL Web App Google Apps Script:
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-2xs"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition shadow-xs shrink-0"
              >
                Simpan URL
              </button>
            </div>

            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold transition shadow-2xs disabled:opacity-50"
              >
                {isTesting ? (
                  <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                ) : (
                  <Zap className="w-3.5 h-3.5 text-blue-600" />
                )}
                <span>{isTesting ? 'Menguji Koneksi...' : 'Uji Koneksi API'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowCode(!showCode)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold transition shadow-2xs"
              >
                <Code className="w-3.5 h-3.5" />
                <span>{showCode ? 'Sembunyikan Script' : 'Lihat / Salin Script Google Sheets'}</span>
              </button>
            </div>

            {testResult && (
              <div
                className={`p-3 rounded-lg border text-xs flex items-center space-x-2 mt-2 ${
                  testResult.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}
          </form>

          {/* Script Viewer & Copy */}
          {showCode && (
            <div className="space-y-2 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800">
                  Kode Google Apps Script (Ekstensi &gt; Apps Script):
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded bg-white hover:bg-slate-50 text-blue-600 text-xs font-semibold border border-slate-300 transition shadow-2xs"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Tersalin!' : 'Salin Semua Kode'}</span>
                </button>
              </div>

              <div className="relative bg-slate-900 border border-slate-800 rounded-xl p-3 font-mono text-[11px] text-emerald-400 max-h-56 overflow-y-auto">
                <pre>{APPS_SCRIPT_SAMPLE_CODE}</pre>
              </div>
            </div>
          )}

          {/* 3 Step Guide */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-2">
            <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
              <span>📌 Cara Pasang Cepat (1 Menit):</span>
            </h4>
            <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-slate-600 leading-relaxed">
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
                Salin tautan Web App yang berakhiran <code className="text-blue-600 font-bold">/exec</code> ke kolom di atas. Selesai!
              </li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 bg-white flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold text-xs transition shadow-2xs"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
