import { compare } from 'bcrypt-ts';
import NextAuth, { type Session, type NextAuthConfig } from 'next-auth';
import type { Provider } from 'next-auth/providers';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import Facebook from 'next-auth/providers/facebook';
import { findUserByEmail } from '@/lib/db/users';
import type { User } from '@auth/user';
import { authGetDbUserByEmail, authCreateDbUser } from './authApi';
import { FetchApiError } from '@/utils/apiFetch';

export const providers: Provider[] = [
	Credentials({
		credentials: {
			email: { label: "Email", type: "email" },
			password: { label: "Password", type: "password" }
		},
		async authorize(formInput: any) {
			if (formInput.formType === 'signin') {
				const user = await findUserByEmail(formInput.email);
				if (!user) return null;

				if (!formInput.password || !user.password) return null;

				const passwordMatch = await compare(formInput.password, user.password);
				if (!passwordMatch) return null;

				return {
					id: user.id,
					email: user.email,
					name: user.displayName || user.email,
					image: user.photoURL
				};
			}

			if (formInput.formType === 'signup') {
				if (formInput.password === '' || formInput.email === '') {
					return null;
				}
			}

			return null;
		},
	}),
	// Commented out until configured
	// Google,
	// Facebook
];

const config = {
	theme: { logo: '/assets/images/logo/logo.svg' },
	pages: {
		signIn: '/sign-in'
	},
	providers,
	basePath: '/auth',
	trustHost: true,
	callbacks: {
		authorized() {
			/** Checkout information to how to use middleware for authorization
			 * https://next-auth.js.org/configuration/nextjs#middleware
			 */
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
					/**
					 * Get the session user from database
					 */
					const response = await authGetDbUserByEmail(session.user.email);
					const userDbData = await response.json() as User;
					session.db = userDbData;
					return session;
				} catch (error) {
					const errorStatus = (error as FetchApiError).status;

					/** If user not found, create a new user */
					if (errorStatus === 404) {
						const newUserResponse = await authCreateDbUser({
							email: session.user.email,
							role: ['admin'],
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
