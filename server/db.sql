-- =====================================================
-- URL SHORTENER DATABASE SCHEMA FOR SUPABASE
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- USERS TABLE (extends Supabase auth.users)
-- =====================================================
CREATE TABLE public.users (
  id serial PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  avatar_url TEXT,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),
  plan VARCHAR(50) DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'business')),
  api_key VARCHAR(100) UNIQUE,
  api_key_last_regenerated TIMESTAMP,
  preferences JSONB DEFAULT '{"theme": "light", "notifications": true}',
  quota_limit INTEGER DEFAULT 100,
  total_clicks INTEGER DEFAULT 0,
  last_login TIMESTAMP,
  email_verified BOOLEAN DEFAULT FALSE,
  email_verification_token VARCHAR(255),
  email_verification_expires TIMESTAMP,
  reset_password_token VARCHAR(255),
  reset_password_expires TIMESTAMP,
  suspended_at TIMESTAMP,
  deleted_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
    created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Create index on frequently queried columns
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_api_key ON public.users(api_key);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_plan ON public.users(plan);
CREATE INDEX idx_users_created_at ON public.users(created_at);

-- =====================================================
-- URLS TABLE
-- =====================================================
CREATE TABLE public.urls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  short_code VARCHAR(20) UNIQUE NOT NULL,
  original_url TEXT NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title VARCHAR(500),
  description TEXT,
  tags TEXT[],
  click_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  requires_password BOOLEAN DEFAULT FALSE,
  password_hash VARCHAR(255),
  expires_at TIMESTAMP,
  last_clicked_at TIMESTAMP,
  moderated_at TIMESTAMP,
  moderation_reason TEXT,
  warned_at TIMESTAMP,
  warning_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_urls_short_code ON public.urls(short_code);
CREATE INDEX idx_urls_user_id ON public.urls(user_id);
CREATE INDEX idx_urls_is_active ON public.urls(is_active);
CREATE INDEX idx_urls_created_at ON public.urls(created_at);
CREATE INDEX idx_urls_click_count ON public.urls(click_count DESC);
CREATE INDEX idx_urls_expires_at ON public.urls(expires_at);
CREATE INDEX idx_urls_tags ON public.urls USING GIN(tags);

-- =====================================================
-- CLICKS TABLE (for detailed click analytics)
-- =====================================================
CREATE TABLE public.clicks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  url_id UUID REFERENCES public.urls(id) ON DELETE CASCADE,
  ip_address INET,
  user_agent TEXT,
  device_type VARCHAR(50),
  browser VARCHAR(50),
  browser_version VARCHAR(50),
  os VARCHAR(50),
  os_version VARCHAR(50),
  screen_resolution VARCHAR(50),
  language VARCHAR(10),
  referrer TEXT,
  country VARCHAR(100),
  city VARCHAR(100),
  region VARCHAR(100),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for analytics queries
CREATE INDEX idx_clicks_url_id ON public.clicks(url_id);
CREATE INDEX idx_clicks_created_at ON public.clicks(created_at);
CREATE INDEX idx_clicks_device_type ON public.clicks(device_type);
CREATE INDEX idx_clicks_browser ON public.clicks(browser);
CREATE INDEX idx_clicks_country ON public.clicks(country);
CREATE INDEX idx_clicks_url_created ON public.clicks(url_id, created_at DESC);

-- =====================================================
-- ANALYTICS_SUMMARY TABLE (aggregated analytics for faster queries)
-- =====================================================
CREATE TABLE public.analytics_summary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  url_id UUID REFERENCES public.urls(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_clicks INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  devices JSONB DEFAULT '{}',
  browsers JSONB DEFAULT '{}',
  countries JSONB DEFAULT '{}',
  referrers JSONB DEFAULT '{}',
  avg_session_duration INTEGER DEFAULT 0,
  bounce_rate DECIMAL(5, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(url_id, date)
);

CREATE INDEX idx_analytics_summary_url_id ON public.analytics_summary(url_id);
CREATE INDEX idx_analytics_summary_date ON public.analytics_summary(date);

-- =====================================================
-- BULK_UPLOADS TABLE
-- =====================================================
CREATE TABLE public.bulk_uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  filename VARCHAR(255),
  total_urls INTEGER DEFAULT 0,
  successful INTEGER DEFAULT 0,
  failed INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  errors JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE INDEX idx_bulk_uploads_user_id ON public.bulk_uploads(user_id);
CREATE INDEX idx_bulk_uploads_status ON public.bulk_uploads(status);
CREATE INDEX idx_bulk_uploads_created_at ON public.bulk_uploads(created_at);

-- =====================================================
-- ABUSE_REPORTS TABLE
-- =====================================================
CREATE TABLE public.abuse_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  url_id UUID REFERENCES public.urls(id) ON DELETE CASCADE,
  reported_by UUID REFERENCES public.users(id),
  reporter_email VARCHAR(255),
  reason VARCHAR(255),
  description TEXT,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed')),
  resolution TEXT,
  resolved_by UUID REFERENCES public.users(id),
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_abuse_reports_url_id ON public.abuse_reports(url_id);
CREATE INDEX idx_abuse_reports_status ON public.abuse_reports(status);
CREATE INDEX idx_abuse_reports_created_at ON public.abuse_reports(created_at);

-- =====================================================
-- MODERATION_LOGS TABLE
-- =====================================================
CREATE TABLE public.moderation_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  url_id UUID REFERENCES public.urls(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES public.users(id),
  action VARCHAR(50),
  reason TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_moderation_logs_url_id ON public.moderation_logs(url_id);
CREATE INDEX idx_moderation_logs_admin_id ON public.moderation_logs(admin_id);
CREATE INDEX idx_moderation_logs_created_at ON public.moderation_logs(created_at);

-- =====================================================
-- QR_SCANS TABLE (for tracking QR code scans)
-- =====================================================
CREATE TABLE public.qr_scans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  url_id UUID REFERENCES public.urls(id) ON DELETE CASCADE,
  scanned_at TIMESTAMP DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  device_type VARCHAR(50),
  location JSONB
);

CREATE INDEX idx_qr_scans_url_id ON public.qr_scans(url_id);
CREATE INDEX idx_qr_scans_scanned_at ON public.qr_scans(scanned_at);

-- =====================================================
-- API_LOGS TABLE (for tracking API usage)
-- =====================================================
CREATE TABLE public.api_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  api_key VARCHAR(100),
  endpoint VARCHAR(255),
  method VARCHAR(10),
  status_code INTEGER,
  response_time INTEGER,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_api_logs_user_id ON public.api_logs(user_id);
CREATE INDEX idx_api_logs_created_at ON public.api_logs(created_at);
CREATE INDEX idx_api_logs_api_key ON public.api_logs(api_key);
CREATE INDEX idx_api_logs_endpoint ON public.api_logs(endpoint);

-- =====================================================
-- NOTIFICATIONS TABLE
-- =====================================================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title VARCHAR(255),
  message TEXT,
  type VARCHAR(50) CHECK (type IN ('info', 'success', 'warning', 'error')),
  is_read BOOLEAN DEFAULT FALSE,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at);

-- =====================================================
-- SYSTEM_SETTINGS TABLE
-- =====================================================
CREATE TABLE public.system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value JSONB,
  description TEXT,
  updated_by UUID REFERENCES public.users(id),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to increment click count
CREATE OR REPLACE FUNCTION increment_click_count(url_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.urls
  SET click_count = click_count + 1,
      last_clicked_at = NOW()
  WHERE id = url_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for urls table
CREATE TRIGGER update_urls_updated_at
  BEFORE UPDATE ON public.urls
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for users table
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to aggregate analytics daily
CREATE OR REPLACE FUNCTION aggregate_daily_analytics()
RETURNS void AS $$
BEGIN
  INSERT INTO public.analytics_summary (url_id, date, total_clicks, unique_visitors)
  SELECT 
    url_id,
    DATE(created_at) as date,
    COUNT(*) as total_clicks,
    COUNT(DISTINCT ip_address) as unique_visitors
  FROM public.clicks
  WHERE DATE(created_at) = CURRENT_DATE - INTERVAL '1 day'
  GROUP BY url_id, DATE(created_at)
  ON CONFLICT (url_id, date) DO UPDATE
  SET total_clicks = EXCLUDED.total_clicks,
      unique_visitors = EXCLUDED.unique_visitors,
      updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to clean expired URLs
CREATE OR REPLACE FUNCTION clean_expired_urls()
RETURNS void AS $$
BEGIN
  UPDATE public.urls
  SET is_active = FALSE
  WHERE expires_at IS NOT NULL 
    AND expires_at < NOW() 
    AND is_active = TRUE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.urls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bulk_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abuse_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY users_select_own ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY users_update_own ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- URLs policies
CREATE POLICY urls_select_own ON public.urls
  FOR SELECT USING (auth.uid() = user_id OR is_active = TRUE);

CREATE POLICY urls_insert_own ON public.urls
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY urls_update_own ON public.urls
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY urls_delete_own ON public.urls
  FOR DELETE USING (auth.uid() = user_id);

-- Admin policies (to be created manually for admin users)
CREATE POLICY admin_all_access ON public.urls
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- =====================================================
-- INITIAL DATA
-- =====================================================

-- Insert default system settings
INSERT INTO public.system_settings (key, value, description) VALUES
  ('max_url_length', '2048', 'Maximum allowed URL length'),
  ('allowed_domains', '["*"]', 'List of allowed domains or "*" for all'),
  ('rate_limits', '{"anonymous": 10, "authenticated": 100, "premium": 1000}', 'Rate limits per minute'),
  ('qr_settings', '{"default_size": 300, "allowed_formats": ["png", "svg"]}', 'QR code generation settings'),
  ('maintenance_mode', 'false', 'System maintenance mode flag');

-- Create admin user (replace with your email and hashed password)
-- INSERT INTO public.users (email, full_name, password_hash, role, email_verified)
-- VALUES ('admin@example.com', 'System Admin', 'YOUR_HASHED_PASSWORD', 'admin', TRUE);

-- =====================================================
-- INDEX PERFORMANCE OPTIMIZATION
-- =====================================================

-- Composite indexes for common query patterns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clicks_url_date ON public.clicks(url_id, DATE(created_at));
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_urls_user_active ON public.urls(user_id, is_active);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clicks_device_country ON public.clicks(device_type, country);

-- Partial indexes for active only records
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_urls_active ON public.urls(is_active) WHERE is_active = TRUE;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_active ON public.users(is_active) WHERE is_active = TRUE;

-- =====================================================
-- VACUUM ANALYZE (run periodically)
-- =====================================================
VACUUM ANALYZE public.users;
VACUUM ANALYZE public.urls;
VACUUM ANALYZE public.clicks;

-- User tokens table for refresh token management
CREATE TABLE public.user_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  refresh_token TEXT NOT NULL,
  revoked BOOLEAN DEFAULT FALSE,
  revoked_at TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(refresh_token)
);

CREATE INDEX idx_user_tokens_user_id ON public.user_tokens(user_id);
CREATE INDEX idx_user_tokens_refresh_token ON public.user_tokens(refresh_token);
CREATE INDEX idx_user_tokens_revoked ON public.user_tokens(revoked);

-- Add missing columns to users table if not exists
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS login_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS reset_password_token TEXT,
ADD COLUMN IF NOT EXISTS reset_password_expires TIMESTAMP,
ADD COLUMN IF NOT EXISTS email_verification_token TEXT,
ADD COLUMN IF NOT EXISTS email_verification_expires TIMESTAMP,
ADD COLUMN IF NOT EXISTS last_logout TIMESTAMP,
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active',
ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT FALSE;

-- RLS policies for user_tokens
ALTER TABLE public.user_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_tokens_select_own ON public.user_tokens
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY user_tokens_insert_own ON public.user_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_tokens_update_own ON public.user_tokens
  FOR UPDATE USING (auth.uid() = user_id);