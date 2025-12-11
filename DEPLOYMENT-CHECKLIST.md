# 🚀 Deployment Checklist - Worktree-Forms

**Before deploying to production, complete ALL items on this checklist.**

---

## 🔐 Security

- [ ] Change `JWT_SECRET` to a secure 32+ character random string
- [ ] Change admin password from `admin123` to a secure password
- [ ] Update `NEXT_PUBLIC_API_URL` to production domain
- [ ] Enable HTTPS/SSL certificates
- [ ] Set `NODE_ENV=production`
- [ ] Review CORS configuration for allowed domains
- [ ] Run `npm audit` - resolve all high/critical vulnerabilities
- [ ] Enable rate limiting on auth endpoints
- [ ] Verify bcrypt rounds set to 10+ in backend
- [ ] Review and enable all security headers

## 📚 Database

- [ ] Create production PostgreSQL database
- [ ] Run all migrations: `npm run migrate:prod`
- [ ] Verify database backups are configured
- [ ] Test database recovery procedure
- [ ] Set up automated daily backups
- [ ] Configure database connection pooling
- [ ] Enable database audit logging
- [ ] Test failover procedures

## 💻 Application

- [ ] Build frontend: `npm run build:frontend`
- [ ] Build backend: `npm run build:backend`
- [ ] Run full test suite: `npm run test`
- [ ] Verify test coverage ≥90%: `npm run test:coverage`
- [ ] Run linter: `npm run lint` - fix all issues
- [ ] Type check passes: `npm run type-check`
- [ ] Run E2E tests: `npm run test:e2e`
- [ ] Performance testing completed
- [ ] Load testing completed
- [ ] Security scanning completed (`npm audit fix`)

## 📊 Monitoring & Logging

- [ ] Set up centralized logging (e.g., ELK, Datadog)
- [ ] Configure error tracking (e.g., Sentry)
- [ ] Set up performance monitoring
- [ ] Configure uptime monitoring
- [ ] Set up alerting for critical errors
- [ ] Configure audit log retention policy
- [ ] Test log rotation
- [ ] Verify logging of all security events

## 💤 Deployment

- [ ] Create production deployment plan
- [ ] Schedule deployment during low-traffic window
- [ ] Prepare rollback procedure
- [ ] Brief team on deployment process
- [ ] Have DBA on standby
- [ ] Have lead engineer available
- [ ] Document all deployment steps
- [ ] Create deployment runbook

## 🚀 Deployment Execution

```bash
# 1. Build Docker images
docker-compose build

# 2. Push images to registry (if using private registry)
docker push <registry>/worktree-forms-frontend:latest
docker push <registry>/worktree-forms-backend:latest

# 3. Deploy to production environment
docker-compose -f docker-compose.prod.yml up -d

# 4. Verify services are running
docker-compose ps

# 5. Check health endpoints
curl https://your-domain.com/api/health

# 6. Run smoke tests
npm run test:smoke

# 7. Monitor logs
docker-compose logs -f
```

## ✅ Post-Deployment

- [ ] Verify all services running
- [ ] Test login functionality
- [ ] Test form creation/submission
- [ ] Verify admin panel access
- [ ] Check audit logs are recording
- [ ] Verify email notifications (if enabled)
- [ ] Monitor error rates for 24 hours
- [ ] Monitor performance metrics
- [ ] Verify database backups working
- [ ] Document any issues encountered
- [ ] Create post-mortem if needed
- [ ] Notify stakeholders of successful deployment

## 🗑️ Cleanup

- [ ] Remove temporary files
- [ ] Clear cache (if applicable)
- [ ] Archive old logs
- [ ] Document final deployment configuration
- [ ] Update runbooks with lessons learned

## 📞 Support

**Questions?** Check these documents:
- Strategic Overview: `strategic-overview.md`
- Full Plan: `worktree-forms-plan.md`
- Dev Guide: `claude.md`
- Quick Ref: `QUICK-REFERENCE.md`

---

**Status**: Ready for Deployment ✅  
**Date**: December 11, 2025  
**Last Updated**: December 11, 2025
