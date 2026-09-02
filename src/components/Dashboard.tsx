import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Smartphone, 
  Clock, 
  RotateCw, 
  ShieldCheck,
  ChevronRight,
  MessageSquareWarning,
  Layers,
  ArrowRight,
  Search
} from 'lucide-react';
import { Application, User, AuditRun } from '../types';
import { calculateReadinessScore } from '../engine/evaluator';
import { store } from '../services/store';
import { TryItNowSearch } from './TryItNowSearch';

interface DashboardProps {
  user: User | null;
  apps: Application[];
  onOpenApp: (appId: string) => void;
  onCheckNewApp: () => void;
  onCheckNewVersion: (appId: string) => void;
  onNavigate: (view: 'landing' | 'dashboard' | 'audit' | 'rejection' | 'metadata' | 'screenshots' | 'admin' | 'privacy') => void;
  onTryNow?: (query: string) => void;
  tryNowError?: string | null;
  isTryNowLoading?: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({
  user,
  apps,
  onOpenApp,
  onCheckNewApp,
  onCheckNewVersion,
  onNavigate,
  onTryNow,
  tryNowError = null,
  isTryNowLoading = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Format relative or standard date
  const formatCheckDate = (isoString?: string) => {
    if (!isoString) return 'Not checked yet';
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);

      if (diffHours < 1) return 'Just now';
      if (diffHours < 24) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return 'Recently';
    }
  };

  // Calculations for stats and recent audits via useMemo
  const {
    totalApps,
    totalAudits,
    totalHighRisk,
    totalFixed,
    recentAudits,
    averageReadiness
  } = useMemo(() => {
    const totalApps = apps.length;
    let totalAudits = 0;
    let totalHighRisk = 0;
    let totalFixed = 0;
    let totalScoreSum = 0;
    let appsWithAuditsCount = 0;

    const allAudits: { app: Application; audit: AuditRun }[] = [];
    apps.forEach(app => {
      const audits = store.getAudits(app.id);
      totalAudits += audits.length;
      audits.forEach(audit => {
        allAudits.push({ app, audit });
      });
      
      const latestAudit = store.getLatestAudit(app.id);
      if (latestAudit) {
        const score = calculateReadinessScore(latestAudit);
        totalScoreSum += score;
        appsWithAuditsCount++;
        
        const openFindings = latestAudit.findings.filter(f => f.status !== 'FIXED');
        totalHighRisk += openFindings.filter(f => f.severity === 'HIGH').length;
        totalFixed += latestAudit.findings.filter(f => f.status === 'FIXED').length;
      }
    });

    allAudits.sort((a, b) => new Date(b.audit.createdAt).getTime() - new Date(a.audit.createdAt).getTime());
    const recentAudits = allAudits.slice(0, 5);
    const averageReadiness = appsWithAuditsCount > 0 ? Math.round(totalScoreSum / appsWithAuditsCount) : 100;

    return {
      totalApps,
      totalAudits,
      totalHighRisk,
      totalFixed,
      recentAudits,
      averageReadiness
    };
  }, [apps]);

  // Filtered Apps list via useMemo
  const filteredApps = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return apps.filter(app => 
      app.name.toLowerCase().includes(query) ||
      app.bundleId.toLowerCase().includes(query)
    );
  }, [apps, searchQuery]);

  return (
    <div className="w-full h-full bg-slate-50/50 flex flex-col p-6 overflow-hidden">
      <div className="max-w-6xl w-full mx-auto flex-1 flex flex-col overflow-hidden min-h-0 space-y-4">
        
        {/* Welcome & Primary Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/85 pb-4 shrink-0">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 font-mono">
                My Apps
              </h1>
              {user && (
                <span className="text-[11px] text-slate-500 font-normal">
                  — Welcome back, <strong className="font-semibold text-slate-750">{user.name || user.email.split('@')[0]}</strong>
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="dashboard_check_new_app_btn"
              onClick={onCheckNewApp}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 text-xs font-bold transition-all shadow-sm shadow-blue-600/20 active:scale-[0.98] cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Check a new app</span>
            </button>
          </div>
        </div>

        {/* Metrics Overview Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-3xs flex flex-col justify-between">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Apps Audited</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl font-black text-slate-900 font-mono">{totalApps}</span>
              <span className="text-[10px] text-slate-500">({totalAudits} audits)</span>
            </div>
          </div>
          
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-3xs flex flex-col justify-between">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Average Health</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className={`text-xl font-black font-mono ${
                averageReadiness >= 90 ? 'text-emerald-600' : averageReadiness >= 70 ? 'text-amber-600' : 'text-red-600'
              }`}>{averageReadiness}%</span>
              <span className="text-[10px] text-slate-500">readiness</span>
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-3xs flex flex-col justify-between">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Critical Flags</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className={`text-xl font-black font-mono ${totalHighRisk > 0 ? 'text-red-600' : 'text-slate-900'}`}>{totalHighRisk}</span>
              <span className="text-[10px] text-slate-500">require action</span>
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-3xs flex flex-col justify-between">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Resolved Issues</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl font-black text-emerald-600 font-mono">{totalFixed}</span>
              <span className="text-[10px] text-slate-500 font-mono">fixed</span>
            </div>
          </div>
        </div>

        {/* Developer Toolbox Quick-Start */}
        <div className="space-y-2 shrink-0">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Developer Toolbox</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => onNavigate('rejection')}
              className="bg-white border border-slate-200 hover:border-blue-400 p-3 rounded-xl shadow-3xs text-left transition-all cursor-pointer group flex flex-col justify-between h-24"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600 group-hover:scale-105 transition-transform shrink-0">
                <MessageSquareWarning className="h-3.5 w-3.5" />
              </div>
              <div className="mt-2">
                <h4 className="text-xs font-bold text-slate-900 font-mono group-hover:text-blue-600 transition-colors">Rejection Solver</h4>
                <p className="text-[9px] text-slate-500 line-clamp-1">Resolve App Store rejection notices with step-by-step guidance.</p>
              </div>
            </button>

            <button
              onClick={() => onNavigate('metadata')}
              className="bg-white border border-slate-200 hover:border-blue-400 p-3 rounded-xl shadow-3xs text-left transition-all cursor-pointer group flex flex-col justify-between h-24"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 group-hover:scale-105 transition-transform shrink-0">
                <Layers className="h-3.5 w-3.5" />
              </div>
              <div className="mt-2">
                <h4 className="text-xs font-bold text-slate-900 font-mono group-hover:text-blue-600 transition-colors">Metadata Checker</h4>
                <p className="text-[9px] text-slate-500 line-clamp-1">Audit app listings keywords, URLs, and subtitles.</p>
              </div>
            </button>

            <button
              onClick={() => onNavigate('screenshots')}
              className="bg-white border border-slate-200 hover:border-blue-400 p-3 rounded-xl shadow-3xs text-left transition-all cursor-pointer group flex flex-col justify-between h-24"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 group-hover:scale-105 transition-transform shrink-0">
                <Smartphone className="h-3.5 w-3.5" />
              </div>
              <div className="mt-2">
                <h4 className="text-xs font-bold text-slate-900 font-mono group-hover:text-blue-600 transition-colors">Screenshot Validator</h4>
                <p className="text-[9px] text-slate-500 line-clamp-1">Validate pixel boundaries and device screenshot dimensions.</p>
              </div>
            </button>
          </div>
        </div>

        {/* Try it on any App Store app */}
        {onTryNow && (
          <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-xl shrink-0 space-y-2.5">
            <div>
              <h4 className="text-xs font-bold text-slate-800 font-mono">Try it on any App Store app</h4>
              <p className="text-[10px] text-slate-500">Run a quick public listing check on any live App Store app instantly. No authentication or file upload required.</p>
            </div>
            <TryItNowSearch
              onTryNow={onTryNow}
              tryNowError={tryNowError}
              isTryNowLoading={isTryNowLoading}
              placeholder="Enter App Store URL, App ID, or search query..."
            />
          </div>
        )}

        {/* Search Bar */}
        <div className="relative shrink-0">
          <Search className="absolute left-3.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search audited apps by name or bundle identifier..."
            className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none shadow-3xs"
          />
        </div>

        {/* Two-Column Scrollable Pane */}
        <div className="flex-1 flex gap-6 overflow-hidden min-h-0">
          
          {/* Left Column: Apps List (Scrollable) */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-none h-full min-h-0">
            {apps.length === 0 ? (
              /* EMPTY STATE */
              <div id="dashboard_empty_state" className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-3xs">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-4 shadow-inner">
                  <Smartphone className="h-8 w-8" />
                </div>
                <h2 className="text-lg font-bold text-slate-900 font-mono">
                  Check your first iOS app
                </h2>
                <p className="text-sm text-slate-600 mt-1.5 max-w-md mx-auto">
                  Upload your app (.ipa, .zip, or Info.plist) and we'll look for common App Store review blockers.
                </p>
                <div className="mt-6">
                  <button
                    id="empty_state_upload_btn"
                    onClick={onCheckNewApp}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 text-xs font-bold transition-all shadow-md shadow-blue-600/20 cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Upload app</span>
                  </button>
                </div>
              </div>
            ) : filteredApps.length === 0 ? (
              <div className="p-10 text-center text-xs text-slate-500 font-mono bg-white border border-slate-200 rounded-2xl">
                No apps found matching "{searchQuery}"
              </div>
            ) : (
              filteredApps.map((app) => {
                const latestAudit = store.getLatestAudit(app.id);
                const score = calculateReadinessScore(latestAudit);
                const openFindings = latestAudit ? latestAudit.findings.filter(f => f.status !== 'FIXED') : [];
                const highCount = openFindings.filter(f => f.severity === 'HIGH').length;
                const mediumCount = openFindings.filter(f => f.severity === 'MEDIUM').length;
                const lowCount = openFindings.filter(f => f.severity === 'LOW').length;
                const totalIssues = openFindings.length;

                // Status configuration
                let statusLabel = 'Ready to submit';
                let statusColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
                if (highCount > 0) {
                  statusLabel = 'Action required';
                  statusColor = 'text-red-700 bg-red-50 border-red-200';
                } else if (mediumCount > 0 || lowCount > 0) {
                  statusLabel = 'Needs attention';
                  statusColor = 'text-amber-700 bg-amber-50 border-amber-200';
                }

                return (
                  <div
                    key={app.id}
                    id={`app_card_${app.id}`}
                    className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-3xs hover:shadow-sm transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 font-bold border border-slate-200 font-mono text-xs">
                            {app.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900 text-sm leading-tight">
                              {app.name}
                            </h3>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] text-slate-500 font-mono">
                                v{app.currentVersion || '1.0.0'} (b{app.currentBuild || '1'})
                              </span>
                              <span className="text-slate-300 text-[10px]">•</span>
                              <span className="text-[10px] text-slate-500">
                                {app.primaryCategory || 'iOS App'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusColor}`}>
                          {statusLabel}
                        </span>
                      </div>

                      <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/70 p-3 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-500 block">Readiness score</span>
                          <div className="flex items-baseline gap-1">
                            <span className={`text-base font-bold font-mono ${
                              score >= 90 ? 'text-emerald-600' : score >= 70 ? 'text-amber-600' : 'text-red-600'
                            }`}>
                              {score}%
                            </span>
                            <span className="text-[9px] font-medium text-slate-600">ready</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-[10px] font-medium">
                          <span className={`px-1.5 py-0.5 rounded border ${
                            highCount > 0 ? 'bg-red-50 text-red-700 border-red-200 font-bold' : 'bg-slate-100/80 text-slate-400 border-slate-200/60'
                          }`}>
                            {highCount} H
                          </span>
                          <span className={`px-1.5 py-0.5 rounded border ${
                            mediumCount > 0 ? 'bg-amber-50 text-amber-700 border-amber-200 font-bold' : 'bg-slate-100/80 text-slate-400 border-slate-200/60'
                          }`}>
                            {mediumCount} M
                          </span>
                          <span className={`px-1.5 py-0.5 rounded border ${
                            lowCount > 0 ? 'bg-blue-50 text-blue-700 border-blue-200 font-bold' : 'bg-slate-100/80 text-slate-400 border-slate-200/60'
                          }`}>
                            {lowCount} L
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1 text-[10px] text-slate-500">
                        <Clock className="h-3 w-3 text-slate-400" />
                        <span>Last check: <strong className="text-slate-700 font-medium">{formatCheckDate(latestAudit?.createdAt || app.lastAuditDate)}</strong></span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          id={`check_new_version_btn_${app.id}`}
                          onClick={() => onCheckNewVersion(app.id)}
                          title="Check a new build version of this app"
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 p-1.5 text-xs font-semibold transition-all cursor-pointer"
                        >
                          <RotateCw className="h-3 w-3 text-slate-550" />
                        </button>

                        <button
                          id={`open_app_btn_${app.id}`}
                          onClick={() => onOpenApp(app.id)}
                          className="inline-flex items-center gap-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1.5 text-[11px] font-bold transition-all cursor-pointer shadow-3xs"
                        >
                          <span>Open</span>
                          <ChevronRight className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Column: Recent Checks & Shortcuts (Scrollable side-panel) */}
          <div className="w-80 shrink-0 hidden md:flex flex-col gap-4 overflow-y-auto min-h-0 pl-5 border-l border-slate-200/80 pr-1 scrollbar-none h-full">
            
            {recentAudits.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-3xs shrink-0">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-slate-500" />
                    <h3 className="text-xs font-bold text-slate-900 font-mono">
                      Recent Checks
                    </h3>
                  </div>
                </div>

                <div className="divide-y divide-slate-100">
                  {recentAudits.map(({ app, audit }) => {
                    const auditScore = calculateReadinessScore(audit);
                    const openCount = audit.findings.filter(f => f.status !== 'FIXED').length;

                    return (
                      <div 
                        key={audit.id} 
                        className="py-2.5 flex items-center justify-between gap-2 hover:bg-slate-50/70 px-1.5 rounded-lg transition-colors cursor-pointer"
                        onClick={() => {
                          store.selectApp(app.id);
                          store.setActiveAudit(audit.id);
                          onOpenApp(app.id);
                        }}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-bold text-slate-900 truncate block max-w-[110px]">{app.name}</span>
                            <span className="text-[9px] font-mono text-slate-400 shrink-0">v{audit.appVersion}</span>
                          </div>
                          <span className="text-[9px] text-slate-400 block mt-0.5">
                            {formatCheckDate(audit.createdAt)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <span className={`text-[10px] font-bold font-mono block ${
                              auditScore >= 90 ? 'text-emerald-600' : auditScore >= 70 ? 'text-amber-600' : 'text-red-600'
                            }`}>
                              {auditScore}%
                            </span>
                            <span className="text-[9px] text-slate-400 block">
                              {openCount === 0 ? '0 issues' : `${openCount} issue${openCount > 1 ? 's' : ''}`}
                            </span>
                          </div>
                          <ChevronRight className="h-3 w-3 text-slate-400" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Apple Rejection Shortcut promo */}
            <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-amber-50/30 p-4 space-y-2.5 shadow-3xs shrink-0">
              <div className="flex items-start gap-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
                  <MessageSquareWarning className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    App rejected?
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                    Paste Apple's message in the Rejection Solver for fixes & reply drafts.
                  </p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('rejection')}
                className="w-full inline-flex items-center justify-center gap-1 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 py-1.5 text-[10px] font-bold transition-all shadow-3xs cursor-pointer"
              >
                <span>Solve Rejection</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};
