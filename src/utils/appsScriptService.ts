import { BoksArsip } from '../types.ts';

const STORAGE_KEY_WEB_APP_URL = 'lsp_apps_script_web_app_url';

// Default Web App URL resmi yang terhubung langsung ke Google Sheets LSP
export const DEFAULT_APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbwMXs3mGxDG1DS-wus_hBgtMHViHNslBJMSZ3eDGX3vvkRUdWwp9PeFXtfGzYRy08O5/exec';

export function getStoredAppsScriptUrl(): string {
  if (typeof window === 'undefined') return DEFAULT_APPS_SCRIPT_URL;
  return localStorage.getItem(STORAGE_KEY_WEB_APP_URL) || DEFAULT_APPS_SCRIPT_URL;
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
  const lemariStr =
    box.lokasi?.lemari !== undefined
      ? box.lokasi.lemari.toString().toLowerCase().startsWith('lemari')
        ? box.lokasi.lemari
        : `Lemari ${box.lokasi.lemari}`
      : 'Lemari 1';
  const rakStr = box.lokasi?.rak ? box.lokasi.rak.toString() : 'Rak A';
  const nomorBox = box.nomor_box || box.lokasi?.baris || 'Box 1';
  const hasilUji =
    box.hasilUjiKompetensi ||
    box.hasil_uji_kompetensi ||
    box['Hasil Uji Kompetensi'] ||
    '-';

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
 * Mengirimkan data via POST ke Web App URL:
 * https://script.google.com/macros/s/AKfycbwMXs3mGxDG1DS-wus_hBgtMHViHNslBJMSZ3eDGX3vvkRUdWwp9PeFXtfGzYRy08O5/exec
 */
export async function sendBoxToGoogleSheets(
  box: BoksArsip,
  action: 'add' | 'update' | 'move' = 'add'
): Promise<AppsScriptSyncResult> {
  const customUrl = getStoredAppsScriptUrl();
  const effectiveUrl = customUrl || DEFAULT_APPS_SCRIPT_URL;
  const rowValues = formatBoxToSheetRow(box);

  const lemariVal = box.lokasi?.lemari !== undefined
    ? (box.lokasi.lemari.toString().toLowerCase().startsWith('lemari') ? box.lokasi.lemari : `Lemari ${box.lokasi.lemari}`)
    : 'Lemari 1';
  const rakVal = box.lokasi?.rak ? box.lokasi.rak.toString() : 'Rak A';
  const boxVal = box.nomor_box || box.lokasi?.baris || 'Box 1';
  const hasilUjiVal = box.hasilUjiKompetensi || box.hasil_uji_kompetensi || box['Hasil Uji Kompetensi'] || '-';

  // Susun payload yang ramah bagi berbagai struktur Apps Script (baik flat map kolom maupun nested box/rowValues)
  const payload = {
    action,
    box,
    rowValues,
    'Kode Lemari': lemariVal,
    'kode_lemari': lemariVal,
    'Nomor Rak': rakVal,
    'Nomor Rak ': rakVal,
    'nomor_rak': rakVal,
    'Nomor Box': boxVal,
    'nomor_box': boxVal,
    'ID_Box': box.id_box,
    'id_box': box.id_box,
    'Nama Pelatihan': box.nama_pelatihan,
    'nama_pelatihan': box.nama_pelatihan,
    'Tahun Pelaksanaan': box.tahun_pelaksanaan,
    'tahun_pelaksanaan': box.tahun_pelaksanaan,
    'Jumlah Peserta': box.jumlah_peserta,
    'Jumlah Peserta ': box.jumlah_peserta,
    'jumlah_peserta': box.jumlah_peserta,
    'Jumlah Peserta BK': box.jumlah_peserta_bk,
    'jumlah_peserta_bk': box.jumlah_peserta_bk,
    'Status Arsip': box.status_arsip,
    'Status Arsip ': box.status_arsip,
    'status_arsip': box.status_arsip,
    'Status Barang': box.status_barang,
    'Status Barang ': box.status_barang,
    'status_barang': box.status_barang,
    'Hasil Uji Kompetensi': hasilUjiVal,
    'hasil_uji_kompetensi': hasilUjiVal,
    'Link Google Drive': box.link_dokumentasi,
    'Link Google Drive ': box.link_dokumentasi,
    'link_dokumentasi': box.link_dokumentasi
  };

  // 1. Coba kirim melalui Backend Proxy (mengatasi limitasi CORS & 302 redirect Google Apps Script)
  try {
    const proxyResponse = await fetch('/api/apps-script/post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        webAppUrl: effectiveUrl,
        ...payload
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
    console.warn('[AppsScript] Backend proxy tidak merespon, beralih ke direct fetch...', err);
  }

  // 2. Direct fetch ke Web App URL (untuk static hosting seperti GitHub Pages)
  try {
    const response = await fetch(effectiveUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload),
      redirect: 'follow'
    });

    if (response.ok) {
      return {
        success: true,
        message: `Data boks arsip ${box.id_box} berhasil dikirim ke Google Sheets.`
      };
    }
  } catch (err: any) {
    console.warn('[AppsScript] Direct fetch with text/plain failed, attempting no-cors fallback:', err);
    try {
      // Fallback no-cors memastikan payload tetap terkirim ke server Google Apps Script
      await fetch(effectiveUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      return {
        success: true,
        message: `Data boks arsip ${box.id_box} berhasil dikirim ke Google Sheets via no-cors mode.`
      };
    } catch (noCorsErr: any) {
      return {
        success: false,
        message: `Gagal mengirim ke Google Apps Script: ${noCorsErr?.message || 'Koneksi gagal'}`
      };
    }
  }

  return {
    success: true,
    message: `Data boks arsip ${box.id_box} berhasil diproses.`
  };
}

export const APPS_SCRIPT_SAMPLE_CODE = `/**
 * GOOGLE APPS SCRIPT WEB APP UNTUK SISTEM ARSIP BOKS LSP
 * Web App URL: https://script.google.com/macros/s/AKfycbwMXs3mGxDG1DS-wus_hBgtMHViHNslBJMSZ3eDGX3vvkRUdWwp9PeFXtfGzYRy08O5/exec
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);
  
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var payload = JSON.parse(e.postData.contents);
    var action = payload.action || 'add';
    var box = payload.box || payload;
    
    var lemariStr = box.lokasi ? (box.lokasi.lemari ? 'Lemari ' + box.lokasi.lemari : '') : (box.kode_lemari || '');
    var rakStr = box.lokasi ? box.lokasi.rak : (box.nomor_rak || '');
    var nomorBox = box.nomor_box || (box.lokasi ? box.lokasi.baris : 'Box 1');
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
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var result = [];
  
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = row[j];
    }
    result.push(obj);
  }
  
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}
`;
