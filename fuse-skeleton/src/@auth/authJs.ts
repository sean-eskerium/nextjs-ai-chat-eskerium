import { compare } from 'bcrypt-ts';
import NextAuth, { type Session, type NextAuthConfig, type User as NextAuthUser } from 'next-auth';
import type { Provider } from 'next-auth/providers';
import Credentials from 'next-auth/providers/credentials';
import { findUserByEmail } from '@/lib/db/users';
import type { User } from '@auth/types';

type ExtendedUser = NextAuthUser & {
	id: string;
	role: string[];
	displayName: string;
	photoURL: string;
	shortcuts: string[];
	settings: Record<string, any>;
};

export const providers: Provider[] = [
	Credentials({
		credentials: {
			email: { label: "Email", type: "email" },
			password: { label: "Password", type: "password" }
		},
		async authorize({ email, password }: any) {
			const user = await findUserByEmail(email);
			if (!user) return null;

			if (!password || !user.password) return null;

			const passwordMatch = await compare(password, user.password);
			if (!passwordMatch) return null;

			return {
				id: user.id,
				email: user.email,
				name: user.name,
				image: user.image,
				role: user.role,
				displayName: user.displayName,
				photoURL: user.photoURL,
				shortcuts: user.shortcuts,
				settings: user.settings,
				emailVerified: user.emailVerified
			};
		},
	}),
	// Add other providers here if needed
];

const config = {
	providers,
	pages: {
		signIn: '/sign-in'
	},
	callbacks: {
		async jwt({ token, user }) {
			if (user) {
				const extendedUser = user as ExtendedUser;
				token.id = extendedUser.id;
				token.role = extendedUser.role;
				token.displayName = extendedUser.displayName;
				token.photoURL = extendedUser.photoURL;
				token.shortcuts = extendedUser.shortcuts;
				token.settings = extendedUser.settings;
			}

			return token;
		},
		async session({ session, token }) {
			if (session.user) {
				session.user.id = token.id as string;
				session.user.role = token.role as string[];
				session.user.displayName = token.displayName as string;
				session.user.photoURL = token.photoURL as string;
				session.user.shortcuts = token.shortcuts as string[];
				session.user.settings = token.settings as Record<string, any>;
			}

			return session;
		},
	},
	session: {
		strategy: 'jwt',
		maxAge: 30 * 24 * 60 * 60 // 30 days
	},
} satisfies NextAuthConfig;

export type AuthJsProvider = {
	id: string;
	name: string;
	style?: {
		text?: string;
		bg?: string;
	};
};

export function getAuthJsProviderMap(): AuthJsProvider[] {
	return providers
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
}

export const authJsProviderMap = getAuthJsProviderMap();

const nextAuth = NextAuth(config);

export const handlers = nextAuth.handlers;
export const auth = nextAuth.auth;
export const signIn = nextAuth.signIn as (provider?: string | undefined, options?: Record<string, unknown> | undefined) => Promise<void>;
export const signOut = nextAuth.signOut;
