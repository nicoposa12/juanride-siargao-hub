#!/usr/bin/env node

/**
 * Laravel-style migration runner for Supabase
 * Uses direct PostgreSQL connection for automatic execution
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// Load environment variables from .env.local
require('dotenv').config({ path: path.join(__dirname, '..', '..', '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const dbPassword = process.env.SUPABASE_DB_PASSWORD || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error('❌ Error: Missing NEXT_PUBLIC_SUPABASE_URL in .env.local');
  process.exit(1);
}

// Extract project ref from URL
const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

if (!projectRef) {
  console.error('❌ Error: Could not extract project reference from SUPABASE_URL');
  process.exit(1);
}

async function runMigrations() {
  console.log('🚀 Laravel-style Migration Runner\n');
  console.log('════════════════════════════════════════════════════════════════════════════════\n');

  const migrationsDir = path.join(__dirname, '..', 'migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();

  if (files.length === 0) {
    console.log('ℹ️  No migration files found\n');
    return;
  }

  console.log(`📁 Found ${files.length} migration file(s) to apply:\n`);

  files.forEach((file, index) => {
    console.log(`   ${(index + 1).toString().padStart(2, '00')}. ${file}`);
  });

  console.log('\n════════════════════════════════════════════════════════════════════════════════\n');

  // Check if we have database password for direct connection
  if (!dbPassword) {
    console.log('⚠️  No database password found. Using manual mode.\n');
    showManualInstructions();
    return;
  }

  // Connect to database
  console.log('⏳ Attempting automatic migration via direct database connection...\n');

  // Use the direct connection format from Supabase (for ORMs/migrations)
  // Port 5432 for direct connection (not 6543 which is session pooler)
  const connectionString = `postgresql://postgres.${projectRef}:${encodeURIComponent(dbPassword)}@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres`;

  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');
    console.log('⏳ Applying migrations...\n');

    let successCount = 0;
    let failCount = 0;

    for (const file of files) {
      // Skip temp files
      if (file.startsWith('.temp')) {
        continue;
      }

      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      console.log(`⏳ Running: ${file}`);

      try {
        await client.query(sql);
        console.log(`✅ Migrated: ${file}\n`);
        successCount++;
      } catch (error) {
        console.error(`❌ Failed: ${file}`);
        console.error(`   Error: ${error.message}\n`);
        failCount++;
      }
    }

    await client.end();

    console.log('════════════════════════════════════════════════════════════════════════════════\n');
    console.log('✨ Migration Summary:');
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${failCount}`);
    console.log(`   📊 Total: ${files.length - 1}\n`); // Exclude temp files

    if (successCount > 0) {
      console.log('💡 Next step: Run `npm run db:types` to update TypeScript types\n');
    }

    if (failCount > 0) {
      console.log('⚠️  Some migrations failed. Check errors above.\n');
      process.exit(1);
    }
  } catch (error) {
    console.log(`❌ Automatic migration failed: ${error.message}\n`);
    console.log('Falling back to manual mode...\n');
    showManualInstructions();
  }
}

function showManualInstructions() {
  console.log('════════════════════════════════════════════════════════════════════════════════\n');
  console.log('📋 MANUAL MIGRATION INSTRUCTIONS:\n');
  console.log('1. Open Supabase Dashboard → SQL Editor');
  console.log(`   URL: https://app.supabase.com/project/${projectRef}/sql\n`);
  console.log('2. For each migration file, copy SQL and click "Run"\n');
  console.log('3. After all migrations, run: npm run db:types\n');
  console.log('════════════════════════════════════════════════════════════════════════════════\n');
  console.log('💡 TIP: To enable automatic migrations, add to .env.local:');
  console.log('   SUPABASE_DB_PASSWORD=your-database-password');
  console.log('   Get it from: Supabase Dashboard → Settings → Database → Connection String\n');
}

runMigrations().catch(error => {
  console.error('\n❌ Migration runner error:', error.message);
  process.exit(1);
});
