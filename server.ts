import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { 
  enhanceAuditWithAI, 
  analyzeAppleRejectionWithAI, 
  analyzeMetadataWithAI 
} from './src/server/geminiService.js';
import { APP_STORE_RULES } from './src/engine/rules.js';
import { APPLE_GUIDELINE_SOURCES } from './src/engine/appleSources.js';
import { extractFromItunesLookup } from './src/engine/itunesExtractor.js';
import { evaluateInspection } from './src/engine/evaluator.js';
import { APP_STORE_SCREENSHOT_SIZES } from './src/engine/extractor.js';
import { ADMIN_EMAILS } from './src/config/admin.js';
import { createClient } from '@insforge/sdk';
import { 
  generateAppStoreConnectJWT, 
  fetchAppsFromConnect, 
  fetchAppDetails, 
  testAppStoreConnectCredentials,
  encryptKey, 
  decryptKey 
} from './src/server/appStoreConnect.js';
import { extractFromAppStoreConnect } from './src/engine/appStoreConnectExtractor.js';

dotenv.config();
dotenv.config({ path: '.env.local' });


process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED', reason);
});

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT', err);
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface RateLimitRecord {
  count: number;
  resetTime: number;
}
const rateLimitCache = new Map<string, RateLimitRecord>();

function getClientIdentity(req: Request) {
  const userId = (req as any).user?.id;
  if (userId) return `user:${String(userId)}`;

  const forwardedFor = req.headers['x-forwarded-for'];
  const forwardedIp = Array.isArray(forwardedFor)
    ? forwardedFor[0]
    : typeof forwardedFor === 'string'
      ? forwardedFor.split(',')[0].trim()
      : '';

  return forwardedIp || req.socket?.remoteAddress || req.ip || 'unknown';
}

function rateLimiter(req: Request, res: Response, next: () => void) {
  const ip = getClientIdentity(req);
  const now = Date.now();
  const limit = 10;
  const timeframe = 60 * 60 * 1000; // 1 hour

  const record = rateLimitCache.get(ip);
  if (!record) {
    rateLimitCache.set(ip, { count: 1, resetTime: now + timeframe });
    return next();
  }

  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + timeframe;
    return next();
  }

  if (record.count >= limit) {
    return res.status(429).json({ error: 'Too many requests. Please try again in an hour.' });
  }

  record.count++;
  next();
}

  const getInsforgeConfig = () => {
    const baseUrl = process.env.VITE_INSFORGE_BASE_URL;
    const anonKey = process.env.VITE_INSFORGE_ANON_KEY;

    if (!baseUrl || !anonKey) {
      throw new Error('Missing VITE_INSFORGE_BASE_URL or VITE_INSFORGE_ANON_KEY configuration.');
    }

    return { baseUrl, anonKey };
  };

  const getConnectSecret = () => {
    const secret = process.env.CONNECT_KEY_ENCRYPTION_SECRET;
    if (!secret || !secret.trim()) {
      if (process.env.NODE_ENV === 'production' || process.env.VERCEL === '1') {
        throw new Error('CONNECT_KEY_ENCRYPTION_SECRET is required in production.');
      }
      throw new Error('CONNECT_KEY_ENCRYPTION_SECRET is not configured.');
    }
    return secret;
  };

  const userAuthMiddleware = async (req: Request, res: Response, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: Missing or invalid authentication token.' });
    }

    const token = authHeader.substring(7);
    let baseUrl: string;
    let anonKey: string;
    try {
      ({ baseUrl, anonKey } = getInsforgeConfig());
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Server auth configuration is missing.' });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(`${baseUrl}/api/auth/sessions/current`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-api-key': anonKey,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        return res.status(401).json({ error: 'Unauthorized: Invalid session token.' });
      }

      const data = (await response.json()) as any;
      const user = data?.user;

      if (!user || !user.id) {
        return res.status(401).json({ error: 'Unauthorized: Invalid user.' });
      }

      (req as any).user = user;
      (req as any).token = token;
      next();
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error('[REDACTED] User verification failed:', err.message);
      return res.status(401).json({ error: 'Unauthorized: Session verification failed.' });
    }
  };

export function createServerApp() {
  const app = express();

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // 1. Health Check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      geminiConfigured: !!process.env.GEMINI_API_KEY
    });
  });

  // 4. AI Enhancement
  app.post('/api/ai/correlate', userAuthMiddleware, async (req: Request, res: Response) => {
    const { inspection, findings } = req.body;
    if (!inspection || !findings) {
      return res.status(400).json({ error: 'Missing inspection or findings payload' });
    }

    try {
      const result = await enhanceAuditWithAI(inspection, findings);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'AI correlation failed' });
    }
  });

  // 5. Rejection Analyzer
  app.post('/api/rejection/analyze', userAuthMiddleware, async (req: Request, res: Response) => {
    const { rejectionText } = req.body;
    if (typeof rejectionText !== 'string' || rejectionText.trim() === '') {
      return res.status(400).json({ error: 'Rejection text must be a non-empty string' });
    }

    try {
      const result = await analyzeAppleRejectionWithAI(rejectionText);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Rejection analysis failed' });
    }
  });

  // 6. Metadata Checker
  app.post('/api/metadata/validate', userAuthMiddleware, async (req: Request, res: Response) => {
    const { metadata } = req.body;
    if (!metadata) {
      return res.status(400).json({ error: 'Metadata payload required' });
    }

    try {
      const result = await analyzeMetadataWithAI(metadata);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Metadata validation failed' });
    }
  });

  app.post('/api/try-now', rateLimiter, async (req: Request, res: Response) => {
    const { query } = req.body;
    if (typeof query !== 'string' || query.trim() === '') {
      return res.status(400).json({ error: 'Please enter a valid app name or App Store link.' });
    }

    try {
      const inspection = await extractFromItunesLookup(query);
      if (!inspection) {
        return res.status(404).json({ error: "We couldn't find that app on the App Store. Make sure it's spelled correctly or try using the direct App Store URL/ID." });
      }

      // Run listing-only rules
      const auditRun = evaluateInspection(
        inspection,
        `try_now_${inspection.bundleId}`,
        '1',
        inspection.version,
        [],
        true // isListingOnly = true
      );

      res.json({
        inspection,
        auditRun
      });
    } catch (err: any) {
      console.error('Try-now error:', err);
      if (err.message === 'TIMEOUT' || err.message === 'NETWORK_ERROR') {
        return res.status(503).json({ error: "Couldn't reach the App Store right now, try again in a moment." });
      }
      res.status(500).json({ error: err.message || 'Failed to check app' });
    }
  });

  // 7. Screenshots Validator
  app.post('/api/screenshots/validate', (req: Request, res: Response) => {
    const { width, height, fileName } = req.body;

    if (typeof width !== 'number' || typeof height !== 'number' || isNaN(width) || isNaN(height)) {
      return res.status(400).json({ 
        error: 'Invalid screenshot dimensions. Both width and height must be valid numbers.' 
      });
    }

    const issues: string[] = [];
    const warnings: string[] = [];
    let matchedDevice = 'Unknown';
    let isValidDimension = false;

    const validSizes = APP_STORE_SCREENSHOT_SIZES.map(size => ({
      name: size.label,
      w: size.width,
      h: size.height
    }));

    const match = validSizes.find(
      s => (s.w === width && s.h === height) || (s.w === height && s.h === width)
    );

    if (match) {
      matchedDevice = match.name;
      isValidDimension = true;
    } else {
      issues.push(`Dimensions ${width}x${height} do not match Apple App Store Connect specifications.`);
    }

    if (width < 1000 || height < 1000) {
      warnings.push('Image resolution may appear pixelated on high-DPI Retina displays.');
    }

    res.json({
      fileName: fileName || 'screenshot.png',
      width,
      height,
      matchedDevice,
      isValidDimension,
      issues,
      warnings
    });
  });

  // Connect Rate Limiter Cache
  const connectRateLimitCache = new Map<string, { count: number; resetTime: number }>();

  function connectRateLimiter(req: Request, res: Response, next: () => void) {
    const ip = getClientIdentity(req);
    const now = Date.now();
    const limit = 60; // 60 requests per hour
    const timeframe = 60 * 60 * 1000;

    const record = connectRateLimitCache.get(ip);
    if (!record) {
      connectRateLimitCache.set(ip, { count: 1, resetTime: now + timeframe });
      return next();
    }

    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + timeframe;
      return next();
    }

    if (record.count >= limit) {
      return res.status(429).json({ error: 'Too many connection attempts. Please try again later.' });
    }

    record.count++;
    next();
  }

  // App Store Connect APIs
  app.post('/api/connect/save-key', userAuthMiddleware, connectRateLimiter, async (req: Request, res: Response) => {
    const { issuerId, keyId, privateKeyPem } = req.body;
    if (!issuerId || !keyId || !privateKeyPem) {
      return res.status(400).json({ error: 'Issuer ID, Key ID, and Private Key (PEM) are required.' });
    }

    let secret: string;
    try {
      secret = getConnectSecret();
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Connect key encryption is not configured for this environment.' });
    }

    const user = (req as any).user;
    const token = (req as any).token;

    try {
      // 1. Immediately verify credentials against Apple before saving
      let testResult: { success: boolean; appCount: number };
      try {
        testResult = await testAppStoreConnectCredentials(issuerId, keyId, privateKeyPem);
      } catch (authErr: any) {
        console.error('Apple Connect auth verification failed:', authErr.message);
        return res.status(400).json({ 
          error: authErr.message || 'Apple authentication failed. Please verify your Issuer ID, Key ID, and .p8 private key file.' 
        });
      }

      // 2. Encrypt PEM
      const encryptedPem = encryptKey(privateKeyPem, secret);

      const userClient = createClient({
        baseUrl: process.env.VITE_INSFORGE_BASE_URL || '',
        anonKey: process.env.VITE_INSFORGE_ANON_KEY || '',
        isServerMode: true
      });
      userClient.setAuthToken(token);

      // 3. Clean existing key for user and save verified key
      await userClient.database.from('app_store_connect_keys').delete().eq('user_id', user.id);
      const { error } = await userClient.database.from('app_store_connect_keys').insert([{
        user_id: user.id,
        issuer_id: issuerId.trim(),
        key_id: keyId.trim(),
        encrypted_pem: encryptedPem
      }]);

      if (error) {
        console.error('Error storing key:', error.message);
        return res.status(500).json({ error: 'Failed to save connection details to database.' });
      }

      res.json({
        success: true,
        keyId: keyId.trim(),
        issuerId: issuerId.trim(),
        appCount: testResult.appCount,
        maskedKey: `Key ending in ...${keyId.trim().slice(-4)}`
      });
    } catch (err: any) {
      console.error('Save key error:', err.message);
      res.status(500).json({ error: err.message || 'An unexpected error occurred while saving the key.' });
    }
  });

  app.post('/api/connect/list-apps', userAuthMiddleware, connectRateLimiter, async (req: Request, res: Response) => {
    let secret: string;
    try {
      secret = getConnectSecret();
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Connect key encryption is not configured for this environment.' });
    }

    const user = (req as any).user;
    const token = (req as any).token;

    try {
      const { baseUrl, anonKey } = getInsforgeConfig();
      const userClient = createClient({
        baseUrl,
        anonKey,
        isServerMode: true
      });
      userClient.setAuthToken(token);

      const { data, error } = await userClient.database
        .from('app_store_connect_keys')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Fetch key failed:', error.message);
        return res.status(500).json({ error: 'Failed to read connection details.' });
      }

      if (!data) {
        return res.json({ apps: [], connected: false });
      }

      const decryptedPem = decryptKey(data.encrypted_pem, secret);
      const jwt = generateAppStoreConnectJWT(data.issuer_id, data.key_id, decryptedPem);

      const apps = await fetchAppsFromConnect(jwt);
      res.json({
        connected: true,
        maskedKey: `Key ending in ...${data.key_id.slice(-4)}`,
        apps: apps.map((a: any) => ({
          id: a.id,
          name: a.attributes?.name || 'App',
          bundleId: a.attributes?.bundleId || 'N/A',
          sku: a.attributes?.sku || 'N/A',
          primaryLocale: a.attributes?.primaryLocale || 'en-US'
        }))
      });
    } catch (err: any) {
      console.error('List apps error:', err.message);
      res.status(500).json({ error: err.message || 'Failed to list apps from App Store Connect.' });
    }
  });

  app.post('/api/connect/check-app', userAuthMiddleware, connectRateLimiter, async (req: Request, res: Response) => {
    const { appId } = req.body;
    if (!appId) {
      return res.status(400).json({ error: 'appId parameter is required.' });
    }

    let secret: string;
    try {
      secret = getConnectSecret();
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Connect key encryption is not configured for this environment.' });
    }

    const user = (req as any).user;
    const token = (req as any).token;

    try {
      const { baseUrl, anonKey } = getInsforgeConfig();
      const userClient = createClient({
        baseUrl,
        anonKey,
        isServerMode: true
      });
      userClient.setAuthToken(token);

      const { data, error } = await userClient.database
        .from('app_store_connect_keys')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error || !data) {
        return res.status(404).json({ error: 'App Store Connect credentials not found. Please connect your key in Account Settings.' });
      }

      const decryptedPem = decryptKey(data.encrypted_pem, secret);
      const jwt = generateAppStoreConnectJWT(data.issuer_id, data.key_id, decryptedPem);

      const details = await fetchAppDetails(jwt, appId);
      const inspection = extractFromAppStoreConnect(details);

      const auditRun = evaluateInspection(
        inspection,
        `connect_${inspection.bundleId}`,
        '1',
        inspection.version,
        [],
        true // isListingOnly = true
      );

      res.json({
        inspection,
        auditRun
      });
    } catch (err: any) {
      console.error('Check app error:', err.message);
      res.status(500).json({ error: err.message || 'Failed to check app details from App Store Connect.' });
    }
  });

  app.delete('/api/connect/remove-key', userAuthMiddleware, connectRateLimiter, async (req: Request, res: Response) => {
    const user = (req as any).user;
    const token = (req as any).token;

    try {
      const { baseUrl, anonKey } = getInsforgeConfig();
      const userClient = createClient({
        baseUrl,
        anonKey,
        isServerMode: true
      });
      userClient.setAuthToken(token);

      const { error } = await userClient.database
        .from('app_store_connect_keys')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        console.error('[REDACTED] Delete key failed:', error.message);
        return res.status(500).json({ error: 'Failed to delete App Store Connect key.' });
      }

      res.json({ success: true });
    } catch (err: any) {
      console.error('[REDACTED] Delete key error:', err.message);
      res.status(500).json({ error: 'An unexpected error occurred.' });
    }
  });

  const adminAuthMiddleware = async (req: Request, res: Response, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(403).json({ error: 'Forbidden: Missing or invalid authentication token.' });
    }

    const token = authHeader.substring(7);

    const baseUrl = process.env.VITE_INSFORGE_BASE_URL!;
    const anonKey = process.env.VITE_INSFORGE_ANON_KEY!;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(`${baseUrl}/api/auth/sessions/current`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-api-key': anonKey,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        return res.status(403).json({ error: 'Forbidden: Invalid user token.' });
      }

      const data = (await response.json()) as any;
      const user = data?.user;

      if (!user || !user.email) {
        return res.status(403).json({ error: 'Forbidden: Invalid user token.' });
      }

      if (!ADMIN_EMAILS.includes(user.email.toLowerCase())) {
        return res.status(403).json({ error: 'Forbidden: Access restricted to administrators only.' });
      }

      next();
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error('REACHED CATCH BLOCK', err);
      return res.status(403).json({ error: 'Forbidden: Verification failed.' });
    }
  };

  // 8. Admin APIs
  app.get('/api/admin/stats', adminAuthMiddleware, (req: Request, res: Response) => {
    res.status(501).json({ error: 'Admin statistics require a configured production analytics data source.' });
  });

  app.get('/api/admin/rules', adminAuthMiddleware, (req: Request, res: Response) => {
    res.json({
      rules: APP_STORE_RULES,
      sources: APPLE_GUIDELINE_SOURCES
    });
  });

  // Global error handler for unhandled sync errors and body parsing errors
  app.use((err: any, req: Request, res: Response, next: any) => {
    res.status(400).json({ error: 'Invalid request' });
  });

  return app;
}

export async function startServer() {
  const app = createServerApp();
  const PORT = 3000;

  // Mount Vite middleware in development mode
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve('dist');
    app.use(express.static(distPath));
    app.get(/^\/(?!api(?:\/|$)).*$/, (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Fixit server running on http://localhost:${PORT}`);
  });
}

// Only start when run directly via node / tsx
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  startServer().catch((err) => {
    console.error('Failed to start server:', err);
  });
}
