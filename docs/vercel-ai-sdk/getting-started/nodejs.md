# Node.js

## Overview

Learn how to use the Vercel AI SDK with Node.js.

## Installation

```bash
npm install ai openai@^4.0.0
```

## Basic Setup

### 1. Express Server

```typescript
// server.ts
import express from 'express'
import OpenAI from 'openai'
import { OpenAIStream, StreamingTextResponse } from 'ai'

const app = express()
app.use(express.json())

// Create an OpenAI API client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

app.post('/api/chat', async (req, res) => {
  const { messages } = req.body

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    stream: true,
    messages
  })

  const stream = OpenAIStream(response)
  return new StreamingTextResponse(stream)
})

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000')
})
```

### 2. Fastify Server

```typescript
// server.ts
import Fastify from 'fastify'
import OpenAI from 'openai'
import { OpenAIStream, StreamingTextResponse } from 'ai'

const fastify = Fastify({
  logger: true
})

// Create an OpenAI API client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

fastify.post('/api/chat', async (request, reply) => {
  const { messages } = request.body as { messages: any[] }

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    stream: true,
    messages
  })

  const stream = OpenAIStream(response)
  return new StreamingTextResponse(stream)
})

fastify.listen({ port: 3000 }, (err) => {
  if (err) throw err
  console.log('Server running on http://localhost:3000')
})
```

## Advanced Features

### 1. Custom Stream Processing

```typescript
// server.ts
import express from 'express'
import OpenAI from 'openai'
import { OpenAIStream, StreamingTextResponse } from 'ai'

const app = express()
app.use(express.json())

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
})

app.post('/api/chat', async (req, res) => {
  const { messages } = req.body

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
// server.ts
import express from 'express'
import OpenAI from 'openai'
import { OpenAIStream, StreamingTextResponse } from 'ai'

const app = express()
app.use(express.json())

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
})

app.post('/api/chat', async (req, res) => {
  const { messages } = req.body

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

## Best Practices

### 1. Error Handling

```typescript
// server.ts
import express from 'express'
import OpenAI from 'openai'
import { OpenAIStream, StreamingTextResponse } from 'ai'

const app = express()
app.use(express.json())

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body

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
      return res.status(error.status).json({
        error: error.message
      })
    }

    // Handle all other errors
    console.error('Error in chat route:', error)
    return res.status(500).json({
      error: 'Internal server error'
    })
  }
})
```

### 2. Rate Limiting

```typescript
// middleware/rate-limit.ts
import rateLimit from 'express-rate-limit'
import slowDown from 'express-slow-down'

export const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5 // 5 requests per minute
})

export const speedLimiter = slowDown({
  windowMs: 60 * 1000, // 1 minute
  delayAfter: 3, // allow 3 requests per minute at full speed
  delayMs: 500 // add 500ms of delay per request above 3
})

// server.ts
import { limiter, speedLimiter } from './middleware/rate-limit'

app.use('/api/chat', limiter)
app.use('/api/chat', speedLimiter)
```

### 3. Environment Variables

```typescript
// .env
OPENAI_API_KEY=your_api_key_here

// utils/env.ts
export function validateEnv() {
  const required = [
    'OPENAI_API_KEY'
  ]

  for (const name of required) {
    if (!process.env[name]) {
      throw new Error(`Missing required environment variable: ${name}`)
    }
  }
}

// server.ts
import { validateEnv } from './utils/env'

// Validate environment variables before starting server
validateEnv()
```

### 4. Logging

```typescript
// utils/logger.ts
import winston from 'winston'

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: 'error.log',
      level: 'error'
    }),
    new winston.transports.File({
      filename: 'combined.log'
    })
  ]
})

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }))
}

// server.ts
import { logger } from './utils/logger'

app.post('/api/chat', async (req, res) => {
  try {
    logger.info('Processing chat request', {
      ip: req.ip,
      userAgent: req.headers['user-agent']
    })

    // ... handle request ...

    logger.info('Chat request completed successfully')
  } catch (error) {
    logger.error('Error processing chat request', {
      error: error.message,
      stack: error.stack
    })
    // ... handle error ...
  }
})
```

### 5. Security

```typescript
// middleware/security.ts
import helmet from 'helmet'
import cors from 'cors'

export const securityMiddleware = [
  helmet(), // Add security headers
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    methods: ['POST'],
    allowedHeaders: ['Content-Type']
  })
]

// server.ts
import { securityMiddleware } from './middleware/security'

app.use(securityMiddleware)
```

### 6. Request Validation

```typescript
// middleware/validation.ts
import { z } from 'zod'

const messageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string()
})

const chatRequestSchema = z.object({
  messages: z.array(messageSchema)
})

export function validateChatRequest(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    chatRequestSchema.parse(req.body)
    next()
  } catch (error) {
    res.status(400).json({
      error: 'Invalid request body',
      details: error.errors
    })
  }
}

// server.ts
import { validateChatRequest } from './middleware/validation'

app.post('/api/chat', validateChatRequest, async (req, res) => {
  // Request body is now validated
  const { messages } = req.body
  // ... handle request ...
})
``` 