import JSZip from 'jszip';
import { DetectionStatus, NormalizedAppInspection } from '../types';
import {
  flattenPlistStrings,
  isPlistDict,
  parsePlistBytes,
  parseXmlPlist,
  plistBool,
  plistString,
  PlistValue
} from './plist';

export const PERMISSION_KEYS = [
  { key: 'NSCameraUsageDescription', name: 'Camera' },
  { key: 'NSMicrophoneUsageDescription', name: 'Microphone' },
  { key: 'NSPhotoLibraryUsageDescription', name: 'Photo Library (Read/Write)' },
  { key: 'NSPhotoLibraryAddUsageDescription', name: 'Photo Library (Add Only)' },
  { key: 'NSLocationWhenInUseUsageDescription', name: 'Location (When In Use)' },
  { key: 'NSLocationAlwaysAndWhenInUseUsageDescription', name: 'Location (Always)' },
  { key: 'NSUserTrackingUsageDescription', name: 'App Tracking Transparency (ATT)' },
  { key: 'NSHealthShareUsageDescription', name: 'HealthKit (Read)' },
  { key: 'NSHealthUpdateUsageDescription', name: 'HealthKit (Write)' },
  { key: 'NSBluetoothAlwaysUsageDescription', name: 'Bluetooth (Always)' },
  { key: 'NSFaceIDUsageDescription', name: 'Face ID' },
  { key: 'NSCalendarsUsageDescription', name: 'Calendar' },
  { key: 'NSContactsUsageDescription', name: 'Contacts' }
];

export const KNOWN_FRAMEWORKS: { name: string; signature: string; category: string }[] = [
  { name: 'GoogleSignIn', signature: 'GoogleSignIn', category: 'ThirdPartyAuth' },
  { name: 'FacebookSDK', signature: 'FBSDKLoginKit', category: 'ThirdPartyAuth' },
  { name: 'RevenueCat', signature: 'RevenueCat', category: 'InAppPurchases' },
  { name: 'StoreKit', signature: 'StoreKit', category: 'InAppPurchases' },
  { name: 'Stripe', signature: 'Stripe', category: 'Payments' },
  { name: 'AppsFlyer', signature: 'AppsFlyerLib', category: 'Tracking' },
  { name: 'GoogleMobileAds', signature: 'GoogleMobileAds', category: 'Advertising' },
  { name: 'FirebaseAnalytics', signature: 'FirebaseAnalytics', category: 'Analytics' },
  { name: 'AuthenticationServices', signature: 'AuthenticationServices', category: 'AppleAuth' }
];

export const APP_STORE_SCREENSHOT_SIZES: { label: string; width: number; height: number }[] = [
  { label: '6.9" iPhone', width: 1320, height: 2868 },
  { label: '6.9" iPhone', width: 2868, height: 1320 },
  { label: '6.7" iPhone', width: 1290, height: 2796 },
  { label: '6.7" iPhone', width: 2796, height: 1290 },
  { label: '6.5" iPhone', width: 1284, height: 2778 },
  { label: '6.5" iPhone', width: 2778, height: 1284 },
  { label: '6.5" iPhone', width: 1242, height: 2688 },
  { label: '6.5" iPhone', width: 2688, height: 1242 },
  { label: '5.5" iPhone', width: 1242, height: 2208 },
  { label: '5.5" iPhone', width: 2208, height: 1242 },
  { label: '13" iPad', width: 2064, height: 2752 },
  { label: '13" iPad', width: 2752, height: 2064 },
  { label: '12.9" iPad', width: 2048, height: 2732 },
  { label: '12.9" iPad', width: 2732, height: 2048 }
];

export function isValidAppStoreScreenshotSize(width: number, height: number): boolean {
  return APP_STORE_SCREENSHOT_SIZES.some(size => size.width === width && size.height === height);
}

export interface SubmissionMaterials {
  name?: string;
  subtitle?: string;
  description?: string;
  keywords?: string;
  privacyPolicyUrl?: string;
  supportUrl?: string;
  category?: string;
  reviewerNotes?: string;
  screenshots?: NormalizedAppInspection['screenshots'];
}

export async function extractAppArtifact(
  file: File | Blob | ArrayBuffer,
  fileName: string,
  materials?: SubmissionMaterials
): Promise<NormalizedAppInspection> {
  const buffer = file instanceof ArrayBuffer ? file : await file.arrayBuffer();
  const lowerName = fileName.toLowerCase();

  if (lowerName.endsWith('.plist')) {
    const dict = parsePlistBytes(buffer);
    if (!isPlistDict(dict)) {
      throw new Error('Info.plist did not contain a dictionary of app keys.');
    }
    return buildInspection(dict, {}, [], fileName, materials);
  }

  const zip = new JSZip();
  let zipContent: JSZip;
  try {
    zipContent = await zip.loadAsync(buffer);
  } catch {
    throw new Error('The selected file is not a valid IPA or ZIP archive. Upload an IPA/ZIP or an Info.plist.');
  }

  const fileEntries = Object.keys(zipContent.files);
  const infoPlistPath = pickInfoPlistPath(fileEntries);
  if (!infoPlistPath) {
    throw new Error('No Info.plist was found inside the archive. Upload an IPA, an .app ZIP, or the Info.plist itself.');
  }

  const infoBytes = await zipContent.files[infoPlistPath].async('arraybuffer');
  const infoDict = parsePlistBytes(infoBytes);
  if (!isPlistDict(infoDict)) {
    throw new Error('Info.plist did not contain a dictionary of app keys.');
  }

  let privacyDict: { [key: string]: PlistValue } = {};
  const privacyPath = fileEntries.find(path => path.toLowerCase().endsWith('privacyinfo.xcprivacy'));
  if (privacyPath) {
    try {
      const privacyValue = parsePlistBytes(await zipContent.files[privacyPath].async('arraybuffer'));
      if (isPlistDict(privacyValue)) privacyDict = privacyValue;
    } catch {
      // Privacy manifest present but unreadable — evaluator will still see missing parsed fields
    }
  }

  const detectedFrameworkNames: string[] = [];
  for (const path of fileEntries) {
    for (const fw of KNOWN_FRAMEWORKS) {
      if (path.includes(`${fw.signature}.framework`) || path.includes(`/${fw.signature}`) || path.includes(fw.signature)) {
        if (!detectedFrameworkNames.includes(fw.name)) {
          detectedFrameworkNames.push(fw.name);
        }
      }
    }
  }

  return buildInspection(infoDict, privacyDict, detectedFrameworkNames, fileName, materials, !!privacyPath);
}

export function parseInspectionData(
  infoPlistXml: string,
  privacyManifestXml: string,
  frameworks: string[] = [],
  fallbackName = 'Application',
  materials?: SubmissionMaterials
): NormalizedAppInspection {
  const infoValue = parseXmlPlist(infoPlistXml);
  if (!isPlistDict(infoValue)) {
    throw new Error('Info.plist must be a dictionary.');
  }
  let privacyDict: { [key: string]: PlistValue } = {};
  if (privacyManifestXml.trim()) {
    try {
      const parsed = parseXmlPlist(privacyManifestXml);
      if (isPlistDict(parsed)) privacyDict = parsed;
    } catch {
      privacyDict = {};
    }
  }
  return buildInspection(infoValue, privacyDict, frameworks, fallbackName, materials, privacyManifestXml.trim().length > 0);
}

function pickInfoPlistPath(paths: string[]): string | undefined {
  const candidates = paths.filter(path => {
    const lower = path.toLowerCase();
    if (!lower.endsWith('info.plist')) return false;
    if (lower.includes('.watchkit') || lower.includes('/watch/')) return false;
    if (lower.includes('.appex/')) return false;
    if (lower.includes('pods/')) return false;
    return true;
  });
  const payloadApp = candidates.find(path => /payload\/[^/]+\.app\/info\.plist$/i.test(path));
  if (payloadApp) return payloadApp;
  const shallow = candidates.find(path => path.split('/').filter(Boolean).length <= 3);
  return shallow || candidates[0];
}

function buildInspection(
  info: { [key: string]: PlistValue },
  privacy: { [key: string]: PlistValue },
  frameworks: string[],
  fallbackName: string,
  materials?: SubmissionMaterials,
  privacyFileFound = false
): NormalizedAppInspection {
  const bundleId = plistString(info, 'CFBundleIdentifier');
  const appName =
    plistString(info, 'CFBundleDisplayName') ||
    plistString(info, 'CFBundleName') ||
    materials?.name ||
    fallbackName.replace(/\.[^/.]+$/, '');
  const version = plistString(info, 'CFBundleShortVersionString');
  const build = plistString(info, 'CFBundleVersion');
  const minOSVersion = plistString(info, 'MinimumOSVersion') || plistString(info, 'LSMinimumSystemVersion');

  if (!bundleId || !version || !build) {
    throw new Error('Info.plist must include CFBundleIdentifier, CFBundleShortVersionString, and CFBundleVersion.');
  }

  const permissions = PERMISSION_KEYS.map(p => {
    const hasKey = Object.prototype.hasOwnProperty.call(info, p.key);
    const val = plistString(info, p.key);
    return {
      key: p.key,
      description: val,
      detected: hasKey,
      status: hasKey ? ('DETECTED' as DetectionStatus) : ('NOT_DETECTED' as DetectionStatus)
    };
  });

  const backgroundModes = Array.isArray(info.UIBackgroundModes)
    ? info.UIBackgroundModes.map(item => String(item))
    : [];

  const ats = isPlistDict(info.NSAppTransportSecurity) ? info.NSAppTransportSecurity : {};
  const atsAllowsArbitrary = plistBool(ats, 'NSAllowsArbitraryLoads') === true;
  const encryptionDeclared = Object.prototype.hasOwnProperty.call(info, 'ITSAppUsesNonExemptEncryption');
  const encryptionValue = plistBool(info, 'ITSAppUsesNonExemptEncryption');

  const accessedApiTypes: string[] = [];
  const apiTypes = privacy.NSPrivacyAccessedAPITypes;
  if (Array.isArray(apiTypes)) {
    apiTypes.forEach(item => {
      if (isPlistDict(item) && typeof item.NSPrivacyAccessedAPIType === 'string') {
        accessedApiTypes.push(item.NSPrivacyAccessedAPIType);
      }
    });
  }

  const urlSchemes: string[] = [];
  const urlTypes = info.CFBundleURLTypes;
  if (Array.isArray(urlTypes)) {
    urlTypes.forEach(entry => {
      if (isPlistDict(entry) && Array.isArray(entry.CFBundleURLSchemes)) {
        entry.CFBundleURLSchemes.forEach(scheme => urlSchemes.push(String(scheme)));
      }
    });
  }

  const hasThirdPartyAuth =
    frameworks.includes('GoogleSignIn') ||
    frameworks.includes('FacebookSDK') ||
    urlSchemes.some(scheme => scheme.includes('googleusercontent') || scheme.startsWith('fb'));
  const hasSignInWithApple =
    frameworks.includes('AuthenticationServices') ||
    JSON.stringify(info).includes('com.apple.developer.applesignin');
  const hasInAppPurchases = frameworks.includes('StoreKit') || frameworks.includes('RevenueCat');
  const hasSubscriptions = frameworks.includes('RevenueCat');
  const hasAdvertising = frameworks.includes('GoogleMobileAds') || frameworks.includes('AppsFlyer');
  const hasExternalPayments = frameworks.includes('Stripe');

  const collectedDataTypes: string[] = [];
  const collected = privacy.NSPrivacyCollectedDataTypes;
  if (Array.isArray(collected)) {
    collected.forEach(item => {
      if (isPlistDict(item) && typeof item.NSPrivacyCollectedDataType === 'string') {
        collectedDataTypes.push(item.NSPrivacyCollectedDataType);
      }
    });
  }

  const hasBinaryData = !!(bundleId && (permissions.length > 0 || Object.keys(info).length > 0));
  const isPureListingOnly = !hasBinaryData;

  return {
    bundleId,
    appName: materials?.name || appName,
    version,
    build,
    minOSVersion,
    targetDevices: ['iPhone'],
    permissions,
    entitlements: hasSignInWithApple ? ['com.apple.developer.applesignin'] : [],
    urlSchemes,
    associatedDomains: [],
    frameworks,
    extensions: [],
    backgroundModes,
    privacyManifest: {
      hasPrivacyManifest: privacyFileFound || Object.keys(privacy).length > 0,
      trackingEnabled: plistBool(privacy, 'NSPrivacyTracking') === true,
      collectedDataTypes,
      accessedApiTypes
    },
    security: {
      atsAllowsArbitraryLoads: atsAllowsArbitrary,
      usesNonExemptEncryptionDeclared: encryptionDeclared,
      usesNonExemptEncryptionValue: encryptionValue
    },
    features: {
      hasInAppPurchases,
      hasSubscriptions,
      hasThirdPartyAuth,
      hasSignInWithApple,
      hasAccountDeletion: 'UNKNOWN',
      hasUserGeneratedContent: (materials?.category || '').toLowerCase().includes('social'),
      hasAdvertising,
      hasExternalPayments
    },
    metadata: {
      name: materials?.name || appName,
      subtitle: materials?.subtitle || '',
      description: materials?.description || '',
      keywords: materials?.keywords || '',
      supportUrl: materials?.supportUrl || '',
      privacyPolicyUrl: materials?.privacyPolicyUrl || '',
      category: materials?.category || '',
      ageRating: '',
      reviewerNotes: materials?.reviewerNotes || '',
      listingProvided: isPureListingOnly
    },
    screenshots: materials?.screenshots || [],
    rawInfo: {
      flattenedStrings: flattenPlistStrings(info)
    }
  };
}
