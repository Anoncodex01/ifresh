# Continue VPS Deployment - Manual Steps

Since we've already installed Node.js, npm, and PM2, here are the commands to continue:

## Step 1: SSH into your server
```bash
ssh root@49.12.103.72
# Password: Alvin@2025@@2025
```

## Step 2: Verify repository is cloned
```bash
cd /var/www
ls -la
# You should see the 'ifresh' directory
```

## Step 3: If repository is not there, clone it
```bash
cd /var/www
git clone https://github.com/Anoncodex01/ifresh.git
cd ifresh
```

## Step 4: Install dependencies
```bash
cd /var/www/ifresh
npm install
# This will take 2-5 minutes
```

## Step 5: Create .env file
```bash
cd /var/www/ifresh
nano .env
```

Paste this content (press Ctrl+X, then Y, then Enter to save):
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

## Step 6: Build the application
```bash
cd /var/www/ifresh
npm run build
# This will take 1-3 minutes
```

## Step 7: Create uploads directory
```bash
cd /var/www/ifresh
mkdir -p public/uploads
chmod -R 755 public/uploads
```

## Step 8: Start with PM2
```bash
cd /var/www/ifresh
pm2 start npm --name "ifresh" -- start
pm2 save
pm2 startup
# Follow the command it shows you (usually: sudo env PATH=... pm2 startup systemd -u root --hp /root)
```

## Step 9: Configure Nginx
```bash
nano /etc/nginx/sites-available/ifresh
```

Paste this configuration:
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

Save and exit (Ctrl+X, Y, Enter)

## Step 10: Enable Nginx site
```bash
ln -sf /etc/nginx/sites-available/ifresh /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
```

## Step 11: Configure firewall
```bash
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
```

## Step 12: Check status
```bash
pm2 status
pm2 logs ifresh
```

## ✅ Done!

Your application should be running at: **http://49.12.103.72**

Admin login: **http://49.12.103.72/admin/login**
- Email: admin@ifresh.com
- Password: Alvin@2025@@2025

