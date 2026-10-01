import Papa from 'papaparse';
import { BoksArsip, StatusArsip, StatusBarang } from '../types.ts';
import { INITIAL_BOXES } from './initialBoxes.ts';

/**
 * URL CSV Export Google Sheets (Boks Berkas Arsip LSP)
 */
export const GOOGLE_SHEETS_CSV_URL =
  'https://docs.google.com/spreadsheets/d/1Cq3QzccIPDSVyXY2dq4S61wHVRJFh0LaP2xT6OViK-M/export?format=csv';

/**
 * Normalisasi string nama header kolom:
 * - Huruf kecil (lowercase)
 * - Menghilangkan spasi berlebih, underscore, tanda minus, dan karakter non-alfanumerik
 * Contoh: "Nomor Rak " -> "nomorrak", "ID_Box" -> "idbox", "Hasil Uji Kompetensi" -> "hasilujikompetensi"
 */
export function normalizeHeader(name: string): string {
  return (name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Mencari index kolom berdasarkan beberapa kemungkinan nama header.
 * Jika tidak ditemukan, mengembalikan fallbackIndex default.
 */
function findColumnIndex(headers: string[], fallbackIndex: number, ...candidates: string[]): number {
  if (!headers || headers.length === 0) return fallbackIndex;
  const normCandidates = candidates.map(normalizeHeader);
  for (let i = 0; i < headers.length; i++) {
    const normH = normalizeHeader(headers[i]);
    if (normCandidates.includes(normH)) {
      return i;
    }
  }
  for (let i = 0; i < headers.length; i++) {
    const normH = normalizeHeader(headers[i]);
    if (normCandidates.some((c) => normH.includes(c))) {
      return i;
    }
  }
  return fallbackIndex;
}

/**
 * Parsing teks CSV Google Sheets menjadi array BoksArsip[]
 * Mematuhi urutan kolom:
 * 1. Index 0 (Kolom A): Kode Lemari
 * 2. Index 1 (Kolom B): Nomor Rak
 * 3. Index 2 (Kolom C): Nomor Box
 * 4. Index 3 (Kolom D): ID_Box
 * 5. Index 4 (Kolom E): Nama Pelatihan
 * 6. Index 5 (Kolom F): Tahun Pelaksanaan
 * 7. Index 6 (Kolom G): Jumlah Peserta
 * 8. Index 7 (Kolom H): Jumlah Peserta BK
 * 9. Index 8 (Kolom I): Status Arsip
 * 10. Index 9 (Kolom J): Status Barang
 * 11. Index 10 (Kolom K): Hasil Uji Kompetensi
 * 12. Index 11 (Kolom L): Link Google Drive
 *
 * KETENTUAN PENTING:
 * Lewati (skip/continue) baris data yang kosong atau bernilai "Kosong" agar siklus pembacaan
 * data tidak terhenti secara prematur dan semua baris data di bawahnya tetap terdeteksi.
 */
export function parseGoogleSheetsCsv(csvText: string): BoksArsip[] {
  if (!csvText || typeof csvText !== 'string') return [];

  const cleanText = csvText.replace(/^\uFEFF/, '').trim();
  if (!cleanText) return [];

  // Proteksi terhadap respons bukan CSV (misal halaman login HTML atau error Google Drive)
  if (
    cleanText.startsWith('<!DOCTYPE') ||
    cleanText.startsWith('<html') ||
    cleanText.includes('<title>Google Drive') ||
    cleanText.includes('docs.google.com/error')
  ) {
    throw new Error('Respons dari server bukan format CSV yang valid.');
  }

  // Parse CSV tanpa mengabaikan baris kosong agar kontrol lewati (skip/continue) berjalan konsisten
  const parsed = Papa.parse<string[]>(cleanText, {
    header: false,
    skipEmptyLines: false
  });

  const rawRows = parsed.data;
  if (!rawRows || rawRows.length === 0) return [];

  // Baris pertama diasumsikan sebagai Header
  const headerRow = rawRows[0] || [];

  // Petakan index kolom secara dinamis dengan fallback ke index urutan standar 0-11
  const idxLemari = findColumnIndex(headerRow, 0, 'Kode Lemari', 'KodeLemari', 'Lemari');
  const idxRak = findColumnIndex(headerRow, 1, 'Nomor Rak', 'NomorRak', 'Rak');
  const idxBox = findColumnIndex(headerRow, 2, 'Nomor Box', 'NomorBox', 'Nomor Baris', 'Box', 'Baris');
  const idxIdBox = findColumnIndex(headerRow, 3, 'ID_Box', 'ID Box', 'ID_Boks', 'IDBoks', 'ID');
  const idxNama = findColumnIndex(headerRow, 4, 'Nama Pelatihan', 'NamaPelatihan', 'Pelatihan', 'Nama Program');
  const idxTahun = findColumnIndex(headerRow, 5, 'Tahun Pelaksanaan', 'TahunPelaksanaan', 'Tahun Pelaksanaa', 'Tahun');
  const idxPeserta = findColumnIndex(headerRow, 6, 'Jumlah Peserta', 'JumlahPeserta', 'Total Peserta', 'Peserta');
  const idxPesertaBk = findColumnIndex(headerRow, 7, 'Jumlah Peserta BK', 'JumlahPesertaBK', 'Peserta BK', 'BK');
  const idxStatusArsip = findColumnIndex(headerRow, 8, 'Status Arsip', 'StatusArsip', 'Arsip');
  const idxStatusBarang = findColumnIndex(headerRow, 9, 'Status Barang', 'StatusBarang', 'Barang');
  const idxHasilUji = findColumnIndex(headerRow, 10, 'Hasil Uji Kompetensi', 'HasilUjiKompetensi', 'Hasil Uji', 'Hasil');
  const idxLinkDrive = findColumnIndex(headerRow, 11, 'Link Google Drive', 'LinkGoogleDrive', 'Google Drive', 'Link', 'Link Dokumentasi');

  const result: BoksArsip[] = [];
  const seenIds = new Set<string>();

  // Mulai iterasi dari baris ke-2 (index 1), melewati header
  for (let i = 1; i < rawRows.length; i++) {
    const row = rawRows[i];

    // 1. Lewati (skip/continue) jika baris null / undefined / array kosong
    if (!row || !Array.isArray(row) || row.length === 0) {
      continue;
    }

    // 2. Periksa apakah baris sepenuhnya kosong atau semua sel bernilai "Kosong"
    const isAllEmptyOrKosong = row.every((cell) => {
      const val = String(cell ?? '').trim().toLowerCase();
      return val === '' || val === 'kosong';
    });

    if (isAllEmptyOrKosong) {
      // Lewati (continue) agar pembacaan tidak berhenti secara prematur
      continue;
    }

    // Ekstrak data berdasarkan index kolom
    const rawKodeLemari = String(row[idxLemari] ?? '').trim();
    const rawNomorRak = String(row[idxRak] ?? '').trim();
    const rawNomorBox = String(row[idxBox] ?? '').trim();
    const rawIdBox = String(row[idxIdBox] ?? '').trim();
    const rawNamaPelatihan = String(row[idxNama] ?? '').trim();
    const rawTahun = String(row[idxTahun] ?? '').trim();
    const rawPeserta = String(row[idxPeserta] ?? '').trim();
    const rawPesertaBk = String(row[idxPesertaBk] ?? '').trim();
    const rawStatusArsip = String(row[idxStatusArsip] ?? '').trim();
    const rawStatusBarang = String(row[idxStatusBarang] ?? '').trim();
    const rawHasilUji = String(row[idxHasilUji] ?? '').trim();
    const rawLinkDrive = String(row[idxLinkDrive] ?? '').trim();

    // 3. Lewati (continue) jika Nama Pelatihan kosong/Kosong DAN ID_Box kosong/Kosong
    const isNamaEmptyOrKosong = !rawNamaPelatihan || rawNamaPelatihan.toLowerCase() === 'kosong';
    const isIdEmptyOrKosong =
      !rawIdBox ||
      rawIdBox.toLowerCase() === 'kosong' ||
      rawIdBox.toLowerCase() === 'kosong - kosong - kosong';

    if (isNamaEmptyOrKosong && isIdEmptyOrKosong) {
      // Baris ini tidak berisi arsip boks maupun nama pelatihan, lanjutkan ke baris berikutnya
      continue;
    }

    // Nama Pelatihan (Index 4 / Kolom E)
    const nama_pelatihan = rawNamaPelatihan || 'Pelatihan Sertifikasi LSP';

    // Tahun Pelaksanaan (Index 5 / Kolom F)
    const tahunMatch = rawTahun.match(/\d{4}/);
    const tahun_pelaksanaan = tahunMatch
      ? parseInt(tahunMatch[0], 10)
      : parseInt(rawTahun.replace(/\D/g, ''), 10) || new Date().getFullYear();

    // Jumlah Peserta (Index 6 / Kolom G)
    const cleanPesertaStr = rawPeserta.includes('/') ? rawPeserta.split('/')[0] : rawPeserta;
    const jumlah_peserta = parseInt(cleanPesertaStr.replace(/\D/g, ''), 10) || 0;

    // Jumlah Peserta BK (Index 7 / Kolom H)
    const cleanPesertaBkStr = rawPesertaBk.includes('/') ? rawPesertaBk.split('/')[0] : rawPesertaBk;
    const jumlah_peserta_bk = parseInt(cleanPesertaBkStr.replace(/\D/g, ''), 10) || 0;

    // Kode Lemari (Index 0 / Kolom A)
    const isLemariKosong = !rawKodeLemari || rawKodeLemari.toLowerCase() === 'kosong';
    const lemariDigits = !isLemariKosong ? rawKodeLemari.match(/\d+/) : null;
    const lemari = lemariDigits ? parseInt(lemariDigits[0], 10) : 0;

    // Nomor Rak (Index 1 / Kolom B)
    const isRakKosong = !rawNomorRak || rawNomorRak.toLowerCase() === 'kosong';
    const rak = isRakKosong ? (lemari > 0 ? 'Rak A' : '-') : rawNomorRak;

    // Nomor Box (Index 2 / Kolom C)
    const isBoxKosong = !rawNomorBox || rawNomorBox.toLowerCase() === 'kosong';
    const baris = isBoxKosong ? (lemari > 0 ? 'Box 1' : '-') : rawNomorBox;

    // Status Arsip (Index 8 / Kolom I)
    let status_arsip: StatusArsip = 'Tersedia';
    if (rawStatusArsip && rawStatusArsip.toLowerCase() !== 'kosong') {
      status_arsip = rawStatusArsip;
    }

    // Status Barang (Index 9 / Kolom J)
    let status_barang: StatusBarang = 'Lengkap';
    if (rawStatusBarang && rawStatusBarang.toLowerCase() !== 'kosong') {
      status_barang = rawStatusBarang;
    }

    // Hasil Uji Kompetensi (Index 10 / Kolom K)
    const hasilUjiKompetensi = rawHasilUji || '-';

    // Link Google Drive (Index 11 / Kolom L)
    const link_dokumentasi =
      rawLinkDrive && rawLinkDrive.toLowerCase() !== 'kosong'
        ? rawLinkDrive
        : 'https://drive.google.com';

    // ID_Box (Index 3 / Kolom D)
    let finalId = rawIdBox;
    const isGenericOrEmpty =
      !finalId ||
      finalId.toLowerCase() === 'kosong - kosong - kosong' ||
      finalId.toLowerCase() === 'kosong' ||
      finalId === '1';

    if (isGenericOrEmpty) {
      finalId =
        lemari > 0
          ? `L${lemari}-R${rak.replace(/\D/g, '') || '1'}-BOX${String(i).padStart(2, '0')}-${tahun_pelaksanaan}`
          : `BOX-${tahun_pelaksanaan}-${String(i).padStart(3, '0')}`;
    }

    // Pastikan ID Boks unik di memori
    let uniqueId = finalId;
    let counter = 2;
    while (seenIds.has(uniqueId.toUpperCase())) {
      uniqueId = `${finalId}-${counter}`;
      counter++;
    }
    seenIds.add(uniqueId.toUpperCase());

    result.push({
      id_box: uniqueId,
      'Kode Boks': uniqueId,
      kode_box: uniqueId,
      id: uniqueId,
      code: uniqueId,
      nama_pelatihan,
      tahun_pelaksanaan,
      jumlah_peserta,
      jumlah_peserta_bk,
      lokasi: {
        lemari,
        rak,
        baris
      },
      status_arsip,
      status_barang,
      hasilUjiKompetensi,
      hasil_uji_kompetensi: hasilUjiKompetensi,
      'Hasil Uji Kompetensi': hasilUjiKompetensi,
      link_dokumentasi
    });
  }

  return result;
}

/**
 * Helper untuk pemetaan baris-baris record objek (kompatibilitas backwards)
 */
export function mapCsvRowsToBoxes(records: Record<string, string>[]): BoksArsip[] {
  if (!records || records.length === 0) return [];
  // Ubah ke format array of arrays agar diproses oleh parseGoogleSheetsCsv
  const headers = Object.keys(records[0] || {});
  const rows = [headers, ...records.map((rec) => headers.map((h) => rec[h] || ''))];
  const csvText = Papa.unparse(rows);
  return parseGoogleSheetsCsv(csvText);
}

/**
 * Fungsi asynchronous utama untuk membaca data boks arsip secara dinamis (real-time)
 * langsung dari URL Google Sheets CSV.
 *
 * Menggunakan INITIAL_BOXES sebagai data cadangan (fallback) jika terjadi
 * kegagalan jaringan atau request fetch mengalami error.
 *
 * @param sheetCsvUrl URL CSV Google Sheets (default: GOOGLE_SHEETS_CSV_URL)
 * @returns Promise<BoksArsip[]> Array objek boks arsip hasil pemetaan
 */
export async function fetchBoxesData(
  sheetCsvUrl: string = GOOGLE_SHEETS_CSV_URL
): Promise<BoksArsip[]> {
  try {
    let csvText = '';

    // 1. Upaya pertama: Fetch langsung dari client ke URL Google Sheets CSV
    try {
      const response = await fetch(sheetCsvUrl, {
        headers: {
          Accept: 'text/csv,text/plain,*/*'
        }
      });

      if (response.ok) {
        const text = await response.text();
        const trimmed = text.trim();
        // Validasi respon bukan berupa halaman HTML login/error Google
        if (
          !trimmed.startsWith('<!DOCTYPE') &&
          !trimmed.startsWith('<html') &&
          !text.includes('<title>Google Drive') &&
          !text.includes('docs.google.com/error')
        ) {
          csvText = text;
        }
      }
    } catch (directErr) {
      console.warn(
        '[fetchBoxesData] Direct fetch ke Google Sheets terhalang CORS, beralih ke proxy server...',
        directErr
      );
    }

    // 2. Upaya kedua: Menggunakan proxy backend internal jika direct fetch terhalang CORS
    if (!csvText) {
      try {
        const proxyUrl = `/api/sheets-proxy?url=${encodeURIComponent(sheetCsvUrl)}`;
        const proxyRes = await fetch(proxyUrl);
        if (proxyRes.ok) {
          const text = await proxyRes.text();
          if (
            !text.startsWith('<!DOCTYPE') &&
            !text.startsWith('<html') &&
            !text.includes('Page not found')
          ) {
            csvText = text;
          }
        }
      } catch (proxyErr) {
        console.warn('[fetchBoxesData] Server proxy Google Sheets juga tidak merespons:', proxyErr);
      }
    }

    // 3. Jika CSV berhasil didapatkan, lakukan parsing dengan urutan kolom spreadsheet
    if (csvText) {
      const mappedBoxes = parseGoogleSheetsCsv(csvText);

      if (mappedBoxes.length > 0) {
        console.log(
          `[fetchBoxesData] Berhasil memuat ${mappedBoxes.length} boks arsip langsung dari Google Sheets CSV.`
        );
        return mappedBoxes;
      }
    }

    // 4. Jika teks CSV kosong atau tidak ada data yang terpetakan, gunakan fallback INITIAL_BOXES
    console.warn(
      '[fetchBoxesData] Data CSV kosong atau format tidak sesuai, menggunakan INITIAL_BOXES sebagai fallback cadangan.'
    );
    return INITIAL_BOXES;
  } catch (error) {
    console.error(
      '[fetchBoxesData] Terjadi error saat memuat data dari Google Sheets, menggunakan data cadangan (INITIAL_BOXES):',
      error
    );
    return INITIAL_BOXES;
  }
}

// Re-export dataset awal sebagai fallback resmi
export { INITIAL_BOXES };
