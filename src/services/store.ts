import { 
  User, 
  Application, 
  AuditRun, 
  NormalizedAppInspection, 
  Finding, 
  FindingStatus, 
  FixNote, 
  SubmissionReport,
  AuditComparison,
  RuleCategory,
  AuditScanType
} from '../types';
import { evaluateInspection, compareAudits, computeReadiness } from '../engine/evaluator';
import { apiClient } from './api';
import { insforge } from './insforge';

export function inferAuditTypeFromInspection(inspection?: Partial<NormalizedAppInspection> | null): AuditScanType {
  if (!inspection) return 'BINARY_SCAN';

  const rawInfo = inspection.rawInfo && typeof inspection.rawInfo === 'object' ? inspection.rawInfo as Record<string, any> : {};
  const hasPermissionKeys = Array.isArray(inspection.permissions)
    ? inspection.permissions.some(item => item.detected)
    : false;
  const hasFrameworks = Array.isArray(inspection.frameworks) && inspection.frameworks.length > 0;

  if (hasPermissionKeys || hasFrameworks) {
    return 'BINARY_SCAN';
  }

  if (rawInfo.appleAppId || rawInfo.app?.id) {
    return 'CONNECT_SCAN';
  }

  if (inspection.metadata?.listingProvided) {
    return 'LISTING_SCAN';
  }

  const hasConnectSignals = !!(
    rawInfo.inAppPurchases ||
    rawInfo.subscriptionGroups ||
    (Array.isArray(rawInfo.inAppPurchases) && rawInfo.inAppPurchases.length > 0) ||
    (Array.isArray(rawInfo.subscriptionGroups) && rawInfo.subscriptionGroups.length > 0)
  );

  if (hasConnectSignals) {
    return 'CONNECT_SCAN';
  }

  return 'BINARY_SCAN';
}

const STORAGE_KEYS = {
  USER: 'fixit_user',
  APPS: 'fixit_apps',
  AUDITS: 'fixit_audits',
  INSPECTIONS: 'fixit_inspections',
  SELECTED_APP: 'fixit_selected_app_id'
};

class AppStore {
  private user: User | null = null;
  private apps: Application[] = [];
  private auditsMap: Record<string, AuditRun[]> = {}; // appId -> AuditRun[]
  private inspectionsMap: Record<string, NormalizedAppInspection> = {}; // appId -> NormalizedAppInspection
  private selectedAppId: string | null = null;
  private activeAuditId: string | null = null;
  private listeners: Set<() => void> = new Set();
  private isSyncing = false;
  private lastPersistError: string | null = null;

  constructor() {
    this.init();
  }

  private init() {
    try {
      const savedUser = localStorage.getItem(STORAGE_KEYS.USER);
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (parsed?.id?.startsWith('user_') || parsed?.name === 'Indie Solo Creator' || parsed?.name === 'Lead iOS Engineer') {
          this.user = null;
          localStorage.removeItem(STORAGE_KEYS.USER);
        } else {
          this.user = parsed;
        }
      } else {
        this.user = null;
      }

      const savedApps = localStorage.getItem(STORAGE_KEYS.APPS);
      this.apps = savedApps ? JSON.parse(savedApps) : [];
      this.apps = this.apps.map(app => ({
        ...app,
        lastAuditStatus: this.migrateReadiness(app.lastAuditStatus)
      }));

      const savedAudits = localStorage.getItem(STORAGE_KEYS.AUDITS);
      this.auditsMap = savedAudits ? this.migrateAudits(JSON.parse(savedAudits)) : {};

      const savedInspections = localStorage.getItem(STORAGE_KEYS.INSPECTIONS);
      this.inspectionsMap = savedInspections ? JSON.parse(savedInspections) : {};

      const savedSelected = localStorage.getItem(STORAGE_KEYS.SELECTED_APP);
      this.selectedAppId = savedSelected || (this.apps.length > 0 ? this.apps[0].id : null);

      if (this.user) {
        this.syncFromDatabase();
      }
    } catch (e) {
      console.error('Error loading store state:', e);
      this.user = null;
      this.apps = [];
      this.auditsMap = {};
      this.inspectionsMap = {};
      this.selectedAppId = null;
    }
  }

  public async syncFromDatabase() {
    if (!this.user || this.isSyncing) return;
    this.isSyncing = true;

    try {
      // 1. Fetch apps from InsForge
      const { data: dbApps, error: appsError } = await insforge.database
        .from('apps')
        .select('*')
        .eq('user_id', this.user.id);

      if (appsError) throw appsError;

      if (dbApps) {
        this.apps = dbApps.map((row: any) => {
          const inspectionValue = typeof row.inspection === 'string' ? JSON.parse(row.inspection || '{}') : row.inspection || {};

          if (inspectionValue && Object.keys(inspectionValue).length > 0) {
            this.inspectionsMap[row.id] = inspectionValue;
          }

          return {
            id: row.id,
            userId: row.user_id,
            name: row.name,
            bundleId: row.bundle_id,
            primaryCategory: row.primary_category,
            currentVersion: row.current_version || '',
            currentBuild: row.current_build || '',
            appleAppId: row.apple_app_id || undefined,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            remainingIssuesCount: row.remaining_issues_count || 0,
            lastAuditDate: row.updated_at,
            lastAuditStatus: row.last_audit_status || 'READY_WITH_WARNINGS'
          };
        });
      }

      // 2. Fetch audits from InsForge
      if (this.apps.length > 0) {
        const appIds = this.apps.map(a => a.id);
        const { data: dbAudits, error: auditsError } = await insforge.database
          .from('audits')
          .select('*')
          .in('app_id', appIds);

        if (auditsError) throw auditsError;

        if (dbAudits) {
          const newAuditsMap: Record<string, AuditRun[]> = {};
          dbAudits.forEach((row: any) => {
            const inspectionValue = typeof row.inspection === 'string' ? JSON.parse(row.inspection || '{}') : row.inspection || {};
            const audit: AuditRun = {
              id: row.id,
              appId: row.app_id,
              auditType: (row.audit_type as AuditScanType) || inferAuditTypeFromInspection(inspectionValue),
              buildNumber: row.build_number,
              appVersion: row.app_version,
              createdAt: row.created_at,
              readinessStatus: row.readiness_status as any,
              ruleVersion: row.rule_version,
              summary: row.summary || '',
              totalFindings: row.total_findings || 0,
              openFindings: row.open_findings || 0,
              resolvedFindings: row.resolved_findings || 0,
              highRiskCount: row.high_risk_count || 0,
              mediumRiskCount: row.medium_risk_count || 0,
              lowRiskCount: row.low_risk_count || 0,
              manualCheckCount: row.manual_check_count || 0,
              findings: typeof row.findings === 'string' ? JSON.parse(row.findings) : row.findings || [],
              passedChecks: typeof row.passed_checks === 'string' ? JSON.parse(row.passed_checks) : row.passed_checks || [],
              reviewerNotesDraft: row.reviewer_notes_draft || '',
              isAiEnhanced: row.is_ai_enhanced || false
            };

            if (inspectionValue && Object.keys(inspectionValue).length > 0 && audit.appId) {
              this.inspectionsMap[audit.appId] = inspectionValue;
            }

            if (!newAuditsMap[audit.appId]) {
              newAuditsMap[audit.appId] = [];
            }
            newAuditsMap[audit.appId].push(audit);
          });

          // Sort audits by createdAt
          Object.keys(newAuditsMap).forEach(appId => {
            newAuditsMap[appId].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          });

          this.auditsMap = newAuditsMap;
        }
      } else {
        this.auditsMap = {};
      }

      if (this.apps.length > 0 && (!this.selectedAppId || !this.apps.find(a => a.id === this.selectedAppId))) {
        this.selectedAppId = this.apps[0].id;
      }

      this.persist();
    } catch (err) {
      console.warn('InsForge DB sync warning:', err);
    } finally {
      this.isSyncing = false;
    }
  }

  private migrateAudits(raw: Record<string, AuditRun[]>): Record<string, AuditRun[]> {
    const statusMap: Record<string, AuditRun['readinessStatus']> = {
      HIGH_RISK: 'NOT_READY',
      READY: 'NO_HIGH_RISK_ISSUES_DETECTED',
      MANUAL_REVIEW_REQUIRED: 'READY_WITH_WARNINGS',
      READY_WITH_WARNINGS: 'READY_WITH_WARNINGS',
      NOT_READY: 'NOT_READY',
      NO_HIGH_RISK_ISSUES_DETECTED: 'NO_HIGH_RISK_ISSUES_DETECTED'
    };
    const migrated: Record<string, AuditRun[]> = {};
    Object.entries(raw || {}).forEach(([appId, audits]) => {
      migrated[appId] = (audits || []).map(audit => ({
        ...audit,
        readinessStatus: statusMap[String(audit.readinessStatus)] || computeReadiness(audit.findings || []),
        passedChecks: audit.passedChecks || [],
        manualCheckCount: audit.manualCheckCount ?? audit.infoCount ?? 0,
        findings: (audit.findings || []).map(finding => ({
          ...finding,
          severity: (finding.severity as string) === 'INFO' ? 'MANUAL_CHECK' : finding.severity
        }))
      }));
    });
    return migrated;
  }

  private migrateReadiness(status?: AuditRun['readinessStatus'] | string): AuditRun['readinessStatus'] | undefined {
    if (!status) return undefined;
    const statusMap: Record<string, AuditRun['readinessStatus']> = {
      HIGH_RISK: 'NOT_READY',
      READY: 'NO_HIGH_RISK_ISSUES_DETECTED',
      MANUAL_REVIEW_REQUIRED: 'READY_WITH_WARNINGS',
      READY_WITH_WARNINGS: 'READY_WITH_WARNINGS',
      NOT_READY: 'NOT_READY',
      NO_HIGH_RISK_ISSUES_DETECTED: 'NO_HIGH_RISK_ISSUES_DETECTED'
    };
    return statusMap[String(status)] || 'READY_WITH_WARNINGS';
  }

  private persist() {
    try {
      if (this.user) {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(this.user));
      } else {
        localStorage.removeItem(STORAGE_KEYS.USER);
      }

      if (this.apps.length > 0) {
        localStorage.setItem(STORAGE_KEYS.APPS, JSON.stringify(this.apps));
      } else {
        localStorage.removeItem(STORAGE_KEYS.APPS);
      }

      if (Object.keys(this.auditsMap).length > 0) {
        localStorage.setItem(STORAGE_KEYS.AUDITS, JSON.stringify(this.auditsMap));
      } else {
        localStorage.removeItem(STORAGE_KEYS.AUDITS);
      }

      if (Object.keys(this.inspectionsMap).length > 0) {
        localStorage.setItem(STORAGE_KEYS.INSPECTIONS, JSON.stringify(this.inspectionsMap));
      } else {
        localStorage.removeItem(STORAGE_KEYS.INSPECTIONS);
      }

      if (this.selectedAppId) {
        localStorage.setItem(STORAGE_KEYS.SELECTED_APP, this.selectedAppId);
      } else {
        localStorage.removeItem(STORAGE_KEYS.SELECTED_APP);
      }
    } catch (e) {
      console.warn('Storage persistence warning:', e);
    }
    this.notify();
  }

  public subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  // Getters
  public getUser(): User | null {
    return this.user;
  }

  public getApps(): Application[] {
    return this.apps;
  }

  public getSelectedApp(): Application | null {
    return this.apps.find(a => a.id === this.selectedAppId) || (this.apps[0] || null);
  }

  public getSelectedAppId(): string | null {
    return this.selectedAppId;
  }

  public getAudits(appId: string): AuditRun[] {
    return this.auditsMap[appId] || [];
  }

  public getLatestAudit(appId: string): AuditRun | null {
    const list = this.getAudits(appId);
    return list.length > 0 ? list[list.length - 1] : null;
  }

  public getAuditById(auditId: string): AuditRun | null {
    for (const list of Object.values(this.auditsMap)) {
      const found = list.find(a => a.id === auditId);
      if (found) return found;
    }
    return null;
  }

  public getActiveAudit(): AuditRun | null {
    if (this.activeAuditId) {
      const found = this.getAuditById(this.activeAuditId);
      if (found) return found;
    }
    const selected = this.getSelectedApp();
    return selected ? this.getLatestAudit(selected.id) : null;
  }

  public getInspection(appId: string): NormalizedAppInspection | null {
    return this.inspectionsMap[appId] || null;
  }

  // Actions
  public setUser(user: User | null) {
    const prevUser = this.user;
    this.user = user;
    if (!user) {
      // On sign-out, drop user AND that user's cached workspace
      this.apps = [];
      this.auditsMap = {};
      this.inspectionsMap = {};
      this.selectedAppId = null;
      this.activeAuditId = null;
    }
    this.persist();
    if (user && (!prevUser || prevUser.id !== user.id)) {
      this.syncFromDatabase();
    }
  }

  public logout() {
    this.user = null;
    this.apps = [];
    this.auditsMap = {};
    this.inspectionsMap = {};
    this.selectedAppId = null;
    this.activeAuditId = null;
    this.persist();
  }

  public updateUser(updates: Partial<User>) {
    if (!this.user) return;
    this.user = {
      ...this.user,
      ...updates,
      settings: {
        ...(this.user.settings || {}),
        ...(updates.settings || {})
      }
    };
    this.persist();
  }

  public updateUserTier(tier: 'free' | 'pro' | 'studio') {
    if (!this.user) return;
    this.user = {
      ...this.user,
      tier
    };
    this.persist();
  }

  public updateUserSettings(settings: Partial<NonNullable<User['settings']>>) {
    if (!this.user) return;
    this.user = {
      ...this.user,
      settings: {
        ...(this.user.settings || {}),
        ...settings
      }
    };
    this.persist();
  }

  public selectApp(appId: string) {
    this.selectedAppId = appId;
    const latest = this.getLatestAudit(appId);
    this.activeAuditId = latest ? latest.id : null;
    this.persist();
  }

  public setActiveAudit(auditId: string) {
    this.activeAuditId = auditId;
    this.notify();
  }

  public async createApp(data: {
    name: string;
    bundleId: string;
    primaryCategory: string;
    currentVersion?: string;
    currentBuild?: string;
    inspection?: NormalizedAppInspection;
    auditType?: AuditScanType;
    appleAppId?: string;
    auditRun?: AuditRun;
  }): Promise<Application> {
    if (!data.inspection) {
      throw new Error('An extracted inspection is required to create an app.');
    }

    const inspection = data.inspection;
    const resolvedAuditType: AuditScanType = data.auditType || inferAuditTypeFromInspection(inspection);

    const existing = this.apps.find(app => app.bundleId === data.bundleId);
    if (existing) {
      await this.runNewAudit(
        existing.id,
        data.currentBuild || existing.currentBuild,
        data.currentVersion || existing.currentVersion,
        inspection,
        resolvedAuditType
      );
      return existing;
    }

    const id = `app_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const newApp: Application = {
      id,
      userId: this.user?.id || '',
      name: data.name,
      bundleId: data.bundleId,
      primaryCategory: data.primaryCategory || 'Utilities',
      currentVersion: data.currentVersion || '',
      currentBuild: data.currentBuild || '',
      appleAppId: data.appleAppId || data.inspection?.rawInfo?.app?.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      remainingIssuesCount: 0
    };

    this.apps.unshift(newApp);
    this.inspectionsMap[id] = inspection;

    const initialAudit = data.auditRun
      ? { ...data.auditRun, appId: id, auditType: resolvedAuditType }
      : evaluateInspection(
          inspection,
          id,
          newApp.currentBuild,
          newApp.currentVersion,
          [],
          resolvedAuditType === 'LISTING_SCAN' || resolvedAuditType === 'CONNECT_SCAN',
          resolvedAuditType
        );

    try {
      if (data.auditRun) {
        this.auditsMap[id] = [initialAudit];
      }
      const aiResult = await apiClient.enhanceAuditWithAI(inspection, initialAudit.findings);
      if (aiResult?.aiEnhanced === true && aiResult.enhancedFindings) {
        initialAudit.findings = aiResult.enhancedFindings;
        initialAudit.summary = aiResult.executiveSummary || initialAudit.summary;
        initialAudit.reviewerNotesDraft = aiResult.reviewerNotes || initialAudit.reviewerNotesDraft;
        initialAudit.isAiEnhanced = true;
      }
    } catch (error) {
      console.warn('AI enhancement unavailable for first upload:', error);
    }

    this.auditsMap[id] = [initialAudit];
    newApp.lastAuditDate = initialAudit.createdAt;
    newApp.lastAuditStatus = initialAudit.readinessStatus;
    newApp.remainingIssuesCount = initialAudit.openFindings;

    this.selectedAppId = id;
    this.activeAuditId = initialAudit.id;
    this.persist();

    if (this.user) {
      try {
        await insforge.database.from('apps').upsert({
          id: newApp.id,
          user_id: this.user.id,
          name: newApp.name,
          bundle_id: newApp.bundleId,
          primary_category: newApp.primaryCategory,
          current_version: newApp.currentVersion,
          current_build: newApp.currentBuild,
          remaining_issues_count: newApp.remainingIssuesCount,
          last_audit_status: newApp.lastAuditStatus,
          apple_app_id: newApp.appleAppId || null,
          inspection: inspection
        }, { onConflict: 'id' });

        await insforge.database.from('audits').upsert({
          id: initialAudit.id,
          app_id: newApp.id,
          build_number: initialAudit.buildNumber,
          app_version: initialAudit.appVersion,
          readiness_status: initialAudit.readinessStatus,
          rule_version: initialAudit.ruleVersion,
          summary: initialAudit.summary,
          total_findings: initialAudit.totalFindings,
          open_findings: initialAudit.openFindings,
          resolved_findings: initialAudit.resolvedFindings,
          high_risk_count: initialAudit.highRiskCount,
          medium_risk_count: initialAudit.mediumRiskCount,
          low_risk_count: initialAudit.lowRiskCount,
          manual_check_count: initialAudit.manualCheckCount,
          findings: initialAudit.findings,
          passed_checks: initialAudit.passedChecks,
          reviewer_notes_draft: initialAudit.reviewerNotesDraft,
          is_ai_enhanced: initialAudit.isAiEnhanced,
          audit_type: initialAudit.auditType,
          inspection: inspection
        }, { onConflict: 'id' });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Could not save the first upload audit to InsForge.';
        this.lastPersistError = message;
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('fixit:toast', { detail: { title: 'Save failed', message } }));
        }
        throw new Error(message);
      }
    }

    return newApp;
  }

  public deleteApp(appId: string) {
    this.apps = this.apps.filter(a => a.id !== appId);
    delete this.auditsMap[appId];
    delete this.inspectionsMap[appId];

    if (this.selectedAppId === appId) {
      this.selectedAppId = this.apps.length > 0 ? this.apps[0].id : null;
      const latest = this.selectedAppId ? this.getLatestAudit(this.selectedAppId) : null;
      this.activeAuditId = latest ? latest.id : null;
    }
    this.persist();

    if (this.user) {
      insforge.database.from('audits').delete().eq('app_id', appId).then(({ error }) => {
        if (error) console.error('Error deleting audits from InsForge:', error);
      });
      insforge.database.from('apps').delete().eq('id', appId).then(({ error }) => {
        if (error) console.error('Error deleting app from InsForge:', error);
      });
    }
  }

  public updateFindingStatus(
    appId: string,
    auditId: string,
    findingId: string,
    status: FindingStatus,
    noteText?: string,
    buildNumber?: string
  ) {
    const auditList = this.auditsMap[appId];
    if (!auditList) return;

    const audit = auditList.find(a => a.id === auditId);
    if (!audit) return;

    const finding = audit.findings.find(f => f.id === findingId);
    if (!finding) return;

    const prevStatus = finding.status;
    finding.status = status;
    finding.updatedAt = new Date().toISOString();
    if (status === 'FIXED') {
      finding.fixedInBuild = buildNumber || audit.buildNumber;
    }

    if (noteText && noteText.trim()) {
      const note: FixNote = {
        id: `note_${Date.now()}`,
        author: this.user?.name || 'Developer',
        createdAt: new Date().toISOString(),
        text: noteText,
        statusChange: status !== prevStatus ? status : undefined,
        buildNumber
      };
      finding.notes.unshift(note);
    }

    // Re-evaluate open / resolved counts and readiness
    let high = 0;
    let med = 0;
    let low = 0;
    let info = 0;
    let open = 0;
    let resolved = 0;

    audit.findings.forEach(f => {
      if (f.status === 'OPEN' || f.status === 'IN_PROGRESS') {
        open++;
        if (f.severity === 'HIGH') high++;
        if (f.severity === 'MEDIUM') med++;
        if (f.severity === 'LOW') low++;
        if (f.severity === 'MANUAL_CHECK') info++;
      } else if (f.status === 'FIXED') {
        resolved++;
      }
    });

    audit.openFindings = open;
    audit.resolvedFindings = resolved;
    audit.highRiskCount = high;
    audit.mediumRiskCount = med;
    audit.lowRiskCount = low;
    audit.infoCount = info;

    audit.readinessStatus = computeReadiness(audit.findings);

    // Update parent app card
    const app = this.apps.find(a => a.id === appId);
    if (app) {
      app.lastAuditStatus = audit.readinessStatus;
      app.remainingIssuesCount = open;
      app.updatedAt = new Date().toISOString();
    }

    this.persist();

    // Update in InsForge Database
    if (this.user) {
      insforge.database.from('audits').update({
        readiness_status: audit.readinessStatus,
        open_findings: audit.openFindings,
        resolved_findings: audit.resolvedFindings,
        high_risk_count: audit.highRiskCount,
        medium_risk_count: audit.mediumRiskCount,
        low_risk_count: audit.lowRiskCount,
        manual_check_count: audit.manualCheckCount,
        findings: audit.findings
      }).eq('id', audit.id).then(({ error }) => {
        if (error) console.error('Error updating audit findings in InsForge:', error);
      });

      insforge.database.from('apps').update({
        remaining_issues_count: audit.openFindings,
        last_audit_status: audit.readinessStatus
      }).eq('id', appId).then(({ error }) => {
        if (error) console.error('Error updating app stats in InsForge:', error);
      });
    }
  }

  public addFindingNote(
    appId: string,
    auditId: string,
    findingId: string,
    noteText: string
  ) {
    const audit = this.getAuditById(auditId);
    if (!audit) return;
    const finding = audit.findings.find(f => f.id === findingId);
    if (!finding) return;

    const note: FixNote = {
      id: `note_${Date.now()}`,
      author: this.user?.name || 'Developer',
      createdAt: new Date().toISOString(),
      text: noteText
    };
    finding.notes.unshift(note);
    this.persist();

    // Update audit in InsForge Database
    if (this.user) {
      insforge.database.from('audits').update({
        findings: audit.findings
      }).eq('id', audit.id).then(({ error }) => {
        if (error) console.error('Error updating audit notes in InsForge:', error);
      });
    }
  }

  public async runNewAudit(
    appId: string,
    newBuildNumber?: string,
    newVersion?: string,
    updatedInspection?: NormalizedAppInspection,
    forcedAuditType?: AuditScanType
  ): Promise<{ audit: AuditRun; comparison?: AuditComparison }> {
    const app = this.apps.find(a => a.id === appId);
    if (!app) throw new Error('App not found');

    const previousAudit = this.getLatestAudit(appId);

    const version = newVersion || updatedInspection?.version || app.currentVersion || '1.0.0';
    const build = newBuildNumber || updatedInspection?.build || app.currentBuild || '1';

    let inspection = updatedInspection || this.inspectionsMap[appId];
    if (!inspection) {
      throw new Error('Re-upload the build — inspection data isn\'t on this device');
    }
    if (updatedInspection) {
      this.inspectionsMap[appId] = updatedInspection;
    }

    const existingFindings = previousAudit ? previousAudit.findings : [];
    const resolvedAuditType: AuditScanType = forcedAuditType || previousAudit?.auditType || inferAuditTypeFromInspection(inspection);

    const newAudit = evaluateInspection(
      inspection,
      appId,
      build,
      version,
      existingFindings,
      resolvedAuditType === 'LISTING_SCAN' || resolvedAuditType === 'CONNECT_SCAN',
      resolvedAuditType
    );

    try {
      const aiResult = await apiClient.enhanceAuditWithAI(inspection, newAudit.findings);
      if (aiResult?.aiEnhanced === true && aiResult.enhancedFindings) {
        newAudit.findings = aiResult.enhancedFindings;
        newAudit.summary = aiResult.executiveSummary || newAudit.summary;
        newAudit.reviewerNotesDraft = aiResult.reviewerNotes || newAudit.reviewerNotesDraft;
        newAudit.isAiEnhanced = true;
      }
    } catch (e) {
      console.warn('AI enhancement fallback used:', e);
    }

    if (!this.auditsMap[appId]) {
      this.auditsMap[appId] = [];
    }
    this.auditsMap[appId].push(newAudit);

    app.currentBuild = build;
    app.currentVersion = version;
    app.lastAuditDate = newAudit.createdAt;
    app.lastAuditStatus = newAudit.readinessStatus;
    app.remainingIssuesCount = newAudit.openFindings;
    app.updatedAt = new Date().toISOString();

    this.activeAuditId = newAudit.id;
    this.persist();

    if (this.user) {
      try {
        await insforge.database.from('apps').update({
          current_build: build,
          current_version: version,
          remaining_issues_count: newAudit.openFindings,
          last_audit_status: newAudit.readinessStatus,
          apple_app_id: app.appleAppId || null,
          inspection: inspection
        }).eq('id', appId);

        await insforge.database.from('audits').upsert({
          id: newAudit.id,
          app_id: appId,
          build_number: newAudit.buildNumber,
          app_version: newAudit.appVersion,
          readiness_status: newAudit.readinessStatus,
          rule_version: newAudit.ruleVersion,
          summary: newAudit.summary,
          total_findings: newAudit.totalFindings,
          open_findings: newAudit.openFindings,
          resolved_findings: newAudit.resolvedFindings,
          high_risk_count: newAudit.highRiskCount,
          medium_risk_count: newAudit.mediumRiskCount,
          low_risk_count: newAudit.lowRiskCount,
          manual_check_count: newAudit.manualCheckCount,
          findings: newAudit.findings,
          passed_checks: newAudit.passedChecks,
          reviewer_notes_draft: newAudit.reviewerNotesDraft,
          is_ai_enhanced: newAudit.isAiEnhanced,
          audit_type: newAudit.auditType,
          inspection: inspection
        }, { onConflict: 'id' });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Could not save the recheck audit to InsForge.';
        this.lastPersistError = message;
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('fixit:toast', { detail: { title: 'Save failed', message } }));
        }
        throw new Error(message);
      }
    }

    let comparison: AuditComparison | undefined;
    if (previousAudit) {
      comparison = compareAudits(previousAudit, newAudit);
    }

    return { audit: newAudit, comparison };
  }

  public generateSubmissionReport(appId: string, auditId?: string): SubmissionReport {
    const app = this.apps.find(a => a.id === appId);
    if (!app) throw new Error('App not found');

    const audit = auditId ? this.getAuditById(auditId) : this.getLatestAudit(appId);
    if (!audit) throw new Error('Audit not found');

    const inspection = this.inspectionsMap[appId];

    // Group categories
    const categoryMap = new Map<RuleCategory, { open: number; resolved: number }>();
    audit.findings.forEach(f => {
      const current = categoryMap.get(f.category) || { open: 0, resolved: 0 };
      if (f.status === 'FIXED') current.resolved++;
      else current.open++;
      categoryMap.set(f.category, current);
    });

    const categorySummaries = Array.from(categoryMap.entries()).map(([cat, stats]) => ({
      category: cat,
      status: stats.open === 0 ? ('PASS' as const) : stats.open > 0 && stats.open <= 2 ? ('WARNING' as const) : ('FAIL' as const),
      openCount: stats.open,
      resolvedCount: stats.resolved
    }));

    const resolvedIssues = audit.findings
      .filter(f => f.status === 'FIXED')
      .map(f => ({
        title: f.title,
        guidelineRef: f.guidelineRef,
        fixedInBuild: f.fixedInBuild || audit.buildNumber
      }));

    const remainingWarnings = audit.findings
      .filter(f => f.status !== 'FIXED')
      .map(f => ({
        title: f.title,
        severity: f.severity,
        guidelineRef: f.guidelineRef,
        recommendedAction: f.recommendedAction
      }));

    const manualChecklist = [
      { id: 'chk_demo_creds', item: 'Active demo account login & password entered into App Store Connect Review Notes', category: 'Review Access', checked: false },
      { id: 'chk_privacy_url', item: 'Privacy Policy URL in App Store Connect points to live HTTPS page matching in-app link', category: 'Privacy', checked: !!inspection?.metadata.privacyPolicyUrl },
      { id: 'chk_iap_configured', item: 'All In-App Purchase products submitted for review in App Store Connect with screenshots', category: 'In-App Purchase', checked: inspection?.features.hasInAppPurchases === true },
      { id: 'chk_restore_btn', item: 'Tested "Restore Purchases" button in TestFlight sandbox environment', category: 'In-App Purchase', checked: false },
      { id: 'chk_screenshots_69', item: 'Uploaded required 6.9" and 6.5" iPhone screenshots showing actual app in use', category: 'Screenshots', checked: (inspection?.screenshots.length || 0) > 0 },
      { id: 'chk_privacy_nutrition', item: 'Completed App Privacy Nutrition Label questions in App Store Connect matching Privacy Manifest', category: 'Privacy', checked: false },
      { id: 'chk_ipv6', item: 'Verified app connects smoothly on IPv6-only networks without hardcoded IPv4 addresses', category: 'Network', checked: false }
    ];

    return {
      id: `report_${Date.now()}`,
      appId,
      auditId: audit.id,
      generatedAt: new Date().toISOString(),
      appName: app.name,
      bundleId: app.bundleId,
      version: audit.appVersion,
      build: audit.buildNumber,
      readinessStatus: audit.readinessStatus,
      summary: audit.summary,
      guidelineVersion: '2026.2',
      categorySummaries,
      resolvedIssues,
      remainingWarnings,
      manualChecklist,
      reviewerNotesDraft: audit.reviewerNotesDraft || `Test credentials and submission notes for ${app.name}`,
      disclaimer: 'This readiness assessment is generated by Fixit static inspection and guideline correlation. While based on public Apple App Store Review Guidelines, it does not represent an official determination by Apple Inc. and cannot guarantee App Review approval.'
    };
  }

  public clearData() {
    if (this.user) {
      const appIds = this.apps.map(a => a.id);
      if (appIds.length > 0) {
        insforge.database.from('findings').delete().in('app_id', appIds).then(({ error }) => {
          if (error) console.error('Error clearing findings from InsForge:', error);
        });
        insforge.database.from('audits').delete().in('app_id', appIds).then(({ error }) => {
          if (error) console.error('Error clearing audits from InsForge:', error);
        });
        insforge.database.from('uploads').delete().in('app_id', appIds).then(({ error }) => {
          if (error) console.error('Error clearing uploads from InsForge:', error);
        });
        insforge.database.from('reports').delete().in('app_id', appIds).then(({ error }) => {
          if (error) console.error('Error clearing reports from InsForge:', error);
        });
      }
      insforge.database.from('apps').delete().eq('user_id', this.user.id).then(({ error }) => {
        if (error) console.error('Error clearing apps from InsForge:', error);
      });
    }

    this.apps = [];
    this.auditsMap = {};
    this.inspectionsMap = {};
    this.selectedAppId = null;
    this.activeAuditId = null;
    this.persist();
  }
}

export const store = new AppStore();
