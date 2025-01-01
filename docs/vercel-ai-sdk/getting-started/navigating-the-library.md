# Navigating the Library

## Overview

Learn how to navigate and use the Vercel AI SDK effectively in your projects.

## Installation

Install the AI SDK using your preferred package manager:

```bash
# npm
npm install ai

# pnpm
pnpm install ai

# yarn
yarn add ai
```

## Project Structure

The AI SDK follows a modular structure:

```
ai/
├── react/           # React hooks and components
├── svelte/          # Svelte stores and components
├── vue/             # Vue composables and components
├── solid/           # Solid.js primitives and components
├── core/            # Core functionality
└── rsc/             # React Server Components
```

## Core Concepts

### 1. Providers

```typescript
// lib/providers.ts
import { OpenAIStream, AnthropicStream } from 'ai'

// OpenAI setup
const openaiStream = OpenAIStream(
  await openai.chat.completions.create({
    model: 'gpt-4',
    stream: true,
    messages: []
  })
)

// Anthropic setup
const anthropicStream = AnthropicStream(
  await anthropic.messages.create({
    model: 'claude-2',
    stream: true,
    messages: []
  })
)
```

### 2. Streaming

```typescript
// app/api/chat/route.ts
import { StreamingTextResponse } from 'ai'

export async function POST() {
  // Create a stream
  const stream = OpenAIStream(response)
  
  // Return a StreamingTextResponse
  return new StreamingTextResponse(stream)
}
```

### 3. Hooks and Components

```typescript
// app/chat/page.tsx
'use client'

import { useChat, useCompletion } from 'ai/react'

// Chat interface
function ChatInterface() {
  const { messages, input, handleInputChange, handleSubmit } = useChat()
  return (
    <div>
      {messages.map(m => (
        <div key={m.id}>{m.content}</div>
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

// Completion interface
function CompletionInterface() {
  const {
    completion,
    input,
    handleInputChange,
    handleSubmit
  } = useCompletion()
  
  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Enter a prompt..."
        />
      </form>
      <div>{completion}</div>
    </div>
  )
}
```

## Framework Integration

### 1. React/Next.js

```typescript
// app/page.tsx
import { useChat } from 'ai/react'

export default function ChatPage() {
  const { messages, input, handleInputChange, handleSubmit } = useChat()
  
  return (
    <div>
      {messages.map(m => (
        <div key={m.id}>{m.content}</div>
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

### 2. Svelte

```typescript
// routes/chat/+page.svelte
<script>
  import { createChat } from 'ai/svelte'
  
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit
  } = createChat()
</script>

<div>
  {#each $messages as message}
    <div>{message.content}</div>
  {/each}
  
  <form on:submit={handleSubmit}>
    <input
      value={$input}
      on:change={handleInputChange}
      placeholder="Say something..."
    />
  </form>
</div>
```

### 3. Vue

```typescript
// components/Chat.vue
<script setup>
import { useChat } from 'ai/vue'

const {
  messages,
  input,
  handleInputChange,
  handleSubmit
} = useChat()
</script>

<template>
  <div>
    <div v-for="message in messages" :key="message.id">
      {{ message.content }}
    </div>
    
    <form @submit="handleSubmit">
      <input
        :value="input"
        @input="handleInputChange"
        placeholder="Say something..."
      />
    </form>
  </div>
</template>
```

## Advanced Usage

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

### 2. Error Handling

```typescript
// lib/error-handler.ts
export class AIErrorHandler {
  static handle(error: unknown): string {
    if (error instanceof Error) {
      // Handle specific error types
      if (error.name === 'AbortError') {
        return 'Request was cancelled'
      }
      if (error.message.includes('API key')) {
        return 'Invalid API key'
      }
      return error.message
    }
    return 'An unknown error occurred'
  }
  
  static async withRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    let lastError: Error
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error instanceof Error
          ? error
          : new Error('Unknown error')
        
        if (i === maxRetries - 1) break
        
        // Exponential backoff
        await new Promise(resolve =>
          setTimeout(resolve, Math.pow(2, i) * 1000)
        )
      }
    }
    
    throw lastError!
  }
}
```

### 3. Configuration Management

```typescript
// lib/config-manager.ts
interface AIConfig {
  provider: string
  apiKey: string
  model: string
  temperature?: number
  maxTokens?: number
}

export class ConfigManager {
  private config: AIConfig
  
  constructor(initialConfig: AIConfig) {
    this.config = initialConfig
  }
  
  updateConfig(updates: Partial<AIConfig>) {
    this.config = {
      ...this.config,
      ...updates
    }
  }
  
  getConfig(): AIConfig {
    return { ...this.config }
  }
  
  validateConfig() {
    const { provider, apiKey, model } = this.config
    
    if (!provider) {
      throw new Error('Provider is required')
    }
    
    if (!apiKey) {
      throw new Error('API key is required')
    }
    
    if (!model) {
      throw new Error('Model is required')
    }
  }
}
```

## Best Practices

### 1. Environment Variables

```typescript
// .env.local
OPENAI_API_KEY=your_api_key_here
ANTHROPIC_API_KEY=your_api_key_here
```

```typescript
// lib/env-validator.ts
export function validateEnv() {
  const required = [
    'OPENAI_API_KEY',
    'ANTHROPIC_API_KEY'
  ]
  
  const missing = required.filter(
    key => !process.env[key]
  )
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    )
  }
}
```

### 2. Type Safety

```typescript
// lib/types.ts
export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  createdAt?: Date
}

export interface ChatOptions {
  initialMessages?: Message[]
  onResponse?: (response: string) => void
  onError?: (error: Error) => void
  onFinish?: () => void
}

export interface CompletionOptions {
  temperature?: number
  maxTokens?: number
  model?: string
}
```

### 3. Performance Optimization

```typescript
// lib/optimizations.ts
export class PerformanceOptimizer {
  private static cache = new Map<string, string>()
  
  static cacheResponse(
    key: string,
    response: string,
    ttl: number = 3600000 // 1 hour
  ) {
    this.cache.set(key, response)
    
    // Cleanup after TTL
    setTimeout(() => {
      this.cache.delete(key)
    }, ttl)
  }
  
  static getCachedResponse(key: string): string | undefined {
    return this.cache.get(key)
  }
  
  static clearCache() {
    this.cache.clear()
  }
}
``` 