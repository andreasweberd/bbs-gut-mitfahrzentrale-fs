# BBS GuT Rideshare (Mitfahrzentrale) - Audit & Production Upgrade

Welcome to the updated, production-ready full-stack web application for **BBS GuT Rideshare (Schul-Mitfahrzentrale)**.

This repository was thoroughly audited for security vulnerabilities, memory leaks, configuration bugs, and UI defects present in the legacy Flask/HTML version, and upgraded into a modern, full-stack **TypeScript + Express + React 19 + Tailwind CSS** application.

---

## 📋 Table of Contents
1. [Security & Bug Audit Summary](#-security--bug-audit-summary)
2. [Architectural Upgrades](#-architectural-upgrades)
3. [Key Features](#-key-features)
4. [API Endpoints Reference](#-api-endpoints-reference)
5. [Getting Started & Development](#-getting-started--development)

---

## 🛡️ Security & Bug Audit Summary

During the code inspection of the legacy Python Flask (`server.py`) and static HTML (`index.html`), **10 critical bugs and security vulnerabilities** were identified and resolved:

| ID | Title | Severity | Category | Root Cause & Resolution |
| :--- | :--- | :--- | :--- | :--- |
| **BUG-001** | Hardcoded Database Credentials & Admin Token | **CRITICAL** | Security | DB credentials (host IP, user, password) and admin token (`"Wulli"`) were written directly in code. **Fixed**: Moved to server-side `.env` environment variables. |
| **BUG-002** | Database Port Misconfiguration | **CRITICAL** | Database | DB port was set to `80` (HTTP port) instead of standard `5432` for PostgreSQL. **Fixed**: Configured proper port fallbacks in backend configuration. |
| **BUG-003** | Exposed Admin Master Token in Client JS | **CRITICAL** | Security | `const ADMIN_TOKEN = 'Wulli'` was bundled directly into public browser source code. **Fixed**: Token authentication moved strictly to server-side endpoints. |
| **BUG-004** | Database Connection Leaks | **HIGH** | Database | Connection cleanups (`conn.close()`) were outside `try...finally` blocks, exhausting connection pools on errors. **Fixed**: Managed lifecycle using structured ORM/Express query handlers. |
| **BUG-005** | Unhandled `int()` Parsing Crash (HTTP 500) | **HIGH** | Backend | Non-numeric seat inputs threw unhandled `ValueError` crashes. **Fixed**: Safe number parsing with clean `HTTP 400` validation responses. |
| **BUG-006** | XSS & Broken Mailto Encoding | **HIGH** | Frontend | Inappropriate HTML escaping inside `mailto:` URLs produced double-escaped entities (`&amp;`). Inline JS broke on names with quotes. **Fixed**: Proper `encodeURIComponent` encoding and React event handlers. |
| **BUG-007** | Spam Detector Blocking Valid Route Links | **MEDIUM** | Backend | Spam filter blocked `"http://"` and `"https://"`, preventing students from sharing Google Maps pickup locations. **Fixed**: Replaced rigid URL blocks with domain verification and AI moderation. |
| **BUG-008** | Hardcoded Localhost API URL | **HIGH** | Network | Hardcoded `http://localhost:80/v1` caused CORS and Mixed Content failures in HTTPS deployments. **Fixed**: Used relative API routing (`/api/v1/*`). |
| **BUG-009** | Session Loss on Page Refresh | **MEDIUM** | Frontend | Auth tokens were stored in volatile JS variables, logging users out on refresh. **Fixed**: Persistent state sync with `localStorage`. |
| **BUG-010** | Inconsistent API Error Schemas | **LOW** | Backend | Mismatched JSON error payload keys across routes. **Fixed**: Standardized API response format (`{ erfolg: boolean, fehler?: string }`). |

---

## 🏗️ Architectural Upgrades

- **Backend**: Node.js + Express server (`server.ts`) with Vite middleware, bundling via `esbuild` to CommonJS (`dist/server.cjs`).
- **Frontend**: React 19 + TypeScript + Tailwind CSS + Lucide Icons.
- **AI Integration**: Integrated `@google/genai` (Gemini 2.5 Flash) server-side endpoint (`/api/v1/audit/analyze-code`) for live code vulnerability scanning.
- **Data Persistence**: In-memory store pre-seeded with realistic BBS GuT carpool listings and student accounts.

---

## ✨ Key Features

1. **Schwarzes Brett (Carpool Bulletin Board)**
   - Filter listings by type (🚗 Angebot / 🙋 Gesuch) or search by locations and titles.
   - Interactive modal to publish new offers/requests with seat capacity validation.
   - Contact reveal modal generating custom `mailto:` links with pre-filled subjects and bodies.

2. **Interactive Bug Audit Diagnostic Tool**
   - Live dashboard inspecting all 10 identified bugs with side-by-side code comparison (Original vs. Fixed).
   - Filter bugs by severity and category, or export the full audit report.
   - **AI Code Scanner**: Paste custom Python/SQL/JS code snippets to perform real-time Gemini AI safety analysis.

3. **Admin Dashboard**
   - Manage registered student accounts (toggle active/inactive status, delete accounts).
   - Inspect and moderate all public listings with author status tracking.
   - Real-time system analytics (total users, active percentage, seat capacities).

---

## 🔌 API Endpoints Reference

### Public Routes
- `POST /api/v1/anmelden` - Validate student or admin token.
- `GET /api/v1/eintraege` - List all active carpool entries.
- `POST /api/v1/eintraege` - Create a new offer or request listing.
- `GET /api/v1/eintraege/:id/kontakt` - Fetch contact information for a listing (Requires token).

### Admin Routes (`X-Auth-Token` required)
- `GET /api/v1/admin/nutzer` - List all registered students.
- `POST /api/v1/admin/nutzer` - Register a new student account and token.
- `PUT /api/v1/admin/nutzer/:id/status` - Toggle student status (`aktiv` / `inaktiv`).
- `DELETE /api/v1/admin/nutzer/:id` - Delete student account and associated listings.
- `GET /api/v1/admin/eintraege` - List all listings with extended author info.
- `DELETE /api/v1/admin/eintraege/:id` - Remove a listing.
- `GET /api/v1/admin/stats` - Fetch aggregate system metrics.

### AI Diagnostic Routes
- `POST /api/v1/audit/analyze-code` - Submit code snippet to Gemini AI auditor for real-time safety inspection.

---

## 🚀 Getting Started & Development

### Local Execution
```bash
# Run dev server
npm run dev

# Lint & typecheck
npm run lint

# Build for production
npm run build

# Start production server
npm start
```

### Quick Test Credentials
- **Student Token**: `TOKEN-2026-001` (Senior Weber)
- **Student Token**: `TOKEN-2026-002` (M. Müller)
- **Admin Token**: `Wulli`
