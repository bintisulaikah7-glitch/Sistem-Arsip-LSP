import express, { Request, Response } from "express";
import http from "http";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { INITIAL_BOXES } from "./src/data/initialBoxes.ts";
import { BoksArsip } from "./src/types.ts";
import { deduplicateBoxes } from "./src/utils/csvParser.ts";

// Prevent unhandled rejection crashes from WebSocket disconnects during pre-warming/restart
process.on("unhandledRejection", (reason: any) => {
  const msg = reason?.message || String(reason || "");
  if (
    msg.includes("WebSocket closed without opened") ||
    msg.includes("ECONNRESET") ||
    msg.includes("EPIPE") ||
    msg.includes("socket hang up")
  ) {
    return;
  }
  console.error("Unhandled Rejection:", reason);
});

process.on("uncaughtException", (err: any) => {
  const msg = err?.message || String(err || "");
  if (
    msg.includes("WebSocket closed without opened") ||
    msg.includes("ECONNRESET") ||
    msg.includes("EPIPE") ||
    msg.includes("socket hang up")
  ) {
    return;
  }
  console.error("Uncaught Exception:", err);
});

const PORT = 3000;
const DATA_FILE = path.join(process.cwd(), "data", "boxes.json");

// Ensure data directory exists
if (!fs.existsSync(path.join(process.cwd(), "data"))) {
  fs.mkdirSync(path.join(process.cwd(), "data"), { recursive: true });
}

// In-memory store with disk persistence
let boxes: BoksArsip[] = [];

function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, "utf-8");
      boxes = deduplicateBoxes(JSON.parse(content));
    } else {
      boxes = deduplicateBoxes(INITIAL_BOXES);
      fs.writeFileSync(DATA_FILE, JSON.stringify(boxes, null, 2), "utf-8");
    }
  } catch (err) {
    console.error("Error loading data file, falling back to initial boxes:", err);
    boxes = deduplicateBoxes(INITIAL_BOXES);
  }
}

function saveData() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(boxes, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving data file:", err);
  }
}

loadData();

async function startServer() {
  const app = express();

  app.use(express.json());

  // CORS & Security headers for API
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") {
      res.sendStatus(204);
      return;
    }
    next();
  });

  // Support API calls with or without the /Sistem-Arsip-LSP base path prefix
  app.use((req, _res, next) => {
    if (req.url.startsWith("/Sistem-Arsip-LSP/api/")) {
      req.url = req.url.replace("/Sistem-Arsip-LSP/api/", "/api/");
    }
    next();
  });

  // Health check
  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({
      status: "online",
      engine: "Sistem Manajemen & Pencarian Berkas Arsip LSP API Engine",
      total_boxes: boxes.length,
      timestamp: new Date().toISOString()
    });
  });

  // 1. Search Box / Pelatihan
  // GET /api/boxes/search?q=...
  app.get("/api/boxes/search", (req: Request, res: Response) => {
    const q = ((req.query.q as string) || "").trim().toLowerCase();
    if (!q) {
      res.json(boxes);
      return;
    }

    const matched = boxes.filter((b) => {
      const matchName = b.nama_pelatihan.toLowerCase().includes(q);
      const matchId = b.id_box.toLowerCase().includes(q);
      const matchYear = b.tahun_pelaksanaan.toString().includes(q);
      const matchLemari = `lemari ${b.lokasi.lemari}`.includes(q) || `l${b.lokasi.lemari}`.includes(q);
      const matchStatusArsip = b.status_arsip.toLowerCase().includes(q);
      const matchStatusBarang = b.status_barang.toLowerCase().includes(q);
      return matchName || matchId || matchYear || matchLemari || matchStatusArsip || matchStatusBarang;
    });

    if (matched.length === 0) {
      res.status(404).json({
        status: 404,
        error: "Not Found",
        message: `Data berkas arsip dengan kata kunci pencarian '${req.query.q}' tidak ditemukan.`
      });
      return;
    }

    res.json(matched);
  });

  // 2. Scan QR Code Endpoint
  // GET /api/boxes/scan/:id_box
  app.get("/api/boxes/scan/:id_box", (req: Request, res: Response) => {
    const rawId = (req.params.id_box || "").trim().toUpperCase();
    const box = boxes.find((b) => b.id_box.trim().toUpperCase() === rawId);

    if (!box) {
      res.status(404).json({
        status: 404,
        error: "Not Found",
        message: `Hasil scan QR Code: Boks arsip '${req.params.id_box}' tidak terdaftar dalam sistem.`
      });
      return;
    }

    // Return pure valid JSON
    res.json(box);
  });

  // 3. Stats Summary
  app.get("/api/boxes/stats", (_req: Request, res: Response) => {
    const stats = {
      total_boks: boxes.length,
      status_arsip: {
        aktif: boxes.filter((b) => b.status_arsip === "Aktif" || b.status_arsip === "Tersedia").length,
        inaktif: boxes.filter((b) => b.status_arsip === "Inaktif" || b.status_arsip === "Tidak Lengkap").length,
        dimusnahkan: boxes.filter((b) => b.status_arsip === "Dimusnahkan" || b.status_arsip === "Tidak Tersedia").length
      },
      status_barang: {
        lengkap: boxes.filter((b) => b.status_barang === "Lengkap").length,
        tidak_lengkap: boxes.filter((b) => b.status_barang === "Tidak Lengkap" || b.status_barang === "Dipinjam").length,
        tidak_ada: boxes.filter((b) => b.status_barang === "Tidak Ada" || b.status_barang === "Diperbaiki").length
      },
      lemari_distribution: boxes.reduce((acc: Record<string, number>, curr) => {
        const key = `lemari_${curr.lokasi.lemari}`;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {}),
      total_peserta: boxes.reduce((acc, curr) => acc + (curr.jumlah_peserta || 0), 0),
      total_peserta_bk: boxes.reduce((acc, curr) => acc + (curr.jumlah_peserta_bk || 0), 0)
    };
    res.json(stats);
  });

  // 4. List / Filter All Boxes
  // GET /api/boxes
  app.get("/api/boxes", (req: Request, res: Response) => {
    let result = [...boxes];

    const { q, lemari, status_arsip, status_barang, tahun } = req.query;

    if (q) {
      const keyword = (q as string).toLowerCase().trim();
      result = result.filter(
        (b) =>
          b.nama_pelatihan.toLowerCase().includes(keyword) ||
          b.id_box.toLowerCase().includes(keyword) ||
          b.tahun_pelaksanaan.toString().includes(keyword)
      );
    }

    if (lemari) {
      const lemariNum = parseInt(lemari as string, 10);
      if (!isNaN(lemariNum)) {
        result = result.filter((b) => b.lokasi.lemari === lemariNum);
      }
    }

    if (status_arsip) {
      result = result.filter(
        (b) => b.status_arsip.toLowerCase() === (status_arsip as string).toLowerCase()
      );
    }

    if (status_barang) {
      result = result.filter(
        (b) => b.status_barang.toLowerCase() === (status_barang as string).toLowerCase()
      );
    }

    if (tahun) {
      const tahunNum = parseInt(tahun as string, 10);
      if (!isNaN(tahunNum)) {
        result = result.filter((b) => b.tahun_pelaksanaan === tahunNum);
      }
    }

    // If query specific was asked and none matched:
    if (q && result.length === 0) {
      res.status(404).json({
        status: 404,
        error: "Not Found",
        message: `Tidak ditemukan boks berkas arsip yang sesuai dengan kriteria '${q}'.`
      });
      return;
    }

    res.json(result);
  });

  // 5. Get Single Box by id_box
  // GET /api/boxes/:id_box
  app.get("/api/boxes/:id_box", (req: Request, res: Response) => {
    const rawId = (req.params.id_box || "").trim().toUpperCase();
    const box = boxes.find((b) => b.id_box.trim().toUpperCase() === rawId);

    if (!box) {
      res.status(404).json({
        status: 404,
        error: "Not Found",
        message: `Data boks berkas arsip dengan id_box '${req.params.id_box}' tidak ditemukan.`
      });
      return;
    }

    // Rule: Kembalikan jawaban HANYA berupa format JSON valid
    res.json(box);
  });

  // 6. Create New Box
  // POST /api/boxes
  app.post("/api/boxes", (req: Request, res: Response) => {
    const payload = req.body as Partial<BoksArsip>;

    // Validate 9 required attributes
    const errors: string[] = [];

    if (!payload.id_box || typeof payload.id_box !== "string" || !payload.id_box.trim()) {
      errors.push("id_box wajib diisi (contoh: 'BOX-L1-R1-001')");
    } else {
      const exists = boxes.some(
        (b) => b.id_box.trim().toUpperCase() === payload.id_box!.trim().toUpperCase()
      );
      if (exists) {
        errors.push(`id_box '${payload.id_box}' sudah digunakan.`);
      }
    }

    if (!payload.nama_pelatihan || typeof payload.nama_pelatihan !== "string" || !payload.nama_pelatihan.trim()) {
      errors.push("nama_pelatihan wajib diisi (String)");
    }

    if (payload.tahun_pelaksanaan === undefined || typeof payload.tahun_pelaksanaan !== "number" || isNaN(payload.tahun_pelaksanaan)) {
      errors.push("tahun_pelaksanaan wajib diisi berupa angka integer tahun");
    }

    if (payload.jumlah_peserta === undefined || typeof payload.jumlah_peserta !== "number" || payload.jumlah_peserta < 0) {
      errors.push("jumlah_peserta wajib diisi berupa angka integer >= 0");
    }

    if (payload.jumlah_peserta_bk === undefined || typeof payload.jumlah_peserta_bk !== "number" || payload.jumlah_peserta_bk < 0) {
      errors.push("jumlah_peserta_bk wajib diisi berupa angka integer >= 0 (Belum Kompeten)");
    }

    if (!payload.lokasi || typeof payload.lokasi !== "object") {
      errors.push("lokasi wajib berupa Object: { lemari: 1-4, rak: string|number, baris: string|number }");
    } else {
      const lemariNum = Number(payload.lokasi.lemari);
      if (isNaN(lemariNum) || lemariNum < 1) {
        errors.push("lokasi.lemari harus berupa angka positif (>= 1)");
      }
      if (!payload.lokasi.rak && payload.lokasi.rak !== 0) {
        errors.push("lokasi.rak wajib diisi");
      }
      if (!payload.lokasi.baris && payload.lokasi.baris !== 0) {
        errors.push("lokasi.baris wajib diisi");
      }
    }

    const validStatusArsip = ["Aktif", "Inaktif", "Dimusnahkan"];
    if (!payload.status_arsip || !validStatusArsip.includes(payload.status_arsip)) {
      errors.push("status_arsip harus salah satu dari: 'Aktif', 'Inaktif', atau 'Dimusnahkan'");
    }

    const validStatusBarang = ["Lengkap", "Dipinjam", "Diperbaiki"];
    if (!payload.status_barang || !validStatusBarang.includes(payload.status_barang)) {
      errors.push("status_barang harus salah satu dari: 'Lengkap', 'Dipinjam', atau 'Diperbaiki'");
    }

    if (!payload.link_dokumentasi || typeof payload.link_dokumentasi !== "string" || !payload.link_dokumentasi.trim()) {
      errors.push("link_dokumentasi wajib berupa URL String");
    }

    if (errors.length > 0) {
      res.status(400).json({
        status: 400,
        error: "Bad Request",
        message: "Validasi atribut boks file arsip gagal.",
        errors
      });
      return;
    }

    const newBox: BoksArsip = {
      id_box: payload.id_box!.trim(),
      nama_pelatihan: payload.nama_pelatihan!.trim(),
      tahun_pelaksanaan: Math.round(Number(payload.tahun_pelaksanaan)),
      jumlah_peserta: Math.round(Number(payload.jumlah_peserta)),
      jumlah_peserta_bk: Math.round(Number(payload.jumlah_peserta_bk)),
      lokasi: {
        lemari: Number(payload.lokasi!.lemari),
        rak: payload.lokasi!.rak,
        baris: payload.lokasi!.baris
      },
      status_arsip: payload.status_arsip as BoksArsip["status_arsip"],
      status_barang: payload.status_barang as BoksArsip["status_barang"],
      link_dokumentasi: payload.link_dokumentasi!.trim()
    };

    boxes.unshift(newBox);
    saveData();

    res.status(201).json(newBox);
  });

  // 7. Update Box
  // PUT /api/boxes/:id_box
  app.put("/api/boxes/:id_box", (req: Request, res: Response) => {
    const rawId = (req.params.id_box || "").trim().toUpperCase();
    const index = boxes.findIndex((b) => b.id_box.trim().toUpperCase() === rawId);

    if (index === -1) {
      res.status(404).json({
        status: 404,
        error: "Not Found",
        message: `Boks arsip dengan id_box '${req.params.id_box}' tidak ditemukan untuk diperbarui.`
      });
      return;
    }

    const payload = req.body as Partial<BoksArsip>;
    const current = boxes[index];

    const updated: BoksArsip = {
      id_box: current.id_box, // ID is immutable
      nama_pelatihan: payload.nama_pelatihan ? payload.nama_pelatihan.trim() : current.nama_pelatihan,
      tahun_pelaksanaan: payload.tahun_pelaksanaan !== undefined ? Math.round(Number(payload.tahun_pelaksanaan)) : current.tahun_pelaksanaan,
      jumlah_peserta: payload.jumlah_peserta !== undefined ? Math.round(Number(payload.jumlah_peserta)) : current.jumlah_peserta,
      jumlah_peserta_bk: payload.jumlah_peserta_bk !== undefined ? Math.round(Number(payload.jumlah_peserta_bk)) : current.jumlah_peserta_bk,
      lokasi: payload.lokasi
        ? {
            lemari: Number(payload.lokasi.lemari) || current.lokasi.lemari,
            rak: payload.lokasi.rak || current.lokasi.rak,
            baris: payload.lokasi.baris || current.lokasi.baris
          }
        : current.lokasi,
      status_arsip: (payload.status_arsip || current.status_arsip) as BoksArsip["status_arsip"],
      status_barang: (payload.status_barang || current.status_barang) as BoksArsip["status_barang"],
      link_dokumentasi: payload.link_dokumentasi ? payload.link_dokumentasi.trim() : current.link_dokumentasi
    };

    boxes[index] = updated;
    saveData();

    res.json(updated);
  });

  // 8. Delete Box
  // DELETE /api/boxes/:id_box
  app.delete("/api/boxes/:id_box", (req: Request, res: Response) => {
    const rawId = (req.params.id_box || "").trim().toUpperCase();
    const index = boxes.findIndex((b) => b.id_box.trim().toUpperCase() === rawId);

    if (index === -1) {
      res.status(404).json({
        status: 404,
        error: "Not Found",
        message: `Boks arsip dengan id_box '${req.params.id_box}' tidak ditemukan.`
      });
      return;
    }

    const deleted = boxes.splice(index, 1)[0];
    saveData();

    res.json({
      status: 200,
      message: `Data boks arsip '${deleted.id_box}' berhasil dihapus dari sistem.`,
      deleted_box: deleted
    });
  });

  // 9. Reset to default data
  app.post("/api/boxes/reset", (_req: Request, res: Response) => {
    boxes = deduplicateBoxes(INITIAL_BOXES);
    saveData();
    res.json({
      status: 200,
      message: "Data boks arsip LSP berhasil direset ke dataset awal.",
      total: boxes.length
    });
  });

  // 10. Sync Google Sheets data into backend
  // POST /api/boxes/sync-sheets
  app.post("/api/boxes/sync-sheets", (req: Request, res: Response) => {
    const newBoxes = req.body;
    if (!Array.isArray(newBoxes)) {
      res.status(400).json({
        status: 400,
        error: "Bad Request",
        message: "Data harus berupa array objek boks arsip."
      });
      return;
    }

    boxes = deduplicateBoxes(newBoxes);
    saveData();

    res.json({
      status: 200,
      message: `Berhasil menyinkronkan ${boxes.length} data boks arsip dari Google Sheets.`,
      total: boxes.length
    });
  });

  // 11. Google Sheets CSV Proxy (Bypasses Browser CORS)
  // GET /api/sheets-proxy?url=...
  app.get("/api/sheets-proxy", async (req: Request, res: Response) => {
    let rawTargetUrl =
      (req.query.url as string) ||
      "https://docs.google.com/spreadsheets/d/1Cq3QzccIPDSVyXY2dq4S61wHVRJFh0LaP2xT6OViK-M/export?format=csv&gid=0";

    // Auto-convert Google Sheets edit/sharing link to CSV export link
    let targetUrl = rawTargetUrl.trim();
    if (!targetUrl.includes("/export?format=csv")) {
      const match = targetUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        const sheetId = match[1];
        const gidMatch = targetUrl.match(/[?&#]gid=([0-9]+)/);
        const gidParam = gidMatch ? `&gid=${gidMatch[1]}` : "&gid=0";
        targetUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv${gidParam}`;
      }
    }

    try {
      const response = await fetch(targetUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          Accept: "text/csv,text/plain,*/*"
        }
      });

      const text = await response.text();
      const trimmed = text.trim();
      const isHtml =
        trimmed.startsWith("<!DOCTYPE") ||
        trimmed.startsWith("<html") ||
        text.includes("<title>Google Drive – Page Not Found</title>") ||
        text.includes("docs.google.com/error");

      if (!response.ok || isHtml) {
        res.status(response.ok ? 422 : response.status).json({
          status: response.status,
          error: "Google Sheets Unavailable",
          isHtml: true,
          message:
            "File Google Sheets tidak ditemukan atau hak akses belum disetel ke 'Siapa saja yang memiliki link dapat melihat' (Anyone with the link).",
          sample: text.slice(0, 300)
        });
        return;
      }

      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.send(text);
    } catch (err: any) {
      res.status(502).json({
        status: 502,
        error: "Proxy Fetch Error",
        message: err.message || "Gagal menghubungi server Google Sheets."
      });
    }
  });

  const httpServer = http.createServer(app);

  // Vite middleware setup
  let vite: any = null;
  if (process.env.NODE_ENV !== "production") {
    // Redirect root / to /Sistem-Arsip-LSP/ in development so Vite SPA middleware resolves properly
    app.get("/", (_req, res) => {
      res.redirect("/Sistem-Arsip-LSP/");
    });

    vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: {
          server: httpServer
        }
      },
      appType: "spa"
    });

    // Guard against WebSocket errors on server reload/restart
    if (vite.ws) {
      vite.ws.on("error", (err: any) => {
        const msg = err?.message || String(err || "");
        if (msg.includes("WebSocket closed without opened") || err?.code === "ECONNRESET") {
          return;
        }
        console.warn("[Vite WS Warning]", msg);
      });
    }

    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use("/Sistem-Arsip-LSP", express.static(distPath));
    app.use(express.static(distPath));
    app.get(["*", "/Sistem-Arsip-LSP/*"], (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Socket error suppression on HTTP upgrade
  httpServer.on("upgrade", (_req, socket) => {
    socket.on("error", () => {
      // Ignore socket errors on disconnect/restart
    });
  });

  const server = httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`LSP Archive API Engine running on http://0.0.0.0:${PORT}`);
  });

  // Graceful shutdown handling
  const gracefulShutdown = async () => {
    try {
      if (vite) {
        await vite.close();
      }
    } catch (_) {}
    server.close(() => {
      process.exit(0);
    });
  };

  process.once("SIGTERM", gracefulShutdown);
  process.once("SIGINT", gracefulShutdown);
}

startServer();
