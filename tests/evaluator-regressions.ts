import assert from 'node:assert/strict';
import { parseInspectionData } from '../src/engine/extractor';
import { evaluateInspection } from '../src/engine/evaluator';
import { inferAuditTypeFromInspection } from '../src/services/store';
import type { NormalizedAppInspection, Finding } from '../src/types';

const basicPlist = `<?xml version="1.0" encoding="UTF-8"?>
<plist version="1.0">
<dict>
  <key>CFBundleIdentifier</key>
  <string>com.example.app</string>
  <key>CFBundleShortVersionString</key>
  <string>1.0.0</string>
  <key>CFBundleVersion</key>
  <string>1</string>
  <key>CFBundleDisplayName</key>
  <string>Example</string>
</dict>
</plist>`;

const inspection = parseInspectionData(basicPlist, '', ['StoreKit'], 'Example', {
  category: 'Utilities'
});

assert.equal(inspection.features.hasSubscriptions, false, 'StoreKit-only IAP should not imply subscriptions');
assert.equal(inspection.features.hasAccountDeletion, 'UNKNOWN', 'Account deletion should remain UNKNOWN when not confirmed');

const manualInspection: NormalizedAppInspection = {
  ...inspection,
  features: {
    ...inspection.features,
    hasThirdPartyAuth: 'UNKNOWN',
    hasSignInWithApple: 'UNKNOWN',
    hasAccountDeletion: 'UNKNOWN',
    hasSubscriptions: false,
    hasInAppPurchases: false
  }
};

const manualAudit = evaluateInspection(manualInspection, 'app-1', '1', '1.0.0', [], false, 'BINARY_SCAN');
assert.equal(manualAudit.readinessStatus, 'READY_WITH_WARNINGS', 'Manual-review-only findings should not be treated as no-risk');
assert.ok(manualAudit.findings.some(f => f.ruleId === 'RULE-ACC-01' && f.status === 'MANUAL_REVIEW'), 'Manual claims should keep a manual review status');

const existingWontFix: Finding = {
  id: 'f-1',
  auditId: 'a-1',
  ruleId: 'RULE-PRIV-01',
  category: 'PRIVACY',
  guidelineRef: { number: '5.1.2', title: 'Privacy Manifest', url: 'https://example.com' },
  title: 'Missing or Incomplete Privacy Manifest',
  severity: 'HIGH',
  whyItMatters: 'Privacy manifest required.',
  evidence: [],
  whatToVerify: 'Verify privacy manifest.',
  recommendedAction: 'Add it.',
  confidence: 1,
  status: 'WONT_FIX',
  notes: [],
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z'
};

const privacyIssueInspection = {
  ...manualInspection,
  privacyManifest: {
    ...manualInspection.privacyManifest,
    hasPrivacyManifest: false,
    trackingEnabled: false,
    collectedDataTypes: [],
    accessedApiTypes: []
  }
};

const wontFixAudit = evaluateInspection(privacyIssueInspection, 'app-2', '2', '1.0.0', [existingWontFix], false, 'BINARY_SCAN');
const matching = wontFixAudit.findings.find(f => f.ruleId === 'RULE-PRIV-01');
assert.ok(matching, 'Privacy rule should still appear on recheck');
assert.equal(matching?.status, 'WONT_FIX', 'WONT_FIX should survive a repeated trigger');

const binaryMissingAuditType = inferAuditTypeFromInspection({
  permissions: [{ key: 'NSCameraUsageDescription', description: '', detected: true, status: 'DETECTED' }],
  frameworks: ['StoreKit'],
  metadata: { listingProvided: false },
  rawInfo: {}
} as any);
assert.equal(binaryMissingAuditType, 'BINARY_SCAN', 'Permission-heavy binary inspection should infer binary scans');

const listingMissingAuditType = inferAuditTypeFromInspection({
  permissions: [],
  frameworks: [],
  metadata: { listingProvided: true },
  rawInfo: {}
} as any);
assert.equal(listingMissingAuditType, 'LISTING_SCAN', 'Listing-only metadata should infer listing scans');

const connectMissingAuditType = inferAuditTypeFromInspection({
  permissions: [],
  frameworks: [],
  metadata: { listingProvided: false },
  rawInfo: {
    inAppPurchases: [{ productId: 'prod_1' }],
    subscriptionGroups: [{ id: 'group_1' }]
  }
} as any);
assert.equal(connectMissingAuditType, 'CONNECT_SCAN', 'Connect-style rawInfo should infer Connect scans');

console.log('Regression checks passed');
