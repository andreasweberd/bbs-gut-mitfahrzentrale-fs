import express from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// In-Memory Data Store (pre-seeded with realistic BBS GuT data)
interface DBStudent {
  id: number;
  nachname: string;
  email: string;
  token: string;
  status: 'aktiv' | 'inaktiv';
  created_at: string;
}

interface DBEntry {
  id: number;
  titel: string;
  nachricht: string;
  typ: 'Angebot' | 'Gesuch';
  sitzplaetze?: number | null;
  schueler_id: number;
  erstellungsdatum: string;
}

let students: DBStudent[] = [
  {
    id: 1,
    nachname: "Weber",
    email: "senior.weber@gmail.com",
    token: "TOKEN-2026-001",
    status: "aktiv",
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
  },
  {
    id: 2,
    nachname: "Müller",
    email: "m.mueller@bbs-gut-trier.de",
    token: "TOKEN-2026-002",
    status: "aktiv",
    created_at: new Date(Date.now() - 86400000 * 8).toISOString(),
  },
  {
    id: 3,
    nachname: "Schmidt",
    email: "l.schmidt@bbs-gut.de",
    token: "TOKEN-2026-003",
    status: "aktiv",
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 4,
    nachname: "Schneider",
    email: "p.schneider@schueler-gut.de",
    token: "TOKEN-2026-004",
    status: "inaktiv",
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
];

let entries: DBEntry[] = [
  {
    id: 101,
    titel: "Tägliche Mitfahrt ab Konz / Saarburg zur BBS GuT",
    nachricht: "Fahre jeden Schultag um 07:15 Uhr an der Haltestelle Konz Mitte ab. Biete pünktliche und entspannte Fahrt im Nichtraucher-Pkw. Rückfahrt nach der 6. oder 8. Stunde.",
    typ: "Angebot",
    sitzplaetze: 3,
    schueler_id: 1,
    erstellungsdatum: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 102,
    titel: "Suche Mitgelegenheit ab Trier-Nord / Hauptbahnhof",
    nachricht: "Hallo zusammen! Suche für Montag und Mittwoch zur 1. Stunde (07:45 Uhr) eine Mitfahrgelegenheit vom Hbf Trier zur Berufsbildenden Schule Gewerbe und Technik. Beteilige mich gerne am Spritgeld!",
    typ: "Gesuch",
    sitzplaetze: null,
    schueler_id: 2,
    erstellungsdatum: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 103,
    titel: "Freie Plätze ab Schweich / Kenn (Di & Do)",
    nachricht: "Fahre dienstags und donnerstags um 07:20 Uhr ab Schweich DB-Bahnhof über Kenn direkt zur BBS GuT. 2 freie Plätze im Ford Focus.",
    typ: "Angebot",
    sitzplaetze: 2,
    schueler_id: 3,
    erstellungsdatum: new Date(Date.now() - 3600000 * 8).toISOString(),
  },
];

let nextStudentId = 5;
let nextEntryId = 104;

const ADMIN_SECRET = process.env.ADMIN_TOKEN || "Wulli";

// Helper: Find student by token
function getStudentByToken(token: string): DBStudent | null {
  if (!token) return null;
  const found = students.find((s) => s.token === token && s.status === "aktiv");
  return found || null;
}

// Helper: Spam Detector
function checkSpam(titel: string, nachricht: string): boolean {
  const forbidden = ["casino", "gewinnspiel", "kredit24", "viagra", "poker-online"];
  const text = `${titel} ${nachricht}`.toLowerCase();
  return forbidden.some((kw) => text.includes(kw));
}

// --- API ROUTES ---

// 1. Anmelden / Auth
app.post("/api/v1/anmelden", (req, res) => {
  const { token } = req.body || {};
  if (!token) {
    return res.status(400).json({ erfolg: false, fehler: "Kein Token im Request angegeben." });
  }

  if (token === ADMIN_SECRET) {
    return res.json({ erfolg: true, status: "aktiv", isAdmin: true });
  }

  const schueler = getStudentByToken(token);
  if (!schueler) {
    return res.status(401).json({ erfolg: false, fehler: "Token ungültig oder inaktiv." });
  }

  return res.json({ erfolg: true, status: schueler.status, isAdmin: false });
});

// 2. Public Listings
app.get("/api/v1/eintraege", (req, res) => {
  const result = entries
    .map((e) => {
      const schueler = students.find((s) => s.id === e.schueler_id);
      return {
        id: e.id,
        titel: e.titel,
        nachricht: e.nachricht,
        typ: e.typ,
        sitzplaetze: e.sitzplaetze,
        erstellungsdatum: e.erstellungsdatum,
        schueler_id: e.schueler_id,
        verfasser_aktiv: schueler ? schueler.status === "aktiv" : false,
      };
    })
    .sort((a, b) => new Date(b.erstellungsdatum).getTime() - new Date(a.erstellungsdatum).getTime());

  return res.json(result);
});

// 3. Create Listing
app.post("/api/v1/eintraege", (req, res) => {
  const { token, titel, typ, nachricht, sitzplaetze } = req.body || {};

  if (!token) {
    return res.status(403).json({ fehler: "Token fehlt." });
  }

  const schueler = getStudentByToken(token);
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
  const newEntry: DBEntry = {
    id: nextEntryId++,
    titel: cleanTitel,
    nachricht: cleanNachricht,
    typ: cleanTyp as "Angebot" | "Gesuch",
    sitzplaetze: validSeats,
    schueler_id: authorId,
    erstellungsdatum: new Date().toISOString(),
  };

  entries.push(newEntry);
  return res.status(201).json({ erfolg: true, id: newEntry.id });
});

// 4. Contact Details
app.get("/api/v1/eintraege/:id/kontakt", (req, res) => {
  const token = req.headers["x-auth-token"] as string;
  const schueler = getStudentByToken(token);

  if (!token || (!schueler && token !== ADMIN_SECRET)) {
    return res.status(401).json({ fehler: "Token ungültig oder fehlt." });
  }

  const entryId = parseInt(req.params.id, 10);
  const entry = entries.find((e) => e.id === entryId);

  if (!entry) {
    return res.status(404).json({ fehler: "Eintrag nicht gefunden." });
  }

  const author = students.find((s) => s.id === entry.schueler_id);
  if (!author) {
    return res.status(404).json({ fehler: "Verfasser nicht gefunden." });
  }

  return res.json({
    nachname: author.nachname,
    email: author.email,
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

app.get("/api/v1/admin/nutzer", adminAuthMiddleware, (req, res) => {
  return res.json(students);
});

app.post("/api/v1/admin/nutzer", adminAuthMiddleware, (req, res) => {
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

  const exists = students.some((s) => s.email.toLowerCase() === cleanEmail.toLowerCase() || s.token === cleanToken);
  if (exists) {
    return res.status(400).json({ fehler: "E-Mail oder Token bereits vergeben." });
  }

  const newStudent: DBStudent = {
    id: nextStudentId++,
    nachname: cleanName,
    email: cleanEmail,
    token: cleanToken,
    status: cleanStatus as "aktiv" | "inaktiv",
    created_at: new Date().toISOString(),
  };

  students.push(newStudent);
  return res.status(201).json({ erfolg: true, id: newStudent.id });
});

app.put("/api/v1/admin/nutzer/:id/status", adminAuthMiddleware, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { status } = req.body || {};

  const cleanStatus = (status || "").trim();
  if (cleanStatus !== "aktiv" && cleanStatus !== "inaktiv") {
    return res.status(400).json({ fehler: "Status muss 'aktiv' oder 'inaktiv' sein." });
  }

  const student = students.find((s) => s.id === id);
  if (!student) {
    return res.status(404).json({ fehler: "Nutzer nicht gefunden." });
  }

  student.status = cleanStatus as "aktiv" | "inaktiv";
  return res.json({ erfolg: true, id: student.id, status: student.status });
});

app.delete("/api/v1/admin/nutzer/:id", adminAuthMiddleware, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const index = students.findIndex((s) => s.id === id);

  if (index === -1) {
    return res.status(404).json({ fehler: "Nutzer nicht gefunden." });
  }

  students.splice(index, 1);
  entries = entries.filter((e) => e.schueler_id !== id);

  return res.json({ erfolg: true, message: "Nutzer und alle zugehörigen Einträge wurden gelöscht." });
});

app.get("/api/v1/admin/eintraege", adminAuthMiddleware, (req, res) => {
  const fullEntries = entries.map((e) => {
    const author = students.find((s) => s.id === e.schueler_id);
    return {
      ...e,
      nachname: author ? author.nachname : "Gelöschter Nutzer",
      email: author ? author.email : "-",
      schueler_status: author ? author.status : "inaktiv",
    };
  });
  return res.json(fullEntries);
});

app.delete("/api/v1/admin/eintraege/:id", adminAuthMiddleware, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const index = entries.findIndex((e) => e.id === id);

  if (index === -1) {
    return res.status(404).json({ fehler: "Eintrag nicht gefunden." });
  }

  entries.splice(index, 1);
  return res.json({ erfolg: true, id });
});

app.get("/api/v1/admin/stats", adminAuthMiddleware, (req, res) => {
  const totalUsers = students.length;
  const activeUsers = students.filter((s) => s.status === "aktiv").length;
  const inactiveUsers = totalUsers - activeUsers;
  const totalEntries = entries.length;
  const angeboteCount = entries.filter((e) => e.typ === "Angebot").length;
  const gesucheCount = entries.filter((e) => e.typ === "Gesuch").length;
  const totalSeatsOffered = entries.reduce((acc, curr) => acc + (curr.sitzplaetze || 0), 0);

  return res.json({
    totalUsers,
    activeUsers,
    inactiveUsers,
    totalEntries,
    angeboteCount,
    gesucheCount,
    totalSeatsOffered,
  });
});

// START SERVER / VITE MIDDLEWARE
async function startServer() {
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
      server: { middlewareMode: true },
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
    console.log(`BBS GuT Rideshare Server running on http://localhost:${PORT}`);
  });
}

startServer();
