#!/bin/bash
# iFresh VPS Deployment Script
# Run this on your VPS: bash vps-setup.sh

set -e

echo "🚀 Starting iFresh VPS Deployment..."

# Update system
echo "📦 Updating system..."
apt update && apt upgrade -y

# Install Node.js 18+
echo "📦 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Install PM2
echo "📦 Installing PM2..."
npm install -g pm2

# Install Nginx
echo "📦 Installing Nginx..."
apt install -y nginx

# Install Git
echo "📦 Installing Git..."
apt install -y git

# Create project directory
echo "📁 Setting up project..."
mkdir -p /var/www
cd /var/www

# Clone or update repository
if [ -d "ifresh" ]; then
    echo "📁 Updating repository..."
    cd ifresh
    git pull
else
    echo "📁 Cloning repository..."
    git clone https://github.com/Anoncodex01/ifresh.git
    cd ifresh
fi

# Install dependencies
echo "📦 Installing dependencies..."
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
EOF

# Build application
echo "🔨 Building application..."
npm run build

# Create uploads directory
echo "📁 Creating uploads directory..."
mkdir -p public/uploads
chmod -R 755 public/uploads

# Setup PM2
echo "⚙️  Setting up PM2..."
pm2 delete ifresh 2>/dev/null || true
pm2 start npm --name "ifresh" -- start
pm2 save
pm2 startup

# Configure Nginx
echo "⚙️  Configuring Nginx..."
cat > /etc/nginx/sites-available/ifresh << 'NGINXEOF'
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
NGINXEOF

# Enable site
ln -sf /etc/nginx/sites-available/ifresh /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and reload Nginx
nginx -t
systemctl reload nginx

# Configure firewall
echo "🔥 Configuring firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 Your application is running at: http://49.12.103.72"
echo "🔐 Admin login: http://49.12.103.72/admin/login"
echo "   Email: admin@ifresh.com"
echo "   Password: Alvin@2025@@2025"
echo ""
echo "📋 Useful commands:"
echo "   pm2 status          - Check app status"
echo "   pm2 logs ifresh     - View logs"
echo "   pm2 restart ifresh  - Restart app"
echo ""

