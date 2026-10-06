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
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-xl overflow-hidden animate-in fade-in duration-200 text-slate-800">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-white">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-2xs">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-900 tracking-tight">
                LSP Archive API Engine Playground
              </h2>
              <p className="text-xs text-slate-500">
                Uji langsung endpoint backend, validasi format JSON murni, dan verifikasi status 404
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition p-1.5 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Preset Endpoints */}
          <div className="lg:col-span-4 space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Skenario Endpoint:
            </label>
            <div className="space-y-1.5 max-h-[55vh] overflow-y-auto pr-1">
              {PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectPreset(preset)}
                  className={`w-full text-left p-2.5 rounded-xl border transition text-xs flex flex-col gap-1 ${
                    selectedPreset.name === preset.name
                      ? 'bg-blue-50/80 border-blue-400 text-slate-900 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">{preset.name}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                        preset.expectedStatus === 200
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {preset.expectedStatus}
                    </span>
                  </div>
                  <code className="text-[10px] text-blue-600 truncate font-mono">
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
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                HTTP Request URL:
              </label>
              <div className="flex gap-2">
                <span className="inline-flex items-center px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono text-xs font-bold shadow-2xs">
                  {selectedPreset.method}
                </span>
                <input
                  type="text"
                  value={customPath}
                  onChange={(e) => setCustomPath(e.target.value)}
                  className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-2xs"
                />
                <button
                  id="btn-run-request"
                  onClick={handleExecute}
                  disabled={isLoading}
                  className="inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{isLoading ? 'Mengirim...' : 'Kirim'}</span>
                </button>
              </div>
            </div>

            {/* Response Viewer */}
            <div className="flex-1 border border-slate-200 rounded-xl overflow-hidden flex flex-col bg-slate-900 min-h-[300px] shadow-xs">
              {/* Response Status Bar */}
              <div className="px-4 py-2 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs">
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
                        <span className="text-slate-400 font-mono text-[11px]">{responseTime} ms</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-slate-500 text-[11px]">Belum ada request dikirim</span>
                  )}
                </div>

                {responseData && (
                  <button
                    onClick={handleCopy}
                    className="inline-flex items-center space-x-1 text-slate-300 hover:text-white px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 transition"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Tersalin' : 'Salin JSON'}</span>
                  </button>
                )}
              </div>

              {/* Response Body */}
              <div className="flex-1 p-3.5 overflow-auto max-h-[340px]">
                {responseData ? (
                  <pre className="font-mono text-xs text-emerald-300 leading-relaxed">
                    {JSON.stringify(responseData, null, 2)}
                  </pre>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs py-12">
                    <Code2 className="w-8 h-8 mb-2 stroke-1 text-slate-600" />
                    <span>Pilih skenario atau klik &quot;Kirim&quot; untuk menjalankan endpoint.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold transition shadow-2xs"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
