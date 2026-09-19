export interface LokasiBoks {
  lemari: number; // 0: Antrian/Tanpa Lemari, 1, 2, 3, 4, dst.
  rak: string | number;
  baris: string | number;
}

export type StatusArsip = 'Tersedia' | 'Tidak Tersedia' | 'Tidak Lengkap' | 'Aktif' | 'Inaktif' | 'Dimusnahkan' | string;
export type StatusBarang = 'Lengkap' | 'Tidak Lengkap' | 'Tidak Ada' | 'Dipinjam' | 'Diperbaiki' | string;

export interface BoksArsip {
  id_box: string;
  nama_pelatihan: string;
  tahun_pelaksanaan: number;
  jumlah_peserta: number;
  jumlah_peserta_bk: number;
  lokasi: LokasiBoks;
  status_arsip: StatusArsip;
  status_barang: StatusBarang;
  link_dokumentasi: string;
  // Optional aliases for flexible URL parameter matching
  'Kode Boks'?: string;
  'kode_box'?: string;
  'id'?: string;
  code?: string;
  [key: string]: any;
}

export interface ApiErrorResponse {
  status: 404 | 400 | 500;
  error: string;
  message: string;
  timestamp?: string;
}

export interface ApiSuccessResponse<T> {
  status: 200 | 201;
  data: T;
  total?: number;
  message?: string;
}
