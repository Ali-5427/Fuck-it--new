import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { ErrorBoundary } from './components/ErrorBoundary';
import { CookieConsent } from './components/CookieConsent';
import { ConnectionNotice } from './components/ConnectionNotice';
import { LegalPageView, NotFoundPage, ResetPasswordPage } from './components/PublicPages';
import { SiteFooter } from './components/SiteFooter';

const rootElement = document.getElementById('root');

if (rootElement) {
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  const legalPages = {
    '/privacy': 'privacy',
    '/terms': 'terms',
    '/dpa': 'dpa',
    '/cookies': 'cookies',
    '/refunds': 'refunds'
  } as const;
  const legalPage = legalPages[path as keyof typeof legalPages];
  const page = legalPage 
    ? <LegalPageView page={legalPage} /> 
    : path === '/reset-password' 
      ? <ResetPasswordPage /> 
      : path === '/' 
        ? <App /> 
        : <NotFoundPage />;

  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ErrorBoundary>
        {page}
        {path !== '/' && <SiteFooter />}
        <CookieConsent />
        <ConnectionNotice />
      </ErrorBoundary>
    </React.StrictMode>
  );
}
