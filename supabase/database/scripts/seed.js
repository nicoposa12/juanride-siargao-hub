#!/usr/bin/env node

/**
 * Laravel-style seeder for Supabase
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
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL in .env.local');
  process.exit(1);
}

// Extract project ref from URL
const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

if (!projectRef) {
  console.error('Could not extract project reference from SUPABASE_URL');
  process.exit(1);
}

async function runSeeds() {
  console.log('Laravel-style Database Seeder\n');
  console.log('====================\n');

  const seedsDir = path.join(__dirname, '..', 'seeds');
  
  // Check if specific seed file requested
  const seedFile = process.argv[2];
  
  let files;
  if (seedFile) {
    const file = seedFile.endsWith('.sql') ? seedFile : seedFile + '.sql';
    if (fs.existsSync(path.join(seedsDir, file))) {
      files = [file];
      console.log('Seeding specific file: ' + file + '\n');
    } else {
      console.error('Error: Seed file not found: ' + file);
      console.error('Location: ' + seedsDir + '\n');
      process.exit(1);
    }
  } else {
    files = fs.readdirSync(seedsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();
    console.log('Found ' + files.length + ' seed files:\n');
  }

  if (files.length === 0) {
    console.log('No seed files found\n');
    return;
  }

  files.forEach((file, index) => {
    console.log('   ' + (index + 1).toString().padStart(2, '0') + '. ' + file);
  });

  console.log('\n====================\n');

  // Check if we have database password for direct connection
  if (!dbPassword) {
    console.log('No database password found. Using manual mode.\n');
    showManualInstructions();
    return;
  }

  // Connect to database
  console.log('Attempting automatic seeding...\n');

  // Use the direct connection format from Supabase (for ORMs/migrations)
  // Port 5432 for direct connection (not 6543 which is session pooler)
  const connectionString = `postgresql://postgres.${projectRef}:${encodeURIComponent(dbPassword)}@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres`;

  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('Connected to database\n');
    console.log('Seeding database...\n');

    let successCount = 0;
    let failCount = 0;

    for (const file of files) {
      // Skip temp files
      if (file.startsWith('.temp')) {
        continue;
      }

      const filePath = path.join(seedsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      console.log('Seeding: ' + file);

      try {
        await client.query(sql);
        console.log('Seeded: ' + file + '\n');
        successCount++;
      } catch (error) {
        console.error('Failed: ' + file);
        console.error('Error: ' + error.message + '\n');
        failCount++;
      }
    }

    await client.end();

    console.log('\n====================\n');
    console.log('Seeding Summary:');
    console.log('Successful: ' + successCount);
    console.log('Failed: ' + failCount);
    console.log('Total: ' + files.length + '\n');

    if (successCount > 0) {
      console.log('Database seeded successfully!\n');
    }

    if (failCount > 0) {
      console.log('Some seeds failed. Check errors above.\n');
      process.exit(1);
    }
  } catch (error) {
    console.log('Automatic seeding failed: ' + error.message + '\n');
    console.log('Falling back to manual mode...\n');
    showManualInstructions();
  }
}

function showManualInstructions() {
  console.log('====================\n');
  console.log('MANUAL SEEDING INSTRUCTIONS:\n');
  console.log('1. Open Supabase Dashboard -> SQL Editor');
  console.log('   URL: https://app.supabase.com/project/' + projectRef + '/sql\n');
  console.log('2. Choose a seed file from the list above');
  console.log('   - Open from: supabase/database/seeds/');
  console.log('   - Copy the entire SQL content');
  console.log('   - Paste into SQL Editor and click Run\n');
  console.log('Recommended: Use seed_all.sql for complete test data\n');
  console.log('====================\n');
  console.log('TIP: To enable automatic seeding, add to .env.local:');
  console.log('   SUPABASE_DB_PASSWORD=your-database-password');
  console.log('   Get it from: Supabase Dashboard -> Settings -> Database\n');
}

runSeeds().catch(error => {
  console.error('\nSeeder error: ' + error.message);
  process.exit(1);
});
