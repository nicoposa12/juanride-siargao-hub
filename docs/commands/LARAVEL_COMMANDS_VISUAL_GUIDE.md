# 🎨 Laravel Commands - Visual Guide

Quick visual reference for Laravel developers working with JuanRide.

---

## 📊 Command Overview

```
┌─────────────────────────────────────────────────────────────┐
│                   LARAVEL-STYLE COMMANDS                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  📦 MIGRATIONS                                               │
│  ├─ npm run migrate          → Run all migrations           │
│  ├─ npm run migrate:status   → Check migration status       │
│  ├─ npm run migrate:fresh    → Drop tables & re-migrate    │
│  └─ npm run migrate:rollback → Rollback last migration     │
│                                                              │
│  🌱 SEEDING                                                  │
│  └─ npm run db:seed          → Seed database with data     │
│                                                              │
│  🔧 UTILITIES                                                │
│  ├─ npm run db:types         → Generate TypeScript types   │
│  └─ npm run db:reset         → Fresh + Migrate + Seed      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Common Workflows

### 🆕 First Time Setup

```
┌──────────────┐
│ git clone    │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ npm install  │
└──────┬───────┘
       │
       ▼
┌─────────────────────┐
│ npm run migrate     │ ← Applies all migrations
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ npm run db:types    │ ← Generates TypeScript types
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ npm run db:seed     │ ← Adds test data
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ npm run dev         │ ← Start development
└─────────────────────┘
```

### 🔄 After Schema Changes

```
┌────────────────────────────┐
│ Edit migration file        │
│ 00006_add_feature.sql      │
└──────────┬─────────────────┘
           │
           ▼
┌────────────────────────────┐
│ npm run migrate            │ ← Apply migration
└──────────┬─────────────────┘
           │
           ▼
┌────────────────────────────┐
│ npm run db:types           │ ← Update types
└──────────┬─────────────────┘
           │
           ▼
┌────────────────────────────┐
│ Restart dev server         │
└────────────────────────────┘
```

### 🔥 Reset Database

```
┌────────────────────────────┐
│ npm run migrate:fresh      │ ← Type "YES"
└──────────┬─────────────────┘
           │
           ▼
┌────────────────────────────┐
│ Copy SQL to Dashboard      │ ← Drops all tables
└──────────┬─────────────────┘
           │
           ▼
┌────────────────────────────┐
│ npm run migrate            │ ← Re-apply migrations
└──────────┬─────────────────┘
           │
           ▼
┌────────────────────────────┐
│ npm run db:types           │ ← Update types
└──────────┬─────────────────┘
           │
           ▼
┌────────────────────────────┐
│ npm run db:seed            │ ← Add test data
└────────────────────────────┘
```

---

## 📂 File Structure

```
juanride-siargao-hub/
│
├── supabase/
│   └── database/
│       ├── migrations/              ← Your migration files
│       │   ├── 00001_initial_schema.sql
│       │   ├── 00002_rls_policies.sql
│       │   ├── 00003_indexes.sql
│       │   ├── 00004_functions.sql
│       │   └── 00005_add_user_social.sql
│       │
│       ├── seeds/                   ← Your seed files
│       │   ├── seed_all.sql         ← Complete dataset
│       │   ├── seed_vehicles.sql    ← Just vehicles
│       │   └── seed-vehicles-only.sql
│       │
│       └── scripts/                 ← Helper scripts (NEW)
│           ├── migrate.js           ← Runs migrations
│           ├── migrate-status.js    ← Shows status
│           ├── migrate-fresh.js     ← Fresh migration
│           ├── migrate-rollback.js  ← Rollback guide
│           └── seed.js              ← Seeds database
│
├── docs/
│   └── commands/
│       ├── LARAVEL_STYLE_DB_COMMANDS.md       ← Full guide
│       ├── LARAVEL_COMMANDS_CHEATSHEET.md     ← Quick ref
│       └── LARAVEL_COMMANDS_IMPLEMENTATION_SUMMARY.md
│
└── package.json                     ← Commands defined here
```

---

## 🎯 Command Comparison

```
┌─────────────────────────────────────────────────────────────────┐
│                  LARAVEL vs JUANRIDE                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Laravel                    │  JuanRide                          │
│  ──────────────────────────┼──────────────────────────────      │
│                             │                                    │
│  php artisan migrate        │  npm run migrate                   │
│  php artisan migrate:status │  npm run migrate:status            │
│  php artisan migrate:fresh  │  npm run migrate:fresh             │
│  php artisan migrate:rollback │ npm run migrate:rollback         │
│  php artisan db:seed        │  npm run db:seed                   │
│  php artisan migrate:fresh  │  npm run db:reset                  │
│      --seed                 │                                    │
│  N/A                        │  npm run db:types (TypeScript!)    │
│                             │                                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎨 Output Examples

### ✅ npm run migrate:status

```
📊 Migration Status

════════════════════════════════════════════════════════════════════════════════

📁 Total migrations: 5

01. 00001_initial_schema.sql
    Created: Nov 7, 2025, 12:32 PM

02. 00002_rls_policies.sql
    Created: Nov 7, 2025, 12:32 PM

03. 00003_indexes.sql
    Created: Nov 7, 2025, 12:43 PM

04. 00004_functions.sql
    Created: Nov 7, 2025, 12:43 PM

05. 00005_add_user_social_and_location.sql
    Created: Nov 12, 2025, 10:00 AM

════════════════════════════════════════════════════════════════════════════════

💡 Note: To verify which migrations are actually applied in your database,
   check the Supabase Dashboard → Database → Tables

🔄 To apply migrations: npm run migrate
🔄 To reset database:   npm run migrate:fresh
```

### ⚠️ npm run migrate:fresh

```
⚠️  WARNING: DESTRUCTIVE OPERATION
════════════════════════════════════════════════════════════════════════════════

This will:
  1. Drop all tables in your database
  2. Re-run all migrations from scratch
  3. DELETE ALL DATA (cannot be undone)

💡 For production databases, use Supabase Dashboard backups first!

Are you absolutely sure? Type "YES" to continue: _
```

### 🌱 npm run db:seed

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

## 🚀 Quick Start Checklist

```
Setup Checklist:
├─ ☐ Clone repository
├─ ☐ Run `npm install`
├─ ☐ Create `.env.local` with Supabase credentials
├─ ☐ Run `npm run migrate:status` to check migrations
├─ ☐ Run `npm run migrate` to apply migrations
├─ ☐ Run `npm run db:types` to generate types
├─ ☐ Run `npm run db:seed` to add test data
└─ ☐ Run `npm run dev` to start development
```

---

## 💡 Pro Tips

```
┌───────────────────────────────────────────────────────┐
│  💡 TIPS FOR LARAVEL DEVELOPERS                        │
├───────────────────────────────────────────────────────┤
│                                                        │
│  ✅ Always run `npm run db:types` after migrations    │
│     (TypeScript needs to know your schema!)           │
│                                                        │
│  ✅ Use `migrate:status` before migrating             │
│     (Check what you're about to run)                  │
│                                                        │
│  ✅ Never run `migrate:fresh` on production          │
│     (Just like Laravel!)                              │
│                                                        │
│  ✅ Migrations are manual via Dashboard              │
│     (Different from Laravel, for security)            │
│                                                        │
│  ✅ Use `db:reset` for quick local resets           │
│     (Like `migrate:fresh --seed`)                     │
│                                                        │
└───────────────────────────────────────────────────────┘
```

---

## 📚 Documentation Links

```
Quick Reference:
├─ 📄 LARAVEL_COMMANDS_CHEATSHEET.md          ← One-page reference
├─ 📄 LARAVEL_STYLE_DB_COMMANDS.md            ← Complete guide
├─ 📄 LARAVEL_COMMANDS_IMPLEMENTATION_SUMMARY.md ← This file
└─ 📄 database-commands.md                     ← Original docs
```

---

## 🎯 Remember

```
Key Differences from Laravel:

1. Migrations → Manual execution via Dashboard
   (Security: No programmatic SQL)

2. Seeds → Copy to Dashboard manually
   (Same security reason)

3. Type Generation → Required after schema changes
   (TypeScript needs to know structure)

4. Rollbacks → Manual reverse SQL
   (No automatic down migrations)
```

---

## ✨ You're All Set!

```
Ready to use Laravel-style commands with Supabase! 🎉

Try this now:
  $ npm run migrate:status

Questions? Check:
  📖 docs/commands/LARAVEL_STYLE_DB_COMMANDS.md

Happy coding! 🚀
```

---

*Visual guide for Laravel developers transitioning to Next.js + Supabase*
