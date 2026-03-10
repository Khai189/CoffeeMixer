# Pre-Deployment Checklist ✅

Before deploying to Railway, verify these items:

## Code Readiness

- [x] All TypeScript errors resolved
- [x] Environment variables documented in `.env.example`
- [x] `.gitignore` includes sensitive files (`.env`, `node_modules`, `build`, `uploads`)
- [x] `package.json` has correct scripts:
  - `build`: Builds the production app
  - `start`: Serves the production app
  - `postinstall`: Runs `prisma generate`
- [x] Search functionality implemented and working
- [x] Image cropping working on feed and recipe creation
- [x] Recommendations engine working

## Database

- [x] Prisma schema is finalized (`prisma/schema.prisma`)
- [x] Migrations created and tested locally
- [ ] Database seed script tested (optional but recommended)
- [x] Both `DATABASE_URL` and `DIRECT_DATABASE_URL` used correctly

## Files to Commit

Make sure these are in your Git repository:
- [x] `package.json` and `package-lock.json`
- [x] `prisma/schema.prisma`
- [x] `prisma/migrations/` folder
- [x] All `app/` source code
- [x] `Dockerfile`
- [x] `railway.json`
- [x] `.env.example` (NOT `.env`)
- [x] `README.md`
- [x] `.gitignore`

## Files to Exclude

Make sure these are NOT in your Git repository (should be in `.gitignore`):
- [x] `.env` (contains secrets)
- [x] `node_modules/`
- [x] `build/`
- [x] `public/uploads/` (user-uploaded files)
- [x] `.react-router/`

## GitHub Setup

- [ ] GitHub repository created
- [ ] All code pushed to `main` branch
- [ ] Repository is public or Railway has access to private repos

## Railway Configuration Required

When you deploy, you'll need to set these environment variables in Railway:

### 1. DATABASE_URL
**Automatically set by Railway PostgreSQL** - No action needed

### 2. DIRECT_DATABASE_URL
Set to: `${{Postgres.DATABASE_URL}}`
(This references Railway's auto-generated DATABASE_URL)

### 3. SESSION_SECRET
Generate a secure random string:
```bash
openssl rand -base64 32
```
Example output: `K8j3nR5tW9mP2xQ7vL4cF6hD1sA3gN8yB5zM0wX4eT2=`

## Post-Deployment Steps

After Railway completes the first deployment:

1. [ ] **Run migrations on production database**:
   ```bash
   # Option A: Using Railway CLI
   railway run npx prisma migrate deploy
   
   # Option B: Locally with production DATABASE_URL
   export DATABASE_URL="your-railway-database-url"
   npx prisma migrate deploy
   ```

2. [ ] **Test the deployed app**:
   - [ ] Homepage loads
   - [ ] Can sign up new user
   - [ ] Can log in
   - [ ] Can create a recipe
   - [ ] Can upload and crop images
   - [ ] Search functionality works
   - [ ] Recommendations display
   - [ ] Can post to feed
   - [ ] Mobile view works correctly

3. [ ] **Configure file uploads**:
   - [ ] Add Railway Volume for persistent storage (mount to `/app/public/uploads`)
   - OR
   - [ ] Migrate to cloud storage (AWS S3, Cloudinary, etc.)

## Quick Deployment Commands

```bash
# 1. Make sure everything is committed
git add .
git commit -m "Ready for Railway deployment"

# 2. Push to GitHub
git push origin main

# 3. Deploy on Railway (automatic after connecting GitHub repo)
# Railway will detect changes and deploy automatically

# 4. After first deploy, run migrations
railway login
railway link
railway run npx prisma migrate deploy

# 5. (Optional) Seed the database
railway run npx prisma db seed
```

## Troubleshooting Common Issues

### Build fails with "Cannot find module"
- Check that all dependencies are in `package.json`
- Verify `postinstall` script runs `prisma generate`

### App crashes on start
- Check Railway logs for error messages
- Verify environment variables are set correctly
- Ensure `DATABASE_URL` and `DIRECT_DATABASE_URL` are identical

### Images don't persist after redeploy
- Railway's filesystem is ephemeral
- Add a Railway Volume or use cloud storage

### Database connection errors
- Verify PostgreSQL service is running in Railway
- Check that `DATABASE_URL` includes `?sslmode=require`
- Ensure connection pooling is configured if needed

## Performance Optimization (Optional)

For production, consider:
- [ ] Add connection pooling (Prisma Data Proxy or PgBouncer)
- [ ] Configure caching for static assets
- [ ] Add CDN for images (CloudFront, Cloudflare)
- [ ] Enable gzip compression
- [ ] Add monitoring (Sentry, LogRocket)

## Final Check

Before clicking deploy:
- [ ] All tests pass locally
- [ ] No console errors in browser
- [ ] Mobile view tested in browser DevTools
- [ ] All sensitive data removed from code
- [ ] Environment variables documented

## Ready to Deploy? 🚀

Follow the step-by-step guide in `RAILWAY_DEPLOYMENT.md`!
