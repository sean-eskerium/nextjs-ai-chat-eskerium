import { NextRequest, NextResponse } from 'next/server';

const errorMessages: { [key: string]: string } = {
    default: 'An error occurred during authentication',
    configuration: 'There is a problem with the server configuration',
    accessdenied: 'Access denied. You do not have permission to access this resource',
    verification: 'The verification token has expired or has already been used',
    'signin-required': 'You must be signed in to access this resource',
    unauthorized: 'You are not authorized to access this resource',
    invalidcredentials: 'Invalid credentials',
};

const statusCodes: { [key: string]: number } = {
    default: 500,
    configuration: 500,
    accessdenied: 403,
    verification: 401,
    'signin-required': 401,
    unauthorized: 401,
    invalidcredentials: 401,
};

export const GET = async (request: NextRequest) => {
    const searchParams = request.nextUrl.searchParams;
    const error = searchParams.get('error');

    const errorMessage = error ? errorMessages[error] || errorMessages.default : errorMessages.default;
    const statusCode = error ? statusCodes[error] || statusCodes.default : statusCodes.default;

    return NextResponse.json(
        { error: errorMessage },
        { status: statusCode }
    );
}; 