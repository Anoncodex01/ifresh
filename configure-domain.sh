#!/bin/bash
# Domain Configuration Script for ifreshbeard.com
# Run this on your VPS: bash configure-domain.sh

set -e

DOMAIN="ifreshbeard.com"
APP_PORT=3000

echo "🌐 Configuring domain: $DOMAIN"

# Update Nginx configuration
echo "📝 Updating Nginx configuration..."
cat > /etc/nginx/sites-available/ifresh << NGINXEOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    # Redirect www to non-www (optional - remove if you want both)
    # if (\$host = www.$DOMAIN) {
    #     return 301 http://$DOMAIN\$request_uri;
    # }

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
ln -sf /etc/nginx/sites-available/ifresh /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
echo "🧪 Testing Nginx configuration..."
nginx -t

# Reload Nginx
echo "🔄 Reloading Nginx..."
systemctl reload nginx

# Install Certbot for SSL
echo "📦 Installing Certbot..."
apt update
apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate
echo "🔒 Obtaining SSL certificate..."
certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN --redirect

# Setup auto-renewal
echo "⏰ Setting up SSL auto-renewal..."
systemctl enable certbot.timer
systemctl start certbot.timer

# Update Nginx to use HTTPS (Certbot should do this, but let's verify)
echo "🔄 Final Nginx reload..."
systemctl reload nginx

echo ""
echo "✅ Domain configuration complete!"
echo ""
echo "🌐 Your application is now available at:"
echo "   http://$DOMAIN"
echo "   https://$DOMAIN"
echo ""
echo "📋 Useful commands:"
echo "   certbot renew --dry-run  - Test SSL renewal"
echo "   nginx -t                 - Test Nginx config"
echo "   systemctl status nginx  - Check Nginx status"
echo "   pm2 logs ifresh          - View app logs"
echo ""

