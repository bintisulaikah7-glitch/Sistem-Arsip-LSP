import React, { useState } from 'react';
import { X, Play, Copy, Check, Terminal, Code2 } from 'lucide-react';

interface ApiPlaygroundModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface EndpointPreset {
  name: string;
  method: 'GET' | 'POST';
  path: string;
  description: string;
  expectedStatus: number;
  body?: string;
}

const PRESETS: EndpointPreset[] = [
  {
    name: 'Cari Berkas Pelatihan (Ditemukan)',
    method: 'GET',
    path: '/api/boxes/search?q=Web',
    description: 'Mencari berkas arsip dengan kata kunci nama pelatihan',
    expectedStatus: 200
  },
  {
    name: 'Cari Berkas Pelatihan (Tidak Ditemukan - 404)',
    method: 'GET',
    path: '/api/boxes/search?q=PelatihanAstronautMars',
    description: 'Menguji aturan respon jika data tidak ditemukan (Status 404)',
    expectedStatus: 404
  },
  {
    name: 'Get Boks by ID Box (Valid)',
    method: 'GET',
    path: '/api/boxes/BOX-L1-R1-001',
    description: 'Mengambil 1 boks file dengan 9 atribut wajib',
    expectedStatus: 200
  },
  {
    name: 'Get Boks by ID Box (404 Error)',
    method: 'GET',
    path: '/api/boxes/BOX-TIDAK-ADA-999',
    description: 'Menguji penanganan id_box yang tidak terdaftar',
    expectedStatus: 404
  },
  {
    name: 'Scan QR Code ID Box',
    method: 'GET',
    path: '/api/boxes/scan/BOX-L2-R2-005',
    description: 'Simulasi endpoint scanner QR boks arsip',
    expectedStatus: 200
  },
  {
    name: 'Filter Lemari 2 & Status Aktif',
    method: 'GET',
    path: '/api/boxes?lemari=2&status_arsip=Aktif',
    description: 'Memfilter boks arsip berdasarkan lemari dan status',
    expectedStatus: 200
  },
  {
    name: 'Statistik Ringkasan LSP',
    method: 'GET',
    path: '/api/boxes/stats',
    description: 'Menampilkan metrik agregat boks, peserta, dan lemari',
    expectedStatus: 200
  }
];

export const ApiPlaygroundModal: React.FC<ApiPlaygroundModalProps> = ({
  isOpen,
  onClose
}) => {
  const [selectedPreset, setSelectedPreset] = useState<EndpointPreset>(PRESETS[0]);
  const [customPath, setCustomPath] = useState(PRESETS[0].path);
  const [isLoading, setIsLoading] = useState(false);
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseHeaders, setResponseHeaders] = useState<string>('');
  const [responseData, setResponseData] = useState<any>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSelectPreset = (preset: EndpointPreset) => {
    setSelectedPreset(preset);
    setCustomPath(preset.path);
  };

  const handleExecute = async () => {
    setIsLoading(true);
    setResponseStatus(null);
    setResponseData(null);
    const start = performance.now();

    try {
      const res = await fetch(customPath);
      const duration = Math.round(performance.now() - start);
      setResponseTime(duration);
      setResponseStatus(res.status);
      setResponseHeaders(`Content-Type: ${res.headers.get('content-type') || 'application/json'}`);
      const data = await res.json();
      setResponseData(data);
    } catch (err: any) {
      setResponseStatus(500);
      setResponseData({
        status: 500,
        error: "Request Failed",
        message: err.message || "Gagal menghubungi endpoint."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!responseData) return;
    navigator.clipboard.writeText(JSON.stringify(responseData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in duration-200">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-950 border border-indigo-800 flex items-center justify-center text-indigo-400">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-semibold text-sm text-slate-100">
                LSP Archive API Engine Playground
              </h2>
              <p className="text-[11px] text-slate-400">
                Uji langsung endpoint backend, validasi format JSON murni, dan verifikasi status 404
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition p-1 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Preset Endpoints */}
          <div className="lg:col-span-4 space-y-2">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Skenario Endpoint:
            </label>
            <div className="space-y-1.5 max-h-[55vh] overflow-y-auto pr-1">
              {PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectPreset(preset)}
                  className={`w-full text-left p-2.5 rounded-lg border transition text-xs flex flex-col gap-1 ${
                    selectedPreset.name === preset.name
                      ? 'bg-slate-800 border-indigo-500 text-white shadow-sm'
                      : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:bg-slate-850 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200">{preset.name}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                        preset.expectedStatus === 200
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-900'
                          : 'bg-rose-950 text-rose-400 border border-rose-900'
                      }`}
                    >
                      {preset.expectedStatus}
                    </span>
                  </div>
                  <code className="text-[10px] text-emerald-400 truncate font-mono">
                    {preset.method} {preset.path}
                  </code>
                  <p className="text-[10px] text-slate-500 line-clamp-1">{preset.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Right Column: Execution & Response */}
          <div className="lg:col-span-8 flex flex-col space-y-3">
            {/* Request Bar */}
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
              <label className="block text-xs font-medium text-slate-300">
                HTTP Request URL:
              </label>
              <div className="flex gap-2">
                <span className="inline-flex items-center px-2.5 py-1.5 rounded-md bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono text-xs font-bold">
                  {selectedPreset.method}
                </span>
                <input
                  type="text"
                  value={customPath}
                  onChange={(e) => setCustomPath(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-md px-3 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  id="btn-run-request"
                  onClick={handleExecute}
                  disabled={isLoading}
                  className="inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-sm transition disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{isLoading ? 'Mengirim...' : 'Kirim'}</span>
                </button>
              </div>
            </div>

            {/* Response Viewer */}
            <div className="flex-1 border border-slate-800 rounded-lg overflow-hidden flex flex-col bg-slate-950 min-h-[300px]">
              {/* Response Status Bar */}
              <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-3">
                  <span className="text-slate-400 font-medium">HTTP Response:</span>
                  {responseStatus !== null ? (
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 py-0.5 rounded font-mono font-bold ${
                          responseStatus >= 200 && responseStatus < 300
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-rose-950 text-rose-400 border border-rose-800'
                        }`}
                      >
                        {responseStatus} {responseStatus === 200 ? 'OK' : responseStatus === 404 ? 'Not Found' : ''}
                      </span>
                      {responseTime !== null && (
                        <span className="text-slate-500 font-mono text-[11px]">{responseTime} ms</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-slate-500 text-[11px]">Belum ada request dikirim</span>
                  )}
                </div>

                {responseData && (
                  <button
                    onClick={handleCopy}
                    className="inline-flex items-center space-x-1 text-slate-300 hover:text-white px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 transition"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Tersalin' : 'Salin JSON'}</span>
                  </button>
                )}
              </div>

              {/* Response Body */}
              <div className="flex-1 p-3 overflow-auto max-h-[340px]">
                {responseData ? (
                  <pre className="font-mono text-xs text-emerald-300 leading-relaxed">
                    {JSON.stringify(responseData, null, 2)}
                  </pre>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-600 text-xs py-12">
                    <Code2 className="w-8 h-8 mb-2 stroke-1" />
                    <span>Pilih skenario atau klik &quot;Kirim&quot; untuk menjalankan endpoint.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
