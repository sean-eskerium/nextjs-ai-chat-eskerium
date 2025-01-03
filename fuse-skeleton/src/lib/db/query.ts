'use server';

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './models';

// Declare but don't initialize outside the function
let queryClient: ReturnType<typeof postgres> | null = null;
let db: ReturnType<typeof drizzle<typeof schema>> | null = null;

// Create a function to get the db instance
export async function getDb() {
    if (typeof window !== 'undefined') {
        throw new Error('Database can only be accessed on the server side');
    }

    if (!queryClient) {
        console.log('getDb - Initializing database connection');
        queryClient = postgres(process.env.DATABASE_URL!, {
            max: 1,
            ssl: 'require',
            connect_timeout: 10,
        });

        console.log('getDb - Initializing drizzle with schema');
        db = drizzle(queryClient, { schema });
    }

    console.log('getDb - Returning db instance');

    return db;
}

// Export a type for use in other files
export type DB = NonNullable<ReturnType<typeof getDb>>; 