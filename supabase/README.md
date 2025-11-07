# JuanRide Supabase Setup

This directory contains all database migrations, functions, and configuration for the JuanRide platform.

## Directory Structure

```
supabase/
├── migrations/           # Database schema migrations
│   ├── 00001_initial_schema.sql    # Core tables and relationships
│   ├── 00002_rls_policies.sql      # Row Level Security policies
│   ├── 00003_indexes.sql           # Performance indexes
│   └── 00004_functions.sql         # Database functions and triggers
├── functions/           # Supabase Edge Functions (serverless)
│   └── (to be added)
├── seed.sql            # Sample data for development
├── config.toml         # Supabase configuration
└── README.md          # This file
```

## Setup Instructions

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in project details:
   - Name: "juanride-siargao"
   - Database Password: (generate a strong password)
   - Region: Southeast Asia (Singapore) - closest to Philippines

### 2. Get Your API Keys

After project creation, go to Project Settings > API:
- Copy the `Project URL` (NEXT_PUBLIC_SUPABASE_URL)
- Copy the `anon/public` key (NEXT_PUBLIC_SUPABASE_ANON_KEY)
- Copy the `service_role` key (SUPABASE_SERVICE_ROLE_KEY) - Keep this secret!

### 3. Configure Environment Variables

Create a `.env.local` file in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. Run Migrations

You can run migrations in two ways:

#### Option A: Using Supabase SQL Editor (Recommended for first-time setup)

1. Go to your Supabase project dashboard
2. Click on "SQL Editor" in the left sidebar
3. Run each migration file in order:
   - Copy the contents of `00001_initial_schema.sql` and run it
   - Copy the contents of `00002_rls_policies.sql` and run it
   - Copy the contents of `00003_indexes.sql` and run it
   - Copy the contents of `00004_functions.sql` and run it

#### Option B: Using Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

### 5. Configure Storage Buckets

Go to Storage in Supabase Dashboard and create these buckets:

1. **vehicle-images**
   - Public bucket
   - File size limit: 5MB
   - Allowed MIME types: image/jpeg, image/png, image/webp

2. **user-documents**
   - Private bucket
   - File size limit: 10MB
   - Allowed MIME types: image/jpeg, image/png, application/pdf

3. **profile-images**
   - Public bucket
   - File size limit: 2MB
   - Allowed MIME types: image/jpeg, image/png, image/webp

### 6. Configure Authentication

Go to Authentication > Providers in Supabase Dashboard:

1. **Email**
   - Enable Email provider
   - Enable "Confirm email" (recommended for production)
   
2. **Google OAuth** (Optional)
   - Enable Google provider
   - Add OAuth credentials from Google Cloud Console

3. **Facebook OAuth** (Optional)
   - Enable Facebook provider
   - Add OAuth credentials from Facebook Developers

### 7. Seed Development Data (Optional)

For development/testing, run the seed file:

```sql
-- In Supabase SQL Editor, run:
-- Copy and paste contents of seed.sql
```

## Database Schema Overview

### Core Tables

- **users** - Extended user profiles (linked to auth.users)
- **vehicles** - Vehicle listings with specs and pricing
- **bookings** - Rental bookings connecting renters and vehicles
- **payments** - Payment transactions and history
- **reviews** - Reviews and ratings for vehicles and owners
- **messages** - Real-time chat messages between users
- **maintenance_logs** - Vehicle maintenance tracking
- **notifications** - In-app notifications for users
- **blocked_dates** - Owner-defined unavailable dates
- **favorites** - User-saved favorite vehicles
- **disputes** - Dispute management system

### Key Features

- ✅ Row Level Security (RLS) on all tables
- ✅ Automatic timestamps with triggers
- ✅ Foreign key constraints for data integrity
- ✅ Performance indexes for common queries
- ✅ Full-text search capability
- ✅ Real-time subscriptions for chat and notifications
- ✅ Automated notifications via triggers
- ✅ Booking conflict prevention
- ✅ Automatic vehicle status updates

## Useful Database Functions

### Check Vehicle Availability

```sql
SELECT public.get_vehicle_availability(
    'vehicle-uuid',
    '2025-01-01'::DATE,
    '2025-01-05'::DATE
);
```

### Get Vehicle Average Rating

```sql
SELECT public.get_vehicle_avg_rating('vehicle-uuid');
```

### Get Owner Earnings

```sql
SELECT * FROM public.get_owner_earnings(
    'owner-uuid',
    '2025-01-01'::DATE,
    '2025-12-31'::DATE
);
```

## Type Generation

Generate TypeScript types from your database schema:

```bash
npm run supabase:gen-types
```

This creates/updates `src/types/database.types.ts` with all your table definitions.

## Backup and Recovery

### Manual Backup

1. Go to Database > Backups in Supabase Dashboard
2. Click "Create Backup"
3. Download the backup file

### Automated Backups

Supabase Pro plan includes:
- Daily automated backups
- 7-day retention
- Point-in-time recovery

## Monitoring

Check these regularly:

1. **Database Health** - Database > Logs
2. **API Usage** - Project Settings > Usage
3. **Real-time Connections** - Database > Realtime Inspector
4. **Error Logs** - SQL Editor > Query History

## Security Best Practices

✅ **Never commit `.env.local` to git**
✅ **Keep service_role key secret** - Never expose in client code
✅ **Use RLS policies** - Already configured, don't disable
✅ **Validate inputs** - Both client and server side
✅ **Use prepared statements** - Supabase client does this automatically
✅ **Regular backups** - Enable automated backups in production
✅ **Monitor auth attempts** - Check for suspicious activity

## Troubleshooting

### RLS Errors

If you get "permission denied" errors:
- Check that RLS policies match your use case
- Verify you're using the correct auth context
- Check if the user has the right role

### Migration Errors

If migrations fail:
- Run migrations in order (00001, 00002, etc.)
- Check for syntax errors in SQL
- Ensure dependencies exist (e.g., auth.users before public.users)

### Performance Issues

- Check Database > Logs for slow queries
- Verify indexes are created (run 00003_indexes.sql)
- Consider adding more specific indexes for your queries

## Support

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)
- [GitHub Issues](https://github.com/supabase/supabase/issues)

