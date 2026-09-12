import React, { useState } from 'react';
import { ArrowLeft, RotateCw } from 'lucide-react';
import { store } from '../services/store';
import { Application, AuditRun } from '../types';
import { readinessLabel, readinessColorClasses, READY_DISCLAIMER } from './labels';
import { IpaCheckPanel } from './IpaCheckPanel';
import { MetadataPanel } from './MetadataPanel';
import { ScreenshotsPanel } from './ScreenshotsPanel';
import { compareAudits } from '../engine/evaluator';

type Tab = 'build' | 'metadata' | 'screenshots' | 'history';

interface PreflightAppProps {
  app: Application;
  onBack: () => void;
}

export const PreflightApp: React.FC<PreflightAppProps> = ({ app, onBack }) => {
  const [tab, setTab] = useState<Tab>('build');
  const [, forceTick] = useState(0);
  const [historyAuditId, setHistoryAuditId] = useState<string | null>(null);

  const audits = store.getAudits(app.id);
  const latest = audits.length > 0 ? audits[audits.length - 1] : null;
  const active: AuditRun | null = historyAuditId ? store.getAuditById(historyAuditId) : store.getActiveAudit();
  const audit = active && active.appId === app.id ? active : latest;

  const refresh = () => forceTick(t => t + 1);

  const handleSaved = (appId: string, auditId: string) => {
    store.selectApp(appId);
    store.setActiveAudit(auditId);
    setHistoryAuditId(null);
    refresh();
  };

  const high = audit?.highRiskCount ?? 0;
  const medium = audit?.mediumRiskCount ?? 0;
  const low = audit?.lowRiskCount ?? 0;
  const manual = audit?.manualCheckCount ?? 0;

  const tabs: { id: Tab; label: string }[] = [
    { id: 'build', label: 'Build' },
    { id: 'metadata', label: 'Metadata' },
    { id: 'screenshots', label: 'Screenshots' },
    { id: 'history', label: 'History' }
  ];

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> All apps
      </button>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-lg font-bold text-slate-900">{app.name}</h1>
            <p className="text-xs font-mono text-slate-400">
              {app.bundleId} · v{app.currentVersion || '—'} ({app.currentBuild || '—'})
            </p>
          </div>
          <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${readinessColorClasses(
              audit?.readinessStatus
            )}`}
          >
            {readinessLabel(audit?.readinessStatus)}
          </span>
        </div>

        {audit?.readinessStatus === 'NO_HIGH_RISK_ISSUES_DETECTED' && (
          <p className="text-[11px] text-slate-400 italic">{READY_DISCLAIMER}</p>
        )}

        <div className="grid grid-cols-4 gap-2">
          <div className="rounded-lg bg-red-50 border border-red-100 py-2 text-center">
            <p className="text-sm font-bold text-red-700">{high}</p>
            <p className="text-[9px] font-mono text-red-500">HIGH</p>
          </div>
          <div className="rounded-lg bg-amber-50 border border-amber-100 py-2 text-center">
            <p className="text-sm font-bold text-amber-700">{medium}</p>
            <p className="text-[9px] font-mono text-amber-500">MEDIUM</p>
          </div>
          <div className="rounded-lg bg-slate-50 border border-slate-100 py-2 text-center">
            <p className="text-sm font-bold text-slate-700">{low}</p>
            <p className="text-[9px] font-mono text-slate-400">LOW</p>
          </div>
          <div className="rounded-lg bg-blue-50 border border-blue-100 py-2 text-center">
            <p className="text-sm font-bold text-blue-700">{manual}</p>
            <p className="text-[9px] font-mono text-blue-500">MANUAL</p>
          </div>
        </div>

        <button
          onClick={() => setTab('build')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
        >
          <RotateCw className="h-3.5 w-3.5" /> Recheck build
        </button>
      </div>

      <div className="flex items-center gap-1 border-b border-slate-200">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-2 text-xs font-bold border-b-2 -mb-px transition-colors cursor-pointer ${
              tab === t.id ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div>
        {tab === 'build' && <IpaCheckPanel app={app} audit={audit} onSaved={handleSaved} />}
        {tab === 'metadata' && <MetadataPanel app={app} audit={audit} onSaved={handleSaved} />}
        {tab === 'screenshots' && <ScreenshotsPanel app={app} audit={audit} onSaved={handleSaved} />}
        {tab === 'history' && (
          <div className="space-y-2">
            {audits.length === 0 && <p className="text-xs text-slate-400">No checks yet.</p>}
            {[...audits].reverse().map((a, idx, arr) => {
              const prev = arr[idx + 1];
              const cmp = prev ? compareAudits(prev, a) : null;
              return (
                <button
                  key={a.id}
                  onClick={() => {
                    setHistoryAuditId(a.id);
                    store.setActiveAudit(a.id);
                  }}
                  className={`w-full text-left rounded-lg border px-3 py-2.5 cursor-pointer transition-colors ${
                    audit?.id === a.id ? 'border-blue-300 bg-blue-50/50' : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-slate-600">
                      v{a.appVersion} ({a.buildNumber}) · {a.auditType || 'BINARY_SCAN'}
                    </span>
                    <span
                      className={`text-[10px] font-bold rounded-full border px-2 py-0.5 ${readinessColorClasses(
                        a.readinessStatus
                      )}`}
                    >
                      {readinessLabel(a.readinessStatus)}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">{new Date(a.createdAt).toLocaleString()}</p>
                  {cmp && (
                    <p className="text-[10px] font-mono text-slate-400 mt-1">
                      +{cmp.newCount} new · {cmp.resolvedCount} fixed · {cmp.remainingCount} remaining
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
