# Sentinel EHR — Clinical Documentation Risk Intelligence (Prototype)

An interactive prototype of an Advanced Electronic Health Record whose differentiator is a
**Clinical Documentation Risk Intelligence** layer:

> Traditional EHRs store documentation. Sentinel continuously **evaluates** every chart,
> **detects** missing or incomplete records, **surfaces** risk, **assigns** corrective work,
> **verifies** the correction, and gives nurse leaders a command center instead of manual chart audits.

Core workflow: **Detect → Explain → Assign → Correct → Verify → Learn**

> ⚠️ Prototype environment using synthetic demonstration data. Not intended for clinical use.
> All patients, staff, MRNs and clinical details are fictional.

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS + React Router + Recharts + lucide-react + Zustand |
| Backend (scaffold) | Node.js + Express + TypeScript + PostgreSQL (`pg`) + Zod |
| Data (default) | Local synthetic dataset (`frontend/src/data/mockdb.ts`) — no backend required to run the demo |

The frontend runs **fully standalone** on mock data. The backend is a working scaffold
(schema + seed + REST endpoints) showing how a real API replaces the mock repository layer.

---

## Run the prototype (frontend only)

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
```

**Login:** `jennifer.adams@gulfcoasthp.org` (Director of Nursing) — password: any value.
Other demo accounts are listed on the login screen.

Build: `npm run build` · Preview: `npm run preview`

---

## Run the backend (optional)

```bash
cd backend
cp .env.example .env          # point DATABASE_URL at your Postgres
npm install
npm run db:reset              # applies schema.sql + seeds synthetic data
npm run dev                   # http://localhost:4000
```

Endpoints: `/api/auth/login`, `/api/patients`, `/api/findings`, `/api/findings/:id/transition`,
`/api/rules`, `/api/dashboard/kpis`, `/api/audit`, `/health`.

To point the frontend at the API, set `VITE_API_BASE` and swap `frontend/src/services/index.ts`
to re-export from `frontend/src/services/http.ts`.

---

## Guided demo flows

1. **Resolve a critical finding.** Login → Command Center shows *Critical Findings* → open
   *Sarah Williams — Medication Reconciliation Incomplete* → review why / evidence / rule /
   responsible nurse / due time → **Go to Documentation** → complete reconciliation → finding
   becomes **Awaiting Verification** → return to finding → **Verify Correction & Close** →
   dashboard critical count drops by one, audit log + timeline updated, toast confirms.
2. **Pre-sign documentation scrubber.** Patient 360 → Sarah Williams → *Notes* → open the
   *Nursing Progress Note* draft → **Sign Note** → scrubber flags a missing *Patient Response*
   (must resolve) and a possible mobility inconsistency vs. the PT note (review) → fill the
   field → sign. Override & Sign requires a reason + confirmation.
3. **Ask the Chart.** Patient 360 → *Ask the Chart* → "Why is this patient high documentation
   risk?" → grounded answer with clickable source cards.
4. **Risk Rule Builder.** Risk Management → *Risk Rules* → *Create Rule* → configure
   *Post-Fall Reassessment* (trigger *Fall Incident*, requirement, 2h deadline, High,
   escalate to Critical after 4h) → **Test Rule** against a synthetic patient → shows the
   finding that would be generated → **Activate Rule**.

---

## Project structure

```
frontend/src/
  components/ui        reusable primitives (SeverityBadge, DataTable, FilterBar, Drawer, Modal, MetricCard, …)
  components/charts     Recharts wrappers
  layouts              AppLayout, Sidebar, Header, navigation config
  features/
    dashboard          Command Center, Clinical Risk Dashboard
    risk               Risk Inbox, Finding Detail, Rule Builder, Exceptions, False-Positive Review
    patients           Patient Directory, Patient 360 + tabs
    notes              Note editor + Pre-Sign Documentation Scrubber
    medications        Medication reconciliation
    clinical           org-wide clinical list pages
    analytics          compliance / facility / unit / staff / trends
    reports            report library + viewer
    admin              users, roles, facilities, audit logs, AI governance, …
    ai                 deterministic "Demo Clinical LLM" stand-in (summaries, Ask the Chart)
  store                Zustand store (working DB copy, lifecycle actions, cascades) + selectors
  services             repository layer (mock today, HTTP swap-in provided)
  data                 synthetic dataset
  types                domain models
  hooks / utils

backend/src/
  db/schema.sql        full PostgreSQL DDL
  db/migrate.ts        applies schema
  db/seed.ts           synthetic seed data
  db/repository.ts     query helpers (camelCase output matching the frontend)
  routes/              Express REST routes
  server.ts
```

## Clinical safety posture

AI features **summarize, locate, explain, and flag possible contradictions** in existing
documentation. They never diagnose, prescribe, predict outcomes, sign records, or claim
clinical certainty. Uncertain results are labelled **"AI-Assisted Finding — Review Required"**
and a clinician always decides.
