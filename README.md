# Scope Creep — AI Scope Management Middleware

Scope Creep is a triage layer that sits between messy client communication and your project-management tool. It reads raw client emails/messages, turns them into structured tasks, and checks new requests against an agreed-upon scope of work — flagging drift and drafting the pushback email for you.

## The problem

Freelancers and agencies lose time and money because requirements get buried in informal emails and chat messages. Small "quick asks" pile up quietly, scope drifts away from what was quoted, and by the time anyone notices, hours have gone unbilled. Scope Creep exists to catch that drift early and give you a paper trail (and a professional response) when it happens.

## How it works

1. **Extract** — Paste a raw client email or message. AI breaks it into structured, actionable tasks (title, description, category, complexity) that you review and approve before anything is saved.
2. **Baseline** — Paste your original SOW/agreement. AI structures it into explicit deliverables, exclusions, and assumptions, locked in per project.
3. **Scope check** — Paste a new client request. AI compares it against the baseline and returns a verdict (`in_scope` / `out_of_scope`) with a discrepancy note.
4. **Negotiate** — If a request is out of scope, set the extra hours/cost and generate a polite, professional email explaining the change order.
5. **Export** — Push approved tasks out as CSV, PDF, or directly to a Trello board.

## Features

- Email/password auth (Supabase Auth) with session refresh middleware
- Multi-project support — create and switch between projects
- Phase 1: AI task extraction with an editable staging area before saving
- Phase 2: SOW baseline capture, AI scope-drift detection, and email drafting
- Dashboard metrics and a workflow tracker across both phases
- Command menu (⌘K-style) for quick navigation
- Task export to CSV, PDF, and Trello
- Dark/light theme support

## Tech stack

| Layer | Tool |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript) |
| UI | React 19, Tailwind CSS 4, shadcn/ui (Base UI), Framer Motion, lucide-react |
| Database + Auth | Supabase (Postgres + Row Level Security) |
| AI | Vercel AI SDK (`ai`, `@ai-sdk/google`) + Google Gemini, structured output via `generateObject` + Zod |
| Drag & drop | dnd-kit (task staging board) |

## Project structure

```
scope-creep/
├── src/
│   ├── middleware.ts               # Refreshes the Supabase auth session on every request
│   ├── app/
│   │   ├── page.tsx                # Marketing / landing page
│   │   ├── login/page.tsx          # Combined login/signup page
│   │   ├── dashboard/page.tsx      # Main app: project selector + Phase 1/2 workflow
│   │   ├── auth/signout/route.ts   # POST route to sign out
│   │   └── api/
│   │       ├── projects/route.ts          # GET/POST — list/create projects
│   │       ├── extract/route.ts           # Phase 1: raw text → structured tasks
│   │       ├── staged-tasks/route.ts      # GET/POST — fetch/save staged tasks
│   │       ├── staged-tasks/[id]/route.ts # PATCH — update a task's status
│   │       ├── baseline/route.ts          # Structures an SOW doc into baseline_items
│   │       ├── scope-check/route.ts       # Diffs a new request against the baseline
│   │       └── draft-email/route.ts       # Generates the scope-creep pushback email
│   ├── components/
│   │   ├── dashboard/               # Metrics, workflow tracker, Phase 1/2 panels, export modal
│   │   ├── projects/                # Project selector
│   │   ├── layout/                  # Navbar
│   │   └── ui/                      # shadcn/ui-based primitives (button, card, toast, etc.)
│   ├── hooks/                       # use-projects, use-staged-tasks, use-baseline
│   ├── lib/
│   │   ├── gemini.ts                 # Gemini model config
│   │   ├── exportServices.ts         # CSV / PDF / Trello export services
│   │   └── supabase/                 # client.ts (Client Components) / server.ts (Server Components + API routes)
│   └── types/                        # Shared domain + API response types
└── public/
```

## Getting started

```bash
git clone https://github.com/shaunxox/Scope-Creep.git
cd Scope-Creep
npm install
```

Create a `.env.local` file in the project root:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_key_here
# Optional — defaults to gemini-1.5-flash
GEMINI_MODEL=gemini-1.5-flash
```

- Supabase URL + anon key: Supabase dashboard → Project Settings → API
- Gemini key: https://aistudio.google.com/apikey

Run the dev server:

```bash
npm run dev
```

Visit `http://localhost:3000` for the landing page, `/login` to create an account, and `/dashboard` for the app.

Other scripts: `npm run build`, `npm run start`, `npm run lint`.

## Database schema (Supabase / Postgres)

All tables have Row Level Security enabled — a user can only read/write rows belonging to their own `projects` (enforced via `auth.uid() = user_id`, or a subquery through `project_id` for child tables). Set these up in the Supabase SQL Editor.

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

staged_tasks             -- Phase 1 output
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

## API reference

All routes live under `src/app/api/`. Every route besides `/api/projects` expects a `projectId` for a project owned by the logged-in user.

### `GET /api/projects`
Lists the current user's projects.

### `POST /api/projects`
Creates a project.
**Body:** `{ "name": "string" }`

### `POST /api/extract`
Extracts actionable tasks from raw client text. Does **not** save to the database — returns tasks for review in the staging UI first.
**Body:** `{ "rawText": "raw client email or message" }`
**Response:** `{ "tasks": [{ "title", "description", "complexity": "low|medium|high", "category" }] }`

### `GET /api/staged-tasks?projectId=uuid`
Fetches all staged tasks for a project.

### `POST /api/staged-tasks`
Persists reviewed/approved tasks from the staging area.
**Body:** `{ "projectId": "uuid", "tasks": [...] }`

### `PATCH /api/staged-tasks/:id`
Updates a single task's status.
**Body:** `{ "status": "staged" | "approved" | "rejected" }`

### `POST /api/baseline`
Structures a raw SOW/agreement into baseline items and saves directly to the database (no separate review step — the baseline is set once per project).
**Body:** `{ "projectId": "uuid", "sourceText": "raw SOW text" }`
**Response:** `{ "items": [{ "deliverable", "exclusions", "assumptions" }] }`

### `POST /api/scope-check`
Compares a new client request against the project's baseline and saves the result as a `scope_events` row.
**Body:** `{ "projectId": "uuid", "requestText": "new client message" }`
**Response:** the full `scope_events` row, including `verdict`, `discrepancy_note`, `extra_hours`
> Requires baseline items to already exist for the project — returns 400 otherwise.

### `POST /api/draft-email`
Generates the pushback/negotiation email once the freelancer decides on hours/cost. Also updates the `scope_events` row's `extra_hours`, `extra_cost`, and sets `status: 'quoted'`.
**Body:** `{ "scopeEventId": "uuid", "extraHours": 5, "extraCost": 250, "clientName": "optional" }`
**Response:** `{ "email": "full email body text" }`

## Auth notes

- Email/password via Supabase Auth. Email confirmation may be disabled in Supabase (Authentication → Providers/Settings) for faster local testing — re-enable it before any public deployment.
- `middleware.ts` refreshes the session cookie on every request, which is required for sessions to persist correctly in Server Components.
- Two Supabase clients exist (`lib/supabase/client.ts` for Client Components, `lib/supabase/server.ts` for Server Components/API routes) because of how the Next.js App Router handles cookies differently in each context.

## Contributing

This is currently a small-team project. If you're picking up a task, branch off `main`, keep API route contracts (request/response shapes above) stable unless the team agrees on a change, and update this README when routes or the schema change.
