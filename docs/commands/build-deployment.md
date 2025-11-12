# Build and Deployment Commands

## Overview
Commands for building production bundles, deploying to hosting platforms, and managing production environments.

---

## Production Build Process

### Complete Build Workflow
```bash
# 1. Pre-build checks
npm run type-check      # Validate TypeScript
npm run lint           # Check code quality

# 2. Clean previous builds
rm -rf .next

# 3. Build for production
npm run build

# 4. Test production build locally
npm run start
```

**Expected output:**
```
✓ Creating an optimized production build
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages (8/8)
✓ Finalizing page optimization

Route (app)                              Size     First Load JS
┌ ○ /                                    5.2 kB          95 kB
└ ...
```

---

## Deployment Platforms

### Vercel (Recommended for Next.js)

#### Initial Setup
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link project
vercel link
```

#### Deploy to Preview
```bash
# Deploy to preview URL (automatic for branches)
vercel

# Deploy specific branch
vercel --prod=false
```

#### Deploy to Production
```bash
# Deploy to production
vercel --prod

# Or simply push to main branch (auto-deploys)
git push origin main
```

#### Environment Variables
```bash
# Add environment variable
vercel env add NEXT_PUBLIC_SUPABASE_URL production

# Pull environment variables
vercel env pull .env.local

# List environment variables
vercel env ls
```

#### Vercel Configuration
Create `vercel.json`:
```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["sin1"],
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase-url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase-anon-key"
  }
}
```

---

### Netlify

#### Initial Setup
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Login
netlify login

# Initialize
netlify init
```

#### Deploy
```bash
# Deploy to preview
netlify deploy

# Deploy to production
netlify deploy --prod

# Build and deploy
netlify deploy --build --prod
```

#### Configuration
Create `netlify.toml`:
```toml
[build]
  command = "npm run build"
  publish = ".next"

[build.environment]
  NODE_VERSION = "20"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

---

### Docker Deployment

#### Dockerfile
Create `Dockerfile`:
```dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package*.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

#### Docker Commands
```bash
# Build image
docker build -t juanride-app .

# Run container
docker run -p 3000:3000 --env-file .env.local juanride-app

# Build and run with docker-compose
docker-compose up --build
```

#### docker-compose.yml
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    env_file:
      - .env.local
    environment:
      - NODE_ENV=production
```

---

### VPS / Self-Hosted Deployment

#### Using PM2 (Process Manager)
```bash
# Install PM2 globally on server
npm install -g pm2

# Build the application
npm run build

# Start with PM2
pm2 start npm --name "juanride" -- start

# Configure auto-restart on server reboot
pm2 startup
pm2 save

# Monitor application
pm2 monit

# View logs
pm2 logs juanride

# Restart application
pm2 restart juanride

# Stop application
pm2 stop juanride
```

#### PM2 Ecosystem File
Create `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'juanride',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/juanride',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm Z',
  }],
}
```

```bash
# Start with ecosystem file
pm2 start ecosystem.config.js
```

#### Nginx Reverse Proxy
```nginx
# /etc/nginx/sites-available/juanride
server {
    listen 80;
    server_name yourdomain.com;

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

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/juanride /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## Environment Configuration

### Production Environment Variables

Create `.env.production`:
```bash
NODE_ENV=production

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-production-service-role-key

# App URLs
NEXT_PUBLIC_APP_URL=https://juanride.com
NEXT_PUBLIC_API_URL=https://api.juanride.com

# Analytics (optional)
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# Feature Flags
NEXT_PUBLIC_ENABLE_PAYMENTS=true
NEXT_PUBLIC_ENABLE_CHAT=true
```

### Environment Variable Priority
```
.env.production.local   (highest priority, git-ignored)
.env.local              (git-ignored)
.env.production         (committed)
.env                    (lowest priority, committed)
```

---

## Pre-Deployment Checklist

### Code Quality
```bash
✓ npm run type-check    # No TypeScript errors
✓ npm run lint          # No linting errors
✓ npm run build         # Build succeeds
✓ npm run start         # Production works locally
```

### Environment Variables
```bash
✓ All required variables set in platform
✓ Database URLs point to production
✓ API keys are production keys
✓ No development/test keys in production
```

### Database
```bash
✓ Migrations applied to production database
✓ RLS policies enabled
✓ Production seeds applied (if needed)
✓ Backups configured
```

### Security
```bash
✓ CORS configured correctly
✓ Rate limiting enabled
✓ Sensitive keys in environment variables (not code)
✓ HTTPS enabled
✓ Security headers configured
```

### Performance
```bash
✓ Images optimized
✓ Bundle size checked (< 200 KB first load)
✓ No console.logs in production code
✓ Caching strategies configured
```

---

## Deployment Scripts

### Automated Deployment Script

Create `scripts/deploy.sh`:
```bash
#!/bin/bash

echo "🚀 Starting deployment..."

# 1. Run checks
echo "📋 Running pre-deployment checks..."
npm run type-check || exit 1
npm run lint || exit 1

# 2. Build
echo "🏗️  Building production bundle..."
npm run build || exit 1

# 3. Test production build
echo "🧪 Testing production build..."
timeout 10 npm run start &
PID=$!
sleep 5
curl -f http://localhost:3000 || exit 1
kill $PID

# 4. Deploy to platform
echo "📦 Deploying to production..."
vercel --prod

echo "✅ Deployment complete!"
```

```bash
# Make executable
chmod +x scripts/deploy.sh

# Run deployment
./scripts/deploy.sh
```

---

## Post-Deployment Verification

### Health Checks
```bash
# Check if site is up
curl -I https://juanride.com

# Check API endpoint
curl https://juanride.com/api/health

# Check specific page
curl -f https://juanride.com/vehicles || echo "Failed"
```

### Monitoring Commands
```bash
# Vercel logs
vercel logs [deployment-url]

# PM2 monitoring
pm2 monit

# Check error logs
pm2 logs juanride --err

# Nginx access logs
sudo tail -f /var/log/nginx/access.log
```

---

## Rollback Procedures

### Vercel Rollback
```bash
# List deployments
vercel ls

# Rollback to previous deployment
vercel rollback [deployment-url]
```

### PM2 Rollback
```bash
# Stop current version
pm2 stop juanride

# Pull previous version
git checkout [previous-commit]

# Rebuild
npm run build

# Restart
pm2 restart juanride
```

### Database Rollback
```bash
# Restore from backup (via Supabase Dashboard)
# Or run rollback migration
psql -h db.xxx.supabase.co < rollback.sql
```

---

## CI/CD Pipeline Examples

### GitHub Actions

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Type check
        run: npm run type-check
      
      - name: Lint
        run: npm run lint
      
      - name: Build
        run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

---

## Performance Optimization

### Build Optimization
```bash
# Analyze bundle size
ANALYZE=true npm run build

# Check for duplicate dependencies
npx depcheck

# Remove unused dependencies
npm prune
```

### Image Optimization
```bash
# Optimize images before committing
npx next-image-export-optimizer
```

---

## Common Deployment Issues

### Issue: Build fails with memory error
```bash
# Increase Node memory
NODE_OPTIONS=--max-old-space-size=4096 npm run build
```

### Issue: Environment variables not loading
```bash
# Verify in platform settings
vercel env ls

# Pull to verify locally
vercel env pull

# Redeploy to pick up changes
vercel --prod --force
```

### Issue: Database connection fails
```bash
# Check connection string format
# Verify RLS policies
# Check service role key is correct
# Test connection with psql
```

---

## Quick Reference

| Task | Command |
|------|---------|
| Production build | `npm run build` |
| Test production | `npm run start` |
| Deploy to Vercel | `vercel --prod` |
| View Vercel logs | `vercel logs` |
| Deploy with Docker | `docker build -t app . && docker run -p 3000:3000 app` |
| PM2 start | `pm2 start npm --name juanride -- start` |
| PM2 logs | `pm2 logs juanride` |
| Rollback Vercel | `vercel rollback [url]` |

---

**Last Updated:** November 2025  
**Recommended Platform:** Vercel (optimal Next.js support)  
**Related Docs:**
- `/docs/guides/SETUP_GUIDE.md`
- `/docs/commands/nextjs-commands.md`
