'use server';

import { getDb, type DB } from './db/query';

// Helper function to ensure we're on the server
export async function ensureServerSide() {
    if (typeof window !== 'undefined') {
        throw new Error('This function can only be called on the server side');
    }
}

export { getDb, type DB }; 