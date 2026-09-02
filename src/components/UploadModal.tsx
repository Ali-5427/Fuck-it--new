import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Upload, 
  FileCode, 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  Loader2, 
  AlertCircle, 
  ShieldAlert, 
  ArrowRight,
  PackageCheck,
  Cpu
} from 'lucide-react';
import { extractAppArtifact, parseInspectionData } from '../engine/extractor';
import { APP_STORE_RULES } from '../engine/rules';
import { store } from '../services/store';
import { NormalizedAppInspection, Application } from '../types';
import { useScrollLock } from '../hooks/useScrollLock';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuditCompleted: (appId: string, auditId: string, comparison?: any) => void;
  targetApp?: Application | null;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onAuditCompleted,
  targetApp
}) => {
  useScrollLock(isOpen);
  const [activeTab, setActiveTab] = useState<'file' | 'plist'>('file');
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [rawPlistText, setRawPlistText] = useState('');
  const [customAppName, setCustomAppName] = useState(targetApp?.name || '');
  const [customBundleId, setCustomBundleId] = useState(targetApp?.bundleId || '');
  const [customCategory, setCustomCategory] = useState(targetApp?.primaryCategory || 'Utilities');

  useEffect(() => {
    if (targetApp) {
      setCustomAppName(targetApp.name);
      setCustomBundleId(targetApp.bundleId);
      setCustomCategory(targetApp.primaryCategory || 'Utilities');
    }
  }, [targetApp]);

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStep, setProgressStep] = useState(0);
  const [processingStatusText, setProcessingStatusText] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = (selectedFile: File) => {
    setFile(selectedFile);
    if (!targetApp) {
      const inferredName = selectedFile.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setCustomAppName(inferredName);
      setCustomBundleId('');
    }
    setErrorMsg(null);
  };

  const processPipeline = async (inspection: NormalizedAppInspection, appName: string, bundleId: string) => {
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      // Step 1: Validation
      setProgressStep(1);
      setProcessingStatusText('Decompressing payload and verifying iOS target structure...');
      await new Promise(r => setTimeout(r, 500));

      // Step 2: Plist & Privacy Manifest extraction
      setProgressStep(2);
      setProcessingStatusText('Inspecting Info.plist purpose strings & PrivacyInfo.xcprivacy...');
      await new Promise(r => setTimeout(r, 600));

      // Step 3: Framework & symbol scanning
      setProgressStep(3);
      setProcessingStatusText('Scanning framework signatures (StoreKit, Social Auth, Ads, ATS)...');
      await new Promise(r => setTimeout(r, 500));

      // Step 4: Deterministic rule engine
      setProgressStep(4);
      setProcessingStatusText(`Evaluating against ${APP_STORE_RULES.length} Apple App Store Review Guidelines...`);
      await new Promise(r => setTimeout(r, 600));

      // Step 5: Gemini AI Correlation & Review Notes Draft
      setProgressStep(5);
      setProcessingStatusText('Drafting App Store Connect Reviewer Notes and remediation guidance...');
      await new Promise(r => setTimeout(r, 700));

      if (targetApp) {
        const { audit: newAudit, comparison } = await store.runNewAudit(
          targetApp.id,
          inspection.build,
          inspection.version,
          inspection,
          'BINARY_SCAN'
        );

        setProgressStep(6);
        setProcessingStatusText('Recheck complete! Loading audit comparison...');
        await new Promise(r => setTimeout(r, 300));

        setIsProcessing(false);
        onClose();
        onAuditCompleted(targetApp.id, newAudit.id, comparison);
      } else {
        const app = await store.createApp({
          name: appName || inspection.appName,
          bundleId: bundleId || inspection.bundleId,
          primaryCategory: customCategory || inspection.metadata.category || 'Utilities',
          currentVersion: inspection.version,
          currentBuild: inspection.build,
          inspection,
          auditType: 'BINARY_SCAN'
        });

        const latestAudit = store.getLatestAudit(app.id);

        setProgressStep(6);
        setProcessingStatusText('Inspection complete! Loading audit dashboard...');
        await new Promise(r => setTimeout(r, 300));

        setIsProcessing(false);
        onClose();
        if (latestAudit) {
          onAuditCompleted(app.id, latestAudit.id);
        }
      }
    } catch (err: any) {
      console.error('Extraction error:', err);
      setIsProcessing(false);
      setErrorMsg(err.message || 'Failed to extract iOS application archive.');
    }
  };

  const handleStartAnalysis = async () => {
    if (isProcessing) return;
    setErrorMsg(null);

    if (activeTab === 'file') {
      if (!file) {
        setErrorMsg('Please select an iOS IPA, ZIP archive, or Info.plist file.');
        return;
      }
    } else if (activeTab === 'plist') {
      if (!rawPlistText.trim()) {
        setErrorMsg('Please paste Info.plist XML or JSON content.');
        return;
      }
    }

    setIsProcessing(true);
    setProgressStep(0);
    setProcessingStatusText('Reading and extracting package contents...');

    try {
      if (activeTab === 'file') {
        const inspection = await extractAppArtifact(file!, file!.name);
        await processPipeline(inspection, customAppName || file!.name, customBundleId || inspection.bundleId);
      } else if (activeTab === 'plist') {
        const inspection = parseInspectionData(rawPlistText, '', []);
        await processPipeline(inspection, customAppName || inspection.appName, customBundleId || inspection.bundleId);
      }
    } catch (err: any) {
      console.error('Analysis error:', err);
      setIsProcessing(false);
      setProgressStep(0);
      setProcessingStatusText('');
      setErrorMsg(err?.message || 'Failed to extract iOS application archive or parse inspection data.');
    }
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {targetApp ? `Recheck iOS Build — ${targetApp.name}` : 'Run Preflight App Store Audit'}
              </h3>
              <p className="text-xs text-slate-500">
                {targetApp ? 'Upload a new IPA/ZIP archive or updated Info.plist to evaluate fixes' : 'Extracts iOS metadata, Info.plist purpose keys, & Privacy Manifests'}
              </p>
            </div>
          </div>
          {!isProcessing && (
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="flex-1 min-h-0 p-6 overflow-y-auto space-y-6">
          
          {isProcessing ? (
            /* Animated Extraction & Audit Progress State */
            <div className="py-8 px-4 text-center space-y-6">
              <div className="flex justify-center">
                <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-50 border border-blue-200">
                  <Cpu className="h-10 w-10 text-blue-600 animate-pulse" />
                  <div className="absolute -inset-1 rounded-2xl border border-blue-400/40 animate-ping opacity-25"></div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-lg text-slate-900">Analyzing iOS Application</h4>
                <p className="text-xs text-blue-600 font-mono mt-1">{processingStatusText}</p>
              </div>

              {/* Progress Steps */}
              <div className="max-w-md mx-auto space-y-2.5 text-left text-xs font-mono">
                <div className={`flex items-center gap-2.5 ${progressStep >= 1 ? 'text-blue-600 font-semibold' : 'text-slate-400'}`}>
                  {progressStep > 1 ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : progressStep === 1 ? <Loader2 className="h-4 w-4 animate-spin text-blue-600" /> : <div className="h-4 w-4 rounded-full border border-slate-300"></div>}
                  <span>1. Validating Bundle Structure & Architecture</span>
                </div>
                <div className={`flex items-center gap-2.5 ${progressStep >= 2 ? 'text-blue-600 font-semibold' : 'text-slate-400'}`}>
                  {progressStep > 2 ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : progressStep === 2 ? <Loader2 className="h-4 w-4 animate-spin text-blue-600" /> : <div className="h-4 w-4 rounded-full border border-slate-300"></div>}
                  <span>2. Scanning Info.plist & PrivacyInfo.xcprivacy</span>
                </div>
                <div className={`flex items-center gap-2.5 ${progressStep >= 3 ? 'text-blue-600 font-semibold' : 'text-slate-400'}`}>
                  {progressStep > 3 ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : progressStep === 3 ? <Loader2 className="h-4 w-4 animate-spin text-blue-600" /> : <div className="h-4 w-4 rounded-full border border-slate-300"></div>}
                  <span>3. Extracting Frameworks (StoreKit, Auth, ATS)</span>
                </div>
                <div className={`flex items-center gap-2.5 ${progressStep >= 4 ? 'text-blue-600 font-semibold' : 'text-slate-400'}`}>
                  {progressStep > 4 ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : progressStep === 4 ? <Loader2 className="h-4 w-4 animate-spin text-blue-600" /> : <div className="h-4 w-4 rounded-full border border-slate-300"></div>}
                  <span>{`4. Executing ${APP_STORE_RULES.length} Apple Guideline Rule Checks`}</span>
                </div>
                <div className={`flex items-center gap-2.5 ${progressStep >= 5 ? 'text-blue-600 font-semibold' : 'text-slate-400'}`}>
                  {progressStep > 5 ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : progressStep === 5 ? <Loader2 className="h-4 w-4 animate-spin text-blue-600" /> : <div className="h-4 w-4 rounded-full border border-slate-300"></div>}
                  <span>5. Drafting App Store Connect Reviewer Notes</span>
                </div>
              </div>

              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden max-w-md mx-auto">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(progressStep / 6) * 100}%` }}
                ></div>
              </div>
            </div>
          ) : (
            <>
              {/* Tab Selector */}
              <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
                <button
                  id="tab_upload_file"
                  onClick={() => setActiveTab('file')}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition-colors cursor-pointer ${
                    activeTab === 'file'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>IPA / ZIP Archive</span>
                </button>

                <button
                  id="tab_upload_plist"
                  onClick={() => setActiveTab('plist')}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition-colors cursor-pointer ${
                    activeTab === 'plist'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileCode className="h-3.5 w-3.5" />
                  <span>Paste Info.plist</span>
                </button>
              </div>

              {/* TAB 1: Real File Upload */}
              {activeTab === 'file' && (
                <div className="space-y-4">
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                      isDragging
                        ? 'border-blue-500 bg-blue-50/50'
                        : file
                        ? 'border-emerald-500 bg-emerald-50/40'
                        : 'border-slate-300 bg-slate-50/60 hover:border-blue-400 hover:bg-blue-50/20'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".ipa,.zip,.plist"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    {file ? (
                      <div className="flex flex-col items-center">
                        <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-700 border border-emerald-300 mb-2">
                          <PackageCheck className="h-8 w-8" />
                        </div>
                        <p className="font-bold text-slate-900 text-sm">{file.name}</p>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">
                          {(file.size / (1024 * 1024)).toFixed(2)} MB • Ready for inspection
                        </p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFile(null);
                          }}
                          className="mt-3 text-xs text-red-600 hover:underline cursor-pointer"
                        >
                          Remove and select different file
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 mb-2">
                          <Upload className="h-8 w-8 text-blue-600" />
                        </div>
                        <p className="font-semibold text-slate-900 text-sm">
                          Drag & drop your <span className="text-blue-600 font-mono">.ipa</span>, <span className="text-blue-600 font-mono">.zip</span>, or <span className="text-blue-600 font-mono">Info.plist</span>
                        </p>
                        <p className="text-xs text-slate-500 mt-1">or click to browse local files</p>
                        <p className="text-[11px] text-slate-500 font-mono mt-3">
                          Client-side extraction • Zero source code stored on server
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">App Display Name</label>
                      <input
                        type="text"
                        value={customAppName}
                        onChange={(e) => setCustomAppName(e.target.value)}
                        placeholder="e.g. My Great App"
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Primary Category</label>
                      <select
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none cursor-pointer"
                      >
                        <option>Productivity</option>
                        <option>Health & Fitness</option>
                        <option>Utilities</option>
                        <option>Social Networking</option>
                        <option>Business</option>
                        <option>Finance</option>
                        <option>Education</option>
                        <option>Lifestyle</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Paste Info.plist */}
              {activeTab === 'plist' && (
                <div className="space-y-4">
                  <label className="text-xs font-semibold text-slate-700">Info.plist (XML format)</label>
                  <textarea
                    value={rawPlistText}
                    onChange={(e) => setRawPlistText(e.target.value)}
                    placeholder="Paste the Info.plist XML from the build you want to inspect."
                    rows={8}
                    className="w-full font-mono text-xs rounded-xl border border-slate-300 bg-slate-50 p-3 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none"
                  ></textarea>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">App Display Name</label>
                      <input
                        type="text"
                        value={customAppName}
                        onChange={(e) => setCustomAppName(e.target.value)}
                        placeholder="e.g. My App"
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Bundle ID</label>
                      <input
                        type="text"
                        value={customBundleId}
                        onChange={(e) => setCustomBundleId(e.target.value)}
                        placeholder="com.example.app"
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {errorMsg && (
                <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </>
          )}

        </div>

        {/* Modal Footer */}
        {!isProcessing && (
          <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4 bg-slate-50">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              id="btn_run_preflight_audit"
              onClick={handleStartAnalysis}
              disabled={isProcessing}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <span>Run Preflight Audit</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
