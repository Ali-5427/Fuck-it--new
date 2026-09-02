import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export function normalizePrivateKeyPem(rawPem: string): string {
  let cleaned = rawPem.trim();
  // Ensure correct standard newlines and PEM delimiters
  if (!cleaned.includes('-----BEGIN PRIVATE KEY-----') && !cleaned.includes('-----BEGIN EC PRIVATE KEY-----')) {
    cleaned = `-----BEGIN PRIVATE KEY-----\n${cleaned}\n-----END PRIVATE KEY-----`;
  }
  return cleaned;
}

export function generateAppStoreConnectJWT(
  issuerId: string,
  keyId: string,
  privateKeyPem: string
): string {
  const normalizedKey = normalizePrivateKeyPem(privateKeyPem);
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: issuerId.trim(),
    iat: now,
    exp: now + 1199, // 20 minutes max limit from Apple
    aud: 'appstoreconnect-v1'
  };

  return jwt.sign(payload, normalizedKey, {
    algorithm: 'ES256',
    header: {
      alg: 'ES256',
      kid: keyId.trim(),
      typ: 'JWT'
    }
  });
}

async function fetchWithTimeout(url: string, jwtToken: string, timeoutMs = 12000): Promise<any> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${jwtToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (response.status === 401) {
      throw new Error('Apple Authentication Failed (401): Invalid Key ID, Issuer ID, or revoked .p8 private key.');
    }

    if (response.status === 403) {
      throw new Error('Apple Authorization Failed (403): The API key lacks necessary permissions (Admin or App Manager required).');
    }

    if (response.status === 429) {
      throw new Error('Apple Rate Limit Exceeded (429): Too many requests to App Store Connect API. Please retry shortly.');
    }

    if (!response.ok) {
      let errorDetail = '';
      try {
        const errorJson = await response.json();
        if (errorJson.errors && errorJson.errors.length > 0) {
          errorDetail = errorJson.errors.map((e: any) => e.detail || e.title).join('; ');
        }
      } catch {
        errorDetail = await response.text().catch(() => '');
      }
      throw new Error(`Apple API Error (${response.status}): ${errorDetail || response.statusText}`);
    }

    return await response.json();
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Timeout connecting to Apple App Store Connect API. Please verify your connection.');
    }
    throw error;
  }
}

export async function testAppStoreConnectCredentials(issuerId: string, keyId: string, privateKeyPem: string): Promise<{ success: boolean; appCount: number }> {
  const token = generateAppStoreConnectJWT(issuerId, keyId, privateKeyPem);
  const data = await fetchWithTimeout('https://api.appstoreconnect.apple.com/v1/apps?limit=5', token);
  const appCount = (data.data || []).length;
  return { success: true, appCount };
}

export async function fetchAppsFromConnect(jwtToken: string): Promise<any[]> {
  const data = await fetchWithTimeout('https://api.appstoreconnect.apple.com/v1/apps?limit=100&include=appInfos,appStoreVersions', jwtToken);
  return data.data || [];
}

export interface AppDetailsFromConnect {
  app: any;
  appInfos: any[];
  inAppPurchases: any[];
  subscriptionGroups: any[];
  privacyPolicyUrl?: string;
  privacyChoicesUrl?: string;
  supportUrl?: string;
  marketingUrl?: string;
  description?: string;
  subtitle?: string;
  keywords?: string;
  promotionalText?: string;
  whatsNew?: string;
  ageRating?: string;
  version: string;
  buildNumber?: string;
  minOsVersion?: string;
  usesNonExemptEncryption?: boolean | 'UNKNOWN';
  screenshots: Array<{ url: string; width: number; height: number; deviceType: string }>;
}

export async function fetchAppDetails(jwtToken: string, appId: string): Promise<AppDetailsFromConnect> {
  const appResponse = await fetchWithTimeout(`https://api.appstoreconnect.apple.com/v1/apps/${appId}`, jwtToken);
  const app = appResponse.data;

  let appInfos: any[] = [];
  let inAppPurchases: any[] = [];
  let subscriptionGroups: any[] = [];
  let privacyPolicyUrl: string | undefined;
  let privacyChoicesUrl: string | undefined;
  let supportUrl: string | undefined;
  let marketingUrl: string | undefined;
  let description: string | undefined;
  let subtitle: string | undefined;
  let keywords: string | undefined;
  let promotionalText: string | undefined;
  let whatsNew: string | undefined;
  let ageRating: string | undefined;
  let version = '1.0.0';
  let buildNumber = '1';
  let minOsVersion: string | undefined;
  let usesNonExemptEncryption: boolean | 'UNKNOWN' = 'UNKNOWN';
  const screenshots: Array<{ url: string; width: number; height: number; deviceType: string }> = [];

  try {
    const [versionRes, infoRes, buildsRes, iapRes, subscriptionRes] = await Promise.allSettled([
      fetchWithTimeout(`https://api.appstoreconnect.apple.com/v1/apps/${appId}/appStoreVersions?limit=5&include=appStoreVersionLocalizations`, jwtToken),
      fetchWithTimeout(`https://api.appstoreconnect.apple.com/v1/apps/${appId}/appInfos?include=appInfoLocalizations,ageRatingDeclaration`, jwtToken),
      fetchWithTimeout(`https://api.appstoreconnect.apple.com/v1/builds?filter[app]=${appId}&limit=1&sort=-uploadedDate`, jwtToken),
      fetchWithTimeout(`https://api.appstoreconnect.apple.com/v1/apps/${appId}/inAppPurchasesV2?limit=50`, jwtToken),
      fetchWithTimeout(`https://api.appstoreconnect.apple.com/v1/apps/${appId}/subscriptionGroups?limit=50`, jwtToken)
    ]);

    if (versionRes.status === 'fulfilled' && versionRes.value?.data && versionRes.value.data.length > 0) {
      const primaryVersion = versionRes.value.data[0];
      version = primaryVersion.attributes?.versionString || '1.0.0';
      const includedLocs = versionRes.value.included?.filter((inc: any) => inc.type === 'appStoreVersionLocalizations') || [];
      let primaryLocId: string | undefined;
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
            if (item.type === 'appScreenshots' && item.attributes?.imageAsset) {
              const asset = item.attributes.imageAsset;
              screenshots.push({
                url: asset.templateUrl || '',
                width: asset.width || 0,
                height: asset.height || 0,
                deviceType: item.attributes.screenshotDisplayType || 'IPHONE'
              });
            }
          }
        }
      }
    }

    if (infoRes.status === 'fulfilled') {
      appInfos = infoRes.value.data || [];
      if (appInfos.length > 0) {
        const attributes = appInfos[0].attributes || {};
        const declarationFromIncluded = infoRes.value.included?.find((inc: any) => inc.type === 'ageRatingDeclarations' || inc.type === 'ageRatingDeclaration');
        ageRating = declarationFromIncluded?.attributes?.rating || attributes.ageRatingDeclaration?.rating;

        const includedInfoLocs = infoRes.value.included?.filter((inc: any) => inc.type === 'appInfoLocalizations') || [];
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

    if (buildsRes.status === 'fulfilled' && buildsRes.value?.data && buildsRes.value.data.length > 0) {
      const latestBuild = buildsRes.value.data[0];
      buildNumber = latestBuild.attributes?.version || '1';
      minOsVersion = latestBuild.attributes?.minOsVersion;
      if (typeof latestBuild.attributes?.usesNonExemptEncryption === 'boolean') {
        usesNonExemptEncryption = latestBuild.attributes.usesNonExemptEncryption;
      }
    }

    if (iapRes.status === 'fulfilled') {
      inAppPurchases = iapRes.value?.data || [];
    }

    if (subscriptionRes.status === 'fulfilled') {
      subscriptionGroups = subscriptionRes.value?.data || [];
    }
  } catch (err) {
    console.warn('[Connect] Error fetching App Store Connect details in parallel:', err);
  }

  return {
    app,
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

export function encryptKey(text: string, secret: string): string {
  const key = crypto.createHash('sha256').update(secret).digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

export function decryptKey(encryptedText: string, secret: string): string {
  const parts = encryptedText.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted key format');
  }
  
  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];
  
  const key = crypto.createHash('sha256').update(secret).digest();
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

