# Streaming Implementation Guide

## Overview

Streaming is a crucial feature of the Vercel AI SDK that enables real-time response delivery from AI models. This guide covers implementing streaming responses, handling different types of streams, and managing stream states.

## Basic Streaming Setup

### 1. Server-Side Implementation

```typescript
// app/api/chat/route.ts
import { OpenAIStream, StreamingTextResponse } from 'ai'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(req: Request) {
  const { messages } = await req.json()
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    stream: true,
    messages
  })
  
  // Convert the response into a friendly stream
  const stream = OpenAIStream(response)
  
  // Return a StreamingTextResponse
  return new StreamingTextResponse(stream)
}
```

### 2. Client-Side Implementation

```typescript
// components/chat/StreamingChat.tsx
import { useChat } from 'ai/react'

export function StreamingChat() {
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

## Advanced Streaming Features

### 1. Custom Stream Processing

```typescript
// lib/streams/processor.ts
import { experimental_StreamData } from 'ai'

export function createCustomStream(baseStream: ReadableStream) {
  const data = new experimental_StreamData()
  
  // Add custom metadata to the stream
  data.append({
    timestamp: Date.now(),
    metadata: { /* custom data */ }
  })
  
  return new ReadableStream({
    async start(controller) {
      const reader = baseStream.getReader()
      
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          
          // Process the chunk before sending
          const processedValue = processChunk(value)
          controller.enqueue(processedValue)
        }
        controller.close()
      } catch (error) {
        controller.error(error)
      }
    }
  })
}
```

### 2. Stream Progress Tracking

```typescript
// components/chat/StreamProgress.tsx
import { useCompletion } from 'ai/react'

export function StreamProgress() {
  const {
    completion,
    input,
    isLoading,
    handleInputChange,
    handleSubmit,
    stop
  } = useCompletion({
    onProgress: (progress) => {
      console.log('Stream progress:', progress)
    },
    onFinish: (completion) => {
      console.log('Stream finished:', completion)
    }
  })
  
  return (
    <div>
      <div className="completion">
        {completion}
        {isLoading && <span className="loading">...</span>}
      </div>
      
      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Enter prompt..."
        />
        {isLoading && (
          <button onClick={stop}>Stop</button>
        )}
      </form>
    </div>
  )
}
```

### 3. Error Handling

```typescript
// lib/streams/error-handling.ts
export class StreamError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly chunk?: unknown
  ) {
    super(message)
  }
}

export function createStreamWithErrorHandling(
  baseStream: ReadableStream
) {
  return new ReadableStream({
    async start(controller) {
      const reader = baseStream.getReader()
      
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          
          try {
            // Validate chunk before sending
            validateChunk(value)
            controller.enqueue(value)
          } catch (error) {
            throw new StreamError(
              'Invalid chunk received',
              'INVALID_CHUNK',
              value
            )
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

## Stream Types and Formats

### 1. Text Streaming

```typescript
// lib/streams/text.ts
import { experimental_StreamingReactResponse } from 'ai/react'

export async function createTextStream(
  generator: AsyncGenerator<string>
) {
  const stream = new ReadableStream({
    async start(controller) {
      for await (const chunk of generator) {
        controller.enqueue(chunk)
      }
      controller.close()
    }
  })
  
  return new experimental_StreamingReactResponse(stream, {
    data: { type: 'text' }
  })
}
```

### 2. JSON Streaming

```typescript
// lib/streams/json.ts
export async function createJSONStream<T>(
  generator: AsyncGenerator<T>
) {
  return new ReadableStream({
    async start(controller) {
      for await (const chunk of generator) {
        controller.enqueue(
          JSON.stringify(chunk) + '\n'
        )
      }
      controller.close()
    }
  })
}
```

### 3. Binary Streaming

```typescript
// lib/streams/binary.ts
export function createBinaryStream(
  chunks: Uint8Array[]
) {
  return new ReadableStream({
    async start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(chunk)
      }
      controller.close()
    }
  })
}
```

## Performance Optimization

### 1. Backpressure Handling

```typescript
// lib/streams/backpressure.ts
export function createBackpressureAwareStream(
  generator: AsyncGenerator
) {
  return new ReadableStream({
    async pull(controller) {
      try {
        const { done, value } = await generator.next()
        
        if (done) {
          controller.close()
          return
        }
        
        controller.enqueue(value)
      } catch (error) {
        controller.error(error)
      }
    }
  })
}
```

### 2. Chunk Optimization

```typescript
// lib/streams/optimization.ts
export function optimizeChunks(
  chunks: string[],
  maxSize: number = 16384 // 16KB
) {
  const optimizedChunks: string[] = []
  let currentChunk = ''
  
  for (const chunk of chunks) {
    if ((currentChunk + chunk).length <= maxSize) {
      currentChunk += chunk
    } else {
      optimizedChunks.push(currentChunk)
      currentChunk = chunk
    }
  }
  
  if (currentChunk) {
    optimizedChunks.push(currentChunk)
  }
  
  return optimizedChunks
}
```

### 3. Memory Management

```typescript
// lib/streams/memory.ts
export function createMemoryEfficientStream(
  generator: AsyncGenerator,
  maxBufferSize: number = 1000
) {
  let bufferedChunks: unknown[] = []
  
  return new ReadableStream({
    async pull(controller) {
      try {
        const { done, value } = await generator.next()
        
        if (done) {
          controller.close()
          return
        }
        
        bufferedChunks.push(value)
        
        if (bufferedChunks.length >= maxBufferSize) {
          const chunk = bufferedChunks.shift()
          controller.enqueue(chunk)
        }
      } catch (error) {
        controller.error(error)
      }
    }
  })
}
``` 