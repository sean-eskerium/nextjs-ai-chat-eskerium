import NextAuth from 'next-auth';
import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authGetDbUserByEmail } from './authApi';
import { compare } from 'bcrypt-ts';

const providers = [
	Credentials({
		credentials: {
			email: { label: "Email", type: "email" },
			password: { label: "Password", type: "password" }
		},
		async authorize(credentials) {
			if (!credentials?.email || !credentials?.password) {
				return null;
			}

			const dbUser = await authGetDbUserByEmail(credentials.email);
			if (!dbUser || !dbUser.password) {
				return null;
			}

			const passwordMatch = await compare(credentials.password, dbUser.password);
			if (!passwordMatch) {
				return null;
			}

			return {
				id: dbUser.id,
				email: dbUser.email,
				...(dbUser.name && { name: dbUser.name })
			};
		}
	})
];

export type AuthJsProvider = {
	id: string;
	name: string;
	style?: {
		text?: string;
		bg?: string;
	};
};

// Add this back for the sign-in form
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

const config: NextAuthConfig = {
	providers,
	callbacks: {
		async session({ session }) {
			if (session?.user?.email) {
				const dbUser = await authGetDbUserByEmail(session.user.email);
				if (dbUser) {
					session.user = { ...session.user, ...dbUser };
				}
			}
			return session;
		}
	},
	pages: {
		signIn: '/sign-in'
	},
	session: {
		strategy: 'jwt'
	},
	secret: process.env.NEXTAUTH_SECRET,
	trustHost: true
};

export const { handlers, auth, signIn, signOut } = NextAuth(config);
