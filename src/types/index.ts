export type AuditSeverity = 'HIGH' | 'MEDIUM' | 'LOW' | 'MANUAL_CHECK';

export type ReadinessStatus =
  | 'NOT_READY'
  | 'READY_WITH_WARNINGS'
  | 'NO_HIGH_RISK_ISSUES_DETECTED';

export type FindingStatus = 
  | 'OPEN' 
  | 'IN_PROGRESS' 
  | 'FIXED' 
  | 'WONT_FIX' 
  | 'MANUAL_REVIEW';

export type DetectionStatus = 
  | 'DETECTED' 
  | 'NOT_DETECTED' 
  | 'UNKNOWN' 
  | 'NOT_APPLICABLE';

export type DetectionMethod = 
  | 'STATIC_ANALYSIS' 
  | 'HEURISTIC' 
  | 'HYBRID' 
  | 'MANUAL_CHECK';

export type RuleCategory = 
  | 'PRIVACY'
  | 'PERMISSIONS'
  | 'ACCOUNT_REQUIREMENTS'
  | 'PAYMENTS_IAP'
  | 'SUBSCRIPTIONS'
  | 'UGC'
  | 'METADATA'
  | 'SCREENSHOTS'
  | 'APP_COMPLETENESS'
  | 'BACKGROUND_MODES'
  | 'SECURITY_ENCRYPTION'
  | 'LEGAL_IP'
  | 'OTHER';

export type RejectionAction = 'FIX' | 'APPEAL' | 'CLARIFY' | 'MANUAL_REVIEW';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'developer' | 'admin';
  tier?: 'free' | 'pro' | 'studio';
  trialEndsAt?: string;
  teamName?: string;
  appleTeamId?: string;
  avatarUrl?: string;
  token?: string;
  createdAt: string;
  settings?: {
    notificationsEnabled?: boolean;
    autoRecheckOnUpload?: boolean;
    defaultExportFormat?: 'markdown' | 'pdf';
    apiKey?: string;
  };
}

export interface AppleGuidelineSource {
  id: string;
  guidelineNumber: string;
  title: string;
  category: RuleCategory;
  url: string;
  lastVerifiedDate: string;
  version: string;
  summary: string;
}

export type RuleDefinition = AuditRule;

export interface AuditRule {
  id: string;
  category: RuleCategory;
  guidelineRef: string | {
    number: string;
    title: string;
    url: string;
  };
  title: string;
  severity: AuditSeverity;
  description: string;
  detectionMethod: DetectionMethod;
  evidenceRequired: string[];
  remediationGuidance: string;
  codeSnippet?: string;
  confidence: number;
  sourceUrl: string;
  lastReviewedDate: string;
  version: string;
  enabled: boolean;
  requiresManualCheck?: boolean;
}

export interface FindingEvidence {
  key: string;
  extractedValue?: string | number | boolean | string[] | Record<string, any>;
  location?: string; // e.g., 'Info.plist', 'PrivacyInfo.xcprivacy', 'Binary Frameworks', 'Metadata'
  detectionStatus: DetectionStatus;
  notes?: string;
}

export interface FixNote {
  id: string;
  author: string;
  createdAt: string;
  text: string;
  statusChange?: FindingStatus;
  buildNumber?: string;
}

export interface Finding {
  id: string;
  auditId: string;
  ruleId: string;
  category: RuleCategory;
  guidelineRef: {
    number: string;
    title: string;
    url: string;
  };
  title: string;
  severity: AuditSeverity;
  whyItMatters: string;
  evidence: FindingEvidence[];
  whatToVerify: string;
  recommendedAction: string;
  codeSnippet?: string;
  confidence: number;
  status: FindingStatus;
  notes: FixNote[];
  createdAt: string;
  updatedAt: string;
  fixedInBuild?: string;
  isAiCorrelated?: boolean;
}

export interface NormalizedAppInspection {
  bundleId: string;
  appName: string;
  version: string;
  build: string;
  minOSVersion: string;
  targetDevices: string[];
  permissions: {
    key: string;
    description: string;
    detected: boolean;
    status: DetectionStatus;
  }[];
  entitlements: string[];
  urlSchemes: string[];
  associatedDomains: string[];
  frameworks: string[];
  extensions: string[];
  backgroundModes: string[];
  privacyManifest: {
    hasPrivacyManifest: boolean | 'UNKNOWN';
    trackingEnabled: boolean | 'UNKNOWN';
    collectedDataTypes: string[];
    accessedApiTypes: string[];
  };
  security: {
    atsAllowsArbitraryLoads: boolean | 'UNKNOWN';
    usesNonExemptEncryptionDeclared: boolean | 'UNKNOWN';
    usesNonExemptEncryptionValue?: boolean;
  };
  features: {
    hasInAppPurchases: boolean | 'UNKNOWN';
    hasSubscriptions: boolean | 'UNKNOWN';
    hasThirdPartyAuth: boolean | 'UNKNOWN';
    hasSignInWithApple: boolean | 'UNKNOWN';
    hasAccountDeletion: boolean | 'UNKNOWN';
    hasUserGeneratedContent: boolean | 'UNKNOWN';
    hasAdvertising: boolean | 'UNKNOWN';
    hasExternalPayments?: boolean | 'UNKNOWN';
  };
  metadata: {
    name?: string;
    subtitle?: string;
    description?: string;
    keywords?: string;
    supportUrl?: string;
    privacyPolicyUrl?: string;
    category?: string;
    ageRating?: string;
    reviewerNotes?: string;
    listingProvided?: boolean;
  };
  screenshots: {
    id: string;
    name: string;
    width: number;
    height: number;
    format: string;
    deviceTarget: string;
    aspectRatio: string;
    isValidSize?: boolean;
    issues?: string[];
    precision?: 'EXACT' | 'UNKNOWN';
  }[];
  rawInfo?: Record<string, any>;
}

export type AuditScanType = 'BINARY_SCAN' | 'LISTING_SCAN' | 'CONNECT_SCAN';

export interface ApplicationUpload {
  id: string;
  appId: string;
  fileName: string;
  fileSize: number;
  fileType: 'ipa' | 'zip' | 'plist' | 'manual' | 'itunes';
  uploadedAt: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  progressStep?: string;
  extractedInspection?: NormalizedAppInspection;
  sha256?: string;
  errorMessage?: string;
}

export interface AuditRun {
  id: string;
  appId: string;
  uploadId?: string;
  auditType?: AuditScanType;
  buildNumber: string;
  appVersion: string;
  createdAt: string;
  readinessStatus: ReadinessStatus;
  ruleVersion: string;
  summary: string;
  totalFindings: number;
  openFindings: number;
  resolvedFindings: number;
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
  manualCheckCount: number;
  infoCount?: number;
  findings: Finding[];
  passedChecks: { ruleId: string; title: string }[];
  reviewerNotesDraft?: string;
  isAiEnhanced?: boolean;
}

export interface Application {
  id: string;
  userId: string;
  name: string;
  bundleId: string;
  primaryCategory: string;
  currentVersion: string;
  currentBuild: string;
  appleAppId?: string;
  createdAt: string;
  updatedAt: string;
  lastAuditDate?: string;
  lastAuditStatus?: ReadinessStatus;
  remainingIssuesCount: number;
  isDemo?: boolean;
}

export interface AuditComparison {
  previousAuditId: string;
  currentAuditId: string;
  previousBuild: string;
  currentBuild: string;
  resolvedCount: number;
  remainingCount: number;
  newCount: number;
  resolvedFindings: Finding[];
  remainingFindings: Finding[];
  newFindings: Finding[];
}

export interface SubmissionReport {
  id: string;
  appId: string;
  auditId: string;
  generatedAt: string;
  appName: string;
  bundleId: string;
  version: string;
  build: string;
  readinessStatus: ReadinessStatus;
  summary: string;
  guidelineVersion: string;
  categorySummaries: {
    category: RuleCategory;
    status: 'PASS' | 'WARNING' | 'FAIL' | 'MANUAL';
    openCount: number;
    resolvedCount: number;
  }[];
  resolvedIssues: {
    title: string;
    guidelineRef: {
      number: string;
      title: string;
      url: string;
    };
    fixedInBuild?: string;
  }[];
  remainingWarnings: {
    title: string;
    severity: AuditSeverity;
    guidelineRef: {
      number: string;
      title: string;
      url: string;
    };
    recommendedAction: string;
  }[];
  manualChecklist: {
    id: string;
    item: string;
    category: string;
    checked: boolean;
    notes?: string;
  }[];
  reviewerNotesDraft: string;
  disclaimer: string;
}

export interface AppMetadataDraft {
  name: string;
  subtitle: string;
  description: string;
  keywords: string;
  promotionalText: string;
  supportUrl: string;
  privacyPolicyUrl: string;
  category: string;
  ageRating: string;
}

export interface MetadataIssue {
  field: keyof AppMetadataDraft;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  type: 'LENGTH_EXCEEDED' | 'BANNED_KEYWORD' | 'COMPETITOR_MENTION' | 'UNSUPPORTED_CLAIM' | 'FORMAT_ERROR' | 'MISSING_URL';
  message: string;
  recommendation: string;
}

export interface ScreenshotValidationResult {
  fileName: string;
  width: number;
  height: number;
  matchedDevice?: string;
  isValidDimension: boolean;
  issues: string[];
  warnings: string[];
}

export interface RejectionAnalysisResult {
  id: string;
  rejectionText: string;
  guidelinesIdentified: {
    guidelineNumber: string;
    title: string;
    url: string;
  }[];
  plainEnglishExplanation: string;
  recommendedAction: RejectionAction;
  actionJustification: string;
  remediationSteps: string[];
  developerResponseDraft: string;
  appleReviewNotesAdvice: string;
  confidenceScore: number;
}

export interface AdminStats {
  totalUsers: number;
  totalApps: number;
  totalAudits: number;
  failedJobs: number;
  mostCommonFindings: { ruleId: string; title: string; count: number; category: RuleCategory }[];
  activeRuleCount: number;
  rulesLastReviewed: string;
  aiUsageCount: number;
}
