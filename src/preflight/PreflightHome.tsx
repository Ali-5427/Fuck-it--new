import React, { useRef, useState } from 'react';
import { Upload, FileText, Image as ImageIcon, Loader2, ChevronRight, ArrowLeft } from 'lucide-react';
import { store } from '../services/store';
import { Application, AppMetadataDraft } from '../types';
import { readinessLabel, readinessColorClasses } from './labels';
import { runBinaryCheck, BundleMismatchError } from './runBinaryCheck';
import { saveMetadataCheck, saveScreenshotsCheck } from './runListingCheck';
import { isValidScreenshotSize } from '../engine/evaluator';

interface PreflightHomeProps {
  onOpenApp: (appId: string) => void;
}

type Mode = 'home' | 'new-metadata' | 'new-screenshots';

const EMPTY_DRAFT: AppMetadataDraft = {
  name: '',
  subtitle: '',
  description: '',
  keywords: '',
  promotionalText: '',
  supportUrl: '',
  privacyPolicyUrl: '',
  category: '',
  ageRating: ''
};

export const PreflightHome: React.FC<PreflightHomeProps> = ({ onOpenApp }) => {
  const apps = store.getApps();
  const [mode, setMode] = useState<Mode>('home');
  const [isDragging, setIsDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState<'idle' | 'extracting' | 'analyzing' | 'saving'>('idle');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError(null);
    setBusy(true);
    try {
      setStage('extracting');
      await new Promise(r => setTimeout(r, 150));
      setStage('analyzing');
      const result = await runBinaryCheck({ file });
      setStage('saving');
      onOpenApp(result.app.id);
    } catch (err) {
      if (err instanceof BundleMismatchError) {
        try {
          const result = await runBinaryCheck({ file, forceNewApp: true });
          onOpenApp(result.app.id);
          return;
        } catch (e2) {
          setError(e2 instanceof Error ? e2.message : "Couldn't save the check. Try again.");
        }
      } else {
        setError(err instanceof Error ? err.message : "Couldn't save the check. Try again.");
      }
    } finally {
      setBusy(false);
      setStage('idle');
    }
  };

  const goToListingCheck = () => {
    if (apps.length > 0) {
      onOpenApp(apps[0].id);
    } else {
      setMode('new-metadata');
    }
  };

  const goToScreenshotCheck = () => {
    if (apps.length > 0) {
      onOpenApp(apps[0].id);
    } else {
      setMode('new-screenshots');
    }
  };

  if (mode === 'new-metadata') {
    return <NewListingForm onBack={() => setMode('home')} onCreated={onOpenApp} />;
  }
  if (mode === 'new-screenshots') {
    return <NewScreenshotsForm onBack={() => setMode('home')} onCreated={onOpenApp} />;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Check before you submit.</h1>
        <p className="text-sm text-slate-500 mt-1">
          IPA stays in your browser. We save the results to your account.
        </p>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}

      <div className="grid gap-4 sm:grid-cols-3">
        {/* A. Check a build */}
        <div
          onDragOver={e => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={e => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
          }}
          onClick={() => !busy && inputRef.current?.click()}
          className={`rounded-2xl border-2 border-dashed p-5 cursor-pointer transition-colors ${
            isDragging ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:border-slate-300 bg-white'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".ipa,.zip,.plist"
            className="hidden"
            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <Upload className="h-5 w-5 text-blue-600 mb-3" />
          <h3 className="text-sm font-bold text-slate-900">Check a build (.ipa)</h3>
          <p className="text-xs text-slate-500 mt-1">Drop your .ipa, .zip, or Info.plist</p>
          {busy && (
            <div className="mt-3 flex items-center gap-2 text-xs font-mono text-blue-600">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {stage === 'extracting' && 'Extracting...'}
              {stage === 'analyzing' && 'Analyzing...'}
              {stage === 'saving' && 'Saving...'}
            </div>
          )}
        </div>

        {/* B. Check listing metadata */}
        <button
          onClick={goToListingCheck}
          className="text-left rounded-2xl border border-slate-200 bg-white p-5 hover:border-slate-300 transition-colors cursor-pointer"
        >
          <FileText className="h-5 w-5 text-blue-600 mb-3" />
          <h3 className="text-sm font-bold text-slate-900">Check listing metadata</h3>
          <p className="text-xs text-slate-500 mt-1">Name, subtitle, keywords, description, privacy URL</p>
        </button>

        {/* C. Check screenshots */}
        <button
          onClick={goToScreenshotCheck}
          className="text-left rounded-2xl border border-slate-200 bg-white p-5 hover:border-slate-300 transition-colors cursor-pointer"
        >
          <ImageIcon className="h-5 w-5 text-blue-600 mb-3" />
          <h3 className="text-sm font-bold text-slate-900">Check screenshots</h3>
          <p className="text-xs text-slate-500 mt-1">Upload PNG/JPEG, we measure pixels</p>
        </button>
      </div>

      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono mb-2">Your apps</h2>
        {apps.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-400">
            No checks yet. Drop an IPA to start.
          </div>
        ) : (
          <div className="space-y-1.5">
            {apps.map((app: Application) => (
              <button
                key={app.id}
                onClick={() => onOpenApp(app.id)}
                className="w-full flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer text-left"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{app.name}</p>
                  <p className="text-[11px] font-mono text-slate-400 truncate">
                    {app.bundleId} · v{app.currentVersion || '—'} ({app.currentBuild || '—'})
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${readinessColorClasses(
                      app.lastAuditStatus
                    )}`}
                  >
                    {readinessLabel(app.lastAuditStatus)}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
                    {app.remainingIssuesCount} open
                  </span>
                  <ChevronRight className="h-4 w-4 text-slate-300" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/** Inline "first app is a listing check" form — no apps exist yet. */
const NewListingForm: React.FC<{ onBack: () => void; onCreated: (appId: string) => void }> = ({
  onBack,
  onCreated
}) => {
  const [form, setForm] = useState<AppMetadataDraft>(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (field: keyof AppMetadataDraft) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError('App name is required.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const result = await saveMetadataCheck({ form, appName: form.name });
      onCreated(result.app.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save the check. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6 space-y-4">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back
      </button>
      <h1 className="text-lg font-bold text-slate-900">Check listing metadata</h1>
      <div className="space-y-3">
        <div>
          <label className="text-xs font-semibold text-slate-700">App name</label>
          <input value={form.name} onChange={set('name')} className="w-full mt-1 rounded-lg border border-slate-200 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-700">Subtitle</label>
          <input value={form.subtitle} onChange={set('subtitle')} className="w-full mt-1 rounded-lg border border-slate-200 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-700">Keywords</label>
          <input value={form.keywords} onChange={set('keywords')} className="w-full mt-1 rounded-lg border border-slate-200 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-700">Description</label>
          <textarea value={form.description} onChange={set('description')} rows={5} className="w-full mt-1 rounded-lg border border-slate-200 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-700">Support URL</label>
          <input value={form.supportUrl} onChange={set('supportUrl')} className="w-full mt-1 rounded-lg border border-slate-200 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-700">Privacy policy URL</label>
          <input value={form.privacyPolicyUrl} onChange={set('privacyPolicyUrl')} className="w-full mt-1 rounded-lg border border-slate-200 px-3 py-2 text-sm" />
        </div>
      </div>
      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}
      <button
        onClick={handleSave}
        disabled={saving}
        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-bold px-4 py-2 cursor-pointer"
      >
        {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        Save &amp; check
      </button>
    </div>
  );
};

/** Inline "first app is a screenshot check" form — no apps exist yet. */
const NewScreenshotsForm: React.FC<{ onBack: () => void; onCreated: (appId: string) => void }> = ({
  onBack,
  onCreated
}) => {
  const [name, setName] = useState('');
  const [shots, setShots] = useState<
    { id: string; name: string; width: number; height: number; format: string; deviceTarget: string; aspectRatio: string; isValidSize: boolean; issues: string[] }[]
  >([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = async (files: FileList) => {
    const list = Array.from(files).filter(f => /image\/(png|jpe?g)/.test(f.type));
    const next = [];
    for (const file of list) {
      const dims = await new Promise<{ width: number; height: number }>((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
          resolve({ width: img.naturalWidth, height: img.naturalHeight });
          URL.revokeObjectURL(url);
        };
        img.onerror = () => reject(new Error("Couldn't read that image."));
        img.src = url;
      });
      const isValidSize = isValidScreenshotSize(dims.width, dims.height);
      next.push({
        id: `shot_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name: file.name,
        width: dims.width,
        height: dims.height,
        format: file.type.split('/')[1]?.toUpperCase() || 'UNKNOWN',
        deviceTarget: isValidSize ? 'Matched' : 'Unknown',
        aspectRatio: `${dims.width}:${dims.height}`,
        isValidSize,
        issues: isValidSize ? [] : ['Dimensions do not match a required App Store screenshot size.']
      });
    }
    setShots(prev => [...prev, ...next]);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError('App name is required.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const result = await saveScreenshotsCheck({ appName: name, screenshots: shots });
      onCreated(result.app.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save the check. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6 space-y-4">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back
      </button>
      <h1 className="text-lg font-bold text-slate-900">Check screenshots</h1>
      <div>
        <label className="text-xs font-semibold text-slate-700">App name</label>
        <input value={name} onChange={e => setName(e.target.value)} className="w-full mt-1 rounded-lg border border-slate-200 px-3 py-2 text-sm" />
      </div>
      <div
        onClick={() => inputRef.current?.click()}
        className="rounded-xl border-2 border-dashed border-slate-200 hover:border-slate-300 bg-slate-50/50 p-6 text-center cursor-pointer"
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg"
          multiple
          className="hidden"
          onChange={e => e.target.files && addFiles(e.target.files)}
        />
        <Upload className="h-5 w-5 text-slate-400 mx-auto mb-2" />
        <p className="text-xs text-slate-500">Drop PNG/JPEG screenshots or click to browse</p>
      </div>
      {shots.map(s => (
        <div key={s.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-xs">
          <span className="font-mono text-slate-500">{s.name} · {s.width}×{s.height}</span>
          <span className={s.isValidSize ? 'text-emerald-600 font-bold' : 'text-red-600 font-bold'}>
            {s.isValidSize ? 'Valid' : 'Invalid size'}
          </span>
        </div>
      ))}
      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}
      <button
        onClick={handleSave}
        disabled={saving || shots.length === 0}
        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-bold px-4 py-2 cursor-pointer"
      >
        {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        Save &amp; check
      </button>
    </div>
  );
};
