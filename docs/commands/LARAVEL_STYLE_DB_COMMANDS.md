# Laravel-Style Database Commands for JuanRide

## Overview
This guide provides Laravel-inspired database commands for managing your Supabase database. Perfect for developers coming from Laravel/PHP background who want familiar command patterns.

---

## 🚀 Quick Reference

| Laravel Command | JuanRide Equivalent | Description |
|----------------|---------------------|-------------|
| `php artisan migrate` | `npm run migrate` | Run all pending migrations |
| `php artisan migrate:status` | `npm run migrate:status` | Show migration status |
| `php artisan migrate:fresh` | `npm run migrate:fresh` | Drop all tables and re-migrate |
| `php artisan migrate:rollback` | `npm run migrate:rollback` | Rollback last migration |
| `php artisan db:seed` | `npm run db:seed` | Seed the database |
| `php artisan migrate:fresh --seed` | `npm run db:reset` | Fresh migrate + seed |
| - | `npm run db:types` | Generate TypeScript types |

---

## 📋 Detailed Commands

### 1. Run Migrations
```bash
npm run migrate
```

**What it does:**
- Reads all `.sql` files from `supabase/database/migrations/`
- Applies them in sequential order (00001, 00002, etc.)
- Shows progress for each migration

**When to use:**
- After creating new migration files
- Setting up database on new environment
- Applying schema changes

**Output:**
```
🚀 Starting migrations...

📁 Found 5 migration file(s):

⏳ Running: 00001_initial_schema.sql
✅ Migrated: 00001_initial_schema.sql
⏳ Running: 00002_rls_policies.sql
✅ Migrated: 00002_rls_policies.sql
...
✨ Migration process completed!
```

**Note:** Due to Supabase limitations, some migrations may need manual execution in Dashboard SQL Editor.

---

### 2. Check Migration Status
```bash
npm run migrate:status
```

**What it does:**
- Lists all migration files
- Shows creation dates
- Displays total count

**When to use:**
- Before running migrations
- Checking which migrations exist
- Verifying migration order

**Output:**
```
📊 Migration Status
════════════════════════════════════════════════════════════════════════════════

📁 Total migrations: 5

01. 00001_initial_schema.sql
    Created: Nov 10, 2025, 10:30 AM

02. 00002_rls_policies.sql
    Created: Nov 10, 2025, 10:35 AM

...
```

---

### 3. Fresh Migration (Reset Database)
```bash
npm run migrate:fresh
```

**⚠️ WARNING: DESTRUCTIVE OPERATION**

**What it does:**
- Drops ALL tables
- Deletes ALL data
- Provides SQL script to copy to Dashboard
- Requires manual confirmation

**When to use:**
- Development environment only
- Need clean slate
- Testing migration sequence
- **NEVER on production**

**Interactive prompt:**
```
⚠️  WARNING: DESTRUCTIVE OPERATION
════════════════════════════════════════════════════════════════════════════════

This will:
  1. Drop all tables in your database
  2. Re-run all migrations from scratch
  3. DELETE ALL DATA (cannot be undone)

💡 For production databases, use Supabase Dashboard backups first!

Are you absolutely sure? Type "YES" to continue:
```

**After typing "YES":**
1. Copy the provided DROP TABLE SQL
2. Run in Supabase Dashboard → SQL Editor
3. Run `npm run migrate`
4. Run `npm run db:types`
5. Optionally `npm run db:seed`

---

### 4. Rollback Migration
```bash
npm run migrate:rollback
```

**What it does:**
- Shows last migration
- Provides rollback instructions
- Explains manual process

**When to use:**
- Need to undo last migration
- Testing migration changes
- Fixing migration errors

**Output:**
```
🔄 Migration Rollback
════════════════════════════════════════════════════════════════════════════════

⚠️  Supabase does not support automatic rollbacks

📝 To manually rollback the last migration:

Last migration: 00005_add_user_social_and_location.sql

Steps:
1. Review the migration file to understand what was created
2. Create a reverse migration script (rollback SQL)
3. Run the rollback SQL in Supabase Dashboard → SQL Editor

Example rollback SQL:

   BEGIN;
   -- Drop tables/columns created in migration
   ALTER TABLE users DROP COLUMN IF EXISTS social_links;
   ALTER TABLE users DROP COLUMN IF EXISTS location_city;
   COMMIT;

4. After rollback, run: npm run db:types
```

---

### 5. Seed Database
```bash
npm run db:seed
```

**What it does:**
- Lists all seed files in `supabase/database/seeds/`
- Provides instructions for manual seeding
- Can target specific seed file

**When to use:**
- After fresh migrations
- Need test data
- Development/staging setup

**Seed specific file:**
```bash
npm run db:seed seed_vehicles.sql
# or
npm run db:seed seed_all
```

**Available seed files:**
- `seed_all.sql` - Complete dataset (users, vehicles, bookings)
- `seed_vehicles.sql` - Just vehicle listings
- `seed-vehicles-only.sql` - Minimal vehicle data

**Output:**
```
🌱 Starting database seeding...

📁 Found 3 seed file(s):

⏳ Seeding: seed_all.sql
⚠️  Please run this seed manually in Supabase Dashboard → SQL Editor
   File: C:\Users\...\supabase\database\seeds\seed_all.sql

📋 Seeding Instructions:
1. Go to Supabase Dashboard → SQL Editor
2. Copy and paste seed file contents
3. Run the SQL

💡 Seed files location: supabase/database/seeds/
```

---

### 6. Generate TypeScript Types
```bash
npm run db:types
```

**Alias for:** `npm run supabase:gen-types`

**What it does:**
- Connects to Supabase database
- Reads schema (tables, columns, enums)
- Generates `src/types/database.types.ts`

**When to use:**
- After ANY schema change
- After running migrations
- When types are out of sync

**Output:**
```
Generating types...
Types generated successfully at src/types/database.types.ts
```

**Important:** Restart TypeScript server after:
- VS Code: `Ctrl+Shift+P` → "TypeScript: Restart TS Server"

---

### 7. Full Reset (Fresh + Seed)
```bash
npm run db:reset
```

**What it does:**
- Runs `migrate:fresh` (with confirmation)
- Runs `migrate`
- Runs `db:seed`

**Equivalent to Laravel:**
```bash
php artisan migrate:fresh --seed
```

**Perfect for:**
- Setting up new dev environment
- Resetting to known state
- Testing full database setup

---

## 📁 File Structure

```
supabase/
├── database/
│   ├── migrations/          # Sequential SQL migration files
│   │   ├── 00001_initial_schema.sql
│   │   ├── 00002_rls_policies.sql
│   │   ├── 00003_indexes.sql
│   │   ├── 00004_functions.sql
│   │   └── 00005_add_user_social_and_location.sql
│   ├── seeds/              # Test data SQL files
│   │   ├── seed_all.sql
│   │   ├── seed_vehicles.sql
│   │   └── seed-vehicles-only.sql
│   └── scripts/            # Command helper scripts
│       ├── migrate.js
│       ├── migrate-status.js
│       ├── migrate-fresh.js
│       ├── migrate-rollback.js
│       └── seed.js
```

---

## 🎯 Common Workflows

### Setting Up New Environment
```bash
# 1. Clone repo and install dependencies
npm install

# 2. Set up .env.local with Supabase credentials
# (Get from Supabase Dashboard)

# 3. Check existing migrations
npm run migrate:status

# 4. Run migrations
npm run migrate

# 5. Generate types
npm run db:types

# 6. Seed database (optional)
npm run db:seed
```

### Creating New Migration
```bash
# 1. Create file: supabase/database/migrations/00006_your_feature.sql
# Example: 00006_add_vehicle_ratings.sql

# 2. Write SQL
BEGIN;

ALTER TABLE vehicles 
ADD COLUMN IF NOT EXISTS average_rating DECIMAL(2,1) DEFAULT 0;

COMMIT;

# 3. Apply migration
npm run migrate

# 4. Generate types
npm run db:types

# 5. Restart TypeScript server in VS Code
```

### After Schema Changes
```bash
# Always run these two commands:
npm run migrate
npm run db:types
```

### Reset Development Database
```bash
# Complete reset with test data
npm run db:reset

# Or step by step:
npm run migrate:fresh  # (type YES)
# Copy SQL to Dashboard, run it
npm run migrate
npm run db:types
npm run db:seed
```

---

## 🔧 Configuration

### Required Dependencies
```bash
npm install dotenv  # Already included in package.json
```

### Required Environment Variables
Create `.env.local` in project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Get credentials from: Supabase Dashboard → Project Settings → API

---

## 🚨 Important Notes

### Supabase vs Laravel Differences

| Feature | Laravel | Supabase/JuanRide |
|---------|---------|-------------------|
| Migration tracking | `migrations` table | Manual tracking |
| Rollback support | Automatic | Manual SQL needed |
| Seed execution | Direct via Artisan | Manual via Dashboard |
| Type generation | N/A | Required after changes |

### Why Manual Steps?

Supabase doesn't provide programmatic SQL execution via client libraries for security reasons. This means:

1. **Migrations** - Must be applied via Dashboard SQL Editor
2. **Seeds** - Must be copied to Dashboard manually
3. **Rollbacks** - No automatic down migrations

Our scripts help by:
- Organizing files consistently
- Providing clear instructions
- Showing progress and status
- Generating necessary SQL

### Best Practices

✅ **DO:**
- Version control all migrations
- Use sequential numbering (00001, 00002...)
- Write idempotent migrations (`IF NOT EXISTS`)
- Generate types after every schema change
- Test migrations on development first

❌ **DON'T:**
- Modify existing migration files
- Skip migrations in sequence
- Use `migrate:fresh` on production
- Forget to run `db:types` after migrations
- Commit without testing migrations

---

## 🐛 Troubleshooting

### Error: "Missing Supabase credentials"
**Solution:** Check `.env.local` has all required variables

### Error: "Permission denied for table"
**Solution:** Use service role key, not anon key

### Types out of sync
**Solution:**
```bash
npm run db:types
# Restart TS server in VS Code
```

### Migration fails
**Solution:**
1. Copy migration SQL
2. Go to Supabase Dashboard → SQL Editor
3. Run manually
4. Check for errors in Dashboard

### Cannot seed database
**Solution:**
- Seeds must be run manually in Dashboard SQL Editor
- Copy file contents from `supabase/database/seeds/`
- Seeds use `ON CONFLICT` to prevent duplicates

---

## 📚 Additional Resources

- **Full Database Guide:** `docs/commands/database-commands.md`
- **Supabase Setup:** `docs/guides/SETUP_GUIDE.md`
- **Project Structure:** `docs/implementation/project-structure.md`
- **Migration Guide:** `docs/guides/MIGRATION_GUIDE_SUPABASE.md`

---

## 🎉 Quick Test

Verify commands are working:

```bash
# Check status
npm run migrate:status

# Generate types
npm run db:types

# View help for fresh migration
npm run migrate:fresh
# (type NO to cancel)
```

---

**Created:** November 12, 2025  
**Maintained by:** JuanRide Development Team  
**For Laravel developers:** Welcome! Hope these commands feel familiar 🚀
