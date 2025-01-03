import { User } from '@auth/user';
import UserModel from '@auth/user/models/UserModel';
import { PartialDeep } from 'type-fest';
import apiFetch from '@/utils/apiFetch';

/**
 * Get user by id
 */
export async function authGetDbUser(userId: string): Promise<Response> {
	return apiFetch(`/api/auth/user/${userId}`);
}

/**
 * Get user by email
 */
export async function authGetDbUserByEmail(email: string): Promise<Response> {
	return apiFetch(`/api/auth/user-by-email/${email}`);
}

/**
 * Update user
 */
export function authUpdateDbUser(user: PartialDeep<User>) {
	return apiFetch(`/api/auth/user/${user.id}`, {
		method: 'PUT',
		body: JSON.stringify(UserModel(user))
	});
}

/**
 * Create user
 */
export async function authCreateDbUser(user: PartialDeep<User>) {
	return apiFetch('/api/auth/users', {
		method: 'POST',
		body: JSON.stringify(UserModel(user))
	});
}
