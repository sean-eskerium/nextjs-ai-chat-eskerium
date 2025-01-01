# Next.js App Router

## Overview

Learn how to use the Vercel AI SDK with Next.js App Router.

## Installation

```bash
npm install ai openai@^4.0.0
```

## Basic Setup

### 1. API Route

```typescript
// app/api/chat/route.ts
import OpenAI from 'openai'
import { OpenAIStream, StreamingTextResponse } from 'ai'

// Create an OpenAI API client (that's edge friendly!)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

// IMPORTANT! Set the runtime to edge
export const runtime = 'edge'

export async function POST(req: Request) {
  // Extract the `messages` from the body of the request
  const { messages } = await req.json()

  // Request the OpenAI API for the response
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    stream: true,
    messages: messages
  })

  // Convert the response into a friendly text-stream
  const stream = OpenAIStream(response)

  // Respond with the stream
  return new StreamingTextResponse(stream)
}
```

### 2. React Component

```typescript
// app/page.tsx
'use client'

import { useChat } from 'ai/react'

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit } = useChat()

  return (
    <div className="mx-auto w-full max-w-md py-24 flex flex-col stretch">
      {messages.map(m => (
        <div key={m.id} className="whitespace-pre-wrap">
          {m.role === 'user' ? 'User: ' : 'AI: '}
          {m.content}
        </div>
      ))}

      <form onSubmit={handleSubmit}>
        <input
          className="fixed w-full max-w-md bottom-0 border border-gray-300 rounded mb-8 shadow-xl p-2"
          value={input}
          placeholder="Say something..."
          onChange={handleInputChange}
        />
      </form>
    </div>
  )
}
```

## Advanced Features

### 1. Custom Stream Processing

```typescript
// app/api/chat/route.ts
import { OpenAIStream, StreamingTextResponse } from 'ai'
import OpenAI from 'openai'

export const runtime = 'edge'

export async function POST(req: Request) {
  const { messages } = await req.json()
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!
  })

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    stream: true,
    messages: messages,
    temperature: 0.7,
    max_tokens: 500
  })

  const stream = OpenAIStream(response, {
    async onCompletion(completion) {
      // Store in database, etc...
      await saveToDatabase(completion)
    },
    onToken(token) {
      // Process individual tokens
      console.log(token)
    },
    experimental_streamData: true
  })

  return new StreamingTextResponse(stream)
}
```

### 2. Function Calling

```typescript
// app/api/chat/route.ts
import OpenAI from 'openai'
import { OpenAIStream, StreamingTextResponse } from 'ai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
})

export async function POST(req: Request) {
  const { messages } = await req.json()

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    stream: true,
    messages,
    functions: [
      {
        name: 'get_weather',
        description: 'Get the weather for a location',
        parameters: {
          type: 'object',
          properties: {
            location: {
              type: 'string',
              description: 'The location to get the weather for'
            }
          },
          required: ['location']
        }
      }
    ]
  })

  const stream = OpenAIStream(response, {
    async experimental_onFunctionCall(functionCall) {
      // Call your function here...
      const result = await getWeather(functionCall.arguments.location)
      
      // Return the result to the model
      return JSON.stringify(result)
    }
  })

  return new StreamingTextResponse(stream)
}
```

### 3. Middleware Integration

```typescript
// middleware.ts
import { createMiddleware } from 'ai/middleware'

export const middleware = createMiddleware({
  // Optionally, you can implement your own token hashing function
  // By default, the middleware will use a simple hashing function
  // that concatenates the token with your secret and hashes it with SHA-256
  hashToken(token: string, secret: string) {
    return require('crypto')
      .createHash('sha256')
      .update(token + secret)
      .digest('hex')
  }
})

export const config = {
  matcher: '/api/chat'
}
```

## UI Components

### 1. Chat Component

```typescript
// components/Chat.tsx
'use client'

import { useChat } from 'ai/react'
import { useEffect, useRef } from 'react'

export function Chat() {
  const { messages, input, handleInputChange, handleSubmit } = useChat()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map(m => (
          <div
            key={m.id}
            className={`mb-4 ${
              m.role === 'user' ? 'text-right' : 'text-left'
            }`}
          >
            <div
              className={`inline-block p-2 rounded-lg ${
                m.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="border-t p-4"
      >
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Say something..."
          className="w-full p-2 border rounded"
        />
      </form>
    </div>
  )
}
```

### 2. Completion Component

```typescript
// components/Completion.tsx
'use client'

import { useCompletion } from 'ai/react'

export function Completion() {
  const {
    completion,
    input,
    stop,
    isLoading,
    handleInputChange,
    handleSubmit
  } = useCompletion()

  return (
    <div className="mx-auto w-full max-w-md py-24 flex flex-col stretch">
      <form onSubmit={handleSubmit}>
        <input
          className="w-full max-w-md bottom-0 border border-gray-300 rounded mb-8 shadow-xl p-2"
          value={input}
          placeholder="Enter a prompt..."
          onChange={handleInputChange}
        />
      </form>

      {isLoading && (
        <div className="animate-pulse">
          Generating...
        </div>
      )}

      {completion && (
        <div className="whitespace-pre-wrap rounded-lg bg-gray-100 p-4">
          {completion}
        </div>
      )}

      {isLoading && (
        <button
          onClick={stop}
          className="mt-4 p-2 border rounded hover:bg-gray-100"
        >
          Stop generating
        </button>
      )}
    </div>
  )
}
```

## Best Practices

### 1. Error Handling

```typescript
// app/api/chat/route.ts
import { OpenAIStream, StreamingTextResponse } from 'ai'
import OpenAI from 'openai'

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()
    
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      stream: true,
      messages
    })

    const stream = OpenAIStream(response)
    return new StreamingTextResponse(stream)
  } catch (error) {
    // Handle specific error types
    if (error instanceof OpenAI.APIError) {
      const { status, message } = error
      return new Response(
        JSON.stringify({ error: message }),
        { status }
      )
    }

    // Handle all other errors
    console.error('Error in chat route:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    )
  }
}
```

### 2. Rate Limiting

```typescript
// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

export async function rateLimit(ip: string) {
  const ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(5, '60 s')
  })

  const { success } = await ratelimit.limit(ip)
  return success
}

// app/api/chat/route.ts
import { rateLimit } from '@/lib/rate-limit'

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')
  const allowed = await rateLimit(ip)

  if (!allowed) {
    return new Response(
      JSON.stringify({ error: 'Too many requests' }),
      { status: 429 }
    )
  }

  // Continue with normal request handling...
}
```

### 3. Environment Variables

```typescript
// .env.local
OPENAI_API_KEY=your_api_key_here
UPSTASH_REDIS_REST_URL=your_redis_url_here
UPSTASH_REDIS_REST_TOKEN=your_redis_token_here

// lib/env.ts
export function validateEnv() {
  const required = [
    'OPENAI_API_KEY',
    'UPSTASH_REDIS_REST_URL',
    'UPSTASH_REDIS_REST_TOKEN'
  ]

  for (const name of required) {
    if (!process.env[name]) {
      throw new Error(`Missing required environment variable: ${name}`)
    }
  }
}

// app/api/chat/route.ts
import { validateEnv } from '@/lib/env'

export async function POST(req: Request) {
  // Validate environment variables before processing request
  validateEnv()
  
  // Continue with normal request handling...
}
``` 