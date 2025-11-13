#!/usr/bin/expect -f

# Automated VPS Deployment Script
# Usage: ./deploy-remote.sh

set timeout 300
set server "49.12.103.72"
set user "root"
set password "Alvin@2025@@2025"

spawn ssh -o StrictHostKeyChecking=no ${user}@${server}

expect {
    "password:" {
        send "${password}\r"
    }
    "yes/no" {
        send "yes\r"
        expect "password:"
        send "${password}\r"
    }
}

expect "# "

# Update system
send "apt update && apt upgrade -y\r"
expect "# "

# Install Node.js
send "curl -fsSL https://deb.nodesource.com/setup_18.x | bash -\r"
expect "# "
send "apt install -y nodejs\r"
expect "# "

# Install PM2
send "npm install -g pm2\r"
expect "# "

# Install Nginx
send "apt install -y nginx\r"
expect "# "

# Install Git
send "apt install -y git\r"
expect "# "

# Create project directory
send "mkdir -p /var/www\r"
expect "# "
send "cd /var/www\r"
expect "# "

# Clone or update repository
send "if [ -d \"ifresh\" ]; then cd ifresh && git pull; else git clone https://github.com/Anoncodex01/ifresh.git && cd ifresh; fi\r"
expect "# "

# Install dependencies
send "npm install\r"
expect "# "

# Create .env file
send "cat > .env << 'ENVEOF'\r"
send "# Database Configuration\r"
send "MYSQL_HOST=192.250.229.162\r"
send "MYSQL_PORT=3306\r"
send "MYSQL_USER=nisapoti_ifresh\r"
send "MYSQL_PASSWORD=Alvin@2025\r"
send "MYSQL_DATABASE=nisapoti_ifresh\r"
send "MYSQL_SSL=false\r"
send "MYSQL_POOL_LIMIT=20\r"
send "\r"
send "# Authentication\r"
send "AUTH_SECRET=2dLfoF1IeC7MAF9yfb04cc/Hvt1gP5MBW\r"
send "NODE_ENV=production\r"
send "\r"
send "# Email Configuration\r"
send "SMTP_HOST=mail.nisapoti.co.tz\r"
send "SMTP_PORT=465\r"
send "SMTP_SECURE=true\r"
send "SMTP_USER=your-email@nisapoti.co.tz\r"
send "SMTP_PASS=your-email-password\r"
send "FROM_EMAIL=your-email@nisapoti.co.tz\r"
send "FROM_NAME=iFRESH\r"
send "\r"
send "# Admin User\r"
send "ADMIN_EMAIL=admin@ifresh.com\r"
send "ADMIN_PASSWORD=Alvin@2025@@2025\r"
send "ADMIN_NAME=Admin User\r"
send "ENVEOF\r"
expect "# "

# Build application
send "npm run build\r"
expect "# "

# Create uploads directory
send "mkdir -p public/uploads && chmod -R 755 public/uploads\r"
expect "# "

# Setup PM2
send "pm2 delete ifresh 2>/dev/null || true\r"
expect "# "
send "pm2 start npm --name \"ifresh\" -- start\r"
expect "# "
send "pm2 save\r"
expect "# "
send "pm2 startup\r"
expect "# "

# Configure Nginx
send "cat > /etc/nginx/sites-available/ifresh << 'NGINXEOF'\r"
send "server {\r"
send "    listen 80;\r"
send "    server_name _;\r"
send "\r"
send "    location / {\r"
send "        proxy_pass http://localhost:3000;\r"
send "        proxy_http_version 1.1;\r"
send "        proxy_set_header Upgrade \\\$http_upgrade;\r"
send "        proxy_set_header Connection 'upgrade';\r"
send "        proxy_set_header Host \\\$host;\r"
send "        proxy_cache_bypass \\\$http_upgrade;\r"
send "        proxy_set_header X-Real-IP \\\$remote_addr;\r"
send "        proxy_set_header X-Forwarded-For \\\$proxy_add_x_forwarded_for;\r"
send "        proxy_set_header X-Forwarded-Proto \\\$scheme;\r"
send "        proxy_connect_timeout 60s;\r"
send "        proxy_send_timeout 60s;\r"
send "        proxy_read_timeout 60s;\r"
send "    }\r"
send "}\r"
send "NGINXEOF\r"
expect "# "

send "ln -sf /etc/nginx/sites-available/ifresh /etc/nginx/sites-enabled/\r"
expect "# "
send "rm -f /etc/nginx/sites-enabled/default\r"
expect "# "
send "nginx -t\r"
expect "# "
send "systemctl reload nginx\r"
expect "# "

# Configure firewall
send "ufw allow 22/tcp\r"
expect "# "
send "ufw allow 80/tcp\r"
expect "# "
send "ufw allow 443/tcp\r"
expect "# "
send "ufw --force enable\r"
expect "# "

send "echo '✅ Deployment complete!'\r"
expect "# "
send "echo '🌐 Application running at: http://49.12.103.72'\r"
expect "# "

send "exit\r"
expect eof

