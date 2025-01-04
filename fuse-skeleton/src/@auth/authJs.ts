import NextAuth from 'next-auth';
import { User } from '@auth/user';
import type { NextAuthConfig } from 'next-auth';
import type { Provider } from 'next-auth/providers';
import type { AdapterUser, AdapterAccount, AdapterSession } from '@auth/core/adapters';
import Credentials from 'next-auth/providers/credentials';
import Facebook from 'next-auth/providers/facebook';
import Google from 'next-auth/providers/google';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { getDb } from '@/lib/db/query';
import { authGetDbUserByEmail, authCreateDbUser } from './authApi';
import { FetchApiError } from '@/utils/apiFetch';

export const providers: Provider[] = [
	Credentials({
		credentials: {
			email: { label: "Email", type: "email" },
			password: { label: "Password", type: "password" }
		},
		async authorize(formInput: any) {
			/**
			 * Sign in validation
			 */
			if (formInput.formType === 'signin') {
				if (!formInput.password || !formInput.email) {
					return null;
				}
			}

			/**
			 * Sign up validation
			 */
			if (formInput.formType === 'signup') {
				if (!formInput.password || !formInput.email) {
					return null;
				}
			}

			/**
			 * Return email for session
			 */
			return {
				email: formInput.email
			};
		}
	}),
	Google,
	Facebook
];

const config = {
	theme: { logo: '/assets/images/logo/logo.svg' },
	adapter: {
		async createUser(data): Promise<AdapterUser> {
			const db = await getDb();
			const adapter = DrizzleAdapter(await db);
			const result = await adapter.createUser(data);
			if (!result) throw new Error('Failed to create user');
			return result;
		},
		async getUser(id): Promise<AdapterUser | null> {
			const db = await getDb();
			const adapter = DrizzleAdapter(await db);
			return adapter.getUser(id);
		},
		async getUserByEmail(email): Promise<AdapterUser | null> {
			const db = await getDb();
			const adapter = DrizzleAdapter(await db);
			return adapter.getUserByEmail(email);
		},
		async updateUser(data): Promise<AdapterUser> {
			const db = await getDb();
			const adapter = DrizzleAdapter(await db);
			const result = await adapter.updateUser(data);
			if (!result) throw new Error('Failed to update user');
			return result;
		},
		async deleteUser(userId): Promise<void> {
			const db = await getDb();
			const adapter = DrizzleAdapter(await db);
			await adapter.deleteUser(userId);
		},
		async linkAccount(account): Promise<void> {
			const db = await getDb();
			const adapter = DrizzleAdapter(await db);
			await adapter.linkAccount(account);
		},
		async unlinkAccount(providerAccountId): Promise<void> {
			const db = await getDb();
			const adapter = DrizzleAdapter(await db);
			await adapter.unlinkAccount(providerAccountId);
		},
		async getSessionAndUser(sessionToken): Promise<{ user: AdapterUser; session: AdapterSession } | null> {
			const db = await getDb();
			const adapter = DrizzleAdapter(await db);
			return adapter.getSessionAndUser(sessionToken);
		},
		async createSession(data): Promise<AdapterSession> {
			const db = await getDb();
			const adapter = DrizzleAdapter(await db);
			const result = await adapter.createSession(data);
			if (!result) throw new Error('Failed to create session');
			return result;
		},
		async updateSession(data): Promise<AdapterSession | null> {
			const db = await getDb();
			const adapter = DrizzleAdapter(await db);
			return adapter.updateSession(data);
		},
		async deleteSession(sessionToken): Promise<void> {
			const db = await getDb();
			const adapter = DrizzleAdapter(await db);
			await adapter.deleteSession(sessionToken);
		}
	},
	pages: {
		signIn: '/sign-in'
	},
	providers,
	basePath: '/auth',
	trustHost: true,
	callbacks: {
		authorized() {
			return true;
		},
		jwt({ token, trigger, account, user }) {
			if (trigger === 'update') {
				token.name = user.name;
			}

			if (account?.provider === 'keycloak') {
				return { ...token, accessToken: account.access_token };
			}

			return token;
		},
		async session({ session, token }) {
			if (token.accessToken && typeof token.accessToken === 'string') {
				session.accessToken = token.accessToken;
			}

			if (session) {
				try {
					const response = await authGetDbUserByEmail(session.user.email);
					const userDbData = await response.json() as User;
					session.db = userDbData;
					return session;
				} catch (error) {
					const errorStatus = (error as FetchApiError).status;

					if (errorStatus === 404) {
						const newUserResponse = await authCreateDbUser({
							email: session.user.email,
							role: ['user'],  // Default to user role
							displayName: session.user.name,
							photoURL: session.user.image
						});

						const newUser = await newUserResponse.json() as User;
						session.db = newUser;
						return session;
					}

					throw error;
				}
			}

			return null;
		}
	},
	experimental: {
		enableWebAuthn: true
	},
	session: {
		strategy: 'jwt',
		maxAge: 30 * 24 * 60 * 60 // 30 days
	},
	debug: process.env.NODE_ENV !== 'production'
} satisfies NextAuthConfig;

export type AuthJsProvider = {
	id: string;
	name: string;
	style?: {
		text?: string;
		bg?: string;
	};
};

export const authJsProviderMap: AuthJsProvider[] = providers
	.map((provider) => {
		const providerData = typeof provider === 'function' ? provider() : provider;
		return {
			id: providerData.id,
			name: providerData.name,
			style: {
				text: (providerData as { style?: { text: string } }).style?.text,
				bg: (providerData as { style?: { bg: string } }).style?.bg
			}
		};
	})
	.filter((provider) => provider.id !== 'credentials');

export const { handlers, auth, signIn, signOut } = NextAuth(config);
