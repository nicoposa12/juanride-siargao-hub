# 🚀 Laravel-Style Commands - Quick Reference

One-page cheat sheet for Laravel developers working with JuanRide's Supabase database.

---

## Essential Commands

```bash
# Run all pending migrations
npm run migrate

# Check migration status
npm run migrate:status

# Fresh migration (⚠️ DROPS ALL TABLES)
npm run migrate:fresh

# Rollback last migration (manual)
npm run migrate:rollback

# Seed database with test data
npm run db:seed

# Generate TypeScript types from DB schema
npm run db:types

# Complete reset: fresh + migrate + seed
npm run db:reset
```

---

## Common Workflows

### First Time Setup
```bash
npm install
npm run migrate
npm run db:types
npm run db:seed
npm run dev
```

### After Schema Changes
```bash
npm run migrate
npm run db:types
# Restart dev server
```

### Reset Development Database
```bash
npm run migrate:fresh  # (type YES, copy SQL to Dashboard)
npm run migrate
npm run db:types
npm run db:seed
```

### Create New Migration
```bash
# 1. Create: supabase/database/migrations/00006_your_feature.sql
# 2. Write SQL
# 3. Run:
npm run migrate
npm run db:types
```

---

## Laravel vs JuanRide

| Laravel | JuanRide | Notes |
|---------|----------|-------|
| `php artisan migrate` | `npm run migrate` | Apply migrations |
| `php artisan migrate:status` | `npm run migrate:status` | Check status |
| `php artisan migrate:fresh` | `npm run migrate:fresh` | Drop & re-migrate |
| `php artisan migrate:rollback` | `npm run migrate:rollback` | Manual rollback |
| `php artisan db:seed` | `npm run db:seed` | Seed database |
| `php artisan migrate:fresh --seed` | `npm run db:reset` | Fresh + seed |
| - | `npm run db:types` | Generate TS types |

---

## Important Differences from Laravel

### 🔴 Migrations
- **Laravel:** Tracked in `migrations` table, automatic rollback
- **JuanRide:** Manual execution via Supabase Dashboard
- **Why:** Supabase security - no programmatic SQL execution

### 🔴 Seeding  
- **Laravel:** Direct execution via Artisan
- **JuanRide:** Copy SQL to Dashboard, run manually
- **Why:** Same security restrictions

### 🔴 Type Generation
- **Laravel:** Not needed (PHP is loosely typed)
- **JuanRide:** Required after every schema change (TypeScript)
- **Why:** TypeScript needs to know your database structure

---

## File Locations

```
supabase/
├── database/
│   ├── migrations/          # Like Laravel's database/migrations/
│   │   ├── 00001_initial_schema.sql
│   │   ├── 00002_rls_policies.sql
│   │   └── ...
│   ├── seeds/              # Like Laravel's database/seeders/
│   │   ├── seed_all.sql
│   │   └── seed_vehicles.sql
│   └── scripts/            # Helper scripts (npm commands)
│       ├── migrate.js
│       ├── seed.js
│       └── ...
```

---

## Environment Variables

Create `.env.local` (like Laravel's `.env`):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Get from: Supabase Dashboard → Settings → API

---

## Migration Example

**Laravel style:**
```php
// database/migrations/2024_01_01_create_vehicles_table.php
public function up() {
    Schema::create('vehicles', function (Blueprint $table) {
        $table->id();
        $table->string('name');
        $table->decimal('daily_rate', 8, 2);
        $table->timestamps();
    });
}
```

**JuanRide style:**
```sql
-- supabase/database/migrations/00006_create_vehicles.sql
BEGIN;

CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  daily_rate DECIMAL(8,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMIT;
```

---

## Seeder Example

**Laravel style:**
```php
// database/seeders/VehicleSeeder.php
public function run() {
    DB::table('vehicles')->insert([
        'name' => 'Honda Click 125',
        'daily_rate' => 500.00,
    ]);
}
```

**JuanRide style:**
```sql
-- supabase/database/seeds/seed_vehicles.sql
INSERT INTO vehicles (name, daily_rate) 
VALUES ('Honda Click 125', 500.00)
ON CONFLICT (id) DO NOTHING;
```

---

## Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Types out of sync | `npm run db:types` |
| Migration failed | Copy SQL to Dashboard, run manually |
| Can't seed | Copy seed file to Dashboard SQL Editor |
| Env vars missing | Check `.env.local` exists and has values |
| Command not found | Run `npm install` first |

---

## Getting Help

📖 **Full Documentation:** [LARAVEL_STYLE_DB_COMMANDS.md](./LARAVEL_STYLE_DB_COMMANDS.md)

📖 **Database Guide:** [database-commands.md](./database-commands.md)

📖 **Setup Guide:** `docs/guides/SETUP_GUIDE.md`

---

**Quick test:** `npm run migrate:status` ✨

---

*Made with ❤️ for Laravel developers transitioning to Next.js + Supabase*
