import React, { useState, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { BoksArsip } from '../types.ts';
import { 
  GripVertical, 
  MapPin, 
  Calendar, 
  Users, 
  QrCode, 
  Edit3, 
  ExternalLink, 
  Layers, 
  ArrowRightLeft, 
  FolderArchive,
  Info,
  CheckCircle2,
  Sparkles,
  X
} from 'lucide-react';

interface PhysicalLayoutDndViewProps {
  boxes: BoksArsip[];
  availableLemari: (number | string)[];
  onMoveBox: (id_box: string, targetLemari: number | string, targetRak: string) => Promise<void>;
  onViewDetail: (box: BoksArsip) => void;
  onShowQr: (box: BoksArsip) => void;
  onEdit: (box: BoksArsip) => void;
}

export const PhysicalLayoutDndView: React.FC<PhysicalLayoutDndViewProps> = ({
  boxes,
  availableLemari,
  onMoveBox,
  onViewDetail,
  onShowQr,
  onEdit
}) => {
  const [selectedLemariFilter, setSelectedLemariFilter] = useState<string>('all');
  const [quickMoveBox, setQuickMoveBox] = useState<BoksArsip | null>(null);
  const [quickTargetLemari, setQuickTargetLemari] = useState<string>('1');
  const [quickTargetRak, setQuickTargetRak] = useState<string>('R1');
  const [isMoving, setIsMoving] = useState(false);

  // Filter Lemari list based on selector
  const activeLemariList = useMemo(() => {
    if (selectedLemariFilter === 'all') {
      return availableLemari.length > 0 ? availableLemari : [1, 2, 3, 4];
    }
    return [selectedLemariFilter];
  }, [availableLemari, selectedLemariFilter]);

  // Extract all existing unique raks across boxes for quick move & shelf layout
  const allKnownRaks = useMemo(() => {
    const set = new Set<string>();
    ['R1', 'R2', 'R3', 'R4'].forEach(r => set.add(r));
    boxes.forEach(b => {
      if (b.lokasi?.rak) {
        set.add(b.lokasi.rak.toString().trim());
      }
    });
    return Array.from(set).sort();
  }, [boxes]);

  // Generate shelf structure per Lemari
  const shelvesPerLemari = useMemo(() => {
    const map = new Map<string, { rakName: string; boxes: BoksArsip[] }[]>();

    activeLemariList.forEach(lemari => {
      const lemariStr = lemari.toString().replace(/lemari[-_\s]*/i, '').trim();

      // Find all boxes in this cabinet
      const cabinetBoxes = boxes.filter(b => {
        if (!b.lokasi?.lemari) return false;
        const bLemari = b.lokasi.lemari.toString().replace(/lemari[-_\s]*/i, '').trim();
        return bLemari.toLowerCase() === lemariStr.toLowerCase();
      });

      // Find all shelves that have boxes or default R1-R4
      const shelfSet = new Set<string>();
      ['R1', 'R2', 'R3', 'R4'].forEach(r => shelfSet.add(r));
      cabinetBoxes.forEach(b => {
        if (b.lokasi?.rak) {
          shelfSet.add(b.lokasi.rak.toString().trim());
        }
      });

      const shelfList = Array.from(shelfSet)
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))
        .map(rakName => {
          const matchingBoxes = cabinetBoxes.filter(b => {
            const r = (b.lokasi?.rak || '').toString().trim().toLowerCase();
            return r === rakName.toLowerCase();
          });
          return {
            rakName,
            boxes: matchingBoxes
          };
        });

      map.set(lemariStr, shelfList);
    });

    return map;
  }, [activeLemariList, boxes]);

  // Handle Drag and Drop End
  const handleDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;

    // Same droppable and same index -> no move
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    // droppableId format: "lemari__{lemari}__rak__{rak}"
    const parts = destination.droppableId.split('__');
    if (parts.length >= 4) {
      const targetLemari = parts[1];
      const targetRak = parts[3];

      // Convert numeric if applicable
      const parsedNum = parseInt(targetLemari, 10);
      const finalLemari = !isNaN(parsedNum) ? parsedNum : targetLemari;

      await onMoveBox(draggableId, finalLemari, targetRak);
    }
  };

  // Handle Quick Move through modal/popover
  const handleExecuteQuickMove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickMoveBox) return;

    setIsMoving(true);
    const parsedNum = parseInt(quickTargetLemari, 10);
    const finalLemari = !isNaN(parsedNum) ? parsedNum : quickTargetLemari;

    await onMoveBox(quickMoveBox.id_box, finalLemari, quickTargetRak);
    setIsMoving(false);
    setQuickMoveBox(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner & Control Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-xs">
            <ArrowRightLeft className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wide flex items-center gap-2">
              <span>TATA LETAK FISIK &amp; GESER BOKS ARSIP (DRAG &amp; DROP)</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                Interaktif Real-Time
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Geser (drag &amp; drop) boks arsip antar rak atau lemari untuk memperbarui lokasi fisik secara otomatis ke Google Sheets
            </p>
          </div>
        </div>

        {/* Filter / Filter View */}
        <div className="flex items-center space-x-2 shrink-0">
          <span className="text-xs text-slate-400 font-medium">Tampilkan:</span>
          <select
            value={selectedLemariFilter}
            onChange={(e) => setSelectedLemariFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">Semua Lemari Sekaligus</option>
            {availableLemari.map((l) => (
              <option key={`filter-lemari-${l}`} value={l.toString()}>
                Fokus Lemari {l}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Guide Info Banner */}
      <div className="bg-emerald-950/30 border border-emerald-800/50 rounded-xl px-4 py-2.5 flex items-center justify-between gap-2 text-xs text-emerald-300">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong>Tips Penggunaan:</strong> Klik dan tahan ikon pegangan <GripVertical className="w-3.5 h-3.5 inline text-slate-400" /> pada kartu boks arsip, lalu lepaskan di sekat rak tujuan. Perubahan lokasi otomatis tersimpan!
          </span>
        </div>
        <span className="text-[11px] text-emerald-400/80 hidden sm:inline font-mono">
          {boxes.length} Total Boks Arsip
        </span>
      </div>

      {/* Drag & Drop Context Container */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="space-y-8">
          {activeLemariList.map((lemariItem) => {
            const lemariKey = lemariItem.toString().replace(/lemari[-_\s]*/i, '').trim();
            const shelfList = shelvesPerLemari.get(lemariKey) || [];
            const totalInLemari = shelfList.reduce((acc, curr) => acc + curr.boxes.length, 0);

            return (
              <div
                key={`physical-cabinet-${lemariKey}`}
                className="bg-slate-950/70 border-2 border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden"
              >
                {/* Cabinet Header Frame */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-5 border-b border-slate-800 gap-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-lg">
                      🗄️
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                        <span>LEMARI ARSIP {lemariKey}</span>
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-emerald-400 border border-slate-700">
                          {totalInLemari} Boks Arsip
                        </span>
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Gedung Arsip LSP • Tata Letak Fisik Sekat Rak
                      </p>
                    </div>
                  </div>

                  <span className="text-[11px] text-slate-500 font-mono self-start sm:self-auto">
                    {shelfList.length} Sekat Rak Tersedia
                  </span>
                </div>

                {/* Shelves Column Inside Cabinet */}
                <div className="space-y-5">
                  {shelfList.map(({ rakName, boxes: shelfBoxes }) => {
                    const droppableId = `lemari__${lemariKey}__rak__${rakName}`;

                    return (
                      <div
                        key={`shelf-${lemariKey}-${rakName}`}
                        className="rounded-xl border border-slate-800/90 bg-slate-900/80 p-3.5 shadow-sm"
                      >
                        {/* Shelf Header Bar */}
                        <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800 text-xs">
                          <div className="flex items-center space-x-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs" />
                            <h4 className="font-bold text-slate-200 tracking-wide uppercase">
                              {rakName.startsWith('Rak') ? rakName : `Rak ${rakName}`}
                            </h4>
                            <span className="text-[11px] text-slate-400 font-mono">
                              ({shelfBoxes.length} Boks Arsip)
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 font-mono">
                            Lemari {lemariKey} / {rakName}
                          </span>
                        </div>

                        {/* Droppable Shelf Slot */}
                        <Droppable droppableId={droppableId} direction="horizontal">
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className={`min-h-[140px] rounded-lg p-2.5 flex items-stretch gap-3 overflow-x-auto transition-colors duration-200 ${
                                snapshot.isDraggingOver
                                  ? 'bg-emerald-950/40 border-2 border-dashed border-emerald-500/80 shadow-inner'
                                  : 'bg-slate-950/60 border border-dashed border-slate-800 hover:border-slate-700'
                              }`}
                            >
                              {shelfBoxes.length === 0 && !snapshot.isDraggingOver ? (
                                <div className="w-full flex flex-col items-center justify-center py-6 text-slate-600">
                                  <Layers className="w-6 h-6 mb-1 text-slate-700" />
                                  <span className="text-xs">Sekat rak kosong</span>
                                  <span className="text-[10px] text-slate-600">
                                    Geser boks arsip ke sini untuk menempatkan
                                  </span>
                                </div>
                              ) : null}

                              {shelfBoxes.map((box, index) => (
                                <Draggable
                                  key={box.id_box}
                                  draggableId={box.id_box}
                                  index={index}
                                >
                                  {(dragProvided, dragSnapshot) => (
                                    <div
                                      ref={dragProvided.innerRef}
                                      {...dragProvided.draggableProps}
                                      className={`w-64 sm:w-72 shrink-0 bg-slate-900 border rounded-xl p-3 flex flex-col justify-between select-none transition-shadow ${
                                        dragSnapshot.isDragging
                                          ? 'border-emerald-400 bg-slate-800 shadow-2xl scale-[1.03] z-50 ring-2 ring-emerald-500/60 rotate-1'
                                          : 'border-slate-800 hover:border-slate-700 shadow-sm hover:shadow-md'
                                      }`}
                                    >
                                      <div>
                                        {/* Card Top: ID & Drag Grip */}
                                        <div className="flex items-center justify-between mb-2">
                                          <div
                                            {...dragProvided.dragHandleProps}
                                            className="flex items-center space-x-1.5 cursor-grab active:cursor-grabbing text-slate-400 hover:text-emerald-400 transition p-1 -ml-1 rounded"
                                            title="Tahan & geser untuk memindahkan boks arsip"
                                          >
                                            <GripVertical className="w-4 h-4" />
                                            <span className="font-mono text-xs font-bold text-emerald-400">
                                              {box.id_box}
                                            </span>
                                          </div>

                                          <div className="flex items-center space-x-1">
                                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300">
                                              {box.lokasi?.baris || 'B1'}
                                            </span>
                                          </div>
                                        </div>

                                        {/* Nama Pelatihan */}
                                        <h5
                                          onClick={() => onViewDetail(box)}
                                          className="text-xs font-semibold text-slate-100 hover:text-emerald-300 line-clamp-2 leading-snug cursor-pointer mb-2"
                                          title={box.nama_pelatihan}
                                        >
                                          {box.nama_pelatihan}
                                        </h5>

                                        {/* Badges */}
                                        <div className="flex flex-wrap items-center gap-1 mb-2.5 text-[10px]">
                                          <span
                                            className={`px-1.5 py-0.2 rounded border font-medium ${
                                              box.status_arsip === 'Aktif' || box.status_arsip === 'Tersedia'
                                                ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                                                : box.status_arsip === 'Inaktif' || box.status_arsip === 'Tidak Lengkap'
                                                ? 'bg-amber-950 text-amber-300 border-amber-800'
                                                : 'bg-rose-950 text-rose-300 border-rose-800'
                                            }`}
                                          >
                                            {box.status_arsip}
                                          </span>
                                          <span className="px-1.5 py-0.2 rounded bg-slate-950 text-slate-400 border border-slate-800">
                                            {box.tahun_pelaksanaan}
                                          </span>
                                          <span className="px-1.5 py-0.2 rounded bg-slate-950 text-slate-400 border border-slate-800">
                                            {box.jumlah_peserta} Peserta
                                          </span>
                                        </div>
                                      </div>

                                      {/* Card Actions Footer */}
                                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setQuickMoveBox(box);
                                            setQuickTargetLemari(lemariKey);
                                            setQuickTargetRak(rakName);
                                          }}
                                          className="inline-flex items-center space-x-1 text-[11px] text-amber-400 hover:text-amber-300 px-2 py-1 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800 transition"
                                          title="Pindahkan Boks Arsip tanpa drag"
                                        >
                                          <ArrowRightLeft className="w-3 h-3" />
                                          <span>Pindah</span>
                                        </button>

                                        <div className="flex items-center space-x-1">
                                          <button
                                            type="button"
                                            onClick={() => onViewDetail(box)}
                                            className="px-2 py-1 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded text-[11px] transition"
                                          >
                                            Rincian
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => onShowQr(box)}
                                            className="p-1 text-emerald-400 hover:text-emerald-300 hover:bg-slate-800 rounded transition"
                                            title="QR Code"
                                          >
                                            <QrCode className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => onEdit(box)}
                                            className="p-1 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded transition"
                                            title="Edit Boks Arsip"
                                          >
                                            <Edit3 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </Draggable>
                              ))}

                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {/* Accessible Quick Move Modal (for mobile or click-based transfer) */}
      {quickMoveBox && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <ArrowRightLeft className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-sm text-white">
                  Pindahkan Boks Arsip ke Rak Baru
                </h3>
              </div>
              <button
                onClick={() => setQuickMoveBox(null)}
                className="text-slate-400 hover:text-white p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1 text-xs">
              <span className="font-mono font-bold text-emerald-400">{quickMoveBox.id_box}</span>
              <p className="font-medium text-slate-200 truncate">{quickMoveBox.nama_pelatihan}</p>
              <p className="text-[11px] text-slate-400">
                Lokasi sekarang: Lemari {quickMoveBox.lokasi?.lemari}, {quickMoveBox.lokasi?.rak}
              </p>
            </div>

            <form onSubmit={handleExecuteQuickMove} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Pilih Lemari Tujuan:
                </label>
                <select
                  value={quickTargetLemari}
                  onChange={(e) => setQuickTargetLemari(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {availableLemari.map((l) => (
                    <option key={`quick-lemari-${l}`} value={l.toString()}>
                      Lemari {l}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Pilih Sekat Rak Tujuan:
                </label>
                <select
                  value={quickTargetRak}
                  onChange={(e) => setQuickTargetRak(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {allKnownRaks.map((r) => (
                    <option key={`quick-rak-${r}`} value={r}>
                      {r.startsWith('Rak') ? r : `Rak ${r}`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex justify-end space-x-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setQuickMoveBox(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isMoving}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold transition disabled:opacity-50"
                >
                  {isMoving ? 'Menyimpan...' : 'Pindahkan Sekarang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
