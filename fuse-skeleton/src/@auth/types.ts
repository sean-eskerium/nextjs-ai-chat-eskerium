import { FuseSettingsConfigType } from '@fuse/core/FuseSettings/FuseSettings';
import { PartialDeep } from 'type-fest';
import type { DefaultSession } from 'next-auth';
import type { User as NextAuthUser } from 'next-auth';

/**
 * The type definition for a user object in the UI
 */
export interface User extends NextAuthUser {
    id: string;
    email: string;
    role: string[];
    name: string;
    displayName: string;
    photoURL: string;
    image: string;
    password?: string | null;
    shortcuts: string[];
    settings: Record<string, any>;
    emailVerified: Date | null;
}

/**
 * The type definition for a user object in the database
 */
export interface DbUser {
    id: string;
    email: string;
    role: string[];
    name: string;
    displayName: string;
    photoURL: string;
    image: string;
    password: string | null;
    data: {
        shortcuts: string[];
        settings: Record<string, any>;
    };
    emailVerified: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

declare module 'next-auth' {
    interface Session extends DefaultSession {
        user: {
            id: string;
            email: string;
            role: string[];
            name: string;
            displayName: string;
            photoURL: string;
            image: string;
            shortcuts: string[];
            settings: Record<string, any>;
            emailVerified: Date | null;
        }
    }
} 