import { siteConfig } from '../config/site';

type AnalyticsEvent = {
  name: string;
  properties?: Record<string, string | number | boolean | null>;
};

const CONSENT_KEY = 'fixit_analytics_consent';

export function hasAnalyticsConsent() {
  return localStorage.getItem(CONSENT_KEY) === 'granted';
}

export function setAnalyticsConsent(granted: boolean) {
  localStorage.setItem(CONSENT_KEY, granted ? 'granted' : 'denied');
}

export function trackEvent(event: AnalyticsEvent) {
  if (!hasAnalyticsConsent() || !siteConfig.analyticsEndpoint) return;

  void fetch(siteConfig.analyticsEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    keepalive: true,
    body: JSON.stringify({ ...event, occurredAt: new Date().toISOString(), path: window.location.pathname })
  }).catch(() => undefined);
}

export function reportClientError(error: Error, componentStack?: string | null) {
  if (!siteConfig.errorReportingEndpoint) return;

  void fetch(siteConfig.errorReportingEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    keepalive: true,
    body: JSON.stringify({
      message: error.message,
      stack: error.stack,
      componentStack,
      path: window.location.pathname,
      occurredAt: new Date().toISOString()
    })
  }).catch(() => undefined);
}
