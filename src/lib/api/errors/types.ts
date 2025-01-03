export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code: string = 'API_ERROR'
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class AuthenticationError extends ApiError {
  constructor(message = 'Authentication required') {
    super(401, message, 'AUTH_REQUIRED');
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends ApiError {
  constructor(message = 'Not authorized') {
    super(403, message, 'NOT_AUTHORIZED');
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends ApiError {
  constructor(message = 'Resource not found') {
    super(404, message, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends ApiError {
  constructor(message = 'Validation failed') {
    super(400, message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export type ApiErrorResponse = {
  code: string;
  message: string;
  status: number;
  errors?: Array<{
    code: string;
    message: string;
    path?: string[];
  }>;
}; 