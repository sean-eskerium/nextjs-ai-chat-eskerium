# API Implementation Analysis

## 1. Current State Analysis

### 1.1 Fuse Demo Structure
- `/src/app/api/*` - Next.js API routes
  - Clean separation between auth and mock data routes
  - Uses catch-all routes for flexible handling
  - Minimal logic in route handlers

- `/src/store/apiService.ts` - API service configuration
  - Uses Redux Toolkit's `createApi`
  - Centralized error handling
  - Base query configuration with headers
  - Extensible endpoint structure

- Mock API Implementation
  - Separate `/mock` directory for mock data
  - Clear separation between mock and real endpoints
  - Structured to mimic real API responses

- Model Placement
  - Models defined close to their usage
  - Types and interfaces in feature directories
  - Clear separation between API types and UI types

### 1.2 Our Current Structure
- `/app/api/*` - API routes
  - Mixed concerns (auth, user, db)
  - Multiple route files for similar functionality
  - Complex route handlers with business logic

- `/lib/db/*` - Database logic
  - Schema definitions
  - Direct database access
  - Mixed with API logic

- `/store/apiService.ts` - API service
  - Similar base configuration to demo
  - Lacks endpoint definitions
  - Error handling not fully implemented

- Models and Types
  - Spread across multiple locations
  - Duplicate definitions
  - Inconsistent usage

### 1.3 Key Differences
- Mock vs Real Database
  - Demo uses mock data for simplicity
  - We have real database integration
  - Different error handling needs

- Route Organization
  - Demo has cleaner separation
  - Our routes mix concerns
  - Authentication handling differs

- Model Placement
  - Demo keeps models with features
  - We have scattered model definitions
  - Type inconsistencies

- API Service Usage
  - Demo has more structured approach
  - Our implementation is incomplete
  - Error handling differences

### 1.4 Current Pain Points
1. **Route Organization**
   - No clear separation between API concerns
   - Mixed business logic in route handlers
   - Duplicate route handling

2. **Model Management**
   - Inconsistent model definitions
   - Type safety issues
   - Scattered business logic

3. **API Service**
   - Incomplete implementation
   - Missing error handling
   - No standardized response format

4. **Database Integration**
   - Direct database access in routes
   - No clear service layer
   - Mixed concerns in data access

## 2. Fuse Documentation Analysis

### 2.1 API Configuration
[Reference: Fuse API Configuration](https://fuse-react-nextjs-demo.fusetheme.com/documentation/development/api-integration/api-configuration)

#### Core Configuration
- Uses Redux Toolkit's `createApi` for API management
- Centralized configuration in `apiService.ts`
- Base URL and headers management
- Global error handling setup

#### Key Principles
1. **Centralized Service**
   - Single source for API configuration
   - Consistent error handling
   - Standardized request/response processing

2. **Type Safety**
   - Strong typing for requests and responses
   - Interface definitions for API models
   - Runtime type checking

3. **Error Management**
   - Global error interceptors
   - HTTP status code handling
   - Custom error responses

#### Integration Points
1. **Store Integration**
   ```typescript
   // Integration with Redux store
   export const apiService = createApi({
     baseQuery,
     endpoints: () => ({}),
     reducerPath: 'apiService'
   });
   ```

2. **Request Configuration**
   ```typescript
   // Base query configuration
   const baseQuery = fetchBaseQuery({
     baseUrl: API_BASE_URL,
     prepareHeaders: (headers) => {
       // Header configuration
     }
   });
   ```

### 2.2 Mock API System
[Reference: Fuse Mock API](https://fuse-react-nextjs-demo.fusetheme.com/documentation/development/api-integration/mock-api)

#### Structure
1. **Route Organization**
   ```
   /api
     /mock
       /[feature]
         /[endpoint].ts
     /auth
       /[...nextauth]
   ```

2. **Data Organization**
   ```
   /mock-data
     /[feature]
       data.ts
       types.ts
   ```

#### Implementation Strategy
1. **Mock Data**
   - Separate mock data files
   - Type-safe mock objects
   - Realistic data structures

2. **Response Handling**
   - Simulated delays
   - Error scenarios
   - Pagination support

3. **API Consistency**
   - Match real API structure
   - Consistent response formats
   - Error handling patterns

#### Key Features
1. **Development Support**
   - Easy switching between mock/real
   - Development-only routes
   - Debug helpers

2. **Type System**
   - Shared types with real API
   - Runtime type validation
   - Documentation through types

### 2.3 Real API Integration
From the documentation, when connecting to a real backend:

1. **Route Structure**
   ```typescript
   // Example API route
   export async function GET(request: Request) {
     try {
       // API logic
       return NextResponse.json(data);
     } catch (error) {
       return NextResponse.json(
         { error: 'Error message' },
         { status: error.status || 500 }
       );
     }
   }
   ```

2. **Service Layer**
   ```typescript
   // Service pattern
   export class ApiService {
     async getData() {
       // Data access logic
     }
   }
   ```

3. **Error Handling**
   ```typescript
   // Error handling pattern
   export class ApiError extends Error {
     constructor(
       message: string,
       public status: number,
       public code?: string
     ) {
       super(message);
     }
   }
   ```

### 2.4 Key Takeaways
1. **Architecture**
   - Clear separation of concerns
   - Consistent patterns
   - Type-safe approach

2. **Development**
   - Easy to maintain
   - Scalable structure
   - Good developer experience

3. **Integration**
   - Flexible for different backends
   - Strong typing support
   - Consistent error handling

## 3. Next.js Best Practices

### 3.1 Route Handlers (App Router)
1. **Directory Structure**
   ```
   /app
     /api
       /v1
         /route.ts        # Base API handler
         /[...slug]/route.ts  # Catch-all handler
         /auth/[...nextauth]/route.ts  # Auth handler
   ```

2. **Handler Patterns**
   ```typescript
   // Modern route handler pattern
   export async function GET(request: Request) {
     // Route segment config
     export const runtime = 'edge' // 'nodejs' | 'edge'
     export const dynamic = 'force-dynamic' // 'auto' | 'force-static'
   }
   ```

3. **Response Handling**
   ```typescript
   // Standardized responses
   import { NextResponse } from 'next/server'
   
   export async function GET() {
     try {
       return NextResponse.json(
         { data: result },
         { status: 200 }
       )
     } catch (error) {
       return NextResponse.json(
         { error: error.message },
         { status: error.statusCode ?? 500 }
       )
     }
   }
   ```

### 3.2 Data Access Patterns

1. **Server Components**
   ```typescript
   // Direct database access in Server Components
   async function DataComponent() {
     const data = await db.query.users.findMany()
     return <div>{/* Render data */}</div>
   }
   ```

2. **API Routes**
   ```typescript
   // API route with service layer
   export async function GET() {
     const service = new UserService()
     const data = await service.getUsers()
     return NextResponse.json(data)
   }
   ```

3. **Database Interactions**
   ```typescript
   // Service layer pattern
   export class DatabaseService {
     private db: Database
     
     async query() {
       // Connection handling
       // Query execution
       // Error handling
     }
   }
   ```

### 3.3 Middleware Handling

1. **Route Protection**
   ```typescript
   // Middleware for API routes
   export function middleware(request: NextRequest) {
     if (request.nextUrl.pathname.startsWith('/api/')) {
       // API-specific middleware
     }
   }
   ```

2. **Error Handling**
   ```typescript
   // Global error handling
   export function errorHandler(error: Error) {
     if (error instanceof DatabaseError) {
       // Handle database errors
     }
     // Handle other errors
   }
   ```

3. **Authentication**
   ```typescript
   // Auth middleware
   export const config = {
     matcher: ['/api/:path*']
   }
   ```

### 3.4 Performance Considerations

1. **Caching**
   ```typescript
   // Route segment config
   export const revalidate = 3600 // Revalidate every hour
   ```

2. **Edge Runtime**
   ```typescript
   // Edge-optimized API routes
   export const runtime = 'edge'
   ```

3. **Dynamic vs Static**
   ```typescript
   // Force dynamic rendering
   export const dynamic = 'force-dynamic'
   ```

### 3.5 Type Safety

1. **Request Types**
   ```typescript
   // Type-safe request handling
   interface ApiRequest extends Request {
     json<T>(): Promise<T>
   }
   ```

2. **Response Types**
   ```typescript
   // Type-safe responses
   interface ApiResponse<T> {
     data?: T
     error?: string
     status: number
   }
   ```

3. **Validation**
   ```typescript
   // Request validation
   import { z } from 'zod'
   
   const schema = z.object({
     // Schema definition
   })
   ```

### 3.6 Key Next.js 13+ Features to Leverage

1. **Server Components**
   - Default server-side rendering
   - Direct database access
   - Reduced client bundle

2. **Route Handlers**
   - Modern API routes
   - Better type safety
   - Improved performance

3. **Middleware**
   - Flexible routing
   - Enhanced security
   - Better error handling

## 4. Proposed Architecture

### 4.1 Directory Structure
```
/src
  /app
    /api              # Next.js API Routes (thin handlers)
      /v1             # Version control
        /auth         # Auth-related routes
        /users        # User-related routes
        /[other]      # Other domain routes
  /server            # Server-side code
    /api             # API logic
      /handlers      # Route handlers
      /middleware    # API middleware
      /validation    # Request validation
    /db              # Database
      /models        # Database models
      /migrations    # Database migrations
      /schema        # Schema definitions
    /services        # Business logic
      /auth          # Auth service
      /users         # User service
      /[other]       # Other services
  /store             # Client-side state
    /api             # API integration
      /services      # API services
      /hooks         # API hooks
```

### 4.2 Implementation Examples

#### 4.2.1 Route Handler (Next.js App Router)
```typescript
// /src/app/api/v1/users/[id]/route.ts
import { NextResponse } from 'next/server'
import { UserHandler } from '@/server/api/handlers/userHandler'
import { withErrorHandling } from '@/server/api/middleware/errorMiddleware'

export const GET = withErrorHandling(async (
  request: Request,
  { params }: { params: { id: string } }
) => {
  const handler = new UserHandler()
  const user = await handler.getUser(params.id)
  return NextResponse.json({ data: user })
})
```

#### 4.2.2 API Handler Layer
```typescript
// /src/server/api/handlers/userHandler.ts
import { UserService } from '@/server/services/users/userService'
import { ApiError } from '@/server/api/errors'
import { UserValidator } from '@/server/api/validation/userValidator'

export class UserHandler {
  private service: UserService
  private validator: UserValidator

  constructor() {
    this.service = new UserService()
    this.validator = new UserValidator()
  }

  async getUser(id: string) {
    this.validator.validateId(id)
    const user = await this.service.findById(id)
    if (!user) {
      throw new ApiError('User not found', 404)
    }
    return user
  }
}
```

#### 4.2.3 Service Layer
```typescript
// /src/server/services/users/userService.ts
import { db } from '@/server/db'
import { User } from '@/server/db/models/user'
import { DatabaseError } from '@/server/db/errors'

export class UserService {
  async findById(id: string): Promise<User | null> {
    try {
      return await db.query.users.findFirst({
        where: { id }
      })
    } catch (error) {
      throw new DatabaseError('Database query failed', error)
    }
  }

  async create(data: Omit<User, 'id'>): Promise<User> {
    try {
      return await db.insert(users).values(data)
    } catch (error) {
      throw new DatabaseError('Failed to create user', error)
    }
  }
}
```

#### 4.2.4 Validation Layer
```typescript
// /src/server/api/validation/userValidator.ts
import { z } from 'zod'
import { ValidationError } from '@/server/api/errors'

export class UserValidator {
  private idSchema = z.string().uuid()
  private createSchema = z.object({
    email: z.string().email(),
    displayName: z.string().min(2)
  })

  validateId(id: string) {
    const result = this.idSchema.safeParse(id)
    if (!result.success) {
      throw new ValidationError('Invalid user ID format')
    }
  }

  validateCreate(data: unknown) {
    const result = this.createSchema.safeParse(data)
    if (!result.success) {
      throw new ValidationError('Invalid user data', result.error)
    }
    return result.data
  }
}
```

#### 4.2.5 Error Handling
```typescript
// /src/server/api/middleware/errorMiddleware.ts
import { NextResponse } from 'next/server'
import {
  ApiError,
  ValidationError,
  DatabaseError
} from '@/server/api/errors'

export function withErrorHandling(handler: Function) {
  return async (...args: any[]) => {
    try {
      return await handler(...args)
    } catch (error) {
      if (error instanceof ValidationError) {
        return NextResponse.json(
          { error: error.message, details: error.details },
          { status: 400 }
        )
      }
      if (error instanceof DatabaseError) {
        return NextResponse.json(
          { error: 'Internal server error' },
          { status: 500 }
        )
      }
      if (error instanceof ApiError) {
        return NextResponse.json(
          { error: error.message },
          { status: error.status }
        )
      }
      return NextResponse.json(
        { error: 'Unexpected error occurred' },
        { status: 500 }
      )
    }
  }
}
```

#### 4.2.6 Client-Side Integration
```typescript
// /src/store/api/services/userApiService.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { User } from '@/server/db/models/user'

export const userApi = createApi({
  reducerPath: 'userApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/v1' }),
  endpoints: (builder) => ({
    getUser: builder.query<User, string>({
      query: (id) => `users/${id}`
    }),
    createUser: builder.mutation<User, Omit<User, 'id'>>({
      query: (data) => ({
        url: 'users',
        method: 'POST',
        body: data
      })
    })
  })
})

export const {
  useGetUserQuery,
  useCreateUserMutation
} = userApi
```

### 4.3 Key Benefits

1. **Clean Separation of Concerns**
   - Route handlers only handle HTTP concerns
   - Business logic isolated in services
   - Validation separate from business logic
   - Clear error handling boundaries

2. **Type Safety**
   - Full TypeScript support
   - Zod validation
   - Consistent error types
   - Type-safe API responses

3. **Maintainability**
   - Modular architecture
   - Easy to test
   - Clear dependency flow
   - Consistent patterns

4. **Scalability**
   - Easy to add new routes
   - Reusable components
   - Version control ready
   - Performance optimizations

## 5. Implementation Strategy

### 5.1 Phase 1: Foundation Setup (Week 1)

#### 5.1.1 Base API Service (Day 1-2)
1. Create base API service structure:
   ```typescript
   // /src/store/api/baseApi.ts
   import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
   
   export const baseApi = createApi({
     reducerPath: 'api',
     baseQuery: fetchBaseQuery({
       baseUrl: '/api/v1',
       credentials: 'include',
       headers: {
         'Content-Type': 'application/json'
       }
     }),
     endpoints: () => ({})
   })
   ```

2. Set up error handling middleware:
   ```typescript
   // /src/server/api/middleware/errorMiddleware.ts
   import { ApiError, ValidationError } from '../errors'
   
   export const errorMiddleware = async (error: unknown) => {
     if (error instanceof ValidationError) {
       return { status: 400, body: { error: error.message } }
     }
     // ... other error types
   }
   ```

#### 5.1.2 Model Structure (Day 2-3)
1. Define base interfaces:
   ```typescript
   // /src/server/db/models/base.ts
   export interface BaseModel {
     id: string
     createdAt: Date
     updatedAt: Date
   }
   ```

2. Create model definitions:
   ```typescript
   // /src/server/db/models/user.ts
   import { BaseModel } from './base'
   
   export interface User extends BaseModel {
     email: string
     displayName: string
     // ... other fields
   }
   ```

#### 5.1.3 Handler Templates (Day 3-4)
1. Create base handler class:
   ```typescript
   // /src/server/api/handlers/baseHandler.ts
   export abstract class BaseHandler {
     protected abstract validate(data: unknown): void
     protected abstract execute(data: unknown): Promise<unknown>
   }
   ```

2. Implement specific handlers:
   ```typescript
   // /src/server/api/handlers/userHandler.ts
   export class UserHandler extends BaseHandler {
     // Implementation
   }
   ```

### 5.2 Phase 2: Migration (Week 2)

#### 5.2.1 Route Migration (Day 1-2)
1. Create new route structure:
   ```
   /src/app/api/v1
     /auth
       /[...nextauth]/route.ts
     /users
       /route.ts
       /[id]/route.ts
   ```

2. Implement route handlers:
   ```typescript
   // /src/app/api/v1/users/route.ts
   import { UserHandler } from '@/server/api/handlers/userHandler'
   
   export async function GET() {
     const handler = new UserHandler()
     return handler.handleRequest()
   }
   ```

#### 5.2.2 Database Access (Day 3)
1. Create database service:
   ```typescript
   // /src/server/db/service.ts
   export class DatabaseService {
     async transaction<T>(fn: () => Promise<T>): Promise<T> {
       // Transaction handling
     }
   }
   ```

2. Implement repositories:
   ```typescript
   // /src/server/db/repositories/userRepository.ts
   export class UserRepository {
     async findById(id: string): Promise<User | null> {
       // Implementation
     }
   }
   ```

#### 5.2.3 Service Implementation (Day 4-5)
1. Create service interfaces:
   ```typescript
   // /src/server/services/interfaces/userService.ts
   export interface IUserService {
     findById(id: string): Promise<User | null>
     create(data: CreateUserDto): Promise<User>
   }
   ```

2. Implement services:
   ```typescript
   // /src/server/services/userService.ts
   export class UserService implements IUserService {
     // Implementation
   }
   ```

### 5.3 Phase 3: Enhancement (Week 3)

#### 5.3.1 Validation (Day 1-2)
1. Create validation schemas:
   ```typescript
   // /src/server/api/validation/schemas/user.ts
   import { z } from 'zod'
   
   export const userSchema = z.object({
     email: z.string().email(),
     displayName: z.string().min(2)
   })
   ```

2. Implement validators:
   ```typescript
   // /src/server/api/validation/userValidator.ts
   export class UserValidator {
     validate(data: unknown) {
       return userSchema.parse(data)
     }
   }
   ```

#### 5.3.2 Error Handling (Day 2-3)
1. Define error types:
   ```typescript
   // /src/server/api/errors/index.ts
   export class ApiError extends Error {
     constructor(message: string, public status: number) {
       super(message)
     }
   }
   ```

2. Implement error middleware:
   ```typescript
   // /src/server/api/middleware/errorHandler.ts
   export const errorHandler = (error: unknown) => {
     // Error handling logic
   }
   ```

#### 5.3.3 Documentation (Day 4)
1. API Documentation:
   ```typescript
   // /src/app/api/v1/users/route.ts
   /**
    * @api {get} /api/v1/users Get Users
    * @apiName GetUsers
    * @apiGroup Users
    * @apiSuccess {Object[]} users List of users
    */
   ```

2. Type Documentation:
   ```typescript
   // /src/server/db/models/user.ts
   /**
    * Represents a user in the system
    * @interface User
    * @extends {BaseModel}
    */
   export interface User extends BaseModel {
     // ...
   }
   ```

#### 5.3.4 Testing (Day 5)
1. Unit Tests:
   ```typescript
   // /src/server/services/__tests__/userService.test.ts
   describe('UserService', () => {
     it('should create user', async () => {
       // Test implementation
     })
   })
   ```

2. Integration Tests:
   ```typescript
   // /src/app/api/v1/users/__tests__/route.test.ts
   describe('Users API', () => {
     it('should return users', async () => {
       // Test implementation
     })
   })
   ```

### 5.4 Test-Driven Rollout Plan

#### Phase 1: API Foundation (Week 1)
1. **Base Error Types & Middleware** (Day 1)
   - Create error classes
   - Implement error middleware
   - Write tests for error handling
   - ✓ Test: Error middleware correctly handles different error types
   - 🔒 Commit: "Add error handling foundation"

2. **Base Model Structure** (Day 1-2)
   - Create base model interfaces
   - Implement user model
   - Write model validation tests
   - ✓ Test: Models properly validate data
   - 🔒 Commit: "Add base model structure"

3. **Base API Service** (Day 2-3)
   - Set up Redux Toolkit base configuration
   - Implement base query setup
   - Write API service tests
   - ✓ Test: Base API configuration works with mock endpoints
   - 🔒 Commit: "Add base API service"

4. **Handler Templates** (Day 3-4)
   - Create base handler class
   - Implement user handler
   - Write handler tests
   - ✓ Test: Handlers properly process requests
   - 🔒 Commit: "Add handler templates"

5. **Integration Test** (Day 5)
   - Test all Phase 1 components together
   - Fix any integration issues
   - ✓ Test: Complete flow from API call to response
   - 🔒 Commit: "Phase 1 integration complete"

#### Phase 2: Route Implementation (Week 2)
1. **Auth Routes** (Day 1)
   - Implement auth routes
   - Write auth route tests
   - ✓ Test: Auth flow works end-to-end
   - 🔒 Commit: "Add auth routes"

2. **User Routes** (Day 2)
   - Implement user CRUD routes
   - Write user route tests
   - ✓ Test: User operations work end-to-end
   - 🔒 Commit: "Add user routes"

3. **Database Layer** (Day 3-4)
   - Implement database service
   - Create repositories
   - Write database tests
   - ✓ Test: Database operations work correctly
   - 🔒 Commit: "Add database layer"

4. **Service Layer** (Day 4-5)
   - Implement service interfaces
   - Create concrete services
   - Write service tests
   - ✓ Test: Services properly handle business logic
   - 🔒 Commit: "Add service layer"

5. **Integration Test** (Day 5)
   - Test all Phase 2 components together
   - Verify database operations
   - ✓ Test: Complete flow from route to database
   - 🔒 Commit: "Phase 2 integration complete"

#### Phase 3: Enhancement & Security (Week 3)
1. **Validation Layer** (Day 1)
   - Implement Zod schemas
   - Create validators
   - Write validation tests
   - ✓ Test: Input validation works correctly
   - 🔒 Commit: "Add validation layer"

2. **Security Middleware** (Day 2)
   - Implement auth checks
   - Add rate limiting
   - Write security tests
   - ✓ Test: Security measures work properly
   - 🔒 Commit: "Add security middleware"

3. **Error Enhancement** (Day 3)
   - Improve error messages
   - Add error logging
   - Write error handling tests
   - ✓ Test: Enhanced error handling works
   - 🔒 Commit: "Enhance error handling"

4. **Documentation** (Day 4)
   - Add API documentation
   - Write type documentation
   - Generate API docs
   - ✓ Test: Documentation is accurate
   - 🔒 Commit: "Add documentation"

5. **Final Integration** (Day 5)
   - End-to-end testing
   - Performance testing
   - Load testing
   - ✓ Test: System meets all requirements
   - 🔒 Commit: "Final integration complete"

### Testing Checkpoints

Each phase has specific testing requirements that must pass before moving to the next phase:

#### Phase 1 Checkpoints
- [ ] Error middleware handles all error types
- [ ] Models validate correctly
- [ ] API service configuration works
- [ ] Handlers process requests properly
- [ ] Phase 1 integration tests pass

#### Phase 2 Checkpoints
- [ ] Auth routes work end-to-end
- [ ] User routes handle CRUD operations
- [ ] Database operations work correctly
- [ ] Services handle business logic
- [ ] Phase 2 integration tests pass

#### Phase 3 Checkpoints
- [ ] Input validation catches all cases
- [ ] Security measures prevent unauthorized access
- [ ] Error handling provides useful feedback
- [ ] Documentation matches implementation
- [ ] Final integration tests pass

### Git Workflow

Each commit should:
1. Include relevant tests
2. Pass all existing tests
3. Include documentation updates
4. Have a clear commit message
5. Tag major phase completions

## 6. Considerations

### 6.1 Separation of Concerns
- Clear boundaries between layers
- Independent API changes
- UI/API separation

### 6.2 Scalability
- Easy to add new routes
- Simple to maintain
- Clear patterns to follow

### 6.3 Database Integration
- Clean database access
- Type safety
- Migration handling

### 6.4 Authentication
- Proper auth flow
- Security considerations
- Session handling

## 7. Next Steps

1. Review this analysis
2. Decide on structure
3. Create implementation plan
4. Begin phased implementation

## 8. Questions to Resolve

1. Location of models: `/server/db/models` vs `/lib/models`
2. API versioning strategy
3. Mock data handling for development
4. Testing strategy 