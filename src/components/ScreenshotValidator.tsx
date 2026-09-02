import React, { useState } from 'react';
import { 
  Image as ImageIcon, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Check, 
  Smartphone, 
  Tablet,
  Sparkles,
  Info
} from 'lucide-react';
import { apiClient } from '../services/api';
import { ScreenshotValidationResult } from '../types';

interface ValidatedScreenshotItem extends ScreenshotValidationResult {
  id: string;
}

export const ScreenshotValidator: React.FC = () => {
  const [results, setResults] = useState<ValidatedScreenshotItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setError(null);

    Array.from(e.target.files).forEach((file: File) => {
      const url = URL.createObjectURL(file);
      const img = new Image();

      img.onload = async () => {
        URL.revokeObjectURL(url);
        try {
          const val = await apiClient.validateScreenshot(img.width, img.height, file.name);
          const itemWithId: ValidatedScreenshotItem = {
            ...val,
            id: `screenshot_${Date.now()}_${Math.random().toString(36).substring(2, 9)}_${file.name}`
          };
          setResults(prev => [itemWithId, ...prev]);
        } catch (err: any) {
          setError(err.message || 'Failed to validate screenshot dimensions.');
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        setError(`Failed to load "${file.name}". Please provide a valid PNG or JPEG image file.`);
      };

      img.src = url;
    });

    // Reset input value so the same file can be re-selected if needed
    e.target.value = '';
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      
      {/* Header */}
      <div className="border-b border-slate-200 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
            <ImageIcon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">App Store Screenshot Validator</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Verify screenshot resolutions against Apple's strict App Store Connect display requirements before upload.
            </p>
          </div>
        </div>
      </div>

      {/* Upload Zone Card */}
      <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-8 text-center hover:border-blue-400 hover:bg-blue-50/20 transition-all shadow-sm">
        <input
          type="file"
          id="screenshot_input"
          multiple
          accept="image/png,image/jpeg"
          onChange={handleFileUpload}
          className="hidden"
        />
        <label htmlFor="screenshot_input" className="cursor-pointer flex flex-col items-center">
          <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 mb-2">
            <Upload className="h-7 w-7" />
          </div>
          <p className="font-semibold text-slate-900 text-sm">
            Drag & drop screenshots or click to browse
          </p>
          <p className="text-xs text-slate-500 mt-1 font-mono">
            Supported: PNG or JPEG • Max 10 per device target
          </p>
        </label>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Required Sizes Reference Grid */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono mb-3">
          Required Apple Display Sizes Reference
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
            <div className="font-bold text-slate-800">iPhone 6.9"</div>
            <div className="text-blue-600 font-semibold mt-1">1320 × 2868 px</div>
            <div className="text-[11px] text-slate-500">iPhone 16 Pro Max</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
            <div className="font-bold text-slate-800">iPhone 6.7"</div>
            <div className="text-blue-600 font-semibold mt-1">1290 × 2796 px</div>
            <div className="text-[11px] text-slate-500">iPhone 15/14 Pro Max</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
            <div className="font-bold text-slate-800">iPhone 6.5"</div>
            <div className="text-blue-600 font-semibold mt-1">1242 × 2688 px</div>
            <div className="text-[11px] text-slate-500">iPhone 11 Pro Max / XS</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
            <div className="font-bold text-slate-800">iPad Pro 13"</div>
            <div className="text-blue-600 font-semibold mt-1">2064 × 2752 px</div>
            <div className="text-[11px] text-slate-500">iPad Pro (M4) / 12.9"</div>
          </div>
        </div>
      </div>

      {/* Validation Results List */}
      <div className="space-y-3">
        <h3 className="font-bold text-slate-900 text-sm font-display">Uploaded Screenshot Checks ({results.length})</h3>
        
        {results.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-3xs flex flex-col items-center">
            <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center mb-4">
              <ImageIcon className="h-6 w-6 text-slate-400" />
            </div>
            <h4 className="text-sm font-bold text-slate-700">No screenshots checked yet</h4>
            <p className="mt-1 text-xs text-slate-500 max-w-sm">Upload a screenshot above to automatically verify its dimensions against App Store Connect requirements.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {results.map((res) => (
              <div
                key={res.id}
                className={`flex items-start justify-between rounded-xl border p-4 text-xs transition-colors bg-white shadow-xs ${
                  res.isValidDimension
                    ? 'border-emerald-200'
                    : 'border-red-200'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 font-mono">{res.fileName}</span>
                    <span className="font-mono text-slate-500 text-[11px]">({res.width} × {res.height} px)</span>
                  </div>
                  <div className="text-slate-600">
                    Target: <span className="font-semibold text-blue-600">{res.matchedDevice}</span>
                  </div>
                  {res.issues.length > 0 && (
                    <div className="text-red-700 text-[11px] font-mono mt-1">
                      {res.issues.join(' ')}
                    </div>
                  )}
                  {res.warnings.length > 0 && (
                    <div className="text-amber-700 text-[11px] font-mono">
                      {res.warnings.join(' ')}
                    </div>
                  )}
                </div>

                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono border ${
                  res.isValidDimension
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-red-200 bg-red-50 text-red-700'
                }`}>
                  {res.isValidDimension ? 'VALID DIMENSION' : 'INVALID SIZE'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
