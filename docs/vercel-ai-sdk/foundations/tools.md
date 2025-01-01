# Tools

## Overview

Learn about tools in the AI SDK and how to use them to extend your AI application's capabilities.

## Introduction

Tools allow AI models to perform actions beyond text generation, such as:
- Searching databases
- Making API calls
- Performing calculations
- Accessing external services

## Basic Usage

### 1. Defining Tools

```typescript
// lib/tools/definitions.ts
export const tools = [
  {
    name: 'search_knowledge_base',
    description: 'Search the knowledge base for relevant information',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query'
        },
        filters: {
          type: 'object',
          description: 'Optional filters for the search',
          properties: {
            category: { type: 'string' },
            date: { type: 'string' }
          }
        }
      },
      required: ['query']
    }
  },
  {
    name: 'create_ticket',
    description: 'Create a support ticket',
    parameters: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Ticket title'
        },
        description: {
          type: 'string',
          description: 'Detailed description of the issue'
        },
        priority: {
          type: 'string',
          enum: ['low', 'medium', 'high'],
          description: 'Ticket priority level'
        }
      },
      required: ['title', 'description']
    }
  }
]
```

### 2. Implementing Tools

```typescript
// lib/tools/implementations.ts
export const toolImplementations = {
  async search_knowledge_base(args: {
    query: string
    filters?: {
      category?: string
      date?: string
    }
  }) {
    // Implement search logic
    const results = await searchDatabase(args.query, args.filters)
    return results
  },

  async create_ticket(args: {
    title: string
    description: string
    priority?: 'low' | 'medium' | 'high'
  }) {
    // Implement ticket creation
    const ticket = await createTicketInSystem(args)
    return ticket
  }
}
```

## Integration

### 1. API Route

```typescript
// app/api/chat/route.ts
import { OpenAIStream, StreamingTextResponse } from 'ai'
import OpenAI from 'openai'
import { tools, toolImplementations } from '@/lib/tools'

export async function POST(req: Request) {
  const { messages } = await req.json()
  
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  })

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    stream: true,
    messages,
    tools,
    tool_choice: 'auto'
  })

  const stream = OpenAIStream(response, {
    async experimental_onFunctionCall(call) {
      // Verify the function exists
      const implementation = toolImplementations[call.name]
      if (!implementation) {
        throw new Error(`Unknown function: ${call.name}`)
      }

      // Parse arguments
      const args = JSON.parse(call.arguments)
      
      // Execute the function
      const result = await implementation(args)
      
      // Return the result to the model
      return JSON.stringify(result)
    }
  })

  return new StreamingTextResponse(stream)
}
```

### 2. React Component

```typescript
// components/AIChat.tsx
import { useChat } from 'ai/react'
import { tools } from '@/lib/tools'

export function AIChat() {
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: '/api/chat',
    initialMessages: [
      {
        role: 'system',
        content: 'You are a helpful AI assistant with access to various tools.'
      }
    ]
  })

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex flex-col space-y-2">
        {messages.map(m => (
          <div key={m.id} className="p-4 rounded bg-gray-100">
            <div className="font-bold">
              {m.role === 'user' ? 'User' : 'AI'}:
            </div>
            <div>{m.content}</div>
            {m.function_call && (
              <div className="mt-2 text-sm text-gray-500">
                Using tool: {m.function_call.name}
              </div>
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex space-x-4">
        <input
          value={input}
          onChange={handleInputChange}
          className="flex-1 p-2 border rounded"
          placeholder="Ask something..."
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Send
        </button>
      </form>
    </div>
  )
}
```

## Advanced Features

### 1. Tool Result Handling

```typescript
// lib/tools/results.ts
export class ToolResultHandler {
  private results: Map<string, any> = new Map()
  
  storeResult(toolName: string, result: any) {
    this.results.set(toolName, result)
  }
  
  getResult(toolName: string) {
    return this.results.get(toolName)
  }
  
  formatForModel(toolName: string): string {
    const result = this.getResult(toolName)
    if (!result) return 'No result available'
    
    // Format based on result type
    if (Array.isArray(result)) {
      return result
        .map((item, index) => `${index + 1}. ${item}`)
        .join('\n')
    }
    
    if (typeof result === 'object') {
      return Object.entries(result)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n')
    }
    
    return String(result)
  }
  
  clear() {
    this.results.clear()
  }
}
```

### 2. Tool Chain Management

```typescript
// lib/tools/chain.ts
export class ToolChain {
  private tools: Map<string, Function> = new Map()
  private resultHandler: ToolResultHandler
  
  constructor(resultHandler: ToolResultHandler) {
    this.resultHandler = resultHandler
  }
  
  addTool(name: string, implementation: Function) {
    this.tools.set(name, implementation)
  }
  
  async execute(
    calls: Array<{
      name: string
      arguments: Record<string, any>
    }>
  ) {
    const results = []
    
    for (const call of calls) {
      const tool = this.tools.get(call.name)
      if (!tool) {
        throw new Error(`Unknown tool: ${call.name}`)
      }
      
      const result = await tool(call.arguments)
      this.resultHandler.storeResult(call.name, result)
      results.push(result)
    }
    
    return results
  }
}
```

### 3. Tool Validation

```typescript
// lib/tools/validation.ts
import { z } from 'zod'

export class ToolValidator {
  private schemas: Map<string, z.ZodSchema> = new Map()
  
  registerSchema(name: string, schema: z.ZodSchema) {
    this.schemas.set(name, schema)
  }
  
  validate(
    toolName: string,
    args: Record<string, any>
  ): Record<string, any> {
    const schema = this.schemas.get(toolName)
    if (!schema) {
      throw new Error(`No schema for tool: ${toolName}`)
    }
    
    return schema.parse(args)
  }
}

// Example schemas
export const toolSchemas = {
  search_knowledge_base: z.object({
    query: z.string().min(1),
    filters: z.object({
      category: z.string().optional(),
      date: z.string().optional()
    }).optional()
  }),
  
  create_ticket: z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    priority: z.enum(['low', 'medium', 'high']).optional()
  })
}
```

## Best Practices

### 1. Error Handling

```typescript
// lib/tools/error-handling.ts
export class ToolError extends Error {
  constructor(
    message: string,
    public toolName: string,
    public args: Record<string, any>
  ) {
    super(message)
    this.name = 'ToolError'
  }
}

export function handleToolError(
  error: unknown,
  toolName: string,
  args: Record<string, any>
): string {
  if (error instanceof ToolError) {
    return `Error executing ${error.toolName}: ${error.message}`
  }
  
  if (error instanceof Error) {
    return `Error: ${error.message}`
  }
  
  return `Unknown error occurred while executing ${toolName}`
}
```

### 2. Logging

```typescript
// lib/tools/logging.ts
export class ToolLogger {
  private logs: Array<{
    timestamp: number
    toolName: string
    args: Record<string, any>
    result?: any
    error?: Error
  }> = []
  
  logExecution(
    toolName: string,
    args: Record<string, any>,
    result?: any,
    error?: Error
  ) {
    this.logs.push({
      timestamp: Date.now(),
      toolName,
      args,
      result,
      error
    })
  }
  
  getExecutionHistory(toolName?: string) {
    return toolName
      ? this.logs.filter(log => log.toolName === toolName)
      : this.logs
  }
  
  clear() {
    this.logs = []
  }
}
```

### 3. Rate Limiting

```typescript
// lib/tools/rate-limiting.ts
export class ToolRateLimiter {
  private limits: Map<string, {
    maxRequests: number
    window: number
    requests: number[]
  }> = new Map()
  
  setLimit(
    toolName: string,
    maxRequests: number,
    windowMs: number
  ) {
    this.limits.set(toolName, {
      maxRequests,
      window: windowMs,
      requests: []
    })
  }
  
  async checkLimit(toolName: string): Promise<boolean> {
    const limit = this.limits.get(toolName)
    if (!limit) return true
    
    const now = Date.now()
    limit.requests = limit.requests.filter(
      time => now - time < limit.window
    )
    
    if (limit.requests.length >= limit.maxRequests) {
      return false
    }
    
    limit.requests.push(now)
    return true
  }
  
  async waitForAvailability(toolName: string): Promise<void> {
    while (!(await this.checkLimit(toolName))) {
      await new Promise(resolve =>
        setTimeout(resolve, 1000)
      )
    }
  }
}
``` 