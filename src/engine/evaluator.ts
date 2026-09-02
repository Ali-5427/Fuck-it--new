import {
  NormalizedAppInspection,
  Finding,
  AuditRun,
  ReadinessStatus,
  AuditComparison,
  FindingEvidence,
  AuditSeverity,
  AuditScanType
} from '../types';
import { getEffectiveRules } from './rules';
import { isValidAppStoreScreenshotSize } from './extractor';

export function computeReadiness(findings: Finding[]): ReadinessStatus {
  const open = findings.filter(f => f.status !== 'FIXED' && f.status !== 'WONT_FIX');
  const high = open.filter(f => f.severity === 'HIGH').length;
  const mediumOrLow = open.filter(f => f.severity === 'MEDIUM' || f.severity === 'LOW').length;
  const manual = open.filter(f => f.severity === 'MANUAL_CHECK').length;

  if (high > 0) return 'NOT_READY';
  if (mediumOrLow > 0 || manual > 0) return 'READY_WITH_WARNINGS';
  return 'NO_HIGH_RISK_ISSUES_DETECTED';
}

export function readinessCopy(status: ReadinessStatus): { label: string; summaryHint: string } {
  switch (status) {
    case 'NOT_READY':
      return {
        label: 'NOT READY',
        summaryHint: 'Important issues remain. Fix the high-priority items before submitting.'
      };
    case 'READY_WITH_WARNINGS':
      return {
        label: 'READY WITH WARNINGS',
        summaryHint: 'No major detected problems, but some things should be reviewed or improved.'
      };
    default:
      return {
        label: 'NO HIGH-RISK ISSUES DETECTED',
        summaryHint: 'No major issues were detected in the checks we ran. This is not a guarantee of App Review approval.'
      };
  }
}

interface RuleEval {
  triggered: boolean;
  severity?: AuditSeverity;
  evidence: FindingEvidence[];
  why: string;
  action: string;
  verify: string;
}

function evidence(
  key: string,
  location: string,
  detectionStatus: FindingEvidence['detectionStatus'],
  notes: string,
  extractedValue?: FindingEvidence['extractedValue']
): FindingEvidence {
  return { key, location, detectionStatus, notes, extractedValue };
}

function evaluateRule(ruleId: string, inspection: NormalizedAppInspection, ruleWhy: string, ruleAction: string): RuleEval {
  const empty: RuleEval = {
    triggered: false,
    evidence: [],
    why: ruleWhy,
    action: ruleAction,
    verify: 'Confirm this in your project and App Store Connect listing.'
  };

  switch (ruleId) {
    case 'RULE-PRIV-01': {
      if (inspection.privacyManifest.hasPrivacyManifest === 'UNKNOWN') {
        return {
          triggered: true,
          severity: 'MANUAL_CHECK',
          evidence: [evidence('PrivacyInfo.xcprivacy', 'App Store Connect / Build scan', 'UNKNOWN', 'Privacy manifest presence cannot be verified via App Store Connect metadata.')],
          why: 'Apple expects apps to declare data collection and Required Reason API usage in a privacy manifest.',
          action: 'Add a PrivacyInfo.xcprivacy file to the app target and declare collected data types plus Required Reason APIs you actually use.',
          verify: 'In Xcode, confirm PrivacyInfo.xcprivacy is in the app target’s Copy Bundle Resources.'
        };
      }
      if (!inspection.privacyManifest.hasPrivacyManifest) {
        return {
          triggered: true,
          evidence: [evidence('PrivacyInfo.xcprivacy', 'App bundle', 'NOT_DETECTED', 'No PrivacyInfo.xcprivacy file was found in the uploaded build.')],
          why: 'Apple expects apps to declare data collection and Required Reason API usage in a privacy manifest.',
          action: 'Add a PrivacyInfo.xcprivacy file to the app target and declare collected data types plus Required Reason APIs you actually use (for example UserDefaults).',
          verify: 'In Xcode, confirm PrivacyInfo.xcprivacy is in the app target’s Copy Bundle Resources.'
        };
      }
      if (inspection.privacyManifest.accessedApiTypes.length === 0) {
        return {
          triggered: true,
          severity: 'MEDIUM',
          evidence: [evidence('NSPrivacyAccessedAPITypes', 'PrivacyInfo.xcprivacy', 'DETECTED', 'A privacy manifest is present, but no Required Reason API types were declared.')],
          why: 'Most apps use UserDefaults or file timestamps. An empty Required Reason API list often causes validation warnings.',
          action: 'Declare only the Required Reason APIs your app actually uses, with the matching reason codes.',
          verify: 'Search the project for UserDefaults, file timestamps, disk space, and system boot time APIs.'
        };
      }
      return empty;
    }

    case 'RULE-PRIV-02': {
      const url = inspection.metadata.privacyPolicyUrl?.trim() || '';
      if (!url) {
        if (inspection.metadata.listingProvided) {
          return {
            triggered: true,
            severity: 'MANUAL_CHECK',
            evidence: [evidence('privacyPolicyUrl', 'App Store listing info', 'UNKNOWN', 'No App Store listing privacy URL was provided with this check.')],
            why: 'Public App Store listings can be checked without a privacy URL, but you still need a live HTTPS policy for a real submission if the app collects data or has accounts.',
            action: 'Add your privacy policy HTTPS URL in App Store Connect and confirm the page loads before publishing.',
            verify: 'Open the URL in a browser and confirm it describes this app’s data use.'
          };
        }
        return {
          triggered: true,
          severity: 'MANUAL_CHECK',
          evidence: [evidence('privacyPolicyUrl', 'Submission info', 'UNKNOWN', 'No App Store listing privacy URL was provided with this check.')],
          why: 'Apps that collect data or offer accounts need a live HTTPS privacy policy in App Store Connect and usually in-app.',
          action: 'Add your privacy policy HTTPS URL on the next check (or in App Store Connect) and confirm the page loads.',
          verify: 'Open the URL in a browser and confirm it describes this app’s data use.'
        };
      }
      if (!url.startsWith('https://')) {
        return {
          triggered: true,
          evidence: [evidence('privacyPolicyUrl', 'App Store listing info', 'DETECTED', 'URL is missing https://.', url || '(none)')],
          why: 'Apple expects a publicly reachable HTTPS privacy policy for submissions that collect data or use accounts.',
          action: 'Set a live https:// privacy policy URL in App Store Connect and in the app if you collect data.',
          verify: 'Visit the URL and confirm it is not a placeholder or 404.'
        };
      }
      return empty;
    }

    case 'RULE-PRIV-03': {
      const att = inspection.permissions.find(p => p.key === 'NSUserTrackingUsageDescription');
      if (inspection.features.hasAdvertising === 'UNKNOWN' || inspection.privacyManifest.trackingEnabled === 'UNKNOWN') {
        return {
          triggered: true,
          severity: 'MANUAL_CHECK',
          evidence: [evidence('NSUserTrackingUsageDescription', 'App Store Connect / Ad Tracking', 'UNKNOWN', 'Ad tracking and ATT configuration cannot be determined from basic App Store Connect info.')],
          why: 'If the app tracks users across apps or sites, Apple expects an ATT prompt with a clear purpose string.',
          action: 'If you collect IDFA or track users across third-party apps/websites, provide NSUserTrackingUsageDescription in Info.plist.',
          verify: 'Confirm whether AdMob, AppsFlyer, or IDFA tracking is used.'
        };
      }
      if (inspection.features.hasAdvertising || inspection.privacyManifest.trackingEnabled) {
        if (!att?.detected || !att.description.trim()) {
          return {
            triggered: true,
            evidence: [evidence('NSUserTrackingUsageDescription', 'Info.plist', 'NOT_DETECTED', 'Tracking or ads were detected, but the App Tracking Transparency purpose string is missing or empty.')],
            why: 'If the app tracks users across apps or sites, Apple expects an ATT prompt with a clear purpose string.',
            action: 'Add NSUserTrackingUsageDescription that names the feature using tracking, or remove tracking/ad SDKs if you do not track.',
            verify: 'Confirm whether AdMob, AppsFlyer, or IDFA tracking is actually used.'
          };
        }
      }
      return empty;
    }

    case 'RULE-PERM-01': {
      const weak = inspection.permissions.filter(p => {
        if (!p.detected) return false;
        const desc = p.description.trim();
        return desc.length < 15 || /^(needed|required|app requires|functionality|camera access|location)$/i.test(desc);
      });
      if (weak.length === 0) return empty;
      return {
        triggered: true,
        evidence: weak.map(p => evidence(p.key, 'Info.plist', 'DETECTED', 'Purpose string is missing, too short, or too generic.', p.description || '(empty)')),
        why: 'Users must understand why the app needs a sensitive permission. Vague text is a common rejection reason.',
        action: 'Rewrite each flagged purpose string so it names the exact in-app feature that uses that permission.',
        verify: 'Read each string as if you were a first-time user seeing the system prompt.'
      };
    }

    case 'RULE-PERM-02': {
      const alwaysLoc = inspection.permissions.find(p => p.key === 'NSLocationAlwaysAndWhenInUseUsageDescription');
      const hasBgLoc = inspection.backgroundModes.includes('location');
      if (alwaysLoc?.detected && !hasBgLoc) {
        return {
          triggered: true,
          evidence: [evidence('NSLocationAlwaysAndWhenInUseUsageDescription', 'Info.plist', 'DETECTED', 'Always location is requested without a location background mode.')],
          why: 'Always location without a clear background use (navigation, geofencing) is often considered excessive.',
          action: 'Switch to When In Use if that is enough, or only keep Always location if you truly need background location and can explain it.',
          verify: 'List the user-facing feature that needs location when the app is not on screen.'
        };
      }
      return empty;
    }

    case 'RULE-ACC-01': {
      if (inspection.features.hasAccountDeletion === 'UNKNOWN' || inspection.features.hasThirdPartyAuth === 'UNKNOWN' || inspection.features.hasSignInWithApple === 'UNKNOWN') {
        return {
          triggered: true,
          severity: 'MANUAL_CHECK',
          evidence: [evidence('Account deletion', 'Account requirements', 'UNKNOWN', 'Account system configuration cannot be confirmed from App Store Connect metadata. If users can create accounts, in-app account deletion is mandatory.')],
          why: 'If people can create an account, Apple expects a way to delete the account and associated data from inside the app.',
          action: 'Add a clear Delete Account flow in settings (not only an email link), and confirm it actually deletes the account.',
          verify: 'Sign in, open settings, and complete deletion on a test account.'
        };
      }
      const hasAccounts = inspection.features.hasThirdPartyAuth || inspection.features.hasSignInWithApple;
      if (!hasAccounts) return empty;
      return {
        triggered: true,
        severity: 'MANUAL_CHECK',
        evidence: [evidence('Account deletion', 'App UI (not visible in the build scan)', 'UNKNOWN', 'Sign-in related signals were found. Whether account deletion exists in the UI cannot be verified from this upload.')],
        why: 'If people can create an account, Apple expects a way to delete the account and associated data from inside the app.',
        action: 'Add a clear Delete Account flow in settings (not only an email link), and confirm it actually deletes the account.',
        verify: 'Sign in, open settings, and complete deletion on a test account.'
      };
    }

    case 'RULE-ACC-02': {
      if (inspection.features.hasThirdPartyAuth === 'UNKNOWN' || inspection.features.hasSignInWithApple === 'UNKNOWN') {
        return {
          triggered: true,
          severity: 'MANUAL_CHECK',
          evidence: [evidence('Third-party login', 'Authentication', 'UNKNOWN', 'Third-party login usage cannot be determined from App Store Connect metadata. If third-party login is used, Sign in with Apple must also be offered.')],
          why: 'If the app uses a third-party social login, Apple also expects Sign in with Apple as an equivalent option.',
          action: 'Add Sign in with Apple next to the other social login buttons, using AuthenticationServices.',
          verify: 'Open the login screen and confirm Apple appears as a first-class option.'
        };
      }
      if (inspection.features.hasThirdPartyAuth && !inspection.features.hasSignInWithApple) {
        return {
          triggered: true,
          evidence: [evidence('Third-party login', 'Frameworks / URL schemes', 'DETECTED', 'Google or Facebook login signals were found without Sign in with Apple.', inspection.frameworks.filter(f => /Google|Facebook/i.test(f)))],
          why: 'If the app uses a third-party social login, Apple also expects Sign in with Apple as an equivalent option.',
          action: 'Add Sign in with Apple next to the other social login buttons, using AuthenticationServices.',
          verify: 'Open the login screen and confirm Apple appears as a first-class option.'
        };
      }
      return empty;
    }

    case 'RULE-ACC-03': {
      if (inspection.features.hasThirdPartyAuth === 'UNKNOWN' || inspection.features.hasSignInWithApple === 'UNKNOWN') {
        return {
          triggered: true,
          severity: 'MANUAL_CHECK',
          evidence: [evidence('Login gate', 'Account requirements', 'UNKNOWN', 'Account requirements cannot be determined from App Store Connect metadata. Ensure core features are accessible without mandatory login where feasible.')],
          why: 'Apple often rejects apps that force account creation before the user can try features that do not need an account.',
          action: 'Allow browsing or using core utility features without an account, and only require sign-in for sync, cloud, or personal data.',
          verify: 'Fresh-install the app and see what is usable before any login.'
        };
      }
      if (!(inspection.features.hasThirdPartyAuth || inspection.features.hasSignInWithApple)) return empty;
      return {
        triggered: true,
        severity: 'MANUAL_CHECK',
        evidence: [evidence('Login gate', 'App launch flow', 'UNKNOWN', 'The app appears to support accounts. Whether core features work without signing in cannot be determined from the binary scan.')],
        why: 'Apple often rejects apps that force account creation before the user can try features that do not need an account.',
        action: 'Allow browsing or using core utility features without an account, and only require sign-in for sync, cloud, or personal data.',
        verify: 'Fresh-install the app and see what is usable before any login.'
      };
    }

    case 'RULE-IAP-01': {
      if (inspection.features.hasExternalPayments) {
        return {
          triggered: true,
          evidence: [evidence('Stripe', 'Embedded frameworks', 'DETECTED', 'A Stripe SDK was found. Digital goods generally must use In-App Purchase, not an external checkout.')],
          why: 'Charging for digital features through an external paywall (instead of StoreKit) is a common Guideline 3.1.1 rejection.',
          action: 'Sell digital unlocks and subscriptions with StoreKit, or confirm you qualify for a rare exception (for example some reader apps) and document it.',
          verify: 'Walk through every purchase path in the app and list which ones are digital vs physical/real-world.'
        };
      }
      return empty;
    }

    case 'RULE-SUB-01': {
      if (!(inspection.features.hasInAppPurchases || inspection.features.hasSubscriptions)) return empty;
      return {
        triggered: true,
        severity: 'MANUAL_CHECK',
        evidence: [evidence('StoreKit / IAP', 'Frameworks', 'DETECTED', 'In-app purchase libraries were found. A Restore Purchases control cannot be confirmed from this scan.', inspection.frameworks.filter(f => /StoreKit|RevenueCat/i.test(f)))],
        why: 'Paywalls for non-consumable purchases and subscriptions are expected to let users restore previous purchases.',
        action: 'Put a working Restore Purchases control on the paywall and in settings, and test it in sandbox.',
        verify: 'Buy on one install, restore on another sandbox account/device.'
      };
    }

    case 'RULE-SUB-02': {
      if (!(inspection.features.hasInAppPurchases || inspection.features.hasSubscriptions)) return empty;
      return {
        triggered: true,
        severity: 'MANUAL_CHECK',
        evidence: [evidence('Paywall legal links', 'Subscription / paywall UI', 'UNKNOWN', 'Purchases appear possible. Terms and privacy links on the paywall cannot be seen from this scan.')],
        why: 'Subscription purchase screens are expected to show working Terms of Use and Privacy Policy links.',
        action: 'Add Terms of Use (or Apple’s standard EULA) and Privacy Policy links on the paywall, near the purchase button.',
        verify: 'Open the paywall and tap both links.'
      };
    }

    case 'RULE-UGC-01': {
      if (inspection.features.hasUserGeneratedContent === 'UNKNOWN') {
        return {
          triggered: true,
          severity: 'MANUAL_CHECK',
          evidence: [evidence('User-generated content', 'UGC moderation', 'UNKNOWN', 'UGC features cannot be confirmed from App Store Connect metadata. If the app hosts user-generated content, moderation and reporting mechanisms are required.')],
          why: 'Feeds, chat, comments, or user uploads generally need reporting, blocking, and filtering of objectionable content.',
          action: 'Add report and block actions on user content, plus filtering and a way to contact you about abuse.',
          verify: 'Create two test accounts and walk through report and block.'
        };
      }
      if (!inspection.features.hasUserGeneratedContent) return empty;
      return {
        triggered: true,
        severity: 'MANUAL_CHECK',
        evidence: [evidence('User-generated content', 'App category / features', 'UNKNOWN', 'This listing looks like it may include user content (for example a social category). Moderation tools cannot be verified automatically.')],
        why: 'Feeds, chat, comments, or user uploads generally need reporting, blocking, and filtering of objectionable content.',
        action: 'Add report and block actions on user content, plus filtering and a way to contact you about abuse.',
        verify: 'Create two test accounts and walk through report and block.'
      };
    }

    case 'RULE-COMP-01': {
      const needsLogin = inspection.features.hasThirdPartyAuth || inspection.features.hasSignInWithApple;
      const notes = inspection.metadata.reviewerNotes?.trim() || '';
      if (inspection.features.hasThirdPartyAuth === 'UNKNOWN' || inspection.features.hasSignInWithApple === 'UNKNOWN') {
        if (notes.length < 8) {
          return {
            triggered: true,
            severity: 'MANUAL_CHECK',
            evidence: [evidence('Reviewer notes', 'Submission info', 'UNKNOWN', 'Account requirement cannot be confirmed from App Store Connect metadata and no reviewer notes or demo credentials were provided.')],
            why: 'If App Review cannot reach core features without an account, they need a working demo login in Review Information.',
            action: 'Create a durable test account, put username and password in App Store Connect Review Information, and include any 2FA bypass steps.',
            verify: 'Log in with those credentials on a clean install before you submit.'
          };
        }
        return empty;
      }
      if (!needsLogin) return empty;
      if (notes.length < 8) {
        return {
          triggered: true,
          severity: 'MANUAL_CHECK',
          evidence: [evidence('Reviewer notes', 'Submission info', 'NOT_DETECTED', 'The app appears to have a login, but no demo credentials were included with this check.')],
          why: 'If App Review cannot reach the core features without an account, they need a working demo login in Review Information.',
          action: 'Create a durable test account, put username and password in App Store Connect Review Information, and include any 2FA bypass steps.',
          verify: 'Log in with those credentials on a clean install before you submit.'
        };
      }
      return empty;
    }

    case 'RULE-COMP-02': {
      const haystack = [
        inspection.metadata.name,
        inspection.metadata.subtitle,
        inspection.metadata.description,
        inspection.metadata.keywords,
        ...(Array.isArray(inspection.rawInfo?.flattenedStrings) ? inspection.rawInfo.flattenedStrings as string[] : [])
      ].join(' ');
      const match = haystack.match(/lorem ipsum|todo:|placeholder|test title|example\.com\/privacy/i);
      if (!match) return empty;
      return {
        triggered: true,
        evidence: [evidence('Placeholder copy', 'Listing / Info.plist strings', 'DETECTED', 'Placeholder or draft text was found.', match[0])],
        why: 'Placeholder copy, lorem ipsum, or unfinished screens make the submission look incomplete.',
        action: 'Replace draft strings and sample URLs with the real production copy and live links.',
        verify: 'Search the project and listing for lorem, TODO, placeholder, and example.com.'
      };
    }

    case 'RULE-META-01': {
      const meta = inspection.metadata;
      if (!meta.listingProvided && !meta.name && !meta.subtitle && !meta.description) {
        return {
          triggered: true,
          severity: 'MANUAL_CHECK',
          evidence: [evidence('App Store listing', 'Submission info', 'UNKNOWN', 'Title, subtitle, description, and keywords were not included with this check.')],
          why: 'Listing fields have hard character limits and must match what the app actually does.',
          action: 'Paste your App Store name, subtitle, description, and keywords into the next check.',
          verify: 'Compare App Store Connect fields with the strings you intend to ship.'
        };
      }
      const issues: string[] = [];
      if (meta.name && meta.name.length > 30) issues.push(`Name is ${meta.name.length} characters (max 30)`);
      if (meta.subtitle && meta.subtitle.length > 30) issues.push(`Subtitle is ${meta.subtitle.length} characters (max 30)`);
      if (meta.keywords && meta.keywords.length > 100) issues.push(`Keywords are ${meta.keywords.length} characters (max 100)`);
      if (issues.length === 0) return empty;
      return {
        triggered: true,
        evidence: [evidence('Listing length', 'App Store listing info', 'DETECTED', issues.join('; '), issues)],
        why: 'App Store Connect rejects names and subtitles over 30 characters and keywords over 100.',
        action: 'Shorten the flagged fields so they fit the limits.',
        verify: 'Count characters in App Store Connect, not only in a notes app.'
      };
    }

    case 'RULE-META-02': {
      const desc = `${inspection.metadata.description || ''} ${inspection.metadata.keywords || ''}`;
      const match = desc.match(/\b(android|google play|play store|apk|windows phone)\b/i);
      if (!match) return empty;
      return {
        triggered: true,
        evidence: [evidence('Competitor mention', 'Description / keywords', 'DETECTED', `Mentioned "${match[0]}" in listing text.`, match[0])],
        why: 'Pointing to other stores or platforms in the App Store listing is not allowed.',
        action: 'Remove Android, Google Play, APK, and similar mentions from the description and keywords.',
        verify: 'Search the full listing copy for those words.'
      };
    }

    case 'RULE-META-03': {
      const text = `${inspection.metadata.name || ''} ${inspection.metadata.subtitle || ''}`;
      const match = text.match(/\b(#1|number one|best|free|top-rated|\$\d)\b/i);
      if (!match) return empty;
      return {
        triggered: true,
        evidence: [evidence('Name / subtitle claim', 'App Store listing info', 'DETECTED', `Possible ranking or pricing claim: "${match[0]}".`, match[0])],
        why: 'Names and subtitles should not include unproven rankings, “free” pricing claims, or similar marketing superlatives.',
        action: 'Describe what the app does instead of calling it #1, best, or free in the name/subtitle.',
        verify: 'Read the name and subtitle as they will appear on the store card.'
      };
    }

    case 'RULE-SHOT-01': {
      if (!inspection.screenshots.length) {
        return {
          triggered: true,
          severity: 'MANUAL_CHECK',
          evidence: [evidence('Screenshots', 'Submission assets', 'UNKNOWN', 'No screenshots were included with this check.')],
          why: 'App Store Connect requires screenshots at exact device sizes. Wrong sizes block submission.',
          action: 'Export screenshots at a required size (for example 1320×2868 or 1290×2796) and attach them on the next check.',
          verify: 'Check pixel dimensions in Preview or the Finder Get Info panel.'
        };
      }
      const measured = inspection.screenshots.filter(shot => shot.precision === 'EXACT' && typeof shot.isValidSize === 'boolean');
      if (measured.length === 0) return empty;
      const invalid = measured.filter(shot => shot.isValidSize === false);
      if (invalid.length === 0) return empty;
      return {
        triggered: true,
        evidence: invalid.map(shot => evidence(shot.name, 'Screenshot assets', 'DETECTED', `Size ${shot.width}×${shot.height} is not a required App Store dimension.`, `${shot.width}x${shot.height}`)),
        why: 'Screenshots must match Apple’s listed pixel sizes for the device class you are submitting.',
        action: 'Re-export the flagged images at an official size. Do not stretch or pad with empty canvas.',
        verify: 'Compare each file to Apple’s screenshot specifications.'
      };
    }

    case 'RULE-BG-01': {
      if (inspection.backgroundModes.length === 0) return empty;
      return {
        triggered: true,
        severity: 'MANUAL_CHECK',
        evidence: [evidence('UIBackgroundModes', 'Info.plist', 'DETECTED', `Declared: ${inspection.backgroundModes.join(', ')}. Whether each mode is user-facing cannot be proven from the scan.`, inspection.backgroundModes)],
        why: 'Background modes must match a real user feature (audio, navigation, VoIP, and so on). Unused modes get flagged.',
        action: 'Remove any background mode you do not actually use. For each remaining mode, be ready to explain the feature to App Review.',
        verify: 'Turn the feature off in code and confirm the matching mode is also removed from Info.plist.'
      };
    }

    case 'RULE-SEC-01': {
      const encryptionStatus = inspection.security.usesNonExemptEncryptionDeclared;
      if (encryptionStatus === true || encryptionStatus === false) return empty;
      if (encryptionStatus === 'UNKNOWN') {
        return {
          triggered: true,
          severity: 'MANUAL_CHECK',
          evidence: [evidence('ITSAppUsesNonExemptEncryption', 'App Store Connect / Info.plist', 'UNKNOWN', 'Export compliance status cannot be determined from basic App Store Connect info.')],
          why: 'If you only use standard HTTPS / system encryption, declaring this key avoids a repeated compliance question.',
          action: 'Declare ITSAppUsesNonExemptEncryption = false in Info.plist or answer export compliance questions in App Store Connect.',
          verify: 'Confirm you are not using custom crypto beyond HTTPS and Apple’s APIs.'
        };
      }
      return {
        triggered: true,
        evidence: [evidence('ITSAppUsesNonExemptEncryption', 'Info.plist', 'NOT_DETECTED', 'Export compliance key is missing. App Store Connect will ask about encryption on every upload.')],
        why: 'If you only use standard HTTPS / system encryption, declaring this key avoids a repeated compliance question.',
        action: 'Add ITSAppUsesNonExemptEncryption = false unless you use non-exempt encryption.',
        verify: 'Confirm you are not using custom crypto beyond HTTPS and Apple’s APIs.'
      };
    }

    case 'RULE-SEC-02': {
      if (inspection.security.atsAllowsArbitraryLoads === 'UNKNOWN') {
        return {
          triggered: true,
          severity: 'MANUAL_CHECK',
          evidence: [evidence('NSAllowsArbitraryLoads', 'App Transport Security', 'UNKNOWN', 'ATS configuration cannot be determined from App Store Connect metadata.')],
          why: 'Open ATS exceptions are hard to justify. Reviewers expect HTTPS unless a specific domain needs an exception.',
          action: 'Ensure NSAllowsArbitraryLoads is disabled in Info.plist and use HTTPS.',
          verify: 'Confirm your app connects exclusively via secure HTTPS.'
        };
      }
      if (!inspection.security.atsAllowsArbitraryLoads) return empty;
      return {
        triggered: true,
        evidence: [evidence('NSAllowsArbitraryLoads', 'Info.plist → NSAppTransportSecurity', 'DETECTED', 'Arbitrary loads are enabled, which allows insecure HTTP.')],
        why: 'Open ATS exceptions are hard to justify. Reviewers expect HTTPS unless a specific domain needs an exception.',
        action: 'Turn off NSAllowsArbitraryLoads and use HTTPS, or limit exceptions to named domains you can explain.',
        verify: 'Load every API on HTTPS in a production build.'
      };
    }

    default:
      return empty;
  }
}

export function evaluateInspection(
  inspection: NormalizedAppInspection,
  appId: string,
  buildNumber: string,
  appVersion: string,
  existingFindings: Finding[] = [],
  isListingOnly: boolean = false,
  auditType?: AuditScanType
): AuditRun {
  const resolvedAuditType: AuditScanType = auditType 
    ? auditType 
    : (isListingOnly || inspection.metadata?.listingProvided) 
    ? 'LISTING_SCAN' 
    : 'BINARY_SCAN';

  const isListing = isListingOnly || resolvedAuditType === 'LISTING_SCAN';
  const auditId = `audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const findings: Finding[] = [];
  const passedChecks: { ruleId: string; title: string }[] = [];
  const existingStatusMap = new Map<string, Finding>();
  existingFindings.forEach(f => existingStatusMap.set(f.ruleId, f));

  const effectiveRules = getEffectiveRules();
  for (const rule of effectiveRules) {
    if (!rule.enabled) continue;
    if (isListing) {
      const allowedListingRules = [
        'RULE-PRIV-02',
        'RULE-META-01',
        'RULE-META-02',
        'RULE-META-03',
        'RULE-SHOT-01',
        'RULE-COMP-02'
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
    const stillOpen = severity === 'MANUAL_CHECK' ? 'MANUAL_REVIEW' : 'OPEN';
    const status = existing?.status === 'WONT_FIX' ? 'WONT_FIX' : stillOpen;

    findings.push({
      id: existing?.id || `finding_${rule.id}_${Math.random().toString(36).slice(2, 7)}`,
      auditId,
      ruleId: rule.id,
      category: rule.category,
      guidelineRef: typeof rule.guidelineRef === 'object'
        ? rule.guidelineRef
        : {
            number: rule.guidelineRef,
            title: rule.title,
            url: rule.sourceUrl || 'https://developer.apple.com/app-store/review/guidelines/'
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
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  const severityRank: Record<AuditSeverity, number> = { HIGH: 0, MEDIUM: 1, LOW: 2, MANUAL_CHECK: 3 };
  findings.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);

  let highCount = 0;
  let medCount = 0;
  let lowCount = 0;
  let manualCount = 0;
  let openCount = 0;
  let resolvedCount = 0;

  findings.forEach(f => {
    if (f.status === 'FIXED' || f.status === 'WONT_FIX') {
      resolvedCount++;
      return;
    }
    openCount++;
    if (f.severity === 'HIGH') highCount++;
    if (f.severity === 'MEDIUM') medCount++;
    if (f.severity === 'LOW') lowCount++;
    if (f.severity === 'MANUAL_CHECK') manualCount++;
  });

  const readinessStatus = computeReadiness(findings);
  const copy = readinessCopy(readinessStatus);
  
  let summary = '';
  if (resolvedAuditType === 'LISTING_SCAN') {
    summary = `Storefront Listing Audit: Verified public App Store metadata, descriptions, category rules, and screenshot compliance. ${highCount} high, ${medCount} medium, ${lowCount} low priority issue${lowCount === 1 ? '' : 's'}. Deep binary checks (Privacy Manifests, Required Reason APIs, ATS encryption) require your compiled build.`;
  } else if (resolvedAuditType === 'CONNECT_SCAN') {
    summary = `App Store Connect Sync Audit: Checked live App Store version states, descriptions, keywords, promotional text, support URLs, In-App Purchase products, and TestFlight builds. ${highCount} high, ${medCount} medium, ${lowCount} low.`;
  } else {
    summary = `${copy.summaryHint} ${highCount} high, ${medCount} medium, ${lowCount} low, ${manualCount} manual check${manualCount === 1 ? '' : 's'}. ${passedChecks.length} check${passedChecks.length === 1 ? '' : 's'} looked clear in this run.`;
  }

  const siwaLine = inspection.features.hasSignInWithApple === true
    ? '- Sign in with Apple appears to be present in the build scan.'
    : inspection.features.hasSignInWithApple === 'UNKNOWN'
    ? '- Sign in with Apple status: not determined from Connect metadata.'
    : '- Sign in with Apple was not detected in this scan.';
  const privacyLine = inspection.metadata.privacyPolicyUrl
    ? `- Privacy Policy: ${inspection.metadata.privacyPolicyUrl}`
    : '- Privacy Policy URL: not provided with this check.';

  return {
    id: auditId,
    appId,
    buildNumber,
    appVersion,
    auditType: resolvedAuditType,
    createdAt: new Date().toISOString(),
    readinessStatus,
    ruleVersion: '2026.2-phase-a',
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
    reviewerNotesDraft: inspection.metadata.reviewerNotes?.trim()
      ? inspection.metadata.reviewerNotes
      : `App Version: ${appVersion} (Build ${buildNumber})\n\nNotes for App Review:\n${siwaLine}\n${privacyLine}\n- Support: ${inspection.metadata.supportUrl || '(not provided)'}`
  };
}

export function compareAudits(previousAudit: AuditRun, currentAudit: AuditRun): AuditComparison {
  const prevRuleMap = new Map(previousAudit.findings.map(f => [f.ruleId, f]));
  const currRuleMap = new Map(currentAudit.findings.map(f => [f.ruleId, f]));

  const resolvedFindings: Finding[] = [];
  const remainingFindings: Finding[] = [];
  const newFindings: Finding[] = [];

  previousAudit.findings.forEach(prevFinding => {
    const currFinding = currRuleMap.get(prevFinding.ruleId);
    if (!currFinding) {
      resolvedFindings.push(prevFinding);
    }
  });

  currentAudit.findings.forEach(currFinding => {
    const prevFinding = prevRuleMap.get(currFinding.ruleId);
    if (!prevFinding) {
      newFindings.push(currFinding);
    } else {
      remainingFindings.push(currFinding);
    }
  });

  return {
    previousAuditId: previousAudit.id,
    currentAuditId: currentAudit.id,
    previousBuild: previousAudit.buildNumber,
    currentBuild: currentAudit.buildNumber,
    resolvedCount: resolvedFindings.length,
    remainingCount: remainingFindings.length,
    newCount: newFindings.length,
    resolvedFindings,
    remainingFindings,
    newFindings
  };
}

export function calculateReadinessScore(audit?: AuditRun | null): number {
  if (!audit) return 0;
  if (!audit.findings || audit.findings.length === 0) return 100;

  const openFindings = audit.findings.filter(f => f.status !== 'FIXED' && f.status !== 'WONT_FIX' && f.severity !== 'MANUAL_CHECK');
  if (openFindings.length === 0) return 100;

  const high = openFindings.filter(f => f.severity === 'HIGH').length;
  const medium = openFindings.filter(f => f.severity === 'MEDIUM').length;
  const low = openFindings.filter(f => f.severity === 'LOW').length;
  const penalty = (high * 25) + (medium * 10) + (low * 5);
  return Math.max(0, Math.min(100, 100 - penalty));
}

export function isValidScreenshotSize(width: number, height: number): boolean {
  return isValidAppStoreScreenshotSize(width, height);
}
