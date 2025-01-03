import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './models';

const queryClient = postgres(process.env.DATABASE_URL!, {
  max: 1,
  ssl: 'require',
  connect_timeout: 10,
});

export const db = drizzle(queryClient, { schema }); 