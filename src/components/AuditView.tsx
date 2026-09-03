import React, { useState } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  FileCheck, 
  Upload, 
  ExternalLink, 
  Filter, 
  Search, 
  Code2, 
  ChevronRight, 
  History, 
  Sparkles,
  GitCompare,
  ArrowRight,
  HelpCircle,
  Clock
} from 'lucide-react';
import { Application, AuditRun, Finding, FindingStatus, RuleCategory } from '../types';
import { inferAuditTypeFromInspection, store } from '../services/store';
import { compareAudits, evaluateInspection } from '../engine/evaluator';
import { extractFromItunesLookup } from '../engine/itunesExtractor';
import { apiClient } from '../services/api';

interface AuditViewProps {
  app: Application | null;
  audit: AuditRun | null;
  auditsHistory: AuditRun[];
  onSelectFinding: (finding: Finding) => void;
  onOpenUpload: (appId?: string) => void;
  onGenerateReport: () => void;
  onOpenDiff: (comparison: any) => void;
  isTryNow?: boolean;
  onOpenAuth?: (mode?: 'login' | 'register') => void;
  onTryNowRecheck?: (query: string) => Promise<void>;
  tryNowLookupQuery?: string;
}

export const AuditView: React.FC<AuditViewProps> = ({
  app,
  audit,
  auditsHistory,
  onSelectFinding,
  onOpenUpload,
  onGenerateReport,
  onOpenDiff,
  isTryNow = false,
  onOpenAuth,
  onTryNowRecheck,
  tryNowLookupQuery
}) => {
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isRechecking, setIsRechecking] = useState(false);
  const [recheckError, setRecheckError] = useState<string | null>(null);

  if (!app || !audit) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 text-center space-y-4 bg-white">
        <ShieldAlert className="h-12 w-12 text-slate-400 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">No Application Selected</h2>
        <p className="text-xs text-slate-600">Select an application from your dashboard or upload a new build to run the preflight audit engine.</p>
        <button
          onClick={() => onOpenUpload()}
          className="rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-2.5 text-xs font-bold text-white font-mono transition-colors cursor-pointer shadow-sm"
        >
          Upload iOS Build
        </button>
      </div>
    );
  }

  const handleReRunAudit = async () => {
    if (!app || !audit) return;

    const cachedInspection = store.getInspection(app.id) || undefined;
    const inferredAuditType = audit.auditType || inferAuditTypeFromInspection({
      ...cachedInspection,
      rawInfo: {
        ...(cachedInspection?.rawInfo || {}),
        ...(app.appleAppId ? { appleAppId: app.appleAppId } : {})
      }
    });

    if (inferredAuditType === 'BINARY_SCAN') {
      onOpenUpload(app.id);
      return;
    }

    setIsRechecking(true);
    setRecheckError(null);

    try {
      if (isTryNow) {
        if (!onTryNowRecheck || !tryNowLookupQuery) {
          throw new Error('Try Now recheck is unavailable.');
        }
        await onTryNowRecheck(tryNowLookupQuery);
        return;
      }

      if (inferredAuditType === 'LISTING_SCAN') {
        const inspection = cachedInspection;
        const trackId = inspection?.rawInfo?.trackId;
        const lookupValue = trackId ? String(trackId) : app.bundleId || app.name;
        const liveInspection = await extractFromItunesLookup(lookupValue);
        if (!liveInspection) {
          throw new Error('The live App Store lookup failed. Please try again in a moment.');
        }

        const { comparison } = await store.runNewAudit(
          app.id,
          liveInspection.build || app.currentBuild,
          liveInspection.version || app.currentVersion,
          liveInspection,
          'LISTING_SCAN'
        );
        if (comparison) {
          onOpenDiff(comparison);
        }
        return;
      }

      if (inferredAuditType === 'CONNECT_SCAN') {
        const appleAppId = app.appleAppId || (app as any).appleAppId;
        if (appleAppId) {
          const { inspection: liveInspection } = await apiClient.checkConnectApp(appleAppId);
          const { comparison } = await store.runNewAudit(
            app.id,
            liveInspection.build || app.currentBuild,
            liveInspection.version || app.currentVersion,
            liveInspection,
            'CONNECT_SCAN'
          );
          if (comparison) {
            onOpenDiff(comparison);
          }
        } else {
          throw new Error('This Connect app is missing its App Store Connect app ID. Reconnect the app and try again.');
        }
      }
    } catch (e: any) {
      console.error('Error re-running audit:', e);
      setRecheckError(e.message || 'The live recheck failed.');
    } finally {
      setIsRechecking(false);
    }
  };

  const filteredFindings = audit.findings.filter(f => {
    const matchesCat = categoryFilter === 'ALL'
      || f.category === categoryFilter;
    const matchesSev = severityFilter === 'ALL' || f.severity === severityFilter;
    const matchesStat = statusFilter === 'ALL' || 
      (statusFilter === 'OPEN' && (f.status === 'OPEN' || f.status === 'IN_PROGRESS')) ||
      (statusFilter === 'FIXED' && f.status === 'FIXED') ||
      (statusFilter === 'MANUAL_REVIEW' && f.status === 'MANUAL_REVIEW');

    const matchesSearch = f.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.ruleId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.guidelineRef.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.whyItMatters.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesCat && matchesSev && matchesStat && matchesSearch;
  });

  const categories = [
    'ALL',
    'PRIVACY',
    'PERMISSIONS',
    'ACCOUNT_REQUIREMENTS',
    'PAYMENTS_IAP',
    'SUBSCRIPTIONS',
    'UGC',
    'METADATA',
    'SCREENSHOTS',
    'APP_COMPLETENESS',
    'BACKGROUND_MODES',
    'SECURITY_ENCRYPTION'
  ];

  return (
    <div className="w-full h-full bg-white flex flex-col overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6 min-h-[calc(100vh-140px)]">
      
      {isTryNow && (
        <div className="rounded-3xl bg-blue-50 border border-blue-200 p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs sm:text-sm font-semibold text-blue-900">
                Showing what we can check from public App Store data — connect your developer account for the full check
              </p>
              <p className="text-[11px] text-blue-700 mt-0.5">
                Listing analysis checks metadata, descriptions, category rules, and screenshot compliance. Binary scan requires file upload.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
            <button
              onClick={() => onOpenAuth?.('register')}
              className="flex-1 md:flex-initial rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 text-xs font-mono transition-all shadow-xs cursor-pointer text-center"
            >
              Connect Account
            </button>
            <button
              onClick={onOpenUpload}
              className="flex-1 md:flex-initial rounded-xl bg-white hover:bg-slate-50 text-blue-700 border border-blue-300 font-bold px-4 py-2 text-xs font-mono transition-all cursor-pointer text-center"
            >
              Upload .IPA
            </button>
          </div>
        </div>
      )}

      {!isTryNow && audit.auditType === 'LISTING_SCAN' && (
        <div className="rounded-2xl bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-200 p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-600 shrink-0 mt-0.5">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-sky-700 font-mono">Storefront Listing Scan</span>
                <span className="text-[10px] bg-sky-100 text-sky-800 font-semibold px-2 py-0.5 rounded-md">Public Metadata Only</span>
              </div>
              <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                We verified App Store metadata, descriptions, age ratings, and screenshots. Deep binary checks (Privacy Manifests, Required Reason APIs, ATS encryption, account deletion code) require your compiled build.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenUpload}
            className="flex items-center gap-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold px-4 py-2 text-xs font-mono transition-all shadow-sm shrink-0 cursor-pointer"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Upload .IPA for Full Binary Scan</span>
          </button>
        </div>
      )}

      {/* Top Banner Card */}
      {recheckError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
          {recheckError}
        </div>
      )}

      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 md:p-8 space-y-6">
        
        {/* App Title & Action Toolbar */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono border ${
                audit.readinessStatus === 'NO_HIGH_RISK_ISSUES_DETECTED'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : audit.readinessStatus === 'READY_WITH_WARNINGS'
                  ? 'border-amber-200 bg-amber-50 text-amber-700'
                  : 'border-red-200 bg-red-50 text-red-700'
              }`}>
                READINESS: {audit.readinessStatus.replace(/_/g, ' ')}
              </span>

              {audit.auditType === 'CONNECT_SCAN' ? (
                <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                  App Store Connect Sync
                </span>
              ) : isTryNow || audit.auditType === 'LISTING_SCAN' ? (
                <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200 font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
                  Storefront Listing Scan
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                  Full Binary & Manifest Scan
                </span>
              )}

              {/* Build History Selector */}
              {!isTryNow && auditsHistory.length > 1 ? (
                <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs">
                  <History className="h-3.5 w-3.5 text-slate-500" />
                  <select
                    value={audit.id}
                    onChange={(e) => store.setActiveAudit(e.target.value)}
                    className="bg-transparent font-mono text-xs text-slate-700 font-semibold focus:outline-none cursor-pointer"
                  >
                    {auditsHistory.map((a, idx) => (
                      <option key={a.id} value={a.id}>
                        Build {a.buildNumber} (v{a.appVersion}) {idx === auditsHistory.length - 1 ? '— Latest' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <span className="text-xs text-slate-500 font-mono">v{audit.appVersion} (Build {audit.buildNumber})</span>
              )}

              <span className="text-slate-400 text-xs">•</span>
              <span className="text-xs text-blue-600 font-mono font-medium">{app.bundleId}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1.5 font-display">{app.name}</h1>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {!isTryNow && auditsHistory.length > 1 && (
              <button
                id="btn_compare_builds"
                onClick={() => {
                  const idx = auditsHistory.findIndex(a => a.id === audit.id);
                  const prev = idx > 0 ? auditsHistory[idx - 1] : auditsHistory[0];
                  if (prev && prev.id !== audit.id) {
                    const comp = compareAudits(prev, audit);
                    onOpenDiff(comp);
                  }
                }}
                className="flex items-center gap-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 px-3.5 py-2 text-xs font-bold text-slate-700 border border-slate-300 transition-colors font-mono cursor-pointer shadow-xs"
              >
                <GitCompare className="h-3.5 w-3.5 text-blue-600" />
                <span>Compare Builds</span>
              </button>
            )}

            <button
              id="btn_rerun_audit"
              onClick={handleReRunAudit}
              disabled={isRechecking}
              className="flex items-center gap-1.5 rounded-xl bg-white hover:bg-slate-100 px-3.5 py-2 text-xs font-bold text-slate-700 border border-slate-300 transition-colors font-mono disabled:opacity-50 cursor-pointer shadow-sm"
            >
              {audit.auditType === 'BINARY_SCAN' ? (
                <>
                  <Upload className="h-3.5 w-3.5 text-blue-600" />
                  <span>Upload New Build to Recheck</span>
                </>
              ) : (
                <>
                  <RefreshCw className={`h-3.5 w-3.5 ${isRechecking ? 'animate-spin text-blue-600' : 'text-slate-600'}`} />
                  <span>{isRechecking ? 'Re-fetching & Auditing...' : isTryNow ? 'Refresh Check' : 'Re-fetch & Audit'}</span>
                </>
              )}
            </button>

            {!isTryNow && (
              <button
                id="btn_submission_report"
                onClick={onGenerateReport}
                className="flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition-all font-mono cursor-pointer"
              >
                <FileCheck className="h-4 w-4" />
                <span>Submission Report</span>
              </button>
            )}
          </div>
        </div>

        {/* Executive Summary & Progress Bar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-blue-600" />
              <span>Compliance Risk Assessment</span>
            </h3>
            <p className="text-sm text-slate-700 leading-relaxed">
              {audit.summary}
            </p>
          </div>

          {/* Progress Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-500">Remediation Progress:</span>
              <span className="text-emerald-600 font-bold">
                {audit.resolvedFindings} / {audit.totalFindings} Fixed
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${audit.totalFindings > 0 ? (audit.resolvedFindings / audit.totalFindings) * 100 : 100}%` }}
              ></div>
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
              <span className="text-red-600 font-semibold">{audit.highRiskCount} High Risk</span>
              <span className="text-amber-600 font-semibold">{audit.mediumRiskCount} Warnings</span>
              <span className="text-emerald-600 font-semibold">{audit.resolvedFindings} Resolved</span>
            </div>
          </div>
        </div>

      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-3">
        
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                categoryFilter === cat
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        {/* Secondary Filters & Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search findings..."
              className="w-full rounded-xl border border-slate-300 bg-white pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-blue-500 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Severities</option>
              <option value="HIGH">🔴 High Risk</option>
              <option value="MEDIUM">🟡 Medium Risk</option>
              <option value="LOW">🔵 Low Risk</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-blue-500 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">🔴 Open / In Progress</option>
              <option value="FIXED">🟢 Fixed</option>
              <option value="MANUAL_REVIEW">🟣 Manual Review</option>
            </select>
          </div>
        </div>

      </div>

      {/* Findings List */}
      <div className="space-y-3">
        {filteredFindings.length > 0 ? (
          filteredFindings.map(finding => (
            <div
              key={finding.id}
              onClick={() => onSelectFinding(finding)}
              className={`group cursor-pointer rounded-2xl border p-5 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                finding.status === 'FIXED'
                  ? 'border-slate-200 bg-slate-50 opacity-75 hover:opacity-100 hover:border-emerald-400'
                  : finding.severity === 'HIGH'
                  ? 'border-red-200 bg-red-50/40 hover:border-red-400 hover:shadow-sm'
                  : finding.severity === 'MEDIUM'
                  ? 'border-amber-200 bg-amber-50/40 hover:border-amber-400 hover:shadow-sm'
                  : 'border-slate-200 bg-white hover:border-blue-400 hover:shadow-sm'
              }`}
            >
              <div className="space-y-1.5 max-w-3xl">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${
                    finding.severity === 'HIGH' ? 'border-red-200 bg-red-100 text-red-700' :
                    finding.severity === 'MEDIUM' ? 'border-amber-200 bg-amber-100 text-amber-700' :
                    'border-blue-200 bg-blue-100 text-blue-700'
                  }`}>
                    {finding.severity}
                  </span>
                  <span className="font-mono text-xs text-blue-600 font-semibold">{finding.ruleId}</span>
                  <span className="text-slate-400 text-xs">•</span>
                  <span className="font-mono text-xs text-slate-500">{finding.guidelineRef.number}</span>
                  <span className="text-slate-400 text-xs">•</span>
                  <span className="text-xs text-slate-500">{finding.category.replace(/_/g, ' ')}</span>
                </div>

                <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  {finding.title}
                </h3>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {finding.whyItMatters}
                </p>

                {finding.fixedInBuild && (
                  <div className="text-[11px] font-mono text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Resolved in build {finding.fixedInBuild}</span>
                  </div>
                )}
              </div>

              {/* Status & View Button */}
              <div className="flex items-center gap-3 shrink-0">
                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono border ${
                  finding.status === 'FIXED' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' :
                  finding.status === 'IN_PROGRESS' ? 'border-blue-200 bg-blue-50 text-blue-700' :
                  finding.status === 'MANUAL_REVIEW' ? 'border-indigo-200 bg-indigo-50 text-indigo-700' :
                  'border-red-200 bg-red-50 text-red-700'
                }`}>
                  {finding.status}
                </span>

                <div className="flex items-center gap-1 text-xs font-bold text-blue-600 group-hover:translate-x-1 transition-transform">
                  <span>View Fix</span>
                  <ChevronRight className="h-4 w-4" />
                </div>
              </div>

            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-12 text-center text-xs text-slate-500 font-mono">
            No findings match your current filters.
          </div>
        )}
      </div>

    </div>
    </div>
  );
};
