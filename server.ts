import express from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import {
  initDatabase,
  isDbMySQL,
  getStudentByToken,
  getAllStudents,
  createStudent,
  updateStudentStatus,
  deleteStudent,
  getAllPublicEntries,
  createEntry,
  getEntryById,
  getStudentById,
  deleteEntry,
  getAdminEntries,
  getStats,
} from "./db.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

const ADMIN_SECRET = process.env.ADMIN_TOKEN || "Wulli";

// Helper: Spam Detector
function checkSpam(titel: string, nachricht: string): boolean {
  const forbidden = ["casino", "gewinnspiel", "kredit24", "viagra", "poker-online"];
  const text = `${titel} ${nachricht}`.toLowerCase();
  return forbidden.some((kw) => text.includes(kw));
}

// --- HEALTH & STATUS ROUTE ---
app.get("/api/v1/health", (req, res) => {
  res.json({
    status: "ok",
    database: isDbMySQL() ? "mysql" : "in-memory",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
  });
});

// --- API ROUTES ---

// 1. Anmelden / Auth
app.post("/api/v1/anmelden", async (req, res) => {
  const { token } = req.body || {};
  if (!token) {
    return res.status(400).json({ erfolg: false, fehler: "Kein Token im Request angegeben." });
  }

  if (token === ADMIN_SECRET) {
    return res.json({
      erfolg: true,
      status: "aktiv",
      isAdmin: true,
      schuelerId: 0,
      nachname: "Administrator",
    });
  }

  const schueler = await getStudentByToken(token);
  if (!schueler) {
    return res.status(401).json({ erfolg: false, fehler: "Token ungültig oder inaktiv." });
  }

  return res.json({
    erfolg: true,
    status: schueler.status,
    isAdmin: false,
    schuelerId: schueler.id,
    nachname: schueler.nachname,
    email: schueler.email,
  });
});

// Check Current User session
app.get("/api/v1/me", async (req, res) => {
  const token = (req.headers["x-auth-token"] as string) || "";
  if (!token) {
    return res.status(401).json({ erfolg: false, fehler: "Kein Token vorhanden." });
  }

  if (token === ADMIN_SECRET) {
    return res.json({
      erfolg: true,
      status: "aktiv",
      isAdmin: true,
      schuelerId: 0,
      nachname: "Administrator",
    });
  }

  const schueler = await getStudentByToken(token);
  if (!schueler) {
    return res.status(401).json({ erfolg: false, fehler: "Token ungültig oder inaktiv." });
  }

  return res.json({
    erfolg: true,
    status: schueler.status,
    isAdmin: false,
    schuelerId: schueler.id,
    nachname: schueler.nachname,
    email: schueler.email,
  });
});

// 2. Public Listings
app.get("/api/v1/eintraege", async (req, res) => {
  try {
    const result = await getAllPublicEntries();
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ fehler: "Fehler beim Laden der Einträge." });
  }
});

// 3. Create Listing
app.post("/api/v1/eintraege", async (req, res) => {
  const { token, titel, typ, nachricht, sitzplaetze } = req.body || {};

  if (!token) {
    return res.status(403).json({ fehler: "Token fehlt." });
  }

  const schueler = await getStudentByToken(token);
  if (!schueler && token !== ADMIN_SECRET) {
    return res.status(403).json({ fehler: "Token ungültig oder inaktiv." });
  }

  const cleanTitel = (titel || "").trim();
  const cleanTyp = (typ || "").trim();
  const cleanNachricht = (nachricht || "").trim();

  if (!cleanTitel || !cleanTyp || !cleanNachricht) {
    return res.status(400).json({ fehler: "Felder 'titel', 'typ' und 'nachricht' sind Pflicht." });
  }

  if (cleanTyp !== "Angebot" && cleanTyp !== "Gesuch") {
    return res.status(400).json({ fehler: "Typ muss 'Angebot' oder 'Gesuch' sein." });
  }

  let validSeats: number | null = null;
  if (cleanTyp === "Angebot") {
    const parsed = Number(sitzplaetze);
    if (isNaN(parsed) || parsed <= 0) {
      return res.status(400).json({ fehler: "Bei einem Angebot müssen Sitzplätze > 0 angegeben werden." });
    }
    validSeats = Math.floor(parsed);
  }

  if (checkSpam(cleanTitel, cleanNachricht)) {
    return res.status(400).json({ fehler: "Spam erkannt. Eintrag wurde abgelehnt." });
  }

  const authorId = schueler ? schueler.id : 1; // Default to ID 1 if admin creates
  const result = await createEntry(
    cleanTitel,
    cleanNachricht,
    cleanTyp as "Angebot" | "Gesuch",
    validSeats,
    authorId
  );

  if (!result.success) {
    return res.status(500).json({ fehler: result.error || "Fehler beim Erstellen des Eintrags." });
  }

  return res.status(201).json({ erfolg: true, id: result.id });
});

// 4. Contact Details
app.get("/api/v1/eintraege/:id/kontakt", async (req, res) => {
  const token = req.headers["x-auth-token"] as string;
  const schueler = await getStudentByToken(token);

  if (!token || (!schueler && token !== ADMIN_SECRET)) {
    return res.status(401).json({ fehler: "Token ungültig oder fehlt." });
  }

  const entryId = parseInt(req.params.id, 10);
  const entry = await getEntryById(entryId);

  if (!entry) {
    return res.status(404).json({ fehler: "Eintrag nicht gefunden." });
  }

  const author = await getStudentById(entry.schueler_id);
  if (!author) {
    return res.status(404).json({ fehler: "Verfasser nicht gefunden." });
  }

  return res.json({
    nachname: author.nachname,
    email: author.email,
  });
});

// 5. Delete Entry (User deleting own entry or Admin)
app.delete("/api/v1/eintraege/:id", async (req, res) => {
  const token = req.headers["x-auth-token"] as string;
  if (!token) {
    return res.status(401).json({ fehler: "Authentifizierung erforderlich. Bitte Token übergeben." });
  }

  const id = parseInt(req.params.id, 10);
  const entry = await getEntryById(id);

  if (!entry) {
    return res.status(404).json({ fehler: "Eintrag nicht gefunden oder bereits gelöscht." });
  }

  const isAdminUser = token === ADMIN_SECRET;
  const schueler = await getStudentByToken(token);

  if (!isAdminUser && (!schueler || schueler.id !== entry.schueler_id)) {
    return res.status(403).json({ fehler: "Du darfst nur deine eigenen Einträge löschen." });
  }

  const deleted = await deleteEntry(id);
  if (!deleted) {
    return res.status(500).json({ fehler: "Fehler beim Löschen des Eintrags." });
  }

  return res.json({
    erfolg: true,
    message: "Eintrag erfolgreich gelöscht.",
    id,
  });
});

// --- ADMIN ROUTES ---
function adminAuthMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const token = req.headers["x-auth-token"];
  if (token !== ADMIN_SECRET) {
    return res.status(403).json({ fehler: "Kein Admin-Zugriff." });
  }
  next();
}

app.get("/api/v1/admin/nutzer", adminAuthMiddleware, async (req, res) => {
  const allStudents = await getAllStudents();
  return res.json(allStudents);
});

app.post("/api/v1/admin/nutzer", adminAuthMiddleware, async (req, res) => {
  const { nachname, email, token, status } = req.body || {};

  const cleanName = (nachname || "").trim();
  const cleanEmail = (email || "").trim();
  const cleanToken = (token || "").trim();
  const cleanStatus = (status || "aktiv").trim();

  if (!cleanName || !cleanEmail || !cleanToken) {
    return res.status(400).json({ fehler: "Felder 'nachname', 'email' und 'token' sind Pflicht." });
  }

  if (cleanStatus !== "aktiv" && cleanStatus !== "inaktiv") {
    return res.status(400).json({ fehler: "Status muss 'aktiv' oder 'inaktiv' sein." });
  }

  const result = await createStudent(
    cleanName,
    cleanEmail,
    cleanToken,
    cleanStatus as "aktiv" | "inaktiv"
  );

  if (!result.success) {
    return res.status(400).json({ fehler: result.error || "Fehler beim Erstellen des Nutzers." });
  }

  return res.status(201).json({ erfolg: true, id: result.id });
});

app.put("/api/v1/admin/nutzer/:id/status", adminAuthMiddleware, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { status } = req.body || {};

  const cleanStatus = (status || "").trim();
  if (cleanStatus !== "aktiv" && cleanStatus !== "inaktiv") {
    return res.status(400).json({ fehler: "Status muss 'aktiv' oder 'inaktiv' sein." });
  }

  const updated = await updateStudentStatus(id, cleanStatus as "aktiv" | "inaktiv");
  if (!updated) {
    return res.status(404).json({ fehler: "Nutzer nicht gefunden." });
  }

  return res.json({ erfolg: true, id, status: cleanStatus });
});

app.delete("/api/v1/admin/nutzer/:id", adminAuthMiddleware, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const deleted = await deleteStudent(id);

  if (!deleted) {
    return res.status(404).json({ fehler: "Nutzer nicht gefunden." });
  }

  return res.json({ erfolg: true, message: "Nutzer und alle zugehörigen Einträge wurden gelöscht." });
});

app.get("/api/v1/admin/eintraege", adminAuthMiddleware, async (req, res) => {
  const fullEntries = await getAdminEntries();
  return res.json(fullEntries);
});

app.delete("/api/v1/admin/eintraege/:id", adminAuthMiddleware, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const deleted = await deleteEntry(id);

  if (!deleted) {
    return res.status(404).json({ fehler: "Eintrag nicht gefunden." });
  }

  return res.json({ erfolg: true, id });
});

app.get("/api/v1/admin/stats", adminAuthMiddleware, async (req, res) => {
  const stats = await getStats();
  return res.json(stats);
});

// START SERVER / VITE MIDDLEWARE
async function startServer() {
  // Initialize Database (MySQL or fallback to in-memory)
  const dbStatus = await initDatabase();
  console.log(`[Status] Datenbank: ${dbStatus.message}`);

  const isProduction =
    process.env.NODE_ENV === "production" ||
    process.argv[1]?.includes("server.cjs") ||
    !fs.existsSync(path.resolve(process.cwd(), "src/main.tsx"));

  if (isProduction) {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: "spa",
    });
    app.use(vite.middlewares);

    app.use("*", async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = fs.readFileSync(path.resolve(process.cwd(), "index.html"), "utf-8");
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`BBS GuT Rideshare Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
