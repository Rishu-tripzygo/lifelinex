# LifelineX

Next.js site for LifelineX. The home page is the doctor-led concern selector. PCOS / PCOD / PMOS care lives at `/pcos`, including the 2-minute assessment, payment and booking. Staff manage everything from `/admin`.

Assessments, Cashfree payments, bookings and admin data are stored in PostgreSQL through Prisma.

## Pages

- `/` — home
- `/pcos` — PCOS consultation page, assessment and checkout
- `/payment/return` — Cashfree return page; a paid order continues to its booking page
- `/booking/<order id>` — the patient's booking: pick a slot, see the doctor and video link, add to calendar, reschedule. Opens automatically in the browser that paid; on another device the patient confirms the phone number they paid with.
- `/admin` — staff panel (sign-in required)

## Local setup

1. Copy `.env.example` to `.env`. Add your Cashfree sandbox App ID and secret key, and an `APP_SECRET` (`openssl rand -hex 32`).
2. Start Postgres: `docker compose up -d` (listens on `127.0.0.1:5433`, so it can't clash with a local Homebrew Postgres on 5432).
3. Install, create the tables (re-run `db push` after pulling schema changes) and create your first admin:

```bash
npm install
npx prisma db push
npm run admin:create -- you@example.com "Your Name" ADMIN
npm run dev
```

`admin:create` prints a generated password once (or uses `ADMIN_PASSWORD` if set). Running it again for the same email resets the password and signs that account out everywhere.

The consultation fee comes from `CONSULTATION_FEE_INR` (default ₹999) and is shown everywhere from that one value; rebuild after changing it.

## Booking

LifelineX books consultations itself (no Cal.com). After payment, the patient picks a slot from the clinic's opening hours:

- **Opening hours, slot length, parallel consultations, minimum notice, booking window and reschedule rules** are set in *Admin → Schedule*. Until an admin saves hours, Mon–Sat 10:00–13:00 and 14:00–18:00 IST is used.
- **Closures and leave** (*Admin → Schedule*) remove slots; existing bookings in that period are counted so staff can reschedule them.
- Double-booking is prevented by the database (unique slot + seat), so two people can't take the last seat at once.
- Patients can reschedule themselves up to the cutoff and limit you set; cancelling is staff-only (the fee is non-refundable). A cancelled booking frees its slot.
- Staff assign a **doctor** (name, qualification and registration number are shown to the patient) and paste the **video link** (https only) on the booking; the patient sees both on their booking page.
- There are no SMS/WhatsApp/email reminders yet — the booking page and calendar invite are the patient's confirmation. Set `ORDER_NOTIFY_WEBHOOK_URL` (Slack incoming webhook) to hear about every payment, booking and reschedule.

## Admin panel

- **Overview** — today's schedule, the next 7 days, revenue this month, and a *Needs attention* list (bookings in the next 48h without a doctor or link; paid patients who haven't picked a slot).
- **Bookings** — filter, search, open a booking to change status (completed / no-show / cancelled), assign a doctor, add the link and internal notes, or move it to another time (with an override for outside hours).
- **Payments** — every Cashfree order; book a slot on a patient's behalf from *Paid, not booked*.
- **Assessments** — answers in plain language. Opening one is recorded in the audit log.
- **Schedule, Doctors, Team, Audit log** — administrators only. Staff accounts can manage bookings, payments and assessments.

Sessions last 12 hours and are stored server-side (deactivating someone signs them out immediately). Sign-in is throttled per email and per IP.

## Security notes

- `NEXT_PUBLIC_APP_URL` (https) and `APP_SECRET` are required in production; checkout refuses to start without them.
- Patient access to a booking uses a signed cookie (`APP_SECRET`), so knowing an order id isn't enough to see or change someone's booking. Phone verification on a new device is rate limited.
- Public POST routes require JSON, cap body size, check a honeypot field and rate-limit per IP **in memory** (one server process). On multiple instances or serverless, move the limiter to a shared store such as Upstash Redis, and set `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY`.
- Assessments need explicit consent (`consentedAt`). Health answers are personal data under India's DPDP Act: publish the Privacy, Terms, Refund and Teleconsultation pages (footer links are placeholders) before going live — Cashfree also requires them for live activation.
- Security headers (CSP, frame blocking, referrer policy, HSTS in production) live in `next.config.ts`; add any new third-party script or embed there.
- The old public Cal.com link (`cal.com/doctor-pj77l1/30min`) is no longer used anywhere; delete or hide that event in Cal.com so it can't be booked directly.

## Cashfree

Set `CASHFREE_ENV=sandbox` with sandbox keys while testing. Checkout uses the Cashfree JS SDK. The return page confirms the order with Cashfree before sending the patient to their booking page.

For live webhooks, set `NEXT_PUBLIC_APP_URL` to your public `https` origin and subscribe that origin's `/api/payments/webhook` URL in the Cashfree dashboard (Payment Gateway → Developers → Webhooks). Localhost does not receive webhooks; the return page still confirms payment.
