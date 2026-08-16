-- Create user_sessions table for session management
CREATE TABLE public.user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER REFERENCES public.users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    location VARCHAR(255),
    last_activity TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    revoked_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX idx_user_sessions_session_token ON public.user_sessions(session_token);
CREATE INDEX idx_user_sessions_expires_at ON public.user_sessions(expires_at);
CREATE INDEX idx_user_sessions_is_active ON public.user_sessions(is_active);
CREATE INDEX idx_user_sessions_last_activity ON public.user_sessions(last_activity);

-- Update users table with additional fields if not exists
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS last_logout TIMESTAMP,
ADD COLUMN IF NOT EXISTS login_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS reset_password_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS reset_password_expires TIMESTAMP;

-- Create RLS policies for user_sessions
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_sessions_select_own ON public.user_sessions
    FOR SELECT USING (auth.uid()::INTEGER = user_id);

CREATE POLICY user_sessions_insert_own ON public.user_sessions
    FOR INSERT WITH CHECK (auth.uid()::INTEGER = user_id);

CREATE POLICY user_sessions_update_own ON public.user_sessions
    FOR UPDATE USING (auth.uid()::INTEGER = user_id);

CREATE POLICY user_sessions_delete_own ON public.user_sessions
    FOR DELETE USING (auth.uid()::INTEGER = user_id);

-- Admin policies for user_sessions
CREATE POLICY admin_all_access_user_sessions ON public.user_sessions
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');