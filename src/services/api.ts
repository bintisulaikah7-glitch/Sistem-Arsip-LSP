import { getStoredAppsScriptUrl } from '../config.ts';

/**
 * Tes koneksi ke Web App URL Google Apps Script langsung (tanpa backend proxy lokal)
 */
export async function testAppsScriptConnection(urlToTest?: string): Promise<{ success: boolean; message: string }> {
  const targetUrl = urlToTest || getStoredAppsScriptUrl();
  try {
    const res = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
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
      return {
        success: false,
        message: `Gagal menghubungi URL Web App (Status: ${res.status}).`
      };
    }
  } catch (err: any) {
    return {
      success: false,
      message: `Koneksi gagal: ${err.message || 'Cek kembali URL penerapan web app.'}`
    };
  }
}
