# CoffeeMixer - Railway Deployment Guide

This guide walks you through deploying CoffeeMixer to Railway with GitHub integration and PostgreSQL database.

## Prerequisites

- GitHub account
- Railway account (sign up at [railway.app](https://railway.app))
- Git installed locally

## Step 1: Prepare Your Repository

### 1.1 Create a GitHub Repository

1. Go to [github.com](https://github.com) and create a new repository named `coffeemixer`
2. Don't initialize with README (we already have one)

### 1.2 Push Your Code to GitHub

```bash
cd /Users/husamkm/Documents/CoffeeMixer

# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: CoffeeMixer full-stack app with recommendations and image cropping"

# Add remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/coffeemixer.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Step 2: Set Up Railway Project

### 2.1 Create New Project

1. Go to [railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Connect your GitHub account if not already connected
5. Select the `coffeemixer` repository

### 2.2 Add PostgreSQL Database

1. In your Railway project, click "+ New"
2. Select "Database" → "Add PostgreSQL"
3. Railway will automatically provision a PostgreSQL instance
4. The database will be automatically linked to your app

## Step 3: Configure Environment Variables

Railway will auto-detect some variables, but you need to add custom ones:

1. Go to your app service in Railway
2. Click "Variables" tab
3. Add the following variables:

```env
# Database URLs (Railway auto-generates these, but verify they exist)
DATABASE_URL=postgresql://... (Railway provides this)
DIRECT_DATABASE_URL=postgresql://... (Railway provides this)

# Session Secret (generate a random string)
SESSION_SECRET=your-super-secret-random-string-here

# Node Environment
NODE_ENV=production

# Port (Railway auto-assigns, but add for clarity)
PORT=3000
```

### 3.1 Generate SESSION_SECRET

Run this command locally to generate a secure secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and use it as your `SESSION_SECRET` in Railway.

## Step 4: Configure Build & Start Commands

Railway should auto-detect these, but verify in Settings → Build & Deploy:

**Build Command:**
```bash
npm install && npx prisma generate && npm run build
```

**Start Command:**
```bash
npm run start
```

## Step 5: Run Database Migrations

### 5.1 Option A: Using Railway CLI (Recommended)

1. Install Railway CLI:
```bash
npm install -g @railway/cli
```

2. Login and link project:
```bash
railway login
railway link
```

3. Run migrations:
```bash
railway run npx prisma migrate deploy
```

4. Seed database (optional):
```bash
railway run npx prisma db seed
```

### 5.2 Option B: Using Railway Dashboard

1. Go to your app service in Railway
2. Click "Settings" → "Custom Build Command"
3. Temporarily change build command to:
```bash
npm install && npx prisma generate && npx prisma migrate deploy && npm run build
```
4. Redeploy (it will run migrations)
5. After successful deployment, change build command back to original

## Step 6: Verify Deployment

1. Railway will provide a deployment URL (e.g., `coffeemixer.up.railway.app`)
2. Visit the URL to verify your app is running
3. Test key features:
   - Sign up / Login
   - Create a recipe with image upload
   - Search for recipes
   - View personalized recommendations
   - Create a post on the feed

## Step 7: Set Up Custom Domain (Optional)

1. In Railway project settings, click "Settings"
2. Scroll to "Domains"
3. Click "Generate Domain" for a Railway subdomain, or
4. Add your custom domain and follow DNS configuration instructions

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string (with connection pooling) | `postgresql://user:pass@host/db` |
| `DIRECT_DATABASE_URL` | Direct PostgreSQL connection (for migrations) | `postgresql://user:pass@host/db` |
| `SESSION_SECRET` | Secret key for session encryption | 64-character hex string |
| `NODE_ENV` | Node environment | `production` |
| `PORT` | Server port (auto-assigned by Railway) | `3000` |

## Troubleshooting

### Build Fails

**Issue:** Prisma client not generated
```
Solution: Ensure `npx prisma generate` is in your build command
```

**Issue:** TypeScript errors
```
Solution: Run `npm run build` locally first to catch errors
```

### Database Connection Issues

**Issue:** Can't connect to database
```
Solution: Verify DATABASE_URL and DIRECT_DATABASE_URL are set correctly
Check that both URLs are from Railway's PostgreSQL service
```

### Image Upload Issues

**Issue:** Images not persisting between deployments
```
Solution: Railway has ephemeral filesystem. Options:
1. Use Cloudinary for image hosting (recommended for production)
2. Use Railway Volumes (persistent storage)
3. Use S3-compatible storage
```

**Recommended Fix for Production:**

Install Cloudinary:
```bash
npm install cloudinary
```

Update image upload logic to use Cloudinary instead of local filesystem.

### Environment Variables Not Loading

**Issue:** App can't access environment variables
```
Solution: Verify variables are set in Railway dashboard
Redeploy after adding new variables
```

## Continuous Deployment

Railway automatically deploys when you push to your main branch:

```bash
# Make changes locally
git add .
git commit -m "Your commit message"
git push origin main
```

Railway will automatically:
1. Pull latest code
2. Run build command
3. Deploy new version
4. Run health checks

## Monitoring & Logs

### View Logs
1. Go to your app service in Railway
2. Click "Deployments"
3. Click on active deployment
4. View real-time logs

### Check Build Logs
1. Click on any deployment
2. View "Build Logs" tab

### Database Logs
1. Click on PostgreSQL service
2. View "Logs" tab

## Performance Optimization

### Enable Production Optimizations

1. **Database Connection Pooling**: Already configured via `DATABASE_URL`
2. **Prisma Optimization**: Using `@prisma/adapter-pg` for better performance
3. **Build Optimization**: React Router's SSR is production-optimized

### Recommended Next Steps

1. **Add Redis for session storage** (better than in-memory)
2. **Implement Cloudinary** for image uploads
3. **Add monitoring** with Sentry or LogRocket
4. **Set up CI/CD** with GitHub Actions for testing
5. **Add rate limiting** to prevent abuse

## Rollback to Previous Version

If a deployment breaks:

1. Go to "Deployments" in Railway
2. Find a working previous deployment
3. Click "..." menu → "Redeploy"

## Cost Optimization

Railway offers:
- **Free tier**: $5 credit/month (sufficient for small apps)
- **Developer plan**: $20/month with $20 credit
- **Pay-as-you-go**: Additional usage billed separately

### Tips to Reduce Costs:
- Enable auto-sleep for dev environments
- Use efficient database queries
- Optimize image sizes before upload
- Monitor usage in Railway dashboard

## Support

- **Railway Docs**: [docs.railway.app](https://docs.railway.app)
- **Railway Discord**: [discord.gg/railway](https://discord.gg/railway)
- **Railway Status**: [status.railway.app](https://status.railway.app)

## Security Checklist

Before going to production:

- [x] `SESSION_SECRET` is a strong random string
- [x] `NODE_ENV=production` is set
- [x] Database credentials are never committed to git
- [ ] Add rate limiting for API routes
- [ ] Implement CSRF protection
- [ ] Add helmet.js for security headers
- [ ] Set up HTTPS (Railway does this automatically)
- [ ] Implement proper error handling (don't expose stack traces)

---

## Quick Deploy Commands

```bash
# Push to GitHub (triggers Railway deployment)
git add .
git commit -m "Deploy to production"
git push origin main

# Run migrations via Railway CLI
railway run npx prisma migrate deploy

# Check deployment status
railway status

# View logs
railway logs

# Open app in browser
railway open
```

---

**Your CoffeeMixer app is now live on Railway! ☕🚀**
