import Papa from 'papaparse';
import { BoksArsip, StatusArsip, StatusBarang } from '../types.ts';
import { INITIAL_BOXES } from './initialBoxes.ts';
import { deduplicateBoxes } from '../utils/csvParser.ts';

/**
 * URL CSV Export Google Sheets (Boks Berkas Arsip LSP)
 */
export const GOOGLE_SHEETS_CSV_URL =
  'https://docs.google.com/spreadsheets/d/1Cq3QzccIPDSVyXY2dq4S61wHVRJFh0LaP2xT6OViK-M/export?format=csv';

/**
 * Web App URL Resmi Google Apps Script untuk Sistem Berkas Arsip LSP (AKTIF & TERHUBUNG)
 */
export const GOOGLE_APPS_SCRIPT_WEB_APP_URL =
  'https://script.google.com/macros/s/AKfycbwmWRf4WzTnln9aXX82ET8czMC69HetwhNnOwiOVSQb-hrZ6AIf7REXwWNErMeEce5B/exec';

/**
 * Pemetaan baris objek dari Google Apps Script Web App JSON menjadi objek BoksArsip
 */
export function mapAppsScriptItemToBox(rawItem: any, index: number): BoksArsip | null {
  if (!rawItem || typeof rawItem !== 'object') return null;

  // Normalisasi key menjadi lowercase & trim spasi
  const cleanItem: Record<string, any> = {};
  for (const [key, val] of Object.entries(rawItem)) {
    cleanItem[key.trim().toLowerCase()] = val;
  }

  const rawLemari = cleanItem['kode lemari'] || cleanItem['kode_lemari'] || cleanItem['lemari'] || '';
  const rawRak = cleanItem['nomor rak'] || cleanItem['nomor_rak'] || cleanItem['rak'] || '';
  const rawBox = cleanItem['nomor box'] || cleanItem['nomor_box'] || cleanItem['box'] || '';
  const rawIdBox = cleanItem['id_box'] || cleanItem['id box'] || cleanItem['id'] || '';
  const rawNama = cleanItem['nama pelatihan'] || cleanItem['nama_pelatihan'] || cleanItem['nama'] || '';
  const rawTahun = cleanItem['tahun pelaksanaan'] || cleanItem['tahun_pelaksanaan'] || cleanItem['tahun'] || '';
  const rawPeserta = cleanItem['jumlah peserta'] || cleanItem['jumlah_peserta'] || cleanItem['peserta'] || 0;
  const rawPesertaBk = cleanItem['jumlah peserta bk'] || cleanItem['jumlah_peserta_bk'] || cleanItem['bk'] || 0;
  const rawStatusArsip = cleanItem['status arsip'] || cleanItem['status_arsip'] || 'Tersedia';
  const rawStatusBarang = cleanItem['status barang'] || cleanItem['status_barang'] || 'Lengkap';
  const rawHasilUji = cleanItem['hasil uji kompetensi'] || cleanItem['hasil_uji_kompetensi'] || '-';
  const rawDrive = cleanItem['link google drive'] || cleanItem['link_dokumentasi'] || cleanItem['link'] || 'https://drive.google.com';

  const namaPelatihan = String(rawNama || '').trim();
  if (!namaPelatihan || namaPelatihan.toLowerCase() === 'kosong') {
    return null;
  }

  // Parse Lemari
  let lemariNum: number = 0;
  const lemariStr = String(rawLemari || '').trim();
  const lemariDigits = lemariStr.replace(/\D/g, '');
  if (lemariDigits) {
    lemariNum = parseInt(lemariDigits, 10);
  }

  // Parse Rak
  let rakClean = String(rawRak || '').trim();
  if (rakClean.toLowerCase() === 'kosong' || rakClean === '-') {
    rakClean = '';
  }

  // Parse Nomor Box
  let boxClean = String(rawBox || '').trim();
  if (boxClean.toLowerCase() === 'kosong') boxClean = '';

  const tahunNum = parseInt(String(rawTahun).replace(/\D/g, ''), 10) || new Date().getFullYear();

  // ID Box
  let idBoxClean = String(rawIdBox || '').trim();
  if (!idBoxClean || idBoxClean === '1' || idBoxClean.toLowerCase() === 'kosong') {
    if (lemariNum > 0 && rakClean) {
      idBoxClean = `L${lemariNum}-${rakClean.replace(/\s+/g, '')}-BOX${boxClean.replace(/\D/g, '') || String(index + 1).padStart(2, '0')}-${tahunNum}`;
    } else {
      idBoxClean = `BOX-${tahunNum}-${String(index + 1).padStart(3, '0')}`;
    }
  }

  // Normalisasi status arsip
  let status_arsip: StatusArsip = 'Tersedia';
  const sArsipLower = String(rawStatusArsip).toLowerCase().trim();
  if (sArsipLower.includes('aktif') || sArsipLower.includes('tersedia')) {
    status_arsip = 'Tersedia';
  } else if (sArsipLower.includes('tidak lengkap')) {
    status_arsip = 'Tidak Lengkap';
  } else if (sArsipLower.includes('tidak') || sArsipLower.includes('inaktif')) {
    status_arsip = 'Tidak Tersedia';
  } else if (sArsipLower.includes('musnah')) {
    status_arsip = 'Dimusnahkan';
  }

  // Normalisasi status barang
  let status_barang: StatusBarang = 'Lengkap';
  const sBarangLower = String(rawStatusBarang).toLowerCase().trim();
  if (sBarangLower.includes('lengkap') && !sBarangLower.includes('tidak')) {
    status_barang = 'Lengkap';
  } else if (sBarangLower.includes('tidak lengkap')) {
    status_barang = 'Tidak Lengkap';
  } else if (sBarangLower.includes('tidak ada') || sBarangLower.includes('tidak')) {
    status_barang = 'Tidak Ada';
  } else if (sBarangLower.includes('pinjam')) {
    status_barang = 'Dipinjam';
  } else if (sBarangLower.includes('perbaik')) {
    status_barang = 'Diperbaiki';
  }

  return {
    id_box: idBoxClean,
    nama_pelatihan: namaPelatihan,
    tahun_pelaksanaan: tahunNum,
    jumlah_peserta: Number(rawPeserta) || 0,
    jumlah_peserta_bk: Number(rawPesertaBk) || 0,
    lokasi: {
      lemari: lemariNum > 0 ? lemariNum : (lemariStr || 1),
      rak: rakClean || 'Rak A',
      baris: boxClean || 'Box 1'
    },
    status_arsip,
    status_barang,
    hasilUjiKompetensi: String(rawHasilUji || '-').trim(),
    hasil_uji_kompetensi: String(rawHasilUji || '-').trim(),
    'Hasil Uji Kompetensi': String(rawHasilUji || '-').trim(),
    link_dokumentasi: String(rawDrive || 'https://drive.google.com').trim()
  };
}

/**
 * Verifikasi dan sanitasi ketat data boks arsip dari Google Sheets
 */
export function verifyAndSanitizeBoxes(rawBoxes: any[]): BoksArsip[] {
  if (!rawBoxes || !Array.isArray(rawBoxes) || rawBoxes.length === 0) {
    return deduplicateBoxes(INITIAL_BOXES);
  }

  const verified: BoksArsip[] = [];
  const seenIds = new Set<string>();

  for (let i = 0; i < rawBoxes.length; i++) {
    const b = rawBoxes[i];
    if (!b || typeof b !== 'object') continue;

    const nama = String(b.nama_pelatihan || b['Nama Pelatihan'] || '').trim();
    if (!nama || nama.toLowerCase() === 'kosong') continue;

    const rawLokasi = b.lokasi || {};
    let lemariVal = rawLokasi.lemari !== undefined && rawLokasi.lemari !== null ? rawLokasi.lemari : (b['Kode Lemari'] || b.kode_lemari || 1);
    if (typeof lemariVal === 'string') {
      const matchDigits = lemariVal.match(/\d+/);
      if (matchDigits) {
        lemariVal = parseInt(matchDigits[0], 10);
      }
    }
    if (!lemariVal || lemariVal === 0 || String(lemariVal).toLowerCase() === 'kosong') {
      lemariVal = 1;
    }

    const rakVal = String(rawLokasi.rak || b['Nomor Rak'] || b['Nomor Rak '] || b.nomor_rak || 'Rak A').trim();
    const barisVal = String(rawLokasi.baris || b['Nomor Box'] || b.nomor_box || 'Box 1').trim();

    let idVal = String(b.id_box || b['ID_Box'] || b.id || '').trim();
    if (!idVal || idVal === '1' || idVal.toLowerCase() === 'kosong') {
      idVal = `BOX-L${lemariVal}-${rakVal.replace(/\s+/g, '')}-${i + 1}`;
    }

    let uniqueId = idVal;
    let counter = 2;
    while (seenIds.has(uniqueId.toUpperCase())) {
      uniqueId = `${idVal}-${counter}`;
      counter++;
    }
    seenIds.add(uniqueId.toUpperCase());

    const tahunVal = Number(b.tahun_pelaksanaan || b['Tahun Pelaksanaan']) || new Date().getFullYear();
    const pesertaVal = Number(b.jumlah_peserta || b['Jumlah Peserta'] || b['Jumlah Peserta ']) || 0;
    const pesertaBkVal = Number(b.jumlah_peserta_bk || b['Jumlah Peserta BK']) || 0;

    const sArsipRaw = String(b.status_arsip || b['Status Arsip'] || b['Status Arsip '] || 'Tersedia').trim();
    const sBarangRaw = String(b.status_barang || b['Status Barang'] || b['Status Barang '] || 'Lengkap').trim();
    const hasilUjiRaw = String(b.hasilUjiKompetensi || b.hasil_uji_kompetensi || b['Hasil Uji Kompetensi'] || '-').trim();
    const linkDriveRaw = String(b.link_dokumentasi || b['Link Google Drive'] || b['Link Google Drive '] || 'https://drive.google.com').trim();

    verified.push({
      id_box: uniqueId,
      nama_pelatihan: nama,
      tahun_pelaksanaan: tahunVal,
      jumlah_peserta: pesertaVal,
      jumlah_peserta_bk: pesertaBkVal,
      lokasi: {
        lemari: lemariVal,
        rak: rakVal || 'Rak A',
        baris: barisVal || 'Box 1'
      },
      status_arsip: sArsipRaw as any,
      status_barang: sBarangRaw as any,
      hasilUjiKompetensi: hasilUjiRaw,
      hasil_uji_kompetensi: hasilUjiRaw,
      'Hasil Uji Kompetensi': hasilUjiRaw,
      link_dokumentasi: linkDriveRaw
    });
  }

  return verified.length > 0 ? verified : deduplicateBoxes(INITIAL_BOXES);
}

/**
 * Tarik data boks dari Apps Script (Langsung dari URL tanpa Proxy Backend)
 */
export async function fetchBoxesFromAppsScript(
  webAppUrl: string = GOOGLE_APPS_SCRIPT_WEB_APP_URL
): Promise<BoksArsip[]> {
  try {
    let rawData: any = null;

    // Timeout diperpanjang menjadi 15 detik agar koneksi stabil saat data banyak
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(webAppUrl, {
      method: 'GET',
      headers: { Accept: 'application/json, text/plain, */*' },
      redirect: 'follow',
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const text = await response.text();
      if (text && (text.trim().startsWith('[') || text.trim().startsWith('{'))) {
        rawData = JSON.parse(text);
      }
    }

    if (rawData) {
      const arrayData = Array.isArray(rawData) ? rawData : (rawData.data || rawData.boxes || []);
      if (Array.isArray(arrayData) && arrayData.length > 0) {
        const mappedBoxes: BoksArsip[] = [];
        const seenIds = new Set<string>();

        arrayData.forEach((item, idx) => {
          const box = mapAppsScriptItemToBox(item, idx);
          if (box) {
            let uniqueId = box.id_box;
            let counter = 2;
            while (seenIds.has(uniqueId.toUpperCase())) {
              uniqueId = `${box.id_box}-${counter}`;
              counter++;
            }
            seenIds.add(uniqueId.toUpperCase());
            box.id_box = uniqueId;
            mappedBoxes.push(box);
          }
        });

        if (mappedBoxes.length > 0) {
          console.log(`[fetchBoxesFromAppsScript] Berhasil menarik ${mappedBoxes.length} boks dari Google Apps Script Web App.`);
          return verifyAndSanitizeBoxes(mappedBoxes);
        }
      }
    }
  } catch (err: any) {
    if (err.name !== 'AbortError') {
      console.warn('[fetchBoxesFromAppsScript] Direct Apps Script fetch failed:', err);
    }
  }

  return [];
}

export function normalizeHeader(name: string): string {
  return (name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

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
export function parseGoogleSheetsCsv(csvText: string): BoksArsip[] {
  if (!csvText || typeof csvText !== 'string') return [];

  const cleanText = csvText.replace(/^\uFEFF/, '').trim();
  if (!cleanText) return [];

  if (
    cleanText.startsWith('<!DOCTYPE') ||
    cleanText.startsWith('<html') ||
    cleanText.includes('<title>Google Drive') ||
    cleanText.includes('docs.google.com/error')
  ) {
    return [];
  }

  const parsed = Papa.parse<string[]>(cleanText, {
    header: false,
    skipEmptyLines: false
  });

  const rawRows = parsed.data;
  if (!rawRows || rawRows.length === 0) return [];

  const headerRow = rawRows[0] || [];

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

  for (let i = 1; i < rawRows.length; i++) {
    const row = rawRows[i];

    if (!row || !Array.isArray(row) || row.length === 0) continue;

    const isAllEmptyOrKosong = row.every((cell) => {
      const val = String(cell ?? '').trim().toLowerCase();
      return val === '' || val === 'kosong';
    });

    if (isAllEmptyOrKosong) continue;

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

    const isNamaEmptyOrKosong = !rawNamaPelatihan || rawNamaPelatihan.toLowerCase() === 'kosong';
    const isIdEmptyOrKosong =
      !rawIdBox ||
      rawIdBox.toLowerCase() === 'kosong' ||
      rawIdBox.toLowerCase() === 'kosong - kosong - kosong';

    if (isNamaEmptyOrKosong && isIdEmptyOrKosong) continue;

    const nama_pelatihan = rawNamaPelatihan || 'Pelatihan Sertifikasi LSP';

    const tahunMatch = rawTahun.match(/\d{4}/);
    const tahun_pelaksanaan = tahunMatch
      ? parseInt(tahunMatch[0], 10)
      : parseInt(rawTahun.replace(/\D/g, ''), 10) || new Date().getFullYear();

    const cleanPesertaStr = rawPeserta.includes('/') ? rawPeserta.split('/')[0] : rawPeserta;
    const jumlah_peserta = parseInt(cleanPesertaStr.replace(/\D/g, ''), 10) || 0;

    const cleanPesertaBkStr = rawPesertaBk.includes('/') ? rawPesertaBk.split('/')[0] : rawPesertaBk;
    const jumlah_peserta_bk = parseInt(cleanPesertaBkStr.replace(/\D/g, ''), 10) || 0;

    const isLemariKosong = !rawKodeLemari || rawKodeLemari.toLowerCase() === 'kosong';
    const lemariDigits = !isLemariKosong ? rawKodeLemari.match(/\d+/) : null;
    const lemari = lemariDigits ? parseInt(lemariDigits[0], 10) : 0;

    const isRakKosong = !rawNomorRak || rawNomorRak.toLowerCase() === 'kosong';
    const rak = isRakKosong ? (lemari > 0 ? 'Rak A' : '-') : rawNomorRak;

    const isBoxKosong = !rawNomorBox || rawNomorBox.toLowerCase() === 'kosong';
    const baris = isBoxKosong ? (lemari > 0 ? 'Box 1' : '-') : rawNomorBox;

    let status_arsip: StatusArsip = 'Tersedia';
    if (rawStatusArsip && rawStatusArsip.toLowerCase() !== 'kosong') {
      status_arsip = rawStatusArsip as StatusArsip;
    }

    let status_barang: StatusBarang = 'Lengkap';
    if (rawStatusBarang && rawStatusBarang.toLowerCase() !== 'kosong') {
      status_barang = rawStatusBarang as StatusBarang;
    }

    const hasilUjiKompetensi = rawHasilUji || '-';

    const link_dokumentasi =
      rawLinkDrive && rawLinkDrive.toLowerCase() !== 'kosong'
        ? rawLinkDrive
        : 'https://drive.google.com';

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

export function mapCsvRowsToBoxes(records: Record<string, string>[]): BoksArsip[] {
  if (!records || records.length === 0) return [];
  const headers = Object.keys(records[0] || {});
  const rows = [headers, ...records.map((rec) => headers.map((h) => rec[h] || ''))];
  const csvText = Papa.unparse(rows);
  return parseGoogleSheetsCsv(csvText);
}

/**
 * Fungsi asynchronous utama untuk membaca data boks arsip langsung dari Apps Script & Google Sheets CSV.
 */
export async function fetchBoxesData(
  sheetCsvUrl: string = GOOGLE_SHEETS_CSV_URL
): Promise<BoksArsip[]> {
  try {
    // 1. PRIORITAS UTAMA: Direct Fetch ke Apps Script Web App
    try {
      const appsScriptBoxes = await fetchBoxesFromAppsScript();
      if (appsScriptBoxes && appsScriptBoxes.length > 0) {
        return verifyAndSanitizeBoxes(appsScriptBoxes);
      }
    } catch (appsScriptErr) {
      console.warn('[fetchBoxesData] Direct Apps Script fetch error:', appsScriptErr);
    }

    // 2. Upaya Cadangan: Fetch langsung dari URL CSV Google Sheets
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(sheetCsvUrl, {
        headers: { Accept: 'text/csv,text/plain,*/*' },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const text = await response.text();
        const trimmed = text.trim();
        if (
          !trimmed.startsWith('<!DOCTYPE') &&
          !trimmed.startsWith('<html') &&
          !text.includes('<title>Google Drive') &&
          !text.includes('docs.google.com/error')
        ) {
          const mappedBoxes = parseGoogleSheetsCsv(trimmed);
          if (mappedBoxes.length > 0) {
            return verifyAndSanitizeBoxes(mappedBoxes);
          }
        }
      }
    } catch (directErr) {
      console.warn('[fetchBoxesData] Direct CSV fetch error:', directErr);
    }

    // Fallback jika jaringan gagal total
    return verifyAndSanitizeBoxes(INITIAL_BOXES);
  } catch (error) {
    console.error('[fetchBoxesData] Unexpected error, using fallback:', error);
    return verifyAndSanitizeBoxes(INITIAL_BOXES);
  }
}

export { INITIAL_BOXES };
