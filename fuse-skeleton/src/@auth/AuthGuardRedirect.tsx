'use client';

import React, { useCallback, useEffect, useState } from 'react';
import FuseUtils from '@fuse/utils';
import {
	getSessionRedirectUrl,
	resetSessionRedirectUrl,
	setSessionRedirectUrl
} from '@fuse/core/FuseAuthorization/sessionRedirectUrl';
import { FuseRouteObjectType } from '@fuse/core/FuseLayout/FuseLayout';
import usePathname from '@fuse/hooks/usePathname';
import FuseLoading from '@fuse/core/FuseLoading';
import useNavigate from '@fuse/hooks/useNavigate';
import useUser from './useUser';

type AuthGuardProps = {
	auth: FuseRouteObjectType['auth'];
	children: React.ReactNode;
	loginRedirectUrl?: string;
};

function AuthGuardRedirect({ auth, children, loginRedirectUrl = '/' }: AuthGuardProps) {
	const { data: user, isGuest } = useUser();
	const userRole = user?.role;
	const navigate = useNavigate();

	const [accessGranted, setAccessGranted] = useState<boolean>(false);
	const pathname = usePathname();

	// Function to handle redirection
	const handleRedirection = useCallback(() => {
		console.log('AuthGuardRedirect - Starting redirection with:', {
			isGuest,
			pathname,
			loginRedirectUrl,
			storedRedirectUrl: getSessionRedirectUrl(),
			NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL
		});

		const redirectUrl = getSessionRedirectUrl() || loginRedirectUrl;
		const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';

		if (isGuest) {
			console.log('AuthGuardRedirect - Guest user, redirecting to:', `${baseUrl}/sign-in`);
			navigate(`${baseUrl}/sign-in`);
		} else {
			console.log('AuthGuardRedirect - Authenticated user, redirecting to:', `${baseUrl}${redirectUrl}`);
			navigate(`${baseUrl}${redirectUrl}`);
			resetSessionRedirectUrl();
		}
	}, [isGuest, loginRedirectUrl, pathname]);

	// Check user's permissions and set access granted state
	useEffect(() => {
		console.log('AuthGuardRedirect - Checking permissions:', {
			auth,
			userRole,
			isGuest,
			pathname,
			NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL
		});

		const isOnlyGuestAllowed = Array.isArray(auth) && auth.length === 0;
		const userHasPermission = FuseUtils.hasPermission(auth, userRole);
		const ignoredPaths = ['/', '/callback', '/sign-in', '/sign-out', '/logout', '/404'];

		if (!auth || (auth && userHasPermission) || (isOnlyGuestAllowed && isGuest)) {
			console.log('AuthGuardRedirect - Access granted');
			resetSessionRedirectUrl();
			setAccessGranted(true);
			return;
		}

		if (!userHasPermission) {
			console.log('AuthGuardRedirect - Permission denied, handling redirection');
			if (isGuest && !ignoredPaths.includes(pathname)) {
				console.log('AuthGuardRedirect - Setting session redirect URL:', pathname);
				setSessionRedirectUrl(pathname);
			} else if (!isGuest && !ignoredPaths.includes(pathname)) {
				/**
				 * If user is member but don't have permission to view the route
				 * redirected to main route '/'
				 */
				if (isOnlyGuestAllowed) {
					console.log('AuthGuardRedirect - Setting session redirect URL to root');
					setSessionRedirectUrl('/');
				} else {
					console.log('AuthGuardRedirect - Setting session redirect URL to 401');
					setSessionRedirectUrl('/401');
				}
			}
		}

		handleRedirection();
	}, [auth, userRole, isGuest, pathname]);

	return accessGranted ? children : <FuseLoading />;
}

export default AuthGuardRedirect;
