# 🚀 Deploy to Vercel - Step by Step Guide

Your code is now on GitHub! Follow these steps to deploy to Vercel.

## Step 1: Sign Up / Sign In to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **"Sign Up"** or **"Log In"**
3. Choose **"Continue with GitHub"** (recommended)
4. Authorize Vercel to access your GitHub account

## Step 2: Import Your Project

1. In Vercel dashboard, click **"Add New Project"**
2. Find and select **"ifresh"** repository
3. Click **"Import"**

## Step 3: Configure Project Settings

Vercel will auto-detect Next.js. You can leave most settings as default:

- **Framework Preset**: Next.js (auto-detected)
- **Root Directory**: `./` (default)
- **Build Command**: `npm run build` (default)
- **Output Directory**: `.next` (default)
- **Install Command**: `npm install` (default)

## Step 4: Set Up Environment Variables

**⚠️ CRITICAL: Do this BEFORE deploying!**

Click **"Environment Variables"** and add these variables:

### Database Configuration
```
MYSQL_HOST=your-database-host
MYSQL_PORT=3306
MYSQL_USER=your-database-user
MYSQL_PASSWORD=your-database-password
MYSQL_DATABASE=ifresh
MYSQL_SSL=true
MYSQL_POOL_LIMIT=20
```

### Authentication Secret
```
AUTH_SECRET=your-generated-secret-key
```
**Generate one**: Run `openssl rand -base64 32` in terminal

### Email Configuration (SMTP)
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=your-email@gmail.com
FROM_NAME=iFRESH
```

### Cloud Storage (REQUIRED for Vercel)

**Option A: AWS S3**
```
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name
```

**Option B: Cloudinary** (Easier, recommended)
```
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
CLOUDINARY_UPLOAD_PRESET=unsigned
```

### Node Environment
```
NODE_ENV=production
```

## Step 5: Install Cloud Storage Package (If Using S3)

If you're using AWS S3, you need to add the package to your project:

1. Go to your project root
2. Run: `npm install @aws-sdk/client-s3`
3. Commit and push:
   ```bash
   git add package.json package-lock.json
   git commit -m "Add AWS S3 SDK for file uploads"
   git push
   ```

**Note**: If using Cloudinary, no additional package is needed!

## Step 6: Deploy!

1. Click **"Deploy"** button
2. Wait for build to complete (2-5 minutes)
3. Your site will be live at `your-project.vercel.app`

## Step 7: Verify Deployment

After deployment, test:

- ✅ Homepage loads
- ✅ User registration/login
- ✅ Product browsing
- ✅ File uploads (if configured)
- ✅ Admin panel access

## Step 8: Set Up Custom Domain (Optional)

1. Go to **Project Settings** → **Domains**
2. Add your domain (e.g., `ifresh.co.tz`)
3. Follow DNS configuration instructions
4. Wait for SSL certificate (automatic)

---

## 🔧 Quick Setup for Cloud Storage

### Cloudinary Setup (Recommended - Free Tier Available)

1. Sign up at [cloudinary.com](https://cloudinary.com)
2. Go to Dashboard → Settings
3. Copy:
   - Cloud Name
   - API Key
   - API Secret
4. Go to Settings → Upload → Upload Presets
5. Create a new preset:
   - Name: `unsigned`
   - Signing Mode: `Unsigned`
   - Save
6. Add to Vercel environment variables

### AWS S3 Setup

1. Create S3 bucket in AWS Console
2. Enable public read access
3. Create IAM user with S3 permissions
4. Get Access Key ID and Secret Access Key
5. Add to Vercel environment variables
6. Install package: `npm install @aws-sdk/client-s3`

---

## 🐛 Troubleshooting

### Build Fails

**Error: Missing environment variables**
- Make sure all required variables are set in Vercel dashboard
- Check variable names match exactly (case-sensitive)

**Error: Database connection failed**
- Verify database is accessible from internet
- Check firewall rules allow Vercel IPs
- Verify credentials are correct

### File Uploads Not Working

**Error: Storage configuration error**
- Must configure either AWS S3 or Cloudinary
- Verify all credentials are correct
- Check bucket/preset permissions

### Database Connection Issues

**For Cloud Databases (PlanetScale, AWS RDS, etc.)**
- Ensure `MYSQL_SSL=true`
- Verify database allows connections from Vercel
- Check connection string format

---

## 📊 Monitoring

- **Logs**: View in Vercel dashboard → Deployments → Click deployment → Logs
- **Analytics**: Available in Vercel dashboard (Pro plan)
- **Errors**: Check function logs in dashboard

---

## 🔄 Updating Your Site

After making changes:

1. Push to GitHub:
   ```bash
   git add .
   git commit -m "Your changes"
   git push
   ```

2. Vercel automatically deploys (if connected to GitHub)
3. Or manually trigger: Vercel dashboard → Deployments → Redeploy

---

## ✅ Post-Deployment Checklist

- [ ] All environment variables configured
- [ ] Database connection working
- [ ] File uploads working (cloud storage configured)
- [ ] Email sending working
- [ ] User registration/login tested
- [ ] Admin panel accessible
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active (automatic on Vercel)

---

## 🎉 You're Live!

Your iFresh e-commerce platform is now deployed on Vercel!

**Your site URL**: `https://your-project.vercel.app`

Need help? Check the main [DEPLOYMENT.md](./DEPLOYMENT.md) guide for more details.

