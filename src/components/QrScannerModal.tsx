import React, { useState } from 'react';
import { 
  X, 
  QrCode, 
  Search, 
  Copy, 
  Check, 
  AlertTriangle, 
  RotateCcw, 
  ArrowLeft,
  FolderArchive,
  FileCode,
  Sparkles
} from 'lucide-react';
import { BoksArsip } from '../types.ts';
import { PortalBoxCard } from './PortalBoxCard.tsx';

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  sampleBoxes: BoksArsip[];
}

export const QrScannerModal: React.FC<QrScannerModalProps> = ({
  isOpen,
  onClose,
  sampleBoxes
}) => {
  const [scanInput, setScanInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiResponse, setApiResponse] = useState<{
    status: number;
    data: any;
  } | null>(null);
  const [viewJson, setViewJson] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleScan = async (idToScan: string) => {
    let cleanId = idToScan.trim();
    if (!cleanId) return;

    // Mendukung scan raw URL dinamis (?boxId=ID_BOKS)
    if (cleanId.includes('?') || cleanId.includes('http')) {
      try {
        const parsedUrl = new URL(cleanId, window.location.origin);
        const queryBox = parsedUrl.searchParams.get('boxId') || parsedUrl.searchParams.get('box_id') || parsedUrl.searchParams.get('box') || parsedUrl.searchParams.get('id');
        if (queryBox) {
          cleanId = queryBox.trim();
        }
      } catch {
        const match = cleanId.match(/[?&](?:boxId|box_id|box|id)=([^&#]+)/i);
        if (match && match[1]) {
          cleanId = decodeURIComponent(match[1]).trim();
        }
      }
    }

    setIsLoading(true);
    setApiResponse(null);
    setViewJson(false);

    try {
      const res = await fetch(`/api/boxes/scan/${encodeURIComponent(cleanId)}`);
      if (res.ok) {
        const data = await res.json();
        setApiResponse({
          status: res.status,
          data
        });
        return;
      }
      
      // Fallback for static GitHub Pages or unreached backend: search in sampleBoxes
      const foundInClient = sampleBoxes.find(
        (b) => b.id_box.trim().toLowerCase() === cleanId.toLowerCase()
      );
      if (foundInClient) {
        setApiResponse({
          status: 200,
          data: foundInClient
        });
        return;
      }

      const errData = await res.json().catch(() => null);
      setApiResponse({
        status: res.status,
        data: errData || {
          status: 404,
          error: "Not Found",
          message: `Data boks arsip dengan ID '${cleanId}' tidak ditemukan.`
        }
      });
    } catch (err: any) {
      // Offline / Static fallback
      const foundInClient = sampleBoxes.find(
        (b) => b.id_box.trim().toLowerCase() === cleanId.toLowerCase()
      );
      if (foundInClient) {
        setApiResponse({
          status: 200,
          data: foundInClient
        });
      } else {
        setApiResponse({
          status: 404,
          data: {
            status: 404,
            error: "Not Found",
            message: `Data boks arsip '${cleanId}' tidak ditemukan di sistem.`
          }
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetScan = () => {
    setScanInput('');
    setApiResponse(null);
    setViewJson(false);
  };

  const handleCopyJson = () => {
    if (!apiResponse) return;
    navigator.clipboard.writeText(JSON.stringify(apiResponse.data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isSuccessBox = apiResponse?.status === 200 && apiResponse?.data && 'id_box' in apiResponse.data;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden text-slate-800">
        {/* 1. HEADER POPUP */}
        <div className="px-5 py-4 border-b border-slate-200 bg-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-2xs flex-shrink-0">
              <FolderArchive className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-bold text-base md:text-lg text-slate-900 tracking-tight">
                  PORTAL ARSIP LSP BDI
                </h2>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  <Sparkles className="w-2.5 h-2.5 mr-1 text-blue-600" />
                  Scan QR Mode
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Pemindaian Barcode &amp; Pencarian Berkas Boks Pelatihan
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {isSuccessBox && viewJson && (
              <button
                onClick={() => setViewJson(false)}
                className="inline-flex items-center space-x-1 text-xs text-blue-700 hover:text-blue-800 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 transition font-semibold"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Kartu Portal</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition p-1.5 rounded-lg hover:bg-slate-100"
              title="Tutup Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body Container */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4 bg-slate-50/60">
          {/* Input & Search Form */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <label className="block text-xs font-semibold text-slate-700">
              Masukkan atau Scan Barcode / QR Code ID Box:
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  id="input-qr-id"
                  type="text"
                  value={scanInput}
                  onChange={(e) => setScanInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleScan(scanInput)}
                  placeholder="Contoh: L4-R4-BOX01-2024"
                  className="w-full pl-3.5 pr-8 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 placeholder-slate-400 font-mono uppercase focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition shadow-2xs"
                />
              </div>
              <button
                id="btn-submit-scan"
                onClick={() => handleScan(scanInput)}
                disabled={isLoading || !scanInput.trim()}
                className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition disabled:opacity-50 flex-shrink-0"
              >
                <Search className="w-3.5 h-3.5" />
                <span>{isLoading ? 'Memproses...' : 'Proses Scan'}</span>
              </button>
            </div>

            {/* Quick Test Chips */}
            <div className="pt-1">
              <span className="block text-[11px] text-slate-500 mb-1.5 font-medium">
                Contoh ID Box Cepat:
              </span>
              <div className="flex flex-wrap gap-1.5 text-xs">
                {sampleBoxes.slice(0, 4).map((b, idx) => (
                  <button
                    key={`${b.id_box}-${idx}`}
                    onClick={() => {
                      setScanInput(b.id_box);
                      handleScan(b.id_box);
                    }}
                    className="px-2.5 py-1 rounded-md bg-slate-50 hover:bg-blue-50 border border-slate-200 text-blue-700 font-mono text-[11px] font-semibold transition"
                  >
                    {b.id_box}
                  </button>
                ))}
                <button
                  onClick={() => {
                    setScanInput('BOX-UNKNOWN-999');
                    handleScan('BOX-UNKNOWN-999');
                  }}
                  className="px-2.5 py-1 rounded-md bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-mono text-[11px] font-semibold transition"
                  title="Uji respon 404 Not Found"
                >
                  Uji 404 (BOX-UNKNOWN-999)
                </button>
              </div>
            </div>
          </div>

          {/* Result Area */}
          {apiResponse && (
            <div className="space-y-3 animate-in fade-in duration-200">
              {isSuccessBox ? (
                /* SUCCESS SCAN: Show Portal Card or Raw JSON */
                <div>
                  {!viewJson ? (
                    <div className="space-y-3">
                      <PortalBoxCard
                        box={apiResponse.data as BoksArsip}
                        showJsonToggle={true}
                        onToggleJson={() => setViewJson(true)}
                      />
                      <div className="flex items-center justify-between px-1">
                        <button
                          onClick={handleResetScan}
                          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold transition shadow-2xs"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Scan Boks Lain</span>
                        </button>
                        <button
                          onClick={() => setViewJson(true)}
                          className="inline-flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800 font-semibold transition"
                        >
                          <FileCode className="w-3.5 h-3.5" />
                          <span>Lihat Format JSON</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Optional Raw JSON view */
                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-900 shadow-sm">
                      <div className="px-4 py-2.5 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-medium text-slate-300">
                            Respon Raw JSON:
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                            HTTP 200 OK
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setViewJson(false)}
                            className="inline-flex items-center space-x-1 text-xs text-blue-300 hover:text-blue-200 px-2.5 py-1 rounded bg-slate-800 transition"
                          >
                            <ArrowLeft className="w-3 h-3" />
                            <span>Kembali ke Kartu Portal</span>
                          </button>
                          <button
                            onClick={handleCopyJson}
                            className="inline-flex items-center space-x-1 text-xs text-slate-300 hover:text-white px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 transition"
                          >
                            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            <span>{copied ? 'Tersalin' : 'Salin'}</span>
                          </button>
                        </div>
                      </div>
                      <pre className="p-4 font-mono text-xs text-emerald-400 overflow-x-auto max-h-72 leading-relaxed">
                        {JSON.stringify(apiResponse.data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ) : (
                /* 404 NOT FOUND OR ERROR */
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 space-y-3 shadow-xs">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 rounded-lg bg-rose-100 border border-rose-200 text-rose-600 flex-shrink-0">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-rose-800">
                        Boks Arsip Tidak Ditemukan (HTTP {apiResponse.status})
                      </h4>
                      <p className="text-xs text-slate-600 mt-1">
                        {apiResponse.data?.message || `ID '${scanInput}' tidak terdaftar dalam database sistem arsip.`}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t border-rose-200 text-xs">
                    <button
                      onClick={handleResetScan}
                      className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold transition shadow-2xs"
                    >
                      Coba ID Boks Lain
                    </button>
                    <button
                      onClick={() => setViewJson(!viewJson)}
                      className="text-rose-700 hover:underline font-semibold transition"
                    >
                      {viewJson ? 'Sembunyikan Respon JSON' : 'Lihat Respon Error JSON (404)'}
                    </button>
                  </div>

                  {viewJson && (
                    <pre className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-xs font-mono text-rose-300 overflow-x-auto">
                      {JSON.stringify(apiResponse.data, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Quick Guidance when no scan yet */}
          {!apiResponse && (
            <div className="p-4 bg-white rounded-xl border border-slate-200 text-xs text-slate-600 space-y-2 shadow-xs">
              <div className="flex items-center space-x-2 text-slate-800 font-bold">
                <QrCode className="w-4 h-4 text-blue-600" />
                <span>Petunjuk Pemindaian QR Code:</span>
              </div>
              <p className="leading-relaxed text-slate-600">
                Scan QR Code pada label fisik boks arsip menggunakan scanner genggam atau ketik kode ID boks pada kolom di atas untuk langsung membuka <strong>Kartu Portal Digital</strong> lengkap dengan tautan dokumentasi Google Drive.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 bg-white flex items-center justify-between text-xs">
          <span className="text-[11px] text-slate-500 font-mono">
            Endpoint API: GET /api/boxes/scan/:id_box
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold transition shadow-2xs"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
