import React, { useState, useEffect, useMemo } from 'react';
import { X, Save, AlertCircle, Archive, Plus, Sparkles, Send, CheckCircle2 } from 'lucide-react';
import { BoksArsip, StatusArsip, StatusBarang } from '../types.ts';
import { sendBoxToGoogleSheets, getStoredAppsScriptUrl } from '../utils/appsScriptService.ts';

interface BoxFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (boxData: BoksArsip) => Promise<boolean>;
  editingBox?: BoksArsip | null;
  existingBoxes?: BoksArsip[];
  onOpenAppsScriptConfig?: () => void;
}

export const BoxFormModal: React.FC<BoxFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingBox,
  existingBoxes = [],
  onOpenAppsScriptConfig
}) => {
  const [idBox, setIdBox] = useState('');
  const [nomorBox, setNomorBox] = useState('1');
  const [namaPelatihan, setNamaPelatihan] = useState('');
  const [tahunPelaksanaan, setTahunPelaksanaan] = useState(new Date().getFullYear());
  const [jumlahPeserta, setJumlahPeserta] = useState(20);
  const [jumlahPesertaBk, setJumlahPesertaBk] = useState(0);
  
  // Dynamic Lemari states
  const [selectedLemari, setSelectedLemari] = useState<string>('1');
  const [isCustomLemari, setIsCustomLemari] = useState(false);
  const [customLemariName, setCustomLemariName] = useState('');

  // Dynamic Rak states
  const [selectedRak, setSelectedRak] = useState<string>('R1');
  const [isCustomRak, setIsCustomRak] = useState(false);
  const [customRakName, setCustomRakName] = useState('');

  const [baris, setBaris] = useState('B1');
  const [statusArsip, setStatusArsip] = useState<StatusArsip>('Aktif');
  const [statusBarang, setStatusBarang] = useState<StatusBarang>('Lengkap');
  const [hasilUjiKompetensi, setHasilUjiKompetensi] = useState('');
  const [linkDokumentasi, setLinkDokumentasi] = useState('');
  const [autoSyncGoogleSheets, setAutoSyncGoogleSheets] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Derived available dynamic Lemari from existing data (Tanpa Limit)
  const availableLemariList = useMemo(() => {
    const set = new Set<string>();
    // Default base lemari
    ['1', '2', '3', '4'].forEach(l => set.add(l));
    
    // Add all existing lemari from boxes
    existingBoxes.forEach(b => {
      if (b.lokasi?.lemari !== undefined && b.lokasi?.lemari !== null) {
        const str = b.lokasi.lemari.toString().replace(/lemari[-_\s]*/i, '').trim();
        if (str) set.add(str);
      }
    });

    return Array.from(set).sort((a, b) => {
      const numA = parseInt(a, 10);
      const numB = parseInt(b, 10);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.localeCompare(b);
    });
  }, [existingBoxes]);

  // Derived available dynamic Rak from existing data (Tanpa Limit)
  const availableRakList = useMemo(() => {
    const set = new Set<string>();
    ['R1', 'R2', 'R3', 'R4', 'Rak A', 'Rak B', 'Rak C', 'Rak D'].forEach(r => set.add(r));

    existingBoxes.forEach(b => {
      if (b.lokasi?.rak) {
        set.add(b.lokasi.rak.toString().trim());
      }
    });

    return Array.from(set).sort();
  }, [existingBoxes]);

  useEffect(() => {
    if (editingBox) {
      setIdBox(editingBox.id_box);
      setNomorBox(editingBox.nomor_box?.toString() || editingBox.lokasi?.baris?.toString() || '1');
      setNamaPelatihan(editingBox.nama_pelatihan);
      setTahunPelaksanaan(editingBox.tahun_pelaksanaan);
      setJumlahPeserta(editingBox.jumlah_peserta);
      setJumlahPesertaBk(editingBox.jumlah_peserta_bk);

      const lemariVal = editingBox.lokasi?.lemari?.toString().replace(/lemari[-_\s]*/i, '').trim() || '1';
      if (availableLemariList.includes(lemariVal)) {
        setSelectedLemari(lemariVal);
        setIsCustomLemari(false);
      } else {
        setSelectedLemari('__custom__');
        setIsCustomLemari(true);
        setCustomLemariName(lemariVal);
      }

      const rakVal = editingBox.lokasi?.rak?.toString().trim() || 'R1';
      if (availableRakList.includes(rakVal)) {
        setSelectedRak(rakVal);
        setIsCustomRak(false);
      } else {
        setSelectedRak('__custom__');
        setIsCustomRak(true);
        setCustomRakName(rakVal);
      }

      setBaris(editingBox.lokasi?.baris?.toString() || 'B1');
      setStatusArsip(editingBox.status_arsip);
      setStatusBarang(editingBox.status_barang);
      setHasilUjiKompetensi(editingBox.hasilUjiKompetensi || editingBox.hasil_uji_kompetensi || '');
      setLinkDokumentasi(editingBox.link_dokumentasi);
      setErrorMsg('');
    } else {
      // Defaults for new box
      const randomSuffix = Math.floor(100 + Math.random() * 900);
      setIdBox(`BOX-L1-R1-${randomSuffix}`);
      setNomorBox('1');
      setNamaPelatihan('');
      setTahunPelaksanaan(new Date().getFullYear());
      setJumlahPeserta(20);
      setJumlahPesertaBk(0);
      setSelectedLemari('1');
      setIsCustomLemari(false);
      setCustomLemariName('');
      setSelectedRak('R1');
      setIsCustomRak(false);
      setCustomRakName('');
      setBaris('B1');
      setStatusArsip('Aktif');
      setStatusBarang('Lengkap');
      setHasilUjiKompetensi('');
      setLinkDokumentasi('https://drive.google.com/drive/folders/lsp-arsip-dokumen');
      setErrorMsg('');
    }
  }, [editingBox, isOpen, availableLemariList, availableRakList]);

  // Auto update Box ID suggestion when Lemari or Rak changes
  const handleUpdateBoxIdSuggestion = (lemari: string, rak: string, num: string) => {
    if (!editingBox) {
      const cleanL = lemari.replace(/[^a-zA-Z0-9]/g, '');
      const cleanR = rak.replace(/[^a-zA-Z0-9]/g, '');
      const cleanN = num.padStart(2, '0');
      setIdBox(`BOX-L${cleanL}-${cleanR}-${cleanN}`);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Validations
    if (!idBox.trim()) {
      setErrorMsg('1. ID Boks Arsip (id_box) wajib diisi (contoh: BOX-L1-R1-001)');
      return;
    }
    if (!namaPelatihan.trim()) {
      setErrorMsg('2. Judul Skema / Nama Pelatihan wajib diisi');
      return;
    }
    if (!tahunPelaksanaan || tahunPelaksanaan < 1990) {
      setErrorMsg('3. Tahun pelaksanaan wajib diisi dengan tahun yang valid');
      return;
    }
    if (jumlahPeserta < 0) {
      setErrorMsg('4. Total peserta tidak boleh kurang dari 0');
      return;
    }
    if (jumlahPesertaBk < 0) {
      setErrorMsg('5. Peserta Belum Kompeten (BK) tidak boleh kurang dari 0');
      return;
    }
    if (jumlahPesertaBk > jumlahPeserta) {
      setErrorMsg('Peserta Belum Kompeten (BK) tidak boleh melebihi total peserta.');
      return;
    }

    // Resolve dynamic Lemari
    const effectiveLemariStr = isCustomLemari ? customLemariName.trim() : selectedLemari;
    if (!effectiveLemariStr) {
      setErrorMsg('6. Lemari wajib diisi / dipilih');
      return;
    }
    const parsedLemariNum = parseInt(effectiveLemariStr.replace(/\D/g, ''), 10);
    const finalLemari = !isNaN(parsedLemariNum) && parsedLemariNum > 0 ? parsedLemariNum : effectiveLemariStr;

    // Resolve dynamic Rak
    const effectiveRak = isCustomRak ? customRakName.trim() : selectedRak;
    if (!effectiveRak) {
      setErrorMsg('6. Nomor Rak wajib diisi / dipilih');
      return;
    }

    if (!baris.trim()) {
      setErrorMsg('6. Posisi / Baris wajib diisi');
      return;
    }

    const effectiveNomorBox = nomorBox.trim() || '1';
    const effectiveBaris = baris.trim() || 'B1';
    const effectiveLink = linkDokumentasi.trim();

    const newBoxPayload: BoksArsip = {
      id_box: idBox.trim().toUpperCase(),
      nomor_box: effectiveNomorBox,
      nama_pelatihan: namaPelatihan.trim(),
      tahun_pelaksanaan: Number(tahunPelaksanaan) || new Date().getFullYear(),
      jumlah_peserta: Number(jumlahPeserta) || 0,
      jumlah_peserta_bk: Number(jumlahPesertaBk) || 0,
      lokasi: {
        lemari: finalLemari,
        rak: effectiveRak,
        baris: effectiveBaris
      },
      status_arsip: statusArsip,
      status_barang: statusBarang,
      hasilUjiKompetensi: hasilUjiKompetensi.trim() || '-',
      hasil_uji_kompetensi: hasilUjiKompetensi.trim() || '-',
      'Hasil Uji Kompetensi': hasilUjiKompetensi.trim() || '-',
      link_dokumentasi: effectiveLink
    };

    setIsSubmitting(true);

    try {
      // 1. Submit to parent state & server API
      const success = await onSubmit(newBoxPayload);

      // 2. If autoSyncGoogleSheets is checked, push to Google Apps Script Web App
      if (success && autoSyncGoogleSheets) {
        try {
          await sendBoxToGoogleSheets(newBoxPayload, editingBox ? 'update' : 'add');
        } catch (scriptErr) {
          console.warn('Gagal kirim ke Google Apps Script:', scriptErr);
        }
      }

      setIsSubmitting(false);
      if (success) {
        onClose();
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMsg(err.message || 'Gagal menyimpan boks arsip.');
    }
  };

  const hasAppsScriptUrl = !!getStoredAppsScriptUrl();

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-xl overflow-hidden my-auto text-slate-800">
        {/* Header Modal */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-white">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-2xs">
              <Archive className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-900 tracking-tight">
                {editingBox ? 'Perbarui Data Boks Arsip' : 'Tambah Boks Arsip Baru ke Sistem'}
              </h2>
              <p className="text-xs text-slate-500">
                Standardisasi Kearsipan LSP • 12 Kolom Google Sheets Terpadu
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 flex-1 overflow-y-auto space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Banner Status Auto-Sync Google Sheets */}
          <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 flex items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="auto-sync-sheets"
                checked={autoSyncGoogleSheets}
                onChange={(e) => setAutoSyncGoogleSheets(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 bg-white"
              />
              <label htmlFor="auto-sync-sheets" className="text-slate-700 font-medium cursor-pointer">
                Kirim otomatis ke Google Sheets (Google Apps Script API)
              </label>
            </div>
            {onOpenAppsScriptConfig && (
              <button
                type="button"
                onClick={onOpenAppsScriptConfig}
                className="text-[11px] text-blue-600 hover:text-blue-800 underline font-semibold"
              >
                {hasAppsScriptUrl ? 'Ubah URL API' : 'Pasang URL API'}
              </button>
            )}
          </div>

          {/* 1. Judul Skema / Nama Pelatihan */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Judul Skema / Nama Pelatihan <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={namaPelatihan}
              onChange={(e) => setNamaPelatihan(e.target.value)}
              placeholder="Contoh: Pembuatan Pakaian Jadi Dewasa / Junior Web Developer"
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition shadow-2xs"
              required
            />
          </div>

          {/* 2. Nomor Boks & ID Boks Arsip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Nomor Boks Arsip (Index 2 / Kolom C)
              </label>
              <input
                type="text"
                value={nomorBox}
                onChange={(e) => {
                  setNomorBox(e.target.value);
                  handleUpdateBoxIdSuggestion(isCustomLemari ? customLemariName : selectedLemari, isCustomRak ? customRakName : selectedRak, e.target.value);
                }}
                placeholder="1 atau 01"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 font-mono text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition shadow-2xs"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1 flex items-center justify-between">
                <span>ID Boks Arsip (ID_Box) <span className="text-rose-500">*</span></span>
                {!editingBox && (
                  <button
                    type="button"
                    onClick={() => {
                      const rand = Math.floor(100 + Math.random() * 900);
                      const l = (isCustomLemari ? customLemariName : selectedLemari).replace(/\D/g, '') || '1';
                      const r = (isCustomRak ? customRakName : selectedRak).replace(/\s/g, '');
                      setIdBox(`BOX-L${l}-${r}-${rand}`);
                    }}
                    className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" /> Auto
                  </button>
                )}
              </label>
              <input
                type="text"
                value={idBox}
                onChange={(e) => setIdBox(e.target.value.toUpperCase())}
                disabled={!!editingBox}
                placeholder="BOX-L1-R1-001"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 font-mono text-blue-700 font-bold uppercase focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100 transition shadow-2xs"
                required
              />
            </div>
          </div>

          {/* 3. LOKASI FISIK DINAMIS (Lemari & Rak Tanpa Limit) */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Archive className="w-4 h-4 text-blue-600" />
                <span>Lokasi Fisik Lemari &amp; Rak (Dinamis)</span>
              </span>
              <span className="text-[10px] text-slate-500 font-medium">Otomatis bertambah</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* LEMARI DINAMIS */}
              <div>
                <label className="block text-[11px] text-slate-600 font-semibold mb-1">
                  Pilih Lemari:
                </label>
                <select
                  value={selectedLemari}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedLemari(val);
                    if (val === '__custom__') {
                      setIsCustomLemari(true);
                    } else {
                      setIsCustomLemari(false);
                      handleUpdateBoxIdSuggestion(val, isCustomRak ? customRakName : selectedRak, nomorBox);
                    }
                  }}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-2xs"
                >
                  {availableLemariList.map((lemariItem) => (
                    <option key={`lemari-opt-${lemariItem}`} value={lemariItem}>
                      Lemari {lemariItem}
                    </option>
                  ))}
                  <option value="__custom__">+ Tambah Lemari Baru...</option>
                </select>

                {isCustomLemari && (
                  <div className="mt-1.5 animate-in fade-in duration-150">
                    <input
                      type="text"
                      value={customLemariName}
                      onChange={(e) => {
                        setCustomLemariName(e.target.value);
                        handleUpdateBoxIdSuggestion(e.target.value, isCustomRak ? customRakName : selectedRak, nomorBox);
                      }}
                      placeholder="Nama Lemari Baru (misal: 5, 6, Arsip A)"
                      className="w-full bg-white border border-blue-400 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 shadow-2xs"
                      required
                    />
                  </div>
                )}
              </div>

              {/* RAK DINAMIS */}
              <div>
                <label className="block text-[11px] text-slate-600 font-semibold mb-1">
                  Pilih Rak:
                </label>
                <select
                  value={selectedRak}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedRak(val);
                    if (val === '__custom__') {
                      setIsCustomRak(true);
                    } else {
                      setIsCustomRak(false);
                      handleUpdateBoxIdSuggestion(isCustomLemari ? customLemariName : selectedLemari, val, nomorBox);
                    }
                  }}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-2xs"
                >
                  {availableRakList.map((rakItem) => (
                    <option key={`rak-opt-${rakItem}`} value={rakItem}>
                      {rakItem}
                    </option>
                  ))}
                  <option value="__custom__">+ Tambah Rak Baru...</option>
                </select>

                {isCustomRak && (
                  <div className="mt-1.5 animate-in fade-in duration-150">
                    <input
                      type="text"
                      value={customRakName}
                      onChange={(e) => {
                        setCustomRakName(e.target.value);
                        handleUpdateBoxIdSuggestion(isCustomLemari ? customLemariName : selectedLemari, e.target.value, nomorBox);
                      }}
                      placeholder="Nama Rak Baru (misal: R5, Rak E)"
                      className="w-full bg-white border border-blue-400 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 shadow-2xs"
                      required
                    />
                  </div>
                )}
              </div>

              {/* BARIS / POSISI */}
              <div>
                <label className="block text-[11px] text-slate-600 font-semibold mb-1">Baris / Posisi:</label>
                <input
                  type="text"
                  value={baris}
                  onChange={(e) => setBaris(e.target.value)}
                  placeholder="B1 atau Baris 1"
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-mono focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-2xs"
                  required
                />
              </div>
            </div>
          </div>

          {/* 4. Tahun & Peserta Asesmen */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Tahun Pelaksanaan
              </label>
              <input
                type="number"
                value={tahunPelaksanaan}
                onChange={(e) => setTahunPelaksanaan(parseInt(e.target.value, 10))}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-2xs"
                min="1990"
                max="2035"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Total Peserta Asesmen
              </label>
              <input
                type="number"
                value={jumlahPeserta}
                onChange={(e) => setJumlahPeserta(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-2xs"
                min="0"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Peserta BK (Belum Kompeten)
              </label>
              <input
                type="number"
                value={jumlahPesertaBk}
                onChange={(e) => setJumlahPesertaBk(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-purple-700 font-semibold focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 shadow-2xs"
                min="0"
                required
              />
            </div>
          </div>

          {/* 5. Status Arsip & Status Barang */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Status Arsip (Index 8 / Kolom I)
              </label>
              <select
                value={statusArsip}
                onChange={(e) => setStatusArsip(e.target.value as StatusArsip)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-2xs cursor-pointer"
              >
                <option value="Aktif">Aktif</option>
                <option value="Inaktif">Inaktif</option>
                <option value="Dimusnahkan">Dimusnahkan</option>
                <option value="Tersedia">Tersedia</option>
                <option value="Tidak Lengkap">Tidak Lengkap</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Status Barang / Fisik Boks Arsip (Index 9 / Kolom J)
              </label>
              <select
                value={statusBarang}
                onChange={(e) => setStatusBarang(e.target.value as StatusBarang)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-2xs cursor-pointer"
              >
                <option value="Lengkap">Lengkap</option>
                <option value="Dipinjam">Dipinjam</option>
                <option value="Diperbaiki">Diperbaiki</option>
                <option value="Tidak Lengkap">Tidak Lengkap</option>
                <option value="Tidak Ada">Tidak Ada</option>
              </select>
            </div>
          </div>

          {/* 6. Hasil Uji Kompetensi (Index 10 / Kolom K) */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Hasil Uji Kompetensi (Sampel Produk / Hasil Praktik Kerja)
            </label>
            <input
              type="text"
              value={hasilUjiKompetensi}
              onChange={(e) => setHasilUjiKompetensi(e.target.value)}
              placeholder="Contoh: Rompi Putih, PCB Speaker, Boneka Ikan Pink, Kaos Hijau"
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-2xs"
            />
          </div>

          {/* 7. Link Google Drive (Index 11 / Kolom L) */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Link Google Drive Dokumentasi Digital <span className="text-rose-500">*</span>
            </label>
            <input
              type="url"
              value={linkDokumentasi}
              onChange={(e) => setLinkDokumentasi(e.target.value)}
              placeholder="https://drive.google.com/drive/folders/..."
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-2xs"
              required
            />
          </div>

          {/* Tombol Aksi */}
          <div className="pt-3 flex items-center justify-end space-x-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold transition shadow-2xs"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center space-x-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? 'Menyimpan...'
                  : editingBox
                  ? 'Perbarui Boks Arsip'
                  : 'Simpan Boks Arsip'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
