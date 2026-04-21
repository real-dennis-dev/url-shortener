-- 1. Users (optional - supports guest + registered users)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE,
    password_hash TEXT,
    full_name VARCHAR(255),
    role ENUM('user', 'admin') DEFAULT 'user',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Shortened URLs (Main Table)
CREATE TABLE short_urls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,     -- NULL = guest created
    original_url TEXT NOT NULL,
    short_code VARCHAR(20) UNIQUE NOT NULL,                   -- e.g., "x7k9p2"
    custom_alias VARCHAR(50) UNIQUE,                          -- optional custom short link (e.g., "my-offer")
    title VARCHAR(255),                                       -- auto-fetched or user-provided
    description TEXT,
    clicks INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP WITH TIME ZONE,                      -- optional expiration
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Click Analytics (Track every visit)
CREATE TABLE url_clicks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    short_url_id UUID REFERENCES short_urls(id) ON DELETE CASCADE,
    clicked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT,
    referrer TEXT,
    country VARCHAR(100),                                     -- from IP geolocation
    device_type VARCHAR(50),                                  -- mobile, desktop, tablet
    browser VARCHAR(100)
);

-- 4. QR Codes (optional but popular)
CREATE TABLE qr_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    short_url_id UUID REFERENCES short_urls(id) ON DELETE CASCADE,
    qr_image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_short_code ON short_urls(short_code);
CREATE INDEX idx_custom_alias ON short_urls(custom_alias);
CREATE INDEX idx_short_urls_user ON short_urls(user_id);
CREATE INDEX idx_clicks_short_url ON url_clicks(short_url_id);
CREATE INDEX idx_clicks_date ON url_clicks(clicked_at DESC);