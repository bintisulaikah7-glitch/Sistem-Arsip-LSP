import React, { useState, useMemo } from 'react';
import { X, QrCode, Copy, Check, Printer, Download, ExternalLink, MapPin, Sparkles, Filter, Archive } from 'lucide-react';
import { BoksArsip } from '../types.ts';
import { getLocationPublicUrl, getLocationQrImageUrl } from '../utils/url.ts';
import { STANDARD_RAKS, standardizeRakName, getNextRak, MAX_BOXES_PER_RAK, MAX_BOXES_PER_LEMARI } from '../utils/csvParser.ts';

interface InputLokasiModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingBoxes?: BoksArsip[];
  availableLemari?: (number | string)[];
  initialLemari?: string;
  initialRak?: string;
  onApplyFilter?: (pelatihan: string, lemari: string, rak: string) => void;
  onSaveNewBox?: (newBox: Partial<BoksArsip>) => void;
}

export const InputLokasiModal: React.FC<InputLokasiModalProps> = ({
  isOpen,
  onClose,
  existingBoxes = [],
  availableLemari,
  initialLemari,
  initialRak,
  onApplyFilter,
  onSaveNewBox
}) => {
  const [pelatihan, setPelatihan] = useState('');
  const [lemari, setLemari] = useState(initialLemari || '1');
  const [isCustomLemari, setIsCustomLemari] = useState(false);
  const [customLemariName, setCustomLemariName] = useState('');
  const [rak, setRak] = useState(initialRak ? standardizeRakName(initialRak) : 'Rak A');
  const [isGenerated, setIsGenerated] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saveToArchiveList, setSaveToArchiveList] = useState(false);
  const [tahun, setTahun] = useState(new Date().getFullYear().toString());

  // Kumpulan opsi lemari dinamis tanpa batas
  const lemariOptions = useMemo(() => {
    const set = new Set<string>();
    ['1', '2', '3', '4'].forEach((l) => set.add(l));

    (availableLemari || []).forEach((l) => {
      const str = String(l).replace(/lemari[-_\s]*/i, '').trim();
      if (str && str !== '0' && str.toLowerCase() !== 'kosong') set.add(str);
    });

    (existingBoxes || []).forEach((b) => {
      const val = b?.lokasi?.lemari ?? (b as any)?.['Kode Lemari'] ?? (b as any)?.kode_lemari;
      if (val !== undefined && val !== null) {
        const str = String(val).replace(/lemari[-_\s]*/i, '').trim();
        if (str && str !== '0' && str.toLowerCase() !== 'kosong') set.add(str);
      }
    });

    return Array.from(set).sort((a, b) => {
      const numA = parseInt(a, 10);
      const numB = parseInt(b, 10);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
    });
  }, [availableLemari, existingBoxes]);

  // Efektif lemari yang dipilih
  const effectiveLemari = isCustomLemari ? (customLemariName.trim() || '1') : lemari;

  // Hitung jumlah boks per lemari (Max 44 Boks)
  const lemariBoxCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    (existingBoxes || []).forEach((b) => {
      const bLemari = String(b.lokasi?.lemari ?? '').replace(/lemari[-_\s]*/i, '').trim();
      if (bLemari && bLemari !== '0' && bLemari.toLowerCase() !== 'kosong') {
        counts[bLemari] = (counts[bLemari] || 0) + 1;
      }
    });
    return counts;
  }, [existingBoxes]);

  // Hitung kapasitas terisi per rak di lemari aktif (Max 11 Boks per Rak)
  const rakBoxCounts = useMemo(() => {
    const counts: Record<string, number> = {
      'Rak A': 0,
      'Rak B': 0,
      'Rak C': 0,
      'Rak D': 0,
    };
    const targetLemariStr = String(effectiveLemari).replace(/lemari[-_\s]*/i, '').trim().toLowerCase();

    (existingBoxes || []).forEach((b) => {
      const bLemari = String(b.lokasi?.lemari ?? '').replace(/lemari[-_\s]*/i, '').trim().toLowerCase();
      if (bLemari === targetLemariStr) {
        const bRak = standardizeRakName(b.lokasi?.rak);
        if (counts[bRak] !== undefined) {
          counts[bRak]++;
        }
      }
    });

    return counts;
  }, [existingBoxes, effectiveLemari]);

  const currentRakNorm = standardizeRakName(rak);
  const currentRakCount = rakBoxCounts[currentRakNorm] || 0;
  const isRakFull = currentRakCount >= MAX_BOXES_PER_RAK;
  const nextRecommendedRak = getNextRak(currentRakNorm);

  // Update lemari/rak if initial values change when opened
  React.useEffect(() => {
    if (initialLemari) {
      const clean = String(initialLemari).replace(/lemari[-_\s]*/i, '').trim();
      setLemari(clean || initialLemari);
      setIsCustomLemari(false);
    }
    if (initialRak) setRak(standardizeRakName(initialRak));
  }, [initialLemari, initialRak, isOpen]);

  // Extract unique training names from dataset for smart autocomplete
  const trainingSuggestions = useMemo(() => {
    const names = Array.from(new Set(existingBoxes.map(b => b.nama_pelatihan).filter(Boolean)));
    return names.slice(0, 8);
  }, [existingBoxes]);

  if (!isOpen) return null;

  const effectiveLemariStr = isCustomLemari ? (customLemariName.trim() || '1') : lemari;
  const numLemariMatch = effectiveLemariStr.match(/^\d+$/);
  const effectiveLemariVal: number | string = numLemariMatch ? parseInt(numLemariMatch[0], 10) : effectiveLemariStr;

  // Generate target URL
  const targetUrl = getLocationPublicUrl(pelatihan, `Lemari ${effectiveLemariStr}`, rak);
  const qrImageUrl = getLocationQrImageUrl(pelatihan, `Lemari ${effectiveLemariStr}`, rak, 260);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pelatihan.trim()) {
      alert('Harap isi nama pelatihan!');
      return;
    }
    if (isCustomLemari && !customLemariName.trim()) {
      alert('Harap masukkan nama/nomor lemari baru!');
      return;
    }
    setIsGenerated(true);

    // If user opts to also save to archive list
    if (saveToArchiveList && onSaveNewBox) {
      const randomSuffix = Math.floor(10 + Math.random() * 90);
      const cleanCode = `L${effectiveLemariStr}-${rak.replace(/[^a-zA-Z0-9]/g, '')}-BOX${randomSuffix}-${tahun}`;

      onSaveNewBox({
        id_box: cleanCode,
        nama_pelatihan: pelatihan.trim(),
        tahun_pelaksanaan: parseInt(tahun, 10) || new Date().getFullYear(),
        jumlah_peserta: 20,
        jumlah_peserta_bk: 0,
        lokasi: {
          lemari: effectiveLemariVal,
          rak: rak.replace('-', ' '),
          baris: 'Box 1'
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
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in duration-200 my-auto text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-white">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-2xs">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-900 tracking-tight">
                Input Lokasi Berkas LSP
              </h2>
              <p className="text-xs text-slate-500">
                Pencatatan lokasi fisik berkas &amp; generator QR Code filter boks arsip
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition p-1.5 rounded-lg hover:bg-slate-100"
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
              <label htmlFor="pelatihan" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Nama Pelatihan: <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                id="pelatihan"
                value={pelatihan}
                onChange={(e) => setPelatihan(e.target.value)}
                placeholder="Contoh: Data Analyst"
                className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition shadow-2xs"
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
                      className="text-[11px] px-2.5 py-1 rounded-md bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 transition font-medium"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Grid Lemari & Rak */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Pilih Lemari (Dinamis Tanpa Batas) */}
              <div className="space-y-1.5">
                <label htmlFor="lemari" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Pilih Lemari:
                </label>
                <select
                  id="lemari"
                  value={isCustomLemari ? '__custom__' : lemari}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '__custom__') {
                      setIsCustomLemari(true);
                    } else {
                      setIsCustomLemari(false);
                      setLemari(val);
                    }
                  }}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition shadow-2xs"
                >
                  {lemariOptions.map((opt) => {
                    const count = lemariBoxCounts[opt] || 0;
                    return (
                      <option key={opt} value={opt}>
                        Lemari {opt} ({count}/{MAX_BOXES_PER_LEMARI} Boks){count >= MAX_BOXES_PER_LEMARI ? ' - PENUH' : ''}
                      </option>
                    );
                  })}
                  <option value="__custom__">+ Input Lemari Baru...</option>
                </select>

                {isCustomLemari && (
                  <div className="mt-2 animate-in fade-in duration-150">
                    <input
                      type="text"
                      value={customLemariName}
                      onChange={(e) => setCustomLemariName(e.target.value)}
                      placeholder="Ketik nomor/nama lemari baru (contoh: 5 atau Khusus)..."
                      className="w-full bg-white border border-blue-400 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200 shadow-2xs"
                      autoFocus
                    />
                  </div>
                )}
              </div>

              {/* Pilih Rak (Standar Rak A - Rak D, Maks 11 Boks) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="rak" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Pilih Rak:
                  </label>
                  <span className={`text-[11px] font-semibold ${isRakFull ? 'text-amber-600' : 'text-slate-500'}`}>
                    {currentRakCount}/{MAX_BOXES_PER_RAK} Boks
                  </span>
                </div>
                <select
                  id="rak"
                  value={currentRakNorm}
                  onChange={(e) => setRak(standardizeRakName(e.target.value))}
                  className={`w-full bg-white border rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 transition shadow-2xs ${
                    isRakFull
                      ? 'border-amber-400 focus:border-amber-500 focus:ring-amber-100 bg-amber-50/30'
                      : 'border-slate-300 focus:border-blue-500 focus:ring-blue-100'
                  }`}
                >
                  {STANDARD_RAKS.map((r) => {
                    const count = rakBoxCounts[r] || 0;
                    return (
                      <option key={r} value={r}>
                        {r} ({count}/{MAX_BOXES_PER_RAK} Boks){count >= MAX_BOXES_PER_RAK ? ' - PENUH' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Peringatan Kapasitas Fisik Rak Penuh (11/11 Boks) */}
            {isRakFull && (
              <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 animate-in fade-in duration-200">
                <div className="space-y-0.5">
                  <p className="font-bold flex items-center gap-1.5">
                    <span>⚠️ Peringatan: {currentRakNorm} Sudah Penuh ({currentRakCount}/{MAX_BOXES_PER_RAK} Boks)</span>
                  </p>
                  <p className="text-amber-800 text-[11px]">
                    Kapasitas fisik maksimal tercapai. Jika suatu pelatihan memiliki 2 boks file, boks ke-2 dapat dialokasikan ke rak berikutnya ({nextRecommendedRak}).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setRak(nextRecommendedRak)}
                  className="self-start sm:self-auto shrink-0 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs shadow-xs transition active:scale-95"
                >
                  Pindahkan ke {nextRecommendedRak} &rarr;
                </button>
              </div>
            )}

            {/* Opsi Tambahkan ke Database Boks */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
              <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={saveToArchiveList}
                  onChange={(e) => setSaveToArchiveList(e.target.checked)}
                  className="rounded bg-white border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span className="font-semibold">Daftarkan juga sebagai boks arsip baru ke daftar arsip</span>
              </label>

              {saveToArchiveList && (
                <div className="pt-1 flex items-center space-x-2">
                  <span className="text-xs text-slate-600">Tahun Pelaksanaan:</span>
                  <input
                    type="number"
                    value={tahun}
                    onChange={(e) => setTahun(e.target.value)}
                    className="w-24 bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              )}
            </div>

            {/* Tombol Simpan & Generate */}
            <button
              type="submit"
              className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-xs transition active:scale-[0.99]"
            >
              <QrCode className="w-4 h-4" />
              <span>Simpan &amp; Generate QR Code</span>
            </button>
          </form>

          {/* Section Hasil Filter / QR Code */}
          {isGenerated && (
            <div id="result" className="pt-4 border-t border-slate-200 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>Hasil Filter / QR Code:</span>
                </h3>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Aktif &amp; Siap Discan
                </span>
              </div>

              {/* URL Target Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span className="font-semibold">URL Target:</span>
                  <button
                    onClick={handleCopyUrl}
                    className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 font-semibold transition"
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
                  className="font-mono text-xs text-blue-700 break-all bg-white p-2.5 rounded-lg border border-slate-200 select-all font-medium"
                >
                  {targetUrl}
                </div>
              </div>

              {/* QR Code Container */}
              <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div id="qrcode" className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                  <img
                    src={qrImageUrl}
                    alt={`QR Code Lokasi ${pelatihan}`}
                    className="w-44 h-44 object-contain"
                  />
                </div>
                <div className="text-center">
                  <p className="text-xs font-bold text-slate-900">
                    {pelatihan}
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {lemari.replace('-', ' ')} • {rak.replace('-', ' ')}
                  </p>
                </div>
              </div>

              {/* Action Buttons: Print, Download, Test Filter */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex items-center justify-center space-x-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 transition shadow-2xs"
                  title="Cetak Label QR Code ke Kertas/Stiker"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-500" />
                  <span>Cetak</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadQr}
                  className="flex items-center justify-center space-x-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 transition shadow-2xs"
                  title="Unduh file gambar QR Code (PNG)"
                >
                  <Download className="w-3.5 h-3.5 text-blue-600" />
                  <span>Unduh</span>
                </button>

                <button
                  type="button"
                  onClick={handleApplyNow}
                  className="flex items-center justify-center space-x-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition"
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
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>Format URL HashRouter terverifikasi GitHub Pages</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-semibold border border-slate-300 rounded-lg text-xs transition shadow-2xs"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
