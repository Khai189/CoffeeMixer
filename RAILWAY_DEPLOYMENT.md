# Railway Deployment Guide for CoffeeMixer

This guide will help you deploy CoffeeMixer to Railway with a PostgreSQL database.

## Prerequisites

- GitHub account
- Railway account (sign up at https://railway.app)
- Git installed locally

## Step 1: Prepare Your GitHub Repository

1. **Initialize Git** (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit: CoffeeMixer app ready for deployment"
   ```

2. **Create a GitHub repository**:
   - Go to https://github.com/new
   - Name it `coffeemixer` (or your preferred name)
   - Don't initialize with README (you already have one)
   - Click "Create repository"

3. **Push to GitHub**:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/coffeemixer.git
   git branch -M main
   git push -u origin main
   ```

## Step 2: Set Up Railway Project

1. **Log in to Railway**:
   - Go to https://railway.app
   - Sign in with your GitHub account

2. **Create a New Project**:
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Authorize Railway to access your GitHub
   - Select your `coffeemixer` repository

3. **Add PostgreSQL Database**:
   - In your Railway project dashboard
   - Click "+ New"
   - Select "Database" → "Add PostgreSQL"
   - Railway will automatically create a database and set environment variables

## Step 3: Configure Environment Variables

Railway automatically sets these for PostgreSQL:
- `DATABASE_URL`
- `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`

You need to manually add:

1. Click on your service (not the database)
2. Go to the "Variables" tab
3. Add these variables:

   **DIRECT_DATABASE_URL**:
   ```
   ${{Postgres.DATABASE_URL}}
   ```
   (This references the auto-generated DATABASE_URL)

   **SESSION_SECRET**:
   ```
   your-very-long-random-secret-string-here-make-it-at-least-32-characters
   ```
   Generate a secure random string. You can use:
   ```bash
   openssl rand -base64 32
   ```

## Step 4: Configure Build Settings

Railway should auto-detect your build settings from `package.json`, but verify:

1. **Build Command**: `npm run build`
2. **Start Command**: `npm run start`
3. **Install Command**: `npm install` (default)

These are already configured in your `package.json`:
- The `postinstall` script runs `prisma generate`
- The `build` script compiles the React Router app
- The `start` script serves the production build

## Step 5: Run Database Migrations

After the first deployment:

1. Go to your Railway project
2. Click on your service
3. Go to "Settings" → "Service Variables"
4. Find and copy the `DATABASE_URL`

5. On your local machine, temporarily set the production database URL:
   ```bash
   export DATABASE_URL="your-railway-postgres-url-here"
   ```

6. Run migrations:
   ```bash
   npx prisma migrate deploy
   ```

7. (Optional) Seed the database:
   ```bash
   npx prisma db seed
   ```

**Alternative**: Use Railway CLI to run migrations directly on Railway:
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Run migrations
railway run npx prisma migrate deploy
```

## Step 6: Deploy

Railway automatically deploys when you push to your main branch.

To manually trigger a deployment:
1. Go to your Railway project
2. Click "Deploy"
3. Wait for the build to complete

## Step 7: Set Up Custom Domain (Optional)

1. In Railway, go to your service
2. Click "Settings" → "Domains"
3. Click "Generate Domain" for a free Railway subdomain
   - You'll get something like `coffeemixer-production.up.railway.app`
4. Or click "Custom Domain" to use your own domain

## Step 8: File Uploads Configuration

**Important**: Railway's filesystem is ephemeral (files are lost on redeployment).

For production, you should use a cloud storage service:

### Option A: Use Railway Volumes (Persistent Storage)
1. In Railway, go to your service
2. Click "Settings" → "Volumes"
3. Click "Add Volume"
4. Mount path: `/app/public/uploads`
5. This persists uploaded files across deployments

### Option B: Use Cloud Storage (Recommended for Scale)
- AWS S3
- Cloudinary
- Vercel Blob
- UploadThing

You'll need to modify the image upload code in:
- `app/routes/feed.tsx`
- `app/routes/new-recipe.tsx`

## Troubleshooting

### Build Failures

**Issue**: "Cannot find module 'prisma'"
- **Fix**: Make sure `prisma` is in `devDependencies` in `package.json`

**Issue**: "Prisma Client not generated"
- **Fix**: The `postinstall` script should run `prisma generate`. Verify it's in `package.json`

### Runtime Errors

**Issue**: Database connection fails
- **Fix**: Check that `DATABASE_URL` and `DIRECT_DATABASE_URL` are set in Railway variables

**Issue**: Session errors
- **Fix**: Make sure `SESSION_SECRET` is set

### Migration Issues

**Issue**: "Migration failed"
- **Fix**: Check that your local migrations match the production schema
- Run `npx prisma migrate reset` locally, then `npx prisma migrate deploy` on production

## Post-Deployment Checklist

- [ ] App loads successfully
- [ ] Database connections work
- [ ] User signup/login works
- [ ] Image uploads work (or cloud storage configured)
- [ ] Recommendations display correctly
- [ ] Search functionality works
- [ ] Mobile responsiveness verified
- [ ] Image cropping works

## Continuous Deployment

Railway automatically deploys on every push to your main branch:

```bash
# Make changes locally
git add .
git commit -m "Update: description of changes"
git push origin main

# Railway will automatically build and deploy
```

## Monitoring

1. **Logs**: Railway dashboard → Your service → "Logs"
2. **Metrics**: Railway dashboard → Your service → "Metrics"
3. **Health checks**: Railway automatically monitors your service

## Environment Comparison

| Feature | Local | Railway |
|---------|-------|---------|
| Database | Local PostgreSQL | Railway PostgreSQL |
| Build | Vite dev server | Production build |
| Hot reload | ✅ Yes | ❌ No |
| HTTPS | ❌ No | ✅ Yes |
| Auto-deploy | ❌ No | ✅ Yes |
| File storage | Local disk | Ephemeral (needs Volume or cloud) |

## Cost

Railway offers:
- **Free Tier**: $5 credit/month (good for small apps)
- **Pro Plan**: $20/month base + usage

PostgreSQL costs are based on usage (storage + compute).

## Support

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- GitHub Issues: Create issues in your repo
