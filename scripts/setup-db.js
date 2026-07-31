import { execSync } from 'child_process';

const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;

if (!dbUrl) {
  console.error("\x1b[31mError: SUPABASE_DB_URL or DATABASE_URL is not set in your environment or .env file.\x1b[0m");
  console.log("\nPlease define the database connection string in your .env file, for example:");
  console.log('\x1b[36mSUPABASE_DB_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-ID].supabase.co:6543/postgres"\x1b[0m');
  process.exit(1);
}

try {
  console.log("\x1b[32mPushing database schema to remote Supabase database...\x1b[0m");
  execSync(`npx supabase db push --db-url "${dbUrl}"`, { stdio: 'inherit' });
  console.log("\x1b[32m✔ Database schema successfully pushed!\x1b[0m");
} catch (error) {
  console.error("\x1b[31m✖ Failed to push database schema:\x1b[0m", error.message);
  process.exit(1);
}
