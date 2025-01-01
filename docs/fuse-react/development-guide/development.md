# Fuse React Development Guide

## Development Environment Setup

### Prerequisites
1. **Node.js Environment**
   - Node.js 18+ installed
   - npm or yarn package manager
   - Git for version control

2. **IDE Configuration**
   - VSCode recommended
   - Required extensions:
     - ESLint
     - Prettier
     - Tailwind CSS IntelliSense
     - TypeScript support

### Initial Setup

```bash
# Clone the repository
git clone [repository-url]

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Start development server
npm run dev
```

## Project Structure

### Core Directories
```
.
├── @auth                  # Authentication configuration
├── @fuse                  # Fuse core components
├── @i18n                  # Internationalization
├── app/                   # Next.js App Router
│   ├── (control-panel)    # Main application routes
│   ├── api               # API routes
│   └── auth             # Auth routes
├── components           # Reusable components
└── lib/                # Utilities and services
```

### Key Files
- `app/layout.tsx`: Root layout component
- `app/page.tsx`: Entry point
- `middleware.ts`: Request middleware
- `tailwind.config.js`: Styling configuration
- `next.config.js`: Next.js configuration

## Component Development

### Component Structure
```typescript
// components/MyComponent.tsx
import { useState, useEffect } from 'react'
import type { FC } from 'react'

interface MyComponentProps {
  title: string
  onAction: () => void
}

export const MyComponent: FC<MyComponentProps> = ({ title, onAction }) => {
  // Component logic
  return (
    <div className="my-component">
      {/* Component JSX */}
    </div>
  )
}
```

### Styling Guidelines
1. **TailwindCSS Usage**
```typescript
// Preferred approach
<div className="flex items-center justify-between p-4">

// For complex styles
const complexStyles = {
  wrapper: 'flex flex-col space-y-4 p-6',
  header: 'text-2xl font-bold text-primary',
  content: 'prose dark:prose-invert'
}
```

2. **Theme Configuration**
```typescript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {...},
        secondary: {...}
      }
    }
  }
}
```

## Routing and Navigation

### Route Groups
```typescript
// app/(control-panel)/layout.tsx
export default function ControlPanelLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <div className="control-panel-layout">
      <Sidebar />
      <main>{children}</main>
    </div>
  )
}
```

### Navigation Configuration
```typescript
// configs/navigation.ts
export const navigationConfig = {
  main: [
    {
      id: 'dashboard',
      title: 'Dashboard',
      type: 'item',
      icon: 'heroicons-outline:home',
      url: '/dashboard'
    }
  ]
}
```

## State Management

### Redux Setup
```typescript
// store/index.ts
import { configureStore } from '@reduxjs/toolkit'
import userReducer from './userSlice'

export const store = configureStore({
  reducer: {
    user: userReducer
  }
})
```

### Context Usage
```typescript
// contexts/ThemeContext.tsx
export const ThemeContext = createContext({
  theme: 'light',
  toggleTheme: () => {}
})

export function ThemeProvider({ children }) {
  // Provider implementation
}
```

## Authentication

### Protected Routes
```typescript
// middleware.ts
import { withAuth } from 'next-auth/middleware'

export default withAuth({
  callbacks: {
    authorized: ({ token }) => !!token
  }
})

export const config = {
  matcher: ['/protected/:path*']
}
```

### Auth Configuration
```typescript
// @auth/config.ts
import type { AuthConfig } from 'next-auth'

export const authConfig: AuthConfig = {
  pages: {
    signIn: '/login',
    error: '/error'
  },
  callbacks: {
    // Auth callbacks
  }
}
```

## Internationalization

### Translation Setup
```typescript
// @i18n/settings.ts
export const i18n = {
  defaultLocale: 'en',
  locales: ['en', 'es', 'fr']
}
```

### Usage in Components
```typescript
import { useTranslations } from 'next-intl'

export function MyComponent() {
  const t = useTranslations()
  return <h1>{t('title')}</h1>
}
```

## Testing

### Component Testing
```typescript
// __tests__/MyComponent.test.tsx
import { render, screen } from '@testing-library/react'
import { MyComponent } from '@/components/MyComponent'

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />)
    expect(screen.getByRole('heading')).toBeInTheDocument()
  })
})
```

### API Testing
```typescript
// __tests__/api/endpoint.test.ts
import { createMocks } from 'node-mocks-http'
import handler from '@/app/api/endpoint/route'

describe('API Endpoint', () => {
  it('handles requests correctly', async () => {
    const { req, res } = createMocks({
      method: 'GET'
    })
    await handler(req, res)
    expect(res._getStatusCode()).toBe(200)
  })
})
```

## Performance Optimization

### Image Optimization
```typescript
import Image from 'next/image'

export function OptimizedImage() {
  return (
    <Image
      src="/image.jpg"
      alt="Description"
      width={800}
      height={600}
      placeholder="blur"
    />
  )
}
```

### Code Splitting
```typescript
import dynamic from 'next/dynamic'

const DynamicComponent = dynamic(() => import('./Heavy'), {
  loading: () => <p>Loading...</p>
})
```

## Deployment

### Build Process
```bash
# Production build
npm run build

# Type checking
npm run type-check

# Linting
npm run lint
```

### Environment Variables
```env
# .env.production
NEXT_PUBLIC_API_URL=https://api.example.com
AUTH_SECRET=your-secret
```

## Error Handling

### Global Error Boundary
```typescript
// app/error.tsx
'use client'

export default function Error({
  error,
  reset
}: {
  error: Error
  reset: () => void
}) {
  return (
    <div className="error-container">
      <h2>Something went wrong!</h2>
      <button onClick={() => reset()}>Try again</button>
    </div>
  )
}
```

### API Error Handling
```typescript
// lib/api-helpers.ts
export async function handleApiError(error: unknown) {
  console.error(error)
  return new Response(
    JSON.stringify({
      error: 'Internal Server Error'
    }),
    { status: 500 }
  )
}
``` 