/**
 * Konfigurasi URL Publik Portal LSP & Generator QR Code
 * Domain Dasar Publik: https://bintisulaikah7-glitch.github.io/Sistem-Arsip-LSP/
 */

export const PUBLIC_PORTAL_BASE_URL = 'https://bintisulaikah7-glitch.github.io/Sistem-Arsip-LSP/';

/**
 * Menghasilkan Dynamic Base URL untuk QR Code:
 * - Jika sedang berjalan di GitHub Pages (*.github.io), gunakan `window.location.origin + window.location.pathname`
 * - Jika diakses di environment preview (Cloud Run *.run.app, localhost, dll), KUNCI ke domain publik GitHub Pages
 *   agar QR Code yang dicetak selalu mengarah ke domain publik GitHub Pages resmi yang dapat diakses publik.
 */
export function getBasePortalUrl(): string {
  if (typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname || '';
    // Jika diakses dari domain GitHub Pages
    if (hostname.includes('github.io')) {
      const origin = window.location.origin;
      let pathname = window.location.pathname || '/';
      // Bersihkan jika ada index.html di akhir pathname
      if (pathname.endsWith('index.html')) {
        pathname = pathname.substring(0, pathname.length - 'index.html'.length);
      }
      if (!pathname.endsWith('/')) {
        pathname = `${pathname}/`;
      }
      return `${origin}${pathname}`;
    }
  }
  // Default fallback: Kunci ke domain publik GitHub Pages
  return PUBLIC_PORTAL_BASE_URL;
}

/**
 * Menghasilkan link lengkap portal publik untuk boks arsip tertentu dalam format HashRouter:
 * Format: https://bintisulaikah7-glitch.github.io/Sistem-Arsip-LSP/#/?box=KODE_BOKS
 * Otomatis mengikuti domain publik GitHub Pages + format HashRouter SPA.
 */
export function getBoxPublicUrl(idBox: string): string {
  const cleanId = (idBox || '').trim();
  const base = getBasePortalUrl();
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  return `${normalizedBase}#/?box=${encodeURIComponent(cleanId)}`;
}

/**
 * Menghasilkan URL gambar QR code SVG/PNG beresolusi tajam (240x240)
 * yang meng-encode tautan domain publik GitHub Pages.
 */
export function getBoxQrImageUrl(idBox: string, size = 240): string {
  const targetUrl = getBoxPublicUrl(idBox);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(targetUrl)}`;
}

/**
 * Menghasilkan link lengkap portal publik untuk filter lokasi berkas LSP:
 * Format HashRouter: https://bintisulaikah7-glitch.github.io/Sistem-Arsip-LSP/#/?pelatihan=...&lemari=...&rak=...
 */
export function getLocationPublicUrl(pelatihan: string, lemari: string, rak: string): string {
  const base = getBasePortalUrl();
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  const params = new URLSearchParams();
  if (pelatihan && pelatihan.trim()) params.set('pelatihan', pelatihan.trim());
  if (lemari && lemari.trim()) params.set('lemari', lemari.trim());
  if (rak && rak.trim()) params.set('rak', rak.trim());
  return `${normalizedBase}#/?${params.toString()}`;
}

/**
 * Menghasilkan URL gambar QR code untuk lokasi berkas LSP
 */
export function getLocationQrImageUrl(pelatihan: string, lemari: string, rak: string, size = 240): string {
  const targetUrl = getLocationPublicUrl(pelatihan, lemari, rak);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(targetUrl)}`;
}

/**
 * Mengambil parameter lokasi (pelatihan, lemari, rak) dari URL:
 * Memeriksa window.location.hash dan window.location.search
 */
export function getUrlLocationParams(): { pelatihan: string | null; lemari: string | null; rak: string | null } {
  if (typeof window === 'undefined') {
    return { pelatihan: null, lemari: null, rak: null };
  }

  let params: URLSearchParams | null = null;

  // 1. Cek dari window.location.hash (#/?pelatihan=...)
  if (window.location.hash && window.location.hash.includes('?')) {
    const hashQuery = window.location.hash.split('?')[1];
    if (hashQuery) {
      params = new URLSearchParams(hashQuery);
    }
  }

  // 2. Fallback cek dari window.location.search (?pelatihan=...)
  if (!params || (!params.get('pelatihan') && !params.get('lemari') && !params.get('rak'))) {
    params = new URLSearchParams(window.location.search);
  }

  const pelatihan = params.get('pelatihan') ? decodeURIComponent(params.get('pelatihan')!).trim() : null;
  const lemari = params.get('lemari') ? decodeURIComponent(params.get('lemari')!).trim() : null;
  const rak = params.get('rak') ? decodeURIComponent(params.get('rak')!).trim() : null;

  return { pelatihan, lemari, rak };
}

/**
 * Mengambil nilai parameter `box` atau `id` dari URL:
 * - Memeriksa window.location.search (?box=...)
 * - Fallback memeriksa window.location.hash jika URL menggunakan hash routing (#/?box=...)
 * - Membersihkan decodeURIComponent, trim spasi
 */
export function getUrlBoxParam(): string | null {
  if (typeof window === 'undefined') return null;

  // 1. Membaca standard search params (?box=...)
  try {
    const searchParams = new URLSearchParams(window.location.search);
    const boxParam = searchParams.get('box') || searchParams.get('id');
    if (boxParam && boxParam.trim()) {
      return decodeURIComponent(boxParam).trim();
    }
  } catch {
    // abaikan jika parsing error
  }

  // 2. Fallback membaca hash params (#/?box=...)
  try {
    if (window.location.hash && window.location.hash.includes('?')) {
      const hashQuery = window.location.hash.split('?')[1];
      if (hashQuery) {
        const hashParams = new URLSearchParams(hashQuery);
        const boxParam = hashParams.get('box') || hashParams.get('id');
        if (boxParam && boxParam.trim()) {
          return decodeURIComponent(boxParam).trim();
        }
      }
    }
  } catch {
    // abaikan jika parsing error
  }

  return null;
}
