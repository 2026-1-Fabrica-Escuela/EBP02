# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Fluent Finanzas Personales** — a personal finance management web app with income/expense tracking, budgeting, savings goals, reports, and AI-powered financial recommendations via Google Gemini.

The repo contains two independent applications:
- `api/` — Spring Boot 3 backend (Java 17, Maven, PostgreSQL, JWT auth)
- `Frontend-FinanzasPersonales/` — React 18 + Vite frontend (TypeScript, Tailwind CSS, Radix UI)

---

## Commands

### Frontend (`Frontend-FinanzasPersonales/`)

```bash
npm install          # Install dependencies
npm run dev          # Start Vite dev server
npm run build        # Production build
npm run test         # Run Vitest test suite
```

### Backend (`api/`)

```bash
mvn clean install -DskipTests   # Build (skip tests for speed)
java -jar target/api-0.0.1-SNAPSHOT.jar  # Run server (port 8080)
./build.sh                       # Alternative Railway build script
```

---

## Environment Setup

### Frontend (`.env` in `Frontend-FinanzasPersonales/`)

```
VITE_API_BASE_URL=http://localhost:3000/api
VITE_API_USE_MOCK=true   # Set false to hit real backend
```

See `.env.example` for all `VITE_API_*` endpoint variables.

**Mock mode credentials** (when `VITE_API_USE_MOCK=true`):
- Admin: `admin@fluent.local` / `Admin123!`
- User: `usuario@fluent.local` / `Usuario123!`

### Backend (`.env` in `api/`)

```
DB_URL=<postgresql_url>
DB_USERNAME=<pg_user>
DB_PASSWORD=<pg_password>
JWT_SECRET=<secure_random_key>
JWT_EXPIRATION=86400000
SERVER_PORT=8080
GEMINI_API_KEY=<google_gemini_key>
```

---

## Architecture

### Backend (`api/src/main/java/com/finanzas/api/`)

Standard layered Spring Boot app — Controller → Service → Repository → Entity.

**Key domains:**
| Domain | Entity | Notes |
|--------|--------|-------|
| Auth | `User`, `Role` | JWT stateless auth via `JwtAuthFilter` + `JwtUtil` |
| Transactions | `Transaction`, `Category` | Income/expense records |
| Planning | `Budget`, `Pocket` | Monthly budgets and savings goals |
| Analytics | `Report` (computed) | Financial reports |
| AI | `AiAdvice` | Gemini API recommendations stored per user |
| Admin | `LoginLog` | Audit trail + user suspension |

**REST base paths:** `/api/auth/**` (public), all others require JWT bearer token.

**Spring Security:** Stateless session, BCrypt password encoding, CORS configured for Vercel production URLs in `application-prod.properties`.

### Frontend (`Frontend-FinanzasPersonales/src/app/`)

```
pages/          # 13 route-level page components
components/     # Reusable UI built on Radix UI primitives
services/api/   # Centralized API client (one file per domain)
context/        # AppContext — global auth + user state
routes.tsx      # React Router route definitions
```

**API client pattern:** All backend calls go through `services/api/`. The `VITE_API_USE_MOCK` flag switches between `mock-api.ts` (offline stubs) and real HTTP calls via `http.ts`. Token persistence is in `auth-storage.ts`.

**UI stack:** Radix UI primitives + Tailwind CSS 4 + MUI icons. Charts via Recharts. Animations via Motion.

### Deployment

- Frontend → Vercel
- Backend → Railway or Render (`Procfile` + `railway.json` at repo root)
- Spring profile `prod` activates via `SPRING_PROFILES_ACTIVE=prod`
