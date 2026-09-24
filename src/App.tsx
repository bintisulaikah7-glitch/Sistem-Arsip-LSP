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
import { PelatihanRakView } from './components/PelatihanRakView.tsx';
import { BreadcrumbNav } from './components/BreadcrumbNav.tsx';
import { GoogleSheetsSyncBanner, SyncState } from './components/GoogleSheetsSyncBanner.tsx';
import { CabinetGridView } from './components/CabinetGridView.tsx';
import { INITIAL_BOXES } from './data/initialBoxes.ts';
import {
  GOOGLE_SHEETS_CSV_URL,
  GOOGLE_SHEETS_SPREADSHEET_URL,
  convertGoogleSheetsUrlToCsv,
  parseCSV,
  mapCsvRecordsToBoxes,
  deduplicateBoxes,
  matchBoxSearch
} from './utils/csvParser.ts';
import { getUrlBoxParam, getUrlLocationParams } from './utils/url.ts';
import { AlertCircle, FolderSearch, CheckCircle, Database, ArrowLeft, Folder, Search, X, Layers, QrCode } from 'lucide-react';

export default function App() {
  // Overwrite state completely with deduplicated initial boxes
  const [boxes, setBoxes] = useState<BoksArsip[]>(() => deduplicateBoxes(INITIAL_BOXES));
  const [isLoading, setIsLoading] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Google Sheets Auto-Fetch & Polling State
  const [sheetUrl, setSheetUrl] = useState<string>(GOOGLE_SHEETS_SPREADSHEET_URL);
  const [syncState, setSyncState] = useState<SyncState>({
    status: 'syncing',
    lastSyncedAt: null,
    message: 'Menginisialisasi pengambilan data dari Google Sheets...',
    sourceUrl: GOOGLE_SHEETS_SPREADSHEET_URL,
    totalParsed: 0
  });
  const [pollCountdown, setPollCountdown] = useState<number>(15);

  // Filters
  const [selectedCabinet, setSelectedCabinet] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLemari, setSelectedLemari] = useState<number | null>(null);
  const [selectedStatusArsip, setSelectedStatusArsip] = useState<StatusArsip | 'Semua'>('Semua');
  const [selectedStatusBarang, setSelectedStatusBarang] = useState<StatusBarang | 'Semua'>('Semua');
  const [selectedTahun, setSelectedTahun] = useState<string>('Semua');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
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
  const [groupByRak, setGroupByRak] = useState(true);
  const [selectedRak, setSelectedRak] = useState<string | null>(null);
  const [showAllSekat, setShowAllSekat] = useState(false);
  const hasHandledUrlQueryRef = useRef(false);

  // Aliases for explicit state setters
  const setSelectedBox = setSelectedDetailBox;
  const setIsModalOpen = setIsDetailModalOpen;

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  /**
   * Helper pembacaan URL parameter setelah data Google Sheets selesai di-fetch/di-load:
   * 1. Mendukung HashRouter (format: https://bintisulaikah7-glitch.github.io/Sistem-Arsip-LSP/#/?box=KODE_BOKS)
   *    maupun standard search params (?box=KODE_BOKS)
   * 2. Mendukung filter lokasi berkas (#/?pelatihan=...&lemari=...&rak=...)
   * 3. Melakukan pencarian toleran (case-insensitive & hapus spasi) dengan null-check data?.find
   * 4. Membuka modal detail boks secara otomatis (setIsModalOpen(true) dan setSelectedBox(foundBox))
   */
  const handleCheckUrlAndOpenBox = useCallback((data: any[]) => {
    if (typeof window === 'undefined') return;
    if (!data || !Array.isArray(data)) return;

    // 1. PEMBACAAN URL PARAMETER UNTUK HASHROUTER & SEARCH:
    let targetBoxId: string | null = null;

    // Prioritaskan pembacaan dari window.location.hash (format HashRouter #/?box=... atau #?box=... atau #box=...)
    if (window.location.hash) {
      const hashStr = window.location.hash;
      const qIndex = hashStr.indexOf('?');
      if (qIndex !== -1) {
        const hashParams = new URLSearchParams(hashStr.substring(qIndex));
        targetBoxId = hashParams.get('box') || hashParams.get('id');
      } else if (hashStr.includes('=')) {
        const hashParams = new URLSearchParams(hashStr.replace(/^#\/?/, ''));
        targetBoxId = hashParams.get('box') || hashParams.get('id');
      }
    }

    // Jika belum ditemukan di hash, periksa window.location.search (?box=... atau ?id=...)
    if (!targetBoxId) {
      const searchParams = new URLSearchParams(window.location.search);
      targetBoxId = searchParams.get('box') || searchParams.get('id');
    }

    // Fallback util helper jika ada
    if (!targetBoxId) {
      targetBoxId = getUrlBoxParam();
    }

    console.log("Mencari Box ID dari URL (HashRouter/Search):", targetBoxId);

    // 2. PENCOCOKAN DATA BOKS (toleran: case-insensitive & trim spasi):
    if (targetBoxId && targetBoxId.trim()) {
      const cleanTarget = targetBoxId.trim().toLowerCase();
      const foundBox = data?.find?.((b: any) => {
        if (!b) return false;
        const boxCode = (b['Kode Boks'] || b['kode_box'] || b['id'] || b.code || b.id_box || '').toString().trim().toLowerCase();
        return boxCode === cleanTarget;
      });

      console.log("Hasil pencarian:", foundBox);

      // 3. BUKA MODAL OTOMATIS:
      if (foundBox) {
        hasHandledUrlQueryRef.current = true;
        setSelectedBox(foundBox);
        setIsModalOpen(true);
        showToast(`Membuka rincian boks arsip: ${foundBox.id_box || targetBoxId}`);
      }
    }

    // 4. PEMBACAAN URL PARAMETER UNTUK FILTER LOKASI (pelatihan, lemari, rak):
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
   * Fetch and parse CSV from Google Sheets URL.
   * Replaces default INITIAL_BOXES so statistics and filters automatically adapt.
   */
  const fetchGoogleSheetsData = useCallback(
    async (targetUrl = sheetUrl, isSilent = false) => {
      if (!isSilent) {
        setSyncState((prev) => ({ ...prev, status: 'syncing' }));
      }

      const effectiveUrl = convertGoogleSheetsUrlToCsv(targetUrl);
      let csvText = '';
      let fetchErrorMsg = '';

      // 1. First attempt: Direct client fetch
      try {
        const directRes = await fetch(effectiveUrl, {
          headers: {
            Accept: 'text/csv,text/plain,*/*'
          }
        });
        if (directRes.ok) {
          const text = await directRes.text();
          const trimmed = text.trim();
          if (
            !trimmed.startsWith('<!DOCTYPE') &&
            !trimmed.startsWith('<html') &&
            !text.includes('<title>Google Drive') &&
            !text.includes('docs.google.com/error')
          ) {
            csvText = text;
          }
        }
      } catch (err) {
        // Direct fetch failed (e.g. CORS restrictions on browser)
      }

      // 2. Second attempt: Fallback to local server proxy endpoint (bypasses CORS)
      if (!csvText) {
        try {
          const proxyRes = await fetch(`/api/sheets-proxy?url=${encodeURIComponent(effectiveUrl)}`);
          if (proxyRes.ok) {
            const text = await proxyRes.text();
            if (
              !text.startsWith('<!DOCTYPE') &&
              !text.startsWith('<html') &&
              !text.includes('Page not found')
            ) {
              csvText = text;
            }
          } else {
            const errData = await proxyRes.json().catch(() => null);
            fetchErrorMsg =
              errData?.message ||
              'Spreadsheet Google Sheets belum disetel publik atau tidak ditemukan.';
          }
        } catch (err: any) {
          fetchErrorMsg = err.message || 'Gagal menghubungi server proxy Google Sheets.';
        }
      }

      // 3. Parse and update boxes state if CSV was retrieved
      if (csvText) {
        try {
          const records = parseCSV(csvText);
          const rawBoxes = mapCsvRecordsToBoxes(records);
          const parsedBoxes = deduplicateBoxes(rawBoxes);

          if (parsedBoxes.length > 0) {
            // PERBAIKAN 1: Overwrite state secara utuh (tidak di-append) dengan data deduplikasi id_box
            setBoxes(parsedBoxes);
            setIsLoading(false);
            setSyncState({
              status: 'connected',
              lastSyncedAt: new Date(),
              message: `Berhasil sinkronisasi ${parsedBoxes.length} boks arsip unik dari Google Sheets CSV.`,
              sourceUrl: targetUrl,
              totalParsed: parsedBoxes.length
            });

            // Keep backend API endpoints in sync as well
            fetch('/api/boxes/sync-sheets', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(parsedBoxes)
            }).catch(() => {});

            if (!isSilent) {
              showToast(
                `Berhasil memuat ${parsedBoxes.length} boks arsip dari Google Sheets!`
              );
            }

            return parsedBoxes;
          } else {
            setSyncState((prev) => ({
              ...prev,
              status: 'warning',
              message:
                'File CSV terbaca namun tidak ada baris data boks yang sesuai dengan format 9 field.'
            }));
          }
        } catch (parseErr: any) {
          setSyncState((prev) => ({
            ...prev,
            status: 'warning',
            message: `Gagal memetakan data CSV: ${parseErr.message}`
          }));
        }
      } else {
        setSyncState((prev) => ({
          ...prev,
          status: 'warning',
          message:
            fetchErrorMsg ||
            "Spreadsheet Google Sheets belum disetel ke 'Siapa saja yang memiliki link dapat melihat'. Auto-polling terus berjalan tiap 15s."
        }));
      }

      setIsLoading(false);
      return null;
    },
    [sheetUrl]
  );

  // Initial fetch on mount & recurring 15-second polling
  useEffect(() => {
    let isMounted = true;

    // 1. Initial fetch on application load (pencarian URL Parameter HANYA berjalan SETELAH proses fetch data Google Sheets selesai)
    fetchGoogleSheetsData(sheetUrl, false)
      .then((loadedBoxes) => {
        if (!isMounted) return;

        const data = (loadedBoxes && loadedBoxes.length > 0) ? loadedBoxes : (boxes && boxes.length > 0 ? boxes : INITIAL_BOXES);
        handleCheckUrlAndOpenBox(data);
      })
      .catch((err) => {
        console.warn("Gagal fetch data awal Google Sheets, menggunakan data cadangan:", err);
        if (isMounted) {
          handleCheckUrlAndOpenBox(boxes || INITIAL_BOXES);
        }
      });

    // 2. Automated polling every 15 seconds
    const pollInterval = setInterval(() => {
      fetchGoogleSheetsData(sheetUrl, true);
      setPollCountdown(15);
    }, 15000);

    // 3. Countdown ticker
    const countdownInterval = setInterval(() => {
      setPollCountdown((prev) => (prev > 1 ? prev - 1 : 15));
    }, 1000);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
      clearInterval(countdownInterval);
    };
  }, [fetchGoogleSheetsData, sheetUrl]);

  /**
   * Listener untuk perubahan URL atau pembaruan data boks:
   * Memastikan jika ada query parameter 'box' atau 'id' (baik via hashchange maupun popstate),
   * modal otomatis terbuka dan data boks valid (tidak undefined).
   */
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const onUrlChange = () => {
      handleCheckUrlAndOpenBox(boxes);
    };

    window.addEventListener('popstate', onUrlChange);
    window.addEventListener('hashchange', onUrlChange);

    return () => {
      window.removeEventListener('popstate', onUrlChange);
      window.removeEventListener('hashchange', onUrlChange);
    };
  }, [boxes, handleCheckUrlAndOpenBox]);

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedDetailBox(null);
    hasHandledUrlQueryRef.current = false;
    // Bersihkan URL query parameter secara halus tanpa reload browser
    if (typeof window !== 'undefined') {
      const hasBoxInSearch = window.location.search.includes('box=') || window.location.search.includes('id=');
      const hasBoxInHash = window.location.hash.includes('box=') || window.location.hash.includes('id=');
      if (hasBoxInSearch || hasBoxInHash) {
        const cleanUrl = window.location.pathname + '#/';
        window.history.replaceState({}, '', cleanUrl);
      }
    }
  };

  // Handle manual raw CSV text import override
  const handleImportCsvText = (csvText: string) => {
    try {
      const records = parseCSV(csvText);
      const parsedBoxes = deduplicateBoxes(mapCsvRecordsToBoxes(records));
      if (parsedBoxes.length > 0) {
        setBoxes(parsedBoxes);
        setSyncState({
          status: 'connected',
          lastSyncedAt: new Date(),
          message: `Manual Override: Berhasil memuat ${parsedBoxes.length} boks dari CSV.`,
          sourceUrl: sheetUrl,
          totalParsed: parsedBoxes.length
        });
        fetch('/api/boxes/sync-sheets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(parsedBoxes)
        }).catch(() => {});
        showToast(`Memuat ${parsedBoxes.length} boks arsip dari CSV.`);
      } else {
        showToast('Tidak ada data boks arsip valid yang terdeteksi dari CSV.', 'error');
      }
    } catch (err: any) {
      showToast(`Error parse CSV: ${err.message}`, 'error');
    }
  };

  // Available years dynamically derived from current boxes
  const availableYears = useMemo(() => {
    if (!boxes || !Array.isArray(boxes)) return [];
    const years = Array.from(new Set(boxes.map((b) => b?.tahun_pelaksanaan))).filter(Boolean);
    return years.sort((a, b) => b - a);
  }, [boxes]);

  // Available lemari dynamically derived from current boxes
  const availableLemari = useMemo(() => {
    if (!boxes || !Array.isArray(boxes)) return [];
    const lemariList = Array.from(new Set(boxes.map((b) => b?.lokasi?.lemari))).filter(Boolean);
    return lemariList.sort((a, b) => a - b);
  }, [boxes]);

  // Filtered Boxes (Mendukung Hierarki Lemari & Global Search Exception)
  const filteredBoxes = useMemo(() => {
    if (!boxes || !Array.isArray(boxes)) return [];
    return boxes.filter((b) => {
      if (!b) return false;
      // 1. Search query filter (Global search exception across all cabinets)
      if (searchQuery.trim()) {
        if (!matchBoxSearch(b, searchQuery)) {
          return false;
        }
      } else {
        // 2. If no search query and a cabinet is selected, strictly filter to that cabinet
        if (selectedCabinet !== null && b.lokasi?.lemari !== selectedCabinet) {
          return false;
        }
      }

      // 3. Dropdown Lemari filter (if explicitly chosen from dropdown)
      if (selectedLemari !== null && b.lokasi?.lemari !== selectedLemari) {
        return false;
      }

      // 4. Dropdown Status Arsip filter
      if (selectedStatusArsip !== 'Semua' && b.status_arsip !== selectedStatusArsip) {
        return false;
      }

      // 5. Dropdown Status Barang filter
      if (selectedStatusBarang !== 'Semua' && b.status_barang !== selectedStatusBarang) {
        return false;
      }

      // 6. Dropdown Tahun filter
      if (selectedTahun !== 'Semua' && b.tahun_pelaksanaan?.toString() !== selectedTahun) {
        return false;
      }

      return true;
    });
  }, [boxes, searchQuery, selectedCabinet, selectedLemari, selectedStatusArsip, selectedStatusBarang, selectedTahun]);

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
    setShowAllSekat(false);
    setSelectedStatusArsip('Semua');
    setSelectedStatusBarang('Semua');
    setSelectedTahun('Semua');
  };

  // Open JSON Viewer for a specific box (Rule: Kembalikan jawaban HANYA berupa format JSON valid)
  const handleViewJson = (box: BoksArsip) => {
    setJsonModalState({
      isOpen: true,
      title: `Response JSON: ${box.id_box}`,
      data: box,
      statusCode: 200
    });
  };

  // Create Box
  const handleAddBox = async (newBox: BoksArsip): Promise<boolean> => {
    try {
      const res = await fetch('/api/boxes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBox)
      });

      const data = await res.json();
      if (res.ok) {
        setBoxes((prev) => [data, ...prev]);
        showToast(`Boks ${data.id_box} berhasil ditambahkan ke lemari ${data.lokasi.lemari}.`);
        return true;
      } else {
        showToast(data.message || 'Gagal menambahkan boks.', 'error');
        return false;
      }
    } catch (err: any) {
      // Fallback
      setBoxes((prev) => [newBox, ...prev]);
      showToast(`Boks ${newBox.id_box} berhasil ditambahkan.`);
      return true;
    }
  };

  // Update Box
  const handleUpdateBox = async (updatedBox: BoksArsip): Promise<boolean> => {
    try {
      const res = await fetch(`/api/boxes/${encodeURIComponent(updatedBox.id_box)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedBox)
      });

      const data = await res.json();
      if (res.ok) {
        setBoxes((prev) => prev.map((b) => (b.id_box === data.id_box ? data : b)));
        showToast(`Boks ${data.id_box} berhasil diperbarui.`);
        return true;
      } else {
        showToast(data.message || 'Gagal memperbarui boks.', 'error');
        return false;
      }
    } catch (err: any) {
      setBoxes((prev) => prev.map((b) => (b.id_box === updatedBox.id_box ? updatedBox : b)));
      showToast(`Boks ${updatedBox.id_box} diperbarui.`);
      return true;
    }
  };

  // Delete Box
  const handleDeleteBox = async (id_box: string) => {
    if (!window.confirm(`Yakin ingin menghapus berkas boks ${id_box} dari sistem arsip?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/boxes/${encodeURIComponent(id_box)}`, {
        method: 'DELETE'
      });
      const data = await res.json();

      if (res.ok) {
        setBoxes((prev) => prev.filter((b) => b.id_box !== id_box));
        showToast(`Boks ${id_box} berhasil dihapus.`);
      } else {
        showToast(data.message || 'Gagal menghapus boks.', 'error');
      }
    } catch (err: any) {
      setBoxes((prev) => prev.filter((b) => b.id_box !== id_box));
      showToast(`Boks ${id_box} dihapus.`);
    }
  };

  // Reset Dataset
  const handleResetData = async () => {
    if (!window.confirm('Ambil ulang data terbaru dari spreadsheet Google Sheets?')) {
      return;
    }

    setIsResetting(true);
    try {
      await fetchGoogleSheetsData(sheetUrl, false);
      showToast('Data boks arsip berhasil disinkronkan ulang dari Google Sheets.');
    } catch (err) {
      showToast('Gagal sinkronisasi ulang data.', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  // Export JSON
  const handleExportJson = () => {
    const jsonStr = JSON.stringify(boxes, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lsp_arsip_boxes_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('File JSON arsip berhasil diunduh.');
  };

  // Handler simpan boks baru dari Input Lokasi Berkas
  const handleSaveFromInputLokasi = (newBoxData: Partial<BoksArsip>) => {
    const fullBox: BoksArsip = {
      id_box: newBoxData.id_box || `BOX-${Date.now()}`,
      nama_pelatihan: newBoxData.nama_pelatihan || 'Pelatihan Baru',
      tahun_pelaksanaan: newBoxData.tahun_pelaksanaan || new Date().getFullYear(),
      jumlah_peserta: newBoxData.jumlah_peserta || 0,
      jumlah_peserta_bk: newBoxData.jumlah_peserta_bk || 0,
      lokasi: newBoxData.lokasi || { lemari: 1, rak: 'Rak 1', baris: 'Baris 1' },
      status_arsip: (newBoxData.status_arsip as StatusArsip) || 'Tersedia',
      status_barang: (newBoxData.status_barang as StatusBarang) || 'Lengkap',
      link_dokumentasi: newBoxData.link_dokumentasi || 'https://drive.google.com'
    };
    setBoxes((prev) => [fullBox, ...prev]);
    showToast(`Boks arsip berhasil didaftarkan: ${fullBox.id_box}`);
  };

  // Handler terapkan filter dari Input Lokasi Berkas
  const handleApplyFilterFromLokasi = (pelatihan: string, lemari: string, rak: string) => {
    if (pelatihan) setSearchQuery(pelatihan);
    if (lemari) {
      const numMatch = lemari.match(/\d+/);
      if (numMatch) {
        const lNum = parseInt(numMatch[0], 10);
        setSelectedCabinet(lNum);
        setSelectedLemari(lNum);
      } else if (lemari.toLowerCase().includes('a')) {
        setSelectedCabinet(1);
        setSelectedLemari(1);
      } else if (lemari.toLowerCase().includes('b')) {
        setSelectedCabinet(2);
        setSelectedLemari(2);
      } else if (lemari.toLowerCase().includes('c')) {
        setSelectedCabinet(3);
        setSelectedLemari(3);
      }
    }
    if (rak) {
      setSelectedRak(rak);
    }
    showToast(`Filter Lokasi Berkas diterapkan: ${pelatihan} (${lemari}, ${rak})`);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans antialiased selection:bg-emerald-500 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div
            className={`px-4 py-2.5 rounded-lg border shadow-lg text-xs font-medium flex items-center space-x-2 ${
              toastMessage.type === 'success'
                ? 'bg-emerald-950/90 text-emerald-300 border-emerald-800'
                : 'bg-rose-950/90 text-rose-300 border-rose-800'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Main Header */}
      <Header
        onOpenAddModal={() => {
          setEditingBox(null);
          setIsAddModalOpen(true);
        }}
        onOpenQrModal={() => setIsQrScannerOpen(true)}
        onOpenInputLokasi={() => setIsInputLokasiOpen(true)}
        onOpenApiPlayground={() => setIsApiPlaygroundOpen(true)}
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
          nextPollCountdown={pollCountdown}
        />

        {/* Statistics Bar */}
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
              setShowAllSekat(false);
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
                <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-xs">Memuat data boks arsip dari engine...</p>
              </div>
            ) : searchQuery.trim() ? (
              /* PENCARIAN GLOBAL EXCEPTION BANNER & LISTING */
              <div className="space-y-4">
                <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs shadow-sm animate-in fade-in duration-200">
                  <div className="flex items-center space-x-2 text-slate-200">
                    <Search className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>
                      Hasil Pencarian Global: &quot;<strong className="text-emerald-300">{searchQuery}</strong>&quot; — Menampilkan <strong className="text-white">{filteredBoxes.length}</strong> boks di semua lemari arsip.
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
                    className="inline-flex items-center space-x-1 text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg transition w-fit text-xs"
                  >
                    <X className="w-3.5 h-3.5 text-rose-400" />
                    <span>Hapus Pencarian &amp; Kembali ke Lemari</span>
                  </button>
                </div>

                {filteredBoxes.length > 0 ? (
                  <div>
                    <div className="flex items-center justify-between mb-3 text-xs text-slate-400">
                      <span>
                        Menampilkan <strong className="text-slate-200">{filteredBoxes.length}</strong> boks berkas
                        {isFiltered && ` (difilter dari total ${boxes.length})`}
                      </span>
                      <button
                        onClick={() =>
                          setJsonModalState({
                            isOpen: true,
                            title: `Semua Data Terfilter (${filteredBoxes.length} Boks)`,
                            data: filteredBoxes,
                            statusCode: 200
                          })
                        }
                        className="text-indigo-400 hover:text-indigo-300 font-mono text-[11px] flex items-center space-x-1"
                      >
                        <Database className="w-3.5 h-3.5" />
                        <span>Lihat Format JSON Hasil Filter</span>
                      </button>
                    </div>

                    {viewMode === 'grid' ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredBoxes.map((box, index) => (
                          <BoxCard
                            key={`${box.id_box}-${index}`}
                            box={box}
                            onViewJson={handleViewJson}
                            onEdit={(b) => {
                              setEditingBox(b);
                              setIsAddModalOpen(true);
                            }}
                            onDelete={handleDeleteBox}
                            onShowQr={(b) => setQrCardBox(b)}
                            onViewDetail={(b) => {
                              setSelectedDetailBox(b);
                              setIsDetailModalOpen(true);
                            }}
                          />
                        ))}
                      </div>
                    ) : (
                      <BoxTableView
                        boxes={filteredBoxes}
                        onViewJson={handleViewJson}
                        onEdit={(b) => {
                          setEditingBox(b);
                          setIsAddModalOpen(true);
                        }}
                        onDelete={handleDeleteBox}
                        onShowQr={(b) => setQrCardBox(b)}
                        onViewDetail={(b) => {
                          setSelectedDetailBox(b);
                          setIsDetailModalOpen(true);
                        }}
                      />
                    )}
                  </div>
                ) : (
                  /* Empty State 404 */
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 text-center flex flex-col items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-rose-950/60 border border-rose-900/80 flex items-center justify-center text-rose-400 mb-3">
                      <FolderSearch className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-200 mb-1">
                      Data Boks Arsip Tidak Ditemukan
                    </h3>
                    <p className="text-xs text-slate-400 max-w-md mb-4 leading-relaxed">
                      Tidak ada boks file yang cocok dengan kriteria pencarian &quot;{searchQuery}&quot;.
                    </p>
                    <button
                      onClick={handleResetFilters}
                      className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition"
                    >
                      Reset Filter &amp; Kembali ke Daftar Lemari
                    </button>
                  </div>
                )}
              </div>
            ) : selectedCabinet === null ? (
              /* 1. TAMPILAN AWAL: DAFTAR LEMARI */
              <CabinetGridView
                boxes={boxes}
                availableLemari={availableLemari}
                onSelectCabinet={(lemari) => {
                  setSelectedCabinet(lemari);
                  setSelectedLemari(lemari);
                  setSelectedRak(null);
                  setShowAllSekat(false);
                }}
                onOpenInputLokasi={() => setIsInputLokasiOpen(true)}
              />
            ) : selectedRak === null ? (
              /* 2. TAMPILAN KEDUA: DAFTAR RAK 1 - 4 DI DALAM LEMARI */
              showAllSekat ? (
                <div className="space-y-4">
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => setShowAllSekat(false)}
                        className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-emerald-950 hover:border-emerald-700 hover:text-emerald-300 text-slate-200 text-xs font-semibold border border-slate-700 transition"
                      >
                        <ArrowLeft className="w-4 h-4 text-emerald-400" />
                        <span>Tampilan Kartu Rak</span>
                      </button>
                      <div>
                        <h3 className="text-sm font-bold text-white">Lemari {selectedCabinet} - Semua Sekat Rak</h3>
                        <p className="text-xs text-slate-400">Menampilkan seluruh rak arsip fisik sekaligus</p>
                      </div>
                    </div>
                  </div>
                  <RakGroupView
                    boxes={filteredBoxes}
                    lemariYangDipilih={selectedCabinet}
                    onViewJson={handleViewJson}
                    onEdit={(b) => {
                      setEditingBox(b);
                      setIsAddModalOpen(true);
                    }}
                    onDelete={handleDeleteBox}
                    onShowQr={(b) => setQrCardBox(b)}
                    onViewDetail={(b) => {
                      setSelectedDetailBox(b);
                      setIsDetailModalOpen(true);
                    }}
                    onOpenInputLokasiWithRak={(lemariStr, rakStr) => {
                      setInputLokasiPrefill({ lemari: lemariStr, rak: rakStr });
                      setIsInputLokasiOpen(true);
                    }}
                  />
                </div>
              ) : (
                <RakListView
                  lemariNama={selectedCabinet}
                  boxes={boxes}
                  onSelectRak={(rak) => {
                    setSelectedRak(rak);
                  }}
                  onBackToLemari={() => {
                    setSelectedCabinet(null);
                    setSelectedLemari(null);
                    setSelectedRak(null);
                  }}
                  onViewAllSekat={() => setShowAllSekat(true)}
                  onOpenInputLokasi={(lemariStr, rakStr) => {
                    setInputLokasiPrefill({ lemari: lemariStr, rak: rakStr });
                    setIsInputLokasiOpen(true);
                  }}
                  onViewJsonLemari={() =>
                    setJsonModalState({
                      isOpen: true,
                      title: `Data Lemari ${selectedCabinet} (${filteredBoxes.length} Boks)`,
                      data: filteredBoxes,
                      statusCode: 200
                    })
                  }
                />
              )
            ) : (
              /* 3. TAMPILAN KETIGA: DAFTAR PELATIHAN DI DALAM RAK */
              <PelatihanRakView
                lemariNama={selectedCabinet}
                namaRak={selectedRak}
                boxes={boxes}
                onBackToRakList={() => {
                  setSelectedRak(null);
                }}
                onBackToLemari={() => {
                  setSelectedCabinet(null);
                  setSelectedLemari(null);
                  setSelectedRak(null);
                }}
                onShowQr={(b) => setQrCardBox(b)}
                onViewJson={handleViewJson}
                onEdit={(b) => {
                  setEditingBox(b);
                  setIsAddModalOpen(true);
                }}
                onDelete={handleDeleteBox}
                onViewDetail={(b) => {
                  setSelectedDetailBox(b);
                  setIsDetailModalOpen(true);
                }}
                onOpenInputLokasi={(lemariStr, rakStr) => {
                  setInputLokasiPrefill({ lemari: lemariStr, rak: rakStr });
                  setIsInputLokasiOpen(true);
                }}
              />
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      <JsonViewerModal
        isOpen={jsonModalState.isOpen}
        onClose={() => setJsonModalState((prev) => ({ ...prev, isOpen: false }))}
        title={jsonModalState.title}
        data={jsonModalState.data}
        statusCode={jsonModalState.statusCode}
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

      <BoxFormModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingBox(null);
        }}
        onSubmit={editingBox ? handleUpdateBox : handleAddBox}
        editingBox={editingBox}
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
        initialLemari={inputLokasiPrefill.lemari}
        initialRak={inputLokasiPrefill.rak}
        onApplyFilter={handleApplyFilterFromLokasi}
        onSaveNewBox={handleSaveFromInputLokasi}
      />
    </div>
  );
}
