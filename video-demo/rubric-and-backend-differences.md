# Video topic 3: Backend API, DB setup, and how the FE talks to the BE

Talking points only. Paths are relative to the repo root.

- Owner
- User
- Accessibility
- Responsiveness
- BE / FE integration
- Mock
- Differences between rubric and implementation

## 1. Backend layout (Express + PostgreSQL)

- Entry: `backend/server.js` → `backend/app.js` (CORS, JSON body parsing, `/api` routes, static `/uploads`).
- Layered: `backend/src/routes/` → `controllers/` → `models/` (SQL queries).
- Middleware worth showing: `backend/src/middlewares/auth.middleware.js` (JWT + role checks), `upload.middleware.js` (file limits).
- Reference for all endpoints: `backend/CivicEvents+ API.postman_collection.json`.

## 2. Database setup

- Schema: `backend/migrations/001_create_tables.sql` (users, events, announcements, promos, notifications, registrations, feedback).
- Connection: `backend/src/config/db.js` (pg `Pool`), credentials in `backend/.env` (`DB_USER`, `DB_PASS`, `DB_NAME`, `DB_HOST`, `DB_PORT`).
- Demo users seeded by `scripts/seed-users.mjs`; `start.sh` starts Postgres, creates the DB, runs the migration, seeds, then starts backend (:4000) and frontend (:8080).
- Setup steps for evaluators: `README.md`.

## 3. Where the FE points at the BE

- `frontend/config.js`: `API_BASE_URL: 'http://localhost:4000/api'` and the `USE_MOCK` switch.
- All HTTP goes through one place, `frontend/js/api/` (jQuery `$.ajax`):
  - `request.js`: builds the call (JSON or `FormData` for uploads), resolves with `body.data`.
  - `index.js`: the named API calls pages use.
  - `handlers.js`: global ajax setup; adds `Authorization: Bearer <token>` to every request.
  - `errors.js` / `notify.js`: normalise errors, handle 401 (sign out) and toasts.

## 4. Auth flow between FE and BE

- Login/signup hit `/api/auth/*`; the backend returns a JWT.
- Token storage: `frontend/js/auth/storage.js` (sessionStorage, or localStorage with "Remember me"); decoded and `exp` checked in `frontend/js/auth/jwt.js`.
- Role guards: `frontend/js/guard.js` (UX only) vs `auth.middleware.js` (real enforcement).

## 5. Where FE and BE differ, and demo mode

- Backend is the source of truth; differences and the chosen behaviour are in `docs/submission-notes.md` (section 3), e.g. events list has no filters or pagination, so the FE does them client-side.
- Hosted GitHub Pages has no backend: `frontend/js/mock/transport.js` (a `$.ajaxTransport`) answers `/api/*` with mock data, same routes and shapes, so page code is unchanged.
- Good proof to show: browser DevTools Network tab (request, Bearer header, JSON response) next to the backend terminal's morgan log.
