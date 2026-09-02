import { RuleDefinition } from '../types';

export const APP_STORE_RULES: RuleDefinition[] = [
  // 1. PRIVACY & MANIFESTS
  {
    id: 'RULE-PRIV-01',
    category: 'PRIVACY',
    guidelineRef: 'Guideline 5.1.2',
    title: 'Missing or Incomplete Privacy Manifest (PrivacyInfo.xcprivacy)',
    severity: 'HIGH',
    description: 'Apple mandates that apps and required third-party SDKs include a PrivacyInfo.xcprivacy declaring tracking domains, data categories, and Required Reason APIs.',
    detectionMethod: 'STATIC_ANALYSIS',
    evidenceRequired: ['PrivacyInfo.xcprivacy file existence', 'NSPrivacyAccessedAPITypes array', 'NSPrivacyTracking boolean'],
    remediationGuidance: 'Add a PrivacyInfo.xcprivacy resource to your Xcode target root. Declare all required reason API usage types (UserDefaults, File Timestamp, Disk Space, System Boot Time) and data collected.',
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
    sourceUrl: 'https://developer.apple.com/documentation/bundleresources/privacy_manifest_files',
    lastReviewedDate: '2026-06-15',
    version: '1.4.0',
    enabled: true
  },
  {
    id: 'RULE-PRIV-02',
    category: 'PRIVACY',
    guidelineRef: 'Guideline 5.1.1(i)',
    title: 'Missing Privacy Policy URL in App Metadata',
    severity: 'HIGH',
    description: 'All apps that collect any user data or offer user accounts must provide a publicly accessible Privacy Policy link in App Store Connect metadata and in-app.',
    detectionMethod: 'STATIC_ANALYSIS',
    evidenceRequired: ['privacyPolicyUrl in metadata', 'Valid HTTPS URL protocol'],
    remediationGuidance: 'Provide a valid, publicly reachable HTTPS URL linking directly to your privacy policy in App Store Connect and within your app settings screen.',
    codeSnippet: `// In App Settings View (SwiftUI)
Link("Privacy Policy", destination: URL(string: "https://yourdomain.com/privacy")!)
    .font(.footnote)
    .foregroundStyle(.secondary)`,
    confidence: 0.98,
    sourceUrl: 'https://developer.apple.com/app-store/review/guidelines/#data-collection-and-storage',
    lastReviewedDate: '2026-06-15',
    version: '1.2.0',
    enabled: true
  },
  {
    id: 'RULE-PRIV-03',
    category: 'PRIVACY',
    guidelineRef: 'Guideline 5.1.2',
    title: 'Ad Tracking / ATT Declared Without NSUserTrackingUsageDescription',
    severity: 'HIGH',
    description: 'App references AppTrackingTransparency / ad tracking SDKs (e.g., AppsFlyer, AdMob, Meta) but is missing NSUserTrackingUsageDescription in Info.plist.',
    detectionMethod: 'HYBRID',
    evidenceRequired: ['Ad SDK or Tracking framework detected', 'NSUserTrackingUsageDescription key in Info.plist'],
    remediationGuidance: 'If you collect IDFA or track users across third-party apps/websites, provide a specific NSUserTrackingUsageDescription string in Info.plist explaining how user data is used.',
    codeSnippet: `<key>NSUserTrackingUsageDescription</key>
<string>This identifier will be used to deliver personalized workout recommendations and measure ad performance.</string>`,
    confidence: 0.92,
    sourceUrl: 'https://developer.apple.com/app-store/user-privacy-and-data-use/',
    lastReviewedDate: '2026-06-15',
    version: '1.1.0',
    enabled: true
  },

  // 2. PERMISSIONS
  {
    id: 'RULE-PERM-01',
    category: 'PERMISSIONS',
    guidelineRef: 'Guideline 5.1.1(ii)',
    title: 'Vague or Missing Permission Purpose Strings in Info.plist',
    severity: 'HIGH',
    description: 'Apple requires clear, specific purpose strings explaining why the app needs access to protected resources (Camera, Microphone, Photo Library, Location, HealthKit). Vague strings like "Used for app functionality" are routinely rejected.',
    detectionMethod: 'STATIC_ANALYSIS',
    evidenceRequired: ['Usage description keys in Info.plist', 'String length > 12 characters', 'Specific contextual reason'],
    remediationGuidance: 'Update your Info.plist strings (e.g. NSCameraUsageDescription, NSLocationWhenInUseUsageDescription) with user-friendly explanations specifying the exact feature using the capability.',
    codeSnippet: `<!-- BAD: <string>Camera access is needed.</string> -->
<!-- GOOD: -->
<key>NSCameraUsageDescription</key>
<string>Scan receipt barcodes and capture workout equipment QR codes directly into your diary.</string>`,
    confidence: 0.94,
    sourceUrl: 'https://developer.apple.com/documentation/bundleresources/information_property_list/protected_resources',
    lastReviewedDate: '2026-06-15',
    version: '1.3.0',
    enabled: true
  },
  {
    id: 'RULE-PERM-02',
    category: 'PERMISSIONS',
    guidelineRef: 'Guideline 5.1.1(ii)',
    title: 'Excessive "Always" Location Permission Request',
    severity: 'MEDIUM',
    description: 'Requesting NSLocationAlwaysAndWhenInUseUsageDescription without clear continuous background navigation, geofencing, or fitness tracking capabilities triggers rejection.',
    detectionMethod: 'STATIC_ANALYSIS',
    evidenceRequired: ['NSLocationAlwaysAndWhenInUseUsageDescription in Info.plist', 'UIBackgroundModes location capability'],
    remediationGuidance: 'Prefer NSLocationWhenInUseUsageDescription unless your app continuously tracks routes or provides active geofence triggers in the background.',
    codeSnippet: `<key>NSLocationWhenInUseUsageDescription</key>
<string>Show nearby running trails and calculate your local running distance while the app is active.</string>`,
    confidence: 0.90,
    sourceUrl: 'https://developer.apple.com/documentation/corelocation/requesting_authorization_for_location_services',
    lastReviewedDate: '2026-06-15',
    version: '1.1.0',
    enabled: true
  },

  // 3. ACCOUNT REQUIREMENTS
  {
    id: 'RULE-ACC-01',
    category: 'ACCOUNT_REQUIREMENTS',
    guidelineRef: 'Guideline 5.1.1(v)',
    title: 'Missing In-App Account Deletion Capability',
    severity: 'HIGH',
    description: 'If users can create an account in your app, Apple mandates an obvious, direct way to initiate account and data deletion inside the app itself, not just an email link or external web redirect without confirmation.',
    detectionMethod: 'HYBRID',
    evidenceRequired: ['Account creation detected or declared', 'Account deletion flow verification'],
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
    sourceUrl: 'https://developer.apple.com/support/offering-account-deletion-in-your-app/',
    lastReviewedDate: '2026-06-15',
    version: '1.5.0',
    enabled: true
  },
  {
    id: 'RULE-ACC-02',
    category: 'ACCOUNT_REQUIREMENTS',
    guidelineRef: 'Guideline 4.8',
    title: 'Missing Sign in with Apple When Social Login is Present',
    severity: 'HIGH',
    description: 'Apps supporting third-party social logins (Google, Facebook, Twitter/X, Discord, GitHub) must also offer Sign in with Apple as an equivalent first-class option.',
    detectionMethod: 'STATIC_ANALYSIS',
    evidenceRequired: ['GoogleSignIn, FBSDK, or OAuth libraries detected in frameworks', 'AuthenticationServices / ASAuthorizationController'],
    remediationGuidance: 'Include Sign in with Apple using Apple\'s standard AuthenticationServices button style alongside any other social login buttons.',
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
    sourceUrl: 'https://developer.apple.com/app-store/review/guidelines/#sign-in-with-apple',
    lastReviewedDate: '2026-06-15',
    version: '1.3.0',
    enabled: true
  },
  {
    id: 'RULE-ACC-03',
    category: 'ACCOUNT_REQUIREMENTS',
    guidelineRef: 'Guideline 5.1.1',
    title: 'Forced Account Creation Before Core Utility Exploration',
    severity: 'MEDIUM',
    description: 'Apple guidelines disallow forcing registration before letting users browse or experience core utility features that do not strictly require personal data or cloud synchronization.',
    detectionMethod: 'HEURISTIC',
    evidenceRequired: ['Login screen as initial window root', 'Non-social / standalone utility app categorization'],
    remediationGuidance: 'Provide a "Continue as Guest" or "Explore First" option, prompting registration only when cloud backup, sync, or multiplayer features are accessed.',
    confidence: 0.85,
    sourceUrl: 'https://developer.apple.com/app-store/review/guidelines/#data-collection-and-storage',
    lastReviewedDate: '2026-06-15',
    version: '1.2.0',
    enabled: true,
    requiresManualCheck: true
  },

  // 4. PAYMENTS & IN-APP PURCHASES
  {
    id: 'RULE-IAP-01',
    category: 'PAYMENTS_IAP',
    guidelineRef: 'Guideline 3.1.1',
    title: 'External Payment Checkout Links for Digital Content',
    severity: 'HIGH',
    description: 'Digital unlockables, digital subscriptions, or virtual credits must use Apple In-App Purchase (StoreKit). Linking to external web paywalls (e.g., Stripe web checkout) inside the app is strictly prohibited unless qualifying as a designated Reader App.',
    detectionMethod: 'HYBRID',
    evidenceRequired: ['Stripe/PayPal web URL patterns in binary', 'StoreKit configuration check'],
    remediationGuidance: 'Implement StoreKit 2 (`Product.purchase()`) for all in-app digital items or submit appropriate Reader App / Music Streaming entitlement documentation if applicable.',
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
    sourceUrl: 'https://developer.apple.com/app-store/review/guidelines/#in-app-purchase',
    lastReviewedDate: '2026-06-15',
    version: '1.4.0',
    enabled: true
  },

  // 5. SUBSCRIPTIONS
  {
    id: 'RULE-SUB-01',
    category: 'SUBSCRIPTIONS',
    guidelineRef: 'Guideline 3.1.2',
    title: 'Missing "Restore Purchases" Button on Paywall',
    severity: 'HIGH',
    description: 'Apple App Review rejects paywall screens that lack a clearly visible, functioning "Restore Purchases" button to allow users to recover previous transactions across devices.',
    detectionMethod: 'HYBRID',
    evidenceRequired: ['Subscription products detected', 'Paywall view elements'],
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
    sourceUrl: 'https://developer.apple.com/app-store/review/guidelines/#subscriptions',
    lastReviewedDate: '2026-06-15',
    version: '1.3.0',
    enabled: true
  },
  {
    id: 'RULE-SUB-02',
    category: 'SUBSCRIPTIONS',
    guidelineRef: 'Guideline 3.1.2',
    title: 'Missing Links to Terms of Use (EULA) and Privacy Policy on Paywall',
    severity: 'MEDIUM',
    description: 'Subscription purchase screens must clearly present functioning links to both your Terms of Use (EULA / Standard Apple EULA) and Privacy Policy.',
    detectionMethod: 'HEURISTIC',
    evidenceRequired: ['Paywall view layout', 'Terms / EULA URL references'],
    remediationGuidance: 'Add direct links to Terms of Use (EULA) and Privacy Policy on the paywall screen right beneath the subscription CTA button.',
    codeSnippet: `HStack(spacing: 12) {
    Link("Terms of Use", destination: URL(string: "https://yourdomain.com/terms")!)
    Text("•").foregroundStyle(.secondary)
    Link("Privacy Policy", destination: URL(string: "https://yourdomain.com/privacy")!)
}
.font(.caption2)`,
    confidence: 0.89,
    sourceUrl: 'https://developer.apple.com/app-store/review/guidelines/#subscriptions',
    lastReviewedDate: '2026-06-15',
    version: '1.2.0',
    enabled: true
  },

  // 6. USER GENERATED CONTENT (UGC)
  {
    id: 'RULE-UGC-01',
    category: 'UGC',
    guidelineRef: 'Guideline 1.2',
    title: 'Missing UGC Moderation, Reporting, or User Blocking Mechanism',
    severity: 'HIGH',
    description: 'Apps containing social feeds, chat, comments, or user-uploaded media must provide: 1) Terms agreement, 2) Method to report objectionable content, 3) Ability to block abusive users, and 4) Developer contact for concerns.',
    detectionMethod: 'HYBRID',
    evidenceRequired: ['Chat / Social / Feed frameworks detected', 'Report content / Block user UI endpoints'],
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
    sourceUrl: 'https://developer.apple.com/app-store/review/guidelines/#user-generated-content',
    lastReviewedDate: '2026-06-15',
    version: '1.3.0',
    enabled: true
  },

  // 7. APP COMPLETENESS & REVIEW ACCESS
  {
    id: 'RULE-COMP-01',
    category: 'APP_COMPLETENESS',
    guidelineRef: 'Guideline 2.1',
    title: 'Gated Functionality Lacks Demo Credentials for App Review',
    severity: 'HIGH',
    description: 'If your app requires a login, hardware pairing, or subscription to test, you must provide active, working demo credentials and clear testing notes in App Store Connect App Review Notes.',
    detectionMethod: 'MANUAL_CHECK',
    evidenceRequired: ['Authentication required', 'App Store Review Notes field'],
    remediationGuidance: 'Create a permanent, pre-configured test account (e.g. `apple-review@yourdomain.com` / `DemoPass123!`) with sample data and paste it into App Review Information in App Store Connect.',
    confidence: 0.99,
    sourceUrl: 'https://developer.apple.com/app-store/review/guidelines/#app-completeness',
    lastReviewedDate: '2026-06-15',
    version: '1.4.0',
    enabled: true,
    requiresManualCheck: true
  },
  {
    id: 'RULE-COMP-02',
    category: 'APP_COMPLETENESS',
    guidelineRef: 'Guideline 2.1',
    title: 'Placeholder or "Lorem Ipsum" Text Detected in Metadata or Views',
    severity: 'HIGH',
    description: 'Apps containing placeholder imagery, broken test URLs, or draft "Lorem Ipsum" text are rejected under Guideline 2.1 Performance.',
    detectionMethod: 'STATIC_ANALYSIS',
    evidenceRequired: ['Placeholder string patterns: "Lorem ipsum", "TODO", "Test title", "sample.com"'],
    remediationGuidance: 'Audit all localized strings, descriptions, and mock screens to replace placeholder text with production-ready copy.',
    confidence: 0.97,
    sourceUrl: 'https://developer.apple.com/app-store/review/guidelines/#app-completeness',
    lastReviewedDate: '2026-06-15',
    version: '1.1.0',
    enabled: true
  },

  // 8. METADATA & CLAIMS
  {
    id: 'RULE-META-01',
    category: 'METADATA',
    guidelineRef: 'Guideline 2.3.7',
    title: 'Metadata Exceeds App Store Connect Character Limits',
    severity: 'HIGH',
    description: 'App Name (max 30 chars), Subtitle (max 30 chars), Promotional Text (max 170 chars), and Keywords (max 100 chars comma-separated) must strictly adhere to character constraints.',
    detectionMethod: 'STATIC_ANALYSIS',
    evidenceRequired: ['Metadata field lengths'],
    remediationGuidance: 'Trim App Name and Subtitle to <= 30 characters each. Ensure keywords are separated by commas without extra spaces.',
    confidence: 1.0,
    sourceUrl: 'https://developer.apple.com/help/app-store-connect/reference/app-information/',
    lastReviewedDate: '2026-06-15',
    version: '1.0.0',
    enabled: true
  },
  {
    id: 'RULE-META-02',
    category: 'METADATA',
    guidelineRef: 'Guideline 2.3',
    title: 'Competitor Platform Mentions in Description or Keywords',
    severity: 'MEDIUM',
    description: 'Apple prohibits referencing other mobile platforms (e.g., "Also available on Android", "Google Play Store", "APK version") in App Store metadata.',
    detectionMethod: 'STATIC_ANALYSIS',
    evidenceRequired: ['Keywords or Description matching competitor terms: Android, Google Play, APK, Windows Phone'],
    remediationGuidance: 'Remove all references to non-Apple platforms, APKs, or competitor app stores from your app description and keywords.',
    confidence: 0.98,
    sourceUrl: 'https://developer.apple.com/app-store/review/guidelines/#accurate-metadata',
    lastReviewedDate: '2026-06-15',
    version: '1.1.0',
    enabled: true
  },
  {
    id: 'RULE-META-03',
    category: 'METADATA',
    guidelineRef: 'Guideline 2.3.8',
    title: 'Unsupported Superlative or Pricing Claims in App Name/Subtitle',
    severity: 'MEDIUM',
    description: 'Using terms like "Free", "#1 App", "Best in the world", or price figures in the App Name or Subtitle violates metadata guidelines.',
    detectionMethod: 'STATIC_ANALYSIS',
    evidenceRequired: ['Banned pricing and ranking keywords: "Free", "#1", "Best", "Top-rated", "$0.99" in name/subtitle'],
    remediationGuidance: 'Focus your subtitle on core functionality rather than pricing or unsubstantiated awards.',
    confidence: 0.95,
    sourceUrl: 'https://developer.apple.com/app-store/review/guidelines/#accurate-metadata',
    lastReviewedDate: '2026-06-15',
    version: '1.1.0',
    enabled: true
  },

  // 9. SCREENSHOTS
  {
    id: 'RULE-SHOT-01',
    category: 'SCREENSHOTS',
    guidelineRef: 'Guideline 2.3.3',
    title: 'Invalid Screenshot Dimensions for Required Device Sizes',
    severity: 'HIGH',
    description: 'App Store Connect requires exact pixel dimensions for primary device classes (e.g. 1320x2868 for 6.9" iPhone 16 Pro Max, 1290x2796 for 6.7" iPhone 15 Pro Max, 1242x2688 for 6.5", 1242x2208 for 5.5", 2064x2752 for 13" iPad Pro).',
    detectionMethod: 'STATIC_ANALYSIS',
    evidenceRequired: ['Screenshot width and height dimensions'],
    remediationGuidance: 'Export screenshots at exact supported App Store Connect dimensions without transparent pixels or invalid aspect ratios.',
    confidence: 1.0,
    sourceUrl: 'https://developer.apple.com/help/app-store-connect/reference/screenshot-specifications/',
    lastReviewedDate: '2026-06-15',
    version: '1.2.0',
    enabled: true
  },

  // 10. BACKGROUND CAPABILITIES
  {
    id: 'RULE-BG-01',
    category: 'BACKGROUND_MODES',
    guidelineRef: 'Guideline 2.5.4',
    title: 'Unjustified Background Modes Declared in Info.plist',
    severity: 'HIGH',
    description: 'Declaring UIBackgroundModes (e.g., `audio`, `location`, `voip`, `fetch`) without clear, user-facing active playback, continuous GPS routing, or VoIP call handling will result in rejection.',
    detectionMethod: 'HYBRID',
    evidenceRequired: ['UIBackgroundModes array in Info.plist', 'AVAudioSession category or CLLocationManager code check'],
    remediationGuidance: 'Remove unused UIBackgroundModes keys from Info.plist unless your app actively plays audio in the background or performs turn-by-turn navigation.',
    codeSnippet: `<!-- Only include if actually needed: -->
<key>UIBackgroundModes</key>
<array>
    <string>audio</string>
</array>`,
    confidence: 0.93,
    sourceUrl: 'https://developer.apple.com/app-store/review/guidelines/#software-requirements',
    lastReviewedDate: '2026-06-15',
    version: '1.2.0',
    enabled: true
  },

  // 11. SECURITY & ENCRYPTION
  {
    id: 'RULE-SEC-01',
    category: 'SECURITY_ENCRYPTION',
    guidelineRef: 'Guideline 5.0 / Export Compliance',
    title: 'Missing ITSAppUsesNonExemptEncryption in Info.plist',
    severity: 'LOW',
    description: 'If your app uses standard HTTPS encryption only, setting ITSAppUsesNonExemptEncryption to false prevents manual export compliance prompts during every App Store build upload.',
    detectionMethod: 'STATIC_ANALYSIS',
    evidenceRequired: ['ITSAppUsesNonExemptEncryption key in Info.plist'],
    remediationGuidance: 'Add `<key>ITSAppUsesNonExemptEncryption</key><false/>` to your Info.plist if your app only uses standard HTTPS / iOS system encryption.',
    codeSnippet: `<key>ITSAppUsesNonExemptEncryption</key>
<false/>`,
    confidence: 0.99,
    sourceUrl: 'https://developer.apple.com/documentation/security/complying_with_encryption_export_regulations',
    lastReviewedDate: '2026-06-15',
    version: '1.1.0',
    enabled: true
  },
  {
    id: 'RULE-SEC-02',
    category: 'SECURITY_ENCRYPTION',
    guidelineRef: 'Guideline 5.0',
    title: 'NSAppTransportSecurity Allows Insecure Arbitrary Loads',
    severity: 'MEDIUM',
    description: 'Setting NSAllowsArbitraryLoads = true bypasses HTTPS requirements and triggers rejection unless accompanied by strong justification in App Review notes.',
    detectionMethod: 'STATIC_ANALYSIS',
    evidenceRequired: ['NSAppTransportSecurity -> NSAllowsArbitraryLoads = true'],
    remediationGuidance: 'Use HTTPS across all server endpoints and scope exceptions to specific domain names under NSExceptionDomains rather than allowing all arbitrary loads.',
    codeSnippet: `<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <false/>
</dict>`,
    confidence: 0.96,
    sourceUrl: 'https://developer.apple.com/documentation/bundleresources/information_property_list/nsapptransportsecurity',
    lastReviewedDate: '2026-06-15',
    version: '1.2.0',
    enabled: true
  }
];

export const RULE_COUNT = APP_STORE_RULES.length;

const RULES_OVERRIDE_KEY = 'fixit_rules_override';

export function getStoredRuleOverrides(): Record<string, boolean> {
  if (typeof globalThis === 'undefined' || !('localStorage' in globalThis)) {
    return {};
  }

  try {
    const raw = globalThis.localStorage.getItem(RULES_OVERRIDE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    console.warn('Error reading rule overrides from localStorage:', err);
    return {};
  }
}

export function saveStoredRuleOverride(ruleId: string, enabled: boolean): Record<string, boolean> {
  if (typeof globalThis === 'undefined' || !('localStorage' in globalThis)) {
    return {};
  }

  try {
    const overrides = getStoredRuleOverrides();
    overrides[ruleId] = enabled;
    globalThis.localStorage.setItem(RULES_OVERRIDE_KEY, JSON.stringify(overrides));
    return overrides;
  } catch (err) {
    console.warn('Error persisting rule override to localStorage:', err);
    return {};
  }
}

export function getEffectiveRules(): RuleDefinition[] {
  const overrides = getStoredRuleOverrides();
  return APP_STORE_RULES.map(rule => {
    if (typeof overrides[rule.id] === 'boolean') {
      return { ...rule, enabled: overrides[rule.id] };
    }
    return rule;
  });
}
