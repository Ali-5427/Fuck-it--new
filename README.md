# Fix It

Preflight your iOS submission before App Review.

Fix It inspects an iOS build, App Store listing, or App Store Connect record and turns verifiable signals into prioritized findings. The deterministic evaluator is the source of truth; Gemini is optional context layered on top of those findings.

## Start Here

### Requirements

- Node.js 18 or newer
- npm
- An InsForge project for authentication and persistence

### Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

The local server combines Vite and the Express API. The API is available under `/api`, including `GET /api/health`.

### Configure environment

Put local values in `.env.local`. Never commit real keys.

| Variable | Required | Used for |
| --- | --- | --- |
| `VITE_INSFORGE_BASE_URL` | Yes | InsForge project URL |
| `VITE_INSFORGE_ANON_KEY` | Yes | Browser SDK authentication and database access |
| `GEMINI_API_KEY` | Optional | AI audit enrichment, rejection analysis, and metadata suggestions |
| `CONNECT_KEY_ENCRYPTION_SECRET` | Connect only | Encrypting saved App Store Connect private keys on the server |
| `VITE_SITE_URL` | Production | Canonical public site URL |
| `VITE_SUPPORT_EMAIL` | Optional | Support contact shown by the site |
| `VITE_LEGAL_EFFECTIVE_DATE` | Optional | Legal-page effective date in `YYYY-MM-DD` format |
| `VITE_ANALYTICS_ENDPOINT` | Optional | Consent-gated analytics endpoint |
| `VITE_ERROR_REPORTING_ENDPOINT` | Optional | Optional client error reporting endpoint |

`.env.example` contains empty placeholders for the core variables. The real `.env` and `.env.local` files are ignored by Git.

## What Can Be Scanned

### Binary scan

Upload an `.ipa`, `.zip`, or `Info.plist` file. The browser extracts signals such as:

- Bundle identity and version
- Permission purpose strings
- Framework signatures, including StoreKit, RevenueCat, auth, ads, tracking, and Stripe
- URL schemes and selected entitlements
- Privacy manifest values
- App Transport Security settings
- Background modes
- Supplied screenshot dimensions

Binary findings are evaluated against the full rule set. The scanner does not perform Mach-O parsing and does not claim to prove UI behavior that is not present in the uploaded artifacts.

### Public listing scan

Use Try Now with an app name, App Store URL, numeric App Store ID, or bundle ID. Public iTunes data can verify listing metadata and available screenshot information, but it cannot prove binary configuration. Unknown values become manual checks instead of fabricated passes or failures.

### App Store Connect scan

Connect an App Store Connect API key to inspect live metadata, versions, builds, In-App Purchases, subscription groups, age ratings, and screenshots. Connect audits use the listing-safe rule family for metadata and Connect data; they do not run binary-only privacy, ATS, or permission rules against unknown values.

Connect checks require a Vercel plan that supports the configured 60-second API function duration. A shorter plan may terminate a slow Apple API request.

## Audit Workflow

1. Choose a binary upload, public listing lookup, or App Store Connect app.
2. Review findings by severity, category, and status.
3. Open a finding to inspect evidence, remediation, and verification steps.
4. Mark findings fixed, in progress, manual review, or won't fix.
5. Recheck the same source. Fixed and won't-fix statuses are carried forward when the same rule still triggers.
6. Compare audit runs and export a submission report.

Readiness is intentionally conservative:

- Any open `HIGH` finding: `NOT_READY`
- Only medium, low, or manual-review findings: `READY_WITH_WARNINGS`
- No open findings: `NO_HIGH_RISK_ISSUES_DETECTED`

## Tools Included

- **Dashboard:** Applications, audit history, status, and open findings
- **Deterministic evaluator:** Apple guideline checks with evidence and remediation guidance
- **AI enrichment:** Optional Gemini explanations and reviewer-note drafts
- **Try Now:** Public iTunes listing lookup and listing-only recheck
- **App Store Connect:** Live Connect metadata and recheck support
- **Metadata checker:** App name, subtitle, keyword, and listing-copy validation
- **Screenshot validator:** Exact supported iPhone and iPad pixel dimensions
- **Rejection Solver:** Resolution Center analysis and response drafting
- **Submission report:** Readiness summary, remaining warnings, and manual checklist
- **Audit diff:** Resolved, remaining, and newly detected findings

## Architecture

```text
Browser
    ├─ React UI
    ├─ Client-side IPA/ZIP extraction
    ├─ Deterministic evaluator
    └─ InsForge SDK

Vercel
    └─ /api -> Express serverless function
             ├─ Auth/session verification
             ├─ Gemini server calls
             ├─ iTunes/App Store Connect proxy calls
             └─ InsForge server-side persistence
```

Important boundaries:

- `src/engine/extractor.ts` normalizes uploaded artifacts.
- `src/engine/evaluator.ts` applies enabled rules and computes readiness.
- `src/services/store.ts` owns local state, audit history, and persistence.
- `src/services/api.ts` calls protected API routes with the current InsForge bearer token.
- `server.ts` exports the Express API app.
- `devServer.ts` adds Vite middleware for local development and is not imported by `api/index.ts`.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite + Express development server on port 3000 |
| `npm run build` | Build the client and production server bundle |
| `npm start` | Run `dist/server.cjs` after building |
| `npm run preview` | Preview the Vite production client |
| `npm run lint` | Run TypeScript typechecking |
| `npm run clean` | Remove generated build output |

## Deploy To Vercel

1. Push the repository to GitHub.
2. Import the repository into Vercel.
3. Add the environment variables from the table above in Vercel Project Settings.
4. Deploy the `main` branch.
5. Verify the API before testing the UI:

```bash
curl -i https://YOUR-DOMAIN.vercel.app/api/health
```

Expected response:

```json
{
    "status": "healthy",
    "timestamp": "...",
    "version": "1.0.0",
    "geminiConfigured": false
}
```

The response must have an `application/json` content type. A response containing the app HTML indicates an incorrect Vercel route or rewrite configuration. Static JavaScript files under `/assets/` must also return JavaScript, not `index.html`.

## InsForge Setup

The app uses InsForge for:

- Email/password and OAuth authentication
- User profiles
- Saved applications, inspections, audits, and findings
- Encrypted App Store Connect credentials

Apply `src/config/schema.sql` in the InsForge SQL editor before using persistence. The migration enables row-level security, adds required columns, and safely drops/recreates its named policies, so it can be pasted and run again.

## Privacy And Security

- IPA and ZIP extraction happens in the browser for binary uploads.
- App Store Connect private keys are sent only to the authenticated server route and encrypted before persistence.
- Protected AI and Connect routes require an InsForge bearer token.
- Gemini is optional; deterministic findings remain available when it is unconfigured or unavailable.
- Do not commit `.env`, `.env.local`, private keys, or API credentials.

See the in-app `/privacy`, `/terms`, `/dpa`, `/cookies`, and `/refunds` pages for the full policy text.

## Troubleshooting

### `401 Unauthorized` from an AI route

Sign in and retry. The client only calls protected AI routes when it has a current InsForge access token.

### The app cannot connect to InsForge

Check that `.env.local` contains both `VITE_INSFORGE_BASE_URL` and `VITE_INSFORGE_ANON_KEY`, then restart `npm run dev`. Do not use the empty values from `.env.example`.

### Vercel returns HTML from `/api/health`

Confirm the deployment contains `api/index.ts`, uses the repository `vercel.json`, and redeploys the latest commit. `/api/health` must be handled by the Express function and return JSON.

### Connect checks time out

App Store Connect requests can be slow because multiple Apple endpoints are queried. Use a Vercel plan that supports the configured 60-second function duration.

## Scope And Disclaimer

Fix It provides automated preflight guidance based on available artifacts and publicly available Apple App Store Review Guidelines. It is not affiliated with Apple Inc., cannot observe every runtime behavior or App Store review decision, and does not guarantee approval.
