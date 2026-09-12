import React, { useRef, useState } from 'react';
import { Upload, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { store } from '../services/store';
import { Application, AuditRun, NormalizedAppInspection } from '../types';
import { isValidScreenshotSize } from '../engine/evaluator';
import { saveScreenshotsCheck } from './runListingCheck';
import { FindingCard } from './FindingCard';

interface ScreenshotsPanelProps {
  app: Application;
  audit: AuditRun | null;
  onSaved: (appId: string, auditId: string) => void;
}

type LocalShot = NormalizedAppInspection['screenshots'][number] & { previewUrl?: string };

function readImageSize(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Couldn't read ${file.name} as an image.`));
    };
    img.src = url;
  });
}

export const ScreenshotsPanel: React.FC<ScreenshotsPanelProps> = ({ app, audit, onSaved }) => {
  const inspection = store.getInspection(app.id);
  const [shots, setShots] = useState<LocalShot[]>(inspection?.screenshots || []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = async (files: FileList | File[]) => {
    setError(null);
    const list = Array.from(files).filter(f => /image\/(png|jpe?g)/.test(f.type));
    if (list.length === 0) {
      setError('Upload PNG or JPEG screenshots.');
      return;
    }
    try {
      const next: LocalShot[] = [];
      for (const file of list) {
        const { width, height } = await readImageSize(file);
        const isValidSize = isValidScreenshotSize(width, height);
        next.push({
          id: `shot_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          name: file.name,
          width,
          height,
          format: file.type.split('/')[1]?.toUpperCase() || 'UNKNOWN',
          deviceTarget: isValidSize ? 'Matched' : 'Unknown',
          aspectRatio: `${width}:${height}`,
          isValidSize,
          issues: isValidSize ? [] : ['Dimensions do not match a required App Store screenshot size.']
        });
      }
      setShots(prev => [...prev, ...next]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't read one of those images.");
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const result = await saveScreenshotsCheck({
        appId: app.id,
        appName: app.name,
        bundleId: app.bundleId,
        screenshots: shots.map(({ previewUrl, ...s }) => s)
      });
      onSaved(result.app.id, result.audit.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save the check. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const shotFindings = (audit?.findings || []).filter(f => f.category === 'SCREENSHOTS');

  return (
    <div className="space-y-4">
      <div
        onDragOver={e => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={e => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${
          isDragging ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg"
          multiple
          className="hidden"
          onChange={e => e.target.files && addFiles(e.target.files)}
        />
        <div className="flex flex-col items-center gap-2">
          <Upload className="h-6 w-6 text-slate-400" />
          <p className="text-sm font-semibold text-slate-700">Drop PNG or JPEG screenshots</p>
          <p className="text-xs text-slate-400">or click to browse — dimensions only, no visual judgment</p>
        </div>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}

      {shots.length > 0 && (
        <div className="space-y-1.5">
          {shots.map(shot => (
            <div
              key={shot.id}
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2"
            >
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-800 truncate">{shot.name}</p>
                <p className="text-[10px] font-mono text-slate-400">
                  {shot.width}×{shot.height} · {shot.format}
                </p>
              </div>
              {shot.isValidSize ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Valid
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-red-700">
                  <XCircle className="h-3.5 w-3.5" /> Invalid size
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving || shots.length === 0}
        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-bold px-4 py-2 cursor-pointer"
      >
        {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        Save &amp; check
      </button>

      {shotFindings.length > 0 && (
        <div className="space-y-2 pt-2">
          {shotFindings.map(f => (
            <FindingCard key={f.id} finding={f} />
          ))}
        </div>
      )}
    </div>
  );
};
