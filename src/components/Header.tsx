import React, { useEffect } from 'react';
import { Plus, Zap, RefreshCw, Archive } from 'lucide-react';

interface HeaderProps {
  onOpenAddModal: () => void;
  onOpenQrModal?: () => void;
  onOpenInputLokasi?: () => void;
  onOpenApiPlayground?: () => void;
  onOpenAppsScriptConfig?: () => void;
  onExportJson?: () => void;
  onResetData?: () => void;
  totalBoxes: number;
  isResetting?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAddModal,
  onOpenAppsScriptConfig,
  totalBoxes
}) => {
  const bukaModalTambah = () => {
    onOpenAddModal();
  };

  useEffect(() => {
    (window as any).bukaModalTambah = bukaModalTambah;
    return () => {
      delete (window as any).bukaModalTambah;
    };
  }, [onOpenAddModal]);

  return (
    <header className="top-bar-clean">
      <div className="header-left">
        <div className="header-icon">
          <Archive className="w-6 h-6 text-blue-600" />
        </div>
        <div className="header-title">
          <h1>Sistem Manajemen Boks Arsip LSP</h1>
          <p>
            Lembaga Sertifikasi Profesi • Standar 12 Kolom Kearsipan •{' '}
            {totalBoxes > 0 ? `${totalBoxes} Boks Arsip Terdaftar` : '91 Boks Arsip Terdaftar'}
          </p>
        </div>
      </div>

      <div className="header-right">
        {/* Tombol Refresh Data */}
        <button
          type="button"
          className="btn-icon-only"
          onClick={() => window.location.reload()}
          title="Refresh Data &amp; Sinkronisasi Ulang"
        >
          <RefreshCw className="w-4 h-4 text-slate-600" />
        </button>

        {/* Tombol Utamanya: + Tambah Boks Arsip */}
        <button
          type="button"
          className="btn-tambah-boks inline-flex items-center space-x-1.5"
          onClick={bukaModalTambah}
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span>+ Tambah Boks Arsip</span>
        </button>
      </div>
    </header>
  );
};
