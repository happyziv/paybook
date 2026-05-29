# Paybook MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Docker-deployable Next.js 공동가계부 MVP for a couple to record monthly shared expenses behind an environment-variable PIN.

**Architecture:** Create a single Next.js App Router project with server-side PostgreSQL access through `pg`, signed PIN sessions via HTTP-only cookies, and client components for PIN entry, first-time name setup, and the monthly dashboard. The app auto-ensures its minimal schema on server access so a Proxmox container only needs `DATABASE_URL`, `PAYBOOK_PIN`, and `PAYBOOK_SESSION_SECRET`.

**Tech Stack:** Next.js 16, React 19, TypeScript, PostgreSQL, `pg`, Vitest, plain CSS, Docker multi-stage build.

---

## File Structure

- Create project config: `package.json`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, `vitest.config.ts`, `next-env.d.ts`, `.gitignore`, `.dockerignore`
- Create app shell: `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`
- Create UI components: `src/components/PinGate.tsx`, `src/components/SetupForm.tsx`, `src/components/Dashboard.tsx`, `src/components/MobileDetailView.tsx`
- Create server utilities: `src/lib/config.ts`, `src/lib/auth.ts`, `src/lib/db.ts`, `src/lib/month.ts`, `src/lib/repository.ts`, `src/lib/types.ts`, `src/lib/validation.ts`
- Create API routes: `src/app/api/auth/pin/route.ts`, `src/app/api/household/route.ts`, `src/app/api/monthly/route.ts`, `src/app/api/expenses/route.ts`, `src/app/api/expenses/[id]/route.ts`
- Create tests: `src/lib/*.test.ts`
- Create deploy docs/artifacts: `.env.example`, `Dockerfile`, `docker-compose.example.yml`, `README.md`

## Task 1: Project Scaffold And Tooling

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `eslint.config.mjs`
- Create: `vitest.config.ts`
- Create: `next-env.d.ts`
- Create: `.gitignore`

- [ ] **Step 1: Create package manifest**

Use this exact script set and dependencies:

```json
{
  "name": "paybook",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3000",
    "build": "next build",
    "start": "next start -p 3000",
    "lint": "eslint",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "next": "16.2.6",
    "pg": "^8.20.0",
    "react": "19.2.4",
    "react-dom": "19.2.4"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/pg": "^8.20.0",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "16.2.6",
    "typescript": "^5",
    "vitest": "^4.0.0"
  }
}
```

- [ ] **Step 2: Add TypeScript, Next, ESLint, and Vitest config**

Use strict TypeScript, `src/*` path aliases, App Router defaults, and a Vitest Node environment for library tests.

- [ ] **Step 3: Install dependencies**

Run: `npm install`

Expected: `package-lock.json` is created and install exits 0.

- [ ] **Step 4: Run initial checks**

Run: `npm run lint` and `npm test`

Expected: lint exits 0 with no source files or only config-aware no-op; tests report no tests found only if Vitest is configured to pass with no tests. If Vitest fails on no tests, add a temporary smoke test and remove it after Task 2 tests exist.

## Task 2: Core Domain Utilities With Tests

**Files:**
- Create: `src/lib/types.ts`
- Create: `src/lib/config.ts`
- Create: `src/lib/month.ts`
- Create: `src/lib/validation.ts`
- Create tests: `src/lib/month.test.ts`, `src/lib/validation.test.ts`, `src/lib/config.test.ts`

- [ ] **Step 1: Define shared types**

Create TypeScript types for:

```ts
export type Household = {
  personAName: string;
  personBName: string;
  createdAt: string;
};

export type Expense = {
  id: number;
  spender: string;
  spentOn: string;
  amount: number;
  purpose: string;
  createdAt: string;
};

export type MonthlyData = {
  month: string;
  household: Household;
  totals: { total: number; byPerson: Record<string, number> };
  suggestions: string[];
  expenses: Expense[];
};
```

- [ ] **Step 2: Write failing tests for month helpers**

Cover `getCurrentMonthKey()`, `isValidMonthKey()`, `monthBounds()`, `shiftMonth()`, and `todayDateKey()` using fixed dates.

- [ ] **Step 3: Implement month helpers**

Use local date formatting for `YYYY-MM` and `YYYY-MM-DD`. `monthBounds("2026-05")` returns `{ start: "2026-05-01", endExclusive: "2026-06-01" }`.

- [ ] **Step 4: Write failing tests for validation**

Cover name trimming, PIN non-empty, amount positive integer, date format, spender membership, purpose trimming to non-empty text, and invalid month rejection.

- [ ] **Step 5: Implement validation helpers**

Expose `parseHouseholdInput`, `parsePinInput`, `parseExpenseInput`, and `parseMonthQuery`. Return typed values or throw `ValidationError` with user-safe Korean messages.

- [ ] **Step 6: Write and implement config tests**

`getConfig()` must require `DATABASE_URL`, `PAYBOOK_PIN`, and `PAYBOOK_SESSION_SECRET`; reject session secrets shorter than 32 characters; never log or return redacted variants.

- [ ] **Step 7: Run tests**

Run: `npm test -- src/lib/month.test.ts src/lib/validation.test.ts src/lib/config.test.ts`

Expected: all tests pass.

## Task 3: PostgreSQL Schema And Repository

**Files:**
- Create: `src/lib/db.ts`
- Create: `src/lib/repository.ts`
- Create tests: `src/lib/repository.test.ts`

- [ ] **Step 1: Implement PostgreSQL pool and schema bootstrap**

Create a singleton `Pool` from `DATABASE_URL`. Add `ensureSchema()` guarded by a process-local promise. It creates:

```sql
CREATE TABLE IF NOT EXISTS household (
  id integer PRIMARY KEY CHECK (id = 1),
  person_a_name text NOT NULL,
  person_b_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS expense (
  id bigserial PRIMARY KEY,
  spender text NOT NULL,
  spent_on date NOT NULL,
  amount integer NOT NULL CHECK (amount > 0),
  purpose text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS expense_spent_on_idx ON expense (spent_on DESC);
CREATE INDEX IF NOT EXISTS expense_purpose_idx ON expense (purpose);
```

- [ ] **Step 2: Write repository contract tests with a fake query client**

Test that monthly lookup uses inclusive start and exclusive end, totals are grouped by the configured names, and suggestions are capped at 5 unique purposes ordered by frequency then recency.

- [ ] **Step 3: Implement repository functions**

Expose:

```ts
getHousehold(): Promise<Household | null>
createHousehold(input): Promise<Household>
getMonthlyData(month: string): Promise<MonthlyData>
createExpense(input): Promise<Expense>
deleteExpense(id: number): Promise<void>
getPurposeSuggestions(): Promise<string[]>
```

`createHousehold` inserts row `id = 1` and fails with a Korean conflict message if it already exists. `deleteExpense` is idempotent for a missing id.

- [ ] **Step 4: Run repository tests**

Run: `npm test -- src/lib/repository.test.ts`

Expected: all repository contract tests pass without a real PostgreSQL connection.

## Task 4: PIN Session Auth

**Files:**
- Create: `src/lib/auth.ts`
- Create test: `src/lib/auth.test.ts`
- Create: `src/app/api/auth/pin/route.ts`

- [ ] **Step 1: Write failing auth tests**

Cover correct PIN success, wrong PIN rejection, cookie signing, cookie tamper rejection, expired session rejection, and production `secure` cookie flag.

- [ ] **Step 2: Implement signed cookie helpers**

Use Node `crypto.createHmac("sha256", PAYBOOK_SESSION_SECRET)`. Cookie value format: `v1.<expiresMs>.<signature>`. Expire sessions after 30 days. Use constant-time comparison for signatures.

- [ ] **Step 3: Implement auth API route**

`POST /api/auth/pin` accepts `{ "pin": "1234" }`. On success, set `paybook_session` as `HttpOnly`, `SameSite=Lax`, `Path=/`, and `Secure` when `NODE_ENV === "production"`. On failure, return 401 with `{ "message": "PIN이 올바르지 않습니다." }`.

- [ ] **Step 4: Run auth tests**

Run: `npm test -- src/lib/auth.test.ts`

Expected: all auth tests pass.

## Task 5: API Routes

**Files:**
- Create: `src/app/api/household/route.ts`
- Create: `src/app/api/monthly/route.ts`
- Create: `src/app/api/expenses/route.ts`
- Create: `src/app/api/expenses/[id]/route.ts`

- [ ] **Step 1: Add auth guard pattern**

Each data route must call `requireSession()` before repository access. Unauthenticated requests return 401 and must not call repository functions.

- [ ] **Step 2: Implement household route**

`POST /api/household` accepts `{ personAName, personBName }`, validates both names, creates the single household, and returns `{ household }`.

- [ ] **Step 3: Implement monthly route**

`GET /api/monthly?month=YYYY-MM` validates the month and returns `MonthlyData`. If no household exists, return 404 with `{ "needsSetup": true }`.

- [ ] **Step 4: Implement expense routes**

`POST /api/expenses` accepts `{ spender, spentOn, amount, purpose }`; validates spender against current household names; returns `{ expense }`. `DELETE /api/expenses/:id` deletes and returns 204.

- [ ] **Step 5: Manually verify API behavior**

With the dev server running and env vars set, verify:

```bash
curl -i http://localhost:3000/api/monthly?month=2026-05
```

Expected before PIN: HTTP 401.

## Task 6: App UI

**Files:**
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `src/app/globals.css`
- Create: `src/components/PinGate.tsx`
- Create: `src/components/SetupForm.tsx`
- Create: `src/components/Dashboard.tsx`
- Create: `src/components/MobileDetailView.tsx`

- [ ] **Step 1: Implement page routing state**

`src/app/page.tsx` checks session and household server-side:

- no valid session: render `PinGate`
- valid session and no household: render `SetupForm`
- valid session and household exists: render `Dashboard`

- [ ] **Step 2: Implement PIN gate**

Client component posts to `/api/auth/pin`, shows Korean error text on 401, and reloads the page on success.

- [ ] **Step 3: Implement first-time setup form**

Client component posts names to `/api/household`, trims input, blocks duplicate/empty names, and reloads on success.

- [ ] **Step 4: Implement desktop dashboard**

Render Starbucks-inspired Paybook layout: dark green header, cream page canvas, summary cards, person segmented button selector, date defaulting to today, amount input, purpose text input, 5 suggestion chips, add button, month navigation, and detail list with delete actions.

- [ ] **Step 5: Implement mobile input-first layout**

For viewport widths under the mobile breakpoint, make the default dashboard prioritize input: header with month total, top-right `상세내역` button, person totals, person selector, date, amount, purpose input, 5 suggestion chips, and add button. Do not show the long detail list on the mobile default screen.

- [ ] **Step 6: Implement mobile detail view**

`MobileDetailView` opens from the `상세내역` button. It shows a header with close action, month selector controls, selected month total, date-ordered expenses, and delete actions. Month changes call the same `/api/monthly?month=YYYY-MM` API used by desktop.

- [ ] **Step 7: Implement dashboard data flow**

On mount and month changes, fetch `/api/monthly?month=YYYY-MM`. After add/delete, refetch monthly data. Selecting a suggestion chip fills the purpose text field but remains editable.

- [ ] **Step 8: Run UI checks**

Run: `npm run lint` and `npm run build`

Expected: both exit 0.

## Task 7: Docker And Proxmox Deployment Docs

**Files:**
- Create: `.env.example`
- Create: `.dockerignore`
- Create: `Dockerfile`
- Create: `docker-compose.example.yml`
- Create: `README.md`

- [ ] **Step 1: Add env example**

Use:

```env
DATABASE_URL=postgresql://paybook:change-me@postgres.example:5432/paybook
PAYBOOK_PIN=123456
PAYBOOK_SESSION_SECRET=replace-with-at-least-32-random-characters
```

- [ ] **Step 2: Add Dockerfile**

Use a multi-stage Node 22 Alpine build. Install dependencies with `npm ci`, run `npm run build`, copy `.next`, `public` if present, `package.json`, `package-lock.json`, and `node_modules`, expose `3000`, and run `npm start`.

- [ ] **Step 3: Add compose example**

Create a single `paybook` service image using `build: .`, map `3000:3000`, inject the three env vars, and set `restart: unless-stopped`. Do not include PostgreSQL in compose because the target is an existing external PG server.

- [ ] **Step 4: Document Proxmox deployment**

README must include: build image, run container, required env vars, external PostgreSQL requirement, reverse proxy HTTPS note, and first-use flow.

- [ ] **Step 5: Verify container build**

Run: `docker build -t paybook:local .`

Expected: image builds successfully.

## Task 8: End-To-End Verification

**Files:**
- Modify only if verification reveals issues.

- [ ] **Step 1: Run unit checks**

Run: `npm test`

Expected: all unit tests pass.

- [ ] **Step 2: Run static/build checks**

Run: `npm run lint` and `npm run build`

Expected: both exit 0.

- [ ] **Step 3: Run local smoke flow**

Start with:

```bash
DATABASE_URL='postgresql://...' \
PAYBOOK_PIN='123456' \
PAYBOOK_SESSION_SECRET='replace-with-at-least-32-random-characters' \
npm run dev
```

Verify in browser: wrong PIN fails, correct PIN opens setup, names save, dashboard loads, person selector stores chosen name, purpose chip fills editable text, custom purpose saves, desktop delete updates totals, mobile default screen is input-first, mobile `상세내역` opens the detail view, and mobile detail month switching loads the selected month.

- [ ] **Step 4: Run Docker smoke flow**

Run the built image with the same three env vars and verify the same browser flow through `http://localhost:3000`.

---

## Self-Review Notes

- Spec coverage: PIN env, external PostgreSQL, Docker/Proxmox, first-time names, monthly totals, person selector, 5 suggestions, free-text purpose, desktop detail list, mobile input-first default screen, mobile detail view with month switching, and no unauthenticated data access are covered.
- Scope control: no login accounts, multiple ledgers, editing, budgeting, settlement, card integration, OCR, or categories are included.
- Implementation default: PIN is never stored in DB; session cookie is signed with `PAYBOOK_SESSION_SECRET`; DB schema is auto-ensured by the app process.
