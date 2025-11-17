# PayMongo API Controller Implementation Guide

This document explains how to introduce a PayMongo-focused API controller layer inside the Next.js App Router so every REST action is represented by its own `route.ts` file. Follow it as a blueprint for the coding pass.

## Goals & Constraints
- Centralize every PayMongo call under `src/app/api/paymongo/**` so payments, methods, refunds, etc. live in their own folders for easy scanning and isolated testing.
- Keep PayMongo credentials outside the repo. `.env.local` must define:
  - `PAYMONGO_SECRET_KEY` (server-only)
  - `NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY` (client-safe, for initializing JS SDK / Elements if needed)
- Only server routes can touch `PAYMONGO_SECRET_KEY`. Any client-triggered action should call a Next API handler.
- All fetches must comply with https://developers.paymongo.com docs linked in the task description.

## Directory Layout
Create the following structure (files with `*` are new helpers, others are request handlers):

```
src/
  lib/
    paymongo/
      constants.ts *           # base URL, resource paths, header helpers
      client.ts *              # `paymongoRequest<T>()` wrapper w/ auth + retries
      schemas.ts *             # zod validators for every payload (shared by routes)
      transformers.ts *        # helper to map PayMongo JSON API -> camelCase objects
      errors.ts *              # typed errors + formatter for `NextResponse`
      webhook.ts *             # signature verification + event typing
  app/
    api/
      paymongo/
        payment-intents/
          create/route.ts
          [intentId]/route.ts
          [intentId]/attach/route.ts
          [intentId]/cancel/route.ts (optional but documented)
        payment-methods/
          create/route.ts
          [paymentMethodId]/route.ts
          [paymentMethodId]/update/route.ts
        payments/
          [paymentId]/route.ts
          list/route.ts
          sources/[sourceId]/route.ts
        refunds/
          create/route.ts
          [refundId]/route.ts
          list/route.ts
        customers/
          create/route.ts
          [customerId]/route.ts
          [customerId]/update/route.ts
          [customerId]/delete/route.ts
          [customerId]/payment-methods/route.ts
          [customerId]/payment-methods/[paymentMethodId]/delete/route.ts
        gcash/
          deeplink/route.ts
        webhooks/
          paymongo/route.ts
```

> NOTE: App Router dynamic segments (e.g., `[intentId]`) allow `GET`, `POST`, etc. inside the same file. Each resource-specific folder cleanly mirrors the PayMongo reference pages.

## Shared Helper Implementation Details

### `constants.ts`
```ts
export const PAYMONGO_API_BASE = 'https://api.paymongo.com/v1'
export const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_KEY ?? ''
export const PAYMONGO_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY ?? ''
export const PAYMONGO_VERSION = '2024-03-15' // optional header for version pinning
```
Throw during server start if `PAYMONGO_SECRET_KEY` is missing (guards misconfiguration early).

### `client.ts`
- Exports `async function paymongoRequest<T>(path: string, init?: PaymongoRequestOptions): Promise<T>`.
- Internally builds `Authorization: Basic base64(secretKey + ':')` and enforces `Content-Type: application/json` + `Accept: application/json`.
- Adds idempotency support: if `init.idempotencyKey` is provided, attach `Idempotency-Key` header (useful for PaymentIntent creation).
- Implements retry-once for HTTP 429 and 5xx with exponential backoff (PayMongo rate limit best practice).
- Throws typed errors from `errors.ts` so route handlers can respond uniformly.

### `schemas.ts`
Use `zod` to define and export payload schemas per endpoint, e.g. `createPaymentIntentInput`, `attachPaymentIntentInput`, etc. Each route should `schema.parse(await req.json())` before calling PayMongo, guaranteeing well-formed data and making tests deterministic.

### `transformers.ts`
Expose helpers that convert PayMongo JSON:API responses into flatter camelCase objects consumed by the UI (e.g., `transformPaymentIntent(apiResponse.data)`), but always include the raw payload under `raw` so debugging remains simple.

### `errors.ts`
Provide `createErrorResponse(error, fallbackMessage)` that maps PayMongo error payloads / thrown `PaymongoApiError` objects into `{ error: { type, message, details } }` for the front end. Include special handling for:
- 400 validation errors (surface first attribute + message pair)
- 402 payment required statuses (send `next_action` details back to client)
- 409 idempotency / attach conflicts

### `webhook.ts`
- Provide `verifyPaymongoSignature(body: string, signatureHeader: string)` built per https://developers.paymongo.com/docs/statuses-messages-webhook-events (HMAC SHA256 using secret key).
- Export TypeScript discriminated unions for every `event.data.type` value we care about (e.g., `payment.paid`, `payment.failed`, `payment.refunded`).

## API Route Expectations
Every `route.ts` should:
1. Instantiate the Supabase client via `createRouteHandlerClient` (mirrors existing API routes) to optionally tie PayMongo entities to authenticated users / bookings.
2. Validate input using schemas.
3. Call the matching helper in `lib/paymongo`.
4. Return `NextResponse.json({ data: ... })` on success or `createErrorResponse()` on failure.
5. Log `console.error('[paymongo]', actionId, error)` for observability (middleware can later be hooked to a logger).

### Authentication & Authorization
- For user-triggered endpoints (create intent, attach method, etc.), require an authenticated Supabase user and optionally validate they own the booking/vehicle before hitting PayMongo.
- For webhooks, do **not** require auth; instead verify signature + event type.

## Endpoint Breakdown
Below is the detail each folder needs to cover. Route names correspond to Next.js paths under `/api/paymongo`.

### Payment Intents (`payment-intents/*`)
Reference: payment intent docs + create/retrieve/attach references.

| Path | Method | Description |
| --- | --- | --- |
| `/payment-intents/create` | POST | Create an intent with `amount`, `currency`, `payment_method_allowed`, `statement_descriptor`, and `metadata` linking booking + user IDs. Forward to `POST /payment_intents`. Return client secret + intent ID. |
| `/payment-intents/[intentId]` | GET | Retrieve PayMongo intent via `GET /payment_intents/:id`. Optionally refresh status before showing checkout UI. |
| `/payment-intents/[intentId]/attach` | POST | Attach a payment method per https://developers.paymongo.com/reference/attach-to-paymentintent. Body expects `{ paymentMethodId, clientKey }`. Also return `next_action` info for GCash/GrabPay flows. |
| `/payment-intents/[intentId]/cancel` | POST | Optional endpoint to cancel pending intents (useful when users abandon checkout). Call `POST /payment_intents/:id/cancel`.

Implementation notes:
- Use `Idempotency-Key` (e.g., bookingId + timestamp) on create to avoid duplicate charges.
- Merge metadata: `metadata: { booking_id, renter_id, vehicle_id }` to cross-reference later via webhooks.
- After `attach`, persist resulting `payment.id` + status in Supabase `payments` table.

### Payment Methods (`payment-methods/*`)
Reference: payment method object + create/retrieve/update docs.

Routes:
- `POST /payment-methods/create`: Accepts billing data, type (`gcash`, `card`, `paymaya`), and `details` as required by PayMongo. Response returns the method `id` for client-side intent attachment.
- `GET /payment-methods/[paymentMethodId]`: Simple proxy to PayMongo, but filter/sanitize before returning to client.
- `PATCH /payment-methods/[paymentMethodId]/update`: Allows updating billing contact data (per reference). Only accessible to authenticated owners of the method (enforced via metadata `customer_id` or Supabase records).

### Payments & Sources (`payments/*`)
Reference: payment source + retrieve/list payments docs.

- `GET /payments/[paymentId]`: Retrieve PayMongo payment (useful after redirect-based flows). If metadata ties to a booking, update Supabase status before responding.
- `GET /payments/list`: Accept query params `limit`, `before`, `after`, `status`. Map them to `GET /payments?limit=...`. Validate to avoid unbounded queries.
- `GET /payments/sources/[sourceId]`: `payment-source` doc integration (GCash sources). Use this to check deep-link source status when not using intents.

### Refunds (`refunds/*`)
Reference: refund resource docs.

- `POST /refunds/create`: Body expects `paymentId`, `amount`, `reason`, `notes`. Optionally allow partial refunds. Call `POST /refunds`.
- `GET /refunds/[refundId]`: Proxy `GET /refunds/:id`.
- `GET /refunds/list`: Accept pagination + `payment_id` filter.

Every refund response should also set Supabase `payments.status = 'refunded'` and create an audit log entry.

### Customers (`customers/*`)
Reference: customer resource + payment method management docs.

Routes:
- `POST /customers/create`: Create PayMongo customer with metadata linking to Supabase `profiles.id`. Store PayMongo `customer.id` back to the profile table.
- `GET /customers/[customerId]`: Proxy with optional caching (60s) since this is mostly static data.
- `PATCH /customers/[customerId]/update`: Allow editing contact info or default payment method.
- `DELETE /customers/[customerId]/delete`: Soft-delete the customer in PayMongo and remove mapping locally.
- `GET /customers/[customerId]/payment-methods`: Uses `GET /customers/:id/payment_methods` (per reference). Returns a normalized array for the UI.
- `DELETE /customers/[customerId]/payment-methods/[paymentMethodId]/delete`: Removes a stored payment method per https://developers.paymongo.com/reference/delete-a-payment-method-of-a-customer.

### GCash Deep Link Support (`gcash/deeplink`)
Reference: https://developers.paymongo.com/docs/handle-gcash-deep-links

- `POST /gcash/deeplink`: Accepts `{ amount, description, returnUrl }` and calls the PayMongo GCash deep link API. Response should include `redirect.url` and `qr_image`. Store the `source.id` returned so polling endpoints know what to look for.
- Re-use `payments/sources/[sourceId]` to poll until `status === 'paid'`.

### Webhooks (`webhooks/paymongo`)
Reference: status + webhook docs.

- This is a `POST` route receiving raw body. Use `verifyPaymongoSignature` before parsing.
- Support events: `payment.paid`, `payment.failed`, `payment.refunded`, `refund.processed`, `payment.expired`.
- After verification, update Supabase `payments`, `bookings`, and send notifications if necessary.
- Always return `200` even if downstream updates fail, but log and enqueue a retry task via your job queue (placeholder comment until queue exists).

## Controller Flow Diagram
1. Client calls a UI hook (e.g., `useCreateBookingPayment`) which hits `/api/paymongo/payment-intents/create`.
2. The route validates body, ensures Supabase user, builds metadata, and calls `paymongoRequest('payment_intents', { method: 'POST', body })`.
3. PayMongo responds with intent data. Handler stores `intentId`, `clientKey`, `status` in Supabase `payments` row tied to the booking, then returns sanitized payload to the client.
4. Client either attaches a saved method via `/payment-intents/{id}/attach` or launches a GCash deep link via `/gcash/deeplink`.
5. PayMongo sends a webhook event on completion, which finalizes Supabase state.

## Testing Strategy
- **Unit tests**: Add `src/lib/paymongo/__tests__` with Vitest to cover `paymongoRequest`, schema parsing, and webhook verification (mock `crypto`).
- **Route tests**: Use Next.js `app-router route handlers` testing utilities or integration tests via `supertest` hitting `POST /api/paymongo/...` with mocked Supabase + mocked PayMongo fetch (MSW or `undici.MockAgent`).
- **Manual testing**: Use cURL / Thunder Client with `.env.local` keys. Document sample requests in README snippet below.

Sample cURL for creating intents:
```bash
curl -X POST http://localhost:3000/api/paymongo/payment-intents/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <SupabaseJWT>" \
  -d '{
    "amount": 250000,
    "currency": "PHP",
    "description": "3-day scooter rental",
    "paymentMethodAllowed": ["gcash", "card"],
    "metadata": {"bookingId": "123", "vehicleId": "456"}
  }'
```

### Developer Playground Page
- `src/app/paymongo-tester/page.tsx` exposes a small UI inside the app itself so authenticated teammates can create payment intents, fetch intents/payments, trigger GCash deep links, and list the latest payments.  
- Each widget calls the corresponding `/api/paymongo/**` endpoint and dumps the JSON payload to a log pane, making it easy to validate responses without leaving the browser.  
- Use it during QA to confirm Supabase auth + PayMongo keys are wired correctly before integrating the flows into production UI components.

## Logging & Metrics
- Add `requestId` (UUID) per route using `crypto.randomUUID()`; include it in logs + responses for correlation.
- Log PayMongo response times and status codes for observability (later tie into OpenTelemetry if needed).

## Rollout Checklist
1. Add env vars (already placed in `.env.local`). Configure production secrets in Vercel / hosting provider as well.
2. Scaffold directories + helpers under `src/lib/paymongo`.
3. Implement each route following the schemas + helper usage described above.
4. Wire webhook handler to update Supabase + internal notifications.
5. Write Vitest coverage for helpers + at least one happy-path and one failure-path for each resource group.
6. Document QA scenarios in `docs/TESTING_CHECKLIST.md` once code lands.

Following this plan results in a PayMongo controller surface that is easy to extend, test, and audit because every PayMongo REST call maps to one clearly named route file.
