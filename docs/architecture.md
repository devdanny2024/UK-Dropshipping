# Architecture

## Services
- Client (Next.js): customer-facing flows for product preview, quotes, payments, and order tracking.
- Admin (Next.js): operational views for orders, purchase attempts, and shipments. Protected by cookie-based middleware stub.
- Backend (Next.js API-only): REST endpoints, Prisma data model, BullMQ queues.

## Data Flow
1) Client posts a product URL to `/v1/resolve-product` to create a `ProductSnapshot`.
2) Client requests a quote with selections via `/v1/quotes`.
3) Client submits payment (mocked) and creates an order via `/v1/orders`.
4) Admin uses `/v1/admin` endpoints for status updates, purchase attempts, and shipments.
5) BullMQ workers process `resolveProduct`, `purchaseAttempt`, and `trackShipment` jobs.

## Storage
- PostgreSQL for transactional data (Prisma).
- Redis for queues and idempotency-driven jobs.

## Auth
Cookie-based admin session (`admin_session`) stubbed in admin middleware and backend admin endpoints.
TODO: replace with real auth and RBAC.
