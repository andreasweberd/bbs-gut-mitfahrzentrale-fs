-- ============================================================
-- BBS GuT Rideshare (Mitfahrzentrale) - MySQL Schema & Seed
-- Datenbank: bbs_mitfahrzentrale
-- ============================================================

CREATE DATABASE IF NOT EXISTS `bbs_mitfahrzentrale`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `bbs_mitfahrzentrale`;

-- ------------------------------------------------------------
-- Tabelle 1: schueler (Student Accounts & Auth Tokens)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `schueler` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nachname` VARCHAR(100) NOT NULL,
  `email` VARCHAR(191) NOT NULL UNIQUE,
  `token` VARCHAR(100) NOT NULL UNIQUE,
  `status` ENUM('aktiv', 'inaktiv') NOT NULL DEFAULT 'aktiv',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_schueler_token` (`token`),
  INDEX `idx_schueler_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Tabelle 2: eintraege (Carpool Offers & Requests)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `eintraege` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `titel` VARCHAR(255) NOT NULL,
  `nachricht` TEXT NOT NULL,
  `typ` ENUM('Angebot', 'Gesuch') NOT NULL,
  `sitzplaetze` INT NULL DEFAULT NULL,
  `schueler_id` INT NOT NULL,
  `erstellungsdatum` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_eintraege_typ` (`typ`),
  INDEX `idx_eintraege_schueler` (`schueler_id`),
  INDEX `idx_eintraege_datum` (`erstellungsdatum` DESC),
  CONSTRAINT `fk_eintraege_schueler`
    FOREIGN KEY (`schueler_id`)
    REFERENCES `schueler` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Initialdaten (BBS GuT Beispielnutzer)
-- ------------------------------------------------------------
INSERT IGNORE INTO `schueler` (`id`, `nachname`, `email`, `token`, `status`, `created_at`) VALUES
  (1, 'Weber', 'senior.weber@gmail.com', 'TOKEN-2026-001', 'aktiv', NOW() - INTERVAL 10 DAY),
  (2, 'Müller', 'm.mueller@bbs-gut-trier.de', 'TOKEN-2026-002', 'aktiv', NOW() - INTERVAL 8 DAY),
  (3, 'Schmidt', 'l.schmidt@bbs-gut.de', 'TOKEN-2026-003', 'aktiv', NOW() - INTERVAL 5 DAY),
  (4, 'Schneider', 'p.schneider@schueler-gut.de', 'TOKEN-2026-004', 'inaktiv', NOW() - INTERVAL 2 DAY);

-- ------------------------------------------------------------
-- Initialdaten (BBS GuT Angebote & Gesuche)
-- ------------------------------------------------------------
INSERT IGNORE INTO `eintraege` (`id`, `titel`, `nachricht`, `typ`, `sitzplaetze`, `schueler_id`, `erstellungsdatum`) VALUES
  (101, 'Tägliche Mitfahrt ab Konz / Saarburg zur BBS GuT',
   'Fahre jeden Schultag um 07:15 Uhr an der Haltestelle Konz Mitte ab. Biete pünktliche und entspannte Fahrt im Nichtraucher-Pkw. Rückfahrt nach der 6. oder 8. Stunde.',
   'Angebot', 3, 1, NOW() - INTERVAL 3 DAY),
  (102, 'Suche Mitgelegenheit ab Trier-Nord / Hauptbahnhof',
   'Hallo zusammen! Suche für Montag und Mittwoch zur 1. Stunde (07:45 Uhr) eine Mitfahrgelegenheit vom Hbf Trier zur Berufsbildenden Schule Gestaltung und Technik. Beteilige mich gerne am Spritgeld!',
   'Gesuch', NULL, 2, NOW() - INTERVAL 2 DAY),
  (103, 'Freie Plätze ab Schweich / Kenn (Di & Do)',
   'Fahre dienstags und donnerstags um 07:20 Uhr ab Schweich DB-Bahnhof über Kenn direkt zur BBS GuT. 2 freie Plätze im Ford Focus.',
   'Angebot', 2, 3, NOW() - INTERVAL 8 HOUR);
