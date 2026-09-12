import { store, inferAuditTypeFromInspection } from '../services/store';
import { Application, AuditComparison, AuditRun, AppMetadataDraft, NormalizedAppInspection } from '../types';

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || `app-${Date.now()}`;
}

/**
 * A minimal, valid NormalizedAppInspection for a listing-only check where no
 * IPA has been analyzed yet. Every required field is present so downstream
 * code (evaluator, store) doesn't have to special-case "no binary data".
 */
export function listingStubFromForm(form: {
  name?: string;
  bundleId?: string;
  version?: string;
  build?: string;
}): NormalizedAppInspection {
  return {
    bundleId: form.bundleId || `listing.manual.${slugify(form.name || 'app')}`,
    appName: form.name || '—',
    version: form.version || '—',
    build: form.build || '—',
    minOSVersion: 'UNKNOWN',
    targetDevices: [],
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
    metadata: { listingProvided: true },
    screenshots: []
  };
}

/** True when the inspection carries real binary-scan signal (not just a listing stub). */
export function hasBinaryData(inspection?: NormalizedAppInspection | null): boolean {
  if (!inspection) return false;
  return (
    (inspection.frameworks && inspection.frameworks.length > 0) ||
    (inspection.permissions && inspection.permissions.some(p => p.detected)) ||
    !!(inspection.rawInfo && Object.keys(inspection.rawInfo).length > 0)
  );
}

export interface SaveMetadataOptions {
  appId?: string | null;
  form: AppMetadataDraft;
  appName?: string;
  bundleId?: string;
}

export interface SaveListingResult {
  app: Application;
  audit: AuditRun;
  comparison?: AuditComparison;
}

/**
 * Save & check for the Metadata tab. Merges the form onto whatever
 * inspection already exists (so IPA-derived fields survive) and re-runs
 * through the real evaluator + store.
 */
export async function saveMetadataCheck(opts: SaveMetadataOptions): Promise<SaveListingResult> {
  const { appId, form } = opts;
  const prev = appId ? store.getInspection(appId) : null;

  const base: NormalizedAppInspection =
    prev ||
    listingStubFromForm({
      name: opts.appName || form.name,
      bundleId: opts.bundleId
    });

  const inspection: NormalizedAppInspection = {
    ...base,
    appName: base.appName && base.appName !== '—' ? base.appName : (opts.appName || form.name || base.appName),
    metadata: {
      ...base.metadata,
      name: form.name,
      subtitle: form.subtitle,
      description: form.description,
      keywords: form.keywords,
      // NormalizedAppInspection.metadata has no promotionalText field and
      // no rule reads it — keep it in the form only, don't merge it in.
      supportUrl: form.supportUrl,
      privacyPolicyUrl: form.privacyPolicyUrl,
      category: form.category,
      ageRating: form.ageRating,
      listingProvided: true
    },
    screenshots: base.screenshots || []
  };

  const auditType = hasBinaryData(base) ? 'BINARY_SCAN' : 'LISTING_SCAN';

  if (appId) {
    const result = await store.runNewAudit(
      appId,
      inspection.build || base.build,
      inspection.version || base.version,
      inspection,
      auditType
    );
    const app = store.getApps().find(a => a.id === appId);
    if (!app) throw new Error("Couldn't save the check. Try again.");
    return { app, audit: result.audit, comparison: result.comparison };
  }

  const app = await store.createApp({
    name: opts.appName || form.name || 'Untitled app',
    bundleId: opts.bundleId || inspection.bundleId,
    primaryCategory: form.category || 'Unknown',
    currentVersion: inspection.version,
    currentBuild: inspection.build,
    inspection,
    auditType: 'LISTING_SCAN'
  });
  const audit = store.getLatestAudit(app.id);
  if (!audit) throw new Error("Couldn't save the check. Try again.");
  return { app, audit };
}

export interface SaveScreenshotsOptions {
  appId?: string | null;
  appName?: string;
  bundleId?: string;
  screenshots: NormalizedAppInspection['screenshots'];
}

/**
 * Save & check for the Screenshots tab. Merges screenshots onto the
 * existing inspection so binary/metadata fields are not dropped.
 */
export async function saveScreenshotsCheck(opts: SaveScreenshotsOptions): Promise<SaveListingResult> {
  const { appId, screenshots } = opts;
  const prev = appId ? store.getInspection(appId) : null;

  const base: NormalizedAppInspection =
    prev ||
    listingStubFromForm({
      name: opts.appName,
      bundleId: opts.bundleId
    });

  const inspection: NormalizedAppInspection = {
    ...base,
    screenshots
  };

  const auditType = hasBinaryData(base)
    ? 'BINARY_SCAN'
    : inferAuditTypeFromInspection(inspection) === 'BINARY_SCAN'
    ? 'LISTING_SCAN'
    : inferAuditTypeFromInspection(inspection);

  if (appId) {
    const result = await store.runNewAudit(
      appId,
      inspection.build || base.build,
      inspection.version || base.version,
      inspection,
      auditType
    );
    const app = store.getApps().find(a => a.id === appId);
    if (!app) throw new Error("Couldn't save the check. Try again.");
    return { app, audit: result.audit, comparison: result.comparison };
  }

  const app = await store.createApp({
    name: opts.appName || 'Untitled app',
    bundleId: opts.bundleId || inspection.bundleId,
    primaryCategory: 'Unknown',
    currentVersion: inspection.version,
    currentBuild: inspection.build,
    inspection,
    auditType: 'LISTING_SCAN'
  });
  const audit = store.getLatestAudit(app.id);
  if (!audit) throw new Error("Couldn't save the check. Try again.");
  return { app, audit };
}
