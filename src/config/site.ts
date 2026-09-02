const configuredUrl = import.meta.env.VITE_SITE_URL?.trim().replace(/\/$/, '');

export const siteConfig = {
  name: 'Fixit',
  url: configuredUrl || 'http://localhost:3000',
  supportEmail: import.meta.env.VITE_SUPPORT_EMAIL?.trim() || '',
  analyticsEndpoint: import.meta.env.VITE_ANALYTICS_ENDPOINT?.trim() || '',
  errorReportingEndpoint: import.meta.env.VITE_ERROR_REPORTING_ENDPOINT?.trim() || '',
  legalEffectiveDate: import.meta.env.VITE_LEGAL_EFFECTIVE_DATE?.trim() || ''
};

export const isConfiguredForProduction = Boolean(
  configuredUrl && siteConfig.supportEmail && siteConfig.legalEffectiveDate
);
