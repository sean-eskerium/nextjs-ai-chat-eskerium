import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError, FetchBaseQueryMeta } from '@reduxjs/toolkit/query';
import type { ApiErrorResponse } from '@/lib/api/errors/types';

// Base query with error handling
const baseQuery = fetchBaseQuery({
  baseUrl: '/api/v1',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Enhanced base query with error handling
const enhancedBaseQuery: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError,
  object,
  FetchBaseQueryMeta
> = async (args, api, extraOptions) => {
  const result = await baseQuery(args, api, extraOptions);
  
  if (result.error) {
    // Type assertion for the error data
    const errorData = result.error.data as ApiErrorResponse;
    
    // Handle specific error cases
    switch (result.error.status) {
      case 401:
        // Handle unauthorized - could dispatch an action to clear auth state
        api.dispatch({ type: 'auth/clearCredentials' });
        break;
      case 403:
        // Handle forbidden
        break;
      case 404:
        // Handle not found
        break;
      default:
        // Handle other errors
        break;
    }

    // Return the error in the expected format
    return {
      error: result.error,
      data: undefined,
      meta: result.meta
    };
  }
  
  return result;
};

// Create the base API service
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: enhancedBaseQuery,
  endpoints: () => ({}),
  // Add tags for cache invalidation
  tagTypes: ['Auth', 'User', 'Settings'],
});

// Export the correct type for endpoint builders
export type ApiEndpointBuilder = typeof baseApi.endpoints;

export default baseApi; 