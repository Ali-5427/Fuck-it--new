import { 
  NormalizedAppInspection, 
  Finding, 
  RejectionAnalysisResult, 
  AppMetadataDraft, 
  MetadataIssue,
  ScreenshotValidationResult,
  AdminStats 
} from '../types';
import { insforge } from './insforge';
import { extractFromItunesLookup } from '../engine/itunesExtractor';
import { evaluateInspection } from '../engine/evaluator';

const DEFAULT_TIMEOUT_MS = 15000;

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs: number = DEFAULT_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    return response;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error(`Request timed out after ${Math.round(timeoutMs / 1000)}s. Please check your connection and try again.`);
    }
    throw new Error(err.message || 'Network request failed. Please check your connection.');
  } finally {
    clearTimeout(timeoutId);
  }
}

export const apiClient = {
  async healthCheck() {
    const res = await fetchWithTimeout('/api/health', {}, 5000);
    if (!res.ok) throw new Error('Health check failed');
    return res.json();
  },

  async enhanceAuditWithAI(inspection: NormalizedAppInspection, findings: Finding[]) {
    try {
      const res = await fetchWithTimeout('/api/ai/correlate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inspection, findings })
      }, 15000);
      if (!res.ok) throw new Error('AI correlation failed');
      return await res.json();
    } catch (err) {
      console.warn('AI enhancement fallback to rule-based engine:', err);
      return { enhancedFindings: findings };
    }
  },

  async analyzeRejection(rejectionText: string): Promise<RejectionAnalysisResult> {
    const res = await fetchWithTimeout('/api/rejection/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rejectionText })
    }, 15000);
    if (!res.ok) throw new Error('Failed to analyze rejection message');
    return res.json();
  },

  async validateMetadata(metadata: AppMetadataDraft): Promise<{ issues: MetadataIssue[]; suggestions: string[] }> {
    const res = await fetchWithTimeout('/api/metadata/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ metadata })
    }, 15000);
    if (!res.ok) throw new Error('Failed to validate metadata');
    return res.json();
  },

  async validateScreenshot(width: number, height: number, fileName: string): Promise<ScreenshotValidationResult> {
    const res = await fetchWithTimeout('/api/screenshots/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ width, height, fileName })
    }, 10000);
    if (!res.ok) throw new Error('Failed to validate screenshot');
    return res.json();
  },

  async getAdminStats(): Promise<AdminStats> {
    const token = await insforge.getHttpClient().getValidAccessToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetchWithTimeout('/api/admin/stats', { headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to fetch admin stats (status ${res.status})`);
    }
    return res.json();
  },

  async getAdminRules() {
    const token = await insforge.getHttpClient().getValidAccessToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetchWithTimeout('/api/admin/rules', { headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to fetch admin rules (status ${res.status})`);
    }
    return res.json();
  },

  async tryNow(query: string): Promise<{ inspection: NormalizedAppInspection; auditRun: any }> {
    try {
      const res = await fetchWithTimeout('/api/try-now', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      }, 15000);
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('Server try-now fetch failed or timed out, executing direct client-side extraction:', err);
    }

    // Direct client fallback to iTunes Search API if server is unavailable or slow
    const inspection = await extractFromItunesLookup(query);
    if (!inspection) {
      throw new Error(`Could not find an active App Store listing matching "${query}". Please check the app name or URL.`);
    }

    const auditRun = evaluateInspection(
      inspection,
      `try_now_${inspection.bundleId}`,
      inspection.build,
      inspection.version,
      [],
      true,
      'LISTING_SCAN'
    );

    return { inspection, auditRun };
  },

  async saveConnectKey(issuerId: string, keyId: string, privateKeyPem: string): Promise<{ success: boolean; maskedKey: string }> {
    const token = await insforge.getHttpClient().getValidAccessToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetchWithTimeout('/api/connect/save-key', {
      method: 'POST',
      headers,
      body: JSON.stringify({ issuerId, keyId, privateKeyPem })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to save App Store Connect key.');
    }
    return res.json();
  },

  async listConnectApps(): Promise<{ connected: boolean; maskedKey?: string; apps: any[] }> {
    const token = await insforge.getHttpClient().getValidAccessToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetchWithTimeout('/api/connect/list-apps', {
      method: 'POST',
      headers
    }, 20000);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to list apps from App Store Connect.');
    }
    return res.json();
  },

  async checkConnectApp(appId: string): Promise<{ inspection: NormalizedAppInspection; auditRun: any }> {
    const token = await insforge.getHttpClient().getValidAccessToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetchWithTimeout('/api/connect/check-app', {
      method: 'POST',
      headers,
      body: JSON.stringify({ appId })
    }, 60000);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to run audit check.');
    }
    return res.json();
  },

  async removeConnectKey(): Promise<{ success: boolean }> {
    const token = await insforge.getHttpClient().getValidAccessToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetchWithTimeout('/api/connect/remove-key', {
      method: 'DELETE',
      headers
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to disconnect key.');
    }
    return res.json();
  }
};
