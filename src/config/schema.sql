-- InsForge SQL editor migration for Fixit persistence:
-- CREATE TABLE IF NOT EXISTS apps (..., last_audit_status TEXT, inspection JSONB);
-- ALTER TABLE apps ADD COLUMN IF NOT EXISTS last_audit_status TEXT;
-- ALTER TABLE apps ADD COLUMN IF NOT EXISTS inspection JSONB DEFAULT '{}'::jsonb;
-- CREATE TABLE IF NOT EXISTS audits (..., audit_type TEXT, inspection JSONB DEFAULT '{}'::jsonb);
-- ALTER TABLE audits ADD COLUMN IF NOT EXISTS audit_type TEXT;
-- ALTER TABLE audits ADD COLUMN IF NOT EXISTS inspection JSONB DEFAULT '{}'::jsonb;
-- ALTER TABLE apps ADD COLUMN IF NOT EXISTS apple_app_id TEXT;

-- Safe migration pattern for existing projects: create tables if they do not exist,
-- then add any missing columns after the fact so existing data is preserved.
CREATE TABLE IF NOT EXISTS apps (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  bundle_id TEXT NOT NULL,
  primary_category TEXT NOT NULL,
  current_version TEXT,
  current_build TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  remaining_issues_count INT DEFAULT 0,
  last_audit_status TEXT,
  apple_app_id TEXT,
  inspection JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS for apps
ALTER TABLE apps ENABLE ROW LEVEL SECURITY;

-- Create policy for apps
DROP POLICY IF EXISTS "Users can manage their own apps" ON apps;
CREATE POLICY "Users can manage their own apps" 
ON apps 
FOR ALL 
TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Create audits table only if missing.
CREATE TABLE IF NOT EXISTS audits (
  id TEXT PRIMARY KEY,
  app_id TEXT REFERENCES apps(id) ON DELETE CASCADE,
  build_number TEXT NOT NULL,
  app_version TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  readiness_status TEXT NOT NULL,
  rule_version TEXT NOT NULL,
  summary TEXT,
  total_findings INT DEFAULT 0,
  open_findings INT DEFAULT 0,
  resolved_findings INT DEFAULT 0,
  high_risk_count INT DEFAULT 0,
  medium_risk_count INT DEFAULT 0,
  low_risk_count INT DEFAULT 0,
  manual_check_count INT DEFAULT 0,
  findings JSONB NOT NULL DEFAULT '[]'::jsonb,
  passed_checks JSONB NOT NULL DEFAULT '[]'::jsonb,
  reviewer_notes_draft TEXT,
  is_ai_enhanced BOOLEAN DEFAULT FALSE,
  audit_type TEXT,
  inspection JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS for audits
ALTER TABLE audits ENABLE ROW LEVEL SECURITY;

-- Create policy for audits
DROP POLICY IF EXISTS "Users can manage audits of their own apps" ON audits;
CREATE POLICY "Users can manage audits of their own apps" 
ON audits 
FOR ALL 
TO authenticated 
USING (
  app_id IN (SELECT id FROM apps WHERE user_id = auth.uid())
) 
WITH CHECK (
  app_id IN (SELECT id FROM apps WHERE user_id = auth.uid())
);

-- Existing projects need these migrations applied too.
ALTER TABLE apps ADD COLUMN IF NOT EXISTS last_audit_status TEXT;
ALTER TABLE apps ADD COLUMN IF NOT EXISTS apple_app_id TEXT;
ALTER TABLE apps ADD COLUMN IF NOT EXISTS inspection JSONB DEFAULT '{}'::jsonb;
ALTER TABLE audits ADD COLUMN IF NOT EXISTS audit_type TEXT;
ALTER TABLE audits ADD COLUMN IF NOT EXISTS inspection JSONB DEFAULT '{}'::jsonb;

-- Create app_store_connect_keys table
CREATE TABLE IF NOT EXISTS app_store_connect_keys (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  issuer_id TEXT NOT NULL,
  key_id TEXT NOT NULL,
  encrypted_pem TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for app_store_connect_keys
ALTER TABLE app_store_connect_keys ENABLE ROW LEVEL SECURITY;

-- Create policy for app_store_connect_keys
DROP POLICY IF EXISTS "Users can manage their own App Store Connect keys" ON app_store_connect_keys;
CREATE POLICY "Users can manage their own App Store Connect keys" 
ON app_store_connect_keys 
FOR ALL 
TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);
