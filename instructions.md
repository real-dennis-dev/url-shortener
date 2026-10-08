# URL Shortener Backend Architecture

Based on the database schema, here's a comprehensive breakdown of the backend controllers, routes, middleware, services, and utilities organized by modules.

## 📁 **Project Structure**

```
src/
├── modules/
│   ├── auth/
│   ├── urls/
│   ├── analytics/
│   ├── bulk-upload/
│   ├── moderation/
│   ├── qr-codes/
│   ├── notifications/
│   ├── webhooks/
│   ├── api-logs/
│   ├── system/
│   └── users/
├── middleware/
├── services/
├── utils/
└── config/
```

---

## 🔐 **Auth Module**

### Controllers & Routes

| Controller     | Route                                | Method | Description            |
| -------------- | ------------------------------------ | ------ | ---------------------- |
| AuthController | `/api/v1/auth/register`              | POST   | User registration      |
| AuthController | `/api/v1/auth/login`                 | POST   | User login             |
| AuthController | `/api/v1/auth/logout`                | POST   | User logout            |
| AuthController | `/api/v1/auth/refresh`               | POST   | Refresh access token   |
| AuthController | `/api/v1/auth/verify-email/:token`   | GET    | Email verification     |
| AuthController | `/api/v1/auth/reset-password`        | POST   | Request password reset |
| AuthController | `/api/v1/auth/reset-password/:token` | POST   | Reset password         |
| AuthController | `/api/v1/auth/me`                    | GET    | Get current user       |

### Middleware

```javascript
// auth.middleware.js
const authMiddleware = {
  // Authenticate user using JWT
  authenticate: (req, res, next) => {
    // Parameters: None (reads from Authorization header)
    // Returns: req.user object
    // Validates JWT token, extracts user info
  },

  // Check user role permissions
  authorize: (roles = []) => {
    // Parameters: roles (array of allowed roles)
    // Returns: Middleware function
    // Checks if user role is in allowed roles
  },

  // Rate limiting per user
  rateLimiter: (windowMs, maxRequests) => {
    // Parameters: windowMs (time window), maxRequests (max requests)
    // Returns: Middleware function
    // Implements sliding window rate limiting
  },

  // API key authentication
  authenticateApiKey: (req, res, next) => {
    // Parameters: None (reads from X-API-Key header)
    // Returns: req.user object
    // Validates API key from headers
  },
};
```

### Services

```javascript
// auth.service.js
class AuthService {
  // User registration
  async register(email, password, fullName, plan) {
    // Parameters: email (string), password (string), fullName (string), plan (string)
    // Returns: { user, tokens }
    // Hashes password, creates user, generates tokens, sends verification email
  }

  // User login
  async login(email, password) {
    // Parameters: email (string), password (string)
    // Returns: { user, tokens }
    // Validates credentials, checks user status, updates last login
  }

  // Token generation
  async generateTokens(userId) {
    // Parameters: userId (integer)
    // Returns: { accessToken, refreshToken }
    // Creates JWT access token and refresh token
  }

  // Refresh token
  async refreshToken(refreshToken) {
    // Parameters: refreshToken (string)
    // Returns: { accessToken, refreshToken }
    // Validates refresh token, generates new tokens
  }

  // Email verification
  async verifyEmail(token) {
    // Parameters: token (string)
    // Returns: { success, message }
    // Validates email verification token, updates user
  }

  // Password reset request
  async requestPasswordReset(email) {
    // Parameters: email (string)
    // Returns: { success, message }
    // Generates reset token, sends reset email
  }

  // Reset password
  async resetPassword(token, newPassword) {
    // Parameters: token (string), newPassword (string)
    // Returns: { success, message }
    // Validates token, updates password
  }

  // Logout
  async logout(userId, refreshToken) {
    // Parameters: userId (integer), refreshToken (string)
    // Returns: { success }
    // Revokes refresh token, updates user status
  }

  // API key generation
  async regenerateApiKey(userId) {
    // Parameters: userId (integer)
    // Returns: { apiKey }
    // Generates new API key, updates user record
  }
}
```

### Utils

```javascript
// auth.utils.js
const authUtils = {
  // Password hashing
  hashPassword: (password) => {
    // Parameters: password (string)
    // Returns: hashedPassword (string)
    // Uses bcrypt to hash password
  },

  // Password verification
  verifyPassword: (password, hash) => {
    // Parameters: password (string), hash (string)
    // Returns: boolean
    // Compares password with hash using bcrypt
  },

  // JWT token generation
  generateJWT: (payload, expiresIn) => {
    // Parameters: payload (object), expiresIn (string)
    // Returns: token (string)
    // Creates JWT with configurable expiration
  },

  // JWT token verification
  verifyJWT: (token) => {
    // Parameters: token (string)
    // Returns: decoded (object)
    // Verifies and decodes JWT token
  },

  // Random token generation
  generateRandomToken: (length) => {
    // Parameters: length (integer)
    // Returns: token (string)
    // Generates cryptographically secure random token
  },

  // Email validation
  validateEmail: (email) => {
    // Parameters: email (string)
    // Returns: boolean
    // Validates email format using regex
  },

  // Password strength check
  checkPasswordStrength: (password) => {
    // Parameters: password (string)
    // Returns: { score, feedback }
    // Evaluates password complexity
  },
};
```

---

## 🔗 **URL Module**

### Controllers & Routes

| Controller    | Route                        | Method | Description              |
| ------------- | ---------------------------- | ------ | ------------------------ |
| UrlController | `/api/v1/urls`               | GET    | Get all URLs for user    |
| UrlController | `/api/v1/urls`               | POST   | Create short URL         |
| UrlController | `/api/v1/urls/:id`           | GET    | Get URL details          |
| UrlController | `/api/v1/urls/:id`           | PUT    | Update URL               |
| UrlController | `/api/v1/urls/:id`           | DELETE | Delete URL               |
| UrlController | `/:shortCode`                | GET    | Redirect to original URL |
| UrlController | `/api/v1/urls/:id/analytics` | GET    | Get URL analytics        |
| UrlController | `/api/v1/urls/:id/stats`     | GET    | Get URL statistics       |
| UrlController | `/api/v1/urls/bulk`          | POST   | Bulk create URLs         |
| UrlController | `/api/v1/urls/:id/password`  | POST   | Set URL password         |
| UrlController | `/api/v1/urls/:id/password`  | DELETE | Remove URL password      |
| UrlController | `/api/v1/urls/:id/expire`    | PUT    | Set URL expiration       |
| UrlController | `/api/v1/urls/tags/:tag`     | GET    | Get URLs by tag          |

### Middleware

```javascript
// url.middleware.js
const urlMiddleware = {
  // Validate URL creation data
  validateUrlCreation: (req, res, next) => {
    // Parameters: None (reads from req.body)
    // Returns: Validated data
    // Validates original_url, custom_code, etc.
  },

  // Check URL ownership
  checkUrlOwnership: (req, res, next) => {
    // Parameters: None (reads from req.params.id, req.user)
    // Returns: req.url object
    // Verifies user owns the URL
  },

  // Validate short code
  validateShortCode: (req, res, next) => {
    // Parameters: None (reads from req.params.shortCode)
    // Returns: Validated short code
    // Checks short code format and existence
  },

  // URL expiration check
  checkUrlExpiration: (req, res, next) => {
    // Parameters: None (reads from req.url)
    // Returns: Validation result
    // Checks if URL has expired
  },

  // Password protected URL check
  checkUrlPassword: (req, res, next) => {
    // Parameters: None (reads from req.url)
    // Returns: Validation result
    // Checks if URL requires password
  },

  // Rate limiting for URL creation
  urlCreationLimiter: (req, res, next) => {
    // Parameters: None (reads from req.user)
    // Returns: Rate limit check
    // Limits URL creation based on user plan
  },
};
```

### Services

```javascript
// url.service.js
class UrlService {
  // Create short URL
  async createShortUrl(userId, originalUrl, options) {
    // Parameters: userId (integer), originalUrl (string), options (object)
    // Options: customCode, title, description, tags, password, expiresAt, utm params
    // Returns: { url, shortCode }
    // Generates unique short code, saves URL, handles custom options
  }

  // Get URL by ID
  async getUrlById(urlId, userId) {
    // Parameters: urlId (uuid), userId (integer)
    // Returns: url object
    // Retrieves URL with ownership validation
  }

  // Get URL by short code
  async getUrlByShortCode(shortCode) {
    // Parameters: shortCode (string)
    // Returns: url object
    // Retrieves URL by short code, checks status
  }

  // Update URL
  async updateUrl(urlId, userId, updates) {
    // Parameters: urlId (uuid), userId (integer), updates (object)
    // Returns: updated url object
    // Updates URL fields, handles validation
  }

  // Delete URL
  async deleteUrl(urlId, userId) {
    // Parameters: urlId (uuid), userId (integer)
    // Returns: { success }
    // Soft deletes URL, updates status
  }

  // Get user URLs with pagination
  async getUserUrls(userId, filters, pagination) {
    // Parameters: userId (integer), filters (object), pagination (object)
    // Filters: status, tags, dateRange, search
    // Pagination: page, limit, sort
    // Returns: { urls, total, pages }
    // Retrieves paginated URLs with filters
  }

  // Get URL analytics
  async getUrlAnalytics(urlId, userId, dateRange) {
    // Parameters: urlId (uuid), userId (integer), dateRange (object)
    // Returns: { clicks, devices, browsers, countries, referrers, timeline }
    // Aggregates click analytics data
  }

  // Record click
  async recordClick(shortCode, requestData) {
    // Parameters: shortCode (string), requestData (object)
    // RequestData: ip, userAgent, referrer, location
    // Returns: click record
    // Records click with analytics, updates click count
  }

  // Get URL statistics
  async getUrlStats(urlId, userId) {
    // Parameters: urlId (uuid), userId (integer)
    // Returns: { totalClicks, uniqueVisitors, avgTime, bounceRate }
    // Calculates comprehensive statistics
  }

  // Bulk create URLs
  async bulkCreateUrls(userId, urlsData) {
    // Parameters: userId (integer), urlsData (array of objects)
    // Returns: { success, failed, errors }
    // Creates multiple URLs, handles errors
  }

  // Set URL password
  async setUrlPassword(urlId, userId, password) {
    // Parameters: urlId (uuid), userId (integer), password (string)
    // Returns: { success }
    // Hashes and sets password protection
  }

  // Validate URL password
  async validateUrlPassword(urlId, password) {
    // Parameters: urlId (uuid), password (string)
    // Returns: boolean
    // Validates URL password
  }

  // Set URL expiration
  async setUrlExpiration(urlId, userId, expiresAt) {
    // Parameters: urlId (uuid), userId (integer), expiresAt (timestamp)
    // Returns: { success }
    // Sets URL expiration time
  }
}
```

### Utils

```javascript
// url.utils.js
const urlUtils = {
  // Generate short code
  generateShortCode: (length) => {
    // Parameters: length (integer)
    // Returns: shortCode (string)
    // Generates unique alphanumeric short code
  },

  // Validate URL format
  validateUrl: (url) => {
    // Parameters: url (string)
    // Returns: boolean
    // Validates URL using regex
  },

  // Normalize URL
  normalizeUrl: (url) => {
    // Parameters: url (string)
    // Returns: normalizedUrl (string)
    // Normalizes URL (adds protocol, removes trailing slashes)
  },

  // Extract domain
  extractDomain: (url) => {
    // Parameters: url (string)
    // Returns: domain (string)
    // Extracts domain from URL
  },

  // Check URL against blacklist
  checkDomainBlacklist: (url) => {
    // Parameters: url (string)
    // Returns: { isBlacklisted, reason }
    // Checks domain against blacklist
  },

  // Generate UTM parameters
  generateUtmParams: (source, medium, campaign) => {
    // Parameters: source (string), medium (string), campaign (string)
    // Returns: utmParams (object)
    // Creates UTM tracking parameters
  },

  // Parse tags
  parseTags: (tagsString) => {
    // Parameters: tagsString (string)
    // Returns: tagsArray (array)
    // Parses comma-separated tags
  },

  // Get URL metadata
  fetchUrlMetadata: (url) => {
    // Parameters: url (string)
    // Returns: { title, description, image }
    // Fetches metadata from URL
  },

  // Short code validation
  isValidShortCode: (code) => {
    // Parameters: code (string)
    // Returns: boolean
    // Validates short code format
  },

  // Generate QR code
  generateQrCode: (url, size) => {
    // Parameters: url (string), size (integer)
    // Returns: qrCodeDataUrl (string)
    // Generates QR code image data
  },
};
```

---

## 📊 **Analytics Module**

### Controllers & Routes

| Controller          | Route                           | Method | Description             |
| ------------------- | ------------------------------- | ------ | ----------------------- |
| AnalyticsController | `/api/v1/analytics/dashboard`   | GET    | Get analytics dashboard |
| AnalyticsController | `/api/v1/analytics/urls/:urlId` | GET    | Get URL analytics       |
| AnalyticsController | `/api/v1/analytics/overview`    | GET    | Get overview analytics  |
| AnalyticsController | `/api/v1/analytics/referrers`   | GET    | Get top referrers       |
| AnalyticsController | `/api/v1/analytics/devices`     | GET    | Get device analytics    |
| AnalyticsController | `/api/v1/analytics/locations`   | GET    | Get location analytics  |
| AnalyticsController | `/api/v1/analytics/timeline`    | GET    | Get timeline data       |
| AnalyticsController | `/api/v1/analytics/export`      | GET    | Export analytics data   |
| AnalyticsController | `/api/v1/analytics/realtime`    | GET    | Get real-time analytics |

### Middleware

```javascript
// analytics.middleware.js
const analyticsMiddleware = {
  // Validate date range
  validateDateRange: (req, res, next) => {
    // Parameters: None (reads from req.query)
    // Returns: Validated date range
    // Validates startDate and endDate parameters
  },

  // Check analytics access
  checkAnalyticsAccess: (req, res, next) => {
    // Parameters: None (reads from req.user, req.params.urlId)
    // Returns: Authorization check
    // Verifies user can access analytics
  },

  // Rate limiting for analytics
  analyticsLimiter: (req, res, next) => {
    // Parameters: None (reads from req.user)
    // Returns: Rate limit check
    // Limits analytics requests per user
  },

  // Validate pagination
  validatePagination: (req, res, next) => {
    // Parameters: None (reads from req.query)
    // Returns: Validated pagination
    // Validates page and limit parameters
  },
};
```

### Services

```javascript
// analytics.service.js
class AnalyticsService {
  // Get dashboard data
  async getDashboardAnalytics(userId, dateRange) {
    // Parameters: userId (integer), dateRange (object)
    // Returns: { overview, charts, recentUrls }
    // Aggregates dashboard analytics
  }

  // Get URL analytics
  async getUrlAnalytics(urlId, userId, filters) {
    // Parameters: urlId (uuid), userId (integer), filters (object)
    // Returns: { clicks, devices, browsers, countries, referrers }
    // Retrieves comprehensive URL analytics
  }

  // Get overview analytics
  async getOverviewAnalytics(userId, dateRange) {
    // Parameters: userId (integer), dateRange (object)
    // Returns: { totalClicks, uniqueVisitors, avgClicks, topUrls }
    // Calculates overall analytics
  }

  // Get top referrers
  async getTopReferrers(urlId, userId, limit) {
    // Parameters: urlId (uuid), userId (integer), limit (integer)
    // Returns: [{ referrer, count }]
    // Retrieves top referring domains
  }

  // Get device analytics
  async getDeviceAnalytics(urlId, userId, dateRange) {
    // Parameters: urlId (uuid), userId (integer), dateRange (object)
    // Returns: { devices, browsers, os }
    // Aggregates device and browser data
  }

  // Get location analytics
  async getLocationAnalytics(urlId, userId, dateRange) {
    // Parameters: urlId (uuid), userId (integer), dateRange (object)
    // Returns: { countries, cities, regions }
    // Aggregates geographic data
  }

  // Get timeline data
  async getTimelineData(urlId, userId, dateRange) {
    // Parameters: urlId (uuid), userId (integer), dateRange (object)
    // Returns: { labels, clicks, visitors }
    // Generates time-series data
  }

  // Export analytics
  async exportAnalytics(urlId, userId, format) {
    // Parameters: urlId (uuid), userId (integer), format (string)
    // Returns: exportData (file)
    // Exports analytics in CSV/JSON/Excel
  }

  // Get real-time analytics
  async getRealtimeAnalytics(userId) {
    // Parameters: userId (integer)
    // Returns: { activeUsers, clicksLastHour, recentClicks }
    // Fetches real-time analytics data
  }

  // Update analytics summary
  async updateAnalyticsSummary(urlId) {
    // Parameters: urlId (uuid)
    // Returns: { success }
    // Aggregates and updates daily analytics summary
  }
}
```

### Utils

```javascript
// analytics.utils.js
const analyticsUtils = {
  // Parse user agent
  parseUserAgent: (userAgent) => {
    // Parameters: userAgent (string)
    // Returns: { browser, os, device, version }
    // Parses user agent string
  },

  // GeoIP lookup
  getGeoLocation: (ip) => {
    // Parameters: ip (string)
    // Returns: { country, city, region, coordinates }
    // Gets location from IP address
  },

  // Calculate bounce rate
  calculateBounceRate: (sessionData) => {
    // Parameters: sessionData (array)
    // Returns: bounceRate (float)
    // Calculates bounce rate from session data
  },

  // Calculate average session duration
  calculateAvgSessionDuration: (sessionData) => {
    // Parameters: sessionData (array)
    // Returns: avgDuration (integer)
    // Calculates average session duration
  },

  // Aggregate clicks by time interval
  aggregateByTimeInterval: (clicks, interval) => {
    // Parameters: clicks (array), interval (string)
    // Returns: aggregatedData (array)
    // Aggregates clicks by hour/day/week/month
  },

  // Format analytics for export
  formatForExport: (data, format) => {
    // Parameters: data (object), format (string)
    // Returns: formattedData (string)
    // Formats data for CSV/JSON/Excel export
  },

  // Detect bot traffic
  detectBotTraffic: (userAgent) => {
    // Parameters: userAgent (string)
    // Returns: boolean
    // Detects if traffic is from bot
  },
};
```

---

## 📤 **Bulk Upload Module**

### Controllers & Routes

| Controller           | Route                            | Method | Description            |
| -------------------- | -------------------------------- | ------ | ---------------------- |
| BulkUploadController | `/api/v1/bulk-upload`            | POST   | Upload bulk URLs       |
| BulkUploadController | `/api/v1/bulk-upload/:id`        | GET    | Get bulk upload status |
| BulkUploadController | `/api/v1/bulk-upload`            | GET    | Get all bulk uploads   |
| BulkUploadController | `/api/v1/bulk-upload/:id/cancel` | POST   | Cancel bulk upload     |
| BulkUploadController | `/api/v1/bulk-upload/template`   | GET    | Download template      |

### Middleware

```javascript
// bulk-upload.middleware.js
const bulkUploadMiddleware = {
  // Validate file upload
  validateFile: (req, res, next) => {
    // Parameters: None (reads from req.file)
    // Returns: Validated file
    // Validates file size, type, format
  },

  // Process CSV/Excel file
  processBulkFile: (req, res, next) => {
    // Parameters: None (reads from req.file)
    // Returns: req.parsedData
    // Parses CSV/Excel file into JSON
  },

  // Validate bulk data
  validateBulkData: (req, res, next) => {
    // Parameters: None (reads from req.parsedData)
    // Returns: Validated data
    // Validates each URL entry
  },

  // Rate limiting for bulk uploads
  bulkUploadLimiter: (req, res, next) => {
    // Parameters: None (reads from req.user)
    // Returns: Rate limit check
    // Limits bulk uploads based on plan
  },
};
```

### Services

```javascript
// bulk-upload.service.js
class BulkUploadService {
  // Create bulk upload job
  async createBulkUpload(userId, filename, data) {
    // Parameters: userId (integer), filename (string), data (array)
    // Returns: { jobId, status }
    // Creates bulk upload job, processes asynchronously
  }

  // Process bulk upload
  async processBulkUpload(jobId) {
    // Parameters: jobId (uuid)
    // Returns: { processed, successful, failed }
    // Processes bulk upload in chunks
  }

  // Get bulk upload status
  async getBulkUploadStatus(jobId, userId) {
    // Parameters: jobId (uuid), userId (integer)
    // Returns: { status, progress, results }
    // Gets current job status
  }

  // Cancel bulk upload
  async cancelBulkUpload(jobId, userId) {
    // Parameters: jobId (uuid), userId (integer)
    // Returns: { success }
    // Cancels ongoing bulk upload
  }

  // Get user bulk uploads
  async getUserBulkUploads(userId, pagination) {
    // Parameters: userId (integer), pagination (object)
    // Returns: { uploads, total }
    // Retrieves user's bulk upload history
  }

  // Validate bulk data format
  async validateBulkData(data) {
    // Parameters: data (array)
    // Returns: { valid, errors }
    // Validates format and structure of bulk data
  }

  // Generate template
  async generateTemplate() {
    // Parameters: None
    // Returns: templateData (array)
    // Generates sample CSV/Excel template
  }
}
```

### Utils

```javascript
// bulk-upload.utils.js
const bulkUploadUtils = {
  // Parse CSV file
  parseCSV: (csvData) => {
    // Parameters: csvData (string)
    // Returns: parsedData (array)
    // Parses CSV data into array of objects
  },

  // Parse Excel file
  parseExcel: (buffer) => {
    // Parameters: buffer (buffer)
    // Returns: parsedData (array)
    // Parses Excel file into array of objects
  },

  // Validate URL entry
  validateUrlEntry: (entry) => {
    // Parameters: entry (object)
    // Returns: { valid, errors }
    // Validates individual URL entry
  },

  // Chunk array for processing
  chunkArray: (array, size) => {
    // Parameters: array (array), size (integer)
    // Returns: chunkedArray (array of arrays)
    // Splits array into chunks for processing
  },

  // Generate error report
  generateErrorReport: (errors) => {
    // Parameters: errors (array)
    // Returns: report (string)
    // Formats errors for reporting
  },
};
```

---

## 🛡️ **Moderation Module**

### Controllers & Routes

| Controller           | Route                              | Method | Description           |
| -------------------- | ---------------------------------- | ------ | --------------------- |
| ModerationController | `/api/v1/moderation/urls/:urlId`   | POST   | Moderate URL          |
| ModerationController | `/api/v1/moderation/reports`       | GET    | Get reports           |
| ModerationController | `/api/v1/moderation/reports`       | POST   | Create report         |
| ModerationController | `/api/v1/moderation/reports/:id`   | PUT    | Update report         |
| ModerationController | `/api/v1/moderation/reports/:id`   | GET    | Get report details    |
| ModerationController | `/api/v1/moderation/blacklist`     | GET    | Get blacklist         |
| ModerationController | `/api/v1/moderation/blacklist`     | POST   | Add to blacklist      |
| ModerationController | `/api/v1/moderation/blacklist/:id` | DELETE | Remove from blacklist |
| ModerationController | `/api/v1/moderation/flagged`       | GET    | Get flagged URLs      |

### Middleware

```javascript
// moderation.middleware.js
const moderationMiddleware = {
  // Check moderation permissions
  checkModeratorPermissions: (req, res, next) => {
    // Parameters: None (reads from req.user)
    // Returns: Authorization check
    // Verifies user has moderator role
  },

  // Validate report data
  validateReport: (req, res, next) => {
    // Parameters: None (reads from req.body)
    // Returns: Validated report data
    // Validates report reason and description
  },

  // Validate moderation action
  validateModerationAction: (req, res, next) => {
    // Parameters: None (reads from req.body)
    // Returns: Validated action
    // Validates moderation action type
  },

  // Check blacklist access
  checkBlacklistAccess: (req, res, next) => {
    // Parameters: None (reads from req.user)
    // Returns: Authorization check
    // Verifies user can manage blacklist
  },
};
```

### Services

```javascript
// moderation.service.js
class ModerationService {
  // Moderate URL
  async moderateUrl(urlId, adminId, action, reason) {
    // Parameters: urlId (uuid), adminId (integer), action (string), reason (string)
    // Returns: { success, message }
    // Applies moderation action, logs moderation
  }

  // Create abuse report
  async createReport(urlId, reportedBy, reason, description) {
    // Parameters: urlId (uuid), reportedBy (integer), reason (string), description (string)
    // Returns: report object
    // Creates abuse report, sends notifications
  }

  // Get reports with filters
  async getReports(filters, pagination) {
    // Parameters: filters (object), pagination (object)
    // Returns: { reports, total }
    // Retrieves reports with filtering
  }

  // Update report
  async updateReport(reportId, adminId, status, resolution) {
    // Parameters: reportId (uuid), adminId (integer), status (string), resolution (string)
    // Returns: updated report
    // Updates report status and resolution
  }

  // Get report details
  async getReportDetails(reportId) {
    // Parameters: reportId (uuid)
    // Returns: report object with details
    // Retrieves full report with related data
  }

  // Add domain to blacklist
  async addToBlacklist(domain, reason, addedBy) {
    // Parameters: domain (string), reason (string), addedBy (integer)
    // Returns: { success }
    // Adds domain to blacklist
  }

  // Remove from blacklist
  async removeFromBlacklist(domainId) {
    // Parameters: domainId (integer)
    // Returns: { success }
    // Removes domain from blacklist
  }

  // Get flagged URLs
  async getFlaggedUrls(pagination) {
    // Parameters: pagination (object)
    // Returns: { urls, total }
    // Retrieves flagged URLs
  }

  // Auto-moderation check
  async autoModerateUrl(url) {
    // Parameters: url (string)
    // Returns: { flagged, reason }
    // Checks URL against automated moderation rules
  }

  // Get moderation logs
  async getModerationLogs(urlId, pagination) {
    // Parameters: urlId (uuid), pagination (object)
    // Returns: { logs, total }
    // Retrieves moderation history for URL
  }
}
```

### Utils

```javascript
// moderation.utils.js
const moderationUtils = {
  // Check URL against blacklist
  checkDomainBlacklist: (domain) => {
    // Parameters: domain (string)
    // Returns: { isBlacklisted, reason }
    // Checks domain against blacklist
  },

  // Scan URL for malware
  scanUrlForMalware: async (url) => {
    // Parameters: url (string)
    // Returns: { safe, threats }
    // Scans URL for malware using external APIs
  },

  // Validate URL content
  validateUrlContent: (url) => {
    // Parameters: url (string)
    // Returns: { valid, issues }
    // Validates URL content for prohibited content
  },

  // Detect spam patterns
  detectSpamPatterns: (url, title, description) => {
    // Parameters: url (string), title (string), description (string)
    // Returns: { isSpam, confidence, reasons }
    // Detects spam patterns in URL data
  },

  // Generate moderation report
  generateModerationReport: (urlData) => {
    // Parameters: urlData (object)
    // Returns: report (object)
    // Generates comprehensive moderation report
  },
};
```

---

## 📱 **QR Code Module**

### Controllers & Routes

| Controller   | Route                        | Method | Description       |
| ------------ | ---------------------------- | ------ | ----------------- |
| QrController | `/api/v1/qr/:urlId/generate` | POST   | Generate QR code  |
| QrController | `/api/v1/qr/:urlId`          | GET    | Get QR code       |
| QrController | `/api/v1/qr/:urlId/download` | GET    | Download QR code  |
| QrController | `/api/v1/qr/:urlId/stats`    | GET    | Get QR scan stats |

### Middleware

```javascript
// qr.middleware.js
const qrMiddleware = {
  // Validate QR generation params
  validateQrParams: (req, res, next) => {
    // Parameters: None (reads from req.body, req.query)
    // Returns: Validated params
    // Validates size, format, color, etc.
  },

  // Check URL ownership
  checkQrUrlOwnership: (req, res, next) => {
    // Parameters: None (reads from req.params.urlId, req.user)
    // Returns: Authorization check
    // Verifies user owns the URL
  },
};
```

### Services

```javascript
// qr.service.js
class QrService {
  // Generate QR code
  async generateQrCode(urlId, userId, options) {
    // Parameters: urlId (uuid), userId (integer), options (object)
    // Options: size, format, color, background, margin
    // Returns: qrCodeData (buffer/string)
    // Generates QR code with options
  }

  // Get QR code
  async getQrCode(urlId, userId) {
    // Parameters: urlId (uuid), userId (integer)
    // Returns: qrCode (object)
    // Retrieves existing QR code
  }

  // Record QR scan
  async recordQrScan(urlId, requestData) {
    // Parameters: urlId (uuid), requestData (object)
    // Returns: scan record
    // Records QR code scan with analytics
  }

  // Get QR scan statistics
  async getQrStats(urlId, userId) {
    // Parameters: urlId (uuid), userId (integer)
    // Returns: { scans, devices, locations }
    // Retrieves QR scan analytics
  }

  // Download QR code
  async downloadQrCode(urlId, userId, format) {
    // Parameters: urlId (uuid), userId (integer), format (string)
    // Returns: file (buffer)
    // Generates QR code for download
  }
}
```

### Utils

```javascript
// qr.utils.js
const qrUtils = {
  // Generate QR code data
  generateQR: (data, options) => {
    // Parameters: data (string), options (object)
    // Returns: qrData (buffer)
    // Generates QR code image data
  },

  // Validate QR options
  validateQrOptions: (options) => {
    // Parameters: options (object)
    // Returns: { valid, errors }
    // Validates QR generation options
  },

  // Convert QR to format
  convertQrFormat: (qrData, format) => {
    // Parameters: qrData (buffer), format (string)
    // Returns: convertedData (buffer)
    // Converts QR code to different formats
  },

  // Add logo to QR
  addLogoToQr: (qrData, logoPath) => {
    // Parameters: qrData (buffer), logoPath (string)
    // Returns: qrWithLogo (buffer)
    // Adds logo to center of QR code
  },
};
```

---

## 🔔 **Notifications Module**

### Controllers & Routes

| Controller             | Route                               | Method | Description               |
| ---------------------- | ----------------------------------- | ------ | ------------------------- |
| NotificationController | `/api/v1/notifications`             | GET    | Get notifications         |
| NotificationController | `/api/v1/notifications/:id`         | PUT    | Mark notification as read |
| NotificationController | `/api/v1/notifications/read-all`    | POST   | Mark all as read          |
| NotificationController | `/api/v1/notifications/unread`      | GET    | Get unread count          |
| NotificationController | `/api/v1/notifications/:id`         | DELETE | Delete notification       |
| NotificationController | `/api/v1/notifications/preferences` | GET    | Get preferences           |
| NotificationController | `/api/v1/notifications/preferences` | PUT    | Update preferences        |
| NotificationController | `/api/v1/notifications/email`       | POST   | Send email notification   |

### Middleware

```javascript
// notification.middleware.js
const notificationMiddleware = {
  // Validate notification request
  validateNotification: (req, res, next) => {
    // Parameters: None (reads from req.body)
    // Returns: Validated data
    // Validates notification type and content
  },

  // Check notification ownership
  checkNotificationOwnership: (req, res, next) => {
    // Parameters: None (reads from req.params.id, req.user)
    // Returns: Authorization check
    // Verifies user owns the notification
  },
};
```

### Services

```javascript
// notification.service.js
class NotificationService {
  // Get user notifications
  async getUserNotifications(userId, filters, pagination) {
    // Parameters: userId (integer), filters (object), pagination (object)
    // Returns: { notifications, total }
    // Retrieves user notifications with filtering
  }

  // Mark notification as read
  async markAsRead(notificationId, userId) {
    // Parameters: notificationId (uuid), userId (integer)
    // Returns: { success }
    // Marks notification as read
  }

  // Mark all as read
  async markAllAsRead(userId) {
    // Parameters: userId (integer)
    // Returns: { success, count }
    // Marks all notifications as read
  }

  // Get unread count
  async getUnreadCount(userId) {
    // Parameters: userId (integer)
    // Returns: count (integer)
    // Gets count of unread notifications
  }

  // Delete notification
  async deleteNotification(notificationId, userId) {
    // Parameters: notificationId (uuid), userId (integer)
    // Returns: { success }
    // Deletes notification
  }

  // Create notification
  async createNotification(userId, title, message, type, metadata) {
    // Parameters: userId (integer), title (string), message (string), type (string), metadata (object)
    // Returns: notification object
    // Creates and sends notification
  }

  // Get notification preferences
  async getPreferences(userId) {
    // Parameters: userId (integer)
    // Returns: preferences (object)
    // Gets user notification preferences
  }

  // Update notification preferences
  async updatePreferences(userId, preferences) {
    // Parameters: userId (integer), preferences (object)
    // Returns: updated preferences
    // Updates user notification preferences
  }

  // Send email notification
  async sendEmailNotification(userId, subject, body) {
    // Parameters: userId (integer), subject (string), body (string)
    // Returns: { success }
    // Sends email notification via email service
  }

  // Send webhook notification
  async sendWebhookNotification(urlId, event, data) {
    // Parameters: urlId (uuid), event (string), data (object)
    // Returns: { success }
    // Sends webhook notification
  }
}
```

### Utils

```javascript
// notification.utils.js
const notificationUtils = {
  // Format notification message
  formatNotification: (template, data) => {
    // Parameters: template (string), data (object)
    // Returns: formattedMessage (string)
    // Formats notification message from template
  },

  // Validate email
  validateEmail: (email) => {
    // Parameters: email (string)
    // Returns: boolean
    // Validates email address format
  },

  // Build email template
  buildEmailTemplate: (template, data) => {
    // Parameters: template (string), data (object)
    // Returns: htmlContent (string)
    // Builds HTML email template
  },
};
```

---

## 🔗 **Webhooks Module**

### Controllers & Routes

| Controller        | Route                         | Method | Description        |
| ----------------- | ----------------------------- | ------ | ------------------ |
| WebhookController | `/api/v1/webhooks`            | GET    | Get webhooks       |
| WebhookController | `/api/v1/webhooks`            | POST   | Create webhook     |
| WebhookController | `/api/v1/webhooks/:id`        | PUT    | Update webhook     |
| WebhookController | `/api/v1/webhooks/:id`        | DELETE | Delete webhook     |
| WebhookController | `/api/v1/webhooks/:id/test`   | POST   | Test webhook       |
| WebhookController | `/api/v1/webhooks/:id/events` | GET    | Get webhook events |

### Middleware

```javascript
// webhook.middleware.js
const webhookMiddleware = {
  // Validate webhook data
  validateWebhook: (req, res, next) => {
    // Parameters: None (reads from req.body)
    // Returns: Validated webhook data
    // Validates webhook URL and events
  },

  // Check webhook ownership
  checkWebhookOwnership: (req, res, next) => {
    // Parameters: None (reads from req.params.id, req.user)
    // Returns: Authorization check
    // Verifies user owns the webhook
  },

  // Validate webhook test data
  validateWebhookTest: (req, res, next) => {
    // Parameters: None (reads from req.body)
    // Returns: Validated test data
    // Validates webhook test parameters
  },
};
```

### Services

```javascript
// webhook.service.js
class WebhookService {
  // Get user webhooks
  async getUserWebhooks(userId) {
    // Parameters: userId (integer)
    // Returns: webhooks (array)
    // Retrieves all webhooks for user
  }

  // Create webhook
  async createWebhook(userId, url, events, secret) {
    // Parameters: userId (integer), url (string), events (string), secret (string)
    // Returns: webhook object
    // Creates new webhook configuration
  }

  // Update webhook
  async updateWebhook(webhookId, userId, updates) {
    // Parameters: webhookId (uuid), userId (integer), updates (object)
    // Returns: updated webhook
    // Updates webhook configuration
  }

  // Delete webhook
  async deleteWebhook(webhookId, userId) {
    // Parameters: webhookId (uuid), userId (integer)
    // Returns: { success }
    // Deletes webhook
  }

  // Test webhook
  async testWebhook(webhookId, userId) {
    // Parameters: webhookId (uuid), userId (integer)
    // Returns: { success, response }
    // Tests webhook with sample data
  }

  // Trigger webhook
  async triggerWebhook(urlId, event, data) {
    // Parameters: urlId (uuid), event (string), data (object)
    // Returns: { success }
    // Triggers webhook for all matching configurations
  }

  // Send webhook request
  async sendWebhookRequest(url, payload, secret) {
    // Parameters: url (string), payload (object), secret (string)
    // Returns: { success, response }
    // Sends HTTP request to webhook URL
  }

  // Handle webhook failure
  async handleWebhookFailure(webhookId) {
    // Parameters: webhookId (uuid)
    // Returns: { success }
    // Handles webhook failure, updates failure count
  }
}
```

### Utils

```javascript
// webhook.utils.js
const webhookUtils = {
  // Generate webhook signature
  generateSignature: (payload, secret) => {
    // Parameters: payload (object), secret (string)
    // Returns: signature (string)
    // Generates HMAC signature for webhook
  },

  // Validate webhook signature
  validateSignature: (payload, signature, secret) => {
    // Parameters: payload (object), signature (string), secret (string)
    // Returns: boolean
    // Validates webhook signature
  },

  // Format webhook payload
  formatWebhookPayload: (event, data) => {
    // Parameters: event (string), data (object)
    // Returns: payload (object)
    // Formats payload for webhook delivery
  },

  // Retry webhook with backoff
  retryWithBackoff: async (fn, maxRetries) => {
    // Parameters: fn (function), maxRetries (integer)
    // Returns: result
    // Retries function with exponential backoff
  },
};
```

---

## 📝 **API Logs Module**

### Controllers & Routes

| Controller       | Route                 | Method | Description        |
| ---------------- | --------------------- | ------ | ------------------ |
| ApiLogController | `/api/v1/logs`        | GET    | Get API logs       |
| ApiLogController | `/api/v1/logs/:id`    | GET    | Get log details    |
| ApiLogController | `/api/v1/logs/stats`  | GET    | Get log statistics |
| ApiLogController | `/api/v1/logs/export` | GET    | Export logs        |

### Middleware

```javascript
// api-log.middleware.js
const apiLogMiddleware = {
  // Log API request
  logRequest: (req, res, next) => {
    // Parameters: None (reads from req)
    // Returns: None (logs to database)
    // Logs API request details
  },

  // Validate log filters
  validateLogFilters: (req, res, next) => {
    // Parameters: None (reads from req.query)
    // Returns: Validated filters
    // Validates log filtering parameters
  },
};
```

### Services

```javascript
// api-log.service.js
class ApiLogService {
  // Log API request
  async logApiRequest(
    userId,
    apiKey,
    endpoint,
    method,
    statusCode,
    responseTime,
    ip,
    userAgent,
    requestBody,
    responseBody
  ) {
    // Parameters: All API request data
    // Returns: log record
    // Logs API request to database
  }

  // Get API logs
  async getApiLogs(userId, filters, pagination) {
    // Parameters: userId (integer), filters (object), pagination (object)
    // Returns: { logs, total }
    // Retrieves API logs with filtering
  }

  // Get log details
  async getLogDetails(logId, userId) {
    // Parameters: logId (uuid), userId (integer)
    // Returns: log object
    // Gets detailed log information
  }

  // Get log statistics
  async getLogStats(userId, dateRange) {
    // Parameters: userId (integer), dateRange (object)
    // Returns: { totalRequests, successRate, avgResponseTime, topEndpoints }
    // Gets aggregated log statistics
  }

  // Export logs
  async exportLogs(userId, filters, format) {
    // Parameters: userId (integer), filters (object), format (string)
    // Returns: file (buffer)
    // Exports logs in requested format
  }

  // Clean old logs
  async cleanOldLogs(daysToKeep) {
    // Parameters: daysToKeep (integer)
    // Returns: { deletedCount }
    // Deletes logs older than specified days
  }
}
```

### Utils

```javascript
// api-log.utils.js
const apiLogUtils = {
  // Anonymize sensitive data
  anonymizeSensitiveData: (data) => {
    // Parameters: data (string)
    // Returns: anonymizedData (string)
    // Replaces sensitive information with placeholders
  },

  // Format log for export
  formatLogForExport: (log, format) => {
    // Parameters: log (object), format (string)
    // Returns: formattedLog (string)
    // Formats log entry for export
  },

  // Calculate response time
  calculateResponseTime: (startTime, endTime) => {
    // Parameters: startTime (timestamp), endTime (timestamp)
    // Returns: responseTime (integer)
    // Calculates response time in milliseconds
  },
};
```

---

## ⚙️ **System Module**

### Controllers & Routes

| Controller       | Route                        | Method | Description             |
| ---------------- | ---------------------------- | ------ | ----------------------- |
| SystemController | `/api/v1/system/settings`    | GET    | Get system settings     |
| SystemController | `/api/v1/system/settings`    | PUT    | Update system settings  |
| SystemController | `/api/v1/system/health`      | GET    | Health check            |
| SystemController | `/api/v1/system/status`      | GET    | System status           |
| SystemController | `/api/v1/system/maintenance` | POST   | Toggle maintenance mode |

### Middleware

```javascript
// system.middleware.js
const systemMiddleware = {
  // Check maintenance mode
  checkMaintenanceMode: (req, res, next) => {
    // Parameters: None (reads from system settings)
    // Returns: Maintenance check
    // Blocks requests if in maintenance mode
  },

  // Check admin permissions
  checkAdminPermissions: (req, res, next) => {
    // Parameters: None (reads from req.user)
    // Returns: Authorization check
    // Verifies user has admin role
  },
};
```

### Services

```javascript
// system.service.js
class SystemService {
  // Get system settings
  async getSystemSettings(keys) {
    // Parameters: keys (array)
    // Returns: settings (object)
    // Retrieves system settings
  }

  // Update system settings
  async updateSystemSettings(settings, adminId) {
    // Parameters: settings (object), adminId (integer)
    // Returns: updated settings
    // Updates system settings
  }

  // Health check
  async healthCheck() {
    // Parameters: None
    // Returns: { status, services, details }
    // Checks system health
  }

  // Get system status
  async getSystemStatus() {
    // Parameters: None
    // Returns: { uptime, memory, cpu, activeUsers }
    // Gets system status metrics
  }

  // Toggle maintenance mode
  async toggleMaintenanceMode(adminId, enable) {
    // Parameters: adminId (integer), enable (boolean)
    // Returns: { success, maintenanceMode }
    // Toggles maintenance mode
  }
}
```

### Utils

```javascript
// system.utils.js
const systemUtils = {
  // Get system metrics
  getSystemMetrics: () => {
    // Parameters: None
    // Returns: { memory, cpu, uptime }
    // Gets system metrics
  },

  // Validate settings format
  validateSettings: (settings, schema) => {
    // Parameters: settings (object), schema (object)
    // Returns: { valid, errors }
    // Validates settings against schema
  },

  // Parse settings values
  parseSettingValue: (value, type) => {
    // Parameters: value (any), type (string)
    // Returns: parsedValue (any)
    // Parses setting value to correct type
  },
};
```

---

## 👤 **Users Module**

### Controllers & Routes

| Controller     | Route                       | Method | Description         |
| -------------- | --------------------------- | ------ | ------------------- |
| UserController | `/api/v1/users/profile`     | GET    | Get user profile    |
| UserController | `/api/v1/users/profile`     | PUT    | Update user profile |
| UserController | `/api/v1/users/api-key`     | POST   | Regenerate API key  |
| UserController | `/api/v1/users/password`    | PUT    | Change password     |
| UserController | `/api/v1/users/preferences` | GET    | Get preferences     |
| UserController | `/api/v1/users/preferences` | PUT    | Update preferences  |
| UserController | `/api/v1/users/plan`        | PUT    | Update user plan    |
| UserController | `/api/v1/users/stats`       | GET    | Get user stats      |
| UserController | `/api/v1/users/delete`      | DELETE | Delete account      |

### Middleware

```javascript
// user.middleware.js
const userMiddleware = {
  // Validate profile update
  validateProfileUpdate: (req, res, next) => {
    // Parameters: None (reads from req.body)
    // Returns: Validated profile data
    // Validates profile update data
  },

  // Validate password change
  validatePasswordChange: (req, res, next) => {
    // Parameters: None (reads from req.body)
    // Returns: Validated passwords
    // Validates current and new passwords
  },

  // Validate user ID
  validateUserId: (req, res, next) => {
    // Parameters: None (reads from req.params.id)
    // Returns: Validated ID
    // Validates user ID format
  },

  // Check user access
  checkUserAccess: (req, res, next) => {
    // Parameters: None (reads from req.params.id, req.user)
    // Returns: Authorization check
    // Verifies user can access requested resource
  },
};
```

### Services

```javascript
// user.service.js
class UserService {
  // Get user profile
  async getUserProfile(userId) {
    // Parameters: userId (integer)
    // Returns: user object
    // Gets user profile with preferences
  }

  // Update user profile
  async updateUserProfile(userId, updates) {
    // Parameters: userId (integer), updates (object)
    // Returns: updated user
    // Updates user profile
  }

  // Change password
  async changePassword(userId, currentPassword, newPassword) {
    // Parameters: userId (integer), currentPassword (string), newPassword (string)
    // Returns: { success }
    // Changes user password
  }

  // Get user preferences
  async getUserPreferences(userId) {
    // Parameters: userId (integer)
    // Returns: preferences (object)
    // Gets user preferences
  }

  // Update user preferences
  async updateUserPreferences(userId, preferences) {
    // Parameters: userId (integer), preferences (object)
    // Returns: updated preferences
    // Updates user preferences
  }

  // Update user plan
  async updateUserPlan(userId, plan) {
    // Parameters: userId (integer), plan (string)
    // Returns: updated user
    // Updates user plan
  }

  // Get user statistics
  async getUserStats(userId) {
    // Parameters: userId (integer)
    // Returns: { totalUrls, totalClicks, activeUrls, quotaUsage }
    // Gets user statistics
  }

  // Delete user account
  async deleteUserAccount(userId) {
    // Parameters: userId (integer)
    // Returns: { success }
    // Deletes user account
  }

  // Regenerate API key
  async regenerateApiKey(userId) {
    // Parameters: userId (integer)
    // Returns: { apiKey }
    // Regenerates API key
  }

  // Get user activity
  async getUserActivity(userId, filters, pagination) {
    // Parameters: userId (integer), filters (object), pagination (object)
    // Returns: { activities, total }
    // Gets user activity logs
  }
}
```

### Utils

```javascript
// user.utils.js
const userUtils = {
  // Validate user profile data
  validateProfileData: (data) => {
    // Parameters: data (object)
    // Returns: { valid, errors }
    // Validates profile data
  },

  // Sanitize user input
  sanitizeUserInput: (input) => {
    // Parameters: input (string)
    // Returns: sanitizedInput (string)
    // Sanitizes user input
  },

  // Format user data for response
  formatUserResponse: (user) => {
    // Parameters: user (object)
    // Returns: formattedUser (object)
    // Formats user data for API response
  },

  // Calculate quota usage
  calculateQuotaUsage: (user) => {
    // Parameters: user (object)
    // Returns: { used, total, percentage }
    // Calculates user quota usage
  },
};
```

---

## 📦 **General Middleware, Services & Utils**

### Global Middleware

```javascript
// global.middleware.js
const globalMiddleware = {
  // CORS handling
  corsHandler: (req, res, next) => {
    // Parameters: None
    // Returns: CORS headers
    // Configures CORS headers
  },

  // Request logging
  requestLogger: (req, res, next) => {
    // Parameters: None
    // Returns: None (logs request)
    // Logs all incoming requests
  },

  // Error handling
  errorHandler: (err, req, res, next) => {
    // Parameters: err (Error), req, res, next
    // Returns: Error response
    // Handles and formats errors
  },

  // Request validation
  validateRequest: (schema) => {
    // Parameters: schema (Joi schema)
    // Returns: Middleware function
    // Validates request body/query/params
  },

  // Compression
  compressionHandler: (req, res, next) => {
    // Parameters: None
    // Returns: Compressed response
    // Enables response compression
  },

  // Security headers
  securityHeaders: (req, res, next) => {
    // Parameters: None
    // Returns: Security headers
    // Sets security headers
  },

  // Request ID
  requestIdGenerator: (req, res, next) => {
    // Parameters: None
    // Returns: Request ID header
    // Generates unique request ID
  },

  // Response time tracking
  responseTimeTracker: (req, res, next) => {
    // Parameters: None
    // Returns: Response time header
    // Tracks response time
  },

  // IP address extraction
  extractIpAddress: (req, res, next) => {
    // Parameters: None
    // Returns: req.ip
    // Extracts client IP address
  },

  // User agent parsing
  parseUserAgent: (req, res, next) => {
    // Parameters: None
    // Returns: req.userAgent
    // Parses user agent string
  },
};
```

### Database Services

```javascript
// database.service.js
class DatabaseService {
  // Execute query with transaction
  async transaction(queries) {
    // Parameters: queries (array of query objects)
    // Returns: results (array)
    // Executes multiple queries in transaction
  }

  // Get connection pool
  getPool() {
    // Parameters: None
    // Returns: Pool connection
    // Gets database connection pool
  }

  // Build query
  buildQuery(table, operation, data, conditions) {
    // Parameters: table (string), operation (string), data (object), conditions (object)
    // Returns: query object
    // Builds SQL query
  }

  // Execute query with retry
  async executeWithRetry(query, retries) {
    // Parameters: query (object), retries (integer)
    // Returns: query result
    // Executes query with retry on failure
  }
}
```

### Cache Service

```javascript
// cache.service.js
class CacheService {
  // Get cached data
  async get(key) {
    // Parameters: key (string)
    // Returns: cached data
    // Retrieves data from cache
  }

  // Set cached data
  async set(key, value, ttl) {
    // Parameters: key (string), value (any), ttl (integer)
    // Returns: { success }
    // Caches data with TTL
  }

  // Delete cached data
  async delete(key) {
    // Parameters: key (string)
    // Returns: { success }
    // Deletes cached data
  }

  // Clear cache
  async clear(pattern) {
    // Parameters: pattern (string)
    // Returns: { success }
    // Clears cache by pattern
  }

  // Increment cache value
  async increment(key, amount) {
    // Parameters: key (string), amount (integer)
    // Returns: newValue (integer)
    // Increments cached value
  }

  // Get cache stats
  async getStats() {
    // Parameters: None
    // Returns: { hits, misses, keys }
    // Gets cache statistics
  }
}
```

### Queue Service

```javascript
// queue.service.js
class QueueService {
  // Add job to queue
  async addJob(queue, jobData, options) {
    // Parameters: queue (string), jobData (object), options (object)
    // Returns: jobId (string)
    // Adds job to queue with options
  }

  // Process queue
  async processQueue(queue, concurrency, processor) {
    // Parameters: queue (string), concurrency (integer), processor (function)
    // Returns: None
    // Processes queue with concurrency
  }

  // Get job status
  async getJobStatus(jobId) {
    // Parameters: jobId (string)
    // Returns: { status, progress, result }
    // Gets job status
  }

  // Cancel job
  async cancelJob(jobId) {
    // Parameters: jobId (string)
    // Returns: { success }
    // Cancels pending job
  }

  // Get queue stats
  async getQueueStats(queue) {
    // Parameters: queue (string)
    // Returns: { waiting, active, completed, failed }
    // Gets queue statistics
  }

  // Retry failed jobs
  async retryFailed(queue) {
    // Parameters: queue (string)
    // Returns: { retriedCount }
    // Retries failed jobs
  }
}
```

### Email Service

```javascript
// email.service.js
class EmailService {
  // Send email
  async sendEmail(to, subject, html, options) {
    // Parameters: to (string), subject (string), html (string), options (object)
    // Returns: { success, messageId }
    // Sends email
  }

  // Send verification email
  async sendVerificationEmail(userId, email, token) {
    // Parameters: userId (integer), email (string), token (string)
    // Returns: { success }
    // Sends email verification
  }

  // Send password reset email
  async sendPasswordResetEmail(email, token) {
    // Parameters: email (string), token (string)
    // Returns: { success }
    // Sends password reset email
  }

  // Send welcome email
  async sendWelcomeEmail(email, name) {
    // Parameters: email (string), name (string)
    // Returns: { success }
    // Sends welcome email
  }

  // Send notification email
  async sendNotificationEmail(email, subject, content) {
    // Parameters: email (string), subject (string), content (string)
    // Returns: { success }
    // Sends notification email
  }

  // Send bulk email
  async sendBulkEmail(recipients, subject, html) {
    // Parameters: recipients (array), subject (string), html (string)
    // Returns: { success, failed }
    // Sends bulk email
  }
}
```

### File Upload Service

```javascript
// file-upload.service.js
class FileUploadService {
  // Upload file
  async uploadFile(file, path, options) {
    // Parameters: file (File), path (string), options (object)
    // Returns: { url, key }
    // Uploads file to storage
  }

  // Delete file
  async deleteFile(key) {
    // Parameters: key (string)
    // Returns: { success }
    // Deletes file from storage
  }

  // Get file URL
  async getFileUrl(key, expiresIn) {
    // Parameters: key (string), expiresIn (integer)
    // Returns: url (string)
    // Gets signed file URL
  }

  // Validate file
  validateFile(file, allowedTypes, maxSize) {
    // Parameters: file (File), allowedTypes (array), maxSize (integer)
    // Returns: { valid, errors }
    // Validates file
  }

  // Process image
  async processImage(file, operations) {
    // Parameters: file (File), operations (object)
    // Returns: processed file
    // Processes image (resize, crop, etc.)
  }
}
```

---

## 🔧 **Configuration Files**

```javascript
// config/database.config.js
module.exports = {
  development: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    poolSize: 20,
    ssl: false,
  },
  production: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    poolSize: 50,
    ssl: true,
  },
};

// config/redis.config.js
module.exports = {
  host: process.env.REDIS_HOST || "localhost",
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  db: process.env.REDIS_DB || 0,
  ttl: {
    url: 3600,
    analytics: 300,
    user: 1800,
    config: 86400,
  },
};

// config/jwt.config.js
module.exports = {
  accessTokenSecret: process.env.JWT_ACCESS_SECRET,
  refreshTokenSecret: process.env.JWT_REFRESH_SECRET,
  accessTokenExpires: "15m",
  refreshTokenExpires: "7d",
  algorithm: "HS256",
};

// config/rate-limit.config.js
module.exports = {
  anonymous: {
    windowMs: 60000, // 1 minute
    max: 10, // requests
  },
  authenticated: {
    windowMs: 60000,
    max: 100,
  },
  premium: {
    windowMs: 60000,
    max: 1000,
  },
  admin: {
    windowMs: 60000,
    max: 5000,
  },
};
```

---

This comprehensive architecture provides a complete backend system for the URL shortener application with proper separation of concerns, modular organization, and extensive functionality for each module.
