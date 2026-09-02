import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';
import { AuditView } from './components/AuditView';
import { SiteFooter } from './components/SiteFooter';

// Lazy-loaded secondary views & modals
const RejectionAnalyzer = lazy(() => import('./components/RejectionAnalyzer').then(m => ({ default: m.RejectionAnalyzer })));
const MetadataChecker = lazy(() => import('./components/MetadataChecker').then(m => ({ default: m.MetadataChecker })));
const ScreenshotValidator = lazy(() => import('./components/ScreenshotValidator').then(m => ({ default: m.ScreenshotValidator })));
const AdminPanel = lazy(() => import('./components/AdminPanel').then(m => ({ default: m.AdminPanel })));
const PrivacySecurityView = lazy(() => import('./components/PrivacySecurityView').then(m => ({ default: m.PrivacySecurityView })));
const UploadModal = lazy(() => import('./components/UploadModal').then(m => ({ default: m.UploadModal })));
const FindingDetailModal = lazy(() => import('./components/FindingDetailModal').then(m => ({ default: m.FindingDetailModal })));
const AuditDiffModal = lazy(() => import('./components/AuditDiffModal').then(m => ({ default: m.AuditDiffModal })));
const SubmissionReportModal = lazy(() => import('./components/SubmissionReportModal').then(m => ({ default: m.SubmissionReportModal })));
const AuthModal = lazy(() => import('./components/AuthModal').then(m => ({ default: m.AuthModal })));
const AccountModal = lazy(() => import('./components/AccountModal').then(m => ({ default: m.AccountModal })));
const ReviewChecklist = lazy(() => import('./components/ReviewChecklist').then(m => ({ default: m.ReviewChecklist })));
const PrivacyStringsModal = lazy(() => import('./components/PrivacyStringsModal').then(m => ({ default: m.PrivacyStringsModal })));
const StatusPageModal = lazy(() => import('./components/StatusPageModal').then(m => ({ default: m.StatusPageModal })));
const SupportModal = lazy(() => import('./components/SupportModal').then(m => ({ default: m.SupportModal })));

import { store } from './services/store';
import { apiClient } from './services/api';
import { Application, AuditRun, Finding, SubmissionReport, AuditComparison } from './types';
import { ShieldCheck, Loader2 } from 'lucide-react';

const ViewLoadingFallback = () => (
  <div className="flex items-center justify-center p-12 text-xs text-slate-500 font-mono">
    <Loader2 className="h-5 w-5 text-blue-600 animate-spin mr-2" />
    <span>Loading module...</span>
  </div>
);

export default function App() {
  const [, setTick] = useState(0);
  const [currentView, setCurrentView] = useState<'landing' | 'dashboard' | 'audit' | 'rejection' | 'metadata' | 'screenshots' | 'admin' | 'privacy' | 'checklist'>(() => {
    return store.getUser() ? 'dashboard' : 'landing';
  });

  // Subscribe to store updates
  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      setTick(t => t + 1);
      const currentUser = store.getUser();
      if (!currentUser && currentView !== 'landing') {
        setCurrentView('landing');
      } else if (currentUser && currentView === 'landing') {
        setCurrentView('dashboard');
      }
    });
    return unsubscribe;
  }, [currentView]);

  const user = store.getUser();
  const isAdminUser = user?.role === 'admin';

  // Guard against non-admin accessing admin view
  useEffect(() => {
    if (currentView === 'admin' && !isAdminUser) {
      setCurrentView('dashboard');
    }
  }, [currentView, isAdminUser]);
  const apps = store.getApps();
  const selectedApp = store.getSelectedApp();
  const activeAudit = store.getActiveAudit();
  const auditsHistory = selectedApp ? store.getAudits(selectedApp.id) : [];

  // Modal states
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadTargetApp, setUploadTargetApp] = useState<Application | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [authModalTier, setAuthModalTier] = useState<'free' | 'pro' | 'studio'>('pro');
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);
  const [activeDiffComparison, setActiveDiffComparison] = useState<AuditComparison | null>(null);
  const [submissionReport, setSubmissionReport] = useState<SubmissionReport | null>(null);

  // Resource, Community, Support & Status Modals
  const [checklistModalOpen, setChecklistModalOpen] = useState(false);
  const [privacyStringsModalOpen, setPrivacyStringsModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [supportModalOpen, setSupportModalOpen] = useState(false);

  // Try it now states
  const [tryNowLoading, setTryNowLoading] = useState(false);
  const [tryNowStep, setTryNowStep] = useState(0);
  const [tryNowStatusText, setTryNowStatusText] = useState('');
  const [tryNowError, setTryNowError] = useState<string | null>(null);
  const [tryNowResult, setTryNowResult] = useState<{
    app: Application;
    audit: AuditRun;
    query: string;
  } | null>(null);
  const [tryNowQuery, setTryNowQuery] = useState('');

  const handleTryNow = async (query: string) => {
    setTryNowLoading(true);
    setTryNowError(null);
    setTryNowQuery(query);

    try {
      setTryNowStep(1);
      setTryNowStatusText('Looking up your app in App Store registry...');

      const apiPromise = apiClient.tryNow(query);
      await new Promise(r => setTimeout(r, 600));

      setTryNowStep(2);
      setTryNowStatusText('Checking the listing and metadata...');
      await new Promise(r => setTimeout(r, 700));

      setTryNowStep(3);
      setTryNowStatusText('Analyzing screenshots and validation parameters...');
      await new Promise(r => setTimeout(r, 600));

      setTryNowStep(4);
      setTryNowStatusText('Running compliance rule engine...');

      const { inspection, auditRun } = await apiPromise;

      const mockApp: Application = {
        id: `try_now_${inspection.bundleId}`,
        userId: 'anonymous',
        name: inspection.appName,
        bundleId: inspection.bundleId,
        currentVersion: inspection.version,
        currentBuild: '1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        primaryCategory: inspection.metadata.category || 'Utilities',
        remainingIssuesCount: auditRun.openFindings
      };

      setTryNowResult({
        app: mockApp,
        audit: auditRun,
        query
      });
      setTryNowLoading(false);
    } catch (err: any) {
      console.error(err);
      setTryNowError(err.message || "We couldn't check that app. Please check your internet connection or spelling.");
      setTryNowLoading(false);
    }
  };

  const handleStartAudit = () => {
    setUploadModalOpen(true);
  };

  const handleOpenAuth = (mode: 'login' | 'register' | 'forgot' = 'login', tier: 'free' | 'pro' | 'studio' = 'pro') => {
    if (user) {
      setAccountModalOpen(true);
      return;
    }
    setAuthModalMode(mode);
    setAuthModalTier(tier);
    setAuthModalOpen(true);
  };

  const handleLandingStartAudit = () => {
    if (user) {
      handleStartAudit();
    } else {
      handleOpenAuth('register', 'free');
    }
  };

  const handleLandingExploreDemo = () => {
    if (user) {
      handleStartAudit();
    } else {
      handleOpenAuth('register', 'pro');
    }
  };

  const handleLandingRejectionAnalyzer = () => {
    if (user) {
      setCurrentView('rejection');
    } else {
      handleOpenAuth('login');
    }
  };

  const handleAuditCompleted = (appId: string, auditId: string, comparison?: any) => {
    store.selectApp(appId);
    store.setActiveAudit(auditId);
    setCurrentView('audit');
    if (comparison) {
      setActiveDiffComparison(comparison);
    }
  };

  const handleConnectAuditCompleted = (inspection: any, auditRun: any) => {
    const appleAppId = inspection?.rawInfo?.app?.id || inspection?.rawInfo?.appleAppId || inspection?.rawInfo?.appId;
    const appPromise = store.createApp({
      name: inspection.metadata.name,
      bundleId: inspection.bundleId,
      primaryCategory: inspection.metadata.category,
      currentVersion: inspection.version,
      currentBuild: inspection.build,
      appleAppId,
      auditType: 'CONNECT_SCAN',
      inspection,
      auditRun
    });
    appPromise.then(app => {
      store.setActiveAudit(auditRun.id);
      store.selectApp(app.id);
    });
    setAccountModalOpen(false);
    setCurrentView('audit');
  };

  const handleGenerateReport = (appId?: string) => {
    const targetAppId = appId || selectedApp?.id;
    if (!targetAppId) return;

    const report = store.generateSubmissionReport(targetAppId);
    setSubmissionReport(report);
  };

  // If user is authenticated, render real Dashboard layout with Left Sidebar
  const isAuthenticated = !!user;

  if (isAuthenticated && currentView !== 'landing') {
    return (
      <div className="h-screen overflow-hidden bg-slate-50 flex text-slate-900 selection:bg-blue-600 selection:text-white">
        {/* Left Sidebar */}
        <Sidebar
          currentView={currentView}
          onNavigate={(v) => setCurrentView(v)}
          onOpenUpload={() => setUploadModalOpen(true)}
          onOpenAccount={() => setAccountModalOpen(true)}
          onOpenChecklist={() => setChecklistModalOpen(true)}
          user={user}
          apps={apps}
          selectedApp={selectedApp}
        />

        {/* Main Content Pane */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0 h-full overflow-hidden">
          <main className="flex-1 overflow-hidden h-full min-h-0">
            {currentView === 'dashboard' && (
              <Dashboard
                user={user}
                apps={apps}
                onOpenApp={(appId) => {
                  store.selectApp(appId);
                  setCurrentView('audit');
                }}
                onCheckNewApp={() => {
                  setUploadTargetApp(null);
                  setUploadModalOpen(true);
                }}
                onCheckNewVersion={(appId) => {
                  const a = apps.find(x => x.id === appId);
                  setUploadTargetApp(a || null);
                  setUploadModalOpen(true);
                }}
                onNavigate={(view) => setCurrentView(view)}
                onTryNow={handleTryNow}
                tryNowError={tryNowError}
                isTryNowLoading={tryNowLoading}
              />
            )}

            {currentView === 'audit' && (
              <AuditView
                app={selectedApp}
                audit={activeAudit}
                auditsHistory={auditsHistory}
                onSelectFinding={(f) => setSelectedFinding(f)}
                onOpenUpload={(appId) => {
                  const a = appId ? apps.find(x => x.id === appId) : selectedApp;
                  setUploadTargetApp(a || null);
                  setUploadModalOpen(true);
                }}
                onGenerateReport={() => handleGenerateReport()}
                onOpenDiff={(comp) => setActiveDiffComparison(comp)}
              />
            )}

            {currentView === 'rejection' && (
              <Suspense fallback={<ViewLoadingFallback />}>
                <RejectionAnalyzer />
              </Suspense>
            )}

            {currentView === 'metadata' && (
              <Suspense fallback={<ViewLoadingFallback />}>
                <MetadataChecker />
              </Suspense>
            )}

            {currentView === 'screenshots' && (
              <Suspense fallback={<ViewLoadingFallback />}>
                <ScreenshotValidator />
              </Suspense>
            )}

            {currentView === 'admin' && isAdminUser && (
              <Suspense fallback={<ViewLoadingFallback />}>
                <AdminPanel />
              </Suspense>
            )}

            {currentView === 'privacy' && (
              <Suspense fallback={<ViewLoadingFallback />}>
                <PrivacySecurityView />
              </Suspense>
            )}

            {currentView === 'checklist' && (
              <Suspense fallback={<ViewLoadingFallback />}>
                <ReviewChecklist />
              </Suspense>
            )}
          </main>


        </div>

        {/* Modals */}
        <Suspense fallback={null}>
        {uploadModalOpen && (
          <UploadModal
            isOpen={uploadModalOpen}
            onClose={() => {
              setUploadModalOpen(false);
              setUploadTargetApp(null);
            }}
            onAuditCompleted={handleAuditCompleted}
            targetApp={uploadTargetApp}
          />
        )}

        {selectedFinding && (
          <FindingDetailModal
            finding={selectedFinding}
            appId={selectedApp?.id || ''}
            auditId={activeAudit?.id || ''}
            currentBuild={selectedApp?.currentBuild || '1'}
            onClose={() => setSelectedFinding(null)}
          />
        )}

        {activeDiffComparison && (
          <AuditDiffModal
            comparison={activeDiffComparison}
            appName={selectedApp?.name || 'Application'}
            onClose={() => setActiveDiffComparison(null)}
          />
        )}

        {submissionReport && (
          <SubmissionReportModal
            report={submissionReport}
            onClose={() => setSubmissionReport(null)}
          />
        )}

        {authModalOpen && (
          <AuthModal
            isOpen={authModalOpen}
            onClose={() => setAuthModalOpen(false)}
            initialMode={authModalMode}
            initialTier={authModalTier}
            onSuccess={() => setCurrentView('dashboard')}
          />
        )}

        {accountModalOpen && (
          <AccountModal
            isOpen={accountModalOpen}
            onClose={() => setAccountModalOpen(false)}
            user={user}
            onOpenAuth={() => handleOpenAuth('login')}
            onAuditApp={handleConnectAuditCompleted}
          />
        )}

        {checklistModalOpen && (
          <ReviewChecklist
            isOpen={checklistModalOpen}
            onClose={() => setChecklistModalOpen(false)}
          />
        )}

        {privacyStringsModalOpen && (
          <PrivacyStringsModal
            isOpen={privacyStringsModalOpen}
            onClose={() => setPrivacyStringsModalOpen(false)}
          />
        )}

        {statusModalOpen && (
          <StatusPageModal
            isOpen={statusModalOpen}
            onClose={() => setStatusModalOpen(false)}
          />
        )}

        {supportModalOpen && (
          <SupportModal
            isOpen={supportModalOpen}
            onClose={() => setSupportModalOpen(false)}
          />
        )}
        </Suspense>
      </div>
    );
  }

  if (tryNowLoading) {
    return (
      <div className="min-h-screen bg-white text-slate-900 flex flex-col items-center justify-center p-6 space-y-6">
        <div className="max-w-md w-full text-center space-y-4">
          <Loader2 className="h-10 w-10 text-blue-600 animate-spin mx-auto" />
          <h2 className="text-xl font-bold text-slate-900 font-mono">Running Preflight Check</h2>
          <p className="text-xs text-slate-500 font-mono">{tryNowStatusText}</p>
          
          {/* Progress bar */}
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(tryNowStep / 4) * 100}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-[10px] font-mono text-slate-400">
            <span>Query App Store</span>
            <span>Parse Listing</span>
            <span>Validate Specs</span>
            <span>Run Rules</span>
          </div>
        </div>
      </div>
    );
  }

  if (tryNowResult) {
    return (
      <div className="min-h-screen bg-white text-slate-900 flex flex-col selection:bg-blue-600 selection:text-white">
        <header className="sticky top-0 z-50 w-full transition-all">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 pt-4 pb-2">
            <div className="flex h-14 items-center justify-between rounded-full border border-slate-200/60 bg-transparent px-5 sm:px-7 backdrop-blur-[4px] shadow-xs" style={{ boxShadow: 'inset 0 1.5px 0 rgba(255, 255, 255, 0.95), 0 8px 30px rgba(0, 0, 0, 0.03)' }}>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setTryNowResult(null)}
                  className="flex items-center gap-2.5 text-left group focus:outline-none cursor-pointer"
                >
                  <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 via-blue-500 to-indigo-500 text-white shadow-md shadow-blue-500/25 group-hover:scale-105 transition-transform">
                    <ShieldCheck className="h-4.5 w-4.5 text-white" />
                  </div>
                  <span className="font-bold text-base tracking-tight text-slate-900 font-mono">Fixit</span>
                </button>
              </div>
              <button
                onClick={() => setTryNowResult(null)}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-full transition-colors cursor-pointer"
              >
                ← Back to Home
              </button>
            </div>
          </div>
        </header>
        <main className="flex-1 min-h-0">
          <AuditView
            app={tryNowResult.app}
            audit={tryNowResult.audit}
            auditsHistory={[tryNowResult.audit]}
            onSelectFinding={(f) => setSelectedFinding(f)}
            onOpenUpload={() => {}}
            onGenerateReport={() => {}}
            onOpenDiff={() => {}}
            isTryNow={true}
            onOpenAuth={handleOpenAuth}
            onTryNowRecheck={async (query) => {
              const { inspection, auditRun } = await apiClient.tryNow(query);
              const nextApp: Application = {
                ...tryNowResult.app,
                name: inspection.appName,
                bundleId: inspection.bundleId,
                currentVersion: inspection.version,
                currentBuild: '1',
                primaryCategory: inspection.metadata.category || 'Utilities',
                updatedAt: new Date().toISOString(),
                remainingIssuesCount: auditRun.openFindings
              };
              setTryNowResult({ app: nextApp, audit: auditRun, query });
            }}
            tryNowLookupQuery={tryNowQuery}
          />
        </main>

        <Suspense fallback={null}>
          {selectedFinding && (
            <FindingDetailModal
              finding={selectedFinding}
              appId={tryNowResult?.app?.id || ''}
              auditId={tryNowResult?.audit?.id || ''}
              currentBuild="1"
              onClose={() => setSelectedFinding(null)}
            />
          )}

          {authModalOpen && (
            <AuthModal
              isOpen={authModalOpen}
              onClose={() => setAuthModalOpen(false)}
              initialMode={authModalMode}
              initialTier={authModalTier}
              onSuccess={() => setCurrentView('dashboard')}
            />
          )}
        </Suspense>
      </div>
    );
  }

  // Public Landing Page view for non-authenticated or explicitly landing view
  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col selection:bg-blue-600 selection:text-white">
      
      {/* Primary Technical Navigation */}
      <Navbar
        currentView={currentView}
        onNavigate={(v) => setCurrentView(v)}
        onOpenUpload={handleLandingStartAudit}
        onOpenAuth={handleOpenAuth}
        onOpenAccount={() => setAccountModalOpen(true)}
        user={user}
        selectedApp={selectedApp}
        apps={apps}
      />

      {/* Main Content Area */}
      <main className="flex-1 min-h-0 overflow-y-auto">
        <LandingPage
          onStartAudit={handleLandingStartAudit}
          onExploreDemo={handleLandingExploreDemo}
          onOpenRejectionAnalyzer={handleLandingRejectionAnalyzer}
          onOpenAuth={handleOpenAuth}
          onOpenChecklist={() => user ? setChecklistModalOpen(true) : handleOpenAuth('register')}
          onOpenPrivacyStrings={() => user ? setPrivacyStringsModalOpen(true) : handleOpenAuth('register')}
          onOpenStatus={() => user ? setStatusModalOpen(true) : handleOpenAuth('register')}
          onOpenSupport={() => user ? setSupportModalOpen(true) : handleOpenAuth('register')}
          onTryNow={handleTryNow}
          tryNowError={tryNowError}
          isTryNowLoading={tryNowLoading}
        />
      </main>

      {/* Modals */}
      <Suspense fallback={null}>
        {uploadModalOpen && (
          <UploadModal
            isOpen={uploadModalOpen}
            onClose={() => {
              setUploadModalOpen(false);
              setUploadTargetApp(null);
            }}
            onAuditCompleted={handleAuditCompleted}
            targetApp={uploadTargetApp}
          />
        )}

        {authModalOpen && (
          <AuthModal
            isOpen={authModalOpen}
            onClose={() => setAuthModalOpen(false)}
            initialMode={authModalMode}
            initialTier={authModalTier}
            onSuccess={() => setCurrentView('dashboard')}
          />
        )}

        {accountModalOpen && (
          <AccountModal
            isOpen={accountModalOpen}
            onClose={() => setAccountModalOpen(false)}
            user={user}
            onOpenAuth={() => handleOpenAuth('login')}
            onAuditApp={handleConnectAuditCompleted}
          />
        )}

        {checklistModalOpen && (
          <ReviewChecklist
            isOpen={checklistModalOpen}
            onClose={() => setChecklistModalOpen(false)}
          />
        )}

        {privacyStringsModalOpen && (
          <PrivacyStringsModal
            isOpen={privacyStringsModalOpen}
            onClose={() => setPrivacyStringsModalOpen(false)}
          />
        )}

        {statusModalOpen && (
          <StatusPageModal
            isOpen={statusModalOpen}
            onClose={() => setStatusModalOpen(false)}
          />
        )}

        {supportModalOpen && (
          <SupportModal
            isOpen={supportModalOpen}
            onClose={() => setSupportModalOpen(false)}
          />
        )}
      </Suspense>
    </div>
  );
}
