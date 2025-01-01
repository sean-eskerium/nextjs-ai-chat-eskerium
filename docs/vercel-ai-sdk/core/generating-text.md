# Generating Text with Vercel AI SDK

## Overview

The Vercel AI SDK provides comprehensive support for generating text using various language models. This guide covers text generation features, including streaming responses, model configuration, and response handling.

## Basic Text Generation

### 1. Simple Completion

```typescript
// lib/core/completion.ts
import { OpenAIStream, StreamingTextResponse } from 'ai'
import OpenAI from 'openai'

export async function generateCompletion(
  prompt: string,
  options: {
    model?: string
    temperature?: number
    max_tokens?: number
  } = {}
) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  })

  const response = await openai.completions.create({
    model: options.model || 'gpt-3.5-turbo-instruct',
    prompt,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.max_tokens ?? 150,
    stream: true
  })

  const stream = OpenAIStream(response)
  return new StreamingTextResponse(stream)
}
```

### 2. Chat Completion

```typescript
// lib/core/chat.ts
export async function generateChatResponse(
  messages: Message[],
  options: {
    model?: string
    temperature?: number
    functions?: FunctionDefinition[]
  } = {}
) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  })

  const response = await openai.chat.completions.create({
    model: options.model || 'gpt-4',
    messages,
    temperature: options.temperature ?? 0.7,
    functions: options.functions,
    stream: true
  })

  const stream = OpenAIStream(response)
  return new StreamingTextResponse(stream)
}
```

## Advanced Features

### 1. Context Management

```typescript
// lib/core/context.ts
export interface ConversationContext {
  systemPrompt?: string
  temperature?: number
  maxTokens?: number
  stopSequences?: string[]
  previousMessages: Message[]
}

export class ContextManager {
  private context: ConversationContext = {
    previousMessages: []
  }

  setSystemPrompt(prompt: string) {
    this.context.systemPrompt = prompt
    this.context.previousMessages.unshift({
      role: 'system',
      content: prompt
    })
  }

  addMessage(message: Message) {
    this.context.previousMessages.push(message)
  }

  getContext(): ConversationContext {
    return { ...this.context }
  }

  clear() {
    const systemPrompt = this.context.systemPrompt
    this.context.previousMessages = []
    if (systemPrompt) {
      this.setSystemPrompt(systemPrompt)
    }
  }
}
```

### 2. Response Processing

```typescript
// lib/core/processing.ts
export interface ProcessingOptions {
  trim?: boolean
  maxLength?: number
  formatters?: Array<(text: string) => string>
}

export function processResponse(
  text: string,
  options: ProcessingOptions = {}
): string {
  let processed = text

  if (options.trim) {
    processed = processed.trim()
  }

  if (options.maxLength) {
    processed = processed.slice(0, options.maxLength)
  }

  if (options.formatters) {
    processed = options.formatters.reduce(
      (text, formatter) => formatter(text),
      processed
    )
  }

  return processed
}

export const commonFormatters = {
  removeExtraSpaces: (text: string) =>
    text.replace(/\s+/g, ' '),
  
  capitalizeFirstLetter: (text: string) =>
    text.charAt(0).toUpperCase() + text.slice(1),
  
  removeMarkdown: (text: string) =>
    text.replace(/[#*_`~]/g, '')
}
```

### 3. Token Management

```typescript
// lib/core/tokens.ts
export interface TokenConfig {
  maxTokens: number
  reservedTokens: number
  model: string
}

export class TokenManager {
  constructor(private config: TokenConfig) {}

  async estimateTokens(text: string): Promise<number> {
    // Implement token estimation based on model
    return Math.ceil(text.length / 4)
  }

  async truncateToFit(
    text: string,
    reserveTokens = 0
  ): Promise<string> {
    const availableTokens =
      this.config.maxTokens -
      this.config.reservedTokens -
      reserveTokens

    const estimatedTokens = await this.estimateTokens(text)
    
    if (estimatedTokens <= availableTokens) {
      return text
    }

    // Implement model-specific truncation
    const ratio = availableTokens / estimatedTokens
    return text.slice(0, Math.floor(text.length * ratio))
  }
}
```

## Integration Examples

### 1. API Route Implementation

```typescript
// app/api/generate/route.ts
import {
  generateCompletion,
  generateChatResponse,
  ContextManager,
  processResponse
} from '@/lib/core'

export async function POST(req: Request) {
  try {
    const { prompt, type, options } = await req.json()
    
    if (type === 'chat') {
      const context = new ContextManager()
      if (options.systemPrompt) {
        context.setSystemPrompt(options.systemPrompt)
      }
      
      const response = await generateChatResponse(
        context.getContext().previousMessages,
        options
      )
      
      return response
    }
    
    const response = await generateCompletion(
      prompt,
      options
    )
    
    return response
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    )
  }
}
```

### 2. React Hook Implementation

```typescript
// lib/core/hooks/useCompletion.ts
import { useState } from 'react'
import {
  generateCompletion,
  processResponse,
  ProcessingOptions
} from '@/lib/core'

export function useCompletion(
  options: {
    processing?: ProcessingOptions
    onResponse?: (text: string) => void
    onError?: (error: Error) => void
  } = {}
) {
  const [completion, setCompletion] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error>()

  const complete = async (prompt: string) => {
    try {
      setIsLoading(true)
      setError(undefined)

      const response = await generateCompletion(prompt)
      const reader = response.body?.getReader()
      
      if (!reader) {
        throw new Error('No response stream')
      }

      let text = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = new TextDecoder().decode(value)
        text += chunk
        
        const processed = processResponse(
          text,
          options.processing
        )
        
        setCompletion(processed)
        options.onResponse?.(processed)
      }

      return text
    } catch (error) {
      setError(error)
      options.onError?.(error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  return {
    completion,
    isLoading,
    error,
    complete
  }
}
```

### 3. Streaming Component

```typescript
// components/core/StreamingText.tsx
import { useEffect, useState } from 'react'

interface StreamingTextProps {
  stream: ReadableStream
  className?: string
  processingOptions?: ProcessingOptions
}

export function StreamingText({
  stream,
  className,
  processingOptions
}: StreamingTextProps) {
  const [text, setText] = useState('')

  useEffect(() => {
    const reader = stream.getReader()
    let accumulated = ''

    async function read() {
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          accumulated += new TextDecoder().decode(value)
          setText(
            processResponse(accumulated, processingOptions)
          )
        }
      } finally {
        reader.releaseLock()
      }
    }

    read()

    return () => {
      reader.cancel()
    }
  }, [stream, processingOptions])

  return (
    <div className={className}>
      {text || <span className="cursor">▋</span>}
    </div>
  )
}
```

## Best Practices

### 1. Prompt Management

```typescript
// lib/core/prompts.ts
export interface PromptTemplate {
  template: string
  variables: string[]
}

export class PromptManager {
  private templates: Map<string, PromptTemplate> = new Map()

  registerTemplate(
    name: string,
    template: string,
    variables: string[] = []
  ) {
    this.templates.set(name, { template, variables })
  }

  generatePrompt(
    name: string,
    variables: Record<string, string>
  ): string {
    const template = this.templates.get(name)
    if (!template) {
      throw new Error(`Template not found: ${name}`)
    }

    let prompt = template.template
    for (const key of template.variables) {
      if (!(key in variables)) {
        throw new Error(`Missing variable: ${key}`)
      }
      prompt = prompt.replace(`{${key}}`, variables[key])
    }

    return prompt
  }
}
```

### 2. Rate Limiting

```typescript
// lib/core/rate-limiting.ts
export interface RateLimitConfig {
  maxRequests: number
  windowMs: number
}

export class RateLimiter {
  private requests: number[] = []

  constructor(private config: RateLimitConfig) {}

  async checkLimit(): Promise<boolean> {
    const now = Date.now()
    this.requests = this.requests.filter(
      time => now - time < this.config.windowMs
    )

    if (this.requests.length >= this.config.maxRequests) {
      return false
    }

    this.requests.push(now)
    return true
  }

  async waitForAvailability(): Promise<void> {
    while (!(await this.checkLimit())) {
      await new Promise(resolve =>
        setTimeout(resolve, 1000)
      )
    }
  }
}
```

### 3. Response Caching

```typescript
// lib/core/caching.ts
export interface CacheConfig {
  ttl: number
  maxSize?: number
}

export class ResponseCache {
  private cache: Map<string, {
    value: string
    timestamp: number
  }> = new Map()

  constructor(private config: CacheConfig) {}

  set(key: string, value: string) {
    if (
      this.config.maxSize &&
      this.cache.size >= this.config.maxSize
    ) {
      // Remove oldest entry
      const oldest = [...this.cache.entries()]
        .sort(([, a], [, b]) =>
          a.timestamp - b.timestamp
        )[0]
      if (oldest) {
        this.cache.delete(oldest[0])
      }
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now()
    })
  }

  get(key: string): string | undefined {
    const entry = this.cache.get(key)
    if (!entry) return undefined

    if (Date.now() - entry.timestamp > this.config.ttl) {
      this.cache.delete(key)
      return undefined
    }

    return entry.value
  }

  clear() {
    this.cache.clear()
  }
}
``` 