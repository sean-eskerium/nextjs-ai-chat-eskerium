import { NextResponse } from 'next/server';
import { authJsProviderMap } from '@auth/authJs';

export const GET = async () => {
    return NextResponse.json(authJsProviderMap);
}; 