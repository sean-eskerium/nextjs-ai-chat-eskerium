# API Architecture in Fuse React Skeleton

## Overview

This document outlines our API architecture in the Fuse React skeleton app. We implement real database integration using drizzle-orm with postgres.js while maintaining compatibility with Fuse React's patterns.

## Architecture Principles

### 1. Layer Separation

Our API architecture follows a clear three-layer pattern:

```
UI Layer (React Components)
    ↓
API Layer (API Functions)
    ↓
Database Layer (Drizzle ORM)
```

Each layer has distinct responsibilities:

1. **UI Layer**
   - Handles user interactions
   - Uses camelCase properties
   - Consumes API functions
   - Matches Fuse React's UI expectations

2. **API Layer**
   - Provides clean API functions
   - Handles data transformation
   - Manages request/response lifecycle
   - Uses consistent error handling
   - Enforces server-side checks

3. **Database Layer**
   - Executes database operations via drizzle-orm
   - Uses snake_case properties in schema
   - Handles database connections safely
   - Implements proper query building

### 2. Server-Side Safety

We implement strict server-side checks:

```typescript
// Helper function in lib/db.ts
export function ensureServerSide() {
    if (typeof window !== 'undefined') {
        throw new Error('This function can only be called on the server side');
    }
}

// Usage in API routes
export async function GET(request: NextRequest) {
    ensureServerSide();
    // ... rest of the code
}
```

### 3. Database Connection

We use postgres.js with drizzle-orm for type-safe database operations:

```typescript
// lib/db.ts
const client = process.env.POSTGRES_URL && typeof window === 'undefined' 
    ? postgres(process.env.POSTGRES_URL, { max: 1 })
    : null;

export const db = client ? drizzle(client, { schema }) : null;
```

### 4. Environment Variables

Required environment variables:

```env
# Database
POSTGRES_URL="postgresql://user:password@host/dbname?sslmode=require"

# Authentication
NEXTAUTH_URL="http://localhost:3001"
NEXTAUTH_SECRET="your-secret-here"

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

## Implementation Pattern

### 1. Directory Structure

```
src/
  lib/
    db/
      schema.ts       # Database schema definitions
      index.ts       # Database connection setup
  app/
    api/
      auth/
        [...nextauth]/  # NextAuth.js routes
        user/          # User management routes
        users/         # User creation routes
```

### 2. Database Operations

Example of a type-safe database operation:

```typescript
const result = await db.query.user.findFirst({
    where: (u) => eq(u.email, email)
});
```

### 3. API Routes

Example of a properly structured API route:

```typescript
export async function GET(request: NextRequest) {
    ensureServerSide();

    try {
        if (!db) {
            throw new Error('Database connection not available');
        }

        // ... database operations

        return NextResponse.json(result);
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
```

## Best Practices

1. **Server-Side Safety**
   - Always use `ensureServerSide()` in API routes
   - Check database connection availability
   - Handle errors gracefully

2. **Type Safety**
   - Use drizzle-orm's type inference
   - Define clear interfaces for all models
   - Implement proper validation

3. **Error Handling**
   - Use consistent error responses
   - Implement proper logging
   - Handle all edge cases

4. **Database Operations**
   - Use drizzle-orm's query builder
   - Implement proper connection pooling
   - Handle transactions correctly

5. **Security**
   - Validate all inputs
   - Implement proper authentication
   - Follow security best practices

## References

- [Drizzle ORM Documentation](https://orm.drizzle.team)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [Fuse React Documentation](https://fuse-react-nextjs-demo.fusetheme.com/documentation) 