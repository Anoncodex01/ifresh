# 🔧 Vercel Database Connection Setup

## ⚠️ Common Issue: 401 Unauthorized Errors

If you're seeing `401 Unauthorized` errors on `/api/admin/login` or `/api/admin/me`, it's usually a **database connection problem**, not an authentication issue.

## 🔍 Troubleshooting Steps

### 1. Check Environment Variables in Vercel

Go to **Vercel Dashboard → Your Project → Settings → Environment Variables**

Make sure these are set:
```
MYSQL_HOST=your-database-host
MYSQL_USER=your-database-user
MYSQL_PASSWORD=your-database-password
MYSQL_DATABASE=your-database-name
MYSQL_PORT=3306
MYSQL_SSL=true  # For cloud databases
```

### 2. Database Firewall / IP Whitelisting

**Vercel uses dynamic IP addresses**, so you can't whitelist specific IPs. You have two options:

#### Option A: Allow All IPs (Recommended for Cloud Databases)
- **PlanetScale**: No firewall needed, connections are secure via SSL
- **AWS RDS**: Set security group to allow `0.0.0.0/0` on port 3306
- **DigitalOcean**: Allow all IPs in firewall settings
- **Hetzner**: Allow all IPs in firewall settings

#### Option B: Use Connection Pooling (PlanetScale, Prisma)
- Use a connection pooler that doesn't require IP whitelisting
- PlanetScale provides this automatically

### 3. Test Database Connection

Check Vercel logs:
1. Go to **Vercel Dashboard → Your Project → Deployments**
2. Click on the latest deployment
3. Click **"View Function Logs"**
4. Look for database connection errors

Common errors:
- `ENOTFOUND` - Cannot resolve database hostname
- `ECONNREFUSED` - Connection refused (firewall blocking)
- `ER_ACCESS_DENIED_ERROR` - Wrong username/password
- `ETIMEDOUT` - Connection timeout

### 4. Create Admin User

The admin user is created automatically if you set these environment variables:

```
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your-secure-password
ADMIN_NAME=Admin User
```

**First login will create the admin user automatically.**

### 5. Database Provider-Specific Setup

#### PlanetScale (Recommended)
1. Create database at [planetscale.com](https://planetscale.com)
2. Get connection string
3. Set in Vercel:
   ```
   MYSQL_HOST=your-host.psdb.cloud
   MYSQL_USER=your-username
   MYSQL_PASSWORD=your-password
   MYSQL_DATABASE=your-database
   MYSQL_SSL=true
   ```
4. **No IP whitelisting needed** - SSL handles security

#### AWS RDS
1. Create RDS MySQL instance
2. Set security group to allow inbound on port 3306 from `0.0.0.0/0`
3. Or use RDS Proxy for better security
4. Set environment variables in Vercel

#### DigitalOcean Managed Database
1. Create database
2. Go to **Settings → Trusted Sources**
3. Add `0.0.0.0/0` (allow all) OR add Vercel IP ranges (see below)
4. Set environment variables

#### Hetzner Cloud Database
1. Create database
2. Go to **Networking → Allowed IPs**
3. Add `0.0.0.0/0` to allow all IPs
4. Set environment variables

### 6. Vercel IP Ranges (If Required)

If your database provider requires specific IPs, you can use Vercel's IP ranges:
- Check [Vercel's documentation](https://vercel.com/docs/security/deployment-protection#ip-allowlist) for current IP ranges
- Note: These change, so allowing all IPs is usually better

## ✅ Quick Checklist

- [ ] All database environment variables set in Vercel
- [ ] Database firewall allows connections (0.0.0.0/0 or Vercel IPs)
- [ ] Database is running and accessible
- [ ] SSL enabled if using cloud database (`MYSQL_SSL=true`)
- [ ] Admin user created (via `ADMIN_EMAIL` and `ADMIN_PASSWORD` env vars)
- [ ] Checked Vercel function logs for specific errors

## 🐛 Common Errors & Solutions

### Error: "Cannot connect to MySQL"
- **Solution**: Check `MYSQL_HOST` and `MYSQL_PORT`
- **Solution**: Verify database firewall allows connections

### Error: "Database access denied"
- **Solution**: Check `MYSQL_USER` and `MYSQL_PASSWORD`
- **Solution**: Verify user has proper permissions

### Error: "401 Unauthorized" on login
- **Solution**: Database connection is failing
- **Solution**: Check Vercel logs for database errors
- **Solution**: Verify admin user exists (check database)

### Error: "Missing required env var"
- **Solution**: Add all required environment variables in Vercel
- **Solution**: Redeploy after adding variables

## 🔒 Security Best Practices

1. **Use SSL**: Always set `MYSQL_SSL=true` for cloud databases
2. **Strong Passwords**: Use strong, unique passwords
3. **Environment Variables**: Never commit credentials to Git
4. **Connection Pooling**: Use managed databases with built-in pooling
5. **IP Restrictions**: If possible, use database-specific IP allowlists (though Vercel makes this difficult)

## 📞 Need More Help?

1. Check Vercel function logs for specific error messages
2. Test database connection from your local machine
3. Verify database credentials are correct
4. Check database provider's documentation for Vercel setup

