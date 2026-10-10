import React from 'react';
import { BoksArsip } from '../types.ts';
import { FileCode, QrCode, Edit3, Trash2, ExternalLink } from 'lucide-react';

interface BoxTableViewProps {
  boxes: BoksArsip[];
  onViewJson: (box: BoksArsip) => void;
  onEdit: (box: BoksArsip) => void;
  onDelete: (id_box: string) => void;
  onShowQr: (box: BoksArsip) => void;
  onViewDetail?: (box: BoksArsip) => void;
}

export const BoxTableView: React.FC<BoxTableViewProps> = ({
  boxes,
  onViewJson,
  onEdit,
  onDelete,
  onShowQr,
  onViewDetail
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-800">
          <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
            <tr>
              <th className="py-3.5 px-4 font-bold">ID Boks Arsip</th>
              <th className="py-3.5 px-4 font-bold">Nama Pelatihan</th>
              <th className="py-3.5 px-3 font-bold text-center">Tahun</th>
              <th className="py-3.5 px-3 font-bold text-center">Peserta (K / BK)</th>
              <th className="py-3.5 px-3 font-bold">Lokasi (L/R/B)</th>
              <th className="py-3.5 px-3 font-bold">Status Arsip</th>
              <th className="py-3.5 px-3 font-bold">Status Fisik</th>
              <th className="py-3.5 px-3 font-bold">Hasil Uji</th>
              <th className="py-3.5 px-3 font-bold">Dokumentasi</th>
              <th className="py-3.5 px-4 font-bold text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {boxes.map((box, index) => {
              const pesertaK = Math.max(0, (Number(box.jumlah_peserta) || 0) - (Number(box.jumlah_peserta_bk) || 0));

              const rawLemari = String(box.lokasi?.lemari ?? '').toLowerCase().trim();
              const idBoxLower = String(box.id_box || '').toLowerCase();
              const isBerkasKeluar =
                !rawLemari ||
                rawLemari === '0' ||
                rawLemari === 'kosong' ||
                rawLemari === 'keluar' ||
                rawLemari === '-' ||
                box.lokasi?.lemari === 0 ||
                box.lokasi?.lemari === '0' ||
                idBoxLower.includes('kosong') ||
                String(box.status_arsip || '').toLowerCase().includes('keluar') ||
                String(box.status_arsip || '').toLowerCase() === 'tidak tersedia';

              return (
                <tr key={`${box.id_box}-${index}`} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-blue-700 whitespace-nowrap">
                    <button
                      onClick={() => onViewDetail && onViewDetail(box)}
                      className="hover:underline text-left cursor-pointer"
                      title={onViewDetail ? 'Buka Rincian Boks Arsip' : box.id_box}
                    >
                      {box.id_box}
                    </button>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-900 max-w-xs truncate">
                    <button
                      onClick={() => onViewDetail && onViewDetail(box)}
                      className="hover:text-blue-600 transition text-left truncate max-w-xs block cursor-pointer"
                      title={box.nama_pelatihan}
                    >
                      {box.nama_pelatihan}
                    </button>
                  </td>
                  <td className="py-3 px-3 text-center text-slate-600 whitespace-nowrap font-mono tabular-nums">
                    {box.tahun_pelaksanaan}
                  </td>
                  <td className="py-3 px-3 text-center whitespace-nowrap">
                    <span className="text-slate-900 font-bold tabular-nums">{box.jumlah_peserta}</span>
                    <span className="text-slate-400 mx-1">|</span>
                    <span className="text-emerald-700 font-semibold tabular-nums">{pesertaK}</span>
                    <span className="text-slate-400 mx-1">/</span>
                    <span className="text-purple-700 font-semibold tabular-nums">{box.jumlah_peserta_bk}</span>
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap font-medium text-[11px] text-slate-700">
                    {isBerkasKeluar ? (
                      <span className="text-rose-600 font-semibold">Berada di Luar</span>
                    ) : (typeof box.lokasi.lemari === 'number' ? box.lokasi.lemari > 0 : Boolean(box.lokasi.lemari && box.lokasi.lemari !== '0'))
                      ? `L${box.lokasi.lemari} (R:${box.lokasi.rak}, B:${box.lokasi.baris})`
                      : 'Antrian / Tanpa Lemari'}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    {isBerkasKeluar ? (
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-rose-50 text-rose-700 border-rose-200">
                        Berada di Luar / Berkas Keluar
                      </span>
                    ) : (
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                          box.status_arsip === 'Tersedia' || box.status_arsip === 'Aktif'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : box.status_arsip === 'Tidak Lengkap' || box.status_arsip === 'Inaktif'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {box.status_arsip}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                        box.status_barang === 'Lengkap'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : box.status_barang === 'Tidak Lengkap' || box.status_barang === 'Dipinjam'
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : 'bg-orange-50 text-orange-700 border-orange-200'
                      }`}
                    >
                      {box.status_barang}
                    </span>
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span
                      className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 max-w-[140px] truncate"
                      title={box.hasilUjiKompetensi || box.hasil_uji_kompetensi || '-'}
                    >
                      {box.hasilUjiKompetensi || box.hasil_uji_kompetensi || '-'}
                    </span>
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <a
                      href={box.link_dokumentasi}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-500 hover:text-blue-600 flex items-center space-x-1 transition font-medium"
                      title={box.link_dokumentasi}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Drive</span>
                    </a>
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end space-x-1.5">
                      {onViewDetail && (
                        <button
                          onClick={() => onViewDetail(box)}
                          className="px-2 py-1 text-[11px] text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded font-semibold transition"
                          title="Buka Rincian Boks Arsip"
                        >
                          Detail
                        </button>
                      )}
                      <button
                        onClick={() => onShowQr(box)}
                        className="inline-flex items-center space-x-1 px-2 py-1 text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded text-xs font-semibold transition"
                        title="Cetak QR Code"
                      >
                        <QrCode className="w-3.5 h-3.5 text-blue-600" />
                        <span>QR</span>
                      </button>
                      <button
                        onClick={() => onViewJson(box)}
                        className="p-1 text-slate-400 hover:text-indigo-600 rounded hover:bg-slate-100 transition font-mono"
                        title="Format JSON"
                      >
                        <FileCode className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onEdit(box)}
                        className="p-1 text-slate-400 hover:text-blue-600 rounded hover:bg-blue-50 transition"
                        title="Edit Data"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDelete(box.id_box)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition"
                        title="Hapus Boks Arsip"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
