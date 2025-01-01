# Streaming

## Overview

Learn why streaming is used for AI applications and how to implement it effectively using the Vercel AI SDK.

## Why Streaming?

Streaming provides several benefits for AI applications:

1. **Instant Feedback**: Users see responses as they're generated
2. **Better UX**: Reduces perceived latency
3. **Resource Efficiency**: Process data in chunks rather than waiting for complete response

## Basic Implementation

### 1. Server-Side Streaming

```typescript
// app/api/chat/route.ts
import { OpenAIStream, StreamingTextResponse } from 'ai'
import OpenAI from 'openai'

export async function POST(req: Request) {
  const { messages } = await req.json()
  
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  })

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    stream: true,
    messages
  })

  // Convert the response into a friendly text-stream
  const stream = OpenAIStream(response)
  
  // Return a StreamingTextResponse, which can be consumed by the client
  return new StreamingTextResponse(stream)
}
```

### 2. Client-Side Streaming

```typescript
// app/chat/page.tsx
'use client'

import { useChat } from 'ai/react'

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit } = useChat()

  return (
    <div>
      {messages.map(m => (
        <div key={m.id}>
          {m.role === 'user' ? 'User: ' : 'AI: '}
          {m.content}
        </div>
      ))}

      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Say something..."
        />
      </form>
    </div>
  )
}
```

## Advanced Features

### 1. Custom Stream Processing

```typescript
// lib/stream-processor.ts
export class StreamProcessor {
  private buffer: string = ''
  private decoder = new TextDecoder()

  process(chunk: Uint8Array): string {
    this.buffer += this.decoder.decode(chunk, { stream: true })
    
    // Process complete messages
    const messages = this.buffer.split('\n')
    this.buffer = messages.pop() || ''
    
    return messages
      .map(msg => {
        try {
          if (msg.startsWith('data: ')) {
            const data = JSON.parse(msg.slice(6))
            return data.content
          }
        } catch (e) {
          console.error('Error parsing message:', e)
        }
        return ''
      })
      .join('')
  }

  flush(): string {
    const remaining = this.decoder.decode()
    this.buffer = ''
    return remaining
  }
}
```

### 2. Backpressure Handling

```typescript
// lib/stream-controller.ts
export class StreamController {
  private readonly highWaterMark: number
  private backpressure: Promise<void> | null = null
  private resolveBackpressure: (() => void) | null = null

  constructor(highWaterMark = 1024 * 1024) {
    this.highWaterMark = highWaterMark
  }

  async write(
    controller: WritableStreamDefaultController,
    chunk: Uint8Array
  ) {
    if (controller.desiredSize! < 0) {
      this.backpressure = new Promise(resolve => {
        this.resolveBackpressure = resolve
      })
      await this.backpressure
    }

    controller.enqueue(chunk)
  }

  releaseBackpressure() {
    if (this.resolveBackpressure) {
      this.resolveBackpressure()
      this.backpressure = null
      this.resolveBackpressure = null
    }
  }
}
```

### 3. Error Handling

```typescript
// lib/stream-error-handler.ts
export class StreamErrorHandler {
  private retryCount: number = 0
  private maxRetries: number = 3
  
  async handleError(
    error: Error,
    retry: () => Promise<Response>
  ): Promise<Response> {
    if (this.retryCount >= this.maxRetries) {
      throw new Error(
        `Failed after ${this.maxRetries} retries: ${error.message}`
      )
    }
    
    this.retryCount++
    
    // Exponential backoff
    const delay = Math.pow(2, this.retryCount) * 1000
    await new Promise(resolve => setTimeout(resolve, delay))
    
    return retry()
  }
  
  reset() {
    this.retryCount = 0
  }
}
```

## Integration Examples

### 1. Custom Streaming Hook

```typescript
// hooks/useStreamingResponse.ts
import { useState, useEffect } from 'react'
import { StreamProcessor } from '@/lib/stream-processor'

export function useStreamingResponse() {
  const [response, setResponse] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  async function streamResponse(prompt: string) {
    try {
      setIsStreaming(true)
      setError(null)
      
      const res = await fetch('/api/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      })

      if (!res.ok) throw new Error('Stream request failed')
      
      const reader = res.body?.getReader()
      if (!reader) throw new Error('No reader available')

      const processor = new StreamProcessor()
      
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        
        const chunk = processor.process(value)
        setResponse(prev => prev + chunk)
      }

      const remaining = processor.flush()
      setResponse(prev => prev + remaining)
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Unknown error'))
    } finally {
      setIsStreaming(false)
    }
  }

  return {
    response,
    isStreaming,
    error,
    streamResponse
  }
}
```

### 2. Streaming Component

```typescript
// components/StreamingResponse.tsx
import { useStreamingResponse } from '@/hooks/useStreamingResponse'

export function StreamingResponse() {
  const {
    response,
    isStreaming,
    error,
    streamResponse
  } = useStreamingResponse()

  return (
    <div>
      <textarea
        value={response}
        readOnly
        className="w-full h-48 p-2 border rounded"
      />
      
      {isStreaming && (
        <div className="animate-pulse">
          Streaming response...
        </div>
      )}
      
      {error && (
        <div className="text-red-500">
          Error: {error.message}
        </div>
      )}
      
      <button
        onClick={() => streamResponse('Tell me a story')}
        disabled={isStreaming}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        Generate Response
      </button>
    </div>
  )
}
```

## Best Practices

### 1. Memory Management

```typescript
// lib/memory-manager.ts
export class StreamMemoryManager {
  private maxBufferSize: number
  private currentSize: number = 0
  
  constructor(maxBufferSizeInMB: number = 100) {
    this.maxBufferSize = maxBufferSizeInMB * 1024 * 1024
  }
  
  trackAllocation(size: number) {
    this.currentSize += size
    if (this.currentSize > this.maxBufferSize) {
      throw new Error('Memory limit exceeded')
    }
  }
  
  trackDeallocation(size: number) {
    this.currentSize = Math.max(0, this.currentSize - size)
  }
  
  getCurrentUsage(): number {
    return this.currentSize
  }
  
  reset() {
    this.currentSize = 0
  }
}
```

### 2. Performance Monitoring

```typescript
// lib/stream-monitor.ts
export class StreamMonitor {
  private startTime: number = 0
  private chunks: number = 0
  private totalBytes: number = 0
  
  startStream() {
    this.startTime = Date.now()
    this.chunks = 0
    this.totalBytes = 0
  }
  
  recordChunk(size: number) {
    this.chunks++
    this.totalBytes += size
  }
  
  getMetrics() {
    const duration = Date.now() - this.startTime
    return {
      duration,
      chunks: this.chunks,
      totalBytes: this.totalBytes,
      bytesPerSecond: (this.totalBytes / duration) * 1000,
      chunksPerSecond: (this.chunks / duration) * 1000
    }
  }
}
```

### 3. Connection Management

```typescript
// lib/connection-manager.ts
export class StreamConnectionManager {
  private connections: Set<string> = new Set()
  private readonly maxConnections: number
  
  constructor(maxConnections: number = 100) {
    this.maxConnections = maxConnections
  }
  
  async addConnection(id: string): Promise<boolean> {
    if (this.connections.size >= this.maxConnections) {
      return false
    }
    
    this.connections.add(id)
    return true
  }
  
  removeConnection(id: string) {
    this.connections.delete(id)
  }
  
  getActiveConnections(): number {
    return this.connections.size
  }
  
  isConnectionActive(id: string): boolean {
    return this.connections.has(id)
  }
}
``` 