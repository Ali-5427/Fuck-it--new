# FIX IT — MASTER END-TO-END BUILD PROMPT

You are now the primary engineer responsible for building **Fix It** from scratch.
Do not create another implementation plan first.
Do not stop after describing what you would build.
**BUILD THE PRODUCT.**

You may inspect the existing workspace/project only to understand what files already exist, but Fix It is being built as a new product. Do not assume that an existing Fix It implementation is correct or that previous architecture decisions must be preserved.

If the workspace is empty, initialize the project.
If files already exist, use them where useful, but replace incorrect architecture or code when necessary.

---

## 1. PRODUCT
**Product name**: Fix It

**Core promise**: Check your app before you submit it.

Fix It is a developer tool that helps iOS developers check their apps before App Store submission, understand problems, fix them, recheck them, and monitor their App Store Connect status.

The customer is building an iOS app.
**Fix It itself is NOT an iOS app.**

---

## 2. ABSOLUTE PLATFORM REQUIREMENT
**FIX IT IS A WEB APPLICATION ONLY.**
This requirement overrides any conflicting assumption.
Fix It must run entirely in a web browser.

**DO NOT BUILD:**
- iOS application
- Android application
- native mobile application
- macOS application
- Windows application
- Swift application
- SwiftUI application
- Xcode project
- React Native application
- Flutter application
- native desktop client

There must be **ONE WEB APPLICATION**.
The browser frontend communicates with Supabase and server-side Edge Functions.
The product can analyze customer iOS app builds, but Fix It itself is always a web application.

---

## 3. TARGET USERS
Build for:
- indie developers
- solo founders
- AI-assisted app builders
- small development teams
- developers preparing an iOS app for App Store submission

The UI should feel like a serious developer tool.
It should be simple, clean, fast and understandable.
Do not build a huge enterprise dashboard.

---

## 4. CORE USER JOURNEY
The complete product journey should be:

```text
Visit Fix It
 ↓
Search for an existing App Store app
 ↓
See real public app information
 ↓
See locked Fix It preview
 ↓
Sign up / Log in
 ↓
Dashboard
 ↓
Add / connect an app
 ↓
Choose:
 • Upload .ipa
 • Connect App Store Connect
 ↓
Run preflight
 ↓
Real deterministic analysis
 ↓
Findings
 ↓
Readiness result
 ↓
AI explains findings
 ↓
Developer fixes issues
 ↓
Upload/recheck
 ↓
Compare previous result
 ↓
Ready to submit
 ↓
Connect App Store Connect
 ↓
Monitor app/build/version/review events
 ↓
Receive notifications
 ↓
If rejected:
 rejection event
 ↓
 notification
 ↓
 AI explanation
 ↓
 rejection solver
 ↓
 developer fixes app
 ↓
 preflight again
 ↓
 recheck
 ↓
 resubmit
 ↓
 continue monitoring
```
This workflow is the heart of Fix It.

---

## 5. TECHNOLOGY STACK

**Frontend**
Use:
- React
- Vite
- TypeScript
- Tailwind CSS
- React Router
- TanStack React Query
- Supabase JavaScript client
- Lucide icons

Use strict TypeScript.
Keep frontend architecture simple.
Do not introduce unnecessary state-management libraries.

**Backend**
Use **Supabase as the backend platform**.
Use:
- Supabase Auth
- Supabase PostgreSQL
- Supabase Storage
- Supabase Edge Functions
- Supabase Realtime where useful

Supabase Edge Functions are server-side TypeScript/Deno functions. Use them for sensitive operations, integrations, webhooks and backend processing.

**Do NOT introduce:**
- Node backend server
- Express
- Hono
- Bun backend
- Redis
- pg-boss
- Kafka
- RabbitMQ
- Kubernetes
- microservices
- AWS S3
- custom authentication backend
unless a real technical limitation is discovered that makes a specific component absolutely necessary.

Prefer the simplest architecture that actually works.

---

## 7. DATABASE
Create the required Supabase PostgreSQL schema.
Use UUID primary keys where appropriate.
Enable Row Level Security on user-owned data.

Core tables should include:

**profiles**
- id
- email
- created_at
- starting_credits_granted

**credits_ledger**
- id
- user_id
- delta
- reason
- reference_id
- created_at
*(Balance should be calculated from ledger entries rather than relying on a drifting manually updated balance.)*

**apps**
- id
- user_id
- name
- icon_url
- bundle_id
- source
- itunes_track_id
- created_at
- updated_at

**asc_connections**
- id
- user_id
- issuer_id
- key_id
- encrypted_private_key
- status
- validated_at
- last_error
- webhook_secret
- created_at
*(Sensitive credentials must never be exposed to the browser after submission.)*

**connected_apps**
- id
- app_id
- asc_app_id
- monitoring_enabled
- last_synced_at
- raw_snapshot
- created_at
- updated_at

**checks**
- id
- app_id
- version_label
- build_number
- status
- readiness
- started_at
- completed_at
- error_message

**findings**
- id
- check_id
- category
- severity
- code
- title
- detail
- how_to_fix
- raw_evidence
- created_at

**finding_states**
Track whether findings are:
- open
- resolved
and allow comparison between checks.

**check_comparisons**
Store comparison information between two checks.

**reports**
Store generated report information.

**rejection_analyses**
- user_id
- app_id nullable
- input_text
- analysis
- created_at

**ai_explanations**
Cache AI explanations.
Include:
- subject_type
- subject_id
- content_hash
- content
- model
- created_at

**webhook_events**
Store actual App Store Connect webhook events.
Include:
- connection
- Apple event ID
- event type
- payload
- signature validity
- received time
*(Use a unique constraint on the Apple event ID where appropriate to prevent duplicate processing.)*

**activity_events**
Store real application activity derived from:
- webhook events
- synchronization changes

**notifications**
- user_id
- app_id
- kind
- title
- body
- read_at
- created_at
- link_target

**beta_snapshots**
Store real TestFlight-related snapshots when available.

**reviews**
Store real App Store customer review data when available.
Do not invent records.

---

## 8. AUTHENTICATION
Use Supabase Auth.
Implement:
- signup
- login
- logout
- session persistence
- protected routes
- authenticated workspace
Initially support email/password.
Do not build custom authentication.

---

## 9. WEBSITE ROUTES
Build these routes:
```text
/
/search
/apps/preview/:trackId
/login
/signup
/dashboard
/apps
/apps/:id
/apps/:id/check
/checks/:checkId
/checks/:checkId/compare/:baseId
/apps/:id/history
/rejection-solver
/notifications
/settings
/reports/:checkId
```
Protect authenticated routes.

---

## 10. LANDING PAGE
Build a simple product landing page.
Primary message:
**Check your app before you submit it.**

Explain the real workflow:
- upload your build
- find problems
- understand what needs fixing
- recheck
- connect App Store Connect
- monitor what happens after submission

Do NOT build a huge marketing website.
The product itself is the priority.

---

## 11. PUBLIC APP SEARCH
Before login, users can search public App Store apps.
Use Apple's public iTunes/App Store search endpoint through a server-side Edge Function.
The browser should NOT directly depend on an external Apple endpoint if a proxy is required for CORS/rate limiting.
Search should return only real fields actually returned by Apple.
Possible information:
- app name
- developer/seller
- category
- icon
- rating when actually available
- App Store identifier
- other returned public metadata
Never fabricate missing information.

---

## 12. PUBLIC APP PREVIEW
When a user opens an app:
Show the real public app information.
Then show:

**Fix It Analysis**
Use visual locked/shimmer placeholders.

IMPORTANT:
The locked area must NOT contain fake scores.
Do not secretly put fake:
- issue counts
- readiness
- warnings
- critical issues
- AI analysis
- percentages
under the blur.
The locked UI is simply an access gate.
Show:
**Sign up to run Fix It on your app.**

---

## 13. DASHBOARD
Build a clean dashboard.
Include:
- Fix It branding
- "Check your app before you submit it."
- Check an App
- My Apps
- Recent Checks
- Latest Results
- Issues
- Connected Apps
- Monitoring
- Notifications
- Credits
Only show actual data.

If the user has no apps, show an honest empty state. Example:
**No apps yet**
Check your first app to see what Fix It finds.

---

## 14. MY APPS
Show:
- app name
- icon
- bundle ID
- current version/build when known
- last check
- readiness
- App Store Connect connection
- monitoring status
- activity

Possible actual states:
- Not checked
- Ready
- Needs attention
- Not ready
- Connected
- Not connected
- Monitoring
- Monitoring disabled
Never display a state that has not actually been established.

---

## 15. CHECK AN APP
Provide two options.

**Option A — Upload .ipa**
User selects `.ipa`.
Flow:
```text
Select .ipa
↓
Upload to Supabase Storage
↓
Create check
↓
Process check
↓
Extract app
↓
Run deterministic checks
↓
Save findings
↓
Calculate readiness
↓
Show results
```

**Option B — App Store Connect**
Allow user to connect App Store Connect and select an existing app.

---

## 16. STORAGE
Use a private Supabase Storage bucket:
`ipa-uploads`
Suggested path:
`{user_id}/{check_id}.ipa`
Files must not be public.
Only authorized server-side processing should access them.
Start with a reasonable MVP file size limit such as 200 MB.
If technical limits require a lower limit, communicate it clearly.

---

## 17. IPA ANALYSIS ENGINE
This is one of the most important parts of Fix It.
The analysis engine is the **source of truth**.
The AI does NOT create findings.

Flow:
```text
IPA
 ↓
Extraction
 ↓
Deterministic checks
 ↓
Structured findings
 ↓
Database
 ↓
Readiness
 ↓
AI explanation
```
Never reverse this.
AI cannot invent a missing permission, configuration issue, score or Apple status.

---

## 18. MVP CHECK CATALOG
Implement real checks that can actually be determined from the available input.

**Binary/build checks**
Check where technically possible:
- supported binary architecture
- minimum iOS version consistency
- bundle information
- version
- build number
- application identifier
- required application metadata

**Info.plist checks**
Check:
- required keys
- declared permission frameworks versus usage descriptions
- malformed or missing relevant values
- URL configuration
- ATS exceptions
- icon configuration

**Permission checks**
Where a framework/permission is declared, verify appropriate usage-description keys exist.
Do not claim complete permission compliance if the static information is insufficient.

**Icons**
Check required icon configuration/sizes where deterministically available.

**Provisioning**
Inspect embedded provisioning profile where possible.
Detect real problems such as:
- expired profile
- obviously incorrect distribution type
- missing profile data

**URLs**
Where URLs are explicitly present and technically testable, check reachability.
If network access cannot reliably be performed, mark the check unavailable rather than passing it.

**Localization**
Where deterministically detectable, identify missing expected localized metadata.

---

## 19. APPS CONNECTED THROUGH APP STORE CONNECT
For connected apps, use real App Store Connect API data.
Check where the API actually exposes the required data:
- description
- keywords
- screenshots
- privacy policy URL
- App Review information
- age rating
- build attached to version
- metadata completeness
- IAP metadata states
- version/app status
Do not claim that Fix It performs checks that Apple does not expose enough information to perform.

---

## 20. EXPLICITLY OUT OF MVP
Do NOT fake or pretend to implement:
- private API detection
- complete binary security analysis
- performance testing
- App Review simulation
- screenshot quality judgment
- guaranteed App Store approval
If something is not actually implemented, don't show it as a completed check.

---

## 21. READINESS
Use deterministic readiness.

**READY**
0 critical issues and 0 warnings.

**NEEDS ATTENTION**
0 critical issues and at least 1 warning.

**NOT READY**
At least 1 critical issue.

If no check has run:
`readiness = null`
Do not display a readiness result before an actual check.
Do not create a fake percentage score.
A numeric score is NOT required for MVP.

---

## 22. FINDINGS
Each finding should contain:
- severity
- category
- title
- what was found
- why it matters
- how to fix
- evidence
- finding code

Severity:
- Critical
- Warning
- Suggestion

Do not exaggerate severity.

---

## 23. ISSUE STATES
Allow users to track issues:
- Open
- Fixed
- Ignored

For comparison, derive:
- Fixed
- Remaining
- New
from actual findings.

---

## 24. RESULTS PAGE
The results page should clearly show:
- App
- Version
- Build
- Readiness
- Critical
- Warnings
- Suggestions
- Findings

Allow filtering by severity/category.
Each issue can be opened.

---

## 25. AI EXPLANATIONS
AI is a core Fix It feature.
But AI is an explanation layer, not the source of truth.
For a real finding, allow:
- What does this mean?
- Why does this matter?
- How do I fix it?
- What should I check afterward?
The AI receives the actual finding/evidence as context.
It must not invent facts.
If the context doesn't support an answer, say that.

---

## 26. OLLAMA-FIRST AI
Use Ollama as the first AI provider.
Local Ollama normally exposes its API through:
`http://localhost:11434/api`
during local development.
Create a provider abstraction.
Example concept:
```text
AI Provider
 ├── Ollama
 └── Future providers
```
Do not hard-code the entire product to one provider.

---

## 27. IMPORTANT OLLAMA DEPLOYMENT REALITY
A deployed Supabase Edge Function cannot magically access the developer's laptop localhost Ollama.
Therefore:

**Local development**
Allow:
```text
Supabase local Edge Function
 ↓
local Ollama
 ↓
local model
```

**Production**
Allow an environment-configured network-reachable Ollama endpoint.
If no production AI endpoint is configured:
DO NOT fake AI.
Show:
**AI explanation is currently unavailable. Your Fix It results are still available.**
The product must continue working without AI.
Do not make a paid LLM mandatory.

---

## 28. AI CACHING
Cache explanations using:
`subject + content hash`
If the exact same finding has already been explained, reuse the cached explanation where appropriate.
This reduces unnecessary model calls.

---

## 29. REJECTION SOLVER
Create: `/rejection-solver`
User pastes Apple's rejection message.
AI should explain:
1. What Apple is saying
2. What the likely issue is
3. What area/guideline it relates to
4. What changes the developer likely needs to make
5. What to check afterward

Use cautious language.
Never promise: "This will definitely get your app approved."
Instead explain that it is guidance based on the supplied rejection text.
The rejection solver can work without a connected app.

---

## 30. APP STORE CONNECT CONNECTION
Build real App Store Connect integration.
User enters:
- Issuer ID
- Key ID
- `.p8` private key
These values must be submitted to server-side code.
Never expose the private key back to the browser.
Do not log private keys.
Use server-side JWT generation for Apple API requests.
Validate the connection against App Store Connect.
If invalid: Show a useful error.
Examples:
- invalid key
- insufficient API access
- invalid issuer
- invalid key ID
- unauthorized role

---

## 31. APP STORE CONNECT DISCOVERY
After connection:
Retrieve the user's real apps from App Store Connect.
Show:
- app name
- bundle ID
- Apple app ID
- versions
- builds where available
- status
Allow the user to select an app.
Save the connection between Fix It and the App Store Connect app.

---

## 32. APP STORE CONNECT SYNC
Sync real information including where available:
- app
- versions
- builds
- TestFlight/pre-release information
- reviews
- relevant metadata
- status
Do not aggressively poll.
Use user-triggered synchronization plus webhooks where possible.

---

## 33. MONITORING
Fix It should monitor connected apps.
Architecture:
```text
App Store Connect
 ↓
Apple webhook
 ↓
Supabase Edge Function
 ↓
Verify signature
 ↓
Process event
 ↓
Database
 ↓
Notification
 ↓
Fix It dashboard
```
Apple supports App Store Connect webhook notifications for app events. Use the actual event types supported by Apple's current API.

---

## 34. WEBHOOK SECURITY
For App Store Connect webhooks:
Verify the Apple webhook signature before processing.
Use the `x-apple-signature` header and configured webhook secret.
Invalid signature: 401
Do not process the event.
Store event IDs and deduplicate repeated deliveries.
Process events idempotently.

---

## 35. MONITORING EVENTS
Support real events where Apple provides them, such as relevant:
- build status changes
- app version status changes
- TestFlight/beta events
- review-related events where supported
Do not invent events.
If Apple doesn't provide a specific event through webhook, use an honest sync/API fallback when appropriate.

---

## 36. NOTIFICATIONS
Create a notification center.
Examples:
- Build processed
- Version status changed
- Review status changed
- App rejected
- App approved
- TestFlight feedback
- Action required
Only create notifications from real events or real synchronization changes.
No fake notifications.

---

## 37. ACTIVITY TIMELINE
Each connected app should have an activity timeline.
Example:
```text
Today
Build 42 processed

Yesterday
Version 1.2 status changed

Aug 28
TestFlight feedback received
```
Every timeline event must come from actual data.

---

## 38. TESTFLIGHT
Where the App Store Connect API provides data, show:
- builds
- processing status
- beta versions
- tester/group information where available
- feedback/diagnostic information where available
If data isn't available:
Do not display fake zeroes.
Use an appropriate unavailable/empty state.

---

## 39. CUSTOMER REVIEWS
Where App Store Connect provides reviews, show:
- rating
- title
- body
- date
- version
- developer response when available
Do not create fake reviews.
If no reviews were retrieved, say so or hide the section appropriately.

---

## 40. ANALYTICS
Do not create fake analytics charts.
Only show Apple data that is actually retrieved and supported.
Basic analytics can be implemented where practical.
Advanced analytics can remain later.

---

## 41. RECHECK
After the developer fixes their app:
Allow another check.
The user should be able to:
```text
Previous check
 ↓
New IPA
 ↓
New check
 ↓
Compare
```

---

## 42. COMPARISON
Compare two actual checks.
Show:
- **Fixed**: Issues present before but no longer present.
- **Remaining**: Issues still present.
- **New**: Issues introduced by the new build.

Also show readiness change:
`Not Ready → Needs Attention`
or:
`Needs Attention → Ready`
when the underlying data supports it.

---

## 43. READY TO SUBMIT
When readiness rules are satisfied:
Show:
**Your app is ready to submit.**
This means Fix It's implemented preflight checks found no critical issues or warnings.
It does NOT mean:
Apple has approved your app.
Never claim approval.

---

## 44. REPORTS
Create a report for every completed check.
Include:
- app
- version
- build
- date
- readiness
- findings
- fixed/remaining where applicable
- recommendations
Provide an in-app report view.
Add a practical export option where feasible.
Do not spend excessive time on complex PDF infrastructure if it slows down the core product.

---

## 45. HISTORY
Each app should have history showing:
- checks
- versions
- builds
- readiness
- findings
- comparisons
- monitoring events
- status changes
- rejection-related activity
Everything must be based on real stored data.

---

## 46. CREDITS
Fix It uses an internal credit system.
There is: **NO PAYMENT SYSTEM.**
Do not build:
- Stripe
- subscriptions
- checkout
- payment processing
- billing portal
Credits are simply internal counters for the MVP.
Example:
`1 credit = preflight check`
`1 credit = AI explanation/rejection analysis`
Give a starting credit allocation on signup.
Track usage through the credits ledger.
If balance is zero:
Show an honest message.
Do not implement payment.

---

## 47. SECURITY — ONLY WHAT IS NECESSARY
Do not over-engineer security.
But implement the necessary protections:
- Supabase Auth
- RLS
- private Storage
- server-side Apple credentials
- encrypted secret storage where appropriate
- webhook HMAC verification
- signed/private uploads
- rate limiting where practical
- sanitized errors
- never log private keys
- never expose service-role credentials to browser code
Do not create an enormous enterprise security subsystem.

---

## 48. DATA PROVENANCE
Every important displayed value should have a real source.
Possible sources:
- itunes_search
- asc_api
- upload_analysis
- webhook_event
- user_input
The UI must not pretend data came from Apple if it came from user input.
The analysis engine produces findings.
AI produces explanations.
Apple produces App Store Connect data.

---

## 49. NO FAKE DATA — ABSOLUTE RULE
Never fabricate:
- app names
- developers
- ratings
- reviews
- builds
- versions
- Apple statuses
- TestFlight information
- analytics
- findings
- readiness
- scores
- notifications
- webhook events
- AI conclusions

If something isn't available:
Say:
- unavailable
- not connected
- not checked
- no data
- not supported yet
as appropriate.

---

## 50. ERROR HANDLING
Errors should be understandable.
Examples:
- **Upload failed**: We couldn't upload this build. Try again.
- **Invalid IPA**: This file doesn't contain a valid iOS app bundle Fix It can analyze.
- **App Store Connect connection failed**: Fix It couldn't connect to App Store Connect. Check your API credentials and access.
- **AI unavailable**: AI explanation is unavailable right now. Your Fix It result is still available.
Never show raw stack traces to normal users.

---

## 51. LOADING STATES
Use real states.
For analysis:
- Uploading
- Extracting
- Analyzing
- Saving results
- Complete
Do not show fake progress percentages.
If the system doesn't know 43% is complete, don't display 43%.

---

## 52. UI DESIGN
Create a clean developer-tool interface.
Use:
- white/light surfaces
- subtle borders
- restrained shadows
- clear typography
- compact tables
- monospace for IDs/version/build information
- semantic red/amber/green states
- blue primary action
Keep the UI professional.
Do not fill the application with unnecessary gradients, huge animations or decorative components.

---

## 53. RESPONSIVE WEB
The application must work in modern desktop browsers and remain usable on smaller screens.
But remember:
**Responsive web is NOT a native mobile app.**
Do not build a separate mobile application.

---

## 54. EMPTY STATES
Every major section needs a useful empty state.
Examples:
- **No apps**: No apps yet. Check your first app.
- **No checks**: No checks yet. Upload a build to start.
- **No notifications**: You're all caught up.
- **No reviews**: No reviews available.
- **No monitoring**: Connect App Store Connect to start monitoring.

---

## 55. ACCESS CONTROL
Public users:
- landing
- app search
- app preview
- login
- signup

Authenticated users:
- dashboard
- apps
- checks
- results
- rejection solver
- notifications
- reports
- settings
- App Store Connect

Users must only access their own private data.

---

## 56. SUPABASE EDGE FUNCTIONS
Create appropriate functions.
Suggested structure:
```text
supabase/functions/
 itunes-search/
 analyze-ipa/
 ai-explain/
 asc-connect/
 asc-apps/
 asc-sync/
 webhook-asc/
 report-generate/
```
You may combine functions when doing so makes the system simpler.
Do not create dozens of tiny functions unnecessarily.
Use shared utilities under:
`supabase/functions/_shared/`
where appropriate.
Use proper versioned imports compatible with the Supabase/Deno environment.

---

## 57. ANALYSIS PROCESSING
Do not assume Edge Functions can perform unlimited heavy work.
Keep MVP analysis lightweight.
The MVP should focus on:
- archive extraction
- plist parsing
- metadata inspection
- deterministic checks
If a particular `.ipa` operation genuinely exceeds the runtime limits, identify the limitation and implement the simplest reliable solution rather than silently pretending it works.

---

## 58. REAL-TIME
Use Supabase Realtime only where it provides real value.
Good uses:
- check processing status
- notifications
Do not add Realtime everywhere just because it exists.

---

## 59. APPLE API ACCURACY
When implementing Apple APIs:
Use Apple's current official API documentation as the source of truth.
Do not rely on outdated examples if the current API differs.
Handle:
- authentication
- rate limits
- pagination
- HTTP errors
- unavailable resources
- permission errors
Do not hard-code fake API responses.
For App Store Connect webhooks, follow Apple's current webhook format and signature verification requirements.

---

## 60. OLLAMA ACCURACY
Use the Ollama HTTP API.
Do not invent undocumented endpoints.
Allow the model name to be configured through environment variables.
Example configuration:
```text
OLLAMA_URL
OLLAMA_MODEL
```
Do not assume a particular model exists.
If the configured model isn't available, return a clear error.

---

## 61. ENVIRONMENT VARIABLES
Create a clear `.env.example`.
Include only necessary configuration such as:
```text
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

OLLAMA_URL=
OLLAMA_MODEL=
```
Do not commit real secrets.
Never put Supabase service-role keys in frontend code.

---

## 62. PROJECT STRUCTURE
Keep a clean structure similar to:
```text
src/
 components/
 pages/
 layouts/
 hooks/
 lib/
 services/
 types/
 features/

supabase/
 migrations/
 functions/
  _shared/
  itunes-search/
  analyze-ipa/
  ai-explain/
  asc-connect/
  asc-apps/
  asc-sync/
  webhook-asc/
  report-generate/
```
Adjust this if a simpler structure is better.
Do not create unnecessary abstractions.

---

## 63. TESTING
Actually test the product.
At minimum verify:

**Authentication**
- signup
- login
- logout
- protected routes

**Public search**
- real app search
- empty results
- API failure

**IPA**
- valid IPA
- invalid file
- malformed archive
- missing app bundle
- missing plist
- actual finding detection

**Analysis**
- critical issue
- warning
- suggestion
- clean result
- readiness calculation

**AI**
- Ollama available
- Ollama unavailable
- grounded explanation
- no hallucinated finding

**App Store Connect**
- invalid credentials
- successful authentication where available
- app discovery
- synchronization
- API errors

**Webhooks**
- valid signature
- invalid signature
- duplicate event
- event processing

**Credits**
- credit grant
- credit deduction
- zero balance
- ledger arithmetic

**Security**
- user cannot access another user's apps/checks
- private IPA files cannot be publicly accessed
- Apple private key never appears in frontend responses

---

## 64. DO NOT USE FAKE BACKENDS
During development, do not make fake APIs look like real functionality.
If an integration cannot be tested because credentials aren't available:
Build the real integration and provide an honest configuration/empty/error state.
Do not create fake App Store Connect data just to make the UI look complete.
Do not create fake reviews.
Do not create fake checks.
Do not create fake webhook events and display them as production events.
Test fixtures are acceptable only inside automated tests and must never appear as real user data.

---

## 65. MVP PRIORITY
Build in this order:

**Phase 1 — Foundation**
- React/Vite/TypeScript
- Tailwind
- routing
- Supabase connection
- database
- RLS
- authentication
- base layout

**Phase 2 — Public experience**
- landing
- Apple app search
- real results
- public app preview
- locked analysis

**Phase 3 — Workspace**
- dashboard
- My Apps
- app details
- credits
- empty states

**Phase 4 — Preflight**
- IPA upload
- Storage
- extraction
- analysis engine
- findings
- readiness
- results UI

**Phase 5 — AI**
- Ollama provider
- AI explanations
- caching
- failure handling
- rejection solver

**Phase 6 — App Store Connect**
- credentials
- JWT
- connection
- app discovery
- sync
- connected app dashboard

**Phase 7 — Monitoring**
- webhook endpoint
- signature verification
- event processing
- activity timeline
- notifications
- Realtime

**Phase 8 — Connected data**
- TestFlight
- reviews
- supported metadata/status information

**Phase 9 — Recheck and reports**
- history
- comparison
- reports
- credit enforcement
- settings

**Phase 10 — Verification**
Test the complete journey from:
```text
Public search
→ signup
→ dashboard
→ upload IPA
→ analysis
→ findings
→ AI explanation
→ fix
→ recheck
→ compare
→ App Store Connect
→ monitoring
→ notification
→ rejection solver
```

---

## 66. IMPORTANT: BUILD INCREMENTALLY
Do not attempt to generate the entire codebase blindly in one huge operation.
Build a working foundation first.
After each major phase:
1. Run/build/test it.
2. Fix errors.
3. Verify the feature actually works.
4. Continue to the next phase.
Do not move forward while the previous foundation is fundamentally broken.

---

## 67. DO NOT ASK UNNECESSARY QUESTIONS
Make reasonable engineering decisions yourself.
Only ask me something if it is genuinely impossible to proceed without a decision.
Do not repeatedly ask for permission to create normal files, components, migrations or functions.
You have permission to build the product described here.

---

## 68. DO NOT CHANGE THE PRODUCT
Do not turn Fix It into:
- a generic debugging tool
- an AI coding assistant
- an app development platform
- a native iOS app
- a generic SaaS analytics dashboard
- a generic App Store scraper
The product remains:
**Fix It — Check your app before you submit it.**

---

## 69. DO NOT ADD USELESS FEATURES
Do not add:
- social feed
- chat between users
- unnecessary team features
- complex billing
- cryptocurrency
- gamification
- unnecessary analytics
- unnecessary AI agents
- unnecessary microservices
- unnecessary infrastructure
Build the useful MVP.

---

## 70. IMPORTANT ARCHITECTURE SUMMARY
The final architecture should essentially be:
```text
 FIX IT WEB APP
 │
 ▼
 React + Vite + TS
 │
 supabase-js
 │
 ▼
 ┌────────────────┐
 │   SUPABASE     │
 │                │
 │ Auth           │
 │ PostgreSQL     │
 │ Storage        │
 │ Edge Functions │
 │ Realtime       │
 └────────────────┘
 │ │ │
 │ │ └──── Ollama
 │ │
 │ └────────── App Store Connect
 │
 └──────────────── iTunes Search
```

---

## 71. NON-NEGOTIABLE RULES
Remember these throughout implementation:

1. **WEB APPLICATION ONLY.**
2. **NO IOS APP.**
3. **NO ANDROID APP.**
4. **NO NATIVE APPLICATION.**
5. **SUPABASE IS THE BACKEND.**
6. **OLLAMA IS THE FIRST AI PROVIDER.**
7. **NO PAYMENT SYSTEM.**
8. **NO STRIPE.**
9. **NO FAKE DATA.**
10. **AI DOES NOT CREATE FINDINGS.**
11. **THE DETERMINISTIC ANALYSIS ENGINE IS THE SOURCE OF TRUTH.**
12. **APPLE DATA MUST COME FROM REAL APPLE APIs/WEBHOOKS.**
13. **PRIVATE CREDENTIALS NEVER GO TO THE BROWSER.**
14. **DO NOT CLAIM APPLE APPROVAL.**
15. **DO NOT BUILD USELESS FEATURES.**
16. **DO NOT REPLACE SUPABASE WITH A CUSTOM BACKEND WITHOUT A REAL TECHNICAL REASON.**
17. **DO NOT STOP AT A PLAN. ACTUALLY BUILD.**

---

## 72. START NOW
You have the complete product requirements.
You are authorized to start implementation immediately.
Do NOT return another planning document.

Do NOT ask me to approve the architecture.
Do NOT say "here is what I would build."
**BUILD IT.**

Start with:
**Phase 1 — Foundation**
and continue through the phases in order.

After implementation, report:
1. What was actually built
2. What is working
3. What was tested
4. Any genuine blockers
5. What remains to be implemented

But the primary task is:
**BUILD FIX IT.**
