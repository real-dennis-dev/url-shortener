Controller Name
File Name
What It Does (Detailed Responsibilities)
AuthController
auth.controller.js
User registration, login, logout, password reset (for account features)
UrlController
url.controller.js
Core controller – Create short URL, create with custom alias, list user's URLs, get single URL details, update title/description, deactivate/activate link, delete URL
RedirectController
redirect.controller.js
Handle actual redirection (/:shortCode), increment click count, log analytics (IP, device, referrer)
AnalyticsController
analytics.controller.js
Get click statistics, daily/weekly/monthly clicks, top performing links, geographic distribution, device/browser breakdown
QRController
qr.controller.js
Generate QR code for a short URL, download QR image
UserController
user.controller.js
Manage user profile, view all my shortened URLs, usage statistics
DashboardController
dashboard.controller.js
Overview dashboard: Total links created, total clicks, most clicked links, recent activity
AdminController
admin.controller.js
Admin-only: View all short URLs, manage users, global analytics, moderate abusive links

Extra Recommended ControllersLinkValidationController — Validate original URL, check for malicious links (optional integration with Google Safe Browsing)
BulkUrlController — Support uploading multiple URLs at once
