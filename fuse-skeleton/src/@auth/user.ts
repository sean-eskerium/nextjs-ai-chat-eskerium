import type { User as NextAuthUser } from 'next-auth';

export interface User extends NextAuthUser {
    id: string;
    email: string;
    role?: string[];
    name?: string;
    image?: string;
    data?: {
        shortcuts: any[];
        settings: Record<string, any>;
    };
    emailVerified: Date | null;
} 