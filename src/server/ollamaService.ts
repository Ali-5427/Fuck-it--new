import {
  NormalizedAppInspection,
  Finding,
  RejectionAnalysisResult,
  RejectionAction,
  AppMetadataDraft,
  MetadataIssue
} from '../types';

const OLLAMA_API_URL = 'https://ollama.com/api/generate';
const OLLAMA_TIMEOUT_MS = 25000;

async function callOllamaWithTimeout(prompt: string, operationName: string = 'Ollama API call'): Promise<string> {
  const apiKey = process.env.OLLAMA_API_KEY;
  if (!apiKey) throw new Error('OLLAMA_API_KEY is missing');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), OLLAMA_TIMEOUT_MS);

  try {
    const response = await fetch(OLLAMA_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-oss:120b',
        prompt,
        stream: false,
        format: 'json'
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Ollama API Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.response || '{}';
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

export async function enhanceAuditWithAI(
  inspection: NormalizedAppInspection,
  findings: Finding[]
): Promise<{ enhancedFindings: Finding[]; reviewerNotes: string; executiveSummary: string; aiEnhanced: boolean }> {
  if (!process.env.OLLAMA_API_KEY || findings.length === 0) {
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
2. Never say 'Apple will approve your app.' Provide risk assessment based on public guidelines.
3. Where evidence is ambiguous, specify 'Insufficient evidence - manual verification required.'
4. Generate a professional, highly specific 'Reviewer Notes' draft tailored to App Store Connect.

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

    const responseText = await callOllamaWithTimeout(prompt, 'Audit AI enhancement');
    const parsed = JSON.parse(responseText);

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

export async function analyzeAppleRejectionWithAI(rejectionText: string): Promise<RejectionAnalysisResult> {
  if (!process.env.OLLAMA_API_KEY) {
    return fallbackRejectionAnalysis(rejectionText);
  }

  try {
    const prompt = `You are an expert App Store Review compliance consultant. Analyze this Apple rejection message:
"""${rejectionText}"""

Provide a structured JSON response exactly matching this interface:
{
  "guidelinesIdentified": [
    { "guidelineNumber": "string (e.g., 'Guideline 2.1')", "title": "string", "url": "string" }
  ],
  "plainEnglishExplanation": "string",
  "recommendedAction": "FIX" | "APPEAL" | "CLARIFY",
  "actionJustification": "string",
  "remediationSteps": ["string"],
  "developerResponseDraft": "string (Professional tone, ready to paste to Resolution Center)",
  "appleReviewNotesAdvice": "string (What to include in the notes for the next review)",
  "confidenceScore": number (0.0 to 1.0)
}`;

    const responseText = await callOllamaWithTimeout(prompt, 'Rejection Analysis');
    const parsed = JSON.parse(responseText);

    return {
      id: `rej_${Date.now()}`,
      rejectionText,
      guidelinesIdentified: parsed.guidelinesIdentified || [],
      plainEnglishExplanation: parsed.plainEnglishExplanation || '',
      recommendedAction: parsed.recommendedAction || 'FIX',
      actionJustification: parsed.actionJustification || '',
      remediationSteps: parsed.remediationSteps || [],
      developerResponseDraft: parsed.developerResponseDraft || '',
      appleReviewNotesAdvice: parsed.appleReviewNotesAdvice || '',
      confidenceScore: parsed.confidenceScore || 0.8
    };
  } catch (error) {
    console.error('Error analyzing rejection with AI:', error);
    return fallbackRejectionAnalysis(rejectionText);
  }
}

export async function analyzeMetadataWithAI(metadata: AppMetadataDraft): Promise<{ issues: MetadataIssue[]; suggestions: string[] }> {
  const issues: MetadataIssue[] = [];
  const suggestions: string[] = [];

  if (!process.env.OLLAMA_API_KEY) {
    return { issues, suggestions };
  }

  try {
    const prompt = `Review this App Store Connect metadata for subtle Apple Guideline 2.3 risks (keyword stuffing, misleading claims, trademark infringement, unclear descriptions):
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
}`;

    const responseText = await callOllamaWithTimeout(prompt, 'Metadata analysis');
    const parsed = JSON.parse(responseText);
    
    if (Array.isArray(parsed.additionalIssues)) {
      issues.push(...parsed.additionalIssues);
    }
    if (Array.isArray(parsed.suggestions)) {
      suggestions.push(...parsed.suggestions);
    }
  } catch (error) {
    console.error('Error analyzing metadata with AI:', error);
  }

  return { issues, suggestions };
}

function generateFallbackReviewerNotes(inspection: NormalizedAppInspection): string {
  return `App: ${inspection.appName} (v${inspection.version}, Build ${inspection.build})
Target OS: iOS ${inspection.minOSVersion}+
Notes for App Review Team: Review the extracted permissions, privacy manifest declarations, and any detected compliance gaps before final submission.`;
}

function generateFallbackSummary(inspection: NormalizedAppInspection, findings: Finding[]): string {
  const high = findings.filter(f => f.severity === 'HIGH' && f.status === 'OPEN').length;
  if (high > 0) {
    return `Static inspection flagged ${high} high-risk guideline requirement(s) that should be addressed prior to submitting to App Store Review.`;
  }
  return `Your app currently has no detected high-risk issues based on the checks performed. Review the manual checklist before submitting.`;
}

function fallbackRejectionAnalysis(rejectionText: string): RejectionAnalysisResult {
  return {
    id: `rej_${Date.now()}`,
    rejectionText,
    guidelinesIdentified: [],
    plainEnglishExplanation: 'Failed to analyze rejection message.',
    recommendedAction: 'FIX',
    actionJustification: 'Fallback analysis active.',
    remediationSteps: [],
    developerResponseDraft: '',
    appleReviewNotesAdvice: '',
    confidenceScore: 0.1
  };
}
