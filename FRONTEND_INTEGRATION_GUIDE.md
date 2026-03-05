# SmartFormFlow — Frontend API Integration Guide
> **Stack:** Next.js 14 · TypeScript · Zod · react-hook-form  
> **Backend:** Express 5 · Prisma · PostgreSQL (Neon) · Redis · BullMQ  
> **IDE:** Antigravity  
> **Reference:** See `SmartFormFlow_API_Docs.docx` in project root

---

## Part 1 — Antigravity Setup

### Recommended Extensions / MCP Servers to Install

These are all free and will give the AI agent full context of your project:

| Tool | What it does | Install |
|------|-------------|---------|
| **Context7** | Pulls live Next.js, Prisma, Zod docs into the agent context | Already connected (see your MCP servers) |
| **ESLint + Prettier** | Keeps generated code clean | Built-in to VSCode/Antigravity |

> You do NOT need to install paid agents. Context7 already gives the AI up-to-date Next.js 14 + TypeScript docs. That's all you need beyond the API docs file.

### How to give the AI full context in Antigravity

Before each session, do this:

1. **Add `SmartFormFlow_API_Docs.docx`** to the project root (already done from previous step)
2. In Antigravity chat, start every session with this context prompt:

```
I am integrating a Next.js 14 frontend (TypeScript, Tailwind, shadcn/ui, react-hook-form, Zod) 
with a separate Express 5 backend. I am NOT using Next.js API routes or server actions — 
all data fetching is pure client-side fetch() to http://localhost:3000/api.

Auth: JWT stored in localStorage as "token". 
All protected requests: Authorization: Bearer <token> header.
API Docs: See SmartFormFlow_API_Docs.docx in project root.
```

3. Then describe the specific file/feature you want to integrate.

---

## Part 2 — Integration Architecture

### The Golden Rule
> We are NOT using Next.js server components, server actions, or API routes for data fetching.  
> Everything is `"use client"` + `fetch()` to `http://localhost:3000/api`.

### Folder structure to create

```
frontend/
├── lib/
│   ├── api/                   ← All API functions live here
│   │   ├── client.ts          ← Base fetch wrapper (auth headers, error handling)
│   │   ├── auth.ts            ← /auth/* calls
│   │   ├── events.ts          ← /events/* calls
│   │   ├── forms.ts           ← /forms/* calls (admin)
│   │   ├── submissions.ts     ← /forms/:slug/* calls (public visitor flow)
│   │   ├── files.ts           ← /files/* calls
│   │   ├── certificates.ts    ← /certificates/* calls
│   │   ├── messages.ts        ← /messages/* calls
│   │   └── analytics.ts       ← /analytics/* calls
│   ├── types/
│   │   └── api.ts             ← All TypeScript types matching backend responses
│   ├── hooks/
│   │   ├── useAuth.ts         ← Auth state + login/logout
│   │   ├── useEvents.ts       ← Events CRUD
│   │   ├── useForms.ts        ← Form builder state
│   │   └── useSubmission.ts   ← Public form submission flow
│   └── utils.ts               ← (existing)
```

---

## Part 3 — Step-by-Step Integration Order

Do these IN ORDER. Each step depends on the previous.

---

### STEP 1 — Create the API client base (`lib/api/client.ts`)

This is the most important file. Create it first. Every other API function uses it.

**Prompt for Antigravity:**
```
Create lib/api/client.ts — a typed base fetch wrapper for a Next.js 14 TypeScript project.

Requirements:
- Base URL from env: process.env.NEXT_PUBLIC_API_URL (default: http://localhost:3000/api)
- Two exported functions: apiClient() for authenticated requests, publicClient() for unauthenticated
- apiClient() reads JWT from localStorage key "token" and adds Authorization: Bearer header
- Both functions accept: (endpoint: string, options?: RequestInit) => Promise<T>
- On 401 response: clear localStorage and redirect to /login
- On non-ok response: throw an Error with the message from response JSON { message: string }
- Handle JSON parse errors gracefully
- TypeScript generic: async function apiClient<T>(endpoint: string, options?: RequestInit): Promise<T>
```

**What it should look like:**
```typescript
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api";

async function apiClient<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });
  if (res.status === 401) {
    localStorage.removeItem("token");
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message ?? "Request failed");
  }
  return res.json() as Promise<T>;
}

export async function publicClient<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message ?? "Request failed");
  }
  return res.json() as Promise<T>;
}

export default apiClient;
```

---

### STEP 2 — Create TypeScript types (`lib/types/api.ts`)

**Prompt for Antigravity:**
```
Create lib/types/api.ts with TypeScript interfaces for all SmartFormFlow API responses.

Models to type:
- User: { id, name, email, role, createdAt }
- Event: { id, title, slug, description, status ("DRAFT"|"ACTIVE"|"CLOSED"), paymentEnabled, paymentConfig?, templateType, date?, link?, createdAt, updatedAt }
- PaymentConfig: { id, eventId, amount, currency, description? }
- Form: { id, eventId, isMultiStep, publishedAt?, fields: FormField[], steps?: FormStep[] }
- FormStep: { id, formId, stepNumber, title, description?, fields: FormField[] }
- FormField: { id, formId, stepId?, key, type (FormFieldType enum), label, required, order, options?, validation? }
- FormFieldType enum: TEXT | NUMBER | EMAIL | DATE | TEXTAREA | RANGE | CHECKBOX | RADIO | FILE | SELECT
- FormSubmission: { id, formId, eventId, status, submittedAt, answers: SubmissionAnswer[], contact? }
- SubmissionAnswer: { fieldId, fieldKey, valueText?, valueNumber?, valueBoolean?, valueFile? }
- FileAsset: { id, url, name, mimeType, size, context }
- Certificate: { id, submissionId, status, templateType, issuedAt? }
- MessageLog: { id, contactId, type, template, status, sentAt?, createdAt }
- EventAnalytics: { totalVisits, totalStarted, totalSubmitted, conversionRate, lastUpdated }

Also type API response wrappers:
- AuthLoginResponse: { accessToken: string, user: User }
- EventListResponse: { events: Event[] }  
- SubmissionListResponse: { total: number, items: FormSubmission[] }
```

---

### STEP 3 — Auth (`lib/api/auth.ts` + `lib/hooks/useAuth.ts`)

**3a. Create `lib/api/auth.ts`:**
```
Create lib/api/auth.ts with these functions using the apiClient and publicClient from lib/api/client.ts:

- signup(data: { name, email, password }) → publicClient POST /auth/signup
- login(data: { email, password }) → publicClient POST /auth/login → returns AuthLoginResponse
- getMe() → apiClient GET /auth/me → returns User
- logout() → apiClient POST /auth/logout

All functions are typed with the types from lib/types/api.ts.
```

**3b. Create `lib/hooks/useAuth.ts`:**
```
Create lib/hooks/useAuth.ts — a React hook for auth state management.

Requirements:
- "use client" at top
- State: user (User | null), isLoading (boolean), isAuthenticated (boolean)
- On mount: if token in localStorage, call getMe() to hydrate user state
- login(email, password): calls auth.login(), saves token to localStorage as "token", sets user state
- logout(): calls auth.logout(), clears localStorage, sets user to null, redirects to /
- signup(name, email, password): calls auth.signup(), then auto-login
- Export as: export function useAuth()
```

**3c. Replace mock auth in `app/page.tsx`:**

Point the "Sign In" and "Get Started" buttons to `/login` instead of `/dashboard`.

**3d. Create `app/login/page.tsx` and `app/signup/page.tsx`:**
```
Create app/login/page.tsx — a login form using react-hook-form + Zod validation.

Schema: { email: z.string().email(), password: z.string().min(6) }
On submit: call useAuth().login(), on success redirect to /dashboard
Show error toast (sonner) on failure.
Style with shadcn/ui Card, Input, Button — centered on page.
```

**3e. Create a protected route guard:**
```
Create components/auth-guard.tsx — a client component that:
- Checks localStorage for "token" on mount
- If no token: redirects to /login
- If token: renders children
- Shows a loading spinner while checking
Use it to wrap DashboardLayout.
```

---

### STEP 4 — Events (`lib/api/events.ts`)

**Prompt for Antigravity:**
```
Create lib/api/events.ts with these functions using apiClient from lib/api/client.ts:

- getEvents() → GET /events/ → returns Event[]
- getEventById(id: string) → GET /events/:id → returns Event
- getEventBySlug(slug: string) → GET /events/slug/:slug → returns Event (publicClient — no auth)
- createEvent(data: CreateEventInput) → POST /events
  CreateEventInput: { title, description?, date?, link?, paymentEnabled?, paymentConfig?: { amount, currency, description } }
- updateEvent(id: string, data: Partial<CreateEventInput>) → PUT /events/:id
- publishEvent(id: string) → PUT /events/:id/publish
- closeEvent(id: string) → PUT /events/:id/close

All typed with Event from lib/types/api.ts.
```

**Replace mock data in `app/dashboard/page.tsx`:**
```
Refactor app/dashboard/page.tsx to:
1. Remove the hardcoded "events" and "stats" arrays at the top
2. Add "use client" if not present
3. Use useEffect to call getEvents() from lib/api/events.ts on mount
4. Show a skeleton loader (shadcn/ui Skeleton) while loading
5. Show sonner toast on error
6. Compute stats (Total Events, Total Visitors, Form Submissions, Revenue) from the events array
7. Keep all existing UI — just replace mock data with real data
```

**Replace mock data in `app/dashboard/events/page.tsx`:**
```
Refactor app/dashboard/events/page.tsx to replace the hardcoded "events" array with real API data.
- useEffect → getEvents() → setEvents(data)
- Loading state with skeleton cards
- Error state with retry button
- Keep all filters (search, status, date) — they filter the fetched data client-side
- handleDelete: call a deleteEvent function (or just show a toast — no delete endpoint exists yet)
- Status from backend is "DRAFT"|"ACTIVE"|"CLOSED" — map to lowercase for badge colors
```

---

### STEP 5 — Create Event Form (`app/dashboard/create-event/page.tsx`)

```
Refactor app/dashboard/create-event/page.tsx to submit to the real API.

Use react-hook-form + Zod:
Schema:
  title: z.string().min(3)
  description: z.string().optional()
  date: z.date().optional()
  link: z.string().url().optional().or(z.literal(""))
  paymentEnabled: z.boolean()
  paymentConfig: z.object({
    amount: z.number().min(1),
    currency: z.string().default("INR"),
    description: z.string().optional()
  }).optional()

On submit: call createEvent() from lib/api/events.ts
On success: redirect to /dashboard/event/:id (use the returned event.id)
Show inline field errors and a loading spinner on the submit button.
```

---

### STEP 6 — Form Builder (`app/dashboard/event/[id]/`)

This is the most complex step. Break it into sub-steps.

**6a. Load event + form data:**
```
In app/dashboard/event/[id]/page.tsx:
- On mount: call getEventById(id) and getFormByEventId(id) from lib/api/forms.ts
- getFormByEventId: GET /forms/event/:eventId
- Display event status, publish button, form status
- If no form exists yet: show "Create Form" button
```

**6b. Create `lib/api/forms.ts`:**
```
Create lib/api/forms.ts:

- getFormByEventId(eventId: string) → GET /forms/event/:eventId → Form
- getFormById(formId: string) → GET /forms/:formId → Form
- createForm(eventId: string, data: CreateFormInput) → POST /forms/event/:eventId
  CreateFormInput: { isMultiStep: boolean, fields?: FormFieldInput[], steps?: FormStepInput[] }
- updateForm(eventId: string, data: CreateFormInput) → PUT /form/event/:eventId
- publishForm(formId: string) → POST /forms/:formId/publish
- deleteForm(formId: string) → DELETE /forms/:formId

FormFieldInput: { key, type, label, required, order, options?, validation? }
FormStepInput: { stepNumber, title, description?, fields: FormFieldInput[] }
```

**6c. Wire form builder save:**
```
In the form builder component (wherever fields are dragged/configured):
- Save button calls updateForm() with the current fields array
- Publish button calls publishForm() — show confirmation dialog first
- After publish: disable all editing (form is locked)
- Show toast on success/error
```

---

### STEP 7 — Submissions (Admin view)

```
Create lib/api/submissions.ts:

- getSubmissionsByEvent(eventId: string) → GET /forms/admin/events/:eventId/submissions → { total, items }
- getSubmissionById(submissionId: string) → GET /forms/admin/submissions/:submissionId → FormSubmission

Refactor app/dashboard/event/[id]/page.tsx submissions table:
- Replace mock submissions with real API data
- Show answer values per field (valueText, valueNumber, valueBoolean, valueFile)
- Link to file URL if valueFile is set
```

---

### STEP 8 — Public Form Page (`app/form/[slug]/page.tsx`)

This is the visitor-facing flow. It has 6 sequential API calls.

**Prompt for Antigravity:**
```
Create app/form/[slug]/page.tsx — the public form submission page.

"use client". Params: { slug: string }

State machine (use a step enum):
  LOADING → READY → STARTED → SUBMITTED | ERROR

On mount:
1. GET /forms/:slug (publicClient) → load form + event data
2. Generate or retrieve visitor UUID:
   - Check sessionStorage for "visitor_uuid"
   - If not found: generate with crypto.randomUUID(), store in sessionStorage
3. POST /forms/:slug/visit with { visitor: { uuid } }

On "Start Form" button click:
4. POST /forms/:slug/start with { visitor: { uuid } }
5. Transition to STARTED state — show form fields

Auto-save draft (debounced, every 5s while typing):
6. POST /forms/:slug/draft with { visitor: { uuid }, answers: [...], contact: { email } }

On "Submit" button click:
7. POST /forms/:slug/submit with full answers payload
   answers format: [{ fieldId, fieldKey, valueText?, valueBoolean?, valueNumber?, valueFile? }]
8. Transition to SUBMITTED state — show success screen

For FILE type fields:
- On file select: POST /files/upload (multipart) with context=FORM_SUBMISSION, eventSlug, fieldKey
- Get back file.id, store as valueFile in answers array
- Show preview of uploaded file

Handle payment flow if event.paymentEnabled:
- After submit: show payment section (Razorpay integration — separate step)

Types from lib/types/api.ts. API functions from lib/api/submissions.ts.
```

**Create `lib/api/submissions.ts` (public side):**
```
Create the public submission functions in lib/api/submissions.ts:

- loadPublicForm(slug: string) → GET /forms/:slug (publicClient)
- recordVisit(slug: string, visitorUuid: string) → POST /forms/:slug/visit (publicClient)
- startSubmission(slug: string, visitorUuid: string) → POST /forms/:slug/start (publicClient)
- saveDraft(slug: string, data: DraftData) → POST /forms/:slug/draft (publicClient)
- getDraft(slug: string, visitorUuid: string) → GET /forms/:slug/draft?visitorUuid= (publicClient)
- submitForm(slug: string, data: SubmitData) → POST /forms/:slug/submit (publicClient)

DraftData: { visitor: { uuid }, answers: AnswerInput[], contact: { email?: string } }
SubmitData: same as DraftData
```

---

### STEP 9 — File Uploads (`lib/api/files.ts`)

```
Create lib/api/files.ts:

- uploadFile(file: File, context: string, eventSlug?: string, fieldKey?: string, eventId?: string) → POST /files/upload
  IMPORTANT: Use FormData, NOT JSON. Do NOT set Content-Type header (browser sets boundary automatically).
  Returns: FileAsset { id, url, name, mimeType, size }

- getFile(fileId: string) → GET /files/:fileId → FileAsset
- deleteFile(fileId: string) → DELETE /files/:fileId

The upload function must:
  const formData = new FormData();
  formData.append("file", file);
  formData.append("context", context);
  if (eventSlug) formData.append("eventSlug", eventSlug);
  if (fieldKey) formData.append("fieldKey", fieldKey);
  
  Then fetch WITHOUT Content-Type header — let browser set multipart boundary.
```

---

### STEP 10 — Analytics (`app/dashboard/event/[id]/analytics/`)

```
Create lib/api/analytics.ts:
- getEventAnalytics(eventId: string) → GET /analytics/events/:eventId → EventAnalytics

Refactor the analytics page to:
- Load real analytics data on mount
- Show funnel: Visits → Started → Submitted with conversion %
- Use recharts BarChart (already installed) for the daily analytics chart
- Show conversion rate as a circular progress or stat card
```

---

### STEP 11 — Certificates & Messages

```
Create lib/api/certificates.ts:
- generateCertificates(submissionIds: string[]) → POST /certificates/generate
- verifyCertificate(certificateId: string) → GET /certificates/verify?certificateId=

Create lib/api/messages.ts:
- sendMessage(data: { contactId, type, template, eventId }) → POST /messages/send
- getMessages() → GET /messages/

Wire up:
- Generate certificates button in event submissions view → calls generateCertificates([...selectedIds])
- Send message button → calls sendMessage()
- Show toast on queue success ("Certificates are being generated...")
```

---

## Part 4 — Environment Setup

Create `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

For production:
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
```

> `NEXT_PUBLIC_` prefix is required for Next.js to expose the variable to the browser.

---

## Part 5 — Common Gotchas & How to Handle Them

### 1. File upload — DON'T set Content-Type
```typescript
// ❌ WRONG — breaks multipart boundary
headers: { "Content-Type": "multipart/form-data" }

// ✅ CORRECT — browser sets it automatically with boundary
const res = await fetch(url, { method: "POST", body: formData })
// No Content-Type header at all
```

### 2. Visitor UUID — generate once, persist in sessionStorage
```typescript
function getOrCreateVisitorUuid(): string {
  let uuid = sessionStorage.getItem("visitor_uuid");
  if (!uuid) {
    uuid = crypto.randomUUID();
    sessionStorage.setItem("visitor_uuid", uuid);
  }
  return uuid;
}
```

### 3. Form answers — match the exact field type
```typescript
// For TEXT, EMAIL, TEXTAREA, SELECT, RADIO:
{ fieldId, fieldKey, valueText: "user's answer" }

// For NUMBER, RANGE:
{ fieldId, fieldKey, valueNumber: 42 }

// For CHECKBOX:
{ fieldId, fieldKey, valueBoolean: true }

// For FILE (after upload):
{ fieldId, fieldKey, valueFile: "uuid-returned-from-upload-endpoint" }
```

### 4. Event status mapping — backend sends UPPERCASE
```typescript
// Backend: "DRAFT" | "ACTIVE" | "CLOSED"
// Your badge colors expect lowercase
const statusLabel = event.status.toLowerCase() // "draft" | "active" | "closed"
```

### 5. Published form is locked — disable builder UI
```typescript
const isLocked = !!form.publishedAt;
// Disable all field editing, drag-drop, and save when isLocked === true
```

### 6. JWT persistence across page reloads
```typescript
// On app load (layout.tsx or useAuth hook):
const token = localStorage.getItem("token");
if (token) {
  // Verify token is still valid by calling /auth/me
  // If 401: clear token, redirect to /login
}
```

### 7. CORS — make sure backend allows frontend origin
In backend `.env`:
```
ALLOWED_ORIGINS=http://localhost:3001,http://localhost:3000
```
(Change the frontend port to match `next dev` — usually 3001 if backend is on 3000)

---

## Part 6 — Suggested Antigravity Prompting Tips

**Tip 1 — Always give file context:**
```
"Open app/dashboard/events/page.tsx. I want to replace the hardcoded 'events' array 
with a real API call to GET /events/ using lib/api/events.ts. Keep all existing UI."
```

**Tip 2 — Reference the types file:**
```
"Use the Event type from lib/types/api.ts. The status field is 'DRAFT' | 'ACTIVE' | 'CLOSED' (uppercase)."
```

**Tip 3 — Tell it what NOT to do:**
```
"Do not use Next.js server actions, server components, or getServerSideProps. 
This is a pure client-side fetch with useEffect."
```

**Tip 4 — Iterate on one file at a time:**
```
"Only change app/dashboard/page.tsx. Don't touch lib/ files."
```

**Tip 5 — Ask for error handling explicitly:**
```
"Add try/catch around the API call. Show a sonner toast on error with the error.message. 
Show a loading skeleton while fetching."
```

---

## Part 7 — Integration Checklist

Copy this into your notes and tick off as you go:

```
Phase 1 — Foundation
  [ ] .env.local created with NEXT_PUBLIC_API_URL
  [ ] lib/api/client.ts (base fetch wrapper)
  [ ] lib/types/api.ts (all TypeScript types)

Phase 2 — Auth
  [ ] lib/api/auth.ts
  [ ] lib/hooks/useAuth.ts
  [ ] app/login/page.tsx
  [ ] app/signup/page.tsx
  [ ] components/auth-guard.tsx (protect dashboard)
  [ ] Redirect "/" → "/login" if not authenticated

Phase 3 — Events
  [ ] lib/api/events.ts
  [ ] app/dashboard/page.tsx (real data)
  [ ] app/dashboard/events/page.tsx (real data)
  [ ] app/dashboard/create-event/page.tsx (real submit)

Phase 4 — Forms
  [ ] lib/api/forms.ts
  [ ] Form builder save + publish wired up
  [ ] Form locked state when publishedAt is set

Phase 5 — Public Flow
  [ ] lib/api/submissions.ts (public)
  [ ] lib/api/files.ts (upload)
  [ ] app/form/[slug]/page.tsx (full visitor flow)

Phase 6 — Admin Submissions
  [ ] lib/api/submissions.ts (admin)
  [ ] Submissions table in event detail page

Phase 7 — Analytics
  [ ] lib/api/analytics.ts
  [ ] Analytics page wired up

Phase 8 — Extras
  [ ] lib/api/certificates.ts
  [ ] lib/api/messages.ts
  [ ] Generate certificates button
  [ ] Send message button
```
