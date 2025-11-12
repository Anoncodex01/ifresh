# 🚀 Quick Start - Production Deployment

## Choose Your Deployment Option

### ✅ **Recommended: Vercel** (Easiest)
- Zero-config deployment
- Automatic HTTPS & CDN
- Free tier available
- Best for most users

### 🖥️ **Alternative: VPS** (More Control)
- Full server control
- Persistent file storage
- Lower cost at scale
- Requires server management

---

## 📦 Pre-Deployment Setup

### 1. Environment Variables

Copy the environment template:
```bash
cp env.example .env
```

Edit `.env` and fill in:
- ✅ Database credentials (MySQL)
- ✅ Authentication secret (generate with: `openssl rand -base64 32`)
- ✅ SMTP email settings
- ✅ (For Vercel) Cloud storage (AWS S3 or Cloudinary)

### 2. Database Setup

**Option A: Cloud Database (Recommended for Vercel)**
- PlanetScale (free tier)
- AWS RDS
- DigitalOcean Managed Database

**Option B: Self-Hosted (For VPS)**
```bash
mysql -u root -p
CREATE DATABASE ifresh;
CREATE USER 'ifresh_user'@'localhost' IDENTIFIED BY 'strong_password';
GRANT ALL PRIVILEGES ON ifresh.* TO 'ifresh_user'@'localhost';
FLUSH PRIVILEGES;
```

---

## 🌐 Deploy to Vercel (5 minutes)

### Step 1: Install Vercel CLI (optional)
```bash
npm install -g vercel
```

### Step 2: Deploy
```bash
vercel
```

Or connect via GitHub:
1. Go to [vercel.com](https://vercel.com)
2. Import your Git repository
3. Add environment variables in dashboard
4. Deploy!

### Step 3: Configure Cloud Storage (Required for Vercel)

**Option A: AWS S3**
1. Create S3 bucket
2. Set public read permissions
3. Create IAM user with S3 access
4. Add to `.env`:
   ```
   AWS_ACCESS_KEY_ID=your-key
   AWS_SECRET_ACCESS_KEY=your-secret
   AWS_REGION=us-east-1
   AWS_S3_BUCKET=your-bucket-name
   ```
5. Install package: `npm install @aws-sdk/client-s3`

**Option B: Cloudinary** (Easier)
1. Sign up at [cloudinary.com](https://cloudinary.com) (free tier)
2. Get credentials from dashboard
3. Add to `.env`:
   ```
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   CLOUDINARY_UPLOAD_PRESET=unsigned
   ```

### Step 4: Add Environment Variables in Vercel
- Go to Project Settings → Environment Variables
- Add all variables from your `.env` file

---

## 🖥️ Deploy to VPS (15 minutes)

### Step 1: Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx
```

### Step 2: Clone & Build
```bash
cd /var/www
sudo git clone https://github.com/your-username/ifresh.git
cd ifresh
npm install
cp env.example .env
nano .env  # Edit with your values
npm run build
```

### Step 3: Start Application
```bash
pm2 start npm --name "ifresh" -- start
pm2 save
pm2 startup
```

### Step 4: Configure Nginx
```bash
sudo nano /etc/nginx/sites-available/ifresh
```

Add:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable:
```bash
sudo ln -s /etc/nginx/sites-available/ifresh /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Step 5: SSL Certificate
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### Step 6: File Uploads (Local Storage Works on VPS)
```bash
sudo chown -R $USER:$USER /var/www/ifresh/public/uploads
sudo chmod -R 755 /var/www/ifresh/public/uploads
```

---

## ✅ Post-Deployment Checklist

- [ ] Test user registration/login
- [ ] Test product browsing
- [ ] Test cart and checkout
- [ ] Test file uploads
- [ ] Test admin panel
- [ ] Verify email sending
- [ ] Check database connections
- [ ] Test on mobile devices
- [ ] Set up monitoring (optional)
- [ ] Configure backups (database)

---

## 🔧 Common Issues

### Database Connection Failed
- Check firewall rules
- Verify credentials
- Test: `mysql -h HOST -u USER -p`

### File Uploads Not Working (Vercel)
- Must configure cloud storage (S3 or Cloudinary)
- Local filesystem doesn't work on serverless

### Build Errors
- Check Node.js version: `node -v` (need 18+)
- Clear cache: `rm -rf .next node_modules && npm install`
- Check TypeScript: `npm run lint`

### Email Not Sending
- Verify SMTP credentials
- For Gmail, use App Password (not regular password)
- Check spam folder

---

## 📚 Full Documentation

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

---

## 🆘 Need Help?

1. Check logs:
   - Vercel: Dashboard → Deployments → View Logs
   - VPS: `pm2 logs ifresh`

2. Verify environment variables are set correctly

3. Test database connectivity

4. Check Next.js build output

