# iFresh Production Deployment Guide

This guide covers deploying your iFresh Next.js application to production, with options for both **Vercel** (recommended) and **VPS** deployment.

## 📋 Pre-Deployment Checklist

- [ ] All environment variables configured
- [ ] MySQL database accessible from deployment location
- [ ] SMTP email service configured
- [ ] File upload storage configured (for Vercel)
- [ ] Domain name ready (optional)
- [ ] SSL certificate configured (for VPS)

---

## 🚀 Option 1: Deploy to Vercel (Recommended)

Vercel is the easiest and most reliable option for Next.js applications. It provides:
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Zero-config deployment
- ✅ Automatic scaling
- ✅ Free tier available

### Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub/GitLab/Bitbucket**: Your code should be in a Git repository
3. **MySQL Database**: Use a cloud MySQL service (PlanetScale, AWS RDS, DigitalOcean, etc.)
4. **File Storage**: Use cloud storage (AWS S3, Cloudinary, or similar) - **REQUIRED** for Vercel

### Step 1: Prepare Your Code

1. **Fix File Uploads**: The current upload route uses local filesystem which won't work on Vercel. You need to:
   - Use cloud storage (S3, Cloudinary, etc.)
   - Or use Vercel Blob Storage
   - See `app/api/upload/route.ts` for current implementation

2. **Push to Git**: Ensure all code is committed and pushed to your repository

### Step 2: Connect to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New Project"
3. Import your Git repository
4. Vercel will auto-detect Next.js

### Step 3: Configure Environment Variables

In Vercel dashboard → Project Settings → Environment Variables, add:

**Database:**
```
MYSQL_HOST=your-database-host
MYSQL_PORT=3306
MYSQL_USER=your-database-user
MYSQL_PASSWORD=your-database-password
MYSQL_DATABASE=your-database-name
MYSQL_SSL=true
MYSQL_SSL_REJECT_UNAUTHORIZED=true
MYSQL_POOL_LIMIT=20
```

**Authentication:**
```
AUTH_SECRET=your-random-secret-key-min-32-chars
# OR
NEXTAUTH_SECRET=your-random-secret-key-min-32-chars
# OR
JWT_SECRET=your-random-secret-key-min-32-chars
```

**Email (SMTP):**
```
SMTP_HOST=smtp.your-email-provider.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-email@example.com
SMTP_PASS=your-email-password
FROM_EMAIL=your-email@example.com
FROM_NAME=iFRESH
```

**Generate AUTH_SECRET:**
```bash
openssl rand -base64 32
```

### Step 4: Deploy

1. Click "Deploy"
2. Wait for build to complete
3. Your site will be live at `your-project.vercel.app`

### Step 5: Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your domain
3. Follow DNS configuration instructions

### Vercel Limitations & Considerations

⚠️ **Important Notes:**
- **File Uploads**: Must use cloud storage (S3, Cloudinary, Vercel Blob)
- **Serverless Functions**: 10-second timeout on free tier, 60 seconds on Pro
- **Database Connections**: Use connection pooling (already configured)
- **Cold Starts**: First request may be slower

---

## 🖥️ Option 2: Deploy to VPS (DigitalOcean, AWS EC2, etc.)

For more control and persistent file storage, deploy to a VPS.

### Prerequisites

1. **VPS Server**: Ubuntu 20.04+ recommended
2. **Domain Name**: Pointed to your server IP
3. **SSH Access**: To your server
4. **MySQL Database**: Can be on same server or remote

### Step 1: Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 (process manager)
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx

# Install MySQL (if hosting locally)
sudo apt install -y mysql-server
```

### Step 2: Clone and Build

```bash
# Clone your repository
cd /var/www
sudo git clone https://github.com/your-username/ifresh.git
cd ifresh

# Install dependencies
npm install

# Create .env file
sudo nano .env
# Paste all environment variables (see .env.example)

# Build the application
npm run build
```

### Step 3: Configure Environment

Create `.env` file in project root:
```bash
sudo nano /var/www/ifresh/.env
```

Add all environment variables (see `.env.example` file).

### Step 4: Start with PM2

```bash
cd /var/www/ifresh
pm2 start npm --name "ifresh" -- start
pm2 save
pm2 startup
```

### Step 5: Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/ifresh
```

Add configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/ifresh /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Step 6: SSL with Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

### Step 7: Configure Firewall

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### Step 8: File Uploads

For VPS, local file storage works fine. Ensure:
```bash
sudo chown -R $USER:$USER /var/www/ifresh/public/uploads
sudo chmod -R 755 /var/www/ifresh/public/uploads
```

### VPS Maintenance Commands

```bash
# View logs
pm2 logs ifresh

# Restart app
pm2 restart ifresh

# Update code
cd /var/www/ifresh
git pull
npm install
npm run build
pm2 restart ifresh
```

---

## 🔧 Database Setup

### Option A: Cloud MySQL (Recommended for Vercel)

**PlanetScale** (Free tier available):
1. Sign up at [planetscale.com](https://planetscale.com)
2. Create database
3. Get connection string
4. Use SSL connection

**DigitalOcean Managed Database**:
1. Create database in DigitalOcean
2. Configure firewall rules
3. Use connection details in environment variables

### Option B: Self-Hosted MySQL (For VPS)

```bash
sudo mysql_secure_installation
sudo mysql -u root -p

# Create database and user
CREATE DATABASE ifresh;
CREATE USER 'ifresh_user'@'localhost' IDENTIFIED BY 'strong_password';
GRANT ALL PRIVILEGES ON ifresh.* TO 'ifresh_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

---

## 📧 Email Configuration

### Gmail SMTP
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password  # Use App Password, not regular password
```

### SendGrid
```
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

### Mailgun
```
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-mailgun-username
SMTP_PASS=your-mailgun-password
```

---

## 🐛 Troubleshooting

### Build Errors
- Check Node.js version (18+ required)
- Ensure all dependencies are installed
- Check TypeScript errors: `npm run lint`

### Database Connection Issues
- Verify MySQL is accessible from deployment location
- Check firewall rules
- Verify credentials
- Test connection: `mysql -h HOST -u USER -p`

### File Upload Issues (Vercel)
- Must use cloud storage (S3, Cloudinary)
- Cannot use local filesystem on serverless

### Performance Issues
- Enable database connection pooling (already configured)
- Use CDN for static assets (automatic on Vercel)
- Optimize images (consider Next.js Image component)

---

## 🔒 Security Checklist

- [ ] Use strong AUTH_SECRET (32+ characters)
- [ ] Use strong database passwords
- [ ] Enable SSL for database connections
- [ ] Use HTTPS (automatic on Vercel, Let's Encrypt on VPS)
- [ ] Keep dependencies updated: `npm audit fix`
- [ ] Use environment variables, never commit secrets
- [ ] Configure CORS if needed
- [ ] Set up rate limiting (consider middleware)

---

## 📊 Monitoring

### Vercel
- Built-in analytics and monitoring
- View in Vercel dashboard

### VPS
```bash
# Monitor with PM2
pm2 monit

# View logs
pm2 logs ifresh --lines 100
```

---

## 🚀 Quick Start Commands

### Local Development
```bash
npm install
npm run dev
```

### Production Build (Test Locally)
```bash
npm run build
npm start
```

### Deploy to Vercel
```bash
npm install -g vercel
vercel
```

---

## 📝 Next Steps After Deployment

1. Test all functionality
2. Set up monitoring/alerts
3. Configure backups (database)
4. Set up CI/CD pipeline
5. Configure error tracking (Sentry, etc.)
6. Set up analytics

---

## 💡 Recommendations

**For Most Users**: Use **Vercel** - easiest setup, automatic scaling, free tier

**For Advanced Users**: Use **VPS** if you need:
- Persistent file storage without cloud services
- More control over server configuration
- Custom server requirements
- Lower long-term costs at scale

---

## 📞 Support

If you encounter issues:
1. Check logs (Vercel dashboard or `pm2 logs`)
2. Verify all environment variables are set
3. Test database connectivity
4. Check Next.js build output

