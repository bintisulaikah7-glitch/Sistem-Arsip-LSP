import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Download, FileCode, FolderArchive, ArrowLeft } from 'lucide-react';
import { PortalBoxCard } from './PortalBoxCard.tsx';
import { BoksArsip } from '../types.ts';

interface JsonViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  data: any;
  statusCode?: number;
}

export const JsonViewerModal: React.FC<JsonViewerModalProps> = ({
  isOpen,
  onClose,
  title,
  data,
  statusCode = 200
}) => {
  const [copied, setCopied] = useState(false);
  const [viewJson, setViewJson] = useState(false);

  // Check if data is a box
  const isBoxData = Boolean(
    data &&
    typeof data === 'object' &&
    'id_box' in data &&
    'nama_pelatihan' in data
  );

  // Reset view state whenever opened or data changes
  useEffect(() => {
    setViewJson(!isBoxData);
  }, [isOpen, data, isBoxData]);

  if (!isOpen) return null;

  const jsonString = JSON.stringify(data, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `response_${data?.id_box || 'data'}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/90 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Top Floating Close Bar */}
        <div className="px-5 py-3 border-b border-slate-800 bg-slate-950/90 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-950 border border-emerald-800/80 flex items-center justify-center text-emerald-400">
              <FolderArchive className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-xs sm:text-sm text-slate-100">
                {isBoxData && !viewJson ? 'PORTAL ARSIP LSP BDI' : title}
              </span>
              <span className="hidden sm:inline-block ml-2 text-[11px] text-slate-400">
                {isBoxData && !viewJson ? '• Kartu Detail Digital' : '• Format Data JSON'}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {isBoxData && viewJson && (
              <button
                onClick={() => setViewJson(false)}
                className="inline-flex items-center space-x-1 text-xs text-emerald-400 hover:text-emerald-300 px-2.5 py-1 rounded bg-emerald-950/60 border border-emerald-800/60 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Kartu Portal</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition p-1.5 rounded-lg hover:bg-slate-800"
              title="Tutup Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-slate-950/50">
          {isBoxData && !viewJson ? (
            /* Render Portal Card */
            <PortalBoxCard
              box={data as BoksArsip}
              showJsonToggle={true}
              onToggleJson={() => setViewJson(true)}
            />
          ) : (
            /* Render Syntax Highlighted JSON */
            <div className="space-y-3">
              <div className="flex items-center justify-between px-2 text-xs text-slate-400">
                <span className="font-mono">Payload JSON Valid (HTTP {statusCode})</span>
                {isBoxData && (
                  <button
                    onClick={() => setViewJson(false)}
                    className="text-emerald-400 hover:underline inline-flex items-center space-x-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Kembali ke Tampilan Kartu Portal</span>
                  </button>
                )}
              </div>
              <pre className="font-mono text-xs text-emerald-300 leading-relaxed overflow-x-auto whitespace-pre p-4 bg-slate-950 rounded-xl border border-slate-800 max-h-[60vh]">
                {jsonString}
              </pre>
            </div>
          )}
        </div>

        {/* Footer (Only for JSON view or fallback) */}
        {viewJson && (
          <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-mono text-[11px]">
              {new Blob([jsonString]).size} bytes • JSON Output
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleDownload}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh .json</span>
              </button>
              <button
                onClick={handleCopy}
                className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-sm transition"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Tersalin!' : 'Salin JSON'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
