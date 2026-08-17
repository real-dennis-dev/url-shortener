# URL Shortener API - Project Documentation

## 📌 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Configuration](#configuration)
- [API Documentation](#api-documentation)
- [Modules](#modules)
- [Database Schema](#database-schema)
- [Security](#security)
- [Performance Optimization](#performance-optimization)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## 🚀 Overview

A comprehensive, enterprise-grade URL shortening API built with **Node.js**, **Express.js**, and **PostgreSQL**. This platform provides robust URL management, advanced analytics, moderation features, user management, and real-time tracking capabilities.

The system is designed with a modular architecture, making it scalable, maintainable, and extensible. It features complete authentication, authorization, caching, queue processing, and comprehensive API documentation.

---

## ✨ Features

### Core Features

- **URL Shortening** - Create, manage, and track shortened URLs
- **User Authentication** - JWT-based authentication with refresh tokens
- **Advanced Analytics** - Detailed click tracking, device analytics, geographic data
- **Moderation System** - Abuse reporting, domain blacklisting, automated moderation
- **User Management** - Profile management, preferences, role-based access
- **API Key Management** - Secure API key generation and rotation
- **Bulk Operations** - CSV/Excel bulk URL creation
- **QR Code Generation** - Dynamic QR codes for URLs
- **Webhooks** - Real-time event notifications
- **Rate Limiting** - Configurable rate limits per user tier

### Advanced Features

- **Analytics Dashboard** - Comprehensive analytics with real-time data
- **Geolocation Tracking** - IP-based location tracking
- **Device Analytics** - Browser, OS, and device type tracking
- **Referrer Tracking** - Traffic source analysis
- **Custom Short Codes** - Personalized short URL codes
- **Password Protection** - Password-protected URLs
- **URL Expiration** - Time-based URL expiration
- **UTM Parameter Support** - Campaign tracking
- **Bulk Upload** - Create multiple URLs via CSV/Excel
- **QR Code Scanning** - Track QR code scans with analytics

### Security Features

- **JWT Authentication** - Secure token-based authentication
- **API Key Authentication** - Support for API key-based access
- **Role-Based Access Control** - Admin, Moderator, User roles
- **Domain Blacklist** - Block malicious domains
- **Abuse Reporting** - User-reported abuse system
- **Rate Limiting** - Prevent API abuse
- **Request Validation** - Input validation and sanitization
- **Security Headers** - CORS, Helmet, and security headers

---

## 🛠️ Technology Stack

### Backend

- **Runtime**: Node.js (v18+)
- **Framework**: Express.js (v4.18+)
- **Database**: PostgreSQL (v14+) with Supabase
- **ORM/Query Builder**: Custom SQL queries with connection pooling
- **Caching**: Redis (v7+)
- **Queue System**: Bull/BullMQ
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcrypt
- **Validation**: Joi
- **Documentation**: Swagger/OpenAPI (v3.0)

### Services & Integrations

- **Email**: Nodemailer / SendGrid
- **File Storage**: AWS S3 / Cloudinary
- **QR Code**: qrcode library
- **Analytics**: Custom analytics engine
- **Rate Limiting**: express-rate-limit
- **CORS**: cors middleware
- **Compression**: compression middleware
- **Logging**: Winston / Morgan

### DevOps

- **Containerization**: Docker
- **CI/CD**: GitHub Actions / GitLab CI
- **Monitoring**: Prometheus / Grafana
- **Error Tracking**: Sentry
- **API Gateway**: Nginx / Traefik

---

## 📁 Project Structure

```
url-shortener-api/
├── src/
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── controller.js
│   │   │   ├── routes.js
│   │   │   ├── middleware.js
│   │   │   ├── service.js
│   │   │   ├── utils.js
│   │   │   └── swagger.yaml
│   │   ├── users/
│   │   │   ├── controller.js
│   │   │   ├── routes.js
│   │   │   ├── middleware.js
│   │   │   ├── service.js
│   │   │   ├── utils.js
│   │   │   └── swagger.yaml
│   │   ├── urls/
│   │   │   ├── controller.js
│   │   │   ├── routes.js
│   │   │   ├── middleware.js
│   │   │   ├── service.js
│   │   │   ├── utils.js
│   │   │   └── swagger.yaml
│   │   ├── analytics/
│   │   │   ├── controller.js
│   │   │   ├── routes.js
│   │   │   ├── middleware.js
│   │   │   ├── service.js
│   │   │   ├── utils.js
│   │   │   └── swagger.yaml
│   │   ├── moderation/
│   │   │   ├── controller.js
│   │   │   ├── routes.js
│   │   │   ├── middleware.js
│   │   │   ├── service.js
│   │   │   ├── utils.js
│   │   │   └── swagger.yaml
│   │   ├── bulk-upload/
│   │   │   ├── controller.js
│   │   │   ├── routes.js
│   │   │   ├── middleware.js
│   │   │   ├── service.js
│   │   │   ├── utils.js
│   │   │   └── swagger.yaml
│   │   ├── notifications/
│   │   │   ├── controller.js
│   │   │   ├── routes.js
│   │   │   ├── middleware.js
│   │   │   ├── service.js
│   │   │   ├── utils.js
│   │   │   └── swagger.yaml
│   │   ├── webhooks/
│   │   │   ├── controller.js
│   │   │   ├── routes.js
│   │   │   ├── middleware.js
│   │   │   ├── service.js
│   │   │   ├── utils.js
│   │   │   └── swagger.yaml
│   │   └── qr-codes/
│   │       ├── controller.js
│   │       ├── routes.js
│   │       ├── middleware.js
│   │       ├── service.js
│   │       ├── utils.js
│   │       └── swagger.yaml
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   ├── global.middleware.js
│   │   └── index.js
│   ├── services/
│   │   ├── database.service.js
│   │   ├── cache.service.js
│   │   ├── queue.service.js
│   │   ├── email.service.js
│   │   ├── file-upload.service.js
│   │   └── index.js
│   ├── utils/
│   │   ├── errors.js
│   │   ├── response.js
│   │   ├── logger.js
│   │   ├── validators.js
│   │   └── index.js
│   ├── config/
│   │   ├── database.config.js
│   │   ├── redis.config.js
│   │   ├── jwt.config.js
│   │   ├── rate-limit.config.js
│   │   └── index.js
│   ├── database/
│   │   ├── migrations/
│   │   │   └── *.sql
│   │   ├── seeds/
│   │   │   └── *.sql
│   │   └── schema.sql
│   ├── docs/
│   │   ├── api/
│   │   │   └── swagger.yaml
│   │   └── README.md
│   └── app.js
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── scripts/
│   ├── deploy.sh
│   ├── seed.js
│   └── migrate.js
├── .env.example
├── .gitignore
├── docker-compose.yml
├── Dockerfile
├── package.json
├── package-lock.json
├── README.md
└── LICENSE
```

---

## 🔧 Installation

### Prerequisites

- Node.js v18+
- PostgreSQL v14+
- Redis v7+
- npm or yarn

### Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/url-shortener-api.git
cd url-shortener-api
```

### Step 2: Install Dependencies

```bash
npm install
# or
yarn install
```

### Step 3: Environment Configuration

```bash
cp .env.example .env
```

Edit `.env` file with your configuration:

```env
# Server
NODE_ENV=development
PORT=3000
API_URL=http://localhost:3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=url_shortener
DB_USER=postgres
DB_PASSWORD=your_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_ACCESS_SECRET=your_access_secret_key
JWT_REFRESH_SECRET=your_refresh_secret_key

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# External APIs
VIRUSTOTAL_API_KEY=your_virustotal_key
GOOGLE_SAFE_BROWSING_API_KEY=your_google_key

# Rate Limits
RATE_LIMIT_WINDOW=60000
RATE_LIMIT_MAX=100
```

### Step 4: Setup Database

```bash
# Create database
npm run db:create

# Run migrations
npm run db:migrate

# Seed initial data
npm run db:seed
```

### Step 5: Start the Server

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

---

## ⚙️ Configuration

### Database Configuration

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
```

### Redis Configuration

```javascript
// config/redis.config.js
module.exports = {
  host: process.env.REDIS_HOST || "localhost",
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  db: process.env.REDIS_DB || 0,
  ttl: {
    url: 3600, // 1 hour
    analytics: 300, // 5 minutes
    user: 1800, // 30 minutes
    config: 86400, // 24 hours
  },
};
```

### Rate Limiting Configuration

```javascript
// config/rate-limit.config.js
module.exports = {
  anonymous: {
    windowMs: 60000, // 1 minute
    max: 10, // requests per minute
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

## 📚 API Documentation

### Base URL

```
https://api.yourdomain.com/api/v1
```

### Authentication

Most endpoints require authentication via JWT token:

```
Authorization: Bearer <your_jwt_token>
```

### API Endpoints Overview

#### 🔐 Auth Module

| Method | Endpoint                      | Description            |
| ------ | ----------------------------- | ---------------------- |
| POST   | `/auth/register`              | User registration      |
| POST   | `/auth/login`                 | User login             |
| POST   | `/auth/logout`                | User logout            |
| POST   | `/auth/refresh`               | Refresh token          |
| GET    | `/auth/verify-email/:token`   | Email verification     |
| POST   | `/auth/reset-password`        | Request password reset |
| POST   | `/auth/reset-password/:token` | Reset password         |
| GET    | `/auth/me`                    | Get current user       |

#### 👤 Users Module

| Method | Endpoint             | Description         |
| ------ | -------------------- | ------------------- |
| GET    | `/users/profile`     | Get user profile    |
| PUT    | `/users/profile`     | Update user profile |
| POST   | `/users/api-key`     | Regenerate API key  |
| PUT    | `/users/password`    | Change password     |
| GET    | `/users/preferences` | Get preferences     |
| PUT    | `/users/preferences` | Update preferences  |
| PUT    | `/users/plan`        | Update user plan    |
| GET    | `/users/stats`       | Get user stats      |
| DELETE | `/users/delete`      | Delete account      |

#### 🔗 URLs Module

| Method | Endpoint              | Description        |
| ------ | --------------------- | ------------------ |
| GET    | `/urls`               | Get all URLs       |
| POST   | `/urls`               | Create short URL   |
| GET    | `/urls/:id`           | Get URL details    |
| PUT    | `/urls/:id`           | Update URL         |
| DELETE | `/urls/:id`           | Delete URL         |
| GET    | `/:shortCode`         | Redirect to URL    |
| GET    | `/urls/:id/analytics` | Get URL analytics  |
| GET    | `/urls/:id/stats`     | Get URL statistics |

#### 📊 Analytics Module

| Method | Endpoint                 | Description             |
| ------ | ------------------------ | ----------------------- |
| GET    | `/analytics/dashboard`   | Get analytics dashboard |
| GET    | `/analytics/urls/:urlId` | Get URL analytics       |
| GET    | `/analytics/overview`    | Get overview analytics  |
| GET    | `/analytics/referrers`   | Get top referrers       |
| GET    | `/analytics/devices`     | Get device analytics    |
| GET    | `/analytics/locations`   | Get location analytics  |
| GET    | `/analytics/timeline`    | Get timeline data       |
| GET    | `/analytics/export`      | Export analytics        |

#### 🛡️ Moderation Module

| Method | Endpoint                    | Description           |
| ------ | --------------------------- | --------------------- |
| POST   | `/moderation/urls/:urlId`   | Moderate URL          |
| GET    | `/moderation/reports`       | Get reports           |
| POST   | `/moderation/reports`       | Create report         |
| PUT    | `/moderation/reports/:id`   | Update report         |
| GET    | `/moderation/reports/:id`   | Get report details    |
| GET    | `/moderation/blacklist`     | Get blacklist         |
| POST   | `/moderation/blacklist`     | Add to blacklist      |
| DELETE | `/moderation/blacklist/:id` | Remove from blacklist |
| GET    | `/moderation/flagged`       | Get flagged URLs      |

### Full API Documentation

Visit `/api-docs` in your browser or use the Swagger UI:

```
http://localhost:3000/api-docs
```

---

## 🗄️ Database Schema

The database schema is designed with PostgreSQL and includes the following main tables:

### Core Tables

- **users** - User accounts and profiles
- **urls** - Shortened URLs and their metadata
- **clicks** - Click analytics and tracking data
- **analytics_summary** - Aggregated analytics data
- **user_tokens** - Refresh token management
- **bulk_uploads** - Bulk URL upload jobs
- **abuse_reports** - User-reported abuse reports
- **moderation_logs** - Moderation action logs
- **qr_scans** - QR code scan tracking
- **api_logs** - API request logging
- **notifications** - User notifications
- **domain_blacklist** - Blocked domains
- **system_settings** - System configuration
- **webhooks** - Webhook configurations

### Database Migrations

```bash
# Run migrations
npm run db:migrate

# Rollback migrations
npm run db:rollback

# Create new migration
npm run db:create-migration name=create_table_name
```

---

## 🔒 Security

### Authentication

- JWT-based authentication with access and refresh tokens
- Password hashing using bcrypt (salt rounds: 12)
- Secure session management
- CSRF protection

### Authorization

- Role-based access control (RBAC)
- Fine-grained permissions
- Resource ownership validation
- Admin-only endpoints

### Data Protection

- Input validation and sanitization
- SQL injection prevention (parameterized queries)
- XSS protection
- CORS configuration
- Rate limiting
- API key encryption

### Security Headers

- Helmet.js for security headers
- CORS configuration
- HTTPS enforcement
- Content Security Policy (CSP)

---

## ⚡ Performance Optimization

### Caching Strategy

- **Redis caching** for frequently accessed data
- **Intelligent cache invalidation**
- **TTL-based expiration**
- **Cache warming** for popular URLs

### Database Optimization

- **Indexed columns** for fast queries
- **Connection pooling** for efficient database access
- **Query optimization** using EXPLAIN ANALYZE
- **Read replicas** for analytics queries

### Queue System

- **Bull/BullMQ** for background job processing
- **Job prioritization** (high, normal, low)
- **Retry mechanism** with exponential backoff
- **Job monitoring** and dashboard

### CDN & Assets

- **Cloud CDN** for static assets
- **QR code caching** to reduce generation time
- **Image optimization** for avatar uploads

---

## 🧪 Testing

### Unit Tests

```bash
npm run test:unit
```

### Integration Tests

```bash
npm run test:integration
```

### End-to-End Tests

```bash
npm run test:e2e
```

### Test Coverage

```bash
npm run test:coverage
```

---

## 🚢 Deployment

### Docker Deployment

```bash
# Build Docker image
docker build -t url-shortener-api .

# Run with Docker Compose
docker-compose up -d

# Stop containers
docker-compose down
```

### Production Deployment (AWS)

```bash
# Deploy to AWS Elastic Beanstalk
npm run deploy:aws

# Deploy to Heroku
npm run deploy:heroku

# Deploy to DigitalOcean
npm run deploy:do
```

### CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Production
        run: |
          npm install
          npm run build
          npm run deploy:production
```

---

## 📊 Monitoring & Logging

### Health Checks

```
GET /health
Response: { status: 'ok', uptime: 12345, services: {...} }
```

### Logging

- **Application logs** using Winston
- **Request logs** using Morgan
- **Error tracking** with Sentry
- **Performance monitoring** with New Relic

### Metrics

- **API request metrics** (rate, latency, errors)
- **Database metrics** (query time, connections)
- **Cache metrics** (hit rate, memory usage)
- **Queue metrics** (job count, processing time)

---

## 🤝 Contributing

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Coding Standards

- ESLint configuration
- Prettier formatting
- Commit message convention
- JSDoc documentation

### Pull Request Requirements

- ✅ All tests pass
- ✅ Code coverage maintained
- ✅ Documentation updated
- ✅ No security vulnerabilities

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 📞 Support & Contact

- **Documentation**: [https://docs.yourdomain.com](https://docs.yourdomain.com)
- **API Reference**: [https://api.yourdomain.com/api-docs](https://api.yourdomain.com/api-docs)
- **Issue Tracker**: [https://github.com/yourusername/url-shortener-api/issues](https://github.com/yourusername/url-shortener-api/issues)
- **Email**: support@yourdomain.com
- **Twitter**: @yourtwitter

---

## 🙏 Acknowledgments

- [Express.js](https://expressjs.com/) - Web framework
- [PostgreSQL](https://www.postgresql.org/) - Database
- [Redis](https://redis.io/) - Caching
- [Supabase](https://supabase.com/) - Database platform
- [JWT](https://jwt.io/) - Authentication
- [Swagger](https://swagger.io/) - API documentation

---

## 🌟 Star Us!

If you find this project useful, please give it a star on GitHub! ⭐

---

**Built with ❤️ by the URL Shortener Team**
