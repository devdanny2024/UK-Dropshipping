# API Contracts

All responses use:

```json
{ "ok": true, "data": {} }
```

or

```json
{ "ok": false, "error": { "code": "...", "message": "..." } }
```

## POST /v1/resolve-product
Request:
```json
{ "url": "https://shop.example/item" }
```
Response:
```json
{ "ok": true, "data": { "id": "...", "url": "...", "title": "...", "price": 55, "currency": "GBP" } }
```

## POST /v1/quotes
Request:
```json
{ "productSnapshotId": "...", "size": "M", "color": "Black", "qty": 2, "addressId": "addr_123" }
```
Response:
```json
{ "ok": true, "data": { "id": "...", "total": 67.7, "currency": "GBP" } }
```

## POST /v1/payments/webhook
Headers: `Idempotency-Key`
Request:
```json
{ "paymentRef": "pay_123", "orderId": "ord_123", "amount": 67.7, "currency": "GBP" }
```

## POST /v1/orders
Request:
```json
{ "quoteId": "...", "paymentRef": "pay_123" }
```

## GET /v1/orders
Response: list of orders.

## GET /v1/orders/:id
Response: order, items, events, shipments.

## Admin
- GET `/v1/admin/orders?status=`
- POST `/v1/admin/orders/:id/status`
- POST `/v1/admin/orders/:id/purchase-attempts` (Header: `Idempotency-Key`)
- POST `/v1/admin/shipments`

## GET /v1/health
Health check for load balancer.
