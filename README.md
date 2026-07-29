# Scope Creep — AI Scope Management Middleware

An AI-powered triage layer that sits between chaotic client communication and your project management tool. It extracts actionable tasks from raw messages, and detects/negotiates scope creep against an agreed baseline.

## Problem it solves

Freelancers and agencies lose time and money because client requirements get buried in informal emails/messages, leading to scope creep, unbillable hours, and misaligned expectations. This app:

1. **Phase 1 — Extraction**: Paste raw client text → AI extracts structured, actionable tasks → review/edit in a staging area → export clean tasks to your real PM tool.
2. **Phase 2 — Scope protection**: Maintain a structured baseline (the original SOW). When a new request comes in, AI checks it against the baseline's explicit deliverables/exclusions/assumptions, flags scope creep, and drafts a professional pushback email with your chosen extra hours/cost.

## Tech stack

| Layer | Tool |
|---|---|
| Framework | Next.js 15+ (App Router, TypeScript) |
| Styling | Tailwind CSS + shadcn/ui (Base UI, Nova preset) |
| Database + Auth | Supabase (Postgres + Row Level Security) |
| AI | Vercel AI SDK + Google Gemini (`gemini-2.0-flash`), structured output via `generateObject` + Zod |
| Drag & drop | dnd-kit (for the Kanban staging board — frontend, not yet built) |

## Project structure

```
scope-creep/
├── middleware.ts                  # Refreshes Supabase auth session on every request
├── src/
│   ├── app/
│   │   ├── login/page.tsx         # Combined login/signup page
│   │   ├── dashboard/page.tsx     # Protected page, verifies auth works
│   │   ├── auth/signout/route.ts  # POST route to sign out
│   │   └── api/
│   │       ├── extract/route.ts       # Phase 1: raw text → structured tasks
│   │       ├── baseline/route.ts      # Structures SOW doc into baseline_items
│   │       ├── scope-check/route.ts   # Diffs new request against baseline
│   │       ├── draft-email/route.ts   # Generates pushback email
│   │       └── staged-tasks/route.ts  # Save/fetch staged tasks (GET + POST)
│   └── lib/
│       └── supabase/
│           ├── client.ts          # Supabase client for Client Components
│           └── server.ts          # Supabase client for Server Components/API routes
```

> ⚠️ **Not yet built:** `/api/projects` (create/list projects — every other route needs a `projectId`). Frontend pages (extraction UI, Kanban board, scope-check UI) are intentionally not built yet — backend-first approach, frontend to be built by teammates.

## Environment variables

Create `src/.env.local` (never commit this — already gitignored via `.env*`):

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_key_here
```

- Supabase URL + anon key: Supabase dashboard → Project Settings → API
- Gemini key: https://aistudio.google.com/apikey

## Setup (for teammates cloning this repo)

```bash
git clone <repo-url>
cd scope-creep
npm install
# create .env.local with the three vars above
npm run dev
```

Visit `http://localhost:3000/login` to create an account, then `http://localhost:3000/dashboard` to confirm auth works.

## Database schema (Supabase / Postgres)

All tables have Row Level Security enabled — a user can only ever read/write rows belonging to their own `projects` (enforced via `auth.uid() = user_id`, or a subquery through `project_id` for child tables).

```sql
projects
├── id (uuid, pk)
├── user_id (uuid, fk → auth.users)
├── name (text)
└── created_at

baseline_items          -- structured version of the original SOW
├── id (uuid, pk)
├── project_id (fk → projects)
├── deliverable (text)
├── exclusions (text, nullable)
├── assumptions (text, nullable)
└── source_text (text)

staged_tasks             -- Phase 1 output, pre-export to real PM tool
├── id (uuid, pk)
├── project_id (fk → projects)
├── title, description
├── complexity ('low' | 'medium' | 'high')
├── category (text)
└── status ('staged' | 'approved' | 'rejected')

scope_events              -- Phase 2: flagged requests + negotiation state
├── id (uuid, pk)
├── project_id (fk → projects)
├── request_text (text)
├── verdict ('in_scope' | 'out_of_scope')
├── discrepancy_note (text)
├── extra_hours, extra_cost (numeric)
└── status ('pending' | 'quoted' | 'resolved')
```

Full SQL (including RLS policies) is in `supabase/schema.sql` — run it in the Supabase SQL Editor for a fresh project.

## API reference

All routes are under `src/app/api/`. All (except future `/api/projects`) expect a `projectId` from an existing project owned by the logged-in user.

### `POST /api/extract`
Extracts actionable tasks from raw client text. **Does not save to DB** — returns tasks for review in the staging UI first.

**Body:**
```json
{ "rawText": "raw client email or message" }
```
**Response:**
```json
{ "tasks": [{ "title": "...", "description": "...", "complexity": "low|medium|high", "category": "..." }] }
```

### `POST /api/staged-tasks`
Persists reviewed/approved tasks from the staging area.

**Body:** `{ "projectId": "uuid", "tasks": [...] }` (same task shape as above)
**Response:** `{ "tasks": [...] }` (with DB ids)

### `GET /api/staged-tasks?projectId=uuid`
Fetches all staged tasks for a project.

### `POST /api/baseline`
Structures a raw SOW/agreement document into baseline items and **saves directly to DB** (unlike `/extract`, no separate review step — baseline is set once per project).

**Body:** `{ "projectId": "uuid", "sourceText": "raw SOW text" }`
**Response:** `{ "items": [{ "deliverable": "...", "exclusions": "...", "assumptions": "..." }] }`

### `POST /api/scope-check`
Compares a new client request against the project's baseline. Saves the result as a `scope_events` row.

**Body:** `{ "projectId": "uuid", "requestText": "new client message" }`
**Response:** full `scope_events` row, including `verdict`, `discrepancy_note`, `extra_hours`

> Requires baseline items to already exist for the project (call `/api/baseline` first) — returns 400 otherwise.

### `POST /api/draft-email`
Generates the pushback/negotiation email once the freelancer decides on hours/cost.

**Body:** `{ "scopeEventId": "uuid", "extraHours": 5, "extraCost": 250, "clientName": "optional" }`
**Response:** `{ "email": "full email body text" }`

Also updates the `scope_events` row's `extra_hours`, `extra_cost`, and sets `status: 'quoted'`.

## Auth notes

- Email/password via Supabase Auth. Email confirmation is currently **disabled** in Supabase settings (Authentication → Providers/Settings) for faster local testing — must be re-enabled before any public deployment.
- `middleware.ts` refreshes the session cookie on every request — required for sessions to persist correctly in Server Components.
- Two separate Supabase clients exist (`lib/supabase/client.ts` for Client Components, `lib/supabase/server.ts` for Server Components/API routes) because of how Next.js App Router handles cookies differently in each context.

## Still to build

- `POST /api/projects` + `GET /api/projects` — create/list projects
- Frontend: extraction input + Kanban staging board (dnd-kit), baseline input page, scope-check UI, negotiation/email UI
- Export flow from `staged_tasks` → external PM tool (or CSV/manual copy for MVP)