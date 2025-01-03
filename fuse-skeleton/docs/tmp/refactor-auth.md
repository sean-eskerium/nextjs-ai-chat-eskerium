# Authentication Refactoring Plan

## Current Issues

1. **Split Code Structure**
   - API routes are split between `/app/api/` and `/lib/db/`
   - Authentication logic is scattered across multiple locations
   - Duplicate types and models in different places
   - No clear separation between API routes and business logic

2. **Authentication Flow Issues**
   - Password handling inconsistency between social and credentials providers
   - Database schema mismatches with actual usage
   - Type safety issues in mappers and models

## Proposed Directory Structure

```
/src
  /lib
    /db          # Database connection and configuration
      /schema.ts   # Database schema definitions
      /client.ts   # Database client setup
    /models      # Database models and types
      /user.ts     # User model and types
      /auth.ts     # Auth-related types
    /services    # Business logic layer
      /auth.ts     # Authentication service
      /user.ts     # User service
    /api         # API handlers and middleware
      /auth/       # Auth-related API handlers
      /user/       # User-related API handlers
    /auth        # Authentication core
      /providers/  # Auth providers (credentials, social)
      /session/    # Session handling
      /middleware/ # Auth middleware
  /app
    /api        # Next.js API routes (thin wrappers)
      /auth/      # Auth routes
      /user/      # User routes
```

## Implementation Plan

### Phase 1: Code Reorganization

1. Create new directory structure
2. Move database-related code to `/lib/db/`
   - Schema definitions
   - Database client setup
   - Migration handling

3. Create proper model layer in `/lib/models/`
   - Move types from `@auth/types.ts`
   - Create proper User model
   - Define auth-related types

4. Create service layer in `/lib/services/`
   - Authentication service
   - User service
   - Move business logic from API routes

5. Move API handlers to `/lib/api/`
   - Auth handlers
   - User handlers
   - Common middleware

6. Update Next.js API routes to use new structure
   - Make them thin wrappers around `/lib/api/` handlers
   - Ensure proper error handling
   - Add request validation

### Phase 2: Authentication Improvements

1. Update User Schema
   ```typescript
   export const user = pgTable('User', {
     id: uuid('id').primaryKey().notNull().defaultRandom(),
     email: varchar('email', { length: 64 }).notNull(),
     password: varchar('password', { length: 64 }),
     emailVerified: timestamp('emailVerified'),
     image: text('image'),
     name: varchar('name', { length: 255 }),
     role: text('role').array().$type<string[]>().default(sql`ARRAY['user']::text[]`),
     displayName: varchar('displayName', { length: 255 }),
     photoURL: varchar('photoURL', { length: 255 }),
     data: json('data').default(sql`'{"shortcuts":[],"settings":{}}'::jsonb`),
     createdAt: timestamp('createdAt').defaultNow(),
     updatedAt: timestamp('updatedAt').defaultNow(),
   });
   ```

2. Update Authentication Flow
   - Modify credentials provider to handle both password and social auth
   - Implement proper password hashing
   - Add social provider support
   - Handle user creation consistently

3. Update Types and Mappers
   - Create consistent type definitions
   - Update mappers to handle all fields
   - Add proper validation

### Phase 3: Testing and Documentation

1. Add Tests
   - Unit tests for services
   - Integration tests for API
   - Authentication flow tests

2. Update Documentation
   - API documentation
   - Authentication flow
   - Database schema
   - Development setup

## Migration Strategy

1. Create new structure alongside existing code
2. Gradually move functionality to new structure
3. Update API routes one at a time
4. Run both old and new code in parallel
5. Switch over once everything is tested
6. Remove old code

## Breaking Changes

1. API route structure will change
2. Some type definitions will be updated
3. Database schema will be modified
4. Authentication flow will be standardized

## Benefits

1. Clear separation of concerns
2. Better maintainability
3. Improved type safety
4. Consistent authentication handling
5. Better testability
6. Cleaner API structure
7. Single source of truth for models and types

## Next Steps

1. Review and approve plan
2. Create new directory structure
3. Start with Phase 1 implementation
4. Test each component as it's moved
5. Document changes as we go 