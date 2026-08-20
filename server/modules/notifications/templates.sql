-- src/modules/notifications/templates.sql

-- =====================================================
-- EMAIL TEMPLATES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.email_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    subject VARCHAR(255) NOT NULL,
    html_content TEXT NOT NULL,
    text_content TEXT,
    variables JSONB DEFAULT '[]'::jsonb,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    category VARCHAR(50) DEFAULT 'general',
    created_by INTEGER REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes
CREATE INDEX idx_email_templates_name ON public.email_templates(name);
CREATE INDEX idx_email_templates_category ON public.email_templates(category);
CREATE INDEX idx_email_templates_is_active ON public.email_templates(is_active);

-- =====================================================
-- NOTIFICATION TEMPLATES TABLE (For push/webhook notifications)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.notification_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    message_template TEXT NOT NULL,
    type notification_type_type DEFAULT 'info',
    variables JSONB DEFAULT '[]'::jsonb,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    category VARCHAR(50) DEFAULT 'general',
    created_by INTEGER REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes
CREATE INDEX idx_notification_templates_name ON public.notification_templates(name);
CREATE INDEX idx_notification_templates_category ON public.notification_templates(category);
CREATE INDEX idx_notification_templates_is_active ON public.notification_templates(is_active);

-- =====================================================
-- DEFAULT EMAIL TEMPLATES
-- =====================================================

-- Welcome Email
INSERT INTO public.email_templates (name, subject, html_content, text_content, variables, description, category) VALUES
(
    'welcome_email',
    'Welcome to {app_name}!',
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; background: #f9fafb; }
        .button { display: inline-block; padding: 12px 24px; background: #4F46E5; color: white; text-decoration: none; border-radius: 4px; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to {app_name}!</h1>
        </div>
        <div class="content">
            <h2>Hello {user_name},</h2>
            <p>Thank you for joining {app_name}! We''re excited to have you on board.</p>
            <p>With {app_name}, you can:</p>
            <ul>
                <li>Create short, memorable links</li>
                <li>Track clicks and analytics</li>
                <li>Manage all your links in one place</li>
                <li>And much more!</li>
            </ul>
            <p style="text-align: center; margin: 30px 0;">
                <a href="{dashboard_url}" class="button">Go to Dashboard</a>
            </p>
            <p>If you have any questions, feel free to reply to this email.</p>
        </div>
        <div class="footer">
            <p>&copy; 2026 {app_name}. All rights reserved.</p>
        </div>
    </div>
</body>
</html>',
    'Welcome to {app_name}!\n\nHello {user_name},\n\nThank you for joining {app_name}! We''re excited to have you on board.\n\nWith {app_name}, you can:\n- Create short, memorable links\n- Track clicks and analytics\n- Manage all your links in one place\n- And much more!\n\nGo to Dashboard: {dashboard_url}\n\nIf you have any questions, feel free to reply to this email.\n\n© 2026 {app_name}. All rights reserved.',
    '["app_name", "user_name", "dashboard_url"]',
    'Welcome email for new users',
    'welcome'
);

-- Verification Email
INSERT INTO public.email_templates (name, subject, html_content, text_content, variables, description, category) VALUES
(
    'verification_email',
    'Verify your email address',
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; background: #f9fafb; }
        .button { display: inline-block; padding: 12px 24px; background: #4F46E5; color: white; text-decoration: none; border-radius: 4px; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Verify Your Email</h1>
        </div>
        <div class="content">
            <h2>Hello {user_name},</h2>
            <p>Thank you for signing up! Please verify your email address by clicking the button below:</p>
            <p style="text-align: center; margin: 30px 0;">
                <a href="{verification_url}" class="button">Verify Email</a>
            </p>
            <p>This link will expire in {expires_hours} hours.</p>
            <p>If you didn''t create an account with {app_name}, please ignore this email.</p>
        </div>
        <div class="footer">
            <p>&copy; 2026 {app_name}. All rights reserved.</p>
        </div>
    </div>
</body>
</html>',
    'Hello {user_name},\n\nThank you for signing up! Please verify your email address by clicking the link below:\n\n{verification_url}\n\nThis link will expire in {expires_hours} hours.\n\nIf you didn''t create an account with {app_name}, please ignore this email.\n\n© 2026 {app_name}. All rights reserved.',
    '["user_name", "verification_url", "expires_hours", "app_name"]',
    'Email verification template',
    'verification'
);

-- Password Reset Email
INSERT INTO public.email_templates (name, subject, html_content, text_content, variables, description, category) VALUES
(
    'password_reset',
    'Reset your password',
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #DC2626; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; background: #f9fafb; }
        .button { display: inline-block; padding: 12px 24px; background: #DC2626; color: white; text-decoration: none; border-radius: 4px; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Reset Your Password</h1>
        </div>
        <div class="content">
            <h2>Hello {user_name},</h2>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <p style="text-align: center; margin: 30px 0;">
                <a href="{reset_url}" class="button">Reset Password</a>
            </p>
            <p>This link will expire in {expires_hours} hours.</p>
            <p>If you didn''t request a password reset, please ignore this email.</p>
        </div>
        <div class="footer">
            <p>&copy; 2026 {app_name}. All rights reserved.</p>
        </div>
    </div>
</body>
</html>',
    'Hello {user_name},\n\nWe received a request to reset your password. Click the link below to create a new password:\n\n{reset_url}\n\nThis link will expire in {expires_hours} hours.\n\nIf you didn''t request a password reset, please ignore this email.\n\n© 2026 {app_name}. All rights reserved.',
    '["user_name", "reset_url", "expires_hours", "app_name"]',
    'Password reset email template',
    'security'
);

-- URL Moderation Notification
INSERT INTO public.email_templates (name, subject, html_content, text_content, variables, description, category) VALUES
(
    'url_moderated',
    'Your URL has been {action}',
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: {header_color}; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; background: #f9fafb; }
        .url-box { background: white; padding: 15px; border: 1px solid #e5e7eb; border-radius: 4px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>URL {action|upper}</h1>
        </div>
        <div class="content">
            <h2>Hello {user_name},</h2>
            <p>Your URL has been <strong>{action}</strong> by our moderation team.</p>
            <div class="url-box">
                <p><strong>URL:</strong> {url}</p>
                <p><strong>Short Code:</strong> {short_code}</p>
                <p><strong>Reason:</strong> {reason}</p>
            </div>
            <p>{additional_message}</p>
            <p>If you believe this was a mistake, please contact support.</p>
        </div>
        <div class="footer">
            <p>&copy; 2026 {app_name}. All rights reserved.</p>
        </div>
    </div>
</body>
</html>',
    'Hello {user_name},\n\nYour URL has been {action} by our moderation team.\n\nURL: {url}\nShort Code: {short_code}\nReason: {reason}\n\n{additional_message}\n\nIf you believe this was a mistake, please contact support.\n\n© 2026 {app_name}. All rights reserved.',
    '["user_name", "action", "url", "short_code", "reason", "additional_message", "header_color", "app_name"]',
    'URL moderation notification template',
    'moderation'
);

-- Notification Templates (for push/in-app)
INSERT INTO public.notification_templates (name, title, message_template, type, variables, description, category) VALUES
(
    'new_report',
    'New Abuse Report',
    'A new report has been filed for URL: {short_code} by {reporter}. Reason: {reason}',
    'warning',
    '["short_code", "reporter", "reason"]',
    'New abuse report notification for moderators',
    'moderation'
),
(
    'report_resolved',
    'Report Resolved',
    'Your report for {short_code} has been resolved. Status: {status}',
    'success',
    '["short_code", "status"]',
    'Report resolution notification for reporter',
    'moderation'
),
(
    'url_click_alert',
    'URL Click Alert',
    'Your URL {short_code} has received {click_count} clicks in the last {time_period}',
    'info',
    '["short_code", "click_count", "time_period"]',
    'Click alert notification',
    'analytics'
),
(
    'url_expiring_soon',
    'URL Expiring Soon',
    'Your URL {short_code} will expire in {days} days',
    'warning',
    '["short_code", "days"]',
    'URL expiration warning',
    'url_management'
),
(
    'system_alert',
    'System Alert',
    '{message}',
    'error',
    '["message"]',
    'System alert notification',
    'system'
);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Email templates policies (read-only for all, write for admins)
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY email_templates_select_all ON public.email_templates
    FOR SELECT USING (is_active = TRUE OR auth.jwt() ->> 'role' IN ('admin', 'moderator'));

CREATE POLICY email_templates_insert_admin ON public.email_templates
    FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY email_templates_update_admin ON public.email_templates
    FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY email_templates_delete_admin ON public.email_templates
    FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

-- Notification templates policies
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY notification_templates_select_all ON public.notification_templates
    FOR SELECT USING (is_active = TRUE OR auth.jwt() ->> 'role' IN ('admin', 'moderator'));

CREATE POLICY notification_templates_insert_admin ON public.notification_templates
    FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY notification_templates_update_admin ON public.notification_templates
    FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY notification_templates_delete_admin ON public.notification_templates
    FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');