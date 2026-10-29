# MaxHub ERP v2 — brands, documents, calls, careers

Everything new lives in `src/erp/` and is mounted from `src/routes/index.ts` and `src/app.ts`.

## What runs on startup (safe, idempotent)
`runErpMigrations()` — recorded in table `erp_migrations`, never touches users, passwords, roles or staff:
1. Creates new tables only (`erp_*`).
2. Head Office branch (uses your first existing branch if you already have one).
3. Brands as departments: VM (VisaMax), KS (Kurios SAT) + KS-ICT / KS-TRN, BM (BeadMax) + BM-DSN / BM-VOC, MF (Maxfood Farm). Existing KS/VM/BM rows are reused as-is.
4. Adds `MF` to the job-posting business-unit enum.
5. Starter terms, policies and agreements per brand (edit them in Documents & Agreements; have them legally reviewed).
6. Chat channels: 📢 MaxHub General, 🏢 one per department, 📍 one per branch — membership re-synced on login.

7. Old VisaMax applications (`visa_applicant`) are copied once into Customers & Applications (old table untouched).

Set `ERP_MIGRATIONS=off` to skip, `ERP_SCHEDULER=off` to disable the ERP cron jobs.

## Roles
- Super Admin (CEO, developer): everything, including approving their own requests.
- Admin (Manager, Directors, Head Admin, Head HR): everything except approving/rejecting their own leave, overtime, weekly report, salary, promotion, appraisal, resignation, or publishing their own job posting / training (`src/erp/approvalGuard.ts`).
- HOD: records of the departments they head (Department.headUserId) or belong to.
- Staff: their departments' records plus anything assigned to / created by them. Staff not yet linked to a department see all brands (current setup: everyone works across all brands).

## API (all under `/api`)
Authenticated (`/api/erp/...`):
- `GET /erp/brands`, `PUT /erp/brands/:code`
- Records with list/search/filter, create, edit, stage pipeline, notes, customer message (Email/WhatsApp), delete:
  `/erp/travel/cases`, `/erp/travel/bookings`, `/erp/kurios/projects`, `/erp/kurios/subscriptions`, `/erp/support/tickets`, `/erp/beadmax/custom-orders`, `/erp/maxfood/products`, `/erp/maxfood/orders`
  - `PATCH /:id/stage`, `POST /:id/activities`, `POST /:id/message`
  - VisaMax extras: `PATCH /erp/travel/cases/:id/checklist`, `POST /erp/travel/cases/:id/onboard`, `POST /erp/travel/cases/:id/regenerate-checklist`
- Payments & receipts: `GET|POST /erp/payments`, `PATCH /erp/payments/:id/void`, `GET /erp/payments/:id/receipt`
- Documents: `GET|POST|PUT|DELETE /erp/documents/templates`, `GET|POST /erp/documents/requests`, `POST /erp/documents/requests/:id/resend`, `PATCH /erp/documents/requests/:id/cancel`
- `GET /erp/reports/weekly-summary`, `POST /erp/channels/sync`, `GET /erp/calls/ice`

Public (no login, rate-limited, open CORS):
- Careers: `GET /public/jobs?brand=VM`, `GET /public/jobs/:code`, `POST /public/jobs/:code/apply`
- Website widget: `<div id="maxhub-careers"></div><script src="https://maxhub-backend.onrender.com/api/public/jobs/widget.js?brand=VM"></script>` (brand = VM, KS, BM or MF; optional `&color=%23c8102e`)
- Policies: `GET /public/policies?brand=BM`
- Signing: `GET|POST /public/sign/:token`
- Tracking: `GET /public/track/:code?contact=<email or last 4 phone digits>`

## Live updates
Socket.IO events: `notification:new` (bell), `erp:changed` (screens refresh), `call:*` (voice/video).

## Scheduled jobs (Africa/Lagos)
- Mon 07:30 weekly-report reminder · Mon 08:00 business summary to Super Admin/Admin · Mon 12:00 missing-report escalation to HODs/Admin/HR
- Daily: service renewals (30/7/1/0 days), passport expiry (6-month rule), unsigned-document follow-ups, ticket SLA breaches (every 30 min)
- Weekly reports now belong to the most recent Friday, so a Monday-morning submission covers the week that just ended.

## Environment variables (optional)
| Variable | Purpose |
|---|---|
| `FRONTEND_URL` | Base URL used in signing links (default `https://www.maxhubng.company`) |
| `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID` | Send WhatsApp automatically via the WhatsApp Business Cloud API. Without them, staff get a one-click wa.me link with the message pre-filled. |
| `BRAND_VM_SMTP_USER`, `BRAND_VM_SMTP_PASS` (same for `KS`, `BM`, `MF`) | Send customer emails from the brand mailbox (e.g. info@visamaxtravels.com). Otherwise the shared mailbox sends with the brand email as Reply-To. |
| `TURN_URL`, `TURN_USERNAME`, `TURN_CREDENTIAL` | TURN relay for calls across strict mobile networks (STUN is used by default). |
| `ERP_TIMEZONE` | Defaults to `Africa/Lagos`. |

## Local testing
`DB_SSL=false` lets the app use a local non-SSL Postgres. `src/seeders/local-test-sync.ts` builds a blank local schema + test users and refuses to run against a non-local database.

## Merged features
- Weekly Reports = staff weekly reports + business summary tab (`/hr/weekly-report?tab=summary`; `/reports/weekly` redirects).
- VisaMax: old VisaMax hub and CRM Business Hub redirect to Customers & Applications / Brands.
- Meetings & Calls: scheduled Google Meet meetings + instant in-app calls from Messages.
- Finance menu: Payments & Receipts, Invoices, Student Fee Receipts.
- Customer Reports can be created from any brand record (pre-filled draft, same approval flow).
- Bulk messaging (Communication → Send Message) uses the real WhatsApp sender; job sync only pushes to sites that have an API key configured.
