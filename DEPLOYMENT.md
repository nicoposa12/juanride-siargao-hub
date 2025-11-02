# JuanRide Deployment Guide

Complete guide for deploying JuanRide to production on Vercel with Supabase.

## Prerequisites

- Vercel account (https://vercel.com)
- Supabase account (https://supabase.com)  
- GitHub repository with your code
- Custom domain (optional)

## Phase 1: Supabase Production Setup

### 1.1 Create Production Supabase Project

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Enter project details:
   - **Name**: juanride-production
   - **Database Password**: (Use a strong password)
   - **Region**: Choose closest to Philippines (Singapore recommended)
4. Wait for project to be created (~2 minutes)

### 1.2 Run Database Migrations

1. Go to SQL Editor in Supabase Dashboard
2. Run `supabase/migrations/00001_initial_schema.sql`
   - Copy entire file content
   - Paste and run in SQL Editor
3. Run `supabase/migrations/00002_rls_policies.sql`
   - Copy entire file content
   - Paste and run in SQL Editor
4. Verify all tables created under Database > Tables

### 1.3 Create Storage Buckets

1. Go to Storage in Supabase Dashboard
2. Create these public buckets:
   - `vehicle-images`
   - `profile-images`
   - `review-images`
3. For each bucket:
   - Click bucket name
   - Go to Policies
   - Add policy: "Enable read access for all users"
   ```sql
   (bucket_id = 'vehicle-images'::text)
   ```
   - Add policy: "Enable insert for authenticated users only"
   ```sql
   (bucket_id = 'vehicle-images'::text AND auth.role() = 'authenticated'::text)
   ```

### 1.4 Configure Authentication

1. Go to Authentication > Providers
2. Enable Email provider:
   - Turn on "Enable Email provider"
   - Turn on "Confirm email" (recommended)
   - Configure email templates (optional)
3. Enable Google OAuth (optional):
   - Get credentials from Google Cloud Console
   - Add authorized redirect URI: `https://<your-project-ref>.supabase.co/auth/v1/callback`
4. Go to Authentication > URL Configuration
   - Set Site URL to your production domain
   - Add redirect URLs for your domain

### 1.5 Get API Credentials

1. Go to Project Settings > API
2. Copy these values (you'll need them for Vercel):
   - Project URL (`NEXT_PUBLIC_SUPABASE_URL`)
   - `anon` public key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - `service_role` key (`SUPABASE_SERVICE_ROLE_KEY`) - Keep this secret!

## Phase 2: Vercel Deployment

### 2.1 Import Project to Vercel

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Configure project:
   - **Framework Preset**: Next.js
   - **Root Directory**: ./
   - **Build Command**: `npm run build`
   - **Output Directory**: .next

### 2.2 Configure Environment Variables

In Vercel Project Settings > Environment Variables, add:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Payment Gateway (Test Mode)
NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY=pk_test_...
PAYMONGO_SECRET_KEY=sk_test_...

# Optional: Error Tracking
NEXT_PUBLIC_SENTRY_DSN=https://...
```

**Important**: 
- Use production Supabase credentials
- Keep `service_role` key secure (not prefixed with NEXT_PUBLIC)
- Payment keys should be test mode initially

### 2.3 Deploy

1. Click "Deploy"
2. Wait for build to complete (~3-5 minutes)
3. Visit deployment URL to verify
4. Check for any build errors in logs

## Phase 3: Post-Deployment Configuration

### 3.1 Configure Custom Domain (Optional)

1. In Vercel Project Settings > Domains
2. Add your custom domain
3. Configure DNS records as instructed by Vercel
4. Wait for DNS propagation (~1-48 hours)
5. Update Supabase redirect URLs with new domain

### 3.2 Update Supabase Redirect URLs

1. Go to Supabase Authentication > URL Configuration
2. Update Site URL to your production domain
3. Add redirect URLs:
   - `https://yourdomain.com/auth/callback`
   - `https://yourdomain.com/**`

### 3.3 Test Critical Flows

Test these workflows in production:

1. **Authentication**
   - Sign up as renter
   - Sign up as owner
   - Login/logout
   - Password reset

2. **Renter Flow**
   - Search vehicles
   - View vehicle details
   - Create booking
   - Complete payment (test mode)
   - View booking confirmation
   - Submit review

3. **Owner Flow**
   - Create vehicle listing
   - View dashboard
   - Manage bookings
   - Check earnings

4. **Admin Flow**
   - Approve vehicle listing
   - View analytics
   - Manage users

### 3.4 Create Admin User

Run this SQL in Supabase SQL Editor to make a user admin:

```sql
UPDATE users 
SET role = 'admin' 
WHERE email = 'your-admin-email@example.com';
```

### 3.5 Seed Initial Data (Optional)

Add test vehicles for demonstration:

```sql
INSERT INTO vehicles (
  owner_id, 
  name, 
  type, 
  brand, 
  model, 
  year, 
  license_plate,
  description, 
  daily_rate, 
  location, 
  status, 
  is_available
) VALUES (
  'owner-user-id',
  'Honda Click 150i',
  'Scooter',
  'Honda',
  'Click 150i',
  2023,
  'ABC-1234',
  'Well-maintained scooter perfect for island cruising',
  500.00,
  'General Luna, Siargao',
  'approved',
  true
);
```

## Phase 4: Monitoring & Maintenance

### 4.1 Set Up Error Tracking (Recommended)

1. Create Sentry account (https://sentry.io)
2. Create new Next.js project
3. Add Sentry DSN to Vercel environment variables
4. Install Sentry SDK:
   ```bash
   npm install @sentry/nextjs
   npx @sentry/wizard@latest -i nextjs
   ```

### 4.2 Monitor Database

1. Supabase Dashboard > Database > Logs
2. Check for slow queries
3. Monitor database size
4. Set up database backups (automatic in Supabase)

### 4.3 Monitor Application

1. Vercel Analytics (automatic)
2. Check error logs in Vercel dashboard
3. Monitor build times
4. Check function logs for API routes

### 4.4 Regular Maintenance

- **Weekly**: Check error logs
- **Monthly**: Review database performance
- **Monthly**: Update dependencies
- **Quarterly**: Review and update RLS policies

## Phase 5: Going Live

### 5.1 Pre-Launch Checklist

- [ ] All critical flows tested in production
- [ ] Admin user created
- [ ] Custom domain configured (if using)
- [ ] SSL certificate active (automatic with Vercel)
- [ ] Email notifications working
- [ ] Payment gateway in test mode verified
- [ ] Supabase RLS policies reviewed
- [ ] Error tracking configured
- [ ] Database backups enabled
- [ ] Terms of Service and Privacy Policy added
- [ ] Contact information updated

### 5.2 Switch Payment Gateway to Live Mode

**ONLY when ready for real transactions:**

1. Get production credentials from PayMongo
2. Update environment variables in Vercel:
   ```bash
   NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY=pk_live_...
   PAYMONGO_SECRET_KEY=sk_live_...
   ```
3. Redeploy
4. Test with small real transaction

### 5.3 Announce Launch

1. Share with initial users
2. Monitor for issues closely in first 24 hours
3. Be ready to rollback if critical issues arise

## Troubleshooting

### Build Failures

**Issue**: Build fails on Vercel

**Solutions**:
- Check build logs for specific errors
- Verify all dependencies in package.json
- Ensure TypeScript types are correct
- Check Next.js version compatibility

### Authentication Issues

**Issue**: Users can't log in

**Solutions**:
- Verify Supabase URL in environment variables
- Check redirect URLs in Supabase settings
- Verify Site URL matches production domain
- Check browser console for specific errors

### Database Connection Issues

**Issue**: Can't connect to Supabase

**Solutions**:
- Verify API keys are correct
- Check RLS policies allow access
- Ensure tables exist in database
- Check Supabase project is active (not paused)

### Image Upload Failures

**Issue**: Images won't upload

**Solutions**:
- Verify storage buckets exist
- Check bucket policies allow uploads
- Verify file size limits
- Check file type restrictions

## Rollback Procedure

If critical issues occur:

1. In Vercel dashboard, go to Deployments
2. Find last working deployment
3. Click "..." menu > "Promote to Production"
4. Fix issues locally
5. Redeploy when ready

## Environment Variables Reference

### Required Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=           # Your Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=      # Supabase anonymous key
SUPABASE_SERVICE_ROLE_KEY=          # Supabase service role key (secret!)
NEXT_PUBLIC_APP_URL=                # Your production URL
```

### Optional Variables

```bash
# Payment (Test Mode)
NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY=    # PayMongo public key
PAYMONGO_SECRET_KEY=                # PayMongo secret key

# Error Tracking
NEXT_PUBLIC_SENTRY_DSN=             # Sentry DSN

# Feature Flags
NEXT_PUBLIC_ENABLE_GOOGLE_AUTH=     # Enable Google OAuth
NEXT_PUBLIC_ENABLE_ANALYTICS=       # Enable analytics
```

## Support

For deployment issues:
- Email: dev@juanride.ph
- Check Vercel documentation: https://vercel.com/docs
- Check Supabase documentation: https://supabase.com/docs

## Security Notes

- Never commit `.env.local` to git
- Keep `service_role` key secret
- Use test payment credentials initially
- Enable email verification in production
- Regularly review RLS policies
- Monitor authentication logs
- Keep dependencies updated

---

**Congratulations!** 🎉 Your JuanRide platform is now live!

