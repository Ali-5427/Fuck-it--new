# FIX IT — MASTER END-TO-END PRODUCT BLUEPRINT

## 0. DOCUMENT PURPOSE

This is the master specification for **Fix It**.

It defines:

* what Fix It is
* who it serves
* the complete user journey
* the product modules
* the data model
* the analysis engine
* AI behavior
* screenshot analysis
* metadata analysis
* App Store Connect integration
* monitoring
* rejection handling
* fix verification
* history and memory
* notifications
* reports
* security
* architecture
* UI behavior
* testing
* development order
* rules an AI coding agent must never violate

This document is the source of truth for the product.

The objective is not to build a collection of disconnected tools.

The objective is to build one continuous system that helps an iOS developer move through the entire App Store lifecycle.

---

# 1. PRODUCT IDENTITY

## Product

**Fix It**

## Core promise

**Check your app before you submit it.**

## Expanded promise

Fix It helps developers:

**Prepare → Check → Understand → Fix → Recheck → Submit → Monitor → Handle Rejection → Fix Again → Resubmit**

Fix It is not merely:

* an AI chatbot
* a generic debugging tool
* an App Store scraper
* a screenshot analyzer
* a rejection explainer

It is a lifecycle product centered around **App Store readiness and review problems**.

---

# 2. WHO FIX IT IS FOR

Primary users:

* indie iOS developers
* solo developers
* solo founders
* AI-assisted app builders
* small startups
* small development teams
* developers preparing their first App Store submission
* developers repeatedly shipping updates
* developers who have already experienced App Review friction

Ideal early customer:

A developer who has built an app and is thinking:

> "I don't want to submit this and discover a problem afterward."

Another ideal customer:

> "Apple rejected me and I don't understand exactly what I need to change."

Another:

> "I fixed the rejection. Is the new build actually clean?"

Another:

> "I don't want to manually keep checking App Store Connect."

Fix It should serve all four situations through the same product.

---

# 3. THE CORE PRODUCT IDEA

The product should be understood as one continuous lifecycle.

```text
IDEA / DEVELOPMENT
        ↓
APP PREPARATION
        ↓
UPLOAD / CONNECT
        ↓
PRE-FLIGHT ANALYSIS
        ↓
IPA + METADATA + SCREENSHOTS + OTHER INPUTS
        ↓
DETERMINISTIC FINDINGS
        ↓
AI EXPLANATION
        ↓
FIX
        ↓
RECHECK
        ↓
COMPARE
        ↓
READY TO SUBMIT
        ↓
APP STORE CONNECT
        ↓
SUBMISSION / REVIEW
        ↓
      ┌───────────────┐
      │               │
   APPROVED        REJECTED
      │               │
      ↓               ↓
   MONITOR      REJECTION ANALYSIS
                      ↓
                 FIX CHECKLIST
                      ↓
                  NEW BUILD
                      ↓
                  RECHECK
                      ↓
                   RESCAN
                      ↓
                  RESUBMIT
                      ↓
                   MONITOR
                      ↓
                  APPROVED
```

This lifecycle is the product.

---

# 4. THE MOST IMPORTANT PRODUCT PRINCIPLE

Fix It must distinguish between:

### FACTS

Facts come from actual sources.

Examples:

* IPA contents
* Info.plist
* provisioning profile
* metadata supplied by user
* screenshots uploaded by user
* App Store Connect API
* App Store public data
* actual webhook events
* actual rejection text

### DETERMINISTIC ANALYSIS

The analysis engine decides whether a technically verifiable condition exists.

Example:

```text
IPA
↓
Info.plist
↓
NSCameraUsageDescription missing
↓
Finding created
```

The AI does not invent this finding.

### AI INTERPRETATION

AI explains the actual finding.

Example:

```text
Finding:
Missing camera usage description

AI:
What this means
Why it matters
What to change
What to check afterward
```

### USER ACTION

The developer changes the app.

### VERIFICATION

Fix It analyzes the new state and determines whether the previous issue is actually gone.

This distinction must exist throughout the architecture.

---

# 5. ABSOLUTE NO-FABRICATION RULE

Fix It must never fabricate:

* App Store apps
* app names
* developers
* ratings
* reviews
* builds
* versions
* Apple statuses
* TestFlight information
* analytics
* findings
* readiness
* scores
* notifications
* webhook events
* rejection reasons
* AI conclusions
* Apple approval
* policy compliance

If data does not exist:

show:

* unavailable
* not connected
* not checked
* no data
* not supported yet

Never replace missing information with fake UI data.

---

# 6. FIX IT IS A WEB APPLICATION

Fix It itself is:

**ONE WEB APPLICATION**

Not:

* iOS app
* Android app
* macOS app
* Windows app
* Swift application
* SwiftUI application
* Xcode project
* React Native application
* Flutter application
* native desktop app

The customer may upload and analyze an iOS build.

Fix It remains a browser-based developer product.

---

# 7. TECHNOLOGY ARCHITECTURE

## Frontend

Use:

* React
* Vite
* TypeScript
* Tailwind CSS
* React Router
* TanStack React Query
* Supabase JavaScript client
* Lucide icons

Use strict TypeScript.

Do not introduce unnecessary global state libraries.

---

# 8. BACKEND

Use Supabase for the backend.

Components:

* Supabase Auth
* Supabase PostgreSQL
* Supabase Storage
* Supabase Edge Functions
* Supabase Realtime where useful

Do not introduce additional infrastructure unless a real technical limitation requires it.

Avoid unnecessary:

* custom Node server
* Express
* Hono
* Bun backend
* Redis
* Kafka
* RabbitMQ
* Kubernetes
* microservices
* AWS S3
* custom authentication

The default architecture should remain simple.

---

# 9. HIGH-LEVEL SYSTEM ARCHITECTURE

```text
                     FIX IT WEB APP
                           │
                           ▼
                React + Vite + TypeScript
                           │
                           ▼
                      supabase-js
                           │
                           ▼
               ┌─────────────────────┐
               │      SUPABASE       │
               │                     │
               │ Auth                │
               │ PostgreSQL          │
               │ Storage             │
               │ Edge Functions      │
               │ Realtime             │
               └─────────────────────┘
                   │       │      │
                   │       │      └──── App Store Connect
                   │       │
                   │       └────────── Ollama / AI
                   │
                   └────────────────── iTunes Search
```

---

# 10. APPLICATION MODULES

Fix It should be organized around these major modules.

## Module A — Public Experience

* landing page
* App Store search
* public app preview
* locked analysis preview

## Module B — Authentication

* signup
* login
* logout
* session persistence
* protected routes

## Module C — Workspace

* dashboard
* My Apps
* app details
* history
* credits
* notifications
* settings

## Module D — Preflight Analysis

* IPA upload
* extraction
* binary metadata
* Info.plist inspection
* permission checks
* provisioning checks
* URL checks
* icon checks
* localization checks
* deterministic findings
* readiness

## Module E — Visual/App Store Material Analysis

* screenshot checking
* metadata checking
* review notes checking
* privacy-related inputs
* submission material consistency

## Module F — AI Explanation

* finding explanation
* fix guidance
* evidence-based reasoning
* follow-up checks
* explanation caching

## Module G — Rejection Solver

* rejection input
* guideline interpretation
* likely issue
* suggested changes
* next steps
* response generation

## Module H — Recheck and Verification

* new build
* new scan
* comparison
* fixed issues
* remaining issues
* new issues
* fix verification

## Module I — App Store Connect

* credential connection
* server-side JWT
* app discovery
* versions
* builds
* metadata
* TestFlight
* reviews
* status

## Module J — Monitoring

* webhooks
* synchronization
* change detection
* notifications
* activity timeline

## Module K — Reports and History

* reports
* comparisons
* review history
* rejection history
* app lifecycle history

---

# 11. PUBLIC USER JOURNEY

A visitor arrives at Fix It.

They can:

```text
Landing page
    ↓
Search App Store
    ↓
Real Apple public app result
    ↓
Open app preview
    ↓
See real public information
    ↓
See locked Fix It analysis area
    ↓
"Sign up to run Fix It on your app."
```

The locked area must not secretly contain fake scores or analysis.

---

# 12. AUTHENTICATION

Use Supabase Auth.

Support:

* signup
* login
* logout
* session persistence
* protected routes

Initially:

**email/password**

After authentication:

```text
User
 ↓
Dashboard
 ↓
Add app
```

Users must only access their own private information.

---

# 13. DASHBOARD

The dashboard is the command center.

It should contain:

```text
Fix It

Check your app before you submit it.

[ Check an App ]

My Apps

Recent Checks

Latest Results

Issues

Connected Apps

Monitoring

Notifications

Credits
```

Do not overload it with analytics.

The dashboard is primarily about:

**What should I do next?**

---

# 14. APP OBJECT

Every user app should become a persistent entity.

An app should have:

* Fix It app ID
* name
* icon
* bundle ID
* source
* iTunes ID when available
* creation timestamp
* last updated timestamp
* latest check
* latest readiness
* current version/build
* App Store Connect connection status
* monitoring status
* lifecycle history

An app should not be treated as one isolated scan.

Fix It should build a long-term record for it.

---

# 15. APP SOURCES

An app can originate from:

### Public App Store

User discovers it through public Apple search.

### IPA Upload

User creates or selects an app inside Fix It and uploads an IPA.

### App Store Connect

User connects Apple credentials and selects an actual app.

### User-provided data

Metadata, screenshots, rejection text, etc.

Every source should be recorded.

---

# 16. PRE-FLIGHT INPUTS

Fix It should eventually support multiple categories of evidence.

### Build

* IPA
* version
* build number
* bundle ID
* binary metadata
* Info.plist
* provisioning information

### App Store material

* name
* subtitle
* description
* keywords
* category
* age rating
* privacy information
* URLs
* review notes
* support information

### Visual material

* screenshots
* app preview assets
* localized screenshot sets

### Review material

* reviewer instructions
* test credentials
* previous rejection messages

### Commercial functionality

* subscriptions
* IAP metadata
* associated configurations where available

---

# 17. IPA PIPELINE

The pipeline:

```text
Upload IPA
 ↓
Validate file
 ↓
Store privately
 ↓
Create check
 ↓
Extract archive
 ↓
Locate app bundle
 ↓
Locate Info.plist
 ↓
Inspect binary metadata
 ↓
Inspect provisioning profile where possible
 ↓
Run deterministic checks
 ↓
Create findings
 ↓
Calculate readiness
 ↓
Store result
 ↓
AI explanation layer
 ↓
Results UI
```

The deterministic result is the source of truth.

---

# 18. IPA CHECK CATEGORIES

## A. Binary/build

Where technically determinable:

* supported architecture
* minimum iOS version
* bundle information
* version
* build number
* application identifier
* required metadata

## B. Info.plist

Check:

* relevant required keys
* malformed values
* permission usage descriptions
* URL configuration
* ATS exceptions
* icon configuration

## C. Permissions

Where a declared capability/framework maps to a required usage description:

verify the appropriate key exists.

Do not claim complete compliance where static evidence is insufficient.

## D. Icons

Check:

* icon declarations
* required sizes/configuration
* deterministically observable inconsistencies

## E. Provisioning

Where available:

* expiration
* distribution type
* missing profile data
* obvious configuration problems

## F. URLs

Where technically testable:

* reachability
* response failure

If reliable network testing is not possible:

```text
Unavailable to verify
```

Never convert unavailable into pass.

## G. Localization

Where deterministically detectable:

* missing localized metadata
* incomplete expected resources

---

# 19. FINDING MODEL

Each finding should contain:

```text
finding_id
check_id
category
severity
code
title
what_was_found
why_it_matters
how_to_fix
evidence
created_at
```

Severity:

### Critical

A problem that can make the submission materially problematic.

### Warning

A meaningful risk requiring review/fix.

### Suggestion

A lower-confidence or improvement-oriented item.

Never exaggerate severity.

---

# 20. FINDING EVIDENCE

Every finding should be traceable to evidence.

Example:

```text
Finding:
Missing NSCameraUsageDescription

Evidence:
Detected camera-related capability
Info.plist key absent

Source:
upload_analysis

Confidence:
Deterministic
```

The UI should make it possible to understand:

> Why did Fix It create this issue?

---

# 21. READINESS MODEL

For the initial deterministic model:

### READY

0 critical issues
and
0 warnings

### NEEDS ATTENTION

0 critical issues
and
at least 1 warning

### NOT READY

At least 1 critical issue

### NOT CHECKED

No analysis has run.

Do not create artificial readiness percentages.

A numeric score is optional and should not be introduced merely because dashboards look more impressive with numbers.

---

# 22. AI EXPLANATION ENGINE

AI is an interpretation layer.

AI receives:

```text
finding
+
evidence
+
relevant available context
+
policy/reference context when available
```

AI returns structured guidance.

For each issue:

### What is this?

Explain the technical issue in simple language.

### Why does it matter?

Explain why the issue may create risk.

### What should I change?

Give concrete implementation guidance.

### How do I verify it?

Explain what should be checked after the fix.

### What does Fix It actually know?

Be explicit where evidence is incomplete.

AI must never create a new finding just because it thinks something sounds risky.

---

# 23. AI GROUNDING MODEL

The AI should follow:

```text
FACTS
 ↓
EVIDENCE
 ↓
GUIDELINE / REFERENCE
 ↓
INTERPRETATION
 ↓
ACTION
```

Not:

```text
AI guess
 ↓
fake issue
```

The AI should use cautious language when certainty is impossible.

Example:

> "This may create a review risk because..."

not:

> "Apple will definitely reject this."

---

# 24. POLICY-AWARE EXPLANATION

Where possible, important findings should contain:

* guideline reference
* relevant policy section
* source date/version if tracked
* evidence from the app
* explanation of the connection

The ideal result is:

```text
Potential issue
↓
Apple guideline/reference
↓
Evidence found in your app
↓
Why the evidence matters
↓
Recommended change
↓
What to verify afterward
```

This makes the result more trustworthy than an unexplained AI opinion.

---

# 25. AI PROVIDER ARCHITECTURE

Create an abstraction:

```text
AI Provider
 ├── Ollama
 └── Future provider(s)
```

The core product must not become dependent on one model implementation.

---

# 26. OLLAMA

For local development:

```text
Supabase/local function
        ↓
Ollama
        ↓
Local model
```

Configuration:

```text
OLLAMA_URL=
OLLAMA_MODEL=
```

Do not assume a specific model exists.

If the model is unavailable:

show:

> AI explanation is currently unavailable. Your Fix It results are still available.

The deterministic product must continue functioning without AI.

---

# 27. AI CACHING

Cache based on:

```text
subject
+
content hash
```

Equivalent findings should not require repeated AI generation unnecessarily.

Example:

```text
Finding A
Content Hash X
      ↓
AI explanation
      ↓
Cache

Same Finding A
Content Hash X
      ↓
Reuse cached explanation
```

This reduces unnecessary model calls.

---

# 28. SCREENSHOT CHECKER

Screenshot checking is a first-class product capability.

Inputs:

* screenshot images
* locale
* intended device context
* associated metadata where available

Possible deterministic/AI-supported checks:

* dimensions
* readability
* text visibility
* device framing
* metadata/screenshot inconsistency
* obvious claim mismatch
* localization completeness
* potential guideline concerns

Important:

Do not overclaim image analysis.

If a visual judgment is inherently subjective:

label it as an AI assessment or recommendation rather than deterministic fact.

---

# 29. SCREENSHOT RESULT

Instead of only returning:

> Screenshot issue

the ideal UI is:

```text
Screenshot 3

Potential issue:
The visible claim appears inconsistent with the current
app functionality provided to Fix It.

Why:
...

Recommended action:
...

Evidence:
Screenshot 3

Review:
AI assessment
```

Whenever technically possible, highlight the relevant area visually.

---

# 30. METADATA CHECKER

Check App Store metadata where the required information is available.

Examples:

* title
* subtitle
* description
* keywords
* URLs
* privacy policy
* support links
* age rating
* review information

The checker should identify:

* missing information
* inconsistencies
* malformed data
* obvious mismatches
* potential risks
* unsupported claims

Do not claim that metadata guarantees approval.

---

# 31. CROSS-MATERIAL CONSISTENCY

This can become one of the strongest product capabilities.

Compare:

```text
IPA
+
metadata
+
screenshots
+
review notes
+
subscription information
```

Look for inconsistencies.

Example:

```text
Screenshot says:
"Track your investments"

Description says:
"Budget management app"

Potential inconsistency
```

Another:

```text
Review notes say:
"Users can sign in using email"

But available evidence:
Login path may not match instructions
```

The goal is:

**Catch contradictions before Apple does.**

---

# 32. FIX WORKFLOW

Every finding should become actionable.

```text
Issue
 ↓
Understand
 ↓
Fix
 ↓
Upload new build
 ↓
Recheck
```

The product should not terminate at the report.

---

# 33. ISSUE STATES

Each issue should support:

* Open
* Fixed
* Ignored

Important distinction:

**User marking an issue Fixed is not the same as Fix It verifying it is fixed.**

The system should be able to show:

```text
Developer status:
Marked as fixed

Fix It verification:
Not yet verified
```

After a new scan:

```text
Verified resolved
```

---

# 34. FIX VERIFICATION

This is a major long-term feature.

Example:

Previous finding:

```text
Login / Reviewer Access
```

Developer uploads build `2.5.1`.

Fix It runs analysis.

The system compares the new evidence against the previous issue.

Result:

```text
Previous issue

Login / Reviewer Access

New Build:
2.5.1

✓ Login flow evidence detected
✓ Review credentials present
✓ Review instructions present
✓ Relevant authentication path detected

STATUS:
RESOLVED
```

When evidence does not support resolution:

```text
STATUS:
STILL PRESENT
```

When the system cannot determine:

```text
STATUS:
UNABLE TO VERIFY
```

Never call something fixed merely because the user clicked "Fixed."

---

# 35. RECHECK

Recheck workflow:

```text
Previous Check
      ↓
Upload New IPA
      ↓
New Check
      ↓
Run Analysis
      ↓
Compare
```

---

# 36. COMPARISON ENGINE

Compare two real checks.

Three important states:

### Fixed

Previous finding exists.

New check no longer contains it.

### Remaining

Previous finding still exists.

### New

New finding appears that did not exist in the earlier check.

Example:

```text
CHECK #1

Critical: 2
Warnings: 4

        ↓ developer fixes

CHECK #2

Critical: 0
Warnings: 2

Fixed: 4
Remaining: 2
New: 0
```

---

# 37. READINESS PROGRESSION

Show the actual state transition.

Example:

```text
NOT READY
    ↓
NEEDS ATTENTION
    ↓
READY
```

Or:

```text
READY
    ↓
New build
    ↓
NOT READY
```

This is important because a new build can introduce new problems.

---

# 38. READY-TO-SUBMIT EXPERIENCE

When the deterministic requirements are satisfied:

```text
YOUR APP IS READY TO SUBMIT
```

Explain:

> Fix It's implemented checks found no critical issues or warnings.

Then explicitly clarify:

> This does not mean Apple has approved your app.

Never imply guaranteed approval.

---

# 39. SUBMISSION CHECKLIST

The final checklist can aggregate:

* build
* screenshots
* metadata
* privacy
* URLs
* reviewer notes
* login information
* IAP
* subscriptions
* age rating
* supported material
* detected issues

Example:

```text
READY TO SUBMIT

✓ Build
✓ Metadata
✓ Screenshots
✓ Privacy
✓ Review notes
✓ Login information
✓ IAP

0 critical
0 warnings
```

---

# 40. APP STORE CONNECT CONNECTION

The developer enters:

* Issuer ID
* Key ID
* `.p8` private key

Credentials must go to server-side processing.

Never expose the private key back to frontend code.

Never log it.

Server generates JWT for Apple API communication.

---

# 41. APP STORE CONNECT DISCOVERY

After a successful connection:

```text
App Store Connect
 ↓
Retrieve apps
 ↓
Show actual apps
 ↓
Developer selects app
 ↓
Save connection
```

Show:

* app name
* bundle ID
* Apple app ID
* versions
* builds
* statuses where available

---

# 42. APP STORE CONNECT SYNC

Sync available real information:

* app
* versions
* builds
* status
* metadata
* TestFlight/pre-release data
* reviews
* other supported information

Avoid aggressive polling.

Prefer:

* user-triggered sync
* webhooks where available
* appropriate API fallback

---

# 43. CONNECTED APP DASHBOARD

Once connected, an app can have:

```text
APP

MyApp

Version:
2.5.0

Build:
250

Last Fix It scan:
Today

Readiness:
READY

App Store Connect:
CONNECTED

Monitoring:
ON

Last sync:
...
```

The information must be real.

---

# 44. CONTINUOUS MONITORING

The long-term workflow:

```text
APP STORE CONNECT
       ↓
APPLE EVENT / SYNC
       ↓
WEBHOOK EDGE FUNCTION
       ↓
VERIFY EVENT
       ↓
STORE EVENT
       ↓
PROCESS CHANGE
       ↓
DETERMINE IMPACT
       ↓
CREATE ACTIVITY
       ↓
CREATE NOTIFICATION
       ↓
USER DASHBOARD
```

---

# 45. WEBHOOK SECURITY

For webhook events:

* verify signature
* reject invalid signatures
* deduplicate event IDs
* process idempotently
* store raw payload safely
* store validation result

Example:

```text
Webhook received
 ↓
Signature verification
 ↓
Invalid → 401
Valid → process
```

Never process unverified events.

---

# 46. CHANGE DETECTION

The monitoring system should eventually detect meaningful changes.

Examples:

```text
New build detected
Metadata changed
Screenshot set changed
Version status changed
Review status changed
TestFlight information changed
Review received
```

When a meaningful change occurs, Fix It can determine whether another review-risk analysis should be considered.

---

# 47. SMART CHANGE → RISK FLOW

Long-term intelligent flow:

```text
Change detected
      ↓
What changed?
      ↓
Build?
Metadata?
Screenshot?
Subscription?
Version?
      ↓
Does this affect known review risks?
      ↓
YES → create new review-risk signal
NO → store activity only
```

Example:

```text
Screenshots changed
 ↓
Compare previous screenshots
 ↓
Potential mismatch detected
 ↓
Create review-risk notification
```

This is where Fix It becomes a continuous guardian rather than a one-time scanner.

---

# 48. NOTIFICATIONS

Notification center can contain real events such as:

* Build processed
* Version status changed
* Review status changed
* App rejected
* App approved
* TestFlight feedback
* Action required
* New review risk detected

Every notification needs a real source.

---

# 49. ACTIVITY TIMELINE

Each connected app gets a timeline.

Example:

```text
TODAY

Build 42 processed

Yesterday

Version 1.2 status changed

Aug 28

TestFlight feedback received
```

Eventually:

```text
Sep 15
Build 2.5.1 uploaded

Sep 15
Fix It detected 2 warnings

Sep 16
Issues resolved

Sep 16
App submitted

Sep 17
In Review

Sep 17
Rejected

Sep 17
Rejection analyzed

Sep 18
Build 2.5.2 uploaded

Sep 18
Previous issues verified resolved

Sep 19
Approved
```

This becomes the app's review history.

---

# 50. TESTFLIGHT

Where real API data is available, show:

* builds
* processing status
* beta versions
* tester/group information where available
* feedback/diagnostic information where available

If data is unavailable:

do not display artificial zeroes.

Use:

```text
No TestFlight data available
```

or an equivalent honest state.

---

# 51. CUSTOMER REVIEWS

Where available:

* rating
* title
* body
* date
* version
* developer response

Never create fake review information.

---

# 52. APP REVIEW HISTORY

Every app should eventually maintain a review-history record.

Example:

```text
VERSION 2.3
Rejected
Guideline 2.1
Status: Fixed

VERSION 2.4
Rejected
Guideline 5.1.1
Status: Fixed

VERSION 2.5
Approved
```

This allows Fix It to build persistent context around the app.

---

# 53. APP MEMORY

The app should become increasingly intelligent over time.

Example:

```text
This app has previously experienced:
- login/reviewer access issue
- metadata issue
- privacy-related issue
```

When a new build arrives:

Fix It can prioritize checks relevant to the app's history.

Example:

```text
⚠ Previous recurring risk

Reviewer access

This app has previously had an issue
in this area.

Run verification
```

This should always be based on stored real history.

Never pretend the system remembers something it did not store.

---

# 54. REJECTION SOLVER

Route:

```text
/rejection-solver
```

Input:

* Apple rejection message
* optional app association
* optional existing check
* optional build information
* optional previous history

AI should produce:

### What Apple is saying

Plain-English interpretation.

### Likely issue

Based strictly on supplied evidence.

### Guideline area

Where supportable.

### What needs to change

Practical next actions.

### What to check afterward

Specific verification steps.

### Suggested response

Professional draft that the developer can edit.

---

# 55. REJECTION RESPONSE GENERATOR

Long-term flow:

```text
Apple rejection
+
changes made
+
guideline
+
evidence
+
review instructions
↓
Generate response draft
↓
Developer edits
↓
Developer submits
```

The generated response must never claim certainty or guarantee approval.

---

# 56. REJECTION → FIX → VERIFICATION

The ideal rejection workflow:

```text
REJECTED
    ↓
Upload rejection
    ↓
Rejection Solver
    ↓
Understand issue
    ↓
Generate fix checklist
    ↓
Developer changes app
    ↓
Upload new IPA
    ↓
Fix It rechecks
    ↓
Compare against rejection-related risk
    ↓
Verify resolved
    ↓
Ready to resubmit
    ↓
Resubmit
    ↓
Monitor
```

This is one of the strongest expressions of the end-to-end product.

---

# 57. REPORTS

Every completed check should have a report.

Report contains:

* app
* version
* build
* date
* readiness
* critical findings
* warnings
* suggestions
* evidence
* fixed issues
* remaining issues
* new issues
* recommendations

Provide:

* in-app report
* practical export where feasible

Do not allow report infrastructure to delay core product functionality.

---

# 58. HISTORY

App history should contain:

* checks
* versions
* builds
* readiness
* findings
* comparisons
* rejection analyses
* monitoring events
* status changes
* notifications
* review activity
* fix verification

The history should become the long-term memory of the app.

---

# 59. CREDITS

Initial MVP can use internal credits.

No payment system required.

Example:

```text
1 credit = preflight
1 credit = AI explanation
1 credit = rejection analysis
```

Use a ledger.

Do not rely on a manually drifting numeric balance.

Credit balance:

```text
SUM(all ledger deltas)
```

Initial signup can receive starting credits.

When zero:

show honest messaging.

---

# 60. PAYMENT IS NOT PART OF THE INITIAL MVP

Do not build:

* Stripe
* checkout
* subscriptions
* billing portal
* payment processing

First prove:

```text
problem
↓
usage
↓
repeat usage
↓
value
↓
willingness to pay
```

Monetization can be added after validation.

---

# 61. DATA PROVENANCE

Every important displayed value should have a source.

Possible sources:

```text
itunes_search
asc_api
upload_analysis
screenshot_analysis
user_input
webhook_event
rejection_input
```

UI should never imply:

> "Apple says..."

when the information came from:

> user input

Similarly:

AI-generated interpretation must not be represented as direct Apple data.

---

# 62. SECURITY

Implement necessary security only.

Required:

* Supabase Auth
* RLS
* private Storage
* server-side Apple credentials
* encrypted secrets where appropriate
* webhook signature verification
* private uploads
* signed access
* practical rate limiting
* sanitized errors
* no private key logging
* no service-role credentials in frontend

Do not create enterprise infrastructure unnecessarily.

---

# 63. PRIVATE FILE STORAGE

IPA files should live in a private bucket.

Example:

```text
ipa-uploads/
    {user_id}/
        {check_id}.ipa
```

Files should not be public.

Only authorized processing should access them.

Start with a reasonable MVP file limit such as 200 MB, adjusting where infrastructure requires it.

---

# 64. ACCESS CONTROL

### Public

* landing
* public search
* public app preview
* login
* signup

### Authenticated

* dashboard
* apps
* checks
* results
* rejection solver
* notifications
* reports
* settings
* App Store Connect

Users must only access their own private data.

---

# 65. CORE DATABASE MODEL

Core entities:

```text
profiles
credits_ledger
apps
asc_connections
connected_apps
checks
findings
finding_states
check_comparisons
reports
rejection_analyses
ai_explanations
webhook_events
activity_events
notifications
beta_snapshots
reviews
```

Potential future entities:

```text
app_materials
screenshots
metadata_snapshots
policy_references
fix_verifications
review_events
submission_events
```

These should only be added when needed.

---

# 66. RELATIONSHIP MODEL

Conceptually:

```text
USER
 │
 ├── APPS
 │    │
 │    ├── CHECKS
 │    │    ├── FINDINGS
 │    │    ├── AI EXPLANATIONS
 │    │    ├── REPORTS
 │    │    └── COMPARISONS
 │    │
 │    ├── APP STORE CONNECT CONNECTION
 │    │
 │    ├── MONITORING EVENTS
 │    │
 │    ├── REJECTIONS
 │    │
 │    └── HISTORY
 │
 ├── NOTIFICATIONS
 │
 └── CREDITS
```

---

# 67. IMPORTANT STATE MACHINE

An individual app can conceptually move through:

```text
NOT_CHECKED
      ↓
CHECKED
      ↓
ISSUES_FOUND
      ↓
FIXING
      ↓
RECHECKED
      ↓
READY
      ↓
SUBMITTED
      ↓
WAITING_FOR_REVIEW
      ↓
IN_REVIEW
      ↓
APPROVED
```

Or:

```text
IN_REVIEW
    ↓
REJECTED
    ↓
REJECTION_ANALYZED
    ↓
FIXING
    ↓
RECHECKED
    ↓
RESUBMITTED
    ↓
IN_REVIEW
```

These states should be based on actual data.

---

# 68. UI PRINCIPLES

The product should feel like a serious developer tool.

Use:

* clean white/light surfaces
* subtle borders
* restrained shadows
* clear typography
* compact tables
* monospace for IDs/build/version
* semantic red/amber/green states
* blue primary actions

Avoid:

* excessive gradients
* giant animations
* decorative clutter
* giant enterprise dashboards
* fake metrics

---

# 69. RESULTS PAGE

Example structure:

```text
MyApp
v2.5.1
Build 251

READY

0 Critical
1 Warning
4 Suggestions

--------------------------------

Critical
None

Warnings

[ Login reviewer access ]
Potential issue...

[ Open ]

Suggestions

...

--------------------------------

AI Explanation
[ Explain ]

Evidence
[ View ]

Previous Check
[ Compare ]

Run Recheck
```

The result should answer:

**What happened?**

**Why?**

**What should I do?**

**Did my fix work?**

---

# 70. RESULT DETAILS

Every finding should support:

```text
TITLE

Severity

What we found

Why it matters

Evidence

Apple / guideline reference
when available

How to fix

What to check afterward

Status

AI explanation
```

---

# 71. AI EXPLANATION UX

Do not dump a giant AI answer.

Use sections:

```text
What this means

Why it matters

What to change

How to verify the fix
```

Potential action:

```text
[ Mark Fixed ]
[ Explain More ]
```

But verification must later determine whether it is actually resolved.

---

# 72. NO FAKE LOADING

Use real processing stages.

Example:

```text
Uploading
Extracting
Analyzing
Saving results
Complete
```

Never show:

```text
43%
68%
91%
```

unless actual measurable progress exists.

---

# 73. ERROR HANDLING

User-facing errors must be understandable.

Example:

### Upload

> We couldn't upload this build. Try again.

### Invalid IPA

> This file doesn't contain a valid iOS app bundle Fix It can analyze.

### Apple connection

> Fix It couldn't connect to App Store Connect. Check your API credentials and access.

### AI unavailable

> AI explanation is unavailable right now. Your Fix It result is still available.

Never show raw stack traces to normal users.

---

# 74. APP STORE SEARCH

Public search should use Apple's real public search data.

Return only fields actually supplied.

Potential fields:

* app name
* seller
* category
* icon
* rating when available
* App Store ID
* other available metadata

Do not fabricate missing information.

---

# 75. PUBLIC APP PREVIEW

Example:

```text
App icon
App name
Developer
Category
Rating

Real public information

-------------------------

FIX IT ANALYSIS

[Locked preview]

Sign up to run Fix It on your app.
```

The locked region is an access gate, not fake analytics.

---

# 76. EDGE FUNCTIONS

Possible structure:

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

Shared code:

```text
_shared/
```

Combine functions where doing so makes the system simpler.

Do not create dozens of tiny functions.

---

# 77. ANALYSIS ENGINE ARCHITECTURE

The engine should be modular.

Conceptually:

```text
ANALYSIS PIPELINE

Input
 ↓
Extractor
 ↓
Artifact parser
 ↓
Check registry
 ↓
Individual checks
 ↓
Structured findings
 ↓
Finding normalization
 ↓
Persistence
 ↓
Readiness calculator
 ↓
AI explanation
```

Possible internal checks:

```text
BinaryArchitectureCheck
BundleIdentifierCheck
VersionCheck
BuildNumberCheck
InfoPlistCheck
PermissionCheck
IconCheck
ProvisioningCheck
URLCheck
LocalizationCheck
```

Each check should produce structured results.

---

# 78. CHECK RESULT CONTRACT

Each deterministic check should conceptually return:

```text
check_code
status
severity
title
detail
evidence
source
```

Possible status:

```text
PASS
FAIL
WARNING
UNAVAILABLE
NOT_APPLICABLE
```

This prevents the system from confusing unavailable data with passed data.

---

# 79. AI INPUT CONTRACT

AI should receive structured context.

Example:

```text
Finding:
...

Severity:
Warning

Evidence:
...

Source:
upload_analysis

Relevant policy reference:
...

Existing app context:
...

Previous state:
...
```

The AI should not have authority to mutate deterministic findings.

---

# 80. AI OUTPUT CONTRACT

Prefer structured output.

Example:

```text
summary
why_it_matters
recommended_action
verification_steps
caution
```

The frontend renders this rather than trusting arbitrary AI formatting.

---

# 81. AI SAFETY AGAINST HALLUCINATION

Rules:

1. Do not invent evidence.
2. Do not invent Apple status.
3. Do not invent findings.
4. Do not invent guideline references.
5. Do not claim certainty when evidence is incomplete.
6. Do not promise approval.
7. Do not turn unsupported assumptions into facts.

---

# 82. POLICY UPDATE SYSTEM — FUTURE

Eventually create a policy reference layer.

Concept:

```text
Apple policy source
 ↓
policy document/version
 ↓
structured reference
 ↓
finding references policy
 ↓
AI uses current reference
```

Potential capabilities:

* guideline version
* last updated date
* affected checks
* change history

This can become one of Fix It's strongest long-term reliability systems.

---

# 83. APP-SPECIFIC RISK PROFILE — FUTURE

Over multiple checks:

```text
APP REVIEW PROFILE

Most common historical risks:
1. Reviewer access
2. Metadata
3. Privacy configuration

Latest check:
...

Previous failures:
...

Previous resolved issues:
...
```

This is based on real stored history.

---

# 84. CHANGE-AWARE ANALYSIS — FUTURE

When a new build is detected:

```text
Previous state
      ↓
New state
      ↓
What changed?
      ↓
Which checks are affected?
      ↓
Run affected analysis
      ↓
Compare
```

This can reduce unnecessary work.

---

# 85. CONTINUOUS REVIEW-RISK ENGINE — FUTURE

Eventually:

```text
APP CONNECTED
      ↓
MONITOR CHANGES
      ↓
CHANGE DETECTED
      ↓
RISK RE-EVALUATION
      ↓
NO ISSUE
    OR
NEW RISK
      ↓
NOTIFICATION
```

This is the long-term vision behind the product.

---

# 86. COMPLETE CUSTOMER EXPERIENCE

A fully developed Fix It journey:

```text
1. Developer builds app

2. Developer opens Fix It

3. Developer adds app

4. Uploads IPA

5. Uploads supporting material

6. Fix It analyzes build

7. Fix It analyzes screenshots

8. Fix It checks metadata

9. Fix It detects issues

10. Fix It explains issues

11. Developer fixes issues

12. Developer uploads new build

13. Fix It rescans

14. Fix It verifies previous fixes

15. Fix It compares builds

16. App becomes ready to submit

17. Developer connects App Store Connect

18. Fix It syncs actual app data

19. Developer submits app

20. Fix It monitors status

21. Apple approves
OR
22. Apple rejects

23. If rejected:
    rejection enters Fix It

24. Fix It explains rejection

25. Fix It generates fix checklist

26. Fix It generates optional response draft

27. Developer fixes app

28. New build uploaded

29. Fix It verifies fixes

30. Fix It rescans

31. Developer resubmits

32. Fix It monitors again

33. App approved

34. Fix It retains the complete history
```

That is the **end-to-end product**.

---

# 87. PRODUCT PHILOSOPHY

Fix It should always answer one of these questions:

### Before submission

> What might be wrong?

### During fixing

> What exactly should I change?

### After fixing

> Did the change actually resolve it?

### During submission

> Is everything I can verify ready?

### During review

> What's happening?

### After rejection

> What is Apple saying?

### After rejection fix

> Did I actually resolve the previous problem?

This keeps the product focused.

---

# 88. WHAT NOT TO BUILD

Do not turn Fix It into:

* generic AI coding assistant
* generic debugging assistant
* generic analytics dashboard
* social network
* developer community
* project management tool
* app development platform
* native mobile app
* generic App Store scraper
* huge enterprise platform

Do not add:

* cryptocurrency
* gamification
* chat rooms
* unnecessary team collaboration
* unnecessary agents
* unnecessary infrastructure
* unnecessary billing complexity

The product remains:

**Fix It — Check your app before you submit it.**

---

# 89. MVP VS LONG-TERM VISION

## MVP

Build enough to validate:

```text
IPA
+
screenshots
+
metadata
↓
analysis
↓
findings
↓
AI explanation
↓
fix
↓
recheck
↓
comparison
↓
rejection solver
```

This is already enough to deliver real value.

## NEXT

Based on user demand:

```text
fix verification
submission checklist
rejection response generator
persistent history
```

## AFTER VALIDATION

```text
App Store Connect
↓
sync
↓
monitoring
↓
notifications
```

## LONG-TERM

```text
continuous monitoring
+
historical app memory
+
policy freshness
+
change-aware risk detection
+
review lifecycle intelligence
```

---

# 90. BUILD PRIORITY

## Phase 1 — Foundation

* React/Vite/TypeScript
* Tailwind
* routing
* Supabase
* database
* RLS
* authentication
* base layout

## Phase 2 — Public

* landing
* public Apple search
* app preview
* locked Fix It preview

## Phase 3 — Workspace

* dashboard
* My Apps
* app details
* credits
* notifications
* empty states

## Phase 4 — Preflight

* IPA upload
* Storage
* extraction
* deterministic checks
* findings
* readiness
* results UI

## Phase 5 — AI

* Ollama provider
* grounded explanation
* structured output
* caching
* unavailable handling

## Phase 6 — Visual/material analysis

* screenshot analysis
* metadata checks
* cross-material consistency

## Phase 7 — Recheck

* new build
* comparison
* fixed
* remaining
* new
* fix verification

## Phase 8 — Rejection

* rejection solver
* rejection history
* response generator

## Phase 9 — App Store Connect

* credentials
* server-side JWT
* connection
* app discovery
* sync

## Phase 10 — Monitoring

* webhook
* verification
* event processing
* timeline
* notifications
* Realtime

## Phase 11 — Connected data

* TestFlight
* reviews
* supported metadata/status

## Phase 12 — Long-term intelligence

* app memory
* policy references
* change-aware analysis
* recurring risk detection

---

# 91. DEVELOPMENT RULE

Do not build the entire system blindly.

After every major module:

```text
BUILD
 ↓
RUN
 ↓
TEST
 ↓
FIX
 ↓
VERIFY
 ↓
CONTINUE
```

Never stack ten broken modules together.

---

# 92. TEST MATRIX

## Authentication

* signup
* login
* logout
* session persistence
* protected routes

## Public search

* valid search
* empty results
* API failure
* malformed query

## IPA

* valid IPA
* invalid file
* malformed archive
* missing bundle
* missing plist
* unsupported structure

## Deterministic analysis

* critical issue
* warning
* suggestion
* clean result
* unavailable check

## AI

* provider available
* provider unavailable
* grounded explanation
* malformed model response
* hallucination-resistant context
* caching

## Screenshots

* valid image
* wrong dimensions
* multiple screenshots
* missing image
* visual assessment failure

## Recheck

* issue remains
* issue resolved
* new issue appears
* unable to verify

## App Store Connect

* invalid credentials
* valid credentials
* insufficient permissions
* app discovery
* sync
* pagination
* API error

## Webhooks

* valid signature
* invalid signature
* duplicate event
* malformed event
* idempotent processing

## Rejection solver

* normal rejection
* complex rejection
* missing context
* response generation

## Security

* user A cannot access user B
* private IPA unavailable publicly
* credentials never returned
* service-role key never reaches browser

---

# 93. OBSERVABILITY

Internally track:

* analysis failures
* AI failures
* upload failures
* Apple API failures
* webhook failures
* processing times
* check completion rate
* notification creation errors

Do not expose internal technical data to normal users.

---

# 94. LOGGING

Log useful operational information.

Never log:

* Apple private keys
* sensitive credentials
* private user secrets
* unnecessary raw private uploads

Logs should help debug system behavior without becoming a security problem.

---

# 95. PERFORMANCE PRINCIPLE

Keep MVP analysis lightweight.

Focus on:

* extraction
* plist parsing
* metadata inspection
* deterministic checks

Do not assume serverless functions can perform unlimited heavy processing.

If a task exceeds the environment's practical constraints:

implement the simplest reliable solution and clearly communicate limitations.

Never fake successful processing.

---

# 96. RESPONSIVE WEB

The application should remain usable on smaller screens.

But:

**responsive web is still web.**

Do not create a second native mobile application.

---

# 97. EMPTY STATES

Examples:

### No apps

> No apps yet. Check your first app.

### No checks

> No checks yet. Upload a build to start.

### No notifications

> You're all caught up.

### No reviews

> No reviews available.

### No monitoring

> Connect App Store Connect to start monitoring.

---

# 98. UX PRINCIPLE — ALWAYS SHOW THE NEXT ACTION

Fix It should not leave developers wondering:

> "Okay... what now?"

Every major result should provide a next step.

Examples:

```text
Issue found
→ View issue

Issue understood
→ Fix it

Developer fixed it
→ Upload new build

New build uploaded
→ Compare

Ready
→ Connect App Store Connect

Rejected
→ Analyze rejection

Rejection analyzed
→ Fix issue

Fix completed
→ Recheck
```

The interface should continuously move the developer forward.

---

# 99. THE MOST IMPORTANT LOOP

The highest-value loop is:

```text
CHECK
 ↓
FIND
 ↓
EXPLAIN
 ↓
FIX
 ↓
VERIFY
 ↓
CHECK AGAIN
```

The product should optimize for that loop.

---

# 100. THE RETENTION LOOP

The long-term retention loop is:

```text
Developer ships app
        ↓
Uses Fix It
        ↓
Fixes problems
        ↓
Submits
        ↓
App changes
        ↓
Fix It monitors
        ↓
New build
        ↓
Fix It checks again
        ↓
New review
        ↓
Rejection or approval
        ↓
Fix It helps
        ↓
Developer ships again
```

That means the customer naturally has reasons to return.

---

# 101. THE LONG-TERM MOAT

Do not think the moat is:

> "We have an AI."

The long-term advantage should come from:

### 1. App history

Fix It knows what happened previously.

### 2. Fix verification

Fix It knows whether problems actually disappeared.

### 3. Review lifecycle

Fix It stays with the developer before and after submission.

### 4. Evidence

Important conclusions are connected to actual evidence.

### 5. Policy freshness

References can remain aligned with current Apple guidance.

### 6. Change detection

Fix It notices meaningful changes.

### 7. Continuous monitoring

The product remains useful after the initial scan.

---

# 102. FINAL PRODUCT ARCHITECTURE

```text
                         FIX IT
                           │
                           ▼
                    DEVELOPER APP
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
         IPA          SCREENSHOTS       METADATA
          │                │                │
          └────────────────┼────────────────┘
                           ▼
                DETERMINISTIC ANALYSIS
                           │
                           ▼
                     FINDINGS
                           │
                           ▼
                  EVIDENCE / SOURCES
                           │
                           ▼
                   AI EXPLANATION
                           │
                           ▼
                         FIX
                           │
                           ▼
                       RECHECK
                           │
                           ▼
                      COMPARISON
                           │
                  ┌────────┴────────┐
                  ▼                 ▼
               REMAINING          FIXED
                  │                 │
                  └────────┬────────┘
                           ▼
                     READY TO SUBMIT
                           │
                           ▼
                  APP STORE CONNECT
                           │
                           ▼
                      SUBMISSION
                           │
                     APP REVIEW
                    /           \
                   /             \
                  ▼               ▼
             APPROVED          REJECTED
                │                 │
                ▼                 ▼
            MONITOR          REJECTION AI
                                  │
                                  ▼
                             FIX CHECKLIST
                                  │
                                  ▼
                              NEW BUILD
                                  │
                                  ▼
                             VERIFICATION
                                  │
                                  ▼
                               RESCAN
                                  │
                                  ▼
                              RESUBMIT
                                  │
                                  └──────► MONITOR
                                             │
                                             ▼
                                          APPROVED
```

---

# 103. FINAL NON-NEGOTIABLE RULES FOR THE AI CODING AGENT

The coding agent must remember:

1. Fix It is a web application.
2. Never create a native iOS application.
3. Supabase is the default backend.
4. Use real Apple data.
5. Never fabricate data.
6. The deterministic engine creates findings.
7. AI explains findings.
8. AI must not invent findings.
9. Never claim guaranteed Apple approval.
10. Never expose Apple private credentials to the browser.
11. Keep IPA files private.
12. Use RLS for user data.
13. Verify webhook signatures.
14. Deduplicate webhook events.
15. Use real loading states.
16. Do not show fake progress.
17. Do not show fake scores.
18. Do not turn unavailable data into a pass.
19. Do not create fake reviews.
20. Do not create fake notifications.
21. Do not create fake Apple statuses.
22. Do not build unnecessary infrastructure.
23. Keep the architecture simple.
24. Build incrementally.
25. Test every major phase.
26. Preserve source provenance.
27. Treat user-marked "fixed" separately from system-verified resolution.
28. Compare actual builds.
29. Maintain app history.
30. Keep AI grounded in supplied evidence.
31. Use cautious language where certainty is impossible.
32. The product must continue working when AI is unavailable.
33. The product must continue working when optional integrations are unavailable.
34. Always show the next useful action.
35. Do not change the product into a generic AI tool.

---

# 104. THE ONE-SENTENCE DEFINITION

If the entire product ever becomes confusing, return to this:

**Fix It helps an iOS developer find potential App Store problems, understand them, fix them, verify the fixes, submit the app, monitor what happens, understand rejection when it occurs, and get back to a clean resubmission.**

---

# 105. THE ULTIMATE PRODUCT LOOP

```text
BUILD
 ↓
CHECK
 ↓
UNDERSTAND
 ↓
FIX
 ↓
VERIFY
 ↓
SUBMIT
 ↓
MONITOR
 ↓
APPROVED
        OR
REJECTED
 ↓
UNDERSTAND
 ↓
FIX
 ↓
VERIFY
 ↓
RESUBMIT
 ↓
MONITOR
 ↓
APPROVED
```

That is Fix It.
