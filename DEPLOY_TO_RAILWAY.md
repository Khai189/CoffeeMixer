# Deploy CoffeeMixer to Railway

## Prerequisites
- GitHub account
- Railway account (sign up at railway.app with GitHub)

## Step 1: Push to GitHub

```bash
# Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit - CoffeeMixer app"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/coffeemixer.git
git branch -M main
git push -u origin main
```

## Step 2: Deploy on Railway

1. Go to [railway.app](https://railway.app) and sign in with GitHub
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your `coffeemixer` repository
5. Railway will auto-detect it's a Node.js app

## Step 3: Add PostgreSQL Database

1. In your Railway project, click "New Service"
2. Select "PostgreSQL"
3. Railway will automatically create `DATABASE_URL` and link it to your app

## Step 4: Add Environment Variables

1. Click on your app service (not the database)
2. Go to "Variables" tab
3. Add these variables:
   - `SESSION_SECRET` = (generate a random string, e.g., `openssl rand -base64 32`)
   - `DATABASE_URL` = (should already be there from PostgreSQL service)
   - `DIRECT_DATABASE_URL` = `${{Postgres.DATABASE_URL}}` (reference the Postgres service)

## Step 5: Run Database Migrations

1. In Railway, go to your app service
2. Click on "Settings" → "Deploy"
3. Add a "Custom Build Command":
   ```
   npm run build && npx prisma migrate deploy
   ```

## Step 6: Deploy!

Railway will automatically:
- Install dependencies (`npm install`)
- Run Prisma generate (from `postinstall` script)
- Build your app (`npm run build`)
- Run migrations (`prisma migrate deploy`)
- Start your app (`npm start`)

## Step 7: Access Your App

- Railway will give you a URL like `https://your-app.up.railway.app`
- Click "Generate Domain" in Settings if not auto-generated

## Important Notes

- **Image Uploads**: The `public/uploads/` folder will be ephemeral. For production, consider using:
  - Cloudinary
  - AWS S3
  - Railway Volumes (persistent storage)

- **Database**: Railway PostgreSQL is production-ready and includes automatic backups

- **Environment Variables**: Never commit `.env` to GitHub (already in `.gitignore`)

## Troubleshooting

**Build fails?**
- Check Railway logs in the "Deployments" tab
- Verify `package.json` scripts are correct

**Database connection fails?**
- Ensure PostgreSQL service is linked to your app
- Check that `DATABASE_URL` variable exists

**App crashes on start?**
- Check that migrations ran successfully
- Verify `SESSION_SECRET` is set

## Local Development

Keep your local `.env` file as-is:
```
DATABASE_URL="postgresql://husamkm@localhost:5432/coffeemixer"
DIRECT_DATABASE_URL="postgresql://husamkm@localhost:5432/coffeemixer"
SESSION_SECRET="coffeemixer-dev-secret-change-in-production"
```

Railway will use its own environment variables in production - no changes needed to your code!
