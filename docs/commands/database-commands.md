# Database Commands (Supabase)

## Overview
This guide covers all database-related commands for managing your Supabase PostgreSQL database, including migrations, seeding, type generation, and direct SQL execution.

---

## Type Generation

### Generate TypeScript Types from Database Schema
```bash
npm run supabase:gen-types
```

**When to use:**
- After applying any migration
- After schema changes in Supabase Dashboard
- When database types are out of sync with code

**What it does:**
- Fetches current schema from your Supabase project
- Generates TypeScript types in `supabase/types/database.types.ts`
- Updates all table, view, function, and enum types

**Requires:** `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`

---

## Migrations

### Viewing Migration Status
```bash
# If using Supabase CLI (optional - not currently set up)
npx supabase migration list
```

**Current workflow:** Migrations are manual SQL files in `/supabase/database/migrations/`

### Applying Migrations

**Via Supabase Dashboard (Primary Method):**
1. Navigate to Supabase Dashboard → SQL Editor
2. Open migration file from `/supabase/database/migrations/`
3. Copy SQL content
4. Paste and run in SQL Editor
5. Run `npm run supabase:gen-types` to update types

**Via Supabase CLI (if configured):**
```bash
npx supabase migration up
```

### Creating New Migrations

**Manual process (current setup):**
1. Create new file: `/supabase/database/migrations/00XXX_description.sql`
2. Use sequential numbering (e.g., `00006_add_vehicle_ratings.sql`)
3. Write idempotent SQL (use `IF NOT EXISTS`, etc.)
4. Apply via Dashboard SQL Editor
5. Generate types: `npm run supabase:gen-types`

**Example migration file:**
```sql
-- Migration: 00006_add_vehicle_ratings.sql
-- Description: Add average_rating column to vehicles table

BEGIN;

-- Add column if not exists
ALTER TABLE vehicles 
ADD COLUMN IF NOT EXISTS average_rating DECIMAL(2,1) DEFAULT 0;

-- Add check constraint
ALTER TABLE vehicles 
ADD CONSTRAINT vehicles_rating_range 
CHECK (average_rating >= 0 AND average_rating <= 5);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_vehicles_rating 
ON vehicles(average_rating DESC);

COMMIT;
```

### Migration Best Practices
- **Always use transactions** (`BEGIN;` ... `COMMIT;`)
- **Make idempotent** (use `IF NOT EXISTS`, `IF EXISTS`)
- **Never modify existing migrations** (create new ones instead)
- **Test on development first** before production
- **Include rollback strategy** in comments

---

## Seeding Data

### Development Seeds
```bash
# Run seed files manually via Supabase Dashboard
```

**Seed files location:** `/supabase/database/seeds/`

**Available seeds:**
- `00001_seed_users.sql` - Sample users (renter, owner, admin)
- `00002_seed_vehicles.sql` - Sample vehicles with various types
- `00003_seed_bookings.sql` - Sample bookings in different statuses
- `00004_seed_reviews.sql` - Sample reviews and ratings

**How to apply seeds:**
1. Open Supabase Dashboard → SQL Editor
2. Copy seed file content from `/supabase/database/seeds/`
3. Run in SQL Editor
4. Seeds handle duplicates (use `ON CONFLICT` clauses)

**Creating custom seeds:**
```sql
-- Example: Seed vehicles
INSERT INTO vehicles (
  id,
  owner_id,
  name,
  vehicle_type,
  daily_rate,
  status
) VALUES (
  gen_random_uuid(),
  'owner-user-id',
  'Honda Click 125',
  'scooter',
  500,
  'available'
) ON CONFLICT (id) DO NOTHING;
```

### Production Data Migration
```bash
# Export from old database
pg_dump -h old-host -U user -d database -t table_name > export.sql

# Import via Supabase Dashboard SQL Editor
# Or use psql:
psql -h db.xxx.supabase.co -U postgres -d postgres < export.sql
```

---

## Resetting Database

### ⚠️ Full Database Reset (DESTRUCTIVE)

**Option 1: Via Supabase Dashboard**
1. Go to Supabase Dashboard → Database → Tables
2. Drop tables manually (use correct order to avoid FK constraints)
3. Re-run all migrations in sequence
4. Re-run seed files

**Option 2: SQL Script**
```sql
-- Create reset script: /supabase/database/scripts/reset.sql

BEGIN;

-- Disable triggers
SET session_replication_role = replica;

-- Drop tables in reverse FK dependency order
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS favorites CASCADE;
DROP TABLE IF EXISTS blocked_dates CASCADE;
DROP TABLE IF EXISTS maintenance_logs CASCADE;
DROP TABLE IF EXISTS vehicles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Re-enable triggers
SET session_replication_role = DEFAULT;

COMMIT;
```

**After reset:**
```bash
# 1. Apply migrations 00001 through 00004
# 2. Generate types
npm run supabase:gen-types

# 3. Apply seeds
# Run seed files via Dashboard
```

### Selective Table Reset
```sql
-- Reset single table (preserves schema)
TRUNCATE TABLE bookings CASCADE;

-- Reset multiple related tables
TRUNCATE TABLE bookings, payments, reviews CASCADE;
```

---

## Direct SQL Queries

### Via Supabase Dashboard
1. Supabase Dashboard → SQL Editor
2. Write query
3. Run and view results

### Via psql (PostgreSQL CLI)
```bash
# Get connection string from Supabase Dashboard → Project Settings → Database

# Connect
psql "postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres"

# Common queries
\dt              # List tables
\d+ table_name   # Describe table
SELECT * FROM users LIMIT 10;
```

### Via Node.js Script
```typescript
// scripts/query-database.ts
import { supabase } from '@/supabase/config/supabaseClient'

async function queryDatabase() {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .limit(10)
  
  console.log(data)
}

queryDatabase()
```

```bash
# Run script
npx tsx scripts/query-database.ts
```

---

## Backup and Restore

### Manual Backup
```bash
# Full database backup
pg_dump -h db.xxx.supabase.co -U postgres -d postgres > backup_$(date +%Y%m%d).sql

# Specific tables
pg_dump -h db.xxx.supabase.co -U postgres -d postgres -t vehicles -t bookings > partial_backup.sql
```

### Restore from Backup
```bash
# Via psql
psql -h db.xxx.supabase.co -U postgres -d postgres < backup_20251112.sql

# Or via Supabase Dashboard SQL Editor
```

### Automated Backups
Supabase Pro plan includes daily automated backups (check Dashboard → Database → Backups)

---

## Monitoring and Debugging

### Check Database Connection
```bash
# Test connection
psql "postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:5432/postgres" -c "SELECT version();"
```

### View Active Connections
```sql
SELECT * FROM pg_stat_activity 
WHERE datname = 'postgres';
```

### Check Table Sizes
```sql
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Analyze Query Performance
```sql
EXPLAIN ANALYZE
SELECT * FROM vehicles 
WHERE status = 'available' 
AND vehicle_type = 'motorcycle';
```

---

## Row Level Security (RLS)

### Check RLS Status
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

### Enable/Disable RLS
```sql
-- Enable
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- Disable (not recommended for production)
ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;
```

### View RLS Policies
```sql
SELECT * FROM pg_policies WHERE tablename = 'vehicles';
```

---

## Useful Database Scripts

### Count All Records
```sql
-- Count all tables
SELECT 
  schemaname,
  tablename,
  (xpath('/row/cnt/text()', 
    query_to_xml(format('select count(*) as cnt from %I.%I', schemaname, tablename), 
    false, true, '')))[1]::text::int AS row_count
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY row_count DESC;
```

### Find Unused Indexes
```sql
SELECT 
  schemaname || '.' || tablename AS table,
  indexname AS index,
  pg_size_pretty(pg_relation_size(indexrelid)) AS size,
  idx_scan AS scans
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;
```

---

## Common Issues

### Issue: "permission denied for table"
**Solution:** Check RLS policies or use `supabaseAdmin` client for admin operations

### Issue: "duplicate key value violates unique constraint"
**Solution:** Check for existing records or use `ON CONFLICT` in seeds

### Issue: "column does not exist"
**Solution:** Run `npm run supabase:gen-types` and restart dev server

### Issue: Types out of sync
**Solution:** 
```bash
npm run supabase:gen-types
# Restart TypeScript server in VS Code: Cmd/Ctrl + Shift + P → "Restart TS Server"
```

---

## Environment Variables Required

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # For admin operations
```

---

## Quick Reference

| Task | Command/Method |
|------|----------------|
| Generate types | `npm run supabase:gen-types` |
| Apply migration | Copy to Dashboard SQL Editor |
| Seed database | Copy seed file to SQL Editor |
| Reset table | `TRUNCATE table_name CASCADE;` |
| Backup database | `pg_dump` command |
| Check connection | Test query in Dashboard |
| View tables | `\dt` in psql or Dashboard |

---

**Last Updated:** November 2025  
**Related Docs:** 
- `/docs/guides/MIGRATION_GUIDE_SUPABASE.md`
- `/supabase/README.md`
