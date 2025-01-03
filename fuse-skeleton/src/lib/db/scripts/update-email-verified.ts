import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function updateEmailVerified() {
  const queryClient = postgres(process.env.DATABASE_URL!, {
    max: 1,
    ssl: 'require',
    connect_timeout: 10,
  });

  try {
    // Run the update query
    await queryClient.unsafe(`
      UPDATE "User" 
      SET "emailVerified" = CURRENT_TIMESTAMP 
      WHERE "emailVerified" IS NULL
    `);
    console.log('Successfully updated emailVerified for existing users');
  } catch (error) {
    console.error('Error updating emailVerified:', error);
  } finally {
    await queryClient.end();
  }
}

updateEmailVerified(); 