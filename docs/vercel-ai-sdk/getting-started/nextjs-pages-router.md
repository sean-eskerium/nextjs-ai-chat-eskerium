# Next.js Pages Router

## Overview

Learn how to use the Vercel AI SDK with Next.js Pages Router.

## Installation

```bash
npm install ai openai@^4.0.0
```

## Basic Setup

### 1. API Route

```typescript
// pages/api/chat.ts
import OpenAI from 'openai'
import { OpenAIStream, StreamingTextResponse } from 'ai'
import type { NextApiRequest, NextApiResponse } from 'next'

// Create an OpenAI API client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

// IMPORTANT! Set the runtime to edge
export const config = {
  runtime: 'edge'
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { messages } = await req.json()

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    stream: true,
    messages
  })

  const stream = OpenAIStream(response)
  return new StreamingTextResponse(stream)
}
```

### 2. React Component

```typescript
// pages/chat.tsx
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
// pages/api/chat.ts
import { OpenAIStream, StreamingTextResponse } from 'ai'
import OpenAI from 'openai'

export const config = {
  runtime: 'edge'
}

export default async function handler(req, res) {
  const { messages } = await req.json()
  
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!
  })

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    stream: true,
    messages,
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
// pages/api/chat.ts
import OpenAI from 'openai'
import { OpenAIStream, StreamingTextResponse } from 'ai'

export const config = {
  runtime: 'edge'
}

export default async function handler(req, res) {
  const { messages } = await req.json()

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!
  })

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

## UI Components

### 1. Chat Component

```typescript
// components/Chat.tsx
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
// pages/api/chat.ts
import { OpenAIStream, StreamingTextResponse } from 'ai'
import OpenAI from 'openai'

export default async function handler(req, res) {
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
import rateLimit from 'express-rate-limit'
import slowDown from 'express-slow-down'

export const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5 // 5 requests per minute
})

export const speedLimiter = slowDown({
  windowMs: 60 * 1000, // 1 minute
  delayAfter: 3, // allow 3 requests per minute at full speed
  delayMs: 500 // add 500ms of delay per request above 3
})

// pages/api/chat.ts
import { limiter, speedLimiter } from '@/lib/rate-limit'

export default async function handler(req, res) {
  try {
    await Promise.all([
      new Promise((resolve) => limiter(req, res, resolve)),
      new Promise((resolve) => speedLimiter(req, res, resolve))
    ])

    // Continue with normal request handling...
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Too many requests' }),
      { status: 429 }
    )
  }
}
```

### 3. Environment Variables

```typescript
// .env.local
OPENAI_API_KEY=your_api_key_here

// lib/env.ts
export function validateEnv() {
  const required = [
    'OPENAI_API_KEY'
  ]

  for (const name of required) {
    if (!process.env[name]) {
      throw new Error(`Missing required environment variable: ${name}`)
    }
  }
}

// pages/api/chat.ts
import { validateEnv } from '@/lib/env'

export default async function handler(req, res) {
  // Validate environment variables before processing request
  validateEnv()
  
  // Continue with normal request handling...
}
``` 