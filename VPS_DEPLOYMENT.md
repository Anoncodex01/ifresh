# 🖥️ VPS Deployment Guide - iFresh

## Quick Deployment

### Option 1: Automated Script (Recommended)

1. **Copy the deployment script to your VPS:**
```bash
# On your local machine, upload the script
scp deploy-vps.sh root@49.12.103.72:/root/
```

2. **SSH into your VPS:**
```bash
ssh root@49.12.103.72
# Password: Alvin@2025@@2025
```

3. **Run the deployment script:**
```bash
chmod +x /root/deploy-vps.sh
/root/deploy-vps.sh
```

### Option 2: Manual Step-by-Step

Follow these commands on your VPS:

#### 1. Update System
```bash
apt update && apt upgrade -y
```

#### 2. Install Node.js 18+
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs
```

#### 3. Install PM2
```bash
npm install -g pm2
```

#### 4. Install Nginx
```bash
apt install -y nginx
```

#### 5. Clone Repository
```bash
mkdir -p /var/www
cd /var/www
git clone https://github.com/Anoncodex01/ifresh.git
cd ifresh
```

#### 6. Install Dependencies
```bash
npm install
```

#### 7. Create Environment File
```bash
nano .env
```

Add your environment variables (see below).

#### 8. Build Application
```bash
npm run build
```

#### 9. Create Uploads Directory
```bash
mkdir -p public/uploads
chmod -R 755 public/uploads
```

#### 10. Start with PM2
```bash
pm2 start npm --name "ifresh" -- start
pm2 save
pm2 startup
```

#### 11. Configure Nginx
```bash
nano /etc/nginx/sites-available/ifresh
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name _;

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
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

Enable site:
```bash
ln -s /etc/nginx/sites-available/ifresh /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
```

#### 12. Configure Firewall
```bash
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

## Environment Variables

Create `/var/www/ifresh/.env` with:

```env
# Database Configuration
MYSQL_HOST=192.250.229.162
MYSQL_PORT=3306
MYSQL_USER=nisapoti_ifresh
MYSQL_PASSWORD=Alvin@2025
MYSQL_DATABASE=nisapoti_ifresh
MYSQL_SSL=false
MYSQL_POOL_LIMIT=20

# Authentication
AUTH_SECRET=2dLfoF1IeC7MAF9yfb04cc/Hvt1gP5MBW
NODE_ENV=production

# Email Configuration
SMTP_HOST=mail.nisapoti.co.tz
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-email@nisapoti.co.tz
SMTP_PASS=your-email-password
FROM_EMAIL=your-email@nisapoti.co.tz
FROM_NAME=iFRESH

# Admin User
ADMIN_EMAIL=admin@ifresh.com
ADMIN_PASSWORD=Alvin@2025@@2025
ADMIN_NAME=Admin User
```

## SSL Certificate (Optional)

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d your-domain.com
```

## Useful Commands

### PM2 Management
```bash
pm2 status              # Check status
pm2 logs ifresh         # View logs
pm2 restart ifresh      # Restart app
pm2 stop ifresh         # Stop app
pm2 delete ifresh       # Remove from PM2
```

### Update Application
```bash
cd /var/www/ifresh
git pull
npm install
npm run build
pm2 restart ifresh
```

### View Logs
```bash
# Application logs
pm2 logs ifresh

# Nginx logs
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log
```

### Check Services
```bash
systemctl status nginx
systemctl status mysql  # If MySQL is on same server
```

## Troubleshooting

### Application Not Starting
```bash
pm2 logs ifresh
# Check for errors in logs
```

### Nginx Not Working
```bash
nginx -t                # Test configuration
systemctl status nginx  # Check status
systemctl restart nginx # Restart
```

### Database Connection Issues
- Verify database is accessible from VPS
- Check firewall allows connections
- Verify credentials in .env file

### Port Already in Use
```bash
lsof -i :3000           # Check what's using port 3000
kill -9 <PID>           # Kill process if needed
```

## Access Your Application

- **HTTP**: http://49.12.103.72
- **With Domain**: http://your-domain.com (after DNS setup)
- **HTTPS**: https://your-domain.com (after SSL setup)

## Admin Access

1. Go to: http://49.12.103.72/admin/login
2. Login with:
   - Email: `admin@ifresh.com`
   - Password: `Alvin@2025@@2025`

The admin user will be created automatically on first login if `ADMIN_EMAIL` and `ADMIN_PASSWORD` are set in `.env`.

