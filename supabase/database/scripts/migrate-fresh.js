#!/usr/bin/env node

/**
 * Laravel-style fresh migration
 * WARNING: This will drop all tables and re-run migrations
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('⚠️  WARNING: DESTRUCTIVE OPERATION');
console.log('═'.repeat(80));
console.log('\nThis will:');
console.log('  1. Drop all tables in your database');
console.log('  2. Re-run all migrations from scratch');
console.log('  3. DELETE ALL DATA (cannot be undone)\n');
console.log('💡 For production databases, use Supabase Dashboard backups first!\n');

rl.question('Are you absolutely sure? Type "YES" to continue: ', (answer) => {
  if (answer === 'YES') {
    console.log('\n🔥 To proceed with fresh migration:\n');
    console.log('1. Go to Supabase Dashboard → SQL Editor');
    console.log('2. Run this SQL to drop all tables:\n');
    console.log('   BEGIN;');
    console.log('   SET session_replication_role = replica;');
    console.log('   DROP TABLE IF EXISTS notifications CASCADE;');
    console.log('   DROP TABLE IF EXISTS messages CASCADE;');
    console.log('   DROP TABLE IF EXISTS reviews CASCADE;');
    console.log('   DROP TABLE IF EXISTS payments CASCADE;');
    console.log('   DROP TABLE IF EXISTS bookings CASCADE;');
    console.log('   DROP TABLE IF EXISTS favorites CASCADE;');
    console.log('   DROP TABLE IF EXISTS blocked_dates CASCADE;');
    console.log('   DROP TABLE IF EXISTS maintenance_logs CASCADE;');
    console.log('   DROP TABLE IF EXISTS vehicles CASCADE;');
    console.log('   DROP TABLE IF EXISTS users CASCADE;');
    console.log('   SET session_replication_role = DEFAULT;');
    console.log('   COMMIT;\n');
    console.log('3. Then run: npm run migrate');
    console.log('4. Then run: npm run db:types');
    console.log('5. Optionally seed: npm run db:seed\n');
  } else {
    console.log('\n✅ Operation cancelled. No changes made.\n');
  }
  rl.close();
});
