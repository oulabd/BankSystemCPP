# Testing & Verification Guide

## Phase 8-9: Deployment Configuration & Testing

This document guides you through testing the dual-version (Turkish/Arabic) setup before deployment.

---

## ✅ Pre-Deployment Testing Checklist

### 1. Local Environment Verification

#### Arabic Version (Port 3001)
```powershell
cd backend
Copy-Item .env.ar .env -Force
node server.js
```

Expected output:
```
✅ Server running on http://127.0.0.1:3001
✅ Environment: development
✅ MongoDB: Connected
```

#### Turkish Version (Port 3000)
```powershell
cd backend
Copy-Item .env.tr .env -Force
node server.js
```

Expected output:
```
✅ Server running on http://127.0.0.1:3000
✅ Environment: development
✅ MongoDB: Connected
```

### 2. Database Verification

```javascript
// In MongoDB shell or Compass
show dbs

// Should show both:
// diyabet-tr
// diyabet-ar

// Check data separation
use diyabet-tr
db.users.count()

use diyabet-ar
db.users.count()

// Should have separate user counts
```

### 3. Frontend API Configuration Verification

#### Check Arabic Version Frontend
1. Open browser developer tools
2. Go to any frontend page (e.g., `http://localhost:5500/frontend/login.html`)
3. In console, run:
```javascript
console.log('API_BASE_URL:', window.API_BASE_URL);
console.log('API_BASE:', window.API_BASE);
// Should show: http://localhost:3001 and http://localhost:3001/api
```

#### Check Turkish Version Frontend  
```javascript
// After updating settings.html to point to localhost:3000
console.log('API_BASE_URL:', window.API_BASE_URL);
console.log('API_BASE:', window.API_BASE);
// Should show: http://localhost:3000 and http://localhost:3000/api
```

### 4. CORS Testing

```bash
# Test Arabic backend CORS
curl -H "Origin: http://localhost:3001" \
  -H "Access-Control-Request-Method: POST" \
  -X OPTIONS \
  http://localhost:3001/api/auth/login

# Test Turkish backend CORS
curl -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -X OPTIONS \
  http://localhost:3000/api/auth/login

# Should return 200 OK with CORS headers
```

### 5. API Endpoint Testing

#### Test Registration (Arabic)
```javascript
const response = await fetch('http://localhost:3001/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'test-ar@example.com',
    password: 'Test123!',
    name: 'Test User',
    role: 'patient'
  })
});
const data = await response.json();
console.log(data);
```

#### Test Login (Arabic)
```javascript
const response = await fetch('http://localhost:3001/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'test-ar@example.com',
    password: 'Test123!'
  })
});
const data = await response.json();
console.log('Token:', data.authToken);
```

### 6. Version Separation Verification

#### Verify Different Databases are Used
```javascript
// Register user in Arabic version
// User created in: diyabet-ar

// Register user in Turkish version
// User created in: diyabet-tr

// Verify in MongoDB
use diyabet-ar
db.users.find({ email: 'test-ar@example.com' })  // Should find it

use diyabet-tr
db.users.find({ email: 'test-ar@example.com' })  // Should NOT find it
```

#### Verify Different Ports
```bash
# Arabic version should respond on 3001
curl http://localhost:3001/api/auth/login

# Turkish version should respond on 3000
curl http://localhost:3000/api/auth/login

# Wrong ports should fail
curl http://localhost:3001/api/auth/login  # When Turkish server running
# Should fail - timeout or connection refused
```

---

## 📋 Deployment Configuration Files

### Vercel Deployment Setup

#### For Arabic Version (`vercel-ar.json`)
- Environment: Arabic (VERSION=arabic)
- Database: diyabet-ar
- API: Available environment variables via Vercel dashboard

#### For Turkish Version (`vercel-tr.json`)
- Environment: Turkish (VERSION=turkish)  
- Database: diyabet-tr
- API: Available environment variables via Vercel dashboard

### Setup Vercel Environment Variables

**For Arabic Deployment:**
```
MONGODB_URI_AR=mongodb+srv://user:pass@cluster.mongodb.net/diyabet-ar
VERSION=arabic
JWT_SECRET=your-secret-key
ENCRYPTION_KEY=your-key
FATSECRET_CLIENT_ID=your-id
FATSECRET_CLIENT_SECRET=your-secret
SMTP_EMAIL=your-email
SMTP_PASSWORD=your-password
```

**For Turkish Deployment:**
```
MONGODB_URI_TR=mongodb+srv://user:pass@cluster.mongodb.net/diyabet-tr
VERSION=turkish
JWT_SECRET=your-secret-key
ENCRYPTION_KEY=your-key
FATSECRET_CLIENT_ID=your-id
FATSECRET_CLIENT_SECRET=your-secret
SMTP_EMAIL=your-email
SMTP_PASSWORD=your-password
```

---

## 🧪 Integration Tests

### Test Matrix

| Scenario | Expected Result | Status |
|----------|-----------------|--------|
| Arabic register on port 3001 | User in diyabet-ar | ⬜ |
| Turkish register on port 3000 | User in diyabet-tr | ⬜ |
| Arabic user login on port 3001 | Token returned | ⬜ |
| Turkish user login on port 3000 | Token returned | ⬜ |
| Cross-DB access (Arabic user in Turkish DB) | User not found | ⬜ |
| CORS from Arabic frontend to Arabic API | 200 OK | ⬜ |
| CORS from Turkish frontend to Turkish API | 200 OK | ⬜ |
| Frontend loads correct API_BASE_URL | Correct URL | ⬜ |
| Version environment variable set | Correct version | ⬜ |

---

## 🚀 Pre-Production Checklist

- [ ] Both databases created and accessible
- [ ] Environment variables correctly set in .env.ar and .env.tr
- [ ] CORS configured for both versions
- [ ] Frontend API URLs pointing to correct ports
- [ ] All endpoints tested locally
- [ ] Data separation verified (different DBs)
- [ ] No hardcoded URLs in code
- [ ] .gitignore properly configured
- [ ] Secrets NOT in version control
- [ ] Deployment files (vercel-ar.json, vercel-tr.json) configured
- [ ] Database backups created
- [ ] Monitoring/logging configured
- [ ] Error tracking setup (Sentry, etc.)

---

## 📱 Manual UI Testing

### Arabic Version
1. Navigate to `http://localhost:5500/frontend/register.html`
2. Register new account
3. Check browser console: `window.API_BASE_URL` should be `http://localhost:3001`
4. Verify user created in `diyabet-ar` database
5. Login and access dashboard

### Turkish Version
1. Navigate to Turkish frontend pages
2. Register new account
3. Check browser console: `window.API_BASE_URL` should be `http://localhost:3000`
4. Verify user created in `diyabet-tr` database
5. Login and access dashboard

---

## 🐛 Troubleshooting

### Issue: "Port already in use"
```powershell
# Kill process on port 3001
Get-NetTCPConnection -LocalPort 3001 | Stop-Process -Force

# Kill process on port 3000
Get-NetTCPConnection -LocalPort 3000 | Stop-Process -Force
```

### Issue: "Cannot connect to MongoDB"
```powershell
# Verify MongoDB is running
Get-Service MongoDB | Select-Object Status

# Start MongoDB if stopped
Start-Service MongoDB
```

### Issue: "CORS errors in console"
1. Verify frontend API_BASE_URL matches backend port
2. Check CORS configuration in backend/server.js
3. Ensure origin is in allowedOrigins list

### Issue: "Database mismatch"
1. Verify .env file is correctly copied from .env.ar or .env.tr
2. Check MONGO_URI in .env matches intended database
3. Restart server after changing .env file

---

## 📊 Performance Testing

### Load Testing Commands
```bash
# Test Arabic API under load
ab -n 1000 -c 10 http://localhost:3001/api/auth/login

# Test Turkish API under load
ab -n 1000 -c 10 http://localhost:3000/api/auth/login
```

### Memory Usage Monitoring
```powershell
# Monitor Node process memory
Get-Process node | Select-Object ProcessName, WorkingSet

# Should be stable, not continuously growing
```

---

## ✅ Sign-Off

When all tests pass, sign off on deployment readiness:

- [ ] Developer sign-off: _________________ Date: _______
- [ ] QA sign-off: _________________ Date: _______
- [ ] DevOps sign-off: _________________ Date: _______

---

## 📚 Related Documentation

- [MONGODB_SETUP.md](MONGODB_SETUP.md) - Database setup instructions
- [API-QUICK-REFERENCE.md](API-QUICK-REFERENCE.md) - API endpoint reference
- [.env.example](backend/.env.example) - Environment template
- [Deployment Configuration](vercel-ar.json) - Vercel setup
