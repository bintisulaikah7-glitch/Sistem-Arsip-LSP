import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Archive } from 'lucide-react';
import { BoksArsip, StatusArsip, StatusBarang } from '../types.ts';

interface BoxFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (boxData: BoksArsip) => Promise<boolean>;
  editingBox?: BoksArsip | null;
}

export const BoxFormModal: React.FC<BoxFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingBox
}) => {
  const [idBox, setIdBox] = useState('');
  const [namaPelatihan, setNamaPelatihan] = useState('');
  const [tahunPelaksanaan, setTahunPelaksanaan] = useState(new Date().getFullYear());
  const [jumlahPeserta, setJumlahPeserta] = useState(20);
  const [jumlahPesertaBk, setJumlahPesertaBk] = useState(0);
  const [lemari, setLemari] = useState<number>(1);
  const [rak, setRak] = useState('R1');
  const [baris, setBaris] = useState('B1');
  const [statusArsip, setStatusArsip] = useState<StatusArsip>('Aktif');
  const [statusBarang, setStatusBarang] = useState<StatusBarang>('Lengkap');
  const [linkDokumentasi, setLinkDokumentasi] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingBox) {
      setIdBox(editingBox.id_box);
      setNamaPelatihan(editingBox.nama_pelatihan);
      setTahunPelaksanaan(editingBox.tahun_pelaksanaan);
      setJumlahPeserta(editingBox.jumlah_peserta);
      setJumlahPesertaBk(editingBox.jumlah_peserta_bk);
      setLemari(editingBox.lokasi.lemari);
      setRak(editingBox.lokasi.rak.toString());
      setBaris(editingBox.lokasi.baris.toString());
      setStatusArsip(editingBox.status_arsip);
      setStatusBarang(editingBox.status_barang);
      setLinkDokumentasi(editingBox.link_dokumentasi);
      setErrorMsg('');
    } else {
      // Defaults for new box
      setIdBox(`BOX-L1-R1-${Math.floor(100 + Math.random() * 900)}`);
      setNamaPelatihan('');
      setTahunPelaksanaan(new Date().getFullYear());
      setJumlahPeserta(25);
      setJumlahPesertaBk(2);
      setLemari(1);
      setRak('R1');
      setBaris('B1');
      setStatusArsip('Aktif');
      setStatusBarang('Lengkap');
      setLinkDokumentasi('https://drive.google.com/drive/folders/lsp-arsip-dokumen');
      setErrorMsg('');
    }
  }, [editingBox, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Validations
    if (!idBox.trim()) {
      setErrorMsg('1. id_box wajib diisi (contoh: BOX-L1-R1-001)');
      return;
    }
    if (!namaPelatihan.trim()) {
      setErrorMsg('2. nama_pelatihan wajib diisi');
      return;
    }
    if (!tahunPelaksanaan || tahunPelaksanaan < 2000) {
      setErrorMsg('3. tahun_pelaksanaan wajib diisi dengan tahun valid');
      return;
    }
    if (jumlahPeserta < 0) {
      setErrorMsg('4. jumlah_peserta tidak boleh kurang dari 0');
      return;
    }
    if (jumlahPesertaBk < 0) {
      setErrorMsg('5. jumlah_peserta_bk tidak boleh kurang dari 0');
      return;
    }
    if (jumlahPesertaBk > jumlahPeserta) {
      setErrorMsg('Peserta Belum Kompeten (BK) tidak boleh melebihi total peserta.');
      return;
    }
    if (![1, 2, 3, 4].includes(Number(lemari))) {
      setErrorMsg('6. lokasi: Lemari harus bernilai antara 1 sampai 4');
      return;
    }
    if (!rak.trim() || !baris.trim()) {
      setErrorMsg('6. lokasi: Rak dan Baris wajib diisi');
      return;
    }
    if (!linkDokumentasi.trim()) {
      setErrorMsg('9. link_dokumentasi wajib diisi berupa URL valid');
      return;
    }

    const newBoxPayload: BoksArsip = {
      id_box: idBox.trim().toUpperCase(),
      nama_pelatihan: namaPelatihan.trim(),
      tahun_pelaksanaan: Number(tahunPelaksanaan),
      jumlah_peserta: Number(jumlahPeserta),
      jumlah_peserta_bk: Number(jumlahPesertaBk),
      lokasi: {
        lemari: Number(lemari),
        rak: rak.trim(),
        baris: baris.trim()
      },
      status_arsip: statusArsip,
      status_barang: statusBarang,
      link_dokumentasi: linkDokumentasi.trim()
    };

    setIsSubmitting(true);
    const success = await onSubmit(newBoxPayload);
    setIsSubmitting(false);

    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in duration-200">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center space-x-2">
            <Archive className="w-4 h-4 text-emerald-400" />
            <h2 className="font-semibold text-sm text-slate-100">
              {editingBox ? 'Perbarui Data Boks Arsip' : 'Tambah Boks File Baru (9 Atribut Wajib)'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition p-1 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 flex-1 overflow-auto space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-900/80 text-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. id_box & 3. tahun_pelaksanaan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                1. ID Box (Wajib)
              </label>
              <input
                type="text"
                value={idBox}
                onChange={(e) => setIdBox(e.target.value.toUpperCase())}
                disabled={!!editingBox}
                placeholder="BOX-L1-R1-001"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-emerald-400 uppercase focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-60"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                3. Tahun Pelaksanaan
              </label>
              <input
                type="number"
                value={tahunPelaksanaan}
                onChange={(e) => setTahunPelaksanaan(parseInt(e.target.value, 10))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                min="2000"
                max="2035"
                required
              />
            </div>
          </div>

          {/* 2. nama_pelatihan */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              2. Nama Pelatihan & Sertifikasi
            </label>
            <input
              type="text"
              value={namaPelatihan}
              onChange={(e) => setNamaPelatihan(e.target.value)}
              placeholder="Contoh: Pelatihan & Sertifikasi Junior Web Developer BNSP"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              required
            />
          </div>

          {/* 4 & 5. jumlah_peserta & jumlah_peserta_bk */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                4. Total Peserta
              </label>
              <input
                type="number"
                value={jumlahPeserta}
                onChange={(e) => setJumlahPeserta(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                min="0"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                5. Peserta BK (Belum Kompeten)
              </label>
              <input
                type="number"
                value={jumlahPesertaBk}
                onChange={(e) => setJumlahPesertaBk(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-500"
                min="0"
                required
              />
            </div>
          </div>

          {/* 6. lokasi (lemari 1-4, rak, baris) */}
          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg space-y-2">
            <span className="block text-xs font-semibold text-amber-400">
              6. Lokasi Boks Fisik (Object Lokasi)
            </span>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Lemari (1-4)</label>
                <select
                  value={lemari}
                  onChange={(e) => setLemari(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-400"
                >
                  <option value={1}>Lemari 1</option>
                  <option value={2}>Lemari 2</option>
                  <option value={3}>Lemari 3</option>
                  <option value={4}>Lemari 4</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Rak</label>
                <input
                  type="text"
                  value={rak}
                  onChange={(e) => setRak(e.target.value)}
                  placeholder="R1"
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-amber-400"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Baris</label>
                <input
                  type="text"
                  value={baris}
                  onChange={(e) => setBaris(e.target.value)}
                  placeholder="B1"
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-amber-400"
                  required
                />
              </div>
            </div>
          </div>

          {/* 7 & 8. Status Arsip & Status Barang */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                7. Status Arsip
              </label>
              <select
                value={statusArsip}
                onChange={(e) => setStatusArsip(e.target.value as StatusArsip)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="Aktif">Aktif</option>
                <option value="Inaktif">Inaktif</option>
                <option value="Dimusnahkan">Dimusnahkan</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                8. Status Barang (Fisik Boks)
              </label>
              <select
                value={statusBarang}
                onChange={(e) => setStatusBarang(e.target.value as StatusBarang)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="Lengkap">Lengkap</option>
                <option value="Dipinjam">Dipinjam</option>
                <option value="Diperbaiki">Diperbaiki</option>
              </select>
            </div>
          </div>

          {/* 9. link_dokumentasi */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              9. Link Dokumentasi (URL)
            </label>
            <input
              type="url"
              value={linkDokumentasi}
              onChange={(e) => setLinkDokumentasi(e.target.value)}
              placeholder="https://drive.google.com/..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              required
            />
          </div>

          <div className="pt-2 flex justify-end space-x-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Menyimpan...' : editingBox ? 'Perbarui Data' : 'Simpan Boks'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
