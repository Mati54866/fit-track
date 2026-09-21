# FitTrack API

Node.js, Express, TypeScript, MongoDB/Mongoose API for FitTrack.

## Run locally

```powershell
Copy-Item .env.example .env
npm.cmd install
npm.cmd run dev
```

The server listens on `http://localhost:5000`; `GET /health` is unauthenticated. The API uses the `/api/v1` prefix.

## Environment

Copy `.env.example` to `.env`, then provide real values for MongoDB Atlas, Google OAuth, Cloudinary, and both JWT secrets. `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` must be different random strings of 32+ characters.

Cookie configuration:

- Access cookie: HttpOnly, 15 minutes.
- Refresh cookie: HttpOnly, 30 days, hashed in MongoDB and rotated whenever `/auth/refresh` is called.
- Local development: `COOKIE_SECURE=false`, `COOKIE_SAME_SITE=lax`.
- Production: use HTTPS, `COOKIE_SECURE=true`, and set `CLIENT_ORIGIN` to the deployed frontend URL.

## Scripts

```powershell
npm.cmd run dev          # watch-mode API
npm.cmd run typecheck    # TypeScript validation
npm.cmd run lint         # ESLint
npm.cmd test             # Vitest suite
npm.cmd run build        # compile production JavaScript
npm.cmd start            # run compiled app
```

## API overview

All authenticated routes require the `fittrack_access` cookie. Mutation routes additionally validate the browser `Origin` against `CLIENT_ORIGIN`; the frontend must send requests with credentials enabled.

| Area | Base route | Operations |
|---|---|---|
| Auth | `/auth` | Register, login, Google OAuth, rotate refresh session, logout, current user, onboarding |
| Profile | `/profile` | Update profile; upload avatar (`multipart/form-data`, field `avatar`) |
| Workouts | `/workouts` | Full CRUD; list supports `page`, `limit`, `category`, `tag`, `search`, `from`, `to` |
| Nutrition | `/nutrition` | Full CRUD; list supports `page`, `limit`, `mealType`, `search`, `from`, `to` |
| Progress | `/progress` | Full CRUD; supports dated weight, measurements, and performance metrics |
| Goals | `/goals` | Create, list, update, delete workout-count, calorie, macro, and target-weight goals; achievement checked as related data is logged |
| Dashboard | `/dashboard` | Recent workouts, current-day nutrition totals, latest progress, active goals, unread count |
| Analytics | `/analytics` | `workouts`, `nutrition`, and `progress`, with optional `from`/`to` dates |
| Notifications | `/notifications` | List, mark one read, mark all read |
| Reminders | `/reminders` | CRUD in-app reminders, optionally linked to a goal; supports none/daily/weekly/monthly repeats |
| Reports | `/reports/export` | `type=nutrition|progress`, `format=csv|pdf`, optional `from`/`to` |
| Support | `/support-tickets` | Create and list personal bug, feature-request, account, or other tickets |
| GDPR account | `/account` or `/api/users/me` | `GET /export`; account deletion requires `{ "confirmation": "DELETE", "password": "..." }` or a fresh Google reconfirmation |

Examples:

```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "name": "Ada Lovelace",
  "username": "ada_lovelace",
  "email": "ada@example.com",
  "password": "a-strong-password",
  "privacyConsent": true,
  "unitsPreference": "metric"
}
```

```http
GET /api/v1/analytics/nutrition?from=2026-09-01&to=2026-09-30
```

## Security and privacy

- Passwords use bcrypt hashing.
- Tokens are held in secure HttpOnly cookies rather than browser storage.
- Refresh tokens are one-time-use and stored only as hashes; reuse revokes the user’s sessions.
- Every private data query scopes results by authenticated `userId`.
- Helmet, input validation, login throttling, structured log redaction, CORS, and origin validation are enabled.
- Personal-data export and account erasure endpoints are provided for GDPR rights.
- Account erasure requires a fresh password confirmation or the dedicated Google reconfirmation flow (`GET /api/v1/auth/google/reconfirm`).

## Deployment

Build with `docker build -t fittrack-api .` from the `backend` directory. Configure all environment variables in Render; never bake `.env` into the image. Configure Atlas network access for Render and update Google OAuth’s production callback URL before release.
