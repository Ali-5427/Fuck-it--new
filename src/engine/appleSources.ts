import { AppleGuidelineSource } from '../types';

export const APPLE_GUIDELINE_SOURCES: AppleGuidelineSource[] = [
  {
    id: 'SRC-5.1.1',
    guidelineNumber: '5.1.1',
    title: 'Data Collection and Storage',
    category: 'PRIVACY',
    url: 'https://developer.apple.com/app-store/review/guidelines/#data-collection-and-storage',
    lastVerifiedDate: '2026-06-15',
    version: '2026.2',
    summary: 'Apps that collect user or device data must have a privacy policy and must secure user consent for data collection.'
  },
  {
    id: 'SRC-5.1.2',
    guidelineNumber: '5.1.2',
    title: 'Data Use and Sharing & Privacy Manifests',
    category: 'PRIVACY',
    url: 'https://developer.apple.com/app-store/review/guidelines/#data-use-and-sharing',
    lastVerifiedDate: '2026-06-15',
    version: '2026.2',
    summary: 'Apps and third-party SDKs must declare required reason APIs, tracking usage, and collected data types in PrivacyInfo.xcprivacy.'
  },
  {
    id: 'SRC-5.1.1-V',
    guidelineNumber: '5.1.1(v)',
    title: 'Account Deletion Requirement',
    category: 'ACCOUNT_REQUIREMENTS',
    url: 'https://developer.apple.com/app-store/review/guidelines/#data-collection-and-storage',
    lastVerifiedDate: '2026-06-15',
    version: '2026.2',
    summary: 'If an app supports account creation, it must also offer account deletion within the app, including associated data deletion.'
  },
  {
    id: 'SRC-4.8',
    guidelineNumber: '4.8',
    title: 'Sign in with Apple',
    category: 'ACCOUNT_REQUIREMENTS',
    url: 'https://developer.apple.com/app-store/review/guidelines/#sign-in-with-apple',
    lastVerifiedDate: '2026-06-15',
    version: '2026.2',
    summary: 'Apps that use a third-party or social login service (Google, Facebook, etc.) must also offer Sign in with Apple as an equivalent option.'
  },
  {
    id: 'SRC-3.1.1',
    guidelineNumber: '3.1.1',
    title: 'In-App Purchase',
    category: 'PAYMENTS_IAP',
    url: 'https://developer.apple.com/app-store/review/guidelines/#in-app-purchase',
    lastVerifiedDate: '2026-06-15',
    version: '2026.2',
    summary: 'Digital goods and services within the app must use Apple In-App Purchase. Apps cannot steer users to external payment mechanisms for unlockable app features.'
  },
  {
    id: 'SRC-3.1.2',
    guidelineNumber: '3.1.2',
    title: 'Auto-Renewable Subscriptions',
    category: 'SUBSCRIPTIONS',
    url: 'https://developer.apple.com/app-store/review/guidelines/#subscriptions',
    lastVerifiedDate: '2026-06-15',
    version: '2026.2',
    summary: 'Subscription apps must clearly disclose billing terms, renewal cadence, cancellation procedures, and provide a functioning Restore Purchases button.'
  },
  {
    id: 'SRC-1.2',
    guidelineNumber: '1.2',
    title: 'User-Generated Content (UGC)',
    category: 'UGC',
    url: 'https://developer.apple.com/app-store/review/guidelines/#user-generated-content',
    lastVerifiedDate: '2026-06-15',
    version: '2026.2',
    summary: 'Apps with UGC must include a method for filtering objectionable material, reporting mechanisms, ability to block abusive users, and published terms (EULA).'
  },
  {
    id: 'SRC-2.1',
    guidelineNumber: '2.1',
    title: 'App Completeness & Review Access',
    category: 'APP_COMPLETENESS',
    url: 'https://developer.apple.com/app-store/review/guidelines/#app-completeness',
    lastVerifiedDate: '2026-06-15',
    version: '2026.2',
    summary: 'Submissions must be final, non-placeholder versions with valid demo/reviewer credentials provided in App Store Connect for all gated features.'
  },
  {
    id: 'SRC-2.3',
    guidelineNumber: '2.3',
    title: 'Accurate Metadata & Claims',
    category: 'METADATA',
    url: 'https://developer.apple.com/app-store/review/guidelines/#accurate-metadata',
    lastVerifiedDate: '2026-06-15',
    version: '2026.2',
    summary: 'App metadata must accurately describe features, must not mention competitor platforms (Android, Play Store), and must not contain misleading superlative claims.'
  },
  {
    id: 'SRC-2.3.3',
    guidelineNumber: '2.3.3',
    title: 'Screenshots and App Previews',
    category: 'SCREENSHOTS',
    url: 'https://developer.apple.com/app-store/review/guidelines/#accurate-metadata',
    lastVerifiedDate: '2026-06-15',
    version: '2026.2',
    summary: 'Screenshots must accurately display the app in use on matching target device displays without misleading hardware mockups or unreadable text.'
  },
  {
    id: 'SRC-2.5.4',
    guidelineNumber: '2.5.4',
    title: 'Multitasking and Background Execution',
    category: 'BACKGROUND_MODES',
    url: 'https://developer.apple.com/app-store/review/guidelines/#software-requirements',
    lastVerifiedDate: '2026-06-15',
    version: '2026.2',
    summary: 'Background audio, location, or VoIP modes may only be used for intended active user services and must cease when not in legitimate use.'
  },
  {
    id: 'SRC-5.0',
    guidelineNumber: '5.0',
    title: 'Legal & Security Requirements (ATS & Encryption)',
    category: 'SECURITY_ENCRYPTION',
    url: 'https://developer.apple.com/app-store/review/guidelines/#legal',
    lastVerifiedDate: '2026-06-15',
    version: '2026.2',
    summary: 'Apps must comply with App Transport Security (HTTPS) and properly declare US export compliance non-exempt encryption in Info.plist.'
  }
];
