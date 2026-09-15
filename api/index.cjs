var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/server/geminiService.ts
async function callWithTimeout(promiseFactory, timeoutMs = GEMINI_TIMEOUT_MS, operationName = "Gemini API call") {
  const controller = new AbortController();
  let timeoutId = null;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      controller.abort();
      reject(new Error(`${operationName} timed out after ${Math.round(timeoutMs / 1e3)}s`));
    }, timeoutMs);
  });
  try {
    return await Promise.race([
      promiseFactory(controller.signal),
      timeoutPromise
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}
function getGenAI() {
  if (!genAIClient && process.env.GEMINI_API_KEY) {
    genAIClient = new import_genai.GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  }
  return genAIClient;
}
async function enhanceAuditWithAI(inspection, findings) {
  const ai = getGenAI();
  if (!ai || findings.length === 0) {
    return {
      enhancedFindings: findings,
      reviewerNotes: generateFallbackReviewerNotes(inspection),
      executiveSummary: generateFallbackSummary(inspection, findings),
      aiEnhanced: false
    };
  }
  try {
    const prompt = `You are Fixit's expert Apple App Store Review compliance auditor.
Given the normalized static inspection of an iOS application and its deterministic audit findings:

App: ${inspection.appName} (${inspection.bundleId})
Version: ${inspection.version} (Build ${inspection.build})
Permissions: ${JSON.stringify(inspection.permissions.filter((p) => p.detected))}
Frameworks: ${JSON.stringify(inspection.frameworks)}
Privacy Manifest: ${JSON.stringify(inspection.privacyManifest)}
Features: ${JSON.stringify(inspection.features)}
Deterministic Findings: ${JSON.stringify(findings.map((f) => ({ id: f.id, rule: f.ruleId, title: f.title, severity: f.severity, evidence: f.evidence })))}

CRITICAL CONSTRAINTS:
1. Do NOT invent fake Apple guidelines. Cite only official Apple App Store Review Guidelines.
2. Never say "Apple will approve your app." Provide risk assessment based on public guidelines.
3. Where evidence is ambiguous, specify "Insufficient evidence \u2014 manual verification required."
4. Generate a professional, highly specific "Reviewer Notes" draft tailored to App Store Connect.

Return JSON in this format:
{
  "executiveSummary": "Concise 2-sentence summary of risk profile and priority actions",
  "reviewerNotes": "Draft for App Store Connect 'App Review Information' notes explaining test credentials, gated features, and permissions",
  "findingsEnhancements": [
    {
      "findingId": "string",
      "contextualWhy": "Tailored explanation why this matters for this specific app",
      "recommendedAction": "Precise Swift or Xcode configuration instructions",
      "whatToVerify": "Specific check for developer before submitting"
    }
  ]
}`;
    const response = await callWithTimeout(
      () => ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      }),
      18e3,
      "Audit AI enhancement"
    );
    const parsed = JSON.parse(response.text || "{}");
    const enhancementMap = /* @__PURE__ */ new Map();
    if (Array.isArray(parsed.findingsEnhancements)) {
      parsed.findingsEnhancements.forEach((enh) => enhancementMap.set(enh.findingId, enh));
    }
    const enhanced = findings.map((f) => {
      const enh = enhancementMap.get(f.id);
      if (enh) {
        return {
          ...f,
          whyItMatters: enh.contextualWhy || f.whyItMatters,
          recommendedAction: enh.recommendedAction || f.recommendedAction,
          whatToVerify: enh.whatToVerify || f.whatToVerify,
          isAiCorrelated: true
        };
      }
      return f;
    });
    return {
      enhancedFindings: enhanced,
      reviewerNotes: parsed.reviewerNotes || generateFallbackReviewerNotes(inspection),
      executiveSummary: parsed.executiveSummary || generateFallbackSummary(inspection, findings),
      aiEnhanced: true
    };
  } catch (error) {
    console.error("Error enhancing audit with AI:", error);
    return {
      enhancedFindings: findings,
      reviewerNotes: generateFallbackReviewerNotes(inspection),
      executiveSummary: generateFallbackSummary(inspection, findings),
      aiEnhanced: false
    };
  }
}
async function analyzeAppleRejectionWithAI(rejectionText) {
  const ai = getGenAI();
  if (!ai) {
    return fallbackRejectionAnalysis(rejectionText);
  }
  try {
    const prompt = `You are Fixit's senior Apple App Review Rejection Specialist.
A developer received the following rejection notice from Apple App Review:

"""
${rejectionText}
"""

Analyze this rejection:
1. Identify the exact Apple App Store Review Guideline (e.g. 2.1 Performance, 3.1.1 Payments, 5.1.1 Privacy, 4.8 Sign in with Apple).
2. Explain what Apple is actually saying in plain, jargon-free English.
3. Determine the best next action: FIX (code/metadata change needed), APPEAL (Apple reviewer made a factual error), CLARIFY (provide explanation/video in Resolution Center), or MANUAL_REVIEW.
4. Detail step-by-step remediation instructions.
5. Draft a polite, professional, concise response to paste directly into App Store Connect Resolution Center.

Do NOT make unsupported legal claims.

Return JSON in this format:
{
  "guidelinesIdentified": [
    { "guidelineNumber": "string", "title": "string", "url": "string" }
  ],
  "plainEnglishExplanation": "string",
  "recommendedAction": "FIX" | "APPEAL" | "CLARIFY" | "MANUAL_REVIEW",
  "actionJustification": "string",
  "remediationSteps": ["step 1", "step 2"],
  "developerResponseDraft": "string",
  "appleReviewNotesAdvice": "string",
  "confidenceScore": 0.95
}`;
    const response = await callWithTimeout(
      () => ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      }),
      18e3,
      "Rejection analysis"
    );
    const parsed = JSON.parse(response.text || "{}");
    return {
      id: `rej_${Date.now()}`,
      rejectionText,
      guidelinesIdentified: parsed.guidelinesIdentified || [
        {
          guidelineNumber: "Guideline 2.1",
          title: "Performance - App Completeness",
          url: "https://developer.apple.com/app-store/review/guidelines/#app-completeness"
        }
      ],
      plainEnglishExplanation: parsed.plainEnglishExplanation || "Apple flagged an issue with app functionality or review access.",
      recommendedAction: parsed.recommendedAction || "FIX",
      actionJustification: parsed.actionJustification || "Changes in code or App Store Connect metadata are necessary.",
      remediationSteps: parsed.remediationSteps || [
        "Review the flagged view in Xcode",
        "Update configuration or provide active test credentials",
        "Re-submit build with clarification in Resolution Center"
      ],
      developerResponseDraft: parsed.developerResponseDraft || "Dear App Review Team,\n\nThank you for your feedback...",
      appleReviewNotesAdvice: parsed.appleReviewNotesAdvice || "Include demo login details and a direct video walkthrough link if testing requires physical hardware.",
      confidenceScore: parsed.confidenceScore || 0.92
    };
  } catch (err) {
    console.error("Error analyzing rejection with AI:", err);
    return fallbackRejectionAnalysis(rejectionText);
  }
}
async function analyzeMetadataWithAI(metadata) {
  const issues = [];
  const suggestions = [];
  if (metadata.name.length > 30) {
    issues.push({
      field: "name",
      severity: "HIGH",
      type: "LENGTH_EXCEEDED",
      message: `App Name is ${metadata.name.length} characters. App Store maximum is 30.`,
      recommendation: "Shorten your app title to 30 characters or less."
    });
  }
  if (metadata.subtitle.length > 30) {
    issues.push({
      field: "subtitle",
      severity: "HIGH",
      type: "LENGTH_EXCEEDED",
      message: `Subtitle is ${metadata.subtitle.length} characters. App Store maximum is 30.`,
      recommendation: "Shorten subtitle to 30 characters or less."
    });
  }
  if (metadata.keywords.length > 100) {
    issues.push({
      field: "keywords",
      severity: "HIGH",
      type: "LENGTH_EXCEEDED",
      message: `Keywords length is ${metadata.keywords.length} characters. Maximum is 100.`,
      recommendation: "Remove spaces after commas and trim redundant terms."
    });
  }
  const allText = `${metadata.name} ${metadata.subtitle} ${metadata.description} ${metadata.keywords}`.toLowerCase();
  if (/\b(android|google play|apk|play store)\b/i.test(allText)) {
    issues.push({
      field: "description",
      severity: "HIGH",
      type: "COMPETITOR_MENTION",
      message: "References to competitor mobile platforms (Android / Google Play) violate Guideline 2.3.",
      recommendation: "Remove any mention of Android or other non-Apple app stores."
    });
  }
  if (/\b(free|#1|best app|top rated|\$0\.99)\b/i.test(`${metadata.name} ${metadata.subtitle}`)) {
    issues.push({
      field: "subtitle",
      severity: "MEDIUM",
      type: "UNSUPPORTED_CLAIM",
      message: 'Pricing terms ("Free") or unsubstantiated superlatives ("#1") in the title/subtitle violate Guideline 2.3.8.',
      recommendation: "Describe features rather than pricing or rank claims."
    });
  }
  const ai = getGenAI();
  if (ai) {
    try {
      const response = await callWithTimeout(
        () => ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: `Review this App Store Connect metadata for subtle Apple Guideline 2.3 risks (keyword stuffing, misleading claims, trademark infringement, unclear descriptions):
Name: ${metadata.name}
Subtitle: ${metadata.subtitle}
Description: ${metadata.description}
Keywords: ${metadata.keywords}

Return JSON:
{
  "additionalIssues": [
    {
      "field": "name" | "subtitle" | "description" | "keywords",
      "severity": "HIGH" | "MEDIUM" | "LOW",
      "type": "UNSUPPORTED_CLAIM" | "BANNED_KEYWORD" | "FORMAT_ERROR",
      "message": "string",
      "recommendation": "string"
    }
  ],
  "suggestions": ["tip 1", "tip 2"]
}`,
          config: { responseMimeType: "application/json" }
        }),
        18e3,
        "Metadata analysis"
      );
      const parsed = JSON.parse(response.text || "{}");
      if (Array.isArray(parsed.additionalIssues)) {
        issues.push(...parsed.additionalIssues);
      }
      if (Array.isArray(parsed.suggestions)) {
        suggestions.push(...parsed.suggestions);
      }
    } catch (e) {
    }
  }
  if (suggestions.length === 0) {
    suggestions.push(
      "Use single comma-separated keywords without spaces to save keyword character budget.",
      'Ensure the first 3 lines of your description highlight unique value before the "More" cutoff.',
      "Verify your Privacy Policy and Support URLs are active HTTPS links."
    );
  }
  return { issues, suggestions };
}
function generateFallbackReviewerNotes(inspection) {
  const iapStatus = inspection.features.hasInAppPurchases === true ? "In-app purchase capability was detected; verify StoreKit sandbox flows and pricing/restore flows before submission." : inspection.features.hasInAppPurchases === false ? "No in-app purchase capability was detected from the supplied metadata." : "In-app purchase detection is inconclusive; confirm StoreKit configuration manually before submitting.";
  const signInStatus = inspection.features.hasSignInWithApple === true ? "Sign in with Apple was detected in the app metadata; verify the flow and account-signout behavior before submission." : inspection.features.hasSignInWithApple === false ? "No Sign in with Apple capability was detected from the supplied metadata." : "Sign in with Apple detection is inconclusive; confirm the auth flow manually before submission.";
  const privacyPolicy = inspection.metadata.privacyPolicyUrl || "Privacy Policy URL not supplied in the metadata.";
  const supportUrl = inspection.metadata.supportUrl || "Support URL not supplied in the metadata.";
  return `App: ${inspection.appName} (v${inspection.version}, Build ${inspection.build})
Target OS: iOS ${inspection.minOSVersion}+

Notes for App Review Team:
- ${iapStatus}
- ${signInStatus}
- Privacy Policy: ${privacyPolicy}
- Support URL: ${supportUrl}
- Review the extracted permissions, privacy manifest declarations, and any detected compliance gaps before final submission.`;
}
function generateFallbackSummary(inspection, findings) {
  const high = findings.filter((f) => f.severity === "HIGH" && f.status === "OPEN").length;
  if (high > 0) {
    return `Static inspection flagged ${high} high-risk guideline requirement(s) that should be addressed prior to submitting to App Store Review.`;
  }
  return `Your app currently has no detected high-risk issues based on the checks performed. Review the manual checklist before submitting.`;
}
function fallbackRejectionAnalysis(rejectionText) {
  const isIAP = /in-app purchase|guideline 3\.1|storekit|restore purchases|payment/i.test(rejectionText);
  const isPrivacy = /guideline 5\.1|privacy|permission|purpose string|data collection/i.test(rejectionText);
  const isLogin = /guideline 4\.8|sign in with apple|login|account deletion/i.test(rejectionText);
  const isCompleteness = /guideline 2\.1|demo account|broken|crash|placeholder/i.test(rejectionText);
  let guideline = {
    guidelineNumber: "Guideline 2.1",
    title: "Performance - App Completeness",
    url: "https://developer.apple.com/app-store/review/guidelines/#app-completeness"
  };
  let explanation = "Apple App Review encountered an issue during testing or found missing information.";
  let action = "FIX";
  let steps = ["Update code to resolve the flagged behavior", "Provide clear notes in Resolution Center", "Upload a new build"];
  if (isIAP) {
    guideline = {
      guidelineNumber: "Guideline 3.1.1 / 3.1.2",
      title: "Business - In-App Purchase & Subscriptions",
      url: "https://developer.apple.com/app-store/review/guidelines/#in-app-purchase"
    };
    explanation = "Apple flagged in-app purchase terms, missing restore purchases button, or external payment links.";
    steps = [
      "Ensure Restore Purchases button is visible on paywalls",
      "Add clear subscription pricing and auto-renew terms",
      "Remove any external web checkout links"
    ];
  } else if (isPrivacy) {
    guideline = {
      guidelineNumber: "Guideline 5.1.1 / 5.1.2",
      title: "Legal - Privacy & Data Collection",
      url: "https://developer.apple.com/app-store/review/guidelines/#data-collection-and-storage"
    };
    explanation = "Apple requires explicit purpose strings in Info.plist or Privacy Manifest (PrivacyInfo.xcprivacy) declarations.";
    steps = [
      "Add or update Info.plist usage descriptions with specific feature details",
      "Include PrivacyInfo.xcprivacy with Required Reason APIs",
      "Ensure Privacy Policy URL in metadata is reachable"
    ];
  } else if (isLogin) {
    guideline = {
      guidelineNumber: "Guideline 4.8 / 5.1.1(v)",
      title: "Design - Sign in with Apple & Account Deletion",
      url: "https://developer.apple.com/app-store/review/guidelines/#sign-in-with-apple"
    };
    explanation = "Apple flagged missing Sign in with Apple or missing in-app account deletion.";
    steps = [
      "Implement Sign in with Apple button",
      "Add in-app account deletion button with confirmation",
      "Test auth flows in sandbox"
    ];
  }
  return {
    id: `rej_${Date.now()}`,
    rejectionText,
    guidelinesIdentified: [guideline],
    plainEnglishExplanation: explanation,
    recommendedAction: action,
    actionJustification: "App Review found a non-compliant behavior that requires code or configuration changes.",
    remediationSteps: steps,
    developerResponseDraft: `Dear Apple App Review Team,

Thank you for your feedback regarding our submission. We have resolved the issue by making the requested updates:

1. Addressed the specific item noted in ${guideline.guidelineNumber}.
2. Verified all test flows in TestFlight with active demo credentials.

Please let us know if any further clarification or testing assistance is needed.

Sincerely,
The Development Team`,
    appleReviewNotesAdvice: "Include demo credentials and step-by-step reproduction instructions.",
    confidenceScore: 0.88
  };
}
var import_genai, genAIClient, GEMINI_TIMEOUT_MS;
var init_geminiService = __esm({
  "src/server/geminiService.ts"() {
    import_genai = require("@google/genai");
    genAIClient = null;
    GEMINI_TIMEOUT_MS = 18e3;
  }
});

// src/engine/rules.ts
function getStoredRuleOverrides() {
  if (typeof window === "undefined" || !window.localStorage) {
    return {};
  }
  try {
    const raw = window.localStorage.getItem(RULES_OVERRIDE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    console.warn("Error reading rule overrides from localStorage:", err);
    return {};
  }
}
function getEffectiveRules() {
  const overrides = getStoredRuleOverrides();
  return APP_STORE_RULES.map((rule) => {
    if (typeof overrides[rule.id] === "boolean") {
      return { ...rule, enabled: overrides[rule.id] };
    }
    return rule;
  });
}
var APP_STORE_RULES, RULE_COUNT, RULES_OVERRIDE_KEY;
var init_rules = __esm({
  "src/engine/rules.ts"() {
    APP_STORE_RULES = [
      // 1. PRIVACY & MANIFESTS
      {
        id: "RULE-PRIV-01",
        category: "PRIVACY",
        guidelineRef: "Guideline 5.1.2",
        title: "Missing or Incomplete Privacy Manifest (PrivacyInfo.xcprivacy)",
        severity: "HIGH",
        description: "Apple mandates that apps and required third-party SDKs include a PrivacyInfo.xcprivacy declaring tracking domains, data categories, and Required Reason APIs.",
        detectionMethod: "STATIC_ANALYSIS",
        evidenceRequired: ["PrivacyInfo.xcprivacy file existence", "NSPrivacyAccessedAPITypes array", "NSPrivacyTracking boolean"],
        remediationGuidance: "Add a PrivacyInfo.xcprivacy resource to your Xcode target root. Declare all required reason API usage types (UserDefaults, File Timestamp, Disk Space, System Boot Time) and data collected.",
        codeSnippet: `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>NSPrivacyTracking</key>
    <false/>
    <key>NSPrivacyCollectedDataTypes</key>
    <array/>
    <key>NSPrivacyAccessedAPITypes</key>
    <array>
        <dict>
            <key>NSPrivacyAccessedAPIType</key>
            <string>NSPrivacyAccessedAPICategoryUserDefaults</string>
            <key>NSPrivacyAccessedAPITypeReasons</key>
            <array>
                <string>CA92.1</string>
            </array>
        </dict>
    </array>
</dict>
</plist>`,
        confidence: 0.95,
        sourceUrl: "https://developer.apple.com/documentation/bundleresources/privacy_manifest_files",
        lastReviewedDate: "2026-06-15",
        version: "1.4.0",
        enabled: true
      },
      {
        id: "RULE-PRIV-02",
        category: "PRIVACY",
        guidelineRef: "Guideline 5.1.1(i)",
        title: "Missing Privacy Policy URL in App Metadata",
        severity: "HIGH",
        description: "All apps that collect any user data or offer user accounts must provide a publicly accessible Privacy Policy link in App Store Connect metadata and in-app.",
        detectionMethod: "STATIC_ANALYSIS",
        evidenceRequired: ["privacyPolicyUrl in metadata", "Valid HTTPS URL protocol"],
        remediationGuidance: "Provide a valid, publicly reachable HTTPS URL linking directly to your privacy policy in App Store Connect and within your app settings screen.",
        codeSnippet: `// In App Settings View (SwiftUI)
Link("Privacy Policy", destination: URL(string: "https://yourdomain.com/privacy")!)
    .font(.footnote)
    .foregroundStyle(.secondary)`,
        confidence: 0.98,
        sourceUrl: "https://developer.apple.com/app-store/review/guidelines/#data-collection-and-storage",
        lastReviewedDate: "2026-06-15",
        version: "1.2.0",
        enabled: true
      },
      {
        id: "RULE-PRIV-03",
        category: "PRIVACY",
        guidelineRef: "Guideline 5.1.2",
        title: "Ad Tracking / ATT Declared Without NSUserTrackingUsageDescription",
        severity: "HIGH",
        description: "App references AppTrackingTransparency / ad tracking SDKs (e.g., AppsFlyer, AdMob, Meta) but is missing NSUserTrackingUsageDescription in Info.plist.",
        detectionMethod: "HYBRID",
        evidenceRequired: ["Ad SDK or Tracking framework detected", "NSUserTrackingUsageDescription key in Info.plist"],
        remediationGuidance: "If you collect IDFA or track users across third-party apps/websites, provide a specific NSUserTrackingUsageDescription string in Info.plist explaining how user data is used.",
        codeSnippet: `<key>NSUserTrackingUsageDescription</key>
<string>This identifier will be used to deliver personalized workout recommendations and measure ad performance.</string>`,
        confidence: 0.92,
        sourceUrl: "https://developer.apple.com/app-store/user-privacy-and-data-use/",
        lastReviewedDate: "2026-06-15",
        version: "1.1.0",
        enabled: true
      },
      // 2. PERMISSIONS
      {
        id: "RULE-PERM-01",
        category: "PERMISSIONS",
        guidelineRef: "Guideline 5.1.1(ii)",
        title: "Vague or Missing Permission Purpose Strings in Info.plist",
        severity: "HIGH",
        description: 'Apple requires clear, specific purpose strings explaining why the app needs access to protected resources (Camera, Microphone, Photo Library, Location, HealthKit). Vague strings like "Used for app functionality" are routinely rejected.',
        detectionMethod: "STATIC_ANALYSIS",
        evidenceRequired: ["Usage description keys in Info.plist", "String length > 12 characters", "Specific contextual reason"],
        remediationGuidance: "Update your Info.plist strings (e.g. NSCameraUsageDescription, NSLocationWhenInUseUsageDescription) with user-friendly explanations specifying the exact feature using the capability.",
        codeSnippet: `<!-- BAD: <string>Camera access is needed.</string> -->
<!-- GOOD: -->
<key>NSCameraUsageDescription</key>
<string>Scan receipt barcodes and capture workout equipment QR codes directly into your diary.</string>`,
        confidence: 0.94,
        sourceUrl: "https://developer.apple.com/documentation/bundleresources/information_property_list/protected_resources",
        lastReviewedDate: "2026-06-15",
        version: "1.3.0",
        enabled: true
      },
      {
        id: "RULE-PERM-02",
        category: "PERMISSIONS",
        guidelineRef: "Guideline 5.1.1(ii)",
        title: 'Excessive "Always" Location Permission Request',
        severity: "MEDIUM",
        description: "Requesting NSLocationAlwaysAndWhenInUseUsageDescription without clear continuous background navigation, geofencing, or fitness tracking capabilities triggers rejection.",
        detectionMethod: "STATIC_ANALYSIS",
        evidenceRequired: ["NSLocationAlwaysAndWhenInUseUsageDescription in Info.plist", "UIBackgroundModes location capability"],
        remediationGuidance: "Prefer NSLocationWhenInUseUsageDescription unless your app continuously tracks routes or provides active geofence triggers in the background.",
        codeSnippet: `<key>NSLocationWhenInUseUsageDescription</key>
<string>Show nearby running trails and calculate your local running distance while the app is active.</string>`,
        confidence: 0.9,
        sourceUrl: "https://developer.apple.com/documentation/corelocation/requesting_authorization_for_location_services",
        lastReviewedDate: "2026-06-15",
        version: "1.1.0",
        enabled: true
      },
      // 3. ACCOUNT REQUIREMENTS
      {
        id: "RULE-ACC-01",
        category: "ACCOUNT_REQUIREMENTS",
        guidelineRef: "Guideline 5.1.1(v)",
        title: "Missing In-App Account Deletion Capability",
        severity: "HIGH",
        description: "If users can create an account in your app, Apple mandates an obvious, direct way to initiate account and data deletion inside the app itself, not just an email link or external web redirect without confirmation.",
        detectionMethod: "HYBRID",
        evidenceRequired: ["Account creation detected or declared", "Account deletion flow verification"],
        remediationGuidance: 'Add a "Delete Account" button in your user Profile/Settings with a confirmation dialog and clear deletion timeframe explanation.',
        codeSnippet: `// SwiftUI Example in Account Settings
Button(role: .destructive, action: { showDeleteConfirmation = true }) {
    Label("Delete Account & Data", systemImage: "trash")
}
.confirmationDialog("Delete Account?", isPresented: $showDeleteConfirmation) {
    Button("Permanently Delete", role: .destructive) {
        viewModel.requestAccountDeletion()
    }
}`,
        confidence: 0.88,
        sourceUrl: "https://developer.apple.com/support/offering-account-deletion-in-your-app/",
        lastReviewedDate: "2026-06-15",
        version: "1.5.0",
        enabled: true
      },
      {
        id: "RULE-ACC-02",
        category: "ACCOUNT_REQUIREMENTS",
        guidelineRef: "Guideline 4.8",
        title: "Missing Sign in with Apple When Social Login is Present",
        severity: "HIGH",
        description: "Apps supporting third-party social logins (Google, Facebook, Twitter/X, Discord, GitHub) must also offer Sign in with Apple as an equivalent first-class option.",
        detectionMethod: "STATIC_ANALYSIS",
        evidenceRequired: ["GoogleSignIn, FBSDK, or OAuth libraries detected in frameworks", "AuthenticationServices / ASAuthorizationController"],
        remediationGuidance: "Include Sign in with Apple using Apple's standard AuthenticationServices button style alongside any other social login buttons.",
        codeSnippet: `import AuthenticationServices

SignInWithAppleButton(
    onRequest: { request in
        request.requestedScopes = [.fullName, .email]
    },
    onCompletion: { result in
        handleAppleAuth(result)
    }
)
.signInWithAppleButtonStyle(.black)
.frame(height: 50)`,
        confidence: 0.96,
        sourceUrl: "https://developer.apple.com/app-store/review/guidelines/#sign-in-with-apple",
        lastReviewedDate: "2026-06-15",
        version: "1.3.0",
        enabled: true
      },
      {
        id: "RULE-ACC-03",
        category: "ACCOUNT_REQUIREMENTS",
        guidelineRef: "Guideline 5.1.1",
        title: "Forced Account Creation Before Core Utility Exploration",
        severity: "MEDIUM",
        description: "Apple guidelines disallow forcing registration before letting users browse or experience core utility features that do not strictly require personal data or cloud synchronization.",
        detectionMethod: "HEURISTIC",
        evidenceRequired: ["Login screen as initial window root", "Non-social / standalone utility app categorization"],
        remediationGuidance: 'Provide a "Continue as Guest" or "Explore First" option, prompting registration only when cloud backup, sync, or multiplayer features are accessed.',
        confidence: 0.85,
        sourceUrl: "https://developer.apple.com/app-store/review/guidelines/#data-collection-and-storage",
        lastReviewedDate: "2026-06-15",
        version: "1.2.0",
        enabled: true,
        requiresManualCheck: true
      },
      // 4. PAYMENTS & IN-APP PURCHASES
      {
        id: "RULE-IAP-01",
        category: "PAYMENTS_IAP",
        guidelineRef: "Guideline 3.1.1",
        title: "External Payment Checkout Links for Digital Content",
        severity: "HIGH",
        description: "Digital unlockables, digital subscriptions, or virtual credits must use Apple In-App Purchase (StoreKit). Linking to external web paywalls (e.g., Stripe web checkout) inside the app is strictly prohibited unless qualifying as a designated Reader App.",
        detectionMethod: "HYBRID",
        evidenceRequired: ["Stripe/PayPal web URL patterns in binary", "StoreKit configuration check"],
        remediationGuidance: "Implement StoreKit 2 (`Product.purchase()`) for all in-app digital items or submit appropriate Reader App / Music Streaming entitlement documentation if applicable.",
        codeSnippet: `// StoreKit 2 Purchase Flow
let result = try await product.purchase()
switch result {
case .success(let verification):
    let transaction = try checkVerified(verification)
    await transaction.finish()
    isSubscribed = true
case .userCancelled, .pending:
    break
@unknown default:
    break
}`,
        confidence: 0.91,
        sourceUrl: "https://developer.apple.com/app-store/review/guidelines/#in-app-purchase",
        lastReviewedDate: "2026-06-15",
        version: "1.4.0",
        enabled: true
      },
      // 5. SUBSCRIPTIONS
      {
        id: "RULE-SUB-01",
        category: "SUBSCRIPTIONS",
        guidelineRef: "Guideline 3.1.2",
        title: 'Missing "Restore Purchases" Button on Paywall',
        severity: "HIGH",
        description: 'Apple App Review rejects paywall screens that lack a clearly visible, functioning "Restore Purchases" button to allow users to recover previous transactions across devices.',
        detectionMethod: "HYBRID",
        evidenceRequired: ["Subscription products detected", "Paywall view elements"],
        remediationGuidance: 'Place a visible "Restore Purchases" button on your paywall and app settings screen using `AppStore.sync()` or `Transaction.currentEntitlements`.',
        codeSnippet: `Button("Restore Purchases") {
    Task {
        try? await AppStore.sync()
        await updateCustomerPurchases()
    }
}
.font(.footnote)
.foregroundStyle(.secondary)`,
        confidence: 0.95,
        sourceUrl: "https://developer.apple.com/app-store/review/guidelines/#subscriptions",
        lastReviewedDate: "2026-06-15",
        version: "1.3.0",
        enabled: true
      },
      {
        id: "RULE-SUB-02",
        category: "SUBSCRIPTIONS",
        guidelineRef: "Guideline 3.1.2",
        title: "Missing Links to Terms of Use (EULA) and Privacy Policy on Paywall",
        severity: "MEDIUM",
        description: "Subscription purchase screens must clearly present functioning links to both your Terms of Use (EULA / Standard Apple EULA) and Privacy Policy.",
        detectionMethod: "HEURISTIC",
        evidenceRequired: ["Paywall view layout", "Terms / EULA URL references"],
        remediationGuidance: "Add direct links to Terms of Use (EULA) and Privacy Policy on the paywall screen right beneath the subscription CTA button.",
        codeSnippet: `HStack(spacing: 12) {
    Link("Terms of Use", destination: URL(string: "https://yourdomain.com/terms")!)
    Text("\u2022").foregroundStyle(.secondary)
    Link("Privacy Policy", destination: URL(string: "https://yourdomain.com/privacy")!)
}
.font(.caption2)`,
        confidence: 0.89,
        sourceUrl: "https://developer.apple.com/app-store/review/guidelines/#subscriptions",
        lastReviewedDate: "2026-06-15",
        version: "1.2.0",
        enabled: true
      },
      // 6. USER GENERATED CONTENT (UGC)
      {
        id: "RULE-UGC-01",
        category: "UGC",
        guidelineRef: "Guideline 1.2",
        title: "Missing UGC Moderation, Reporting, or User Blocking Mechanism",
        severity: "HIGH",
        description: "Apps containing social feeds, chat, comments, or user-uploaded media must provide: 1) Terms agreement, 2) Method to report objectionable content, 3) Ability to block abusive users, and 4) Developer contact for concerns.",
        detectionMethod: "HYBRID",
        evidenceRequired: ["Chat / Social / Feed frameworks detected", "Report content / Block user UI endpoints"],
        remediationGuidance: 'Add a long-press or menu button on all user content items allowing users to "Report Content" and "Block User", and enforce a standard EULA on signup.',
        codeSnippet: `Menu {
    Button(role: .destructive) { reportContent(post.id) } label: {
        Label("Report Content", systemImage: "flag")
    }
    Button(role: .destructive) { blockUser(post.authorId) } label: {
        Label("Block User", systemImage: "nosign")
    }
} label: {
    Image(systemName: "ellipsis")
}`,
        confidence: 0.92,
        sourceUrl: "https://developer.apple.com/app-store/review/guidelines/#user-generated-content",
        lastReviewedDate: "2026-06-15",
        version: "1.3.0",
        enabled: true
      },
      // 7. APP COMPLETENESS & REVIEW ACCESS
      {
        id: "RULE-COMP-01",
        category: "APP_COMPLETENESS",
        guidelineRef: "Guideline 2.1",
        title: "Gated Functionality Lacks Demo Credentials for App Review",
        severity: "HIGH",
        description: "If your app requires a login, hardware pairing, or subscription to test, you must provide active, working demo credentials and clear testing notes in App Store Connect App Review Notes.",
        detectionMethod: "MANUAL_CHECK",
        evidenceRequired: ["Authentication required", "App Store Review Notes field"],
        remediationGuidance: "Create a permanent, pre-configured test account (e.g. `apple-review@yourdomain.com` / `DemoPass123!`) with sample data and paste it into App Review Information in App Store Connect.",
        confidence: 0.99,
        sourceUrl: "https://developer.apple.com/app-store/review/guidelines/#app-completeness",
        lastReviewedDate: "2026-06-15",
        version: "1.4.0",
        enabled: true,
        requiresManualCheck: true
      },
      {
        id: "RULE-COMP-02",
        category: "APP_COMPLETENESS",
        guidelineRef: "Guideline 2.1",
        title: 'Placeholder or "Lorem Ipsum" Text Detected in Metadata or Views',
        severity: "HIGH",
        description: 'Apps containing placeholder imagery, broken test URLs, or draft "Lorem Ipsum" text are rejected under Guideline 2.1 Performance.',
        detectionMethod: "STATIC_ANALYSIS",
        evidenceRequired: ['Placeholder string patterns: "Lorem ipsum", "TODO", "Test title", "sample.com"'],
        remediationGuidance: "Audit all localized strings, descriptions, and mock screens to replace placeholder text with production-ready copy.",
        confidence: 0.97,
        sourceUrl: "https://developer.apple.com/app-store/review/guidelines/#app-completeness",
        lastReviewedDate: "2026-06-15",
        version: "1.1.0",
        enabled: true
      },
      // 8. METADATA & CLAIMS
      {
        id: "RULE-META-01",
        category: "METADATA",
        guidelineRef: "Guideline 2.3.7",
        title: "Metadata Exceeds App Store Connect Character Limits",
        severity: "HIGH",
        description: "App Name (max 30 chars), Subtitle (max 30 chars), Promotional Text (max 170 chars), and Keywords (max 100 chars comma-separated) must strictly adhere to character constraints.",
        detectionMethod: "STATIC_ANALYSIS",
        evidenceRequired: ["Metadata field lengths"],
        remediationGuidance: "Trim App Name and Subtitle to <= 30 characters each. Ensure keywords are separated by commas without extra spaces.",
        confidence: 1,
        sourceUrl: "https://developer.apple.com/help/app-store-connect/reference/app-information/",
        lastReviewedDate: "2026-06-15",
        version: "1.0.0",
        enabled: true
      },
      {
        id: "RULE-META-02",
        category: "METADATA",
        guidelineRef: "Guideline 2.3",
        title: "Competitor Platform Mentions in Description or Keywords",
        severity: "MEDIUM",
        description: 'Apple prohibits referencing other mobile platforms (e.g., "Also available on Android", "Google Play Store", "APK version") in App Store metadata.',
        detectionMethod: "STATIC_ANALYSIS",
        evidenceRequired: ["Keywords or Description matching competitor terms: Android, Google Play, APK, Windows Phone"],
        remediationGuidance: "Remove all references to non-Apple platforms, APKs, or competitor app stores from your app description and keywords.",
        confidence: 0.98,
        sourceUrl: "https://developer.apple.com/app-store/review/guidelines/#accurate-metadata",
        lastReviewedDate: "2026-06-15",
        version: "1.1.0",
        enabled: true
      },
      {
        id: "RULE-META-03",
        category: "METADATA",
        guidelineRef: "Guideline 2.3.8",
        title: "Unsupported Superlative or Pricing Claims in App Name/Subtitle",
        severity: "MEDIUM",
        description: 'Using terms like "Free", "#1 App", "Best in the world", or price figures in the App Name or Subtitle violates metadata guidelines.',
        detectionMethod: "STATIC_ANALYSIS",
        evidenceRequired: ['Banned pricing and ranking keywords: "Free", "#1", "Best", "Top-rated", "$0.99" in name/subtitle'],
        remediationGuidance: "Focus your subtitle on core functionality rather than pricing or unsubstantiated awards.",
        confidence: 0.95,
        sourceUrl: "https://developer.apple.com/app-store/review/guidelines/#accurate-metadata",
        lastReviewedDate: "2026-06-15",
        version: "1.1.0",
        enabled: true
      },
      // 9. SCREENSHOTS
      {
        id: "RULE-SHOT-01",
        category: "SCREENSHOTS",
        guidelineRef: "Guideline 2.3.3",
        title: "Invalid Screenshot Dimensions for Required Device Sizes",
        severity: "HIGH",
        description: 'App Store Connect requires exact pixel dimensions for primary device classes (e.g. 1320x2868 for 6.9" iPhone, 1290x2796 for 6.7" iPhone, 1284x2778 for 6.5" iPhone, 1242x2208 for 5.5" iPhone, and 2064x2752 for 13" iPad).',
        detectionMethod: "STATIC_ANALYSIS",
        evidenceRequired: ["Screenshot width and height dimensions"],
        remediationGuidance: "Export screenshots at exact supported App Store Connect dimensions without transparent pixels or invalid aspect ratios.",
        confidence: 1,
        sourceUrl: "https://developer.apple.com/help/app-store-connect/reference/screenshot-specifications/",
        lastReviewedDate: "2026-06-15",
        version: "1.2.0",
        enabled: true
      },
      // 10. BACKGROUND CAPABILITIES
      {
        id: "RULE-BG-01",
        category: "BACKGROUND_MODES",
        guidelineRef: "Guideline 2.5.4",
        title: "Unjustified Background Modes Declared in Info.plist",
        severity: "HIGH",
        description: "Declaring UIBackgroundModes (e.g., `audio`, `location`, `voip`, `fetch`) without clear, user-facing active playback, continuous GPS routing, or VoIP call handling will result in rejection.",
        detectionMethod: "HYBRID",
        evidenceRequired: ["UIBackgroundModes array in Info.plist", "AVAudioSession category or CLLocationManager code check"],
        remediationGuidance: "Remove unused UIBackgroundModes keys from Info.plist unless your app actively plays audio in the background or performs turn-by-turn navigation.",
        codeSnippet: `<!-- Only include if actually needed: -->
<key>UIBackgroundModes</key>
<array>
    <string>audio</string>
</array>`,
        confidence: 0.93,
        sourceUrl: "https://developer.apple.com/app-store/review/guidelines/#software-requirements",
        lastReviewedDate: "2026-06-15",
        version: "1.2.0",
        enabled: true
      },
      // 11. SECURITY & ENCRYPTION
      {
        id: "RULE-SEC-01",
        category: "SECURITY_ENCRYPTION",
        guidelineRef: "Guideline 5.0 / Export Compliance",
        title: "Missing ITSAppUsesNonExemptEncryption in Info.plist",
        severity: "LOW",
        description: "If your app uses standard HTTPS encryption only, setting ITSAppUsesNonExemptEncryption to false prevents manual export compliance prompts during every App Store build upload.",
        detectionMethod: "STATIC_ANALYSIS",
        evidenceRequired: ["ITSAppUsesNonExemptEncryption key in Info.plist"],
        remediationGuidance: "Add `<key>ITSAppUsesNonExemptEncryption</key><false/>` to your Info.plist if your app only uses standard HTTPS / iOS system encryption.",
        codeSnippet: `<key>ITSAppUsesNonExemptEncryption</key>
<false/>`,
        confidence: 0.99,
        sourceUrl: "https://developer.apple.com/documentation/security/complying_with_encryption_export_regulations",
        lastReviewedDate: "2026-06-15",
        version: "1.1.0",
        enabled: true
      },
      {
        id: "RULE-SEC-02",
        category: "SECURITY_ENCRYPTION",
        guidelineRef: "Guideline 5.0",
        title: "NSAppTransportSecurity Allows Insecure Arbitrary Loads",
        severity: "MEDIUM",
        description: "Setting NSAllowsArbitraryLoads = true bypasses HTTPS requirements and triggers rejection unless accompanied by strong justification in App Review notes.",
        detectionMethod: "STATIC_ANALYSIS",
        evidenceRequired: ["NSAppTransportSecurity -> NSAllowsArbitraryLoads = true"],
        remediationGuidance: "Use HTTPS across all server endpoints and scope exceptions to specific domain names under NSExceptionDomains rather than allowing all arbitrary loads.",
        codeSnippet: `<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <false/>
</dict>`,
        confidence: 0.96,
        sourceUrl: "https://developer.apple.com/documentation/bundleresources/information_property_list/nsapptransportsecurity",
        lastReviewedDate: "2026-06-15",
        version: "1.2.0",
        enabled: true
      }
    ];
    RULE_COUNT = APP_STORE_RULES.length;
    RULES_OVERRIDE_KEY = "fixit_rules_override";
  }
});

// src/engine/appleSources.ts
var APPLE_GUIDELINE_SOURCES;
var init_appleSources = __esm({
  "src/engine/appleSources.ts"() {
    APPLE_GUIDELINE_SOURCES = [
      {
        id: "SRC-5.1.1",
        guidelineNumber: "5.1.1",
        title: "Data Collection and Storage",
        category: "PRIVACY",
        url: "https://developer.apple.com/app-store/review/guidelines/#data-collection-and-storage",
        lastVerifiedDate: "2026-06-15",
        version: "2026.2",
        summary: "Apps that collect user or device data must have a privacy policy and must secure user consent for data collection."
      },
      {
        id: "SRC-5.1.2",
        guidelineNumber: "5.1.2",
        title: "Data Use and Sharing & Privacy Manifests",
        category: "PRIVACY",
        url: "https://developer.apple.com/app-store/review/guidelines/#data-use-and-sharing",
        lastVerifiedDate: "2026-06-15",
        version: "2026.2",
        summary: "Apps and third-party SDKs must declare required reason APIs, tracking usage, and collected data types in PrivacyInfo.xcprivacy."
      },
      {
        id: "SRC-5.1.1-V",
        guidelineNumber: "5.1.1(v)",
        title: "Account Deletion Requirement",
        category: "ACCOUNT_REQUIREMENTS",
        url: "https://developer.apple.com/app-store/review/guidelines/#data-collection-and-storage",
        lastVerifiedDate: "2026-06-15",
        version: "2026.2",
        summary: "If an app supports account creation, it must also offer account deletion within the app, including associated data deletion."
      },
      {
        id: "SRC-4.8",
        guidelineNumber: "4.8",
        title: "Sign in with Apple",
        category: "ACCOUNT_REQUIREMENTS",
        url: "https://developer.apple.com/app-store/review/guidelines/#sign-in-with-apple",
        lastVerifiedDate: "2026-06-15",
        version: "2026.2",
        summary: "Apps that use a third-party or social login service (Google, Facebook, etc.) must also offer Sign in with Apple as an equivalent option."
      },
      {
        id: "SRC-3.1.1",
        guidelineNumber: "3.1.1",
        title: "In-App Purchase",
        category: "PAYMENTS_IAP",
        url: "https://developer.apple.com/app-store/review/guidelines/#in-app-purchase",
        lastVerifiedDate: "2026-06-15",
        version: "2026.2",
        summary: "Digital goods and services within the app must use Apple In-App Purchase. Apps cannot steer users to external payment mechanisms for unlockable app features."
      },
      {
        id: "SRC-3.1.2",
        guidelineNumber: "3.1.2",
        title: "Auto-Renewable Subscriptions",
        category: "SUBSCRIPTIONS",
        url: "https://developer.apple.com/app-store/review/guidelines/#subscriptions",
        lastVerifiedDate: "2026-06-15",
        version: "2026.2",
        summary: "Subscription apps must clearly disclose billing terms, renewal cadence, cancellation procedures, and provide a functioning Restore Purchases button."
      },
      {
        id: "SRC-1.2",
        guidelineNumber: "1.2",
        title: "User-Generated Content (UGC)",
        category: "UGC",
        url: "https://developer.apple.com/app-store/review/guidelines/#user-generated-content",
        lastVerifiedDate: "2026-06-15",
        version: "2026.2",
        summary: "Apps with UGC must include a method for filtering objectionable material, reporting mechanisms, ability to block abusive users, and published terms (EULA)."
      },
      {
        id: "SRC-2.1",
        guidelineNumber: "2.1",
        title: "App Completeness & Review Access",
        category: "APP_COMPLETENESS",
        url: "https://developer.apple.com/app-store/review/guidelines/#app-completeness",
        lastVerifiedDate: "2026-06-15",
        version: "2026.2",
        summary: "Submissions must be final, non-placeholder versions with valid demo/reviewer credentials provided in App Store Connect for all gated features."
      },
      {
        id: "SRC-2.3",
        guidelineNumber: "2.3",
        title: "Accurate Metadata & Claims",
        category: "METADATA",
        url: "https://developer.apple.com/app-store/review/guidelines/#accurate-metadata",
        lastVerifiedDate: "2026-06-15",
        version: "2026.2",
        summary: "App metadata must accurately describe features, must not mention competitor platforms (Android, Play Store), and must not contain misleading superlative claims."
      },
      {
        id: "SRC-2.3.3",
        guidelineNumber: "2.3.3",
        title: "Screenshots and App Previews",
        category: "SCREENSHOTS",
        url: "https://developer.apple.com/app-store/review/guidelines/#accurate-metadata",
        lastVerifiedDate: "2026-06-15",
        version: "2026.2",
        summary: "Screenshots must accurately display the app in use on matching target device displays without misleading hardware mockups or unreadable text."
      },
      {
        id: "SRC-2.5.4",
        guidelineNumber: "2.5.4",
        title: "Multitasking and Background Execution",
        category: "BACKGROUND_MODES",
        url: "https://developer.apple.com/app-store/review/guidelines/#software-requirements",
        lastVerifiedDate: "2026-06-15",
        version: "2026.2",
        summary: "Background audio, location, or VoIP modes may only be used for intended active user services and must cease when not in legitimate use."
      },
      {
        id: "SRC-5.0",
        guidelineNumber: "5.0",
        title: "Legal & Security Requirements (ATS & Encryption)",
        category: "SECURITY_ENCRYPTION",
        url: "https://developer.apple.com/app-store/review/guidelines/#legal",
        lastVerifiedDate: "2026-06-15",
        version: "2026.2",
        summary: "Apps must comply with App Transport Security (HTTPS) and properly declare US export compliance non-exempt encryption in Info.plist."
      }
    ];
  }
});

// src/engine/itunesExtractor.ts
async function extractFromItunesLookup(appNameOrId) {
  try {
    const value = (appNameOrId || "").trim();
    let url = "";
    if (/^\d+$/.test(value)) {
      url = `https://itunes.apple.com/lookup?id=${value}`;
    } else if (/^id\d+$/i.test(value)) {
      url = `https://itunes.apple.com/lookup?id=${value.replace(/^id/i, "")}`;
    } else if (value.includes(".")) {
      url = `https://itunes.apple.com/lookup?bundleId=${encodeURIComponent(value)}`;
    } else {
      url = `https://itunes.apple.com/search?term=${encodeURIComponent(value)}&entity=software&limit=1`;
    }
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6e3);
    let response;
    try {
      response = await fetch(url, { signal: controller.signal });
    } catch (fetchErr) {
      if (fetchErr.name === "AbortError") {
        throw new Error("TIMEOUT");
      }
      throw new Error("NETWORK_ERROR");
    } finally {
      clearTimeout(timeoutId);
    }
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    if (!data.results || data.results.length === 0) {
      return null;
    }
    const app2 = data.results[0];
    const screenshots = [];
    if (app2.screenshotUrls && Array.isArray(app2.screenshotUrls)) {
      app2.screenshotUrls.forEach((sUrl, index) => {
        screenshots.push({
          id: `screenshot_iphone_${index}`,
          name: `iPhone Screenshot ${index + 1}`,
          width: 0,
          height: 0,
          format: "png",
          deviceTarget: "iPhone",
          aspectRatio: "9:19.5",
          precision: "UNKNOWN"
        });
      });
    }
    if (app2.ipadScreenshotUrls && Array.isArray(app2.ipadScreenshotUrls)) {
      app2.ipadScreenshotUrls.forEach((sUrl, index) => {
        screenshots.push({
          id: `screenshot_ipad_${index}`,
          name: `iPad Screenshot ${index + 1}`,
          width: 0,
          height: 0,
          format: "png",
          deviceTarget: "iPad",
          aspectRatio: "3:4",
          precision: "UNKNOWN"
        });
      });
    }
    const inspection = {
      bundleId: app2.bundleId || "UNKNOWN",
      appName: app2.trackName || value,
      version: app2.version || "UNKNOWN",
      build: "1",
      minOSVersion: app2.minimumOsVersion || "UNKNOWN",
      targetDevices: app2.supportedDevices || ["iPhone", "iPad"],
      permissions: [],
      entitlements: [],
      urlSchemes: [],
      associatedDomains: [],
      frameworks: [],
      extensions: [],
      backgroundModes: [],
      privacyManifest: {
        hasPrivacyManifest: "UNKNOWN",
        trackingEnabled: "UNKNOWN",
        collectedDataTypes: [],
        accessedApiTypes: []
      },
      security: {
        atsAllowsArbitraryLoads: "UNKNOWN",
        usesNonExemptEncryptionDeclared: "UNKNOWN"
      },
      features: {
        hasInAppPurchases: "UNKNOWN",
        hasSubscriptions: "UNKNOWN",
        hasThirdPartyAuth: "UNKNOWN",
        hasSignInWithApple: "UNKNOWN",
        hasAccountDeletion: "UNKNOWN",
        hasUserGeneratedContent: "UNKNOWN",
        hasAdvertising: "UNKNOWN"
      },
      metadata: {
        name: app2.trackName,
        subtitle: void 0,
        description: app2.description,
        supportUrl: app2.sellerUrl,
        privacyPolicyUrl: void 0,
        category: app2.primaryGenreName,
        ageRating: app2.contentAdvisoryRating,
        listingProvided: true
      },
      screenshots,
      rawInfo: {
        ...app2,
        trackId: app2.trackId,
        bundleId: app2.bundleId || value
      }
    };
    return inspection;
  } catch (error) {
    console.error("iTunes Extractor Error:", error);
    if (error.message === "TIMEOUT" || error.message === "NETWORK_ERROR") {
      throw error;
    }
    return null;
  }
}
var init_itunesExtractor = __esm({
  "src/engine/itunesExtractor.ts"() {
  }
});

// src/engine/plist.ts
var init_plist = __esm({
  "src/engine/plist.ts"() {
  }
});

// src/engine/extractor.ts
var import_jszip, APP_STORE_SCREENSHOT_SIZES;
var init_extractor = __esm({
  "src/engine/extractor.ts"() {
    import_jszip = __toESM(require("jszip"), 1);
    init_plist();
    APP_STORE_SCREENSHOT_SIZES = [
      { label: '6.9" iPhone', width: 1320, height: 2868 },
      { label: '6.9" iPhone', width: 2868, height: 1320 },
      { label: '6.7" iPhone', width: 1290, height: 2796 },
      { label: '6.7" iPhone', width: 2796, height: 1290 },
      { label: '6.5" iPhone', width: 1284, height: 2778 },
      { label: '6.5" iPhone', width: 2778, height: 1284 },
      { label: '5.5" iPhone', width: 1242, height: 2208 },
      { label: '5.5" iPhone', width: 2208, height: 1242 },
      { label: '13" iPad', width: 2064, height: 2752 },
      { label: '13" iPad', width: 2752, height: 2064 },
      { label: '12.9" iPad', width: 2048, height: 2732 },
      { label: '12.9" iPad', width: 2732, height: 2048 },
      { label: '11" iPad', width: 1668, height: 2388 },
      { label: '11" iPad', width: 2388, height: 1668 }
    ];
  }
});

// src/engine/evaluator.ts
function computeReadiness(findings) {
  const open = findings.filter((f) => f.status !== "FIXED" && f.status !== "WONT_FIX");
  const high = open.filter((f) => f.severity === "HIGH").length;
  const mediumOrLow = open.filter((f) => f.severity === "MEDIUM" || f.severity === "LOW").length;
  const manual = open.filter((f) => f.severity === "MANUAL_CHECK").length;
  if (high > 0) return "NOT_READY";
  if (mediumOrLow > 0 || manual > 0) return "READY_WITH_WARNINGS";
  return "NO_HIGH_RISK_ISSUES_DETECTED";
}
function readinessCopy(status) {
  switch (status) {
    case "NOT_READY":
      return {
        label: "NOT READY",
        summaryHint: "Important issues remain. Fix the high-priority items before submitting."
      };
    case "READY_WITH_WARNINGS":
      return {
        label: "READY WITH WARNINGS",
        summaryHint: "No major detected problems, but some things should be reviewed or improved."
      };
    default:
      return {
        label: "NO HIGH-RISK ISSUES DETECTED",
        summaryHint: "No major issues were detected in the checks we ran. This is not a guarantee of App Review approval."
      };
  }
}
function evidence(key, location, detectionStatus, notes, extractedValue) {
  return { key, location, detectionStatus, notes, extractedValue };
}
function evaluateRule(ruleId, inspection, ruleWhy, ruleAction) {
  const empty = {
    triggered: false,
    evidence: [],
    why: ruleWhy,
    action: ruleAction,
    verify: "Confirm this in your project and App Store Connect listing."
  };
  switch (ruleId) {
    case "RULE-PRIV-01": {
      if (inspection.privacyManifest.hasPrivacyManifest === "UNKNOWN") {
        return {
          triggered: true,
          severity: "MANUAL_CHECK",
          evidence: [evidence("PrivacyInfo.xcprivacy", "App Store Connect / Build scan", "UNKNOWN", "Privacy manifest presence cannot be verified via App Store Connect metadata.")],
          why: "Apple expects apps to declare data collection and Required Reason API usage in a privacy manifest.",
          action: "Add a PrivacyInfo.xcprivacy file to the app target and declare collected data types plus Required Reason APIs you actually use.",
          verify: "In Xcode, confirm PrivacyInfo.xcprivacy is in the app target\u2019s Copy Bundle Resources."
        };
      }
      if (!inspection.privacyManifest.hasPrivacyManifest) {
        return {
          triggered: true,
          evidence: [evidence("PrivacyInfo.xcprivacy", "App bundle", "NOT_DETECTED", "No PrivacyInfo.xcprivacy file was found in the uploaded build.")],
          why: "Apple expects apps to declare data collection and Required Reason API usage in a privacy manifest.",
          action: "Add a PrivacyInfo.xcprivacy file to the app target and declare collected data types plus Required Reason APIs you actually use (for example UserDefaults).",
          verify: "In Xcode, confirm PrivacyInfo.xcprivacy is in the app target\u2019s Copy Bundle Resources."
        };
      }
      if (inspection.privacyManifest.accessedApiTypes.length === 0) {
        return {
          triggered: true,
          severity: "MEDIUM",
          evidence: [evidence("NSPrivacyAccessedAPITypes", "PrivacyInfo.xcprivacy", "DETECTED", "A privacy manifest is present, but no Required Reason API types were declared.")],
          why: "Most apps use UserDefaults or file timestamps. An empty Required Reason API list often causes validation warnings.",
          action: "Declare only the Required Reason APIs your app actually uses, with the matching reason codes.",
          verify: "Search the project for UserDefaults, file timestamps, disk space, and system boot time APIs."
        };
      }
      return empty;
    }
    case "RULE-PRIV-02": {
      const url = inspection.metadata.privacyPolicyUrl?.trim() || "";
      if (!url) {
        if (inspection.metadata.listingProvided) {
          return {
            triggered: true,
            severity: "MANUAL_CHECK",
            evidence: [evidence("privacyPolicyUrl", "App Store listing info", "UNKNOWN", "No App Store listing privacy URL was provided with this check.")],
            why: "Public App Store listings can be checked without a privacy URL, but you still need a live HTTPS policy for a real submission if the app collects data or has accounts.",
            action: "Add your privacy policy HTTPS URL in App Store Connect and confirm the page loads before publishing.",
            verify: "Open the URL in a browser and confirm it describes this app\u2019s data use."
          };
        }
        return {
          triggered: true,
          severity: "MANUAL_CHECK",
          evidence: [evidence("privacyPolicyUrl", "Submission info", "UNKNOWN", "No App Store listing privacy URL was provided with this check.")],
          why: "Apps that collect data or offer accounts need a live HTTPS privacy policy in App Store Connect and usually in-app.",
          action: "Add your privacy policy HTTPS URL on the next check (or in App Store Connect) and confirm the page loads.",
          verify: "Open the URL in a browser and confirm it describes this app\u2019s data use."
        };
      }
      if (!url.startsWith("https://")) {
        return {
          triggered: true,
          evidence: [evidence("privacyPolicyUrl", "App Store listing info", "DETECTED", "URL is missing https://.", url || "(none)")],
          why: "Apple expects a publicly reachable HTTPS privacy policy for submissions that collect data or use accounts.",
          action: "Set a live https:// privacy policy URL in App Store Connect and in the app if you collect data.",
          verify: "Visit the URL and confirm it is not a placeholder or 404."
        };
      }
      return empty;
    }
    case "RULE-PRIV-03": {
      const att = inspection.permissions.find((p) => p.key === "NSUserTrackingUsageDescription");
      if (inspection.features.hasAdvertising === "UNKNOWN" || inspection.privacyManifest.trackingEnabled === "UNKNOWN") {
        return {
          triggered: true,
          severity: "MANUAL_CHECK",
          evidence: [evidence("NSUserTrackingUsageDescription", "App Store Connect / Ad Tracking", "UNKNOWN", "Ad tracking and ATT configuration cannot be determined from basic App Store Connect info.")],
          why: "If the app tracks users across apps or sites, Apple expects an ATT prompt with a clear purpose string.",
          action: "If you collect IDFA or track users across third-party apps/websites, provide NSUserTrackingUsageDescription in Info.plist.",
          verify: "Confirm whether AdMob, AppsFlyer, or IDFA tracking is used."
        };
      }
      if (inspection.features.hasAdvertising || inspection.privacyManifest.trackingEnabled) {
        if (!att?.detected || !att.description.trim()) {
          return {
            triggered: true,
            evidence: [evidence("NSUserTrackingUsageDescription", "Info.plist", "NOT_DETECTED", "Tracking or ads were detected, but the App Tracking Transparency purpose string is missing or empty.")],
            why: "If the app tracks users across apps or sites, Apple expects an ATT prompt with a clear purpose string.",
            action: "Add NSUserTrackingUsageDescription that names the feature using tracking, or remove tracking/ad SDKs if you do not track.",
            verify: "Confirm whether AdMob, AppsFlyer, or IDFA tracking is actually used."
          };
        }
      }
      return empty;
    }
    case "RULE-PERM-01": {
      const weak = inspection.permissions.filter((p) => {
        if (!p.detected) return false;
        const desc = p.description.trim();
        return desc.length < 15 || /^(needed|required|app requires|functionality|camera access|location)$/i.test(desc);
      });
      if (weak.length === 0) return empty;
      return {
        triggered: true,
        evidence: weak.map((p) => evidence(p.key, "Info.plist", "DETECTED", "Purpose string is missing, too short, or too generic.", p.description || "(empty)")),
        why: "Users must understand why the app needs a sensitive permission. Vague text is a common rejection reason.",
        action: "Rewrite each flagged purpose string so it names the exact in-app feature that uses that permission.",
        verify: "Read each string as if you were a first-time user seeing the system prompt."
      };
    }
    case "RULE-PERM-02": {
      const alwaysLoc = inspection.permissions.find((p) => p.key === "NSLocationAlwaysAndWhenInUseUsageDescription");
      const hasBgLoc = inspection.backgroundModes.includes("location");
      if (alwaysLoc?.detected && !hasBgLoc) {
        return {
          triggered: true,
          evidence: [evidence("NSLocationAlwaysAndWhenInUseUsageDescription", "Info.plist", "DETECTED", "Always location is requested without a location background mode.")],
          why: "Always location without a clear background use (navigation, geofencing) is often considered excessive.",
          action: "Switch to When In Use if that is enough, or only keep Always location if you truly need background location and can explain it.",
          verify: "List the user-facing feature that needs location when the app is not on screen."
        };
      }
      return empty;
    }
    case "RULE-ACC-01": {
      if (inspection.features.hasAccountDeletion === "UNKNOWN" || inspection.features.hasThirdPartyAuth === "UNKNOWN" || inspection.features.hasSignInWithApple === "UNKNOWN") {
        return {
          triggered: true,
          severity: "MANUAL_CHECK",
          evidence: [evidence("Account deletion", "Account requirements", "UNKNOWN", "Account system configuration cannot be confirmed from App Store Connect metadata. If users can create accounts, in-app account deletion is mandatory.")],
          why: "If people can create an account, Apple expects a way to delete the account and associated data from inside the app.",
          action: "Add a clear Delete Account flow in settings (not only an email link), and confirm it actually deletes the account.",
          verify: "Sign in, open settings, and complete deletion on a test account."
        };
      }
      const hasAccounts = inspection.features.hasThirdPartyAuth || inspection.features.hasSignInWithApple;
      if (!hasAccounts) return empty;
      return {
        triggered: true,
        severity: "MANUAL_CHECK",
        evidence: [evidence("Account deletion", "App UI (not visible in the build scan)", "UNKNOWN", "Sign-in related signals were found. Whether account deletion exists in the UI cannot be verified from this upload.")],
        why: "If people can create an account, Apple expects a way to delete the account and associated data from inside the app.",
        action: "Add a clear Delete Account flow in settings (not only an email link), and confirm it actually deletes the account.",
        verify: "Sign in, open settings, and complete deletion on a test account."
      };
    }
    case "RULE-ACC-02": {
      if (inspection.features.hasThirdPartyAuth === "UNKNOWN" || inspection.features.hasSignInWithApple === "UNKNOWN") {
        return {
          triggered: true,
          severity: "MANUAL_CHECK",
          evidence: [evidence("Third-party login", "Authentication", "UNKNOWN", "Third-party login usage cannot be determined from App Store Connect metadata. If third-party login is used, Sign in with Apple must also be offered.")],
          why: "If the app uses a third-party social login, Apple also expects Sign in with Apple as an equivalent option.",
          action: "Add Sign in with Apple next to the other social login buttons, using AuthenticationServices.",
          verify: "Open the login screen and confirm Apple appears as a first-class option."
        };
      }
      if (inspection.features.hasThirdPartyAuth && !inspection.features.hasSignInWithApple) {
        return {
          triggered: true,
          evidence: [evidence("Third-party login", "Frameworks / URL schemes", "DETECTED", "Google or Facebook login signals were found without Sign in with Apple.", inspection.frameworks.filter((f) => /Google|Facebook/i.test(f)))],
          why: "If the app uses a third-party social login, Apple also expects Sign in with Apple as an equivalent option.",
          action: "Add Sign in with Apple next to the other social login buttons, using AuthenticationServices.",
          verify: "Open the login screen and confirm Apple appears as a first-class option."
        };
      }
      return empty;
    }
    case "RULE-ACC-03": {
      if (inspection.features.hasThirdPartyAuth === "UNKNOWN" || inspection.features.hasSignInWithApple === "UNKNOWN") {
        return {
          triggered: true,
          severity: "MANUAL_CHECK",
          evidence: [evidence("Login gate", "Account requirements", "UNKNOWN", "Account requirements cannot be determined from App Store Connect metadata. Ensure core features are accessible without mandatory login where feasible.")],
          why: "Apple often rejects apps that force account creation before the user can try features that do not need an account.",
          action: "Allow browsing or using core utility features without an account, and only require sign-in for sync, cloud, or personal data.",
          verify: "Fresh-install the app and see what is usable before any login."
        };
      }
      if (!(inspection.features.hasThirdPartyAuth || inspection.features.hasSignInWithApple)) return empty;
      return {
        triggered: true,
        severity: "MANUAL_CHECK",
        evidence: [evidence("Login gate", "App launch flow", "UNKNOWN", "The app appears to support accounts. Whether core features work without signing in cannot be determined from the binary scan.")],
        why: "Apple often rejects apps that force account creation before the user can try features that do not need an account.",
        action: "Allow browsing or using core utility features without an account, and only require sign-in for sync, cloud, or personal data.",
        verify: "Fresh-install the app and see what is usable before any login."
      };
    }
    case "RULE-IAP-01": {
      if (inspection.features.hasExternalPayments) {
        return {
          triggered: true,
          evidence: [evidence("Stripe", "Embedded frameworks", "DETECTED", "A Stripe SDK was found. Digital goods generally must use In-App Purchase, not an external checkout.")],
          why: "Charging for digital features through an external paywall (instead of StoreKit) is a common Guideline 3.1.1 rejection.",
          action: "Sell digital unlocks and subscriptions with StoreKit, or confirm you qualify for a rare exception (for example some reader apps) and document it.",
          verify: "Walk through every purchase path in the app and list which ones are digital vs physical/real-world."
        };
      }
      return empty;
    }
    case "RULE-SUB-01": {
      if (!(inspection.features.hasInAppPurchases || inspection.features.hasSubscriptions)) return empty;
      return {
        triggered: true,
        severity: "MANUAL_CHECK",
        evidence: [evidence("StoreKit / IAP", "Frameworks", "DETECTED", "In-app purchase libraries were found. A Restore Purchases control cannot be confirmed from this scan.", inspection.frameworks.filter((f) => /StoreKit|RevenueCat/i.test(f)))],
        why: "Paywalls for non-consumable purchases and subscriptions are expected to let users restore previous purchases.",
        action: "Put a working Restore Purchases control on the paywall and in settings, and test it in sandbox.",
        verify: "Buy on one install, restore on another sandbox account/device."
      };
    }
    case "RULE-SUB-02": {
      if (!(inspection.features.hasInAppPurchases || inspection.features.hasSubscriptions)) return empty;
      return {
        triggered: true,
        severity: "MANUAL_CHECK",
        evidence: [evidence("Paywall legal links", "Subscription / paywall UI", "UNKNOWN", "Purchases appear possible. Terms and privacy links on the paywall cannot be seen from this scan.")],
        why: "Subscription purchase screens are expected to show working Terms of Use and Privacy Policy links.",
        action: "Add Terms of Use (or Apple\u2019s standard EULA) and Privacy Policy links on the paywall, near the purchase button.",
        verify: "Open the paywall and tap both links."
      };
    }
    case "RULE-UGC-01": {
      if (inspection.features.hasUserGeneratedContent === "UNKNOWN") {
        return {
          triggered: true,
          severity: "MANUAL_CHECK",
          evidence: [evidence("User-generated content", "UGC moderation", "UNKNOWN", "UGC features cannot be confirmed from App Store Connect metadata. If the app hosts user-generated content, moderation and reporting mechanisms are required.")],
          why: "Feeds, chat, comments, or user uploads generally need reporting, blocking, and filtering of objectionable content.",
          action: "Add report and block actions on user content, plus filtering and a way to contact you about abuse.",
          verify: "Create two test accounts and walk through report and block."
        };
      }
      if (!inspection.features.hasUserGeneratedContent) return empty;
      return {
        triggered: true,
        severity: "MANUAL_CHECK",
        evidence: [evidence("User-generated content", "App category / features", "UNKNOWN", "This listing looks like it may include user content (for example a social category). Moderation tools cannot be verified automatically.")],
        why: "Feeds, chat, comments, or user uploads generally need reporting, blocking, and filtering of objectionable content.",
        action: "Add report and block actions on user content, plus filtering and a way to contact you about abuse.",
        verify: "Create two test accounts and walk through report and block."
      };
    }
    case "RULE-COMP-01": {
      const needsLogin = inspection.features.hasThirdPartyAuth || inspection.features.hasSignInWithApple;
      const notes = inspection.metadata.reviewerNotes?.trim() || "";
      if (inspection.features.hasThirdPartyAuth === "UNKNOWN" || inspection.features.hasSignInWithApple === "UNKNOWN") {
        if (notes.length < 8) {
          return {
            triggered: true,
            severity: "MANUAL_CHECK",
            evidence: [evidence("Reviewer notes", "Submission info", "UNKNOWN", "Account requirement cannot be confirmed from App Store Connect metadata and no reviewer notes or demo credentials were provided.")],
            why: "If App Review cannot reach core features without an account, they need a working demo login in Review Information.",
            action: "Create a durable test account, put username and password in App Store Connect Review Information, and include any 2FA bypass steps.",
            verify: "Log in with those credentials on a clean install before you submit."
          };
        }
        return empty;
      }
      if (!needsLogin) return empty;
      if (notes.length < 8) {
        return {
          triggered: true,
          severity: "MANUAL_CHECK",
          evidence: [evidence("Reviewer notes", "Submission info", "NOT_DETECTED", "The app appears to have a login, but no demo credentials were included with this check.")],
          why: "If App Review cannot reach the core features without an account, they need a working demo login in Review Information.",
          action: "Create a durable test account, put username and password in App Store Connect Review Information, and include any 2FA bypass steps.",
          verify: "Log in with those credentials on a clean install before you submit."
        };
      }
      return empty;
    }
    case "RULE-COMP-02": {
      const haystack = [
        inspection.metadata.name,
        inspection.metadata.subtitle,
        inspection.metadata.description,
        inspection.metadata.keywords,
        ...Array.isArray(inspection.rawInfo?.flattenedStrings) ? inspection.rawInfo.flattenedStrings : []
      ].join(" ");
      const match = haystack.match(/lorem ipsum|todo:|placeholder|test title|example\.com\/privacy/i);
      if (!match) return empty;
      return {
        triggered: true,
        evidence: [evidence("Placeholder copy", "Listing / Info.plist strings", "DETECTED", "Placeholder or draft text was found.", match[0])],
        why: "Placeholder copy, lorem ipsum, or unfinished screens make the submission look incomplete.",
        action: "Replace draft strings and sample URLs with the real production copy and live links.",
        verify: "Search the project and listing for lorem, TODO, placeholder, and example.com."
      };
    }
    case "RULE-META-01": {
      const meta = inspection.metadata;
      if (!meta.listingProvided && !meta.name && !meta.subtitle && !meta.description) {
        return {
          triggered: true,
          severity: "MANUAL_CHECK",
          evidence: [evidence("App Store listing", "Submission info", "UNKNOWN", "Title, subtitle, description, and keywords were not included with this check.")],
          why: "Listing fields have hard character limits and must match what the app actually does.",
          action: "Paste your App Store name, subtitle, description, and keywords into the next check.",
          verify: "Compare App Store Connect fields with the strings you intend to ship."
        };
      }
      const issues = [];
      if (meta.name && meta.name.length > 30) issues.push(`Name is ${meta.name.length} characters (max 30)`);
      if (meta.subtitle && meta.subtitle.length > 30) issues.push(`Subtitle is ${meta.subtitle.length} characters (max 30)`);
      if (meta.keywords && meta.keywords.length > 100) issues.push(`Keywords are ${meta.keywords.length} characters (max 100)`);
      if (issues.length === 0) return empty;
      return {
        triggered: true,
        evidence: [evidence("Listing length", "App Store listing info", "DETECTED", issues.join("; "), issues)],
        why: "App Store Connect rejects names and subtitles over 30 characters and keywords over 100.",
        action: "Shorten the flagged fields so they fit the limits.",
        verify: "Count characters in App Store Connect, not only in a notes app."
      };
    }
    case "RULE-META-02": {
      const desc = `${inspection.metadata.description || ""} ${inspection.metadata.keywords || ""}`;
      const match = desc.match(/\b(android|google play|play store|apk|windows phone)\b/i);
      if (!match) return empty;
      return {
        triggered: true,
        evidence: [evidence("Competitor mention", "Description / keywords", "DETECTED", `Mentioned "${match[0]}" in listing text.`, match[0])],
        why: "Pointing to other stores or platforms in the App Store listing is not allowed.",
        action: "Remove Android, Google Play, APK, and similar mentions from the description and keywords.",
        verify: "Search the full listing copy for those words."
      };
    }
    case "RULE-META-03": {
      const text = `${inspection.metadata.name || ""} ${inspection.metadata.subtitle || ""}`;
      const match = text.match(/\b(#1|number one|best|free|top-rated|\$\d)\b/i);
      if (!match) return empty;
      return {
        triggered: true,
        evidence: [evidence("Name / subtitle claim", "App Store listing info", "DETECTED", `Possible ranking or pricing claim: "${match[0]}".`, match[0])],
        why: "Names and subtitles should not include unproven rankings, \u201Cfree\u201D pricing claims, or similar marketing superlatives.",
        action: "Describe what the app does instead of calling it #1, best, or free in the name/subtitle.",
        verify: "Read the name and subtitle as they will appear on the store card."
      };
    }
    case "RULE-SHOT-01": {
      if (!inspection.screenshots.length) {
        return {
          triggered: true,
          severity: "MANUAL_CHECK",
          evidence: [evidence("Screenshots", "Submission assets", "UNKNOWN", "No screenshots were included with this check.")],
          why: "App Store Connect requires screenshots at exact device sizes. Wrong sizes block submission.",
          action: "Export screenshots at a required size (for example 1320\xD72868 or 1290\xD72796) and attach them on the next check.",
          verify: "Check pixel dimensions in Preview or the Finder Get Info panel."
        };
      }
      const measured = inspection.screenshots.filter((shot) => shot.precision === "EXACT" && typeof shot.isValidSize === "boolean");
      if (measured.length === 0) {
        return {
          triggered: true,
          severity: "MANUAL_CHECK",
          evidence: [evidence("Screenshots", "Submission assets", "UNKNOWN", "Screenshot pixel dimensions were not available for this check.")],
          why: "App Store Connect requires screenshots at exact device sizes, but this scan could not verify the uploaded image pixels.",
          action: "Confirm each screenshot uses an official App Store Connect pixel dimension before submitting.",
          verify: "Check the pixel dimensions of each screenshot in Preview or the Finder Get Info panel."
        };
      }
      const invalid = measured.filter((shot) => shot.isValidSize === false);
      if (invalid.length === 0) return empty;
      return {
        triggered: true,
        evidence: invalid.map((shot) => evidence(shot.name, "Screenshot assets", "DETECTED", `Size ${shot.width}\xD7${shot.height} is not a required App Store dimension.`, `${shot.width}x${shot.height}`)),
        why: "Screenshots must match Apple\u2019s listed pixel sizes for the device class you are submitting.",
        action: "Re-export the flagged images at an official size. Do not stretch or pad with empty canvas.",
        verify: "Compare each file to Apple\u2019s screenshot specifications."
      };
    }
    case "RULE-BG-01": {
      if (inspection.backgroundModes.length === 0) return empty;
      return {
        triggered: true,
        severity: "MANUAL_CHECK",
        evidence: [evidence("UIBackgroundModes", "Info.plist", "DETECTED", `Declared: ${inspection.backgroundModes.join(", ")}. Whether each mode is user-facing cannot be proven from the scan.`, inspection.backgroundModes)],
        why: "Background modes must match a real user feature (audio, navigation, VoIP, and so on). Unused modes get flagged.",
        action: "Remove any background mode you do not actually use. For each remaining mode, be ready to explain the feature to App Review.",
        verify: "Turn the feature off in code and confirm the matching mode is also removed from Info.plist."
      };
    }
    case "RULE-SEC-01": {
      const encryptionStatus = inspection.security.usesNonExemptEncryptionDeclared;
      if (encryptionStatus === false) return empty;
      if (encryptionStatus === true) {
        return {
          triggered: true,
          evidence: [evidence("ITSAppUsesNonExemptEncryption", "App Store Connect / Info.plist", "DETECTED", "Non-exempt encryption was declared and requires export compliance confirmation.")],
          why: "Apps using non-exempt encryption must complete Apple export compliance requirements.",
          action: "Complete the applicable export compliance questions in App Store Connect.",
          verify: "Confirm the encryption technology and required export documentation for this build."
        };
      }
      if (encryptionStatus === "UNKNOWN") {
        return {
          triggered: true,
          severity: "MANUAL_CHECK",
          evidence: [evidence("ITSAppUsesNonExemptEncryption", "App Store Connect / Info.plist", "UNKNOWN", "Export compliance status cannot be determined from basic App Store Connect info.")],
          why: "If you only use standard HTTPS / system encryption, declaring this key avoids a repeated compliance question.",
          action: "Declare ITSAppUsesNonExemptEncryption = false in Info.plist or answer export compliance questions in App Store Connect.",
          verify: "Confirm you are not using custom crypto beyond HTTPS and Apple\u2019s APIs."
        };
      }
      return {
        triggered: true,
        evidence: [evidence("ITSAppUsesNonExemptEncryption", "Info.plist", "NOT_DETECTED", "Export compliance key is missing. App Store Connect will ask about encryption on every upload.")],
        why: "If you only use standard HTTPS / system encryption, declaring this key avoids a repeated compliance question.",
        action: "Add ITSAppUsesNonExemptEncryption = false unless you use non-exempt encryption.",
        verify: "Confirm you are not using custom crypto beyond HTTPS and Apple\u2019s APIs."
      };
    }
    case "RULE-SEC-02": {
      if (inspection.security.atsAllowsArbitraryLoads === "UNKNOWN") {
        return {
          triggered: true,
          severity: "MANUAL_CHECK",
          evidence: [evidence("NSAllowsArbitraryLoads", "App Transport Security", "UNKNOWN", "ATS configuration cannot be determined from App Store Connect metadata.")],
          why: "Open ATS exceptions are hard to justify. Reviewers expect HTTPS unless a specific domain needs an exception.",
          action: "Ensure NSAllowsArbitraryLoads is disabled in Info.plist and use HTTPS.",
          verify: "Confirm your app connects exclusively via secure HTTPS."
        };
      }
      if (!inspection.security.atsAllowsArbitraryLoads) return empty;
      return {
        triggered: true,
        evidence: [evidence("NSAllowsArbitraryLoads", "Info.plist \u2192 NSAppTransportSecurity", "DETECTED", "Arbitrary loads are enabled, which allows insecure HTTP.")],
        why: "Open ATS exceptions are hard to justify. Reviewers expect HTTPS unless a specific domain needs an exception.",
        action: "Turn off NSAllowsArbitraryLoads and use HTTPS, or limit exceptions to named domains you can explain.",
        verify: "Load every API on HTTPS in a production build."
      };
    }
    default:
      return empty;
  }
}
function evaluateInspection(inspection, appId, buildNumber, appVersion, existingFindings = [], isListingOnly = false, auditType) {
  const resolvedAuditType = auditType ? auditType : isListingOnly || inspection.metadata?.listingProvided ? "LISTING_SCAN" : "BINARY_SCAN";
  const isListing = isListingOnly || resolvedAuditType === "LISTING_SCAN";
  const auditId = `audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const findings = [];
  const passedChecks = [];
  const existingStatusMap = /* @__PURE__ */ new Map();
  existingFindings.forEach((f) => existingStatusMap.set(f.ruleId, f));
  const effectiveRules = getEffectiveRules();
  for (const rule of effectiveRules) {
    if (!rule.enabled) continue;
    if (isListing) {
      const allowedListingRules = [
        "RULE-PRIV-02",
        "RULE-META-01",
        "RULE-META-02",
        "RULE-META-03",
        "RULE-SHOT-01",
        "RULE-COMP-02"
      ];
      if (!allowedListingRules.includes(rule.id)) {
        continue;
      }
    }
    const result = evaluateRule(rule.id, inspection, rule.description, rule.remediationGuidance);
    if (!result.triggered) {
      passedChecks.push({ ruleId: rule.id, title: rule.title });
      continue;
    }
    const existing = existingStatusMap.get(rule.id);
    const severity = result.severity || rule.severity;
    const stillOpen = severity === "MANUAL_CHECK" ? "MANUAL_REVIEW" : "OPEN";
    const status = existing?.status === "WONT_FIX" ? "WONT_FIX" : stillOpen;
    findings.push({
      id: existing?.id || `finding_${rule.id}_${Math.random().toString(36).slice(2, 7)}`,
      auditId,
      ruleId: rule.id,
      category: rule.category,
      guidelineRef: typeof rule.guidelineRef === "object" ? rule.guidelineRef : {
        number: rule.guidelineRef,
        title: rule.title,
        url: rule.sourceUrl || "https://developer.apple.com/app-store/review/guidelines/"
      },
      title: rule.title,
      severity,
      whyItMatters: result.why,
      evidence: result.evidence,
      whatToVerify: result.verify,
      recommendedAction: result.action,
      codeSnippet: rule.codeSnippet,
      confidence: rule.confidence,
      status,
      notes: existing?.notes || [],
      createdAt: existing?.createdAt || (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
  const severityRank = { HIGH: 0, MEDIUM: 1, LOW: 2, MANUAL_CHECK: 3 };
  findings.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);
  let highCount = 0;
  let medCount = 0;
  let lowCount = 0;
  let manualCount = 0;
  let openCount = 0;
  let resolvedCount = 0;
  findings.forEach((f) => {
    if (f.status === "FIXED" || f.status === "WONT_FIX") {
      resolvedCount++;
      return;
    }
    openCount++;
    if (f.severity === "HIGH") highCount++;
    if (f.severity === "MEDIUM") medCount++;
    if (f.severity === "LOW") lowCount++;
    if (f.severity === "MANUAL_CHECK") manualCount++;
  });
  const readinessStatus = computeReadiness(findings);
  const copy = readinessCopy(readinessStatus);
  let summary = "";
  if (resolvedAuditType === "LISTING_SCAN") {
    summary = `Storefront Listing Audit: Verified public App Store metadata, descriptions, category rules, and screenshot compliance. ${highCount} high, ${medCount} medium, ${lowCount} low priority issue${lowCount === 1 ? "" : "s"}. Deep binary checks (Privacy Manifests, Required Reason APIs, ATS encryption) require your compiled build.`;
  } else if (resolvedAuditType === "CONNECT_SCAN") {
    summary = `App Store Connect Sync Audit: Checked live App Store version states, descriptions, keywords, promotional text, support URLs, In-App Purchase products, and TestFlight builds. ${highCount} high, ${medCount} medium, ${lowCount} low.`;
  } else {
    summary = `${copy.summaryHint} ${highCount} high, ${medCount} medium, ${lowCount} low, ${manualCount} manual check${manualCount === 1 ? "" : "s"}. ${passedChecks.length} check${passedChecks.length === 1 ? "" : "s"} looked clear in this run.`;
  }
  const siwaLine = inspection.features.hasSignInWithApple === true ? "- Sign in with Apple appears to be present in the build scan." : inspection.features.hasSignInWithApple === "UNKNOWN" ? "- Sign in with Apple status: not determined from Connect metadata." : "- Sign in with Apple was not detected in this scan.";
  const privacyLine = inspection.metadata.privacyPolicyUrl ? `- Privacy Policy: ${inspection.metadata.privacyPolicyUrl}` : "- Privacy Policy URL: not provided with this check.";
  return {
    id: auditId,
    appId,
    buildNumber,
    appVersion,
    auditType: resolvedAuditType,
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    readinessStatus,
    ruleVersion: "2026.2-phase-a",
    summary,
    totalFindings: findings.length,
    openFindings: openCount,
    resolvedFindings: resolvedCount,
    highRiskCount: highCount,
    mediumRiskCount: medCount,
    lowRiskCount: lowCount,
    manualCheckCount: manualCount,
    infoCount: manualCount,
    findings,
    passedChecks,
    reviewerNotesDraft: inspection.metadata.reviewerNotes?.trim() ? inspection.metadata.reviewerNotes : `App Version: ${appVersion} (Build ${buildNumber})

Notes for App Review:
${siwaLine}
${privacyLine}
- Support: ${inspection.metadata.supportUrl || "(not provided)"}`
  };
}
var init_evaluator = __esm({
  "src/engine/evaluator.ts"() {
    init_rules();
    init_extractor();
  }
});

// src/config/admin.ts
var ADMIN_EMAILS;
var init_admin = __esm({
  "src/config/admin.ts"() {
    ADMIN_EMAILS = [
      "founder@tesima-media.com",
      "jailadeen149@gmail.com",
      "jmohammadali5427@gmail.com"
    ];
  }
});

// src/server/appStoreConnect.ts
function normalizePrivateKeyPem(rawPem) {
  let cleaned = rawPem.trim();
  if (!cleaned.includes("-----BEGIN PRIVATE KEY-----") && !cleaned.includes("-----BEGIN EC PRIVATE KEY-----")) {
    cleaned = `-----BEGIN PRIVATE KEY-----
${cleaned}
-----END PRIVATE KEY-----`;
  }
  return cleaned;
}
function generateAppStoreConnectJWT(issuerId, keyId, privateKeyPem) {
  const normalizedKey = normalizePrivateKeyPem(privateKeyPem);
  const now = Math.floor(Date.now() / 1e3);
  const payload = {
    iss: issuerId.trim(),
    iat: now,
    exp: now + 1199,
    // 20 minutes max limit from Apple
    aud: "appstoreconnect-v1"
  };
  return import_jsonwebtoken.default.sign(payload, normalizedKey, {
    algorithm: "ES256",
    header: {
      alg: "ES256",
      kid: keyId.trim(),
      typ: "JWT"
    }
  });
}
async function fetchWithTimeout(url, jwtToken, timeoutMs = 12e3) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${jwtToken}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (response.status === 401) {
      throw new Error("Apple Authentication Failed (401): Invalid Key ID, Issuer ID, or revoked .p8 private key.");
    }
    if (response.status === 403) {
      throw new Error("Apple Authorization Failed (403): The API key lacks necessary permissions (Admin or App Manager required).");
    }
    if (response.status === 429) {
      throw new Error("Apple Rate Limit Exceeded (429): Too many requests to App Store Connect API. Please retry shortly.");
    }
    if (!response.ok) {
      let errorDetail = "";
      try {
        const errorJson = await response.json();
        if (errorJson.errors && errorJson.errors.length > 0) {
          errorDetail = errorJson.errors.map((e) => e.detail || e.title).join("; ");
        }
      } catch {
        errorDetail = await response.text().catch(() => "");
      }
      throw new Error(`Apple API Error (${response.status}): ${errorDetail || response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === "AbortError") {
      throw new Error("Timeout connecting to Apple App Store Connect API. Please verify your connection.");
    }
    throw error;
  }
}
async function testAppStoreConnectCredentials(issuerId, keyId, privateKeyPem) {
  const token = generateAppStoreConnectJWT(issuerId, keyId, privateKeyPem);
  const data = await fetchWithTimeout("https://api.appstoreconnect.apple.com/v1/apps?limit=5", token);
  const appCount = (data.data || []).length;
  return { success: true, appCount };
}
async function fetchAppsFromConnect(jwtToken) {
  const data = await fetchWithTimeout("https://api.appstoreconnect.apple.com/v1/apps?limit=100&include=appInfos,appStoreVersions", jwtToken);
  return data.data || [];
}
async function fetchAppDetails(jwtToken, appId) {
  const appResponse = await fetchWithTimeout(`https://api.appstoreconnect.apple.com/v1/apps/${appId}`, jwtToken);
  const app2 = appResponse.data;
  let appInfos = [];
  let inAppPurchases = [];
  let subscriptionGroups = [];
  let privacyPolicyUrl;
  let privacyChoicesUrl;
  let supportUrl;
  let marketingUrl;
  let description;
  let subtitle;
  let keywords;
  let promotionalText;
  let whatsNew;
  let ageRating;
  let version = "1.0.0";
  let buildNumber = "1";
  let minOsVersion;
  let usesNonExemptEncryption = "UNKNOWN";
  const screenshots = [];
  try {
    const [versionRes, infoRes, buildsRes, iapRes, subscriptionRes] = await Promise.allSettled([
      fetchWithTimeout(`https://api.appstoreconnect.apple.com/v1/apps/${appId}/appStoreVersions?limit=5&include=appStoreVersionLocalizations`, jwtToken),
      fetchWithTimeout(`https://api.appstoreconnect.apple.com/v1/apps/${appId}/appInfos?include=appInfoLocalizations,ageRatingDeclaration`, jwtToken),
      fetchWithTimeout(`https://api.appstoreconnect.apple.com/v1/builds?filter[app]=${appId}&limit=1&sort=-uploadedDate`, jwtToken),
      fetchWithTimeout(`https://api.appstoreconnect.apple.com/v1/apps/${appId}/inAppPurchasesV2?limit=50`, jwtToken),
      fetchWithTimeout(`https://api.appstoreconnect.apple.com/v1/apps/${appId}/subscriptionGroups?limit=50`, jwtToken)
    ]);
    if (versionRes.status === "fulfilled" && versionRes.value?.data && versionRes.value.data.length > 0) {
      const primaryVersion = versionRes.value.data[0];
      version = primaryVersion.attributes?.versionString || "1.0.0";
      const includedLocs = versionRes.value.included?.filter((inc) => inc.type === "appStoreVersionLocalizations") || [];
      let primaryLocId;
      if (includedLocs.length > 0) {
        const primaryLoc = includedLocs[0].attributes || {};
        description = primaryLoc.description;
        keywords = primaryLoc.keywords;
        supportUrl = primaryLoc.supportUrl;
        marketingUrl = primaryLoc.marketingUrl;
        promotionalText = primaryLoc.promotionalText;
        whatsNew = primaryLoc.whatsNew;
        primaryLocId = includedLocs[0].id;
      } else {
        const versionId = primaryVersion.id;
        const locRes = await fetchWithTimeout(`https://api.appstoreconnect.apple.com/v1/appStoreVersions/${versionId}/appStoreVersionLocalizations`, jwtToken).catch(() => null);
        if (locRes?.data && locRes.data.length > 0) {
          const locAttr = locRes.data[0].attributes || {};
          description = locAttr.description;
          keywords = locAttr.keywords;
          supportUrl = locAttr.supportUrl;
          marketingUrl = locAttr.marketingUrl;
          promotionalText = locAttr.promotionalText;
          whatsNew = locAttr.whatsNew;
          primaryLocId = locRes.data[0].id;
        }
      }
      if (primaryLocId) {
        const ssSetsRes = await fetchWithTimeout(`https://api.appstoreconnect.apple.com/v1/appStoreVersionLocalizations/${primaryLocId}/appScreenshotSets?include=appScreenshots`, jwtToken).catch(() => null);
        if (ssSetsRes?.included) {
          for (const item of ssSetsRes.included) {
            if (item.type === "appScreenshots" && item.attributes?.imageAsset) {
              const asset = item.attributes.imageAsset;
              screenshots.push({
                url: asset.templateUrl || "",
                width: asset.width || 0,
                height: asset.height || 0,
                deviceType: item.attributes.screenshotDisplayType || "IPHONE"
              });
            }
          }
        }
      }
    }
    if (infoRes.status === "fulfilled") {
      appInfos = infoRes.value.data || [];
      if (appInfos.length > 0) {
        const attributes = appInfos[0].attributes || {};
        const declarationFromIncluded = infoRes.value.included?.find((inc) => inc.type === "ageRatingDeclarations" || inc.type === "ageRatingDeclaration");
        ageRating = declarationFromIncluded?.attributes?.rating || attributes.ageRatingDeclaration?.rating;
        const includedInfoLocs = infoRes.value.included?.filter((inc) => inc.type === "appInfoLocalizations") || [];
        if (includedInfoLocs.length > 0) {
          const infoLoc = includedInfoLocs[0].attributes || {};
          privacyPolicyUrl = infoLoc.privacyPolicyUrl;
          privacyChoicesUrl = infoLoc.privacyChoicesUrl;
          subtitle = infoLoc.subtitle;
        } else {
          const infoId = appInfos[0].id;
          const locRes = await fetchWithTimeout(`https://api.appstoreconnect.apple.com/v1/appInfos/${infoId}/appInfoLocalizations`, jwtToken).catch(() => null);
          if (locRes?.data && locRes.data.length > 0) {
            const locAttr = locRes.data[0].attributes || {};
            privacyPolicyUrl = locAttr.privacyPolicyUrl;
            privacyChoicesUrl = locAttr.privacyChoicesUrl;
            subtitle = locAttr.subtitle;
          }
        }
      }
    }
    if (buildsRes.status === "fulfilled" && buildsRes.value?.data && buildsRes.value.data.length > 0) {
      const latestBuild = buildsRes.value.data[0];
      buildNumber = latestBuild.attributes?.version || "1";
      minOsVersion = latestBuild.attributes?.minOsVersion;
      if (typeof latestBuild.attributes?.usesNonExemptEncryption === "boolean") {
        usesNonExemptEncryption = latestBuild.attributes.usesNonExemptEncryption;
      }
    }
    if (iapRes.status === "fulfilled") {
      inAppPurchases = iapRes.value?.data || [];
    }
    if (subscriptionRes.status === "fulfilled") {
      subscriptionGroups = subscriptionRes.value?.data || [];
    }
  } catch (err) {
    console.warn("[Connect] Error fetching App Store Connect details in parallel:", err);
  }
  return {
    app: app2,
    appInfos,
    inAppPurchases,
    subscriptionGroups,
    privacyPolicyUrl,
    privacyChoicesUrl,
    supportUrl,
    marketingUrl,
    description,
    subtitle,
    keywords,
    promotionalText,
    whatsNew,
    ageRating,
    version,
    buildNumber,
    minOsVersion,
    usesNonExemptEncryption,
    screenshots
  };
}
function encryptKey(text, secret) {
  const key = import_crypto.default.createHash("sha256").update(secret).digest();
  const iv = import_crypto.default.randomBytes(12);
  const cipher = import_crypto.default.createCipheriv("aes-256-gcm", key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");
  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}
function decryptKey(encryptedText, secret) {
  const parts = encryptedText.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted key format");
  }
  const iv = Buffer.from(parts[0], "hex");
  const authTag = Buffer.from(parts[1], "hex");
  const encrypted = parts[2];
  const key = import_crypto.default.createHash("sha256").update(secret).digest();
  const decipher = import_crypto.default.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}
var import_jsonwebtoken, import_crypto;
var init_appStoreConnect = __esm({
  "src/server/appStoreConnect.ts"() {
    import_jsonwebtoken = __toESM(require("jsonwebtoken"), 1);
    import_crypto = __toESM(require("crypto"), 1);
  }
});

// src/engine/appStoreConnectExtractor.ts
function extractFromAppStoreConnect(details) {
  const {
    app: app2,
    appInfos,
    inAppPurchases,
    subscriptionGroups,
    privacyPolicyUrl,
    supportUrl,
    description: fetchedDescription,
    subtitle: fetchedSubtitle,
    keywords,
    ageRating,
    version,
    buildNumber,
    minOsVersion,
    usesNonExemptEncryption,
    screenshots
  } = details;
  const primaryInfo = appInfos[0]?.attributes || {};
  const name = app2.attributes?.name || primaryInfo.name || "App Store Connect App";
  const subtitle = fetchedSubtitle || primaryInfo.subtitle || void 0;
  const description = fetchedDescription || primaryInfo.description || void 0;
  let normalizedAgeRating = "4+";
  if (ageRating) {
    const match = ageRating.match(/^([A-Z_]+)_PLUS$/);
    if (match) {
      const words = {
        FOUR: "4",
        NINE: "9",
        TWELVE: "12",
        SEVENTEEN: "17"
      };
      normalizedAgeRating = `${words[match[1]] || match[1]}+`;
    } else if (ageRating === "NO_RATING") {
      normalizedAgeRating = "4+";
    }
  }
  const category = app2.relationships?.primaryCategory?.data?.id || "Utilities";
  return {
    bundleId: app2.attributes?.bundleId || "UNKNOWN",
    appName: name,
    version: version || "1.0.0",
    build: buildNumber || "1",
    minOSVersion: minOsVersion || "UNKNOWN",
    targetDevices: ["iPhone", "iPad"],
    permissions: [],
    entitlements: [],
    urlSchemes: [],
    associatedDomains: [],
    frameworks: [],
    extensions: [],
    backgroundModes: [],
    privacyManifest: {
      hasPrivacyManifest: "UNKNOWN",
      // Cannot check via basic Connect metadata
      trackingEnabled: "UNKNOWN",
      collectedDataTypes: [],
      accessedApiTypes: []
    },
    security: {
      atsAllowsArbitraryLoads: "UNKNOWN",
      usesNonExemptEncryptionDeclared: usesNonExemptEncryption !== void 0 ? usesNonExemptEncryption : "UNKNOWN"
    },
    features: {
      hasInAppPurchases: inAppPurchases.length > 0,
      hasSubscriptions: subscriptionGroups.length > 0,
      hasThirdPartyAuth: "UNKNOWN",
      hasSignInWithApple: "UNKNOWN",
      hasAccountDeletion: "UNKNOWN",
      hasUserGeneratedContent: "UNKNOWN",
      hasAdvertising: "UNKNOWN"
    },
    metadata: {
      name,
      subtitle,
      description,
      keywords,
      privacyPolicyUrl,
      supportUrl: supportUrl || void 0,
      category,
      ageRating: normalizedAgeRating,
      listingProvided: true
    },
    screenshots: screenshots && screenshots.length > 0 ? screenshots.map((s, idx) => {
      const exactMatch = APP_STORE_SCREENSHOT_SIZES.find(
        (size) => size.width === s.width && size.height === s.height || size.width === s.height && size.height === s.width
      );
      return {
        id: `ss_connect_${idx + 1}`,
        name: `Screenshot ${idx + 1}`,
        width: s.width,
        height: s.height,
        format: "PNG",
        deviceTarget: s.deviceType || exactMatch?.label || "UNKNOWN",
        aspectRatio: s.height > s.width ? "9:19.5" : "19.5:9",
        isValidSize: Boolean(exactMatch),
        precision: exactMatch ? "EXACT" : "UNKNOWN"
      };
    }) : [],
    rawInfo: {
      ...details,
      appleAppId: app2.id,
      app: {
        ...app2,
        id: app2.id
      }
    }
  };
}
var init_appStoreConnectExtractor = __esm({
  "src/engine/appStoreConnectExtractor.ts"() {
    init_extractor();
  }
});

// devServer.ts
var devServer_exports = {};
__export(devServer_exports, {
  startServer: () => startServer
});
async function startServer() {
  const app2 = createServerApp();
  const PORT = 3e3;
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app2.use(vite.middlewares);
  } else {
    const distPath = import_path.default.resolve("dist");
    app2.use(import_express.default.static(distPath));
    app2.get(/^\/(?!api(?:\/|$)).*$/, (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app2.listen(PORT, "0.0.0.0", () => {
    console.log(`Fixit server running on http://localhost:${PORT}`);
  });
}
var import_path, import_url, import_vite, import_express, import_meta;
var init_devServer = __esm({
  "devServer.ts"() {
    import_path = __toESM(require("path"), 1);
    import_url = require("url");
    import_vite = require("vite");
    import_express = __toESM(require("express"), 1);
    init_server();
    import_meta = {};
    if (process.argv[1] && (0, import_url.fileURLToPath)(import_meta.url) === import_path.default.resolve(process.argv[1])) {
      startServer().catch((err) => {
        console.error("Failed to start server:", err);
      });
    }
  }
});

// server.ts
function getClientIdentity(req) {
  const userId = req.user?.id;
  if (userId) return `user:${String(userId)}`;
  const forwardedFor = req.headers["x-forwarded-for"];
  const forwardedIp = Array.isArray(forwardedFor) ? forwardedFor[0] : typeof forwardedFor === "string" ? forwardedFor.split(",")[0].trim() : "";
  return forwardedIp || req.socket?.remoteAddress || req.ip || "unknown";
}
function rateLimiter(req, res, next) {
  const ip = getClientIdentity(req);
  const now = Date.now();
  const limit = 10;
  const timeframe = 60 * 60 * 1e3;
  const record = rateLimitCache.get(ip);
  if (!record) {
    rateLimitCache.set(ip, { count: 1, resetTime: now + timeframe });
    return next();
  }
  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + timeframe;
    return next();
  }
  if (record.count >= limit) {
    return res.status(429).json({ error: "Too many requests. Please try again in an hour." });
  }
  record.count++;
  next();
}
function createServerApp() {
  const app2 = (0, import_express2.default)();
  app2.use(import_express2.default.json({ limit: "50mb" }));
  app2.use(import_express2.default.urlencoded({ extended: true, limit: "50mb" }));
  app2.get("/api/health", (req, res) => {
    res.json({
      status: "healthy",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      version: "1.0.0",
      geminiConfigured: !!process.env.GEMINI_API_KEY
    });
  });
  app2.post("/api/ai/correlate", userAuthMiddleware, async (req, res) => {
    const { inspection, findings } = req.body;
    if (!inspection || !findings) {
      return res.status(400).json({ error: "Missing inspection or findings payload" });
    }
    try {
      const result = await enhanceAuditWithAI(inspection, findings);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message || "AI correlation failed" });
    }
  });
  app2.post("/api/rejection/analyze", userAuthMiddleware, async (req, res) => {
    const { rejectionText } = req.body;
    if (typeof rejectionText !== "string" || rejectionText.trim() === "") {
      return res.status(400).json({ error: "Rejection text must be a non-empty string" });
    }
    try {
      const result = await analyzeAppleRejectionWithAI(rejectionText);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message || "Rejection analysis failed" });
    }
  });
  app2.post("/api/metadata/validate", userAuthMiddleware, async (req, res) => {
    const { metadata } = req.body;
    if (!metadata) {
      return res.status(400).json({ error: "Metadata payload required" });
    }
    try {
      const result = await analyzeMetadataWithAI(metadata);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message || "Metadata validation failed" });
    }
  });
  app2.post("/api/itunes-search", rateLimiter, async (req, res) => {
    const { term } = req.body;
    if (typeof term !== "string" || term.trim() === "") {
      return res.status(400).json({ error: "Please enter a search term." });
    }
    try {
      const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=software&limit=25`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8e3);
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (!response.ok) {
        return res.status(response.status).json({ error: "Failed to fetch from iTunes API" });
      }
      const data = await response.json();
      const results = (data.results || []).map((app3) => ({
        trackId: app3.trackId,
        trackName: app3.trackName,
        artistName: app3.artistName,
        primaryGenreName: app3.primaryGenreName,
        artworkUrl512: app3.artworkUrl512 || app3.artworkUrl100,
        averageUserRating: app3.averageUserRating,
        userRatingCount: app3.userRatingCount,
        bundleId: app3.bundleId,
        version: app3.version,
        formattedPrice: app3.formattedPrice
      }));
      res.json({ results });
    } catch (err) {
      if (err.name === "AbortError") {
        return res.status(503).json({ error: "Couldn't reach the App Store right now, try again in a moment." });
      }
      res.status(500).json({ error: err.message || "Search failed" });
    }
  });
  app2.post("/api/try-now", rateLimiter, async (req, res) => {
    const { query } = req.body;
    if (typeof query !== "string" || query.trim() === "") {
      return res.status(400).json({ error: "Please enter a valid app name or App Store link." });
    }
    try {
      const inspection = await extractFromItunesLookup(query);
      if (!inspection) {
        return res.status(404).json({ error: "We couldn't find that app on the App Store. Make sure it's spelled correctly or try using the direct App Store URL/ID." });
      }
      const auditRun = evaluateInspection(
        inspection,
        `try_now_${inspection.bundleId}`,
        "1",
        inspection.version,
        [],
        true
        // isListingOnly = true
      );
      res.json({
        inspection,
        auditRun
      });
    } catch (err) {
      console.error("Try-now error:", err);
      if (err.message === "TIMEOUT" || err.message === "NETWORK_ERROR") {
        return res.status(503).json({ error: "Couldn't reach the App Store right now, try again in a moment." });
      }
      res.status(500).json({ error: err.message || "Failed to check app" });
    }
  });
  app2.post("/api/screenshots/validate", (req, res) => {
    const { width, height, fileName } = req.body;
    if (typeof width !== "number" || typeof height !== "number" || isNaN(width) || isNaN(height)) {
      return res.status(400).json({
        error: "Invalid screenshot dimensions. Both width and height must be valid numbers."
      });
    }
    const issues = [];
    const warnings = [];
    let matchedDevice = "Unknown";
    let isValidDimension = false;
    const validSizes = APP_STORE_SCREENSHOT_SIZES.map((size) => ({
      name: size.label,
      w: size.width,
      h: size.height
    }));
    const match = validSizes.find(
      (s) => s.w === width && s.h === height || s.w === height && s.h === width
    );
    if (match) {
      matchedDevice = match.name;
      isValidDimension = true;
    } else {
      issues.push(`Dimensions ${width}x${height} do not match Apple App Store Connect specifications.`);
    }
    if (width < 1e3 || height < 1e3) {
      warnings.push("Image resolution may appear pixelated on high-DPI Retina displays.");
    }
    res.json({
      fileName: fileName || "screenshot.png",
      width,
      height,
      matchedDevice,
      isValidDimension,
      issues,
      warnings
    });
  });
  const connectRateLimitCache = /* @__PURE__ */ new Map();
  function connectRateLimiter(req, res, next) {
    const ip = getClientIdentity(req);
    const now = Date.now();
    const limit = 60;
    const timeframe = 60 * 60 * 1e3;
    const record = connectRateLimitCache.get(ip);
    if (!record) {
      connectRateLimitCache.set(ip, { count: 1, resetTime: now + timeframe });
      return next();
    }
    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + timeframe;
      return next();
    }
    if (record.count >= limit) {
      return res.status(429).json({ error: "Too many connection attempts. Please try again later." });
    }
    record.count++;
    next();
  }
  app2.post("/api/connect/save-key", userAuthMiddleware, connectRateLimiter, async (req, res) => {
    const { issuerId, keyId, privateKeyPem } = req.body;
    if (!issuerId || !keyId || !privateKeyPem) {
      return res.status(400).json({ error: "Issuer ID, Key ID, and Private Key (PEM) are required." });
    }
    let secret;
    try {
      secret = getConnectSecret();
    } catch (err) {
      return res.status(500).json({ error: err.message || "Connect key encryption is not configured for this environment." });
    }
    const user = req.user;
    const token = req.token;
    try {
      let testResult;
      try {
        testResult = await testAppStoreConnectCredentials(issuerId, keyId, privateKeyPem);
      } catch (authErr) {
        console.error("Apple Connect auth verification failed:", authErr.message);
        return res.status(400).json({
          error: authErr.message || "Apple authentication failed. Please verify your Issuer ID, Key ID, and .p8 private key file."
        });
      }
      const encryptedPem = encryptKey(privateKeyPem, secret);
      const userClient = (0, import_sdk.createClient)({
        baseUrl: process.env.VITE_INSFORGE_BASE_URL || "",
        anonKey: process.env.VITE_INSFORGE_ANON_KEY || "",
        isServerMode: true
      });
      userClient.setAuthToken(token);
      await userClient.database.from("app_store_connect_keys").delete().eq("user_id", user.id);
      const { error } = await userClient.database.from("app_store_connect_keys").insert([{
        user_id: user.id,
        issuer_id: issuerId.trim(),
        key_id: keyId.trim(),
        encrypted_pem: encryptedPem
      }]);
      if (error) {
        console.error("Error storing key:", error.message);
        return res.status(500).json({ error: "Failed to save connection details to database." });
      }
      res.json({
        success: true,
        keyId: keyId.trim(),
        issuerId: issuerId.trim(),
        appCount: testResult.appCount,
        maskedKey: `Key ending in ...${keyId.trim().slice(-4)}`
      });
    } catch (err) {
      console.error("Save key error:", err.message);
      res.status(500).json({ error: err.message || "An unexpected error occurred while saving the key." });
    }
  });
  app2.post("/api/connect/list-apps", userAuthMiddleware, connectRateLimiter, async (req, res) => {
    let secret;
    try {
      secret = getConnectSecret();
    } catch (err) {
      return res.status(500).json({ error: err.message || "Connect key encryption is not configured for this environment." });
    }
    const user = req.user;
    const token = req.token;
    try {
      const { baseUrl, anonKey } = getInsforgeConfig();
      const userClient = (0, import_sdk.createClient)({
        baseUrl,
        anonKey,
        isServerMode: true
      });
      userClient.setAuthToken(token);
      const { data, error } = await userClient.database.from("app_store_connect_keys").select("*").eq("user_id", user.id).maybeSingle();
      if (error) {
        console.error("Fetch key failed:", error.message);
        return res.status(500).json({ error: "Failed to read connection details." });
      }
      if (!data) {
        return res.json({ apps: [], connected: false });
      }
      const decryptedPem = decryptKey(data.encrypted_pem, secret);
      const jwt2 = generateAppStoreConnectJWT(data.issuer_id, data.key_id, decryptedPem);
      const apps = await fetchAppsFromConnect(jwt2);
      res.json({
        connected: true,
        maskedKey: `Key ending in ...${data.key_id.slice(-4)}`,
        apps: apps.map((a) => ({
          id: a.id,
          name: a.attributes?.name || "App",
          bundleId: a.attributes?.bundleId || "N/A",
          sku: a.attributes?.sku || "N/A",
          primaryLocale: a.attributes?.primaryLocale || "en-US"
        }))
      });
    } catch (err) {
      console.error("List apps error:", err.message);
      res.status(500).json({ error: err.message || "Failed to list apps from App Store Connect." });
    }
  });
  app2.post("/api/connect/check-app", userAuthMiddleware, connectRateLimiter, async (req, res) => {
    const { appId } = req.body;
    if (!appId) {
      return res.status(400).json({ error: "appId parameter is required." });
    }
    let secret;
    try {
      secret = getConnectSecret();
    } catch (err) {
      return res.status(500).json({ error: err.message || "Connect key encryption is not configured for this environment." });
    }
    const user = req.user;
    const token = req.token;
    try {
      const { baseUrl, anonKey } = getInsforgeConfig();
      const userClient = (0, import_sdk.createClient)({
        baseUrl,
        anonKey,
        isServerMode: true
      });
      userClient.setAuthToken(token);
      const { data, error } = await userClient.database.from("app_store_connect_keys").select("*").eq("user_id", user.id).maybeSingle();
      if (error || !data) {
        return res.status(404).json({ error: "App Store Connect credentials not found. Please connect your key in Account Settings." });
      }
      const decryptedPem = decryptKey(data.encrypted_pem, secret);
      const jwt2 = generateAppStoreConnectJWT(data.issuer_id, data.key_id, decryptedPem);
      const details = await fetchAppDetails(jwt2, appId);
      const inspection = extractFromAppStoreConnect(details);
      const auditRun = evaluateInspection(
        inspection,
        `connect_${inspection.bundleId}`,
        "1",
        inspection.version,
        [],
        true,
        "CONNECT_SCAN"
      );
      res.json({
        inspection,
        auditRun
      });
    } catch (err) {
      console.error("Check app error:", err.message);
      res.status(500).json({ error: err.message || "Failed to check app details from App Store Connect." });
    }
  });
  app2.delete("/api/connect/remove-key", userAuthMiddleware, connectRateLimiter, async (req, res) => {
    const user = req.user;
    const token = req.token;
    try {
      const { baseUrl, anonKey } = getInsforgeConfig();
      const userClient = (0, import_sdk.createClient)({
        baseUrl,
        anonKey,
        isServerMode: true
      });
      userClient.setAuthToken(token);
      const { error } = await userClient.database.from("app_store_connect_keys").delete().eq("user_id", user.id);
      if (error) {
        console.error("[REDACTED] Delete key failed:", error.message);
        return res.status(500).json({ error: "Failed to delete App Store Connect key." });
      }
      res.json({ success: true });
    } catch (err) {
      console.error("[REDACTED] Delete key error:", err.message);
      res.status(500).json({ error: "An unexpected error occurred." });
    }
  });
  const adminAuthMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(403).json({ error: "Forbidden: Missing or invalid authentication token." });
    }
    const token = authHeader.substring(7);
    const baseUrl = process.env.VITE_INSFORGE_BASE_URL;
    const anonKey = process.env.VITE_INSFORGE_ANON_KEY;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5e3);
    try {
      const response = await fetch(`${baseUrl}/api/auth/sessions/current`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "x-api-key": anonKey,
          "Content-Type": "application/json"
        },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (!response.ok) {
        return res.status(403).json({ error: "Forbidden: Invalid user token." });
      }
      const data = await response.json();
      const user = data?.user;
      if (!user || !user.email) {
        return res.status(403).json({ error: "Forbidden: Invalid user token." });
      }
      if (!ADMIN_EMAILS.includes(user.email.toLowerCase())) {
        return res.status(403).json({ error: "Forbidden: Access restricted to administrators only." });
      }
      next();
    } catch (err) {
      clearTimeout(timeoutId);
      console.error("REACHED CATCH BLOCK", err);
      return res.status(403).json({ error: "Forbidden: Verification failed." });
    }
  };
  app2.get("/api/admin/stats", adminAuthMiddleware, (req, res) => {
    res.status(501).json({ error: "Admin statistics require a configured production analytics data source." });
  });
  app2.get("/api/admin/rules", adminAuthMiddleware, (req, res) => {
    res.json({
      rules: APP_STORE_RULES,
      sources: APPLE_GUIDELINE_SOURCES
    });
  });
  app2.use((err, req, res, next) => {
    res.status(400).json({ error: "Invalid request" });
  });
  return app2;
}
var import_express2, import_dotenv, import_sdk, rateLimitCache, getInsforgeConfig, getConnectSecret, userAuthMiddleware;
var init_server = __esm({
  "server.ts"() {
    import_express2 = __toESM(require("express"), 1);
    import_dotenv = __toESM(require("dotenv"), 1);
    init_geminiService();
    init_rules();
    init_appleSources();
    init_itunesExtractor();
    init_evaluator();
    init_extractor();
    init_admin();
    import_sdk = require("@insforge/sdk");
    init_appStoreConnect();
    init_appStoreConnectExtractor();
    import_dotenv.default.config();
    import_dotenv.default.config({ path: ".env.local" });
    process.on("unhandledRejection", (reason, promise) => {
      console.error("UNHANDLED", reason);
    });
    process.on("uncaughtException", (err) => {
      console.error("UNCAUGHT", err);
    });
    rateLimitCache = /* @__PURE__ */ new Map();
    getInsforgeConfig = () => {
      const baseUrl = process.env.VITE_INSFORGE_BASE_URL;
      const anonKey = process.env.VITE_INSFORGE_ANON_KEY;
      if (!baseUrl || !anonKey) {
        throw new Error("Missing VITE_INSFORGE_BASE_URL or VITE_INSFORGE_ANON_KEY configuration.");
      }
      return { baseUrl, anonKey };
    };
    getConnectSecret = () => {
      const secret = process.env.CONNECT_KEY_ENCRYPTION_SECRET;
      if (!secret || !secret.trim()) {
        if (process.env.NODE_ENV === "production" || process.env.VERCEL === "1") {
          throw new Error("CONNECT_KEY_ENCRYPTION_SECRET is required in production.");
        }
        throw new Error("CONNECT_KEY_ENCRYPTION_SECRET is not configured.");
      }
      return secret;
    };
    userAuthMiddleware = async (req, res, next) => {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized: Missing or invalid authentication token." });
      }
      const token = authHeader.substring(7);
      let baseUrl;
      let anonKey;
      try {
        ({ baseUrl, anonKey } = getInsforgeConfig());
      } catch (err) {
        return res.status(500).json({ error: err.message || "Server auth configuration is missing." });
      }
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5e3);
      try {
        const response = await fetch(`${baseUrl}/api/auth/sessions/current`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "x-api-key": anonKey,
            "Content-Type": "application/json"
          },
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (!response.ok) {
          return res.status(401).json({ error: "Unauthorized: Invalid session token." });
        }
        const data = await response.json();
        const user = data?.user;
        if (!user || !user.id) {
          return res.status(401).json({ error: "Unauthorized: Invalid user." });
        }
        req.user = user;
        req.token = token;
        next();
      } catch (err) {
        clearTimeout(timeoutId);
        console.error("[REDACTED] User verification failed:", err.message);
        return res.status(401).json({ error: "Unauthorized: Session verification failed." });
      }
    };
    if (process.argv.some((arg) => /(?:^|[\\/])server\.ts$/.test(arg))) {
      Promise.resolve().then(() => (init_devServer(), devServer_exports)).then(({ startServer: startServer2 }) => startServer2()).catch((err) => {
        console.error("Failed to start server:", err);
      });
    }
  }
});

// src/server/vercel-entry.ts
var vercel_entry_exports = {};
__export(vercel_entry_exports, {
  default: () => handler
});
module.exports = __toCommonJS(vercel_entry_exports);
init_server();
var app = createServerApp();
function handler(req, res) {
  return app(req, res);
}
