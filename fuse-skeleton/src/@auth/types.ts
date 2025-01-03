import type { User as DbUser } from './user';

declare module 'next-auth' {
	interface Session {
		db: DbUser;
		accessToken?: string;
	}
} 