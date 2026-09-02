import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Upload, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronRight, 
  Check, 
  RefreshCw, 
  FileText, 
  Code2, 
  Layers, 
  ArrowUpRight 
} from 'lucide-react';
import { SiteFooter } from './SiteFooter';
import { TryItNowSearch } from './TryItNowSearch';

interface LandingPageProps {
  onStartAudit: () => void;
  onExploreDemo: (appId?: string) => void;
  onOpenRejectionAnalyzer: () => void;
  onOpenAuth?: (mode?: 'login' | 'register', tier?: 'free' | 'pro' | 'studio') => void;
  onOpenChecklist?: () => void;
  onOpenPrivacyStrings?: () => void;
  onOpenStatus?: () => void;
  onOpenSupport?: () => void;
  onTryNow?: (query: string) => void;
  tryNowError?: string | null;
  isTryNowLoading?: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartAudit,
  onExploreDemo,
  onOpenRejectionAnalyzer,
  onOpenAuth,
  onOpenChecklist,
  onOpenPrivacyStrings,
  onOpenStatus,
  onOpenSupport,
  onTryNow,
  tryNowError = null,
  isTryNowLoading = false
}) => {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [selectedIssueFix, setSelectedIssueFix] = useState<'location' | 'subscription' | 'metadata' | null>(null);
  const [showRecheckSuccess, setShowRecheckSuccess] = useState(false);

  const handleSimulateRecheck = () => {
    setShowRecheckSuccess(true);
    setTimeout(() => {
      setShowRecheckSuccess(false);
    }, 4000);
  };

  const faqItems = [
    {
      q: 'What does Fixit check?',
      a: 'Fixit checks your iOS app for common App Store submission problems. This includes missing or unclear privacy messages, subscription paywall requirements, account deletion buttons, and App Store title and keyword character limits.'
    },
    {
      q: 'How do I check my app?',
      a: 'Export your app from Xcode (as a .zip, .ipa, or project folder) and upload it here. You can also upload your Info.plist or app store text directly.'
    },
    {
      q: 'Can I check my app again after fixing something?',
      a: 'Yes. After you make changes in your code or settings, run another check to make sure the problem is fixed.'
    },
    {
      q: 'What if Apple already rejected my app?',
      a: "You can paste Apple's rejection message into our Rejection Solver. We'll help you understand what went wrong and what you need to fix before submitting again."
    },
    {
      q: 'Does Fixit guarantee Apple approval?',
      a: 'No. Apple makes the final review decision. Fixit helps you find potential problems before you submit.'
    },
    {
      q: 'Who is Fixit for?',
      a: 'Fixit is built for solo developers, indie makers, and small teams shipping iOS apps who want to avoid frustrating submission delays.'
    },
    {
      q: 'What happens to my uploaded app?',
      a: 'Your app files are processed securely in a temporary sandbox to run the checks. We do not keep your source code or share your data.'
    }
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-blue-600 selection:text-white relative overflow-hidden font-sans">
      
      {/* Background ambient lighting and subtle clean grid */}
      <div className="absolute inset-0 bg-grid-pattern opacity-50 pointer-events-none"></div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-gradient-to-b from-blue-100/60 via-indigo-50/40 to-transparent blur-3xl pointer-events-none -z-10"></div>
      <div className="absolute top-[900px] right-[-10%] w-[600px] h-[600px] bg-blue-50/80 blur-3xl pointer-events-none -z-10"></div>
      <div className="absolute top-[2400px] left-[-10%] w-[500px] h-[500px] bg-indigo-50/60 blur-3xl pointer-events-none -z-10"></div>

      {/* =========================================================================
          HERO SECTION
          ========================================================================= */}
      <section className="relative pt-8 pb-10 md:pt-14 md:pb-16 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl text-center">

          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-950 leading-[1.08] max-w-4xl mx-auto">
            Check your app before <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600">
              Apple does.
            </span>
          </h1>

          {/* Supporting copy */}
          <p className="mt-4 text-base sm:text-lg lg:text-xl text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
            Upload your iOS app, find potential App Store problems, see what to fix, and check again before you submit.
          </p>

          {/* Try it now search box */}
          <TryItNowSearch
            onTryNow={onTryNow || (() => {})}
            tryNowError={tryNowError}
            isTryNowLoading={isTryNowLoading}
            className="mt-8 max-w-lg mx-auto"
          />

          {/* CTA Buttons */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              id="hero_check_app_btn"
              onClick={onStartAudit}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3.5 text-sm transition-all shadow-lg shadow-blue-600/25 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <span>Check my app</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              id="hero_see_works_btn"
              onClick={() => {
                const el = document.getElementById('how-it-works');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold px-7 py-3.5 text-sm transition-all shadow-2xs hover:text-slate-950 cursor-pointer"
            >
              <span>See how it works</span>
            </button>
          </div>

          {/* Small supporting line */}
          <p className="mt-4 text-xs text-slate-500 font-mono">
            Built for developers shipping iOS apps.
          </p>

          {/* =====================================================================
              PRODUCT DASHBOARD VISUAL (Below Hero)
              ===================================================================== */}
          <div className="mt-8 relative mx-auto max-w-4xl text-left">
            <div className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-7 shadow-xl shadow-slate-900/5">
              
              {/* Cockpit Header Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-base shadow-md shadow-blue-600/25">
                    FF
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900">FocusFlow</h3>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-mono text-slate-600 border border-slate-200">
                        Version 1.4.2
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">iOS App • Productivity</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 px-3.5 py-1.5 rounded-full">
                    <div className="h-2 w-2 rounded-full bg-blue-600 animate-pulse"></div>
                    <span className="text-xs font-bold text-blue-700 font-mono">82% Ready</span>
                  </div>

                  <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full text-amber-800 text-xs font-medium">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                    <span>3 things to fix</span>
                  </div>

                  <button
                    onClick={onStartAudit}
                    className="flex items-center gap-1.5 rounded-full bg-slate-100 hover:bg-slate-200 px-3.5 py-1.5 text-xs text-slate-700 font-medium transition-colors cursor-pointer border border-slate-200"
                  >
                    <RefreshCw className="h-3 w-3 text-slate-500" />
                    <span>Check again</span>
                  </button>
                </div>
              </div>

              {showRecheckSuccess && (
                <div className="mt-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between animate-in fade-in duration-200">
                  <div className="flex items-center gap-2 font-medium">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Recheck complete: 2 issues resolved! Readiness score increased to 94%.</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">Score +12%</span>
                </div>
              )}

              {/* Issue Cards */}
              <div className="mt-6 space-y-3">
                
                {/* Issue 1: High */}
                <div className={`p-4 rounded-2xl border transition-all ${
                  selectedIssueFix === 'location'
                    ? 'border-blue-300 bg-blue-50/40 shadow-xs'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className="rounded-md bg-rose-100 border border-rose-200 text-rose-700 px-2 py-0.5 text-[10px] font-bold font-mono uppercase tracking-wider shrink-0 mt-0.5">
                        HIGH
                      </span>
                      <div>
                        <h4 className="text-xs sm:text-sm font-semibold text-slate-900">Location permission</h4>
                        <p className="text-xs text-slate-600 mt-1">
                          Your message doesn't clearly explain why the app needs your location.
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={onStartAudit}
                      className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 shrink-0 self-start sm:self-center transition-colors cursor-pointer"
                    >
                      <span>See what to fix</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Recommendation details */}
                  {selectedIssueFix === 'location' && (
                    <div className="mt-4 pt-4 border-t border-slate-200 text-xs text-slate-700 space-y-2 animate-in fade-in duration-150">
                      <div className="font-semibold text-slate-900">Recommended fix:</div>
                      <p className="text-slate-600">
                        Update your <code className="text-blue-700 font-mono text-[11px] bg-blue-50 border border-blue-200 px-1 py-0.5 rounded">NSLocationWhenInUseUsageDescription</code> in Info.plist to specify the exact feature:
                      </p>
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 font-mono text-[11px] text-emerald-400">
                        "FocusFlow uses your location to automatically tag productivity sessions with your current workplace or campus."
                      </div>
                    </div>
                  )}
                </div>

                {/* Issue 2: Medium */}
                <div className={`p-4 rounded-2xl border transition-all ${
                  selectedIssueFix === 'subscription'
                    ? 'border-blue-300 bg-blue-50/40 shadow-xs'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className="rounded-md bg-amber-100 border border-amber-200 text-amber-800 px-2 py-0.5 text-[10px] font-bold font-mono uppercase tracking-wider shrink-0 mt-0.5">
                        MEDIUM
                      </span>
                      <div>
                        <h4 className="text-xs sm:text-sm font-semibold text-slate-900">Subscriptions</h4>
                        <p className="text-xs text-slate-600 mt-1">
                          Some subscription information needs attention.
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={onStartAudit}
                      className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 shrink-0 self-start sm:self-center transition-colors cursor-pointer"
                    >
                      <span>See what to fix</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {selectedIssueFix === 'subscription' && (
                    <div className="mt-4 pt-4 border-t border-slate-200 text-xs text-slate-700 space-y-2 animate-in fade-in duration-150">
                      <div className="font-semibold text-slate-900">Recommended fix:</div>
                      <p className="text-slate-600">
                        Add a direct link to Terms of Use (EULA) and a visible "Restore Purchases" button on your paywall screen.
                      </p>
                    </div>
                  )}
                </div>

                {/* Issue 3: Low */}
                <div className={`p-4 rounded-2xl border transition-all ${
                  selectedIssueFix === 'metadata'
                    ? 'border-blue-300 bg-blue-50/40 shadow-xs'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className="rounded-md bg-blue-100 border border-blue-200 text-blue-800 px-2 py-0.5 text-[10px] font-bold font-mono uppercase tracking-wider shrink-0 mt-0.5">
                        LOW
                      </span>
                      <div>
                        <h4 className="text-xs sm:text-sm font-semibold text-slate-900">App Store listing</h4>
                        <p className="text-xs text-slate-600 mt-1">
                          Your listing could be improved.
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={onStartAudit}
                      className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 shrink-0 self-start sm:self-center transition-colors cursor-pointer"
                    >
                      <span>See what to fix</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {selectedIssueFix === 'metadata' && (
                    <div className="mt-4 pt-4 border-t border-slate-200 text-xs text-slate-700 space-y-2 animate-in fade-in duration-150">
                      <div className="font-semibold text-slate-900">Recommended fix:</div>
                      <p className="text-slate-600">
                        Your app subtitle is 28 characters. Avoid repeating keywords that are already in your app title to save search space.
                      </p>
                    </div>
                  )}
                </div>

              </div>

              {/* Bottom interactive action */}
              <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="text-slate-500">
                  Ready to test your own build?
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={onStartAudit}
                    className="text-slate-700 hover:text-blue-600 font-medium cursor-pointer"
                  >
                    Open live demo app →
                  </button>
                  <button
                    onClick={onStartAudit}
                    className="rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    Check my app
                  </button>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* =========================================================================
          TRUST SECTION
          ========================================================================= */}
      <section className="py-7 border-y border-slate-200/80 bg-slate-50/50">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 text-center">
          <p className="text-sm font-medium text-slate-600">
            Built around Apple's published App Store Review Guidelines.
          </p>

          <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 text-xs font-mono">
            {['Guidelines', 'Privacy', 'Permissions', 'Subscriptions', 'Metadata', 'Submission'].map((cat, idx) => (
              <span 
                key={idx}
                className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-slate-700 shadow-2xs font-medium"
              >
                {cat}
              </span>
            ))}
          </div>

          <p className="mt-2.5 text-[11px] text-slate-400">
            Fixit is an independent tool and is not affiliated with or endorsed by Apple Inc.
          </p>
        </div>
      </section>

      {/* =========================================================================
          PROBLEM SECTION
          ========================================================================= */}
      <section className="py-10 md:py-16 px-4 sm:px-6 lg:px-8 border-b border-slate-200/80 bg-white">
        <div className="mx-auto max-w-5xl">
          
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-950 tracking-tight">
              Don't find out after you submit.
            </h2>
            <p className="mt-4 text-slate-600 text-sm sm:text-base">
              Waiting days for an Apple rejection email slows down your release. Check your app first.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            
            {/* The Traditional Way */}
            <div className="rounded-3xl border border-slate-200 bg-slate-50/50 p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-rose-600">
                    TRADITIONAL PROCESS
                  </span>
                  <span className="text-xs text-slate-500">Slow & frustrating</span>
                </div>

                <div className="mt-6 space-y-4">
                  {[
                    { label: 'BUILD', desc: 'Write code in Xcode' },
                    { label: 'TEST', desc: 'Test on simulator and device' },
                    { label: 'SUBMIT', desc: 'Upload to App Store Connect' },
                    { label: 'APPLE FINDS A PROBLEM', desc: 'Wait days, then get rejected by Apple', alert: true },
                    { label: 'FIX', desc: 'Figure out what Apple meant' },
                    { label: 'SUBMIT AGAIN', desc: 'Wait in line for review all over again' }
                  ].map((step, idx) => (
                    <div key={idx} className="flex items-start gap-3.5">
                      <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold font-mono ${
                        step.alert 
                          ? 'bg-rose-100 text-rose-700 border border-rose-200' 
                          : 'bg-slate-200 text-slate-600'
                      }`}>
                        {idx + 1}
                      </div>
                      <div>
                        <div className={`text-xs font-bold font-mono ${step.alert ? 'text-rose-600' : 'text-slate-800'}`}>
                          {step.label}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">{step.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* The Fixit Way */}
            <div className="rounded-3xl border-2 border-blue-600 bg-gradient-to-b from-blue-50/40 to-white p-6 sm:p-8 flex flex-col justify-between relative shadow-xl shadow-blue-600/10">
              <div className="absolute -top-3 right-6 rounded-full bg-blue-600 text-white font-mono text-[10px] font-bold px-3 py-0.5 uppercase tracking-wider shadow-md shadow-blue-600/30">
                FASTER WORKFLOW
              </div>

              <div>
                <div className="flex items-center justify-between pb-4 border-b border-blue-200">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-700">
                    WITH Fixit
                  </span>
                  <span className="text-xs text-blue-600 font-medium">Clean & fast</span>
                </div>

                <div className="mt-6 space-y-4">
                  {[
                    { label: 'UPLOAD', desc: 'Add your iOS app binary or Xcode project' },
                    { label: 'CHECK', desc: 'Scan for potential guideline problems instantly' },
                    { label: 'FIX', desc: 'See what is wrong and exactly what to change' },
                    { label: 'CHECK AGAIN', desc: 'Make sure your fixes solved the issue' },
                    { label: 'SUBMIT', desc: 'Send to Apple with confidence' }
                  ].map((step, idx) => (
                    <div key={idx} className="flex items-start gap-3.5 p-2.5 rounded-xl bg-white border border-blue-200/80 shadow-2xs">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white text-[11px] font-bold font-mono">
                        ✓
                      </div>
                      <div>
                        <div className="text-xs font-bold font-mono text-blue-900">
                          {step.label}
                        </div>
                        <div className="text-xs text-slate-600 mt-0.5">{step.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-blue-200 flex items-center justify-between">
                <span className="text-xs text-slate-600 font-medium">Avoid repeat rejection cycles</span>
                <button
                  onClick={onStartAudit}
                  className="rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  Check my app →
                </button>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* =========================================================================
          HOW IT WORKS (4 Simple Steps)
          ========================================================================= */}
      <section id="how-it-works" className="py-10 md:py-16 px-4 sm:px-6 lg:px-8 border-b border-slate-200/80 bg-slate-50/40">
        <div className="mx-auto max-w-5xl">
          
          <div className="text-center max-w-2xl mx-auto mb-8">
            <span className="text-xs font-mono font-bold text-blue-600 uppercase tracking-widest">HOW IT WORKS</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-950 tracking-tight mt-2">
              Four simple steps.
            </h2>
            <p className="mt-3 text-slate-600 text-sm sm:text-base">
              From export to submission in minutes.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Step 1 */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 flex flex-col justify-between hover:border-blue-300 hover:shadow-md transition-all">
              <div>
                <div className="text-3xl font-black font-mono text-blue-600/30 mb-3">01</div>
                <div className="text-sm font-bold text-slate-900 font-mono uppercase tracking-wider">UPLOAD</div>
                <p className="mt-3 text-xs text-slate-600 leading-relaxed font-medium">
                  Add your iOS app.
                </p>
              </div>
              <p className="mt-6 text-[11px] text-slate-400">Upload .ipa, .zip, or project folder</p>
            </div>

            {/* Step 2 */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 flex flex-col justify-between hover:border-blue-300 hover:shadow-md transition-all">
              <div>
                <div className="text-3xl font-black font-mono text-blue-600/30 mb-3">02</div>
                <div className="text-sm font-bold text-slate-900 font-mono uppercase tracking-wider">CHECK</div>
                <p className="mt-3 text-xs text-slate-600 leading-relaxed font-medium">
                  We look for potential problems.
                </p>
              </div>
              <p className="mt-6 text-[11px] text-slate-400">Scans permissions, paywalls & metadata</p>
            </div>

            {/* Step 3 */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 flex flex-col justify-between hover:border-blue-300 hover:shadow-md transition-all">
              <div>
                <div className="text-3xl font-black font-mono text-blue-600/30 mb-3">03</div>
                <div className="text-sm font-bold text-slate-900 font-mono uppercase tracking-wider">FIX</div>
                <p className="mt-3 text-xs text-slate-600 leading-relaxed font-medium">
                  See what's wrong and what you should change.
                </p>
              </div>
              <p className="mt-6 text-[11px] text-slate-400">Clear recommendations for your code</p>
            </div>

            {/* Step 4 */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 flex flex-col justify-between hover:border-blue-300 hover:shadow-md transition-all">
              <div>
                <div className="text-3xl font-black font-mono text-blue-600/30 mb-3">04</div>
                <div className="text-sm font-bold text-slate-900 font-mono uppercase tracking-wider">CHECK AGAIN</div>
                <p className="mt-3 text-xs text-slate-600 leading-relaxed font-medium">
                  Make sure your changes fixed the problem.
                </p>
              </div>
              <p className="mt-6 text-[11px] text-slate-400">Verify before sending to Apple</p>
            </div>

          </div>

          <div className="mt-6 text-center">
            <p className="text-sm font-semibold text-slate-700">
              Submit with confidence.
            </p>
          </div>

        </div>
      </section>

      {/* =========================================================================
          FEATURES SECTION (6 Simple Feature Cards)
          ========================================================================= */}
      <section id="product-showcase" className="py-10 md:py-16 px-4 sm:px-6 lg:px-8 border-b border-slate-200/80 bg-white">
        <div className="mx-auto max-w-5xl">
          
          <div className="text-center max-w-2xl mx-auto mb-8">
            <span className="text-xs font-mono font-bold text-blue-600 uppercase tracking-widest">FEATURES</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-950 tracking-tight mt-2">
              Everything you need to check your app.
            </h2>
            <p className="mt-3 text-slate-600 text-sm sm:text-base">
              Built specifically for iOS developers shipping on the App Store.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Feature 1 */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 hover:border-blue-300 hover:shadow-md transition-all">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 mb-4">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Check your app</h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Find potential problems before submission.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 hover:border-blue-300 hover:shadow-md transition-all">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-200 mb-4">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Understand what's wrong</h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                See the problem and why it matters.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 hover:border-blue-300 hover:shadow-md transition-all">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 mb-4">
                <Code2 className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Know what to fix</h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Get a clear recommendation.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 hover:border-blue-300 hover:shadow-md transition-all">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600 border border-cyan-200 mb-4">
                <RefreshCw className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Check again</h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Run another check after making changes.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 hover:border-blue-300 hover:shadow-md transition-all">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 mb-4">
                <FileText className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Review a rejection</h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Already received a rejection? Paste Apple's message and understand what you need to do next.
              </p>
              <button
                onClick={onOpenRejectionAnalyzer}
                className="mt-3 text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1 cursor-pointer"
              >
                <span>Open rejection solver</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            {/* Feature 6 */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 hover:border-blue-300 hover:shadow-md transition-all">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 border border-purple-200 mb-4">
                <Layers className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Keep your reports</h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Save your check history and review reports for each app release.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* =========================================================================
          LARGE PRODUCT SHOWCASE
          ========================================================================= */}
      <section className="py-10 md:py-16 px-4 sm:px-6 lg:px-8 border-b border-slate-200/80 bg-slate-50/40">
        <div className="mx-auto max-w-5xl">
          
          <div className="text-center max-w-2xl mx-auto mb-8">
            <span className="text-xs font-mono font-bold text-blue-600 uppercase tracking-widest">REAL WORKSPACE</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight mt-2">
              Clean dashboard. No clutter.
            </h2>
            <p className="mt-3 text-slate-600 text-sm">
              See issues ranked by severity with clear code fixes and instant recheck.
            </p>
          </div>

          {/* Interactive Workspace Card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xl shadow-slate-900/5">
            
            {/* Top row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-6 border-b border-slate-100">
              <div>
                <div className="text-[11px] font-mono text-slate-400 uppercase">App Name</div>
                <div className="text-sm font-bold text-slate-900 mt-0.5">FocusFlow</div>
              </div>

              <div>
                <div className="text-[11px] font-mono text-slate-400 uppercase">Version</div>
                <div className="text-sm font-bold text-slate-700 mt-0.5 font-mono">1.4.2 (Build 12)</div>
              </div>

              <div>
                <div className="text-[11px] font-mono text-slate-400 uppercase">Readiness</div>
                <div className="text-sm font-bold text-blue-600 mt-0.5 font-mono">82% Pass</div>
              </div>

              <div>
                <div className="text-[11px] font-mono text-slate-400 uppercase">Action</div>
                <button
                  onClick={onStartAudit}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 mt-0.5 flex items-center gap-1 cursor-pointer"
                >
                  <span>Explore full app</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Severity List */}
            <div className="mt-6 space-y-3">
              <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                Recommended Fixes
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-rose-100 text-rose-700 text-[10px] font-bold font-mono px-2 py-0.5 border border-rose-200">
                      HIGH
                    </span>
                    <span className="text-xs font-bold text-slate-900">Privacy purpose string clarification</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Clarify why user location is accessed in Info.plist before submitting.
                  </p>
                </div>
                <span className="text-xs font-mono text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 shrink-0 font-semibold">
                  Fix available
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-amber-100 text-amber-800 text-[10px] font-bold font-mono px-2 py-0.5 border border-amber-200">
                      MEDIUM
                    </span>
                    <span className="text-xs font-bold text-slate-900">Paywall EULA link missing</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Add Terms of Use hyperlink directly on your in-app purchase screen.
                  </p>
                </div>
                <span className="text-xs font-mono text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 shrink-0 font-semibold">
                  Fix available
                </span>
              </div>
            </div>

            {/* Recheck footer */}
            <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Fix in Xcode, then click recheck to verify.
              </span>
              <button
                onClick={onStartAudit}
                className="flex items-center gap-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 transition-colors cursor-pointer shadow-xs"
              >
                <Upload className="h-3.5 w-3.5" />
                <span>Upload your app</span>
              </button>
            </div>

          </div>

        </div>
      </section>

      {/* =========================================================================
          SOLO DEVELOPER SECTION
          ========================================================================= */}
      <section className="py-10 md:py-16 px-4 sm:px-6 lg:px-8 border-b border-slate-200/80 bg-white">
        <div className="mx-auto max-w-4xl text-center">
          
          <span className="text-xs font-mono font-bold text-blue-600 uppercase tracking-widest">FOR INDIE BUILDERS</span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-950 tracking-tight mt-2">
            Built for developers who build alone.
          </h2>
          
          <p className="mt-3 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
            You shouldn't need to become an App Store expert just to ship your app.
          </p>

          {/* Simple step list */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
            {[
              'Build your app.',
              'Upload it.',
              'Check it.',
              'Fixit.',
              'Submit it.'
            ].map((stepText, idx) => (
              <div 
                key={idx}
                className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs sm:text-sm font-medium text-slate-800 shadow-2xs"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white text-[10px] font-bold font-mono">
                  {idx + 1}
                </span>
                <span>{stepText}</span>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* =========================================================================
          PRICING SECTION
          ========================================================================= */}
      <section id="pricing" className="py-10 md:py-16 px-4 sm:px-6 lg:px-8 border-b border-slate-200/80 bg-slate-50/40">
        <div className="mx-auto max-w-5xl">
          
          <div className="text-center max-w-2xl mx-auto mb-8">
            <span className="text-xs font-mono font-bold text-blue-600 uppercase tracking-widest">PRICING</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-950 tracking-tight mt-2">
              Simple, transparent pricing.
            </h2>
            <p className="mt-3 text-slate-600 text-sm sm:text-base">
              Start free, check your first app, and upgrade when shipping regularly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            
            {/* Starter Plan */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 flex flex-col justify-between shadow-sm">
              <div>
                <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">STARTER</div>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-slate-900 font-mono">$0</span>
                  <span className="text-xs text-slate-500">/ month</span>
                </div>
                <p className="mt-3 text-xs text-slate-600">
                  Free base tier after your 30-day Pro trial ends.
                </p>

                <div className="my-6 border-t border-slate-100"></div>

                <div className="text-xs font-bold text-slate-800 mb-3">What do I get?</div>
                <ul className="space-y-3 text-xs text-slate-600">
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-blue-600 shrink-0" /> 1 Active iOS app</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-blue-600 shrink-0" /> 3 checks / month</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-blue-600 shrink-0" /> Privacy & permission checks</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-blue-600 shrink-0" /> App Store listing check</li>
                </ul>
              </div>

              <button
                onClick={onStartAudit}
                className="mt-8 w-full rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold py-2.5 text-xs transition-all cursor-pointer shadow-2xs"
              >
                Get Started Free
              </button>
            </div>

            {/* Pro Plan (Most Popular) */}
            <div className="rounded-3xl border-2 border-blue-600 bg-gradient-to-b from-blue-50/40 to-white p-6 sm:p-8 flex flex-col justify-between relative shadow-xl shadow-blue-600/15">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 text-white font-mono text-[10px] font-bold px-3 py-0.5 tracking-wider uppercase shadow-md shadow-blue-600/30 animate-pulse">
                30 DAYS FREE ON SIGNUP
              </div>

              <div>
                <div className="text-xs font-mono font-bold uppercase tracking-wider text-blue-700">PRO DEVELOPER</div>
                <div className="mt-3 flex flex-col items-start gap-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-slate-950 font-mono">$19</span>
                    <span className="text-xs text-slate-500">/ month</span>
                  </div>
                  <span className="mt-1 px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold font-mono">
                    First 30 days free on signup
                  </span>
                </div>
                <p className="mt-3 text-xs text-slate-600">
                  For developers actively shipping and updating apps.
                </p>

                <div className="my-6 border-t border-blue-100"></div>

                <div className="text-xs font-bold text-slate-900 mb-3">What do I get?</div>
                <ul className="space-y-3 text-xs text-slate-700">
                  <li className="flex items-center gap-2 font-semibold text-blue-900"><Check className="h-4 w-4 text-blue-600 shrink-0" /> Unlimited apps</li>
                  <li className="flex items-center gap-2 font-semibold text-blue-900"><Check className="h-4 w-4 text-blue-600 shrink-0" /> Unlimited checks</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-blue-600 shrink-0" /> Rejection solver & appeal helper</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-blue-600 shrink-0" /> Before / after check comparison</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-blue-600 shrink-0" /> Downloadable reports</li>
                </ul>
              </div>

              <button
                onClick={() => onOpenAuth ? onOpenAuth('register', 'pro') : onStartAudit()}
                className="mt-8 w-full rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 text-xs transition-all shadow-md shadow-blue-600/30 cursor-pointer"
              >
                Start with Pro
              </button>
            </div>

            {/* Studio Plan */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 flex flex-col justify-between shadow-sm">
              <div>
                <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">STUDIO</div>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-slate-900 font-mono">$49</span>
                  <span className="text-xs text-slate-500">/ month</span>
                </div>
                <p className="mt-3 text-xs text-slate-600">
                  For small teams and client studios shipping multiple apps.
                </p>

                <div className="my-6 border-t border-slate-100"></div>

                <div className="text-xs font-bold text-slate-800 mb-3">What do I get?</div>
                <ul className="space-y-3 text-xs text-slate-600">
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-blue-600 shrink-0" /> Everything in Pro</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-blue-600 shrink-0" /> Team seats</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-blue-600 shrink-0" /> Reviewer notes generator</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-blue-600 shrink-0" /> Priority check queue</li>
                </ul>
              </div>

              <button
                onClick={() => onOpenAuth ? onOpenAuth('register', 'studio') : onStartAudit()}
                className="mt-8 w-full rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold py-2.5 text-xs transition-all cursor-pointer shadow-2xs"
              >
                Start Studio
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          FAQ SECTION
          ========================================================================= */}
      <section id="faq" className="py-10 md:py-16 px-4 sm:px-6 lg:px-8 border-b border-slate-200/80 bg-white">
        <div className="mx-auto max-w-3xl">
          
          <div className="text-center max-w-2xl mx-auto mb-8">
            <span className="text-xs font-mono font-bold text-blue-600 uppercase tracking-widest">FAQ</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight mt-2">
              Frequently asked questions.
            </h2>
            <p className="mt-3 text-slate-600 text-sm">
              Short answers to common questions.
            </p>
          </div>

          <div className="space-y-3">
            {faqItems.map((item, idx) => (
              <div 
                key={idx}
                className="rounded-2xl border border-slate-200 bg-slate-50/60 overflow-hidden transition-all"
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-5 text-left text-sm font-semibold text-slate-900 hover:text-blue-600 transition-colors cursor-pointer"
                >
                  <span>{item.q}</span>
                  <ChevronRight className={`h-4 w-4 text-slate-400 transition-transform ${activeFaq === idx ? 'rotate-90 text-blue-600' : ''}`} />
                </button>

                {activeFaq === idx && (
                  <div className="px-5 pb-5 text-xs text-slate-600 leading-relaxed border-t border-slate-200/80 pt-3">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* =========================================================================
          FINAL CALL TO ACTION
          ========================================================================= */}
      <section className="py-10 md:py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-50/60 to-white relative overflow-hidden border-b border-slate-200/80">
        <div className="mx-auto max-w-4xl text-center relative z-10">
          
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-950 tracking-tight leading-tight">
            Before you send your app to Apple, check it first.
          </h2>
          
          <p className="mt-3 text-base sm:text-lg text-slate-600 max-w-xl mx-auto">
            Find problems. Fix them. Check again. Submit.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onStartAudit}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3.5 text-sm transition-all shadow-lg shadow-blue-600/25 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <span>Check my app</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              onClick={() => {
                const el = document.getElementById('how-it-works');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold px-7 py-3.5 text-sm transition-all shadow-2xs hover:text-slate-950 cursor-pointer"
            >
              <span>See how it works</span>
            </button>
          </div>

        </div>
      </section>

      {/* =========================================================================
          FOOTER — shared SiteFooter component
          ========================================================================= */}
      <SiteFooter
        onStartAudit={onStartAudit}
        onOpenRejectionAnalyzer={onOpenRejectionAnalyzer}
        onOpenChecklist={onOpenChecklist}
        onOpenPrivacyStrings={onOpenPrivacyStrings}
        onOpenStatus={onOpenStatus}
        onOpenSupport={onOpenSupport}
        onOpenAuth={onOpenAuth as any}
      />

    </div>
  );
};

