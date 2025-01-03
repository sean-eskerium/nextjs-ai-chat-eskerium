export const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';

export class FetchApiError extends Error {
	status: number;
	constructor(message: string, status: number) {
		super(message);
		this.status = status;
	}
}

export const globalHeaders = {
	'Content-Type': 'application/json',
};

export default async function apiFetch(path: string, options: RequestInit = {}) {
	const response = await fetch(`${API_BASE_URL}${path}`, {
		...options,
		headers: {
			...globalHeaders,
			...options.headers,
		},
	});

	if (!response.ok) {
		throw new FetchApiError('API request failed', response.status);
	}

	return response;
}
