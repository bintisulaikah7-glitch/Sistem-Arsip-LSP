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
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
            <tr>
              <th className="py-3 px-4 font-semibold">ID Box</th>
              <th className="py-3 px-4 font-semibold">Nama Pelatihan</th>
              <th className="py-3 px-3 font-semibold text-center">Tahun</th>
              <th className="py-3 px-3 font-semibold text-center">Peserta (K / BK)</th>
              <th className="py-3 px-3 font-semibold">Lokasi (L/R/B)</th>
              <th className="py-3 px-3 font-semibold">Status Arsip</th>
              <th className="py-3 px-3 font-semibold">Status Fisik</th>
              <th className="py-3 px-3 font-semibold">Dokumentasi</th>
              <th className="py-3 px-4 font-semibold text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {boxes.map((box, index) => {
              const pesertaK = Math.max(0, box.jumlah_peserta - box.jumlah_peserta_bk);

              return (
                <tr key={`${box.id_box}-${index}`} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 font-mono font-bold text-emerald-400 whitespace-nowrap">
                    <button
                      onClick={() => onViewDetail && onViewDetail(box)}
                      className="hover:underline text-left"
                      title={onViewDetail ? 'Buka Detail Boks' : box.id_box}
                    >
                      {box.id_box}
                    </button>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-100 max-w-xs truncate">
                    <button
                      onClick={() => onViewDetail && onViewDetail(box)}
                      className="hover:text-emerald-300 transition text-left truncate max-w-xs block"
                      title={box.nama_pelatihan}
                    >
                      {box.nama_pelatihan}
                    </button>
                  </td>
                  <td className="py-3 px-3 text-center text-slate-300 whitespace-nowrap font-mono">
                    {box.tahun_pelaksanaan}
                  </td>
                  <td className="py-3 px-3 text-center whitespace-nowrap">
                    <span className="text-slate-200 font-semibold">{box.jumlah_peserta}</span>
                    <span className="text-[11px] text-slate-500 mx-1">|</span>
                    <span className="text-emerald-400 font-medium">{pesertaK}</span>
                    <span className="text-slate-500 mx-1">/</span>
                    <span className="text-purple-400 font-medium">{box.jumlah_peserta_bk}</span>
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap font-mono text-[11px] text-amber-300">
                    {box.lokasi.lemari > 0
                      ? `Lemari ${box.lokasi.lemari} (R:${box.lokasi.rak}, B:${box.lokasi.baris})`
                      : 'Antrian / Tanpa Lemari'}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium border ${
                        box.status_arsip === 'Tersedia' || box.status_arsip === 'Aktif'
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                          : box.status_arsip === 'Tidak Lengkap' || box.status_arsip === 'Inaktif'
                          ? 'bg-amber-950 text-amber-300 border-amber-800'
                          : 'bg-rose-950 text-rose-300 border-rose-800'
                      }`}
                    >
                      {box.status_arsip}
                    </span>
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium border ${
                        box.status_barang === 'Lengkap'
                          ? 'bg-blue-950 text-blue-300 border-blue-800'
                          : box.status_barang === 'Tidak Lengkap' || box.status_barang === 'Dipinjam'
                          ? 'bg-purple-950 text-purple-300 border-purple-800'
                          : 'bg-orange-950 text-orange-300 border-orange-800'
                      }`}
                    >
                      {box.status_barang}
                    </span>
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <a
                      href={box.link_dokumentasi}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-emerald-400 flex items-center space-x-1 transition"
                      title={box.link_dokumentasi}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Link</span>
                    </a>
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end space-x-1.5">
                      {onViewDetail && (
                        <button
                          onClick={() => onViewDetail(box)}
                          className="px-2 py-0.5 text-[11px] text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition font-medium"
                          title="Buka Detail Modal Boks"
                        >
                          Detail
                        </button>
                      )}
                      <button
                        onClick={() => onShowQr(box)}
                        className="inline-flex items-center space-x-1.5 px-2.5 py-1 text-emerald-300 hover:text-emerald-200 bg-emerald-950/70 hover:bg-emerald-900/90 border border-emerald-700/80 rounded-lg text-xs font-medium transition shadow-sm"
                        title="Cetak / Dapatkan QR Code"
                      >
                        <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Cetak / Dapatkan QR Code</span>
                      </button>
                      <button
                        onClick={() => onViewJson(box)}
                        className="p-1 text-slate-400 hover:text-indigo-400 rounded hover:bg-slate-800 transition font-mono"
                        title="Format JSON"
                      >
                        <FileCode className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onEdit(box)}
                        className="p-1 text-slate-400 hover:text-blue-400 rounded hover:bg-slate-800 transition"
                        title="Edit Data"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDelete(box.id_box)}
                        className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800 transition"
                        title="Hapus Boks"
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
