# Error Handling in Vercel AI SDK

## Overview

Proper error handling is crucial for AI-powered applications. The Vercel AI SDK provides comprehensive error handling capabilities for both client and server-side scenarios.

## Error Types

### 1. AI SDK Errors

```typescript
// lib/errors/ai-errors.ts
export class AIError extends Error {
  constructor(
    message: string,
    public code: string,
    public status?: number
  ) {
    super(message)
    this.name = 'AIError'
  }
}

export class ModelError extends AIError {
  constructor(message: string) {
    super(message, 'MODEL_ERROR', 500)
  }
}

export class RateLimitError extends AIError {
  constructor(message: string) {
    super(message, 'RATE_LIMIT', 429)
  }
}

export class ValidationError extends AIError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400)
  }
}
```

### 2. Stream Errors

```typescript
// lib/errors/stream-errors.ts
export class StreamError extends Error {
  constructor(
    message: string,
    public chunk?: unknown
  ) {
    super(message)
    this.name = 'StreamError'
  }
}
```

## Error Handling Implementation

### 1. API Route Error Handling

```typescript
// app/api/chat/route.ts
import { OpenAIStream, StreamingTextResponse } from 'ai'
import OpenAI from 'openai'
import {
  AIError,
  ModelError,
  RateLimitError
} from '@/lib/errors/ai-errors'

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()
    
    if (!messages) {
      throw new ValidationError('Messages are required')
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        stream: true,
        messages
      })

      const stream = OpenAIStream(response)
      return new StreamingTextResponse(stream)
    } catch (error) {
      if (error.code === 'rate_limit_exceeded') {
        throw new RateLimitError('Rate limit exceeded')
      }
      throw new ModelError(error.message)
    }
  } catch (error) {
    if (error instanceof AIError) {
      return new Response(
        JSON.stringify({
          error: error.message,
          code: error.code
        }),
        { status: error.status }
      )
    }

    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      }),
      { status: 500 }
    )
  }
}
```

### 2. Client-Side Error Handling

```typescript
// components/chat/ErrorHandlingChat.tsx
import { useChat } from 'ai/react'
import { useState } from 'react'

export function ErrorHandlingChat() {
  const [error, setError] = useState<Error | null>(null)

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit
  } = useChat({
    onError: (error) => {
      setError(error)
      console.error('Chat error:', error)
    }
  })

  if (error) {
    return (
      <div className="error-container">
        <h3>Error Occurred</h3>
        <p>{error.message}</p>
        <button onClick={() => setError(null)}>
          Dismiss
        </button>
      </div>
    )
  }

  return (
    <div className="chat-container">
      {/* Chat UI implementation */}
    </div>
  )
}
```

### 3. Stream Error Handling

```typescript
// lib/streams/error-handling.ts
import { experimental_StreamData } from 'ai'

export function createErrorHandlingStream(
  baseStream: ReadableStream
) {
  const data = new experimental_StreamData()
  
  return new ReadableStream({
    async start(controller) {
      const reader = baseStream.getReader()
      
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          
          try {
            validateChunk(value)
            controller.enqueue(value)
          } catch (error) {
            data.append({
              error: {
                message: error.message,
                timestamp: Date.now()
              }
            })
            controller.error(error)
            break
          }
        }
        controller.close()
      } catch (error) {
        controller.error(error)
      }
    }
  })
}
```

## Error Recovery Strategies

### 1. Retry Logic

```typescript
// lib/utils/retry.ts
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number
    delay?: number
    shouldRetry?: (error: Error) => boolean
  } = {}
) {
  const {
    maxAttempts = 3,
    delay = 1000,
    shouldRetry = () => true
  } = options

  let lastError: Error

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      if (
        attempt === maxAttempts ||
        !shouldRetry(error)
      ) {
        throw error
      }

      await new Promise(resolve =>
        setTimeout(resolve, delay * attempt)
      )
    }
  }

  throw lastError
}
```

### 2. Fallback Content

```typescript
// components/chat/FallbackContent.tsx
export function FallbackContent({
  error,
  retry
}: {
  error: Error
  retry: () => void
}) {
  return (
    <div className="fallback">
      <p>Unable to load chat: {error.message}</p>
      <button onClick={retry}>
        Try Again
      </button>
      <div className="static-content">
        {/* Fallback static content */}
      </div>
    </div>
  )
}
```

### 3. Error Boundaries

```typescript
// components/error-boundary/AIErrorBoundary.tsx
import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback: ReactNode
  onError?: (error: Error) => void
}

interface State {
  hasError: boolean
  error: Error | null
}

export class AIErrorBoundary extends Component<Props, State> {
  state = {
    hasError: false,
    error: null
  }

  static getDerivedStateFromError(error: Error) {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error) {
    this.props.onError?.(error)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback
    }

    return this.props.children
  }
}
```

## Best Practices

### 1. Error Logging

```typescript
// lib/logging/error-logger.ts
interface ErrorLog {
  message: string
  code: string
  timestamp: number
  context?: Record<string, unknown>
}

export async function logError(
  error: Error,
  context?: Record<string, unknown>
) {
  const errorLog: ErrorLog = {
    message: error.message,
    code: error instanceof AIError ? error.code : 'UNKNOWN',
    timestamp: Date.now(),
    context
  }

  // Log to your preferred service
  console.error('AI Error:', errorLog)
}
```

### 2. User Feedback

```typescript
// components/feedback/ErrorFeedback.tsx
export function ErrorFeedback({
  error,
  onSubmit
}: {
  error: Error
  onSubmit: (feedback: string) => void
}) {
  return (
    <div className="error-feedback">
      <h4>Help Us Improve</h4>
      <p>
        We encountered an error: {error.message}
      </p>
      <textarea
        placeholder="What were you trying to do?"
        onChange={(e) => onSubmit(e.target.value)}
      />
    </div>
  )
}
```

### 3. Error Prevention

```typescript
// lib/validation/input-validation.ts
import { z } from 'zod'

const MessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1).max(4000)
})

export function validateInput(input: unknown) {
  try {
    return MessageSchema.parse(input)
  } catch (error) {
    throw new ValidationError(
      'Invalid message format: ' + error.message
    )
  }
}
``` 