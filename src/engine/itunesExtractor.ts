import { NormalizedAppInspection } from '../types';

/**
 * Note: This data source only supports listing-level checks, not binary-level checks.
 * Entitlements, permissions, and other local code checks are marked as UNKNOWN.
 */
export async function extractFromItunesLookup(appNameOrId: string): Promise<NormalizedAppInspection | null> {
  try {
    const value = (appNameOrId || '').trim();
    let url = '';

    if (/^\d+$/.test(value)) {
      url = `https://itunes.apple.com/lookup?id=${value}`;
    } else if (/^id\d+$/i.test(value)) {
      url = `https://itunes.apple.com/lookup?id=${value.replace(/^id/i, '')}`;
    } else if (value.includes('.')) {
      url = `https://itunes.apple.com/lookup?bundleId=${encodeURIComponent(value)}`;
    } else {
      url = `https://itunes.apple.com/search?term=${encodeURIComponent(value)}&entity=software&limit=1`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    let response;
    try {
      response = await fetch(url, { signal: controller.signal });
    } catch (fetchErr: any) {
      if (fetchErr.name === 'AbortError') {
        throw new Error('TIMEOUT');
      }
      throw new Error('NETWORK_ERROR');
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

    const app = data.results[0];

    const screenshots: NormalizedAppInspection['screenshots'] = [];
    if (app.screenshotUrls && Array.isArray(app.screenshotUrls)) {
      app.screenshotUrls.forEach((sUrl: string, index: number) => {
        screenshots.push({
          id: `screenshot_iphone_${index}`,
          name: `iPhone Screenshot ${index + 1}`,
          width: 0,
          height: 0,
          format: 'png',
          deviceTarget: 'iPhone',
          aspectRatio: '9:19.5',
          precision: 'UNKNOWN'
        });
      });
    }

    if (app.ipadScreenshotUrls && Array.isArray(app.ipadScreenshotUrls)) {
      app.ipadScreenshotUrls.forEach((sUrl: string, index: number) => {
        screenshots.push({
          id: `screenshot_ipad_${index}`,
          name: `iPad Screenshot ${index + 1}`,
          width: 0,
          height: 0,
          format: 'png',
          deviceTarget: 'iPad',
          aspectRatio: '3:4',
          precision: 'UNKNOWN'
        });
      });
    }

    const inspection: NormalizedAppInspection = {
      bundleId: app.bundleId || 'UNKNOWN',
      appName: app.trackName || value,
      version: app.version || 'UNKNOWN',
      build: '1',
      minOSVersion: app.minimumOsVersion || 'UNKNOWN',
      targetDevices: app.supportedDevices || ['iPhone', 'iPad'],
      permissions: [],
      entitlements: [],
      urlSchemes: [],
      associatedDomains: [],
      frameworks: [],
      extensions: [],
      backgroundModes: [],
      privacyManifest: {
        hasPrivacyManifest: 'UNKNOWN',
        trackingEnabled: 'UNKNOWN',
        collectedDataTypes: [],
        accessedApiTypes: []
      },
      security: {
        atsAllowsArbitraryLoads: 'UNKNOWN',
        usesNonExemptEncryptionDeclared: 'UNKNOWN'
      },
      features: {
        hasInAppPurchases: 'UNKNOWN',
        hasSubscriptions: 'UNKNOWN',
        hasThirdPartyAuth: 'UNKNOWN',
        hasSignInWithApple: 'UNKNOWN',
        hasAccountDeletion: 'UNKNOWN',
        hasUserGeneratedContent: 'UNKNOWN',
        hasAdvertising: 'UNKNOWN'
      },
      metadata: {
        name: app.trackName,
        subtitle: undefined,
        description: app.description,
        supportUrl: app.sellerUrl,
        privacyPolicyUrl: undefined,
        category: app.primaryGenreName,
        ageRating: app.contentAdvisoryRating,
        listingProvided: true
      },
      screenshots,
      rawInfo: {
        ...app,
        trackId: app.trackId,
        bundleId: app.bundleId || value
      }
    };

    return inspection;
  } catch (error: any) {
    console.error('iTunes Extractor Error:', error);
    if (error.message === 'TIMEOUT' || error.message === 'NETWORK_ERROR') {
      throw error;
    }
    return null;
  }
}
