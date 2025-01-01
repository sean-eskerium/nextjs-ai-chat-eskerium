# Chatbot with Tools Implementation

## Overview

This guide covers implementing a chatbot that can use tools (function calling) to perform actions, integrate with external services, and handle complex workflows using the Vercel AI SDK.

## Basic Implementation

### 1. Tool Definitions

```typescript
// lib/tools/definitions.ts
export const chatTools = [
  {
    type: 'function',
    function: {
      name: 'search_knowledge_base',
      description: 'Search the knowledge base for relevant information',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query'
          },
          filters: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              date: { type: 'string' }
            }
          }
        },
        required: ['query']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_ticket',
      description: 'Create a support ticket',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          priority: {
            type: 'string',
            enum: ['low', 'medium', 'high']
          }
        },
        required: ['title', 'description']
      }
    }
  }
]
```

### 2. Tool Implementations

```typescript
// lib/tools/implementations.ts
export const toolImplementations = {
  search_knowledge_base: async (params: {
    query: string
    filters?: {
      category?: string
      date?: string
    }
  }) => {
    // Implement knowledge base search
    const results = await searchKnowledgeBase(params)
    return results
  },

  create_ticket: async (params: {
    title: string
    description: string
    priority?: 'low' | 'medium' | 'high'
  }) => {
    // Implement ticket creation
    const ticket = await createTicket(params)
    return ticket
  }
}
```

### 3. Chat Component

```typescript
// components/chat/ToolEnabledChat.tsx
import { useChat } from 'ai/react'
import { chatTools } from '@/lib/tools/definitions'

export function ToolEnabledChat() {
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error
  } = useChat({
    api: '/api/chat',
    body: {
      tools: chatTools
    }
  })

  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map(message => (
          <ChatMessage
            key={message.id}
            message={message}
          />
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="How can I help?"
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading}>
          Send
        </button>
      </form>
    </div>
  )
}
```

### 4. Message Display

```typescript
// components/chat/ChatMessage.tsx
import { Message } from 'ai'

interface ChatMessageProps {
  message: Message
}

export function ChatMessage({ message }: ChatMessageProps) {
  return (
    <div className={`message ${message.role}`}>
      {message.content && (
        <div className="content">{message.content}</div>
      )}
      
      {message.function_call && (
        <div className="function-call">
          <div className="name">
            {message.function_call.name}
          </div>
          <pre className="arguments">
            {JSON.stringify(
              JSON.parse(message.function_call.arguments),
              null,
              2
            )}
          </pre>
        </div>
      )}
    </div>
  )
}
```

## Advanced Features

### 1. Tool Result Display

```typescript
// components/chat/ToolResult.tsx
interface ToolResultProps {
  name: string
  result: unknown
}

export function ToolResult({
  name,
  result
}: ToolResultProps) {
  const renderResult = () => {
    switch (name) {
      case 'search_knowledge_base':
        return (
          <div className="search-results">
            {result.map((item: any) => (
              <SearchResult
                key={item.id}
                result={item}
              />
            ))}
          </div>
        )
      
      case 'create_ticket':
        return (
          <div className="ticket-info">
            <h4>Ticket Created</h4>
            <p>ID: {result.id}</p>
            <p>Status: {result.status}</p>
          </div>
        )
      
      default:
        return (
          <pre>
            {JSON.stringify(result, null, 2)}
          </pre>
        )
    }
  }

  return (
    <div className="tool-result">
      <div className="tool-name">{name}</div>
      {renderResult()}
    </div>
  )
}
```

### 2. Tool Execution Tracking

```typescript
// components/chat/ToolExecution.tsx
import { useState } from 'react'

export function ToolExecution({
  name,
  args,
  onComplete
}: {
  name: string
  args: unknown
  onComplete: (result: unknown) => void
}) {
  const [status, setStatus] = useState<
    'pending' | 'running' | 'complete' | 'error'
  >('pending')

  useEffect(() => {
    const executeFunction = async () => {
      try {
        setStatus('running')
        const result = await toolImplementations[name](args)
        setStatus('complete')
        onComplete(result)
      } catch (error) {
        setStatus('error')
        console.error(`Tool execution failed: ${error}`)
      }
    }

    executeFunction()
  }, [name, args, onComplete])

  return (
    <div className="tool-execution">
      <div className="status">{status}</div>
      {status === 'running' && (
        <div className="loading-indicator" />
      )}
    </div>
  )
}
```

### 3. Tool Selection UI

```typescript
// components/chat/ToolSelector.tsx
export function ToolSelector({
  tools,
  onSelect
}: {
  tools: Tool[]
  onSelect: (tool: Tool) => void
}) {
  return (
    <div className="tool-selector">
      <h3>Available Tools</h3>
      <div className="tools-list">
        {tools.map(tool => (
          <button
            key={tool.function.name}
            onClick={() => onSelect(tool)}
            className="tool-button"
          >
            <div className="name">
              {tool.function.name}
            </div>
            <div className="description">
              {tool.function.description}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
```

## Integration with API

### 1. API Route

```typescript
// app/api/chat/route.ts
import { OpenAIStream, StreamingTextResponse } from 'ai'
import OpenAI from 'openai'
import { chatTools, toolImplementations } from '@/lib/tools'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(req: Request) {
  const { messages, tools } = await req.json()

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    stream: true,
    messages,
    tools,
    tool_choice: 'auto'
  })

  const stream = OpenAIStream(response, {
    async experimental_onToolCall(toolCall) {
      const implementation = 
        toolImplementations[toolCall.function.name]
      
      if (!implementation) {
        throw new Error(`Tool not found: ${toolCall.function.name}`)
      }

      const result = await implementation(
        JSON.parse(toolCall.function.arguments)
      )

      return JSON.stringify(result)
    }
  })

  return new StreamingTextResponse(stream)
}
```

### 2. Middleware

```typescript
// middleware/tool-validation.ts
import { z } from 'zod'

const ToolCallSchema = z.object({
  name: z.string(),
  arguments: z.string()
})

export async function validateToolCall(
  toolCall: unknown
) {
  const result = ToolCallSchema.safeParse(toolCall)
  
  if (!result.success) {
    throw new Error(
      `Invalid tool call: ${result.error.message}`
    )
  }

  return result.data
}
```

## Styling

### 1. Tool-Specific Styles

```css
/* styles/tools.css */
.tool-result {
  margin: 1rem 0;
  padding: 1rem;
  border-radius: 0.5rem;
  background: var(--tool-bg);
}

.tool-execution {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.tool-selector {
  border-top: 1px solid var(--border-color);
  padding-top: 1rem;
  margin-top: 1rem;
}

.tool-button {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.75rem;
  border-radius: 0.375rem;
  background: var(--tool-button-bg);
  cursor: pointer;
}
```

### 2. Theme Integration

```typescript
// styles/theme.ts
export const toolTheme = {
  light: {
    '--tool-bg': '#f3f4f6',
    '--tool-button-bg': '#ffffff',
    '--border-color': '#e5e7eb'
  },
  dark: {
    '--tool-bg': '#1f2937',
    '--tool-button-bg': '#374151',
    '--border-color': '#4b5563'
  }
}
``` 