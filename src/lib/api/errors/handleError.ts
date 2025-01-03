import { NextResponse } from 'next/server';
import { ApiError, ApiErrorResponse } from './types';
import { ZodError } from 'zod';

export function handleError(error: unknown): NextResponse<ApiErrorResponse> {
  console.error('API Error:', error);

  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        code: error.code,
        message: error.message,
        status: error.statusCode,
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        status: 400,
        errors: error.errors,
      },
      { status: 400 }
    );
  }

  // Default error response
  return NextResponse.json(
    {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
      status: 500,
    },
    { status: 500 }
  );
} 