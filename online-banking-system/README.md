# Online Banking System

Full-stack implementation of the project documented in Exp-1 through Exp-7
(SRS, WBS, DFD, ER Diagram, State Transition Diagram, Class/Use Case Diagrams,
Sequence/Communication Diagrams).

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | React 18 + Tailwind CSS + React Router |
| Backend | Node.js + Express.js, REST API |
| Auth | JWT session tokens, bcrypt-hashed passwords/MPINs |
| ORM | Sequelize |
| Database (this build) | SQLite — zero setup, a file on disk |
| Database (production target, per SRS) | MySQL — see "Switching to MySQL" below |

## Project status

**Phase 1 is complete, backend and frontend both** — every module has a
working API *and* a working, browser-verified UI, not just one or the other.

### Backend (`/backend`)

- Complete database schema — all 13 tables from the Exp-4 ER Diagram, with
  every relationship (including the Customer&ndash;Account many-to-many,
  resolved via the `AccountHolder` association class)
- **Authentication module** (`/api/auth/*`) — two-factor login (password +
  OTP), JWT issuance, account lockout after 5 failed attempts (SRS F6),
  role-based access, MPIN set/update (SRS F7), forgot/reset-password (SRS F8)
- **Dashboard / Accounts module** (`/api/accounts/*`, `/api/profile`) —
  lists every account a customer holds (correctly handling joint accounts),
  ownership enforcement, transaction history with filters (SRS F12),
  downloadable CSV e-statement (SRS F13), profile view/update (SRS F11),
  last-login timestamp (SRS F14)
- **Beneficiary Management module** (`/api/beneficiaries/*`) — add/list/
  edit/delete, duplicate rejection (SRS F19), **lazy cooling-period
  activation** (SRS F16) — no background job needed
- **Fund Transfer module** (`/api/transfers/*`) — the exact flow designed
  across Exp-3/5/7: own-account and third-party (NEFT/RTGS/IMPS) transfers,
  RTGS minimum-amount rule, per-beneficiary limits, MPIN confirmation,
  atomic debit/credit, simulated Core Banking posting with a tested
  rollback path. **A real replay-attack bug was found and fixed during
  testing**: a stateless signed token could be resubmitted to move money
  more than once; replaced with a persisted `Pending` transaction whose own
  status is the single-use guard.
- **Bill Payments & Recharge module** (`/api/bills/*`) — saved billers
  (SRS F29), pay a saved biller or recharge directly with no saved biller
  (SRS F30&ndash;F31), same MPIN-gated initiate/confirm pattern as Transfer,
  filterable payment history (SRS F33)
- **Deposits module** (`/api/deposits/*`) — open a Fixed or Recurring
  Deposit (SRS F34&ndash;F35), automatic maturity-date/amount calculation
  (SRS F36), premature closure with a penalty (SRS F37), **lazy maturity
  crediting** on read (SRS F39). **Resolves two items the SRS (Exp-1,
  Appendix C) explicitly left as TBD**: TBD-1 (interest-rate table by
  tenure band) and TBD-2 (premature-closure penalty), both now concrete,
  documented policies in `deposit.service.js`
- Full audit logging (`activity_logs`) and simulated OTP delivery /
  Core Banking posting, shared via `cbsSimulator.js`
- Seed data: 1 admin, 3 customers, 3 accounts (including one **joint
  account** held by two customers), 2 beneficiaries, sample transaction,
  deposit, and notification

### Frontend (`/frontend`)

A React 18 + Tailwind UI covering all six modules above:

- **Login &rarr; OTP &rarr; Dashboard** &mdash; two-factor auth flow, with the OTP
  shown on screen in a clearly labeled "demo mode" banner (no live SMS/email
  gateway is connected, per the SRS's Version 1.0 scope)
- **Dashboard** &mdash; every account the customer holds, joint accounts
  correctly shown with each holder's own role, total balance summary
- **Account Detail** &mdash; filterable transaction history, CSV statement
  download
- **Profile** &mdash; read-only KYC fields, editable contact details, MPIN
  set/update
- **Beneficiaries** &mdash; add/edit/remove, live status badges (Pending
  Activation / Active)
- **Transfer Funds** &mdash; own-account and third-party transfer, with a
  shared MPIN confirmation modal
- **Bill Payments & Recharge** &mdash; saved billers, pay-or-recharge form,
  payment history
- **Deposits** &mdash; open FD/RD, view maturity details, premature closure

**How the frontend was verified** (not just "it builds"): a real headless
Chromium browser was used to click through the actual running app
end-to-end &mdash; logging in, extracting the on-screen OTP, verifying it, and
navigating every page &mdash; then a second pass drove an actual fund transfer
through the MPIN modal and confirmed a real success response with a
reference number. Two genuine bugs were caught this way and fixed before
delivery:

1. **A widespread Unicode-escape bug** (45 occurrences across 10 files):
   `\u2014` and similar JS-style escapes only get interpreted inside real
   JavaScript string expressions; used directly in JSX text or attributes
   (e.g. `placeholder="\u2022\u2022\u2022"`) they render as literal
   backslash-escape text instead of the intended character. Fixed by
   replacing every occurrence with the actual Unicode character.
2. **A Tailwind class-conflict bug**: shared components (`Card`,
   `PrimaryButton`, `SecondaryButton`) hard-coded a default background/text
   color, and a caller's override (e.g. `bg-navy text-white` on the
   dashboard's total-balance card) didn't reliably win, since Tailwind's
   CSS cascade order doesn't follow `className` string order. Fixed with
   `tailwind-merge`, which resolves conflicting utility classes correctly.

### Scaffolded (table exists) but no routes/business logic or UI yet — Phase 2

Loans, Cards, Service Requests, full Notification preferences, Admin console.

### Frontend quick start

```bash
cd frontend
npm install
npm run dev      # starts the UI on http://localhost:5173
```

Make sure the backend is also running (`cd backend && npm run dev`) and
has been seeded (`npm run seed`), since the frontend talks to it at
`http://localhost:4000/api` by default (see `frontend/.env`). Log in with
any of the seeded demo accounts shown on the login screen.

### Backend API reference

| Method & Path | Auth | Purpose |
|---|---|---|
| `POST /api/auth/login` | No | Step 1: username + password &rarr; issues an OTP |
| `POST /api/auth/verify-otp` | No | Step 2: username + otp &rarr; issues a JWT |
| `POST /api/auth/forgot-password` | No | Requests an OTP to reset a forgotten password |
| `POST /api/auth/reset-password` | No | username + otp + newPassword &rarr; resets it |
| `POST /api/auth/logout` | Yes | Logs the logout event |
| `GET /api/auth/me` | Yes | Current user + Customer profile (if any) |
| `POST /api/auth/mpin` | Yes, customer | Set/update MPIN |
| `GET /api/accounts` | Yes, customer | List every account held (any role) |
| `GET /api/accounts/:id` | Yes, customer | Single account detail (ownership-checked) |
| `GET /api/accounts/:id/transactions` | Yes, customer | History; query params `from`, `to`, `type` |
| `GET /api/accounts/:id/statement` | Yes, customer | Downloads a CSV e-statement |
| `GET /api/profile` | Yes, customer | Read-only profile + last login time |
| `PUT /api/profile` | Yes, customer | Update contact fields only |
| `GET /api/beneficiaries` | Yes, customer | List (auto-promotes matured "Pending" ones to "Active") |
| `POST /api/beneficiaries` | Yes, customer | Add a beneficiary (starts "Pending Activation") |
| `PUT /api/beneficiaries/:id` | Yes, customer | Edit nickname / transfer limit |
| `DELETE /api/beneficiaries/:id` | Yes, customer | Soft-delete |
| `POST /api/transfers/initiate` | Yes, customer | Validate a transfer; returns a `transactionId` (status `Pending`) |
| `POST /api/transfers/confirm` | Yes, customer | `{transactionId, mpin}` &rarr; executes the transfer |
| `GET /api/transfers/:id` | Yes, customer | Fetch a specific transaction (ownership-checked) |
| `GET /api/bills/billers` | Yes, customer | List saved billers |
| `POST /api/bills/billers` | Yes, customer | Add a saved biller |
| `DELETE /api/bills/billers/:id` | Yes, customer | Remove a saved biller |
| `POST /api/bills/pay/initiate` | Yes, customer | `{sourceAccountId, amount, billerId?}` &rarr; `billerId` omitted = direct recharge |
| `POST /api/bills/pay/confirm` | Yes, customer | `{transactionId, mpin}` &rarr; executes the payment |
| `GET /api/bills/pay/history` | Yes, customer | Query params `from`, `to`, `billerId` |
| `GET /api/deposits` | Yes, customer | List (auto-matures deposits past their maturity date) |
| `POST /api/deposits` | Yes, customer | Open a new FD/RD; debits the linked account immediately |
| `GET /api/deposits/:id` | Yes, customer | Single deposit detail |
| `POST /api/deposits/:id/close` | Yes, customer | Premature closure; credits penalized proceeds |

Since there's no live SMS/email gateway, `/login` and `/forgot-password`
return the OTP directly in the response as `devOtp`.

**Quick end-to-end test (bill payment + deposit):**

```bash
# 1+2. Login and verify OTP as before, to get a token

# Pay a saved biller
curl -X POST http://localhost:4000/api/bills/pay/initiate \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"sourceAccountId":1,"billerId":1,"amount":1500}'
curl -X POST http://localhost:4000/api/bills/pay/confirm \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"transactionId":2,"mpin":"1234"}'

# Open an 18-month FD (interest rate resolved automatically from the tenure band)
curl -X POST http://localhost:4000/api/deposits \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"accountId":1,"depositType":"FD","principalAmount":10000,"tenureMonths":18}'
```

## Setup

Requires Node.js 18+.

```bash
cd backend
npm install
npm run seed      # creates data/obs.sqlite and loads sample data
npm run dev        # starts the API on http://localhost:4000
```

Verify it's running:

```bash
curl http://localhost:4000/api/health
# {"status":"ok","database":"sqlite","time":"..."}
```

### Sample login credentials (after seeding)

| Role | Username | Password | MPIN | Note |
|---|---|---|---|---|
| Admin | `admin` | `Admin@123` | — | |
| Customer | `priya` | `Customer@123` | `1234` | Single account |
| Customer | `arjun` | `Customer@123` | `4321` | Joint account + solo current account |
| Customer | `kavya` | `Customer@123` | `5678` | Joint account holder (with Arjun) |

### Switching to MySQL

The Sequelize model files never change. Set these in `backend/.env`:

```
DB_DIALECT=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=online_banking_system
DB_USER=your_user
DB_PASSWORD=your_password
```

Then create the database (`CREATE DATABASE online_banking_system;`) and run
`npm run seed` again. For a real production deployment, replace the
`sequelize.sync()` call in `src/server.js` with versioned Sequelize
migrations — `sync()` is a dev-stage convenience, not a migration strategy.

## Project structure

```
backend/
  src/
    config/database.js       # SQLite/MySQL connection switch
    models/                  # 13 Sequelize models + associations (index.js)
    middleware/               # JWT auth, role guard, error handler
    utils/                    # hashing, JWT, OTP, activity logger,
                                #   customer lookup, MPIN lockout, CBS simulator
    services/
      auth.service.js         # login, OTP verify, MPIN, password reset
      accounts.service.js      # dashboard, transactions, statement, profile
      beneficiary.service.js   # add/list/edit/delete, lazy activation
      transfer.service.js      # initiate/confirm, atomic debit-credit, simulated CBS
      biller.service.js        # saved billers
      bill.service.js          # pay/recharge initiate-confirm, history
      deposit.service.js       # open FD/RD, lazy maturity, premature closure
    controllers/               # thin HTTP layer over each service
    routes/
      health.routes.js
      auth.routes.js
      accounts.routes.js
      profile.routes.js
      beneficiary.routes.js
      transfer.routes.js
      bill.routes.js
      deposit.routes.js
    app.js, server.js
  seed/seed.js

frontend/
  src/
    api/
      client.js               # axios instance, JWT header injection, 401 handling
      index.js                 # one function per backend endpoint, grouped by module
    context/AuthContext.jsx    # session state (login/verifyOtp/logout)
    components/
      Layout.jsx                # sidebar nav + header, wraps every authenticated page
      ProtectedRoute.jsx
      StatusBadge.jsx
      MpinModal.jsx             # shared confirm-with-MPIN dialog (Transfer + Bill Pay)
      ui.jsx                    # Card, PageHeader, buttons, banners, spinner
    pages/
      LoginPage.jsx, OtpPage.jsx
      DashboardPage.jsx, AccountDetailPage.jsx, ProfilePage.jsx
      BeneficiariesPage.jsx, TransferPage.jsx, BillsPage.jsx, DepositsPage.jsx
      NotFoundPage.jsx
    utils/format.js             # currency/date formatting
    App.jsx, main.jsx, index.css
```
