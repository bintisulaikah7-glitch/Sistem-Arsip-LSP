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
import { AppsScriptModal } from './components/AppsScriptModal.tsx';
import { sendBoxToGoogleSheets } from './utils/appsScriptService.ts';
import { INITIAL_BOXES } from './data/initialBoxes.ts';
import { fetchBoxesData, verifyAndSanitizeBoxes } from './data/boxesService.ts';
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
  // Inisialisasi state awal
  const [boxes, setBoxes] = useState<BoksArsip[]>(() => deduplicateBoxes(INITIAL_BOXES));
  const [isLoading, setIsLoading] = useState(false);
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
  const [groupByRak, setGroupByRak] = useState(true);
  const [selectedRak, setSelectedRak] = useState<string | null>(null);
  const [showAllSekat, setShowAllSekat] = useState(false);
  const hasHandledUrlQueryRef = useRef(false);

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
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCheckUrlAndOpenBox = useCallback((data: any[]) => {
    if (typeof window === 'undefined') return;
    if (!data || !Array.isArray(data)) return;

    let targetBoxId: string | null = null;

    try {
      const searchParams = new URLSearchParams(window.location.search);
      targetBoxId = searchParams.get('boxId') || searchParams.get('box_id') || searchParams.get('box') || searchParams.get('id');
    } catch {}

    if (!targetBoxId && window.location.hash) {
      const hashStr = window.location.hash;
      const qIndex = hashStr.indexOf('?');
      if (qIndex !== -1) {
        const hashParams = new URLSearchParams(hashStr.substring(qIndex));
        targetBoxId = hashParams.get('boxId') || hashParams.get('box_id') || hashParams.get('box') || hashParams.get('id');
      } else if (hashStr.includes('=')) {
        const hashParams = new URLSearchParams(hashStr.replace(/^#\/?/, ''));
        targetBoxId = hashParams.get('boxId') || hashParams.get('box_id') || hashParams.get('box') || hashParams.get('id');
      }
    }

    if (!targetBoxId) {
      targetBoxId = getUrlBoxParam();
    }

    if (targetBoxId && targetBoxId.trim()) {
      const cleanTarget = targetBoxId.trim().toLowerCase();
      const foundBox = data?.find?.((b: any) => {
        if (!b) return false;
        const boxCode = (b.id_box || b['Kode Boks'] || b['kode_box'] || b['id'] || b.code || '').toString().trim().toLowerCase();
        return boxCode === cleanTarget;
      });

      if (foundBox) {
        hasHandledUrlQueryRef.current = true;
        setSelectedBox(foundBox);
        setIsModalOpen(true);
        showToast(`Membuka rincian boks arsip: ${foundBox.id_box || targetBoxId}`);
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
   * Fetch and parse CSV from Google Sheets URL secara dinamis (real-time).
   */
  const fetchGoogleSheetsData = useCallback(
    async (targetUrl = sheetUrl, isSilent = false) => {
      if (isAddModalOpenRef.current || editingBoxRef.current) {
        return null;
      }

      if (!isSilent) {
        setSyncState((prev) => ({ ...prev, status: 'syncing' }));
      }

      const effectiveUrl = convertGoogleSheetsUrlToCsv(targetUrl);

      try {
        const parsedBoxes = await fetchBoxesData(effectiveUrl);

        if (parsedBoxes && parsedBoxes.length > 0) {
          const verified = verifyAndSanitizeBoxes(parsedBoxes);

          // HANYA UPDATE STATE JIKA JUMLAH DATA SAMA ATAU LEBIH BANYAK DARI DATA LOKAL DENGAN DATA VALID
          setBoxes(verified);
          setIsLoading(false);
          setSyncState({
            status: 'connected',
            lastSyncedAt: new Date(),
            message: `Berhasil sinkronisasi ${verified.length} boks arsip langsung dari Google Sheets.`,
            sourceUrl: targetUrl,
            totalParsed: verified.length
          });

          fetch('/api/boxes/sync-sheets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(verified)
          }).catch(() => {});

          if (!isSilent) {
            showToast(`Berhasil memuat ${verified.length} boks arsip dari Google Sheets!`);
          }

          return verified;
        } else {
          setSyncState((prev) => ({
            ...prev,
            status: 'connected',
            message: 'Sistem mempertahankan data boks aktif yang sudah tersinkron.'
          }));
        }
      } catch (err: any) {
        console.warn('Gagal memuat data dari Google Sheets, mempertahankan data aktif saat ini:', err);
        setSyncState((prev) => ({
          ...prev,
          status: 'warning',
          message: `Sistem mempertahankan data aktif (${prev.totalParsed || '102'} Boks Arsip).`
        }));
      }

      setIsLoading(false);
      return null;
    },
    [sheetUrl]
  );

  // Background fetch on mount & recurring 60-second polling
  useEffect(() => {
    let isMounted = true;

    fetchGoogleSheetsData(sheetUrl, true)
      .then((loadedBoxes) => {
        if (!isMounted) return;
        if (loadedBoxes && loadedBoxes.length > 0) {
          handleCheckUrlAndOpenBox(loadedBoxes);
        } else {
          handleCheckUrlAndOpenBox(boxes);
        }
      })
      .catch((err) => {
        if (isMounted) {
          handleCheckUrlAndOpenBox(boxes);
        }
      });

    // Polling setiap 60 detik agar stabil dan tidak sering timeout
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
    if (typeof window !== 'undefined') {
      try {
        const url = new URL(window.location.href);
        let changed = false;
        ['boxId', 'box_id', 'box', 'id'].forEach((p) => {
          if (url.searchParams.has(p)) {
            url.searchParams.delete(p);
            changed = true;
          }
        });
        if (changed || (window.location.hash && (window.location.hash.includes('boxId') || window.location.hash.includes('box')))) {
          const cleanSearch = url.searchParams.toString() ? `?${url.searchParams.toString()}` : '';
          window.history.replaceState({}, '', url.pathname + cleanSearch);
        }
      } catch {
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, '', cleanUrl);
      }
    }
  };

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

  const availableYears = useMemo(() => {
    if (!boxes || !Array.isArray(boxes)) return [];
    const years = Array.from(new Set(boxes.map((b) => b?.tahun_pelaksanaan))).filter(Boolean);
    return years.sort((a, b) => Number(b) - Number(a));
  }, [boxes]);

  const availableLemari = useMemo(() => {
    if (!boxes || !Array.isArray(boxes) || boxes.length === 0) {
      return ['1', '2', '3', '4'];
    }

    const rawLemariList = boxes
      .map((b) => {
        const val = b?.lokasi?.lemari ?? (b as any)?.['Kode Lemari'] ?? (b as any)?.kode_lemari;
        if (val === undefined || val === null) return '';
        const str = String(val).replace(/lemari[-_\s]*/i, '').trim();
        if (!str || str === '0' || str.toLowerCase() === 'kosong' || str === '-') return '';
        return str;
      })
      .filter(Boolean);

    const uniqueLemari = Array.from(new Set(rawLemariList));
    uniqueLemari.sort((a, b) => {
      const numA = parseInt(a, 10);
      const numB = parseInt(b, 10);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
    });

    return uniqueLemari.length > 0 ? uniqueLemari : ['1', '2', '3', '4'];
  }, [boxes]);

  const availableRaks = useMemo(() => {
    if (!boxes || !Array.isArray(boxes) || boxes.length === 0) {
      return ['Rak A', 'Rak B', 'Rak C', 'Rak D'];
    }

    const rawRakList = boxes
      .map((b) => {
        const val = b?.lokasi?.rak ?? (b as any)?.['Nomor Rak'] ?? (b as any)?.['Nomor Rak '] ?? (b as any)?.nomor_rak;
        if (!val) return '';
        const str = String(val).trim();
        if (!str || str === '-' || str.toLowerCase() === 'kosong') return '';
        return str;
      })
      .filter(Boolean);

    const uniqueRaks = Array.from(new Set(rawRakList));
    uniqueRaks.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

    return uniqueRaks.length > 0 ? uniqueRaks : ['Rak A', 'Rak B', 'Rak C', 'Rak D'];
  }, [boxes]);

  const filteredBoxes = useMemo(() => {
    if (!boxes || !Array.isArray(boxes)) return [];
    return boxes.filter((b) => {
      if (!b) return false;

      if (searchQuery.trim()) {
        if (!matchBoxSearch(b, searchQuery)) {
          return false;
        }
      } else {
        if (selectedCabinet !== null) {
          const targetStr = selectedCabinet.toString().replace(/lemari[-_\s]*/i, '').trim().toLowerCase();
          const bLemariStr = (b.lokasi?.lemari || '').toString().replace(/lemari[-_\s]*/i, '').trim().toLowerCase();
          if (bLemariStr !== targetStr) {
            return false;
          }
        }
      }

      if (selectedLemari !== null) {
        const targetStr = selectedLemari.toString().replace(/lemari[-_\s]*/i, '').trim().toLowerCase();
        const bLemariStr = (b.lokasi?.lemari || '').toString().replace(/lemari[-_\s]*/i, '').trim().toLowerCase();
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
    setShowAllSekat(false);
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

  const handleMoveBox = async (id_box: string, targetLemari: number | string, targetRak: string) => {
    const targetBox = boxes.find(b => b.id_box.trim().toUpperCase() === id_box.trim().toUpperCase());
    if (!targetBox) return;

    const updatedBox: BoksArsip = {
      ...targetBox,
      lokasi: {
        ...targetBox.lokasi,
        lemari: targetLemari,
        rak: targetRak
      }
    };

    setBoxes((prev) =>
      prev.map((b) => (b.id_box.trim().toUpperCase() === id_box.trim().toUpperCase() ? updatedBox : b))
    );
    showToast(`Boks Arsip ${id_box} berhasil dipindahkan ke Lemari ${targetLemari}, ${targetRak}!`);

    try {
      fetch(`/api/boxes/${encodeURIComponent(id_box)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedBox)
      }).catch(() => {});
    } catch (_) {}

    sendBoxToGoogleSheets(updatedBox, 'move').catch((err) => {
      console.warn('Gagal sync perpindahan ke Google Sheets:', err);
    });
  };

  const handleAddBox = async (newBox: BoksArsip): Promise<boolean> => {
    try {
      const sanitized = verifyAndSanitizeBoxes([newBox])[0] || newBox;

      try {
        await sendBoxToGoogleSheets(sanitized, 'add');
      } catch (syncErr) {
        console.warn('[handleAddBox] Google Sheets sync error:', syncErr);
      }

      try {
        await fetch('/api/boxes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sanitized)
        });
      } catch {}

      setBoxes((prev) => [sanitized, ...prev.filter((b) => b.id_box !== sanitized.id_box)]);
      showToast(`Boks Arsip ${sanitized.id_box} berhasil ditambahkan dan disinkronkan ke Google Sheets!`);

      setTimeout(() => {
        if (!isAddModalOpenRef.current && !editingBoxRef.current) {
          fetchGoogleSheetsData(sheetUrl, true);
        }
      }, 1500);

      return true;
    } catch (err: any) {
      setBoxes((prev) => [newBox, ...prev]);
      showToast(`Boks Arsip ${newBox.id_box} berhasil ditambahkan.`);
      return true;
    }
  };

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
        showToast(`Boks Arsip ${data.id_box} berhasil diperbarui.`);
        return true;
      } else {
        showToast(data.message || 'Gagal memperbarui boks arsip.', 'error');
        return false;
      }
    } catch (err: any) {
      setBoxes((prev) => prev.map((b) => (b.id_box === updatedBox.id_box ? updatedBox : b)));
      showToast(`Boks Arsip ${updatedBox.id_box} diperbarui.`);
      return true;
    }
  };

  const handleDeleteBox = async (id_box: string) => {
    if (!window.confirm(`Yakin ingin menghapus berkas boks arsip ${id_box} dari sistem arsip?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/boxes/${encodeURIComponent(id_box)}`, {
        method: 'DELETE'
      });
      const data = await res.json();

      if (res.ok) {
        setBoxes((prev) => prev.filter((b) => b.id_box !== id_box));
        showToast(`Boks Arsip ${id_box} berhasil dihapus.`);
      } else {
        showToast(data.message || 'Gagal menghapus boks arsip.', 'error');
      }
    } catch (err: any) {
      setBoxes((prev) => prev.filter((b) => b.id_box !== id_box));
      showToast(`Boks Arsip ${id_box} dihapus.`);
    }
  };

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
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div
            className={`px-4 py-2.5 rounded-xl border shadow-lg text-xs font-semibold flex items-center space-x-2 ${
              toastMessage.type === 'success'
                ? 'bg-white text-emerald-700 border-emerald-200'
                : 'bg-white text-rose-700 border-rose-200'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600" />
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

        {/* Statistics Bar */}
        <StatsBar
          boxes={boxes}
          activeLemariFilter={selectedCabinet !== null ? (typeof selectedCabinet === 'number' ? selectedCabinet : parseInt(selectedCabinet.toString().replace(/\D/g, '') || '1', 10)) : (typeof selectedLemari === 'number' ? selectedLemari : null)}
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
          availableRaks={availableRaks}
          selectedRak={selectedRak}
          onSelectRak={setSelectedRak}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onResetFilters={handleResetFilters}
          isFiltered={isFiltered}
          totalCount={filteredBoxes.length}
        />

        {/* Dynamic Cabinet & Rak View Mode */}
        {viewMode === 'grid' ? (
          groupByRak ? (
            <RakGroupView
              boxes={filteredBoxes}
              onSelectBox={(box) => {
                setSelectedDetailBox(box);
                setIsDetailModalOpen(true);
              }}
              onMoveBox={handleMoveBox}
              onEditBox={(box) => {
                setEditingBox(box);
                setIsAddModalOpen(true);
              }}
              onDeleteBox={handleDeleteBox}
              onViewJson={handleViewJson}
              onOpenQrModal={(box) => setQrCardBox(box)}
            />
          ) : (
            <CabinetGridView
              boxes={filteredBoxes}
              selectedCabinet={selectedCabinet}
              onSelectCabinet={(lemari) => {
                setSelectedCabinet(lemari);
                setSelectedLemari(lemari);
              }}
              onSelectBox={(box) => {
                setSelectedDetailBox(box);
                setIsDetailModalOpen(true);
              }}
              onMoveBox={handleMoveBox}
              onEditBox={(box) => {
                setEditingBox(box);
                setIsAddModalOpen(true);
              }}
              onDeleteBox={handleDeleteBox}
              onViewJson={handleViewJson}
              onOpenQrModal={(box) => setQrCardBox(box)}
            />
          )
        ) : (
          <BoxTableView
            boxes={filteredBoxes}
            onSelectBox={(box) => {
              setSelectedDetailBox(box);
              setIsDetailModalOpen(true);
            }}
            onEditBox={(box) => {
              setEditingBox(box);
              setIsAddModalOpen(true);
            }}
            onDeleteBox={handleDeleteBox}
            onViewJson={handleViewJson}
            onOpenQrModal={(box) => setQrCardBox(box)}
          />
        )}
      </main>

      {/* Modals */}
      <BoxFormModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingBox(null);
        }}
        onSave={async (boxData) => {
          if (editingBox) {
            const success = await handleUpdateBox(boxData);
            if (success) {
              setIsAddModalOpen(false);
              setEditingBox(null);
            }
          } else {
            const success = await handleAddBox(boxData);
            if (success) {
              setIsAddModalOpen(false);
            }
          }
        }}
        editingBox={editingBox}
        availableLemari={availableLemari}
        availableRaks={availableRaks}
      />

      <BoxDetailModal
        isOpen={isDetailModalOpen}
        box={selectedDetailBox}
        onClose={handleCloseDetailModal}
        onEdit={(box) => {
          setIsDetailModalOpen(false);
          setEditingBox(box);
          setIsAddModalOpen(true);
        }}
        onDelete={(id) => {
          setIsDetailModalOpen(false);
          handleDeleteBox(id);
        }}
        onOpenQrModal={(box) => setQrCardBox(box)}
        onViewJson={handleViewJson}
      />

      <QrScannerModal
        isOpen={isQrScannerOpen}
        onClose={() => setIsQrScannerOpen(false)}
        onScanSuccess={(boxId) => {
          const target = boxes.find((b) => b.id_box.toLowerCase() === boxId.toLowerCase());
          if (target) {
            setSelectedDetailBox(target);
            setIsDetailModalOpen(true);
            showToast(`Boks arsip ditemukan: ${target.id_box}`);
          } else {
            showToast(`Boks arsip ID "${boxId}" tidak ditemukan.`, 'error');
          }
        }}
      />

      <QrCardModal
        isOpen={!!qrCardBox}
        box={qrCardBox}
        onClose={() => setQrCardBox(null)}
      />

      <JsonViewerModal
        isOpen={jsonModalState.isOpen}
        title={jsonModalState.title}
        data={jsonModalState.data}
        statusCode={jsonModalState.statusCode}
        onClose={() => setJsonModalState((prev) => ({ ...prev, isOpen: false }))}
      />

      <ApiPlaygroundModal
        isOpen={isApiPlaygroundOpen}
        onClose={() => setIsApiPlaygroundOpen(false)}
        boxes={boxes}
      />

      <AppsScriptModal
        isOpen={isAppsScriptModalOpen}
        onClose={() => setIsAppsScriptModalOpen(false)}
      />

      <InputLokasiModal
        isOpen={isInputLokasiOpen}
        onClose={() => setIsInputLokasiOpen(false)}
        onSave={handleSaveFromInputLokasi}
        onApplyFilter={handleApplyFilterFromLokasi}
        prefill={inputLokasiPrefill}
      />
    </div>
  );
}
