import React, { useState, useMemo } from 'react';
import { X, QrCode, Copy, Check, Printer, Download, ExternalLink, MapPin, Sparkles, Filter, Archive } from 'lucide-react';
import { BoksArsip } from '../types.ts';
import { getLocationPublicUrl, getLocationQrImageUrl } from '../utils/url.ts';

interface InputLokasiModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingBoxes?: BoksArsip[];
  initialLemari?: string;
  initialRak?: string;
  onApplyFilter?: (pelatihan: string, lemari: string, rak: string) => void;
  onSaveNewBox?: (newBox: Partial<BoksArsip>) => void;
}

export const InputLokasiModal: React.FC<InputLokasiModalProps> = ({
  isOpen,
  onClose,
  existingBoxes = [],
  initialLemari,
  initialRak,
  onApplyFilter,
  onSaveNewBox
}) => {
  const [pelatihan, setPelatihan] = useState('');
  const [lemari, setLemari] = useState(initialLemari || 'Lemari-A');
  const [rak, setRak] = useState(initialRak || 'Rak-1');
  const [isGenerated, setIsGenerated] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saveToArchiveList, setSaveToArchiveList] = useState(false);
  const [tahun, setTahun] = useState(new Date().getFullYear().toString());

  // Update lemari/rak if initial values change when opened
  React.useEffect(() => {
    if (initialLemari) setLemari(initialLemari);
    if (initialRak) setRak(initialRak);
  }, [initialLemari, initialRak, isOpen]);

  // Extract unique training names from dataset for smart autocomplete
  const trainingSuggestions = useMemo(() => {
    const names = Array.from(new Set(existingBoxes.map(b => b.nama_pelatihan).filter(Boolean)));
    return names.slice(0, 8);
  }, [existingBoxes]);

  if (!isOpen) return null;

  // Generate target URL
  const targetUrl = getLocationPublicUrl(pelatihan, lemari, rak);
  const qrImageUrl = getLocationQrImageUrl(pelatihan, lemari, rak, 260);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pelatihan.trim()) {
      alert('Harap isi nama pelatihan!');
      return;
    }
    setIsGenerated(true);

    // If user opts to also save to archive list
    if (saveToArchiveList && onSaveNewBox) {
      // Parse numeric lemari if possible (e.g. Lemari-1 -> 1, Lemari-A -> 1)
      let numLemari = 1;
      if (lemari.includes('B') || lemari.includes('2')) numLemari = 2;
      if (lemari.includes('C') || lemari.includes('3')) numLemari = 3;

      const randomSuffix = Math.floor(10 + Math.random() * 90);
      const cleanCode = `L${numLemari}-${rak.replace('Rak-', 'R')}-BOX${randomSuffix}-${tahun}`;

      onSaveNewBox({
        id_box: cleanCode,
        nama_pelatihan: pelatihan.trim(),
        tahun_pelaksanaan: parseInt(tahun, 10) || new Date().getFullYear(),
        jumlah_peserta: 20,
        jumlah_peserta_bk: 0,
        lokasi: {
          lemari: numLemari,
          rak: rak.replace('-', ' '),
          baris: 'Baris 1'
        },
        status_arsip: 'Tersedia',
        status_barang: 'Lengkap',
        link_dokumentasi: 'https://drive.google.com'
      });
    }
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(targetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadQr = () => {
    const link = document.createElement('a');
    link.href = qrImageUrl;
    link.target = '_blank';
    link.download = `QR-Lokasi-${pelatihan.replace(/\s+/g, '_')}-${lemari}-${rak}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleApplyNow = () => {
    if (onApplyFilter) {
      onApplyFilter(pelatihan, lemari, rak);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in duration-200 my-auto text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white tracking-tight">
                Input Lokasi Berkas LSP
              </h2>
              <p className="text-xs text-slate-400">
                Pencatatan lokasi fisik berkas & generator QR Code filter boks
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition p-1.5 rounded-lg hover:bg-slate-800"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Form Input Lokasi */}
          <form onSubmit={handleGenerate} className="space-y-4">
            {/* Nama Pelatihan */}
            <div className="space-y-1.5">
              <label htmlFor="pelatihan" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Nama Pelatihan: <span className="text-emerald-400">*</span>
              </label>
              <input
                type="text"
                id="pelatihan"
                value={pelatihan}
                onChange={(e) => setPelatihan(e.target.value)}
                placeholder="Contoh: Data Analyst"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                required
              />

              {/* Quick Suggestion Pills */}
              {trainingSuggestions.length > 0 && !pelatihan && (
                <div className="pt-1.5 flex flex-wrap gap-1.5">
                  <span className="text-[11px] text-slate-500 self-center mr-1">Saran:</span>
                  {trainingSuggestions.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPelatihan(item)}
                      className="text-[11px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 hover:text-emerald-300 transition"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Grid Lemari & Rak */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Pilih Lemari */}
              <div className="space-y-1.5">
                <label htmlFor="lemari" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Pilih Lemari:
                </label>
                <select
                  id="lemari"
                  value={lemari}
                  onChange={(e) => setLemari(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                >
                  <option value="Lemari-A">Lemari A</option>
                  <option value="Lemari-B">Lemari B</option>
                  <option value="Lemari-C">Lemari C</option>
                  <option value="Lemari-1">Lemari 1</option>
                  <option value="Lemari-2">Lemari 2</option>
                  <option value="Lemari-3">Lemari 3</option>
                </select>
              </div>

              {/* Pilih Rak */}
              <div className="space-y-1.5">
                <label htmlFor="rak" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Pilih Rak:
                </label>
                <select
                  id="rak"
                  value={rak}
                  onChange={(e) => setRak(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                >
                  <option value="Rak-1">Rak 1 (Atas)</option>
                  <option value="Rak-2">Rak 2 (Tengah-Atas)</option>
                  <option value="Rak-3">Rak 3 (Tengah-Bawah)</option>
                  <option value="Rak-4">Rak 4 (Bawah)</option>
                  <option value="Rak-A">Rak A (Tingkat 1)</option>
                  <option value="Rak-B">Rak B (Tingkat 2)</option>
                  <option value="Rak-C">Rak C (Tingkat 3)</option>
                </select>
              </div>
            </div>

            {/* Opsi Tambahkan ke Database Boks */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3 space-y-2">
              <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={saveToArchiveList}
                  onChange={(e) => setSaveToArchiveList(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-emerald-500 w-4 h-4"
                />
                <span className="font-medium">Daftarkan juga sebagai boks baru ke daftar arsip</span>
              </label>

              {saveToArchiveList && (
                <div className="pt-1 flex items-center space-x-2">
                  <span className="text-xs text-slate-400">Tahun Pelaksanaan:</span>
                  <input
                    type="number"
                    value={tahun}
                    onChange={(e) => setTahun(e.target.value)}
                    className="w-24 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                  />
                </div>
              )}
            </div>

            {/* Tombol Simpan & Generate */}
            <button
              type="submit"
              className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-md hover:shadow-emerald-900/30 transition active:scale-[0.99]"
            >
              <QrCode className="w-4 h-4" />
              <span>Simpan & Generate QR Code</span>
            </button>
          </form>

          {/* Section Hasil Filter / QR Code */}
          {isGenerated && (
            <div id="result" className="pt-4 border-t border-slate-800 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-200 flex items-center space-x-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>Hasil Filter / QR Code:</span>
                </h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-950 text-emerald-400 border border-emerald-800">
                  Aktif & Siap Discan
                </span>
              </div>

              {/* URL Target Card */}
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold">URL Target:</span>
                  <button
                    onClick={handleCopyUrl}
                    className="inline-flex items-center space-x-1 text-emerald-400 hover:text-emerald-300 font-medium transition"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin Link</span>
                      </>
                    )}
                  </button>
                </div>
                <div
                  id="urlText"
                  className="font-mono text-xs text-emerald-300/90 break-all bg-slate-900/90 p-2 rounded border border-slate-800 select-all"
                >
                  {targetUrl}
                </div>
              </div>

              {/* QR Code Container */}
              <div className="flex flex-col items-center justify-center p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <div id="qrcode" className="bg-white p-3 rounded-lg shadow-lg">
                  <img
                    src={qrImageUrl}
                    alt={`QR Code Lokasi ${pelatihan}`}
                    className="w-44 h-44 object-contain"
                  />
                </div>
                <div className="text-center">
                  <p className="text-xs font-semibold text-white">
                    {pelatihan}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {lemari.replace('-', ' ')} • {rak.replace('-', ' ')}
                  </p>
                </div>
              </div>

              {/* Action Buttons: Print, Download, Test Filter */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex items-center justify-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition"
                  title="Cetak Label QR Code ke Kertas/Stiker"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-300" />
                  <span>Cetak</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadQr}
                  className="flex items-center justify-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition"
                  title="Unduh file gambar QR Code (PNG)"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Unduh</span>
                </button>

                <button
                  type="button"
                  onClick={handleApplyNow}
                  className="flex items-center justify-center space-x-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg shadow transition"
                  title="Terapkan filter ke dashboard boks"
                >
                  <Filter className="w-3.5 h-3.5" />
                  <span>Terapkan</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span>Format URL HashRouter terverifikasi GitHub Pages</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
