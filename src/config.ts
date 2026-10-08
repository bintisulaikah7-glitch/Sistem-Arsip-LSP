/**
 * File Konfigurasi Terpusat untuk Google Sheets & Google Apps Script API
 * Sistem Manajemen Berkas Boks Arsip LSP
 */

// Web App URL resmi Google Apps Script milik LSP BDI Surabaya
export const DEFAULT_APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbx4btq9oWF0JBn1PZ5Ew3jRJUKlvu8YH7F55lXsZmPupaHwcIcgvf6_G2SfnmEMOCYa/exec';

// Google Sheets Spreadsheet URL resmi LSP
export const GOOGLE_SHEETS_SPREADSHEET_URL =
  'https://docs.google.com/spreadsheets/d/1Cq3QzccIPDSVyXY2dq4S61wHVRJFh0LaP2xT6OViK-M/edit?usp=sharing';

// Google Sheets CSV Direct Export URL
export const GOOGLE_SHEETS_CSV_URL =
  'https://docs.google.com/spreadsheets/d/1Cq3QzccIPDSVyXY2dq4S61wHVRJFh0LaP2xT6OViK-M/export?format=csv&gid=0';

/**
 * Mengambil URL Google Apps Script yang aktif.
 * Mendukung override dari LocalStorage (jika pengguna memasukkan URL deployment baru lewat antarmuka modal)
 * serta environment variable VITE_APPS_SCRIPT_URL.
 */
export function getStoredAppsScriptUrl(): string {
  if (typeof window !== 'undefined') {
    try {
      const customUrl = localStorage.getItem('lsp_apps_script_url');
      if (customUrl && customUrl.trim().startsWith('https://script.google.com/macros/s/')) {
        return customUrl.trim();
      }
    } catch {
      // Ignore localStorage read errors
    }
  }

  // Cek env var jika ada (kompatibel browser Vite & server Node)
  if (typeof process !== 'undefined' && process.env?.VITE_APPS_SCRIPT_URL) {
    return process.env.VITE_APPS_SCRIPT_URL;
  }

  return DEFAULT_APPS_SCRIPT_URL;
}

/**
 * Menyimpan URL Google Apps Script kustom ke LocalStorage
 */
export function setStoredAppsScriptUrl(url: string): void {
  if (typeof window !== 'undefined') {
    try {
      const cleanUrl = url.trim();
      if (cleanUrl && cleanUrl.startsWith('https://script.google.com/macros/s/')) {
        localStorage.setItem('lsp_apps_script_url', cleanUrl);
      } else {
        localStorage.removeItem('lsp_apps_script_url');
      }
    } catch {
      // Ignore localStorage write errors
    }
  }
}
