import { BoksArsip } from '../types.ts';

const STORAGE_KEY_WEB_APP_URL = 'lsp_apps_script_web_app_url';

// Default URL if configured or user can enter their own deployed Web App URL
export const DEFAULT_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby-lsp-arsip-app/exec';

export function getStoredAppsScriptUrl(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(STORAGE_KEY_WEB_APP_URL) || '';
}

export function setStoredAppsScriptUrl(url: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_WEB_APP_URL, url.trim());
}

export interface AppsScriptSyncResult {
  success: boolean;
  message: string;
  isProxy?: boolean;
}

/**
 * Format box into the exact 12-column Google Sheets order:
 * 0: Kode Lemari
 * 1: Nomor Rak
 * 2: Nomor Box
 * 3: ID_Box
 * 4: Nama Pelatihan
 * 5: Tahun Pelaksanaan
 * 6: Jumlah Peserta
 * 7: Jumlah Peserta BK
 * 8: Status Arsip
 * 9: Status Barang
 * 10: Hasil Uji Kompetensi
 * 11: Link Google Drive
 */
export function formatBoxToSheetRow(box: BoksArsip): (string | number)[] {
  const lemariStr = box.lokasi?.lemari !== undefined
    ? (box.lokasi.lemari.toString().toLowerCase().startsWith('lemari') ? box.lokasi.lemari : `Lemari ${box.lokasi.lemari}`)
    : 'Lemari 1';
  const rakStr = box.lokasi?.rak ? box.lokasi.rak.toString() : 'R1';
  const nomorBox = box.nomor_box || box.lokasi?.baris || '1';
  const hasilUji = box.hasilUjiKompetensi || box.hasil_uji_kompetensi || box['Hasil Uji Kompetensi'] || '-';

  return [
    lemariStr,
    rakStr,
    nomorBox,
    box.id_box,
    box.nama_pelatihan,
    box.tahun_pelaksanaan,
    box.jumlah_peserta,
    box.jumlah_peserta_bk,
    box.status_arsip,
    box.status_barang,
    hasilUji,
    box.link_dokumentasi
  ];
}

/**
 * Kirim data boks arsip ke Google Sheets melalui Google Apps Script Web App API
 * Mendukung aksi: 'add' (tambah baru), 'update' (perbarui), atau 'move' (pindah rak/lemari).
 */
export async function sendBoxToGoogleSheets(
  box: BoksArsip,
  action: 'add' | 'update' | 'move' = 'add'
): Promise<AppsScriptSyncResult> {
  const customUrl = getStoredAppsScriptUrl();
  const effectiveUrl = customUrl || DEFAULT_APPS_SCRIPT_URL;

  // 1. Coba kirimkan melalui Backend Proxy terlebih dahulu (menghindari limitasi CORS & 302 redirect Google Apps Script)
  try {
    const proxyResponse = await fetch('/api/apps-script/post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        webAppUrl: effectiveUrl,
        box,
        action,
        rowValues: formatBoxToSheetRow(box)
      })
    });

    if (proxyResponse.ok) {
      const data = await proxyResponse.json();
      return {
        success: true,
        message: data.message || `Data boks arsip ${box.id_box} berhasil tersimpan ke Google Sheets.`,
        isProxy: true
      };
    }
  } catch (err) {
    console.warn('Backend proxy tidak merespon, mencoba fallback langsung...', err);
  }

  // 2. Jika backend proxy tidak tersedia dan ada Apps Script URL terpasang, coba direct fetch
  if (customUrl) {
    try {
      await fetch(customUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          box,
          rowValues: formatBoxToSheetRow(box)
        })
      });

      return {
        success: true,
        message: `Permintaan kirim boks arsip ${box.id_box} telah dikirim ke Google Apps Script Web App.`
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Gagal mengirim ke Google Apps Script: ${err?.message || 'Koneksi gagal'}`
      };
    }
  }

  return {
    success: true,
    message: `Data boks arsip ${box.id_box} tersimpan di sistem lokal. Pasang URL Web App Google Apps Script untuk sinkronisasi otomatis ke Google Sheets.`
  };
}

export const APPS_SCRIPT_SAMPLE_CODE = `/**
 * GOOGLE APPS SCRIPT WEB APP UNTUK SISTEM ARSIP BOKS LSP
 * 
 * Panduan Pemasangan:
 * 1. Buka spreadsheet Google Sheets arsip Anda.
 * 2. Klik menu "Ekstensi" (Extensions) > "Apps Script".
 * 3. Hapus semua kode default dan tempelkan kode di bawah ini.
 * 4. Klik "Deploy" (Terapkan) > "New deployment" (Penerapan baru).
 * 5. Pilih jenis: "Web App" (Aplikasi Web).
 * 6. Set "Execute as": "Me" (Email pemilik).
 * 7. Set "Who has access": "Anyone" (Siapa saja).
 * 8. Klik Deploy, beri izin otorisasi Google, lalu salin URL Web App (akhiran /exec).
 * 9. Tempelkan URL tersebut pada dialog Pengaturan Google Apps Script di aplikasi web ini.
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);
  
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var payload = JSON.parse(e.postData.contents);
    var action = payload.action || 'add';
    var box = payload.box || payload;
    
    // Susun 12 Kolom Spreadsheet Sesuai Urutan Index Baku:
    // Index 0 (A): Kode Lemari
    // Index 1 (B): Nomor Rak
    // Index 2 (C): Nomor Box
    // Index 3 (D): ID_Box
    // Index 4 (E): Nama Pelatihan
    // Index 5 (F): Tahun Pelaksanaan
    // Index 6 (G): Jumlah Peserta
    // Index 7 (H): Jumlah Peserta BK
    // Index 8 (I): Status Arsip
    // Index 9 (J): Status Barang
    // Index 10 (K): Hasil Uji Kompetensi
    // Index 11 (L): Link Google Drive
    
    var lemariStr = box.lokasi ? (box.lokasi.lemari ? 'Lemari ' + box.lokasi.lemari : '') : (box.kode_lemari || '');
    var rakStr = box.lokasi ? box.lokasi.rak : (box.nomor_rak || '');
    var nomorBox = box.nomor_box || (box.lokasi ? box.lokasi.baris : '1');
    var hasilUji = box.hasilUjiKompetensi || box.hasil_uji_kompetensi || box['Hasil Uji Kompetensi'] || '-';
    
    var rowData = [
      lemariStr,
      rakStr,
      nomorBox,
      box.id_box || '',
      box.nama_pelatihan || '',
      box.tahun_pelaksanaan || new Date().getFullYear(),
      box.jumlah_peserta || 0,
      box.jumlah_peserta_bk || 0,
      box.status_arsip || 'Aktif',
      box.status_barang || 'Lengkap',
      hasilUji,
      box.link_dokumentasi || ''
    ];
    
    if (action === 'move' || action === 'update') {
      var data = sheet.getDataRange().getValues();
      var targetId = (box.id_box || '').toString().trim().toUpperCase();
      var foundRow = -1;
      
      for (var i = 1; i < data.length; i++) {
        var sheetId = (data[i][3] || '').toString().trim().toUpperCase();
        if (sheetId === targetId) {
          foundRow = i + 1;
          break;
        }
      }
      
      if (foundRow !== -1) {
        sheet.getRange(foundRow, 1, 1, rowData.length).setValues([rowData]);
      } else {
        sheet.appendRow(rowData);
      }
    } else {
      // Default: Action 'add'
      sheet.appendRow(rowData);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      action: action,
      id_box: box.id_box,
      message: 'Data boks arsip berhasil disimpan permanen ke Google Sheets.'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'online',
    message: 'Google Apps Script Web App Sistem Manajemen Boks Arsip LSP aktif dan siap menerima data.'
  })).setMimeType(ContentService.MimeType.JSON);
}
`;
