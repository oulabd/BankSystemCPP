# Deployment Guide: Arabic & Turkish Versions

## Overview

This project supports two separate deployments:
- **Arabic Version** (diyabetliyim-ar): Port 3001, Database: diyabet-ar
- **Turkish Version** (diyabetliyim-tr): Port 3000, Database: diyabet-tr

Each version has its own:
- MongoDB database (no data sharing)
- Backend server instance
- Frontend deployment
- Environment configuration
- Vercel/deployment project

---

## 📦 Deployment Files

### Arabic Version
- **Configuration**: `vercel-ar.json`
- **Environment Config**: `backend/.env.ar`
- **Database**: `diyabet-ar`
- **Port**: 3001
- **Deployment URL**: `https://diyabetliyim-ar.vercel.app` (example)

### Turkish Version
- **Configuration**: `vercel-tr.json`
- **Environment Config**: `backend/.env.tr`
- **Database**: `diyabet-tr`
- **Port**: 3000
- **Deployment URL**: `https://diyabetliyim-tr.vercel.app` (example)

---

## 🚀 Vercel Deployment Steps

### Setup Arabic Version on Vercel

1. **Create Vercel Project**
   ```bash
   vercel link
   ```

2. **Configure Environment Variables**
   Go to Vercel Dashboard → Settings → Environment Variables
   
   Add:
   ```
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/diyabet-ar
   VERSION=arabic
   PORT=3001
   NODE_ENV=production
   JWT_SECRET=<your-secret>
   ENCRYPTION_KEY=<your-key>
   FATSECRET_CLIENT_ID=<your-id>
   FATSECRET_CLIENT_SECRET=<your-secret>
   SMTP_EMAIL=<your-email>
   SMTP_PASSWORD=<your-app-password>
   ```

3. **Deploy**
   ```bash
   vercel --prod --config vercel-ar.json
   ```

### Setup Turkish Version on Vercel

1. **Create separate Vercel Project**
   ```bash
   vercel link --project diyabetliyim-tr
   ```

2. **Configure Environment Variables**
   Same as Arabic but with:
   ```
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/diyabet-tr
   VERSION=turkish
   PORT=3000
   ```

3. **Deploy**
   ```bash
   vercel --prod --config vercel-tr.json
   ```

---

## 🗄️ MongoDB Atlas Setup

### Create Two Databases on MongoDB Atlas

1. **Arabic Database**
   - Cluster: `diyabet-cluster`
   - Database: `diyabet-ar`
   - Connection String: `mongodb+srv://user:pass@diyabet-cluster.mongodb.net/diyabet-ar`

2. **Turkish Database**
   - Cluster: `diyabet-cluster` (same cluster, different DB)
   - Database: `diyabet-tr`
   - Connection String: `mongodb+srv://user:pass@diyabet-cluster.mongodb.net/diyabet-tr`

### Security

- Set up IP whitelist (allow Vercel deployment IPs)
- Create read/write user roles for each deployment
- Enable MongoDB Atlas API Key for automation

---

## 📋 CORS Configuration

Frontend CORS is already configured in `backend/server.js`:

```javascript
const allowedOrigins = [
  'https://diyabetliyim-ar.vercel.app',  // Arabic frontend
  'https://diyabetliyim-tr.vercel.app',  // Turkish frontend
  'http://localhost:3001',                 // Local Arabic
  'http://localhost:3000'                  // Local Turkish
];
```

Update these URLs based on your actual deployment domains.

---

## 🔐 Security Checklist

- [ ] **Environment Variables**: All secrets in Vercel dashboard, NOT in code
- [ ] **.env files**: Only version-specific configs tracked (.env.ar, .env.tr)
- [ ] **Actual .env**: Ignored by .gitignore, never committed
- [ ] **Database Access**: IP whitelisting enabled
- [ ] **JWT Secret**: Unique and strong (32+ characters)
- [ ] **Encryption Key**: Unique and secure (32 bytes hex)
- [ ] **SMTP Credentials**: Using app-specific passwords
- [ ] **CORS Origins**: Limited to known domains only

---

## 📊 Monitoring & Logging

### Vercel Dashboard
- Monitor build logs
- Check deployment history
- View serverless function metrics
- Monitor edge network performance

### Application Logging
Set up centralized logging:

```javascript
// In backend/server.js
console.log(`Environment: ${process.env.VERSION}`);
console.log(`Database: ${process.env.MONGO_URI}`);
```

### Error Tracking (Optional)
Integrate Sentry or similar:

```bash
npm install @sentry/node @sentry/tracing
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions (Optional)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-arabic:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: vercel/action@v4
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID_AR }}
          vercel-args: '--config vercel-ar.json --prod'
          
  deploy-turkish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: vercel/action@v4
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID_TR }}
          vercel-args: '--config vercel-tr.json --prod'
```

---

## 📝 Environment-Specific Setup

### Local Development
```bash
# Arabic (port 3001)
cp backend/.env.ar backend/.env
npm start

# Turkish (port 3000)
cp backend/.env.tr backend/.env
npm start
```

### Staging
```bash
# Arabic
ENVIRONMENT=staging node backend/server.js

# Turkish
ENVIRONMENT=staging node backend/server.js
```

### Production
- Automatically handled by Vercel
- Uses `vercel-ar.json` and `vercel-tr.json` configurations
- Environment variables set in Vercel dashboard

---

## 🔄 Rollback Procedure

### Vercel Rollback
```bash
vercel rollback --prod
```

### Database Rollback
- Maintain MongoDB backups
- Use `mongodump` and `mongorestore` for recovery

---

## 📞 Support & Troubleshooting

### Common Issues

**Issue**: Deployment fails due to missing environment variable
- **Solution**: Check Vercel dashboard → Project settings → Environment Variables

**Issue**: CORS errors after deployment
- **Solution**: Update allowedOrigins in server.js with production URLs

**Issue**: Database connection timeout
- **Solution**: Verify MongoDB Atlas IP whitelist includes Vercel IPs

**Issue**: Wrong version deployed
- **Solution**: Verify `VERSION` environment variable is set correctly

---

## 📚 Related Files

- [.gitignore](.gitignore) - Version control settings
- [vercel-ar.json](vercel-ar.json) - Arabic deployment config
- [vercel-tr.json](vercel-tr.json) - Turkish deployment config
- [backend/.env.ar](backend/.env.ar) - Arabic environment template
- [backend/.env.tr](backend/.env.tr) - Turkish environment template
- [TESTING_VERIFICATION.md](TESTING_VERIFICATION.md) - Testing guide
- [MONGODB_SETUP.md](MONGODB_SETUP.md) - Database setup guide
