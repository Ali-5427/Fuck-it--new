# FIX IT — MASTER PRODUCT PLAN

One-line summary

Fix It: the final, trusted pre-submission and post-rejection assistant for solo iOS developers — focused on inspecting an iOS app, explaining issues in plain English, recommending exact fixes, and verifying changes so a single developer can move from build → checked → fixed → rechecked → ready to submit.

---

1) What Fix It is (short)

Fix It is an App Store submission and rejection assistant built for solo iOS developers. It inspects an app and its submission materials, finds risks, explains why they matter, recommends concrete fixes, and verifies improvements when the developer rechecks a new build.

---

2) Who Fix It is for (priority order)

- Primary: solo iOS developers (indie builders, first-time devs, solo founders) — one person with one app.
- Secondary (later): freelancers, small teams, agencies managing multiple apps.

Design principle: everything should be optimized for a single developer doing the whole submission flow.

---

3) The core promise (the product loop)

UPLOAD → CHECK → FIX → RECHECK → SUBMIT

The product should enable this loop and make each step fast, clear, and actionable.

---

4) What matters first (Phase A — Core)

These are absolutely core — build these before anything else:

1. Upload an app build and submission materials (metadata, screenshots, permissions text, reviewer notes).
2. Inspect what can be inspected automatically and mark what requires a manual check.
3. Detect problems and classify by severity: HIGH / MEDIUM / LOW / MANUAL CHECK.
4. For every problem, provide: Problem → Evidence → Why it matters → What to change (concrete next steps).
5. Present a single clear final state: NOT READY / READY WITH WARNINGS / NO HIGH-RISK ISSUES DETECTED.

Success criteria for Phase A:
- A solo developer can run a check and get a prioritized, actionable list of issues they understand and can act on.

---

5) What to build next (Phase B — The loop)

Add the loop and basic persistence that turn the checker into a product:

1. Recheck: allow uploading a new build and compare results to the previous check.
2. Show diffs: fixed vs remaining vs new issues (counts and example items).
3. Save app history: store checks per app and per version.
4. Final readiness report that can be exported/shared.

Why: this creates repeat usage and visible progress for the developer.

---

6) Important secondary workflow (Phase C — Rejection solver)

When an app has already been rejected, Fix It should:

1. Ingest the rejection notice (copy/paste or App Store Review screenshot/notes).
2. Translate Apple’s language into plain English: “Apple is saying …”.
3. Map rejection items to the app where possible and recommend fixes.
4. Suggest a draft response to App Review when appropriate.
5. Recheck after fixes and help the developer prepare a stronger resubmission.

Why: Solves high pain for developers who’ve already lost time and need clear next steps.

---

7) Later priorities (Phase D & E)

Focus on deeper checks and submission polish once the core loop is trusted:

Phase D — Submission preparation & metadata
- Deeper checks of App Store metadata: title, subtitle, description, keywords, age rating, reviewer notes.
- Screenshot/asset checks: sizes, device coverage, obvious mismatches or misleading text.
- Submission readiness checklist: everything the developer needs before pressing Submit.

Phase E — Deeper intelligence
- Runtime and configuration inspections: entitlements, permissions, SDKs, background modes, payment/subscription flows, login/account behaviors.
- Special-category checks for subscriptions, health, finance, UGC, location-heavy, or sensitive-data apps.

---

8) Scale features to consider later (Phase F)

- Multiple apps and a consolidated dashboard
- Team/agency features (roles, approvals, shared reports)
- Continuous monitoring and alerts (new builds detected, guideline changes)
- Integrations (App Store Connect pointers, optional Slack/email alerts)

Note: these are valuable but not required for product-market fit with solo devs.

---

9) What Fix It should never become

- A generic AI chatbot: users should not have to guess prompts or ask the tool to find problems — the system should inspect first.
- An Apple clone or a promise of approval: never claim Apple will approve an app.
- A dashboard of vague metrics with no action: every finding must end with "what to do next." 

If a proposed feature doesn’t help a solo developer go from app → checked → fixed → rechecked → ready to submit, deprioritize it.

---

10) One-sentence north star to guide decisions

Does this help a solo developer go from app → checked → fixed → rechecked → ready to submit? If yes, it belongs in the roadmap.

---

11) Ready-to-run checklist (prioritized)

Phase A checklist (must finish first)
- [ ] Upload: accept build and submission materials
- [ ] Inspect: run automated checks and mark manual checks
- [ ] Detect: produce prioritized issue list with severity
- [ ] Explain: for each issue show Problem → Evidence → Why → What to fix
- [ ] Final state: show NOT READY / READY WITH WARNINGS / NO HIGH-RISK ISSUES

Phase B checklist (early productization)
- [ ] Recheck: allow new version checks and compare results
- [ ] App history: save checks per version
- [ ] Readiness report: export/shareable summary

Phase C checklist (rejection solver)
- [ ] Ingest rejection notes
- [ ] Translate Apple language into plain English
- [ ] Map to app and recommend fixes
- [ ] Suggest reply to App Review

Phase D+ checklist (polish & scale)
- [ ] Metadata & screenshot checks
- [ ] Special-category workflows
- [ ] Multi-app dashboard and team features
- [ ] Continuous monitoring & alerts

---

12) How to use this master plan

- Keep this file as the single canonical product plan. Use the prioritized checklists as your development and validation order.
- Before building any feature, run it through the north-star sentence in section 10.
- After you get real users, update priorities based on feedback — vision stays constant, order can shift.

---

13) Appendix — original conversation (raw)

(kept verbatim below for reference)

```
Yes. **This is what you need now: not an implementation plan, but the product blueprint.**

No tech stack. No “use Supabase.” No coding instructions. Just:

**What Fix It is → who it serves → what the complete product should eventually do → what matters first → what can wait.**

That becomes your **master product plan** for the entire journey.

# FIX IT — MASTER PRODUCT PLAN

## 1. What are we building?

**Fix It is an App Store submission/review assistant for solo iOS developers.**

Its core job is simple:

> **A developer gives Fix It their iOS app and the information related to its submission. Fix It checks for potential App Store problems, explains what it finds, tells the developer what to fix, lets them check again after making changes, and helps them get the app ready to submit.**

It should work both **before submission** and, eventually, **after Apple has already rejected the app**.

The product should feel like:

> **“My final check before I send my app to Apple.”**

Not like a chatbot.

Not like Apple itself.

Not like a giant compliance platform.

---

# 2. Who is the product for?

### Primary customer

**Solo iOS developers.**

Especially:

* indie hackers
* first-time app developers
* solo founders
* AI/vibe-coded app builders
* developers shipping small consumer apps
* developers updating apps without a dedicated App Store specialist

### Secondary users later

* small development teams
* freelancers
* app studios
* agencies managing several apps

But the product should be designed around the **solo developer first**.

---

# 3. The core promise

The entire product revolves around:

> **UPLOAD → CHECK → FIX → CHECK AGAIN → SUBMIT**

That is the core loop.

Everything else exists to make this loop better.

---

# 4. PRIORITY 1 — THE CORE CHECK

This is the heart of the product.

A developer should be able to give Fix It their app/build and the relevant information needed for checking.

Fix It should then:

### Identify what it can inspect

Such as:

* app/build information
* permissions
* privacy-related configuration
* app metadata
* screenshots/assets
* account/login behavior where detectable
* subscriptions/payment-related information
* other relevant App Store requirements

### Then produce:

**What looks good**

**What needs attention**

**What needs manual checking**

The result should be clear and prioritized.

For example:

### HIGH

Something that may seriously affect submission.

### MEDIUM

Something that should be reviewed/fixed.

### LOW

Something worth improving but less urgent.

### MANUAL CHECK

Something Fix It cannot reliably determine automatically.

This distinction is extremely important.

---

# 5. PRIORITY 2 — EXPLAIN THE PROBLEM

Finding a problem isn't enough.

The user should understand:

### What did Fix It find?

### Where is it?

### Why might it matter?

### What should I change?

So every issue becomes:

> **Problem → Evidence → Why → What to fix**

For example:

**Location permission**

**What we found:**
Your location permission message is very vague.

**Why it matters:**
Apple expects users to understand why the app needs sensitive permissions.

**What to do:**
Update the permission explanation to clearly describe the feature using the location.

That's much more useful than:

> “Guideline 5.1.1 issue.”

---

# 6. PRIORITY 3 — RECHECK

This is one of your most important features.

A developer fixes the issue.

Then:

> **Check again.**

Fix It analyzes the new build/version.

Then it should show:

### Previous check

5 issues

### New check

2 issues

### Fixed

3

### Remaining

2

### New issues

0

This creates a real product loop:

**Check → Fix → Check → Improve**

And it gives the product a reason to be used every time the app changes.

---

# 7. PRIORITY 4 — APP HISTORY

Each app should have a history.

Example:

**My App**

Version 1.0
8 issues

Version 1.1
4 issues

Version 1.2
1 issue

Version 1.3
No detected high-risk issues

This lets developers see progress over time.

Later, this can become very powerful because the product is no longer just a one-time checker.

It becomes their **submission history**.

---

# 8. PRIORITY 5 — FINAL READINESS REPORT

After checking an app, give the developer a simple final state.

For example:

### NOT READY

Important issues remain.

### READY WITH WARNINGS

No major detected problems, but some things should be reviewed.

### NO HIGH-RISK ISSUES DETECTED

The checks completed without finding major issues.

Never say:

> “Apple will approve this.”

Instead:

> **“No major issues were detected in the checks we ran.”**

The report should show:

* total checks
* issues
* severity
* remaining problems
* manual checks
* resolved problems

Eventually, the user should be able to keep/export that report.

---

# 9. PRIORITY 6 — REJECTION SOLVER

This is the second major side of the product.

A developer has already submitted.
Apple rejects the app.
They bring the rejection into Fix It.

Fix It should:

### Understand the rejection

Explain in plain English:

> “Apple is saying…”

### Connect it to the app

Where possible:

> “This appears related to…”

### Tell the developer what to do

> “Change this…”

### Help them respond

If appropriate:

> Suggested reply to App Review.

This creates a second core workflow:

**REJECTED → UNDERSTAND → FIX → RECHECK → RESUBMIT**

Now Fix It isn't useful only **before** submission.
It's useful **when things go wrong** too.

---

# 10. PRIORITY 7 — SUBMISSION PREPARATION

After the core checker is trusted, help the user prepare the final submission.

This can cover things like:

* App Store information
* metadata
* screenshots
* privacy information
* age rating
* review information
* reviewer notes
* other required submission details

The goal isn't to submit automatically.
The goal is:

> **“Everything is ready for me to submit.”**

---

# 11. PRIORITY 8 — APP STORE METADATA CHECKING

Then make the metadata part deeper.

Check things such as:

* title
* subtitle
* description
* keywords
* promotional text
* category
* age rating
* consistency between listing and actual app

The product should help answer:

> “Does what I'm telling Apple match what my app actually does?”

Later you can add stronger ASO assistance, but **compliance and accuracy come first**.

---

# 12. PRIORITY 9 — SCREENSHOT / ASSET CHECKING

Eventually Fix It should inspect:

* screenshot sizes
* device requirements
* obvious invalid assets
* misleading text
* mismatches between screenshots and actual product

Then tell the developer:

> **“This screenshot needs attention because…”**

Again:

**Finding → explanation → fix.**

---

# 13. PRIORITY 10 — DEEPER APP INSPECTION

Once the basic product is working and users trust it, expand the engine.

It can eventually inspect more deeply:

* build configuration
* permissions
* entitlements
* privacy configuration
* frameworks/SDKs
* deep links
* background capabilities
* account flows
* payment flows
* special-category requirements
* runtime behavior

This is where Fix It becomes much harder to replace with a simple chatbot.
Because it isn't just answering:

> “What does Apple say?”

It's examining:

> **“What does your app actually contain/do?”**

---

# 14. PRIORITY 11 — SPECIAL APP TYPES

Later, when your core engine is reliable, add deeper checks for apps with special requirements.

Examples:

* subscriptions
* health/fitness
* finance
* social
* user-generated content
* location-heavy apps
* AI apps
* apps requiring login
* apps with purchases
* apps with sensitive data

The engine should recognize:

> “This app has extra areas that need attention.”

---

# 15. PRIORITY 12 — MULTIPLE APPS

After the solo workflow works:

A developer may have:

**App A**

**App B**

**App C**

The dashboard should let them manage all of them.

But this is **not important for the first product version.**

First make one app work brilliantly.

---

# 16. PRIORITY 13 — TEAM / AGENCY FEATURES

Much later:

* team members
* shared reports
* client apps
* approvals
* roles
* organization accounts
* multiple app management

This is secondary.

Your first customer is:

> **one person with one app.**

---

# 17. PRIORITY 14 — CONTINUOUS MONITORING

Eventually, Fix It can become more proactive.

Instead of:

> “Come here and check your app.”

It could become:

> **“A new build was uploaded. We found 2 new risks.”**

Or:

> “Apple changed a relevant guideline. Your app may need another check.”

This could make Fix It something developers keep around continuously.

But again:

**Later.**

---

# 18. PRIORITY ORDER

This is the order I'd use as your permanent roadmap.

### PHASE A — THE CORE

**1. Upload app**

**2. Inspect app**

**3. Detect problems**

**4. Explain problems**

**5. Recommend fixes**

**6. Show clear result**

This proves the main idea.

---

### PHASE B — THE LOOP

**7. Recheck**

**8. Compare old vs new**

**9. Save app history**

**10. Final readiness report**

This turns the checker into a real product rather than a one-off tool.

---

### PHASE C — THE SECOND WORKFLOW

**11. Rejection solver**

**12. Rejection → fix → recheck**

This expands the product to developers who already got rejected.

---

### PHASE D — SUBMISSION PREPARATION

**13. Metadata checks**

**14. Screenshot checks**n

**15. Submission information**

**16. Reviewer information**

**17. Final submission checklist**

---

### PHASE E — DEEPER INTELLIGENCE

**18. Runtime inspection**

**19. Deeper configuration checks**

**20. Special-category checks**

**21. More advanced app behavior analysis**

---

### PHASE F — SCALE

**22. Multiple apps**

**23. Teams**

**24. Agencies**

**25. Continuous monitoring**

**26. Integrations**

---

# 19. What Fix It should NEVER become

This is just as important as the roadmap.

Don't let the product turn into:

### A generic AI chatbot

Users shouldn't have to ask:

> “Hey AI, will Apple reject my app?”

The system should **inspect first**.

### An Apple clone

You're not Apple and shouldn't pretend to be.

### A giant dashboard full of meaningless numbers

Every result should lead to:

> **“What do I do now?”**

### A tool that says “everything is fine” without evidence

Trust comes from:

**What we saw → why we flagged it → what you can change.**

---

# 20. Your long-term product vision

If this works, the end-state is:

> **A solo developer builds an app.**
> 
> **Fix It becomes the final checkpoint before App Store submission.**
> 
> They upload the build.
> 
> Fix It checks the app.
> 
> Fix It tells them what needs attention.
> 
> They fix it.
> 
> They upload again.
> 
> Fix It verifies the changes.
> 
> They prepare their submission.
> 
> They submit.
> 
> Apple rejects something anyway?
> 
> Bring the rejection back into Fix It.
> 
> Fix It helps diagnose it.
> 
> The developer fixes it.
> 
> Re-check.
> 
> Resubmit.

So Fix It becomes:

> **the place developers go whenever they're preparing, checking, fixing, or recovering an iOS App Store submission.**

---

# 21. The single sentence to keep forever

Whenever you're confused about whether a feature belongs in the product, ask:

> **“Does this help a solo developer go from app → checked → fixed → rechecked → ready to submit?”**

If yes, it belongs somewhere in the roadmap.

If no, **don't let it distract you yet.**

And that means your roadmap can change whenever real users teach you something new. The **vision stays stable; the implementation order can change.**

That's exactly how I'd run Fix It for the long term.

```
