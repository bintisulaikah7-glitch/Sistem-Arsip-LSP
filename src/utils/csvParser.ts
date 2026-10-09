import Papa from 'papaparse';
import { BoksArsip, StatusArsip, StatusBarang } from '../types.ts';
import { GOOGLE_SHEETS_SPREADSHEET_URL, GOOGLE_SHEETS_CSV_URL } from '../config.ts';

export { GOOGLE_SHEETS_SPREADSHEET_URL, GOOGLE_SHEETS_CSV_URL };

/**
 * Batasan kapasitas fisik rak & lemari sesuai spesifikasi LSP
 */
export const MAX_BOXES_PER_RAK = 11;
export const MAX_BOXES_PER_LEMARI = 44;
export const STANDARD_RAKS: ('Rak A' | 'Rak B' | 'Rak C' | 'Rak D')[] = ['Rak A', 'Rak B', 'Rak C', 'Rak D'];

/**
 * Standarisasi penamaan rak hanya ke 'Rak A', 'Rak B', 'Rak C', dan 'Rak D'
 * Menghapus/mengonversi pemetaan angka lama (1 -> A, 2 -> B, dst)
 */
export function standardizeRakName(rawRak: any): 'Rak A' | 'Rak B' | 'Rak C' | 'Rak D' {
  if (!rawRak) return 'Rak A';
  const clean = String(rawRak).trim();

  // Cek huruf eksplisit A, B, C, D (case-insensitive)
  if (/\b[aA]\b|rak\s*[-_]?\s*[aA]|r[aA]\b|[aA]$/i.test(clean)) return 'Rak A';
  if (/\b[bB]\b|rak\s*[-_]?\s*[bB]|r[bB]\b|[bB]$/i.test(clean)) return 'Rak B';
  if (/\b[cC]\b|rak\s*[-_]?\s*[cC]|r[cC]\b|[cC]$/i.test(clean)) return 'Rak C';
  if (/\b[dD]\b|rak\s*[-_]?\s*[dD]|r[dD]\b|[dD]$/i.test(clean)) return 'Rak D';

  // Pemetaan angka lama (1 -> A, 2 -> B, 3 -> C, 4 -> D)
  if (/\b1\b|rak\s*[-_]?\s*1|r1\b/i.test(clean)) return 'Rak A';
  if (/\b2\b|rak\s*[-_]?\s*2|r2\b/i.test(clean)) return 'Rak B';
  if (/\b3\b|rak\s*[-_]?\s*3|r3\b/i.test(clean)) return 'Rak C';
  if (/\b4\b|rak\s*[-_]?\s*4|r4\b/i.test(clean)) return 'Rak D';

  return 'Rak A';
}

/**
 * Dapatkan rekomendasi rak berikutnya jika kapasitas rak saat ini sudah penuh 11 boks
 */
export function getNextRak(currentRak: string): 'Rak A' | 'Rak B' | 'Rak C' | 'Rak D' {
  const norm = standardizeRakName(currentRak);
  switch (norm) {
    case 'Rak A': return 'Rak B';
    case 'Rak B': return 'Rak C';
    case 'Rak C': return 'Rak D';
    case 'Rak D': return 'Rak A';
    default: return 'Rak B';
  }
}

/**
 * Converts any Google Sheets URL (e.g. /edit?usp=sharing, /view) to its direct CSV export link
 */
export function convertGoogleSheetsUrlToCsv(inputUrl: string): string {
  if (!inputUrl) return GOOGLE_SHEETS_CSV_URL;
  const trimmed = inputUrl.trim();
  if (trimmed.includes('/export?format=csv')) {
    return trimmed;
  }
  const match = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    const sheetId = match[1];
    const gidMatch = trimmed.match(/[?&#]gid=([0-9]+)/);
    const gidParam = gidMatch ? `&gid=${gidMatch[1]}` : '&gid=0';
    return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv${gidParam}`;
  }
  return trimmed;
}

/**
 * Parse raw CSV string into array of records with header mapping using PapaParse.
 * Handles quoted cells, commas inside text, unescaped quotes, and multi-line values.
 */
export function parseCSV(rawText: string): Record<string, string>[] {
  if (!rawText || typeof rawText !== 'string') return [];

  // Remove potential UTF-8 BOM
  let text = rawText.replace(/^\uFEFF/, '').trim();
  if (!text) return [];

  // If text starts with HTML or DOCTYPE, it is an error page or login wall rather than CSV
  if (
    text.startsWith('<!DOCTYPE') ||
    text.startsWith('<html') ||
    text.includes('<title>Google Drive') ||
    text.includes('Page not found') ||
    text.includes('docs.google.com/error')
  ) {
    throw new Error('Respons bukan file CSV yang valid (mungkin izin file Google Sheets belum disetel publik).');
  }

  // Parse using PapaParse
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (header: string) => header.trim(),
    transform: (value: string) => value.trim()
  });

  if (parsed.errors && parsed.errors.length > 0) {
    console.warn('PapaParse warnings/errors:', parsed.errors);
  }

  const validRows = (parsed.data || []).filter((row) => {
    // Check if row has at least one non-empty value
    return Object.values(row).some((val) => val !== undefined && val !== null && String(val).trim() !== '');
  });

  return validRows;
}

/**
 * Normalizes a field header key for comparison.
 */
function normalizeKey(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Retrieves a value from a record using flexible key matching.
 */
function getRecordValue(record: Record<string, string>, ...candidateKeys: string[]): string {
  const normRecordKeys = Object.keys(record).map((k) => ({
    original: k,
    normalized: normalizeKey(k)
  }));

  for (const candidate of candidateKeys) {
    const normCandidate = normalizeKey(candidate);
    // 1. Exact normalized match
    const exact = normRecordKeys.find((item) => item.normalized === normCandidate);
    if (exact && record[exact.original] !== undefined && record[exact.original] !== '') {
      return record[exact.original];
    }
  }

  for (const candidate of candidateKeys) {
    const normCandidate = normalizeKey(candidate);
    // 2. Partial match
    const partial = normRecordKeys.find((item) => item.normalized.includes(normCandidate));
    if (partial && record[partial.original] !== undefined && record[partial.original] !== '') {
      return record[partial.original];
    }
  }

  return '';
}

/**
 * Maps parsed CSV records to BoksArsip objects according to the required 9 fields:
 * 1. ID_Boks -> id_box
 * 2. Nama Pelatihan -> nama_pelatihan
 * 3. Tahun Pelaksanaa -> tahun_pelaksanaan
 * 4. Jumlah Peserta -> jumlah_peserta
 * 5. Jumlah Peserta BK -> jumlah_peserta_bk
 * 6. Kode Lemari -> lokasi.lemari (ambil angkanya saja)
 * 7. Nomor Rak -> lokasi.rak
 * 8. Nomor Baris -> lokasi.baris
 * 9. Status Arsip -> status_arsip
 * 10. Status Barang -> status_barang
 * 11. Link Google Drive -> link_dokumentasi
 */
export function mapCsvRecordsToBoxes(records: Record<string, string>[]): BoksArsip[] {
  const result: BoksArsip[] = [];

  records.forEach((rec, idx) => {
    // 1. ID_Boks -> id_box
    const id_box = getRecordValue(rec, 'ID_Boks', 'ID Boks', 'IDBoks', 'id_box', 'idbox', 'id');

    // 2. Nama Pelatihan -> nama_pelatihan
    const nama_pelatihan = getRecordValue(
      rec,
      'Nama Pelatihan',
      'NamaPelatihan',
      'nama_pelatihan',
      'pelatihan',
      'nama program'
    );

    // If both ID and Nama Pelatihan are missing, this is likely empty or comment row
    if (!id_box && !nama_pelatihan) {
      return;
    }

    // 3. Tahun Pelaksanaa -> tahun_pelaksanaan
    const rawTahun = getRecordValue(
      rec,
      'Tahun Pelaksanaa',
      'Tahun Pelaksanaan',
      'TahunPelaksanaa',
      'TahunPelaksanaan',
      'tahun_pelaksanaan',
      'tahun'
    );
    const tahunMatch = rawTahun.match(/\d{4}/);
    const tahun_pelaksanaan = tahunMatch
      ? parseInt(tahunMatch[0], 10)
      : parseInt(rawTahun.replace(/\D/g, ''), 10) || new Date().getFullYear();

    // 4. Jumlah Peserta -> jumlah_peserta
    const rawPeserta = getRecordValue(
      rec,
      'Jumlah Peserta',
      'JumlahPeserta',
      'jumlah_peserta',
      'total peserta',
      'peserta'
    ).trim();
    // Handle formats like "49/50" or numbers
    const cleanPesertaStr = rawPeserta.includes('/') ? rawPeserta.split('/')[0] : rawPeserta;
    const jumlah_peserta = parseInt(cleanPesertaStr.replace(/\D/g, ''), 10) || 0;

    // 5. Jumlah Peserta BK -> jumlah_peserta_bk
    const rawPesertaBk = getRecordValue(
      rec,
      'Jumlah Peserta BK',
      'JumlahPesertaBK',
      'jumlah_peserta_bk',
      'peserta bk',
      'bk'
    ).trim();
    const jumlah_peserta_bk = parseInt(rawPesertaBk.replace(/\D/g, ''), 10) || 0;

    // 6. Kode Lemari -> lokasi.lemari (dinamis; jika 'kosong'/'keluar'/- jangan dimasukkan ke Lemari 1)
    const rawLemari = getRecordValue(
      rec,
      'Kode Lemari',
      'KodeLemari',
      'kode_lemari',
      'lemari',
      'lemari nomor'
    ).trim();

    const isLemariKosong =
      !rawLemari ||
      rawLemari.toLowerCase() === 'kosong' ||
      rawLemari.toLowerCase() === 'keluar' ||
      rawLemari === '-' ||
      rawLemari === '0';

    let lemari: number | string = 0;
    if (!isLemariKosong) {
      const lemariDigits = rawLemari.match(/\d+/);
      if (lemariDigits) {
        lemari = parseInt(lemariDigits[0], 10);
      } else {
        const cleanLemari = rawLemari.replace(/lemari[-_\s]*/i, '').trim();
        lemari = cleanLemari || rawLemari;
      }
    }

    // 7. Nomor Rak -> lokasi.rak (standar Rak A, Rak B, Rak C, Rak D)
    const rawRak = getRecordValue(
      rec,
      'Nomor Rak',
      'NomorRak',
      'nomor_rak',
      'rak',
      'no rak'
    ).trim();
    const rak = isLemariKosong ? '-' : standardizeRakName(rawRak);

    // 8. Nomor Baris -> lokasi.baris
    const rawBaris = getRecordValue(
      rec,
      'Nomor Baris',
      'NomorBaris',
      'nomor_baris',
      'baris',
      'no baris'
    ).trim();
    const baris = rawBaris || '-';

    // 9. Status Arsip -> status_arsip (jika lemari kosong/keluar, kategorikan Tidak Tersedia)
    const rawStatusArsip = getRecordValue(
      rec,
      'Status Arsip',
      'StatusArsip',
      'status_arsip',
      'arsip'
    ).trim();

    let status_arsip: StatusArsip = isLemariKosong ? 'Tidak Tersedia' : 'Tersedia';
    if (rawStatusArsip) {
      if (rawStatusArsip.toLowerCase() === 'kosong' || rawStatusArsip.toLowerCase() === 'keluar') {
        status_arsip = 'Tidak Tersedia';
      } else {
        status_arsip = rawStatusArsip;
      }
    }

    // 10. Status Barang -> status_barang
    const rawStatusBarang = getRecordValue(
      rec,
      'Status Barang',
      'StatusBarang',
      'status_barang',
      'barang'
    ).trim();

    let status_barang: StatusBarang = 'Lengkap';
    if (rawStatusBarang) {
      status_barang = rawStatusBarang;
    }

    // 11. Hasil Uji Kompetensi -> hasilUjiKompetensi
    const rawHasilUji = getRecordValue(
      rec,
      'Hasil Uji Kompetensi',
      'HasilUjiKompetensi',
      'Hasil Uji',
      'hasil_uji_kompetensi',
      'hasil'
    ).trim();
    const hasilUjiKompetensi = rawHasilUji || '-';

    // 12. Link Google Drive -> link_dokumentasi
    const rawLink = getRecordValue(
      rec,
      'Link Google Drive',
      'LinkGoogleDrive',
      'link_google_drive',
      'link google',
      'google drive',
      'drive',
      'link dokumentasi',
      'link'
    ).trim();
    const link_dokumentasi = rawLink || 'https://drive.google.com';

    // Generate clean ID if missing
    const hasLemari = typeof lemari === 'number' ? lemari > 0 : Boolean(lemari && lemari !== '0');
    const computedId = id_box
      ? id_box
      : hasLemari
      ? `BOX-L${lemari}-${rak.replace(/\s+/g, '')}-${String(idx + 1).padStart(3, '0')}`
      : `BOX-${tahun_pelaksanaan}-${String(idx + 1).padStart(3, '0')}`;

    result.push({
      id_box: computedId,
      'Kode Boks': computedId,
      kode_box: computedId,
      id: computedId,
      code: computedId,
      nama_pelatihan: nama_pelatihan || 'Pelatihan Sertifikasi LSP',
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
  });

  // Deduplicate records based on id_box before returning
  return deduplicateBoxes(result);
}

/**
 * Deduplicates an array of boxes based on id_box.
 * Guarantees that each id_box appears at most once, preventing duplicate cards on screen
 * and React duplicate key warnings.
 */
export function deduplicateBoxes(boxes: BoksArsip[]): BoksArsip[] {
  if (!Array.isArray(boxes)) return [];
  const seenIds = new Set<string>();
  const uniqueBoxes: BoksArsip[] = [];

  for (const box of boxes) {
    const rawId = (box.id_box || '').trim().toUpperCase();
    if (!rawId) {
      uniqueBoxes.push(box);
      continue;
    }
    if (!seenIds.has(rawId)) {
      seenIds.add(rawId);
      uniqueBoxes.push(box);
    }
  }

  return uniqueBoxes;
}

/**
 * Pencarian fleksibel (case-insensitive & partial match):
 * Mencari sebagian kata pada Nama Pelatihan, ID Boks, Tahun Pelaksanaan,
 * Nama Lemari, Nomor Rak, Nomor Baris/Box, Status Arsip/Barang, maupun Hasil Uji.
 */
export function matchBoxSearch(box: BoksArsip, searchQuery: string): boolean {
  if (!box) return false;
  const q = String(searchQuery || '').toLowerCase().trim();
  if (!q) return true;

  // Pisahkan query menjadi token kata untuk pencarian parsial fleksibel
  const tokens = q.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;

  const nama = String(box.nama_pelatihan || '').toLowerCase();
  const idBox = String(box.id_box || box['Kode Boks'] || box.id || '').toLowerCase();
  const tahun = String(box.tahun_pelaksanaan ?? '').toLowerCase();
  const sArsip = String(box.status_arsip || '').toLowerCase();
  const sBarang = String(box.status_barang || '').toLowerCase();
  const lemariVal = String(box.lokasi?.lemari ?? '').toLowerCase().trim();
  const isLemari0 = lemariVal === '0' || lemariVal === 'kosong' || lemariVal === 'keluar';
  const lemariPhrase = isLemari0 ? 'antrian tanpa lemari keluar kosong' : `lemari ${lemariVal} l${lemariVal}`;
  const rak = String(box.lokasi?.rak ?? '').toLowerCase().trim();
  const rakPhrase = `rak ${rak.replace(/^rak\s*/i, '')}`;
  const baris = String((box.lokasi?.baris || box.nomor_box) ?? '').toLowerCase().trim();
  const barisPhrase = `box ${baris.replace(/^box\s*/i, '')} baris ${baris}`;
  const hasilUji = String(box.hasilUjiKompetensi || box.hasil_uji_kompetensi || box['Hasil Uji Kompetensi'] || '').toLowerCase().trim();

  // Seluruh token pencarian harus ditemukan sebagian (partial match) pada salah satu atribut boks
  return tokens.every((token) => {
    return (
      nama.includes(token) ||
      idBox.includes(token) ||
      tahun.includes(token) ||
      lemariVal.includes(token) ||
      lemariPhrase.includes(token) ||
      rak.includes(token) ||
      rakPhrase.includes(token) ||
      baris.includes(token) ||
      barisPhrase.includes(token) ||
      sArsip.includes(token) ||
      sBarang.includes(token) ||
      hasilUji.includes(token)
    );
  });
}
