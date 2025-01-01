# Svelte

## Overview

Learn how to use the Vercel AI SDK with Svelte and SvelteKit.

## Installation

```bash
npm install ai openai@^4.0.0
```

## Basic Setup

### 1. API Route

```typescript
// src/routes/api/chat/+server.ts
import OpenAI from 'openai'
import { OpenAIStream, StreamingTextResponse } from 'ai'
import type { RequestHandler } from './$types'

// Create an OpenAI API client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export const POST: RequestHandler = async ({ request }) => {
  const { messages } = await request.json()

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    stream: true,
    messages
  })

  const stream = OpenAIStream(response)
  return new StreamingTextResponse(stream)
}
```

### 2. Svelte Component

```svelte
<!-- src/routes/chat/+page.svelte -->
<script lang="ts">
  import { createChat } from 'ai/svelte'

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit
  } = createChat()
</script>

<div class="mx-auto w-full max-w-md py-24 flex flex-col stretch">
  {#each $messages as message}
    <div class="whitespace-pre-wrap">
      {message.role === 'user' ? 'User: ' : 'AI: '}
      {message.content}
    </div>
  {/each}

  <form on:submit={handleSubmit}>
    <input
      class="fixed w-full max-w-md bottom-0 border border-gray-300 rounded mb-8 shadow-xl p-2"
      value={$input}
      placeholder="Say something..."
      on:change={handleInputChange}
    />
  </form>
</div>
```

## Advanced Features

### 1. Custom Stream Processing

```typescript
// src/routes/api/chat/+server.ts
import { OpenAIStream, StreamingTextResponse } from 'ai'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
})

export const POST: RequestHandler = async ({ request }) => {
  const { messages } = await request.json()

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
// src/routes/api/chat/+server.ts
import OpenAI from 'openai'
import { OpenAIStream, StreamingTextResponse } from 'ai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
})

export const POST: RequestHandler = async ({ request }) => {
  const { messages } = await request.json()

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

```svelte
<!-- src/lib/components/Chat.svelte -->
<script lang="ts">
  import { createChat } from 'ai/svelte'
  import { onMount } from 'svelte'

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit
  } = createChat()

  let messagesEnd: HTMLDivElement

  // Scroll to bottom when messages change
  $: if (messagesEnd) {
    messagesEnd.scrollIntoView({ behavior: 'smooth' })
  }
</script>

<div class="flex flex-col h-screen">
  <div class="flex-1 overflow-y-auto p-4">
    {#each $messages as message}
      <div
        class="mb-4 {message.role === 'user' ? 'text-right' : 'text-left'}"
      >
        <div
          class="inline-block p-2 rounded-lg {
            message.role === 'user'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200'
          }"
        >
          {message.content}
        </div>
      </div>
    {/each}
    <div bind:this={messagesEnd} />
  </div>

  <form
    on:submit={handleSubmit}
    class="border-t p-4"
  >
    <input
      value={$input}
      on:change={handleInputChange}
      placeholder="Say something..."
      class="w-full p-2 border rounded"
    />
  </form>
</div>
```

### 2. Completion Component

```svelte
<!-- src/lib/components/Completion.svelte -->
<script lang="ts">
  import { createCompletion } from 'ai/svelte'

  const {
    completion,
    input,
    stop,
    isLoading,
    handleInputChange,
    handleSubmit
  } = createCompletion()
</script>

<div class="mx-auto w-full max-w-md py-24 flex flex-col stretch">
  <form on:submit={handleSubmit}>
    <input
      class="w-full max-w-md bottom-0 border border-gray-300 rounded mb-8 shadow-xl p-2"
      value={$input}
      placeholder="Enter a prompt..."
      on:change={handleInputChange}
    />
  </form>

  {#if $isLoading}
    <div class="animate-pulse">
      Generating...
    </div>
  {/if}

  {#if $completion}
    <div class="whitespace-pre-wrap rounded-lg bg-gray-100 p-4">
      {$completion}
    </div>
  {/if}

  {#if $isLoading}
    <button
      on:click={stop}
      class="mt-4 p-2 border rounded hover:bg-gray-100"
    >
      Stop generating
    </button>
  {/if}
</div>
```

## Best Practices

### 1. Error Handling

```typescript
// src/routes/api/chat/+server.ts
import { OpenAIStream, StreamingTextResponse } from 'ai'
import OpenAI from 'openai'
import { error } from '@sveltejs/kit'

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { messages } = await request.json()
    
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
  } catch (e) {
    // Handle specific error types
    if (e instanceof OpenAI.APIError) {
      throw error(e.status, e.message)
    }

    // Handle all other errors
    console.error('Error in chat route:', e)
    throw error(500, 'Internal server error')
  }
}
```

### 2. Rate Limiting

```typescript
// src/lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { error } from '@sveltejs/kit'

export async function rateLimit(ip: string) {
  const ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(5, '60 s')
  })

  const { success } = await ratelimit.limit(ip)
  return success
}

// src/routes/api/chat/+server.ts
import { rateLimit } from '$lib/rate-limit'

export const POST: RequestHandler = async ({ request }) => {
  const ip = request.headers.get('x-forwarded-for')
  const allowed = await rateLimit(ip)

  if (!allowed) {
    throw error(429, 'Too many requests')
  }

  // Continue with normal request handling...
}
```

### 3. Environment Variables

```typescript
// .env
OPENAI_API_KEY=your_api_key_here
UPSTASH_REDIS_REST_URL=your_redis_url_here
UPSTASH_REDIS_REST_TOKEN=your_redis_token_here

// src/lib/env.ts
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

// src/routes/api/chat/+server.ts
import { validateEnv } from '$lib/env'

export const POST: RequestHandler = async ({ request }) => {
  // Validate environment variables before processing request
  validateEnv()
  
  // Continue with normal request handling...
}
``` 