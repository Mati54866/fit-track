# Fitness & Nutrition Tracker — Project Plan

> Status document. Sections marked **[DECIDED]** are locked in. Sections marked **[OPEN / TBD]** still need a decision before that part is built. Do not assume or invent answers for TBD sections — ask the human first.

---

## 1. Project Summary

A mobile-responsive web application for fitness and nutrition tracking. Users can log workouts, track nutrition intake, monitor progress over time with visual analytics, manage a personal profile, and receive notifications/reminders. Built as a **scale-ready monolith** now, with a Load Balancer + API Gateway layer added later as a deliberate v2 upgrade once real usage justifies it.

---

## 2. Original Requirements (verbatim, source of truth)

### Functional Requirements

**User Management**
- User Registration: unique username + password; profile includes name, email, profile picture
- User Login: secure credential login
- User Profiles: view + update profile info (picture, name, basic info)

**Fitness Tracking**
- Workout Tracking: create/edit/delete workout routines; each routine has exercise name, sets, reps, weights, notes; categorized (strength, cardio) and taggable
- Nutrition Tracking: log daily food intake by meal type (breakfast/lunch/dinner/snacks); each entry has food items, quantities, nutritional details (calories, macros)
- Progress Tracking: record weight, body measurements, performance metrics (run times, lifting weights); generate graphs over time

**Dashboard**
- Personalized dashboard: overview of fitness journey, recent workouts, nutrition logs, progress
- Workout Analytics: charts/graphs of workout data, lifting progress, frequency, exercise history
- Nutrition Analytics: calorie intake, macro distribution, daily consumption trends

**Activity Notifications**
- Notify on: workout completion, goal achievement, new followers, forum responses

**Search and Filtering**
- Search workouts, nutrition entries, other users; filters to sort/narrow results

**Mobile Compatibility**
- Fully responsive across smartphones and tablets

**Reporting and Export**
- Generate progress/nutrition reports; export as PDF and CSV

**Notifications and Alerts**
- User-set reminders/alerts for workouts, meals, goals

**Settings and Preferences**
- Notification preferences, units of measurement, theme preferences

**Feedback and Support**
- Support system for contact, issue reporting, feedback

### Non-Functional Requirements

- **Performance:** 1–2 second response time for most operations; scale without degradation; support hundreds of concurrent users
- **Security:** encrypt sensitive data at rest and in transit; industry-standard authentication; authorization so users only access their own (or public) data
- **Privacy:** GDPR compliance; explicit user consent for data processing/sharing
- **Reliability:** 99% uptime target; scheduled maintenance communicated in advance; automated backups
- **Usability:** intuitive UI, consistent navigation, responsive design; WCAG accessibility compliance
- **Compatibility:** works on Chrome, Firefox, Safari, Edge; mobile responsive
- **Scalability:** horizontal scaling support
- **Monitoring:** logging and monitoring for performance, errors, user activity
- **Testing:** unit, integration, and end-to-end test coverage; regular security testing / penetration testing
- **Documentation:** user guides/FAQs/tutorials; developer documentation; a demo video of the working app

---

## 3. Architecture — [DECIDED]

**Approach:** Build a well-structured **monolith first** (not microservices). Ship a working product on a realistic timeline, then evolve toward distributed infrastructure only once real usage demands it. This mirrors how real companies actually operate, and is the correct engineering call, not a shortcut.

**"Scale-ready" practices to follow from day one** (cheap now, expensive to retrofit later):

| Practice | Why |
|---|---|
| Stateless auth (JWT, not server-side sessions) | Breaks otherwise the moment a 2nd server/instance is added behind a load balancer |
| All config via environment variables (`.env`, never committed) | Required for multi-instance / containerized deployment later |
| Layered backend structure: routes → controllers → services → data access | Makes it possible to later extract a piece into its own microservice without a rewrite |
| Dockerize the app from day one | Turns "add a load balancer in front of multiple containers" into a config change, not a redesign |
| Plan DB indexes early on frequently queried fields (e.g. `userId`, dates) | Avoids slow queries as data grows |
| Centralized structured logging from day one | Directly satisfies the "Logging and Monitoring" NFR; makes debugging painless |
| No assumption of a single running instance (e.g. no local-disk file storage for uploads) | Local disk breaks the moment there are 2+ app instances — use Cloudinary from the start |

**Deferred to a later "v2 scale phase"** (design/document now, build only when actually needed):
- Real Load Balancer in front of multiple app instances
- API Gateway (routing, centralized rate limiting/auth enforcement)
- Redis caching layer
- Database read replicas

```
[ Client: React + TS ]
        │
[ Node.js / Express / TypeScript API ]  (monolith, layered internally)
        │
[ MongoDB (Mongoose) ]
        │
[ Cloudinary ]  (images: avatars, any exported report assets)
```

Future v2 (not built yet):
```
[ Client ] → [ Load Balancer ] → [ API Gateway ] → [ App instances (N) ] → [ MongoDB + Redis cache + replicas ]
```

---

## 4. Tech Stack — [DECIDED]

| Layer | Choice | Notes |
|---|---|---|
| Frontend | React + **TypeScript** | Responsive; 3D animation layer to be decided during frontend phase (candidate: Three.js / React Three Fiber) |
| Backend | Node.js + Express + **TypeScript** | Layered architecture (see above) |
| Database | MongoDB + Mongoose (ODM) | Chosen by project owner. Note: much of this data (users→workouts→sets, users→nutrition→food items) is fairly relational; MongoDB works fine here but deep relational queries (e.g. joins across users/workouts/nutrition for aggregate stats) take more deliberate schema design (embedding vs referencing) than they would in a relational DB. Schema to be designed accordingly. |
| Auth | JWT (stateless) for email/password **+** Google OAuth via Passport.js (`passport-google-oauth20`) | Both methods offered — see Section 5 |
| Image storage | Cloudinary | Chosen over ImageKit for maturity, documentation, community resources, built-in transforms |
| Repo hosting | GitHub, **public** repository | Doubles as a portfolio piece; confirm no employer/client confidentiality constraint applies |
| Containerization | Docker (from day one, single container to start) | |

---

## 5. Authentication — [DECIDED]

**Both** email/password AND Google Sign-In are offered (not either/or). The original requirements explicitly mandate "unique username and password" registration, so that must exist regardless; Google Sign-In is added as a convenience option.

**Google OAuth setup (current, 2026 Google Cloud Console):**
1. Create a project at console.cloud.google.com (no billing required for this).
2. Open **Google Auth Platform** in the sidebar (this replaced the old "OAuth consent screen" page in the 2025–2026 console redesign).
3. Configure **Branding** and **Audience** — choose **External** (public Google users), not Internal. This cannot easily be changed later.
4. Go to **Clients → Create Client → Web application**.
5. Add the **Authorized redirect URI** — must exactly match your backend's OAuth callback route (e.g. `http://localhost:5000/api/auth/google/callback` in dev).
6. Google issues a **Client ID** and **Client Secret** — store both in `.env`:
   ```
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   ```
7. Never commit `.env` — it must be in `.gitignore` from the first commit.

**Avatar handling:** if a user signs up via Google, store the Google-hosted avatar **URL** directly in the `User` document — do not re-upload it to Cloudinary. Only images the user *uploads themselves* (custom profile picture) go through Cloudinary.

**JWT delivery:** issued as a **secure, HttpOnly cookie** (`Secure`, `SameSite=Lax`, reasonable expiry) — not stored in localStorage/sessionStorage. This closes off token theft via XSS, since client-side JavaScript cannot read an HttpOnly cookie.

**Auth flow:**
```
Landing Page
 ├─ Sign Up → [Continue with Google] or [Email/Username/Password form]
 │     ├─ Google → Google consent screen → redirect back → account
 │     │           auto-created (name, email, avatar from Google) →
 │     │           short "complete your profile" step (units pref, etc.) → Dashboard
 │     └─ Email/Password → form → validate uniqueness of username/email →
 │                 (optional, not in original spec but recommended: email
 │                  verification) → Dashboard
 └─ Log In → [Continue with Google] or [Username/Password]
       ├─ Success → Dashboard
       └─ Failure (wrong password) → inline error, no page reload, stay on page
```

---

## 6. Site Map — [DECIDED — structure; DETAILED FLOWS STILL TBD]

**Public pages:**
- Home / Landing
- About Us
- Features
- Contact / Support
- Privacy Policy + Terms of Service (mandatory — GDPR requirement)
- Login
- Sign Up
- 404 Not Found

**Private pages (auth required):**
- Dashboard (hub: recent workouts, nutrition summary, progress snapshot)
- Workouts (list + create/edit/delete)
- Nutrition Log (daily food entries)
- Progress (graphs: weight, measurements, performance over time)
- Analytics (deeper charts — separate from dashboard summary)
- Profile (view/edit info, avatar)
- Settings (units, theme, notification preferences)
- Notifications (page and/or dropdown)
- Reports/Export (PDF/CSV generation)
- Help/Support ticket page

---

## 7. Requirement Coverage Matrix — [DECIDED, confirmed with project owner]

| Requirement | Status |
|---|---|
| Unique username/password registration | ✅ Planned |
| Registration incl. name, email, profile picture | ✅ Planned |
| Secure login | ✅ JWT |
| Google Sign-in | ✅ Added, Passport.js |
| Editable profile | ✅ Planned |
| Workout CRUD w/ sets, reps, weight, notes, category/tags | ✅ Planned — schema TBD |
| Nutrition log w/ meal type, items, quantities, calories/macros | ✅ Planned — schema TBD |
| Progress tracking + graphs | ✅ Planned |
| Dashboard overview | ✅ Planned |
| Workout analytics | ✅ Planned |
| Nutrition analytics | ✅ Planned |
| Activity notifications (workout, goals, ~~followers, forum~~) | ✅ v1 = workout completion + goal achievement only. Followers/forum **deferred to Phase 2** — see Section 11 |
| Search & filter (workouts, nutrition entries) | ✅ v1 = workouts + nutrition entries only. Searching "other users" **deferred to Phase 2** (tied to social scope) |
| Mobile responsive | ✅ React handles most of this by default |
| Report export (PDF/CSV) | ✅ Planned — v1 |
| Reminders/alerts | ✅ v1, **in-app only** — see Section 11 |
| User preferences (units, theme, notifications) | ✅ Planned |
| Support/feedback system | ✅ Planned |
| 1–2s response time | Plan: indexed queries now; Redis caching in v2 scale phase |
| Handle hundreds of concurrent users, horizontal scaling | Plan: stateless JWT + Docker now; LB/API Gateway in v2 |
| Data encryption at rest/in transit | Plan: HTTPS + bcrypt password hashing + encrypted sensitive fields — implementation detail TBD |
| Authorization (users only see own data) | Plan: middleware checks `userId` on every protected route |
| GDPR compliance, consent | Plan: Privacy Policy page + explicit consent checkbox at signup + data export/deletion endpoints — see Section 13 |
| 99% uptime, backups | ✅ Decided — see Section 11 (Render + MongoDB Atlas) |
| Accessibility (WCAG) | ✅ Decided — see Section 10 (respects `prefers-reduced-motion`, dark+light theme support) |
| Cross-browser/mobile compatibility | Plan: React defaults + manual testing across browsers |
| Logging & monitoring | Plan: e.g. Winston/Morgan — **exact tooling not finalized** |
| Test coverage (unit/integration/e2e) | ✅ Decided — see Section 11 (Vitest + Playwright) |
| Security testing / pen testing | Deferred to a later phase; basic hygiene only for v1 (hashed passwords, input validation, rate-limiting, `npm audit`) — see Section 11 |
| User + developer documentation, demo video | Plan: produce at the end of the build |

---

## 8. OPEN QUESTIONS — all resolved

Every item below was surfaced during planning and has now been decided. Kept here as a record of what was considered, with pointers to where each decision now lives.

1. ~~Social/forum feature scope.~~ **RESOLVED — deferred to Phase 2. See Section 11.**
2. ~~Hosting & deployment.~~ **RESOLVED — Render (backend) + MongoDB Atlas (DB) + Vercel (frontend, later). See Section 11.**
3. ~~Testing strategy.~~ **RESOLVED — Vitest + Playwright. See Section 11.**
4. ~~Repo structure & Git branching model.~~ **RESOLVED — see Section 14.**
5. ~~Database schema.~~ **RESOLVED — see Section 13.**
6. ~~Full page-by-page user flows with edge cases.~~ **RESOLVED — a universal state pattern (loading/empty/error/offline) applies to every page instead of enumerating each one individually. See Section 15.**
7. ~~3D animated frontend — library/approach not chosen.~~ **RESOLVED — see Section 10.**
8. ~~MVP cut vs. Phase 2.~~ **RESOLVED — see Section 11 for the full v1 vs. Phase 2 split.**

---

## 9. Build Order — [DECIDED]

1. Backend first (Node/Express/TypeScript API, MongoDB schema, auth, all endpoints)
2. Frontend second (React/TypeScript, consuming the finished API)
3. 3D animation/visual polish layer once core frontend works
4. v2 scale phase (Load Balancer, API Gateway, Redis, replicas) only after the core product is live and being used

---

## 10. Frontend Architecture & Design System — [DECIDED]

**Theme:** Dark theme as the default, with a light theme also built (the requirements doc lists "theme preferences" as a user-facing setting, so both must exist — do not hardcode dark-only colors). Define all colors as tokens/variables from the start (e.g. CSS variables or a theme object) so switching themes is a token swap, not a rewrite. Dark was chosen because it fits the fitness/analytics-dashboard category (Strava, Whoop, etc.), pairs well with vibrant chart accent colors, and suits evening/post-workout use.

**Color palette — [DECIDED]:** Deliberately avoiding the generic single-green-on-black look most fitness dashboards default to. Two accent colors split by data type, not one — gold ties to achievement/workout data (medals, personal bests), violet stays for nutrition:

| Token | Hex | Usage |
|---|---|---|
| `--bg` | `#0A0A0C` | App background |
| `--surface` | `#151519` | Cards, panels |
| `--border` | `#232328` | Card borders, dividers |
| `--text` | `#E8E8EA` | Primary text |
| `--muted` | `#7A7A82` | Secondary/label text |
| `--accent-workout` | `#E8B54D` (gold) | Workout/strength/achievement data — charts, workout tags, CTAs tied to training |
| `--accent-nutrition` | `#B084FF` (violet) | Nutrition data — charts, macro rings, meal tags |

Light theme equivalents (background/surface/text inverted, same two accents kept — they work on light backgrounds too) to be defined during frontend build.

**Animation strategy — split by page type, not applied uniformly:**

| Page type | Pages | Animation approach |
|---|---|---|
| Public / marketing | Home, About, Features | Full scroll-driven "wow factor" animation: **GSAP + ScrollTrigger**, optionally with **Three.js / React Three Fiber** for true 3D elements that respond to scroll. No live user data on these pages, so heavier animation cost is acceptable here. |
| Authenticated / app | Dashboard, Workouts, Nutrition, Progress, Analytics, Profile, Settings | **Framer Motion only** — light, fast transitions (fade/slide on route change, subtle hover/tap feedback). No heavy 3D or parallax here: these are data-heavy, functional screens the user interacts with mid-workout, and both the 1–2s response-time NFR and general usability depend on this staying snappy. |

**Reasoning (for the coding agent — do not "improve" this by adding more animation to app pages):** this split is a deliberate trade-off between visual impact and the project's own performance/usability requirements, not a corner being cut. A gym-tracking dashboard fighting the user with animation while they're mid-set is a real usability failure, not a style choice.

**Accessibility requirement tied to animation:** all animation (both the GSAP marketing-page effects and the Framer Motion app transitions) must respect the browser's `prefers-reduced-motion` setting — when a user has that OS/browser setting enabled, animations must be disabled or reduced to instant/near-instant transitions. This is a hard WCAG requirement from the original spec, not optional polish. Implementation: check `window.matchMedia('(prefers-reduced-motion: reduce)')` and branch animation config accordingly (both libraries support this pattern).

**Libraries locked in:**
- Framer Motion — app-wide UI transitions
- GSAP + ScrollTrigger — marketing page scroll animation
- Three.js / React Three Fiber — only if/when a true 3D element is designed for the marketing pages (decide the specific 3D element design during the frontend build phase, not before — don't over-plan visuals that haven't been designed yet)

---

## 11. MVP Scope, Testing, Deployment & Reminders — [DECIDED]

**v1 (MVP) scope:** Everything in the original requirements doc (Section 2) **except** the social/forum feature. This includes: auth (email/password + Google), profiles, workout CRUD, nutrition logging, progress tracking + graphs, dashboard, workout/nutrition analytics as described in the doc, search & filter (workouts/nutrition only), mobile responsiveness, PDF/CSV export, in-app reminders/alerts, settings/preferences, and a support/feedback system.

**Phase 2 (explicitly deferred, not built until v1 ships):**
- Social features: following other users, forum/community area, "new followers"/"forum responses" notifications, user search/discoverability
- Email or push-based reminder delivery (v1 is in-app only)
- Full penetration testing (v1 uses basic security hygiene only: hashed passwords, input validation, login rate-limiting, `npm audit` dependency scanning)
- AI features (see below)
- Any additional 3D/animation polish beyond what's specified in Section 10

**Testing stack:** **Vitest** for unit and integration tests (backend and frontend), **Playwright** for end-to-end tests. Chosen for strong TypeScript support and modern tooling fit with the rest of the stack.

**Deployment targets:**
- Backend: **Render** (simplest setup for a Node/Express app, minimal DevOps overhead — appropriate for this project's stage; AWS considered but deferred as unnecessary complexity for now)
- Database: **MongoDB Atlas**
- Frontend: **Vercel** (decided in advance; actual deployment happens once the frontend phase begins)

**Reminder delivery:** **In-app only for v1.** A reminder/alert appears within the app when due. Email or push notification delivery requires a separate provider (e.g. Resend for email) and is deferred to Phase 2, pending a provider decision at that time.

**AI feature (Phase 2, scoped in advance so it doesn't get built as a generic chatbot):** An "Ask your coach" style feature, split by the right underlying technique rather than treated as one generic "AI/RAG" bucket —
- Structured questions about the user's own data (e.g. "how's my squat progress this month?") → **function calling** against MongoDB queries, not RAG
- Semantic search over free-text the user has written (workout notes, etc.) → **RAG**, using MongoDB Atlas's built-in vector search (no separate vector DB needed)
This is explicitly Phase 2 — do not build until v1 is complete.

---

---

## 13. Database Schema — [DECIDED]

**Design principle:** embed data that has no independent existence and is always fetched with its parent (exercises within a workout, food items within a nutrition entry); reference data that's queried independently or shared across documents (every entry references `userId`).

```typescript
// User
{
  _id: ObjectId,
  name: string,
  username: string,          // unique, required
  email: string,             // unique, required
  passwordHash?: string,     // omitted if user signed up via Google only
  googleId?: string,         // present if Google-linked
  avatarUrl: string,         // Google-hosted URL OR Cloudinary URL
  unitsPreference: 'metric' | 'imperial',   // default 'metric'
  themePreference: 'dark' | 'light',        // default 'dark'
  notificationPreferences: { inApp: boolean },  // email/push fields added in Phase 2
  createdAt, updatedAt
}

// WorkoutRoutine
{
  _id: ObjectId,
  userId: ObjectId,          // ref User, indexed
  name: string,
  category: 'strength' | 'cardio' | 'other',
  tags: string[],
  exercises: [{              // embedded — no independent existence
    name: string,
    sets: number,
    reps: number,
    weight: number,
    notes?: string
  }],
  completedAt: Date,
  createdAt, updatedAt
}

// NutritionEntry
{
  _id: ObjectId,
  userId: ObjectId,          // ref User, indexed
  date: Date,
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack',
  items: [{                  // embedded — v1 keeps this simple, no shared foods collection
    foodName: string,
    quantity: number,
    unit: string,
    calories: number,
    protein: number,
    carbs: number,
    fat: number
  }],
  createdAt, updatedAt
}

// ProgressEntry
{
  _id: ObjectId,
  userId: ObjectId,          // ref User, indexed
  date: Date,
  weight?: number,
  measurements?: { [part: string]: number },   // e.g. { chest: 102, waist: 84 }
  performanceMetrics?: [{ metricName: string, value: number, unit: string }],  // e.g. "5K run time"
  createdAt
}

// Goal  (expanded — supports the three goal types the app actually needs)
{
  _id: ObjectId,
  userId: ObjectId,          // ref User, indexed
  type: 'workout_count' | 'calorie_target' | 'macro_target' | 'target_weight',
  targetValue: number,       // e.g. 4 (workouts/week), 2000 (calories), 75 (kg)
  targetUnit?: string,       // e.g. 'kg', 'kcal', 'workouts/week' — for display
  deadline?: Date,
  achieved: boolean,         // default false
  createdAt, updatedAt
}

// Reminder  (new — represents scheduled alerts, distinct from Notification which represents a fired event)
{
  _id: ObjectId,
  userId: ObjectId,          // ref User, indexed
  title: string,
  linkedGoalId?: ObjectId,   // ref Goal, optional — reminder can be standalone or tied to a goal
  dueAt: Date,
  repeatRule?: 'none' | 'daily' | 'weekly' | 'monthly',   // default 'none'
  enabled: boolean,          // default true — lets user pause without deleting
  createdAt, updatedAt
}

// SupportTicket  (new — in-app support system, no external helpdesk provider needed)
{
  _id: ObjectId,
  userId: ObjectId,          // ref User, indexed
  category: 'bug' | 'feature_request' | 'account' | 'other',
  subject: string,
  message: string,
  status: 'open' | 'in_progress' | 'resolved',   // default 'open'
  createdAt, updatedAt
}

// Notification
{
  _id: ObjectId,
  userId: ObjectId,          // ref User, indexed
  type: 'workout_completion' | 'goal_achievement' | 'reminder',
  message: string,
  read: boolean,             // default false
  createdAt
}
```

**Data rights endpoints (GDPR — required, not optional, per the NFR in Section 2):**
- `GET /api/users/me/export` — returns all of the requesting user's data (profile, workouts, nutrition entries, progress entries, goals, reminders) as a single JSON (or CSV, reusing the existing export tooling) download — satisfies the GDPR right of access
- `DELETE /api/users/me` — deletes the user's account and all associated documents across every collection above (cascading delete, not a soft flag) — satisfies the GDPR right to erasure. Require re-entering password (or re-confirming via Google) before executing, given this is irreversible.

**Indexes required (from Section 3's scale-ready practices):** `userId` on every collection; `date` on NutritionEntry and ProgressEntry (queried by date range for charts); compound index `{ userId, date }` where both are queried together.

---

## 14. Repo Structure & Git Workflow — [DECIDED]

**Folder structure:**
```
/backend
  /src
    /config       — db connection, env loading, passport strategy setup
    /models       — Mongoose schemas (Section 13)
    /controllers  — request handlers
    /services     — business logic, called by controllers
    /routes       — Express route definitions
    /middleware   — auth guard, error handler, rate limiter
    /utils
    app.ts
    server.ts
  /tests          — Vitest unit/integration tests
  .env.example    — committed; lists required keys with no real values
  Dockerfile
  package.json
/frontend           — added when frontend phase begins
/e2e                — Playwright tests, project-root level (tests full stack)
PROJECT_PLAN.md
README.md
```

**Git branching model:**
- `main` — protected, always deployable, direct pushes disabled
- `dev` — integration branch; feature branches merge here first
- `feature/<short-name>` — one per feature (e.g. `feature/workout-crud`)
- `fix/<short-name>` — bug fixes

**Workflow:** branch from `dev` → commit → push → open PR into `dev` → (self-)review → merge → periodically open a release PR from `dev` into `main` once a batch of features is stable.

**Commit convention:** Conventional Commits — `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:` prefixes.

**CI:** a GitHub Actions workflow runs lint + Vitest on every PR into `dev` or `main`.

---

## 15. Universal Page State Pattern — [DECIDED]

Rather than detailing every individual page's edge cases (impractical to fully enumerate upfront), every page in the app must implement these same four states consistently. This directly answers the original "what happens if the internet stops working" question:

| State | Behavior |
|---|---|
| **Loading** | Skeleton/placeholder matching the eventual layout — never a blank screen |
| **Empty** | A specific, helpful empty state per page (e.g. Workouts: "No workouts yet — create your first one" with a CTA button), never just a blank list |
| **Error (server error)** | Inline error message with a "Retry" action; the rest of the page's already-loaded data (e.g. nav, cached sections) stays visible and usable |
| **Offline / network failure** | Detected via `navigator.onLine` and failed fetch handling. Show a persistent but unobtrusive banner ("You're offline — showing last saved data"), continue displaying the last successfully fetched data from local state, and queue no destructive actions (disable Save/Delete buttons rather than silently failing them) until connectivity returns |

This pattern applies to every private page (Dashboard, Workouts, Nutrition, Progress, Analytics, Profile, Settings, Notifications, Reports) — the agent should implement it once as a shared pattern/hook (e.g. a `useDataFetch` hook or equivalent) and reuse it, not rebuild it per page.

---

## 16. Instructions for the coding agent (e.g. Claude Code)

- Treat every "[DECIDED]" section above as locked — do not deviate without asking.
- Treat every "[OPEN / TBD]" item as a required stop-and-ask point — do not invent a schema, hosting choice, testing framework, or social-feature scope on your own.
- Follow the build order in Section 9: backend fully before frontend.
- Every backend feature must map back to a line item in Section 7's coverage matrix — if you're building something not listed there, or skipping something that is, flag it.
- Apply the "scale-ready" practices in Section 3 to all backend code from the first commit (env vars, layered structure, stateless auth, Docker-ready).
- Apply the animation split in Section 10 exactly as specified — do not add GSAP/Three.js animation to authenticated app pages, and do not skip the `prefers-reduced-motion` check on any animated element.
- Build only v1 scope as defined in Section 11. Do not build any Phase 2 item (social/forum, email/push reminders, AI features, extra polish) unless explicitly asked.
- Use the schemas in Section 13 as-is. If a change is genuinely needed once building starts, propose it and explain why before changing it — don't silently diverge.
- Follow the repo structure and Git workflow in Section 14 from the first commit.
- Implement the shared page-state pattern from Section 15 once, early (e.g. as a reusable hook), rather than rebuilding loading/empty/error/offline handling per page.
- This plan is now complete — every open question has a decision. Start with backend scaffolding: project setup, `.env.example`, DB connection, the models in Section 13, then auth (email/password + Google), then the remaining v1 endpoints in the order they appear in Section 7's coverage matrix.
