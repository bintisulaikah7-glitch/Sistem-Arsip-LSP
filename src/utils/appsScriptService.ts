import { BoksArsip } from '../types.ts';
import {
  DEFAULT_APPS_SCRIPT_URL,
  getStoredAppsScriptUrl,
  setStoredAppsScriptUrl
} from '../config.ts';

export { DEFAULT_APPS_SCRIPT_URL, getStoredAppsScriptUrl, setStoredAppsScriptUrl };

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
 */
export async function sendBoxToGoogleSheets(
  box: BoksArsip,
  action: 'add' | 'update' | 'move' = 'add'
): Promise<AppsScriptSyncResult> {
  const effectiveUrl = getStoredAppsScriptUrl();
  const rowValues = formatBoxToSheetRow(box);

  const lemariVal = box.lokasi?.lemari !== undefined
    ? (box.lokasi.lemari.toString().toLowerCase().startsWith('lemari') ? box.lokasi.lemari : `Lemari ${box.lokasi.lemari}`)
    : 'Lemari 1';
  const rakVal = box.lokasi?.rak ? box.lokasi.rak.toString() : 'Rak A';
  const boxVal = box.nomor_box || box.lokasi?.baris || 'Box 1';
  const hasilUjiVal = box.hasilUjiKompetensi || box.hasil_uji_kompetensi || box['Hasil Uji Kompetensi'] || '-';

  const payload = {
    action,
    box,
    rowValues,
    'Kode Lemari': lemariVal,
    'kode_lemari': lemariVal,
    'Nomor Rak': rakVal,
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
    'jumlah_peserta': box.jumlah_peserta,
    'Jumlah Peserta BK': box.jumlah_peserta_bk,
    'jumlah_peserta_bk': box.jumlah_peserta_bk,
    'Status Arsip': box.status_arsip,
    'status_arsip': box.status_arsip,
    'Status Barang': box.status_barang,
    'status_barang': box.status_barang,
    'Hasil Uji Kompetensi': hasilUjiVal,
    'hasil_uji_kompetensi': hasilUjiVal,
    'Link Google Drive': box.link_dokumentasi,
    'link_dokumentasi': box.link_dokumentasi
  };

  // 1. Prioritas Utama: Kirim melalui Backend Proxy (Mencegah CORS TypeError: Failed to fetch di browser)
  try {
    const proxyRes = await fetch('/api/apps-script/post', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        webAppUrl: effectiveUrl,
        ...payload
      })
    });

    if (proxyRes.ok) {
      const data = await proxyRes.json();
      return {
        success: true,
        message: data.message || `Data boks arsip ${box.id_box} berhasil dikirim ke Google Sheets.`
      };
    }
  } catch (proxyErr) {
    console.warn('[AppsScript] Proxy backend tidak merespons, mencoba fallback direct:', proxyErr);
  }

  // 2. Fallback: Langsung kirim via POST ke Google Apps Script (Untuk lingkungan tanpa backend Node.js)
  try {
    await fetch(effectiveUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload),
      redirect: 'follow'
    });

    return {
      success: true,
      message: `Data boks arsip ${box.id_box} berhasil dikirim ke Google Sheets.`
    };
  } catch (err: any) {
    console.warn('[AppsScript] Direct fetch gagal, menggunakan no-cors fallback:', err);
    try {
      await fetch(effectiveUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });

      return {
        success: true,
        message: `Data boks arsip ${box.id_box} berhasil dikirim ke Google Sheets (mode no-cors).`
      };
    } catch (noCorsErr: any) {
      return {
        success: false,
        message: `Gagal mengirim ke Google Apps Script: ${noCorsErr?.message || 'Koneksi gagal'}`
      };
    }
  }
}

export const APPS_SCRIPT_SAMPLE_CODE = `/**
 * GOOGLE APPS SCRIPT WEB APP UNTUK SISTEM ARSIP BOKS LSP
 * Web App URL: https://script.google.com/macros/s/AKfycby5-El1hSqVLgpYTLtfG9ICIWqLf_QW-67UKguYLUq8RglBJtFq3-hm3aIxcG6KIwCt/exec
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  var success = lock.tryLock(10000);
  if (!success) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: 'Server sedang sibuk, silakan coba lagi.'
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var payload = {};
    
    if (e && e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    }
    
    var action = payload.action || 'add';
    var box = payload.box || payload;
    
    var rawLemari = payload['Kode Lemari'] || payload['kode_lemari'] || (box.lokasi ? box.lokasi.lemari : '') || payload.lemari || 'Lemari 1';
    var lemariStr = String(rawLemari).trim();
    if (!lemariStr.toLowerCase().startsWith('lemari')) {
      lemariStr = 'Lemari ' + lemariStr;
    }
    
    var rakStr = payload['Nomor Rak'] || payload['nomor_rak'] || (box.lokasi ? box.lokasi.rak : '') || payload.rak || 'Rak A';
    var nomorBox = payload['Nomor Box'] || payload['nomor_box'] || (box.lokasi ? box.lokasi.baris : '') || payload.nomor_box || 'Box 1';
    
    var idBox = payload['ID_Box'] || payload['id_box'] || box.id_box || payload.idBoks || '';
    var namaPelatihan = payload['Nama Pelatihan'] || payload['nama_pelatihan'] || box.nama_pelatihan || payload.namaPelatihan || '';
    var tahun = payload['Tahun Pelaksanaan'] || payload['tahun_pelaksanaan'] || box.tahun_pelaksanaan || payload.tahun || new Date().getFullYear();
    var jmlPeserta = Number(payload['Jumlah Peserta'] || payload['jumlah_peserta'] || box.jumlah_peserta || payload.jumlahPeserta || 0);
    var jmlBK = Number(payload['Jumlah Peserta BK'] || payload['jumlah_peserta_bk'] || box.jumlah_peserta_bk || payload.belumKompeten || 0);
    var statusArsip = payload['Status Arsip'] || payload['status_arsip'] || box.status_arsip || payload.statusArsip || 'Tersedia';
    var statusBarang = payload['Status Barang'] || payload['status_barang'] || box.status_barang || payload.statusFisik || 'Lengkap';
    var hasilUji = payload['Hasil Uji Kompetensi'] || payload['hasil_uji_kompetensi'] || box.hasilUjiKompetensi || payload.hasilUjiKompetensi || '-';
    var linkDrive = payload['Link Google Drive'] || payload['link_dokumentasi'] || box.link_dokumentasi || payload.linkDrive || '';
    
    var rowData = [
      lemariStr,
      rakStr,
      nomorBox,
      idBox,
      namaPelatihan,
      tahun,
      jmlPeserta,
      jmlBK,
      statusArsip,
      statusBarang,
      hasilUji,
      linkDrive
    ];
    
    var data = sheet.getDataRange().getValues();
    var targetId = idBox.toString().trim().toUpperCase();
    var foundRow = -1;
    
    if (targetId !== '') {
      for (var i = 1; i < data.length; i++) {
        var sheetId = (data[i][3] || '').toString().trim().toUpperCase();
        if (sheetId === targetId) {
          foundRow = i + 1;
          break;
        }
      }
    }
    
    if (foundRow !== -1) {
      sheet.getRange(foundRow, 1, 1, rowData.length).setValues([rowData]);
    } else {
      sheet.appendRow(rowData);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Data berhasil disimpan ke Google Sheets.',
      id_box: idBox
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
  if (data.length <= 1) {
    return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);
  }
  
  var headers = data[0];
  var result = [];
  
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (!row[3] && !row[4] && !row[0]) continue;
    
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      var key = headers[j] ? headers[j].toString().trim() : 'col_' + j;
      obj[key] = row[j];
    }
    result.push(obj);
  }
  
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}
`;
