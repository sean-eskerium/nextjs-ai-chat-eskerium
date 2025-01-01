# Get Started with OpenAI

## Overview

Learn how to integrate OpenAI's models with the Vercel AI SDK. This guide covers setting up and using OpenAI's GPT models in your Next.js application.

## Setup

### 1. Installation

```bash
npm install ai openai@^4.0.0
```

### 2. Environment Configuration

```bash
# .env.local
OPENAI_API_KEY=your_openai_api_key
```

## Implementation

### 1. API Route

```typescript
// app/api/chat/route.ts
import OpenAI from 'openai'
import { OpenAIStream, StreamingTextResponse } from 'ai'

// Create an OpenAI API client (that's edge friendly!)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
})

// IMPORTANT! Set the runtime to edge
export const runtime = 'edge'

export async function POST(req: Request) {
  const { messages } = await req.json()

  // Ask OpenAI for a streaming chat completion
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    stream: true,
    messages
  })

  // Convert the response into a friendly text-stream
  const stream = OpenAIStream(response)

  // Respond with the stream
  return new StreamingTextResponse(stream)
}
```

### 2. Chat Component

```typescript
// app/page.tsx
'use client'

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

### 1. Function Calling

```typescript
// app/api/chat/route.ts
export async function POST(req: Request) {
  const { messages } = await req.json()

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    stream: true,
    messages,
    functions: [
      {
        name: 'get_weather',
        description: 'Get the current weather',
        parameters: {
          type: 'object',
          properties: {
            location: {
              type: 'string',
              description: 'The location to get weather for'
            }
          },
          required: ['location']
        }
      }
    ]
  })

  const stream = OpenAIStream(response, {
    async experimental_onFunctionCall(functionCall) {
      // Call your function here
      const result = await getWeather(functionCall.arguments.location)
      return JSON.stringify(result)
    }
  })

  return new StreamingTextResponse(stream)
}
```

### 2. System Messages

```typescript
// app/api/chat/route.ts
export async function POST(req: Request) {
  const { messages } = await req.json()

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    stream: true,
    messages: [
      {
        role: 'system',
        content: 'You are a helpful AI assistant that specializes in coding.'
      },
      ...messages
    ]
  })

  const stream = OpenAIStream(response)
  return new StreamingTextResponse(stream)
}
```

## Best Practices

1. **API Key Management**
   - Never expose API keys in client-side code
   - Use environment variables
   - Implement proper key rotation

2. **Error Handling**
   ```typescript
   try {
     const response = await openai.chat.completions.create({
       model: 'gpt-4',
       stream: true,
       messages
     })
   } catch (error) {
     if (error instanceof OpenAI.APIError) {
       console.error('OpenAI API error:', error)
       return new Response(
         JSON.stringify({ error: error.message }),
         { status: error.status }
       )
     }
     throw error
   }
   ```

3. **Rate Limiting**
   ```typescript
   import { Ratelimit } from '@upstash/ratelimit'
   import { Redis } from '@upstash/redis'

   const ratelimit = new Ratelimit({
     redis: Redis.fromEnv(),
     limiter: Ratelimit.slidingWindow(5, '60 s')
   })

   // In your API route
   const { success } = await ratelimit.limit('api_key')
   if (!success) {
     return new Response('Too Many Requests', { status: 429 })
   }
   ```

## Model Selection

Choose the appropriate model based on your needs:

1. **GPT-4**
   - Most capable model
   - Best for complex tasks
   - Higher latency and cost

2. **GPT-3.5-Turbo**
   - Fast and cost-effective
   - Good for most use cases
   - Lower latency

```typescript
const modelConfig = {
  gpt4: {
    model: 'gpt-4',
    temperature: 0.7,
    max_tokens: 500
  },
  gpt35: {
    model: 'gpt-3.5-turbo',
    temperature: 0.9,
    max_tokens: 1000
  }
}
```

## Security Considerations

1. **Input Validation**
   ```typescript
   function validateInput(messages: any[]) {
     if (!Array.isArray(messages)) {
       throw new Error('Messages must be an array')
     }
     
     return messages.map(m => ({
       role: m.role,
       content: String(m.content).slice(0, 4096)
     }))
   }
   ```

2. **Content Filtering**
   ```typescript
   const response = await openai.chat.completions.create({
     model: 'gpt-4',
     stream: true,
     messages,
     temperature: 0.7,
     max_tokens: 500,
     user: userId, // For tracking abuse
     // Enable content filtering
     safe_mode: true
   })
   ```

3. **Usage Monitoring**
   ```typescript
   const response = await openai.chat.completions.create({
     model: 'gpt-4',
     stream: true,
     messages,
     user: userId
   })

   // Log usage
   await logUsage({
     userId,
     model: 'gpt-4',
     timestamp: new Date(),
     promptTokens: response.usage?.prompt_tokens,
     completionTokens: response.usage?.completion_tokens
   })
   ``` 