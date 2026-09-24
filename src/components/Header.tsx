import React, { useEffect } from 'react';

interface HeaderProps {
  onOpenAddModal: () => void;
  onOpenQrModal?: () => void;
  onOpenInputLokasi?: () => void;
  onOpenApiPlayground?: () => void;
  onExportJson?: () => void;
  onResetData?: () => void;
  totalBoxes: number;
  isResetting?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAddModal,
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
        <div className="header-icon">📦</div>
        <div className="header-title">
          <h1>Sistem Arsip Boks LSP</h1>
          <p>Lembaga Sertifikasi Profesi • 9 Atribut Standar • {totalBoxes > 0 ? `${totalBoxes} Boks Terdaftar` : '91 Boks Terdaftar'}</p>
        </div>
      </div>

      <div className="header-right">
        {/* Tombol Refresh Data */}
        <button
          type="button"
          className="btn-icon-only"
          onClick={() => window.location.reload()}
          title="Refresh Data"
        >
          🔄
        </button>
        {/* Tombol Utamanya Cukup Tambah Boks */}
        <button
          type="button"
          className="btn-tambah-boks"
          onClick={bukaModalTambah}
        >
          + Tambah Boks
        </button>
      </div>
    </header>
  );
};
