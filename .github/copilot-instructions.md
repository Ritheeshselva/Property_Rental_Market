# Copilot instructions for Property_Rental_Market

Quick, actionable notes to help an AI agent be immediately productive in this repository.

- Architecture

  - Monorepo with two main apps: `backend/` (Express + MongoDB) and `frontend/` (Create React App, React).
  - Backend: `backend/server.js` wires routes under `/api/*` and serves uploads from `/<UPLOAD_DIR>` (default `uploads`).
  - Frontend: CRA app in `frontend/` uses `frontend/src/api.js` as the canonical API client (see apiRequest helper).

- Auth & roles (critical)

  - Auth is JWT-based. Token is returned by `POST /api/auth/login` and stored in `localStorage` as `token`; user metadata is stored as JSON in `localStorage` under `user`.
  - Frontend helpers: `frontend/src/utils/auth.js` (keys: `token`, `user`) and `frontend/src/contexts/AuthContext.jsx` (listens for `authChanged` event).
  - Backend middleware: `backend/src/middleware/auth.js` -> signature `auth(requiredRole)`; it reads `Authorization: Bearer <token>` and enforces role when `requiredRole` is provided. Roles used in the code: `admin`, `owner`, `user`, `staff`.

- API patterns and examples

  - API base for frontend is controlled by `REACT_APP_API_BASE` (default `http://localhost:5000`). See `frontend/src/api.js` for exact helper usage and endpoints (e.g. `PropertiesAPI.create(formData, token)` uses `isForm=true`).
  - Multipart upload: properties accept up to 5 images via `multer` (backend upload limit `files: 5`). `PropertiesAPI.create` expects a FormData instance and passes `isForm: true`.
  - Image URLs: backend route helpers convert stored image paths (`/uploads/<file>`) into absolute URLs using request host/protocol; some images may already be full `http` URLs.
  - Examples to reference when forming requests:
    - Create property (multipart): call `POST /api/properties` with form fields and `images` files; include `Authorization` header.
    - Admin approve: `POST /api/admin/:id/approve` (requires `auth('admin')`).
    - Booking: `POST /api/properties/:id/book` (requires `auth()` token).

- Developer workflows (how to run & debug)

  - Backend: cd `backend` -> `npm install` -> `npm run dev` (starts nodemon on default port 5000). Environment: create `backend/.env` with at least `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` to seed default admin.
  - Frontend: cd `frontend` -> `npm install` -> `npm start` (CRA on port 3000). Set `REACT_APP_API_BASE` if backend runs on non-standard host/port.
  - Logs & quick debug: backend uses `morgan` and `auth` middleware prints token-debug logs. Frontend `apiRequest` logs every request to console—use it to inspect outgoing headers and body.

- Project-specific conventions

  - localStorage keys: `token` (string) and `user` (JSON). Use `triggerAuthChange()` (in `frontend/src/utils/auth.js`) to notify UI of auth changes.
  - Role enforcement is done server-side via `auth(requiredRole)`. Do not assume client-side checks are authoritative.
  - Multipart vs JSON: frontend API helper uses `isForm` to avoid setting `Content-Type` so the browser can set multipart boundaries.
  - Upload directory: controlled by `UPLOAD_DIR` env var (default `uploads`) and served at `/uploads`.

- Files to read first (quick tour)

  - `backend/server.js` — startup, admin-seed, route wiring
  - `backend/src/middleware/auth.js` — token parsing and role enforcement
  - `backend/src/routes/*.js` — canonical endpoints (auth, properties, admin, staff, maintenance, subscriptions)
  - `frontend/src/api.js` — single place that maps frontend calls to backend endpoints and shows header/body conventions
  - `frontend/src/utils/auth.js` and `frontend/src/contexts/AuthContext.jsx` — how UI tracks login state
  - `frontend/src/pages/*` — concrete usage examples for routes, role-based redirects, and UI flows

- Safety notes for edits
  - Avoid changing the `auth` contract or `localStorage` keys. Many pages depend on the exact keys (`token`, `user`) and the `authChanged` event.
  - When adding API calls, prefer reusing `frontend/src/api.js` and `apiRequest` signature (use `isForm` for FormData).
  - Be cautious with image URLs: backend converts stored relative paths to full URLs before sending; handle both absolute and relative paths on the frontend.

If anything looks incomplete or you want examples added (e.g., sample FormData creation, or a short sequence for running both services in parallel), tell me which section to expand.
