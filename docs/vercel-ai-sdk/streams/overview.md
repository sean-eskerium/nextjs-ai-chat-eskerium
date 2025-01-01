# Stream Helpers and Protocols

## Overview

The Vercel AI SDK provides powerful stream handling capabilities for real-time AI responses. This guide covers stream data handling, custom protocols, and stream transformers.

## Stream Data Handling

### 1. Basic Stream Setup

```typescript
// lib/streams/basic-stream.ts
import { OpenAIStream, StreamingTextResponse } from 'ai'
import OpenAI from 'openai'

export async function createBasicStream(
  messages: any[]
) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  })

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    stream: true,
    messages
  })

  // Create stream from response
  const stream = OpenAIStream(response)
  
  // Return streaming response
  return new StreamingTextResponse(stream)
}
```

### 2. Stream Data Enhancement

```typescript
// lib/streams/enhanced-stream.ts
import { experimental_StreamData } from 'ai'

export function createEnhancedStream(
  baseStream: ReadableStream,
  initialData?: Record<string, unknown>
) {
  const data = new experimental_StreamData(initialData)
  
  return new ReadableStream({
    async start(controller) {
      const reader = baseStream.getReader()
      
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          
          // Process and enhance the chunk
          const enhancedChunk = processChunk(value)
          
          // Append metadata
          data.append({
            timestamp: Date.now(),
            chunkIndex: data.size
          })
          
          controller.enqueue(enhancedChunk)
        }
        controller.close()
      } catch (error) {
        controller.error(error)
      }
    }
  })
}

function processChunk(chunk: any) {
  // Add custom processing logic
  return {
    ...chunk,
    processed: true
  }
}
```

### 3. Stream Error Handling

```typescript
// lib/streams/error-handling.ts
export function createStreamWithErrorHandling(
  stream: ReadableStream,
  onError?: (error: Error) => void
) {
  return new ReadableStream({
    async start(controller) {
      const reader = stream.getReader()
      
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          
          try {
            validateChunk(value)
            controller.enqueue(value)
          } catch (error) {
            onError?.(error)
            controller.error(error)
            break
          }
        }
        controller.close()
      } catch (error) {
        onError?.(error)
        controller.error(error)
      }
    }
  })
}

function validateChunk(chunk: unknown) {
  if (!chunk) {
    throw new Error('Invalid chunk received')
  }
  // Add custom validation logic
}
```

## Custom Protocols

### 1. Protocol Definition

```typescript
// lib/protocols/custom-protocol.ts
interface StreamProtocol {
  version: string
  type: 'text' | 'json' | 'binary'
  encoding?: string
  metadata?: Record<string, unknown>
}

interface StreamChunk {
  protocol: StreamProtocol
  data: unknown
  sequence: number
}

export function createProtocolStream(
  protocol: StreamProtocol
) {
  let sequence = 0
  
  return new TransformStream({
    transform(chunk, controller) {
      const protocolChunk: StreamChunk = {
        protocol,
        data: chunk,
        sequence: sequence++
      }
      
      controller.enqueue(protocolChunk)
    }
  })
}
```

### 2. Protocol Handlers

```typescript
// lib/protocols/handlers.ts
export const protocolHandlers = {
  text: {
    encode: (chunk: string) => new TextEncoder().encode(chunk),
    decode: (chunk: Uint8Array) => new TextDecoder().decode(chunk)
  },
  
  json: {
    encode: (chunk: unknown) => 
      new TextEncoder().encode(JSON.stringify(chunk)),
    decode: (chunk: Uint8Array) => 
      JSON.parse(new TextDecoder().decode(chunk))
  },
  
  binary: {
    encode: (chunk: ArrayBuffer) => new Uint8Array(chunk),
    decode: (chunk: Uint8Array) => chunk.buffer
  }
}

export function createProtocolHandler(
  protocol: StreamProtocol
) {
  const handler = protocolHandlers[protocol.type]
  
  if (!handler) {
    throw new Error(`Unsupported protocol type: ${protocol.type}`)
  }
  
  return handler
}
```

### 3. Protocol Middleware

```typescript
// lib/protocols/middleware.ts
export function createProtocolMiddleware(
  protocol: StreamProtocol,
  options?: {
    onChunk?: (chunk: StreamChunk) => void
    onError?: (error: Error) => void
  }
) {
  const handler = createProtocolHandler(protocol)
  
  return new TransformStream({
    transform(chunk, controller) {
      try {
        // Decode incoming chunk
        const decoded = handler.decode(chunk)
        
        // Process with protocol
        const processed = {
          protocol,
          data: decoded,
          timestamp: Date.now()
        }
        
        options?.onChunk?.(processed)
        
        // Encode for output
        const encoded = handler.encode(processed)
        controller.enqueue(encoded)
      } catch (error) {
        options?.onError?.(error)
        throw error
      }
    }
  })
}
```

## Stream Transformers

### 1. Basic Transformers

```typescript
// lib/transformers/basic.ts
export function createChunkTransformer(
  transform: (chunk: unknown) => unknown
) {
  return new TransformStream({
    transform(chunk, controller) {
      const transformed = transform(chunk)
      controller.enqueue(transformed)
    }
  })
}

export const commonTransformers = {
  uppercase: createChunkTransformer((chunk: string) => 
    chunk.toUpperCase()
  ),
  
  lowercase: createChunkTransformer((chunk: string) => 
    chunk.toLowerCase()
  ),
  
  trim: createChunkTransformer((chunk: string) => 
    chunk.trim()
  )
}
```

### 2. Advanced Transformers

```typescript
// lib/transformers/advanced.ts
export function createBufferedTransformer(
  options: {
    bufferSize: number
    transform: (chunks: unknown[]) => unknown[]
  }
) {
  const buffer: unknown[] = []
  
  return new TransformStream({
    transform(chunk, controller) {
      buffer.push(chunk)
      
      if (buffer.length >= options.bufferSize) {
        const transformed = options.transform(buffer)
        transformed.forEach(chunk => controller.enqueue(chunk))
        buffer.length = 0
      }
    },
    
    flush(controller) {
      if (buffer.length > 0) {
        const transformed = options.transform(buffer)
        transformed.forEach(chunk => controller.enqueue(chunk))
      }
    }
  })
}

export function createFilterTransformer(
  predicate: (chunk: unknown) => boolean
) {
  return new TransformStream({
    transform(chunk, controller) {
      if (predicate(chunk)) {
        controller.enqueue(chunk)
      }
    }
  })
}
```

### 3. Composition Utilities

```typescript
// lib/transformers/composition.ts
export function pipeTransformers(
  transformers: TransformStream[]
) {
  return {
    transform: (stream: ReadableStream) => {
      return transformers.reduce(
        (stream, transformer) => stream.pipeThrough(transformer),
        stream
      )
    }
  }
}

export function createTransformerChain(
  ...transformers: TransformStream[]
) {
  return new TransformStream({
    transform: async (chunk, controller) => {
      let current = chunk
      
      for (const transformer of transformers) {
        const reader = transformer
          .readable.getReader()
        const writer = transformer
          .writable.getWriter()
        
        await writer.write(current)
        const { value } = await reader.read()
        current = value
      }
      
      controller.enqueue(current)
    }
  })
}
```

## Integration Examples

### 1. API Route Integration

```typescript
// app/api/stream/route.ts
import { StreamingTextResponse } from 'ai'
import {
  createEnhancedStream,
  createProtocolStream,
  commonTransformers
} from '@/lib/streams'

export async function POST(req: Request) {
  const { messages } = await req.json()
  
  // Create base stream
  const baseStream = await createBasicStream(messages)
  
  // Add protocol
  const protocolStream = baseStream.pipeThrough(
    createProtocolStream({
      version: '1.0',
      type: 'text'
    })
  )
  
  // Add transformers
  const transformedStream = protocolStream
    .pipeThrough(commonTransformers.trim)
  
  // Add enhancements
  const enhancedStream = createEnhancedStream(
    transformedStream,
    {
      startTime: Date.now(),
      metadata: { /* ... */ }
    }
  )
  
  return new StreamingTextResponse(enhancedStream)
}
```

### 2. Client Integration

```typescript
// components/streams/StreamProcessor.tsx
import { useEffect, useState } from 'react'

export function StreamProcessor({
  stream,
  onData,
  onComplete
}: {
  stream: ReadableStream
  onData: (chunk: unknown) => void
  onComplete: () => void
}) {
  const [error, setError] = useState<Error>()
  
  useEffect(() => {
    const processStream = async () => {
      const reader = stream.getReader()
      
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) {
            onComplete()
            break
          }
          
          onData(value)
        }
      } catch (error) {
        setError(error)
      } finally {
        reader.releaseLock()
      }
    }
    
    processStream()
  }, [stream, onData, onComplete])
  
  if (error) {
    return (
      <div className="error">
        Stream error: {error.message}
      </div>
    )
  }
  
  return null
}
```

### 3. WebSocket Integration

```typescript
// lib/streams/websocket.ts
export function createWebSocketStream(
  url: string,
  options?: {
    protocols?: string[]
    onOpen?: () => void
    onClose?: () => void
    onError?: (error: Error) => void
  }
) {
  const ws = new WebSocket(url, options?.protocols)
  
  ws.onopen = () => options?.onOpen?.()
  ws.onclose = () => options?.onClose?.()
  ws.onerror = (event) => 
    options?.onError?.(new Error('WebSocket error'))
  
  return new ReadableStream({
    start(controller) {
      ws.onmessage = (event) => {
        controller.enqueue(event.data)
      }
    },
    
    cancel() {
      ws.close()
    }
  })
}
``` 