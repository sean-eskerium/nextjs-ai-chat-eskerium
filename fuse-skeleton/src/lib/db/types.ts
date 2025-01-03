/**
 * Database schema types that match our actual database tables
 */

export interface DbUser {
    id: string;
    email: string;
    role: string[];
    display_name: string | null;
    photo_url: string;
    password: string | null;
    shortcuts: string[];
    settings: Record<string, any>;
    login_redirect_url: string;
    email_verified: Date | null;
}

/**
 * Type for creating a new user in the database
 */
export type CreateDbUser = Omit<DbUser, 'id' | 'email_verified'> & {
    id?: string;
    email_verified?: Date | null;
}; 