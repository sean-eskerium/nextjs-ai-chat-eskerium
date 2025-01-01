# Tool Calling with Vercel AI SDK

## Overview

Tool calling allows AI models to interact with external functions and services, enabling complex workflows and real-world interactions. This guide covers implementing and managing tool calls using the Vercel AI SDK.

## Basic Implementation

### 1. Tool Definition

```typescript
// lib/tools/definitions.ts
export const tools = [
  {
    type: 'function',
    function: {
      name: 'get_weather',
      description: 'Get the current weather for a location',
      parameters: {
        type: 'object',
        properties: {
          location: {
            type: 'string',
            description: 'City name or coordinates'
          },
          unit: {
            type: 'string',
            enum: ['celsius', 'fahrenheit'],
            default: 'celsius'
          }
        },
        required: ['location']
      }
    }
  }
]
```

### 2. Tool Implementation

```typescript
// lib/tools/weather.ts
export async function getWeather(params: {
  location: string
  unit?: 'celsius' | 'fahrenheit'
}) {
  const response = await fetch(
    `https://api.weather.com/${params.location}?unit=${params.unit}`
  )
  return response.json()
}

export const toolMap = {
  get_weather: getWeather
}
```

### 3. API Route Setup

```typescript
// app/api/chat/route.ts
import { OpenAIStream, StreamingTextResponse } from 'ai'
import OpenAI from 'openai'
import { tools, toolMap } from '@/lib/tools'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(req: Request) {
  const { messages } = await req.json()
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    stream: true,
    messages,
    tools,
    tool_choice: 'auto'
  })

  const stream = OpenAIStream(response, {
    async experimental_onToolCall(toolCall) {
      const tool = toolMap[toolCall.function.name]
      if (!tool) throw new Error('Tool not found')
      
      const result = await tool(
        JSON.parse(toolCall.function.arguments)
      )
      
      return JSON.stringify(result)
    }
  })

  return new StreamingTextResponse(stream)
}
```

## Advanced Features

### 1. Multiple Tool Calls

```typescript
// lib/tools/chain.ts
export async function handleToolChain(toolCalls: Array<ToolCall>) {
  const results = await Promise.all(
    toolCalls.map(async (toolCall) => {
      const tool = toolMap[toolCall.function.name]
      const result = await tool(JSON.parse(toolCall.function.arguments))
      return {
        tool_call_id: toolCall.id,
        output: JSON.stringify(result)
      }
    })
  )
  return results
}
```

### 2. Tool Call Validation

```typescript
// lib/tools/validation.ts
import { z } from 'zod'

const WeatherParams = z.object({
  location: z.string(),
  unit: z.enum(['celsius', 'fahrenheit']).default('celsius')
})

export function validateToolParams(
  name: string,
  params: unknown
) {
  switch (name) {
    case 'get_weather':
      return WeatherParams.parse(params)
    default:
      throw new Error(`Unknown tool: ${name}`)
  }
}
```

### 3. Error Handling

```typescript
// lib/tools/error-handling.ts
export async function safeToolExecution(
  toolCall: ToolCall
) {
  try {
    const tool = toolMap[toolCall.function.name]
    if (!tool) {
      throw new Error(`Tool ${toolCall.function.name} not found`)
    }

    const params = validateToolParams(
      toolCall.function.name,
      JSON.parse(toolCall.function.arguments)
    )

    const result = await tool(params)
    return {
      success: true,
      data: result
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}
```

## Best Practices

### 1. Tool Design Guidelines

1. **Clear Naming**
   - Use descriptive function names
   - Follow consistent naming conventions
   - Document purpose clearly

2. **Parameter Design**
   - Use strict typing
   - Provide default values
   - Include parameter descriptions

3. **Error Handling**
   - Validate inputs
   - Handle edge cases
   - Provide meaningful errors

### 2. Performance Optimization

```typescript
// lib/tools/cache.ts
import { LRUCache } from 'lru-cache'

const toolCache = new LRUCache({
  max: 500,
  ttl: 1000 * 60 * 5 // 5 minutes
})

export async function cachedToolCall(
  name: string,
  params: unknown
) {
  const key = `${name}:${JSON.stringify(params)}`
  
  if (toolCache.has(key)) {
    return toolCache.get(key)
  }
  
  const result = await toolMap[name](params)
  toolCache.set(key, result)
  return result
}
```

### 3. Security Considerations

```typescript
// lib/tools/security.ts
export function validateToolPermissions(
  toolName: string,
  user: User
) {
  const toolPermissions = {
    get_weather: ['user', 'admin'],
    sensitive_operation: ['admin']
  }
  
  const requiredRole = toolPermissions[toolName]
  if (!requiredRole?.includes(user.role)) {
    throw new Error('Unauthorized tool access')
  }
}
```

## Integration Examples

### 1. Database Operations

```typescript
// lib/tools/database.ts
export const databaseTools = {
  type: 'function',
  function: {
    name: 'query_database',
    description: 'Query the database for information',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'SQL query to execute'
        },
        params: {
          type: 'array',
          items: {
            type: 'string'
          },
          description: 'Query parameters'
        }
      },
      required: ['query']
    }
  }
}
```

### 2. External API Integration

```typescript
// lib/tools/api-integration.ts
export const apiTools = {
  type: 'function',
  function: {
    name: 'call_external_api',
    description: 'Make calls to external APIs',
    parameters: {
      type: 'object',
      properties: {
        endpoint: {
          type: 'string',
          description: 'API endpoint'
        },
        method: {
          type: 'string',
          enum: ['GET', 'POST', 'PUT', 'DELETE']
        },
        body: {
          type: 'object',
          description: 'Request body'
        }
      },
      required: ['endpoint', 'method']
    }
  }
}
```

### 3. File Operations

```typescript
// lib/tools/file-operations.ts
export const fileTools = {
  type: 'function',
  function: {
    name: 'process_file',
    description: 'Process uploaded files',
    parameters: {
      type: 'object',
      properties: {
        fileId: {
          type: 'string',
          description: 'ID of the uploaded file'
        },
        operation: {
          type: 'string',
          enum: ['read', 'analyze', 'transform']
        }
      },
      required: ['fileId', 'operation']
    }
  }
}
``` 