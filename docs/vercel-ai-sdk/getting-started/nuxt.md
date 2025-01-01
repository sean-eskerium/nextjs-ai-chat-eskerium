# Nuxt

## Overview

Learn how to use the Vercel AI SDK with Nuxt.

## Installation

```bash
npm install ai openai@^4.0.0
```

## Basic Setup

### 1. API Route

```typescript
// server/api/chat.ts
import OpenAI from 'openai'
import { OpenAIStream, StreamingTextResponse } from 'ai'

// Create an OpenAI API client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export default defineEventHandler(async (event) => {
  const { messages } = await readBody(event)

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    stream: true,
    messages
  })

  const stream = OpenAIStream(response)
  return new StreamingTextResponse(stream)
})
```

### 2. Vue Component

```vue
<!-- pages/chat.vue -->
<script setup lang="ts">
import { useChat } from 'ai/vue'

const { messages, input, handleInputChange, handleSubmit } = useChat()
</script>

<template>
  <div class="mx-auto w-full max-w-md py-24 flex flex-col stretch">
    <div v-for="m in messages" :key="m.id" class="whitespace-pre-wrap">
      {{ m.role === 'user' ? 'User: ' : 'AI: ' }}
      {{ m.content }}
    </div>

    <form @submit="handleSubmit">
      <input
        class="fixed w-full max-w-md bottom-0 border border-gray-300 rounded mb-8 shadow-xl p-2"
        :value="input"
        placeholder="Say something..."
        @input="handleInputChange"
      />
    </form>
  </div>
</template>
```

## Advanced Features

### 1. Custom Stream Processing

```typescript
// server/api/chat.ts
import { OpenAIStream, StreamingTextResponse } from 'ai'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
})

export default defineEventHandler(async (event) => {
  const { messages } = await readBody(event)

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
})
```

### 2. Function Calling

```typescript
// server/api/chat.ts
import OpenAI from 'openai'
import { OpenAIStream, StreamingTextResponse } from 'ai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
})

export default defineEventHandler(async (event) => {
  const { messages } = await readBody(event)

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
})
```

## UI Components

### 1. Chat Component

```vue
<!-- components/Chat.vue -->
<script setup lang="ts">
import { useChat } from 'ai/vue'
import { ref, watch } from 'vue'

const { messages, input, handleInputChange, handleSubmit } = useChat()
const messagesEnd = ref<HTMLDivElement>()

// Scroll to bottom when messages change
watch(messages, () => {
  messagesEnd.value?.scrollIntoView({ behavior: 'smooth' })
})
</script>

<template>
  <div class="flex flex-col h-screen">
    <div class="flex-1 overflow-y-auto p-4">
      <div
        v-for="m in messages"
        :key="m.id"
        :class="[
          'mb-4',
          m.role === 'user' ? 'text-right' : 'text-left'
        ]"
      >
        <div
          :class="[
            'inline-block p-2 rounded-lg',
            m.role === 'user'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200'
          ]"
        >
          {{ m.content }}
        </div>
      </div>
      <div ref="messagesEnd" />
    </div>

    <form
      @submit="handleSubmit"
      class="border-t p-4"
    >
      <input
        :value="input"
        @input="handleInputChange"
        placeholder="Say something..."
        class="w-full p-2 border rounded"
      />
    </form>
  </div>
</template>
```

### 2. Completion Component

```vue
<!-- components/Completion.vue -->
<script setup lang="ts">
import { useCompletion } from 'ai/vue'

const {
  completion,
  input,
  stop,
  isLoading,
  handleInputChange,
  handleSubmit
} = useCompletion()
</script>

<template>
  <div class="mx-auto w-full max-w-md py-24 flex flex-col stretch">
    <form @submit="handleSubmit">
      <input
        class="w-full max-w-md bottom-0 border border-gray-300 rounded mb-8 shadow-xl p-2"
        :value="input"
        placeholder="Enter a prompt..."
        @input="handleInputChange"
      />
    </form>

    <div v-if="isLoading" class="animate-pulse">
      Generating...
    </div>

    <div
      v-if="completion"
      class="whitespace-pre-wrap rounded-lg bg-gray-100 p-4"
    >
      {{ completion }}
    </div>

    <button
      v-if="isLoading"
      @click="stop"
      class="mt-4 p-2 border rounded hover:bg-gray-100"
    >
      Stop generating
    </button>
  </div>
</template>
```

## Best Practices

### 1. Error Handling

```typescript
// server/api/chat.ts
import { OpenAIStream, StreamingTextResponse } from 'ai'
import OpenAI from 'openai'
import { createError } from 'h3'

export default defineEventHandler(async (event) => {
  try {
    const { messages } = await readBody(event)
    
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
      throw createError({
        statusCode: error.status,
        message: error.message
      })
    }

    // Handle all other errors
    console.error('Error in chat route:', error)
    throw createError({
      statusCode: 500,
      message: 'Internal server error'
    })
  }
})
```

### 2. Rate Limiting

```typescript
// server/utils/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { createError } from 'h3'

export async function rateLimit(ip: string) {
  const ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(5, '60 s')
  })

  const { success } = await ratelimit.limit(ip)
  return success
}

// server/api/chat.ts
import { rateLimit } from '../utils/rate-limit'

export default defineEventHandler(async (event) => {
  const ip = getRequestHeader(event, 'x-forwarded-for')
  const allowed = await rateLimit(ip)

  if (!allowed) {
    throw createError({
      statusCode: 429,
      message: 'Too many requests'
    })
  }

  // Continue with normal request handling...
})
```

### 3. Environment Variables

```typescript
// .env
OPENAI_API_KEY=your_api_key_here
UPSTASH_REDIS_REST_URL=your_redis_url_here
UPSTASH_REDIS_REST_TOKEN=your_redis_token_here

// server/utils/env.ts
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

// server/api/chat.ts
import { validateEnv } from '../utils/env'

export default defineEventHandler(async (event) => {
  // Validate environment variables before processing request
  validateEnv()
  
  // Continue with normal request handling...
})
``` 