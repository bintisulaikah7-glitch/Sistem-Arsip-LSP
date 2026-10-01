/**
 * Konfigurasi URL Dinamis Portal LSP & Generator QR Code
 * Menggunakan URL dinamis berbasis window.location.origin + window.location.pathname
 * agar otomatis menyesuaikan domain di mana pun web dipublikasikan tanpa hardcode.
 */

/**
 * Menghasilkan Dynamic Base URL untuk QR Code:
 * Menggunakan `window.location.origin + window.location.pathname` secara dinamis
 * agar tautan otomatis berfungsi di domain apa pun (GitHub Pages, Cloud Run, localhost, dll.)
 */
export function getBasePortalUrl(): string {
  if (typeof window !== 'undefined' && window.location) {
    const origin = window.location.origin || '';
    let pathname = window.location.pathname || '/';
    // Bersihkan jika ada index.html di akhir pathname
    if (pathname.endsWith('index.html')) {
      pathname = pathname.substring(0, pathname.length - 'index.html'.length);
    }
    // Pastikan berakhiran '/'
    if (!pathname.endsWith('/')) {
      pathname = `${pathname}/`;
    }
    return `${origin}${pathname}`;
  }
  return '/';
}

/**
 * Menghasilkan link lengkap portal publik untuk boks arsip tertentu:
 * Format parameter URL untuk QR Code: ?boxId=[ID_BOKS]
 * Menggunakan URL dinamis berbasis window.location.origin + window.location.pathname
 */
export function getBoxPublicUrl(idBox: string): string {
  const cleanId = (idBox || '').trim();
  const base = getBasePortalUrl();
  const separator = base.includes('?') ? '&' : '?';
  return `${base}${separator}boxId=${encodeURIComponent(cleanId)}`;
}

/**
 * Menghasilkan URL gambar QR code SVG/PNG beresolusi tajam
 * yang meng-encode tautan boks dinamis (?boxId=[ID_BOKS]).
 */
export function getBoxQrImageUrl(idBox: string, size = 240): string {
  const targetUrl = getBoxPublicUrl(idBox);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(targetUrl)}`;
}

/**
 * Menghasilkan link lengkap portal untuk filter lokasi berkas LSP:
 * Format: [base]?pelatihan=...&lemari=...&rak=...
 */
export function getLocationPublicUrl(pelatihan: string, lemari: string, rak: string): string {
  const base = getBasePortalUrl();
  const params = new URLSearchParams();
  if (pelatihan && pelatihan.trim()) params.set('pelatihan', pelatihan.trim());
  if (lemari && lemari.trim()) params.set('lemari', lemari.trim());
  if (rak && rak.trim()) params.set('rak', rak.trim());
  const separator = base.includes('?') ? '&' : '?';
  return `${base}${separator}${params.toString()}`;
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
 * Memeriksa window.location.search dan window.location.hash
 */
export function getUrlLocationParams(): { pelatihan: string | null; lemari: string | null; rak: string | null } {
  if (typeof window === 'undefined') {
    return { pelatihan: null, lemari: null, rak: null };
  }

  let params: URLSearchParams | null = null;

  // 1. Cek dari window.location.search (?pelatihan=...)
  if (window.location.search) {
    params = new URLSearchParams(window.location.search);
  }

  // 2. Cek juga dari window.location.hash (#/?pelatihan=...)
  if (!params || (!params.get('pelatihan') && !params.get('lemari') && !params.get('rak'))) {
    if (window.location.hash && window.location.hash.includes('?')) {
      const hashQuery = window.location.hash.split('?')[1];
      if (hashQuery) {
        params = new URLSearchParams(hashQuery);
      }
    }
  }

  if (!params) {
    return { pelatihan: null, lemari: null, rak: null };
  }

  const pelatihan = params.get('pelatihan') ? decodeURIComponent(params.get('pelatihan')!).trim() : null;
  const lemari = params.get('lemari') ? decodeURIComponent(params.get('lemari')!).trim() : null;
  const rak = params.get('rak') ? decodeURIComponent(params.get('rak')!).trim() : null;

  return { pelatihan, lemari, rak };
}

/**
 * Mengambil nilai parameter boxId (atau fallback box/id) dari URL:
 * - Memeriksa window.location.search (?boxId=...)
 * - Fallback memeriksa window.location.hash jika ada hash routing (#/?boxId=...)
 * - Membersihkan decodeURIComponent dan spasi
 */
export function getUrlBoxParam(): string | null {
  if (typeof window === 'undefined') return null;

  // 1. Membaca standard search params (?boxId=...)
  try {
    const searchParams = new URLSearchParams(window.location.search);
    const boxParam = searchParams.get('boxId') || searchParams.get('box_id') || searchParams.get('box') || searchParams.get('id');
    if (boxParam && boxParam.trim()) {
      return decodeURIComponent(boxParam).trim();
    }
  } catch {
    // abaikan jika parsing error
  }

  // 2. Fallback membaca hash params (#/?boxId=... atau #boxId=...)
  try {
    if (window.location.hash) {
      const hashStr = window.location.hash;
      const qIndex = hashStr.indexOf('?');
      if (qIndex !== -1) {
        const hashParams = new URLSearchParams(hashStr.substring(qIndex));
        const boxParam = hashParams.get('boxId') || hashParams.get('box_id') || hashParams.get('box') || hashParams.get('id');
        if (boxParam && boxParam.trim()) {
          return decodeURIComponent(boxParam).trim();
        }
      } else if (hashStr.includes('=')) {
        const hashParams = new URLSearchParams(hashStr.replace(/^#\/?/, ''));
        const boxParam = hashParams.get('boxId') || hashParams.get('box_id') || hashParams.get('box') || hashParams.get('id');
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
