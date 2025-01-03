import { User } from '@auth/user';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';

export async function authGetDbUserByEmail(email: string) {
	const res = await fetch(`${BASE_URL}/api/auth/db?email=${encodeURIComponent(email)}`);
	if (!res.ok) {
		throw new Error('Failed to fetch user');
	}
	const data = await res.json();
	return data;
}

export async function authUpdateDbUser(userData: Partial<User>) {
	const res = await fetch(`${BASE_URL}/api/auth/db`, {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(userData),
	});
	if (!res.ok) {
		throw new Error('Failed to update user');
	}
	return res.json();
}
