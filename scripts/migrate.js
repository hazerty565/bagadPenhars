// Migration script for Bagad Penhars database
// Run with: node scripts/migrate.js

const { execSync } = require('child_process');

try {
  // Generate new migration
  console.log('Generating new migration...');
  execSync('npx drizzle-kit generate', { stdio: 'inherit' });
  
  // Push migration to Neon
  console.log('Pushing migration to Neon...');
  execSync('npx drizzle-kid push', { stdio: 'inherit' });
  
  console.log('Migration completed successfully!');
} catch (error) {
  console.error('Migration failed:', error.message);
  process.exit(1);
}