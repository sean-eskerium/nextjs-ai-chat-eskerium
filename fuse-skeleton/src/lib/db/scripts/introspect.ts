import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
  const connection = postgres(process.env.DATABASE_URL!);
  const db = drizzle(connection);

  console.log('Introspecting database...');
  
  // This will create a new migration based on the current database state
  await migrate(db, { migrationsFolder: './src/lib/db/migrations' });
  
  await connection.end();
}

main().catch(console.error); 