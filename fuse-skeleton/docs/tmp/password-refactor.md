# Authentication System Refactor Plan

## Current State
- Authentication works but password handling is exposed to client
- Password field is part of main User type
- No clear separation between auth and user data
- Missing provider selection UI (authJsProviderMap)
- Navigation flow after login needs improvement

## Goals
1. Move sensitive auth operations server-side
2. Proper separation of concerns
3. Align with Fuse Demo architecture
4. Improve security
5. Better session handling

## Proposed Directory Structure
```
src/
  lib/
    auth/
      service.ts      # Server-side auth operations
      providers.ts    # Auth provider configurations
      session.ts      # Session management
      types.ts        # Auth-specific types (separate from user types)
  api/
    auth/            # Server-side API routes
      [...nextauth]  # NextAuth configuration
      validate.ts    # Password validation endpoint
```

## Type Separation
```typescript
// auth/types.ts
interface AuthUser {
    id: string;
    email: string;
    password: string | null;  // Only used server-side
}

// user/types.ts
interface PublicUser {
    id: string;
    email: string;
    role: string[];
    // ... other non-sensitive fields
}
```

## Authentication Flow
1. Client submits credentials
2. Server-side validation in auth service
3. Return only non-sensitive user data
4. Proper session token handling
5. Secure redirect flow

## Security Improvements
1. Password operations isolated to auth service
2. No sensitive data in client bundles
3. Clear separation between auth and user data
4. Proper session token handling
5. Server-side validation

## Provider Configuration
```typescript
// providers.ts
export const authProviders = [
    Credentials({...}),
    // Other providers
];

export const authJsProviderMap = providers
    .map(provider => ({
        id: provider.id,
        name: provider.name,
        style: provider.style
    }))
    .filter(provider => provider.id !== 'credentials');
```

## Implementation Phases

### Phase 1: Server-Side Auth Service
1. Create auth service with password operations
2. Move validation logic server-side
3. Update NextAuth configuration
4. Add proper error handling

### Phase 2: Type Separation
1. Create separate auth types
2. Update existing interfaces
3. Modify mappers to handle separation
4. Update API responses

### Phase 3: Provider Configuration
1. Add provider configuration
2. Restore authJsProviderMap
3. Update provider selection UI
4. Test multiple auth methods

### Phase 4: Session & Navigation
1. Improve session handling
2. Fix navigation flow
3. Add proper redirects
4. Handle edge cases

### Phase 5: Testing & Documentation
1. Test all auth flows
2. Document security measures
3. Add usage examples
4. Update API documentation

## Breaking Changes
1. User type no longer includes password
2. Auth operations require server calls
3. Session structure changes
4. API response format updates

## Benefits
1. Better security
2. Cleaner architecture
3. Easier maintenance
4. Better alignment with Fuse Demo
5. More scalable auth system

## Migration Strategy
1. Implement changes behind feature flag
2. Gradual rollout of new auth system
3. Maintain backward compatibility
4. Provide migration documentation

## Future Considerations
1. Additional auth providers
2. Enhanced session management
3. Rate limiting
4. Audit logging
5. Password policies

## References
1. Fuse Demo auth implementation
2. NextAuth best practices
3. Security guidelines
4. Current codebase structure 