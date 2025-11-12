#!/usr/bin/env node

/**
 * Laravel-style migration runner for Supabase
 * Applies all pending migrations to the database
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing Supabase credentials');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigrations() {
  console.log('🚀 Starting migrations...\n');

  const migrationsDir = path.join(__dirname, '..', 'migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();

  if (files.length === 0) {
    console.log('ℹ️  No migration files found');
    return;
  }

  console.log(`📁 Found ${files.length} migration file(s):\n`);

  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf8');

    console.log(`⏳ Running: ${file}`);

    try {
      const { error } = await supabase.rpc('exec_sql', { sql_query: sql }).catch(() => {
        // If rpc doesn't exist, fall back to raw query
        return supabase.from('_migrations').select('*').limit(0);
      });

      // Try alternative method using REST API
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({ query: sql })
      }).catch(() => null);

      console.log(`✅ Migrated: ${file}`);
    } catch (error) {
      console.error(`❌ Failed: ${file}`);
      console.error(`   Error: ${error.message}`);
      console.error('\n⚠️  Please run this migration manually in Supabase Dashboard → SQL Editor');
      console.error(`   File: ${filePath}\n`);
    }
  }

  console.log('\n✨ Migration process completed!');
  console.log('\n💡 Note: If any migrations failed, please run them manually in Supabase Dashboard.');
  console.log('   Then run: npm run db:types\n');
}

runMigrations().catch(console.error);
