import { extractAppArtifact } from '../engine/extractor';
import { store } from '../services/store';
import { Application, AuditRun, AuditComparison, NormalizedAppInspection } from '../types';

export class BundleMismatchError extends Error {
  code: 'BUNDLE_MISMATCH' = 'BUNDLE_MISMATCH';
  expected: string;
  actual: string;
  inspection: NormalizedAppInspection;
  constructor(expected: string, actual: string, inspection: NormalizedAppInspection) {
    super(`This build's bundle ID (${actual}) doesn't match ${expected}.`);
    this.expected = expected;
    this.actual = actual;
    this.inspection = inspection;
  }
}

const ALLOWED_EXTENSIONS = ['.ipa', '.zip', '.plist'];

export interface RunBinaryCheckOptions {
  file: File;
  targetApp?: Application | null;
  customName?: string;
  /** Set true once the user has confirmed they want to create a new app despite a bundle mismatch. */
  forceNewApp?: boolean;
}

export interface RunBinaryCheckResult {
  app: Application;
  audit: AuditRun;
  comparison?: AuditComparison;
}

/**
 * Runs the IPA / build check: extracts a NormalizedAppInspection entirely in
 * the browser (the binary itself is never uploaded), then saves through the
 * existing store so it persists to localStorage + InsForge (apps + audits).
 */
export async function runBinaryCheck(opts: RunBinaryCheckOptions): Promise<RunBinaryCheckResult> {
  const { file, targetApp, customName, forceNewApp } = opts;

  const lowerName = file.name.toLowerCase();
  if (!ALLOWED_EXTENSIONS.some(ext => lowerName.endsWith(ext))) {
    throw new Error("This file isn't a valid IPA/zip. Upload an .ipa, .zip, or Info.plist.");
  }

  let inspection: NormalizedAppInspection;
  try {
    inspection = await extractAppArtifact(file, file.name);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Couldn't read that file.";
    throw new Error(message || "No iOS app bundle found inside this file.");
  }

  if (!inspection.bundleId && !inspection.appName) {
    throw new Error('No iOS app bundle or Info.plist found in this file.');
  }

  if (targetApp && !forceNewApp) {
    if (targetApp.bundleId && inspection.bundleId && targetApp.bundleId !== inspection.bundleId) {
      throw new BundleMismatchError(targetApp.bundleId, inspection.bundleId, inspection);
    }

    const result = await store.runNewAudit(
      targetApp.id,
      inspection.build,
      inspection.version,
      inspection,
      'BINARY_SCAN'
    );

    const app = store.getApps().find(a => a.id === targetApp.id) || targetApp;
    return { app, audit: result.audit, comparison: result.comparison };
  }

  const app = await store.createApp({
    name: customName || inspection.appName || file.name,
    bundleId: inspection.bundleId || `unknown.bundle.${Date.now()}`,
    primaryCategory: 'Unknown',
    currentVersion: inspection.version,
    currentBuild: inspection.build,
    inspection,
    auditType: 'BINARY_SCAN'
  });

  const audit = store.getLatestAudit(app.id);
  if (!audit) {
    throw new Error("Couldn't save the check. Try again.");
  }

  return { app, audit };
}
