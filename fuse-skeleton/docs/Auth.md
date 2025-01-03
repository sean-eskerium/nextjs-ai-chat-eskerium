# Authentication in Fuse React Skeleton

## Overview

This document outlines our authentication implementation in the Fuse React skeleton app. We use NextAuth.js with a PostgreSQL database, integrating with Fuse React's authentication patterns.

## Architecture

### 1. Database Connection

We use a server-side-only database connection:

```typescript
// lib/db.ts
const client = process.env.POSTGRES_URL && typeof window === 'undefined' 
    ? postgres(process.env.POSTGRES_URL, { max: 1 })
    : null;

export const db = client ? drizzle(client, { schema }) : null;
```

### 2. User Schema

```typescript
// lib/db/schema.ts
export const user = pgTable('User', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  email: varchar('email', { length: 64 }).notNull(),
  password: varchar('password', { length: 64 }),
  // NextAuth required fields
  emailVerified: timestamp('emailVerified'),
  image: text('image'),
  // Auth fields needed by Fuse
  name: varchar('name', { length: 255 }),
  role: text('role').array().$type<string[]>().default(sql`ARRAY['user']::text[]`),
  displayName: varchar('displayName', { length: 255 }),
  photoURL: varchar('photoURL', { length: 255 }),
  data: json('data').default(sql`'{"shortcuts":[]}'::jsonb`),
  // Timestamps
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow(),
});

export type User = InferSelectModel<typeof user>;
```

### 3. Authentication Flow

1. **Sign In**
   - User submits credentials
   - NextAuth.js handles authentication
   - Database is queried for user data
   - Session is created with user data

2. **Session Management**
   - NextAuth.js manages session state
   - User data is stored in session
   - Role-based access control is enforced

### 4. API Routes

1. **User Management**
   ```typescript
   // app/api/auth/user/[id]/route.ts
   export async function PUT(request: NextRequest) {
       ensureServerSide();
       // ... update user data
   }
   ```

2. **User Creation**
   ```typescript
   // app/api/auth/users/route.ts
   export async function POST(request: NextRequest) {
       ensureServerSide();
       // ... create new user
   }
   ```

3. **User Lookup**
   ```typescript
   // app/api/auth/db/route.ts
   export async function GET(request: NextRequest) {
       ensureServerSide();
       // ... find user by email
   }
   ```

## Environment Setup

Required environment variables:

```env
# Authentication
NEXTAUTH_URL="http://localhost:3001"
NEXTAUTH_SECRET="your-secret-here"

# Database
POSTGRES_URL="postgresql://user:password@host/dbname?sslmode=require"

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

## Best Practices

1. **Server-Side Safety**
   - Use `ensureServerSide()` in all API routes
   - Check database connection availability
   - Handle errors gracefully

2. **Database Operations**
   - Use drizzle-orm for type-safe queries
   - Implement proper error handling
   - Follow database best practices

3. **Authentication**
   - Use NextAuth.js providers
   - Implement proper session handling
   - Follow security best practices

4. **Error Handling**
   - Provide clear error messages
   - Log errors appropriately
   - Handle edge cases

## References

- [NextAuth.js Documentation](https://next-auth.js.org)
- [Drizzle ORM Documentation](https://orm.drizzle.team)
- [Fuse React Documentation](https://fuse-react-nextjs-demo.fusetheme.com/documentation) 