import Papa from 'papaparse';
import { BoksArsip, StatusArsip, StatusBarang } from '../types.ts';

export const GOOGLE_SHEETS_SPREADSHEET_URL =
  'https://docs.google.com/spreadsheets/d/1Cq3QzccIPDSVyXY2dq4S61wHVRJFh0LaP2xT6OViK-M/edit?usp=sharing';

export const GOOGLE_SHEETS_CSV_URL =
  'https://docs.google.com/spreadsheets/d/1Cq3QzccIPDSVyXY2dq4S61wHVRJFh0LaP2xT6OViK-M/export?format=csv&gid=0';

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

    // 6. Kode Lemari -> lokasi.lemari (ambil angkanya saja)
    const rawLemari = getRecordValue(
      rec,
      'Kode Lemari',
      'KodeLemari',
      'kode_lemari',
      'lemari',
      'lemari nomor'
    ).trim();
    const lemariDigits = rawLemari.match(/\d+/);
    const lemari = lemariDigits ? parseInt(lemariDigits[0], 10) : 0;

    // 7. Nomor Rak -> lokasi.rak
    const rawRak = getRecordValue(
      rec,
      'Nomor Rak',
      'NomorRak',
      'nomor_rak',
      'rak',
      'no rak'
    ).trim();
    const rak = rawRak || '-';

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

    // 9. Status Arsip -> status_arsip
    const rawStatusArsip = getRecordValue(
      rec,
      'Status Arsip',
      'StatusArsip',
      'status_arsip',
      'arsip'
    ).trim();

    let status_arsip: StatusArsip = 'Tersedia';
    if (rawStatusArsip) {
      status_arsip = rawStatusArsip;
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
    const computedId = id_box
      ? id_box
      : lemari > 0
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
 * Robust search matcher for a single box based on keyword query.
 * Matches:
 * - Nama Pelatihan
 * - ID Box (e.g. 'BOX01', 'L1-R1-BOX01-2022')
 * - Lemari (e.g. 'Lemari 1', 'L1', 'L-1', 'Antrian')
 * - Nomor Rak (e.g. 'Rak A', 'Rak D')
 * - Nomor Baris (e.g. 'Baris 1', 'Baris 2')
 * - Tahun Pelaksanaan (e.g. '2024', '2023')
 * - Status Arsip & Status Barang (e.g. 'Tersedia', 'Lengkap')
 */
export function matchBoxSearch(box: BoksArsip, searchQuery: string): boolean {
  if (!box) return false;
  const q = String(searchQuery || '').toLowerCase().trim();
  if (!q) return true;

  const nama = String(box.nama_pelatihan || '').toLowerCase();
  const idBox = String(box.id_box || '').toLowerCase();
  const tahun = String(box.tahun_pelaksanaan ?? '');
  const sArsip = String(box.status_arsip || '').toLowerCase();
  const sBarang = String(box.status_barang || '').toLowerCase();
  const lemariVal = box.lokasi?.lemari ?? '';
  const isPositiveLemari = typeof lemariVal === 'number' ? lemariVal > 0 : Boolean(lemariVal && lemariVal !== '0');
  const rak = String(box.lokasi?.rak ?? '').toLowerCase().trim();
  const baris = String(box.lokasi?.baris ?? '').toLowerCase().trim();
  const hasilUji = String(box.hasilUjiKompetensi || box.hasil_uji_kompetensi || box['Hasil Uji Kompetensi'] || '').toLowerCase().trim();

  // 1. Nama Pelatihan
  if (nama.includes(q)) return true;

  // 2. ID Box
  if (idBox.includes(q)) return true;

  // 3. Tahun Pelaksanaan
  if (tahun.includes(q)) return true;

  // 4. Lemari
  if (isPositiveLemari) {
    if (
      q === `lemari ${lemariVal}` ||
      q === `lemari${lemariVal}` ||
      q === `l${lemariVal}` ||
      q === `l-${lemariVal}` ||
      `lemari ${lemariVal}`.toLowerCase().includes(q)
    ) {
      return true;
    }
  } else {
    if (q === 'antrian' || q === 'tanpa lemari' || q === 'lemari 0' || q === 'l0') {
      return true;
    }
  }

  // 5. Rak
  if (rak.includes(q) || `rak ${rak}`.includes(q)) return true;

  // 6. Baris
  if (baris.includes(q) || `baris ${baris}`.includes(q)) return true;

  // 7. Status Arsip & Barang
  if (sArsip.includes(q)) return true;
  if (sBarang.includes(q)) return true;

  // 8. Hasil Uji Kompetensi
  if (hasilUji && hasilUji.includes(q)) return true;

  // 9. Multi-word search for general combinations like 'Pembatik 2024' or 'Assembly 2022'
  const isSpecificPhrase = q.startsWith('lemari ') || q.startsWith('rak ') || q.startsWith('baris ');
  if (!isSpecificPhrase) {
    const words = q.split(/\s+/).filter(Boolean);
    if (words.length > 1) {
      const allWordsMatch = words.every((word) => {
        const wName = nama.includes(word);
        const wId = idBox.includes(word);
        const wYear = tahun.includes(word);
        const wRak = rak.includes(word);
        const wBaris = baris.includes(word);
        const wStatus = sArsip.includes(word) || sBarang.includes(word);
        const wLemari =
          isPositiveLemari
            ? (word.startsWith('l') && `l${lemariVal}`.toLowerCase().includes(word)) || word === 'lemari'
            : word === 'antrian';

        return wName || wId || wYear || wRak || wBaris || wStatus || wLemari;
      });
      if (allWordsMatch) return true;
    }
  }

  return false;
}
