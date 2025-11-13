#!/bin/bash
# Fresh VPS Setup Script for iFresh
# Run this on your VPS: bash fresh-vps-setup.sh

set -e

DOMAIN="ifreshbeard.com"
APP_NAME="ifresh"
APP_PORT=3000
PROJECT_DIR="/var/www/ifresh"
GITHUB_REPO="https://github.com/Anoncodex01/ifresh.git"

echo "🚀 Starting Fresh VPS Setup for iFresh..."
echo ""

# Update system
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# Install Node.js 18+
echo "📦 Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Verify Node.js installation
NODE_VERSION=$(node -v)
echo "✅ Node.js installed: $NODE_VERSION"

# Install PM2
echo "📦 Installing PM2..."
npm install -g pm2

# Install Nginx
echo "📦 Installing Nginx..."
apt install -y nginx

# Install Git
echo "📦 Installing Git..."
apt install -y git

# Install Certbot for SSL
echo "📦 Installing Certbot..."
apt install -y certbot python3-certbot-nginx

# Create project directory
echo "📁 Setting up project directory..."
mkdir -p /var/www
cd /var/www

# Clone repository
if [ -d "ifresh" ]; then
    echo "📁 Repository exists, updating..."
    cd ifresh
    git fetch origin
    git reset --hard origin/main
    git pull
else
    echo "📁 Cloning repository from GitHub..."
    git clone $GITHUB_REPO
    cd ifresh
fi

# Install dependencies
echo "📦 Installing npm dependencies..."
npm install

# Create .env file
echo "📝 Creating .env file..."
cat > .env << 'EOF'
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

# Domain (for Next.js)
NEXT_PUBLIC_APP_URL=https://ifreshbeard.com
EOF

# Build application
echo "🔨 Building Next.js application..."
npm run build

# Create uploads directory
echo "📁 Creating uploads directory..."
mkdir -p public/uploads
chmod -R 755 public/uploads

# Stop existing PM2 process if running
echo "⚙️  Setting up PM2..."
pm2 delete $APP_NAME 2>/dev/null || true

# Start application with PM2
echo "🚀 Starting application with PM2..."
cd $PROJECT_DIR
pm2 start npm --name "$APP_NAME" -- start
pm2 save
pm2 startup

# Configure Nginx
echo "⚙️  Configuring Nginx..."
cat > /etc/nginx/sites-available/$APP_NAME << NGINXEOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    location / {
        proxy_pass http://localhost:$APP_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Increase max upload size
    client_max_body_size 50M;
}
NGINXEOF

# Enable site
ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
echo "🧪 Testing Nginx configuration..."
nginx -t

# Reload Nginx
echo "🔄 Reloading Nginx..."
systemctl reload nginx

# Configure firewall
echo "🔥 Configuring firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Wait a moment for DNS propagation (if domain is already pointing)
echo "⏳ Waiting 10 seconds before SSL setup..."
sleep 10

# Obtain SSL certificate
echo "🔒 Obtaining SSL certificate..."
echo "⚠️  Make sure your domain DNS is pointing to this server!"
read -p "Press Enter to continue with SSL setup (or Ctrl+C to skip)..."
certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN --redirect || {
    echo "⚠️  SSL certificate setup failed. This is OK if DNS is not yet configured."
    echo "   You can run this later: certbot --nginx -d $DOMAIN -d www.$DOMAIN"
}

# Setup auto-renewal
echo "⏰ Setting up SSL auto-renewal..."
systemctl enable certbot.timer
systemctl start certbot.timer

# Final reload
systemctl reload nginx

echo ""
echo "✅ Fresh VPS Setup Complete!"
echo ""
echo "🌐 Your application is running at:"
echo "   http://$DOMAIN"
echo "   https://$DOMAIN (if SSL was configured)"
echo ""
echo "🔐 Admin login:"
echo "   URL: https://$DOMAIN/admin/login"
echo "   Email: admin@ifresh.com"
echo "   Password: Alvin@2025@@2025"
echo ""
echo "📋 Useful commands:"
echo "   pm2 status              - Check app status"
echo "   pm2 logs $APP_NAME      - View app logs"
echo "   pm2 restart $APP_NAME   - Restart app"
echo "   nginx -t                - Test Nginx config"
echo "   systemctl status nginx - Check Nginx status"
echo "   certbot renew --dry-run - Test SSL renewal"
echo ""
echo "📝 Next steps:"
echo "   1. Make sure DNS A record for $DOMAIN points to this server"
echo "   2. If SSL failed, run: certbot --nginx -d $DOMAIN -d www.$DOMAIN"
echo "   3. Update .env file with your actual email credentials"
echo ""

