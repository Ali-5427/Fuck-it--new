import { GoogleGenAI } from '@google/genai';
import { 
  NormalizedAppInspection, 
  Finding, 
  RejectionAnalysisResult, 
  RejectionAction,
  AppMetadataDraft,
  MetadataIssue
} from '../types';

let genAIClient: GoogleGenAI | null = null;
const GEMINI_TIMEOUT_MS = 18000;

async function callWithTimeout<T>(
  promiseFactory: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number = GEMINI_TIMEOUT_MS,
  operationName: string = 'Gemini API call'
): Promise<T> {
  const controller = new AbortController();
  let timeoutId: NodeJS.Timeout | null = null;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      controller.abort();
      reject(new Error(`${operationName} timed out after ${Math.round(timeoutMs / 1000)}s`));
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

function getGenAI(): GoogleGenAI | null {
  if (!genAIClient && process.env.GEMINI_API_KEY) {
    genAIClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return genAIClient;
}

/**
 * AI-assisted audit enhancement: correlates evidence and enhances remediation notes
 */
export async function enhanceAuditWithAI(
  inspection: NormalizedAppInspection,
  findings: Finding[]
): Promise<{ enhancedFindings: Finding[]; reviewerNotes: string; executiveSummary: string; aiEnhanced: boolean }> {
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
Permissions: ${JSON.stringify(inspection.permissions.filter(p => p.detected))}
Frameworks: ${JSON.stringify(inspection.frameworks)}
Privacy Manifest: ${JSON.stringify(inspection.privacyManifest)}
Features: ${JSON.stringify(inspection.features)}
Deterministic Findings: ${JSON.stringify(findings.map(f => ({ id: f.id, rule: f.ruleId, title: f.title, severity: f.severity, evidence: f.evidence })))}

CRITICAL CONSTRAINTS:
1. Do NOT invent fake Apple guidelines. Cite only official Apple App Store Review Guidelines.
2. Never say "Apple will approve your app." Provide risk assessment based on public guidelines.
3. Where evidence is ambiguous, specify "Insufficient evidence — manual verification required."
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
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      }),
      18000,
      'Audit AI enhancement'
    );

    const parsed = JSON.parse(response.text || '{}');

    const enhancementMap = new Map<string, any>();
    if (Array.isArray(parsed.findingsEnhancements)) {
      parsed.findingsEnhancements.forEach((enh: any) => enhancementMap.set(enh.findingId, enh));
    }

    const enhanced = findings.map(f => {
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
    console.error('Error enhancing audit with AI:', error);
    return {
      enhancedFindings: findings,
      reviewerNotes: generateFallbackReviewerNotes(inspection),
      executiveSummary: generateFallbackSummary(inspection, findings),
      aiEnhanced: false
    };
  }
}

/**
 * AI Analyzer for Apple Rejection Messages
 */
export async function analyzeAppleRejectionWithAI(
  rejectionText: string
): Promise<RejectionAnalysisResult> {
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
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      }),
      18000,
      'Rejection analysis'
    );

    const parsed = JSON.parse(response.text || '{}');

    return {
      id: `rej_${Date.now()}`,
      rejectionText,
      guidelinesIdentified: parsed.guidelinesIdentified || [
        {
          guidelineNumber: 'Guideline 2.1',
          title: 'Performance - App Completeness',
          url: 'https://developer.apple.com/app-store/review/guidelines/#app-completeness'
        }
      ],
      plainEnglishExplanation: parsed.plainEnglishExplanation || 'Apple flagged an issue with app functionality or review access.',
      recommendedAction: (parsed.recommendedAction as RejectionAction) || 'FIX',
      actionJustification: parsed.actionJustification || 'Changes in code or App Store Connect metadata are necessary.',
      remediationSteps: parsed.remediationSteps || [
        'Review the flagged view in Xcode',
        'Update configuration or provide active test credentials',
        'Re-submit build with clarification in Resolution Center'
      ],
      developerResponseDraft: parsed.developerResponseDraft || 'Dear App Review Team,\n\nThank you for your feedback...',
      appleReviewNotesAdvice: parsed.appleReviewNotesAdvice || 'Include demo login details and a direct video walkthrough link if testing requires physical hardware.',
      confidenceScore: parsed.confidenceScore || 0.92
    };
  } catch (err) {
    console.error('Error analyzing rejection with AI:', err);
    return fallbackRejectionAnalysis(rejectionText);
  }
}

/**
 * Checks App Store Metadata copy for guideline risks
 */
export async function analyzeMetadataWithAI(
  metadata: AppMetadataDraft
): Promise<{ issues: MetadataIssue[]; suggestions: string[] }> {
  const issues: MetadataIssue[] = [];
  const suggestions: string[] = [];

  // Deterministic checks
  if (metadata.name.length > 30) {
    issues.push({
      field: 'name',
      severity: 'HIGH',
      type: 'LENGTH_EXCEEDED',
      message: `App Name is ${metadata.name.length} characters. App Store maximum is 30.`,
      recommendation: 'Shorten your app title to 30 characters or less.'
    });
  }

  if (metadata.subtitle.length > 30) {
    issues.push({
      field: 'subtitle',
      severity: 'HIGH',
      type: 'LENGTH_EXCEEDED',
      message: `Subtitle is ${metadata.subtitle.length} characters. App Store maximum is 30.`,
      recommendation: 'Shorten subtitle to 30 characters or less.'
    });
  }

  if (metadata.keywords.length > 100) {
    issues.push({
      field: 'keywords',
      severity: 'HIGH',
      type: 'LENGTH_EXCEEDED',
      message: `Keywords length is ${metadata.keywords.length} characters. Maximum is 100.`,
      recommendation: 'Remove spaces after commas and trim redundant terms.'
    });
  }

  // Competitor mentions
  const allText = `${metadata.name} ${metadata.subtitle} ${metadata.description} ${metadata.keywords}`.toLowerCase();
  if (/\b(android|google play|apk|play store)\b/i.test(allText)) {
    issues.push({
      field: 'description',
      severity: 'HIGH',
      type: 'COMPETITOR_MENTION',
      message: 'References to competitor mobile platforms (Android / Google Play) violate Guideline 2.3.',
      recommendation: 'Remove any mention of Android or other non-Apple app stores.'
    });
  }

  // Pricing claims in subtitle or title
  if (/\b(free|#1|best app|top rated|\$0\.99)\b/i.test(`${metadata.name} ${metadata.subtitle}`)) {
    issues.push({
      field: 'subtitle',
      severity: 'MEDIUM',
      type: 'UNSUPPORTED_CLAIM',
      message: 'Pricing terms ("Free") or unsubstantiated superlatives ("#1") in the title/subtitle violate Guideline 2.3.8.',
      recommendation: 'Describe features rather than pricing or rank claims.'
    });
  }

  const ai = getGenAI();
  if (ai) {
    try {
      const response = await callWithTimeout(
        () => ai.models.generateContent({
          model: 'gemini-2.5-flash',
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
          config: { responseMimeType: 'application/json' }
        }),
        18000,
        'Metadata analysis'
      );

      const parsed = JSON.parse(response.text || '{}');
      if (Array.isArray(parsed.additionalIssues)) {
        issues.push(...parsed.additionalIssues);
      }
      if (Array.isArray(parsed.suggestions)) {
        suggestions.push(...parsed.suggestions);
      }
    } catch (e) {
      // ignore
    }
  }

  if (suggestions.length === 0) {
    suggestions.push(
      'Use single comma-separated keywords without spaces to save keyword character budget.',
      'Ensure the first 3 lines of your description highlight unique value before the "More" cutoff.',
      'Verify your Privacy Policy and Support URLs are active HTTPS links.'
    );
  }

  return { issues, suggestions };
}

function generateFallbackReviewerNotes(inspection: NormalizedAppInspection): string {
  const iapStatus = inspection.features.hasInAppPurchases === true
    ? 'In-app purchase capability was detected; verify StoreKit sandbox flows and pricing/restore flows before submission.'
    : inspection.features.hasInAppPurchases === false
      ? 'No in-app purchase capability was detected from the supplied metadata.'
      : 'In-app purchase detection is inconclusive; confirm StoreKit configuration manually before submitting.';

  const signInStatus = inspection.features.hasSignInWithApple === true
    ? 'Sign in with Apple was detected in the app metadata; verify the flow and account-signout behavior before submission.'
    : inspection.features.hasSignInWithApple === false
      ? 'No Sign in with Apple capability was detected from the supplied metadata.'
      : 'Sign in with Apple detection is inconclusive; confirm the auth flow manually before submission.';

  const privacyPolicy = inspection.metadata.privacyPolicyUrl || 'Privacy Policy URL not supplied in the metadata.';
  const supportUrl = inspection.metadata.supportUrl || 'Support URL not supplied in the metadata.';

  return `App: ${inspection.appName} (v${inspection.version}, Build ${inspection.build})
Target OS: iOS ${inspection.minOSVersion}+

Notes for App Review Team:
- ${iapStatus}
- ${signInStatus}
- Privacy Policy: ${privacyPolicy}
- Support URL: ${supportUrl}
- Review the extracted permissions, privacy manifest declarations, and any detected compliance gaps before final submission.`;
}

function generateFallbackSummary(inspection: NormalizedAppInspection, findings: Finding[]): string {
  const high = findings.filter(f => f.severity === 'HIGH' && f.status === 'OPEN').length;
  if (high > 0) {
    return `Static inspection flagged ${high} high-risk guideline requirement(s) that should be addressed prior to submitting to App Store Review.`;
  }
  return `Your app currently has no detected high-risk issues based on the checks performed. Review the manual checklist before submitting.`;
}

function fallbackRejectionAnalysis(rejectionText: string): RejectionAnalysisResult {
  const isIAP = /in-app purchase|guideline 3\.1|storekit|restore purchases|payment/i.test(rejectionText);
  const isPrivacy = /guideline 5\.1|privacy|permission|purpose string|data collection/i.test(rejectionText);
  const isLogin = /guideline 4\.8|sign in with apple|login|account deletion/i.test(rejectionText);
  const isCompleteness = /guideline 2\.1|demo account|broken|crash|placeholder/i.test(rejectionText);

  let guideline = {
    guidelineNumber: 'Guideline 2.1',
    title: 'Performance - App Completeness',
    url: 'https://developer.apple.com/app-store/review/guidelines/#app-completeness'
  };
  let explanation = 'Apple App Review encountered an issue during testing or found missing information.';
  let action: RejectionAction = 'FIX';
  let steps = ['Update code to resolve the flagged behavior', 'Provide clear notes in Resolution Center', 'Upload a new build'];

  if (isIAP) {
    guideline = {
      guidelineNumber: 'Guideline 3.1.1 / 3.1.2',
      title: 'Business - In-App Purchase & Subscriptions',
      url: 'https://developer.apple.com/app-store/review/guidelines/#in-app-purchase'
    };
    explanation = 'Apple flagged in-app purchase terms, missing restore purchases button, or external payment links.';
    steps = [
      'Ensure Restore Purchases button is visible on paywalls',
      'Add clear subscription pricing and auto-renew terms',
      'Remove any external web checkout links'
    ];
  } else if (isPrivacy) {
    guideline = {
      guidelineNumber: 'Guideline 5.1.1 / 5.1.2',
      title: 'Legal - Privacy & Data Collection',
      url: 'https://developer.apple.com/app-store/review/guidelines/#data-collection-and-storage'
    };
    explanation = 'Apple requires explicit purpose strings in Info.plist or Privacy Manifest (PrivacyInfo.xcprivacy) declarations.';
    steps = [
      'Add or update Info.plist usage descriptions with specific feature details',
      'Include PrivacyInfo.xcprivacy with Required Reason APIs',
      'Ensure Privacy Policy URL in metadata is reachable'
    ];
  } else if (isLogin) {
    guideline = {
      guidelineNumber: 'Guideline 4.8 / 5.1.1(v)',
      title: 'Design - Sign in with Apple & Account Deletion',
      url: 'https://developer.apple.com/app-store/review/guidelines/#sign-in-with-apple'
    };
    explanation = 'Apple flagged missing Sign in with Apple or missing in-app account deletion.';
    steps = [
      'Implement Sign in with Apple button',
      'Add in-app account deletion button with confirmation',
      'Test auth flows in sandbox'
    ];
  }

  return {
    id: `rej_${Date.now()}`,
    rejectionText,
    guidelinesIdentified: [guideline],
    plainEnglishExplanation: explanation,
    recommendedAction: action,
    actionJustification: 'App Review found a non-compliant behavior that requires code or configuration changes.',
    remediationSteps: steps,
    developerResponseDraft: `Dear Apple App Review Team,

Thank you for your feedback regarding our submission. We have resolved the issue by making the requested updates:

1. Addressed the specific item noted in ${guideline.guidelineNumber}.
2. Verified all test flows in TestFlight with active demo credentials.

Please let us know if any further clarification or testing assistance is needed.

Sincerely,
The Development Team`,
    appleReviewNotesAdvice: 'Include demo credentials and step-by-step reproduction instructions.',
    confidenceScore: 0.88
  };
}
