# Advanced Features

## Overview

This guide covers advanced features of the Vercel AI SDK, including middleware implementation, custom providers, and testing utilities.

## Middleware

### 1. Request Middleware

```typescript
// lib/middleware/request.ts
import { AIStreamCallbacks } from 'ai'

export interface RequestMiddleware {
  beforeRequest?: (request: Request) => Promise<Request>
  afterResponse?: (response: Response) => Promise<Response>
}

export function createRequestMiddleware(
  options: RequestMiddleware
): AIStreamCallbacks {
  return {
    async onStart() {
      if (options.beforeRequest) {
        const modifiedRequest = await options.beforeRequest(
          this.currentRequest
        )
        this.currentRequest = modifiedRequest
      }
    },

    async onCompletion(completion) {
      if (options.afterResponse) {
        const response = new Response(completion)
        const modifiedResponse = await options.afterResponse(
          response
        )
        return modifiedResponse.text()
      }
      return completion
    }
  }
}

// Example usage
export const rateLimitMiddleware = createRequestMiddleware({
  beforeRequest: async (request) => {
    const rateLimitResponse = await checkRateLimit(request)
    if (!rateLimitResponse.allowed) {
      throw new Error('Rate limit exceeded')
    }
    return request
  }
})
```

### 2. Stream Middleware

```typescript
// lib/middleware/stream.ts
import { experimental_StreamData } from 'ai'

export interface StreamMiddleware {
  beforeStream?: (stream: ReadableStream) => Promise<ReadableStream>
  onChunk?: (chunk: unknown) => Promise<unknown>
  afterStream?: (data: experimental_StreamData) => Promise<void>
}

export function createStreamMiddleware(
  options: StreamMiddleware
) {
  return new TransformStream({
    async start(controller) {
      if (options.beforeStream) {
        this.stream = await options.beforeStream(this.stream)
      }
    },

    async transform(chunk, controller) {
      if (options.onChunk) {
        const processedChunk = await options.onChunk(chunk)
        controller.enqueue(processedChunk)
      } else {
        controller.enqueue(chunk)
      }
    },

    async flush(controller) {
      if (options.afterStream) {
        await options.afterStream(this.data)
      }
    }
  })
}

// Example usage
export const loggingMiddleware = createStreamMiddleware({
  onChunk: async (chunk) => {
    console.log('Processing chunk:', chunk)
    return chunk
  }
})
```

### 3. Function Call Middleware

```typescript
// lib/middleware/function-calls.ts
import { FunctionCall } from 'ai'

export interface FunctionCallMiddleware {
  beforeCall?: (call: FunctionCall) => Promise<FunctionCall>
  afterCall?: (result: unknown) => Promise<unknown>
  onError?: (error: Error) => Promise<void>
}

export function createFunctionCallMiddleware(
  options: FunctionCallMiddleware
) {
  return async function handleFunctionCall(
    call: FunctionCall
  ) {
    try {
      // Pre-process function call
      const processedCall = options.beforeCall
        ? await options.beforeCall(call)
        : call

      // Execute function
      const result = await executeFunctionCall(processedCall)

      // Post-process result
      return options.afterCall
        ? await options.afterCall(result)
        : result
    } catch (error) {
      if (options.onError) {
        await options.onError(error)
      }
      throw error
    }
  }
}
```

## Custom Providers

### 1. Provider Interface

```typescript
// lib/providers/base.ts
export interface AIProvider {
  id: string
  name: string
  models: string[]
  
  generateText(
    prompt: string,
    options?: GenerateOptions
  ): Promise<string>
  
  generateStream(
    prompt: string,
    options?: StreamOptions
  ): Promise<ReadableStream>
  
  generateEmbedding(
    text: string
  ): Promise<number[]>
}

export interface GenerateOptions {
  model: string
  temperature?: number
  maxTokens?: number
  stop?: string[]
}

export interface StreamOptions extends GenerateOptions {
  onToken?: (token: string) => void
  onComplete?: (text: string) => void
}
```

### 2. Custom Provider Implementation

```typescript
// lib/providers/custom-provider.ts
export class CustomAIProvider implements AIProvider {
  id = 'custom-provider'
  name = 'Custom AI Provider'
  models = ['custom-model-1', 'custom-model-2']

  constructor(
    private apiKey: string,
    private baseUrl: string
  ) {}

  async generateText(
    prompt: string,
    options: GenerateOptions = {}
  ): Promise<string> {
    const response = await fetch(
      `${this.baseUrl}/generate`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt,
          ...options
        })
      }
    )

    if (!response.ok) {
      throw new Error('Generation failed')
    }

    const data = await response.json()
    return data.text
  }

  async generateStream(
    prompt: string,
    options: StreamOptions = {}
  ): Promise<ReadableStream> {
    const response = await fetch(
      `${this.baseUrl}/generate-stream`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt,
          ...options
        })
      }
    )

    if (!response.ok) {
      throw new Error('Stream generation failed')
    }

    return response.body!
  }

  async generateEmbedding(
    text: string
  ): Promise<number[]> {
    const response = await fetch(
      `${this.baseUrl}/embeddings`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text })
      }
    )

    if (!response.ok) {
      throw new Error('Embedding generation failed')
    }

    const data = await response.json()
    return data.embedding
  }
}
```

### 3. Provider Registry

```typescript
// lib/providers/registry.ts
export class ProviderRegistry {
  private providers = new Map<string, AIProvider>()

  register(provider: AIProvider) {
    this.providers.set(provider.id, provider)
  }

  unregister(providerId: string) {
    this.providers.delete(providerId)
  }

  getProvider(providerId: string): AIProvider {
    const provider = this.providers.get(providerId)
    if (!provider) {
      throw new Error(`Provider not found: ${providerId}`)
    }
    return provider
  }

  listProviders(): AIProvider[] {
    return Array.from(this.providers.values())
  }
}

// Example usage
const registry = new ProviderRegistry()

registry.register(
  new CustomAIProvider(
    process.env.CUSTOM_API_KEY!,
    'https://api.custom-ai.com'
  )
)
```

## Testing Utilities

### 1. Mock Stream Generator

```typescript
// lib/testing/mock-stream.ts
export function createMockStream(
  chunks: string[],
  options?: {
    delay?: number
    error?: Error
  }
) {
  return new ReadableStream({
    async start(controller) {
      try {
        for (const chunk of chunks) {
          if (options?.delay) {
            await new Promise(resolve => 
              setTimeout(resolve, options.delay)
            )
          }
          controller.enqueue(chunk)
        }
        controller.close()
      } catch (error) {
        controller.error(options?.error || error)
      }
    }
  })
}

// Example usage
const mockStream = createMockStream(
  ['Hello', ' ', 'World'],
  { delay: 100 }
)
```

### 2. Mock Provider

```typescript
// lib/testing/mock-provider.ts
export class MockAIProvider implements AIProvider {
  id = 'mock-provider'
  name = 'Mock AI Provider'
  models = ['mock-model']

  constructor(
    private responses: {
      text?: string
      stream?: string[]
      embedding?: number[]
    }
  ) {}

  async generateText(): Promise<string> {
    return this.responses.text || ''
  }

  async generateStream(): Promise<ReadableStream> {
    return createMockStream(
      this.responses.stream || []
    )
  }

  async generateEmbedding(): Promise<number[]> {
    return this.responses.embedding || []
  }
}
```

### 3. Test Helpers

```typescript
// lib/testing/helpers.ts
export async function collectStreamContent(
  stream: ReadableStream
): Promise<string> {
  const reader = stream.getReader()
  let content = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      content += value
    }
  } finally {
    reader.releaseLock()
  }

  return content
}

export function createTestMiddleware() {
  const calls: unknown[] = []
  
  return {
    middleware: createStreamMiddleware({
      onChunk: async (chunk) => {
        calls.push(chunk)
        return chunk
      }
    }),
    getCalls: () => calls
  }
}

// Example usage
describe('AI Stream', () => {
  it('processes chunks correctly', async () => {
    const { middleware, getCalls } = createTestMiddleware()
    const mockStream = createMockStream(['a', 'b', 'c'])
    
    await collectStreamContent(
      mockStream.pipeThrough(middleware)
    )
    
    expect(getCalls()).toEqual(['a', 'b', 'c'])
  })
})
``` 