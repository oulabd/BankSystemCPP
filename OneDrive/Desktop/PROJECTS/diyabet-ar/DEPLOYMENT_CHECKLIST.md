# 🚀 Quick Deployment Checklist

## Pre-Deployment (Local Testing)

### Database Setup ✅
- [x] MongoDB installed and running
- [x] Two databases created: `diyabet-ar` and `diyabet-tr`
- [x] Both databases accessible

### Backend Configuration ✅
- [x] `.env.ar` configured for Arabic (port 3001, diyabet-ar)
- [x] `.env.tr` configured for Turkish (port 3000, diyabet-tr)
- [x] CORS configured in `server.js`
- [x] Both servers tested locally

### Frontend Configuration ✅
- [x] 38+ HTML files have dynamic API_BASE_URL
- [x] All JavaScript files use environment-based URLs
- [x] No hardcoded URLs in code

### Version Control ✅
- [x] `.gitignore` configured
- [x] Secrets not committed
- [x] Version-specific configs tracked (`.env.ar`, `.env.tr`)

---

## Production Setup (Vercel)

### Create Vercel Projects
- [ ] Arabic project: `diyabetliyim-ar`
- [ ] Turkish project: `diyabetliyim-tr`

### Arabic Version (diyabetliyim-ar)
- [ ] Project created on Vercel
- [ ] Deployment config: `vercel-ar.json`
- [ ] Environment variables added:
  - [ ] `MONGODB_URI` → MongoDB Atlas diyabet-ar
  - [ ] `VERSION=arabic`
  - [ ] `JWT_SECRET`
  - [ ] `ENCRYPTION_KEY`
  - [ ] `FATSECRET_CLIENT_ID`
  - [ ] `FATSECRET_CLIENT_SECRET`
  - [ ] `SMTP_EMAIL`
  - [ ] `SMTP_PASSWORD`
- [ ] Domain configured
- [ ] CORS updated to production URL
- [ ] Initial deployment tested

### Turkish Version (diyabetliyim-tr)
- [ ] Project created on Vercel
- [ ] Deployment config: `vercel-tr.json`
- [ ] Environment variables added:
  - [ ] `MONGODB_URI` → MongoDB Atlas diyabet-tr
  - [ ] `VERSION=turkish`
  - [ ] `JWT_SECRET`
  - [ ] `ENCRYPTION_KEY`
  - [ ] `FATSECRET_CLIENT_ID`
  - [ ] `FATSECRET_CLIENT_SECRET`
  - [ ] `SMTP_EMAIL`
  - [ ] `SMTP_PASSWORD`
- [ ] Domain configured
- [ ] CORS updated to production URL
- [ ] Initial deployment tested

### MongoDB Atlas Setup
- [ ] Two databases created (diyabet-ar, diyabet-tr)
- [ ] IP whitelist includes Vercel IPs
- [ ] Database user created
- [ ] Connection strings verified
- [ ] Backup scheduled

---

## Testing & Verification

### Local Testing
- [ ] Run `TESTING_VERIFICATION.md` checklist
- [ ] All endpoints responding
- [ ] Database separation verified
- [ ] CORS working

### Production Testing
- [ ] Arabic version: `https://diyabetliyim-ar.vercel.app`
  - [ ] Frontend loads
  - [ ] API connectivity working
  - [ ] User registration works
  - [ ] User login works
  - [ ] Data in correct database (diyabet-ar)

- [ ] Turkish version: `https://diyabetliyim-tr.vercel.app`
  - [ ] Frontend loads
  - [ ] API connectivity working
  - [ ] User registration works
  - [ ] User login works
  - [ ] Data in correct database (diyabet-tr)

### Cross-Version Testing
- [ ] Users from Arabic version cannot access Turkish DB
- [ ] Users from Turkish version cannot access Arabic DB
- [ ] API responses include version identifier

---

## Security Verification

- [ ] No hardcoded secrets in code
- [ ] All secrets in Vercel dashboard
- [ ] `.env` file not committed (in `.gitignore`)
- [ ] Version-specific configs tracked (`.env.ar`, `.env.tr`)
- [ ] SSL/HTTPS enabled on both domains
- [ ] CORS restricted to known domains only
- [ ] Database credentials rotated
- [ ] Backup procedures tested

---

## Monitoring & Logging Setup

- [ ] Vercel dashboard monitoring configured
- [ ] Error logging setup (optional: Sentry)
- [ ] Performance monitoring configured
- [ ] Database backup schedule created
- [ ] Alerting configured for critical errors

---

## Documentation Review

- [ ] [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Read and understood
- [ ] [TESTING_VERIFICATION.md](TESTING_VERIFICATION.md) - Tests completed
- [ ] [MONGODB_SETUP.md](MONGODB_SETUP.md) - Database setup verified
- [ ] [PHASE_8_9_SUMMARY.md](PHASE_8_9_SUMMARY.md) - Summary reviewed

---

## Post-Deployment

### Day 1
- [ ] Monitor error logs
- [ ] Check user registration/login flow
- [ ] Verify both databases have separate data
- [ ] Monitor performance metrics

### Week 1
- [ ] Monitor API response times
- [ ] Check error rates
- [ ] Verify scheduled backups
- [ ] Review user feedback

### Monthly
- [ ] Review logs for issues
- [ ] Update dependencies
- [ ] Test disaster recovery
- [ ] Update documentation if needed

---

## Rollback Plan

If deployment fails:

1. **Revert to previous version**
   ```bash
   vercel rollback --prod --token <token>
   ```

2. **Restore database from backup**
   ```bash
   mongorestore --uri "mongodb+srv://..." <backup-file>
   ```

3. **Check logs for errors**
   - Vercel dashboard
   - Application logs
   - Database logs

---

## Sign-Off

- **Prepared by**: _________________ Date: _______
- **Reviewed by**: _________________ Date: _______
- **Approved for deployment**: _________________ Date: _______
- **Deployed by**: _________________ Date: _______

---

## Emergency Contact

- **Backend Issues**: Dev Team
- **Database Issues**: DevOps Team
- **Deployment Issues**: DevOps Team
- **User Issues**: Support Team

**On-call Phone**: _________________
**Slack Channel**: _________________
