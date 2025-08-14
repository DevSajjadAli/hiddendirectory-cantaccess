# 🚀 Deploying Docusaurus Admin Panel to Heroku

This guide will help you deploy your Docusaurus documentation site with admin panel to Heroku.

## Prerequisites

1. **Heroku Account**: Sign up at [heroku.com](https://heroku.com)
2. **Heroku CLI**: Install from [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli)
3. **Git**: Ensure your project is in a Git repository

## 🛠️ Pre-Deployment Setup

### 1. Install Heroku CLI
```bash
# Windows (using chocolatey)
choco install heroku-cli

# Or download from: https://devcenter.heroku.com/articles/heroku-cli
```

### 2. Login to Heroku
```bash
heroku login
```

## 🚀 Deployment Methods

### Method 1: Quick Deploy (Recommended)

1. **Create Heroku App**
```bash
# Navigate to your project directory
cd c:\Users\Welcome\Desktop\hopevalley-docs\classic

# Create a new Heroku app
heroku create your-app-name-here

# Or let Heroku generate a name
heroku create
```

2. **Set Environment Variables**
```bash
# Set required environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET="your-super-secure-jwt-secret-$(openssl rand -hex 32)"
heroku config:set ADMIN_USERNAME="admin"
heroku config:set ADMIN_PASSWORD="your-secure-password-here"

# Optional: Set your custom domain
heroku config:set SITE_URL="https://your-app-name.herokuapp.com"
```

3. **Deploy**
```bash
# Initialize git repository (if not already done)
git init
git add .
git commit -m "Initial commit - Deploy to Heroku"

# Add Heroku remote
heroku git:remote -a your-app-name

# Deploy to Heroku
git push heroku main
```

### Method 2: One-Click Deploy

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/your-username/your-repo)

## 🔧 Configuration

### Environment Variables

Set these in Heroku Dashboard → Settings → Config Vars:

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NODE_ENV` | Yes | Environment | `production` |
| `JWT_SECRET` | Yes | JWT secret key | `your-secret-key` |
| `ADMIN_USERNAME` | Yes | Admin username | `admin` |
| `ADMIN_PASSWORD` | Yes | Admin password | `secure-password` |
| `SITE_URL` | No | Your site URL | `https://yourapp.herokuapp.com` |

### Setting Variables via CLI
```bash
# Set all required variables at once
heroku config:set \
  NODE_ENV=production \
  JWT_SECRET="$(openssl rand -hex 32)" \
  ADMIN_USERNAME="admin" \
  ADMIN_PASSWORD="your-secure-password"
```

## 📦 Build Process

Heroku will automatically:
1. Install dependencies (`npm install`)
2. Run build script (`npm run build`)
3. Start the server (`npm start`)

## 🔍 Monitoring & Debugging

### View Logs
```bash
# View recent logs
heroku logs --tail

# View specific number of lines
heroku logs -n 200
```

### Check App Status
```bash
# Check dyno status
heroku ps

# Check app info
heroku info
```

### Access Heroku Dashboard
```bash
# Open app in browser
heroku open

# Open Heroku dashboard
heroku dashboard
```

## 🎯 Post-Deployment

### 1. Verify Deployment
- Visit your app: `https://your-app-name.herokuapp.com`
- Check admin panel: `https://your-app-name.herokuapp.com/admin`
- Test health endpoint: `https://your-app-name.herokuapp.com/health`

### 2. Configure Custom Domain (Optional)
```bash
# Add custom domain
heroku domains:add yourdomain.com

# View DNS configuration
heroku domains
```

### 3. Enable SSL (Automatic on Heroku)
Heroku automatically provides SSL certificates for all apps.

## 🔧 Troubleshooting

### Common Issues

1. **Build Failures**
```bash
# Check build logs
heroku logs --source app --dyno web

# Rebuild app
git commit --allow-empty -m "Rebuild"
git push heroku main
```

2. **App Won't Start**
```bash
# Check if all required env vars are set
heroku config

# Restart app
heroku restart
```

3. **Port Issues**
Heroku automatically assigns the PORT environment variable. Your app should use:
```javascript
const PORT = process.env.PORT || 3000;
```

### Performance Optimization

1. **Enable Compression**
```bash
heroku config:set COMPRESSION_ENABLED=true
```

2. **Configure Node Options**
```bash
heroku config:set NODE_OPTIONS="--max-old-space-size=460"
```

## 📊 Scaling

### Scale Dynos
```bash
# Scale to 1 dyno (free tier)
heroku ps:scale web=1

# Scale to multiple dynos (paid tiers)
heroku ps:scale web=2
```

## 🔒 Security Checklist

- ✅ Set strong `JWT_SECRET`
- ✅ Change default admin credentials
- ✅ Enable HTTPS (automatic on Heroku)
- ✅ Set `NODE_ENV=production`
- ✅ Don't commit `.env` files
- ✅ Regularly update dependencies

## 🌐 Custom Domain Setup

1. **Add Domain**
```bash
heroku domains:add www.yourdomain.com
heroku domains:add yourdomain.com
```

2. **Configure DNS**
- Point your domain to the Heroku DNS target provided
- Usually: `your-app-name.herokuapp.com`

3. **SSL Certificate**
```bash
heroku certs:auto:enable
```

## 📈 Monitoring

### Add-ons (Optional)
```bash
# Logging
heroku addons:create papertrail:choklad

# Monitoring
heroku addons:create newrelic:wayne

# Database (if needed)
heroku addons:create heroku-postgresql:mini
```

## 🤝 Support

- [Heroku Documentation](https://devcenter.heroku.com/)
- [Docusaurus Documentation](https://docusaurus.io/)
- [Node.js on Heroku](https://devcenter.heroku.com/categories/nodejs-support)

---

## 🎉 Success!

Once deployed, your Docusaurus site with admin panel will be available at:
- **Main Site**: `https://your-app-name.herokuapp.com`
- **Admin Panel**: `https://your-app-name.herokuapp.com/admin`
- **API**: `https://your-app-name.herokuapp.com/api/admin`

Remember to change the default admin credentials after first deployment!
