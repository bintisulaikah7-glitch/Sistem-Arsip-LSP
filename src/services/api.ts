/**
 * API Service untuk Google Sheets, Google Apps Script, dan Backend Server
 * Sistem Manajemen Berkas Boks Arsip LSP
 */
import {
  DEFAULT_APPS_SCRIPT_URL,
  GOOGLE_SHEETS_CSV_URL,
  GOOGLE_SHEETS_SPREADSHEET_URL,
  getStoredAppsScriptUrl,
  setStoredAppsScriptUrl
} from '../config.ts';
import { BoksArsip } from '../types.ts';
import {
  fetchBoxesData,
  fetchBoxesFromAppsScript,
  verifyAndSanitizeBoxes
} from '../data/boxesService.ts';
import { sendBoxToGoogleSheets, AppsScriptSyncResult } from '../utils/appsScriptService.ts';

export {
  DEFAULT_APPS_SCRIPT_URL,
  GOOGLE_SHEETS_CSV_URL,
  GOOGLE_SHEETS_SPREADSHEET_URL,
  getStoredAppsScriptUrl,
  setStoredAppsScriptUrl
};

/**
 * Mengambil seluruh data boks arsip langsung dari Google Apps Script Web App terbaru
 */
export async function fetchFromAppsScript(customUrl?: string): Promise<BoksArsip[]> {
  const url = customUrl || getStoredAppsScriptUrl();
  return fetchBoxesFromAppsScript(url);
}

/**
 * Mengambil data boks arsip dari sumber terbaik (Apps Script Web App -> Backend Proxy -> Google Sheets CSV)
 */
export async function fetchAllBoxes(sheetCsvUrl: string = GOOGLE_SHEETS_CSV_URL): Promise<BoksArsip[]> {
  return fetchBoxesData(sheetCsvUrl);
}

/**
 * Mengirim data boks arsip (tambah/update/pindah) ke Google Sheets via Apps Script Web App
 */
export async function pushBoxToGoogleSheets(
  box: BoksArsip,
  action: 'add' | 'update' | 'move' = 'add'
): Promise<AppsScriptSyncResult> {
  return sendBoxToGoogleSheets(box, action);
}

/**
 * Tes koneksi ke Web App URL Google Apps Script
 */
export async function testAppsScriptConnection(urlToTest?: string): Promise<{ success: boolean; message: string }> {
  const targetUrl = urlToTest || getStoredAppsScriptUrl();
  try {
    const res = await fetch('/api/apps-script/post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        webAppUrl: targetUrl,
        action: 'ping',
        box: { id_box: 'PING-TEST' }
      })
    });

    if (res.ok) {
      return {
        success: true,
        message: 'Koneksi ke Google Apps Script Web App BERHASIL!'
      };
    } else {
      const data = await res.json().catch(() => ({}));
      return {
        success: false,
        message: data.message || `Gagal menghubungi URL Web App (${res.status}).`
      };
    }
  } catch (err: any) {
    return {
      success: false,
      message: `Koneksi gagal: ${err.message || 'Cek kembali URL penerapan web app.'}`
    };
  }
}
