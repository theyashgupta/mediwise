# Payments go-live readiness (MEDI-201)

Check date: 2026-11-28, on `main` at `68dc45f`. The later merge of MEDI-200 changes only `.github/workflows`. Sandbox only. No production key, no production flag, no real payment.

## Setup

- API: `apps/api` on port 3001 with the sandbox keys from `apps/api/.env`, `PAYMENTS_ENABLED=true` and `CASHFREE_ENV=sandbox`. `PAYMENTS_WEBHOOK_URL` pointed at a Cloudflare quick tunnel to port 3001, so the real Cashfree sandbox webhooks reached the local API.
- Web: a production build with `VITE_PAYMENTS_ENABLED=true` and `VITE_CASHFREE_MODE=sandbox`. A small static server sent the CSP from `apps/web/public/_headers`, with the production API and Supabase origins swapped for the local API and `mediwise-dev`. The Cashfree hosts stayed as they are in the file.
- Account: the demo account `arjun.demo@example.com` on `mediwise-dev`. Payments used the Cashfree sandbox Net Banking simulator. No card was entered.

## What passed

| Check | Result |
| --- | --- |
| Buy 1 credit (₹49) | Balance 4 to 5. The page showed the paid message. |
| Buy 5 credits (₹199) | Balance 5 to 10. |
| Buy 20 credits (₹599) | Balance 10 to 30. |
| Duplicate webhooks from Cashfree | Cashfree sent two payment webhooks for each order at the same time. The API credited each order once. |
| Replayed payment webhook | A signed copy of the 20-credit payment webhook got 200 and added nothing. |
| Refund | A full sandbox refund of the 5-credit order (₹199) reached `SUCCESS`. Its signed refund webhook removed 5 credits. Balance 30 to 25. |
| Replayed refund webhook | Got 200 and removed nothing. |
| Failed payment | Simulator status FAILED (insufficient funds). Cashfree showed "Payment Error". Balance stayed at 30. No paid message. |
| Closed modal | Close and "Yes, Leave" in the Cashfree modal. The modal closed, the Buy buttons worked again, the balance did not change. |
| CSP | After the fix below, the checkout showed no CSP error. The other console errors come from Cashfree scripts (Sentry DSN, Bluetooth permission, Svelte hydration). |
| Prices | `paymentPacks` in `packages/shared` holds 4900, 19900 and 59900 paise. `payments.config.ts` re-exports it. The credits page shows ₹49, ₹199 and ₹599. The landing page reads the same list in `apps/landing/src/lib/facts.ts`. |
| Webhook path, env names, flags | `/payments/webhook` is mounted before `auth` in `apps/api/src/app.ts`. `CASHFREE_APP_ID`, `CASHFREE_SECRET_KEY`, `CASHFREE_ENV`, `PAYMENTS_WEBHOOK_URL`, `PAYMENTS_ENABLED` match `env.ts` and `render.yaml`. `VITE_PAYMENTS_ENABLED` and `VITE_CASHFREE_MODE` match `deploy-web.yml`. |

The refund webhook was signed locally with the sandbox secret key, as Cashfree signs it. The body came from the refund that Cashfree returned. Cashfree sends refund webhooks only to the dashboard webhook URL, and the sandbox dashboard does not point at the tunnel. This confirms step 4 of the checklist in `docs/DEPLOY.md`.

Screenshots in `docs/design/screenshots`:

- `medi-201-credits-1280-light.png`, `medi-201-credits-1280-dark.png`, `medi-201-credits-390-light.png`, `medi-201-credits-390-dark.png`: the credits page with the packs.
- `medi-201-checkout-1280-light.png`, `medi-201-checkout-1280-dark.png`, `medi-201-checkout-390-light.png`, `medi-201-checkout-390-dark.png`: the Cashfree checkout over the credits page.

The 390 px checkout images use an iPhone profile (mobile user agent, touch). The Cashfree modal is always light. Its look does not follow the app theme.

## What I fixed

1. The CSP blocked the checkout. `form-action 'self'` stopped the Cashfree SDK from sending its checkout form to `https://sandbox.cashfree.com/pg/view/sessions/checkout`, so the modal opened empty. MEDI-164 added the CSP on 2026-10-16, after the MEDI-33 sandbox check on 2026-10-12. Production checkout would have failed in the same way with `https://api.cashfree.com`. `form-action` now names both hosts. A test in `apps/web/src/config/headers.test.ts` failed before the fix and passes now.
2. `docs/DEPLOY.md`, Payments (Cashfree): the text named `contact` in `apps/web/.../policies.ts` and a `policyUpdated` field. Both are gone. The policy text now comes from the CMS, and `contact` and `paymentPacks` live in `packages/shared`. Step 1 asked for a postal address that the intro said the pages do not show. Step 2 named `payments.config.ts` as the place for prices. A new step 5 covers the checkout name. Step 9 adds a check for CSP errors.

## The contact page today

Source: `apps/web/content/legal.en.json`, the committed CMS snapshot of 2026-11-12.

| Value | State |
| --- | --- |
| Legal name of the proprietor | Present |
| Email | Present |
| Phone in the +91 form | Present |
| Postal address | Missing. No policy page shows one. Commit `1ce417b` removed it, because Cashfree needs only the email, the phone and the business name. |
| Square brackets or placeholders | None |

The business name Codegenix is also present. The production site builds from the live CMS when `CMS_URL` is set, so check the live pages again in step 1 of the checklist.

## Gaps that are not code bugs

- The Cashfree checkout shows "Business Name" and the letter B as the merchant. Set the name and logo in the Cashfree dashboard.
- The checkout shows "Payment Options for +91 9999999999". The API sends one placeholder phone with each order, because MediWise does not ask for a phone. The buyer can change it in the checkout. Decide whether this is acceptable for production.
- In a desktop browser window 390 px wide, the Cashfree checkout hides its close button, merchant name and amount. A phone profile shows all three. This is Cashfree layout, not MediWise code.
- The demo account now has 25 credits, not 4, after the sandbox purchases.

## What the orchestrator and Yash must still do for production

1. Yash: get the Cashfree production account approved. Send the four live policy URLs on `https://app.mediwise.theyashgupta.me`.
2. Yash: decide on the postal address. Add it to the contact page in the CMS only if Cashfree asks for it in the review.
3. Yash: in the Cashfree production dashboard, set the business name and logo for the checkout.
4. Yash: decide whether the placeholder phone is acceptable, or ask for a ticket that collects a real phone in the buy flow.
5. Orchestrator: merge this branch before any flag goes on. Without the CSP fix the production checkout opens empty.
6. Orchestrator: set `CASHFREE_APP_ID` and `CASHFREE_SECRET_KEY` on Render from the env-vault keys `CASHFREE_PROD_APP_ID` and `CASHFREE_PROD_SECRET_KEY`. Set `CASHFREE_ENV=production` and `PAYMENTS_WEBHOOK_URL=https://mediwise-api-ij2v.onrender.com/payments/webhook`.
7. Yash or the orchestrator: register the webhook URL in the Cashfree production dashboard for the payment success event and the refund event. Without it a refund does not remove credits.
8. Orchestrator: make sure that migrations `0013` and `0014` are on `mediwise-prod`.
9. Orchestrator: set `PAYMENTS_ENABLED=true` on Render and restart. Set the GitHub variables `VITE_PAYMENTS_ENABLED=true` and `VITE_CASHFREE_MODE=production`, then run `deploy-web`.
10. Yash: buy the 1-credit pack for ₹49 with a real payment. Make sure that the console shows no CSP error and that the balance increases by 1. Refund it in the Cashfree dashboard. Make sure that the balance decreases by 1 and that `GET /admin/spend` shows `purchases` 1.

## International payments

`docs/research/payments-international.md` exists only as an untracked file in the main checkout. It is not on `main`. Its main points:

- Cashfree has an International Payment Gateway for foreign Visa, Mastercard and Amex cards. The public price is 2.99% per transaction, settled in INR. Activation is a request to Cashfree with a risk review.
- It is not known whether Cashfree approves a health-information product with AI-written text for international cards. Ask Cashfree in writing first.
- Stripe India is invite-only. Paddle and Lemon Squeezy forbid medical advice or services, and their 50 cent fee does not suit small packs.
- ₹49, ₹199 and ₹599 are about USD 0.60, 2.40 and 7.20. The note suggests separate USD prices for buyers outside India.
- Go live in India first. International cards need a separate request to Cashfree and a tax question for a CA. They do not block this go-live.
