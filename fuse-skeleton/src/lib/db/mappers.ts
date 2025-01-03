import type { User, DbUser } from '@auth/types';

/**
 * Convert a database user to a UI user model
 */
export function dbToUser(dbUser: DbUser): User {
    return {
        id: dbUser.id,
        email: dbUser.email,
        role: dbUser.role,
        name: dbUser.name || '',
        displayName: dbUser.displayName || '',
        photoURL: dbUser.photoURL || '',
        image: dbUser.image || '',
        password: dbUser.password,
        shortcuts: dbUser.data?.shortcuts || [],
        settings: dbUser.data?.settings || {},
        emailVerified: dbUser.emailVerified
    };
}

/**
 * Convert a UI user model to database fields
 */
export function userToDb(user: Partial<User> & { password?: string }): Partial<DbUser> {
    const data = {
        shortcuts: user.shortcuts || [],
        settings: user.settings || {}
    };

    return {
        ...(user.id && { id: user.id }),
        ...(user.email && { email: user.email }),
        ...(user.role && { role: Array.isArray(user.role) ? user.role : [user.role] }),
        ...(user.name && { name: user.name }),
        ...(user.displayName && { displayName: user.displayName }),
        ...(user.photoURL && { photoURL: user.photoURL }),
        ...(user.image && { image: user.image }),
        ...(user.password && { password: user.password }),
        ...(user.emailVerified && { emailVerified: user.emailVerified }),
        data
    };
} 