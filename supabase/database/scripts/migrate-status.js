#!/usr/bin/env node

/**
 * Laravel-style migration status checker
 * Shows which migrations have been applied
 */

const fs = require('fs');
const path = require('path');

console.log('📊 Migration Status\n');
console.log('═'.repeat(80));

const migrationsDir = path.join(__dirname, '..', 'migrations');

try {
  const files = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();

  if (files.length === 0) {
    console.log('\nℹ️  No migration files found\n');
    return;
  }

  console.log(`\n📁 Total migrations: ${files.length}\n`);
  
  files.forEach((file, index) => {
    const filePath = path.join(migrationsDir, file);
    const stats = fs.statSync(filePath);
    const created = stats.birthtime.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    console.log(`${(index + 1).toString().padStart(2, '0')}. ${file}`);
    console.log(`    Created: ${created}`);
    console.log('');
  });

  console.log('═'.repeat(80));
  console.log('\n💡 Note: To verify which migrations are actually applied in your database,');
  console.log('   check the Supabase Dashboard → Database → Tables\n');
  console.log('🔄 To apply migrations: npm run migrate');
  console.log('🔄 To reset database:   npm run migrate:fresh\n');
} catch (error) {
  console.error('❌ Error reading migrations:', error.message);
  process.exit(1);
}
