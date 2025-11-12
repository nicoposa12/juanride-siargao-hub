#!/usr/bin/env node

/**
 * Laravel-style migration rollback
 * Note: Supabase doesn't have built-in rollback support
 * Manual rollback instructions provided
 */

const fs = require('fs');
const path = require('path');

console.log('🔄 Migration Rollback\n');
console.log('═'.repeat(80));

const migrationsDir = path.join(__dirname, '..', 'migrations');

try {
  const files = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort()
    .reverse();

  if (files.length === 0) {
    console.log('\nℹ️  No migration files found\n');
    return;
  }

  const lastMigration = files[0];

  console.log('\n⚠️  Supabase does not support automatic rollbacks');
  console.log('\n📝 To manually rollback the last migration:\n');
  console.log(`Last migration: ${lastMigration}\n`);
  console.log('Steps:');
  console.log('1. Review the migration file to understand what was created');
  console.log('2. Create a reverse migration script (rollback SQL)');
  console.log('3. Run the rollback SQL in Supabase Dashboard → SQL Editor\n');
  console.log('Example rollback SQL:\n');
  console.log('   BEGIN;');
  console.log('   -- Drop tables/columns created in migration');
  console.log('   -- ALTER TABLE table_name DROP COLUMN column_name;');
  console.log('   -- DROP TABLE IF EXISTS table_name CASCADE;');
  console.log('   COMMIT;\n');
  console.log('4. After rollback, run: npm run db:types\n');
  console.log('═'.repeat(80));
  console.log('\n💡 Best Practice: Create down migrations for each up migration');
  console.log('   Store in: supabase/database/migrations/rollbacks/\n');
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
