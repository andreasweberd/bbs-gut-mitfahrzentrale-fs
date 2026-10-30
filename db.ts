import mysql from "mysql2/promise";

export interface DBStudent {
  id: number;
  nachname: string;
  email: string;
  token: string;
  status: "aktiv" | "inaktiv";
  created_at: string;
}

export interface DBEntry {
  id: number;
  titel: string;
  nachricht: string;
  typ: "Angebot" | "Gesuch";
  sitzplaetze?: number | null;
  schueler_id: number;
  erstellungsdatum: string;
}

// In-Memory Fallback State (pre-seeded with realistic BBS GuT data)
let memStudents: DBStudent[] = [
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

let memEntries: DBEntry[] = [
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
    nachricht: "Hallo zusammen! Suche für Montag und Mittwoch zur 1. Stunde (07:45 Uhr) eine Mitfahrgelegenheit vom Hbf Trier zur Berufsbildenden Schule Gestaltung und Technik. Beteilige mich gerne am Spritgeld!",
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

let memNextStudentId = 5;
let memNextEntryId = 104;

let pool: mysql.Pool | null = null;
let isUsingMySQL = false;

export async function initDatabase(): Promise<{ isMySQL: boolean; message: string }> {
  const host = process.env.MYSQL_HOST;
  const user = process.env.MYSQL_USER;
  const database = process.env.MYSQL_DATABASE;
  const databaseUrl = process.env.DATABASE_URL;

  // If no MySQL connection parameters are supplied, gracefully use in-memory store
  if (!host && !databaseUrl) {
    console.log("[DB] Keine MySQL-Umgebungsvariablen gefunden (MYSQL_HOST oder DATABASE_URL). Verwende In-Memory-Speicher.");
    isUsingMySQL = false;
    return { isMySQL: false, message: "In-Memory Datenspeicher aktiv" };
  }

  try {
    const config: mysql.PoolOptions = databaseUrl
      ? { uri: databaseUrl }
      : {
          host: host || "localhost",
          port: process.env.MYSQL_PORT ? parseInt(process.env.MYSQL_PORT, 10) : 3306,
          user: user || "root",
          password: process.env.MYSQL_PASSWORD || "",
          database: database || "bbs_mitfahrzentrale",
          waitForConnections: true,
          connectionLimit: 10,
          queueLimit: 0,
          enableKeepAlive: true,
          keepAliveInitialDelay: 10000,
        };

    pool = mysql.createPool(config);

    // Test connection
    const testConn = await pool.getConnection();
    await testConn.ping();
    testConn.release();

    console.log(`[DB] Erfolgreich mit MySQL-Datenbank '${database || "configured db"}' verbunden.`);

    // Initialize Schema if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`schueler\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`nachname\` VARCHAR(100) NOT NULL,
        \`email\` VARCHAR(191) NOT NULL UNIQUE,
        \`token\` VARCHAR(100) NOT NULL UNIQUE,
        \`status\` ENUM('aktiv', 'inaktiv') NOT NULL DEFAULT 'aktiv',
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX \`idx_schueler_token\` (\`token\`),
        INDEX \`idx_schueler_status\` (\`status\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`eintraege\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`titel\` VARCHAR(255) NOT NULL,
        \`nachricht\` TEXT NOT NULL,
        \`typ\` ENUM('Angebot', 'Gesuch') NOT NULL,
        \`sitzplaetze\` INT NULL DEFAULT NULL,
        \`schueler_id\` INT NOT NULL,
        \`erstellungsdatum\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX \`idx_eintraege_typ\` (\`typ\`),
        INDEX \`idx_eintraege_schueler\` (\`schueler_id\`),
        INDEX \`idx_eintraege_datum\` (\`erstellungsdatum\` DESC),
        CONSTRAINT \`fk_eintraege_schueler\`
          FOREIGN KEY (\`schueler_id\`)
          REFERENCES \`schueler\` (\`id\`)
          ON DELETE CASCADE
          ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Check if table is empty, seed initial data
    const [rows]: any = await pool.query("SELECT COUNT(*) as count FROM schueler");
    if (rows[0].count === 0) {
      console.log("[DB] MySQL-Tabelle 'schueler' ist leer. Füge BBS GuT Standard-Daten ein...");
      for (const s of memStudents) {
        await pool.query(
          "INSERT INTO schueler (id, nachname, email, token, status, created_at) VALUES (?, ?, ?, ?, ?, ?)",
          [s.id, s.nachname, s.email, s.token, s.status, new Date(s.created_at)]
        );
      }
      for (const e of memEntries) {
        await pool.query(
          "INSERT INTO eintraege (id, titel, nachricht, typ, sitzplaetze, schueler_id, erstellungsdatum) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [e.id, e.titel, e.nachricht, e.typ, e.sitzplaetze, e.schueler_id, new Date(e.erstellungsdatum)]
        );
      }
      console.log("[DB] Standard-Daten erfolgreich in MySQL eingepflegt.");
    }

    isUsingMySQL = true;
    return { isMySQL: true, message: `Verbunden mit MySQL (${host || "URL"})` };
  } catch (err: any) {
    console.error("[DB] Fehler bei der MySQL-Verbindung:", err.message);
    console.log("[DB] Automatischer Fallback auf In-Memory-Speicher, damit die Anwendung betriebsbereit bleibt.");
    pool = null;
    isUsingMySQL = false;
    return { isMySQL: false, message: `Fallback auf In-Memory: ${err.message}` };
  }
}

export function isDbMySQL(): boolean {
  return isUsingMySQL;
}

// Student Data Operations
export async function getStudentByToken(token: string): Promise<DBStudent | null> {
  if (!token) return null;

  if (isUsingMySQL && pool) {
    const [rows]: any = await pool.query(
      "SELECT id, nachname, email, token, status, created_at FROM schueler WHERE token = ? AND status = 'aktiv' LIMIT 1",
      [token]
    );
    if (rows.length > 0) {
      const r = rows[0];
      return {
        id: r.id,
        nachname: r.nachname,
        email: r.email,
        token: r.token,
        status: r.status,
        created_at: new Date(r.created_at).toISOString(),
      };
    }
    return null;
  }

  const found = memStudents.find((s) => s.token === token && s.status === "aktiv");
  return found || null;
}

export async function getAllStudents(): Promise<DBStudent[]> {
  if (isUsingMySQL && pool) {
    const [rows]: any = await pool.query(
      "SELECT id, nachname, email, token, status, created_at FROM schueler ORDER BY id ASC"
    );
    return rows.map((r: any) => ({
      id: r.id,
      nachname: r.nachname,
      email: r.email,
      token: r.token,
      status: r.status,
      created_at: new Date(r.created_at).toISOString(),
    }));
  }

  return [...memStudents];
}

export async function createStudent(
  nachname: string,
  email: string,
  token: string,
  status: "aktiv" | "inaktiv" = "aktiv"
): Promise<{ success: boolean; id?: number; error?: string }> {
  if (isUsingMySQL && pool) {
    try {
      const [result]: any = await pool.query(
        "INSERT INTO schueler (nachname, email, token, status) VALUES (?, ?, ?, ?)",
        [nachname, email, token, status]
      );
      return { success: true, id: result.insertId };
    } catch (err: any) {
      if (err.code === "ER_DUP_ENTRY") {
        return { success: false, error: "E-Mail oder Token bereits vergeben." };
      }
      return { success: false, error: err.message };
    }
  }

  const exists = memStudents.some((s) => s.email.toLowerCase() === email.toLowerCase() || s.token === token);
  if (exists) {
    return { success: false, error: "E-Mail oder Token bereits vergeben." };
  }

  const newStudent: DBStudent = {
    id: memNextStudentId++,
    nachname,
    email,
    token,
    status,
    created_at: new Date().toISOString(),
  };
  memStudents.push(newStudent);
  return { success: true, id: newStudent.id };
}

export async function updateStudentStatus(id: number, status: "aktiv" | "inaktiv"): Promise<boolean> {
  if (isUsingMySQL && pool) {
    const [result]: any = await pool.query("UPDATE schueler SET status = ? WHERE id = ?", [status, id]);
    return result.affectedRows > 0;
  }

  const student = memStudents.find((s) => s.id === id);
  if (!student) return false;
  student.status = status;
  return true;
}

export async function deleteStudent(id: number): Promise<boolean> {
  if (isUsingMySQL && pool) {
    const [result]: any = await pool.query("DELETE FROM schueler WHERE id = ?", [id]);
    return result.affectedRows > 0;
  }

  const index = memStudents.findIndex((s) => s.id === id);
  if (index === -1) return false;
  memStudents.splice(index, 1);
  memEntries = memEntries.filter((e) => e.schueler_id !== id);
  return true;
}

// Listing / Entry Operations
export async function getAllPublicEntries(): Promise<
  Array<DBEntry & { verfasser_aktiv: boolean }>
> {
  if (isUsingMySQL && pool) {
    const [rows]: any = await pool.query(`
      SELECT 
        e.id, 
        e.titel, 
        e.nachricht, 
        e.typ, 
        e.sitzplaetze, 
        e.schueler_id, 
        e.erstellungsdatum,
        (s.status = 'aktiv') AS verfasser_aktiv
      FROM eintraege e
      LEFT JOIN schueler s ON e.schueler_id = s.id
      ORDER BY e.erstellungsdatum DESC
    `);
    return rows.map((r: any) => ({
      id: r.id,
      titel: r.titel,
      nachricht: r.nachricht,
      typ: r.typ,
      sitzplaetze: r.sitzplaetze,
      schueler_id: r.schueler_id,
      erstellungsdatum: new Date(r.erstellungsdatum).toISOString(),
      verfasser_aktiv: Boolean(r.verfasser_aktiv),
    }));
  }

  return memEntries
    .map((e) => {
      const schueler = memStudents.find((s) => s.id === e.schueler_id);
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
}

export async function createEntry(
  titel: string,
  nachricht: string,
  typ: "Angebot" | "Gesuch",
  sitzplaetze: number | null,
  schueler_id: number
): Promise<{ success: boolean; id?: number; error?: string }> {
  if (isUsingMySQL && pool) {
    try {
      const [result]: any = await pool.query(
        "INSERT INTO eintraege (titel, nachricht, typ, sitzplaetze, schueler_id) VALUES (?, ?, ?, ?, ?)",
        [titel, nachricht, typ, sitzplaetze, schueler_id]
      );
      return { success: true, id: result.insertId };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  const newEntry: DBEntry = {
    id: memNextEntryId++,
    titel,
    nachricht,
    typ,
    sitzplaetze,
    schueler_id,
    erstellungsdatum: new Date().toISOString(),
  };
  memEntries.push(newEntry);
  return { success: true, id: newEntry.id };
}

export async function getEntryById(id: number): Promise<DBEntry | null> {
  if (isUsingMySQL && pool) {
    const [rows]: any = await pool.query(
      "SELECT id, titel, nachricht, typ, sitzplaetze, schueler_id, erstellungsdatum FROM eintraege WHERE id = ?",
      [id]
    );
    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      id: r.id,
      titel: r.titel,
      nachricht: r.nachricht,
      typ: r.typ,
      sitzplaetze: r.sitzplaetze,
      schueler_id: r.schueler_id,
      erstellungsdatum: new Date(r.erstellungsdatum).toISOString(),
    };
  }

  const found = memEntries.find((e) => e.id === id);
  return found || null;
}

export async function getStudentById(id: number): Promise<DBStudent | null> {
  if (isUsingMySQL && pool) {
    const [rows]: any = await pool.query(
      "SELECT id, nachname, email, token, status, created_at FROM schueler WHERE id = ?",
      [id]
    );
    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      id: r.id,
      nachname: r.nachname,
      email: r.email,
      token: r.token,
      status: r.status,
      created_at: new Date(r.created_at).toISOString(),
    };
  }

  const found = memStudents.find((s) => s.id === id);
  return found || null;
}

export async function deleteEntry(id: number): Promise<boolean> {
  if (isUsingMySQL && pool) {
    const [result]: any = await pool.query("DELETE FROM eintraege WHERE id = ?", [id]);
    return result.affectedRows > 0;
  }

  const index = memEntries.findIndex((e) => e.id === id);
  if (index === -1) return false;
  memEntries.splice(index, 1);
  return true;
}

export async function getAdminEntries(): Promise<
  Array<DBEntry & { nachname: string; email: string; schueler_status: string }>
> {
  if (isUsingMySQL && pool) {
    const [rows]: any = await pool.query(`
      SELECT 
        e.id, 
        e.titel, 
        e.nachricht, 
        e.typ, 
        e.sitzplaetze, 
        e.schueler_id, 
        e.erstellungsdatum,
        COALESCE(s.nachname, 'Gelöschter Nutzer') AS nachname,
        COALESCE(s.email, '-') AS email,
        COALESCE(s.status, 'inaktiv') AS schueler_status
      FROM eintraege e
      LEFT JOIN schueler s ON e.schueler_id = s.id
      ORDER BY e.erstellungsdatum DESC
    `);
    return rows.map((r: any) => ({
      id: r.id,
      titel: r.titel,
      nachricht: r.nachricht,
      typ: r.typ,
      sitzplaetze: r.sitzplaetze,
      schueler_id: r.schueler_id,
      erstellungsdatum: new Date(r.erstellungsdatum).toISOString(),
      nachname: r.nachname,
      email: r.email,
      schueler_status: r.schueler_status,
    }));
  }

  return memEntries.map((e) => {
    const author = memStudents.find((s) => s.id === e.schueler_id);
    return {
      ...e,
      nachname: author ? author.nachname : "Gelöschter Nutzer",
      email: author ? author.email : "-",
      schueler_status: author ? author.status : "inaktiv",
    };
  });
}

export async function getStats(): Promise<{
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  totalEntries: number;
  angeboteCount: number;
  gesucheCount: number;
  totalSeatsOffered: number;
}> {
  if (isUsingMySQL && pool) {
    const [userRows]: any = await pool.query(`
      SELECT 
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'aktiv' THEN 1 ELSE 0 END) AS active
      FROM schueler
    `);
    const [entryRows]: any = await pool.query(`
      SELECT 
        COUNT(*) AS total,
        SUM(CASE WHEN typ = 'Angebot' THEN 1 ELSE 0 END) AS angebote,
        SUM(CASE WHEN typ = 'Gesuch' THEN 1 ELSE 0 END) AS gesuche,
        COALESCE(SUM(sitzplaetze), 0) AS totalSeats
      FROM eintraege
    `);

    const totalUsers = Number(userRows[0]?.total || 0);
    const activeUsers = Number(userRows[0]?.active || 0);
    const inactiveUsers = totalUsers - activeUsers;
    const totalEntries = Number(entryRows[0]?.total || 0);
    const angeboteCount = Number(entryRows[0]?.angebote || 0);
    const gesucheCount = Number(entryRows[0]?.gesuche || 0);
    const totalSeatsOffered = Number(entryRows[0]?.totalSeats || 0);

    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      totalEntries,
      angeboteCount,
      gesucheCount,
      totalSeatsOffered,
    };
  }

  const totalUsers = memStudents.length;
  const activeUsers = memStudents.filter((s) => s.status === "aktiv").length;
  const inactiveUsers = totalUsers - activeUsers;
  const totalEntries = memEntries.length;
  const angeboteCount = memEntries.filter((e) => e.typ === "Angebot").length;
  const gesucheCount = memEntries.filter((e) => e.typ === "Gesuch").length;
  const totalSeatsOffered = memEntries.reduce((acc, curr) => acc + (curr.sitzplaetze || 0), 0);

  return {
    totalUsers,
    activeUsers,
    inactiveUsers,
    totalEntries,
    angeboteCount,
    gesucheCount,
    totalSeatsOffered,
  };
}
