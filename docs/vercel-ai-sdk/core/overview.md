# AI SDK Core Overview

## Introduction

The Vercel AI SDK Core provides a foundation for building AI-powered applications with a focus on type safety, streaming responses, and cross-platform compatibility. This overview covers the fundamental concepts and architecture of the SDK.

## Key Features

### 1. Type-Safe AI Interactions

```typescript
// lib/core/types.ts
export interface AIResponse<T = unknown> {
  id: string
  created: number
  model: string
  choices: Array<{
    index: number
    message?: Message
    delta?: Partial<Message>
    finish_reason: string | null
  }>
  data?: T
}

export interface Message {
  role: 'system' | 'user' | 'assistant' | 'function'
  content: string
  name?: string
  function_call?: FunctionCall
}

export interface FunctionCall {
  name: string
  arguments: string
}
```

### 2. Streaming Architecture

```typescript
// lib/core/stream.ts
import { experimental_StreamData } from 'ai'

export interface StreamConfig {
  experimental_streamData?: boolean
  experimental_onFunctionCall?: (
    call: FunctionCall
  ) => Promise<string | void>
}

export function createStream(
  iterator: AsyncIterator<any>,
  config?: StreamConfig
) {
  const data = new experimental_StreamData()
  let streamComplete = false

  return new ReadableStream({
    async start(controller) {
      while (!streamComplete) {
        try {
          const { value, done } = await iterator.next()
          if (done) {
            streamComplete = true
            controller.close()
            break
          }
          
          const chunk = processStreamValue(value)
          controller.enqueue(chunk)
          
          if (config?.experimental_streamData) {
            data.append(chunk)
          }
        } catch (error) {
          controller.error(error)
          break
        }
      }
    },
    cancel() {
      streamComplete = true
    }
  })
}
```

### 3. Cross-Platform Support

```typescript
// lib/core/platform.ts
export interface PlatformConfig {
  runtime: 'edge' | 'nodejs'
  streaming?: boolean
  headers?: Record<string, string>
}

export function createPlatformAdapter(
  config: PlatformConfig
) {
  return {
    runtime: config.runtime,
    
    createResponse(stream: ReadableStream) {
      if (config.runtime === 'edge') {
        return new Response(stream)
      }
      
      // Node.js specific handling
      return {
        body: stream,
        headers: config.headers || {}
      }
    },
    
    handleError(error: Error) {
      if (config.runtime === 'edge') {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500 }
        )
      }
      
      throw error
    }
  }
}
```

## Core Concepts

### 1. Message Management

```typescript
// lib/core/messages.ts
export interface MessageManager {
  addMessage(message: Message): void
  updateMessage(id: string, update: Partial<Message>): void
  getMessages(): Message[]
  clear(): void
}

export function createMessageManager(): MessageManager {
  const messages: Message[] = []
  
  return {
    addMessage(message) {
      messages.push(message)
    },
    
    updateMessage(id, update) {
      const index = messages.findIndex(m => m.id === id)
      if (index !== -1) {
        messages[index] = { ...messages[index], ...update }
      }
    },
    
    getMessages() {
      return [...messages]
    },
    
    clear() {
      messages.length = 0
    }
  }
}
```

### 2. Configuration Management

```typescript
// lib/core/config.ts
export interface SDKConfig {
  debug?: boolean
  defaultProvider?: string
  apiKey?: string
  baseURL?: string
  headers?: Record<string, string>
  fetch?: typeof fetch
}

export class ConfigManager {
  private config: SDKConfig = {}
  
  setConfig(config: Partial<SDKConfig>) {
    this.config = {
      ...this.config,
      ...config
    }
  }
  
  getConfig(): SDKConfig {
    return { ...this.config }
  }
  
  mergeConfig(config: Partial<SDKConfig>): SDKConfig {
    return {
      ...this.config,
      ...config
    }
  }
}
```

### 3. Event System

```typescript
// lib/core/events.ts
type EventHandler = (data: any) => void

export class EventSystem {
  private handlers: Map<string, Set<EventHandler>> = new Map()
  
  on(event: string, handler: EventHandler) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set())
    }
    this.handlers.get(event)!.add(handler)
  }
  
  off(event: string, handler: EventHandler) {
    this.handlers.get(event)?.delete(handler)
  }
  
  emit(event: string, data: any) {
    this.handlers.get(event)?.forEach(handler => {
      try {
        handler(data)
      } catch (error) {
        console.error(`Error in event handler: ${error}`)
      }
    })
  }
}
```

## Integration Patterns

### 1. API Route Integration

```typescript
// app/api/ai/route.ts
import { createStream, createPlatformAdapter } from '@/lib/core'

export const runtime = 'edge'

export async function POST(req: Request) {
  const platform = createPlatformAdapter({
    runtime: 'edge',
    streaming: true
  })
  
  try {
    const { messages } = await req.json()
    const stream = await createStream(
      generateResponse(messages)
    )
    
    return platform.createResponse(stream)
  } catch (error) {
    return platform.handleError(error)
  }
}
```

### 2. Client Integration

```typescript
// lib/core/client.ts
export interface ClientConfig extends SDKConfig {
  onError?: (error: Error) => void
  onResponse?: (response: Response) => void
}

export class AIClient {
  private config: ClientConfig
  private events: EventSystem
  
  constructor(config: ClientConfig) {
    this.config = config
    this.events = new EventSystem()
  }
  
  async complete(prompt: string): Promise<AIResponse> {
    try {
      const response = await fetch(
        this.config.baseURL + '/ai/complete',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...this.config.headers
          },
          body: JSON.stringify({ prompt })
        }
      )
      
      this.config.onResponse?.(response)
      
      if (!response.ok) {
        throw new Error('AI request failed')
      }
      
      return response.json()
    } catch (error) {
      this.config.onError?.(error)
      throw error
    }
  }
  
  stream(prompt: string): ReadableStream {
    // Similar to complete but returns a stream
    // Implementation details...
  }
}
```

### 3. React Integration

```typescript
// lib/core/react.ts
import { useEffect, useState } from 'react'
import { AIClient, AIResponse } from './client'

export function useAI(config: ClientConfig) {
  const [client] = useState(() => new AIClient(config))
  const [response, setResponse] = useState<AIResponse>()
  const [error, setError] = useState<Error>()
  
  useEffect(() => {
    return () => {
      // Cleanup
    }
  }, [])
  
  const complete = async (prompt: string) => {
    try {
      const result = await client.complete(prompt)
      setResponse(result)
      return result
    } catch (error) {
      setError(error)
      throw error
    }
  }
  
  return {
    complete,
    response,
    error,
    client
  }
}
```

## Best Practices

### 1. Error Handling

```typescript
// lib/core/error-handling.ts
export function handleStreamError(
  error: unknown,
  fallback: string
): string {
  if (error instanceof Error) {
    return `Error: ${error.message}`
  }
  return fallback
}

export function validateConfig(
  config: SDKConfig
): void {
  if (!config.apiKey) {
    throw new Error('API key is required')
  }
  
  if (!config.baseURL) {
    throw new Error('Base URL is required')
  }
}
```

### 2. Performance Optimization

```typescript
// lib/core/optimization.ts
export function optimizeMessages(
  messages: Message[]
): Message[] {
  // Remove duplicate system messages
  const systemMessages = new Set()
  return messages.filter(message => {
    if (message.role === 'system') {
      if (systemMessages.has(message.content)) {
        return false
      }
      systemMessages.add(message.content)
    }
    return true
  })
}

export function createMessageBatcher(
  batchSize: number = 10
) {
  const queue: Message[] = []
  
  return {
    add(message: Message) {
      queue.push(message)
      if (queue.length >= batchSize) {
        this.flush()
      }
    },
    
    flush() {
      if (queue.length > 0) {
        processMessages(queue)
        queue.length = 0
      }
    }
  }
}
```

### 3. Security

```typescript
// lib/core/security.ts
export function sanitizeInput(
  input: string
): string {
  // Remove potential XSS
  return input.replace(/<[^>]*>/g, '')
}

export function validateApiKey(
  apiKey: string
): boolean {
  // Basic validation
  return /^sk-[a-zA-Z0-9]{32,}$/.test(apiKey)
}

export function createSecureHeaders(
  config: SDKConfig
): Headers {
  const headers = new Headers(config.headers)
  
  // Ensure security headers
  headers.set('Content-Security-Policy', "default-src 'self'")
  headers.set('X-Content-Type-Options', 'nosniff')
  
  return headers
}
``` 