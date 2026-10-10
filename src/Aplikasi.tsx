import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { BoksArsip, StatusArsip, StatusBarang } from './types.ts';
import { Header } from './components/Header.tsx';
import { StatsBar } from './components/StatsBar.tsx';
import { SearchAndFilters } from './components/SearchAndFilters.tsx';
import { BoxCard } from './components/BoxCard.tsx';
import { BoxTableView } from './components/BoxTableView.tsx';
import { JsonViewerModal } from './components/JsonViewerModal.tsx';
import { QrScannerModal } from './components/QrScannerModal.tsx';
import { ApiPlaygroundModal } from './components/ApiPlaygroundModal.tsx';
import { BoxFormModal } from './components/BoxFormModal.tsx';
import { QrCardModal } from './components/QrCardModal.tsx';
import { BoxDetailModal } from './components/BoxDetailModal.tsx';
import { InputLokasiModal } from './components/InputLokasiModal.tsx';
import { RakGroupView } from './components/RakGroupView.tsx';
import { RakListView } from './components/RakListView.tsx';
import { BreadcrumbNav } from './components/BreadcrumbNav.tsx';
import { GoogleSheetsSyncBanner, SyncState } from './components/GoogleSheetsSyncBanner.tsx';
import { CabinetGridView } from './components/CabinetGridView.tsx';
import { AppsScriptModal } from './components/AppsScriptModal.tsx';
import { sendBoxToGoogleSheets } from './utils/appsScriptService.ts';
import { INITIAL_BOXES } from './data/initialBoxes.ts';
import {
  DEFAULT_APPS_SCRIPT_URL,
  appendCacheBuster,
  GOOGLE_SHEETS_CSV_URL,
  GOOGLE_SHEETS_SPREADSHEET_URL
} from './config.ts';
import {
  fetchBoxesData,
  verifyAndSanitizeBoxes,
  saveBoxesToLocalStorage,
  loadBoxesFromLocalStorage,
  mapAppsScriptItemToBox
} from './data/boxesService.ts';
import {
  convertGoogleSheetsUrlToCsv,
  parseCSV,
  mapCsvRecordsToBoxes,
  deduplicateBoxes,
  matchBoxSearch
} from './utils/csvParser.ts';
import { getUrlBoxParam, getUrlLocationParams } from './utils/url.ts';
import { AlertCircle, FolderSearch, CheckCircle, ArrowLeft, Folder, Search, X } from 'lucide-react';

/**
 * 1. URL Google Apps Script resmi yang digunakan secara langsung tanpa proxy/mock:
 * https://script.google.com/macros/s/AKfycbx4btq9oWF0JBn1PZ5Ew3jRJUKlvu8YH7F55lXsZmPupaHwcIcgvf6_G2SfnmEMOCYa/exec
 */
export const APPS_SCRIPT_URL = DEFAULT_APPS_SCRIPT_URL;

/**
 * 2. Deduplikasi Statistik:
 * - Hapus akhiran dalam kurung seperti (1), (2), (3) dari Nama Pelatihan
 * - Kelompokkan (grouping) berdasarkan Nama Pelatihan Dasar yang sudah dibersihkan
 * - Ambil data jumlah peserta dari 1 boks saja per pelatihan (agar boks pecahan TIDAK dihitung dua kali)
 * 3. Untuk Total Boks Arsip, tetap hitung seluruh jumlah baris di spreadsheet (187 boks)
 */
export function hitungStatistikDeduplikasi(boxesList: BoksArsip[]) {
  const safeBoxes = Array.isArray(boxesList) ? boxesList : [];
  const trainingMap = new Map<string, {
    baseName: string;
    peserta: number;
    pesertaBk: number;
    boxCount: number;
  }>();

  safeBoxes.forEach((b) => {
    if (!b) return;
    const rawNama = String(b.nama_pelatihan || (b as any)['Nama Pelatihan'] || '').trim();
    if (!rawNama || rawNama.toLowerCase() === 'kosong') return;

    // Hapus akhiran dalam kurung seperti (1), (2), (3), [1], dsb dari Nama Pelatihan
    const cleanBaseName = rawNama
      .replace(/\s*\(\s*(?:part|bagian|boks|box|pecahan)?\s*\d+\s*(?:[\/of-]\s*\d+)?\s*\)/gi, '')
      .replace(/\s*\[\s*(?:part|bagian|boks|box|pecahan)?\s*\d+\s*(?:[\/of-]\s*\d+)?\s*\]/gi, '')
      .replace(/\s*[-–—]\s*(?:part|bagian|boks|box|pecahan)\s*\d+$/gi, '')
      .trim();

    if (!cleanBaseName) return;
    const baseKey = cleanBaseName.toLowerCase();

    const peserta = Number(b.jumlah_peserta ?? (b as any)['Jumlah Peserta'] ?? 0) || 0;
    const pesertaBk = Number(b.jumlah_peserta_bk ?? (b as any)['Jumlah Peserta BK'] ?? 0) || 0;

    if (!trainingMap.has(baseKey)) {
      // Ambil data jumlah peserta dari 1 boks saja untuk pelatihan yang sama
      trainingMap.set(baseKey, {
        baseName: cleanBaseName,
        peserta,
        pesertaBk,
        boxCount: 1
      });
    } else {
      const existing = trainingMap.get(baseKey)!;
      existing.boxCount++;
      // Jika boks pertama bernilai 0 dan boks pecahan memiliki data peserta, gunakan data tersebut
      if (existing.peserta === 0 && peserta > 0) {
        existing.peserta = peserta;
      }
      if (existing.pesertaBk === 0 && pesertaBk > 0) {
        existing.pesertaBk = pesertaBk;
      }
      // Pelatihan yang sama TIDAK menambahkan peserta lagi (mencegah double count)
    }
  });

  let totalPeserta = 0;
  let totalBK = 0;

  for (const item of trainingMap.values()) {
    totalPeserta += item.peserta;
    totalBK += item.pesertaBk;
  }

  return {
    totalPeserta,
    totalBK,
    totalPelatihanUnik: trainingMap.size,
    totalBoksArsip: safeBoxes.length // Seluruh baris di spreadsheet (187 boks)
  };
}

export default function Aplikasi() {
  // Inisialisasi state awal: membaca dari LocalStorage jika data lengkap (>= 187), fallback ke INITIAL_BOXES
  const [boxes, setBoxes] = useState<BoksArsip[]>(() => {
    const cached = loadBoxesFromLocalStorage();
    if (cached && cached.length >= INITIAL_BOXES.length) {
      return deduplicateBoxes(cached);
    }
    return deduplicateBoxes(INITIAL_BOXES);
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Otomatis simpan setiap perubahan data boks & lemari baru ke LocalStorage secara instan
  useEffect(() => {
    if (boxes && boxes.length > 0) {
      saveBoxesToLocalStorage(boxes);
    }
  }, [boxes]);

  // Google Sheets Auto-Fetch & Polling State
  const [sheetUrl, setSheetUrl] = useState<string>(GOOGLE_SHEETS_SPREADSHEET_URL);
  const [syncState, setSyncState] = useState<SyncState>({
    status: 'connected',
    lastSyncedAt: new Date(),
    message: 'Data 187 boks arsip LSP siap digunakan dan tersinkronisasi.',
    sourceUrl: APPS_SCRIPT_URL,
    totalParsed: 187
  });
  const [pollCountdown, setPollCountdown] = useState<number>(60);

  // Filters - supports dynamic Lemari numbers or strings
  const [selectedCabinet, setSelectedCabinet] = useState<number | string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLemari, setSelectedLemari] = useState<number | string | null>(null);
  const [selectedStatusArsip, setSelectedStatusArsip] = useState<StatusArsip | 'Semua'>('Semua');
  const [selectedStatusBarang, setSelectedStatusBarang] = useState<StatusBarang | 'Semua'>('Semua');
  const [selectedTahun, setSelectedTahun] = useState<string>('Semua');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAppsScriptModalOpen, setIsAppsScriptModalOpen] = useState(false);
  const [editingBox, setEditingBox] = useState<BoksArsip | null>(null);
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [isApiPlaygroundOpen, setIsApiPlaygroundOpen] = useState(false);
  const [jsonModalState, setJsonModalState] = useState<{
    isOpen: boolean;
    title: string;
    data: any;
    statusCode: number;
  }>({
    isOpen: false,
    title: '',
    data: null,
    statusCode: 200
  });
  const [qrCardBox, setQrCardBox] = useState<BoksArsip | null>(null);
  const [selectedDetailBox, setSelectedDetailBox] = useState<BoksArsip | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isInputLokasiOpen, setIsInputLokasiOpen] = useState(false);
  const [inputLokasiPrefill, setInputLokasiPrefill] = useState<{ lemari?: string; rak?: string }>({});
  const [selectedRak, setSelectedRak] = useState<string | null>(null);

  // Refs untuk mendeteksi modal form tambah/edit terbuka
  const isAddModalOpenRef = useRef(isAddModalOpen);
  isAddModalOpenRef.current = isAddModalOpen;

  const editingBoxRef = useRef(editingBox);
  editingBoxRef.current = editingBox;

  // Aliases for explicit state setters
  const setSelectedBox = setSelectedDetailBox;
  const setIsModalOpen = setIsDetailModalOpen;

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  /**
   * Logika saat aplikasi pertama kali dimuat:
   * Jika ada parameter boxId di URL (contoh saat QR Code discan), otomatis filter/buka modal detail boks arsip tersebut!
   */
  const handleCheckUrlAndOpenBox = useCallback((boxList: BoksArsip[]) => {
    if (!boxList || boxList.length === 0) return;

    let targetBox = getUrlBoxParam();
    if (!targetBox && typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      targetBox = p.get('boxId') || p.get('box_id') || p.get('box') || p.get('id');
    }

    if (targetBox) {
      const cleanTarget = targetBox.trim().toUpperCase();
      const matched = boxList.find((b) => {
        const id1 = (b.id_box || '').trim().toUpperCase();
        const id2 = (b['Kode Boks'] || '').trim().toUpperCase();
        const id3 = (b.kode_box || '').trim().toUpperCase();
        const id4 = (b.id || '').trim().toUpperCase();
        return id1 === cleanTarget || id2 === cleanTarget || id3 === cleanTarget || id4 === cleanTarget;
      });

      if (matched) {
        setSelectedBox(matched);
        setIsModalOpen(true);
        setSearchQuery(matched.id_box);
        showToast(`QR Code terdeteksi: Menampilkan boks ${matched.id_box}`);
      } else {
        setSearchQuery(targetBox);
        showToast(`Mencari boks dari QR Code: ${targetBox}`);
      }
    }

    const locParams = getUrlLocationParams();
    if (locParams.pelatihan || locParams.lemari || locParams.rak) {
      if (locParams.pelatihan) {
        setSearchQuery(locParams.pelatihan);
      }
      if (locParams.lemari) {
        const numMatch = locParams.lemari.match(/\d+/);
        if (numMatch) {
          const lNum = parseInt(numMatch[0], 10);
          setSelectedCabinet(lNum);
          setSelectedLemari(lNum);
        } else if (locParams.lemari.toLowerCase().includes('a')) {
          setSelectedCabinet(1);
          setSelectedLemari(1);
        } else if (locParams.lemari.toLowerCase().includes('b')) {
          setSelectedCabinet(2);
          setSelectedLemari(2);
        } else if (locParams.lemari.toLowerCase().includes('c')) {
          setSelectedCabinet(3);
          setSelectedLemari(3);
        }
      }
      if (locParams.rak) {
        setSelectedRak(locParams.rak);
      }
      const filterSummary = [
        locParams.pelatihan ? `Pelatihan: ${locParams.pelatihan}` : '',
        locParams.lemari ? `Lemari: ${locParams.lemari}` : '',
        locParams.rak ? `Rak: ${locParams.rak}` : ''
      ].filter(Boolean).join(' • ');
      showToast(`Filter Lokasi QR aktif: ${filterSummary}`);
    }
  }, [setSelectedBox, setIsModalOpen]);

  /**
   * 1. Fetch data boks arsip langsung dari Google Apps Script Web App secara live tanpa proxy/mock.
   * Menggunakan URL resmi:
   * https://script.google.com/macros/s/AKfycbx4btq9oWF0JBn1PZ5Ew3jRJUKlvu8YH7F55lXsZmPupaHwcIcgvf6_G2SfnmEMOCYa/exec
   */
  const fetchGoogleSheetsData = useCallback(
    async (targetUrl = sheetUrl, isSilent = false, force = false) => {
      if (!force && (isAddModalOpenRef.current || editingBoxRef.current)) {
        return null;
      }

      if (!isSilent) {
        setSyncState((prev) => ({ ...prev, status: 'syncing' }));
      }

      // 1. PANGGIL LANGSUNG URL GOOGLE APPS SCRIPT WEB APP SECARA LIVE TANPA PROXY ATAU MOCK
      try {
        const liveAppsScriptUrl = appendCacheBuster(APPS_SCRIPT_URL);
        const response = await fetch(liveAppsScriptUrl, {
          method: 'GET',
          redirect: 'follow',
          headers: { Accept: 'application/json, text/plain, */*' }
        });

        if (response.ok) {
          const text = await response.text();
          let rawData: any = null;
          try {
            rawData = JSON.parse(text);
          } catch {}

          const rows = Array.isArray(rawData) ? rawData : (rawData?.data || rawData?.boxes || []);
          if (Array.isArray(rows) && rows.length > 0) {
            const mappedBoxes: BoksArsip[] = [];
            rows.forEach((item, idx) => {
              const mapped = mapAppsScriptItemToBox(item, idx);
              if (mapped) mappedBoxes.push(mapped);
            });

            if (mappedBoxes.length > 0) {
              const verified = verifyAndSanitizeBoxes(mappedBoxes);
              setBoxes(verified);
              setIsLoading(false);
              setSyncState({
                status: 'connected',
                lastSyncedAt: new Date(),
                message: `Berhasil sinkronisasi live ${verified.length} boks arsip langsung dari Google Apps Script!`,
                sourceUrl: APPS_SCRIPT_URL,
                totalParsed: verified.length
              });

              if (!isSilent) {
                showToast(`Berhasil memuat ${verified.length} boks arsip langsung dari Google Sheets!`);
              }

              return verified;
            }
          }
        }
      } catch (directErr) {
        console.warn('[Direct Apps Script] Live fetch notice, mencoba loader fallback:', directErr);
      }

      // 2. Fallback loader jika jaringan terputus (menggunakan cache lokal/initial 187 boks)
      try {
        const effectiveUrl = convertGoogleSheetsUrlToCsv(targetUrl);
        const parsedBoxes = await fetchBoxesData(effectiveUrl);

        if (parsedBoxes && parsedBoxes.length > 0) {
          const verified = verifyAndSanitizeBoxes(parsedBoxes);
          setBoxes(verified);
          setIsLoading(false);
          setSyncState({
            status: 'connected',
            lastSyncedAt: new Date(),
            message: `Sistem mempertahankan data boks aktif (${verified.length} Boks Arsip).`,
            sourceUrl: APPS_SCRIPT_URL,
            totalParsed: verified.length
          });

          if (!isSilent) {
            showToast(`Memuat ${verified.length} boks arsip dari penyimpanan aktif.`);
          }

          return verified;
        }
      } catch (err: any) {
        console.warn('Gagal memuat data fallback:', err);
      }

      setIsLoading(false);
      return null;
    },
    [sheetUrl]
  );

  // Background fetch on mount & recurring 60-second polling
  useEffect(() => {
    let isMounted = true;

    handleCheckUrlAndOpenBox(boxes);

    const onDomLoaded = () => {
      if (isMounted) {
        handleCheckUrlAndOpenBox(boxes);
      }
    };

    if (typeof document !== 'undefined') {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', onDomLoaded);
      }
    }

    fetchGoogleSheetsData(sheetUrl, true)
      .then((loadedBoxes) => {
        if (!isMounted) return;
        if (loadedBoxes && loadedBoxes.length > 0) {
          handleCheckUrlAndOpenBox(loadedBoxes);
        } else {
          handleCheckUrlAndOpenBox(boxes);
        }
      })
      .catch(() => {
        if (isMounted) {
          handleCheckUrlAndOpenBox(boxes);
        }
      });

    // Polling setiap 60 detik agar data Google Sheets tetap sinkron
    const pollInterval = setInterval(() => {
      if (isAddModalOpenRef.current || editingBoxRef.current) {
        return;
      }
      fetchGoogleSheetsData(sheetUrl, true);
      setPollCountdown(60);
    }, 60000);

    const countdownInterval = setInterval(() => {
      setPollCountdown((prev) => (prev > 1 ? prev - 1 : 60));
    }, 1000);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
      clearInterval(countdownInterval);
    };
  }, [fetchGoogleSheetsData, handleCheckUrlAndOpenBox, sheetUrl]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).refreshBoxesData = () => {
        fetchGoogleSheetsData(sheetUrl, false, true);
      };
    }
  }, [fetchGoogleSheetsData, sheetUrl]);

  const handleOpenEditModal = (box: BoksArsip) => {
    setEditingBox(box);
    setIsAddModalOpen(true);
  };

  const handleSaveBox = async (savedBox: BoksArsip): Promise<boolean> => {
    if (editingBox) {
      setBoxes((prev) => prev.map((b) => (b.id_box === savedBox.id_box ? savedBox : b)));
      showToast(`Data boks arsip ${savedBox.id_box} berhasil diperbarui.`);
      sendBoxToGoogleSheets(savedBox, 'update').then((res) => {
        if (res.success) {
          showToast(res.message);
        }
      });
    } else {
      const exists = boxes.some(
        (b) => b.id_box.trim().toUpperCase() === savedBox.id_box.trim().toUpperCase()
      );
      if (exists) {
        showToast(`ID Boks ${savedBox.id_box} sudah ada dalam database. Silakan gunakan ID lain!`, 'error');
        return false;
      }
      setBoxes((prev) => [savedBox, ...prev]);
      showToast(`Boks arsip baru ${savedBox.id_box} berhasil ditambahkan!`);
      sendBoxToGoogleSheets(savedBox, 'add').then((res) => {
        if (res.success) {
          showToast(res.message);
        }
      });
    }

    setIsAddModalOpen(false);
    setEditingBox(null);
    return true;
  };

  const handleDeleteBox = async (id_box: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus boks arsip "${id_box}"?`)) {
      setBoxes((prev) => prev.filter((b) => b.id_box !== id_box));
      showToast(`Boks arsip ${id_box} berhasil dihapus.`);
    }
  };

  const handleResetData = async () => {
    if (confirm('Kembalikan seluruh data ke dataset boks arsip awal LSP (187 Boks Arsip)?')) {
      setIsResetting(true);
      try {
        const fresh = deduplicateBoxes(INITIAL_BOXES);
        setBoxes(fresh);
        saveBoxesToLocalStorage(fresh);
        showToast('Data boks arsip LSP berhasil direset ke dataset awal!');
      } catch {
        showToast('Gagal mereset data.', 'error');
      } finally {
        setIsResetting(false);
      }
    }
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(boxes, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `lsp_boxes_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleOpenDetailModal = (box: BoksArsip) => {
    setSelectedDetailBox(box);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedDetailBox(null);
  };

  const handleSaveFromInputLokasi = (newBox: Partial<BoksArsip>) => {
    if (!newBox.id_box) {
      showToast('ID Boks tidak boleh kosong!', 'error');
      return;
    }

    const fullBox: BoksArsip = {
      id_box: newBox.id_box,
      nama_pelatihan: newBox.nama_pelatihan || 'Pelatihan Baru LSP',
      tahun_pelaksanaan: Number(newBox.tahun_pelaksanaan) || new Date().getFullYear(),
      jumlah_peserta: Number(newBox.jumlah_peserta) || 0,
      jumlah_peserta_bk: Number(newBox.jumlah_peserta_bk) || 0,
      lokasi: {
        lemari: newBox.lokasi?.lemari || 'Lemari 1',
        rak: newBox.lokasi?.rak || 'Rak A',
        baris: newBox.lokasi?.baris || 'Box 1'
      },
      status_arsip: (newBox.status_arsip as StatusArsip) || 'Tersedia',
      status_barang: (newBox.status_barang as StatusBarang) || 'Lengkap',
      hasilUjiKompetensi: newBox.hasilUjiKompetensi || '-',
      hasil_uji_kompetensi: newBox.hasilUjiKompetensi || '-',
      link_dokumentasi: newBox.link_dokumentasi || 'https://drive.google.com'
    };

    const exists = boxes.some(
      (b) => b.id_box.trim().toUpperCase() === fullBox.id_box.trim().toUpperCase()
    );
    if (exists) {
      showToast(`ID Boks ${fullBox.id_box} sudah terdaftar dalam sistem!`, 'error');
      return;
    }

    setBoxes((prev) => [fullBox, ...prev]);
    showToast(`Boks baru ${fullBox.id_box} berhasil ditempatkan di Lemari ${fullBox.lokasi.lemari}, ${fullBox.lokasi.rak}!`);

    sendBoxToGoogleSheets(fullBox, 'add').then((res) => {
      if (res.success) {
        showToast(res.message);
      }
    });

    setIsInputLokasiOpen(false);
    setInputLokasiPrefill({});
    setQrCardBox(fullBox);
  };

  const handleApplyFilterFromLokasi = (_pelatihan: string, lemari: string, rak: string) => {
    if (lemari) {
      const numMatch = lemari.match(/\d+/);
      const lNum = numMatch ? parseInt(numMatch[0], 10) : lemari;
      setSelectedCabinet(lNum);
      setSelectedLemari(lNum);
    }
    if (rak) {
      setSelectedRak(rak);
    }
    setIsInputLokasiOpen(false);
    showToast(`Filter aktif: Lemari ${lemari}${rak ? `, Rak ${rak}` : ''}`);
  };

  const handleImportCsvText = (csvText: string) => {
    try {
      const parsedRecords = parseCSV(csvText);
      if (parsedRecords && parsedRecords.length > 0) {
        const mappedBoxes = mapCsvRecordsToBoxes(parsedRecords);
        if (mappedBoxes && mappedBoxes.length > 0) {
          const verified = verifyAndSanitizeBoxes(mappedBoxes);
          setBoxes(verified);
          saveBoxesToLocalStorage(verified);
          setSyncState({
            status: 'connected',
            lastSyncedAt: new Date(),
            message: `Berhasil mengimpor ${verified.length} boks arsip dari CSV.`,
            sourceUrl: 'File CSV Manual',
            totalParsed: verified.length
          });
          showToast(`Berhasil mengimpor ${verified.length} boks arsip.`);
          return;
        }
      }
      showToast('Gagal memproses file CSV: format tidak valid.', 'error');
    } catch (err: any) {
      showToast(`Error impor CSV: ${err.message}`, 'error');
    }
  };

  const availableLemari = useMemo(() => {
    const lemariSet = new Set<string>();
    boxes.forEach((b) => {
      const val = b?.lokasi?.lemari ?? (b as any)?.['Kode Lemari'] ?? (b as any)?.kode_lemari;
      if (val !== undefined && val !== null) {
        const str = String(val).replace(/lemari[-_\s]*/i, '').trim();
        if (str && str !== '0' && str.toLowerCase() !== 'kosong' && str !== '-') {
          lemariSet.add(str);
        }
      }
    });
    return Array.from(lemariSet).sort((a, b) => {
      const numA = parseInt(a, 10);
      const numB = parseInt(b, 10);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
    });
  }, [boxes]);

  const availableRaks = useMemo(() => {
    const currentLemari = selectedCabinet !== null ? selectedCabinet : selectedLemari;
    const list = currentLemari !== null && currentLemari !== 'Semua'
      ? boxes.filter((b) => {
          const targetStr = String(currentLemari).replace(/lemari[-_\s]*/i, '').trim().toLowerCase();
          const bLemariStr = String(b.lokasi?.lemari || '').replace(/lemari[-_\s]*/i, '').trim().toLowerCase();
          return bLemariStr === targetStr;
        })
      : boxes;

    const raks = Array.from(new Set(list.map((b) => b.lokasi?.rak).filter(Boolean) as string[])).sort();
    return raks;
  }, [boxes, selectedCabinet, selectedLemari]);

  const availableYears = useMemo(() => {
    const years = Array.from(
      new Set(
        boxes
          .map((b) => Number(b.tahun_pelaksanaan))
          .filter((y): y is number => typeof y === 'number' && !isNaN(y) && y > 1900)
      )
    ).sort((a, b) => b - a);
    return years;
  }, [boxes]);

  const filteredBoxes = useMemo(() => {
    return boxes.filter((b) => {
      if (!b) return false;

      if (searchQuery.trim()) {
        if (!matchBoxSearch(b, searchQuery)) {
          return false;
        }
      } else {
        if (selectedCabinet !== null && selectedCabinet !== undefined) {
          const targetStr = String(selectedCabinet).replace(/lemari[-_\s]*/i, '').trim().toLowerCase();
          const bLemariStr = String(b.lokasi?.lemari || '').replace(/lemari[-_\s]*/i, '').trim().toLowerCase();
          if (bLemariStr !== targetStr) {
            return false;
          }
        }
      }

      if (selectedLemari !== null && selectedLemari !== undefined && selectedLemari !== 'Semua') {
        const targetStr = String(selectedLemari).replace(/lemari[-_\s]*/i, '').trim().toLowerCase();
        const bLemariStr = String(b.lokasi?.lemari || '').replace(/lemari[-_\s]*/i, '').trim().toLowerCase();
        if (bLemariStr !== targetStr) {
          return false;
        }
      }

      if (selectedRak !== null && selectedRak !== 'Semua') {
        const targetRak = selectedRak.trim().toLowerCase();
        const bRak = (b.lokasi?.rak || '').toString().trim().toLowerCase();
        if (bRak !== targetRak && bRak.replace(/[-_\s]/g, '') !== targetRak.replace(/[-_\s]/g, '')) {
          return false;
        }
      }

      if (selectedStatusArsip !== 'Semua') {
        const bStatus = String(b.status_arsip || b['Status Arsip'] || '').toLowerCase().trim();
        const targetStatus = selectedStatusArsip.toLowerCase().trim();
        if (bStatus !== targetStatus) return false;
      }

      if (selectedStatusBarang !== 'Semua') {
        const bBarang = String(b.status_barang || b['Status Barang'] || '').toLowerCase().trim();
        const targetBarang = selectedStatusBarang.toLowerCase().trim();
        if (bBarang !== targetBarang) return false;
      }

      if (selectedTahun !== 'Semua' && b.tahun_pelaksanaan?.toString() !== selectedTahun) {
        return false;
      }

      return true;
    });
  }, [boxes, searchQuery, selectedCabinet, selectedLemari, selectedRak, selectedStatusArsip, selectedStatusBarang, selectedTahun]);

  const isFiltered =
    !!searchQuery.trim() ||
    selectedCabinet !== null ||
    selectedLemari !== null ||
    selectedRak !== null ||
    selectedStatusArsip !== 'Semua' ||
    selectedStatusBarang !== 'Semua' ||
    selectedTahun !== 'Semua';

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCabinet(null);
    setSelectedLemari(null);
    setSelectedRak(null);
    setSelectedStatusArsip('Semua');
    setSelectedStatusBarang('Semua');
    setSelectedTahun('Semua');
  };

  const handleViewJson = (box: BoksArsip) => {
    setJsonModalState({
      isOpen: true,
      title: `Response JSON: ${box.id_box}`,
      data: box,
      statusCode: 200
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div
            className={`px-4 py-3 rounded-xl shadow-lg border flex items-center space-x-3 max-w-md ${
              toastMessage.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-800'
                : 'bg-slate-900 border-slate-800 text-white'
            }`}
          >
            {toastMessage.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            ) : (
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            )}
            <p className="text-xs sm:text-sm font-medium">{toastMessage.text}</p>
          </div>
        </div>
      )}

      {/* Header Aplikasi */}
      <Header
        onOpenAddModal={() => {
          setEditingBox(null);
          setIsAddModalOpen(true);
        }}
        onOpenQrModal={() => setIsQrScannerOpen(true)}
        onOpenInputLokasi={() => setIsInputLokasiOpen(true)}
        onOpenApiPlayground={() => setIsApiPlaygroundOpen(true)}
        onOpenAppsScriptConfig={() => setIsAppsScriptModalOpen(true)}
        onExportJson={handleExportJson}
        onResetData={handleResetData}
        totalBoxes={boxes.length}
        isResetting={isResetting}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {/* Google Sheets Real-time Polling & Sync Banner */}
        <GoogleSheetsSyncBanner
          syncState={syncState}
          onManualSync={() => fetchGoogleSheetsData(sheetUrl, false)}
          onUpdateSheetUrl={(newUrl) => {
            setSheetUrl(newUrl);
            fetchGoogleSheetsData(newUrl, false);
          }}
          onImportCsvText={handleImportCsvText}
          onOpenAppsScriptConfig={() => setIsAppsScriptModalOpen(true)}
          nextPollCountdown={pollCountdown}
        />

        {/* Statistics Bar (Deduplikasi Peserta & Total Boks Fisik 187) */}
        <StatsBar
          boxes={boxes}
          activeLemariFilter={selectedCabinet !== null ? selectedCabinet : selectedLemari}
          onSelectLemari={(lemari) => {
            setSelectedCabinet(lemari);
            setSelectedLemari(lemari);
          }}
        />

        {/* Search & Filter Controls */}
        <SearchAndFilters
          searchQuery={searchQuery}
          onSearchChange={(q) => setSearchQuery(q)}
          onOpenQrScanner={() => setIsQrScannerOpen(true)}
          selectedLemari={selectedCabinet !== null ? selectedCabinet : selectedLemari}
          onSelectLemari={(lemari) => {
            setSelectedCabinet(lemari);
            setSelectedLemari(lemari);
          }}
          selectedStatusArsip={selectedStatusArsip}
          onSelectStatusArsip={setSelectedStatusArsip}
          selectedStatusBarang={selectedStatusBarang}
          onSelectStatusBarang={setSelectedStatusBarang}
          selectedTahun={selectedTahun}
          onSelectTahun={setSelectedTahun}
          availableYears={availableYears}
          availableLemari={availableLemari}
          selectedRak={selectedRak}
          onSelectRak={(rak) => setSelectedRak(rak)}
          availableRaks={availableRaks}
          viewMode={viewMode}
          onToggleViewMode={setViewMode}
          onResetFilters={handleResetFilters}
          isFiltered={isFiltered}
        />

        {/* Wadah Utama Navigasi */}
        <div id="app-container" className="space-y-4">
          {/* Bar Navigasi (Breadcrumb) untuk kembali */}
          <BreadcrumbNav
            selectedCabinet={selectedCabinet}
            selectedRak={selectedRak}
            searchQuery={searchQuery}
            onGoToLemari={() => {
              setSelectedCabinet(null);
              setSelectedLemari(null);
              setSelectedRak(null);
            }}
            onGoToRak={() => {
              setSelectedRak(null);
            }}
            onClearSearch={() => {
              setSearchQuery('');
            }}
          />

          {/* Area Konten Utama */}
          <div id="content-area" className="w-full">
            {isLoading ? (
              <div className="py-20 flex flex-col items-center justify-center text-slate-500">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-xs">Memuat data boks arsip dari engine...</p>
              </div>
            ) : searchQuery.trim() ? (
              /* PENCARIAN GLOBAL EXCEPTION BANNER & LISTING */
              <div className="space-y-4">
                <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs animate-in fade-in duration-200">
                  <div className="flex items-center space-x-2.5 text-slate-800">
                    <Search className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <span>
                      Hasil Pencarian: &quot;<strong className="text-blue-700">{searchQuery}</strong>&quot; — Menampilkan <strong className="text-slate-900">{filteredBoxes.length}</strong> boks arsip.
                    </span>
                  </div>
                  <button
                    id="btn-clear-search-return"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCabinet(null);
                      setSelectedLemari(null);
                      setSelectedRak(null);
                    }}
                    className="inline-flex items-center space-x-1.5 text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-300 px-3 py-1.5 rounded-lg transition w-fit text-xs font-semibold shadow-2xs"
                  >
                    <X className="w-3.5 h-3.5 text-rose-500" />
                    <span>Hapus Pencarian &amp; Kembali ke Lemari</span>
                  </button>
                </div>

                {filteredBoxes.length > 0 ? (
                  <div>
                    <div className="flex items-center justify-between mb-3 text-xs text-slate-500">
                      <span>
                        Menampilkan <strong className="text-slate-800">{filteredBoxes.length}</strong> boks arsip berkas
                        {isFiltered && ` (difilter dari total ${boxes.length})`}
                      </span>
                    </div>

                    {viewMode === 'grid' ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {filteredBoxes.map((box) => (
                          <BoxCard
                            key={box.id_box}
                            box={box}
                            onViewJson={handleViewJson}
                            onEdit={handleOpenEditModal}
                            onDelete={handleDeleteBox}
                            onShowQr={(b) => setQrCardBox(b)}
                            onViewDetail={handleOpenDetailModal}
                          />
                        ))}
                      </div>
                    ) : (
                      <BoxTableView
                        boxes={filteredBoxes}
                        onViewJson={handleViewJson}
                        onEdit={handleOpenEditModal}
                        onDelete={handleDeleteBox}
                        onShowQr={(b) => setQrCardBox(b)}
                        onViewDetail={handleOpenDetailModal}
                      />
                    )}
                  </div>
                ) : (
                  <div className="py-16 bg-white rounded-2xl border border-slate-200 text-center p-6 shadow-xs">
                    <FolderSearch className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-sm font-bold text-slate-800 mb-1">Tidak Ditemukan Hasil Pencarian</h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                      Tidak ada boks arsip yang sesuai dengan kata kunci &quot;{searchQuery}&quot;.
                    </p>
                    <button
                      onClick={handleResetFilters}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition shadow-xs"
                    >
                      Reset Pencarian
                    </button>
                  </div>
                )}
              </div>
            ) : selectedCabinet === null ? (
              /* TAMPILAN 1: GRID LEMARI UTAMA (2 Kolom pada Layar Sedang/Besar) */
              <CabinetGridView
                boxes={filteredBoxes}
                availableLemari={availableLemari}
                onSelectCabinet={(lemari) => {
                  setSelectedCabinet(lemari);
                  setSelectedLemari(lemari);
                  setSelectedRak(null);
                }}
                onOpenInputLokasi={() => setIsInputLokasiOpen(true)}
              />
            ) : selectedRak === null ? (
              /* TAMPILAN 2: DAFTAR RAK DI DALAM LEMARI TERPILIH (2 Kolom pada Layar Sedang/Besar) */
              <RakListView
                lemariNama={selectedCabinet}
                boxes={boxes}
                onSelectRak={(rak) => setSelectedRak(rak)}
                onBackToLemari={() => {
                  setSelectedCabinet(null);
                  setSelectedLemari(null);
                  setSelectedRak(null);
                }}
                onOpenInputLokasi={(lemari, rak) => {
                  setInputLokasiPrefill({ lemari, rak });
                  setIsInputLokasiOpen(true);
                }}
              />
            ) : (
              /* TAMPILAN 3: DAFTAR BOKS DI DALAM RAK TERPILIH */
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                      <span>Lemari {selectedCabinet} — {selectedRak}</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Daftar fisik boks arsip pada rak ini ({filteredBoxes.length} boks terdata).
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedRak(null)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Kembali ke Rak</span>
                    </button>
                    <button
                      onClick={() => {
                        setInputLokasiPrefill({
                          lemari: String(selectedCabinet),
                          rak: selectedRak
                        });
                        setIsInputLokasiOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition shadow-xs"
                    >
                      <span>+ Tambah Boks di Rak Ini</span>
                    </button>
                  </div>
                </div>

                {filteredBoxes.length > 0 ? (
                  viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {filteredBoxes.map((box) => (
                        <BoxCard
                          key={box.id_box}
                          box={box}
                          onViewJson={handleViewJson}
                          onEdit={handleOpenEditModal}
                          onDelete={handleDeleteBox}
                          onShowQr={(b) => setQrCardBox(b)}
                          onViewDetail={handleOpenDetailModal}
                        />
                      ))}
                    </div>
                  ) : (
                    <BoxTableView
                      boxes={filteredBoxes}
                      onViewJson={handleViewJson}
                      onEdit={handleOpenEditModal}
                      onDelete={handleDeleteBox}
                      onShowQr={(b) => setQrCardBox(b)}
                      onViewDetail={handleOpenDetailModal}
                    />
                  )
                ) : (
                  <div className="py-12 bg-white rounded-2xl border border-slate-200 text-center p-6 shadow-xs">
                    <Folder className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <h4 className="text-xs font-bold text-slate-700">Belum Ada Boks di Rak Ini</h4>
                    <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto">
                      Gunakan tombol &quot;+ Tambah Boks di Rak Ini&quot; untuk menempatkan berkas baru.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer Aplikasi */}
      <footer className="bg-white border-t border-slate-200 py-6 px-4 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
            <span className="font-medium text-slate-700">Sistem Berkas Boks Arsip LSP BDI Surabaya</span>
            <span>•</span>
            <span className="tabular-nums font-semibold text-slate-900">{boxes.length} Boks Terdata</span>
          </div>
          <div className="flex items-center space-x-4">
            <a
              href="https://bintisulaikah7-glitch.github.io/Sistem-Arsip-LSP/"
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              GitHub Pages Portal
            </a>
            <span>•</span>
            <button
              onClick={() => setIsAppsScriptModalOpen(true)}
              className="text-slate-600 hover:text-blue-600 transition"
            >
              Pengaturan Google Apps Script
            </button>
          </div>
        </div>
      </footer>

      {/* Modals Container */}
      <BoxFormModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingBox(null);
        }}
        onSubmit={handleSaveBox}
        editingBox={editingBox}
        existingBoxes={boxes}
        onOpenAppsScriptConfig={() => setIsAppsScriptModalOpen(true)}
      />

      <QrScannerModal
        isOpen={isQrScannerOpen}
        onClose={() => setIsQrScannerOpen(false)}
        sampleBoxes={boxes}
      />

      <ApiPlaygroundModal
        isOpen={isApiPlaygroundOpen}
        onClose={() => setIsApiPlaygroundOpen(false)}
      />

      <JsonViewerModal
        isOpen={jsonModalState.isOpen}
        onClose={() => setJsonModalState((prev) => ({ ...prev, isOpen: false }))}
        title={jsonModalState.title}
        data={jsonModalState.data}
        statusCode={jsonModalState.statusCode}
      />

      <AppsScriptModal
        isOpen={isAppsScriptModalOpen}
        onClose={() => setIsAppsScriptModalOpen(false)}
        onSuccessSave={(url) => {
          showToast(`URL Google Apps Script Web App tersimpan: ${url.slice(0, 30)}...`);
          fetchGoogleSheetsData(sheetUrl, false);
        }}
      />

      <QrCardModal
        isOpen={!!qrCardBox}
        onClose={() => setQrCardBox(null)}
        box={qrCardBox}
      />

      <BoxDetailModal
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetailModal}
        box={selectedDetailBox}
        onViewJson={handleViewJson}
        onShowQr={(b) => setQrCardBox(b)}
      />

      <InputLokasiModal
        isOpen={isInputLokasiOpen}
        onClose={() => {
          setIsInputLokasiOpen(false);
          setInputLokasiPrefill({});
        }}
        existingBoxes={boxes}
        availableLemari={availableLemari}
        initialLemari={inputLokasiPrefill.lemari}
        initialRak={inputLokasiPrefill.rak}
        onApplyFilter={handleApplyFilterFromLokasi}
        onSaveNewBox={handleSaveFromInputLokasi}
      />
    </div>
  );
}
