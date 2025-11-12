#!/usr/bin/env node

/**
 * Laravel-style seeder for Supabase
 * Seeds the database with test data
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

async function runSeeds() {
  console.log('🌱 Starting database seeding...\n');

  const seedsDir = path.join(__dirname, '..', 'seeds');
  
  // Check if specific seed file requested
  const seedFile = process.argv[2];
  
  let files;
  if (seedFile) {
    const file = seedFile.endsWith('.sql') ? seedFile : `${seedFile}.sql`;
    if (fs.existsSync(path.join(seedsDir, file))) {
      files = [file];
      console.log(`📁 Running specific seed: ${file}\n`);
    } else {
      console.error(`❌ Error: Seed file '${file}' not found in seeds directory`);
      process.exit(1);
    }
  } else {
    files = fs.readdirSync(seedsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();
    console.log(`📁 Found ${files.length} seed file(s):\n`);
  }

  if (files.length === 0) {
    console.log('ℹ️  No seed files found');
    return;
  }

  for (const file of files) {
    const filePath = path.join(seedsDir, file);
    const sql = fs.readFileSync(filePath, 'utf8');

    console.log(`⏳ Seeding: ${file}`);

    try {
      // Note: Supabase doesn't support direct SQL execution via client library
      // Seeds must be run manually via Dashboard SQL Editor
      console.log(`⚠️  Please run this seed manually in Supabase Dashboard → SQL Editor`);
      console.log(`   File: ${filePath}`);
    } catch (error) {
      console.error(`❌ Failed: ${file}`);
      console.error(`   Error: ${error.message}\n`);
    }
  }

  console.log('\n📋 Seeding Instructions:');
  console.log('1. Go to Supabase Dashboard → SQL Editor');
  console.log('2. Copy and paste seed file contents');
  console.log('3. Run the SQL\n');
  console.log('💡 Seed files location: supabase/database/seeds/\n');
}

runSeeds().catch(console.error);
