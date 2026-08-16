-- =====================================================
-- URL SHORTENER DATABASE SCHEMA FOR SUPABASE
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ENUM TYPES (All enums defined at the top)
-- =====================================================

-- User & Role Enums
CREATE TYPE user_role_type AS ENUM ('user', 'admin', 'moderator', 'support');
CREATE TYPE user_plan_type AS ENUM ('free', 'pro', 'business', 'enterprise');
CREATE TYPE user_status_type AS ENUM ('active', 'suspended', 'banned', 'pending_verification');

-- URL & Link Enums
CREATE TYPE url_status_type AS ENUM ('active', 'inactive', 'blocked', 'flagged', 'expired');
CREATE TYPE moderation_action_type AS ENUM ('block', 'flag', 'warn', 'delete', 'review');

-- Bulk Upload Enums
CREATE TYPE bulk_upload_status_type AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled');

-- Report & Abuse Enums
CREATE TYPE report_status_type AS ENUM ('pending', 'investigating', 'resolved', 'dismissed');
CREATE TYPE report_reason_type AS ENUM ('spam', 'malware', 'phishing', 'harassment', 'adult_content', 'illegal_activity', 'copyright', 'other');

-- Notification Enums
CREATE TYPE notification_type_type AS ENUM ('info', 'success', 'warning', 'error');
CREATE TYPE notification_channel_type AS ENUM ('email', 'webhook', 'push');

-- API & Security Enums
CREATE TYPE api_method_type AS ENUM ('GET', 'POST', 'PUT', 'DELETE', 'PATCH');

-- =====================================================
-- USERS TABLE (extends Supabase auth.users)
-- =====================================================
CREATE TABLE public.users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    password_hash VARCHAR(255) NOT NULL,
    role user_role_type DEFAULT 'user',
    plan user_plan_type DEFAULT 'free',
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
    login_attempts INTEGER DEFAULT 0,
    last_logout TIMESTAMP,
    status user_status_type DEFAULT 'active',
    is_online BOOLEAN DEFAULT FALSE,
    suspended_at TIMESTAMP,
    suspended_reason TEXT,
    deleted_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- User indexes
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_api_key ON public.users(api_key);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_plan ON public.users(plan);
CREATE INDEX idx_users_created_at ON public.users(created_at);
CREATE INDEX idx_users_status ON public.users(status);

-- =====================================================
-- USER TOKENS (Refresh token management)
-- =====================================================
CREATE TABLE public.user_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER REFERENCES public.users(id) ON DELETE CASCADE,
    refresh_token TEXT NOT NULL,
    revoked BOOLEAN DEFAULT FALSE,
    revoked_at TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(refresh_token)
);

-- User tokens indexes
CREATE INDEX idx_user_tokens_user_id ON public.user_tokens(user_id);
CREATE INDEX idx_user_tokens_refresh_token ON public.user_tokens(refresh_token);
CREATE INDEX idx_user_tokens_revoked ON public.user_tokens(revoked);
CREATE INDEX idx_user_tokens_expires ON public.user_tokens(expires_at);

-- =====================================================
-- URLS TABLE (No arrays)
-- =====================================================
CREATE TABLE public.urls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    short_code VARCHAR(20) UNIQUE NOT NULL,
    original_url TEXT NOT NULL,
    user_id INTEGER REFERENCES public.users(id) ON DELETE CASCADE,
    title VARCHAR(500),
    description TEXT,
    tags TEXT,
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
    domain_redirect TEXT,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    utm_term TEXT,
    utm_content TEXT,
    status url_status_type DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- URL indexes
CREATE INDEX idx_urls_short_code ON public.urls(short_code);
CREATE INDEX idx_urls_user_id ON public.urls(user_id);
CREATE INDEX idx_urls_is_active ON public.urls(is_active);
CREATE INDEX idx_urls_created_at ON public.urls(created_at);
CREATE INDEX idx_urls_click_count ON public.urls(click_count DESC);
CREATE INDEX idx_urls_expires_at ON public.urls(expires_at);
CREATE INDEX idx_urls_status ON public.urls(status);
CREATE INDEX idx_urls_user_active ON public.urls(user_id, is_active);
CREATE INDEX idx_urls_tags ON public.urls(tags);

-- =====================================================
-- CLICKS TABLE (Detailed click analytics)
-- =====================================================
CREATE TABLE public.clicks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    session_id VARCHAR(255),
    referrer_domain VARCHAR(255),
    is_unique BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Clicks indexes
CREATE INDEX idx_clicks_url_id ON public.clicks(url_id);
CREATE INDEX idx_clicks_created_at ON public.clicks(created_at);
CREATE INDEX idx_clicks_device_type ON public.clicks(device_type);
CREATE INDEX idx_clicks_browser ON public.clicks(browser);
CREATE INDEX idx_clicks_country ON public.clicks(country);
CREATE INDEX idx_clicks_url_created ON public.clicks(url_id, created_at DESC);
CREATE INDEX idx_clicks_session ON public.clicks(session_id);
CREATE INDEX idx_clicks_url_date ON public.clicks(url_id, DATE(created_at));
CREATE INDEX idx_clicks_device_country ON public.clicks(device_type, country);

-- =====================================================
-- ANALYTICS_SUMMARY TABLE (Aggregated analytics)
-- =====================================================
CREATE TABLE public.analytics_summary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    url_id UUID REFERENCES public.urls(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_clicks INTEGER DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0,
    devices JSONB DEFAULT '{}',
    browsers JSONB DEFAULT '{}',
    countries JSONB DEFAULT '{}',
    referrers JSONB DEFAULT '{}',
    avg_session_duration INTEGER DEFAULT 0,
    bounce_rate DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(url_id, date)
);

-- Analytics summary indexes
CREATE INDEX idx_analytics_summary_url_id ON public.analytics_summary(url_id);
CREATE INDEX idx_analytics_summary_date ON public.analytics_summary(date);

-- =====================================================
-- BULK_UPLOADS TABLE
-- =====================================================
CREATE TABLE public.bulk_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER REFERENCES public.users(id) ON DELETE CASCADE,
    filename VARCHAR(255),
    total_urls INTEGER DEFAULT 0,
    successful INTEGER DEFAULT 0,
    failed INTEGER DEFAULT 0,
    status bulk_upload_status_type DEFAULT 'pending',
    errors TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

-- Bulk uploads indexes
CREATE INDEX idx_bulk_uploads_user_id ON public.bulk_uploads(user_id);
CREATE INDEX idx_bulk_uploads_status ON public.bulk_uploads(status);
CREATE INDEX idx_bulk_uploads_created_at ON public.bulk_uploads(created_at);

-- =====================================================
-- ABUSE_REPORTS TABLE
-- =====================================================
CREATE TABLE public.abuse_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    url_id UUID REFERENCES public.urls(id) ON DELETE CASCADE,
    reported_by INTEGER REFERENCES public.users(id),
    reporter_email VARCHAR(255),
    reason report_reason_type NOT NULL,
    description TEXT,
    status report_status_type DEFAULT 'pending',
    resolution TEXT,
    resolved_by INTEGER REFERENCES public.users(id),
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Abuse reports indexes
CREATE INDEX idx_abuse_reports_url_id ON public.abuse_reports(url_id);
CREATE INDEX idx_abuse_reports_status ON public.abuse_reports(status);
CREATE INDEX idx_abuse_reports_created_at ON public.abuse_reports(created_at);
CREATE INDEX idx_abuse_reports_reason ON public.abuse_reports(reason);

-- =====================================================
-- MODERATION_LOGS TABLE
-- =====================================================
CREATE TABLE public.moderation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    url_id UUID REFERENCES public.urls(id) ON DELETE CASCADE,
    admin_id INTEGER REFERENCES public.users(id),
    action moderation_action_type NOT NULL,
    reason TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Moderation logs indexes
CREATE INDEX idx_moderation_logs_url_id ON public.moderation_logs(url_id);
CREATE INDEX idx_moderation_logs_admin_id ON public.moderation_logs(admin_id);
CREATE INDEX idx_moderation_logs_created_at ON public.moderation_logs(created_at);

-- =====================================================
-- QR_SCANS TABLE
-- =====================================================
CREATE TABLE public.qr_scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    url_id UUID REFERENCES public.urls(id) ON DELETE CASCADE,
    scanned_at TIMESTAMP DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    device_type VARCHAR(50),
    location_city VARCHAR(100),
    location_country VARCHAR(100),
    location_latitude DECIMAL(10,8),
    location_longitude DECIMAL(11,8)
);

-- QR scans indexes
CREATE INDEX idx_qr_scans_url_id ON public.qr_scans(url_id);
CREATE INDEX idx_qr_scans_scanned_at ON public.qr_scans(scanned_at);

-- =====================================================
-- API_LOGS TABLE
-- =====================================================
CREATE TABLE public.api_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
    api_key VARCHAR(100),
    endpoint VARCHAR(255),
    method api_method_type,
    status_code INTEGER,
    response_time INTEGER,
    ip_address INET,
    user_agent TEXT,
    request_body TEXT,
    response_body TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- API logs indexes
CREATE INDEX idx_api_logs_user_id ON public.api_logs(user_id);
CREATE INDEX idx_api_logs_created_at ON public.api_logs(created_at);
CREATE INDEX idx_api_logs_api_key ON public.api_logs(api_key);
CREATE INDEX idx_api_logs_endpoint ON public.api_logs(endpoint);
CREATE INDEX idx_api_logs_status ON public.api_logs(status_code);

-- =====================================================
-- NOTIFICATIONS TABLE
-- =====================================================
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER REFERENCES public.users(id) ON DELETE CASCADE,
    title VARCHAR(255),
    message TEXT,
    type notification_type_type DEFAULT 'info',
    channel notification_channel_type DEFAULT 'email',
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Notifications indexes
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at);
CREATE INDEX idx_notifications_type ON public.notifications(type);

-- =====================================================
-- DOMAIN_BLACKLIST TABLE (For security)
-- =====================================================
CREATE TABLE public.domain_blacklist (
    id SERIAL PRIMARY KEY,
    domain VARCHAR(255) UNIQUE NOT NULL,
    reason TEXT,
    added_by INTEGER REFERENCES public.users(id),
    added_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP
);

-- Domain blacklist indexes
CREATE INDEX idx_domain_blacklist_domain ON public.domain_blacklist(domain);
CREATE INDEX idx_domain_blacklist_expires ON public.domain_blacklist(expires_at);

-- =====================================================
-- SYSTEM_SETTINGS TABLE
-- =====================================================
CREATE TABLE public.system_settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value JSONB,
    description TEXT,
    updated_by INTEGER REFERENCES public.users(id),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- System settings indexes
CREATE INDEX idx_system_settings_key ON public.system_settings(key);

-- =====================================================
-- WEBHOOKS TABLE (For external integrations)
-- =====================================================
CREATE TABLE public.webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER REFERENCES public.users(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    events TEXT,
    secret VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    last_triggered_at TIMESTAMP,
    failure_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Webhooks indexes
CREATE INDEX idx_webhooks_user_id ON public.webhooks(user_id);
CREATE INDEX idx_webhooks_active ON public.webhooks(is_active);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.urls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bulk_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abuse_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY users_select_own ON public.users
    FOR SELECT USING (auth.uid()::INTEGER = id);

CREATE POLICY users_update_own ON public.users
    FOR UPDATE USING (auth.uid()::INTEGER = id);

-- User tokens policies
CREATE POLICY user_tokens_select_own ON public.user_tokens
    FOR SELECT USING (auth.uid()::INTEGER = user_id);

CREATE POLICY user_tokens_insert_own ON public.user_tokens
    FOR INSERT WITH CHECK (auth.uid()::INTEGER = user_id);

CREATE POLICY user_tokens_update_own ON public.user_tokens
    FOR UPDATE USING (auth.uid()::INTEGER = user_id);

-- URLs policies
CREATE POLICY urls_select_own ON public.urls
    FOR SELECT USING (auth.uid()::INTEGER = user_id OR is_active = TRUE);

CREATE POLICY urls_insert_own ON public.urls
    FOR INSERT WITH CHECK (auth.uid()::INTEGER = user_id);

CREATE POLICY urls_update_own ON public.urls
    FOR UPDATE USING (auth.uid()::INTEGER = user_id);

CREATE POLICY urls_delete_own ON public.urls
    FOR DELETE USING (auth.uid()::INTEGER = user_id);

-- Clicks policies (read-only for own URLs)
CREATE POLICY clicks_select_own ON public.clicks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.urls 
            WHERE urls.id = clicks.url_id 
            AND urls.user_id = auth.uid()::INTEGER
        )
    );

-- Bulk uploads policies
CREATE POLICY bulk_uploads_select_own ON public.bulk_uploads
    FOR SELECT USING (auth.uid()::INTEGER = user_id);

CREATE POLICY bulk_uploads_insert_own ON public.bulk_uploads
    FOR INSERT WITH CHECK (auth.uid()::INTEGER = user_id);

-- Notifications policies
CREATE POLICY notifications_select_own ON public.notifications
    FOR SELECT USING (auth.uid()::INTEGER = user_id);

CREATE POLICY notifications_update_own ON public.notifications
    FOR UPDATE USING (auth.uid()::INTEGER = user_id);

-- Webhooks policies
CREATE POLICY webhooks_select_own ON public.webhooks
    FOR SELECT USING (auth.uid()::INTEGER = user_id);

CREATE POLICY webhooks_insert_own ON public.webhooks
    FOR INSERT WITH CHECK (auth.uid()::INTEGER = user_id);

CREATE POLICY webhooks_update_own ON public.webhooks
    FOR UPDATE USING (auth.uid()::INTEGER = user_id);

CREATE POLICY webhooks_delete_own ON public.webhooks
    FOR DELETE USING (auth.uid()::INTEGER = user_id);

-- Admin policies (full access)
CREATE POLICY admin_all_access_urls ON public.urls
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY admin_all_access_clicks ON public.clicks
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY admin_all_access_users ON public.users
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- =====================================================
-- INITIAL DATA (System settings only)
-- =====================================================

INSERT INTO public.system_settings (key, value, description) VALUES
    ('max_url_length', '2048', 'Maximum allowed URL length'),
    ('allowed_domains', '["*"]', 'List of allowed domains or "*" for all'),
    ('rate_limits', '{"anonymous": 10, "authenticated": 100, "premium": 1000}', 'Rate limits per minute'),
    ('qr_settings', '{"default_size": 300, "allowed_formats": ["png", "svg"]}', 'QR code generation settings'),
    ('maintenance_mode', 'false', 'System maintenance mode flag'),
    ('short_code_length', '6', 'Default short code length'),
    ('max_short_code_length', '20', 'Maximum short code length'),
    ('click_cache_duration', '3600', 'Click analytics cache duration in seconds'),
    ('bulk_upload_max_rows', '10000', 'Maximum rows per bulk upload'),
    ('api_rate_limit', '1000', 'Default API rate limit per minute');

-- =====================================================
-- INDEX PERFORMANCE OPTIMIZATION (Partial indexes)
-- =====================================================

-- Partial indexes for active records only
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_urls_active_partial ON public.urls(is_active) WHERE is_active = TRUE;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_active_partial ON public.users(is_active) WHERE is_active = TRUE;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_urls_not_expired ON public.urls(expires_at) WHERE expires_at IS NOT NULL AND expires_at > NOW();

-- Partial index for unread notifications
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_unread ON public.notifications(is_read) WHERE is_read = FALSE;