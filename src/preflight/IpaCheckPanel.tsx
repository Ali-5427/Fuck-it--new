import React, { useRef, useState } from 'react';
import { Upload, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { store } from '../services/store';
import { Application, AuditRun, Finding, FindingStatus } from '../types';
import { runBinaryCheck, BundleMismatchError } from './runBinaryCheck';
import { FindingCard } from './FindingCard';

type Stage = 'idle' | 'extracting' | 'analyzing' | 'saving' | 'done';

interface IpaCheckPanelProps {
  app: Application;
  audit: AuditRun | null;
  onSaved: (appId: string, auditId: string) => void;
}

export const IpaCheckPanel: React.FC<IpaCheckPanelProps> = ({ app, audit, onSaved }) => {
  const [stage, setStage] = useState<Stage>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [pendingMismatch, setPendingMismatch] = useState<BundleMismatchError | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [diff, setDiff] = useState<{ fixed: Finding[]; remaining: Finding[]; added: Finding[] } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isBinaryAudit = audit?.auditType === 'BINARY_SCAN';

  const runCheck = async (file: File, forceNewApp = false) => {
    setError(null);
    setPendingMismatch(null);
    setDiff(null);
    try {
      setStage('extracting');
      // extractAppArtifact runs inside runBinaryCheck; give the UI a beat.
      await new Promise(r => setTimeout(r, 150));
      setStage('analyzing');
      const result = await runBinaryCheck({ file, targetApp: forceNewApp ? null : app, forceNewApp });
      setStage('saving');
      setPendingFile(null);

      if (result.comparison) {
        setDiff({
          fixed: result.comparison.resolvedFindings,
          remaining: result.comparison.remainingFindings,
          added: result.comparison.newFindings
        });
      }

      setStage('done');
      onSaved(result.app.id, result.audit.id);
    } catch (err) {
      if (err instanceof BundleMismatchError) {
        setPendingMismatch(err);
        setPendingFile(file);
        setStage('idle');
        return;
      }
      setError(err instanceof Error ? err.message : "Couldn't save the check. Try again.");
      setStage('idle');
    }
  };

  const handleFile = (file: File) => {
    runCheck(file, false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  };

  const handleStatusChange = (findingId: string, status: FindingStatus) => {
    if (!audit) return;
    store.updateFindingStatus(app.id, audit.id, findingId, status);
  };

  const busy = stage !== 'idle' && stage !== 'done';

  const dropZone = (
    <div
      onDragOver={e => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => !busy && inputRef.current?.click()}
      className={`rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${
        isDragging ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".ipa,.zip,.plist"
        className="hidden"
        onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      {busy ? (
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
          <p className="text-xs font-mono text-slate-500">
            {stage === 'extracting' && 'Extracting...'}
            {stage === 'analyzing' && 'Analyzing...'}
            {stage === 'saving' && 'Saving...'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <Upload className="h-6 w-6 text-slate-400" />
          <p className="text-sm font-semibold text-slate-700">Drop an .ipa, .zip, or Info.plist</p>
          <p className="text-xs text-slate-400">or click to browse</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {pendingMismatch && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-800">
              This build's bundle ID (<span className="font-mono">{pendingMismatch.actual}</span>) doesn't match{' '}
              <span className="font-mono">{pendingMismatch.expected}</span>. Add it as a new app, or cancel.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                if (!pendingFile) return;
                setStage('saving');
                try {
                  const result = await runBinaryCheck({
                    file: pendingFile,
                    targetApp: null,
                    forceNewApp: true
                  });
                  setStage('done');
                  setPendingMismatch(null);
                  setPendingFile(null);
                  onSaved(result.app.id, result.audit.id);
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Couldn't save the check. Try again.");
                  setStage('idle');
                }
              }}
              className="rounded-lg bg-slate-900 text-white text-xs font-bold px-3 py-1.5 cursor-pointer"
            >
              Add as new app
            </button>
            <button
              onClick={() => {
                setPendingMismatch(null);
                setPendingFile(null);
              }}
              className="rounded-lg bg-white border border-slate-200 text-xs font-bold px-3 py-1.5 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>
      )}

      {!isBinaryAudit && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
          No IPA checked yet for this app.
        </div>
      )}

      {dropZone}

      {diff && (
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 py-2">
            <p className="text-lg font-bold text-emerald-700">{diff.fixed.length}</p>
            <p className="text-[10px] font-mono text-emerald-600">Fixed</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 py-2">
            <p className="text-lg font-bold text-slate-700">{diff.remaining.length}</p>
            <p className="text-[10px] font-mono text-slate-500">Remaining</p>
          </div>
          <div className="rounded-lg border border-red-200 bg-red-50 py-2">
            <p className="text-lg font-bold text-red-700">{diff.added.length}</p>
            <p className="text-[10px] font-mono text-red-600">New</p>
          </div>
        </div>
      )}

      {isBinaryAudit && audit && (
        <div className="space-y-2">
          {audit.findings
            .filter(f => f.category !== 'METADATA' && f.category !== 'SCREENSHOTS')
            .map(f => (
              <FindingCard key={f.id} finding={f} onStatusChange={s => handleStatusChange(f.id, s)} />
            ))}
          {audit.findings.filter(f => f.category !== 'METADATA' && f.category !== 'SCREENSHOTS').length === 0 && (
            <div className="flex items-center gap-2 text-xs text-slate-500 px-1">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              No build-level findings in this check.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
