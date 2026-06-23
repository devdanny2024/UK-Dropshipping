# UK2ME — End-to-End Test Plan

**Purpose:** A step-by-step manual QA you can run in the browser to verify the whole
ecommerce flow works, customer + admin. Each step lists **Do / Expect / Why** (Why =
the thing it proves, often a recently-fixed item). Run the customer and admin journeys
side by side in two browsers (or normal + incognito) since you act as both.

**Updated:** 11 June 2026 (covers the audit-fix waves: US/USD, weight postage, invoice
display, order lifecycle, payments/wallet, complaints).

---

## 0. Setup

| What | Value |
|------|-------|
| Storefront (customer) | https://uk-dropshipping-client.vercel.app |
| Admin (staff) | https://uk2meonline-admin.vercel.app |
| Admin login | your `ADMIN_EMAIL` / `ADMIN_PASSWORD` (env). `soliupeter@gmail.com` is currently the bootstrapped **SUPER_ADMIN**. |
| Backend health | `https://<backend>/api/v1/health` → `200` (sanity) |

**Test accounts:** create a throwaway customer (real email you can open, to read
notification mails). Use a second email for a "staff" account when testing roles.

**Payment mode:** the gateway is in **demo/test mode**. End-to-end you'll use the
**"Simulate Payment"** button, which settles the order without moving money. Real
Paystack/Stripe only fire if live keys are configured — treat a missing real charge as
*expected*, not a bug.

---

## 1. Customer journey A — UK order (the happy path)

| # | Do | Expect | Why |
|---|----|--------|-----|
|1.1| Sign up with a new email | "Check your email to verify" screen; verification email arrives | Signup + email send |
|1.2| Click the verify link | Account verified, can log in | Email verification |
|1.3| Paste a **UK** product link (e.g. an ASOS/Amazon UK URL) on the home/preview page | Product resolves: title, image, **£** price | Adapter resolve + UK currency |
|1.4| Add to cart | Cart drawer slides in; price shown in **£**, no weird conversion | Region basket = UK |
|1.5| Open cart, set quantity/size/color if available | Size/color retained on the line | **size/color now persisted** |
|1.6| Go to checkout, fill the Nigerian delivery address, pick **door** or **pickup** | Totals in **£**; door fee applied | Checkout |
|1.7| Place order | Lands on order/pay screen; order created | Order creation |
|1.8| **Before paying**, look for the **Delivery Note** | A despatch date (a **Thursday**) + a Lagos delivery window + 2 legs is shown **before** the pay buttons | **Delivery Note now shown pre-payment** |
|1.9| Note the order status | A status **timeline** shows **Placed** lit up | Always-on timeline |
|1.10| Click **Simulate Payment** | Order flips to **Processing**; payment-confirmed email arrives | Payment settle + email |

> At this point an **admin order-placed email** (with the product link) should also have
> arrived at the admin inbox — check it.

---

## 2. Customer journey B — US order (currency check)

| # | Do | Expect | Why |
|---|----|--------|-----|
|2.1| In the cart, note your current region is **UK**. Try to add a **US** store link (USD product) | You're warned the basket will switch/empty (can't mix UK£ + US$) | Region-mixing guard |
|2.2| Confirm the switch, add the US item | Basket now shows **$ / USD**, price is the **native USD** value (not a GBP-converted number) | **US items now native USD (fixed)** |
|2.3| Checkout → place order | Order stored as **region US, currency USD**; totals in **$** | US order is real |
|2.4| On the pay screen, read the gateway labels | **Stripe** button shows **(USD)** not "(GBP)"; the **Paystack/NGN** line shows the Naira equivalent (USD→NGN converted) | **Stripe label fixed; USD settles in NGN** |
|2.5| Simulate Payment | Order → Processing | US order is payable |

---

## 3. Customer journey C — item that needs a manual weight price

| # | Do | Expect | Why |
|---|----|--------|-----|
|3.1| Add an item whose category has **no weight class** (or paste a link with no resolvable weight) and check out | Order places fine (never blocked) | R9 auto-detect, best-effort |
|3.2| On the order page, find the **Weight-based pricing** card | The item shows **"Price pending"** (auto-flagged), not an active button | **auto weight-price request** |
|3.3| (Admin sets the price — see 6.4) then refresh | Item shows **"Ready to pay"**; the order can now be invoiced/paid | Weight loop closes |

---

## 4. Customer journey D — wallet (store credit)

| # | Do | Expect | Why |
|---|----|--------|-----|
|4.1| (Admin issues a wallet credit — see 6.6.) Open **Wallet** in your account | Balance shows the credited amount in the right currency (£ or $) | Wallet credit + ledger |
|4.2| Pay an invoice that's smaller/larger than the balance | "Apply credit" reduces what the gateway charges; you only pay the remainder | Wallet apply (server-capped) |
|4.3| Fully cover an order with wallet credit | Order → Processing, invoice → Paid, no gateway step | Wallet full-cover |

---

## 5. Customer journey E — complaint

| # | Do | Expect | Why |
|---|----|--------|-----|
|5.1| On a placed order, **Raise a complaint** (reason + detail) | Confirmation; complaint appears in the list as **OPEN** | **complaint list now renders (fixed)** |
|5.2| (Admin resolves it — see 6.7) refresh | Status changes (Under review → Resolved/Rejected); you get an email each step | Complaint lifecycle |

---

## 6. Admin journey

Log in at the admin URL with your admin credentials.

| # | Do | Expect | Why |
|---|----|--------|-----|
|6.1| Log in | Lands on the dashboard; session persists on refresh | **per-user admin auth (new)** |
|6.2| Open **Orders** → the order from §1 | See items, address, **product link**, status, events | Order detail |
|6.3| **Build invoice** | Line items grouped by store; fee fields pre-filled; **a warning banner appears if any fee line is £0** | **invoice builder + zero-fee warnings (new)** |
|6.4| Check the **Nigeria postage** line on the draft | Non-zero, computed from item **weight × NGN/kg** (FX-converted), unless the item needed a manual price | **weight-based postage (new)** |
|6.4b| For a §3 weight-pending item: open **Weight Price Requests**, set the manual delivery price | Item becomes **PRICED**; customer emailed "now payable" | Manual weight resolve |
|6.5| **Send invoice** | Order → **Invoiced (pending)**; customer gets the invoice email with the **full breakdown** (line items + every fee row visible) | **invoice display fixed** |
|6.6| On an order, **issue a wallet credit** (out-of-stock scenario) | Customer balance rises; they're emailed | Wallet credit (R13) |
|6.7| Open **Complaints**, take one Under review → Resolve with a note | Customer emailed each transition | Complaint admin flow |
|6.8| Back on the order, **Mark dispatched**: enter **Delivery Company + Tracking ID** | Refuses without both; with them → status **Shipped**, customer emailed the tracking | Dispatch (R12) |
|6.9| Use the **status control** to move the order **Shipped → Delivered** | Status updates; timeline completes; the customer's timeline shows **Delivered** | **status UI + lifecycle completion (new)** |
|6.10| Try an **invalid** jump (e.g. Delivered → Placed) | Rejected ("invalid transition") | **transition validation (new)** |
|6.11| Open **Roles**, promote your second account to **ADMIN**, then log in as it | It can now reach the admin panel; a non-admin cannot | **role management (R15)** |
|6.12| As that admin, try to change a role | Refused unless **SUPER_ADMIN**; you cannot demote the last admin or yourself | Role guards |

---

## 7. Negative / edge checks (quick)

- Checkout with an **empty cart** → blocked.
- Add a US item to a UK basket without confirming → **prevented** (no silent mix).
- Place an order, then as a *different* customer try to open `…/orders/<that id>` → **404/denied** (ownership).
- Invoice an order that still has a **weight-pending** item → **blocked** until priced.
- Dispatch **without** tracking → **rejected**.

---

## 8. Known limitations to expect (NOT bugs)

- **Payments are demo/test mode** — use **Simulate**; real Paystack/Stripe need live keys.
- **Fee figures** (service charge, transfer fee, store→warehouse fees, domestic postage)
  default to **0 / 800 NGN-per-kg** until you set them in **Admin → Settings**. Invoices
  will warn you when a line is 0 — set the real numbers there.
- **Unverified users can still transact** in a session (verification is not yet enforced
  on actions) — hardening pending.
- A genuine **end-to-end real-money charge** is the one thing this plan can't prove in
  demo mode; confirm it once live keys are in.

---

## 9. Fast API smoke (optional, no browser)

Against the backend (replace `<backend>`):

```
GET  /api/v1/health                         → 200
POST /api/v1/admin/auth/login {email,password}  → 200 + Set-Cookie + role:SUPER_ADMIN
GET  /api/v1/admin/orders        (no cookie) → 401
GET  /api/v1/admin/orders        (with cookie) → 200
POST /api/v1/checkout            (no session) → 401
```

A green run here means the backend, auth, and DB are healthy before you click through.
